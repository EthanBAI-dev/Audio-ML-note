#!/usr/bin/env node
// 第 01～05 课的小红书卡片版配图。
//
//   node tools/build-cards-01-05.mjs
//
// 输出 音频信号处理二十三讲/第01-05课/figures/card/
//
// 与网页版（desktop 880 / mobile 420）的区别：
//   卡片正文可用宽 912、图片高度上限 900，而且卡片在手机上会整体缩到 0.361，
//   所以图内字号必须 ≥ 32（等于卡片正文 36px 的量级）。
//   同样的内容在这个字号下只能放约 24 个字一行，是网页桌面版的一半，
//   因此多面板的图按「一卡一个要点」拆开，文案也重写得更短。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWav, resample, stft, magnitudeSpectrum, synthHumAndKnock } from './lib/dsp.mjs';
import { spectrogramPng, colorbar } from './lib/figure.mjs';
import {
  CARD, C, cardDoc, T, MT, R, L, O, P, PATH, ARROW,
  head, rows, cols, plate, white, axisX, axisY, curve, wave,
} from './lib/card.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '音频信号处理二十三讲/', '第01-05课', 'figures', 'card');
mkdirSync(OUT, { recursive: true });

// ---------- 素材 ----------

const SR = 16000;
const load = (f) => {
  const w = readWav(join(ROOT, 'source_course', 'audio_resources', f));
  return { samples: resample(w.samples, w.sampleRate, SR), sampleRate: SR };
};
const cut = (src, from, dur) => ({
  samples: src.samples.subarray(Math.floor(from * SR), Math.floor((from + dur) * SR)),
  sampleRate: SR,
});

const SYNTH = synthHumAndKnock(SR, 2.0, 1.25);
const PIANO = cut(load('piano_c.wav'), 0.02, 1.4);
const VIOLIN = cut(load('violin_c.wav'), 0.15, 1.9);
const NOISE = cut(load('noise.wav'), 1.0, 1.2);
const VOICE = cut(load('voice.wav'), 0.4, 6.0);
const SCALE = cut(load('scale.wav'), 0.1, 7.5);

const F0 = (src) => {
  const st = Math.min(src.samples.length - 2048, Math.floor(src.samples.length * 0.15));
  const mag = magnitudeSpectrum(src.samples.subarray(st, st + 2048), 2048);
  const bin = SR / 2048;
  let best = 0; let bk = 1;
  for (let k = Math.ceil(150 / bin); k <= Math.floor(700 / bin); k += 1) if (mag[k] > best) { best = mag[k]; bk = k; }
  return bk * bin;
};

// ---------- 数据面板 ----------

function spectrumPlot(x, y, w, h, src, o = {}) {
  const { fmax = 2000, at = 0.35, c = C.blue } = o;
  const st = Math.max(0, Math.min(src.samples.length - 2048, Math.floor(src.samples.length * at)));
  const mag = magnitudeSpectrum(src.samples.subarray(st, st + 2048), 2048);
  const bin = SR / 2048;
  const kMax = Math.floor(fmax / bin);
  let peak = 1e-12;
  for (let k = 1; k <= kMax; k += 1) peak = Math.max(peak, mag[k]);
  const pts = [];
  for (let k = 1; k <= kMax; k += 1) pts.push([x + (k / kMax) * w, y + h - (mag[k] / peak) * h]);
  return P(pts, { c, w: 3 });
}

async function spectroImage(x, y, w, h, src, o = {}) {
  const { fmax = 2000, floor = -55 } = o;
  const S = stft(src.samples, src.sampleRate, { nfft: 1024, hop: 128 });
  const href = await spectrogramPng(S, {
    w: Math.round(w * 1.8), h: Math.round(h * 1.8), fmax, dbFloor: floor, cmap: 'magma',
  });
  return `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>`
    + R(x, y, w, h, { stroke: C.grid, r: 0 });
}

// ---------- 卡片图标（比网页版大、更简） ----------

