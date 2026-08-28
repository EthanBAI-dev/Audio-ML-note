#!/usr/bin/env node
// 概念归属检查：每个概念只有一篇是"主场"，其余篇可以用一句话带过，
// 但必须链回主场。否则读者在第 14 课看到「采样率」的解释，
// 不知道第 04 课整篇都在讲它。
//
//   node tools/check-concept-overlap.mjs          # 只报告
//   node tools/check-concept-overlap.mjs --list   # 另外列出所有跨篇加粗的词
//
// 退出码：0 = 无缺链；1 = 有缺链。

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版');

// 概念 → 主场课号。主场是"整篇或整节从头讲这个概念"的那一课。
// 有专门一课展开的概念 → 那一课。别处再解释它时，必须链回来。
const OWNER = {
  音色: '03', 音高: '02',
  采样率: '04', 位深: '04',
  分帧: '06', 帧长: '06', 窗函数: '06', 频谱泄漏: '06',
  振幅包络: '08', 均方根: '09', 过零率: '09',
  傅里叶变换: '10', 复数: '11',
  声谱图: '15', 短时傅里叶变换: '15',
  梅尔频谱: '17', 梅尔刻度: '17', MFCC: '19',
  带能量比: '22', 频谱质心: '23', 频谱带宽: '23',
};

// 全程反复出现的基础词。它们没有"主场"，每篇都可以就地解释，
// 不需要挂链接——否则后面每一篇都会拖一串指回前面的括号。
const BASIC = new Set([
  '波形', '频谱', '正弦波', '相位', '赫兹', '音频特征', '信号域',
  '时间尺度', '聚合', '频率格', '量化', '混叠', '分贝', '响度', '倒谱',
  '离散傅里叶变换', '滤波器组', '声音表示', '频率',
]);

const files = [];
for (const dir of readdirSync(BASE).filter((d) => d.startsWith('零基础版_'))) {
  for (const f of readdirSync(join(BASE, dir)).filter((n) => /^\d\d-.*\.md$/.test(n))) {
    files.push({ id: f.slice(0, 2), dir, file: f, path: join(BASE, dir, f) });
  }
}
files.sort((a, b) => a.id.localeCompare(b.id));
const byId = new Map(files.map((f) => [f.id, f]));

const strip = (t) => t
  .replace(/<!-- exercise:start -->[\s\S]*?<!-- exercise:end -->/g, '')  // 作业段按设计会复述
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

let missing = 0;
const seenBy = new Map();

for (const f of files) {
  const text = strip(readFileSync(f.path, 'utf8'));
  const terms = boldTerms(text);
  for (const t of terms) {
    if (!seenBy.has(t)) seenBy.set(t, []);
    seenBy.get(t).push(f.id);

    if (BASIC.has(t)) continue;
    const owner = OWNER[t];
    if (!owner || owner === f.id) continue;
    const target = byId.get(owner);
    if (!target) continue;
    // 主场文章的文件名出现在链接里就算链上了
    if (text.includes(target.file)) continue;
    console.log(`缺链  第 ${f.id} 课加粗解释了「${t}」，但没有链回主场第 ${owner} 课`);
    missing += 1;
  }
}

if (process.argv.includes('--list')) {
  console.log('\n跨篇加粗出现的词（仅供人工判断，不是错误）：');
  for (const [t, ids] of [...seenBy].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${t.padEnd(12)} ${ids.join('、')}`);
  }
}

console.log(missing === 0 ? '\n概念归属检查通过：每处跨篇解释都链回了主场'
  : `\n共 ${missing} 处缺链。补一句链接即可，不必删掉解释——读者可能从任意一篇进入。`);
process.exit(missing === 0 ? 0 : 1);
