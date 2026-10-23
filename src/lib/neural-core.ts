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
  /** Send a signal through the lattice: the core flares, the spokes light and the lattice breathes once. */
  pulse(): void;
}

export interface NeuralCoreOptions {
  /** Called when the visitor plays with the core, so the page can answer with sound. */
  onInteract?: (kind: 'grab' | 'release' | 'pulse') => void;
}

// Matches the framing Design Studio used to render the poster, so the crossfade does not jump.
const cameraHome = new Vector3(0, 1.25, 4.9);
const tilt = MathUtils.degToRad(6);

export async function createNeuralCore(host: HTMLElement, url: string, options: NeuralCoreOptions = {}): Promise<NeuralCore> {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  // Opaque, matching the poster's backdrop: with a transparent canvas three.js clears the glass's
  // transmission buffer to half-white, which turns the clear sphere milky. The CSS mask fades the edges.
  renderer.setClearColor(0x0b0b0c, 1);

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
  const filament = glow('iris_filament');
  // The GLB was exported in the teal Signal Glass palette; repaint the emissive parts to Launch Orange at runtime
  // so the model matches the poster without re-exporting.
  const paint = (entry: ReturnType<typeof glow>, hex: number) => {
    if (!entry) return;
    entry.material.color.setHex(hex);
    entry.material.emissive.setHex(hex);
  };
  paint(core, 0xff5b1f);
  paint(pulse, 0xff5b1f);
  paint(filament, 0xd7f65a);

  const canvas = renderer.domElement;
  canvas.className = 'core-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.append(canvas);
  const hit = document.createElement('div');
  hit.className = 'core-hit';
  host.append(hit);
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
  // Play state: a drag adds angular velocity that decays back to the idle drift; a click sends a wave (1 → 0).
  const idleSpin = 0.06;
  let velocity = idleSpin;
  let dragTilt = 0;
  let wave = 0;
  const drag = { active: false, id: -1, x: 0, y: 0, startX: 0, startY: 0, startedAt: 0, moved: false };

  const render = () => {
    frame = 0;
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.elapsedTime;
    if (!drag.active) velocity += (idleSpin - velocity) * Math.min(1, delta * 1.6);
    spin += delta * velocity;
    dragTilt *= Math.exp(-delta * (drag.active ? 0 : 2.4));
    wave = Math.max(0, wave - delta / 0.9);
    const flare = wave * wave;
    eased.x += (pointer.x - eased.x) * 0.06;
    eased.y += (pointer.y - eased.y) * 0.06;
    model.rotation.set(eased.y * tilt + dragTilt, spin + eased.x * tilt, 0);
    orbit.forEach(object => { object.rotation.y = elapsed * 0.05 + flare * 0.4; });
    // The pulse travels outwards: the lattice swells slightly as the wave passes.
    const swell = Math.sin(Math.min(1, (1 - wave) * 1.4) * Math.PI) * 0.06;
    lattice.forEach(object => object.scale.setScalar(1 + open * 0.15 + (wave ? swell : 0)));
    camera.position.copy(cameraHome).multiplyScalar(1 + open * 0.2);
    camera.lookAt(0, 0, 0);
    if (core) core.material.emissiveIntensity = core.base * (1 - open * 0.45) * (1 + flare * 1.6);
    if (pulse) pulse.material.emissiveIntensity = pulse.base * (0.7 + Math.sin(elapsed * 1.6) * 0.3 + flare * 2.2);
    if (filament) filament.material.emissiveIntensity = filament.base * (1 + flare * 1.2);
    renderer.render(scene, camera);
    if (!shown) {
      shown = true;
      host.classList.add('is-live');
    }
    if (running || wave > 0 || Math.abs(velocity - idleSpin) > 0.01) frame = requestAnimationFrame(render);
  };
  const wake = () => { if (shown && !frame) frame = requestAnimationFrame(render); };

  // Playing with the core: drag spins it (with inertia), a tap or click sends a pulse.
  const fire = () => {
    wave = 1;
    velocity += 0.5;
    options.onInteract?.('pulse');
    wake();
  };
  hit.addEventListener('pointerdown', event => {
    if (!shown || event.button !== 0) return;
    drag.active = true; drag.id = event.pointerId; drag.moved = false;
    drag.x = drag.startX = event.clientX; drag.y = drag.startY = event.clientY; drag.startedAt = performance.now();
    hit.setPointerCapture(event.pointerId);
    host.classList.add('is-grabbing');
    options.onInteract?.('grab');
  });
  hit.addEventListener('pointermove', event => {
    if (!drag.active || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag.x = event.clientX; drag.y = event.clientY;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) drag.moved = true;
    const size = Math.max(1, hit.clientWidth);
    spin += dx / size * Math.PI * 1.2;
    velocity = MathUtils.clamp(dx / size * Math.PI * 1.2 * 60, -6, 6);
    dragTilt = MathUtils.clamp(dragTilt + dy / size * Math.PI * 0.6, -0.5, 0.5);
    wake();
  });
  const release = (event: PointerEvent) => {
    if (!drag.active || event.pointerId !== drag.id) return;
    drag.active = false;
    host.classList.remove('is-grabbing');
    if (hit.hasPointerCapture(event.pointerId)) hit.releasePointerCapture(event.pointerId);
    if (!drag.moved && performance.now() - drag.startedAt < 400) fire();
    else options.onInteract?.('release');
    wake();
  };
  hit.addEventListener('pointerup', release);
  hit.addEventListener('pointercancel', release);

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
      if (!running) wake();
    },
    pulse: fire,
  };
}
