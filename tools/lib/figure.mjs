// 图形基元 + 色标 + 栅格热力图。
//
// 思路：数据密集的部分（声谱图、密集波形）用真实像素渲染成 PNG，
// 再以 <image> 嵌进 SVG；坐标轴、标题、标注全部是真实 <text>。
// 这样既有真数据，又保住中文在手机上的清晰度。

import sharp from 'sharp';

// ---------- 调色板 ----------
// 取自 dataviz skill 的参考配色（已通过色觉障碍与对比度校验）。

export const PALETTE = {
  ink: '#0b0b0b',
  ink2: '#52514e',
  muted: '#6f7b89',
  grid: '#e3e7ea',
  surface: '#ffffff',
  plate: '#f7f9fb',
  // 分类槽位，按固定顺序使用，不循环
  s1: '#2a78d6', // 蓝
  s2: '#eb6834', // 橙
  s3: '#1baf7a', // 青绿
  s4: '#eda100', // 黄
  // 单色阶（顺序型）
  blue: ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7',
    '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'],
};

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

function rampSampler(stops) {
  const rgb = stops.map(hex);
  return (t) => {
    const u = Math.max(0, Math.min(1, t)) * (rgb.length - 1);
    const i = Math.min(rgb.length - 2, Math.floor(u));
    const f = u - i;
    return [0, 1, 2].map((c) => Math.round(rgb[i][c] * (1 - f) + rgb[i + 1][c] * f));
  };
}

// viridis / magma 的锚点（matplotlib 原表的等距抽样，视觉上无差别）
const VIRIDIS = ['#440154', '#472d7b', '#3b528b', '#2c728e', '#21918c',
  '#28ae80', '#5ec962', '#addc30', '#fde725'];
const MAGMA = ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f',
  '#cd4071', '#f1605d', '#fd9668', '#fecf92', '#fcfdbf'];

export const COLORMAPS = {
  // 单蓝色阶：浅=弱、深=强，白底上最贴近本站的工程制图风格
  blue: rampSampler(['#ffffff', ...PALETTE.blue]),
  // 论文里最常见的两个感知均匀色标
  viridis: rampSampler(VIRIDIS),
  magma: rampSampler(MAGMA),
};

// ---------- SVG 基元 ----------

