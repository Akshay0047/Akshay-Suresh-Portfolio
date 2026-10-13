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

const PULL_BACK = 15; // metres above the higher of the two endpoints
const RISE_DURATION = 1.5;
const PUSH_DURATION = 1.9;
const SETTLE_DELAY = 0.25;

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
export default function CameraController({ sections, rig, enabled = true }) {
  const { camera, clock } = useThree();
  const { setSection, setSettled, goToRef } = rig;

  // Dummy look target - camera.lookAt(lookAtTarget) runs every frame.
  const lookAtTarget = useMemo(() => new THREE.Vector3(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const runtime = useRef({ timeline: null, orbit: null, orbitStart: 0 });

  /**
   * moveToSection(targetPos, targetLookAt)
   * Never lerps through geometry: step 1 pulls the camera up and back to a
   * high waypoint (so it flies over the walls), step 2 pushes into targetPos.
   */
  const moveToSection = useCallback(
    (targetPos, targetLookAt, { orbit = null, onArrive } = {}) => {
      const rt = runtime.current;
      rt.timeline?.kill();
      rt.orbit = null;

      const start = camera.position.clone();
      const highY = Math.max(start.y, targetPos.y) + PULL_BACK;
      const waypoint = start.clone().lerp(targetPos, 0.5);
      waypoint.y = highY;
      const lookMid = lookAtTarget.clone().lerp(targetLookAt, 0.5);

      const timeline = gsap.timeline({
        onComplete: () => {
          rt.orbit = orbit;
          rt.orbitStart = clock.elapsedTime;
          onArrive?.();
        },
      });

      // Step 1 - pull back to the high-altitude waypoint.
      timeline.to(camera.position, {
        x: waypoint.x,
        y: waypoint.y,
        z: waypoint.z,
        duration: RISE_DURATION,
        ease: 'power2.inOut',
      });
      timeline.to(
        lookAtTarget,
        { x: lookMid.x, y: lookMid.y, z: lookMid.z, duration: RISE_DURATION, ease: 'power2.inOut' },
        0,
      );

      // Step 2 - push into the final position.
      timeline.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: PUSH_DURATION,
        ease: 'power3.inOut',
      });
      timeline.to(
        lookAtTarget,
        { x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z, duration: PUSH_DURATION, ease: 'power3.inOut' },
        RISE_DURATION,
      );

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
    camera.lookAt(lookAtTarget);
  });

  return null;
}
