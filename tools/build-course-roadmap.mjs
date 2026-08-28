#!/usr/bin/env node
// 课程总纲：同一内容生成桌面横向路线图与手机纵向路线图。

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, T, R, L, P, PALETTE } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '课程总纲', 'figures');
const [BLUE, ORANGE, GREEN, GOLD] = [PALETTE.s1, PALETTE.s2, PALETTE.s3, PALETTE.s4];
const PURPLE = '#7656b5';
const { ink: INK, muted: MUTED, grid: GRID, plate: PLATE } = PALETTE;

const stages = [
  {
    range: '01—05', title: ['认识声音', '与数字录音'], question: ['电脑拿到声音时，', '到底能看见什么？'],
    lessons: ['三种声音表示', '波形、频率与音高', '分贝、响度与音色', '采样率与位深', '按任务选择特征'],
    result: ['读懂基本声音图形', '理解录音参数'], color: BLUE, icon: 'views', start: 1,
  },
  {
    range: '06—10', title: ['把录音变成', '可计算片段'], question: ['怎样沿时间切开声音，', '再提取基础证据？'],
    lessons: ['分帧、加窗与聚合', '三种时域特征', '实现振幅包络', '实现 RMS 与过零率', '建立傅里叶直觉'],
    result: ['会分帧和建立时间轴', '会计算时域特征'], color: ORANGE, icon: 'frames', start: 6,
  },
  {
    range: '11—15', title: ['从波形进入', '时间—频率'], question: ['怎样找到有哪些频率，', '以及它们何时出现？'],
    lessons: ['复数的模与相位', '傅里叶为何使用复数', 'DFT 与频率格', '正确读取 FFT', '短时傅里叶变换'],
    result: ['正确计算频谱与 STFT', '理解矩阵形状和取舍'], color: GREEN, icon: 'fourier', start: 11,
  },
  {
    range: '16—20', title: ['把频谱整理成', '可用的模型输入'], question: ['怎样让频率表示更稳定，', '也更接近听觉尺度？'],
    lessons: ['可信的功率声谱图', '梅尔刻度与滤波器组', '对数梅尔频谱', 'MFCC 与 DCT', 'Delta 与 39 维拼接'],
    result: ['实现对数梅尔与 MFCC', '固定参数和边界'], color: GOLD, icon: 'mel', start: 16,
  },
  {
    range: '21—23', title: ['用少量数字', '概括一帧频谱'], question: ['怎样量出频率分布的', '比例、中心与扩散？'],
    lessons: ['三类频域统计问题', '实现带能量比 BER', '计算质心与带宽'],
    result: ['按任务选择频域特征', '保持权重与坐标一致'], color: PURPLE, icon: 'features', start: 21,
  },
];

const outcomes = [
  ['看懂', '波形、频谱与声谱图'],
  ['计算', '时域特征、FFT 与 STFT'],
  ['实现', '对数梅尔、MFCC 与 BER'],
  ['排错', '单位、坐标、形状与边界'],
  ['选择', '从任务证据到模型输入'],
];

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
  const W = 880; const pad = 28; const gap = 12; const colW = (W - 2 * pad - 4 * gap) / 5; const top = 188; const stageH = 430;
  let s = MT(pad, 35, ['从声音到机器学习特征：23 课课程总纲'], { size: 24, weight: 700 });
  s += T(pad, 68, '目标不是背函数名，而是理解每一步保留什么、丢掉什么、参数错了会怎样', { size: 15, fill: MUTED });
  s += R(pad, 92, W - 2 * pad, 70, { fill: '#eef5fd', stroke: '#cbdff5', sw: 1, r: 5 });
  s += T(pad + 16, 119, '系列目的', { size: 15, weight: 700, fill: BLUE });
  s += T(pad + 104, 119, '把空气振动变成电脑可计算、可解释、可复现的声音证据', { size: 17, weight: 700 });
  s += T(pad + 104, 145, '终点是准备可信的模型输入；模型训练、网络结构与部署不在本系列范围内', { size: 13.5, fill: MUTED });

  stages.forEach((d, i) => {
    const x = pad + i * (colW + gap); const y = top;
    s += R(x, y, colW, stageH, { fill: i % 2 ? '#fbfcfd' : PLATE, stroke: GRID, sw: 1, r: 4 });
    s += R(x, y, colW, 6, { fill: d.color, r: 2 });
    s += T(x + 12, y + 32, d.range, { size: 14, weight: 700, fill: inkOf(d.color) });
    s += MT(x + 12, y + 60, d.title, { size: 16.5, weight: 700, leading: 23 });
    s += icon(d.icon, x + 18, y + 111, colW - 36, 55, d.color);
    s += MT(x + 12, y + 194, d.question, { size: 13.5, weight: 700, fill: inkOf(d.color), leading: 20 });
    s += L(x + 12, y + 239, x + colW - 12, y + 239, { c: GRID });
    d.lessons.forEach((v, k) => { s += T(x + 14, y + 263 + k * 23, `${String(d.start + k).padStart(2, '0')}  ${v}`, { size: 12.5, fill: INK }); });
    const ry = y + 385; s += L(x + 12, ry - 15, x + colW - 12, ry - 15, { c: d.color, w: 2 });
    s += MT(x + 12, ry + 8, d.result, { size: 12.5, weight: 700, fill: inkOf(d.color), leading: 19 });
    if (i < 4) s += arrow(x + colW + 2, y + 80, x + colW + gap - 2, y + 80, MUTED);
  });

  const oy = top + stageH + 35; s += T(pad, oy, '学完以后，读者能够', { size: 19, weight: 700 });
  const ow = (W - 2 * pad - 4 * gap) / 5;
  outcomes.forEach((d, i) => { const x = pad + i * (ow + gap); s += L(x, oy + 23, x + ow, oy + 23, { c: stages[i].color, w: 4 }); s += T(x, oy + 51, d[0], { size: 16, weight: 700, fill: inkOf(stages[i].color) }); s += MT(x, oy + 75, [d[1]], { size: 12.5, fill: MUTED }); });
  s += T(W / 2, oy + 128, '一条主线：听懂声音 → 切分声音 → 看见频率 → 构建表示 → 提取特征', { size: 15, weight: 700, anchor: 'middle' });
  return svgDoc(W, oy + 154, s, '从声音到机器学习特征的二十三课桌面课程总纲');
}

