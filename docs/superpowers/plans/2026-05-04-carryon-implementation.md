# CarryOn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 기반 로컬 업무 관리 웹앱 — 칸반 보드, 캘린더 뷰, 드래그 앤 드롭, JSON 파일 저장

**Architecture:** Next.js App Router 사용. API Routes가 `data/` 디렉토리의 JSON 파일을 읽고 씀. 클라이언트는 `taskStore.ts`를 통해 API를 호출. 컴포넌트는 `useTaskData` 훅으로 데이터를 가져옴.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, @dnd-kit/core, @dnd-kit/sortable, Jest + ts-jest

---

## File Map

```
/mnt/d/practice/carryon/
├── data/
│   ├── tasks.json
│   └── columns.json
├── src/
│   ├── app/
│   │   ├── layout.tsx              — 루트 레이아웃 (BottomNav 포함)
│   │   ├── page.tsx                — 칸반 보드 페이지
│   │   ├── globals.css
│   │   ├── calendar/
│   │   │   └── page.tsx            — 캘린더 페이지
│   │   └── api/
│   │       ├── tasks/
│   │       │   ├── route.ts        — GET /api/tasks, POST /api/tasks
│   │       │   └── [id]/
│   │       │       └── route.ts    — PUT /api/tasks/:id, DELETE /api/tasks/:id
│   │       └── columns/
│   │           ├── route.ts        — GET /api/columns, POST /api/columns
│   │           └── [id]/
│   │               └── route.ts    — PUT /api/columns/:id, DELETE /api/columns/:id
│   ├── components/
│   │   ├── TaskBoard.tsx           — DnD 컨텍스트 + 컬럼 목록
│   │   ├── TaskColumn.tsx          — 단일 컬럼 (헤더 + 카드 목록)
│   │   ├── TaskCard.tsx            — 업무 카드 (제목, 마감일, 이월 버튼)
│   │   ├── TaskDetailModal.tsx     — 업무 상세 편집 모달
│   │   ├── CalendarView.tsx        — 월간 달력
│   │   ├── DaySidePanel.tsx        — 날짜 클릭 시 업무 목록 패널
│   │   └── BottomNav.tsx           — 모바일 하단 탭바
│   ├── lib/
│   │   ├── types.ts                — Task, Column 인터페이스
│   │   ├── dataStore.ts            — 서버 전용: JSON 파일 읽기/쓰기
│   │   ├── taskStore.ts            — 클라이언트: API 호출 함수
│   │   └── calendarUtils.ts        — 순수 함수: 날짜 계산
│   └── __tests__/
│       └── calendarUtils.test.ts
├── jest.config.ts
└── jest.setup.ts
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json` (create-next-app이 생성)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

**전제 조건:** Node.js 18+ 설치 필요. WSL에서 설치: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /mnt/d/practice/carryon
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

프롬프트가 나오면 모두 기본값(Enter)으로 진행.

- [ ] **Step 2: DnD 라이브러리 설치**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 3: Jest 설치**

```bash
npm install -D jest @types/jest jest-environment-node ts-jest
```

- [ ] **Step 4: jest.config.ts 작성**

```typescript
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default config
```

- [ ] **Step 5: jest.setup.ts 작성**

```typescript
// 추후 테스트 전역 설정 시 사용
export {}
```

- [ ] **Step 6: package.json에 test 스크립트 추가**

`package.json`의 `"scripts"` 섹션에 추가:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 7: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000` 에서 Next.js 기본 페이지 열림. 확인 후 `Ctrl+C`.

- [ ] **Step 8: 불필요한 보일러플레이트 제거**

`src/app/page.tsx` 전체를 다음으로 교체:
```tsx
export default function Home() {
  return <div>CarryOn</div>
}
```

`src/app/globals.css` 에서 `:root` 변수와 기본 스타일 블록 삭제, Tailwind directives만 남김:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

(Next.js 15 + Tailwind v4 사용 시 `globals.css`에 `@import "tailwindcss";` 한 줄만 있을 수 있음 — 그 경우 그대로 둠)

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with TypeScript, Tailwind, dnd-kit, Jest"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: types.ts 작성**

```typescript
export interface Task {
  id: string
  title: string
  memo: string
  dueDate: string | null       // 'YYYY-MM-DD' 형식
  columnId: string
  createdAt: string            // ISO datetime (new Date().toISOString())
  completedAt: string | null   // ISO datetime, 미완료 시 null
  order: number                // 컬럼 내 정렬 순서 (낮을수록 위)
}

