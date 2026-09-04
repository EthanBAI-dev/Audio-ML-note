'use client';

import { useEffect, useRef, useState } from 'react';

type Ash = {
  x: number; y: number; radius: number; vx: number; vy: number;
  phase: number; wobble: number; alpha: number; life: number;
};

const STORAGE_KEY = 'audio-course-ash-clicks';

export default function AshParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try { setClicks(Number(localStorage.getItem(STORAGE_KEY) || 0)); } catch { /* 不支持存储时只保留本次 */ }

    let width = innerWidth;
    let height = innerHeight;
    let dpr = Math.min(devicePixelRatio || 1, 2);
    let frame = 0;
    let particles: Ash[] = [];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const gutters = () => {
      const shell = document.querySelector('.shell')?.getBoundingClientRect();
      return shell ? { left: Math.max(0, shell.left - 16), right: Math.min(width, shell.right + 16) }
        : { left: Math.max(0, width / 2 - 520), right: Math.min(width, width / 2 + 520) };
    };

    const randomX = (left: number, right: number) => {
      const leftWidth = left;
      const rightWidth = width - right;
      const total = leftWidth + rightWidth;
      if (total < 20) return -100;
      return Math.random() * total < leftWidth ? Math.random() * leftWidth : right + Math.random() * rightWidth;
    };

    const makeAsh = (x?: number, y?: number, burst = false): Ash => {
      const { left, right } = gutters();
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? 0.8 + Math.random() * 1.8 : 0;
      return {
        x: x ?? randomX(left, right), y: y ?? Math.random() * height,
        radius: burst ? 0.9 + Math.random() * 1.8 : 0.65 + Math.random() * 1.25,
        vx: burst ? Math.cos(angle) * speed : -0.12 + Math.random() * 0.24,
        vy: burst ? Math.sin(angle) * speed - 0.8 : -(0.42 + Math.random() * 0.55),
        phase: Math.random() * Math.PI * 2, wobble: 0.25 + Math.random() * 0.65,
        alpha: 0.2 + Math.random() * 0.35, life: burst ? 1 : -1,
      };
    };

    const refill = () => {
      const { left, right } = gutters();
      const gutterWidth = Math.max(0, left) + Math.max(0, width - right);
      const target = Math.min(76, Math.round(gutterWidth * height / 9000));
      while (particles.filter((p) => p.life < 0).length < target) particles.push(makeAsh());
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const { left, right } = gutters();
      refill();
      particles = particles.filter((p) => {
        p.phase += 0.018 + p.wobble * 0.012;
        p.x += p.vx + Math.sin(p.phase) * p.wobble;
        p.y += reduced ? 0 : p.vy;
        if (p.life > 0) p.life -= 0.018;
        if (p.life === -1 && p.y < -8) { p.y = height + 8; p.x = randomX(left, right); }
        if (p.life === -1 && p.x > left && p.x < right) p.x = randomX(left, right);
        if (p.life !== -1 && p.life <= 0) return false;
        if (p.x > left && p.x < right) return p.life === -1;
        const fade = p.life > 0 ? p.life : 1;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.phase) * 0.7);
        ctx.fillStyle = `rgba(128,136,145,${p.alpha * fade})`;
        ctx.beginPath(); ctx.ellipse(0, 0, p.radius * 0.72, p.radius * 1.35, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        return true;
      });
      frame = requestAnimationFrame(draw);
    };

    const onPointer = (event: PointerEvent) => {
      const { left, right } = gutters();
      if (event.clientX > left && event.clientX < right) return;
      for (let i = 0; i < 18; i += 1) particles.push(makeAsh(event.clientX, event.clientY, true));
      setClicks((value) => {
        const next = value + 1;
        try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* 本次仍计数 */ }
        return next;
      });
    };

    resize(); refill(); draw();
    addEventListener('resize', resize);
    addEventListener('pointerdown', onPointer);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('resize', resize);
      removeEventListener('pointerdown', onPointer);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="ash-canvas" aria-hidden />
      {clicks > 0 ? <span className="ash-counter" aria-live="polite">灰烬回响 · {clicks}</span> : null}
    </>
  );
}
