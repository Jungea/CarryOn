// 서버 전용: Supabase에서 데이터 읽기
// API Route Handler 및 Server Component에서 사용
import { createSupabaseServerClient } from './supabase-server'
import type { Task, Column, CalendarEvent } from './types'

export const DEFAULT_COLUMN_ROWS = [
  { name: '할 일', order: 0, is_completed_column: false, filter_type: null, filter_days: null },
  { name: '오늘 마감', order: 1, is_completed_column: false, filter_type: 'dueDate', filter_days: 1 },
  { name: '진행 중', order: 2, is_completed_column: false, filter_type: null, filter_days: null },
  { name: '최근 완료', order: 3, is_completed_column: false, filter_type: 'completedAt', filter_days: 7 },
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
    filterType: row.filter_type ?? null,
    filterDays: row.filter_days ?? null,
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
  const now = new Date().toISOString()
  const { data } = await supabase.from('tasks').select('*').lte('created_at', now).order('order')
  return (data ?? []).map(toTask)
}

export async function readAllTasks(): Promise<Task[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('tasks').select('*').order('order')
  return (data ?? []).map(toTask)
}

export async function readColumns(): Promise<Column[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('columns').select('*').order('order')
  return (data ?? []).map(toColumn)
}

export async function readEvents(): Promise<CalendarEvent[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('calendar_events').select('*').order('created_at')
  return (data ?? []).map(toCalendarEvent)
}
