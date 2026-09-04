import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allLessons, lessonById, rawBody, readingMinutes, GROUP_TITLE } from '../../../lib/lessons';
import { renderLesson } from '../../../lib/markdown';
import { extractToc } from '../../../lib/toc';
import { WIDGETS } from '../../../content/widgets';
import Article from '../../../components/Article';
import Toc from '../../../components/Toc';
import ReadingProgress from '../../../components/ReadingProgress';
import LayoutSwitcher from '../../../components/LayoutSwitcher';

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
  const toc = extractToc(html);
  const all = allLessons();
  const i = all.findIndex((x) => x.id === l.id);
  const prev = all[i - 1], next = all[i + 1];
  const hasLab = (WIDGETS[l.id] ?? []).length > 0;

  return (
    <>
      <ReadingProgress />
      <div className="shell">
        <Toc items={toc} />
        <main>
          <nav className="crumb" aria-label="面包屑">
            <Link href="/">全部课程</Link>
            <span aria-hidden>/</span>
            <Link href={`/#g${l.group}`}>{GROUP_TITLE[l.group]}</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">第 {l.id} 讲</span>
          </nav>

          <article>
            <header className="art-head">
              <p className="art-meta">
                <span className="art-n">第 {l.id} 讲</span>
                <span>共 23 讲</span>
                <span>约 {readingMinutes(l)} 分钟</span>
                {hasLab ? <span className="art-chip">含交互实验</span> : null}
              </p>
              <h1>{l.title}</h1>
              {l.lead ? <p className="lead">{l.lead}</p> : null}
            </header>

            <Article html={html} />

            <nav className="pager" aria-label="上下讲">
              {prev ? (
                <Link href={`/lesson/${prev.id}`} className="pager-prev">
                  <span className="pager-dir">← 上一讲 · {prev.id}</span>
                  <span className="pager-title">{prev.title}</span>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/lesson/${next.id}`} className="pager-next">
                  <span className="pager-dir">下一讲 · {next.id} →</span>
                  <span className="pager-title">{next.title}</span>
                </Link>
              ) : <span />}
            </nav>
          </article>
        </main>
      </div>
      <LayoutSwitcher />
    </>
  );
}
