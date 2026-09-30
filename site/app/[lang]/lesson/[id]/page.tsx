import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { allLessons, lessonById, rawBody, readingMinutes } from '../../../../lib/lessons';
import { renderLesson } from '../../../../lib/markdown';
import { extractToc } from '../../../../lib/toc';
import { WIDGETS } from '../../../../content/widgets';
import { getT, pageMetadata } from '../../../../lib/locale';
import { HTML_LANG, NUMBER_LOCALE, localizeLinks } from '../../../../lib/i18n';
import { lessonText } from '../../../../lib/dictionaries/lessons';
import Article from '../../../../components/Article';
import Toc from '../../../../components/Toc';
import ReadingProgress from '../../../../components/ReadingProgress';
import Comments from '../../../../components/Comments';
import CourseCredit from '../../../../components/CourseCredit';
import ChineseOnly from '../../../../components/ChineseOnly';
import { viewsOf } from '../../../../lib/views';

export function generateStaticParams() {
  return allLessons().map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const l = lessonById(id);
  if (!l) return {};
  const { lang } = await getT();
  const text = lessonText(lang, l);
  return pageMetadata(`/lesson/${l.id}`, { title: text.title, description: text.lead });
}

/** 正文每次请求都一样，缓存渲染结果；评论和阅读次数才需要每次现取。 */
const rendered = new Map<string, Promise<string>>();

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const l = lessonById(id);
  if (!l) notFound();
  const { lang, t, to } = await getT();
  const lessonBody = rawBody(l);
  const key = l.id;
  if (process.env.NODE_ENV !== 'production' || !rendered.has(key)) {
    const job = renderLesson(lessonBody, l, WIDGETS[l.id] ?? []);
    job.catch(() => rendered.delete(key));
    rendered.set(key, job);
  }
  const html = localizeLinks(lang, await rendered.get(key)!);
  const toc = extractToc(html);
  const all = allLessons();
  const i = all.findIndex((x) => x.id === l.id);
  const prev = all[i - 1], next = all[i + 1];
  const hasLab = (WIDGETS[l.id] ?? []).length > 0;
  const views = await viewsOf(`/lesson/${l.id}`);
  const text = lessonText(lang, l);
  const prevText = prev && lessonText(lang, prev), nextText = next && lessonText(lang, next);

  return (
    <>
      <ReadingProgress />
      <div className="shell">
        <Toc items={toc} labels={{ aria: t.ui.tocAria, title: t.ui.tocTitle, collapse: t.ui.collapse, expand: t.ui.expand }} />
        <main>
          <nav className="crumb" aria-label={t.ui.breadcrumb}>
            <Link href={to('/courses/audio-ml')}>{t.course.short}</Link>
            <span aria-hidden>/</span>
            <Link href={to(`/courses/audio-ml#g${l.group}`)}>{t.course.groups[l.group]}</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{t.lesson.n(l.id)}</span>
          </nav>

          <ChineseOnly />

          <article lang="zh-CN">
            {/* 正文是中文；日文、英文页面的课名和导读已经翻译，标回页面语言 */}
            <header className="art-head" lang={lang === 'zh' ? undefined : HTML_LANG[lang]}>
              <p className="art-meta">
                <span className="art-n">{t.lesson.n(l.id)}</span>
                <span>{t.lesson.total}</span>
                <span>{t.lesson.minutes(readingMinutes(l))}</span>
                {views ? <span>{t.lesson.views(views.toLocaleString(NUMBER_LOCALE[lang]))}</span> : null}
                {hasLab ? <span className="art-chip">{t.course.hasLab}</span> : null}
              </p>
              <h1 lang={text.lang}>{text.title}</h1>
              {text.lead ? <p className="lead" lang={text.lang}>{text.lead}</p> : null}
            </header>

            <Article html={html} />

          </article>

          <CourseCredit compact />

          <Comments page={`lesson/${l.id}`} />

          <nav className={`pager${prev && next ? '' : ' single'}`} aria-label={t.lesson.pagerAria}>
            {prev ? (
              <Link href={to(`/lesson/${prev.id}`)} className="pager-prev">
                <span className="pager-dir">← {t.lesson.prev} · {prev.id}</span>
                <span className="pager-title" lang={prevText.lang}>{prevText.title}</span>
              </Link>
            ) : null}
            {next ? (
              <Link href={to(`/lesson/${next.id}`)} className="pager-next">
                <span className="pager-dir">{t.lesson.next} · {next.id} →</span>
                <span className="pager-title" lang={nextText.lang}>{nextText.title}</span>
              </Link>
            ) : null}
          </nav>
        </main>
      </div>
    </>
  );
}
