import { destroySession } from '@/lib/auth';
import { handle, ok } from '@/lib/http';

// 로그아웃: POST /api/auth/logout
export const POST = handle(async () => {
  await destroySession();
  return ok({ ok: true });
});
