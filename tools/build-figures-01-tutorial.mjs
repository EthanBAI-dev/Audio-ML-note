#!/usr/bin/env node
// 第 01 课教程式版新增的两张图，同时出电脑版和手机版。
//
//   python tools/measure-01.py        # 先算数据
//   node tools/build-figures-01-tutorial.mjs
//
// 01-knock-evidence：整段频谱找不出那声敲击，声谱图一眼就看得见。
//   数据来自 tools/data/01-knock.json，由 measure-01.py 用和正文完全相同的
//   代码算出，所以图上的 0.17% 和 11.4 倍与正文永远一致。
// 01-before-after：清单式做法和倒推式做法的流程对比，替换掉原来的 ASCII 块。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_01-05', 'figures');
const DATA = JSON.parse(readFileSync(join(ROOT, 'tools', 'data', '01-knock.json'), 'utf8'));

const BLUE = '#0878b9';
const WARM = '#c65a3d';
const GREEN = '#3b8f68';
const INK = '#1f2933';
const MUTED = '#5b6673';
const GRID = '#d7dfe6';
const PLATE = '#f5f8fa';
const PALE = '#edf6fc';
const FONT = 'Microsoft YaHei, PingFang SC, Noto Sans SC, Hiragino Sans GB, sans-serif';

const MODES = {
  desktop: { name: 'desktop', W: 880, pad: 30, h1: 22, h2: 17, body: 15, small: 14 },
  mobile: { name: 'mobile', W: 420, pad: 20, h1: 18, h2: 16, body: 14.5, small: 14 },
};
const wide = (M) => M.name === 'desktop';
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const doc = (w, h, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" `
  + `font-family="${FONT}" fill="${INK}" role="img" aria-label="${esc(label)}">\n`
  + `<rect width="${w}" height="${h}" fill="#fff"/>\n${body}\n</svg>\n`;

const T = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 15}" font-weight="${o.weight ?? 400}" `
  + `fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? 'start'}">${esc(s)}</text>`;

const MT = (x, y, lines, o = {}) => {
  const lead = o.leading ?? Math.round((o.size ?? 15) * 1.5);
  return `<text x="${x}" y="${y}" font-size="${o.size ?? 15}" font-weight="${o.weight ?? 400}" `
    + `fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? 'start'}">`
    + lines.map((l, i) => `<tspan x="${x}" dy="${i ? lead : 0}">${esc(l)}</tspan>`).join('')
    + '</text>';
};

const R = (x, y, w, h, o = {}) =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `
  + `rx="${o.r ?? 8}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? GRID}" stroke-width="${o.sw ?? 1}"/>`;

const L = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" `
  + `stroke="${o.c ?? GRID}" stroke-width="${o.w ?? 1.4}"`
  + `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;

const P = (pts, o = {}) =>
  `<polyline points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" `
  + `fill="none" stroke="${o.c ?? BLUE}" stroke-width="${o.w ?? 1.8}" stroke-linejoin="round"/>`;

function ARROW(x1, y1, x2, y2, o = {}) {
  const c = o.c ?? MUTED; const hd = o.head ?? 7;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p = [[x2, y2],
    [x2 - hd * Math.cos(a - 0.5), y2 - hd * Math.sin(a - 0.5)],
    [x2 - hd * Math.cos(a + 0.5), y2 - hd * Math.sin(a + 0.5)]];
  return L(x1, y1, x2, y2, { c, w: o.w ?? 1.8 })
    + `<polygon points="${p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ')}" fill="${c}"/>`;
}

const header = (M, lines) => (wide(M)
  ? T(M.pad, 36, lines.join(''), { size: M.h1, weight: 700 })
  : MT(M.pad, 30, lines, { size: M.h1, weight: 700, leading: 25 }));
const headerH = (M, lines) => (wide(M) ? 58 : 30 + (lines.length - 1) * 25 + 24);

// ---------------------------------------------------------------- 证据图

