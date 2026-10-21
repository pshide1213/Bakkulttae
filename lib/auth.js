import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'bakkul_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7일

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET 환경변수가 없어요.');
    }
    return new TextEncoder().encode('local-dev-secret-please-set-AUTH_SECRET-in-env');
  }
  return new TextEncoder().encode(secret);
}

/** 로그인 성공 시 JWT를 만들어 httpOnly 쿠키에 저장 */
export async function createSession(member) {
  const token = await new SignJWT({ name: member.name, email: member.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(member.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** 쿠키의 JWT를 검증해서 로그인한 회원 정보를 돌려줌 (없으면 null) */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { id: Number(payload.sub), name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
