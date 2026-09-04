#!/usr/bin/env node
// 第 16–20 课按 notebook / PPT 重写后新增的配图，电脑版和手机版各出一张。
//
//   python lessons/lessonNN_*.py --dump    先跑，产出 课程代码/data/lessonNN.json
//   node tools/build-figures-16-20-ppt.mjs
//
// 数字一律从 data/lessonNN.json 读，这里不重算。
// 旧的 16-linear-db.svg 一类是上一轮正式稿的图，本文件不碰它们，新图另起名字。

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, ARROW, header, headerH,
  panel, curve,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';
import { spectrogramPng, matrixPng, image, colorbar } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_16-20', 'figures');
const DATA = join(ROOT, 'NotebookLM课程博客_重写版', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));

// 手机版 420 缩到 360 是 0.857 倍，图内最小字号要 >= 14
const tiny = (M) => (wide(M) ? 12.5 : 14);

const d16 = D('16');
const d17 = D('17');
const d18 = D('18');
const d19 = D('19');
const FIG = {};

/** 一块声谱图：外框、标题、纵轴刻度、横轴刻度，中间放渲染好的 PNG。
 *
 * 纵轴刻度按 opt.logFreq 决定怎么摆：线性轴按比例，对数轴按 log 比例。
 * 两种轴共用同一套代码，是为了让两张图的框线、字号、留白完全一致——
 * 这张图要对比的是轴本身，别的地方一点都不能差。
 */
async function heat(x, y, w, h, plot, opt, M) {
  const left = opt.left ?? 58;
  const right = 12;
  const top = opt.title ? 32 : 12;
  const bottom = 30;
  const iw = w - left - right;
  const ih = h - top - bottom;
  const fmin = opt.fmin ?? d16.fmin;
  const fmax = opt.fmax ?? d16.fmax;
  // 渲染尺寸取「显示尺寸的 2.2 倍」和「数据分辨率的 3 倍」里小的那个。
  // 只按显示尺寸算的话，三种风格那张图会把 200 帧的数据放大到 1782 像素宽，
  // 什么细节都没多出来，SVG 却涨到 500 KB。
  const uri = await spectrogramPng(plot, {
    w: Math.min(Math.round(iw * 2.2), plot.frames * 3),
    h: Math.min(Math.round(ih * 2.2), plot.bins * 3),
    fmax, logFreq: !!opt.logFreq, dbFloor: opt.dbFloor ?? -80,
    scale: opt.scale ?? 'db', cmap: opt.cmap ?? 'magma',
  });
  let s = R(x, y, w, h, { fill: PLATE, stroke: GRID, r: 8 });
  if (opt.title) {
    s += T(x + 10, y + 20, opt.title, { size: tiny(M), weight: 700, fill: opt.tfill ?? INK });
  }
  s += image(uri, x + left, y + top, iw, ih);
  s += R(x + left, y + top, iw, ih, { fill: 'none', stroke: GRID, sw: 1, r: 0 });

  const posOf = (f) => (opt.logFreq
    ? Math.log(f / fmin) / Math.log(fmax / fmin)
    : f / fmax);
  // 单位跟着最高那个刻度走。单独在面板左上角画一个「Hz」会压在标题上。
  const ticks = opt.ticks ?? [0, 2000, 4000, 8000];
  ticks.forEach((f, i) => {
    const p = posOf(Math.max(f, fmin));
    if (p < -0.01 || p > 1.01) return;
    const py = y + top + ih - p * ih;
    const label = opt.tickLabel
      ? opt.tickLabel(f)
      : (i === ticks.length - 1 ? `${f} Hz` : String(f));
    s += T(x + left - 6, py + 4, label,
      { size: tiny(M), fill: MUTED, anchor: 'end' });
  });

  const secs = plot.duration;
  const marks = opt.timeMarks ?? [0, secs / 2, secs];
  marks.forEach((v, i) => {
    const qx = x + left + (v / secs) * iw;
    const last = i === marks.length - 1;
    s += T(qx, y + top + ih + 19, last ? `${v.toFixed(0)} 秒` : v.toFixed(i === 0 ? 0 : 1), {
      size: tiny(M), fill: MUTED, anchor: last ? 'end' : (i === 0 ? 'start' : 'middle'),
    });
  });
  return s;
}

// ================================================================ 16

