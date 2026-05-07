// 캘린더 페이지 (Client Component)
// 마운트 시 API에서 tasks/columns/events를 fetch해서 각 컴포넌트에 전달
'use client'

import { useEffect, useState } from 'react'
import CalendarView from '@/components/CalendarView'
import DaySidePanel from '@/components/DaySidePanel'
import CalendarSettings from '@/components/CalendarSettings'
import TaskDetailModal from '@/components/TaskDetailModal'
import TaskSearchPanel from '@/components/TaskSearchPanel'
import { getTasks, getColumns, updateTask, deleteTask } from '@/lib/taskStore'
import { getEvents, createEvent, deleteEvent } from '@/lib/eventStore'
import type { Column, Task, CalendarEvent, EventType } from '@/lib/types'
import { Search } from 'lucide-react'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

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
      <div className="mb-4 flex items-center gap-3 md:hidden">
        <h1 className="text-xl font-bold text-gray-800 flex-1">캘린더</h1>
        {searchOpen ? (
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } }}
            placeholder="업무 검색..."
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 w-40 bg-white"
          />
        ) : (
          <button onClick={() => setSearchOpen(true)} className="text-gray-400 hover:text-gray-600 text-lg"><Search size={16} /></button>
        )}
      </div>
      <div className="hidden md:flex items-center gap-3 mb-4">
        <div className="flex-1" />
        {searchOpen ? (
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } }}
            placeholder="업무 검색..."
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 w-48 bg-white"
          />
        ) : (
          <button onClick={() => setSearchOpen(true)} className="text-gray-400 hover:text-gray-600 text-lg"><Search size={16} /></button>
        )}
      </div>
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
        onTaskClick={setEditingTask}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
      />
      <TaskDetailModal
        task={editingTask}
        columns={columns}
        onClose={() => setEditingTask(null)}
        onSave={async (id, data) => {
          const updated = await updateTask(id, data)
          setTasks((prev) => prev.map((t) => t.id === id ? updated : t))
        }}
        onDelete={async (id) => {
          await deleteTask(id)
          setTasks((prev) => prev.filter((t) => t.id !== id))
          setEditingTask(null)
        }}
      />
      {searchOpen && searchQuery.trim() && (
        <TaskSearchPanel
          query={searchQuery}
          tasks={tasks}
          columns={columns}
          onTaskClick={(task) => { setEditingTask(task) }}
          onClose={() => { setSearchOpen(false); setSearchQuery('') }}
        />
      )}
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
