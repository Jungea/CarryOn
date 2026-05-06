// GET  /api/calendar-events — 전체 목록 조회
// POST /api/calendar-events — 새 이벤트 생성
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readEvents, writeEvents } from '@/lib/dataStore'
import type { CalendarEvent } from '@/lib/types'

export async function GET() {
  const events = await readEvents()
  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const body = await request.json()
  const events = await readEvents()

  const newEvent: CalendarEvent = {
    id: randomUUID(),
    date: String(body.date),
    type: body.type,
    name: body.name ?? undefined,
    createdAt: new Date().toISOString(),
  }

  events.push(newEvent)
  await writeEvents(events)
  return NextResponse.json(newEvent, { status: 201 })
}
