'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lab, Choice, Canvas, C } from './lab';
import { playSamples } from '../lib/audio';

const SR = 22050, F0 = 261.6, SEC = 1.6;
// 前 6 个整数倍上的强度，相对基频；三件乐器的数来自 lesson03_loudness.py 的实测
const PROFILES = {
  小提琴: [1.0, 2.732, 0.293, 0.106, 0.232, 0.264],
  萨克斯: [1.0, 1.803, 0.422, 0.455, 0.361, 0.137],
  钢琴: [1.0, 0.431, 0.084, 0.076, 0.013, 0.003],
  只有基频: [1, 0, 0, 0, 0, 0],
} as const;
const ENVS = ['拉出来：慢慢起', '吹出来：一下到顶再保持', '敲出来：一下到顶再衰减'] as const;
const MODS = ['不抖', '揉弦：音高抖', '颤音：强弱抖'] as const;
type P = keyof typeof PROFILES; type E = (typeof ENVS)[number]; type M = (typeof MODS)[number];

/** 包络形状只取三件乐器的大轮廓：小提琴约一半处最响，萨克斯和钢琴几十毫秒就到顶。 */
function envAt(t: number, e: E): number {
  const r = Math.min(1, (SEC - t) / 0.08);             // 结尾统一 80 毫秒收掉
  if (e === '拉出来：慢慢起') return Math.min(1, t / (SEC * 0.55)) * r;
  if (e === '吹出来：一下到顶再保持') return Math.min(1, t / 0.05) * (t < 0.05 ? 1 : 0.85 + 0.15 * Math.exp(-(t - 0.05) / 0.1)) * r;
  return Math.min(1, t / 0.008) * Math.exp(-Math.max(0, t - 0.008) / 0.45) * r;
}

function synth(p: P, e: E, m: M) {
  const n = Math.round(SR * SEC), y = new Float32Array(n), env = new Float32Array(n);
  const amps = PROFILES[p];
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // 揉弦：每秒 5.5 次，上下各 30 音分；颤音：每秒 4 次，最低压到两成
    const f = m === '揉弦：音高抖' ? F0 * Math.pow(2, (30 / 1200) * Math.sin(2 * Math.PI * 5.5 * t)) : F0;
    phase += (2 * Math.PI * f) / SR;
    let v = 0;
    for (let k = 0; k < amps.length; k++) v += amps[k] * Math.sin((k + 1) * phase);
    const trem = m === '颤音：强弱抖' ? 0.6 + 0.4 * Math.sin(2 * Math.PI * 4 * t) : 1;
    env[i] = envAt(t, e) * trem;
    y[i] = v * env[i];
  }
  let peak = 1e-9; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(y[i]));
  for (let i = 0; i < n; i++) y[i] *= 0.4 / peak;
  return { y, env };
}

