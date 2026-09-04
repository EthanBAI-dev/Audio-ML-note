import Widget from './Widget';
import { WIDGET_NAMES, type WidgetName } from '../content/widgets';

// 名单只写在 widgets.ts 里，正则从它生成，免得两边各写一份再走散。
const MARK = new RegExp(`<div data-widget="(${WIDGET_NAMES.join('|')})"></div>`);

/** 把渲染好的 HTML 按交互组件占位切开，中间插入真正的 React 组件。 */
export default function Article({ html }: { html: string }) {
  const parts: React.ReactNode[] = [];
  let rest = html, i = 0;
  for (;;) {
    const m = MARK.exec(rest);
    if (!m) break;
    parts.push(<div key={`h${i}`} className="prose" dangerouslySetInnerHTML={{ __html: rest.slice(0, m.index) }} />);
    parts.push(<Widget key={`w${i}`} name={m[1] as WidgetName} />);
    rest = rest.slice(m.index + m[0].length);
    i += 1;
  }
  parts.push(<div key="tail" className="prose" dangerouslySetInnerHTML={{ __html: rest }} />);
  return <>{parts}</>;
}
