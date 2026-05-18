// 모바일 전용 하단 탭 네비게이션 (업무 / 캘린더)
// md 이상 화면에서는 숨김 (layout.tsx의 상단 nav 사용)
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react'
import SettingsModal from './SettingsModal'

export default function BottomNav() {
  const pathname = usePathname()
  const [showSettings, setShowSettings] = useState(false)

  if (pathname === '/login') return null

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
            pathname === '/' ? 'text-slate-700' : 'text-gray-400'
          }`}
        >
          <CalendarDays size={20} />
          <span>캘린더</span>
        </Link>
        <Link
          href="/tasks"
          className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
            pathname === '/tasks' ? 'text-slate-700' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard size={20} />
          <span>태스크</span>
        </Link>
        <button
          onClick={() => setShowSettings(true)}
          className="flex-1 flex flex-col items-center py-3 text-xs gap-1 text-gray-400 transition-colors"
        >
          <Settings size={20} />
          <span>설정</span>
        </button>
      </nav>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
