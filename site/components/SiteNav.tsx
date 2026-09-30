'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import SignInGuide from './SignInGuide';
import { HTML_LANG, LOCALES, LOCALE_LABEL, localePath, splitLocale, type Locale } from '../lib/i18n';
import type { Dictionary } from '../lib/dictionaries';

/** 目前只有一门课，导航直接指向它；以后课程多了再换回「课程」目录页。 */
const COURSE_PATHS = ['/courses', '/lesson', '/guide', '/roadmap'];

const LINKS = [
  { href: '/', key: 'home', match: (p: string) => p === '/' },
  { href: '/courses/audio-ml', key: 'course', match: (p: string) => COURSE_PATHS.some((c) => p === c || p.startsWith(`${c}/`)) },
  { href: '/labs', key: 'labs', match: (p: string) => p === '/labs' || p.startsWith('/labs/') },
] as const;

/** 切换器上的短名字；完整名字放在 title 和读屏文字里。 */
const SHORT: Record<Locale, string> = { zh: '中', ja: '日', en: 'EN' };

export default function SiteNav({ t, guide, siteName }: {
  t: Dictionary['nav']; guide: Dictionary['signinGuide']; siteName: string;
}) {
  const fullPath = usePathname();
  const { lang, path } = splitLocale(fullPath);
  const to = (p: string) => localePath(lang, p);
  const [open, setOpen] = useState(false);
  // null = 还没查到登录状态，这时不显示引导小人，免得已登录的人看到它闪一下
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [hash, setHash] = useState('');
  useEffect(() => { setOpen(false); setHash(location.search + location.hash); }, [fullPath]);
  useEffect(() => {
    fetch('/api/auth/session').then((r) => r.ok ? r.json() : null)
      .then((s) => setSignedIn(Boolean(s?.user))).catch(() => setSignedIn(false));
  }, [fullPath]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href={to('/')} className="nav-brand">
          <span className="nav-mark" aria-hidden><i /><i /><i /><i /><i /></span>
          <span className="nav-brand-copy"><b>{siteName}</b><small>ACOUSTIC &amp; AUDIO LAB</small></span>
        </Link>

        <nav className={`nav-links${open ? ' open' : ''}`} aria-label={t.aria}>
          {LINKS.map((l) => (
            <Link key={l.href} href={to(l.href)} aria-current={l.match(path) ? 'page' : undefined}>{t[l.key]}</Link>
          ))}
        </nav>

        <nav className="nav-lang" aria-label={t.language}>
          {LOCALES.map((l) => (
            <a key={l} href={localePath(l, path) + hash} hrefLang={HTML_LANG[l]} lang={HTML_LANG[l]}
              title={LOCALE_LABEL[l]} aria-label={LOCALE_LABEL[l]} aria-current={l === lang ? 'true' : undefined}>
              {SHORT[l]}
            </a>
          ))}
        </nav>

        <span className="nav-cta-wrap">
          <Link className="nav-cta" href={signedIn ? to('/account') : `${to('/signin')}?returnTo=${encodeURIComponent(fullPath || '/')}`}>
            {signedIn ? t.account : t.signin}
          </Link>
          {signedIn === false ? <SignInGuide path={path} t={guide} /> : null}
        </span>

        <button type="button" className="nav-burger" aria-expanded={open}
          aria-label={t.menu} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
