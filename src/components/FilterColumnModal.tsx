'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { FilterType } from '@/lib/types'

interface Props {
  onClose: () => void
  onCreate: (name: string, filterType: FilterType, filterDays: number) => Promise<void>
}

const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  dueDate: '마감일',
  createdAt: '생성일',
  completedAt: '완료일',
}

const DAY_PRESETS = [1, 3, 7, 14, 30]

export default function FilterColumnModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('dueDate')
  const [filterDays, setFilterDays] = useState(1)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || loading) return
    setLoading(true)
    await onCreate(name.trim(), filterType, filterDays)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">필터 컬럼 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">컬럼 이름</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 오늘 마감, 이번주 생성"
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">기준 날짜</label>
            <div className="flex gap-2">
              {(Object.keys(FILTER_TYPE_LABELS) as FilterType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                    filterType === type
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-slate-400'
                  }`}
                >
                  {FILTER_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">최근 N일</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFilterDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    filterDays === d
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-slate-400'
                  }`}
                >
                  {d === 1 ? '오늘' : `${d}일`}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            {FILTER_TYPE_LABELS[filterType]}이 {filterDays === 1 ? '오늘' : `최근 ${filterDays}일`}인 태스크를 표시합니다.
          </p>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="mt-1 bg-slate-800 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '생성 중...' : '필터 컬럼 만들기'}
          </button>
        </form>
      </div>
    </div>
  )
}
