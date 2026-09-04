import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COURSE } from '../../lib/lessons';
import { renderLesson } from '../../lib/markdown';
import Article from '../../components/Article';
import { Masthead } from '../layout';

export const metadata = { title: '课程总纲' };

export default async function Page() {
  const raw = readFileSync(join(COURSE, '课程总纲', 'README.md'), 'utf8');
  const html = await renderLesson(raw.replace(/^#\s+.+$/m, ''), { group: '01-05' } as never);
  return (
    <>
      <Masthead eyebrow="AUDIO SIGNAL PROCESSING · 23 讲" title="课程总纲" />
      <div className="shell wide">
        <main><article><Article html={html} /></article></main>
      </div>
    </>
  );
}
