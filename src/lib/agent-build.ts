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

interface Layer {
  el: HTMLElement;
  agent: string;
  color: string;
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

/** Picks the outermost elements matching the layer selector, never a descendant of an already-picked one. */
function discoverLayers(section: HTMLElement): HTMLElement[] {
  const candidates = section.querySelectorAll<HTMLElement>('h1, h2, h3, h4, p, a, button, img, li, blockquote');
  const picked: HTMLElement[] = [];
  for (const el of Array.from(candidates)) {
    if (el.closest('[data-ab-layer]')) continue;
    // Decorative content (e.g. the hero's rotating tagline) manages its own visibility
    // independently of build state; forcing it to opacity: 1 would fight that.
    if (el.closest('[aria-hidden="true"]')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) continue;
    el.setAttribute('data-ab-layer', '');
    picked.push(el);
  }
  return picked;
}

function randomColor(): string {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)] ?? CURSOR_COLORS[0]!;
}

function randomAgent(): string {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)] ?? AGENT_NAMES[0]!;
}

export function initAgentBuild(): void {
  const root = document.querySelector<HTMLElement>('main#main');
  if (!root) return;

  if (prefersReducedMotion() || sessionStorage.getItem(SESSION_KEY) === '1') {
    return;
  }

  const sections = Array.from(root.querySelectorAll<HTMLElement>(':scope > section'));
  if (sections.length === 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'ab-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);

  const pill = buildPill();
  document.body.appendChild(pill.el);

  const agentsSeen = new Set<string>();
  let totalLayers = 0;
  let builtLayers = 0;
  let sectionsCompleted = 0;
  let speed = 1;
  let skipped = false;

  const cursorPool: HTMLElement[] = [];
  const poolSize = isMobile() ? 3 : 8;
  for (let i = 0; i < poolSize; i++) {
    const cursor = buildCursor();
    cursor.style.opacity = '0';
    overlay.appendChild(cursor);
    cursorPool.push(cursor);
  }

  const selectBox = buildSelectBox();
  overlay.appendChild(selectBox.el);

  const skeleton = document.createElement('div');
  skeleton.className = 'ab-skeleton';
  overlay.appendChild(skeleton);

  function updatePill(): void {
    pill.agents.textContent = `${agentsSeen.size} agents`;
    pill.layers.textContent = `${builtLayers} / ${totalLayers} layers`;
    const pct = totalLayers === 0 ? 0 : Math.round((builtLayers / totalLayers) * 100);
    pill.progressFill.style.setProperty('--ab-progress', `${pct}%`);
  }

  function finish(): void {
    overlay.remove();
    pill.el.setAttribute('hidden', '');
  }

  function checkDone(): void {
    if (sectionsCompleted === sections.length) finish();
  }

  function skip(): void {
    if (skipped) return;
    skipped = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    finishImmediately(sections);
    finish();
  }

  pill.skipBtn.addEventListener('click', skip);
  pill.speedBtn.addEventListener('click', () => {
    speed = speed === 1 ? 2 : 1;
    pill.speedBtn.textContent = `${speed}x`;
  });
  pill.tourBtn.addEventListener('click', () => {
    const next = sections.find((s) => !s.dataset.abDone);
    next?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  async function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms / speed));
  }

  function placeCursorAt(cursor: HTMLElement, x: number, y: number): void {
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }

  async function buildLayer(layer: Layer, cursor: HTMLElement): Promise<void> {
    const rect = layer.el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) {
      layer.el.classList.add('ab-built');
      builtLayers++;
      updatePill();
      return;
    }

    placeCursorAt(cursor, rect.left, rect.top);
    cursor.style.opacity = '1';
    await wait(140);

    selectBox.el.style.setProperty('--ab-color', layer.color);
    selectBox.el.style.left = `${rect.left}px`;
    selectBox.el.style.top = `${rect.top}px`;
    selectBox.el.style.width = `${rect.width}px`;
    selectBox.el.style.height = `${rect.height}px`;
    selectBox.badge.textContent = `${Math.round(rect.width)} x ${Math.round(rect.height)}`;
    selectBox.el.classList.add('is-on');
    await wait(220);

    skeleton.style.left = `${rect.left}px`;
    skeleton.style.top = `${rect.top}px`;
    skeleton.style.width = `${rect.width}px`;
    skeleton.style.height = `${rect.height}px`;
    skeleton.classList.add('is-on');
    selectBox.el.classList.remove('is-on');
    await wait(260);

    skeleton.classList.remove('is-on');
    layer.el.classList.add('ab-built');
    builtLayers++;
    agentsSeen.add(layer.agent);
    updatePill();
    cursor.style.opacity = '0';
  }

  async function buildSection(section: HTMLElement): Promise<void> {
    if (section.dataset.abDone) return;
    section.dataset.abDone = '1';
    section.classList.add('ab-building');

    const layerEls = discoverLayers(section);
    totalLayers += layerEls.length;

    const layers: Layer[] = layerEls.map((el) => ({ el, agent: randomAgent(), color: randomColor() }));
    const lanes = isMobile() ? 1 : Math.min(cursorPool.length, 4);

    let i = 0;
    const runners: Promise<void>[] = [];
    for (let lane = 0; lane < lanes; lane++) {
      const cursor = cursorPool[lane % cursorPool.length]!;
      runners.push(
        (async () => {
          while (i < layers.length) {
            const layer = layers[i++]!;
            await buildLayer(layer, cursor);
          }
        })(),
      );
    }
    await Promise.all(runners);
    section.classList.remove('ab-building');
    sectionsCompleted++;
    checkDone();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          void buildSection(entry.target as HTMLElement);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  for (const section of sections) {
    observer.observe(section);
  }

  if (canHover() && !isMobile()) {
    const idleCursor = buildCursor();
    idleCursor.style.opacity = '0';
    overlay.appendChild(idleCursor);
    let idleTimer: number | undefined;
    document.addEventListener('mousemove', (event) => {
      if (document.querySelectorAll('[data-ab-layer]:not(.ab-built)').length > 0) return;
      placeCursorAt(idleCursor, event.clientX + 14, event.clientY + 10);
      idleCursor.style.opacity = '0.85';
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idleCursor.style.opacity = '0';
      }, 900);
    });
  }
}

function buildCursor(): HTMLElement {
  const cursor = document.createElement('div');
  cursor.className = 'ab-cursor';
  cursor.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1l5.2 13.4 1.8-5.4 5.4-1.8z"/></svg>';
  const label = document.createElement('span');
  label.className = 'ab-cursor-label';
  label.textContent = randomAgent();
  label.style.background = randomColor();
  cursor.style.color = label.style.background;
  cursor.appendChild(label);
  return cursor;
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
  agents: HTMLElement;
  layers: HTMLElement;
  progressFill: HTMLElement;
  tourBtn: HTMLButtonElement;
  speedBtn: HTMLButtonElement;
  skipBtn: HTMLButtonElement;
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

  const agents = document.createElement('span');
  agents.className = 'ab-stat ab-label-long';
  agents.textContent = '0 agents';
  el.appendChild(agents);

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

  return { el, agents, layers, progressFill, tourBtn, speedBtn, skipBtn };
}
