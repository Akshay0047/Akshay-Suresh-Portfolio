import { Fragment, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { Bvh, Environment, Html, OrbitControls, Outlines, Sky, useGLTF, useProgress } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import gsap from 'gsap';
import * as THREE from 'three';
import CameraController from './CameraController.jsx';
import {
  CAST, GUN, MAP_POSITION, MODEL_URLS, RADIANITE, SECTION_ORBITS, SITE_CENTER, SPIKE, SUN_OFFSET,
} from '../sceneConfig.js';
import { applyPose, attachWeapon, createRig, describeWeapon } from '../agentRig.js';
import { adsPose, castPose, crouchPose, lowReadyPose, sprintPose, ultPose } from '../agentPoses.js';

// Draco decoder is served locally from /public/draco (copied from three).
useGLTF.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
[
  MODEL_URLS.map,
  ...Object.values(MODEL_URLS.agents),
  ...Object.values(MODEL_URLS.weapons),
  ...Object.values(MODEL_URLS.props),
].forEach((url) => useGLTF.preload(url, true));

/** Debug/test registry: window.__valorant exposes agents, camera and a NaN audit. */
const registry = { agents: {}, mapScene: null };

const POSES = {
  sprint: sprintPose,
  ads: adsPose,
  lowReady: lowReadyPose,
  crouch: crouchPose,
  ult: ultPose,
  cast: castPose,
};

// Props without a bone socket describe their own axes (weapon-local, glTF y-up).
const WEAPON_OVERRIDES = {
  knife: { aim: [1, 0, 0], up: [0, 1, 0], grip: [-0.06, 0, 0] },
};

/* ------------------------------------------------------------------ Loader */
export function Loader() {
  const { progress, item } = useProgress();
  return (
    <Html center>
      <div className="vl-loader" role="progressbar" aria-valuenow={Math.round(progress)}>
        <strong>Loading Protocol</strong>
        <div className="vl-loader-track"><i style={{ width: `${progress}%` }} /></div>
        <small>{Math.round(progress)}% {item ? `// ${item.split('/').pop()}` : ''}</small>
      </div>
    </Html>
  );
}

/**
 * The Blender glTF exporter writes a white emissive factor and metalness 1 for
 * these imported materials. Left alone, every surface glows white. Keep real
 * emissive maps, neutralise everything else, and turn blended cards into cutouts.
 */
const CUTOUT_PATTERN = /foliage|leaves|leaf|flower|daisy|plant|tree|bush|conifer|vine|canopy|wires|cloth|curtain|flag|fence|decal|graffiti|paper|poster|rug|hair|eyelash/i;
const GLASS_PATTERN = /glass|largefill|eyes/i;

function sanitizeMaterial(material) {
  if (!material || material.userData.sanitized) return;
  material.userData.sanitized = true;
  // White emissive with no map, or an emissive map that is just the albedo, is an export artefact.
  const albedoAsEmissive = material.emissiveMap && material.emissiveMap === material.map;
  if ((!material.emissiveMap || albedoAsEmissive) && material.emissive) {
    material.emissive.set(0x000000);
    material.emissiveMap = null;
  }
  if (!material.metalnessMap) material.metalness = Math.min(material.metalness, 0.05);
  if (!material.roughnessMap) material.roughness = Math.max(material.roughness, 0.82);
  // Almost every material is flagged BLEND by the importer, but the albedo alpha
  // channel usually carries unrelated packed data (it punches holes in brick).
  // Only foliage, cloth, decals etc. genuinely need alpha; glass stays blended.
  if (material.transparent && material.map) {
    if (GLASS_PATTERN.test(material.name)) {
      material.depthWrite = false;
    } else if (CUTOUT_PATTERN.test(material.name)) {
      material.transparent = false;
      material.alphaTest = 0.5;
      material.depthWrite = true;
    } else {
      material.transparent = false;
      material.alphaTest = 0;
      material.depthWrite = true;
    }
  }
  material.envMapIntensity = 0.7;
  material.needsUpdate = true;
}

function sanitizeScene(root, { shadows = true } = {}) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = shadows;
    object.receiveShadow = shadows;
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(sanitizeMaterial);
  });
}

