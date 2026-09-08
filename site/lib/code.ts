import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { COURSE } from './lessons';

export const CODE_ROOT = join(COURSE, '课程代码');

/** 打包下载。文件由 scripts/sync-assets.mjs 在构建前生成到 public/downloads/。 */
export const CODE_ZIP = '/downloads/audio-ml-course-code.zip';

export function zipSizeLabel(): string | null {
  const abs = join(process.cwd(), 'public', CODE_ZIP.replace(/^\//, ''));
  if (!existsSync(abs)) return null;
  return `${Math.max(1, Math.round(statSync(abs).size / 1024))} KB`;
}

/** 课程代码没随目录发布时，构建期就该看得出来，而不是让读者点到空页面。 */
export function codeAvailable(): boolean {
  return existsSync(join(CODE_ROOT, 'README.md'));
}

/** 站内展示哪些源码文件。data/ 是脚本产物，不进站。 */
const SHOWN_DIRS = ['lessons', 'soundlab'] as const;

export type CodeFile = { path: string; dir: string; name: string };

export function codeFiles(): CodeFile[] {
  if (!codeAvailable()) return [];
  const out: CodeFile[] = [];
  for (const dir of SHOWN_DIRS) {
    const abs = join(CODE_ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs).sort()) {
      if (!/\.(py|txt|csv)$/.test(name)) continue;
      out.push({ path: `${dir}/${name}`, dir, name });
    }
  }
  return out;
}

/** 读一个源码文件。路径来自 URL，所以要挡住 ../ 这类穿越，越界一律当不存在。 */
export function readCodeFile(parts: string[]): { path: string; text: string } | null {
  if (!codeAvailable() || parts.length === 0) return null;
  const abs = resolve(CODE_ROOT, ...parts);
  const inside = relative(CODE_ROOT, abs);
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) return null;
  if (!existsSync(abs) || !statSync(abs).isFile()) return null;
  return { path: inside.split(sep).join('/'), text: readFileSync(abs, 'utf8') };
}

/** 脚本文件名里的课号：lesson07_three_time_features.py -> "07" */
export function lessonOf(name: string): string | null {
  return /^lesson(\d\d)_/.exec(name)?.[1] ?? null;
}
