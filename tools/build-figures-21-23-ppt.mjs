#!/usr/bin/env node
// 第 21—23 课教程版配图。Python 负责计算，本文只读取 lesson21—23.json。

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, ARROW, header, headerH,
  panel, curve, legend, chain,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, '音频信号处理二十三讲/', '第21-23课', 'figures');
const DATA = join(ROOT, '音频信号处理二十三讲/', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));
const d21 = D(21);
const d22 = D(22);
const d23 = D(23);
const COLORS = { debussy: BLUE, redhot: WARM, duke: GREEN };
const LABELS = { debussy: '德彪西', redhot: '摇滚', duke: '艾灵顿公爵' };
const tiny = () => 14;

function spectrum(pn, frequencies, magnitude, color) {
  let s = P(frequencies.map((f, i) => [pn.sx(f), pn.sy(magnitude[i])]), { c: color, w: 2.2 });
  frequencies.forEach((f, i) => { s += O(pn.sx(f), pn.sy(magnitude[i]), 3, { fill: color }); });
  return s;
}

function xTicks(pn, y, ticks, unit = 'Hz') {
  return ticks.map(([v, label], i) => T(pn.sx(v), y, i === ticks.length - 1 ? `${label} ${unit}` : label,
    { size: 14, fill: MUTED, anchor: i === 0 ? 'start' : (i === ticks.length - 1 ? 'end' : 'middle') })).join('');
}

function yTicks(pn, ticks, x, unit = '') {
  return ticks.map(([v, label], i) => T(x, pn.sy(v) + 4, i === ticks.length - 1 && unit ? `${label} ${unit}` : label,
    { size: 14, fill: MUTED, anchor: 'end' })).join('');
}

function spectrumCards(M, rows, head, note, label) {
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - 2 * px;
  const cols = wide(M) ? rows.length : 1;
  const gap = wide(M) ? 18 : 16;
  const cw = (pw - gap * (cols - 1)) / cols;
  const ch = wide(M) ? 214 : 204;
  let s = header(M, head);
  rows.forEach((r, i) => {
    const x = wide(M) ? px + i * (cw + gap) : px;
    const y = top + 16 + (wide(M) ? 0 : i * (ch + gap));
    s += R(x, y, cw, ch, { fill: PLATE, stroke: r.color, sw: 1.4, r: 9 });
    s += T(x + 12, y + 24, r.title, { size: M.h2, weight: 700, fill: r.color });
    const pn = panel(x + 24, y + 42, cw - 36, 94, { xr: [0, 3000], yr: [0, 4.4], fill: '#fff' });
    s += pn.s + spectrum(pn, d21.frequencies, r.magnitude, r.color);
    s += xTicks(pn, y + 154, [[0, '0'], [1500, '1.5k'], [3000, '3k']]);
    s += MT(x + 12, y + 178, r.lines, { size: 14, fill: MUTED, leading: 20 });
  });
  let y = top + 16 + (wide(M) ? ch : rows.length * (ch + gap) - gap) + 20;
  s += MT(px, y, note, { size: 14, fill: MUTED, leading: 21 });
  y += note.length * 21 + 8;
  return doc(M.W, y, s, label);
}

function trackFigure(M, kind, yr, ticks, head, label) {
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - 2 * px;
  const names = d23.names;
  const cols = wide(M) ? 3 : 1;
  const gap = wide(M) ? 18 : 16;
  const cw = (pw - gap * (cols - 1)) / cols;
  const ch = 184;
  let s = header(M, head);
  names.forEach((name, i) => {
    const x = wide(M) ? px + i * (cw + gap) : px;
    const y = top + 18 + (wide(M) ? 0 : i * (ch + gap));
    const c = COLORS[name];
    s += T(x, y + 18, LABELS[name], { size: M.h2, weight: 700, fill: c });
    const pn = panel(x + 36, y + 32, cw - 42, 112, { xr: [0, 30], yr, fill: PLATE });
    s += pn.s + curve(pn, d23.tracks[name][kind], { c, w: 1.8 });
    s += yTicks(pn, ticks, x + 31, 'Hz');
    s += xTicks(pn, y + 164, [[0, '0'], [15, '15'], [30, '30']], '秒');
  });
  const y = top + 18 + (wide(M) ? ch : names.length * (ch + gap) - gap) + 8;
  return doc(M.W, y, s, label);
}

