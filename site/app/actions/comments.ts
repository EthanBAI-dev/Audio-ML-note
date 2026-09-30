'use server';
import { revalidatePath } from 'next/cache';
import { currentUserId } from '../../auth';
import { addComment, deleteComment } from '../../lib/comments';

export type CommentState = { error: string | null; ok: number };

/** page 形如 lesson/05，对应站内路径 /lesson/05。 */
function validPage(value: FormDataEntryValue | null): string | null {
  const page = String(value ?? '');
  return /^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(page) && page.length <= 120 ? page : null;
}

export async function postComment(prev: CommentState, formData: FormData): Promise<CommentState> {
  const userId = await currentUserId();
  if (!userId) return { error: '请先登录再发评论。', ok: prev.ok };
  const page = validPage(formData.get('page'));
  if (!page) return { error: '页面参数不对。', ok: prev.ok };
  const parent = String(formData.get('parentId') ?? '') || null;
  const error = await addComment(userId, page, String(formData.get('body') ?? ''), parent);
  if (error) return { error, ok: prev.ok };
  revalidatePath(`/${page}`);
  return { error: null, ok: prev.ok + 1 };
}

export async function removeComment(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const page = validPage(formData.get('page'));
  const id = String(formData.get('id') ?? '');
  if (page && id && await deleteComment(userId, id)) revalidatePath(`/${page}`);
}
