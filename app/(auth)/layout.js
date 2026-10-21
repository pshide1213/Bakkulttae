import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AuthLayout({ children }) {
  const session = await getSession();
  if (session) redirect('/dashboard');
  return children;
}