function icon(kind, x, y, w, h) {
  const cx = x + w / 2; const cy = y + h / 2;
  let s = R(x, y, w, h, { fill: '#fff', stroke: C.grid, r: 12 });
  if (kind === 'air') {
    s += R(x + 14, cy - 22, 20, 44, { fill: C.soft, stroke: C.blue, sw: 2.5, r: 4 });
    s += PATH(`M${x + 34} ${cy - 18} L${x + 56} ${cy - 32} L${x + 56} ${cy + 32} L${x + 34} ${cy + 18} Z`,
      { c: C.blue, w: 2.5, fill: C.pale });
    [0, 18, 36].forEach((d, i) => {
      s += PATH(`M${x + 68 + d} ${cy - 24 + i * 3} Q${x + 82 + d} ${cy} ${x + 68 + d} ${cy + 24 - i * 3}`,
        { c: i === 2 ? C.warm : C.blue, w: 2.8 });
    });
  }
  if (kind === 'mic') {
    s += R(cx - 16, y + 16, 32, 42, { fill: C.pale, stroke: C.blue, sw: 2.8, r: 16 });
    s += PATH(`M${cx - 27} ${y + 44} Q${cx - 26} ${y + 70} ${cx} ${y + 70} Q${cx + 26} ${y + 70} ${cx + 27} ${y + 44}`,
      { c: C.muted, w: 2.8 });
    s += L(cx, y + 70, cx, y + h - 12, { c: C.muted, w: 2.8 });
  }
  if (kind === 'samples') {
    s += curve(x + 12, y + 12, w - 24, h - 24, (u) => 0.5 + 0.34 * Math.sin(u * 12), 120,
      { c: '#b6c4cf', w: 2 });
    for (let i = 0; i < 8; i += 1) {
      const u = i / 7; const px = x + 12 + u * (w - 24);
      const py = y + 12 + (h - 24) * (1 - (0.5 + 0.34 * Math.sin(u * 12)));
      s += L(px, cy, px, py, { c: C.blue, w: 2 });
      s += O(px, py, 4.5, { fill: C.blue });
    }
  }
  if (kind === 'grid') {
    const band = [0.15, 0.3, 0.85, 0.4, 0.7];
    for (let r = 0; r < 5; r += 1) for (let k = 0; k < 7; k += 1) {
      const t = band[r] * (0.8 + 0.2 * Math.sin(k * 0.9 + r));
      s += R(x + 10 + k * (w - 20) / 7, y + 10 + r * (h - 20) / 5, (w - 20) / 7 - 1.5, (h - 20) / 5 - 1.5,
        { fill: `rgba(150,60,90,${t.toFixed(2)})`, stroke: 'none', r: 1 });
    }
  }
  if (kind === 'decision') {
    [0, 1, 2].forEach((i) => {
      const yy = y + 18 + i * 22;
      s += R(x + 16, yy, 16, 16, { fill: i === 0 ? C.blue : '#fff', stroke: C.blue, sw: 2, r: 3 });
      s += L(x + 42, yy + 8, x + w - 16, yy + 8, { c: i === 0 ? C.blue : '#c3ced8', w: 3 });
    });
  }
  if (kind === 'bulb') {
    s += O(cx, cy - 8, 20, { fill: '#fff4ca', stroke: '#d6a72e', sw: 2.5 });
    s += R(cx - 11, cy + 14, 22, 12, { fill: '#d9e1e8', stroke: C.muted, r: 3 });
    for (let i = 0; i < 8; i += 1) {
      const a = (i * Math.PI) / 4;
      s += L(cx + Math.cos(a) * 29, cy - 8 + Math.sin(a) * 29, cx + Math.cos(a) * 37, cy - 8 + Math.sin(a) * 37,
        { c: '#d6a72e', w: 2.4 });
    }
  }
  if (kind === 'spread') {
    s += O(x + 22, cy, 8, { fill: C.warm });
    [26, 44, 62].forEach((r, i) => {
      s += PATH(`M${x + 22 + r * 0.62} ${cy - r * 0.6} A${r} ${r} 0 0 1 ${x + 22 + r * 0.62} ${cy + r * 0.6}`,
        { c: i === 0 ? C.blue : '#aab8c4', w: 2.4, dash: i === 2 ? '6 5' : '' });
    });
  }
  if (kind === 'meter') {
    s += R(x + 14, y + 16, w - 28, h - 32, { fill: C.pale, stroke: C.muted, sw: 2, r: 8 });
    s += PATH(`M${x + 28} ${cy + 10} Q${cx} ${cy - 26} ${x + w - 28} ${cy + 10}`, { c: C.blue, w: 2.8 });
    s += L(cx, cy + 10, x + w - 34, cy - 16, { c: C.warm, w: 3 });
    s += O(cx, cy + 10, 5, { fill: C.warm });
  }
  return s;
}

// ---------- 卡片 ----------

const CARDS = {};

// 01 ------------------------------------------------------------------

