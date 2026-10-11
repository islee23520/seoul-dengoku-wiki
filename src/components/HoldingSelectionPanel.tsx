import { Link } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { retainerGraph } from '../generated/retainerGraph'

export type ConfirmedHolding = {
  id: string
  name: { ko: string; en?: string }
  holderPersonId: string
  directLiegePersonId: string | null
  stationRef?: { stationId: string; stationName: string }
  landmarkRef?: { landmarkId: string; sourcePath: string }
  stateId: string
  designation?: { ko: string; en?: string }
  territorialScale: string | null
  formalTitleRank: string | null
  adminRefs: Array<{ id: string; name: string }>
  facilityRef?: { sourcePath: string; stationName: string; stationId?: string; layerId: string; layerName?: string; siteAnchor?: string; stationIdentity?: { district: string; lat: number; lon: number } }
  componentRefs?: HoldingComponentRef[]
  titleId?: string
  liegeRelationshipKind?: 'preserved-personal-service'
}
export type HoldingComponentRef = { unitId: string; componentIndex: number; name?: string }
export type HoldingTitleRef = { id: string; name: string; rank?: string; holderPersonId?: string; stateId?: string; parentTitleId?: string | null; jurisdictionRefs?: string[] }
export type HoldingPolity = { id: string; name: { ko: string; en?: string }; sovereignPersonId: string | null; territorialScale: string | null; formalTitle: string | null; formalTitleRank: string | null; office: string | null; authority: { kind: string; name: string } }
export type ConfirmedHoldings = { schema: 'confirmed-person-holdings.v1'; openingYear: number; holdings: ConfirmedHolding[]; polities: HoldingPolity[]; titles?: HoldingTitleRef[] }

export function personById(id: string): { name: string; detailRoute: string; stateName: string; position: string; rank: string; commonTier: string } | undefined {
  const node = retainerGraph.nodes.find(person => person.id === id)
  return node && peopleCatalog.find(person => person.detailRoute === node.detailRoute)
}

function relationLabel(edge: { courtId: string | null; relationKind?: string; ownerTerm?: string }) {
  return edge.courtId === null ? edge.ownerTerm ?? '직속 관계' : '직속 봉사·궁정 관계'
}

