// 앱 전체 레이아웃: 상단 데스크톱 네비, 하단 모바일 탭바 포함
import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CarryOn',
  description: '개인 업무 관리',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        {/* Desktop top nav */}
        <header className="hidden md:flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <span className="text-lg font-bold text-blue-500">CarryOn</span>
          <Link href="/" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">업무</Link>
          <Link href="/calendar" className="text-sm text-gray-600 hover:text-blue-500 transition-colors">캘린더</Link>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col pb-16 md:pb-0 overflow-hidden">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  )
}
