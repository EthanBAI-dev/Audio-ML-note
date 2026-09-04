'use client';
import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.body.scrollHeight - innerHeight;
      setPct(h > 0 ? Math.min(100, Math.max(0, (scrollY / h) * 100)) : 0);
    };
    on();
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, []);
  return <div className="progress" role="presentation"><span style={{ width: `${pct}%` }} /></div>;
}
