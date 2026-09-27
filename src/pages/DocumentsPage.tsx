import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { wikiCatalog } from '../generated/wikiCatalog'

const labels = { world: '세계관' } as const

export default function DocumentsPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko')
    return needle ? wikiCatalog.filter((document) => `${document.title} ${labels[document.domain]}`.toLocaleLowerCase('ko').includes(needle)) : wikiCatalog
  }, [query])

  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 색인</p><h1>정본 문서 전체</h1></div><span className="wiki-canon-badge">{wikiCatalog.length}개</span></header>
      <label className="people-search"><span>문서 제목 검색</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="세계관 문서 찾기" /></label>
      <div className="document-index-grid">{filtered.map((document) => <Link key={document.route} to={document.route}><strong>{document.title}</strong><span>{labels[document.domain]}</span></Link>)}</div>
    </article>
  )
}
