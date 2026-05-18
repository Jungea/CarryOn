// 앱 전체에서 공유하는 데이터 타입 정의
export interface Task {
  id: string
  title: string
  memo: string
  dueDate: string | null       // 'YYYY-MM-DD' 형식
  columnId: string
  createdAt: string            // ISO datetime (new Date().toISOString())
  completedAt: string | null   // ISO datetime, 미완료 시 null
  order: number                // 컬럼 내 정렬 순서 (낮을수록 위)
}

export type FilterType = 'dueDate' | 'createdAt' | 'completedAt'

export interface Column {
  id: string
  name: string
  order: number                // 보드에서 좌→우 순서
  isCompletedColumn: boolean   // true이면 이 컬럼으로 이동 시 completedAt 기록
  filterType?: FilterType | null
  filterDays?: number | null
}

export type LeaveType = '휴가' | '오전반휴' | '오후반휴' | '오전반반휴' | '오후반반휴'
export type EventType = 'holiday' | 'event' | LeaveType

export interface CalendarEvent {
  id: string
  date: string        // 'YYYY-MM-DD'
  type: EventType
  name?: string       // holiday 타입만 필수, 나머지는 type 이름 그대로 표시
  createdAt: string
}
