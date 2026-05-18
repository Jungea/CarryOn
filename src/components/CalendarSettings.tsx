// 캘린더 설정 모달 (커스텀 공휴일 & 연차 관리)
'use client'

import { useState } from 'react'
import type { CalendarEvent, EventType } from '@/lib/types'
import { X } from 'lucide-react'

const LEAVE_TYPES: EventType[] = ['휴가', '오전반휴', '오후반휴', '오전반반휴', '오후반반휴']

interface CalendarSettingsProps {
  open: boolean
  events: CalendarEvent[]
  onClose: () => void
  onAddEvent: (data: { date: string; type: EventType; name?: string }) => Promise<void>
  onDeleteEvent: (id: string) => Promise<void>
}

export default function CalendarSettings({ open, events, onClose, onAddEvent, onDeleteEvent }: CalendarSettingsProps) {
  const [tab, setTab] = useState<'event' | 'holiday' | 'leave'>('event')
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [leaveType, setLeaveType] = useState<EventType>('휴가')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const schedules = events.filter((e) => e.type === 'event').sort((a, b) => a.date.localeCompare(b.date))
  const holidays = events.filter((e) => e.type === 'holiday').sort((a, b) => a.date.localeCompare(b.date))
  const leaves = events.filter((e) => e.type !== 'holiday' && e.type !== 'event').sort((a, b) => a.date.localeCompare(b.date))

  async function handleAdd() {
    if (!date) return
    if ((tab === 'holiday' || tab === 'event') && !name.trim()) return
    setSaving(true)
    await onAddEvent({
      date,
      type: tab === 'holiday' ? 'holiday' : tab === 'event' ? 'event' : leaveType,
      name: (tab === 'holiday' || tab === 'event') ? name.trim() : undefined,
    })
    setDate('')
    setName('')
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">캘린더 설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('event')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'event' ? 'text-gray-700 border-b-2 border-gray-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            일정
          </button>
          <button
            onClick={() => setTab('holiday')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'holiday' ? 'text-red-500 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            공휴일
          </button>
          <button
            onClick={() => setTab('leave')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'leave' ? 'text-amber-500 border-b-2 border-amber-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            휴가
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-1">
          {(tab === 'event' ? schedules : tab === 'holiday' ? holidays : leaves).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className="text-sm text-gray-800">{e.date}</span>
                <span className="ml-2 text-sm text-gray-500">{tab === 'leave' ? e.type : e.name}</span>
              </div>
              <button onClick={() => onDeleteEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xs px-1 transition-colors"><X size={14} /></button>
            </div>
          ))}
          {(tab === 'event' ? schedules : tab === 'holiday' ? holidays : leaves).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">등록된 항목이 없습니다</p>
          )}
        </div>

        {/* Add Form */}
        <div className="px-5 py-4 border-t border-gray-200 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {tab === 'holiday' || tab === 'event' ? (
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder={tab === 'event' ? '일정 이름' : '공휴일 이름'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                value={leaveType as string}
                onChange={(e) => setLeaveType(e.target.value as EventType)}
              >
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {saving ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}
