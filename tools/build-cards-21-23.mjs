#!/usr/bin/env node
// 第 21～23 课的小红书卡片版配图。
//
//   node tools/build-cards-21-23.mjs
//
// 输出 音频信号处理二十三讲/第21-23课/figures/card/
//
// 这一组讲三个频域统计量，图里到处是「同一帧频谱 + 一条标注线」，
// 所以把 frameSpectrum / centroid / bandwidth / berCurve 抽成公用函数，
// 保证四张图里的质心是同一个定义算出来的。
// 约束同前：宽 912、高 ≤ 900、最小字号 32。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, stft, magnitudeSpectrum } from './lib/dsp.mjs';
import { spectrogramPng } from './lib/figure.mjs';
import {
  CARD, C, cardDoc, T, MT, R, L, O, P, PATH, ARROW,
  head, rows, cols, plate, white, axisX, axisY, curve,
} from './lib/card.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '音频信号处理二十三讲/', '第21-23课', 'figures', 'card');
mkdirSync(OUT, { recursive: true });

const SR = 16000;
const NFFT = 1024;
const HOP = 256;
const SPLIT = 2000;     // 带能量比的分界频率
const FMAX = 8000;

// ---------- 素材 ----------

function normalize(y) {
  let p = 0;
  for (const v of y) p = Math.max(p, Math.abs(v));
  return Float64Array.from(y, (v) => v / Math.max(p, 1e-12));
}

function load(name, start = 0, dur = 4) {
  const wav = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const y = resample(wav.samples, wav.sampleRate, SR);
  const a = Math.floor(start * SR);
  return normalize(y.subarray(a, Math.min(y.length, a + Math.floor(dur * SR))));
}

const DEBUSSY = load('debussy.wav', 4, 4);
const REDHOT = load('redhot.wav', 4, 4);
const DUKE = load('duke.wav', 4, 4);

// ---------- 计算 ----------

const BIN_HZ = SR / NFFT;

/** 取一帧的幅度谱，只保留 0–FMAX。 */
function frameSpectrum(y, atSec = 1.0) {
  const start = Math.min(y.length - NFFT, Math.floor(atSec * SR));
  const mag = magnitudeSpectrum(y.subarray(start, start + NFFT), NFFT);
  const kMax = Math.floor(FMAX / BIN_HZ);
  return Array.from({ length: kMax + 1 }, (_, k) => mag[k]);
}

const centroid = (mag) => {
  let num = 0; let den = 0;
  mag.forEach((v, k) => { num += k * BIN_HZ * v; den += v; });
  return num / Math.max(den, 1e-12);
};

const bandwidth = (mag, c = centroid(mag)) => {
  let num = 0; let den = 0;
  mag.forEach((v, k) => { num += ((k * BIN_HZ - c) ** 2) * v; den += v; });
  return Math.sqrt(num / Math.max(den, 1e-12));
};

/** 逐帧带能量比，单位是分贝：低频区功率 ÷ 高频区功率。 */
function berCurve(y) {
  const S = stft(y, SR, { nfft: NFFT, hop: HOP });
  const kSplit = Math.ceil(SPLIT / BIN_HZ);
  const out = [];
  for (let t = 0; t < S.frames; t += 1) {
    let lo = 0; let hi = 0;
    for (let k = 0; k < S.bins; k += 1) {
      const p = S.mag[t * S.bins + k] ** 2;
      if (k < kSplit) lo += p; else hi += p;
    }
    out.push(10 * Math.log10(Math.max(lo, 1e-14) / Math.max(hi, 1e-14)));
  }
  return out;
}

