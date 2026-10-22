/** v2 课文末尾「## ✅ 小测验」一节的格式（GitHub 上读者点开 details 看答案）：
 *
 *   **1. 题干**
 *
 *   - A. 选项
 *   - B. 选项
 *
 *   <details><summary>看答案</summary>
 *
 *   **B**。解析……
 *
 *   </details>
 *
 *  网站把这一节切出来，换成能点选、即时判分的组件。 */
export type Question = { q: string; options: string[]; answer: number; explain: string };

const HEAD = /^## ✅ 小测验\s*$/m;

export function splitQuiz(md: string): { body: string; quiz: Question[] } {
  const m = HEAD.exec(md);
  if (!m) return { body: md, quiz: [] };
  const start = m.index;
  const after = md.slice(start + m[0].length);
  const next = /^## /m.exec(after);
  const section = next ? after.slice(0, next.index) : after;
  const body = md.slice(0, start) + (next ? after.slice(next.index) : '');
  const quiz: Question[] = [];
  for (const block of section.split(/^\*\*\d+\.\s*/m).slice(1)) {
    const q = block.slice(0, block.indexOf('**')).trim();
    const options = [...block.matchAll(/^- [A-Z]\.\s*(.+)$/gm)].map((x) => x[1].trim());
    const ans = /<details>[\s\S]*?\*\*([A-Z])\*\*。?\s*([\s\S]*?)\s*<\/details>/.exec(block);
    if (!q || options.length < 2 || !ans) continue;
    quiz.push({ q, options, answer: ans[1].charCodeAt(0) - 65, explain: ans[2].trim() });
  }
  return { body, quiz };
}
