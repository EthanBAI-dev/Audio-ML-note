#!/usr/bin/env node
// 声谱图渲染方案对比原型。
//
//   node tools/proto-spectrogram.mjs
//
// 生成到 tmp/proto/，用于比较：
//   1) 手绘 SVG 色块（现状） vs 真实 STFT 栅格
//   2) 三种色标：单蓝色阶 / viridis / magma
//   3) 电脑版（880 px 横排） vs 手机版（420 px 竖排）

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, slice, stft, magnitudeSpectrum, synthHumAndKnock } from './lib/dsp.mjs';
import {
  PALETTE as C, LAYOUT, svgDoc, T, R, L, P, image, spectrogramPng, envelopePath, colorbar,
} from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tmp', 'proto');
mkdirSync(OUT, { recursive: true });

// ---------- 素材 ----------

const SR = 16000;

// A. 合成信号：正文里说的「持续嗡嗡声 + 一下敲击」
const synth = synthHumAndKnock(SR, 2.0, 1.25);

// B. 真实课程音频：钢琴单音（起音 + 谐波 + 衰减）
const pianoRaw = readWav(join(ROOT, 'source_course', 'audio_resources', 'piano_c.wav'));
const piano = { samples: resample(pianoRaw.samples, pianoRaw.sampleRate, SR), sampleRate: SR };

// ---------- 面板 ----------

function panelWave(x, y, w, h, samples, opt = {}) {
  const { tick = 12 } = opt;
  let s = R(x, y, w, h, { fill: C.surface, stroke: C.grid, r: 4 });
  s += L(x, y + h / 2, x + w, y + h / 2, { c: C.grid });
  s += envelopePath(samples, x + 1, y + 1, w - 2, h - 2, { c: C.s1, opacity: 0.9 });
  s += T(x, y + h + 16, '时间 →', { size: tick, fill: C.muted });
  return s;
}

function panelSpectrum(x, y, w, h, samples, sr, opt = {}) {
  const { tick = 12, fmax = 2000 } = opt;
  const mid = Math.max(0, Math.floor(samples.length * 0.35));
  const mag = magnitudeSpectrum(samples.subarray(mid, mid + 2048), 2048);
  const binHz = sr / 2048;
  const kMax = Math.floor(fmax / binHz);
  let peak = 0;
  for (let k = 1; k <= kMax; k += 1) peak = Math.max(peak, mag[k]);

  let s = R(x, y, w, h, { fill: C.surface, stroke: C.grid, r: 4 });
  for (let hz = 500; hz < fmax; hz += 500) {
    const px = x + (hz / fmax) * w;
    s += L(px, y, px, y + h, { c: C.grid });
    s += T(px, y + h + 16, `${hz}`, { size: tick, fill: C.muted, anchor: 'middle' });
  }
  const pts = [];
  for (let k = 1; k <= kMax; k += 1) {
    pts.push([x + (k / kMax) * w, y + h - (mag[k] / peak) * (h - 8) - 4]);
  }
  s += P(pts, { c: C.s1, w: 1.5 });
  s += T(x, y + h + 16, '低', { size: tick, fill: C.muted });
  s += T(x + w, y + h + 16, '高 Hz', { size: tick, fill: C.muted, anchor: 'end' });
  return s;
}

// 白底浅色阶要把底噪压到白；深色阶留更多动态范围，但也不能让底噪糊成一片
const FLOOR = { blue: -48, viridis: -55, magma: -55 };

async function panelSpectrogram(x, y, w, h, samples, sr, opt = {}) {
  const { tick = 12, cmap = 'blue', fmax = 2000, annotate = true } = opt;
  const S = stft(samples, sr, { nfft: 1024, hop: 128 });
  const href = await spectrogramPng(S, {
    w: Math.round(w * 2.2), h: Math.round(h * 2.2), fmax, dbFloor: FLOOR[cmap] ?? -55, cmap,
  });
  let s = image(href, x, y, w, h);
  s += R(x, y, w, h, { stroke: C.grid, r: 0 });
  s += T(x, y + h + 16, '时间 →', { size: tick, fill: C.muted });
  s += T(x - 6, y + 10, '高', { size: tick, fill: C.muted, anchor: 'end' });
  s += T(x - 6, y + h - 2, '低', { size: tick, fill: C.muted, anchor: 'end' });
  s += colorbar(x + w - 96, y + h + 8, 60, 8, cmap, { lo: '弱', hi: '强', size: tick - 0.5 });
  if (annotate) {
    const yLine = y + h * 0.735;
    s += L(x + w * 0.04, yLine, x + w * 0.38, yLine, { c: C.s2, w: 1.8, dash: '5 3' });
    s += T(x + w * 0.04, yLine - 8, '横线 = 一直都在的成分', { size: tick, fill: C.s2, weight: 700 });
    const xKnock = x + w * 0.625;
    s += L(xKnock, y + h * 0.06, xKnock, y + h * 0.52, { c: C.s2, w: 1.8, dash: '5 3' });
    s += T(xKnock - 8, y + h * 0.06 + 12, '竖线 = 只响了一下', { size: tick, fill: C.s2, weight: 700, anchor: 'end' });
  }
  return s;
}

// ---------- 组图 ----------

