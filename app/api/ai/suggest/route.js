import { query } from '@/lib/db';
import { askGemini } from '@/lib/gemini';
import { handle, ok, requireMember } from '@/lib/http';
import { AREAS } from '@/lib/constants';

const SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      description: '사용자가 아직 관리하지 않는, 사람들이 자주 잊는 교체 품목 5~6개',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          area: { type: 'string', enum: AREAS },
          cycle_days: { type: 'integer' },
          reason: { type: 'string', description: '왜 챙겨야 하는지 한 문장' },
        },
        required: ['name', 'area', 'cycle_days', 'reason'],
      },
    },
  },
  required: ['suggestions'],
};

// 빠뜨린 품목 찾기: POST /api/ai/suggest
// 지금 관리 중인 품목을 보고, 많이 놓치는 교체 품목을 추천합니다.
export const POST = handle(async () => {
  const me = await requireMember();
  const [account, items] = await Promise.all([
    query('SELECT household_size FROM accounts WHERE id = $1', [me.id]),
    query('SELECT name, area FROM items WHERE account_id = $1 ORDER BY name', [me.id]),
  ]);
  const household = account.rows[0]?.household_size ?? 1;
  const current = items.rows.map((i) => `${i.name}(${i.area})`).join(', ') || '아직 없음';

  const result = await askGemini({
    system:
      '너는 집안 살림 점검 도우미야. 사용자가 이미 관리 중인 품목과 겹치지 않게, ' +
      '한국 가정에서 교체 시기를 자주 놓치는 생활용품을 추천해. 여러 구역(욕실, 주방, 침실 등)에 고르게 섞어. ' +
      '이유는 짧은 해요체 한 문장으로.',
    input: `가구원 수: ${household}명\n지금 관리 중인 품목: ${current}`,
    schema: SCHEMA,
  });

  const owned = new Set(items.rows.map((i) => i.name.replace(/\s/g, '')));
  const suggestions = (result.suggestions || [])
    .filter((s) => s.name && !owned.has(s.name.replace(/\s/g, '')))
    .map((s) => ({
      name: s.name.slice(0, 60),
      area: AREAS.includes(s.area) ? s.area : '기타',
      cycle_days: Math.min(3650, Math.max(1, Math.round(Number(s.cycle_days)) || 90)),
      reason: s.reason,
    }))
    .slice(0, 6);

  return ok({ suggestions });
});
