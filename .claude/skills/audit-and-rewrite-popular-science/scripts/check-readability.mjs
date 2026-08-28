#!/usr/bin/env node
// 零基础可读性检查器
//
// 用法:
//   node check-readability.mjs <文件或目录> [...更多路径]
//   node check-readability.mjs --terms path/to/terms.json <文件>
//   node check-readability.mjs --json <文件>
//
// 它是一把筛子，不是判官：它能可靠地找出「术语第一次出现时没有解释」
// 「开头就上术语」「一段里塞了太多新词」，但判断解释是否真的说清楚了，
// 仍然要靠人和 references/zero-basis-rules.md 的读者模拟。
//
// 退出码: 0 = 无 ERROR；1 = 有 ERROR；2 = 用法或读取错误。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TERMS = resolve(HERE, '..', 'references', 'terms-zh.json');

// ---------- 参数 ----------

const argv = process.argv.slice(2);
let termsPath = DEFAULT_TERMS;
let asJson = false;
const targets = [];

for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--terms') { termsPath = argv[++i]; }
  else if (a === '--json') { asJson = true; }
  else if (a === '-h' || a === '--help') { usage(); process.exit(0); }
  else { targets.push(a); }
}

if (targets.length === 0) { usage(); process.exit(2); }

function usage() {
  console.log('用法: node check-readability.mjs [--terms terms.json] [--json] <文件或目录>...');
}

// ---------- 词表 ----------

let dict;
try {
  dict = JSON.parse(readFileSync(termsPath, 'utf8'));
} catch (err) {
  console.error(`无法读取词表 ${termsPath}: ${err.message}`);
  process.exit(2);
}

const NEVER = new Set(dict.neverFlag ?? []);
// 最长优先，避免「频谱质心」被拆成「频谱」
const TERMS = [...new Set(dict.terms ?? [])]
  .filter((t) => t && !NEVER.has(t))
  .sort((a, b) => b.length - a.length);
const MARKERS = dict.explainMarkers ?? [];

// ---------- 解析 ----------

