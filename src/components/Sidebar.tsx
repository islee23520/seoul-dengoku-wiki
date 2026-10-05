import { Link, useLocation } from 'react-router-dom'
import { wikiLinks } from '../wikiLinks'
import { categoryHref } from '../sharedCategories'
import { categoryIndex, type WikiCategory } from '../generated/categoryIndex'

function CategoryBranch({ category, path, current }: { category: WikiCategory; path: string[]; current: string }) {
  const href = categoryHref(path)
  const contents = <>
    {category.children.map((child) => <CategoryBranch key={child.id} category={child} path={[...path, child.id]} current={current} />)}
    {category.entities.map((entity) => <Link key={entity.id} to={entity.route}>{entity.title}</Link>)}
    {category.children.length === 0 && category.entities.length === 0 ? category.documents.map((document) => <Link key={document.route} to={document.route}>{document.title}</Link>) : null}
  </>
  return <details open={current.startsWith(href)}><summary>{category.label}</summary><Link to={href}>전체 보기</Link><div style={{ paddingInlineStart: '1rem' }}>{contents}</div></details>
}

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
        {categoryIndex.categories.map((category) => <CategoryBranch key={category.id} category={category} path={[category.id]} current={pathname} />)}
      </div>
    </>
  )
}
