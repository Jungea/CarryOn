// GET   /api/tasks  — 전체 목록 조회
// POST  /api/tasks  — 새 업무 생성
// PATCH /api/tasks  — 여러 업무 일괄 수정 (드래그 후 순서/컬럼 저장용)
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { toTask } from '@/lib/dataStore'
import type { Task } from '@/lib/types'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data } = await supabase.from('tasks').select('*').lte('created_at', now).order('order')
  return NextResponse.json((data ?? []).map(toTask))
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient()
  const updates = await request.json() as Partial<Task>[]

  await Promise.all(updates.map((u) => {
    const patch: Record<string, unknown> = {}
    if (u.columnId !== undefined) patch.column_id = u.columnId
    if (u.order !== undefined) patch.order = u.order
    if ('completedAt' in u) patch.completed_at = u.completedAt ?? null
    return supabase.from('tasks').update(patch).eq('id', u.id!)
  }))

  const { data } = await supabase.from('tasks').select('*').order('order')
  return NextResponse.json((data ?? []).map(toTask))
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data: colTasks } = await supabase
    .from('tasks').select('id').eq('column_id', body.columnId)
  const order = typeof body.order === 'number' ? body.order : (colTasks?.length ?? 0)

  const row = {
    id: randomUUID(),
    title: String(body.title ?? ''),
    memo: String(body.memo ?? ''),
    due_date: body.dueDate ?? null,
    column_id: String(body.columnId),
    created_at: body.createdAt ?? new Date().toISOString(),
    completed_at: null,
    order,
    user_id: user.id,
  }

  const { data } = await supabase.from('tasks').insert(row).select().single()
  return NextResponse.json(toTask(data), { status: 201 })
}
