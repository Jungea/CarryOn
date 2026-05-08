import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { DEFAULT_COLUMN_ROWS, toColumn } from '@/lib/dataStore'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('tasks').delete().eq('user_id', user.id)
  await supabase.from('columns').delete().eq('user_id', user.id)
  await supabase.from('calendar_events').delete().eq('user_id', user.id)

  const rows = DEFAULT_COLUMN_ROWS.map((c) => ({ ...c, id: randomUUID(), user_id: user.id }))
  await supabase.from('columns').insert(rows)

  const { data: columns } = await supabase.from('columns').select('*').order('order')
  return NextResponse.json({ columns: (columns ?? []).map(toColumn) })
}
