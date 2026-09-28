import { ReactNode } from 'react'
import { SiteShell } from '@seoul-dengoku/shared-web-ui'
import SidebarNavigation from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      site="wiki"
      theme="light"
      brand={
        <>
          서울<span className="text-sidebar-active">:전국</span>
          <span className="wiki-brand-sub">공식 위키</span>
        </>
      }
      homeHref="/wiki/"
      navigation={<SidebarNavigation />}
      navLabel="주요 표면과 문서 분류"
      menuLabel="전체 메뉴"
      skipLabel="본문으로 건너뛰기"
    >
      {children}
    </SiteShell>
  )
}
