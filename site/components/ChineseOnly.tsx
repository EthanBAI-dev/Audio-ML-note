import { getT } from '../lib/locale';

/** 日文、英文页面上说明「课程正文暂时只有中文」。中文页面不显示。 */
export default async function ChineseOnly() {
  const { t } = await getT();
  if (!t.ui.chineseOnly) return null;
  return <p className="lang-note" role="note">{t.ui.chineseOnly}</p>;
}
