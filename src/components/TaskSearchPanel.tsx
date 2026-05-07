'use client'

import type { Task, Column } from '@/lib/types'
import { X } from 'lucide-react'

interface TaskSearchPanelProps {
  query: string
  tasks: Task[]
  columns: Column[]
  onTaskClick: (task: Task) => void
  onClose: () => void
}

export default function TaskSearchPanel({ query, tasks, columns, onTaskClick, onClose }: TaskSearchPanelProps) {
  const q = query.trim().toLowerCase()
  const results = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q) || t.memo?.toLowerCase().includes(q))
    : []

  const getColName = (columnId: string) => columns.find((c) => c.id === columnId)?.name ?? ''

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">검색 결과</h2>
            <p className="text-xs text-gray-400 mt-0.5">{q ? `"${query}" · ${results.length}개` : '검색어를 입력하세요'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          {results.length === 0 && q && (
            <p className="text-sm text-gray-400 text-center mt-8">검색 결과가 없습니다</p>
          )}
          {results.map((task) => (
            <button
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-800">{task.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {getColName(task.columnId)}
                {task.dueDate && ` · ${task.dueDate}`}
                {task.completedAt && ' · 완료'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