const FIG = {};

FIG['21-spectrum-to-numbers'] = (M) => chain(M,
  wide(M) ? ['一帧频谱有上千格，最后压成三个数'] : ['一帧频谱有上千格，', '最后压成三个数'],
  [
    { name: '波形', desc: ['一串样本'], color: BLUE },
    { name: '分帧加窗', desc: ['只看几十毫秒'], color: BLUE },
    { name: '傅里叶变换', desc: ['得到一列频谱'], color: WARM },
    { name: '逐帧统计', desc: ['BER、质心、带宽'], color: GREEN },
  ],
  '每一帧得到三个数；沿时间排起来，就是三条特征轨迹。',
  '从波形到逐帧频域特征的计算流程');

FIG['21-three-questions-new'] = (M) => {
  const base = d21.rows[0];
  const rows = [
    { title: '低、高两边各有多少？', color: BLUE, magnitude: base.magnitude,
      lines: [`BER = ${base.low_power.toFixed(0)} / ${base.high_power.toFixed(0)} = ${base.ber.toFixed(0)}`] },
    { title: '频率重心在哪里？', color: WARM, magnitude: base.magnitude,
      lines: [`质心 = ${base.centroid.toFixed(0)} Hz`] },
    { title: '围绕重心铺得多开？', color: GREEN, magnitude: base.magnitude,
      lines: [`p=2 带宽 = ${base.bandwidth_p2.toFixed(1)} Hz`] },
  ];
  return spectrumCards(M, rows,
    wide(M) ? ['同一列频谱，可以问三个不同问题'] : ['同一列频谱，', '可以问三个不同问题'],
    ['BER 用功率；质心和带宽用幅度。公式相似，权重不能混。'],
    '带能量比、频谱质心和频谱带宽回答三个不同问题');
};

FIG['21-independent-features-new'] = (M) => {
  const colors = [BLUE, WARM, GREEN];
  const rows = d21.rows.map((r, i) => ({
    title: r.name,
    color: colors[i],
    magnitude: r.magnitude,
    lines: [`质心 ${r.centroid.toFixed(0)} Hz；带宽 ${r.bandwidth_p2.toFixed(1)} Hz`,
      `BER ${r.ber.toFixed(2)}`],
  }));
  return spectrumCards(M, rows,
    wide(M) ? ['质心相同，带宽可以不同；带宽相同，质心也可以不同'] : ['质心相同，带宽可以不同；', '带宽相同，质心也可以不同'],
    ['前两条质心都是 1000 Hz，宽度不同；后两条宽度都是 500 Hz，中心不同。'],
    '受控合成频谱证明质心与带宽不能互相替代');
};

FIG['22-ber-axis-contract'] = (M) => {
  const head = wide(M) ? ['沿频率方向相加，保留每一个时间列'] : ['沿频率方向相加，', '保留每一个时间列'];
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - 2 * px;
  let s = header(M, head);
  let y = top + 18;
  const mh = wide(M) ? 180 : 204;
  const mw = wide(M) ? 360 : pw;
  s += R(px, y, mw, mh, { fill: '#fff', stroke: GRID, r: 8 });
  const rows = 8, cols = 10;
  const gx = px + 50, gy = y + 18, gw = mw - 70, gh = mh - 48;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      s += R(gx + c * gw / cols, gy + r * gh / rows, gw / cols - 1, gh / rows - 1,
        { fill: r < 5 ? '#fde7dc' : '#ddecfb', stroke: 'none', r: 0 });
    }
  }
  const splitY = gy + 5 * gh / rows;
  s += L(gx, splitY, gx + gw, splitY, { c: GOLD, w: 2, dash: '5 4' });
  s += T(px + 8, gy + 16, '高频', { size: 14, fill: WARM });
  s += T(px + 8, splitY + 30, '低频', { size: 14, fill: BLUE });
  s += T(gx + gw, y + mh - 8, '时间 →', { size: 14, fill: MUTED, anchor: 'end' });
  if (wide(M)) {
    const bx = px + mw + 66;
    s += ARROW(px + mw + 12, y + mh / 2, bx - 14, y + mh / 2, { c: MUTED });
    s += R(bx, y + 34, pw - mw - 66, 112, { fill: PLATE, stroke: GREEN, sw: 1.5, r: 9 });
    s += T(bx + 14, y + 62, '每一列分别计算', { size: M.h2, weight: 700, fill: GREEN });
    s += T(bx + 14, y + 94, '低频功率和 ÷ 高频功率和', { size: 14, fill: INK });
    s += T(bx + 14, y + 124, '1292 列 → 1292 个 BER', { size: 14, fill: MUTED });
    return doc(M.W, y + mh + 24, s, '带能量比沿频率方向求和并保留时间列');
  } else {
    y += mh + 26;
    s += ARROW(px + pw / 2, y - 18, px + pw / 2, y - 4, { c: MUTED });
    s += R(px, y, pw, 112, { fill: PLATE, stroke: GREEN, sw: 1.5, r: 9 });
    s += T(px + 14, y + 28, '每一列分别计算', { size: M.h2, weight: 700, fill: GREEN });
    s += T(px + 14, y + 60, '低频功率和 ÷ 高频功率和', { size: 14 });
    s += T(px + 14, y + 90, '1292 列 → 1292 个 BER', { size: 14, fill: MUTED });
    y += 112;
    return doc(M.W, y + 20, s, '带能量比沿频率方向求和并保留时间列');
  }
};

