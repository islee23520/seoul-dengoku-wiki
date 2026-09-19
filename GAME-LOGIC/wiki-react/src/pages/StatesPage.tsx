import SortableTable from '../components/SortableTable'
import NavBox from '../components/NavBox'
import { Link } from 'react-router-dom'
import { wikiLinks } from '../wikiLinks'

const states = [
  [{ text: '대한민국정부', link: wikiLinks.states }, '광화문역', '봉건', { text: '약소', badge: 'weak' as const }, '윤서린'],
  [{ text: '전국경제인연합회', link: wikiLinks.states }, '여의도역', '상업', { text: '약소', badge: 'weak' as const }, '최지우'],
  [{ text: '삼성그룹', link: wikiLinks.states }, '강남역', '상업', { text: '약소', badge: 'weak' as const }, '이홍원'],
  [{ text: '현대자동차주식회사', link: wikiLinks.states }, '양재역', '상업', { text: '강국', badge: 'power' as const }, '정호준'],
  [{ text: '대한예수교장로회', link: wikiLinks.states }, '삼성역', '신정', { text: '약소', badge: 'weak' as const }, '오경재'],
  [{ text: '천주교 서울대교구', link: wikiLinks.states }, '명동역', '신정', { text: '약소', badge: 'weak' as const }, '남윤경'],
  [{ text: '대한불교조계종', link: wikiLinks.states }, '안국역', '신정', { text: '약소', badge: 'weak' as const }, '백온'],
  [{ text: '원불교', link: wikiLinks.states }, '흑석역', '신정', { text: '약소', badge: 'weak' as const }, '오해린'],
  [{ text: '전국민주노동조합총연맹', link: wikiLinks.states }, '시청역', '상업', { text: '약소', badge: 'weak' as const }, '정유라'],
  [{ text: '급수계약정', link: wikiLinks.states }, '영등포역', '봉건', { text: '강국', badge: 'power' as const }, '한재목'],
  [{ text: '규격동맹', link: wikiLinks.states }, '구로역', '상업', { text: '강국', badge: 'power' as const }, '강민서'],
  [{ text: '선로후계정', link: wikiLinks.states }, '용산역', '봉건', { text: '강국', badge: 'power' as const }, '박태겸'],
  [{ text: '호위보호정', link: wikiLinks.states }, '암사역', '군정', { text: '강국', badge: 'power' as const }, '배우진'],
  [{ text: '관문군정', link: wikiLinks.states }, '구의역', '군정', { text: '약소', badge: 'weak' as const }, '고서준'],
  [{ text: '중립호송시', link: wikiLinks.states }, '신내역', '상업', { text: '약소', badge: 'weak' as const }, '장세화'],
  [{ text: '의약중립맹', link: wikiLinks.states }, '제기동역', '상업', { text: '약소', badge: 'weak' as const }, '류은비'],
]

const navBox = {
  title: '서울 십육국 둘러보기',
  groups: [
    { label: '서부', links: [{ label: '급수계약정', to: wikiLinks.states }, { label: '규격동맹', to: wikiLinks.states }] },
    { label: '중앙', links: [{ label: '대한민국정부', to: wikiLinks.states }, { label: '선로후계정', to: wikiLinks.states }, { label: '전국경제인연합회', to: wikiLinks.states }] },
    { label: '동부', links: [{ label: '호위보호정', to: wikiLinks.states }, { label: '중립호송시', to: wikiLinks.states }, { label: '의약중립맹', to: wikiLinks.states }, { label: '관문군정', to: wikiLinks.states }] },
    { label: '동남', links: [{ label: '삼성그룹', to: wikiLinks.states }, { label: '현대자동차주식회사', to: wikiLinks.states }, { label: '대한예수교장로회', to: wikiLinks.states }, { label: '천주교 서울대교구', to: wikiLinks.states }, { label: '대한불교조계종', to: wikiLinks.states }, { label: '원불교', to: wikiLinks.states }, { label: '전국민주노동조합총연맹', to: wikiLinks.states }] },
  ],
}

export default function StatesPage() {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-xs text-gray-500">
        <Link to={wikiLinks.home} className="text-accent">대문</Link><span className="mx-1">›</span>
        <a href={wikiLinks.worldIndex} className="text-accent">세계관</a><span className="mx-1">›</span>
        <strong>서울 십육국</strong>
      </div>

      <div className="border-b-2 border-accent pb-3">
        <h1 className="text-2xl font-extrabold text-gray-800">
          서울 십육국
          <span className="ml-2 inline-block rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 align-middle text-xs font-semibold text-green-800">✓ 정본</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">오호십육국 구조 — 5호 이민족 · 5강 강국 · 16국 국가</p>
      </div>

      <div className="mt-4 min-w-0">
        <h2 className="mb-2 border-b-2 border-gray-200 pb-1.5 text-lg font-bold text-gray-700">십육국 표</h2>
        <p className="mb-3 text-sm leading-relaxed text-gray-700">
          서울에는 총 16개 국가가 존재한다. 강국은 단순히 병력이 많은 나라가 아니라 물, 수리, 철도, 외부 연결 가운데 둘 이상을 자력으로 유지하고 주변 국가에 영향력을 투사할 수 있는 나라다.
        </p>
        <SortableTable
          headers={['국명', '중심역', '형태', '강국', '수장']}
          rows={states}
        />
      </div>

      <NavBox {...navBox} />

      <div className="mt-4 flex justify-between border-t border-gray-200 pt-3 text-xs text-gray-500">
        <span>최종 편집: 2026-09-19 · 정본: LORE/factions/Sixteen-States.md</span>
      </div>
    </div>
  )
}
