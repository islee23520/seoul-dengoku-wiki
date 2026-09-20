import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { peopleCatalog } from '../generated/peopleCatalog'

type Relation = { from: string; type: string; to: string; basis: string }
type PersonDetail = (typeof peopleCatalog)[number] & {
  generation: string
  minors: boolean
  sourceKind: string
  locked: boolean
  values: Record<string, number>
  desire: Record<string, number | string>
  fields: Record<string, string>
  sections: Record<string, string>
  biography: string
  sources: string[]
  relations: { outgoing: Relation[]; incoming: Relation[] }
}

const sectionOrder = ['생애', '관직', '무공', '일화', '가문', '관계', '야망', '공포', '개입']
const battleRoleLabels: Record<string, string> = { formation: '진형', screening: '엄호', pressure: '압박', 'route-control': '경로 통제', sustain: '지속 지원', repair: '정비', triage: '응급 처치', supply: '보급', negotiation: '교섭', covert: '은밀 공작', recon: '정찰', records: '기록' }
const effectFamilyLabels: Record<string, string> = { morale: '사기', medicine: '의료', agitation: '선동', gear: '장비', information: '정보', 'physical-ai-tech': '피지컬 에이아이 기술' }
const campaignRoleLabels: Record<string, string> = { diplomacy: '외교', assassination: '암살', sabotage: '방해 공작', intelligence: '정보 활동' }
const labelsFor = (values: readonly string[], labels: Record<string, string>) => values.map((value) => labels[value] ?? value).join(' · ')

function DataTable({ title, rows }: { title: string; rows: Array<[string, string | number]> }) {
  return (
    <section className="person-data-section">
      <h2>{title}</h2>
      <div className="wiki-table-wrap"><table className="person-data-table"><tbody>{rows.map(([label, value]) => <tr key={label}><th>{label}</th><td>{String(value)}</td></tr>)}</tbody></table></div>
    </section>
  )
}

export default function PersonDetailPage() {
  const { personId } = useParams()
  const summary = peopleCatalog.find((person) => person.id === personId)
  const [detail, setDetail] = useState<PersonDetail | null>(null)
  const [failed, setFailed] = useState(false)

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

  const basicRows: Array<[string, string | number]> = [
    ['이름', detail.name], ['국가', detail.stateName || '무소속'], ['국가 ID', detail.state],
    ['직위', detail.position], ['직급(공통 티어)', detail.commonTier], ['국가 품계', detail.rank], ['직업', detail.occupation], ['성별', detail.gender], ['단계', detail.stage], ['세대', detail.generation],
    ...Object.entries(detail.fields).filter(([label]) => !['가치관', '욕망', '직위', '소속'].includes(label)),
  ]
  const heroRows: Array<[string, string | number]> = [
    ['영웅 ID', detail.heroId],
    ['영웅 클래스', detail.heroClass],
    ['전투 역할', labelsFor(detail.battleRoleTags, battleRoleLabels) || '기본 원정 역할'],
    ['효과 계열', labelsFor(detail.effectFamilies, effectFamilyLabels)],
    ['캠페인 역할', labelsFor(detail.campaignRoles, campaignRoleLabels) || '등록된 요원 역할 없음'],
    ['정식 지휘 가능', detail.commandEligible ? '가능' : '별도 지휘 자격 필요'],
  ]
  const relationRows = [...detail.relations.outgoing.map((relation) => [`→ ${relation.to} · ${relation.type}`, relation.basis] as [string, string]), ...detail.relations.incoming.map((relation) => [`← ${relation.from} · ${relation.type}`, relation.basis] as [string, string])]

  return (
    <article className="wiki-article" data-wiki-shell="react-official" data-person-id={detail.id}>
      <nav aria-label="현재 위치" className="wiki-breadcrumbs"><Link to="/">대문</Link><span aria-hidden="true">›</span><Link to="/people">등장인물 전체</Link><span aria-hidden="true">›</span><strong>{detail.name}</strong></nav>
      <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 인물</p><h1>{detail.name}</h1><p>{detail.stateName || '무소속'} · {detail.title}</p></div><span className="wiki-canon-badge">정본</span></header>
      <div className="person-detail-layout">
        <aside className="person-data-panel" aria-label="인물 구조화 데이터">
          <DataTable title="기본 정보" rows={basicRows} />
          <DataTable title="영웅 클래스" rows={heroRows} />
          <DataTable title="가치관" rows={Object.entries(detail.values)} />
          <DataTable title="욕망" rows={Object.entries(detail.desire)} />
          <DataTable title={`관계 ${relationRows.length}건`} rows={relationRows.length ? relationRows : [['관계', '등록된 방향성 관계 없음']]} />
        </aside>
        <div className="wiki-prose person-canon-prose">
          <h2>정본 상세</h2>
          {sectionOrder.map((label) => <section key={label} data-section-status={detail.sections[label] ? 'registered' : 'missing'}><h3>{label}</h3>{detail.sections[label] ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.sections[label]}</ReactMarkdown> : <p className="wiki-domain-label">정본에 별도 산문이 등록되지 않았습니다.</p>}</section>)}
          <details><summary>정본 카드 원문 전체</summary><ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.biography}</ReactMarkdown></details>
          <p><Link to={detail.sourceRoute}>정본 원문 위치로 이동</Link></p>
        </div>
      </div>
    </article>
  )
}
