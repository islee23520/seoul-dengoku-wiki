import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clanFamilyCatalog } from '../generated/clanFamilyCatalog'
import SortableTable from '../components/SortableTable'

export default function FamiliesPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko')
    return clanFamilyCatalog.filter((clan) => `${clan.bongwan} ${clan.surname} ${clan.id}`.toLocaleLowerCase('ko').includes(needle))
  }, [query])

  const rows = useMemo(() => filtered.map((clan) => [
    { text: `${clan.bongwan} ${clan.surname}씨`, link: `/families/${clan.id}` },
    String(clan.members.length),
    clan.crest ? { text: '문장', badge: 'mid' as const } : '없음',
  ]), [filtered])

  return (
    <article className="wiki-page">
      <header className="wiki-header">
        <h1>본관 가문 색인</h1>
        <p className="wiki-lead">
          본관별 인물과 문장을 살펴본다. 같은 본관에 이름이 올라 있어도 각 인물 사이의 친족 관계까지 뜻하지는 않는다.
        </p>
      </header>

      <section className="wiki-content mt-8">
        <div className="wiki-filters flex gap-4 mb-4">
          <input
            type="search"
            aria-label="본관 또는 성씨 검색"
            placeholder="본관, 성씨 검색"
            className="wiki-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="wiki-count text-sm text-[var(--wiki-muted)] flex items-center">
            전체 {clanFamilyCatalog.length}가문 · 검색 {filtered.length}가문
          </div>
        </div>

        <SortableTable
          headers={['가문', '인물 수', '문장']}
          rows={rows}
        />
      </section>
    </article>
  )
}
