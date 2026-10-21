'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';
import { cycleLabel } from '@/lib/constants';
import { todayInSeoul } from '@/lib/dates';

export default function SuggestClient() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState({}); // name → item id

  async function run() {
    setLoading(true);
    setError('');
    try {
      const res = await api('/api/ai/suggest', { method: 'POST' });
      setList(res.suggestions);
      setAdded({});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function add(s) {
    try {
      const { item } = await api('/api/items', {
        method: 'POST',
        body: { ...s, last_replaced_on: todayInSeoul(), ai_reason: s.reason },
      });
      setAdded((a) => ({ ...a, [s.name]: item.id }));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <div>
          <h1 className="page-title">빠뜨린 품목 찾기</h1>
          <p className="page-sub">
            지금 관리 중인 물건과 가구원 수를 보고, 사람들이 교체 시기를 자주 놓치는 물건을 AI가 골라드려요.
          </p>
        </div>
      </header>

      {!list && !loading && (
        <div className="panel empty">
          <h2>우리 집에 빠진 게 있을까요?</h2>
          <p>추천을 받아도 바로 추가되지 않아요. 필요한 것만 골라 담으세요.</p>
          <button type="button" className="btn btn-leaf btn-lg" onClick={run}>
            <Icon name="sparkle" size={18} /> 추천받기
          </button>
        </div>
      )}

      {loading && (
        <div className="panel panel-pad">
          <div className="ai-loading" role="status">
            <span className="spinner" /> 우리 집 목록을 살펴보는 중이에요…
          </div>
        </div>
      )}

      {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

      {list && !loading && (
        <>
          <div className="panel">
            {list.length === 0 ? (
              <div className="empty">
                <p>지금 목록이 꽤 꼼꼼해요. 더 추천할 물건을 찾지 못했어요.</p>
              </div>
            ) : (
              <ul className="suggest-list">
                {list.map((s) => (
                  <li key={s.name}>
                    <div>
                      <p className="suggest-name">
                        {s.name} <span className="tag">{s.area}</span>{' '}
                        <span className="tag">{cycleLabel(s.cycle_days)}마다</span>
                      </p>
                      <p className="suggest-why">{s.reason}</p>
                    </div>
                    {added[s.name] ? (
                      <Link href={`/items/${added[s.name]}`} className="done-flash">
                        <Icon name="check" size={16} /> 추가했어요
                      </Link>
                    ) : (
                      <button type="button" className="btn btn-sm btn-line" onClick={() => add(s)}>
                        <Icon name="plus" size={16} /> 추가
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
            추가한 물건은 오늘 바꾼 것으로 등록돼요. 실제로 바꾼 날이 다르면 품목 화면의 교체 기록에서 고치세요.
          </p>
          <button type="button" className="btn btn-line" onClick={run} style={{ marginTop: 8 }}>
            다른 추천 받기
          </button>
        </>
      )}
    </div>
  );
}
