#!/usr/bin/env node
// 第 02–06 课教程式版新增的配图，同时出电脑版和手机版。
//
//   node tools/build-figures-02-05-tutorial.mjs
//
// 这些图替换掉原来用 ```text 画的 ASCII 块。ASCII 块在 360 px 手机上会横向
// 溢出、进不了小红书卡片、机检也扫不到，见 SKILL.md 第五节。
//
// 04-alias-samples 的数值是确定性的（纯正弦，没有随机数），所以直接在这里算，
// 不像第 01 课那样要先跑 Python。

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODES, wide, doc, T, MT, R, L, P, O, ARROW, header, headerH,
  twoRoutes, chain, BLUE, WARM, GREEN, GOLD, INK, MUTED, GRID, PLATE,
} from './lib/tutorial-figure.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REWRITE = join(ROOT, 'NotebookLM课程博客_重写版');
// 图名开头的课号决定它归哪一组，06 的图不能落到 01-05 的目录里
const baseFor = (name) => join(REWRITE,
  Number(name.slice(0, 2)) <= 5 ? '零基础版_01-05' : '零基础版_06-10', 'figures');

const FIG = {};

// ---------------------------------------------------------------- 02

FIG['02-why-waveform'] = (M) => twoRoutes(M,
  ['听得见的声音，', '怎么变成算得动的数字'],
  [
    {
      tag: '只靠耳朵', color: WARM, fill: '#fbf0ec',
      steps: ['空气振动', '耳朵', '“这是钢琴”'],
      end: '没有中间量',
      note: '结论是对的，但中间没有任何东西可以加减乘除',
    },
    {
      tag: '录成波形', color: GREEN, fill: '#eef7f2',
      steps: ['空气振动', '麦克风', '每秒两万多个数字'],
      end: '可以画、可以算、可以比',
      note: '把听觉换成一串带时间顺序的数，后面所有计算才有落脚点',
    },
  ],
  '只靠耳朵与录成波形两条路线的对比');

// ---------------------------------------------------------------- 03

FIG['03-mixup-cost'] = (M) => twoRoutes(M,
  ['把仪器读数当听感，', '错在哪一步'],
  [
    {
      tag: '混着用', color: WARM, fill: '#fbf0ec',
      steps: ['测出 RMS 相同', '说“一样响”', '用户反馈一个更吵'],
      end: '查不出原因',
      note: 'RMS 看不见频率分布，所以你手上没有能解释这件事的数',
    },
    {
      tag: '分清之后', color: GREEN, fill: '#eef7f2',
      steps: ['RMS 相同', '但频率分布不同', '中高频多的更响'],
      end: '换听感相关的指标',
      note: '知道该换 LUFS，也知道为什么要换',
    },
  ],
  '混用仪器读数与分清之后两条路线的对比');

FIG['03-loudness-chain'] = (M) => chain(M,
  ['从声源到耳朵，', '中间隔着六个不同的量'],
  [
    { name: '声功率', desc: ['声源每秒', '放出多少'], color: BLUE, why: '摊在越来越大的球面上' },
    { name: '声强', desc: ['这里每平方米', '通过多少'], color: BLUE, why: '麦克风感受的是压力' },
    { name: '声压', desc: ['麦克风', '真正量到的'], color: BLUE, why: '范围太大，改写成对数' },
    { name: '分贝', desc: ['两个量的比值', '写成对数'], color: GOLD, why: '耳朵对各频率不一样敏感' },
    { name: '响度', desc: ['听觉给出的', '判断'], color: WARM, why: '减掉高低和响度之后' },
    { name: '音色', desc: ['还剩下的', '那点差别'], color: WARM },
  ],
  '前三个是物理量，第四个只是记法，后两个是感觉——混用就会出错。',
  '声功率、声强、声压、分贝、响度、音色六个量组成的链条');

// ---------------------------------------------------------------- 04

