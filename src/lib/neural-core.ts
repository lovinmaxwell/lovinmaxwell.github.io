import {
  Clock, NeutralToneMapping, MathUtils, Mesh, PerspectiveCamera, PMREMGenerator, Scene, SRGBColorSpace, Vector3, WebGLRenderer,
  type Material, type MeshStandardMaterial, type Object3D,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface NeuralCore {
  setRunning(running: boolean): void;
  /** Pointer position in -1..1 on both axes; 0,0 recentres the tilt. */
  setPointer(x: number, y: number): void;
  /** 0 = hero framing, 1 = About framing: the camera dollies back and the lattice opens. */
  setOpen(amount: number): void;
}

// Matches the framing Design Studio used to render the poster, so the crossfade does not jump.
const cameraHome = new Vector3(0, 1.25, 4.9);
const tilt = MathUtils.degToRad(6);

export async function createNeuralCore(host: HTMLElement, url: string): Promise<NeuralCore> {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  // Opaque, matching the poster's backdrop: with a transparent canvas three.js clears the glass's
  // transmission buffer to half-white, which turns the clear sphere milky. The CSS mask fades the edges.
  renderer.setClearColor(0x08090d, 1);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // The room is far brighter than the dark studio the poster was lit in; keep chrome graphite and the glass clear.
  scene.environmentIntensity = 0.32;
  pmrem.dispose();
  const camera = new PerspectiveCamera(38, 1, 0.1, 50);

  const gltf = await new GLTFLoader().loadAsync(url).catch(error => {
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
    model.traverse(node => {
      if (found || !(node instanceof Mesh)) return;
      const materials: Material[] = Array.isArray(node.material) ? node.material : [node.material];
      found = materials.find(material => material.name === name) as MeshStandardMaterial | undefined;
    });
    return found ? { material: found, base: found.emissiveIntensity } : undefined;
  };
  const core = glow('signal_core');
  const pulse = glow('signal_pulse');

  const canvas = renderer.domElement;
  canvas.className = 'core-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const resize = () => {
    const size = host.clientWidth;
    if (!size) return;
    renderer.setSize(size, size, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const clock = new Clock();
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  let open = 0;
  let spin = 0;
  let running = false;
  let frame = 0;
  let shown = false;

  const render = () => {
    frame = 0;
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.elapsedTime;
    spin += delta * 0.06;
    eased.x += (pointer.x - eased.x) * 0.06;
    eased.y += (pointer.y - eased.y) * 0.06;
    model.rotation.set(eased.y * tilt, spin + eased.x * tilt, 0);
    orbit.forEach(object => { object.rotation.y = elapsed * 0.05; });
    lattice.forEach(object => object.scale.setScalar(1 + open * 0.15));
    camera.position.copy(cameraHome).multiplyScalar(1 + open * 0.2);
    camera.lookAt(0, 0, 0);
    if (core) core.material.emissiveIntensity = core.base * (1 - open * 0.45);
    if (pulse) pulse.material.emissiveIntensity = pulse.base * (0.7 + Math.sin(elapsed * 1.6) * 0.3);
    renderer.render(scene, camera);
    if (!shown) {
      shown = true;
      host.classList.add('is-live');
    }
    if (running) frame = requestAnimationFrame(render);
  };

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    host.classList.remove('is-live');
    shown = false;
  });
  canvas.addEventListener('webglcontextrestored', () => { if (running && !frame) frame = requestAnimationFrame(render); });

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
    setOpen(amount) {
      open = MathUtils.clamp(amount, 0, 1);
      if (!running && shown && !frame) frame = requestAnimationFrame(render);
    },
  };
}
