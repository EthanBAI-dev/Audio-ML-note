import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import type { Lesson } from './lessons';

const REPO = 'https://github.com/EthanBAI-dev/Audio-ML-note/blob/main';

// 自制或无版权疑虑的素材可以直接内嵌播放；三段商业录音只给外链。
export const SELF_MADE = new Set(['scale', 'noise', 'piano_c', 'violin_c', 'sax', 'tremolo', 'voice']);
export const EXTERNAL: Record<string, { label: string; url: string }> = {
  debussy: { label: '德彪西《月光》', url: 'https://www.youtube.com/results?search_query=debussy+clair+de+lune' },
  redhot: { label: 'Red Hot Chili Peppers', url: 'https://www.youtube.com/results?search_query=red+hot+chili+peppers' },
  duke: { label: 'Duke Ellington', url: 'https://www.youtube.com/results?search_query=duke+ellington' },
};

/** 把课程目录里的相对路径改写成站点 URL。 */
function rewritePaths(md: string, group: string): string {
  // 配图：本组 figures/... 与跨组 ../第GG课/figures/...
  md = md.replace(/(["(])\.\.\/第(\d\d-\d\d)课\/figures\//g, (_m, q, g) => `${q}/figures/${g}/`);
  md = md.replace(/(["(])figures\//g, (_m, q) => `${q}/figures/${group}/`);

  // 音频：自制的内嵌播放，商业录音换成外链
  md = md.replace(/\[([^\]]*)\]\((?:\.\.\/)*source_course\/audio_resources\/([a-z_]+)\.wav\)/g,
    (_m, label, name) => {
      if (SELF_MADE.has(name)) return `<audio controls preload="none" src="/audio/${name}.wav" data-label="${label}"></audio>`;
      const e = EXTERNAL[name];
      return e ? `[${label}](${e.url})` : label;
    });

  // 课程内互链
  md = md.replace(/\]\((?:\.\.\/第\d\d-\d\d课\/)?(\d\d)-[^)]*\.md\)/g, (_m, n) => `](/lesson/${n})`);
  md = md.replace(/\]\(\.\.\/课程总纲\/README\.md\)/g, '](/guide)');
  md = md.replace(/\]\(\.\.\/课程项目\/README\.md\)/g, '](/project)');
  md = md.replace(/\]\(\.\.\/课程代码\/([^)]+)\)/g,
    (_m, p) => `](${REPO}/${encodeURI('音频信号处理二十三讲/课程代码/' + p)})`);
  return md;
}

/** 在指定二级标题之前插入交互组件占位。 */
function injectWidgets(md: string, widgets: { before: string; name: string }[]): string {
  for (const w of widgets) {
    const needle = new RegExp(`^## ${w.before}`, 'm');
    if (needle.test(md)) md = md.replace(needle, `<div data-widget="${w.name}"></div>\n\n## ${w.before}`);
    else md += `\n\n<div data-widget="${w.name}"></div>\n`;
  }
  return md;
}

export async function renderLesson(
  body: string, lesson: Lesson, widgets: { before: string; name: string }[] = [],
): Promise<string> {
  const md = injectWidgets(rewritePaths(body, lesson.group), widgets);
  const file = await unified()
    .use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw).use(rehypeSlug)
    .use(rehypeKatex, { output: 'html' })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  // 宽表格要能横向滚动，滚动容器本身就是破栏的那一层
  return String(file).replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');
}
