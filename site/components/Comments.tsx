import Link from 'next/link';
import { authConfigured, currentUserId } from '../auth';
import { db } from '../lib/db';
import { isAdmin, listComments, type CommentView } from '../lib/comments';
import { removeComment } from '../app/actions/comments';
import CommentForm from './CommentForm';

const TIME = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

function Item({ c, page, me, admin, replies }: {
  c: CommentView; page: string; me: string | null; admin: boolean; replies?: React.ReactNode;
}) {
  return (
    <li className={`comment${c.deleted ? ' is-deleted' : ''}`} id={`c-${c.id}`}>
      {c.deleted ? <p className="comment-body">这条评论已删除。</p> : (
        <>
          <p className="comment-meta"><b>{c.author}</b><time dateTime={c.createdAt.toISOString()}>{TIME.format(c.createdAt)}</time></p>
          <p className="comment-body">{c.body}</p>
          <div className="comment-actions">
            {me && !c.parentId ? <CommentForm page={page} parentId={c.id} reply /> : null}
            {me && (me === c.userId || admin) ? (
              <form action={removeComment}>
                <input type="hidden" name="page" value={page} />
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="text-button">删除</button>
              </form>
            ) : null}
          </div>
        </>
      )}
      {replies}
    </li>
  );
}

/** 页面底部的评论区。page 是不带开头斜杠的站内路径，比如 lesson/05。 */
export default async function Comments({ page }: { page: string }) {
  if (!authConfigured || !db) return null;
  let all: CommentView[], me: string | null, admin: boolean;
  try {
    [all, me] = await Promise.all([listComments(page), currentUserId()]);
    admin = await isAdmin(me);
  } catch (error) {
    // 评论区出错不能连累正文，直接不显示
    console.error('[comments] 读取失败', error);
    return null;
  }
  const top = all.filter((c) => !c.parentId);
  const visible = all.filter((c) => !c.deleted).length;

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title">评论 {visible ? <small>{visible}</small> : null}</h2>
      {me ? <CommentForm page={page} /> : (
        <p className="comments-signin"><Link href={`/signin?returnTo=/${page}%23comments-title`}>登录</Link>后可以发评论。阅读不需要登录。</p>
      )}
      {top.length ? (
        <ol className="comment-list">
          {top.map((c) => {
            const replies = all.filter((r) => r.parentId === c.id);
            // 整条讨论都删光了就不再占位
            if (c.deleted && !replies.some((r) => !r.deleted)) return null;
            return (
              <Item key={c.id} c={c} page={page} me={me} admin={admin} replies={replies.length ? (
                <ol className="comment-replies">
                  {replies.filter((r) => !r.deleted).map((r) => <Item key={r.id} c={r} page={page} me={me} admin={admin} />)}
                </ol>
              ) : null} />
            );
          })}
        </ol>
      ) : <p className="comments-empty">还没有评论。有看不懂的地方、发现的错误，都欢迎留在这里。</p>}
    </section>
  );
}
