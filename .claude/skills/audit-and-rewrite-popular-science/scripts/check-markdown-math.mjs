#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('用法：node check-markdown-math.mjs <Markdown 文件或目录> [...]');
  process.exit(2);
}

function collect(input) {
  const p = resolve(input);
  if (!existsSync(p)) return [];
  if (statSync(p).isFile()) return extname(p).toLowerCase() === '.md' ? [p] : [];
  return readdirSync(p, { withFileTypes: true }).flatMap((entry) =>
    collect(join(p, entry.name)));
}

const files = [...new Set(inputs.flatMap(collect))].sort();
let totalErrors = 0;

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const errors = [];
  let inFence = false;
  let inDisplay = false;
  let displayStart = 0;

  lines.forEach((line, index) => {
    const lineNo = index + 1;
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    // 行内代码里的 `$` / `$$` 是示例文本，不属于数学定界符。
    const proseLine = line.replace(/`[^`]*`/g, '');
    const proseTrimmed = proseLine.trim();

    if (proseTrimmed.includes('$$')) {
      if (proseTrimmed !== '$$') {
        errors.push([lineNo, '块公式的 $$ 必须独占一行']);
        return;
      }
      inDisplay = !inDisplay;
      if (inDisplay) displayStart = lineNo;
      return;
    }

    if (inDisplay) {
      if (/[，。；：！？]/u.test(line)) errors.push([lineNo, '块公式内含中文标点']);
      if (/\p{Script=Han}/u.test(line)) errors.push([lineNo, '块公式内含中文文字，请移到正文']);
      return;
    }

    // 先移除行内代码，再检查未转义的单美元符号。
    const prose = proseLine;
    const marks = [];
    for (let i = 0; i < prose.length; i += 1) {
      if (prose[i] === '$' && prose[i - 1] !== '\\') marks.push(i);
    }
    if (marks.length % 2 !== 0) {
      errors.push([lineNo, '行内公式的 $ 数量不成对']);
      return;
    }
    for (let i = 0; i < marks.length; i += 2) {
      const expr = prose.slice(marks[i] + 1, marks[i + 1]);
      if (!expr.trim()) errors.push([lineNo, '发现空的行内公式']);
      if (/[，。；：！？]/u.test(expr) || /\p{Script=Han}/u.test(expr)) {
        errors.push([lineNo, '行内公式含中文文字或标点，请移到 $ 外']);
      }
    }
  });

  if (inDisplay) errors.push([displayStart, '块公式缺少结束 $$']);
  if (errors.length) {
    console.log(`\n=== ${file} ===`);
    errors.forEach(([line, message]) => console.log(`[ERROR] L${line}: ${message}`));
  }
  totalErrors += errors.length;
}

console.log(`\n合计 Markdown ${files.length} 个，ERROR ${totalErrors}`);
process.exit(totalErrors ? 1 : 0);
