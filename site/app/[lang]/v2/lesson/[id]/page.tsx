import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allLessons, readingMinutes, v2LessonById, v2Lessons, v2RawBody, V2_COMPARE, REPO_BLOB } from '../../../../../lib/lessons';
import { renderLesson } from '../../../../../lib/markdown';
import { splitQuiz } from '../../../../../lib/quiz';
import { extractToc } from '../../../../../lib/toc';
import { WIDGETS_V2 } from '../../../../../content/widgets';
import { getT, pageMetadata } from '../../../../../lib/locale';
import { localizeLinks } from '../../../../../lib/i18n';
import Article from '../../../../../components/Article';
import Toc from '../../../../../components/Toc';
import ReadingProgress from '../../../../../components/ReadingProgress';
import CourseCredit from '../../../../../components/CourseCredit';
import ChineseOnly from '../../../../../components/ChineseOnly';
import VersionSwitch from '../../../../../components/VersionSwitch';
import Quiz from '../../../../../components/Quiz';


export function generateStaticParams() {
  return v2Lessons().map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const l = v2LessonById(id);
  if (!l) return {};
  return pageMetadata(`/v2/lesson/${l.id}`, { title: `${l.title}（v2）`, description: l.lead });
}

export default async function V2LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = v2LessonById(id);
  if (!l) notFound();
  const { lang, t, to } = await getT();
  // 练习目录在站点里没有页面，直接指到 GitHub
  const raw = v2RawBody(l).replace(/\]\(\.\.\/练习\/([^)]*)\)/g,
    (_m, p) => `](${REPO_BLOB.replace('/blob/', '/tree/')}/${encodeURI(`音频信号处理二十三讲-v2/练习/${p}`)})`);
  const { body, quiz } = splitQuiz(raw);
  const html = localizeLinks(lang, await renderLesson(body, l, WIDGETS_V2[l.id] ?? []));
  const toc = extractToc(html);
  if (quiz.length) {
    const i = toc.findIndex((x) => x.text === '下一课');
    toc.splice(i < 0 ? toc.length : i, 0, { id: 'quiz-title', text: '✅ 小测验' });
  }
  const original = allLessons().find((x) => x.id === l.id);
  const cut = html.search(/<h2[^>]*>下一课<\/h2>/);
  const before = cut < 0 ? html : html.slice(0, cut), after = cut < 0 ? '' : html.slice(cut);

  return (
    <>
      <ReadingProgress />
      <div className="shell">
        <Toc items={toc} labels={{ aria: t.ui.tocAria, title: t.ui.tocTitle, collapse: t.ui.collapse, expand: t.ui.expand }} />
        <main>
          <nav className="crumb" aria-label={t.ui.breadcrumb}>
            <Link href={to('/courses/audio-ml')}>{t.course.short}</Link>
            <span aria-hidden>/</span>
            <span aria-current="page">{t.lesson.n(l.id)} · v2</span>
          </nav>

          <ChineseOnly />

          {original ? (
            <VersionSwitch id={l.id} current="v2" original={to(`/lesson/${l.id}`)} v2={to(`/v2/lesson/${l.id}`)}
              compare={V2_COMPARE(l.id)} />
          ) : null}

          <article lang="zh-CN">
            <header className="art-head">
              <p className="art-meta">
                <span className="art-n">{t.lesson.n(l.id)}</span>
                <span>v2 试行</span>
                <span>{t.lesson.minutes(readingMinutes(l))}</span>
                {(WIDGETS_V2[l.id] ?? []).length ? <span className="art-chip">{t.course.hasLab}</span> : null}
                <Link className="art-chip" href={to('/v2/glossary')}>术语表</Link>
              </p>
              <h1>{l.title}</h1>
            </header>

            {/* 小测验放在「下一课」之前；没有这一节时放到文末 */}
            <Article html={before} />
            {quiz.length ? <Quiz questions={quiz} /> : null}
            {after ? <Article html={after} /> : null}
          </article>

          <CourseCredit compact />
        </main>
      </div>
    </>
  );
}
