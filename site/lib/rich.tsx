import { Fragment, type ReactNode } from 'react';

/** 把词典里的 {name} 占位换成链接、加粗等元素。各语言语序不同，所以链接的位置由译文决定。
 *  rich('详见{link}。', { link: <Link …/> }) */
export function rich(template: string, parts: Record<string, ReactNode>): ReactNode {
  return template.split(/\{(\w+)\}/).map((piece, i) =>
    <Fragment key={i}>{i % 2 ? (parts[piece] ?? `{${piece}}`) : piece}</Fragment>);
}
