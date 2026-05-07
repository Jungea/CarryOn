# 캘린더 이벤트 (커스텀 공휴일 & 연차) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 커스텀 공휴일과 연차(5종)를 등록하고 캘린더 셀과 상세 패널에서 확인할 수 있게 한다.

**Architecture:** 기존 tasks/columns와 동일한 패턴(dataStore → API route → client store)으로 `CalendarEvent` 엔티티를 추가한다. `CalendarPage`에서 이벤트를 fetch해 `CalendarView`(셀 표시)와 `DaySidePanel`(빠른 추가/삭제), `CalendarSettings`(전체 관리 모달)에 prop으로 전달한다.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, JSON 파일 저장소

---

### Task 1: 타입 및 서버 저장소 추가

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/dataStore.ts`

- [ ] **Step 1: `CalendarEvent` 타입을 `types.ts`에 추가**

```ts
// src/lib/types.ts 기존 내용 아래에 추가
export type LeaveType = '연차' | '오전반차' | '오후반차' | '오전반반차' | '오후반반차'
export type EventType = 'holiday' | LeaveType

export interface CalendarEvent {
  id: string
  date: string        // 'YYYY-MM-DD'
  type: EventType
  name?: string       // holiday 타입만 필수, 나머지는 type 이름 그대로 표시
  createdAt: string
}
```

- [ ] **Step 2: `dataStore.ts`에 `readEvents`/`writeEvents` 추가**

`dataStore.ts` 상단 import 아래에 경로 추가:
```ts
import type { Task, Column, CalendarEvent } from './types'

const EVENTS_FILE = join(DATA_DIR, 'calendar-events.json')
```

파일 끝에 함수 추가:
```ts
export async function readEvents(): Promise<CalendarEvent[]> {
  try {
    const content = await readFile(EVENTS_FILE, 'utf-8')
    return JSON.parse(content) as CalendarEvent[]
  } catch {
    return []
  }
}

export async function writeEvents(events: CalendarEvent[]): Promise<void> {
  await ensureDir()
  await writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/dataStore.ts
git commit -m "기능: CalendarEvent 타입 및 파일 저장소 추가"
```

---

### Task 2: API 라우트 추가

**Files:**
- Create: `src/app/api/calendar-events/route.ts`
- Create: `src/app/api/calendar-events/[id]/route.ts`

- [ ] **Step 1: `GET /api/calendar-events`, `POST /api/calendar-events` 작성**

```ts
// src/app/api/calendar-events/route.ts
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readEvents, writeEvents } from '@/lib/dataStore'
import type { CalendarEvent } from '@/lib/types'

export async function GET() {
  const events = await readEvents()
  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const body = await request.json()
  const events = await readEvents()

  const newEvent: CalendarEvent = {
    id: randomUUID(),
    date: String(body.date),
    type: body.type,
    name: body.name ?? undefined,
    createdAt: new Date().toISOString(),
  }

  events.push(newEvent)
  await writeEvents(events)
  return NextResponse.json(newEvent, { status: 201 })
}
```

- [ ] **Step 2: `DELETE /api/calendar-events/[id]` 작성**

```ts
// src/app/api/calendar-events/[id]/route.ts
import { NextResponse } from 'next/server'
import { readEvents, writeEvents } from '@/lib/dataStore'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const events = await readEvents()
  await writeEvents(events.filter((e) => e.id !== id))
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: 동작 확인**

```bash
curl -X POST http://localhost:3000/api/calendar-events \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-01","type":"holiday","name":"근로자의 날"}'
# 201 응답 + JSON 반환 확인

curl http://localhost:3000/api/calendar-events
# 위 항목 포함된 배열 반환 확인
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/calendar-events/
git commit -m "기능: 캘린더 이벤트 API 라우트 추가 (GET/POST/DELETE)"
```

---

### Task 3: 클라이언트 스토어 추가

**Files:**
- Create: `src/lib/eventStore.ts`

- [ ] **Step 1: `eventStore.ts` 작성**

```ts
// src/lib/eventStore.ts
// 클라이언트에서 /api/calendar-events를 호출하는 함수 모음
import type { CalendarEvent, EventType } from './types'

export async function getEvents(): Promise<CalendarEvent[]> {
  const res = await fetch('/api/calendar-events')
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function createEvent(
  data: { date: string; type: EventType; name?: string }
): Promise<CalendarEvent> {
  const res = await fetch('/api/calendar-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`/api/calendar-events/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete event')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/eventStore.ts
