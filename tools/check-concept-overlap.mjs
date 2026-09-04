#!/usr/bin/env node
// 概念归属检查：每个概念只有一课是"主场"，其余篇最多一句话带过，并且要挂上链接。
//
//   node tools/check-concept-overlap.mjs                 # 检查全部目录
//   node tools/check-concept-overlap.mjs --dir <路径>    # 只查某个目录
//   node tools/check-concept-overlap.mjs --list          # 另外列出所有跨篇加粗的词
//
// 归属表 OWNER 是从原始课程扫出来的，依据是 参考资料/原始素材大纲.md
// （由 tools/extract-source-outline.py 生成）。改归属之前先去那份大纲里对一遍。
//
// 两道检查：
//   1. 缺链 —— 非主场的课加粗解释了某个概念，却没链回主场。
//   2. 重讲 —— 主场"之后"的课出现了以该概念命名的小节标题，多半是又完整讲了一遍。
//      主场"之前"的课不算：读者读到它时还没有别的课可链，它必须自足
//      （2026-09-03 的教训：曾把 01 的波形段判成重复，用户指出第一课必须讲清楚）。
//
// 退出码：0 = 无 ERROR；1 = 有 ERROR。

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, '音频信号处理二十三讲/');

// ---------------------------------------------------------------- 归属表
// 概念 → 主场课号。来源是 source_course 每一课的幻灯片标题，见原始素材大纲。
// 同一个概念的"讲清楚"和"写出来"分属两课时，各自单列（振幅包络的定义在 07，
// 实现在 08）。
const OWNER = {
  // 01 Overview —— 课程问题、应用、路线和技术栈；不提前讲声音表示
  音频分类: '01', 课程路线: '01', 技术栈: '01',
  // 02 Sound and waveforms
  声波: '02', 机械波: '02', 波形: '02', 周期: '02', 振幅: '02', 相位: '02',
  音高: '02', 听觉范围: '02', 音分: '02', 八度: '02',
  // 03 Intensity, loudness, and timbre
  声功率: '03', 声强: '03', 声强级: '03', 分贝: '03', 响度: '03',
  音色: '03', 声音包络: '03', 泛音: '03', 调频: '03', 调幅: '03',
  // 04 Understanding audio signals
  模拟信号: '04', 数字信号: '04', ADC: '04', DAC: '04', PCM: '04',
  采样: '04', 采样周期: '04', 采样率: '04', 奈奎斯特频率: '04', 混叠: '04',
  量化: '04', 位深: '04', 动态范围: '04', 量化噪声: '04',
  // 05 Types of audio features for ML
  音频特征: '05', 抽象层级: '05', 时间范围: '05', 音乐属性: '05',
  信号域: '05', 传统机器学习: '05', 深度学习: '05',
  // 06 How to extract audio features
  帧: '06', 分帧: '06', 帧长: '06', 帧移: '06',
  加窗: '06', 窗函数: '06', 频谱泄漏: '06', 重叠帧: '06',
  // 07 Time-domain audio features —— 三个特征的定义和公式
  时域特征: '07', 振幅包络: '07', 均方根: '07', 过零率: '07',
  // 08 / 09 —— 实现与边界条件
  // （实现细节没有独立术语，靠正文里的链接连接）
  // 10 Fourier Transform: the intuition
  傅里叶变换: '10', 频谱: '10', 幅度: '10',
  // 11 Complex numbers
  复数: '11', 实部: '11', 虚部: '11', 极坐标: '11', 欧拉公式: '11',
  // 13 Discrete Fourier Transform
  离散傅里叶变换: '13', 频率格: '13', 快速傅里叶变换: '13',
  // 15 STFT
  短时傅里叶变换: '15',
  // 16 Extracting spectrograms
  声谱图: '16',
  // 17 Mel spectrogram
  梅尔刻度: '17', 梅尔滤波器组: '17', 梅尔频谱: '17',
  // 19 MFCC
  倒谱: '19', 倒频率: '19', MFCC: '19',
  // 21-23 Frequency-domain features
  频域特征: '21', 带能量比: '22', 频谱质心: '23', 频谱带宽: '23',
};

// 全程反复出现、没有主场的基础词。每篇都可以就地解释，不必挂链接。
const BASIC = new Set([
  '正弦波', '赫兹', '噪声', '频率', '归一化', '模型', '分类器',
  '基线', '直流偏置', '削波', '单声道', '立体声',
]);

