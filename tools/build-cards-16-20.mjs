#!/usr/bin/env node
// 第 16～20 课的小红书卡片版配图。
//
//   node tools/build-cards-16-20.mjs
//
// 输出 NotebookLM课程博客_重写版/零基础版_16-20/figures/card/
//
// 这一组图大半是热力图（声谱图、梅尔谱、MFCC 矩阵），SVG 画不动，
// 一律先渲成 PNG 再嵌进 SVG，坐标和文字仍然是真正的 <text>。
// 约束同前：宽 912、高 ≤ 900、最小字号 32。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { readWav, resample, stft, melFilterbank, hzToMel } from './lib/dsp.mjs';
import { spectrogramPng, colorbar, COLORMAPS } from './lib/figure.mjs';
import {
  CARD, C, cardDoc, T, MT, R, L, O, P, PATH, ARROW,
  head, rows, cols, plate, white, axisX, axisY, curve,
} from './lib/card.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_16-20', 'figures', 'card');
mkdirSync(OUT, { recursive: true });

const SR = 16000;

// ---------- 素材 ----------

function normalize(y) {
  let p = 0;
  for (const v of y) p = Math.max(p, Math.abs(v));
  return Float64Array.from(y, (v) => v / Math.max(p, 1e-12));
}

function load(name, start = 0, dur = 3.2) {
  const wav = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const y = resample(wav.samples, wav.sampleRate, SR);
  const a = Math.floor(start * SR);
  return normalize(y.subarray(a, Math.min(y.length, a + Math.floor(dur * SR))));
}

const SCALE = load('scale.wav', 0, 3.2);
const VOICE = load('voice.wav', 0, 3.2);
const DEBUSSY = load('debussy.wav', 4, 3.2);
const REDHOT = load('redhot.wav', 4, 3.2);
const DUKE = load('duke.wav', 4, 3.2);

// ---------- 计算 ----------

function powerMatrix(y, nfft = 1024, hop = 256) {
  const S = stft(y, SR, { nfft, hop });
  const rows_ = Array.from({ length: S.bins }, () => new Float64Array(S.frames));
  for (let t = 0; t < S.frames; t += 1) {
    for (let k = 0; k < S.bins; k += 1) rows_[k][t] = S.mag[t * S.bins + k] ** 2;
  }
  return rows_;
}

const toDbMatrix = (m, floor = -80) => {
  let peak = 0;
  for (const row of m) for (const v of row) peak = Math.max(peak, v);
  return m.map((row) => Float64Array.from(row,
    (v) => Math.max(floor, 10 * Math.log10(Math.max(v, 1e-14) / Math.max(peak, 1e-14)))));
};

function melData(y, { nfft = 1024, hop = 256, nMels = 64, fmin = 50 } = {}) {
  const S = stft(y, SR, { nfft, hop });
  const H = melFilterbank(nMels, nfft, SR, fmin, SR / 2);
  const power = Array.from({ length: nMels }, () => new Float64Array(S.frames));
  for (let m = 0; m < nMels; m += 1) {
    for (let t = 0; t < S.frames; t += 1) {
      let sum = 0;
      for (let k = 0; k < S.bins; k += 1) sum += H[m][k] * S.mag[t * S.bins + k] ** 2;
      power[m][t] = sum;
    }
  }
  return { power, H, frames: S.frames };
}

function dctMfcc(logMel, count = 13) {
  const M = logMel.length;
  const Tn = logMel[0].length;
  return Array.from({ length: count }, (_, n) => Float64Array.from({ length: Tn }, (__, t) => {
    let sum = 0;
    for (let m = 0; m < M; m += 1) sum += logMel[m][t] * Math.cos((Math.PI * n * (m + 0.5)) / M);
    return sum * (n === 0 ? Math.sqrt(1 / M) : Math.sqrt(2 / M));
  }));
}

function delta(matrix, radius = 4) {
  const den = 2 * Array.from({ length: radius }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0);
  return matrix.map((row) => Float64Array.from(row, (_, t) => {
    let sum = 0;
    for (let n = 1; n <= radius; n += 1) {
      sum += n * (row[Math.min(row.length - 1, t + n)] - row[Math.max(0, t - n)]);
    }
    return sum / den;
  }));
}

