#!/usr/bin/env node
// 为零基础版第 16～20 课生成真实数据知识图；同一数据输出 desktop / mobile 两版。

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { readWav, resample, stft, melFilterbank } from './lib/dsp.mjs';
import {
  svgDoc, T, R, L, P, envelopePath, spectrogramPng, image, colorbar, axisX, axisY, PALETTE, COLORMAPS,
} from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_16-20', 'figures');
const SR = 16000;
const [BLUE, WARM, GREEN, GOLD] = [PALETTE.s1, PALETTE.s2, PALETTE.s3, PALETTE.s4];
const { ink: INK, muted: MUTED, grid: GRID, plate: PLATE } = PALETTE;
const MODES = {
  desktop: { name: 'desktop', W: 880, pad: 30, gap: 20, h1: 22, h2: 17, body: 15, small: 14 },
  mobile: { name: 'mobile', W: 420, pad: 22, gap: 18, h1: 18, h2: 17, body: 15, small: 14 },
};
const wide = (M) => M.name === 'desktop';
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const C = (x, y, r, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.fill ?? BLUE}"/>`;
const card = (x, y, w, h, fill = '#fff') => R(x, y, w, h, { fill, stroke: GRID, sw: 1, r: 8 });
function MT(x, y, lines, o = {}) {
  const { size = 15, weight = 400, fill = INK, leading = Math.round(size * 1.45), anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">`
    + lines.map((line, i) => `<tspan x="${x}" dy="${i ? leading : 0}">${esc(line)}</tspan>`).join('') + '</text>';
}
const headerH = (M, lines) => wide(M) ? 56 : 31 + (lines.length - 1) * 25 + 25;
const header = (M, lines) => wide(M)
  ? T(M.pad, 36, lines.join(''), { size: M.h1, weight: 700 })
  : MT(M.pad, 31, lines, { size: M.h1, weight: 700, leading: 25 });
function layout(M, n, cols, h) {
  const c = wide(M) ? cols : 1; const rows = Math.ceil(n / c);
  const w = (M.W - 2 * M.pad - (c - 1) * M.gap) / c;
  return {
    slots: Array.from({ length: n }, (_, i) => ({
      x: M.pad + (i % c) * (w + M.gap), y: Math.floor(i / c) * (h + M.gap), w, h,
    })),
    height: rows * h + (rows - 1) * M.gap,
  };
}
function arrow(x1, y1, x2, y2, c = MUTED) {
  const a = Math.atan2(y2 - y1, x2 - x1); const h = 7;
  const pts = [[x2, y2], [x2 - h * Math.cos(a - 0.48), y2 - h * Math.sin(a - 0.48)], [x2 - h * Math.cos(a + 0.48), y2 - h * Math.sin(a + 0.48)]];
  return L(x1, y1, x2, y2, { c, w: 1.6 }) + `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${c}"/>`;
}
function linePlot(x, y, w, h, values, { min, max, c = BLUE, zero = false } = {}) {
  const lo = min ?? Math.min(...values); const hi = max ?? Math.max(...values); const span = Math.max(1e-9, hi - lo);
  let s = card(x, y, w, h);
  if (zero && lo <= 0 && hi >= 0) {
    const yy = y + 7 + (1 - (0 - lo) / span) * (h - 14); s += L(x + 7, yy, x + w - 7, yy, { c: GRID });
  }
  const pts = values.map((v, i) => [x + 7 + i / Math.max(1, values.length - 1) * (w - 14), y + 7 + (1 - (v - lo) / span) * (h - 14)]);
  return s + P(pts, { c, w: 1.7 });
}
function normalize(y) {
  let p = 0; for (const v of y) p = Math.max(p, Math.abs(v));
  return Float64Array.from(y, (v) => v / Math.max(p, 1e-12));
}
function load(name, start = 0, dur = 3) {
  const wav = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const y = resample(wav.samples, wav.sampleRate, SR); const a = Math.floor(start * SR); const b = Math.min(y.length, a + Math.floor(dur * SR));
  return normalize(y.subarray(a, b));
}
const SCALE = load('scale.wav', 0, 3.2);
const VOICE = load('voice.wav', 0, 3.2);
const DEBUSSY = load('debussy.wav', 4, 3.2);
const REDHOT = load('redhot.wav', 4, 3.2);
const DUKE = load('duke.wav', 4, 3.2);

function dbMatrix(y, nfft = 1024, hop = 256) {
  const S = stft(y, SR, { nfft, hop }); let peak = 0;
  for (const v of S.mag) peak = Math.max(peak, v * v);
  const rows = Array.from({ length: S.bins }, () => new Float64Array(S.frames));
  for (let t = 0; t < S.frames; t += 1) for (let k = 0; k < S.bins; k += 1) {
    const p = S.mag[t * S.bins + k] ** 2;
    rows[k][t] = Math.max(-80, 10 * Math.log10(Math.max(p, 1e-14) / Math.max(peak, 1e-14)));
  }
  return { matrix: rows, S };
}
function melData(y, { nfft = 1024, hop = 256, nMels = 64, fmin = 50, fmax = SR / 2 } = {}) {
  const S = stft(y, SR, { nfft, hop }); const H = melFilterbank(nMels, nfft, SR, fmin, fmax);
  const power = Array.from({ length: nMels }, () => new Float64Array(S.frames)); let peak = 0;
  for (let m = 0; m < nMels; m += 1) for (let t = 0; t < S.frames; t += 1) {
    let sum = 0; for (let k = 0; k < S.bins; k += 1) sum += H[m][k] * S.mag[t * S.bins + k] ** 2;
    power[m][t] = sum; peak = Math.max(peak, sum);
  }
  const db = power.map((row) => Float64Array.from(row, (v) => Math.max(-80, 10 * Math.log10(Math.max(v, 1e-14) / Math.max(peak, 1e-14)))));
  return { power, db, H, frames: S.frames };
}
function dctMfcc(logMel, count = 13) {
  const M = logMel.length; const Tn = logMel[0].length;
  return Array.from({ length: count }, (_, n) => Float64Array.from({ length: Tn }, (__, t) => {
    let sum = 0; for (let m = 0; m < M; m += 1) sum += logMel[m][t] * Math.cos(Math.PI * n * (m + 0.5) / M);
    return sum * (n === 0 ? Math.sqrt(1 / M) : Math.sqrt(2 / M));
  }));
}
function delta(matrix, radius = 4) {
  const den = 2 * Array.from({ length: radius }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0);
  return matrix.map((row) => Float64Array.from(row, (_, t) => {
    let sum = 0; for (let n = 1; n <= radius; n += 1) sum += n * (row[Math.min(row.length - 1, t + n)] - row[Math.max(0, t - n)]);
    return sum / den;
  }));
}
async function matrixPng(matrix, { w = 800, h = 320, min, max, cmap = 'magma' } = {}) {
  let lo = min ?? Infinity; let hi = max ?? -Infinity;
  for (const row of matrix) for (const v of row) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const sample = COLORMAPS[cmap]; const rows = matrix.length; const cols = matrix[0].length; const buf = Buffer.alloc(w * h * 3);
  for (let py = 0; py < h; py += 1) {
    const r = Math.min(rows - 1, Math.round((1 - py / Math.max(1, h - 1)) * (rows - 1)));
    for (let px = 0; px < w; px += 1) {
      const c = Math.min(cols - 1, Math.round(px / Math.max(1, w - 1) * (cols - 1)));
      const rgb = sample(Math.max(0, Math.min(1, (matrix[r][c] - lo) / Math.max(1e-12, hi - lo)))); const o = (py * w + px) * 3;
      [buf[o], buf[o + 1], buf[o + 2]] = rgb;
    }
  }
  const data = await sharp(buf, { raw: { width: w, height: h, channels: 3 } }).png({ palette: true, colors: 128 }).toBuffer();
  return `data:image/png;base64,${data.toString('base64')}`;
}
async function heatPanel(q, y, title, matrix, note, opt = {}) {
  const uri = await matrixPng(matrix, { w: Math.round(q.w * 2.1), h: 320, min: opt.min, max: opt.max, cmap: opt.cmap ?? 'magma' });
  return T(q.x, y + 21, title, { size: 17, weight: 700, fill: opt.c ?? BLUE })
    + card(q.x, y + 36, q.w, 164) + image(uri, q.x + 4, y + 40, q.w - 8, 156)
    + T(q.x + 5, y + 222, note, { size: 14, fill: MUTED });
}

const FIGURES = {};

FIGURES['16-pipeline'] = async (M) => {
  const head = ['声谱图不是直接“画数组”：', '每一步都决定颜色代表什么']; const top = headerH(M, head); const { slots, height } = layout(M, 5, 5, 150);
  const items = [['录音', '随时间变化的数字', BLUE], ['STFT', '每帧的复数结果', WARM], ['功率', '取模后平方', GREEN], ['相对 dB', '把最强处设为 0', GOLD], ['坐标与色标', '时间、Hz、弱—强', BLUE]];
  let s = header(M, head);
  slots.forEach((q, i) => { const y = top + q.y; const [a, b, c] = items[i]; s += card(q.x, y, q.w, q.h, i === 4 ? '#fff8e5' : PLATE); s += C(q.x + 22, y + 24, 12, { fill: c }); s += T(q.x + 43, y + 30, a, { size: M.h2, weight: 700 }); s += MT(q.x + 14, y + 72, wide(M) ? [b] : b.length > 9 ? [b.slice(0, 9), b.slice(9)] : [b], { size: M.body, fill: MUTED, leading: 23 }); if (i < 4) { const n = slots[i + 1]; s += wide(M) ? arrow(q.x + q.w + 3, y + 75, n.x - 3, top + n.y + 75) : arrow(q.x + q.w / 2, y + q.h + 3, q.x + q.w / 2, top + n.y - 3); } });
  return svgDoc(M.W, top + height + 14, s, '从录音到可信声谱图的显示流程');
};

FIGURES['16-linear-db'] = async (M) => {
  const head = ['同一段音阶：', '线性功率藏住弱成分，相对 dB 展开动态范围']; const top = headerH(M, head); const { slots, height } = layout(M, 2, 2, 250); const { matrix: db } = dbMatrix(SCALE);
  const linear = db.map((row) => Float64Array.from(row, (v) => 10 ** (v / 10)));
  let s = header(M, head); s += await heatPanel(slots[0], top + slots[0].y, '线性功率', linear, '最强部分占据大多数颜色', { min: 0, max: 1, c: BLUE }); s += await heatPanel(slots[1], top + slots[1].y, '相对功率（dB）', db, '较弱的音阶与泛音也能看见', { min: -80, max: 0, c: WARM });
  return svgDoc(M.W, top + height + 16, s, '线性功率与相对分贝声谱图');
};

FIGURES['16-linear-log-frequency'] = async (M) => {
  const head = ['只改变纵轴排布，', '不会改变 STFT 本身的频率箱']; const top = headerH(M, head); const { slots, height } = layout(M, 2, 2, 255); const S = stft(SCALE, SR, { nfft: 1024, hop: 256 }); let s = header(M, head);
  for (let i = 0; i < 2; i += 1) { const q = slots[i]; const y = top + q.y; const uri = await spectrogramPng(S, { w: Math.round(q.w * 2.1), h: 330, fmax: 8000, logFreq: Boolean(i), dbFloor: -70, cmap: 'magma' }); s += T(q.x, y + 21, i ? '对数频率位置' : '线性频率位置', { size: M.h2, weight: 700, fill: i ? WARM : BLUE }); s += card(q.x, y + 36, q.w, 164) + image(uri, q.x + 4, y + 40, q.w - 8, 156); s += T(q.x + 5, y + 222, i ? '低频被拉开，高频被压紧' : '每 1000 Hz 占相同高度', { size: M.small, fill: MUTED }); }
  return svgDoc(M.W, top + height + 16, s, '线性与对数频率坐标');
};

FIGURES['16-genre-spectrograms'] = async (M) => {
  const head = ['参数完全相同时，', '三段真实音乐仍呈现不同纹理']; const top = headerH(M, head); const { slots, height } = layout(M, 3, 3, 235); const ys = [['古典 debussy.wav', DEBUSSY, BLUE], ['摇滚 redhot.wav', REDHOT, WARM], ['爵士 duke.wav', DUKE, GREEN]]; let s = header(M, head);
  for (let i = 0; i < 3; i += 1) { const q = slots[i]; const y = top + q.y; const uri = await spectrogramPng(stft(ys[i][1], SR, { nfft: 1024, hop: 256 }), { w: Math.round(q.w * 2.1), h: 310, fmax: 6000, logFreq: true, dbFloor: -65, cmap: 'magma' }); s += T(q.x, y + 21, ys[i][0], { size: M.h2, weight: 700, fill: ys[i][2] }); s += card(q.x, y + 36, q.w, 158) + image(uri, q.x + 4, y + 40, q.w - 8, 150); s += T(q.x + 5, y + 218, '同样 3.2 秒、同样显示范围', { size: M.small, fill: MUTED }); }
  return svgDoc(M.W, top + height + 16, s, '三类真实音乐的声谱图纹理');
};

FIGURES['17-perception'] = async (M) => {
  const head = ['同样相差约 200 Hz，', '低音区与高音区的相对跨度完全不同']; const top = headerH(M, head); const { slots, height } = layout(M, 2, 2, 220); const items = [['65 → 262 Hz', 65, 262, BLUE, '约跨 2 个八度'], ['1568 → 1760 Hz', 1568, 1760, WARM, '只跨约 2 个半音']]; let s = header(M, head);
  slots.forEach((q, i) => { const y = top + q.y; const [title, a, b, c, note] = items[i]; s += T(q.x, y + 21, title, { size: M.h2, weight: 700, fill: c }); s += card(q.x, y + 36, q.w, 122); const x1 = q.x + 28; const x2 = q.x + q.w - 28; s += L(x1, y + 98, x2, y + 98, { c: GRID, w: 3 }); const map = (f) => x1 + Math.log2(f / 50) / Math.log2(2000 / 50) * (x2 - x1); s += L(map(a), y + 80, map(a), y + 116, { c, w: 3 }) + L(map(b), y + 80, map(b), y + 116, { c, w: 3 }) + L(map(a), y + 98, map(b), y + 98, { c, w: 5 }); s += T(q.x + 5, y + 194, note, { size: M.body, fill: MUTED }); });
  return svgDoc(M.W, top + height + 16, s, '相同赫兹差在低频与高频的相对跨度');
};

FIGURES['17-hz-mel'] = async (M) => {
  const head = ['梅尔刻度重新分配间距：', '低频变化占更多位置，高频逐渐压缩']; const top = headerH(M, head); const w = M.W - 2 * M.pad; const x = M.pad; const h = wide(M) ? 300 : 326; const hz = Array.from({ length: 240 }, (_, i) => i / 239 * 8000); const mel = hz.map((f) => 2595 * Math.log10(1 + f / 700)); const tick = wide(M) ? 11.5 : 13.5;
  let s = header(M, head); s += linePlot(x + 34, top, w - 34, 190, mel, { min: 0, max: 3000, c: BLUE });
  s += axisX(x + 40, top + 190, w - 46, [[0, '0'], [2000, '2k'], [4000, '4k'], [6000, '6k'], [8000, '8k']], 0, 8000, { size: tick, unit: 'Hz' });
  s += axisY(x + 40, top + 6, 178, [[0, '0'], [1500, '1500'], [3000, '3000']], 0, 3000, { size: tick, unit: '梅尔' });
  s += wide(M) ? T(x + 8, top + 250, '曲线越平，代表同样的 Hz 差在梅尔轴上占的位置越少', { size: M.body, fill: GREEN }) : MT(x + 8, top + 250, ['曲线越平，同样的 Hz 差', '在梅尔轴上占的位置越少'], { size: M.body, fill: GREEN }); return svgDoc(M.W, top + h, s, '赫兹到梅尔刻度的非线性映射');
};

FIGURES['17-filterbank'] = async (M) => {
  const head = ['一组重叠三角形，', '把线性频率箱汇总成较少的梅尔频带']; const top = headerH(M, head); const w = M.W - 2 * M.pad; const x = M.pad; const H = melFilterbank(10, 1024, SR, 50, 8000); let s = header(M, head) + card(x, top, w, 245);
  const tick = wide(M) ? 11.5 : 13.5;
  // 十个滤波器是同一种东西，用同一个颜色；相邻用深浅区分，不轮换色相
  H.forEach((row, m) => { const pts = Array.from(row, (v, k) => [x + 18 + k / (row.length - 1) * (w - 36), top + 178 - v * 132]); s += P(pts, { c: m % 2 ? BLUE : '#6aa9d8', w: 1.7 }); });
  s += axisX(x + 18, top + 178, w - 36, [[0, '0'], [2000, '2k'], [4000, '4k'], [6000, '6k'], [8000, '8k']], 0, SR / 2, { size: tick, unit: 'Hz' });
  s += T(x + 18, top + 232, '低频三角形较窄', { size: M.body, fill: MUTED }); s += T(x + w - 18, top + 232, '高频三角形较宽', { size: M.body, fill: MUTED, anchor: 'end' }); return svgDoc(M.W, top + 265, s, '十个梅尔三角滤波器');
};

FIGURES['17-matrix-map'] = async (M) => {
  const head = ['滤波器矩阵乘以功率声谱图，', '输出行数从 513 变成 64']; const top = headerH(M, head); const { slots, height } = layout(M, 3, 3, 210); const items = [['滤波器矩阵 H', '64 × 513', BLUE], ['功率声谱图 P', '513 × 时间帧', WARM], ['梅尔功率 HP', '64 × 时间帧', GREEN]]; let s = header(M, head);
  slots.forEach((q, i) => { const y = top + q.y; s += T(q.x, y + 21, items[i][0], { size: M.h2, weight: 700, fill: items[i][2] }); s += card(q.x, y + 36, q.w, 126, i === 2 ? '#eef9f5' : '#fff'); const rows = i === 1 ? 8 : 5; const cols = i === 0 ? 9 : 7; for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) s += R(q.x + 18 + c * (q.w - 40) / cols, y + 52 + r * 12, (q.w - 48) / cols, 9, { fill: i === 0 ? '#ddecfb' : i === 1 ? '#fde7dc' : '#dff3eb', r: 1 }); s += T(q.x + 5, y + 194, items[i][1], { size: M.body, fill: MUTED }); if (i < 2) { const n = slots[i + 1]; s += wide(M) ? arrow(q.x + q.w + 3, y + 101, n.x - 3, top + n.y + 101) : arrow(q.x + q.w / 2, y + q.h + 3, q.x + q.w / 2, top + n.y - 3); } }); return svgDoc(M.W, top + height + 14, s, '梅尔滤波器矩阵与功率声谱图相乘');
};

