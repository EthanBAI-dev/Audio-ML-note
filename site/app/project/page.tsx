import { redirect } from 'next/navigation';

export const metadata = { title: '课程项目' };

export default function Page() {
  redirect('/guide');
}
