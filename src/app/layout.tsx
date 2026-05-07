// 앱 전체 레이아웃: 상단 데스크톱 네비, 하단 모바일 탭바 포함
import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import TopNav from '@/components/TopNav'

export const metadata: Metadata = {
  title: 'CarryOn',
  description: '개인 업무 관리',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        <TopNav />

        {/* Main content */}
        <main className="flex-1 flex flex-col pb-16 md:pb-0 overflow-hidden">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  )
}
