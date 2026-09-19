import { Link, useLocation } from 'react-router-dom'
import { wikiLinks } from '../wikiLinks'

type SidebarItem = { label: string; to: string; spa?: boolean; ext?: boolean }

const sections: { title: string; items: SidebarItem[] }[] = [
  { title: '문서 안내', items: [
    { label: '개요', to: wikiLinks.overview, spa: true },
    { label: '기동권 이탈', to: wikiLinks.overview, spa: true },
    { label: '온라인 유저 여정', to: wikiLinks.onlineJourney, spa: true },
  ]},
  { title: '세계관', items: [
    { label: '서울 십육국', to: wikiLinks.states, spa: true },
    { label: '연표', to: wikiLinks.timeline, spa: true },
    { label: '관직', to: wikiLinks.offices, spa: true },
    { label: '가문', to: wikiLinks.houses, spa: true },
    { label: '등장인물', to: wikiLinks.characters, spa: true },
    { label: '신앙과 풍속', to: wikiLinks.faith, spa: true },
    { label: '기술과 무구', to: wikiLinks.technology, spa: true },
  ]},
  { title: '지리', items: [
    { label: '지하철 레이어', to: wikiLinks.subway, spa: true },
    { label: '역 카탈로그', to: wikiLinks.stations, spa: true },
  ]},
  { title: '도구', items: [
    { label: 'GitHub', to: 'https://github.com/islee23520/seoul-kenshi', ext: true },
  ]},
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const renderSection = (sec: typeof sections[number]) => (
    <div key={sec.title} className="md:mt-2">
      <h5 className="px-4 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-600">
        {sec.title}
      </h5>
      {sec.items.map(item => {
        const className = `block border-l-3 px-4 py-1.5 pl-6 text-sm transition-colors ${
          pathname === item.to
            ? 'border-sidebar-active bg-sidebar-hover font-semibold text-white'
            : 'border-transparent text-sidebar-text hover:border-sidebar-active hover:bg-sidebar-hover hover:text-white'
        }`
        return item.ext ? (
          <a key={item.label} href={item.to} className={className} rel="noreferrer">
            {item.label}
          </a>
        ) : item.spa ? (
          <Link key={item.label} to={item.to} className={className}>
            {item.label}
          </Link>
        ) : (
          <a key={item.label} href={item.to} className={className}>
            {item.label}
          </a>
        )
      })}
    </div>
  )

  return (
    <nav className="relative z-50 w-full bg-sidebar-bg md:fixed md:bottom-0 md:left-0 md:top-0 md:w-[220px] md:overflow-y-auto">
      <div className="border-b border-gray-700 px-4 py-4 md:py-5">
        <Link to="/" className="text-xl font-bold text-white">
          서울<span className="text-sidebar-active">:전국</span>
        </Link>
        <div className="mt-1 text-xs text-gray-500">공식 위키</div>
      </div>
      <details className="border-b border-gray-700 md:hidden">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-sidebar-text">전체 메뉴</summary>
        <div className="grid grid-cols-2 gap-x-2 px-2 pb-3">
          {sections.map(renderSection)}
        </div>
      </details>
      <div className="hidden md:block">
        {sections.map(renderSection)}
      </div>
    </nav>
  )
}
