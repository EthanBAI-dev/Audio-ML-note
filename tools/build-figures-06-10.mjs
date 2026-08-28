#!/usr/bin/env node
// 为零基础版第 06–10 课生成知识图。每张图由同一份数据输出 desktop / mobile 两版。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, fft } from './lib/dsp.mjs';
import { svgDoc, T, R, L, P, envelopePath, PALETTE } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_06-10', 'figures');
const SR = 16000;
const BLUE = PALETTE.s1;
const WARM = PALETTE.s2;
const GREEN = PALETTE.s3;
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
function C(x, y, r, o = {}) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.fill ?? BLUE}" stroke="${o.stroke ?? 'none'}" stroke-width="${o.sw ?? 1}"/>`;
}
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
const card = (x, y, w, h, fill = PLATE) => R(x, y, w, h, { fill, stroke: GRID, sw: 1, r: 9 });
const plotFrame = (x, y, w, h) => R(x, y, w, h, { fill: '#fff', stroke: GRID, sw: 1, r: 5 })
  + L(x + 7, y + h / 2, x + w - 7, y + h / 2, { c: GRID, w: 1 });
const headerH = (M, lines) => wide(M) ? 56 : 31 + (lines.length - 1) * 25 + 25;
const header = (M, lines) => wide(M)
  ? T(M.pad, 36, lines.join(''), { size: M.h1, weight: 700 })
  : MT(M.pad, 31, lines, { size: M.h1, weight: 700, leading: 25 });

function layout(M, n, { cols = n, h = 150, gap = M.gap } = {}) {
  const c = wide(M) ? cols : 1;
  const rows = Math.ceil(n / c);
  const w = (M.W - M.pad * 2 - gap * (c - 1)) / c;
  const slots = Array.from({ length: n }, (_, i) => ({
    x: M.pad + (i % c) * (w + gap),
    y: Math.floor(i / c) * (h + gap), w, h,
  }));
  return { slots, height: rows * h + (rows - 1) * gap };
}

function linePlot(x, y, w, h, values, o = {}) {
  const min = o.min ?? Math.min(...values);
  const max = o.max ?? Math.max(...values);
  const span = Math.max(1e-12, max - min);
  let s = R(x, y, w, h, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
  if (o.zero && min <= 0 && max >= 0) {
    const zy = y + h - ((0 - min) / span) * h;
    s += L(x + 5, zy, x + w - 5, zy, { c: GRID });
  }
  const pts = Array.from(values, (v, i) => [x + 6 + (i / Math.max(1, values.length - 1)) * (w - 12), y + 6 + (1 - (v - min) / span) * (h - 12)]);
  return s + P(pts, { c: o.c ?? BLUE, w: o.w ?? 1.8 });
}

function load(name, start = 0, dur = null) {
  const wav = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const all = resample(wav.samples, wav.sampleRate, SR);
  const a = Math.floor(start * SR);
  const b = dur == null ? all.length : Math.min(all.length, Math.floor((start + dur) * SR));
  return { samples: all.subarray(a, b), sampleRate: SR };
}
const VOICE = load('voice.wav', 0.4, 10);
const VOICE4 = load('voice.wav', 2.2, 4);
const NOISE = load('noise.wav', 1, 6);
const DEBUSSY = load('debussy.wav', 6, 8);
const REDHOT = load('redhot.wav', 6, 8);
const DUKE = load('duke.wav', 6, 8);

function normalize(samples) {
  let peak = 0;
  for (const v of samples) peak = Math.max(peak, Math.abs(v));
  return Float64Array.from(samples, (v) => v / Math.max(peak, 1e-9));
}

function frameFeatures(samples, frameLength = 400, hop = 160, threshold = 1e-4) {
  const ae = []; const rms = []; const zcr = []; const starts = [];
  for (let start = 0; start + frameLength <= samples.length; start += hop) {
    let peak = 0; let sum = 0; let flips = 0; let prev = 0;
    for (let i = 0; i < frameLength; i += 1) {
      const v = samples[start + i];
      peak = Math.max(peak, Math.abs(v)); sum += v * v;
      const sign = Math.abs(v) < threshold ? 0 : (v > 0 ? 1 : -1);
      if (i && sign && prev && sign !== prev) flips += 1;
      if (sign) prev = sign;
    }
    starts.push(start); ae.push(peak); rms.push(Math.sqrt(sum / frameLength)); zcr.push(flips / (frameLength - 1));
  }
  return { ae, rms, zcr, starts };
}

function fftMagnitude(samples, nfft = 512, useHann = false) {
  const re = new Float64Array(nfft); const im = new Float64Array(nfft);
  const n = Math.min(samples.length, nfft);
  for (let i = 0; i < n; i += 1) {
    const win = useHann ? 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)) : 1;
    re[i] = samples[i] * win;
  }
  fft(re, im);
  const mag = [];
  for (let k = 0; k <= nfft / 2; k += 1) mag.push(Math.hypot(re[k], im[k]));
  return mag;
}

