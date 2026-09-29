import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { peopleCatalog } from '../generated/peopleCatalog'

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
      <div className="wiki-table-wrap"><table className="person-data-table"><tbody>{rows.map(([label, value]) => <tr key={label}><th>{label}</th><td>{value === null ? '—' : String(value)}</td></tr>)}</tbody></table></div>
    </section>
  )
}


async function fetchGurps(personId: string) {
  try {
    const res = await fetch('/api/characters/person-' + personId)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}


function GurpsSection({ personId }: { personId: string }): JSX.Element | null {
  const [gurps, setGurps] = useState<any>(null)

  useEffect(() => {
    fetchGurps(personId).then(data => setGurps(data))
  }, [personId])

  if (!gurps) return null

  const attrs = gurps.attributes || {}
  const attrExplain: Record<string, { icon: string; desc: string }> = {
    ST: { icon: '💪', desc: '힘 — 피해량·무게·HP 결정. 총검 찌르기 피해 증가, 무거운 갑옷 착용 가능' },
    DX: { icon: '🏃', desc: '민첩 — 명중률·회피·전투 기술 기반. 스킬 습득 속도, 회피 능동 방어' },
    IQ: { icon: '🧠', desc: '지능 — 지각·의지·전략 기반. 부대 지휘, 매복 발견, 공포 저항' },
    HT: { icon: '❤️', desc: '건강 — 피로·생존·회복. 장시간 전투 유지, 부상 회복 속도' },
  }

  const skillExplain: Record<string, string> = {
    '총검술': '총검 찌르기 명중률. 부대 전투력 직결',
    '검법': '도검 베기·찌르기 명중률',
    '창술': '장창 찌르기. 리치 우선권',
    '궁술': '활 명중률. 원거리 지원',
    '암기술': '투척 무기 명중률. 암습 보정',
    '경공': '이동력 증가. 회피 보정',
    '보법': '균형 유지. 넉다운 저항',
    '권법': '맨손 타격 기술. 무기 없이 전투 가능',
    '지휘': '부대 사기·통제력. 도주 판정 보정',
    '전략': '부대 전체 행동 보정. 전장 선택',
    '전술': '소부대 교전 보정. 매복 설정',
    '외교': '협상 성공률. 세력 관계 개선',
    '정치': '권력 획득·유지. 음모 저항',
    '처세': '사회적 상황 대응. 인상 관리',
  }

  const cp = gurps.cp || {}
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

      <div className="gurps-attrs">
        {(['ST', 'DX', 'IQ', 'HT'] as const).map(key => {
          const a = attrs[key]
          if (!a) return null
          const ex = attrExplain[key]
          return (
            <div key={key} className="gurps-attr" title={ex.desc}>
              <span className="attr-icon">{ex.icon}</span>
              <span className="attr-key">{key}</span>
              <span className="attr-value">{a.value ?? a}</span>
              <span className="attr-desc">{ex.desc}</span>
            </div>
          )
        })}
      </div>

      {skills.length > 0 && (
        <div className="gurps-skills">
          <h3>기술</h3>
          {skills.map((s: any, i: number) => (
            <div key={i} className="skill-row" title={skillExplain[s.name] || ''}>
              <span className="skill-name">{s.name}</span>
              <span className="skill-level">{s.level}</span>
              {skillExplain[s.name] && <span className="skill-effect">{skillExplain[s.name]}</span>}
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
            renderAxis(name, val as number, valueMeta)
          )}
        </div>
      )}
      {desire && (
        <div className="desire-block">
          <h2>욕망</h2>
          {Object.entries(desire).map(([name, val]) => {
            if (typeof val !== 'number') return null
            return renderAxis(name, val as number, desireMeta)
          })}
          <div className="desire-extras">
            {desire['지향'] && <p>🧭 지향: {desire['지향']}</p>}
            {desire['결합'] && <p>💍 결합: {desire['결합']}</p>}
          </div>
        </div>
      )}
    </section>
  )
}

export function PersonDetailPage(): JSX.Element {
  const { personId } = useParams<{ personId: string }>()
  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [failed, setFailed] = useState(false)

  const summary: any = peopleCatalog.find(p => p.id === personId)

  useEffect(() => {
    if (!summary) return
    let active = true
    setDetail(null)
    setFailed(false)
    void fetch(`${import.meta.env.BASE_URL}person-details/${summary.id}.json`)
      .then(response => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json()
      })
      .then(data => { if (active) setDetail(data as PersonDetail) })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [summary])

  if (!summary) return <Navigate to="/wiki/people" replace />

  const person = (detail as Record<string, any>) ?? (summary as unknown as Record<string, any>)

  return (
    <main className="wiki-prose person-detail">
      <header className="person-header">
        <h1>{person.name}</h1>
        {person.title && <p className="person-title">{person.title}</p>}
        <div className="person-meta">
          {person.state && <span className="person-state">{person.state}</span>}
          {person.position && <span className="person-position">{person.position}</span>}
          {person.rank && <span className="person-rank">{person.rank}</span>}
        </div>
      </header>

      {failed && (
        <p className="person-load-failed">인물 상세 정보를 불러오지 못했습니다.</p>
      )}

      {!detail && !failed && (
        <p className="person-loading">인물 정보를 불러오는 중…</p>
      )}

      {detail && (
        <>
          {detail.biography && (
            <section className="person-biography">
              <h2>생애</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.biography}</ReactMarkdown>
            </section>
          )}

          {Object.keys(detail.fields ?? {}).length > 0 && (
            <section className="person-fields">
              <h2>기본 정보</h2>
              <DataTable title="기본" rows={(Object.entries(detail.fields) as Array<[string, any]>).map(([k, v]) => [k, v])} />
            </section>
          )}

          <GurpsSection personId={personId ?? ''} />

          <ValuesDesireSection detail={detail} />

          {(Object.entries(detail.sections ?? {}) as Array<[string, string]>).map(([sectionTitle, body]) => (
            <section key={sectionTitle} className="person-section">
              <h2>{sectionTitle}</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </section>
          ))}

          {(detail.relations?.outgoing?.length > 0 || detail.relations?.incoming?.length > 0) && (
            <section className="person-relations">
              <h2>관계</h2>
              {detail.relations.outgoing.length > 0 && (
                <DataTable
                  title="→ 주변 인물"
                  rows={detail.relations.outgoing.map(r => [r.to, r.type, r.basis])}
                />
              )}
              {detail.relations.incoming.length > 0 && (
                <DataTable
                  title="← 주변 인물"
                  rows={detail.relations.incoming.map(r => [r.from, r.type, r.basis])}
                />
              )}
            </section>
          )}

          {detail.sources && detail.sources.length > 0 && (
            <section className="person-sources">
              <h2>출처</h2>
              <ul>
                {detail.sources.map(s => <li key={s}>{s}</li>)}
              </ul>
            </section>
          )}
        </>
      )}

      <div className="person-nav">
        <Link to="/wiki/people">← 인물 목록</Link>
      </div>
    </main>
  )
}

export default PersonDetailPage
