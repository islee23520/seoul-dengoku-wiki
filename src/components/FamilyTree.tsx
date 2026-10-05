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

export function FamilyTree({ tree }: { readonly tree: FamilyTreeData }): JSX.Element {
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
  const name = (node: FamilyNode) => node.detailRoute ? <Link to={node.detailRoute}>{node.name}</Link> : <span>{node.name}</span>
  const width = Math.max(520, ...[...rows.values()].map((nodes) => nodes.length * 210))
  const height = rows.size * 150
  const positions = new Map(tree.nodes.map((node) => {
    const depth = level(node.id)
    const peers = rows.get(depth) ?? []
    return [node.id, { x: width * (peers.indexOf(node) + 0.5) / peers.length, y: depth * 150 + 16 }]
  }))
  return <section className="person-family-tree" data-family-person-id={tree.personId}>
    <h2>가계도</h2>
    {tree.parentStatus === 'biological-parents-unrecorded' && <p>입양 관계가 기록돼 있으며 생물학적 부모는 미설정입니다.</p>}
    {tree.parentStatus === 'maternal-parent-unrecorded' && <p>부계가 기록돼 있으며 모계는 미설정입니다.</p>}
    <div className="family-tree-scroll" tabIndex={0} aria-label="가계도">
      <div className="family-tree-canvas" style={{ width, height }}>
        <svg width={width} height={height} aria-hidden="true">
          {tree.edges.map((edge) => {
            const from = positions.get(edge.from)
            const to = positions.get(edge.to)
            if (!from || !to) return null
            return <g key={edge.id} data-family-edge={edge.type}>
              <path d={`M ${from.x} ${from.y + 80} V ${to.y - 30} H ${to.x} V ${to.y}`} fill="none" stroke="var(--wiki-muted)" strokeDasharray={edge.type === 'biological' ? undefined : '5 4'} />
              <text x={to.x + 5} y={to.y - 8}>{relationLabels[edge.type]}</text>
            </g>
          })}
        </svg>
        {tree.nodes.map((node) => {
          const point = positions.get(node.id)
          if (!point) return null
          return <div key={node.id} data-family-node={node.id} className={`family-tree-node${node.id === tree.personId ? ' family-tree-current' : ''}`} style={{ left: point.x - 90, top: point.y }}>
            <strong>{name(node)}</strong><small>{node.birthDate}{node.deathDate ? ` – ${node.deathDate}` : ''}</small>
          </div>
        })}
      </div>
    </div>
    <div className="wiki-table-wrap"><table className="person-data-table"><thead><tr><th scope="col">인물</th><th scope="col">생년월일</th><th scope="col">계보</th></tr></thead><tbody>
      {tree.nodes.map((node) => <tr key={node.id}><th scope="row">{name(node)}</th><td>{node.birthDate}</td><td>{tree.edges.filter((edge) => edge.to === node.id).map((edge) => {
        const parent = byId.get(edge.from)
        return <div key={edge.id}>{parent && name(parent)} · {relationLabels[edge.type]}</div>
      })}</td></tr>)}
    </tbody></table></div>
    <ol className="family-tree-timeline">{tree.nodes.flatMap((node) => node.timeline.map((event, index) => ({ node, event, index }))).sort((a, b) => a.event.year - b.event.year).map(({ node, event, index }) =>
      <li key={`${node.id}:${index}`} data-family-event-year={event.year}><time>{event.year}</time> <strong>{name(node)}</strong> {event.summary}</li>)}</ol>
  </section>
}
