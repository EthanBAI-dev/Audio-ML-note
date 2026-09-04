'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Canvas 2D 不认 `var(--x)`，赋值会被静默忽略。所以随主题变的颜色要在
 *  取用时从 documentElement 上读出真实值；固定的分类色直接写死。 */
function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
export const C = {
  blue: '#0072BD', warm: '#D95319', green: '#2E8B57', gold: '#C9A227',
  get grid() { return cssVar('--grid', '#e6e6e9'); },
  get ink() { return cssVar('--ink', '#1b1b1f'); },
  get mute() { return cssVar('--mute', '#6b6b70'); },
  get line() { return cssVar('--line', '#e0e0e4'); },
};

/** children 传两个节点：第一个是控件区，第二个是画布区。 */
export function Lab({ title, hint, children }: {
  title: string; hint?: string; children: [ReactNode, ReactNode];
}) {
  const [controls, body] = children;
  return (
    <figure className="lab">
      <figcaption>
        <strong>{title}</strong>
        {hint ? <span> {hint}</span> : null}
      </figcaption>
      <div className="lab-controls">{controls}</div>
      <div className="lab-canvas">{body}</div>
    </figure>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <label className="lab-slider">
      <span className="lab-slider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <output>{fmt ? fmt(value) : value}</output>
    </label>
  );
}

export function Choice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly T[]; onChange: (v: T) => void;
}) {
  return (
    <div className="lab-choice">
      <span className="lab-slider-label">{label}</span>
      <div role="group">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={o === value}
            onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

/** 画布封装：按设备像素比缩放，并在依赖变化时重绘。 */
export function Canvas({ w, h, draw, deps, onPointer, ariaLabel }: {
  w: number; h: number; draw: (g: CanvasRenderingContext2D, w: number, h: number) => void;
  deps: unknown[]; onPointer?: (xFrac: number, yFrac: number) => void; ariaLabel: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    draw(g, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const handle = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onPointer) return;
    const r = e.currentTarget.getBoundingClientRect();
    onPointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };
  return (
    <canvas ref={ref} role="img" aria-label={ariaLabel}
      style={{ width: '100%', maxWidth: w, height: 'auto', aspectRatio: `${w} / ${h}`, touchAction: onPointer ? 'none' : undefined, cursor: onPointer ? 'ew-resize' : undefined }}
      onPointerDown={onPointer ? (e) => { e.currentTarget.setPointerCapture(e.pointerId); handle(e); } : undefined}
      onPointerMove={onPointer ? (e) => { if (e.buttons) handle(e); } : undefined} />
  );
}

/** 常用坐标轴：左下留边，画网格与刻度。 */
export function axes(g: CanvasRenderingContext2D, w: number, h: number, opts: {
  xLabel: string; yLabel: string; xTicks: [number, string][]; yTicks: [number, string][];
  pad?: { l: number; r: number; t: number; b: number };
}) {
  const p = opts.pad ?? { l: 52, r: 12, t: 12, b: 34 };
  const iw = w - p.l - p.r, ih = h - p.t - p.b;
  g.strokeStyle = C.grid;
  g.fillStyle = C.mute;
  g.lineWidth = 1; g.font = '12px system-ui, sans-serif';
  g.beginPath();
  for (const [fx] of opts.xTicks) { const x = p.l + fx * iw; g.moveTo(x, p.t); g.lineTo(x, p.t + ih); }
  for (const [fy] of opts.yTicks) { const y = p.t + (1 - fy) * ih; g.moveTo(p.l, y); g.lineTo(p.l + iw, y); }
  g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (const [fx, lab] of opts.xTicks) g.fillText(lab, p.l + fx * iw, p.t + ih + 6);
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const [fy, lab] of opts.yTicks) g.fillText(lab, p.l - 8, p.t + (1 - fy) * ih);
  g.textAlign = 'center'; g.textBaseline = 'bottom';
  g.fillText(opts.xLabel, p.l + iw / 2, h - 2);
  g.save(); g.translate(12, p.t + ih / 2); g.rotate(-Math.PI / 2);
  g.textBaseline = 'top'; g.fillText(opts.yLabel, 0, 0); g.restore();
  return { p, iw, ih };
}

/** 动画画布：自带播放/暂停，尊重系统的「减少动态效果」设置。 */
export function AnimCanvas({ w, h, draw, duration, ariaLabel, caption }: {
  w: number; h: number; duration: number; ariaLabel: string; caption?: string;
  draw: (g: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef<number>(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setPlaying(false); setT(0.35); }
  }, []);

  useEffect(() => {
    if (!playing) return;
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1000;
    const safeT = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
    start.current = performance.now() - safeT * safeDuration;
    const step = (now: number) => {
      const raw = (now - start.current) / safeDuration;
      const next = ((raw % 1) + 1) % 1;
      setT(Number.isFinite(next) ? next : 0);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
    const g = c.getContext('2d'); if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const progress = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
    draw(g, w, h, progress);
  }, [t, w, h, draw]);

  return (
    <div className="anim">
      <canvas ref={ref} role="img" aria-label={ariaLabel}
        style={{ width: '100%', maxWidth: w, height: 'auto', aspectRatio: `${w} / ${h}` }} />
      <div className="anim-bar">
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
          {playing ? '暂停' : '播放'}
        </button>
        <input type="range" min={0} max={1} step={0.002}
          value={Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0} aria-label="进度"
          onChange={(e) => {
            setPlaying(false);
            const next = Number(e.target.value);
            setT(Number.isFinite(next) ? Math.max(0, Math.min(1, next)) : 0);
          }} />
        {caption ? <span className="anim-caption">{caption}</span> : null}
      </div>
    </div>
  );
}
