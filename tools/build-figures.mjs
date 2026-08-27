#!/usr/bin/env node
// 为零基础版第 01–05 课生成手机端优先的 SVG 配图。
// 设计基准：420 px 竖向画布；在 360 px 正文宽度下，最小文字仍约 12 px。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_01-05', 'figures');
mkdirSync(OUT, { recursive: true });

const W = 420;
const BLUE = '#0878b9';
const SOFT = '#d9ecf8';
const PALE = '#edf6fc';
const INK = '#1f2933';
const MUTED = '#647382';
const WARM = '#c65a3d';
const GREEN = '#3b8f68';
const GRID = '#dce5ec';
const PLATE = '#f7f9fb';
const FONT = 'Microsoft YaHei, PingFang SC, Noto Sans SC, Hiragino Sans GB, sans-serif';

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svg(h, body, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" font-family="${FONT}" fill="${INK}" role="img" aria-label="${esc(label)}">\n<rect width="${W}" height="${h}" fill="#ffffff"/>\n${body}\n</svg>\n`;
}

function T(x, y, value, options = {}) {
  const { size = 15, weight = 400, fill = INK, anchor = 'start' } = options;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function MT(x, y, lines, options = {}) {
  const { size = 15, weight = 400, fill = INK, anchor = 'start', leading = Math.round(size * 1.45) } = options;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : leading}">${esc(line)}</tspan>`).join('')}</text>`;
}

function R(x, y, w, h, options = {}) {
  const { fill = 'none', stroke = GRID, sw = 1, radius = 8, opacity = 1 } = options;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;
}

