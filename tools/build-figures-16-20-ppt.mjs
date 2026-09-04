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
import { spectrogramPng, image, colorbar } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_16-20', 'figures');
const DATA = join(ROOT, 'NotebookLM课程博客_重写版', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));

// 手机版 420 缩到 360 是 0.857 倍，图内最小字号要 >= 14
const tiny = (M) => (wide(M) ? 12.5 : 14);

const d16 = D('16');
const d17 = D('17');
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
