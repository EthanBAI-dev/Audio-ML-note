#!/usr/bin/env node
// 第 03 课「音色是三件事」那一节的配图。
//
//   python tools/measure-03-timbre.py           先跑这个，它产出 tools/data/03-timbre.json
//   node tools/build-figures-03-timbre.mjs      默认只出电脑版
//   node tools/build-figures-03-timbre.mjs --all  内容定稿后再加手机版
//
// 它替换的是原稿时代的 03-timbre.svg。那张图画的是钢琴对小提琴，图注写着
// 「两者音高完全相同」——实测差整整一个八度，那句话是错的。这里换成
// violin_c 对 sax，两者都是 C4，统一电平后 RMS 也精确相同。

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, header, headerH,
  panel, curve, bars, legend,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_01-05', 'figures');
const D = JSON.parse(readFileSync(join(ROOT, 'tools', 'data', '03-timbre.json'), 'utf8'));
const tiny = (M) => (wide(M) ? 12.5 : 14);

const FIG = {};

// ---------------------------------------------------------------- 音色三件事
FIG['03-timbre-three'] = (M) => {
  const head = ['同一个音、同样的响度，', '三件事让它们听起来完全不同'];
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 6;

  const V = D.inst.violin_c;
  const X = D.inst.sax;
  const PNO = D.inst.piano_c;

  // —— 前提：两个变量都锁住了 ——
  s += T(px, y + 14, '前提：这一对把音高和响度都控制住了', { size: M.h2, weight: 700 });
  y += 26;
  const cells = [
    ['', '基频', '琴键编号', '统一后 RMS'],
    [V.zh, `${V.f0} Hz`, `${V.midi}`, `${V.rms.toFixed(4)}`],
    [X.zh, `${X.f0} Hz`, `${X.midi}`, `${X.rms.toFixed(4)}`],
  ];
  const colw = [90, 110, 110, 120];
  cells.forEach((row, ri) => {
    const ry = y + ri * 24;
    if (ri === 0) s += L(px, ry + 18, px + colw.reduce((a, b) => a + b), ry + 18, { c: GRID });
    let cx = px;
    row.forEach((c, ci) => {
      s += T(cx, ry + 12, c, {
        size: tiny(M),
        weight: ri === 0 ? 700 : 400,
        fill: ri === 0 ? MUTED : INK,
      });
      cx += colw[ci];
    });
  });
  s += T(px + colw.reduce((a, b) => a + b) + 16, y + 48,
    '59.9 和 60.0 是同一个音（C4）', { size: tiny(M), weight: 700, fill: GREEN });
  y += 24 * 3 + 16;

  // —— 第一件事：包络 ——
  s += T(px, y + 14, '① 包络：怎么开始、怎么持续', { size: M.h2, weight: 700, fill: BLUE });
  y += 44;
  const eh = 86;
  const ew = wide(M) ? (pw - 24) / 2 : pw;
  [[V, BLUE], [X, WARM]].forEach(([d, c], i) => {
    const ex = wide(M) ? px + i * (ew + 24) : px;
    const ey = wide(M) ? y : y + i * (eh + 46);
    const pn = panel(ex, ey, ew, eh, { fill: PLATE });
    s += pn.s;
    s += curve(pn, d.env, { c, w: 1.8 });
    // 峰值位置那一条竖线
    const kx = ex + ew * d.peak_at;
    s += L(kx, ey, kx, ey + eh, { c: GOLD, w: 1.6, dash: '4 3' });
    s += O(kx, ey + 6, 3.2, { fill: GOLD });
    s += T(ex, ey - 5, `${d.zh}　全长 ${d.dur} 秒`, { size: tiny(M), weight: 700, fill: c });
    s += T(ex + ew, ey - 5, `峰值在 ${(d.peak_at * 100).toFixed(0)}%`, {
      size: tiny(M), weight: 700, fill: GOLD, anchor: 'end',
    });
  });
  y += (wide(M) ? eh : eh * 2 + 46) + 22;
  s += T(px, y, '萨克斯一吹就到顶，小提琴要到一半才最响。', { size: M.small, fill: MUTED });
  y += 26;

  // —— 第二件事：泛音分布 ——
  s += T(px, y + 14, '② 泛音分布：整数倍频率上各有多强', { size: M.h2, weight: 700, fill: GREEN });
  y += 30;
  const bh = 92;
  const order = [['violin_c', BLUE], ['sax', WARM], ['piano_c', MUTED]];
  // 基频那一组三根柱永远都是 1.00（它就是基准），画出来只会让数字挤在一起。
  // 只画 2–6 倍，基准写在标题里。
  const groups = [];
  for (let k = 1; k < 6; k += 1) {
    groups.push({
      name: `${k + 1} 倍`,
      vals: order.map(([nm, c]) => ({ v: D.inst[nm].harm[k], c, t: D.inst[nm].harm[k].toFixed(2) })),
    });
  }
  s += T(px + pw, y - 8, '纵轴：以各自的基频为 1.00', {
    size: tiny(M), fill: MUTED, anchor: 'end',
  });
  // 数字字号压到 11：柱间距 22+6=28 px，13.5 px 的四字标签会互相压住
  s += bars(px, y, pw, bh, groups, { bw: wide(M) ? 22 : 12, max: 3.0, vsize: 11 });
  y += bh + 46;
  s += legend(px, y, order.map(([nm, c]) => ({ c, name: D.inst[nm].zh })),
    { gap: wide(M) ? 110 : 90, size: tiny(M) });
  y += 24;
  s += MT(px, y, wide(M)
    ? [`小提琴在 2 倍频率上是基频的 ${V.harm[1]} 倍，萨克斯 ${X.harm[1]}，钢琴只有 ${PNO.harm[1]}。`,
      '钢琴的能量集中在基频本身，另外两件把大量能量放在整数倍上——',
      '这就是「同一个音、同样的响度，听起来完全不同」的来源。']
    : [`小提琴 2 倍频率是基频的 ${V.harm[1]} 倍，`,
      `萨克斯 ${X.harm[1]}，钢琴只有 ${PNO.harm[1]}。`,
      '钢琴能量集中在基频，另两件放在整数倍上。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (wide(M) ? 3 : 3) * 21 + 14;

  // —— 第三件事：调制 ——
  s += T(px, y + 14, '③ 调制：包络自己也在有规律地抖', { size: M.h2, weight: 700, fill: GOLD });
  y += 44;
  const th = 76;
  const tp = panel(px, y, pw, th, { fill: PLATE });
  s += tp.s;
  s += curve(tp, D.tremolo.env, { c: GOLD, w: 1.6 });
  s += T(px, y - 5, `tremolo.wav　全长 ${D.tremolo.dur} 秒`, {
    size: tiny(M), weight: 700, fill: GOLD,
  });
  s += T(px + pw, y - 5,
    `每 ${D.tremolo.period} 秒一次（${D.tremolo.rate} Hz），起伏 ${(D.tremolo.depth * 100).toFixed(0)}%`,
    { size: tiny(M), weight: 700, fill: MUTED, anchor: 'end' });
  y += th + 24;
  s += MT(px, y, wide(M)
    ? ['强弱周期性地抖叫颤音，高低周期性地抖叫揉弦。两者都不改变音高和平均响度，只改变听感。']
    : ['强弱周期性地抖叫颤音，高低抖叫揉弦。',
      '两者都不改变音高和平均响度，只改变听感。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (wide(M) ? 1 : 2) * 21 + 14;

  return doc(M.W, y, s, '小提琴与萨克斯在包络、泛音分布和调制上的对比');
};

// ----------------------------------------------------------------
const modes = process.argv.includes('--all') ? ['desktop', 'mobile'] : ['desktop'];
let n = 0;
for (const mode of modes) mkdirSync(join(BASE, mode), { recursive: true });
for (const [name, make] of Object.entries(FIG)) {
  for (const mode of modes) {
    writeFileSync(join(BASE, mode, `${name}.svg`), make(MODES[mode]), 'utf8');
    n += 1;
  }
}
console.log(`写好 ${n} 个文件（${modes.join('、')}）`);
