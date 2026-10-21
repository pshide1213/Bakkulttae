import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { handle, HttpError, ok, readJson } from '@/lib/http';

// 회원가입: POST /api/auth/signup
export const POST = handle(async (request) => {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, '이메일 형식을 확인하세요.');
  if (password.length < 8) throw new HttpError(400, '비밀번호는 8자 이상으로 정하세요.');
  if (name.length < 1 || name.length > 20) throw new HttpError(400, '이름은 1~20자로 입력하세요.');

  const exists = await query('SELECT 1 FROM accounts WHERE email = $1', [email]);
  if (exists.rowCount > 0) throw new HttpError(409, '이미 가입된 이메일이에요. 로그인해 주세요.');

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    'INSERT INTO accounts (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, passwordHash, name],
  );

  await createSession(rows[0]);
  return ok({ account: rows[0] }, 201);
});
