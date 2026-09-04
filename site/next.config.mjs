/** @type {import('next').NextConfig} */
export default {
  // 文章与配图都在仓库里，构建期读盘即可，不需要图片优化服务
  images: { unoptimized: true },
  outputFileTracingRoot: new URL('..', import.meta.url).pathname,
};
