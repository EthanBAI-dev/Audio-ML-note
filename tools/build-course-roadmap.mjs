#!/usr/bin/env node
// 课程总纲：同一内容生成桌面横向路线图与手机纵向路线图。

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, T, R, L, P, PALETTE } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, '音频信号处理二十三讲/', '课程总纲', 'figures');
const [BLUE, ORANGE, GREEN, GOLD] = [PALETTE.s1, PALETTE.s2, PALETTE.s3, PALETTE.s4];
const PURPLE = '#7656b5';
const { ink: INK, muted: MUTED, grid: GRID, plate: PLATE } = PALETTE;

const common = [
  { range: '01', title: '先认清问题', body: ['为什么声音分类需要', '先把录音变成证据'], result: '明确课程目标与边界' },
  { range: '02—04', title: '认识输入', body: ['声音、听感与波形', '连续声音怎样数字化'], result: '看懂录音中的数字' },
  { range: '05—06', title: '建立方法', body: ['特征怎样分类', '录音怎样分帧和计算'], result: '得到统一提取步骤' },
];

const routes = {
  time: { range: '07—09', title: '时域特征', body: ['直接沿时间观察波形', '量出强弱与正负变化'], result: '振幅包络 · RMS · 过零率', color: ORANGE },
  freq: { range: '10—16', title: '频率与时间—频率', body: ['从傅里叶变换走到 STFT', '找到成分及其出现时间'], result: '频谱 · 声谱图（也可直接使用）', color: GREEN },
  hearing: { range: '17—20', title: '听觉表示', body: ['按人耳的分辨方式', '重新整理频率'], result: '梅尔频谱 · MFCC', color: GOLD },
  stats: { range: '21—23', title: '频谱统计', body: ['直接概括一帧频谱的', '比例、中心与宽度'], result: 'BER · 质心 · 带宽', color: PURPLE },
};

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function MT(x, y, lines, o = {}) {
  const { size = 15, weight = 400, fill = INK, leading = Math.round(size * 1.45), anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines.map((v, i) => `<tspan x="${x}" dy="${i ? leading : 0}">${esc(v)}</tspan>`).join('')}</text>`;
}
function arrow(x1, y1, x2, y2, c = MUTED) {
  const a = Math.atan2(y2 - y1, x2 - x1); const z = 7;
  return L(x1, y1, x2, y2, { c, w: 1.7 }) + `<polygon points="${x2},${y2} ${x2 - z * Math.cos(a - .5)},${y2 - z * Math.sin(a - .5)} ${x2 - z * Math.cos(a + .5)},${y2 - z * Math.sin(a + .5)}" fill="${c}"/>`;
}
// 在两色之间取值，用于画有深浅的热力格。
function mix(a, b, t) {
  const p1 = parseInt(a.slice(1), 16); const p2 = parseInt(b.slice(1), 16);
  const ch = [16, 8, 0].map((sh) => {
    const v1 = (p1 >> sh) & 255; const v2 = (p2 >> sh) & 255;
    return Math.round(v1 + (v2 - v1) * Math.max(0, Math.min(1, t)));
  });
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// 文字取色：只有明显偏浅的颜色才压暗，其余原样返回，
// 这样五个阶段的识别色不变，但小字都能读清。
function inkOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? shade(hex, 0.72) : hex;
}

// 把颜色按比例压向黑色。浅色（尤其金色）直接画在白底上对比不足。
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function icon(type, x, y, w, h, c0) {
  const c = inkOf(c0);
  let s = '';
  if (type === 'views') {
    s += P([[x, y + h * .62], [x + w * .16, y + h * .25], [x + w * .3, y + h * .78], [x + w * .48, y + h * .38], [x + w * .65, y + h * .7], [x + w, y + h * .32]], { c, w: 2 });
    s += L(x, y + h * .9, x + w, y + h * .9, { c: GRID });
  } else if (type === 'frames') {
    s += P(Array.from({ length: 28 }, (_, i) => [x + i / 27 * w, y + h / 2 - Math.sin(i * .9) * (8 + (i % 5) * 2)]), { c, w: 1.8 });
    for (let i = 1; i < 5; i += 1) s += L(x + i * w / 5, y + 4, x + i * w / 5, y + h - 4, { c: ORANGE, dash: '3 3' });
  } else if (type === 'fourier') {
    const cx = x + w * .27; const cy = y + h * .5; const r = Math.min(w, h) * .31;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${GRID}" stroke-width="1.5"/>`;
    s += arrow(cx, cy, cx + r * .72, cy - r * .65, c);
    [0.08, .2, .42, .72, 1].forEach((v, i) => { const bw = w * .07; s += R(x + w * .57 + i * w * .085, y + h * .84 - v * h * .65, bw, v * h * .65, { fill: c, r: 1 }); });
  } else if (type === 'mel') {
    // 这一组的产出就是梅尔声谱图，直接画一张缩略图：
    // 横轴时间、纵轴频率（惯例），几条持续的横向亮带 + 一次短促的竖向事件。
    // 低处的带密、高处的带疏，正是梅尔刻度重新分带的样子。
    const rows = 8; const cols = 10;
    const cw = w / cols; const ch = h / rows;
    const dark = shade(c, 0.45);
    // 每行的持续强度：低频（下方）几条明显，高频（上方）弱而散
    const band = [0.12, 0.2, 0.1, 0.34, 0.18, 0.7, 0.45, 0.9];
    for (let r = 0; r < rows; r += 1) {
      for (let k = 0; k < cols; k += 1) {
        // 沿时间只做轻微起伏，横向的带才连得起来
        let t = band[r] * (0.82 + 0.18 * Math.sin(k * 0.8 + r));
        if (k === 6) t = Math.max(t, 0.75);            // 一次短促事件：一整列变亮
        s += R(x + k * cw, y + r * ch, cw - 0.5, ch - 0.5, { fill: mix('#ffffff', dark, t), r: 0.5 });
      }
    }
    s += R(x, y, w, h, { fill: 'none', stroke: GRID, sw: 1 });
  } else {
    s += P(Array.from({ length: 35 }, (_, i) => { const f = i / 34; const v = Math.exp(-45 * (f - .24) ** 2) + .7 * Math.exp(-28 * (f - .63) ** 2); return [x + f * w, y + h - v / 1.02 * h]; }), { c, w: 2 });
    s += L(x + w * .5, y, x + w * .5, y + h, { c: ORANGE, dash: '4 3' });
  }
  return s;
}

