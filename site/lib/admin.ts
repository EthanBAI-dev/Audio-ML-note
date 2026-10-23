import { currentUserId } from '../auth';
import { isAdmin } from './comments';

/** 后台每个入口都先过这一关：没登录或不是 ADMIN_EMAILS 里的账号，一律当作无权限。 */
export async function adminUserId(): Promise<string | null> {
  const userId = await currentUserId();
  return userId && await isAdmin(userId) ? userId : null;
}

/** 文章路径里的分组（第06-10课 → 06-10），预览时配图地址要靠它改写。 */
export function groupOf(path: string): string {
  return /第(\d\d-\d\d)课\//.exec(path)?.[1] ?? '';
}

/** 列表和标题栏里显示的名字：去掉课程目录前缀。 */
export function shortName(path: string): string {
  return path.replace(/^音频信号处理二十三讲(-v2)?\//, '');
}
