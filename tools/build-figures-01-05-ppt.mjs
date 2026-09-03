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
const d03 = D('03');
const FIG = {};

// ================================================================ 01

// PPT p2/p3：同样叫「分类」，照片和录音的入口完全不同。
// 原来这张图只有 desktop 一版、没有生成脚本，而且末端写的是「摇滚」，
// 和正文（照 PPT 写的「汽车驶过的声音」）对不上。这里重做，两版都出。
FIG['01-course-problem'] = (M) => {
  const head = ['同样是让程序判断，', '照片和录音的入口不一样'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 14;

  // 一格：小图 + 标题 + 副标题
  const cell = (x, cy, cw, ch, color, fill, title, sub, draw) => {
    let o = R(x, cy, cw, ch, { fill, stroke: color, sw: 1.5, r: 8 });
    o += T(x + 12, cy + 22, title, { size: M.small, weight: 700, fill: color });
    if (sub) o += T(x + 12, cy + 40, sub, { size: tiny(M), fill: MUTED });
    if (draw) o += draw(x, cy, cw, ch);
    return o;
  };

  const rowH = w ? 120 : 108;
  const gap = w ? 18 : 12;

  // ---------- 照片这一行：三格 ----------
  s += T(px, y + 14, '照片', { size: M.h2, weight: 700, fill: BLUE });
  let ry = y + 26;
  const photoCells = w ? 3 : 3;
  const pcw = (pw - gap * (photoCells - 1)) / photoCells;
  // 1 颜色网格
  s += cell(px, ry, pcw, rowH, BLUE, '#eef4f8', '固定的颜色网格', '每个位置一个颜色数值',
    (x, cy, cw2, ch2) => {
      let o = '';
      const g = 4;
      const cellPx = Math.min(11, (cw2 - 24) / g);
      const gx = x + cw2 / 2 - (cellPx * g) / 2;
      const gy = cy + ch2 - 12 - cellPx * g;
      for (let i = 0; i < g; i += 1) {
        for (let j = 0; j < g; j += 1) {
          const t = (i * g + j) % 5;
          o += R(gx + j * cellPx, gy + i * cellPx, cellPx - 1.5, cellPx - 1.5,
            { fill: ['#bcd8ec', '#8bbdd9', '#5fa3c9', '#2f86b8', '#0878b9'][t], stroke: 'none', r: 1.5 });
        }
      }
      return o;
    });
  s += ARROW(px + pcw + 3, ry + rowH / 2, px + pcw + gap - 3, ry + rowH / 2, { c: MUTED });
  // 2 判断程序
  s += cell(px + pcw + gap, ry, pcw, rowH, BLUE, '#fff', '判断程序', '从示例里学会区别',
    (x, cy, cw2, ch2) => {
      let o = '';
      [0, 1, 2].forEach((i) => {
        o += R(x + cw2 / 2 - 26, cy + ch2 - 46 + i * 12, 52, 8,
          { fill: i === 0 ? BLUE : '#d6e6f1', stroke: 'none', r: 4 });
      });
      return o;
    });
  s += ARROW(px + 2 * (pcw + gap) - gap + 3, ry + rowH / 2,
    px + 2 * (pcw + gap) - 3, ry + rowH / 2, { c: MUTED });
  // 3 答案
  s += cell(px + 2 * (pcw + gap), ry, pcw, rowH, GREEN, '#eef7f2', '答案', '',
    (x, cy, cw2, ch2) => T(x + cw2 / 2, cy + ch2 / 2 + 12, '猫',
      { size: w ? 30 : 26, weight: 700, fill: GREEN, anchor: 'middle' }));
  y = ry + rowH + (w ? 26 : 22);

  // ---------- 录音这一行：四格，多出「整理声音证据」 ----------
  s += T(px, y + 14, '录音', { size: M.h2, weight: 700, fill: WARM });
  ry = y + 26;
  const n2 = 4;
  const acw = (pw - gap * (n2 - 1)) / n2;
  // 1 一长串数
  s += cell(px, ry, acw, rowH, WARM, '#fbf0ec', '一长串数', '按时间先后排列',
    (x, cy, cw2, ch2) => {
      const pn = panel(x + 10, cy + ch2 - 50, cw2 - 20, 38, { yr: [-1.1, 1.1], zero: true });
      const vals = [];
      for (let i = 0; i < 120; i += 1) {
        const u = i / 119;
        vals.push(Math.sin(u * 21) * (0.35 + 0.5 * Math.sin(u * 3.1)));
      }
      return pn.s + curve(pn, vals, { c: WARM, w: 1.3 });
    });
  s += ARROW(px + acw + 3, ry + rowH / 2, px + acw + gap - 3, ry + rowH / 2, { c: MUTED });
  // 2 整理声音证据 —— 这一格就是这 23 课
  s += cell(px + acw + gap, ry, acw, rowH, WARM, '#fdf6f2', '整理声音证据',
    '统一读法、切段、计算',
    (x, cy, cw2, ch2) => T(x + cw2 / 2, cy + ch2 - 16, '← 这 23 课',
      { size: tiny(M), weight: 700, fill: WARM, anchor: 'middle' }));
  s += ARROW(px + 2 * (acw + gap) - gap + 3, ry + rowH / 2,
    px + 2 * (acw + gap) - 3, ry + rowH / 2, { c: MUTED });
  // 3 判断程序
  s += cell(px + 2 * (acw + gap), ry, acw, rowH, BLUE, '#fff', '判断程序', '比较整理后的数字',
    (x, cy, cw2, ch2) => {
      let o = '';
      [0, 1, 2].forEach((i) => {
        o += R(x + cw2 / 2 - 24, cy + ch2 - 44 + i * 12, 48, 8,
          { fill: i === 0 ? BLUE : '#d6e6f1', stroke: 'none', r: 4 });
      });
      return o;
    });
  s += ARROW(px + 3 * (acw + gap) - gap + 3, ry + rowH / 2,
    px + 3 * (acw + gap) - 3, ry + rowH / 2, { c: MUTED });
  // 4 答案
  s += cell(px + 3 * (acw + gap), ry, acw, rowH, GREEN, '#eef7f2', '答案', '',
    (x, cy, cw2, ch2) => T(x + cw2 / 2, cy + ch2 / 2 + 12, '汽车',
      { size: w ? 26 : 22, weight: 700, fill: GREEN, anchor: 'middle' }));
  y = ry + rowH + 22;

  s += MT(px, y, w
    ? ['两行的差别只有一格：录音多出「整理声音证据」这一步，而这一步就是这 23 课的全部内容。',
      '照片一进来就是排好的网格，两张照片缩到同样宽高就能一个位置对一个位置地比；',
      '录音一进来是一长串数，长度、每秒记录次数、录音音量都可能不同，不先整理就没法比。']
    : ['两行只差一格：录音多出「整理声音证据」，',
      '这一步就是这 23 课的全部内容。照片一进来',
      '就是排好的网格，缩到同样宽高就能逐格比；',
      '录音是一长串数，长度、每秒记录次数、音量',
      '都可能不同，不先整理就没法比。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 5) * 21 + 8;
  return doc(M.W, y, s, '照片与录音进入分类程序之前的不同入口');
};

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
  s += MT(px, y, w
    ? ['这不是三条曲线，是同一条曲线的三种读法：看重复得多快、看抖得多大、看重复的图案长什么样。']
    : ['这不是三条曲线，是同一条曲线的三种读法：',
      '看重复得多快、看抖得多大、看图案长什么样。'],
  { size: M.small, weight: 700, fill: INK, leading: 21 });
  return doc(M.W, y + (w ? 18 : 39), s, '一条波形同时携带频率、强弱与音色三种信息');
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

  s += MT(px, y + 4, w
    ? ['两条都按各自的峰值缩放过——这张图比的是形状重不重复，不是谁更响。']
    : ['两条都按各自的峰值缩放过——这张图比的是',
      '形状重不重复，不是谁更响。'],
  { size: M.small, weight: 700, fill: INK, leading: 21 });
  return doc(M.W, y + (w ? 22 : 43), s, '真实录音中周期性声音与非周期性声音的波形对比');
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

// ================================================================ 03

// PPT p3/p4：声功率描述声源，声强描述某一个位置。
FIG['03-power-vs-intensity'] = (M) => {
  const head = ['声功率只有一个数，', '声强每个位置一个数'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 16;

  const ph = w ? 176 : 168;
  s += R(px, y, pw, ph, { fill: '#fff', stroke: GRID, r: 8 });
  const cx = px + (w ? 96 : 66);
  const cy = y + ph / 2;
  s += O(cx, cy, 9, { fill: WARM });
  s += T(cx, cy - 20, '声源', { size: tiny(M), weight: 700, fill: WARM, anchor: 'middle' });
  s += T(cx, y + ph - 12, '声功率 1 个数', { size: tiny(M), weight: 700, fill: WARM, anchor: 'middle' });

  const maxR = (px + pw - 26) - cx;
  [0.38, 0.66, 0.95].forEach((k, i) => {
    const r = maxR * k;
    s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1)
      + '" fill="none" stroke="' + GRID + '" stroke-width="1.2"'
      + (i === 2 ? ' stroke-dasharray="4 4"' : '') + '/>';
    const mx = cx + r;
    s += O(mx, cy, 4.5, { fill: BLUE });
    s += T(mx, cy - 12, '位置 ' + (i + 1), { size: tiny(M), fill: BLUE, anchor: 'middle' });
    // 同一份能量摊在越来越大的球面上，每平方米分到的越来越少
    const share = (0.38 * 0.38) / (k * k);
    s += T(mx, cy + 22, (share * 100).toFixed(0) + '%',
      { size: tiny(M), weight: 700, fill: BLUE, anchor: 'middle' });
  });
  y += ph + 20;

  s += MT(px, y, w
    ? ['三个蓝点是三个不同的位置，百分比是它们每平方米分到的能量（以位置 1 为 100%）。',
      '声源没变，声功率那一个数也没变；变的是「传到这儿还剩多少」——这才是麦克风量到的东西。']
    : ['蓝点是三个位置，百分比是每平方米分到',
      '的能量（位置 1 记作 100%）。声源没变，',
      '声功率没变；变的是传到这儿还剩多少——',
      '这才是麦克风量到的东西。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 8;
  return doc(M.W, y, s, '声功率描述声源，声强描述某一个位置');
};

// PPT p9/p11/p12–p17：听阈到痛阈的阶梯，以及分贝把它压成多少。
FIG['03-intensity-ladder'] = (M) => {
  const ladder = d03.ladder;
  const decades = Math.log10(d03.ratio).toFixed(0);
  const head = ['声强从听阈到痛阈差 ' + decades + ' 个数量级，', '写成分贝只有 0 到 130'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const rowH = w ? 34 : 40;
  const colName = w ? pw * 0.32 : pw * 0.40;
  ladder.forEach((it, i) => {
    const by = y + i * rowH;
    const hot = i === ladder.length - 1;
    const cold = i === 0;
    s += R(px, by, pw, rowH - 5, {
      fill: hot ? '#fbf0ec' : (cold ? '#eef4f8' : PLATE),
      stroke: hot ? WARM : (cold ? BLUE : GRID), sw: (hot || cold) ? 1.5 : 1, r: 6,
    });
    s += T(px + 12, by + rowH / 2 + 1, it.name,
      { size: tiny(M), weight: 700, fill: hot ? WARM : (cold ? BLUE : INK) });
    // 声强用 10 的幂写，写成小数根本读不了
    const e = Math.round(Math.log10(it.wm2));
    s += T(px + colName + 10, by + rowH / 2 + 1, '10^' + e + ' W/m²',
      { size: tiny(M), fill: MUTED });
    s += T(px + pw - 12, by + rowH / 2 + 1, it.db + ' dB',
      { size: 15.5, weight: 700, fill: hot ? WARM : (cold ? BLUE : INK), anchor: 'end' });
  });
  y += ladder.length * rowH + 12;

  s += MT(px, y, w
    ? ['左边每往下一格是十倍，一路乘了 ' + decades + ' 次；右边只从 0 走到 130。',
      '两条性质记住：声强每变十倍正好多 10 dB；每翻一倍多约 3 dB（因为 10·log₁₀2 = 3.01）。',
      '听阈本身是 0 dB——0 dB 不是没有声音，是正好等于参考值。']
    : ['左边每往下一格是十倍，乘了 ' + decades + ' 次；',
      '右边只从 0 走到 130。声强变十倍多 10 dB，',
      '翻一倍多约 3 dB（10·log₁₀2 = 3.01）。',
      '听阈是 0 dB——不是没声音，是等于参考值。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '从听阈到痛阈的声强阶梯与对应的分贝值');
};

// PPT p19：等响曲线。数据由 A 计权闭式公式算出，不是手画的。
FIG['03-equal-loudness'] = (M) => {
  const eq = d03.equal_loudness;
  const head = ['要听起来一样响，', '低频得比 1 kHz 多给几十分贝'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 22;

  const ph = w ? 190 : 170;
  const lo = 20;
  const hi = 16000;
  const lg = (v) => Math.log10(v);
  const X = (f) => px + ((lg(f) - lg(lo)) / (lg(hi) - lg(lo))) * pw;
  const vmax = Math.max.apply(null, eq.need_db);
  const vmin = Math.min.apply(null, eq.need_db);
  const Y = (v) => y + ph - ((v - vmin) / (vmax - vmin)) * ph;

  s += R(px, y, pw, ph, { fill: '#fff', stroke: GRID, r: 6 });
  s += L(px, Y(0), px + pw, Y(0), { c: GRID, dash: '4 4' });
  s += T(px + 6, Y(0) - 6, '1 kHz 记作 0', { size: tiny(M), fill: MUTED });

  s += P(eq.freqs.map((f, i) => [X(f), Y(eq.need_db[i])]), { c: BLUE, w: 2.2 });

  [20, 100, 1000, 10000].forEach((f) => {
    s += L(X(f), y + ph, X(f), y + ph + 5, { c: GRID });
    s += T(X(f), y + ph + 19, f >= 1000 ? (f / 1000) + 'k' : String(f),
      { size: tiny(M), fill: MUTED, anchor: 'middle' });
  });

  const ms = eq.most_sensitive_hz;
  s += L(X(ms), y + 6, X(ms), y + ph, { c: WARM, dash: '3 3' });
  s += T(X(ms) + 6, y + 18, '最敏感 ' + ms + ' Hz', { size: tiny(M), weight: 700, fill: WARM });

  const i62 = eq.freqs.findIndex((f) => f >= 62);
  s += O(X(eq.freqs[i62]), Y(eq.need_db[i62]), 4.5, { fill: WARM });
  s += T(X(eq.freqs[i62]) + 8, Y(eq.need_db[i62]) + 4,
    eq.freqs[i62].toFixed(0) + ' Hz 要多给 ' + eq.need_db[i62].toFixed(1) + ' dB',
    { size: tiny(M), weight: 700, fill: WARM });
  y += ph + 30;

  s += MT(px, y, w
    ? ['纵轴读法：曲线越高，说明这个频率越不敏感，要听起来和 1 kHz 一样响就得多给越多分贝。',
      '曲线不是平的——这就是「同样的声强，不同频率听起来不一样响」的全部意思。',
      '（这条线由 A 计权公式取负算出；A 计权本身就是从 40 方等响曲线反推的，形状一致。）']
    : ['曲线越高＝这个频率越不敏感，要一样响就',
      '得多给越多分贝。线不是平的，这就是',
      '「同样声强、不同频率不一样响」的意思。',
      '（由 A 计权公式取负算出，形状同等响曲线。）'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '不同频率要听起来一样响所需的额外分贝');
};

// PPT p27/p28：ADSR 四阶段，以及三件真实乐器的包络。
FIG['03-adsr'] = (M) => {
  const head = ['一个音怎么起、怎么落，', '三件乐器完全不同'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ah = w ? 96 : 84;
  const pn = panel(px, y, pw, ah, { yr: [0, 1.12], title: 'ADSR 四个阶段', tsize: M.small, tfill: MUTED });
  s += pn.s;
  const segs = [[0, 0], [0.14, 1], [0.3, 0.66], [0.72, 0.6], [1, 0]];
  s += P(segs.map((q) => [px + q[0] * pw, pn.sy(q[1])]), { c: BLUE, w: 2.2 });
  [['起音', 0.07], ['衰减', 0.22], ['保持', 0.51], ['释放', 0.86]].forEach((q) => {
    s += T(px + q[1] * pw, y + ah - 8, q[0], { size: tiny(M), fill: MUTED, anchor: 'middle' });
  });
  y += ah + 26;

  const order = ['sax', 'piano_c', 'violin_c'];
  const cols = { sax: GOLD, piano_c: GREEN, violin_c: BLUE };
  const eh = w ? 74 : 64;
  order.forEach((k) => {
    const it = d03.instruments[k];
    const p2 = panel(px, y, pw, eh, {
      yr: [0, 1.1],
      title: it.zh + '　峰值出现在 ' + (it.peak_at * 100).toFixed(0) + '%',
      tsize: M.small, tfill: cols[k],
    });
    s += p2.s + curve(p2, it.env, { c: cols[k], w: 1.8 });
    s += L(px + it.peak_at * pw, y, px + it.peak_at * pw, y + eh, { c: cols[k], dash: '3 3' });
    y += eh + 26;
  });

  s += MT(px, y - 4, w
    ? ['横轴按各自总时长归一化，纵轴按各自峰值归一化——这张图比的是形状，不是谁更响、谁更长。',
      '萨克斯一吹就到顶然后保持，钢琴一敲就到顶然后一路衰减，小提琴要到一半才最响。']
    : ['横轴按各自时长、纵轴按各自峰值归一化，',
      '比的是形状。萨克斯一吹到顶再保持，钢琴',
      '一敲到顶再衰减，小提琴到一半才最响。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 6;
  return doc(M.W, y, s, 'ADSR 四阶段模型与三件真实乐器的包络对比');
};

// PPT p32–p38：泛音结构。画成**谱线**——在真实的频率轴上，每个整数倍
// 位置立一根细线。不用柱状图：柱子会让人以为每根占了一段频率宽度，
// 而泛音是频率轴上一个个孤立的位置。
FIG['03-harmonics'] = (M) => {
  const head = ['同一个音，', '三件乐器的泛音强度完全不同'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 22;

  const order = ['violin_c', 'sax', 'piano_c'];
  const cols = { violin_c: BLUE, sax: GOLD, piano_c: GREEN };
  let maxV = 0;
  order.forEach((k) => {
    d03.instruments[k].harmonics.forEach((v) => { if (v > maxV) maxV = v; });
  });
  // 横轴用真实频率，右端留到最高那根泛音之外一点
  const fmax = Math.max.apply(null, order.map(
    (k) => d03.instruments[k].f0 * (d03.instruments[k].harmonics.length + 0.45)));
  const ph = w ? 96 : 84;

  order.forEach((k) => {
    const it = d03.instruments[k];
    const pn = panel(px, y, pw, ph, {
      yr: [0, maxV * 1.16],
      title: it.zh + '　基频 ' + it.f0 + ' Hz',
      tsize: M.small, tfill: cols[k],
    });
    s += pn.s;
    const X = (hz) => px + (hz / fmax) * pw;
    it.harmonics.forEach((v, j) => {
      const hz = it.f0 * (j + 1);
      const xx = X(hz);
      // 谱线：一根细竖线加一个端点，端点标出相对强度
      s += L(xx, pn.sy(0), xx, pn.sy(v), { c: cols[k], w: 2 });
      s += O(xx, pn.sy(v), 3, { fill: cols[k] });
      s += T(xx, pn.sy(v) - 7, v.toFixed(2),
        { size: tiny(M), fill: cols[k], anchor: 'middle' });
    });
    y += ph + 26;
  });

  // 共用一条频率轴
  s += L(px, y - 14, px + pw, y - 14, { c: GRID });
  [1000, 2000, 3000, 4000].forEach((hz) => {
    if (hz > fmax) return;
    const xx = px + (hz / fmax) * pw;
    s += L(xx, y - 14, xx, y - 9, { c: GRID });
    s += T(xx, y + 3, (hz / 1000) + ' kHz', { size: tiny(M), fill: MUTED, anchor: 'middle' });
  });
  s += T(px, y + 3, '横轴：真实频率', { size: tiny(M), fill: MUTED });
  y += 20;

  s += MT(px, y, w
    ? ['每一根竖线是一个泛音，立在它真实的频率位置上；线的高度是相对基频的强度。',
      '小提琴的第 2 根比基频还强 2.73 倍，萨克斯 1.80 倍，钢琴只有 0.43 倍——钢琴的能量集中在基频。',
      '三条谱线的形状差这么远，就是同一个 C4 听起来是三件乐器的原因之一。']
    : ['每根竖线是一个泛音，立在它真实的频率上，',
      '高度是相对基频的强度。小提琴第 2 根强',
      '2.73 倍，萨克斯 1.80 倍，钢琴只有 0.43 倍',
      '——钢琴的能量集中在基频，所以听着不同。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '三件乐器泛音在频率轴上的谱线对比');
};

// PPT p41/p42：调幅（颤音）。用课程自带 tremolo.wav 的真实包络。
FIG['03-tremolo'] = (M) => {
  const tr = d03.tremolo;
  const head = ['颤音：强弱每 ' + tr.period_s + ' 秒', '规律地起伏一轮'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ph = w ? 150 : 130;
  const pn = panel(px, y, pw, ph, {
    yr: [0, 1.1], title: 'tremolo.wav 的振幅包络（全长 ' + tr.seconds + ' 秒）',
    tsize: M.small, tfill: MUTED,
  });
  s += pn.s + curve(pn, tr.env, { c: WARM, w: 1.8 });
  const rounds = Math.floor(tr.seconds / tr.period_s);
  for (let i = 1; i <= rounds; i += 1) {
    const xx = px + (i * tr.period_s / tr.seconds) * pw;
    if (xx < px + pw - 4) s += L(xx, y, xx, y + ph, { c: GRID, dash: '3 4' });
  }
  y += ph + 24;

  const cards = [
    ['起伏一轮要多久', tr.period_s + ' 秒', '也就是每秒 ' + tr.rate_hz + ' 轮'],
    ['起伏有多深', (tr.depth * 100).toFixed(0) + '%', '最低处几乎掉到零'],
  ];
  const cw = w ? (pw - 16) / 2 : pw;
  cards.forEach((c, i) => {
    const bx = w ? px + i * (cw + 16) : px;
    const by = w ? y : y + i * 62;
    s += R(bx, by, cw, 54, { fill: PLATE, stroke: WARM, sw: 1.4, r: 8 });
    s += T(bx + 12, by + 21, c[0], { size: tiny(M), fill: MUTED });
    s += T(bx + 12, by + 43, c[1], { size: 17, weight: 700, fill: WARM });
    s += T(bx + cw - 12, by + 43, c[2], { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  y += (w ? 54 : 62 * 2 - 8) + 24;

  s += MT(px, y - 6, w
    ? ['竖虚线是每一轮的分界。这种「有规律地抖」不改变平均音高，也不改变平均响度，只改变音色。',
      '注意它只在逐帧序列上看得见：整段求一个平均值，这条起伏就完全没了。']
    : ['竖虚线是每一轮的分界。这种有规律的抖不',
      '改变平均音高和平均响度，只改变音色。',
      '整段求一个平均值，这条起伏就完全没了。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, 'tremolo.wav 的振幅包络与起伏周期');
};

// ================================================================ 04

// PPT p5–p7：模拟信号处处连续，数字信号只在有限个时刻取有限个档位。
FIG['04-analog-vs-digital'] = (M) => {
  const head = ['模拟信号有两个「无穷」，', '数字信号两个都砍掉了'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const f = (u) => Math.sin(u * 7.5) * (0.5 + 0.42 * Math.sin(u * 2.1));
  const cw = w ? (pw - 22) / 2 : pw;
  const ph = w ? 128 : 112;
  const LEVELS = 8;

  const drawOne = (bx, by, digital) => {
    let o = '';
    const pn = panel(bx, by, cw, ph, {
      yr: [-1.15, 1.15],
      title: digital ? '数字信号' : '模拟信号',
      tfill: digital ? GREEN : WARM, tsize: M.h2, zero: true,
    });
    o += pn.s;
    if (digital) {
      // 档位横线：取值只能落在这些线上
      for (let i = 0; i <= LEVELS; i += 1) {
        const v = -1 + (2 * i) / LEVELS;
        o += L(bx + 2, pn.sy(v), bx + cw - 2, pn.sy(v), { c: '#e6ecf1', w: 1 });
      }
      const N = 26;
      for (let i = 0; i < N; i += 1) {
        const u = i / (N - 1);
        const raw = f(u);
        // 靠到最近的档位上
        const q = Math.round(((raw + 1) / 2) * LEVELS) / LEVELS * 2 - 1;
        const xx = bx + 4 + u * (cw - 8);
        o += L(xx, pn.sy(0), xx, pn.sy(q), { c: GREEN, w: 1.4 });
        o += O(xx, pn.sy(q), 2.8, { fill: GREEN });
      }
    } else {
      const vals = [];
      for (let i = 0; i < 260; i += 1) vals.push(f(i / 259));
      o += curve(pn, vals, { c: WARM, w: 1.8 });
    }
    return o;
  };

  s += drawOne(px, y, false);
  s += drawOne(w ? px + cw + 22 : px, w ? y : y + ph + 60, true);

  const noteY = w ? y + ph + 20 : y + ph * 2 + 80;
  const notes = [
    ['模拟信号', WARM, ['时间上连续：任意两个时刻之间还有无穷多个时刻',
      '取值上连续：0.31 和 0.32 之间还有无穷多个数']],
    ['数字信号', GREEN, ['时间上离散：只在一格一格的时刻上有值',
      '取值上离散：每个值都被推到最近的横格线上']],
  ];
  let ny = noteY;
  notes.forEach((n2) => {
    s += T(px, ny, n2[0], { size: M.small, weight: 700, fill: n2[1] });
    s += MT(px + (w ? 70 : 68), ny, n2[2], { size: tiny(M), fill: MUTED, leading: 19 });
    ny += 46;
  });

  s += T(px, ny + 4, '砍掉第一个无穷叫「采样」，砍掉第二个叫「量化」——ADC 只做这两件事。',
    { size: M.small, weight: 700, fill: INK });
  return doc(M.W, ny + 22, s, '模拟信号处处连续，数字信号只在有限个时刻取有限个档位');
};

// PPT p39–p45：录音走 ADC，放音走 DAC，两条链互为逆过程但信息不对称。
FIG['04-record-playback'] = (M) => {
  const head = ['录音这条链走 ADC，', '放音那条链走 DAC'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 16;

  const rows = [
    {
      tag: '录音', color: WARM, fill: '#fbf0ec',
      steps: ['空气振动', '麦克风', '抗混叠滤波', 'ADC 采样＋量化'],
      end: '一串数字',
      note: '滤波那一步砍掉了超过一半采样率的成分',
    },
    {
      tag: '放音', color: GREEN, fill: '#eef7f2',
      steps: ['一串数字', 'DAC 还原电压', '平滑滤波', '功放推音箱'],
      end: '空气振动',
      note: '砍掉的东西补不回来，听到的是拼起来的版本',
    },
  ];

  rows.forEach((r) => {
    const items = r.steps.concat([r.end]);
    const rowH = w ? 108 : 40 + items.length * 36;
    s += R(px, y, pw, rowH, { fill: r.fill, stroke: r.color, sw: 1.6, r: 10 });
    s += T(px + 16, y + 25, r.tag, { size: M.h2, weight: 700, fill: r.color });
    if (w) {
      const bw = (pw - 32 - (items.length - 1) * 20) / items.length;
      items.forEach((label, i) => {
        const bx = px + 16 + i * (bw + 20);
        const last = i === items.length - 1;
        s += R(bx, y + 38, bw, 32, {
          fill: '#fff', stroke: last ? r.color : GRID, sw: last ? 2 : 1, r: 6,
        });
        s += T(bx + bw / 2, y + 58, label, {
          size: tiny(M), weight: last ? 700 : 400, fill: last ? r.color : INK, anchor: 'middle',
        });
        if (!last) s += ARROW(bx + bw + 3, y + 54, bx + bw + 16, y + 54, { c: r.color });
      });
      s += T(px + 16, y + 92, r.note, { size: tiny(M), fill: MUTED });
    } else {
      items.forEach((label, i) => {
        const by = y + 36 + i * 36;
        const last = i === items.length - 1;
        s += R(px + 16, by, pw - 32, 26, {
          fill: '#fff', stroke: last ? r.color : GRID, sw: last ? 2 : 1, r: 6,
        });
        s += T(px + 26, by + 18, label, {
          size: tiny(M), weight: last ? 700 : 400, fill: last ? r.color : INK,
        });
        if (!last) s += ARROW(px + 30, by + 27, px + 30, by + 34, { c: r.color, head: 5 });
      });
    }
    y += rowH + 16;
  });

  if (!w) {
    s += MT(px, y + 2, rows.map((r) => r.tag + '：' + r.note),
      { size: tiny(M), fill: MUTED, leading: 20 });
    y += 44;
  }

  s += MT(px, y + 6, w
    ? ['两条链读起来对称，信息上并不对称：录音那一侧砍掉的两样东西——超过一半采样率的成分、',
      '档位之间的那点差值——放音时都补不回来。所以你听到的永远是「砍完再拼起来」的版本。']
    : ['两条链读着对称，信息上不对称：录音砍掉的',
      '两样东西——超过一半采样率的成分、档位之间',
      '那点差值——放音都补不回来。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 10;
  return doc(M.W, y, s, '录音经过麦克风与 ADC，放音经过 DAC 与音箱');
};

// ================================================================ 05

// PPT p5：五个分类维度。不是五选一，是五条各自独立的问题。
FIG['05-five-dimensions'] = (M) => {
  const head = ['一个音频特征，', '在这五条上各占一个位置'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const dims = [
    { n: '抽象层级', q: '离原始测量有多远', v: ['低层', '中层', '高层'], c: BLUE },
    { n: '时间范围', q: '一次概括多长', v: ['瞬时 ~50ms', '片段级 几秒', '全局'], c: GREEN },
    { n: '音乐属性', q: '描述音乐哪个方面', v: ['节拍', '音色', '音高', '和声'], c: GOLD },
    { n: '信号域', q: '从哪个角度观察', v: ['时域', '频域', '时频'], c: WARM },
    { n: '算法来源', q: '人算还是程序学', v: ['按公式算', '从数据里学'], c: MUTED },
  ];

  const rowH = w ? 52 : 66;
  dims.forEach((d, i) => {
    const by = y + i * (rowH + 8);
    s += R(px, by, pw, rowH, { fill: PLATE, stroke: d.c, sw: 1.5, r: 8 });
    s += T(px + 14, by + (w ? 22 : 21), d.n, { size: M.h2, weight: 700, fill: d.c });
    s += T(px + 14, by + (w ? 40 : 40), d.q, { size: tiny(M), fill: MUTED });
    // 取值摆在右半边
    const startX = w ? px + pw * 0.42 : px + 14;
    const vy = w ? by + rowH / 2 + 5 : by + 58;
    let vx = startX;
    d.v.forEach((v) => {
      const bw = v.length * (w ? 13.5 : 14) + 18;
      s += R(vx, vy - 14, bw, 22, { fill: '#fff', stroke: d.c, sw: 1, r: 11 });
      s += T(vx + bw / 2, vy + 1, v, { size: tiny(M), fill: d.c, anchor: 'middle' });
      vx += bw + 8;
    });
  });
  y += dims.length * (rowH + 8) + 10;

  s += MT(px, y, w
    ? ['五条互相独立：换一条不影响另外四条。看到一个陌生的特征名字，就在这五条上各定一次位。',
      '反过来，面对一个新任务，也按这五个问题依次问一遍，答案就是该算什么。']
    : ['五条互相独立，换一条不影响另外四条。',
      '看到陌生的特征名字，在这五条上各定一次位；',
      '面对新任务，按这五个问题依次问一遍。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '音频特征的五个分类维度');
};

// PPT p8：音乐属性的四个方面。
FIG['05-music-aspect'] = (M) => {
  const head = ['同一段音乐，', '可以从四个方面分别描述'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const items = [
    { n: '节拍', c: BLUE, q: '什么时候有一下，快慢如何',
      draw: (bx, by, bw2, bh2) => {
        let o = '';
        const cy = by + bh2 / 2;
        o += L(bx + 8, cy, bx + bw2 - 8, cy, { c: GRID });
        [0.08, 0.3, 0.52, 0.74, 0.94].forEach((u) => {
          const xx = bx + 8 + u * (bw2 - 16);
          o += L(xx, cy + 12, xx, cy - 14, { c: BLUE, w: 2.4 });
          o += O(xx, cy - 14, 3, { fill: BLUE });
        });
        return o;
      } },
    { n: '音色', c: WARM, q: '听起来像什么乐器',
      draw: (bx, by, bw2, bh2) => {
        let o = '';
        const base = by + bh2 - 10;
        [1, 0.55, 0.78, 0.3, 0.42, 0.18].forEach((v, j) => {
          const xx = bx + 14 + j * ((bw2 - 28) / 6);
          o += L(xx, base, xx, base - v * (bh2 - 26), { c: WARM, w: 2.2 });
          o += O(xx, base - v * (bh2 - 26), 2.6, { fill: WARM });
        });
        o += L(bx + 8, base, bx + bw2 - 8, base, { c: GRID });
        return o;
      } },
    { n: '音高', c: GREEN, q: '这个音有多高',
      draw: (bx, by, bw2, bh2) => {
        const pn = panel(bx + 8, by + 8, bw2 - 16, bh2 - 18, { yr: [0, 1] });
        const vals = [0.2, 0.2, 0.45, 0.45, 0.7, 0.7, 0.55, 0.55, 0.85, 0.85];
        return curve(pn, vals, { c: GREEN, w: 2.2 });
      } },
    { n: '和声', c: GOLD, q: '同时响的几个音什么关系',
      draw: (bx, by, bw2, bh2) => {
        let o = '';
        const cx = bx + bw2 / 2;
        [-1, 0, 1].forEach((k, j) => {
          const cy = by + bh2 / 2 + k * 15;
          o += L(cx - 30, cy, cx + 30, cy, { c: GOLD, w: 2.2 });
          o += O(cx - 30, cy, 3, { fill: GOLD });
        });
        return o;
      } },
  ];

  const cols = w ? 4 : 2;
  const bw = (pw - (cols - 1) * 12) / cols;
  const bh = w ? 132 : 122;
  items.forEach((it, i) => {
    const bx = px + (i % cols) * (bw + 12);
    const by = y + Math.floor(i / cols) * (bh + 12);
    s += R(bx, by, bw, bh, { fill: '#fff', stroke: it.c, sw: 1.5, r: 8 });
    s += T(bx + 12, by + 24, it.n, { size: M.h2, weight: 700, fill: it.c });
    s += T(bx + 12, by + 43, it.q, { size: tiny(M) - 0.5, fill: MUTED });
    s += it.draw(bx, by + 50, bw, bh - 58);
  });
  y += Math.ceil(items.length / cols) * (bh + 12) + 10;

  s += MT(px, y, w
    ? ['四个方面互相独立。同一段音乐换个乐器演奏，音色变了，节拍、音高、和声都没变。',
      '这一维决定往哪儿找特征：课程的三分类里，古典和摇滚差在节拍和音色上，不差在音高上。']
    : ['四个方面互相独立：换个乐器演奏，音色变了，',
      '节拍、音高、和声都没变。这一维决定往哪儿',
      '找特征——古典和摇滚差在节拍和音色上。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '音乐属性的四个方面：节拍、音色、音高、和声');
};

// PPT p31–p35：三类能听懂声音的系统，按「特征从哪儿来」排开。
FIG['05-three-systems'] = (M) => {
  const head = ['按「特征从哪儿来」，', '能听懂声音的系统分三类'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const sys = [
    { n: 'DSP / 规则系统', c: GREEN, mk: '人写死判断规则',
      rows: [['特征', '不需要'], ['数据', '不需要'], ['可解释', '完全']] },
    { n: '传统机器学习', c: BLUE, mk: '人做特征工程',
      rows: [['特征', '人手工算'], ['数据', '较少'], ['可解释', '高']] },
    { n: '深度学习', c: WARM, mk: '程序自动提特征',
      rows: [['特征', '程序自己学'], ['数据', '较多'], ['可解释', '低']] },
  ];

  const bw = w ? (pw - 24) / 3 : pw;
  const bh = w ? 156 : 128;
  sys.forEach((it, i) => {
    const bx = w ? px + i * (bw + 12) : px;
    const by = w ? y : y + i * (bh + 12);
    const here = i === 1;
    s += R(bx, by, bw, bh, {
      fill: here ? '#eef4f8' : PLATE, stroke: it.c, sw: here ? 2.2 : 1.5, r: 9,
    });
    s += T(bx + 12, by + 25, it.n, { size: M.h2, weight: 700, fill: it.c });
    s += T(bx + 12, by + 45, it.mk, { size: tiny(M), fill: MUTED });
    it.rows.forEach((r, j) => {
      const ry = by + 72 + j * 22;
      s += T(bx + 12, ry, r[0], { size: tiny(M), fill: MUTED });
      s += T(bx + bw - 12, ry, r[1], { size: tiny(M), weight: 700, fill: INK, anchor: 'end' });
    });
    if (here) {
      s += T(bx + bw / 2, by + bh - 12, '← 这门课在这里',
        { size: tiny(M), weight: 700, fill: BLUE, anchor: 'middle' });
    }
  });
  y += (w ? bh : (bh + 12) * 3 - 12) + 22;

  // 一条方向轴，说明从左到右在变什么
  s += L(px, y, px + pw, y, { c: GRID, w: 1.4 });
  s += ARROW(px, y, px + pw, y, { c: MUTED, w: 1.4 });
  s += T(px, y + 18, '人写的越来越少', { size: tiny(M), fill: MUTED });
  s += T(px + pw, y + 18, '要的数据越来越多，越难解释',
    { size: tiny(M), fill: MUTED, anchor: 'end' });
  y += 34;

  s += T(px, y + 4, '这门课手工算特征，把它整理成一张可信的表；表交给哪种算法，不在这 23 课范围内。',
    { size: M.small, weight: 700, fill: INK });
  return doc(M.W, y + 22, s, 'DSP 规则系统、传统机器学习与深度学习三类系统');
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
