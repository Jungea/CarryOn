import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { readColumns, writeColumns } from '@/lib/dataStore'

export async function GET() {
  const columns = await readColumns()
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