function waveExact(x, y, w, h, values, color = BLUE) {
  let s = plotFrame(x, y, w, h);
  const pts = Array.from(values, (v, i) => [x + 6 + (i / (values.length - 1)) * (w - 12), y + h / 2 - v * (h / 2 - 7)]);
  return s + P(pts, { c: color, w: 1.7 });
}

const FIGURES = {};

FIGURES['06-pipeline'] = (M) => {
  const head = ['一整段录音怎样变成', '程序可以逐步处理的数字'];
  const top = headerH(M, head); const h = wide(M) ? 148 : 112;
  const { slots, height } = layout(M, 4, { cols: 4, h });
  const labels = ['连续录音', '切成短帧', '每帧算一个数字', '保留序列或做汇总'];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y;
    s += card(q.x, y, q.w, q.h, i === 3 ? '#edf7f2' : PLATE);
    s += C(q.x + 22, y + 25, 14, { fill: i === 3 ? GREEN : BLUE });
    s += T(q.x + 22, y + 30, i + 1, { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(q.x + 44, y + 30, labels[i], { size: M.h2, weight: 700 });
    if (i === 0) s += envelopePath(VOICE4.samples, q.x + 16, y + 56, q.w - 32, q.h - 72, { c: BLUE, opacity: 0.9 });
    if (i === 1) {
      for (let k = 0; k < 4; k += 1) s += R(q.x + 18 + k * (q.w - 70) / 5, y + 56, q.w * 0.34, q.h - 72, { fill: k % 2 ? '#edf7f2' : '#eaf3fb', stroke: k % 2 ? GREEN : BLUE, sw: 1.2, r: 3 });
    }
    if (i === 2) {
      const f = frameFeatures(VOICE4.samples);
      s += linePlot(q.x + 15, y + 52, q.w - 30, q.h - 68, f.rms, { min: 0, c: WARM });
    }
    if (i === 3) {
      s += linePlot(q.x + 15, y + 50, q.w - 30, 34, [0.18, 0.32, 0.27, 0.5, 0.42, 0.61, 0.36], { min: 0, c: GREEN });
      s += T(q.x + 16, y + q.h - 14, '顺序 / 均值与波动', { size: M.small, fill: MUTED });
    }
    if (i < 3) {
      const next = slots[i + 1];
      s += wide(M)
        ? ARROW(q.x + q.w + 3, y + q.h / 2, next.x - 3, top + next.y + next.h / 2)
        : ARROW(q.x + q.w / 2, y + q.h + 3, q.x + q.w / 2, top + next.y - 3);
    }
  });
  return svgDoc(M.W, top + height + 24, s, '连续录音经过分帧、逐帧计算和聚合的流程');
};

FIGURES['06-frame-hop'] = (M) => {
  const head = ['帧长与帧移：', '一个决定看多长，一个决定走多远'];
  const top = headerH(M, head); const chartH = wide(M) ? 190 : 210;
  let s = header(M, head);
  const x = M.pad; const y = top; const w = M.W - M.pad * 2;
  s += card(x, y, w, chartH, '#fff');
  s += envelopePath(VOICE4.samples, x + 12, y + 42, w - 24, chartH - 78, { c: '#a9bac7', opacity: 0.75 });
  const fw = wide(M) ? 230 : 150; const hop = wide(M) ? 120 : 76;
  [0, 1, 2].forEach((i) => {
    const xx = x + 24 + i * hop;
    s += `<rect x="${xx}" y="${y + 34}" width="${fw}" height="${chartH - 63}" rx="4" fill="${i === 1 ? '#edf7f2' : '#eaf3fb'}" fill-opacity="0.42" stroke="${i === 1 ? GREEN : BLUE}" stroke-width="1.6"/>`;
    s += T(xx + 9, y + 55, `第 ${i + 1} 帧`, { size: M.small, weight: 700, fill: i === 1 ? GREEN : BLUE });
  });
  s += ARROW(x + 24, y + chartH - 17, x + 24 + fw, y + chartH - 17, { c: BLUE });
  s += T(x + 24 + fw / 2, y + chartH - 23, '帧长', { size: M.small, weight: 700, fill: BLUE, anchor: 'middle' });
  s += ARROW(x + 24, y + 19, x + 24 + hop, y + 19, { c: WARM });
  s += T(x + 24 + hop / 2, y + 15, '帧移', { size: M.small, weight: 700, fill: WARM, anchor: 'middle' });
  s += MT(x + 2, y + chartH + 27, ['帧长决定每次覆盖多少声音；帧移更小，', '相邻观察就会重叠得更多。'], { size: M.body, fill: MUTED, leading: 22 });
  return svgDoc(M.W, top + chartH + 78, s, '同一段波形上的帧长、帧移和重叠关系');
};

