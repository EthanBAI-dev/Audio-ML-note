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

export const GROUP_TITLE = GROUP_TITLES;

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
