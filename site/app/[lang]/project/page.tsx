import { redirect } from 'next/navigation';
import { getT } from '../../../lib/locale';

/** 旧地址，项目说明已经并进课程导览。 */
export default async function Page() {
  const { to } = await getT();
  redirect(to('/guide'));
}