FIGURES['06-windowing'] = (M) => {
  const head = ['直接截断会制造断口，', 'Hann 窗让两端慢慢回到零'];
  const top = headerH(M, head); const ph = wide(M) ? 230 : 208;
  const { slots, height } = layout(M, 2, { cols: 2, h: ph });
  const n = 256; const raw = Float64Array.from({ length: n }, (_, i) => Math.sin(2 * Math.PI * 5.4 * i / (n - 1)));
  const tapered = Float64Array.from(raw, (v, i) => v * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1))));
  const a = fftMagnitude(raw, 1024, false); const b = fftMagnitude(tapered, 1024, false);
  const db = (arr) => { const m = Math.max(...arr); return arr.slice(0, 90).map((v) => Math.max(-65, 20 * Math.log10(Math.max(v / m, 1e-8)))); };
  let s = header(M, head);
  const q0 = slots[0]; const y0 = top + q0.y;
  s += T(q0.x, y0 + 22, '截下来的这一小段', { size: M.h2, weight: 700, fill: BLUE });
  s += waveExact(q0.x, y0 + 36, q0.w, 72, raw, '#a9bac7');
  s += waveExact(q0.x, y0 + 126, q0.w, 72, tapered, GREEN);
  s += T(q0.x + 8, y0 + 122, '乘上 Hann 窗后', { size: M.small, fill: GREEN });
  const q1 = slots[1]; const y1 = top + q1.y;
  s += T(q1.x, y1 + 22, '频谱里的远处泄漏', { size: M.h2, weight: 700, fill: WARM });
  s += linePlot(q1.x, y1 + 36, q1.w, 72, db(a), { min: -65, max: 0, c: '#9aa9b4' });
  s += linePlot(q1.x, y1 + 126, q1.w, 72, db(b), { min: -65, max: 0, c: WARM });
  s += T(q1.x + 8, y1 + 122, '加窗后：远处假成分更低', { size: M.small, fill: WARM });
  return svgDoc(M.W, top + height + 20, s, '截断正弦波与 Hann 加窗后的波形和频谱差别');
};

FIGURES['06-sequence-summary'] = (M) => {
  const head = ['逐帧结果要不要保留顺序？', '取决于任务是否关心“什么时候”'];
  const top = headerH(M, head); const f = frameFeatures(VOICE.samples, 400, 160);
  const h = wide(M) ? 270 : 360; let s = header(M, head);
  const x = M.pad; const w = M.W - M.pad * 2;
  s += linePlot(x, top + 12, w, 100, f.rms, { min: 0, c: BLUE });
  s += T(x, top + 132, '每个点对应一个短帧，左右位置仍表示时间。', { size: M.body, fill: MUTED });
  const mid = wide(M) ? M.W / 2 : M.pad + 4;
  if (wide(M)) {
    s += ARROW(M.W / 2, top + 120, M.W / 2 - 180, top + 168, { c: MUTED });
    s += ARROW(M.W / 2, top + 120, M.W / 2 + 180, top + 168, { c: MUTED });
    s += card(M.pad, top + 170, 360, 74, '#edf7f2');
    s += card(M.W - M.pad - 360, top + 170, 360, 74, '#fff3ed');
    s += T(M.pad + 18, top + 200, '保留整条序列', { size: M.h2, weight: 700, fill: GREEN });
    s += T(M.pad + 18, top + 226, '适合定位事件、识别先后顺序', { size: M.body });
    s += T(M.W - M.pad - 342, top + 200, '只留下均值与波动', { size: M.h2, weight: 700, fill: WARM });
    s += T(M.W - M.pad - 342, top + 226, '长度固定，但时间位置消失', { size: M.body });
  } else {
    s += ARROW(M.W / 2, top + 120, M.W / 2, top + 164, { c: MUTED });
    s += card(mid, top + 170, w - 8, 72, '#edf7f2');
    s += T(mid + 16, top + 199, '保留整条序列', { size: M.h2, weight: 700, fill: GREEN });
    s += T(mid + 16, top + 224, '适合定位事件、识别先后顺序', { size: M.body });
    s += card(mid, top + 260, w - 8, 72, '#fff3ed');
    s += T(mid + 16, top + 289, '只留下均值与波动', { size: M.h2, weight: 700, fill: WARM });
    s += T(mid + 16, top + 314, '长度固定，但时间位置消失', { size: M.body });
  }
  return svgDoc(M.W, top + h, s, '帧级特征序列保留时间与统计聚合删除时间的对比');
};

FIGURES['07-three-features'] = (M) => {
  const head = ['同一段声音，', '三种时域观察法回答三个问题'];
  const top = headerH(M, head); const f = frameFeatures(VOICE4.samples);
  const { slots, height } = layout(M, 3, { cols: 3, h: 178 });
  const items = [
    ['振幅包络 AE', '最高峰有多高？', f.ae, BLUE],
    ['均方根 RMS', '这一小段整体有多强？', f.rms, WARM],
    ['过零率 ZCR', '上下翻越零线有多密？', f.zcr, GREEN],
  ];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, question, values, color] = items[i];
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: color });
    s += T(q.x, y + 46, question, { size: M.body, fill: MUTED });
    s += linePlot(q.x, y + 62, q.w, 92, values, { min: 0, c: color });
    s += T(q.x + 5, y + 174, '时间 →', { size: M.tick, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 18, s, '同一段语音的振幅包络、RMS 与过零率曲线');
};

