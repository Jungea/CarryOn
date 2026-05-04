// GET  /api/tasks       — 전체 목록 조회
// POST /api/tasks       — 새 업무 생성
// PATCH /api/tasks      — 여러 업무 일괄 수정 (드래그 후 순서/컬럼 저장용)
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readTasks, writeTasks } from '@/lib/dataStore'
import type { Task } from '@/lib/types'

export async function GET() {
  const tasks = await readTasks()
  return NextResponse.json(tasks)
}

// 여러 task를 한 번에 원자적으로 저장 (드래그 후 순서/컬럼 저장용)
export async function PATCH(request: Request) {
  const updates = await request.json() as Partial<Task>[]
  const tasks = await readTasks()

  for (const update of updates) {
    const index = tasks.findIndex((t) => t.id === update.id)
    if (index !== -1) tasks[index] = { ...tasks[index], ...update }
  }

  await writeTasks(tasks)
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
