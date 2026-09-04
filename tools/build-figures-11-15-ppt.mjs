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