async function matrixPng(matrix, { w = 900, h = 320, min, max, cmap = 'magma' } = {}) {
  let lo = min ?? Infinity;
  let hi = max ?? -Infinity;
  if (min == null || max == null) {
    for (const row of matrix) for (const v of row) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  }
  const sample = COLORMAPS[cmap];
  const rowN = matrix.length;
  const colN = matrix[0].length;
  const buf = Buffer.alloc(w * h * 3);
  for (let py = 0; py < h; py += 1) {
    const r = Math.min(rowN - 1, Math.round((1 - py / Math.max(1, h - 1)) * (rowN - 1)));
    for (let px = 0; px < w; px += 1) {
      const c = Math.min(colN - 1, Math.round((px / Math.max(1, w - 1)) * (colN - 1)));
      const rgb = sample(Math.max(0, Math.min(1, (matrix[r][c] - lo) / Math.max(1e-12, hi - lo))));
      const o = (py * w + px) * 3;
      [buf[o], buf[o + 1], buf[o + 2]] = rgb;
    }
  }
  const data = await sharp(buf, { raw: { width: w, height: h, channels: 3 } })
    .png({ palette: true, colors: 128 }).toBuffer();
  return `data:image/png;base64,${data.toString('base64')}`;
}

// ---------- 画板 ----------

const img = (href, x, y, w, h) =>
  `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`
  + R(x, y, w, h, { fill: 'none', stroke: C.grid, r: 0 });

function linePlot(x, y, w, h, values, o = {}) {
  const min = o.min ?? Math.min(...values);
  const max = o.max ?? Math.max(...values);
  const span = Math.max(1e-12, max - min);
  let s = o.frame === false ? '' : white(x, y, w, h);
  if (o.zero && min <= 0 && max >= 0) {
    s += L(x + 8, y + 8 + (1 - (0 - min) / span) * (h - 16),
      x + w - 8, y + 8 + (1 - (0 - min) / span) * (h - 16), { c: C.grid });
  }
  const pts = Array.from(values, (v, i) => [
    x + 8 + (i / Math.max(1, values.length - 1)) * (w - 16),
    y + 8 + (1 - (v - min) / span) * (h - 16),
  ]);
  return s + P(pts, { c: o.c ?? C.blue, w: o.w ?? 3 });
}

const takeaway = (y, text, color = C.warm) =>
  T(CARD.pad, y, text, { size: CARD.body, weight: 700, fill: color });

/** 上下堆叠若干张热力图，卡片里最常用的版式。 */
async function stackPanels(y0, panels, { ih = 132, gap = 58 } = {}) {
  const px = CARD.pad;
  const pw = CARD.W - CARD.pad * 2;
  let s = '';
  let y = y0;
  for (const [title, matrix, note, c, opt] of panels) {
    // eslint-disable-next-line no-await-in-loop
    const uri = typeof matrix === 'string' ? matrix : await matrixPng(matrix, {
      w: Math.round(pw * 1.6), h: 300, ...(opt ?? {}),
    });
    s += T(px, y + 30, title, { size: CARD.h2, weight: 700, fill: c });
    s += img(uri, px, y + 44, pw, ih);
    if (note) s += T(px, y + 44 + ih + 44, note, { size: CARD.small, fill: C.muted });
    y += 44 + ih + gap;
  }
  return { s, y };
}

const CARDS = {};

// 16 ------------------------------------------------------------------

