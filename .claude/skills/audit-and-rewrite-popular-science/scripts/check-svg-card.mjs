#!/usr/bin/env node
// 小红书卡片版配图检查。
//
//   node check-svg-card.mjs <figures/card 目录>
//
// 卡片正文可用宽 912、图片默认高度上限 900。SVG 会被 width:100% 撑满 912，
// 所以只要是横图就能占满整宽；竖图会先顶到 900 再等比缩小，两侧留一大片白。
//
// 卡片在手机上按 390 CSS px 显示，912 宽的图渲染成 329 px（缩放 0.361），
// 要达到 11.5 px 可读下限，卡片坐标系里的字号必须 ≥ 32。
//
// 退出码：0 = 无 ERROR；1 = 有 ERROR。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const W_OK = 912;
const W_SAFE = 888;      // 杂志风可用宽度
const H_MAX = 900;       // 图片高度滑杆默认值
const H_HARD = 1130;     // 正文可用高度，超过必然溢出
const MIN_FONT = 32;
const PHONE = 390 / 1080;  // 卡片在手机上的缩放比

const target = process.argv[2];
if (!target) { console.log('用法: node check-svg-card.mjs <figures/card 目录>'); process.exit(2); }

const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => f.endsWith('.svg')).sort().map((f) => join(target, f))
  : [target];

let errors = 0;
let warns = 0;

for (const file of files) {
  const svg = readFileSync(file, 'utf8');
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const out = [];
  if (!vb) { console.log(`\n=== ${basename(file)} ===\n  [ERROR] 缺少 viewBox`); errors += 1; continue; }

  const w = Number(vb[1]);
  const h = Number(vb[2]);
  const ratio = w / h;

  if (w !== W_OK) { out.push(['ERROR', `画布宽 ${w}，应为 ${W_OK}`]); }
  if (h > H_HARD) out.push(['ERROR', `高 ${h} 超过正文可用高度 ${H_HARD}，整页会溢出`]);
  else if (h > H_MAX) out.push(['WARN', `高 ${h} 超过图片高度滑杆默认值 ${H_MAX}，需要读者手动调高滑杆`]);
  if (ratio < 1.01) out.push(['ERROR', `宽高比 ${ratio.toFixed(2)} < 1.01，是竖图，会缩到 ${Math.round(h > 0 ? H_MAX * ratio : 0)}px 宽并两侧留白`]);

  // 字号
  const sizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
  if (sizes.length) {
    const min = Math.min(...sizes);
    if (min < MIN_FONT) {
      out.push(['ERROR', `最小字号 ${min}，低于 ${MIN_FONT}；手机上只有 ${(min * PHONE).toFixed(1)}px`]);
    }
  }

  // 关键内容不要越过杂志风的 888
  const xs = [...svg.matchAll(/\sx="([\d.]+)"/g)].map((m) => Number(m[1]));
  const over = xs.filter((v) => v > W_SAFE).length;
  if (over > 0) out.push(['WARN', `有 ${over} 处元素起点超过 ${W_SAFE}，杂志风主题下可能被裁`]);

  if (out.length) {
    console.log(`\n=== ${basename(file)} ===`);
    console.log(`  ${w}×${h}，比例 ${ratio.toFixed(2)}，最小字号 ${sizes.length ? Math.min(...sizes) : '-'}`);
    for (const [lv, msg] of out) {
      console.log(`  [${lv}] ${msg}`);
      if (lv === 'ERROR') errors += 1; else warns += 1;
    }
  }
}

console.log(`\n合计卡片图 ${files.length} 张，ERROR ${errors}，WARN ${warns}`);
process.exit(errors ? 1 : 0);
