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
  MODES, wide, doc, T, MT, R, L, ARROW, header, headerH,
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
  const fmin = d16.fmin;
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
    s += T(x + left - 6, py + 4, i === ticks.length - 1 ? `${f} Hz` : String(f),
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
