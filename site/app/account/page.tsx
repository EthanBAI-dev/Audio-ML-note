import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signOut, wechatAuthConfigured } from '../../auth';

export const metadata: Metadata = { title: '学习中心' };

export default async function AccountPage() {
  const session = wechatAuthConfigured ? await auth() : null;
  if (!session?.user) {
    return <div className="shell home account-shell"><main><section className="auth-card">
      <p className="eyebrow">LEARNING CENTER</p><h1>你的学习中心</h1>
      <p>登录后，这里会显示已购课程、学习进度、订单和账号绑定。</p>
      <Link className="btn" href="/signin">登录或注册</Link>
    </section></main></div>;
  }

  return <div className="shell home account-shell"><main><section className="auth-card">
    <p className="eyebrow">LEARNING CENTER</p><h1>{session.user.name ?? '我的学习中心'}</h1>
    <p>这里集中管理你的课程访问权、学习进度与订单记录。</p>
    <p className="hero-cta"><Link className="btn" href="/courses/audio-ml">继续学习</Link></p>
    <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
      <button className="text-button" type="submit">退出登录</button>
    </form>
  </section></main></div>;
}