/* --------------------------------------------------------------------- Map */
function MapModel() {
  const { scene } = useGLTF(MODEL_URLS.map, true);
  useLayoutEffect(() => {
    sanitizeScene(scene);
    registry.mapScene = scene;
  }, [scene]);
  return (
    <Bvh firstHitOnly>
      <primitive object={scene} position={MAP_POSITION} />
    </Bvh>
  );
}

/* ------------------------------------------------------------------ Agents */
const downRay = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);

/** Height of the walkable surface (floor or crate top) under a point; null if none. */
function groundHeight(mapScene, x, y, z, reach = 4) {
  if (!mapScene) return null;
  downRay.set(new THREE.Vector3(x, y + 1.2, z), DOWN);
  downRay.far = reach + 1.2;
  downRay.firstHitOnly = true;
  const hits = downRay.intersectObject(mapScene, true);
  const walkable = hits.find((hit) => !hit.face || hit.face.normal.y > 0.3 || hit.object.material?.side === THREE.DoubleSide);
  return walkable ? walkable.point.y : null;
}

function Agent({ cast }) {
  const { scene: agentScene } = useGLTF(MODEL_URLS.agents[cast.model], true);
  const { scene: weaponScene } = useGLTF(MODEL_URLS.weapons[cast.weapon ?? 'vandal'], true);
  const { scene: mapScene } = useGLTF(MODEL_URLS.map, true);
  const model = useMemo(() => cloneSkinned(agentScene), [agentScene]);
  const weaponModel = useMemo(() => (cast.weapon ? cloneSkinned(weaponScene) : null), [weaponScene, cast.weapon]);
  const root = useRef();
  const rig = useRef(null);

  useLayoutEffect(() => {
    sanitizeScene(model);
    model.traverse((object) => {
      if (object.isMesh) object.frustumCulled = false;
    });
    if (weaponModel) {
      sanitizeScene(weaponModel);
      weaponModel.traverse((object) => {
        if (object.isMesh) object.frustumCulled = false;
      });
    }
    const created = createRig(model);
    if (weaponModel && cast.weaponScale) weaponModel.scale.setScalar(cast.weaponScale);
    if (created && weaponModel) {
      attachWeapon(created, weaponModel, describeWeapon(weaponModel, WEAPON_OVERRIDES[cast.weapon]));
    }
    rig.current = created;

    // Plant the agent on whatever surface is under it (floor, crate or window floor).
    const group = root.current;
    if (group && !cast.floating) {
      const [x, y, z] = cast.position;
      const floor = groundHeight(mapScene, x, y, z);
      if (floor !== null) group.position.y = floor;
      group.userData.floorY = floor;
    }
    registry.agents[cast.id] = { group, rig: created, cast };
    return () => {
      delete registry.agents[cast.id];
    };
  }, [model, weaponModel, mapScene, cast]);

  useFrame(({ clock }) => {
    if (!rig.current) return;
    const poser = POSES[cast.pose];
    if (!poser) return;
    const t = clock.elapsedTime + (cast.timeOffset ?? 0);
    applyPose(rig.current, poser(t, cast));
  });

  return (
    <group ref={root} name={`agent-${cast.id}`} position={cast.position} rotation={[0, cast.rotationY ?? 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

/** Jett's Blade Storm: a ring of knives orbiting her hover point. */
function KnifeRing({ center, count = 7, radius = 1.15 }) {
  const { scene } = useGLTF(MODEL_URLS.weapons.knife, true);
  const knives = useMemo(() => Array.from({ length: count }, () => cloneSkinned(scene)), [scene, count]);
  const group = useRef();
  useLayoutEffect(() => knives.forEach((knife) => sanitizeScene(knife)), [knives]);
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.children.forEach((child, i) => {
      const a = (i / count) * Math.PI * 2 + t * 1.4;
      child.position.set(Math.cos(a) * radius, Math.sin(t * 2.1 + i * 1.7) * 0.18 + (i % 2 ? 0.25 : -0.2), Math.sin(a) * radius);
      // Blade tangent to the ring, tilting as it flies.
      child.rotation.set(0, -a, Math.sin(t * 3 + i) * 0.25);
    });
  });
  return (
    <group ref={group} position={center} scale={1.6}>
      {knives.map((knife, i) => (
        <group key={i}>
          <primitive object={knife} />
        </group>
      ))}
    </group>
  );
}

/** Sage's resurrection projection, standing beside her. */
function SageUlt({ position }) {
  const { scene } = useGLTF(MODEL_URLS.props.sageUlt, true);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const ref = useRef();
  useLayoutEffect(() => {
    sanitizeScene(model, { shadows: false });
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.material = object.material.clone();
      Object.assign(object.material, { transparent: true, opacity: 0.55, depthWrite: false });
      object.material.emissive = new THREE.Color('#7ee8ff');
      object.material.emissiveIntensity = 0.5;
    });
  }, [model]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.2) * 0.06;
  });
  return <primitive ref={ref} object={model} position={position} rotation={[0, 0.6, 0]} scale={0.9} />;
}

