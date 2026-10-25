import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { peopleCatalog } from '../generated/peopleCatalog'
import { portraitSourceCatalog as portraitCatalog } from '../generated/portraitSourceCatalog'
import { portraitPromptApiUrl, portraitTokenApiUrl } from '../portraitTokenApi'
import FeedbackComposer from '../components/FeedbackComposer'
import { FeedbackSurface } from '../components/FeedbackSurface'
import { useFeedbackDocument } from '../hooks/useFeedbackDocument'
import type { PersonRightsPermissions, PermissionStatus } from '../personRightsPermissions'
import type { FamilyTreeData } from '../components/FamilyTree'
import { nonKoreanFamilyCatalog } from '../generated/nonKoreanFamilyCatalog'

type Relation = { from: string; type: string; to: string; basis: string }
type ProfileText = { readonly ko: string; readonly en: string }
type PublicCharacterProfile = {
  readonly abilities: Readonly<Record<string, { readonly base: number; readonly effective: number }>>
  readonly skills: readonly { readonly id: string; readonly name: ProfileText; readonly rating: number }[]
  readonly traits: readonly { readonly id: string; readonly name: ProfileText; readonly description: ProfileText; readonly behavior: ProfileText; readonly stress: ProfileText; readonly relationship: ProfileText; readonly effects: readonly { readonly ability: string; readonly delta: number }[] }[]
  readonly narrative: ProfileText
  readonly health: { readonly status: string; readonly bodyParts: readonly { readonly id: string; readonly severity: string | null; readonly function: string | null }[]; readonly diseases: readonly { readonly id: string; readonly progression: string | null }[] }
}
type ConfirmedHolding = {
  readonly id: string
  readonly name: { readonly ko: string }
  readonly adminRefs: readonly { readonly id: string; readonly name: string }[]
  readonly componentRefs?: readonly { readonly unitId: string; readonly componentIndex: number; readonly name?: string }[]
  readonly liegeRelationshipKind?: 'preserved-personal-service'
  readonly stationRef?: { readonly stationId: string; readonly stationName: string }
  readonly facilityRef?: { readonly stationName: string; readonly layerId: string; readonly layerName: string }
}
type PersonDetail = (typeof peopleCatalog)[number] & {
  birthDate?: string
  birthday?: string
  age?: number
  ageAsOf?: string
  familyTree?: FamilyTreeData
  household?: { readonly personFaith: 'unknown' | 'christian' | 'non-christian'; readonly houseFaith: 'unknown' | 'christian' | 'non-christian'; readonly humanoidAdmission: 'excluded' | 'deferred' }
  proseContacts?: readonly { readonly recipientId: string; readonly recipientName: string; readonly basis: string; readonly sourceRef: { readonly path: string; readonly anchor: string } }[]
  rightsPermissions?: PersonRightsPermissions
  confirmedHoldings?: readonly ConfirmedHolding[]
  subordinateHoldings?: readonly (ConfirmedHolding & { holderName: string; holderRoute: string })[]
  openingTitles?: readonly { id: string; name: string; rank: string; parentTitle: { name: string; holderPersonId: string } | null }[]
  sovereignTitle?: { formalTitle: string; formalTitleRank: string; office: string } | null
  retinueGroups?: readonly { id: string; name: { ko: string }; count: number; duties: readonly string[] }[]
  characterProfile?: PublicCharacterProfile
  clan: { id: string; name: string; crest: string } | null
  generation: string
  minors: boolean
  sourceKind: string
  locked: boolean
  values: Record<string, number | null>
  desire: Record<string, number | string | null>
  fields: Record<string, string>
  sections: Record<string, string>
  biography: string
  sources: string[]
  directLiege?:
    | { personId: string; name: string; courtId: string; effectiveYear: number }
    | { personId: string; name: string; relationKind: 'direct-liege' | 'direct-vassal'; ownerTerm: string; effectiveYear: number }
  court?: { id: string; members: Array<{ personId: string; name: string }> }
  relations: { outgoing: Relation[]; incoming: Relation[] }
}

const sectionOrder = ['생애', '관직', '훈련', '호위 대열', '일화', '가문', '관계', '야망', '공포', '개입']