// 把 markdown 切成块：跳过代码块、术语表小节、来源小节。
function parse(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let buf = [];
  let bufStart = 0;
  let inFence = false;
  let inHtml = false;
  let skipSection = false;
  // 深度不靠标题判断，按位置推断：
  //   L1 = 第一个二级标题之前的开场段落，必须零未经解释术语
  //   L2 = 正文前半，出现第一个公式或代码块之前
  //   L3 = 正文深入区，出现公式或代码之后
  let layer = 'L1';
  let labeled = false;
  const headings = [];

  const flush = () => {
    if (buf.length === 0) return;
    const text = buf.join('\n');
    if (text.trim()) {
      blocks.push({ line: bufStart + 1, text, layer, skipped: skipSection });
    }
    buf = [];
  };

  lines.forEach((raw, idx) => {
    if (/^\s*```/.test(raw)) { flush(); inFence = !inFence; if (layer !== 'tail') layer = 'L3'; return; }
    if (inFence) return;
    // 跳过原始 HTML 块（例如 <picture> 两版式），alt 文本不属于正文
    if (/^s*<(picture|figure|div|source|img)/i.test(raw)) { flush(); inHtml = true; }
    if (inHtml) {
      const low = raw.toLowerCase();
      if (low.includes('</picture>') || low.includes('</figure>') || low.includes('</div>')) inHtml = false;
      return;
    }
    if (/^\s*\$\$/.test(raw) && layer !== 'tail') { flush(); layer = 'L3'; }

    const h = /^(#{1,6})\s/.exec(raw);
    if (h) {
      flush();
      const title = raw.replace(/^#{1,6}\s*/, '').trim();
      headings.push({ line: idx + 1, title });
      // 只有二级标题切换所在层与跳过状态；三级标题仍属于同一层
      if (h[1].length <= 2) {
        skipSection = /^(本文出现的专业词|术语表|课程来源|复现材料|参考资料|参考文献|延伸阅读)/.test(title);
        if (/第[一二三]层/.test(title)) labeled = true;
        if (skipSection) layer = 'tail';
        else if (layer === 'L1') layer = 'L2';
      }
      return;
    }

    if (raw.trim() === '') { flush(); bufStart = idx + 1; return; }
    if (buf.length === 0) bufStart = idx;
    buf.push(raw);
  });
  flush();

  return { blocks, headings, labeled };
}

// 段落文本清洗：去掉行内代码、公式、链接 URL、图片路径
function clean(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')      // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')     // 链接保留文字
    .replace(/`[^`]*`/g, ' ')                    // 行内代码
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')           // 块公式
    .replace(/\$[^$\n]*\$/g, ' ');               // 行内公式
}

// 找出一段里出现的术语（跨度不重叠，最长优先）
function findTerms(text) {
  const taken = new Array(text.length).fill(false);
  const hits = [];
  for (const term of TERMS) {
    let from = 0;
    for (;;) {
      const at = text.indexOf(term, from);
      if (at < 0) break;
      let free = true;
      for (let i = at; i < at + term.length; i += 1) if (taken[i]) { free = false; break; }
      if (free) {
        for (let i = at; i < at + term.length; i += 1) taken[i] = true;
        hits.push({ term, at });
      }
      from = at + term.length;
    }
  }
  return hits.sort((a, b) => a.at - b.at);
}

// 这一处出现是否伴随解释？
// 判据: 被 ** ** 加粗，或前后 40 字内出现解释标记词。
function looksExplained(text, hit) {
  const a = Math.max(0, hit.at - 40);
  const b = Math.min(text.length, hit.at + hit.term.length + 40);
  const window = text.slice(a, b);
  if (new RegExp(`\\*\\*[^*]{0,12}${escapeRe(hit.term)}[^*]{0,12}\\*\\*`).test(window)) return true;
  if (new RegExp(`「[^」]{0,12}${escapeRe(hit.term)}[^」]{0,12}」`).test(window)) return true;
  return MARKERS.some((m) => window.includes(m));
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------- 检查 ----------

function check(file) {
  const md = readFileSync(file, 'utf8');
  const { blocks, headings, labeled } = parse(md);
  const findings = [];
  const introduced = new Map(); // term -> {line, explained}
  const add = (level, line, msg) => findings.push({ level, line, msg });

  // 结构
  const titles = headings.map((h) => h.title).join(' | ');
  if (labeled) {
    add('ERROR', 1, '标题里出现「第一层 / 第二层 / 第三层」：深度顺序不能写在明面上，标题要讲内容');
  }
  if (/怎么读这篇文章|阅读提示|本文分三层/.test(md)) {
    add('ERROR', 1, '出现了讲解文章自身结构的导读段落，删掉；文章要像文章，不要像模板');
  }
  const openingLines = md.split(/\r?\n/).slice(0, 12).join('\n');
  if (!/^>\s*(?:\*\*)?导读[：:]/m.test(openingLines)) {
    add('WARN', 1, '标题下缺少两到三句内容导读：应说明现实问题、技术重点和阅读收获');
  }
  if (/课程来源|复现材料/.test(titles)) {
    add('WARN', 1, '文末出现「课程来源 / 复现材料」小节，除非用户明确要求，否则删掉');
  }

  const body = blocks.filter((b) => !b.skipped && !/^>/.test(b.text.trim()));
  let bodyParaSeen = 0;

  for (const block of body) {
    const isCaption = /^\*图\s*\d/.test(block.text.trim());
    const text = clean(block.text);
    const hits = findTerms(text);
    if (hits.length === 0) {
      if (!isCaption) bodyParaSeen += 1;
      continue;
    }

    const newHere = [];
    for (const hit of hits) {
      const known = introduced.get(hit.term);
      const explained = looksExplained(text, hit);
      if (!known) {
        introduced.set(hit.term, { line: block.line, explained });
        newHere.push({ ...hit, explained });
      }
    }

    const opening = bodyParaSeen < 2;
    for (const n of newHere) {
      if (n.explained) continue;
      if (opening) {
        add('ERROR', block.line, `开头前两段出现未解释的术语「${n.term}」`);
      } else if (block.layer === 'L1') {
        add('ERROR', block.line, `开场场景中出现未解释的术语「${n.term}」`);
      } else if (block.layer === 'L2') {
        add('WARN', block.line, `正文前半首次出现「${n.term}」，附近没有解释标记`);
      } else {
        add('INFO', block.line, `正文深入区首次出现「${n.term}」，附近没有解释标记（仍建议就地说明）`);
      }
    }

    // 用陌生词解释陌生词：本段有解释动作，同时又带进别的新词
    const explainedHere = newHere.filter((n) => n.explained);
    const unexplainedHere = newHere.filter((n) => !n.explained);
    if (explainedHere.length > 0 && unexplainedHere.length > 0 && block.layer !== 'L3') {
      add('WARN', block.line,
        `疑似用陌生词解释陌生词：本段解释了「${explainedHere.map((n) => n.term).join('、')}」，` +
        `却同时引入未解释的「${unexplainedHere.map((n) => n.term).join('、')}」`);
    }

    // 密度
    if (newHere.length >= 3 && block.layer !== 'L3') {
      add('WARN', block.line,
        `本段引入 ${newHere.length} 个新术语（${newHere.map((n) => n.term).join('、')}），建议拆分或删减`);
    } else if (newHere.length >= 5) {
      add('INFO', block.line, `正文深入区本段引入 ${newHere.length} 个新术语，确认是否需要分节`);
    }

    if (isCaption && block.layer !== 'L3' && newHere.some((n) => !n.explained)) {
      add('WARN', block.line, '图注中出现尚未解释的术语，零基础读者会先看图注');
    }

    if (!isCaption) bodyParaSeen += 1;
  }

  return { file, findings, introduced };
}

// ---------- 遍历 ----------

function collect(p) {
  const st = statSync(p);
  if (st.isDirectory()) {
    return readdirSync(p)
      .filter((f) => f.endsWith('.md'))
      .map((f) => join(p, f))
      .flatMap(collect);
  }
  return [p];
}

let files = [];
try {
  files = targets.flatMap(collect);
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

const results = files.map(check);

if (asJson) {
  console.log(JSON.stringify(results.map((r) => ({
    file: r.file,
    findings: r.findings,
    terms: [...r.introduced].map(([term, v]) => ({ term, line: v.line, explained: v.explained })),
  })), null, 2));
} else {
  for (const r of results) {
    const e = r.findings.filter((f) => f.level === 'ERROR').length;
    const w = r.findings.filter((f) => f.level === 'WARN').length;
    console.log(`\n=== ${basename(r.file)} ===`);
    console.log(`术语 ${r.introduced.size} 个，ERROR ${e}，WARN ${w}`);
    const order = { ERROR: 0, WARN: 1, INFO: 2 };
    for (const f of [...r.findings].sort((a, b) => order[a.level] - order[b.level] || a.line - b.line)) {
      console.log(`  [${f.level}] L${f.line}: ${f.msg}`);
    }
  }
  const totalErr = results.reduce((n, r) => n + r.findings.filter((f) => f.level === 'ERROR').length, 0);
  console.log(`\n合计 ERROR ${totalErr}（ERROR 必须清零；WARN 必须逐条给出保留理由）`);
}

process.exit(results.some((r) => r.findings.some((f) => f.level === 'ERROR')) ? 1 : 0);
