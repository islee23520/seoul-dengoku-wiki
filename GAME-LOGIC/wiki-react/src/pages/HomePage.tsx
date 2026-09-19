import { Link } from 'react-router-dom'
import { wikiLinks } from '../wikiLinks'

type PanelItem = { label: string; to: string; spa?: boolean }

const panels: { title: string; items: PanelItem[] }[] = [
  { title: '세계관', items: [
    { label: '정본 문서 전체', to: wikiLinks.documents, spa: true },
    { label: '서울 십육국', to: wikiLinks.states, spa: true },
    { label: '기동권 이탈', to: wikiLinks.overview, spa: true },
    { label: '연표', to: wikiLinks.timeline, spa: true },
    { label: '사람과 기체', to: wikiLinks.peopleAndMachines, spa: true },
    { label: '질병과 증상', to: wikiLinks.ailments, spa: true },
  ]},
  { title: '세력', items: [
    { label: '가문', to: wikiLinks.houses, spa: true },
    { label: '관직', to: wikiLinks.offices, spa: true },
    { label: '운영가문', to: wikiLinks.operatingHouses, spa: true },
    { label: '징집 잔존', to: wikiLinks.conscription, spa: true },
  ]},
  { title: '인물', items: [
    { label: '등장인물', to: wikiLinks.characters, spa: true },
    { label: '인물 총람', to: wikiLinks.castIndex, spa: true },
    { label: '야망과 관계', to: wikiLinks.ambitions, spa: true },
    { label: '항렬과 본관', to: wikiLinks.hangnyeol, spa: true },
  ]},
  { title: '지리', items: [
    { label: '지하철 레이어', to: wikiLinks.subway, spa: true },
    { label: '역 카탈로그', to: wikiLinks.stations, spa: true },
    { label: '지역 설정', to: wikiLinks.regions },
  ]},
  { title: '문화', items: [
    { label: '신앙과 풍속', to: wikiLinks.faith, spa: true },
    { label: '기술과 무구', to: wikiLinks.technology, spa: true },
    { label: '식문화', to: wikiLinks.food, spa: true },
    { label: '구조물', to: wikiLinks.structures, spa: true },
  ]},
  { title: '경제', items: [
    { label: '경제와 생산', to: wikiLinks.economy, spa: true },
    { label: '물류와 기반', to: wikiLinks.logistics, spa: true },
  ]},
]

const news = [
  '2026-09-19 — 16국 기원 재설계 확정 (대한민국정부·전경련·삼성·현대차·장로회·천주교·조계종·원불교·민주노총)',
  '2026-09-19 — 재벌 수장 항렬 계승 개명 (이홍원·정호준·최지우)',
  '2026-09-19 — 장로회 당회장 오경재 신규 캐스팅',
  '2026-09-18 — LORE 루트 폴더 재편 완료',
  '2026-09-18 — 문체 계약 락 체결',
]

export default function HomePage() {
  return (
    <div>
      <div className="mb-6 border-b-2 border-accent pb-3">
        <h1 className="text-3xl font-extrabold text-gray-800">서울:전국 공식 위키</h1>
        <p className="mt-1 text-sm text-gray-500">
          붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-toc-border bg-toc-bg p-4">
        <h3 className="mb-2 text-sm font-bold text-accent-dark">최신 소식</h3>
        {news.map((n, i) => (
          <div key={i} className="home-news-item py-1 text-sm text-gray-700">
            <span className="mr-2 text-accent">•</span>{n}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {panels.map(panel => (
          <div key={panel.title} className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 border-b border-gray-200 pb-1.5 text-sm font-bold text-gray-700">
              {panel.title}
            </h3>
            {panel.items.map(item => item.spa ? (
              <Link key={item.label} to={item.to} className="block py-1 text-sm text-accent hover:underline">
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.to} className="block py-1 text-sm text-accent hover:underline">
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
