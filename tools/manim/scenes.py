# 课程动画试做。三个候选场景，用来判断哪些图值得动起来。
#
#   .\render.ps1 FourierWinding
#   .\render.ps1 Aliasing -q h -gif
#
# 配色、字体、白底都跟正文配图保持一致，动画只是同一套图的「会动的版本」，
# 不是另一种视觉风格。

import numpy as np
from manim import *
from pathlib import Path
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / 'source_course' / 'audio_resources'

# 正文配图的配色，逐字照搬
INK = '#1f2933'
MUTED = '#5b6673'
GRID = '#d7dfe6'
BLUE = '#0878b9'
WARM = '#c65a3d'
GREEN = '#3b8f68'
FONT = 'Microsoft YaHei'

config.background_color = '#ffffff'

Text.set_default(font=FONT, color=INK)


def zh(t, size=28, color=INK, weight=NORMAL):
    return Text(t, font_size=size, color=color, weight=weight)


def axes(xr, yr, xl, yl, **kw):
    return Axes(
        x_range=xr, y_range=yr, x_length=xl, y_length=yl, tips=False,
        axis_config={'color': GRID, 'stroke_width': 2,
                     'include_ticks': True, 'tick_size': 0.05},
        **kw)


def ticklabels(ax, xs=None, ys=None, size=20):
    """坐标刻度自己画：Axes 自带的数字标签在白底上颜色和字体都不好控。"""
    g = VGroup()
    for v, lab in (xs or []):
        g.add(zh(lab, size, MUTED).next_to(ax.c2p(v, ax.y_range[0]), DOWN, buff=0.16))
    for v, lab in (ys or []):
        g.add(zh(lab, size, MUTED).next_to(ax.c2p(ax.x_range[0], v), LEFT, buff=0.16))
    return g


# ---------------------------------------------------------------- 第 10 课
class FourierWinding(Scene):
    """傅里叶变换的直觉：用一个已知频率去卷信号，卷对了重心才跑得远。"""

    def construct(self):
        T = 4.0                       # 3 Hz 走满 12 圈、5 Hz 走满 20 圈，峰才够干净
        ts = np.linspace(0, T, 1600)

        def g(t):
            return 1 + 0.8 * np.cos(2 * PI * 3 * t) + 0.6 * np.cos(2 * PI * 5 * t)

        gs = g(ts)

        title = zh('用一个已知频率去试探，对上了才有大回应', 32, INK, BOLD)
        title.to_edge(UP, buff=0.3)

        # 上：原始信号
        sax = axes([0, T, 1], [-0.4, 2.6, 1], 11.6, 1.4).next_to(title, DOWN, buff=0.46)
        scurve = sax.plot(g, x_range=[0, T, 0.002], color=BLUE, stroke_width=2.6)
        slab = zh('一段声音：3 Hz 与 5 Hz 叠在一起', 22, MUTED)
        slab.next_to(sax, UP, buff=0.08).align_to(sax, LEFT)

        self.play(Write(title), run_time=1.0)
        self.play(Create(sax), FadeIn(slab), Create(scurve), run_time=1.6)

        f = ValueTracker(0.5)

        # 左下：把信号绕在圆上
        wax = axes([-2.7, 2.7, 1], [-2.7, 2.7, 1], 3.3, 3.3)
        wax.move_to([-4.45, -1.2, 0])
        wlab = zh('把它绕在圆上', 24, MUTED).next_to(wax, UP, buff=0.1)

        idx = range(0, len(ts), 2)

        def wound():
            a = 2 * PI * f.get_value() * ts
            pts = [wax.c2p(gs[i] * np.cos(a[i]), -gs[i] * np.sin(a[i])) for i in idx]
            return VMobject(color=BLUE, stroke_width=1.8,
                            stroke_opacity=0.85).set_points_as_corners(pts)

        AMP = 3.0    # 重心本身只有 0.4 上下，放大才看得见；标注里写清楚了

        def com_xy():
            a = 2 * PI * f.get_value() * ts
            return (gs * np.cos(a)).mean() * AMP, (-gs * np.sin(a)).mean() * AMP

        # 右下：每个试探频率得到多大回应
        pax = axes([0.5, 6.5, 1], [0, 0.5, 0.1], 6.7, 3.3)
        pax.move_to([3.2, -1.2, 0])
        plab = zh('每个试探频率得到的回应', 24, MUTED).next_to(pax, UP, buff=0.1)
        pticks = ticklabels(
            pax,
            xs=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5'), (6, '6 Hz')],
            ys=[(0, '0'), (0.2, '0.2'), (0.4, '0.4')])

        fg = np.linspace(0.5, 6.5, 601)
        resp = np.array([abs(np.mean(gs * np.exp(-2j * PI * ff * ts))) for ff in fg])

        def spectrum():
            k = max(2, int(np.searchsorted(fg, f.get_value())))
            pts = [pax.c2p(fg[i], resp[i]) for i in range(k)]
            return VMobject(color=WARM, stroke_width=3.5).set_points_as_corners(pts)

        self.play(FadeIn(wlab), FadeIn(plab), Create(wax), Create(pax),
                  FadeIn(pticks), run_time=1.2)

        self.add(
            always_redraw(wound),
            always_redraw(lambda: Line(wax.c2p(0, 0), wax.c2p(*com_xy()),
                                       color=WARM, stroke_width=3)),
            always_redraw(lambda: Dot(wax.c2p(*com_xy()), color=WARM, radius=0.1)),
            always_redraw(spectrum),
            always_redraw(lambda: zh(f'试探频率 {f.get_value():.2f} Hz', 26, WARM, BOLD)
                          .next_to(wax, DOWN, buff=0.18)),
        )
        note = zh('红点＝绕完之后的重心（放大 3 倍看）', 20, MUTED)
        note.next_to(wax, DOWN, buff=0.66)
        self.play(FadeIn(note), run_time=0.6)

        self.play(f.animate.set_value(6.5), run_time=13, rate_func=linear)

        # 收尾：标出两个峰
        marks = VGroup()
        for hz in (3, 5):
            y = resp[np.argmin(abs(fg - hz))]
            marks.add(DashedLine(pax.c2p(hz, 0), pax.c2p(hz, y), color=GREEN, stroke_width=2.5))
            marks.add(zh(f'{hz} Hz', 24, GREEN, BOLD).next_to(pax.c2p(hz, y), UP, buff=0.1))
        self.play(FadeIn(marks), run_time=0.8)
        self.wait(1.8)


