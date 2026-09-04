/** 哪一课在哪个二级标题之前插入哪个交互组件。
 *  锚点用标题原文；文章改标题时这里要跟着改，构建脚本会报出对不上的锚点。 */
export const WIDGET_NAMES = ['framing', 'spectrum', 'mel', 'bandsplit', 'sliding', 'probe', 'phasor', 'tone'] as const;
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
