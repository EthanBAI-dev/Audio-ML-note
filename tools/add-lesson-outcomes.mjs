#!/usr/bin/env node
// 在每篇导读下面补一行「读完能做到」。
//
//   node tools/add-lesson-outcomes.mjs --dry
//   node tools/add-lesson-outcomes.mjs
//
// 导读原来只说本文讲什么，读者要读完才知道自己得到了什么。
// 这一行给三个具体、可自我检验的能力，扫一眼就知道值不值得读下去。
// 幂等：已有的那一行会被整行替换。

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版');
const DRY = process.argv.includes('--dry');

// 每条都要能自己验证做没做到，不写「理解了」这种没法判断的说法。
const OUTCOMES = {
  '01': ['说出波形、频谱、声谱图各自留下什么、丢掉什么', '按任务反推该用哪一种表示', '说清预处理参数为什么必须记录'],
  '02': ['说清屏幕上那条曲线记录的到底是什么', '用振幅、频率、相位描述一次振动', '解释高八度为什么是乘 2 而不是加固定数'],
  '03': ['分清声功率、声强与声压', '说出 dB SPL 和 dBFS 为什么不能互换', '指出音色差别来自哪两方面'],
  '04': ['说出 44100 和 16 分别决定了什么', '判断一段录音会不会发生混叠', '按任务选参数，而不是越大越好'],
  '05': ['用四个问题把任务拆成可测量的证据', '判断该保留时间序列还是整段统计', '说出一种变换保留了什么、放弃了什么'],
  '06': ['算出一段录音会被切成多少帧', '说出帧长和帧移各自控制什么', '决定该保留逐帧序列还是聚合成一个数'],
  '07': ['说出振幅包络、RMS、过零率各回答什么问题', '判断哪一种对当前任务真的有用', '知道三条曲线都不足以单独认出声音'],
  '08': ['写出边界清楚的振幅包络实现', '处理尾帧并让时间轴对齐波形', '说出帧长怎样改变包络的细节'],
  '09': ['写出 RMS 与过零率的实现', '解释 RMS 为什么比最高峰更稳', '用两条曲线联合区分语音和噪声'],
  '10': ['说清「用已知频率去试探」在做什么', '知道频谱回答什么、不回答什么', '说出为什么还需要分帧'],
  '11': ['用模和幅角分别表示强弱与起始位置', '读懂复平面上的一个点', '说出复数乘法做了哪两个动作'],
  '12': ['解释单条正弦探针为什么会漏看', '说出一次复数匹配同时给出哪两个量', '知道只留峰高为什么重建不回原波形'],
  '13': ['把数组位置正确换算成 Hz', '说出频率格间隔由什么决定', '解释真实音频为什么只看前半边'],
  '14': ['建立与变换配套的频率轴', '按窗系数归一化，得到可比较的幅值', '分清幅度、相对分贝与功率不是同一个量'],
  '15': ['算出 STFT 输出的行数和列数', '说出短窗和长窗各自看清什么', '知道实时分析为什么不能用未来帧'],
  '16': ['把 STFT 结果画成可信的声谱图', '说出颜色代表的究竟是哪一个量', '列出比较两张声谱图必须统一的条件'],
  '17': ['解释频率为什么要按听感重新分带', '构造一组梅尔三角滤波器', '说出 513 行怎样变成 64 行'],
  '18': ['写出参数完整、形状明确的实现', '分清梅尔汇总与对数压缩解决的是两件事', '记下足以复现同一张图的全部设置'],
  '19': ['说出取对数把什么关系变成了加法', '解释 DCT 为什么能把轮廓集中到前几项', '知道只保留 13 项丢掉了什么'],
  '20': ['算出 Delta 与 Delta-Delta', '处理首尾帧的边界', '拼出每帧 39 维的特征'],
  '21': ['说出带能量比、质心、带宽各回答什么', '预测三者对同一种变化的不同反应', '按任务挑出合适的那一个'],
  '22': ['正确找到 2000 Hz 对应的频率箱', '先写清矩阵的轴方向再求和', '用极端信号验证实现是否正确'],
  '23': ['算出频谱质心与带宽', '说明用幅度还是功率作权重', '知道质心高不等于听起来一定亮'],
};

const MARK = '> **读完能做到：**';

const files = [];
for (const dir of readdirSync(BASE).filter((d) => d.startsWith('零基础版_'))) {
  for (const f of readdirSync(join(BASE, dir)).filter((n) => /^\d\d-.*\.md$/.test(n))) {
    files.push({ id: f.slice(0, 2), path: join(BASE, dir, f) });
  }
}
files.sort((a, b) => a.id.localeCompare(b.id));

let n = 0;
for (const f of files) {
  const items = OUTCOMES[f.id];
  if (!items) { console.log(`缺内容：第 ${f.id} 课`); continue; }
  const lines = readFileSync(f.path, 'utf8').split(/\r?\n/);

  const lead = lines.findIndex((l) => /^>\s*\*\*导读[：:]/.test(l));
  if (lead < 0) { console.log(`第 ${f.id} 课找不到导读`); continue; }

  const line = `${MARK} ${items.join('　·　')}`;
  const existing = lines.findIndex((l) => l.startsWith(MARK));
  if (existing >= 0) {
    lines[existing] = line;
  } else {
    lines.splice(lead + 1, 0, '>', line);
  }
  if (!DRY) writeFileSync(f.path, lines.join('\n'), 'utf8');
  console.log(`第 ${f.id} 课 · ${items.length} 条`);
  n += 1;
}
console.log(`\n${DRY ? '将写入' : '已写入'} ${n} 篇`);
