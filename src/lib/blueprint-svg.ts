// Build-time SVG for the Systems chapter: the flat schematic shown in each blueprint's viewer.
// Schematic colours come from CSS (--k and state classes) so the step-through only has to toggle classes.
import type { Blueprint } from '../data/architectures';

const esc = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function schematic(bp: Blueprint) {
  const nodes = Object.fromEntries(bp.nodes.map(([id, label, sub, x, y, w, h]) => [id, { id, label, sub, x, y, w, h }]));
  const order = Object.fromEntries(bp.hops.map(([id], i) => [id, i + 1]));
  let g = '';
  for (const [label, x, y, w, h, f = {}] of bp.groups) {
    g += `<rect class="bp-group${f.device ? ' is-device' : ''}${f.dash ? ' is-dash' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>`;
    g += `<text class="bp-group-label${f.device ? ' is-device' : ''}" x="${x + 14}" y="${y + 18}">${esc(label.toUpperCase())}</text>`;
  }
  for (const [from, to, e = {}] of bp.edges) {
    const a = nodes[from], b = nodes[to];
    const acx = a.x + a.w / 2, acy = a.y + a.h / 2, bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
    let d: string;
    if (e.straight) d = `M${acx} ${acy} L${bcx} ${bcy}`;
    else if (b.x >= a.x + a.w - 2 || a.x >= b.x + b.w - 2) {
      const rev = a.x > b.x, sx = rev ? a.x : a.x + a.w, ex = rev ? b.x + b.w : b.x;
      if (Math.abs(acy - bcy) < 1) d = `M${sx} ${acy} H${ex}`;
      else {
        const mx = (sx + ex) / 2, r = 8, dy = bcy > acy ? 1 : -1, dx = ex > sx ? 1 : -1;
        d = `M${sx} ${acy} H${mx - r * dx} Q${mx} ${acy} ${mx} ${acy + r * dy} V${bcy - r * dy} Q${mx} ${bcy} ${mx + r * dx} ${bcy} H${ex}`;
      }
    } else {
      const x = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2, down = b.y > a.y;
      d = `M${x} ${down ? a.y + a.h : a.y} V${down ? b.y : b.y + b.h}`;
    }
    g += `<path class="bp-edge${e.dash ? ' is-dash' : ''}" data-from="${from}" data-to="${to}" d="${d}"/>`;
  }
  bp.nodes.forEach(([id]) => {
    const v = nodes[id], cx = v.x + v.w / 2, cy = v.y + v.h / 2, size = v.w < 112 ? 13 : 14;
    g += `<g class="bp-node" data-node="${id}"><rect class="bp-halo" x="${v.x - 6}" y="${v.y - 6}" width="${v.w + 12}" height="${v.h + 12}" rx="15"/><rect class="bp-box" x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" rx="10"/>`;
    if (v.sub) g += `<text class="bp-label" x="${cx}" y="${cy - 3}" font-size="${v.h > 200 ? 16 : size}">${esc(v.label)}</text><text class="bp-sub" x="${cx}" y="${cy + 13}">${esc(v.sub)}</text>`;
    else g += `<text class="bp-label" x="${cx}" y="${cy + 5}" font-size="${size}">${esc(v.label)}</text>`;
    const k = order[id];
    if (k) g += `<g class="bp-badge"><circle cx="${v.x + v.w - 2}" cy="${v.y + 2}" r="11"/><text x="${v.x + v.w - 2}" y="${v.y + 6}">${k}</text></g>`;
    g += '</g>';
  });
  if (bp.n === 6) g += `<g class="bp-offline" transform="translate(560 6)"><path d="M8 22a8 8 0 0 1 1-16 11 11 0 0 1 21 3 7 7 0 0 1 0 13z"/><path class="bp-offline-strike" d="M10 4 L34 28"/></g><text class="bp-group-label" x="552" y="24" text-anchor="end">NO CLOUD CALLS</text>`;
  const boxes = [...bp.nodes.map(n => [n[3], n[4], n[5], n[6]]), ...bp.groups.map(q => [q[1], q[2], q[3], q[4]])];
  const fit = 22, x0 = Math.min(...boxes.map(b => b[0])) - fit, y0 = Math.min(...boxes.map(b => b[1])) - fit - 30;
  const x1 = Math.max(...boxes.map(b => b[0] + b[2])) + fit, y1 = Math.max(...boxes.map(b => b[1] + b[3])) + fit;
  const label = `${bp.name} schematic: ${bp.hops.map(([id], i) => `${i + 1}. ${nodes[id].label}`).join(', ')}.`;
  return `<svg class="bp-schematic" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}">${g}</svg>`;
}