export function PersonSections({ sections, feedback = false }: { sections: Record<string, string>; feedback?: boolean }): JSX.Element {
  return <>{sectionOrder.filter((label) => sections[label]).map((label) => (
    <section key={label} {...(feedback ? { 'data-feedback-section': label } : {})}><h3>{label}</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{sections[label]}</ReactMarkdown></section>
  ))}</>
}

function DataTable({ title, rows }: { title: string; rows: Array<Array<string | number | null>> }) {
  return (
    <section className="person-data-section">
      <h2>{title}</h2>
      <div className="wiki-table-wrap"><table className="person-data-table"><tbody>{rows.map((row, i) => <tr key={i}><th>{row[0]}</th><td>{row[1] === null || row[1] === undefined ? '—' : String(row[1])}</td></tr>)}</tbody></table></div>
    </section>
  )
}

const abilityLabels: Readonly<Record<string, string>> = { leadership: '통솔', strategy: '전략', negotiation: '교섭', management: '운영', insight: '통찰', learning: '학습', prowess: '기량', endurance: '체력' }
const bodyLabels: Readonly<Record<string, string>> = { 'left-arm': '왼팔', 'right-arm': '오른팔', 'left-leg': '왼다리', 'right-leg': '오른다리', head: '머리', torso: '몸통' }

export function CharacterProfile({ profile }: { readonly profile: PublicCharacterProfile }): JSX.Element {
  return <section data-character-profile>
    <h2>역량과 특성</h2>
    <p>{profile.narrative.ko}</p>
    <div className="wiki-table-wrap"><table className="person-data-table"><caption>기본 역량과 현재 최종 역량</caption><thead><tr><th scope="col">역량</th><th scope="col">기본</th><th scope="col">최종</th></tr></thead><tbody>{Object.entries(abilityLabels).map(([id, label]) => <tr key={id}><th scope="row">{label}</th><td>{profile.abilities[id].base}</td><td>{profile.abilities[id].effective}</td></tr>)}</tbody></table></div>
    <p>기본 역량 10은 해당 분야 숙련자 수준입니다. 기본 상한은 20, 모든 효과를 반영한 최종 상한은 100입니다.</p>
    <h3>행동 숙련</h3>
    {profile.skills.length ? <div className="wiki-table-wrap"><table className="person-data-table"><thead><tr><th scope="col">숙련</th><th scope="col">수준</th></tr></thead><tbody>{profile.skills.map(skill => <tr key={skill.id}><th scope="row">{skill.name.ko}</th><td>{skill.rating.toFixed(1)}</td></tr>)}</tbody></table></div> : <p>확인된 행동 숙련이 없습니다. 미확인은 숙련 0과 다릅니다.</p>}
    <h3>특성</h3>
    {profile.traits.map(trait => <section key={trait.id}><h4>{trait.name.ko}</h4><p>{trait.description.ko}</p><dl><dt>행동</dt><dd>{trait.behavior.ko}</dd><dt>스트레스</dt><dd>{trait.stress.ko}</dd><dt>관계</dt><dd>{trait.relationship.ko}</dd></dl>{trait.effects.length > 0 && <p>{trait.effects.map(effect => `${abilityLabels[effect.ability]} ${effect.delta >= 0 ? '+' : ''}${effect.delta}`).join(' · ')}</p>}</section>)}
    <details><summary>신체 상태</summary><p>{profile.health.status === 'unassessed' ? '신체 상태는 아직 평가되지 않았습니다.' : profile.health.status}</p><div className="wiki-table-wrap"><table className="person-data-table"><thead><tr><th scope="col">부위</th><th scope="col">손상 정도</th><th scope="col">기능 상태</th></tr></thead><tbody>{profile.health.bodyParts.map(part => <tr key={part.id}><th scope="row">{bodyLabels[part.id]}</th><td>{part.severity ?? '미평가'}</td><td>{part.function ?? '미평가'}</td></tr>)}</tbody></table></div><h4>질병 진행</h4>{profile.health.diseases.length ? <ul>{profile.health.diseases.map(disease => <li key={disease.id}>{disease.id} · {disease.progression ?? '미평가'}</li>)}</ul> : <p>확인된 질병 진행 기록이 없습니다. 기록 부재는 건강 판정이 아닙니다.</p>}</details>
  </section>
}