function L(x1, y1, x2, y2, options = {}) {
  const { color = GRID, width = 1, dash = '' } = options;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

function C(x, y, radius, options = {}) {
  const { fill = BLUE, stroke = 'none', sw = 1 } = options;
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function PATH(d, options = {}) {
  const { color = BLUE, width = 2, fill = 'none', dash = '' } = options;
  return `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

function P(points, options = {}) {
  const { color = BLUE, width = 2, fill = 'none', dash = '' } = options;
  return `<polyline points="${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

function ARROW(x1, y1, x2, y2, options = {}) {
  const { color = MUTED, width = 1.8, head = 7 } = options;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const p1 = [x2 - head * Math.cos(angle - 0.48), y2 - head * Math.sin(angle - 0.48)];
  const p2 = [x2 - head * Math.cos(angle + 0.48), y2 - head * Math.sin(angle + 0.48)];
  return L(x1, y1, x2, y2, { color, width }) + `<polygon points="${x2},${y2} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="${color}"/>`;
}

function header(lines) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return MT(22, 30, arr, { size: 18, weight: 700, leading: 25 });
}

function card(x, y, w, h, options = {}) {
  return R(x, y, w, h, { fill: options.fill ?? PLATE, stroke: options.stroke ?? GRID, sw: options.sw ?? 1, radius: options.radius ?? 10 });
}

function curve(x, y, w, h, fn, n = 260, options = {}) {
  const points = [];
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    const value = Math.max(0, Math.min(1, fn(u)));
    points.push([x + u * w, y + h - value * h]);
  }
  return P(points, options);
}

function plotFrame(x, y, w, h) {
  return R(x, y, w, h, { fill: '#ffffff', stroke: GRID, radius: 6 }) + L(x + 8, y + h / 2, x + w - 8, y + h / 2, { color: GRID });
}

function spectrumFn(u) {
  const peak = (center, width, amp) => amp * Math.exp(-Math.pow((u - center) / width, 2));
  return 0.06 + peak(0.18, 0.025, 0.78) + peak(0.42, 0.035, 0.46) + peak(0.72, 0.05, 0.2);
}

function spectrogram(x, y, w, h) {
  let out = R(x, y, w, h, { fill: '#ffffff', stroke: GRID, radius: 5 });
  [0.72, 0.52, 0.34].forEach((v, index) => {
    out += R(x + 4, y + h * (1 - v), w - 8, 7, { fill: `rgba(8,120,185,${0.78 - index * 0.2})`, stroke: 'none', radius: 2 });
  });
  out += R(x + w * 0.62, y + 4, 8, h - 8, { fill: 'rgba(198,90,61,.82)', stroke: 'none', radius: 2 });
  return out;
}

// 手机卡片里的小图案。它们承担机制提示，不只是装饰。
function icon(kind, x, y, w = 74, h = 58) {
  let out = R(x, y, w, h, { fill: '#ffffff', stroke: GRID, radius: 8 });
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (kind === 'air') {
    out += R(x + 8, cy - 13, 12, 26, { fill: SOFT, stroke: BLUE, radius: 3 });
    out += PATH(`M${x + 20} ${cy - 10} L${x + 31} ${cy - 17} L${x + 31} ${cy + 17} L${x + 20} ${cy + 10} Z`, { color: BLUE, width: 1.5, fill: PALE });
    [0, 9, 18].forEach((offset) => { out += PATH(`M${x + 38 + offset} ${cy - 15 + offset * 0.18} Q${x + 48 + offset} ${cy} ${x + 38 + offset} ${cy + 15 - offset * 0.18}`, { color: offset === 18 ? WARM : BLUE, width: 1.6 }); });
  }
  if (kind === 'propagate') {
    for (let i = 0; i < 7; i += 1) for (let j = 0; j < 3; j += 1) {
      const dense = i < 3 ? 4 : 8;
      out += C(x + 10 + i * dense, y + 15 + j * 13 + ((i + j) % 2) * 2, 2.2, { fill: i < 3 ? BLUE : '#a9cde5' });
    }
    out += ARROW(x + 13, y + h - 9, x + w - 12, y + h - 9, { color: WARM, width: 1.5, head: 5 });
  }
  if (kind === 'mic') {
    out += R(cx - 12, y + 9, 24, 30, { fill: PALE, stroke: BLUE, sw: 1.7, radius: 12 });
    out += PATH(`M${cx - 19} ${y + 28} Q${cx - 18} ${y + 47} ${cx} ${y + 47} Q${cx + 18} ${y + 47} ${cx + 19} ${y + 28}`, { color: MUTED, width: 1.7 });
    out += L(cx, y + 47, cx, y + h - 4, { color: MUTED, width: 1.7 });
    out += L(cx - 12, y + h - 4, cx + 12, y + h - 4, { color: MUTED, width: 1.7 });
  }
  if (kind === 'samples') {
    out += curve(x + 7, y + 7, w - 14, h - 14, (u) => 0.5 + 0.34 * Math.sin(u * 13), 120, { color: '#b6c4cf', width: 1.2 });
    for (let i = 0; i < 8; i += 1) {
      const u = i / 7; const px = x + 7 + u * (w - 14); const value = 0.5 + 0.34 * Math.sin(u * 13); const py = y + 7 + (h - 14) * (1 - value);
      out += L(px, cy, px, py, { color: BLUE, width: 1.2 });
      out += C(px, py, 2.7, { fill: BLUE });
    }
  }
  if (kind === 'spectrogram') out += spectrogram(x + 7, y + 8, w - 14, h - 16);
  if (kind === 'decision') {
    [0, 1, 2].forEach((i) => {
      const yy = y + 11 + i * 15;
      out += R(x + 10, yy, 10, 10, { fill: i === 0 ? BLUE : '#ffffff', stroke: BLUE, radius: 2 });
      out += L(x + 27, yy + 5, x + w - 9, yy + 5, { color: i === 0 ? BLUE : '#b8c4ce', width: 2 });
    });
  }
  if (kind === 'bulb') {
    out += C(cx, cy - 5, 14, { fill: '#fff4ca', stroke: '#d6a72e', sw: 1.7 });
    out += R(cx - 8, cy + 9, 16, 9, { fill: '#d9e1e8', stroke: MUTED, radius: 2 });
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4;
      out += L(cx + Math.cos(angle) * 21, cy - 5 + Math.sin(angle) * 21, cx + Math.cos(angle) * 27, cy - 5 + Math.sin(angle) * 27, { color: '#d6a72e', width: 1.5 });
    }
  }
  if (kind === 'spread') {
    out += C(x + 16, cy, 5, { fill: WARM });
    [18, 30, 42].forEach((radius, i) => { out += PATH(`M${x + 16 + radius * 0.65} ${cy - radius * 0.55} A${radius} ${radius} 0 0 1 ${x + 16 + radius * 0.65} ${cy + radius * 0.55}`, { color: i === 0 ? BLUE : '#aab8c4', width: 1.4, dash: i === 2 ? '4 3' : '' }); });
  }
  if (kind === 'meter') {
    out += R(x + 10, y + 12, w - 20, h - 24, { fill: PALE, stroke: MUTED, radius: 5 });
    out += PATH(`M${x + 18} ${cy + 6} Q${cx} ${cy - 17} ${x + w - 18} ${cy + 6}`, { color: BLUE, width: 1.8 });
    out += L(cx, cy + 6, x + w - 22, cy - 10, { color: WARM, width: 2 });
    out += C(cx, cy + 6, 3, { fill: WARM });
  }
  if (kind === 'frequency') {
    [14, 30, 46].forEach((height, i) => { out += R(x + 13 + i * 17, y + h - 8 - height, 10, height, { fill: i === 2 ? BLUE : SOFT, stroke: BLUE, radius: 2 }); });
  }
  if (kind === 'precision') {
    for (let i = 0; i < 7; i += 1) out += L(x + 10, y + 8 + i * 7, x + w - 10, y + 8 + i * 7, { color: i % 2 ? GRID : BLUE, width: i % 2 ? 1 : 1.4 });
    out += C(cx + 10, cy - 7, 4, { fill: WARM });
  }
  if (kind === 'ladder') {
    [0, 1, 2].forEach((i) => { out += R(x + 12 + i * 15, y + 37 - i * 12, 19, 12 + i * 12, { fill: i === 2 ? BLUE : SOFT, stroke: BLUE, radius: 2 }); });
  }
  if (kind === 'clock') {
    out += C(cx, cy, 20, { fill: PALE, stroke: BLUE, sw: 1.7 });
    out += L(cx, cy, cx, cy - 13, { color: BLUE, width: 2 });
    out += L(cx, cy, cx + 12, cy + 8, { color: WARM, width: 2 });
    out += C(cx, cy, 3, { fill: BLUE });
  }
  if (kind === 'domain') {
    out += L(x + 10, y + h - 12, x + w - 8, y + h - 12, { color: MUTED, width: 1.3 });
    out += curve(x + 12, y + 8, w - 24, h - 22, (u) => 0.5 + 0.27 * Math.sin(u * 25), 120, { color: BLUE, width: 1.5 });
    out += R(x + w - 24, y + 13, 8, 27, { fill: WARM, stroke: 'none', radius: 2 });
  }
  if (kind === 'learn') {
    const left = [[x + 13, cy - 14], [x + 13, cy + 14]];
    const middle = [[cx, cy - 18], [cx, cy], [cx, cy + 18]];
    const right = [[x + w - 13, cy]];
    left.forEach((a) => middle.forEach((b) => { out += L(a[0], a[1], b[0], b[1], { color: '#aac5d7', width: 1 }); }));
    middle.forEach((a) => right.forEach((b) => { out += L(a[0], a[1], b[0], b[1], { color: '#aac5d7', width: 1 }); }));
    [...left, ...middle, ...right].forEach(([px, py], i) => { out += C(px, py, 4, { fill: i < 2 ? SOFT : BLUE, stroke: BLUE, sw: 1 }); });
  }
  return out;
}