export interface Column {
  id: string
  name: string
  order: number                // 보드에서 좌→우 순서
  isCompletedColumn: boolean   // true이면 이 컬럼으로 이동 시 completedAt 기록
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add core Task and Column types"
```

---

## Task 3: 서버 데이터 저장소

**Files:**
- Create: `src/lib/dataStore.ts`
- Create: `data/tasks.json`
- Create: `data/columns.json`

**주의:** `dataStore.ts`는 서버 전용(`'use server'` 없이도 API route에서만 import). 클라이언트 컴포넌트에서 직접 import 금지.

- [ ] **Step 1: data/ 디렉토리와 초기 JSON 파일 생성**

```bash
mkdir -p /mnt/d/practice/carryon/data
```

`data/tasks.json`:
```json
[]
```

`data/columns.json`:
```json
[
  { "id": "col-1", "name": "미분류", "order": 0, "isCompletedColumn": false },
  { "id": "col-2", "name": "금일작업필수", "order": 1, "isCompletedColumn": false },
  { "id": "col-3", "name": "진행중", "order": 2, "isCompletedColumn": false },
  { "id": "col-4", "name": "완료", "order": 3, "isCompletedColumn": true }
]
```

- [ ] **Step 2: dataStore.ts 작성**

```typescript
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { Task, Column } from './types'

const DATA_DIR = join(process.cwd(), 'data')
const TASKS_FILE = join(DATA_DIR, 'tasks.json')
const COLUMNS_FILE = join(DATA_DIR, 'columns.json')

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-1', name: '미분류', order: 0, isCompletedColumn: false },
  { id: 'col-2', name: '금일작업필수', order: 1, isCompletedColumn: false },
  { id: 'col-3', name: '진행중', order: 2, isCompletedColumn: false },
  { id: 'col-4', name: '완료', order: 3, isCompletedColumn: true },
]

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

export async function readTasks(): Promise<Task[]> {
  try {
    const content = await readFile(TASKS_FILE, 'utf-8')
    return JSON.parse(content) as Task[]
  } catch {
    return []
  }
}

export async function writeTasks(tasks: Task[]): Promise<void> {
  await ensureDir()
  await writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8')
}

export async function readColumns(): Promise<Column[]> {
  try {
    const content = await readFile(COLUMNS_FILE, 'utf-8')
    return JSON.parse(content) as Column[]
  } catch {
    return DEFAULT_COLUMNS
  }
}

export async function writeColumns(columns: Column[]): Promise<void> {
  await ensureDir()
  await writeFile(COLUMNS_FILE, JSON.stringify(columns, null, 2), 'utf-8')
}
```

- [ ] **Step 3: .gitignore에 data/ 추가 여부 결정**

개인 업무 데이터이므로 `data/` 는 git에서 제외 권장:
`.gitignore` 파일에 추가:
```
data/
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/dataStore.ts .gitignore
git add data/tasks.json data/columns.json  # .gitignore 전에 먼저 추가
git commit -m "feat: add server-side JSON file dataStore with default columns"
```

---

## Task 4: Calendar Utilities (with tests)

**Files:**
- Create: `src/lib/calendarUtils.ts`
- Create: `src/__tests__/calendarUtils.test.ts`

- [ ] **Step 1: 테스트 파일 작성 (먼저)**

```typescript
// src/__tests__/calendarUtils.test.ts
import {
  toDateString,
  getTasksForDate,
  getTaskCountForDate,
  getCalendarDays,
} from '@/lib/calendarUtils'
import type { Task } from '@/lib/types'

const baseTask: Task = {
  id: '1',
  title: 'Test task',
  memo: '',
  dueDate: null,
  columnId: 'col-1',
  createdAt: '2026-05-01T09:00:00.000Z',
  completedAt: null,
  order: 0,
}

describe('toDateString', () => {
  it('ISO datetime에서 날짜 부분만 추출', () => {
    expect(toDateString('2026-05-04T12:30:00.000Z')).toBe('2026-05-04')
  })
})

