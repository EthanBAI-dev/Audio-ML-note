import type { Metadata } from 'next';
import Link from 'next/link';
import { groups } from '../../lib/lessons';

export const metadata: Metadata = { title: '学习路线', description: '音频信号处理课程的五阶段学习路线。' };

export default function RoadmapPage() {
  const stages = groups();
  return <div className="shell home roadmap-shell"><main>
    <header className="directory-hero"><p className="eyebrow">ROADMAP</p><h1>从听见声音，到读懂频谱</h1><p>五个阶段、23 个学习节点。第一次学习按顺序前进；复习时可以直接进入任何阶段。</p></header>
    <div className="roadmap-line">{stages.map((stage, index) => <section className="roadmap-stage" key={stage.group}>
      <span className="roadmap-node">{String(index + 1).padStart(2, '0')}</span>
      <div><p className="eyebrow">第 {stage.group.replace('-', '—')} 讲</p><h2>{stage.title}</h2><p>{stage.lessons.length} 个学习节点</p>
        <div className="roadmap-lessons">{stage.lessons.map((lesson) => <Link href={`/lesson/${lesson.id}`} key={lesson.id}><b>{lesson.id}</b>{lesson.title}</Link>)}</div>
      </div>
    </section>)}</div>
  </main></div>;
}
