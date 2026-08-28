#!/usr/bin/env node
// 把 tmp/proto 里的原型拼成一张对比页，用于选型。
//   node tools/build-compare-page.mjs

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROTO = join(ROOT, 'tmp', 'proto');
const OUT = join(ROOT, 'tmp', 'figure-compare.html');

const svg = (name) => readFileSync(join(PROTO, name), 'utf8')
  .replace(/^<\?xml[^>]*\?>\s*/, '')
  .replace(/ width="\d+" height="\d+"/, ' width="100%" height="auto"');
const png = (name) => `data:image/png;base64,${readFileSync(join(PROTO, name)).toString('base64')}`;

const CSS = `
:root{
  --bg:#f6f7f9; --panel:#fff; --ink:#0b0b0b; --ink2:#52514e; --muted:#6f7b89;
  --line:#e3e7ea; --accent:#2a78d6; --warn:#eb6834; --good:#1baf7a; --code:#f2f4f7;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#111418; --panel:#181c21; --ink:#eef2f6; --muted:#93a1b0; --ink2:#c3cbd4;
  --line:#293139; --accent:#5aa9e6; --warn:#f08a5f; --good:#4fc79a; --code:#1e242b;
}}
:root[data-theme="dark"]{
  --bg:#111418; --panel:#181c21; --ink:#eef2f6; --muted:#93a1b0; --ink2:#c3cbd4;
  --line:#293139; --accent:#5aa9e6; --warn:#f08a5f; --good:#4fc79a; --code:#1e242b;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.85;
 font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:16px}
.wrap{max-width:1140px;margin:0 auto;padding:56px 22px 110px}
h1{font-family:"Noto Serif SC",Georgia,serif;font-size:30px;line-height:1.35;margin:0 0 10px;text-wrap:balance}
h2{font-family:"Noto Serif SC",Georgia,serif;font-size:21px;margin:56px 0 6px;padding-top:26px;border-top:1px solid var(--line)}
h3{font-size:16.5px;margin:30px 0 8px}
p{margin:0 0 14px;max-width:66ch}
.lede{color:var(--ink2);font-size:16.5px;max-width:64ch;margin-bottom:8px}
.eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:11.5px;letter-spacing:.16em;
 color:var(--accent);margin:0 0 12px}
.fig{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;margin:16px 0}
.fig svg,.fig img{display:block;width:100%;height:auto;border-radius:6px}
.cap{color:var(--muted);font-size:13px;margin:10px 2px 0;line-height:1.7}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px;margin:18px 0}
.phone{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:12px;
 width:390px;max-width:100%;margin:0 auto}
.phone .screen{width:100%;border-radius:10px;overflow:hidden;background:#fff}
.phone .screen svg{display:block;width:100%;height:auto}
.phones{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;margin:20px 0}
.phones figcaption{text-align:center;color:var(--muted);font-size:12.5px;margin-top:8px}
table{border-collapse:collapse;width:100%;font-size:14.5px;margin:14px 0}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:10px}
th,td{padding:10px 13px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top;line-height:1.7}
th{background:var(--code);font-weight:650;white-space:nowrap}
tr:last-child td{border-bottom:0}
code{background:var(--code);padding:1px 6px;border-radius:4px;font-size:.9em;
 font-family:ui-monospace,Consolas,monospace}
pre{background:var(--code);border:1px solid var(--line);border-radius:9px;padding:14px 16px;
 overflow-x:auto;font-size:13.5px;line-height:1.7;margin:0 0 16px}
pre code{background:none;padding:0}
.pick{border-left:3px solid var(--good);background:color-mix(in srgb,var(--good) 8%,transparent);
 border-radius:0 10px 10px 0;padding:14px 18px;margin:18px 0}
.pick strong{color:var(--good)}
.warn{border-left:3px solid var(--warn);background:color-mix(in srgb,var(--warn) 8%,transparent);
 border-radius:0 10px 10px 0;padding:14px 18px;margin:18px 0}
ul,ol{max-width:66ch;padding-left:1.5em}
li{margin:0 0 8px}
.tag{display:inline-block;font-size:11.5px;padding:2px 9px;border-radius:99px;border:1px solid var(--line);
 color:var(--muted);margin-right:6px;font-family:ui-monospace,Consolas,monospace}
`;

