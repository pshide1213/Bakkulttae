import { query } from '@/lib/db';
import { handle, HttpError, ok, parseId, readJson, requireMember } from '@/lib/http';
import { findOwnedItem, ITEM_COLUMNS, toView, validateItem } from '@/lib/items';

// 품목 하나 + 교체 기록: GET /api/items/:id
export const GET = handle(async (request, { params }) => {
  const me = await requireMember();
  const id = parseId((await params).id);
  const item = await findOwnedItem(me.id, id);
  const logs = await query(
    'SELECT id, replaced_on, memo, created_at FROM replacement_logs WHERE item_id = $1 ORDER BY replaced_on DESC, id DESC',
    [id],
  );
  return ok({ item: toView(item), logs: logs.rows });
});

// 품목 수정: PATCH /api/items/:id
export const PATCH = handle(async (request, { params }) => {
  const me = await requireMember();
  const id = parseId((await params).id);
  await findOwnedItem(me.id, id);
  const data = validateItem(await readJson(request), { partial: true });

  // 마지막 교체일은 교체 기록으로 관리하므로 여기서는 바꾸지 않음
  delete data.last_replaced_on;
  const entries = Object.entries(data);
  if (entries.length === 0) throw new HttpError(400, '바꿀 내용이 없어요.');

  const sets = entries.map(([key], i) => `${key} = $${i + 1}`);
  const values = entries.map(([, value]) => value);
  values.push(id, me.id);

  const { rows } = await query(
    `UPDATE items SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND account_id = $${values.length}
     RETURNING ${ITEM_COLUMNS}`,
    values,
  );
  return ok({ item: toView(rows[0]) });
});

// 품목 삭제: DELETE /api/items/:id (교체 기록도 함께 삭제)
export const DELETE = handle(async (request, { params }) => {
  const me = await requireMember();
  const id = parseId((await params).id);
  await findOwnedItem(me.id, id);
  await query('DELETE FROM items WHERE id = $1 AND account_id = $2', [id, me.id]);
  return ok({ ok: true });
});
