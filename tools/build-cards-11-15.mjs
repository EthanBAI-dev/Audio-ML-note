#!/usr/bin/env node
// 第 11～15 课的小红书卡片版配图。
//
//   node tools/build-cards-11-15.mjs
//
// 输出 音频信号处理二十三讲/第11-15课/figures/card/
//
// 约束和 06–10 那组一样：宽 912、高 ≤ 900、最小字号 32。
// 这一组讲复数和频率轴，箭头、圆和坐标多，所以额外写了一个平面画板 plane()，
// 保证四张复数图用的是同一套坐标和同一种箭头。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readWav, resample, fft, magnitudeSpectrum, stft, mulberry32,
} from './lib/dsp.mjs';
import { spectrogramPng, colorbar } from './lib/figure.mjs';
import {
  CARD, C, cardDoc, T, MT, R, L, O, P, PATH, ARROW,
  head, rows, cols, plate, white, axisX, axisY, curve, wave,
} from './lib/card.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '音频信号处理二十三讲/', '第11-15课', 'figures', 'card');
mkdirSync(OUT, { recursive: true });

const SR = 16000;
const TAU = Math.PI * 2;

// ---------- 素材 ----------

function normalize(x) {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  return Float64Array.from(x, (v) => v / Math.max(peak, 1e-12));
}

function load(name, start = 0, dur = 2) {
  const w = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const all = resample(w.samples, w.sampleRate, SR);
  const a = Math.floor(start * SR);
  const b = Math.min(all.length, Math.floor((start + dur) * SR));
  return normalize(all.subarray(a, b));
}

const PIANO = load('piano_c.wav', 0, 2);
const VIOLIN = load('violin_c.wav', 0, 2);
const SAX = load('sax.wav', 0, 2);
const NOISE = load('noise.wav', 0.5, 2);

function synth(freqs, amps, dur = 1, phases = []) {
  return Float64Array.from({ length: Math.floor(dur * SR) }, (_, i) => {
    const t = i / SR;
    return freqs.reduce((sum, f, k) => sum + amps[k] * Math.cos(TAU * f * t + (phases[k] ?? 0)), 0);
  });
}

function chirpWithClick() {
  const n = SR * 2;
  const y = new Float64Array(n);
  const rnd = mulberry32(19);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    y[i] = 0.58 * Math.sin(TAU * (220 * t + 0.5 * 620 * t * t));
  }
  const k0 = Math.floor(1.05 * SR);
  for (let i = 0; i < 0.06 * SR; i += 1) y[k0 + i] += 0.9 * Math.exp(-i / 180) * (rnd() * 2 - 1);
  return normalize(y);
}

/** 相对分贝频谱，最高峰记为 0 dB。 */
function spectrumDb(samples, maxHz = 3500, nfft = 16384, points = 300) {
  const mag = magnitudeSpectrum(samples.subarray(0, Math.min(samples.length, nfft)), nfft);
  const maxBin = Math.min(mag.length - 1, Math.floor((maxHz * nfft) / SR));
  let peak = 0;
  for (let k = 0; k <= maxBin; k += 1) peak = Math.max(peak, mag[k]);
  const out = [];
  for (let i = 0; i < points; i += 1) {
    const k = Math.round((i / (points - 1)) * maxBin);
    out.push(Math.max(-60, 20 * Math.log10(Math.max(mag[k], 1e-12) / Math.max(peak, 1e-12))));
  }
  return out;
}

// ---------- 画板 ----------

function waveExact(x, y, w, h, values, o = {}) {
  const { c = C.blue, sw = 3, frame = true } = o;
  let s = frame ? white(x, y, w, h) + L(x + 8, y + h / 2, x + w - 8, y + h / 2, { c: C.grid }) : '';
  const pts = Array.from(values, (v, i) => [
    x + 8 + (i / (values.length - 1)) * (w - 16),
    y + h / 2 - v * (h / 2 - 8),
  ]);
  return s + P(pts, { c, w: sw });
}

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

/**
 * 复数平面。返回中心点和单位长度，四张复数图共用同一套坐标，
 * 读者换一张图不需要重新找原点在哪。
 */
function plane(x, y, w, h, o = {}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const unit = Math.min(w, h) / 2 - 34;
  let s = white(x, y, w, h);
  s += L(x + 14, cy, x + w - 14, cy, { c: C.grid, w: 2 });
  s += L(cx, y + 14, cx, y + h - 14, { c: C.grid, w: 2 });
  if (o.circle) {
    s += `<circle cx="${cx}" cy="${cy}" r="${unit}" fill="none" stroke="${C.grid}" `
      + 'stroke-width="2" stroke-dasharray="8 8"/>';
  }
  return { s, cx, cy, unit };
}

