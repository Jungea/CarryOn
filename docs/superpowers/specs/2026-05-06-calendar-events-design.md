# 캘린더 이벤트 (커스텀 공휴일 & 연차) 설계

## 목표
사용자가 커스텀 공휴일과 연차(종류별)를 직접 등록하고, 캘린더와 상세 패널에서 확인할 수 있다.

## 데이터 모델

```ts
type LeaveType = '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차'
type EventType = 'holiday' | LeaveType

interface CalendarEvent {
  id: string
  date: string       // "YYYY-MM-DD"
  type: EventType
  name?: string      // holiday 타입만 필수, 나머지는 type 이름 그대로 표시
  createdAt: string
}
```

`dataStore`의 JSON에 `calendarEvents: CalendarEvent[]` 배열 추가.

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/calendar-events` | 전체 조회 |
| POST | `/api/calendar-events` | 추가 |
| DELETE | `/api/calendar-events/[id]` | 삭제 |

## 저장소

`src/lib/eventStore.ts` 신규 추가 (기존 `taskStore.ts` 패턴 동일).

## 캘린더 셀 표시

- **커스텀 공휴일**: 기존 공휴일과 동일 스타일 (빨간 점/텍스트). `CalendarView`에서 `getHolidayName` 결과와 병합.
- **연차/반차류**: 주황색 pill (데스크탑), 주황 점 (모바일).
- `CalendarPage`에서 이벤트 fetch → `CalendarView`와 `DaySidePanel`에 prop으로 전달.

## 설정 모달 (`CalendarSettings.tsx`)

- 캘린더 헤더 우측 ⚙ 버튼으로 열기
- 탭 2개: **공휴일** / **연차**
- 공휴일 탭: 날짜 + 이름 입력 → 추가, 목록에서 항목별 삭제
- 연차 탭: 날짜 + 종류 선택 드롭다운 → 추가, 목록에서 삭제

## 상세 패널 빠른 추가 (`DaySidePanel`)

- 패널 하단에 "추가" 섹션
- 공휴일: 이름 입력 + 추가 버튼
- 연차: 종류 드롭다운 + 추가 버튼
- 추가/삭제 시 부모 state 즉시 반영 (낙관적 업데이트)

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `src/lib/types.ts` | `CalendarEvent`, `EventType` 타입 추가 |
| `src/lib/dataStore.ts` | `calendarEvents` 배열 추가 |
| `src/lib/eventStore.ts` | 신규 — CRUD 함수 |
| `src/app/api/calendar-events/route.ts` | 신규 — GET, POST |
| `src/app/api/calendar-events/[id]/route.ts` | 신규 — DELETE |
| `src/components/CalendarSettings.tsx` | 신규 — 설정 모달 |
| `src/components/CalendarView.tsx` | events prop 추가, 셀 표시 |
| `src/components/DaySidePanel.tsx` | 빠른 추가 섹션, events prop |
| `src/app/calendar/page.tsx` | events fetch, state 관리 |
