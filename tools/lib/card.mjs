// 小红书卡片版配图的公共套件。
//
// 版式约束（来自卡片生成器的实测规格）：
//   画布 1080×1440，正文可用宽 912，可用高约 1130，图片默认高度上限 900。
//   SVG 会被 width:100% 撑满 912，所以只要宽高比 ≥ 1.01（横图）就能占满整宽；
//   竖图会先顶到 900 再等比缩小，两侧留一大片白，非常吃亏。
//
// 字号下限的来历：
//   卡片在手机上按 390 CSS px 显示，912 宽的图只渲染成 329 px，缩放比 0.361。
//   要让文字达到 11.5 px 的可读下限，卡片坐标系里的字号必须 ≥ 32。
//   作为对照，卡片正文是 36px、表格 29px —— 图内标签本来就该和正文一个量级。

export const CARD = {
  W: 912,             // 通用主题可用宽度（杂志风只有 888，故留 12px 余量在两侧内容上）
  SAFE_W: 888,        // 关键内容不要越过这个宽度，杂志风下才不会被裁
  H_MAX: 900,         // 图片默认高度上限；超过就会被缩小并留白
  pad: 40,
  gap: 26,
  // 建议高度：对应规格里给的几种宽高比
  H: { wide: 513, mid: 608, tall: 684, full: 900 },
  // 字号：全部不低于 32
  h1: 46,
  h2: 38,
  body: 34,
  small: 32,
  tick: 32,
  lead: { h1: 58, body: 46, small: 44 },
};

export const C = {
  ink: '#1f2933',
  muted: '#5b6673',
  grid: '#d7dfe6',
  plate: '#f5f8fa',
  surface: '#ffffff',
  blue: '#0878b9',
  warm: '#c65a3d',
  green: '#3b8f68',
  gold: '#a5761a',      // 已压暗：原 #eda100 在白底上低于 3:1
  soft: '#d9ecf8',
  pale: '#edf6fc',
};

const FONT = 'Microsoft YaHei, PingFang SC, Noto Sans SC, Hiragino Sans GB, sans-serif';
export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 卡片画布。高度必须 ≤ 900，否则在卡片里会被缩小并留白。 */
export function cardDoc(h, body, label) {
  if (h > CARD.H_MAX) throw new Error(`卡片图高度 ${h} 超过 ${CARD.H_MAX}，会被缩小并两侧留白`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD.W} ${h}" width="${CARD.W}" height="${h}" `
    + `font-family="${FONT}" fill="${C.ink}" role="img" aria-label="${esc(label)}">\n`
    + `<rect width="${CARD.W}" height="${h}" fill="${C.surface}"/>\n${body}\n</svg>\n`;
}

