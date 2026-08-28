#!/usr/bin/env node
// 为 23 篇文章生成紧凑的课程位置图；桌面显示完整 23 课，手机显示五阶段和组内进度。

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgDoc, T, R, L, PALETTE } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版');
const { ink: INK, muted: MUTED, grid: GRID, plate: PLATE } = PALETTE;
const COLORS = [PALETTE.s1, PALETTE.s2, PALETTE.s3, PALETTE.s4, '#7656b5'];

const stages = [
  { range: '01—05', short: '声音基础', title: '声音与数字录音', start: 1, end: 5, dir: '零基础版_01-05' },
  { range: '06—10', short: '时域特征', title: '分帧与时域特征', start: 6, end: 10, dir: '零基础版_06-10' },
  { range: '11—15', short: '傅里叶', title: '傅里叶与时间—频率', start: 11, end: 15, dir: '零基础版_11-15' },
  { range: '16—20', short: '梅尔/MFCC', title: '声谱图、梅尔与 MFCC', start: 16, end: 20, dir: '零基础版_16-20' },
  { range: '21—23', short: '频域统计', title: '频域统计特征', start: 21, end: 23, dir: '零基础版_21-23' },
];

const labels = [
  '三种声音表示', '波形、频率与音高', '分贝、响度与音色', '采样率与位深', '怎样选择音频特征',
  '分帧、加窗与聚合', '三种时域特征', '实现振幅包络', '实现 RMS 与过零率', '傅里叶变换直觉',
  '复数的模与相位', '傅里叶为何使用复数', 'DFT 与频率格', '正确读取 FFT 频谱', '短时傅里叶变换',
  '可信的功率声谱图', '梅尔刻度与滤波器组', '实现对数梅尔频谱', 'MFCC 与 DCT', 'MFCC 动态特征',
  '三类频域统计', '实现带能量比 BER', '频谱质心与带宽',
];

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function MT(x, y, lines, o = {}) {
  const { size = 15, weight = 400, fill = INK, leading = Math.round(size * 1.45), anchor = 'start' } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines.map((v, i) => `<tspan x="${x}" dy="${i ? leading : 0}">${esc(v)}</tspan>`).join('')}</text>`;
}
const stageOf = (lesson) => stages.findIndex((s) => lesson >= s.start && lesson <= s.end);
const circle = (x, y, r, fill, stroke, sw = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

function desktop(lesson) {
  const W = 880; const H = 166; const pad = 28; const si = stageOf(lesson); const active = stages[si]; const color = COLORS[si];
  let s = T(pad, 31, `课程位置｜第 ${String(lesson).padStart(2, '0')} / 23 课`, { size: 17, weight: 700 });
  s += T(W - pad, 31, labels[lesson - 1], { size: 16, weight: 700, fill: color, anchor: 'end' });
  s += T(pad, 56, `当前阶段：${active.title}`, { size: 14, fill: MUTED });
  const x0 = pad + 7; const x1 = W - pad - 7; const y = 92; const step = (x1 - x0) / 22;
  stages.forEach((g, i) => {
    const a = x0 + (g.start - 1) * step; const b = x0 + (g.end - 1) * step;
    s += L(a, y, b, y, { c: COLORS[i], w: i === si ? 5 : 2.5 });
    const cx = (a + b) / 2;
    s += T(cx, 128, g.range, { size: 12.5, weight: 700, fill: i === si ? COLORS[i] : MUTED, anchor: 'middle' });
    s += T(cx, 149, g.short, { size: 12.5, fill: i === si ? COLORS[i] : MUTED, anchor: 'middle' });
  });
  for (let n = 1; n <= 23; n += 1) {
    const i = stageOf(n); const x = x0 + (n - 1) * step;
    const passed = n < lesson; const current = n === lesson;
    s += circle(x, y, current ? 7 : 4.2, current || passed ? COLORS[i] : '#fff', COLORS[i], current ? 3 : 1.5);
  }
  return svgDoc(W, H, s, `第 ${lesson} 课在二十三课课程路线中的位置`);
}

function mobile(lesson) {
  const W = 420; const H = 222; const pad = 20; const si = stageOf(lesson); const active = stages[si]; const color = COLORS[si];
  let s = T(pad, 30, `课程位置｜第 ${String(lesson).padStart(2, '0')} / 23 课`, { size: 17, weight: 700 });
  s += T(pad, 56, labels[lesson - 1], { size: 15, weight: 700, fill: color });
  const gap = 5; const y = 82; const w = (W - 2 * pad - gap * 4) / 5;
  stages.forEach((g, i) => {
    const x = pad + i * (w + gap); const on = i === si;
    s += R(x, y, w, 58, { fill: on ? `${COLORS[i]}18` : PLATE, stroke: on ? COLORS[i] : GRID, sw: on ? 2 : 1, r: 3 });
    s += T(x + w / 2, y + 23, g.range, { size: 14, weight: 700, fill: on ? COLORS[i] : MUTED, anchor: 'middle' });
    s += T(x + w / 2, y + 46, g.short, { size: 14, fill: on ? COLORS[i] : MUTED, anchor: 'middle' });
  });
  const count = active.end - active.start + 1; const here = lesson - active.start + 1;
  s += T(pad, 171, `当前阶段：${active.title}`, { size: 14, weight: 700, fill: color });
  s += T(W - pad, 171, `本组第 ${here} / ${count} 课`, { size: 14, fill: MUTED, anchor: 'end' });
  const dotStart = pad + 7; const dotEnd = W - pad - 7; const dotStep = count > 1 ? (dotEnd - dotStart) / (count - 1) : 0; const dy = 199;
  s += L(dotStart, dy, dotEnd, dy, { c: GRID, w: 3 });
  for (let k = 0; k < count; k += 1) {
    const x = dotStart + k * dotStep; const n = k + 1;
    s += circle(x, dy, n === here ? 7 : 5, n <= here ? color : '#fff', color, n === here ? 3 : 1.5);
  }
  return svgDoc(W, H, s, `第 ${lesson} 课在二十三课课程路线中的位置`);
}

for (let lesson = 1; lesson <= 23; lesson += 1) {
  const stage = stages[stageOf(lesson)];
  for (const [mode, draw] of [['desktop', desktop], ['mobile', mobile]]) {
    const out = join(BASE, stage.dir, 'figures', mode); mkdirSync(out, { recursive: true });
    writeFileSync(join(out, `00-course-position-${String(lesson).padStart(2, '0')}.svg`), draw(lesson), 'utf8');
  }
}

console.log('生成 23 课 × 2 版式 = 46 张课程位置图');
