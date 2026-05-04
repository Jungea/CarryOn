'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onCarryOver: (taskId: string) => void
}

export default function TaskCard({ task, onEdit, onCarryOver }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue =
    task.dueDate && !task.completedAt && task.dueDate < new Date().toISOString().slice(0, 10)

  function handleCarryOver(e: React.MouseEvent) {
    e.stopPropagation()
    onCarryOver(task.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(task)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all select-none"
    >
      <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>

      <div className="mt-2 flex items-center justify-between">
        {task.dueDate ? (
          <span
            className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}
          >
            {task.dueDate}
          </span>
        ) : (
          <span />
        )}

        {!task.completedAt && (
          <button
            onClick={handleCarryOver}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors px-1"
            title="내일로 가져가기"
          >
            → 내일
          </button>
        )}
      </div>
    </div>
  )
}
