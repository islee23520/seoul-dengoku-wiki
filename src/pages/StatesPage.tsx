import { Link } from 'react-router-dom'
import NavBox from '../components/NavBox'
import SortableTable from '../components/SortableTable'
import { stateCatalog } from '../generated/stateCatalog'
import { stateRoute } from '../wikiRouting'

const tierOf = (power: string): '강국' | '약국' | '소국' => {
  if (power.startsWith('강국')) return '강국'
  if (power.startsWith('약국')) return '약국'
  return '소국'
}

const tierBadge = { 강국: 'power', 약국: 'mid', 소국: 'weak' } as const

type StateCell = string | { text: string; link?: string; badge?: 'power' | 'mid' | 'weak' }

const stateRows: StateCell[][] = []
for (const state of stateCatalog) {
  const tier = tierOf(state.power)
  stateRows.push([
    { text: state.name, link: stateRoute(state.slug) },
    state.capital || state.origin,
    state.government,
    { text: tier, badge: tierBadge[tier] },
    state.ruler,
  ])
}

const tierGroups: { label: '강국' | '약국' | '소국'; links: { label: string; to: string }[] }[] = [
  { label: '강국', links: [] },
  { label: '약국', links: [] },
  { label: '소국', links: [] },
]
for (const state of stateCatalog) {
  tierGroups.find((group) => group.label === tierOf(state.power))?.links.push({ label: state.name, to: stateRoute(state.slug) })
}
const navBox = {
  title: '서울 십육국 둘러보기',
  groups: tierGroups.filter((group) => group.links.length > 0),
}

export default function StatesPage() {
  return (
    <div className="min-w-0">
      <div className="wiki-breadcrumbs"><Link to="/">대문</Link><span>›</span><strong>서울 십육국</strong></div>
      <div className="border-b-2 border-accent pb-3">
        <h1 className="text-2xl font-extrabold text-gray-800">서울 십육국 <span className="wiki-canon-badge">정본</span></h1>
        <p className="mt-1 text-sm text-gray-500">국명을 누르면 해당 국가의 기원·정부형태·국력·수장·형성 인과로 이동합니다.</p>
      </div>
      <div className="mt-4 min-w-0"><h2 className="mb-2 border-b-2 border-gray-200 pb-1.5 text-lg font-bold text-gray-700">십육국 표</h2><SortableTable headers={['국명', '중심역', '형태', '강국', '수장']} rows={stateRows} /></div>
      <NavBox {...navBox} />
    </div>
  )
}
