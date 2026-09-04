import { redirect } from 'next/navigation';

export const metadata = { title: '课程项目' };

export default function Page() {
  redirect('/guide#%E5%AE%9E%E8%B7%B5%E9%A1%B9%E7%9B%AE');
}