# ---------------------------------------------------------------- 第 04 课
class Aliasing(Scene):
    """采样率不够时，高频会变成一个根本不存在的低频，而且回不来。"""

    def construct(self):
        F = 9.0
        title = zh('采样点太稀，高频会假装成另一个低频', 32, INK, BOLD).to_edge(UP, buff=0.36)

        ax = axes([0, 1, 0.1], [-1.3, 1.3, 0.5], 11.6, 3.0)
        ax.move_to([0.2, 0.8, 0])
        ticks = ticklabels(ax, xs=[(0, '0'), (0.5, '0.5'), (1, '1.0 秒')],
                           ys=[(-1, '-1'), (0, '0'), (1, '1')])
        true_c = ax.plot(lambda t: np.sin(2 * PI * F * t), x_range=[0, 1, 0.001],
                         color=BLUE, stroke_width=2.6)
        tlab = zh('真实的声音：9 Hz', 24, BLUE, BOLD)
        tlab.next_to(ax, UP, buff=0.1).align_to(ax, LEFT)

        self.play(Write(title), run_time=0.9)
        self.play(Create(ax), FadeIn(ticks), FadeIn(tlab), Create(true_c), run_time=1.8)

        stage = VGroup()
        self.add(stage)

        for fs in (40, 24, 14, 12, 10):
            tt = np.arange(int(fs) + 1) / fs
            tt = tt[tt <= 1.0]
            dots = VGroup(*[Dot(ax.c2p(t, np.sin(2 * PI * F * t)), color=WARM, radius=0.075)
                            for t in tt])

            k = round(F / fs)
            fa = abs(F - k * fs)
            sgn = 1.0 if (F - k * fs) >= 0 else -1.0
            enough = fs > 2 * F

            if enough:
                alias = VGroup()
                seen = zh('够用：这些点只能对应 9 Hz 这一条曲线', 28, GREEN, BOLD)
            else:
                # 穿过全部采样点的那条低频曲线，就是听感上「变调」的结果
                alias = VGroup(ax.plot(lambda t: sgn * np.sin(2 * PI * fa * t),
                                       x_range=[0, 1, 0.001], color=WARM, stroke_width=3.4))
                seen = zh(f'不够：这些点看起来像 {fa:.0f} Hz，9 Hz 再也回不来了', 28, WARM, BOLD)

            fs_lab = zh(f'采样率 {fs} Hz　·　每秒只记 {fs} 个点', 30, INK, BOLD)
            fs_lab.move_to([0, -1.55, 0])
            seen.move_to([0, -2.35, 0])

            new = VGroup(dots, alias, fs_lab, seen)
            # 汉字之间不能用 Transform 硬变形，字形会互相拉扯成乱码，只能整块换
            self.play(FadeOut(stage), FadeIn(new), run_time=0.6)
            self.remove(stage)
            stage = new
            self.add(stage)
            self.wait(1.6)

        rule = zh('结论：采样率至少要是最高频率的两倍', 32, INK, BOLD).move_to([0, -2.35, 0])
        self.play(FadeOut(stage[2]), FadeOut(stage[3]), FadeIn(rule), run_time=0.8)
        self.wait(2.0)


