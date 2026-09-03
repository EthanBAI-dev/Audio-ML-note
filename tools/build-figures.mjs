#!/usr/bin/env node
// 为零基础版第 01–05 课生成配图，每张同时出电脑版和手机版。
//
//   node tools/build-figures.mjs
//
// 输出：
//   figures/desktop/*.svg   880 px，横向排布，用于宽屏
//   figures/mobile/*.svg    420 px，竖向单列，360 px 正文宽度下最小字号仍约 12 px
//
// 两版由同一份数据和同一段代码生成，只有排布不同，不会出现两版对不上的情况。
//
// 原则：
//   - 波形、频谱、声谱图一律来自真实计算（课程音频，或与正文严格对应的合成信号），
//     不手绘色块；连续像素场渲染成 PNG 再嵌进 SVG，坐标轴与中文标注仍是真实 <text>。
//   - 声谱图用 magma（音频领域惯例，感知均匀、色觉障碍友好）。
//   - 其余图形用通过校验的分类色：蓝 #0878b9 / 暖 #c65a3d / 绿 #3b8f68。
//   - 图内一律用日常说法，不出现「时域 / 频域 / 幅值 / dB SPL」这类术语。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, stft, magnitudeSpectrum, synthHumAndKnock } from './lib/dsp.mjs';
import { spectrogramPng, colorbar as cbar } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_01-05', 'figures');

const BLUE = '#0878b9';
const SOFT = '#d9ecf8';
const PALE = '#edf6fc';
const INK = '#1f2933';
const MUTED = '#647382';
const WARM = '#c65a3d';
const GREEN = '#3b8f68';
const GRID = '#dce5ec';
const PLATE = '#f7f9fb';
const FONT = 'Microsoft YaHei, PingFang SC, Noto Sans SC, Hiragino Sans GB, sans-serif';

const MODES = {
  mobile: { name: 'mobile', W: 420, pad: 24, gap: 18, h1: 18, h2: 17, body: 15, small: 14, tick: 14 },
  desktop: { name: 'desktop', W: 880, pad: 34, gap: 22, h1: 22, h2: 17.5, body: 15, small: 14, tick: 12.5 },
};
const isWide = (M) => M.name === 'desktop';

// ---------- 基元 ----------

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = (W, h, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" `
  + `font-family="${FONT}" fill="${INK}" role="img" aria-label="${esc(label)}">\n`
  + `<rect width="${W}" height="${h}" fill="#ffffff"/>\n${body}\n</svg>\n`;

function T(x, y, v, o = {}) {
  const { size = 15, weight = 400, fill = INK, anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" `
    + `text-anchor="${anchor}">${esc(v)}</text>`;
}
function MT(x, y, lines, o = {}) {
  const { size = 15, weight = 400, fill = INK, anchor = 'start', leading = Math.round(size * 1.45) } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" `
    + `text-anchor="${anchor}">${lines.map((l, i) =>
      `<tspan x="${x}" dy="${i === 0 ? 0 : leading}">${esc(l)}</tspan>`).join('')}</text>`;
}
function R(x, y, w, h, o = {}) {
  const { fill = 'none', stroke = GRID, sw = 1, radius = 8, opacity = 1 } = o;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" `
    + `stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;
}
function L(x1, y1, x2, y2, o = {}) {
  const { color = GRID, width = 1, dash = '' } = o;
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" `
    + `stroke="${color}" stroke-width="${width}" stroke-linecap="round"`
    + `${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}
function C(x, y, r, o = {}) {
  const { fill = BLUE, stroke = 'none', sw = 1 } = o;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function PATH(d, o = {}) {
  const { color = BLUE, width = 2, fill = 'none', dash = '' } = o;
  return `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" `
    + `stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}
function P(points, o = {}) {
  const { color = BLUE, width = 2, fill = 'none' } = o;
  return `<polyline points="${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" `
    + `fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
}
function ARROW(x1, y1, x2, y2, o = {}) {
  const { color = MUTED, width = 1.8, head = 7 } = o;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p1 = [x2 - head * Math.cos(a - 0.48), y2 - head * Math.sin(a - 0.48)];
  const p2 = [x2 - head * Math.cos(a + 0.48), y2 - head * Math.sin(a + 0.48)];
  return L(x1, y1, x2, y2, { color, width })
    + `<polygon points="${x2},${y2} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="${color}"/>`;
}
const card = (x, y, w, h, o = {}) =>
  R(x, y, w, h, { fill: o.fill ?? PLATE, stroke: o.stroke ?? GRID, sw: o.sw ?? 1, radius: o.radius ?? 10 });

const header = (M, lines) => (isWide(M)
  ? T(M.pad, 34, lines.join(''), { size: M.h1, weight: 700 })
  : MT(M.pad - 2, 30, lines, { size: M.h1, weight: 700, leading: 25 }));
const headerH = (M, lines) => (isWide(M) ? 54 : 30 + (lines.length - 1) * 25 + 22);

function curve(x, y, w, h, fn, n = 260, o = {}) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    pts.push([x + u * w, y + h - Math.max(0, Math.min(1, fn(u))) * h]);
  }
  return P(pts, o);
}
const plotFrame = (x, y, w, h) => R(x, y, w, h, { fill: '#ffffff', stroke: GRID, radius: 6 })
  + L(x + 8, y + h / 2, x + w - 8, y + h / 2, { color: GRID });

/**
 * 按 mode 排 n 个等宽卡片。电脑版横排（cols 列），手机版竖排单列。
 * 返回槽位和整体高度，figure 只需要加一个 y 偏移。
 */
function lay(M, n, { h, cols, gap = M.gap } = {}) {
  const c = isWide(M) ? (cols ?? n) : 1;
  const rows = Math.ceil(n / c);
  const w = (M.W - M.pad * 2 - gap * (c - 1)) / c;
  const slots = [];
  for (let i = 0; i < n; i += 1) {
    const r = Math.floor(i / c);
    const k = i % c;
    slots.push({ x: M.pad + k * (w + gap), y: r * (h + gap), w, h, col: k, row: r });
  }
  return { slots, w, cols: c, rows, height: rows * h + (rows - 1) * gap };
}

/** 步骤之间的箭头：横排指右，竖排指下。 */
function stepArrow(M, a, b, yOff) {
  if (isWide(M) && a.row === b.row) {
    return ARROW(a.x + a.w + 3, yOff + a.y + a.h / 2, b.x - 3, yOff + b.y + b.h / 2, { color: '#9ba9b5' });
  }
  const cx = a.x + a.w / 2;
  return ARROW(cx, yOff + a.y + a.h + 2, cx, yOff + b.y - 2, { color: '#9ba9b5' });
}

// ---------- 素材：真实音频与合成信号 ----------

const SR = 16000;
const load = (f) => {
  const w = readWav(join(ROOT, 'source_course', 'audio_resources', f));
  return { samples: resample(w.samples, w.sampleRate, SR), sampleRate: SR };
};
const cut = (src, from, dur) => ({
  samples: src.samples.subarray(Math.floor(from * SR), Math.floor((from + dur) * SR)),
  sampleRate: SR,
});

const SYNTH = synthHumAndKnock(SR, 2.0, 1.25);           // 正文里的「持续嗡声 + 一次敲击」
const PIANO = cut(load('piano_c.wav'), 0.02, 1.4);
const VIOLIN = cut(load('violin_c.wav'), 0.15, 1.9);
const NOISE = cut(load('noise.wav'), 1.0, 1.2);
const VOICE10 = cut(load('voice.wav'), 0.4, 10.0);       // 分帧图要对应「10 秒录音」
const VOICE = cut(load('voice.wav'), 0.4, 3.2);
const SCALE = cut(load('scale.wav'), 0.1, 7.5);          // 上行音阶，在声谱图上是一级级台阶

