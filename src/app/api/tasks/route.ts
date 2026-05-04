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
