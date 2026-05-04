# CarryOn — Design Spec

**Date:** 2026-05-04  
**Status:** Approved

---

## Overview

CarryOn은 개인용 업무 관리 웹서비스다. 업무를 칸반 보드로 관리하고, 캘린더에서 날짜별 업무 흐름을 확인할 수 있다. 로그인 없이 브라우저 localStorage에 데이터를 저장하며, 향후 계정 기반 로그인과 서버 동기화를 추가할 수 있도록 설계한다.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Storage:** 로컬 JSON 파일 (Next.js API Route로 파일시스템 읽기/쓰기)
- **Mobile:** 반응형 웹 — 로컬 네트워크 IP로 모바일 브라우저 접속
- **드래그 앤 드롭:** @dnd-kit/core

---

## Architecture

### 페이지 구조

```
/           — 업무 목록 (칸반 보드)
/calendar   — 캘린더 뷰
```

### 컴포넌트 구조

```
TaskStore          — API Route 호출 전담 레이어 (향후 DB로 교체 가능)
TaskBoard          — 칸반 보드 (커스텀 컬럼)
  ColumnHeader     — 컬럼 이름 편집, 삭제, 순서 변경
  TaskCard         — 개별 업무 카드
  TaskDetailModal  — 업무 상세 편집 모달
CalendarView       — 월간 달력
  DayCell          — 날짜 칸 (업무 개수 표시)
  DaySidePanel     — 날짜 클릭 시 업무 목록 사이드 패널
BottomNav          — 모바일 하단 탭바 (목록 ↔ 캘린더)
```

---

## Data Model

### Task

```typescript
interface Task {
  id: string
  title: string
  memo: string
  dueDate: string | null      // ISO 날짜 문자열 (YYYY-MM-DD)
  columnId: string            // 소속 컬럼 ID
  createdAt: string           // ISO datetime 문자열 (new Date().toISOString())
  completedAt: string | null  // 완료 시 기록, 미완료 시 null — ISO datetime
  order: number               // 컬럼 내 정렬 순서
}
```

### Column

```typescript
interface Column {
  id: string
  name: string
  order: number
  isCompletedColumn: boolean  // true인 컬럼으로 이동 시 completedAt 기록
}
```

### 기본 컬럼 (초기값)

| 순서 | 이름 | isCompletedColumn |
|------|------|-------------------|
| 1 | 미분류 | false |
| 2 | 금일작업필수 | false |
| 3 | 진행중 | false |
| 4 | 완료 | true |

---

## Features

### 업무 목록 (`/`)

- **칸반 보드:** 컬럼별로 업무 카드 표시
- **드래그 앤 드롭:** 카드를 끌어 컬럼 간 이동 (상태 변경), 컬럼 순서도 드래그로 변경
- **업무 카드:**
  - 제목, 마감일 표시
  - "내일로 가져가기" 버튼 — 오늘 날짜를 carriedOver 처리 (내부적으로는 별도 동작 없음, 캘린더 계산에 반영)
  - 클릭 시 상세 편집 모달 열림
- **업무 상세 모달:** 제목, 메모, 마감일 편집
- **전체 이월 버튼:** 미완료 업무 전체를 다음날로 가져가기 (현재는 UI 액션, 캘린더에서 날짜 범위로 자동 반영)
- **컬럼 관리:** 추가, 삭제, 이름 변경, 순서 변경 가능

### 캘린더 (`/calendar`)

- **월간 뷰:** 각 날짜 칸에 관련 업무 개수 표시
- **날짜 클릭:** 사이드 패널에 해당 날짜의 업무 목록 표시
  - **생성된 업무:** `createdAt`의 날짜 부분 == 선택날짜
  - **완료된 업무:** `completedAt`의 날짜 부분 == 선택날짜
  - **경유 중인 업무:** 생성일 < 선택날짜 AND (`completedAt == null` OR 완료일 > 선택날짜)
- 이월로 인한 날짜별 배열 저장 없음 — 날짜 범위 계산으로 처리

### 다음날로 가져가기

- **개별:** 카드의 "내일로" 버튼 → 별도 데이터 변경 없음 (범위 기반 캘린더가 자동 포함)
- **전체:** "미완료 전체 이월" 버튼 → 동일하게 별도 데이터 변경 없음
- 실질적으로 이 기능은 UX적 확인 액션이며, 미완료 업무는 날짜 범위상 자동으로 모든 날에 경유 업무로 표시됨

### 모바일

- 칸반 보드: 컬럼을 세로로 순서대로 나열
- 하단 탭바: 목록 ↔ 캘린더 전환
- 터치 기반 드래그 앤 드롭 지원 (@dnd-kit은 터치 지원 내장)

---

## Storage Schema

**파일 위치:** Next.js 프로젝트 루트의 `data/` 디렉토리

```
data/tasks.json    — Task[] (JSON)
data/columns.json  — Column[] (JSON)
```

**API Routes:**
```
GET  /api/tasks        — 전체 업무 조회
POST /api/tasks        — 업무 생성
PUT  /api/tasks/[id]   — 업무 수정
DELETE /api/tasks/[id] — 업무 삭제

GET  /api/columns      — 전체 컬럼 조회
POST /api/columns      — 컬럼 생성
PUT  /api/columns/[id] — 컬럼 수정 (이름, 순서)
DELETE /api/columns/[id] — 컬럼 삭제
```

TaskStore가 이 API들을 호출하는 단일 진입점. 향후 DB로 교체 시 API Route 내부만 수정하면 됨.
브라우저 캐시 삭제와 무관하게 `data/` 파일에 영구 저장됨.

---

## Future Considerations (현재 미구현)

- 로그인 / 계정 기반 인증 (DB로 교체)
- 여러 기기 동기화
- 다크모드
- 검색 / 필터
