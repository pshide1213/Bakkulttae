'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import ItemForm from '@/components/ItemForm';
import { api } from '@/lib/api';

export default function NewItemClient() {
  const router = useRouter();

  async function save(values) {
    const { item } = await api('/api/items', { method: 'POST', body: values });
    router.push(`/items/${item.id}`);
    router.refresh();
  }

  return (
    <div className="page page-narrow">
      <Link href="/dashboard" className="back">
        <Icon name="back" size={16} /> 오늘의 점검
      </Link>
      <header className="page-head">
        <div>
          <h1 className="page-title">품목 추가</h1>
          <p className="page-sub">이름을 쓰고 AI 주기 추천을 누르면 나머지는 채워드려요. 직접 입력해도 돼요.</p>
        </div>
      </header>
      <ItemForm submitLabel="목록에 추가" onSubmit={save} />
    </div>
  );
}
