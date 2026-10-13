import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

/* -------------------------------------------------------------------------- */
/*  Rig state shared between the HUD (DOM) and the camera (inside <Canvas>).   */
/*  React context does not cross the R3F reconciler boundary, so the scene      */
/*  passes the rig down to <CameraController rig={rig} /> as a prop.            */
/* -------------------------------------------------------------------------- */

const CameraRigContext = createContext(null);

export function CameraRigProvider({ initialSection = 'home', children }) {
  const [section, setSection] = useState(initialSection);
  const [settled, setSettled] = useState(false);
  const [roaming, setRoaming] = useState(false);
  const goToRef = useRef(null);
  /** Survives CameraController unmount so the orbit resumes after a walk. */
  const hasRoamed = useRef(false);

  const goTo = useCallback((id) => goToRef.current?.(id), []);
  const value = useMemo(
    () => ({ section, settled, setSection, setSettled, goTo, goToRef, roaming, setRoaming, hasRoamed }),
    [section, settled, goTo, roaming],
  );

  return <CameraRigContext.Provider value={value}>{children}</CameraRigContext.Provider>;
}

export function useCameraRig() {
  const rig = useContext(CameraRigContext);
  if (!rig) throw new Error('useCameraRig must be used within CameraRigProvider');
  return rig;
}

/* -------------------------------------------------------------------------- */
/*  Camera controller                                                           */
/* -------------------------------------------------------------------------- */

const SETTLE_DELAY = 0.25;
const CLEARANCE = 0.5; // metres kept between the camera and any surface (near plane is 0.1)
// Open courtyard, used only when the straight line between two shots hits geometry.
const COURTYARD = new THREE.Vector3(63, 0, -95);

/** Position on the orbit circle for an angle (Math.sin / Math.cos). */
function orbitPosition(out, orbit, angle) {
  return out.set(
    orbit.center.x + Math.sin(angle) * orbit.radius,
    orbit.center.y + orbit.height,
    orbit.center.z + Math.cos(angle) * orbit.radius,
  );
}

/**
 * sections: { [id]: { center: Vector3, radius, height, angle, arc, speed } }
 *   center  - point the camera looks at / orbits around (agent chest height)
 *   radius  - orbit radius in metres
 *   height  - camera height above `center`
 *   angle   - arrival angle in radians (0 = +Z side of the subject)
 *   arc     - half-width of the orbit sweep (radians) so it never clips walls
 *   speed   - orbit speed (radians of phase per second)
 */
