import { useParams, Link, Navigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { clanFamilyCatalog } from '../generated/clanFamilyCatalog'
import SortableTable from '../components/SortableTable'
import { FamilyTree, type FamilyTreeData } from '../components/FamilyTree'

function ClanFamilyTree({ clanId }: { readonly clanId: string }): JSX.Element {
  const [result, setResult] = useState<{ id: string; tree: FamilyTreeData | null } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}family-trees/${encodeURIComponent(clanId)}.json`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('missing clan family tree')
        const tree = await response.json()
        if (tree.clanId !== clanId) throw new Error('clan family tree identity mismatch')
        setResult({ id: clanId, tree })
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ id: clanId, tree: null }) })
    return () => controller.abort()
  }, [clanId])
  if (result?.id !== clanId) return <p role="status">가계도를 불러오고 있습니다.</p>
  if (!result.tree || !result.tree.nodes.length) return <p role="status">기록된 가계도 데이터가 없습니다.</p>
  return <FamilyTree tree={result.tree} />
}

export default function FamilyDetailPage() {
  const { clanId } = useParams()
  const family = useMemo(() => clanFamilyCatalog.find((c) => c.id === clanId), [clanId])

  if (!family) {
    return <Navigate to="/families" replace />
  }

  const showBranches = family.showBranches
  const rows = useMemo(() => family.members.map((person) => [
    { text: person.name, link: person.detailRoute },
    ...(showBranches ? [family.branches.find((branch) => branch.id === person.branchId)?.name ?? '항렬 없이 이름을 지은 가계'] : []),
    person.stateName,
    person.occupation
  ]), [family, showBranches])

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
        {showBranches && family.branches.length > 0 && <section><h3>재합의한 가계</h3><ul>{family.branches.map((branch) => <li key={branch.id}>{branch.name} · {branch.members.length}명</li>)}</ul></section>}
        <SortableTable
          headers={['이름', ...(showBranches ? ['가계'] : []), '국가', '생업']}
          rows={rows}
        />
      </section>

      <section className="wiki-content mt-8" aria-label="가문 가계도">
        <ClanFamilyTree clanId={family.id} />
      </section>
    </article>
  )
}
