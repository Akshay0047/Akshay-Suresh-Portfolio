import { Fragment, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, OrbitControls, Outlines, useGLTF, useProgress } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import gsap from 'gsap';
import * as THREE from 'three';
import CameraController from './CameraController.jsx';
import { AGENTS, GUN, LIGHTS, MAP_POSITION, MODEL_URLS, SECTION_ORBITS } from '../sceneConfig.js';
import { applyPose, createRig, crouchPose, overwatchPose, sprintPose } from '../agentPoses.js';

// Draco decoder is served locally from /public/draco (copied from three).
useGLTF.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
Object.values(MODEL_URLS).forEach((url) => useGLTF.preload(url, true));

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
  material.envMapIntensity = 0.9;
  material.needsUpdate = true;
}

function sanitizeScene(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(sanitizeMaterial);
  });
}

/* --------------------------------------------------------------------- Map */
function MapModel() {
  const { scene } = useGLTF(MODEL_URLS.map, true);
  useLayoutEffect(() => sanitizeScene(scene), [scene]);
  return <primitive object={scene} position={MAP_POSITION} />;
}

/* ------------------------------------------------------------------ Agents */
function Agent({ url, position, rotationY = 0, pose, name }) {
  const { scene } = useGLTF(url, true);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const root = useRef();
  const body = useRef();
  const rig = useRef(null);

  useLayoutEffect(() => {
    sanitizeScene(model);
    model.traverse((object) => {
      if (object.isMesh) object.frustumCulled = false;
    });
    rig.current = createRig(model);
  }, [model]);

  useFrame(({ clock }) => {
    if (!pose || !rig.current || !root.current) return;
    const { pose: bonePose, bodyY = 0 } = pose(clock.elapsedTime);
    applyPose(rig.current, root.current, bonePose);
    if (body.current) body.current.position.y = bodyY;
  });

  return (
    <group ref={root} name={name} position={position} rotation={[0, rotationY, 0]}>
      <group ref={body}>
        <primitive object={model} />
      </group>
    </group>
  );
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
    sanitizeScene(model);
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
        <meshStandardMaterial color="#0d1218" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[1.0, 0.85, 0.07, 6]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- Contents */
function SceneContents({ rig, debug, lowQuality }) {
  return (
    <>
      <color attach="background" args={['#04070b']} />
      <fog attach="fog" args={['#05080d', 60, 320]} />
      <Environment preset="night" environmentIntensity={0.9} />
      <hemisphereLight args={['#1b2a3d', '#05070a', 0.6]} />
      <directionalLight position={[160, 90, -40]} intensity={0.8} color="#8fb0ff" />

      {LIGHTS.map((light, index) => (
        <pointLight key={`${light.color}-${index}`} color={light.color} position={light.position} intensity={light.intensity} distance={light.distance} decay={2} />
      ))}

      <MapModel />
      <Agent name="agent-rushing" url={MODEL_URLS.rushing} pose={sprintPose} {...AGENTS.rushing} />
      <Agent name="agent-highground" url={MODEL_URLS.highground} pose={overwatchPose} {...AGENTS.highground} />
      <Agent name="agent-lurking" url={MODEL_URLS.lurking} pose={crouchPose} {...AGENTS.lurking} />
      <Pedestal />
      <InteractiveGun />

      {debug ? (
        <>
          <ambientLight intensity={0.5} />
          <DebugRig />
        </>
      ) : (
        <CameraController sections={SECTION_ORBITS} rig={rig} />
      )}

      {!lowQuality && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.55} luminanceThreshold={0.9} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette offset={0.25} darkness={0.6} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
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
  // ?quality=low drops post-processing and renders at reduced resolution
  // (used for automated checks on software-rendered browsers).
  const lowQuality = params.get('quality') === 'low';
  return (
    <Canvas
      className="valorant-canvas"
      dpr={lowQuality ? 0.6 : [1, 1.75]}
      camera={{ fov: 50, near: 0.1, far: 1200, position: [127, 60, 0] }}
      gl={{ antialias: !lowQuality, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={<Loader />}>
        <SceneContents rig={rig} debug={debug} lowQuality={lowQuality} />
      </Suspense>
    </Canvas>
  );
}
