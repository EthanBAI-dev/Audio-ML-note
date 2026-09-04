'use client';
import { useCallback } from 'react';
import { Lab, AnimCanvas, C } from './lab';

/** 11：一个复数怎样同时装下「有多强」和「从哪里起步」。 */
export default function PhasorAnim() {
  const draw = useCallback((g: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const R = Math.min(h * 0.38, 110);
    const cx = R + 30, cy = h / 2;
    const amp = 0.85, phase = Math.PI / 4;           // 模与初相
    const ang = phase + t * Math.PI * 2;

    // 左：单位圆与旋转的向量
    g.strokeStyle = C.grid; g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cy, R * amp, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(cx - R - 8, cy); g.lineTo(cx + R + 8, cy);
    g.moveTo(cx, cy - R - 8); g.lineTo(cx, cy + R + 8); g.stroke();

    const px = cx + Math.cos(ang) * R * amp, py = cy - Math.sin(ang) * R * amp;
    // 初相
    g.strokeStyle = C.mute; g.setLineDash([3, 3]); g.beginPath();
    g.moveTo(cx, cy); g.lineTo(cx + Math.cos(phase) * R * amp, cy - Math.sin(phase) * R * amp);
    g.stroke(); g.setLineDash([]);
    // 当前向量
    g.strokeStyle = C.warm; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(px, py); g.stroke();
    g.fillStyle = C.warm; g.beginPath(); g.arc(px, py, 4.5, 0, Math.PI * 2); g.fill();
    // 投影到纵轴
    g.strokeStyle = C.blue; g.setLineDash([2, 3]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(px, py); g.lineTo(cx + R + 22, py); g.stroke(); g.setLineDash([]);

    g.fillStyle = C.mute; g.font = '12px system-ui'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillText('模 = 有多强', cx, cy + R + 12);
    g.textAlign = 'left';
    g.fillText('初相 = 从哪里起步', cx + 6, cy - R - 24);

    // 右：投影随时间画出的正弦
    const x0 = cx + R + 30, iw = w - x0 - 14;
    g.strokeStyle = C.grid; g.beginPath(); g.moveTo(x0, cy); g.lineTo(x0 + iw, cy); g.stroke();
    g.strokeStyle = C.blue; g.lineWidth = 1.8; g.beginPath();
    const span = Math.PI * 4;
    for (let i = 0; i <= 300; i++) {
      const a = ang - (i / 300) * span;
      const x = x0 + (i / 300) * iw, y = cy - Math.sin(a) * R * amp;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    g.fillStyle = C.blue; g.beginPath(); g.arc(x0, cy - Math.sin(ang) * R * amp, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.mute; g.textAlign = 'right'; g.textBaseline = 'bottom';
    g.font = '12px system-ui';
    g.fillText('← 早一点的时间', x0 + iw, cy + R + 14);
  }, []);

  return (
    <Lab title="转起来的那个点，投影出来就是一条正弦"
      hint="左边这根箭头绕着圆转。它有多长，决定声音有多强；它从哪个角度起步，决定这条波从哪里开始——两件事装在同一个数里。">
      <></>
      <AnimCanvas w={840} h={280} duration={6000} caption="蓝点是箭头在纵轴上的投影"
        ariaLabel="复数向量绕原点旋转，其纵轴投影画出一条正弦曲线" draw={draw} />
    </Lab>
  );
}
