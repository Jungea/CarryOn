'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const STORAGE_KEY = 'carryon_recent_accounts'

interface Account { email: string; password: string }

function loadAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function saveAccount(email: string, password: string) {
  const list = loadAccounts().filter((a) => a.email !== email)
  list.unshift({ email, password })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 5)))
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentAccounts, setRecentAccounts] = useState<Account[]>([])
  const router = useRouter()

  useEffect(() => { setRecentAccounts(loadAccounts()) }, [])

  const [setupLoading, setSetupLoading] = useState(false)

  async function login(e: string, p: string) {
    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p })
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }
    saveAccount(e, p)
    setLoading(false)
    setSetupLoading(true)
    await fetch('/api/setup', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  async function signup() {
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    saveAccount(email, password)
    setLoading(false)
    setSetupLoading(true)
    await fetch('/api/setup', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setError('')
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {setupLoading && (
        <div className="fixed inset-0 z-50 bg-black/40 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white text-sm font-medium">준비 중...</p>
        </div>
      )}
      <div className="flex-1 flex items-end justify-center pb-8">
        <img src="/icon.svg" alt="CarryOn" className="w-16 h-16" />
      </div>

      <div className="w-full max-w-sm mx-auto px-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">{mode === 'login' ? '로그인' : '회원가입'}</h2>
        <p className="text-sm text-gray-400 mb-8">{mode === 'login' ? '계속하려면 로그인하세요.' : '새 계정을 만드세요.'}</p>

        <form onSubmit={(e) => { e.preventDefault(); mode === 'login' ? login(email, password) : signup() }} className="flex flex-col gap-5">
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

          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all shadow-sm"
                placeholder="••••••••"
                required
              />
            </div>
          )}

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
            {loading ? (mode === 'login' ? '로그인 중...' : '가입 중...') : (mode === 'login' ? '로그인' : '회원가입')}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          {mode === 'login' ? (
            <>계정이 없으신가요? <button onClick={() => switchMode('signup')} className="text-slate-600 font-medium hover:underline">회원가입</button></>
          ) : (
            <>이미 계정이 있으신가요? <button onClick={() => switchMode('login')} className="text-slate-600 font-medium hover:underline">로그인</button></>
          )}
        </p>
      </div>

      {mode === 'login' && recentAccounts.length > 0 && (
        <div className="w-full max-w-sm mx-auto px-8 mt-6">
          <p className="text-xs text-gray-400 mb-2">최근 로그인</p>
          <div className="flex flex-col gap-1.5">
            {recentAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => login(account.email, account.password)}
                disabled={loading}
                className="w-full text-left px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-slate-400 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {account.email}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />
    </div>
  )
}
