export const AREAS = ['욕실', '주방', '침실', '거실', '세탁실', '건강', '차량', '기타'];

export const CYCLE_UNITS = [
  { key: 'day', label: '일', days: 1 },
  { key: 'week', label: '주', days: 7 },
  { key: 'month', label: '개월', days: 30 },
  { key: 'year', label: '년', days: 365 },
];

/** 90 → '3개월', 14 → '2주', 730 → '2년' */
export function cycleLabel(days) {
  if (days % 365 === 0) return `${days / 365}년`;
  if (days % 30 === 0) return `${days / 30}개월`;
  if (days % 7 === 0) return `${days / 7}주`;
  return `${days}일`;
}

/** 일 수를 가장 자연스러운 단위로 나눔: 90 → { amount: 3, unit: 'month' } */
export function splitCycle(days) {
  if (days % 365 === 0) return { amount: days / 365, unit: 'year' };
  if (days % 30 === 0) return { amount: days / 30, unit: 'month' };
  if (days % 7 === 0) return { amount: days / 7, unit: 'week' };
  return { amount: days, unit: 'day' };
}

export const STATUS_TEXT = { overdue: '교체 시기 지남', soon: '곧 교체', ok: '여유 있음' };
