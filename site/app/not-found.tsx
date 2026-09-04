import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="shell">
      <main>
        <article className="notfound">
          <p className="eyebrow">404</p>
          <h1>这一页不在课程里</h1>
          <p>课程一共 23 讲，编号从 01 到 23。也可能是链接里的课号写错了。</p>
          <p><Link href="/" className="btn">回到全部课程</Link></p>
        </article>
      </main>
    </div>
  );
}
