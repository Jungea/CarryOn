// GET   /api/columns     — 전체 컬럼 조회
// POST  /api/columns     — 새 컬럼 생성
// PATCH /api/columns     — 여러 컬럼 일괄 수정 (드래그 후 순서 저장용)
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readColumns, writeColumns } from '@/lib/dataStore'
import type { Column } from '@/lib/types'

export async function GET() {
  const columns = await readColumns()
  return NextResponse.json(columns)
}

export async function PATCH(request: Request) {
  const updates = await request.json() as Partial<Column>[]
  const columns = await readColumns()

  for (const update of updates) {
    const index = columns.findIndex((c) => c.id === update.id)
    if (index !== -1) columns[index] = { ...columns[index], ...update }
  }

  await writeColumns(columns)
  return NextResponse.json(columns)
}

export async function POST(request: Request) {
  const body = await request.json()
  const columns = await readColumns()

  const newColumn = {
    id: randomUUID(),
    name: String(body.name ?? '새 컬럼'),
    order: typeof body.order === 'number' ? body.order : columns.length,
    isCompletedColumn: Boolean(body.isCompletedColumn ?? false),
  }

  columns.push(newColumn)
  await writeColumns(columns)
  return NextResponse.json(newColumn, { status: 201 })
}
