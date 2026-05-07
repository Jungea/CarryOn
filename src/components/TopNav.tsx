'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import LogoutButton from './LogoutButton'
import { getTasks, getColumns } from '@/lib/taskStore'
import type { Task, Column } from '@/lib/types'
import { X } from 'lucide-react'

export default function TopNav() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const todayLabel = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

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
      <header className="hidden md:flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-6 w-6" />
          <span className="text-lg font-bold text-slate-700">CarryOn</span>
        </Link>
        <Link href="/" className="text-sm text-gray-600 hover:text-slate-700 transition-colors">업무</Link>
        <Link href="/calendar" className="text-sm text-gray-600 hover:text-slate-700 transition-colors">캘린더</Link>
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
          <span>{todayLabel}</span>
          {email && <span>{email}</span>}
          {todayDueTasks.length > 0 && (
            <button
              onClick={() => setShowPanel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs hover:bg-orange-600 transition-colors"
            >
              오늘 마감 <span className="font-bold">{todayDueTasks.length}</span>
            </button>
          )}
          <LogoutButton />
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
                      <div
                        key={task.id}
                        className="w-full py-2.5 px-3 mb-1 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <p className="text-sm text-gray-800 font-medium">{task.title}</p>
                        {task.memo && <p className="text-xs text-gray-400 mt-0.5 truncate">{task.memo}</p>}
                      </div>
                    ))}
                  </section>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