// notebook cell 11—17：一次调用得到复数矩阵，取模平方换成功率矩阵。
FIG['16-complex-to-power'] = (M) => {
  const head = ['一次调用得到复数矩阵，', '取模平方换成功率矩阵'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const sh = d16.shape;
  const cards = [
    ['波形', `${sh.samples} 个数`, `${sh.duration.toFixed(2)} 秒`, BLUE],
    ['librosa.stft', `${sh.rows} × ${sh.padded_frames}`, sh.complex_dtype, GREEN],
    ['abs(S) ** 2', `${sh.rows} × ${sh.padded_frames}`, sh.power_dtype, WARM],
  ];
  const ch = w ? 88 : 74;
  const cw = w ? (pw - 2 * 34) / 3 : pw;
  cards.forEach((c, i) => {
    const bx = w ? px + i * (cw + 34) : px;
    const by = w ? y : y + i * (ch + 30);
    s += R(bx, by, cw, ch, { fill: PLATE, stroke: c[3], sw: 1.5, r: 9 });
    s += T(bx + 12, by + 24, c[0], { size: tiny(M), weight: 700, fill: c[3] });
    s += T(bx + 12, by + 52, c[1], { size: w ? 19 : 18, weight: 700, fill: INK });
    s += T(bx + 12, by + 74, c[2], { size: tiny(M), fill: MUTED });
    if (i < 2) {
      s += w
        ? ARROW(bx + cw + 8, by + ch / 2, bx + cw + 27, by + ch / 2)
        : ARROW(bx + cw / 2, by + ch + 6, bx + cw / 2, by + ch + 25);
    }
  });
  y += w ? ch + 26 : 3 * (ch + 30) - 4;

  s += MT(px, y + 14, w
    ? ['两个矩阵一样大——取模平方没有丢掉任何一格，丢掉的是每一格里的相位。',
      '第 12 课量过：只剩幅度就拼不回原来的波形，所以这一步是不可逆的。']
    : ['两个矩阵一样大：取模平方没丢掉任何一格，',
      '丢的是每格里的相位。第 12 课量过，只剩幅度',
      '就拼不回原波形——这一步不可逆。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 16;

  // 补边那一栏：列数为什么是 342 不是 338
  const bh = w ? 76 : 100;
  s += R(px, y, pw, bh, { fill: '#fff7ed', stroke: GOLD, sw: 1.4, r: 10 });
  s += T(px + 14, y + 24, '列数为什么是 ' + sh.padded_frames + ' 而不是 ' + sh.full_frames,
    { size: tiny(M), weight: 700, fill: GOLD });
  s += MT(px + 14, y + 46, w
    ? [`只数完整帧是 (${sh.samples} − ${d16.frame_size}) // ${d16.hop_size} + 1 = ${sh.full_frames} 帧；`
       + `librosa 默认 center=True，两端各补半帧，于是列数变成 ${sh.padded_frames}。`,
      `写 center=False 就回到 ${sh.nopad_frames} 列——第 15 课手写的那个数。`]
    : [`完整帧 ${sh.full_frames} 个；默认 center=True 在两端`,
      `各补半帧，列数变成 ${sh.padded_frames}。写 center=False`,
      `就回到 ${sh.nopad_frames} 列，正是第 15 课手写的数。`],
  { size: tiny(M), fill: MUTED, leading: 19 });
  y += bh + 14;
  return doc(M.W, y, s, 'STFT 交出复数矩阵，取模平方后形状不变但只剩实数功率');
};

// notebook cell 20 对 cell 22：同一批数，换个上色方式就从全黑变成能读。
FIG['16-why-db'] = async (M) => {
  const head = ['同一批数，', '换个上色方式才看得见'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const gap = w ? 18 : 16;
  const cw = w ? (pw - gap) / 2 : pw;
  const ch = w ? 210 : 190;
  const plot = d16.scale_linear;
  s += await heat(px, y, cw, ch, plot,
    { title: '按功率直接上色', tfill: WARM, scale: 'power' }, M);
  if (w) {
    s += await heat(px + cw + gap, y, cw, ch, plot,
      { title: '换成 dB 再上色', tfill: GREEN }, M);
    y += ch + 20;
  } else {
    y += ch + gap;
    s += await heat(px, y, cw, ch, plot,
      { title: '换成 dB 再上色', tfill: GREEN }, M);
    y += ch + 20;
  }

  s += colorbar(px + 30, y, w ? 140 : 120, 12, 'magma',
    { lo: '弱', hi: '强', size: tiny(M) });
  y += 34;

  const lin = d16.linear;
  const db = d16.db;
  const rows = [
    ['低于峰值 1% 的格子', `${(lin.below_1 * 100).toFixed(2)}%`, WARM],
    ['落在中间 60% 色阶里（按功率）', `${(lin.mid_share * 100).toFixed(4)}%`, WARM],
    ['落在中间 60% 色阶里（按 dB）', `${(db.mid_share * 100).toFixed(2)}%`, GREEN],
  ];
  rows.forEach((r, i) => {
    const by = y + i * 26;
    s += T(px + 4, by + 14, r[0], { size: tiny(M), fill: MUTED });
    s += T(px + pw - 4, by + 14, r[1], { size: tiny(M), weight: 700, fill: r[2], anchor: 'end' });
    s += L(px, by + 22, px + pw, by + 22, { c: GRID, w: 0.8 });
  });
  y += rows.length * 26 + 12;

  s += MT(px, y, w
    ? [`这段录音里最强和最弱差 ${lin.span_db.toFixed(0)} dB。按功率直接铺色，`
       + `${(lin.below_1 * 100).toFixed(1)}% 的格子挤在最暗的那一点点色阶里。`,
      'dB 把倍数关系换成加减，同一批数就摊开在整条色带上了。']
    : [`最强和最弱差 ${lin.span_db.toFixed(0)} dB。按功率铺色，`,
      `${(lin.below_1 * 100).toFixed(1)}% 的格子挤在最暗的一点点色阶里。`,
      'dB 把倍数换成加减，同一批数就摊开了。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 3) * 21 + 8;
  return doc(M.W, y, s, '同一段音阶按功率上色几乎全黑，换成分贝之后细节全部出现');
};

// notebook cell 24：纵轴换成对数频率，低频那一段才展得开。
FIG['16-log-frequency'] = async (M) => {
  const head = ['纵轴按倍数刻，', '低频那一段才展得开'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const gap = w ? 18 : 16;
  const cw = w ? (pw - gap) / 2 : pw;
  const ch = w ? 214 : 196;
  const ax = d16.axis;
  s += await heat(px, y, cw, ch, d16.scale_linear, {
    title: `线性纵轴：0—1000 Hz 只占 ${(ax.linear_share * 100).toFixed(1)}%`,
    tfill: WARM, ticks: [0, 2000, 4000, 8000],
  }, M);
  const second = {
    title: `对数纵轴：同一段占 ${(ax.log_share * 100).toFixed(1)}%`,
    tfill: GREEN, logFreq: true, ticks: [20, 100, 1000, 8000],
  };
  if (w) {
    s += await heat(px + cw + gap, y, cw, ch, d16.scale_log, second, M);
    y += ch + 22;
  } else {
    y += ch + gap;
    s += await heat(px, y, cw, ch, d16.scale_log, second, M);
    y += ch + 22;
  }

  s += MT(px, y, w
    ? [`两张图是同一个矩阵、同一套 dB，只有纵轴的刻法不同。`,
      `线性轴上 C2→C3 那个八度只占 ${(ax.low_octave * 100).toFixed(2)}% 的高度，`
      + `C6→C7 占 ${(ax.high_octave * 100).toFixed(2)}%，差 ${(ax.high_octave / ax.low_octave).toFixed(0)} 倍；`,
      `对数轴上每个八度都是 ${(100 / ax.octaves).toFixed(1)}%，音阶才画成一格一格等高的台阶。`]
    : ['同一个矩阵、同一套 dB，只有纵轴刻法不同。',
      `线性轴上低八度占 ${(ax.low_octave * 100).toFixed(2)}%、高八度占 `
      + `${(ax.high_octave * 100).toFixed(2)}%，`,
      `差 ${(ax.high_octave / ax.low_octave).toFixed(0)} 倍；对数轴上每个八度都是 `
      + `${(100 / ax.octaves).toFixed(1)}%。`],
  { size: M.small, fill: MUTED, leading: 21 });
  y += 3 * 21 + 10;
  return doc(M.W, y, s, '同一张声谱图在线性频率轴和对数频率轴上的对比');
};

// notebook cell 26：三种风格各一张对数频率声谱图。
FIG['16-three-genres'] = async (M) => {
  const head = ['同一组参数，', '三种音乐画出来完全不同'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const ch = w ? 150 : 138;
  for (const g of d16.genres) {
    s += await heat(px, y, pw, ch, g.plot, {
      title: `${g.label}　${g.shape[0]} × ${g.shape[1]}`,
      tfill: BLUE, logFreq: true, ticks: [20, 100, 1000, 8000],
      timeMarks: [0, 15, 30],
      // 三十秒音乐的动态范围本来就窄，再用 −80 dB 铺色会整张糊成一片亮粉。
      dbFloor: -60,
    }, M);
    y += ch + 12;
  }
  y += 6;
  s += colorbar(px + 30, y, w ? 140 : 120, 12, 'magma',
    { lo: '弱', hi: '强', size: tiny(M) });
  y += 34;

  s += MT(px, y, w
    ? ['三段都是 30 秒、同一个帧长和帧移，所以矩阵一样大，可以直接并排看。',
      '亮带集中在哪一层、随时间怎么变，就是「这段音乐长什么样」的一种写法。',
      '至于怎样把这张图压成几个数交给模型，是第 21—23 课的事。']
    : ['三段都是 30 秒、同一组参数，矩阵一样大，',
      '可以直接并排看。亮带集中在哪一层、随时间',
      '怎么变，就是这段音乐的样子。压成几个数交给',
      '模型，是第 21—23 课的事。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '古典、摇滚、爵士三段音乐的对数频率声谱图对比');
};

// ================================================================ 17

// p5：同样约 200 Hz，一个跨两个八度，一个只跨一个全音。
FIG['17-same-hz-different-feel'] = (M) => {
  const head = ['同样差两百赫兹，', '听起来根本不是一回事'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  // 一条 0—2000 Hz 的横轴，两对音各画一个括号
  const AXMAX = 2000;
  const ax = px + 10;
  const aw = pw - 20;
  const X = (f) => ax + (f / AXMAX) * aw;
  const ay = y + (w ? 52 : 58);
  s += L(ax, ay, ax + aw, ay, { c: INK, w: 2 });
  [0, 500, 1000, 1500, 2000].forEach((f, i) => {
    const last = f === AXMAX;
    s += L(X(f), ay, X(f), ay + 6, { c: MUTED, w: 1 });
    s += T(X(f), ay + 22, last ? '2000 Hz' : String(f),
      { size: tiny(M), fill: MUTED, anchor: last ? 'end' : (i === 0 ? 'start' : 'middle') });
  });

  d17.pairs.forEach((p, i) => {
    const c = i === 0 ? BLUE : WARM;
    const x0 = X(p.low_hz);
    const x1 = X(p.high_hz);
    const by = ay - (i === 0 ? 30 : 14);
    s += L(x0, by, x1, by, { c, w: 2.4 });
    s += L(x0, by, x0, ay, { c, w: 1.2, dash: '3 3' });
    s += L(x1, by, x1, ay, { c, w: 1.2, dash: '3 3' });
    s += T((x0 + x1) / 2, by - 7,
      p.low_name + '→' + p.high_name + '　' + p.gap_hz.toFixed(0) + ' Hz',
      { size: tiny(M), weight: 700, fill: c, anchor: 'middle' });
  });
  y = ay + 40;

  // 两把尺子量同一对音，结果差得远
  const rows = [
    ['在赫兹上差', (p) => p.gap_hz.toFixed(0) + ' Hz',
      '两对几乎一样（差 ' + d17.ratio_hz.toFixed(2) + ' 倍）'],
    ['在音程上差', (p) => p.semitones.toFixed(0) + ' 个半音',
      '差 ' + d17.ratio_semitones.toFixed(0) + ' 倍'],
    ['在梅尔上差', (p) => p.gap_mel.toFixed(0) + ' Mel',
      '差 ' + d17.mel_ratio.toFixed(1) + ' 倍'],
  ];
  const rh = w ? 30 : 46;
  rows.forEach((r, i) => {
    const by = y + i * (rh + 6);
    s += R(px, by, pw, rh, { fill: i === 1 ? '#fff7ed' : PLATE, stroke: GRID, r: 6 });
    s += T(px + 10, by + (w ? 20 : 19), r[0], { size: tiny(M), weight: 700, fill: MUTED });
    const cx = w ? px + pw * 0.30 : px + 10;
    const cy = w ? by + 20 : by + 38;
    s += T(cx, cy, r[1](d17.pairs[0]), { size: tiny(M), weight: 700, fill: BLUE });
    s += T(cx + (w ? pw * 0.17 : 116), cy, r[1](d17.pairs[1]),
      { size: tiny(M), weight: 700, fill: WARM });
    s += T(px + pw - 10, by + (w ? 20 : 19), r[2],
      { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  y += rows.length * (rh + 6) + 8;

  s += MT(px, y, w
    ? ['C2 到 C4 跨了两个八度，G6 到 A6 只跨一个全音，可它们在赫兹上几乎一样宽。',
      '赫兹这把尺子量的是「振动快了多少」，不是「听起来差多远」。']
    : ['C2 到 C4 跨两个八度，G6 到 A6 只跨一个全音，',
      '可它们在赫兹上几乎一样宽。赫兹量的是振动快了',
      '多少，不是听起来差多远。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '两对音在赫兹上间隔几乎相同，在音程和梅尔刻度上却相差很多');
};

// p11/p12：梅尔刻度曲线，以及等距的梅尔切回赫兹是不等距的。
FIG['17-mel-curve'] = (M) => {
  const head = ['梅尔上等距，', '赫兹上越往高越宽'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ph = w ? 208 : 192;
  const melMax = d17.bank.mel_hi;
  const p = panel(px + 52, y, pw - 62, ph, {
    xr: [0, d17.fmax], yr: [0, melMax], fill: '#fff', stroke: GRID,
  });
  s += p.s;
  // 十段等距的梅尔，横着切过去、竖着落到赫兹轴上
  d17.scale.edges_mel.forEach((m, i) => {
    const hz = d17.scale.edges_hz[i];
    s += L(p.x, p.sy(m), p.sx(hz), p.sy(m), { c: GRID, dash: '3 3', w: 0.9 });
    s += L(p.sx(hz), p.sy(m), p.sx(hz), p.y + p.h, { c: '#d9c7a3', w: 0.9 });
  });
  s += curve(p, d17.curve_mel, { c: GREEN, w: 2.4, xr: [0, d17.fmax] });
  // 1000 Hz = 1000 Mel 这个锚点
  s += O(p.sx(1000), p.sy(d17.scale.anchor_mel), 4.5, { fill: WARM });
  s += T(p.sx(1000) + 8, p.sy(d17.scale.anchor_mel) + 4,
    '1000 Hz ≈ ' + d17.scale.anchor_mel.toFixed(0) + ' Mel',
    { size: tiny(M), weight: 700, fill: WARM });
  [0, 1000, 2000, melMax].forEach((m, i) => {
    s += T(p.x - 7, p.sy(m) + 4, i === 3 ? m.toFixed(0) + ' Mel' : m.toFixed(0),
      { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  [0, 2000, 4000, 8000].forEach((f, i) => {
    s += T(p.sx(f), p.y + p.h + 19, i === 3 ? f + ' Hz' : String(f),
      { size: tiny(M), fill: MUTED, anchor: i === 3 ? 'end' : (i === 0 ? 'start' : 'middle') });
  });
  y += ph + 34;

  const wid = d17.scale.widths;
  const cards = [
    ['最窄的一段', Math.min.apply(null, wid).toFixed(0) + ' Hz', '在最低那一段', GREEN],
    ['最宽的一段', Math.max.apply(null, wid).toFixed(0) + ' Hz', '在最高那一段', WARM],
    ['两者相差', d17.scale.width_ratio.toFixed(1) + ' 倍', '同样叫「一段」', GOLD],
  ];
  const cw = w ? (pw - 2 * 14) / 3 : pw;
  cards.forEach((c, i) => {
    const bx = w ? px + i * (cw + 14) : px;
    const by = w ? y : y + i * 58;
    s += R(bx, by, cw, 50, { fill: PLATE, stroke: c[3], sw: 1.4, r: 8 });
    s += T(bx + 12, by + 20, c[0], { size: tiny(M), fill: MUTED });
    s += T(bx + 12, by + 41, c[1], { size: 17, weight: 700, fill: c[3] });
    s += T(bx + cw - 12, by + 41, c[2], { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  y += (w ? 50 : 58 * 3 - 8) + 18;

  s += MT(px, y, w
    ? ['纵轴上那十道横线是等距的，落到横轴上却越来越疏。',
      '这就是「梅尔上等距」的意思：低频那一段分得细，高频那一段分得粗。']
    : ['纵轴上那十道横线是等距的，落到横轴上却',
      '越来越疏——低频分得细，高频分得粗。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += 2 * 21 + 8;
  return doc(M.W, y, s, '梅尔刻度曲线，以及梅尔上等距的十段切回赫兹后宽度差近十倍');
};

// p25/p29/p30/p31：按五步造出来的三角滤波器组。
FIG['17-filter-bank'] = (M) => {
  const head = ['十个三角形，', '低频又窄又挤，高频又宽又疏'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ph = w ? 176 : 158;
  const binHz = d17.bank.bin_hz;
  const p = panel(px + 34, y, pw - 44, ph, {
    xr: [0, d17.fmax], yr: [0, 1.12], fill: '#fff', stroke: GRID,
  });
  s += p.s;
  const colors = [BLUE, GREEN];
  d17.bank_curves.forEach((row, i) => {
    const pts = row.map((v, k) => [p.sx(Math.min(k * binHz, d17.fmax)), p.sy(v)]);
    s += P(pts, { c: colors[i % 2], w: 1.6 });
  });
  [0, 0.5, 1].forEach((v) => {
    s += T(p.x - 7, p.sy(v) + 4, v.toFixed(1), { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  [0, 2000, 4000, 8000].forEach((f, i) => {
    s += T(p.sx(f), p.y + p.h + 19, i === 3 ? f + ' Hz' : String(f),
      { size: tiny(M), fill: MUTED, anchor: i === 3 ? 'end' : (i === 0 ? 'start' : 'middle') });
  });
  y += ph + 44;

  const bk = d17.bank;
  s += MT(px, y, w
    ? ['第 1 个三角形底边宽 ' + bk.widths_hz[0].toFixed(0) + ' Hz，第 '
      + bk.n_mels + ' 个宽 ' + bk.widths_hz[bk.n_mels - 1].toFixed(0)
      + ' Hz，差 ' + bk.width_ratio.toFixed(1) + ' 倍。',
      '每个三角形吃掉一段频率格，加权求和交出一个数——'
      + bk.n_bins + ' 个格子就这样变成 ' + bk.n_mels + ' 个。',
      '所以滤波器组的形状是（带数，帧长 / 2 + 1）= (' + bk.n_mels + ', ' + bk.n_bins + ')。']
    : ['第 1 个三角形底边宽 ' + bk.widths_hz[0].toFixed(0) + ' Hz，第 ' + bk.n_mels + ' 个',
      '宽 ' + bk.widths_hz[bk.n_mels - 1].toFixed(0) + ' Hz，差 '
      + bk.width_ratio.toFixed(1) + ' 倍。每个三角形吃掉',
      '一段频率格、加权求和交出一个数，' + bk.n_bins + ' 个格子',
      '就变成 ' + bk.n_mels + ' 个。形状 = (' + bk.n_mels + ', ' + bk.n_bins + ')。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '十个三角滤波器在赫兹轴上的分布，低频窄而密、高频宽而疏');
};

// p34/p37：乘上去，1025 行变成 10 行。
FIG['17-apply'] = async (M) => {
  const head = ['乘一次矩阵，', '频率轴就换成了梅尔带'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ap = d17.apply;
  const cards = [
    ['滤波器组 M', ap.bank_shape[0] + ' × ' + ap.bank_shape[1], '带 × 频率格', GREEN],
    ['声谱图 Y', ap.spectrogram_shape[0] + ' × ' + ap.spectrogram_shape[1], '频率格 × 帧', BLUE],
    ['M @ Y', ap.mel_shape[0] + ' × ' + ap.mel_shape[1], '带 × 帧', WARM],
  ];
  const ch = 78;
  const cw = w ? (pw - 2 * 30) / 3 : pw;
  cards.forEach((c, i) => {
    const bx = w ? px + i * (cw + 30) : px;
    const by = w ? y : y + i * (ch + 26);
    s += R(bx, by, cw, ch, { fill: PLATE, stroke: c[3], sw: 1.5, r: 9 });
    s += T(bx + 12, by + 22, c[0], { size: tiny(M), weight: 700, fill: c[3] });
    s += T(bx + 12, by + 48, c[1], { size: w ? 18 : 17, weight: 700, fill: INK });
    s += T(bx + 12, by + 68, c[2], { size: tiny(M), fill: MUTED });
    if (i < 2) {
      const sym = i === 0 ? '×' : '=';
      s += w
        ? T(bx + cw + 15, by + ch / 2 + 6, sym,
          { size: 18, weight: 700, fill: MUTED, anchor: 'middle' })
        : T(bx + cw / 2, by + ch + 19, sym,
          { size: 18, weight: 700, fill: MUTED, anchor: 'middle' });
    }
  });
  y += (w ? ch + 24 : 3 * (ch + 26) - 2);

  // 真的画出来：纵轴是第几个带，每个带一样高
  const hh = w ? 156 : 148;
  s += await heat(px, y, pw, hh, ap.plot, {
    title: ap.mel_shape[0] + ' 个梅尔带的声谱图（纵轴：第几个带）',
    tfill: WARM, fmin: 0, fmax: ap.mel_shape[0] - 1, left: w ? 84 : 88,
    ticks: [0, 4, 9], dbFloor: -70,
    tickLabel: (v) => (v + 1) + ' 带 ' + ap.band_centers[v].toFixed(0) + ' Hz',
    timeMarks: [0, ap.duration / 2, ap.duration],
  }, M);
  y += hh + 14;

  s += MT(px, y, w
    ? ['列数一个没动，行数从 ' + ap.spectrogram_shape[0] + ' 压到 ' + ap.mel_shape[0]
      + '——少了 ' + ap.compress.toFixed(1) + ' 倍。',
      '时间轴完全没碰，被换掉的只有频率轴：从「第几个频率格」变成「第几个梅尔带」。',
      '每个带在图上一样高，可它在赫兹上覆盖的范围越往上越宽。']
    : ['列数没动，行数从 ' + ap.spectrogram_shape[0] + ' 压到 ' + ap.mel_shape[0] + '，',
      '少了 ' + ap.compress.toFixed(1) + ' 倍。时间轴没碰，换掉的只有频率轴。',
      '每个带在图上一样高，在赫兹上覆盖的范围',
      '却越往上越宽。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '滤波器组乘上声谱图，1025 行压成 10 个梅尔带，列数不变');
};

// ================================================================ 18

// 源 Notebook 打印完 shape 就过去了。这张图是这一课真正的正题：
// 形状一样、数字全不一样，三个默认值逐个改过来的过程。
FIG['18-alignment'] = (M) => {
  const head = ['形状一样，数字全不一样：', '三个默认值逐个改过来'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  // 第二列不能从 0.30 起步：左边那行小字最长有二十几个汉字，会顶到顶点那一列上
  const cols = w
    ? [0.44, 0.72, 0.78, 1.0]
    : [0.42, 1.0];
  const rh = w ? 40 : 62;
  s += R(px, y, pw, 24, { fill: PLATE, stroke: GRID, r: 6 });
  if (w) {
    s += T(px + 10, y + 17, '这一步', { size: tiny(M), weight: 700, fill: MUTED });
    s += T(px + pw * cols[0], y + 17, '三角形顶点落在第几格', { size: tiny(M), weight: 700, fill: MUTED });
    s += T(px + pw * cols[1], y + 17, '最高权重', { size: tiny(M), weight: 700, fill: MUTED });
    s += T(px + pw - 10, y + 17, '和手写那版的最大差',
      { size: tiny(M), weight: 700, fill: MUTED, anchor: 'end' });
  } else {
    s += T(px + 10, y + 17, '这一步', { size: tiny(M), weight: 700, fill: MUTED });
    s += T(px + pw - 10, y + 17, '顶点 / 最高权重 / 最大差',
      { size: tiny(M), weight: 700, fill: MUTED, anchor: 'end' });
  }
  y += 28;

  d18.stages.forEach((st, i) => {
    const hit = st.same_peaks;
    const c = st.baseline ? BLUE : (hit ? GREEN : WARM);
    s += R(px, y, pw, rh, {
      fill: hit ? '#eef7f1' : PLATE, stroke: hit ? GREEN : GRID,
      sw: hit ? 1.4 : 1, r: 6,
    });
    const peaks = st.peak_bins.slice(0, 5).join('、') + ' …';
    s += T(px + 10, y + (w ? 17 : 19), st.name, { size: tiny(M), weight: 700, fill: c });
    s += T(px + 10, y + (w ? 33 : 37), st.note, { size: tiny(M), fill: MUTED });
    if (w) {
      s += T(px + pw * cols[0], y + 25, peaks, { size: tiny(M), fill: INK });
      s += T(px + pw * cols[1], y + 25, st.peak_value.toFixed(4), { size: tiny(M), fill: INK });
      s += T(px + pw - 10, y + 25, st.baseline ? '—' : st.max_diff.toFixed(4),
        { size: tiny(M), weight: 700, fill: c, anchor: 'end' });
    } else {
      s += T(px + pw - 10, y + 19, peaks, { size: tiny(M), fill: INK, anchor: 'end' });
      s += T(px + pw - 10, y + 37,
        st.peak_value.toFixed(4) + '　差 ' + (st.baseline ? '—' : st.max_diff.toFixed(4)),
        { size: tiny(M), weight: 700, fill: c, anchor: 'end' });
    }
    y += rh + 5;
  });
  y += 10;

  // 两条梅尔公式：差的不是精度，是刻度本身
  s += T(px, y, '为什么顶点会错位：两条梅尔公式根本不是一条', {
    size: M.small, weight: 700, fill: GOLD,
  });
  y += 12;
  const mh = w ? 26 : 26;
  s += R(px, y, pw, 22, { fill: PLATE, stroke: GRID, r: 5 });
  s += T(px + 10, y + 16, '频率', { size: tiny(M), weight: 700, fill: MUTED });
  s += T(px + pw * (w ? 0.46 : 0.52), y + 16, 'HTK（第 17 课那条）',
    { size: tiny(M), weight: 700, fill: GREEN, anchor: 'end' });
  s += T(px + pw - 10, y + 16, 'Slaney（库的默认）',
    { size: tiny(M), weight: 700, fill: WARM, anchor: 'end' });
  y += 26;
  d18.mel_formula.forEach((r) => {
    s += T(px + 10, y + 15, r.hz.toFixed(0) + ' Hz', { size: tiny(M), fill: INK });
    s += T(px + pw * (w ? 0.46 : 0.52), y + 15, r.htk.toFixed(2) + ' Mel',
      { size: tiny(M), weight: 700, fill: GREEN, anchor: 'end' });
    s += T(px + pw - 10, y + 15, r.slaney.toFixed(2) + ' Mel',
      { size: tiny(M), weight: 700, fill: WARM, anchor: 'end' });
    s += L(px, y + 21, px + pw, y + 21, { c: GRID, w: 0.8 });
    y += mh;
  });
  y += 8;

  s += MT(px, y, w
    ? ['三处都改过来之后，顶点位置完全一致，最大差只剩 '
      + d18.stages[d18.stages.length - 1].max_diff.toFixed(4) + '。',
      '这点残差来自第 17 课的第 ④ 步：那里把三角形的三个角四舍五入到了最近的频率格，',
      '库则直接拿精确频率去算每一格的权重。']
    : ['三处都改过来之后顶点完全一致，最大差只剩 '
      + d18.stages[d18.stages.length - 1].max_diff.toFixed(4) + '。',
      '这点残差来自第 17 课的第 ④ 步：那里把三角形的',
      '角四舍五入到了最近的频率格，库用的是精确频率。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 3) * 21 + 8;
  return doc(M.W, y, s, '手写滤波器组与库的结果逐步对齐，三个默认值各差在哪里');
};

// 三张三角形图叠着看：手写的、库默认的、对齐之后的。
FIG['18-bank-compare'] = (M) => {
  const head = ['同一个函数，', '三种参数画出三组不同的三角形'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const panels = [
    ['手写那版（第 17 课的五步）', 'mine', BLUE],
    ['库的默认值', 'default', WARM],
    ['fmax=8000, norm=None, htk=True', 'aligned', GREEN],
  ];
  const ph = w ? 104 : 96;
  panels.forEach(([title, key, color]) => {
    const rows = d18.curves[key];
    let mx = 0;
    rows.forEach((r) => r.forEach((v) => { if (v > mx) mx = v; }));
    const p = panel(px + 44, y + 16, pw - 54, ph, {
      xr: [0, d18.fmax], yr: [0, mx * 1.14], fill: '#fff', stroke: GRID,
    });
    s += T(px, y + 10, title, { size: tiny(M), weight: 700, fill: color });
    s += p.s;
    rows.forEach((row, i) => {
      const pts = row.map((v, k) => [p.sx(Math.min(k * d18.bin_hz, d18.fmax)), p.sy(v)]);
      s += P(pts, { c: i % 2 ? color : INK, w: 1.3 });
    });
    s += T(p.x - 7, p.sy(mx) + 4, mx < 0.01 ? mx.toFixed(4) : mx.toFixed(2),
      { size: tiny(M), fill: MUTED, anchor: 'end' });
    s += T(p.x - 7, p.y + p.h + 4, '0', { size: tiny(M), fill: MUTED, anchor: 'end' });
    y += ph + 16 + 24;
  });
  [0, 2000, 4000, 8000].forEach((f, i) => {
    const p0x = px + 44;
    const p0w = pw - 54;
    const qx = p0x + (f / d18.fmax) * p0w;
    s += T(qx, y - 12, i === 3 ? f + ' Hz' : String(f),
      { size: tiny(M), fill: MUTED, anchor: i === 3 ? 'end' : (i === 0 ? 'start' : 'middle') });
  });
  y += 8;

  s += MT(px, y, w
    ? ['三张图的纵轴各按自己的最高值缩放过，否则中间那张压根看不见——'
      + '库默认把每个三角形缩成等面积，最高权重只有 '
      + d18.stages[1].peak_value.toFixed(4) + '。',
      '看横向位置：上下两张的三角形对齐，中间那张整体偏右。那就是两条梅尔公式的差别。']
    : ['三张纵轴各按自己的最高值缩放，否则中间那张',
      '看不见——库默认把三角形缩成等面积，最高权重',
      '只有 ' + d18.stages[1].peak_value.toFixed(4) + '。看横向：上下两张对齐，',
      '中间那张整体偏右，那就是两条公式的差别。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 8;
  return doc(M.W, y, s, '手写、库默认、对齐三种参数下的梅尔三角滤波器组对比');
};

// melspectrogram 不是黑盒：它就是三步串起来。
FIG['18-black-box'] = (M) => {
  const head = ['melspectrogram 不是黑盒，', '它就是三步串起来'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const bb = d18.blackbox;
  const steps = [
    ['① stft', '复数矩阵', '第 16 课', BLUE],
    ['② abs() ** 2', bb.power_shape[0] + ' × ' + bb.power_shape[1], '功率矩阵', BLUE],
    ['③ 滤波器组 @ 它', bb.mel_shape[0] + ' × ' + bb.mel_shape[1], '梅尔声谱图', GREEN],
  ];
  const ch = 80;
  const cw = w ? (pw - 2 * 28) / 3 : pw;
  steps.forEach((c, i) => {
    const bx = w ? px + i * (cw + 28) : px;
    const by = w ? y : y + i * (ch + 24);
    s += R(bx, by, cw, ch, { fill: PLATE, stroke: c[3], sw: 1.5, r: 9 });
    s += T(bx + 12, by + 24, c[0], { size: tiny(M), weight: 700, fill: c[3] });
    s += T(bx + 12, by + 50, c[1], { size: w ? 18 : 17, weight: 700, fill: INK });
    s += T(bx + 12, by + 70, c[2], { size: tiny(M), fill: MUTED });
    if (i < 2) {
      s += w
        ? ARROW(bx + cw + 6, by + ch / 2, bx + cw + 24, by + ch / 2)
        : ARROW(bx + cw / 2, by + ch + 4, bx + cw / 2, by + ch + 21);
    }
  });
  y += (w ? ch + 26 : 3 * (ch + 24) - 2);

  const bh = w ? 62 : 82;
  s += R(px, y, pw, bh, { fill: '#eef7f1', stroke: GREEN, sw: 1.5, r: 10 });
  s += T(px + 14, y + 24, '自己走这三步，和一行调用的结果对比', {
    size: tiny(M), weight: 700, fill: GREEN,
  });
  s += T(px + 14, y + (w ? 48 : 50), '最大差 ' + bb.max_diff.toExponential(0), {
    size: 18, weight: 700, fill: GREEN,
  });
  s += T(px + pw - 14, y + (w ? 48 : 50), w ? '一个数都不差' : '一个数都不差', {
    size: tiny(M), fill: MUTED, anchor: 'end',
  });
  y += bh + 14;

  s += MT(px, y, w
    ? ['所以那个函数同时要 STFT 的参数（n_fft、hop_length）和梅尔的参数（n_mels）——',
      '它内部要做的正是这三步，缺一样都算不下去。',
      '知道这一点的好处：出了问题能自己拆开一步步查，而不是换个参数碰运气。']
    : ['所以那个函数同时要 STFT 的参数（n_fft、',
      'hop_length）和梅尔的参数（n_mels）：它内部',
      '做的正是这三步。出了问题能自己拆开查，',
      '不用换个参数碰运气。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, 'melspectrogram 等于 stft、取模平方、乘滤波器组这三步');
};

// 带数改一改：10 个带是粗台阶，90 个带能看见泛音。
FIG['18-bands-10-90'] = async (M) => {
  const head = ['十个带看得出音在往上走，', '九十个带才看得见泛音'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const hh = w ? 150 : 140;
  for (const b of d18.bands) {
    const plot = d18.band_plots[String(b.n_mels)];
    const ticks = b.n_mels === 10 ? [0, 4, 9] : [0, 44, 89];
    s += await heat(px, y, pw, hh, plot, {
      title: 'n_mels = ' + b.n_mels + '　矩阵 ' + b.shape[0] + ' × ' + b.shape[1]
        + '　是功率矩阵的 1/' + b.vs_power.toFixed(1),
      tfill: b.n_mels === 10 ? WARM : GREEN,
      fmin: 0, fmax: b.n_mels - 1, left: w ? 52 : 56,
      ticks, tickLabel: (v) => (v + 1) + ' 带',
      dbFloor: -70, timeMarks: [0, plot.duration / 2, plot.duration],
    }, M);
    y += hh + 14;
  }
  y += 4;
  s += colorbar(px + 26, y, w ? 140 : 120, 12, 'magma',
    { lo: '弱', hi: '强', size: tiny(M) });
  y += 34;

  s += MT(px, y, w
    ? ['上面那张只有十条带，音阶变成十级粗台阶——看得出音在往上走，别的看不出来。',
      '下面那张把同一段声音分成九十条带，主音上方那几条平行的亮线就露出来了，',
      '那是第 03 课讲过的泛音。代价是数据量从 1/'
      + d18.bands[0].vs_power.toFixed(1) + ' 变成 1/'
      + d18.bands[1].vs_power.toFixed(1) + '。']
    : ['上面十条带，音阶变成十级粗台阶；下面九十条',
      '带，主音上方那几条平行亮线露出来了，那是',
      '第 03 课讲过的泛音。代价是数据量从 1/'
      + d18.bands[0].vs_power.toFixed(1) + ' 变成',
      '1/' + d18.bands[1].vs_power.toFixed(1) + '。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '十个梅尔带与九十个梅尔带画出来的同一段音阶对比');
};

// ================================================================ 19

// p22—p29 那一串「信号 → 功率谱 → 取对数 → 倒谱」，PDF 只有示意图。
// 这里把第一步做实：相乘的两条曲线，取对数之后变成上下叠加。
FIG['19-log-splits'] = (M) => {
  const head = ['频谱上两部分是相乘的，', '取对数就变成了相加'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 26;

  const sp = d19.spec;
  const ph = w ? 76 : 66;
  const cw = w ? (pw - 30) / 2 : pw;
  const rgap = 42;   // 行距要装下画板外那一行标签
  const rows = [
    ['激励（谁在发声）', 'E', 'logE', GREEN],
    ['包络（发的什么音）', 'H', 'logH', BLUE],
    ['两者合起来', 'X', 'logX', WARM],
  ];

  if (w) {
    s += T(px, y - 22, '原样：相乘', { size: tiny(M), weight: 700, fill: MUTED });
    s += T(px + cw + 30, y - 22, '取对数之后：相加', {
      size: tiny(M), weight: 700, fill: MUTED,
    });
  }
  rows.forEach((row, i) => {
    const name = row[0];
    const kLin = row[1];
    const kLog = row[2];
    const c = row[3];
    const ry = y + i * (ph + rgap);
    const lin = sp[kLin];
    const lg = sp[kLog];
    const linMax = Math.max.apply(null, lin);
    const lgLo = Math.min.apply(null, lg);
    const lgHi = Math.max.apply(null, lg);
    const p1 = panel(px, ry, cw, ph, { fill: PLATE, yr: [0, linMax * 1.06] });
    s += p1.s;
    s += curve(p1, lin, { c, w: 1.5 });
    // 标签放画板外面：激励那两行的曲线密到顶，压在里面就看不清了
    s += T(px, ry - 6, name, { size: tiny(M), weight: 700, fill: c });
    if (w) {
      const p2 = panel(px + cw + 30, ry, cw, ph, {
        fill: PLATE, yr: [lgLo - 0.2, lgHi + 0.2],
      });
      s += p2.s;
      s += curve(p2, lg, { c, w: 1.5 });
      s += T(px + cw + 30, ry - 6, 'log ' + kLin, {
        size: tiny(M), weight: 700, fill: c,
      });
    }
    if (i === 1) {
      s += T(px + cw / 2, ry + ph + 22, '×', {
        size: 20, weight: 700, fill: MUTED, anchor: 'middle',
      });
      if (w) {
        s += T(px + cw + 30 + cw / 2, ry + ph + 22, '＋', {
          size: 20, weight: 700, fill: MUTED, anchor: 'middle',
        });
      }
    }
  });
  y += 3 * (ph + rgap) - 18;

  s += T(px, y + 14, '横轴都是 0—' + sp.fmax + ' Hz，三行一格对一格', {
    size: tiny(M), fill: MUTED,
  });
  y += 30;

  const bh = w ? 58 : 82;
  s += R(px, y, pw, bh, { fill: '#eef7f2', stroke: GREEN, sw: 1.4, r: 10 });
  s += MT(px + 14, y + 24, w
    ? ['把两条相乘的曲线取对数，逐点最大差 max|log X − (log E + log H)| = '
      + sp.resid.toExponential(3) + '，是浮点残渣。',
      '相乘的两样东西没法分开，相加的两样才有可能——整条倒谱的路子就建在这一步上。']
    : ['取对数后逐点最大差 ' + sp.resid.toExponential(3) + '，',
      '是浮点残渣。相乘的分不开，',
      '相加的才有可能分开。'],
  { size: tiny(M), fill: INK, leading: 20 });
  y += bh + 14;
  return doc(M.W, y, s, '激励与包络相乘得到频谱，取对数之后两者变成相加');
};

// p53、p54 那两张「把两部分分开」，PDF 上只有 4 Hz 和 100 Hz 两个标注。
// 这里把它变成三条真的倒谱，加上分界线两侧的能量占比。
FIG['19-quefrency-ends'] = (M) => {
  const head = ['一条曲线按变化快慢拆开：', '包络在左，激励在右'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 24;

  const cp = d19.cep;
  const qmax = cp.qmax_ms;
  const ph = w ? 74 : 64;
  const rows = [
    ['包络的倒谱', 'H', BLUE, cp.split.H],
    ['激励的倒谱', 'E', GREEN, cp.split.E],
    ['两者合起来', 'X', WARM, cp.split.X],
  ];
  let lim = 0;
  rows.forEach((r) => {
    cp[r[1]].slice(1).forEach((v) => { if (Math.abs(v) > lim) lim = Math.abs(v); });
  });

  rows.forEach((row, i) => {
    const name = row[0];
    const k = row[1];
    const c = row[2];
    const sp = row[3];
    const ry = y + i * (ph + 42);
    const pn = panel(px, ry, pw, ph, {
      fill: PLATE, xr: [0, qmax], yr: [-lim * 1.1, lim * 1.1], zero: true,
    });
    s += pn.s;
    s += L(px, pn.sy(0), px + pw, pn.sy(0), { c: GRID, w: 1 });
    // 第 0 格只是整条对数谱的平均值，画出来是一根盖过一切的竖线，跳过
    s += curve(pn, cp[k].slice(1), { c, w: 1.4, xr: [d19.q_ms, qmax] });
    const cx = pn.sx(d19.cut_ms);
    s += L(cx, ry, cx, ry + ph, { c: GOLD, w: 1.6, dash: '4 3' });
    s += T(px, ry - 6, name, { size: tiny(M), weight: 700, fill: c });
    // 分界线在 1.36 ms 处，横轴一共 18 ms——它离左边太近，两个百分比挂在
    // 线两侧会和行名挤成一团。并成一条放右端。
    s += T(px + pw, ry - 6, w
      ? '虚线左边 ' + (sp.lo * 100).toFixed(1) + '%　右边 ' + (sp.hi * 100).toFixed(1) + '%'
      : '左 ' + (sp.lo * 100).toFixed(1) + '%　右 ' + (sp.hi * 100).toFixed(1) + '%', {
        size: tiny(M), weight: 700, fill: c, anchor: 'end',
      });
    if (i === 2) {
      const qx = pn.sx(cp.peak_ms);
      s += L(qx, ry + ph * 0.15, qx, ry + ph, { c: WARM, w: 1.2, dash: '2 3' });
      s += T(qx + 5, ry + ph * 0.15 + 2,
        cp.peak_ms.toFixed(2) + ' 毫秒 → ' + cp.peak_hz.toFixed(1) + ' Hz', {
          size: tiny(M), weight: 700, fill: WARM,
        });
    }
  });
  y += 3 * (ph + 42) - 16;

  // 横轴刻度：单位并进最后一个刻度，不另起一个「毫秒」贴在右边缘
  const ticks = [0, 4, 8, 12, 16];
  ticks.forEach((t, i) => {
    const tx = px + (t / qmax) * pw;
    const last = i === ticks.length - 1;
    s += T(tx, y + 6, last ? t + ' 毫秒' : String(t), {
      size: tiny(M), fill: MUTED, anchor: last ? 'end' : 'middle',
    });
  });
  // 手机版 420 宽装不下这一整句，拆成两行
  s += MT(px, y + 28, w
    ? ['横轴叫倒频率，单位是秒——它量的是「对数谱每隔多远重复一次」']
    : ['横轴叫倒频率，单位是秒——', '它量的是「对数谱每隔多远重复一次」'],
  { size: tiny(M), fill: MUTED, leading: 19 });
  y += w ? 44 : 63;

  s += MT(px, y, w
    ? ['金色虚线放在 ' + d19.cut_ms.toFixed(2) + ' 毫秒。包络把 '
      + (cp.split.H.lo * 100).toFixed(1) + '% 的结构能量放在它左边，激励把 '
      + (cp.split.E.hi * 100).toFixed(1) + '% 放在右边。',
      '合起来那条两边都有，正因为它是两者相加——照着这条线切一刀，就把它们分开了。']
    : ['虚线在 ' + d19.cut_ms.toFixed(2) + ' 毫秒。包络 '
      + (cp.split.H.lo * 100).toFixed(1) + '% 在左，',
      '激励 ' + (cp.split.E.hi * 100).toFixed(1) + '% 在右。合起来那条',
      '两边都有，因为它是两者相加。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 12;
  return doc(M.W, y, s, '包络、激励与两者合成的倒谱，分界线两侧的能量占比');
};

// PDF 说提升能取回包络，但没验证过。这里把取回的那条叠在真包络上。
FIG['19-liftering'] = (M) => {
  const head = ['只留左边那一段再变回去，', '拿到的就是包络'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 26;

  const lf = d19.lift;
  const all = lf.logH.concat(lf.rec, lf.raw);
  const lo = Math.min.apply(null, all);
  const hi = Math.max.apply(null, all);
  const ph = w ? 150 : 128;
  const pn = panel(px, y, pw, ph, { fill: PLATE, yr: [lo - 0.2, hi + 0.2] });
  s += pn.s;
  s += curve(pn, lf.raw, { c: GRID, w: 1.2 });
  s += curve(pn, lf.logH, { c: BLUE, w: 2.4 });
  s += curve(pn, lf.rec, { c: WARM, w: 1.8 });
  y += ph + 8;

  const items = [
    ['真正的包络', BLUE],
    ['提升取回来的', WARM],
    ['不提升的对数谱', GRID],
  ];
  let lx = px;
  items.forEach((it) => {
    s += R(lx, y + 4, 16, 4, { fill: it[1], stroke: 'none', r: 2 });
    s += T(lx + 22, y + 11, it[0], { size: tiny(M), fill: MUTED });
    lx += 22 + it[0].length * tiny(M) + 24;
  });
  y += 32;

  const bh = w ? 92 : 132;
  s += R(px, y, pw, bh, { fill: '#fbf0ec', stroke: WARM, sw: 1.4, r: 10 });
  s += T(px + 14, y + 24, '对齐平均高度之后，和真包络差多少', {
    size: tiny(M), weight: 700, fill: WARM,
  });
  const cmp = [
    ['提升之后', lf.rmse_lift, lf.rmse_lift / lf.span, GREEN],
    ['不提升', lf.rmse_raw, lf.rmse_raw / lf.span, MUTED],
  ];
  cmp.forEach((r, i) => {
    const ry = y + 48 + i * 22;
    s += T(px + 14, ry, r[0], { size: tiny(M), fill: INK });
    s += T(px + 120, ry, '均方根差 ' + r[1].toFixed(4), { size: tiny(M), fill: INK });
    s += T(px + 270, ry, '占包络自身跨度的 ' + (r[2] * 100).toFixed(1) + '%', {
      size: tiny(M), weight: 700, fill: r[3],
    });
  });
  if (w) {
    s += T(px + pw - 14, y + 60, '提升把误差压到原来的 1/' + lf.gain.toFixed(1), {
      size: 17, weight: 700, fill: GREEN, anchor: 'end',
    });
  }
  y += bh + 12;

  s += MT(px, y + 6, w
    ? ['取回的是包络的形状：它整体比真包络高出 ' + lf.offset.toFixed(4)
      + '，那个常数正是激励对数谱的平均值，被一起留在了低倒频率里。',
      '分界线放在哪并不敏感——第 20 格到第 60 格之间，均方根差都在 0.12 到 0.15 之间。']
    : ['取回的是形状：整体高出 ' + lf.offset.toFixed(4) + '，',
      '那是激励的平均电平，一起留在了低倒频率里。',
      '分界线在第 20—60 格之间效果都差不多。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 12;
  return doc(M.W, y, s, '提升取回的包络与真包络、未提升的对数谱三条曲线对比');
};

// p68 那句「去相关」是全课最值钱的一条，PDF 一句话带过。
FIG['19-dct-decorrelate'] = async (M) => {
  const head = ['梅尔带互相重复，', 'DCT 把重复的部分去掉'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 26;

  const dd = d19.dct;
  const abs = (m) => m.map((row) => row.map(Math.abs));
  const pngs = await Promise.all([
    matrixPng(abs(dd.corr_mel), { px: 8 }),
    matrixPng(abs(dd.corr_dct), { px: 8 }),
  ]);

  const side = w ? 200 : 168;
  const gap = w ? 56 : 24;
  const panels = [
    ['DCT 之前：' + d19.n_mels + ' 条梅尔带', pngs[0], dd.corr_mel_avg, dd.corr_mel_adj, BLUE],
    ['DCT 之后：' + d19.n_mels + ' 个系数', pngs[1], dd.corr_dct_avg, dd.corr_dct_adj, WARM],
  ];
  panels.forEach((p, i) => {
    const bx = w ? px + i * (side + gap) : px + (pw - side) / 2;
    const by = w ? y : y + i * (side + 78);
    s += T(bx, by - 8, p[0], { size: tiny(M), weight: 700, fill: p[4] });
    s += image(p[1], bx, by, side, side);
    s += R(bx, by, side, side, { fill: 'none', stroke: GRID, r: 0 });
    s += T(bx, by + side + 20, '任意两条的平均 |相关| ' + p[2].toFixed(4), {
      size: tiny(M), fill: INK,
    });
    s += T(bx, by + side + 38, '相邻两条 ' + p[3].toFixed(4), {
      size: tiny(M), weight: 700, fill: p[4],
    });
  });
  if (w) {
    s += MT(px + 2 * side + 2 * gap, y + 24,
      ['颜色越深表示越相关；',
        '对角线是自己和自己，永远是 1。',
        '',
        '左边那张几乎整片都是深的——',
        '相邻两条到了 ' + dd.corr_mel_adj.toFixed(2) + '，',
        '说明四十个数里有大量重复。',
        '',
        'DCT 之后只剩对角线还亮，',
        '平均相关性掉了 ' + (dd.drop * 100).toFixed(0) + '%。'],
      { size: tiny(M), fill: MUTED, leading: 20 });
  }
  y += (w ? side + 52 : 2 * (side + 78) - 26);
  if (!w) {
    s += T(px, y + 12, '颜色越深表示越相关；对角线永远是 1', {
      size: tiny(M), fill: MUTED,
    });
    y += 24;
  }
  y += 12;

  // 三行数据从 y+70 起，每行 20——框高至少要 70 + 3*20 + 12
  const bh = w ? 142 : 158;
  s += R(px, y, pw, bh, { fill: '#eef7f2', stroke: GREEN, sw: 1.4, r: 10 });
  s += T(px + 14, y + 24, '那么留几个系数够用', {
    size: tiny(M), weight: 700, fill: GREEN,
  });
  s += T(px + 14, y + 48, '前 K 个', { size: tiny(M), weight: 700, fill: MUTED });
  s += T(px + 110, y + 48, '重建的均方根差', { size: tiny(M), weight: 700, fill: MUTED });
  s += T(px + 270, y + 48, '解释掉原谱多少变化', { size: tiny(M), weight: 700, fill: MUTED });
  dd.recon.filter((r) => r.k <= 20).forEach((r, i) => {
    const ry = y + 70 + i * 20;
    const hot = r.k === 13;
    s += T(px + 14, ry, String(r.k), { size: tiny(M), fill: INK });
    s += T(px + 110, ry, r.rmse.toFixed(3) + ' dB', { size: tiny(M), fill: INK });
    s += T(px + 270, ry, (r.var * 100).toFixed(1) + '%', {
      size: tiny(M), weight: hot ? 700 : 400, fill: hot ? GREEN : INK,
    });
  });
  if (w) {
    s += MT(px + 460, y + 48,
      ['传统上取 12—13 个，就是在这条曲线上挑的：',
        '前 13 个只用了 ' + (13 / d19.n_mels * 100).toFixed(0) + '% 的数，',
        '却装下了原谱 ' + (dd.recon[1].var * 100).toFixed(1) + '% 的变化。'],
      { size: tiny(M), fill: MUTED, leading: 20 });
  }
  y += bh + 14;

  s += MT(px, y, w
    ? ['相邻梅尔带 ' + dd.corr_mel_adj.toFixed(2) + ' 的相关不是巧合：三角形本来就互相重叠，'
      + '一个音响起来，它的泛音会同时点亮好几条带。',
      '把重复的部分去掉，四十个数才真正变成四十条互不重复的信息。']
    : ['相邻梅尔带 ' + dd.corr_mel_adj.toFixed(2) + ' 的相关不是巧合：',
      '三角形本来就重叠，泛音会同时点亮好几条带。',
      '去掉重复，四十个数才是四十条信息。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 12;
  return doc(M.W, y, s, '梅尔带之间与 DCT 系数之间的相关系数矩阵对比');
};

// ================================================================

mkdirSync(join(BASE, 'desktop'), { recursive: true });
mkdirSync(join(BASE, 'mobile'), { recursive: true });
let n = 0;
for (const [name, make] of Object.entries(FIG)) {
  for (const mode of ['desktop', 'mobile']) {
    writeFileSync(join(BASE, mode, `${name}.svg`), await make(MODES[mode]), 'utf8');
    n += 1;
  }
  console.log(`  ${name}`);
}
console.log(`${n} 个 SVG -> ${BASE}`);
