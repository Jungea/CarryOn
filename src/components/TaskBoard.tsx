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
  type DragOverEvent,
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

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // ── Task handlers ──────────────────────────────────────

  async function handleAddTask(columnId: string) {
    const colTasks = tasks.filter((t) => t.columnId === columnId)
    const newTask = await store.createTask({
      title: '새 업무',
      columnId,
      order: colTasks.length,
    })
    setTasks((prev) => [...prev, newTask])
    setEditingTask(newTask)
  }

  async function handleSaveTask(id: string, data: Partial<Task>) {
    const updated = await store.updateTask(id, data)
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function handleDeleteTask(id: string) {
    await store.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function handleCarryOver(taskId: string) {
    void taskId
    showToast('내일로 이월됩니다 ✓')
  }

  function handleCarryOverAll() {
    const incomplete = tasks.filter((t) => !t.completedAt)
    showToast(`미완료 업무 ${incomplete.length}개가 내일로 이월됩니다 ✓`)
  }

  // ── Column handlers ────────────────────────────────────

  async function handleAddColumn() {
    const newCol = await store.createColumn({
      name: '새 컬럼',
      order: columns.length,
      isCompletedColumn: false,
    })
    setColumns((prev) => [...prev, newCol])
  }

  async function handleRenameColumn(id: string, name: string) {
    const updated = await store.updateColumn(id, { name })
    setColumns((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  async function handleDeleteColumn(id: string) {
    const colTasks = tasks.filter((t) => t.columnId === id)
    await Promise.all(colTasks.map((t) => store.deleteTask(t.id)))
    await store.deleteColumn(id)
    setTasks((prev) => prev.filter((t) => t.columnId !== id))
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  // ── DnD handlers ───────────────────────────────────────

  function handleDragStart({ active }: DragStartEvent) {
    const task = tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || active.id === over.id) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    const overTask = tasks.find((t) => t.id === over.id)
    const overColumn = columns.find((c) => c.id === over.id)

    if (!draggedTask) return

    const targetColumnId = overTask?.columnId ?? overColumn?.id
    if (!targetColumnId || draggedTask.columnId === targetColumnId) return

    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask.id ? { ...t, columnId: targetColumnId } : t))
    )
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const draggedTask = tasks.find((t) => t.id === active.id)

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
      await Promise.all(reordered.map((c) => store.updateColumn(c.id, { order: c.order })))
      return
    }

    // 카드 재정렬
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

    setTasks((prev) => {
      const colTasks = prev
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order)
      const others = prev.filter((t) => t.columnId !== targetColumnId && t.id !== draggedTask.id)

      const targetIndex = overTask ? colTasks.findIndex((t) => t.id === over.id) : colTasks.length
      const withoutActive = colTasks.filter((t) => t.id !== draggedTask.id)
      withoutActive.splice(targetIndex, 0, {
        ...draggedTask,
        columnId: targetColumnId,
        completedAt: newCompletedAt,
      })
      const reordered = withoutActive.map((t, i) => ({ ...t, order: i }))

      reordered.forEach((t) =>
        store.updateTask(t.id, { columnId: t.columnId, order: t.order, completedAt: t.completedAt })
      )

      return [...others, ...reordered]
    })
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
        onDragOver={handleDragOver}
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
