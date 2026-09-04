#!/usr/bin/env python3
"""把 改写对照实验/B-教程式/ 的 23 篇草稿迁移成 零基础版_*/ 的正式稿。

只做机械搬运与链接重写：
  - 草稿文件名即新正式稿文件名，旧正式稿删除
  - 草稿位于 改写对照实验/B-教程式/（深度 2），正式稿位于 零基础版_NN-NN/（深度 1），
    所有相对路径按深度差重写
  - 同组文章互链保持裸文件名，跨组补 ../零基础版_G/ 前缀
  - 同组配图收敛为 figures/...，跨组配图补 ../零基础版_G/ 前缀
  - 五个分组 README、课程总纲、课程项目与顶层 README 里的旧文件名换成新路径

用法：python3 tools/migrate-drafts-to-live.py [--apply]   （默认只演练不写盘）
"""
import re, sys, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "NotebookLM课程博客_重写版"
DRAFTS = BASE / "改写对照实验" / "B-教程式"
APPLY = "--apply" in sys.argv

GROUPS = [(1, 5, "01-05"), (6, 10, "06-10"), (11, 15, "11-15"),
          (16, 20, "16-20"), (21, 23, "21-23")]

def group_of(n: int) -> str:
    for lo, hi, g in GROUPS:
        if lo <= n <= hi:
            return g
    raise ValueError(n)

def gdir(g: str) -> Path:
    return BASE / f"零基础版_{g}"

# ---- 建表：课号 -> (草稿文件, 旧正式稿文件, 目标组) ----
lessons = {}
for f in sorted(DRAFTS.glob("[0-9][0-9]-*.md")):
    n = int(f.name[:2])
    g = group_of(n)
    old = sorted(gdir(g).glob(f"{n:02d}-*.md"))
    lessons[n] = {"draft": f, "old": old[0] if old else None, "group": g,
                  "new": gdir(g) / f.name}

missing = [n for n in range(1, 24) if n not in lessons]
if missing:
    sys.exit(f"草稿缺失：{missing}")

# 课号 -> 新文件名 / 旧文件名，供链接重写
new_name = {n: v["new"].name for n, v in lessons.items()}
old_name = {n: (v["old"].name if v["old"] else None) for n, v in lessons.items()}

LINK_MD = re.compile(r"\]\(([^)]+?\.md)(#[^)]*)?\)")
ASSET = re.compile(r'((?:src|srcset)=")([^"]+)(")')
OTHER = re.compile(r"\]\((\.\./[^)]+)\)")

def rewrite_article(text: str, group: str) -> str:
    """把一篇草稿正文里的相对路径改成正式稿位置下的写法。"""
    def md_link(m):
        target, frag = m.group(1), m.group(2) or ""
        return "](" + _md(target, group) + frag + ")"
    text = LINK_MD.sub(md_link, text)

    def asset(m):
        return m.group(1) + _asset(m.group(2), group) + m.group(3)
    text = ASSET.sub(asset, text)

    def other(m):
        p = m.group(1)
        if p.endswith(".md") or "figures/" in p:
            return m.group(0)          # 已由上面两条处理
        if p.startswith("../../../"):  # source_course 等仓库根下资源
            return "](" + p.replace("../../../", "../../", 1) + ")"
        if p.startswith("../../"):     # 课程代码 / 课程项目 / 课程总纲
            return "](" + p.replace("../../", "../", 1) + ")"
        return m.group(0)
    return OTHER.sub(other, text)

def _md(target: str, group: str) -> str:
    m = re.fullmatch(r"(\d\d)-.*\.md", target)
    if m:                                   # 裸文件名：同组保持，跨组补前缀
        n = int(m.group(1))
        tg = lessons[n]["group"]
        return new_name[n] if tg == group else f"../零基础版_{tg}/{new_name[n]}"
    m = re.fullmatch(r"\.\./\.\./零基础版_(\S+?)/(\d\d)-.*\.md", target)
    if m:                                   # 显式跨组：旧文件名换成新文件名
        n = int(m.group(2))
        tg = lessons[n]["group"]
        return new_name[n] if tg == group else f"../零基础版_{tg}/{new_name[n]}"
    if target.startswith("../../../"):
        return target.replace("../../../", "../../", 1)
    if target.startswith("../../"):
        return target.replace("../../", "../", 1)
    return target

def _asset(p: str, group: str) -> str:
    m = re.match(r"\.\./\.\./零基础版_(\S+?)/figures/(.*)", p)
    if m:
        g, rest = m.group(1), m.group(2)
        return f"figures/{rest}" if g == group else f"../零基础版_{g}/figures/{rest}"
    if p.startswith("../../"):               # 课程总纲/figures 等
        return p.replace("../../", "../", 1)
    return p

# ---- 迁移正文 ----
print(f"{'课':>3}  {'目标':<8} 动作")
for n in sorted(lessons):
    v = lessons[n]
    body = rewrite_article(v["draft"].read_text(encoding="utf-8"), v["group"])
    act = f"写入 {v['new'].name}"
    if v["old"] and v["old"] != v["new"]:
        act += f"  ／ 删除 {v['old'].name}"
    print(f"{n:>3}  {v['group']:<8} {act}")
    if APPLY:
        if v["old"] and v["old"] != v["new"]:
            v["old"].unlink()
        v["new"].write_text(body, encoding="utf-8")

# ---- 更新导航文件里的旧文件名 ----
navs = [BASE / "README.md", BASE / "课程总纲" / "README.md",
        BASE / "课程项目" / "README.md"] + [gdir(g) / "README.md" for _, _, g in GROUPS]
print("\n导航文件改名引用：")
for nav in navs:
    if not nav.exists():
        continue
    text = original = nav.read_text(encoding="utf-8")
    hits = 0
    for n in sorted(lessons):
        if not old_name[n] or old_name[n] == new_name[n]:
            continue
        if old_name[n] in text:
            hits += text.count(old_name[n])
            text = text.replace(old_name[n], new_name[n])
    print(f"  {nav.relative_to(BASE)}: {hits} 处")
    if APPLY and text != original:
        nav.write_text(text, encoding="utf-8")

print("\n演练完成，未写盘。加 --apply 执行。" if not APPLY else "\n已写盘。")