// ---------------------------------------------------------------- 收集文章
const dirArg = process.argv.indexOf('--dir');
const roots = dirArg > -1
  ? [resolve(process.argv[dirArg + 1])]
  : [
    ...readdirSync(BASE).filter((d) => /^第\d\d-\d\d课$/.test(d)).map((d) => join(BASE, d)),
  ].filter(existsSync);

const groups = [];
for (const dir of roots) {
  const files = readdirSync(dir).filter((n) => /^\d\d-.*\.md$/.test(n));
  if (files.length) groups.push({ dir, files });
}

const strip = (t) => t
  .replace(/<!-- exercise:start -->[\s\S]*?<!-- exercise:end -->/g, '')
  .replace(/```[\s\S]*?```/g, '');

// 必须允许单字（**帧**），否则它会被跳过，后面那个 ** 被当成开头，
// 把紧随其后的真术语一起吞掉。
function boldTerms(text) {
  const out = new Set();
  for (const m of text.matchAll(/\*\*([^*\n]{1,12})\*\*/g)) {
    const t = m[1].trim();
    if (t.length < 2 || /[，。：；？！、（）\s]/.test(t)) continue;
    out.add(t);
  }
  return out;
}

// 只看「核心概念」那一层的二级标题。文章模板里，那一节就是「把一个概念
// 完整讲一遍」的位置；`## 振幅包络是怎么算出来的`（实现课的开场白）和
// `### 加一层：…`（实验步骤）标题里带术语是正常的，不算重讲。
function conceptHeadings(text) {
  return [...text.matchAll(/^## (核心概念[^\n]*)$/gm)].map((m) => m[1]);
}

let missing = 0;
let restated = 0;
const seenBy = new Map();

// 全课按课号索引文件名。跨组链接写成 `../第06-10课/10-....md`，正文里
// 不会出现「第 10 课」这几个字，所以只在本组里找会把真链接判成缺链
// （2026-09-04：9 条缺链全部是这样误报出来的）。
const byIdAll = new Map();
for (const { files } of groups) for (const f of files) byIdAll.set(f.slice(0, 2), f);

for (const { dir, files } of groups) {
  const byId = byIdAll;

  for (const f of files.sort()) {
    const id = f.slice(0, 2);
    const text = strip(readFileSync(join(dir, f), 'utf8'));
    const terms = boldTerms(text);
    const heads = conceptHeadings(text);

    for (const t of terms) {
      const key = `${t}`;
      if (!seenBy.has(key)) seenBy.set(key, new Set());
      seenBy.get(key).add(id);
      if (BASIC.has(t)) continue;
      const owner = OWNER[t];
      if (!owner || owner === id) continue;

      // 检查 1：有没有链回主场
      const target = byId.get(owner);
      const linked = target ? text.includes(target) : text.includes(`第 ${owner} 课`);
      if (!linked) {
        console.log(`缺链  [${basename(dir)}] 第 ${id} 课加粗解释了「${t}」，没有链回主场第 ${owner} 课`);
        missing += 1;
      }

      // 检查 2：主场之后的课，不该再出现以这个概念命名的小节
      if (id > owner) {
        const h = heads.find((x) => x.includes(t));
        if (h) {
          console.log(`重讲  [${basename(dir)}] 第 ${id} 课有一节「${h}」，但「${t}」的主场是第 ${owner} 课——核心概念那一节应该是一句话加链接，不该再完整讲一遍`);
          restated += 1;
        }
      }
    }
  }
}

if (process.argv.includes('--list')) {
  console.log('\n跨篇加粗出现的词（仅供人工判断，不是错误）：');
  const rows = [...seenBy]
    .map(([t, s]) => [t, [...s].sort()])
    .filter(([, ids]) => ids.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  for (const [t, ids] of rows) {
    const owner = OWNER[t] ? `主场 ${OWNER[t]}` : (BASIC.has(t) ? '基础词' : '无主场');
    console.log(`  ${t.padEnd(12)} ${ids.join('、').padEnd(24)} ${owner}`);
  }
}

const total = missing + restated;
console.log(total === 0
  ? '\n概念归属检查通过：没有缺链，也没有在主场之后重讲'
  : `\n合计 ${total} 处（缺链 ${missing}，重讲 ${restated}）`);
process.exit(total > 0 ? 1 : 0);