FIGURES['18-pipeline'] = async (M) => {
  const head = ['对数梅尔频谱的四步，', '每一步都改变一个明确的量']; const top = headerH(M, head); const { slots, height } = layout(M, 4, 4, 165); const items = [['录音', '时间 × 1', BLUE], ['STFT 功率', '513 × 帧数', WARM], ['梅尔汇总', '64 × 帧数', GREEN], ['相对 dB', '64 × 帧数', GOLD]]; let s = header(M, head);
  slots.forEach((q, i) => { const y = top + q.y; s += card(q.x, y, q.w, q.h, i === 3 ? '#fff8e5' : PLATE); s += T(q.x + 14, y + 34, `${i + 1}　${items[i][0]}`, { size: M.h2, weight: 700, fill: items[i][2] }); if (!i) s += envelopePath(SCALE, q.x + 14, y + 65, q.w - 28, 55, { c: BLUE }); else for (let r = 0; r < 5; r += 1) for (let c = 0; c < 8; c += 1) s += R(q.x + 14 + c * (q.w - 32) / 8, y + 60 + r * 12, (q.w - 42) / 8, 9, { fill: [WARM, GREEN, GOLD][i - 1], opacity: 0.2 + 0.12 * ((r + c) % 5), r: 1 }); s += T(q.x + 14, y + 148, items[i][1], { size: M.small, fill: MUTED }); if (i < 3) { const n = slots[i + 1]; s += wide(M) ? arrow(q.x + q.w + 3, y + 82, n.x - 3, top + n.y + 82) : arrow(q.x + q.w / 2, y + q.h + 3, q.x + q.w / 2, top + n.y - 3); } }); return svgDoc(M.W, top + height + 14, s, '从录音到对数梅尔频谱');
};

