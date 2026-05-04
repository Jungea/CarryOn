// 칸반 보드 전체를 관리하는 최상위 클라이언트 컴포넌트
// tasks/columns 상태 보관, DnD 이벤트 처리, API 호출 담당
'use client'

import { useState } from 'react'
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

interface TaskBoardProps {
  initialTasks: Task[]
  initialColumns: Column[]
}

export default function TaskBoard({ initialTasks, initialColumns }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [columns, setColumns] = useState<Column[]>([...initialColumns].sort((a, b) => a.order - b.order))
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // 2초 후 자동으로 사라지는 토스트 메시지 표시
  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

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

  // 개별 업무 이월 (현재는 토스트만 표시, 실제 날짜 이동 미구현)
  function handleCarryOver(taskId: string) {
    void taskId
    showToast('내일로 이월됩니다 ✓')
  }

  // 미완료 업무 전체 이월 (현재는 토스트만 표시, 실제 날짜 이동 미구현)
  function handleCarryOverAll() {
    const incomplete = tasks.filter((t) => !t.completedAt)
    showToast(`미완료 업무 ${incomplete.length}개가 내일로 이월됩니다 ✓`)
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
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  // 드래그 종료: 컬럼/카드 순서 재계산 후 API에 저장
  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    // 컬럼 재정렬
    const activeColIndex = columns.findIndex((c) => c.id === active.id)
    if (activeColIndex !== -1) {
      const overColIndex = columns.findIndex((c) => c.id === over.id)
      if (overColIndex === -1) return
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

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col h-full">
      {/* Carry Over All Button */}
      <div className="flex justify-end px-4 py-2">
        <button
          onClick={handleCarryOverAll}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          미완료 전체 이월 →
        </button>
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
          <div className="flex gap-4 px-4 pb-4 overflow-x-auto flex-1 items-start">
            {sortedColumns.map((column) => (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={tasks.filter((t) => t.columnId === column.id)}
                isCardDragging={!!activeTask}
                onAddTask={handleAddTask}
                onEditTask={setEditingTask}
                onCarryOverTask={handleCarryOver}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}

            {/* Add Column Button */}
            <button
              onClick={handleAddColumn}
              className="flex-shrink-0 w-72 h-12 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors text-sm"
            >
              + 컬럼 추가
            </button>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 shadow-xl">
              <TaskCard task={activeTask} onEdit={() => {}} onCarryOver={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Detail Modal */}
      <TaskDetailModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
