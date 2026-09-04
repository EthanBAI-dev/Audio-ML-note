'use client';
import { useMemo, useState } from 'react';
import { Lab, Slider, Choice, Canvas, axes, C } from './lab';
import { WINDOWS, type WindowName, synth, magnitudeSpectrum, binFrequencies } from '../lib/dsp';

const SR = 22050;

/** 15：只改帧长，看时间与频率分辨率怎样此消彼长；帧移的效果已经在 06 演示。 */
export default function FramingLab() {
  const [frameExp, setFrameExp] = useState(11);   // 2^11 = 2048
  const [win, setWin] = useState<WindowName>('hann');

  const frame = 2 ** frameExp;
  const hop = Math.max(1, Math.round(frame / 4));
  const ms = (frame / SR) * 1000;
  const hopMs = (hop / SR) * 1000;
  const df = SR / frame;

  // 一段 0.35 秒的信号：前半是 440 Hz，后半突然跳到 1200 Hz，用来看时间分辨率
  const total = 8192;
  const sig = useMemo(() => {
    const x = new Float32Array(total);
    for (let i = 0; i < total; i++) {
      const hz = i < total / 2 ? 440 : 1200;
      x[i] = Math.sin((2 * Math.PI * hz * i) / SR) * (0.6 + 0.4 * Math.sin((2 * Math.PI * i) / total));
    }
    return x;
  }, []);

  const spec = useMemo(() => {
    const w = WINDOWS[win](frame);
    const seg = new Float32Array(frame);
    const start = Math.max(0, Math.floor(total / 2) - Math.floor(frame / 2));
    for (let i = 0; i < frame; i++) seg[i] = (sig[start + i] ?? 0) * w[i];
    return { mag: magnitudeSpectrum(seg), freq: binFrequencies(frame, SR) };
  }, [frame, win, sig]);

  const nFrames = Math.floor((total - frame) / hop) + 1;

  return (
    <Lab title="调一调帧长，看时间和频率的取舍"
      hint="这段信号在正中间从 440 Hz 跳到 1200 Hz。帧移固定为帧长的四分之一；这里只改变帧长，频率读得越准，那一跳发生在哪一刻就越模糊。">
      <>
        <Slider label="帧长" value={frameExp} min={7} max={13} onChange={setFrameExp}
          fmt={(v) => `${2 ** v} 个样本（${((2 ** v / SR) * 1000).toFixed(1)} ms）`} />
        <Choice label="窗" value={win} options={['hann', 'hamming', 'rect'] as const} onChange={setWin} />
      </>
      <>
        <Canvas w={840} h={190} deps={[frame, hop, win]} ariaLabel="波形上的分帧位置与窗形状"
          draw={(g, w, h) => {
            const { p, iw, ih } = axes(g, w, h, {
              xLabel: '时间（毫秒）', yLabel: '振幅',
              xTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => [f, ((f * total) / SR * 1000).toFixed(0)] as [number, string]),
              yTicks: [[0, '−1'], [0.5, '0'], [1, '+1']],
            });
            // 波形
            g.strokeStyle = C.blue; g.lineWidth = 1; g.beginPath();
            for (let i = 0; i < total; i++) {
              const x = p.l + (i / total) * iw, y = p.t + ih / 2 - (sig[i] / 2) * (ih / 2);
              i ? g.lineTo(x, y) : g.moveTo(x, y);
            }
            g.stroke();
            // 前三帧的覆盖范围与窗形状
            const wfn = WINDOWS[win](frame);
            for (let f = 0; f < Math.min(nFrames, 3); f++) {
              const s = f * hop;
              g.fillStyle = ['rgba(217,83,25,.12)', 'rgba(46,139,87,.12)', 'rgba(201,162,39,.12)'][f];
              g.fillRect(p.l + (s / total) * iw, p.t, (frame / total) * iw, ih);
              g.strokeStyle = [C.warm, C.green, C.gold][f]; g.lineWidth = 1.5; g.beginPath();
              for (let i = 0; i < frame; i++) {
                const x = p.l + ((s + i) / total) * iw, y = p.t + ih - wfn[i] * ih * 0.42;
                i ? g.lineTo(x, y) : g.moveTo(x, y);
              }
              g.stroke();
            }
            g.fillStyle = C.mute; g.font = '12px system-ui'; g.textAlign = 'left';
            g.fillText(`共 ${nFrames} 帧，相邻两帧相隔 ${hopMs.toFixed(1)} ms`, p.l + 6, p.t + 12);
          }} />
        <Canvas w={840} h={190} deps={[frame, win]} ariaLabel="当前帧长下的频谱"
          draw={(g, w, h) => {
            const maxHz = 3000;
            const kMax = Math.min(spec.mag.length - 1, Math.floor(maxHz / (SR / frame)));
            let peak = 0; for (let k = 0; k <= kMax; k++) peak = Math.max(peak, spec.mag[k]);
            const { p, iw, ih } = axes(g, w, h, {
              xLabel: '频率（Hz）', yLabel: '幅度',
              xTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => [f, (f * maxHz).toFixed(0)] as [number, string]),
              yTicks: [[0, '0'], [1, '峰值']],
            });
            g.strokeStyle = C.warm; g.lineWidth = 1.5; g.beginPath();
            for (let k = 0; k <= kMax; k++) {
              const x = p.l + (spec.freq[k] / maxHz) * iw;
              const y = p.t + ih - (peak ? spec.mag[k] / peak : 0) * ih;
              k ? g.lineTo(x, y) : g.moveTo(x, y);
            }
            g.stroke();
            g.fillStyle = C.mute; g.textAlign = 'left'; g.font = '12px system-ui';
            g.fillText(`频率格距 ${df.toFixed(1)} Hz——两个靠得比这更近的频率分不开`, p.l + 6, p.t + 12);
          }} />
        <p className="lab-readout">
          帧长 <b>{frame}</b> 个样本 = <b>{ms.toFixed(1)} ms</b>，频率格距 <b>{df.toFixed(1)} Hz</b>。
          帧越长，频率轴上的格越密（看得清频率），但一帧盖住的时间越长（看不清什么时候发生）。
          这就是时间和频率分辨率换不掉的那笔账。
        </p>
      </>
    </Lab>
  );
}
