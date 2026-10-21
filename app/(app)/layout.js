import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from './Sidebar';

// 로그인한 사람만 볼 수 있는 화면들
export default async function AppLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <div className="shell">
      <Sidebar name={session.name} />
      <main className="main">{children}</main>
    </div>
  );
}