FIGURES['18-band-count'] = async (M) => {
  const head = ['同一段音阶使用不同频带数：', '频带越多，纵向轮廓越细']; const top = headerH(M, head); const { slots, height } = layout(M, 2, 2, 250); const a = melData(SCALE, { nMels: 10 }).db; const b = melData(SCALE, { nMels: 64 }).db; let s = header(M, head); s += await heatPanel(slots[0], top, '10 个梅尔频带', a, '轮廓紧凑，但细节较粗', { min: -80, max: 0, c: BLUE }); s += await heatPanel(slots[1], top + slots[1].y, '64 个梅尔频带', b, '保留更多纵向变化', { min: -80, max: 0, c: WARM }); return svgDoc(M.W, top + height + 16, s, '十个与六十四个梅尔频带的音阶图');
};

FIGURES['18-scale-mel'] = async (M) => {
  const head = ['梅尔汇总与对数压缩，', '解决的是两个不同问题']; const top = headerH(M, head); const { slots, height } = layout(M, 3, 3, 240); const { matrix: linearDb } = dbMatrix(SCALE); const mel = melData(SCALE, { nMels: 64 }); const melLinear = mel.db.map((row) => Float64Array.from(row, (v) => 10 ** (v / 10))); let s = header(M, head); s += await heatPanel(slots[0], top, '线性频率功率', linearDb, '513 行频率位置', { min: -80, max: 0, c: BLUE }); s += await heatPanel(slots[1], top + slots[1].y, '梅尔频带功率', melLinear, '压成 64 行', { min: 0, max: 1, c: GREEN }); s += await heatPanel(slots[2], top + slots[2].y, '对数梅尔功率', mel.db, '再展开弱成分', { min: -80, max: 0, c: WARM }); return svgDoc(M.W, top + height + 16, s, '线性功率梅尔汇总与对数压缩');
};