const permissionLabels: Record<PermissionStatus, string> = {
  'not-recorded': '허가 기록 없음', granted: '프로젝트 사용 허가됨', revoked: '허가 철회', declined: '허가 거절',
}
const useLabels = { 'wiki-display': '위키 표시', 'game-use': '게임 사용', 'commercial-use': '상업 사용' } as const

export function PersonPermissions({ permissions }: { readonly permissions?: PersonRightsPermissions }): JSX.Element | null {
  if (!permissions) return null
  return <section className="person-data-section" data-person-permissions>
    <h2>이름·초상 사용 허가</h2>
    <div className="wiki-table-wrap"><table className="person-data-table"><tbody>
      {(['nameUse', 'likenessUse'] as const).map(scope => {
        const permission = permissions[scope]
        return <tr key={scope} data-permission-scope={scope} data-permission-status={permission.status}>
          <th>{scope === 'nameUse' ? '이름 사용' : '초상 사용'}</th>
          <td>{permissionLabels[permission.status]}
            {permission.uses.length > 0 && <div>{permission.uses.map(use => useLabels[use]).join(' · ')}</div>}
            {permission.date && <div><time dateTime={permission.date}>{permission.date}</time></div>}
            {permission.recordedOn && <div>확인 기록일: <time dateTime={permission.recordedOn}>{permission.recordedOn}</time></div>}
            {permission.evidenceRef && <div>기록 번호: {permission.evidenceRef}</div>}
            {permission.priorLicenses?.map(license => <div key={license.sourceRef} data-prior-license-source={license.sourceRef}>
              <a href={license.sourceRef}>적용 자료</a> · <a href={license.licenseRef}>기존 이용 허락</a> · <a href={license.conditionsRef}>적용 조건</a>
            </div>)}
          </td>
        </tr>
      })}
    </tbody></table></div>
    <p data-external-reuse-permission="required">외부 2차 창작에서 이 인물의 이름이나 초상을 사용하려면 실제 인물에게 별도 허가를 받아야 합니다. 프로젝트의 사용 허가와 콘텐츠 라이선스에는 외부 창작자의 이름·초상 사용 허가가 포함되지 않습니다.</p>
  </section>
}