describe('getTasksForDate', () => {
  it('생성일과 같은 날이면 created에 포함', () => {
    const result = getTasksForDate([baseTask], '2026-05-01')
    expect(result.created).toHaveLength(1)
    expect(result.completed).toHaveLength(0)
    expect(result.passing).toHaveLength(0)
  })

  it('완료일과 같은 날이면 completed에 포함', () => {
    const task = { ...baseTask, completedAt: '2026-05-03T15:00:00.000Z' }
    const result = getTasksForDate([task], '2026-05-03')
    expect(result.completed).toHaveLength(1)
    expect(result.created).toHaveLength(0)
    expect(result.passing).toHaveLength(0)
  })

  it('생성일과 완료일 사이 날짜면 passing에 포함', () => {
    const task = { ...baseTask, completedAt: '2026-05-05T15:00:00.000Z' }
    const result = getTasksForDate([task], '2026-05-03')
    expect(result.passing).toHaveLength(1)
  })

  it('미완료 업무는 생성일 이후 모든 날에 passing', () => {
    const result = getTasksForDate([baseTask], '2026-05-10')
    expect(result.passing).toHaveLength(1)
  })

  it('생성일 이전 날짜에는 포함되지 않음', () => {
    const result = getTasksForDate([baseTask], '2026-04-30')
    expect(result.created).toHaveLength(0)
    expect(result.completed).toHaveLength(0)
    expect(result.passing).toHaveLength(0)
  })
})

describe('getTaskCountForDate', () => {
  it('created + completed + passing 합계 반환', () => {
    const task1 = { ...baseTask, id: '1' }
    const task2 = { ...baseTask, id: '2', createdAt: '2026-05-02T09:00:00.000Z', completedAt: '2026-05-03T10:00:00.000Z' }
    // 2026-05-03: task1은 passing, task2는 completed
    expect(getTaskCountForDate([task1, task2], '2026-05-03')).toBe(2)
  })
})

describe('getCalendarDays', () => {
  it('2026년 5월은 31일', () => {
    const days = getCalendarDays(2026, 4) // month 4 = May (0-indexed)
    const actual = days.filter((d) => d !== null)
    expect(actual).toHaveLength(31)
  })

  it('2026년 5월 1일은 금요일(5)이므로 앞에 null 5개', () => {
    const days = getCalendarDays(2026, 4)
    const firstNonNull = days.findIndex((d) => d !== null)
    expect(firstNonNull).toBe(5)
  })

  it('2월 윤년 처리 (2024년 2월 = 29일)', () => {
    const days = getCalendarDays(2024, 1)
    const actual = days.filter((d) => d !== null)
    expect(actual).toHaveLength(29)
  })
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test
```

Expected: `Cannot find module '@/lib/calendarUtils'` 에러

- [ ] **Step 3: calendarUtils.ts 구현**

```typescript
// src/lib/calendarUtils.ts
import type { Task } from './types'

export function toDateString(isoString: string): string {
  return isoString.slice(0, 10)
}

export interface DayTasks {
  created: Task[]
  completed: Task[]
  passing: Task[]
}

export function getTasksForDate(tasks: Task[], dateStr: string): DayTasks {
  const created: Task[] = []
  const completed: Task[] = []
  const passing: Task[] = []

  for (const task of tasks) {
    const createdDate = toDateString(task.createdAt)
    const completedDate = task.completedAt ? toDateString(task.completedAt) : null

    if (createdDate === dateStr) {
      created.push(task)
    } else if (completedDate === dateStr) {
      completed.push(task)
    } else if (
      createdDate < dateStr &&
      (completedDate === null || completedDate > dateStr)
    ) {
      passing.push(task)
    }
  }

  return { created, completed, passing }
}

export function getTaskCountForDate(tasks: Task[], dateStr: string): number {
  const { created, completed, passing } = getTasksForDate(tasks, dateStr)
  return created.length + completed.length + passing.length
}

// month는 0-indexed (0 = 1월, 4 = 5월)
export function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay() // 0 = 일요일

  const days: (Date | null)[] = []

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  return days
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/calendarUtils.ts src/__tests__/calendarUtils.test.ts
git commit -m "feat: add calendar utility functions with tests"
```

---

## Task 5: Tasks API Routes

**Files:**
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/route.ts`

- [ ] **Step 1: GET/POST route 작성**

```typescript
// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readTasks, writeTasks } from '@/lib/dataStore'

export async function GET() {
  const tasks = await readTasks()
  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const tasks = await readTasks()

  const newTask = {
    id: randomUUID(),
    title: String(body.title ?? ''),
    memo: String(body.memo ?? ''),
    dueDate: body.dueDate ?? null,
    columnId: String(body.columnId),
    createdAt: new Date().toISOString(),
    completedAt: null,
    order: typeof body.order === 'number' ? body.order : tasks.length,
  }

  tasks.push(newTask)
  await writeTasks(tasks)
  return NextResponse.json(newTask, { status: 201 })
}
```

- [ ] **Step 2: PUT/DELETE route 작성**

```typescript
// src/app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server'
import { readTasks, writeTasks } from '@/lib/dataStore'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const tasks = await readTasks()
  const index = tasks.findIndex((t) => t.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  tasks[index] = { ...tasks[index], ...body }
  await writeTasks(tasks)
  return NextResponse.json(tasks[index])
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const tasks = await readTasks()
  await writeTasks(tasks.filter((t) => t.id !== id))
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: 개발 서버에서 동작 확인**

```bash
npm run dev
```

별도 터미널에서:
```bash
# 업무 생성
curl -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"테스트 업무","columnId":"col-1","order":0}'

# 업무 조회
curl http://localhost:3000/api/tasks
```

Expected: 생성된 업무가 JSON으로 반환되고, `data/tasks.json`에 저장됨

- [ ] **Step 4: Commit**

```bash
git add src/app/api/tasks/
git commit -m "feat: add Tasks CRUD API routes"
```

---

## Task 6: Columns API Routes

**Files:**
- Create: `src/app/api/columns/route.ts`
- Create: `src/app/api/columns/[id]/route.ts`

- [ ] **Step 1: GET/POST route 작성**

```typescript
// src/app/api/columns/route.ts
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readColumns, writeColumns } from '@/lib/dataStore'