/** 逐帧质心与带宽。 */
function tracks(y) {
  const S = stft(y, SR, { nfft: NFFT, hop: HOP });
  const kMax = Math.floor(FMAX / BIN_HZ);
  const cs = []; const bs = [];
  for (let t = 0; t < S.frames; t += 1) {
    let num = 0; let den = 0;
    for (let k = 0; k <= kMax; k += 1) { const v = S.mag[t * S.bins + k]; num += k * BIN_HZ * v; den += v; }
    const c = num / Math.max(den, 1e-12);
    let n2 = 0;
    for (let k = 0; k <= kMax; k += 1) {
      const v = S.mag[t * S.bins + k];
      n2 += ((k * BIN_HZ - c) ** 2) * v;
    }
    cs.push(c);
    bs.push(Math.sqrt(n2 / Math.max(den, 1e-12)));
  }
  return { cs, bs };
}

const smooth = (a, w = 5) => a.map((_, i) => {
  let s = 0; let n = 0;
  for (let k = -w; k <= w; k += 1) {
    const j = i + k;
    if (j >= 0 && j < a.length) { s += a[j]; n += 1; }
  }
  return s / n;
});

// ---------- 画板 ----------

const img = (href, x, y, w, h) =>
  `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`
  + R(x, y, w, h, { fill: 'none', stroke: C.grid, r: 0 });

function linePlot(x, y, w, h, values, o = {}) {
  const min = o.min ?? Math.min(...values);
  const max = o.max ?? Math.max(...values);
  const span = Math.max(1e-12, max - min);
  let s = o.frame === false ? '' : white(x, y, w, h);
  const pts = Array.from(values, (v, i) => [
    x + 8 + (i / Math.max(1, values.length - 1)) * (w - 16),
    y + 8 + (1 - (v - min) / span) * (h - 16),
  ]);
  return s + P(pts, { c: o.c ?? C.blue, w: o.w ?? 3 });
}

// 最右一个刻度标签是居中画的，「8000 Hz」有一半会落到画布外，
// 所以绘图区右侧留出这么宽，横轴和曲线都用同一个可用宽度。
const PLOT_R = 84;
const plotW = (w) => w - 12 - PLOT_R;

/** 一帧频谱，横轴是真实赫兹。返回画好的 SVG 和 Hz→像素的换算。 */
function spectrumPanel(x, y, w, h, mag, o = {}) {
  const { c = C.blue, frame = true } = o;
  let s = frame ? white(x, y, w, h) : '';
  const peak = Math.max(...mag, 1e-12);
  const pts = mag.map((v, k) => [
    x + 12 + ((k * BIN_HZ) / FMAX) * plotW(w),
    y + h - 14 - (v / peak) * (h - 34),
  ]);
  s += P(pts, { c, w: 3 });
  const X = (hz) => x + 12 + (hz / FMAX) * plotW(w);
  return { s, X, top: y + 10, bottom: y + h - 14 };
}

const takeaway = (y, text, color = C.warm) =>
  T(CARD.pad, y, text, { size: CARD.body, weight: 700, fill: color });

const CARDS = {};

// 21 ------------------------------------------------------------------

