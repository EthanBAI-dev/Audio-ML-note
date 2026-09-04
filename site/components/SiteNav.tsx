'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/', label: '全部课程' },
  { href: '/guide', label: '课程总纲' },
  { href: '/project', label: '课程项目' },
];

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setDark(saved ? saved === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches);
  }, []);
  useEffect(() => { setOpen(false); }, [path]);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* 隐私模式写不进去 */ }
    setDark(!dark);
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand">
          <span className="nav-mark" aria-hidden>♪</span>
          音频信号处理二十三讲
        </Link>

        <button type="button" className="nav-burger" aria-expanded={open}
          aria-label="展开导航" onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>

        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="站点导航">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              aria-current={l.href === path || (l.href === '/' && path.startsWith('/lesson')) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
          <a href="https://github.com/EthanBAI-dev/Audio-ML-note" rel="noreferrer">仓库</a>
          <button type="button" className="nav-theme" onClick={toggleTheme}
            aria-label={dark ? '切换到浅色' : '切换到深色'}>
            {dark === null ? '' : dark ? '☀ 浅色' : '☾ 深色'}
          </button>
        </nav>
      </div>
    </header>
  );
}