FIGURES['18-parameters'] = async (M) => {
  const head = ['一次函数调用背后，', '至少有六组会改变结果的设置']; const top = headerH(M, head); const { slots, height } = layout(M, 6, 3, 125); const items = [['采样率', '可见频率上限'], ['n_fft', '每帧频率格'], ['hop', '时间列间隔'], ['n_mels', '输出频带数'], ['fmin / fmax', '实际保留范围'], ['ref / top_db', '颜色与数值基准']]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; s += L(q.x, y + q.h, q.x + q.w, y + q.h, { c: GRID }); s += T(q.x, y + 27, items[i][0], { size: M.h2, weight: 700, fill: [BLUE, WARM, GREEN][i % 3] }); s += MT(q.x, y + 62, wide(M) ? [items[i][1]] : items[i][1].length > 8 ? [items[i][1].slice(0, 8), items[i][1].slice(8)] : [items[i][1]], { size: M.body, fill: MUTED, leading: 22 }); }); return svgDoc(M.W, top + height + 14, s, '对数梅尔频谱的关键参数');
};

function sourceFilterCurves() {
  const N = 240; const E = []; const H = []; const X = [];
  for (let i = 0; i < N; i += 1) { const f = i / (N - 1) * 4000; const comb = 0.08 + 0.92 * Math.max(0, Math.cos(Math.PI * f / 120)) ** 16; const env = 0.18 + 0.82 * Math.exp(-(((f - 700) / 360) ** 2)) + 0.55 * Math.exp(-(((f - 1900) / 520) ** 2)); E.push(comb); H.push(env); X.push(comb * env); }
  return { E, H, X };
}
FIGURES['19-source-filter'] = async (M) => {
  const head = ['说话声同时带着两类证据：', '声带的细密谐波与声道的平滑包络']; const top = headerH(M, head); const { slots, height } = layout(M, 3, 3, 210); const d = sourceFilterCurves(); const items = [['声带激励 E', d.E, BLUE, '细密而周期'], ['声道响应 H', d.H, WARM, '缓慢起伏'], ['最终频谱 X', d.X, GREEN, '两者逐点相乘']]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; s += T(q.x, y + 21, items[i][0], { size: M.h2, weight: 700, fill: items[i][2] }); s += linePlot(q.x, y + 36, q.w, 125, items[i][1], { min: 0, max: 1.55, c: items[i][2] }); s += T(q.x + 5, y + 192, items[i][3], { size: M.small, fill: MUTED }); }); return svgDoc(M.W, top + height + 14, s, '声带激励与声道响应共同形成频谱');
};

