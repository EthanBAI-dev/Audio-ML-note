import { lang as langParam } from 'next/root-params';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { hasLocale, languageAlternates, localePath, type Locale } from './i18n';
import { dictionary } from './dictionaries';

/** 当前页面的语言，来自 app/[lang] 这一层网址。只能在服务端组件里用。 */
export async function getLang(): Promise<Locale> {
  const value = await langParam();
  if (!hasLocale(value)) notFound();
  return value;
}

/** 当前语言、这一语言的界面文字，以及给站内链接加语言前缀的 to()。 */
export async function getT() {
  const lang = await getLang();
  return { lang, t: dictionary(lang), to: (path: string) => localePath(lang, path) };
}

/** 页面元数据：标题、描述，外加三种语言版本的互链。path 不带语言前缀。 */
export async function pageMetadata(path: string, meta: Metadata = {}): Promise<Metadata> {
  return { ...meta, alternates: languageAlternates(await getLang(), path) };
}
