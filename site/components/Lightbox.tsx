'use client';
import { useEffect, useState } from 'react';

/** 正文配图点开看大图。配图本身在 SVG 里画了很多细节，缩在正文栏里读不清。 */
export default function Lightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState('');

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const img = (e.target as HTMLElement)?.closest?.('.prose picture img') as HTMLImageElement | null;
      if (!img) return;
      e.preventDefault();
      setSrc(img.currentSrc || img.src);
      setAlt(img.alt || '');
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSrc(null); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = src ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [src]);

  if (!src) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt || '放大的配图'}
      onClick={() => setSrc(null)}>
      <button type="button" className="lightbox-close" aria-label="关闭">✕</button>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