FIG['22-split-bin-bug'] = (M) => {
  const head = wide(M) ? ['2000 Hz 的正确分界是第 186 格，不是第 185 或第 234 格'] : ['2000 Hz 的正确分界是第 186 格，', '不是第 185 或第 234 格'];
  const top = headerH(M, head), px = M.pad, pw = M.W - 2 * M.pad;
  let s = header(M, head), y = top + 24;
  const boxH = 246;
  const axisX = px + 14, axisW = pw - 28, axisY = y + 72;
  const map = (hz) => axisX + (hz - 1900) / 700 * axisW;
  s += R(px, y, pw, boxH, { fill: PLATE, stroke: GRID, r: 9 });
  s += L(axisX, axisY, axisX + axisW, axisY, { c: GRID, w: 3 });
  const marks = [
    [d22.bins.source_hz, BLUE],
    [d22.bins.correct_hz, GREEN],
    [d22.bins.wrong_axis_hz, WARM],
  ];
  marks.forEach(([hz, c]) => {
    const x = map(hz);
    s += L(x, axisY - 30, x, axisY + 30, { c, w: 2.5 });
  });
  const sx = map(2000);
  s += L(sx, axisY - 27, sx, axisY + 27, { c: GOLD, w: 1.5, dash: '4 3' });
  s += T(sx, axisY - 38, '2000 Hz', { size: 14, fill: GOLD, anchor: 'middle' });
  const notes = [
    [`近似：第 185 格 = ${d22.bins.source_hz.toFixed(2)} Hz`, '还低于 2000 Hz', BLUE],
    [`正确：第 186 格 = ${d22.bins.correct_hz.toFixed(2)} Hz`, '第一个不低于 2000 Hz 的格', GREEN],
    [`把时间列当频率格：第 234 格 = ${d22.bins.wrong_axis_hz.toFixed(2)} Hz`, '分界被推高了 519.38 Hz', WARM],
  ];
  notes.forEach((n, i) => {
    const yy = axisY + 50 + i * 48;
    s += O(axisX + 4, yy - 4, 4, { fill: n[2] });
    s += T(axisX + 16, yy, n[0], { size: 14, fill: n[2], weight: 700 });
    s += T(axisX + 16, yy + 19, n[1], { size: 14, fill: MUTED });
  });
  return doc(M.W, y + boxH + 24, s, '两千赫兹分界的正确与错误频率格位置');
};

