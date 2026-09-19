import { Link, Navigate, useParams } from 'react-router-dom'
import { stateCatalog } from '../generated/stateCatalog'

export default function StateDetailPage() {
  const { stateSlug } = useParams()
  const state = stateCatalog.find((candidate) => candidate.slug === stateSlug)
  if (!state) return <Navigate to="/states" replace />

  return (
    <article className="wiki-article" data-wiki-shell="react-official" data-state-slug={state.slug}>
      <nav aria-label="현재 위치" className="wiki-breadcrumbs">
        <Link to="/">대문</Link><span aria-hidden="true">›</span>
        <Link to="/states">서울 십육국</Link><span aria-hidden="true">›</span>
        <strong>{state.name}</strong>
      </nav>
      <header className="wiki-article-header">
        <div><p className="wiki-domain-label">서울:전국 공식 위키 · 국가</p><h1>{state.name}</h1></div>
        <span className="wiki-canon-badge">정본</span>
      </header>
      <dl className="state-detail-grid">
        <div><dt>수장</dt><dd>{state.ruler}</dd></div>
        <div><dt>기원·중심역</dt><dd>{state.origin}</dd></div>
        <div><dt>정부 형태</dt><dd>{state.government}</dd></div>
        <div><dt>국력</dt><dd>{state.power}</dd></div>
      </dl>
      <section className="wiki-prose">
        <h2 id="형성-인과">형성 인과</h2>
        <p>{state.cause}</p>
        <p><Link to="/world/Sixteen-States">서울 십육국 정본 전체 읽기</Link></p>
      </section>
    </article>
  )
}
