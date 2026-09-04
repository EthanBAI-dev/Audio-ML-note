import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allLessons, lessonById, rawBody } from '../../../lib/lessons';
import { renderLesson } from '../../../lib/markdown';
import { WIDGETS } from '../../../content/widgets';
import Article from '../../../components/Article';
import SideNav from '../../../components/SideNav';
import { Masthead } from '../../layout';

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
  const html = await renderLesson(rawBody(l), l, WIDGETS[l.id] ?? []);
  const all = allLessons();
  const i = all.findIndex((x) => x.id === l.id);
  const prev = all[i - 1], next = all[i + 1];
  return (
    <>
      <Masthead eyebrow={<>第 {l.id} 讲 / 共 23 讲</>} title={l.title} lead={l.lead} />
      <div className="shell">
        <SideNav items={all.map((x) => ({ id: x.id, title: x.title }))} />
        <main>
          <article>
            <Article html={html} />
            <nav className="pager">
              {prev ? <Link href={`/lesson/${prev.id}`}>← {prev.id}　{prev.title}</Link> : <span />}
              {next ? <Link href={`/lesson/${next.id}`}>{next.id}　{next.title} →</Link> : <span />}
            </nav>
          </article>
        </main>
      </div>
    </>
  );
}
