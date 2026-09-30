import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signIn, emailAuthConfigured, wechatAuthConfigured } from '../../auth';

export const metadata: Metadata = {
  title: '登录或注册',
  description: '登录 Ethan 音乐实验室，参与评论和讨论。',
};

const ERRORS: Record<string, string> = {
  Verification: '这个登录链接已经失效或用过了，请重新获取一封。',
  EmailSignin: '邮件没有发出去，请稍后再试。',
};

function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/account';
}

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const returnTo = safeReturnTo(query.returnTo);
  const error = typeof query.error === 'string' ? (ERRORS[query.error] ?? '登录没有成功，请重试。') : null;
  const session = emailAuthConfigured || wechatAuthConfigured ? await auth() : null;
  if (session?.user) {
    return (
      <div className="shell home account-shell"><main><section className="auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>你已经登录</h1>
        <p>{session.user.email ? `当前账号：${session.user.email}` : '你的账号已经连接。'}</p>
        <Link className="btn" href="/account">进入我的账号</Link>
      </section></main></div>
    );
  }

  return (
    <div className="shell home account-shell"><main>
      <section className="auth-card">
        <p className="eyebrow">ONE ACCOUNT · WHOLE LAB</p>
        <h1>登录，同时也是注册</h1>
        <p>输入邮箱，我们会发一封带登录链接的邮件。第一次登录会自动建立账号，不需要设置密码。</p>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        {emailAuthConfigured ? (
          <form className="auth-email" action={async (formData: FormData) => {
            'use server';
            await signIn('resend', { email: String(formData.get('email') ?? '').trim(), redirectTo: returnTo });
          }}>
            <label htmlFor="signin-email">邮箱</label>
            <input id="signin-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            <button className="btn" type="submit">发送登录链接</button>
          </form>
        ) : null}
        {wechatAuthConfigured ? (
          <form action={async () => {
            'use server';
            await signIn('wechat', { redirectTo: returnTo });
          }}>
            <button className="auth-provider wechat" type="submit"><b>微信</b><span>扫码登录 / 注册</span></button>
          </form>
        ) : null}
        {!emailAuthConfigured && !wechatAuthConfigured ? (
          <div className="auth-status" role="status">
            <b>账号登录正在准备</b>
            <span>不登录也可以阅读全部课程、使用所有实验。</span>
            <Link className="btn" href="/lesson/01">开始学习</Link>
          </div>
        ) : null}
        <p className="auth-note">登录代表你同意<Link href="/legal/terms">服务条款</Link>和<Link href="/legal/privacy">隐私说明</Link>。</p>
      </section>
      <aside className="auth-benefits">
        <p className="eyebrow">为什么需要账号</p>
        <h2>阅读不需要登录，账号只用来参与讨论</h2>
        <ul><li>在每篇文章下面发评论、回复别人</li><li>给自己起一个显示名称</li><li>实验室以后新增的内容，用同一个账号就行</li></ul>
      </aside>
    </main></div>
  );
}
