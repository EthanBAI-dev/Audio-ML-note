export type TocItem = { id: string; text: string };

/** 从渲染好的 HTML 里抽出二级标题，作为本页小节目录。 */
export function extractToc(html: string): TocItem[] {
  const out: TocItem[] = [];
  const re = /<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const text = m[2].replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
    if (text) out.push({ id: m[1], text });
  }
  return out;
}
