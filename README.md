# CarryOn

개인 업무 관리 웹앱. 칸반 보드로 업무를 관리하고 캘린더로 날짜별 흐름을 확인합니다.

## 기능

- **칸반 보드** — 컬럼 추가/삭제/이름 변경, 카드 드래그로 순서·컬럼 이동
- **업무 관리** — 제목, 메모, 마감일 편집 / 마감일 초과 시 빨간색 표시
- **완료 처리** — 완료 컬럼으로 이동 시 completedAt 자동 기록
- **이월** — 개별/전체 미완료 업무 내일로 이월
- **캘린더 뷰** — 월간 캘린더, 날짜 클릭 시 생성·완료·경유 업무 확인
- **모바일 반응형** — 하단 탭바, 터치 드래그 지원

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- @dnd-kit/core, @dnd-kit/sortable
- 데이터: `data/tasks.json`, `data/columns.json` (로컬 파일)

## 실행 방법

```bash
npm install
npm run dev
```

WSL 환경에서는 WSL 터미널에서 실행해야 합니다 (Windows CMD/PowerShell 불가).

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 프로젝트 구조

```
src/
├── app/
│   ├── api/tasks/        # GET, POST, PATCH /api/tasks
│   ├── api/columns/      # GET, POST, PATCH /api/columns
│   ├── calendar/         # /calendar 페이지
│   └── page.tsx          # / 칸반 보드 페이지
├── components/
│   ├── TaskBoard.tsx     # DnD 로직, 상태 관리
│   ├── TaskColumn.tsx    # 컬럼
│   ├── TaskCard.tsx      # 카드
│   ├── TaskDetailModal.tsx
│   ├── CalendarView.tsx
│   ├── DaySidePanel.tsx
│   └── BottomNav.tsx
└── lib/
    ├── types.ts          # Task, Column 타입
    ├── dataStore.ts      # 파일 읽기/쓰기 (서버 전용)
    ├── taskStore.ts      # API 호출 함수 (클라이언트)
    └── calendarUtils.ts  # 날짜 계산 유틸
```
