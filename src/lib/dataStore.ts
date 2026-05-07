// 서버 전용: Supabase에서 데이터 읽기
// API Route Handler 및 Server Component에서 사용
import { supabase } from './supabase'
import type { Task, Column, CalendarEvent } from './types'

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-1', name: '미분류', order: 0, isCompletedColumn: false },
  { id: 'col-2', name: '금일작업필수', order: 1, isCompletedColumn: false },
  { id: 'col-3', name: '진행중', order: 2, isCompletedColumn: false },
  { id: 'col-4', name: '완료', order: 3, isCompletedColumn: true },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTask(row: any): Task {
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
function toColumn(row: any): Column {
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    isCompletedColumn: row.is_completed_column,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCalendarEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    name: row.name ?? undefined,
    createdAt: row.created_at,
  }
}

export async function readTasks(): Promise<Task[]> {
  const { data } = await supabase.from('tasks').select('*').order('order')
  return (data ?? []).map(toTask)
}

export async function readColumns(): Promise<Column[]> {
  const { data } = await supabase.from('columns').select('*').order('order')
  if (!data || data.length === 0) {
    await supabase.from('columns').insert(DEFAULT_COLUMNS.map((c) => ({
      id: c.id, name: c.name, order: c.order, is_completed_column: c.isCompletedColumn,
    })))
    return DEFAULT_COLUMNS
  }
  return data.map(toColumn)
}

export async function readEvents(): Promise<CalendarEvent[]> {
  const { data } = await supabase.from('calendar_events').select('*').order('created_at')
  return (data ?? []).map(toCalendarEvent)
}

export { toTask, toColumn, toCalendarEvent }
