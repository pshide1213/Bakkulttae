'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { weekdayOf } from '@/lib/dates';

export default function HistoryClient() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/logs')
      .then((res) => setLogs(res.logs))
      .catch((err) => setError(err.message));
  }, []);

  // 월별로 묶기
  const months = [];
  for (const log of logs ?? []) {
    const key = log.replaced_on.slice(0, 7);
    let group = months.find((m) => m.key === key);
    if (!group) {
      group = { key, logs: [] };
      months.push(group);
    }
    group.logs.push(log);
  }

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <div>
          <h1 className="page-title">교체 기록</h1>
          <p className="page-sub">언제 무엇을 바꿨는지 모두 모아봤어요.</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {!logs && !error && <div className="skeleton" style={{ height: 300 }} />}
      {logs && logs.length === 0 && (
        <div className="panel empty">
          <h2>아직 기록이 없어요</h2>
          <p>품목을 추가하면 첫 기록이 생겨요.</p>
          <Link href="/items/new" className="btn btn-leaf">
            품목 추가
          </Link>
        </div>
      )}

      {months.map((m) => {
        const [y, mo] = m.key.split('-').map(Number);
        return (
          <section className="month" key={m.key}>
            <h2>
              {y}년 {mo}월<small>{m.logs.length}건</small>
            </h2>
            <div className="panel">
              {m.logs.map((log) => (
                <div className="history-row" key={log.id}>
                  <span className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {Number(log.replaced_on.slice(8))}일 ({weekdayOf(log.replaced_on)})
                  </span>
                  <span>
                    <Link href={`/items/${log.item_id}`} style={{ fontWeight: 600 }}>
                      {log.item_name}
                    </Link>
                    {log.memo && <span className="muted"> {log.memo}</span>}
                  </span>
                  <span className="tag">{log.area}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
