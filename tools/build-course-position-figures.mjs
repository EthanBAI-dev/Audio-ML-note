#!/usr/bin/env node
// 每篇文章顶部的「课程位置」图。
//
//   node tools/build-course-position-figures.mjs
//
// 它是本组的目录，不是全课程的进度条。
// 旧版把 23 课画成一排小圆点，读者既要在里面找自己，又看不出本组讲什么。
// 现在只画当前这一组：这一组要解决什么，组里有哪几课，自己是第几课。
// 全课程的位置只用一行文字和一条五段小条交代，不喧宾夺主。

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, T, R, L, PALETTE } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版');
const { ink: INK, muted: MUTED, grid: GRID, plate: PLATE } = PALETTE;
const COLORS = [PALETTE.s1, PALETTE.s2, PALETTE.s3, '#a5761a', '#7656b5'];

const stages = [
  {
    range: '01—05', short: '声音基础', title: '认识声音与数字录音',
    goal: '先看懂电脑拿到的到底是什么，以及录音参数决定了什么',
    start: 1, end: 5, dir: '零基础版_01-05',
  },
  {
    range: '06—10', short: '时域特征', title: '把录音变成可计算片段',
    goal: '把整段声音切成短片段，再逐段算出可以比较的数字',
    start: 6, end: 10, dir: '零基础版_06-10',
  },
  {
    range: '11—15', short: '傅里叶', title: '从波形进入时间—频率',
    goal: '找出声音里有哪些频率，以及它们分别在什么时候出现',
    start: 11, end: 15, dir: '零基础版_11-15',
  },
  {
    range: '16—20', short: '梅尔/MFCC', title: '把频谱整理成模型输入',
    goal: '把上千个频率成分压成几十个更接近听觉的数字',
    start: 16, end: 20, dir: '零基础版_16-20',
  },
  {
    range: '21—23', short: '频域统计', title: '用少量数字概括频谱',
    goal: '用三个能解释的统计量概括一帧频谱',
    start: 21, end: 23, dir: '零基础版_21-23',
  },
];

// 每课在目录里的短名。桌面版按两行排，所以每行不超过 7 个字。
const labels = [
  ['三种', '声音表示'], ['波形、频率', '与音高'], ['分贝、响度', '与音色'],
  ['采样率', '与位深'], ['怎样选择', '音频特征'],
  ['分帧、加窗', '与聚合'], ['三种', '时域特征'], ['实现', '振幅包络'],
  ['实现 RMS', '与过零率'], ['傅里叶变换', '的直觉'],
  ['复数的模', '与相位'], ['傅里叶', '为何用复数'], ['DFT', '与频率格'],
  ['正确读取', 'FFT 频谱'], ['短时', '傅里叶变换'],
  ['可信的', '功率声谱图'], ['梅尔刻度', '与滤波器组'], ['实现', '对数梅尔谱'],
  ['MFCC', '与 DCT'], ['MFCC', '动态特征'],
  ['三类', '频域统计'], ['实现', '带能量比'], ['频谱质心', '与带宽'],
];

