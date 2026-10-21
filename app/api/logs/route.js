import { query } from '@/lib/db';
import { handle, ok, requireMember } from '@/lib/http';

// 전체 교체 기록: GET /api/logs  (최근 것부터)
export const GET = handle(async () => {
  const me = await requireMember();
  const { rows } = await query(
    `SELECT l.id, l.item_id, l.replaced_on, l.memo, i.name AS item_name, i.area
     FROM replacement_logs l JOIN items i ON i.id = l.item_id
     WHERE l.account_id = $1
     ORDER BY l.replaced_on DESC, l.id DESC
     LIMIT 300`,
    [me.id],
  );
  return ok({ logs: rows });
});