function knockEvidence(M) {
  const head = ['同一声敲击：整段频谱查不出来，', '声谱图一眼看见'];
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const w = wide(M);
  let s = header(M, head);

  const { spectrum: sp, columns: cl } = DATA;
  const ph = w ? 150 : 132;
  const panelW = w ? (pw - 26) / 2 : pw;

  // —— 左：整段频谱，两条线完全重合 ——
  const lx = px;
  const ly = top + (w ? 24 : 24);
  s += T(lx, ly - 6, '用整段频谱去读', { size: M.h2, weight: 700, fill: MUTED });
  s += R(lx, ly, panelW, ph, { fill: '#fff' });
  const sx = (i, n) => lx + 8 + (i / (n - 1)) * (panelW - 16);
  const sy = (v) => ly + ph - 10 - v * (ph - 26);
  s += P(sp.hum.map((v, i) => [sx(i, sp.hum.length), sy(v)]), { c: '#b9c6d1', w: w ? 3.4 : 3 });
  s += P(sp.mix.map((v, i) => [sx(i, sp.mix.length), sy(v)]), { c: BLUE, w: w ? 1.5 : 1.4 });
  s += T(lx + 10, ly + ph + (w ? 22 : 20), `0 – ${sp.fmax} Hz`, { size: M.small, fill: MUTED });
  s += T(lx + panelW - 10, ly + ph + (w ? 22 : 20), `最大只差 ${sp.diff_pct}%`,
    { size: M.small, weight: 700, fill: WARM, anchor: 'end' });

  // 图例：灰粗线是没敲击的，蓝细线是有敲击的，两条压在一起
  const lgy = ly + ph + (w ? 46 : 42);
  s += L(lx + 8, lgy - 4, lx + 34, lgy - 4, { c: '#b9c6d1', w: 3.4 });
  s += T(lx + 42, lgy, '没有敲击', { size: M.small, fill: MUTED });
  s += L(lx + 8, lgy + 20, lx + 34, lgy + 20, { c: BLUE, w: 1.5 });
  s += T(lx + 42, lgy + 24, '有敲击', { size: M.small, fill: BLUE });
  s += MT(lx + 8, lgy + (w ? 52 : 50),
    w ? ['两条线压在一起，看不出差别。', '程序也一样分不出来。']
      : ['两条线压在一起，看不出差别，', '程序也一样分不出来。'],
    { size: M.body, weight: 700, fill: WARM, leading: 21 });

  // —— 右：声谱图每一列的总能量 ——
  const rx = w ? px + panelW + 26 : px;
  const ry = w ? ly : lgy + (w ? 0 : 104);
  s += T(rx, ry - 6, '换成声谱图去读', { size: M.h2, weight: 700, fill: MUTED });
  s += R(rx, ry, panelW, ph, { fill: '#fff' });
  const n = cl.values.length;
  const cw = (panelW - 16) / n;
  cl.values.forEach((v, i) => {
    const hit = i === cl.knock_col;
    const ref = i === cl.ref_col;
    s += R(rx + 8 + i * cw, ry + ph - 10 - v * (ph - 26), Math.max(cw - 0.4, 0.7),
      v * (ph - 26), { fill: hit ? WARM : (ref ? GREEN : '#cfdae3'), stroke: 'none', r: 0 });
  });
  const hitX = rx + 8 + cl.knock_col * cw;
  s += ARROW(hitX, ry + 8, hitX, ry + ph - 10 - cl.values[cl.knock_col] * (ph - 26) - 5,
    { c: WARM, w: 2, head: 6 });
  s += T(hitX + 6, ry + 18, `${cl.ratio} 倍`, { size: M.body, weight: 700, fill: WARM });
  s += T(rx + 10, ry + ph + (w ? 22 : 20), `0 – ${cl.seconds} 秒`, { size: M.small, fill: MUTED });

  const rgy = ry + ph + (w ? 46 : 42);
  s += R(rx + 8, rgy - 13, 12, 12, { fill: GREEN, stroke: 'none', r: 2 });
  s += T(rx + 26, rgy, '敲击前 93 毫秒', { size: M.small, fill: MUTED });
  s += R(rx + 8, rgy + 7, 12, 12, { fill: WARM, stroke: 'none', r: 2 });
  s += T(rx + 26, rgy + 24, '敲击那一列', { size: M.small, fill: WARM });
  s += MT(rx + 8, rgy + (w ? 52 : 50),
    w ? ['一根尖峰立在那里，', '能直接指出它落在第几秒。']
      : ['一根尖峰立在那里，', '能直接指出它落在第几秒。'],
    { size: M.body, weight: 700, fill: GREEN, leading: 21 });

  const bottom = (w ? rgy : rgy) + (w ? 96 : 96);
  return doc(M.W, bottom, s,
    `同一声敲击在整段频谱里只让数值变 ${sp.diff_pct}%，在声谱图上却是相邻列的 ${cl.ratio} 倍`);
}

