#!/usr/bin/env node
// 把 figures/<layout>/*.svg 拼成联系表，便于一次目视检查排版。
//
//   node tools/build-figure-contact-sheets.mjs [desktop|mobile|both] [01-05|06-10|...|all]
//
// 输出 tmp/contact/<系列>-<layout>-N.png
//
// 排布：图块按网格铺开，不再纵向堆成一条长图——一条几千像素高的图
// 既看不清也没法一眼比较。整张联系表的高度控制在 SHEET_MAX_H 以内，
// 放不下就自动开下一张。

import { readdirSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tmp', 'contact');
mkdirSync(OUT, { recursive: true });

const arg = process.argv[2] ?? 'both';
const seriesArg = process.argv[3] ?? '01-05';
const layouts = arg === 'both' ? ['desktop', 'mobile'] : [arg];
const ALL_SERIES = ['01-05', '06-10', '11-15', '16-20', '21-23'];
const seriesList = seriesArg === 'all' ? ALL_SERIES : [seriesArg];

const GAP = 18;
const PAD = 18;
const LABEL_H = 20;
const SHEET_MAX_H = 1600;   // 一张联系表最高多少像素
const TILE_W = { desktop: 520, mobile: 300 };  // 每个图块缩到多宽

const label = (text, w) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${LABEL_H}">`
  + `<text x="0" y="14" font-size="12" font-family="Consolas,monospace" fill="#c8553d">${text}</text></svg>`,
);

for (const series of seriesList) {
  const BASE = join(ROOT, 'NotebookLM课程博客_重写版', `零基础版_${series}`, 'figures');
  for (const layout of layouts) {
    const dir = join(BASE, layout);
    if (!existsSync(dir)) { console.log(`跳过 ${series}/${layout}（不存在）`); continue; }
    const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
    if (files.length === 0) continue;

    const tileW = TILE_W[layout];
    // eslint-disable-next-line no-await-in-loop
    const tiles = await Promise.all(files.map(async (f) => {
      const buf = await sharp(Buffer.from(readFileSync(join(dir, f))), { density: 96 })
        .resize({ width: tileW }).png().toBuffer();
      const meta = await sharp(buf).metadata();
      return { name: basename(f, '.svg'), buf, w: meta.width, h: meta.height };
    }));

    // 按列装箱：一列一列往下放，放不下就换列；列数太多就开新表
    const sheets = [];
    let cur = { cols: [[]], colH: [0] };
    let col = 0;
    const maxCols = layout === 'mobile' ? 5 : 3;
    for (const t of tiles) {
      const need = t.h + LABEL_H + GAP;
      if (cur.colH[col] + need > SHEET_MAX_H && cur.colH[col] > 0) {
        col += 1;
        if (col >= maxCols) { sheets.push(cur); cur = { cols: [[]], colH: [0] }; col = 0; }
        else { cur.cols[col] = []; cur.colH[col] = 0; }
      }
      cur.cols[col].push(t);
      cur.colH[col] += need;
    }
    if (cur.cols.some((c) => c.length)) sheets.push(cur);

    for (let i = 0; i < sheets.length; i += 1) {
      const { cols, colH } = sheets[i];
      const W = PAD * 2 + cols.length * tileW + (cols.length - 1) * GAP;
      const H = PAD * 2 + Math.max(...colH);
      const composites = [];
      cols.forEach((colTiles, ci) => {
        let y = PAD;
        const x = PAD + ci * (tileW + GAP);
        for (const t of colTiles) {
          composites.push({ input: label(t.name, tileW), left: x, top: y });
          composites.push({ input: t.buf, left: x, top: y + LABEL_H });
          y += t.h + LABEL_H + GAP;
        }
      });
      const name = `${series}-${layout}${sheets.length > 1 ? `-${i + 1}` : ''}.png`;
      // eslint-disable-next-line no-await-in-loop
      await sharp({ create: { width: W, height: H, channels: 3, background: '#eef1f4' } })
        .composite(composites).png().toFile(join(OUT, name));
      console.log(`${name}  ${W}×${H}  ${cols.reduce((a, c) => a + c.length, 0)} 张`);
    }
  }
}
