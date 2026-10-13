import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

const CameraRigContext = createContext(null);

export function useCameraRig() {
  const value = useContext(CameraRigContext);
  if (!value) {
    throw new Error('useCameraRig must be used within CameraRigProvider');
  }
  return value;
}

export function CameraRigProvider({ children }) {
  const moveToRef = useRef(() => {});
  const [section, setSection] = useState('menu');

  const registerMoveTo = useCallback((fn) => {
    moveToRef.current = fn;
  }, []);

  const moveTo = useCallback((next) => {
    moveToRef.current(next);
  }, []);

  const value = useMemo(
    () => ({ section, moveTo, registerMoveTo, setSection }),
    [section, moveTo, registerMoveTo],
  );

  return <CameraRigContext.Provider value={value}>{children}</CameraRigContext.Provider>;
}

function shortestEuler(from, to) {
  const next = new THREE.Euler(to.x, to.y, to.z, from.order || 'XYZ');
  for (const axis of ['x', 'y', 'z']) {
    let delta = next[axis] - from[axis];
    while (delta > Math.PI) {
      next[axis] -= Math.PI * 2;
      delta -= Math.PI * 2;
    }
    while (delta < -Math.PI) {
      next[axis] += Math.PI * 2;
      delta += Math.PI * 2;
    }
  }
  return next;
}

export function CameraController({ waypoints }) {
  const { camera } = useThree();
  const { registerMoveTo, setSection } = useCameraRig();
  const restPosition = useRef(new THREE.Vector3());
  const restRotation = useRef(new THREE.Euler());
  const mouse = useRef({ x: 0, y: 0 });
  const tweening = useRef(false);
  const armed = useRef(false);
  const tween = useRef(null);
  const sectionRef = useRef('menu');

  useEffect(() => {
    const onPointerMove = (event) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  useLayoutEffect(() => {
    if (!waypoints) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyPose = (pose, immediate) => {
      const rotation = immediate ? pose.rotation : shortestEuler(camera.rotation, pose.rotation);
      restPosition.current.copy(pose.position);
      restRotation.current.copy(rotation);

      tween.current?.kill();
      if (immediate) {
        tweening.current = false;
        camera.position.copy(pose.position);
        camera.rotation.copy(rotation);
        return;
      }

      tweening.current = true;
      const proxy = {
        px: camera.position.x,
        py: camera.position.y,
        pz: camera.position.z,
        rx: camera.rotation.x,
        ry: camera.rotation.y,
        rz: camera.rotation.z,
      };
      tween.current = gsap.to(proxy, {
        px: pose.position.x,
        py: pose.position.y,
        pz: pose.position.z,
        rx: rotation.x,
        ry: rotation.y,
        rz: rotation.z,
        duration: reducedMotion ? 0 : 2.5,
        ease: 'power3.inOut',
        onUpdate: () => {
          camera.position.set(proxy.px, proxy.py, proxy.pz);
          camera.rotation.set(proxy.rx, proxy.ry, proxy.rz);
        },
        onComplete: () => {
          tweening.current = false;
          restPosition.current.copy(pose.position);
          restRotation.current.copy(rotation);
          camera.position.copy(pose.position);
          camera.rotation.copy(rotation);
        },
      });
    };

    const go = (section, immediate = false) => {
      const pose = waypoints[section] ?? waypoints.menu;
      if (!pose) return;
      if (!immediate && sectionRef.current === section && !tweening.current) return;
      sectionRef.current = section;
      setSection(section);
      applyPose(pose, immediate);
    };

    registerMoveTo(go);
    go(sectionRef.current, true);
    armed.current = true;

    return () => {
      tween.current?.kill();
      armed.current = false;
    };
  }, [waypoints, camera, registerMoveTo, setSection]);

  useFrame((_, delta) => {
    if (!armed.current || tweening.current) return;
    const offsetX = mouse.current.x * 0.38;
    const offsetY = mouse.current.y * 0.22;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, restPosition.current.x + offsetX, 2.6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, restPosition.current.y + offsetY * 0.45, 2.6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, restPosition.current.z - mouse.current.x * 0.16, 2.6, delta);
    camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, restRotation.current.y - mouse.current.x * 0.04, 2.6, delta);
    camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, restRotation.current.x + mouse.current.y * 0.028, 2.6, delta);
  });

  return null;
}
