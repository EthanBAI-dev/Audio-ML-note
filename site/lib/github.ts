/** 后台改文章走 GitHub 接口：读最新版、提交新版。文章仍然只存在仓库里，
 *  提交到主分支后 Vercel 自动重新部署，修改历史就是 git 历史。 */

const API = process.env.GITHUB_API_URL || 'https://api.github.com';

export const githubRepo = process.env.GITHUB_REPO || 'EthanBAI-dev/Audio-ML-note';
export const githubBranch = process.env.GITHUB_BRANCH || 'main';
export const githubConfigured = Boolean(process.env.GITHUB_TOKEN);

/** 后台能改的文章：课程目录（以及将来的 v2 目录）里的 Markdown，代码目录不在其中。 */
const ROOTS = ['音频信号处理二十三讲/', '音频信号处理二十三讲-v2/'];

export function editablePath(path: string): boolean {
  return ROOTS.some((r) => path.startsWith(r))
    && path.endsWith('.md')
    && !path.includes('/课程代码/')
    && !path.split('/').some((seg) => seg === '' || seg === '.' || seg === '..')
    && path.length <= 300;
}

/** 仓库里文件的网页地址，用来链到修改历史。 */
export function historyUrl(path: string): string {
  return `https://github.com/${githubRepo}/commits/${githubBranch}/${encodePath(path)}`;
}

export function commitUrl(sha: string): string {
  return `https://github.com/${githubRepo}/commit/${sha}`;
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function gh(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}/repos/${githubRepo}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

/** 主分支上所有可编辑文章的路径，按路径排好。 */
export async function listArticles(): Promise<string[]> {
  const res = await gh(`/git/trees/${encodeURIComponent(githubBranch)}?recursive=1`);
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  const data = await res.json() as { tree: { path: string; type: string }[] };
  return data.tree.filter((t) => t.type === 'blob' && editablePath(t.path)).map((t) => t.path).sort();
}

export type ArticleFile = { path: string; content: string; sha: string };

export async function readArticle(path: string): Promise<ArticleFile | null> {
  const res = await gh(`/contents/${encodePath(path)}?ref=${encodeURIComponent(githubBranch)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  const data = await res.json() as { content: string; sha: string };
  return { path, content: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha };
}

export type SaveResult =
  | { ok: true; sha: string; commit: string }
  | { ok: false; reason: 'conflict' | 'failed'; detail?: string };

/** sha 是打开文件时的版本；期间有人改过，GitHub 会拒绝，免得悄悄盖掉别人的修改。 */
export async function writeArticle(path: string, content: string, sha: string, message: string): Promise<SaveResult> {
  const res = await gh(`/contents/${encodePath(path)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message, sha, branch: githubBranch,
      content: Buffer.from(content, 'utf8').toString('base64'),
    }),
  });
  if (res.status === 409) return { ok: false, reason: 'conflict' };
  if (!res.ok) return { ok: false, reason: 'failed', detail: `${res.status} ${await res.text()}` };
  const data = await res.json() as { content: { sha: string }; commit: { sha: string } };
  return { ok: true, sha: data.content.sha, commit: data.commit.sha };
}
