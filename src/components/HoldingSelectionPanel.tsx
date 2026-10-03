import { Link } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { retainerGraph } from '../generated/retainerGraph'

export type ConfirmedHolding = {
  id: string
  name: { ko: string; en?: string }
  holderPersonId: string
  directLiegePersonId: string
  stateId: string
  designation?: { ko: string; en?: string }
  territorialScale: string | null
  formalTitleRank: string | null
  adminRefs: Array<{ id: string; name: string }>
  facilityRef?: { sourcePath: string; stationName: string; layerId: string; layerName?: string; siteAnchor?: string; stationIdentity?: { district: string; lat: number; lon: number } }
}
export type ConfirmedHoldings = { schema: 'confirmed-person-holdings.v1'; openingYear: number; holdings: ConfirmedHolding[] }

function personById(id: string) {
  const node = retainerGraph.nodes.find(person => person.id === id)
  return node && peopleCatalog.find(person => person.detailRoute === node.detailRoute)
}

function relationLabel(edge: { courtId: string | null; relationKind?: string; ownerTerm?: string }) {
  return edge.courtId === null ? edge.ownerTerm ?? '직속 관계' : '직속 봉사·궁정 관계'
}

export default function HoldingSelectionPanel({ holding, openingYear, selectedRegionId, onSelectRegion }: {
  holding: ConfirmedHolding
  openingYear: number
  selectedRegionId: string
  onSelectRegion: (id: string) => void
}) {
  const holder = personById(holding.holderPersonId)
  const liege = personById(holding.directLiegePersonId)
  const ownerLiege = retainerGraph.edges.find(edge => edge.fromPersonId === holding.holderPersonId && edge.toPersonId === holding.directLiegePersonId && edge.courtId === null)
  const members = retainerGraph.edges.filter(edge => edge.toPersonId === holding.holderPersonId).flatMap(edge => {
    const person = personById(edge.fromPersonId)
    return person ? [{ person, edge }] : []
  })
  if (!holder || !liege) return <section className="campaign-holding" aria-label="선택한 개인 영지" data-selected-holding={holding.id}><h3>{holding.name.ko}</h3><p role="alert">영지의 보유자·직속 주군 인물 정보를 불러오지 못했습니다.</p></section>
  return <section className="campaign-holding" aria-label="선택한 개인 영지" data-selected-holding={holding.id}>
    <header><p className="wiki-domain-label">{openingYear}년 개인 영지 · {holding.id}</p><h3>{holding.name.ko}</h3></header>
    <dl>
      <div><dt>보유자</dt><dd>{holder && <Link to={holder.detailRoute}>{holder.name} · {holding.holderPersonId}</Link>}</dd></div>
      {holding.designation && <div><dt>영주 명칭</dt><dd>{holding.designation.ko}</dd></div>}
      {holding.formalTitleRank && <div><dt>작위 등급</dt><dd>{holding.formalTitleRank}</dd></div>}
      <div><dt>국가</dt><dd>{holder?.stateName ?? holding.stateId}</dd></div>
      <div><dt>{ownerLiege ? relationLabel(ownerLiege) : '직속 주군'}</dt><dd>{liege && <Link to={liege.detailRoute}>{liege.name} · {holding.directLiegePersonId}</Link>}</dd></div>
      {holding.territorialScale && <div><dt>영토 규모</dt><dd>{holding.territorialScale === 'duchy' ? '공국 규모' : holding.territorialScale}</dd></div>}
      <div><dt>보유 범위</dt><dd>{holding.facilityRef ? `${holding.facilityRef.stationName} · ${holding.facilityRef.layerName ?? holding.facilityRef.layerId}` : `${holding.adminRefs.length}개 동`}</dd></div>
    </dl>
    {holder && <details><summary>공직 정보</summary><p>{holder.position} · {holder.rank} · {holder.commonTier}</p></details>}
    {holding.facilityRef && <p>보유 범위는 {holding.facilityRef.stationName}의 실제 대합실입니다. 지도는 위치를 도식으로 표시하며 대합실의 실제 경계와 면적은 표시하지 않습니다.</p>}
    {holding.adminRefs.length > 0 && <><h4>보유 동</h4><ul className="campaign-holding-regions">{holding.adminRefs.map(ref => <li key={ref.id}><button type="button" aria-pressed={ref.id === selectedRegionId} onClick={() => onSelectRegion(ref.id)}>{ref.name}</button></li>)}</ul></>}
    {members.length > 0 && <><h4>직속 관계</h4><ul className="campaign-holding-retainers">{members.map(({ person, edge }) => <li key={edge.fromPersonId}><Link to={person.detailRoute}>{person.name} · {edge.fromPersonId}</Link><span>{relationLabel(edge)}</span></li>)}</ul></>}
  </section>
}