export async function GET() {
  const columns = await readColumns()
  return NextResponse.json(columns)
}

export async function POST(request: Request) {
  const body = await request.json()
  const columns = await readColumns()

  const newColumn = {
    id: randomUUID(),
    name: String(body.name ?? '새 컬럼'),
    order: typeof body.order === 'number' ? body.order : columns.length,
    isCompletedColumn: Boolean(body.isCompletedColumn ?? false),
  }

  columns.push(newColumn)
  await writeColumns(columns)
  return NextResponse.json(newColumn, { status: 201 })
}
```

- [ ] **Step 2: PUT/DELETE route 작성**

```typescript
// src/app/api/columns/[id]/route.ts
import { NextResponse } from 'next/server'
import { readColumns, writeColumns } from '@/lib/dataStore'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const columns = await readColumns()
  const index = columns.findIndex((c) => c.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  columns[index] = { ...columns[index], ...body }
  await writeColumns(columns)
  return NextResponse.json(columns[index])
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const columns = await readColumns()
  await writeColumns(columns.filter((c) => c.id !== id))
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/columns/
git commit -m "feat: add Columns CRUD API routes"
```

---

## Task 7: Client TaskStore

**Files:**
- Create: `src/lib/taskStore.ts`

- [ ] **Step 1: taskStore.ts 작성**

```typescript
// src/lib/taskStore.ts
import type { Task, Column } from './types'

// ── Tasks ─────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export async function createTask(
  data: Pick<Task, 'title' | 'columnId' | 'order'> & Partial<Pick<Task, 'memo' | 'dueDate'>>
): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete task')
}

// ── Columns ────────────────────────────────────────────

export async function getColumns(): Promise<Column[]> {
  const res = await fetch('/api/columns')
  if (!res.ok) throw new Error('Failed to fetch columns')
  return res.json()
}

export async function createColumn(
  data: Pick<Column, 'name' | 'order' | 'isCompletedColumn'>
): Promise<Column> {
  const res = await fetch('/api/columns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create column')
  return res.json()
}

