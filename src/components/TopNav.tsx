'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Logo from './Logo'
import SettingsModal from './SettingsModal'
import TaskDetailModal from './TaskDetailModal'
import { getTasks, getColumns, updateTask, deleteTask } from '@/lib/taskStore'
import type { Task, Column } from '@/lib/types'
import { X, Settings } from 'lucide-react'

export default function TopNav() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [today, setToday] = useState('')
  const [todayLabel, setTodayLabel] = useState('')

  useEffect(() => {
    const now = new Date()
    setToday(now.toISOString().slice(0, 10))
    setTodayLabel(now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }))
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? '')
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (pathname === '/login') return
    Promise.all([getTasks(), getColumns()]).then(([t, c]) => {
      setTasks(t)
      setColumns(c)
    })
  }, [pathname])

  if (pathname === '/login') return null

  const todayDueTasks = tasks.filter((t) => t.dueDate === today && !t.completedAt)
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <>
      {/* 모바일 상단 로고 바 */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Link href="/"><Logo size={24} /></Link>
        {todayDueTasks.length > 0 && (
          <button
            onClick={() => setShowPanel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs hover:bg-orange-600 transition-colors"
          >
            오늘 마감 <span className="font-bold">{todayDueTasks.length}</span>
          </button>
        )}
      </header>

      <header className="hidden md:flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <Link href="/"><Logo size={28} /></Link>
        <Link href="/" className={`text-sm transition-colors ${pathname === '/' ? 'text-slate-800 font-semibold' : 'text-gray-400 hover:text-slate-700'}`}>캘린더</Link>
        <Link href="/tasks" className={`text-sm transition-colors ${pathname === '/tasks' ? 'text-slate-800 font-semibold' : 'text-gray-400 hover:text-slate-700'}`}>업무</Link>
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
          {todayDueTasks.length > 0 && (
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs hover:bg-orange-600 transition-colors"
            >
              오늘 마감 <span className="font-bold">{todayDueTasks.length}</span>
            </button>
          )}
          <span>{todayLabel}</span>
          {email && <span>{email}</span>}
          <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {showPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowPanel(false)}>
          <div
            className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800">오늘 마감</h2>
                <p className="text-xs text-gray-400 mt-0.5">{today} · {todayDueTasks.length}개</p>
              </div>
              <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="flex-1 px-4 py-4 flex flex-col gap-2">
              {sortedColumns.map((col) => {
                const colTasks = todayDueTasks.filter((t) => t.columnId === col.id)
                if (colTasks.length === 0) return null
                return (
                  <section key={col.id}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{col.name}</h3>
                    {colTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => { setEditingTask(task); setShowPanel(false) }}
                        className="w-full text-left py-2.5 px-3 mb-1 bg-gray-50 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                      >
                        <p className="text-sm text-gray-800 font-medium">{task.title}</p>
                        {task.memo && <p className="text-xs text-gray-400 mt-0.5 truncate">{task.memo}</p>}
                      </button>
                    ))}
                  </section>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <TaskDetailModal
        task={editingTask}
        columns={columns}
        onClose={() => setEditingTask(null)}
        onSave={async (id, data) => {
          await updateTask(id, data)
          const updated = await getTasks()
          setTasks(updated)
        }}
        onDelete={async (id) => {
          await deleteTask(id)
          setTasks((prev) => prev.filter((t) => t.id !== id))
          setEditingTask(null)
        }}
      />
    </>
  )
}