export default function CameraController({ sections, rig, enabled = true, getCollider }) {
  const { camera, clock } = useThree();
  const { setSection, setSettled, goToRef } = rig;

  // Dummy look target - camera.lookAt(lookAtTarget) runs every frame.
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const runtime = useRef({ timeline: null, orbit: null, orbitStart: 0, lastSafe: new THREE.Vector3(), hasSafe: false });
  const caster = useMemo(() => {
    const raycaster = new THREE.Raycaster();
    raycaster.firstHitOnly = true;
    return raycaster;
  }, []);
  const sweep = useMemo(() => ({ dir: new THREE.Vector3(), from: new THREE.Vector3(), to: new THREE.Vector3() }), []);
  const colliderRef = useRef(getCollider);
  colliderRef.current = getCollider;
  const clearanceRay = useMemo(() => new THREE.Raycaster(), []);

  /** True when the segment crosses map geometry, checked from both ends. */
  const segmentBlocked = useCallback((from, to) => {
    const collider = colliderRef.current?.();
    if (!collider) return false;
    const delta = sweep.dir.copy(to).sub(from);
    const length = delta.length();
    if (length < 0.05) return false;
    delta.divideScalar(length);
    clearanceRay.set(from, delta);
    clearanceRay.near = 0;
    clearanceRay.far = length;
    if (clearanceRay.intersectObject(collider, true).length > 0) return true;
    clearanceRay.set(to, delta.negate());
    clearanceRay.far = length;
    return clearanceRay.intersectObject(collider, true).length > 0;
  }, [clearanceRay, sweep]);

  /**
   * One eased flight from the current shot to the next. Height only changes
   * between the two cameras — the path does not climb over the roofs and drop
   * back down. A bend through the courtyard is used only when the straight
   * line would hit the map, and the look target eases the whole way.
   */
  const moveToSection = useCallback(
    (targetPos, targetLookAt, { orbit = null, onArrive } = {}) => {
      const rt = runtime.current;
      rt.timeline?.kill();
      rt.orbit = null;

      const start = camera.position.clone();
      const startLook = lookAtTarget.clone();
      const end = targetPos.clone();
      const endLook = targetLookAt.clone();
      const y = Math.max(start.y, end.y);
      const candidates = [
        new THREE.Vector3(COURTYARD.x, y, COURTYARD.z),
        new THREE.Vector3(58, y, -90),
        new THREE.Vector3(68, y, -90),
        new THREE.Vector3(60, y, -100),
        new THREE.Vector3(66, y, -88),
      ];
      const via = segmentBlocked(start, end)
        ? candidates.find((point) => !segmentBlocked(start, point) && !segmentBlocked(point, end)) ?? null
        : null;

      const distance = via ? start.distanceTo(via) + via.distanceTo(end) : start.distanceTo(end);
      const duration = THREE.MathUtils.clamp(distance / 11, 1.15, 2.2);
      const points = via ? [start, via, end] : [start, end];
      const proxy = { t: 0 };

      const timeline = gsap.timeline({
        onComplete: () => {
          rt.orbit = orbit;
          rt.orbitStart = clock.elapsedTime;
          onArrive?.();
        },
      });
      timeline.to(proxy, {
        t: 1,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          const t = proxy.t;
          const span = points.length - 1;
          const scaled = Math.min(span - 0.0001, t * span);
          const index = Math.floor(scaled);
          camera.position.lerpVectors(points[index], points[index + 1], scaled - index);
          lookAtTarget.lerpVectors(startLook, endLook, t);
        },
      });

      rt.timeline = timeline;
      return timeline;
    },
    [camera, clock, lookAtTarget, segmentBlocked],
  );

  const goToSection = useCallback(
    (id) => {
      const orbit = sections[id];
      if (!orbit) return;
      setSection(id);
      setSettled(false);
      const target = orbitPosition(new THREE.Vector3(), orbit, orbit.angle);
      moveToSection(target, orbit.center, {
        orbit,
        onArrive: () => {
          gsap.delayedCall(SETTLE_DELAY, () => {
            if (runtime.current.orbit === orbit) setSettled(true);
          });
        },
      });
    },
    [sections, moveToSection, setSection, setSettled],
  );

  useEffect(() => {
    goToRef.current = goToSection;
    return () => {
      if (goToRef.current === goToSection) goToRef.current = null;
    };
  }, [goToRef, goToSection]);

  // Once only. Re-running this when goToSection's identity changes yanks the
  // camera back to the overview in the middle of a later move.
  const booted = useRef(false);
  const resumeOrbit = rig.hasRoamed.current ? (sections[rig.section] ?? sections.home) : null;
  if (resumeOrbit && !booted.current) lookAtTarget.copy(resumeOrbit.center);
  useEffect(() => {
    if (!enabled || booted.current) return;
    booted.current = true;
    // Returning from free roam: glide from the player's feet back to this section.
    if (rig.hasRoamed.current) {
      const orbit = sections[rig.section] ?? sections.home;
      lookAtTarget.copy(orbit.center);
      goToSection(sections[rig.section] ? rig.section : 'home');
      return;
    }
    const home = sections.home;
    camera.position.set(home.center.x, home.center.y + 60, home.center.z + home.radius * 1.4);
    lookAtTarget.copy(home.center);
    goToSection('home');
  }, [enabled, sections, camera, lookAtTarget, goToSection]);

  useEffect(() => {
    // Test hook: window.__cameraStats.blocked counts frames the collision guard intervened.
    window.__cameraStats = runtime.current;
    return () => {
      delete window.__cameraStats;
    };
  }, []);

  useEffect(() => {
    const rt = runtime.current;
    // Keep flights wall-clock accurate even if a frame hitches (shader compiles,
    // slow GPUs) instead of GSAP stretching them out.
    gsap.ticker.lagSmoothing(0);
    return () => {
      rt.timeline?.kill();
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

  useFrame(() => {
    const rt = runtime.current;
    const orbit = rt.orbit;
    if (orbit) {
      const t = clock.elapsedTime - rt.orbitStart;
      // Ease into the sweep so the hand-off from the GSAP timeline has no pop.
      const ramp = 1 - Math.exp(-t * 1.4);
      const angle = orbit.angle + Math.sin(t * orbit.speed) * orbit.arc * ramp;
      orbitPosition(scratch, orbit, angle);
      scratch.y += Math.sin(t * 0.55) * 0.12 * ramp;
      camera.position.copy(scratch);
      lookAtTarget.copy(orbit.center);
    }

    // Swept collision guard: whatever the timeline/orbit asked for, never let the
    // camera cross (or come within CLEARANCE of) level geometry between frames.
    const collider = getCollider?.();
    if (collider) {
      if (!rt.hasSafe) {
        rt.lastSafe.copy(camera.position);
        rt.hasSafe = true;
      }
      sweep.from.copy(rt.lastSafe);
      sweep.to.copy(camera.position);
      sweep.dir.copy(sweep.to).sub(sweep.from);
      const length = sweep.dir.length();
      if (length > 1e-3) {
        sweep.dir.divideScalar(length);
        let allowed = length;
        // Forward ray catches front faces; the reverse ray catches back faces.
        caster.set(sweep.from, sweep.dir);
        caster.far = length + CLEARANCE;
        const forward = caster.intersectObject(collider, true)[0];
        if (forward) allowed = Math.min(allowed, Math.max(0, forward.distance - CLEARANCE));
        // (no extra reach here: it would catch surfaces *behind* the starting point)
        caster.set(sweep.to, sweep.dir.clone().negate());
        caster.far = length;
        const backward = caster.intersectObject(collider, true)[0];
        if (backward) allowed = Math.min(allowed, Math.max(0, length - backward.distance - CLEARANCE));
        if (allowed < length) {
          camera.position.copy(sweep.from).addScaledVector(sweep.dir, allowed);
          rt.blocked = (rt.blocked ?? 0) + 1;
        }
      }
      rt.lastSafe.copy(camera.position);
    }
    camera.lookAt(lookAtTarget);
  });

  return null;
}
