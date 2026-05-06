// 캘린더 페이지 (Client Component)
// 마운트 시 API에서 tasks/columns를 fetch해서 CalendarView + DaySidePanel에 전달
'use client'

import { useEffect, useState } from 'react'
import CalendarView from '@/components/CalendarView'
import DaySidePanel from '@/components/DaySidePanel'
import { getTasks, getColumns } from '@/lib/taskStore'
import type { Column, Task } from '@/lib/types'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getTasks(), getColumns()]).then(([t, c]) => {
      setTasks(t)
      setColumns(c)
    })
  }, [])

  return (
    <div className="w-full p-4 md:p-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800 md:hidden">캘린더</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <CalendarView
        tasks={tasks}
        onDayClick={setSelectedDate}
        selectedDate={selectedDate}
      />
      </div>
      <DaySidePanel
        dateStr={selectedDate}
        tasks={tasks}
        columns={columns}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  )
}