/** 找出这段声音的基频：150–700 Hz 内幅度最大的那根谱线。 */
function findF0(src) {
  const start = Math.min(src.samples.length - 2048, Math.floor(src.samples.length * 0.15));
  const mag = magnitudeSpectrum(src.samples.subarray(start, start + 2048), 2048);
  const binHz = src.sampleRate / 2048;
  let best = 0;
  let bestK = 1;
  for (let k = Math.ceil(150 / binHz); k <= Math.floor(700 / binHz); k += 1) {
    if (mag[k] > best) { best = mag[k]; bestK = k; }
  }
  return bestK * binHz;
}

/** 中文折行：优先在标点后断开，否则按字数硬断。 */
function wrapCJK(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const out = [];
  let line = '';
  for (const ch of text) {
    line += ch;
    const breakable = '，。、；：？！）」』'.includes(ch);
    if (line.length >= maxChars || (breakable && line.length >= maxChars - 3)) { out.push(line); line = ''; }
  }
  if (line) out.push(line);
  return out;
}

// ---------- 数据面板 ----------

function wavePanel(x, y, w, h, src, o = {}) {
  const { tick = 13, color = BLUE, xlabel = '时间 →' } = o;
  const { samples } = src;
  let s = plotFrame(x, y, w, h);
  const cols = Math.round((w - 12) * 2);
  const step = samples.length / cols;
  const top = [];
  const bot = [];
  for (let i = 0; i < cols; i += 1) {
    let lo = 1;
    let hi = -1;
    const a = Math.floor(i * step);
    const b = Math.min(samples.length, Math.floor((i + 1) * step));
    for (let k = a; k < b; k += 1) { if (samples[k] < lo) lo = samples[k]; if (samples[k] > hi) hi = samples[k]; }
    if (b <= a) { lo = 0; hi = 0; }
    const px = x + 6 + (i / (cols - 1)) * (w - 12);
    top.push([px, y + h / 2 - hi * (h / 2 - 6)]);
    bot.push([px, y + h / 2 - lo * (h / 2 - 6)]);
  }
  const d = `M${top.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}`
    + `L${bot.reverse().map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join('L')}Z`;
  s += `<path d="${d}" fill="${color}" opacity="0.92" stroke="none"/>`;
  if (xlabel) s += T(x + 4, y + h + tick + 6, xlabel, { size: tick, fill: MUTED });
  return s;
}

function spectrumPanel(x, y, w, h, src, o = {}) {
  const { tick = 13, fmax = 2000, at = 0.35, ticks = true } = o;
  const { samples, sampleRate } = src;
  const start = Math.max(0, Math.min(samples.length - 2048, Math.floor(samples.length * at)));
  const mag = magnitudeSpectrum(samples.subarray(start, start + 2048), 2048);
  const binHz = sampleRate / 2048;
  const kMax = Math.floor(fmax / binHz);
  let peak = 1e-12;
  for (let k = 1; k <= kMax; k += 1) peak = Math.max(peak, mag[k]);

  let s = R(x, y, w, h, { fill: '#ffffff', stroke: GRID, radius: 6 });
  if (ticks) {
    for (let hz = 500; hz < fmax; hz += 500) {
      const px = x + 6 + (hz / fmax) * (w - 12);
      s += L(px, y + 4, px, y + h - 4, { color: GRID });
    }
  }
  const pts = [];
  for (let k = 1; k <= kMax; k += 1) pts.push([x + 6 + (k / kMax) * (w - 12), y + h - 6 - (mag[k] / peak) * (h - 14)]);
  s += P(pts, { color: BLUE, width: 1.7 });
  s += T(x + 4, y + h + tick + 6, '低', { size: tick, fill: MUTED });
  s += T(x + w - 4, y + h + tick + 6, '高', { size: tick, fill: MUTED, anchor: 'end' });
  return s;
}