const made = [];
const write = (name, content) => {
  writeFileSync(join(OUT, name), content, 'utf8');
  made.push(name);
};

// 01 声音表示

write('01-pipeline.svg', (() => {
  const H = 700;
  const steps = [
    ['空气在推挤', ['说话、敲击让空气', '一会儿密、一会儿疏']],
    ['麦克风变成电压', ['薄膜跟着空气运动', '运动大小变成电压']],
    ['每秒测量许多次', ['每次结果记成', '一个数字']],
    ['整理成一种表示', ['保留任务需要的', '时间或频率线索']],
    ['程序给出判断', ['狗叫、汽车声', '或者人在说话']],
  ];
  let s = header(['一段录音怎样变成', '程序真正读到的数字']);
  steps.forEach(([title, desc], i) => {
    const y = 78 + i * 118;
    s += card(36, y, 348, 92, { fill: i === 4 ? PALE : PLATE, stroke: i === 4 ? BLUE : GRID });
    s += C(66, y + 46, 18, { fill: BLUE });
    s += T(66, y + 52, i + 1, { size: 16, weight: 700, fill: '#ffffff', anchor: 'middle' });
    s += T(96, y + 34, title, { size: 17, weight: 700 });
    s += MT(96, y + 59, desc, { size: 14, fill: MUTED, leading: 19 });
    s += icon(['air', 'mic', 'samples', 'spectrogram', 'decision'][i], 298, y + 17, 66, 58);
    if (i < steps.length - 1) s += ARROW(210, y + 96, 210, y + 113, { color: '#9ba9b5' });
  });
  return svg(H, s, '录音从空气振动到程序判断的五个步骤');
})());

function threeViewFigure(headline, labels, descriptions) {
  const H = 720;
  let s = header(headline);
  const ys = [72, 286, 500];
  labels.forEach((label, i) => {
    const y = ys[i];
    s += card(24, y, 372, 190);
    s += T(42, y + 31, label, { size: 17, weight: 700, fill: BLUE });
    s += T(42, y + 55, descriptions[i], { size: 14, fill: MUTED });
    const px = 42; const py = y + 72; const pw = 336; const ph = 88;
    if (i === 0) {
      s += plotFrame(px, py, pw, ph);
      s += curve(px + 6, py + 7, pw - 12, ph - 14, (u) => {
        const click = Math.exp(-Math.pow((u - 0.64) / 0.024, 2)) * 0.32 * Math.sin(u * 350);
        return 0.5 + 0.16 * Math.sin(u * 95) + click;
      }, 700, { color: BLUE, width: 1.4 });
      s += T(px + 8, py + ph + 20, '时间 →', { size: 14, fill: MUTED });
    } else if (i === 1) {
      s += plotFrame(px, py, pw, ph);
      s += curve(px + 6, py + 7, pw - 12, ph - 14, spectrumFn, 300, { color: BLUE, width: 2 });
      s += T(px + 8, py + ph + 20, '低', { size: 14, fill: MUTED });
      s += T(px + pw - 8, py + ph + 20, '高', { size: 14, fill: MUTED, anchor: 'end' });
    } else {
      s += spectrogram(px, py, pw, ph);
      s += T(px + 8, py + ph + 20, '时间 →', { size: 14, fill: MUTED });
      s += T(px + pw - 8, py + 17, '高', { size: 14, fill: MUTED, anchor: 'end' });
      s += T(px + pw - 8, py + ph - 7, '低', { size: 14, fill: MUTED, anchor: 'end' });
    }
  });
  return svg(H, s, `${labels.join('、')}三种声音观察方式`);
}

write('01-three-views.svg', threeViewFigure(
  ['同一段声音的三种表示'],
  ['波形：看每个瞬间', '频谱：看有哪些成分', '声谱图：成分和时间一起看'],
  ['敲击发生在哪一刻', '低音和高音各有多少', '哪些成分在什么时候出现'],
));

