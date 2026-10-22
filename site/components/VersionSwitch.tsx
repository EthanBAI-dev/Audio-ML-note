import Link from 'next/link';

/** 原版和 v2 并排保留，页面顶部给一条切换栏，方便对比。 */
export default function VersionSwitch({ id, current, original, v2, compare }: {
  id: string; current: 'original' | 'v2'; original: string; v2: string; compare: string;
}) {
  return (
    <div className="version-switch" role="navigation" aria-label={`第 ${id} 课的两个版本`}>
      <span className="version-label">第 {id} 课有两个版本</span>
      <Link href={original} aria-current={current === 'original' ? 'page' : undefined}>原版</Link>
      <Link href={v2} aria-current={current === 'v2' ? 'page' : undefined}>v2 试行</Link>
      <a href={compare} target="_blank" rel="noopener">逐节对照 ↗</a>
    </div>
  );
}
