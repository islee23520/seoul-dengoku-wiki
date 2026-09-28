import { Link } from 'react-router-dom'
import { PageHeader, SectionHeading, ServiceCard } from '@seoul-dengoku/shared-web-ui'
import { categoryIndex } from '../generated/categoryIndex'
import { wikiUpdates } from '../generated/wikiUpdates'
import { peopleCount } from '../generated/peopleCount'
import { wikiLinks } from '../wikiLinks'
import { wikiAnchorHref } from '../sharedCategories'

export default function HomePage() {
  return (
    <div>
      <PageHeader
        title="서울:전국 공식 위키"
        lead="붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG"
      />

      <SectionHeading title="바로 보기" />
      <div className="wiki-service-grid">
        <ServiceCard href={wikiAnchorHref(wikiLinks.subway)} title="세계 지도" path={wikiAnchorHref(wikiLinks.subway)} summary="지상 영토와 지하 노선층을 함께 보는 개막 시점 지도" />
        <ServiceCard href={wikiAnchorHref(wikiLinks.characters)} title="등장인물 전체" path={wikiAnchorHref(wikiLinks.characters)} summary={`${peopleCount}인 인물 원장과 개인 문서`} />
        <ServiceCard href={wikiAnchorHref(wikiLinks.states)} title="서울 십육국" path={wikiAnchorHref(wikiLinks.states)} summary="십육국 국가 표식과 관계" />
      </div>

      <div className="wiki-news">
        <div className="wiki-news-head"><h3>최신 소식</h3><Link to="/updates">전체 계약 이력</Link></div>
        {wikiUpdates.map((update) => (
          <div key={`${update.date}:${update.title}`} className="home-news-item">
            <span className="wiki-news-bullet">•</span><Link to={update.route}>{update.date} — {update.title}</Link>
          </div>
        ))}
      </div>

      <div className="wiki-quick-links">
        <Link to={wikiLinks.documents}>정본 문서 전체</Link>
        <Link to={wikiLinks.categories}>분류 전체</Link>
        <Link to={wikiLinks.characters}>인물 총람</Link>
      </div>

      {categoryIndex.categories.map((category) => (
        <section key={category.id}>
          <SectionHeading title={category.label} href={wikiAnchorHref(`/categories/${category.id}`)} moreLabel="분류 보기" />
          <p className="wiki-category-lead">{category.summary} · {category.documents.length}개</p>
          <ul className="wiki-category-docs">
            {category.documents.map((document) => (
              <li key={document.route}><Link to={document.route}>{document.title}</Link></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
