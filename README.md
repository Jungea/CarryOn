# CarryOn

개인 업무 관리 웹앱. 칸반 보드로 업무를 관리하고 캘린더로 날짜별 흐름을 확인합니다.

## 기능

### 칸반 보드
- 컬럼 추가/삭제/이름 변경, 카드 드래그로 순서·컬럼 이동
- **필터 컬럼** — 마감일·생성일·완료일 기준으로 N일 범위 업무를 자동으로 표시 (드롭 불가)
- 업무 추가 시 컬럼 최상단에 삽입
- 완료 체크버튼으로 완료 처리 (낙관적 UI)
- 다음 컬럼으로 이동 버튼 (모바일)

### 업무 관리
- 제목, 메모, 마감일, 컬럼 편집
- 마감일 초과 시 빨간색, D-Day 표시
- 완료 시 날짜 기록, 보드에서 숨김 / 검색 시 표시

### 캘린더
- 월간 그리드, 이전/다음 달 미리보기 (클릭 시 해당 달 이동)
- 날짜 클릭 시 생성·완료·경유 업무 확인
- 공휴일·일정·연차 등록 및 삭제
- 날짜에서 바로 업무 추가

### 계정
- Supabase 이메일 인증
- 최근 로그인 계정 5개 기억 (클릭 시 자동 로그인)
- 설정 모달: 로그아웃, 전체 초기화 (이메일 확인 후)
- PWA 설치 지원

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- @dnd-kit/core, @dnd-kit/sortable
- Supabase (Auth + PostgreSQL + RLS)

## 실행 방법

```bash
npm install
npm run dev
```

WSL 환경에서는 WSL 터미널에서 실행해야 합니다 (Windows CMD/PowerShell 불가).

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

환경변수 `.env.local` 필요:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── tasks/         # GET, POST, PATCH /api/tasks
│   │   ├── columns/       # GET, POST, PUT /api/columns
│   │   ├── events/        # GET, POST, DELETE /api/events
│   │   └── reset/         # POST /api/reset
│   ├── calendar/          # /calendar 페이지
│   ├── login/             # /login 페이지
│   └── page.tsx           # / 칸반 보드 페이지
├── components/
│   ├── TaskBoard.tsx      # DnD 로직, 상태 관리
│   ├── TaskColumn.tsx     # 컬럼 (일반 + 필터)
│   ├── TaskCard.tsx       # 드래그 가능 카드
│   ├── TaskDetailModal.tsx
│   ├── FilterColumnModal.tsx
│   ├── CalendarClient.tsx
│   ├── CalendarView.tsx
│   ├── DaySidePanel.tsx
│   ├── TopNav.tsx
│   ├── BottomNav.tsx
│   ├── SettingsModal.tsx
│   └── Logo.tsx
└── lib/
    ├── types.ts           # Task, Column, CalendarEvent 타입
    ├── dataStore.ts       # Supabase 읽기 (서버 전용), 기본 컬럼 정의
    ├── taskStore.ts       # API 호출 함수 (클라이언트)
    ├── eventStore.ts      # 캘린더 이벤트 API
    ├── calendarUtils.ts   # 날짜 계산 유틸
    └── holidays.ts        # 한국 공휴일
```
