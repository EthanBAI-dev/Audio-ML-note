#!/usr/bin/env node
// 把「零基础版」文章打包成一个自带图片的单页预览。
//
//   node tools/build-preview.mjs [源目录] [输出前缀]
//
// 输出:
//   tmp/preview-零基础版.html           可直接双击打开的完整页面
//   tmp/preview-零基础版.artifact.html  只含内容的片段，用于发布成 Artifact
//
// 公式不做排版渲染（离线环境没有 KaTeX），改为等宽样式块，保证可读。

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from '../audio-dsp-learning-site/node_modules/sharp/lib/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2] ?? join(ROOT, 'NotebookLM课程博客_重写版', '零基础版_01-05');
const OUT = process.argv[3] ?? join(ROOT, 'tmp', 'preview-零基础版');

// ---------- 图片 ----------

const imageCache = new Map();

async function embed(relPath) {
  const abs = resolve(SRC, relPath);
  if (imageCache.has(abs)) return imageCache.get(abs);
  if (!existsSync(abs)) { imageCache.set(abs, null); return null; }
  if (extname(abs).toLowerCase() === '.svg') {
    const source = readFileSync(abs, 'utf8')
      .replace(/^\uFEFF/, '')
      .replace(/<\?xml[^>]*>\s*/i, '');
    const uri = `data:image/svg+xml;base64,${Buffer.from(source, 'utf8').toString('base64')}`;
    imageCache.set(abs, uri);
    return uri;
  }
  const buf = await sharp(abs)
    .resize({ width: 1100, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const uri = `data:image/webp;base64,${buf.toString('base64')}`;
  imageCache.set(abs, uri);
  return uri;
}

// ---------- Markdown ----------

// 私有区字符作占位符，正文里不会出现
const SENTINEL = String.fromCharCode(0xe000);
const RESTORE = new RegExp(SENTINEL + String.raw`(\d+)` + SENTINEL, "g");

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  const stash = [];
  const keep = (html) => SENTINEL + (stash.push(html) - 1) + SENTINEL;

  s = s.replace(/\$([^$\n]+)\$/g, (_, m) => keep(`<span class="math">${esc(m)}</span>`));
  s = s.replace(/`([^`]+)`/g, (_, m) => keep(`<code>${esc(m)}</code>`));
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,
    (_, t, u) => keep(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`));
  s = s.replace(/\[([^\]]+)\]\(<?[^)]*\.(?:md|pdf|ipynb)>?\)/g, (_, t) => keep(esc(t)));

  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s.replace(RESTORE, (_, i) => stash[Number(i)]);
}

