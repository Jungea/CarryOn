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

export interface Column {
  id: string
  name: string
  order: number                // 보드에서 좌→우 순서
  isCompletedColumn: boolean   // true이면 이 컬럼으로 이동 시 completedAt 기록
}