FIG['22-ber-tracks-new'] = (M) => {
  const head = ['三段录音在同一个 2000 Hz 分界下，BER 轨迹不同'];
  const top = headerH(M, head), px = M.pad, pw = M.W - 2 * M.pad;
  const names = d22.tracks.names, cols = wide(M) ? 3 : 1, gap = wide(M) ? 18 : 16;
  const cw = (pw - gap * (cols - 1)) / cols, ch = 190;
  let s = header(M, head);
  names.forEach((name, i) => {
    const x = wide(M) ? px + i * (cw + gap) : px;
    const y = top + 18 + (wide(M) ? 0 : i * (ch + gap));
    const pn = panel(x + 38, y + 34, cw - 44, 112, { xr: [0, 30], yr: [0, 42], fill: PLATE });
    s += T(x, y + 20, LABELS[name], { size: M.h2, weight: 700, fill: COLORS[name] });
    s += pn.s + curve(pn, d22.tracks.values[name], { c: COLORS[name], w: 1.8 });
    s += yTicks(pn, [[0, '0'], [20, '20'], [40, '40']], x + 33, 'dB');
    s += xTicks(pn, y + 166, [[0, '0'], [15, '15'], [30, '30']], '秒');
    s += T(x + cw, y + 20, `中位 ${d22.summaries[name].median.toFixed(2)} dB`, { size: 14, fill: MUTED, anchor: 'end' });
  });
  const y = top + 18 + (wide(M) ? ch : names.length * (ch + gap) - gap) + 8;
  return doc(M.W, y, s, '三段真实音乐的带能量比时间轨迹');
};

FIG['22-threshold-scan'] = (M) => {
  const head = wide(M) ? ['分界频率一改，BER 就跟着改：它是任务参数，不是固定答案'] : ['分界频率一改，BER 就跟着改：', '它是任务参数，不是固定答案'];
  const top = headerH(M, head), px = M.pad, pw = M.W - 2 * M.pad;
  let s = header(M, head), y = top + 24;
  const pn = panel(px + 48, y, pw - 58, wide(M) ? 240 : 220, { xr: [0, 3], yr: [0, 38], fill: PLATE });
  s += pn.s + yTicks(pn, [[0, '0'], [10, '10'], [20, '20'], [30, '30']], px + 42, 'dB');
  d22.tracks.names.forEach((name) => {
    const vals = d22.thresholds.map((r) => r.median[name]);
    s += P(vals.map((v, i) => [pn.sx(i), pn.sy(v)]), { c: COLORS[name], w: 2.2 });
    vals.forEach((v, i) => { s += O(pn.sx(i), pn.sy(v), 3.5, { fill: COLORS[name] }); });
  });
  const labels = ['500', '1000', '2000', '4000 Hz'];
  labels.forEach((v, i) => { s += T(pn.sx(i), y + pn.h + 20, v, { size: 14, fill: MUTED, anchor: i === 3 ? 'end' : 'middle' }); });
  y += pn.h + 46;
  s += legend(px + (wide(M) ? 120 : 0), y, d22.tracks.names.map((name) => ({ name: LABELS[name], c: COLORS[name] })), { gap: wide(M) ? 170 : 118, size: 14 });
  y += 28;
  return doc(M.W, y, s, '不同分界频率下三段录音的中位带能量比');
};

FIG['23-two-bandwidths'] = (M) => {
  const r = d21.rows[0];
  const head = wide(M) ? ['同一个频谱有两种常见“宽度”：平均绝对距离与均方根距离'] : ['同一个频谱有两种常见“宽度”：', '平均绝对距离与均方根距离'];
  const top = headerH(M, head), px = M.pad, pw = M.W - 2 * M.pad;
  let s = header(M, head), y = top + 22;
  const ph = wide(M) ? 180 : 164;
  const pn = panel(px + 34, y, pw - 44, ph, { xr: [0, 3000], yr: [0, 4.4], fill: PLATE });
  s += pn.s + spectrum(pn, d21.frequencies, r.magnitude, BLUE);
  s += L(pn.sx(r.centroid), y + 4, pn.sx(r.centroid), y + ph - 4, { c: GOLD, w: 2, dash: '5 4' });
  s += T(pn.sx(r.centroid), y + 20, `质心 ${r.centroid.toFixed(0)} Hz`, { size: 14, fill: GOLD, weight: 700, anchor: 'middle' });
  s += xTicks(pn, y + ph + 20, [[0, '0'], [1500, '1.5k'], [3000, '3k']]);
  y += ph + 44;
  const cards = [
    ['p = 1', '平均绝对距离', `${r.bandwidth_p1.toFixed(1)} Hz`, WARM],
    ['p = 2', '均方根距离（库默认）', `${r.bandwidth_p2.toFixed(1)} Hz`, GREEN],
  ];
  cards.forEach((c, i) => {
    const cw = wide(M) ? (pw - 18) / 2 : pw;
    const x = wide(M) ? px + i * (cw + 18) : px;
    const yy = wide(M) ? y : y + i * 92;
    s += R(x, yy, cw, 76, { fill: '#fff', stroke: c[3], sw: 1.4, r: 9 });
    s += T(x + 12, yy + 24, `${c[0]}　${c[1]}`, { size: M.h2, weight: 700, fill: c[3] });
    s += T(x + 12, yy + 54, c[2], { size: 20, weight: 700, fill: INK });
  });
  y += wide(M) ? 94 : 196;
  s += T(px, y, '两把尺都合理，但结果不能混用；本课用 p=2 对齐库函数。', { size: 14, fill: MUTED });
  return doc(M.W, y + 22, s, '平均绝对距离与均方根距离两种频谱带宽定义');
};

