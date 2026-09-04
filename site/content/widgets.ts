/** 哪一课在哪个二级标题之前插入哪个交互组件。
 *  锚点用标题原文；文章改标题时这里要跟着改，构建脚本会报出对不上的锚点。 */
export const WIDGET_NAMES = ['framing', 'spectrum', 'mel', 'bandsplit', 'sliding', 'probe', 'phasor'] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];
export type Placement = { before: string; name: WidgetName };

export const WIDGETS: Record<string, Placement[]> = {
  // 06 / 08 / 15 —— 分帧、加窗、时频分辨率
  '06': [{ before: '频域那条流水线，为什么要多一步', name: 'sliding' },
          { before: '加窗：把两端压到零，接缝就平了', name: 'framing' }],
  '08': [{ before: '第 4 步：把帧编号换算成时间', name: 'framing' }],
  '15': [{ before: '一次只看一小段，时间位置就留下来了', name: 'sliding' },
          { before: '帧长决定时间和频率哪边看得更细', name: 'framing' }],
  // 10 / 14 / 16 —— 频谱与画法
  '10': [{ before: '第 2 步：把所有频率都试一遍', name: 'probe' },
          { before: '第 4 步：能拆开，就能拼回去', name: 'spectrum' }],
  '14': [{ before: '`f_ratio=0.1` 只是把 0—2205 Hz 放大来看', name: 'spectrum' }],
  '16': [{ before: '纵轴也该按倍数刻', name: 'spectrum' }],
  // 11 —— 复数的模与相位
  '11': [{ before: '欧拉公式：把「模和角」写成一个乘法', name: 'phasor' }],
  // 17 / 18 / 20 —— 梅尔与 MFCC
  '17': [{ before: '三步配方，前两步已经做完了', name: 'mel' }],
  '18': [{ before: '十个带够不够', name: 'mel' }],
  '20': [{ before: '13 行里，第 0 行说的是另一件事', name: 'mel' }],
  // 21 / 22 / 23 —— 频域特征
  '21': [{ before: '三个公式放进同一组已知答案', name: 'bandsplit' }],
  '22': [{ before: '分界频率一改，结论也会动', name: 'bandsplit' }],
  '23': [{ before: '三个特征放回项目：谁分得开哪一对', name: 'bandsplit' }],
};
