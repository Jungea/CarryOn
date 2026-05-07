// GET   /api/columns  — 전체 컬럼 조회
// POST  /api/columns  — 새 컬럼 생성
// PATCH /api/columns  — 여러 컬럼 일괄 수정 (드래그 후 순서 저장용)
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { toColumn } from '@/lib/dataStore'
import type { Column } from '@/lib/types'

const DEFAULT_COLUMNS = [
  { name: '할 일', order: 0, is_completed_column: false },
  { name: '진행 중', order: 1, is_completed_column: false },
  { name: '완료', order: 2, is_completed_column: true },
]

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('columns').select('*').order('order')

  if (!existing || existing.length === 0) {
    const rows = DEFAULT_COLUMNS.map((c) => ({ ...c, id: randomUUID(), user_id: user.id }))
    await supabase.from('columns').insert(rows)
    const { data: seeded } = await supabase.from('columns').select('*').order('order')
    return NextResponse.json((seeded ?? []).map(toColumn))
  }

  return NextResponse.json(existing.map(toColumn))
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient()
  const updates = await request.json() as Partial<Column>[]

  await Promise.all(updates.map((u) => {
    const patch: Record<string, unknown> = {}
    if (u.order !== undefined) patch.order = u.order
    if (u.name !== undefined) patch.name = u.name
    if (u.isCompletedColumn !== undefined) patch.is_completed_column = u.isCompletedColumn
    return supabase.from('columns').update(patch).eq('id', u.id!)
  }))

  const { data } = await supabase.from('columns').select('*').order('order')
  return NextResponse.json((data ?? []).map(toColumn))
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data: existing } = await supabase.from('columns').select('id')
  const order = typeof body.order === 'number' ? body.order : (existing?.length ?? 0)

  const row = {
    id: randomUUID(),
    name: String(body.name ?? '새 컬럼'),
    order,
    is_completed_column: Boolean(body.isCompletedColumn ?? false),
    user_id: user.id,
  }

  const { data } = await supabase.from('columns').insert(row).select().single()
  return NextResponse.json(toColumn(data), { status: 201 })
}
