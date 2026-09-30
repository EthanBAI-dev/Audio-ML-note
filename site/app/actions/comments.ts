'use server';
import { revalidatePath } from 'next/cache';
import { currentUserId } from '../../auth';
import { addComment, deleteComment } from '../../lib/comments';
import { DEFAULT_LOCALE, LOCALES, hasLocale, localePath } from '../../lib/i18n';
import { dictionary } from '../../lib/dictionaries';

export type CommentState = { error: string | null; ok: number };

/** page 形如 lesson/05，对应站内路径 /lesson/05。 */
function validPage(value: FormDataEntryValue | null): string | null {
  const page = String(value ?? '');
  return /^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(page) && page.length <= 120 ? page : null;
}

/** 三种语言共用一串评论，发了或删了都要刷新三个版本。
 *  中文网址在代理里被转到 /zh/...，内部路由用的是后者，两种写法都刷一遍。 */
function revalidateAllLanguages(page: string) {
  for (const lang of LOCALES) revalidatePath(localePath(lang, `/${page}`));
  revalidatePath(`/zh/${page}`);
}

export async function postComment(prev: CommentState, formData: FormData): Promise<CommentState> {
  const langValue = String(formData.get('lang') ?? '');
  const errors = dictionary(hasLocale(langValue) ? langValue : DEFAULT_LOCALE).comments.errors;
  const userId = await currentUserId();
  if (!userId) return { error: errors.signIn, ok: prev.ok };
  const page = validPage(formData.get('page'));
  if (!page) return { error: errors.badPage, ok: prev.ok };
  const parent = String(formData.get('parentId') ?? '') || null;
  const error = await addComment(userId, page, String(formData.get('body') ?? ''), parent);
  if (error) return { error: errors[error], ok: prev.ok };
  revalidateAllLanguages(page);
  return { error: null, ok: prev.ok + 1 };
}

export async function removeComment(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const page = validPage(formData.get('page'));
  const id = String(formData.get('id') ?? '');
  if (page && id && await deleteComment(userId, id)) revalidateAllLanguages(page);
}