const PANELS = [
  ['波形', '什么时候在抖'],
  ['频谱', '有哪些高低成分'],
  ['声谱图', '哪些成分在什么时候出现'],
];

async function threeViews({ layout = 'desktop', cmap = 'blue', src = synth, title, annotate = true }) {
  const K = LAYOUT[layout];
  const pad = K.pad;
  const { samples, sampleRate } = src;

  if (layout === 'desktop') {
    const W = K.W;
    const gap = 26;
    const pw = Math.floor((W - pad * 2 - gap * 2 - 26) / 3);
    const ph = 152;
    const y0 = 116;
    let s = T(pad, 32, title, { size: K.title, weight: 700 });
    s += T(pad, 55, '同一段声音，换一种摆法，能看见的东西完全不同', { size: K.label, fill: C.ink2 });
    const xs = [0, 1, 2].map((i) => pad + 26 + i * (pw + gap));
    const head = (i, x) => T(x, y0 - 32, PANELS[i][0], { size: K.label + 1, weight: 700, fill: C.s1 })
      + T(x, y0 - 13, PANELS[i][1], { size: K.label, fill: C.ink2 });
    s += head(0, xs[0]) + panelWave(xs[0], y0, pw, ph, samples, { tick: K.tick });
    s += head(1, xs[1]) + panelSpectrum(xs[1], y0, pw, ph, samples, sampleRate, { tick: K.tick });
    s += head(2, xs[2]);
    s += await panelSpectrogram(xs[2], y0, pw, ph, samples, sampleRate, { tick: K.tick, cmap, annotate });
    return svgDoc(W, y0 + ph + 44, s, title);
  }

  const W = K.W;
  const pw = W - pad * 2 - 22;
  const ph = 132;
  let s = T(pad, 30, title, { size: K.title, weight: 700 });
  let y = 66;
  const bodies = [
    (yy) => panelWave(pad + 22, yy, pw, ph, samples, { tick: K.tick }),
    (yy) => panelSpectrum(pad + 22, yy, pw, ph, samples, sampleRate, { tick: K.tick }),
    (yy) => panelSpectrogram(pad + 22, yy, pw, ph, samples, sampleRate, { tick: K.tick, cmap, annotate }),
  ];
  for (let i = 0; i < 3; i += 1) {
    s += T(pad, y, PANELS[i][0], { size: K.label + 1, weight: 700, fill: C.s1 });
    s += T(pad, y + 19, PANELS[i][1], { size: K.label, fill: C.ink2 });
    // eslint-disable-next-line no-await-in-loop
    s += await bodies[i](y + 32);
    y += ph + 92;
  }
  return svgDoc(W, y - 44, s, title);
}

// 现状对照：手绘色块版声谱图
function fakeSpectrogram() {
  const W = 420; const pad = 18;
  const x = pad + 22; const y = 60; const w = W - pad * 2 - 22; const h = 132;
  let s = T(pad, 30, '现在的画法：手绘色块', { size: 16, weight: 700 });
  s += R(x, y, w, h, { fill: C.surface, stroke: C.grid, r: 5 });
  [0.72, 0.52, 0.34].forEach((v, i) => {
    s += R(x + 4, y + h * (1 - v), w - 8, 7, { fill: `rgba(42,120,214,${0.78 - i * 0.2})`, r: 2 });
  });
  s += R(x + w * 0.62, y + 4, 8, h - 8, { fill: 'rgba(235,104,52,.82)', r: 2 });
  s += T(x, y + h + 16, '时间 →', { size: 11.5, fill: C.muted });
  s += T(x - 6, y + 10, '高', { size: 11.5, fill: C.muted, anchor: 'end' });
  s += T(x - 6, y + h - 2, '低', { size: 11.5, fill: C.muted, anchor: 'end' });
  s += T(pad, y + h + 44, '三根蓝条 + 一根橙条，其实是条形图，', { size: 13, fill: C.s2 });
  s += T(pad, y + h + 64, '读者看完还是不知道声谱图长什么样。', { size: 13, fill: C.s2 });
  return svgDoc(W, y + h + 86, s, '手绘色块版声谱图');
}

// ---------- 输出 ----------

const jobs = [];
const add = (name, p) => jobs.push(p.then((svg) => { writeFileSync(join(OUT, name), svg, 'utf8'); return name; }));

add('A-现状-手绘色块.svg', Promise.resolve(fakeSpectrogram()));

const CMAPS = [
  ['magma', 'magma（librosa 画声谱图的常用色标）'],
  ['viridis', 'viridis（matplotlib 默认色标）'],
  ['blue', '单蓝色阶（与正文配色一致）'],
];

for (const [cmap, label] of CMAPS) {
  add(`B-电脑版-${cmap}.svg`, threeViews({
    layout: 'desktop', cmap, src: synth, title: `电脑版 · ${label}`,
  }));
  add(`C-手机版-${cmap}.svg`, threeViews({
    layout: 'mobile', cmap, src: synth, title: `手机版 · ${label}`,
  }));
  add(`D-真实录音钢琴-电脑版-${cmap}.svg`, threeViews({
    layout: 'desktop', cmap, src: piano, title: `课程音频 piano_c.wav · ${label}`, annotate: false,
  }));
}

const names = await Promise.all(jobs);
console.log(`生成 ${names.length} 个原型到 tmp/proto/`);
names.forEach((n) => console.log('  ' + n));
