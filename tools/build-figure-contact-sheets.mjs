#!/usr/bin/env node

import { mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from '../audio-dsp-learning-site/node_modules/sharp/lib/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_01-05', 'figures');
const OUT = join(ROOT, 'tmp', 'figure-contact-sheets-mobile');
mkdirSync(OUT, { recursive: true });

const PANEL_WIDTH = 360;
const SHEET_WIDTH = 420;
const LEFT = 30;
const LABEL_HEIGHT = 34;

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const lesson of ['01', '02', '03', '04', '05']) {
  const files = readdirSync(SRC).filter((f) => f.startsWith(`${lesson}-`) && f.endsWith('.svg')).sort();
  const panels = [];
  let totalHeight = 28;

  for (const file of files) {
    const png = await sharp(join(SRC, file), { density: 180 }).png().toBuffer();
    const meta = await sharp(png).metadata();
    const width = PANEL_WIDTH;
    const height = Math.round((meta.height ?? 1) * width / (meta.width ?? width));
    const resized = await sharp(png).resize({ width }).png().toBuffer();
    panels.push({ file, image: resized, width, height, top: totalHeight + LABEL_HEIGHT });
    totalHeight += LABEL_HEIGHT + height + 28;
  }

  const overlays = [];
  for (const panel of panels) {
    const label = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL_WIDTH}" height="${LABEL_HEIGHT}">` +
      `<rect width="${PANEL_WIDTH}" height="${LABEL_HEIGHT}" fill="#f4f7fa"/>` +
      `<text x="12" y="23" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="15" font-weight="600" fill="#24303b">${escapeXml(basename(panel.file))}</text>` +
      `</svg>`,
    );
    overlays.push({ input: label, left: LEFT, top: panel.top - LABEL_HEIGHT });
    overlays.push({ input: panel.image, left: LEFT, top: panel.top });
  }

  const output = join(OUT, `${lesson}-figures.png`);
  await sharp({
    create: { width: SHEET_WIDTH, height: totalHeight, channels: 3, background: '#ffffff' },
  }).composite(overlays).png().toFile(output);
  console.log(output);
}
