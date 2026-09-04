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
  panel, curve, legend, chain,
  BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';
import { spectrogramPng, image, colorbar } from './lib/figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, '音频信号处理二十三讲/', '第11-15课', 'figures');
const DATA = join(ROOT, '音频信号处理二十三讲/', '课程代码', 'data');
const D = (n) => JSON.parse(readFileSync(join(DATA, `lesson${n}.json`), 'utf8'));

// 手机版 420 缩到 360 是 0.857 倍，图内最小字号要 >= 14
const tiny = (M) => (wide(M) ? 12.5 : 14);

const d11 = D('11');
const d12 = D('12');
const d13 = D('13');
const d14 = D('14');
const d15 = D('15');
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

// ================================================================ 13

// PPT p17—32：连续公式面对两个无穷；时间和频率各限制一次，才落到 N 点 DFT。
FIG['13-two-hacks'] = (M) => chain(M,
  ['计算机怎样处理两个无穷？', '时间和频率各收一次口'],
  [
    {
      name: '连续公式',
      desc: ['时间没有尽头', '频率也有无穷多个'],
      mdesc: '时间和频率都没有尽头',
      color: MUTED,
      fill: PLATE,
      why: '先限制时间',
    },
    {
      name: '第 1 次收口 · 时间',
      desc: [`只留下 ${d13.N} 个样本`, `n = 0 … ${d13.N - 1}`],
      mdesc: `只留下 ${d13.N} 个样本，n = 0 … ${d13.N - 1}`,
      color: BLUE,
      fill: '#eef6fd',
      why: '再限制频率',
    },
    {
      name: '第 2 次收口 · 频率',
      desc: [`只计算 ${d13.N} 个格子`, `k = 0 … ${d13.N - 1}`],
      mdesc: `只计算 ${d13.N} 个格子，k = 0 … ${d13.N - 1}`,
      color: WARM,
      fill: '#fff3ee',
    },
  ],
  `${d13.N} 个样本 ↔ ${d13.N} 个复数系数：两边都有限，而且可以完整往返`,
  '连续傅里叶公式经过有限时间和有限频率两次限制后变成离散傅里叶变换');

function stems(pn, vals, colors, M, baseline = 0) {
  let s = '';
  vals.forEach((v, i) => {
    const c = Array.isArray(colors) ? colors[i] : colors;
    s += L(pn.sx(i), pn.sy(baseline), pn.sx(i), pn.sy(v), { c, w: 1.8 });
    s += O(pn.sx(i), pn.sy(v), wide(M) ? 4 : 4.5, { fill: c });
  });
  return s;
}

function indexLabels(pn, values, M, yOffset = 18) {
  let s = '';
  values.forEach((v, i) => {
    s += T(pn.sx(i), pn.y + pn.h + yOffset, String(v), {
      size: tiny(M), fill: MUTED, anchor: 'middle',
    });
  });
  return s;
}

