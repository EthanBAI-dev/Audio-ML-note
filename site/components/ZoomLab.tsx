'use client';
import { useEffect, useRef, useState } from 'react';
import { Lab, Slider, Canvas, C } from './lab';
import { loadMono, playSamples } from '../lib/audio';

const W = 840, H = 300;
const PL = 56, PR = 12;
const MAX_WIN = 30, MIN_WIN = 0.0015;

/** 01：把一段人声从 30 秒一路放大到几毫秒，直到看清一个个数。 */
export default function ZoomLab() {
  const [clip, setClip] = useState<{ x: Float32Array; sr: number } | null>(null);
  const [err, setErr] = useState('');
  const [zoom, setZoom] = useState(0);            // 0 = 整段，1 = 最细
  const [center, setCenter] = useState(1.0012);   // 秒；默认落在正文那 8 个数附近
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let alive = true;
    loadMono('/audio/voice.wav')
      .then(({ x, sr }) => { if (alive) setClip({ x, sr }); })
      .catch(() => { if (alive) setErr('这段音频没能加载。'); });
    return () => { alive = false; stopRef.current?.(); };
  }, []);

  const dur = clip ? clip.x.length / clip.sr : MAX_WIN;
  const win = Math.min(dur, MAX_WIN * Math.pow(MIN_WIN / MAX_WIN, zoom));
  const c = Math.min(dur - win / 2, Math.max(win / 2, center));
  const t0 = c - win / 2;
  const nIn = clip ? Math.round(win * clip.sr) : 0;

  const play = () => {
    if (!clip) return;
    stopRef.current?.();
    // 看得见的窗口太短就听不出什么，至少放半秒
    const len = Math.max(win, 0.5), a = Math.max(0, c - len / 2);
    const i0 = Math.floor(a * clip.sr), i1 = Math.min(clip.x.length, Math.floor((a + len) * clip.sr));
    const y = clip.x.slice(i0, i1);
    const f = Math.min(Math.round(clip.sr * 0.01), Math.floor(y.length / 4));
    for (let i = 0; i < f; i++) { y[i] *= i / f; y[y.length - 1 - i] *= i / f; }
    setPlaying(true);
    stopRef.current = playSamples(y, clip.sr, () => setPlaying(false));
  };

  const fmtWin = win >= 1 ? `${win.toFixed(win >= 10 ? 0 : 1)} 秒` : `${(win * 1000).toFixed(win >= 0.01 ? 0 : 1)} 毫秒`;

  return (
    <Lab title="把一段人声放大，直到看清一个个数"
      hint="往右拖「放大」，窗口从整段 30 秒缩到不到 2 毫秒。在上面那条整段缩略图里点一下，换一个位置。放到最大时，每个圆点就是一个数，这就是程序拿到的全部。">
      <>
        <Slider label="放大" value={zoom} min={0} max={1} step={0.005} onChange={setZoom} fmt={() => `窗口 ${fmtWin}`} />
        <div className="lab-choice">
          <span className="lab-slider-label">听一听</span>
          <div role="group">
            <button type="button" aria-pressed={playing} disabled={!clip} onClick={play}>
              ▶ 播放{win < 0.5 ? '这里附近半秒' : '窗口里这一段'}
            </button>
          </div>
        </div>
      </>
      <>
        {err ? <p className="lab-readout">{err}</p> : null}
        <Canvas w={W} h={H} deps={[clip, win, c]}
          ariaLabel={`人声录音的一段波形，窗口宽 ${fmtWin}，里面有 ${nIn} 个数`}
          onPointer={(fx, fy) => {
            if (!clip) return;
            const frac = Math.min(1, Math.max(0, (fx * W - PL) / (W - PL - PR)));
            // 点在上面的缩略图里换位置；点在下面的大图里，以点到的地方为新中心
            if (fy * H < 56) setCenter(frac * dur);
            else setCenter(t0 + frac * win);
          }}
          draw={(g, w, h) => {
            const iw = w - PL - PR;
            g.font = '12px system-ui, sans-serif';
            if (!clip) { g.fillStyle = C.mute; g.textAlign = 'center'; g.fillText('加载中……', w / 2, h / 2); return; }
            const { x, sr } = clip;
            // 上：整段缩略图，标出当前窗口
            const ov = { y: 8, h: 40 };
            g.fillStyle = C.mute; g.textAlign = 'right'; g.textBaseline = 'middle';
            g.fillText('整段', PL - 8, ov.y + ov.h / 2);
            g.strokeStyle = 'rgba(0,114,189,.45)'; g.lineWidth = 1; g.beginPath();
            const per = x.length / iw;
            for (let px = 0; px < iw; px++) {
              let m = 0;
              for (let i = Math.floor(px * per); i < Math.floor((px + 1) * per); i += 8) m = Math.max(m, Math.abs(x[i]));
              g.moveTo(PL + px, ov.y + ov.h / 2 - m * ov.h * 0.8); g.lineTo(PL + px, ov.y + ov.h / 2 + m * ov.h * 0.8);
            }
            g.stroke();
            const wx = PL + (t0 / dur) * iw, ww = Math.max(2, (win / dur) * iw);
            g.fillStyle = 'rgba(217,83,25,.18)'; g.fillRect(wx, ov.y, ww, ov.h);
            g.strokeStyle = C.warm; g.lineWidth = 1.5; g.strokeRect(wx, ov.y, ww, ov.h);

            // 下：当前窗口
            const top = 64, ph = h - top - 30, mid = top + ph / 2;
            g.strokeStyle = C.grid; g.lineWidth = 1; g.strokeRect(PL, top, iw, ph);
            g.beginPath(); g.moveTo(PL, mid); g.lineTo(PL + iw, mid); g.stroke();
            const i0 = Math.max(0, Math.floor(t0 * sr)), i1 = Math.min(x.length, Math.ceil((t0 + win) * sr));
            let peak = 0.05; for (let i = i0; i < i1; i++) peak = Math.max(peak, Math.abs(x[i]));
            const Y = (v: number) => mid - (v / (peak * 1.15)) * (ph / 2);
            const X = (i: number) => PL + ((i / sr - t0) / win) * iw;
            g.fillStyle = C.mute; g.textAlign = 'right';
            g.fillText(`+${peak.toFixed(2)}`, PL - 6, Y(peak)); g.fillText('0', PL - 6, mid); g.fillText(`−${peak.toFixed(2)}`, PL - 6, Y(-peak));
            const n = i1 - i0;
            if (n > iw * 2) {
              // 数太多：每一列画这一列里的最大和最小
              g.strokeStyle = C.blue; g.beginPath();
              for (let px = 0; px < iw; px++) {
                const a = i0 + Math.floor((px / iw) * n), b = i0 + Math.floor(((px + 1) / iw) * n);
                let lo = 1, hi = -1;
                for (let i = a; i < Math.max(b, a + 1); i++) { lo = Math.min(lo, x[i]); hi = Math.max(hi, x[i]); }
                g.moveTo(PL + px, Y(hi)); g.lineTo(PL + px, Y(lo));
              }
              g.stroke();
            } else {
              g.strokeStyle = C.blue; g.lineWidth = n < 120 ? 1 : 1.5; g.beginPath();
              for (let i = i0; i < i1; i++) (i === i0 ? g.moveTo(X(i), Y(x[i])) : g.lineTo(X(i), Y(x[i])));
              g.stroke();
              if (n <= 160) {
                g.fillStyle = C.warm;
                for (let i = i0; i < i1; i++) { g.beginPath(); g.arc(X(i), Y(x[i]), n <= 60 ? 3.2 : 2.2, 0, Math.PI * 2); g.fill(); }
              }
              if (n <= 40) {
                g.fillStyle = C.ink; g.font = '11px system-ui, sans-serif'; g.textAlign = 'center';
                for (let i = i0; i < i1; i += n <= 20 ? 1 : 2) {
                  const up = x[i] >= 0;
                  g.textBaseline = up ? 'bottom' : 'top';
                  g.fillText(`${x[i] >= 0 ? '+' : '−'}${Math.abs(x[i]).toFixed(3)}`, X(i), Y(x[i]) + (up ? -6 : 6));
                }
              }
            }
            g.fillStyle = C.mute; g.font = '12px system-ui, sans-serif'; g.textBaseline = 'top';
            g.textAlign = 'left'; g.fillText(`${t0.toFixed(win < 0.1 ? 4 : 2)} 秒`, PL, top + ph + 6);
            g.textAlign = 'right'; g.fillText(`${(t0 + win).toFixed(win < 0.1 ? 4 : 2)} 秒`, PL + iw, top + ph + 6);
          }} />
        <p className="lab-readout">
          窗口 <b>{fmtWin}</b>，里面有 <b>{nIn.toLocaleString('zh-CN')}</b> 个数。
          {nIn > 2000 ? ' 这么多数挤在一起，看到的是一团起伏：声音的样子就藏在这团起伏里。' : null}
          {nIn <= 2000 && nIn > 160 ? ' 线开始变得光滑，能看出一段段重复的形状，这是人声在振动。' : null}
          {nIn <= 160 ? <> 每个圆点就是一个数，相邻两个隔 <b>{clip ? (1000 / clip.sr).toFixed(4) : '—'}</b> 毫秒。单看哪一个，都说明不了任何事。</> : null}
        </p>
      </>
    </Lab>
  );
}
