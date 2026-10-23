import type { StackBranchId } from '../data/profile';

/**
 * The Skill Tree behind the Stack chapter. The markup (StoryStack.astro) renders every verified tool as a
 * button; this module lays them out around the neural core, draws the branch edges, and runs the discovery
 * game: hover, focus, tap or scroll lights a node up, and nothing ever locks again. No scores, no levels.
 */
export interface SkillTree {
  /** 0..1 across the chapter's reveal window; drives scroll discovery and, on phones, the branch page. */
  setProgress(progress: number): void;
  /** Whether the story is the scrubbed animation (true) or the plain long page (false). */
  setMode(animated: boolean): void;
  focusSearch(): void;
}

export interface SkillTreeOptions {
  compact: MediaQueryList;
  reduced: MediaQueryList;
  /** Scroll the story so the given phone step (0-based of `steps`) is in view. */
  scrollToStep(step: number, steps: number): void;
  /** Interface sound for a moment; the page decides whether sound is on. */
  sound?: (name: 'hub-pulse' | 'node-discover' | 'reveal-all' | 'card-open' | 'card-close') => void;
}

type BranchId = StackBranchId;
interface Node {
  id: number; el: HTMLButtonElement; glyph: HTMLElement; branch: BranchId; page: number; step: number;
  name: string; search: string; linked: string[]; x: number; y: number; col: number; row: number;
}
interface Edge { el: SVGPathElement; kind: 'trunk' | 'bus' | 'chain' | 'rel'; branch: BranchId; a: number; b: number; }

const quadrants: Record<BranchId, { sx: number; sy: number; cols: number }> = {
  app: { sx: -1, sy: -1, cols: 4 },
  ai: { sx: 1, sy: -1, cols: 2 },
  integrate: { sx: -1, sy: 1, cols: 3 },
  cloud: { sx: 1, sy: 1, cols: 3 },
};
const branchOrder: BranchId[] = ['app', 'integrate', 'cloud', 'ai'];
const STORAGE = 'portfolio-stack-discovered';
const REVEAL_BY = 0.85;
const SVG = 'http://www.w3.org/2000/svg';

