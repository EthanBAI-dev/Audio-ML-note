import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const COURSE = join(process.cwd(), '..', '音频信号处理二十三讲');

export type Lesson = {
  id: string;            // "01"
  n: number;             // 1
  group: string;         // "01-05"
  slug: string;          // "01"
  file: string;          // 绝对路径
  title: string;         // 一级标题
  lead: string;          // 导读（去掉 "导读：" 前缀）
};

export type Group = { group: string; title: string; lessons: Lesson[] };

const GROUP_TITLES: Record<string, string> = {
  '01-05': '认识声音与数字录音',
  '06-10': '把录音变成可计算片段',
  '11-15': '从波形进入时间—频率表示',
  '16-20': '把频谱整理成模型输入',
  '21-23': '用少量数字概括频谱',
};

let cache: Lesson[] | null = null;

export function allLessons(): Lesson[] {
  if (cache) return cache;
  const out: Lesson[] = [];
  for (const d of readdirSync(COURSE)) {
    const gm = /^第(\d\d-\d\d)课$/.exec(d);
    if (!gm) continue;
    for (const f of readdirSync(join(COURSE, d))) {
      const fm = /^(\d\d)-.*\.md$/.exec(f);
      if (!fm) continue;
      const file = join(COURSE, d, f);
      const raw = readFileSync(file, 'utf8');
      const title = (/^#\s+(.+)$/m.exec(raw)?.[1] ?? f).trim();
      const leadRaw = /^>\s*\*\*导读：\*\*\s*([\s\S]*?)(?:\n(?!>)|$)/m.exec(raw)?.[1] ?? '';
      out.push({
        id: fm[1], n: Number(fm[1]), group: gm[1], slug: fm[1], file, title,
        lead: leadRaw.replace(/\n>\s*/g, ' ').replace(/\*\*/g, '').trim(),
      });
    }
  }
  cache = out.sort((a, b) => a.n - b.n);
  return cache;
}

export function lessonById(id: string): Lesson | undefined {
  return allLessons().find((l) => l.id === id);
}

export function groups(): Group[] {
  const map = new Map<string, Lesson[]>();
  for (const l of allLessons()) {
    if (!map.has(l.group)) map.set(l.group, []);
    map.get(l.group)!.push(l);
  }
  return [...map.entries()].map(([group, lessons]) => ({
    group, title: GROUP_TITLES[group] ?? group, lessons,
  }));
}

/** 粗略阅读时长：中文按每分钟 400 字算，代码块和公式不计。 */
export function readingMinutes(l: Lesson): number {
  const body = readFileSync(l.file, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<picture[\s\S]*?<\/picture>/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '');
  return Math.max(1, Math.round(body.length / 400));
}

export function rawBody(l: Lesson): string {
  let t = readFileSync(l.file, 'utf8');
  t = t.replace(/^#\s+.+$/m, '');                       // 标题另行渲染
  t = t.replace(/^>\s*\*\*导读：\*\*[\s\S]*?(?=\n\n)/m, ''); // 导读另行渲染
  return t.trim();
}

/** 读 课程总纲 / 课程项目 这类单页文档，拆出真正的标题、导读和正文。
 *  它们和课程文章是同一种写法，页面头部也该长一样。 */
export function readDoc(dir: string): { title: string; lead: string; body: string } {
  const raw = readFileSync(join(COURSE, dir, 'README.md'), 'utf8');
  const title = (/^#\s+(.+)$/m.exec(raw)?.[1] ?? dir).trim();
  const lead = (/^>\s*\*\*导读：\*\*\s*([\s\S]*?)(?:\n(?!>)|$)/m.exec(raw)?.[1] ?? '')
    .replace(/\n>\s*/g, ' ').replace(/\*\*/g, '').trim();
  let body = raw.replace(/^#\s+.+$/m, '');
  body = body.replace(/^>\s*\*\*导读：\*\*[\s\S]*?(?=\n\n)/m, '');
  return { title, lead, body: body.trim() };
}

// ---------------------------------------------------------------- v2（试行）
// v2 和原版并排保留：原版目录一个字不动，v2 课程放在「音频信号处理二十三讲-v2」。

export const REPO_BLOB = 'https://github.com/EthanBAI-dev/Audio-ML-note/blob/main';
export const V2_COMPARE = (id: string) => `${REPO_BLOB}/${encodeURI(`音频信号处理二十三讲-v2/对照-第${id}课.md`)}`;

export const COURSE_V2 = join(process.cwd(), '..', '音频信号处理二十三讲-v2');

let cacheV2: Lesson[] | null = null;

export function v2Lessons(): Lesson[] {
  if (cacheV2) return cacheV2;
  const out: Lesson[] = [];
  if (existsSync(COURSE_V2)) {
    for (const d of readdirSync(COURSE_V2)) {
      const gm = /^第(\d\d-\d\d)课$/.exec(d);
      if (!gm) continue;
      for (const f of readdirSync(join(COURSE_V2, d))) {
        const fm = /^(\d\d)-.*\.md$/.exec(f);
        if (!fm) continue;
        const file = join(COURSE_V2, d, f);
        const raw = readFileSync(file, 'utf8');
        const title = (/^#\s+(.+)$/m.exec(raw)?.[1] ?? f).trim().replace(/^第\s*\d+\s*课\s*/, '');
        const goal = /^>\s*\*\*本课目标：\*\*\s*(.+)$/m.exec(raw)?.[1] ?? '';
        out.push({ id: fm[1], n: Number(fm[1]), group: gm[1], slug: fm[1], file, title,
          lead: goal.replace(/\*\*/g, '').trim() });
      }
    }
  }
  cacheV2 = out.sort((a, b) => a.n - b.n);
  return cacheV2;
}

export function v2LessonById(id: string): Lesson | undefined {
  return v2Lessons().find((l) => l.id === id);
}

/** v2 正文：去掉标题；把指向原版目录的相对路径改写成原版课文里的写法，好复用同一套站点改写规则。 */
export function v2RawBody(l: Lesson): string {
  const has = new Set(v2Lessons().map((x) => x.id));
  return readFileSync(l.file, 'utf8')
    .replace(/^#\s+.+$/m, '')
    // v2 课文之间的互链（同组或 ../第GG-GG课/）：有 v2 就留在 v2，没有就回原版
    .replace(/\]\((?:\.\.\/第\d\d-\d\d课\/)?(\d\d)-[^)/]*\.md\)/g,
      (_m, n) => `](${has.has(n) ? '/v2' : ''}/lesson/${n})`)
    .replace(/\.\.\/\.\.\/音频信号处理二十三讲\//g, '../')
    .trim();
}

export type Term = { zh: string; en: string; desc: string; first: string; lesson: string };

/** 从每篇 v2 课文的「## 📖 本课术语」表格里收集术语，按首次出现的课排序、去重。 */
export function v2Glossary(): Term[] {
  const seen = new Map<string, Term>();
  for (const l of v2Lessons()) {
    const raw = readFileSync(l.file, 'utf8');
    const sec = /^## 📖 本课术语\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(raw)?.[1] ?? '';
    for (const row of sec.split('\n')) {
      const c = row.split('|').map((x) => x.trim());
      if (c.length < 6 || c[1] === '中文' || /^-+$/.test(c[1])) continue;
      if (!seen.has(c[1])) seen.set(c[1], { zh: c[1], en: c[2], desc: c[3], first: c[4], lesson: l.id });
    }
  }
  return [...seen.values()];
}
