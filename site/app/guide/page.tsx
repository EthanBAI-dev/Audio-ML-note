import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COURSE } from '../../lib/lessons';
import { renderLesson } from '../../lib/markdown';
import Article from '../../components/Article';

export const metadata = { title: '课程总纲' };

export default async function Guide() {
  const raw = readFileSync(join(COURSE, '课程总纲', 'README.md'), 'utf8');
  const html = await renderLesson(raw, { group: '01-05' } as never);
  return <article className="lesson"><Article html={html} /></article>;
}
