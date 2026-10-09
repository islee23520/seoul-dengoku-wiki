import { Link } from 'react-router-dom'
import NavBox from '../components/NavBox'
import SortableTable from '../components/SortableTable'
import { stateCatalog } from '../generated/stateCatalog'
import { stateRoute } from '../wikiRouting'
import { politicalCatalog } from '../generated/politicalCatalog'

const hegemons = politicalCatalog.hegemons
const territories: Record<string, string> = {
  규격맹: '서울 서부·동작·관악, 경기 서남부, 인천·충청남도·세종',
  대한민국정부: '서울 북부·도심·용산, 경기 북부',
  '종교 연합': '서울 동부·강남·서초·송파, 경기 동남부, 강원·충청북도',
}

export default function StatesPage() {
  const daejeon = politicalCatalog.daejeon
  return <article className="wiki-article" data-wiki-shell="react-official">
    <nav className="wiki-breadcrumbs" aria-label="현재 위치"><Link to="/">대문</Link><span aria-hidden="true">›</span><strong>국가와 영지</strong></nav>
    <header className="wiki-article-header"><div><p className="wiki-domain-label">2126년 정치 지도</p><h1>삼국과 중립 영지</h1></div></header>
    <div className="wiki-prose"><p>규격맹·대한민국정부·종교 연합이 서울과 주변 지역을 나누어 다스린다. 중앙정보부와 대전은 중립이다.</p></div>
    {hegemons.map(hegemon => <section key={hegemon.name} className="wiki-prose" aria-label={hegemon.name}>
      <h2><span aria-hidden="true" style={{ color: hegemon.color }}>● </span>{hegemon.name}</h2>
      <p><strong>강역</strong> · {territories[hegemon.name]}</p><p><strong>AI·휴머노이드</strong> · {hegemon.aiPosition}</p>
      <SortableTable headers={['소속 세력', '거점', '수장', '정부 형태']} rows={stateCatalog.filter(state => state.currentHegemon.name === hegemon.name).map(state => [{ text: state.name, link: stateRoute(state.slug) }, state.currentBase.name, state.ruler, state.government])} />
    </section>)}
    <section className="wiki-prose"><h2>중립 중앙정보부</h2><p>남산타워와 용산2가동·후암동·이태원2동을 다스린다. 수도역은 녹사평이며 중앙정보부 AI의 현재 아바타는 오해린이다.</p><p><Link to="/states/s08">중앙정보부 보기</Link></p></section>
    <section className="wiki-prose" aria-label="중립 대전"><h2>중립 대전</h2><p><Link to="/people/person-1008">민웅기</Link>가 다스리는 왕국급 강역이다. 작위는 {daejeon.formalTitle}, 등급은 {daejeon.formalTitleRank}, 직위는 {daejeon.office}다.</p>
      <SortableTable headers={['영지', '보유자', '직속 주군']} rows={[
        ['동구·유성구', { text: '민웅기', link: '/people/person-1008' }, '없음'],
        ['중구', { text: '장우석', link: '/people/person-0035' }, '민웅기'],
        ['서구', { text: '구찬솔', link: '/people/person-0039' }, '민웅기'],
        ['대덕구', { text: '허다온', link: '/people/person-0038' }, '민웅기'],
      ]} />
      <p>민웅기 직속 휴머노이드 가신단 24기는 농업·지역 통신·보급·정비를 맡는다.</p>
    </section>
    <NavBox title="국가와 영지 둘러보기" groups={[...hegemons.map(hegemon => ({ label: hegemon.name, links: stateCatalog.filter(state => state.currentHegemon.name === hegemon.name).map(state => ({ label: state.name, to: stateRoute(state.slug) })) })), { label: '중립', links: [{ label: '중앙정보부', to: '/states/s08' }, { label: '대전 · 민웅기', to: '/people/person-1008' }] }]} />
  </article>
}
