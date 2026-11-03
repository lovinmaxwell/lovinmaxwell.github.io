/**
 * Interface sound. Seven short files from Design Studio's sound spec (2026-10-24), all on one D/A open fifth so
 * overlapping cues never clash. Off until the visitor opts in: browsers block autoplay anyway and unasked-for sound
 * is hostile. Nothing is fetched until sound is turned on; the AudioContext is created on that first gesture.
 */
export type SfxName = 'hero-pulse' | 'hub-pulse' | 'node-discover' | 'reveal-all' | 'card-open' | 'scene-shift' | 'timeline-step';
export type Branch = 'app' | 'integrate' | 'cloud' | 'ai';

export interface PlayOptions {
  /** Branch pitch: hub and node cues are the same file at a different rate, so the branches are told apart. */
  branch?: Branch;
  /** Start this many milliseconds from now, for lining a cue up with a visual arrival. */
  delay?: number;
  /** Linear gain multiplier on top of the file's mastered level. */
  gain?: number;
  /** Explicit playbackRate (wins over branch): the timeline climbs a step per milestone, going back drops a tone. */
  rate?: number;
}

/** Per-branch playbackRate: unison, +2, -2 and +5 semitones, all inside the D/A set. */
export const BRANCH_RATE: Record<Branch, number> = { app: 1, integrate: 1.122, cloud: 0.891, ai: 1.335 };

