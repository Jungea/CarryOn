# Calendar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CalendarView의 셀을 크게 키우고 색상/타이포를 개선해 가독성과 시각적 완성도를 높인다.

**Architecture:** `src/components/CalendarView.tsx` 단일 파일만 수정. 레이아웃(셀 높이, 날짜 정렬), 스타일(헤더, 오늘 강조, 주말 배경, 업무 pill) 변경. 데이터/로직은 그대로 유지.

**Tech Stack:** React, Tailwind CSS, @dnd-kit (미사용), Next.js App Router

---

### Task 1: 셀 높이 및 날짜 숫자 정렬 개선

**Files:**
- Modify: `src/components/CalendarView.tsx`

현재 셀 버튼:
```tsx
<button
  key={dateStr}
  onClick={() => onDayClick(dateStr)}
  className={`
    flex flex-col items-start p-1 rounded-lg min-h-14 transition-colors w-full
    ${isSelected ? 'bg-blue-500 text-white' : isToday ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'}
  `}
>
  <span
    className={`
      self-center text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
      ${isSelected ? 'text-white' : isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}
    `}
  >
    {date.getDate()}
  </span>
```

- [ ] **Step 1: 셀 높이와 날짜 숫자 정렬 변경**

`src/components/CalendarView.tsx`의 셀 버튼 className을 다음으로 교체:

```tsx
<button
  key={dateStr}
  onClick={() => onDayClick(dateStr)}
  className={`
    flex flex-col items-start p-1.5 rounded-lg min-h-20 sm:min-h-32 transition-colors w-full
    ${isSelected
      ? 'bg-blue-500 text-white'
      : isToday
      ? 'bg-blue-50 border border-blue-200'
      : isSunday || isSaturday
      ? 'bg-gray-50 hover:bg-gray-100'
      : 'hover:bg-gray-100'}
  `}
>
  <span
    className={`
      text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
      ${isToday && !isSelected ? 'bg-blue-500 text-white' : ''}
      ${isSelected ? 'text-white' : isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}
    `}
  >
    {date.getDate()}
  </span>
```

- [ ] **Step 2: 개발 서버에서 시각 확인**

```bash
cd /mnt/d/practice/carryon && npm run dev
```

브라우저에서 `/calendar` 접속 → 셀이 더 크고, 오늘 날짜에 파란 원이 생겼는지 확인

- [ ] **Step 3: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "디자인: 캘린더 셀 높이 확대 및 오늘 날짜 원형 강조"
```

---

### Task 2: 업무 pill 스타일 개선

**Files:**
- Modify: `src/components/CalendarView.tsx`

현재 업무 제목 span:
```tsx
<span
  key={task.id}
  className={`w-full truncate text-[10px] px-1 rounded leading-tight
    ${isSelected
      ? 'text-white'
      : type === 'created'
      ? 'text-blue-600'
      : 'text-green-600'
    }`}
>
  {task.title}
</span>
```

- [ ] **Step 1: pill 스타일 적용 및 모바일 표시 개수 제한**

`CalendarView.tsx`에서 `MAX` 상수와 `visibleTitled` 계산 부분을 수정:

```tsx
// 모바일(sm 미만)은 1개, 데스크탑은 3개 — 런타임에서는 3개로 통일하고 CSS로 숨김
const MAX = 3
const visibleTitled = titled.slice(0, MAX)
const overflow = titled.length - MAX
```

업무 제목 span을 다음으로 교체:

```tsx
{visibleTitled.map(({ task, type }, idx) => (
  <span
    key={task.id}
    className={`w-full truncate text-[10px] px-1.5 py-0.5 rounded-full leading-tight
      ${idx > 0 ? 'hidden sm:block' : ''}
      ${isSelected
        ? 'bg-white/20 text-white'
        : type === 'created'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-green-100 text-green-700'
      }`}
  >
    {task.title}
  </span>
))}
```

- [ ] **Step 2: overflow 및 경유 텍스트 확인**

overflow `+N` span과 경유 span은 변경 없음. 브라우저에서 업무가 있는 날짜에 pill이 표시되는지 확인.

- [ ] **Step 3: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "디자인: 캘린더 업무 태그 pill 스타일 적용"
```

---

### Task 3: 헤더 개선

**Files:**
- Modify: `src/components/CalendarView.tsx`

현재 헤더:
```tsx
<div className="flex items-center justify-between">
  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">←</button>
  <h2 className="text-lg font-semibold text-gray-800">
    {year}년 {month + 1}월
  </h2>
  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">→</button>
</div>
```

- [ ] **Step 1: 헤더 스타일 교체**

```tsx
<div className="flex items-center justify-between px-1">
  <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors">‹</button>
  <h2 className="text-xl font-bold text-gray-800 tracking-tight">
    {year}년 {month + 1}월
  </h2>
  <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors">›</button>
</div>
```

- [ ] **Step 2: 요일 헤더 스타일 확인**

현재 요일 헤더 div:
```tsx
<div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
```

이것은 변경 없이 유지.

- [ ] **Step 3: 전체 패딩 조정**

CalendarView의 최외곽 div:
```tsx
<div className="flex flex-col gap-4 p-4">
```
를 다음으로 변경:
```tsx
<div className="flex flex-col gap-3 p-4 sm:p-6">
```

- [ ] **Step 4: 브라우저에서 최종 확인**

- 헤더 버튼이 원형으로 hover되는지
- 연/월 텍스트가 굵고 크게 보이는지
- 데스크탑에서 셀이 충분히 크고 업무 pill이 잘 보이는지
- 모바일에서 깨지지 않는지

- [ ] **Step 5: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "디자인: 캘린더 헤더 개선 및 전체 여백 조정"
```
