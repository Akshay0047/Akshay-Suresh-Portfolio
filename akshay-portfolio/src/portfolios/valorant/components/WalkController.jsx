import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { SITE_CENTER } from '../sceneConfig.js';

/**
 * A-site courtyard from sceneConfig: floor y = 3, open region x 50..78, z -113..-80.
 * Eye height is 1.6 m, so the camera rests at y = 4.6. The courtyard box keeps
 * the player on the site. Walls, crates, and characters stop the body as well.
 */
const FLOOR_Y = 3;
const EYE_HEIGHT = 1.6;
const EYE_Y = FLOOR_Y + EYE_HEIGHT;
const BOUNDS = { minX: 51.5, maxX: 76.5, minZ: -111, maxZ: -81.5 };
const SPAWN = [68, -90];
const MOVE_SPEED = 5.6;
const GRAVITY = 20;
const JUMP_VELOCITY = 7;
const BODY_RADIUS = 0.36;
const SEPARATION = 0.84;
const SAMPLE_HEIGHTS = [0.45, 1.0, 1.45];
const BODY_HEIGHT = 1.75;

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const wish = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const lookTarget = new THREE.Vector3();
const origin = new THREE.Vector3();
const dir = new THREE.Vector3();
const side = new THREE.Vector3();
const normal = new THREE.Vector3();
const bodyPoint = new THREE.Vector3();
const ray = new THREE.Raycaster();

function wallDistance(map, sample, direction, reach) {
  ray.firstHitOnly = false;
  ray.set(sample, direction);
  ray.near = 0;
  ray.far = reach;
  const hits = ray.intersectObject(map, true);
  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i];
    if (!hit.face) continue;
    normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
    if (normal.y > 0.45) continue;
    // Back faces belong to the shell we are already leaving. Only faces that
    // point back at the body can stop it.
    if (normal.dot(direction) > -0.2) continue;
    return hit.distance;
  }
  return Infinity;
}

