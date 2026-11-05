import {
  Clock, Mesh, NeutralToneMapping, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
  type Material, type MeshStandardMaterial, type Object3D,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { withBase } from './url';

export interface AgentObject {
  setRunning(running: boolean): void;
  /** Pointer position in -1..1 on both axes; 0,0 recentres the tilt. */
  setPointer(x: number, y: number): void;
}

const cameraHome = new Vector3(0, 0.15, 4.6);

/** Shares the New page's neural-core model, repainted in this page's build-tool yellow. */
export async function createAgentObject(host: HTMLElement): Promise<AgentObject> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();
  const camera = new PerspectiveCamera(36, 1, 0.1, 50);

  const gltf = await new GLTFLoader().loadAsync(withBase('models/hero-neural-core.glb')).catch((error) => {
    scene.environment?.dispose();
    renderer.dispose();
    throw error;
  });
  const model = gltf.scene;
  scene.add(model);

  const part = (name: string) => model.getObjectByName(name);
  const lattice = [part('lattice_nodes'), part('lattice_edges'), part('signal_spokes'), part('signal_pulses')].filter(Boolean) as Object3D[];
  const orbit = [part('orbit_ring'), part('orbit_beads')].filter(Boolean) as Object3D[];
  const glow = (name: string) => {
    let found: MeshStandardMaterial | undefined;
    model.traverse((node) => {
      if (found || !(node instanceof Mesh)) return;
      const materials: Material[] = Array.isArray(node.material) ? node.material : [node.material];
      found = materials.find((material) => material.name === name) as MeshStandardMaterial | undefined;
    });
    return found ? { material: found, base: found.emissiveIntensity } : undefined;
  };
  const core = glow('signal_core');
  const pulse = glow('signal_pulse');
  const filament = glow('iris_filament');
  // The GLB ships in the New page's Launch Orange; repaint the emissive parts to this page's yellow build accent.
  const paint = (entry: ReturnType<typeof glow>, hex: number) => {
    if (!entry) return;
    entry.material.color.setHex(hex);
    entry.material.emissive.setHex(hex);
  };
  paint(core, 0xfcee0a);
  paint(pulse, 0xfcee0a);
  paint(filament, 0xfcee0a);

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const resize = () => {
    const size = host.clientWidth;
    if (!size) return;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const clock = new Clock();
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  let running = false;
  let frame = 0;
  let shown = false;

  const render = () => {
    frame = 0;
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.elapsedTime;
    eased.x += (pointer.x - eased.x) * 0.05;
    eased.y += (pointer.y - eased.y) * 0.05;
    model.rotation.y = elapsed * 0.16 + eased.x * 0.4;
    model.rotation.x = eased.y * 0.22;
    orbit.forEach((object) => { object.rotation.y = elapsed * 0.1; });
    const breathe = 1 + Math.sin(elapsed * 0.6) * 0.015;
    lattice.forEach((object) => object.scale.setScalar(breathe));
    if (pulse) pulse.material.emissiveIntensity = pulse.base * (0.7 + Math.sin(elapsed * 1.6) * 0.3);
    camera.position.copy(cameraHome);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    if (!shown) {
      shown = true;
      host.classList.add('is-live');
    }
    if (running) frame = requestAnimationFrame(render);
  };

  return {
    setRunning(next) {
      if (next === running) return;
      running = next;
      if (running) {
        clock.getDelta();
        frame ||= requestAnimationFrame(render);
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    setPointer(x, y) {
      pointer.x = x;
      pointer.y = y;
    },
  };
}