const page = `<title>配图选型对比</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;650&family=Noto+Serif+SC:wght@500;600&display=swap">
<style>${CSS}</style>
<div class="wrap">

<p class="eyebrow">第 01–05 课 · 配图与结构</p>
<h1>声谱图该怎么画：三条路线、三种色标、两个版式</h1>
<p class="lede">现在文章里的"声谱图"其实是手绘色块，不是真的声谱图。这一页把可选方案实际做出来放在一起，供选型。所有图都由课程真实音频或与正文严格对应的合成信号计算得出。</p>

<h2>一、先看问题</h2>
<p>下面左边是现在文章里的画法。它由三条蓝色矩形和一条橙色矩形组成，本质是条形图——读者看完仍然不知道声谱图长什么样，也无法把"横线=持续成分、竖线=一次敲击"这句话和图上的东西对应起来。</p>
<div class="grid2">
  <figure class="fig">${svg('A-现状-手绘色块.svg')}
    <figcaption class="cap"><strong>现状。</strong>手绘色块。没有任何真实数据，纹理、谐波间距、衰减全部缺失。</figcaption></figure>
  <figure class="fig">${svg('C-手机版-magma.svg')}
    <figcaption class="cap"><strong>新方案。</strong>同一段信号的真实短时傅里叶变换。三条亮横线是 180/360/540 Hz 的谐波，中间那道竖亮带是第 1.25 秒的敲击。</figcaption></figure>
</div>

<h2>二、三条技术路线</h2>
<p>声谱图是一张几万个格子的热力图。用 SVG 画意味着几万个 <code>&lt;rect&gt;</code>，文件会膨胀到几 MB 且渲染很慢；这是"SVG 画声谱图效果不好"的根本原因——SVG 擅长矢量图形，不擅长连续像素场。</p>
<div class="tw"><table>
<thead><tr><th>路线</th><th>做法</th><th>优点</th><th>代价</th></tr></thead>
<tbody>
<tr><td><strong>1. 纯 SVG</strong><br><span class="tag">现状</span></td>
<td>手工摆色块，或用几万个 rect 铺满</td>
<td>文字清晰、可缩放、文件小（示意图时）</td>
<td><strong>画不了真数据。</strong>铺满 rect 时体积失控、渲染卡顿</td></tr>
<tr><td><strong>2. Node + sharp</strong><br><span class="tag">推荐</span></td>
<td>自己算 STFT，热力图渲染成 PNG，再嵌进 SVG；坐标轴和中文标注仍是真实 <code>&lt;text&gt;</code></td>
<td>真数据 + 中文清晰；单文件 SVG；无新增依赖；版式完全可控，方便出电脑/手机两版</td>
<td>DSP 要自己写（已完成，约 200 行）</td></tr>
<tr><td><strong>3. Python + librosa</strong><br><span class="tag">已装好</span></td>
<td>matplotlib 直接出 PNG</td>
<td>行业标准，函数齐全；能顺便<strong>验证文章里的 librosa 代码真的跑得通</strong></td>
<td>整图是位图，中文缩放会糊；版式受 matplotlib 限制，手机版难做</td></tr>
</tbody></table></div>

<div class="pick"><p><strong>建议：2 做正式配图，3 做验证与草图。</strong>两者并不冲突——Python 环境已经装好（numpy 2.5 / scipy 1.18 / matplotlib 3.11 / librosa 1.0），可以用来核对 DSP 结果是否与 librosa 一致，以及跑通文章里的示例代码；最终发布的图仍走 Node，保证中文在手机上不糊、体积可控。</p></div>

<h3>同一段信号，两条路线的实际产出</h3>
<div class="fig">${svg('B-电脑版-magma.svg')}
  <p class="cap"><strong>路线 2（Node）。</strong>标注用大白话，色标条写"弱—强"而不是 dB 数字，坐标轴写"低/高"。文字是矢量，放大不糊。整图 30 KB。</p></div>
<div class="fig"><img src="${png('E-matplotlib-magma.png')}" alt="matplotlib 渲染的三视图">
  <p class="cap"><strong>路线 3（matplotlib）。</strong>标准论文版式：Hz 刻度、dB 色标条。信息更严谨，但对零基础读者门槛更高，且整图是位图，86 KB。</p></div>

<h2>三、色标怎么选</h2>
<p>声学与音频领域画声谱图，事实上的标准是<strong>感知均匀色标</strong>：明度单调递增、色觉障碍下仍可读、不会像 jet 那样凭空造出并不存在的条带。下面三种都做了出来。</p>

<h3>magma —— librosa 文档里最常见</h3>
<div class="fig">${svg('D-真实录音钢琴-电脑版-magma.svg')}
  <p class="cap">课程音频 <code>piano_c.wav</code>。谐波列、起音和衰减都非常清楚，暗背景让亮线对比最强。</p></div>

<h3>viridis —— matplotlib 默认</h3>
<div class="fig">${svg('D-真实录音钢琴-电脑版-viridis.svg')}
  <p class="cap">同一段音频。整体偏冷，暗部比 magma 稍亮，弱成分更容易看见，强成分的层次略逊。</p></div>

<h3>单蓝色阶 —— 白底，与正文配色一致</h3>
<div class="fig">${svg('D-真实录音钢琴-电脑版-blue.svg')}
  <p class="cap">同一段音频。版面最轻，和文章其他插图是同一套颜色；代价是动态范围小，弱成分会直接推到白色而看不见。</p></div>

<div class="pick"><p><strong>建议：声谱图用 magma，其余图表沿用分类色。</strong>magma 是音频领域的惯例，读者以后看 librosa 文档、论文插图时能对上；同时它的高对比正好服务于"横线 / 竖线"这个核心教学点。线图、流程图、对比图仍用蓝 <code>#2a78d6</code> / 橙 <code>#eb6834</code> / 青绿 <code>#1baf7a</code> / 黄 <code>#eda100</code>——这组顺序已通过色觉障碍与对比度校验（最差相邻对 CVD ΔE 9.1，正常视觉 ΔE 22.9）。</p></div>

<h2>四、电脑版与手机版</h2>
<p>现在 20 张图全部是 420 px 竖版。手机上正好，但在电脑上会变成一条很窄的竖条，两侧大片留白，三栏对比也被迫拆成上下三段、看不出"对比"的意思。建议每张图出两版，由 <code>&lt;picture&gt;</code> 按屏幕宽度切换。</p>

<h3>电脑版：880 px，三栏并排——对比关系一眼可见</h3>
<div class="fig">${svg('B-电脑版-viridis.svg')}</div>

<h3>手机版：420 px，竖向单列——每栏都放得下</h3>
<div class="phones">
  <figure class="phone"><div class="screen">${svg('C-手机版-magma.svg')}</div>
    <figcaption>390 px 手机正文宽度 · magma</figcaption></figure>
  <figure class="phone"><div class="screen">${svg('C-手机版-blue.svg')}</div>
    <figcaption>390 px 手机正文宽度 · 单蓝色阶</figcaption></figure>
</div>

<pre><code>&lt;picture&gt;
  &lt;source media="(max-width: 640px)" srcset="figures/mobile/01-three-views.svg"&gt;
  &lt;img src="figures/desktop/01-three-views.svg" alt="同一段声音的三种表示"&gt;
&lt;/picture&gt;</code></pre>
<p>GitHub 的 Markdown 渲染支持 <code>&lt;picture&gt;</code>；预览页和网站版本也能直接用。两版由同一个生成脚本按 <code>layout</code> 参数输出，数据只算一次，不会出现两版对不上的情况。</p>

<h2>五、文章结构还能改的地方</h2>
<p>这一轮的知识点主线做得不错：标题现在能扫读，导读也给了知识链。剩下几个问题偏结构层面。</p>

<h3>1. 第 01 篇在讲两件事</h3>
<p>它有 10 个二级标题。前四个（波形 / 频谱 / 声谱图 / 表示选择）回答了开头那个小程序的问题；后面六个（采样率 / 分帧 / 模型输入 / 反推表示 / 预处理）其实是另一个主题——工程流水线。读者在第四节已经拿到答案，后面还有六节。</p>
<p>建议要么把后半段降为三级标题收进一个"从录音到模型输入还要经过什么"里，要么直接拆成两篇。</p>

<h3>2. 采样率在第 01 篇和第 04 篇各讲了一遍</h3>
<p>第 01 篇有<code>## 采样率：一秒钟记录多少个数字</code>，第 04 篇有<code>## 采样率：一秒钟量多少次</code>。第 04 篇整篇就是讲这个的。第 01 篇里保留一句话带过并链到第 04 篇即可。</p>

<h3>3. 五篇的骨架完全同构</h3>
<p>导读 → 场景 → "知识点：说明"式标题 × N → 小结。上一轮去掉了"第一层/第二层"，但"知识点：说明"这个公式套在全部 35 个标题上，又形成了新的模板感。让一两篇换个走法（比如第 04 篇本来就是"两个决定"的双线结构，第 03 篇是"三个现象"的并列结构），读起来会更像人写的。</p>

<h3>4. 五篇之间没有互链</h3>
<p>读者在第 01 篇碰到"分帧"，没有任何路径通向讲得更细的地方。在正文里做几处自然的交叉链接，比在文末堆"延伸阅读"更有用。</p>

<h3>5. 图注在复述正文</h3>
<p>多数图注是把正文那句话再说一遍。图注更应该说<strong>图上看得见、正文里没写</strong>的东西——比如"三条亮线的间距相等，这就是谐波"。</p>

<h3>6. 开头的问题，结尾没有明确收回来</h3>
<p>第 01 篇开头是那个手机小程序，小结却回到抽象的"两个朴素问题"。用一两句话回到小程序本身，闭环会更紧。</p>

<h2>六、要动的话，改动范围</h2>
<div class="tw"><table>
<thead><tr><th>做什么</th><th>影响</th></tr></thead>
<tbody>
<tr><td>把 <code>tools/lib/dsp.mjs</code> + <code>tools/lib/figure.mjs</code> 接进 <code>build-figures.mjs</code></td><td>新增两个文件，已完成并跑通</td></tr>
<tr><td>凡是"声谱图 / 频谱 / 波形"的图，改用真实数据</td><td>20 张里约 8 张涉及，其余示意图仍用纯 SVG</td></tr>
<tr><td>每张图出电脑 + 手机两版，正文改用 <code>&lt;picture&gt;</code></td><td>生成脚本加一个 layout 参数；20 张变 40 个文件</td></tr>
<tr><td>skill 增加"数据图必须来自真实计算"与"两版式"规则</td><td><code>mobile-figures.md</code> 扩写，或新增 <code>data-figures.md</code></td></tr>
<tr><td>第 01 篇拆分或降级后半段；去掉采样率重复</td><td>只动第 01、04 两篇</td></tr>
</tbody></table></div>

</div>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n${page}\n</body></html>`, 'utf8');
writeFileSync(OUT.replace('.html', '.artifact.html'), page, 'utf8');
console.log(`${OUT}  ${(Buffer.byteLength(page, 'utf8') / 1024 / 1024).toFixed(2)} MB`);
