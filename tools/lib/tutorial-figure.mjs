// 教程式配图的公共画板。
//
// 教程式结构里有几种段落反复出现同样的形状——最典型的是 Before/After 的
// 「两条路线」对比，01、02、03、05 都要用。抽到这里，四篇的版式才不会各画各的。
//
// 配色和 tools/lib/figure.mjs 的 PALETTE 一致，两套图放在同一篇文章里不会打架。

export const BLUE = '#0878b9';
export const WARM = '#c65a3d';
export const GREEN = '#3b8f68';
export const GOLD = '#a5761a';
export const INK = '#1f2933';
export const MUTED = '#5b6673';
export const GRID = '#d7dfe6';
export const PLATE = '#f5f8fa';
export const FONT = 'Microsoft YaHei, PingFang SC, Noto Sans SC, Hiragino Sans GB, sans-serif';

export const MODES = {
  desktop: { name: 'desktop', W: 880, pad: 30, h1: 22, h2: 17, body: 15, small: 14 },
  mobile: { name: 'mobile', W: 420, pad: 20, h1: 18, h2: 16, body: 14.5, small: 14 },
};
export const wide = (M) => M.name === 'desktop';
export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const doc = (w, h, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" `
  + `font-family="${FONT}" fill="${INK}" role="img" aria-label="${esc(label)}">\n`
  + `<rect width="${w}" height="${h}" fill="#fff"/>\n${body}\n</svg>\n`;

export const T = (x, y, s, o = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.size ?? 15}" `
  + `font-weight="${o.weight ?? 400}" fill="${o.fill ?? INK}" `
  + `text-anchor="${o.anchor ?? 'start'}">${esc(s)}</text>`;

export const MT = (x, y, lines, o = {}) => {
  const lead = o.leading ?? Math.round((o.size ?? 15) * 1.5);
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.size ?? 15}" `
    + `font-weight="${o.weight ?? 400}" fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? 'start'}">`
    + lines.map((l, i) => `<tspan x="${x.toFixed(1)}" dy="${i ? lead : 0}">${esc(l)}</tspan>`).join('')
    + '</text>';
};

export const R = (x, y, w, h, o = {}) =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" `
  + `rx="${o.r ?? 8}" fill="${o.fill ?? 'none'}" stroke="${o.stroke ?? GRID}" `
  + `stroke-width="${o.sw ?? 1}"/>`;

export const L = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" `
  + `stroke="${o.c ?? GRID}" stroke-width="${o.w ?? 1.4}"`
  + `${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} stroke-linecap="round"/>`;

export const P = (pts, o = {}) =>
  `<polyline points="${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')}" `
  + `fill="none" stroke="${o.c ?? BLUE}" stroke-width="${o.w ?? 1.8}" stroke-linejoin="round"/>`;

export const O = (x, y, r, o = {}) =>
  `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${o.fill ?? BLUE}" `
  + `stroke="${o.stroke ?? 'none'}" stroke-width="${o.sw ?? 1}"/>`;

export function ARROW(x1, y1, x2, y2, o = {}) {
  const c = o.c ?? MUTED;
  const hd = o.head ?? 7;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p = [[x2, y2],
    [x2 - hd * Math.cos(a - 0.5), y2 - hd * Math.sin(a - 0.5)],
    [x2 - hd * Math.cos(a + 0.5), y2 - hd * Math.sin(a + 0.5)]];
  return L(x1, y1, x2, y2, { c, w: o.w ?? 1.8 })
    + `<polygon points="${p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ')}" fill="${c}"/>`;
}

export const header = (M, lines) => (wide(M)
  ? T(M.pad, 36, lines.join(''), { size: M.h1, weight: 700 })
  : MT(M.pad, 30, lines, { size: M.h1, weight: 700, leading: 25 }));
export const headerH = (M, lines) => (wide(M) ? 58 : 30 + (lines.length - 1) * 25 + 24);

/**
 * Before/After 的「两条路线」对比。教程式第 2 段的标准版式。
 *
 * routes: [{ tag, color, fill, steps: [...], end, note }, ...]
 * 电脑版横排、箭头相连；手机版竖排、箭头朝下，说明统一挪到最下面。
 */
