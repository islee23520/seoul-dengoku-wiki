import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'

export default function PeoplePage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko')
    if (!needle) return peopleCatalog
    return peopleCatalog.filter((person) => `${person.name} ${person.title} ${person.stateName} ${person.stage}`.toLocaleLowerCase('ko').includes(needle))
  }, [query])

  return (
    <article className="wiki-article" data-wiki-shell="react-official">
      <header className="wiki-article-header">
        <div><p className="wiki-domain-label">서울:전국 공식 위키 · 인물</p><h1>등장인물 전체</h1></div>
        <span className="wiki-canon-badge">{peopleCatalog.length}명</span>
      </header>
      <label className="people-search">
        <span>이름·직위·국가 검색</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 윤서린, 급수, S4" />
      </label>
      <p className="wiki-domain-label" aria-live="polite">검색 결과 {filtered.length}명</p>
      <div className="wiki-table-wrap">
        <table className="people-table">
          <thead><tr><th>이름</th><th>국가</th><th>직위</th><th>단계</th></tr></thead>
          <tbody>{filtered.map((person) => (
            <tr key={person.id}>
              <td><Link to={person.route}>{person.name}</Link></td><td>{person.stateName || '무소속'}</td><td>{person.title}</td><td>{person.stage}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </article>
  )
}
