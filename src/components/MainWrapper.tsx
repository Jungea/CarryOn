'use client'

import { usePathname } from 'next/navigation'

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  return (
    <main className={`flex-1 flex flex-col overflow-hidden ${isLogin ? '' : 'pb-16 md:pb-0'}`}>
      {children}
    </main>
  )
}
