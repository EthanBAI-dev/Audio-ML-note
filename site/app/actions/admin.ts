'use server';
import { adminUserId, groupOf, shortName } from '../../lib/admin';
import { commitUrl, editablePath, githubConfigured, writeArticle } from '../../lib/github';
import { renderLesson } from '../../lib/markdown';
import type { Lesson } from '../../lib/lessons';

const MAX_LENGTH = 400_000;

/** 编辑器右侧的实时预览，和文章页用同一套渲染（交互组件只在正式页面出现）。 */
export async function previewArticle(path: string, markdown: string): Promise<string> {
  if (!await adminUserId() || !editablePath(path)) return '';
  const lesson = { group: groupOf(path) } as Lesson;
  try {
    return await renderLesson(markdown.slice(0, MAX_LENGTH), lesson);
  } catch (error) {
    return `<pre>${String(error).replace(/</g, '&lt;')}</pre>`;
  }
}

export type SaveState =
  | { ok: true; sha: string; commitUrl: string }
  | { ok: false; error: string };

export async function saveArticle(path: string, markdown: string, sha: string, summary: string): Promise<SaveState> {
  if (!await adminUserId()) return { ok: false, error: '登录已过期或没有管理员权限，请重新登录。' };
  if (!editablePath(path)) return { ok: false, error: '这个文件不在可编辑范围内。' };
  if (!githubConfigured) return { ok: false, error: '服务器没有配置 GITHUB_TOKEN，暂时无法保存。' };
  if (!markdown.trim()) return { ok: false, error: '文章不能为空。' };
  if (markdown.length > MAX_LENGTH) return { ok: false, error: '文章太长了。' };

  const title = summary.trim().slice(0, 120) || `修改 ${shortName(path)}`;
  const result = await writeArticle(path, markdown, sha, `${title}\n\n通过网站后台编辑。`);
  if (result.ok) return { ok: true, sha: result.sha, commitUrl: commitUrl(result.commit) };
  if (result.reason === 'conflict') {
    return { ok: false, error: '你打开之后，这篇文章在仓库里被改过了。先把你的改动复制出来，刷新页面拿到最新版再合并。' };
  }
  console.error('[admin] 保存失败', result.detail);
  return { ok: false, error: 'GitHub 拒绝了这次提交，请检查令牌权限后再试。' };
}