FIGURES['19-log-add'] = async (M) => {
  const head = ['取对数把乘法改写成加法，', '让两类变化更容易分开描述']; const top = headerH(M, head); const { slots, height } = layout(M, 3, 3, 160); const items = [['声带', '|E| = 2', 'ln 2', BLUE], ['声道', '|H| = 5', 'ln 5', WARM], ['结果', '|X| = 10', 'ln 10 = ln 2 + ln 5', GREEN]]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; s += card(q.x, y, q.w, q.h, i === 2 ? '#eef9f5' : PLATE); s += T(q.x + 14, y + 31, items[i][0], { size: M.h2, weight: 700, fill: items[i][3] }); s += T(q.x + 14, y + 78, items[i][1], { size: M.body, fill: INK }); s += T(q.x + 14, y + 120, items[i][2], { size: M.body, weight: 700, fill: items[i][3] }); }); return svgDoc(M.W, top + height + 14, s, '频谱乘法取对数后变成加法');
};

FIGURES['19-dct'] = async (M) => {
  const head = ['DCT 换一组坐标后，', '低阶看整体，高阶看快速起伏']; const top = headerH(M, head); const { slots, height } = layout(M, 3, 3, 220); const N = 48; const items = [['对数梅尔轮廓', Array.from({ length: N }, (_, i) => 0.25 + 0.5 * i / N + 0.12 * Math.sin(i * 0.42)), BLUE], ['低阶余弦方向', Array.from({ length: N }, (_, i) => Math.cos(Math.PI * (i + 0.5) / N)), GREEN], ['高阶余弦方向', Array.from({ length: N }, (_, i) => Math.cos(9 * Math.PI * (i + 0.5) / N)), WARM]]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; s += T(q.x, y + 21, items[i][0], { size: M.h2, weight: 700, fill: items[i][2] }); s += linePlot(q.x, y + 36, q.w, 135, items[i][1], { min: i ? -1 : 0, max: 1, c: items[i][2], zero: i > 0 }); s += T(q.x + 5, y + 202, i === 0 ? '相邻频带彼此相关' : i === 1 ? '缓慢变化' : '快速交替', { size: M.small, fill: MUTED }); }); return svgDoc(M.W, top + height + 14, s, '离散余弦变换的低阶与高阶方向');
};

