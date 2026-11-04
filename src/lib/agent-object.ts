import {
  Clock, IcosahedronGeometry, Mesh, MeshPhysicalMaterial, NeutralToneMapping, MathUtils, PerspectiveCamera,
  PMREMGenerator, RingGeometry, Scene, SRGBColorSpace, TorusGeometry, Vector3, WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface AgentObject {
  setRunning(running: boolean): void;
  /** Pointer position in -1..1 on both axes; 0,0 recentres the tilt. */
  setPointer(x: number, y: number): void;
}

const cameraHome = new Vector3(0, 0.2, 3.4);

/** A small original, procedural object: a faceted graphite core inside a yellow accent ring. */
export async function createAgentObject(host: HTMLElement): Promise<AgentObject> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();
  const camera = new PerspectiveCamera(36, 1, 0.1, 50);

  const core = new Mesh(
    new IcosahedronGeometry(1, 1),
    new MeshPhysicalMaterial({ color: 0x15151a, metalness: 0.75, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12 })
  );
  scene.add(core);

  const ring = new Mesh(
    new TorusGeometry(1.65, 0.035, 16, 96),
    new MeshPhysicalMaterial({ color: 0xfcee0a, emissive: 0xfcee0a, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.3 })
  );
  ring.rotation.x = MathUtils.degToRad(72);
  scene.add(ring);

  const halo = new Mesh(
    new RingGeometry(1.9, 1.94, 96),
    new MeshPhysicalMaterial({ color: 0xfcee0a, transparent: true, opacity: 0.18, metalness: 0, roughness: 1 })
  );
  halo.rotation.x = ring.rotation.x;
  scene.add(halo);

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
    core.rotation.y = elapsed * 0.22 + eased.x * 0.4;
    core.rotation.x = eased.y * 0.25;
    ring.rotation.z = elapsed * 0.08;
    halo.rotation.z = -elapsed * 0.05;
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
