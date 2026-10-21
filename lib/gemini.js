import { GoogleGenAI } from '@google/genai';
import { HttpError } from './http';

// 앞의 모델이 실패(한도 초과, 모델 없음 등)하면 다음 모델로 다시 시도합니다.
function modelCandidates() {
  const list = [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash-lite']
    .map((m) => (m || '').trim())
    .filter(Boolean);
  return [...new Set(list)];
}

function parseJsonText(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Gemini Interactions API를 호출해서 JSON 스키마에 맞는 결과를 받아옵니다.
 * @param {object} options
 * @param {string} options.system  - 시스템 지시문 (AI의 역할)
 * @param {Array}  options.input   - [{type:'text', text}, {type:'image', data, mime_type}]
 * @param {object} options.schema  - 응답 JSON 스키마
 */
export async function askGemini({ system, input, schema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, 'AI 기능을 쓰려면 GEMINI_API_KEY 환경변수를 설정해야 해요.');
  }

  const client = new GoogleGenAI({ apiKey });
  let lastError;

  for (const model of modelCandidates()) {
    try {
      const interaction = await client.interactions.create({
        model,
        system_instruction: system,
        input,
        response_format: { type: 'text', mime_type: 'application/json', schema },
        store: false, // 대화 내용을 구글 서버에 저장하지 않음
      });
      if (!interaction.output_text) throw new Error('빈 응답');
      return parseJsonText(interaction.output_text);
    } catch (error) {
      lastError = error;
      console.error(`[gemini] ${model} 호출 실패:`, error?.status ?? '', error?.message);
    }
  }

  const status = lastError?.status;
  if (status === 400 || status === 401 || status === 403) {
    throw new HttpError(502, 'Gemini API 키를 확인하세요. 키가 잘못됐거나 권한이 없어요.');
  }
  if (status === 429) {
    throw new HttpError(429, 'AI 사용량 한도에 걸렸어요. 1분쯤 뒤에 다시 시도하세요.');
  }
  throw new HttpError(502, 'AI 응답을 받지 못했어요. 잠시 후 다시 시도하세요.');
}
