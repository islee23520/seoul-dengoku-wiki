import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { retainerGraph } from '../generated/retainerGraph'

const NODE_COLORS: Record<string, string> = {
  S01: '#4a9a5a', S02: '#daa06a', S03: '#a06ada', S04: '#da6a6a',
  S05: '#6a8ada', S06: '#8ada6a', S07: '#da8aca', S08: '#6adada',
  S09: '#daca6a', S10: '#8a6ada', S11: '#da6a8a', S12: '#6ada8a',
  S13: '#ada6da', S14: '#daada6', S15: '#a6dada', S16: '#dada6a',
}

export function layoutRetainerGraph(graph: typeof retainerGraph) {
  const nodes = graph.courts.flatMap((court, courtIndex) => {
    const column = courtIndex % 3
    const row = Math.floor(courtIndex / 3)
    const owner = graph.nodes.find((node) => node.id === court.ownerPersonId)
    if (!owner) throw new Error(`E_RETAINER_GRAPH_OWNER:${court.id}`)
    const members = graph.edges.filter((edge) => edge.courtId === court.id).map((edge, index) => {
      const person = graph.nodes.find((node) => node.id === edge.fromPersonId)
      if (!person || edge.toPersonId !== owner.id) throw new Error(`E_RETAINER_GRAPH_EDGE:${edge.fromPersonId}`)
      return { ...person, x: 60 + column * 265 + (index % 2) * 110, y: 150 + row * 570 + Math.floor(index / 2) * 60 }
    })
    return [{ ...owner, x: 115 + column * 265, y: 70 + row * 570 }, ...members]
  })
  if (nodes.length !== graph.nodes.length || graph.edges.length !== nodes.length - graph.courts.length)
    throw new Error('E_RETAINER_GRAPH_UNRESOLVED')
  return nodes
}
const nodes = layoutRetainerGraph(retainerGraph)
const nodesById = new Map<string, (typeof nodes)[number]>(nodes.map((node) => [node.id, node]))

export function selectRetainerRelationships(personId: string) {
  const outgoing = retainerGraph.edges.find((edge) => edge.fromPersonId === personId)
  const court = retainerGraph.courts.find((entry) => entry.ownerPersonId === personId || entry.id === outgoing?.courtId)
  const liege = outgoing && nodesById.get(outgoing.toPersonId)
  const members = retainerGraph.edges.filter((edge) => edge.toPersonId === personId)
  return { court, liege, members }
}

export function RelationsGraphPage() {
  const [selectedNode, setSelectedNode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const filteredNodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return q ? nodes.filter((node) => node.name.toLowerCase().includes(q) || node.id.toLowerCase().includes(q)) : nodes
  }, [searchQuery])
  const visibleIds = new Set(filteredNodes.map((node) => node.id))
  const selectedNodeData = nodesById.get(selectedNode)
  const { court, liege, members } = selectRetainerRelationships(selectedNode)

  return (
    <main className="wiki-prose">
      <h1>직속 가신 관계</h1>
      <p style={{ color: 'var(--wiki-muted)', fontSize: '0.9rem' }}>
        2126년 승인된 {retainerGraph.courts.length}개 궁정과 직속 가신 {retainerGraph.edges.length}명을 보여 줍니다. 인물을 선택하면 직속 주군과 궁정을 확인할 수 있습니다.
      </p>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="search"
          aria-label="인물 검색"
          placeholder="이름 또는 인물 ID 검색..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          style={{ padding: '0.5rem 0.8rem', border: '1px solid var(--wiki-line)', borderRadius: '4px', width: '300px', fontSize: '0.9rem' }}
        />
      </div>
      <svg
        role="img"
        aria-label="승인된 직속 가신 관계 그래프"
        viewBox={`0 0 800 ${Math.ceil(retainerGraph.courts.length / 3) * 570}`}
        style={{ width: '100%', height: 'auto', border: '1px solid var(--wiki-line)', borderRadius: '8px', background: 'var(--wiki-paper)' }}
      >
        {retainerGraph.edges.map((edge) => {
          const from = nodesById.get(edge.fromPersonId)
          const to = nodesById.get(edge.toPersonId)
          if (!from || !to) throw new Error(`E_RETAINER_GRAPH_EDGE:${edge.fromPersonId}`)
          const active = !selectedNode || selectedNode === from.id || selectedNode === to.id
          return <line key={edge.fromPersonId} data-from={from.id} data-to={to.id}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke="var(--wiki-line)" strokeWidth={active ? 1.5 : 0.5}
            opacity={visibleIds.has(from.id) && active ? 0.65 : 0.1} />
        })}
        {filteredNodes.map((node) => <g
          key={node.id}
          data-person-id={node.id}
          transform={`translate(${node.x},${node.y})`}
          onClick={() => setSelectedNode(selectedNode === node.id ? '' : node.id)}
          style={{ cursor: 'pointer' }}
        >
          <circle r={selectedNode === node.id ? 8 : 6}
            fill={NODE_COLORS[node.state] || '#999'}
            stroke={selectedNode === node.id ? 'var(--wiki-accent)' : 'none'} strokeWidth={2} />
          <text x={10} y={4} fontSize={11} fill="var(--wiki-text)">{node.name}</text>
        </g>)}
      </svg>
      {selectedNodeData && <section aria-label="선택한 인물" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--wiki-toc)', border: '1px solid var(--wiki-line)', borderRadius: '8px' }}>
        <h2>{selectedNodeData.name} · {selectedNodeData.id}</h2>
        {court && <p>궁정 {court.id}{liege && <> · 직속 주군 <Link to={liege.detailRoute}>{liege.name} ({liege.id})</Link></>}</p>}
        {members.length > 0 && <p>직속 가신 {members.length}명</p>}
        <Link to={selectedNodeData.detailRoute}>인물 상세</Link>
      </section>}
    </main>
  )
}
