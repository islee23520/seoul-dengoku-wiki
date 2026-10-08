import { Link } from 'react-router-dom'
import './FamilyTree.css'

type SourceRef = { readonly path: string; readonly anchor?: string }
type Status = 'authored' | 'preserved' | 'reviewed'
type FamilyNode = {
  readonly id: string
  readonly personId: string | null
  readonly kind: 'person' | 'historical' | 'synthetic'
  readonly name: string
  readonly birthDate: string
  readonly deathDate: string | null
  readonly detailRoute: string | null
  readonly status: Status
  readonly sourceRefs: readonly SourceRef[]
  readonly timeline: readonly { readonly year: number; readonly summary: string; readonly sourceRefs: readonly SourceRef[] }[]
}
type FamilyEdge = {
  readonly id: string
  readonly from: string
  readonly to: string
  readonly type: 'biological' | 'adoptive' | 'custodial' | 'creation' | 'household'
  readonly parentRole?: 'father' | 'mother'
  readonly status: Status
  readonly sourceRefs: readonly SourceRef[]
}
export type FamilyTreeData = {
  readonly personId: string
  readonly parentStatus?: 'biological-parents-unrecorded' | 'maternal-parent-unrecorded' | null
  readonly nodes: readonly FamilyNode[]
  readonly edges: readonly FamilyEdge[]
}
const relationLabels = { biological: '친생', adoptive: '입양', custodial: '보호', creation: '제작', household: '가구 계승' } as const
const parentRoleLabels = { father: '부', mother: '모' } as const
const edgeLabel = (edge: FamilyEdge): string => edge.type === 'biological'
  ? edge.parentRole ? parentRoleLabels[edge.parentRole] : '친생 · 역할 미기록'
  : relationLabels[edge.type]