FIGURES['07-ae-rms'] = (M) => {
  const head = ['同样的最高峰，', '不代表整段声音同样强'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 220 });
  const n = 100;
  const spike = Float64Array.from({ length: n }, (_, i) => i === 50 ? 1 : 0);
  const sustained = Float64Array.from({ length: n }, (_, i) => 0.42 * Math.sin(2 * Math.PI * 8 * i / n));
  const cases = [['只有一下尖峰', spike, 'AE = 1.00', 'RMS = 0.10'], ['持续振动', sustained, 'AE = 0.42', 'RMS ≈ 0.30']];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, samples, ae, rms] = cases[i];
    s += T(q.x, y + 24, name, { size: M.h2, weight: 700, fill: i ? GREEN : WARM });
    s += waveExact(q.x, y + 40, q.w, 90, samples, i ? GREEN : WARM);
    s += T(q.x + 8, y + 160, ae, { size: M.body, weight: 700, fill: BLUE });
    s += T(q.x + q.w / 2, y + 160, rms, { size: M.body, weight: 700, fill: WARM });
    s += T(q.x + 8, y + 190, i ? '峰值不高，但能量持续存在' : '峰值很高，却只占一个样本', { size: M.body, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 12, s, '孤立尖峰与持续振动的振幅包络和 RMS 对比');
};

FIGURES['07-zero-crossings'] = (M) => {
  const head = ['过零率数的不是峰，', '而是波形翻越中线的次数'];
  const top = headerH(M, head); const { slots, height } = layout(M, 3, { cols: 3, h: 178 });
  const rnd = (() => { let x = 17; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1; })();
  const items = [
    ['慢慢振动', Float64Array.from({ length: 121 }, (_, i) => Math.sin(2 * Math.PI * 2 * i / 120)), BLUE],
    ['快速振动', Float64Array.from({ length: 121 }, (_, i) => Math.sin(2 * Math.PI * 7 * i / 120)), WARM],
    ['不规则噪声', Float64Array.from({ length: 121 }, () => rnd() * 0.85), GREEN],
  ];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, values, color] = items[i];
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: color });
    s += waveExact(q.x, y + 38, q.w, 96, values, color);
    for (let k = 1; k < values.length; k += 1) if (values[k] * values[k - 1] < 0) {
      const xx = q.x + 6 + (k / (values.length - 1)) * (q.w - 12);
      s += C(xx, y + 86, 2.8, { fill: WARM, stroke: '#fff', sw: 0.8 });
    }
    s += T(q.x + 6, y + 160, i === 0 ? '交点少' : i === 1 ? '交点多而规律' : '交点多但不规则', { size: M.body, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 15, s, '低频、高频和噪声波形的过零点差别');
};

FIGURES['07-evidence-matrix'] = (M) => {
  const head = ['三条曲线都只是证据，', '没有一条能独自认出声音'];
  const top = headerH(M, head); const rows = [
    ['突然的点击或削波', 'AE 最敏感', 'RMS 会被平均', 'ZCR 不一定高'],
    ['持续的强弱变化', 'AE 看峰值', 'RMS 更稳定', 'ZCR 说明不了强弱'],
    ['清音或噪声样片段', '强弱可能很低', 'RMS 可能很低', 'ZCR 往往升高'],
    ['音色或具体音高', '信息不足', '信息不足', '只能给粗线索'],
  ];
  let s = header(M, head); const x = M.pad; const w = M.W - M.pad * 2;
  if (!wide(M)) {
    const cardH = 132; const gap = 12;
    rows.forEach((row, r) => {
      const y = top + r * (cardH + gap);
      s += card(x, y, w, cardH, r % 2 ? '#fff' : PLATE);
      s += T(x + 14, y + 25, row[0], { size: M.body, weight: 700 });
      [['AE', row[1], BLUE], ['RMS', row[2], WARM], ['ZCR', row[3], GREEN]].forEach(([name, value, color], i) => {
        const yy = y + 54 + i * 25;
        s += T(x + 14, yy, name, { size: M.small, weight: 700, fill: color });
        s += T(x + 68, yy, value, { size: M.small, fill: MUTED });
      });
    });
    return svgDoc(M.W, top + rows.length * cardH + (rows.length - 1) * gap + 18, s, '振幅包络、RMS 和过零率各自能回答与不能回答的问题');
  }
  const col0 = wide(M) ? 230 : 140; const other = (w - col0) / 3; const rowH = wide(M) ? 56 : 72;
  ['要判断什么', 'AE', 'RMS', 'ZCR'].forEach((v, i) => s += T(x + (i ? col0 + (i - 1) * other : 0) + 8, top + 26, v, { size: M.h2, weight: 700, fill: i ? [BLUE, WARM, GREEN][i - 1] : INK }));
  s += L(x, top + 38, x + w, top + 38, { c: GRID });
  rows.forEach((row, r) => {
    const y = top + 66 + r * rowH;
    if (r % 2 === 0) s += R(x, y - 22, w, rowH, { fill: PLATE });
    row.forEach((v, i) => {
      const xx = x + (i ? col0 + (i - 1) * other : 0) + 8;
      const lines = !wide(M) && v.length > 8 ? [v.slice(0, 7), v.slice(7)] : [v];
      s += MT(xx, y, lines, { size: M.small, fill: i ? MUTED : INK, leading: 20 });
    });
  });
  return svgDoc(M.W, top + 76 + rows.length * rowH, s, '振幅包络、RMS 和过零率各自能回答与不能回答的问题');
};