export default function HoldingSelectionPanel({ holding, openingYear, selectedRegionId, onSelectRegion, onSelectComponent, selectedComponentIndex, titles }: {
  holding: ConfirmedHolding
  openingYear: number
  selectedRegionId: string
  onSelectRegion: (id: string) => void
  onSelectComponent?: (unitId: string, componentIndex: number) => void
  selectedComponentIndex?: number | null
  titles?: HoldingTitleRef[]
}) {
  const title = holding.titleId ? titles?.find(entry => entry.id === holding.titleId) : undefined
  const parentTitle = title?.parentTitleId ? titles?.find(entry => entry.id === title.parentTitleId) : undefined
  const holder = personById(holding.holderPersonId)
  const liege = holding.directLiegePersonId === null ? null : personById(holding.directLiegePersonId)
  const ownerLiege = retainerGraph.edges.find(edge => edge.fromPersonId === holding.holderPersonId && edge.toPersonId === holding.directLiegePersonId && edge.courtId === null)
  const members = retainerGraph.edges.filter(edge => edge.toPersonId === holding.holderPersonId).flatMap(edge => {
    const person = personById(edge.fromPersonId)
    return person ? [{ person, edge }] : []
  })
  if (!holder || (holding.directLiegePersonId !== null && !liege)) return <section className="campaign-holding" aria-label="선택한 개인 영지" data-selected-holding={holding.id}><h3>{holding.name.ko}</h3><p role="alert">영지의 보유자·직속 주군 인물 정보를 불러오지 못했습니다.</p></section>
  return <section className="campaign-holding" aria-label="선택한 개인 영지" data-selected-holding={holding.id}>
    <header><p className="wiki-domain-label">{openingYear}년 개인 영지 · {holding.id}</p><h3>{holding.name.ko}</h3></header>
    <dl>
      <div><dt>보유자</dt><dd>{holder && <Link to={holder.detailRoute}>{holder.name} · {holding.holderPersonId}</Link>}</dd></div>
      {holding.designation && <div><dt>영주 명칭</dt><dd>{holding.designation.ko}</dd></div>}
      {holding.formalTitleRank && <div><dt>작위 등급</dt><dd>{holding.formalTitleRank}</dd></div>}
      {title && <div><dt>작위</dt><dd>{title.name}{title.rank ? ` · ${title.rank}` : ''}</dd></div>}
      {parentTitle && <div><dt>상위 작위</dt><dd>{parentTitle.name}{parentTitle.rank ? ` · ${parentTitle.rank}` : ''}</dd></div>}
      <div><dt>국가</dt><dd>{holder?.stateName ?? holding.stateId}</dd></div>
      <div><dt>{holding.liegeRelationshipKind === 'preserved-personal-service' ? '기존 인적 봉사 주군' : ownerLiege ? relationLabel(ownerLiege) : '직속 주군'}</dt><dd>{liege ? <Link to={liege.detailRoute}>{liege.name} · {holding.directLiegePersonId}</Link> : '없음'}</dd></div>
      {holding.liegeRelationshipKind === 'preserved-personal-service' && <p>기존 인적 봉사 관계는 보존합니다. 영토 작위의 상위 관할은 별도로 표시한 상위 작위를 따릅니다.</p>}
      {holding.territorialScale && <div><dt>영토 규모</dt><dd>{holding.territorialScale === 'duchy' ? '공작령 규모' : holding.territorialScale === 'barony' ? '남작령 규모' : holding.territorialScale}</dd></div>}
      <div><dt>보유 범위</dt><dd>{holding.stationRef ? `${holding.stationRef.stationName}역` : holding.landmarkRef ? holding.name.ko : holding.facilityRef ? `${holding.facilityRef.stationName} · ${holding.facilityRef.layerName ?? holding.facilityRef.layerId}` : holding.componentRefs?.length ? `${holding.componentRefs.length}개 구성 요소` : holding.adminRefs.length ? `${holding.adminRefs.length}개 행정구역` : '확인된 지리 경계 없음'}</dd></div>
    </dl>
    {holder && <details><summary>공직 정보</summary><p>{holder.position} · {holder.rank} · {holder.commonTier}</p></details>}
    {holding.facilityRef && <p>보유 범위는 {holding.facilityRef.stationName}의 실제 대합실입니다. 지도는 위치를 도식으로 표시하며 대합실의 실제 경계와 면적은 표시하지 않습니다.</p>}
    {holding.adminRefs.length > 0 && <><h4>보유 행정구역</h4><ul className="campaign-holding-regions">{holding.adminRefs.map(ref => <li key={ref.id}><button type="button" aria-pressed={ref.id === selectedRegionId} onClick={() => onSelectRegion(ref.id)}>{ref.name}</button></li>)}</ul></>}
    {holding.componentRefs && holding.componentRefs.length > 0 && <><h4>보유 구성 요소</h4><ul className="campaign-holding-regions">{holding.componentRefs.map(ref => <li key={`${ref.unitId}:${ref.componentIndex}`}><button type="button" aria-pressed={ref.unitId === selectedRegionId && (selectedComponentIndex === undefined || ref.componentIndex === selectedComponentIndex)} onClick={() => onSelectComponent ? onSelectComponent(ref.unitId, ref.componentIndex) : onSelectRegion(ref.unitId)}>{ref.name ?? `${ref.unitId}:${ref.componentIndex}`}</button></li>)}</ul></>}
    {members.length > 0 && <><h4>직속 관계</h4><ul className="campaign-holding-retainers">{members.map(({ person, edge }) => <li key={edge.fromPersonId}><Link to={person.detailRoute}>{person.name} · {edge.fromPersonId}</Link><span>{relationLabel(edge)}</span></li>)}</ul></>}
  </section>
}
