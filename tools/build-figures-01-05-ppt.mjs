#!/usr/bin/env node
// 第 01–05 课按 PPT 重写后新增的配图，电脑版和手机版各出一张。
//
//   python lessons/lessonNN_*.py --dump    先跑，产出 课程代码/data/lessonNN.json
//   node tools/build-figures-01-05-ppt.mjs
//
// 数字一律从 data/lessonNN.json 读，这里不重算。第 01 课的教训：同一份数据
// 在 Python 和 Node 各算一遍，算出过 11.4 倍和 3.5 倍两个不同的结论。

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, ARROW, header, headerH,
  panel, curve, legend,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_01-05', 'figures');
const DATA = join(ROOT, 'NotebookLM课程博客_重写版', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));

// 手机版整张图从 420 缩到 360 px，是 0.857 倍。图内最小字号必须 >= 11.5/0.857
// = 13.5 px 才不触发 check-svg-mobile 的 ERROR；取 14 连 WARN 一起避开。
const tiny = (M) => (wide(M) ? 12.5 : 14);

const d02 = D('02');
const FIG = {};

// ================================================================ 02

// PPT p10：一条波形里同时带着频率、强弱、音色三样信息。
FIG['02-waveform-carries'] = (M) => {
  const head = ['同一条波形里，', '同时装着三样信息'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  // 一条带包络的合成波，只用来指认「看哪里」，不承载数值
  const n = 480;
  const wave = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / n;
    const env = 0.35 + 0.55 * Math.sin(Math.PI * t) ** 0.7;
    wave.push(env * (Math.sin(2 * Math.PI * 9 * t)
      + 0.35 * Math.sin(2 * Math.PI * 18 * t)
      + 0.18 * Math.sin(2 * Math.PI * 27 * t)) / 1.5);
  }
  const ph = w ? 118 : 96;
  const pn = panel(px, y, pw, ph, { yr: [-1.25, 1.25], zero: true });
  s += pn.s + curve(pn, wave, { c: BLUE, w: 1.5 });
  y += ph + 24;

  const items = [
    { name: '频率', c: BLUE, q: '一秒重复多少次', a: '听起来有多高', when: '这一课' },
    { name: '强弱', c: GREEN, q: '上下抖多大', a: '听起来有多响', when: '这一课' },
    { name: '音色', c: WARM, q: '重复的图案长什么样', a: '听起来像什么乐器', when: '第 03 课' },
  ];
  const cw = w ? (pw - 28) / 3 : pw;
  items.forEach((it, i) => {
    const bx = w ? px + i * (cw + 14) : px;
    const by = w ? y : y + i * 76;
    const bh = w ? 96 : 66;
    s += R(bx, by, cw, bh, { fill: PLATE, stroke: it.c, sw: 1.6, r: 9 });
    s += T(bx + 12, by + 24, it.name, { size: M.h2, weight: 700, fill: it.c });
    s += T(bx + cw - 12, by + 23, it.when, { size: tiny(M), fill: MUTED, anchor: 'end' });
    s += T(bx + 12, by + 47, `曲线上看：${it.q}`, { size: tiny(M), fill: INK });
    s += T(bx + 12, by + 66, `耳朵上听：${it.a}`, { size: tiny(M), fill: MUTED });
  });
  y += (w ? 96 : 76 * 3 - 10) + 26;
  s += T(px, y, '这不是三条曲线，是同一条曲线的三种读法：看重复得多快、看抖得多大、看重复的图案长什么样。',
    { size: M.small, weight: 700, fill: INK });
  return doc(M.W, y + 18, s, '一条波形同时携带频率、强弱与音色三种信息');
};

