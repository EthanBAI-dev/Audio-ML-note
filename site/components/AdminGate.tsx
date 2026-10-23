import Link from 'next/link';

/** 没登录、或登录的不是管理员时，后台页面只显示这张卡。 */
export function AdminGate({ returnTo }: { returnTo: string }) {
  return <div className="shell home account-shell"><main><section className="auth-card">
    <p className="eyebrow">ADMIN</p>
    <h1>需要管理员登录</h1>
    <p>文章后台只对管理员开放。用 <code>ADMIN_EMAILS</code> 里登记的邮箱登录后再回到这里。</p>
    <Link className="btn" href={`/signin?returnTo=${encodeURIComponent(returnTo)}`}>去登录</Link>
  </section></main></div>;
}

export function NeedsToken() {
  return <div className="shell home account-shell"><main><section className="auth-card">
    <p className="eyebrow">ADMIN · SETUP</p>
    <h1>还差一个 GitHub 令牌</h1>
    <p>后台把改好的文章提交到 GitHub 仓库，所以服务器需要一个能写这个仓库的令牌：</p>
    <ol>
      <li>在 GitHub 的 Settings → Developer settings → Fine-grained tokens 新建令牌，仓库只选这一个，权限给 Contents: Read and write。</li>
      <li>在 Vercel 项目的环境变量里填 <code>GITHUB_TOKEN</code>，然后重新部署。</li>
    </ol>
  </section></main></div>;
}
