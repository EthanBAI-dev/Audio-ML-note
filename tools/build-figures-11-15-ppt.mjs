#!/usr/bin/env node
// 第 11–15 课按 PPT / notebook 重写后新增的配图，电脑版和手机版各出一张。
//
//   python lessons/lessonNN_*.py --dump    先跑，产出 课程代码/data/lessonNN.json
//   node tools/build-figures-11-15-ppt.mjs
//
// 数字一律从 data/lessonNN.json 读，这里不重算。

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, ARROW, header, headerH,
  panel, curve, legend,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_11-15', 'figures');
const DATA = join(ROOT, 'NotebookLM课程博客_重写版', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));

// 手机版 420 缩到 360 是 0.857 倍，图内最小字号要 >= 14
const tiny = (M) => (wide(M) ? 12.5 : 14);

const d11 = D('11');
const d12 = D('12');
const FIG = {};

/** 画一块复平面：返回坐标换算函数和已画好的坐标轴。
 *
 * 轴标签的字号必须跟着版式走。写死 11.5 px 的话，手机版整张图从 420 缩到
 * 360 之后只剩 9.9 px，check-svg-mobile 会判不合格。 */
function plane(x, y, size, lim, M) {
  const c = size / 2;
  const X = (v) => x + c + (v / lim) * (c - 14);
  const Y = (v) => y + c - (v / lim) * (c - 14);
  const fs = tiny(M);
  let s = R(x, y, size, size, { fill: '#fff', stroke: GRID, r: 6 });
  s += L(x + 6, Y(0), x + size - 6, Y(0), { c: GRID, w: 1.2 });
  s += L(X(0), y + 6, X(0), y + size - 6, { c: GRID, w: 1.2 });
  s += T(x + size - 8, Y(0) - 6, 'Re', { size: fs, fill: MUTED, anchor: 'end' });
  s += T(X(0) + 6, y + 18, 'Im', { size: fs, fill: MUTED });
  return { s, X, Y };
}

// ================================================================ 11

