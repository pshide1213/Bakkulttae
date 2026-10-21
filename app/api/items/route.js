import { query } from '@/lib/db';
import { handle, ok, readJson, requireMember } from '@/lib/http';
import { ITEM_COLUMNS, sortByUrgency, toView, validateItem } from '@/lib/items';
import { todayInSeoul } from '@/lib/dates';

// 내 품목 목록: GET /api/items  (교체가 급한 순서로 정렬)
export const GET = handle(async () => {
  const me = await requireMember();
  const today = todayInSeoul();
  const { rows } = await query(`SELECT ${ITEM_COLUMNS} FROM items WHERE account_id = $1`, [me.id]);
  const items = sortByUrgency(rows.map((row) => toView(row, today)));
  const count = (status) => items.filter((i) => i.status === status).length;
  return ok({
    today,
    items,
    summary: { total: items.length, overdue: count('overdue'), soon: count('soon'), ok: count('ok') },
  });
});

// 품목 등록: POST /api/items  (첫 교체 기록도 함께 남김)
export const POST = handle(async (request) => {
  const me = await requireMember();
  const data = validateItem(await readJson(request));

  const { rows } = await query(
    `INSERT INTO items (account_id, name, area, cycle_days, last_replaced_on, note, ai_reason, ai_signs, ai_tips)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${ITEM_COLUMNS}`,
    [me.id, data.name, data.area, data.cycle_days, data.last_replaced_on, data.note, data.ai_reason, data.ai_signs, data.ai_tips],
  );
  await query(
    'INSERT INTO replacement_logs (item_id, account_id, replaced_on, memo) VALUES ($1, $2, $3, $4)',
    [rows[0].id, me.id, data.last_replaced_on, '처음 등록'],
  );
  return ok({ item: toView(rows[0]) }, 201);
});
