import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { SITE_CENTER } from '../sceneConfig.js';

/**
 * A-site courtyard from sceneConfig: floor y = 3, open region x 50..78, z -113..-80.
 * Eye height is 1.6 m, so the camera rests at y = 4.6. The box is inset so a
 * player cannot walk through the perimeter walls or off the site.
 */
const FLOOR_Y = 3;
const EYE_HEIGHT = 1.6;
const EYE_Y = FLOOR_Y + EYE_HEIGHT;
const BOUNDS = { minX: 51.5, maxX: 76.5, minZ: -111, maxZ: -81.5 };
const MOVE_SPEED = 5.6;
const GRAVITY = 20;
const JUMP_VELOCITY = 7;

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const wish = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const lookTarget = new THREE.Vector3();

export default function WalkController({ onExit }) {
  const { camera, gl } = useThree();
  const controls = useRef(null);
  const keys = useRef({});
  const velocityY = useRef(0);
  const grounded = useRef(true);
  const jumpQueued = useRef(false);
  const exited = useRef(false);
  const lockedOnce = useRef(false);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  const leave = () => {
    if (exited.current) return;
    exited.current = true;
    if (document.pointerLockElement) document.exitPointerLock();
    onExitRef.current?.();
  };

  useLayoutEffect(() => {
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, BOUNDS.minX, BOUNDS.maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, BOUNDS.minZ, BOUNDS.maxZ);
    camera.position.y = EYE_Y;
    camera.rotation.order = 'YXZ';
    lookTarget.set(SITE_CENTER[0], EYE_Y, SITE_CENTER[2]);
    camera.lookAt(lookTarget);
    velocityY.current = 0;
    grounded.current = true;
  }, [camera]);

  useEffect(() => {
    const plc = controls.current;
    const canvas = gl.domElement;
    if (document.pointerLockElement === canvas && plc) plc.isLocked = true;
    else plc?.lock();
  }, [gl]);

  useEffect(() => {
    const down = (event) => {
      if (event.code === 'Escape') {
        leave();
        return;
      }
      if (event.repeat) return;
      if (event.code === 'Space') {
        event.preventDefault();
        jumpQueued.current = true;
      }
      keys.current[event.code] = true;
    };
    const up = (event) => {
      keys.current[event.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const held = keys.current;

    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    right.crossVectors(forward, up).normalize();

    wish.set(0, 0, 0);
    if (held.KeyW) wish.add(forward);
    if (held.KeyS) wish.sub(forward);
    if (held.KeyD) wish.add(right);
    if (held.KeyA) wish.sub(right);
    if (wish.lengthSq() > 0) {
      wish.normalize();
      camera.position.addScaledVector(wish, MOVE_SPEED * dt);
    }

    if (jumpQueued.current && grounded.current) {
      velocityY.current = JUMP_VELOCITY;
      grounded.current = false;
      jumpQueued.current = false;
    }

    velocityY.current -= GRAVITY * dt;
    camera.position.y += velocityY.current * dt;
    if (camera.position.y <= EYE_Y) {
      camera.position.y = EYE_Y;
      velocityY.current = 0;
      grounded.current = true;
    }

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, BOUNDS.minX, BOUNDS.maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, BOUNDS.minZ, BOUNDS.maxZ);
  });

  return (
    <PointerLockControls
      ref={controls}
      selector=".valorant-canvas"
      onLock={() => {
        lockedOnce.current = true;
      }}
      onUnlock={() => {
        if (lockedOnce.current) leave();
      }}
    />
  );
}
