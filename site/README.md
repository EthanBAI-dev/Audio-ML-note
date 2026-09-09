# 课程网页版

把 `音频信号处理二十三讲/` 的 23 篇 Markdown 直接渲染成网站，并在关键位置插入可以动手调的交互程序。前三讲免费开放；其余课程支持账号登录、购买和跨设备恢复访问。

**文章不复制一份。** 站点在构建时读取课程目录里的原文件，正式版仍然是唯一的事实来源；改文章不需要动这里。

## 本地跑

```bash
npm --prefix site install
npm --prefix site run dev     # http://localhost:3000
```

`predev` / `prebuild` 会先跑 `scripts/sync-assets.mjs`：把配图和自制音频复制进 `public/`，并检查交互组件的锚点还对不对得上文章标题。**锚点对不上就直接构建失败**，免得组件悄悄掉到文末。

## 部署到 Vercel

1. 在 Vercel 里导入这个仓库。
2. **Root Directory 填 `site`**，框架会被识别成 Next.js，其余保持默认。
3. 先保持 `PAYMENTS_ENABLED=false`，按 `.env.example` 配置正式域名、课程价格和服务端密钥。
4. 准备 PostgreSQL，并执行 `db/migrations/0001_accounts_and_entitlements.sql`。
5. 配置微信开放平台网站应用，回调地址为 `https://你的域名/api/auth/callback/wechat`。
6. 先部署预览环境，检查免费章节、付费预览、登录、测试支付、Webhook、退款与跨设备恢复访问。
7. 上述流程全部通过后，在正式环境把 `PAYMENTS_ENABLED` 改为 `true`。

站点不是纯静态导出：课程正文和公开页面主要在构建期生成，登录、定价、付费课程、结账确认和 Stripe Webhook 使用服务端路由。完整收费模式依赖 PostgreSQL、Auth.js、微信登录和 Stripe；未配置时免费内容仍可正常运行，购买入口会保持关闭。详细配置与上线边界见 `COMMERCE.md`。

## 交互程序放在哪

`content/widgets.ts` 是唯一的编排表：哪一课、在哪个二级标题之前、插哪个组件。改文章标题时同步改这里。

| 组件 | 出现在 | 做什么 |
|---|---|---|
| `tone` | 02 | 拖频率、振幅和相位，同时看波形并试听 |
| `sliding` | 06 | 动画：窗往右挪，声谱图一列一列长出来 |
| `probe` | 10 | 动画：试探波扫过各频率，正负相消或留下大数 |
| `spectrum` | 10 | 自己叠正弦，切换幅度／功率／dB 与线性／对数频率轴 |
| `phasor` | 11 | 动画：复数向量旋转，投影成一条正弦 |
| `framing` | 15 | 只拖帧长，看时间与频率分辨率怎样此消彼长 |
| `mel` | 20 | 改梅尔带数和保留系数，看 DCT 后的轮廓还剩多少 |
| `bandsplit` | 21 | 拖分界频率看 BER，同图标出质心与带宽 |

同一个交互不会跨课重复摆放。动画都带播放/暂停和进度条，并且遵守系统的「减少动态效果」设置。

## 音频

`lib/markdown.ts` 里的 `SELF_MADE` 列出可以直接内嵌播放的素材；三段商业录音（德彪西、Red Hot Chili Peppers、Duke Ellington）只渲染成外链，不上传到站点。要改这个策略就改那两个常量。

七段教学示例音频已放入 `source_course/audio_resources/` 并随正式仓库发布，来源与许可见该目录的 `README.md` 和 `LICENSE`。构建时它们会复制到 `public/audio/`；三段商业录音仍然只给外链。