CARDS['01-pipeline'] = async () => {
  const H = CARD.H.full;
  const h0 = head(['一段录音怎样变成', '程序读到的数字']);
  let s = h0.svg;
  const items = [
    ['空气在推挤', '说话、敲击让空气一会儿密一会儿疏', 'air'],
    ['麦克风变成电压', '薄膜跟着空气动，动多少变成电压', 'mic'],
    ['每秒测量上万次', '每次结果记成一个数字', 'samples'],
    ['整理成一种表示', '保留任务需要的时间或频率线索', 'grid'],
    ['程序给出判断', '狗叫、汽车声，或者人在说话', 'decision'],
  ];
  const rs = rows(5, h0.h, 128, 14);
  items.forEach(([title, desc, ic], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 4 ? C.pale : C.plate);
    s += O(r.x + 46, r.y + r.h / 2, 26, { fill: C.blue });
    s += T(r.x + 46, r.y + r.h / 2 + 12, String(i + 1),
      { size: CARD.body, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(r.x + 90, r.y + 52, title, { size: CARD.h2, weight: 700 });
    s += T(r.x + 90, r.y + 96, desc, { size: CARD.small, fill: C.muted });
    s += icon(ic, r.x + r.w - 118, r.y + 19, 100, 90);
    if (i < 4) s += ARROW(r.x + 46, r.y + r.h + 1, r.x + 46, r.y + r.h + 13, { c: '#9ba9b5', w: 2.5, head: 8 });
  });
  return cardDoc(H, s, '录音从空气振动到程序判断的五个步骤');
};

// 三种表示拆成三张卡：一卡讲一种，各自说清它留下什么、丢掉什么
async function viewCard({ name, title, sub, keep, lose, draw, label }) {
  const H = CARD.H.mid;
  const h0 = head([title]);
  let s = h0.svg;
  s += T(CARD.pad, h0.h - 4, sub, { size: CARD.small, fill: C.muted });
  const px = CARD.pad; const py = h0.h + 34; const pw = CARD.W - CARD.pad * 2; const ph = 268;
  s += await draw(px, py, pw, ph);
  const by = py + ph + 62;
  s += T(px, by, '看得见', { size: CARD.small, weight: 700, fill: C.green });
  s += T(px + 120, by, keep, { size: CARD.small });
  s += T(px, by + 46, '看不见', { size: CARD.small, weight: 700, fill: C.warm });
  s += T(px + 120, by + 46, lose, { size: CARD.small });
  return cardDoc(H, s, label);
}

CARDS['01-view-wave'] = () => viewCard({
  title: '波形：看每个瞬间',
  sub: '一段机器声：持续嗡嗡声，中间一下敲击',
  keep: '敲击发生在哪一刻',
  lose: '高音低音各占多少',
  label: '同一段声音的波形',
  draw: async (x, y, w, h) => white(x, y, w, h)
    + L(x + 10, y + h / 2, x + w - 10, y + h / 2, { c: C.grid })
    + wave(SYNTH.samples, x + 10, y + 8, w - 20, h - 16)
    + T(x + 8, y + h + 42, '时间 →', { size: CARD.tick, fill: C.muted }),
});

CARDS['01-view-spectrum'] = () => viewCard({
  title: '频谱：看有哪些成分',
  sub: '同一段声音，不管先后，只统计成分',
  keep: '有几个突出的成分',
  lose: '它们出现在第几秒',
  label: '同一段声音的频谱',
  draw: async (x, y, w, h) => white(x, y, w, h)
    + spectrumPlot(x + 14, y + 14, w - 28, h - 54, SYNTH)
    + axisX(x + 14, y + h - 40, w - 28, [[0, '0'], [500, '500'], [1000, '1k'], [1500, '1.5k'], [2000, '2k']], 0, 2000, { unit: 'Hz' }),
});

CARDS['01-view-spectrogram'] = () => viewCard({
  title: '声谱图：两者一起看',
  sub: '横轴时间，纵轴高低，颜色越亮越强',
  keep: '哪个成分在什么时候出现',
  lose: '代价是要先选好切段长度',
  label: '同一段声音的声谱图',
  draw: async (x, y, w, h) => {
    let s = await spectroImage(x, y, w, h - 40, SYNTH);
    const yy = y + (h - 40) * 0.72;
    s += L(x + w * 0.04, yy, x + w * 0.34, yy, { c: '#ffd9a0', w: 3, dash: '8 6' });
    s += T(x + w * 0.04, yy - 14, '横线 = 一直都在', { size: CARD.tick, weight: 700, fill: '#ffd9a0' });
    const kx = x + w * 0.625;
    s += L(kx, y + 12, kx, y + (h - 40) * 0.5, { c: '#ffd9a0', w: 3, dash: '8 6' });
    s += T(kx - 12, y + 44, '竖线 = 只响一下', { size: CARD.tick, weight: 700, fill: '#ffd9a0', anchor: 'end' });
    s += T(x, y + h + 2, '时间 →', { size: CARD.tick, fill: C.muted });
    s += colorbar(x + w - 150, y + h - 24, 90, 14, 'magma', { lo: '弱', hi: '强', size: CARD.tick });
    return s;
  },
});

CARDS['01-evidence'] = async () => {
  const H = CARD.H.tall;
  const h0 = head(['同一段机器声，', '三种表示各能看见什么']);
  let s = h0.svg;
  const cs = cols(3, h0.h, 438);
  const names = ['波形', '频谱', '声谱图'];
  const tags = [[['嗡嗡声', false], ['敲击', true]], [['嗡嗡声', true], ['敲击', false]], [['嗡嗡声', true], ['敲击', true]]];
  for (let i = 0; i < 3; i += 1) {
    const q = cs[i];
    s += plate(q.x, q.y, q.w, q.h);
    s += T(q.x + 18, q.y + 46, names[i], { size: CARD.h2, weight: 700, fill: i === 2 ? C.warm : C.blue });
    const px = q.x + 16; const py = q.y + 66; const pw = q.w - 32; const ph = 236;
    if (i === 0) s += white(px, py, pw, ph) + wave(SYNTH.samples, px + 6, py + 6, pw - 12, ph - 12);
    else if (i === 1) s += white(px, py, pw, ph) + spectrumPlot(px + 8, py + 10, pw - 16, ph - 20, SYNTH);
    // eslint-disable-next-line no-await-in-loop
    else s += await spectroImage(px, py, pw, ph, SYNTH);
    tags[i].forEach(([lab, ok], k) => {
      const ty = py + ph + 52 + k * 44;
      s += T(q.x + 18, ty, lab, { size: CARD.small });
      s += T(q.x + q.w - 18, ty, ok ? '✓' : '—',
        { size: CARD.h2, weight: 700, fill: ok ? C.green : '#b6c0ca', anchor: 'end' });
    });
  }
  s += T(CARD.pad, h0.h + 438 + 54, '没有最高级的表示，只有证据还在不在。',
    { size: CARD.body, weight: 700, fill: C.warm });
  return cardDoc(H, s, '三种表示对嗡嗡声与敲击的保留差异');
};

// 02 ------------------------------------------------------------------

CARDS['02-air-to-numbers'] = async () => {
  const H = CARD.H.tall;
  const h0 = head(['空气的变化怎样', '变成录音里的数字']);
  let s = h0.svg;
  const items = [
    ['纸盆来回运动', '往外推空气变密，往回收变疏', 'air'],
    ['疏密向外传播', '空气只在原地动，传的是变化', 'spread'],
    ['薄膜跟着动', '位置不同，记录到的也不同', 'mic'],
    ['反复测量', '每次结果记成一个数字', 'samples'],
  ];
  const rs = rows(4, h0.h, 118, 14);
  items.forEach(([title, desc, ic], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 3 ? C.pale : C.plate);
    s += O(r.x + 42, r.y + r.h / 2, 24, { fill: C.blue });
    s += T(r.x + 42, r.y + r.h / 2 + 11, String(i + 1),
      { size: CARD.small, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(r.x + 82, r.y + 48, title, { size: CARD.h2, weight: 700 });
    s += T(r.x + 82, r.y + 90, desc, { size: CARD.small, fill: C.muted });
    s += icon(ic, r.x + r.w - 112, r.y + 14, 96, 90);
  });
  return cardDoc(H, s, '声音从纸盆推动空气到麦克风记录数字');
};

CARDS['02-three-structures'] = async () => {
  const H = CARD.H.mid;
  const h0 = head(['波形里常见的三种结构']);
  let s = h0.svg;
  const items = [
    ['周期：一遍遍重复', VIOLIN, C.blue],
    ['噪声：找不到规律', NOISE, C.blue],
    ['瞬态：只响一瞬间', cut(SYNTH, 1.18, 0.5), C.warm],
  ];
  const rs = rows(3, h0.h, 116, 16);
  items.forEach(([title, src, c], i) => {
    const r = rs[i];
    s += T(r.x, r.y + 40, title, { size: CARD.h2, weight: 700, fill: c });
    s += white(r.x + 330, r.y, r.w - 330, r.h);
    s += wave(src.samples, r.x + 342, r.y + 10, r.w - 354, r.h - 20, { c });
  });
  s += T(CARD.pad, h0.h + 3 * 116 + 2 * 16 + 46, '真实录音里三者几乎总是同时存在。',
    { size: CARD.small, fill: C.muted });
  return cardDoc(H, s, '周期、噪声与瞬态三种波形结构');
};

CARDS['02-sine-knobs'] = async () => {
  const H = CARD.H.tall;
  const h0 = head(['正弦波的三个参数']);
  let s = h0.svg;
  const base = (u) => 0.5 + 0.2 * Math.sin(u * 22);
  const items = [
    ['振幅', '抖动有多大', (u) => 0.5 + 0.38 * Math.sin(u * 22)],
    ['频率', '一秒重复多少次', (u) => 0.5 + 0.2 * Math.sin(u * 44)],
    ['相位', '从一轮的哪里开始', (u) => 0.5 + 0.2 * Math.sin(u * 22 + Math.PI * 0.9)],
  ];
  const rs = rows(3, h0.h, 142, 18);
  items.forEach(([name, desc, fn], i) => {
    const r = rs[i];
    s += T(r.x, r.y + 50, name, { size: CARD.h1 - 6, weight: 700, fill: C.blue });
    s += T(r.x, r.y + 100, desc, { size: CARD.small, fill: C.muted });
    const px = r.x + 300; const pw = r.w - 300;
    s += white(px, r.y, pw, r.h);
    s += curve(px + 14, r.y + 12, pw - 28, r.h - 24, base, 300, { c: '#bcc8d2', w: 2.5 });
    s += curve(px + 14, r.y + 12, pw - 28, r.h - 24, fn, 300, { c: C.blue, w: 3.5 });
  });
  s += T(CARD.pad, h0.h + 3 * 142 + 2 * 18 + 44, '灰线是原来，蓝线是只改了这一个参数。',
    { size: CARD.small, fill: C.muted });
  return cardDoc(H, s, '振幅、频率与相位分别改变什么');
};

CARDS['02-note-vs-hz'] = async () => {
  const H = CARD.H.mid;
  const h0 = head(['琴键一格一格数，', '赫兹一倍一倍翻']);
  let s = h0.svg;
  const gx = CARD.pad + 76; const gy = h0.h + 16; const gw = 470; const gh = 312;
  s += plate(CARD.pad, h0.h, gw + 110, gh + 78);
  const X = (m) => gx + ((m - 57) / 36) * gw;
  const Y = (f) => gy + gh - (Math.log2(f / 180) / Math.log2(1900 / 180)) * gh;
  [220, 440, 880, 1760].forEach((f) => {
    s += L(gx, Y(f), gx + gw, Y(f), { c: C.grid });
    s += T(gx - 14, Y(f) + 11, String(f), { size: CARD.tick, fill: C.muted, anchor: 'end' });
  });
  const pts = [];
  for (let m = 57; m <= 93; m += 0.5) pts.push([X(m), Y(440 * 2 ** ((m - 69) / 12))]);
  s += P(pts, { c: C.blue, w: 4 });
  [[57, 220], [69, 440], [81, 880], [93, 1760]].forEach(([m, f]) => {
    s += O(X(m), Y(f), 9, { fill: '#fff', stroke: C.blue, sw: 4 });
  });
  s += T(gx + gw / 2, gy + gh + 50, '琴键编号 →', { size: CARD.tick, fill: C.muted, anchor: 'middle' });
  const tx = CARD.pad + gw + 128;
  s += MT(tx, h0.h + 88, ['每往上', '12 个键', '频率 × 2'], { size: CARD.h2, weight: 700, leading: 50 });
  s += MT(tx, h0.h + 262, ['220 → 440', '→ 880 → 1760'], { size: CARD.small, fill: C.muted, leading: 44 });
  return cardDoc(H, s, '音符编号与频率的倍数关系');
};

// 03 ------------------------------------------------------------------

CARDS['03-lamp-analogy'] = async () => {
  const H = CARD.H.mid;
  const h0 = head(['三个「声音大小」', '说的不是同一件事']);
  let s = h0.svg;
  const items = [
    ['声功率', '声源放出多少，像灯泡多少瓦', 'bulb'],
    ['声强', '传到这里每平方米剩多少', 'spread'],
    ['声压', '麦克风在这一点量到什么', 'meter'],
  ];
  const rs = rows(3, h0.h, 104, 14);
  items.forEach(([name, desc, ic], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i === 2 ? C.pale : C.plate);
    s += T(r.x + 24, r.y + 64, name, { size: CARD.h1 - 8, weight: 700, fill: C.blue });
    s += T(r.x + 210, r.y + 62, desc, { size: CARD.small, fill: C.muted });
    s += icon(ic, r.x + r.w - 104, r.y + 10, 88, 84);
  });
  s += T(CARD.pad, h0.h + 3 * 104 + 2 * 14 + 48, '放出、传到、测到，必须分开讨论。',
    { size: CARD.body, weight: 700, fill: C.warm });
  return cardDoc(H, s, '声功率、声强与声压的区别');
};

CARDS['03-distance'] = async () => {
  const H = CARD.H.wide;
  const h0 = head(['距离翻倍，能量摊到四倍面积']);
  let s = h0.svg;
  const y = h0.h + 6;
  s += plate(CARD.pad, y, 400, 230);
  const sx = CARD.pad + 90; const sy = y + 115;
  s += O(sx, sy, 13, { fill: C.warm });
  s += T(sx, sy + 50, '声源', { size: CARD.tick, fill: C.muted, anchor: 'middle' });
  s += PATH(`M${sx + 56} ${sy - 62} A92 92 0 0 1 ${sx + 56} ${sy + 62}`, { c: C.blue, w: 3.5 });
  s += PATH(`M${sx + 130} ${sy - 96} A170 170 0 0 1 ${sx + 130} ${sy + 96}`, { c: C.muted, w: 3.5, dash: '9 7' });
  s += T(sx + 64, sy - 70, '1 米', { size: CARD.small, weight: 700, fill: C.blue });
  s += T(sx + 140, sy - 100, '2 米', { size: CARD.small, weight: 700, fill: C.muted });

  const bx = CARD.pad + 430;
  s += R(bx, y + 22, 74, 74, { fill: 'rgba(8,120,185,.62)', stroke: C.blue, sw: 2, r: 6 });
  s += T(bx + 96, y + 52, '1 米：一格', { size: CARD.small, weight: 700 });
  s += T(bx + 96, y + 92, '每格 1 份', { size: CARD.small, fill: C.muted });
  for (let a = 0; a < 2; a += 1) for (let b = 0; b < 2; b += 1) {
    s += R(bx + a * 40, y + 130 + b * 40, 36, 36, { fill: 'rgba(8,120,185,.18)', stroke: C.blue, sw: 2, r: 4 });
  }
  s += T(bx + 96, y + 162, '2 米：四格', { size: CARD.small, weight: 700 });
  s += T(bx + 96, y + 202, '每格只剩 1/4', { size: CARD.small, weight: 700, fill: C.warm });
  s += T(CARD.pad, y + 282, '前提：空旷、无反射、各方向均匀发声。', { size: CARD.tick, fill: C.muted });
  return cardDoc(H, s, '距离翻倍声强降到四分之一');
};

CARDS['03-decibel'] = async () => {
  const H = CARD.H.mid;
  const h0 = head(['分贝把巨大的倍数', '压成好比较的数字']);
  let s = h0.svg;
  const gx = CARD.pad + 76; const gy = h0.h + 20; const gw = 500; const gh = 250;
  s += plate(CARD.pad, h0.h, gw + 120, gh + 96);
  const X = (e) => gx + (e / 12) * gw;
  const Y = (db) => gy + gh - (db / 120) * gh;
  for (let e = 0; e <= 12; e += 4) {
    s += L(X(e), gy, X(e), gy + gh, { c: C.grid });
    s += T(X(e), gy + gh + 46, e === 0 ? '1 倍' : `10^${e}`, { size: CARD.tick, fill: C.muted, anchor: 'middle' });
  }
  for (let db = 0; db <= 120; db += 60) {
    s += L(gx, Y(db), gx + gw, Y(db), { c: C.grid });
    s += T(gx - 14, Y(db) + 11, String(db), { size: CARD.tick, fill: C.muted, anchor: 'end' });
  }
  s += P([[X(0), Y(0)], [X(12), Y(120)]], { c: C.blue, w: 5 });
  [[0, 0], [6, 60], [12, 120]].forEach(([e, db]) => s += O(X(e), Y(db), 9, { fill: '#fff', stroke: C.blue, sw: 4 }));
  s += T(gx - 14, gy - 12, 'dB', { size: CARD.tick, fill: C.muted, anchor: 'end' });
  const tx = CARD.pad + gw + 138;
  s += MT(tx, h0.h + 70, ['分贝永远是', '「相对于', '某个参考」'], { size: CARD.h2, weight: 700, leading: 48 });
  s += MT(tx, h0.h + 232, ['参考换了，', '数就不能比'], { size: CARD.small, fill: C.warm, leading: 44 });
  return cardDoc(H, s, '分贝把一万亿倍范围压成一条直线');
};

CARDS['03-timbre-parts'] = async () => {
  const H = CARD.H.wide;
  const h0 = head(['音色之一：成分比例不同']);
  let s = h0.svg;
  s += T(CARD.pad, h0.h - 2, '两段音高相同，更高成分的强弱不同', { size: CARD.small, fill: C.muted });
  const y0 = h0.h + 30;
  [['钢琴', PIANO, C.blue], ['小提琴', VIOLIN, C.warm]].forEach(([name, src, c], k) => {
    const y = y0 + k * 118;
    s += T(CARD.pad, y + 36, name, { size: CARD.h2, weight: 700, fill: c });
    const bx = CARD.pad + 200; const bw = CARD.W - CARD.pad - bx; const bh = 78;
    const st = Math.min(src.samples.length - 2048, Math.floor(src.samples.length * 0.15));
    const mag = magnitudeSpectrum(src.samples.subarray(st, st + 2048), 2048);
    const bin = SR / 2048; const f0 = F0(src);
    const bars = [];
    for (let n = 1; n <= 6; n += 1) {
      const k0 = Math.round((f0 * n) / bin);
      let m = 0;
      for (let d = -2; d <= 2; d += 1) m = Math.max(m, mag[k0 + d] ?? 0);
      bars.push(m);
    }
    const mx = Math.max(...bars, 1e-12);
    const slot = bw / 6;
    s += L(bx, y + bh + 8, bx + bw, y + bh + 8, { c: C.grid });
    bars.forEach((v, n) => {
      const db = 20 * Math.log10(Math.max(v, 1e-12) / mx);
      const hh = Math.max(3, ((db + 42) / 42) * bh);
      s += R(bx + n * slot, y + bh + 8 - hh, slot - 12, hh, { fill: n === 0 ? c : C.soft, stroke: c, sw: 2, r: 4 });
    });
  });
  s += T(CARD.pad + 200, y0 + 254, '基本音', { size: CARD.tick, fill: C.muted });
  s += T(CARD.W - CARD.pad, y0 + 254, '更高的成分 →', { size: CARD.tick, fill: C.muted, anchor: 'end' });
  s += T(CARD.pad, y0 + 300, '素材：piano_c.wav 与 violin_c.wav', { size: CARD.tick, fill: C.muted });
  return cardDoc(H, s, '钢琴与小提琴的谐波强度分布不同');
};

CARDS['03-timbre-envelope'] = async () => {
  const H = CARD.H.wide;
  const h0 = head(['音色之二：起音方式不同']);
  let s = h0.svg;
  s += T(CARD.pad, h0.h - 2, '声音怎样开始、怎样收尾，叫包络', { size: CARD.small, fill: C.muted });
  const y0 = h0.h + 26;
  [['钢琴：一敲到顶，再慢慢衰减', PIANO, C.blue], ['小提琴：慢慢拉响，一直保持', VIOLIN, C.warm]]
    .forEach(([lab, src, c], k) => {
      const y = y0 + k * 132;
      s += white(CARD.pad, y, CARD.W - CARD.pad * 2, 82);
      s += wave(src.samples, CARD.pad + 10, y + 6, CARD.W - CARD.pad * 2 - 20, 70, { c });
      s += T(CARD.pad, y + 122, lab, { size: CARD.small, fill: c });
    });
  s += T(CARD.pad, y0 + 292, '音高和响度相同，音色仍然可能不同。', { size: CARD.small, weight: 700, fill: C.warm });
  return cardDoc(H, s, '钢琴与小提琴的包络不同');
};

// 04 ------------------------------------------------------------------

CARDS['04-two-decisions'] = async () => {
  const H = CARD.H.wide;
  const h0 = head(['连续声音变成数字，', '要做两个决定']);
  let s = h0.svg;
  const cs = cols(3, h0.h, 316);
  const fn = (u) => 0.5 + 0.36 * Math.sin(u * 7.2 + 0.4);
  const items = [['原来的样子', 'continuous'], ['决定一：多久量一次', 'samples'], ['决定二：靠到最近档位', 'levels']];
  items.forEach(([title, type], i) => {
    const q = cs[i];
    s += plate(q.x, q.y, q.w, q.h, i === 0 ? C.plate : C.pale);
    s += MT(q.x + 16, q.y + 44, title.length > 8 ? [title.slice(0, 4), title.slice(4)] : [title],
      { size: CARD.small, weight: 700, fill: i === 0 ? C.ink : C.blue, leading: 40 });
    const px = q.x + 16; const py = q.y + 118; const pw = q.w - 32; const ph = 180;
    s += white(px, py, pw, ph);
    if (type === 'continuous') s += curve(px + 8, py + 8, pw - 16, ph - 16, fn, 200, { c: C.blue, w: 4 });
    if (type === 'samples') {
      s += curve(px + 8, py + 8, pw - 16, ph - 16, fn, 200, { c: '#c3ced8', w: 2.5 });
      for (let k = 0; k < 9; k += 1) {
        const u = k / 8;
        s += O(px + 8 + u * (pw - 16), py + 8 + (ph - 16) * (1 - fn(u)), 6, { fill: C.blue });
      }
    }
    if (type === 'levels') {
      for (let k = 0; k < 5; k += 1) s += L(px + 8, py + 8 + k * (ph - 16) / 4, px + pw - 8, py + 8 + k * (ph - 16) / 4, { c: C.grid });
      s += curve(px + 8, py + 8, pw - 16, ph - 16, fn, 200, { c: '#d3dce4', w: 2.5 });
      for (let k = 0; k < 9; k += 1) {
        const u = k / 8; const q2 = Math.round(fn(u) * 4) / 4;
        s += O(px + 8 + u * (pw - 16), py + 8 + (ph - 16) * (1 - q2), 6, { fill: C.blue });
      }
    }
    if (i < 2) s += ARROW(q.x + q.w + 4, q.y + q.h / 2, cs[i + 1].x - 4, q.y + q.h / 2, { c: '#9ba9b5' });
  });
  return cardDoc(H, s, '采样与量化两个决定');
};

CARDS['04-aliasing'] = async () => {
  const H = CARD.H.mid;
  const h0 = head(['采样太慢，', '高频会伪装成低频']);
  let s = h0.svg;
  const gx = CARD.pad; const gy = h0.h; const gw = CARD.W - CARD.pad * 2; const gh = 250;
  s += white(gx, gy, gw, gh);
  s += L(gx + 10, gy + gh / 2, gx + gw - 10, gy + gh / 2, { c: C.grid });
  const f7 = (u) => 0.5 + 0.38 * Math.sin(2 * Math.PI * 7 * u);
  const f3 = (u) => 0.5 - 0.38 * Math.sin(2 * Math.PI * 3 * u);
  s += curve(gx + 10, gy + 10, gw - 20, gh - 20, f7, 900, { c: '#aab8c4', w: 3 });
  s += curve(gx + 10, gy + 10, gw - 20, gh - 20, f3, 900, { c: C.blue, w: 4.5 });
  for (let k = 0; k <= 10; k += 1) {
    const u = k / 10;
    s += O(gx + 10 + u * (gw - 20), gy + 10 + (gh - 20) * (1 - f7(u)), 10, { fill: '#fff', stroke: C.warm, sw: 4 });
  }
  const ty = gy + gh + 52;
  s += T(gx, ty, '灰线：每秒 7 次', { size: CARD.small, fill: '#7b8b99' });
  s += T(gx + 340, ty, '蓝线：看起来 3 次', { size: CARD.small, fill: C.blue, weight: 700 });
  s += T(gx, ty + 44, '橙圈：每秒只测量 10 次，两条线上的点完全相同',
    { size: CARD.small, weight: 700, fill: C.warm });
  return cardDoc(H, s, '每秒采样十次时七赫兹混叠为三赫兹');
};

CARDS['04-levels'] = async () => {
  const H = CARD.H.wide;
  const h0 = head(['位深越高，档位越密']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 282);
  [[3, 8, '3 位：8 个档位', '台阶明显'], [5, 32, '5 位：32 个档位', '几乎贴着原线']]
    .forEach(([bits, levels, title, note], i) => {
      const q = cs[i];
      s += plate(q.x, q.y, q.w, q.h);
      s += T(q.x + 20, q.y + 48, title, { size: CARD.h2, weight: 700, fill: C.blue });
      const px = q.x + 18; const py = q.y + 78; const pw = q.w - 36; const ph = 152;
      s += white(px, py, pw, ph);
      const fn = (u) => 0.5 + 0.4 * Math.sin(u * 6.6);
      s += curve(px + 8, py + 8, pw - 16, ph - 16, fn, 300, { c: '#bac6d0', w: 3 });
      const pts = [];
      for (let k = 0; k <= 80; k += 1) {
        const u = k / 80; const qq = Math.round(fn(u) * (levels - 1)) / (levels - 1);
        const xx = px + 8 + u * (pw - 16); const yy = py + 8 + (ph - 16) * (1 - qq);
        if (pts.length) pts.push([xx, pts[pts.length - 1][1]]);
        pts.push([xx, yy]);
      }
      s += P(pts, { c: C.blue, w: 3.5 });
      s += T(q.x + 20, q.y + 262, note, { size: CARD.small, fill: C.muted });
    });
  s += T(CARD.pad, h0.h + 330, '灰线是原值，蓝色阶梯是量化后的值。', { size: CARD.small, fill: C.muted });
  return cardDoc(H, s, '三位与五位量化档位对比');
};

CARDS['04-tradeoff'] = async () => {
  const H = CARD.H.wide;
  const h0 = head(['两个数字，各换来什么']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 260);
  const items = [
    ['采样率更高', '换来：记得下更高的成分', '代价：文件大、算得慢', '任务需要高频时才值'],
    ['位深更高', '换来：档位更密，误差更小', '代价：文件同样变大', '现场够安静时才值'],
  ];
  items.forEach(([title, gain, cost, note], i) => {
    const q = cs[i];
    s += plate(q.x, q.y, q.w, q.h, C.pale);
    s += T(q.x + 22, q.y + 54, title, { size: CARD.h1 - 8, weight: 700, fill: C.blue });
    s += T(q.x + 22, q.y + 112, gain, { size: CARD.small });
    s += T(q.x + 22, q.y + 158, cost, { size: CARD.small, fill: C.muted });
    s += R(q.x + 18, q.y + 186, q.w - 36, 56, { fill: '#fff3ef', stroke: '#efd0c6', r: 10 });
    s += T(q.x + q.w / 2, q.y + 222, note, { size: CARD.small, weight: 700, fill: C.warm, anchor: 'middle' });
  });
  s += T(CARD.pad, h0.h + 306, '不是越大越专业，而是刚好覆盖任务需要。',
    { size: CARD.body, weight: 700 });
  return cardDoc(H, s, '提高采样率与位深的收益和代价');
};

// 05 ------------------------------------------------------------------

CARDS['05-four-questions'] = async () => {
  const H = CARD.H.tall;
  const h0 = head(['选特征前，先回答四个问题']);
  let s = h0.svg;
  const items = [
    ['抽象层级', '目标能拆成可测量的现象吗？'],
    ['时间尺度', '看一瞬间、一小段，还是整段？'],
    ['信号域', '看时间、看成分，还是一起看？'],
    ['产生方式', '按公式算，还是让模型学？'],
  ];
  const rs = rows(4, h0.h, 116, 14);
  items.forEach(([name, q], i) => {
    const r = rs[i];
    s += plate(r.x, r.y, r.w, r.h, i % 2 ? '#fff' : C.pale);
    s += O(r.x + 44, r.y + r.h / 2, 25, { fill: C.blue });
    s += T(r.x + 44, r.y + r.h / 2 + 12, String(i + 1),
      { size: CARD.small, weight: 700, fill: '#fff', anchor: 'middle' });
    s += T(r.x + 86, r.y + 50, name, { size: CARD.h2, weight: 700, fill: C.blue });
    s += T(r.x + 86, r.y + 92, q, { size: CARD.small, fill: C.muted });
  });
  s += T(CARD.pad, h0.h + 4 * 116 + 3 * 14 + 48, '四个答案共同决定一个特征，不是四选一。',
    { size: CARD.body, weight: 700, fill: C.warm });
  return cardDoc(H, s, '选择音频特征的四个问题');
};

CARDS['05-time-scale'] = async () => {
  const H = CARD.H.mid;
  const h0 = head(['窗口越长，覆盖越多，', '位置越模糊']);
  let s = h0.svg;
  s += plate(CARD.pad, h0.h, CARD.W - CARD.pad * 2, 96);
  s += wave(VOICE.samples, CARD.pad + 14, h0.h + 12, CARD.W - CARD.pad * 2 - 28, 72);
  const rowsY = h0.h + 128;
  const barMax = 300;
  [['一个采样点', 0.012, '只知道这一瞬间'],
    ['几十毫秒', 0.07, '看局部质地'],
    ['几秒钟', 0.42, '看一个完整事件'],
    ['整段录音', 1, '只剩总体统计']].forEach(([name, frac, note], i) => {
    const y = rowsY + i * 54;
    s += R(CARD.pad, y, Math.max(7, barMax * frac), 26, {
      fill: i === 3 ? '#dfe6ec' : C.soft, stroke: C.blue, sw: 2, r: 6,
    });
    s += T(CARD.pad + barMax + 22, y + 22, name, { size: CARD.small, weight: 700 });
    s += T(CARD.pad + barMax + 200, y + 22, note, { size: CARD.small, fill: C.muted });
  });
  return cardDoc(H, s, '从一个采样点到整段录音的时间尺度');
};

CARDS['05-three-angles'] = async () => {
  const H = CARD.H.mid;
  const h0 = head(['同一段音阶，三种观察角度']);
  let s = h0.svg;
  const cs = cols(3, h0.h, 372);
  const names = ['看时间起伏', '看成分分布', '两者一起看'];
  for (let i = 0; i < 3; i += 1) {
    const q = cs[i];
    s += T(q.x, q.y + 34, names[i], { size: CARD.h2 - 2, weight: 700, fill: C.blue });
    const py = q.y + 56; const ph = q.h - 56;
    if (i === 0) s += white(q.x, py, q.w, ph) + wave(SCALE.samples, q.x + 8, py + 8, q.w - 16, ph - 16);
    else if (i === 1) s += white(q.x, py, q.w, ph) + spectrumPlot(q.x + 10, py + 12, q.w - 20, ph - 24, SCALE, { fmax: 3000 });
    // eslint-disable-next-line no-await-in-loop
    else s += await spectroImage(q.x, py, q.w, ph, SCALE, { fmax: 3000 });
  }
  s += T(CARD.pad, h0.h + 372 + 48, '素材 scale.wav。右图里一级级往上的亮块，就是一个个音。',
    { size: CARD.tick, fill: C.muted });
  return cardDoc(H, s, '时间、成分与时频三种观察角度');
};

CARDS['05-rule-vs-learn'] = async () => {
  const H = CARD.H.wide;
  const h0 = head(['特征的两种来源，可以组合']);
  let s = h0.svg;
  const cs = cols(2, h0.h, 222);
  [['人工规则算', ['含义清楚、好排查', '样本少也能用']],
    ['模型自己学', ['能学复杂关系', '但吃数据和算力']]].forEach(([title, lines], i) => {
    const q = cs[i];
    s += plate(q.x, q.y, q.w, q.h);
    s += T(q.x + 22, q.y + 56, title, { size: CARD.h1 - 8, weight: 700, fill: C.blue });
    s += MT(q.x + 22, q.y + 108, lines, { size: CARD.small, fill: C.muted, leading: 44 });
  });
  s += ARROW(cs[0].x + cs[0].w + 2, h0.h + 111, cs[1].x - 2, h0.h + 111, { c: C.warm });
  const by = h0.h + 250;
  s += R(CARD.pad, by, CARD.W - CARD.pad * 2, 100, { fill: '#fff3ef', stroke: '#efd0c6', r: 14 });
  s += MT(CARD.W / 2, by + 44, ['常见做法', '前面用稳定规则，后面交给模型学'],
    { size: CARD.small, weight: 700, fill: C.warm, anchor: 'middle', leading: 44 });
  return cardDoc(H, s, '人工规则特征与模型学习特征的组合');
};

// ---------- 输出 ----------

const names = Object.keys(CARDS);
for (const name of names) {
  // eslint-disable-next-line no-await-in-loop
  writeFileSync(join(OUT, `${name}.svg`), await CARDS[name](), 'utf8');
}
console.log(`生成 ${names.length} 张卡片图 → ${OUT}`);
names.forEach((n) => console.log(`  ${n}`));
