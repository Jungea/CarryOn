// PUT    /api/tasks/[id] — 업무 수정
// DELETE /api/tasks/[id] — 업무 삭제
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { toTask } from '@/lib/dataStore'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const body = await request.json()

  const patch: Record<string, unknown> = {}
  if (body.title !== undefined) patch.title = body.title
  if (body.memo !== undefined) patch.memo = body.memo
  if ('dueDate' in body) patch.due_date = body.dueDate ?? null
  if (body.columnId !== undefined) patch.column_id = body.columnId
  if ('completedAt' in body) patch.completed_at = body.completedAt ?? null

  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toTask(data))
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  await supabase.from('tasks').delete().eq('id', id)
  return new NextResponse(null, { status: 204 })
}
