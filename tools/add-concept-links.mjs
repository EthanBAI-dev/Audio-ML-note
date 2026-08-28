#!/usr/bin/env node
// 给跨篇复用的概念补一句链接，指回真正展开它的那一课。
//
//   node tools/add-concept-links.mjs --dry    # 只看会改哪里
//   node tools/add-concept-links.mjs          # 实际写入
//
// 只在每篇第一次加粗出现处补一次，且只补有专门一课讲的概念；
// 波形、频谱这类全程反复出现的基础词不补，否则每篇都挂一串链接。

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版');
const DRY = process.argv.includes('--dry');

// 值得跨篇链接的概念 → 展开它的那一课
const LINK = {
  音色: '03', 音高: '02',
  采样率: '04', 位深: '04',
  分帧: '06', 帧长: '06', 窗函数: '06', 频谱泄漏: '06',
  振幅包络: '08', 均方根: '09', 过零率: '09',
  傅里叶变换: '10', 复数: '11',
  声谱图: '15', 短时傅里叶变换: '15',
  梅尔频谱: '17', 梅尔刻度: '17', MFCC: '19',
  带能量比: '22', 频谱质心: '23', 频谱带宽: '23',
};

const files = [];
for (const dir of readdirSync(BASE).filter((d) => d.startsWith('零基础版_'))) {
  for (const f of readdirSync(join(BASE, dir)).filter((n) => /^\d\d-.*\.md$/.test(n))) {
    files.push({ id: f.slice(0, 2), dir, file: f, path: join(BASE, dir, f) });
  }
}
files.sort((a, b) => a.id.localeCompare(b.id));
const byId = new Map(files.map((f) => [f.id, f]));

const relPath = (from, to) => (from.dir === to.dir ? to.file : `../${to.dir}/${to.file}`);

let n = 0;
for (const f of files) {
  let text = readFileSync(f.path, 'utf8');
  const exStart = text.indexOf('<!-- exercise:start -->');
  const bodyEnd = exStart > 0 ? exStart : text.length;

  for (const [term, owner] of Object.entries(LINK)) {
    if (owner === f.id) continue;
    const target = byId.get(owner);
    // 只看正文：作业段末尾的上一步/下一步导航是项目路线，不算概念交叉引用
    if (!target || text.slice(0, bodyEnd).includes(target.file)) continue;

    const needle = `**${term}**`;
    // 只在正文段落里补，跳过标题、图注、表格、HTML
    let at = -1;
    let from = 0;
    for (;;) {
      const i = text.indexOf(needle, from);
      if (i < 0 || i >= bodyEnd) break;
      const lineStart = text.lastIndexOf('\n', i) + 1;
      const line = text.slice(lineStart, text.indexOf('\n', i));
      if (!/^\s*(#|\*图|\||<|>|-\s|\d+\.\s)/.test(line)) { at = i; break; }
      from = i + needle.length;
    }
    if (at < 0) continue;

    const later = Number(owner) > Number(f.id);
    const note = later
      ? `（[第 ${owner} 课](${relPath(f, target)})会展开）`
      : `（[第 ${owner} 课](${relPath(f, target)})讲过）`;
    const cut = at + needle.length;
    text = text.slice(0, cut) + note + text.slice(cut);
    console.log(`第 ${f.id} 课 · ${term} → 第 ${owner} 课${later ? '（前瞻）' : '（回顾）'}`);
    n += 1;
  }

  if (!DRY) writeFileSync(f.path, text, 'utf8');
}
console.log(`\n${DRY ? '将补' : '已补'} ${n} 处概念链接`);
