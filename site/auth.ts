import NextAuth from 'next-auth';
import WeChat from 'next-auth/providers/wechat';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './lib/db';
import { accounts, sessions, users, verificationTokens } from './lib/db/schema';

export const wechatAuthConfigured = Boolean(
  process.env.AUTH_SECRET
  && process.env.AUTH_WECHAT_ID
  && process.env.AUTH_WECHAT_SECRET
  && process.env.DATABASE_URL
  && db,
);

const providers = wechatAuthConfigured
  ? [WeChat({
      clientId: process.env.AUTH_WECHAT_ID!,
      clientSecret: process.env.AUTH_WECHAT_SECRET!,
      platformType: 'WebsiteApp',
    })]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  adapter: wechatAuthConfigured && db
    ? DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens })
    : undefined,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/signin' },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
});
