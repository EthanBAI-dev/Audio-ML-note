'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import SignInGuide from './SignInGuide';

/** 目前只有一门课，导航直接指向它；以后课程多了再换回「课程」目录页。 */
const COURSE_PATHS = ['/courses', '/lesson', '/guide', '/roadmap'];

const LINKS = [
  { href: '/', label: '首页', match: (p: string) => p === '/' },
  { href: '/courses/audio-ml', label: '音频课程', match: (p: string) => COURSE_PATHS.some((c) => p === c || p.startsWith(`${c}/`)) },
  { href: '/labs', label: '声音实验', match: (p: string) => p === '/labs' || p.startsWith('/labs/') },
];

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  // null = 还没查到登录状态，这时不显示引导小人，免得已登录的人看到它闪一下
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    fetch('/api/auth/session').then((r) => r.ok ? r.json() : null)
      .then((s) => setSignedIn(Boolean(s?.user))).catch(() => setSignedIn(false));
  }, [path]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <span className="nav-mark" aria-hidden><i /><i /><i /><i /><i /></span>
          <span className="nav-brand-copy"><b>Ethan 音乐实验室</b><small>ACOUSTIC &amp; AUDIO LAB</small></span>
        </Link>

        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="站点导航">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={l.match(path) ? 'page' : undefined}>{l.label}</Link>
          ))}
        </nav>

        <span className="nav-cta-wrap">
          <Link className="nav-cta" href={signedIn ? '/account' : `/signin?returnTo=${encodeURIComponent(path || '/')}`}>
            {signedIn ? '我的账号' : '登录'}
          </Link>
          {signedIn === false ? <SignInGuide path={path} /> : null}
        </span>

        <button type="button" className="nav-burger" aria-expanded={open}
          aria-label="展开导航" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