// PPT p11：周期性与非周期性。两条都来自真实录音。
FIG['02-periodic-or-not'] = (M) => {
  const { ms, violin, noise } = d02.periodic;
  const head = [`同样 ${ms} 毫秒的真实录音，`, '一条在重复，一条找不到重复'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const rows = [
    { nm: '周期性：小提琴（violin_c.wav）', v: violin, c: BLUE,
      note: '一段图案一遍遍出现，能数出「一秒重复几次」，所以问得了音高' },
    { nm: '非周期性：噪声（noise.wav）', v: noise, c: WARM,
      note: '怎么截都找不到重复，数不出次数，所以问音高没有意义' },
  ];
  const ph = w ? 92 : 78;
  rows.forEach((r) => {
    const pn = panel(px, y, pw, ph, {
      yr: [-1.12, 1.12], title: r.nm, tfill: r.c, tsize: M.small, zero: true,
    });
    s += pn.s + curve(pn, r.v, { c: r.c, w: 1.4 });
    y += ph + 22;
    s += (w
      ? T(px + 4, y, r.note, { size: tiny(M), fill: MUTED })
      : MT(px + 4, y, [r.note.slice(0, 17), r.note.slice(17)],
        { size: tiny(M), fill: MUTED, leading: 20 }));
    y += (w ? 0 : 20) + 26;
  });

  s += T(px, y + 4, '两条都按各自的峰值缩放过——这张图比的是形状重不重复，不是谁更响。',
    { size: M.small, weight: 700, fill: INK });
  return doc(M.W, y + 22, s, '真实录音中周期性声音与非周期性声音的波形对比');
};

// PPT p19：听觉范围。横轴按倍数分格，因为耳朵就是按倍数分辨的。
FIG['02-hearing-range'] = (M) => {
  const { low, high, marks } = d02.hearing;
  const head = ['人耳能听到的，', '是每秒 20 次到 20000 次之间的振动'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 26;

  // 横轴取以 10 为底的对数：耳朵按倍数分辨，等差刻度会把低音区全挤在一起
  const F0 = 5;
  const F1 = 60000;
  const lg = (v) => Math.log10(v);
  const X = (hz) => px + ((lg(hz) - lg(F0)) / (lg(F1) - lg(F0))) * pw;

  const barY = y;
  const barH = w ? 34 : 30;
  // 听不见的两段
  s += R(px, barY, X(low) - px, barH, { fill: '#f0f2f4', stroke: GRID, r: 5 });
  s += R(X(high), barY, px + pw - X(high), barH, { fill: '#f0f2f4', stroke: GRID, r: 5 });
  // 听得见的那一段
  s += R(X(low), barY, X(high) - X(low), barH,
    { fill: '#e8f3ea', stroke: GREEN, sw: 1.8, r: 5 });
  s += T((X(low) + X(high)) / 2, barY + barH / 2 + 5, '听得见', {
    size: M.h2, weight: 700, fill: GREEN, anchor: 'middle',
  });
  s += T(px + 8, barY + barH / 2 + 5, '次声', { size: tiny(M), fill: MUTED });
  s += T(px + pw - 8, barY + barH / 2 + 5, '超声',
    { size: tiny(M), fill: MUTED, anchor: 'end' });

  // 两条边界
  [[low, '20 Hz'], [high, '20 kHz']].forEach(([hz, lbl]) => {
    s += L(X(hz), barY - 10, X(hz), barY + barH + 10, { c: GREEN, w: 1.8 });
    s += T(X(hz), barY - 16, lbl, { size: tiny(M), weight: 700, fill: GREEN, anchor: 'middle' });
  });
  y = barY + barH + 22;

  // 刻度：每一格是十倍
  [10, 100, 1000, 10000].forEach((hz) => {
    s += L(X(hz), y, X(hz), y + 6, { c: GRID });
    s += T(X(hz), y + 20, hz >= 1000 ? `${hz / 1000}k` : `${hz}`,
      { size: tiny(M), fill: MUTED, anchor: 'middle' });
  });
  s += T(px, y + 20, '每格 ×10', { size: tiny(M), fill: MUTED });
  y += 34;

  // 常见声音落在哪儿。手机版放不下八条，只留听得见的那些
  const show = w ? marks : marks.filter((m) => m.inside);
  const perCol = w ? Math.ceil(show.length / 2) : show.length;
  show.forEach((m, i) => {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    const bx = px + col * (pw / 2);
    const by = y + row * 21;
    s += O(bx + 5, by - 4, 3.5, { fill: m.inside ? BLUE : MUTED });
    const hzText = m.hz >= 10000 ? `${m.hz / 1000} kHz` : `${m.hz} Hz`;
    s += T(bx + 16, by, `${m.name}　约 ${hzText}`,
      { size: tiny(M), fill: m.inside ? INK : MUTED });
  });
  y += perCol * 21 + 14;

  s += MT(px, y, w
    ? ['这个上限随年龄下降：年轻人可能听到 18 kHz 以上，中年之后常降到 15 kHz 左右。',
      '第 04 课决定「每秒该记录多少次」时，用的就是 20 kHz 这条上限。']
    : ['上限随年龄下降：年轻人能到 18 kHz 以上，',
      '中年后常降到 15 kHz 左右。第 04 课决定',
      '「每秒记录多少次」，靠的就是这条上限。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '人耳听觉范围 20 Hz 到 20 kHz，以及常见声音落在哪里');
};

// ================================================================

mkdirSync(join(BASE, 'desktop'), { recursive: true });
mkdirSync(join(BASE, 'mobile'), { recursive: true });
let n = 0;
for (const [name, make] of Object.entries(FIG)) {
  for (const mode of ['desktop', 'mobile']) {
    writeFileSync(join(BASE, mode, `${name}.svg`), make(MODES[mode]), 'utf8');
    n += 1;
  }
  console.log(`  ${name}`);
}
console.log(`${n} 个 SVG -> ${BASE}`);
