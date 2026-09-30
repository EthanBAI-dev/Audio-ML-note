import Link from 'next/link';
import { authConfigured, currentUserId } from '../auth';
import { db } from '../lib/db';
import { isAdmin, listComments, type CommentView } from '../lib/comments';
import { removeComment } from '../app/actions/comments';
import { NUMBER_LOCALE, type Locale } from '../lib/i18n';
import { getT } from '../lib/locale';
import type { Dictionary } from '../lib/dictionaries';
import { rich } from '../lib/rich';
import CommentForm from './CommentForm';

/** 评论时间按读者大概所在的时区显示；英文读者分散，就用 UTC 并标出来。 */
const TIME_ZONE: Record<Locale, { timeZone: string; timeZoneName?: 'short' }> = {
  zh: { timeZone: 'Asia/Shanghai' },
  ja: { timeZone: 'Asia/Tokyo' },
  en: { timeZone: 'UTC', timeZoneName: 'short' },
};

function Item({ c, page, me, admin, replies, t, lang, time }: {
  c: CommentView; page: string; me: string | null; admin: boolean; replies?: React.ReactNode;
  t: Dictionary['comments']; lang: Locale; time: Intl.DateTimeFormat;
}) {
  return (
    <li className={`comment${c.deleted ? ' is-deleted' : ''}`} id={`c-${c.id}`}>
      {c.deleted ? <p className="comment-body">{t.deleted}</p> : (
        <>
          <p className="comment-meta"><b>{c.author ?? t.anonymous}</b><time dateTime={c.createdAt.toISOString()}>{time.format(c.createdAt)}</time></p>
          <p className="comment-body">{c.body}</p>
          <div className="comment-actions">
            {me && !c.parentId ? <CommentForm page={page} lang={lang} t={t.form} parentId={c.id} reply /> : null}
            {me && (me === c.userId || admin) ? (
              <form action={removeComment}>
                <input type="hidden" name="page" value={page} />
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="text-button">{t.delete}</button>
              </form>
            ) : null}
          </div>
        </>
      )}
      {replies}
    </li>
  );
}

/** 页面底部的评论区。page 是不带开头斜杠、也不带语言前缀的站内路径，比如 lesson/05；
 *  三种语言看到的是同一串评论。 */
export default async function Comments({ page }: { page: string }) {
  if (!authConfigured || !db) return null;
  const { lang, t: dict, to } = await getT();
  const t = dict.comments;
  let all: CommentView[], me: string | null, admin: boolean;
  try {
    [all, me] = await Promise.all([listComments(page), currentUserId()]);
    admin = await isAdmin(me);
  } catch (error) {
    // 评论区出错不能连累正文，直接不显示
    console.error('[comments] 读取失败', error);
    return null;
  }
  const time = new Intl.DateTimeFormat(NUMBER_LOCALE[lang], {
    ...TIME_ZONE[lang], year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const top = all.filter((c) => !c.parentId);
  const visible = all.filter((c) => !c.deleted).length;
  const itemProps = { page, me, admin, t, lang, time };

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title">{t.title} {visible ? <small>{visible}</small> : null}</h2>
      {me ? <CommentForm page={page} lang={lang} t={t.form} /> : (
        <p className="comments-signin">{rich(t.signin, {
          link: <Link href={`${to('/signin')}?returnTo=${encodeURIComponent(`${to(`/${page}`)}#comments-title`)}`}>{t.signinLink}</Link>,
        })}</p>
      )}
      {top.length ? (
        <ol className="comment-list">
          {top.map((c) => {
            const replies = all.filter((r) => r.parentId === c.id);
            // 整条讨论都删光了就不再占位
            if (c.deleted && !replies.some((r) => !r.deleted)) return null;
            return (
              <Item key={c.id} c={c} {...itemProps} replies={replies.length ? (
                <ol className="comment-replies">
                  {replies.filter((r) => !r.deleted).map((r) => <Item key={r.id} c={r} {...itemProps} />)}
                </ol>
              ) : null} />
            );
          })}
        </ol>
      ) : <p className="comments-empty">{t.empty}</p>}
    </section>
  );
}
