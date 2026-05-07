import CalendarClient from '@/components/CalendarClient'
import { readTasks, readColumns, readEvents } from '@/lib/dataStore'

export default async function CalendarPage() {
  const [tasks, columns, events] = await Promise.all([
    readTasks(),
    readColumns(),
    readEvents(),
  ])

  return <CalendarClient initialTasks={tasks} initialColumns={columns} initialEvents={events} />
}
