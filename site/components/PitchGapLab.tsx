'use client';
import { useEffect, useRef, useState } from 'react';
import { Lab, Slider, Choice, Canvas, C } from './lab';
import { playSamples } from '../lib/audio';

const SR = 22050;
const BASES = ['110', '220', '440', '880', '1760'] as const;
const STEPS = ['+100 Hz', '×2（一个八度）', '+几音分'] as const;
type Base = (typeof BASES)[number];
type Step = (typeof STEPS)[number];

/** 两个音先后各响 0.6 秒，中间停 0.15 秒；头尾淡入淡出，免得开关本身变成「咔」。 */
function twoTones(f1: number, f2: number): Float32Array {
  const n = Math.round(SR * 0.6), gap = Math.round(SR * 0.15), fade = Math.round(SR * 0.02);
  const y = new Float32Array(n * 2 + gap);
  [f1, f2].forEach((f, k) => {
    const off = k * (n + gap);
    for (let i = 0; i < n; i++) {
      const env = Math.min(1, i / fade, (n - 1 - i) / fade);
      y[off + i] = 0.3 * env * Math.sin((2 * Math.PI * f * i) / SR);
    }
  });
  return y;
}

/** 02：同样加 100 Hz，在不同音区听起来差多远；再和「乘 2」「加几音分」对比。 */
export default function PitchGapLab() {
  const [base, setBase] = useState<Base>('220');
  const [step, setStep] = useState<Step>('+100 Hz');
  const [cents, setCents] = useState(20);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);

  const f1 = Number(base);
  const f2 = step === '+100 Hz' ? f1 + 100 : step === '×2（一个八度）' ? f1 * 2 : f1 * Math.pow(2, cents / 1200);
  const c = 1200 * Math.log2(f2 / f1);

  const play = () => {
    stopRef.current?.();
    setPlaying(true);
    stopRef.current = playSamples(twoTones(f1, f2), SR, () => setPlaying(false));
  };

  return (
    <Lab title="同样差 100 Hz，听起来差多远"
      hint="先选「+100 Hz」，从 110 换到 1760 逐个听：低音区一跳很远，高音区几乎贴着。再选「×2」，每个音区听到的距离都一样。最后试「+几音分」，找找自己从几音分开始听得出不同。">
      <>
        <Choice label="起点" value={base} options={BASES} onChange={setBase} />
        <Choice label="第二个音" value={step} options={STEPS} onChange={setStep} />
        {step === '+几音分' ? <Slider label="升高" value={cents} min={1} max={100} step={1} onChange={setCents} fmt={(v) => `${v} 音分`} /> : null}
        <div className="lab-choice">
          <span className="lab-slider-label">听一听</span>
          <div role="group">
            <button type="button" aria-pressed={playing} onClick={play}>▶ 先后播放两个音</button>
          </div>
        </div>
      </>
      <>
        <Canvas w={840} h={230} deps={[f1, f2]} ariaLabel={`${f1.toFixed(0)} 赫兹和 ${f2.toFixed(1)} 赫兹在等差尺和按倍数的尺上的位置`}
          draw={(g, w) => {
            const pl = 128, pr = 24, iw = w - pl - pr;
            g.font = '12px system-ui, sans-serif';
            const ruler = (y: number, label: string, pos: (f: number) => number, ticks: [number, string][]) => {
              g.fillStyle = C.ink; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(label, pl - 14, y);
              g.strokeStyle = C.mute; g.lineWidth = 1; g.beginPath(); g.moveTo(pl, y); g.lineTo(pl + iw, y); g.stroke();
              g.fillStyle = C.mute; g.textAlign = 'center'; g.textBaseline = 'top';
              for (const [f, s] of ticks) {
                const x = pl + pos(f) * iw;
                g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x, y + 4); g.stroke();
                g.fillText(s, x, y + 8);
              }
              const a = pl + pos(f1) * iw, b = pl + pos(f2) * iw;
              g.strokeStyle = C.gold; g.lineWidth = 6; g.globalAlpha = 0.55;
              g.beginPath(); g.moveTo(a, y); g.lineTo(b, y); g.stroke(); g.globalAlpha = 1;
              g.fillStyle = C.blue; g.beginPath(); g.arc(a, y, 6, 0, Math.PI * 2); g.fill();
              g.fillStyle = C.warm; g.beginPath(); g.arc(b, y, 6, 0, Math.PI * 2); g.fill();
            };
            const lin = (f: number) => Math.min(1, f / 3600);
            const lg = (f: number) => Math.min(1, Math.max(0, Math.log2(f / 55) / Math.log2(3600 / 55)));
            ruler(60, '等差尺：按赫兹', lin, [0, 500, 1000, 1500, 2000, 2500, 3000, 3500].map((f) => [f, String(f)] as [number, string]));
            ruler(160, '耳朵的尺：按倍数', lg, [55, 110, 220, 440, 880, 1760, 3520].map((f) => [f, String(f)] as [number, string]));
            g.fillStyle = C.mute; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
            g.fillText('上面每格加 500 Hz；下面每格乘 2，是一个八度', pl, 24);
          }} />
        <p className="lab-readout">
          蓝点 <b>{f1} Hz</b>，橙点 <b>{f2.toFixed(f2 % 1 ? 1 : 0)} Hz</b>：差 <b>{(f2 - f1).toFixed(1)} Hz</b>，
          是 <b>{(f2 / f1).toFixed(4)}</b> 倍，合 <b>{c.toFixed(1)}</b> 音分，约 <b>{(c / 100).toFixed(1)}</b> 个半音。
          {step === '+100 Hz' ? ' 换几个起点再听：赫兹的差一直是 100，耳朵听到的距离跟着倍数走。' : null}
          {step === '×2（一个八度）' ? ' 不管起点在哪，都是 1200 音分：两个音听起来是同一个音名，一高一低。' : null}
          {step === '+几音分' ? (cents < 10 ? ' 不到 10 音分，大多数人听不出差别。' : cents <= 25 ? ' 10 到 25 音分，正好在「仔细听才听得出」的范围里。' : ' 超过 25 音分，多数人能听出来第二个音偏高。') : null}
        </p>
      </>
    </Lab>
  );
}
