# 官网收费模式

当前实现的是首版最小闭环：前三讲免费试看，其他课程只在服务端渲染第一节；用户先通过微信账号登录，再进入 Stripe 托管收银台。支付成功后订单会带上站内用户标识，返回网站后在当前浏览器取得五年有效的课程访问凭证。

## 上线前配置

1. 复制 `.env.example` 为 `.env.local`，或在 Vercel 项目中添加同名环境变量。
2. 在微信开放平台申请“网站应用微信登录”，填写 `AUTH_WECHAT_ID`、`AUTH_WECHAT_SECRET` 和 `AUTH_SECRET`。回调地址为 `https://你的域名/api/auth/callback/wechat`。
3. 在 Stripe 测试环境取得 `STRIPE_SECRET_KEY`。
4. 生成至少 32 个随机字符作为 `COURSE_ACCESS_SECRET`。
5. 填写正式域名 `NEXT_PUBLIC_SITE_URL` 和价格 `COURSE_PRICE_CNY`。
6. 在 Stripe 中创建 Webhook，地址为 `https://你的域名/api/stripe/webhook`，监听 `checkout.session.completed`，并填写 `STRIPE_WEBHOOK_SECRET`。
7. 测试登录、支付、退款和恢复访问后，才把 `PAYMENTS_ENABLED` 改为 `true`。

Stripe Checkout 会根据商户账户、币种和顾客位置显示已启用的支付方式。支付宝、微信支付是否可用取决于收款主体所在国家、Stripe 账户资格和后台审核结果，不应在资格确认前写进销售文案。

## 首版边界

- 微信登录已经按 Auth.js WebsiteApp 模式接好，但没有 AppID / AppSecret 时会保持禁用。
- 当前登录会话使用服务器签名的 JWT。启用数据库和微信登录后，访问权以 PostgreSQL 的 entitlement 为准，可以跨设备恢复。
- 未配置账户数据库时仍保留旧的本机 HttpOnly Cookie 访问模式，但支付入口不会启用。
- Stripe 支付成功回调和签名 Webhook 都会幂等写入订单及课程权益；退款事件会撤销对应权益。
- 正式扩大销售前仍应增加邮箱登录、订单后台、异常订单重放和人工恢复工具。

## 两种课程版本

- 免费静态图文版：基础文字、静态图片和少量公开样例，用于公众号、小红书、博客和搜索传播。
- 付费互动持续版：完整动画、声音、交互实验、跨设备同步、课程会员群和本课程后续更新。

免费版始终从付费版主稿导出，不单独维护第二套正文。配置正式官网后运行：

```powershell
npm run export:free -- --site-url=https://你的正式域名 --version=2026-09-07
```

导出结果位于 `发布版/免费图文版/<version>/`。脚本会在每篇文章开头和结尾加入官网入口，把音频链接替换为“互动持续版可播放”，并保留静态配图。

推荐第二阶段使用 PostgreSQL 保存 `users`、`accounts`、`orders`、`entitlements` 和 `lesson_progress`，支付 Webhook 作为唯一授予和撤销访问权的入口。微信支付、小红书店铺和公众号只需要接入同一份 entitlement，不应各自维护一套课程权限。完整设计见 `参考资料/个人主站会员与微信登录架构.md`。

## 正式收款前仍需人工填写

- 经营主体名称与所在地；
- 支持邮箱或客服电话；
- 适用法律和争议解决方式；
- 发票或收据安排；
- 最终价格、促销规则和退款处理时限；
- 当前公开 GitHub 仓库与付费内容之间的关系。
