'use client';
import { useCallback, useMemo } from 'react';
import { Lab, AnimCanvas, C } from './lab';

const SR = 4000, N = 512;
const PRESENT = [200, 500] as const;   // 信号里真实含有的两个频率

/** 10：拿一个已知频率的试探波去乘信号再求和——对上了就出大数，对不上就相互抵消。 */
export default function ProbeSweepAnim() {
  const sig = useMemo(() => {
    const x = new Float32Array(N);
    for (let i = 0; i < N; i++)
      x[i] = PRESENT.reduce((s, hz, j) => s + (j ? 0.6 : 1) * Math.sin((2 * Math.PI * hz * i) / SR), 0) / 1.6;
    return x;
  }, []);

  const probes = useMemo(() => {
    const out: { hz: number; score: number }[] = [];
    for (let hz = 50; hz <= 800; hz += 10) {
      let re = 0, im = 0;
      for (let i = 0; i < N; i++) {
        re += sig[i] * Math.cos((2 * Math.PI * hz * i) / SR);
        im -= sig[i] * Math.sin((2 * Math.PI * hz * i) / SR);
      }
      out.push({ hz, score: Math.hypot(re, im) / N });
    }
    return out;
  }, [sig]);

  const maxScore = useMemo(() => Math.max(...probes.map((p) => p.score)), [probes]);

  const draw = useCallback((g: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const idx = Math.min(probes.length - 1, Math.floor(t * probes.length));
    const probe = probes[idx];
    const p = { l: 52, r: 12 };
    const iw = w - p.l - p.r;
    const rowH = (h - 30) / 3;

    const row = (yTop: number, label: string, fn: (i: number) => number, color: string) => {
      const mid = yTop + rowH / 2;
      g.strokeStyle = C.grid; g.lineWidth = 1;
      g.beginPath(); g.moveTo(p.l, mid); g.lineTo(p.l + iw, mid); g.stroke();
      g.strokeStyle = color; g.lineWidth = 1.4; g.beginPath();
      for (let i = 0; i < N; i++) {
        const x = p.l + (i / N) * iw, y = mid - fn(i) * (rowH / 2 - 8);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.fillStyle = C.mute; g.font = '12px system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText(label, p.l - 8, mid);
    };

    row(0, '声音', (i) => sig[i], C.blue);
    row(rowH, `试探波 ${probe.hz} Hz`, (i) => Math.sin((2 * Math.PI * probe.hz * i) / SR), C.warm);

    // 第三行：两者相乘，正负面积用不同颜色填出来
    const mid = 2 * rowH + rowH / 2;
    g.strokeStyle = C.grid; g.beginPath(); g.moveTo(p.l, mid); g.lineTo(p.l + iw, mid); g.stroke();
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const v = sig[i] * Math.sin((2 * Math.PI * probe.hz * i) / SR);
      sum += v;
      const x = p.l + (i / N) * iw, y = mid - v * (rowH / 2 - 8);
      g.fillStyle = v >= 0 ? 'rgba(46,139,87,.55)' : 'rgba(201,162,39,.55)';
      g.fillRect(x, Math.min(mid, y), Math.max(1, iw / N), Math.abs(mid - y));
    }
    g.fillStyle = C.mute; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText('相乘', p.l - 8, mid);

    // 右上角累计得分条
    const hit = PRESENT.some((f) => Math.abs(f - probe.hz) <= 10);
    g.fillStyle = hit ? C.green : C.mute;
    g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '13px system-ui';
    g.fillText(hit ? `对上了：加起来 ≈ ${(Math.abs(sum) / N).toFixed(3)}，明显不是零`
      : `没对上：正负基本抵消，加起来 ≈ ${(Math.abs(sum) / N).toFixed(3)}`, p.l + 8, 2 * rowH + 6);

    // 底部：已经试过的频率画成谱线
    const by = h - 24;
    g.strokeStyle = C.line; g.beginPath(); g.moveTo(p.l, by); g.lineTo(p.l + iw, by); g.stroke();
    for (let i = 0; i <= idx; i++) {
      const x = p.l + (i / (probes.length - 1)) * iw;
      const hgt = (probes[i].score / maxScore) * 20;
      g.strokeStyle = i === idx ? C.warm : C.green; g.lineWidth = i === idx ? 2 : 1;
      g.beginPath(); g.moveTo(x, by); g.lineTo(x, by - hgt); g.stroke();
    }
    g.fillStyle = C.mute; g.font = '11px system-ui'; g.textAlign = 'right'; g.textBaseline = 'bottom';
    g.fillText('每试一个频率，就在这里记一笔 →  这条线长出来就是频谱', p.l + iw, h - 2);
  }, [probes, maxScore, sig]);

  return (
    <Lab title="拿已知频率去问声音里有没有它"
      hint="这段声音里其实只有 200 Hz 和 500 Hz。试探波扫过每一个频率：对不上时正负相消、加起来接近零；对上了才留下一个大数。">
      <></>
      <AnimCanvas w={840} h={330} duration={14000} caption="绿色是正的部分，黄色是负的"
        ariaLabel="试探波扫过各个频率，相乘后的正负面积此消彼长，底部逐步长出频谱" draw={draw} />
    </Lab>
  );
}
