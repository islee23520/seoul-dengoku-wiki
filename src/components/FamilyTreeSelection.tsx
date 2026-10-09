import { useEffect, useState } from 'react'
import { FamilyTree, type FamilyTreeData } from './FamilyTree'
import { peopleCatalog } from '../generated/peopleCatalog'
import { stateCatalog } from '../generated/stateCatalog'
import { enrichFamilyTreeAffiliations } from '../familyAffiliation'

export function FamilyTreeSelection({ personId }: { personId: string }): JSX.Element {
  const [result, setResult] = useState<{ id: string; tree: FamilyTreeData | null } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.BASE_URL}person-details/${encodeURIComponent(personId)}.json`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('missing family data')
        const detail = await response.json()
        if (detail.id !== personId) throw new Error('family identity mismatch')
        // Person-detail bytes carry no affiliation; enrich issued people from the current state contract.
        setResult({ id: personId, tree: detail.familyTree ? enrichFamilyTreeAffiliations(detail.familyTree, peopleCatalog, stateCatalog) : null })
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ id: personId, tree: null }) })
    return () => controller.abort()
  }, [personId])
  if (result?.id !== personId) return <p role="status">가계도를 불러오고 있습니다.</p>
  if (!result.tree) return <p role="status">기록된 가계도 데이터가 없습니다.</p>
  return <FamilyTree tree={result.tree} />
}
