import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { adminUserId, shortName } from '../../../../lib/admin';
import { editablePath, githubConfigured, historyUrl, readArticle } from '../../../../lib/github';
import { AdminGate, NeedsToken } from '../../../../components/AdminGate';
import ArticleEditor from '../../../../components/ArticleEditor';

export const metadata: Metadata = { title: '编辑文章', robots: { index: false, follow: false } };

/** 正式课程目录里的单讲文章对应站上的 /lesson/NN，其余文件没有单独页面。 */
function livePath(path: string): string | null {
  const id = /^音频信号处理二十三讲\/第\d\d-\d\d课\/(\d\d)-[^/]+\.md$/.exec(path)?.[1];
  if (id) return `/lesson/${id}`;
  if (path === '音频信号处理二十三讲/课程总纲/README.md') return '/guide';
  if (path === '音频信号处理二十三讲/课程项目/README.md') return '/project';
  return null;
}

export default async function EditPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  await connection();
  const path = String((await searchParams).path ?? '');
  if (!await adminUserId()) return <AdminGate returnTo={`/admin/edit?path=${encodeURIComponent(path)}`} />;
  if (!githubConfigured) return <NeedsToken />;

  const file = editablePath(path) ? await readArticle(path).catch((e) => {
    console.error('[admin] 读取文章失败', e);
    return null;
  }) : null;
  if (!file) {
    return <div className="shell home admin-shell"><main>
      <p className="admin-error">找不到这篇文章，或者它不在可编辑范围内。</p>
      <Link className="btn ghost" href="/admin">回文章列表</Link>
    </main></div>;
  }

  return <ArticleEditor
    path={file.path} name={shortName(file.path)} initial={file.content} sha={file.sha}
    livePath={livePath(file.path)} historyUrl={historyUrl(file.path)} />;
}