export const FONT = 'Microsoft YaHei, PingFang SC, Noto Sans SC, Hiragino Sans GB, sans-serif';
export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const svgDoc = (w, h, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" `
  + `font-family="${FONT}" fill="${PALETTE.ink}" role="img" aria-label="${esc(label ?? '')}">\n`
  + `<rect width="${w}" height="${h}" fill="${PALETTE.surface}"/>\n${body}\n</svg>\n`;

export const T = (x, y, s, o = {}) => {
  const { size = 14, weight = 400, fill = PALETTE.ink, anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" `
    + `text-anchor="${anchor}">${esc(s)}</text>`;
};
export const R = (x, y, w, h, o = {}) => {
  const { fill = 'none', stroke = 'none', sw = 1, r = 0 } = o;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" `
    + `stroke="${stroke}" stroke-width="${sw}"/>`;
};
export const L = (x1, y1, x2, y2, o = {}) => {
  const { c = PALETTE.grid, w = 1, dash = '' } = o;
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" `
    + `stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
};
export const P = (pts, o = {}) => {
  const { c = PALETTE.s1, w = 1.6, fill = 'none' } = o;
  return `<polyline points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" `
    + `fill="${fill}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
};

// ---------- 栅格热力图 ----------

/**
 * 把 STFT 幅度矩阵渲染成 PNG，并返回可直接放进 <image href> 的 data URI。
 *
 * @param {object} S            stft() 的返回值
 * @param {object} opt
 *   w, h        输出像素（建议取显示尺寸的 2 倍，保证高分屏清晰）
 *   fmax        频率上限（Hz）
 *   logFreq     纵轴是否用对数频率
 *   dbFloor     动态范围下限（相对峰值，dB）
 *   cmap        'blue' | 'viridis' | 'magma'
 */
export async function spectrogramPng(S, opt = {}) {
  const {
    w = 1200, h = 600, fmax = S.sampleRate / 2, logFreq = false,
    dbFloor = -70, cmap = 'blue',
  } = opt;
  const map = COLORMAPS[cmap] ?? COLORMAPS.blue;

  // 转 dB 并以全局峰值为 0 dB
  let peak = 0;
  for (let i = 0; i < S.mag.length; i += 1) if (S.mag[i] > peak) peak = S.mag[i];
  const ref = Math.max(peak, 1e-12);

  const binHz = S.sampleRate / S.nfft;
  const kMax = Math.min(S.bins - 1, Math.floor(fmax / binHz));
  const fLo = Math.max(binHz, 20);

  const buf = Buffer.alloc(w * h * 3);
  for (let py = 0; py < h; py += 1) {
    // py=0 是顶部 = 高频
    const v = 1 - py / (h - 1);
    const f = logFreq ? fLo * (fmax / fLo) ** v : v * fmax;
    const kf = f / binHz;
    const k0 = Math.max(0, Math.min(kMax, Math.floor(kf)));
    const k1 = Math.min(kMax, k0 + 1);
    const kt = kf - k0;
    for (let px = 0; px < w; px += 1) {
      const ff = (px / (w - 1)) * (S.frames - 1);
      const f0 = Math.floor(ff);
      const f1 = Math.min(S.frames - 1, f0 + 1);
      const ft = ff - f0;
      const a = S.mag[f0 * S.bins + k0] * (1 - kt) + S.mag[f0 * S.bins + k1] * kt;
      const b = S.mag[f1 * S.bins + k0] * (1 - kt) + S.mag[f1 * S.bins + k1] * kt;
      const m = a * (1 - ft) + b * ft;
      const db = 20 * Math.log10(Math.max(m, 1e-12) / ref);
      const t = Math.max(0, Math.min(1, (db - dbFloor) / -dbFloor));
      const [r, g, bl] = map(t);
      const o = (py * w + px) * 3;
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = bl;
    }
  }
  const png = await sharp(buf, { raw: { width: w, height: h, channels: 3 } })
    .png({ compressionLevel: 9, palette: true, colors: 128 })
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

/** 把 data URI 放进 SVG。图像本身不含文字，文字由外面的 <text> 负责。 */
export const image = (href, x, y, w, h, o = {}) =>
  `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" `
  + `preserveAspectRatio="none"${o.clip ? ` clip-path="${o.clip}"` : ''}/>`;

/** 色标图例：一条渐变条 + 两端文字，告诉读者颜色深浅代表什么。 */
export function colorbar(x, y, w, h, cmap, o = {}) {
  const { lo = '弱', hi = '强', size = 11.5, steps = 24 } = o;
  const map = COLORMAPS[cmap] ?? COLORMAPS.blue;
  let s = '';
  for (let i = 0; i < steps; i += 1) {
    const [r, g, b] = map(i / (steps - 1));
    s += R(x + (i * w) / steps, y, w / steps + 0.6, h, { fill: `rgb(${r},${g},${b})` });
  }
  s += R(x, y, w, h, { stroke: PALETTE.grid });
  s += T(x - 6, y + h - 1, lo, { size, fill: PALETTE.muted, anchor: 'end' });
  s += T(x + w + 6, y + h - 1, hi, { size, fill: PALETTE.muted });
  return s;
}

/**
 * 横轴刻度。图上写了「质心约 2510 Hz」，读者就得能在轴上找到 2510 的位置——
 * 没有刻度的曲线图只是示意，不能称为数据图。
 *
 * @param x,y,w   绘图区左上角与宽度（y 传绘图区底边）
 * @param ticks   [[值, 标签], ...] 或 [值, ...]
 * @param min,max 轴的数值范围
 */
export function axisX(x, y, w, ticks, min, max, o = {}) {
  const { size = 11.5, fill = PALETTE.muted, unit = '', grid = false, top = null } = o;
  let s = L(x, y, x + w, y, { c: PALETTE.grid, w: 1 });
  for (const t of ticks) {
    const [v, lab] = Array.isArray(t) ? t : [t, String(t)];
    const px = x + ((v - min) / (max - min)) * w;
    s += L(px, y, px, y + 4, { c: PALETTE.muted, w: 1 });
    if (grid && top !== null) s += L(px, top, px, y, { c: PALETTE.grid, w: 1 });
    s += T(px, y + size + 6, lab, { size, fill, anchor: 'middle' });
  }
  if (unit) s += T(x + w, y + size * 2 + 10, unit, { size, fill, anchor: 'end' });
  return s;
}

/** 纵轴刻度。用法与 axisX 对称，x 传绘图区左边。 */
export function axisY(x, y, h, ticks, min, max, o = {}) {
  const { size = 11.5, fill = PALETTE.muted, unit = '', grid = false, right = null } = o;
  let s = L(x, y, x, y + h, { c: PALETTE.grid, w: 1 });
  for (const t of ticks) {
    const [v, lab] = Array.isArray(t) ? t : [t, String(t)];
    const py = y + h - ((v - min) / (max - min)) * h;
    s += L(x - 4, py, x, py, { c: PALETTE.muted, w: 1 });
    if (grid && right !== null) s += L(x, py, right, py, { c: PALETTE.grid, w: 1 });
    s += T(x - 7, py + size * 0.36, lab, { size, fill, anchor: 'end' });
  }
  if (unit) s += T(x, y - 7, unit, { size, fill });
  return s;
}

/** 把密集波形降采样成上下包络，避免几万个点塞进 SVG。 */
export function envelopePath(samples, x, y, w, h, o = {}) {
  const { c = PALETTE.s1, opacity = 1 } = o;
  const cols = Math.round(w * 2);
  const step = samples.length / cols;
  const top = [];
  const bot = [];
  for (let i = 0; i < cols; i += 1) {
    let lo = 1; let hi = -1;
    const a = Math.floor(i * step);
    const b = Math.min(samples.length, Math.floor((i + 1) * step));
    for (let k = a; k < b; k += 1) { const v = samples[k]; if (v < lo) lo = v; if (v > hi) hi = v; }
    if (b <= a) { lo = 0; hi = 0; }
    const px = x + (i / (cols - 1)) * w;
    top.push([px, y + h / 2 - hi * (h / 2) * 0.94]);
    bot.push([px, y + h / 2 - lo * (h / 2) * 0.94]);
  }
  const d = `M${top.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}`
    + `L${bot.reverse().map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}Z`;
  return `<path d="${d}" fill="${c}" opacity="${opacity}" stroke="none"/>`;
}

// ---------- 版式 ----------

export const LAYOUT = {
  desktop: { W: 880, pad: 28, title: 17, label: 13.5, tick: 12, stack: false },
  mobile: { W: 420, pad: 18, title: 16, label: 13, tick: 11.5, stack: true },
};
