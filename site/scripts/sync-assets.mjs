#!/usr/bin/env node
// 把课程目录里的 SVG 配图和自制音频复制进 public/，让网站按 URL 取用。
// 文章 Markdown 不复制——站点在构建时直接读原文件，正式版仍是唯一事实来源。
import { cpSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const COURSE = join(ROOT, '音频信号处理二十三讲');
const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// 配图：第01-05课/figures/desktop/x.svg -> public/figures/01-05/desktop/x.svg
let figs = 0;
for (const d of readdirSync(COURSE)) {
  const m = /^第(\d\d-\d\d)课$/.exec(d);
  if (!m) continue;
  for (const variant of ['desktop', 'mobile']) {
    const src = join(COURSE, d, 'figures', variant);
    if (!existsSync(src)) continue;
    const dst = join(PUB, 'figures', m[1], variant);
    mkdirSync(dst, { recursive: true });
    cpSync(src, dst, { recursive: true });
    figs += readdirSync(src).length;
  }
}

// 音频：只同步自制/无版权疑虑的素材，三段商业录音走外链
const SELF_MADE = ['scale.wav', 'noise.wav', 'piano_c.wav', 'violin_c.wav', 'sax.wav', 'tremolo.wav', 'voice.wav'];
const audioSrc = join(ROOT, 'source_course', 'audio_resources');
let auds = 0;
if (existsSync(audioSrc)) {
  const dst = join(PUB, 'audio');
  mkdirSync(dst, { recursive: true });
  for (const f of SELF_MADE) {
    if (existsSync(join(audioSrc, f))) { cpSync(join(audioSrc, f), join(dst, f)); auds += 1; }
  }
}
console.log(`同步配图 ${figs} 张，音频 ${auds} 个${auds === 0 ? '（source_course/audio_resources 不存在，属正常）' : ''}`);

// 交互组件按二级标题定位。文章改标题时这里要立刻报错，否则组件会悄悄掉到文末。
const wsrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'widgets.ts'), 'utf8');
const blocks = [...wsrc.matchAll(/'(\d\d)':\s*\[([\s\S]*?)\],\n/g)];
let checked = 0;
const broken = [];
for (const [, id, body] of blocks) {
  const dir = readdirSync(COURSE).find((d) => /^第\d\d-\d\d课$/.test(d)
    && readdirSync(join(COURSE, d)).some((f) => f.startsWith(`${id}-`)));
  if (!dir) { broken.push(`${id}：找不到这一课`); continue; }
  const file = readdirSync(join(COURSE, dir)).find((f) => f.startsWith(`${id}-`) && f.endsWith('.md'));
  const text = readFileSync(join(COURSE, dir, file), 'utf8');
  for (const [, anchor, name] of body.matchAll(/before:\s*'([^']*)',\s*name:\s*'(\w+)'/g)) {
    checked += 1;
    if (!text.includes(`## ${anchor}`)) broken.push(`${id} 的 ${name}：找不到标题「${anchor}」`);
  }
}
if (broken.length) {
  console.error(`交互组件锚点对不上：\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`交互组件锚点 ${checked} 个，全部对上`);
