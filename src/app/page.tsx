import { readTasks, readColumns } from '@/lib/dataStore'
import TaskBoard from '@/components/TaskBoard'

export default async function BoardPage() {
  const [tasks, columns] = await Promise.all([readTasks(), readColumns()])

  return (
    <div className="flex flex-col h-full pt-2">
      <h1 className="px-4 text-xl font-bold text-gray-800 md:hidden mb-2">업무 목록</h1>
      <div className="flex-1 overflow-hidden">
        <TaskBoard initialTasks={tasks} initialColumns={columns} />
      </div>
    </div>
  )
}
