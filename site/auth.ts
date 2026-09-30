import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import WeChat from 'next-auth/providers/wechat';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './lib/db';
import { accounts, sessions, users, verificationTokens } from './lib/db/schema';
import { DEFAULT_LOCALE, HTML_LANG, splitLocale } from './lib/i18n';
import { dictionary } from './lib/dictionaries';

const hasSecret = Boolean(process.env.AUTH_SECRET && db);

export const wechatAuthConfigured = hasSecret
  && Boolean(process.env.AUTH_WECHAT_ID && process.env.AUTH_WECHAT_SECRET);

/** 本地开发没有 Resend 密钥时，登录链接打印在终端里，照样能走完整流程。 */
const devMailLog = process.env.NODE_ENV !== 'production' && !process.env.AUTH_RESEND_KEY;

export const emailAuthConfigured = hasSecret
  && (devMailLog || Boolean(process.env.AUTH_RESEND_KEY && process.env.AUTH_EMAIL_FROM));

/** 任何一种登录方式可用，账号功能就开着。 */
export const authConfigured = wechatAuthConfigured || emailAuthConfigured;

/** 登录链接里带着 callbackUrl，也就是读者登录完要回去的页面；从它的语言前缀判断邮件用哪种语言写。 */
function mailLocale(url: string) {
  try {
    return splitLocale(new URL(new URL(url).searchParams.get('callbackUrl') ?? '/', 'http://localhost').pathname).lang;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function signInMail(url: string) {
  const lang = mailLocale(url);
  const t = dictionary(lang).mail;
  const html = `<div lang="${HTML_LANG[lang]}" style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1d20">
<p style="font-size:18px;font-weight:600">${t.heading}</p>
<p>${t.body}</p>
<p style="margin:28px 0"><a href="${url}" style="background:#1a1d20;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none">${t.button}</a></p>
<p style="color:#59616a;font-size:13px">${t.note}</p>
</div>`;
  return { subject: t.subject, text: t.text(url), html };
}

const providers: Provider[] = [];
if (emailAuthConfigured) {
  providers.push(Resend({
    apiKey: process.env.AUTH_RESEND_KEY,
    from: process.env.AUTH_EMAIL_FROM,
    async sendVerificationRequest({ identifier: to, provider, url }) {
      if (devMailLog) {
        console.log(`\n[登录邮件] 收件人 ${to}\n${url}\n`);
        return;
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: provider.from, to, ...signInMail(url) }),
      });
      if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
    },
  }));
}
if (wechatAuthConfigured) {
  providers.push(WeChat({
    clientId: process.env.AUTH_WECHAT_ID!,
    clientSecret: process.env.AUTH_WECHAT_SECRET!,
    platformType: 'WebsiteApp',
  }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  adapter: authConfigured && db
    ? DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens })
    : undefined,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/signin', verifyRequest: '/signin/check-email', error: '/signin' },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
});

/** 当前登录用户的 id；未登录或账号功能未开启时为 null。 */
export async function currentUserId(): Promise<string | null> {
  if (!authConfigured) return null;
  const session = await auth();
  const id = session?.user ? (session.user as typeof session.user & { id?: string }).id : undefined;
  return id ?? null;
}
