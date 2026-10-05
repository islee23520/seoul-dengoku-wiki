import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clanFamilyCatalog } from '../generated/clanFamilyCatalog'
import { nonKoreanFamilyCatalog } from '../generated/nonKoreanFamilyCatalog'
import SortableTable from '../components/SortableTable'
import { peopleCatalog } from '../generated/peopleCatalog'
import { FamilyTreeSelection } from '../components/FamilyTreeSelection'

export default function FamiliesPage() {
  const [query, setQuery] = useState('')
  const [params, setParams] = useSearchParams()
  const selected = peopleCatalog.find((person) => person.id === params.get('person'))
  const matches = peopleCatalog.filter((person) => person.name.toLocaleLowerCase('ko').includes(query.trim().toLocaleLowerCase('ko')))

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
      <section className="wiki-content mt-8" aria-label="인물 족보 탐색">
        <h2>인물 족보</h2>
        <label htmlFor="family-person">인물 선택</label>{' '}
        <select id="family-person" className="wiki-input" value={selected?.id ?? ''} onChange={(event) => setParams({ person: event.target.value })}>
          <option value="">족보를 볼 인물을 선택하세요</option>
          {matches.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          {selected && !matches.some((person) => person.id === selected.id) && <option value={selected.id}>{selected.name}</option>}
        </select>
        {selected ? <FamilyTreeSelection key={selected.id} personId={selected.id} /> : <p>인물을 선택하면 기록된 부모와 자녀를 세대별 연결선으로 살펴봅니다.</p>}
      </section>

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
      <section className="wiki-content mt-8">
        <h2>본관을 적용하지 않는 가계</h2>
        <p>기존 가계 이름과 식별자를 유지한다. 인물 링크에서 기록된 가족 관계를 살펴본다.</p>
        <SortableTable
          headers={['가계', '인물', '식별자']}
          rows={nonKoreanFamilyCatalog.filter((family) => `${family.surname} ${family.id} ${family.members.map((person) => person.name).join(' ')}`.toLocaleLowerCase('ko').includes(query.trim().toLocaleLowerCase('ko')))
            .flatMap((family) => family.members.map((person) => [family.surname, { text: person.name, link: person.detailRoute }, family.id]))}
        />
      </section>
    </article>
  )
}
