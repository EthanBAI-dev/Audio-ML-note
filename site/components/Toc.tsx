'use client';
import { useEffect, useState } from 'react';
import type { TocItem } from '../lib/toc';

/** 本页小节目录。摆在哪、横着还是竖着，全由布局的 CSS 决定。 */
export default function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');

  useEffect(() => {
    const heads = items.map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => Boolean(e));
    if (!heads.length) return;
    const pick = () => {
      let cur = heads[0];
      for (const h of heads) if (h.getBoundingClientRect().top <= 140) cur = h;
      if (scrollY + innerHeight >= document.body.scrollHeight - 4) cur = heads[heads.length - 1];
      setActive(cur.id);
    };
    pick();
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pick); };
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [items]);

  if (items.length < 2) return null;
  return (
    <nav className="toc" aria-label="本页小节目录">
      <p className="toc-label">本页小节</p>
      <ol>
        {items.map((i, n) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={i.id === active ? 'true' : undefined}>
              <span className="toc-n">{String(n + 1).padStart(2, '0')}</span>
              <span className="toc-t">{i.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