FIGURES['08-envelope-steps'] = (M) => {
  const head = ['振幅包络的计算：', '每个短帧只留下最高的绝对值'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 240 });
  const clip = normalize(DUKE.samples.subarray(0, SR * 3)); const f = frameFeatures(clip, 800, 400);
  let s = header(M, head);
  const a = slots[0]; const ay = top + a.y;
  s += T(a.x, ay + 24, '1　先把波形切成重叠短帧', { size: M.h2, weight: 700, fill: BLUE });
  s += R(a.x, ay + 42, a.w, 142, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
  s += envelopePath(clip, a.x + 8, ay + 54, a.w - 16, 116, { c: '#9eb3c2', opacity: 0.85 });
  for (let i = 0; i < 5; i += 1) s += `<rect x="${a.x + 12 + i * (a.w - 45) / 6}" y="${ay + 48}" width="${a.w * 0.28}" height="130" rx="3" fill="#d9ecf8" fill-opacity="0.18" stroke="${i % 2 ? GREEN : BLUE}" stroke-width="1.2"/>`;
  const b = slots[1]; const by = top + b.y;
  s += T(b.x, by + 24, '2　每帧取最大绝对值，再按时间连起来', { size: M.h2, weight: 700, fill: GREEN });
  s += linePlot(b.x, by + 42, b.w, 142, f.ae, { min: 0, max: 1, c: GREEN });
  s += T(b.x + 4, by + 210, '一个点 = 一个短帧的最高峰', { size: M.body, fill: MUTED });
  return svgDoc(M.W, top + height + 12, s, '从重叠短帧到振幅包络曲线的两步计算');
};

FIGURES['08-absolute-value'] = (M) => {
  const head = ['为什么必须先取绝对值？', '负方向的大峰也同样大'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 210 });
  const values = [-0.2, 0.7, -0.9, 0.4]; let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; s += T(q.x, y + 24, i ? '先看离零线有多远' : '只找数值最大的样本', { size: M.h2, weight: 700, fill: i ? GREEN : WARM });
    const base = y + 115; const bw = Math.min(46, (q.w - 50) / 4);
    values.forEach((v, k) => {
      const h = Math.abs(v) * 70; const xx = q.x + 25 + k * (q.w - 50) / 4;
      s += R(xx, v >= 0 ? base - h : base, bw, h, { fill: v >= 0 ? BLUE : WARM, r: 2 });
      s += T(xx + bw / 2, base + 24, String(v), { size: M.small, fill: MUTED, anchor: 'middle' });
    });
    s += L(q.x + 12, base, q.x + q.w - 12, base, { c: INK, w: 1.2 });
    s += T(q.x + 12, y + 183, i ? '结果：0.9（正确）' : '结果：0.7（漏掉 −0.9）', { size: M.body, weight: 700, fill: i ? GREEN : WARM });
  });
  return svgDoc(M.W, top + height + 10, s, '直接取最大值与先取绝对值的结果差别');
};

FIGURES['08-frame-size'] = (M) => {
  const head = ['窗口越长，包络越平滑；', '但相邻事件也更容易被合并'];
  const top = headerH(M, head); const clip = normalize(DUKE.samples.subarray(0, SR * 5));
  const sizes = [[256, '16 ms'], [1024, '64 ms'], [4096, '256 ms']]; const { slots, height } = layout(M, 3, { cols: 3, h: 174 });
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [size, ms] = sizes[i]; const f = frameFeatures(clip, size, Math.max(64, Math.floor(size / 2)));
    s += T(q.x, y + 22, `${size} 点 ≈ ${ms}`, { size: M.h2, weight: 700, fill: [BLUE, GREEN, WARM][i] });
    s += linePlot(q.x, y + 40, q.w, 105, f.ae, { min: 0, max: 1, c: [BLUE, GREEN, WARM][i] });
    s += T(q.x + 4, y + 168, i === 0 ? '定位细，曲线更抖' : i === 1 ? '常用折中' : '很平滑，细节被合并', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 12, s, '同一段录音在三种帧长下得到的振幅包络');
};

