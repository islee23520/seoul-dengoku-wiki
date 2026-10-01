import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { peopleCatalog } from '../generated/peopleCatalog'
import portraitCatalog from '../../portrait-catalog.json'
import FeedbackComposer from '../components/FeedbackComposer'
import { FeedbackSurface } from '../components/FeedbackSurface'
import { useFeedbackDocument } from '../hooks/useFeedbackDocument'

type Relation = { from: string; type: string; to: string; basis: string }
type PersonDetail = (typeof peopleCatalog)[number] & {
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
  directLiege?: { personId: string; name: string; courtId: string; effectiveYear: number }
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

type SheetAttr = { value?: number; cp?: number }
type SheetTrait = { name: string; kind: string; cp?: number; rule?: string }
type SheetSkill = { name?: string; ko?: string; level?: number; cp?: number }
type SheetCp = { total?: number; attributes?: number; advantages?: number; disadvantages?: number; skills?: number; unspent?: number }
type SheetSecondary = { HP?: number; FP?: number; Will?: number; Per?: number; BasicSpeed?: number; Dodge?: number }

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
  if (payload.personId !== personId && payload.url !== '/people/' + personId) return reject('시트 신원이 요청한 인물과 다르다')

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

  const cp = pickNumbers('cp', payload.cp, ['total', 'attributes', 'advantages', 'disadvantages', 'skills', 'unspent'])
  if (typeof cp === 'string') return reject(cp)
  const secondary = pickNumbers('secondary', payload.secondary, ['HP', 'FP', 'Will', 'Per', 'BasicSpeed', 'Dodge'])
  if (typeof secondary === 'string') return reject(secondary)

  return { ok: true, sheet: { band, attributes, traits, skills, cp: cp as SheetCp, secondary: secondary as SheetSecondary } }
}

async function fetchGurps(personId: string): Promise<GurpsParseResult | null> {
  try {
    const id = personId.startsWith('person-') ? personId : 'person-' + personId
    const res = await fetch('/api/characters/' + id)
    if (!res.ok) return null
    return parseGurpsSheet(await res.json(), id)
  } catch { return null }
}

function GurpsSection({ personId }: { personId: string }): JSX.Element | null {
  const [sheet, setSheet] = useState<GurpsSheetData | null>(null)

  useEffect(() => {
    setSheet(null)
    if (!personId) return
    let active = true
    fetchGurps(personId).then((result) => {
      if (active && result?.ok) setSheet(result.sheet)
    })
    return () => { active = false }
  }, [personId])

  if (!sheet) return null
  return <GurpsSheet gurps={sheet} />
}

