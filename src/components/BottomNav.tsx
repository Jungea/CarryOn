'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

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
    </nav>
  )
}
