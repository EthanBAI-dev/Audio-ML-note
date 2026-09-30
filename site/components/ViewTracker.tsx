'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const WINDOW_MS = 30 * 60 * 1000;

/** 每个页面每 30 分钟最多记一次，刷新不会反复加数。 */
export default function ViewTracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || navigator.webdriver) return;
    const key = `eml-view:${path}`;
    try {
      const last = Number(sessionStorage.getItem(key) ?? 0);
      if (Date.now() - last < WINDOW_MS) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch { /* 隐私模式下读写失败就照常计数 */ }
    fetch('/api/views', {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, [path]);
  return null;
}
