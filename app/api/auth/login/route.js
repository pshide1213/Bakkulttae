import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { handle, HttpError, ok, readJson } from '@/lib/http';

// 로그인: POST /api/auth/login
export const POST = handle(async (request) => {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const { rows } = await query(
    'SELECT id, email, name, password_hash FROM accounts WHERE email = $1',
    [email],
  );
  const account = rows[0];
  const valid = account ? await bcrypt.compare(password, account.password_hash) : false;
  if (!valid) throw new HttpError(401, '이메일 또는 비밀번호가 맞지 않아요.');

  await createSession(account);
  return ok({ account: { id: account.id, email: account.email, name: account.name } });
});
