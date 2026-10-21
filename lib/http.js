import { getSession } from './auth';

/** API에서 사용할 에러 (상태코드 + 사용자에게 보여줄 메시지) */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function ok(data, status = 200) {
  return Response.json(data, { status });
}

/** 라우트 핸들러를 감싸서 에러를 JSON 응답으로 바꿔줌 */
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      console.error('[api error]', error);
      return Response.json(
        { error: '서버에서 문제가 생겼어요. 잠시 후 다시 시도하세요.' },
        { status: 500 },
      );
    }
  };
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, '요청 형식이 올바르지 않아요.');
  }
}

export async function requireMember() {
  const session = await getSession();
  if (!session) throw new HttpError(401, '로그인이 필요해요.');
  return session;
}

export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, '찾을 수 없는 항목이에요.');
  return id;
}
