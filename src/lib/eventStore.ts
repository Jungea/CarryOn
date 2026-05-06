// 클라이언트에서 /api/calendar-events를 호출하는 함수 모음
// CalendarPage 등 'use client' 컴포넌트에서 사용
import type { CalendarEvent, EventType } from './types'

export async function getEvents(): Promise<CalendarEvent[]> {
  const res = await fetch('/api/calendar-events')
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function createEvent(
  data: { date: string; type: EventType; name?: string }
): Promise<CalendarEvent> {
  const res = await fetch('/api/calendar-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await fetch(`/api/calendar-events/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete event')
}
