import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { peopleCatalog } from '../generated/peopleCatalog'
import FeedbackComposer from '../components/FeedbackComposer'
import { FeedbackSurface } from '../components/FeedbackSurface'
import { personFeedbackDocument, type FeedbackDocument } from '../feedbackSelection'

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
  relations: { outgoing: Relation[]; incoming: Relation[] }
}

const sectionOrder = ['생애', '관직', '무공', '일화', '가문', '관계', '야망', '공포', '개입']

function DataTable({ title, rows }: { title: string; rows: Array<Array<string | number | null>> }) {
  return (
    <section className="person-data-section">
      <h2>{title}</h2>
      <div className="wiki-table-wrap"><table className="person-data-table"><tbody>{rows.map((row, i) => <tr key={i}><th>{row[0]}</th><td>{row[1] === null || row[1] === undefined ? '—' : String(row[1])}</td></tr>)}</tbody></table></div>
    </section>
  )
}

async function fetchGurps(personId: string) {
  try {
    const id = personId.startsWith('person-') ? personId : 'person-' + personId
    const res = await fetch('/api/characters/' + id)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

function GurpsSection({ personId }: { personId: string }): JSX.Element | null {
  const [gurps, setGurps] = useState<any>(null)

  useEffect(() => {
    if (!personId) return
    fetchGurps(personId).then(data => setGurps(data))
  }, [personId])

  if (!gurps) return null

  const attrs = gurps.attributes || {}
  const attrExplain: Record<string, { icon: string; desc: string }> = {
    ST: { icon: '💪', desc: '힘 — 피해량·무게·HP 결정' },
    DX: { icon: '🏃', desc: '민첩 — 명중률·회피·전투 기술 기반' },
    IQ: { icon: '🧠', desc: '지능 — 지각·의지·전략 기반' },
    HT: { icon: '❤️', desc: '건강 — 피로·생존·회복' },
  }
  const skillExplain: Record<string, string> = {
    '총검술': '총검 찌르기 명중률. 부대 전투력 직결',
    '검법': '도검 베기·찌르기 명중률',
    '창술': '장창 찌르기. 리치 우선권',
    '궁술': '활 명중률. 원거리 지원',
    '암기술': '투척 무기 명중률. 암습 보정',
    '경공': '이동력 증가. 회피 보정',
    '보법': '균형 유지. 넉다운 저항',
    '권법': '맨손 타격 기술',
    '지휘': '부대 사기·통제력. 도주 판정 보정',
    '전략': '부대 전체 행동 보정',
    '전술': '소부대 교전 보정',
    '외교': '협상 성공률',
    '정치': '권력 획득·유지',
    '처세': '사회적 상황 대응',
  }

  const cp = gurps.cp || {}
  const attrSum = Object.values(attrs).reduce((s: number, a: any) => s + (a?.cp || 0), 0)
  const skills = gurps.skills || []
  const unit = gurps.unit || {}
  const territory = gurps.territory
  const wandering = gurps.wandering_force

  return (
    <section className="gurps-sheet">
      <h2>겁스 능력치</h2>
      <div className="gurps-cp-total">
        <span className="cp-number">{cp.total ?? '—'}</span>
        <span className="cp-label">CP</span>
        <span className="cp-note">{(cp.total || 0) >= 200 ? '주요 인물 (200~300)' : (cp.total || 0) >= 125 ? '훈련 (125~200)' : '일반 (75~125)'}</span>
      </div>
      <div className="gurps-cp-breakdown">
        <h4>CP 계산 내역</h4>
        <div className="cp-row"><span>능력치</span><span>{cp.attributes ?? attrSum} CP</span></div>
        <div className="cp-row"><span>장점</span><span>+{cp.advantages ?? 0} CP</span></div>
        <div className="cp-row"><span>단점</span><span>{cp.disadvantages ?? 0} CP</span></div>
        <div className="cp-row"><span>기술</span><span>+{cp.skills ?? 0} CP</span></div>
        <div className="cp-row cp-sum"><span>합계</span><span>{cp.total ?? '—'} CP</span></div>
      </div>
      {gurps.advantages && gurps.advantages.length > 0 && (
        <div className="gurps-advantages">
          <h3>장점 (CP 포함)</h3>
          {(gurps.advantages || []).map((adv: any, i: number) => (
            <div key={i} className="adv-row" title={adv.effect || ''}>
              <span className="adv-name">{adv.name}</span>
              <span className="adv-cp">{adv.cp > 0 ? '+' + adv.cp : adv.cp} CP</span>
              {adv.effect && <span className="adv-effect">{adv.effect}</span>}
            </div>
          ))}
        </div>
      )}
      {gurps.disadvantages && gurps.disadvantages.length > 0 && (
        <div className="gurps-disadvantages">
          <h3>단점 (CP 환급)</h3>
          {(gurps.disadvantages || []).map((d: any, i: number) => (
            <div key={i} className="adv-row" title={d.effect || ''}>
              <span className="adv-name">{d.name}</span>
              <span className="adv-cp">{d.cp} CP</span>
              {d.effect && <span className="adv-effect">{d.effect}</span>}
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
              <span className="attr-value">{a.value ?? a}{a?.cp != null ? <small className="attr-cp"> ({a.cp} CP)</small> : null}</span>
              <span className="attr-desc">{ex.desc}</span>
            </div>
          )
        })}
      </div>
      <div className="gurps-derived">
        <h3>파생 수치 (능력치에서 자동 계산, 추가 CP 불필요)</h3>
        <div className="derived-row"><span>HP 체력</span><span>{attrs?.ST?.value ?? '—'}</span><span>= ST — 0 이하 기절, −5×ST 사망</span></div>
        <div className="derived-row"><span>FP 피로</span><span>{attrs?.HT?.value ?? '—'}</span><span>= HT — 장기전 유지, 0 이하 행동 불가</span></div>
        <div className="derived-row"><span>Will 의지</span><span>{attrs?.IQ?.value ?? '—'}</span><span>= IQ — 공포 판정·도주 판정 기반</span></div>
        <div className="derived-row"><span>Per 지각</span><span>{attrs?.IQ?.value ?? '—'}</span><span>= IQ — 매복 발견·정찰</span></div>
        <div className="derived-row"><span>Speed</span><span>{Math.floor((((attrs?.DX?.value ?? 10) + (attrs?.HT?.value ?? 10)) / 4) * 10) / 10}</span><span>= (DX+HT)÷4 — 행동 순서 결정</span></div>
        <div className="derived-row"><span>Dodge 회피</span><span>{Math.floor((attrs?.DX?.value ?? 10) + (attrs?.HT?.value ?? 10)) / 4 + 3}</span><span>= Speed+3 — 피하기 능동 방어</span></div>
      </div>
      {skills.length > 0 && (
        <div className="gurps-skills">
          <h3>기술</h3>
          {skills.map((s: any, i: number) => (
            <div key={i} className="skill-row" title={skillExplain[s.name] || skillExplain[s.ko] || ''}>
              <span className="skill-name">{s.ko || s.name}</span>
              <span className="skill-level">{s.level}{s.cp ? <small className="skill-cp"> ({s.cp}CP)</small> : null}</span>
              {skillExplain[s.name || s.ko] && <span className="skill-effect">{skillExplain[s.name || s.ko]}</span>}
            </div>
          ))}
        </div>
      )}
      {unit && unit.type && (
        <div className="gurps-unit">
          <h3>부대</h3>
          <p>⚙ {unit.type} — {unit.size}명 ({unit.quality})</p>
          {unit.note && <p className="unit-note">{unit.note}</p>}
        </div>
      )}
      {territory && (
        <div className="gurps-territory">
          <h3>영지</h3>
          <p>🏰 {territory.fief_name} ({territory.type})</p>
          <p>🏠 정착지: {territory.settlement?.name || territory.fief_name + ' 정착지'}</p>
        </div>
      )}
      {wandering && (
        <div className="gurps-wandering">
          <h3>유랑 부대</h3>
          <p>⛺ {wandering.type} — 현재: {wandering.current_location}</p>
          {wandering.camp && <p>🏕 야영지: {wandering.camp.name}</p>}
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
  const summary: any = peopleCatalog.find((person) => person.id === personId)
  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const proseRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<FeedbackDocument | null>(null)

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
    let active = true
    setFeedback(null)
    if (detail) void personFeedbackDocument(detail).then((value) => { if (active) setFeedback(value) })
    return () => { active = false }
  }, [detail])

  useEffect(() => {
    if (!summary) return
    document.title = `${summary.name} | 서울:전국 공식 위키`
    return () => { document.title = '서울:전국 — 공식 위키' }
  }, [summary])

  if (!summary || failed) return <Navigate to="/people" replace />
  if (!detail) return <div className="wiki-loading" role="status">인물 상세를 불러오고 있습니다.</div>

  const person: any = detail
  const basicRows: Array<Array<string | number | null>> = [
    ['이름', person.name], ['국가', person.stateName || '무소속'], ['국가 ID', person.state],
    ['직위', person.position], ['직급(공통 티어)', person.commonTier], ['국가 품계', person.rank], ['직업', person.occupation], ['성별', person.gender], ['단계', person.stage], ['세대', person.generation],
    ...Object.entries(person.fields ?? {}).filter(([label]) => !['가치관', '욕망', '직위', '소속'].includes(label)),
  ]
  const relationRows = [
    ...detail.relations.outgoing.map((relation) => [`→ ${relation.to} · ${relation.type}`, relation.basis] as Array<string>),
    ...detail.relations.incoming.map((relation) => [`← ${relation.from} · ${relation.type}`, relation.basis] as Array<string>),
  ]

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
      <div className="person-detail-layout">
        <aside className="person-data-panel" aria-label="인물 구조화 데이터">
          <DataTable title="기본 정보" rows={basicRows} />
          <DataTable title="관계" rows={relationRows.length ? relationRows : [['관계', '등록된 방향성 관계 없음']]} />
        </aside>
        <div className="wiki-prose person-canon-prose">
          <h2>정본 상세</h2>
          {feedback ? <FeedbackSurface rootRef={proseRef} documentInfo={feedback} selector="section[data-feedback-section] p, section[data-feedback-section] li, details[data-feedback-biography] p, details[data-feedback-biography] li">
            {sectionOrder.filter((label) => (detail.sections as any)[label]).map((label) => (
              <section key={label} data-feedback-section={label}><h3>{label}</h3><ReactMarkdown remarkPlugins={[remarkGfm]}>{(detail.sections as any)[label]}</ReactMarkdown></section>
            ))}
          <details data-feedback-biography><summary>정본 카드 원문 전체</summary><ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.biography}</ReactMarkdown></details>
          </FeedbackSurface> : null}

          <GurpsSection personId={personId || ''} />
          <ValuesDesireSection detail={detail} />

          <p><Link to={detail.sourceRoute}>정본 원문 위치로 이동</Link></p>
        </div>
      </div>
      {feedback && <FeedbackComposer rootRef={proseRef} documentInfo={feedback} locale="ko" />}
    </article>
  )
}