/** 从原点指向 (vx, vy) 的箭头，vx / vy 以单位长度计。 */
function vec(p, vx, vy, o = {}) {
  const { c = C.blue, w = 4, label = '' } = o;
  const ex = p.cx + vx * p.unit;
  const ey = p.cy - vy * p.unit;
  let s = ARROW(p.cx, p.cy, ex, ey, { c, w, head: 18 });
  if (label) {
    s += T(ex + (vx >= 0 ? 14 : -14), ey - 14, label,
      { size: CARD.small, weight: 700, fill: c, anchor: vx >= 0 ? 'start' : 'end' });
  }
  return s;
}

const takeaway = (y, text, color = C.warm) =>
  T(CARD.pad, y, text, { size: CARD.body, weight: 700, fill: color });

const CARDS = {};

// 11 ------------------------------------------------------------------

CARDS['11-audio-coordinate'] = () => {
  const h0 = head(['一样强，', '但不是同时开始']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 480;
  const a = Array.from({ length: n }, (_, i) => 0.85 * Math.sin((TAU * 4 * i) / n));
  const b = Array.from({ length: n }, (_, i) => 0.85 * Math.sin((TAU * 4 * i) / n - 1.9));
  const py = h0.h + 10; const ph = 280;
  s += white(px, py, pw, ph);
  s += waveExact(px, py, pw, ph, a, { c: C.blue, frame: false });
  s += waveExact(px, py, pw, ph, b, { c: C.warm, frame: false });

  const ly = py + ph + 76;
  s += L(px, ly - 10, px + 54, ly - 10, { c: C.blue, w: 5 });
  s += T(px + 68, ly, '先开始的那一段', { size: CARD.small });
  s += L(px, ly + 46, px + 54, ly + 46, { c: C.warm, w: 5 });
  s += T(px + 68, ly + 56, '晚一点开始，高度一模一样', { size: CARD.small });
  const by = ly + 122;
  s += takeaway(by, '只记强弱不够，还得记它从哪里起步。');
  return cardDoc(by + 40, s, '强弱相同但起始位置不同的两段周期振动');
};

CARDS['11-cartesian-polar'] = () => {
  const h0 = head(['同一个箭头，', '两种读法']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 430);
  const modes = [
    ['横 3，纵 4', C.blue, '按格子走：先横 3 再纵 4'],
    ['长 5，转约 53°', C.green, '按长度和方向：直接指过去'],
  ];
  modes.forEach(([name, c, note], i) => {
    const q = cs[i];
    s += T(q.x + 8, q.y + 40, name, { size: CARD.h2, weight: 700, fill: c });
    const p = plane(q.x, q.y + 58, q.w, 290);
    s += p.s;
    if (i === 0) {
      s += L(p.cx, p.cy, p.cx + 0.6 * p.unit, p.cy, { c: C.grid, w: 4, dash: '9 7' });
      s += L(p.cx + 0.6 * p.unit, p.cy, p.cx + 0.6 * p.unit, p.cy - 0.8 * p.unit,
        { c: C.grid, w: 4, dash: '9 7' });
    } else {
      s += `<path d="M${p.cx + 46} ${p.cy} A46 46 0 0 0 ${(p.cx + 46 * Math.cos(0.927)).toFixed(1)} `
        + `${(p.cy - 46 * Math.sin(0.927)).toFixed(1)}" fill="none" stroke="${C.green}" stroke-width="3"/>`;
    }
    s += vec(p, 0.6, 0.8, { c, label: '' });
    s += T(q.x + 8, q.y + 400, note, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 430 + 52;
  s += takeaway(by, '同一个箭头，没多也没少，只是换了说法。');
  return cardDoc(by + 40, s, '复数 3+4i 的坐标读法与长度方向读法');
};

CARDS['11-unit-circle'] = () => {
  const h0 = head(['转圈的影子，', '就是正弦和余弦']);
  let s = h0.svg;
  const ang = 1.047;  // 60°
  const pw = 340;
  const p = plane(CARD.pad, h0.h, pw, 340, { circle: true });
  s += p.s;
  s += vec(p, Math.cos(ang), Math.sin(ang), { c: C.ink });
  const ex = p.cx + Math.cos(ang) * p.unit;
  const ey = p.cy - Math.sin(ang) * p.unit;
  s += L(ex, ey, ex, p.cy, { c: C.warm, w: 4, dash: '9 7' });
  s += L(ex, ey, p.cx, ey, { c: C.blue, w: 4, dash: '9 7' });
  s += T(CARD.pad + 4, h0.h + 372, '箭头转到 60°', { size: CARD.small, fill: C.muted });

  const rx = CARD.pad + pw + 34;
  const rw = CARD.W - rx - CARD.pad;
  const n = 300;
  const cosV = Array.from({ length: n }, (_, i) => Math.cos((TAU * 1.2 * i) / n));
  const sinV = Array.from({ length: n }, (_, i) => Math.sin((TAU * 1.2 * i) / n));
  s += T(rx, h0.h + 26, '横着的影子 = 余弦', { size: CARD.small, weight: 700, fill: C.warm });
  s += waveExact(rx, h0.h + 40, rw, 128, cosV, { c: C.warm });
  s += T(rx, h0.h + 218, '竖着的影子 = 正弦', { size: CARD.small, weight: 700, fill: C.blue });
  s += waveExact(rx, h0.h + 232, rw, 128, sinV, { c: C.blue });

  const by = h0.h + 430;
  s += takeaway(by, '正弦不是凭空来的，是一个匀速转圈落下的影子。');
  return cardDoc(by + 40, s, '单位圆上旋转箭头的横纵投影形成余弦与正弦');
};

CARDS['11-scale-rotate'] = () => {
  const h0 = head(['复数乘法只做两件事：', '拉长，转向']);
  let s = h0.svg;
  const p = plane(CARD.pad, h0.h, CARD.W - CARD.pad * 2, 400, { circle: true });
  s += p.s;
  s += vec(p, 0.52, 0.30, { c: C.blue, w: 5 });
  s += vec(p, 0.88, 0.51, { c: C.warm, w: 5 });
  const r = Math.hypot(0.52, 0.30); const a0 = Math.atan2(0.30, 0.52);
  s += vec(p, r * Math.cos(a0 + 1.15), r * Math.sin(a0 + 1.15), { c: C.green, w: 5 });

  const ly = h0.h + 400 + 62;
  s += L(CARD.pad, ly - 10, CARD.pad + 54, ly - 10, { c: C.blue, w: 6 });
  s += T(CARD.pad + 68, ly, '原来的箭头', { size: CARD.small });
  s += L(CARD.pad, ly + 46, CARD.pad + 54, ly + 46, { c: C.warm, w: 6 });
  s += T(CARD.pad + 68, ly + 56, '只变长，方向没动', { size: CARD.small });
  s += L(CARD.pad, ly + 92, CARD.pad + 54, ly + 92, { c: C.green, w: 6 });
  s += T(CARD.pad + 68, ly + 102, '只转向，长度没变', { size: CARD.small });
  const by = ly + 164;
  s += takeaway(by, '一堆代数，画在平面上就是这两个动作。');
  return cardDoc(by + 40, s, '复数乘法对应箭头的缩放与旋转');
};

// 12 ------------------------------------------------------------------

CARDS['12-two-probes'] = () => {
  const h0 = head(['一根探针不够，', '要横竖各来一根']);
  let s = h0.svg;
  const n = 420;
  const sig = Array.from({ length: n }, (_, i) => Math.sin((TAU * 5 * i) / n));
  const cs = cols(2, h0.h, 440);
  [['用余弦去测', (i) => Math.cos((TAU * 5 * i) / n), '正负几乎抵消', '平均 ≈ 0.00', C.warm],
    ['用正弦去测', (i) => Math.sin((TAU * 5 * i) / n), '大多留在零线上方', '平均 ≈ 0.50', C.blue],
  ].forEach(([name, probe, note, avg, c], i) => {
    const q = cs[i];
    const prod = sig.map((v, k) => v * probe(k));
    s += plate(q.x, q.y, q.w, q.h);
    s += T(q.x + 22, q.y + 52, name, { size: CARD.h2, weight: 700, fill: c });
    s += waveExact(q.x + 18, q.y + 76, q.w - 36, 200, prod, { c });
    s += T(q.x + 22, q.y + 328, note, { size: CARD.small, fill: C.muted });
    s += T(q.x + 22, q.y + 394, avg, { size: CARD.h2, weight: 700, fill: c });
  });
  const by = h0.h + 440 + 58;
  s += takeaway(by, '同一个频率，换一根探针结果完全不同——所以要两根。');
  return cardDoc(by + 40, s, '同一振动分别与余弦和正弦测试波相乘的结果');
};

CARDS['12-coefficient'] = () => {
  const h0 = head(['两根探针的结果，', '合成一个复数']);
  let s = h0.svg;
  const p = plane(CARD.pad, h0.h, 420, 380);
  s += p.s;
  s += L(p.cx, p.cy, p.cx + 0.6 * p.unit, p.cy, { c: C.grid, w: 4, dash: '9 7' });
  s += L(p.cx + 0.6 * p.unit, p.cy, p.cx + 0.6 * p.unit, p.cy + 0.8 * p.unit,
    { c: C.grid, w: 4, dash: '9 7' });
  s += vec(p, 0.6, -0.8, { c: C.blue, w: 5 });

  const rx = CARD.pad + 420 + 40;
  const items = [
    ['横向结果', '6', C.warm],
    ['纵向结果', '-8', C.blue],
    ['合起来', '6 − 8i', C.ink],
    ['也可以读成', '强度 10，方向约 −53°', C.green],
  ];
  items.forEach(([k, v, c], i) => {
    const y = h0.h + 22 + i * 92;
    s += T(rx, y + 34, k, { size: CARD.small, fill: C.muted });
    s += T(rx, y + 78, v, { size: i === 3 ? CARD.small : CARD.h2, weight: 700, fill: c });
  });
  const by = h0.h + 380 + 66;
  s += takeaway(by, '一个复数同时装下了「有多强」和「从哪儿起步」。');
  return cardDoc(by + 40, s, '横纵两个结果合成一个复数系数');
};

CARDS['12-wrapping'] = () => {
  const h0 = head(['试探频率对不对，', '看重心跑不跑得出去']);
  let s = h0.svg;
  const N = 600;
  const g = (i) => 1 + Math.cos((TAU * 5 * i) / N);
  const cs = cols(2, h0.h, 430);
  [[6.25, '用 6.25 Hz 去试', '重心还窝在中心', C.muted],
    [5, '用 5 Hz 去试', '重心明显甩出去了', C.warm],
  ].forEach(([f, name, note, dotColor], i) => {
    const q = cs[i];
    s += T(q.x + 8, q.y + 40, name, { size: CARD.h2, weight: 700, fill: i ? C.warm : C.blue });
    const p = plane(q.x, q.y + 58, q.w, 300);
    s += p.s;
    const pts = [];
    let sx = 0; let sy = 0;
    for (let k = 0; k < N; k += 1) {
      const a = (TAU * f * k) / N;
      const vx = g(k) * Math.cos(a);
      const vy = -g(k) * Math.sin(a);
      sx += vx; sy += vy;
      pts.push([p.cx + (vx / 2.2) * p.unit, p.cy - (vy / 2.2) * p.unit]);
    }
    s += P(pts, { c: C.blue, w: 2.2 });
    const mx = (sx / N / 2.2) * p.unit;
    const my = (sy / N / 2.2) * p.unit;
    s += O(p.cx + mx, p.cy - my, 13, { fill: dotColor === C.muted ? '#7b8794' : C.warm });
    s += T(q.x + 8, q.y + 404, note, { size: CARD.small, fill: C.muted });
  });
  const by = h0.h + 430 + 52;
  s += takeaway(by, '那个点离中心多远，就是这个频率有多强。');
  return cardDoc(by + 40, s, '试探频率不匹配与匹配时平面轨迹重心的差别');
};

CARDS['12-roundtrip'] = () => {
  const h0 = head(['把起始位置扔掉，', '波形就回不来了']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const n = 480;
  const orig = Array.from({ length: n }, (_, i) =>
    (Math.cos((TAU * 3 * i) / n + 1.1) + 0.6 * Math.cos((TAU * 7 * i) / n - 0.7)) / 1.6);
  const zeroed = Array.from({ length: n }, (_, i) =>
    (Math.cos((TAU * 3 * i) / n) + 0.6 * Math.cos((TAU * 7 * i) / n)) / 1.6);
  let y = h0.h;
  const ph = 138;
  [['原来的波形', orig, C.blue, ''],
    ['保留起始位置后重建', orig, C.green, '和原来完全重合'],
    ['把起始位置清零后重建', zeroed, C.warm, '峰一样高，但位置全变了'],
  ].forEach(([name, vals, c, note]) => {
    s += T(px, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
    if (note) s += T(px + 500, y + 30, note, { size: CARD.small, fill: C.muted });
    s += waveExact(px, y + 48, pw, ph, vals, { c });
    y += 48 + ph + 30;
  });
  const by = y + 44;
  s += takeaway(by, '强度对了不代表还原对了，相位不能扔。');
  return cardDoc(by + 40, s, '保留相位与相位清零后的波形重建对比');
};

// 13 ------------------------------------------------------------------

CARDS['13-sample-grid'] = () => {
  const h0 = head(['电脑手里只有', '这一排点']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const py = h0.h + 10; const ph = 300;
  s += white(px, py, pw, ph);
  const f = (u) => Math.sin(TAU * 1.6 * u) * 0.8;
  const cont = Array.from({ length: 400 }, (_, i) => f(i / 399));
  s += waveExact(px, py, pw, ph, cont, { c: '#c3cdd6', sw: 4, frame: false });
  const N = 16;
  for (let i = 0; i < N; i += 1) {
    const u = i / (N - 1);
    const x = px + 8 + u * (pw - 16);
    const yy = py + ph / 2 - f(u) * (ph / 2 - 8);
    s += L(x, py + ph / 2, x, yy, { c: '#9fb4c6', w: 2 });
    s += O(x, yy, 10, { fill: C.blue });
  }
  const ly = py + ph + 76;
  s += L(px, ly - 10, px + 54, ly - 10, { c: '#c3cdd6', w: 6 });
  s += T(px + 68, ly, '灰线：想象中的连续变化', { size: CARD.small, fill: C.muted });
  s += O(px + 22, ly + 36, 10, { fill: C.blue });
  s += T(px + 68, ly + 46, '蓝点：真正存下来的 16 个数', { size: CARD.small });
  const by = ly + 112;
  s += takeaway(by, '有几个点，就只能问出几个频率。');
  return cardDoc(by + 40, s, '连续曲线被记录成有限个离散样本');
};

CARDS['13-bases'] = () => {
  const h0 = head(['8 个样本，', '只有 8 种转法']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 262);
  const cs2 = cols(2, h0.h + 262 + 24, 262);
  const slots = [cs[0], cs[1], cs2[0], cs2[1]];
  const notes = ['不转', '整段转 1 圈', '整段转 2 圈', '整段转 3 圈'];
  slots.forEach((q, k) => {
    const p = plane(q.x, q.y, q.w, q.h, { circle: true });
    s += p.s;
    // k 和 8 不互质时，8 个点会落在同一批位置上重叠——这正是要看的现象
    for (let n = 0; n < 8; n += 1) {
      const a = (-TAU * k * n) / 8;
      s += O(p.cx + p.unit * Math.cos(a), p.cy - p.unit * Math.sin(a), 9,
        { fill: [C.blue, C.warm, C.green, C.gold][k] });
    }
    s += T(q.x + 14, q.y + 44, `k = ${k}`, { size: CARD.small, weight: 700 });
    s += T(q.x + q.w - 14, q.y + 44, notes[k],
      { size: CARD.tick, fill: C.muted, anchor: 'end' });
  });
  const by = h0.h + 262 * 2 + 24 + 58;
  s += takeaway(by, 'k = 0 那张 8 个点全叠在一起，因为它根本没转。', C.muted);
  return cardDoc(by + 40, s, '八个样本位置上的前四种离散旋转方式');
};

CARDS['13-frequency-bins'] = () => {
  const h0 = head(['频率格是算出来的，', '不是随便挑的']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const rs = rows(2, h0.h, 104, 14);
  [['采样率 8000 Hz　·　样本数 16', '两者一除，间隔就定了'],
    ['间隔 = 8000 ÷ 16 = 500 Hz', '0 到 4000 Hz 之间正好 9 个位置'],
  ].forEach(([a, b], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i ? C.pale : C.plate);
    s += T(r.x + 24, r.y + 50, a, { size: CARD.small, weight: 700, fill: i ? C.warm : C.ink });
    s += T(r.x + 24, r.y + 90, b, { size: CARD.tick, fill: C.muted });
  });

  const ay = h0.h + 2 * 104 + 14 + 76;
  s += L(px + 20, ay, px + pw - 20, ay, { c: C.grid, w: 3 });
  for (let i = 0; i <= 8; i += 1) {
    const x = px + 20 + (i / 8) * (pw - 40);
    s += L(x, ay - 18, x, ay + 18, { c: C.blue, w: 4 });
    if (i % 2 === 0) {
      s += T(x, ay + 58, String(i * 500), { size: CARD.tick, fill: C.muted, anchor: 'middle' });
    }
  }
  const by = ay + 122;
  s += takeaway(by, '想让格子更细，只能拉长录音，不能换个算法。');
  return cardDoc(by + 40, s, '采样率 8000 Hz、16 个样本对应的非负频率格');
};

CARDS['13-symmetry'] = () => {
  const h0 = head(['后一半是镜像，', '所以只看前一半']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const py = h0.h + 10; const ph = 280;
  s += white(px, py, pw, ph);
  const N = 16;
  const halfVals = [0.1, 0.25, 0.9, 0.4, 0.2, 0.55, 0.15, 0.3, 0.12];
  const bw = (pw - 40) / N;
  for (let k = 0; k < N; k += 1) {
    const v = k <= N / 2 ? halfVals[k] : halfVals[N - k];
    const mirrored = k > N / 2;
    const x = px + 20 + k * bw;
    s += R(x + 3, py + ph - 20 - v * (ph - 46), bw - 6, v * (ph - 46),
      { fill: mirrored ? C.pale : C.blue, stroke: mirrored ? C.blue : 'none', sw: 2, r: 4 });
  }
  const mx = px + 20 + (N / 2) * bw;
  s += L(mx, py + 10, mx, py + ph - 10, { c: C.warm, w: 4, dash: '10 8' });
  s += T(mx + 14, py + 44, '采样率的一半', { size: CARD.tick, weight: 700, fill: C.warm });

  const ly = py + ph + 74;
  s += T(px, ly, '实心：真正要看的 9 个结果', { size: CARD.small, fill: C.blue, weight: 700 });
  s += T(px, ly + 50, '空心：前一半的镜像，没有新信息', { size: CARD.small, fill: C.muted });
  const by = ly + 116;
  s += takeaway(by, '所以 rfft 只给 N/2+1 个数，不是偷工减料。');
  return cardDoc(by + 40, s, '真实音频完整 DFT 前后两半的镜像关系');
};

// 14 ------------------------------------------------------------------

CARDS['14-frequency-axis'] = () => {
  const h0 = head(['数组位置不是频率，', '换算过才是']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 300);
  [['只知道数组位置', 'k = 41', '这是第几个格子，不是赫兹', C.muted],
    ['换算之后', '441.4 Hz', 'k × 采样率 ÷ FFT 长度', C.blue],
  ].forEach(([name, val, note, c], i) => {
    const q = cs[i];
    s += plate(q.x, q.y, q.w, q.h, i ? C.pale : C.plate);
    s += T(q.x + 24, q.y + 56, name, { size: CARD.small, fill: C.muted });
    s += T(q.x + 24, q.y + 140, val, { size: CARD.h1, weight: 700, fill: i ? C.blue : C.ink });
    s += T(q.x + 24, q.y + 216, note, { size: CARD.tick, fill: c });
  });
  s += ARROW(CARD.pad + cs[0].w + 4, h0.h + 150, cs[1].x - 4, h0.h + 150, { c: C.warm, w: 4, head: 16 });

  const ry = h0.h + 300 + 56;
  s += plate(CARD.pad, ry, CARD.W - CARD.pad * 2, 152, C.plate);
  s += T(CARD.pad + 24, ry + 60, '41 × 16000 ÷ 1486', { size: CARD.h2, weight: 700 });
  s += T(CARD.pad + 24, ry + 116, '采样率和 FFT 长度都得知道，少一个都换不出来',
    { size: CARD.tick, fill: C.muted });
  const by = ry + 152 + 56;
  s += takeaway(by, '图上不写单位，读者就只能猜。');
  return cardDoc(by + 40, s, 'FFT 数组位置换算成真实赫兹频率');
};

CARDS['14-normalization'] = () => {
  const h0 = head(['同样的声音录得久一点，', '模值就翻倍']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const groups = [
    ['原始 FFT 模值', [['录 1 秒', 0.5, '8000'], ['录 2 秒', 1.0, '16000']], C.warm, '录得越久数越大，没法比'],
    ['按样本数归一化后', [['录 1 秒', 0.7, '0.70'], ['录 2 秒', 0.7, '0.70']], C.green, '回到真实振幅，可以比了'],
  ];
  let y = h0.h;
  groups.forEach(([name, bars, c, note]) => {
    s += T(px, y + 32, name, { size: CARD.h2, weight: 700, fill: c });
    const bw = 300; const bh = 132;
    bars.forEach(([lab, frac, val], i) => {
      const bx = px + i * (bw + 40);
      s += white(bx, y + 50, bw, bh);
      s += R(bx + 10, y + 50 + bh - 10 - frac * (bh - 20), bw - 20, frac * (bh - 20),
        { fill: c, stroke: 'none', r: 6 });
      s += T(bx + bw / 2, y + 50 + bh + 46, `${lab}　${val}`,
        { size: CARD.tick, fill: C.muted, anchor: 'middle' });
    });
    s += T(px, y + 50 + bh + 100, note, { size: CARD.small, fill: C.muted });
    y += 50 + bh + 140;
  });
  const by = y + 20;
  s += takeaway(by, '不归一化，两段录音的高低根本没有可比性。');
  return cardDoc(by + 40, s, '相同振幅不同样本数的 FFT 原始模值与归一化幅值');
};

CARDS['14-instruments'] = () => {
  const h0 = head(['三件乐器的频谱轮廓']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  let y = h0.h;
  const ph = 122;
  [['钢琴', PIANO, C.blue], ['小提琴', VIOLIN, C.warm], ['萨克斯', SAX, C.green]]
    .forEach(([name, src, c]) => {
      s += T(px, y + 30, name, { size: CARD.h2, weight: 700, fill: c });
      s += linePlot(px, y + 48, pw, ph, spectrumDb(src), { c, min: -60, max: 0 });
      y += 48 + ph + 30;
    });
  s += axisX(px + 8, y + 4, pw - 16, [[0, '0'], [1750, '1750'], [3500, '3500']], 0, 3500, { unit: 'Hz' });
  const by = y + 128;
  s += takeaway(by, '各自把最高峰当 0 dB，所以只能比形状，不能比谁响。', C.muted);
  return cardDoc(by + 40, s, '钢琴、小提琴与萨克斯录音的相对分贝频谱');
};

CARDS['14-tone-noise'] = () => {
  const h0 = head(['有调子的声音和噪声，', '频谱长得不一样']);
  let s = h0.svg;
  const tone = synth([440, 880], [0.7, 0.35], 1);
  const cs = cols(2, h0.h, 400);
  [['两个音叠起来', tone, '只在两处突起', C.blue],
    ['真实噪声', NOISE, '到处都有一点', C.warm],
  ].forEach(([name, src, note, c], i) => {
    const q = cs[i];
    s += plate(q.x, q.y, q.w, q.h);
    s += T(q.x + 22, q.y + 52, name, { size: CARD.h2, weight: 700, fill: c });
    s += linePlot(q.x + 18, q.y + 76, q.w - 36, 200, spectrumDb(src, 1600), { c, min: -60, max: 0 });
    s += T(q.x + 22, q.y + 330, note, { size: CARD.small, fill: C.muted });
    s += T(q.x + 22, q.y + 376, '0 – 1600 Hz', { size: CARD.tick, fill: C.muted });
  });
  const by = h0.h + 400 + 58;
  s += takeaway(by, '一个该找峰在哪，一个只能看整体分布。');
  return cardDoc(by + 40, s, '双频正弦与真实噪声的频谱分布比较');
};

// 15 ------------------------------------------------------------------

CARDS['15-what-when'] = () => {
  const h0 = head(['成分一样，', '顺序不一样']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 300);
  [['先低后高', [[0, 0.62], [1, 0.22]], C.blue],
    ['先高后低', [[0, 0.22], [1, 0.62]], C.warm],
  ].forEach(([name, blocks, c], i) => {
    const q = cs[i];
    s += T(q.x + 8, q.y + 40, name, { size: CARD.h2, weight: 700, fill: c });
    const gx = q.x; const gy = q.y + 58; const gw = q.w; const gh = 200;
    s += white(gx, gy, gw, gh);
    blocks.forEach(([half, level]) => {
      s += R(gx + 12 + half * ((gw - 24) / 2), gy + gh - 16 - level * (gh - 40),
        (gw - 24) / 2 - 8, 34, { fill: c, stroke: 'none', r: 6 });
    });
    s += T(gx + 4, gy + gh + 46, '↑ 高低　→ 时间', { size: CARD.tick, fill: C.muted });
  });

  const sy = h0.h + 300 + 20;
  s += plate(CARD.pad, sy, CARD.W - CARD.pad * 2, 176, C.plate);
  s += T(CARD.pad + 24, sy + 56, '整段汇总的频谱：两边一模一样',
    { size: CARD.small, weight: 700 });
  s += T(CARD.pad + 24, sy + 112, '因为它只统计有什么，不记什么时候',
    { size: CARD.small, fill: C.muted });
  const by = sy + 176 + 56;
  s += takeaway(by, '想回答“什么时候”，就得一小段一小段地看。');
  return cardDoc(by + 40, s, '频率成分相同但出现顺序相反的两段声音');
};

CARDS['15-stft-process'] = () => {
  const h0 = head(['声谱图是', '一列一列拼出来的']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const items = [
    ['选出一小段', '窗口框住一段短到几乎不变的声音'],
    ['算这一段的频率', '得到一列数：这一段里各频率有多强'],
    ['窗口往前挪一步', '每挪一次多一列，拼起来就是矩阵'],
  ];
  const rs = rows(3, h0.h, 128, 18);
  items.forEach(([t, d], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 2 ? C.pale : C.plate);
    s += O(r.x + 46, r.y + 46, 26, { fill: C.blue });
    s += T(r.x + 46, r.y + 58, String(i + 1),
      { size: CARD.small, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(r.x + 92, r.y + 56, t, { size: CARD.h2, weight: 700 });
    s += T(r.x + 92, r.y + 102, d, { size: CARD.small, fill: C.muted });
  });
  const my = h0.h + 3 * 128 + 2 * 18 + 30;
  const cols8 = 14;
  for (let k = 0; k < cols8; k += 1) {
    const bx = px + k * ((pw - 0) / cols8);
    for (let r = 0; r < 4; r += 1) {
      const v = 0.2 + 0.75 * Math.abs(Math.sin(k * 0.7 + r * 1.3));
      s += R(bx + 2, my + r * 30, (pw / cols8) - 4, 26,
        { fill: `rgba(8,120,185,${v.toFixed(2)})`, stroke: 'none', r: 3 });
    }
  }
  s += T(px, my + 4 * 30 + 46, '横着是时间，竖着是频率', { size: CARD.small, fill: C.muted });
  const by = my + 4 * 30 + 106;
  s += takeaway(by, '窗口没滑到的地方，那一列就还不存在。');
  return cardDoc(by + 40, s, 'STFT 从移动窗口到时频矩阵的三个步骤');
};

CARDS['15-output-shape'] = () => {
  const h0 = head(['输出有多少行多少列，', '都是算出来的']);
  let s = h0.svg;
  const items = [
    ['录音', '10000 个样本', C.blue],
    ['每帧', '1000 个样本', C.warm],
    ['每次前进', '500 个样本', C.green],
    ['得到', '501 行 × 19 列', C.gold],
  ];
  const rs = rows(4, h0.h, 108, 14);
  items.forEach(([k, v, c], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 3 ? '#fdf6e6' : C.plate);
    s += T(r.x + 24, r.y + 66, k, { size: CARD.small, fill: C.muted });
    s += T(r.x + r.w - 24, r.y + 66, v, { size: CARD.h2, weight: 700, fill: c, anchor: 'end' });
  });
  const ny = h0.h + 4 * 108 + 3 * 14 + 40;
  s += T(CARD.pad, ny + 40, '501 = 1000 ÷ 2 + 1', { size: CARD.small, fill: C.muted });
  s += T(CARD.pad, ny + 92, '19 = 装得下的完整帧数', { size: CARD.small, fill: C.muted });
  const by = ny + 156;
  s += takeaway(by, '先算清形状，再动手写代码，能省掉一半调试。');
  return cardDoc(by + 40, s, '一万样本经一千点窗口、五百点帧移得到的矩阵尺寸');
};

CARDS['15-tradeoff'] = async () => {
  const h0 = head(['窗短看得准时间，', '窗长看得清频率']);
  let s = h0.svg;
  const px = CARD.pad; const pw = CARD.W - CARD.pad * 2;
  const sig = chirpWithClick();
  const configs = [[256, 64, '短窗 16 ms', '敲击那一下位置很准，但频带糊', C.blue],
    [1024, 256, '长窗 64 ms', '频率线细了，敲击却被横向抹开', C.warm]];
  let y = h0.h;
  for (const [nfft, hop, name, note, c] of configs) {
    const S = stft(sig, SR, { nfft, hop });
    // eslint-disable-next-line no-await-in-loop
    const uri = await spectrogramPng(S, {
      w: Math.round(pw * 1.6), h: 400, fmax: 2000, dbFloor: -48, cmap: 'magma',
    });
    s += T(px, y + 34, name, { size: CARD.h2, weight: 700, fill: c });
    s += `<image href="${uri}" x="${px}" y="${y + 50}" width="${pw}" height="176" `
      + 'preserveAspectRatio="none"/>';
    s += R(px, y + 50, pw, 176, { fill: 'none', stroke: C.grid, r: 0 });
    s += T(px, y + 50 + 176 + 44, note, { size: CARD.small, fill: C.muted });
    y += 50 + 176 + 68;
  }
  s += colorbar(px, y + 6, 200, 18, 'magma', { lo: '弱', hi: '强', size: CARD.tick });
  const by = y + 96;
  s += takeaway(by, '两个都想要是做不到的，只能按任务挑。');
  return cardDoc(by + 40, s, '16 ms 与 64 ms 窗口生成的 STFT 声谱图比较');
};

// ---------- 输出 ----------

const names = Object.keys(CARDS);
for (const name of names) {
  // eslint-disable-next-line no-await-in-loop
  writeFileSync(join(OUT, `${name}.svg`), await CARDS[name](), 'utf8');
}
console.log(`生成 ${names.length} 张卡片图 → ${OUT}`);
