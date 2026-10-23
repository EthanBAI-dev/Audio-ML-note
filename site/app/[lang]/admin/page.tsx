import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { adminUserId, shortName } from '../../../lib/admin';
import { githubBranch, githubConfigured, githubRepo, listArticles } from '../../../lib/github';
import { AdminGate, NeedsToken } from '../../../components/AdminGate';

export const metadata: Metadata = { title: '文章后台', robots: { index: false, follow: false } };

/** 按所在目录分组：第01-05课、课程总纲……目录本身的 README 排在最前。 */
function byFolder(paths: string[]) {
  const map = new Map<string, string[]>();
  for (const p of paths) {
    const name = shortName(p);
    const folder = name.includes('/') ? name.slice(0, name.lastIndexOf('/')) : '课程首页';
    const root = p.startsWith('音频信号处理二十三讲-v2/') ? 'v2 · ' : '';
    const key = root + folder;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()];
}

export default async function AdminPage() {
  await connection();
  if (!await adminUserId()) return <AdminGate returnTo="/admin" />;
  if (!githubConfigured) return <NeedsToken />;

  let paths: string[] = [];
  let error = '';
  try {
    paths = await listArticles();
  } catch (e) {
    console.error('[admin] 读取文章列表失败', e);
    error = '读不到 GitHub 上的文章列表，请检查 GITHUB_TOKEN 是否有这个仓库的读取权限。';
  }

  return <div className="shell home admin-shell"><main>
    <header className="admin-head">
      <p className="eyebrow">ADMIN · ARTICLES</p>
      <h1>文章后台</h1>
      <p>点开一篇就能改。保存会直接提交到 <code>{githubRepo}</code> 的 <code>{githubBranch}</code> 分支，网站随后自动重新部署，一般一两分钟后线上就是新版本。每次保存都留在 git 历史里，改错了可以回退。</p>
    </header>
    {error ? <p className="admin-error">{error}</p> : null}
    {byFolder(paths).map(([folder, files]) => (
      <section key={folder} className="admin-folder">
        <h2>{folder}</h2>
        <ul>{files.map((p) => {
          const file = p.slice(p.lastIndexOf('/') + 1).replace(/\.md$/, '');
          return <li key={p}><Link href={`/admin/edit?path=${encodeURIComponent(p)}`}>{file === 'README' ? '目录说明（README）' : file}</Link></li>;
        })}</ul>
      </section>
    ))}
  </main></div>;
}
