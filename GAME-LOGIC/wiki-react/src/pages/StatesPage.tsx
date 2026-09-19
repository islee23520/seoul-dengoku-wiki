import { Link } from 'react-router-dom'
import NavBox from '../components/NavBox'
import SortableTable from '../components/SortableTable'
import { stateCatalog } from '../generated/stateCatalog'
import { stateRoute } from '../wikiRouting'

const stateRows = stateCatalog.map((state) => [
  { text: state.name, link: stateRoute(state.slug) },
  state.origin.match(/중심 ([^.)]+)/)?.[1] ?? state.origin,
  state.government,
  { text: state.power.startsWith('강국') ? '강국' : '약소', badge: state.power.startsWith('강국') ? 'power' as const : 'weak' as const },
  state.ruler,
])

const links = Object.fromEntries(stateCatalog.map((state) => [state.name, stateRoute(state.slug)]))
const navBox = {
  title: '서울 십육국 둘러보기',
  groups: [
    { label: '서부', links: ['급수계약정', '규격동맹'].map((label) => ({ label, to: links[label] })) },
    { label: '중앙', links: ['대한민국정부', '선로후계정', '전국경제인연합회'].map((label) => ({ label, to: links[label] })) },
    { label: '동부', links: ['호위보호정', '중립호송시', '의약중립맹', '관문군정'].map((label) => ({ label, to: links[label] })) },
    { label: '동남', links: ['삼성그룹', '현대자동차주식회사', '대한예수교장로회', '천주교 서울대교구', '대한불교조계종', '원불교', '전국민주노동조합총연맹'].map((label) => ({ label, to: links[label] })) },
  ],
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
