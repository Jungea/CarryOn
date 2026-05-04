import {
  toDateString,
  getTasksForDate,
  getTaskCountForDate,
  getCalendarDays,
} from '@/lib/calendarUtils'
import type { Task } from '@/lib/types'

const baseTask: Task = {
  id: '1',
  title: 'Test task',
  memo: '',
  dueDate: null,
  columnId: 'col-1',
  createdAt: '2026-05-01T09:00:00.000Z',
  completedAt: null,
  order: 0,
}

describe('toDateString', () => {
  it('ISO datetime에서 날짜 부분만 추출', () => {
    expect(toDateString('2026-05-04T12:30:00.000Z')).toBe('2026-05-04')
  })
})

describe('getTasksForDate', () => {
  it('생성일과 같은 날이면 created에 포함', () => {
    const result = getTasksForDate([baseTask], '2026-05-01')
    expect(result.created).toHaveLength(1)
    expect(result.completed).toHaveLength(0)
    expect(result.passing).toHaveLength(0)
  })

  it('완료일과 같은 날이면 completed에 포함', () => {
    const task = { ...baseTask, completedAt: '2026-05-03T15:00:00.000Z' }
    const result = getTasksForDate([task], '2026-05-03')
    expect(result.completed).toHaveLength(1)
    expect(result.created).toHaveLength(0)
    expect(result.passing).toHaveLength(0)
  })

  it('생성일과 완료일 사이 날짜면 passing에 포함', () => {
    const task = { ...baseTask, completedAt: '2026-05-05T15:00:00.000Z' }
    const result = getTasksForDate([task], '2026-05-03')
    expect(result.passing).toHaveLength(1)
  })

  it('미완료 업무는 생성일 이후 오늘까지 passing', () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = getTasksForDate([baseTask], today)
    expect(result.passing).toHaveLength(1)
  })

  it('미완료 업무는 오늘 이후 미래 날짜에는 passing 안 됨', () => {
    const result = getTasksForDate([baseTask], '2099-12-31')
    expect(result.passing).toHaveLength(0)
  })

  it('생성일 이전 날짜에는 포함되지 않음', () => {
    const result = getTasksForDate([baseTask], '2026-04-30')
    expect(result.created).toHaveLength(0)
    expect(result.completed).toHaveLength(0)
    expect(result.passing).toHaveLength(0)
  })
})

describe('getTaskCountForDate', () => {
  it('created + completed + passing 합계 반환', () => {
    const task1 = { ...baseTask, id: '1' }
    const task2 = { ...baseTask, id: '2', createdAt: '2026-05-02T09:00:00.000Z', completedAt: '2026-05-03T10:00:00.000Z' }
    expect(getTaskCountForDate([task1, task2], '2026-05-03')).toBe(2)
  })
})

describe('getCalendarDays', () => {
  it('2026년 5월은 31일', () => {
    const days = getCalendarDays(2026, 4)
    const actual = days.filter((d) => d !== null)
    expect(actual).toHaveLength(31)
  })

  it('2026년 5월 1일은 금요일(5)이므로 앞에 null 5개', () => {
    const days = getCalendarDays(2026, 4)
    const firstNonNull = days.findIndex((d) => d !== null)
    expect(firstNonNull).toBe(5)
  })

  it('2월 윤년 처리 (2024년 2월 = 29일)', () => {
    const days = getCalendarDays(2024, 1)
    const actual = days.filter((d) => d !== null)
    expect(actual).toHaveLength(29)
  })
})
