// 업무 카드 하나 (제목, 마감일, 이월 버튼 표시)
// 드래그 가능 (useSortable), 클릭 시 TaskDetailModal 오픈
'use client'

import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onMoveNext?: () => void
}

export default function TaskCard({ task, onEdit, onMoveNext }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const [today, setToday] = useState('')
  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)) }, [])
  const isOverdue = task.dueDate && !task.completedAt && today && task.dueDate < today
  const dueDiff = task.dueDate && today
    ? Math.floor((new Date(task.dueDate).getTime() - new Date(today).getTime()) / 86400000)
    : null

  const createdDate = task.createdAt.slice(0, 10)
  const elapsedDays = today
    ? Math.floor((new Date(today).getTime() - new Date(createdDate).getTime()) / 86400000)
    : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(task)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all select-none relative"
    >
      <p className="text-sm font-medium text-gray-800 leading-snug">
        {task.title}
        {task.memo && <span className="ml-1.5 text-xs text-gray-400 font-normal">≡</span>}
      </p>

      {!task.completedAt && (
        <p className="mt-1 text-xs text-gray-400">
          {createdDate} · +{elapsedDays}일
        </p>
      )}

      <div className="mt-1 flex items-center justify-between">
        {task.completedAt ? (
          <span className="text-xs text-green-700/60">
            완료 {task.completedAt.slice(0, 10)}
          </span>
        ) : task.dueDate ? (
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            {task.dueDate} {dueDiff !== null && (dueDiff < 0 ? `${Math.abs(dueDiff)}일 초과` : `D-${dueDiff}`)}
          </span>
        ) : (
          <span />
        )}

        {onMoveNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveNext() }}
            className="sm:hidden ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-500 transition-colors text-sm leading-none flex-shrink-0"
          >
            ›
          </button>
        )}
      </div>
    </div>
  )
}
