# 交接说明：网站与第 01 讲的当前进度

> **这份文件给谁看：** 接手继续开发的人或工具。它只记录**跨会话会丢掉的东西**——仓库之间的关系、已经踩过的坑、做到哪一步、下一步该做什么。课程写作规则在 `.claude/skills/audio-course-lesson/`，不在这里重复。

最后更新：2026-09-08　　当前分支：`claude/claude-code-setup-evx2ij`（两个提交，均未合入 main，也未进部署仓）

---

## 一、先搞清楚两个仓库的关系

| 仓库 | 是什么 | 可见性 |
|---|---|---|
| `EthanBAI-dev/Audio-ML-note` | **事实来源。** 课程主稿 + `site/` 源码 + `tools/` + `参考资料/` + `课程代码/` | 私有 |
| `EthanBAI-dev/ethanmusiclab-site` | **部署仓。** `ethanmusiclab.com` 从这里部署到 Vercel（Root Directory = `site`） | 私有 |

部署仓是主仓的一个子集：只有 `site/` + `音频信号处理二十三讲/` + `source_course/audio_resources/`。

### ⚠️ 四个已知的坑

1. **两个 `site/` 已经双向漂移，没有任何同步脚本。**
   主仓较新（微信登录 `wechatAuthConfigured`、首页改版、划线原价）；部署仓较旧，但**独有** `app/api/health/route.ts`（数据库健康检查），主仓没有。
   `site/scripts/export-free-edition.mjs` 只导出免费图文版，**不负责同步站点代码**。
   → 在主仓改完 `site/`，必须手工搬到部署仓才会上线。**这是目前最容易出事的地方。**

2. **部署仓里没有 `音频信号处理二十三讲/课程代码/`。**
   本次改动让站内 `/code` 直接读它，所以**部署仓在补上这个目录之前构建会失败**——`site/scripts/sync-assets.mjs` 会在构建前打印明确原因并退出 1。这是故意的，不要靠删检查绕过。

3. **`课程代码/README.md` 的「怎么开始」是写给有仓库的人的，和打包下载对不上。**
   它让读者 `cp -r 课程代码/soundlab 课程代码/lessons project/`；而从站内下载 zip 的读者解开后
   `lessons/`、`soundlab/` 已经在包的顶层，也没有 `source_course/`。
   `/code` 页的按钮下面直接给了适用于压缩包的那一句，绕开了这个矛盾，**但 README 本身还没改**。
   要彻底理顺，得把 README 的「怎么开始」写成两条路径（克隆仓库 / 下载压缩包）。

4. **课程代码里 `README.md` 说的 `project/` 目录并不存在。**
   `课程代码/README.md` 让读者 `mkdir -p project/audio` 再把 `soundlab/`、`lessons/` 拷进去；仓库里没有现成的 `project/`。正文第 01 讲的目录树跟着这个约定写。要改就两处一起改。

---

## 二、这一轮做完了什么

三件事，都已构建通过并在浏览器里实际验证。

### 1. 第 01 讲补了「这三段音乐要你自己准备」

**问题：** 第 01 讲唯一的动手步骤依赖 `debussy.wav`、`duke.wav`、`redhot.wav`，这三段是商业录音、不随仓库分发。读者照正文运行，只会拿到十几行 traceback，末尾是 `soundfile.LibsndfileError: ... System error.`——看着像电脑坏了。正文原先一个字都没提。

**改动：** `音频信号处理二十三讲/第01-05课/01-课程导论-*.md` 新增一个 `###` 小节，说明为什么不在仓库里、会看到哪一行报错、怎样用自备片段替代（文件名必须保持不变）、`SOUNDLAB_AUDIO` 的用法与查找顺序。原「实验」一节顺势拆成两个 `###`。

**已验证：** `SOUNDLAB_AUDIO=<目录>` 与 `./audio/` 两条替代路径都实测跑通。可读性与公式检查 ERROR 0、WARN 0。

### 2. 第 01 讲加了入口级交互 `BlindGuessLab`

盲听三段各 1 秒的教学音频并猜来源，揭晓时用 Web Audio 解码出的**真实样本值**显示"程序拿到的那串数字"，落回本课论点。

- 位置：`site/components/BlindGuessLab.tsx`，锚点在 `site/content/widgets.ts` 的 `'01'`
- **素材是钢琴 / 小提琴 / 萨克斯，不是古典 / 爵士 / 摇滚。** 后者正是不随仓库分发的三段商业录音。素材列表集中在文件顶部的 `CLIPS` 数组，**以后换成三段音乐只改那三行**，其余逻辑不用动
- 播放前做了峰值归一（`evenGain`）：三段素材峰值差约 12 dB（小提琴 0.254，钢琴与萨克斯接近 1.0），不拉平的话响度会直接把答案透露出去
- 按概念归属规则，交互里**不解释三段为什么听起来不同**，明写"第 03 讲再说"，不抢第 03 讲的内容

