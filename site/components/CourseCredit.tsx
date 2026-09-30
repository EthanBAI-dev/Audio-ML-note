/** 课程来源说明。课程页、导览页和每一讲末尾都放同一段，措辞只在这里改。 */
export default function CourseCredit({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`course-credit${compact ? ' is-compact' : ''}`} aria-label="课程来源">
      <p className="eyebrow">课程来源</p>
      <p>
        这门课基于 <b>Valerio Velardo</b> 的英文系列课程
        <a href="https://www.youtube.com/playlist?list=PL-wATfeyAMNqIee7cH3q1bh4QJFAaeNv0" rel="noopener" target="_blank">《Audio Signal Processing for Machine Learning》</a>
        （YouTube 频道 The Sound of AI）改编。课程结构、讲授顺序和七段教学音频来自原课程的视频、幻灯片与配套仓库
        <a href="https://github.com/musikalkemist/AudioSignalProcessingForML" rel="noopener" target="_blank">musikalkemist/AudioSignalProcessingForML</a>
        （MIT 许可）；中文讲解、配图、交互实验和示例代码由 Ethan 重新编写。
      </p>
      {compact ? null : <p>感谢 Valerio 把这套课程公开分享。想看英文原版，可以直接去他的频道。</p>}
    </aside>
  );
}
