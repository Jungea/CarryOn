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
import type { Column, Task } from '@/lib/types'
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
  const [showTodayPanel, setShowTodayPanel] = useState(false)
  const [today, setToday] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // ── Task handlers ──────────────────────────────────────

  // 컬럼에 새 업무 추가 (order는 현재 컬럼 마지막 순서)
  async function handleAddTask(columnId: string, title: string) {
    const colTasks = tasks.filter((t) => t.columnId === columnId)
    const newTask = await store.createTask({
      title,
      columnId,
      order: colTasks.length,
    })
    setTasks((prev) => [...prev, newTask])
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

  // 완료 컬럼 지정/해제 + 해당 컬럼 카드들 completedAt 일괄 갱신
  async function handleToggleCompletedColumn(id: string, value: boolean) {
    const updated = await store.updateColumn(id, { isCompletedColumn: value })
    setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)))

    const colTasks = tasks.filter((t) => t.columnId === id)
    if (colTasks.length === 0) return

    const completedAt = value ? new Date().toISOString() : null
    const patches = colTasks.map((t) => ({ id: t.id, completedAt }))
    await store.batchUpdateTasks(patches)
    setTasks((prev) => prev.map((t) => t.columnId === id ? { ...t, completedAt } : t))
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

    const isCompletedColumn = columns.find((c) => c.id === targetColumnId)?.isCompletedColumn ?? false
    const newCompletedAt = isCompletedColumn && !draggedTask.completedAt
      ? new Date().toISOString()
      : !isCompletedColumn && draggedTask.completedAt
      ? null
      : draggedTask.completedAt

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
    const sorted = [...columns].sort((a, b) => a.order - b.order)
    const colIndex = sorted.findIndex((c) => c.id === task.columnId)
    if (colIndex === -1 || colIndex >= sorted.length - 1) return
    const nextCol = sorted[colIndex + 1]
    const nextColTasks = tasks.filter((t) => t.columnId === nextCol.id)
    const completedAt = nextCol.isCompletedColumn && !task.completedAt
      ? new Date().toISOString()
      : !nextCol.isCompletedColumn && task.completedAt
      ? null
      : task.completedAt
    await store.batchUpdateTasks([{ id: task.id, columnId: nextCol.id, order: nextColTasks.length, completedAt }])
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, columnId: nextCol.id, order: nextColTasks.length, completedAt } : t))
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)
  const todayDueTasks = today ? tasks.filter((t) => t.dueDate === today && !t.completedAt) : []

  return (
    <div className="flex flex-col h-full">

      {/* Today Due Panel */}
      {showTodayPanel && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setShowTodayPanel(false)}>
          <div
            className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">오늘 마감</h2>
                <p className="text-xs text-gray-400 mt-0.5">{today} · {todayDueTasks.length}개</p>
              </div>
              <button onClick={() => setShowTodayPanel(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none"><X size={16} /></button>
            </div>
            <div className="flex-1 px-4 py-4 flex flex-col gap-2">
              {todayDueTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">오늘 마감인 업무가 없습니다</p>
              ) : (
                sortedColumns.map((col) => {
                  const colTasks = todayDueTasks.filter((t) => t.columnId === col.id)
                  if (colTasks.length === 0) return null
                  return (
                    <section key={col.id}>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{col.name}</h3>
                      {colTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => { setEditingTask(task); setShowTodayPanel(false) }}
                          className="w-full text-left py-2.5 px-3 mb-1 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                        >
                          <p className="text-sm text-gray-800 font-medium">{task.title}</p>
                          {task.memo && <p className="text-xs text-gray-400 mt-0.5 truncate">{task.memo}</p>}
                        </button>
                      ))}
                    </section>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="px-4 pb-2 flex items-center justify-end gap-2">
        {searchOpen ? (
          <>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery('') } }}
              placeholder="업무 검색..."
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery('') }}
              className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Search size={16} />
            </button>
            {todayDueTasks.length > 0 && (
              <button
                onClick={() => setShowTodayPanel(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors"
              >
                오늘 마감
                <span className="font-bold">{todayDueTasks.length}</span>
              </button>
            )}
          </>
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
                tasks={tasks.filter((t) => t.columnId === column.id)}
                isCardDragging={!!activeTask && activeTask.columnId !== column.id}
                searchQuery={searchQuery}
                onAddTask={handleAddTask}
                onEditTask={setEditingTask}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                onToggleCompleted={handleToggleCompletedColumn}
                onMoveNext={colIdx < sortedColumns.length - 1 ? handleMoveToNextColumn : undefined}
              />
            ))}

            {/* Add Column Button */}
            <button
              onClick={handleAddColumn}
              className="flex-shrink-0 w-72 h-12 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-slate-500 hover:text-slate-500 transition-colors text-sm"
            >
              + 컬럼 추가
            </button>
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
