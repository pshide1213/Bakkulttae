import { query } from '@/lib/db';
import { handle, HttpError, ok, parseId, readJson, requireMember } from '@/lib/http';
import { syncLastReplaced } from '@/lib/items';
import { isValidDateString, todayInSeoul } from '@/lib/dates';

async function findOwnedLog(accountId, id) {
  const { rows } = await query('SELECT id, item_id FROM replacement_logs WHERE id = $1 AND account_id = $2', [id, accountId]);
  if (!rows[0]) throw new HttpError(404, '찾을 수 없는 기록이에요.');
  return rows[0];
}

// 교체 기록 수정: PATCH /api/logs/:id  { replaced_on?, memo? }
export const PATCH = handle(async (request, { params }) => {
  const me = await requireMember();
  const id = parseId((await params).id);
  const log = await findOwnedLog(me.id, id);
  const body = await readJson(request);

  if (body.replaced_on !== undefined) {
    if (!isValidDateString(body.replaced_on) || body.replaced_on > todayInSeoul()) {
      throw new HttpError(400, '교체한 날짜는 오늘이나 그 전 날짜여야 해요.');
    }
    await query('UPDATE replacement_logs SET replaced_on = $1 WHERE id = $2', [body.replaced_on, id]);
  }
  if (body.memo !== undefined) {
    const memo = String(body.memo).trim().slice(0, 200) || null;
    await query('UPDATE replacement_logs SET memo = $1 WHERE id = $2', [memo, id]);
  }
  await syncLastReplaced(log.item_id);
  return ok({ ok: true });
});

// 교체 기록 삭제: DELETE /api/logs/:id
export const DELETE = handle(async (request, { params }) => {
  const me = await requireMember();
  const id = parseId((await params).id);
  const log = await findOwnedLog(me.id, id);

  const count = await query('SELECT COUNT(*) FROM replacement_logs WHERE item_id = $1', [log.item_id]);
  if (Number(count.rows[0].count) <= 1) {
    throw new HttpError(400, '마지막 남은 기록은 지울 수 없어요. 품목을 삭제하거나 날짜를 수정하세요.');
  }
  await query('DELETE FROM replacement_logs WHERE id = $1', [id]);
  // 지운 기록이 가장 최근이었다면 이전 기록 날짜로 되돌림
  await query(
    'UPDATE items SET last_replaced_on = (SELECT MAX(replaced_on) FROM replacement_logs WHERE item_id = $1), updated_at = NOW() WHERE id = $1',
    [log.item_id],
  );
  return ok({ ok: true });
});
