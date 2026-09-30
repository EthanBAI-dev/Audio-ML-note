import { notFound } from 'next/navigation';

/** 所有网址都会被代理转进 /[lang]/ 下面；没有对应页面的，在这里交给本语言的 404 页。 */
export default function CatchAll() {
  notFound();
}
