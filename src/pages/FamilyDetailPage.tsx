import { useParams, Link, Navigate } from 'react-router-dom'
import { useMemo } from 'react'
import { clanFamilyCatalog } from '../generated/clanFamilyCatalog'
import SortableTable from '../components/SortableTable'

export default function FamilyDetailPage() {
  const { clanId } = useParams()
  const family = useMemo(() => clanFamilyCatalog.find((c) => c.id === clanId), [clanId])

  if (!family) {
    return <Navigate to="/families" replace />
  }

  const rows = useMemo(() => family.members.map((person) => [
    { text: person.name, link: person.detailRoute },
    family.branches.find((branch) => branch.id === person.branchId)?.name ?? '항렬 없이 이름을 지은 가계',
    person.stateName,
    person.occupation
  ]), [family])

  return (
    <article className="wiki-page">
      <header className="wiki-header mb-8">
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <div className="wiki-meta mb-2"><Link to="/families" className="wiki-link">본관 가문</Link></div>
            <h1>{family.bongwan} {family.surname}씨</h1>
            {family.hanja && <div className="text-xl text-[var(--wiki-muted)] mt-1">{family.hanja}</div>}
          </div>
          {family.crest && (
            <div className="flex-shrink-0 bg-[var(--wiki-paper)] p-4 border border-[var(--wiki-line)] rounded-lg">
              <img
                src={`${import.meta.env.BASE_URL}clan-crests/${family.id}.svg`}
                alt={`${family.bongwan} ${family.surname}씨 문장`}
                className="w-32 h-32 object-contain"
                width="128" height="128"
              />
              <div className="text-center text-xs text-[var(--wiki-muted)] mt-2">
                {family.crest.source === 'researched' ? '기록된 문양을 참고해 다시 그린 문장' : '서울전국 가문 문장'}
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="wiki-content">
        <h2>가문 인물 ({family.members.length}명)</h2>
        {family.branches.length > 0 && <section><h3>재합의한 가계</h3><ul>{family.branches.map((branch) => <li key={branch.id}>{branch.name} · {branch.members.length}명</li>)}</ul></section>}
        <SortableTable
          headers={['이름', '가계', '국가', '생업']}
          rows={rows}
        />
      </section>
    </article>
  )
}