FIGURES['08-tail-policy'] = (M) => {
  const head = ['录音结尾不够一整帧时，', '必须明确采用哪一种规则'];
  const top = headerH(M, head); const { slots, height } = layout(M, 3, { cols: 3, h: 176 });
  const items = [['丢弃尾帧', '长度整齐', '最后一点声音可能消失'], ['保留短尾帧', '不丢声音', '最后一帧样本数不同'], ['补零到整帧', '形状整齐', '补入的零会改变统计量']];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; s += T(q.x, y + 23, items[i][0], { size: M.h2, weight: 700, fill: [WARM, GREEN, BLUE][i] });
    const total = q.w - 20; const unit = total / 4.6;
    for (let k = 0; k < 4; k += 1) s += R(q.x + 10 + k * unit, y + 44, unit - 4, 42, { fill: '#d9ecf8', stroke: BLUE, sw: 1, r: 2 });
    if (i === 0) s += PATH(`M${q.x + 10 + 4 * unit} ${y + 44} l${unit * 0.55} 42 M${q.x + 10 + 4.55 * unit} ${y + 44} l-${unit * 0.55} 42`, { c: WARM, w: 2 });
    if (i === 1) s += R(q.x + 10 + 4 * unit, y + 44, unit * 0.55, 42, { fill: '#edf7f2', stroke: GREEN, sw: 1.4, r: 2 });
    if (i === 2) {
      s += R(q.x + 10 + 4 * unit, y + 44, unit * 0.55, 42, { fill: '#edf7f2', stroke: GREEN, sw: 1.4, r: 2 });
      s += R(q.x + 10 + 4.55 * unit, y + 44, unit * 0.45, 42, { fill: '#fff', stroke: MUTED, sw: 1, r: 2 });
    }
    s += T(q.x + 10, y + 118, items[i][1], { size: M.body, weight: 700 });
    s += T(q.x + 10, y + 147, items[i][2], { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 12, s, '尾帧不足时丢弃、保留和补零三种策略');
};

FIGURES['08-three-recordings'] = (M) => {
  const head = ['三段真实音乐的包络形状不同，', '但形状不等于音乐风格标签'];
  const top = headerH(M, head); const sources = [['古典片段', DEBUSSY, BLUE], ['摇滚片段', REDHOT, WARM], ['爵士片段', DUKE, GREEN]];
  const { slots, height } = layout(M, 3, { cols: 3, h: 178 }); let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, src, color] = sources[i]; const f = frameFeatures(normalize(src.samples), 1024, 512);
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: color });
    s += linePlot(q.x, y + 40, q.w, 108, f.ae, { min: 0, max: 1, c: color });
    s += T(q.x + 4, y + 171, '各自按峰值归一化，只比较轮廓', { size: M.small, fill: MUTED });
  });
  return svgDoc(M.W, top + height + 14, s, '古典、摇滚和爵士课程音频片段的振幅包络');
};

FIGURES['09-rms-steps'] = (M) => {
  const head = ['RMS 的四步：', '平方、求平均，再开平方'];
  const top = headerH(M, head); const vals = [1, -1, 0.5, -0.5]; const { slots, height } = layout(M, 4, { cols: 4, h: 150 });
  const items = [['原始样本', '1, −1, 0.5, −0.5'], ['每个数平方', '1, 1, 0.25, 0.25'], ['求平方的平均', '(1+1+0.25+0.25)/4'], ['最后开平方', 'RMS ≈ 0.79']];
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; s += C(q.x + 18, y + 22, 13, { fill: [BLUE, WARM, GREEN, BLUE][i] });
    s += T(q.x + 18, y + 27, i + 1, { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(q.x + 39, y + 27, items[i][0], { size: M.h2, weight: 700 });
    s += card(q.x, y + 45, q.w, 78, i === 3 ? '#edf7f2' : PLATE);
    s += T(q.x + q.w / 2, y + 90, items[i][1], { size: M.body, weight: i === 3 ? 700 : 400, fill: i === 3 ? GREEN : INK, anchor: 'middle' });
    if (i < 3) {
      const b = slots[i + 1]; s += wide(M) ? ARROW(q.x + q.w + 3, y + 84, b.x - 3, top + b.y + 84) : ARROW(q.x + q.w / 2, y + 128, q.x + q.w / 2, top + b.y - 3);
    }
  });
  return svgDoc(M.W, top + height + 18, s, 'RMS 从样本平方到开平方的四步计算');
};

FIGURES['09-outlier'] = (M) => {
  const head = ['一个孤立尖峰变大时，', 'AE 与 RMS 的反应速度不同'];
  const top = headerH(M, head); const n = 100; const a = Array.from({ length: 101 }, (_, i) => i / 100); const rms = a.map((v) => v / Math.sqrt(n));
  let s = header(M, head); const x = M.pad; const w = M.W - M.pad * 2; const ph = wide(M) ? 220 : 245;
  s += R(x, top, w, ph, { fill: '#fff', stroke: GRID, sw: 1, r: 6 });
  const px = x + 46; const py = top + 24; const pw = w - 70; const hh = ph - 68;
  s += L(px, py + hh, px + pw, py + hh, { c: INK, w: 1.2 }); s += L(px, py, px, py + hh, { c: INK, w: 1.2 });
  const map = (arr) => arr.map((v, i) => [px + (i / 100) * pw, py + hh - v * hh]);
  s += P(map(a), { c: BLUE, w: 2.2 }); s += P(map(rms), { c: WARM, w: 2.2 });
  s += T(px + pw - 8, py + 18, 'AE = 峰值', { size: M.body, weight: 700, fill: BLUE, anchor: 'end' });
  s += T(px + pw - 8, py + hh - 14, 'RMS = 峰值 ÷ 10', { size: M.body, weight: 700, fill: WARM, anchor: 'end' });
  s += T(px, top + ph - 14, '孤立样本的幅度 →', { size: M.tick, fill: MUTED });
  return svgDoc(M.W, top + ph + 18, s, '一百个样本中一个异常点增大时 AE 与 RMS 的响应');
};

