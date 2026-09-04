'use client';
import { useMemo, useState } from 'react';
import { Lab, Slider, Choice, Canvas, axes, C } from './lab';
import { synth, magnitudeSpectrum, binFrequencies, hann } from '../lib/dsp';

const SR = 22050, N = 2048;
type Scale = '幅度' | '功率' | 'dB';
type Axis = '线性频率' | '对数频率';

/** 10 / 14 / 16：自己叠正弦，看频谱怎么变；再换纵轴与横轴的画法。 */
export default function SpectrumLab() {
  const [f1, setF1] = useState(220);
  const [harmonics, setHarmonics] = useState(5);
  const [decay, setDecay] = useState(0.6);
  const [noise, setNoise] = useState(0);
  const [scale, setScale] = useState<Scale>('幅度');
  const [axis, setAxis] = useState<Axis>('线性频率');

  const { mag, freq } = useMemo(() => {
    const partials = Array.from({ length: harmonics }, (_, i) => ({
      hz: f1 * (i + 1), amp: decay ** i,
    })).filter((p) => p.hz < SR / 2);
    const x = synth(partials, N, SR, noise);
    const w = hann(N);
    const seg = new Float32Array(N);
    for (let i = 0; i < N; i++) seg[i] = x[i] * w[i];
    return { mag: magnitudeSpectrum(seg), freq: binFrequencies(N, SR) };
  }, [f1, harmonics, decay, noise]);

  const values = useMemo(() => {
    const out = new Float32Array(mag.length);
    for (let k = 0; k < mag.length; k++) {
      if (scale === '幅度') out[k] = mag[k];
      else if (scale === '功率') out[k] = mag[k] ** 2;
      else out[k] = 20 * Math.log10(Math.max(mag[k], 1e-10));
    }
    return out;
  }, [mag, scale]);

  const maxHz = 5000, fMin = 40;
  const xOf = (hz: number, iw: number) =>
    axis === '线性频率'
      ? (hz / maxHz) * iw
      : ((Math.log10(Math.max(hz, fMin)) - Math.log10(fMin)) / (Math.log10(maxHz) - Math.log10(fMin))) * iw;

  return (
    <Lab title="自己叠一个声音，看它的频谱"
      hint="改基频和泛音个数，频谱跟着变；再换一下纵轴和横轴的画法——同一批数，换个画法看到的东西不一样。">
      <>
        <Slider label="基频" value={f1} min={80} max={800} step={5} onChange={setF1} fmt={(v) => `${v} Hz`} />
        <Slider label="泛音个数" value={harmonics} min={1} max={16} onChange={setHarmonics} fmt={(v) => `${v} 个`} />
        <Slider label="泛音衰减" value={decay} min={0.1} max={0.95} step={0.05} onChange={setDecay}
          fmt={(v) => `每高一个泛音 ×${v.toFixed(2)}`} />
        <Slider label="噪声" value={noise} min={0} max={0.5} step={0.02} onChange={setNoise}
          fmt={(v) => (v === 0 ? '无' : v.toFixed(2))} />
        <Choice label="纵轴" value={scale} options={['幅度', '功率', 'dB'] as const} onChange={setScale} />
        <Choice label="横轴" value={axis} options={['线性频率', '对数频率'] as const} onChange={setAxis} />
      </>
      <>
        <Canvas w={840} h={230} deps={[values, axis, scale]} ariaLabel="可调参数的频谱图"
          draw={(g, w, h) => {
            const kMax = Math.floor(maxHz / (SR / N));
            let lo = Infinity, hi = -Infinity;
            for (let k = 1; k <= kMax; k++) { lo = Math.min(lo, values[k]); hi = Math.max(hi, values[k]); }
            if (scale === 'dB') lo = Math.max(lo, hi - 80); else lo = 0;
            const yTicks: [number, string][] = scale === 'dB'
              ? [[0, `${lo.toFixed(0)} dB`], [0.5, `${((lo + hi) / 2).toFixed(0)}`], [1, `${hi.toFixed(0)} dB`]]
              : [[0, '0'], [1, '峰值']];
            const xt: [number, string][] = axis === '线性频率'
              ? [0, .25, .5, .75, 1].map((f) => [f, (f * maxHz).toFixed(0)] as [number, string])
              : [50, 100, 500, 1000, 5000].map((hz) => [xOf(hz, 1), String(hz)] as [number, string]);
            const { p, iw, ih } = axes(g, w, h, {
              xLabel: axis === '线性频率' ? '频率（Hz，线性）' : '频率（Hz，对数）',
              yLabel: scale, xTicks: xt, yTicks,
            });
            g.strokeStyle = C.blue; g.lineWidth = 1.5; g.beginPath();
            for (let k = 1; k <= kMax; k++) {
              const x = p.l + xOf(freq[k], iw);
              const y = p.t + ih - ((values[k] - lo) / (hi - lo || 1)) * ih;
              k === 1 ? g.moveTo(x, y) : g.lineTo(x, y);
            }
            g.stroke();
            // 标出基频
            g.strokeStyle = C.warm; g.setLineDash([4, 4]); g.beginPath();
            const bx = p.l + xOf(f1, iw); g.moveTo(bx, p.t); g.lineTo(bx, p.t + ih); g.stroke(); g.setLineDash([]);
            g.fillStyle = C.warm; g.textAlign = 'left'; g.font = '12px system-ui';
            g.fillText(`基频 ${f1} Hz`, bx + 5, p.t + 12);
          }} />
        <p className="lab-readout">
          {scale === 'dB'
            ? '换成 dB 以后，那些在幅度轴上贴着零线、看起来等于没有的高频泛音，全都露出来了——它们一直都在，只是线性轴把它们压扁了。'
            : scale === '功率'
              ? '平方以后强的更强、弱的更弱，泛音之间的差距被拉大了。'
              : '幅度轴上只看得见最强的那几根。把纵轴换成 dB 试试。'}
          {axis === '对数频率'
            ? ' 横轴换成对数以后，等比例的泛音间隔变成了等距——这正是耳朵听音程的方式。'
            : ''}
        </p>
      </>
    </Lab>
  );
}
