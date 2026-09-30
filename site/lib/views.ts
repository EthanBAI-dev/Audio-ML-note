import { desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { pageViews } from './db/schema';
import { lessonById } from './lessons';

const STATIC_PAGES = new Set(['/', '/courses', '/courses/audio-ml', '/labs', '/roadmap', '/guide', '/project', '/account', '/signin']);

/** 只统计站内真实存在的页面，免得有人往表里灌随便编的路径。 */
export function countablePath(path: string): boolean {
  if (STATIC_PAGES.has(path)) return true;
  const lesson = /^\/lesson\/([0-9]{2})$/.exec(path);
  if (lesson) return Boolean(lessonById(lesson[1]));
  return /^\/legal\/[a-z-]{1,40}$/.test(path);
}

export async function recordView(path: string): Promise<number | null> {
  if (!db || !countablePath(path)) return null;
  try {
    return await increment(path);
  } catch (error) {
    console.error('[views] 记录失败', error);
    return null;
  }
}

async function increment(path: string): Promise<number | null> {
  const [row] = await db!.insert(pageViews).values({ path, views: 1 })
    .onConflictDoUpdate({ target: pageViews.path, set: { views: sql`${pageViews.views} + 1`, updatedAt: new Date() } })
    .returning({ views: pageViews.views });
  return row?.views ?? null;
}

/** 读不到数据库时返回 null，页面照常显示，只是不显示次数。 */
export async function viewsOf(path: string): Promise<number | null> {
  if (!db) return null;
  try {
    const [row] = await db.select({ views: pageViews.views }).from(pageViews).where(eq(pageViews.path, path));
    return row?.views ?? 0;
  } catch (error) {
    console.error('[views] 读取失败', error);
    return null;
  }
}

export async function viewsFor(paths: string[]): Promise<Map<string, number>> {
  if (!db || !paths.length) return new Map();
  const rows = await db.select().from(pageViews).where(inArray(pageViews.path, paths));
  return new Map(rows.map((r) => [r.path, r.views]));
}

export async function topPages(limit = 50) {
  if (!db) return [];
  return db.select().from(pageViews).orderBy(desc(pageViews.views)).limit(limit);
}
