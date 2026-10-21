import { query } from '@/lib/db';
import { handle, HttpError, ok, parseId, readJson, requireMember } from '@/lib/http';
import { findOwnedItem, syncLastReplaced, toView } from '@/lib/items';
import { isValidDateString, todayInSeoul } from '@/lib/dates';

// 교체했어요: POST /api/items/:id/replace  { replaced_on?, memo? }
// 교체 기록을 하나 추가하고 품목의 마지막 교체일을 갱신합니다.
export const POST = handle(async (request, { params }) => {
  const me = await requireMember();
  const id = parseId((await params).id);
  await findOwnedItem(me.id, id);
  const body = await readJson(request).catch(() => ({}));

  const today = todayInSeoul();
  const replacedOn = body.replaced_on || today;
  if (!isValidDateString(replacedOn) || replacedOn > today) {
    throw new HttpError(400, '교체한 날짜는 오늘이나 그 전 날짜여야 해요.');
  }
  const memo = typeof body.memo === 'string' ? body.memo.trim().slice(0, 200) || null : null;

  const log = await query(
    'INSERT INTO replacement_logs (item_id, account_id, replaced_on, memo) VALUES ($1, $2, $3, $4) RETURNING id, replaced_on, memo, created_at',
    [id, me.id, replacedOn, memo],
  );
  await syncLastReplaced(id);
  const item = await findOwnedItem(me.id, id);
  return ok({ item: toView(item), log: log.rows[0] }, 201);
});
