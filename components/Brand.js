// 한 바퀴 돌아 새것으로 바뀌는 순환 화살표 로고
export default function Brand({ size = 26 }) {
  return (
    <span className="brand">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#2e8a5f" />
        <path d="M22.5 12.5A7 7 0 0 0 9.6 13" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M9.5 19.5a7 7 0 0 0 12.9-.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M23.4 8.8v4.4H19" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.6 23.2v-4.4H13" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>바꿀때</span>
    </span>
  );
}
