#!/usr/bin/env node
// 第 06～10 课的小红书卡片版配图。
//
//   node tools/build-cards-06-10.mjs
//
// 输出 音频信号处理二十三讲/第06-10课/figures/card/
//
// 卡片版和网页版（desktop 880 / mobile 420）的差别只有一条，但影响一切：
// 卡片在手机上整体缩到 0.361，图内字号必须 ≥ 32 才等于正文 36px 的量级。
// 一行只放得下约 24 个字，是桌面版的一半，所以多面板的图按「一卡一个要点」
// 拆开，文案重写得更短。20 张原图在这里变成 22 张卡。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, fft } from './lib/dsp.mjs';
import {
  CARD, C, cardDoc, T, MT, R, L, O, P, PATH, ARROW,
  head, rows, cols, plate, white, axisX, axisY, curve, wave,
} from './lib/card.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '音频信号处理二十三讲/', '第06-10课', 'figures', 'card');
mkdirSync(OUT, { recursive: true });

const SR = 16000;

// ---------- 素材 ----------

function load(name, start = 0, dur = null) {
  const w = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const all = resample(w.samples, w.sampleRate, SR);
  const a = Math.floor(start * SR);
  const b = dur == null ? all.length : Math.min(all.length, Math.floor((start + dur) * SR));
  return all.subarray(a, b);
}

function normalize(x) {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  return Float64Array.from(x, (v) => v / Math.max(peak, 1e-9));
}

const VOICE = normalize(load('voice.wav', 0.4, 6));
const VOICE4 = normalize(load('voice.wav', 2.2, 4));
const NOISE = normalize(load('noise.wav', 1, 4));
const DEBUSSY = normalize(load('debussy.wav', 6, 6));
const REDHOT = normalize(load('redhot.wav', 6, 6));
const DUKE = normalize(load('duke.wav', 6, 6));

// ---------- 计算 ----------

function frameFeatures(x, frameLength = 400, hop = 160, threshold = 1e-4) {
  const ae = []; const rms = []; const zcr = [];
  for (let start = 0; start + frameLength <= x.length; start += hop) {
    let peak = 0; let sum = 0; let flips = 0; let prev = 0;
    for (let i = 0; i < frameLength; i += 1) {
      const v = x[start + i];
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
      const sign = Math.abs(v) < threshold ? 0 : (v > 0 ? 1 : -1);
      if (i && sign && prev && sign !== prev) flips += 1;
      if (sign) prev = sign;
    }
    ae.push(peak); rms.push(Math.sqrt(sum / frameLength)); zcr.push(flips / (frameLength - 1));
  }
  return { ae, rms, zcr };
}

function fftMag(samples, nfft = 1024, hann = false) {
  const re = new Float64Array(nfft); const im = new Float64Array(nfft);
  const n = Math.min(samples.length, nfft);
  for (let i = 0; i < n; i += 1) {
    const w = hann ? 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)) : 1;
    re[i] = samples[i] * w;
  }
  fft(re, im);
  const mag = [];
  for (let k = 0; k <= nfft / 2; k += 1) mag.push(Math.hypot(re[k], im[k]));
  return mag;
}

// ---------- 画板 ----------

/** 逐点画一段波形，适合样本数少的短片段。 */
function waveExact(x, y, w, h, values, o = {}) {
  const { c = C.blue, sw = 3, frame = true } = o;
  let s = frame ? white(x, y, w, h) + L(x + 8, y + h / 2, x + w - 8, y + h / 2, { c: C.grid }) : '';
  const pts = Array.from(values, (v, i) => [
    x + 8 + (i / (values.length - 1)) * (w - 16),
    y + h / 2 - v * (h / 2 - 8),
  ]);
  return s + P(pts, { c, w: sw });
}

/** 一条曲线，纵轴自动缩放。 */
function linePlot(x, y, w, h, values, o = {}) {
  const min = o.min ?? Math.min(...values);
  const max = o.max ?? Math.max(...values);
  const span = Math.max(1e-12, max - min);
  let s = o.frame === false ? '' : white(x, y, w, h);
  if (o.zero && min <= 0 && max >= 0) {
    const zy = y + h - ((0 - min) / span) * h;
    s += L(x + 8, zy, x + w - 8, zy, { c: C.grid });
  }
  const pts = Array.from(values, (v, i) => [
    x + 8 + (i / Math.max(1, values.length - 1)) * (w - 16),
    y + 8 + (1 - (v - min) / span) * (h - 16),
  ]);
  return s + P(pts, { c: o.c ?? C.blue, w: o.w ?? 3 });
}

/** 卡片底部的一句结论。所有卡片都用同一种收尾方式。 */
const takeaway = (y, text, color = C.warm) =>
  T(CARD.pad, y, text, { size: CARD.body, weight: 700, fill: color });

const CARDS = {};

// 06 ------------------------------------------------------------------

