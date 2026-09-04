'use client';
import { useCallback, useMemo } from 'react';
import { Lab, AnimCanvas, axes, C } from './lab';
import { hann, magnitudeSpectrum } from '../lib/dsp';

const SR = 22050, N = 8192, FRAME = 1024, HOP = 256;

/** 06 / 15：一扇窗在录音上往右挪，右边的声谱图一列一列长出来。 */
export default function SlidingWindowAnim() {
  const sig = useMemo(() => {
    const x = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const f = i / N;
      const hz = f < 0.33 ? 300 : f < 0.66 ? 900 : 1800;   // 三段不同音高
      const env = Math.min(1, Math.sin(Math.PI * ((f * 3) % 1)) * 1.4);
      x[i] = Math.sin((2 * Math.PI * hz * i) / SR) * Math.max(0, env);
    }
    return x;
  }, []);

  const columns = useMemo(() => {
    const w = hann(FRAME), cols: Float32Array[] = [];
    for (let s = 0; s + FRAME <= N; s += HOP) {
      const seg = new Float32Array(FRAME);
      for (let i = 0; i < FRAME; i++) seg[i] = sig[s + i] * w[i];
      cols.push(magnitudeSpectrum(seg));
    }
    return cols;
  }, [sig]);

  const maxHz = 2600;
  const kMax = Math.floor(maxHz / (SR / FRAME));
  const peak = useMemo(() => {
    let p = 0;
    for (const c of columns) for (let k = 0; k <= kMax; k++) p = Math.max(p, c[k]);
    return p;
  }, [columns, kMax]);

  const draw = useCallback((g: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const done = Math.floor(t * columns.length);
    const start = done * HOP;
    const topH = h * 0.42, gap = 18, botY = topH + gap, botH = h - botY - 26;
    const p = { l: 52, r: 12 };
    const iw = w - p.l - p.r;

    // 上：波形与当前这一帧
    g.strokeStyle = C.grid; g.lineWidth = 1;
    g.beginPath(); g.moveTo(p.l, topH / 2); g.lineTo(p.l + iw, topH / 2); g.stroke();
    g.strokeStyle = C.blue; g.beginPath();
    for (let i = 0; i < N; i++) {
      const x = p.l + (i / N) * iw, y = topH / 2 - sig[i] * (topH / 2 - 6);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    const wx = p.l + (start / N) * iw, ww = (FRAME / N) * iw;
    g.fillStyle = 'rgba(217,83,25,.14)'; g.fillRect(wx, 0, ww, topH);
    g.strokeStyle = C.warm; g.lineWidth = 1.6;
    const wfn = hann(FRAME); g.beginPath();
    for (let i = 0; i < FRAME; i++) {
      const x = wx + (i / FRAME) * ww, y = topH - wfn[i] * (topH * 0.5);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();

    // 下：一列一列长出来的声谱图（magma 近似）
    const colW = iw / columns.length;
    for (let c = 0; c <= done && c < columns.length; c++) {
      for (let k = 0; k <= kMax; k++) {
        const v = peak ? columns[c][k] / peak : 0;
        const d = Math.max(0, Math.min(1, (20 * Math.log10(Math.max(v, 1e-6)) + 60) / 60));
        g.fillStyle = magma(d);
        const y = botY + botH - ((k + 1) / (kMax + 1)) * botH;
        g.fillRect(p.l + c * colW, y, Math.ceil(colW) + 0.5, botH / (kMax + 1) + 1);
      }
    }
    g.strokeStyle = C.warm; g.lineWidth = 2; g.beginPath();
    const cx = p.l + Math.min(done, columns.length - 1) * colW + colW;
    g.moveTo(cx, botY); g.lineTo(cx, botY + botH); g.stroke();

    g.fillStyle = C.mute; g.font = '12px system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText('波形', p.l - 8, topH / 2);
    g.fillText(`${maxHz} Hz`, p.l - 8, botY + 6);
    g.fillText('0 Hz', p.l - 8, botY + botH - 6);
    g.textAlign = 'center'; g.textBaseline = 'bottom';
    g.fillText('时间 →', p.l + iw / 2, h - 4);
  }, [columns, kMax, peak, sig]);

  return (
    <Lab title="窗一格一格往右挪，声谱图就一列一列长出来"
      hint="这段声音的音高每隔三分之一就跳一次。上面那扇橙色的窗每次只盖住 1024 个样本，算一次频谱，就在下面画出一列。">
      <></>
      <AnimCanvas w={840} h={340} duration={9000} caption="橙线是当前算到第几列"
        ariaLabel="一扇窗沿波形右移，下方的声谱图逐列生成" draw={draw} />
    </Lab>
  );
}

/** magma 色标的一个够用的近似。 */
function magma(t: number): string {
  const stops: [number, number, number][] = [
    [0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129],
    [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135], [252, 253, 191],
  ];
  const x = Math.max(0, Math.min(0.999, t)) * (stops.length - 1);
  const i = Math.floor(x), f = x - i;
  const a = stops[i], b = stops[i + 1] ?? a;
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}