async function render(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  const isTableSep = (l) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes('-');
  const cells = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { i += 1; continue; }

    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim();
      const buf = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i += 1; }
      i += 1;
      out.push(`<pre class="code"${lang ? ` data-lang="${esc(lang)}"` : ''}><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }

    if (/^\$\$/.test(line)) {
      const buf = [];
      const one = line.trim();
      if (one.length > 4 && one.endsWith('$$')) {
        buf.push(one.slice(2, -2));
        i += 1;
      } else {
        const openingText = line.replace(/^\s*\$\$/, '').trimEnd();
        if (openingText) buf.push(openingText);
        i += 1;
        while (i < lines.length && !/\$\$/.test(lines[i])) { buf.push(lines[i]); i += 1; }
        if (i < lines.length) {
          const closingText = lines[i].replace(/\$\$\s*$/, '').trimEnd();
          if (closingText) buf.push(closingText);
          i += 1;
        }
      }
      out.push(`<div class="math-block">${esc(buf.join('\n').trim())}</div>`);
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i += 1;
      continue;
    }

    if (/^---+\s*$/.test(line)) { out.push('<hr>'); i += 1; continue; }

    if (/^>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i += 1; }
      out.push(`<blockquote>${buf.filter(Boolean).map((b) => `<p>${inline(b)}</p>`).join('')}</blockquote>`);
      continue;
    }

    // <picture> 两版式：手机版走 srcset，宽屏走 img，两份都内嵌
    if (/^<picture>/.test(line)) {
      const buf = [];
      while (i < lines.length && !/<\/picture>/.test(lines[i])) { buf.push(lines[i]); i += 1; }
      if (i < lines.length) { buf.push(lines[i]); i += 1; }
      const block = buf.join('\n');
      const mob = /srcset="([^"]+)"/.exec(block);
      const desk = /<img src="([^"]+)"[^>]*alt="([^"]*)"/.exec(block);
      const mobUri = mob ? await embed(mob[1]) : null;
      const deskUri = desk ? await embed(desk[1]) : null;
      let cap = '';
      let j = i;
      while (j < lines.length && /^\s*$/.test(lines[j])) j += 1;
      if (j < lines.length && /^\*[^*].*\*\s*$/.test(lines[j])) {
        cap = `<figcaption>${inline(lines[j].trim().replace(/^\*|\*$/g, ''))}</figcaption>`;
        i = j + 1;
      }
      out.push(deskUri
        ? `<figure><picture>${mobUri ? `<source media="(max-width: 640px)" srcset="${mobUri}">` : ''}`
          + `<img src="${deskUri}" alt="${esc(desk[2])}" loading="lazy"></picture>${cap}</figure>`
        : `<figure class="missing"><div>缺图</div>${cap}</figure>`);
      continue;
    }

    const img = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line);
    if (img) {
      const uri = await embed(img[2]);
      let cap = '';
      let j = i + 1;
      while (j < lines.length && /^\s*$/.test(lines[j])) j += 1;
      if (j < lines.length && /^\*[^*].*\*\s*$/.test(lines[j])) {
        cap = `<figcaption>${inline(lines[j].trim().replace(/^\*|\*$/g, ''))}</figcaption>`;
        i = j;
      }
      out.push(uri
        ? `<figure><img src="${uri}" alt="${esc(img[1])}" loading="lazy">${cap}</figure>`
        : `<figure class="missing"><div>缺图：${esc(img[2])}</div>${cap}</figure>`);
      i += 1;
      continue;
    }

    if (/^\s*\|/.test(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { body.push(cells(lines[i])); i += 1; }
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
        `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    const bullet = /^(\s*)([-*]|\d+\.)\s+/.exec(line);
    if (bullet) {
      const ordered = /\d/.test(bullet[2]);
      const items = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        const buf = [m[3]];
        i += 1;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s/.test(lines[i])) {
          buf.push(lines[i].trim());
          i += 1;
        }
        items.push(buf.join(' '));
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    if (/^\*[^*].*\*\s*$/.test(line)) {
      out.push(`<p class="caption">${inline(line.trim().replace(/^\*|\*$/g, ''))}</p>`);
      i += 1;
      continue;
    }

    const buf = [line];
    i += 1;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|```|>|\s*\||\s*[-*]\s|\d+\.\s|!\[|\$\$|---+\s*$)/.test(lines[i])) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(`<p>${inline(buf.join(''))}</p>`);
  }

  return out.join('\n');
}

// ---------- 组装 ----------

const CSS = `
/* 配色沿用课程配图的 MATLAB 默认蓝 #0072BD，中性色统一带一点蓝偏。 */
:root{
  --bg:#f5f7fa; --panel:#ffffff; --ink:#131a21; --muted:#5b6673; --line:#e0e6ec;
  --accent:#0072BD; --accent-soft:#e9f1f8; --code-bg:#f1f4f7;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --bg:#0f1419; --panel:#161c23; --ink:#e4ebf2; --muted:#8d9aa8; --line:#28313b;
    --accent:#5aa9e6; --accent-soft:#152532; --code-bg:#1c232b;
  }
}
:root[data-theme="dark"]{
  --bg:#0f1419; --panel:#161c23; --ink:#e4ebf2; --muted:#8d9aa8; --line:#28313b;
  --accent:#5aa9e6; --accent-soft:#152532; --code-bg:#1c232b;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,-apple-system,"Segoe UI",sans-serif;
  font-size:16.5px;line-height:1.9;-webkit-text-size-adjust:100%}
