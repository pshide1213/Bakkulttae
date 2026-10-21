/** 남은 수명을 글로: '23일 남음', '오늘 교체', '5일 지남' */
export function remainingText(item) {
  if (item.days_remaining < 0) return `${-item.days_remaining}일 지남`;
  if (item.days_remaining === 0) return '오늘 교체';
  return `${item.days_remaining}일 남음`;
}

/** 닳는 막대: 빗금은 이미 쓴 기간, 색칠된 부분은 남은 수명 */
export default function Wear({ item, large = false }) {
  const left = item.status === 'overdue' ? 0 : Math.max(0, 1 - item.wear);
  return (
    <div
      className={`wear${large ? ' wear-lg' : ''}`}
      data-status={item.status}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(left * 100)}
      aria-label={`남은 수명 ${Math.round(left * 100)}%`}
    >
      <span className="wear-left" style={{ width: `${left * 100}%` }} />
    </div>
  );
}