FIGURES['09-voice-noise-zcr'] = (M) => {
  const head = ['真实语音与噪声：', '过零率看的是翻转密度，不是重要程度'];
  const top = headerH(M, head); const srcs = [['语音 voice.wav', VOICE, BLUE], ['噪声 noise.wav', NOISE, WARM]]; const { slots, height } = layout(M, 2, { cols: 2, h: 240 });
  let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, src, color] = srcs[i];
    const clip = normalize(src.samples.subarray(0, Math.min(src.samples.length, SR * 5)));
    const f = frameFeatures(clip, 400, 160, 0.01);
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: color });
    s += R(q.x, y + 38, q.w, 78, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
    s += envelopePath(clip, q.x + 5, y + 44, q.w - 10, 66, { c: '#9eb0bd', opacity: 0.85 });
    s += T(q.x + 4, y + 136, '波形', { size: M.small, fill: MUTED });
    s += linePlot(q.x, y + 148, q.w, 64, f.zcr, { min: 0, max: 0.8, c: color });
    s += T(q.x + 4, y + 235, '过零率', { size: M.small, fill: color });
  });
  return svgDoc(M.W, top + height + 12, s, '真实语音和噪声的波形与过零率曲线');
};

FIGURES['09-joint-map'] = (M) => {
  const head = ['把 RMS 与 ZCR 放在一起，', '两类真实声音更容易分开'];
  const top = headerH(M, head);
  const vf = frameFeatures(normalize(VOICE.samples), 400, 320, 0.01);
  const nf = frameFeatures(normalize(NOISE.samples), 400, 320, 0.01);
  const vrMax = Math.max(...vf.rms, ...nf.rms); let s = header(M, head); const x = M.pad; const w = M.W - M.pad * 2; const ph = wide(M) ? 330 : 350;
  s += R(x, top, w, ph, { fill: '#fff', stroke: GRID, sw: 1, r: 6 });
  const px = x + 54; const py = top + 24; const pw = w - 82; const hh = ph - 78;
  s += L(px, py + hh, px + pw, py + hh, { c: INK, w: 1.2 }); s += L(px, py, px, py + hh, { c: INK, w: 1.2 });
  const draw = (f, c, limit = 170) => f.rms.slice(0, limit).map((r, i) => C(px + (r / vrMax) * pw, py + hh - Math.min(1, f.zcr[i] / 0.8) * hh, 2.5, { fill: c })).join('');
  s += draw(vf, BLUE) + draw(nf, WARM);
  s += T(px, top + ph - 16, '整体强弱 RMS →', { size: M.tick, fill: MUTED });
  s += T(px + 10, py + 18, '翻转密度 ZCR ↑', { size: M.tick, fill: MUTED });
  s += C(px + pw - 150, py + 18, 5, { fill: BLUE }) + T(px + pw - 138, py + 23, '语音帧', { size: M.small });
  s += C(px + pw - 70, py + 18, 5, { fill: WARM }) + T(px + pw - 58, py + 23, '噪声帧', { size: M.small });
  return svgDoc(M.W, top + ph + 18, s, '真实语音帧与噪声帧在 RMS 和 ZCR 平面中的分布');
};

FIGURES['10-components'] = (M) => {
  const head = ['复杂波形可以由', '几个简单振动叠加出来'];
  const top = headerH(M, head); const n = 260; const t = Array.from({ length: n }, (_, i) => i / (n - 1));
  const parts = [
    ['120 Hz', t.map((u) => Math.sin(2 * Math.PI * 3 * u)), BLUE],
    ['360 Hz', t.map((u) => 0.55 * Math.sin(2 * Math.PI * 9 * u)), WARM],
    ['720 Hz', t.map((u) => 0.25 * Math.sin(2 * Math.PI * 18 * u)), GREEN],
  ];
  const sum = t.map((_, i) => (parts[0][1][i] + parts[1][1][i] + parts[2][1][i]) / 1.8);
  let s = header(M, head);
  if (wide(M)) {
    s += T(M.pad, top + 22, '相加后的波形', { size: M.h2, weight: 700 });
    s += waveExact(M.pad, top + 38, 360, 180, sum, INK);
    parts.forEach((p, i) => { const y = top + 20 + i * 72; s += T(430, y + 18, p[0], { size: M.small, weight: 700, fill: p[2] }); s += waveExact(500, y, 350, 56, p[1], p[2]); });
    s += ARROW(770, top + 232, 410, top + 232, { c: MUTED });
    s += T(590, top + 254, '把三条简单波形相加', { size: M.body, fill: MUTED, anchor: 'middle' });
    return svgDoc(M.W, top + 280, s, '三个正弦波叠加成复杂波形');
  }
  s += T(M.pad, top + 22, '相加后的波形', { size: M.h2, weight: 700 });
  s += waveExact(M.pad, top + 38, M.W - M.pad * 2, 92, sum, INK);
  parts.forEach((p, i) => { const y = top + 160 + i * 102; s += T(M.pad, y, p[0], { size: M.small, weight: 700, fill: p[2] }); s += waveExact(M.pad, y + 14, M.W - M.pad * 2, 72, p[1], p[2]); });
  return svgDoc(M.W, top + 482, s, '三个正弦波叠加成复杂波形');
};

