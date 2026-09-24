import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { dataCatalog } from './generated/dataCatalog'
import { gddCatalog, gddCategories } from './generated/gddCatalog'

const markdownModules = import.meta.glob<string>('./content/**/*.md', { query: '?raw', import: 'default' })

const labels = Object.fromEntries(gddCategories.map((category) => [category.id, category.label])) as Record<string, string>

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gdd-shell">
      <aside className="gdd-sidebar">
        <Link to="/" className="gdd-brand">서울:전국 <span>GDD</span></Link>
        <p>설계·규칙·데이터 원장</p>
        <nav>
          <Link to="/">설계 대문</Link>
          <Link to="/documents">문서 전체</Link>
          <Link to="/data">데이터 사전</Link>
          {gddCategories.map((category) => <Link key={category.id} to={`/documents?category=${category.id}`}>{category.label}</Link>)}
        </nav>
        <a className="gdd-wiki-link" href="/wiki/">세계관 위키로 이동</a>
      </aside>
      <main className="gdd-main">{children}</main>
    </div>
  )
}

function HomePage() {
  const byCategory = useMemo(() => gddCategories.map((category) => ({ ...category, count: gddCatalog.filter((document) => document.category === category.id).length })), [])
  return (
    <article>
      <header className="gdd-hero">
        <p className="gdd-kicker">서울:전국 개발 문서</p>
        <h1>게임 설계 문서</h1>
        <p>공식 위키가 세계 안의 사실과 서사를 맡는다면, 이곳은 플레이 규칙·판정·데이터셋·설정값·아키텍처를 다룬다.</p>
      </header>
      <section className="gdd-boundary">
        <div><strong>/wiki</strong><span>세계관·인물·지역·서사</span></div>
        <div><strong>/gdd</strong><span>설계·규칙·데이터·구현 계약</span></div>
      </section>
      <section>
        <div className="gdd-section-heading"><h2>설계 영역</h2><Link to="/documents">전체 {gddCatalog.length}개 문서</Link></div>
        <div className="gdd-card-grid">
          {byCategory.map((category) => <Link className="gdd-card" key={category.id} to={`/documents?category=${category.id}`}><span>{category.label}</span><strong>{category.count}개</strong></Link>)}
        </div>
      </section>
      <section>
        <div className="gdd-section-heading"><h2>데이터 원장</h2><Link to="/data">데이터 사전 열기</Link></div>
        <div className="gdd-stats">
          {dataCatalog.map((dataset) => <div key={dataset.id}><strong>{dataset.records.toLocaleString('ko-KR')}</strong><span>{dataset.title}</span></div>)}
        </div>
      </section>
    </article>
  )
}

function DocumentsPage() {
  const params = new URLSearchParams(window.location.search)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(params.get('category') ?? 'all')
  const documents = useMemo(() => gddCatalog.filter((document) => {
    if (category !== 'all' && document.category !== category) return false
    const needle = query.trim().toLocaleLowerCase('ko')
    return !needle || `${document.title} ${document.sourcePath} ${document.categoryLabel}`.toLocaleLowerCase('ko').includes(needle)
  }), [category, query])
  return (
    <article>
      <header className="gdd-page-header"><p className="gdd-kicker">설계 색인</p><h1>GDD 문서 전체</h1><p>{gddCatalog.length}개 정본 문서를 목적별로 분리해 열람한다.</p></header>
      <div className="gdd-filters">
        <label><span>문서 검색</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="규칙·시스템·결정 검색" /></label>
        <label><span>영역</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">전체</option>{gddCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      <div className="gdd-document-list">
        {documents.map((document) => <Link key={document.route} to={document.route}><div><span>{document.categoryLabel}</span><strong>{document.title}</strong></div><code>{document.sourcePath}</code></Link>)}
      </div>
    </article>
  )
}

function DocumentPage() {
  const { category, slug } = useParams()
  const document = gddCatalog.find((candidate) => candidate.category === category && candidate.slug === slug)
  const [markdown, setMarkdown] = useState<string | null>(null)
  useEffect(() => {
    if (!document) return
    const load = markdownModules[`./content/${document.category}/${document.slug}.md`]
    if (!load) return
    void load().then(setMarkdown)
  }, [document])
  if (!document) return <Navigate to="/documents" replace />
  return (
    <article>
      <nav className="gdd-breadcrumbs"><Link to="/">GDD</Link><span>›</span><Link to="/documents">{labels[document.category]}</Link><span>›</span><strong>{document.title}</strong></nav>
      <header className="gdd-page-header"><p className="gdd-kicker">{document.categoryLabel}</p><h1>{document.title}</h1><code>{document.sourcePath}</code></header>
      <div className="gdd-prose">{markdown ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown> : <p>문서를 불러오고 있습니다.</p>}</div>
    </article>
  )
}

function DataPage() {
  return (
    <article>
      <header className="gdd-page-header"><p className="gdd-kicker">게임 데이터</p><h1>데이터 사전</h1><p>기존 정본의 소유 경로·스키마·레코드 수·검증 방식을 한곳에서 확인한다.</p></header>
      <div className="gdd-table-wrap"><table><thead><tr><th>데이터셋</th><th>형식</th><th>스키마</th><th>레코드</th><th>상태</th><th>검증</th></tr></thead><tbody>{dataCatalog.map((dataset) => <tr key={dataset.id}><td><strong>{dataset.title}</strong><code>{dataset.ownerPath}</code></td><td>{dataset.format}</td><td><code>{dataset.schema}</code></td><td>{dataset.records.toLocaleString('ko-KR')}{'secondary' in dataset ? <small>{dataset.secondary}</small> : null}</td><td>{dataset.status}</td><td>{dataset.validation}</td></tr>)}</tbody></table></div>
      <section className="gdd-data-notes"><h2>게시 경계</h2><p>지역 설명·영토·지도 탐색은 공식 위키가 맡는다. GDD는 지역 ID, 파일 구조, 생성기와 검증 규칙만 다루며 세계지도를 복사하지 않는다.</p><h2>내보내기</h2><p>CSV는 정본 JSON과 문서에서 만든 교환 산출물이다. UTF-8과 안정된 기계 필드명을 사용하고, 원본 해시·스키마 판본·생성 시각을 영수증으로 남긴다.</p></section>
    </article>
  )
}

export default function App() {
  return <Shell><Routes><Route path="/" element={<HomePage />} /><Route path="/documents" element={<DocumentsPage />} /><Route path="/data" element={<DataPage />} /><Route path="/:category/:slug" element={<DocumentPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Shell>
}
