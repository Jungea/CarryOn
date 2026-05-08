// 앱 전체 레이아웃: 상단 데스크톱 네비, 하단 모바일 탭바 포함
import type { Metadata } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import TopNav from '@/components/TopNav'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'CarryOn',
  description: '할 일을 끝까지 가져가세요.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CarryOn',
  },
  openGraph: {
    title: 'CarryOn',
    description: '할 일을 끝까지 가져가세요.',
    url: 'https://carryon.kro.kr',
    siteName: 'CarryOn',
    images: [{ url: 'https://carryon.kro.kr/icon.png', width: 512, height: 512 }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'CarryOn',
    description: '할 일을 끝까지 가져가세요.',
    images: ['https://carryon.kro.kr/icon.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        <ServiceWorkerRegister />
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
