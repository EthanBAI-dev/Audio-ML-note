'use client';
import { useEffect, useState } from 'react';
import type { Dictionary } from '../lib/dictionaries';

const DISMISS_KEY = 'eml-signin-guide-dismissed';
const HIDDEN_ON = ['/signin', '/account'];

/** 挂在登录按钮下面的引导小人：只给没登录的人看，关掉一次就不再出现。 */
/** path 是去掉语言前缀后的路径。 */
export default function SignInGuide({ path, t }: { path: string; t: Dictionary['signinGuide'] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (HIDDEN_ON.some((p) => path === p || path.startsWith(`${p}/`))) { setShow(false); return; }
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* 读不到就照常显示 */ }
    if (dismissed) return;
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [path]);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* 存不下就只关这一次 */ }
  };

  return (
    <div className="signin-guide" role="note">
      <div className="signin-guide-bubble">
        <p><b>{t.title}</b>{t.body}</p>
        <button type="button" className="signin-guide-close" aria-label={t.dismiss} onClick={dismiss}>×</button>
      </div>
      <svg className="signin-guide-buddy" viewBox="0 0 64 72" aria-hidden>
        {/* 举起来指向登录按钮的手 */}
        <path className="arm" d="M44 34 L54 14" />
        <circle className="hand" cx="55" cy="12" r="3.2" />
        {/* 身体 */}
        <rect className="body" x="14" y="22" width="34" height="38" rx="17" />
        {/* 耳机 */}
        <path className="phones" d="M16 36 a15 15 0 0 1 30 0" />
        <rect className="cup" x="11" y="33" width="7" height="11" rx="3" />
        <rect className="cup" x="44" y="33" width="7" height="11" rx="3" />
        {/* 脸 */}
        <circle className="eye" cx="26" cy="41" r="2.2" />
        <circle className="eye" cx="36" cy="41" r="2.2" />
        <path className="smile" d="M27 48 q4 3.5 8 0" />
        <path className="arm" d="M18 50 L10 56" />
        {/* 脚 */}
        <path className="leg" d="M24 60 v7 M38 60 v7" />
      </svg>
    </div>
  );
}