h1,h2,h3{font-family:"Noto Serif SC","Songti SC","SimSun",Georgia,serif;font-weight:600;text-wrap:balance}

.shell{max-width:1160px;margin:0 auto;padding:0 22px 110px;
  display:grid;grid-template-columns:236px minmax(0,1fr);gap:44px}
@media(max-width:920px){.shell{grid-template-columns:1fr;gap:0}}
header.top{max-width:1160px;margin:0 auto;padding:52px 22px 10px}
header.top .eyebrow{font-size:11.5px;letter-spacing:.16em;color:var(--accent);
  font-family:ui-monospace,Consolas,monospace;margin:0 0 12px}
header.top h1{font-size:31px;line-height:1.35;margin:0 0 12px;letter-spacing:-.005em}
header.top p{margin:0;color:var(--muted);font-size:15px;max-width:56ch;line-height:1.8}

.toolbar{max-width:1160px;margin:0 auto;padding:20px 22px 14px;display:flex;gap:12px;
  align-items:center;flex-wrap:wrap}
.toolbar button{font:inherit;font-size:13px;padding:6px 14px;border-radius:99px;cursor:pointer;
  border:1px solid var(--line);background:var(--panel);color:var(--muted)}
.toolbar button:hover{color:var(--ink);border-color:var(--accent)}
.toolbar button:focus-visible,nav.side a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.note{color:var(--muted);font-size:12.5px}

nav.side{position:sticky;top:22px;align-self:start;padding:22px 0;font-size:14px}
@media(max-width:920px){nav.side{position:static;border-bottom:1px solid var(--line);
  margin-bottom:26px;padding-top:6px}}
nav.side .rail-label{font-size:11px;letter-spacing:.16em;color:var(--muted);
  font-family:ui-monospace,Consolas,monospace;padding:0 10px 10px}
nav.side ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
nav.side a{display:flex;gap:9px;padding:8px 10px;border-radius:8px;color:var(--muted);
  text-decoration:none;line-height:1.5}
nav.side a:hover{background:var(--accent-soft);color:var(--ink)}
nav.side a .n{font-variant-numeric:tabular-nums;font-family:ui-monospace,Consolas,monospace;
  color:var(--accent);font-weight:600;font-size:12.5px;padding-top:2px}

main{min-width:0;display:flex;flex-direction:column;gap:34px}
article{background:var(--panel);border:1px solid var(--line);border-radius:16px;
  padding:44px 52px 40px;overflow-wrap:anywhere}
@media(max-width:640px){article{padding:26px 20px;border-radius:12px}}
article>*{max-width:44em}
article>figure,article>.table-wrap,article>pre.code{max-width:none}
article>h1{font-size:27px;line-height:1.45;margin:0 0 26px}

h2{font-size:20px;margin:42px 0 16px;padding-top:18px;border-top:1px solid var(--line);line-height:1.5}
article>h2:first-of-type{border-top:0;padding-top:0}
h3{font-size:17px;margin:30px 0 12px}

p{margin:0 0 16px}
strong{font-weight:650}
a{color:var(--accent)}
hr{border:0;border-top:1px solid var(--line);margin:34px 0;max-width:44em}
blockquote{margin:0 0 22px;padding:16px 20px;background:var(--accent-soft);
  border-left:3px solid var(--accent);border-radius:0 10px 10px 0;font-size:14.5px;line-height:1.8}
blockquote p{margin:0 0 6px}blockquote p:last-child{margin:0}
ul,ol{margin:0 0 18px;padding-left:1.55em}
li{margin:0 0 8px}

