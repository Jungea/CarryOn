import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { DEFAULT_COLUMN_ROWS, toColumn } from '@/lib/dataStore'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase.from('columns').select('id').eq('user_id', user.id).limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true })
  }

  const rows = DEFAULT_COLUMN_ROWS.map((c) => ({ ...c, id: randomUUID(), user_id: user.id }))
  await supabase.from('columns').insert(rows)

  return NextResponse.json({ ok: true })
}
