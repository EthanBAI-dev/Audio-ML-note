'use client';
import dynamic from 'next/dynamic';
import type { WidgetName } from '../content/widgets';

const map = {
  framing: dynamic(() => import('./FramingLab'), { ssr: false, loading: () => <LabSkeleton /> }),
  spectrum: dynamic(() => import('./SpectrumLab'), { ssr: false, loading: () => <LabSkeleton /> }),
  mel: dynamic(() => import('./MelLab'), { ssr: false, loading: () => <LabSkeleton /> }),
  bandsplit: dynamic(() => import('./BandSplitLab'), { ssr: false, loading: () => <LabSkeleton /> }),
  sliding: dynamic(() => import('./SlidingWindowAnim'), { ssr: false, loading: () => <LabSkeleton /> }),
  probe: dynamic(() => import('./ProbeSweepAnim'), { ssr: false, loading: () => <LabSkeleton /> }),
  phasor: dynamic(() => import('./PhasorAnim'), { ssr: false, loading: () => <LabSkeleton /> }),
  tone: dynamic(() => import('./ToneLab'), { ssr: false, loading: () => <LabSkeleton /> }),
} as const;

function LabSkeleton() {
  return <div className="lab lab-skeleton">交互程序加载中……</div>;
}

export default function Widget({ name }: { name: WidgetName }) {
  const Cmp = map[name];
  return Cmp ? <Cmp /> : null;
}