function ValuesDesireSection({ detail }: { detail: any }): JSX.Element | null {
  const values = detail?.values
  const desire = detail?.desire
  if (!values && !desire) return null

  const valueMeta: Record<string, { icon: string; plus: string; minus: string }> = {
    '권위': { icon: '👑', plus: '권위적 질서 선호', minus: '자율·평등 선호' },
    '개방': { icon: '🌊', plus: '외부인 수용', minus: '내집단 우선' },
    '무력': { icon: '⚔️', plus: '무력 해결 선호', minus: '협상·설득 선호' },
    '물질': { icon: '💰', plus: '실리·이익 중시', minus: '이념·신의 중시' },
    '공동': { icon: '🤝', plus: '공동체 우선', minus: '개인 우선' },
    '원칙': { icon: '📏', plus: '규칙 엄수', minus: '융통성 중시' },
    '공개': { icon: '📢', plus: '투명성 추구', minus: '비밀주의' },
    '자격': { icon: '🎖️', plus: '자격심사 옹호', minus: '평등주의' },
    '분산': { icon: '🌳', plus: '분산 의사결정', minus: '집중 의사결정' },
    '변혁': { icon: '🔄', plus: '급진적 변화 추구', minus: '현상 유지 선호' },
  }
  const desireMeta: Record<string, { icon: string; plus: string; minus: string }> = {
    '갈망': { icon: '🔥', plus: '강한 욕구 추구', minus: '절제·금욕' },
    '독점': { icon: '🔒', plus: '독점·소유 추구', minus: '공유·개방' },
    '위험': { icon: '⚡', plus: '위험 감수', minus: '안전 추구' },
    '과시': { icon: '✨', plus: '과시·드러냄', minus: '겸손·숨김' },
    '지속': { icon: '🏔️', plus: '지속적 관계', minus: '일회성 관계' },
  }

  const renderAxis = (name: string, value: number, meta: Record<string, { icon: string; plus: string; minus: string }>) => {
    const m = meta[name]
    if (!m) return null
    const pct = Math.abs(value) / 100 * 50
    const isPlus = value >= 0
    return (
      <div key={name} className="axis-row" title={isPlus ? m.plus : m.minus}>
        <span className="axis-icon">{m.icon}</span>
        <span className="axis-name">{name}</span>
        <div className="axis-bar">
          <div className="axis-fill" style={{ width: pct + '%', marginLeft: isPlus ? '50%' : (50 - pct) + '%', background: isPlus ? 'var(--wiki-accent)' : 'var(--wiki-muted)' }} />
        </div>
        <span className="axis-value">{value > 0 ? '+' + value : value}</span>
        <span className="axis-desc">{isPlus ? m.plus : m.minus}</span>
      </div>
    )
  }

  return (
    <section className="values-desire-section">
      {values && (
        <div className="values-block">
          <h2>가치관</h2>
          {Object.entries(values).map(([name, val]) =>
            typeof val === 'number' ? renderAxis(name, val, valueMeta) : null
          )}
        </div>
      )}
      {desire && (
        <div className="desire-block">
          <h2>욕망</h2>
          {Object.entries(desire).map(([name, val]) =>
            typeof val === 'number' ? renderAxis(name, val, desireMeta) : null
          )}
          <div className="desire-extras">
            {desire['지향'] && <p>🧭 지향: {String(desire['지향'])}</p>}
            {desire['결합'] && <p>💍 결합: {String(desire['결합'])}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

export default function PersonDetailPage() {
  const { personId } = useParams()
  const { pathname } = useLocation()
  const summary: any = peopleCatalog.find((person) => person.id === personId)
  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const proseRef = useRef<HTMLDivElement>(null)
  const [feedbackBound, setFeedbackBound] = useState(false)
  const feedbackState = useFeedbackDocument(pathname, 'ko')
  const feedback = feedbackState.status === 'ready' ? feedbackState.document : null

  useEffect(() => {
    if (!summary) return
    let active = true
    setDetail(null)
    setFailed(false)
    void fetch(`${import.meta.env.BASE_URL}person-details/${summary.id}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status}`)
        return response.json() as Promise<PersonDetail>
      })
      .then((person) => {
        if (person.id !== summary.id || person.name !== summary.name || person.state !== summary.state ||
            person.characterId !== summary.characterId || person.detailRoute !== summary.detailRoute) throw new Error('E_PERSON_DETAIL_IDENTITY')
        if (active) setDetail(person)
      })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [summary])

  useEffect(() => {
    if (!summary) return
    document.title = `${summary.name} | 서울:전국 공식 위키`
    return () => { document.title = '서울:전국 — 공식 위키' }
  }, [summary])

  if (!summary || failed) return <Navigate to="/people" replace />
  if (!detail) return <div className="wiki-loading" role="status">인물 상세를 불러오고 있습니다.</div>

  return <PersonDetailContent detail={detail} personId={personId || ''} feedback={feedback} feedbackBound={feedbackBound} proseRef={proseRef} setFeedbackBound={setFeedbackBound} />
}

export function PersonDetailContent({ detail, personId, feedback = null, feedbackBound = false, proseRef = { current: null }, setFeedbackBound = () => {} }: { detail: PersonDetail; personId: string; feedback?: import('../feedbackSelection').FeedbackDocument | null; feedbackBound?: boolean; proseRef?: React.RefObject<HTMLDivElement>; setFeedbackBound?: (bound: boolean) => void }): JSX.Element {
  const person: any = detail
  const basicRows: Array<Array<string | number | null>> = [
    ['이름', person.name], ['국가', person.stateName || '무소속'], ['국가 ID', person.state],
    ...(detail.birthDate ? [['생년월일', detail.birthDate], ['만 나이', detail.age ?? null], ['나이 기준일', detail.ageAsOf ?? null]] : []),
    ['직위', person.position], ['직급(공통 티어)', person.commonTier], ['국가 품계', person.rank], ['직업', person.occupation], ['성별', person.gender], ['단계', person.stage], ['세대', person.generation],
    ...Object.entries(person.fields ?? {}).filter(([label]) => !['가치관', '욕망', '직위', '소속'].includes(label)),
  ]
  const liegeRow: Array<Array<string>> | null = (() => {
    const liege = detail.directLiege
    if (!liege) return null
    if ('courtId' in liege) return [[`직속 주군 · ${liege.name}`, `2126년 · ${liege.courtId} 소속 가신`]]
    return [[`직속 주군 · ${liege.name}`, `2126년 · ${liege.ownerTerm}`]]
  })()
  const relationRows: Array<Array<string | number | null>> = [
    ...(detail.proseContacts ?? []).map(contact => [`업무 접점 · ${contact.recipientName}`, contact.basis]),
    ...(liegeRow ?? []),
    ...(detail.court ? detail.court.members.map((member) => [`궁정 가신 · ${member.name}`, `2126년 · ${detail.court?.id}`]) : []),
    ...detail.relations.outgoing.map((relation) => [`→ ${relation.to} · ${relation.type}`, relation.basis] as Array<string>),
    ...detail.relations.incoming.map((relation) => [`← ${relation.from} · ${relation.type}`, relation.basis] as Array<string>),
  ]
  const canonicalProse = <>
    <PersonSections sections={detail.sections} feedback />
    <details data-feedback-biography><summary>정본 카드 원문 전체</summary><ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.biography}</ReactMarkdown></details>
  </>

  return (
    <article className="wiki-article" data-wiki-shell="react-official" data-person-id={detail.id}>
      <nav aria-label="현재 위치" className="wiki-breadcrumbs"><Link to="/">대문</Link><span aria-hidden="true">›</span><Link to="/people">등장인물 전체</Link><span aria-hidden="true">›</span><strong>{detail.name}</strong></nav>
      <header className="wiki-article-header">
        <div>
          <p className="wiki-domain-label">서울:전국 공식 위키 · 인물</p>
          <h1>{detail.name}</h1>
          <p>{detail.stateName || '무소속'} · {detail.title}</p>
          {detail.clan ? (
            <p className="person-clan-line" data-person-clan-id={detail.clan.id}>
              <img src={`${import.meta.env.BASE_URL}${detail.clan.crest.startsWith('/') ? '' : '/'}${detail.clan.crest}`} alt={`${detail.clan.name} 문장`} width="64" height="64" loading="lazy" />
              <Link to={`/families/${detail.clan.id}`} className="wiki-link">{detail.clan.name} 가계도</Link>
            </p>
          ) : nonKoreanFamilyCatalog.some((family) => family.members.some((member) => member.id === detail.id)) ? (
            <p className="person-clan-line" data-person-no-clan="non-korean-family">본관 없음 · <Link to="/families#non-korean-families" className="wiki-link">본관을 적용하지 않는 가계</Link></p>
          ) : (
            <p className="person-clan-line" data-person-no-clan="true">본관 없음</p>
          )}
        </div>
        <span className="wiki-canon-badge">정본</span>
      </header>
      <p><Link to={`/tools/character-art?person=${encodeURIComponent(detail.id)}`}>이 인물의 아트 작업 도구 열기</Link> · <a href={portraitTokenApiUrl(detail.id)}>디자인 토큰 API</a> · <a href={portraitPromptApiUrl(detail.id, 'portrait', 'text')}>텍스트 투 이미지 프롬프트</a></p>
      <div className="person-detail-layout">
        <aside className="person-data-panel" aria-label="인물 구조화 데이터">
          {portraitCatalog.entries.some((entry) => entry.personId === detail.id && entry.name === detail.name) && <figure>
            <img className="people-portrait" src={`${import.meta.env.BASE_URL}portraits/${detail.id}.png?v=${portraitCatalog.entries.find((entry) => entry.personId === detail.id && entry.name === detail.name)?.imageSha256}`} alt={`${detail.name} 초상 아트 제안`} />
            <figcaption>초상 아트 제안 · <a href={`${import.meta.env.BASE_URL}portrait-tokens/${detail.id}.json?v=${portraitCatalog.entries.find((entry) => entry.personId === detail.id && entry.name === detail.name)?.imageSha256}`}>디자인 토큰</a></figcaption>
          </figure>}
          <DataTable title="기본 정보" rows={basicRows} />
          <PersonPermissions permissions={detail.rightsPermissions} />
          {detail.household && <DataTable title="가정과 신앙" rows={[
            ['개인 신앙', ({ unknown: '미확인', christian: '기독교', 'non-christian': '비기독교' })[detail.household.personFaith]],
            ['가문 신앙', ({ unknown: '미확인', christian: '기독교', 'non-christian': '비기독교' })[detail.household.houseFaith]],
            ['휴머노이드 가정 반입', detail.household.humanoidAdmission === 'excluded' ? '소속 정치 세력의 반입 배제' : '개별 심사'],
          ]} />}
          <DataTable title="관계" rows={relationRows.length ? relationRows : [['관계', '등록된 방향성 관계 없음']]} />
        </aside>
        <div className="wiki-prose person-canon-prose">
          <h2>정본 상세</h2>
          {feedback ? <FeedbackSurface rootRef={proseRef} documentInfo={feedback} onBound={setFeedbackBound}>{canonicalProse}</FeedbackSurface> : <><PersonSections sections={detail.sections} /><details><summary>정본 카드 원문 전체</summary><ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.biography}</ReactMarkdown></details></>}

          {detail.characterProfile && <CharacterProfile profile={detail.characterProfile} />}
          {detail.sovereignTitle && <DataTable title="작위와 직위" rows={[["작위", detail.sovereignTitle.formalTitle], ["등급", detail.sovereignTitle.formalTitleRank], ["직위", detail.sovereignTitle.office]]} />}
          {!!detail.openingTitles?.length && <section data-opening-titles><h2>개막 영토 작위와 상위 관할</h2>{detail.confirmedHoldings?.some(holding => holding.liegeRelationshipKind === 'preserved-personal-service') && <p>기존 인적 봉사 주군 관계와 영토 작위의 상위 관할은 별개입니다. 기존 인적 관계는 그대로 보존합니다.</p>}{detail.openingTitles.map(title => <DataTable key={title.id} title={title.name} rows={[["작위 등급", title.rank], ["상위 작위", title.parentTitle?.name ?? '독립'], ["영토 작위 상위 보유자", title.parentTitle?.holderPersonId ?? '없음']]} />)}</section>}
          {detail.retinueGroups?.map(group => <section key={group.id} data-retinue-group={group.id}><h2>{group.name.ko}</h2><p>{group.count}기 · 민웅기 직속</p><p>{group.duties.join(' · ')}</p></section>)}
          {!!detail.confirmedHoldings?.length && <section className="gurps-territory-confirmed" data-confirmed-holdings>
            <h2>직접 보유 영지와 시설</h2>
            {detail.confirmedHoldings.map((holding) => <section key={holding.id} data-holding-id={holding.id}>
              <h3>{holding.name.ko}</h3>
              {holding.stationRef && <p data-owned-station={holding.stationRef.stationId}>{holding.stationRef.stationName}역</p>}
              {holding.adminRefs.length > 0 && <ul>{holding.adminRefs.map((region) => <li key={region.id} data-admin-ref={region.id}>{region.name}</li>)}</ul>}
              {!!holding.componentRefs?.length && <ul>{holding.componentRefs.map(ref => <li key={`${ref.unitId}:${ref.componentIndex}`} data-component-ref={`${ref.unitId}:${ref.componentIndex}`}>{ref.name ?? `${ref.unitId}:${ref.componentIndex}`}</li>)}</ul>}
              {holding.facilityRef && <p data-facility-layer={holding.facilityRef.layerId}>{holding.facilityRef.stationName} · {holding.facilityRef.layerName}</p>}
            </section>)}
          </section>}
          {!!detail.subordinateHoldings?.length && <section data-subordinate-holdings><h2>공작령 내 봉신 보유 영지</h2>{detail.subordinateHoldings.map(holding => <section key={holding.id}><h3>{holding.name.ko}</h3><p>보유 영주: <Link to={holding.holderRoute}>{holding.holderName}</Link></p><ul>{holding.adminRefs.map(ref => <li key={ref.id}>{ref.name}</li>)}</ul></section>)}</section>}
          <ValuesDesireSection detail={detail} />

          <p><Link to={detail.sourceRoute}>정본 원문 위치로 이동</Link></p>
          <p><Link to={`/people/art?person=${encodeURIComponent(detail.id)}`}>이 인물로 아트 도구 열기</Link></p>
        </div>
      </div>
      {feedback && feedbackBound && <FeedbackComposer rootRef={proseRef} documentInfo={feedback} locale="ko" />}
    </article>
  )
}