git commit -m "기능: 캘린더 이벤트 클라이언트 스토어 추가"
```

---

### Task 4: CalendarPage — 이벤트 fetch 및 state 관리

**Files:**
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: `page.tsx` 전체 교체**

```tsx
// src/app/calendar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import CalendarView from '@/components/CalendarView'
import DaySidePanel from '@/components/DaySidePanel'
import CalendarSettings from '@/components/CalendarSettings'
import { getTasks, getColumns } from '@/lib/taskStore'
import { getEvents, createEvent, deleteEvent } from '@/lib/eventStore'
import type { Column, Task, CalendarEvent, EventType } from '@/lib/types'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    Promise.all([getTasks(), getColumns(), getEvents()]).then(([t, c, e]) => {
      setTasks(t)
      setColumns(c)
      setEvents(e)
    })
  }, [])

  async function handleAddEvent(data: { date: string; type: EventType; name?: string }) {
    const newEvent = await createEvent(data)
    setEvents((prev) => [...prev, newEvent])
  }

  async function handleDeleteEvent(id: string) {
    await deleteEvent(id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="w-full p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800 md:hidden">캘린더</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <CalendarView
          tasks={tasks}
          events={events}
          onDayClick={setSelectedDate}
          selectedDate={selectedDate}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>
      <DaySidePanel
        dateStr={selectedDate}
        tasks={tasks}
        columns={columns}
        events={events}
        onClose={() => setSelectedDate(null)}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
      />
      <CalendarSettings
        open={settingsOpen}
        events={events}
        onClose={() => setSettingsOpen(false)}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "기능: CalendarPage 이벤트 state 및 핸들러 추가"
```

---

### Task 5: CalendarView — 이벤트 셀 표시

**Files:**
- Modify: `src/components/CalendarView.tsx`

- [ ] **Step 1: props 타입 및 import 수정**

파일 상단 import 수정:
```tsx
import { getCalendarDays, getTasksForDate, toDateString } from '@/lib/calendarUtils'
import { getHolidayName } from '@/lib/holidays'
import type { Task, CalendarEvent } from '@/lib/types'
```

`CalendarViewProps` 수정:
```tsx
interface CalendarViewProps {
  tasks: Task[]
  events: CalendarEvent[]
  onDayClick: (dateStr: string) => void
  selectedDate: string | null
  onSettingsClick: () => void
}
```

함수 시그니처 수정:
```tsx
export default function CalendarView({ tasks, events, onDayClick, selectedDate, onSettingsClick }: CalendarViewProps) {
```

- [ ] **Step 2: 헤더에 설정 버튼 추가**

현재 헤더 div:
```tsx
<div className="flex items-center justify-between px-1">
  <button onClick={prevMonth} ...>‹</button>
  <h2 ...>{year}년 {month + 1}월</h2>
  <button onClick={nextMonth} ...>›</button>
</div>
```

를 다음으로 교체:
```tsx
<div className="flex items-center justify-between px-1">
  <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors">‹</button>
  <h2 className="text-xl font-bold text-gray-800 tracking-tight">
    {year}년 {month + 1}월
  </h2>
  <div className="flex items-center gap-1">
    <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors">›</button>
    <button onClick={onSettingsClick} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors text-base" title="설정">⚙</button>
  </div>
</div>
```

- [ ] **Step 3: 날짜 셀 내 이벤트 계산 추가**

`const holiday = getHolidayName(dateStr)` 아래에 추가:
```tsx
const dayEvents = events.filter((e) => e.date === dateStr)
const customHoliday = dayEvents.find((e) => e.type === 'holiday')
const leaveEvents = dayEvents.filter((e) => e.type !== 'holiday')
const effectiveHoliday = holiday ?? customHoliday?.name ?? null
const isHolidayDay = !!effectiveHoliday
```

- [ ] **Step 4: 날짜 숫자 색상 조건 수정**

```tsx
${isSelected ? 'text-white' : isSunday || isHolidayDay ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}
```

- [ ] **Step 5: 공휴일 표시 블록 수정**

```tsx
{effectiveHoliday && (
  <>
    <span className={`hidden sm:block w-full truncate text-[10px] px-0.5 leading-tight font-medium
      ${isSelected ? 'text-red-200' : 'text-red-500'}`}>
      {effectiveHoliday}
    </span>
    <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />
  </>
)}
```

- [ ] **Step 6: 연차 표시 추가** (공휴일 블록 바로 아래)

```tsx
{leaveEvents.length > 0 && (
  <>
    {/* 데스크탑: 첫 번째 연차 pill */}
    <span className={`hidden sm:block w-full truncate text-[10px] px-1.5 py-0.5 rounded-full leading-tight font-medium
      ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
      {leaveEvents[0].type}{leaveEvents.length > 1 ? ` 외 ${leaveEvents.length - 1}` : ''}
    </span>
    {/* 모바일: 주황 점 */}
    <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-orange-300' : 'bg-orange-400'}`} />
  </>
)}
```

- [ ] **Step 7: TypeScript 확인 후 Commit**

```bash
npx tsc --noEmit
git add src/components/CalendarView.tsx
git commit -m "기능: CalendarView 이벤트 표시 및 설정 버튼 추가"
```

---

### Task 6: DaySidePanel — 이벤트 표시 및 빠른 추가/삭제

**Files:**
- Modify: `src/components/DaySidePanel.tsx`

- [ ] **Step 1: props 타입 및 import 수정**

```tsx
import { getTasksForDate } from '@/lib/calendarUtils'
import { getHolidayName } from '@/lib/holidays'
import type { Column, Task, CalendarEvent, EventType } from '@/lib/types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const LEAVE_TYPES: EventType[] = ['연차', '오전반차', '오후반차', '오전반반차', '오후반반차']

interface DaySidePanelProps {
  dateStr: string | null
  tasks: Task[]
  columns: Column[]
  events: CalendarEvent[]
  onClose: () => void
  onAddEvent: (data: { date: string; type: EventType; name?: string }) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
}
```

- [ ] **Step 2: 컴포넌트 내부 이벤트 관련 변수 추가**

`const holiday = getHolidayName(dateStr)` 아래에:
```tsx
const dayEvents = events.filter((e) => e.date === dateStr)
const customHolidays = dayEvents.filter((e) => e.type === 'holiday')
const leaveEvents = dayEvents.filter((e) => e.type !== 'holiday')
```

- [ ] **Step 3: 공휴일 섹션 추가** (기존 생성된 업무 섹션 위에)

```tsx
{(holiday || customHolidays.length > 0) && (
  <section>
    <h3 className="text-xs font-semibold text-red-400 uppercase mb-2">공휴일</h3>
    {holiday && (
      <div className="py-2 border-b border-gray-100 last:border-0">
        <p className="text-sm text-gray-800">{holiday}</p>
        <p className="text-xs text-gray-400 mt-0.5">법정 공휴일</p>
      </div>
    )}
    {customHolidays.map((e) => (
      <div key={e.id} className="py-2 border-b border-gray-100 last:border-0 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-800">{e.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">커스텀 공휴일</p>
        </div>
        <button onClick={() => onDeleteEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
      </div>
    ))}
  </section>
)}
```

- [ ] **Step 4: 연차 섹션 추가** (공휴일 섹션 아래)

```tsx
{leaveEvents.length > 0 && (
  <section>
    <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">휴가</h3>
    {leaveEvents.map((e) => (
      <div key={e.id} className="py-2 border-b border-gray-100 last:border-0 flex items-center justify-between">
        <p className="text-sm text-gray-800">{e.type}</p>
        <button onClick={() => onDeleteEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
      </div>
    ))}
  </section>
)}
```

- [ ] **Step 5: 빠른 추가 섹션 추가** (flex-1 div 끝, total === 0 블록 아래)

```tsx
<section className="mt-auto pt-4 border-t border-gray-100">
  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">이 날에 추가</h3>
  <QuickAddEvent dateStr={dateStr} onAdd={onAddEvent} />
</section>
```

- [ ] **Step 6: `QuickAddEvent` 내부 컴포넌트 작성** (파일 상단 `TaskRow` 아래)

```tsx
function QuickAddEvent({
  dateStr,
  onAdd,
}: {
  dateStr: string
  onAdd: (data: { date: string; type: EventType; name?: string }) => Promise<void>
}) {
  const [mode, setMode] = useState<'holiday' | 'leave' | null>(null)
  const [name, setName] = useState('')
  const [leaveType, setLeaveType] = useState<EventType>('연차')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (mode === 'holiday' && !name.trim()) return
    setSaving(true)
    await onAdd({
      date: dateStr,
      type: mode === 'holiday' ? 'holiday' : leaveType,
      name: mode === 'holiday' ? name.trim() : undefined,
    })
    setName('')
    setMode(null)
    setSaving(false)
  }

  if (!mode) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode('holiday')} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
          + 공휴일
        </button>
        <button onClick={() => setMode('leave')} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors">
          + 연차
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {mode === 'holiday' ? (
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          placeholder="공휴일 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      ) : (
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={leaveType as string}
          onChange={(e) => setLeaveType(e.target.value as EventType)}
        >
          {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={saving} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
          추가
        </button>
        <button onClick={() => setMode(null)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
          취소
        </button>
      </div>
    </div>
  )
}
```

`QuickAddEvent`는 `useState`를 사용하므로 파일 상단 import에 `useState` 추가 확인:
```tsx
import { useState } from 'react'
```

- [ ] **Step 7: TypeScript 확인 후 Commit**

```bash
npx tsc --noEmit
git add src/components/DaySidePanel.tsx
git commit -m "기능: DaySidePanel 공휴일/연차 표시 및 빠른 추가 추가"
```

---

### Task 7: CalendarSettings 모달

**Files:**
- Create: `src/components/CalendarSettings.tsx`

- [ ] **Step 1: `CalendarSettings.tsx` 작성**

```tsx
// src/components/CalendarSettings.tsx
'use client'

import { useState } from 'react'
import type { CalendarEvent, EventType } from '@/lib/types'

const LEAVE_TYPES: EventType[] = ['연차', '오전반차', '오후반차', '오전반반차', '오후반반차']

interface CalendarSettingsProps {
  open: boolean
  events: CalendarEvent[]
  onClose: () => void
  onAddEvent: (data: { date: string; type: EventType; name?: string }) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
}

export default function CalendarSettings({ open, events, onClose, onAddEvent, onDeleteEvent }: CalendarSettingsProps) {
  const [tab, setTab] = useState<'holiday' | 'leave'>('holiday')
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [leaveType, setLeaveType] = useState<EventType>('연차')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const holidays = events.filter((e) => e.type === 'holiday').sort((a, b) => a.date.localeCompare(b.date))
  const leaves = events.filter((e) => e.type !== 'holiday').sort((a, b) => a.date.localeCompare(b.date))

  async function handleAdd() {
    if (!date) return
    if (tab === 'holiday' && !name.trim()) return
    setSaving(true)
    await onAddEvent({
      date,
      type: tab === 'holiday' ? 'holiday' : leaveType,
      name: tab === 'holiday' ? name.trim() : undefined,
    })
    setDate('')
    setName('')
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">캘린더 설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('holiday')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'holiday' ? 'text-red-500 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            공휴일
          </button>
          <button
            onClick={() => setTab('leave')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'leave' ? 'text-orange-500 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            연차
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1">
          {(tab === 'holiday' ? holidays : leaves).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className="text-sm text-gray-800">{e.date}</span>
                <span className="ml-2 text-sm text-gray-500">{tab === 'holiday' ? e.name : e.type}</span>
              </div>
              <button onClick={() => onDeleteEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xs px-1 transition-colors">✕</button>
            </div>
          ))}
          {(tab === 'holiday' ? holidays : leaves).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">등록된 항목이 없습니다</p>
          )}
        </div>

        {/* Add Form */}
        <div className="px-5 py-4 border-t border-gray-200 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {tab === 'holiday' ? (
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="공휴일 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={leaveType as string}
                onChange={(e) => setLeaveType(e.target.value as EventType)}
              >
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript 확인 후 Commit**

```bash
npx tsc --noEmit
git add src/components/CalendarSettings.tsx
git commit -m "기능: CalendarSettings 모달 추가 (공휴일/연차 관리)"
```
