import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <a href="#main-content" className="wiki-skip-link">본문으로 건너뛰기</a>
      <Sidebar />
      <main id="main-content" className="min-w-0 flex-1 md:ml-[220px]">
        <div className="mx-auto min-w-0 max-w-[1200px] px-4 py-5 sm:px-6 md:px-8">{children}</div>
      </main>
    </div>
  )
}
