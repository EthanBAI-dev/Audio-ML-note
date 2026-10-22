'use client';
import { useEffect, useRef, useState } from 'react';
import { Lab, Slider, Choice, Canvas, axes, C } from './lab';
import { playSamples } from '../lib/audio';

const SR = 44100;
const HZ = { '62 Hz': 62, '125 Hz': 125, '250 Hz': 250, '500 Hz': 500, '2 kHz': 2000, '4 kHz': 4000, '8 kHz': 8000, '12 kHz': 12000 } as const;
const FREQS = Object.keys(HZ) as (keyof typeof HZ)[];
type F = keyof typeof HZ;
// 参考音的振幅故意很小：第二个音最多再加 30 dB，乘 31.6 倍以后仍不到 0.32，不会削顶
const REF_AMP = 0.01;

/** 与课程脚本同一个式子：IEC 61672 的 A 计权。取负号就是「要和 1 kHz 一样响得多给多少 dB」。 */
function aWeight(f: number): number {
  const f2 = f * f;
  const num = 12194 ** 2 * f2 ** 2;
  const den = (f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2);
  return 20 * Math.log10(num / den) + 2.0;
}
const need = (f: number) => -(aWeight(f) - aWeight(1000));

function pair(f: number, gainDb: number): Float32Array {
  const n = Math.round(SR * 0.8), gap = Math.round(SR * 0.25), fade = Math.round(SR * 0.03);
  const y = new Float32Array(n * 2 + gap);
  [[1000, REF_AMP], [f, REF_AMP * Math.pow(10, gainDb / 20)]].forEach(([fr, a], k) => {
    const off = k * (n + gap);
    for (let i = 0; i < n; i++) {
      const env = Math.min(1, i / fade, (n - 1 - i) / fade);
      y[off + i] = a * env * Math.sin((2 * Math.PI * fr * i) / SR);
    }
  });
  return y;
}

/** 03：先听 1 kHz，再听另一个频率；把第二个调到「一样响」，和等响曲线对一对。 */
export default function LoudnessLab() {
  const [freq, setFreq] = useState<F>('125 Hz');
  const [gain, setGain] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);
  useEffect(() => { setGain(0); }, [freq]);

  const f = HZ[freq];
  const curve = need(f);

  const play = () => {
    stopRef.current?.();
    // 直接放，不经过峰值压缩：两个音的相对大小就是要比的东西
    setPlaying(true);
    stopRef.current = playSamples(pair(f, gain), SR, () => setPlaying(false));
  };

  return (
    <Lab title="两个振幅一样的音，听起来一样响吗"
      hint="先把系统音量调到适中。点播放：先响 1 kHz，再响你选的频率，一开始两个音的振幅完全一样。拖「第二个音加多少」，直到你觉得两个一样响，再看图上你的点和曲线差多远。">
      <>
        <Choice label="第二个音" value={freq} options={FREQS} onChange={setFreq} />
        <Slider label="加多少" value={gain} min={-10} max={30} step={0.5} onChange={setGain} fmt={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`} />
        <div className="lab-choice">
          <span className="lab-slider-label">听一听</span>
          <div role="group">
            <button type="button" aria-pressed={playing} onClick={play}>▶ 1 kHz → {f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`}</button>
          </div>
        </div>
      </>
      <>
        <Canvas w={840} h={260} deps={[f, gain]} ariaLabel={`等响曲线，以及你在 ${f} 赫兹处调出的 ${gain} 分贝`}
          draw={(g, w, h) => {
            const lo = Math.log10(20), hi = Math.log10(16000), dMin = -10, dMax = 45;
            const xt: [number, string][] = [31.5, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
              .map((v) => [(Math.log10(v) - lo) / (hi - lo), v >= 1000 ? `${v / 1000}k` : String(v)]);
            const yt: [number, string][] = [-10, 0, 10, 20, 30, 40].map((v) => [(v - dMin) / (dMax - dMin), `${v > 0 ? '+' : ''}${v}`]);
            const { p, iw, ih } = axes(g, w, h, { xLabel: '频率（Hz，按倍数分格）', yLabel: '要多给的 dB', xTicks: xt, yTicks: yt });
            const X = (fr: number) => p.l + ((Math.log10(fr) - lo) / (hi - lo)) * iw;
            const Y = (d: number) => p.t + (1 - (Math.max(dMin, Math.min(dMax, d)) - dMin) / (dMax - dMin)) * ih;
            g.strokeStyle = C.blue; g.lineWidth = 2; g.beginPath();
            for (let i = 0; i <= 200; i++) {
              const fr = Math.pow(10, lo + (i / 200) * (hi - lo));
              (i ? g.lineTo(X(fr), Y(need(fr))) : g.moveTo(X(fr), Y(need(fr))));
            }
            g.stroke();
            g.fillStyle = C.blue; g.font = '12px system-ui, sans-serif'; g.textAlign = 'left';
            g.textAlign = 'center'; g.fillText('等响曲线（中等音量）', X(4000), Y(need(4000)) - 12);
            // 参考点 1 kHz、曲线上的答案、你的点
            g.fillStyle = C.mute; g.beginPath(); g.arc(X(1000), Y(0), 4, 0, Math.PI * 2); g.fill();
            g.strokeStyle = C.blue; g.lineWidth = 2; g.beginPath(); g.arc(X(f), Y(curve), 6, 0, Math.PI * 2); g.stroke();
            g.fillStyle = C.warm; g.beginPath(); g.arc(X(f), Y(gain), 6, 0, Math.PI * 2); g.fill();
            g.strokeStyle = C.warm; g.setLineDash([3, 3]); g.lineWidth = 1;
            g.beginPath(); g.moveTo(X(f), Y(gain)); g.lineTo(X(f), Y(curve)); g.stroke(); g.setLineDash([]);
            g.fillStyle = C.warm; g.textAlign = X(f) > p.l + iw * 0.8 ? 'right' : 'left';
            g.fillText('你', X(f) + (X(f) > p.l + iw * 0.8 ? -10 : 10), Y(gain) - 4);
          }} />
        <p className="lab-readout">
          你给 {f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`} 加了 <b>{gain > 0 ? '+' : ''}{gain.toFixed(1)} dB</b>，
          等响曲线给的是 <b>{curve > 0 ? '+' : ''}{curve.toFixed(1)} dB</b>，相当于 <b>{Math.pow(10, curve / 10).toFixed(curve > 10 ? 0 : 2)}</b> 倍声强。
          {f <= 125 ? ' 低频要多给很多才追得上。笔记本和手机的小喇叭本身就放不出低频，用耳机试会准得多。' : null}
          {f >= 2000 && f <= 4000 ? ' 这一段耳朵比 1 kHz 还灵，振幅一样时它听着反而更响。' : null}
          {' '}你的点和曲线差几分贝很正常：曲线是很多人的平均，还和播放音量、耳机、年龄有关。
        </p>
      </>
    </Lab>
  );
}
