#!/usr/bin/env node
// 第 07–10 课教程式版的配图，电脑版和手机版各出一张。
//
//   python tools/measure-07-10.py     先跑这个，它产出 tools/data/*.json
//   node tools/build-figures-07-10-tutorial.mjs
//
// 所有曲线和数字都从 tools/data/ 读，不在这里另算一遍。第 01 课的教训：
// 同一份数据在 Python 和 Node 里各算一次，两处会给出不同的结论。

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, ARROW, header, headerH,
  twoRoutes, chain, panel, curve, bars, legend,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_06-10', 'figures');
const D = (n) => JSON.parse(readFileSync(join(ROOT, 'tools', 'data', `${n}.json`), 'utf8'));
// 手机版整张图从 420 缩到 360 px，是 0.857 倍。图内最小字号必须 >= 11.5/0.857
// = 13.5 px，否则 check-svg-mobile 会报 ERROR。电脑版不缩，12.5 就够。
const tiny = (M) => (wide(M) ? 12.5 : 14);

const d07 = D('07-time-features');
const d08 = D('08-envelope');
const d09 = D('09-rms-zcr');
const d10 = D('10-probe');

const FIG = {};

// ================================================================ 07

FIG['07-one-number-vs-three'] = (M) => twoRoutes(M,
  ['一整段只留一个数，', '和留下三条证据'],
  [
    {
      tag: '只算一个平均值', color: WARM, fill: '#fbf0ec',
      steps: ['整段录音', '求平均', '一个数'],
      end: '说不出第几秒',
      note: '答不出「哪一下是碰撞」',
    },
    {
      tag: '切段后算三种', color: GREEN, fill: '#eef7f2',
      steps: ['切成小段', '每段算三个数', '三条曲线'],
      end: '峰在第几段看得见',
      note: '三个问题分开问，也分开答',
    },
  ], '只求一个平均值和切段后算三条曲线的对比');

FIG['07-three-questions'] = (M) => chain(M,
  ['同一段小片段，', '三种特征各问一个不同的问题'],
  [
    { name: '振幅包络 AE', color: BLUE, fill: '#eaf4fb',
      desc: ['这一小段里', '最高峰有多高'], mdesc: '这一小段里最高峰有多高', why: '只看一个数' },
    { name: '均方根 RMS', color: GREEN, fill: '#eef7f2',
      desc: ['这一小段', '整体有多强'], mdesc: '这一小段整体有多强', why: '全部数一起算' },
    { name: '过零率 ZCR', color: GOLD, fill: '#faf4e6',
      desc: ['波形穿过中线', '有多频繁'], mdesc: '波形穿过中线有多频繁', why: '只数次数' },
  ],
  '三个答案都在，才知道是「短促一下」还是「一直很响」',
  '振幅包络、均方根、过零率各回答一个问题');