/* --------------------------------------------------------------------- Gun */
function InteractiveGun() {
  const { scene } = useGLTF(MODEL_URLS.gun, true);
  const model = useMemo(() => scene.clone(true), [scene]);
  const group = useRef();
  const [hovered, setHovered] = useState(false);
  const [meshes, setMeshes] = useState([]);
  const fx = useRef({ lift: 0, spin: 0, busy: false });
  const camera = useThree((state) => state.camera);
  const home = useMemo(() => new THREE.Vector3(...GUN.position), []);
  const front = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const found = [];
    sanitizeScene(model, { shadows: false });
    model.traverse((object) => {
      if (object.isMesh) found.push(object);
    });
    setMeshes(found);
  }, [model]);

  useEffect(() => {
    document.body.style.setProperty('--gun-hover', hovered ? '1' : '0');
  }, [hovered]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const state = fx.current;
    // Resting float over the pedestal.
    const bob = Math.sin(clock.elapsedTime * 1.6) * 0.04;
    camera.getWorldDirection(forward);
    front.copy(camera.position).addScaledVector(forward, 2.4);
    front.y -= 0.15;
    g.position.lerpVectors(home, front, state.lift);
    g.position.y += bob * (1 - state.lift);
    // Side-on to the Home camera with a slow sway; the click spin adds on top.
    g.rotation.y = GUN.rotationY + Math.sin(clock.elapsedTime * 0.7) * 0.4 * (1 - state.lift) + state.spin;
  });

  const spin = (event) => {
    event.stopPropagation();
    const state = fx.current;
    if (state.busy) return;
    state.busy = true;
    const startSpin = state.spin;
    gsap
      .timeline({
        onComplete: () => {
          state.busy = false;
          state.spin = 0;
        },
      })
      .to(state, { lift: 1, duration: 0.8, ease: 'power3.out' })
      .to(state, { spin: startSpin + Math.PI * 2, duration: 1.5, ease: 'power2.inOut' }, 0.35)
      .to(state, { lift: 0, duration: 0.9, ease: 'power3.in' }, '+=0.15');
  };

  return (
    <group
      ref={group}
      position={GUN.position}
      scale={GUN.scale}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={spin}
      name="vandal-interactive"
    >
      <primitive object={model} />
      {hovered &&
        meshes.map((mesh) => (
          <Fragment key={mesh.uuid}>
            {/* drei quirk: screenspace=false => thickness is in drawing-buffer pixels (0.05 would be invisible);
                screenspace=true => object units, which swallows this thin rifle. Pixels give a crisp edge. */}
            {createPortal(<Outlines color="#00ffff" thickness={5} screenspace={false} toneMapped={false} />, mesh)}
          </Fragment>
        ))}
    </group>
  );
}

function Pedestal() {
  const [x, y, z] = GUN.position;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[0.28, 0.42, 1.3, 6]} />
        <meshStandardMaterial color="#1b2430" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[1.0, 0.85, 0.07, 6]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------- Radianite + spike */
function RadianiteCrystal({ color, position, scale, index }) {
  const mesh = useRef();
  const light = useRef();
  useFrame(({ clock }) => {
    const pulse = 0.65 + Math.sin(clock.elapsedTime * 2.2 + index * 1.3) * 0.35;
    if (mesh.current) {
      mesh.current.material.emissiveIntensity = 0.8 + pulse * 1.6;
      mesh.current.rotation.y = clock.elapsedTime * 0.6 + index;
    }
    if (light.current) light.current.intensity = 2 + pulse * 5;
  });
  return (
    <group position={position}>
      <mesh ref={mesh} scale={[scale * 0.6, scale, scale * 0.6]} castShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} toneMapped={false} roughness={0.2} />
      </mesh>
      <pointLight ref={light} color={color} intensity={4} distance={5} decay={2} />
    </group>
  );
}

