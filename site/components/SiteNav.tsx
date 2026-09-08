'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/', label: '首页' },
  { href: '/courses', label: '课程目录' },
  { href: '/roadmap', label: '学习路线' },
  { href: '/labs', label: '互动实验室' },
];

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <span className="nav-mark" aria-hidden><i /><i /><i /><i /><i /></span>
          <span className="nav-brand-copy"><b>Ethan 音乐实验室</b><small>ACOUSTIC &amp; AUDIO LAB</small></span>
        </Link>

        <button type="button" className="nav-burger" aria-expanded={open}
          aria-label="展开导航" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>

        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="站点导航">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              aria-current={l.href === path
                || (l.href !== '/' && path.startsWith(`${l.href}/`))
                || (l.href === '/courses' && path.startsWith('/lesson')) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <Link className="nav-signin" href="/signin">登录</Link>
          <Link className="nav-start" href="/lesson/01">开始学习</Link>
        </nav>
      </div>
    </header>
  );
}