figure{margin:28px 0 26px;text-align:center}
figure img{max-width:100%;height:auto;border:1px solid var(--line);border-radius:10px;background:#fff}
figcaption,.caption{color:var(--muted);font-size:13.5px;line-height:1.75;margin-top:11px;
  text-align:left;max-width:44em}
.missing div{padding:28px;border:1px dashed var(--line);border-radius:10px;color:var(--muted);font-size:14px}

.table-wrap{overflow-x:auto;margin:0 0 22px;border:1px solid var(--line);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:14.5px;font-variant-numeric:tabular-nums}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top;line-height:1.7}
th{background:var(--code-bg);font-weight:650;white-space:nowrap;font-size:13.5px}
tr:last-child td{border-bottom:0}

code{background:var(--code-bg);padding:1px 5px;border-radius:4px;font-size:.9em;
  font-family:ui-monospace,"SFMono-Regular",Consolas,monospace}
pre.code{background:var(--code-bg);border:1px solid var(--line);border-radius:10px;
  padding:16px 18px;overflow-x:auto;margin:0 0 22px;font-size:13.5px;line-height:1.7}
pre.code code{background:none;padding:0}
pre.code[data-lang]::before{content:attr(data-lang);display:block;color:var(--muted);
  font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:9px}
.math{font-family:ui-monospace,Consolas,monospace;font-size:.93em;color:var(--accent)}
.math-block{font-family:ui-monospace,Consolas,monospace;white-space:pre-wrap;text-align:center;
  background:var(--accent-soft);border-radius:10px;padding:14px 18px;margin:0 0 22px;
  font-size:14px;overflow-x:auto;max-width:44em}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const JS = `
(function(){
  var btn=document.getElementById('theme');
  if(btn){btn.addEventListener('click',function(){
    var r=document.documentElement;
    var dark=r.getAttribute('data-theme')==='dark'||
      (!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);
    r.setAttribute('data-theme',dark?'light':'dark');
    btn.textContent=dark?'切换到深色':'切换到浅色';
  });}
})();
`;

const files = readdirSync(SRC)
  .filter((f) => /^\d\d-.*\.md$/.test(f))
  .sort();

const articles = [];
for (const f of files) {
  const md = readFileSync(join(SRC, f), 'utf8');
  const title = (/^#\s+(.*)$/m.exec(md) ?? [, basename(f, '.md')])[1];
  articles.push({ id: f.slice(0, 2), title, html: await render(md) });
}

const nav = articles.map((a) =>
  `<li><a href="#a${a.id}"><span class="n">${a.id}</span>${esc(a.title.split(/[？?：:]/)[0])}</a></li>`).join('');

const body = articles.map((a) => `<article id="a${a.id}">\n${a.html}\n</article>`).join('\n');

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
  'family=Noto+Sans+SC:wght@400;500;650&family=Noto+Serif+SC:wght@500;600&display=swap">';

const fragment = `<title>零基础音频科普 · 第 01–05 课</title>
${FONTS}
<style>${CSS}</style>
<header class="top">
  <p class="eyebrow">第 01–05 课 · 零基础改写</p>
  <h1>把声音讲给完全不懂的人听</h1>
  <p>从录音软件、乐器和倒转的车轮等日常现象出发，逐步讲到声音的数字表示、公式、代码和适用边界。正文不要求读者预先学过人工智能或信号处理。</p>
</header>
<div class="toolbar">
  <button id="theme" type="button">切换深浅色</button>
  <span class="note">公式以等宽样式呈现，未做数学排版渲染。</span>
</div>
<div class="shell">
  <nav class="side"><p class="rail-label">目录</p><ol>${nav}</ol></nav>
  <main>${body}</main>
</div>
<script>${JS}</script>`;

const full = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>零基础音频科普 · 第 01–05 课</title></head><body>
${fragment}
</body></html>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(`${OUT}.html`, full, 'utf8');
writeFileSync(`${OUT}.artifact.html`, fragment, 'utf8');

const kb = (s) => `${(Buffer.byteLength(s, 'utf8') / 1024 / 1024).toFixed(2)} MB`;
console.log(`文章 ${articles.length} 篇，图片 ${[...imageCache.values()].filter(Boolean).length} 张`);
console.log(`${OUT}.html  ${kb(full)}`);
console.log(`${OUT}.artifact.html  ${kb(fragment)}`);
