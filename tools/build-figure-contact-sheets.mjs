#!/usr/bin/env node
// 把 figures/<layout>/*.svg 拼成联系表，便于一次目视检查排版。
//   node tools/build-figure-contact-sheets.mjs [desktop|mobile|both] [01-05|06-10]
// 输出 tmp/contact/<系列>-<layout>-N.png

import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const series = process.argv[3] ?? '01-05';
const BASE = join(ROOT, 'NotebookLM课程博客_重写版', `零基础版_${series}`, 'figures');
const OUT = join(ROOT, 'tmp', 'contact');
mkdirSync(OUT, { recursive: true });

const arg = process.argv[2] ?? 'both';
const layouts = arg === 'both' ? ['desktop', 'mobile'] : [arg];
const PER_SHEET = 5;
const GAP = 20;
const PAD = 16;

for (const layout of layouts) {
  const dir = join(BASE, layout);
  const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
  for (let sheet = 0; sheet * PER_SHEET < files.length; sheet += 1) {
    const group = files.slice(sheet * PER_SHEET, (sheet + 1) * PER_SHEET);
    // eslint-disable-next-line no-await-in-loop
    const tiles = await Promise.all(group.map(async (f) => {
      const buf = await sharp(Buffer.from(readFileSync(join(dir, f))), { density: 96 }).png().toBuffer();
      const meta = await sharp(buf).metadata();
      return { name: basename(f, '.svg'), buf, w: meta.width, h: meta.height };
    }));
    const W = Math.max(...tiles.map((t) => t.w)) + PAD * 2;
    const H = tiles.reduce((a, t) => a + t.h + GAP + 22, 0) + PAD * 2;
    const composites = [];
    let y = PAD;
    for (const t of tiles) {
      const label = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W - PAD * 2}" height="20">`
        + `<text x="0" y="14" font-size="13" font-family="Consolas,monospace" fill="#c8553d">${t.name}</text></svg>`,
      );
      composites.push({ input: label, left: PAD, top: y });
      composites.push({ input: t.buf, left: PAD, top: y + 22 });
      y += t.h + GAP + 22;
    }
    const name = `${series}-${layout}-${sheet + 1}.png`;
    // eslint-disable-next-line no-await-in-loop
    await sharp({ create: { width: W, height: H, channels: 3, background: '#eef1f4' } })
      .composite(composites).png().toFile(join(OUT, name));
    console.log(`${name}  ${W}x${H}  ${group.join(', ')}`);
  }
}