FIGURES['10-probe'] = (M) => {
  const head = ['拿不同频率逐个去试：', '同频探针相乘后更容易留下正面积'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 246 }); const n = 300;
  const signal = Array.from({ length: n }, (_, i) => Math.sin(2 * Math.PI * 6 * i / n));
  const cases = [['探针频率相同', 6, BLUE], ['探针频率不同', 9, WARM]]; let s = header(M, head);
  slots.forEach((q, i) => {
    const y = top + q.y; const [name, cycles, color] = cases[i]; const probe = Array.from({ length: n }, (_, k) => Math.sin(2 * Math.PI * cycles * k / n)); const product = signal.map((v, k) => v * probe[k]); const mean = product.reduce((a, b) => a + b, 0) / n;
    s += T(q.x, y + 22, name, { size: M.h2, weight: 700, fill: color });
    s += linePlot(q.x, y + 38, q.w, 74, signal, { min: -1, max: 1, c: '#9aaab6', zero: true });
    s += linePlot(q.x, y + 124, q.w, 74, product, { min: -1, max: 1, c: color, zero: true });
    s += T(q.x + 5, y + 118, '上：原信号　下：相乘结果', { size: M.small, fill: MUTED });
    s += T(q.x + 5, y + 226, `相乘后的平均 ≈ ${mean.toFixed(2)}`, { size: M.body, weight: 700, fill: color });
  });
  return svgDoc(M.W, top + height + 12, s, '信号与同频和不同频率探针相乘后的差别');
};

FIGURES['10-spectrum-reconstruct'] = (M) => {
  const head = ['把所有频率的匹配结果排开，', '得到频谱；按原关系相加可回到波形'];
  const top = headerH(M, head); const { slots, height } = layout(M, 2, { cols: 2, h: 238 }); const n = 320; const t = Array.from({ length: n }, (_, i) => i / (n - 1));
  const original = t.map((u) => (Math.sin(2 * Math.PI * 3 * u) + 0.55 * Math.sin(2 * Math.PI * 9 * u) + 0.25 * Math.sin(2 * Math.PI * 18 * u)) / 1.8);
  let s = header(M, head); const a = slots[0]; const ay = top + a.y;
  s += T(a.x, ay + 22, '频率搜索结果', { size: M.h2, weight: 700, fill: BLUE });
  s += R(a.x, ay + 38, a.w, 150, { fill: '#fff', stroke: GRID, sw: 1, r: 5 });
  const peaks = [[0.18, 1, BLUE, '120'], [0.52, 0.55, WARM, '360'], [0.82, 0.25, GREEN, '720']];
  peaks.forEach(([u, v, c, label]) => { const xx = a.x + 26 + u * (a.w - 52); const hh = v * 110; s += R(xx - 6, ay + 176 - hh, 12, hh, { fill: c, r: 2 }); s += T(xx, ay + 210, label, { size: M.small, fill: c, anchor: 'middle' }); });
  s += T(a.x + 8, ay + 230, '频率（Hz）', { size: M.tick, fill: MUTED });
  const b = slots[1]; const by = top + b.y;
  s += T(b.x, by + 22, '逆向相加后的波形', { size: M.h2, weight: 700, fill: GREEN });
  s += waveExact(b.x, by + 38, b.w, 150, original, INK);
  s += P(original.map((v, i) => [b.x + 6 + (i / (n - 1)) * (b.w - 12), by + 113 - v * 68]), { c: GREEN, w: 1.1 });
  s += T(b.x + 8, by + 214, '黑线：原波形　绿线：重构波形（重合）', { size: M.small, fill: MUTED });
  return svgDoc(M.W, top + height + 10, s, '三个频谱峰与按幅度和相位重构后的波形');
};

for (const M of Object.values(MODES)) {
  const out = join(BASE, M.name);
  mkdirSync(out, { recursive: true });
  for (const [name, build] of Object.entries(FIGURES)) writeFileSync(join(out, `${name}.svg`), build(M), 'utf8');
}

console.log(`生成 ${Object.keys(FIGURES).length} 张知识图 × 2 个版式 = ${Object.keys(FIGURES).length * 2} 个 SVG`);
console.log(`输出目录：${BASE}`);
