// 칸반 보드의 컬럼 하나 (헤더, 업무 목록, 업무 추가 폼 포함)
// 컬럼 자체도 드래그 가능 (useSortable)
'use client'

import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'
import type { Column, Task } from '@/lib/types'
import { Pencil, Trash2, Filter } from 'lucide-react'

const FILTER_TYPE_LABELS = { dueDate: '마감일', createdAt: '생성일', completedAt: '완료일' }

interface TaskColumnProps {
  column: Column
  tasks: Task[]
  allColumns?: Column[]
  isCardDragging: boolean
  searchQuery?: string
  onAddTask: (columnId: string, title: string) => Promise<void>
  onEditTask: (task: Task) => void
  onComplete?: (task: Task) => void
  onRenameColumn: (id: string, name: string) => Promise<void>
  onDeleteColumn: (id: string) => Promise<void>
  onMoveNext?: (taskId: string) => Promise<void>
}

export default function TaskColumn({
  column,
  tasks,
  allColumns = [],
  isCardDragging,
  searchQuery = '',
  onAddTask,
  onEditTask,
  onComplete,
  onRenameColumn,
  onDeleteColumn,
  onMoveNext,
}: TaskColumnProps) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState(column.name)
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

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
    if (!trimmed || adding) return
    setAdding(true)
    setNewTitle('')
    await onAddTask(column.id, trimmed)
    setAdding(false)
  }

  const sortedTasks = column.isCompletedColumn
    ? [...tasks].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    : [...tasks].sort((a, b) => a.order - b.order)
  const isSearching = searchQuery.trim().length > 0
  const filteredTasks = isSearching
    ? sortedTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedTasks

  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
  const recentTasks = sortedTasks.filter((t) => t.completedAt && new Date(t.completedAt) >= fiveDaysAgo)
  const completedVisible = recentTasks.length >= 10
    ? recentTasks
    : sortedTasks.slice(0, Math.max(recentTasks.length, 10))
  const visibleTasks = isSearching
    ? filteredTasks
    : column.isCompletedColumn
    ? completedVisible
    : filteredTasks
  const hiddenCount = column.isCompletedColumn && !isSearching
    ? Math.max(0, sortedTasks.length - visibleTasks.length)
    : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex-shrink-0 w-[calc(100vw-4rem)] sm:w-72 rounded-xl flex flex-col max-h-full snap-start ${column.filterType ? 'bg-blue-50' : 'bg-gray-50'}`}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {editing ? (
          <input
            className="text-sm font-semibold border-b border-slate-500 bg-transparent outline-none flex-1 mr-2"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-sm font-semibold text-gray-700 flex-1 flex items-center gap-1.5"
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          >
            {column.filterType && <Filter size={12} className="text-blue-400 shrink-0" />}
            {column.name}
            <span className="ml-1 text-xs font-normal text-gray-400">{tasks.length}</span>
          </span>
        )}

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditing(true); setNameInput(column.name) }}
            className="text-gray-400 hover:text-gray-600 text-xs px-1"
            title="이름 변경"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
            title="컬럼 삭제"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
        {/* 필터 뱃지 */}
        {column.filterType && (
          <div className="pt-1 pb-0.5">
            <span className="inline-flex items-center gap-1 text-xs text-blue-500 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
              {FILTER_TYPE_LABELS[column.filterType]} · {column.filterDays === 1 ? '오늘' : `최근 ${column.filterDays}일`}
            </span>
          </div>
        )}
        {/* Add Task Form (필터 컬럼은 숨김) */}
        {!column.filterType && (
          <form onSubmit={handleAddTask} className="pt-1">
            <input
              className="w-full border border-dashed border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-transparent focus:bg-white transition-all disabled:opacity-50"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={adding ? '추가 중...' : '+ 업무 추가'}
              onKeyDown={(e) => { if (e.key === 'Escape') setNewTitle('') }}
              disabled={adding}
            />
          </form>
        )}

        <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onComplete={onComplete}
              onMoveNext={onMoveNext ? () => onMoveNext(task.id) : undefined}
              columnLabel={column.filterType ? allColumns.find((c) => c.id === task.columnId)?.name : undefined}
            />
          ))}
        </SortableContext>
        {hiddenCount > 0 && (
          <p className="text-xs text-gray-400 text-center py-1">{hiddenCount}개 숨겨짐 · 검색으로 찾기</p>
        )}

        {/* 드래그 중일 때 하단 드롭 영역 표시 */}
        {isCardDragging && (
          <div className="h-16 rounded-lg border-2 border-dashed border-gray-200 transition-all" />
        )}
      </div>
    </div>
  )
}
