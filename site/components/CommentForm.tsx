'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { postComment, type CommentState } from '../app/actions/comments';

const MAX = 2000;

export default function CommentForm({ page, parentId, reply = false }: { page: string; parentId?: string; reply?: boolean }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(postComment, { error: null, ok: 0 });
  const [open, setOpen] = useState(!reply);
  const [text, setText] = useState('');
  const seen = useRef(0);

  useEffect(() => {
    if (state.ok > seen.current) {
      seen.current = state.ok;
      setText('');
      if (reply) setOpen(false);
    }
  }, [state.ok, reply]);

  if (!open) {
    return <button type="button" className="text-button" onClick={() => setOpen(true)}>回复</button>;
  }

  return (
    <form action={action} className={`comment-form${reply ? ' is-reply' : ''}`}>
      <input type="hidden" name="page" value={page} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <textarea name="body" required maxLength={MAX} rows={reply ? 2 : 4} value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={reply ? '回复内容' : '评论内容'}
        placeholder={reply ? '写下你的回复' : '哪里没看懂、哪里有错、做实验时发现了什么，都可以写在这里'} />
      <div className="comment-form-foot">
        {state.error ? <span className="comment-error" role="alert">{state.error}</span> : <span className="comment-count">{text.length} / {MAX}</span>}
        {reply ? <button type="button" className="text-button" onClick={() => setOpen(false)}>取消</button> : null}
        <button type="submit" className="btn" disabled={pending || !text.trim()}>{pending ? '发送中…' : reply ? '回复' : '发表评论'}</button>
      </div>
    </form>
  );
}
