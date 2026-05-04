// PUT    /api/tasks/[id] — 업무 수정 (제목, 메모, 마감일 등)
// DELETE /api/tasks/[id] — 업무 삭제
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
