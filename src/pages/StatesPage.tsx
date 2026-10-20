import { Link } from 'react-router-dom'
import NavBox from '../components/NavBox'
import SortableTable from '../components/SortableTable'
import { stateCatalog } from '../generated/stateCatalog'
import { stateRoute } from '../wikiRouting'
import { politicalCatalog } from '../generated/politicalCatalog'

const hegemons = politicalCatalog.hegemons

export default function StatesPage() {
  const daejeon = politicalCatalog.daejeon
  return <article className="wiki-article" data-wiki-shell="react-official">
    <nav className="wiki-breadcrumbs" aria-label="현재 위치"><Link to="/">대문</Link><span aria-hidden="true">›</span><strong>국가와 영지</strong></nav>
    <header className="wiki-article-header"><div><p className="wiki-domain-label">2126년 정치 지도</p><h1>삼국과 중립 영지</h1></div></header>
    <div className="wiki-prose"><p>규격맹·대한민국정부·종교 연합이 서울 안에서 성립한다. 중앙정보부와 대전은 중립이다. 중심 권역은 모든 소속 인물의 거주지나 전 구역의 독점 소유를 뜻하지 않는다.</p></div>
    {hegemons.map(hegemon => <section key={hegemon.name} className="wiki-prose" aria-label={hegemon.name}>
      <h2><span aria-hidden="true" style={{ color: hegemon.color }}>● </span>{hegemon.name}</h2>
      <p><strong>중심 권역</strong> · {hegemon.centerRegion}</p><p><strong>AI·휴머노이드</strong> · {hegemon.aiPosition}</p>
      <SortableTable headers={['소속 세력', '거점', '수장', '정부 형태']} rows={stateCatalog.filter(state => state.currentHegemon.name === hegemon.name).map(state => [{ text: state.name, link: stateRoute(state.slug) }, state.currentBase.name, state.ruler, state.government])} />
    </section>)}
    <section className="wiki-prose"><h2>중립 중앙정보부</h2><p>남산타워와 용산2가동·후암동·이태원2동을 다스린다. 수도역은 녹사평이며 중앙정보부 AI의 현재 아바타는 오해린이다.</p><p><Link to="/states/s08">중앙정보부 보기</Link></p></section>
    <section className="wiki-prose" aria-label="중립 대전"><h2>중립 대전</h2><p>대전은 서울 안에 보존하는 중립 정치 정체성이다. <Link to="/people/person-1008">민웅기</Link>의 작위는 {daejeon.formalTitle}, 등급은 {daejeon.formalTitleRank}, 직위는 {daejeon.office}다. 이 지위만으로 서울 영토·작위·보유 범위를 새로 부여하지 않는다.</p>
      <p>민웅기 직속 휴머노이드 가신단 24기는 농업·지역 통신·보급·정비를 맡는다.</p>
    </section>
    <NavBox title="국가와 영지 둘러보기" groups={[...hegemons.map(hegemon => ({ label: hegemon.name, links: stateCatalog.filter(state => state.currentHegemon.name === hegemon.name).map(state => ({ label: state.name, to: stateRoute(state.slug) })) })), { label: '중립', links: [{ label: '중앙정보부', to: '/states/s08' }, { label: '대전 · 민웅기', to: '/people/person-1008' }] }]} />
  </article>
}
