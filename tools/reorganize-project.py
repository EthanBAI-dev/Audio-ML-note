#!/usr/bin/env python3
"""把仓库整理成「正式版 + 参考资料 + 工具」三块，并删掉迭代过程文件。

  python3 tools/reorganize-project.py [--apply]
"""
import re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = ROOT / "音频信号处理二十三讲/"
LIVE = ROOT / "音频信号处理二十三讲"      # 正式版
REF = ROOT / "参考资料"
APPLY = "--apply" in sys.argv
GROUPS = ["01-05", "06-10", "11-15", "16-20", "21-23"]

def run(*a):
    print("   ", " ".join(str(x) for x in a))
    if APPLY:
        subprocess.run(["git", *a], cwd=ROOT, check=True)

# ---------- 1. 正式版 ----------
print("一、搬进正式版目录", LIVE.name)
if APPLY:
    LIVE.mkdir(exist_ok=True)
for g in GROUPS:
    run("mv", f"{OLD.name}/零基础版_{g}", f"{LIVE.name}/第{g}课")
for d in ("课程总纲", "课程项目", "课程代码"):
    run("mv", f"{OLD.name}/{d}", f"{LIVE.name}/{d}")
run("mv", f"{OLD.name}/README.md", f"{LIVE.name}/README.md")

# ---------- 2. 参考资料 ----------
print("\n二、保留的参考内容")
if APPLY:
    REF.mkdir(exist_ok=True)
run("mv", f"{OLD.name}/PPT内容", f"{REF.name}/源课程逐页全文")
run("mv", f"{OLD.name}/原始素材大纲.md", f"{REF.name}/原始素材大纲.md")
run("mv", f"{OLD.name}/改写对照实验/PPT脉络与内容归属表.md", f"{REF.name}/概念归属表.md")
run("mv", f"{OLD.name}/参考资料/改写与配图工作流.md", f"{REF.name}/改写与配图工作流.md")

# ---------- 3. 删除迭代文件 ----------
print("\n三、删除迭代过程文件")
run("rm", "-r", f"{OLD.name}/改写对照实验")          # 23 篇草稿、任务卡、交接文件
ITER_TOOLS = [
    # 被 *-ppt.mjs 取代的旧配图生成器（产出的图正式版一张都没用）
    "build-figures.mjs", "build-figures-06-10.mjs", "build-figures-11-15.mjs",
    "build-figures-16-20.mjs", "build-figures-21-23.mjs", "build-figures-01-tutorial.mjs",
    # 选型原型与 A/B 对比页
    "build-compare-page.mjs", "proto-spectrogram.mjs", "proto_matplotlib.py",
    # 一次性改写脚本，改动已经落在文章里
    "add-concept-links.mjs", "apply-exercises.mjs", "exercises.mjs",
    "insert-course-position-figures.mjs", "migrate-drafts-to-live.py",
]
for f in ITER_TOOLS:
    run("rm", f"tools/{f}")

# 无人引用的旧配图
live_names = set()
for md in list(LIVE.rglob("*.md")) if APPLY else list(OLD.rglob("零基础版_*/*.md")):
    live_names |= set(re.findall(r"[0-9A-Za-z][0-9A-Za-z-]*\.svg", md.read_text(encoding="utf-8")))
orphans = []
for g in GROUPS:
    base = (LIVE / f"第{g}课" if APPLY else OLD / f"零基础版_{g}") / "figures"
    for variant in ("desktop", "mobile", "card"):
        d = base / variant
        if d.is_dir():
            orphans += [p for p in sorted(d.glob("*.svg")) if p.name not in live_names]
print(f"    孤图 {len(orphans)} 个")
for p in orphans:
    if APPLY:
        subprocess.run(["git", "rm", "-q", str(p.relative_to(ROOT))], cwd=ROOT, check=True)

# ---------- 4. 路径重写 ----------
print("\n四、重写路径引用")
SUBS = [(re.compile(r"零基础版_(" + "|".join(GROUPS) + r")"), r"第\1课"),
        (re.compile(r"参考资料/源课程逐页全文"), "参考资料/源课程逐页全文"),
        (re.compile(r"音频信号处理二十三讲/原始素材大纲\.md"), "参考资料/原始素材大纲.md"),
        (re.compile(r"音频信号处理二十三讲/改写对照实验/PPT脉络与内容归属表\.md"), "参考资料/概念归属表.md"),
        (re.compile(r"零基础改写与配图工作流\.md"), "参考资料/改写与配图工作流.md"),
        (re.compile(r"音频信号处理二十三讲/?"), "音频信号处理二十三讲/")]
targets = ([p for p in LIVE.rglob("*.md")] + [p for p in REF.rglob("*.md")] +
           [ROOT / "README.md", ROOT / "SKILL.md"] +
           [p for p in (ROOT / ".claude").rglob("*.md")] +
           [p for p in (ROOT / ".agents").rglob("*.md")] +
           [p for p in (ROOT / "tools").rglob("*.mjs")] +
           [p for p in (ROOT / "tools").rglob("*.py")]) if APPLY else []
touched = 0
for p in targets:
    if not p.exists():
        continue
    t = o = p.read_text(encoding="utf-8")
    for rx, rep in SUBS:
        t = rx.sub(rep, t)
    if t != o:
        p.write_text(t, encoding="utf-8"); touched += 1
print(f"    改写 {touched} 个文件")
if APPLY and not any(OLD.rglob("*")):
    shutil.rmtree(OLD, ignore_errors=True); print(f"    移除空目录 {OLD.name}")
print("\n演练完成。" if not APPLY else "\n已执行。")