export function FamilyTree({ tree }: { readonly tree: FamilyTreeData }): JSX.Element {
  if (!tree.nodes.length || !tree.nodes.some((node) => node.id === tree.personId)) return <section className="person-family-tree" data-family-person-id={tree.personId}><h2>가계도</h2><p role="status">기록된 가계도 데이터가 없습니다.</p></section>
  const byId = new Map(tree.nodes.map((node) => [node.id, node]))
  const levels = new Map<string, number>()
  const level = (id: string): number => {
    const cached = levels.get(id)
    if (cached !== undefined) return cached
    const parents = tree.edges.filter((edge) => edge.to === id)
    const result = parents.length ? Math.max(...parents.map((edge) => level(edge.from))) + 1 : 0
    levels.set(id, result)
    return result
  }
  const rows = new Map<number, FamilyNode[]>()
  for (const node of tree.nodes) {
    const depth = level(node.id)
    rows.set(depth, [...(rows.get(depth) ?? []), node])
  }
  const pairs = tree.nodes.flatMap((child) => {
    const parents = tree.edges.filter((edge) => edge.to === child.id && edge.type === 'biological')
    return parents.length === 2 ? [{ childId: child.id, parents }] : []
  })
  const unknownParents = tree.nodes.flatMap((child) => {
    const parents = tree.edges.filter((edge) => edge.to === child.id && edge.type === 'biological')
    return parents.length === 1 ? [{ childId: child.id, parentId: parents[0].from }] : []
  })
  // Pair adjacency derives only from two recorded biological edges to one child.
  for (const [depth, peers] of rows) {
    const ordered: FamilyNode[] = []
    const remaining = new Set(peers.map((node) => node.id))
    for (const node of peers) {
      if (!remaining.has(node.id)) continue
      const pair = pairs.find((entry) => entry.parents.some((edge) => edge.from === node.id) && entry.parents.every((edge) => remaining.has(edge.from)))
      const group = pair ? pair.parents.map((edge) => byId.get(edge.from)!) : [node]
      for (const member of group) { ordered.push(member); remaining.delete(member.id) }
    }
    rows.set(depth, ordered)
  }
  const name = (node: FamilyNode) => node.detailRoute ? <Link to={node.detailRoute}>{node.name}</Link> : <span>{node.name}</span>
  const width = Math.max(640, ...[...rows.values()].map((nodes) => (nodes.length + nodes.filter((node) => unknownParents.some((entry) => entry.parentId === node.id)).length) * 220 + 80))
  const height = rows.size * 180 + 24
  const positions = new Map(tree.nodes.map((node) => {
    const depth = level(node.id)
    const peers = rows.get(depth) ?? []
    const slots = peers.length + peers.filter((peer) => unknownParents.some((entry) => entry.parentId === peer.id)).length
    const preceding = peers.slice(0, peers.indexOf(node))
    const index = preceding.length + preceding.filter((peer) => unknownParents.some((entry) => entry.parentId === peer.id)).length
    return [node.id, { x: 80 + (width - 80 - slots * 220) / 2 + (index + 0.5) * 220, y: depth * 180 + 32 }]
  }))
  return <section className="person-family-tree" data-family-person-id={tree.personId}>
    <h2>가계도</h2>
    <p className="family-tree-legend">위에서 아래로 기록된 세대 · 실선: 친생 · 점선: 입양·보호·제작·가구 계승</p>
    <p className="family-tree-legend">배우자 관계는 이 가계 원장에 기록되지 않았습니다. 부모가 함께 표시돼도 혼인 관계를 뜻하지 않습니다.</p>
    {tree.parentStatus === 'biological-parents-unrecorded' && <p>입양 관계가 기록돼 있으며 생물학적 부모는 미설정입니다.</p>}
    {tree.parentStatus === 'maternal-parent-unrecorded' && <p>부계가 기록돼 있으며 모계는 미설정입니다.</p>}
    <div className="family-tree-scroll" tabIndex={0} aria-label="가계도">
      <div className="family-tree-canvas" style={{ width, height }}>
        <svg width={width} height={height} role="img" aria-label="기록된 부모와 자녀의 세대별 연결선">
          {[...rows.keys()].map((depth) => <text key={depth} x={12} y={depth * 180 + 65}>{depth + 1}세대</text>)}
          {unknownParents.map((entry) => {
            const parent = positions.get(entry.parentId)!
            const child = positions.get(entry.childId)!
            const unknownX = parent.x + 220
            const middle = (parent.x + unknownX) / 2
            return <g key={entry.childId} data-family-unknown-parent={entry.childId}>
              <rect x={unknownX - 90} y={parent.y} width={180} height={80} fill="var(--wiki-paper)" stroke="var(--wiki-muted)" strokeDasharray="4 4" />
              <text x={unknownX} y={parent.y + 36} textAnchor="middle">미상 부모</text>
              <text x={unknownX} y={parent.y + 56} textAnchor="middle">기록 없음</text>
              <path data-family-unknown-connector={entry.childId} d={`M ${unknownX} ${parent.y + 80} V ${parent.y + 118}`} fill="none" stroke="var(--wiki-muted)" strokeWidth={2} strokeDasharray="6 4" />
              <path d={`M ${parent.x} ${parent.y + 118} H ${unknownX} M ${middle} ${parent.y + 118} V ${child.y - 24} H ${child.x} V ${child.y}`} fill="none" stroke="var(--wiki-muted)" strokeWidth={2} />
            </g>
          })}
          {pairs.map((pair) => {
            const [left, right] = pair.parents.map((edge) => positions.get(edge.from)!)
            const child = positions.get(pair.childId)!
            const jointY = Math.max(left.y, right.y) + 118
            const centerX = (left.x + right.x) / 2
            return <g key={pair.childId} data-family-parent-pair={pair.childId} data-family-pair-parents={pair.parents.map((edge) => edge.from).join(' ')}>
              <path data-family-shared-descent={pair.childId} d={`M ${centerX} ${jointY} V ${child.y - 24} H ${child.x} V ${child.y}`} fill="none" stroke="var(--wiki-text)" strokeWidth={2} />
            </g>
          })}
          {tree.edges.map((edge) => {
            const from = positions.get(edge.from)
            const to = positions.get(edge.to)
            if (!from || !to) return null
            const parents = tree.edges.filter((entry) => entry.to === edge.to)
            const index = parents.indexOf(edge)
            const targetX = to.x + (index - (parents.length - 1) / 2) * 44
            const laneY = to.y - 28 - index * 22
            const pair = edge.type === 'biological' ? pairs.find((entry) => entry.childId === edge.to) : undefined
            const pairPoints = pair?.parents.map((entry) => positions.get(entry.from)!)
            const jointY = pairPoints ? Math.max(...pairPoints.map((point) => point.y)) + 118 : laneY
            const pairCenter = pairPoints ? (pairPoints[0].x + pairPoints[1].x) / 2 : targetX
            const unknown = edge.type === 'biological' && unknownParents.some((entry) => entry.childId === edge.to)
            return <g key={edge.id} data-family-edge={edge.type} data-family-edge-id={edge.id} data-family-from={edge.from} data-family-to={edge.to} data-family-parent-role={edge.parentRole}>
              <title>{byId.get(edge.from)?.name} → {byId.get(edge.to)?.name} · {edgeLabel(edge)}</title>
              <path d={unknown ? `M ${from.x} ${from.y + 80} V ${from.y + 118}` : pair ? `M ${from.x} ${from.y + 80} V ${jointY} H ${pairCenter}` : `M ${from.x} ${from.y + 80} V ${laneY} H ${targetX} V ${to.y}`} fill="none" stroke="var(--wiki-text)" strokeWidth={2} strokeDasharray={edge.type === 'biological' ? undefined : '6 4'} />
              <text x={from.x + 8} y={from.y + 103}>{edgeLabel(edge)}</text>
            </g>
          })}
        </svg>
        {tree.nodes.map((node) => {
          const point = positions.get(node.id)
          if (!point) return null
          return <div key={node.id} data-family-node={node.id} data-family-generation={level(node.id) + 1} className={`family-tree-node${node.id === tree.personId ? ' family-tree-current' : ''}`} style={{ left: point.x - 90, top: point.y }}>
            <strong>{name(node)}</strong><small>{node.birthDate}{node.deathDate ? ` – ${node.deathDate}` : ''}</small>
          </div>
        })}
      </div>
    </div>
    <details><summary>계보 원장과 생애 기록</summary><div className="wiki-table-wrap"><table className="person-data-table"><thead><tr><th scope="col">인물</th><th scope="col">생년월일</th><th scope="col">계보</th></tr></thead><tbody>
      {tree.nodes.map((node) => <tr key={node.id}><th scope="row">{name(node)}</th><td>{node.birthDate}</td><td>{tree.edges.filter((edge) => edge.to === node.id).map((edge) => {
        const parent = byId.get(edge.from)
        return <div key={edge.id} data-family-table-edge={edge.id} data-family-parent-role={edge.parentRole}>{parent && name(parent)} · {edgeLabel(edge)}</div>
      })}</td></tr>)}
    </tbody></table></div>
    <ol className="family-tree-timeline">{tree.nodes.flatMap((node) => node.timeline.map((event, index) => ({ node, event, index }))).sort((a, b) => a.event.year - b.event.year).map(({ node, event, index }) =>
      <li key={`${node.id}:${index}`} data-family-event-year={event.year}><time>{event.year}</time> <strong>{name(node)}</strong> {event.summary}</li>)}</ol>
    </details>
  </section>
}