// PPT p14–p25：同一个点，直角坐标与极坐标两种说法。
FIG['11-complex-plane'] = (M) => {
  const zr = d11.z[0];
  const zi = d11.z[1];
  const head = ['同一个点，', '两种说法装的信息一样多'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const size = w ? 200 : Math.min(pw, 220);
  const lim = 5.6;

  // 左：直角坐标
  const p1 = plane(px, y, size, lim, M);
  s += p1.s;
  s += T(px + 8, y + 18, '直角坐标', { size: M.small, weight: 700, fill: BLUE });
  s += L(p1.X(zr), p1.Y(0), p1.X(zr), p1.Y(zi), { c: BLUE, dash: '3 3' });
  s += L(p1.X(0), p1.Y(zi), p1.X(zr), p1.Y(zi), { c: BLUE, dash: '3 3' });
  s += O(p1.X(zr), p1.Y(zi), 5, { fill: BLUE });
  s += T(p1.X(zr) + 8, p1.Y(zi) - 6, `${zr} + ${zi}i`,
    { size: tiny(M), weight: 700, fill: BLUE });
  s += T(p1.X(zr / 2), p1.Y(0) + 16, `实部 ${zr}`,
    { size: tiny(M), fill: MUTED, anchor: 'middle' });
  s += T(p1.X(0) - 6, p1.Y(zi / 2), `虚部 ${zi}`,
    { size: tiny(M), fill: MUTED, anchor: 'end' });

  // 右：极坐标
  const x2 = w ? px + size + 24 : px;
  const y2 = w ? y : y + size + 40;
  const p2 = plane(x2, y2, size, lim, M);
  s += p2.s;
  s += T(x2 + 8, y2 + 18, '极坐标', { size: M.small, weight: 700, fill: WARM });
  s += L(p2.X(0), p2.Y(0), p2.X(zr), p2.Y(zi), { c: WARM, w: 2.2 });
  s += O(p2.X(zr), p2.Y(zi), 5, { fill: WARM });
  // 角的小弧
  const rr = 26;
  const a0 = 0;
  const a1 = -Math.atan2(zi, zr);
  s += `<path d="M${(p2.X(0) + rr).toFixed(1)},${p2.Y(0).toFixed(1)} `
    + `A${rr},${rr} 0 0 0 ${(p2.X(0) + rr * Math.cos(a1)).toFixed(1)},`
    + `${(p2.Y(0) + rr * Math.sin(a1)).toFixed(1)}" fill="none" `
    + `stroke="${WARM}" stroke-width="1.6"/>`;
  // 标签放在横轴下方、面板内。沿角平分线往外推会跑出面板右边界；
  // 那条斜线在轴上方，所以放到轴下方既不压线也不越界。
  s += T(p2.X(0) + rr + 4, p2.Y(0) + 22,
    `γ = ${d11.gamma.toFixed(4)}`,
    { size: tiny(M), weight: 700, fill: WARM, anchor: 'middle' });
  s += T(p2.X(zr / 2) - 6, p2.Y(zi / 2) - 8, `模 ${d11.r.toFixed(0)}`,
    { size: tiny(M), weight: 700, fill: WARM, anchor: 'end' });
  y = (w ? y + size : y2 + size) + 26;

  s += MT(px, y, w
    ? [`左边用「往右 ${zr}、往上 ${zi}」定位，右边用「离原点 ${d11.r.toFixed(0)}、朝 ${(d11.gamma * 180 / Math.PI).toFixed(2)}°」定位。`,
      '两种说法互相转得回去，装的信息一样多。极坐标那一种正好对上声音要的两样东西：',
      '模对应「这个频率有多强」，角对应「从一轮的哪个位置起步」。']
    : [`左边用「往右 ${zr}、往上 ${zi}」，右边用「离原点`,
      `${d11.r.toFixed(0)}、朝 ${(d11.gamma * 180 / Math.PI).toFixed(2)}°」。两种说法转得回去。`,
      '极坐标正好对上声音要的两样：模＝有多强，',
      '角＝从哪里起步。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '复数在复平面上的直角坐标与极坐标两种表示');
};

// PPT p44–p50：模都是 1 时，角决定指向哪儿。
FIG['11-directions'] = (M) => {
  const head = ['模都是 1，', '角是多少就指向哪儿'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const size = w ? 210 : Math.min(pw, 230);
  const x0 = px + (w ? (pw - size) / 2 : 0);
  const p = plane(x0, y, size, 1.35, M);
  s += p.s;
  // 单位圆
  const cx = p.X(0);
  const cy = p.Y(0);
  const rr = p.X(1) - p.X(0);
  s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}" `
    + `fill="none" stroke="${GRID}" stroke-width="1.2" stroke-dasharray="3 3"/>`;

  const cols = [BLUE, GREEN, WARM, GOLD];
  d11.directions.forEach((d, i) => {
    const c = cols[i % cols.length];
    s += L(cx, cy, p.X(d.re), p.Y(d.im), { c, w: 2.2 });
    s += O(p.X(d.re), p.Y(d.im), 4.5, { fill: c });
  });
  y += size + 22;

  // 四行数值
  d11.directions.forEach((d, i) => {
    const c = cols[i % cols.length];
    const by = y + i * 22;
    s += O(px + 5, by - 4, 4, { fill: c });
    s += T(px + 16, by,
      `γ = ${d.label}（${(d.gamma * 180 / Math.PI).toFixed(0)}°）`
      + `　→　${d.re >= 0 ? '+' : ''}${d.re.toFixed(4)}`
      + `${d.im >= 0 ? '+' : ''}${d.im.toFixed(4)}i`,
      { size: tiny(M), fill: c });
  });
  y += d11.directions.length * 22 + 12;

  s += MT(px, y, w
    ? ['四个点都落在这个虚线圆上——模全是 1，只有方向不同。',
      '记住这一点：角变了，长度不变。下一课公式里那个 e 的指数项做的就是这件事。']
    : ['四个点都落在虚线圆上，模全是 1，只有方向不同。',
      '角变了，长度不变——下一课公式里 e 的指数项',
      '做的就是这件事。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '模为 1 时不同的角分别指向复平面的哪个方向');
};

// 把第 10 课那两支试探波的读数拼成一个复数。
FIG['11-two-probes-one-number'] = (M) => {
  const k = d11.link;
  const head = ['第 10 课那两个读数，', '拼起来就是一个复数'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  // 左：两支试探波的读数，两根柱
  const cw = w ? pw * 0.4 : pw;
  const bh = w ? 130 : 108;
  s += T(px, y - 6, '两支试探波各自的读数', { size: M.small, weight: 700, fill: MUTED });
  s += L(px, y + bh / 2, px + cw, y + bh / 2, { c: GRID });
  [['余弦那支', k.z[0], BLUE], ['正弦那支', k.z[1], GREEN]].forEach((q, i) => {
    const slot = cw / 2;
    const x0 = px + i * slot + slot / 2 - 16;
    const hgt = (q[1] / 1.25) * (bh / 2);
    s += R(x0, y + bh / 2 - Math.max(hgt, 0), 32, Math.max(Math.abs(hgt), 2),
      { fill: q[2], stroke: 'none', r: 2 });
    s += T(x0 + 16, y + bh / 2 - Math.max(hgt, 0) - 6, q[1].toFixed(4),
      { size: tiny(M), weight: 700, fill: q[2], anchor: 'middle' });
    s += T(x0 + 16, y + bh + 16, q[0], { size: tiny(M), fill: MUTED, anchor: 'middle' });
  });

  // 右：拼成的那个点
  const size = w ? 150 : Math.min(pw, 190);
  const x2 = w ? px + cw + 26 : px;
  const y2 = w ? y : y + bh + 46;
  const p = plane(x2, y2, size, 1.35, M);
  s += p.s;
  s += L(p.X(0), p.Y(0), p.X(k.z[0]), p.Y(k.z[1]), { c: WARM, w: 2.4 });
  s += O(p.X(k.z[0]), p.Y(k.z[1]), 5, { fill: WARM });
  s += T(p.X(k.z[0]) + 6, p.Y(k.z[1]) + 14,
    `模 ${k.mag.toFixed(4)}`, { size: tiny(M), weight: 700, fill: WARM });
  y = (w ? y + bh + 30 : y2 + size + 22);

  const rows = [
    ['模 |z|', k.mag.toFixed(4), '＝ 第 10 课量到的强度'],
    ['角 γ', `${k.ang.toFixed(4)} 弧度`, '＝ 第 10 课量到的相位'],
    ['起点挪四分之一圈后', `模 ${k.mag_shift.toFixed(4)}　角 ${k.ang_shift.toFixed(4)}`,
      '模没变，角变了 90°'],
  ];
  rows.forEach((r, i) => {
    const by = y + i * (w ? 30 : 46);
    s += R(px, by, pw, w ? 26 : 42, { fill: PLATE, stroke: GRID, r: 5 });
    s += T(px + 10, by + (w ? 18 : 17), r[0], { size: tiny(M), weight: 700, fill: INK });
    s += T(px + (w ? pw * 0.38 : 10), by + (w ? 18 : 34), r[1],
      { size: tiny(M), weight: 700, fill: WARM });
    s += T(px + pw - 10, by + (w ? 18 : 17), r[2],
      { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  y += rows.length * (w ? 30 : 46) + 14;

  s += MT(px, y, w
    ? ['余弦那支当实部、正弦那支当虚部，两个读数就成了平面上一个点的横纵坐标。',
      '这个点离原点多远，就是这个频率有多强；朝哪个方向，就是它从哪里起步。',
      '起点挪四分之一圈时模纹丝不动——上一课「一支试探波会被起点抹掉」的问题就此消失。']
    : ['余弦那支当实部、正弦那支当虚部，两个读数',
      '成了一个点的横纵坐标。离原点多远＝有多强，',
      '朝哪个方向＝从哪里起步。起点挪四分之一圈时',
      '模纹丝不动，被抹掉的问题就此消失。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 4) * 21 + 8;
  return doc(M.W, y, s, '两支试探波的读数拼成一个复数后，模是强度、角是相位');
};

// ================================================================ 12

// PPT p8/p15：一个频率对应一个复数系数，模是幅度、角是相位。
FIG['12-one-coefficient'] = (M) => {
  const head = ['一个频率算出一个复数，', '模是幅度、角是相位'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const size = w ? 180 : Math.min(pw, 210);
  const p = plane(px, y, size, 1.35, M);
  s += p.s;
  s += L(p.X(0), p.Y(0), p.X(d12.c[0]), p.Y(d12.c[1]), { c: WARM, w: 2.4 });
  s += O(p.X(d12.c[0]), p.Y(d12.c[1]), 5, { fill: WARM });
  s += T(p.X(d12.c[0]) + 8, p.Y(d12.c[1]) + 14, 'c', { size: M.h2, weight: 700, fill: WARM });

  const rx = w ? px + size + 26 : px;
  let ry = w ? y + 14 : y + size + 26;
  const rw = w ? pw - size - 26 : pw;
  const rows = [
    ['实部 Re(c)', d12.c[0].toFixed(4), '余弦那支试探波的读数', BLUE],
    ['虚部 Im(c)', d12.c[1].toFixed(4), '正弦那支试探波的读数', GREEN],
    ['模 |c|', d12.c_mag.toFixed(4), '幅度：这个频率有多强', WARM],
    ['角 ∠c', d12.c_ang.toFixed(4) + ' 弧度', '相位：从哪里起步', WARM],
  ];
  rows.forEach((r) => {
    s += R(rx, ry, rw, w ? 34 : 44, { fill: PLATE, stroke: r[3], sw: 1.3, r: 6 });
    s += T(rx + 10, ry + (w ? 22 : 19), r[0], { size: tiny(M), weight: 700, fill: r[3] });
    s += T(rx + (w ? rw * 0.34 : 10), ry + (w ? 22 : 37), r[1],
      { size: tiny(M), weight: 700, fill: INK });
    s += T(rx + rw - 10, ry + (w ? 22 : 19), r[2],
      { size: tiny(M), fill: MUTED, anchor: 'end' });
    ry += (w ? 40 : 50);
  });
  y = Math.max(y + size, ry) + 12;

  s += MT(px, y, w
    ? ['模和角不是从系数里「再算一次」得到的——它们就是同一个点的另一套坐标。',
      '第 11 课已经验证过：模等于第 10 课量到的强度，角等于第 10 课量到的相位。']
    : ['模和角不是再算一次得到的，它们就是同一个点',
      '的另一套坐标。第 11 课验证过：模＝强度，',
      '角＝相位。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 8;
  return doc(M.W, y, s, '一个频率对应一个复数系数，模是幅度、角是相位');
};

// PPT p38/p39：幅度谱与相位谱是同一次变换的两半。
FIG['12-mag-and-phase'] = (M) => {
  const head = ['幅度谱和相位谱，', '来自同一次变换'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const f0 = d12.freqs[0];
  const f1 = d12.freqs[d12.freqs.length - 1];
  const X = (f) => px + ((f - f0) / (f1 - f0)) * pw;
  const ph = w ? 92 : 80;

  // 幅度谱
  const mx = Math.max.apply(null, d12.mag);
  const p1 = panel(px, y, pw, ph, {
    yr: [0, mx * 1.18], title: '幅度谱（取模）', tsize: M.small, tfill: BLUE,
  });
  s += p1.s + curve(p1, d12.mag, { c: BLUE, w: 1.6 });
  [[440, d12.mag[d12.freqs.findIndex((f) => f >= 440)]],
    [880, d12.mag[d12.freqs.findIndex((f) => f >= 880)]]].forEach((q) => {
    s += O(X(q[0]), p1.sy(q[1]), 4, { fill: WARM });
    s += T(X(q[0]) + 7, p1.sy(q[1]) - 5, `${q[0]} Hz　${q[1].toFixed(4)}`,
      { size: tiny(M), weight: 700, fill: WARM });
  });
  y += ph + 26;

  // 相位谱
  const p2 = panel(px, y, pw, ph, {
    yr: [-3.4, 3.4], zero: true,
    title: '相位谱（取角）', tsize: M.small, tfill: GOLD,
  });
  s += p2.s + curve(p2, d12.phase, { c: GOLD, w: 1.1 });
  [440, 880].forEach((hz) => {
    const i = d12.freqs.findIndex((f) => f >= hz);
    s += O(X(hz), p2.sy(d12.phase[i]), 4, { fill: WARM });
  });
  y += ph + 26;

  s += MT(px, y - 6, w
    ? ['两条谱不是算了两遍——同一批复数系数，取模得上面那条，取角得下面那条。',
      '注意下面那条大部分位置在乱跳：那些频率上幅度只有 1e-17 量级，',
      '幅度是零时「从哪里起步」这个问题本身不成立，角完全由浮点残渣决定。',
      '所以读相位谱之前必须先看幅度谱，只有峰所在的位置才值得读。']
    : ['两条谱不是算了两遍：同一批复数系数，取模得',
      '上面那条，取角得下面那条。下面大部分在乱跳，',
      '因为那些频率的幅度只有 1e-17 量级——幅度是零',
      '时，角完全由浮点残渣决定，读它没有意义。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 4 : 4) * 21 + 8;
  return doc(M.W, y, s, '幅度谱与相位谱是同一次变换的两半');
};

// PPT p44–p50：一次完整往返，以及丢掉相位的后果。
FIG['12-roundtrip'] = (M) => {
  const head = ['带相位能拼回原波形，', '丢掉相位就拼不回来'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  let s = header(M, head);
  let y = top + 20;

  const ph = w ? 96 : 84;
  const p1 = panel(px, y, pw, ph, {
    yr: [-1.7, 1.7], zero: true,
    title: '原波形（粗）与带相位重建（细）——完全重合',
    tsize: M.small, tfill: GREEN,
  });
  s += p1.s + curve(p1, d12.wave, { c: '#9fc4dd', w: 4 })
    + curve(p1, d12.rec, { c: GREEN, w: 1.4 });
  y += ph + 26;

  const p2 = panel(px, y, pw, ph, {
    yr: [-1.7, 1.7], zero: true,
    title: '把相位当成 0 之后的重建——形状明显不同',
    tsize: M.small, tfill: WARM,
  });
  s += p2.s + curve(p2, d12.wave, { c: '#9fc4dd', w: 4 })
    + curve(p2, d12.rec_nophase, { c: WARM, w: 1.4 });
  y += ph + 26;

  const cards = [
    ['带相位重建', d12.err.toExponential(3), '浮点残渣', GREEN],
    ['丢掉相位重建', d12.err_nophase.toFixed(4), `大了 ${(d12.err_nophase / d12.err).toExponential(1)} 倍`, WARM],
  ];
  const cw = w ? (pw - 16) / 2 : pw;
  cards.forEach((c, i) => {
    const bx = w ? px + i * (cw + 16) : px;
    const by = w ? y : y + i * 62;
    s += R(bx, by, cw, 54, { fill: PLATE, stroke: c[3], sw: 1.5, r: 8 });
    s += T(bx + 12, by + 21, c[0], { size: tiny(M), fill: MUTED });
    s += T(bx + 12, by + 43, c[1], { size: 17, weight: 700, fill: c[3] });
    s += T(bx + cw - 12, by + 43, c[2], { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  y += (w ? 54 : 62 * 2 - 8) + 22;

  s += MT(px, y, w
    ? ['幅度谱只是变换结果的一半。它能告诉你有哪些频率、各有多强，',
      '但只有幅度谱拼不回原来的波形——「从哪里起步」丢掉就再也补不回来。',
      '只有幅度和相位都留着，原信号和它的傅里叶表示才装着同样多的信息。']
    : ['幅度谱只是结果的一半。它能说清有哪些频率、',
      '各有多强，但只有它拼不回波形——起点丢了就',
      '补不回来。两样都留着，才算另一种完整写法。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 3 : 3) * 21 + 8;
  return doc(M.W, y, s, '带相位重建能完全拼回原波形，丢掉相位则拼不回来');
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
