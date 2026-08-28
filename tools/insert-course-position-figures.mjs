#!/usr/bin/env node
// 在零基础版 23 篇正文的导读后插入对应课程位置图。重复运行不会重复插入。

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版');
const dirs = ['零基础版_01-05', '零基础版_06-10', '零基础版_11-15', '零基础版_16-20', '零基础版_21-23'];
let changed = 0; let skipped = 0;

for (const dir of dirs) {
  const folder = join(BASE, dir);
  const files = readdirSync(folder).filter((f) => /^\d{2}-.*\.md$/.test(f)).sort();
  for (const file of files) {
    const id = file.slice(0, 2); const path = join(folder, file); const md = readFileSync(path, 'utf8');
    if (md.includes(`00-course-position-${id}.svg`)) { skipped += 1; continue; }
    const picture = `<picture>\n  <source media="(max-width: 640px)" srcset="figures/mobile/00-course-position-${id}.svg">\n  <img src="figures/desktop/00-course-position-${id}.svg" alt="第 ${Number(id)} 课在二十三课课程路线中的位置">\n</picture>`;
    const next = md.replace(/^(> \*\*导读[：:].*)\r?\n/m, `$1\n\n${picture}\n`);
    if (next === md) throw new Error(`${file} 没有找到单行导读，未修改`);
    writeFileSync(path, next, 'utf8'); changed += 1;
  }
}

console.log(`插入 ${changed} 篇；已存在并跳过 ${skipped} 篇`);