FIGURES['19-mfcc-pipeline'] = async (M) => {
  const head = ['MFCC 是一条有损压缩管线：', '最后只保留前若干 DCT 系数']; const top = headerH(M, head); const { slots, height } = layout(M, 4, 4, 165); const items = [['功率谱', '513 行'], ['梅尔汇总', '40 行'], ['取对数', '40 行'], ['DCT 前 13 项', '13 行']]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; s += card(q.x, y, q.w, q.h, i === 3 ? '#fff8e5' : PLATE); s += T(q.x + 14, y + 33, items[i][0], { size: M.h2, weight: 700, fill: [BLUE, WARM, GREEN, GOLD][i] }); const rows = [9, 7, 7, 4][i]; for (let r = 0; r < rows; r += 1) s += L(q.x + 16, y + 62 + r * 9, q.x + q.w - 16, y + 62 + r * 9, { c: [BLUE, WARM, GREEN, GOLD][i], w: 3 }); s += T(q.x + 14, y + 148, items[i][1], { size: M.small, fill: MUTED }); if (i < 3) { const n = slots[i + 1]; s += wide(M) ? arrow(q.x + q.w + 3, y + 82, n.x - 3, top + n.y + 82) : arrow(q.x + q.w / 2, y + q.h + 3, q.x + q.w / 2, top + n.y - 3); } }); return svgDoc(M.W, top + height + 14, s, 'MFCC 从功率谱到十三个系数的管线');
};