CARDS['06-pipeline'] = () => {
  const h0 = head(['录音变成数字', '要走的四步']);
  let s = h0.svg;
  const items = [
    ['连续录音', '一长串数字，还看不出结构'],
    ['切成短帧', '每段短到可以当作没怎么变'],
    ['每帧算一个数', '一段声音换成一个可比较的量'],
    ['保留或汇总', '留顺序看变化，汇总看整体'],
  ];
  const rs = rows(4, h0.h, 112, 16);
  items.forEach(([t, d], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 3 ? C.pale : C.plate);
    s += O(r.x + 46, r.y + r.h / 2, 26, { fill: C.blue });
    s += T(r.x + 46, r.y + r.h / 2 + 12, String(i + 1),
      { size: CARD.small, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(r.x + 92, r.y + 46, t, { size: CARD.h2, weight: 700 });
    s += T(r.x + 92, r.y + 90, d, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 4 * 112 + 3 * 16 + 56;
  s += takeaway(by, '切多长、怎么汇总，决定程序看得见什么。');
  return cardDoc(by + 40, s, '录音经过切段、逐帧计算和汇总的四个步骤');
};

CARDS['06-frame-hop'] = () => {
  const h0 = head(['帧长决定看多宽，', '帧移决定隔多久看一次']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const py = h0.h + 54; const ph = 210;
  s += white(px, py, pw, ph);
  s += wave(VOICE4.subarray(0, 24000), px + 10, py + 10, pw - 20, ph - 20);

  // 三个重叠的帧框：宽度是帧长，起点间隔是帧移
  const fw = 260; const step = 150;
  for (let i = 0; i < 3; i += 1) {
    const fx = px + 40 + i * step;
    s += R(fx, py - 12, fw, ph + 24, { fill: 'none', stroke: C.warm, sw: 3, r: 8 });
    s += T(fx + fw / 2, py - 26, `第 ${i + 1} 帧`,
      { size: CARD.small, weight: 700, fill: C.warm, anchor: 'middle' });
  }
  const ay = py + ph + 58;
  s += ARROW(px + 40, ay, px + 40 + step, ay, { c: C.green, w: 3 });
  s += T(px + 40 + step + 18, ay + 12, '帧移', { size: CARD.small, weight: 700, fill: C.green });
  s += ARROW(px + 40, ay + 64, px + 40 + fw, ay + 64, { c: C.warm, w: 3 });
  s += T(px + 40 + fw + 18, ay + 76, '帧长', { size: CARD.small, weight: 700, fill: C.warm });
  const by = ay + 132;
  s += takeaway(by, '帧移比帧长小，所以相邻的帧互相重叠。');
  return cardDoc(by + 40, s, '帧长、帧移与重叠帧的关系');
};

CARDS['06-windowing-shape'] = () => {
  const h0 = head(['加窗：把两端按下去']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 400;
  const raw = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 11 * i) / n));
  const hann = raw.map((v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));

  const ph = 190;
  let y = h0.h + 12;
  s += T(px, y, '直接截下来', { size: CARD.h2, weight: 700, fill: C.warm });
  s += waveExact(px, y + 22, pw, ph, raw, { c: C.warm });
  s += T(px + 16, y + 22 + ph + 40, '两端是断的，等于凭空多了一次跳变',
    { size: CARD.small, fill: C.muted });

  y += 22 + ph + 92;
  s += T(px, y, '加 Hann 窗之后', { size: CARD.h2, weight: 700, fill: C.blue });
  s += waveExact(px, y + 22, pw, ph, hann, { c: C.blue });
  s += PATH(`M${px + 8} ${y + 22 + ph / 2} Q${px + pw / 2} ${y + 30} ${px + pw - 8} ${y + 22 + ph / 2}`,
    { c: C.green, w: 3, dash: '10 8' });
  s += T(px + 16, y + 22 + ph + 40, '绿色虚线是窗的形状，两端压到 0',
    { size: CARD.small, fill: C.muted });

  const by = y + 22 + ph + 96;
  s += takeaway(by, '不是为了好看，是为了不让截断处骗人。');
  return cardDoc(by + 40, s, '直接截断与加 Hann 窗后的波形对比');
};

CARDS['06-windowing-leak'] = () => {
  const h0 = head(['加窗以后，', '假的频率成分少了']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 1024;
  const seg = Float64Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 60.5 * i) / n));
  const rawMag = fftMag(seg, n, false);
  const winMag = fftMag(seg, n, true);
  const db = (m) => {
    const peak = Math.max(...m.slice(1, 200));
    return m.slice(1, 200).map((v) => Math.max(-70, 20 * Math.log10(v / peak + 1e-12)));
  };
  const a = db(rawMag); const b = db(winMag);

  const py = h0.h + 20; const ph = 300;
  s += white(px, py, pw, ph);
  s += linePlot(px, py, pw, ph, a, { c: C.warm, min: -70, max: 0, frame: false });
  s += linePlot(px, py, pw, ph, b, { c: C.blue, min: -70, max: 0, frame: false });
  s += axisY(px, py, ph, [[-70, '-70'], [-35, '-35'], [0, '0']], -70, 0);
  s += T(px + pw, py + ph + 46, '频率 →', { size: CARD.tick, fill: C.muted, anchor: 'end' });

  const ly = py + ph + 108;
  s += L(px, ly - 10, px + 54, ly - 10, { c: C.warm, w: 5 });
  s += T(px + 68, ly, '不加窗：远处还有一片起伏', { size: CARD.small });
  s += L(px, ly + 46, px + 54, ly + 46, { c: C.blue, w: 5 });
  s += T(px + 68, ly + 56, '加窗后：远处塌下去了', { size: CARD.small });

  const by = ly + 118;
  s += takeaway(by, '那片起伏是截断造出来的，声音里本来没有。');
  return cardDoc(by + 40, s, '加窗前后频率泄漏的对比，纵轴为分贝');
};

CARDS['06-sequence-summary'] = () => {
  const h0 = head(['算完之后，', '留顺序还是留统计']);
  let s = h0.svg;
  const { rms } = frameFeatures(VOICE4, 400, 160);
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;

  const py = h0.h + 6; const ph = 180;
  s += linePlot(px, py, pw, ph, rms, { c: C.blue });
  s += T(px + 16, py + ph + 44, '每个点是一帧的强弱', { size: CARD.small, fill: C.muted });

  const cy = py + ph + 82;
  const cs = cols(2, cy, 280);
  s += plate(cs[0].x, cs[0].y, cs[0].w, cs[0].h, C.pale);
  s += T(cs[0].x + 22, cs[0].y + 52, '留顺序', { size: CARD.h2, weight: 700, fill: C.blue });
  s += linePlot(cs[0].x + 18, cs[0].y + 76, cs[0].w - 36, 130, rms, { c: C.blue, w: 2.6 });
  s += T(cs[0].x + 22, cs[0].y + 250, '看得出什么时候变', { size: CARD.small, fill: C.muted });

  s += plate(cs[1].x, cs[1].y, cs[1].w, cs[1].h);
  s += T(cs[1].x + 22, cs[1].y + 52, '只留统计', { size: CARD.h2, weight: 700, fill: C.warm });
  const mean = rms.reduce((p, v) => p + v, 0) / rms.length;
  const sd = Math.sqrt(rms.reduce((p, v) => p + (v - mean) ** 2, 0) / rms.length);
  s += white(cs[1].x + 18, cs[1].y + 76, cs[1].w - 36, 130);
  s += T(cs[1].x + 40, cs[1].y + 126, `均值 ${mean.toFixed(2)}`, { size: CARD.small, weight: 700 });
  s += T(cs[1].x + 40, cs[1].y + 176, `波动 ${sd.toFixed(2)}`, { size: CARD.small, weight: 700 });
  s += T(cs[1].x + 22, cs[1].y + 250, '长度固定，但事件没了', { size: CARD.small, fill: C.muted });

  const by = cy + 280 + 56;
  s += takeaway(by, '任务要判断“什么时候”，就不能只留统计。');
  return cardDoc(by + 40, s, '保留逐帧序列与汇总成统计量的区别');
};

// 07 ------------------------------------------------------------------

CARDS['07-three-features'] = () => {
  const h0 = head(['三条曲线各看一件事']);
  let s = h0.svg;
  const { ae, rms, zcr } = frameFeatures(VOICE4, 400, 160);
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const sets = [
    ['振幅包络', '每小段的最高峰', ae, C.blue],
    ['RMS', '每小段的整体强弱', rms, C.warm],
    ['过零率', '上下翻转有多密', zcr, C.green],
  ];
  let y = h0.h;
  const ph = 140;
  sets.forEach(([name, desc, vals, c]) => {
    s += T(px, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
    s += T(px + 190, y + 30, desc, { size: CARD.small, fill: C.muted });
    s += linePlot(px, y + 48, pw, ph, vals, { c });
    y += 48 + ph + 34;
  });
  s += T(px, y + 20, '时间 →', { size: CARD.tick, fill: C.muted });
  const by = y + 78;
  s += takeaway(by, '三条都不用拆频率，都只看波形怎么变。');
  return cardDoc(by + 40, s, '同一段真实语音的振幅包络、RMS 与过零率');
};

CARDS['07-ae-rms'] = () => {
  const h0 = head(['最高峰会被一下尖峰骗到，', 'RMS 不会']);
  let s = h0.svg;
  const n = 300;
  const spike = Array.from({ length: n }, (_, i) => (i === 150 ? 1 : 0.02 * Math.sin(i)));
  const steady = Array.from({ length: n }, (_, i) => 0.55 * Math.sin((2 * Math.PI * 9 * i) / n));
  const cs = cols(2, h0.h, 430);
  const cases = [
    ['只有一下尖峰', spike, 'AE 1.00', 'RMS 0.10', C.warm],
    ['一直在振动', steady, 'AE 0.55', 'RMS 0.39', C.blue],
  ];
  cases.forEach(([name, vals, aeTxt, rmsTxt, c], i) => {
    const q = cs[i];
    s += plate(q.x, q.y, q.w, q.h);
    s += T(q.x + 22, q.y + 52, name, { size: CARD.h2, weight: 700, fill: c });
    s += waveExact(q.x + 18, q.y + 76, q.w - 36, 200, vals, { c });
    s += T(q.x + 22, q.y + 330, aeTxt, { size: CARD.small, weight: 700, fill: C.muted });
    s += T(q.x + 22, q.y + 386, rmsTxt, { size: CARD.small, weight: 700, fill: c });
  });
  const by = h0.h + 430 + 60;
  s += takeaway(by, 'RMS 问的是“一共振动了多少”，不是“最高到过多少”。');
  return cardDoc(by + 40, s, '孤立尖峰与持续振动的 AE、RMS 对比');
};

CARDS['07-zero-crossings'] = () => {
  const h0 = head(['过零率数的是', '波形穿过中线的次数']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 400;
  const slow = Array.from({ length: n }, (_, i) => 0.8 * Math.sin((2 * Math.PI * 3 * i) / n));
  const fast = Array.from({ length: n }, (_, i) => 0.8 * Math.sin((2 * Math.PI * 16 * i) / n));
  const rough = Array.from(NOISE.subarray(0, n), (v) => v * 0.9);
  const sets = [['慢的振动', slow, '交点少', C.blue],
    ['快的振动', fast, '交点多而规律', C.warm],
    ['没有规律的声音', rough, '交点多但不规则', C.green]];
  let y = h0.h;
  const ph = 130;
  sets.forEach(([name, vals, note, c]) => {
    s += T(px, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
    s += T(px + 330, y + 30, note, { size: CARD.small, fill: C.muted });
    s += waveExact(px, y + 48, pw, ph, vals, { c });
    // 标出穿过中线的位置
    const midY = y + 48 + ph / 2;
    for (let i = 1; i < n; i += 1) {
      if ((vals[i - 1] < 0) !== (vals[i] < 0)) {
        s += O(px + 8 + (i / (n - 1)) * (pw - 16), midY, 6, { fill: C.gold });
      }
    }
    y += 48 + ph + 32;
  });
  const by = y + 46;
  s += takeaway(by, '金色点就是过零点，数它们有多密就够了。');
  return cardDoc(by + 40, s, '慢速振动、快速振动与噪声的过零点分布');
};

CARDS['07-evidence-matrix'] = () => {
  const h0 = head(['三种特征，', '各自能回答哪种问题']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const cw = 150;
  const namesX = [px + pw - cw * 3 + 10, px + pw - cw * 2 + 10, px + pw - cw + 10];
  ['包络', 'RMS', '过零率'].forEach((n, i) => {
    s += T(namesX[i] + 50, h0.h - 12, n,
      { size: CARD.small, weight: 700, fill: [C.blue, C.warm, C.green][i], anchor: 'middle' });
  });
  const tasks = [
    ['声音什么时候开始', [1, 1, 0]],
    ['整体有多响', [0, 1, 0]],
    ['是语音还是噪声', [0, 0, 1]],
    ['是不是同一件乐器', [0, 0, 0]],
  ];
  const rs = rows(4, h0.h + 8, 104, 14);
  tasks.forEach(([q, marks], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h);
    s += T(r.x + 22, r.y + 64, q, { size: CARD.small, weight: 700 });
    marks.forEach((ok, k) => {
      s += T(namesX[k] + 50, r.y + 68, ok ? '✓' : '—',
        { size: CARD.h2, weight: 700, fill: ok ? C.green : '#b6c0ca', anchor: 'middle' });
    });
  });
  const by = h0.h + 8 + 4 * 104 + 3 * 14 + 62;
  s += takeaway(by, '最后一行三个都答不了，所以下一步要拆频率。');
  return cardDoc(by + 40, s, '振幅包络、RMS 与过零率对四类任务的能力对照');
};

// 08 ------------------------------------------------------------------

CARDS['08-envelope-steps'] = () => {
  const h0 = head(['振幅包络：', '每帧只留最远的那个点']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const seg = VOICE4.subarray(0, 16000);
  const py = h0.h + 8; const ph = 200;
  s += white(px, py, pw, ph);
  s += wave(seg, px + 10, py + 10, pw - 20, ph - 20);
  const nf = 10;
  for (let i = 0; i < nf; i += 1) {
    const fx = px + 10 + (i / nf) * (pw - 20);
    s += R(fx, py + 6, (pw - 20) / nf - 4, ph - 12, { fill: 'none', stroke: C.warm, sw: 2, r: 5 });
  }
  s += T(px + 16, py + ph + 44, '先切成互相挨着的短帧', { size: CARD.small, fill: C.muted });

  const qy = py + ph + 82; const qh = 200;
  s += white(px, qy, pw, qh);
  const peaks = [];
  const fl = Math.floor(seg.length / nf);
  for (let i = 0; i < nf; i += 1) {
    let p = 0;
    for (let k = i * fl; k < (i + 1) * fl; k += 1) p = Math.max(p, Math.abs(seg[k]));
    peaks.push(p);
  }
  const pts = peaks.map((v, i) => [px + 10 + ((i + 0.5) / nf) * (pw - 20), qy + qh - 14 - v * (qh - 34)]);
  s += P(pts, { c: C.blue, w: 3.5 });
  pts.forEach(([a, b]) => { s += O(a, b, 8, { fill: C.blue }); });
  s += T(px + 16, qy + qh + 44, '每帧留一个点，再连起来', { size: CARD.small, fill: C.muted });

  const by = qy + qh + 100;
  s += takeaway(by, '帧数决定这条线有多少个点，也决定它有多细。');
  return cardDoc(by + 40, s, '振幅包络从分帧到逐帧最大绝对值的过程');
};

CARDS['08-absolute-value'] = () => {
  const h0 = head(['比大小之前，', '要先忘掉正负']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const nums = [0.3, -0.9, 0.5, -0.2];

  const box = (y, label, vals, pick, color, note) => {
    let t = plate(px, y, pw, 210, C.plate);
    t += T(px + 24, y + 52, label, { size: CARD.h2, weight: 700, fill: color });
    const bw = 168;
    vals.forEach((v, i) => {
      const bx = px + 24 + i * (bw + 16);
      const on = i === pick;
      t += R(bx, y + 76, bw, 76, { fill: on ? `${color}1a` : '#fff', stroke: on ? color : C.grid, sw: on ? 3 : 1, r: 10 });
      t += T(bx + bw / 2, y + 126, v, { size: CARD.small, weight: on ? 700 : 400, fill: on ? color : C.ink, anchor: 'middle' });
    });
    t += T(px + 24, y + 186, note, { size: CARD.small, fill: C.muted });
    return t;
  };

  let y = h0.h;
  s += box(y, '直接比数值', nums.map((v) => v.toFixed(1)), 2, C.warm, '选出 0.5，漏掉了 -0.9');
  y += 210 + 28;
  s += box(y, '先取到零线的距离', nums.map((v) => Math.abs(v).toFixed(1)), 1, C.green, '选出 0.9，才是真正的峰');
  const by = y + 210 + 60;
  s += takeaway(by, '振幅问的是离零线多远，方向不算数。');
  return cardDoc(by + 40, s, '直接取最大值会漏掉负方向大峰的示例');
};

CARDS['08-frame-size'] = () => {
  const h0 = head(['帧越长，', '包络越平滑也越粗糙']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  let y = h0.h;
  const ph = 130;
  [[256, C.blue, '短帧：细节都在，也更抖'],
    [1024, C.warm, '常用的折中'],
    [4096, C.green, '长帧：平滑，但短促的事件被抹掉']].forEach(([fl, c, note]) => {
    const { ae } = frameFeatures(DEBUSSY, fl, Math.floor(fl / 2));
    s += T(px, y + 30, `帧长 ${fl}`, { size: CARD.h2, weight: 700, fill: c });
    s += T(px + 250, y + 30, note, { size: CARD.small, fill: C.muted });
    s += linePlot(px, y + 48, pw, ph, ae, { c, min: 0, max: 1 });
    y += 48 + ph + 32;
  });
  const by = y + 46;
  s += takeaway(by, '没有最好的帧长，只有配得上任务的帧长。');
  return cardDoc(by + 40, s, '256、1024、4096 三种帧长算出的振幅包络');
};

CARDS['08-tail-policy'] = () => {
  const h0 = head(['最后不够一帧，', '三种处理办法']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const items = [
    ['丢掉尾巴', '实现最简单，但录音末尾没有结果', C.warm, 'drop'],
    ['留一个短帧', '有结果，但这一帧和别的不可比', C.gold, 'keep'],
    ['补零到同样长', '长度一致，代价是末尾被压低', C.green, 'pad'],
  ];
  let y = h0.h;
  const rh = 176;
  items.forEach(([name, note, c, kind]) => {
    s += plate(px, y, pw, rh);
    s += T(px + 24, y + 52, name, { size: CARD.h2, weight: 700, fill: c });
    s += T(px + 24, y + 98, note, { size: CARD.small, fill: C.muted });
    // 右侧示意：三个整帧 + 尾巴
    const gx = px + pw - 340; const gy = y + 118; const bw = 74;
    for (let i = 0; i < 3; i += 1) {
      s += R(gx + i * (bw + 8), gy, bw, 36, { fill: C.pale, stroke: C.blue, sw: 2, r: 5 });
    }
    const tx = gx + 3 * (bw + 8);
    if (kind === 'drop') {
      s += R(tx, gy, 40, 36, { fill: '#fff', stroke: '#c8d2da', sw: 2, r: 5 });
      s += L(tx + 8, gy + 8, tx + 32, gy + 28, { c: C.warm, w: 3.5 });
      s += L(tx + 32, gy + 8, tx + 8, gy + 28, { c: C.warm, w: 3.5 });
    } else if (kind === 'keep') {
      s += R(tx, gy, 40, 36, { fill: '#fdf3df', stroke: C.gold, sw: 2.5, r: 5 });
    } else {
      s += R(tx, gy, 40, 36, { fill: '#fff', stroke: C.green, sw: 2.5, r: 5 });
      s += R(tx + 40, gy, 34, 36, { fill: '#eef7f2', stroke: C.green, sw: 2.5, r: 5 });
      s += T(tx + 57, gy + 26, '0', { size: CARD.tick, weight: 700, fill: C.green, anchor: 'middle' });
    }
    y += rh + 18;
  });
  const by = y + 44;
  s += takeaway(by, '选哪种都行，但必须写下来，不然别人复现不了。');
  return cardDoc(by + 40, s, '丢弃尾帧、保留短尾帧与补零三种结尾规则');
};

CARDS['08-three-recordings'] = () => {
  const h0 = head(['三段真实音乐的', '强弱轮廓']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  let y = h0.h;
  const ph = 130;
  [['德彪西 · 钢琴', DEBUSSY, C.blue],
    ['摇滚 · 乐队', REDHOT, C.warm],
    ['爵士 · 铜管', DUKE, C.green]].forEach(([name, src, c]) => {
    const { ae } = frameFeatures(src, 1024, 512);
    s += T(px, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
    s += linePlot(px, y + 48, pw, ph, ae, { c, min: 0, max: 1 });
    y += 48 + ph + 32;
  });
  const by = y + 46;
  s += takeaway(by, '各自除以了自己的峰值，只能比形状，不能比谁更响。', C.muted);
  return cardDoc(by + 40, s, '三段真实音乐各自归一化后的振幅包络');
};

// 09 ------------------------------------------------------------------

CARDS['09-rms-steps'] = () => {
  const h0 = head(['RMS 的四步', '（一帧四个数）']);
  let s = h0.svg;
  const nums = [0.6, -0.8, 0.4, -1.0];
  const sq = nums.map((v) => v * v);
  const mean = sq.reduce((p, v) => p + v, 0) / sq.length;
  const steps = [
    ['原始数字', nums.map((v) => v.toFixed(1)).join('　'), '有正有负，直接相加会抵消'],
    ['各自平方', sq.map((v) => v.toFixed(2)).join('　'), '负号消失，大的更突出'],
    ['求平均', mean.toFixed(2), '得到平均的“能量”'],
    ['再开平方', Math.sqrt(mean).toFixed(2), '回到和振幅相近的量级'],
  ];
  const rs = rows(4, h0.h, 116, 14);
  steps.forEach(([name, val, note], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 3 ? C.pale : C.plate);
    s += O(r.x + 44, r.y + 44, 24, { fill: i === 3 ? C.warm : C.blue });
    s += T(r.x + 44, r.y + 55, String(i + 1),
      { size: CARD.tick, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(r.x + 84, r.y + 54, name, { size: CARD.h2, weight: 700 });
    s += T(r.x + r.w - 24, r.y + 54, val,
      { size: CARD.h2, weight: 700, fill: i === 3 ? C.warm : C.blue, anchor: 'end' });
    s += T(r.x + 84, r.y + 96, note, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 4 * 116 + 3 * 14 + 58;
  s += takeaway(by, '平方是为了不抵消，开方是为了量级能对得上。');
  return cardDoc(by + 40, s, 'RMS 从原始数字到平方、平均再开方的四步');
};

CARDS['09-outlier'] = () => {
  const h0 = head(['一个孤立大值', '能把两条曲线拉开多少']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const py = h0.h + 16; const ph = 300;
  s += white(px, py, pw, ph);
  const n = 60;
  const aeV = []; const rmsV = [];
  for (let i = 0; i <= n; i += 1) {
    const v = i / n;
    aeV.push(v);
    rmsV.push(Math.sqrt((v * v) / 100));   // 一帧 100 个样本，其余为 0
  }
  s += linePlot(px, py, pw, ph, aeV, { c: C.blue, min: 0, max: 1, frame: false });
  s += linePlot(px, py, pw, ph, rmsV, { c: C.warm, min: 0, max: 1, frame: false });
  s += axisY(px, py, ph, [[0, '0'], [0.5, '0.5'], [1, '1']], 0, 1);
  s += T(px + pw, py + ph + 46, '孤立样本的幅度 →', { size: CARD.tick, fill: C.muted, anchor: 'end' });

  const ly = py + ph + 110;
  s += L(px, ly - 10, px + 54, ly - 10, { c: C.blue, w: 5 });
  s += T(px + 68, ly, '包络：跟着峰值一起冲上去', { size: CARD.small });
  s += L(px, ly + 46, px + 54, ly + 46, { c: C.warm, w: 5 });
  s += T(px + 68, ly + 56, 'RMS：只慢慢抬起来', { size: CARD.small });
  const by = ly + 118;
  s += takeaway(by, '“除以 10”是因为这一帧刚好有 100 个样本。', C.muted);
  return cardDoc(by + 40, s, '孤立尖峰增大时振幅包络与 RMS 的不同响应');
};

CARDS['09-voice-noise-zcr'] = () => {
  const h0 = head(['语音和噪声，', '过零率长得不一样']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 452);
  [['人声', VOICE4, C.blue], ['噪声', NOISE, C.warm]].forEach(([name, src, c], i) => {
    const q = cs[i];
    const { zcr } = frameFeatures(src, 400, 160);
    s += plate(q.x, q.y, q.w, q.h);
    s += T(q.x + 22, q.y + 52, name, { size: CARD.h2, weight: 700, fill: c });
    s += white(q.x + 18, q.y + 76, q.w - 36, 150);
    s += wave(src, q.x + 26, q.y + 84, q.w - 52, 134, { c });
    s += T(q.x + 22, q.y + 266, '过零率', { size: CARD.small, weight: 700, fill: C.muted });
    s += linePlot(q.x + 18, q.y + 284, q.w - 36, 130, zcr, { c, min: 0, max: 0.6 });
  });
  const by = h0.h + 452 + 60;
  s += takeaway(by, '语音随发音起落，噪声一直密集翻转。');
  return cardDoc(by + 40, s, '真实语音与噪声的波形及过零率曲线');
};

CARDS['09-joint-map'] = () => {
  const h0 = head(['两条证据一起看，', '才分得开']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const py = h0.h + 58; const ph = 360;   // 留出纵轴标签的位置，别压到标题上
  s += white(px, py, pw, ph);
  const draw = (src, c) => {
    const { rms, zcr } = frameFeatures(src, 400, 160);
    let t = '';
    for (let i = 0; i < rms.length; i += 2) {
      const x = px + 20 + Math.min(1, rms[i] / 0.45) * (pw - 40);
      const y = py + ph - 20 - Math.min(1, zcr[i] / 0.6) * (ph - 40);
      t += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${c}" opacity="0.5"/>`;
    }
    return t;
  };
  s += draw(VOICE4, C.blue);
  s += draw(NOISE, C.warm);
  s += axisX(px + 20, py + ph, pw - 40, [[0, '0'], [0.45, '0.45']], 0, 0.45);
  s += axisY(px + 20, py, ph, [[0, '0'], [0.6, '0.6']], 0, 0.6);
  s += T(px + pw, py + ph + 100, 'RMS →', { size: CARD.tick, fill: C.muted, anchor: 'end' });
  s += T(px + 20, py - 16, '过零率 ↑', { size: CARD.tick, fill: C.muted });

  const ly = py + ph + 148;
  s += O(px + 16, ly - 10, 10, { fill: C.blue });
  s += T(px + 44, ly, '语音帧', { size: CARD.small });
  s += O(px + 240, ly - 10, 10, { fill: C.warm });
  s += T(px + 268, ly, '噪声帧', { size: CARD.small });
  const by = ly + 66;
  s += takeaway(by, '两团没有完全分开，但比只看一根轴清楚得多。');
  return cardDoc(by + 40, s, '语音帧与噪声帧在 RMS 与过零率平面上的分布');
};

// 10 ------------------------------------------------------------------

const COMP = [[120, 1], [360, 0.5], [720, 0.3]];
const compSum = (n) => Array.from({ length: n }, (_, i) => COMP.reduce(
  (p, [f, a]) => p + a * Math.sin((2 * Math.PI * f * i) / SR), 0) / 1.8);

CARDS['10-components'] = () => {
  const h0 = head(['复杂波形', '是几个简单振动加起来的']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 540;
  const py = h0.h; const ph = 150;
  s += T(px, py + 28, '合起来的样子', { size: CARD.h2, weight: 700 });
  s += waveExact(px, py + 46, pw, ph, compSum(n), { c: C.ink });
  let y = py + 46 + ph + 40;
  s += T(px, y + 26, '拆开以后', { size: CARD.h2, weight: 700, fill: C.muted });
  y += 44;
  const colors = [C.blue, C.warm, C.green];
  COMP.forEach(([f, a], i) => {
    const vals = Array.from({ length: n }, (_, k) => a * Math.sin((2 * Math.PI * f * k) / SR));
    s += T(px, y + 34, `${f} Hz`, { size: CARD.small, weight: 700, fill: colors[i] });
    s += waveExact(px + 190, y, pw - 190, 96, vals, { c: colors[i] });
    y += 108;
  });
  const by = y + 44;
  s += takeaway(by, '三条的快慢和强弱都不同，加起来才是上面那条。');
  return cardDoc(by + 40, s, '120、360、720 Hz 三个正弦叠加成复杂波形');
};

CARDS['10-probe'] = () => {
  const h0 = head(['用一个已知频率去试探，', '看乘完之后剩下什么']);
  let s = h0.svg;
  const n = 480;
  const sig = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 120 * i) / SR));
  const cs = cols(2, h0.h, 430);
  [[120, '频率对上了', '乘完几乎都在零线上方', '平均 ≈ 0.50', C.blue],
    [200, '频率没对上', '正负互相抵消', '平均 ≈ 0.00', C.warm]].forEach(([pf, name, note, avg, c], i) => {
    const q = cs[i];
    const prod = sig.map((v, k) => v * Math.sin((2 * Math.PI * pf * k) / SR));
    s += plate(q.x, q.y, q.w, q.h);
    s += T(q.x + 22, q.y + 52, name, { size: CARD.h2, weight: 700, fill: c });
    s += waveExact(q.x + 18, q.y + 76, q.w - 36, 190, prod, { c });
    s += T(q.x + 22, q.y + 314, note, { size: CARD.small, fill: C.muted });
    s += T(q.x + 22, q.y + 380, avg, { size: CARD.h2, weight: 700, fill: c });
  });
  const by = h0.h + 430 + 60;
  s += takeaway(by, '平均值大，就说明这个频率真的在声音里。');
  return cardDoc(by + 40, s, '同频与不同频试探波相乘后的平均结果');
};

CARDS['10-spectrum'] = () => {
  const h0 = head(['频谱：把每个频率的', '回应排成一排']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const nfft = 2048;
  const mag = fftMag(Float64Array.from(compSum(nfft)), nfft, true);
  const bin = SR / nfft;
  const kMax = Math.floor(1000 / bin);
  const vals = mag.slice(0, kMax + 1);
  const peak = Math.max(...vals);
  const py = h0.h + 10; const ph = 320;
  s += white(px, py, pw, ph);
  const pts = vals.map((v, k) => [px + 12 + (k / kMax) * (pw - 24), py + ph - 16 - (v / peak) * (ph - 40)]);
  s += P(pts, { c: C.blue, w: 3.5 });
  COMP.forEach(([f], i) => {
    const x = px + 12 + (f / 1000) * (pw - 24);
    s += L(x, py + ph - 16, x, py + 20, { c: C.warm, w: 2.5, dash: '10 8' });
    s += T(x, py + 12, `${f}`, { size: CARD.tick, weight: 700, fill: C.warm, anchor: 'middle' });
  });
  s += axisX(px + 12, py + ph, pw - 24, [[0, '0'], [500, '500'], [1000, '1000']], 0, 1000, { unit: 'Hz' });
  const by = py + ph + 150;
  s += takeaway(by, '峰的位置是频率，峰的高低是这个成分有多强。');
  return cardDoc(by + 40, s, '复杂波形的频谱在 120、360、720 Hz 出现三个峰');
};

CARDS['10-reconstruct'] = () => {
  const h0 = head(['把三个成分加回去，', '原波形就回来了']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 540;
  const py = h0.h + 10; const ph = 260;
  s += white(px, py, pw, ph);
  s += waveExact(px, py, pw, ph, compSum(n), { c: C.ink, sw: 6, frame: false });
  s += waveExact(px, py, pw, ph, compSum(n), { c: C.green, sw: 2.6, frame: false });

  const ly = py + ph + 76;
  s += L(px, ly - 10, px + 54, ly - 10, { c: C.ink, w: 6 });
  s += T(px + 68, ly, '原来的波形', { size: CARD.small });
  s += L(px, ly + 46, px + 54, ly + 46, { c: C.green, w: 4 });
  s += T(px + 68, ly + 56, '用频率、强弱、起点重新加出来的', { size: CARD.small });
  const by = ly + 120;
  s += takeaway(by, '两条重合，说明频谱没有丢掉信息。');
  return cardDoc(by + 40, s, '用频谱中的三个成分重建出原始波形');
};

// ---------- 输出 ----------

let n = 0;
for (const [name, build] of Object.entries(CARDS)) {
  writeFileSync(join(OUT, `${name}.svg`), build(), 'utf8');
  n += 1;
}
console.log(`生成 ${n} 张卡片图 → ${OUT}`);
