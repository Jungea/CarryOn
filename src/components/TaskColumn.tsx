// 칸반 보드의 컬럼 하나 (헤더, 업무 목록, 업무 추가 폼 포함)
// 컬럼 자체도 드래그 가능 (useSortable)
'use client'

import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'
import type { Column, Task } from '@/lib/types'

interface TaskColumnProps {
  column: Column
  tasks: Task[]
  isCardDragging: boolean
  onAddTask: (columnId: string, title: string) => Promise<void>
  onEditTask: (task: Task) => void
  onRenameColumn: (id: string, name: string) => Promise<void>
  onDeleteColumn: (id: string) => Promise<void>
  onToggleCompleted: (id: string, value: boolean) => Promise<void>
}

export default function TaskColumn({
  column,
  tasks,
  isCardDragging,
  onAddTask,
  onEditTask,
  onRenameColumn,
  onDeleteColumn,
  onToggleCompleted,
}: TaskColumnProps) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(column.name)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  async function handleRename() {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== column.name) {
      await onRenameColumn(column.id, trimmed)
    }
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`"${column.name}" 컬럼을 삭제할까요? 포함된 업무도 함께 삭제됩니다.`)) return
    await onDeleteColumn(column.id)
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    await onAddTask(column.id, trimmed)
    setNewTitle('')
    setAdding(false)
  }

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 bg-gray-50 rounded-xl flex flex-col max-h-full"
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {editing ? (
          <input
            className="text-sm font-semibold border-b border-blue-400 bg-transparent outline-none flex-1 mr-2"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-sm font-semibold text-gray-700 flex-1"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          >
            {column.name}
            <span className="ml-2 text-xs font-normal text-gray-400">{tasks.length}</span>
          </span>
        )}

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              const msg = column.isCompletedColumn
                ? `"${column.name}" 완료 컬럼 지정을 해제할까요? 카드들의 완료일이 초기화됩니다.`
                : `"${column.name}"을 완료 컬럼으로 지정할까요? 카드들의 완료일이 오늘로 설정됩니다.`
              if (confirm(msg)) onToggleCompleted(column.id, !column.isCompletedColumn)
            }}
            className={`text-xs px-1 transition-colors ${column.isCompletedColumn ? 'text-green-500 hover:text-gray-400' : 'text-gray-400 hover:text-green-500'}`}
            title={column.isCompletedColumn ? '완료 컬럼 해제' : '완료 컬럼으로 지정'}
          >
            ✓
          </button>
          <button
            onClick={() => { setEditing(true); setNameInput(column.name) }}
            className="text-gray-400 hover:text-gray-600 text-xs px-1"
            title="이름 변경"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
            title="컬럼 삭제"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
        <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
            />
          ))}
        </SortableContext>

        {/* 드래그 중일 때 하단 드롭 영역 표시 */}
        {isCardDragging && (
          <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 transition-all" />
        )}

        {/* Add Task Form */}
        {adding ? (
          <form onSubmit={handleAddTask} className="flex flex-col gap-2 mt-1">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="업무 제목 입력..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-gray-400 hover:text-gray-600 text-left px-1 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            + 업무 추가
          </button>
        )}
      </div>
    </div>
  )
}
