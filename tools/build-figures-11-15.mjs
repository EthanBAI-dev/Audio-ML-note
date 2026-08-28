#!/usr/bin/env node
// 为零基础版第 11～15 课生成知识图。每张图由同一份数据输出 desktop / mobile 两版。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, fft, magnitudeSpectrum, stft, mulberry32 } from './lib/dsp.mjs';
import {
  svgDoc, T, R, L, P, envelopePath, spectrogramPng, image, colorbar, axisX, axisY, PALETTE,
} from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_11-15', 'figures');
const SR = 16000;
const BLUE = PALETTE.s1;
const WARM = PALETTE.s2;
const GREEN = PALETTE.s3;
const GOLD = PALETTE.s4;
const INK = PALETTE.ink;
const MUTED = PALETTE.muted;
const GRID = PALETTE.grid;
const PLATE = PALETTE.plate;

const MODES = {
  desktop: { name: 'desktop', W: 880, pad: 30, gap: 20, h1: 22, h2: 17, body: 15, small: 14, tick: 14 },
  mobile: { name: 'mobile', W: 420, pad: 22, gap: 18, h1: 18, h2: 17, body: 15, small: 14, tick: 14 },
};
const wide = (M) => M.name === 'desktop';
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function MT(x, y, lines, o = {}) {
  const { size = 15, weight = 400, fill = INK, leading = Math.round(size * 1.45), anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">`
    + lines.map((line, i) => `<tspan x="${x}" dy="${i ? leading : 0}">${esc(line)}</tspan>`).join('') + '</text>';
}
const C = (x, y, r, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.fill ?? BLUE}" stroke="${o.stroke ?? 'none'}" stroke-width="${o.sw ?? 1}"/>`;
const card = (x, y, w, h, fill = PLATE) => R(x, y, w, h, { fill, stroke: GRID, sw: 1, r: 9 });
function PATH(d, o = {}) {
  return `<path d="${d}" fill="${o.fill ?? 'none'}" stroke="${o.c ?? BLUE}" stroke-width="${o.w ?? 2}" stroke-linecap="round" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
}
function ARROW(x1, y1, x2, y2, o = {}) {
  const c = o.c ?? MUTED; const w = o.w ?? 1.7; const head = o.head ?? 7;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p1 = [x2 - head * Math.cos(a - 0.48), y2 - head * Math.sin(a - 0.48)];
  const p2 = [x2 - head * Math.cos(a + 0.48), y2 - head * Math.sin(a + 0.48)];
  return L(x1, y1, x2, y2, { c, w }) + `<polygon points="${x2},${y2} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}" fill="${c}"/>`;
}
const headerH = (M, lines) => wide(M) ? 56 : 31 + (lines.length - 1) * 25 + 25;
const header = (M, lines) => wide(M)
  ? T(M.pad, 36, lines.join(''), { size: M.h1, weight: 700 })
  : MT(M.pad, 31, lines, { size: M.h1, weight: 700, leading: 25 });

function layout(M, n, { cols = n, h = 150, gap = M.gap } = {}) {
  const c = wide(M) ? cols : 1;
  const rows = Math.ceil(n / c);
  const w = (M.W - M.pad * 2 - gap * (c - 1)) / c;
  const slots = Array.from({ length: n }, (_, i) => ({
    x: M.pad + (i % c) * (w + gap), y: Math.floor(i / c) * (h + gap), w, h,
  }));
  return { slots, height: rows * h + (rows - 1) * gap };
}

function axes(x, y, w, h, labels = {}) {
  let s = R(x, y, w, h, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
  s += L(x + 10, y + h / 2, x + w - 8, y + h / 2, { c: GRID });
  if (labels.x) s += T(x + w - 6, y + h - 7, labels.x, { size: 13, fill: MUTED, anchor: 'end' });
  if (labels.y) s += T(x + 12, y + 18, labels.y, { size: 13, fill: MUTED });
  return s;
}

function linePlot(x, y, w, h, values, o = {}) {
  const min = o.min ?? Math.min(...values); const max = o.max ?? Math.max(...values);
  const span = Math.max(1e-12, max - min);
  let s = R(x, y, w, h, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
  if (o.zero && min <= 0 && max >= 0) {
    const zy = y + 6 + (1 - (0 - min) / span) * (h - 12);
    s += L(x + 6, zy, x + w - 6, zy, { c: GRID });
  }
  const pts = Array.from(values, (v, i) => [
    x + 6 + (i / Math.max(1, values.length - 1)) * (w - 12),
    y + 6 + (1 - (v - min) / span) * (h - 12),
  ]);
  s += P(pts, { c: o.c ?? BLUE, w: o.w ?? 1.8 });
  // 有刻度才算数据图；没有刻度只是一条示意曲线
  if (o.xticks) s += axisX(x + 6, y + h, w - 12, o.xticks, 0, o.xmax ?? 1, { size: o.tick ?? 12, unit: o.xunit ?? '' });
  if (o.yticks) s += axisY(x + 6, y + 6, h - 12, o.yticks, min, max, { size: o.tick ?? 12, unit: o.yunit ?? '' });
  return s;
}

function vectorPlane(x, y, w, h, vx, vy, o = {}) {
  const cx = x + w / 2; const cy = y + h / 2; const scale = Math.min(w, h) * 0.34 / (o.range ?? 1);
  let s = R(x, y, w, h, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
  s += L(x + 12, cy, x + w - 12, cy, { c: MUTED, w: 1 });
  s += L(cx, y + 12, cx, y + h - 12, { c: MUTED, w: 1 });
  if (o.circle) s += C(cx, cy, scale, { fill: 'none', stroke: GRID, sw: 1.2 });
  const ex = cx + vx * scale; const ey = cy - vy * scale;
  s += ARROW(cx, cy, ex, ey, { c: o.c ?? BLUE, w: 2.3, head: 8 });
  if (o.label) s += T(ex + (vx >= 0 ? 7 : -7), ey - 7, o.label, { size: 14, weight: 700, fill: o.c ?? BLUE, anchor: vx >= 0 ? 'start' : 'end' });
  return s;
}

function normalize(samples) {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  return Float64Array.from(samples, (v) => v / Math.max(peak, 1e-12));
}

function load(name, start = 0, dur = 2) {
  const wav = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const all = resample(wav.samples, wav.sampleRate, SR);
  const a = Math.floor(start * SR); const b = Math.min(all.length, Math.floor((start + dur) * SR));
  return normalize(all.subarray(a, b));
}

const PIANO = load('piano_c.wav', 0, 2);
const VIOLIN = load('violin_c.wav', 0, 2);
const SAX = load('sax.wav', 0, 2);
const NOISE = load('noise.wav', 0.5, 2);

function synth(freqs, amps, dur = 1, sr = SR, phases = []) {
  return Float64Array.from({ length: Math.floor(dur * sr) }, (_, i) => {
    const t = i / sr;
    return freqs.reduce((sum, f, k) => sum + amps[k] * Math.cos(2 * Math.PI * f * t + (phases[k] ?? 0)), 0);
  });
}

function fftComplex(samples, nfft = samples.length, useHann = false) {
  const re = new Float64Array(nfft); const im = new Float64Array(nfft);
  const n = Math.min(samples.length, nfft);
  for (let i = 0; i < n; i += 1) {
    const win = useHann ? 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / Math.max(1, n - 1)) : 1;
    re[i] = samples[i] * win;
  }
  fft(re, im);
  return { re, im };
}

function spectrumCurve(samples, maxHz = 3500, nfft = 16384) {
  const frame = samples.subarray(0, Math.min(samples.length, nfft));
  const mag = magnitudeSpectrum(frame, nfft);
  const maxBin = Math.min(mag.length - 1, Math.floor(maxHz * nfft / SR));
  let peak = 0;
  for (let k = 0; k <= maxBin; k += 1) peak = Math.max(peak, mag[k]);
  const out = [];
  const points = 260;
  for (let i = 0; i < points; i += 1) {
    const k = Math.round((i / (points - 1)) * maxBin);
    out.push(Math.max(-60, 20 * Math.log10(Math.max(mag[k], 1e-12) / Math.max(peak, 1e-12))));
  }
  return out;
}

function chirpWithClick() {
  const dur = 2; const n = SR * dur; const y = new Float64Array(n); const rnd = mulberry32(19);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR; const phase = 2 * Math.PI * (220 * t + 0.5 * 620 * t * t);
    y[i] = 0.58 * Math.sin(phase);
  }
  const k0 = Math.floor(1.05 * SR);
  for (let i = 0; i < 0.06 * SR; i += 1) y[k0 + i] += 0.9 * Math.exp(-i / 180) * (rnd() * 2 - 1);
  return normalize(y);
}

const FIGURES = {};

FIGURES['11-cartesian-polar'] = async (M) => {
  const head = ['同一个复数，', '可以读成坐标，也可以读成长度与方向'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 230 });
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y;
    s += T(q.x, y + 22, i ? '长度与方向：5，约 53°' : '横向与纵向：3 + 4i', { size: M.h2, weight: 700, fill: i ? GREEN : BLUE });
    s += vectorPlane(q.x, y + 38, q.w, 166, 0.6, 0.8, { c: i ? GREEN : BLUE, label: '3 + 4i', range: 1 });
    if (!i) {
      s += T(q.x + 12, y + 224, '横向 3，纵向 4', { size: M.small, fill: MUTED });
    } else s += T(q.x + 12, y + 224, '同一个箭头，没有增加信息', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 18, s, '复数的直角坐标与极坐标表示');
};

FIGURES['11-unit-circle'] = async (M) => {
  const head = ['方向不断改变时，', '横向和纵向投影就是余弦与正弦'];
  const top = headerH(M, head); const w = M.W - M.pad * 2; const ph = wide(M) ? 300 : 420;
  let s = header(M, head); const x = M.pad;
  if (wide(M)) {
    s += vectorPlane(x, top, w * 0.38, ph, Math.cos(Math.PI / 3), Math.sin(Math.PI / 3), { circle: true, c: BLUE, label: '60°' });
    const px = x + w * 0.43; const pw = w * 0.57;
    const t = Array.from({ length: 240 }, (_, i) => i / 239);
    s += T(px, top + 22, '横向投影：余弦', { size: M.h2, weight: 700, fill: BLUE });
    s += linePlot(px, top + 36, pw, 100, t.map((u) => Math.cos(2 * Math.PI * u)), { min: -1, max: 1, zero: true, c: BLUE });
    s += T(px, top + 174, '纵向投影：正弦', { size: M.h2, weight: 700, fill: WARM });
    s += linePlot(px, top + 188, pw, 100, t.map((u) => Math.sin(2 * Math.PI * u)), { min: -1, max: 1, zero: true, c: WARM });
  } else {
    s += vectorPlane(x, top, w, 190, Math.cos(Math.PI / 3), Math.sin(Math.PI / 3), { circle: true, c: BLUE, label: '60°' });
    const t = Array.from({ length: 220 }, (_, i) => i / 219);
    s += T(x, top + 224, '横向投影：余弦', { size: M.h2, weight: 700, fill: BLUE });
    s += linePlot(x, top + 238, w, 74, t.map((u) => Math.cos(2 * Math.PI * u)), { min: -1, max: 1, zero: true, c: BLUE });
    s += T(x, top + 346, '纵向投影：正弦', { size: M.h2, weight: 700, fill: WARM });
    s += linePlot(x, top + 360, w, 74, t.map((u) => Math.sin(2 * Math.PI * u)), { min: -1, max: 1, zero: true, c: WARM });
  }
  return svgDoc(M.W, top + ph + 18, s, '单位圆旋转与正弦余弦投影');
};

FIGURES['11-scale-rotate'] = async (M) => {
  const head = ['复数乘法的两个动作：', '改变长度，再改变方向'];
  const top = headerH(M, head); const { slots, height } = layout(M, 3, { cols: 3, h: 235 });
  const items = [
    ['原来的箭头', 0.75, 0.45, BLUE, '长度 1，方向不变'],
    ['乘以 2', 1.5, 0.9, WARM, '长度变 2 倍'],
    ['乘以转动因子', -0.45, 0.75, GREEN, '长度不变，转过 90°'],
  ];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, vx, vy, c, note] = items[i];
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: c });
    s += vectorPlane(q.x, y + 38, q.w, 160, vx, vy, { c, range: 1.8 });
    s += T(q.x + 8, y + 225, note, { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 16, s, '复数乘法对应缩放和旋转');
};

FIGURES['11-audio-coordinate'] = async (M) => {
  const head = ['描述一个振动成分时，', '“多强”和“从哪里开始”要一起保存'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 215 });
  let s = header(M, head);
  const phase = [0, Math.PI / 2];
  slots.forEach((q, i) => {
    const y = top + q.y; const vals = Array.from({ length: 220 }, (_, n) => 0.78 * Math.cos(2 * Math.PI * 4 * n / 219 + phase[i]));
    s += T(q.x, y + 22, i ? '同样强，但晚四分之一圈' : '同样强，从最高点开始', { size: M.h2, weight: 700, fill: i ? WARM : BLUE });
    s += linePlot(q.x, y + 40, q.w, 112, vals, { min: -1, max: 1, zero: true, c: i ? WARM : BLUE });
    s += T(q.x + 8, y + 180, '长度相同，方向不同', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 16, s, '同幅度不同相位的两个振动');
};

FIGURES['12-two-probes'] = async (M) => {
  const head = ['只用一条试探波会漏看，', '相差四分之一圈的两条要一起用'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 250 });
  const t = Array.from({ length: 240 }, (_, i) => i / 239);
  const signal = t.map((u) => Math.sin(2 * Math.PI * 4 * u));
  const probes = [t.map((u) => Math.cos(2 * Math.PI * 4 * u)), t.map((u) => Math.sin(2 * Math.PI * 4 * u))];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const product = signal.map((v, n) => v * probes[i][n]);
    const mean = product.reduce((a, b) => a + b, 0) / product.length;
    s += T(q.x, y + 22, i ? '正弦试探：能看见' : '余弦试探：几乎抵消', { size: M.h2, weight: 700, fill: i ? GREEN : WARM });
    s += linePlot(q.x, y + 38, q.w, 78, signal, { min: -1, max: 1, zero: true, c: '#9dafbc' });
    s += linePlot(q.x, y + 124, q.w, 78, product, { min: -1, max: 1, zero: true, c: i ? GREEN : WARM });
    s += T(q.x + 6, y + 230, `相乘后平均 ≈ ${mean.toFixed(2)}`, { size: M.body, weight: 700, fill: i ? GREEN : WARM });
  });
  return svgDoc(M.W, top + height + 16, s, '余弦与正弦两条正交试探波');
};

FIGURES['12-wrapping'] = async (M) => {
  const head = ['把相乘结果画在平面上：', '频率匹配时，平均位置会离开中心'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 250 });
  const n = 260;
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const probeF = i ? 5 : 6.25; const points = [];
    let sx = 0; let sy = 0;
    for (let k = 0; k < n; k += 1) {
      const t = k / n; const sig = Math.cos(2 * Math.PI * 5 * t + 0.45);
      const a = -2 * Math.PI * probeF * t; const px = sig * Math.cos(a); const py = sig * Math.sin(a);
      points.push([px, py]); sx += px; sy += py;
    }
    const bx = q.x + q.w / 2; const by = y + 128; const sc = Math.min(q.w, 190) * 0.39;
    s += T(q.x, y + 22, i ? '探测 5 Hz：匹配' : '探测 6.25 Hz：不匹配', { size: M.h2, weight: 700, fill: i ? GREEN : WARM });
    s += R(q.x, y + 38, q.w, 190, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
    s += L(q.x + 10, by, q.x + q.w - 10, by, { c: GRID }); s += L(bx, y + 48, bx, y + 218, { c: GRID });
    s += P(points.map(([a, b]) => [bx + a * sc, by - b * sc]), { c: i ? GREEN : WARM, w: 1.2 });
    s += C(bx + (sx / n) * sc, by - (sy / n) * sc, 5, { fill: INK, stroke: '#fff', sw: 1 });
    s += T(q.x + 8, y + 248, i ? '黑点明显偏离中心' : '黑点接近中心', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 18, s, '匹配与不匹配频率的复平面平均位置');
};

FIGURES['12-coefficient'] = async (M) => {
  const head = ['一次频率匹配的两个结果，', '可以合成一个复系数'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 235 });
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y;
    s += T(q.x, y + 22, i ? '长度与方向' : '横向与纵向', { size: M.h2, weight: 700, fill: i ? GREEN : BLUE });
    s += vectorPlane(q.x, y + 38, q.w, 170, 0.6, -0.8, { c: i ? GREEN : BLUE, label: '6 − 8i', range: 1 });
    s += T(q.x + 8, y + 230, i ? '强度 10，方向约 −53°' : '横向 6，纵向 −8', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 16, s, '傅里叶复系数的两种读法');
};

FIGURES['12-roundtrip'] = async (M) => {
  const head = ['频谱只保留峰高还不够：', '起始位置决定重建后的波形'];
  const top = headerH(M, head); const { slots, height } = layout(M, 3, { cols: 3, h: 205 });
  const t = Array.from({ length: 240 }, (_, i) => i / 239);
  const items = [
    ['原波形', t.map((u) => Math.cos(2 * Math.PI * 4 * u + 0.8)), BLUE],
    ['保留相位后重建', t.map((u) => Math.cos(2 * Math.PI * 4 * u + 0.8)), GREEN],
    ['把相位改成 0', t.map((u) => Math.cos(2 * Math.PI * 4 * u)), WARM],
  ];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, vals, c] = items[i];
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: c });
    s += linePlot(q.x, y + 38, q.w, 120, vals, { min: -1, max: 1, zero: true, c });
    s += T(q.x + 6, y + 190, i < 2 ? '形状与位置一致' : '峰高相同，位置改变', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 18, s, '保留与删除相位后的波形重建');
};

FIGURES['13-sample-grid'] = async (M) => {
  const head = ['电脑拿不到无限长曲线，', '只能保存有限个时刻的数字'];
  const top = headerH(M, head); const w = M.W - M.pad * 2; const ph = wide(M) ? 260 : 300;
  const vals = Array.from({ length: 300 }, (_, i) => 0.78 * Math.cos(2 * Math.PI * 2.5 * i / 299 + 0.2));
  let s = header(M, head); const x = M.pad;
  s += linePlot(x, top, w, 150, vals, { min: -1, max: 1, zero: true, c: '#a9bac7', w: 1.4 });
  const n = wide(M) ? 16 : 12;
  for (let i = 0; i < n; i += 1) {
    const u = i / (n - 1); const v = 0.78 * Math.cos(2 * Math.PI * 2.5 * u + 0.2);
    const px = x + 6 + u * (w - 12); const py = top + 6 + (1 - (v + 1) / 2) * 138;
    s += L(px, top + 75, px, py, { c: BLUE, w: 1.1 }); s += C(px, py, 4, { fill: BLUE, stroke: '#fff', sw: 1 });
  }
  const note = wide(M)
    ? ['灰线表示原来的连续变化；蓝点才是电脑真正保存的样本。', `这一段只有 ${n} 个数字。`]
    : ['灰线表示原来的连续变化；', '蓝点才是电脑真正保存的样本。', `这一段只有 ${n} 个数字。`];
  s += MT(x, top + 184, note, { size: M.body, fill: MUTED, leading: 23 });
  return svgDoc(M.W, top + ph + 10, s, '连续信号经过采样变成有限数字');
};

FIGURES['13-bases'] = async (M) => {
  const head = ['8 个样本可以配 8 种离散转法，', '图中先看前四种'];
  const top = headerH(M, head); const { slots, height } = layout(M, 4, { cols: 4, h: 205 });
  const N = 8; let s = header(M, head);
  slots.forEach((q, k) => {
    const y = top + q.y; const cx = q.x + q.w / 2; const cy = y + 104; const r = Math.min(q.w, 130) * 0.42;
    s += T(q.x, y + 22, `k = ${k}：转 ${k} 圈`, { size: M.h2, weight: 700, fill: [BLUE, WARM, GREEN, GOLD][k] });
    s += R(q.x, y + 36, q.w, 145, { fill: '#fff', stroke: GRID, sw: 1, r: 5 }); s += C(cx, cy, r, { fill: 'none', stroke: GRID, sw: 1 });
    const pts = Array.from({ length: N }, (_, n) => [cx + r * Math.cos(-2 * Math.PI * k * n / N), cy - r * Math.sin(-2 * Math.PI * k * n / N)]);
    s += P([...pts, pts[0]], { c: [BLUE, WARM, GREEN, GOLD][k], w: 1.7 });
    pts.forEach(([px, py]) => { s += C(px, py, 3.2, { fill: [BLUE, WARM, GREEN, GOLD][k], stroke: '#fff', sw: 0.8 }); });
    s += T(q.x + 6, y + 202, `${N} 个位置`, { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 14, s, '离散傅里叶变换的四种基函数');
};

FIGURES['13-frequency-bins'] = async (M) => {
  const head = ['频率格间隔由两件事决定：', '采样率 ÷ 样本数'];
  const top = headerH(M, head); const w = M.W - M.pad * 2; const ph = wide(M) ? 265 : 340; const x = M.pad;
  let s = header(M, head); s += card(x, top, w, ph, '#fff');
  const count = 9; const px = x + 28; const pw = w - 56; const y = top + 115;
  s += L(px, y, px + pw, y, { c: MUTED, w: 1.4 });
  for (let k = 0; k < count; k += 1) {
    const xx = px + (k / (count - 1)) * pw; s += L(xx, y - 8, xx, y + 8, { c: BLUE, w: 1.5 });
    if (k % 2 === 0) s += T(xx, y + 30, `${k * 500}`, { size: M.tick, fill: MUTED, anchor: 'middle' });
  }
  s += T(x + 24, top + 34, '例：采样率 8000 Hz，N = 16', { size: M.h2, weight: 700, fill: BLUE });
  s += T(x + 24, top + 67, '频率间隔 = 8000 ÷ 16 = 500 Hz', { size: M.body, fill: INK });
  s += T(x + 24, top + 198, '延长真实观察时间 → N 增加 → 频率格更密', { size: M.body, weight: 700, fill: GREEN });
  s += T(x + 24, top + 229, '只在后面补零 → 画得更密，但没有新增观察证据', { size: M.body, fill: WARM });
  return svgDoc(M.W, top + ph + 18, s, '采样率与样本数决定 DFT 频率间隔');
};

FIGURES['13-symmetry'] = async (M) => {
  const head = ['真实音频的完整 DFT 有一半是镜像，', '非负频率通常已经够看'];
  const top = headerH(M, head); const w = M.W - M.pad * 2; const ph = wide(M) ? 280 : 320; const x = M.pad;
  const N = 32; const sig = synth([5 * SR / N, 9 * SR / N], [1, 0.35], N / SR); const X = fftComplex(sig, N);
  const mags = Array.from({ length: N }, (_, k) => Math.hypot(X.re[k], X.im[k])); const max = Math.max(...mags);
  let s = header(M, head); s += card(x, top, w, ph, '#fff'); const px = x + 40; const py = top + 40; const pw = w - 80; const hh = 155;
  s += L(px, py + hh, px + pw, py + hh, { c: MUTED, w: 1.2 });
  mags.forEach((v, k) => {
    const xx = px + (k / (N - 1)) * pw; const yy = py + hh - (v / max) * (hh - 8);
    s += L(xx, py + hh, xx, yy, { c: k <= N / 2 ? BLUE : '#9bbce5', w: 1.5 }); s += C(xx, yy, 2.6, { fill: k <= N / 2 ? BLUE : '#9bbce5' });
  });
  const ny = px + (N / 2 / (N - 1)) * pw; s += L(ny, py, ny, py + hh + 10, { c: WARM, w: 1.7, dash: '5 4' });
  s += T(ny + 7, py + 18, '一半位置', { size: M.small, weight: 700, fill: WARM });
  s += T(px, top + 235, '深蓝：0 到采样率一半　浅蓝：共轭镜像', { size: M.body, fill: MUTED });
  s += T(px, top + 266, 'rfft 只返回前半边：N/2 + 1 个结果', { size: M.body, weight: 700, fill: GREEN });
  return svgDoc(M.W, top + ph + 18, s, '实值信号 DFT 的共轭对称');
};

FIGURES['14-frequency-axis'] = async (M) => {
  const head = ['FFT 返回的是位置编号，', '还要结合采样率才能换成 Hz'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 225 });
  let s = header(M, head); const items = [['数组位置 k = 41', '只知道第几个结果', BLUE], ['频率约 441.4 Hz', '22050 ÷ 2048 × 41', GREEN]];
  slots.forEach((q, i) => {
    const y = top + q.y; const [title, note, c] = items[i]; s += card(q.x, y, q.w, q.h, '#fff');
    s += T(q.x + 16, y + 30, title, { size: M.h2, weight: 700, fill: c });
    const bx = q.x + 22; const by = y + 105; const bw = q.w - 44; s += L(bx, by, bx + bw, by, { c: MUTED, w: 1.2 });
    for (let k = 0; k < 9; k += 1) { const xx = bx + (k / 8) * bw; s += L(xx, by - 7, xx, by + 7, { c: GRID }); }
    s += C(bx + 0.62 * bw, by, 6, { fill: c, stroke: '#fff', sw: 1 });
    s += T(q.x + 16, y + 174, note, { size: M.body, fill: MUTED });
    s += T(q.x + 16, y + 205, i ? '可以和现实音高对应' : '不能直接解释成频率', { size: M.small, weight: 700, fill: c });
  });
  return svgDoc(M.W, top + height + 16, s, 'FFT 索引换算为真实频率');
};

FIGURES['14-instruments'] = async (M) => {
  const head = ['同一个音附近，', '三件真实乐器的频谱轮廓仍然不同'];
  const top = headerH(M, head); const { slots, height } = layout(M, 3, { cols: 3, h: 210 });
  const items = [['钢琴 piano_c.wav', PIANO, BLUE], ['小提琴 violin_c.wav', VIOLIN, WARM], ['萨克斯 sax.wav', SAX, GREEN]];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, src, c] = items[i]; const curve = spectrumCurve(src);
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: c });
    s += linePlot(q.x + 26, y + 38, q.w - 26, 108, curve, {
      min: -60, max: 0, c, w: 1.6, tick: wide(M) ? 11.5 : 13.5,
      xticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k']], xmax: 3500, xunit: 'Hz',
      yticks: [[-60, '-60'], [-30, '-30'], [0, '0']], yunit: 'dB',
    });
    s += T(q.x, y + 190, '各自峰值为 0 dB', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 16, s, '钢琴小提琴和萨克斯的真实归一化频谱');
};

FIGURES['14-tone-noise'] = async (M) => {
  const head = ['规则振动集中在少数位置，', '不规则噪声分散在许多位置'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 225 });
  const tone = normalize(synth([440, 880], [1, 0.45], 1)); const items = [['440 + 880 Hz 规则振动', tone, BLUE], ['真实 noise.wav', NOISE, WARM]];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, src, c] = items[i]; const curve = spectrumCurve(src, 2500);
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: c });
    s += linePlot(q.x + 26, y + 38, q.w - 26, 116, curve, {
      min: -60, max: 0, c, w: 1.5, tick: wide(M) ? 11.5 : 13.5,
      xticks: [[0, '0'], [1000, '1k'], [2000, '2k']], xmax: 2500, xunit: 'Hz',
      yticks: [[-60, '-60'], [-30, '-30'], [0, '0']], yunit: 'dB',
    });
    s += T(q.x, y + 202, i ? '许多频率都有能量' : '两个位置明显突出', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 16, s, '规则振动与真实噪声的频谱比较');
};

FIGURES['14-normalization'] = async (M) => {
  const head = ['同样振幅的 250 Hz 正弦，', '原始 FFT 峰值会随样本数增长'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 240 });
  // 本项目的教学 FFT 是 radix-2 实现，因此使用 2 的整数次幂长度。
  const fs = 8192; const lengths = [fs, fs * 2];
  const peaks = lengths.map((N) => {
    const x = synth([250], [0.7], N / fs, fs); const X = fftComplex(x, N); return Math.hypot(X.re[250 * N / fs], X.im[250 * N / fs]);
  });
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; s += T(q.x, y + 22, i ? '按样本数归一化后' : '原始 FFT 模值', { size: M.h2, weight: 700, fill: i ? GREEN : WARM });
    s += card(q.x, y + 38, q.w, 155, '#fff'); const bw = Math.min(70, q.w * 0.22); const base = y + 168;
    [0, 1].forEach((k) => {
      const v = i ? (2 * peaks[k] / lengths[k]) : peaks[k]; const vmax = i ? 0.8 : Math.max(...peaks) * 1.1;
      const h = (v / vmax) * 105; const xx = q.x + q.w * (0.28 + k * 0.38);
      s += R(xx - bw / 2, base - h, bw, h, { fill: k ? WARM : BLUE, r: 3 });
      s += T(xx, base + 22, k ? '2 秒' : '1 秒', { size: M.small, fill: MUTED, anchor: 'middle' });
      s += T(xx, base - h - 8, i ? v.toFixed(2) : Math.round(v), { size: M.small, weight: 700, fill: k ? WARM : BLUE, anchor: 'middle' });
    });
    s += T(q.x + 6, y + 228, i ? '两段都回到振幅 0.70' : '2 秒结果是 1 秒的两倍', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 16, s, 'FFT 原始模值与单边幅值归一化');
};

FIGURES['15-what-when'] = async (M) => {
  const head = ['整段包含的频率相同，', '出现顺序却可以完全不同'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 235 });
  let s = header(M, head); const items = [['先低后高', [BLUE, WARM]], ['先高后低', [WARM, BLUE]]];
  slots.forEach((q, i) => {
    const y = top + q.y; s += T(q.x, y + 22, items[i][0], { size: M.h2, weight: 700, fill: i ? WARM : BLUE });
    const bx = q.x + 10; const bw = q.w - 20; const by = y + 48;
    items[i][1].forEach((c, k) => s += R(bx + k * bw / 2, by, bw / 2, 86, { fill: c === BLUE ? '#ddecfb' : '#fde7dc', stroke: c, sw: 1.4 }));
    s += T(bx + bw * 0.25, by + 50, items[i][1][0] === BLUE ? '300 Hz' : '900 Hz', { size: M.body, weight: 700, fill: items[i][1][0], anchor: 'middle' });
    s += T(bx + bw * 0.75, by + 50, items[i][1][1] === BLUE ? '300 Hz' : '900 Hz', { size: M.body, weight: 700, fill: items[i][1][1], anchor: 'middle' });
    s += T(q.x + 10, y + 170, '整段频谱：都有 300 与 900 Hz', { size: M.body, fill: MUTED });
    s += T(q.x + 10, y + 210, '只有时间顺序不同', { size: M.small, weight: 700, fill: GREEN });
  });
  return svgDoc(M.W, top + height + 16, s, '相同全局频率成分的两种时间顺序');
};

FIGURES['15-stft-process'] = async (M) => {
  const head = ['STFT 的动作：', '移动短窗，每到一处就算一列频率结果'];
  const top = headerH(M, head); const { slots, height } = layout(M, 3, { cols: 3, h: 215 });
  const ysig = chirpWithClick(); let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; s += T(q.x, y + 22, ['1　选一小段', '2　计算这一段', '3　把各列并排'][i], { size: M.h2, weight: 700, fill: [BLUE, WARM, GREEN][i] });
    s += card(q.x, y + 38, q.w, 145, '#fff');
    if (i === 0) {
      s += envelopePath(ysig, q.x + 10, y + 72, q.w - 20, 74, { c: '#9eb3c2', opacity: 0.8 });
      s += R(q.x + q.w * 0.32, y + 62, q.w * 0.28, 96, { fill: '#ddecfb', stroke: BLUE, sw: 1.5, r: 3 });
    } else if (i === 1) {
      const bars = [0.15, 0.38, 0.82, 0.48, 0.2, 0.08];
      bars.forEach((v, k) => s += R(q.x + 24 + k * (q.w - 62) / 6, y + 160 - v * 88, (q.w - 80) / 7, v * 88, { fill: WARM, r: 2 }));
    } else {
      for (let col = 0; col < 9; col += 1) for (let row = 0; row < 6; row += 1) {
        const strong = Math.abs(row - (5 - Math.round(col * 5 / 8))) <= 1;
        s += R(q.x + 18 + col * (q.w - 40) / 9, y + 58 + row * 17, (q.w - 50) / 9, 14, { fill: strong ? GREEN : '#e8f3ee', r: 1 });
      }
    }
    s += T(q.x + 6, y + 208, ['窗继续向右移动', '得到一列数字', '横向是时间，纵向是频率'][i], { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 16, s, '短时傅里叶变换从移动窗口到时频矩阵');
};

FIGURES['15-tradeoff'] = async (M) => {
  const head = ['同一段上升音与一次敲击：', '短窗定位准，长窗分频细'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 280 });
  const ysig = chirpWithClick(); const configs = [[256, 64], [1024, 256]]; let s = header(M, head);
  for (let i = 0; i < slots.length; i += 1) {
    const q = slots[i]; const y = top + q.y; const [nfft, hop] = configs[i]; const S = stft(ysig, SR, { nfft, hop });
    // eslint-disable-next-line no-await-in-loop
    const uri = await spectrogramPng(S, { w: Math.round(q.w * 2.2), h: 330, fmax: 2000, dbFloor: -48, cmap: 'magma' });
    s += T(q.x, y + 22, i ? '长窗 64 ms' : '短窗 16 ms', { size: M.h2, weight: 700, fill: i ? WARM : BLUE });
    s += R(q.x, y + 38, q.w, 178, { fill: '#fff', stroke: GRID, sw: 1, r: 5 }); s += image(uri, q.x + 4, y + 42, q.w - 8, 170);
    s += T(q.x + 5, y + 237, i ? '频率轨迹较细，敲击被横向拉开' : '敲击位置更集中，频带较宽', { size: M.small, fill: MUTED });
    s += colorbar(q.x + 46, y + 260, Math.min(130, q.w - 100), 9, 'magma', { size: wide(M) ? 12 : 14 });
  }
  return svgDoc(M.W, top + height + 18, s, '短窗与长窗 STFT 的时间频率取舍');
};

FIGURES['15-output-shape'] = async (M) => {
  const head = ['输出矩阵有多少行和列，', '由频率箱数与帧数共同决定'];
  const top = headerH(M, head); const { slots, height } = layout(M, 4, { cols: 4, h: 170 });
  const items = [
    ['录音', '10000 个样本', BLUE], ['每帧', '1000 个样本', WARM], ['每次前进', '500 个样本', GREEN], ['输出', '501 行 × 19 列', GOLD],
  ];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, value, c] = items[i]; s += card(q.x, y, q.w, q.h, i === 3 ? '#fff8e5' : PLATE);
    s += C(q.x + 24, y + 27, 14, { fill: c }); s += T(q.x + 24, y + 32, i + 1, { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(q.x + 48, y + 32, name, { size: M.h2, weight: 700 }); s += MT(q.x + 16, y + 80, [value], { size: M.body, weight: 700, fill: c });
    if (i < 3) {
      const n = slots[i + 1]; s += wide(M) ? ARROW(q.x + q.w + 3, y + 85, n.x - 3, top + n.y + 85) : ARROW(q.x + q.w / 2, y + q.h + 3, q.x + q.w / 2, top + n.y - 3);
    }
  });
  const yy = top + height + 28;
  const notes = wide(M)
    ? ['501 = 1000/2 + 1 个非负频率位置', '19 = (10000 − 1000)/500 + 1 个完整帧']
    : ['501 = 1000/2 + 1', '即 501 个非负频率位置', '19 = (10000 − 1000)/500 + 1', '即 19 个完整帧'];
  s += MT(M.pad, yy, notes, { size: M.body, fill: MUTED, leading: 25 });
  return svgDoc(M.W, yy + (wide(M) ? 54 : 104), s, 'STFT 输出矩阵尺寸的计算');
};

for (const [modeName, M] of Object.entries(MODES)) {
  const out = join(BASE, modeName); mkdirSync(out, { recursive: true });
  for (const [name, draw] of Object.entries(FIGURES)) {
    // eslint-disable-next-line no-await-in-loop
    writeFileSync(join(out, `${name}.svg`), await draw(M), 'utf8');
  }
}

console.log(`生成 ${Object.keys(FIGURES).length} 张知识图 × 2 个版式 = ${Object.keys(FIGURES).length * 2} 个 SVG`);
console.log(`输出目录：${BASE}`);
