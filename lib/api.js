// 브라우저에서 우리 API를 부르는 작은 도우미
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth')) {
    window.location.href = '/login';
  }
  if (!res.ok) throw new Error(data.error || '요청을 처리하지 못했어요.');
  return data;
}
