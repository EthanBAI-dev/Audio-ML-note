import type { Locale } from '../i18n';
import { zh, type Dictionary } from './zh';
import { ja } from './ja';
import { en } from './en';

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { zh, ja, en };

/** 按语言取整份界面文字。页面里一般用 lib/locale.ts 的 getT()，不用自己传语言。 */
export function dictionary(lang: Locale): Dictionary {
  return DICTIONARIES[lang];
}
