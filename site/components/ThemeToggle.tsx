'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
      setDark(saved === 'dark');
    } else {
      setDark(matchMedia('(prefers-color-scheme:dark)').matches);
    }
  }, []);

  if (dark === null) return <button type="button" className="ghost" aria-hidden />;
  return (
    <button type="button" className="ghost" onClick={() => {
      const next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch { /* 隐私模式下写不进去，忽略 */ }
      setDark(!dark);
    }}>
      {dark ? '切换到浅色' : '切换到深色'}
    </button>
  );
}
