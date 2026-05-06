// 월간 캘린더 그리드 (날짜별 업무 수 표시, 날짜 클릭 시 DaySidePanel 오픈)
// 이전/다음 달 이동 가능
'use client'

import { useState } from 'react'
import { getCalendarDays, getTasksForDate, toDateString } from '@/lib/calendarUtils'
import { getHolidayName } from '@/lib/holidays'
import type { Task } from '@/lib/types'

interface CalendarViewProps {
  tasks: Task[]
  onDayClick: (dateStr: string) => void
  selectedDate: string | null
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarView({ tasks, onDayClick, selectedDate }: CalendarViewProps) {
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
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors">‹</button>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
          {year}년 {month + 1}월
        </h2>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg transition-colors">›</button>
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

          const MAX = 3 // 카테고리별 표시 개수

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                flex flex-col items-start p-1.5 rounded-lg min-h-20 sm:min-h-32 transition-colors w-full
                ${isSelected
                  ? 'bg-blue-500 text-white'
                  : isToday
                  ? 'bg-blue-50 border border-blue-200'
                  : isSunday || isSaturday
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'hover:bg-gray-100'}
              `}
            >
              <span
                className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday && !isSelected ? 'bg-blue-500 text-white' : ''}
                  ${isSelected ? 'text-white' : isSunday || holiday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}
                `}
              >
                {date.getDate()}
              </span>

              {holiday && (
                <>
                  <span className={`hidden sm:block w-full truncate text-[10px] px-0.5 leading-tight font-medium
                    ${isSelected ? 'text-red-200' : 'text-red-500'}`}>
                    {holiday}
                  </span>
                  <span className={`sm:hidden w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-300' : 'bg-red-500'}`} />
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
                    <span className={`text-[10px] px-1 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
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
