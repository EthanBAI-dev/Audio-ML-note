/** 站点语言。中文网址不带前缀，日文、英文分别在 /ja、/en 下面。
 *  这个文件不碰服务器专用接口，代理、服务端和浏览器端都能引用。 */
export const LOCALES = ['zh', 'ja', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'zh';

export const HTML_LANG: Record<Locale, string> = { zh: 'zh-CN', ja: 'ja', en: 'en' };
export const LOCALE_LABEL: Record<Locale, string> = { zh: '中文', ja: '日本語', en: 'English' };
/** 数字、日期按各语言习惯排版。 */
export const NUMBER_LOCALE: Record<Locale, string> = { zh: 'zh-CN', ja: 'ja-JP', en: 'en-US' };

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** 站内路径加上语言前缀：localePath('ja', '/lesson/01') → '/ja/lesson/01'，中文原样返回。 */
export function localePath(lang: Locale, path: string): string {
  if (lang === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

/** 把浏览器地址拆成语言和不带前缀的路径：'/en/labs' → { lang: 'en', path: '/labs' }。 */
export function splitLocale(pathname: string): { lang: Locale; path: string } {
  const m = /^\/(ja|en)(?=\/|$)/.exec(pathname);
  if (!m) return { lang: DEFAULT_LOCALE, path: pathname || '/' };
  return { lang: m[1] as Locale, path: pathname.slice(m[0].length) || '/' };
}

/** 课程正文渲染出来的站内链接（/lesson/05、/guide）都是中文地址，
 *  日文、英文页面上给它们补上语言前缀，读者点过去还留在同一种界面语言里。 */
export function localizeLinks(lang: Locale, html: string): string {
  if (lang === DEFAULT_LOCALE) return html;
  return html.replace(/href="\/(lesson\/\d\d|guide)(?=["#])/g, `href="/${lang}/$1`);
}

/** 页面 <head> 里的多语言互链，搜索引擎靠它把三个版本认成同一页。path 不带语言前缀。 */
export function languageAlternates(lang: Locale, path: string) {
  return {
    canonical: localePath(lang, path),
    languages: {
      'zh-CN': localePath('zh', path),
      ja: localePath('ja', path),
      en: localePath('en', path),
      'x-default': path,
    },
  };
}
