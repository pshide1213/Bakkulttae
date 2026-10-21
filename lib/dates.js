// 서버(Vercel은 UTC)와 브라우저 어디서든 한국 날짜 기준으로 계산하기 위한 함수들

export function todayInSeoul() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function toUtc(value) {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 오늘부터 만료일까지 남은 날 (지났으면 음수) */
export function daysLeft(expiresOn, today = todayInSeoul()) {
  return Math.round((toUtc(expiresOn) - toUtc(today)) / 86400000);
}

export function formatDDay(days) {
  if (days === 0) return 'D-DAY';
  return days > 0 ? `D-${days}` : `D+${-days}`;
}

export function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${y}.${m}.${d}`;
}

export function addDays(value, days) {
  const date = new Date(toUtc(value) + days * 86400000);
  return date.toISOString().slice(0, 10);
}

/** a부터 b까지 며칠인지 (b가 뒤면 양수) */
export function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function weekdayOf(value) {
  const [y, m, d] = value.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** '2026-10-21' → '10월 21일' (올해가 아니면 '2027년 10월 21일') */
export function formatMonthDay(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  const thisYear = Number(todayInSeoul().slice(0, 4));
  return y === thisYear ? `${m}월 ${d}일` : `${y}년 ${m}월 ${d}일`;
}
