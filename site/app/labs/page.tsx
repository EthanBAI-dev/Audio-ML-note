import type { Metadata } from 'next';
import Link from 'next/link';
import { lessonById } from '../../lib/lessons';

export const metadata: Metadata = { title: '交互实验室', description: '通过可以操作的音频实验理解抽象概念。' };

const labs = [
  ['02', '听见频率与振幅', '直接调整声音参数，把波形变化与听感联系起来。'],
  ['06', '滑动窗口', '观察短时分析如何沿着一段录音前进。'],
  ['10', '频率探针与频谱', '亲手扫描频率，并把信号拆开再组合。'],
  ['11', '复数与相位', '旋转一个相量，看见模和角如何共同描述信号。'],
  ['15', '帧长的取舍', '调整窗口长度，比较时间和频率分辨率。'],
  ['20', '梅尔滤波与 DCT', '从频谱走到机器学习常用的 MFCC。'],
  ['21', '频谱统计量', '用质心、带宽等少量数字概括频谱。'],
] as const;

export default function LabsPage() {
  return <div className="shell home directory-shell"><main>
    <header className="directory-hero"><p className="eyebrow">INTERACTIVE LABS</p><h1>交互实验室</h1><p>不用先背公式。拖动参数、听结果、看图形，再回到课程理解为什么。</p></header>
    <div className="lab-directory">{labs.map(([id, title, description]) => <Link href={`/lesson/${id}`} key={id}><span>{id}</span><div><h2>{title}</h2><p>{description}</p><small>所在课程：{lessonById(id)?.title}</small></div><b>打开实验 ↗</b></Link>)}</div>
  </main></div>;
}
