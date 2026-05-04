// 캘린더 뷰에 필요한 날짜 계산 유틸리티
// 날짜별 업무 분류(생성/완료/경유), 월별 날짜 배열 생성
import type { Task } from './types'

export function toDateString(isoString: string): string {
  return isoString.slice(0, 10)
}

export interface DayTasks {
  created: Task[]
  completed: Task[]
  passing: Task[]
}

export function getTasksForDate(tasks: Task[], dateStr: string): DayTasks {
  const created: Task[] = []
  const completed: Task[] = []
  const passing: Task[] = []

  for (const task of tasks) {
    const createdDate = toDateString(task.createdAt)
    const completedDate = task.completedAt ? toDateString(task.completedAt) : null

    if (createdDate === dateStr) {
      created.push(task)
    } else if (completedDate === dateStr) {
      completed.push(task)
    } else if (
      createdDate < dateStr &&
      (completedDate === null || completedDate > dateStr)
    ) {
      passing.push(task)
    }
  }

  return { created, completed, passing }
}

export function getTaskCountForDate(tasks: Task[], dateStr: string): number {
  const { created, completed, passing } = getTasksForDate(tasks, dateStr)
  return created.length + completed.length + passing.length
}

// month는 0-indexed (0 = 1월, 4 = 5월)
export function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay() // 0 = 일요일

  const days: (Date | null)[] = []

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null)
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  return days
}