export function twoRoutes(M, head, routes, label) {
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const w = wide(M);
  let s = header(M, head);
  let y = top + 6;

  routes.forEach((r) => {
    const items = [...r.steps, r.end];
    const rowH = w ? 118 : 40 + items.length * 38;
    s += R(px, y, pw, rowH, { fill: r.fill, stroke: r.color, sw: 1.6, r: 10 });
    s += T(px + 16, y + 26, r.tag, { size: M.h2, weight: 700, fill: r.color });

    if (w) {
      const bw = (pw - 32 - (items.length - 1) * 22) / items.length;
      items.forEach((label2, i) => {
        const bx = px + 16 + i * (bw + 22);
        const last = i === items.length - 1;
        s += R(bx, y + 40, bw, 34, {
          fill: '#fff', stroke: last ? r.color : GRID, sw: last ? 2 : 1, r: 6,
        });
        s += T(bx + bw / 2, y + 61, label2, {
          size: M.small, weight: last ? 700 : 400, fill: last ? r.color : INK, anchor: 'middle',
        });
        if (!last) s += ARROW(bx + bw + 4, y + 57, bx + bw + 18, y + 57, { c: r.color });
      });
      s += T(px + 16, y + 98, r.note, { size: M.small, fill: MUTED });
    } else {
      items.forEach((label2, i) => {
        const by = y + 38 + i * 38;
        const last = i === items.length - 1;
        s += R(px + 16, by, pw - 32, 26, {
          fill: '#fff', stroke: last ? r.color : GRID, sw: last ? 2 : 1, r: 6,
        });
        s += T(px + 26, by + 18, label2, {
          size: M.small, weight: last ? 700 : 400, fill: last ? r.color : INK,
        });
        if (!last) s += ARROW(px + 30, by + 27, px + 30, by + 36, { c: r.color, head: 5 });
      });
    }
    y += rowH + (w ? 18 : 14);
  });

  if (!w) {
    s += MT(px, y + 4, routes.map((r) => `${r.tag}：${r.note}`),
      { size: M.small, fill: MUTED, leading: 21 });
    y += 22 * routes.length + 12;
  }
  return doc(M.W, y + 10, s, label);
}

/** 一条从上到下（手机）或从左到右（电脑）的链条，每一环之间写清为什么要走这一步。 */
export function chain(M, head, steps, tail, label) {
  const top = headerH(M, head);
  const px = M.pad;
  const pw = M.W - M.pad * 2;
  const w = wide(M);
  let s = header(M, head);
  let y = top + 8;

  if (w) {
    const bw = (pw - (steps.length - 1) * 30) / steps.length;
    // 环之间那句「为什么」只有四步以内才放得下；六步时字会互相压住，
    // 桌面版索性不画，正文紧接着的项目符号里本来就逐条写了。
    const showWhy = steps.length <= 4;
    steps.forEach((st, i) => {
      const bx = px + i * (bw + 30);
      s += R(bx, y, bw, 92, { fill: st.fill ?? PLATE, stroke: st.color ?? GRID, sw: 1.6, r: 9 });
      s += T(bx + bw / 2, y + 30, st.name, { size: M.h2, weight: 700, fill: st.color ?? INK, anchor: 'middle' });
      s += MT(bx + bw / 2, y + 54, st.desc, { size: M.small, fill: MUTED, anchor: 'middle', leading: 19 });
      if (i < steps.length - 1) {
        s += ARROW(bx + bw + 5, y + 46, bx + bw + 25, y + 46, { c: MUTED, w: 2 });
        if (st.why && showWhy) {
          s += T(bx + bw + 15, y + 112, st.why, { size: M.small, fill: MUTED, anchor: 'middle' });
        }
      }
    });
    y += 92 + (showWhy && steps.some((st) => st.why) ? 34 : 12);
  } else {
    steps.forEach((st, i) => {
      s += R(px, y, pw, 54, { fill: st.fill ?? PLATE, stroke: st.color ?? GRID, sw: 1.6, r: 9 });
      s += T(px + 14, y + 24, st.name, { size: M.h2, weight: 700, fill: st.color ?? INK });
      // desc 的两行在电脑版是上下排的，手机版要挤成一行。多数图的两行本来就是
      // 一句话拆开的（「声源每秒」+「放出多少」），直接接起来就通顺；接起来
      // 读不通的图自己给一个 mdesc。
      s += T(px + 14, y + 44, st.mdesc ?? st.desc.join(''), { size: M.small, fill: MUTED });
      if (i < steps.length - 1) {
        s += ARROW(px + 26, y + 56, px + 26, y + 70, { c: MUTED, w: 2, head: 6 });
        if (st.why) s += T(px + 40, y + 69, st.why, { size: M.small, fill: MUTED });
      }
      y += 74;
    });
    y -= 20;
  }
  if (tail) {
    s += T(px, y + 24, tail, { size: M.body, weight: 700, fill: WARM });
    y += 32;
  }
  return doc(M.W, y + 14, s, label);
}

