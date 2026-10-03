import { useParams, Link, Navigate } from 'react-router-dom'
import { useMemo } from 'react'
import { clanFamilyCatalog } from '../generated/clanFamilyCatalog'
import SortableTable from '../components/SortableTable'
import { ClanCrest } from '../components/ClanCrest'
import { useHeraldryAssets } from '../hooks/useHeraldryAssets'
import { peopleCatalog } from '../generated/peopleCatalog'

export default function FamilyDetailPage() {
  const { clanId } = useParams()
  const { assets, failed } = useHeraldryAssets()
  const family = useMemo(() => clanFamilyCatalog.find((c) => c.id === clanId), [clanId])
  const members = useMemo(() => {
    if (!family) return []
    if (!assets) return [...family.members]
    return peopleCatalog.flatMap(person => {
      const identity = assets.people[person.id]
      if (identity?.clan?.id !== family.id) return []
      const previous = family.members.find(member => member.id === person.id)
      return [{ id: person.id, name: identity.name, stateName: identity.stateName,
        branchId: previous?.branchId ?? null, occupation: person.occupation, detailRoute: person.detailRoute }]
    })
  }, [family, assets])
  const showBranches = family?.showBranches ?? false
  const rows = useMemo(() => members.map(person => [
    { text: person.name, link: person.detailRoute },
    ...(showBranches ? [family?.branches.find(branch => branch.id === person.branchId)?.name ?? '항렬 없이 이름을 지은 가계'] : []),
    person.stateName,
    person.occupation,
  ]), [members, family, showBranches])

  if (!family) {
    return <Navigate to="/families" replace />
  }

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
              <ClanCrest clanId={family.id} title={`${family.bongwan} ${family.surname}씨 문장`} />
              <div className="text-center text-xs text-[var(--wiki-muted)] mt-2">
                {family.crest.source === 'researched' ? '기록된 문양을 참고해 다시 그린 문장' : '서울전국 가문 문장'}
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="wiki-content">
        {failed && <p role="status">소속·가문 정보 갱신 실패 · 마지막 조회 정보를 표시합니다.</p>}
        <h2>가문 인물 ({members.length}명)</h2>
        {showBranches && family.branches.length > 0 && <section><h3>재합의한 가계</h3><ul>{family.branches.map((branch) => <li key={branch.id}>{branch.name} · {branch.members.length}명</li>)}</ul></section>}
        <SortableTable
          headers={['이름', ...(showBranches ? ['가계'] : []), '국가', '생업']}
          rows={rows}
        />
      </section>
    </article>
  )
}
