'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, C, Lab, Slider, axes } from './lab';

type ToneNodes = {
  context: AudioContext;
  oscillator: OscillatorNode;
  gain: GainNode;
};

/** 第 02 课：把频率、振幅和相位从三个名词变成能拖、能看、能听的变化。 */
export default function ToneLab() {
  const [frequency, setFrequency] = useState(440);
  const [amplitude, setAmplitude] = useState(0.35);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const nodes = useRef<ToneNodes | null>(null);

  useEffect(() => {
    const current = nodes.current;
    if (!current) return;
    const now = current.context.currentTime;
    current.oscillator.frequency.setTargetAtTime(frequency, now, 0.015);
    current.gain.gain.setTargetAtTime(amplitude * 0.16, now, 0.015);
  }, [frequency, amplitude]);

  useEffect(() => () => {
    const current = nodes.current;
    if (!current) return;
    try { current.oscillator.stop(); } catch { /* 已经停止 */ }
    void current.context.close();
    nodes.current = null;
  }, []);

  async function startTone() {
    if (nodes.current) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    await context.resume();
    gain.gain.setTargetAtTime(amplitude * 0.16, context.currentTime, 0.02);
    nodes.current = { context, oscillator, gain };
    setPlaying(true);
  }

  function stopTone() {
    const current = nodes.current;
    if (!current) return;
    const now = current.context.currentTime;
    current.gain.gain.cancelScheduledValues(now);
    current.gain.gain.setTargetAtTime(0, now, 0.012);
    window.setTimeout(() => {
      try { current.oscillator.stop(); } catch { /* 已经停止 */ }
      void current.context.close();
    }, 90);
    nodes.current = null;
    setPlaying(false);
  }

  const phaseRadians = phase * Math.PI / 180;

  return (
    <Lab title="摸一摸波形，再听它怎样变化"
      hint="先点播放，再拖动三个滑杆。频率和振幅既改变图形，也改变听感；相位只让整条波形左右平移，持续播放时几乎听不出区别。">
      <>
        <Slider label="频率" value={frequency} min={110} max={880} step={1} onChange={setFrequency}
          fmt={(value) => `${value} Hz · ${value < 330 ? '较低' : value > 600 ? '较高' : '中间'}`} />
        <Slider label="振幅" value={amplitude} min={0.05} max={0.8} step={0.01} onChange={setAmplitude}
          fmt={(value) => `${value.toFixed(2)} · ${value < 0.25 ? '较轻' : value > 0.58 ? '较响' : '适中'}`} />
        <Slider label="相位" value={phase} min={-180} max={180} step={5} onChange={setPhase}
          fmt={(value) => `${value > 0 ? '+' : ''}${value}° · 只平移`} />
        <div className="lab-audio-row">
          <button type="button" className="lab-audio-button" aria-pressed={playing}
            onClick={() => playing ? stopTone() : void startTone()}>
            {playing ? '停止声音' : '播放声音'}
          </button>
          <span className={`lab-audio-status${playing ? ' is-playing' : ''}`} aria-live="polite">
            <i aria-hidden="true" />{playing ? `正在播放 ${frequency} Hz 正弦波` : '声音仅在点击后播放，初始音量较低'}
          </span>
        </div>
      </>
      <>
        <Canvas w={840} h={240} deps={[frequency, amplitude, phaseRadians]}
          ariaLabel={`频率 ${frequency} 赫兹、振幅 ${amplitude.toFixed(2)}、相位 ${phase} 度的正弦波`}
          draw={(g, w, h) => {
            const duration = 0.025;
            const { p, iw, ih } = axes(g, w, h, {
              xLabel: '时间（毫秒）', yLabel: '振幅',
              xTicks: [0, .2, .4, .6, .8, 1].map((x) => [x, String(Math.round(x * duration * 1000))] as [number, string]),
              yTicks: [[0, '−1'], [.5, '0'], [1, '+1']],
            });
            g.strokeStyle = C.line;
            g.lineWidth = 1.2;
            g.beginPath();
            g.moveTo(p.l, p.t + ih / 2);
            g.lineTo(p.l + iw, p.t + ih / 2);
            g.stroke();

            const points = Math.max(500, Math.round(iw));
            g.beginPath();
            for (let i = 0; i <= points; i++) {
              const fraction = i / points;
              const value = amplitude * Math.sin(2 * Math.PI * frequency * duration * fraction + phaseRadians);
              const x = p.l + fraction * iw;
              const y = p.t + ih / 2 - value * ih * 0.44;
              i ? g.lineTo(x, y) : g.moveTo(x, y);
            }
            g.strokeStyle = C.blue;
            g.lineWidth = 2.2;
            g.stroke();

            const cycles = frequency * duration;
            g.fillStyle = C.mute;
            g.font = '12px system-ui, sans-serif';
            g.textAlign = 'left';
            g.fillText(`这 25 ms 里画了 ${cycles.toFixed(1)} 轮`, p.l + 8, p.t + 17);
          }} />
        <p className="lab-readout">
          现在是 <b>{frequency} Hz</b>、振幅 <b>{amplitude.toFixed(2)}</b>、相位 <b>{phase}°</b>。
          拖频率：25 ms 里的波数和听到的高低一起变；拖振幅：曲线高度和响度一起变；只拖相位：图在移动，持续音却几乎不变。
        </p>
      </>
    </Lab>
  );
}