### 3. 课程代码与课程项目改成站内页面

**问题：** 正文里 21 处链接（课程代码 18、课程项目 3）原先被 `site/lib/markdown.ts` 改写成 GitHub 地址。主仓转为私有后，读者点开只会拿到 GitHub 的 404；即便公开，GitHub 在中国大陆的可达性也不适合当课程正文的落点。

**改动：**

| 文件 | 改了什么 |
|---|---|
| `site/lib/code.ts` | 新增。读取 `课程代码/`，含防目录穿越；`codeAvailable()` 供构建前检查 |
| `site/app/code/page.tsx` | 新增。`/code` 索引页，渲染 `课程代码/README.md` + 脚本清单，每个脚本关联对应讲次 |
| `site/app/code/[...file]/page.tsx` | 新增。`/code/lessons/xxx.py` 单文件源码页，33 个页面构建期静态生成 |
| `site/app/project/page.tsx` | 原先只是 `redirect('/guide')`，改成真正渲染 `课程项目/README.md` |
| `site/lib/markdown.ts` | 删掉 `REPO` 常量；改写规则改为 `/code`、`/code/<path>`、`/project` |
| `site/scripts/sync-assets.mjs` | 缺 `课程代码/` 时构建前退出并说明原因 |
| `site/app/layout.tsx` | 页脚加「课程项目」「课程代码」入口 |
| `site/scripts/lib/zip.mjs` | 新增。最小 ZIP 打包器，用 Node 自带 zlib，不加依赖 |
| `site/scripts/sync-assets.mjs` | 另外在构建前把课程代码打成 `public/downloads/audio-ml-course-code.zip`（36 个文件，119 KB；`data/` 是配图中间产物，不打进去）|
| `/code` 与单文件页 | 都加了「下载全部代码」按钮 |

**已验证：** 21 处链接逐个请求全部 200；第 01 讲页面里 `github.com` 链接归零；`/code/../../../etc/passwd` 等穿越尝试全部 404；单文件页在 390 px 窄屏无横向溢出；压缩包 `unzip -t` 通过、解开后与仓库逐字节一致、从解压目录能跑通 lesson01。

---

## 三、下一步（按优先级）

**P0 —— 不做会持续出事**

1. **定一个 `site/` 单向同步方向**（建议主仓为准，部署仓只接收），把 `/api/health` 回搬主仓。这一轮的所有改动**都还没进部署仓，线上没有任何变化**。
2. **把 `音频信号处理二十三讲/课程代码/` 发布进部署仓**，否则部署仓构建会失败（见坑 2）。同时决定 `/code` 要不要放进付费墙——目前是公开的，付费边界在 `site/lib/commerce.ts` 的 `publicLessons`（现为 01、02、03）。

**P1 —— 内容与转化**

3. 三段主素材在网页上仍**没有任何试听入口**。`markdown.ts` 的 `EXTERNAL` 改写只对 Markdown 链接生效，而第 01 讲里这三个文件名只出现在 Python 代码块中，所以不触发。计划是以后导入可嵌入的替代素材，届时 `BlindGuessLab` 的 `CLIPS` 与 `SELF_MADE` 一起更新。
4. 第 01 讲全文只有 2 张配图，是 23 讲里最少的之一（第 02 讲有 7 张）。作为落地页值得补图。

**P2 —— 站点层**

5. `generateMetadata`（`site/app/lesson/[id]/page.tsx`）只有 title/description，缺 `openGraph`、`canonical` 和课程 JSON-LD。免费的 01—03 讲是唯一自然流量入口。
6. `site/public/` 没有 favicon，`/favicon.ico` 目前 404。
7. `readingMinutes`（`site/lib/lessons.ts`）按 `body.length / 400` 估算，没剔除 Markdown 语法和 HTML 标签，显示的分钟数偏高。

---

## 四、怎么验证

```bash
# 文章检查，ERROR 必须为 0
node ".claude/skills/audio-course-lesson/scripts/check-readability.mjs" "音频信号处理二十三讲/第01-05课/01-课程导论-电脑要怎么分辨音乐类型.md"
node ".claude/skills/audio-course-lesson/scripts/check-markdown-math.mjs" "音频信号处理二十三讲/第01-05课/01-课程导论-电脑要怎么分辨音乐类型.md"

# 站点：prebuild 会同步素材、检查课程代码是否就位、校验交互组件锚点
npm --prefix site install
npm --prefix site run build      # 锚点应为 9 个全部对上
npm --prefix site start          # http://localhost:3000/lesson/01
```

第 01 讲的实验需要自备三段音乐（见正文小节）；只想跑通脚本可以：

```bash
SOUNDLAB_AUDIO=<你的音乐目录> python 音频信号处理二十三讲/课程代码/lessons/lesson01_course_map.py
```

> 注意：这个脚本会往**当前工作目录**写 `dataset_manifest.csv`。在 `课程代码/` 下直接跑会覆盖仓库里那一份，跑完记得 `git checkout` 还原。