function mobile() {
  const W = 420; const pad = 20; const spineX = 42; const boxX = 64; const boxW = W - boxX - pad; const stageH = 270; const gap = 22; const top = 254;
  let s = MT(pad, 31, ['从声音到机器学习特征', '23 课课程总纲'], { size: 20, weight: 700, leading: 28 });
  s += MT(pad, 96, ['不只会调用函数，还要知道：', '每一步保留什么、丢掉什么，', '参数错了会怎样。'], { size: 14, fill: MUTED, leading: 21 });
  s += R(pad, 172, W - 2 * pad, 62, { fill: '#eef5fd', stroke: '#cbdff5', sw: 1, r: 4 });
  s += MT(W / 2, 197, ['把声音变成可计算、可解释、', '可复现的证据'], { size: 14, weight: 700, fill: BLUE, leading: 21, anchor: 'middle' });
  s += L(spineX, top + 18, spineX, top + stages.length * (stageH + gap) - gap - 18, { c: GRID, w: 4 });

  stages.forEach((d, i) => {
    const y = top + i * (stageH + gap); const cy = y + 26;
    s += `<circle cx="${spineX}" cy="${cy}" r="13" fill="#fff" stroke="${d.color}" stroke-width="4"/>`;
    s += L(spineX + 13, cy, boxX - 5, cy, { c: d.color, w: 2 });
    s += R(boxX, y, boxW, stageH, { fill: i % 2 ? '#fbfcfd' : PLATE, stroke: GRID, sw: 1, r: 4 });
    s += R(boxX, y, 6, stageH, { fill: d.color, r: 2 });
    s += T(boxX + 17, y + 28, d.range, { size: 14, weight: 700, fill: inkOf(d.color) });
    s += MT(boxX + 87, y + 27, d.title, { size: 17, weight: 700, leading: 22 });
    s += icon(d.icon, boxX + boxW - 91, y + 17, 67, 48, d.color);
    s += MT(boxX + 17, y + 82, d.question, { size: 14, weight: 700, fill: inkOf(d.color), leading: 20 });
    s += L(boxX + 17, y + 126, boxX + boxW - 17, y + 126, { c: GRID });
    const split = Math.ceil(d.lessons.length / 2);
    d.lessons.forEach((v, k) => { const col = k >= split ? 1 : 0; const row = col ? k - split : k; const xx = boxX + 17 + col * (boxW - 34) / 2; s += T(xx, y + 151 + row * 22, `• ${v}`, { size: 14 }); });
    s += L(boxX + 17, y + 214, boxX + boxW - 17, y + 214, { c: d.color, w: 2 });
    s += MT(boxX + 17, y + 239, [`学会：${d.result[0]}`, d.result[1]], { size: 14, weight: 700, fill: inkOf(d.color), leading: 20 });
  });

  const oy = top + stages.length * (stageH + gap) + 18; s += MT(pad, oy, ['学完以后，你能够'], { size: 19, weight: 700 });
  outcomes.forEach((d, i) => { const y = oy + 32 + i * 52; s += L(pad, y, pad + 36, y, { c: stages[i].color, w: 5 }); s += T(pad + 49, y + 5, d[0], { size: 15, weight: 700, fill: inkOf(stages[i].color) }); s += T(pad + 105, y + 5, d[1], { size: 14, fill: MUTED }); });
  const endY = oy + 318; s += R(pad, endY, W - 2 * pad, 69, { fill: '#fff8e5', stroke: '#f0d99d', sw: 1, r: 4 });
  s += MT(W / 2, endY + 27, ['课程终点：准备可信的模型输入', '不包含模型训练、网络结构与部署'], { size: 14, weight: 700, fill: '#7d5c00', leading: 22, anchor: 'middle' });
  return svgDoc(W, endY + 90, s, '从声音到机器学习特征的二十三课手机课程总纲');
}

for (const [mode, draw] of [['desktop', desktop], ['mobile', mobile]]) {
  const out = join(BASE, mode); mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'course-roadmap.svg'), draw(), 'utf8');
}

console.log(`生成课程总纲 2 个版式：${BASE}`);
