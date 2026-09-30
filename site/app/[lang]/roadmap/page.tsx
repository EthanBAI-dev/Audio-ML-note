import type { Metadata } from 'next';
import Link from 'next/link';
import { groups } from '../../../lib/lessons';
import { getT, pageMetadata } from '../../../lib/locale';
import { lessonText } from '../../../lib/dictionaries/lessons';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return pageMetadata('/roadmap', { title: t.roadmap.title, description: t.roadmap.metaDescription });
}

export default async function RoadmapPage() {
  const { lang, t: dict, to } = await getT();
  const t = dict.roadmap;
  const stages = groups();
  return <div className="shell home roadmap-shell"><main>
    <header className="directory-hero"><p className="eyebrow">ROADMAP</p><h1>{t.heading}</h1><p>{t.lead}</p></header>
    <div className="roadmap-line">{stages.map((stage, index) => <section className="roadmap-stage" key={stage.group}>
      <span className="roadmap-node">{String(index + 1).padStart(2, '0')}</span>
      <div><p className="eyebrow">{t.range(stage.group.replace('-', '—'))}</p><h2>{dict.course.groups[stage.group] ?? stage.title}</h2><p>{t.nodes(stage.lessons.length)}</p>
        <div className="roadmap-lessons">{stage.lessons.map((lesson) => { const text = lessonText(lang, lesson); return <Link href={to(`/lesson/${lesson.id}`)} key={lesson.id}><b>{lesson.id}</b><span lang={text.lang}>{text.title}</span></Link>; })}</div>
      </div>
    </section>)}</div>
  </main></div>;
}
