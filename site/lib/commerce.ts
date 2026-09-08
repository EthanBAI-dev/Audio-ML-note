export const COURSE_PRODUCT = {
  id: 'audio-ml-course-v1',
  name: '音频信号处理二十三讲 · 互动持续版',
  description: '解锁完整课程、动画、交互实验、声音对比、跨设备学习、会员群和本课程后续更新。',
  currency: 'cny',
  publicLessons: new Set(['01', '02', '03']),
} as const;

export function coursePriceCents(): number {
  const yuan = Number(process.env.COURSE_PRICE_CNY ?? '199');
  return Number.isFinite(yuan) && yuan > 0 ? Math.round(yuan * 100) : 19900;
}

export function coursePriceLabel(): string {
  return `¥${(coursePriceCents() / 100).toFixed(0)}`;
}

export function paymentsConfigured(): boolean {
  return process.env.PAYMENTS_ENABLED === 'true'
    && Boolean(process.env.STRIPE_SECRET_KEY)
    && Boolean(process.env.COURSE_ACCESS_SECRET);
}

export function isPublicLesson(id: string): boolean {
  return COURSE_PRODUCT.publicLessons.has(id as '01' | '02' | '03');
}

/** 付费章节只在服务端渲染第一节；完整 Markdown 不发送到未购买用户。 */
export function previewMarkdown(body: string): string {
  const headings = [...body.matchAll(/^##\s+/gm)];
  if (headings.length >= 2 && headings[1].index !== undefined) {
    return body.slice(0, headings[1].index).trim();
  }
  return body.slice(0, 1800).trim();
}