/** 03：用实测的泛音比例和包络轮廓拼一个音，三样东西一样一样换着听。 */
export default function TimbreLab() {
  const [prof, setProf] = useState<P>('小提琴');
  const [env, setEnv] = useState<E>('拉出来：慢慢起');
  const [mod, setMod] = useState<M>('不抖');
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => () => stopRef.current?.(), []);
  const s = useMemo(() => synth(prof, env, mod), [prof, env, mod]);

  const play = () => {
    stopRef.current?.();
    setPlaying(true);
    stopRef.current = playSamples(s.y, SR, () => setPlaying(false));
  };

  return (
    <Lab title="拼一个音色：泛音、包络、调制，一样一样换"
      hint="音高固定在 C4。先只换「泛音」，听同一个音怎样变亮、变闷；再只换「包络」，泛音不动，听它像拉的、吹的还是敲的；最后加一点揉弦或颤音。每改一样都点一次播放。">
      <>
        <Choice label="泛音" value={prof} options={Object.keys(PROFILES) as P[]} onChange={setProf} />
        <Choice label="包络" value={env} options={ENVS} onChange={setEnv} />
        <Choice label="调制" value={mod} options={MODS} onChange={setMod} />
        <div className="lab-choice">
          <span className="lab-slider-label">听一听</span>
          <div role="group">
            <button type="button" aria-pressed={playing} onClick={play}>▶ 播放 {SEC} 秒</button>
          </div>
        </div>
      </>
      <>
        <Canvas w={840} h={250} deps={[s, prof]} ariaLabel={`泛音比例为${prof}、包络为${env}、调制为${mod}的合成音`}
          draw={(g, w, h) => {
            g.font = '12px system-ui, sans-serif';
            // 左：泛音竖线
            const L = { x: 48, y: 22, w: 220, h: h - 64 };
            const amps = PROFILES[prof], top = Math.max(...amps);
            g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('泛音（第几倍）', L.x, 14);
            g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(L.x, L.y + L.h); g.lineTo(L.x + L.w, L.y + L.h); g.stroke();
            amps.forEach((a, k) => {
              const x = L.x + 18 + k * (L.w - 36) / 5, bh = (a / top) * L.h * 0.86;
              g.fillStyle = k === 0 ? C.blue : C.warm; g.fillRect(x - 7, L.y + L.h - bh, 14, bh);
              g.fillStyle = C.mute; g.textAlign = 'center'; g.textBaseline = 'top';
              g.fillText(String(k + 1), x, L.y + L.h + 6);
              g.textBaseline = 'bottom'; g.fillText(a.toFixed(2), x, L.y + L.h - bh - 2);
            });
            // 右上：整段包络
            const R = { x: 320, y: 22, w: w - 332, h: 100 };
            g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(`包络（${SEC} 秒）`, R.x, 14);
            g.strokeStyle = C.grid; g.strokeRect(R.x, R.y, R.w, R.h);
            g.fillStyle = 'rgba(0,114,189,.25)'; g.strokeStyle = C.blue; g.lineWidth = 1.5; g.beginPath(); g.moveTo(R.x, R.y + R.h);
            const n = s.env.length;
            for (let px = 0; px <= R.w; px++) g.lineTo(R.x + px, R.y + R.h - s.env[Math.min(n - 1, Math.floor((px / R.w) * n))] * R.h * 0.95);
            g.lineTo(R.x + R.w, R.y + R.h); g.closePath(); g.fill(); g.stroke();
            // 右下：稳定段里的三个周期，看泛音怎样改变波形的样子
            const B = { x: 320, y: 150, w: w - 332, h: h - 172 };
            g.fillStyle = C.ink; g.fillText('稳定段里的 3 个周期', B.x, B.y - 8);
            g.strokeStyle = C.grid; g.lineWidth = 1; g.beginPath(); g.moveTo(B.x, B.y + B.h / 2); g.lineTo(B.x + B.w, B.y + B.h / 2); g.stroke();
            const per = SR / F0, i0 = Math.round(SR * 0.7), cnt = Math.round(per * 3);
            let pk = 1e-9; for (let i = 0; i < cnt; i++) pk = Math.max(pk, Math.abs(s.y[i0 + i]));
            g.strokeStyle = C.warm; g.lineWidth = 1.8; g.beginPath();
            for (let i = 0; i < cnt; i++) {
              const X = B.x + (i / (cnt - 1)) * B.w, Y = B.y + B.h / 2 - (s.y[i0 + i] / pk) * (B.h / 2) * 0.9;
              (i ? g.lineTo(X, Y) : g.moveTo(X, Y));
            }
            g.stroke();
          }} />
        <p className="lab-readout">
          {prof === '只有基频' ? '只有基频时是一条纯正弦，干净但单薄，听不出是什么乐器。' : <>{prof}的第 2 倍是基频的 <b>{PROFILES[prof][1].toFixed(2)}</b> 倍。看右下角：泛音比例一换，一个周期里的形状就变了，高低（周期长短）却没变。</>}
          {' '}包络只管强弱怎样随时间走；它和泛音互不影响，所以能拆开来换。
          {mod !== '不抖' ? ' 调制让声音自己有规律地抖，平均的高低和响度都没变，变的只是音色。' : null}
          {' '}这是简化的拼法，真实乐器的泛音比例还会随时间变，所以听着仍然比录音「假」。
        </p>
      </>
    </Lab>
  );
}
