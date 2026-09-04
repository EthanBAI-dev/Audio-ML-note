'use client';
import { useMemo, useState } from 'react';
import { Lab, Slider, Canvas, axes, C } from './lab';
import { synth, magnitudeSpectrum, binFrequencies, hann, melFilterbank, dct2, idct2, hzToMel } from '../lib/dsp';

const SR = 22050, N = 2048;

/** 17 / 18 / 20：梅尔带数怎么铺，以及只留前几个 DCT 系数还剩多少轮廓。 */
export default function MelLab() {
  const [nMels, setNMels] = useState(20);
  const [nCoef, setNCoef] = useState(13);

  const { melLog, filters, centers } = useMemo(() => {
    const partials = Array.from({ length: 12 }, (_, i) => ({ hz: 180 * (i + 1), amp: 0.75 ** i }))
      .filter((p) => p.hz < SR / 2);
    const x = synth(partials, N, SR, 0.02);
    const w = hann(N);
    const seg = new Float32Array(N);
    for (let i = 0; i < N; i++) seg[i] = x[i] * w[i];
    const mag = magnitudeSpectrum(seg);
    const power = Float32Array.from(mag, (v) => v * v);
    const { filters, centers } = melFilterbank(nMels, mag.length, SR);
    const melLog = new Float32Array(nMels);
    for (let m = 0; m < nMels; m++) {
      let s = 0;
      for (let k = 0; k < power.length; k++) s += power[k] * filters[m][k];
      melLog[m] = 10 * Math.log10(Math.max(s, 1e-12));
    }
    return { melLog, filters, centers };
  }, [nMels]);

  const reconstructed = useMemo(() => {
    const c = dct2(melLog);
    const kept = new Float32Array(Math.min(nCoef, c.length));
    kept.set(c.subarray(0, kept.length));
    return idct2(kept, melLog.length);
  }, [melLog, nCoef]);

  const err = useMemo(() => {
    let s = 0;
    for (let i = 0; i < melLog.length; i++) s += (melLog[i] - reconstructed[i]) ** 2;
    return Math.sqrt(s / melLog.length);
  }, [melLog, reconstructed]);

  const maxHz = SR / 2;
  const xMel = (hz: number) => hzToMel(hz) / hzToMel(maxHz);

  return (
    <Lab title="梅尔滤波器组与 DCT 保留几个系数"
      hint="上图是三角滤波器组怎么铺在频率轴上；下图是只保留前几个倒谱系数以后，梅尔谱的轮廓还剩多少。">
      <>
        <Slider label="梅尔带数" value={nMels} min={8} max={64} onChange={setNMels} fmt={(v) => `${v} 条`} />
        <Slider label="保留系数" value={nCoef} min={1} max={Math.min(40, nMels)} onChange={setNCoef}
          fmt={(v) => `前 ${v} 个（共 ${nMels}）`} />
      </>
      <>
        <Canvas w={840} h={190} deps={[nMels]} ariaLabel="梅尔三角滤波器组"
          draw={(g, w, h) => {
            const { p, iw, ih } = axes(g, w, h, {
              xLabel: '频率（Hz，按梅尔刻度铺开）', yLabel: '权重',
              xTicks: [0, 500, 1500, 4000, 11025].map((hz) => [xMel(hz), String(hz)] as [number, string]),
              yTicks: [[0, '0'], [1, '1']],
            });
            const freq = binFrequencies(N, SR);
            filters.forEach((row, m) => {
              g.strokeStyle = [C.blue, C.warm, C.green, C.gold][m % 4]; g.lineWidth = 1;
              g.globalAlpha = 0.85; g.beginPath();
              let started = false;
              for (let k = 0; k < row.length; k++) {
                if (row[k] <= 0 && !started) continue;
                const x = p.l + xMel(freq[k]) * iw, y = p.t + ih - row[k] * ih;
                started ? g.lineTo(x, y) : (g.moveTo(x, y), (started = true));
              }
              g.stroke(); g.globalAlpha = 1;
            });
            g.fillStyle = C.mute; g.textAlign = 'left'; g.font = '12px system-ui';
            g.fillText(`${nMels} 条三角滤波器：低频窄、高频宽，正是耳朵分辨频率的方式`, p.l + 6, p.t + 12);
          }} />
        <Canvas w={840} h={200} deps={[melLog, reconstructed, nCoef]} ariaLabel="梅尔谱与用少量系数重建的轮廓"
          draw={(g, w, h) => {
            let lo = Infinity, hi = -Infinity;
            for (const v of melLog) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
            for (const v of reconstructed) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
            const { p, iw, ih } = axes(g, w, h, {
              xLabel: '第几条梅尔带', yLabel: '对数能量（dB）',
              xTicks: [0, 0.5, 1].map((f) => [f, String(Math.round(f * (nMels - 1)) + 1)] as [number, string]),
              yTicks: [[0, lo.toFixed(0)], [1, hi.toFixed(0)]],
            });
            const line = (arr: Float32Array, color: string, dash: number[]) => {
              g.strokeStyle = color; g.lineWidth = 1.8; g.setLineDash(dash); g.beginPath();
              for (let i = 0; i < arr.length; i++) {
                const x = p.l + (i / (arr.length - 1 || 1)) * iw;
                const y = p.t + ih - ((arr[i] - lo) / (hi - lo || 1)) * ih;
                i ? g.lineTo(x, y) : g.moveTo(x, y);
              }
              g.stroke(); g.setLineDash([]);
            };
            line(melLog, C.blue, []);
            line(reconstructed, C.warm, [5, 4]);
            g.font = '12px system-ui'; g.textAlign = 'left';
            g.fillStyle = C.blue; g.fillText('原梅尔谱', p.l + 6, p.t + 12);
            g.fillStyle = C.warm; g.fillText(`只留前 ${nCoef} 个系数重建`, p.l + 6, p.t + 28);
          }} />
        <p className="lab-readout">
          保留 <b>{nCoef}</b> 个系数时，重建曲线和原梅尔谱的均方根差是 <b>{err.toFixed(2)} dB</b>。
          {nCoef <= 3 ? ' 只留这么几个，只剩最粗的走势。'
            : nCoef >= 13 ? ' 到十几个的时候，轮廓已经跟得很紧了——这就是 MFCC 通常取 13 个的由来。'
              : ' 继续往上加，轮廓会越贴越近。'}
        </p>
      </>
    </Lab>
  );
}
