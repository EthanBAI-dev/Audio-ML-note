'use client';
import { useMemo, useState } from 'react';
import { Lab, Slider, Canvas, axes, C } from './lab';
import { synth, magnitudeSpectrum, binFrequencies, hann, bandEnergyRatio, centroidBandwidth } from '../lib/dsp';

const SR = 22050, N = 2048;
const PRESETS = {
  '低频为主（像钢琴独奏）': { base: 160, n: 10, decay: 0.55, noise: 0.005 },
  '中频饱满（像管乐）': { base: 300, n: 12, decay: 0.78, noise: 0.02 },
  '高频密集（像失真吉他与镲）': { base: 240, n: 26, decay: 0.94, noise: 0.12 },
} as const;
type Preset = keyof typeof PRESETS;

/** 21 / 22 / 23：拖分界线看 BER，同一张图上标出质心和带宽。 */
export default function BandSplitLab() {
  const [preset, setPreset] = useState<Preset>('低频为主（像钢琴独奏）');
  const [splitHz, setSplitHz] = useState(2000);
  const [p, setP] = useState(2);

  const { mag, freq } = useMemo(() => {
    const c = PRESETS[preset];
    const partials = Array.from({ length: c.n }, (_, i) => ({ hz: c.base * (i + 1), amp: c.decay ** i }))
      .filter((q) => q.hz < SR / 2);
    const x = synth(partials, N, SR, c.noise);
    const w = hann(N);
    const seg = new Float32Array(N);
    for (let i = 0; i < N; i++) seg[i] = x[i] * w[i];
    return { mag: magnitudeSpectrum(seg), freq: binFrequencies(N, SR) };
  }, [preset]);

  const ber = useMemo(() => bandEnergyRatio(mag, freq, splitHz), [mag, freq, splitHz]);
  const cb = useMemo(() => centroidBandwidth(mag, freq, p), [mag, freq, p]);

  const maxHz = 6000;
  return (
    <Lab title="拖动分界线，看三个数一起变"
      hint="在图上左右拖动就能改分界频率。竖线是分界，圆点是频谱质心，横条是带宽铺开的范围。">
      <>
        <div className="lab-choice">
          <span className="lab-slider-label">声音</span>
          <div role="group">
            {(Object.keys(PRESETS) as Preset[]).map((k) => (
              <button key={k} type="button" aria-pressed={k === preset} onClick={() => setPreset(k)}>
                {k.split('（')[0]}
              </button>
            ))}
          </div>
        </div>
        <Slider label="分界频率" value={splitHz} min={200} max={5500} step={10} onChange={setSplitHz}
          fmt={(v) => `${v} Hz`} />
        <Slider label="带宽的 p" value={p} min={1} max={2} step={1} onChange={setP}
          fmt={(v) => (v === 1 ? 'p=1 平均绝对距离' : 'p=2 加权标准差')} />
      </>
      <>
        <Canvas w={840} h={250} deps={[mag, splitHz, p]} ariaLabel="频谱上的分界线、质心与带宽"
          onPointer={(fx) => {
            const pad = { l: 52, r: 12 };
            const frac = Math.min(1, Math.max(0, (fx * 840 - pad.l) / (840 - pad.l - pad.r)));
            setSplitHz(Math.round((frac * maxHz) / 10) * 10 || 200);
          }}
          draw={(g, w, h) => {
            const kMax = Math.floor(maxHz / (SR / N));
            let peak = 0; for (let k = 1; k <= kMax; k++) peak = Math.max(peak, mag[k]);
            const { p: pad, iw, ih } = axes(g, w, h, {
              xLabel: '频率（Hz）— 在图上拖动改分界', yLabel: '幅度',
              xTicks: [0, .25, .5, .75, 1].map((f) => [f, (f * maxHz).toFixed(0)] as [number, string]),
              yTicks: [[0, '0'], [1, '峰值']],
            });
            const X = (hz: number) => pad.l + (hz / maxHz) * iw;
            // 分界两侧填色
            g.fillStyle = 'rgba(0,114,189,.10)'; g.fillRect(pad.l, pad.t, X(splitHz) - pad.l, ih);
            g.fillStyle = 'rgba(217,83,25,.10)'; g.fillRect(X(splitHz), pad.t, pad.l + iw - X(splitHz), ih);
            // 谱线
            g.strokeStyle = C.ink; g.lineWidth = 1.4; g.beginPath();
            for (let k = 1; k <= kMax; k++) {
              const x = X(freq[k]), y = pad.t + ih - (peak ? mag[k] / peak : 0) * ih;
              k === 1 ? g.moveTo(x, y) : g.lineTo(x, y);
            }
            g.stroke();
            // 带宽范围
            const y0 = pad.t + ih * 0.12;
            g.strokeStyle = C.green; g.lineWidth = 6; g.globalAlpha = 0.35; g.beginPath();
            g.moveTo(X(Math.max(0, cb.centroid - cb.bandwidth)), y0);
            g.lineTo(X(Math.min(maxHz, cb.centroid + cb.bandwidth)), y0); g.stroke(); g.globalAlpha = 1;
            // 质心
            g.fillStyle = C.green; g.beginPath(); g.arc(X(cb.centroid), y0, 5, 0, Math.PI * 2); g.fill();
            g.font = '12px system-ui'; g.textAlign = 'left';
            g.fillText(`质心 ${cb.centroid.toFixed(0)} Hz，带宽 ±${cb.bandwidth.toFixed(0)} Hz`, X(cb.centroid) + 10, y0 - 6);
            // 分界线
            g.strokeStyle = C.warm; g.lineWidth = 2; g.beginPath();
            g.moveTo(X(splitHz), pad.t); g.lineTo(X(splitHz), pad.t + ih); g.stroke();
            g.fillStyle = C.warm; g.textAlign = X(splitHz) > pad.l + iw * 0.7 ? 'right' : 'left';
            g.fillText(`${splitHz} Hz → 第 ${ber.split} 格`, X(splitHz) + (X(splitHz) > pad.l + iw * 0.7 ? -6 : 6), pad.t + ih - 8);
          }} />
        <p className="lab-readout">
          分界 <b>{splitHz} Hz</b> 落在第 <b>{ber.split}</b> 格（真实频率 {ber.splitBinHz.toFixed(2)} Hz）。
          带能量比 <b>{ber.db.toFixed(2)} dB</b>
          {ber.db > 0 ? '，低频那一半更占优势。' : '，高频那一半拿走了更多能量。'}
          {' '}质心 <b>{cb.centroid.toFixed(0)} Hz</b>，{p === 1 ? 'p=1' : 'p=2'} 带宽 <b>{cb.bandwidth.toFixed(0)} Hz</b>。
          换个声音再拖一次：<b>质心和带宽跟分界线无关，只有带能量比会跟着动</b>——三个数问的确实不是同一个问题。
        </p>
      </>
    </Lab>
  );
}