FIG['23-manual-match'] = (M) => {
  const head = ['手写公式与库函数逐帧核对，误差不到十万分之一赫兹'];
  const top = headerH(M, head), px = M.pad, pw = M.W - 2 * M.pad;
  let s = header(M, head), y = top + 22;
  const rows = [
    ['频谱质心', d23.max_diff.centroid, BLUE],
    ['p=2 频谱带宽', d23.max_diff.bandwidth_p2, GREEN],
  ];
  rows.forEach(([name, value, c], i) => {
    const yy = y + i * 92;
    s += R(px, yy, pw, 76, { fill: PLATE, stroke: c, sw: 1.4, r: 9 });
    s += T(px + 14, yy + 26, name, { size: M.h2, weight: 700, fill: c });
    s += T(px + 14, yy + 56, `三段录音的最大绝对差：${value.toExponential(3)} Hz`, { size: 16, weight: 700 });
  });
  y += rows.length * 92 + 4;
  s += MT(px, y, ['公式、幅度权重、真实 Hz 频率轴和矩阵方向都一致。', '剩下的差来自浮点数的计算顺序，不会改变任何图或结论。'], { size: 14, fill: MUTED, leading: 21 });
  return doc(M.W, y + 56, s, '手写频谱质心和带宽与库函数的最大差');
};

FIG['23-centroid-tracks-new'] = (M) => trackFigure(M, 'centroid', [0, 4500], [[0, '0'], [2000, '2k'], [4000, '4k']],
  ['质心随时间移动：它不是整段录音只有一个数'], '三段真实音乐的频谱质心时间轨迹');

FIG['23-bandwidth-tracks-new'] = (M) => trackFigure(M, 'bandwidth_p2', [0, 3500], [[0, '0'], [1500, '1.5k'], [3000, '3k']],
  ['带宽也逐帧起伏：这里统一使用 p=2'], '三段真实音乐的频谱带宽时间轨迹');

FIG['23-course-result'] = (M) => chain(M,
  wide(M) ? ['课程终点：把录音变成能比较、能检查、能解释的数字'] : ['课程终点：把录音变成', '能比较、能检查、能解释的数字'],
  [
    { name: '统一录音条件', desc: ['采样率、声道、长度'], color: BLUE },
    { name: '切成短帧', desc: ['保留时间变化'], color: BLUE },
    { name: '选择表示', desc: ['时域、频谱、梅尔、MFCC'], color: WARM },
    { name: '提取特征', desc: ['每帧少量数字'], color: GREEN },
    { name: '核对与比较', desc: ['形状、单位、边界、误差'], color: GOLD },
  ],
  '完整参数、边界检查和输出都保留在项目代码中。',
  '从统一录音到可核对音频特征的完整课程流程');

mkdirSync(join(BASE, 'desktop'), { recursive: true });
mkdirSync(join(BASE, 'mobile'), { recursive: true });
let count = 0;
for (const [name, make] of Object.entries(FIG)) {
  for (const mode of ['desktop', 'mobile']) {
    writeFileSync(join(BASE, mode, `${name}.svg`), make(MODES[mode]), 'utf8');
    count += 1;
  }
  console.log(`  ${name}`);
}
console.log(`${count} 个 SVG -> ${BASE}`);