FIG['04-adc-order'] = (M) => {
  const head = ['连续电压变成数字：', '三步，顺序不能换'];
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const w = wide(M);
  let s = header(M, head);

  const steps = [
    ['① 抗混叠滤波', ['先砍掉记不清楚的高频'], GREEN, '#eef7f2'],
    ['② 采样', ['每 1/fs 秒量一次'], BLUE, '#edf6fc'],
    ['③ 量化', ['靠到最近的档位'], BLUE, '#edf6fc'],
  ];
  let y = top + 6;

  if (w) {
    const bw = (pw - 2 * 34) / 3;
    steps.forEach(([name, desc, c, fill], i) => {
      const bx = px + i * (bw + 34);
      s += R(bx, y, bw, 80, { fill, stroke: c, sw: 1.8, r: 9 });
      s += T(bx + bw / 2, y + 32, name, { size: M.h2, weight: 700, fill: c, anchor: 'middle' });
      s += T(bx + bw / 2, y + 58, desc[0], { size: M.small, fill: MUTED, anchor: 'middle' });
      if (i < 2) s += ARROW(bx + bw + 6, y + 40, bx + bw + 28, y + 40, { c: MUTED, w: 2 });
    });
    y += 80;
  } else {
    steps.forEach(([name, desc, c, fill], i) => {
      s += R(px, y, pw, 52, { fill, stroke: c, sw: 1.8, r: 9 });
      s += T(px + 14, y + 24, name, { size: M.h2, weight: 700, fill: c });
      s += T(px + 14, y + 43, desc[0], { size: M.small, fill: MUTED });
      if (i < 2) s += ARROW(px + 26, y + 54, px + 26, y + 66, { c: MUTED, w: 2, head: 6 });
      y += 70;
    });
    y -= 18;
  }

  // 反例：先采样再滤波
  const by = y + (w ? 30 : 26);
  s += R(px, by, pw, w ? 62 : 76, { fill: '#fbf0ec', stroke: WARM, sw: 1.6, r: 9 });
  s += T(px + 16, by + 26, '× 先采样，再滤波', { size: M.h2, weight: 700, fill: WARM });
  s += MT(px + 16, by + (w ? 48 : 48),
    w ? ['假的低频这时候已经和真的长得一模一样了，再滤也分不开。']
      : ['假的低频这时候已经和真的一模一样，', '再滤也分不开。'],
    { size: M.small, fill: MUTED, leading: 19 });
  const h = by + (w ? 62 : 76) + 14;
  return doc(M.W, h, s, '抗混叠滤波、采样、量化三步的先后顺序，以及顺序颠倒的后果');
};

FIG['04-alias-samples'] = (M) => {
  const head = ['三个不同的声音，', '同一台设备记下来一模一样'];
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const w = wide(M);
  let s = header(M, head);

  const fs = 10;
  const N = 11;
  const rows = [
    [3, BLUE, '真实 3 Hz'],
    [7, GREEN, '真实 7 Hz'],
    [13, WARM, '真实 13 Hz'],
  ];
  const ph = w ? 96 : 84;
  const plotX = px + (w ? 92 : 74);
  const plotW = pw - (w ? 92 : 74);
  let y = top + 6;

  rows.forEach(([f, c, name]) => {
    const mid = y + ph / 2;
    s += R(plotX, y, plotW, ph, { fill: '#fff', stroke: GRID, r: 6 });
    s += L(plotX + 6, mid, plotX + plotW - 6, mid, { c: GRID });
    s += T(px, mid - 4, name, { size: M.small, weight: 700, fill: c });
    // 真实曲线
    const pts = [];
    for (let i = 0; i <= 400; i += 1) {
      const t = (i / 400) * (N - 1) / fs;
      pts.push([plotX + 8 + (i / 400) * (plotW - 16),
        mid - Math.sin(2 * Math.PI * f * t) * (ph / 2 - 12)]);
    }
    s += P(pts, { c: `${c}55`, w: 1.6 });
    // 采样点
    for (let n = 0; n < N; n += 1) {
      const v = Math.sin((2 * Math.PI * f * n) / fs);
      const x = plotX + 8 + (n / (N - 1)) * (plotW - 16);
      const yy = mid - v * (ph / 2 - 12);
      s += L(x, mid, x, yy, { c: `${c}66`, w: 1.4 });
      s += O(x, yy, w ? 4.5 : 4, { fill: c });
    }
    y += ph + (w ? 16 : 14);
  });

  s += T(px, y + (w ? 16 : 14),
    '每秒只量 10 次（圆点）。三行圆点的高度完全一样——13 Hz 和 3 Hz 一模一样，7 Hz 是它的上下翻转。',
    { size: M.small, fill: MUTED });
  s += T(px, y + (w ? 42 : 40),
    '事后没有任何算法能分辨原来是哪一个。',
    { size: M.body, weight: 700, fill: WARM });
  return doc(M.W, y + (w ? 60 : 58), s,
    '3 Hz、7 Hz、13 Hz 在每秒 10 次采样下留下完全相同的数值');
};

