import * as THREE from 'three';

const base = import.meta.env.BASE_URL;
const model = (file) => `${base}models/${file}`;

export const MODEL_URLS = {
  map: model('map_site.glb'),
  gun: model('vandal_gun.glb'), // floating showcase gun (also the entry duelists' rifle)
  agents: {
    neon: model('agent_neon.glb'),
    jett: model('agent_jett.glb'),
    reyna: model('agent_reyna.glb'),
    phoenix: model('agent_phoenix.glb'),
    sage: model('agent_sage.glb'),
    sova: model('agent_sova.glb'),
    gekko: model('agent_gekko.glb'),
    chamber: model('agent_chamber.glb'),
    cypher: model('agent_cypher.glb'),
  },
  weapons: {
    vandal: model('vandal_gun.glb'),
    phantom: model('phantom_gun.glb'),
    operator: model('operator_gun.glb'),
    knife: model('jett_knife.glb'),
  },
  props: {
    sageUlt: model('sage_ult.glb'),
  },
};

/*
 * map_site.glb sits at the origin and every coordinate below is in its native
 * metre space, measured from the exported scene with ray-casts:
 *   - A-site courtyard floor y = 3, open region roughly x 50..78, z -113..-80
 *   - main entry: the west door at (49, 3, -100)
 *   - A-Tower "Heaven": interior floor y = 9, window opening x 66..69 / y 10..12 in
 *     the south facade (z = -102.4), room depth ~4 m behind it
 *   - 2-high crate stack on the south edge: top y = 7 at (62, -85..-83)
 *   - SW corner crate at (54, -85) with a free pocket behind it at (53, -83.4)
 *
 * Orbit convention: camera = center + (sin(angle) * r, height, cos(angle) * r),
 * so angle 0 = south (+z), PI/2 = east (+x), PI = north (-z), -PI/2 = west (-x).
 * The agent rigs face -Z, so rotationY: facing east = -PI/2, north = 0, south = PI, west = +PI/2.
 */
export const MAP_POSITION = [0, 0, 0];

const v = (x, y, z) => new THREE.Vector3(x, y, z);

/** World-space point the sun orbits around / shadow frustum is centred on. */
export const SITE_CENTER = [63, 4, -95];
export const SUN_OFFSET = [40, 60, 25];

/*
 * Cast. `model` is a key of MODEL_URLS.agents, `weapon` a key of MODEL_URLS.weapons.
 * `aimAt` / `lookAt` are world points; poses live in agentPoses.js.
 */
export const CAST = [
  // ---- Attackers: site entry push through the west door ----
  { id: 'neon', model: 'neon', weapon: 'vandal', pose: 'sprinter', position: [55.4, 3, -98.4], rotationY: -Math.PI / 2, aimAt: [72, 3.4, -99.5], lookAt: [72, 4.2, -99.5], phase: 0 },
  { id: 'phoenix', model: 'phoenix', weapon: 'phantom', pose: 'ads', position: [51.8, 3, -95.6], rotationY: -Math.PI / 2 + 0.1, aimAt: [72, 3.4, -97], lookAt: [72, 4.2, -97] },
  { id: 'reyna', model: 'reyna', weapon: 'vandal', pose: 'lowReady', position: [58, 3, -102], rotationY: -Math.PI / 2 - 0.35, aimAt: [70, 3.2, -90], lookAt: [68, 4.2, -92] },

  // ---- Attackers: back-line utility from cover ----
  { id: 'gekko', model: 'gekko', weapon: 'phantom', pose: 'crouch', position: [53.1, 3, -83.4], rotationY: -1.0, aimAt: [70, 3.6, -88], lookAt: [70, 4, -90] },
  { id: 'sova', model: 'sova', weapon: 'vandal', pose: 'ads', position: [56.4, 3, -82.2], rotationY: -0.9, aimAt: [60, 3.8, -98], lookAt: [60, 4.5, -98] },
  { id: 'sage', model: 'sage', weapon: null, pose: 'cast', position: [54.4, 3, -80.4], rotationY: -0.5, lookAt: [60, 4.5, -90] },

  // ---- Heaven / skills: the long-range anchor on the crate perch ----
  { id: 'chamber', model: 'chamber', weapon: 'operator', pose: 'ads', position: [62, 7, -84], rotationY: 0.62, aimAt: [49.5, 4.2, -100], lookAt: [49.5, 4.2, -100], kneel: 0.0 },

  // ---- Defender: anchoring Heaven window, holding the angle on the entry ----
  { id: 'cypher', model: 'cypher', weapon: 'vandal', pose: 'ads', position: [67.4, 9, -103.4], rotationY: Math.PI - 0.45, aimAt: [55, 3.8, -95], lookAt: [55, 4.2, -95] },

  // ---- Blade Storm ----
  { id: 'jett', model: 'jett', weapon: 'knife', weaponScale: 1.8, pose: 'ult', position: [63.5, 7.1, -94.5], rotationY: Math.PI / 2 - 0.2, aimAt: [49.5, 4.2, -100], lookAt: [49.5, 4.2, -100], floating: true },
];

export const SECTION_ORBITS = {
  // Tiny sweep: the floating Vandal is a foreground prop and must stay in frame.
  home: { center: v(63, 5, -96), radius: 34, height: 19, angle: 0, arc: 0.05, speed: 0.12 },
  // Operations: Neon sprints the entry with the sprinter aim pose; Phoenix holds.
  projects: { center: v(55.4, 4.4, -98.4), radius: 5.4, height: 0.6, angle: Math.PI / 2 - 0.25, arc: 0.25, speed: 0.2 },
  // Arsenal: Chamber's Operator from the crate perch.
  skills: { center: v(62, 8.6, -84), radius: 5.6, height: 0.5, angle: Math.PI - 0.2, arc: 0.5, speed: 0.2 },
  // Dossier: Cypher anchoring Heaven, seen through the window frame from the site.
  about: { center: v(67.3, 10.4, -103.4), radius: 10, height: 0.5, angle: 0, arc: 0.1, speed: 0.2 },
  // Comms: Jett mid-ult.
  comms: { center: v(63.5, 8.5, -94.5), radius: 5.2, height: 0.8, angle: -Math.PI / 2, arc: 0.4, speed: 0.2 },
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

/** Radianite crystals and the spike: the only emissive props in the daylight scene. */
export const RADIANITE = [
  { color: '#00ffff', position: [64.2, 5.25, -94.6], scale: 0.42 },
  { color: '#ff4655', position: [61.5, 5.25, -95.9], scale: 0.36 },
  { color: '#00ffff', position: [53.9, 5.3, -85.0], scale: 0.4 },
  { color: '#ff4655', position: [62.0, 7.35, -83.2], scale: 0.3 },
];

export const SPIKE = { position: [66.2, 3.02, -97.4] };
