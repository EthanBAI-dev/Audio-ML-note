'use client';
import { useEffect, useRef, useState } from 'react';
import { Lab, Choice, Canvas, C } from './lab';
import { audioContext, loadMono, timeFeatures } from '../lib/audio';

const CLIPS = { 语音: 'voice', 噪声: 'noise', 音阶: 'scale' } as const;
type Clip = keyof typeof CLIPS;
const K = 1024, H = 512;

type Track = { x: Float32Array; sr: number; buffer: AudioBuffer; ae: Float32Array; rms: Float32Array; zcr: Float32Array };

/** 09：一边播放真实录音，一边看三条逐帧曲线跟着走。 */
export default function FeatureTrackLab() {
  const [clip, setClip] = useState<Clip>('语音');
  const [track, setTrack] = useState<Track | null>(null);
  const [err, setErr] = useState('');
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);                 // 当前秒数
  const src = useRef<AudioBufferSourceNode | null>(null);
  const t0 = useRef(0), off = useRef(0), raf = useRef(0);

  const stop = () => {
    cancelAnimationFrame(raf.current);
    if (src.current) { src.current.onended = null; try { src.current.stop(); } catch { /* 已停 */ } }
    src.current = null; setPlaying(false);
  };

  useEffect(() => {
    let alive = true;
    stop(); setTrack(null); setErr(''); setT(0); off.current = 0;
    loadMono(`/audio/${CLIPS[clip]}.wav`)
      .then(({ x, sr, buffer }) => { if (alive) setTrack({ x, sr, buffer, ...timeFeatures(x, K, H) }); })
      .catch(() => { if (alive) setErr('这段音频没能加载。'); });
    return () => { alive = false; stop(); };
  }, [clip]);

  const play = (from = off.current) => {
    if (!track) return;
    stop();
    const ac = audioContext(); void ac.resume();
    const s = ac.createBufferSource();
    s.buffer = track.buffer; s.connect(ac.destination);
    const start = Math.min(from, track.buffer.duration - 0.05);
    s.start(0, Math.max(0, start));
    t0.current = ac.currentTime - start; src.current = s; setPlaying(true);
    s.onended = () => { cancelAnimationFrame(raf.current); src.current = null; setPlaying(false); off.current = 0; setT(0); };
    const tick = () => { setT(ac.currentTime - t0.current); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
  };
  const toggle = () => { if (playing) { off.current = t; stop(); } else play(); };

  const dur = track ? track.x.length / track.sr : 1;
  const frameAt = track ? Math.min(track.rms.length - 1, Math.max(0, Math.floor((t * track.sr - K / 2) / H))) : 0;

  return (
    <Lab title="边听边看：三条曲线怎样跟着声音走"
      hint="点播放，竖线跟着声音往前走。听语音时留意那几下「嘶」的辅音：绿色的过零率会突然窜高，元音那几段却低而平。在图上点一下可以跳到那个位置。">
      <>
        <Choice label="录音" value={clip} options={Object.keys(CLIPS) as Clip[]} onChange={setClip} />
        <div className="lab-choice">
          <span className="lab-slider-label">声音</span>
          <div role="group">
            <button type="button" aria-pressed={playing} disabled={!track} onClick={toggle}>{playing ? '暂停' : '▶ 播放'}</button>
          </div>
        </div>
      </>
      <>
        {err ? <p className="lab-readout">{err}</p> : null}
        <Canvas w={840} h={300} deps={[track, t]} ariaLabel="录音波形与逐帧的振幅包络、均方根、过零率，竖线标出正在播放的位置"
          onPointer={(fx) => {
            if (!track) return;
            const pl = 52, pr = 12, frac = Math.min(1, Math.max(0, (fx * 840 - pl) / (840 - pl - pr)));
            off.current = frac * dur; setT(off.current);
            if (playing) play(off.current);
          }}
          draw={(g, w, h) => {
            const pl = 52, pr = 12, iw = w - pl - pr;
            const top = { y: 10, h: 150 }, bot = { y: 190, h: 80 };
            g.font = '12px system-ui, sans-serif';
            g.strokeStyle = C.grid; g.lineWidth = 1;
            g.strokeRect(pl, top.y, iw, top.h); g.strokeRect(pl, bot.y, iw, bot.h);
            g.fillStyle = C.mute; g.textAlign = 'right'; g.textBaseline = 'middle';
            g.fillText('振幅', pl - 8, top.y + top.h / 2); g.fillText('过零率', pl - 8, bot.y + bot.h / 2);
            if (!track) { g.textAlign = 'center'; g.fillText('加载中……', pl + iw / 2, top.y + top.h / 2); return; }
            const n = track.rms.length, X = (i: number) => pl + (i / Math.max(1, n - 1)) * iw;
            let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, track.ae[i]);
            const Yt = (v: number) => top.y + top.h - (v / (peak * 1.05)) * top.h;
            // 波形：每帧画一根从 -AE 到 +AE 的淡色竖线，读者一眼看出哪里响
            g.strokeStyle = 'rgba(0,114,189,.22)';
            const mid = top.y + top.h;
            for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(X(i), mid); g.lineTo(X(i), Yt(track.ae[i])); g.stroke(); }
            const line = (arr: Float32Array, Y: (v: number) => number, c: string, lw: number) => {
              g.strokeStyle = c; g.lineWidth = lw; g.beginPath();
              for (let i = 0; i < n; i++) (i ? g.lineTo(X(i), Y(arr[i])) : g.moveTo(X(i), Y(arr[i])));
              g.stroke();
            };
            line(track.ae, Yt, C.warm, 1.2);
            line(track.rms, Yt, C.gold, 1.8);
            let zmax = 0; for (let i = 0; i < n; i++) zmax = Math.max(zmax, track.zcr[i]);
            const zTop = Math.max(0.1, zmax * 1.1);
            line(track.zcr, (v) => bot.y + bot.h - (v / zTop) * bot.h, C.green, 1.4);
            // 图例
            g.textAlign = 'left'; g.textBaseline = 'top';
            [['振幅包络', C.warm], ['均方根', C.gold], ['过零率（下格）', C.green]].forEach(([s, c], k) => {
              g.fillStyle = c; g.fillRect(pl + 8 + k * 120, top.y + 8, 10, 10);
              g.fillStyle = C.ink; g.fillText(s, pl + 22 + k * 120, top.y + 6);
            });
            // 时间刻度
            g.fillStyle = C.mute; g.textAlign = 'center';
            for (let s = 0; s <= dur; s += dur > 20 ? 5 : 1) g.fillText(`${s}s`, pl + (s / dur) * iw, bot.y + bot.h + 6);
            // 播放竖线
            const px = pl + (t / dur) * iw;
            g.strokeStyle = C.ink; g.lineWidth = 1.5; g.beginPath(); g.moveTo(px, top.y); g.lineTo(px, bot.y + bot.h); g.stroke();
          }} />
        {track ? (
          <p className="lab-readout">
            第 <b>{t.toFixed(1)}</b> 秒这一帧（{K} 个样本，{((K / track.sr) * 1000).toFixed(1)} 毫秒）：
            振幅包络 <b>{track.ae[frameAt].toFixed(3)}</b>，均方根 <b>{track.rms[frameAt].toFixed(3)}</b>，
            过零率 <b>{track.zcr[frameAt].toFixed(3)}</b>。
            {clip === '噪声' ? ' 噪声的过零率一直高、一直平：它每一帧都在乱跳。' : null}
            {clip === '音阶' ? ' 音阶一个音比一个高，过零率却没有一级一级往上走：真实乐器的声音里不止一个频率，过零次数不再老实跟着音高走。对比上面那个纯正弦的实验。' : null}
          </p>
        ) : null}
      </>
    </Lab>
  );
}