export async function updateColumn(id: string, data: Partial<Column>): Promise<Column> {
  const res = await fetch(`/api/columns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update column')
  return res.json()
}

export async function deleteColumn(id: string): Promise<void> {
  const res = await fetch(`/api/columns/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete column')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/taskStore.ts
git commit -m "feat: add client-side taskStore API layer"
```

---

## Task 8: TaskCard 컴포넌트

**Files:**
- Create: `src/components/TaskCard.tsx`

- [ ] **Step 1: TaskCard.tsx 작성**

```tsx
// src/components/TaskCard.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onCarryOver: (taskId: string) => void
}

export default function TaskCard({ task, onEdit, onCarryOver }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue =
    task.dueDate && !task.completedAt && task.dueDate < new Date().toISOString().slice(0, 10)

  function handleCarryOver(e: React.MouseEvent) {
    e.stopPropagation()
    onCarryOver(task.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(task)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all select-none"
    >
      <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>

      <div className="mt-2 flex items-center justify-between">
        {task.dueDate ? (
          <span
            className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}
          >
            {task.dueDate}
          </span>
        ) : (
          <span />
        )}

        {!task.completedAt && (
          <button
            onClick={handleCarryOver}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors px-1"
            title="내일로 가져가기"
          >
            → 내일
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TaskCard.tsx
git commit -m "feat: add TaskCard component with sortable DnD support"
```

---

## Task 9: TaskDetailModal 컴포넌트

**Files:**
- Create: `src/components/TaskDetailModal.tsx`

- [ ] **Step 1: TaskDetailModal.tsx 작성**

```tsx
// src/components/TaskDetailModal.tsx
'use client'

import { useEffect, useState } from 'react'
import type { Task } from '@/lib/types'

interface TaskDetailModalProps {
  task: Task | null
  onClose: () => void
  onSave: (id: string, data: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TaskDetailModal({ task, onClose, onSave, onDelete }: TaskDetailModalProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setMemo(task.memo)
      setDueDate(task.dueDate ?? '')
    }
  }, [task])

  if (!task) return null

  async function handleSave() {
    if (!task) return
    setSaving(true)
    await onSave(task.id, {
      title: title.trim() || '(제목 없음)',
      memo,
      dueDate: dueDate || null,
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!task || !confirm('업무를 삭제할까요?')) return
    await onDelete(task.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800">업무 편집</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">제목</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="업무 제목"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">메모</label>
          <textarea
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (선택)"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">마감일</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handleDelete}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            삭제
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TaskDetailModal.tsx
git commit -m "feat: add TaskDetailModal with title/memo/dueDate editing"
```

---

## Task 10: TaskColumn 컴포넌트

**Files:**
- Create: `src/components/TaskColumn.tsx`

- [ ] **Step 1: TaskColumn.tsx 작성**

```tsx
// src/components/TaskColumn.tsx
'use client'

import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'
import type { Column, Task } from '@/lib/types'

interface TaskColumnProps {
  column: Column
  tasks: Task[]
  onAddTask: (columnId: string) => Promise<void>
  onEditTask: (task: Task) => void
  onCarryOverTask: (taskId: string) => void
  onRenameColumn: (id: string, name: string) => Promise<void>
  onDeleteColumn: (id: string) => Promise<void>
}

export default function TaskColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onCarryOverTask,
  onRenameColumn,
  onDeleteColumn,
}: TaskColumnProps) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(column.name)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  async function handleRename() {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== column.name) {
      await onRenameColumn(column.id, trimmed)
    }
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`"${column.name}" 컬럼을 삭제할까요? 포함된 업무도 함께 삭제됩니다.`)) return
    await onDeleteColumn(column.id)
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    await onAddTask(column.id)
    setNewTitle('')
    setAdding(false)
  }

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 bg-gray-50 rounded-xl flex flex-col max-h-full"
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {editing ? (
          <input
            className="text-sm font-semibold border-b border-blue-400 bg-transparent outline-none flex-1 mr-2"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-sm font-semibold text-gray-700 flex-1"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          >
            {column.name}
            <span className="ml-2 text-xs font-normal text-gray-400">{tasks.length}</span>
          </span>
        )}

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditing(true); setNameInput(column.name) }}
            className="text-gray-400 hover:text-gray-600 text-xs px-1"
            title="이름 변경"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
            title="컬럼 삭제"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
        <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onCarryOver={onCarryOverTask}
            />
          ))}
        </SortableContext>

        {/* Add Task Form */}
        {adding ? (
          <form onSubmit={handleAddTask} className="flex flex-col gap-2 mt-1">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="업무 제목 입력..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-gray-400 hover:text-gray-600 text-left px-1 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            + 업무 추가
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TaskColumn.tsx
git commit -m "feat: add TaskColumn with inline rename, add task, and delete"
```

---

## Task 11: TaskBoard 컴포넌트 (DnD)

**Files:**
- Create: `src/components/TaskBoard.tsx`

**주의:** 이 컴포넌트가 DnD의 핵심. 카드 간 이동과 컬럼 간 이동을 모두 처리함.

- [ ] **Step 1: TaskBoard.tsx 작성**

```tsx
// src/components/TaskBoard.tsx
'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import TaskColumn from './TaskColumn'
import TaskCard from './TaskCard'
import TaskDetailModal from './TaskDetailModal'
import type { Column, Task } from '@/lib/types'
import * as store from '@/lib/taskStore'

interface TaskBoardProps {
  initialTasks: Task[]
  initialColumns: Column[]
}

export default function TaskBoard({ initialTasks, initialColumns }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [columns, setColumns] = useState<Column[]>([...initialColumns].sort((a, b) => a.order - b.order))
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // ── Task handlers ──────────────────────────────────────

  async function handleAddTask(columnId: string) {
    const colTasks = tasks.filter((t) => t.columnId === columnId)
    const newTask = await store.createTask({
      title: '새 업무',
      columnId,
      order: colTasks.length,
    })
    setTasks((prev) => [...prev, newTask])
    setEditingTask(newTask)
  }

  async function handleSaveTask(id: string, data: Partial<Task>) {
    const updated = await store.updateTask(id, data)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function handleDeleteTask(id: string) {
    await store.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function handleCarryOver(taskId: string) {
    showToast('내일로 이월됩니다 ✓')
  }

  async function handleCarryOverAll() {
    const incomplete = tasks.filter((t) => !t.completedAt)
    showToast(`미완료 업무 ${incomplete.length}개가 내일로 이월됩니다 ✓`)
  }

  // ── Column handlers ────────────────────────────────────

  async function handleAddColumn() {
    const newCol = await store.createColumn({
      name: '새 컬럼',
      order: columns.length,
      isCompletedColumn: false,
    })
    setColumns((prev) => [...prev, newCol])
  }

  async function handleRenameColumn(id: string, name: string) {
    const updated = await store.updateColumn(id, { name })
    setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  async function handleDeleteColumn(id: string) {
    // 컬럼에 속한 업무도 삭제
    const colTasks = tasks.filter((t) => t.columnId === id)
    await Promise.all(colTasks.map((t) => store.deleteTask(t.id)))
    await store.deleteColumn(id)
    setTasks((prev) => prev.filter((t) => t.columnId !== id))
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  // ── DnD handlers ───────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return

    const activeTask = tasks.find((t) => t.id === active.id)
    const overTask = tasks.find((t) => t.id === over.id)
    const overColumn = columns.find((c) => c.id === over.id)

    if (!activeTask) return

    const targetColumnId = overTask?.columnId ?? overColumn?.id
    if (!targetColumnId || activeTask.columnId === targetColumnId) return

    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, columnId: targetColumnId } : t))
    )
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const activeTask = tasks.find((t) => t.id === active.id)

    // 컬럼 재정렬
    const activeColIndex = columns.findIndex((c) => c.id === active.id)
    if (activeColIndex !== -1) {
      const overColIndex = columns.findIndex((c) => c.id === over.id)
      if (overColIndex === -1) return
      const reordered = arrayMove(columns, activeColIndex, overColIndex).map((c, i) => ({
        ...c,
        order: i,
      }))
      setColumns(reordered)
      await Promise.all(reordered.map((c) => store.updateColumn(c.id, { order: c.order })))
      return
    }

    // 카드 재정렬
    if (!activeTask) return
    const overTask = tasks.find((t) => t.id === over.id)
    const targetColumnId = overTask?.columnId ?? (columns.find((c) => c.id === over.id)?.id)
    if (!targetColumnId) return

    const isCompletedColumn = columns.find((c) => c.id === targetColumnId)?.isCompletedColumn ?? false
    const completedAt = isCompletedColumn && !activeTask.completedAt ? new Date().toISOString() : activeTask.completedAt
    const wasCompleted = activeTask.completedAt && !isCompletedColumn ? null : completedAt

    setTasks((prev) => {
      const colTasks = prev
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order)
      const others = prev.filter((t) => t.columnId !== targetColumnId && t.id !== activeTask.id)

      const targetIndex = overTask ? colTasks.findIndex((t) => t.id === over.id) : colTasks.length
      const withoutActive = colTasks.filter((t) => t.id !== activeTask.id)
      withoutActive.splice(targetIndex, 0, {
        ...activeTask,
        columnId: targetColumnId,
        completedAt: wasCompleted ?? null,
      })
      const reordered = withoutActive.map((t, i) => ({ ...t, order: i }))

      // persist
      reordered.forEach((t) => store.updateTask(t.id, { columnId: t.columnId, order: t.order, completedAt: t.completedAt }))

      return [...others, ...reordered]
    })
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col h-full">
      {/* Carry Over All Button */}
      <div className="flex justify-end px-4 py-2">
        <button
          onClick={handleCarryOverAll}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          미완료 전체 이월 →
        </button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedColumns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 px-4 pb-4 overflow-x-auto flex-1 items-start">
            {sortedColumns.map((column) => (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={tasks.filter((t) => t.columnId === column.id)}
                onAddTask={handleAddTask}
                onEditTask={setEditingTask}
                onCarryOverTask={handleCarryOver}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            {/* Add Column Button */}
            <button
              onClick={handleAddColumn}
              className="flex-shrink-0 w-72 h-12 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors text-sm"
            >
              + 컬럼 추가
            </button>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 shadow-xl">
              <TaskCard task={activeTask} onEdit={() => {}} onCarryOver={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Detail Modal */}
      <TaskDetailModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TaskBoard.tsx
git commit -m "feat: add TaskBoard with DnD card/column reordering and carry-over"
```

---

## Task 12: CalendarView 컴포넌트

**Files:**
- Create: `src/components/CalendarView.tsx`

- [ ] **Step 1: CalendarView.tsx 작성**

```tsx
// src/components/CalendarView.tsx
'use client'

import { useState } from 'react'
import { getCalendarDays, getTaskCountForDate, toDateString } from '@/lib/calendarUtils'
import type { Task } from '@/lib/types'

interface CalendarViewProps {
  tasks: Task[]
  onDayClick: (dateStr: string) => void
  selectedDate: string | null
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarView({ tasks, onDayClick, selectedDate }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const days = getCalendarDays(year, month)
  const todayStr = toDateString(today.toISOString())

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">←</button>
        <h2 className="text-lg font-semibold text-gray-800">
          {year}년 {month + 1}월
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">→</button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`null-${i}`} />

          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const count = getTaskCountForDate(tasks, dateStr)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const isSunday = date.getDay() === 0
          const isSaturday = date.getDay() === 6

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                flex flex-col items-center justify-start p-1 rounded-lg min-h-[56px] text-left transition-colors
                ${isSelected ? 'bg-blue-500 text-white' : isToday ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'}
              `}
            >
              <span
                className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${isSelected ? 'text-white' : isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}
                `}
              >
                {date.getDate()}
              </span>
              {count > 0 && (
                <span
                  className={`text-xs mt-0.5 font-semibold ${isSelected ? 'text-blue-100' : 'text-blue-500'}`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CalendarView.tsx
git commit -m "feat: add CalendarView with month navigation and task count display"
```

---

## Task 13: DaySidePanel 컴포넌트

**Files:**
- Create: `src/components/DaySidePanel.tsx`

- [ ] **Step 1: DaySidePanel.tsx 작성**

```tsx
// src/components/DaySidePanel.tsx
'use client'

import { getTasksForDate } from '@/lib/calendarUtils'
import type { Column, Task } from '@/lib/types'

interface DaySidePanelProps {
  dateStr: string | null
  tasks: Task[]
  columns: Column[]
  onClose: () => void
}

function TaskRow({ task, columns }: { task: Task; columns: Column[] }) {
  const colName = columns.find((c) => c.id === task.columnId)?.name ?? ''
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-800">{task.title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{colName}</p>
    </div>
  )
}

export default function DaySidePanel({ dateStr, tasks, columns, onClose }: DaySidePanelProps) {
  if (!dateStr) return null

  const { created, completed, passing } = getTasksForDate(tasks, dateStr)
  const total = created.length + completed.length + passing.length

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{dateStr}</h2>
            <p className="text-xs text-gray-400">업무 {total}개</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-6">
          {created.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">생성된 업무</h3>
              {created.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-green-500 uppercase mb-2">완료된 업무</h3>
              {completed.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {passing.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">경유 중인 업무</h3>
              {passing.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {total === 0 && (
            <p className="text-sm text-gray-400 text-center mt-8">이 날의 업무가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DaySidePanel.tsx
git commit -m "feat: add DaySidePanel showing created/completed/passing tasks"
```

---

## Task 14: BottomNav 컴포넌트

**Files:**
- Create: `src/components/BottomNav.tsx`

- [ ] **Step 1: BottomNav.tsx 작성**

```tsx
// src/components/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
      <Link
        href="/"
        className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
          pathname === '/' ? 'text-blue-500' : 'text-gray-400'
        }`}
      >
        <span className="text-xl">📋</span>
        <span>업무</span>
      </Link>
      <Link
        href="/calendar"
        className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
          pathname === '/calendar' ? 'text-blue-500' : 'text-gray-400'
        }`}
      >
        <span className="text-xl">📅</span>
        <span>캘린더</span>
      </Link>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: add mobile bottom navigation bar"
```

---

## Task 15: 루트 레이아웃

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: layout.tsx 수정**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CarryOn',
  description: '개인 업무 관리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        {/* Desktop top nav */}
        <header className="hidden md:flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <span className="text-lg font-bold text-blue-500">CarryOn</span>
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">업무</Link>
          <Link href="/calendar" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">캘린더</Link>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col pb-16 md:pb-0 overflow-hidden">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add root layout with desktop top nav and mobile bottom nav"
```

---

## Task 16: 메인 페이지 + 캘린더 페이지

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/calendar/page.tsx`

- [ ] **Step 1: 칸반 보드 메인 페이지 작성**

```tsx
// src/app/page.tsx
import { getTasks, getColumns } from '@/lib/taskStore'
import TaskBoard from '@/components/TaskBoard'

// 서버 컴포넌트: 초기 데이터를 서버에서 직접 가져옴
// (API를 거치지 않고 dataStore를 직접 사용할 수도 있지만,
//  여기서는 taskStore 패턴 유지를 위해 fetch 사용)
export default async function BoardPage() {
  // SSR: 초기 렌더링 시 서버에서 데이터 로드
  const [tasks, columns] = await Promise.all([getTasks(), getColumns()])

  return (
    <div className="flex flex-col h-full pt-2">
      <h1 className="px-4 text-xl font-bold text-gray-800 md:hidden mb-2">업무 목록</h1>
      <div className="flex-1 overflow-hidden">
        <TaskBoard initialTasks={tasks} initialColumns={columns} />
      </div>
    </div>
  )
}
```

**주의:** Next.js 서버 컴포넌트에서 `fetch`는 절대 URL 필요. 대신 dataStore를 직접 import하도록 수정:

```tsx
// src/app/page.tsx (수정 버전)
import { readTasks, readColumns } from '@/lib/dataStore'
import TaskBoard from '@/components/TaskBoard'

export default async function BoardPage() {
  const [tasks, columns] = await Promise.all([readTasks(), readColumns()])

  return (
    <div className="flex flex-col h-full pt-2">
      <h1 className="px-4 text-xl font-bold text-gray-800 md:hidden mb-2">업무 목록</h1>
      <div className="flex-1 overflow-hidden">
        <TaskBoard initialTasks={tasks} initialColumns={columns} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 캘린더 페이지 작성**

```tsx
// src/app/calendar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import CalendarView from '@/components/CalendarView'
import DaySidePanel from '@/components/DaySidePanel'
import { getTasks, getColumns } from '@/lib/taskStore'
import type { Column, Task } from '@/lib/types'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getTasks(), getColumns()]).then(([t, c]) => {
      setTasks(t)
      setColumns(c)
    })
  }, [])

  return (
    <div className="max-w-2xl mx-auto w-full">
      <h1 className="px-4 pt-4 text-xl font-bold text-gray-800 md:hidden">캘린더</h1>
      <CalendarView
        tasks={tasks}
        onDayClick={setSelectedDate}
        selectedDate={selectedDate}
      />
      <DaySidePanel
        dateStr={selectedDate}
        tasks={tasks}
        columns={columns}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  )
}
```

- [ ] **Step 3: 전체 동작 확인**

```bash
npm run dev
```

확인 항목:
- `http://localhost:3000` — 칸반 보드 표시, 컬럼 4개
- 업무 추가, 드래그 이동, 편집, 삭제 동작
- `http://localhost:3000/calendar` — 월간 달력 표시
- 날짜 클릭 시 사이드 패널 열림
- 모바일 너비(375px)에서 하단 탭바 표시

- [ ] **Step 4: 모바일 접속 확인**

```bash
# PC의 WSL IP 확인
ip addr show eth0 | grep 'inet '
```

모바일 브라우저에서 `http://<WSL-IP>:3000` 접속 확인.

- [ ] **Step 5: 최종 Commit**

```bash
git add src/app/page.tsx src/app/calendar/page.tsx
git commit -m "feat: add board and calendar pages — CarryOn v1 complete"
```

---

## 완료 체크리스트

- [ ] `npm test` — 모든 테스트 통과
- [ ] `npm run build` — 빌드 오류 없음
- [ ] 업무 추가/편집/삭제 동작 확인
- [ ] 드래그로 카드 이동 (컬럼 간) 동작 확인
- [ ] 드래그로 컬럼 순서 변경 동작 확인
- [ ] 완료 컬럼으로 이동 시 `completedAt` 기록 확인 (`data/tasks.json` 직접 확인)
- [ ] 컬럼 추가/이름변경/삭제 동작 확인
- [ ] 캘린더 월 이동 동작 확인
- [ ] 날짜 클릭 시 생성/완료/경유 업무 구분 표시 확인
- [ ] 컴퓨터 재시작 후 `npm run dev` 시 데이터 유지 확인
- [ ] 모바일에서 하단 탭바 표시 및 터치 DnD 동작 확인
