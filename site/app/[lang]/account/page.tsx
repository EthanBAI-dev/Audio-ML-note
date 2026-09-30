import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { connection } from 'next/server';
import { currentUserId, signOut } from '../../../auth';
import { db } from '../../../lib/db';
import { users } from '../../../lib/db/schema';
import { isAdmin } from '../../../lib/comments';
import { topPages } from '../../../lib/views';
import { lessonById } from '../../../lib/lessons';
import { getT } from '../../../lib/locale';
import { LOCALE_LABEL, NUMBER_LOCALE, splitLocale, type Locale } from '../../../lib/i18n';
import type { Dictionary } from '../../../lib/dictionaries';
import { lessonText } from '../../../lib/dictionaries/lessons';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.account.title };
}

const NAME_MAX = 24;

async function saveName(formData: FormData) {
  'use server';
  const userId = await currentUserId();
  if (!userId || !db) return;
  const name = String(formData.get('name') ?? '').trim().slice(0, NAME_MAX);
  await db.update(users).set({ name: name || null }).where(eq(users.id, userId));
  revalidatePath('/[lang]/account', 'page');
}

/** 统计表里的地址带着语言前缀；显示时换成页面名，非中文的在后面标上语言。 */
function pageLabel(fullPath: string, t: Dictionary, viewer: Locale): string {
  const { lang, path } = splitLocale(fullPath);
  const id = /^\/lesson\/(\d{2})$/.exec(path)?.[1];
  const lesson = id ? lessonById(id) : undefined;
  const name = id
    ? `${t.lesson.n(id)} · ${lesson ? lessonText(viewer, lesson).title : ''}`
    : t.account.pageNames[path] ?? path;
  return lang === 'zh' ? name : `${name} · ${LOCALE_LABEL[lang]}`;
}

async function Stats({ t, lang }: { t: Dictionary; lang: Locale }) {
  const rows = await topPages(60);
  const total = rows.reduce((sum, r) => sum + r.views, 0);
  const n = (v: number) => v.toLocaleString(NUMBER_LOCALE[lang]);
  return (
    <section className="auth-card account-stats">
      <p className="eyebrow">ADMIN · PAGE VIEWS</p>
      <h2>{t.account.statsTitle}</h2>
      <p>{t.account.statsBody(n(total))}</p>
      {rows.length ? (
        <table>
          <thead><tr><th>{t.account.colPage}</th><th>{t.account.colViews}</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.path}><td><Link href={r.path}>{pageLabel(r.path, t, lang)}</Link></td><td>{n(r.views)}</td></tr>
          ))}</tbody>
        </table>
      ) : <p>{t.account.noData}</p>}
    </section>
  );
}

export default async function AccountPage() {
  await connection();
  const { lang, t: dict, to } = await getT();
  const t = dict.account;
  const userId = await currentUserId();
  const [me] = userId && db ? await db.select().from(users).where(eq(users.id, userId)) : [];
  if (!me) {
    return <div className="shell home account-shell"><main><section className="auth-card">
      <p className="eyebrow">MY ACCOUNT</p><h1>{t.title}</h1>
      <p>{t.signedOutBody}</p>
      <Link className="btn" href={to('/signin')}>{t.signinOrRegister}</Link>
    </section></main></div>;
  }
  const admin = await isAdmin(me.id);
  const home = to('/');

  return <div className="shell home account-shell"><main>
    <section className="auth-card">
      <p className="eyebrow">MY ACCOUNT</p><h1>{me.name || t.title}</h1>
      <p>{t.email(me.email ?? t.wechatLogin)}</p>
      <form className="auth-email" action={saveName}>
        <label htmlFor="account-name">{t.nameLabel}</label>
        <input id="account-name" name="name" defaultValue={me.name ?? ''} maxLength={NAME_MAX} placeholder={t.namePlaceholder} />
        <button className="btn" type="submit">{t.save}</button>
      </form>
      <p className="hero-cta"><Link className="btn ghost" href={to('/courses')}>{dict.notFound.back}</Link></p>
      <form action={async () => { 'use server'; await signOut({ redirectTo: home }); }}>
        <button className="text-button" type="submit">{t.signOut}</button>
      </form>
    </section>
    {admin ? <Stats t={dict} lang={lang} /> : (
      <aside className="auth-benefits">
        <p className="eyebrow">{t.canEyebrow}</p>
        <h2>{t.canTitle}</h2>
        <ul>{t.canItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </aside>
    )}
  </main></div>;
}
