// 서버 전용: Supabase에서 데이터 읽기
// API Route Handler 및 Server Component에서 사용
import { createSupabaseServerClient } from './supabase-server'
import type { Task, Column, CalendarEvent } from './types'

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-1', name: '미분류', order: 0, isCompletedColumn: false },
  { id: 'col-2', name: '금일작업필수', order: 1, isCompletedColumn: false },
  { id: 'col-3', name: '진행중', order: 2, isCompletedColumn: false },
  { id: 'col-4', name: '완료', order: 3, isCompletedColumn: true },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    memo: row.memo ?? '',
    columnId: row.column_id,
    order: row.order,
    dueDate: row.due_date ?? null,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toColumn(row: any): Column {
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    isCompletedColumn: row.is_completed_column,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCalendarEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    name: row.name ?? undefined,
    createdAt: row.created_at,
  }
}

export async function readTasks(): Promise<Task[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('tasks').select('*').order('order')
  return (data ?? []).map(toTask)
}

export async function readColumns(): Promise<Column[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('columns').select('*').order('order')
  if (!data || data.length === 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('columns').insert(DEFAULT_COLUMNS.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        order: c.order,
        is_completed_column: c.isCompletedColumn,
        user_id: user.id,
      })))
      const { data: fresh } = await supabase.from('columns').select('*').order('order')
      return (fresh ?? []).map(toColumn)
    }
    return DEFAULT_COLUMNS
  }
  return data.map(toColumn)
}

export async function readEvents(): Promise<CalendarEvent[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('calendar_events').select('*').order('created_at')
  return (data ?? []).map(toCalendarEvent)
}
