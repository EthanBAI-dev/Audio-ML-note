'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lab, Slider, Choice, Canvas, axes, C } from './lab';
import { playSamples } from '../lib/audio';

const SR = 22050, K = 1024;

/** 固定种子的噪声，拖滑块时噪声形状不变，读者只看见参数的影响。 */
function noiseFrame(n: number): Float32Array {
  let s = 12345;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out[i] = (s / 0x7fffffff) * 2 - 1;
  }
  return out;
}
const NOISE = noiseFrame(K);
const LONG_NOISE = noiseFrame(SR * 1.5);

/** 09：同一帧 1024 个样本，调音高、噪声、直流偏置和一声爆音，看 AE、RMS、ZCR 各自怎么动。 */
export default function ZcrLab() {
  const [hz, setHz] = useState(440);
  const [noise, setNoise] = useState(0);
  const [offset, setOffset] = useState(0);
  const [click, setClick] = useState<'无' | '有'>('无');
  const [center, setCenter] = useState<'不减' | '先减去平均值'>('不减');

  const x = useMemo(() => {
    const y = new Float32Array(K);
    for (let i = 0; i < K; i++) y[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / SR) + noise * 0.5 * NOISE[i] + offset;
    if (click === '有') y[K / 2] = 0.95;
    if (center === '先减去平均值') {
      let m = 0; for (let i = 0; i < K; i++) m += y[i];
      m /= K; for (let i = 0; i < K; i++) y[i] -= m;
    }
    return y;
  }, [hz, noise, offset, click, center]);

  // 与课程代码一致：过零次数除以相邻对的个数 K−1
  const { ae, rms, crossings } = useMemo(() => {
    let a = 0, s = 0;
    const cr: number[] = [];
    for (let i = 0; i < K; i++) {
      a = Math.max(a, Math.abs(x[i]));
      s += x[i] * x[i];
      if (i > 0 && Math.sign(x[i]) !== Math.sign(x[i - 1]) && x[i] !== 0 && x[i - 1] !== 0) cr.push(i);
    }
    return { ae: a, rms: Math.sqrt(s / K), crossings: cr };
  }, [x]);
  const zcr = crossings.length / (K - 1);

  // 把同样的参数拉长到 1.5 秒播出来：爆音放在 0.75 秒处，整条抬高听不出来
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);
  const play = () => {
    stopRef.current?.();
    const n = Math.round(SR * 1.5), y = new Float32Array(n);
    for (let i = 0; i < n; i++) y[i] = 0.5 * Math.sin((2 * Math.PI * hz * i) / SR) + noise * 0.5 * LONG_NOISE[i] + offset;
    if (click === '有') y[n / 2] = 0.95;
    if (center === '先减去平均值') { let m = 0; for (let i = 0; i < n; i++) m += y[i]; m /= n; for (let i = 0; i < n; i++) y[i] -= m; }
    // 头尾各 20 毫秒淡入淡出，免得开关本身变成一声「咔」
    const f = Math.round(SR * 0.02);
    for (let i = 0; i < f; i++) { y[i] *= i / f; y[n - 1 - i] *= i / f; }
    setPlaying(true);
    stopRef.current = playSamples(y, SR, () => setPlaying(false));
  };
  const expect = Math.round((2 * hz * K) / SR);

  return (
    <Lab title="同一帧 1024 个样本，三个数各听谁的"
      hint="先只拖音高，边听边看过零次数怎样跟着变；再加噪声、把整条曲线抬高、塞进一声爆音，看哪一个数被骗。整条抬高是听不出来的，过零率却会掉。">
      <>
        <Slider label="音高" value={hz} min={50} max={2000} step={10} onChange={setHz} fmt={(v) => `${v} Hz`} />
        <Slider label="噪声" value={noise} min={0} max={1} step={0.05} onChange={setNoise} fmt={(v) => v.toFixed(2)} />
        <Slider label="整条抬高" value={offset} min={0} max={0.6} step={0.02} onChange={setOffset} fmt={(v) => v.toFixed(2)} />
        <Choice label="中间一声爆音" value={click} options={['无', '有'] as const} onChange={setClick} />
        <Choice label="算之前" value={center} options={['不减', '先减去平均值'] as const} onChange={setCenter} />
        <div className="lab-choice">
          <span className="lab-slider-label">听一听</span>
          <div role="group">
            <button type="button" aria-pressed={playing} onClick={play}>▶ 播放 1.5 秒</button>
          </div>
        </div>
      </>
      <>
        <Canvas w={840} h={230} deps={[x, ae, rms]} ariaLabel="一帧波形，标出穿过中线的位置、振幅包络和均方根的高度"
          draw={(g, w, h) => {
            const top = 1.2;
            const { p, iw, ih } = axes(g, w, h, {
              xLabel: `一帧内的样本（共 ${K} 个，${((K / SR) * 1000).toFixed(1)} 毫秒）`, yLabel: '振幅',
              xTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => [f, String(Math.round(f * K))] as [number, string]),
              yTicks: [[0, `−${top}`], [0.5, '0'], [1, `+${top}`]],
            });
            const X = (i: number) => p.l + (i / (K - 1)) * iw;
            const Y = (v: number) => p.t + ih / 2 - (Math.max(-top, Math.min(top, v)) / top) * (ih / 2);
            // 中线
            g.strokeStyle = C.mute; g.lineWidth = 1; g.setLineDash([4, 4]);
            g.beginPath(); g.moveTo(p.l, Y(0)); g.lineTo(p.l + iw, Y(0)); g.stroke(); g.setLineDash([]);
            // 波形
            g.strokeStyle = C.blue; g.lineWidth = 1; g.beginPath();
            for (let i = 0; i < K; i++) (i ? g.lineTo(X(i), Y(x[i])) : g.moveTo(X(i), Y(x[i])));
            g.stroke();
            // 过零点
            g.fillStyle = C.green;
            for (const i of crossings) { g.beginPath(); g.arc(X(i), Y(0), 2.6, 0, Math.PI * 2); g.fill(); }
            // AE 与 RMS 的高度
            const mark = (v: number, c: string, label: string, above: boolean) => {
              g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.moveTo(p.l, Y(v)); g.lineTo(p.l + iw, Y(v)); g.stroke();
              g.fillStyle = c; g.font = '12px system-ui, sans-serif'; g.textAlign = 'right';
              g.textBaseline = above ? 'bottom' : 'top';
              g.fillText(label, p.l + iw - 4, Y(v) + (above ? -3 : 3));
            };
            mark(ae, C.warm, `振幅包络 ${ae.toFixed(3)}`, true);
            mark(rms, C.gold, `均方根 ${rms.toFixed(3)}`, false);
          }} />
        <p className="lab-readout">
          过零 <b>{crossings.length}</b> 次，过零率 <b>{zcr.toFixed(4)}</b>（除以 {K - 1} 个相邻对）。
          {noise === 0 && offset === 0 && click === '无'
            ? <> 纯正弦每振动一次过零两次，{hz} Hz 在 {((K / SR) * 1000).toFixed(1)} 毫秒里应过零约 <b>{expect}</b> 次——<b>只有一个音在响时，过零次数直接告诉你音高</b>。</>
            : null}
          {' '}振幅包络 <b>{ae.toFixed(3)}</b>，均方根 <b>{rms.toFixed(3)}</b>。
          {click === '有' ? <> 一个样本的爆音就把振幅包络顶到 0.95 附近，均方根几乎不动：<b>它被其余 1023 个数稀释了</b>。</> : null}
          {offset > 0 && center === '不减' ? <> 整条曲线离开中线后，低处的摆动够不着零线，过零次数掉了下去——<b>声音没变，读数变了</b>。试试「先减去平均值」。</> : null}
          {noise >= 0.5 ? <> 噪声一大，过零次数主要由噪声决定，<b>已经读不出音高</b>。</> : null}
        </p>
      </>
    </Lab>
  );
}
