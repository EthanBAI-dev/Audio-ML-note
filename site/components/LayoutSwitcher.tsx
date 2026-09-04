'use client';
import { useEffect, useState } from 'react';

const OPTIONS = [
  { id: 'a', name: 'A 右侧目录', desc: '正文 1040 与配图同宽，目录粘在右边' },
  { id: 'b', name: 'B 左侧目录', desc: '目录在左，正文和配图占满右边' },
  { id: 'c', name: 'C 顶部目录条', desc: '目录横在顶部随滚动高亮，正文最宽' },
  { id: 'd', name: 'D 开头列目录', desc: '两侧都不站人，目录做成文章开头的一块' },
] as const;

export default function LayoutSwitcher() {
  const [cur, setCur] = useState('b');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('layout') ?? 'b';
    setCur(saved);
    document.documentElement.setAttribute('data-layout', saved);
  }, []);

  const pick = (id: string) => {
    setCur(id);
    document.documentElement.setAttribute('data-layout', id);
    try { localStorage.setItem('layout', id); } catch { /* 忽略 */ }
  };

  return (
    <div className={`switcher${open ? ' open' : ''}`}>
      <button type="button" className="switcher-toggle" onClick={() => setOpen(!open)}>
        版式 {cur.toUpperCase()} {open ? '▾' : '▴'}
      </button>
      {open ? (
        <div className="switcher-panel">
          <p>四版布局，点着比。选定后告诉我留哪个。</p>
          {OPTIONS.map((o) => (
            <button key={o.id} type="button" onClick={() => pick(o.id)}
              aria-pressed={cur === o.id}>
              <b>{o.name}</b><span>{o.desc}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
