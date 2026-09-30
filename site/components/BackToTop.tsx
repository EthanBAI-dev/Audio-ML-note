'use client';
import { useEffect, useState } from 'react';

export default function BackToTop({ label }: { label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(scrollY > 800);
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  return (
    <button type="button" className={`totop${show ? ' show' : ''}`} aria-label={label}
      onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
  );
}
