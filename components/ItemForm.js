'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';
import { AREAS, CYCLE_UNITS, cycleLabel, splitCycle } from '@/lib/constants';
import { addDays, todayInSeoul } from '@/lib/dates';

/** 품목 등록·수정 폼. 이름을 쓰고 'AI 추천'을 누르면 주기·구역·관리 팁을 채워줌 */
export default function ItemForm({ initial = {}, mode = 'new', submitLabel, onSubmit }) {
  const today = todayInSeoul();
  const firstCycle = splitCycle(initial.cycle_days || 90);
  const [name, setName] = useState(initial.name || '');
  const [area, setArea] = useState(initial.area || '욕실');
  const [amount, setAmount] = useState(String(firstCycle.amount));
  const [unit, setUnit] = useState(firstCycle.unit);
  const [lastReplaced, setLastReplaced] = useState(initial.last_replaced_on || today);
  const [note, setNote] = useState(initial.note || '');
  const [ai, setAi] = useState(
    initial.ai_reason ? { reason: initial.ai_reason, signs: initial.ai_signs || [], tips: initial.ai_tips || [] } : null,
  );
  const [aiState, setAiState] = useState('idle'); // idle | loading | error
  const [aiError, setAiError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cycleDays = Math.round(Number(amount) * (CYCLE_UNITS.find((u) => u.key === unit)?.days ?? 1));

  async function askAi() {
    if (!name.trim()) {
      setAiError('어떤 물건인지 먼저 입력하세요.');
      setAiState('error');
      return;
    }
    setAiState('loading');
    setAiError('');
    try {
      const { recommendation: r } = await api('/api/ai/cycle', { method: 'POST', body: { name, note } });
      const split = splitCycle(r.cycle_days);
      setName(r.name);
      setArea(r.area);
      setAmount(String(split.amount));
      setUnit(split.unit);
      setAi({ reason: r.reason, signs: r.signs, tips: r.tips, label: r.cycle_label || cycleLabel(r.cycle_days) });
      setAiState('idle');
    } catch (err) {
      setAiError(err.message);
      setAiState('error');
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('품목 이름을 입력하세요.');
    if (!Number.isFinite(cycleDays) || cycleDays < 1 || cycleDays > 3650) {
      return setError('교체 주기는 1일부터 10년 사이로 정하세요.');
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        name,
        area,
        cycle_days: cycleDays,
        last_replaced_on: lastReplaced,
        note,
        ai_reason: ai?.reason ?? null,
        ai_signs: ai?.signs ?? [],
        ai_tips: ai?.tips ?? [],
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="panel panel-pad form">
        <label className="field">
          <span>어떤 물건인가요?</span>
          <div className="name-row">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 칫솔, 정수기 필터, 자동차 와이퍼"
              maxLength={60}
              autoFocus={mode === 'new'}
            />
            <button type="button" className="btn btn-leaf" onClick={askAi} disabled={aiState === 'loading'}>
              <Icon name="sparkle" size={17} />
              {ai ? 'AI 다시 추천' : 'AI 주기 추천'}
            </button>
          </div>
        </label>

        {aiState === 'loading' && (
          <div className="ai-loading" role="status">
            <span className="spinner" /> 알맞은 교체 주기를 찾고 있어요…
          </div>
        )}
        {aiState === 'error' && <p className="error">{aiError}</p>}

        {ai && aiState !== 'loading' && (
          <div className="ai-card">
            <div className="ai-card-head">
              <Icon name="sparkle" size={16} /> AI 추천
            </div>
            <p className="ai-cycle">{ai.label || cycleLabel(cycleDays)}마다 바꾸세요</p>
            <p className="ai-reason">{ai.reason}</p>
            <div className="ai-lists">
              {ai.signs?.length > 0 && (
                <div>
                  <h4>이럴 땐 주기 전이라도 교체</h4>
                  <ul>
                    {ai.signs.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.tips?.length > 0 && (
                <div>
                  <h4>오래 쓰는 관리법</h4>
                  <ul>
                    {ai.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-row">
          <label className="field">
            <span>구역</span>
            <select className="input" value={area} onChange={(e) => setArea(e.target.value)}>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <div className="field">
            <span>교체 주기</span>
            <div className="cycle-input">
              <input
                className="input"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                aria-label="교체 주기 숫자"
              />
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="교체 주기 단위">
                {CYCLE_UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {mode === 'new' && (
          <label className="field">
            <span>마지막으로 바꾼 날</span>
            <input
              className="input"
              type="date"
              value={lastReplaced}
              max={today}
              onChange={(e) => setLastReplaced(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                ['오늘', 0],
                ['1주 전', 7],
                ['1개월 전', 30],
                ['3개월 전', 90],
              ].map(([label, ago]) => (
                <button
                  key={label}
                  type="button"
                  className="btn btn-sm btn-line"
                  onClick={() => setLastReplaced(addDays(today, -ago))}
                >
                  {label}
                </button>
              ))}
            </div>
            <small>정확히 모르겠다면 대충 골라도 괜찮아요. 다음에 바꿀 때부터 정확해져요.</small>
          </label>
        )}

        <label className="field">
          <span>메모</span>
          <textarea
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 쿠팡에서 3개 묶음으로 구매, 모델명 CHP-264"
            maxLength={300}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      <div>
        <button className="btn btn-lg" disabled={saving}>
          {saving ? '저장하는 중…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
