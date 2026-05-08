// 업무 카드 하나 (제목, 마감일, 이월 버튼 표시)
// 드래그 가능 (useSortable), 클릭 시 TaskDetailModal 오픈
'use client'

import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/types'
import { ChevronRight, Check } from 'lucide-react'

interface SharedProps {
  task: Task
  onEdit: (task: Task) => void
  onComplete?: (task: Task) => void
  onMoveNext?: () => void
  columnLabel?: string
}

function useCardState(task: Task) {
  const [today, setToday] = useState('')
  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)) }, [])
  const isOverdue = task.dueDate && !task.completedAt && today && task.dueDate < today
  const isDDay = task.dueDate && !task.completedAt && today && task.dueDate === today
  const dueDiff = task.dueDate && today
    ? Math.floor((new Date(task.dueDate).getTime() - new Date(today).getTime()) / 86400000)
    : null
  const createdDate = task.createdAt.slice(0, 10)
  const elapsedDays = today
    ? Math.floor((new Date(today).getTime() - new Date(createdDate).getTime()) / 86400000)
    : 0
  return { today, isOverdue, isDDay, dueDiff, createdDate, elapsedDays }
}

function CardBody({ task, onEdit, onComplete, onMoveNext, columnLabel, dragHandle }: SharedProps & { dragHandle?: React.ReactNode }) {
  const { isOverdue, isDDay, dueDiff, createdDate, elapsedDays } = useCardState(task)

  return (
    <div
      onClick={() => onEdit(task)}
      className={`rounded-lg border cursor-pointer hover:shadow-sm transition-all select-none relative ${
        isOverdue
          ? 'bg-red-50 border-red-200 hover:border-red-400'
          : isDDay
          ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
          : 'bg-white border-gray-200 hover:border-slate-400'
      }`}
    >
      {dragHandle}

      <div className="px-3 pb-3 flex gap-2">
        {onComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(task) }}
            className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              task.completedAt
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {task.completedAt && <Check size={10} strokeWidth={3} />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          {columnLabel && (
            <span className="inline-block mb-1 text-xs text-blue-500 bg-blue-100 rounded-full px-2 py-0.5">{columnLabel}</span>
          )}
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
                className="sm:hidden ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm leading-none flex-shrink-0"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 필터 컬럼용 — useSortable 미사용
export function StaticTaskCard(props: SharedProps) {
  return (
    <CardBody
      {...props}
      dragHandle={<div className="flex items-center justify-center h-4"><div className="w-8 h-1 rounded-full bg-gray-200" /></div>}
    />
  )
}

// 일반 컬럼용 — useSortable 사용
export default function TaskCard({ task, onEdit, onComplete, onMoveNext, columnLabel }: SharedProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <CardBody
        task={task}
        onEdit={onEdit}
        onComplete={onComplete}
        onMoveNext={onMoveNext}
        columnLabel={columnLabel}
        dragHandle={
          <div
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center h-4 cursor-grab active:cursor-grabbing"
          >
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>
        }
      />
    </div>
  )
}
