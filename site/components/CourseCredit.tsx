import { getT } from '../lib/locale';
import { rich } from '../lib/rich';

/** 课程来源说明。课程页、导览页和每一讲末尾都放同一段，措辞只在词典的 credit 里改。 */
export default async function CourseCredit({ compact = false }: { compact?: boolean }) {
  const { t: { credit: t } } = await getT();
  return (
    <aside className={`course-credit${compact ? ' is-compact' : ''}`} aria-label={t.eyebrow}>
      <p className="eyebrow">{t.eyebrow}</p>
      <p>{rich(t.body, {
        author: <b>Valerio Velardo</b>,
        course: <a href="https://www.youtube.com/playlist?list=PL-wATfeyAMNqIee7cH3q1bh4QJFAaeNv0" rel="noopener" target="_blank">Audio Signal Processing for Machine Learning</a>,
        repo: <a href="https://github.com/musikalkemist/AudioSignalProcessingForML" rel="noopener" target="_blank">musikalkemist/AudioSignalProcessingForML</a>,
      })}</p>
      {compact ? null : <p>{t.thanks}</p>}
    </aside>
  );
}
