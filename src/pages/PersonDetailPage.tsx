import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { peopleCatalog } from '../generated/peopleCatalog'
import portraitCatalog from '../../portrait-catalog.json'
import FeedbackComposer from '../components/FeedbackComposer'
import { FeedbackSurface } from '../components/FeedbackSurface'
import { useFeedbackDocument } from '../hooks/useFeedbackDocument'
import type { PersonRightsPermissions, PermissionStatus } from '../personRightsPermissions'
import type { FamilyTreeData } from '../components/FamilyTree'
import { nonKoreanFamilyCatalog } from '../generated/nonKoreanFamilyCatalog'
import nameChanges from '../../scripts/person-sheet-name-changes.json'
import preservationBaseline from '../../scripts/issued-preservation-baseline.json'

type Relation = { from: string; type: string; to: string; basis: string }
type ConfirmedHolding = {
  readonly id: string
  readonly name: { readonly ko: string }
  readonly adminRefs: readonly { readonly id: string; readonly name: string }[]
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
  sovereignTitle?: { formalTitle: string; formalTitleRank: string; office: string } | null
  retinueGroups?: readonly { id: string; name: { ko: string }; count: number; duties: readonly string[] }[]
  gurps: { readonly id: string; readonly personId: string }
  personSheet: unknown
  unit?: { type: string; size: number; quality: string; composition: string[]; note: string } | null
  territory?: { fief_name: string; type: string; station: string; state: string; settlement: { name: string; type: string; description: string }; note: string } | null
  wandering_force?: { type: string; size: number; current_location: string; camp: { name: string; type: string; description: string; facilities: string[]; pack_up_time: string }; note: string } | null
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

const sectionOrder = ['생애', '관직', '무공', '호위 대열', '일화', '가문', '관계', '야망', '공포', '개입']

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

type SheetAttr = { value?: number; cp?: number }
type SheetTrait = { name: string; kind: string; cp?: number; rule?: string }
type SheetSkill = { name?: string; ko?: string; level?: number; cp?: number }
type SheetCp = { total?: number; attributes?: number; advantages?: number; disadvantages?: number; skills?: number; spent?: number; unspent?: number }
type SheetSecondary = { HP?: number; FP?: number; Will?: number; Per?: number; BasicSpeed?: number; BasicMove?: number; BasicLift?: number; Dodge?: number }

export type GurpsSheetData = {
  band: string | null
  attributes: Partial<Record<'ST' | 'DX' | 'IQ' | 'HT', SheetAttr>>
  traits: SheetTrait[]
  skills: SheetSkill[]
  cp: SheetCp
  secondary: SheetSecondary
}

export type GurpsParseResult = { ok: true; sheet: GurpsSheetData } | { ok: false; error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

function pickNumbers(label: string, raw: unknown, keys: readonly string[]): Record<string, number> | string {
  if (raw === undefined || raw === null) return {}
  if (!isRecord(raw)) return `${label}가 객체가 아니다`
  for (const key of keys) {
    const value = raw[key]
    if (value !== undefined && value !== null && !isNumber(value)) return `${label}.${key}가 숫자가 아니다`
  }
  return Object.fromEntries(keys.filter((key) => isNumber(raw[key])).map((key) => [key, raw[key] as number]))
}

// 신원은 scripts/mcp-character-server.mjs의 matchesCharacter와 같다: personId 일치 또는 url === '/people/' + 요청 ID.
// K 번호에서 route 순번을 추측하지 않는다. 예: person-0089는 K088이다.
export function parseGurpsSheet(payload: unknown, personId: string): GurpsParseResult {
  const reject = (error: string): GurpsParseResult => ({ ok: false, error })
  if (!isRecord(payload)) return reject('시트 응답이 객체가 아니다')
  if (payload.url !== '/people/' + personId || (payload.personId !== undefined && payload.personId !== personId)) return reject('시트 신원이 요청한 인물과 다르다')

  const band = payload.band === undefined || payload.band === null ? null : typeof payload.band === 'string' ? payload.band : undefined
  if (band === undefined) return reject('band가 문자열이 아니다')

  const attributes: GurpsSheetData['attributes'] = {}
  if (payload.attributes !== undefined && payload.attributes !== null) {
    if (!isRecord(payload.attributes)) return reject('attributes가 객체가 아니다')
    for (const key of ['ST', 'DX', 'IQ', 'HT'] as const) {
      const raw = payload.attributes[key]
      if (raw === undefined || raw === null) continue
      if (!isRecord(raw)) return reject(`attributes.${key}가 객체가 아니다`)
      if (raw.value !== undefined && !isNumber(raw.value)) return reject(`attributes.${key}.value가 숫자가 아니다`)
      if (raw.cp !== undefined && !isNumber(raw.cp)) return reject(`attributes.${key}.cp가 숫자가 아니다`)
      attributes[key] = { value: raw.value as number | undefined, cp: raw.cp as number | undefined }
    }
  }

  const traits: SheetTrait[] = []
  if (payload.traits !== undefined && payload.traits !== null) {
    if (!Array.isArray(payload.traits)) return reject('traits가 배열이 아니다')
    for (const entry of payload.traits) {
      if (!isRecord(entry)) return reject('traits 항목이 객체가 아니다')
      if (typeof entry.name !== 'string') return reject('traits 항목의 name이 문자열이 아니다')
      if (entry.kind !== undefined && typeof entry.kind !== 'string') return reject('traits 항목의 kind가 문자열이 아니다')
      if (entry.cp !== undefined && !isNumber(entry.cp)) return reject('traits 항목의 cp가 숫자가 아니다')
      traits.push({
        name: entry.name,
        kind: typeof entry.kind === 'string' ? entry.kind : '',
        cp: entry.cp as number | undefined,
        rule: typeof entry.rule === 'string' ? entry.rule : undefined,
      })
    }
  }

  const skills: SheetSkill[] = []
  if (payload.skills !== undefined && payload.skills !== null) {
    if (!Array.isArray(payload.skills)) return reject('skills가 배열이 아니다')
    for (const entry of payload.skills) {
      if (!isRecord(entry)) return reject('skills 항목이 객체가 아니다')
      if (entry.name !== undefined && typeof entry.name !== 'string') return reject('skills 항목의 name이 문자열이 아니다')
      if (entry.ko !== undefined && typeof entry.ko !== 'string') return reject('skills 항목의 ko가 문자열이 아니다')
      if (entry.level !== undefined && !isNumber(entry.level)) return reject('skills 항목의 level이 숫자가 아니다')
      if (entry.cp !== undefined && !isNumber(entry.cp)) return reject('skills 항목의 cp가 숫자가 아니다')
      skills.push({
        name: entry.name as string | undefined,
        ko: entry.ko as string | undefined,
        level: entry.level as number | undefined,
        cp: entry.cp as number | undefined,
      })
    }
  }

  const cp = pickNumbers('cp', payload.cp, ['total', 'attributes', 'advantages', 'disadvantages', 'skills', 'spent', 'unspent'])
  if (typeof cp === 'string') return reject(cp)
  const secondary = pickNumbers('secondary', payload.secondary, ['HP', 'FP', 'Will', 'Per', 'BasicSpeed', 'BasicMove', 'BasicLift', 'Dodge'])
  if (typeof secondary === 'string') return reject(secondary)

  return { ok: true, sheet: { band, attributes, traits, skills, cp: cp as SheetCp, secondary: secondary as SheetSecondary } }
}

export function GurpsSheet({ gurps }: { gurps: GurpsSheetData }): JSX.Element {
  const attrs = gurps.attributes

  const cp = gurps.cp
  const skills = gurps.skills
  const advantages = gurps.traits.filter((trait) => trait.kind === 'advantage')
  const disadvantages = gurps.traits.filter((trait) => trait.kind === 'disadvantage')
  const secondary = gurps.secondary
  const band = gurps.band

  return (
    <section className="gurps-sheet">
      <h3>역사 시트 · 읽기 전용</h3>
      <p>ST·DX·IQ·HT·CP는 보존된 옛 필드명입니다. 아래 값은 새 규칙의 등급이나 계산식이 아닙니다.</p>
      <div className="gurps-cp-total">
        <span className="cp-number">{cp.total ?? '—'}</span>
        <span className="cp-label">CP</span>
        {band && <span className="cp-note">{band}</span>}
      </div>
      <div className="gurps-cp-breakdown">
        <h4>기록된 CP 내역</h4>
        <div className="cp-row"><span>능력치</span><span>{cp.attributes ?? '—'} CP</span></div>
        <div className="cp-row"><span>장점</span><span>{cp.advantages ?? '—'} CP</span></div>
        <div className="cp-row"><span>단점</span><span>{cp.disadvantages ?? '—'} CP</span></div>
        <div className="cp-row"><span>기술</span><span>{cp.skills ?? '—'} CP</span></div>
        <div className="cp-row" data-legacy-field="cp.spent"><span>사용</span><span>{cp.spent ?? '—'} CP</span></div>
        <div className="cp-row"><span>미사용</span><span>{cp.unspent ?? '—'} CP</span></div>
        <div className="cp-row cp-sum"><span>합계</span><span>{cp.total ?? '—'} CP</span></div>
      </div>
      {advantages.length > 0 && (
        <div className="gurps-advantages">
          <h3>장점</h3>
          {advantages.map((adv, i) => (
            <div key={i} className="adv-row">
              <span className="adv-name">{adv.name}</span>
              <span className="adv-cp">{adv.cp} CP</span>
            </div>
          ))}
        </div>
      )}
      {disadvantages.length > 0 && (
        <div className="gurps-disadvantages">
          <h3>단점</h3>
          {disadvantages.map((d, i) => (
            <div key={i} className="adv-row">
              <span className="adv-name">{d.name}</span>
              <span className="adv-cp">{d.cp} CP</span>
            </div>
          ))}
        </div>
      )}
      <div className="gurps-attrs">
        {(['ST', 'DX', 'IQ', 'HT'] as const).map(key => {
          const a = attrs[key]
          if (!a) return null
          return (
            <div key={key} className="gurps-attr">
              <span className="attr-key">{key}</span>
              <span className="attr-value">{a.value ?? '—'}{a?.cp != null ? <small className="attr-cp"> ({a.cp} CP)</small> : null}</span>
            </div>
          )
        })}
      </div>
      <div className="gurps-derived">
        <h3>기록된 보조 수치</h3>
        {(['HP', 'FP', 'Will', 'Per', 'BasicSpeed', 'BasicMove', 'BasicLift', 'Dodge'] as const).map(key =>
          <div className="derived-row" key={key} data-legacy-field={'secondary.' + key}><span>{key}</span><span>{secondary[key] ?? '—'}</span></div>)}
      </div>
      {skills.length > 0 && (
        <div className="gurps-skills">
          <h3>기술</h3>
          {skills.map((s, i) => (
            <div key={i} className="skill-row">
              <span className="skill-name">{s.ko || s.name}</span>
              <span className="skill-level">{s.level ?? '—'}{s.cp != null ? <small className="skill-cp"> ({s.cp} CP)</small> : null}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

type SheetIdentity = { readonly id: string; readonly personId: string; readonly name: string; readonly state: string }
type PreservedSelection = { readonly ok: true; readonly sheet: GurpsSheetData; readonly record: Readonly<Record<string, unknown>>; readonly revision: string }
  | { readonly ok: false; readonly error: string }
const sheetRevisions = Object.entries(preservationBaseline.revisions)

export function selectPreservedSheet(payload: unknown, identity: SheetIdentity, revision: string): PreservedSelection {
  const reject = (error: string): PreservedSelection => ({ ok: false, error })
  if (!sheetRevisions.some(([key]) => key === revision)) return reject('E_EXPLICIT_REVISION')
  if (!isRecord(payload) || payload.schema !== 'wiki-person-sheet.v1' || !Array.isArray(payload.variants) || payload.variants.length !== sheetRevisions.length) return reject('E_PERSON_SHEET_REVISIONS')
  if (payload.currentState !== identity.state) return reject('E_PERSON_SHEET_CURRENT_STATE')
  let selected: PreservedSelection = reject('E_PERSON_SHEET_REVISIONS')
  for (const [key, seal] of sheetRevisions) {
    const variants = payload.variants.filter((value: unknown) => isRecord(value) && value.revision === key)
    if (variants.length !== 1) return reject('E_PERSON_SHEET_REVISIONS')
    const variant: unknown = variants[0]
    if (!isRecord(variant) || variant.ledgerSha256 !== seal.ledgerSha256 || !isRecord(variant.legacy) || variant.legacy.operative !== false || !isRecord(variant.legacy.record)) return reject('E_PERSON_SHEET_LEGACY')
    const rules = variant.rules
    if (!isRecord(rules) || rules.sourceRevision !== key || rules.rulesVersion !== 'seoul.opposed-d10.v1' || rules.resolution !== 'opposed-d10' || rules.numericAdoption !== false || rules.originalRatings !== null || rules.legacyValues !== 'immutable-not-d10-ratings') return reject('E_PERSON_SHEET_RULES')
    const record = variant.legacy.record
    const nameChange = (nameChanges as Record<string, { personId: string; historicalName: string; currentName: string }>)[identity.id]
    const nameMatches = record.name === identity.name || (nameChange?.personId === identity.personId && nameChange.historicalName === record.name && nameChange.currentName === identity.name)
    if (record.id !== identity.id || !nameMatches || record.url !== '/people/' + identity.personId || (record.personId !== undefined && record.personId !== identity.personId)) return reject('E_PERSON_SHEET_IDENTITY')
    if (typeof record.state !== 'string' || variant.historicalState !== record.state) return reject('E_PERSON_SHEET_HISTORICAL_STATE')
    const parsed = parseGurpsSheet(record, identity.personId)
    if (!parsed.ok) return reject(parsed.error)
    if (key === revision) selected = { ok: true, sheet: parsed.sheet, record, revision }
  }
  return selected
}

export function PreservedPersonSheet({ payload, identity }: { readonly payload: unknown; readonly identity: SheetIdentity }): JSX.Element {
  const [revision, setRevision] = useState('')
  const selected = revision ? selectPreservedSheet(payload, identity, revision) : null
  return <section className="person-data-section" data-person-sheet>
    <h2>인물 시트</h2>
    <p data-original-ratings="unassigned">새 규칙은 d10 대항 판정, 등급 0–12, 합산 보정 −4–+4입니다. 이 인물의 새 등급과 보정은 미배정입니다.</p>
    <div className="people-filters">
      <label htmlFor={'sheet-revision-' + identity.personId}>역사 시트 리비전</label>
      <select id={'sheet-revision-' + identity.personId} value={revision} onChange={event => setRevision(event.currentTarget.value)}>
        <option value="">리비전을 선택하세요</option>
        {sheetRevisions.map(([key]) => <option key={key} value={key}>{key.slice(0, 8)}</option>)}
      </select>
    </div>
    {!selected && <p role="status">열람할 원본 리비전을 직접 선택하세요.</p>}
    {selected && !selected.ok && <p role="alert">시트를 표시할 수 없습니다. 원본 결속을 확인하세요. ({selected.error})</p>}
    {selected?.ok && <div data-selected-revision={selected.revision} data-legacy-operative="false">
      <p>원본 리비전: <code>{selected.revision}</code></p>
      <p data-sheet-affiliation>현재 소속: {identity.state} · 이 판본의 소속: {String(selected.record.state)}</p>
      <GurpsSheet gurps={selected.sheet} />
      <details key={selected.revision} data-legacy-record>
        <summary>역사 기록 전체 · 모든 필드와 근거</summary>
        <pre>{JSON.stringify(selected.record, null, 2)}</pre>
      </details>
    </div>}
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
            person.characterId !== summary.characterId || person.detailRoute !== summary.detailRoute ||
            person.gurps?.id !== summary.characterId || person.gurps?.personId !== summary.id) throw new Error('E_PERSON_DETAIL_IDENTITY')
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
      <p><Link to={`/tools/character-art?person=${encodeURIComponent(detail.id)}`}>이 인물의 아트 작업 도구 열기</Link></p>
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

          <PreservedPersonSheet key={personId} payload={detail.personSheet} identity={{ id: detail.characterId, personId, name: detail.name, state: detail.state }} />
          {detail.unit && <section className="gurps-unit">
            <h2>부대</h2>
            <p>{detail.unit.type} · {detail.unit.size}명 · {detail.unit.quality}</p>
            <p>편성: {detail.unit.composition.join(', ')}</p>
            <p>{detail.unit.note}</p>
          </section>}
          {detail.sovereignTitle && <DataTable title="작위와 직위" rows={[["작위", detail.sovereignTitle.formalTitle], ["등급", detail.sovereignTitle.formalTitleRank], ["직위", detail.sovereignTitle.office]]} />}
          {detail.retinueGroups?.map(group => <section key={group.id} data-retinue-group={group.id}><h2>{group.name.ko}</h2><p>{group.count}기 · 민웅기 직속</p><p>{group.duties.join(' · ')}</p></section>)}
          {!!detail.confirmedHoldings?.length && <section className="gurps-territory-confirmed" data-confirmed-holdings>
            <h2>보유 영지와 시설</h2>
            {detail.confirmedHoldings.map((holding) => <section key={holding.id} data-holding-id={holding.id}>
              <h3>{holding.name.ko}</h3>
              {holding.stationRef && <p data-owned-station={holding.stationRef.stationId}>{holding.stationRef.stationName}역</p>}
              {holding.adminRefs.length > 0 && <ul>{holding.adminRefs.map((region) => <li key={region.id} data-admin-ref={region.id}>{region.name}</li>)}</ul>}
              {holding.facilityRef && <p data-facility-layer={holding.facilityRef.layerId}>{holding.facilityRef.stationName} · {holding.facilityRef.layerName}</p>}
            </section>)}
          </section>}
          {!detail.confirmedHoldings?.length && detail.territory && <section className="gurps-territory">
            <h2>영지</h2>
            <p>{detail.territory.fief_name} · {detail.territory.type}</p>
            <p>위치: {detail.territory.station} · {detail.territory.state}</p>
            <p>{detail.territory.settlement.name} · {detail.territory.settlement.type}</p>
            <p>{detail.territory.settlement.description}</p>
            <p>{detail.territory.note}</p>
          </section>}
          {detail.wandering_force && <section className="gurps-wandering">
            <h2>야영지와 유랑 부대</h2>
            <p>{detail.wandering_force.type} · {detail.wandering_force.size}명</p>
            <p>현재 위치: {detail.wandering_force.current_location}</p>
            <p>{detail.wandering_force.camp.name} · {detail.wandering_force.camp.type}</p>
            <p>{detail.wandering_force.camp.description}</p>
            <p>시설: {detail.wandering_force.camp.facilities.join(', ')}</p>
            <p>철수 준비: {detail.wandering_force.camp.pack_up_time}</p>
            <p>{detail.wandering_force.note}</p>
          </section>}
          <ValuesDesireSection detail={detail} />

          <p><Link to={detail.sourceRoute}>정본 원문 위치로 이동</Link></p>
          <p><Link to={`/people/art?person=${encodeURIComponent(detail.id)}`}>이 인물로 아트 도구 열기</Link></p>
        </div>
      </div>
      {feedback && feedbackBound && <FeedbackComposer rootRef={proseRef} documentInfo={feedback} locale="ko" />}
    </article>
  )
}
