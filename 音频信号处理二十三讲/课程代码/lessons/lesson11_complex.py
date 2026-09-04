# -*- coding: utf-8 -*-
"""第 11 课 · 复数的模与相位。

跑法（在 project/ 目录下）：
    python lessons/lesson11_complex.py

对应 source_course/11 - Complex numbers.../PDF。PPT 的顺序是：
为什么需要复数 → 第一个复数（实部、虚部）→ 画到平面上（直角坐标）→
极坐标表示（模与角）→ 欧拉公式 → 欧拉恒等式 → 角度的几何含义。
本脚本按同一顺序走。

这一课的关键连接点：第 10 课那两支试探波（正弦一支、余弦一支）给出的
两个读数，正好就是一个复数的虚部和实部。所以「为什么要两支」和
「为什么要复数」是同一个问题。
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

import numpy as np

from soundlab import io
from soundlab.figdata import dump
from soundlab.probe import probe, magnitude, phase

SR = 4000


def make_signal(kind="sin", phi=0.0):
    """和第 10 课同一个信号：440 Hz 幅度 1.0 ＋ 880 Hz 幅度 0.5。"""
    t = np.arange(SR) / SR
    f = np.sin if kind == "sin" else np.cos
    return f(2 * np.pi * 440 * t + phi) + 0.5 * f(2 * np.pi * 880 * t + phi)


def step1_why():
    """PPT p6：为什么非要复数不可。"""
    print("[正文] 第 1 步 · 为什么非要复数不可")
    print("  第 10 课的结论：每个频率要问出两个数——强度，和从哪里起步。")
    print("  强度是一个实数，用一个数就装得下。")
    print("  可「强度 + 起点」是两个数，一个实数装不下两个数。")
    print("  能不能找到一种数，一个就装下这两样？——这就是复数要解决的事。")
    print()


def step2_first_complex():
    """PPT p14/p16：第一个复数，实部与虚部，画到平面上。"""
    print("[正文] 第 2 步 · 一个复数就是平面上的一个点")
    z = complex(3, 4)
    print(f"  取一个复数 z = {z.real:.0f} + {z.imag:.0f}i")
    print(f"    实部 Re(z) = {z.real:.0f}   ← 横坐标")
    print(f"    虚部 Im(z) = {z.imag:.0f}   ← 纵坐标")
    print("  把实部当横坐标、虚部当纵坐标，一个复数就是平面上的一个点。")
    print("  这叫直角坐标表示：用「往右多远、往上多远」定位。")
    print()
    return z


def step3_polar(z):
    """PPT p17–p25：同一个点的另一种说法——模和角。"""
    print("[正文] 第 3 步 · 同一个点的另一种说法：模和角")
    r = abs(z)
    g = np.angle(z)
    print(f"  模  |z| = sqrt({z.real:.0f}^2 + {z.imag:.0f}^2) = {r:.4f}"
          f"   ← 离原点多远")
    print(f"  角  γ  = arctan({z.imag:.0f}/{z.real:.0f}) = {g:.4f} 弧度"
          f" = {np.degrees(g):.2f}°   ← 朝哪个方向")
    # 从极坐标转回直角坐标，验证两种说法等价
    back = r * np.cos(g) + 1j * r * np.sin(g)
    print(f"  转回去：{r:.4f}·cos({g:.4f}) + {r:.4f}·sin({g:.4f})i"
          f" = {back.real:.4f} + {back.imag:.4f}i")
    print(f"  和原来的 z 一致：{np.isclose(back, z)}")
    print("  两种说法装的信息一样多，只是一个用「右多远、上多远」，")
    print("  另一个用「多远、朝哪」。后者正好对上我们要的「强度 + 起点」。")
    print()
    return r, g


def step4_euler():
    """PPT p32/p34：欧拉公式和欧拉恒等式。"""
    print("[正文] 第 4 步 · 欧拉公式：把「模和角」写成一个乘法")
    print("  欧拉公式：e^(iγ) = cos(γ) + i·sin(γ)")
    checks = []
    for g in (0.0, np.pi / 4, np.pi / 2, np.pi):
        left = np.exp(1j * g)
        right = np.cos(g) + 1j * np.sin(g)
        ok = bool(np.isclose(left, right))
        checks.append({"gamma": float(g), "ok": ok,
                       "re": float(left.real), "im": float(left.imag)})
        print(f"    γ = {g:.4f}：左边 {left.real:+.4f}{left.imag:+.4f}i，"
              f"右边 {right.real:+.4f}{right.imag:+.4f}i，相等 {ok}")
    print("  所以任何复数都能写成 z = |z| · e^(iγ)——模乘上一个「只管方向」的因子。")
    print()
    ident = np.exp(1j * np.pi) + 1
    print(f"  取 γ = π，得欧拉恒等式：e^(iπ) + 1 = {ident.real:.2e}"
          f" + {ident.imag:.2e}i，也就是 0。")
    print("  它把 e、i、π、1、0 五个常数串在了一起。")
    print()
    return checks


def step5_direction():
    """PPT p44–p50：角度的几何含义。"""
    print("[正文] 第 5 步 · 角决定方向")
    rows = []
    for g, name in [(np.pi / 4, "π/4"), (np.pi / 2, "π/2"),
                    (np.pi, "π"), (-np.pi / 2, "−π/2")]:
        z = np.exp(1j * g)
        rows.append({"label": name, "gamma": float(g),
                     "re": float(z.real), "im": float(z.imag)})
        print(f"  γ = {name:>5}（{np.degrees(g):+7.1f}°）"
              f" -> {z.real:+.4f}{z.imag:+.4f}i")
    print("  模都是 1，只有方向不同——角就是「指向哪儿」。")
    print()
    return rows


def step6_back_to_lesson10():
    """把第 10 课那两支试探波接到复数上。"""
    print("[正文] 第 6 步 · 第 10 课那两支试探波，就是一个复数")
    sig = make_signal("sin")
    f = 440.0
    a_sin = probe(sig, f, SR, "sin")
    a_cos = probe(sig, f, SR, "cos")
    z = complex(a_cos, a_sin)          # 余弦那支当实部，正弦那支当虚部
    print(f"  在 {f:.0f} Hz 上，第 10 课量到两个数：")
    print(f"    余弦那支 {a_cos:+.4f}   ← 当实部")
    print(f"    正弦那支 {a_sin:+.4f}   ← 当虚部")
    print(f"  拼成一个复数 z = {z.real:+.4f}{z.imag:+.4f}i")
    m = magnitude(sig, f, SR)
    ph = phase(sig, f, SR)
    print(f"  它的模 |z| = {abs(z):.4f}，和第 10 课的强度 {m:.4f} 一致："
          f"{np.isclose(abs(z), m)}")
    print(f"  它的角 = {np.angle(z):+.4f} 弧度，和第 10 课的相位 {ph:+.4f} 一致："
          f"{np.isclose(np.angle(z), ph)}")
    print()

    # 把起点挪四分之一圈，看模不变、角变
    sig_c = make_signal("cos")
    z2 = complex(probe(sig_c, f, SR, "cos"), probe(sig_c, f, SR, "sin"))
    print("  把信号的起点挪四分之一圈，再算一次：")
    print(f"    z = {z.real:+.4f}{z.imag:+.4f}i   模 {abs(z):.4f}  "
          f"角 {np.angle(z):+.4f}")
    print(f"    z'= {z2.real:+.4f}{z2.imag:+.4f}i   模 {abs(z2):.4f}  "
          f"角 {np.angle(z2):+.4f}")
    print(f"  模几乎没变（差 {abs(abs(z) - abs(z2)):.2e}），"
          f"角差了 {abs(np.angle(z) - np.angle(z2)):.4f} 弧度"
          f" = {np.degrees(abs(np.angle(z) - np.angle(z2))):.1f}°")
    print("  正好四分之一圈。模记「有多强」，角记「从哪里起步」——")
    print("  一个复数，两件事都装下了。这就是第 12 课要用它的全部理由。")
    print()
    return {"z": [float(z.real), float(z.imag)],
            "z_shift": [float(z2.real), float(z2.imag)],
            "mag": float(abs(z)), "mag_shift": float(abs(z2)),
            "ang": float(np.angle(z)), "ang_shift": float(np.angle(z2))}


def extra_rotation():
    """正文没放：乘一个 e^(iγ) 就是旋转，模一点不变。"""
    print("[脚本额外] 乘以 e^(iγ) 等于把这个点绕原点转 γ")
    z = complex(3, 4)
    print(f"  起点 z = {z.real:.0f}{z.imag:+.0f}i，模 {abs(z):.4f}，"
          f"角 {np.angle(z):+.4f}")
    for g, name in [(np.pi / 2, "π/2"), (np.pi, "π")]:
        w = z * np.exp(1j * g)
        print(f"  乘 e^(i·{name})：{w.real:+.4f}{w.imag:+.4f}i，"
              f"模 {abs(w):.4f}，角 {np.angle(w):+.4f}")
    print("  三行的模都是 5.0000——乘一个模为 1 的复数只改方向，不改长度。")
    print("  第 12 课的公式里那个 e 的指数项，做的就是这件事。")
    print()


def dump_figures(z, r, g, euler, dirs, link):
    path = dump(11, {
        "z": [float(z.real), float(z.imag)],
        "r": float(r), "gamma": float(g),
        "euler": euler,
        "directions": dirs,
        "link": link,
        "sr": SR,
    })
    print(f"[配图数据] 写好了 {path}")


if __name__ == "__main__":
    step1_why()
    z = step2_first_complex()
    r, g = step3_polar(z)
    euler = step4_euler()
    dirs = step5_direction()
    link = step6_back_to_lesson10()
    extra_rotation()
    if "--dump" in sys.argv:
        dump_figures(z, r, g, euler, dirs, link)
