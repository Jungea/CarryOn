import type { Task, Column } from './types'

// ── Tasks ─────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

export async function createTask(
  data: Pick<Task, 'title' | 'columnId' | 'order'> & Partial<Pick<Task, 'memo' | 'dueDate'>>
): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete task')
}

// ── Columns ────────────────────────────────────────────

export async function getColumns(): Promise<Column[]> {
  const res = await fetch('/api/columns')
  if (!res.ok) throw new Error('Failed to fetch columns')
  return res.json()
}

export async function createColumn(
  data: Pick<Column, 'name' | 'order' | 'isCompletedColumn'>
): Promise<Column> {
  const res = await fetch('/api/columns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create column')
  return res.json()
}

export async function updateColumn(id: string, data: Partial<Column>): Promise<Column> {
  const res = await fetch(`/api/columns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update column')
  return res.json()
}

export async function deleteColumn(id: string): Promise<void> {
  const res = await fetch(`/api/columns/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete column')
}
