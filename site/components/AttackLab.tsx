'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lab, Slider, Choice, Canvas, C } from './lab';
import { loadMono, playSamples } from '../lib/audio';

const CLIPS = { 钢琴: 'piano_c', 萨克斯: 'sax', 小提琴: 'violin_c' } as const;
type Clip = keyof typeof CLIPS;
const W = 840, H = 220, PL = 52, PR = 12;

/** 03：把真实录音的开头切掉一截再听，看「怎么开始」对认乐器有多要紧。 */
export default function AttackLab() {
  const [clip, setClip] = useState<Clip>('钢琴');
  const [data, setData] = useState<{ x: Float32Array; sr: number } | null>(null);
  const [cut, setCut] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [err, setErr] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let alive = true;
    stopRef.current?.(); setData(null); setErr('');
    loadMono(`/audio/${CLIPS[clip]}.wav`)
      .then(({ x, sr }) => { if (alive) setData({ x, sr }); })
      .catch(() => { if (alive) setErr('这段音频没能加载。'); });
    return () => { alive = false; stopRef.current?.(); };
  }, [clip]);

  const play = (from: number) => {
    if (!data) return;
    stopRef.current?.();
    const y = data.x.slice(Math.floor((from / 1000) * data.sr));
    // 切口处只做 5 毫秒的淡入，够消掉「咔」，又不至于把起音重新造出来
    const f = Math.round(data.sr * 0.005);
    for (let i = 0; i < f && i < y.length; i++) y[i] *= i / f;
    setPlaying(true);
    stopRef.current = playSamples(y, data.sr, () => setPlaying(false));
  };

  const dur = data ? data.x.length / data.sr : 1;
  // 和课程脚本同一种量法：每 512 个样本一帧取最大绝对值，最大的那帧在第几秒
  const peakT = useMemo(() => {
    if (!data) return 0;
    let best = 0, at = 0;
    for (let s = 0; s + 1024 <= data.x.length; s += 512) {
      let m = 0; for (let i = s; i < s + 1024; i++) m = Math.max(m, Math.abs(data.x[i]));
      if (m > best) { best = m; at = s + 512; }
    }
    return at / data.sr;
  }, [data]);

  return (
    <Lab title="切掉开头，还认得出是什么乐器吗"
      hint="先完整听一遍，再把「切掉开头」拖到 100 毫秒左右听。钢琴最容易「变脸」：没了那一下敲击，剩下的衰减听着像别的东西。小提琴的开头本来就慢，切掉一点影响不大。">
      <>
        <Choice label="录音" value={clip} options={Object.keys(CLIPS) as Clip[]} onChange={(c) => { setClip(c); setCut(0); }} />
        <Slider label="切掉开头" value={cut} min={0} max={400} step={10} onChange={setCut} fmt={(v) => `${v} 毫秒`} />
        <div className="lab-choice">
          <span className="lab-slider-label">听一听</span>
          <div role="group">
            <button type="button" aria-pressed={playing} disabled={!data} onClick={() => play(0)}>▶ 完整</button>
            <button type="button" aria-pressed={playing} disabled={!data || cut === 0} onClick={() => play(cut)}>▶ 切掉 {cut} 毫秒后</button>
          </div>
        </div>
      </>
      <>
        {err ? <p className="lab-readout">{err}</p> : null}
        <Canvas w={W} h={H} deps={[data, cut]} ariaLabel={`${clip}录音的波形，开头 ${cut} 毫秒被切掉`}
          draw={(g, w, h) => {
            const iw = w - PL - PR, top = 12, ph = h - top - 30, mid = top + ph / 2;
            g.font = '12px system-ui, sans-serif';
            g.strokeStyle = C.grid; g.lineWidth = 1; g.strokeRect(PL, top, iw, ph);
            if (!data) { g.fillStyle = C.mute; g.textAlign = 'center'; g.fillText('加载中……', w / 2, mid); return; }
            const { x, sr } = data;
            let peak = 1e-6; for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
            const per = x.length / iw;
            let best = 0, bestPx = 0;
            g.strokeStyle = C.blue; g.beginPath();
            for (let px = 0; px < iw; px++) {
              let m = 0;
              for (let i = Math.floor(px * per); i < Math.floor((px + 1) * per); i++) m = Math.max(m, Math.abs(x[i]));
              if (m > best) { best = m; bestPx = px; }
              const a = (m / peak) * (ph / 2) * 0.95;
              g.moveTo(PL + px, mid - a); g.lineTo(PL + px, mid + a);
            }
            g.stroke();
            // 切掉的部分盖上一层灰
            const cx = PL + Math.min(1, cut / 1000 / dur) * iw;
            g.fillStyle = 'rgba(120,120,128,.45)'; g.fillRect(PL, top, cx - PL, ph);
            g.strokeStyle = C.warm; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, top + ph); g.stroke();
            // 最响处
            g.strokeStyle = C.gold; g.setLineDash([4, 3]); g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(PL + bestPx, top); g.lineTo(PL + bestPx, top + ph); g.stroke(); g.setLineDash([]);
            g.fillStyle = C.gold; g.textAlign = bestPx > iw * 0.7 ? 'right' : 'left'; g.textBaseline = 'top';
            g.fillText('最响处', PL + bestPx + (bestPx > iw * 0.7 ? -4 : 4), top + 4);
            g.fillStyle = C.mute; g.textBaseline = 'top';
            for (let s = 0; s <= dur; s += 0.5) { g.textAlign = 'center'; g.fillText(`${s}s`, PL + (s / dur) * iw, top + ph + 6); }
          }} />
        <p className="lab-readout">
          {cut === 0 ? '灰色是要切掉的部分，金色虚线是整段最响的位置。' : <>切掉了开头 <b>{cut}</b> 毫秒，只占整段的 <b>{((cut / 1000 / dur) * 100).toFixed(0)}%</b>。</>}
          {cut > 0 && cut / 1000 >= peakT ? <> 切口已经越过最响处（约第 <b>{peakT.toFixed(2)}</b> 秒），起音整段没了，只剩后面的部分。</> : null}
          {cut > 0 && cut / 1000 < peakT ? <> 最响处在约第 <b>{peakT.toFixed(2)}</b> 秒，切口还没到，起音还留着一部分。</> : null}
          {cut > 0 && clip === '钢琴' ? ' 钢琴少了敲击那一下，剩下的衰减听着像别的东西。' : null}
          {cut > 0 && clip === '萨克斯' ? ' 萨克斯后面一直保持，切掉开头后还像萨克斯，只是少了「吹」的那一口气。' : null}
          {cut > 0 && clip === '小提琴' ? ' 小提琴本来就是慢慢拉起来的，切掉一点，听感变化最小。' : null}
        </p>
      </>
    </Lab>
  );
}
