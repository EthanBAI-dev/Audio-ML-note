'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SideNav({ items }: { items: { id: string; title: string }[] }) {
  const path = usePathname();
  return (
    <nav className="side">
      <div className="rail-label">全部 23 讲</div>
      <ol>
        {items.map((l) => {
          const href = `/lesson/${l.id}`;
          return (
            <li key={l.id}>
              <Link href={href} aria-current={path === href ? 'page' : undefined}>
                <span className="n">{l.id}</span>
                <span className="t">{l.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
