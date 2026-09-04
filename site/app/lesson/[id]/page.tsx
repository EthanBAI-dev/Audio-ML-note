import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allLessons, lessonById, rawBody } from '../../../lib/lessons';
import { renderLesson } from '../../../lib/markdown';
import { WIDGETS } from '../../../content/widgets';
import Article from '../../../components/Article';

export function generateStaticParams() {
  return allLessons().map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = lessonById(id);
  return l ? { title: l.title, description: l.lead } : {};
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = lessonById(id);
  if (!l) notFound();
  const placements = WIDGETS[l.id] ?? [];
  const html = await renderLesson(rawBody(l), l, placements);
  const all = allLessons();
  const i = all.findIndex((x) => x.id === l.id);
  const prev = all[i - 1], next = all[i + 1];
  return (
    <article className="lesson">
      <p className="crumb"><Link href="/">目录</Link> · 第 {l.id} 课</p>
      <h1>{l.title}</h1>
      {l.lead ? <p className="lead">{l.lead}</p> : null}
      <Article html={html} />
      <nav className="pager">
        {prev ? <Link href={`/lesson/${prev.id}`}>← 第 {prev.id} 课 {prev.title}</Link> : <span />}
        {next ? <Link href={`/lesson/${next.id}`}>第 {next.id} 课 {next.title} →</Link> : <span />}
      </nav>
    </article>
  );
}
