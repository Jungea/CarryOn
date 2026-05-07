'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import LogoutButton from './LogoutButton'

export default function TopNav() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
  }, [])

  if (pathname === '/login') return null

  return (
    <header className="hidden md:flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      <Link href="/" className="text-lg font-bold text-blue-500">CarryOn</Link>
      <Link href="/" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">업무</Link>
      <Link href="/calendar" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">캘린더</Link>
      <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
        <span>{today}</span>
        {email && <span>{email}</span>}
        <LogoutButton />
      </div>
    </header>
  )
}
