import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((item) => {
  const [key, ...rest] = item.replace(/^--/, '').split('=');
  return [key, rest.join('=')];
}));

const siteUrl = (args['site-url'] || process.env.FREE_EDITION_SITE_URL || '').replace(/\/$/, '');
if (!/^https:\/\//.test(siteUrl)) {
  throw new Error('请用 --site-url=https://你的正式域名 指定官网地址');
}

const version = args.version || new Date().toISOString().slice(0, 10);
const dryRun = args['dry-run'] === 'true';
const sourceRoot = join(process.cwd(), '..', '音频信号处理二十三讲');
const outputRoot = join(process.cwd(), '..', '发布版', '免费图文版', version);
const courseUrl = `${siteUrl}/courses/audio-ml?utm_source=free_edition&utm_medium=article&utm_campaign=audio_ml`;
const opening = `> **版本说明：** 本文为《音频信号处理二十三讲》免费静态图文版。包含声音播放、动态图和可操作实验的互动持续版，请访问：[${siteUrl}](${courseUrl})`;
const closing = `---\n\n> 想亲耳比较声音、拖动参数观察图形变化，并在手机和电脑同步学习进度，可前往 [${siteUrl}](${courseUrl}) 解锁互动持续版。购买后还可申请加入课程会员群，并持续获得本课程更新。`;

let exported = 0;
if (!dryRun) mkdirSync(outputRoot, { recursive: true });

for (const group of readdirSync(sourceRoot, { withFileTypes: true })) {
  if (!group.isDirectory() || !/^第\d\d-\d\d课$/.test(group.name)) continue;
  const sourceGroup = join(sourceRoot, group.name);
  const targetGroup = join(outputRoot, group.name);
  if (!dryRun) mkdirSync(targetGroup, { recursive: true });

  const figures = join(sourceGroup, 'figures');
  if (!dryRun) {
    try { cpSync(figures, join(targetGroup, 'figures'), { recursive: true }); } catch { /* 这一组可能没有配图 */ }
  }

  for (const file of readdirSync(sourceGroup)) {
    if (!/^\d\d-.*\.md$/.test(file)) continue;
    const sourceFile = join(sourceGroup, file);
    let article = readFileSync(sourceFile, 'utf8');
    article = article.replace(/^#\s+.+$/m, (title) => `${title}\n\n${opening}`);
    article = article.replace(/\[([^\]]+)\]\(([^)]+\.(?:wav|mp3|m4a|ogg|flac))\)/gi,
      (_match, label) => `**${label}**（互动持续版可播放）`);
    article = `${article.trim()}\n\n${closing}\n`;
    if (!dryRun) writeFileSync(join(targetGroup, basename(file)), article, 'utf8');
    exported += 1;
  }
}

if (!dryRun) writeFileSync(join(outputRoot, 'README.md'), `# 音频信号处理二十三讲 · 免费静态图文版\n\n- 导出版本：${version}\n- 正式官网：${siteUrl}\n- 课程入口：${courseUrl}\n- 文章数量：${exported}\n\n本目录由付费版主稿自动导出。动画、交互和完整声音素材不包含在本版本中。\n`, 'utf8');

console.log(dryRun
  ? `检查通过：可以导出 ${exported} 篇免费静态文章`
  : `已导出 ${exported} 篇免费静态文章：${outputRoot}`);
