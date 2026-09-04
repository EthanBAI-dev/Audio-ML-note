#!/usr/bin/env node
// 检查所有 Markdown 里的相对链接和图片路径是否存在。
//   node tools/check-links.mjs
//   node tools/check-links.mjs --include-drafts
// 退出码：0 = 全部有效；1 = 有失效链接。

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INCLUDE_DRAFTS = process.argv.includes('--include-drafts');

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    // 对照实验里放的是各种写法的试写稿，相对链接按正式稿的位置写的，
    // 在这里必然指不到，不参与检查。
    if (f === 'node_modules' || f.startsWith('.git') || f === 'tmp'
      || (!INCLUDE_DRAFTS && f.endsWith('对照实验'))) return [];
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return walk(p);
    return f.endsWith('.md') ? [p] : [];
  });
}

const files = [
  ...walk(join(ROOT, 'NotebookLM课程博客_重写版')),
  join(ROOT, 'README.md'),
  join(ROOT, 'SKILL.md'),
].filter(existsSync);

let bad = 0;
for (const file of files) {
  // 代码块里的路径是示例，不算死链
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  const show = relative(ROOT, file);

  for (const m of text.matchAll(/\]\(([^)#][^)]*)\)/g)) {
    let target = m[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    target = target.replace(/^<|>$/g, '').split('#')[0];
    if (!target) continue;
    if (!existsSync(resolve(dirname(file), decodeURI(target)))) {
      console.log(`死链  ${show}  ->  ${target}`);
      bad += 1;
    }
  }

  for (const m of text.matchAll(/(?:srcset|src)="([^"]+)"/g)) {
    const target = m[1];
    if (/^(https?:|data:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(file), decodeURI(target)))) {
      console.log(`死图  ${show}  ->  ${target}`);
      bad += 1;
    }
  }
}

console.log(bad === 0 ? `检查 ${files.length} 个文件，链接全部有效` : `检查 ${files.length} 个文件，${bad} 处失效`);
process.exit(bad === 0 ? 0 : 1);
