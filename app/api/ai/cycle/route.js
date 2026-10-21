import { query } from '@/lib/db';
import { askGemini } from '@/lib/gemini';
import { handle, HttpError, ok, readJson, requireMember } from '@/lib/http';
import { AREAS } from '@/lib/constants';
import { josa } from '@/lib/josa';

const SCHEMA = {
  type: 'object',
  properties: {
    is_household_item: { type: 'boolean', description: '주기적으로 바꾸거나 관리하는 생활용품·소모품이면 true' },
    normalized_name: { type: 'string', description: '보기 좋게 다듬은 품목 이름 (예: 칫솔, 정수기 필터)' },
    area: { type: 'string', enum: AREAS },
    cycle_days: { type: 'integer', description: '권장 교체 주기(일). 1~3650' },
    cycle_label: { type: 'string', description: '사람이 읽기 쉬운 주기 (예: 3개월, 2주)' },
    reason: { type: 'string', description: '이 주기를 권하는 이유 한두 문장' },
    signs: { type: 'array', items: { type: 'string' }, description: '주기와 상관없이 바로 바꿔야 하는 신호 2~3개' },
    tips: { type: 'array', items: { type: 'string' }, description: '더 오래, 깨끗하게 쓰는 관리 팁 2개' },
  },
  required: ['is_household_item', 'normalized_name', 'area', 'cycle_days', 'cycle_label', 'reason', 'signs', 'tips'],
};

// 교체 주기 추천: POST /api/ai/cycle  { name, note? }
export const POST = handle(async (request) => {
  const me = await requireMember();
  const body = await readJson(request);
  const name = String(body.name || '').trim();
  if (!name) throw new HttpError(400, '어떤 물건인지 먼저 입력하세요.');
  if (name.length > 60) throw new HttpError(400, '품목 이름은 60자 이하로 입력하세요.');

  const { rows } = await query('SELECT household_size FROM accounts WHERE id = $1', [me.id]);
  const household = rows[0]?.household_size ?? 1;
  const note = String(body.note || '').trim().slice(0, 200);

  const result = await askGemini({
    system:
      '너는 집안 살림과 위생 관리 전문가야. 한국 가정 기준으로 생활용품의 일반적인 교체 주기를 알려줘. ' +
      '제조사·위생 단체에서 흔히 권하는 범위 안에서 현실적인 값을 고르고, 과장하지 마. ' +
      '의약품 복용이나 진단 같은 의료 조언은 하지 마. 문장은 짧은 해요체로 써.',
    input: `품목: ${name}\n가구원 수: ${household}명${note ? `\n사용자 메모: ${note}` : ''}`,
    schema: SCHEMA,
  });

  if (!result.is_household_item) {
    throw new HttpError(422, `${josa(name, '은/는')} 교체 주기를 정하기 어려운 물건 같아요. 직접 주기를 입력해 주세요.`);
  }
  const days = Math.round(Number(result.cycle_days));
  return ok({
    recommendation: {
      name: result.normalized_name || name,
      area: AREAS.includes(result.area) ? result.area : '기타',
      cycle_days: Number.isInteger(days) && days >= 1 && days <= 3650 ? days : 90,
      cycle_label: result.cycle_label,
      reason: result.reason,
      signs: (result.signs || []).slice(0, 3),
      tips: (result.tips || []).slice(0, 2),
    },
  });
});