// ---------------------------------------------------------------- 05

FIG['05-list-vs-backward'] = (M) => twoRoutes(M,
  ['挑音频特征：', '照单全算，还是按任务倒推'],
  [
    {
      tag: '照单全算', color: WARM, fill: '#fbf0ec',
      steps: ['算 20 种特征', '拼成一个大向量', '训练', '准确率 62%'],
      end: '然后呢？',
      note: '不知道哪一维有用、哪一维在添乱，只能换个更大的模型再试',
    },
    {
      tag: '按任务倒推', color: GREEN, fill: '#eef7f2',
      steps: ['先问要什么证据', '只算能提供它的', '准确率 62%'],
      end: '检查证据在不在数据里',
      note: '效果一样，但下一步该做什么是明确的',
    },
  ],
  '照单全算与按任务倒推两条路线的对比');

// ---------------------------------------------------------------- 06

FIG['06-why-framing'] = (M) => twoRoutes(M,
  ['十几万个数字，', '整段算和逐个算都不行'],
  [
    {
      tag: '整段压成一个数', color: WARM, fill: '#fbf0ec',
      steps: ['十几万个数字', '求一个平均值'],
      end: '第几秒响的，没了',
      note: '有数值可以比，但时间位置被抹掉了',
    },
    {
      tag: '逐个数字看', color: GOLD, fill: '#fdf6e6',
      steps: ['十几万个数字', '十几万个判断'],
      end: '每个数都没有上下文',
      note: '时间位置全在，但一个瞬间说明不了任何事',
    },
    {
      tag: '分帧', color: GREEN, fill: '#eef7f2',
      steps: ['切成几百个小段', '每段算一个数'],
      end: '一条带时间的曲线',
      note: '既有能比较的数值，又保住了「第几秒」',
    },
  ],
  '整段平均、逐个样本、分帧三种做法的对比');

FIG['06-framing-pipeline'] = (M) => chain(M,
  ['分帧之后，', '还要走三步'],
  [
    { name: '① 分帧', desc: ['切成 N 个小段', '可以重叠'], color: BLUE },
    { name: '② 加窗', desc: ['把每段两端压低', '（只在算频率时要）'], color: GOLD },
    { name: '③ 逐帧计算', desc: ['每段算出', '一个数或一列数'], color: BLUE },
    { name: '④ 聚合', desc: ['压成几个统计量', '（要不要扔掉时间）'], color: WARM },
  ],
  '②和④都是可选的；④一旦做了，「第几秒」就再也找不回来。',
  '分帧、加窗、逐帧计算、聚合四步流程');

// ---------------------------------------------------------------- 输出

let n = 0;
for (const mode of ['desktop', 'mobile']) {
  for (const [name, fn] of Object.entries(FIG)) {
    const dir = join(baseFor(name), mode);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${name}.svg`), fn(MODES[mode]), 'utf8');
    n += 1;
  }
}
console.log(`生成 ${n} 张（${Object.keys(FIG).length} 图 × 2 版式）`);
