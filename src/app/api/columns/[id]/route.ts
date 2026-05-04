import { NextResponse } from 'next/server'
import { readColumns, writeColumns } from '@/lib/dataStore'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const columns = await readColumns()
  const index = columns.findIndex((c) => c.id === id)

  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  columns[index] = { ...columns[index], ...body }
  await writeColumns(columns)
  return NextResponse.json(columns[index])
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const columns = await readColumns()
  await writeColumns(columns.filter((c) => c.id !== id))
  return new NextResponse(null, { status: 204 })
}
