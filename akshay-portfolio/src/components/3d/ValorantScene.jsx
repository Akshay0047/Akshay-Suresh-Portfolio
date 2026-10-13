import { Component, Suspense, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Html, useGLTF, useProgress } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { CameraController, CameraRigProvider } from './CameraController.jsx';
import GameMenu from '../ui/GameMenu.jsx';
import '../ui/valorant-menu.css';

const MODEL_URL = '/models/valorant_map.glb';
const POINT_LIGHT_SCALE = 1 / 90;

const pulseVertex = /* glsl */ `
  out vec3 vNormal;
  out vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = mat3(modelMatrix) * normal;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const pulseFragment = /* glsl */ `
  in vec3 vNormal;
  in vec3 vWorld;
  uniform float uPulse;
  uniform vec3 uBase;
  uniform vec3 uEmit;
  uniform float uTrim;
  out vec4 fragColor;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.15);
    float pulse = 0.5 + 0.5 * uPulse;
    float glow = uTrim > 0.5
      ? 0.42 + 0.58 * pulse
      : fresnel * (0.25 + 0.75 * pulse);
    vec3 color = uBase + uEmit * glow * (uTrim > 0.5 ? 2.4 : 1.15);
    fragColor = vec4(color, 1.0);
  }
`;

function createPulseMaterial(trim) {
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    toneMapped: false,
    uniforms: {
      uPulse: { value: 0 },
      uBase: { value: new THREE.Color(trim ? '#042628' : '#071416') },
      uEmit: { value: new THREE.Color('#00ffff') },
      uTrim: { value: trim ? 1 : 0 },
    },
    vertexShader: pulseVertex,
    fragmentShader: pulseFragment,
  });
  return material;
}

function poseFrom(root, cameraName, lookName) {
  const cameraNode = root.getObjectByName(cameraName);
  const lookNode = root.getObjectByName(lookName);
  if (!cameraNode || !lookNode) return null;
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  cameraNode.getWorldPosition(position);
  lookNode.getWorldPosition(target);
  const probe = new THREE.PerspectiveCamera();
  probe.position.copy(position);
  probe.lookAt(target);
  return { position, rotation: probe.rotation.clone() };
}

function MapModel({ onReady }) {
  const { scene, nodes, materials } = useGLTF(MODEL_URL);
  const bodyMaterial = useMemo(() => createPulseMaterial(false), []);
  const trimMaterial = useMemo(() => createPulseMaterial(true), []);

  const cloned = useMemo(() => {
    const next = scene.clone(true);
    const crateNames = Object.keys(nodes).filter((name) => name.startsWith('Radianite'));
    next.traverse((object) => {
      const radianite = object.isMesh && (object.name.startsWith('Radianite') || crateNames.includes(object.name));
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (radianite && object.name.includes('Trim')) object.material = trimMaterial;
        else if (radianite) object.material = bodyMaterial;
      }
      if (object.isPointLight) {
        object.intensity *= POINT_LIGHT_SCALE;
        object.decay = 2;
        object.distance = 18;
      }
    });
    return next;
  }, [scene, nodes, bodyMaterial, trimMaterial]);

  useLayoutEffect(() => {
    cloned.updateMatrixWorld(true);
    const concrete = materials.Concrete;
    if (concrete) {
      concrete.color.set('#4a4e57');
      concrete.roughness = 0.88;
      concrete.metalness = 0.04;
      concrete.envMapIntensity = 1.15;
    }
    const body = materials.RadianiteBody;
    if (body) {
      body.metalness = 0.55;
      body.roughness = 0.38;
    }

    onReady({
      menu: poseFrom(cloned, 'Cam_Menu', 'Look_Menu'),
      projects: poseFrom(cloned, 'Cam_Projects', 'Look_Projects'),
      skills: poseFrom(cloned, 'Cam_Skills', 'Look_Skills'),
      contact: poseFrom(cloned, 'Cam_Contact', 'Look_Contact'),
    });
  }, [cloned, materials, onReady]);

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime);
    bodyMaterial.uniforms.uPulse.value = pulse;
    trimMaterial.uniforms.uPulse.value = pulse;
  });

  return <primitive object={cloned} />;
}

class EnvironmentBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function LoadingScreen({ progress }) {
  const amount = Math.max(4, Math.min(100, progress || 0));
  return (
    <Html fullscreen zIndexRange={[40, 0]}>
      <div className="val-loader">
        <div className="val-loader-copy">
          <p className="val-kicker">Deploying // Ascent</p>
          <h1>Akshay Suresh</h1>
          <p className="val-loader-meta">Radianite courtyard · {Math.round(amount)}%</p>
          <div className="val-bar" aria-hidden="true">
            <span style={{ width: `${amount}%` }} />
          </div>
        </div>
      </div>
    </Html>
  );
}

function BootLoader() {
  const { progress } = useProgress();
  return <LoadingScreen progress={progress} />;
}

function SceneContents({ onReady }) {
  return (
    <>
      <color attach="background" args={['#141a22']} />
      <fog attach="fog" args={['#141a22', 28, 78]} />
      <hemisphereLight args={['#c5ddf5', '#2a241c', 0.85]} />
      <directionalLight
        position={[10, 16, 7]}
        intensity={2.2}
        color="#d5e4f5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={64}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.00025}
        shadow-normalBias={0.04}
      />
      <Suspense fallback={<BootLoader />}>
        <MapModel onReady={onReady} />
        <EnvironmentBoundary>
          <Environment preset="city" environmentIntensity={1.15} />
        </EnvironmentBoundary>
      </Suspense>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur intensity={0.45} luminanceThreshold={1.05} luminanceSmoothing={0.25} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.25} darkness={0.55} />
      </EffectComposer>
    </>
  );
}

export default function ValorantScene() {
  const [waypoints, setWaypoints] = useState(null);
  const [booted, setBooted] = useState(false);

  const handleReady = useCallback((poses) => {
    setWaypoints((current) => current ?? poses);
    setBooted(true);
  }, []);

  return (
    <CameraRigProvider>
      <div className={`valorant-root${booted ? ' is-ready' : ''}`}>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [-17.2, 3.8, 5.4], fov: 46, near: 0.1, far: 90 }}
          gl={{
            antialias: false,
            toneMapping: THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <SceneContents onReady={handleReady} />
          <CameraController waypoints={waypoints} />
        </Canvas>
        {booted ? <GameMenu /> : null}
      </div>
    </CameraRigProvider>
  );
}

useGLTF.preload(MODEL_URL);
