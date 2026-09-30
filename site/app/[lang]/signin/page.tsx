import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn, emailAuthConfigured, wechatAuthConfigured } from '../../../auth';
import { getT, pageMetadata } from '../../../lib/locale';
import { rich } from '../../../lib/rich';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/signin', { title: t.signin.title, description: t.signin.metaDescription });
}

function safeReturnTo(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t: dict, to } = await getT();
  const t = dict.signin;
  const query = await searchParams;
  const returnTo = safeReturnTo(query.returnTo, to('/account'));
  const error = typeof query.error === 'string' ? (t.errors[query.error] ?? t.errorDefault) : null;
  const session = emailAuthConfigured || wechatAuthConfigured ? await auth() : null;
  if (session?.user) {
    return (
      <div className="shell home account-shell"><main><section className="auth-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>{t.signedInTitle}</h1>
        <p>{session.user.email ? t.currentAccount(session.user.email) : t.connected}</p>
        <Link className="btn" href={to('/account')}>{t.goAccount}</Link>
      </section></main></div>
    );
  }

  const signinPath = to('/signin');
  const checkEmailPath = to('/signin/check-email');

  return (
    <div className="shell home account-shell"><main>
      <section className="auth-card">
        <p className="eyebrow">ONE ACCOUNT · WHOLE LAB</p>
        <h1>{t.heading}</h1>
        <p>{t.body}</p>
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        {emailAuthConfigured ? (
          <form className="auth-email" action={async (formData: FormData) => {
            'use server';
            // 不让 Auth.js 自己跳转：它只认中文的「查收邮件」页，这里换成当前语言的那一页
            const next = new URL(await signIn('resend', {
              email: String(formData.get('email') ?? '').trim(), redirectTo: returnTo, redirect: false,
            }), 'http://localhost');
            const failed = next.searchParams.get('error');
            if (failed) redirect(`${signinPath}?${new URLSearchParams({ error: failed, returnTo })}`);
            redirect(checkEmailPath);
          }}>
            <label htmlFor="signin-email">{t.email}</label>
            <input id="signin-email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            <button className="btn" type="submit">{t.send}</button>
          </form>
        ) : null}
        {wechatAuthConfigured ? (
          <form action={async () => {
            'use server';
            await signIn('wechat', { redirectTo: returnTo });
          }}>
            <button className="auth-provider wechat" type="submit"><b>{t.wechat}</b><span>{t.wechatSub}</span></button>
          </form>
        ) : null}
        {!emailAuthConfigured && !wechatAuthConfigured ? (
          <div className="auth-status" role="status">
            <b>{t.preparingTitle}</b>
            <span>{t.preparingBody}</span>
            <Link className="btn" href={to('/lesson/01')}>{t.startLearning}</Link>
          </div>
        ) : null}
        <p className="auth-note">{rich(t.agree, {
          terms: <Link href={to('/legal/terms')}>{dict.legal.terms.title}</Link>,
          privacy: <Link href={to('/legal/privacy')}>{dict.legal.privacy.title}</Link>,
        })}</p>
      </section>
      <aside className="auth-benefits">
        <p className="eyebrow">{t.whyEyebrow}</p>
        <h2>{t.whyTitle}</h2>
        <ul>{t.whyItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </aside>
    </main></div>
  );
}