export function GurpsSheet({ gurps }: { gurps: GurpsSheetData }): JSX.Element {
  const attrs = gurps.attributes
  const attrExplain: Record<string, { icon: string; desc: string }> = {
    ST: { icon: '💪', desc: '힘 · 기본 HP와 운반력의 기준' },
    DX: { icon: '🏃', desc: '민첩 · 기본 Speed의 기준' },
    IQ: { icon: '🧠', desc: '지능 · 기본 Will과 Per의 기준' },
    HT: { icon: '❤️', desc: '건강 · 기본 FP와 Speed의 기준' },
  }

  const cp = gurps.cp
  const skills = gurps.skills
  const advantages = gurps.traits.filter((trait) => trait.kind === 'advantage')
  const disadvantages = gurps.traits.filter((trait) => trait.kind === 'disadvantage')
  const secondary = gurps.secondary
  const band = gurps.band

  return (
    <section className="gurps-sheet">
      <h2>겁스 능력치</h2>
      <div className="gurps-cp-total">
        <span className="cp-number">{cp.total ?? '—'}</span>
        <span className="cp-label">CP</span>
        {band && <span className="cp-note">{band}</span>}
      </div>
      <div className="gurps-cp-breakdown">
        <h4>CP 계산 내역</h4>
        <div className="cp-row"><span>능력치</span><span>{cp.attributes ?? '—'} CP</span></div>
        <div className="cp-row"><span>장점</span><span>{cp.advantages ?? '—'} CP</span></div>
        <div className="cp-row"><span>단점</span><span>{cp.disadvantages ?? '—'} CP</span></div>
        <div className="cp-row"><span>기술</span><span>{cp.skills ?? '—'} CP</span></div>
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
          const ex = attrExplain[key]
          return (
            <div key={key} className="gurps-attr" title={ex.desc}>
              <span className="attr-icon">{ex.icon}</span>
              <span className="attr-key">{key}</span>
              <span className="attr-value">{a.value ?? '—'}{a?.cp != null ? <small className="attr-cp"> ({a.cp} CP)</small> : null}</span>
              <span className="attr-desc">{ex.desc}</span>
            </div>
          )
        })}
      </div>
      <div className="gurps-derived">
        <h3>파생 수치</h3>
        <div className="derived-row"><span>HP 체력</span><span>{secondary.HP ?? '—'}</span><span>기본값: ST</span></div>
        <div className="derived-row"><span>FP 피로</span><span>{secondary.FP ?? '—'}</span><span>기본값: HT</span></div>
        <div className="derived-row"><span>Will 의지</span><span>{secondary.Will ?? '—'}</span><span>기본값: IQ</span></div>
        <div className="derived-row"><span>Per 지각</span><span>{secondary.Per ?? '—'}</span><span>기본값: IQ</span></div>
        <div className="derived-row"><span>Speed</span><span>{secondary.BasicSpeed ?? '—'}</span><span>기본값: (DX+HT)÷4</span></div>
        <div className="derived-row"><span>Dodge 회피</span><span>{secondary.Dodge ?? '—'}</span><span>기본값: ⌊Speed⌋+3{advantages.some((trait) => trait.rule === 'combat-reflexes') ? ', Combat Reflexes +1' : ''}</span></div>
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
      .then((person) => { if (active) setDetail(person) })
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
    ['직위', person.position], ['직급(공통 티어)', person.commonTier], ['국가 품계', person.rank], ['직업', person.occupation], ['성별', person.gender], ['단계', person.stage], ['세대', person.generation],
    ...Object.entries(person.fields ?? {}).filter(([label]) => !['가치관', '욕망', '직위', '소속'].includes(label)),
  ]
  const relationRows = [
    ...(detail.directLiege ? [[`직속 주군 · ${detail.directLiege.name}`, `2126년 · ${detail.directLiege.courtId} 소속 가신`]] : []),
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
          {detail.clan && (
            <p className="person-clan-line">
              <img src={`${import.meta.env.BASE_URL}${detail.clan.crest.startsWith('/') ? '' : '/'}${detail.clan.crest}`} alt={`${detail.clan.name} 문장`} width="64" height="64" loading="lazy" />
              <Link to={`/families/${detail.clan.id}`} className="wiki-link">{detail.clan.name}</Link>
            </p>
          )}
        </div>
        <span className="wiki-canon-badge">정본</span>
      </header>
      <p><Link to={`/tools/character-art?person=${encodeURIComponent(detail.id)}`}>이 인물의 아트 작업 도구 열기</Link></p>
      <div className="person-detail-layout">
        <aside className="person-data-panel" aria-label="인물 구조화 데이터">
          {portraitCatalog.entries.some((entry) => entry.personId === detail.id && entry.name === detail.name) && <figure>
            <img className="people-portrait" src={`${import.meta.env.BASE_URL}portraits/${detail.id}.png`} alt={`${detail.name} 초상 아트 제안`} />
            <figcaption>초상 아트 제안 · <a href={`${import.meta.env.BASE_URL}portrait-tokens/${detail.id}.json`}>디자인 토큰</a></figcaption>
          </figure>}
          <DataTable title="기본 정보" rows={basicRows} />
          <DataTable title="관계" rows={relationRows.length ? relationRows : [['관계', '등록된 방향성 관계 없음']]} />
        </aside>
        <div className="wiki-prose person-canon-prose">
          <h2>정본 상세</h2>
          {feedback ? <FeedbackSurface rootRef={proseRef} documentInfo={feedback} onBound={setFeedbackBound}>{canonicalProse}</FeedbackSurface> : <><PersonSections sections={detail.sections} /><details><summary>정본 카드 원문 전체</summary><ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.biography}</ReactMarkdown></details></>}

          <GurpsSection personId={personId} />
          <ValuesDesireSection detail={detail} />

          <p><Link to={detail.sourceRoute}>정본 원문 위치로 이동</Link></p>
          <p><Link to={`/people/art?person=${encodeURIComponent(detail.id)}`}>이 인물로 아트 도구 열기</Link></p>
        </div>
      </div>
      {feedback && feedbackBound && <FeedbackComposer rootRef={proseRef} documentInfo={feedback} locale="ko" />}
    </article>
  )
}
