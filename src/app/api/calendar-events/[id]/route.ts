// DELETE /api/calendar-events/[id] — 이벤트 삭제
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  await supabase.from('calendar_events').delete().eq('id', id)
  return new NextResponse(null, { status: 204 })
}
