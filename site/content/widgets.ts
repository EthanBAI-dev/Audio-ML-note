/** 哪一课在哪个二级标题之前插入哪个交互组件。
 *  锚点用标题原文；文章改标题时这里要跟着改，构建脚本会报出对不上的锚点。 */
export const WIDGET_NAMES = ['framing', 'spectrum', 'mel', 'bandsplit', 'sliding', 'probe', 'phasor', 'tone', 'zcr', 'track', 'zoom', 'pitch', 'loudness', 'attack', 'timbre'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];
export type Placement = { before: string; name: WidgetName };

export const WIDGETS: Record<string, Placement[]> = {
  // 02 —— 第一次把波形、参数和听感连在一起
  '02': [{ before: '人耳能听到多快的振动', name: 'tone' }],
  // 06 第一次看窗口移动；15 再单独比较帧长，不重复同一个演示
  '06': [{ before: '频域那条流水线，为什么要多一步', name: 'sliding' }],
  '15': [{ before: '帧长决定时间和频率哪边看得更细', name: 'framing' }],
  // 10 第一次建立频谱直觉；14、16 直接使用真实音频和各自的静态计算图
  '10': [{ before: '第 2 步：把所有频率都试一遍', name: 'probe' },
          { before: '第 4 步：能拆开，就能拼回去', name: 'spectrum' }],
  // 11 —— 复数的模与相位
  '11': [{ before: '欧拉公式：把「模和角」写成一个乘法', name: 'phasor' }],
  // 20 才把梅尔滤波与 DCT 放在同一实验里，避免 17、18 提前讲 DCT
  '20': [{ before: '13 行里，第 0 行说的是另一件事', name: 'mel' }],
  // 21 用一组已知答案比较三种统计量；22、23 保留各自的真实代码实验
  '21': [{ before: '三个公式放进同一组已知答案', name: 'bandsplit' }],
};

/** v2 试行版的交互组件位置。原版课文不变，这里单独配置。 */
export const WIDGETS_V2: Record<string, Placement[]> = {
  // 01 —— 先亲眼看到「录音就是一长串数」
  '01': [{ before: '1.2 缺的那一步：把一串数整理成证据', name: 'zoom' }],
  // 02 —— 先摸正弦的三个旋钮，再听「按倍数」和「按差值」的差别
  '02': [{ before: '2.5 人耳能听到的范围', name: 'tone' },
         { before: '2.7 实验：把琴键编号换成赫兹', name: 'pitch' }],
  // 03 —— 等响自己调一次；音色先切真实录音的起音，再拿实测比例拼一个音
  '03': [{ before: '3.4 实验：数值一样的两段声音，听感差多少', name: 'loudness' },
         { before: '泛音：一个音里其实有很多个频率', name: 'attack' },
         { before: '📌 本课小结', name: 'timbre' }],
  // 09 —— 先在一帧合成信号上看三个数各被什么骗，再边听边看真实录音的逐帧曲线
  '09': [{ before: '9.4 三首曲子、一段人声：过零率听出了什么', name: 'zcr' },
         { before: '9.5 两个一起看，强多少', name: 'track' }],
};
