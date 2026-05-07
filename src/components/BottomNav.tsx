// 모바일 전용 하단 탭 네비게이션 (업무 / 캘린더)
// md 이상 화면에서는 숨김 (layout.tsx의 상단 nav 사용)
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/login') return null

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
      <Link
        href="/"
        className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
          pathname === '/' ? 'text-blue-500' : 'text-gray-400'
        }`}
      >
        <span className="text-xl">📋</span>
        <span>업무</span>
      </Link>
      <Link
        href="/calendar"
        className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
          pathname === '/calendar' ? 'text-blue-500' : 'text-gray-400'
        }`}
      >
        <span className="text-xl">📅</span>
        <span>캘린더</span>
      </Link>
      <button
        onClick={handleLogout}
        className="flex-1 flex flex-col items-center py-3 text-xs gap-1 text-gray-400 transition-colors"
      >
        <span className="text-xl">🚪</span>
        <span>로그아웃</span>
      </button>
    </nav>
  )
}