// ---------------------------------------------------------------- 对比图

function beforeAfter(M) {
  const head = ['选读取方式：', '随手挑，还是按任务倒推'];
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const w = wide(M);
  let s = header(M, head);

  const rows = [
    {
      tag: '随手挑', color: WARM, fill: '#fbf0ec',
      steps: ['录音', '随手选一种', '塞给程序', '不准', '换更大的程序'],
      end: '还是不准', endBad: true,
      note: '不知道是程序不行，还是材料里根本没线索',
    },
    {
      tag: '按任务倒推', color: GREEN, fill: '#eef7f2',
      steps: ['录音', '先问要哪条证据', '挑留住证据的读法'],
      end: '再谈程序', endBad: false,
      note: '效果不好时，知道该回头查哪一步',
    },
  ];

  let y = top + 6;
  const rowH = w ? 118 : 176;
  rows.forEach((r) => {
    s += R(px, y, pw, rowH, { fill: r.fill, stroke: r.color, sw: 1.6, r: 10 });
    s += T(px + 16, y + 26, r.tag, { size: M.h2, weight: 700, fill: r.color });

    const items = [...r.steps, r.end];
    if (w) {
      // 电脑版：一行横排，箭头相连
      const bw = (pw - 32 - (items.length - 1) * 22) / items.length;
      items.forEach((label, i) => {
        const bx = px + 16 + i * (bw + 22);
        const last = i === items.length - 1;
        s += R(bx, y + 40, bw, 34, {
          fill: '#fff', stroke: last ? r.color : GRID, sw: last ? 2 : 1, r: 6,
        });
        s += T(bx + bw / 2, y + 61, label,
          { size: M.small, weight: last ? 700 : 400, fill: last ? r.color : INK, anchor: 'middle' });
        if (!last) s += ARROW(bx + bw + 4, y + 57, bx + bw + 18, y + 57, { c: r.color });
      });
      s += T(px + 16, y + 98, r.note, { size: M.small, fill: MUTED });
    } else {
      // 手机版：竖排，箭头朝下
      const bh = 26;
      items.forEach((label, i) => {
        const by = y + 38 + i * (bh + 12);
        const last = i === items.length - 1;
        s += R(px + 16, by, pw - 32, bh, {
          fill: '#fff', stroke: last ? r.color : GRID, sw: last ? 2 : 1, r: 6,
        });
        s += T(px + 26, by + 18, label,
          { size: M.small, weight: last ? 700 : 400, fill: last ? r.color : INK });
        if (!last) s += ARROW(px + 30, by + bh + 1, px + 30, by + bh + 10, { c: r.color, head: 5 });
      });
    }
    y += rowH + (w ? 18 : 14);
  });

  if (!w) {
    // 手机版把两句说明挪到最下面，免得挤在方框里
    s += MT(px, y + 4, ['上：不知道是程序不行，还是材料里没线索',
      '下：效果不好时，知道该回头查哪一步'],
    { size: M.small, fill: MUTED, leading: 21 });
    y += 44;
  }
  return doc(M.W, y + 10, s, '随手挑读取方式与按任务倒推两条路线的对比');
}

// ---------------------------------------------------------------- 输出

const FIGURES = { '01-knock-evidence': knockEvidence, '01-before-after': beforeAfter };

let n = 0;
for (const mode of ['desktop', 'mobile']) {
  const dir = join(BASE, mode);
  mkdirSync(dir, { recursive: true });
  for (const [name, fn] of Object.entries(FIGURES)) {
    writeFileSync(join(dir, `${name}.svg`), fn(MODES[mode]), 'utf8');
    n += 1;
  }
}
console.log(`生成 ${n} 张（${Object.keys(FIGURES).length} 图 × 2 版式）`);
console.log(`数字来自 measure-01.py：${DATA.spectrum.diff_pct}% / ${DATA.columns.ratio} 倍`);