/**
 * 一块带边框和标题的画板，返回把「数据坐标 → 画布坐标」的两个换算函数。
 * 07–10 课几乎每张图都要在真实曲线上再标注点和线，所以换算必须共用一套，
 * 不能每张图各写各的——第 01 课就是因为两处各算各的，同一份数据画出过两个结论。
 */
export function panel(x, y, w, h, o = {}) {
  const [x0, x1] = o.xr ?? [0, 1];
  const [y0, y1] = o.yr ?? [0, 1];
  const sx = (v) => x + ((v - x0) / (x1 - x0 || 1)) * w;
  const sy = (v) => y + h - ((v - y0) / (y1 - y0 || 1)) * h;
  let s = R(x, y, w, h, { fill: o.fill ?? '#fff', stroke: o.stroke ?? GRID, r: o.r ?? 6 });
  if (o.title) s += T(x, y - 8, o.title, { size: o.tsize ?? 14, weight: 700, fill: o.tfill ?? INK });
  if (o.zero && y0 < 0 && y1 > 0) s += L(x, sy(0), x + w, sy(0), { c: GRID, dash: '3 3' });
  return { s, sx, sy, x, y, w, h };
}

/**
 * 把一串等间距的数画成折线。
 *
 * 不给 xr 时，这串数就均匀铺满整块画板的宽度——**不要**回头去查 panel 的
 * xr，那是给「数据自带横坐标」的图用的。这里踩过一次：curve 按 [0, n-1]
 * 去调 sx，而 panel 的 xr 默认是 [0,1]，于是除第一个点以外全被推到画板
 * 右边几百倍远的地方，画出来是一条贴着零线的平线，看着像数据本身是平的。
 * 给了 xr，才按 panel 的坐标系放点。
 */
export function curve(pn, vals, o = {}) {
  const n = vals.length;
  const step = (i) => (n > 1 ? i / (n - 1) : 0);
  const px = o.xr
    ? (i) => pn.sx(o.xr[0] + (o.xr[1] - o.xr[0]) * step(i))
    : (i) => pn.x + pn.w * step(i);
  return P(vals.map((v, i) => [px(i), pn.sy(v)]), { c: o.c ?? BLUE, w: o.w ?? 1.6 });
}

/** 竖排的分组柱状图。每组一个标签，组里每根柱一个颜色和一个数值文字。 */
export function bars(x, y, w, h, groups, o = {}) {
  const max = o.max ?? Math.max(...groups.flatMap((g) => g.vals.map((v) => v.v)));
  const gw = w / groups.length;
  let s = L(x, y + h, x + w, y + h, { c: GRID });
  groups.forEach((g, gi) => {
    const k = g.vals.length;
    const bw = Math.min(o.bw ?? 34, (gw - 18) / k);
    const left = x + gi * gw + (gw - bw * k - (k - 1) * 6) / 2;
    g.vals.forEach((v, i) => {
      const bh = Math.max(1, (v.v / (max || 1)) * h);
      const bx = left + i * (bw + 6);
      s += R(bx, y + h - bh, bw, bh, { fill: v.c, stroke: 'none', r: 3 });
      s += T(bx + bw / 2, y + h - bh - 6, v.t ?? String(v.v), {
        size: o.vsize ?? 13.5, weight: 700, fill: v.c, anchor: 'middle',
      });
    });
    s += T(x + gi * gw + gw / 2, y + h + 18, g.name, {
      size: o.lsize ?? 14, fill: MUTED, anchor: 'middle',
    });
  });
  return s;
}

/** 图例：一排小色块加名字。 */
export const legend = (x, y, items, o = {}) => items.map((it, i) => {
  const cx = x + i * (o.gap ?? 110);
  return R(cx, y - 8, 14, 10, { fill: it.c, stroke: 'none', r: 2 })
    + T(cx + 20, y, it.name, { size: o.size ?? 14, fill: MUTED });
}).join('');
