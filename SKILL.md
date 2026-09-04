# 写作 skill 的位置

审校与改写用的 skill 已经移到项目内的标准位置，Claude Code 会自动发现并加载：

```
.claude/skills/audio-course-lesson/
├─ SKILL.md                       写作与审校流程；最高优先级是「读者一无所知」
├─ references/
│  ├─ zero-basis-rules.md         零基础读者规则：术语准入、开头规则、密度检查、读者模拟
│  ├─ article-shape.md            知识点主线与自然递进结构（内部顺序不写进标题）
│  ├─ mobile-figures.md           手机窄屏配图、有效字号与 360 px 验收规则
│  ├─ rubric.md                   八个评分维度、权重、发布门槛
│  ├─ report-template.md          审校报告 A–L 节
│  └─ terms-zh.json               术语词表，可按领域扩充
└─ scripts/
   ├─ check-readability.mjs       机器检查：首次出现、开头违规、术语密度
   └─ check-svg-mobile.mjs        机器检查：SVG 画布与手机端有效字号
```

用法：

- 在 Claude Code 里直接说「按 skill 审校第 06 课」，或 `/audio-course-lesson`。
- 想把规则贴给别的模型用，`references/zero-basis-rules.md` 的每一节都可以整段复制成提示词。
- 改完任何一篇跑一次检查，ERROR 必须为 0：

```bash
node ".claude/skills/audio-course-lesson/scripts/check-readability.mjs" "音频信号处理二十三讲/第01-05课"
```

改完配图后按 360 px 手机正文宽度检查：

```bash
node ".claude/skills/audio-course-lesson/scripts/check-svg-mobile.mjs" "音频信号处理二十三讲/第01-05课/figures"
```

第一批成果见 [第01-05课](音频信号处理二十三讲/第01-05课/README.md)。
