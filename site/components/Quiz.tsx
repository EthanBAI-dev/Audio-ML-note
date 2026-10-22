'use client';
import { useState, type ReactNode } from 'react';
import type { Question } from '../lib/quiz';

/** `代码` 换成 code，$公式$ 换成斜体，其余原样。题目里只用到这两种。 */
function inline(s: string): ReactNode[] {
  return s.split(/(`[^`]+`|\$[^$]+\$)/g).map((p, i) => {
    if (p.startsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
    if (p.startsWith('$')) return <i key={i}>{p.slice(1, -1).replace(/-/g, '−')}</i>;
    return p;
  });
}

/** 课末小测验：点一个选项立刻判对错，并给出解析。 */
export default function Quiz({ questions }: { questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const done = picked.filter((p) => p !== null).length;
  const right = picked.filter((p, i) => p === questions[i].answer).length;
  return (
    <section className="quiz" aria-labelledby="quiz-title">
      <h2 id="quiz-title">✅ 小测验</h2>
      <p className="quiz-hint">每题点一个选项，马上告诉你对不对，并给出理由。</p>
      <ol>
        {questions.map((q, i) => {
          const p = picked[i];
          return (
            <li key={i} className="quiz-q">
              <p className="quiz-stem">{inline(q.q)}</p>
              <div className="quiz-options" role="group">
                {q.options.map((o, k) => {
                  const state = p === null ? '' : k === q.answer ? ' is-right' : k === p ? ' is-wrong' : '';
                  return (
                    <button key={k} type="button" className={`quiz-opt${state}`} disabled={p !== null}
                      aria-pressed={p === k}
                      onClick={() => setPicked((s) => s.map((v, j) => (j === i ? k : v)))}>
                      <b>{String.fromCharCode(65 + k)}</b> {inline(o)}
                    </button>
                  );
                })}
              </div>
              {p !== null ? (
                <p className={`quiz-explain${p === q.answer ? ' is-right' : ' is-wrong'}`}>
                  {p === q.answer ? '答对了。' : `正确答案是 ${String.fromCharCode(65 + q.answer)}。`}{inline(q.explain.replace(/\*\*/g, ''))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="quiz-score">
        <span>已答 <b>{done}</b> / {questions.length}，答对 <b>{right}</b></span>
        {done ? <button type="button" onClick={() => setPicked(questions.map(() => null))}>重做一遍</button> : null}
      </div>
    </section>
  );
}