function desktop() {
  const W = 880; const pad = 28; const commonY = 112; const commonW = 260; const commonH = 112;
  let s = MT(pad, 35, ['23 课的真实结构：共同基础之后，特征路线开始分叉'], { size: 23, weight: 700 });
  s += T(pad, 68, '课程按课号学习；实际项目按任务选择，不必把所有特征首尾串联', { size: 15, fill: MUTED });
  s += T(pad, 96, '所有路线共用', { size: 14, weight: 700, fill: BLUE });

  common.forEach((d, i) => {
    const x = pad + i * 282;
    s += R(x, commonY, commonW, commonH, { fill: '#eef5fd', stroke: '#cbdff5', sw: 1, r: 5 });
    s += R(x, commonY, commonW, 5, { fill: BLUE, r: 2 });
    s += T(x + 14, commonY + 29, d.range, { size: 14, weight: 700, fill: BLUE });
    s += T(x + 70, commonY + 29, d.title, { size: 17, weight: 700 });
    s += MT(x + 14, commonY + 55, d.body, { size: 13.5, fill: MUTED, leading: 19 });
    s += T(x + 14, commonY + 99, d.result, { size: 13.5, weight: 700, fill: BLUE });
    if (i < common.length - 1) s += arrow(x + commonW + 4, commonY + commonH / 2, x + commonW + 18, commonY + commonH / 2, MUTED);
  });

  const routeCard = (x, y, w, h, d, label) => {
    let o = R(x, y, w, h, { fill: '#fbfcfd', stroke: GRID, sw: 1, r: 5 });
    o += R(x, y, 6, h, { fill: d.color, r: 2 });
    o += T(x + 18, y + 29, `${label}  ${d.range}`, { size: 14, weight: 700, fill: inkOf(d.color) });
    o += T(x + 18, y + 57, d.title, { size: 18, weight: 700 });
    o += MT(x + 18, y + 84, d.body, { size: 13.5, fill: MUTED, leading: 20 });
    o += L(x + 18, y + h - 34, x + w - 18, y + h - 34, { c: d.color, w: 2 });
    o += T(x + 18, y + h - 12, d.result, { size: 13.5, weight: 700, fill: inkOf(d.color) });
    return o;
  };

  const splitY = 263; const timeX = 28; const timeW = 282; const freqX = 340; const freqW = 512;
  s += L(722, commonY + commonH, 722, splitY, { c: MUTED, w: 1.7 });
  s += L(169, splitY, 722, splitY, { c: MUTED, w: 1.7 });
  s += arrow(169, splitY, 169, 286, MUTED);
  s += arrow(596, splitY, 596, 286, MUTED);
  s += T(pad, 278, '可选的特征路线', { size: 14, weight: 700, fill: MUTED });
  s += routeCard(timeX, 292, timeW, 162, routes.time, '路线 A');
  s += routeCard(freqX, 292, freqW, 162, routes.freq, '路线 B');

  const childY = 502; const childW = 246; const hearX = 340; const statsX = 606;
  s += L(596, 454, 596, 480, { c: MUTED, w: 1.7 });
  s += L(463, 480, 729, 480, { c: MUTED, w: 1.7 });
  s += arrow(463, 480, 463, childY - 6, MUTED);
  s += arrow(729, 480, 729, childY - 6, MUTED);
  s += routeCard(hearX, childY, childW, 145, routes.hearing, '路线 C');
  s += routeCard(statsX, childY, childW, 145, routes.stats, '路线 D');

  const oy = 681;
  s += R(pad, oy, W - 2 * pad, 62, { fill: '#fff8e5', stroke: '#f0d99d', sw: 1, r: 5 });
  s += T(pad + 18, oy + 26, '实际任务', { size: 15, weight: 700, fill: '#7d5c00' });
  s += T(pad + 104, oy + 26, '时域　＋／或　频谱/声谱图　＋／或　梅尔/MFCC　＋／或　频谱统计', { size: 14.5, weight: 700 });
  s += T(pad + 104, oy + 49, '四类证据都能直接使用，也可以按任务组合', { size: 13.5, fill: MUTED });
  return svgDoc(W, 770, s, '二十三课从共同基础分向四类声音特征的桌面课程路线图');
}

