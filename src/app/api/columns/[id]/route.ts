// PUT    /api/columns/[id] — 컬럼 수정
// DELETE /api/columns/[id] — 컬럼 삭제
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { toColumn } from '@/lib/dataStore'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const body = await request.json()

  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) patch.name = body.name
  if (body.order !== undefined) patch.order = body.order
  if (body.isCompletedColumn !== undefined) patch.is_completed_column = body.isCompletedColumn
  if (body.filterType !== undefined) patch.filter_type = body.filterType
  if (body.filterDays !== undefined) patch.filter_days = body.filterDays

  const { data, error } = await supabase.from('columns').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(toColumn(data))
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  await supabase.from('columns').delete().eq('id', id)
  return new NextResponse(null, { status: 204 })
}
