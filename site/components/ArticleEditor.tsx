'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { previewArticle, saveArticle } from '../app/actions/admin';

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; commitUrl: string }
  | { kind: 'error'; message: string };

/** 左边改 Markdown，右边实时预览；保存即提交到 GitHub。
 *  没保存的改动随手存在浏览器里，误关页面回来还能恢复。 */
export default function ArticleEditor({ path, name, initial, sha: initialSha, livePath, historyUrl }: {
  path: string; name: string; initial: string; sha: string; livePath: string | null; historyUrl: string;
}) {
  const [text, setText] = useState(initial);
  const [base, setBase] = useState(initial);
  const [sha, setSha] = useState(initialSha);
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [html, setHtml] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [, startPreview] = useTransition();
  const dirty = text !== base;
  const draftKey = `eml-draft:${path}`;

  // 上次没保存的草稿：只在它和仓库里的版本不同时才提示恢复
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved && saved !== initial) setDraft(saved);
    } catch { /* 隐私模式读不到就算了 */ }
  }, [draftKey, initial]);

  useEffect(() => {
    try {
      if (dirty) localStorage.setItem(draftKey, text);
      else localStorage.removeItem(draftKey);
    } catch { /* 同上 */ }
  }, [dirty, draftKey, text]);

  useEffect(() => {
    const id = setTimeout(() => startPreview(async () => setHtml(await previewArticle(path, text))), 350);
    return () => clearTimeout(id);
  }, [path, text]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = useCallback(async () => {
    if (!dirty || status.kind === 'saving') return;
    setStatus({ kind: 'saving' });
    const res = await saveArticle(path, text, sha, summary);
    if (res.ok) {
      setSha(res.sha);
      setBase(text);
      setSummary('');
      setStatus({ kind: 'saved', commitUrl: res.commitUrl });
    } else {
      setStatus({ kind: 'error', message: res.error });
    }
  }, [dirty, path, sha, status.kind, summary, text]);

  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return <div className="editor-shell">
    <div className="editor-bar">
      <div className="editor-title">
        <Link href="/admin" className="text-link">← 文章列表</Link>
        <b title={path}>{name}</b>
        <span className={`editor-dirty${dirty ? ' on' : ''}`}>{dirty ? '有未保存的修改' : '已是最新'}</span>
      </div>
      <div className="editor-actions">
        {livePath ? <a className="text-link" href={livePath} target="_blank" rel="noreferrer">看线上页面</a> : null}
        <a className="text-link" href={historyUrl} target="_blank" rel="noreferrer">修改历史</a>
        <input className="editor-summary" value={summary} onChange={(e) => setSummary(e.target.value)}
          placeholder="这次改了什么（可不填）" maxLength={120} aria-label="修改说明" />
        <button className="btn" type="button" disabled={!dirty || status.kind === 'saving'} onClick={save}>
          {status.kind === 'saving' ? '保存中…' : '保存并发布'}
        </button>
      </div>
    </div>

    {draft !== null ? <p className="editor-note">
      浏览器里有一份上次没保存的草稿。
      <button className="text-button" type="button" onClick={() => { setText(draft); setDraft(null); }}>恢复草稿</button>
      {' · '}
      <button className="text-button" type="button" onClick={() => {
        setDraft(null);
        try { localStorage.removeItem(draftKey); } catch { /* 无所谓 */ }
      }}>丢掉</button>
    </p> : null}
    {status.kind === 'saved' ? <p className="editor-note ok">
      已提交到 GitHub（<a href={status.commitUrl} target="_blank" rel="noreferrer">查看这次提交</a>），网站正在重新部署，一两分钟后线上更新。
    </p> : null}
    {status.kind === 'error' ? <p className="editor-note err">{status.message}</p> : null}

    <div className="editor-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={view === 'edit'} onClick={() => setView('edit')}>编辑</button>
      <button type="button" role="tab" aria-selected={view === 'preview'} onClick={() => setView('preview')}>预览</button>
    </div>

    <div className={`editor-panes show-${view}`}>
      <textarea className="editor-text" value={text} spellCheck={false} aria-label="Markdown 原文"
        onChange={(e) => { setText(e.target.value); if (status.kind !== 'saving') setStatus({ kind: 'idle' }); }} />
      <div className="editor-preview prose" lang="zh-CN" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  </div>;
}
