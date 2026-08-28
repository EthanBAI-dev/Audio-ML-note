#!/usr/bin/env node
// 把 tools/exercises.mjs 里的「动手做」写进各篇文章。
//
//   node tools/apply-exercises.mjs
//
// 幂等：已有的作业段会被整段替换，不会重复追加。作业内容只在 exercises.mjs 里维护。

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXERCISES, PROJECT } from './exercises.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'NotebookLM课程博客_重写版');

// 找出全部文章：编号 -> { 目录, 文件名 }
const articles = new Map();
for (const dir of readdirSync(BASE).filter((d) => d.startsWith('零基础版_'))) {
  for (const f of readdirSync(join(BASE, dir)).filter((f) => /^\d\d-.*\.md$/.test(f))) {
    articles.set(f.slice(0, 2), { dir, file: f });
  }
}

const MARK_START = '<!-- exercise:start -->';
const MARK_END = '<!-- exercise:end -->';

const rel = (fromDir, id) => {
  const a = articles.get(id);
  if (!a) return null;
  return a.dir === fromDir ? a.file : `../${a.dir}/${a.file}`;
};

function block(ex, dir) {
  const i = EXERCISES.findIndex((e) => e.id === ex.id);
  const prev = i > 0 ? EXERCISES[i - 1] : null;
  const next = i < EXERCISES.length - 1 ? EXERCISES[i + 1] : null;

  const nav = [];
  if (prev) nav.push(`上一步：[第 ${prev.id} 课 · ${prev.title}](${rel(dir, prev.id)})`);
  if (next) nav.push(`下一步：[第 ${next.id} 课 · ${next.title}](${rel(dir, next.id)})`);
  nav.push(`[项目全貌](../课程项目/README.md)`);

  return [
    MARK_START,
    '',
    `## 动手做：第 ${Number(ex.id)} 步 · ${ex.title}`,
    '',
    `课程项目《${PROJECT}》共 23 步，这是第 ${Number(ex.id)} 步。${ex.lead}`,
    '',
    ...ex.steps.map((s, k) => `${k + 1}. ${s}`),
    '',
    `**做完应该有**：${ex.deliver}`,
    '',
    `**自检**：${ex.check}`,
    '',
    nav.join('　·　'),
    '',
    MARK_END,
  ].join('\n');
}

let n = 0;
for (const ex of EXERCISES) {
  const a = articles.get(ex.id);
  if (!a) { console.log(`缺文章：${ex.id}`); continue; }
  const path = join(BASE, a.dir, a.file);
  let text = readFileSync(path, 'utf8');
  const body = block(ex, a.dir);

  const s = text.indexOf(MARK_START);
  const e = text.indexOf(MARK_END);
  if (s >= 0 && e > s) {
    text = text.slice(0, s) + body + text.slice(e + MARK_END.length);
  } else {
    text = `${text.trimEnd()}\n\n${body}\n`;
  }
  writeFileSync(path, text, 'utf8');
  n += 1;
}
console.log(`写入 ${n} 篇文章的「动手做」`);
