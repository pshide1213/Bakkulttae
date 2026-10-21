'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import Wear, { remainingText } from '@/components/Wear';
import { api } from '@/lib/api';
import { cycleLabel, STATUS_TEXT } from '@/lib/constants';
import { daysBetween, formatDate, formatMonthDay, todayInSeoul } from '@/lib/dates';
import { josa } from '@/lib/josa';

export default function ItemDetailClient({ id }) {
  const router = useRouter();
  const today = todayInSeoul();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [replacedOn, setReplacedOn] = useState(today);
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(null); // { id, replaced_on, memo }

  const load = useCallback(async () => {
    try {
      setData(await api(`/api/items/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addLog(e) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await api(`/api/items/${id}/replace`, { method: 'POST', body: { replaced_on: replacedOn, memo } });
      setMemo('');
      setReplacedOn(today);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLog() {
    try {
      await api(`/api/logs/${editing.id}`, {
        method: 'PATCH',
        body: { replaced_on: editing.replaced_on, memo: editing.memo || '' },
      });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteLog(log) {
    if (!confirm(`${formatDate(log.replaced_on)} 기록을 지울까요?`)) return;
    try {
      await api(`/api/logs/${log.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteItem() {
    if (!confirm(`${josa(data.item.name, '을/를')} 목록에서 삭제할까요? 교체 기록도 함께 지워져요.`)) return;
    await api(`/api/items/${id}`, { method: 'DELETE' });
    router.replace('/dashboard');
    router.refresh();
  }

  if (error) {
    return (
      <div className="panel empty">
        <h2>{error}</h2>
        <Link href="/dashboard" className="btn">
          오늘의 점검으로
        </Link>
      </div>
    );
  }
  if (!data) return <div className="skeleton" style={{ height: 420, maxWidth: 1080 }} />;

  const { item, logs } = data;

  return (
    <div className="page">
      <Link href="/dashboard" className="back">
        <Icon name="back" size={16} /> 오늘의 점검
      </Link>
      <header className="page-head">
        <div>
          <p className="page-date">
            <span className="tag">{item.area}</span> {cycleLabel(item.cycle_days)}마다 교체
          </p>
          <h1 className="page-title">{item.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href={`/items/${item.id}/edit`} className="btn btn-line">
            수정
          </Link>
          <button type="button" className="btn btn-danger" onClick={deleteItem}>
            삭제
          </button>
        </div>
      </header>

      <div className="detail-grid">
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="panel panel-pad life" aria-label="남은 수명">
            <div className="life-number" data-status={item.status}>
              {remainingText(item)}
            </div>
            <Wear item={item} large />
            <div className="life-scale">
              <span>{formatMonthDay(item.last_replaced_on)} 교체</span>
              <span>{formatMonthDay(item.due_on)} 교체 예정</span>
            </div>
            <dl className="facts">
              <div>
                <dt>상태</dt>
                <dd className="status-text" data-status={item.status}>
                  {STATUS_TEXT[item.status]}
                </dd>
              </div>
              <div>
                <dt>쓴 기간</dt>
                <dd>{item.days_used}일째</dd>
              </div>
              <div>
                <dt>교체 횟수</dt>
                <dd>{logs.length}번</dd>
              </div>
            </dl>

            <form className="replace-form" onSubmit={addLog}>
              <input
                className="input"
                type="date"
                value={replacedOn}
                max={today}
                onChange={(e) => setReplacedOn(e.target.value)}
                aria-label="바꾼 날짜"
              />
              <input
                className="input"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 (선택): 새 제품명, 구매처"
                maxLength={200}
                aria-label="교체 메모"
              />
              <button className="btn btn-leaf" disabled={busy}>
                <Icon name="check" size={17} /> 바꿨어요
              </button>
            </form>
            {formError && <p className="error">{formError}</p>}
          </section>

          {(item.ai_reason || item.ai_signs.length > 0) && (
            <section className="ai-card">
              <div className="ai-card-head">
                <Icon name="sparkle" size={16} /> AI가 알려준 관리법
              </div>
              {item.ai_reason && <p className="ai-reason">{item.ai_reason}</p>}
              <div className="ai-lists">
                {item.ai_signs.length > 0 && (
                  <div>
                    <h4>이럴 땐 주기 전이라도 교체</h4>
                    <ul>
                      {item.ai_signs.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.ai_tips.length > 0 && (
                  <div>
                    <h4>오래 쓰는 관리법</h4>
                    <ul>
                      {item.ai_tips.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {item.note && (
            <section className="panel panel-pad">
              <h2 className="panel-title">메모</h2>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.note}</p>
            </section>
          )}
        </div>

        <section className="panel panel-pad" aria-label="교체 기록">
          <h2 className="panel-title">
            교체 기록 <small>최근 순</small>
          </h2>
          <ul className="log-list">
            {logs.map((log, i) => {
              const prev = logs[i + 1];
              const gap = prev ? daysBetween(prev.replaced_on, log.replaced_on) : null;
              if (editing?.id === log.id) {
                return (
                  <li key={log.id}>
                    <div className="log-edit">
                      <input
                        className="input"
                        type="date"
                        max={today}
                        value={editing.replaced_on}
                        onChange={(e) => setEditing({ ...editing, replaced_on: e.target.value })}
                        aria-label="기록 날짜"
                      />
                      <input
                        className="input"
                        value={editing.memo || ''}
                        onChange={(e) => setEditing({ ...editing, memo: e.target.value })}
                        aria-label="기록 메모"
                      />
                      <button type="button" className="btn btn-sm" onClick={saveLog}>
                        저장
                      </button>
                      <button type="button" className="btn btn-sm btn-quiet" onClick={() => setEditing(null)}>
                        취소
                      </button>
                    </div>
                  </li>
                );
              }
              return (
                <li key={log.id}>
                  <span className="log-date">
                    {formatDate(log.replaced_on)}
                    {gap !== null && <span className="log-gap">{gap}일 만에 교체</span>}
                  </span>
                  <span className="muted">{log.memo || ''}</span>
                  <span className="log-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-quiet"
                      onClick={() => setEditing({ id: log.id, replaced_on: log.replaced_on, memo: log.memo })}
                    >
                      수정
                    </button>
                    {logs.length > 1 && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteLog(log)}>
                        삭제
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