// 手机版是单行，直接拼两行会丢空格（「实现 RMS与过零率」），所以单列一份完整名。
const fullLabels = [
  '三种声音表示', '波形、频率与音高', '分贝、响度与音色', '采样率与位深', '怎样选择音频特征',
  '分帧、加窗与聚合', '三种时域特征', '实现振幅包络', '实现 RMS 与过零率', '傅里叶变换的直觉',
  '复数的模与相位', '傅里叶为何用复数', 'DFT 与频率格', '正确读取 FFT 频谱', '短时傅里叶变换',
  '可信的功率声谱图', '梅尔刻度与滤波器组', '实现对数梅尔谱', 'MFCC 与 DCT', 'MFCC 动态特征',
  '三类频域统计', '实现带能量比', '频谱质心与带宽',
];

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function MT(x, y, lines, o = {}) {
  const { size = 15, weight = 400, fill = INK, leading = Math.round(size * 1.45), anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" `
    + `text-anchor="${anchor}">${lines.map((v, i) =>
      `<tspan x="${x}" dy="${i ? leading : 0}">${esc(v)}</tspan>`).join('')}</text>`;
}
const stageOf = (lesson) => stages.findIndex((s) => lesson >= s.start && lesson <= s.end);

/** 五段小条：只说明本组在整门课的哪一段，不列具体课号。 */
function stageStrip(x, y, w, si, o = {}) {
  const { h = 6, gap = 5, labelY = 20, size = 12 } = o;
  const seg = (w - gap * 4) / 5;
  let s = '';
  stages.forEach((g, i) => {
    const sx = x + i * (seg + gap);
    s += R(sx, y, seg, h, { fill: i === si ? COLORS[i] : '#e2e7ec', r: 3, stroke: 'none' });
    if (labelY) {
      s += T(sx + seg / 2, y + labelY, g.short,
        { size, fill: i === si ? COLORS[i] : '#a8b2bb', weight: i === si ? 700 : 400, anchor: 'middle' });
    }
  });
  return s;
}

function desktop(lesson) {
  const W = 880; const pad = 28;
  const si = stageOf(lesson);
  const g = stages[si];
  const color = COLORS[si];
  const n = g.end - g.start + 1;

  let s = R(pad, 24, 5, 46, { fill: color, r: 3, stroke: 'none' });
  s += T(pad + 18, 45, `第 ${si + 1} 组 · ${g.range}`, { size: 14, weight: 700, fill: color });
  s += T(pad + 18, 68, g.title, { size: 20, weight: 700 });
  s += T(W - pad, 45, `第 ${lesson} 课 / 共 23 课`, { size: 13.5, fill: MUTED, anchor: 'end' });
  s += stageStrip(W - pad - 250, 56, 250, si, { labelY: 0 });
  s += T(pad + 18, 96, g.goal, { size: 14.5, fill: MUTED });

  // 本组目录：一课一张小卡，当前课高亮
  const y = 118; const cardH = 92; const gap = 12;
  const cw = (W - pad * 2 - gap * (n - 1)) / n;
  for (let k = 0; k < n; k += 1) {
    const num = g.start + k;
    const on = num === lesson;
    const x = pad + k * (cw + gap);
    s += R(x, y, cw, cardH, {
      fill: on ? `${color}14` : PLATE, stroke: on ? color : GRID, sw: on ? 2.5 : 1, r: 8,
    });
    s += T(x + 14, y + 30, String(num).padStart(2, '0'),
      { size: 19, weight: 700, fill: on ? color : '#aab4bd' });
    s += MT(x + 14, y + 54, labels[num - 1],
      { size: 14, weight: on ? 700 : 400, fill: on ? INK : MUTED, leading: 20 });
    if (on) s += T(x + cw - 14, y + 30, '正在读', { size: 12.5, weight: 700, fill: color, anchor: 'end' });
  }
  return svgDoc(W, y + cardH + 22, s, `第 ${lesson} 课属于第 ${si + 1} 组「${g.title}」，本组共 ${n} 课`);
}

function mobile(lesson) {
  const W = 420; const pad = 20;
  const si = stageOf(lesson);
  const g = stages[si];
  const color = COLORS[si];
  const n = g.end - g.start + 1;

  let s = R(pad, 22, 5, 42, { fill: color, r: 3, stroke: 'none' });
  s += T(pad + 16, 41, `第 ${si + 1} 组 · ${g.range}`, { size: 14, weight: 700, fill: color });
  s += T(pad + 16, 63, g.title, { size: 19, weight: 700 });
  s += MT(pad, 92, [g.goal.length > 18 ? g.goal.slice(0, 18) : g.goal,
    g.goal.length > 18 ? g.goal.slice(18) : ''].filter(Boolean),
  { size: 14, fill: MUTED, leading: 21 });

  const y0 = g.goal.length > 18 ? 122 : 108;
  const rowH = 44; const gap = 8;
  for (let k = 0; k < n; k += 1) {
    const num = g.start + k;
    const on = num === lesson;
    const y = y0 + k * (rowH + gap);
    s += R(pad, y, W - pad * 2, rowH, {
      fill: on ? `${color}14` : PLATE, stroke: on ? color : GRID, sw: on ? 2.5 : 1, r: 7,
    });
    s += T(pad + 14, y + 29, String(num).padStart(2, '0'),
      { size: 17, weight: 700, fill: on ? color : '#aab4bd' });
    s += T(pad + 52, y + 29, fullLabels[num - 1],
      { size: 15, weight: on ? 700 : 400, fill: on ? INK : MUTED });
    if (on) s += T(W - pad - 14, y + 29, '正在读', { size: 13.5, weight: 700, fill: color, anchor: 'end' });
  }

  const sy = y0 + n * (rowH + gap) + 6;
  s += stageStrip(pad, sy, W - pad * 2, si, { labelY: 22, size: 13.5 });
  return svgDoc(W, sy + 36, s, `第 ${lesson} 课属于第 ${si + 1} 组「${g.title}」，本组共 ${n} 课`);
}

let count = 0;
for (const g of stages) {
  for (const mode of ['desktop', 'mobile']) {
    const dir = join(BASE, g.dir, 'figures', mode);
    mkdirSync(dir, { recursive: true });
    for (let n = g.start; n <= g.end; n += 1) {
      const svg = mode === 'desktop' ? desktop(n) : mobile(n);
      writeFileSync(join(dir, `00-course-position-${String(n).padStart(2, '0')}.svg`), svg, 'utf8');
      count += 1;
    }
  }
}
console.log(`生成 ${count} 张课程位置图（23 课 × 2 版式）`);