write('01-evidence.svg', (() => {
  const H = 675;
  const rows = [
    ['波形', '短促敲击', true, '持续嗡声', false],
    ['频谱', '短促敲击', false, '持续嗡声', true],
    ['声谱图', '短促敲击', true, '持续嗡声', true],
  ];
  let s = header(['同一段机器声里', '不同表示能看见什么']);
  rows.forEach(([name, a, aOk, b, bOk], i) => {
    const y = 80 + i * 182;
    s += card(28, y, 364, 154);
    s += T(48, y + 34, name, { size: 18, weight: 700, fill: BLUE });
    const miniX = 268; const miniY = y + 10; const miniW = 96; const miniH = 34;
    if (i === 0) {
      s += plotFrame(miniX, miniY, miniW, miniH);
      s += curve(miniX + 4, miniY + 4, miniW - 8, miniH - 8, (u) => 0.5 + 0.3 * Math.sin(u * 28), 120, { color: BLUE, width: 1.3 });
    } else if (i === 1) {
      s += plotFrame(miniX, miniY, miniW, miniH);
      s += curve(miniX + 4, miniY + 4, miniW - 8, miniH - 8, spectrumFn, 100, { color: BLUE, width: 1.5 });
    } else s += spectrogram(miniX, miniY, miniW, miniH);
    [[a, aOk], [b, bOk]].forEach(([label, ok], j) => {
      const yy = y + 70 + j * 42;
      s += T(50, yy, label, { size: 15 });
      s += R(250, yy - 22, 112, 30, { fill: ok ? '#eaf5ef' : '#f0f2f4', stroke: ok ? GREEN : '#bdc6ce', radius: 15 });
      s += T(306, yy - 1, ok ? '看得清' : '容易丢失', { size: 14, weight: 700, fill: ok ? GREEN : MUTED, anchor: 'middle' });
    });
  });
  s += MT(30, 642, ['没有“最高级”的表示，', '只有任务所需的证据是否还在。'], { size: 15, weight: 700, fill: WARM, leading: 21 });
  return svg(H, s, '波形频谱和声谱图对敲击与嗡声的保留差异');
})());

write('01-framing.svg', (() => {
  const H = 560;
  let s = header(['分帧：把长录音变成', '许多次短时间观察']);
  s += T(28, 82, '10 秒录音：160000 个采样点', { size: 15, weight: 700 });
  s += card(28, 98, 364, 72, { fill: PALE });
  s += curve(38, 111, 344, 46, (u) => 0.5 + 0.35 * Math.sin(u * 220) * (0.55 + 0.4 * Math.sin(u * 7)), 900, { color: BLUE, width: 1 });
  s += ARROW(210, 178, 210, 212, { color: WARM });
  s += T(28, 236, '放大其中一小段，再反复移动观察窗口', { size: 15, weight: 700 });
  const frameY = [264, 308, 352, 396];
  frameY.forEach((y, i) => {
    const x = 42 + i * 24;
    s += R(x, y, 260, 34, { fill: i % 2 ? '#ffffff' : SOFT, stroke: BLUE, sw: 1.4, radius: 6 });
    s += T(x + 14, y + 23, `第 ${i + 1} 帧`, { size: 14, weight: 700, fill: BLUE });
  });
  s += MT(28, 474, ['每帧 25 ms：400 个采样点', '每隔 10 ms 开始下一帧', '相邻两帧因此重叠 15 ms'], { size: 15, fill: MUTED, leading: 24 });
  return svg(H, s, '把十秒录音切成互相重叠的短帧');
})());

// 02 波形、频率与音高

