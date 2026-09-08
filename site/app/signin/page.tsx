import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signIn, wechatAuthConfigured } from '../../auth';

export const metadata: Metadata = {
  title: '登录或注册',
  description: '登录 Ethan 音乐实验室，在不同设备继续课程并管理购买记录。',
};

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const requested = typeof query.returnTo === 'string' ? query.returnTo : '/account';
  const returnTo = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/account';
  const session = wechatAuthConfigured ? await auth() : null;
  if (session?.user) {
    return (
      <div className="shell home account-shell"><main><section className="auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>你已经登录</h1>
        <p>{session.user.name ? `你好，${session.user.name}。` : '你的学习账户已经连接。'}</p>
        <Link className="btn" href="/account">进入学习中心</Link>
      </section></main></div>
    );
  }

  return (
    <div className="shell home account-shell"><main>
      <section className="auth-card">
        <p className="eyebrow">ONE ACCOUNT · ALL COURSES</p>
        <h1>登录，同时也是注册</h1>
        <p>第一次用微信登录时会自动建立账户，以后购买的课程、学习进度和实验记录都会绑定到这里。</p>
        {wechatAuthConfigured ? (
          <form action={async () => {
            'use server';
            await signIn('wechat', { redirectTo: returnTo });
          }}>
            <button className="auth-provider wechat" type="submit"><b>微信</b><span>扫码登录 / 注册</span></button>
          </form>
        ) : (
          <div className="auth-status" role="status">
            <b>账户登录正在准备</b>
            <span>目前无需登录即可阅读免费课程和使用公开实验。</span>
            <Link className="btn" href="/lesson/01">先学习免费章节</Link>
          </div>
        )}
        <p className="auth-note">登录代表你同意<Link href="/legal/terms">服务条款</Link>和<Link href="/legal/privacy">隐私说明</Link>。本站不会获取你的微信密码。</p>
      </section>
      <aside className="auth-benefits">
        <p className="eyebrow">为什么需要账户</p>
        <h2>免费内容不强迫登录，账户只在真正有用时出现</h2>
        <ul><li>跨设备恢复已购课程</li><li>同步学习进度与实验记录</li><li>统一管理官网、公众号和店铺订单</li><li>以后新增课程不需要重复注册</li></ul>
      </aside>
    </main></div>
  );
}