export function initSkillTree(section: HTMLElement, options: SkillTreeOptions): SkillTree {
  const { compact, reduced } = options;
  const sound = options.sound ?? (() => {});
  const q = <T extends Element>(selector: string) => section.querySelector<T>(selector)!;
  const stage = q<HTMLElement>('[data-st-stage]');
  const edgesSvg = q<SVGSVGElement>('[data-st-edges]');
  const core = q<HTMLElement>('[data-st-core]');
  const ring = q<SVGSVGElement>('[data-st-ring]');
  const query = q<HTMLInputElement>('[data-st-query]');
  const found = q<HTMLElement>('[data-st-found]');
  const chips = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-st-filter]'));
  const tabs = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-st-tab]'));
  const hubs = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-st-hub]'));
  const caps = Array.from(section.querySelectorAll<HTMLElement>('[data-st-cap]'));
  const card = q<HTMLElement>('[data-st-card]');
  const scrim = q<HTMLElement>('[data-st-scrim]');
  const counter = q<HTMLElement>('[data-st-count]');
  const hint = q<HTMLElement>('[data-st-hint]');
  const reveal = q<HTMLButtonElement>('[data-st-reveal]');
  const labels = new Map(chips.filter(chip => chip.dataset.stFilter !== 'all').map(chip => [chip.dataset.stFilter as BranchId, chip.textContent!.trim()]));

  const nodes: Node[] = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-st-id]')).map(el => ({
    id: Number(el.dataset.stId), el, glyph: el.querySelector<HTMLElement>('.st-glyph')!,
    branch: el.dataset.stBranch as BranchId, page: Number(el.dataset.stPage), step: 0,
    name: el.querySelector('.st-name')!.textContent!.trim(), search: el.dataset.stSearch ?? '',
    linked: (el.dataset.stLinked ?? '').split('|').filter(Boolean), x: 0, y: 0, col: 0, row: 0,
  }));
  const total = nodes.length;
  const byName = new Map(nodes.map(node => [node.name, node]));
  // Paged steps: one branch page at a time, in the order the nodes are written.
  const steps: { branch: BranchId; page: number }[] = [];
  nodes.forEach(node => {
    let step = steps.findIndex(s => s.branch === node.branch && s.page === node.page);
    if (step < 0) step = steps.push({ branch: node.branch, page: node.page }) - 1;
    node.step = step;
  });
  // Tools that share a "used together" group get a relation edge, once per pair.
  const relations: [number, number][] = [];
  nodes.forEach(node => node.linked.forEach(name => {
    const other = byName.get(name);
    if (other && other.id > node.id) relations.push([node.id, other.id]);
  }));

  const discovered = new Set<number>();
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE) ?? '[]') as number[];
    saved.forEach(id => { if (nodes[id]) discovered.add(id); });
  } catch { /* a private window with storage disabled still gets a working tree */ }
  let edges: Edge[] = [];
  let ticks: SVGLineElement[] = [];
  let animated = false;
  let step = 0;
  let filter: BranchId | null = null;
  let matches = new Set<number>();
  let selected: Node | null = null;
  let hovered: Node | null = null;
  let scrollCount = 0;
  let paintFrame = 0;
  let layoutFrame = 0;
  let hoverTimer = 0;

  const isCompact = () => compact.matches;
  // The radial constellation needs room for four quadrants of labelled nodes; phones, narrow windows and short
  // desktop viewports get the paged layout instead: one branch page at a time, full labels, a tab bar.
  const isPaged = () => isCompact() || window.innerWidth < 1400 || (animated && window.innerHeight < 800);
  const visible = (node: Node) => !isPaged() || node.step === step;
  const place = (el: HTMLElement, x: number, y: number) => { el.style.left = `${x}px`; el.style.top = `${y}px`; };

  /* ---------- drawing ---------- */
  const path = (kind: Edge['kind'], branch: BranchId, a: number, b: number, d: string) => {
    const el = document.createElementNS(SVG, 'path');
    el.setAttribute('d', d);
    edgesSvg.append(el);
    edges.push({ el, kind, branch, a, b });
  };
  const buildRing = (coreR: number) => {
    const size = coreR * 2 + 40;
    const c = size / 2;
    ring.setAttribute('viewBox', `0 0 ${size} ${size}`);
    ring.replaceChildren();
    ticks = nodes.map((_, i) => {
      const angle = (-90 + i * 360 / total) * Math.PI / 180;
      const line = document.createElementNS(SVG, 'line');
      const r0 = coreR + 10, r1 = coreR + 17;
      line.setAttribute('x1', String(c + Math.cos(angle) * r0));
      line.setAttribute('y1', String(c + Math.sin(angle) * r0));
      line.setAttribute('x2', String(c + Math.cos(angle) * r1));
      line.setAttribute('y2', String(c + Math.sin(angle) * r1));
      ring.append(line);
      return line;
    });
  };

  const layoutDesktop = (W: number, H: number) => {
    const big = W >= 1400;
    const d = big ? 28 : 24, axis = 32, cap = 44, x0 = big ? 186 : 150, margin = big ? 40 : 28, lw = big ? 86 : 80, coreR = big ? 54 : 46;
    const cx = W / 2, cy = H / 2, halfH = H / 2;
    stage.style.setProperty('--core', `${coreR * 2}px`);
    stage.style.setProperty('--hub', big ? '52px' : '44px');
    stage.style.setProperty('--cw', `${Math.min(320, 2 * (x0 - d / 2 - 12))}px`);
    core.hidden = false;
    place(core, cx, cy);
    if (ticks.length !== total || ring.dataset.r !== String(coreR)) { buildRing(coreR); ring.dataset.r = String(coreR); }
    const avail = halfH - axis - cap;
    const maxRows = Math.max(2, Math.floor(avail / (d + 6) - 0.5));
    const hubAt: Record<string, { x: number; y: number }> = {};
    const heads: Record<string, Node[]> = {};
    branchOrder.forEach(branch => {
      const list = nodes.filter(node => node.branch === branch);
      const { sx, sy } = quadrants[branch];
      const cols = Math.max(quadrants[branch].cols, Math.ceil(list.length / maxRows));
      const rows = Math.ceil(list.length / cols);
      const rowH = Math.min(54, avail / (rows + 0.5));
      const xmax = W / 2 - margin - lw - d / 2 - 8;
      const colW = Math.min(168, (xmax - x0) / Math.max(1, cols - 1));
      const bulge = cols > 3 ? 0 : big ? 12 : 6;
      heads[branch] = [];
      list.forEach((node, i) => {
        const c = Math.floor(i / rows), rr = i % rows;
        const stag = (c % 2) * rowH * 0.5;
        const jx = (node.id * 37) % 5 - 2, jy = (node.id * 53) % 7 - 3;
        node.x = cx + sx * (x0 + c * colW + bulge * Math.sin(Math.PI * (rr + 0.5) / rows) + jx);
        node.y = cy + sy * (axis + rowH * 0.5 + rr * rowH + stag + jy);
        node.col = c; node.row = rr;
        const labelW = c < cols - 1 ? Math.min(124, colW - d - 18) : Math.min(128, W / 2 - margin - Math.abs(node.x - cx) - d / 2 - 8);
        node.el.hidden = false;
        node.el.dataset.side = sx < 0 ? 'left' : 'right';
        node.el.style.setProperty('--d', `${d}px`);
        node.el.style.setProperty('--lw', `${Math.max(40, labelW)}px`);
        place(node.el, node.x, node.y);
        if (rr === 0) heads[branch].push(node);
      });
      const hub = { x: cx + sx * (x0 - 64), y: cy + sy * (axis + 18) };
      hubAt[branch] = hub;
      const hubEl = hubs.find(h => h.dataset.stHub === branch)!;
      hubEl.hidden = false;
      place(hubEl, hub.x, hub.y);
      const capEl = caps.find(c => c.dataset.stCap === branch)!;
      capEl.hidden = false;
      capEl.dataset.side = sx < 0 ? 'left' : 'right';
      capEl.style.left = sx < 0 ? `${margin}px` : 'auto';
      capEl.style.right = sx > 0 ? `${margin}px` : 'auto';
      capEl.style.top = sy < 0 ? '6px' : 'auto';
      capEl.style.bottom = sy > 0 ? '6px' : 'auto';
    });
    // Edges: trunk core → hub, a bus along the axis from the hub to each column head, chains down each column.
    branchOrder.forEach(branch => {
      const { sy } = quadrants[branch];
      const hub = hubAt[branch];
      const dx = hub.x - cx, dy = hub.y - cy, len = Math.hypot(dx, dy);
      path('trunk', branch, -1, -1, `M${cx + dx / len * (coreR + 6)} ${cy + dy / len * (coreR + 6)} L${hub.x} ${hub.y}`);
      const gy = cy + sy * 12;
      heads[branch].forEach(head => {
        const rx = Math.sign(head.x - hub.x) * 8;
        path('bus', branch, head.id, head.id, `M${hub.x} ${hub.y} L${hub.x} ${gy} L${head.x - rx} ${gy} Q${head.x} ${gy} ${head.x} ${gy + sy * 8} L${head.x} ${head.y}`);
      });
      const list = nodes.filter(node => node.branch === branch);
      list.forEach(node => {
        const next = list.find(other => other.col === node.col && other.row === node.row + 1);
        if (next) path('chain', branch, node.id, next.id, `M${node.x} ${node.y} L${next.x} ${next.y}`);
      });
    });
    relations.forEach(([a, b]) => {
      const A = nodes[a], B = nodes[b];
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      path('rel', A.branch, a, b, `M${A.x} ${A.y} Q${mx + (cx - mx) * 0.35} ${my + (cy - my) * 0.35} ${B.x} ${B.y}`);
    });
  };

  const layoutPaged = (W: number, H: number) => {
    const phone = isCompact();
    const d = 32, lw = phone ? 118 : 150, y0 = 76;
    const current = steps[step];
    const list = nodes.filter(node => node.step === step);
    // Wide pages use up to four columns, but never fewer than three rows, so a short page does not spread thin.
    const cols = phone ? 2 : Math.max(2, Math.min(Math.floor((W - 36) / 230), Math.ceil(list.length / 3)));
    const rows = Math.ceil(list.length / cols);
    const bottom = animated ? H - 12 : y0 + rows * 56;
    const rowH = Math.min(56, (bottom - y0) / rows);
    // On a desktop-sized stage the page is shorter than the stage, so centre it under the caption.
    const top = animated ? y0 + Math.max(0, (H - y0 - rows * rowH) / 2) : y0;
    stage.style.height = animated ? '' : `${bottom + 12}px`;
    stage.style.setProperty('--hub', '44px');
    core.hidden = true;
    const hub = { x: 44, y: 34 };
    hubs.forEach(hubEl => {
      hubEl.hidden = hubEl.dataset.stHub !== current.branch;
      place(hubEl, hub.x, hub.y);
    });
    caps.forEach(capEl => {
      capEl.hidden = capEl.dataset.stCap !== current.branch;
      capEl.dataset.side = 'left';
      capEl.style.left = '80px'; capEl.style.right = '12px'; capEl.style.top = '12px'; capEl.style.bottom = 'auto';
      const pager = capEl.querySelector<HTMLElement>('[data-st-pager]')!;
      const pages = steps.filter(s => s.branch === capEl.dataset.stCap).length;
      pager.hidden = animated || pages < 2;
      pager.querySelector('[data-st-page-label]')!.textContent = `${current.page + 1} / ${pages}`;
      pager.querySelector<HTMLButtonElement>('[data-st-page-prev]')!.disabled = current.page === 0;
      pager.querySelector<HTMLButtonElement>('[data-st-page-next]')!.disabled = current.page >= pages - 1;
      const count = capEl.querySelector('[data-st-cap-count]')!;
      count.textContent = pages > 1 ? `${list.length} of ${nodes.filter(n => n.branch === current.branch).length} tools` : `${list.length} tools`;
    });
    const span = (W - 36) / cols;
    const colX = Array.from({ length: cols }, (_, c) => 36 + c * span + (phone && c ? 4 : 0));
    nodes.forEach(node => { node.el.hidden = node.step !== step; });
    const heads: Node[] = [];
    list.forEach((node, i) => {
      const c = Math.floor(i / rows), rr = i % rows;
      node.x = colX[c]; node.y = top + rr * rowH + rowH / 2; node.col = c; node.row = rr;
      node.el.dataset.side = 'right';
      node.el.style.setProperty('--d', `${d}px`);
      node.el.style.setProperty('--lw', `${Math.min(lw, span - d - 18)}px`);
      place(node.el, node.x, node.y);
      if (rr === 0) heads.push(node);
    });
    heads.forEach(head => path('bus', current.branch, head.id, head.id, `M${hub.x} ${hub.y + 22} Q${head.x} ${hub.y + 22} ${head.x} ${head.y}`));
    list.forEach(node => {
      const next = list.find(other => other.col === node.col && other.row === node.row + 1);
      if (next) path('chain', current.branch, node.id, next.id, `M${node.x} ${node.y} L${next.x} ${next.y}`);
    });
    relations.forEach(([a, b]) => {
      const A = nodes[a], B = nodes[b];
      if (A.step !== step || B.step !== step) return;
      const mx = (A.x + B.x) / 2 + 24, my = (A.y + B.y) / 2;
      path('rel', A.branch, a, b, `M${A.x} ${A.y} Q${mx} ${my} ${B.x} ${B.y}`);
    });
  };

  const layout = () => {
    layoutFrame = 0;
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W) return;
    edgesSvg.replaceChildren();
    edges = [];
    const paged = isPaged();
    section.dataset.stLayout = paged ? 'paged' : 'radial';
    if (paged) layoutPaged(W, H); else { stage.style.height = ''; layoutDesktop(W, H); }
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(paged && tab.dataset.stTab === steps[step].branch)));
    positionCard();
    paint();
  };
  const scheduleLayout = () => { layoutFrame ||= requestAnimationFrame(layout); };

  /* ---------- state painting ---------- */
  const paintNow = () => {
    paintFrame = 0;
    const searching = matches.size > 0 || query.value.trim().length > 0;
    nodes.forEach(node => {
      const lit = discovered.has(node.id);
      node.el.classList.toggle('on', lit);
      node.el.classList.toggle('match', matches.has(node.id));
      node.el.classList.toggle('dim', (filter !== null && node.branch !== filter) || (searching && !matches.has(node.id)));
    });
    hubs.forEach(hub => hub.classList.toggle('dim', filter !== null && hub.dataset.stHub !== filter));
    caps.forEach(cap => cap.classList.toggle('dim', filter !== null && cap.dataset.stCap !== filter));
    const active = (id: number) => selected?.id === id || hovered?.id === id;
    edges.forEach(edge => {
      const style = edge.el.style;
      const branch = `var(--branch-${edge.branch})`;
      const filteredOut = filter !== null && edge.branch !== filter;
      if (edge.kind === 'trunk') {
        style.stroke = branch; style.strokeWidth = '1.5'; style.strokeDasharray = '';
        style.opacity = filteredOut ? '.12' : '.55';
      } else if (edge.kind === 'bus') {
        style.stroke = branch; style.strokeWidth = '1'; style.strokeDasharray = '';
        style.opacity = filteredOut ? '.12' : discovered.has(edge.a) ? '.7' : '.35';
      } else if (edge.kind === 'chain') {
        const both = discovered.has(edge.a) && discovered.has(edge.b);
        style.stroke = both ? branch : 'var(--line-strong)';
        style.strokeWidth = '1'; style.strokeDasharray = both ? '' : '2 4';
        style.opacity = filteredOut ? '.12' : both ? '.75' : '.5';
      } else {
        const sel = active(edge.a) || active(edge.b);
        const both = (discovered.has(edge.a) && discovered.has(edge.b)) || (matches.has(edge.a) && matches.has(edge.b));
        const show = filter === null && (sel || both) && !(searching && !(matches.has(edge.a) && matches.has(edge.b)) && !sel);
        style.stroke = 'var(--accent-2)'; style.strokeDasharray = '1 4'; style.strokeLinecap = 'round';
        style.strokeWidth = sel ? '1.5' : '1';
        style.opacity = show ? (sel ? '.9' : '.3') : '0';
      }
    });
    const lit = discovered.size;
    ticks.forEach((tick, i) => tick.classList.toggle('on', i < lit));
    if (reduced.matches) counter.textContent = `${total} tools`;
    else counter.textContent = `${lit} / ${total}`;
    const done = lit >= total;
    hint.hidden = done || reduced.matches;
    reveal.disabled = done;
    reveal.textContent = done ? `All ${total} shown` : 'Reveal all';
    reveal.hidden = reduced.matches;
  };
  const paint = () => { paintFrame ||= requestAnimationFrame(paintNow); };

  const persist = () => {
    try { sessionStorage.setItem(STORAGE, JSON.stringify(Array.from(discovered))); } catch { /* storage is optional */ }
  };
  const discover = (node: Node, pop = true, chime = pop) => {
    if (discovered.has(node.id)) return;
    discovered.add(node.id);
    if (pop && !reduced.matches) {
      node.el.classList.add('pop');
      setTimeout(() => node.el.classList.remove('pop'), 420);
    }
    if (chime) sound('node-discover');
    persist();
    paint();
  };

  /* ---------- hub pulse ---------- */
  // Clicking a branch hub sends a signal from the core along the trunk, the bus and down each chain. The nodes it
  // reaches light up as it arrives, in order, so the branch reveals itself the way the connections run.
  const SPEED = 0.9; // px per ms
  const pulseBranch = (branch: BranchId) => {
    const hubEl = hubs.find(h => h.dataset.stHub === branch);
    const inBranch = nodes.filter(node => node.branch === branch && visible(node));
    sound('hub-pulse');
    if (reduced.matches) { inBranch.forEach(node => discover(node, false, false)); return; }
    hubEl?.classList.remove('zap'); void hubEl?.offsetWidth; hubEl?.classList.add('zap');
    core.classList.remove('kick'); void core.offsetWidth; core.classList.add('kick');
    const arrival = new Map<number, number>();
    const run = (edge: Edge, start: number) => {
      const len = edge.el.getTotalLength();
      const duration = 40 + len / SPEED;
      const ghost = document.createElementNS(SVG, 'path');
      ghost.setAttribute('d', edge.el.getAttribute('d')!);
      ghost.setAttribute('class', 'st-pulse');
      ghost.style.stroke = `var(--branch-${branch})`;
      const head = Math.min(len, Math.max(28, len * 0.45));
      ghost.style.strokeDasharray = `${head} ${len + head}`;
      edgesSvg.append(ghost);
      const anim = ghost.animate([{ strokeDashoffset: head }, { strokeDashoffset: -len }], { duration, delay: start, easing: 'linear', fill: 'both' });
      anim.onfinish = () => ghost.remove();
      return start + duration;
    };
    const trunk = edges.find(edge => edge.branch === branch && edge.kind === 'trunk');
    const t0 = trunk ? run(trunk, 0) : 0;
    edges.filter(edge => edge.branch === branch && edge.kind === 'bus' && inBranch.some(n => n.id === edge.a)).forEach(edge => arrival.set(edge.a, run(edge, t0)));
    const chains = edges.filter(edge => edge.branch === branch && edge.kind === 'chain' && inBranch.some(n => n.id === edge.a) && inBranch.some(n => n.id === edge.b)).sort((x, y) => nodes[x.a].row - nodes[y.a].row);
    chains.forEach(edge => { const from = arrival.get(edge.a); if (from !== undefined) arrival.set(edge.b, run(edge, from)); });
    arrival.forEach((at, id) => {
      const node = nodes[id];
      setTimeout(() => {
        node.el.classList.add('zap');
        setTimeout(() => node.el.classList.remove('zap'), 360);
        discover(node, true, false);
      }, at);
    });
  };

  /* ---------- selection and the detail card ---------- */
  const positionCard = () => {
    if (!selected || isCompact()) { card.style.removeProperty('--cy'); return; }
    // Dock on whichever side of the node has room; on a short stage, slide the card so it stays inside.
    const H = stage.clientHeight, ch = card.offsetHeight;
    let below = selected.y < H / 2;
    if (below && selected.y + 24 + ch > H && selected.y - 24 - ch >= 0) below = false;
    else if (!below && selected.y - 24 - ch < 0 && selected.y + 24 + ch <= H) below = true;
    card.dataset.dock = below ? 'below' : 'above';
    const cy = below ? Math.min(selected.y + 24, Math.max(0, H - ch)) : Math.max(selected.y - 24, Math.min(H, ch));
    card.style.setProperty('--cy', `${cy}px`);
  };
  const fillCard = (node: Node) => {
    card.style.setProperty('--b', `var(--branch-${node.branch})`);
    card.querySelector('[data-st-card-glyph]')!.innerHTML = node.glyph.innerHTML;
    card.querySelector('[data-st-card-name]')!.textContent = node.name;
    card.querySelector('[data-st-card-meta]')!.textContent = `${labels.get(node.branch) ?? node.branch} · ${node.el.dataset.stCategory ?? ''}`;
    card.querySelector('[data-st-card-detail]')!.textContent = node.el.dataset.stDetail ?? '';
    const note = card.querySelector<HTMLElement>('[data-st-card-note]')!;
    note.hidden = !node.el.dataset.stNote;
    note.querySelector('p')!.textContent = node.el.dataset.stNote ?? '';
    const links = card.querySelector<HTMLElement>('[data-st-card-links]')!;
    links.hidden = node.linked.length === 0;
    const chipsHost = links.querySelector('.st-card-chips')!;
    chipsHost.replaceChildren(...node.linked.map(name => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = name;
      chip.addEventListener('click', () => { const other = byName.get(name); if (other) reveal_and_select(other); });
      return chip;
    }));
  };
  const deselect = (returnFocus = false) => {
    if (!selected) return;
    const node = selected;
    selected = null;
    node.el.setAttribute('aria-pressed', 'false');
    card.hidden = true;
    scrim.hidden = true;
    sound('card-close');
    if (returnFocus || card.contains(document.activeElement)) node.el.focus({ preventScroll: true });
    paint();
  };
  const select = (node: Node, focusCard = false) => {
    if (selected === node) { deselect(true); return; }
    if (selected) selected.el.setAttribute('aria-pressed', 'false');
    selected = node;
    node.el.setAttribute('aria-pressed', 'true');
    discover(node, true, false);
    sound('card-open');
    fillCard(node);
    card.hidden = false;
    scrim.hidden = !isCompact();
    positionCard();
    if (focusCard) card.querySelector<HTMLButtonElement>('[data-st-close]')!.focus({ preventScroll: true });
    paint();
  };
  /** Select a node that may live on another page. */
  const reveal_and_select = (node: Node) => {
    if (isPaged() && node.step !== step) {
      if (animated) options.scrollToStep(node.step, steps.length);
      setStep(node.step);
    }
    select(node, true);
  };

  /* ---------- paged steps ---------- */
  const setStep = (next: number) => {
    next = Math.max(0, Math.min(steps.length - 1, next));
    if (next === step) return;
    step = next;
    if (selected && selected.step !== step) deselect();
    scheduleLayout();
  };

  /* ---------- events ---------- */
  nodes.forEach(node => {
    node.el.addEventListener('click', () => select(node, false));
    node.el.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hovered = node;
      clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => discover(node), 250);
      paint();
    });
    node.el.addEventListener('pointerleave', () => {
      clearTimeout(hoverTimer);
      if (hovered === node) hovered = null;
      paint();
    });
    node.el.addEventListener('focus', () => discover(node));
  });
  hubs.forEach(hub => hub.addEventListener('click', () => pulseBranch(hub.dataset.stHub as BranchId)));
  stage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || core.hidden) return;
    const rect = stage.getBoundingClientRect();
    core.style.setProperty('--tx', `${((event.clientX - rect.left) / rect.width - 0.5) * 10}px`);
    core.style.setProperty('--ty', `${((event.clientY - rect.top) / rect.height - 0.5) * 10}px`);
  });
  stage.addEventListener('pointerleave', () => { core.style.removeProperty('--tx'); core.style.removeProperty('--ty'); });
  card.querySelector('[data-st-close]')!.addEventListener('click', () => deselect(true));
  scrim.addEventListener('click', () => deselect());
  section.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !selected || event.target === query) return;
    event.preventDefault();
    deselect(true);
  });
  chips.forEach(chip => chip.addEventListener('click', () => {
    const id = chip.dataset.stFilter!;
    filter = id === 'all' || filter === id ? null : id as BranchId;
    chips.forEach(other => other.setAttribute('aria-pressed', String((other.dataset.stFilter ?? 'all') === (filter ?? 'all'))));
    paint();
  }));
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const target = steps.findIndex(s => s.branch === tab.dataset.stTab);
    if (target < 0) return;
    if (animated) options.scrollToStep(target, steps.length);
    setStep(target);
  }));
  caps.forEach(cap => {
    cap.querySelector('[data-st-page-prev]')!.addEventListener('click', () => setStep(step - 1));
    cap.querySelector('[data-st-page-next]')!.addEventListener('click', () => setStep(step + 1));
  });
  const runSearch = () => {
    const text = query.value.trim().toLowerCase();
    matches = new Set(text ? nodes.filter(node => node.search.includes(text)).map(node => node.id) : []);
    found.textContent = text ? `${matches.size} found` : '';
    paint();
  };
  query.addEventListener('input', runSearch);
  query.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      const first = nodes.find(node => matches.has(node.id));
      if (first) { event.preventDefault(); reveal_and_select(first); }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (query.value) { query.value = ''; runSearch(); } else query.blur();
    }
  });
  reveal.addEventListener('click', () => {
    reveal.disabled = true;
    sound('reveal-all');
    const order = scrollOrder();
    let delay = 0;
    order.forEach(node => {
      if (discovered.has(node.id)) return;
      setTimeout(() => discover(node, true, false), delay);
      delay += 12;
    });
  });

  /* ---------- scroll discovery ---------- */
  // The constellation lights up radially: every branch's first column, then the second, and so on. Pages follow the pages.
  const scrollOrder = () => isPaged()
    ? nodes.slice()
    : nodes.slice().sort((a, b) => a.col - b.col || branchOrder.indexOf(a.branch) - branchOrder.indexOf(b.branch) || a.row - b.row);

  new ResizeObserver(scheduleLayout).observe(stage);
  compact.addEventListener('change', scheduleLayout);
  window.addEventListener('resize', scheduleLayout);
  if (reduced.matches) nodes.forEach(node => discover(node, false));
  layout();

  return {
    setProgress(progress) {
      if (!animated) return;
      const p = Math.max(0, Math.min(1, progress / REVEAL_BY));
      if (isPaged()) setStep(Math.min(steps.length - 1, Math.floor(p * steps.length)));
      const count = Math.floor(p * total);
      if (count <= scrollCount) return;
      scrollCount = count;
      scrollOrder().slice(0, count).forEach(node => discover(node, true, false));
    },
    setMode(next) {
      animated = next;
      scrollCount = 0;
      scheduleLayout();
    },
    focusSearch() {
      query.focus({ preventScroll: true });
      query.select();
    },
  };
}