CARDS['21-three-questions'] = () => {
  const h0 = head(['同一帧频谱，', '三个不同的问题']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const mag = frameSpectrum(DEBUSSY, 1.2);
  const panel = spectrumPanel(px, h0.h, pw, 240, mag);
  s += panel.s;
  const cen = centroid(mag);
  const bwv = bandwidth(mag, cen);
  s += L(panel.X(SPLIT), panel.top, panel.X(SPLIT), panel.bottom, { c: C.green, w: 3, dash: '10 8' });
  s += L(panel.X(cen), panel.top, panel.X(cen), panel.bottom, { c: C.warm, w: 3.5 });
  s += L(panel.X(Math.max(0, cen - bwv)), panel.bottom - 6,
    panel.X(Math.min(FMAX, cen + bwv)), panel.bottom - 6, { c: C.gold, w: 5 });
  s += axisX(px + 12, h0.h + 240, plotW(pw), [[0, '0'], [4000, '4000'], [8000, '8000 Hz']], 0, FMAX);

  const items = [
    ['带能量比', '分界线两边，谁占得多', C.green],
    ['频谱质心', '整体的中心落在哪里', C.warm],
    ['频谱带宽', '成分离中心有多远', C.gold],
  ];
  const rs = rows(3, h0.h + 320, 96, 12);
  items.forEach(([k, v, c], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h);
    s += L(r.x + 20, r.y + 20, r.x + 20, r.y + r.h - 20, { c, w: 6 });
    s += T(r.x + 44, r.y + 58, k, { size: CARD.h2, weight: 700, fill: c });
    s += T(r.x + 300, r.y + 58, v, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 320 + 3 * 96 + 2 * 12 + 56;
  s += takeaway(by, '三个都在看同一条曲线，只是问法不一样。');
  return cardDoc(by + 40, s, '同一帧频谱用带能量比、质心与带宽回答三个问题');
};

CARDS['21-same-total'] = () => {
  const h0 = head(['总量差不多，', '分布可以差很远']);
  let s = h0.svg;
  const shapes = [
    ['挤在低频', (u) => Math.exp(-((u - 0.12) ** 2) / 0.006), C.blue],
    ['挤在高频', (u) => Math.exp(-((u - 0.78) ** 2) / 0.006), C.warm],
    ['两头都有', (u) => Math.exp(-((u - 0.15) ** 2) / 0.004) + Math.exp(-((u - 0.8) ** 2) / 0.004), C.green],
    ['整片摊开', (u) => 0.45 + 0.12 * Math.sin(u * 14), C.gold],
  ];
  const top = cols(2, h0.h, 226);
  const bot = cols(2, h0.h + 226 + 66, 226);
  [top[0], top[1], bot[0], bot[1]].forEach((q, i) => {
    const [name, fn, c] = shapes[i];
    s += white(q.x, q.y, q.w, q.h);
    s += curve(q.x + 12, q.y + 14, q.w - 24, q.h - 28, (u) => Math.min(1, fn(u)), 240, { c, w: 3.5 });
    s += T(q.x + 4, q.y + q.h + 44, name, { size: CARD.small, weight: 700, fill: c });
  });
  const by = h0.h + 226 * 2 + 66 + 100;
  s += T(CARD.pad, by - 58, '四张的总功率相近，横轴都是 0–8000 Hz',
    { size: CARD.small, fill: C.muted });
  s += takeaway(by, '知道总量，还是不知道频率堆在哪儿。');
  return cardDoc(by + 40, s, '总量相近但分布位置与分散程度不同的四种频谱');
};

CARDS['21-feature-response'] = () => {
  const h0 = head(['频谱一变，', '三个数字怎么动']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const cw = 156;
  const colX = [px + pw - cw * 3 + cw / 2, px + pw - cw * 2 + cw / 2, px + pw - cw + cw / 2];
  ['带能量比', '质心', '带宽'].forEach((n, i) => {
    s += T(colX[i], h0.h - 12, n,
      { size: CARD.tick, weight: 700, fill: [C.green, C.warm, C.gold][i], anchor: 'middle' });
  });
  const cases = [
    ['整体一起变响', ['—', '—', '—']],
    ['高频成分变多', ['↓', '↑', '↑']],
    ['成分变得更散', ['看情况', '—', '↑']],
  ];
  const rs = rows(3, h0.h + 8, 112, 14);
  cases.forEach(([name, marks], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h);
    s += T(r.x + 24, r.y + 68, name, { size: CARD.small, weight: 700 });
    marks.forEach((m, k) => {
      const flat = m === '—' || m === '看情况';
      s += T(colX[k], r.y + 72, m, {
        size: m === '看情况' ? CARD.tick : CARD.h1,
        weight: 700,
        fill: flat ? '#9aa5b0' : [C.green, C.warm, C.gold][k],
        anchor: 'middle',
      });
    });
  });
  const by = h0.h + 8 + 3 * 112 + 2 * 14 + 58;
  s += T(CARD.pad, by - 58, '这是常见方向，不是对所有声音都成立的规则',
    { size: CARD.small, fill: C.muted });
  s += takeaway(by, '第一行三个都不动——所以它们都不管整体音量。');
  return cardDoc(by + 40, s, '三种频谱变化对带能量比、质心与带宽的影响');
};

CARDS['21-task-map'] = () => {
  const h0 = head(['先想清楚要什么证据，', '再挑特征']);
  let s = h0.svg;
  const items = [
    ['低音占了多大比例？', '带能量比', C.green],
    ['整体偏高还是偏低？', '频谱质心', C.warm],
    ['成分集中还是散？', '频谱带宽', C.gold],
  ];
  const rs = rows(3, h0.h, 138, 18);
  items.forEach(([q, feat, c], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h);
    s += T(r.x + 24, r.y + 58, q, { size: CARD.h2, weight: 700 });
    s += T(r.x + 24, r.y + 108, '用', { size: CARD.small, fill: C.muted });
    s += T(r.x + 70, r.y + 108, feat, { size: CARD.small, weight: 700, fill: c });
  });
  const by = h0.h + 3 * 138 + 2 * 18 + 58;
  s += T(CARD.pad, by - 58, '反过来先堆一堆数字再找用途，通常更不可靠',
    { size: CARD.small, fill: C.muted });
  s += takeaway(by, '特征是用来回答问题的，不是用来凑数量的。');
  return cardDoc(by + 40, s, '三类任务问题分别对应哪一个频域特征');
};

// 22 ------------------------------------------------------------------

CARDS['22-split-frame'] = async () => {
  const h0 = head(['带能量比是', '一列一列地比']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const S = stft(DEBUSSY, SR, { nfft: NFFT, hop: HOP });
  const uri = await spectrogramPng(S, {
    w: Math.round(pw * 1.6), h: 340, fmax: FMAX, dbFloor: -70, cmap: 'magma',
  });
  const py = h0.h + 10; const ph = 300;
  s += img(uri, px, py, pw, ph);
  const yLine = py + ph - (SPLIT / FMAX) * ph;
  s += L(px, yLine, px + pw, yLine, { c: '#ffffff', w: 3.5, dash: '12 8' });
  s += T(px + pw - 14, yLine - 16, '2000 Hz',
    { size: CARD.tick, weight: 700, fill: '#ffffff', anchor: 'end' });
  const xLine = px + pw * 0.42;
  s += L(xLine, py, xLine, py + ph, { c: '#ffffff', w: 3.5 });
  s += T(xLine + 14, py + 44, '某一帧', { size: CARD.tick, weight: 700, fill: '#ffffff' });

  const ny = py + ph + 84;
  s += T(px, ny, '线以下的功率 ÷ 线以上的功率', { size: CARD.small, weight: 700, fill: C.blue });
  s += T(px, ny + 52, '每一列各算一次，得到一条随时间变化的曲线',
    { size: CARD.small, fill: C.muted });
  const by = ny + 118;
  s += takeaway(by, '比的不是整张图，是每一个时间列各比各的。');
  return cardDoc(by + 40, s, '真实音乐声谱图上的 2000 Hz 分界线与当前帧');
};

CARDS['22-bin-map'] = () => {
  const h0 = head(['分界频率对应第几行，', '要算，不能猜']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const rs = rows(3, h0.h, 104, 14);
  [['每一行相隔多少赫兹', '16000 ÷ 1024 = 15.625 Hz', C.blue],
    ['2000 Hz 落在第几行', '2000 ÷ 15.625 = 128', C.warm],
    ['取第一个不小于它的行', '第 128 行', C.green],
  ].forEach(([k, v, c], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 2 ? C.pale : C.plate);
    s += T(r.x + 24, r.y + 62, k, { size: CARD.small, fill: C.muted });
    s += T(r.x + r.w - 24, r.y + 62, v, { size: CARD.small, weight: 700, fill: c, anchor: 'end' });
  });

  const ay = h0.h + 3 * 104 + 2 * 14 + 90;
  const N = 13;
  const bw = (pw - 20) / N;
  for (let i = 0; i < N; i += 1) {
    const on = i === 8;
    s += R(px + 10 + i * bw + 3, ay - 40, bw - 6, 76, {
      fill: on ? C.warm : '#fff', stroke: on ? C.warm : C.grid, sw: on ? 3 : 1.5, r: 6,
    });
  }
  s += T(px + 10 + 8 * bw + bw / 2, ay + 90, '第 128 行',
    { size: CARD.tick, weight: 700, fill: C.warm, anchor: 'middle' });
  const by = ay + 156;
  s += takeaway(by, '先生成真实的赫兹轴，再去找位置——顺序不能反。');
  return cardDoc(by + 40, s, '用真实 FFT 频率轴查找 2000 Hz 的切分行');
};

CARDS['22-axis-flow'] = () => {
  const h0 = head(['沿哪个方向求和，', '结果完全不同']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const gw = 400; const gh = 260;
  const grid = (gx, gy, arrowDir, c) => {
    let t = R(gx, gy, gw, gh, { fill: '#fff', stroke: C.grid, sw: 2, r: 8 });
    for (let i = 1; i < 8; i += 1) t += L(gx + (i * gw) / 8, gy, gx + (i * gw) / 8, gy + gh, { c: '#eef2f5', w: 1.5 });
    for (let i = 1; i < 6; i += 1) t += L(gx, gy + (i * gh) / 6, gx + gw, gy + (i * gh) / 6, { c: '#eef2f5', w: 1.5 });
    if (arrowDir === 'v') {
      for (let i = 0; i < 4; i += 1) {
        const x = gx + 60 + i * 90;
        t += ARROW(x, gy + gh - 20, x, gy + 20, { c, w: 4, head: 16 });
      }
    } else {
      for (let i = 0; i < 3; i += 1) {
        const y = gy + 50 + i * 80;
        t += ARROW(gx + 20, y, gx + gw - 20, y, { c, w: 4, head: 16 });
      }
    }
    return t;
  };
  const y = h0.h + 34;
  s += T(px, y - 14, '沿频率方向求和', { size: CARD.h2, weight: 700, fill: C.green });
  s += grid(px, y, 'v', C.green);
  s += T(px, y + gh + 48, '时间列还在，得到一条曲线', { size: CARD.tick, fill: C.muted });

  const rx = CARD.W - CARD.pad - gw;
  s += T(rx, y - 14, '沿时间方向求和', { size: CARD.h2, weight: 700, fill: C.warm });
  s += grid(rx, y, 'h', C.warm);
  s += T(rx, y + gh + 48, '时间没了，不再是逐帧的 BER', { size: CARD.tick, fill: C.muted });

  const by = y + gh + 130;
  s += takeaway(by, '写代码之前先说清楚：留下来的那一维是什么。');
  return cardDoc(by + 40, s, '按频率行求和与按时间列求和的区别');
};

CARDS['22-ber-curves'] = () => {
  const h0 = head(['同样的参数，', '三段音乐的低高频比']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const sets = [['德彪西 · 钢琴', DEBUSSY, C.blue], ['摇滚 · 乐队', REDHOT, C.warm], ['爵士 · 铜管', DUKE, C.green]];
  const curves = sets.map(([, y]) => smooth(berCurve(y), 3));
  let lo = Infinity; let hi = -Infinity;
  curves.forEach((cv) => cv.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));

  const py = h0.h + 10; const ph = 300;
  s += white(px, py, pw, ph);
  curves.forEach((cv, i) => { s += linePlot(px, py, pw, ph, cv, { c: sets[i][2], min: lo, max: hi, frame: false }); });
  s += axisY(px, py, ph, [[lo, `${lo.toFixed(0)}`], [hi, `${hi.toFixed(0)}`]], lo, hi);
  s += T(px + pw, py + ph + 46, '时间 →　　纵轴：分贝', { size: CARD.tick, fill: C.muted, anchor: 'end' });

  const ly = py + ph + 110;
  sets.forEach(([name, , c], i) => {
    s += L(px, ly - 10 + i * 46, px + 54, ly - 10 + i * 46, { c, w: 5 });
    s += T(px + 68, ly + i * 46, name, { size: CARD.small });
  });
  const by = ly + 164;
  s += takeaway(by, '数值越大，低频占得越多；参数不同就不能这样比。');
  return cardDoc(by + 40, s, '三段真实音乐在相同参数下的带能量比曲线');
};

// 23 ------------------------------------------------------------------

CARDS['23-centroid-bandwidth'] = () => {
  const h0 = head(['一条线说在哪，', '一条线说有多散']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const mag = frameSpectrum(DEBUSSY, 1.2);
  const cen = centroid(mag);
  const bwv = bandwidth(mag, cen);
  const py = h0.h + 10; const ph = 340;
  const panel = spectrumPanel(px, py, pw, ph, mag);
  s += panel.s;
  s += L(panel.X(cen), panel.top, panel.X(cen), panel.bottom, { c: C.warm, w: 4 });
  s += T(panel.X(cen) + 14, panel.top + 34, `质心 ${cen.toFixed(0)} Hz`,
    { size: CARD.tick, weight: 700, fill: C.warm });
  s += axisX(px + 12, py + ph, plotW(pw), [[0, '0'], [4000, '4000'], [8000, '8000 Hz']], 0, FMAX);

  // 带宽画在坐标轴下面单独一条，压在频谱上会被密集的低频峰淹掉
  const ay = py + ph + 118;
  const bwHi = Math.min(FMAX, cen + bwv);
  s += L(panel.X(Math.max(0, cen - bwv)), ay, panel.X(bwHi), ay, { c: C.green, w: 8 });
  s += T(panel.X(bwHi) + 20, ay + 12, `带宽 ±${bwv.toFixed(0)} Hz`,
    { size: CARD.tick, weight: 700, fill: C.green });

  const by = ay + 118;
  s += T(px, by - 58, '橙线回答“在哪里”，绿线回答“有多散”',
    { size: CARD.small, fill: C.muted });
  s += takeaway(by, '两个数字都来自同一条曲线，缺一个就说不完整。');
  return cardDoc(by + 40, s, '一帧频谱上的加权质心与围绕质心的带宽');
};

CARDS['23-same-centroid'] = () => {
  const h0 = head(['质心一样，', '带宽可以差很多']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 320);
  [['成分挤在中心附近', (u) => Math.exp(-((u - 0.5) ** 2) / 0.004), '带宽小', C.blue],
    ['成分散在两边', (u) => Math.exp(-((u - 0.18) ** 2) / 0.004) + Math.exp(-((u - 0.82) ** 2) / 0.004), '带宽大', C.warm],
  ].forEach(([name, fn, tag, c], i) => {
    const q = cs[i];
    s += T(q.x + 4, q.y + 40, name, { size: CARD.h2, weight: 700, fill: c });
    s += white(q.x, q.y + 58, q.w, 210);
    s += curve(q.x + 12, q.y + 72, q.w - 24, 182, (u) => Math.min(1, fn(u)), 240, { c, w: 3.5 });
    s += L(q.x + q.w / 2, q.y + 62, q.x + q.w / 2, q.y + 264, { c: C.green, w: 4 });
    s += T(q.x + 4, q.y + 314, tag, { size: CARD.small, weight: 700, fill: c });
  });
  s += T(CARD.pad, h0.h + 320 + 44, '绿色竖线是质心，两边位置几乎一样',
    { size: CARD.small, fill: C.muted });
  const by = h0.h + 320 + 110;
  s += takeaway(by, '只报质心，会把这两种声音说成同一种。');
  return cardDoc(by + 40, s, '两个质心相近但带宽明显不同的频谱分布');
};

CARDS['23-weight-convention'] = () => {
  const h0 = head(['用幅度还是用功率，', '质心不一样']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const mag = frameSpectrum(DEBUSSY, 1.2);
  const cAmp = centroid(mag);
  const cPow = (() => {
    let num = 0; let den = 0;
    mag.forEach((v, k) => { const p = v * v; num += k * BIN_HZ * p; den += p; });
    return num / Math.max(den, 1e-12);
  })();
  const py = h0.h + 10; const ph = 300;
  const panel = spectrumPanel(px, py, pw, ph, mag);
  s += panel.s;
  s += L(panel.X(cAmp), panel.top, panel.X(cAmp), panel.bottom, { c: C.blue, w: 4 });
  s += L(panel.X(cPow), panel.top, panel.X(cPow), panel.bottom, { c: C.warm, w: 4, dash: '12 8' });
  s += axisX(px + 12, py + ph, plotW(pw), [[0, '0'], [4000, '4000'], [8000, '8000 Hz']], 0, FMAX);

  const ly = py + ph + 118;
  s += L(px, ly - 10, px + 54, ly - 10, { c: C.blue, w: 6 });
  s += T(px + 68, ly, `幅度加权：${cAmp.toFixed(0)} Hz`, { size: CARD.small });
  s += L(px, ly + 46, px + 54, ly + 46, { c: C.warm, w: 6, dash: '10 6' });
  s += T(px + 68, ly + 56, `功率加权：${cPow.toFixed(0)} Hz`, { size: CARD.small });
  const by = ly + 122;
  s += takeaway(by, '不是谁算错了，是口径不同——全流程必须统一。');
  return cardDoc(by + 40, s, '同一频谱用幅度加权与功率加权得到不同质心');
};

CARDS['23-tracks'] = () => {
  const h0 = head(['质心和带宽，', '不会永远一起动']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const sets = [['德彪西', DEBUSSY, C.blue], ['摇滚', REDHOT, C.warm], ['爵士', DUKE, C.green]];
  const data = sets.map(([, y]) => {
    const t = tracks(y);
    return { cs: smooth(t.cs, 4), bs: smooth(t.bs, 4) };
  });

  let y = h0.h;
  const ph = 200;
  [['频谱质心', 'cs'], ['频谱带宽', 'bs']].forEach(([name, key]) => {
    let lo = Infinity; let hi = -Infinity;
    data.forEach((d) => d[key].forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));
    s += T(px, y + 30, name, { size: CARD.h2, weight: 700 });
    s += white(px, y + 48, pw, ph);
    data.forEach((d, i) => {
      s += linePlot(px, y + 48, pw, ph, d[key], { c: sets[i][2], min: lo, max: hi, frame: false });
    });
    s += T(px + pw - 14, y + 40, `${lo.toFixed(0)} – ${hi.toFixed(0)} Hz`,
      { size: CARD.tick, fill: C.muted, anchor: 'end' });
    y += 48 + ph + 40;
  });

  sets.forEach(([name, , c], i) => {
    s += L(px + i * 250, y + 14, px + i * 250 + 46, y + 14, { c, w: 5 });
    s += T(px + i * 250 + 58, y + 24, name, { size: CARD.small });
  });
  const by = y + 92;
  s += takeaway(by, '两条曲线各说各的，同步上升下降并不是常态。');
  return cardDoc(by + 40, s, '三段真实音乐的频谱质心与带宽时间曲线');
};

// ---------- 输出 ----------

const names = Object.keys(CARDS);
for (const name of names) {
  // eslint-disable-next-line no-await-in-loop
  writeFileSync(join(OUT, `${name}.svg`), await CARDS[name](), 'utf8');
}
console.log(`生成 ${names.length} 张卡片图 → ${OUT}`);
