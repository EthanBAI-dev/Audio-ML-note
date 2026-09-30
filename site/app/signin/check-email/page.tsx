import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: '查收登录邮件' };

export default function CheckEmailPage() {
  return (
    <div className="shell home account-shell"><main><section className="auth-card">
      <p className="eyebrow">CHECK YOUR INBOX</p>
      <h1>登录链接已经发到你的邮箱</h1>
      <p>打开邮件，点里面的「登录」按钮就完成了。链接 24 小时内有效，只能用一次。</p>
      <p className="auth-note">没收到？看看垃圾邮件文件夹，或者<Link href="/signin">重新发送</Link>。</p>
    </section></main></div>
  );
}