export default function WalkController({ onExit, getMap, getAgents, getBodies }) {
  const { camera, gl } = useThree();
  const controls = useRef(null);
  const keys = useRef({});
  const velocityY = useRef(0);
  const grounded = useRef(true);
  const jumpQueued = useRef(false);
  const exited = useRef(false);
  const lockedOnce = useRef(false);
  const onExitRef = useRef(onExit);
  const getMapRef = useRef(getMap);
  const getAgentsRef = useRef(getAgents);
  const getBodiesRef = useRef(getBodies);
  onExitRef.current = onExit;
  getMapRef.current = getMap;
  getAgentsRef.current = getAgents;
  getBodiesRef.current = getBodies;

  const leave = () => {
    if (exited.current) return;
    exited.current = true;
    if (document.pointerLockElement) document.exitPointerLock();
    onExitRef.current?.();
  };

  useLayoutEffect(() => {
    // Always start on open courtyard floor: no walls or crates within 4 m and clear of every agent.
    // (Entering from a section camera used to drop the player wherever that camera sat, often inside geometry.)
    camera.position.set(SPAWN[0], EYE_Y, SPAWN[1]);
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
    const map = getMapRef.current?.() ?? null;

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
    if (wish.lengthSq() > 0) wish.normalize();

    // Resolve X and Z separately so a blocked wall still lets you slide along it.
    slide(map, 'x', wish.x * MOVE_SPEED * dt);
    slide(map, 'z', wish.z * MOVE_SPEED * dt);
    separateFromCharacters();

    if (jumpQueued.current && grounded.current) {
      velocityY.current = JUMP_VELOCITY;
      grounded.current = false;
      jumpQueued.current = false;
    }

    velocityY.current -= GRAVITY * dt;
    const rise = velocityY.current * dt;
    if (map && rise > 0) {
      origin.set(camera.position.x, camera.position.y, camera.position.z);
      const ceiling = wallDistance(map, origin, up, rise + 0.15);
      if (ceiling < rise + 0.12) {
        camera.position.y += Math.max(0, ceiling - 0.12);
        velocityY.current = 0;
      } else {
        camera.position.y += rise;
      }
    } else {
      camera.position.y += rise;
    }
    if (camera.position.y <= EYE_Y) {
      camera.position.y = EYE_Y;
      velocityY.current = 0;
      grounded.current = true;
    }

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, BOUNDS.minX, BOUNDS.maxX);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, BOUNDS.minZ, BOUNDS.maxZ);

    function feetY() {
      return camera.position.y - EYE_HEIGHT;
    }

    function forEachBody(visit) {
      const agents = getAgentsRef.current?.() ?? {};
      Object.keys(agents).forEach((id) => {
        const group = agents[id]?.group;
        if (!group) return;
        group.getWorldPosition(bodyPoint);
        visit(bodyPoint.x, bodyPoint.y, bodyPoint.z);
      });
      const bodies = getBodiesRef.current?.() ?? [];
      bodies.forEach((body) => {
        if (!body) return;
        body.getWorldPosition(bodyPoint);
        visit(bodyPoint.x, bodyPoint.y, bodyPoint.z);
      });
    }

    function characterTravel(direction, travel) {
      let allowed = travel;
      const baseY = feetY();
      const headY = camera.position.y + 0.1;
      forEachBody((x, y, z) => {
        if (headY < y + 0.2 || baseY > y + BODY_HEIGHT) return;
        const rx = camera.position.x - x;
        const rz = camera.position.z - z;
        const c = rx * rx + rz * rz - SEPARATION * SEPARATION;
        const toward = rx * direction.x + rz * direction.z;
        // Moving away or sideways is always allowed, even when touching the body. Blocking every
        // direction there pinned the player; the separation pass keeps the distance afterwards.
        if (toward >= -1e-4) return;
        if (c <= 0) {
          allowed = 0;
          return;
        }
        const disc = toward * toward - c;
        if (disc < 0) return;
        const t = -toward - Math.sqrt(disc);
        if (t < allowed) allowed = Math.max(0, t);
      });
      return allowed;
    }

    function slide(collider, axis, delta) {
      if (Math.abs(delta) < 1e-5) return;
      const sign = Math.sign(delta);
      dir.set(axis === 'x' ? sign : 0, 0, axis === 'z' ? sign : 0);
      side.set(-dir.z, 0, dir.x);
      const travel = Math.abs(delta);
      let allowed = collider ? travel : characterTravel(dir, travel);
      if (collider) {
        const base = feetY();
        const laterals = [0, BODY_RADIUS * 0.7, -BODY_RADIUS * 0.7];
        for (let h = 0; h < SAMPLE_HEIGHTS.length; h += 1) {
          for (let i = 0; i < laterals.length; i += 1) {
            origin.set(camera.position.x, base + SAMPLE_HEIGHTS[h], camera.position.z);
            origin.addScaledVector(side, laterals[i]);
            const distance = wallDistance(collider, origin, dir, travel + BODY_RADIUS);
            allowed = Math.min(allowed, Math.max(0, distance - BODY_RADIUS));
          }
        }
        allowed = Math.min(allowed, characterTravel(dir, travel));
      }
      camera.position[axis] += sign * allowed;
    }

    function separateFromCharacters() {
      const baseY = feetY();
      const headY = camera.position.y + 0.1;
      forEachBody((x, y, z) => {
        if (headY < y + 0.2 || baseY > y + BODY_HEIGHT) return;
        let dx = camera.position.x - x;
        let dz = camera.position.z - z;
        let dist = Math.hypot(dx, dz);
        if (dist >= SEPARATION) return;
        if (dist < 1e-4) {
          dx = SEPARATION;
          dz = 0;
          dist = SEPARATION;
        }
        const scale = (SEPARATION - dist) / dist;
        camera.position.x += dx * scale;
        camera.position.z += dz * scale;
      });
    }
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