interface Rule {
  /** Minimum gap between two triggers, ms. */
  window: number;
  /** Simultaneous voices allowed. */
  voices: number;
  /** What happens over the limit: drop the new trigger, steal the oldest voice, or restart. */
  over: 'drop' | 'steal' | 'restart';
  /** Random ±15 cents and ±1 dB per trigger so repeats never sound mechanical. */
  vary: boolean;
  /** Only the cues whose visuals still animate under reduced motion. */
  reducedOk: boolean;
}
const RULES: Record<SfxName, Rule> = {
  'hero-pulse': { window: 250, voices: 2, over: 'drop', vary: true, reducedOk: false },
  'hub-pulse': { window: 200, voices: 2, over: 'steal', vary: true, reducedOk: false },
  'node-discover': { window: 90, voices: 3, over: 'drop', vary: true, reducedOk: true },
  'reveal-all': { window: Infinity, voices: 1, over: 'drop', vary: false, reducedOk: false },
  'card-open': { window: 120, voices: 1, over: 'restart', vary: false, reducedOk: true },
  // Scrubbing through chapters steals the previous shift instead of stacking; the classic page has no crossfade to follow.
  'scene-shift': { window: 350, voices: 1, over: 'steal', vary: true, reducedOk: false },
  // A quiet stop per milestone; dragging fast across the timeline drops the ones that land inside the window.
  'timeline-step': { window: 110, voices: 2, over: 'drop', vary: true, reducedOk: true },
};
const NAMES = Object.keys(RULES) as SfxName[];
const MASTER = 0.5;
const STORAGE = 'portfolio-sound';
const SOUND_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/sound/`;

interface Voice { source: AudioBufferSourceNode; gain: GainNode; startedAt: number; }

let context: AudioContext | undefined;
let master: GainNode | undefined;
let duck: GainNode | undefined;
let enabled = false;
let loading: Promise<void> | undefined;
const buffers = new Map<SfxName, AudioBuffer>();
const lastPlayed = new Map<SfxName, number>();
const active = new Map<SfxName, Voice[]>();
const discoverBurst: number[] = [];
let discoverMutedUntil = 0;
const listeners = new Set<(on: boolean) => void>();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
try { enabled = localStorage.getItem(STORAGE) === 'on'; } catch { /* storage is optional */ }

const format = (() => {
  try {
    const probe = document.createElement('audio');
    return probe.canPlayType('audio/ogg; codecs=opus') ? 'ogg' : 'mp3';
  } catch { return 'mp3'; }
})();

const ensure = () => {
  if (!('AudioContext' in window)) return undefined;
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = MASTER;
    duck = context.createGain();
    duck.connect(master).connect(context.destination);
  }
  if (context.state === 'suspended') void context.resume();
  return context;
};

const load = () => {
  const ctx = ensure();
  if (!ctx) return Promise.resolve();
  loading ??= Promise.all(NAMES.filter(name => !buffers.has(name)).map(async name => {
    try {
      const response = await fetch(`${SOUND_BASE}${name}.${format}`);
      if (!response.ok) return;
      buffers.set(name, await ctx.decodeAudioData(await response.arrayBuffer()));
    } catch (error) {
      console.warn(`Sound ${name} did not load.`, error);
    }
  })).then(() => undefined);
  return loading;
};

const stop = (voice: Voice, fadeMs: number) => {
  if (!context) return;
  const now = context.currentTime;
  voice.gain.gain.cancelScheduledValues(now);
  voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
  voice.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
  voice.source.stop(now + fadeMs / 1000 + 0.005);
};

const start = (name: SfxName, options: PlayOptions) => {
  const ctx = ensure();
  const buffer = buffers.get(name);
  if (!ctx || !buffer || !duck) return;
  // A context the browser has not let run yet (a returning visitor who has only scrolled) would queue every cue and
  // release them all on the first click. Those cues are dropped instead; ensure() has already asked it to resume.
  if (ctx.state !== 'running') return;
  const rule = RULES[name];
  const voices = active.get(name) ?? [];
  if (voices.length >= rule.voices) {
    if (rule.over === 'drop') return;
    const oldest = voices.shift()!;
    stop(oldest, rule.over === 'steal' ? 30 : 5);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = options.rate ?? (options.branch ? BRANCH_RATE[options.branch] : 1);
  if (rule.vary) source.detune.value = Math.random() * 30 - 15;
  const gain = ctx.createGain();
  gain.gain.value = (options.gain ?? 1) * (rule.vary ? 10 ** ((Math.random() * 2 - 1) / 20) : 1);
  source.connect(gain).connect(duck);
  const at = ctx.currentTime + Math.max(0, options.delay ?? 0) / 1000;
  source.start(at);
  const voice: Voice = { source, gain, startedAt: at };
  voices.push(voice);
  active.set(name, voices);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
    const list = active.get(name);
    if (list) active.set(name, list.filter(v => v !== voice));
  };
  if (name === 'reveal-all') {
    // Other cues sit back while the swell plays.
    duck.gain.setValueAtTime(1, at);
    duck.gain.linearRampToValueAtTime(0.6, at + 0.05);
    duck.gain.setValueAtTime(0.6, at + buffer.duration - 0.2);
    duck.gain.linearRampToValueAtTime(1, at + buffer.duration);
  }
};

export const sfx = {
  get enabled() { return enabled; },
  /** Whether a cue would play right now: callers use this to line visuals up with the sound. */
  wouldPlay(name: SfxName) { return enabled && (!reduced.matches || RULES[name].reducedOk); },
  setEnabled(on: boolean) {
    enabled = on;
    try { localStorage.setItem(STORAGE, on ? 'on' : 'off'); } catch { /* storage is optional */ }
    if (on) {
      // Let the visitor hear what they just turned on: one quiet tick.
      void load()?.then(() => { lastPlayed.delete('node-discover'); start('node-discover', { gain: 0.5 }); });
    } else if (context?.state === 'running') {
      void context.suspend();
    }
    listeners.forEach(fn => fn(on));
  },
  toggle() { sfx.setEnabled(!enabled); },
  onChange(fn: (on: boolean) => void) { listeners.add(fn); return () => listeners.delete(fn); },
  /** Warm the context and buffers on a return visit (call from a user gesture). */
  prime() { if (enabled) void load(); },
  play(name: SfxName, options: PlayOptions = {}) {
    if (!sfx.wouldPlay(name)) return;
    const rule = RULES[name];
    const now = performance.now();
    if (now - (lastPlayed.get(name) ?? -Infinity) < rule.window) return;
    if (name === 'node-discover') {
      // A fast hover sweep goes quiet instead of chattering: more than six in a second mutes the rest of that second.
      if (now < discoverMutedUntil) return;
      while (discoverBurst.length && now - discoverBurst[0] > 1000) discoverBurst.shift();
      discoverBurst.push(now);
      if (discoverBurst.length > 6) { discoverMutedUntil = discoverBurst[0] + 1000; discoverBurst.length = 0; return; }
    }
    lastPlayed.set(name, now);
    if (buffers.has(name)) start(name, options);
    else void load()?.then(() => start(name, { ...options, delay: Math.max(0, (options.delay ?? 0) - (performance.now() - now)) }));
  },
};

document.addEventListener('visibilitychange', () => { if (document.hidden && context?.state === 'running') void context.suspend(); });