async function spectrogramPanel(x, y, w, h, src, o = {}) {
  const { tick = 13, fmax = 2000, floor = -55, bar = true } = o;
  const S = stft(src.samples, src.sampleRate, { nfft: 1024, hop: 128 });
  const href = await spectrogramPng(S, {
    w: Math.round(w * 2.2), h: Math.round(h * 2.2), fmax, dbFloor: floor, cmap: 'magma',
  });
  let s = `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
  s += R(x, y, w, h, { stroke: GRID, radius: 0 });
  s += T(x + 4, y + h + tick + 6, '时间 →', { size: tick, fill: MUTED });
  s += T(x + w - 4, y + tick + 4, '高', { size: tick, fill: '#ffffff', anchor: 'end' });
  s += T(x + w - 4, y + h - 6, '低', { size: tick, fill: '#ffffff', anchor: 'end' });
  if (bar) s += cbar(x + w - 80, y + h + 8, 48, 7, 'magma', { lo: '弱', hi: '强', size: tick });
  return s;
}

// ---------- 机制小图案（沿用上一版，仅作机制提示） ----------

function icon(kind, x, y, w = 74, h = 58) {
  let out = R(x, y, w, h, { fill: '#ffffff', stroke: GRID, radius: 8 });
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (kind === 'air') {
    const sx = w / 104;
    const sy = h / 72;
    out += R(x + 10 * sx, cy - 15 * sy, 14 * sx, 30 * sy, { fill: SOFT, stroke: BLUE, radius: 3 });
    out += PATH(`M${x + 24 * sx} ${cy - 12 * sy} L${x + 39 * sx} ${cy - 21 * sy} L${x + 39 * sx} ${cy + 21 * sy} L${x + 24 * sx} ${cy + 12 * sy} Z`, { color: BLUE, width: 1.7, fill: PALE });
    [0, 14, 28].forEach((d) => { out += PATH(`M${x + (49 + d) * sx} ${cy - (18 - d * 0.15) * sy} Q${x + (62 + d) * sx} ${cy} ${x + (49 + d) * sx} ${cy + (18 - d * 0.15) * sy}`, { color: d === 28 ? WARM : BLUE, width: 1.8 }); });
  }
  if (kind === 'propagate') {
    // 疏密不能只画一组，那看着像「左边密右边疏」的静态分布。
    // 按真实的纵波来画：每颗空气分子都在自己的位置附近来回动，位移取
    // 正弦。位移一叠加，密的地方和疏的地方就沿着 x 轴连续交替出现，
    // 一眼能看出这是一列波，而不是两堆点。
    const CYCLES = 2.5;       // 画面里放下两组半疏密
    const N = 20;             // 每行的分子数。再多点就挤成一条实线了
    const rows = 3;
    const padX = 8;
    const span = w - padX * 2;
    // 位移幅度取到间距的 0.45 倍：疏密拉得开，相邻两颗又不会交叉换位
    const amp = (span / (N - 1)) * 0.45;
    const top = y + 12;
    const gapY = (h - 26) / (rows - 1);
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < N; i += 1) {
        const u = i / (N - 1);
        const d = amp * Math.sin(2 * Math.PI * CYCLES * u);
        // 位移越往密处挤，颜色越深，疏密看得更清楚
        const dense = Math.cos(2 * Math.PI * CYCLES * u) < 0;
        out += C(x + padX + u * span + d, top + j * gapY, 2.1,
          { fill: dense ? BLUE : '#a9cde5' });
      }
    }
    out += ARROW(x + padX + 2, y + h - 7, x + w - padX - 2, y + h - 7,
      { color: WARM, width: 1.5, head: 5 });
  }
  if (kind === 'mic') {
    out += R(cx - 12, y + 9, 24, 30, { fill: PALE, stroke: BLUE, sw: 1.7, radius: 12 });
    out += PATH(`M${cx - 19} ${y + 28} Q${cx - 18} ${y + 47} ${cx} ${y + 47} Q${cx + 18} ${y + 47} ${cx + 19} ${y + 28}`, { color: MUTED, width: 1.7 });
    out += L(cx, y + 47, cx, y + h - 4, { color: MUTED, width: 1.7 });
    out += L(cx - 12, y + h - 4, cx + 12, y + h - 4, { color: MUTED, width: 1.7 });
  }
  if (kind === 'samples') {
    // 原来没有横坐标轴，一串竖线看不出「按时间排列」。补一条时间轴，
    // 每个采样点在轴上留一个刻度，间隔相等——等间隔正是采样的定义。
    const padX = 8;
    const plotTop = y + 9;
    const plotH = h - 18;
    const span = w - padX * 2;
    const f = (u) => 0.5 + 0.34 * Math.sin(u * 13);
    // 横轴就是正弦的中线，画在正中间。画在底下是错的：采样竖线是从
    // 中线往上下两边量的，轴跑到底下，竖线就没了参照。
    const mid = plotTop + plotH * 0.5;
    const axisY = mid;
    out += curve(x + padX, plotTop, span, plotH, f, 160,
      { color: '#b6c4cf', width: 1.2 });
    const N = 9;
    for (let i = 0; i < N; i += 1) {
      const u = i / (N - 1);
      const px = x + padX + u * span;
      const py = plotTop + plotH * (1 - f(u));
      out += L(px, mid, px, py, { color: BLUE, width: 1.1 });
      out += C(px, py, 2.4, { fill: BLUE });
    }
    // 就一条线。刻度和「时间」两个字都不画：这个小图放不下 14 px 的字
    // （写 8.5 px 手机上缩到 7.3 px 会被 check-svg-mobile 判不合格）。
    out += L(x + padX - 3, axisY, x + w - padX + 3, axisY,
      { color: MUTED, width: 1.2 });
  }
  if (kind === 'decision') {
    [0, 1, 2].forEach((i) => {
      const yy = y + 11 + i * 15;
      out += R(x + 10, yy, 10, 10, { fill: i === 0 ? BLUE : '#ffffff', stroke: BLUE, radius: 2 });
      out += L(x + 27, yy + 5, x + w - 9, yy + 5, { color: i === 0 ? BLUE : '#b8c4ce', width: 2 });
    });
  }
  if (kind === 'bulb') {
    out += C(cx, cy - 5, 14, { fill: '#fff4ca', stroke: '#d6a72e', sw: 1.7 });
    out += R(cx - 8, cy + 9, 16, 9, { fill: '#d9e1e8', stroke: MUTED, radius: 2 });
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      out += L(cx + Math.cos(a) * 21, cy - 5 + Math.sin(a) * 21, cx + Math.cos(a) * 27, cy - 5 + Math.sin(a) * 27, { color: '#d6a72e', width: 1.5 });
    }
  }
  if (kind === 'spread') {
    out += C(x + 16, cy, 5, { fill: WARM });
    [18, 30, 42].forEach((r, i) => { out += PATH(`M${x + 16 + r * 0.65} ${cy - r * 0.55} A${r} ${r} 0 0 1 ${x + 16 + r * 0.65} ${cy + r * 0.55}`, { color: i === 0 ? BLUE : '#aab8c4', width: 1.4, dash: i === 2 ? '4 3' : '' }); });
  }
  if (kind === 'meter') {
    out += R(x + 10, y + 12, w - 20, h - 24, { fill: PALE, stroke: MUTED, radius: 5 });
    out += PATH(`M${x + 18} ${cy + 6} Q${cx} ${cy - 17} ${x + w - 18} ${cy + 6}`, { color: BLUE, width: 1.8 });
    out += L(cx, cy + 6, x + w - 22, cy - 10, { color: WARM, width: 2 });
    out += C(cx, cy + 6, 3, { fill: WARM });
  }
  if (kind === 'frequency') {
    [14, 30, 46].forEach((bh, i) => { out += R(x + 13 + i * 17, y + h - 8 - bh, 10, bh, { fill: i === 2 ? BLUE : SOFT, stroke: BLUE, radius: 2 }); });
  }
  if (kind === 'precision') {
    for (let i = 0; i < 7; i += 1) out += L(x + 10, y + 8 + i * 7, x + w - 10, y + 8 + i * 7, { color: i % 2 ? GRID : BLUE, width: i % 2 ? 1 : 1.4 });
    out += C(cx + 10, cy - 7, 4, { fill: WARM });
  }
  if (kind === 'ladder') {
    [0, 1, 2].forEach((i) => { out += R(x + 12 + i * 15, y + 37 - i * 12, 19, 12 + i * 12, { fill: i === 2 ? BLUE : SOFT, stroke: BLUE, radius: 2 }); });
  }
  if (kind === 'clock') {
    out += C(cx, cy, 20, { fill: PALE, stroke: BLUE, sw: 1.7 });
    out += L(cx, cy, cx, cy - 13, { color: BLUE, width: 2 });
    out += L(cx, cy, cx + 12, cy + 8, { color: WARM, width: 2 });
    out += C(cx, cy, 3, { fill: BLUE });
  }
  if (kind === 'domain') {
    out += L(x + 10, y + h - 12, x + w - 8, y + h - 12, { color: MUTED, width: 1.3 });
    out += curve(x + 12, y + 8, w - 24, h - 22, (u) => 0.5 + 0.27 * Math.sin(u * 25), 120, { color: BLUE, width: 1.5 });
    out += R(x + w - 24, y + 13, 8, 27, { fill: WARM, radius: 2, stroke: 'none' });
  }
  if (kind === 'learn') {
    const left = [[x + 13, cy - 14], [x + 13, cy + 14]];
    const mid = [[cx, cy - 18], [cx, cy], [cx, cy + 18]];
    const right = [[x + w - 13, cy]];
    left.forEach((a) => mid.forEach((b) => { out += L(a[0], a[1], b[0], b[1], { color: '#aac5d7', width: 1 }); }));
    mid.forEach((a) => right.forEach((b) => { out += L(a[0], a[1], b[0], b[1], { color: '#aac5d7', width: 1 }); }));
    [...left, ...mid, ...right].forEach(([px, py], i) => { out += C(px, py, 4, { fill: i < 2 ? SOFT : BLUE, stroke: BLUE, sw: 1 }); });
  }
  return out;
}

// ===================================================================
// 图
// ===================================================================

const FIGURES = {};

// ---- 01 ----

FIGURES['01-pipeline'] = async (M) => {
  const head = ['一段录音怎样变成', '程序真正读到的数字'];
  const steps = [
    ['空气在推挤', ['说话、敲击让空气', '一会儿密、一会儿疏'], 'air'],
    ['麦克风变成电压', ['薄膜跟着空气运动', '运动大小变成电压'], 'mic'],
    ['每秒测量许多次', ['每次结果记成', '一个数字'], 'samples'],
    ['整理成一种表示', ['保留任务需要的', '时间或频率线索'], 'domain'],
    ['程序给出判断', ['狗叫、汽车声', '或者人在说话'], 'decision'],
  ];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const { slots, height } = lay(M, 5, { h: wide ? 176 : 92, cols: 5, gap: wide ? 26 : 26 });
  let s = header(M, head);
  steps.forEach(([title, desc, ic], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h, { fill: i === 4 ? PALE : PLATE, stroke: i === 4 ? BLUE : GRID });
    if (wide) {
      s += C(p.x + p.w / 2, y + 26, 15, { fill: BLUE });
      s += T(p.x + p.w / 2, y + 31, i + 1, { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + p.w / 2, y + 62, title, { size: M.h2 - 1.5, weight: 700, anchor: 'middle' });
      s += MT(p.x + p.w / 2, y + 84, desc, { size: 13, fill: MUTED, anchor: 'middle', leading: 18 });
      s += icon(ic, p.x + p.w / 2 - 33, y + 112, 66, 52);
    } else {
      s += C(p.x + 30, y + 46, 18, { fill: BLUE });
      s += T(p.x + 30, y + 52, i + 1, { size: 16, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + 60, y + 34, title, { size: M.h2, weight: 700 });
      s += MT(p.x + 60, y + 59, desc, { size: 14, fill: MUTED, leading: 19 });
      s += icon(ic, p.x + p.w - 84, y + 17, 66, 58);
    }
    if (i < 4) s += stepArrow(M, slots[i], slots[i + 1], y0);
  });
  return svg(M.W, y0 + height + 16, s, '录音从空气振动到程序判断的五个步骤');
};

/** 三视图：波形 / 频谱 / 声谱图，全部来自真实计算。 */
async function threeViewFigure(M, { head, labels, descs, src, note, annotate = false, label }) {
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 232 : 196;
  const { slots, height } = lay(M, 3, { h: ch, cols: 3 });
  let s = header(M, head);
  const px0 = wide ? 16 : 18;
  const pw = slots[0].w - px0 * 2;
  const ph = wide ? 96 : 88;
  for (let i = 0; i < 3; i += 1) {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h);
    s += T(p.x + px0, y + 28, labels[i], { size: M.h2 - 1, weight: 700, fill: BLUE });
    s += T(p.x + px0, y + 51, descs[i], { size: M.small, fill: MUTED });
    const py = y + 68;
    if (i === 0) s += wavePanel(p.x + px0, py, pw, ph, src, { tick: M.tick });
    else if (i === 1) s += spectrumPanel(p.x + px0, py, pw, ph, src, { tick: M.tick });
    // eslint-disable-next-line no-await-in-loop
    else s += await spectrogramPanel(p.x + px0, py, pw, ph, src, { tick: M.tick });
    if (i === 2 && annotate) {
      s += L(p.x + px0 + pw * 0.05, py + ph * 0.72, p.x + px0 + pw * 0.40, py + ph * 0.72, { color: '#ffd9a0', width: 1.6, dash: '4 3' });
      s += T(p.x + px0 + pw * 0.05, py + ph * 0.72 - 7, '横线 = 一直都在', { size: M.tick, fill: '#ffd9a0', weight: 700 });
      s += L(p.x + px0 + pw * 0.625, py + ph * 0.06, p.x + px0 + pw * 0.625, py + ph * 0.5, { color: '#ffd9a0', width: 1.6, dash: '4 3' });
      s += T(p.x + px0 + pw * 0.625 - 6, py + ph * 0.06 + 11, '竖线 = 只响一下', { size: M.tick, fill: '#ffd9a0', weight: 700, anchor: 'end' });
    }
  }
  let h = y0 + height + 20;
  if (note) {
    const ls = isWide(M) ? [note] : wrapCJK(note, 20);
    s += MT(M.pad, h + 6, ls, { size: M.small, fill: MUTED, leading: 22 });
    h += 26 + (ls.length - 1) * 22;
  }
  return svg(M.W, h, s, label);
}

FIGURES['01-three-views'] = (M) => threeViewFigure(M, {
  head: ['同一段声音的三种表示'],
  labels: ['波形：看每个瞬间', '频谱：看有哪些成分', '声谱图：成分和时间一起看'],
  descs: ['敲击发生在哪一刻', '低音和高音各有多少', '哪些成分在什么时候出现'],
  src: SYNTH,
  annotate: true,
  note: '同一段机器声：持续的嗡嗡声，第 1.25 秒有一下敲击。',
  label: '同一段声音的波形、频谱与声谱图',
});

FIGURES['05-three-angles'] = (M) => threeViewFigure(M, {
  head: ['信号域：三种观察角度'],
  labels: ['看时间上的起伏', '看频率成分的分布', '时间和频率一起看'],
  descs: ['什么时候响、什么时候静', '低频和高频各有多少', '哪些成分在什么时候出现'],
  src: SCALE,
  note: '素材：课程音频 scale.wav，一段从低到高的音阶。右图里一级级往上的亮块，就是一个个音。',
  label: '时间、频率与时频三种观察角度',
});

FIGURES['01-evidence'] = async (M) => {
  const head = ['同一段机器声里', '不同表示能看见什么'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 250 : 208;
  const { slots, height } = lay(M, 3, { h: ch, cols: 3 });
  const rows = [
    ['波形', [['短促敲击', true], ['持续嗡声', false]]],
    ['频谱', [['短促敲击', false], ['持续嗡声', true]]],
    ['声谱图', [['短促敲击', true], ['持续嗡声', true]]],
  ];
  let s = header(M, head);
  const px0 = wide ? 16 : 18;
  const pw = slots[0].w - px0 * 2;
  const ph = wide ? 92 : 84;
  for (let i = 0; i < 3; i += 1) {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h);
    s += R(p.x + px0, y + 20, 4, 20, { fill: i === 2 ? WARM : BLUE, stroke: 'none', radius: 2 });
    s += T(p.x + px0 + 14, y + 36, rows[i][0], { size: M.h2 - 1, weight: 700, fill: BLUE });
    const py = y + 52;
    // 三栏统一节奏：图 → 轴标签 → 两行结论，位置完全对齐
    if (i === 0) s += wavePanel(p.x + px0, py, pw, ph, SYNTH, { tick: M.tick });
    else if (i === 1) s += spectrumPanel(p.x + px0, py, pw, ph, SYNTH, { tick: M.tick });
    // eslint-disable-next-line no-await-in-loop
    else s += await spectrogramPanel(p.x + px0, py, pw, ph, SYNTH, { tick: M.tick, bar: false });
    rows[i][1].forEach(([lab, ok], j) => {
      const yy = py + ph + 40 + j * 24;
      s += T(p.x + px0, yy, lab, { size: M.small, fill: INK });
      s += T(p.x + px0 + 76, yy, ok ? '✓ 看得清' : '— 容易丢失', { size: M.small, weight: 700, fill: ok ? GREEN : MUTED });
    });
  }
  const h = y0 + height + 16;
  let s2 = s + MT(M.pad, h + 8, wide
    ? ['没有“最高级”的表示，只有任务所需的证据是否还在。']
    : ['没有“最高级”的表示，', '只有任务所需的证据是否还在。'],
  { size: M.body, weight: 700, fill: WARM, leading: 21 });
  return svg(M.W, h + (wide ? 30 : 52), s2, '波形频谱和声谱图对敲击与嗡声的保留差异');
};

FIGURES['02-air-to-numbers'] = async (M) => {
  const head = ['空气的变化怎样变成', '录音里的数字'];
  const steps = [
    ['音箱纸盆来回运动', ['往外推时空气变密', '往回收时空气变疏'], 'air'],
    ['疏密变化向外传播', ['空气只在原地来回动', '传播的是变化和能量'], 'propagate'],
    ['麦克风薄膜跟着动', ['所在位置不同', '记录结果也不同'], 'mic'],
    ['设备反复测量', ['每次结果记成数字', '按时间连起来就是波形'], 'samples'],
  ];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const { slots, height } = lay(M, 4, { h: wide ? 190 : 104, cols: 4, gap: 26 });
  let s = header(M, head);
  steps.forEach(([title, lines, ic], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h, { fill: i === 3 ? PALE : PLATE });
    if (wide) {
      s += C(p.x + p.w / 2, y + 26, 15, { fill: BLUE });
      s += T(p.x + p.w / 2, y + 31, i + 1, { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + p.w / 2, y + 62, title, { size: M.h2 - 1, weight: 700, anchor: 'middle' });
      s += MT(p.x + p.w / 2, y + 84, lines, { size: 13, fill: MUTED, anchor: 'middle', leading: 18 });
      // 卡片还有富余，图画宽一点，疏密和采样点才数得清
      const iw = Math.min(p.w - 24, 132);
      s += icon(ic, p.x + (p.w - iw) / 2, y + 112, iw, 66);
    } else {
      s += C(p.x + 30, y + 34, 17, { fill: BLUE });
      s += T(p.x + 30, y + 40, i + 1, { size: 15, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + 58, y + 38, title, { size: M.h2, weight: 700 });
      s += MT(p.x + 58, y + 66, lines, { size: 14, fill: MUTED, leading: 20 });
      s += icon(ic, p.x + p.w - 128, y + 14, 114, 78);
    }
    if (i < 3) s += stepArrow(M, slots[i], slots[i + 1], y0);
  });
  return svg(M.W, y0 + height + 16, s, '声音从音箱推动空气到麦克风记录数字');
};

FIGURES['02-three-structures'] = async (M) => {
  const head = ['波形里常见的三种结构'];
  const items = [
    ['周期：一遍狞重复', '琴弦、电机的稳定嗡声', VIOLIN, BLUE],
    ['噪声：找不到明显重复', '风声、摩擦声、底噪', NOISE, BLUE],
    ['瞬态：集中在一瞬间', '敲桌子、鼓点、碰撞', cut(SYNTH, 1.18, 0.5), WARM],
  ];
  items[0][0] = '周期：一遍遍重复';
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 176 : 164;
  const { slots, height } = lay(M, 3, { h: ch, cols: 3 });
  let s = header(M, head);
  items.forEach(([title, sub, src, color], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h);
    s += T(p.x + 18, y + 29, title, { size: M.h2 - 1, weight: 700, fill: color });
    s += T(p.x + 18, y + 52, sub, { size: M.small, fill: MUTED });
    s += wavePanel(p.x + 18, y + 66, p.w - 36, ch - 92, src, { color, xlabel: '' });
  });
  const h = y0 + height + 16;
  s += T(M.pad, h + 10, '真实录音通常同时包含三种结构。', { size: M.body, fill: MUTED });
  return svg(M.W, h + 26, s, '周期噪声和瞬态三种波形结构');
};

FIGURES['02-sine-knobs'] = async (M) => {
  const head = ['正弦波的三个参数'];
  const base = (u) => 0.5 + 0.22 * Math.sin(u * 25);
  const items = [
    ['振幅：抖动有多大', '其他条件相同时，通常影响响度', (u) => 0.5 + 0.4 * Math.sin(u * 25)],
    ['频率：一秒重复多少次', '决定声音听起来有多高', (u) => 0.5 + 0.22 * Math.sin(u * 50)],
    ['相位：从一轮的哪里开始', '单独听不明显，叠加时会改变结果', (u) => 0.5 + 0.22 * Math.sin(u * 25 + Math.PI * 0.9)],
  ];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 186 : 176;
  const { slots, height } = lay(M, 3, { h: ch, cols: 3 });
  let s = header(M, head);
  items.forEach(([title, sub, fn], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h);
    s += T(p.x + 18, y + 30, title, { size: M.h2 - 1, weight: 700, fill: BLUE });
    s += T(p.x + 18, y + (wide ? 53 : 55), sub, { size: wide ? 13 : M.small, fill: MUTED });
    const py = y + 70;
    const ph = ch - 96;
    s += plotFrame(p.x + 18, py, p.w - 36, ph);
    s += curve(p.x + 24, py + 6, p.w - 48, ph - 12, base, 400, { color: '#bcc8d2', width: 1.5 });
    s += curve(p.x + 24, py + 6, p.w - 48, ph - 12, fn, 400, { color: BLUE, width: 2 });
  });
  const h = y0 + height + 16;
  s += T(M.pad, h + 10, '灰线是原来，蓝线是只改变一个参数。', { size: M.small, fill: MUTED });
  return svg(M.W, h + 26, s, '正弦波的振幅频率与相位');
};

FIGURES['02-note-vs-hz'] = async (M) => {
  const head = ['音符编号等距增加', '频率却按倍数上升'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const W = M.W - M.pad * 2;
  const cw = wide ? W * 0.58 : W;
  let s = header(M, head);
  const ph = wide ? 300 : 390;
  s += card(M.pad, y0, cw, ph);
  const gx = M.pad + 52;
  const gy = y0 + 24;
  const gw = cw - 74;
  const gh = ph - 70;
  const x = (m) => gx + ((m - 57) / 36) * gw;
  const yy = (f) => gy + gh - (Math.log2(f / 180) / Math.log2(1900 / 180)) * gh;
  [220, 440, 880, 1760].forEach((f) => {
    s += L(gx, yy(f), gx + gw, yy(f), { color: GRID });
    s += T(gx - 10, yy(f) + 5, `${f}`, { size: M.small, fill: MUTED, anchor: 'end' });
  });
  const pts = [];
  for (let m = 57; m <= 93; m += 0.25) pts.push([x(m), yy(440 * 2 ** ((m - 69) / 12))]);
  s += P(pts, { color: BLUE, width: 2.5 });
  [[57, 220, 'A3'], [69, 440, 'A4'], [81, 880, 'A5'], [93, 1760, 'A6']].forEach(([m, f, name]) => {
    s += C(x(m), yy(f), 5, { fill: '#fff', stroke: BLUE, sw: 2 });
    s += T(x(m), yy(f) - 12, name, { size: M.small, weight: 700, fill: BLUE, anchor: 'middle' });
  });
  s += T(gx + gw / 2, gy + gh + 26, '琴键编号 →', { size: M.small, fill: MUTED, anchor: 'middle' });
  const notes = ['每往上 12 个键：频率 × 2', '220 → 440 → 880 → 1760 Hz', '所以一个八度是频率翻倍，不是加固定数。'];
  if (wide) {
    s += MT(M.pad + cw + 26, y0 + 60, notes, { size: M.body, leading: 28 });
    return svg(M.W, y0 + ph + 20, s, 'MIDI 音符编号与频率倍数关系');
  }
  s += MT(M.pad, y0 + ph + 32, notes, { size: M.body, leading: 25 });
  return svg(M.W, y0 + ph + 32 + 25 * 2 + 20, s, 'MIDI 音符编号与频率倍数关系');
};

// ---- 03 ----

FIGURES['03-lamp-analogy'] = async (M) => {
  const head = ['三个“声音大小”', '描述的不是同一件事'];
  const items = [
    ['声功率：声源放出多少', ['像灯泡标着多少瓦', '描述声源本身'], 'bulb'],
    ['声强：每平方米收到多少', ['像桌面每块区域有多亮', '会随距离改变'], 'spread'],
    ['声压：麦克风在一点量到什么', ['空气压力怎样变化', '是麦克风首先响应的量'], 'meter'],
  ];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 212 : 148;
  const { slots, height } = lay(M, 3, { h: ch, cols: 3 });
  let s = header(M, head);
  items.forEach(([title, desc, ic], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h, { fill: i === 2 ? PALE : PLATE });
    if (wide) {
      s += C(p.x + p.w / 2, y + 28, 16, { fill: BLUE });
      s += T(p.x + p.w / 2, y + 33, i + 1, { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + p.w / 2, y + 66, title, { size: M.h2 - 1.5, weight: 700, anchor: 'middle' });
      s += MT(p.x + p.w / 2, y + 92, desc, { size: 13.5, fill: MUTED, anchor: 'middle', leading: 20 });
      s += icon(ic, p.x + p.w / 2 - 38, y + 134, 76, 62);
    } else {
      s += C(p.x + 32, y + 36, 18, { fill: BLUE });
      s += T(p.x + 32, y + 42, i + 1, { size: 15, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + 60, y + 41, title, { size: M.h2, weight: 700 });
      s += MT(p.x + 20, y + 82, desc, { size: M.body, fill: MUTED, leading: 23 });
      s += icon(ic, p.x + p.w - 90, y + 64, 72, 66);
    }
  });
  const h = y0 + height + 16;
  s += T(M.pad, h + 10, '放出、传到、测到，必须分开讨论。', { size: M.body, weight: 700, fill: WARM });
  return svg(M.W, h + 26, s, '声功率声强声压的区别');
};

FIGURES['03-distance'] = async (M) => {
  const head = ['平方反比：距离翻倍', '同样能量摊到四倍面积'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const W = M.W - M.pad * 2;
  let s = header(M, head);
  const dw = wide ? W * 0.46 : W;
  const dh = 212;
  s += card(M.pad, y0, dw, dh);
  const sx = M.pad + 74;
  const sy = y0 + 106;
  s += C(sx, sy, 10, { fill: WARM });
  s += T(sx, sy + 30, '声源', { size: M.small, fill: MUTED, anchor: 'middle' });
  s += PATH(`M${sx + 50} ${sy - 58} A82 82 0 0 1 ${sx + 50} ${sy + 58}`, { color: BLUE, width: 2 });
  s += PATH(`M${sx + 108} ${sy - 88} A150 150 0 0 1 ${sx + 108} ${sy + 88}`, { color: MUTED, width: 2, dash: '6 5' });
  s += T(sx + 58, sy - 63, '1 米', { size: M.body, weight: 700, fill: BLUE });
  s += T(sx + 118, sy - 85, '2 米', { size: M.body, weight: 700, fill: MUTED });

  const bx = wide ? M.pad + dw + 26 : M.pad;
  const by = wide ? y0 : y0 + dh + 20;
  const bw = wide ? W - dw - 26 : W;
  s += card(bx, by, bw, 98, { fill: PALE });
  s += R(bx + 28, by + 24, 48, 48, { fill: 'rgba(8,120,185,.65)', stroke: BLUE, radius: 4 });
  s += MT(bx + 96, by + 38, ['1 米：一格面积', '每格得到 1 份能量'], { size: M.body, leading: 24 });
  s += card(bx, by + 118, bw, 114);
  for (let a = 0; a < 2; a += 1) for (let b = 0; b < 2; b += 1) {
    s += R(bx + 24 + a * 34, by + 146 + b * 34, 30, 30, { fill: 'rgba(8,120,185,.18)', stroke: BLUE, radius: 3 });
  }
  s += MT(bx + 110, by + 148, ['2 米：四格面积', '每格只剩 1/4 份', '不是一半'],
    { size: M.body, weight: 700, fill: WARM, leading: 23 });
  const h = Math.max(y0 + dh, by + 232) + 18;
  s += T(M.pad, h + 8, '前提：空旷、无反射、声源向各方向均匀发声。', { size: M.small, fill: MUTED });
  return svg(M.W, h + 24, s, '距离翻倍声强降到四分之一');
};

FIGURES['03-decibel'] = async (M) => {
  const head = ['分贝：把巨大倍数', '压成容易比较的数字'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const W = M.W - M.pad * 2;
  const cw = wide ? W * 0.58 : W;
  const ph = wide ? 300 : 370;
  let s = header(M, head);
  s += card(M.pad, y0, cw, ph);
  const gx = M.pad + 54;
  const gy = y0 + 26;
  const gw = cw - 84;
  const gh = ph - 76;
  const x = (e) => gx + (e / 12) * gw;
  const yy = (db) => gy + gh - (db / 120) * gh;
  for (let e = 0; e <= 12; e += 3) {
    s += L(x(e), gy, x(e), gy + gh, { color: GRID });
    s += T(x(e), gy + gh + 22, e === 0 ? '1' : `10^${e}`, { size: M.small, fill: MUTED, anchor: 'middle' });
  }
  for (let db = 0; db <= 120; db += 30) {
    s += L(gx, yy(db), gx + gw, yy(db), { color: GRID });
    s += T(gx - 10, yy(db) + 5, db, { size: M.small, fill: MUTED, anchor: 'end' });
  }
  s += P([[x(0), yy(0)], [x(12), yy(120)]], { color: BLUE, width: 3 });
  [[0, 0, '刚能听见'], [6, 60, '正常说话'], [12, 120, '接近疼痛']].forEach(([e, db, lab]) => {
    s += C(x(e), yy(db), 5, { fill: '#fff', stroke: BLUE, sw: 2 });
    s += T(x(e) + (e === 12 ? -8 : 8), yy(db) - 12, lab,
      { size: M.small, weight: 700, fill: BLUE, anchor: e === 12 ? 'end' : 'start' });
  });
  s += T(M.pad + 12, y0 + ph - 12, '横轴：能量是参考值的多少倍', { size: M.small, fill: MUTED });
  const notes = ['分贝永远是“相对于参考值”的比值。', '参考值不同，分贝数就不能直接比较。'];
  if (wide) {
    s += MT(M.pad + cw + 26, y0 + 90, notes, { size: M.body, weight: 700, fill: WARM, leading: 26 });
    return svg(M.W, y0 + ph + 20, s, '分贝将一万亿倍能量范围转换为零到一百二十分贝');
  }
  s += MT(M.pad, y0 + ph + 30, notes, { size: M.body, weight: 700, fill: WARM, leading: 23 });
  return svg(M.W, y0 + ph + 30 + 23 + 24, s, '分贝将一万亿倍能量范围转换为零到一百二十分贝');
};

FIGURES['03-timbre'] = async (M) => {
  const head = ['音色来自两类差别'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const W = M.W - M.pad * 2;
  const cw = wide ? (W - 24) / 2 : W;
  const ch = wide ? 300 : 258;
  let s = header(M, head);

  // 左：成分比例（来自 piano_c 与 violin_c 的真实频谱）
  s += card(M.pad, y0, cw, ch);
  s += T(M.pad + 18, y0 + 30, '一、声音成分的比例不同', { size: M.h2 - 1, weight: 700, fill: BLUE });
  s += T(M.pad + 18, y0 + 54, '基本音高相同，更高成分的强弱不同', { size: M.small, fill: MUTED });
  const rowH = wide ? 108 : 92;
  const bh = rowH - 44;
  [['钢琴', PIANO, BLUE], ['小提琴', VIOLIN, WARM]].forEach(([name, src, col], k) => {
    const by = y0 + 76 + k * rowH;
    s += T(M.pad + 18, by + 12, name, { size: M.small, weight: 700, fill: col });
    // 取真实基频，量出前 6 个谐波的相对强度
    const start = Math.min(src.samples.length - 2048, Math.floor(src.samples.length * 0.15));
    const mag = magnitudeSpectrum(src.samples.subarray(start, start + 2048), 2048);
    const binHz = SR / 2048;
    const f0 = findF0(src);
    const bars = [];
    for (let n = 1; n <= 6; n += 1) {
      const k0 = Math.round((f0 * n) / binHz);
      let m = 0;
      for (let d = -2; d <= 2; d += 1) m = Math.max(m, mag[k0 + d] ?? 0);
      bars.push(m);
    }
    // 用分贝画，否则基本音一根独大，看不出各乐器的差别
    const mx = Math.max(...bars, 1e-12);
    const FLOOR = -42;
    const slotW = (cw - 44) / 6;
    const baseY = by + 20 + bh;
    s += L(M.pad + 22, baseY, M.pad + cw - 22, baseY, { color: GRID });
    bars.forEach((v, n) => {
      const db = 20 * Math.log10(Math.max(v, 1e-12) / mx);
      const h2 = Math.max(2, ((db - FLOOR) / -FLOOR) * (bh - 4));
      s += R(M.pad + 22 + n * slotW, baseY - h2, slotW - 8, h2,
        { fill: n === 0 ? col : SOFT, stroke: col, radius: 3 });
    });
  });
  const axY = y0 + 76 + rowH * 2 + 6;
  s += T(M.pad + 22, axY, '基本音', { size: M.tick, fill: MUTED });
  s += T(M.pad + cw - 22, axY, '更高的成分 →', { size: M.tick, fill: MUTED, anchor: 'end' });

  // 右：包络（来自真实录音的能量包络）
  const rx = wide ? M.pad + cw + 24 : M.pad;
  const ry = wide ? y0 : y0 + ch + 20;
  s += card(rx, ry, cw, ch);
  s += T(rx + 18, ry + 30, '二、声音随时间的变化不同', { size: M.h2 - 1, weight: 700, fill: WARM });
  s += T(rx + 18, ry + 54, '这种整体轮廓叫包络', { size: M.small, fill: MUTED });
  [['钢琴：很快变响，再慢慢衰减', PIANO, BLUE], ['小提琴：慢慢拉响，可以持续保持', VIOLIN, WARM]]
    .forEach(([lab, src, col], k) => {
      const py = ry + 74 + k * (wide ? 106 : 88);
      const ph2 = wide ? 66 : 54;
      s += wavePanel(rx + 18, py, cw - 36, ph2, src, { color: col, xlabel: '' });
      s += T(rx + 18, py + ph2 + 18, lab, { size: M.small, fill: col });
    });
  const h = Math.max(y0 + ch, ry + ch) + 18;
  const note = '音高和响度相同，音色仍然可能不同。素材：piano_c.wav 与 violin_c.wav。';
  const noteLines = isWide(M) ? [note] : wrapCJK(note, 20);
  s += MT(M.pad, h + 8, noteLines, { size: M.tick, fill: MUTED, leading: 20 });
  return svg(M.W, h + 24 + (noteLines.length - 1) * 20, s, '音色由频率成分比例和时间包络共同决定');
};

// ---- 04 ----

FIGURES['04-two-decisions'] = async (M) => {
  const head = ['连续声音变成数字', '需要两个决定'];
  const items = [
    ['连续变化的电压', '任何一个瞬间都可能有值', 'continuous'],
    ['采样：只在某些时刻测量', '决定一秒钟量多少次', 'samples'],
    ['量化：靠到最近档位', '决定每次测量能记多细', 'levels'],
  ];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 182 : 172;
  const { slots, height } = lay(M, 3, { h: ch, cols: 3, gap: 26 });
  let s = header(M, head);
  const fn = (u) => 0.5 + 0.38 * Math.sin(u * 7.2 + 0.4);
  items.forEach(([title, sub, type], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h, { fill: i === 0 ? PLATE : PALE });
    s += T(p.x + 18, y + 30, title, { size: M.h2 - 1.5, weight: 700, fill: i === 0 ? INK : BLUE });
    s += T(p.x + 18, y + 53, sub, { size: wide ? 13 : M.small, fill: MUTED });
    const px = p.x + 18;
    const py = y + 70;
    const pw = p.w - 36;
    const ph = ch - 96;
    s += plotFrame(px, py, pw, ph);
    if (type === 'continuous') s += curve(px + 6, py + 6, pw - 12, ph - 12, fn, 320, { color: BLUE, width: 2.5 });
    if (type === 'samples') {
      s += curve(px + 6, py + 6, pw - 12, ph - 12, fn, 320, { color: '#c3ced8', width: 1.5 });
      for (let k = 0; k < 12; k += 1) {
        const u = k / 11;
        s += C(px + 6 + u * (pw - 12), py + 6 + (ph - 12) * (1 - fn(u)), 4, { fill: BLUE });
      }
    }
    if (type === 'levels') {
      for (let k = 0; k < 6; k += 1) s += L(px + 6, py + 6 + k * ((ph - 12) / 5), px + pw - 6, py + 6 + k * ((ph - 12) / 5), { color: GRID });
      for (let k = 0; k < 12; k += 1) {
        const u = k / 11;
        const q = Math.round(fn(u) * 5) / 5;
        s += C(px + 6 + u * (pw - 12), py + 6 + (ph - 12) * (1 - q), 4, { fill: BLUE });
      }
    }
    if (i < 2) s += stepArrow(M, slots[i], slots[i + 1], y0);
  });
  return svg(M.W, y0 + height + 16, s, '数字音频先采样再量化的两个决定');
};

FIGURES['04-aliasing'] = async (M) => {
  const head = ['混叠：采样太慢', '高频会伪装成低频'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const W = M.W - M.pad * 2;
  const cw = wide ? W * 0.62 : W;
  const gh = wide ? 250 : 220;
  let s = header(M, head);
  s += card(M.pad, y0, cw, gh + 40);
  const gx = M.pad + 18;
  const gy = y0 + 20;
  const gw = cw - 36;
  s += plotFrame(gx, gy, gw, gh);
  const f7 = (u) => 0.5 + 0.4 * Math.sin(2 * Math.PI * 7 * u);
  const f3 = (u) => 0.5 - 0.4 * Math.sin(2 * Math.PI * 3 * u);
  s += curve(gx + 4, gy + 6, gw - 8, gh - 12, f7, 900, { color: '#aab8c4', width: 1.8 });
  s += curve(gx + 4, gy + 6, gw - 8, gh - 12, f3, 900, { color: BLUE, width: 2.5 });
  for (let k = 0; k <= 10; k += 1) {
    const u = k / 10;
    s += C(gx + 4 + u * (gw - 8), gy + 6 + (gh - 12) * (1 - f7(u)), 5, { fill: '#fff', stroke: WARM, sw: 2 });
  }
  const a = ['灰线：每秒振动 7 次', '蓝线：数字里看起来每秒 3 次', '橙圈：每秒只测量 10 次时，测量点完全相同'];
  const b = ['混叠在采样时已经发生，', '事后提高采样率也无法修复。'];
  if (wide) {
    s += MT(M.pad + cw + 26, y0 + 46, a, { size: M.body, leading: 26 });
    s += MT(M.pad + cw + 26, y0 + 160, b, { size: M.body, weight: 700, fill: WARM, leading: 24 });
    return svg(M.W, y0 + gh + 60, s, '每秒采样十次时七赫兹信号混叠为三赫兹');
  }
  s += MT(M.pad, y0 + gh + 66, a, { size: M.body, leading: 25 });
  s += MT(M.pad, y0 + gh + 66 + 25 * 3 + 14, b, { size: M.body, weight: 700, fill: WARM, leading: 23 });
  return svg(M.W, y0 + gh + 66 + 25 * 3 + 14 + 23 + 26, s, '每秒采样十次时七赫兹信号混叠为三赫兹');
};

FIGURES['04-levels'] = async (M) => {
  const head = ['位深越高，档位越密', '量化时改动越小'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 250 : 238;
  const { slots, height } = lay(M, 2, { h: ch, cols: 2 });
  let s = header(M, head);
  [[3, 8, '3 位：8 个档位', '台阶明显，改动较大'], [5, 32, '5 位：32 个档位', '台阶更细，改动较小']]
    .forEach(([bits, levels, title, sub], i) => {
      const p = slots[i];
      const y = y0 + p.y;
      s += card(p.x, y, p.w, p.h);
      s += T(p.x + 18, y + 32, title, { size: M.h2 - 1, weight: 700, fill: BLUE });
      s += T(p.x + 18, y + 56, sub, { size: M.small, fill: MUTED });
      const px = p.x + 18;
      const py = y + 76;
      const pw = p.w - 36;
      const ph = ch - 100;
      s += plotFrame(px, py, pw, ph);
      const fn = (u) => 0.5 + 0.42 * Math.sin(u * 6.6);
      s += curve(px + 6, py + 6, pw - 12, ph - 12, fn, 400, { color: '#bac6d0', width: 1.8 });
      const pts = [];
      for (let k = 0; k <= 90; k += 1) {
        const u = k / 90;
        const q = Math.round(fn(u) * (levels - 1)) / (levels - 1);
        const xx = px + 6 + u * (pw - 12);
        const yy2 = py + 6 + (ph - 12) * (1 - q);
        if (pts.length) pts.push([xx, pts[pts.length - 1][1]]);
        pts.push([xx, yy2]);
      }
      s += P(pts, { color: BLUE, width: 2.2 });
    });
  const h = y0 + height + 16;
  s += T(M.pad, h + 10, '灰线是原值，蓝色阶梯是量化后的值。', { size: M.small, fill: MUTED });
  return svg(M.W, h + 26, s, '三位和五位量化档位对比');
};

FIGURES['04-tradeoff'] = async (M) => {
  const head = ['采样率和位深', '各自换来什么、付出什么'];
  const items = [
    ['采样率更高', ['换来：能记录更高的频率成分', '代价：文件更大，计算更多'], '任务需要高频信息时才值得', 'frequency'],
    ['位深更高', ['换来：档位更密，量化误差更小', '代价：文件同样会变大'], '录音环境足够安静时才值得', 'precision'],
  ];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 208 : 196;
  const { slots, height } = lay(M, 2, { h: ch, cols: 2 });
  let s = header(M, head);
  items.forEach(([title, lines, note, ic], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h, { fill: PALE });
    s += T(p.x + 20, y + 36, title, { size: M.h2 + 0.5, weight: 700, fill: BLUE });
    s += MT(p.x + 20, y + 72, lines, { size: M.body, leading: 28 });
    s += icon(ic, p.x + p.w - 88, y + 18, 70, 62);
    s += R(p.x + 18, y + ch - 56, p.w - 36, 38, { fill: '#fff3ef', stroke: '#efd0c6', radius: 7 });
    s += T(p.x + p.w / 2, y + ch - 31, note, { size: M.small, weight: 700, fill: WARM, anchor: 'middle' });
  });
  const h = y0 + height + 16;
  s += MT(M.pad, h + 12, wide
    ? ['参数不是越大越专业，而是要刚好覆盖任务需要的信息。']
    : ['参数不是越大越专业，', '而是要刚好覆盖任务需要的信息。'],
  { size: M.body, weight: 700, leading: 23 });
  return svg(M.W, h + (wide ? 32 : 56), s, '提高采样率与位深的收益和代价');
};

// ---- 05 ----

FIGURES['05-four-questions'] = async (M) => {
  const head = ['选择音频特征前', '先回答四个知识问题'];
  const items = [
    ['抽象层级', '目标能否拆成可测量现象？', '异常 → 尖声、撞击、底噪', 'ladder'],
    ['时间尺度', '看一瞬间、一小段还是整段？', '要定位事件，就保留先后顺序', 'clock'],
    ['信号域', '看时间、看成分还是一起看？', '选择最容易看见证据的角度', 'domain'],
    ['产生方式', '按公式计算，还是让模型学习？', '数据少先用可解释的规则', 'learn'],
  ];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const ch = wide ? 208 : 126;
  const { slots, height } = lay(M, 4, { h: ch, cols: 4, gap: 18 });
  let s = header(M, head);
  items.forEach(([title, q, hint, ic], i) => {
    const p = slots[i];
    const y = y0 + p.y;
    s += card(p.x, y, p.w, p.h, { fill: i % 2 ? '#fff' : PALE });
    if (wide) {
      s += C(p.x + 28, y + 28, 15, { fill: BLUE });
      s += T(p.x + 28, y + 33, i + 1, { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + 52, y + 33, title, { size: M.h2 - 1, weight: 700, fill: BLUE });
      s += MT(p.x + 18, y + 68, wrapCJK(q, 12), { size: 14, leading: 21 });
      s += MT(p.x + 18, y + 122, wrapCJK(hint, 13), { size: 13, fill: MUTED, leading: 19 });
      s += icon(ic, p.x + p.w / 2 - 30, y + ch - 62, 60, 52);
    } else {
      s += C(p.x + 30, y + 34, 17, { fill: BLUE });
      s += T(p.x + 30, y + 40, i + 1, { size: 15, weight: 700, fill: '#fff', anchor: 'middle' });
      s += T(p.x + 58, y + 39, title, { size: M.h2, weight: 700, fill: BLUE });
      s += T(p.x + 20, y + 75, q, { size: M.body });
      s += T(p.x + 20, y + 103, hint, { size: M.small, fill: MUTED });
      s += icon(ic, p.x + p.w - 78, y + 15, 60, 54);
    }
  });
  const h = y0 + height + 16;
  s += MT(M.pad, h + 12, wide
    ? ['四个答案共同决定一个特征，它们不是四选一。']
    : ['四个答案共同决定一个特征，', '它们不是四选一。'],
  { size: M.body, weight: 700, fill: WARM, leading: 22 });
  return svg(M.W, h + (wide ? 32 : 54), s, '选择音频特征的四个问题');
};

FIGURES['05-time-scale'] = async (M) => {
  const head = ['时间尺度：窗口越长', '覆盖越多，局部位置越模糊'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const W = M.W - M.pad * 2;
  let s = header(M, head);
  s += card(M.pad, y0, W, 96, { fill: PALE });
  s += wavePanel(M.pad + 10, y0 + 12, W - 20, 72, VOICE, { xlabel: '' });
  s += T(M.pad + 12, y0 + 108, '素材：一段语音录音', { size: M.tick, fill: MUTED });

  const rows = [
    ['一个采样点', 0.01, '只知道这一瞬间'],
    ['几十毫秒', 0.06, '看局部质地'],
    ['几秒钟', 0.42, '看一个完整事件'],
    ['整段录音', 1.0, '只剩总体统计'],
  ];
  const barMax = wide ? W * 0.34 : W - 40;
  let y = y0 + 128;
  rows.forEach(([name, frac, note], i) => {
    if (wide) {
      const bw3 = Math.max(6, barMax * frac);
      s += R(M.pad, y + 4, bw3, 20, { fill: i === 3 ? '#dfe6ec' : SOFT, stroke: BLUE, sw: 1.2, radius: 4 });
      s += T(M.pad + bw3 + 14, y + 19, name, { size: M.body, weight: 700 });
      s += T(M.pad + barMax + 116, y + 19, note, { size: M.small, fill: MUTED });
      y += 40;
    } else {
      s += T(M.pad, y, name, { size: 16, weight: 700 });
      s += T(M.pad + W, y, note, { size: M.small, fill: MUTED, anchor: 'end' });
      s += R(M.pad, y + 14, Math.max(4, barMax * frac), 18, { fill: i === 3 ? '#dfe6ec' : SOFT, stroke: BLUE, sw: 1.2, radius: 4 });
      y += 74;
    }
  });
  s += MT(M.pad, y + 20, wide
    ? ['找“什么时候发生”要保留序列；只判断整段类别才考虑平均。']
    : ['找“什么时候发生”要保留序列；', '只判断整段类别才考虑平均。'],
  { size: M.body, weight: 700, fill: WARM, leading: 23 });
  return svg(M.W, y + (wide ? 42 : 66), s, '从一个采样点到整段录音的时间尺度');
};

FIGURES['05-rule-vs-learn'] = async (M) => {
  const head = ['音频特征的两种来源', '可以组合，不必二选一'];
  const y0 = headerH(M, head);
  const wide = isWide(M);
  const W = M.W - M.pad * 2;
  const cw = wide ? (W - 60) / 2 : W;
  const ch = 158;
  let s = header(M, head);
  const items = [
    ['人工规则计算', ['含义清楚、容易排查', '样本少也能使用', '风险：规则可能漏掉关键线索'], 'frequency'],
    ['模型从数据中学习', ['能学习复杂关系', '但更依赖数据和算力', '风险：可能学到无关差异'], 'learn'],
  ];
  items.forEach(([title, lines, ic], i) => {
    const x = wide ? M.pad + i * (cw + 60) : M.pad;
    const y = wide ? y0 : y0 + i * (ch + 50);
    s += card(x, y, cw, ch);
    s += T(x + 20, y + 36, title, { size: M.h2 + 0.5, weight: 700, fill: BLUE });
    s += MT(x + 20, y + 72, lines, { size: M.body, fill: MUTED, leading: 24 });
    s += icon(ic, x + cw - 90, y + 24, 72, 66);
  });
  if (wide) s += ARROW(M.pad + cw + 12, y0 + ch / 2, M.pad + cw + 48, y0 + ch / 2, { color: WARM });
  else s += ARROW(M.pad + W / 2, y0 + ch + 8, M.pad + W / 2, y0 + ch + 42, { color: WARM });
  const by = wide ? y0 + ch + 26 : y0 + ch * 2 + 50 + 26;
  s += R(M.pad, by, W, 82, { fill: '#fff3ef', stroke: '#efd0c6', radius: 10 });
  s += MT(M.pad + W / 2, by + 32, ['常见组合', '前面用稳定规则，后面交给模型学习'],
    { size: M.body, weight: 700, fill: WARM, anchor: 'middle', leading: 25 });
  s += T(M.pad, by + 108, '选择依据是任务证据和数据条件。', { size: M.body, fill: MUTED });
  return svg(M.W, by + 126, s, '人工音频特征与模型学习特征的组合');
};

// ---- 输出 ----

const names = Object.keys(FIGURES);
for (const mode of ['desktop', 'mobile']) {
  mkdirSync(join(BASE, mode), { recursive: true });
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop
    const out = await FIGURES[name](MODES[mode]);
    writeFileSync(join(BASE, mode, `${name}.svg`), out, 'utf8');
  }
}
console.log(`生成 ${names.length} 张图 × 2 版式 = ${names.length * 2} 个文件`);
names.forEach((n) => console.log(`  ${n}`));
