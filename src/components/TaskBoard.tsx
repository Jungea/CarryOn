// 칸반 보드 전체를 관리하는 최상위 클라이언트 컴포넌트
// tasks/columns 상태 보관, DnD 이벤트 처리, API 호출 담당
'use client'

import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import TaskColumn from './TaskColumn'
import TaskCard from './TaskCard'
import TaskDetailModal from './TaskDetailModal'
import FilterColumnModal from './FilterColumnModal'
import type { Column, Task, FilterType } from '@/lib/types'
import * as store from '@/lib/taskStore'
import { Search, X } from 'lucide-react'

interface TaskBoardProps {
  initialTasks: Task[]
  initialColumns: Column[]
}

export default function TaskBoard({ initialTasks, initialColumns }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [columns, setColumns] = useState<Column[]>([...initialColumns].sort((a, b) => a.order - b.order))
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [activeColumn, setActiveColumn] = useState<Column | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // ── Task handlers ──────────────────────────────────────

  // 컬럼에 새 업무 추가 (order는 현재 컬럼 마지막 순서)
  async function handleAddTask(columnId: string, title: string) {
    const colTasks = tasks.filter((t) => t.columnId === columnId)
    const shifted = colTasks.map((t) => ({ ...t, order: t.order + 1 }))
    const newTask = await store.createTask({ title, columnId, order: 0 })
    setTasks((prev) => [newTask, ...prev.filter((t) => t.columnId !== columnId), ...shifted])
    if (shifted.length > 0) {
      await store.batchUpdateTasks(shifted.map((t) => ({ id: t.id, columnId: t.columnId, order: t.order, completedAt: t.completedAt })))
    }
  }

  // 업무 수정 (제목, 메모, 마감일 등 부분 업데이트)
  async function handleSaveTask(id: string, data: Partial<Task>) {
    const updated = await store.updateTask(id, data)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  // 업무 삭제
  async function handleDeleteTask(id: string) {
    await store.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }


  // ── Column handlers ────────────────────────────────────

  // 새 컬럼 추가 (기본 이름 '새 컬럼', 마지막 순서)
  async function handleAddColumn() {
    const newCol = await store.createColumn({
      name: '새 컬럼',
      order: columns.length,
      isCompletedColumn: false,
    })
    setColumns((prev) => [...prev, newCol])
  }

  async function handleAddFilterColumn(name: string, filterType: FilterType, filterDays: number) {
    const newCol = await store.createColumn({
      name,
      order: columns.length,
      isCompletedColumn: false,
      filterType,
      filterDays,
    })
    setColumns((prev) => [...prev, newCol])
  }

  function getFilterTasks(column: Column): Task[] {
    if (!column.filterType || !column.filterDays) return []
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const from = new Date()
    from.setDate(from.getDate() - (column.filterDays - 1))
    from.setHours(0, 0, 0, 0)
    return tasks.filter((t) => {
      const raw = column.filterType === 'dueDate' ? t.dueDate
        : column.filterType === 'completedAt' ? t.completedAt
        : t.createdAt
      if (!raw) return false
      const d = new Date(raw)
      return d >= from && d <= today
    })
  }

  async function handleCompleteTask(task: Task) {
    const completedAt = task.completedAt ? null : new Date().toISOString()
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completedAt } : t))
    store.updateTask(task.id, { completedAt })
  }

  async function handleToggleCompletedColumn(id: string, value: boolean) {
    const updated = await store.updateColumn(id, { isCompletedColumn: value })
    setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  // 컬럼 이름 변경
  async function handleRenameColumn(id: string, name: string) {
    const updated = await store.updateColumn(id, { name })
    setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  // 컬럼 삭제 (포함된 업무도 함께 삭제)
  async function handleDeleteColumn(id: string) {
    const colTasks = tasks.filter((t) => t.columnId === id)
    await Promise.all(colTasks.map((t) => store.deleteTask(t.id)))
    await store.deleteColumn(id)
    setTasks((prev) => prev.filter((t) => t.columnId !== id))
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  // ── DnD handlers ───────────────────────────────────────

  // 드래그 시작: DragOverlay에 표시할 카드 기억
  function handleDragStart({ active }: DragStartEvent) {
    const col = columns.find((c) => c.id === active.id)
    if (col) { setActiveColumn(col); return }
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  // 드래그 종료: 컬럼/카드 순서 재계산 후 API에 저장
  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    setActiveColumn(null)
    if (!over || active.id === over.id) return

    // 컬럼 재정렬
    const activeColIndex = columns.findIndex((c) => c.id === active.id)
    if (activeColIndex !== -1) {
      let overColIndex = columns.findIndex((c) => c.id === over.id)
      if (overColIndex === -1) {
        // over가 카드 ID인 경우 해당 카드의 컬럼을 대상으로 사용
        const overTask = tasks.find((t) => t.id === over.id)
        if (!overTask) return
        overColIndex = columns.findIndex((c) => c.id === overTask.columnId)
        if (overColIndex === -1) return
      }
      const reordered = arrayMove(columns, activeColIndex, overColIndex).map((c, i) => ({
        ...c,
        order: i,
      }))
      setColumns(reordered)
      await store.batchUpdateColumns(reordered.map((c) => ({ id: c.id, order: c.order })))
      return
    }

    // 카드 재정렬
    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    const overTask = tasks.find((t) => t.id === over.id)
    const targetColumnId = overTask?.columnId ?? columns.find((c) => c.id === over.id)?.id
    if (!targetColumnId) return
    const targetColumn = columns.find((c) => c.id === targetColumnId)
    if (targetColumn?.filterType) return // 필터 컬럼으로 드롭 불가

    const newCompletedAt = draggedTask.completedAt

    const others = tasks.filter((t) => t.columnId !== targetColumnId)

    if (draggedTask.columnId === targetColumnId) {
      // 같은 컬럼 내 재정렬: arrayMove로 위/아래 모두 정확하게 처리
      const colTasks = tasks
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order)
      const activeIndex = colTasks.findIndex((t) => t.id === active.id)
      const overIndex = colTasks.findIndex((t) => t.id === over.id)
      if (overIndex === -1) return
      const reordered = arrayMove(colTasks, activeIndex, overIndex).map((t, i) => ({ ...t, order: i }))
      setTasks([...others, ...reordered])
      await store.batchUpdateTasks(
        reordered.map((t) => ({ id: t.id, columnId: t.columnId, order: t.order, completedAt: t.completedAt }))
      )
    } else {
      // 다른 컬럼으로 이동: 카드 위/아래 절반 기준으로 앞/뒤 결정
      const colTasks = tasks
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order)

      let insertIndex: number
      if (!overTask) {
        insertIndex = colTasks.length
      } else {
        const overCenter = over.rect.top + over.rect.height / 2
        const activeTop = active.rect.current.translated?.top ?? over.rect.top
        const insertAfter = activeTop > overCenter
        const foundIndex = colTasks.findIndex((t) => t.id === over.id)
        insertIndex = foundIndex === -1 ? colTasks.length : foundIndex + (insertAfter ? 1 : 0)
      }

      colTasks.splice(insertIndex, 0, {
        ...draggedTask,
        columnId: targetColumnId,
        completedAt: newCompletedAt,
      })
      const reordered = colTasks.map((t, i) => ({ ...t, order: i }))
      setTasks([...others.filter((t) => t.id !== draggedTask.id), ...reordered])
      await store.batchUpdateTasks(
        reordered.map((t) => ({ id: t.id, columnId: t.columnId, order: t.order, completedAt: t.completedAt }))
      )
    }
  }

  async function handleMoveToNextColumn(taskId: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const sorted = [...columns].filter((c) => !c.filterType).sort((a, b) => a.order - b.order)
    const colIndex = sorted.findIndex((c) => c.id === task.columnId)
    if (colIndex === -1 || colIndex >= sorted.length - 1) return
    const nextCol = sorted[colIndex + 1]
    const nextColTasks = tasks.filter((t) => t.columnId === nextCol.id)
    await store.batchUpdateTasks([{ id: task.id, columnId: nextCol.id, order: nextColTasks.length, completedAt: task.completedAt }])
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, columnId: nextCol.id, order: nextColTasks.length } : t))
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col h-full">

      {/* Top Bar */}
      <div className="px-4 pt-1 pb-2 flex items-center justify-end gap-2">
        {searchOpen ? (
          <div className="relative w-full md:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } }}
              placeholder="업무 검색..."
              className="w-full text-sm bg-gray-100 rounded-full pl-8 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-colors"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Search size={16} />
          </button>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedColumns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div ref={scrollRef} className="board-scroll flex gap-4 px-4 pt-2 pb-4 overflow-x-auto flex-1 items-start">
            {sortedColumns.map((column, colIdx) => (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={column.filterType ? getFilterTasks(column) : tasks.filter((t) => t.columnId === column.id && (!t.completedAt || !!searchQuery))}
                allColumns={columns}
                isCardDragging={!!activeTask && activeTask.columnId !== column.id}
                searchQuery={searchQuery}
                onAddTask={handleAddTask}
                onEditTask={setEditingTask}
                onComplete={handleCompleteTask}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                onMoveNext={colIdx < sortedColumns.length - 1 ? handleMoveToNextColumn : undefined}
              />
            ))}

            {/* Add Column Buttons */}
            <div className="flex-shrink-0 flex flex-col gap-2">
              <button
                onClick={handleAddColumn}
                className="w-72 h-12 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-slate-500 hover:text-slate-500 transition-colors text-sm"
              >
                + 컬럼 추가
              </button>
              <button
                onClick={() => setFilterModalOpen(true)}
                className="w-72 h-12 rounded-xl border-2 border-dashed border-blue-200 text-blue-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
              >
                + 필터 컬럼 추가
              </button>
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeColumn ? (
            <div className="w-72 bg-gray-50 rounded-xl flex flex-col shadow-2xl rotate-1 opacity-95 max-h-[60vh] overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">
                  {activeColumn.name}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {tasks.filter((t) => t.columnId === activeColumn.id).length}
                  </span>
                </span>
              </div>
              <div className="px-3 py-3 flex flex-col gap-2">
                {tasks
                  .filter((t) => t.columnId === activeColumn.id)
                  .sort((a, b) => a.order - b.order)
                  .slice(0, 6)
                  .map((task) => (
                    <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                    </div>
                  ))}
              </div>
            </div>
          ) : activeTask ? (
            <div className="rotate-2 shadow-xl">
              <TaskCard task={activeTask} onEdit={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>


      {filterModalOpen && (
        <FilterColumnModal
          onClose={() => setFilterModalOpen(false)}
          onCreate={handleAddFilterColumn}
        />
      )}

      {/* Detail Modal */}
      <TaskDetailModal
        task={editingTask}
        columns={columns}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

    </div>
  )
}