CARDS['16-pipeline'] = async () => {
  const h0 = head(['画一张能读的声谱图，', '中间还有四步']);
  let s = h0.svg;
  const items = [
    ['录音', '一串随时间变化的数字'],
    ['STFT', '得到每一小段的频率结果'],
    ['取功率', '把复数换成“有多强”'],
    ['选基准', '相对分贝，最响的记作 0'],
    ['标坐标', '不写单位，颜色就没有含义'],
  ];
  const rs = rows(5, h0.h, 98, 12);
  items.forEach(([t, d], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i >= 3 ? C.pale : C.plate);
    s += O(r.x + 42, r.y + 46, 24, { fill: i >= 3 ? C.warm : C.blue });
    s += T(r.x + 42, r.y + 57, String(i + 1),
      { size: CARD.tick, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(r.x + 82, r.y + 56, t, { size: CARD.h2, weight: 700 });
    s += T(r.x + 300, r.y + 56, d, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 5 * 98 + 4 * 12 + 56;
  s += takeaway(by, 'STFT 只是中间结果，不是可以直接看的图。');
  return cardDoc(by + 40, s, '从录音到可解释声谱图的五个步骤');
};

CARDS['16-linear-db'] = async () => {
  const h0 = head(['同一份数据，', '换个尺度才看得见']);
  const power = powerMatrix(SCALE);
  const panels = [
    ['线性功率', power, '只有最响的地方有颜色，其余全黑', C.muted],
    ['相对分贝', toDbMatrix(power), '弱的成分也显出来了', C.blue],
  ];
  const { s: body, y } = await stackPanels(h0.h, panels, { ih: 186, gap: 64 });
  let s = h0.svg + body;
  s += colorbar(CARD.pad + 56, y - 4, 200, 18, 'magma', { lo: '弱', hi: '强', size: CARD.tick });
  const by = y + 84;
  s += takeaway(by, '相对分贝没有造出新成分，只是把范围压到看得见。');
  return cardDoc(by + 40, s, '同一段音阶在线性功率与相对分贝下的显示对比');
};

CARDS['16-linear-log-frequency'] = async () => {
  const h0 = head(['纵轴换成对数，', '低频才摊得开']);
  const pw = CARD.W - CARD.pad * 2;
  const S = stft(SCALE, SR, { nfft: 1024, hop: 256 });
  const lin = await spectrogramPng(S, { w: Math.round(pw * 1.6), h: 300, fmax: 8000, dbFloor: -80, cmap: 'magma' });
  const log = await spectrogramPng(S, { w: Math.round(pw * 1.6), h: 300, fmax: 8000, dbFloor: -80, cmap: 'magma', logFreq: true });
  const panels = [
    ['线性频率轴', lin, '低频全挤在最下面一条', C.muted],
    ['对数频率轴', log, '同一份数据，低频看得清了', C.blue],
  ];
  const { s: body, y } = await stackPanels(h0.h, panels, { ih: 186, gap: 64 });
  let s = h0.svg + body;
  const by = y + 20;
  s += takeaway(by, '只是重新安排了纵向位置，频率格一个也没变。');
  return cardDoc(by + 40, s, '同一份 STFT 功率在两种频率坐标下的显示对比');
};

CARDS['16-genre-spectrograms'] = async () => {
  const h0 = head(['同样的参数，三种音乐']);
  const panels = [
    ['德彪西 · 钢琴', toDbMatrix(powerMatrix(DEBUSSY)), '', C.blue],
    ['摇滚 · 乐队', toDbMatrix(powerMatrix(REDHOT)), '', C.warm],
    ['爵士 · 铜管', toDbMatrix(powerMatrix(DUKE)), '', C.green],
  ];
  const { s: body, y } = await stackPanels(h0.h, panels, { ih: 132, gap: 44 });
  let s = h0.svg + body;
  const by = y + 30;
  s += takeaway(by, '参数一样，纹理的差别才真的来自声音本身。');
  return cardDoc(by + 40, s, '三段真实音乐在相同参数下的功率声谱图');
};

// 17 ------------------------------------------------------------------

CARDS['17-perception'] = () => {
  const h0 = head(['同样差 100 Hz，', '听起来差得可不一样']);
  let s = h0.svg;
  const pairs = [
    ['100 Hz → 200 Hz', '翻了一倍，像跳了一个八度', C.warm, 1.0],
    ['3000 Hz → 3100 Hz', '只多了三十分之一，几乎听不出', C.blue, 0.06],
  ];
  let y = h0.h;
  pairs.forEach(([name, note, c, frac]) => {
    s += plate(CARD.pad, y, CARD.W - CARD.pad * 2, 210);
    s += T(CARD.pad + 24, y + 56, name, { size: CARD.h2, weight: 700, fill: c });
    const bx = CARD.pad + 24;
    const bw = CARD.W - CARD.pad * 2 - 48;
    s += R(bx, y + 82, bw, 42, { fill: '#fff', stroke: C.grid, r: 8 });
    s += R(bx, y + 82, bw * frac, 42, { fill: c, stroke: 'none', r: 8 });
    s += T(bx, y + 172, note, { size: CARD.small, fill: C.muted });
    y += 210 + 24;
  });
  const by = y + 34;
  s += takeaway(by, '耳朵听的是“变了几倍”，不是“差了多少赫兹”。');
  return cardDoc(by + 40, s, '低频与高频中相同赫兹差对应的不同相对跨度');
};

CARDS['17-hz-mel'] = () => {
  const h0 = head(['梅尔刻度：', '把赫兹按听感重排']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const py = h0.h + 10; const ph = 320;
  s += white(px, py, pw, ph);
  const fmax = 8000;
  const mmax = hzToMel(fmax);
  const pts = [];
  for (let i = 0; i <= 200; i += 1) {
    const f = (i / 200) * fmax;
    pts.push([px + 20 + (f / fmax) * (pw - 40), py + ph - 20 - (hzToMel(f) / mmax) * (ph - 40)]);
  }
  s += P(pts, { c: C.blue, w: 4 });
  s += axisX(px + 20, py + ph - 20, pw - 40, [[0, '0'], [4000, '4000'], [8000, '8000 Hz']], 0, fmax);
  s += T(px + 24, py + 40, '梅尔 ↑', { size: CARD.tick, fill: C.muted });
  const by = py + ph + 118;
  s += T(px, by - 60, '越往右越平：同样的赫兹差，占的位置越来越少',
    { size: CARD.small, fill: C.muted });
  s += takeaway(by, '它只是重排了距离，没有发现新的频率。');
  return cardDoc(by + 40, s, '从赫兹到梅尔刻度的非线性曲线');
};

CARDS['17-filterbank'] = () => {
  const h0 = head(['低频用窄三角，', '高频用宽三角']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const py = h0.h + 10; const ph = 300;
  s += white(px, py, pw, ph);
  const nMels = 14;
  const fmax = 8000;
  const mmax = hzToMel(fmax);
  const melToHzLocal = (m) => 700 * (10 ** (m / 2595) - 1);
  const edges = Array.from({ length: nMels + 2 }, (_, i) => melToHzLocal((i / (nMels + 1)) * mmax));
  const X = (f) => px + 20 + (f / fmax) * (pw - 40);
  for (let m = 0; m < nMels; m += 1) {
    const c = [C.blue, C.warm, C.green, C.gold][m % 4];
    s += PATH(`M${X(edges[m]).toFixed(1)} ${py + ph - 20} L${X(edges[m + 1]).toFixed(1)} ${py + 22} `
      + `L${X(edges[m + 2]).toFixed(1)} ${py + ph - 20}`, { c, w: 3 });
  }
  s += axisX(px + 20, py + ph - 20, pw - 40, [[0, '0'], [4000, '4000'], [8000, '8000 Hz']], 0, fmax);
  const by = py + ph + 122;
  s += T(px, by - 60, '相邻三角互相重叠，相近的频率不会被生硬切断',
    { size: CARD.small, fill: C.muted });
  s += takeaway(by, '高频那几个盖得宽，所以细节留得少——这是有意的。');
  return cardDoc(by + 40, s, '低频较窄、高频较宽的梅尔三角滤波器组');
};

CARDS['17-matrix-map'] = () => {
  const h0 = head(['513 行怎样变成 64 行']);
  let s = h0.svg;
  const y = h0.h + 50;
  const bh = 330;
  const bw = 250;

  // 用行的疏密表示行数：左边密不可分，右边数得清
  const block = (bx, lines, label, sub, c) => {
    let t = R(bx, y, bw, bh, { fill: '#fff', stroke: c, sw: 3, r: 10 });
    for (let i = 0; i < lines; i += 1) {
      const yy = y + 10 + ((i + 0.5) * (bh - 20)) / lines;
      t += L(bx + 12, yy, bx + bw - 12, yy, { c, w: lines > 40 ? 1.2 : 3 });
    }
    t += T(bx + bw / 2, y - 22, label, { size: CARD.h2, weight: 700, fill: c, anchor: 'middle' });
    t += T(bx + bw / 2, y + bh + 48, sub, { size: CARD.tick, fill: C.muted, anchor: 'middle' });
    return t;
  };

  const rx = CARD.W - CARD.pad - bw;
  s += block(CARD.pad, 64, '513 行', '每帧的频率结果', C.blue);
  s += block(rx, 16, '64 行', '每帧的梅尔频带', C.warm);

  const mx = CARD.pad + bw;
  const mw = rx - mx;
  s += ARROW(mx + 30, y + bh / 2, rx - 30, y + bh / 2, { c: C.green, w: 4, head: 20 });
  s += T(mx + mw / 2, y + bh / 2 - 34, '乘一张权重表',
    { size: CARD.small, weight: 700, fill: C.green, anchor: 'middle' });
  s += T(mx + mw / 2, y + bh / 2 + 62, '64 × 513',
    { size: CARD.tick, fill: C.muted, anchor: 'middle' });

  const by = y + bh + 168;
  s += T(CARD.pad, by - 58, '每一个输出行，都是若干原始频率格的加权和',
    { size: CARD.small, fill: C.muted });
  s += takeaway(by, '不只是换了纵轴标签，是真的把信息汇总掉了。');
  return cardDoc(by + 40, s, '梅尔滤波器矩阵把 513 行频率结果压成 64 行');
};

// 18 ------------------------------------------------------------------

CARDS['18-pipeline'] = () => {
  const h0 = head(['对数梅尔谱：', '四步，形状各不同']);
  let s = h0.svg;
  const items = [
    ['录音', '一列数字', C.muted],
    ['STFT 取功率', '513 行 × T 列', C.blue],
    ['梅尔汇总', '64 行 × T 列', C.green],
    ['取对数', '还是 64 行 × T 列', C.warm],
  ];
  const rs = rows(4, h0.h, 112, 16);
  items.forEach(([t, shape, c], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 3 ? C.pale : C.plate);
    s += T(r.x + 24, r.y + 66, t, { size: CARD.h2, weight: 700 });
    s += T(r.x + r.w - 24, r.y + 66, shape, { size: CARD.small, weight: 700, fill: c, anchor: 'end' });
  });
  const ny = h0.h + 4 * 112 + 3 * 16 + 40;
  s += T(CARD.pad, ny + 40, '最后一步只改数值大小，不再改形状',
    { size: CARD.small, fill: C.muted });
  const by = ny + 106;
  s += takeaway(by, '形状什么时候变、变成多少，自己要能随口说出来。');
  return cardDoc(by + 40, s, '录音经 STFT、梅尔汇总与相对分贝得到对数梅尔谱');
};

CARDS['18-band-count'] = async () => {
  const h0 = head(['频带越多，', '纵向轮廓越细']);
  const m10 = melData(SCALE, { nMels: 10 });
  const m64 = melData(SCALE, { nMels: 64 });
  const panels = [
    ['10 个梅尔频带', toDbMatrix(m10.power), '粗，但每一行的意思很好说', C.warm],
    ['64 个梅尔频带', toDbMatrix(m64.power), '细，代价是每一行更难单独解释', C.blue],
  ];
  const { s: body, y } = await stackPanels(h0.h, panels, { ih: 186, gap: 64 });
  let s = h0.svg + body;
  const by = y + 20;
  s += takeaway(by, '细不等于更准，只是汇总时少扔了一些行。');
  return cardDoc(by + 40, s, '同一段声音使用十个和六十四个梅尔频带的对比');
};

CARDS['18-scale-mel'] = async () => {
  const h0 = head(['压行数和压数值，是两件事']);
  const power = powerMatrix(SCALE);
  const mel = melData(SCALE, { nMels: 64 });
  const panels = [
    ['① 线性频率功率', power, '513 行，弱成分看不见', C.muted],
    ['② 梅尔频带功率', mel.power, '只剩 64 行，弱的还是看不见', C.green],
    ['③ 再取对数', toDbMatrix(mel.power), '行数没变，弱成分终于显出来', C.blue],
  ];
  const { s: body, y } = await stackPanels(h0.h, panels, { ih: 108, gap: 86 });
  let s = h0.svg + body;
  const by = y + 24;
  s += takeaway(by, '②改的是行数，③改的是数值范围，别混在一起讲。');
  return cardDoc(by + 40, s, '线性频率功率、梅尔频带功率与对数梅尔功率的变化');
};

CARDS['18-parameters'] = () => {
  const h0 = head(['这六项不写下来，', '别人复现不出同一张图']);
  let s = h0.svg;
  const items = [
    ['采样率', '决定看得见的最高频率'],
    ['FFT 长度', '决定频率格有多细'],
    ['帧移', '决定时间列有多密'],
    ['梅尔频带数', '决定输出多少行'],
    ['频率上下限', '决定保留哪一段'],
    ['分贝基准', '决定颜色对应什么数值'],
  ];
  const rs = rows(6, h0.h, 88, 10);
  items.forEach(([k, v], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h);
    s += T(r.x + 24, r.y + 56, k, { size: CARD.h2, weight: 700, fill: C.blue });
    s += T(r.x + 300, r.y + 56, v, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 6 * 88 + 5 * 10 + 56;
  s += takeaway(by, '差一项，两次提取的特征就不能放在一起用。');
  return cardDoc(by + 40, s, '会改变对数梅尔频谱结果的六组参数');
};

// 19 ------------------------------------------------------------------

CARDS['19-source-filter'] = () => {
  const h0 = head(['声音 = 声带的推动', '× 声道的形状']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 300;
  const source = Array.from({ length: n }, (_, i) => (i % 22 < 3 ? 0.95 : 0.08));
  const filt = Array.from({ length: n }, (_, i) => {
    const u = i / n;
    return 0.25 + 0.7 * Math.exp(-((u - 0.14) ** 2) / 0.006) + 0.5 * Math.exp(-((u - 0.42) ** 2) / 0.012);
  });
  const out = source.map((v, i) => v * filt[i]);
  let y = h0.h;
  const ph = 132;
  [['声带：密集的尖峰', source, C.warm],
    ['声道：平滑的轮廓', filt, C.green],
    ['听到的：两者相乘', out, C.blue]].forEach(([name, vals, c]) => {
    s += T(px, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
    s += linePlot(px, y + 48, pw, ph, vals, { c, min: 0, max: 1 });
    y += 48 + ph + 30;
  });
  const by = y + 44;
  s += takeaway(by, 'MFCC 想留下的是中间那条平滑轮廓。');
  return cardDoc(by + 40, s, '声带激励、声道响应与最终频谱的关系');
};

CARDS['19-log-add'] = () => {
  const h0 = head(['取对数，', '把相乘变成相加']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const boxes = [
    ['相乘', '2 × 5 = 10', C.muted],
    ['取对数以后', 'ln 10 = ln 2 + ln 5', C.blue],
  ];
  let y = h0.h;
  boxes.forEach(([name, expr, c], i) => {
    s += plate(px, y, pw, 176, i ? C.pale : C.plate);
    s += T(px + 24, y + 56, name, { size: CARD.small, fill: C.muted });
    s += T(px + 24, y + 128, expr, { size: CARD.h1, weight: 700, fill: c });
    y += 176 + 24;
  });
  s += T(px, y + 44, '声带和声道本来是相乘的关系', { size: CARD.small, fill: C.muted });
  s += T(px, y + 96, '变成相加以后，才好把它们分开', { size: CARD.small, fill: C.muted });
  const by = y + 162;
  s += takeaway(by, '对数没有改变声音，改变的是这层关系的写法。');
  return cardDoc(by + 40, s, '数值相乘取对数后变成相加');
};

CARDS['19-dct'] = () => {
  const h0 = head(['平滑的轮廓，', '几个低阶方向就够了']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 64;
  const contour = Array.from({ length: n }, (_, i) => {
    const u = i / n;
    return 0.5 + 0.32 * Math.cos(Math.PI * u) + 0.12 * Math.cos(3 * Math.PI * u);
  });
  let y = h0.h;
  s += T(px, y + 30, '对数梅尔轮廓', { size: CARD.h2, weight: 700, fill: C.blue });
  s += linePlot(px, y + 48, pw, 150, contour, { c: C.blue, min: 0, max: 1 });
  y += 48 + 150 + 40;

  const cs = cols(2, y + 44, 170);
  [['低阶方向', (u) => Math.cos(Math.PI * u), C.green, '慢慢起伏，专管大轮廓'],
    ['高阶方向', (u) => Math.cos(8 * Math.PI * u), C.warm, '来回很快，专管细碎起伏'],
  ].forEach(([name, fn, c, note], i) => {
    const q = cs[i];
    s += T(q.x, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
    s += white(q.x, q.y, q.w, q.h);
    s += curve(q.x + 10, q.y + 10, q.w - 20, q.h - 20, (u) => 0.5 + 0.44 * fn(u), 240, { c, w: 3 });
    s += T(q.x, q.y + q.h + 46, note, { size: CARD.tick, fill: C.muted });
  });
  const by = y + 44 + 170 + 116;
  s += takeaway(by, 'DCT 本身不丢东西，丢东西的是后面只留前 13 项。');
  return cardDoc(by + 40, s, '平滑对数梅尔轮廓与低阶、高阶余弦方向的对比');
};

CARDS['19-mfcc-pipeline'] = () => {
  const h0 = head(['MFCC 的三步，', '各自解决一件事']);
  let s = h0.svg;
  const items = [
    ['梅尔汇总', '把 513 行压成 64 行', C.green],
    ['取对数', '把相乘的关系改写成相加', C.blue],
    ['DCT 换坐标', '把轮廓集中到前几项', C.warm],
    ['只留前 13 项', '这一步才真的丢信息', C.gold],
  ];
  const rs = rows(4, h0.h, 116, 16);
  items.forEach(([t, d, c], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 3 ? '#fdf6e6' : C.plate);
    s += T(r.x + 24, r.y + 54, t, { size: CARD.h2, weight: 700, fill: c });
    s += T(r.x + 24, r.y + 96, d, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 4 * 116 + 3 * 16 + 58;
  s += takeaway(by, '13 是惯例，不是定理；换个任务就该重新想。');
  return cardDoc(by + 40, s, '功率谱经梅尔汇总、对数与 DCT 后保留前十三项');
};

// 20 ------------------------------------------------------------------

const LOGMEL_VOICE = (() => {
  const { power } = melData(VOICE, { nMels: 64 });
  return power.map((row) => Float64Array.from(row, (v) => Math.log(Math.max(v, 1e-12))));
})();
const MFCC_VOICE = dctMfcc(LOGMEL_VOICE, 13);

CARDS['20-mfcc-map'] = async () => {
  const h0 = head(['13 行 MFCC，', '一列就是一帧']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const uri = await matrixPng(MFCC_VOICE, { w: Math.round(pw * 1.6), h: 300, cmap: 'viridis' });
  const py = h0.h + 10;
  s += img(uri, px, py, pw, 300);
  s += T(px - 4, py - 14, '第 13 项', { size: CARD.tick, fill: C.muted });
  s += T(px - 4, py + 300 + 42, '第 1 项　　　　时间 →', { size: CARD.tick, fill: C.muted });
  const ny = py + 300 + 100;
  s += T(px, ny, '单独一列只说明“现在在哪里”', { size: CARD.small, fill: C.muted });
  s += T(px, ny + 52, '连着好几列放一起，才看得出往哪儿变', { size: CARD.small, fill: C.muted });
  const by = ny + 118;
  s += takeaway(by, '所以下一步要算的是列与列之间的差。');
  return cardDoc(by + 40, s, '十三行 MFCC 系数随时间排列的矩阵');
};

CARDS['20-delta'] = () => {
  const h0 = head(['同一个系数，', '三种问法']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const row = Array.from(MFCC_VOICE[1]);
  const d1 = Array.from(delta([MFCC_VOICE[1]])[0]);
  const d2 = Array.from(delta(delta([MFCC_VOICE[1]]))[0]);
  let y = h0.h;
  const ph = 130;
  [['MFCC', row, C.blue, '现在在哪里'],
    ['Delta', d1, C.warm, '正在往哪边变'],
    ['Delta-Delta', d2, C.green, '变化本身在不在转向']].forEach(([name, vals, c, note]) => {
    s += T(px, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
    s += T(px + 330, y + 30, note, { size: CARD.small, fill: C.muted });
    s += linePlot(px, y + 48, pw, ph, vals, { c, zero: true });
    y += 48 + ph + 30;
  });
  const by = y + 44;
  s += takeaway(by, '三条的单位和范围都不一样，不能放同一根纵轴上比。', C.muted);
  return cardDoc(by + 40, s, '同一 MFCC 系数及其一阶与二阶差分曲线');
};

CARDS['20-boundary'] = () => {
  const h0 = head(['要不要等未来那几帧，', '结果不一样']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const N = 11;
  const bw = (pw - 40) / N;
  const draw = (y, name, lo, hi, c, note) => {
    let t = plate(px, y, pw, 216);
    t += T(px + 24, y + 56, name, { size: CARD.h2, weight: 700, fill: c });
    for (let i = 0; i < N; i += 1) {
      const on = i >= lo && i <= hi;
      const cur = i === 5;
      t += R(px + 20 + i * bw + 3, y + 80, bw - 6, 54, {
        fill: cur ? c : (on ? `${c}33` : '#fff'),
        stroke: on ? c : C.grid, sw: on ? 2.5 : 1, r: 6,
      });
    }
    t += T(px + 20 + 5 * bw + bw / 2, y + 166, '现在这一帧',
      { size: CARD.tick, weight: 700, fill: c, anchor: 'middle' });
    t += T(px + 24, y + 200, note, { size: CARD.tick, fill: C.muted });
    return t;
  };
  let y = h0.h;
  s += draw(y, '离线：左右各看几帧', 1, 9, C.blue, '结果更稳，但必须等未来的帧算完');
  y += 216 + 26;
  s += draw(y, '实时：只看当前和过去', 1, 5, C.warm, '不用等，但算出来的已经是另一个定义');
  const by = y + 216 + 60;
  s += takeaway(by, '两种都对，但别在同一个项目里混着用。');
  return cardDoc(by + 40, s, '离线居中差分与实时因果差分使用帧范围的区别');
};

CARDS['20-concat'] = () => {
  const h0 = head(['13 + 13 + 13 = 39']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const parts = [['MFCC', C.blue], ['Delta', C.warm], ['Delta-Delta', C.green]];
  let y = h0.h + 10;
  const bh = 128;
  parts.forEach(([name, c]) => {
    s += R(px, y, pw, bh, { fill: `${c}1a`, stroke: c, sw: 2.5, r: 10 });
    for (let i = 1; i < 13; i += 1) {
      s += L(px, y + (i * bh) / 13, px + pw, y + (i * bh) / 13, { c: `${c}55`, w: 1.5 });
    }
    s += T(px + 24, y + bh / 2 + 12, name, { size: CARD.h2, weight: 700, fill: c });
    s += T(px + pw - 24, y + bh / 2 + 12, '13 行',
      { size: CARD.small, weight: 700, fill: c, anchor: 'end' });
    y += bh + 14;
  });
  s += T(px, y + 56, '时间列数一个也没多，多的只是每一帧的通道',
    { size: CARD.small, fill: C.muted });
  const by = y + 122;
  s += takeaway(by, '拼接不会让录音变长，只会让每一帧变厚。');
  return cardDoc(by + 40, s, 'MFCC、Delta 与 Delta-Delta 拼成三十九维');
};

// ---------- 输出 ----------

const names = Object.keys(CARDS);
for (const name of names) {
  // eslint-disable-next-line no-await-in-loop
  writeFileSync(join(OUT, `${name}.svg`), await CARDS[name](), 'utf8');
}
console.log(`生成 ${names.length} 张卡片图 → ${OUT}`);
