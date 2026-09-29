import { Link, useLocation } from 'react-router-dom'
import { CategoryTree } from '@seoul-dengoku/shared-web-ui'
import { wikiLinks } from '../wikiLinks'
import { sharedCategories, wikiAnchorHref } from '../sharedCategories'

type SidebarItem = { label: string; to: string; spa?: boolean; ext?: boolean }

const sections: { title: string; items: SidebarItem[] }[] = [
  { title: '문서 안내', items: [
    { label: '정본 문서 전체', to: wikiLinks.documents, spa: true },
    { label: '분류', to: wikiLinks.categories, spa: true },
    { label: '개요', to: wikiLinks.overview, spa: true },
    { label: '프롤로그', to: wikiLinks.overview, spa: true },
  ]},
  { title: '주요 표면', items: [
    { label: '등장인물 전체', to: wikiLinks.characters, spa: true },
    { label: '본관 가문', to: wikiLinks.families, spa: true },
    { label: '서울 십육국', to: wikiLinks.states, spa: true },
    { label: '세계 지도', to: wikiLinks.subway, spa: true },
    { label: '갱신 이력', to: '/updates', spa: true },
  ]},
  { title: '도구', items: [
    { label: 'GitHub', to: 'https://github.com/islee23520/seoul-dengoku-wiki', ext: true },
  ]},
]

export default function SidebarNavigation() {
  const { pathname } = useLocation()
  return (
    <>
      {sections.map((section) => (
        <div key={section.title} className="wiki-nav-section">
          <h5>{section.title}</h5>
          {section.items.map((item) => item.ext ? (
            <a key={item.label} href={item.to} rel="noreferrer">{item.label}</a>
          ) : (
            <Link key={item.label} to={item.to}>{item.label}</Link>
          ))}
        </div>
      ))}
      <div className="wiki-nav-section wiki-nav-tree">
        <h5>문서 분류</h5>
        <CategoryTree items={sharedCategories} currentHref={pathname} emptyLabel="문서 없음" resolveHref={wikiAnchorHref} />
      </div>
    </>
  )
}
