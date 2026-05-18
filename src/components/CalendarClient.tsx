'use client'

import { useRef, useState } from 'react'
import CalendarView from '@/components/CalendarView'
import DaySidePanel from '@/components/DaySidePanel'
import CalendarSettings from '@/components/CalendarSettings'
import TaskDetailModal from '@/components/TaskDetailModal'
import { updateTask, deleteTask, createTask } from '@/lib/taskStore'
import { createEvent, deleteEvent } from '@/lib/eventStore'
import type { Column, Task, CalendarEvent, EventType } from '@/lib/types'
import { Search, X } from 'lucide-react'

interface Props {
  initialTasks: Task[]
  initialColumns: Column[]
  initialEvents: CalendarEvent[]
}

export default function CalendarClient({ initialTasks, initialColumns, initialEvents }: Props) {
  const today = new Date()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [columns] = useState<Column[]>(initialColumns)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = searchQuery.trim().toLowerCase()
  const matchedTasks = q
    ? tasks
        .filter((t) => t.title.toLowerCase().includes(q) || t.memo?.toLowerCase().includes(q))
        .sort((a, b) => {
          const da = a.dueDate ?? a.createdAt.slice(0, 10)
          const db = b.dueDate ?? b.createdAt.slice(0, 10)
          return da.localeCompare(db)
        })
    : []

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSearchQuery(val), 300)
  }

  function jumpToTask(task: Task) {
    const dateStr = task.dueDate ?? task.createdAt.slice(0, 10)
    const [y, m] = dateStr.split('-').map(Number)
    setYear(y)
    setMonth(m - 1)
    setSelectedDate(dateStr)
    setSearchOpen(false)
    setSearchQuery('')
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  async function handleAddTask(title: string, columnId: string, dueDate: string) {
    const createdAt = new Date(`${dueDate}T09:00:00`).toISOString()
    const newTask = await createTask({ title, columnId, order: 0, dueDate, createdAt })
    setTasks((prev) => [newTask, ...prev])
  }

  async function handleAddEvent(data: { date: string; type: EventType; name?: string }) {
    const newEvent = await createEvent(data)
    setEvents((prev) => [...prev, newEvent])
  }

  async function handleDeleteEvent(id: string) {
    await deleteEvent(id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const dropdown = searchOpen && q && (
    <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
      {matchedTasks.length > 0 ? (
        <>
          <p className="text-xs text-gray-400 px-3 pt-2 pb-1">{matchedTasks.length}개 결과</p>
          {matchedTasks.map((task) => {
            const dateStr = task.dueDate ?? task.createdAt.slice(0, 10)
            return (
              <button
                key={task.id}
                onClick={() => jumpToTask(task)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 border-t border-gray-50"
              >
                <span className="text-sm text-gray-800 truncate">{task.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{dateStr}</span>
              </button>
            )
          })}
        </>
      ) : (
        <p className="text-sm text-gray-400 px-4 py-3">검색 결과가 없습니다</p>
      )}
    </div>
  )

  return (
    <div className="w-full p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-4 h-9 flex items-center gap-3">
        <div className="flex-1" />
        <div className="relative">
          {searchOpen ? (
            <div className="relative w-44 md:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                onChange={handleSearchChange}
                onKeyDown={(e) => { if (e.key === 'Escape') closeSearch() }}
                placeholder="태스크 검색..."
                className="text-sm bg-gray-100 rounded-full pl-8 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white w-full transition-colors"
              />
              <button onClick={closeSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
              {dropdown}
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-gray-400 hover:text-gray-600"><Search size={16} /></button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <CalendarView
          tasks={tasks}
          events={events}
          onDayClick={setSelectedDate}
          selectedDate={selectedDate}
          onSettingsClick={() => setSettingsOpen(true)}
          searchQuery={searchQuery}
          year={year}
          month={month}
          onYearMonthChange={(y, m) => { setYear(y); setMonth(m) }}
        />
      </div>
      <DaySidePanel
        dateStr={selectedDate}
        tasks={tasks}
        columns={columns}
        events={events}
        onClose={() => setSelectedDate(null)}
        onTaskClick={setEditingTask}
        onAddTask={handleAddTask}
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
