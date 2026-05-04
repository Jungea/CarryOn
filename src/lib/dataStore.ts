// 서버 전용: data/tasks.json, data/columns.json 파일 읽기/쓰기
// API Route Handler에서만 사용 (클라이언트에서 직접 import 금지)
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { Task, Column } from './types'

const DATA_DIR = join(process.cwd(), 'data')
const TASKS_FILE = join(DATA_DIR, 'tasks.json')
const COLUMNS_FILE = join(DATA_DIR, 'columns.json')

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-1', name: '미분류', order: 0, isCompletedColumn: false },
  { id: 'col-2', name: '금일작업필수', order: 1, isCompletedColumn: false },
  { id: 'col-3', name: '진행중', order: 2, isCompletedColumn: false },
  { id: 'col-4', name: '완료', order: 3, isCompletedColumn: true },
]

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

export async function readTasks(): Promise<Task[]> {
  try {
    const content = await readFile(TASKS_FILE, 'utf-8')
    return JSON.parse(content) as Task[]
  } catch {
    return []
  }
}

export async function writeTasks(tasks: Task[]): Promise<void> {
  await ensureDir()
  await writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8')
}

export async function readColumns(): Promise<Column[]> {
  try {
    const content = await readFile(COLUMNS_FILE, 'utf-8')
    return JSON.parse(content) as Column[]
  } catch {
    return DEFAULT_COLUMNS
  }
}

export async function writeColumns(columns: Column[]): Promise<void> {
  await ensureDir()
  await writeFile(COLUMNS_FILE, JSON.stringify(columns, null, 2), 'utf-8')
}