function Spike() {
  const glow = useRef();
  useFrame(({ clock }) => {
    if (glow.current) glow.current.emissiveIntensity = 1.2 + (Math.sin(clock.elapsedTime * 5) + 1) * 1.4;
  });
  return (
    <group position={SPIKE.position}>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 0.34, 8]} />
        <meshStandardMaterial color="#14181f" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.215, 0.025, 8, 24]} />
        <meshStandardMaterial ref={glow} color="#ff4655" emissive="#ff4655" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight color="#ff4655" intensity={3} distance={4} decay={2} position={[0, 0.5, 0]} />
    </group>
  );
}

/* ---------------------------------------------------------------- Lighting */
function Sun({ lowQuality }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    target.position.set(...SITE_CENTER);
    target.updateMatrixWorld();
    if (light.current) {
      light.current.target = target;
      light.current.shadow.camera.updateProjectionMatrix();
    }
  }, [target]);
  const position = SITE_CENTER.map((value, index) => value + SUN_OFFSET[index]);
  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        position={position}
        intensity={2.7}
        color="#fff4e0"
        castShadow
        shadow-mapSize={lowQuality ? [1024, 1024] : [2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}

/* ---------------------------------------------------------------- Contents */
function SceneContents({ rig, debug, lowQuality }) {
  const { camera, scene, gl } = useThree();
  useEffect(() => {
    window.__valorant = {
      registry,
      camera,
      scene,
      gl,
      THREE,
      sections: SECTION_ORBITS,
      /** Returns names of bones/objects whose transforms went non-finite. */
      auditNaN() {
        const bad = [];
        scene.traverse((object) => {
          const m = object.matrixWorld.elements;
          if (m.some((value) => !Number.isFinite(value))) bad.push(object.name || object.type);
        });
        return bad;
      },
    };
    return () => {
      delete window.__valorant;
    };
  }, [camera, scene, gl]);

  return (
    <>
      <Sky distance={900} sunPosition={SUN_OFFSET} turbidity={3.2} rayleigh={1.4} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={['#cfe4f6', 160, 720]} />
      <Environment preset="park" environmentIntensity={0.45} background={false} />
      <hemisphereLight args={['#e0f2fe', '#fef3c7', 1.2]} />
      <Sun lowQuality={lowQuality} />

      <MapModel />
      {CAST.map((cast) => (
        <Agent key={cast.id} cast={cast} />
      ))}
      <SageUlt position={[55.9, 3, -79.2]} />
      <KnifeRing center={[63.5, 8.3, -94.5]} />
      {RADIANITE.map((crystal, index) => (
        <RadianiteCrystal key={index} index={index} {...crystal} />
      ))}
      <Spike />
      <Pedestal />
      <InteractiveGun />

      {debug ? <DebugRig /> : <CameraController sections={SECTION_ORBITS} rig={rig} getCollider={() => registry.mapScene} />}
    </>
  );
}

function DebugRig() {
  const { camera, scene, gl } = useThree();
  const controls = useRef();
  useEffect(() => {
    window.__vs = { camera, scene, gl, THREE, get controls() { return controls.current; } };
  }, [camera, scene, gl]);
  return <OrbitControls ref={controls} makeDefault target={[62, 3, -95]} maxDistance={400} />;
}

export default function ValorantScene({ rig }) {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const debug = params.has('debug');
  // ?quality=low renders at reduced resolution (used for automated checks on
  // software-rendered browsers).
  const lowQuality = params.get('quality') === 'low';
  return (
    <Canvas
      className="valorant-canvas"
      shadows="percentage"
      dpr={lowQuality ? 0.6 : [1, 1.75]}
      camera={{ fov: 50, near: 0.1, far: 1200, position: [127, 60, 0] }}
      gl={{
        antialias: !lowQuality,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,
      }}
    >
      <Suspense fallback={<Loader />}>
        <SceneContents rig={rig} debug={debug} lowQuality={lowQuality} />
      </Suspense>
    </Canvas>
  );
}