const voiceMel = melData(VOICE, { nfft: 512, hop: 160, nMels: 40 });
const voiceMfcc = dctMfcc(voiceMel.db, 13); const voiceDelta = delta(voiceMfcc); const voiceDelta2 = delta(voiceDelta);
FIGURES['20-mfcc-map'] = async (M) => {
  const head = ['MFCC 是一张“系数 × 时间”的表，', '每一列描述一个短时间片段']; const top = headerH(M, head); const w = M.W - 2 * M.pad; const uri = await matrixPng(voiceMfcc, { w: Math.round(w * 2.1), h: 360, cmap: 'viridis' }); let s = header(M, head) + card(M.pad, top, w, 210) + image(uri, M.pad + 4, top + 4, w - 8, 180); s += T(M.pad + 8, top + 203, '纵向 13 个系数；横向按时间排列', { size: M.body, fill: MUTED }); return svgDoc(M.W, top + 230, s, '真实语音的十三维 MFCC');
};

FIGURES['20-delta'] = async (M) => {
  const head = wide(M) ? ['静态值回答“现在怎样”，Delta 与 Delta-Delta 描述怎样变化'] : ['静态值回答“现在怎样”，', 'Delta 与 Delta-Delta', '描述声音怎样变化']; const top = headerH(M, head); const { slots, height } = layout(M, 3, 3, 205); const items = [['MFCC', voiceMfcc[2], BLUE, '当前位置'], ['Delta', voiceDelta[2], GREEN, '变化方向与速度'], ['Delta-Delta', voiceDelta2[2], WARM, '速度怎样改变']]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; const vals = Array.from(items[i][1].slice(0, 180)); const a = Math.max(...vals.map(Math.abs), 1e-6); s += T(q.x, y + 21, items[i][0], { size: M.h2, weight: 700, fill: items[i][2] }); s += linePlot(q.x, y + 36, q.w, 125, vals, { min: -a, max: a, c: items[i][2], zero: true }); s += T(q.x + 5, y + 192, items[i][3], { size: M.small, fill: MUTED }); }); return svgDoc(M.W, top + height + 14, s, 'MFCC 静态值和一二阶差分');
};

