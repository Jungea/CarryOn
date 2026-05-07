// 월간 캘린더 그리드 (날짜별 업무 수 표시, 날짜 클릭 시 DaySidePanel 오픈)
// 이전/다음 달 이동 가능
'use client'

import { useState } from 'react'
import { getCalendarDays, getTasksForDate, toDateString } from '@/lib/calendarUtils'
import { getHolidayName } from '@/lib/holidays'
import type { Task, CalendarEvent } from '@/lib/types'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'

interface CalendarViewProps {
  tasks: Task[]
  events: CalendarEvent[]
  onDayClick: (dateStr: string) => void
  selectedDate: string | null
  onSettingsClick: () => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarView({ tasks, events, onDayClick, selectedDate, onSettingsClick }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const days = getCalendarDays(year, month)
  const todayStr = toDateString(today.toISOString())

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors"><ChevronLeft size={16} /></button>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
          {year}년 {month + 1}월
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors"><ChevronRight size={16} /></button>
          <button onClick={onSettingsClick} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors text-base" title="설정"><Settings size={16} /></button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`null-${i}`} />

          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const { created, completed, passing } = getTasksForDate(tasks, dateStr)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const isSunday = date.getDay() === 0
          const isSaturday = date.getDay() === 6

          const holiday = getHolidayName(dateStr)
          const dayEvents = events.filter((e) => e.date === dateStr)
          const customHoliday = dayEvents.find((e) => e.type === 'holiday')
          const leaveEvents = dayEvents.filter((e) => e.type !== 'holiday' && e.type !== 'event')
          const scheduleEvents = dayEvents.filter((e) => e.type === 'event')
          const effectiveHoliday = holiday ?? customHoliday?.name ?? null
          const isHolidayDay = !!effectiveHoliday

          const MAX = 3 // 카테고리별 표시 개수

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                flex flex-col items-start p-1.5 rounded-lg min-h-20 sm:min-h-32 transition-colors w-full
                ${isSelected
                  ? 'bg-slate-700 text-white'
                  : isToday
                  ? 'bg-slate-50 border border-slate-300'
                  : isSunday || isSaturday
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'hover:bg-gray-100'}
              `}
            >
              <span
                className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday && !isSelected ? 'bg-slate-700 text-white' : ''}
                  ${isSelected ? 'text-white' : isSunday || isHolidayDay ? 'text-red-500' : isSaturday ? 'text-slate-500' : 'text-gray-700'}
                `}
              >
                {date.getDate()}
              </span>

              {effectiveHoliday && (
                <>
                  <span className={`hidden sm:block w-full truncate text-[10px] px-0.5 leading-tight font-medium
                    ${isSelected ? 'text-red-200' : 'text-red-500'}`}>
                    {effectiveHoliday}
                  </span>
                  <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />
                </>
              )}

              {scheduleEvents.length > 0 && (
                <>
                  {scheduleEvents.slice(0, 2).map((e) => (
                    <span key={e.id} className={`hidden sm:block w-full truncate text-[10px] px-0.5 leading-tight font-medium
                      ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                      {e.name}
                    </span>
                  ))}
                  {scheduleEvents.length > 2 && (
                    <span className={`hidden sm:block text-[10px] px-0.5 ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                      +{scheduleEvents.length - 2}
                    </span>
                  )}
                  <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-gray-400'}`} />
                </>
              )}

              {leaveEvents.length > 0 && (
                <>
                  <span className={`hidden sm:block w-full truncate text-[10px] px-0.5 leading-tight font-medium
                    ${isSelected ? 'text-amber-200' : 'text-amber-500'}`}>
                    {leaveEvents[0].type}{leaveEvents.length > 1 ? ` 외 ${leaveEvents.length - 1}` : ''}
                  </span>
                  <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-400'}`} />
                </>
              )}

              <div className="w-full flex flex-col gap-0.5 mt-0.5">
                {/* 모바일: 카운트 뱃지만 */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {created.length > 0 && (
                    <span className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-medium
                      ${isSelected ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                      {created.length}
                    </span>
                  )}
                  {completed.length > 0 && (
                    <span className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-medium
                      ${isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                      {completed.length}
                    </span>
                  )}
                  {passing.length > 0 && (
                    <span className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-medium
                      ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {passing.length}
                    </span>
                  )}
                </div>

                {/* 데스크탑: 제목 pill + 초과 */}
                <div className="hidden sm:flex flex-col gap-0.5">
                  {created.length > 0 && (
                    <>
                      {created.slice(0, MAX).map((t) => (
                        <span key={t.id} className={`w-full truncate text-[10px] px-1.5 py-0.5 rounded-full leading-tight
                          ${isSelected ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                          {t.title}
                        </span>
                      ))}
                      {created.length > MAX && (
                        <span className={`text-[10px] px-1 ${isSelected ? 'text-violet-200' : 'text-violet-400'}`}>
                          +{created.length - MAX}
                        </span>
                      )}
                    </>
                  )}
                  {completed.length > 0 && (
                    <>
                      {completed.slice(0, MAX).map((t) => (
                        <span key={t.id} className={`w-full truncate text-[10px] px-1.5 py-0.5 rounded-full leading-tight
                          ${isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                          {t.title}
                        </span>
                      ))}
                      {completed.length > MAX && (
                        <span className={`text-[10px] px-1 ${isSelected ? 'text-green-200' : 'text-green-500'}`}>
                          +{completed.length - MAX}
                        </span>
                      )}
                    </>
                  )}
                  {passing.length > 0 && (
                    <span className={`text-[10px] px-1 ${isSelected ? 'text-slate-300' : 'text-gray-400'}`}>
                      경유 {passing.length}개
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
