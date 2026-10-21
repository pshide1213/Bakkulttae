'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Wear, { remainingText } from '@/components/Wear';
import { api } from '@/lib/api';
import { cycleLabel } from '@/lib/constants';
import { addDays, daysBetween, formatMonthDay, weekdayOf } from '@/lib/dates';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function headline(summary) {
  if (summary.total === 0) return '아직 등록한 물건이 없어요';
  if (summary.overdue > 0) return `바꿀 때가 지난 물건이 ${summary.overdue}개 있어요`;
  if (summary.soon > 0) return `곧 바꿔야 할 물건이 ${summary.soon}개 있어요`;
  return '지금은 모두 여유 있어요';
}

export default function DashboardClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [area, setArea] = useState('전체');
  const [justDone, setJustDone] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api('/api/items'));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function replaced(item) {
    try {
      await api(`/api/items/${item.id}/replace`, { method: 'POST', body: {} });
      setJustDone(item.id);
      setTimeout(() => setJustDone(null), 2400);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const areas = useMemo(() => {
    if (!data) return [];
    return ['전체', ...new Set(data.items.map((i) => i.area))];
  }, [data]);

  if (error) return <p className="error">{error}</p>;
  if (!data) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 70, width: 420, marginBottom: 26 }} />
        <div className="skeleton" style={{ height: 380 }} />
      </div>
    );
  }

  const { today, items, summary } = data;
  const shown = area === '전체' ? items : items.filter((i) => i.area === area);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="page-date">
            {formatMonthDay(today)} {weekdayOf(today)}요일
          </p>
          <h1 className="page-title">{headline(summary)}</h1>
          {summary.total > 0 && (
            <p className="page-sub">
              관리 중인 물건 {summary.total}개 가운데 지남 {summary.overdue}개, 곧 {summary.soon}개, 여유 {summary.ok}개
            </p>
          )}
        </div>
        <Link href="/items/new" className="btn btn-leaf">
          <Icon name="plus" size={18} /> 품목 추가
        </Link>
      </header>

      {summary.total === 0 ? (
        <div className="panel empty">
          <h2>첫 물건부터 등록해 볼까요?</h2>
          <p>칫솔, 수세미, 정수기 필터처럼 주기적으로 바꾸는 물건이면 뭐든 좋아요.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/items/new" className="btn btn-leaf">
              직접 추가하기
            </Link>
            <Link href="/suggest" className="btn btn-line">
              AI에게 추천받기
            </Link>
          </div>
        </div>
      ) : (
        <>
          <Calendar items={items} today={today} />

          <div className="toolbar">
            <div className="tabs" role="group" aria-label="구역">
              {areas.map((a) => (
                <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(a)}>
                  {a}
                </button>
              ))}
            </div>
            <span className="muted" style={{ fontSize: 14 }}>
              바꿀 때가 가까운 순서
            </span>
          </div>

          <div className="panel">
            <table className="item-table">
              <thead>
                <tr>
                  <th>물건</th>
                  <th className="col-area">구역</th>
                  <th className="col-wear">남은 수명</th>
                  <th className="col-action">
                    <span className="sr-only">교체</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/items/${item.id}`} className="item-name">
                        {item.name}
                      </Link>
                      <span className="item-cycle">{cycleLabel(item.cycle_days)}마다</span>
                    </td>
                    <td className="col-area">
                      <span className="tag">{item.area}</span>
                    </td>
                    <td className="col-wear">
                      <div className="wear-cell">
                        <Wear item={item} />
                        <div className="wear-meta">
                          <span className="status-text" data-status={item.status}>
                            {remainingText(item)}
                          </span>
                          <span>다음 교체 {formatMonthDay(item.due_on)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="col-action">
                      {justDone === item.id ? (
                        <span className="done-flash">
                          <Icon name="check" size={16} /> 기록했어요
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-sm ${item.status === 'ok' ? 'btn-line' : 'btn-leaf'}`}
                          onClick={() => replaced(item)}
                        >
                          오늘 바꿨어요
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** 이번 주 일요일부터 4주 달력. 교체일이 지난 물건은 왼쪽 칸에 따로 */
function Calendar({ items, today }) {
  const start = addDays(today, -DOW.indexOf(weekdayOf(today)));
  const days = Array.from({ length: 28 }, (_, i) => addDays(start, i));
  const end = days[days.length - 1];
  const overdue = items.filter((i) => i.status === 'overdue');
  const later = items.filter((i) => i.due_on > end).length;

  const byDay = {};
  for (const item of items) {
    if (item.status === 'overdue') continue;
    (byDay[item.due_on] ||= []).push(item);
  }

  return (
    <section className="panel" aria-label="4주 교체 달력">
      <div className="panel-pad" style={{ paddingBottom: 14 }}>
        <h2 className="panel-title">
          4주 교체 달력
          <small>{later > 0 ? `${formatMonthDay(end)} 뒤로 ${later}개 더 있어요` : ''}</small>
        </h2>
      </div>
      <div className="calendar-wrap">
        <div className="calendar">
          <div className="cal-overdue">
            <h3>지난 것 {overdue.length}개</h3>
            {overdue.length === 0 && <p>없어요</p>}
            {overdue.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="cal-chip" data-status="overdue">
                {item.name} +{-item.days_remaining}일
              </Link>
            ))}
          </div>
          {DOW.map((d) => (
            <div key={d} className="cal-dow">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dow = weekdayOf(day);
            const num = Number(day.slice(8));
            return (
              <div
                key={day}
                className="cal-day"
                data-today={day === today}
                data-weekend={dow === '일' || dow === '토'}
                style={daysBetween(today, day) < 0 ? { opacity: 0.45 } : undefined}
              >
                <span className="cal-num">{num === 1 || day === start ? `${Number(day.slice(5, 7))}/${num}` : num}</span>
                {(byDay[day] || []).map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="cal-chip"
                    data-status={item.status}
                    title={`${item.name}, ${remainingText(item)}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
