/**
 * Interface sound, synthesised with Web Audio so no files ship. Off until the visitor opts in: browsers block
 * autoplay anyway and unasked-for sound is hostile. Design Studio's sound spec sets the recipes and the ceiling.
 */
export type SfxName = 'hero-pulse' | 'grab' | 'release' | 'hub-pulse' | 'node-discover' | 'reveal-all' | 'card-open' | 'card-close';

interface Voice {
  type: OscillatorType;
  /** Start and end frequency in Hz; the sweep is exponential. */
  from: number; to: number;
  /** Attack, hold and release in milliseconds. */
  a: number; h: number; r: number;
  gain: number;
  /** Low-pass cutoff in Hz; omit for none. */
  lp?: number;
  /** Delay before the voice starts, ms. */
  at?: number;
}
interface Recipe { voices: Voice[]; /** Minimum gap between two plays, ms. */ gap: number; }

// Placeholder recipes until Design Studio's spec lands: short, low, no fanfares.
const recipes: Record<SfxName, Recipe> = {
  'hero-pulse': { gap: 120, voices: [
    { type: 'sine', from: 196, to: 98, a: 6, h: 60, r: 520, gain: 0.5, lp: 1200 },
    { type: 'triangle', from: 784, to: 1568, a: 4, h: 20, r: 260, gain: 0.08, lp: 3000, at: 30 },
  ] },
  grab: { gap: 200, voices: [{ type: 'sine', from: 330, to: 294, a: 4, h: 10, r: 70, gain: 0.08, lp: 1800 }] },
  release: { gap: 200, voices: [{ type: 'sine', from: 294, to: 330, a: 4, h: 10, r: 90, gain: 0.07, lp: 1800 }] },
  'hub-pulse': { gap: 160, voices: [
    { type: 'triangle', from: 220, to: 440, a: 8, h: 40, r: 420, gain: 0.22, lp: 2400 },
    { type: 'sine', from: 110, to: 110, a: 10, h: 120, r: 380, gain: 0.18, lp: 600 },
  ] },
  'node-discover': { gap: 45, voices: [{ type: 'sine', from: 1046, to: 1318, a: 2, h: 18, r: 70, gain: 0.07, lp: 4000 }] },
  'reveal-all': { gap: 600, voices: [
    { type: 'sine', from: 196, to: 392, a: 20, h: 200, r: 700, gain: 0.2, lp: 1600 },
    { type: 'triangle', from: 587, to: 1174, a: 20, h: 100, r: 600, gain: 0.06, lp: 3200, at: 120 },
  ] },
  'card-open': { gap: 80, voices: [{ type: 'sine', from: 660, to: 880, a: 2, h: 14, r: 60, gain: 0.06, lp: 3000 }] },
  'card-close': { gap: 80, voices: [{ type: 'sine', from: 880, to: 660, a: 2, h: 14, r: 60, gain: 0.05, lp: 3000 }] },
};
const CEILING = 0.28;
const STORAGE = 'portfolio-sound';

let context: AudioContext | undefined;
let master: GainNode | undefined;
let enabled = false;
const lastPlayed = new Map<SfxName, number>();
const listeners = new Set<(on: boolean) => void>();
try { enabled = localStorage.getItem(STORAGE) === 'on'; } catch { /* storage is optional */ }

const ensure = () => {
  if (!('AudioContext' in window)) return undefined;
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = CEILING;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') void context.resume();
  return context;
};

const voice = (ctx: AudioContext, v: Voice) => {
  const t0 = ctx.currentTime + (v.at ?? 0) / 1000;
  const osc = ctx.createOscillator();
  osc.type = v.type;
  osc.frequency.setValueAtTime(v.from, t0);
  const end = t0 + (v.a + v.h + v.r) / 1000;
  if (v.to !== v.from) osc.frequency.exponentialRampToValueAtTime(v.to, end);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(v.gain, t0 + v.a / 1000);
  env.gain.setValueAtTime(v.gain, t0 + (v.a + v.h) / 1000);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  let tail: AudioNode = env;
  if (v.lp) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = v.lp;
    env.connect(filter);
    tail = filter;
  }
  osc.connect(env);
  tail.connect(master!);
  osc.start(t0);
  osc.stop(end + 0.02);
  osc.onended = () => { osc.disconnect(); env.disconnect(); tail.disconnect(); };
};

export const sfx = {
  get enabled() { return enabled; },
  setEnabled(on: boolean) {
    enabled = on;
    try { localStorage.setItem(STORAGE, on ? 'on' : 'off'); } catch { /* storage is optional */ }
    if (on) ensure();
    else if (context?.state === 'running') void context.suspend();
    listeners.forEach(fn => fn(on));
  },
  toggle() { sfx.setEnabled(!enabled); },
  onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => listeners.delete(fn); },
  play(name: SfxName) {
    if (!enabled) return;
    const recipe = recipes[name];
    const now = performance.now();
    if (now - (lastPlayed.get(name) ?? -Infinity) < recipe.gap) return;
    lastPlayed.set(name, now);
    const ctx = ensure();
    if (!ctx) return;
    recipe.voices.forEach(v => voice(ctx, v));
  },
};
