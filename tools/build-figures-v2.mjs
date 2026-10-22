#!/usr/bin/env node
// v2 课文专用的配图，电脑版和手机版各出一张，放在原版同组的 figures/ 里，
// 网站和 GitHub 都能直接引用；原版课文不引用它们。
//
//   node tools/build-figures-v2.mjs
//
// 图里的实测数字从 课程代码/data/lessonNN.json 读，不在这里重算。

import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, ARROW, header, headerH,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GROUP = (g) => join(ROOT, '音频信号处理二十三讲', g, 'figures');
const DATA = join(ROOT, '音频信号处理二十三讲', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));

// 手机版字号下限与 build-figures-01-05-ppt.mjs 相同，避开 check-svg-mobile 的告警
const tiny = (M) => (wide(M) ? 12.5 : 14);
const FIG = [];

// ================================================================ 01
// 第 01 课 1.2：照片缩成一样大就能逐格比；录音长短不一，得先算成同样几个数。
// 三格从上往下讲一件事，手机上照样竖着读。
FIG.push(['第01-05课', '01-v2-photo-vs-recording', (M) => {
  const clips = D('09').clips;
  const head = ['照片能直接比，', '录音得先算成同样几个数'];
  const w = wide(M);
  const px = M.pad, pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = headerH(M, head) + 8;
  const step = (n, title, color) => {
    s += `<circle cx="${px + 11}" cy="${y + 10}" r="11" fill="${color}"/>`;
    s += T(px + 11, y + 15, String(n), { size: 14, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(px + 30, y + 16, title, { size: M.h2, weight: 700, fill: color });
    y += 32;
  };

  // ---------- 1 照片 ----------
  step(1, '照片：缩成一样大，就能一格对一格地比', BLUE);
  const n = 6, cell = w ? 15 : 13;
  const shades = ['#dce9f3', '#b9d4e8', '#8bbad9', '#5d9fc8', '#2f84b8', '#0e6aa3'];
  const grid = (gx, gy, seed) => {
    let o = '';
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        const k = Math.abs(Math.round(2.5 + 2.4 * Math.sin(i * 1.3 + j * 0.9 + seed))) % shades.length;
        o += R(gx + j * cell, gy + i * cell, cell - 1.5, cell - 1.5, { fill: shades[k], stroke: 'none', r: 1.5 });
      }
    }
    // 同一个位置：第 3 行第 4 格
    o += R(gx + 3 * cell - 1.5, gy + 2 * cell - 1.5, cell + 1.5, cell + 1.5, { stroke: GOLD, sw: 2.4, r: 2 });
    return o;
  };
  const gw = n * cell;
  const g1 = px + 8, g2 = g1 + gw + (w ? 70 : 54);
  s += T(g1, y + 4, '照片 A', { size: tiny(M), fill: MUTED });
  s += T(g2, y + 4, '照片 B', { size: tiny(M), fill: MUTED });
  s += grid(g1, y + 12, 0) + grid(g2, y + 12, 2.1);
  const cy = y + 12 + 2.5 * cell;
  s += ARROW(g1 + 4 * cell + 4, cy, g2 + 3 * cell - 6, cy, { c: GOLD, w: 1.6 });
  s += ARROW(g2 + 3 * cell - 6, cy, g1 + 4 * cell + 4, cy, { c: GOLD, w: 1.6 });
  const note1 = ['第 3 行第 4 格，对第 3 行第 4 格。', '每个位置在两张照片里说的是同一处。'];
  if (w) { s += MT(g2 + gw + 36, y + 42, note1, { size: M.body, fill: INK }); y += 12 + gw + 22; }
  else { y += 12 + gw + 20; s += MT(px, y + 4, note1, { size: tiny(M), fill: INK, leading: 21 }); y += 50; }

  // ---------- 2 录音 ----------
  step(2, '录音：长短不一，同一个位置对不上', WARM);
  const lab = w ? 150 : 0;
  const sx = px + lab, sw = pw - lab;
  const strip = (yy, frac, label, seed) => {
    // 手机版把说明放在虚线右边，免得和虚线叠在一起
    if (w) s += T(px, yy + 21, label, { size: tiny(M), fill: INK });
    else s += T(sx + sw * 0.1 + 10, yy - 6, label, { size: tiny(M), fill: INK });
    const ww = sw * frac;
    s += R(sx, yy, ww, 30, { fill: '#fbf0ec', stroke: WARM, sw: 1, r: 4 });
    const pts = [];
    const m = Math.max(12, Math.round(ww / 2.2));
    for (let i = 0; i <= m; i += 1) {
      const u = i / m;
      const a = 0.25 + 0.6 * Math.abs(Math.sin(u * 5.3 * frac * 10 + seed));
      pts.push([sx + u * ww, yy + 15 + (i % 2 ? 1 : -1) * a * 12]);
    }
    s += `<polyline points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" fill="none" stroke="${WARM}" stroke-width="1" stroke-linejoin="round"/>`;
  };
  const yA = y + (w ? 0 : 22), yB = yA + (w ? 44 : 62);
  strip(yA, 0.1, '3 秒：66150 个数', 0.4);
  strip(yB, 1, '30 秒：661500 个数', 1.7);
  const cut = sx + sw * 0.1;
  s += L(cut, yA - 6, cut, yB + 38, { c: INK, w: 1.4, dash: '4 3' });
  y = yB + 52;
  const note2 = w
    ? ['虚线是同一个位置：第 66150 个数。上面那段到这里已经结束，下面那段才走了十分之一。']
    : ['虚线是同一个位置：第 66150 个数。', '上面那段到这里已经结束，', '下面那段才走了十分之一。'];
  s += MT(px, y, note2, { size: w ? M.body : tiny(M), fill: INK, leading: 21 });
  y += note2.length * 21 + 14;

  // ---------- 3 特征 ----------
  step(3, '先算成特征：不管多长，每段都变成同样几个数', GREEN);
  const rows = [['古典', clips.debussy], ['摇滚', clips.redhot]];
  const tw = w ? 380 : pw, rh = 30;
  const c0 = w ? 90 : 76, c1 = (tw - c0) / 2;
  const tx = px;
  s += R(tx, y, tw, rh * 3, { fill: '#eef7f2', stroke: GREEN, sw: 1.2, r: 6 });
  s += T(tx + c0 + c1 / 2, y + 20, '平均多响', { size: tiny(M), weight: 700, fill: GREEN, anchor: 'middle' });
  s += T(tx + c0 + c1 * 1.5, y + 20, '正负号换得多勤', { size: tiny(M), weight: 700, fill: GREEN, anchor: 'middle' });
  rows.forEach(([name, c], i) => {
    const ry = y + rh * (i + 1);
    s += L(tx, ry, tx + tw, ry, { c: '#cfe5d8', w: 1 });
    s += T(tx + 14, ry + 20, name, { size: M.body, weight: 700 });
    s += T(tx + c0 + c1 / 2, ry + 20, c.rms_mean.toFixed(4), { size: M.body, anchor: 'middle' });
    s += T(tx + c0 + c1 * 1.5, ry + 20, c.zcr_mean.toFixed(4), { size: M.body, anchor: 'middle' });
  });
  if (w) {
    const bx = tx + tw + 70, bw = M.W - M.pad - bx;
    s += ARROW(tx + tw + 10, y + rh * 1.5, bx - 8, y + rh * 1.5, { c: MUTED });
    s += R(bx, y + 8, bw, rh * 3 - 16, { fill: '#fff', stroke: BLUE, sw: 1.4, r: 8 });
    s += MT(bx + 16, y + 38, ['两行一样长，', '这才交给判断程序去比'], { size: M.body, fill: BLUE });
    y += rh * 3 + 26;
  } else {
    y += rh * 3 + 10;
    s += ARROW(px + pw / 2, y, px + pw / 2, y + 22, { c: MUTED });
    y += 28;
    s += R(px, y, pw, 40, { fill: '#fff', stroke: BLUE, sw: 1.4, r: 8 });
    s += T(px + pw / 2, y + 26, '两行一样长，这才交给判断程序去比', { size: tiny(M), fill: BLUE, anchor: 'middle' });
    y += 64;
  }
  const foot = w
    ? ['表里是第 9 课的实测（各取 3 秒）。从一长串数算出这几个数，就是这 23 课要学的事。']
    : ['表里是第 9 课的实测（各取 3 秒）。', '从一长串数算出这几个数，', '就是这 23 课要学的事。'];
  s += MT(px, y, foot, { size: tiny(M), fill: MUTED, leading: 20 });
  y += foot.length * 20 + 6;
  return doc(M.W, Math.round(y), s, '照片缩成一样大就能逐格比较；两段录音长短不同，同一个位置对不上；先把每段算成同样几个特征，才能交给判断程序');
}]);

for (const [group, name, make] of FIG) {
  for (const mode of ['desktop', 'mobile']) {
    writeFileSync(join(GROUP(group), mode, `${name}.svg`), make(MODES[mode]), 'utf8');
  }
  console.log(`写好了 ${group}/figures/{desktop,mobile}/${name}.svg`);
}
