# -*- coding: utf-8 -*-
"""把某一课的实测结果写成 JSON，供画图脚本读取。

为什么要有这一层：配图上的数字和正文里的数字必须是同一个。第 01 课出过
一次事故——同一份数据在 Python 和 Node 里各算了一遍，两处得出 11.4 倍和
3.5 倍两个结论。所以规矩是：**只有 Python 算数，Node 只负责画。**

各课脚本加 `--dump` 参数跑一次，就把这一课要上图的数写到
`课程代码/data/lessonNN.json`；`tools/build-figures-*.mjs` 只读这些文件。
"""
import os
import json

import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def _plain(o):
    """numpy 的标量和数组 JSON 序列化不了，先换成 Python 自带的类型。"""
    if isinstance(o, np.ndarray):
        return [_plain(v) for v in o.tolist()]
    if isinstance(o, (np.floating, float)):
        return round(float(o), 6)
    if isinstance(o, (np.integer, int)):
        return int(o)
    if isinstance(o, dict):
        return {k: _plain(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_plain(v) for v in o]
    return o


def dump(lesson, payload):
    """写 data/lessonNN.json，返回写到哪儿了。"""
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, f"lesson{lesson:02d}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_plain(payload), f, ensure_ascii=False, indent=1)
    return path


def thin(arr, n=400):
    """波形点太多时按最大绝对值池化到 n 个点再上图。

    不能等距抽样：一根只有一两个样本宽的尖峰会被整个跳过，画出来是平线。
    """
    a = np.asarray(arr, dtype=float)
    if len(a) <= n:
        return a
    edges = np.linspace(0, len(a), n + 1).astype(int)
    out = []
    for i, j in zip(edges[:-1], edges[1:]):
        seg = a[i:max(j, i + 1)]
        # 保留符号：取绝对值最大的那个原始点，不是取 max
        out.append(float(seg[np.argmax(np.abs(seg))]))
    return np.array(out)
