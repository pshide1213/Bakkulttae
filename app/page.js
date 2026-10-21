import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Brand from '@/components/Brand';
import Icon from '@/components/Icon';
import Wear, { remainingText } from '@/components/Wear';

// 첫 화면 미리보기에 쓰는 예시 품목
const PREVIEW = [
  { name: '수세미', cycle: '1개월', status: 'overdue', wear: 1, days_remaining: -4 },
  { name: '칫솔', cycle: '3개월', status: 'soon', wear: 0.93, days_remaining: 6 },
  { name: '정수기 필터', cycle: '6개월', status: 'ok', wear: 0.55, days_remaining: 81 },
  { name: '베개', cycle: '2년', status: 'ok', wear: 0.2, days_remaining: 584 },
];

export default async function Landing() {
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <>
      <header className="site-nav">
        <Brand />
        <nav className="site-nav-links">
          <Link href="/login" className="btn btn-quiet">
            로그인
          </Link>
          <Link href="/signup" className="btn">
            무료로 시작
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <h1>
              칫솔은 3개월,
              <br />
              수세미는 한 달.
              <br />
              언제 바꿨는지는
              <br />
              바꿀때가 기억할게요.
            </h1>
            <p className="hero-copy">
              집에서 주기적으로 바꿔야 하는 물건을 한곳에 모아두세요. 이름만 입력하면 AI가 알맞은 교체 주기와 관리법을 알려주고,
              바꿀 때가 되면 목록 맨 위로 올려드려요.
            </p>
            <div className="hero-actions">
              <Link href="/signup" className="btn btn-lg btn-leaf">
                우리 집 목록 만들기
              </Link>
              <Link href="/login" className="btn btn-lg btn-line">
                로그인
              </Link>
            </div>
          </div>

          <div className="preview-panel" aria-label="화면 미리보기">
            <div className="preview-head">오늘의 점검</div>
            {PREVIEW.map((item) => (
              <div className="preview-row" key={item.name}>
                <div>
                  <div className="item-name">{item.name}</div>
                  <span className="item-cycle">{item.cycle}마다</span>
                </div>
                <div className="wear-cell">
                  <Wear item={item} />
                  <div className="wear-meta">
                    <span className="status-text" data-status={item.status}>
                      {remainingText(item)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="how">
          <div className="how-inner">
            <div className="how-item">
              <span className="how-icon">
                <Icon name="sparkle" />
              </span>
              <h2>이름만 쓰면 주기는 AI가</h2>
              <p>“샤워기 필터”라고만 써도 권장 교체 주기, 바로 바꿔야 하는 신호, 오래 쓰는 관리 팁까지 채워줘요.</p>
            </div>
            <div className="how-item">
              <span className="how-icon">
                <Icon name="calendar" />
              </span>
              <h2>4주 달력으로 한눈에</h2>
              <p>이번 달에 바꿀 물건이 날짜별로 놓여 있어요. 지난 것은 따로 모아 먼저 보여드려요.</p>
            </div>
            <div className="how-item">
              <span className="how-icon">
                <Icon name="history" />
              </span>
              <h2>바꾼 날은 기록으로</h2>
              <p>“바꿨어요”를 누르면 기록이 남고 다음 교체일이 다시 계산돼요. 실제로 얼마 만에 바꿨는지도 볼 수 있어요.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-foot">바꿀때, 생활용품 교체 주기 관리</footer>
    </>
  );
}