export function T(x, y, v, o = {}) {
  const { size = CARD.body, weight = 400, fill = C.ink, anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" `
    + `text-anchor="${anchor}">${esc(v)}</text>`;
}

export function MT(x, y, lines, o = {}) {
  const { size = CARD.body, weight = 400, fill = C.ink, anchor = 'start',
    leading = Math.round(size * 1.34) } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" `
    + `text-anchor="${anchor}">${lines.map((l, i) =>
      `<tspan x="${x}" dy="${i === 0 ? 0 : leading}">${esc(l)}</tspan>`).join('')}</text>`;
}

export function R(x, y, w, h, o = {}) {
  const { fill = 'none', stroke = C.grid, sw = 1, r = 12, opacity = 1 } = o;
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `
    + `rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;
}

export function L(x1, y1, x2, y2, o = {}) {
  const { c = C.grid, w = 1.5, dash = '' } = o;
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" `
    + `stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
}

export const O = (x, y, r, o = {}) =>
  `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${o.fill ?? C.blue}" `
  + `stroke="${o.stroke ?? 'none'}" stroke-width="${o.sw ?? 1}"/>`;

export function P(pts, o = {}) {
  const { c = C.blue, w = 3, fill = 'none' } = o;
  return `<polyline points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" `
    + `fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

export function PATH(d, o = {}) {
  const { c = C.blue, w = 3, fill = 'none', dash = '' } = o;
  return `<path d="${d}" fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" `
    + `stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function ARROW(x1, y1, x2, y2, o = {}) {
  const { c = C.muted, w = 3, head = 13 } = o;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p1 = [x2 - head * Math.cos(a - 0.46), y2 - head * Math.sin(a - 0.46)];
  const p2 = [x2 - head * Math.cos(a + 0.46), y2 - head * Math.sin(a + 0.46)];
  return L(x1, y1, x2, y2, { c, w })
    + `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} `
    + `${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="${c}"/>`;
}

/** 标题。最多两行，返回标题占用的高度。 */
export function head(lines, o = {}) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const svg = MT(CARD.pad, CARD.pad + CARD.h1 * 0.78, arr,
    { size: CARD.h1, weight: 700, leading: CARD.lead.h1, fill: o.fill ?? C.ink });
  return { svg, h: CARD.pad + CARD.h1 * 0.78 + (arr.length - 1) * CARD.lead.h1 + 34 };
}

/** 整宽横排的若干行。卡片有 912 的宽度，用行比用竖列省高度得多。 */
export function rows(n, y0, rowH, gap = 18) {
  return Array.from({ length: n }, (_, i) => ({
    x: CARD.pad, y: y0 + i * (rowH + gap), w: CARD.W - CARD.pad * 2, h: rowH, i,
  }));
}

/** 横向等分若干列。 */
export function cols(n, y0, h, gap = CARD.gap) {
  const w = (CARD.W - CARD.pad * 2 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({
    x: CARD.pad + i * (w + gap), y: y0, w, h, i,
  }));
}

export const plate = (x, y, w, h, fill = C.plate) => R(x, y, w, h, { fill, stroke: C.grid, r: 14 });
export const white = (x, y, w, h) => R(x, y, w, h, { fill: '#fff', stroke: C.grid, r: 10 });

/** 坐标刻度。卡片上的刻度字号同样不能低于 32。 */
export function axisX(x, y, w, ticks, min, max, o = {}) {
  const { size = CARD.tick, unit = '' } = o;
  let s = L(x, y, x + w, y, { c: C.grid, w: 1.5 });
  for (const t of ticks) {
    const [v, lab] = Array.isArray(t) ? t : [t, String(t)];
    const px = x + ((v - min) / (max - min)) * w;
    s += L(px, y, px, y + 9, { c: C.muted, w: 1.5 });
    s += T(px, y + size + 14, lab, { size, fill: C.muted, anchor: 'middle' });
  }
  if (unit) s += T(x + w, y + size * 2 + 24, unit, { size, fill: C.muted, anchor: 'end' });
  return s;
}

export function axisY(x, y, h, ticks, min, max, o = {}) {
  const { size = CARD.tick, unit = '' } = o;
  let s = L(x, y, x, y + h, { c: C.grid, w: 1.5 });
  for (const t of ticks) {
    const [v, lab] = Array.isArray(t) ? t : [t, String(t)];
    const py = y + h - ((v - min) / (max - min)) * h;
    s += L(x - 9, py, x, py, { c: C.muted, w: 1.5 });
    s += T(x - 14, py + size * 0.36, lab, { size, fill: C.muted, anchor: 'end' });
  }
  if (unit) s += T(x - 14, y - 14, unit, { size, fill: C.muted, anchor: 'end' });
  return s;
}

/** 画一条函数曲线。 */
export function curve(x, y, w, h, fn, n = 400, o = {}) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    pts.push([x + u * w, y + h - Math.max(0, Math.min(1, fn(u))) * h]);
  }
  return P(pts, o);
}

/** 把真实录音画成上下包络。 */
export function wave(samples, x, y, w, h, o = {}) {
  const { c = C.blue, opacity = 0.95 } = o;
  const n = Math.round(w);
  const step = samples.length / n;
  const top = [];
  const bot = [];
  for (let i = 0; i < n; i += 1) {
    let lo = 1;
    let hi = -1;
    const a = Math.floor(i * step);
    const b = Math.min(samples.length, Math.floor((i + 1) * step));
    for (let k = a; k < b; k += 1) { if (samples[k] < lo) lo = samples[k]; if (samples[k] > hi) hi = samples[k]; }
    if (b <= a) { lo = 0; hi = 0; }
    const px = x + (i / (n - 1)) * w;
    top.push([px, y + h / 2 - hi * (h / 2 - 4)]);
    bot.push([px, y + h / 2 - lo * (h / 2 - 4)]);
  }
  const d = `M${top.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}`
    + `L${bot.reverse().map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}Z`;
  return `<path d="${d}" fill="${c}" opacity="${opacity}" stroke="none"/>`;
}
