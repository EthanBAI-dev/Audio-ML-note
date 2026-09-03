# -*- coding: utf-8 -*-
"""把 source_course 里 23 课的原始 PPT 和 notebook 扫成一份大纲。

用法：python tools/extract-source-outline.py
产出：NotebookLM课程博客_重写版/原始素材大纲.md

为什么要这个：写文章之前必须知道原始课程每一课到底讲了哪些点，否则
同一个概念会在两三课里各讲一遍（2026-09-03 就发生过：均方根在 03、07、
09 各讲一次）。这份大纲用于快速检索，也用于**照着它的顺序写文章**。

2026-09-03 又发现一个问题：这份大纲原来每页只留 6 行、notebook 只留函数名，
太粗了，粗到看不出「这一课按什么顺序讲」。结果第 07 课的草稿开头写成了
「一整段只留一个数 vs 三条证据」——那是凭空编的框架，PPT 的骨架其实是
「三个特征逐个讲：定义 → 公式逐项拆 → 图 → 优缺点 → 应用」。所以现在
每页留全、并标上页码，notebook 留真正做事的代码行、并标上单元号。

PPT 里大量是「逐步显示」的重复页——同一张幻灯片加一行再截一次。脚本
把「后一页以前一页开头」的情况折叠掉，只留最完整的那一版。
"""
import sys
import os
import re
import glob
import json

sys.stdout.reconfigure(encoding="utf-8")

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "source_course")
OUT = os.path.join(ROOT, "NotebookLM课程博客_重写版", "原始素材大纲.md")


def norm(t):
    """把一页的文字压成一行行干净的短句。"""
    lines = []
    for ln in t.split("\n"):
        ln = re.sub(r"\s+", " ", ln).strip()
        # 页码、纯符号、单个字母的公式碎片一律丢掉
        if not ln or len(ln) < 2:
            continue
        if re.fullmatch(r"[\d\W_]+", ln):
            continue
        lines.append(ln)
    return lines


def slides(path):
    """一份 PDF 的所有页，折叠掉逐步显示造成的重复。

    返回 (页码, 这一页的所有行)。页码要留着：写文章时想确认某一条的原始
    排版（图、公式的配色标注），可以直接翻到 PDF 的那一页，不用整份重读。
    """
    doc = pymupdf.open(path)
    pages = [norm(p.get_text()) for p in doc]
    doc.close()
    out = []
    for i, cur in enumerate(pages):
        if not cur:
            continue
        # 下一页如果包含这一页的全部内容，说明这一页是它的中间态
        nxt = pages[i + 1] if i + 1 < len(pages) else None
        if nxt and len(cur) < len(nxt) and cur == nxt[:len(cur)]:
            continue
        if out and cur == out[-1][1]:
            continue
        out.append((i + 1, cur))
    return out


# notebook 里不算「这一步做了什么」的样板行
NB_SKIP = re.compile(
    r"^(import |from |%|!|ipd\.|plt\.(show|figure|subplot|xlabel|ylabel|title|"
    r"ylim|xlim|legend|tight)|sns\.)"
)


def notebook(path):
    """notebook → (单元号, 是不是 markdown, 这一格的内容行)。

    原来这里只留函数名和 librosa 调用，看不出函数体里到底算了什么。
    第 08 课就吃过亏：原始 notebook 写的是 `max(signal[i:i+frame_size])`，
    **没有取绝对值**；只看「def amplitude_envelope(...)」那一行是发现不了的，
    而这正是改写时必须交代清楚的一处出入。
    """
    nb = json.load(open(path, encoding="utf-8"))
    out = []
    for i, c in enumerate(nb.get("cells", []), 1):
        src = "".join(c["source"]).strip()
        if not src:
            continue
        if c["cell_type"] == "markdown":
            lines = [ln.strip("# ").strip() for ln in src.splitlines() if ln.strip()]
            if lines:
                out.append((i, True, lines))
        else:
            lines = []
            for raw in src.splitlines():
                ln = re.sub(r"\s+", " ", raw).strip()
                if not ln or ln.startswith("#") or NB_SKIP.match(ln):
                    continue
                lines.append(ln)
            if lines:
                out.append((i, False, lines))
    return out


def main():
    lessons = sorted(d for d in os.listdir(SRC)
                     if os.path.isdir(os.path.join(SRC, d)) and d[:2].isdigit())
    body = ["# 原始素材大纲（source_course 的 23 课）",
            "",
            "> 这份文件由 `tools/extract-source-outline.py` 生成，**不要手改**。",
            "> 它用于快速检索每课出现过什么；写任何一课之前先在这里查一遍。",
            "> **它不能代替直接查看 PDF 页序和 notebook 单元格。** 课程脉络以源文件为准。",
            ""]
    for d in lessons:
        num = d[:2]
        title = d[5:] if " - " in d else d
        body.append(f"## 第 {num} 课 · {title}")
        body.append("")
        files = sorted(glob.glob(os.path.join(SRC, d, "*")))
        got = False
        for f in files:
            name = os.path.basename(f)
            if f.lower().endswith(".pdf"):
                groups = slides(f)
                body.append(f"**{name}**（{len(groups)} 张有效幻灯片）")
                body.append("")
                for page, g in groups:
                    body.append(f"- （p{page}）" + " ／ ".join(g))
                body.append("")
                got = True
            elif f.lower().endswith(".ipynb"):
                groups = notebook(f)
                body.append(f"**{name}**")
                body.append("")
                for cell, is_md, g in groups:
                    text = " ／ ".join(g) if is_md else "`" + "` `".join(g) + "`"
                    body.append(f"- （cell {cell}）" + text)
                body.append("")
                got = True
        if not got:
            body.append("（没有素材）")
            body.append("")
    with open(OUT, "w", encoding="utf-8", newline="\n") as fp:
        fp.write("\n".join(body).rstrip() + "\n")
    print(f"写好了：{OUT}")
    print(f"{len(lessons)} 课，{sum(1 for l in body if l.startswith('- '))} 条")


if __name__ == "__main__":
    main()
