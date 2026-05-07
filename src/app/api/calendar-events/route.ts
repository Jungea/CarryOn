// GET  /api/calendar-events — 전체 목록 조회
// POST /api/calendar-events — 새 이벤트 생성
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { supabase } from '@/lib/supabase'
import { toCalendarEvent } from '@/lib/dataStore'

export async function GET() {
  const { data } = await supabase.from('calendar_events').select('*').order('created_at')
  return NextResponse.json((data ?? []).map(toCalendarEvent))
}

export async function POST(request: Request) {
  const body = await request.json()

  const row = {
    id: randomUUID(),
    date: String(body.date),
    type: body.type,
    name: body.name ?? null,
    created_at: new Date().toISOString(),
  }

  const { data } = await supabase.from('calendar_events').insert(row).select().single()
  return NextResponse.json(toCalendarEvent(data), { status: 201 })
}