# ---------------------------------------------------------------- 第 15 课
class StftBuild(Scene):
    """声谱图是一列一列算出来的：窗滑到哪里，哪一列才存在。"""

    def construct(self):
        sr, data = wavfile.read(AUDIO / 'scale.wav')
        x = data.astype(np.float64)
        if x.ndim > 1:
            x = x.mean(axis=1)
        x /= max(1e-9, np.abs(x).max())
        x = x[::2]                     # 降到 22050，够看且算得快
        sr //= 2
        x = x[:int(2.9 * sr)]          # scale.wav 把音阶弹了两遍，只取第一遍
        dur = len(x) / sr

        n_fft, hop = 1024, 256
        win = np.hanning(n_fft)
        frames = 1 + (len(x) - n_fft) // hop
        S = np.empty((n_fft // 2 + 1, frames), dtype=np.float32)
        for i in range(frames):
            S[:, i] = np.abs(np.fft.rfft(x[i * hop:i * hop + n_fft] * win))
        db = 20 * np.log10(S + 1e-9)
        db = np.clip(db - db.max(), -80, 0)
        db = db[:int((4000 / (sr / 2)) * db.shape[0])]     # 音阶都在 0–4000 Hz 里

        import matplotlib
        magma = matplotlib.colormaps['magma']
        img = (magma((db + 80) / 80)[..., :3] * 255).astype(np.uint8)[::-1]   # 低频在下

        title = zh('声谱图是一列一列算出来的', 32, INK, BOLD).to_edge(UP, buff=0.34)

        wax = axes([0, dur, 1], [-1.1, 1.1, 0.5], 11.2, 1.6)
        wax.next_to(title, DOWN, buff=0.44)
        wax.y_axis.set_opacity(0)
        step = max(1, len(x) // 2400)
        wave = VMobject(color=BLUE, stroke_width=1.4).set_points_as_corners(
            [wax.c2p(i * step / sr, float(x[i * step])) for i in range(len(x) // step)])
        wlab = zh('一段音阶的波形', 22, MUTED).next_to(wax, UP, buff=0.06).align_to(wax, LEFT)

        self.play(Write(title), run_time=0.9)
        self.play(Create(wax), FadeIn(wlab), Create(wave), run_time=1.6)

        spec = ImageMobject(img)
        spec.set_resampling_algorithm(RESAMPLING_ALGORITHMS['bilinear'])
        spec.stretch_to_fit_width(wax.x_axis.get_length())
        spec.stretch_to_fit_height(3.3)
        spec.move_to([wax.x_axis.get_center()[0], -1.45, 0])
        slab = zh('每一列就是那一小段的频率成分', 22, MUTED)
        slab.next_to(spec, UP, buff=0.08).align_to(spec, LEFT)
        ylab = VGroup(zh('4000', 20, MUTED).next_to(spec, LEFT, buff=0.12).align_to(spec, UP),
                      zh('0 Hz', 20, MUTED).next_to(spec, LEFT, buff=0.12).align_to(spec, DOWN))
        self.add(spec, slab, ylab)

        L, Wd = spec.get_left()[0], spec.width
        p = ValueTracker(0.0)

        # 白幕从左往右退，露出已经算好的那些列
        def cover():
            w = max(1e-3, Wd * (1 - p.get_value()))
            return Rectangle(width=w, height=spec.height + 0.06, fill_color='#ffffff',
                             fill_opacity=1, stroke_width=0).move_to(
                [L + Wd - w / 2, spec.get_center()[1], 0])

        cv = always_redraw(cover)
        self.add(cv)
        # 边框画在白幕上面，未算出来的部分才看得出「画布已经在那了」
        self.add(SurroundingRectangle(spec, color=GRID, stroke_width=2, buff=0))

        winw = wax.c2p(n_fft / sr, 0)[0] - wax.c2p(0, 0)[0]
        winrect = always_redraw(lambda: Rectangle(
                width=winw, height=wax.y_length * 0.98, color=WARM, stroke_width=3,
                fill_color=WARM, fill_opacity=0.13).move_to(
                [wax.c2p(p.get_value() * dur, 0)[0], wax.c2p(0, 0)[1], 0]))
        link = always_redraw(lambda: DashedLine(
                [L + Wd * p.get_value(), wax.get_bottom()[1] - 0.04, 0],
                [L + Wd * p.get_value(), spec.get_top()[1] + 0.04, 0],
                color=WARM, stroke_width=2, dash_length=0.08).set_opacity(0.55))
        cursor = always_redraw(lambda: Line(
                [L + Wd * p.get_value(), spec.get_bottom()[1], 0],
                [L + Wd * p.get_value(), spec.get_top()[1], 0],
                color=WARM, stroke_width=3))
        self.add(winrect, link, cursor)
        self.wait(0.6)
        self.play(p.animate.set_value(1.0), run_time=9, rate_func=linear)
        for m in (cv, winrect, link, cursor):
            m.clear_updaters()
        self.remove(cv, winrect, link, cursor)

        done = zh('窗滑过一遍，声谱图才算完整', 28, INK, BOLD)
        done.next_to(spec, DOWN, buff=0.26)
        self.play(FadeIn(done), run_time=0.8)
        self.wait(1.8)