write('02-air-to-numbers.svg', (() => {
  const H = 650;
  const steps = [
    ['音箱纸盆来回运动', ['往外推时空气变密', '往回收时空气变疏']],
    ['疏密变化向外传播', ['空气只在原地来回动', '传播的是变化和能量']],
    ['麦克风薄膜跟着动', ['所在位置不同', '记录结果也不同']],
    ['设备反复测量', ['每次结果记成数字', '按时间连起来就是波形']],
  ];
  let s = header(['空气的变化怎样变成', '录音里的数字']);
  steps.forEach(([title, lines], i) => {
    const y = 78 + i * 136;
    s += card(34, y, 352, 104, { fill: i === 3 ? PALE : PLATE });
    s += C(64, y + 34, 17, { fill: BLUE });
    s += T(64, y + 40, i + 1, { size: 15, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(92, y + 38, title, { size: 17, weight: 700 });
    s += MT(92, y + 66, lines, { size: 14, fill: MUTED, leading: 20 });
    s += icon(['air', 'propagate', 'mic', 'samples'][i], 298, y + 22, 68, 60);
    if (i < 3) s += ARROW(210, y + 108, 210, y + 130, { color: '#9ba9b5' });
  });
  return svg(H, s, '声音从音箱推动空气到麦克风记录数字');
})());

write('02-three-structures.svg', (() => {
  const H = 650;
  const items = [
    ['周期：一遍遍重复', '琴弦、电机的稳定嗡声', (u) => 0.5 + 0.36 * Math.sin(u * 42), BLUE],
    ['噪声：找不到明显重复', '风声、摩擦声、底噪', (u) => 0.5 + 0.12 * (Math.sin(u * 333) + Math.sin(u * 137) + Math.sin(u * 77)), BLUE],
    ['瞬态：集中在一瞬间', '敲桌子、鼓点、碰撞', (u) => 0.5 + 0.4 * Math.exp(-Math.pow((u - 0.35) / 0.04, 2)) * Math.sin(u * 360), WARM],
  ];
  let s = header(['波形里常见的三种结构']);
  items.forEach(([title, sub, fn, color], i) => {
    const y = 66 + i * 190;
    s += card(26, y, 368, 164);
    s += T(44, y + 31, title, { size: 17, weight: 700, fill: color });
    s += T(44, y + 56, sub, { size: 14, fill: MUTED });
    s += plotFrame(44, y + 72, 332, 70);
    s += curve(50, y + 79, 320, 56, fn, 700, { color, width: 1.5 });
  });
  s += T(28, 632, '真实录音通常同时包含三种结构。', { size: 15, fill: MUTED });
  return svg(H, s, '周期噪声和瞬态三种波形结构');
})());

write('02-sine-knobs.svg', (() => {
  const H = 690;
  const base = (u) => 0.5 + 0.22 * Math.sin(u * 25);
  const items = [
    ['振幅：抖动有多大', '其他条件相同时，通常影响响度', (u) => 0.5 + 0.4 * Math.sin(u * 25)],
    ['频率：一秒重复多少次', '决定声音听起来有多高', (u) => 0.5 + 0.22 * Math.sin(u * 50)],
    ['相位：从一轮的哪里开始', '单独听不明显，叠加时会改变结果', (u) => 0.5 + 0.22 * Math.sin(u * 25 + Math.PI * 0.9)],
  ];
  let s = header(['正弦波的三个参数']);
  items.forEach(([title, sub, fn], i) => {
    const y = 68 + i * 202;
    s += card(26, y, 368, 176);
    s += T(44, y + 32, title, { size: 17, weight: 700, fill: BLUE });
    s += T(44, y + 57, sub, { size: 14, fill: MUTED });
    s += plotFrame(44, y + 75, 332, 75);
    s += curve(50, y + 82, 320, 61, base, 400, { color: '#bcc8d2', width: 1.5 });
    s += curve(50, y + 82, 320, 61, fn, 400, { color: BLUE, width: 2 });
  });
  s += T(28, 678, '灰线是原来，蓝线是只改变一个参数。', { size: 14, fill: MUTED });
  return svg(H, s, '正弦波的振幅频率与相位');
})());

write('02-note-vs-hz.svg', (() => {
  const H = 610;
  let s = header(['音符编号等距增加', '频率却按倍数上升']);
  const gx = 82; const gy = 92; const gw = 292; const gh = 330;
  s += card(46, 70, 346, 390);
  const notes = [[57, 220, 'A3'], [69, 440, 'A4'], [81, 880, 'A5'], [93, 1760, 'A6']];
  const x = (m) => gx + ((m - 57) / 36) * gw;
  const y = (f) => gy + gh - (Math.log2(f / 180) / Math.log2(1900 / 180)) * gh;
  [220, 440, 880, 1760].forEach((f) => {
    s += L(gx, y(f), gx + gw, y(f), { color: GRID });
    s += T(gx - 10, y(f) + 5, `${f}`, { size: 14, fill: MUTED, anchor: 'end' });
  });
  const points = [];
  for (let m = 57; m <= 93; m += 0.25) points.push([x(m), y(440 * 2 ** ((m - 69) / 12))]);
  s += P(points, { color: BLUE, width: 2.5 });
  notes.forEach(([m, f, name]) => {
    s += C(x(m), y(f), 5, { fill: '#fff', stroke: BLUE, sw: 2 });
    s += T(x(m), y(f) - 12, name, { size: 14, weight: 700, fill: BLUE, anchor: 'middle' });
  });
  s += T(210, 448, '琴键编号 →', { size: 14, fill: MUTED, anchor: 'middle' });
  s += MT(30, 500, ['每往上 12 个键：频率 × 2', '220 → 440 → 880 → 1760 Hz', '所以一个八度是频率翻倍，不是加固定数。'], { size: 15, leading: 25 });
  return svg(H, s, 'MIDI 音符编号与频率倍数关系');
})());

// 03 分贝、响度与音色

write('03-lamp-analogy.svg', (() => {
  const H = 650;
  const items = [
    ['声功率：声源放出多少', ['像灯泡标着多少瓦', '描述声源本身']],
    ['声强：每平方米收到多少', ['像桌面每块区域有多亮', '会随距离改变']],
    ['声压：麦克风在一点量到什么', ['空气压力怎样变化', '是麦克风首先响应的量']],
  ];
  let s = header(['三个“声音大小”', '描述的不是同一件事']);
  items.forEach(([title, desc], i) => {
    const y = 82 + i * 178;
    s += card(28, y, 364, 148, { fill: i === 2 ? PALE : PLATE });
    s += C(60, y + 36, 18, { fill: BLUE });
    s += T(60, y + 42, i + 1, { size: 15, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(88, y + 41, title, { size: 17, weight: 700 });
    s += MT(48, y + 82, desc, { size: 15, fill: MUTED, leading: 23 });
    s += icon(['bulb', 'spread', 'meter'][i], 294, y + 64, 72, 66);
  });
  s += T(28, 632, '放出、传到、测到，必须分开讨论。', { size: 15, weight: 700, fill: WARM });
  return svg(H, s, '声功率声强声压的区别');
})());

write('03-distance.svg', (() => {
  const H = 610;
  let s = header(['平方反比：距离翻倍', '同样能量摊到四倍面积']);
  s += card(26, 78, 368, 212);
  s += C(100, 184, 10, { fill: WARM });
  s += T(100, 214, '声源', { size: 14, fill: MUTED, anchor: 'middle' });
  s += PATH('M150 126 A82 82 0 0 1 150 242', { color: BLUE, width: 2 });
  s += PATH('M208 96 A150 150 0 0 1 208 272', { color: MUTED, width: 2, dash: '6 5' });
  s += T(158, 121, '1 米', { size: 15, weight: 700, fill: BLUE });
  s += T(218, 99, '2 米', { size: 15, weight: 700, fill: MUTED });
  s += card(34, 320, 352, 98, { fill: PALE });
  s += R(62, 344, 48, 48, { fill: 'rgba(8,120,185,.65)', stroke: BLUE, radius: 4 });
  s += MT(130, 358, ['1 米：一格面积', '每格得到 1 份能量'], { size: 15, leading: 24 });
  s += card(34, 438, 352, 114);
  for (let a = 0; a < 2; a += 1) for (let b = 0; b < 2; b += 1) s += R(58 + a * 34, 466 + b * 34, 30, 30, { fill: 'rgba(8,120,185,.18)', stroke: BLUE, radius: 3 });
  s += MT(144, 468, ['2 米：四格面积', '每格只剩 1/4 份', '不是一半'], { size: 15, weight: 700, fill: WARM, leading: 23 });
  s += T(28, 590, '前提：空旷、无反射、声源向各方向均匀发声。', { size: 14, fill: MUTED });
  return svg(H, s, '距离翻倍声强降到四分之一');
})());

write('03-decibel.svg', (() => {
  const H = 590;
  let s = header(['分贝：把巨大倍数', '压成容易比较的数字']);
  const gx = 76; const gy = 100; const gw = 300; const gh = 300;
  s += card(42, 76, 346, 370);
  const x = (e) => gx + (e / 12) * gw;
  const y = (db) => gy + gh - (db / 120) * gh;
  for (let e = 0; e <= 12; e += 3) {
    s += L(x(e), gy, x(e), gy + gh, { color: GRID });
    s += T(x(e), gy + gh + 22, e === 0 ? '1' : `10^${e}`, { size: 14, fill: MUTED, anchor: 'middle' });
  }
  for (let db = 0; db <= 120; db += 30) {
    s += L(gx, y(db), gx + gw, y(db), { color: GRID });
    s += T(gx - 10, y(db) + 5, db, { size: 14, fill: MUTED, anchor: 'end' });
  }
  s += P([[x(0), y(0)], [x(12), y(120)]], { color: BLUE, width: 3 });
  [[0, 0, '刚能听见'], [6, 60, '正常说话'], [12, 120, '接近疼痛']].forEach(([e, db, label]) => {
    s += C(x(e), y(db), 5, { fill: '#fff', stroke: BLUE, sw: 2 });
    s += T(x(e) + (e === 12 ? -8 : 8), y(db) - 12, label, { size: 14, weight: 700, fill: BLUE, anchor: e === 12 ? 'end' : 'start' });
  });
  s += T(50, 474, '横轴：能量是参考值的多少倍', { size: 14, fill: MUTED });
  s += MT(28, 520, ['分贝永远是“相对于参考值”的比值。', '参考值不同，分贝数就不能直接比较。'], { size: 15, weight: 700, fill: WARM, leading: 23 });
  return svg(H, s, '分贝将一万亿倍能量范围转换为零到一百二十分贝');
})());

write('03-timbre.svg', (() => {
  const H = 680;
  let s = header(['音色来自两类差别']);
  s += card(26, 66, 368, 260);
  s += T(44, 98, '一、声音成分的比例不同', { size: 17, weight: 700, fill: BLUE });
  s += MT(44, 126, ['即使基本音高相同，', '更高成分的强弱比例也会不同。'], { size: 15, fill: MUTED, leading: 23 });
  const bx = 54; const by = 190;
  [78, 52, 32, 18].forEach((barH, i) => s += R(bx + i * 78, by + 90 - barH, 28, barH, { fill: i === 0 ? BLUE : SOFT, stroke: BLUE, radius: 3 }));
  s += T(54, 304, '低成分', { size: 14, fill: MUTED });
  s += T(360, 304, '高成分', { size: 14, fill: MUTED, anchor: 'end' });
  s += card(26, 350, 368, 268);
  s += T(44, 382, '二、声音随时间的变化不同', { size: 17, weight: 700, fill: WARM });
  s += T(44, 410, '这种整体轮廓叫包络。', { size: 15, fill: MUTED });
  const px = 48; const pw = 324;
  s += plotFrame(px, 438, pw, 62);
  s += curve(px + 6, 444, pw - 12, 50, (u) => u < 0.05 ? u / 0.05 : Math.exp(-(u - 0.05) * 4), 300, { color: BLUE, width: 2.5 });
  s += T(54, 520, '钢琴：很快变响，再慢慢衰减', { size: 14, fill: BLUE });
  s += plotFrame(px, 536, pw, 62);
  s += curve(px + 6, 542, pw - 12, 50, (u) => u < 0.28 ? u / 0.28 : u > 0.82 ? 1 - (u - 0.82) / 0.18 : 1, 300, { color: WARM, width: 2.5 });
  s += T(54, 620, '小提琴：慢慢拉响，可以持续保持', { size: 14, fill: WARM });
  s += T(28, 654, '音高和响度相同，音色仍然可能不同。', { size: 14, fill: MUTED });
  return svg(H, s, '音色由频率成分比例和时间包络共同决定');
})());

// 04 采样率与位深

write('04-two-decisions.svg', (() => {
  const H = 690;
  const items = [
    ['连续变化的电压', '任何一个瞬间都可能有值', 'continuous'],
    ['采样：只在某些时刻测量', '决定一秒钟量多少次', 'samples'],
    ['量化：靠到最近档位', '决定每次测量能记多细', 'levels'],
  ];
  let s = header(['连续声音变成数字', '需要两个决定']);
  items.forEach(([title, sub, type], i) => {
    const y = 74 + i * 202;
    s += card(26, y, 368, 172, { fill: i === 0 ? PLATE : PALE });
    s += T(44, y + 32, title, { size: 17, weight: 700, fill: i === 0 ? INK : BLUE });
    s += T(44, y + 57, sub, { size: 14, fill: MUTED });
    const px = 46; const py = y + 78; const pw = 328; const ph = 68;
    s += plotFrame(px, py, pw, ph);
    const fn = (u) => 0.5 + 0.38 * Math.sin(u * 7.2 + 0.4);
    if (type === 'continuous') s += curve(px + 6, py + 6, pw - 12, ph - 12, fn, 320, { color: BLUE, width: 2.5 });
    if (type === 'samples') {
      s += curve(px + 6, py + 6, pw - 12, ph - 12, fn, 320, { color: '#c3ced8', width: 1.5 });
      for (let k = 0; k < 12; k += 1) {
        const u = k / 11; const xx = px + 6 + u * (pw - 12); const yy = py + 6 + (ph - 12) * (1 - fn(u));
        s += C(xx, yy, 4, { fill: BLUE });
      }
    }
    if (type === 'levels') {
      for (let k = 0; k < 6; k += 1) s += L(px + 6, py + 6 + k * ((ph - 12) / 5), px + pw - 6, py + 6 + k * ((ph - 12) / 5), { color: GRID });
      for (let k = 0; k < 12; k += 1) {
        const u = k / 11; const q = Math.round(fn(u) * 5) / 5; const xx = px + 6 + u * (pw - 12); const yy = py + 6 + (ph - 12) * (1 - q);
        s += C(xx, yy, 4, { fill: BLUE });
      }
    }
    if (i < 2) s += ARROW(210, y + 177, 210, y + 196, { color: WARM });
  });
  return svg(H, s, '数字音频先采样再量化的两个决定');
})());

write('04-aliasing.svg', (() => {
  const H = 560;
  let s = header(['混叠：采样太慢', '高频会伪装成低频']);
  const gx = 42; const gy = 104; const gw = 336; const gh = 220;
  s += card(24, 78, 372, 296);
  s += plotFrame(gx, gy, gw, gh);
  const f7 = (u) => 0.5 + 0.4 * Math.sin(2 * Math.PI * 7 * u);
  const f3 = (u) => 0.5 - 0.4 * Math.sin(2 * Math.PI * 3 * u);
  s += curve(gx + 4, gy + 6, gw - 8, gh - 12, f7, 900, { color: '#aab8c4', width: 1.8 });
  s += curve(gx + 4, gy + 6, gw - 8, gh - 12, f3, 900, { color: BLUE, width: 2.5 });
  for (let k = 0; k <= 10; k += 1) {
    const u = k / 10; const xx = gx + 4 + u * (gw - 8); const yy = gy + 6 + (gh - 12) * (1 - f7(u));
    s += C(xx, yy, 5, { fill: '#fff', stroke: WARM, sw: 2 });
  }
  s += MT(30, 408, ['灰线：每秒振动 7 次', '蓝线：数字里看起来每秒 3 次', '橙圈：每秒只测量 10 次时，测量点完全相同'], { size: 15, leading: 25 });
  s += MT(30, 506, ['混叠在采样时已经发生，', '事后提高采样率也无法修复。'], { size: 15, weight: 700, fill: WARM, leading: 23 });
  return svg(H, s, '每秒采样十次时七赫兹信号混叠为三赫兹');
})());

write('04-levels.svg', (() => {
  const H = 660;
  let s = header(['位深越高，档位越密', '量化时改动越小']);
  [[3, 8, '3 位：8 个档位'], [5, 32, '5 位：32 个档位']].forEach(([bits, levels, title], i) => {
    const y = 78 + i * 274;
    s += card(26, y, 368, 238);
    s += T(44, y + 34, title, { size: 17, weight: 700, fill: BLUE });
    s += T(44, y + 59, i === 0 ? '台阶明显，改动较大' : '台阶更细，改动较小', { size: 14, fill: MUTED });
    const px = 44; const py = y + 82; const pw = 332; const ph = 120;
    s += plotFrame(px, py, pw, ph);
    const fn = (u) => 0.5 + 0.42 * Math.sin(u * 6.6);
    s += curve(px + 6, py + 6, pw - 12, ph - 12, fn, 400, { color: '#bac6d0', width: 1.8 });
    const points = [];
    for (let k = 0; k <= 80; k += 1) {
      const u = k / 80; const q = Math.round(fn(u) * (levels - 1)) / (levels - 1); const xx = px + 6 + u * (pw - 12); const yy = py + 6 + (ph - 12) * (1 - q);
      if (points.length) points.push([xx, points[points.length - 1][1]]);
      points.push([xx, yy]);
    }
    s += P(points, { color: BLUE, width: 2.2 });
  });
  s += T(28, 640, '灰线是原值，蓝色阶梯是量化后的值。', { size: 14, fill: MUTED });
  return svg(H, s, '三位和五位量化档位对比');
})());

write('04-tradeoff.svg', (() => {
  const H = 600;
  let s = header(['采样率和位深', '各自换来什么、付出什么']);
  const cards = [
    ['采样率更高', ['换来：能记录更高的频率成分', '代价：文件更大，计算更多'], '任务需要高频信息时才值得'],
    ['位深更高', ['换来：档位更密，量化误差更小', '代价：文件同样会变大'], '录音环境足够安静时才值得'],
  ];
  cards.forEach(([title, lines, note], i) => {
    const y = 86 + i * 228;
    s += card(28, y, 364, 196, { fill: PALE });
    s += T(48, y + 38, title, { size: 18, weight: 700, fill: BLUE });
    s += MT(48, y + 78, lines, { size: 15, leading: 29 });
    s += icon(i === 0 ? 'frequency' : 'precision', 300, y + 20, 70, 62);
    s += R(46, y + 140, 328, 38, { fill: '#fff3ef', stroke: '#efd0c6', radius: 7 });
    s += T(210, y + 165, note, { size: 14, weight: 700, fill: WARM, anchor: 'middle' });
  });
  s += MT(30, 556, ['参数不是越大越专业，', '而是要刚好覆盖任务需要的信息。'], { size: 15, weight: 700, leading: 23 });
  return svg(H, s, '提高采样率与位深的收益和代价');
})());

// 05 音频特征选择

write('05-four-questions.svg', (() => {
  const H = 740;
  const items = [
    ['抽象层级', '目标能否拆成可测量现象？', '异常 → 尖声、撞击、底噪'],
    ['时间尺度', '看一瞬间、一小段还是整段？', '要定位事件，就保留先后顺序'],
    ['信号域', '看时间、看成分还是一起看？', '选择最容易看见证据的角度'],
    ['产生方式', '按公式计算，还是让模型学习？', '数据少先用可解释的规则'],
  ];
  let s = header(['选择音频特征前', '先回答四个知识问题']);
  items.forEach(([title, q, hint], i) => {
    const y = 82 + i * 152;
    s += card(28, y, 364, 126, { fill: i % 2 ? '#fff' : PALE });
    s += C(58, y + 34, 17, { fill: BLUE });
    s += T(58, y + 40, i + 1, { size: 15, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(86, y + 39, title, { size: 17, weight: 700, fill: BLUE });
    s += T(48, y + 75, q, { size: 15 });
    s += T(48, y + 103, hint, { size: 14, fill: MUTED });
    s += icon(['ladder', 'clock', 'domain', 'learn'][i], 312, y + 15, 60, 54);
  });
  s += MT(28, 710, ['四个答案共同决定一个特征，', '它们不是四选一。'], { size: 15, weight: 700, fill: WARM, leading: 22 });
  return svg(H, s, '选择音频特征的抽象层级时间尺度信号域与产生方式');
})());

write('05-time-scale.svg', (() => {
  const H = 620;
  let s = header(['时间尺度：窗口越长', '覆盖越多，局部位置越模糊']);
  s += card(26, 78, 368, 96, { fill: PALE });
  s += curve(38, 98, 344, 54, (u) => 0.5 + 0.35 * Math.sin(u * 260) * (0.55 + 0.4 * Math.sin(u * 5)), 900, { color: BLUE, width: 1 });
  [['一个采样点', 8, '只知道这一瞬间'], ['几十毫秒', 70, '看局部质地'], ['几秒钟', 190, '看一个完整事件'], ['整段录音', 330, '只剩总体统计']].forEach(([name, width, note], i) => {
    const y = 218 + i * 88;
    s += T(34, y, name, { size: 16, weight: 700 });
    s += T(386, y, note, { size: 14, fill: MUTED, anchor: 'end' });
    s += R(34, y + 16, width, 18, { fill: i === 3 ? '#dfe6ec' : SOFT, stroke: BLUE, sw: 1.2, radius: 4 });
  });
  s += MT(28, 574, ['找“什么时候发生”要保留序列；', '只判断整段类别才考虑平均。'], { size: 15, weight: 700, fill: WARM, leading: 23 });
  return svg(H, s, '从一个采样点到整段录音的时间尺度');
})());

write('05-three-angles.svg', threeViewFigure(
  ['信号域：三种观察角度'],
  ['看时间上的起伏', '看频率成分的分布', '时间和频率一起看'],
  ['什么时候响、什么时候静', '低频和高频各有多少', '哪些成分在什么时候出现'],
));

write('05-rule-vs-learn.svg', (() => {
  const H = 620;
  let s = header(['音频特征的两种来源', '可以组合，不必二选一']);
  s += card(28, 84, 364, 158);
  s += T(48, 120, '人工规则计算', { size: 18, weight: 700, fill: BLUE });
  s += MT(48, 156, ['含义清楚、容易排查', '样本少也能使用', '风险：规则可能漏掉关键线索'], { size: 15, fill: MUTED, leading: 24 });
  s += icon('frequency', 294, 108, 72, 66);
  s += ARROW(210, 250, 210, 284, { color: WARM });
  s += card(28, 292, 364, 158);
  s += T(48, 328, '模型从数据中学习', { size: 18, weight: 700, fill: BLUE });
  s += MT(48, 364, ['能学习复杂关系', '但更依赖数据和算力', '风险：可能学到无关差异'], { size: 15, fill: MUTED, leading: 24 });
  s += icon('learn', 294, 316, 72, 66);
  s += R(38, 486, 344, 82, { fill: '#fff3ef', stroke: '#efd0c6', radius: 10 });
  s += MT(210, 518, ['常见组合', '前面用稳定规则，后面交给模型学习'], { size: 15, weight: 700, fill: WARM, anchor: 'middle', leading: 25 });
  s += T(28, 600, '选择依据是任务证据和数据条件。', { size: 15, fill: MUTED });
  return svg(H, s, '人工音频特征与模型学习特征的组合');
})());

console.log(`生成 ${made.length} 张手机端 SVG：`);
made.forEach((name) => console.log(`  ${name}`));