function mobile() {
  const W = 420; const pad = 20; const boxX = 48; const boxW = 352;
  let s = MT(pad, 31, ['23 课不是一条', '首尾相接的流水线'], { size: 20, weight: 700, leading: 28 });
  s += MT(pad, 96, ['先学习共同基础，再按任务选择', '时域、频率、听觉表示或频谱统计。'], { size: 14, fill: MUTED, leading: 21 });
  s += T(pad, 151, '所有路线共用', { size: 14, weight: 700, fill: BLUE });

  const commonCard = (d, y) => {
    let o = R(boxX, y, boxW, 115, { fill: '#eef5fd', stroke: '#cbdff5', sw: 1, r: 5 });
    o += R(boxX, y, 6, 115, { fill: BLUE, r: 2 });
    o += T(boxX + 17, y + 27, d.range, { size: 14, weight: 700, fill: BLUE });
    o += T(boxX + 83, y + 27, d.title, { size: 17, weight: 700 });
    o += MT(boxX + 17, y + 53, d.body, { size: 14, fill: MUTED, leading: 20 });
    o += L(boxX + 17, y + 84, boxX + boxW - 17, y + 84, { c: '#cbdff5' });
    o += T(boxX + 17, y + 105, d.result, { size: 14, weight: 700, fill: BLUE });
    return o;
  };
  const commonYs = [169, 302, 435];
  common.forEach((d, i) => {
    s += commonCard(d, commonYs[i]);
    if (i < 2) s += arrow(W / 2, commonYs[i] + 118, W / 2, commonYs[i + 1] - 7, MUTED);
  });

  s += T(pad, 585, '从这里开始，特征分成不同路线', { size: 16, weight: 700 });
  s += L(34, 620, 34, 863, { c: GRID, w: 4 });
  const routeCard = (d, y, label, x = 58, w = 342, h = 132) => {
    let o = `<circle cx="34" cy="${y + 25}" r="10" fill="#fff" stroke="${d.color}" stroke-width="3"/>`;
    o += L(44, y + 25, x - 5, y + 25, { c: d.color, w: 2 });
    o += R(x, y, w, h, { fill: '#fbfcfd', stroke: GRID, sw: 1, r: 5 });
    o += R(x, y, 6, h, { fill: d.color, r: 2 });
    o += T(x + 17, y + 27, `${label}  ${d.range}`, { size: 14, weight: 700, fill: inkOf(d.color) });
    o += T(x + 17, y + 55, d.title, { size: 17, weight: 700 });
    o += MT(x + 17, y + 81, d.body, { size: 14, fill: MUTED, leading: 20 });
    o += T(x + 17, y + h - 13, d.result, { size: 14, weight: 700, fill: inkOf(d.color) });
    return o;
  };
  s += routeCard(routes.time, 620, '路线 A');
  s += routeCard(routes.freq, 775, '路线 B', 58, 342, 145);

  s += MT(77, 956, ['频率基础继续分成两条路线'], { size: 14, weight: 700, fill: GREEN });
  s += L(67, 932, 67, 1225, { c: GRID, w: 3 });
  const childCard = (d, y, label) => {
    const x = 89; const w = 311; const h = 128;
    let o = `<circle cx="67" cy="${y + 23}" r="9" fill="#fff" stroke="${d.color}" stroke-width="3"/>`;
    o += L(76, y + 23, x - 5, y + 23, { c: d.color, w: 2 });
    o += R(x, y, w, h, { fill: '#fbfcfd', stroke: GRID, sw: 1, r: 5 });
    o += R(x, y, 6, h, { fill: d.color, r: 2 });
    o += T(x + 17, y + 27, `${label}  ${d.range}`, { size: 14, weight: 700, fill: inkOf(d.color) });
    o += T(x + 17, y + 54, d.title, { size: 17, weight: 700 });
    o += MT(x + 17, y + 79, d.body, { size: 14, fill: MUTED, leading: 20 });
    o += T(x + 17, y + h - 12, d.result, { size: 14, weight: 700, fill: inkOf(d.color) });
    return o;
  };
  s += childCard(routes.hearing, 984, '路线 C');
  s += childCard(routes.stats, 1133, '路线 D');

  const endY = 1295;
  s += R(pad, endY, W - 2 * pad, 112, { fill: '#fff8e5', stroke: '#f0d99d', sw: 1, r: 5 });
  s += T(W / 2, endY + 29, '实际任务：选择或组合', { size: 16, weight: 700, fill: '#7d5c00', anchor: 'middle' });
  s += MT(W / 2, endY + 55, ['时域 · 频谱/声谱图', '梅尔与 MFCC · 频谱统计', '四类证据都能直接使用'], { size: 14, fill: MUTED, leading: 20, anchor: 'middle' });
  return svgDoc(W, 1432, s, '二十三课从共同基础分向四类声音特征的手机课程路线图');
}

for (const [mode, draw] of [['desktop', desktop], ['mobile', mobile]]) {
  const out = join(BASE, mode); mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'course-roadmap.svg'), draw(), 'utf8');
}

console.log(`生成课程总纲 2 个版式：${BASE}`);
