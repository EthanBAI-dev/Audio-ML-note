import { NextResponse, type NextRequest } from 'next/server';

/** 页面都放在 app/[lang] 下面。中文网址没有前缀，这里把它们转给 /zh/...；
 *  /ja、/en 原样放行；有人手写 /zh/... 就跳回不带前缀的正式地址。 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/(ja|en)(\/|$)/.test(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  if (/^\/zh(\/|$)/.test(pathname)) {
    url.pathname = pathname.slice(3) || '/';
    return NextResponse.redirect(url, 308);
  }
  url.pathname = `/zh${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // 接口、Next 自己的文件和 public 里带扩展名的静态文件都不经过这里
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
