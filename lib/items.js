import { query } from './db';
import { HttpError } from './http';
import { AREAS } from './constants';
import { addDays, daysBetween, isValidDateString, todayInSeoul } from './dates';
import { josa } from './josa';

export const ITEM_COLUMNS = `
  id, name, area, cycle_days, last_replaced_on, note, ai_reason, ai_signs, ai_tips, created_at, updated_at
`;

function parseList(text) {
  if (!text) return [];
  try {
    const value = JSON.parse(text);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/** 남은 날, 닳은 정도, 상태(지남/곧/여유)를 계산해서 붙임 */
export function toView(row, today = todayInSeoul()) {
  const used = Math.max(0, daysBetween(row.last_replaced_on, today));
  const remaining = row.cycle_days - used;
  const soonWindow = Math.min(14, Math.max(3, Math.round(row.cycle_days * 0.1)));
  let status = 'ok';
  if (remaining < 0) status = 'overdue';
  else if (remaining <= soonWindow) status = 'soon';

  return {
    ...row,
    ai_signs: parseList(row.ai_signs),
    ai_tips: parseList(row.ai_tips),
    days_used: used,
    days_remaining: remaining,
    due_on: addDays(row.last_replaced_on, row.cycle_days),
    wear: Math.min(1, used / row.cycle_days),
    status,
  };
}

function cleanText(value, { field, max, required }) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw new HttpError(400, `${josa(field, '을/를')} 입력하세요.`);
  if (text.length > max) throw new HttpError(400, `${josa(field, '은/는')} ${max}자 이하로 입력하세요.`);
  return text || null;
}

function cleanList(value) {
  if (!Array.isArray(value)) return null;
  const list = value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim().slice(0, 120)).slice(0, 5);
  return list.length ? JSON.stringify(list) : null;
}

/** 품목 등록·수정 값 검사. partial=true면 보낸 필드만 */
export function validateItem(input, { partial = false } = {}) {
  const out = {};
  const has = (key) => !partial || Object.prototype.hasOwnProperty.call(input, key);
  const today = todayInSeoul();

  if (has('name')) out.name = cleanText(input.name, { field: '품목 이름', max: 60, required: true });
  if (has('area')) out.area = AREAS.includes(input.area) ? input.area : '기타';
  if (has('cycle_days')) {
    const days = Number(input.cycle_days);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      throw new HttpError(400, '교체 주기는 1일부터 10년 사이로 정하세요.');
    }
    out.cycle_days = days;
  }
  if (has('last_replaced_on')) {
    if (!isValidDateString(input.last_replaced_on)) throw new HttpError(400, '마지막 교체일을 확인하세요.');
    if (input.last_replaced_on > today) throw new HttpError(400, '마지막 교체일은 오늘이나 그 전 날짜여야 해요.');
    out.last_replaced_on = input.last_replaced_on;
  }
  if (has('note')) out.note = cleanText(input.note, { field: '메모', max: 300 });
  if (has('ai_reason')) out.ai_reason = cleanText(input.ai_reason, { field: '추천 이유', max: 300 });
  if (has('ai_signs')) out.ai_signs = cleanList(input.ai_signs);
  if (has('ai_tips')) out.ai_tips = cleanList(input.ai_tips);
  return out;
}

export async function findOwnedItem(accountId, id) {
  const { rows } = await query(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = $1 AND account_id = $2`, [id, accountId]);
  if (!rows[0]) throw new HttpError(404, '찾을 수 없는 품목이에요.');
  return rows[0];
}

/** 교체 기록이 바뀌면 품목의 마지막 교체일을 가장 최근 기록 날짜로 맞춤 */
export async function syncLastReplaced(itemId) {
  await query(
    `UPDATE items SET
       last_replaced_on = COALESCE((SELECT MAX(replaced_on) FROM replacement_logs WHERE item_id = $1), last_replaced_on),
       updated_at = NOW()
     WHERE id = $1`,
    [itemId],
  );
}

const STATUS_ORDER = { overdue: 0, soon: 1, ok: 2 };

export function sortByUrgency(items) {
  return [...items].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.days_remaining - b.days_remaining,
  );
}
