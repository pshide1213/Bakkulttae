import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSession, destroySession } from '@/lib/auth';
import { handle, HttpError, ok, readJson, requireMember } from '@/lib/http';

// 내 계정 정보: GET /api/account
export const GET = handle(async () => {
  const me = await requireMember();
  const { rows } = await query(
    `SELECT a.id, a.email, a.name, a.household_size, a.created_at,
            (SELECT COUNT(*) FROM items WHERE account_id = a.id) AS item_count,
            (SELECT COUNT(*) FROM replacement_logs WHERE account_id = a.id) AS log_count
     FROM accounts a WHERE a.id = $1`,
    [me.id],
  );
  if (!rows[0]) throw new HttpError(401, '로그인이 필요해요.');
  const a = rows[0];
  return ok({ account: { ...a, item_count: Number(a.item_count), log_count: Number(a.log_count) } });
});

// 이름·가구원 수·비밀번호 변경: PATCH /api/account
export const PATCH = handle(async (request) => {
  const me = await requireMember();
  const body = await readJson(request);

  if (body.name !== undefined || body.household_size !== undefined) {
    const name = String(body.name ?? '').trim();
    const size = Number(body.household_size);
    if (name.length < 1 || name.length > 20) throw new HttpError(400, '이름은 1~20자로 입력하세요.');
    if (!Number.isInteger(size) || size < 1 || size > 10) throw new HttpError(400, '가구원 수는 1~10명으로 입력하세요.');
    const { rows } = await query(
      'UPDATE accounts SET name = $1, household_size = $2 WHERE id = $3 RETURNING id, email, name',
      [name, size, me.id],
    );
    await createSession(rows[0]);
  }

  if (body.newPassword !== undefined) {
    const { rows } = await query('SELECT password_hash FROM accounts WHERE id = $1', [me.id]);
    const valid = rows[0] && (await bcrypt.compare(String(body.currentPassword || ''), rows[0].password_hash));
    if (!valid) throw new HttpError(400, '현재 비밀번호가 맞지 않아요.');
    if (String(body.newPassword).length < 8) throw new HttpError(400, '새 비밀번호는 8자 이상으로 정하세요.');
    const hash = await bcrypt.hash(String(body.newPassword), 10);
    await query('UPDATE accounts SET password_hash = $1 WHERE id = $2', [hash, me.id]);
  }

  return ok({ ok: true });
});

// 회원 탈퇴: DELETE /api/account (품목과 교체 기록도 함께 삭제)
export const DELETE = handle(async () => {
  const me = await requireMember();
  await query('DELETE FROM accounts WHERE id = $1', [me.id]);
  await destroySession();
  return ok({ ok: true });
});
