#!/usr/bin/env node
// 检查 SVG 缩到手机正文宽度后，画布和文字是否仍可读。
// 用法: node check-svg-mobile.mjs <SVG 文件或目录> [...更多路径]

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const TARGET_WIDTH = 360;
const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('用法: node check-svg-mobile.mjs <SVG 文件或目录> [...更多路径]');
  process.exit(2);
}

function collect(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    return readdirSync(path)
      .filter((name) => name.toLowerCase().endsWith('.svg'))
      .map((name) => join(path, name));
  }
  return [path];
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function check(file) {
  const source = readFileSync(file, 'utf8');
  const findings = [];
  const add = (level, message) => findings.push({ level, message });
  const viewBox = /viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/.exec(source);
  if (!viewBox) return { file, findings: [{ level: 'ERROR', message: '缺少可解析的 viewBox' }] };

  const width = Number(viewBox[1]);
  const height = Number(viewBox[2]);
  if (!(width > 0 && height > 0)) add('ERROR', 'viewBox 宽高必须大于 0');
  if (width > 480) add('WARN', 'viewBox 宽度为 ' + width + '，优先改成 360～420 的竖向布局');

  const scale = Math.min(1, TARGET_WIDTH / width);
  const textTags = [...source.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)];
  let minEffective = Infinity;
  let longestLine = 0;

  for (const match of textTags) {
    const attrs = match[1];
    const body = match[2];
    const sizeMatch = /font-size=["']([\d.]+)["']/.exec(attrs);
    if (!sizeMatch) {
      add('WARN', '存在没有显式 font-size 的 text 元素');
      continue;
    }
    const effective = Number(sizeMatch[1]) * scale;
    minEffective = Math.min(minEffective, effective);

    const tspanLines = [...body.matchAll(/<tspan\b[^>]*>([\s\S]*?)<\/tspan>/g)].map((item) => stripTags(item[1]));
    const lines = tspanLines.length ? tspanLines : [stripTags(body)];
    for (const line of lines) longestLine = Math.max(longestLine, [...line.replace(/\s+/g, '')].length);
  }

  if (minEffective < 11.5) add('ERROR', '缩到 ' + TARGET_WIDTH + 'px 后最小字号约 ' + minEffective.toFixed(1) + 'px，小于 11.5px');
  else if (minEffective < 12) add('WARN', '缩到 ' + TARGET_WIDTH + 'px 后最小字号约 ' + minEffective.toFixed(1) + 'px，建议至少 12px');
  if (longestLine > 22) add('WARN', '图内最长单行约 ' + longestLine + ' 字，建议主动断行');

  return { file, width, height, minEffective, longestLine, findings };
}

let results;
try {
  results = targets.flatMap(collect).sort().map(check);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

for (const result of results) {
  const errors = result.findings.filter((item) => item.level === 'ERROR').length;
  const warnings = result.findings.filter((item) => item.level === 'WARN').length;
  const size = result.width ? result.width + '×' + result.height : '未知尺寸';
  const effective = Number.isFinite(result.minEffective) ? '，最小有效字号 ' + result.minEffective.toFixed(1) + 'px' : '';
  console.log('\n=== ' + basename(result.file) + ' ===');
  console.log(size + effective + '，ERROR ' + errors + '，WARN ' + warnings);
  for (const item of result.findings) console.log('  [' + item.level + '] ' + item.message);
}

const totalErrors = results.reduce((sum, result) => sum + result.findings.filter((item) => item.level === 'ERROR').length, 0);
console.log('\n合计 SVG ' + results.length + ' 张，ERROR ' + totalErrors);
process.exit(totalErrors ? 1 : 0);