// 实验主图：8 个样本 -> 8 个系数 -> 8 个样本，三份数据都来自 lesson13。
FIG['13-roundtrip'] = (M) => {
  const head = ['手写一次 8 点 DFT，', '再把 8 个样本完整拼回来'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const gap = w ? 24 : 44;
  const cw = w ? (pw - gap) / 2 : pw;
  const ph = w ? 150 : 138;
  let s = header(M, head);
  let y = top + 24;

  const p1 = panel(px, y, cw, ph, {
    xr: [0, d13.N - 1], yr: [-1.35, 1.35], zero: true,
    title: '输入：8 个时间样本 x[n]', tsize: M.small, tfill: BLUE,
  });
  s += p1.s + stems(p1, d13.x, BLUE, M) + indexLabels(p1, d13.n, M);
  s += T(px + cw, y + ph + 34, '样本编号 n', {
    size: tiny(M), fill: MUTED, anchor: 'end',
  });

  const x2 = w ? px + cw + gap : px;
  const y2 = w ? y : y + ph + 62;
  const p2 = panel(x2, y2, cw, ph, {
    xr: [0, d13.N - 1], yr: [0, 4.5],
    title: '输出：8 个复数系数的幅度 |X[k]|', tsize: M.small, tfill: WARM,
  });
  s += p2.s + stems(p2, d13.X_mag, WARM, M) + indexLabels(p2, d13.n, M);
  s += T(x2 + cw, y2 + ph + 34, '频率格编号 k', {
    size: tiny(M), fill: MUTED, anchor: 'end',
  });
  y = (w ? y + ph : y2 + ph) + 58;

  const p3 = panel(px, y, pw, w ? 102 : 116, {
    xr: [0, d13.N - 1], yr: [-1.35, 1.35], zero: true,
    title: '逆变换：浅蓝线是原样本，绿圈是重建结果', tsize: M.small, tfill: GREEN,
  });
  s += p3.s + curve(p3, d13.x, { c: '#a9cce3', w: 3, xr: [0, d13.N - 1] });
  d13.reconstructed.forEach((v, i) => {
    s += O(p3.sx(i), p3.sy(v), 5, { fill: '#fff', stroke: GREEN, sw: 2 });
  });
  y += p3.h + 22;

  s += R(px, y, pw, 54, { fill: '#edf8f3', stroke: GREEN, sw: 1.5, r: 8 });
  s += T(px + 14, y + 22, '逆变换逐点最大误差', { size: M.small, fill: MUTED });
  s += T(px + 14, y + 44, d13.reconstruction_error.toExponential(3), {
    size: 18, weight: 700, fill: GREEN,
  });
  s += T(px + pw - 14, y + 38, '只有浮点尾数，8 个绿圈都压在蓝线上', {
    size: tiny(M), fill: GREEN, anchor: 'end',
  });
  y += 70;
  return doc(M.W, y, s, '八个时间样本经过手写 DFT 得到八个复数系数，再由逆变换完整重建');
};

// PPT p33—37：真实信号的 DFT 后半与前半共轭镜像，N/2 是奈奎斯特位置。
FIG['13-redundancy'] = (M) => {
  const head = ['8 个格子为什么看起来成双？', '真实信号的后一半是镜像'];
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const ph = wide(M) ? 180 : 166;
  let s = header(M, head);
  let y = top + 26;
  const colors = d13.n.map((k) => (k === d13.N / 2 ? GOLD : (k < d13.N / 2 ? BLUE : WARM)));
  const p = panel(px, y, pw, ph, {
    xr: [0, d13.N - 1], yr: [0, 4.5],
    title: '同一份 8 点 DFT 的幅度谱线', tsize: M.small, tfill: INK,
  });
  s += p.s + stems(p, d13.X_mag, colors, M) + indexLabels(p, d13.n, M);
  s += L(p.sx(d13.N / 2), y - 2, p.sx(d13.N / 2), y + ph + 6,
    { c: GOLD, w: 2, dash: '5 4' });
  s += T(p.sx(d13.N / 2), y + 20, `k=${d13.N / 2} · ${d13.sr / 2} Hz`, {
    size: tiny(M), weight: 700, fill: GOLD, anchor: 'middle',
  });
  y += ph + 44;

  const pairs = [[1, 7], [2, 6], [3, 5]];
  const rowH = wide(M) ? 34 : 46;
  pairs.forEach((pair, i) => {
    const by = y + i * (rowH + 8);
    s += R(px, by, pw, rowH, { fill: PLATE, stroke: GRID, r: 6 });
    s += T(px + 12, by + (wide(M) ? 23 : 19), `k=${pair[0]}`, {
      size: M.small, weight: 700, fill: BLUE,
    });
    s += T(px + pw / 2, by + (wide(M) ? 23 : 19), '互为共轭镜像  ↔', {
      size: tiny(M), fill: MUTED, anchor: 'middle',
    });
    s += T(px + pw - 12, by + (wide(M) ? 23 : 19), `k=${pair[1]}`, {
      size: M.small, weight: 700, fill: WARM, anchor: 'end',
    });
    if (!wide(M)) {
      s += T(px + pw / 2, by + 38, `对应 ${d13.signed_hz[pair[0]] > 0 ? '+' : ''}${d13.signed_hz[pair[0]]} Hz 与 ${d13.signed_hz[pair[1]]} Hz`, {
        size: tiny(M), fill: MUTED, anchor: 'middle',
      });
    }
  });
  y += pairs.length * (rowH + 8) + 8;
  s += MT(px, y, wide(M)
    ? ['蓝色的正频率和橙色的负频率成对出现：X[N-k] 是 X[k] 的共轭。',
      '因此真实录音只保留从 0 到奈奎斯特频率这一半，也能恢复另一半；这不是删除新信息。']
    : ['蓝色正频率和橙色负频率成对出现。',
      '真实录音只保留 0 到奈奎斯特这一半，也能恢复',
      '另一半；这是去掉重复，不是删除新信息。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (wide(M) ? 2 : 3) * 21 + 10;
  return doc(M.W, y, s, '真实信号的离散傅里叶变换在奈奎斯特位置两侧成共轭镜像');
};

// PPT p38：直接 DFT 的 N² 增长与 FFT 的加速。两条曲线分开用自己的纵轴，
// 避免 FFT 被几百倍更大的直接 DFT 压成一条看不见的平线。
FIG['13-dft-vs-fft'] = (M) => {
  const head = ['样本数每翻一倍，', '直接 DFT 和 FFT 的耗时怎样长'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const gap = w ? 26 : 50;
  const cw = w ? (pw - gap) / 2 : pw;
  const ph = w ? 150 : 142;
  let s = header(M, head);
  let y = top + 26;

  const directMax = Math.max(...d13.direct_ms) * 1.12;
  const p1 = panel(px, y, cw, ph, {
    xr: [0, d13.sizes.length - 1], yr: [0, directMax],
    title: '直接 DFT（毫秒）', tsize: M.small, tfill: WARM,
  });
  s += p1.s + curve(p1, d13.direct_ms, { c: WARM, w: 2.2 });
  d13.direct_ms.forEach((v, i) => {
    s += O(p1.sx(i), p1.sy(v), 4, { fill: WARM });
    s += T(p1.sx(i), p1.sy(v) - 8, v.toFixed(2), {
      size: tiny(M), fill: WARM, anchor: 'middle',
    });
  });
  s += indexLabels(p1, d13.sizes, M);

  const x2 = w ? px + cw + gap : px;
  const y2 = w ? y : y + ph + 58;
  const fftMax = Math.max(...d13.fft_ms) * 1.12;
  const p2 = panel(x2, y2, cw, ph, {
    xr: [0, d13.sizes.length - 1], yr: [0, fftMax],
    title: 'NumPy FFT（毫秒）', tsize: M.small, tfill: GREEN,
  });
  s += p2.s + curve(p2, d13.fft_ms, { c: GREEN, w: 2.2 });
  d13.fft_ms.forEach((v, i) => {
    s += O(p2.sx(i), p2.sy(v), 4, { fill: GREEN });
    s += T(p2.sx(i), p2.sy(v) - 8, v.toFixed(4), {
      size: tiny(M), fill: GREEN, anchor: 'middle',
    });
  });
  s += indexLabels(p2, d13.sizes, M);
  y = (w ? y + ph : y2 + ph) + 52;

  const ratio = d13.direct_ms.at(-1) / d13.fft_ms.at(-1);
  s += R(px, y, pw, 58, { fill: '#edf8f3', stroke: GREEN, sw: 1.5, r: 8 });
  s += T(px + 14, y + 23, `N=${d13.sizes.at(-1)} 的本机实测`, { size: M.small, fill: MUTED });
  s += T(px + 14, y + 47, `FFT 快约 ${ratio.toFixed(0)} 倍`, {
    size: 19, weight: 700, fill: GREEN,
  });
  s += T(px + pw - 14, y + 39, '两张图纵轴不同；比较增长形状，不比较线高', {
    size: tiny(M), fill: MUTED, anchor: 'end',
  });
  y += 76;
  s += MT(px, y, w
    ? ['直接照定义计算要做约 N² 次组合；FFT 利用不同频率之间重复出现的结构，',
      '把增长压到约 N log₂N。具体毫秒数随机器变化，趋势不会因此反过来。']
    : ['直接计算约按 N² 增长；FFT 利用重复结构，',
      '把增长压到约 N log₂N。毫秒数会随机器变化，',
      '这里看的是增长趋势。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 10;
  return doc(M.W, y, s, '直接离散傅里叶变换和快速傅里叶变换随样本数增长的实测耗时曲线');
};

// ================================================================ 14

// Notebook cell 1—14：四段声音按固定顺序经过载入、FFT、取模和低频截取。
FIG['14-source-pipeline'] = (M) => chain(M,
  ['四段声音交给程序后，', '依次经过这四步'],
  [
    {
      name: '四段声音',
      desc: ['小提琴、钢琴', '萨克斯、噪声'],
      mdesc: '小提琴、钢琴、萨克斯、噪声',
      color: BLUE,
      fill: '#eef6fd',
      why: '读成数组',
    },
    {
      name: 'FFT',
      desc: ['每段 N 个样本', '得到 N 个复数'],
      mdesc: 'N 个样本得到 N 个复数',
      color: WARM,
      fill: '#fff3ee',
      why: '只看强度',
    },
    {
      name: '取绝对值',
      desc: ['np.abs(X)', '复数变成幅度'],
      mdesc: 'np.abs(X)：复数变成幅度',
      color: GREEN,
      fill: '#edf8f3',
      why: '放大低频',
    },
    {
      name: '只画前 10%',
      desc: ['f_ratio = 0.1', `约 0—${d14.visible_max_hz.toFixed(0)} Hz`],
      mdesc: `f_ratio = 0.1：约 0—${d14.visible_max_hz.toFixed(0)} Hz`,
      color: GOLD,
      fill: '#fff8e8',
    },
  ],
  'f_ratio 只改显示范围，高频仍然算过',
  '四段声音依次经过读取、快速傅里叶变换、取绝对值和低频范围显示');

// Notebook cell 8—10，加上第 13 课已经证明过的真实信号镜像关系。
FIG['14-length-and-axis'] = (M) => chain(M,
  ['一段小提琴录音，', '三个数组长度怎样对应'],
  [
    {
      name: '时间样本',
      desc: [`N = ${d14.violin_samples}`, '22050 Hz 单声道'],
      mdesc: `N = ${d14.violin_samples}，22050 Hz 单声道`,
      color: BLUE,
      fill: '#eef6fd',
      why: '完整 FFT',
    },
    {
      name: '正负频率都保留',
      desc: [`${d14.violin_full_fft} 个系数`, 'len(fft) = N'],
      mdesc: `${d14.violin_full_fft} 个系数，len(fft) = N`,
      color: WARM,
      fill: '#fff3ee',
      why: '去掉镜像',
    },
    {
      name: '只留非负频率',
      desc: [`${d14.violin_rfft} 个系数`, 'rfft 与 rfftfreq 配对'],
      mdesc: `${d14.violin_rfft} 个系数；频率轴逐项配对`,
      color: GREEN,
      fill: '#edf8f3',
    },
  ],
  `最高 ${d14.target_sr / 2} Hz；本课看 0—${d14.visible_max_hz.toFixed(0)} Hz`,
  '真实录音的完整 FFT 与单边 FFT 数组长度和频率范围对应关系');

function spectrumPanel(x, y, w, h, sound, color, M) {
  const left = 38;
  const bottom = 24;
  const top = 44;
  const chart = panel(x + left, y + top, w - left - 8, h - top - bottom, {
    xr: [0, d14.visible_max_hz], yr: [d14.plot_floor_db, 0],
    fill: '#fff', stroke: GRID,
  });
  let s = R(x, y, w, h, { fill: PLATE, stroke: GRID, r: 8 });
  s += T(x + 10, y + 18, `${sound.label} · 最高峰 ${sound.peak_hz.toFixed(2)} Hz`, {
    size: tiny(M), weight: 700, fill: color,
  });
  s += T(x + 8, y + 40, '相对 dB', { size: tiny(M), fill: MUTED });
  s += chart.s;
  const yTicks = [-60, -30, 0];
  yTicks.forEach((v) => {
    const py = chart.sy(v);
    s += L(chart.x, py, chart.x + chart.w, py, { c: GRID, w: 0.8, dash: '3 3' });
    s += T(chart.x - 5, py + 4, String(v), {
      size: tiny(M), fill: MUTED, anchor: 'end',
    });
  });
  const xTicks = wide(M) ? [0, 500, 1000, 1500, 2000] : [0, 1000, 2000];
  xTicks.forEach((v) => {
    const px = chart.sx(v);
    s += L(px, chart.y, px, chart.y + chart.h, { c: GRID, w: 0.7, dash: '3 3' });
    s += T(px, chart.y + chart.h + 17, v === 0 ? '0' : `${v / 1000}k`, {
      size: tiny(M), fill: MUTED, anchor: 'middle',
    });
  });
  s += curve(chart, sound.plot_db, {
    c: color, w: wide(M) ? 1.35 : 1.5, xr: [0, d14.visible_max_hz],
  });
  s += T(chart.x + chart.w, chart.y + chart.h + 17, 'Hz', {
    size: tiny(M), fill: MUTED, anchor: 'end',
  });
  return s;
}

// Notebook cell 11—14：四段真实声音按原顺序比较。每张都把自身可见范围最高峰
// 设成 0 dB，所以颜色只区分声音实体，线高不能用来比较录音响度。
FIG['14-four-spectra'] = (M) => {
  const head = ['同样只看 0—2205 Hz，', '四段声音的轮廓并不一样'];
  const top = headerH(M, head);
  const w = wide(M);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const gapX = 18;
  const gapY = 24;
  const cw = w ? (pw - gapX) / 2 : pw;
  const ch = w ? 182 : 176;
  const colors = [BLUE, WARM, GREEN, GOLD];
  let s = header(M, head);
  let y = top + 20;

  d14.sounds.forEach((sound, i) => {
    const col = w ? i % 2 : 0;
    const row = w ? Math.floor(i / 2) : i;
    const bx = px + col * (cw + gapX);
    const by = y + row * (ch + gapY);
    s += spectrumPanel(bx, by, cw, ch, sound, colors[i], M);
  });
  y += (w ? 2 : 4) * ch + (w ? 1 : 3) * gapY + 22;
  s += MT(px, y, w
    ? ['三件乐器都有一串窄而突出的峰，噪声则在大段频率范围里持续起伏。',
      '每张图各自以最高峰为 0 dB：这里比较的是轮廓，不是四段录音谁更响。']
    : ['三件乐器都有一串窄峰；噪声在大段频率里起伏。',
      '每张图各自以最高峰为 0 dB，只比较轮廓，',
      '不能据此判断四段录音谁更响。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += (w ? 2 : 3) * 21 + 10;
  return doc(M.W, y, s, '小提琴钢琴萨克斯和噪声在零到二千二百零五赫兹内的真实幅度谱轮廓');
};

// ================================================================ 15

function simpleWave(x, y, w, h, values, color, M) {
  const pn = panel(x, y, w, h, { yr: [-1.1, 1.1], zero: true, fill: '#fff' });
  return pn.s + curve(pn, values, { c: color, w: wide(M) ? 1.2 : 1.45 });
}

function orderCard(x, y, w, left, right, color, M) {
  const mid = x + w / 2;
  let s = R(x, y, w, 58, { fill: PLATE, stroke: GRID, r: 8 });
  s += T(x + 14, y + 22, `${left} Hz`, { size: M.small, weight: 700, fill: color });
  s += ARROW(mid - 38, y + 30, mid + 38, y + 30, { c: MUTED, w: 1.8, head: 6 });
  s += T(x + w - 14, y + 22, `${right} Hz`, {
    size: M.small, weight: 700, fill: color, anchor: 'end',
  });
  s += T(x + w / 2, y + 50, '逐帧最强频率', {
    size: tiny(M), fill: MUTED, anchor: 'middle',
  });
  return s;
}

FIG['15-what-when'] = (M) => {
  const head = ['整段频谱只知道“有什么”，', '逐帧结果才知道“先后顺序”'];
  const top = headerH(M, head);
  const wmode = wide(M);
  const px = M.pad;
  const pw = M.W - 2 * M.pad;
  const gap = wmode ? 20 : 18;
  const cw = wmode ? (pw - gap) / 2 : pw;
  const wh = 92;
  let y = top + 24;
  let s = header(M, head);

  const addWave = (x, yy, vals, title, left, right, color) => {
    let z = T(x, yy, title, { size: M.small, weight: 700, fill: color });
    z += simpleWave(x, yy + 12, cw, wh, vals, color, M);
    z += L(x + cw / 2, yy + 12, x + cw / 2, yy + 12 + wh, { c: GRID, dash: '4 4' });
    // 这两个标签原来直接压在波形上，而且和波形同色——密到这个程度的波形上，
    // 同色的字基本读不出来。先垫一块白底片再写字。
    const chip = (cx, text) => {
      const bw = text.length * tiny(M) * 0.62 + 14;
      return R(cx - bw / 2, yy + 12 + 8, bw, tiny(M) + 9,
        { fill: '#fff', stroke: color, sw: 1, r: 5 })
        + T(cx, yy + 12 + 8 + tiny(M) + 1, text,
          { size: tiny(M), weight: 700, fill: color, anchor: 'middle' });
    };
    z += chip(x + cw * 0.25, `${left} Hz`);
    z += chip(x + cw * 0.75, `${right} Hz`);
    return z;
  };

  s += addWave(px, y, d15.order.wave_first, '声音 A', 300, 900, BLUE);
  if (wmode) {
    s += addWave(px + cw + gap, y, d15.order.wave_second, '声音 B', 900, 300, WARM);
    y += wh + 48;
  } else {
    y += wh + 48;
    s += addWave(px, y, d15.order.wave_second, '声音 B', 900, 300, WARM);
    y += wh + 48;
  }

  s += T(px, y, '两段声音的整段幅度谱（纵轴：相对 dB）', { size: M.small, weight: 700 });
  const sp = panel(px + 42, y + 12, pw - 50, 130, {
    xr: [0, 1200], yr: [-60, 0], fill: '#fff', stroke: GRID,
  });
  s += sp.s;
  [-60, -30, 0].forEach((v) => {
    s += L(sp.x, sp.sy(v), sp.x + sp.w, sp.sy(v), { c: GRID, dash: '3 3', w: 0.8 });
    s += T(sp.x - 7, sp.sy(v) + 4, String(v), { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  [0, 300, 600, 900, 1200].forEach((v) => {
    s += L(sp.sx(v), sp.y, sp.sx(v), sp.y + sp.h, { c: GRID, dash: '3 3', w: 0.8 });
    const last = v === 1200;
    s += T(sp.sx(v), sp.y + sp.h + 18, last ? '1200 Hz' : String(v),
      { size: tiny(M), fill: MUTED, anchor: last ? 'end' : 'middle' });
  });
  s += curve(sp, d15.order.plot_db, {
    c: GREEN, w: 2, xr: [d15.order.plot_freqs[0], d15.order.plot_freqs.at(-1)],
  });
  s += T(sp.x + sp.w - 8, sp.y + 20, `最大差 ${d15.order.global_difference.toExponential(3)}`, {
    size: tiny(M), weight: 700, fill: GREEN, anchor: 'end',
  });
  y += 174;

  s += orderCard(px, y, cw, 300, 900, BLUE, M);
  s += wmode
    ? orderCard(px + cw + gap, y, cw, 900, 300, WARM, M)
    : orderCard(px, y + 74, cw, 900, 300, WARM, M);
  y += wmode ? 80 : 154;
  s += T(px, y, '相同的整段频率成分，不代表相同的时间顺序。', {
    size: M.body, weight: 700, fill: WARM,
  });
  return doc(M.W, y + 24, s, '两段频率顺序相反的声音拥有几乎相同的整段幅度谱但逐帧结果相反');
};

function processCard(x, y, w, h, index, title, M, draw) {
  let s = R(x, y, w, h, { fill: PLATE, stroke: GRID, r: 9 });
  s += O(x + 21, y + 22, 13, { fill: BLUE });
  s += T(x + 21, y + 27, index, { size: M.small, weight: 700, fill: '#fff', anchor: 'middle' });
  s += T(x + 42, y + 27, title, { size: M.small, weight: 700 });
  s += draw(x + 12, y + 46, w - 24, h - 58);
  return s;
}

FIG['15-stft-process'] = (M) => {
  const head = ['一扇短窗不断右移，', '每个位置产生一列频率结果'];
  const top = headerH(M, head);
  const wmode = wide(M);
  const px = M.pad;
  const pw = M.W - 2 * M.pad;
  const gap = wmode ? 18 : 16;
  const cw = wmode ? (pw - 3 * gap) / 4 : pw;
  const ch = wmode ? 170 : 150;
  let s = header(M, head);
  let y = top + 18;

  const cards = [
    ['取一帧', (x, yy, ww, hh) => {
      let z = simpleWave(x, yy + 10, ww, hh - 24, d15.order.wave_first.slice(0, 90), BLUE, M);
      z += R(x + ww * 0.08, yy + 4, ww * 0.62, hh - 12, { fill: 'none', stroke: BLUE, sw: 2, r: 4 });
      z += T(x + ww / 2, yy + hh, `N = ${d15.order.frame_length}`, {
        size: tiny(M), fill: MUTED, anchor: 'middle',
      });
      return z;
    }],
    ['乘 Hann 窗', (x, yy, ww, hh) => {
      const pn = panel(x, yy + 8, ww, hh - 20, { yr: [0, 1.05], fill: '#fff' });
      return pn.s + curve(pn, d15.parameters.hann, { c: GREEN, w: 2 })
        + T(x + ww / 2, yy + hh, '两端低，中间高', { size: tiny(M), fill: MUTED, anchor: 'middle' });
    }],
    ['计算 FFT', (x, yy, ww, hh) => {
      const pn = panel(x, yy + 8, ww, hh - 20, { yr: [-60, 0], fill: '#fff' });
      return pn.s + curve(pn, d15.order.plot_db, { c: WARM, w: 1.8 })
        + T(x + ww / 2, yy + hh, '得到一列频率', { size: tiny(M), fill: MUTED, anchor: 'middle' });
    }],
    ['按时间排成矩阵', (x, yy, ww, hh) => {
      let z = '';
      const rows = 7;
      const cols = 9;
      const cellW = ww / cols;
      const cellH = (hh - 18) / rows;
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const strong = r === (rows - 2 - Math.round((c / (cols - 1)) * 3));
          z += R(x + c * cellW, yy + r * cellH + 4, cellW + 0.3, cellH + 0.3, {
            fill: strong ? GOLD : '#e7eef4', stroke: '#fff', sw: 0.5, r: 0,
          });
        }
      }
      z += T(x + ww / 2, yy + hh, '横向就是先后顺序', { size: tiny(M), fill: MUTED, anchor: 'middle' });
      return z;
    }],
  ];

  cards.forEach(([title, draw], i) => {
    const bx = wmode ? px + i * (cw + gap) : px;
    const by = wmode ? y : y + i * (ch + gap + 18);
    s += processCard(bx, by, cw, ch, String(i + 1), title, M, draw);
    if (i < cards.length - 1) {
      s += wmode
        ? ARROW(bx + cw + 3, by + ch / 2, bx + cw + gap - 3, by + ch / 2, { c: MUTED, head: 6 })
        : ARROW(px + pw / 2, by + ch + 4, px + pw / 2, by + ch + gap + 12, { c: MUTED, head: 6 });
    }
  });
  y += wmode ? ch + 30 : cards.length * ch + (cards.length - 1) * (gap + 18) + 28;
  s += MT(px, y, wmode
    ? [`帧移 H = ${d15.order.hop_length}，小于帧长 N = ${d15.order.frame_length}，所以相邻帧有一半重叠。`,
      '窗、帧和 FFT 使用同一个长度；每向右移动一次，矩阵就多一列。']
    : [`帧移 H = ${d15.order.hop_length}，帧长 N = ${d15.order.frame_length}，`,
      '相邻帧有一半重叠。窗、帧和 FFT 等长；',
      '每向右移动一次，矩阵就多一列。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += wmode ? 55 : 76;
  return doc(M.W, y, s, '短时傅里叶变换依次取帧乘窗计算快速傅里叶变换并按时间排列成矩阵');
};

FIG['15-output-shape'] = (M) => {
  const head = ['10000 个样本，', '为什么得到 501 行 × 19 列'];
  const top = headerH(M, head);
  const wmode = wide(M);
  const px = M.pad;
  const pw = M.W - 2 * M.pad;
  let s = header(M, head);
  let y = top + 24;

  s += T(px, y, '先数时间窗口', { size: M.h2, weight: 700, fill: BLUE });
  y += 18;
  const tx = px + 14;
  const tw = pw - 28;
  const ty = y + 22;
  s += L(tx, ty + 30, tx + tw, ty + 30, { c: INK, w: 2 });
  for (let i = 0; i < d15.shape.frames; i += 1) {
    const bx = tx + (i * d15.shape.hop_length / d15.shape.samples) * tw;
    const bw = (d15.shape.frame_length / d15.shape.samples) * tw;
    s += R(bx, ty + (i % 2) * 8, bw, 28, {
      fill: i % 2 ? '#eef6fd' : '#e4f2ec', stroke: i % 2 ? BLUE : GREEN, sw: 0.8, r: 2,
    });
  }
  s += T(tx, ty + 72, '0', { size: tiny(M), fill: MUTED });
  s += T(tx + tw / 2, ty + 72, '5000', { size: tiny(M), fill: MUTED, anchor: 'middle' });
  s += T(tx + tw, ty + 72, '10000 样本', { size: tiny(M), fill: MUTED, anchor: 'end' });
  y += 112;
  s += T(px, y, `⌊(10000 − 1000) / 500⌋ + 1 = ${d15.shape.frames} 列`, {
    size: M.body, weight: 700, fill: BLUE,
  });
  y += 38;

  const leftW = wmode ? pw * 0.58 : pw;
  const mh = wmode ? 190 : 176;
  s += T(px, y, '再数每列的频率格', { size: M.h2, weight: 700, fill: GREEN });
  const mx = px;
  const my = y + 20;
  const mw = leftW;
  const rows = 9;
  const cols = d15.shape.frames;
  const cellW = mw / cols;
  const cellH = mh / rows;
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const fill = (r + c) % 7 === 0 ? '#94c5aa' : '#e8f1ed';
      s += R(mx + c * cellW, my + r * cellH, cellW + 0.2, cellH + 0.2, {
        fill, stroke: '#fff', sw: 0.45, r: 0,
      });
    }
  }
  s += T(mx + mw / 2, my + mh + 20, `${d15.shape.frames} 列时间`, {
    size: M.small, weight: 700, fill: BLUE, anchor: 'middle',
  });
  // 这一行原来画在 mx - 8，而 mx 就是左边距本身，于是「频率」两个字被画板左沿
  // 切掉一半。矩阵左边没有留白可用，就把它移到标题那一行的右端。
  s += T(mx + mw, y, `${d15.shape.frequency_bins} 行频率`, {
    size: M.small, weight: 700, fill: GREEN, anchor: 'end',
  });

  const rx = wmode ? px + leftW + 34 : px;
  const ry = wmode ? my + 24 : my + mh + 58;
  const rw = wmode ? pw - leftW - 34 : pw;
  s += R(rx, ry, rw, 122, { fill: '#fff7ed', stroke: GOLD, sw: 1.4, r: 10 });
  s += T(rx + rw / 2, ry + 32, '每帧 1000 点实数', {
    size: M.small, weight: 700, fill: MUTED, anchor: 'middle',
  });
  s += T(rx + rw / 2, ry + 62, `1000 / 2 + 1 = ${d15.shape.frequency_bins}`, {
    size: M.body, weight: 700, fill: GREEN, anchor: 'middle',
  });
  s += T(rx + rw / 2, ry + 100, `输出形状 (${d15.shape.frequency_bins}, ${d15.shape.frames})`, {
    size: M.h2, weight: 700, fill: WARM, anchor: 'middle',
  });
  y = wmode ? my + mh + 48 : ry + 148;
  s += T(px, y, `手写实现与库函数的复数最大差：${d15.shape.difference.toExponential(3)}`, {
    size: M.small, fill: MUTED,
  });
  return doc(M.W, y + 26, s, '一万样本按一千点帧长和五百点帧移得到五百零一行十九列短时傅里叶变换矩阵');
};

async function heatmapPanel(x, y, w, h, row, title, M) {
  const left = 42;
  const right = 10;
  const top = 34;
  const bottom = 31;
  const cw = w - left - right;
  const ch = h - top - bottom;
  const uri = await spectrogramPng(row.plot, {
    w: Math.round(cw * 2.2), h: Math.round(ch * 2.2),
    fmax: d15.tradeoff.fmax, dbFloor: -55, cmap: 'magma',
  });
  let s = R(x, y, w, h, { fill: PLATE, stroke: GRID, r: 8 });
  s += T(x + 10, y + 20, `${title}：${row.window_ms.toFixed(0)} ms 窗，${row.bin_hz.toFixed(2)} Hz/格`, {
    size: tiny(M), weight: 700,
  });
  s += image(uri, x + left, y + top, cw, ch);
  s += R(x + left, y + top, cw, ch, { fill: 'none', stroke: GRID, sw: 1, r: 0 });
  [0, 1250, 2500].forEach((v) => {
    const py = y + top + ch - (v / d15.tradeoff.fmax) * ch;
    s += T(x + left - 6, py + 4, String(v), { size: tiny(M), fill: MUTED, anchor: 'end' });
  });
  // 末尾那个刻度和单位「秒」原来都画在画板右边缘：一个 anchor middle、一个
  // anchor end，两串字直接叠在一起，读出来是「秒50」。把单位并进末尾刻度即可。
  [[0, '0', 'start'], [0.75, '0.75', 'middle'], [1.5, '1.50 秒', 'end']].forEach((t) => {
    const qx = x + left + (t[0] / d15.tradeoff.seconds) * cw;
    s += T(qx, y + top + ch + 19, t[1], { size: tiny(M), fill: MUTED, anchor: t[2] });
  });
  const clickX = x + left + (0.75 / d15.tradeoff.seconds) * cw;
  s += L(clickX, y + top, clickX, y + top + ch, { c: '#fff', w: 1.2, dash: '4 4' });
  s += T(clickX + 5, y + top + 17, '敲击', { size: tiny(M), weight: 700, fill: '#fff' });
  s += T(x + left, y + top - 6, 'Hz', { size: tiny(M), fill: MUTED });
  return s;
}

FIG['15-tradeoff'] = async (M) => {
  const head = ['同一段声音里，', '短窗看准时间，长窗分细频率'];
  const top = headerH(M, head);
  const wmode = wide(M);
  const px = M.pad;
  const pw = M.W - 2 * M.pad;
  const gap = wmode ? 20 : 18;
  const cw = wmode ? (pw - gap) / 2 : pw;
  const ch = wmode ? 272 : 260;
  let y = top + 20;
  let s = header(M, head);
  s += await heatmapPanel(px, y, cw, ch, d15.tradeoff.outputs[0], '短窗', M);
  if (wmode) {
    s += await heatmapPanel(px + cw + gap, y, cw, ch, d15.tradeoff.outputs[1], '长窗', M);
    y += ch + 28;
  } else {
    y += ch + gap;
    s += await heatmapPanel(px, y, cw, ch, d15.tradeoff.outputs[1], '长窗', M);
    y += ch + 26;
  }
  s += colorbar(px + 36, y, wmode ? 150 : 130, 12, 'magma', {
    lo: '弱', hi: '强', size: tiny(M),
  });
  s += MT(px, y + 38, wmode
    ? ['0.75 秒的敲击在短窗图里更窄；持续上升的频率轨迹在长窗图里更细。',
      '改变帧移能让时间取点更密，却不能同时消除这两种模糊。']
    : ['0.75 秒的敲击在短窗图里更窄；',
      '持续上升的频率轨迹在长窗图里更细。',
      '帧移变小只会让取点更密，不能同时消除两种模糊。'],
  { size: M.small, fill: MUTED, leading: 21 });
  y += wmode ? 88 : 106;
  return doc(M.W, y, s, '同一段上升音和敲击在短窗与长窗功率声谱图中的时间频率分辨率取舍');
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
