import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { db } from './db';
import { comments, users } from './db/schema';

export const COMMENT_MAX = 2000;
const COOLDOWN_MS = 15_000;

export type CommentView = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  deleted: boolean;
  userId: string;
  author: string;
};

/** 没起昵称的用户显示成邮箱前两位加星号，不把完整邮箱公开出去。 */
export function displayName(name: string | null, email: string | null): string {
  if (name?.trim()) return name.trim();
  if (email) return `${email.split('@')[0].slice(0, 2)}***`;
  return '匿名读者';
}

export async function listComments(page: string): Promise<CommentView[]> {
  if (!db) return [];
  const rows = await db
    .select({
      id: comments.id, parentId: comments.parentId, body: comments.body,
      createdAt: comments.createdAt, deletedAt: comments.deletedAt,
      userId: comments.userId, name: users.name, email: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.page, page))
    .orderBy(asc(comments.createdAt));
  return rows.map((r) => ({
    id: r.id,
    parentId: r.parentId,
    body: r.deletedAt ? '' : r.body,
    createdAt: r.createdAt,
    deleted: Boolean(r.deletedAt),
    userId: r.userId,
    author: r.deletedAt ? '' : displayName(r.name, r.email),
  }));
}

export async function userEmail(userId: string): Promise<string | null> {
  if (!db) return null;
  const [row] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
  return row?.email ?? null;
}

export async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!admins.length) return false;
  const email = await userEmail(userId);
  return Boolean(email && admins.includes(email.toLowerCase()));
}

export async function addComment(userId: string, page: string, body: string, parentId: string | null): Promise<string | null> {
  if (!db) return '评论功能还没有接上数据库。';
  const text = body.trim();
  if (!text) return '评论不能是空的。';
  if (text.length > COMMENT_MAX) return `评论最多 ${COMMENT_MAX} 字。`;

  const [last] = await db.select({ createdAt: comments.createdAt }).from(comments)
    .where(eq(comments.userId, userId)).orderBy(desc(comments.createdAt)).limit(1);
  if (last && Date.now() - last.createdAt.getTime() < COOLDOWN_MS) return '发得太快了，歇几秒再发。';

  if (parentId) {
    const [parent] = await db.select({ page: comments.page, parentId: comments.parentId }).from(comments)
      .where(and(eq(comments.id, parentId), isNull(comments.deletedAt)));
    if (!parent || parent.page !== page) return '要回复的评论已经不在了。';
    // 回复只有一层：回复一条回复时，挂到它的上级下面
    if (parent.parentId) parentId = parent.parentId;
  }

  await db.insert(comments).values({ page, userId, parentId, body: text });
  return null;
}

/** 软删除：保留占位，免得下面的回复失去上下文。 */
export async function deleteComment(userId: string, id: string): Promise<boolean> {
  if (!db) return false;
  const [row] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, id));
  if (!row) return false;
  if (row.userId !== userId && !await isAdmin(userId)) return false;
  await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, id));
  return true;
}
