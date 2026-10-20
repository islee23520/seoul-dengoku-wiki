import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { stateCatalog } from '../generated/stateCatalog'

type StateDetails = { currentExclusiveDistrictCount: number; id: string; relation: string | null; religion: string; vassals: string; foreignRelations: string; chronology: Array<{ year: number; text: string; sourceRoute: string }> }
type Territory = { states: StateDetails[]; regions: Array<{ polities: string[] }> }

export default function StateDetailPage() {
  const { stateSlug } = useParams()
  const state = stateCatalog.find((candidate) => candidate.slug === stateSlug)
  const [territory, setTerritory] = useState<Territory | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}opening-territories.json`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error(`E_STATE_TERRITORY:${response.status}`); return response.json() as Promise<Territory> })
      .then(setTerritory)
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])
  if (!state) return <Navigate to="/states" replace />
  const details = territory?.states.find((entry) => entry.id === state.id)
  const seoulRegions = territory?.regions.filter((region) => region.polities.includes(state.id)).length

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
        <div><dt>현재 종주 소속</dt><dd>{state.currentHegemon.name}</dd></div>
        <div><dt>현재 거점</dt><dd>{state.currentBase.name}</dd></div>
        <div><dt>수도역</dt><dd>{state.capitalName}</dd></div>
        <div><dt>정부 형태</dt><dd>{state.government}</dd></div>
        <div><dt>국력</dt><dd>{state.power}</dd></div>
        {details && <><div><dt>지표 배정 기록</dt><dd>{seoulRegions}개 동</dd></div><div><dt>정부와의 관계</dt><dd>{details.relation ?? '해당 없음'}</dd></div><div><dt>국교</dt><dd>{details.religion}</dd></div></>}
      </dl>
      <section className="wiki-prose">
        <h2 id="형성-인과">주요 관계</h2>
        <p>{state.cause}</p>
        {failed && <p role="alert">국가 영토와 연대기 자료를 불러오지 못했습니다.</p>}
        {!failed && !details && <p role="status">국가 영토와 연대기를 불러오고 있습니다.</p>}
        {details && <>
          <h2>현재 소속과 지표 배정</h2><p>{state.name}의 종주 소속은 {state.currentHegemon.name}이다. 단독 지표 배정 기록은 {details.currentExclusiveDistrictCount}개 동이다. 이 수치는 지표 보유 세력 기록에서 해당 국가만 적힌 동을 센 것으로, 백작령 작위나 남작령 슬롯의 보유·독점 소유를 뜻하지 않는다.</p>
          <h2>국가 간 관계</h2><p>{details.foreignRelations}</p>
          <h2>형성 연대기</h2><ol>{details.chronology.map((event, index) => <li key={`${event.year}-${index}`}><Link to={event.sourceRoute}>{event.year}년</Link> · {event.text}</li>)}</ol>
        </>}
        <p><Link to="/world/Sixteen-States">서울 십육국 정본 전체 읽기</Link></p>
      </section>
    </article>
  )
}
