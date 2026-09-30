import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { connection } from 'next/server';
import { currentUserId, signOut } from '../../auth';
import { db } from '../../lib/db';
import { users } from '../../lib/db/schema';
import { isAdmin } from '../../lib/comments';
import { topPages } from '../../lib/views';
import { lessonById } from '../../lib/lessons';

export const metadata: Metadata = { title: '我的账号' };

const NAME_MAX = 24;

async function saveName(formData: FormData) {
  'use server';
  const userId = await currentUserId();
  if (!userId || !db) return;
  const name = String(formData.get('name') ?? '').trim().slice(0, NAME_MAX);
  await db.update(users).set({ name: name || null }).where(eq(users.id, userId));
  revalidatePath('/account');
}

const PAGE_NAMES: Record<string, string> = {
  '/': '首页', '/courses': '课程目录', '/courses/audio-ml': '音频信号处理二十三讲 · 课程页', '/labs': '互动实验室',
  '/roadmap': '学习路线', '/guide': '课程总纲', '/project': '项目说明', '/account': '我的账号', '/signin': '登录页',
};

function pageLabel(path: string): string {
  const lesson = /^\/lesson\/(\d{2})$/.exec(path);
  if (lesson) return `第 ${lesson[1]} 讲 · ${lessonById(lesson[1])?.title ?? ''}`;
  return PAGE_NAMES[path] ?? path;
}

async function Stats() {
  const rows = await topPages(60);
  const total = rows.reduce((sum, r) => sum + r.views, 0);
  return (
    <section className="auth-card account-stats">
      <p className="eyebrow">ADMIN · PAGE VIEWS</p>
      <h2>页面浏览次数</h2>
      <p>同一个访客 30 分钟内重复打开同一页只记一次。合计 {total.toLocaleString('zh-CN')} 次。</p>
      {rows.length ? (
        <table>
          <thead><tr><th>页面</th><th>次数</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.path}><td><Link href={r.path}>{pageLabel(r.path)}</Link></td><td>{r.views.toLocaleString('zh-CN')}</td></tr>
          ))}</tbody>
        </table>
      ) : <p>还没有数据。</p>}
    </section>
  );
}

export default async function AccountPage() {
  await connection();
  const userId = await currentUserId();
  const [me] = userId && db ? await db.select().from(users).where(eq(users.id, userId)) : [];
  if (!me) {
    return <div className="shell home account-shell"><main><section className="auth-card">
      <p className="eyebrow">MY ACCOUNT</p><h1>我的账号</h1>
      <p>登录后可以在文章下面发评论、回复别人。阅读和做实验都不需要登录。</p>
      <Link className="btn" href="/signin">登录或注册</Link>
    </section></main></div>;
  }
  const admin = await isAdmin(me.id);

  return <div className="shell home account-shell"><main>
    <section className="auth-card">
      <p className="eyebrow">MY ACCOUNT</p><h1>{me.name || '我的账号'}</h1>
      <p>登录邮箱：{me.email ?? '（微信登录）'}</p>
      <form className="auth-email" action={saveName}>
        <label htmlFor="account-name">显示名称（评论时别人看到的名字）</label>
        <input id="account-name" name="name" defaultValue={me.name ?? ''} maxLength={NAME_MAX} placeholder="不填就显示邮箱前两位" />
        <button className="btn" type="submit">保存</button>
      </form>
      <p className="hero-cta"><Link className="btn ghost" href="/courses">回到实验室内容</Link></p>
      <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
        <button className="text-button" type="submit">退出登录</button>
      </form>
    </section>
    {admin ? <Stats /> : (
      <aside className="auth-benefits">
        <p className="eyebrow">账号能做什么</p>
        <h2>在每篇文章下面参与讨论</h2>
        <ul><li>发评论、回复别人的评论</li><li>删除自己发过的评论</li><li>以后实验室新增的内容，用同一个账号</li></ul>
      </aside>
    )}
  </main></div>;
}
