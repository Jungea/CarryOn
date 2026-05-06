// 캘린더에서 날짜 클릭 시 오른쪽에서 슬라이드되는 패널
// 해당 날짜의 생성/완료/경유 업무 + 공휴일/연차를 섹션별로 표시
'use client'

import { useState } from 'react'
import { getTasksForDate } from '@/lib/calendarUtils'
import { getHolidayName } from '@/lib/holidays'
import type { Column, Task, CalendarEvent, EventType } from '@/lib/types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const LEAVE_TYPES: EventType[] = ['연차', '오전반차', '오후반차', '오전반반차', '오후반반차']

interface DaySidePanelProps {
  dateStr: string | null
  tasks: Task[]
  columns: Column[]
  events: CalendarEvent[]
  onClose: () => void
  onAddEvent: (data: { date: string; type: EventType; name?: string }) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
}

function TaskRow({ task, columns }: { task: Task; columns: Column[] }) {
  const colName = columns.find((c) => c.id === task.columnId)?.name ?? ''
  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-800">{task.title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{colName}</p>
    </div>
  )
}

function QuickAddEvent({
  dateStr,
  onAdd,
}: {
  dateStr: string
  onAdd: (data: { date: string; type: EventType; name?: string }) => Promise<void>
}) {
  const [mode, setMode] = useState<'holiday' | 'leave' | 'event' | null>(null)
  const [name, setName] = useState('')
  const [leaveType, setLeaveType] = useState<EventType>('연차')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if ((mode === 'holiday' || mode === 'event') && !name.trim()) return
    setSaving(true)
    await onAdd({
      date: dateStr,
      type: mode === 'holiday' ? 'holiday' : mode === 'event' ? 'event' : leaveType,
      name: (mode === 'holiday' || mode === 'event') ? name.trim() : undefined,
    })
    setName('')
    setMode(null)
    setSaving(false)
  }

  if (!mode) {
    return (
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setMode('event')} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700 transition-colors">
          + 일정
        </button>
        <button onClick={() => setMode('holiday')} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
          + 공휴일
        </button>
        <button onClick={() => setMode('leave')} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-colors">
          + 연차
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {mode === 'holiday' || mode === 'event' ? (
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder={mode === 'event' ? '일정 이름' : '공휴일 이름'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      ) : (
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={leaveType as string}
          onChange={(e) => setLeaveType(e.target.value as EventType)}
        >
          {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={saving} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
          추가
        </button>
        <button onClick={() => setMode(null)} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
          취소
        </button>
      </div>
    </div>
  )
}

export default function DaySidePanel({ dateStr, tasks, columns, events, onClose, onAddEvent, onDeleteEvent }: DaySidePanelProps) {
  if (!dateStr) return null

  const { created, completed, passing } = getTasksForDate(tasks, dateStr)
  const total = created.length + completed.length + passing.length

  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = WEEKDAYS[date.getDay()]
  const holiday = getHolidayName(dateStr)

  const dayEvents = events.filter((e) => e.date === dateStr)
  const customHolidays = dayEvents.filter((e) => e.type === 'holiday')
  const leaveEvents = dayEvents.filter((e) => e.type !== 'holiday' && e.type !== 'event')
  const scheduleEvents = dayEvents.filter((e) => e.type === 'event')

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              {dateStr} ({weekday})
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {holiday && <span className="text-xs text-red-500 font-medium">{holiday}</span>}
              <p className="text-xs text-gray-400">업무 {total}개</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-6">
          {/* 공휴일 섹션 */}
          {(holiday || customHolidays.length > 0) && (
            <section>
              <h3 className="text-xs font-semibold text-red-400 uppercase mb-2">공휴일</h3>
              {holiday && (
                <div className="py-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm text-gray-800">{holiday}</p>
                  <p className="text-xs text-gray-400 mt-0.5">법정 공휴일</p>
                </div>
              )}
              {customHolidays.map((e) => (
                <div key={e.id} className="py-2 border-b border-gray-100 last:border-0 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{e.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">커스텀 공휴일</p>
                  </div>
                  <button onClick={() => onDeleteEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
                </div>
              ))}
            </section>
          )}

          {/* 일정 섹션 */}
          {scheduleEvents.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">일정</h3>
              {scheduleEvents.map((e) => (
                <div key={e.id} className="py-2 border-b border-gray-100 last:border-0 flex items-center justify-between">
                  <p className="text-sm text-gray-800">{e.name}</p>
                  <button onClick={() => onDeleteEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
                </div>
              ))}
            </section>
          )}

          {/* 연차 섹션 */}
          {leaveEvents.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">휴가</h3>
              {leaveEvents.map((e) => (
                <div key={e.id} className="py-2 border-b border-gray-100 last:border-0 flex items-center justify-between">
                  <p className="text-sm text-gray-800">{e.type}</p>
                  <button onClick={() => onDeleteEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
                </div>
              ))}
            </section>
          )}

          {created.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">생성된 업무</h3>
              {created.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-green-500 uppercase mb-2">완료된 업무</h3>
              {completed.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {passing.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">경유 중인 업무</h3>
              {passing.map((t) => <TaskRow key={t.id} task={t} columns={columns} />)}
            </section>
          )}

          {total === 0 && dayEvents.length === 0 && !holiday && (
            <p className="text-sm text-gray-400 text-center mt-8">이 날의 업무가 없습니다</p>
          )}

          {/* 빠른 추가 */}
          <section className="mt-auto pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">이 날에 추가</h3>
            <QuickAddEvent dateStr={dateStr} onAdd={onAddEvent} />
          </section>
        </div>
      </div>
    </div>
  )
}