FIGURES['20-concat'] = async (M) => {
  const head = ['三张 13 行的表沿特征方向拼接，', '时间列数保持不变']; const top = headerH(M, head); const { slots, height } = layout(M, 4, 4, 175); const items = [['MFCC', '13 × T', BLUE], ['Delta', '13 × T', GREEN], ['Delta-Delta', '13 × T', WARM], ['最终特征', '39 × T', GOLD]]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; s += T(q.x, y + 21, items[i][0], { size: M.h2, weight: 700, fill: items[i][2] }); s += card(q.x, y + 36, q.w, 100, i === 3 ? '#fff8e5' : '#fff'); const rows = i === 3 ? 9 : 4; for (let r = 0; r < rows; r += 1) s += L(q.x + 14, y + 52 + r * (70 / Math.max(1, rows - 1)), q.x + q.w - 14, y + 52 + r * (70 / Math.max(1, rows - 1)), { c: items[i][2], w: 2 }); s += T(q.x + 5, y + 162, items[i][1], { size: M.body, fill: MUTED }); }); return svgDoc(M.W, top + height + 14, s, '十三维静态与动态 MFCC 拼接为三十九维');
};

FIGURES['20-boundary'] = async (M) => {
  const head = ['居中差分会看左右邻居，', '实时系统必须等待未来或改用过去信息']; const top = headerH(M, head); const { slots, height } = layout(M, 2, 2, 220); const items = [['离线居中窗口', ['过去帧', '当前帧', '未来帧'], BLUE, '需要未来帧，时间更对称'], ['实时因果窗口', ['更早帧', '过去帧', '当前帧'], WARM, '不看未来，但定义已经改变']]; let s = header(M, head); slots.forEach((q, i) => { const y = top + q.y; s += T(q.x, y + 21, items[i][0], { size: M.h2, weight: 700, fill: items[i][2] }); s += card(q.x, y + 36, q.w, 125); items[i][1].forEach((label, k) => { const xx = q.x + 18 + k * (q.w - 36) / 3; const ww = (q.w - 52) / 3; s += R(xx, y + 72, ww, 50, { fill: k === 1 + i ? '#fde7dc' : '#ddecfb', stroke: k === 1 + i ? WARM : BLUE, sw: 1, r: 3 }); s += T(xx + ww / 2, y + 103, label, { size: M.small, anchor: 'middle' }); }); s += T(q.x + 5, y + 198, items[i][3], { size: M.small, fill: MUTED }); }); return svgDoc(M.W, top + height + 14, s, '居中差分与实时因果差分的时间边界');
};

for (const [mode, M] of Object.entries(MODES)) {
  const out = join(BASE, mode); mkdirSync(out, { recursive: true });
  for (const [name, draw] of Object.entries(FIGURES)) writeFileSync(join(out, `${name}.svg`), await draw(M), 'utf8');
}
console.log(`生成 ${Object.keys(FIGURES).length} 张知识图 × 2 个版式 = ${Object.keys(FIGURES).length * 2} 个 SVG`);
console.log(`输出目录：${BASE}`);
