import * as THREE from 'three';

const base = import.meta.env.BASE_URL;

export const MODEL_URLS = {
  map: `${base}models/map_site.glb`,
  rushing: `${base}models/agent_rushing.glb`,
  highground: `${base}models/agent_highground.glb`,
  lurking: `${base}models/agent_lurking.glb`,
  gun: `${base}models/vandal_gun.glb`,
};

/*
 * map_site.glb sits at the origin and every coordinate below is in its native
 * metre space (measured from the exported scene, not guessed):
 *   - A-site courtyard floor is at y = 3, spanning roughly x 50..78, z -113..-80
 *   - main entryway: the west door at (49, 3, -100), opening east into the site
 *   - crate stack (2 high, top at y = 7) on the south edge at (62, -85..-83)
 *   - north-west alcove with a 2-high crate stack at (58, 4..6, -109)
 * Orbit convention: camera = center + (sin(angle) * r, height, cos(angle) * r),
 * so angle 0 = south (+z), PI/2 = east (+x), PI = north (-z).
 */
export const MAP_POSITION = [0, 0, 0];

// The agent rigs face -Z, so: facing east = -PI/2, north (-z) = 0, south = PI.
export const AGENTS = {
  // Sprinting out of the west entryway, heading east into the site.
  rushing: { position: [54.5, 3, -99.5], rotationY: -Math.PI / 2 },
  // Standing on the crate stack, overlooking the site to the north.
  highground: { position: [62, 7, -84], rotationY: 0 },
  // Crouched in the SW corner, tucked behind the crate at (54, -85) and
  // peeking out to the north-east toward the site. Spot and camera orbit were
  // found by ray-casting the map: hidden from the site centre, orbit collision-free.
  lurking: { position: [53.1, 3, -83.4], rotationY: -0.7 },
};

const v = (x, y, z) => new THREE.Vector3(x, y, z);

export const SECTION_ORBITS = {
  // Tiny sweep: the floating Vandal is a foreground prop and must stay in frame.
  home: { center: v(63, 5, -96), radius: 34, height: 19, angle: 0, arc: 0.05, speed: 0.12 },
  projects: { center: v(54.5, 4.6, -99.5), radius: 5.4, height: 0.6, angle: Math.PI / 2, arc: 0.7, speed: 0.2 },
  skills: { center: v(62, 8.6, -84), radius: 5.6, height: 0.5, angle: Math.PI - 0.2, arc: 0.7, speed: 0.2 },
  about: { center: v(53.1, 3.95, -83.4), radius: 4.2, height: 0.7, angle: 1.05, arc: 0.35, speed: 0.2 },
};

/**
 * The pedestal floats in the foreground of the Home shot: 7 m in front of the
 * Home camera (well above the rooftops), nudged left of the view axis.
 */
function foregroundSpot() {
  const home = SECTION_ORBITS.home;
  const camera = v(
    home.center.x + Math.sin(home.angle) * home.radius,
    home.center.y + home.height,
    home.center.z + Math.cos(home.angle) * home.radius,
  );
  const forward = home.center.clone().sub(camera).normalize();
  const right = new THREE.Vector3().crossVectors(forward, v(0, 1, 0)).normalize();
  return camera.clone().addScaledVector(forward, 7).addScaledVector(right, -1.9).add(v(0, -0.5, 0));
}

const gunSpot = foregroundSpot();
export const GUN = { position: gunSpot.toArray(), rotationY: 0, scale: 1.5 };

export const LIGHTS = [
  { color: '#00ffff', position: [55, 7, -97], intensity: 110, distance: 42 },
  { color: '#ff4655', position: [75, 7, -90], intensity: 110, distance: 42 },
  { color: '#00ffff', position: [54, 6.5, -105], intensity: 45, distance: 20 },
  { color: '#00ffff', position: [56, 6.5, -86], intensity: 35, distance: 14 },
  { color: '#ff4655', position: [62, 11, -82], intensity: 45, distance: 22 },
  { color: '#00ffff', position: [GUN.position[0], GUN.position[1] + 2, GUN.position[2]], intensity: 25, distance: 10 },
  { color: '#ff4655', position: [GUN.position[0] + 2, GUN.position[1] - 1, GUN.position[2] + 1], intensity: 18, distance: 8 },
];
