'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import ItemForm from '@/components/ItemForm';
import { api } from '@/lib/api';

export default function EditItemClient({ id }) {
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/items/${id}`)
      .then((res) => setItem(res.item))
      .catch((err) => setError(err.message));
  }, [id]);

  async function save(values) {
    const { last_replaced_on, ...rest } = values; // 교체일은 교체 기록에서 수정
    await api(`/api/items/${id}`, { method: 'PATCH', body: rest });
    router.push(`/items/${id}`);
    router.refresh();
  }

  return (
    <div className="page page-narrow">
      <Link href={`/items/${id}`} className="back">
        <Icon name="back" size={16} /> 돌아가기
      </Link>
      <header className="page-head">
        <div>
          <h1 className="page-title">품목 수정</h1>
          <p className="page-sub">마지막 교체일은 품목 화면의 교체 기록에서 고칠 수 있어요.</p>
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {!item && !error && <div className="skeleton" style={{ height: 360 }} />}
      {item && <ItemForm initial={item} mode="edit" submitLabel="변경 내용 저장" onSubmit={save} />}
    </div>
  );
}
