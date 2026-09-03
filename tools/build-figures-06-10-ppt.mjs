#!/usr/bin/env node
// 第 06–10 课按 PPT 重写后新增的配图，电脑版和手机版各出一张。
//
//   python lessons/lessonNN_*.py --dump    先跑，产出 课程代码/data/lessonNN.json
//   node tools/build-figures-06-10-ppt.mjs
//
// 数字一律从 data/lessonNN.json 读，这里不重算。

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, ARROW, header, headerH,
  panel, curve, legend,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_06-10', 'figures');
const DATA = join(ROOT, 'NotebookLM课程博客_重写版', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));

// 手机版 420 缩到 360 是 0.857 倍，图内最小字号要 >= 14 才不触发 WARN
const tiny = (M) => (wide(M) ? 12.5 : 14);

const d06 = D('06');
const FIG = {};

// ================================================================ 06

// PPT p5/p18 与 p20/p61：两条流水线，分岔在第三步。
FIG['06-two-pipelines'] = (M) => {
  const head = ['两条流水线前两步一样，', '频域那条多出加窗和变换'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const rows = [
    { tag: '时域', c: GREEN, fill: '#eef7f2',
      steps: ['ADC', '分帧', '逐帧计算', '聚合'], extra: [] },
    { tag: '频域', c: BLUE, fill: '#eaf4fb',
      steps: ['ADC', '分帧', '加窗', '傅里叶变换', '逐帧计算', '聚合'],
      extra: [2, 3] },
  ];

  rows.forEach((r) => {
    const n = r.steps.length;
    const rowH = w ? 92 : 36 + n * 34;
    s += R(px, y, pw, rowH, { fill: r.fill, stroke: r.c, sw: 1.6, r: 10 });
    s += T(px + 14, y + 24, r.tag, { size: M.h2, weight: 700, fill: r.c });
    if (w) {
      const bw = (pw - 28 - (n - 1) * 14) / n;
      r.steps.forEach((label, i) => {
        const bx = px + 14 + i * (bw + 14);
        const isNew = r.extra.includes(i);
        s += R(bx, y + 36, bw, 32, {
          fill: '#fff', stroke: isNew ? WARM : GRID, sw: isNew ? 2 : 1, r: 6,
        });
        s += T(bx + bw / 2, y + 56, label, {
          size: tiny(M), weight: isNew ? 700 : 400,
          fill: isNew ? WARM : INK, anchor: 'middle',
        });
        if (isNew) {
          s += T(bx + bw / 2, y + 84, '多出来的', {
            size: tiny(M), weight: 700, fill: WARM, anchor: 'middle' });
        }
        if (i < n - 1) s += ARROW(bx + bw + 2, y + 52, bx + bw + 11, y + 52, { c: r.c });
      });
    } else {
      r.steps.forEach((label, i) => {
        const by = y + 32 + i * 34;
        const isNew = r.extra.includes(i);
        s += R(px + 14, by, pw - 28, 26, {
          fill: '#fff', stroke: isNew ? WARM : GRID, sw: isNew ? 2 : 1, r: 6,
        });
        s += T(px + 24, by + 18, label, {
          size: tiny(M), weight: isNew ? 700 : 400, fill: isNew ? WARM : INK });
        if (isNew) {
          s += T(px + pw - 24, by + 18, '多出来的',
            { size: tiny(M), weight: 700, fill: WARM, anchor: 'end' });
        }
        if (i < n - 1) s += ARROW(px + 28, by + 27, px + 28, by + 32, { c: r.c, head: 5 });
      });
    }
    y += rowH + 16;
  });

  s += MT(px, y + 4, w
    ? ['加窗是为了解决频谱泄漏；而加窗又把每帧两端消掉了，所以帧还必须重叠。',
      '每一步都是被上一步逼出来的，没有一步是可有可无的装饰。']
    : ['加窗是为了解决频谱泄漏；加窗又把每帧两端',
      '消掉了，所以帧还必须重叠。每一步都是被',
      '上一步逼出来的，没有一步是装饰。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '时域流水线与频域流水线，后者多出加窗和傅里叶变换');
};

// PPT p9/p11/p14：一个采样点远短于人耳的分辨率；常用帧长 256–8192。
FIG['06-frame-size'] = (M) => {
  const head = ['一个采样点太短了，', '短到人耳根本分不出'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 22;

  // 横轴按毫秒取对数：从 0.01 ms 到 400 ms 跨了四个数量级
  const lo = 0.01;
  const hi = 400;
  const lg = (v) => Math.log10(v);
  const X = (ms) => px + ((lg(ms) - lg(lo)) / (lg(hi) - lg(lo))) * pw;

  const one = d06.one_sample_ms_44k;
  const ear = d06.ear_resolution_ms;

  // 人耳分辨率那条线，左边是「分不出」
  s += R(px, y, X(ear) - px, 26, { fill: '#fbf0ec', stroke: WARM, sw: 1.2, r: 4 });
  s += T(px + 8, y + 18, '人耳分不出这么短', { size: tiny(M), fill: WARM });
  s += L(X(ear), y - 8, X(ear), y + 150, { c: WARM, w: 1.8, dash: '4 4' });
  s += T(X(ear) + 6, y - 12, `人耳约 ${ear} ms`, { size: tiny(M), weight: 700, fill: WARM });
  y += 34;

  // 一个采样点
  s += O(X(one), y + 8, 4, { fill: MUTED });
  s += T(X(one) + 10, y + 12, `1 个采样点 = ${one} ms`, { size: tiny(M), fill: MUTED });
  y += 28;

  // 常用帧长
  d06.sizes.forEach((it, i) => {
    const by = y + i * 22;
    const x0 = X(Math.max(it.ms44, lo * 1.05));
    const usual = it.n === 1024;
    s += O(x0, by + 6, usual ? 5 : 3.5, { fill: usual ? BLUE : '#9fc4dd' });
    s += T(x0 + 10, by + 10, `${it.n} 个样本 = ${it.ms44} ms`,
      { size: tiny(M), weight: usual ? 700 : 400, fill: usual ? BLUE : INK });
  });
  y += d06.sizes.length * 22 + 6;

  // 刻度
  [0.01, 0.1, 1, 10, 100].forEach((ms) => {
    s += L(X(ms), y, X(ms), y + 5, { c: GRID });
    s += T(X(ms), y + 19, `${ms} ms`, { size: tiny(M), fill: MUTED, anchor: 'middle' });
  });
  y += 32;

  s += MT(px, y, w
    ? [`横轴每格是十倍。一个采样点 ${one} ms，比人耳能分辨的 ${ear} ms 短了四百多倍——`,
      '所以一帧必须包含成百上千个采样点，才对应一段「听得出名堂」的声音。',
      '帧长取 2 的幂是因为快速傅里叶变换在这种长度下最快；常用范围 256 到 8192。']
    : [`横轴每格十倍。一个采样点 ${one} ms，比人耳的`,
      `${ear} ms 短四百多倍，所以一帧要成百上千个`,
      '采样点。取 2 的幂是因为快速傅里叶变换在',
      '这种长度下最快，常用 256 到 8192。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '一个采样点远短于人耳的时间分辨率，常用帧长落在 256 到 8192');
};

// PPT p25–p29：频谱泄漏。两条真实算出来的谱。
FIG['06-leakage'] = (M) => {
  const lk = d06.leakage;
  const keys = Object.keys(lk);
  const head = ['一帧里装不下整数个周期，', '接缝上的跳变会变成假的成分'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ph = w ? 106 : 92;
  keys.forEach((k, i) => {
    const it = lk[k];
    const c = i === 0 ? GREEN : WARM;
    const pn = panel(px, y, pw, ph, {
      yr: [0, 1.12],
      title: `${k}（${it.f} Hz）　接缝落差 ${it.gap.toFixed(4)}`,
      tsize: M.small, tfill: c,
    });
    s += pn.s;
    // 谱线：每一根频率格一条竖线
    const n = it.spec.length;
    it.spec.forEach((v, j) => {
      const xx = px + 4 + (j / (n - 1)) * (pw - 8);
      if (v > 0.004) s += L(xx, pn.sy(0), xx, pn.sy(v), { c, w: 1.4 });
    });
    s += T(px + pw - 8, y + 18, `峰外能量 ${(it.spill * 100).toFixed(2)}%`,
      { size: tiny(M), weight: 700, fill: c, anchor: 'end' });
    y += ph + 26;
  });

  s += MT(px, y - 4, w
    ? ['傅里叶变换是把这一帧当作无限重复来看的。装得下整数个周期时接缝天衣无缝，能量集中在一根线上；',
      '装不下时接缝处有 1.73 的落差，这个跳变被当成真实的尖锐变化，摊出一大片原信号没有的成分。',
      '真实录音里的频率不可能正好都装得下整数个周期，所以每一帧都会泄漏——除非加窗。']
    : ['傅里叶变换把这一帧当作无限重复来看。装得下',
      '整数个周期时接缝天衣无缝；装不下时接缝有',
      '1.73 的落差，被当成真实的尖锐变化，摊出',
      '一片原信号没有的成分。所以每一帧都会泄漏。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '装不下整数个周期时能量从一根谱线摊到旁边');
};

// PPT p33–p35：加窗前后的泄漏对比，外加 Hann 窗自己的形状。
FIG['06-window-effect'] = (M) => {
  const wd = d06.windowed;
  const head = ['加一条两端为零的窗，', '漏出去的能量少了八百倍'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  // 左：Hann 窗形状；右：加窗前后的谱
  const lw = w ? pw * 0.3 : pw;
  const rw = w ? pw - lw - 20 : pw;
  // 右边两块要各留一行标题的位置，所以整体高度按「两块 + 两个标题」算
  const specH = w ? 74 : 78;
  const gapH = 30;                  // 标题占的高度
  const ph = w ? specH * 2 + gapH : 88;

  const pnW = panel(px, y, lw, ph, {
    yr: [0, 1.16], title: 'Hann 窗的形状', tsize: M.small, tfill: GOLD,
  });
  s += pnW.s + curve(pnW, d06.hann, { c: GOLD, w: 2 });
  // 这句话贴着画板底边写，别压在曲线上
  s += T(px + lw / 2, y + ph + 18, '两端都是 0，中间是 1',
    { size: tiny(M), fill: GOLD, anchor: 'middle' });

  const rx = w ? px + lw + 20 : px;
  let ry = w ? y : y + ph + 42;
  ['不加窗', '加 Hann 窗'].forEach((k, i) => {
    const it = wd[k];
    const c = i === 0 ? WARM : GREEN;
    const pn = panel(rx, ry, rw, specH, {
      yr: [0, 1.12], title: `${k}　峰外能量 ${(it.spill * 100).toFixed(2)}%`,
      tsize: M.small, tfill: c,
    });
    s += pn.s;
    const n = it.spec.length;
    it.spec.forEach((v, j) => {
      const xx = rx + 4 + (j / (n - 1)) * (rw - 8);
      if (v > 0.004) s += L(xx, pn.sy(0), xx, pn.sy(v), { c, w: 1.3 });
    });
    ry += specH + gapH;
  });
  y = Math.max(y + ph + 26, ry) + 8;

  s += MT(px, y, w
    ? ['窗把一帧两端的样本压到零，这一帧首尾就都是 0，接缝天然接得上——等于人为造出一个周期信号。',
      '实测泄漏从 5.82% 降到 0.01%。代价是主峰变宽：换来更少的假成分，付出频率分得没那么细。']
    : ['窗把一帧两端压到零，首尾都是 0，接缝天然',
      '接得上。实测泄漏从 5.82% 降到 0.01%。',
      '代价是主峰变宽：假成分少了，频率分得糙了。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '加 Hann 窗前后泄漏到旁边的能量对比');
};

// PPT p40–p57：加窗消掉两端，所以帧必须重叠。窗叠加起来看起伏。
FIG['06-cola'] = (M) => {
  const ov = d06.overlap;
  const head = ['不重叠的话，', '帧边界上的样本贡献是零'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const K = 1024;
  const hann = (i, n) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  const rows = [
    { k: '不重叠', c: WARM, hop: K },
    { k: '重叠 50%', c: GREEN, hop: K / 2 },
  ];
  const ph = w ? 96 : 84;

  rows.forEach((r) => {
    const it = ov[r.k];
    const NF = 6;
    const total = NF * r.hop + K;
    const pn = panel(px, y, pw, ph, {
      yr: [0, 1.25],
      title: `${r.k}　叠加后起伏 ${(it.ripple * 100).toFixed(1)}%`,
      tsize: M.small, tfill: r.c,
    });
    s += pn.s;
    // 每个窗单独画一条淡线
    for (let f = 0; f < NF; f += 1) {
      const pts = [];
      for (let i = 0; i < 60; i += 1) {
        const idx = (i / 59) * (K - 1);
        const xx = px + ((f * r.hop + idx) / total) * pw;
        pts.push([xx, pn.sy(hann(idx, K))]);
      }
      s += P(pts, { c: '#c9d6e0', w: 1.1 });
    }
    // 叠加值画一条粗线
    const sum = [];
    for (let i = 0; i < 240; i += 1) {
      const pos = (i / 239) * total;
      let v = 0;
      for (let f = 0; f < NF; f += 1) {
        const idx = pos - f * r.hop;
        if (idx >= 0 && idx < K) v += hann(idx, K);
      }
      sum.push([px + (pos / total) * pw, pn.sy(v / (r.hop === K ? 1 : 1))]);
    }
    s += P(sum, { c: r.c, w: 2.2 });
    y += ph + 26;
  });

  s += MT(px, y - 4, w
    ? ['淡线是一个个 Hann 窗，粗线是它们加起来的总和——也就是每个样本最终被计入了多少。',
      '不重叠时总和在 0 和 1 之间来回摆，谷底那些样本一点都没被算进去，等于扔了。',
      '50% 重叠时两个 Hann 窗加起来处处等于 1，起伏只有 0.2%，一个样本也没丢。这叫 COLA。']
    : ['淡线是一个个 Hann 窗，粗线是它们的总和，',
      '也就是每个样本被计入了多少。不重叠时总和',
      '在 0 和 1 之间摆，谷底的样本等于被扔了；',
      '50% 重叠时处处等于 1，起伏只有 0.2%。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '不重叠时窗叠加值在 0 和 1 之间摆动，50% 重叠时处处等于 1');
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
