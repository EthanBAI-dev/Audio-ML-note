'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { postComment, type CommentState } from '../app/actions/comments';
import type { Locale } from '../lib/i18n';
import type { Dictionary } from '../lib/dictionaries';

const MAX = 2000;

export default function CommentForm({ page, lang, t, parentId, reply = false }: {
  page: string; lang: Locale; t: Dictionary['comments']['form']; parentId?: string; reply?: boolean;
}) {
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
    return <button type="button" className="text-button" onClick={() => setOpen(true)}>{t.reply}</button>;
  }

  return (
    <form action={action} className={`comment-form${reply ? ' is-reply' : ''}`}>
      <input type="hidden" name="page" value={page} />
      {/* 服务端动作读不到网址里的语言，靠这一项决定报错用哪种语言 */}
      <input type="hidden" name="lang" value={lang} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <textarea name="body" required maxLength={MAX} rows={reply ? 2 : 4} value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={reply ? t.replyAria : t.commentAria}
        placeholder={reply ? t.replyPlaceholder : t.placeholder} />
      <div className="comment-form-foot">
        {state.error ? <span className="comment-error" role="alert">{state.error}</span> : <span className="comment-count">{text.length} / {MAX}</span>}
        {reply ? <button type="button" className="text-button" onClick={() => setOpen(false)}>{t.cancel}</button> : null}
        <button type="submit" className="btn" disabled={pending || !text.trim()}>{pending ? t.sending : reply ? t.reply : t.submit}</button>
      </div>
    </form>
  );
}
