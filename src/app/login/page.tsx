'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜드 영역 */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-slate-800 p-12">
        <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="" className="h-10 w-10" />
            <span className="text-2xl font-bold text-white tracking-tight">CarryOn</span>
          </div>
        <p className="text-slate-400 text-xs">할 일을 끝까지 가져가세요.</p>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-sm">
          {/* 모바일 로고 */}
          <div className="md:hidden mb-10 flex justify-center">
            <div className="flex items-center gap-2">
                <img src="/icon.svg" alt="" className="h-9 w-9" />
                <span className="text-2xl font-bold text-slate-800 tracking-tight">CarryOn</span>
              </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-1">로그인</h2>
          <p className="text-sm text-gray-400 mb-8">계속하려면 로그인하세요.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all shadow-sm"
                placeholder="name@example.com"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-slate-800 text-white rounded-xl py-3 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
