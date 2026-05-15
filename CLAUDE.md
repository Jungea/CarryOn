# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 규칙

파일을 수정하기 전에 반드시 어떤 파일의 어떤 부분을 어떻게 바꿀 것인지 먼저 설명하고, 사용자 확인을 받은 후 수정한다.

## 주의: Next.js 16

이 프로젝트는 Next.js 16을 사용합니다. 훈련 데이터의 Next.js와 API, 컨벤션, 파일 구조가 다를 수 있습니다. 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 읽고 deprecation 경고를 따르세요.

## 명령어

```bash
npm run dev        # 개발 서버 (CHOKIDAR_USEPOLLING=true, WSL 터미널에서 실행)
npm run build      # 프로덕션 빌드
npm run lint       # ESLint
npm test           # Jest 전체 테스트
npm run test:watch # Jest watch 모드
npx jest src/__tests__/calendarUtils.test.ts  # 단일 테스트 파일 실행
```

환경변수 `.env.local` 필요:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 아키텍처

### 페이지 구조
- `/` — 칸반 보드 (`src/app/page.tsx`)
- `/calendar` — 캘린더 (`src/app/calendar/page.tsx`)
- `/login` — 로그인/회원가입
- `/tasks` — 업무 목록

### 클라이언트 / 서버 분리
- `src/lib/dataStore.ts` — **서버 전용** Supabase 읽기 함수. API Route Handler와 Server Component에서만 사용
- `src/lib/taskStore.ts` — **클라이언트 전용** API 호출 함수 (`/api/*` fetch). `'use client'` 컴포넌트에서 사용
- `src/lib/eventStore.ts` — 캘린더 이벤트 API 클라이언트 함수

### API Routes (`src/app/api/`)
| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/tasks` | GET, POST, PATCH | 업무 목록 / 생성 / 일괄 수정 |
| `/api/tasks/[id]` | PUT, DELETE | 업무 수정 / 삭제 |
| `/api/columns` | GET, POST, PATCH | 컬럼 목록 / 생성 / 일괄 수정 |
| `/api/columns/[id]` | PUT, DELETE | 컬럼 수정 / 삭제 |
| `/api/calendar-events` | GET, POST | 이벤트 목록 / 생성 |
| `/api/calendar-events/[id]` | DELETE | 이벤트 삭제 |
| `/api/reset` | POST | 전체 데이터 초기화 |
| `/api/setup` | POST | 최초 가입 시 기본 컬럼 생성 |

### DB 컬럼명 변환
Supabase(PostgreSQL)는 snake_case, TypeScript는 camelCase. `dataStore.ts`의 `toTask()`, `toColumn()`, `toCalendarEvent()` 함수가 변환 담당.

| DB | TypeScript |
|----|-----------|
| `column_id` | `columnId` |
| `due_date` | `dueDate` |
| `created_at` | `createdAt` |
| `completed_at` | `completedAt` |
| `is_completed_column` | `isCompletedColumn` |
| `filter_type` | `filterType` |
| `filter_days` | `filterDays` |

### 핵심 컴포넌트
- `TaskBoard.tsx` — DnD 로직과 상태 관리 중심. `@dnd-kit/core`, `@dnd-kit/sortable` 사용
- `TaskColumn.tsx` — 일반 컬럼과 필터 컬럼 모두 처리 (필터 컬럼은 드롭 불가)
- `CalendarClient.tsx` / `CalendarView.tsx` — 캘린더 페이지 클라이언트 로직

### 필터 컬럼
`Column.filterType`(`dueDate` | `createdAt` | `completedAt`)과 `filterDays`가 설정된 컬럼은 해당 날짜 기준 N일 이내 업무를 자동으로 표시. 카드를 드롭할 수 없음.

### 인증
Supabase Auth (이메일). `src/lib/supabase-browser.ts` (클라이언트), `src/lib/supabase-server.ts` (서버). RLS로 유저별 데이터 격리.

### 테스트
`src/__tests__/` 아래 Jest + ts-jest. 현재 `calendarUtils.ts` 유틸 함수만 테스트 존재.
