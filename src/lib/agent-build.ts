// Agent-build demo: makes the page look like it is being assembled live by a swarm of
// design-tool agents. Every visual effect here is purely additive overlay chrome — the
// real DOM is never reordered or removed, so this can be skipped or disabled at any point
// without the page ever being in a broken state.

const SESSION_KEY = 'ab-skip';
const CURSOR_COLORS = ['#fcee0a', '#60a5fa', '#f472b6', '#4ade80', '#c084fc', '#fb923c', '#22d3ee'];
const AGENT_NAMES = [
  'Nova', 'Juno', 'Echo', 'Pixel', 'Orbit', 'Flux', 'Sable', 'Quill', 'Rune', 'Dash',
  'Vex', 'Iris', 'Zephyr', 'Onyx', 'Cosmo', 'Reef', 'Blaze', 'Skye', 'Thorn', 'Wren',
];

type LayerKind = 'heading' | 'text' | 'button' | 'image';

interface PageLayer {
  el: HTMLElement;
  kind: LayerKind;
}

interface Agent {
  name: string;
  color: string;
  el: HTMLElement;
  x: number;
  y: number;
  tx: number;
  ty: number;
  busy: boolean;
  nextWanderAt: number;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobile(): boolean {
  return window.matchMedia('(width < 40rem)').matches;
}

function canHover(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function finishImmediately(sections: HTMLElement[]): void {
  for (const section of sections) {
    section.classList.remove('ab-building');
    section.querySelectorAll<HTMLElement>('[data-ab-layer]').forEach((el) => {
      el.classList.add('ab-built');
    });
  }
}

function classify(el: HTMLElement): LayerKind {
  const tag = el.tagName;
  if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4') return 'heading';
  if (tag === 'IMG') return 'image';
  if (tag === 'BUTTON' || (tag === 'A' && el.classList.contains('btn'))) return 'button';
  return 'text';
}

/**
 * Picks the outermost elements matching the layer selector, never a descendant of an
 * already-picked one. Pure read (no DOM writes): run() batches the data-ab-layer/ab-building
 * writes separately afterwards so this never forces a layout read/write interleave across sections.
 */
function discoverLayers(section: HTMLElement, picked: Set<HTMLElement>): PageLayer[] {
  const candidates = section.querySelectorAll<HTMLElement>('h1, h2, h3, h4, p, a, button, img, li, blockquote');
  const layers: PageLayer[] = [];
  for (const el of Array.from(candidates)) {
    let nested = false;
    for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (picked.has(ancestor)) {
        nested = true;
        break;
      }
    }
    if (nested) continue;
    // Decorative content (e.g. the hero's rotating tagline) manages its own visibility
    // independently of build state; forcing it to opacity: 1 would fight that.
    if (el.closest('[aria-hidden="true"]')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    picked.add(el);
    layers.push({ el, kind: classify(el) });
  }
  return layers;
}

function resetPageForReplay(sections: HTMLElement[]): void {
  sessionStorage.removeItem(SESSION_KEY);
  for (const section of sections) {
    delete section.dataset.abDone;
    section.classList.remove('ab-building');
    section.querySelectorAll<HTMLElement>('[data-ab-layer]').forEach((el) => {
      el.classList.remove('ab-built');
      el.removeAttribute('data-ab-layer');
    });
  }
}

function positionBox(el: HTMLElement, rect: Rect): void {
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

/**
 * Overlay chrome (select boxes, guides, headline ghosts, typing carets, drop markers) is
 * positioned from a live target element's rect, not a one-off snapshot, so it stays attached
 * to its layer while the visitor scrolls past it mid-build. motionTick's rAF loop calls
 * syncTrackedBoxes() every frame; reads happen before writes so one element's position write
 * never forces a layout recalc before the next element's rect read.
 */
const trackedBoxes = new Map<HTMLElement, { target: HTMLElement; kind: 'box' | 'h' | 'v' | 'point' }>();

function trackBox(el: HTMLElement, target: HTMLElement, kind: 'box' | 'h' | 'v' | 'point' = 'box'): void {
  trackedBoxes.set(el, { target, kind });
}

function untrackBox(el: HTMLElement): void {
  trackedBoxes.delete(el);
}

function syncTrackedBoxes(): void {
  if (trackedBoxes.size === 0) return;
  const updates: Array<[HTMLElement, Rect, 'box' | 'h' | 'v' | 'point']> = [];
  for (const [el, { target, kind }] of trackedBoxes) updates.push([el, target.getBoundingClientRect(), kind]);
  for (const [el, rect, kind] of updates) {
    if (kind === 'box') positionBox(el, rect);
    else if (kind === 'h') el.style.top = `${rect.top}px`;
    else if (kind === 'v') el.style.left = `${rect.left}px`;
    else {
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.top + rect.height / 2}px`;
    }
  }
}

export function initAgentBuild(): void {
  const root = document.querySelector<HTMLElement>('main#main');
  if (!root) return;
  if (prefersReducedMotion()) return;

  const sections = Array.from(root.querySelectorAll<HTMLElement>(':scope > section'));
  if (sections.length === 0) return;

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    mountReplayAffordance(sections);
    return;
  }

  run(sections);
}

function mountReplayAffordance(sections: HTMLElement[]): void {
  const pill = buildPill();
  pill.agentsWrap.style.display = 'none';
  pill.tourBtn.style.display = 'none';
  pill.speedBtn.style.display = 'none';
  pill.skipBtn.style.display = 'none';
  pill.replayBtn.style.display = '';
  document.body.appendChild(pill.el);
  pill.replayBtn.addEventListener('click', () => {
    pill.el.remove();
    resetPageForReplay(sections);
    run(sections);
  });
}

function run(sections: HTMLElement[]): void {
  const overlay = document.createElement('div');
  overlay.className = 'ab-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);

  const pill = buildPill();
  document.body.appendChild(pill.el);

  // Whole-page honest counting: discover every layer on the page up front, before any building
  // starts, so the counter and progress are never per-section guesses. Reads and writes are kept
  // in separate passes (read all rects, then write all attributes, then write all classes) so
  // discovering one section's layers never forces a layout recalc off a previous section's
  // freshly-hidden elements.
  const sectionLayers = new Map<HTMLElement, PageLayer[]>();
  let totalLayers = 0;
  const pickedLayers = new Set<HTMLElement>();
  for (const section of sections) {
    const layers = discoverLayers(section, pickedLayers);
    sectionLayers.set(section, layers);
    totalLayers += layers.length;
  }
  for (const el of pickedLayers) el.setAttribute('data-ab-layer', '');
  for (const section of sections) section.classList.add('ab-building');

  let builtLayers = 0;
  let sectionsCompleted = 0;
  let speed = 1;
  let boost = 1;
  let skipped = false;
  let done = false;

  const mobile = isMobile();
  const poolSize = mobile ? 6 : AGENT_NAMES.length;
  const concurrency = mobile ? 4 : 18;

  const agents: Agent[] = Array.from({ length: poolSize }, (_, i) => {
    const name = AGENT_NAMES[i % AGENT_NAMES.length]!;
    const color = CURSOR_COLORS[i % CURSOR_COLORS.length]!;
    const el = buildAgentCursorEl(name, color);
    overlay.appendChild(el);
    // nextWanderAt starts at Infinity, not now: motionTick's first rAF must not immediately
    // call scheduleWander and fight openingBurst's synchronous centered placement below.
    return { name, color, el, x: 0, y: 0, tx: 0, ty: 0, busy: false, nextWanderAt: Infinity };
  });

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms / (speed * boost)));
  }

  let waitingForScroll = false;

  function updatePill(): void {
    const active = agents.filter((a) => a.busy).length;
    waitingForScroll = active === 0 && sectionsCompleted > 0 && sectionsCompleted < sections.length && !done;
    if (waitingForScroll) {
      pill.agents.textContent = 'Scroll to keep building';
      pill.tourBtn.classList.add('is-emphasized');
    } else {
      pill.agents.textContent = `${active} agents`;
      pill.tourBtn.classList.remove('is-emphasized');
    }
    pill.layers.textContent = `${builtLayers} / ${totalLayers} layers`;
    const pct = totalLayers === 0 ? 0 : Math.round((builtLayers / totalLayers) * 100);
    pill.progressFill.style.setProperty('--ab-progress', `${pct}%`);
  }

  function onProgress(): void {
    builtLayers++;
    updatePill();
  }

  let motionRaf = 0;
  let pointer: { x: number; y: number } | null = null;

  function motionTick(): void {
    const now = performance.now();
    boost = Math.max(1, boost - 0.012);
    for (const a of agents) {
      if (!a.busy && now >= a.nextWanderAt) scheduleWander(a, now);
      a.x += (a.tx - a.x) * 0.14;
      a.y += (a.ty - a.y) * 0.14;
      a.el.style.transform = `translate(${a.x}px, ${a.y}px)`;
    }
    syncTrackedBoxes();
    motionRaf = requestAnimationFrame(motionTick);
  }

  function scheduleWander(a: Agent, now: number): void {
    a.nextWanderAt = now + 900 + Math.random() * 1400;
    const vw = window.innerWidth;
    if (waitingForScroll) {
      a.tx = Math.random() * vw;
      a.ty = window.innerHeight - 36 + Math.random() * 24;
      return;
    }
    const topBand = 80 + Math.random() * Math.min(window.innerHeight - 160, 520);
    const r = Math.random();
    if (pointer && r < 0.3) {
      a.tx = pointer.x + (Math.random() - 0.5) * 160;
      a.ty = pointer.y + (Math.random() - 0.5) * 120;
    } else if (r < 0.55) {
      const others = agents.filter((o) => o !== a && !o.busy);
      const lead = others[Math.floor(Math.random() * others.length)];
      if (lead) {
        a.tx = lead.tx + (Math.random() - 0.5) * 70;
        a.ty = lead.ty + (Math.random() - 0.5) * 70;
      } else {
        a.tx = Math.random() * vw;
        a.ty = topBand;
      }
    } else {
      a.tx = Math.random() * vw;
      a.ty = topBand;
    }
  }

  function pickIdleAgent(): Agent | undefined {
    const idle = agents.filter((a) => !a.busy);
    return idle[Math.floor(Math.random() * idle.length)];
  }

  async function buildLayer(layer: PageLayer, agent: Agent): Promise<void> {
    const rect = layer.el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) {
      if (!layer.el.classList.contains('ab-built')) {
        layer.el.classList.add('ab-built');
        onProgress();
      }
      return;
    }

    agent.busy = true;
    agent.tx = rect.left + 6;
    agent.ty = rect.top + 6;
    updatePill();
    await wait(1300 + Math.random() * 900);

    const select = buildSelectBox();
    overlay.appendChild(select.el);
    positionBox(select.el, rect);
    trackBox(select.el, layer.el, 'box');
    select.badge.textContent = `${Math.round(rect.width)} x ${Math.round(rect.height)}`;
    select.el.classList.add('is-on');

    const guides = buildGuides(rect);
    overlay.appendChild(guides.h);
    overlay.appendChild(guides.v);
    trackBox(guides.h, layer.el, 'h');
    trackBox(guides.v, layer.el, 'v');
    requestAnimationFrame(() => {
      guides.h.classList.add('is-on');
      guides.v.classList.add('is-on');
    });

    if (Math.random() < 0.15) {
      untrackBox(select.el);
      select.el.classList.add('is-wrong');
      const off = 12 + Math.random() * 10;
      positionBox(select.el, { left: rect.left - off, top: rect.top - off / 2, width: rect.width + off, height: rect.height + off / 2 });
      await wait(1000 + Math.random() * 500);
      select.el.classList.remove('is-wrong');
      positionBox(select.el, layer.el.getBoundingClientRect());
      trackBox(select.el, layer.el, 'box');
    }

    await wait(2000 + Math.random() * 1100);
    guides.h.classList.remove('is-on');
    guides.v.classList.remove('is-on');

    if (layer.kind === 'heading') await revealHeading(layer.el, rect, overlay, agent.color, wait);
    else if (layer.kind === 'text') await revealText(layer.el, rect, overlay, wait);
    else if (layer.kind === 'button') await revealButton(layer.el, rect, overlay, agent.color, wait);
    else await revealGeneric(rect, overlay, wait);

    select.el.classList.remove('is-on');
    await wait(550 + Math.random() * 400);
    untrackBox(select.el);
    untrackBox(guides.h);
    untrackBox(guides.v);
    select.el.remove();
    guides.h.remove();
    guides.v.remove();

    if (!layer.el.classList.contains('ab-built')) {
      layer.el.classList.add('ab-built');
      onProgress();
    }
    agent.busy = false;
    updatePill();
  }

  const cancelledSections = new Set<HTMLElement>();

  async function buildSection(section: HTMLElement): Promise<void> {
    if (section.dataset.abDone) return;
    section.dataset.abDone = '1';

    const layers = sectionLayers.get(section) ?? [];
    const workerCount = Math.max(1, Math.min(concurrency, layers.length));
    let i = 0;

    const workers = Array.from({ length: workerCount }, () =>
      (async () => {
        while (true) {
          if (cancelledSections.has(section)) break;
          if (i >= layers.length) break;
          const layer = layers[i++]!;

          let agent = pickIdleAgent();
          while (!agent) {
            if (cancelledSections.has(section)) return;
            await wait(60);
            agent = pickIdleAgent();
          }
          if (cancelledSections.has(section)) return;
          await buildLayer(layer, agent);
        }
      })(),
    );
    await Promise.all(workers);
    section.classList.remove('ab-building');
    sectionsCompleted++;
    updatePill();
    if (sectionsCompleted === sections.length) finish(false);
  }

  function fastFinishSection(section: HTMLElement): void {
    if (section.dataset.abDone !== '1' || !section.classList.contains('ab-building')) return;
    cancelledSections.add(section);
    const layers = sectionLayers.get(section) ?? [];
    for (const layer of layers) {
      if (!layer.el.classList.contains('ab-built')) {
        layer.el.classList.add('ab-built');
        onProgress();
      }
    }
    section.classList.remove('ab-building');
    sectionsCompleted++;
    if (sectionsCompleted === sections.length) finish(false);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) void buildSection(entry.target as HTMLElement);
        else fastFinishSection(entry.target as HTMLElement);
      }
    },
    { rootMargin: '200px 0px -10% 0px', threshold: 0.1 },
  );
  for (const section of sections) observer.observe(section);

  let lastScrollY = window.scrollY;
  let lastScrollT = performance.now();
  window.addEventListener(
    'scroll',
    () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      const dt = Math.max(16, now - lastScrollT);
      if (dy / dt > 1.2) boost = Math.min(5, boost + 1.5);
      lastScrollY = window.scrollY;
      lastScrollT = now;
    },
    { passive: true },
  );

  if (canHover() && !mobile) {
    window.addEventListener(
      'pointermove',
      (event) => {
        pointer = { x: event.clientX, y: event.clientY };
        for (const a of agents) {
          if (a.busy) continue;
          const dx = a.x - event.clientX;
          const dy = a.y - event.clientY;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.01 && dist < 120) {
            a.tx = a.x + (dx / dist) * 90;
            a.ty = a.y + (dy / dist) * 70;
            a.nextWanderAt = performance.now() + 700;
          }
        }
      },
      { passive: true },
    );
  }

  let touring = false;
  let tourRaf = 0;
  function stopTour(): void {
    touring = false;
    if (tourRaf) cancelAnimationFrame(tourRaf);
    pill.tourBtn.textContent = 'Tour';
  }
  function startTour(): void {
    touring = true;
    pill.tourBtn.textContent = 'Stop';
    const start = window.scrollY;
    const end = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const distance = Math.max(0, end - start);
    const duration = Math.max(6000, Math.min(22000, distance * 10));
    const t0 = performance.now();
    const step = (now: number) => {
      if (!touring) return;
      const p = Math.min(1, (now - t0) / duration);
      window.scrollTo({ top: start + distance * p, behavior: 'instant' });
      if (p < 1) tourRaf = requestAnimationFrame(step);
      else stopTour();
    };
    tourRaf = requestAnimationFrame(step);
  }
  pill.tourBtn.addEventListener('click', () => (touring ? stopTour() : startTour()));
  for (const evt of ['wheel', 'touchstart', 'keydown']) {
    window.addEventListener(evt, () => touring && stopTour(), { passive: true });
  }

  pill.speedBtn.addEventListener('click', () => {
    speed = speed === 1 ? 2 : 1;
    pill.speedBtn.textContent = `${speed}x`;
  });

  function skip(): void {
    if (skipped || done) return;
    skipped = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    finishImmediately(sections);
    builtLayers = totalLayers;
    finish(true);
  }
  pill.skipBtn.addEventListener('click', skip);

  function finish(wasSkipped: boolean): void {
    if (done) return;
    done = true;
    // Sections finish early during the Tour (fastFinishSection races ahead of the scroll
    // as each section passes the viewport), so a natural completion here must not cut the
    // scroll off before it reaches the real end of the page. Skip is the one case that must
    // stay instant, so only it forces the tour to stop.
    if (wasSkipped) stopTour();
    cancelAnimationFrame(motionRaf);
    overlay.remove();
    sessionStorage.setItem(SESSION_KEY, '1');
    updatePill();
    pill.tourBtn.style.display = 'none';
    pill.speedBtn.style.display = 'none';
    pill.skipBtn.style.display = 'none';
    pill.replayBtn.style.display = '';
    void wasSkipped;
  }
  pill.replayBtn.addEventListener('click', () => {
    pill.el.remove();
    resetPageForReplay(sections);
    run(sections);
  });

  motionRaf = requestAnimationFrame(motionTick);
  void openingBurst(overlay, agents, wait);
}

async function openingBurst(overlay: HTMLElement, agents: Agent[], wait: (ms: number) => Promise<void>): Promise<void> {
  // ab-opening hides decorative chrome (the hero tagline) that manages its own visibility,
  // so the page is truly empty while the tile holds centre stage.
  document.body.classList.add('ab-opening');

  const brand = document.querySelector<HTMLElement>('a[href="#top"]');
  const tile = document.createElement('div');
  tile.className = 'ab-logo-tile';
  tile.textContent = brand?.textContent?.trim() || '';
  overlay.appendChild(tile);

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (const a of agents) {
    a.x = cx;
    a.y = cy;
    a.tx = cx;
    a.ty = cy;
    a.el.style.opacity = '0';
  }

  // Tile alone, held, before anything else appears.
  requestAnimationFrame(() => tile.classList.add('is-on'));
  await wait(1000);

  tile.classList.add('is-out');
  for (const a of agents) a.el.style.opacity = '1';
  for (const a of agents) {
    a.tx = cx + (Math.random() - 0.5) * Math.min(900, window.innerWidth * 0.8);
    a.ty = cy + (Math.random() - 0.5) * 420;
  }
  document.body.classList.remove('ab-opening');
  await wait(260);
  tile.remove();

  // Natural wander cadence resumes only now, so motionTick can't race the burst above.
  const resumeAt = performance.now();
  for (const a of agents) a.nextWanderAt = resumeAt + 600 + Math.random() * 1200;
}

async function revealGeneric(rect: Rect, overlay: HTMLElement, wait: (ms: number) => Promise<void>): Promise<void> {
  const sk = document.createElement('div');
  sk.className = 'ab-skeleton';
  overlay.appendChild(sk);
  positionBox(sk, rect);
  sk.classList.add('is-on');
  await wait(2000 + Math.random() * 1000);
  sk.remove();
}

async function revealHeading(
  el: HTMLElement,
  rect: Rect,
  overlay: HTMLElement,
  color: string,
  wait: (ms: number) => Promise<void>,
): Promise<void> {
  const cs = getComputedStyle(el);
  const ghost = document.createElement('div');
  ghost.className = 'ab-ghost';
  ghost.textContent = el.textContent ?? '';
  ghost.style.font = cs.font;
  ghost.style.color = color;
  overlay.appendChild(ghost);
  positionBox(ghost, rect);
  trackBox(ghost, el, 'box');
  await wait(1300 + Math.random() * 700);
  ghost.classList.add('is-snap');
  await wait(1300 + Math.random() * 700);
  untrackBox(ghost);
  ghost.remove();
}

async function revealText(el: HTMLElement, rect: Rect, overlay: HTMLElement, wait: (ms: number) => Promise<void>): Promise<void> {
  const full = (el.textContent ?? '').trim();
  if (!full || full.length > 140) return revealGeneric(rect, overlay, wait);

  const cs = getComputedStyle(el);
  const typer = document.createElement('div');
  typer.className = 'ab-typing';
  typer.style.font = cs.font;
  typer.style.color = cs.color;
  typer.style.lineHeight = cs.lineHeight;
  overlay.appendChild(typer);
  positionBox(typer, rect);
  trackBox(typer, el, 'box');

  const steps = Math.min(full.length, 22);
  const chunk = Math.max(1, Math.ceil(full.length / steps));
  for (let i = chunk; i < full.length; i += chunk) {
    typer.textContent = full.slice(0, i);
    const caret = document.createElement('span');
    caret.className = 'ab-caret';
    typer.appendChild(caret);
    await wait(130 + Math.random() * 90);
  }
  untrackBox(typer);
  typer.remove();
}

async function revealButton(
  el: HTMLElement,
  rect: Rect,
  overlay: HTMLElement,
  color: string,
  wait: (ms: number) => Promise<void>,
): Promise<void> {
  const plus = document.createElement('div');
  plus.className = 'ab-drop';
  plus.style.setProperty('--ab-color', color);
  plus.textContent = '+';
  plus.style.left = `${rect.left + rect.width / 2}px`;
  plus.style.top = `${rect.top + rect.height / 2}px`;
  overlay.appendChild(plus);
  trackBox(plus, el, 'point');
  await wait(1000 + Math.random() * 500);
  plus.classList.add('is-gone');
  await wait(700 + Math.random() * 400);
  untrackBox(plus);
  plus.remove();
}

function buildGuides(rect: Rect): { h: HTMLElement; v: HTMLElement } {
  const h = document.createElement('div');
  h.className = 'ab-ruler ab-ruler-h';
  h.style.top = `${rect.top}px`;
  const v = document.createElement('div');
  v.className = 'ab-ruler ab-ruler-v';
  v.style.left = `${rect.left}px`;
  return { h, v };
}

function buildAgentCursorEl(name: string, color: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'ab-cursor';
  el.style.color = color;
  el.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1l5.2 13.4 1.8-5.4 5.4-1.8z"/></svg>';
  const label = document.createElement('span');
  label.className = 'ab-cursor-label';
  label.textContent = name;
  label.style.background = color;
  el.appendChild(label);
  return el;
}

function buildSelectBox(): { el: HTMLElement; badge: HTMLElement } {
  const el = document.createElement('div');
  el.className = 'ab-select';
  for (const corner of ['tl', 'tr', 'bl', 'br']) {
    const c = document.createElement('span');
    c.className = `ab-corner ${corner}`;
    el.appendChild(c);
  }
  const badge = document.createElement('span');
  badge.className = 'ab-select-badge';
  el.appendChild(badge);
  return { el, badge };
}

function buildPill(): {
  el: HTMLElement;
  agentsWrap: HTMLElement;
  agents: HTMLElement;
  layers: HTMLElement;
  progressFill: HTMLElement;
  tourBtn: HTMLButtonElement;
  speedBtn: HTMLButtonElement;
  skipBtn: HTMLButtonElement;
  replayBtn: HTMLButtonElement;
} {
  const el = document.createElement('div');
  el.className = 'ab-pill';

  const avatars = document.createElement('div');
  avatars.className = 'ab-avatars';
  for (const color of CURSOR_COLORS.slice(0, 5)) {
    const dot = document.createElement('span');
    dot.style.background = color;
    avatars.appendChild(dot);
  }
  el.appendChild(avatars);

  const agentsWrap = document.createElement('span');
  agentsWrap.className = 'ab-stat ab-label-long';
  const agents = agentsWrap;
  agents.textContent = '0 agents';
  el.appendChild(agentsWrap);

  const layers = document.createElement('span');
  layers.className = 'ab-stat';
  layers.textContent = '0 / 0 layers';
  el.appendChild(layers);

  const progress = document.createElement('div');
  progress.className = 'ab-progress';
  const progressFill = document.createElement('span');
  progress.appendChild(progressFill);
  el.appendChild(progress);

  const tourBtn = document.createElement('button');
  tourBtn.type = 'button';
  tourBtn.textContent = 'Tour';
  el.appendChild(tourBtn);

  const speedBtn = document.createElement('button');
  speedBtn.type = 'button';
  speedBtn.textContent = '1x';
  el.appendChild(speedBtn);

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.textContent = 'Skip';
  el.appendChild(skipBtn);

  const replayBtn = document.createElement('button');
  replayBtn.type = 'button';
  replayBtn.className = 'ab-replay';
  replayBtn.textContent = 'Replay';
  replayBtn.style.display = 'none';
  el.appendChild(replayBtn);

  return { el, agentsWrap, agents, layers, progressFill, tourBtn, speedBtn, skipBtn, replayBtn };
}
