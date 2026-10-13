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
  const goToRef = useRef(null);

  const goTo = useCallback((id) => goToRef.current?.(id), []);
  const value = useMemo(
    () => ({ section, settled, setSection, setSettled, goTo, goToRef }),
    [section, settled, goTo],
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

// The tallest structure around the site (A tower) peaks at y ~ 37-44, so every
// transition cruises above this altitude before descending into a target room.
const CRUISE_Y = 52;
const RISE_DURATION = 1.1;
const TRAVERSE_DURATION = 1.3;
const DESCEND_DURATION = 1.7;
const SETTLE_DELAY = 0.25;
const CLEARANCE = 0.5; // metres kept between the camera and any surface (near plane is 0.1)

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

  /**
   * moveToSection(targetPos, targetLookAt)
   * Never lerps through geometry. The flight is three legs:
   *   1. rise straight up to cruise altitude (above every wall and roof),
   *   2. traverse horizontally to the point above the destination,
   *   3. descend onto targetPos.
   * A per-frame swept-collision guard (see useFrame) backs this up.
   */
  const moveToSection = useCallback(
    (targetPos, targetLookAt, { orbit = null, onArrive } = {}) => {
      const rt = runtime.current;
      rt.timeline?.kill();
      rt.orbit = null;

      const start = camera.position.clone();
      const cruise = Math.max(CRUISE_Y, start.y, targetPos.y);
      const above = (point) => new THREE.Vector3(point.x, cruise, point.z);
      const liftStart = above(start);
      const liftTarget = above(targetPos);
      const lookMid = lookAtTarget.clone().lerp(targetLookAt, 0.5);

      const timeline = gsap.timeline({
        onComplete: () => {
          rt.orbit = orbit;
          rt.orbitStart = clock.elapsedTime;
          onArrive?.();
        },
      });

      const move = (to, duration, ease) => timeline.to(camera.position, { x: to.x, y: to.y, z: to.z, duration, ease });
      const look = (to, duration, ease, at) =>
        timeline.to(lookAtTarget, { x: to.x, y: to.y, z: to.z, duration, ease }, at);

      // Leg 1 - rise out of whatever room/lane we are in (skipped if already cruising).
      const alreadyHigh = start.y >= cruise - 0.5;
      const riseTime = alreadyHigh ? 0.01 : RISE_DURATION;
      move(liftStart, riseTime, 'power2.in');
      // Leg 2 - fly over the rooftops; the look target sweeps to the destination.
      move(liftTarget, TRAVERSE_DURATION, 'power1.inOut');
      look(lookMid, TRAVERSE_DURATION, 'power1.inOut', riseTime);
      // Leg 3 - drop into the target.
      move(targetPos, DESCEND_DURATION, 'power3.inOut');
      look(targetLookAt, DESCEND_DURATION, 'power3.inOut', riseTime + TRAVERSE_DURATION);

      rt.timeline = timeline;
      return timeline;
    },
    [camera, clock, lookAtTarget],
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

  // Cinematic intro: start high above the site, then settle on "home".
  useEffect(() => {
    if (!enabled) return;
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
