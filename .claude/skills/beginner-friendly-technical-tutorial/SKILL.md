---
name: beginner-friendly-technical-tutorial
description: Write a complete technical tutorial that a zero-background reader can follow and an experienced reader can skim as reference. Use when the user asks for a tutorial, a getting-started guide, a hands-on walkthrough, or a rewrite that must contain runnable code, progressive levels from Hello World to production, a real project, common mistakes, and a cheat-sheet summary table.
---

# Beginner-Friendly Technical Tutorial Writer

## Goal

把一个复杂技术主题写成：
- 零基础读者可以理解
- 有经验的读者可以快速查阅
- 可以实际运行代码
- 从直觉逐步升级到工程实践
的完整技术教程。

---

## 1. Define Reader

开始写作前确定：

Target Reader:
- 是否零基础
- 已经会什么
- 学完应该能做什么

Learning Outcome:
读完本文后，读者应该能够：
1.
2.
3.

---

## 2. Opening

文章开头按照：

### 一句话定义

用 1~2 句话回答：

“X 是什么？”

不要首先讲历史、API 或实现细节。

### 核心价值

解释：

“它解决什么问题？”

### Before vs After

使用对比：

传统方式：
A → B → C

使用 X：
A → X → 自动完成 B/C/D

### 类比

寻找现实世界对应物：

X 就像 ______。

类比只负责建立直觉，
之后必须回到真实技术模型。

---

## 3. Why

回答：

为什么需要它？

包括：

- 原来的方法是什么
- 原来的方法有什么问题
- X 改善了什么
- 哪些情况适合 X
- 哪些情况不需要 X

如果适合，加入 Comparison Table。

---

## 4. Mental Model

在代码之前建立技术模型。

按照：

Input
↓
Component A
↓
Component B
↓
Decision
↓
Output

解释核心组件。

每个组件只回答三个问题：

1. 它是什么
2. 它负责什么
3. 它和其他组件什么关系

---

## 5. Core Concepts

每一个概念使用固定教学循环：

Concept
↓
Plain-language explanation
↓
Diagram
↓
Minimal example
↓
Code
↓
Output
↓
Explanation
↓
Common mistake

避免一次解释多个新概念。

---

## 6. Environment Setup

提供：

- 安装命令
- Python/Node 版本
- 依赖
- API Key
- .env 示例
- 验证安装代码

目标：

用户复制后应该可以运行。

---

## 7. Hello World

设计最小可运行 Demo。

要求：

- 尽量少的代码
- 不引入高级功能
- 清楚标记 Step 1 / Step 2 / Step 3
- 给出完整运行结果

然后逐行解释关键代码。

---

## 8. Progressive Expansion

按照复杂度升级：

Level 1:
最基础功能

Level 2:
加入第二个能力

Level 3:
条件 / 分支 / Tool

Level 4:
Memory / Persistence

Level 5:
完整应用

Level 6:
Advanced / Production

每一层只增加 1~2 个新概念。

---

## 9. Real Project

提供一个完整、可运行、有实际意义的项目。

结构：

需求
↓
架构
↓
代码
↓
运行
↓
输出
↓
解释

避免只有 Toy Example。

---

## 10. Engineering

在读者掌握基本功能后再加入：

- Error Handling
- Async
- Logging
- Persistence
- Security
- Performance
- Testing
- Observability
- Deployment

不要提前加入。

---

## 11. Common Problems

加入 FAQ：

Q1:
最容易写错什么？

Q2:
两个容易混淆的概念有什么区别？

Q3:
如何 Debug？

Q4:
生产环境应该注意什么？

---

## 12. Summary

最后不要重新写长篇解释。

使用表格：

| Concept | Meaning | Key API |
|---|---|---|

让文章变成 Cheat Sheet。

---

## 13. Learning Path

给出：

基础
↓
Hello World
↓
核心组件
↓
完整项目
↓
高级功能
↓
生产实践

告诉读者下一步学什么。

---

# Writing Style

语言：

简洁、直接、偏口语化。

优先：

“简单来说”
“想象一下”
“例如”
“我们来看一个例子”
“注意”
“实际项目中”

避免：

连续的大段理论解释。

每解释一个抽象概念，
尽可能跟随：

类比 / 图 / 表 / 代码 / 示例

中的至少一种。

---

# Quality Gate

文章完成后检查：

- [ ] 开头 200 字以内是否说明了是什么？
- [ ] 是否解释了为什么需要它？
- [ ] 是否提供了一个直觉模型？
- [ ] 是否存在最小可运行代码？
- [ ] 代码是否给出了预期输出？
- [ ] 是否从简单逐渐变复杂？
- [ ] 是否提供完整应用？
- [ ] 是否指出常见错误？
- [ ] 是否有总结表？
- [ ] API、版本、模型名是否经过当前官方文档核验？

---

# 用在这套音频课程上时的调整

这套 skill 原本是给软件／API 教程写的，用在 DSP 概念课上有三处对不上，实际写作时按下面处理：

- **§6 Environment Setup** 里的 API Key 和 `.env` 不适用。这门课只需要 Python 版本、`pip install` 一行、以及一段验证代码；环境只在一组的第一课交代一次，后面几课直接沿用。
- **§10 Engineering** 里的 Async／Security／Deployment 不适用。留下真正会咬人的那几项：边界条件、数值稳定性、性能、可复现性（参数必须记录）。
- **§9 Real Project** 不在单篇里另起一个项目。这门课有贯穿 23 课的项目《三首曲子，一个分类器》，每课末尾的「动手做」就是它的第 N 步，直接充当这一节。

另外保留原有仓库约定：文件顶部的 `<!-- abt: … -->` 叙事主干、`<picture>` 双版式配图、以及 `check-readability.mjs` / `check-markdown-math.mjs` 两道机检。
