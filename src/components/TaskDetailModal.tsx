// 업무 상세 편집 모달 (제목, 메모, 마감일 수정 / 삭제)
// task prop이 null이면 렌더링하지 않음
'use client'

import { useEffect, useState } from 'react'
import type { Task, Column } from '@/lib/types'

interface TaskDetailModalProps {
  task: Task | null
  columns: Column[]
  onClose: () => void
  onSave: (id: string, data: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TaskDetailModal({ task, columns, onClose, onSave, onDelete }: TaskDetailModalProps) {
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [createdDate, setCreatedDate] = useState('')
  const [completedDate, setCompletedDate] = useState('')
  const [columnId, setColumnId] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDates, setShowDates] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setMemo(task.memo)
      setDueDate(task.dueDate ?? '')
      setCreatedDate(task.createdAt.slice(0, 10))
      setCompletedDate(task.completedAt ? task.completedAt.slice(0, 10) : '')
      setColumnId(task.columnId)
    }
  }, [task])

  if (!task) return null

  async function handleSave() {
    if (!task) return
    setSaving(true)
    const targetCol = columns.find((c) => c.id === columnId)
    let completedAt: string | null
    if (completedDate) {
      completedAt = new Date(`${completedDate}T09:00:00`).toISOString()
    } else if (targetCol?.isCompletedColumn && !task.completedAt) {
      completedAt = new Date().toISOString()
    } else if (!targetCol?.isCompletedColumn && task.completedAt) {
      completedAt = null
    } else {
      completedAt = task.completedAt
    }
    await onSave(task.id, {
      title: title.trim() || '(제목 없음)',
      memo,
      dueDate: dueDate || null,
      columnId,
      completedAt,
      createdAt: createdDate ? new Date(`${createdDate}T09:00:00`).toISOString() : task!.createdAt,
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!task || !confirm('업무를 삭제할까요?')) return
    setDeleting(true)
    await onDelete(task.id)
    setDeleting(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800">업무 편집</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">제목</label>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="업무 제목"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">메모</label>
          <textarea
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (선택)"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">컬럼</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
          >
            {[...columns].filter((c) => !c.filterType).sort((a, b) => a.order - b.order).map((col) => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">마감일</label>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowDates((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 text-left"
        >
          {showDates ? '▲ 날짜 접기' : '▼ 생성일 · 완료일 수정'}
        </button>
        {showDates && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">생성일</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">완료일</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