FIG['07-spike-vs-hum'] = (M) => {
  const head = ['同样两小段声音，', 'AE 说左边大 5 倍，RMS 说右边大 4.5 倍'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const cw = w ? (pw - 26) / 2 : pw;
  const ch = 82;
  const waves = [
    { nm: '一下尖峰', v: d07.toy_wave.spike, ae: d07.toy[0].ae, rms: d07.toy[0].rms, c: WARM },
    { nm: '持续振动', v: d07.toy_wave.hum, ae: d07.toy[1].ae, rms: d07.toy[1].rms, c: BLUE },
  ];
  waves.forEach((it, i) => {
    const bx = w ? px + i * (cw + 26) : px;
    const by = w ? y : y + i * (ch + 62);
    const pn = panel(bx, by, cw, ch, { yr: [-1.05, 1.05], title: it.nm, tfill: it.c, zero: true });
    s += pn.s + curve(pn, it.v, { c: it.c, w: 1.5 });
    s += T(bx + 8, by + ch + 20, `AE ${it.ae.toFixed(4)}`, { size: M.small, weight: 700, fill: it.c });
    s += T(bx + 8, by + ch + 38, `RMS ${it.rms.toFixed(4)}`, { size: M.small, weight: 700, fill: MUTED });
  });
  y += w ? ch + 48 : (ch + 62) * 2 - 14;

  s += MT(px, y + 12, w
    ? ['两小段都是 1024 个数。左边只有一个样本到了 1.0，其余全是 0；右边一直在以 0.2 的幅度来回摆。',
      '问「最高峰有多高」，左边赢；问「整体有多强」，右边赢。两个答案都对，因为它们不是同一个问题。']
    : ['两小段都是 1024 个数。左边只有一个',
      '样本到 1.0，其余全是 0；右边一直以',
      '0.2 的幅度摆动。两个答案都对——',
      '它们回答的不是同一个问题。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 14;
  return doc(M.W, y, s, '尖峰与持续振动在 AE 和 RMS 上给出相反的结论');
};

FIG['07-three-curves'] = (M) => {
  const head = ['同一段真实录音，', '三条曲线各画各的'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;
  const ch = w ? 62 : 52;
  const rows = [
    { nm: '波形（原始的 66150 个数）', v: d07.curves.wave, c: MUTED, sym: true },
    { nm: '振幅包络 AE：每段的最高峰', v: d07.curves.ae, c: BLUE },
    { nm: '均方根 RMS：每段的整体强弱', v: d07.curves.rms, c: GREEN },
    { nm: '过零率 ZCR：每段穿过中线的密度', v: d07.curves.zcr, c: GOLD },
  ];
  rows.forEach((r) => {
    const mx = Math.max(...r.v.map(Math.abs));
    const pn = panel(px, y, pw, ch, {
      yr: r.sym ? [-mx * 1.05, mx * 1.05] : [0, mx * 1.12],
      title: r.nm, tfill: r.c, tsize: M.small, zero: r.sym,
    });
    s += pn.s + curve(pn, r.v, { c: r.c, w: r.sym ? 0.7 : 1.7 });
    s += T(px + pw - 4, y + 14, mx.toFixed(3), { size: tiny(M), fill: MUTED, anchor: 'end' });
    y += ch + 30;
  });
  s += T(px, y + 6, '横轴都是同一段 3 秒；右上角是这条曲线的最大值。',
    { size: M.small, fill: MUTED });
  return doc(M.W, y + 22, s, '同一段录音的波形与三条时域特征曲线');
};

FIG['07-music-compare'] = (M) => {
  const head = ['统一电平之后，', 'AE 和 RMS 的差别没了，ZCR 一点没变'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 26;
  const order = ['debussy', 'duke', 'redhot'];
  const short = { debussy: '古典', duke: '爵士', redhot: '摇滚' };
  const keys = ['ae_mean', 'rms_mean', 'zcr_mean'];
  const titles = ['AE 平均', 'RMS 平均', 'ZCR 平均'];
  const cols = [BLUE, GREEN, GOLD];
  const bh = w ? 82 : 70;
  const bwid = w ? (pw - 32) / 3 : pw;

  [['原样读进来', d07.music], ['按 −20 dBFS 统一电平后', d07.music_norm]].forEach((row, ri) => {
    const [rowName, tbl] = row;
    s += T(px, y - 10, rowName, { size: M.h2, weight: 700, fill: INK });
    keys.forEach((k, i) => {
      const bx = w ? px + i * (bwid + 16) : px;
      const by = w ? y + 12 : y + 12 + i * (bh + 58);
      s += T(bx, by - 6, titles[i], { size: tiny(M), weight: 700, fill: cols[i] });
      s += bars(bx, by, bwid, bh, order.map((n) => ({
        name: short[n],
        vals: [{ v: tbl[n][k], c: cols[i], t: tbl[n][k].toFixed(4) }],
      })), { bw: w ? 40 : 52, max: Math.max(...order.map((n) => tbl[n][k])) * 1.3 });
      // 摇滚是古典的几倍，直接标出来，读者不用自己去除
      if (i === keys.length - 1 || w) {
        s += T(bx + bwid, by - 6, `摇滚 / 古典 ${(tbl.redhot[k] / tbl.debussy[k]).toFixed(2)}×`, {
          size: tiny(M), weight: 700, fill: MUTED, anchor: 'end',
        });
      }
    });
    y += (w ? bh + 62 : (bh + 58) * 3 + 26) + (ri === 0 ? 10 : 0);
  });

  s += MT(px, y - 6, w
    ? ['统一电平这一步只是把整段乘一个数。AE 和 RMS 跟着一起变，摇滚对古典的倍数从 1.78 和 1.49',
      '掉到 1.18 和 0.99——原来那点差别几乎全是「谁录得响」。ZCR 数的是穿过中线的次数，',
      '整段乘一个正数一次也不会多、不会少，所以 2.18 倍纹丝不动。这一条才是风格本身的差别。']
    : ['统一电平只是把整段乘一个数。AE 和 RMS',
      '跟着变，摇滚对古典从 1.78 和 1.49 掉到',
      '1.18 和 0.99——原来那点差别几乎全是',
      '「谁录得响」。ZCR 数的是穿过中线的次数，',
      '整段乘一个正数一次也不会多不会少，',
      '所以 2.18 倍纹丝不动。这条才是风格差别。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 6) * 21 + 6;
  return doc(M.W, y, s, '统一电平前后三段音乐在三种时域特征上的对比');
};

FIG['07-rms-steps'] = (M) => {
  const q = d09.quad;
  const sq = q.map((v) => +(v * v).toFixed(2));
  const mean = +(sq.reduce((a, b) => a + b, 0) / sq.length).toFixed(4);
  return chain(M,
    ['四个数直接求平均等于 0，', '平方之后才不会互相抵消'],
    [
      { name: '原始四个数', color: MUTED, fill: PLATE, desc: [q.join('  '), '直接求平均 = 0'], mdesc: q.join('  ') + '，平均 = 0' },
      { name: '① 方：每个数平方', color: BLUE, fill: '#eaf4fb', desc: [sq.join('  '), '负号没有了'], mdesc: sq.join('  ') + '，负号没有了' },
      { name: '② 均：求平均', color: GREEN, fill: '#eef7f2', desc: [String(mean), '一帧塌成一个数'], mdesc: mean + '，一帧塌成一个数' },
      { name: '③ 根：再开平方', color: WARM, fill: '#fbf0ec', desc: [String(d09.quad_rms), '量级回到和原数一样'], mdesc: d09.quad_rms + '，量级回到和原数一样' },
    ],
    '名字就是倒着念这三步：根 · 均 · 方',
    '均方根的三步计算，从四个数得到 0.7906');
};

FIG['07-zcr-definition'] = (M) => {
  const head = ['过零率数的不是峰，', '是波形穿过中线的次数'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const v = d09.clip;
  const cross = d09.clip_cross;
  const lim = Math.max(...v.map((x) => Math.abs(x))) * 1.15;
  const h = w ? 170 : 150;
  const pn = panel(px, y, pw, h, { fill: PLATE, yr: [-lim, lim], zero: true });
  s += pn.s;
  s += L(px, pn.sy(0), px + pw, pn.sy(0), { c: MUTED, w: 1.2 });
  s += T(px + pw - 4, pn.sy(0) - 6, '中线（0）', { size: tiny(M), fill: MUTED, anchor: 'end' });
  s += curve(pn, v, { c: BLUE, w: 1.6 });
  // 每一处穿越画一个点。位置在 measure 脚本里算好，这里只负责画。
  cross.forEach((i) => {
    const cx = px + pw * (i / (v.length - 1));
    s += O(cx, pn.sy(0), 3.4, { fill: GOLD });
  });
  y += h + 26;

  s += T(px, y, `这一小段真实语音抽稀到 ${v.length} 个点，橙色的点是它穿过中线的位置，一共 ${cross.length} 处。`,
    { size: M.small, fill: INK });
  y += 24;
  s += MT(px, y, w
    ? ['过零率 = 穿过的次数 ÷ 相邻数字对的个数。注意它只看正负号有没有翻，完全不看数字有多大——',
      '把整段乘以 2，每个点还在原地；把整段抬高一点，点就会少掉一批（第 09 课量过：抬 0.05 掉 37%）。']
    : ['过零率 = 穿过的次数 ÷ 相邻数字对的个数。',
      '它只看正负号翻没翻，不看数字多大：',
      '整段乘 2，点全在原地；整段抬高 0.05，',
      '点会少掉三成多（第 09 课量过）。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 12;
  return doc(M.W, y, s, '一小段真实语音上标出的每一个过零点');
};

// ================================================================ 08

FIG['08-frame-to-envelope'] = (M) => {
  const head = ['切成帧，每帧只留一个数，', '再把这些数连起来'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const E = d08.envsteps;
  let s = header(M, head);
  let y = top + 18;

  const lim = Math.max(...E.wave.map((x) => Math.abs(x))) * 1.12;
  const h = w ? 130 : 110;

  // ① 原始波形 + 帧的方框
  s += T(px, y - 6, `① 把这一小段切成互相重叠的帧（${E.src}）`, {
    size: tiny(M), weight: 700, fill: MUTED,
  });
  const p1 = panel(px, y, pw, h, { fill: PLATE, yr: [-lim, lim], zero: true });
  s += p1.s;
  s += curve(p1, E.wave, { c: BLUE, w: 1.3 });
  const total = E.wave.length;
  for (let i = 0; i < E.frames; i += 1) {
    const x0 = px + pw * ((i * E.hop) / total);
    const x1 = px + pw * ((i * E.hop + E.n) / total);
    const off = (i % 2) * 9;
    s += R(x0, y + 6 + off, x1 - x0, h - 12 - off * 2, {
      stroke: i % 2 ? GREEN : WARM, sw: 1.2, fill: 'none', r: 4,
    });
  }
  s += T(px + pw, y - 6, `帧长 ${E.n}、帧移 ${E.hop}，切出 ${E.frames} 帧`, {
    size: tiny(M), weight: 700, fill: MUTED, anchor: 'end',
  });
  y += h + 30;

  // ② 每帧那个最大绝对值
  s += T(px, y - 6, '② 每一帧只留下离中线最远的那一个数', { size: tiny(M), weight: 700, fill: MUTED });
  const p2 = panel(px, y, pw, h, { fill: PLATE, yr: [0, lim] });
  s += p2.s;
  E.ae.forEach((val, i) => {
    const cx = px + pw * ((i * E.hop + E.n / 2) / total);
    s += L(cx, p2.sy(0), cx, p2.sy(val), { c: GRID, w: 1.2 });
    s += O(cx, p2.sy(val), 4, { fill: i % 2 ? GREEN : WARM });
    s += T(cx, p2.sy(val) - 12, val.toFixed(2), {
      size: 11.5, weight: 700, fill: i % 2 ? GREEN : WARM, anchor: 'middle',
    });
  });
  s += curve(p2, E.ae, { c: WARM, w: 1.8, xr: undefined });
  y += h + 30;

  s += MT(px, y, w
    ? ['③ 把这些点按时间连起来，就是振幅包络。这一小段里有一次起音，包络从 0.03 涨到 0.39，差 11.5 倍。',
      '每个点标在它那一帧的中间，不是开头——标在开头，整条曲线会往左错半个帧长（这组参数下是 11.6 毫秒）。']
    : ['③ 把这些点连起来就是振幅包络。',
      '每个点标在它那一帧的中间，不是开头；',
      '标错了整条曲线会往左错半个帧长。'],
  { size: M.small, fill: INK, leading: 21 });
  y += (w ? 2 : 3) * 21 + 12;
  return doc(M.W, y, s, '从分帧到每帧最大绝对值再连成振幅包络的三步');
};



FIG['08-abs-first'] = (M) => {
  const head = ['先取绝对值，', '还是直接取最大值'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 14;
  const vals = d08.four;
  const ph = 96;
  const pn = panel(px, y, pw, ph, { xr: [-0.5, vals.length - 0.5], yr: [-1.05, 1.05], zero: true });
  s += pn.s;
  vals.forEach((v, i) => {
    const cx = pn.sx(i);
    s += L(cx, pn.sy(0), cx, pn.sy(v), { c: v < 0 ? WARM : BLUE, w: 3 });
    s += O(cx, pn.sy(v), 4.5, { fill: v < 0 ? WARM : BLUE });
    s += T(cx, pn.sy(v) + (v < 0 ? 18 : -10), String(v), {
      size: tiny(M), weight: 700, fill: v < 0 ? WARM : BLUE, anchor: 'middle',
    });
  });
  y += ph + 16;

  const cw = w ? (pw - 20) / 2 : pw;
  const cards = [
    { t: '直接 max(frame)', v: '0.7', note: '漏掉 −0.9，它在负方向上更远', c: WARM, fill: '#fbf0ec' },
    { t: '先 abs 再 max', v: '0.9', note: '离中线多远才是真正的峰高', c: GREEN, fill: '#eef7f2' },
  ];
  cards.forEach((c, i) => {
    const bx = w ? px + i * (cw + 20) : px;
    const by = w ? y : y + i * 82;
    s += R(bx, by, cw, 72, { fill: c.fill, stroke: c.c, sw: 1.6, r: 9 });
    s += T(bx + 14, by + 24, c.t, { size: M.h2, weight: 700, fill: c.c });
    s += T(bx + cw - 14, by + 26, c.v, { size: 20, weight: 700, fill: c.c, anchor: 'end' });
    s += T(bx + 14, by + 50, c.note, { size: M.small, fill: MUTED });
  });
  y += w ? 72 : 82 * 2 - 10;
  s += T(px, y + 26, '两个答案差 0.2，占真实峰高的 22%——而且程序不会报错。',
    { size: M.body, weight: 700, fill: WARM });
  return doc(M.W, y + 42, s, '直接取最大值会漏掉负方向上的峰');
};

FIG['08-frame-length'] = (M) => {
  const head = [`两下敲击相隔 ${d08.gap_ms} 毫秒，`, '帧长决定还看不看得出是两下'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const wh = 54;
  const wmax = Math.max(...d08.two_wave.map(Math.abs));
  const pw0 = panel(px, y, pw, wh, {
    yr: [-wmax * 1.1, wmax * 1.1], title: '原始波形（两下）', tsize: M.small, tfill: MUTED, zero: true,
  });
  s += pw0.s + curve(pw0, d08.two_wave, { c: MUTED, w: 0.9 });
  y += wh + 30;

  const cols = [GREEN, GOLD, WARM];
  ['256', '1024', '4096'].forEach((k, i) => {
    const it = d08.sizes[k];
    const ok = it.peaks >= 2;
    const ph = 48;
    const mx = Math.max(...it.curve);
    const pn = panel(px, y, pw, ph, {
      yr: [0, mx * 1.15],
      title: `帧长 ${k} 个样本 = ${it.ms} ms`,
      tsize: M.small, tfill: cols[i],
    });
    s += pn.s + curve(pn, it.curve, { c: cols[i], w: 2 });
    s += T(px + pw - 6, y + 16, ok ? '数出 2 个峰 ✓' : '只剩 1 个峰', {
      size: tiny(M), weight: 700, fill: ok ? GREEN : WARM, anchor: 'end',
    });
    y += ph + 30;
  });

  s += MT(px, y + 2, w
    ? ['帧长 46 ms 已经比两下之间的 30 ms 还长，一帧同时罩住了两下，包络上就只剩一个峰。',
      '要分开相隔 T 毫秒的两个事件，帧长必须明显小于 T——这是选帧长的唯一硬约束。']
    : ['帧长 46 ms 比两下之间的 30 ms 还长，',
      '一帧同时罩住两下，只剩一个峰。要分开',
      '相隔 T 毫秒的两件事，帧长必须明显',
      '小于 T。这是选帧长唯一的硬约束。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 10;
  return doc(M.W, y, s, '三种帧长对两下相邻敲击的分辨结果');
};

FIG['08-time-axis'] = (M) => {
  const head = ['这个点该标在帧的开头，', '还是帧的中间'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 16;

  const bh = 46;
  const fw = w ? 210 : 150;
  const hop = w ? 105 : 75;
  [0, 1, 2].forEach((i) => {
    const bx = px + i * hop;
    s += R(bx, y + i * 6, fw, bh - 12, {
      fill: i === 1 ? '#eaf4fb' : PLATE, stroke: i === 1 ? BLUE : GRID, sw: i === 1 ? 1.8 : 1, r: 5,
    });
    s += T(bx + 8, y + i * 6 + 21, `第 ${i + 1} 帧`, {
      size: M.small, fill: i === 1 ? BLUE : MUTED, weight: i === 1 ? 700 : 400,
    });
  });
  // 下面那根箭头和「差 xx ms」画在时间轴上方 16 和 24 px 处，
  // 这里必须留够，否则它们压在帧方框上。
  y += bh + 56;

  const ax = px;
  const aw = pw;
  s += L(ax, y, ax + aw, y, { c: GRID, w: 1.6 });
  const startX = ax + hop;
  const midX = startX + fw / 2;
  s += O(startX, y, 5, { fill: WARM });
  s += T(startX, y + 22, '标在帧开头', { size: M.small, weight: 700, fill: WARM, anchor: 'middle' });
  s += O(midX, y, 5, { fill: GREEN });
  s += T(midX, y + 22, '标在帧中心', { size: M.small, weight: 700, fill: GREEN, anchor: 'middle' });
  s += ARROW(startX, y - 16, midX, y - 16, { c: INK });
  s += T((startX + midX) / 2, y - 24, `差 ${d08.shift_ms} ms`, {
    size: M.small, weight: 700, fill: INK, anchor: 'middle',
  });
  y += 44;

  s += MT(px, y + 8, w
    ? ['这一帧覆盖 46.4 ms 的声音，算出来的那个数概括的是整段 46.4 ms，不是它开头那一瞬间。',
      `标在帧开头，整条包络就比真实事件早了 ${d08.shift_ms} ms；拿它去和波形对齐画图，会看到包络总是抢在前面。`]
    : ['这一帧覆盖 46.4 ms，算出的数概括的是',
      '整段 46.4 ms，不是开头那一瞬间。标在',
      `帧开头，整条包络就早了 ${d08.shift_ms} ms——`,
      '和波形叠在一起画时，包络会抢在前面。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 12;
  return doc(M.W, y, s, '帧起点与帧中心两种时间标法相差半个帧长');
};

FIG['08-tail'] = (M) => {
  const head = ['最后不够一帧的那一小截，', '你打算怎么办'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 14;

  const barH = 26;
  const usedW = pw * (d08.tail.used / d08.tail.L);
  s += R(px, y, usedW, barH, { fill: '#eaf4fb', stroke: BLUE, sw: 1.4, r: 4 });
  s += R(px + usedW, y, pw - usedW, barH, { fill: '#fbf0ec', stroke: WARM, sw: 1.4, r: 4 });
  s += T(px + 10, y + 18, `${d08.tail.frames} 个完整帧，用掉 ${d08.tail.used} 个样本`, {
    size: M.small, fill: BLUE, weight: 700,
  });
  const tailLabel = `剩 ${d08.tail.left} 个 = ${d08.tail.left_ms} ms`;
  s += (usedW > pw - 150 && !w)
    ? T(px, y + barH + 18, tailLabel, { size: M.small, fill: WARM, weight: 700 })
    : T(px + pw - 8, y + barH + 18, tailLabel, { size: M.small, fill: WARM, weight: 700, anchor: 'end' });
  y += barH + 34;

  const opts = [
    { t: '丢掉', c: MUTED, note: '每段输出形状整齐；最末尾那点声音消失' },
    { t: '保留短帧', c: GOLD, note: '不丢声音；最后一个数用的样本数和别的不同' },
    { t: '补零到整帧', c: GREEN, note: '长度一致；峰值不受影响，但 RMS 会被零拉低' },
  ];
  const cw = w ? (pw - 28) / 3 : pw;
  opts.forEach((o, i) => {
    const bx = w ? px + i * (cw + 14) : px;
    const by = w ? y : y + i * 66;
    s += R(bx, by, cw, w ? 82 : 58, { fill: PLATE, stroke: o.c, sw: 1.4, r: 8 });
    s += T(bx + 12, by + 22, o.t, { size: M.h2, weight: 700, fill: o.c });
    s += (w
      ? MT(bx + 12, by + 44, [o.note.slice(0, 11), o.note.slice(11)], { size: tiny(M), fill: MUTED, leading: 17 })
      : T(bx + 12, by + 44, o.note, { size: tiny(M), fill: MUTED }));
  });
  y += w ? 82 : 66 * 3 - 8;
  s += T(px, y + 26, '三种都对。错的是训练时用一种、上线时用另一种。',
    { size: M.body, weight: 700, fill: WARM });
  return doc(M.W, y + 42, s, '录音结尾不足一帧时的三种处理规则');
};

// ================================================================ 09

FIG['09-rms-four-steps'] = (M) => {
  const q = d09.quad;
  const sq = q.map((v) => +(v * v).toFixed(2));
  const mean = +(sq.reduce((a, b) => a + b, 0) / sq.length).toFixed(4);
  return chain(M,
    ['四个数直接求平均等于 0，', '平方之后才不会互相抵消'],
    [
      { name: '原始四个数', color: MUTED, fill: PLATE, desc: [q.join('  '), '直接求平均 = 0'], mdesc: q.join('  ') + '，平均 = 0' },
      { name: '每个数平方', color: BLUE, fill: '#eaf4fb', desc: [sq.join('  '), '负号没有了'], mdesc: sq.join('  ') + '，负号没有了' },
      { name: '求平均', color: GREEN, fill: '#eef7f2', desc: [String(mean), '这一步叫「均方」'], mdesc: mean + '，这一步叫「均方」' },
      { name: '再开平方', color: WARM, fill: '#fbf0ec', desc: [String(d09.quad_rms), '量级回到和原数一样'], mdesc: d09.quad_rms + '，量级回到和原数一样' },
    ],
    '名字就是倒着念这三步：根 · 均 · 方',
    '均方根的四步计算，从四个数得到 0.7906');
};

FIG['09-ae-vs-rms-outlier'] = (M) => {
  const head = ['100 个数里只有一个 1.0，', 'AE 说满格，RMS 说十分之一'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 16;

  const ph = 76;
  const pn = panel(px, y, pw, ph, { yr: [0, 1.1], title: '一帧 100 个数', tsize: M.small, tfill: MUTED });
  s += pn.s;
  for (let i = 0; i < 100; i += 1) {
    const v = i === 50 ? 1.0 : 0;
    const cx = pn.sx(i / 99);
    if (v > 0) {
      s += L(cx, pn.sy(0), cx, pn.sy(v), { c: WARM, w: 2.4 });
      s += O(cx, pn.sy(v), 4, { fill: WARM });
    } else {
      s += O(cx, pn.sy(0), 1.4, { fill: GRID });
    }
  }
  y += ph + 26;

  const bh = w ? 84 : 70;
  s += bars(px, y, pw, bh, [
    { name: '振幅包络 AE', vals: [{ v: 1.0, c: WARM, t: '1.00' }] },
    { name: '均方根 RMS', vals: [{ v: 0.1, c: GREEN, t: '0.10' }] },
  ], { bw: w ? 56 : 64, max: 1.18 });
  // bars 把组名画在 y+h+18，正文必须再往下让开一整行，否则压在组名上
  y += bh + 52;

  s += MT(px, y, w
    ? ['AE 只看那一个最高的数，所以它等于 1.0。RMS 要把这个 1.0 的平方摊到 100 个位置上，',
      '开方之后剩十分之一。所以：抓爆音、抓削波用 AE；判断一段是不是整体变响用 RMS。']
    : ['AE 只看最高的那个数，等于 1.0。',
      'RMS 把这个 1.0 的平方摊到 100 个位置，',
      '开方后剩十分之一。抓爆音用 AE，',
      '判断整体变没变响用 RMS。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 8;
  return doc(M.W, y, s, '孤立尖峰下振幅包络与均方根的差别');
};

FIG['09-zcr-offset'] = (M) => {
  const head = ['波形整条抬离中线，', '过零率就凭空掉下去'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 16;

  const clipMax = Math.max(...d09.clip.map(Math.abs));
  const keys = ['0.0', '0.02', '0.05'];
  const cols = [GREEN, GOLD, WARM];
  const ph = 56;
  const cw = w ? (pw - 24) / 3 : pw;
  keys.forEach((k, i) => {
    const off = Number(k);
    const bx = w ? px + i * (cw + 12) : px;
    const by = w ? y : y + i * (ph + 46);
    const pn = panel(bx, by, cw, ph, {
      // 按这一小段自己的幅度定纵轴。用 ±1 的话，0.05 的平移只有两三个像素，
      // 图就证明不了标题说的那件事。
      yr: [-clipMax - 0.07, clipMax + 0.09],
      title: off === 0 ? '原始录音' : `整条抬高 ${k}`,
      tsize: M.small, tfill: cols[i],
    });
    s += pn.s;
    s += L(bx, pn.sy(0), bx + cw, pn.sy(0), { c: GRID, dash: '3 3' });
    // 画的是真实语音的同一小段，只把整条往上挪；编一条曲线出来读者没法验证
    s += curve(pn, d09.clip.map((v) => v + off), { c: cols[i], w: 1.4 });
    s += T(bx + cw / 2, by + ph + 22, `这一小段的过零率 ${d09.clip_zcr[k]}`, {
      size: M.small, weight: 700, fill: cols[i], anchor: 'middle',
    });
  });
  y += w ? ph + 44 : (ph + 46) * 3 - 2;

  const drop = (((d09.offset['0.0'] - d09.offset['0.05']) / d09.offset['0.0']) * 100).toFixed(0);
  s += MT(px, y + 8, w
    ? ['三张图画的是同一小段真实语音，只把整条曲线往上挪，声音本身一个数没改。',
      `整段三秒算下来，平均过零率从 ${d09.offset['0.0']} 掉到 ${d09.offset['0.05']}，少了 ${drop}%——录音设备的直流偏置就会这样抬。`]
    : ['三张图是同一小段真实语音，只把整条',
      '往上挪，声音本身一个数没改。整段三秒',
      `平均过零率从 ${d09.offset['0.0']} 掉到 ${d09.offset['0.05']}，少 ${drop}%。`,
      '录音设备的直流偏置就会这样抬。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 12;
  return doc(M.W, y, s, '直流偏置使过零率下降的实测对比');
};

FIG['09-joint'] = (M) => {
  const head = ['两个数一起看，', `逐帧分对的比例从 ${d09.sep.rms}% 提到 ${d09.sep.both}%`];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const sets = [
    { k: 'debussy', nm: '古典', c: BLUE },
    { k: 'redhot', nm: '摇滚', c: WARM },
  ];
  const allR = sets.flatMap((t) => d09.pair[t.k].rms);
  const allZ = sets.flatMap((t) => d09.pair[t.k].zcr);
  const rmax = Math.max(...allR) * 1.1;
  const zmax = Math.max(...allZ) * 1.1;

  const ph = w ? 210 : 220;
  const pwid = w ? 340 : pw;
  const pn = panel(px, y, pwid, ph, { xr: [0, rmax], yr: [0, zmax] });
  s += pn.s;
  sets.forEach((t) => {
    const r = d09.pair[t.k].rms;
    const z = d09.pair[t.k].zcr;
    for (let i = 0; i < r.length; i += 2) {
      s += O(pn.sx(r[i]), pn.sy(z[i]), 2.2, { fill: t.c });
    }
  });
  s += T(px + pwid / 2, y + ph + 20, '横轴：RMS（整体强弱）', { size: tiny(M), fill: MUTED, anchor: 'middle' });
  s += T(px - 6, y + 10, 'ZCR', { size: tiny(M), fill: MUTED, anchor: 'end' });
  s += legend(px, y + ph + 40, sets.map((t) => ({ name: t.nm, c: t.c })), { gap: 78 });

  const tx = w ? px + pwid + 26 : px;
  let ty = w ? y + 6 : y + ph + 62;
  const twd = w ? pw - pwid - 26 : pw;
  const lines = [
    ['只看 RMS', `最好的那条竖线分对 ${d09.sep.rms}%`,
      `古典均值 ${d09.pair.debussy.rms_mean} / 摇滚 ${d09.pair.redhot.rms_mean}`, GOLD],
    ['只看 ZCR', `最好的那条横线分对 ${d09.sep.zcr}%`,
      `古典均值 ${d09.pair.debussy.zcr_mean} / 摇滚 ${d09.pair.redhot.zcr_mean}`, WARM],
    ['两个一起看', `按到两类中心的远近分，分对 ${d09.sep.both}%`,
      `比只看 RMS 多 ${(d09.sep.both - d09.sep.rms).toFixed(1)} 个百分点`, GREEN],
  ];
  lines.forEach((ln) => {
    s += R(tx, ty, twd, 72, { fill: PLATE, stroke: ln[3], sw: 1.4, r: 8 });
    s += T(tx + 12, ty + 21, ln[0], { size: M.h2, weight: 700, fill: ln[3] });
    s += T(tx + 12, ty + 41, ln[1], { size: tiny(M), fill: INK });
    s += T(tx + 12, ty + 60, ln[2], { size: tiny(M), fill: MUTED });
    ty += 80;
  });
  const bottom = Math.max(ty, y + ph + (w ? 56 : 0)) + 8;
  s += T(px, bottom + 14, `多出来的只有 ${(d09.sep.both - d09.sep.rms).toFixed(1)} 个百分点，两团还沾着边——这是线索，不是判决。`,
    { size: M.body, weight: 700, fill: WARM });
  return doc(M.W, bottom + 32, s, '古典与摇滚各帧在 RMS 与 ZCR 平面上的分布');
};

// ================================================================ 10

FIG['10-probe-match'] = (M) => {
  const head = ['拿一支已知频率的波去乘，', '再求平均'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const n = 200;
  const t = (i) => i / d10.sr;
  const sig = d10.wave;
  const cw = w ? (pw - 24) / 2 : pw;
  const ph = 64;

  [{ f: 440, val: d10.at['440'], c: GREEN, tag: '试探频率 = 440 Hz（信号里真有）' },
    { f: 500, val: d10.at['500'], c: WARM, tag: '试探频率 = 500 Hz（信号里没有）' }].forEach((it, i) => {
    const bx = w ? px + i * (cw + 24) : px;
    let by = w ? y : y + i * (ph * 2 + 76);
    const probe = [];
    const prod = [];
    for (let k = 0; k < n; k += 1) {
      const p = Math.sin(2 * Math.PI * it.f * t(k));
      probe.push(p);
      prod.push(sig[k] * p);
    }
    s += T(bx, by - 8, it.tag, { size: M.small, weight: 700, fill: it.c });
    const p1 = panel(bx, by, cw, ph, { yr: [-1.7, 1.7], zero: true });
    s += p1.s + curve(p1, sig.slice(0, n), { c: MUTED, w: 1 })
      + curve(p1, probe, { c: it.c, w: 1.3 });
    by += ph + 14;
    const p2 = panel(bx, by, cw, ph, { yr: [-1.7, 1.7], zero: true });
    const mx = prod.map((v, k) => [p2.sx(k / (n - 1)), p2.sy(v)]);
    s += p2.s;
    s += `<polygon points="${p2.x},${p2.sy(0)} ${mx.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ')} ${p2.x + p2.w},${p2.sy(0)}" fill="${it.c}" fill-opacity="0.22"/>`;
    s += P(mx, { c: it.c, w: 1.2 });
    s += T(bx + cw / 2, by + ph + 22, `相乘后求平均再乘 2 = ${it.val.toFixed(4)}`, {
      size: M.small, weight: 700, fill: it.c, anchor: 'middle',
    });
  });
  y += w ? ph * 2 + 50 : (ph * 2 + 76) * 2 - 26;

  s += MT(px, y + 10, w
    ? ['上排：灰线是原信号，彩线是试探波。下排：两条逐点相乘之后的结果，填色是它围出的面积。',
      '左边正的面积远多于负的，平均下来是 1.0000（正好等于 440 Hz 那一份的振幅）；右边正负一样多，抵消成 0。']
    : ['上排灰线是原信号，彩线是试探波；下排是',
      '两者逐点相乘的结果。左边正面积远多于',
      '负面积，平均出来 1.0000，正好是 440 Hz',
      '那一份的振幅；右边正负抵消，剩 0。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 12;
  return doc(M.W, y, s, '同频与不同频试探波相乘后的平均结果');
};

FIG['10-sweep'] = (M) => {
  const head = ['把试探频率从 100 扫到 2000，', '每个都记一个数'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ph = w ? 170 : 150;
  const pn = panel(px, y, pw, ph, { xr: [100, 2000], yr: [-0.08, 1.15] });
  s += pn.s;
  [500, 1000, 1500, 2000].forEach((f) => {
    s += L(pn.sx(f), y, pn.sx(f), y + ph, { c: GRID, dash: '2 4' });
    s += T(pn.sx(f), y + ph + 18, `${f}`, { size: tiny(M), fill: MUTED, anchor: 'middle' });
  });
  s += T(pn.sx(100), y + ph + 18, '100 Hz', { size: tiny(M), fill: MUTED, anchor: 'start' });
  s += curve(pn, d10.sweep_mag, { xr: [100, 2000], c: BLUE, w: 1.7 });
  [[440, d10.at.mag440, '440 Hz'], [880, 0.5, '880 Hz']].forEach(([f, v, lbl]) => {
    s += O(pn.sx(f), pn.sy(v), 4.5, { fill: WARM });
    s += T(pn.sx(f) + 8, pn.sy(v) - 6, `${lbl} → ${v.toFixed(2)}`, {
      size: tiny(M), weight: 700, fill: WARM,
    });
  });
  y += ph + 40;

  s += MT(px, y + 10, w
    ? ['这条曲线就是频谱。横轴是「我拿哪个频率去问」，纵轴是「问到的强度有多大」。',
      '两个峰的高度 1.00 和 0.50，正好是合成信号里两份正弦的振幅——不是像素上量出来的，是算出来的。']
    : ['这条曲线就是频谱：横轴是「拿哪个频率',
      '去问」，纵轴是「问到多强」。两个峰',
      '1.00 和 0.50 正好是合成时两份正弦的',
      '振幅，不是画上去的，是算出来的。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 4) * 21 + 12;
  return doc(M.W, y, s, '试探频率从 100 扫到 2000 Hz 得到的频谱');
};

FIG['10-phase-kills'] = (M) => {
  const head = ['同一段声音只把起点挪四分之一圈，', '一支试探波就问不出东西了'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 18;

  const ph = w ? 120 : 108;
  const cw = w ? (pw - 24) / 2 : pw;
  [{ nm: '只用一支试探波', a: d10.sweep_sin, b: d10.sweep_csin, c: WARM,
    v1: d10.at['440'], v2: d10.at.shift440_sin },
  { nm: '两支合起来（相差四分之一圈）', a: d10.sweep_mag, b: d10.sweep_cmag, c: GREEN,
    v1: d10.at.mag440, v2: d10.at.shift_mag440 }].forEach((it, i) => {
    const bx = w ? px + i * (cw + 24) : px;
    const by = w ? y : y + i * (ph + 76);
    s += T(bx, by - 8, it.nm, { size: M.small, weight: 700, fill: it.c });
    const pn = panel(bx, by, cw, ph, { xr: [100, 2000], yr: [-1.15, 1.2], zero: true });
    s += pn.s;
    s += curve(pn, it.a, { xr: [100, 2000], c: MUTED, w: 1.2 });
    s += curve(pn, it.b, { xr: [100, 2000], c: it.c, w: 1.8 });
    s += T(bx + 10, by + ph + 20, `原信号在 440 Hz：${it.v1.toFixed(4)}`, { size: tiny(M), fill: MUTED });
    s += T(bx + 10, by + ph + 38, `挪过起点后：${it.v2.toFixed(4)}`, {
      size: tiny(M), weight: 700, fill: it.c,
    });
  });
  y += w ? ph + 54 : (ph + 76) * 2 - 20;

  s += MT(px, y + 10, w
    ? ['声音本身完全没变，440 Hz 那一份还在，振幅还是 1.0，改的只是它从一轮的哪个位置起步。',
      '左边那支试探波正好和它错开，逐点相乘正负恰好抵光，答案是 0——不是没有 440 Hz，是这一支问不出来。',
      '右边同时用两支相差四分之一圈的试探波，把两个答案平方相加再开方，两种起点都得到 1.0000。']
    : ['声音本身没变，440 Hz 那一份还在，振幅',
      '还是 1.0，改的只是它从哪个位置起步。',
      '左边那支试探波正好和它错开，正负抵光，',
      '答案 0——不是没有 440，是这支问不出来。',
      '右边用两支相差四分之一圈的试探波，',
      '两个答案平方相加再开方，都得 1.0000。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 6) * 21 + 12;
  return doc(M.W, y, s, '单支试探波会被起点位置抹掉，两支合起来则不会');
};

FIG['10-time-lost'] = (M) => twoRoutes(M,
  ['整段做一次，', '和切成小段各做一次'],
  [
    {
      tag: '整段变换一次', color: WARM, fill: '#fbf0ec',
      steps: ['10 秒录音', '一次傅里叶变换', '一条频谱'],
      end: '答不出第几秒',
      note: '「先低后高」和「低高同时响」，频谱几乎一样',
    },
    {
      tag: '先分帧再逐帧变换', color: GREEN, fill: '#eef7f2',
      steps: ['切成小段', '每段各变换一次', '一列列排开'],
      end: '声谱图',
      note: '横轴时间、纵轴频率，时间回来了',
    },
  ], '整段变换与分帧后逐帧变换的对比');

FIG['10-two-sines-add'] = (M) => {
  const head = ['两支干净的波加起来，', '得到的那条线两支都不像'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const a = d10.parts['440'];
  const b = d10.parts['880'];
  const sum = d10.wave;
  const lim = Math.max(...sum.map((v) => Math.abs(v))) * 1.12;
  const h = w ? 88 : 74;

  const rows = [
    ['440 Hz，幅度 1.0', a, BLUE],
    ['880 Hz，幅度 0.5', b, GREEN],
    ['两条相加，麦克风只输出这一条', sum, WARM],
  ];
  rows.forEach(([name, vals, c], i) => {
    const ry = y + i * (h + 34);
    s += T(px, ry - 6, name, { size: tiny(M), weight: 700, fill: c });
    const pn = panel(px, ry, pw, h, { fill: PLATE, yr: [-lim, lim], zero: true });
    s += pn.s;
    s += L(px, pn.sy(0), px + pw, pn.sy(0), { c: GRID, w: 1 });
    s += curve(pn, vals, { c, w: i === 2 ? 1.9 : 1.5 });
    if (i === 1) {
      s += T(px + pw, ry - 6, '＋', { size: M.h1, weight: 700, fill: MUTED, anchor: 'end' });
    }
  });
  y += 3 * (h + 34) + 4;

  s += MT(px, y, w
    ? ['只给你最下面那条，很难说出它由哪两条组成——这就是第 10 课要解决的问题。',
      '注意它们的时间轴完全相同：三条画的是同一段 0.05 秒，横轴一格对一格。']
    : ['只给你最下面那条，很难说出它由哪两条',
      '组成——这就是这一课要解决的问题。',
      '三条画的是同一段 0.05 秒，横轴一格对一格。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 12;
  return doc(M.W, y, s, '440 Hz 与 880 Hz 两条正弦相加得到的复杂波形');
};

// ================================================================

// 内容没定稿之前只出电脑版：文章还在改，三版式一起出等于同一张图画三遍。
// 定稿后加 --all 补手机版。
const modes = process.argv.includes('--all') ? ['desktop', 'mobile'] : ['desktop'];
// 只重建指定的几张：node build-figures-07-10-tutorial.mjs 07-rms-steps 08-envelope-steps
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
for (const mode of modes) mkdirSync(join(BASE, mode), { recursive: true });
let n = 0;
for (const [name, make] of Object.entries(FIG)) {
  if (only.length && !only.includes(name)) continue;
  for (const mode of modes) {
    writeFileSync(join(BASE, mode, `${name}.svg`), make(MODES[mode]), 'utf8');
    n += 1;
  }
  console.log(`  ${name}`);
}
console.log(`${n} 个 SVG（${modes.join('、')}） -> ${BASE}`);
