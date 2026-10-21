'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Brand from '@/components/Brand';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';

const LINKS = [
  { href: '/dashboard', label: '오늘의 점검', icon: 'home' },
  { href: '/items/new', label: '품목 추가', icon: 'plus' },
  { href: '/suggest', label: '빠뜨린 품목 찾기', icon: 'sparkle' },
  { href: '/history', label: '교체 기록', icon: 'history' },
  { href: '/settings', label: '설정', icon: 'settings' },
];

export default function Sidebar({ name }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || (pathname.startsWith('/items/') && pathname !== '/items/new')
      : pathname === href;

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.replace('/');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <Link href="/dashboard">
        <Brand />
      </Link>
      <nav className="nav" aria-label="메뉴">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? 'page' : undefined}>
            <Icon name={link.icon} />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <p>{name}님의 집</p>
        <button type="button" onClick={logout}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
