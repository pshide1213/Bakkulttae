# 바꿀때 — 생활용품 교체 주기 관리

칫솔·수세미·정수기 필터처럼 주기적으로 바꿔야 하는 물건의 교체 시기를 챙겨주는 웹 서비스입니다.
이름만 입력하면 AI가 교체 주기와 관리법을 알려주고, 4주 달력과 남은 수명 막대로 바꿀 때를 보여줍니다.

## 과제 요구사항 대응

| 요구사항 | 구현 |
| --- | --- |
| 회원가입·로그인 | 이메일/비밀번호 가입, bcrypt 암호화, JWT를 httpOnly 쿠키에 저장 |
| CRUD | 품목 등록·조회·수정·삭제, 교체 기록 추가·수정·삭제, 계정 정보 수정·탈퇴 |
| AI 기능 | Gemini가 품목별 교체 주기·교체 신호·관리 팁 추천(`/api/ai/cycle`), 빠뜨린 품목 추천(`/api/ai/suggest`) |
| API 사용 | Google Gemini API(Interactions API), 직접 만든 REST API(`app/api/*`) |
| DB | PostgreSQL (Neon) — 첫 접속 때 테이블 자동 생성 |

기술 스택: Next.js 16 (App Router) · PostgreSQL(pg) · Gemini API(@google/genai)

## 로컬에서 실행

1. `npm install`
2. `.env.example`을 복사해 `.env.local`을 만들고 값 채우기 (아래 "환경변수 얻는 곳" 참고)
3. `npm run dev` → 브라우저에서 http://localhost:3000

## 환경변수 얻는 곳

| 이름 | 얻는 곳 |
| --- | --- |
| `DATABASE_URL` | Vercel에서 Neon DB를 만들면 배포용은 자동으로 들어감 (아래 배포 3번). 로컬용은 프로젝트 폴더 터미널에서 `npx vercel link` → `npx vercel env pull .env.local` 하면 `.env.local`에 받아짐. 직접 복사하려면 Vercel 프로젝트 화면 위쪽 탭 줄의 **Storage** → DB 이름 클릭 → 연결 문자열(`postgresql://…`) 복사 |
| `AUTH_SECRET` | 아무 긴 문자열(32자 이상). 터미널에서 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey 접속 (Google AI Studio 왼쪽 메뉴 **Dashboard** → **API Keys** 화면) → **Create API key** 버튼 → 만들어진 키 복사 |

## Vercel 배포

1. GitHub에 새 저장소를 만들고 이 폴더를 push (`.env.local`은 `.gitignore`에 있어 올라가지 않음)
2. https://vercel.com 로그인 → 대시보드 오른쪽 위 **Add New…** → **Project** → 목록에서 저장소 오른쪽의 **Import**
3. DB 만들기: 프로젝트 화면 위쪽 탭 줄의 **Storage** → **Create Database** → **Neon** 선택 → 지역(Region)은 한국과 가까운 아시아 지역 선택 → 만들기 → 다음 화면에서 이 프로젝트를 골라 **Connect** (`DATABASE_URL`이 환경변수에 자동 등록됨)
4. 프로젝트 화면 위쪽 탭 줄의 **Settings** → 왼쪽 메뉴 **Environment Variables** → `AUTH_SECRET`, `GEMINI_API_KEY` 추가 후 **Save**
5. 위쪽 탭 줄의 **Deployments** → 가장 위 배포 줄 오른쪽 끝 **⋯** → **Redeploy** (환경변수는 다시 배포해야 적용됨)

## 폴더 구조

```
app/
  page.js                 첫 화면(로그인 전)
  (auth)/login, signup    로그인·회원가입
  (app)/dashboard         오늘의 점검: 4주 교체 달력 + 남은 수명 목록
  (app)/items/new         품목 추가 (AI 주기 추천)
  (app)/items/[id]        품목 상세: 남은 수명, 교체 기록, AI 관리법
  (app)/items/[id]/edit   품목 수정
  (app)/suggest           AI 빠뜨린 품목 찾기
  (app)/history           전체 교체 기록(월별)
  (app)/settings          계정·가구원 수·비밀번호·탈퇴
  api/auth/*              가입·로그인·로그아웃
  api/items/*             품목 CRUD, 교체 처리(replace)
  api/logs/*              교체 기록 조회·수정·삭제
  api/ai/cycle, suggest   Gemini 호출
  api/account             계정 조회·수정·탈퇴
lib/                      DB 연결·인증·Gemini·날짜/수명 계산
components/               남은 수명 막대, 품목 입력 폼 등
```

## DB 테이블

- `accounts` — id, email, password_hash, name, household_size, created_at
- `items` — id, account_id(FK), name, area, cycle_days, last_replaced_on, note, ai_reason, ai_signs, ai_tips, created_at, updated_at
- `replacement_logs` — id, item_id(FK), account_id(FK), replaced_on, memo, created_at
