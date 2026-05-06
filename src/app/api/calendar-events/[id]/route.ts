// DELETE /api/calendar-events/[id] — 이벤트 삭제
import { NextResponse } from 'next/server'
import { readEvents, writeEvents } from '@/lib/dataStore'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const events = await readEvents()
  await writeEvents(events.filter((e) => e.id !== id))
  return new NextResponse(null, { status: 204 })
}
