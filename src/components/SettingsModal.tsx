'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { X, LogOut, RotateCcw } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
  }, [])

  async function handleLogout() {
    onClose()
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleReset() {
    if (!confirm('정말로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setResetting(true)
    await fetch('/api/reset', { method: 'POST' })
    window.location.href = '/'
  }

  const canReset = emailInput === email && email !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">설정</h2>
            {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} className="text-gray-400" />
            로그아웃
          </button>

          <div className="border-t border-gray-100 my-1" />

          <div className="px-4 flex flex-col gap-2">
            <p className="text-sm text-red-500 font-medium flex items-center gap-2">
              <RotateCcw size={14} /> 전체 초기화
            </p>
            <p className="text-xs text-gray-400">모든 태스크와 컬럼이 삭제됩니다. 확인을 위해 이메일을 입력하세요.</p>
            <input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={email}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button
              onClick={handleReset}
              disabled={!canReset || resetting}
              className="py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-30"
            >
              {resetting ? '초기화 중...' : '초기화'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
