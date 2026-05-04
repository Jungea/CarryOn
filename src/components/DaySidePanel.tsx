'use client'

import { getTasksForDate } from '@/lib/calendarUtils'
import type { Column, Task } from '@/lib/types'

interface DaySidePanelProps {
  dateStr: string | null
  tasks: Task[]
  columns: Column[]
  onClose: () => void
}

function TaskRow({ task, columns }: { task: Task; columns: Column[] }) {
  const colName = columns.find((c) => c.id === task.columnId)?.name ?? ''
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-800">{task.title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{colName}</p>
    </div>
  )
}

export default function DaySidePanel({ dateStr, tasks, columns, onClose }: DaySidePanelProps) {
  if (!dateStr) return null

  const { created, completed, passing } = getTasksForDate(tasks, dateStr)
  const total = created.length + completed.length + passing.length

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">{dateStr}</h2>
            <p className="text-xs text-gray-400">업무 {total}개</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-6">
          {created.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">생성된 업무</h3>
              {created.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-green-500 uppercase mb-2">완료된 업무</h3>
              {completed.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {passing.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">경유 중인 업무</h3>
              {passing.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {total === 0 && (
            <p className="text-sm text-gray-400 text-center mt-8">이 날의 업무가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
