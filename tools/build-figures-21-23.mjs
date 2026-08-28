#!/usr/bin/env node
// 为零基础版第 21～23 课生成知识图；桌面版与手机版使用同一份真实计算结果。

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, stft } from './lib/dsp.mjs';
import { svgDoc, T, R, L, P, spectrogramPng, image, PALETTE } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_21-23', 'figures');
const SR = 16000;
const NFFT = 1024;
const HOP = 256;
const SPLIT = 2000;
const [BLUE, ORANGE, GREEN, GOLD] = [PALETTE.s1, PALETTE.s2, PALETTE.s3, PALETTE.s4];
const { ink: INK, muted: MUTED, grid: GRID, plate: PLATE } = PALETTE;
const MODES = {
  desktop: { name: 'desktop', W: 880, pad: 30, gap: 22, title: 22, body: 15, small: 13.5 },
  mobile: { name: 'mobile', W: 420, pad: 20, gap: 18, title: 18, body: 15, small: 14 },
};
const wide = (M) => M.name === 'desktop';
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function MT(x, y, lines, o = {}) {
  const { size = 15, weight = 400, fill = INK, leading = Math.round(size * 1.45), anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines.map((v, i) => `<tspan x="${x}" dy="${i ? leading : 0}">${esc(v)}</tspan>`).join('')}</text>`;
}
const card = (x, y, w, h, fill = '#fff') => R(x, y, w, h, { fill, stroke: GRID, sw: 1, r: 7 });
const header = (M, lines) => MT(M.pad, 31, lines, { size: M.title, weight: 700, leading: 27 });
const headerH = (M, lines) => 44 + (lines.length - 1) * 27;
function slots(M, count, desktopCols, height) {
  const cols = wide(M) ? desktopCols : 1;
  const width = (M.W - M.pad * 2 - M.gap * (cols - 1)) / cols;
  return Array.from({ length: count }, (_, i) => ({
    x: M.pad + (i % cols) * (width + M.gap),
    y: Math.floor(i / cols) * (height + M.gap), w: width, h: height,
  }));
}
function arrow(x1, y1, x2, y2, c = MUTED) {
  const a = Math.atan2(y2 - y1, x2 - x1); const z = 7;
  return L(x1, y1, x2, y2, { c, w: 1.6 }) + `<polygon points="${x2},${y2} ${x2 - z * Math.cos(a - .5)},${y2 - z * Math.sin(a - .5)} ${x2 - z * Math.cos(a + .5)},${y2 - z * Math.sin(a + .5)}" fill="${c}"/>`;
}
function normalize(y) {
  let peak = 0; for (const v of y) peak = Math.max(peak, Math.abs(v));
  return Float64Array.from(y, (v) => v / Math.max(peak, 1e-12));
}
function load(name) {
  const w = readWav(join(ROOT, 'source_course', 'audio_resources', name));
  const y = resample(w.samples, w.sampleRate, SR); const a = 4 * SR;
  return normalize(y.subarray(a, Math.min(y.length, a + 3.2 * SR)));
}
const TRACKS = [
  ['古典片段', load('debussy.wav'), BLUE],
  ['摇滚片段', load('redhot.wav'), ORANGE],
  ['爵士片段', load('duke.wav'), GREEN],
];
function features(y) {
  const S = stft(y, SR, { nfft: NFFT, hop: HOP });
  const freq = Float64Array.from({ length: S.bins }, (_, k) => k * SR / NFFT);
  const splitBin = freq.findIndex((f) => f >= SPLIT);
  const berDb = new Float64Array(S.frames); const centroid = new Float64Array(S.frames); const bandwidth = new Float64Array(S.frames);
  for (let t = 0; t < S.frames; t += 1) {
    let lo = 0; let hi = 0; let m0 = 0; let m1 = 0;
    for (let k = 0; k < S.bins; k += 1) {
      const m = S.mag[t * S.bins + k]; const p = m * m;
      if (k < splitBin) lo += p; else hi += p;
      m0 += m; m1 += freq[k] * m;
    }
    berDb[t] = 10 * Math.log10((lo + 1e-12) / (hi + 1e-12));
    centroid[t] = m1 / Math.max(m0, 1e-12);
    let d2 = 0; for (let k = 0; k < S.bins; k += 1) d2 += S.mag[t * S.bins + k] * (freq[k] - centroid[t]) ** 2;
    bandwidth[t] = Math.sqrt(d2 / Math.max(m0, 1e-12));
  }
  return { S, freq, splitBin, berDb, centroid, bandwidth };
}
const DATA = TRACKS.map(([name, y, c]) => [name, features(y), c]);
function curve(x, y, w, h, values, min, max, c, zero = false) {
  let s = card(x, y, w, h);
  const px = (i) => x + 9 + i / Math.max(1, values.length - 1) * (w - 18);
  const py = (v) => y + 9 + (1 - (Math.max(min, Math.min(max, v)) - min) / (max - min)) * (h - 18);
  if (zero && min <= 0 && max >= 0) s += L(x + 7, py(0), x + w - 7, py(0), { c: GRID, dash: '4 4' });
  s += P(Array.from(values, (v, i) => [px(i), py(v)]), { c, w: 1.8 });
  return s;
}
function spectrum(x, y, w, h, values, color = BLUE, maxF = 6000) {
  const peak = Math.max(...values, 1e-9); const n = Math.min(values.length, Math.floor(maxF / (SR / NFFT)) + 1);
  const pts = Array.from({ length: n }, (_, i) => [x + i / (n - 1) * w, y + h - values[i] / peak * h]);
  return P(pts, { c: color, w: 2 });
}
function synthetic(peaks) {
  return Float64Array.from({ length: NFFT / 2 + 1 }, (_, k) => {
    const f = k * SR / NFFT;
    return peaks.reduce((s, [mu, sigma, amp]) => s + amp * Math.exp(-.5 * ((f - mu) / sigma) ** 2), 0);
  });
}
function weightedStats(v, power = false) {
  let z = 0; let zf = 0; for (let k = 0; k < v.length; k += 1) { const w = power ? v[k] ** 2 : v[k]; z += w; zf += w * k * SR / NFFT; }
  const c = zf / z; let d2 = 0; for (let k = 0; k < v.length; k += 1) { const w = power ? v[k] ** 2 : v[k]; d2 += w * (k * SR / NFFT - c) ** 2; }
  return [c, Math.sqrt(d2 / z)];
}
const FIG = {};

FIG['21-three-questions'] = async (M) => {
  const lines = wide(M) ? ['同一帧频谱，可以追问三个不同问题'] : ['同一帧频谱，', '可以追问三个不同问题']; const top = headerH(M, lines); const v = synthetic([[700, 180, 1], [1800, 320, .65], [3900, 600, .35]]); const q = slots(M, 3, 3, 212); const labels = [['低频占得多不多？', '带能量比：比较分界线两边', BLUE], ['频率重心在哪里？', '频谱质心：寻找加权平均位置', ORANGE], ['频率分得有多散？', '频谱带宽：测量离中心的距离', GREEN]]; let s = header(M, lines);
  q.forEach((a, i) => { const yy = top + a.y; s += T(a.x, yy + 22, labels[i][0], { size: 17, weight: 700, fill: labels[i][2] }) + card(a.x, yy + 36, a.w, 112); s += spectrum(a.x + 12, yy + 52, a.w - 24, 73, v, labels[i][2]); if (i === 0) { const xx = a.x + 12 + 2000 / 6000 * (a.w - 24); s += L(xx, yy + 48, xx, yy + 128, { c: ORANGE, dash: '4 4' }); } if (i > 0) { const [c, b] = weightedStats(v); const xx = a.x + 12 + c / 6000 * (a.w - 24); s += L(xx, yy + 48, xx, yy + 128, { c: ORANGE, w: 2 }); if (i === 2) s += L(Math.max(a.x + 12, xx - b / 6000 * (a.w - 24)), yy + 118, Math.min(a.x + a.w - 12, xx + b / 6000 * (a.w - 24)), yy + 118, { c: GREEN, w: 7 }); } s += T(a.x + 5, yy + 188, labels[i][1], { size: M.small, fill: MUTED }); });
  return svgDoc(M.W, top + Math.ceil(3 / (wide(M) ? 3 : 1)) * 234, s, '带能量比、频谱质心与频谱带宽回答三个不同问题');
};
FIG['21-same-total'] = async (M) => {
  const lines = ['总量相近，不代表频率分布相同']; const top = headerH(M, lines); const qs = slots(M, 4, 2, 190); const vals = [synthetic([[700, 250, 1]]), synthetic([[3600, 300, 1]]), synthetic([[2200, 220, 1]]), synthetic([[1200, 280, .75], [3200, 380, .75]])]; const names = [['能量偏低频', 'BER 较高'], ['能量偏高频', 'BER 较低'], ['集中在一处', '带宽较窄'], ['分散在两侧', '带宽较宽']]; let s = header(M, lines);
  qs.forEach((a, i) => { const yy = top + a.y; s += T(a.x, yy + 21, names[i][0], { size: 17, weight: 700, fill: [BLUE, ORANGE, GREEN, GOLD][i] }) + card(a.x, yy + 34, a.w, 105); s += spectrum(a.x + 12, yy + 48, a.w - 24, 72, vals[i], [BLUE, ORANGE, GREEN, GOLD][i]); s += T(a.x + 5, yy + 169, names[i][1], { size: M.body, fill: MUTED }); });
  return svgDoc(M.W, top + Math.ceil(4 / (wide(M) ? 2 : 1)) * 212, s, '相近总量下的四种不同频率分布');
};
FIG['21-feature-response'] = async (M) => {
  const lines = wide(M) ? ['声音发生变化时，三个数字不会以同一种方式响应'] : ['声音发生变化时，', '三个数字不会以同一种方式响应']; const top = headerH(M, lines); const qs = slots(M, 3, 3, 165); const rows = [['补入高频成分', 'BER ↓　质心 ↑　带宽常 ↑'], ['整体移向高频', 'BER ↓　质心 ↑　带宽可不变'], ['围绕中心铺得更开', 'BER 未必变　质心可不变　带宽 ↑']]; let s = header(M, lines);
  qs.forEach((a, i) => { const yy = top + a.y; s += L(a.x, yy + 42, a.x + a.w, yy + 42, { c: [BLUE, ORANGE, GREEN][i], w: 4 }); s += T(a.x, yy + 27, rows[i][0], { size: 17, weight: 700 }); s += MT(a.x, yy + 83, wide(M) ? [rows[i][1]] : rows[i][1].split('　'), { size: M.body, fill: MUTED, leading: 25 }); });
  return svgDoc(M.W, top + Math.ceil(3 / (wide(M) ? 3 : 1)) * 187, s, '三种频域特征对声音变化的不同响应');
};
FIG['21-task-map'] = async (M) => {
  const lines = ['先问任务需要什么证据，再挑特征']; const top = headerH(M, lines); const qs = slots(M, 3, 3, 170); const rows = [['比较低频与高频', '带能量比', '鼓点、敲击与持续声的差异'], ['追踪频率整体位置', '频谱质心', '声音成分整体向高处还是低处移动'], ['判断频率是否铺开', '频谱带宽', '集中在窄带还是散布到更宽范围']]; let s = header(M, lines);
  qs.forEach((a, i) => { const yy = top + a.y; s += T(a.x, yy + 21, rows[i][0], { size: 16.5, weight: 700, fill: [BLUE, ORANGE, GREEN][i] }); s += L(a.x, yy + 40, a.x + a.w, yy + 40, { c: GRID }); s += T(a.x, yy + 75, rows[i][1], { size: 20, weight: 700 }); s += MT(a.x, yy + 111, wide(M) ? [rows[i][2]] : [rows[i][2].slice(0, 13), rows[i][2].slice(13)], { size: M.small, fill: MUTED, leading: 21 }); });
  return svgDoc(M.W, top + Math.ceil(3 / (wide(M) ? 3 : 1)) * 192, s, '任务问题与频域特征的对应关系');
};

FIG['22-split-frame'] = async (M) => {
  const lines = wide(M) ? ['在真实声谱图上画出 2000 Hz 分界线，再逐帧比较两侧功率'] : ['在真实声谱图上画出 2000 Hz 分界线，', '再逐帧比较两侧功率']; const top = headerH(M, lines); const { S } = DATA[1][1]; const w = M.W - 2 * M.pad; const h = wide(M) ? 270 : 245; const uri = await spectrogramPng(S, { w: w * 2, h: h * 2, fmax: 6000, dbFloor: -70, cmap: 'magma' }); const y = top + 28; let s = header(M, lines) + card(M.pad, y, w, h) + image(uri, M.pad + 4, y + 4, w - 8, h - 8); const splitY = y + h - 4 - SPLIT / 6000 * (h - 8); const frameX = M.pad + 4 + .58 * (w - 8); s += L(M.pad + 5, splitY, M.pad + w - 5, splitY, { c: '#fff', w: 2, dash: '7 5' }) + L(frameX, y + 5, frameX, y + h - 5, { c: '#fff', w: 2 }); s += T(M.pad + 10, splitY - 8, '2000 Hz：上方高频，下方低频', { size: M.small, weight: 700, fill: '#fff' }); s += T(frameX + 7, y + 25, '当前帧', { size: M.small, weight: 700, fill: '#fff' }); return svgDoc(M.W, y + h + 22, s, '声谱图中的两千赫兹分界线和当前时间帧');
};
FIG['22-bin-map'] = async (M) => {
  const lines = wide(M) ? ['2000 Hz 不一定落在格线上：应从真实频率轴找到第一个不小于它的箱'] : ['2000 Hz 不一定落在格线上：', '从真实频率轴寻找切分位置']; const top = headerH(M, lines); const w = M.W - 2 * M.pad; const y = top + 35; const hz = SR / NFFT; const k = Math.ceil(SPLIT / hz); const x0 = M.pad + 22; const x1 = M.pad + w - 22; const map = (f) => x0 + (f - 1960) / 100 * (x1 - x0); let s = header(M, lines) + card(M.pad, y, w, wide(M) ? 178 : 196); s += L(x0, y + 91, x1, y + 91, { c: GRID, w: 3 }); for (let i = 126; i <= 132; i += 1) { const f = i * hz; const x = map(f); s += L(x, y + 72, x, y + 110, { c: i === k ? ORANGE : BLUE, w: i === k ? 3 : 1.5 }); s += T(x, y + 132 + (i % 2) * 18, `${i}`, { size: M.small, fill: MUTED, anchor: 'middle' }); } const sx = map(SPLIT); s += L(sx, y + 35, sx, y + 116, { c: GREEN, dash: '5 4' }); s += T(sx, y + 27, '2000 Hz', { size: M.body, weight: 700, fill: GREEN, anchor: 'middle' }); s += wide(M) ? T(M.pad + 13, y + 165, `每格约 ${hz.toFixed(2)} Hz；切分箱 k = ${k}，中心频率 ${Math.round(k * hz)} Hz`, { size: M.small, fill: MUTED }) : MT(M.pad + 13, y + 167, [`每格约 ${hz.toFixed(2)} Hz；切分箱 k = ${k}`, `中心频率 ${Math.round(k * hz)} Hz`], { size: M.small, fill: MUTED, leading: 21 }); return svgDoc(M.W, y + (wide(M) ? 202 : 220), s, '从真实 FFT 频率轴定位两千赫兹切分箱');
};
FIG['22-ber-curves'] = async (M) => {
  const lines = ['同一参数下，三段真实音乐得到不同的 BER 轨迹']; const top = headerH(M, lines); const qs = slots(M, 3, 3, 188); let s = header(M, lines);
  qs.forEach((a, i) => { const yy = top + a.y; const [name, d, c] = DATA[i]; s += T(a.x, yy + 21, name, { size: 17, weight: 700, fill: c }); s += curve(a.x, yy + 35, a.w, 112, d.berDb, -25, 35, c, true); s += T(a.x + 5, yy + 171, '0 dB 表示两侧功率相等', { size: M.small, fill: MUTED }); });
  return svgDoc(M.W, top + Math.ceil(3 / (wide(M) ? 3 : 1)) * 210, s, '三段真实音乐的带能量比时间轨迹');
};
FIG['22-axis-flow'] = async (M) => {
  const lines = wide(M) ? ['求和方向决定结果：沿频率行相加，保留每个时间列'] : ['求和方向决定结果：', '沿频率行相加，保留每个时间列']; const top = headerH(M, lines); const qs = slots(M, 4, 4, 160); const rows = [['功率声谱图', '513 行 × T 列'], ['按 2000 Hz 切行', '低频区 + 高频区'], ['各区沿行求和', 'axis = 0'], ['输出 BER', '长度仍为 T']]; let s = header(M, lines);
  qs.forEach((a, i) => { const yy = top + a.y; s += T(a.x, yy + 22, rows[i][0], { size: 16, weight: 700, fill: [BLUE, ORANGE, GREEN, GOLD][i] }) + card(a.x, yy + 37, a.w, 80, i === 3 ? '#fff8e5' : PLATE); if (i === 0) for (let r = 0; r < 5; r += 1) s += L(a.x + 13, yy + 51 + r * 12, a.x + a.w - 13, yy + 51 + r * 12, { c: BLUE, w: 2 }); else if (i === 1) { s += R(a.x + 14, yy + 50, a.w - 28, 24, { fill: '#ddecfb' }) + R(a.x + 14, yy + 77, a.w - 28, 24, { fill: '#fde7dc' }); } else s += P(Array.from({ length: 8 }, (_, k) => [a.x + 13 + k * (a.w - 26) / 7, yy + 92 - (18 + ((k * 17) % 33))]), { c: [GREEN, GOLD][i - 2], w: 2 }); s += T(a.x + 4, yy + 145, rows[i][1], { size: M.small, fill: MUTED }); if (i < 3) { const n = qs[i + 1]; s += wide(M) ? arrow(a.x + a.w + 4, yy + 78, n.x - 4, top + n.y + 78) : arrow(a.x + a.w / 2, yy + a.h + 2, a.x + a.w / 2, top + n.y - 3); } }); return svgDoc(M.W, top + Math.ceil(4 / (wide(M) ? 4 : 1)) * 182, s, '从功率声谱图按频率轴求带能量比');
};

FIG['23-centroid-bandwidth'] = async (M) => {
  const lines = ['质心给出中心位置，带宽描述离中心有多远']; const top = headerH(M, lines); const v = synthetic([[800, 220, .8], [2500, 500, 1], [4300, 380, .45]]); const [c, b] = weightedStats(v); const x = M.pad; const y = top + 30; const w = M.W - 2 * M.pad; const base = y + 194; const map = (f) => x + 18 + f / 6000 * (w - 36); let s = header(M, lines) + card(x, y, w, wide(M) ? 235 : 253); s += spectrum(x + 18, y + 30, w - 36, 145, v, BLUE); s += L(map(c), y + 20, map(c), base, { c: ORANGE, w: 3 }); s += L(map(Math.max(0, c - b)), base - 12, map(Math.min(6000, c + b)), base - 12, { c: GREEN, w: 9 }); s += T(map(c), y + 18, `质心约 ${Math.round(c)} Hz`, { size: M.body, weight: 700, fill: ORANGE, anchor: 'middle' }); s += wide(M) ? T(x + 18, y + 222, `绿色范围表示质心左右各一个带宽（约 ${Math.round(b)} Hz）`, { size: M.small, fill: MUTED }) : MT(x + 18, y + 220, ['绿色范围表示质心左右', `各一个带宽（约 ${Math.round(b)} Hz）`], { size: M.small, fill: MUTED, leading: 21 }); return svgDoc(M.W, y + (wide(M) ? 260 : 280), s, '同一频谱上的频谱质心与频谱带宽');
};
FIG['23-same-centroid'] = async (M) => {
  const lines = ['两个频谱可以有相近质心，却有完全不同的带宽']; const top = headerH(M, lines); const qs = slots(M, 2, 2, 215); const vals = [synthetic([[2500, 280, 1]]), synthetic([[1300, 260, .8], [3700, 260, .8]])]; let s = header(M, lines);
  qs.forEach((a, i) => { const yy = top + a.y; const [c, b] = weightedStats(vals[i]); s += T(a.x, yy + 21, i ? '分布铺在两侧' : '分布挤在中心', { size: 17, weight: 700, fill: i ? ORANGE : BLUE }) + card(a.x, yy + 35, a.w, 116); s += spectrum(a.x + 12, yy + 50, a.w - 24, 78, vals[i], i ? ORANGE : BLUE); const xx = a.x + 12 + c / 6000 * (a.w - 24); s += L(xx, yy + 45, xx, yy + 132, { c: GREEN, w: 2 }); s += T(a.x + 5, yy + 176, `质心约 ${Math.round(c)} Hz；带宽约 ${Math.round(b)} Hz`, { size: M.small, fill: MUTED }); }); return svgDoc(M.W, top + Math.ceil(2 / (wide(M) ? 2 : 1)) * 237, s, '相近质心但带宽不同的两个频谱');
};
FIG['23-weight-convention'] = async (M) => {
  const lines = wide(M) ? ['同一频谱改用不同权重，算出的质心会改变'] : ['同一频谱改用不同权重，', '算出的质心会改变']; const top = headerH(M, lines); const v = synthetic([[1000, 260, .55], [3600, 380, 1]]); const [cm] = weightedStats(v, false); const [cp] = weightedStats(v, true); const x = M.pad; const y = top + 25; const w = M.W - 2 * M.pad; const map = (f) => x + 18 + f / 6000 * (w - 36); let s = header(M, lines) + card(x, y, w, 220); s += spectrum(x + 18, y + 33, w - 36, 120, v, BLUE); s += L(map(cm), y + 23, map(cm), y + 171, { c: GREEN, w: 3 }) + L(map(cp), y + 23, map(cp), y + 171, { c: ORANGE, w: 3 }); s += T(map(cm), y + 197, `幅度加权 ${Math.round(cm)} Hz`, { size: M.small, fill: GREEN, anchor: 'middle' }); s += T(map(cp), y + 217, `功率加权 ${Math.round(cp)} Hz`, { size: M.small, fill: ORANGE, anchor: 'middle' }); return svgDoc(M.W, y + 246, s, '幅度加权与功率加权得到不同频谱质心');
};
FIG['23-tracks'] = async (M) => {
  const lines = ['真实音乐中，质心与带宽都随时间起伏']; const top = headerH(M, lines); const qs = slots(M, 3, 3, 250); let s = header(M, lines);
  qs.forEach((a, i) => { const yy = top + a.y; const [name, d, c] = DATA[i]; s += T(a.x, yy + 21, name, { size: 17, weight: 700, fill: c }); s += curve(a.x, yy + 36, a.w, 82, d.centroid, 0, 5000, c); s += T(a.x + 5, yy + 135, '质心（0—5000 Hz）', { size: M.small, fill: MUTED }); s += curve(a.x, yy + 150, a.w, 65, d.bandwidth, 0, 3000, GREEN); s += T(a.x + 5, yy + 238, '带宽（0—3000 Hz）', { size: M.small, fill: MUTED }); }); return svgDoc(M.W, top + Math.ceil(3 / (wide(M) ? 3 : 1)) * 272, s, '三段真实音乐的频谱质心和带宽时间轨迹');
};

for (const [mode, M] of Object.entries(MODES)) {
  const out = join(BASE, mode); mkdirSync(out, { recursive: true });
  for (const [name, draw] of Object.entries(FIG)) writeFileSync(join(out, `${name}.svg`), await draw(M), 'utf8');
}
console.log(`生成 ${Object.keys(FIG).length} 张知识图 × 2 个版式 = ${Object.keys(FIG).length * 2} 个 SVG`);
console.log(`输出目录：${BASE}`);
