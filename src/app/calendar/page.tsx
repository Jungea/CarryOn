// 캘린더 페이지 (Client Component)
// 마운트 시 API에서 tasks/columns/events를 fetch해서 각 컴포넌트에 전달
'use client'

import { useEffect, useState } from 'react'
import CalendarView from '@/components/CalendarView'
import DaySidePanel from '@/components/DaySidePanel'
import CalendarSettings from '@/components/CalendarSettings'
import { getTasks, getColumns } from '@/lib/taskStore'
import { getEvents, createEvent, deleteEvent } from '@/lib/eventStore'
import type { Column, Task, CalendarEvent, EventType } from '@/lib/types'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    Promise.all([getTasks(), getColumns(), getEvents()]).then(([t, c, e]) => {
      setTasks(t)
      setColumns(c)
      setEvents(e)
    })
  }, [])

  async function handleAddEvent(data: { date: string; type: EventType; name?: string }) {
    const newEvent = await createEvent(data)
    setEvents((prev) => [...prev, newEvent])
  }

  async function handleDeleteEvent(id: string) {
    await deleteEvent(id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="w-full p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800 md:hidden">캘린더</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <CalendarView
          tasks={tasks}
          events={events}
          onDayClick={setSelectedDate}
          selectedDate={selectedDate}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      </div>
      <DaySidePanel
        dateStr={selectedDate}
        tasks={tasks}
        columns={columns}
        events={events}
        onClose={() => setSelectedDate(null)}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
      />
      <CalendarSettings
        open={settingsOpen}
        events={events}
        onClose={() => setSettingsOpen(false)}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    </div>
  )
}
