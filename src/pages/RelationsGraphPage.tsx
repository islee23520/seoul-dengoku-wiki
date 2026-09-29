import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

interface GraphNode {
  id: string
  name: string
  state: string
  x: number
  y: number
  vx: number
  vy: number
}

interface RelationEdge {
  sourceName: string
  targetName: string
  type: string
  grounds: string
}

const NODE_COLORS: Record<string, string> = {
  S01: '#4a9a5a', S02: '#daa06a', S03: '#a06ada', S04: '#da6a6a',
  S05: '#6a8ada', S06: '#8ada6a', S07: '#da8aca', S08: '#6adada',
  S09: '#daca6a', S10: '#8a6ada', S11: '#da6a8a', S12: '#6ada8a',
  S13: '#ada6da', S14: '#daada6', S15: '#a6dada', S16: '#dada6a',
}

export function RelationsGraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<RelationEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetch('/api/characters')
      .then(r => r.json())
      .then(data => {
        const chars = data.characters || []
        const graphNodes: GraphNode[] = chars.slice(0, 100).map((c: { id: string; name: string; state: string }, i: number) => ({
          id: c.id || 'unknown',
          name: c.name || '',
          state: c.state || '',
          x: 400 + Math.cos(i * 0.7) * (150 + i * 2),
          y: 300 + Math.sin(i * 0.7) * (150 + i * 2),
          vx: 0,
          vy: 0,
        }))
        setNodes(graphNodes)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes
    const q = searchQuery.toLowerCase()
    return nodes.filter(n => n.name.toLowerCase().includes(q) || n.state?.toLowerCase().includes(q))
  }, [nodes, searchQuery])

  const selectedNodeData = nodes.find(n => n.id === selectedNode)
  const connectedEdges = selectedNode
    ? edges.filter(e => e.sourceName === selectedNodeData?.name || e.targetName === selectedNodeData?.name)
    : []

  return (
    <main className="wiki-prose">
      <h1>인물 관계 그래프</h1>
      <p style={{ color: 'var(--wiki-muted)', fontSize: '0.9rem' }}>
        노드를 클릭하여 인물을 선택하고 관계를 확인합니다.
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="인물 검색..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.5rem 0.8rem', border: '1px solid var(--wiki-line)', borderRadius: '4px', width: '300px', fontSize: '0.9rem' }}
        />
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            viewBox="0 0 800 600"
            style={{ width: '100%', height: '600px', border: '1px solid var(--wiki-line)', borderRadius: '8px', background: 'var(--wiki-paper)' }}
          >
            {edges.map((edge, i) => {
              const src = nodes.find(n => n.name === edge.sourceName)
              const tgt = nodes.find(n => n.name === edge.targetName)
              if (!src || !tgt) return null
              const isActive = !selectedNode || selectedNode === src.id || selectedNode === tgt.id
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke="var(--wiki-line)"
                  strokeWidth={isActive ? 1.5 : 0.5}
                  opacity={isActive ? 0.6 : 0.1}
                />
              )
            })}

            {filteredNodes.map(node => (
              <g
                key={node.id}
                transform={'translate(' + node.x + ',' + node.y + ')'}
                onClick={() => setSelectedNode(selectedNode === node.id ? '' : node.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={selectedNode === node.id ? 8 : 5}
                  fill={NODE_COLORS[node.state] || '#999'}
                  stroke={selectedNode === node.id ? 'var(--wiki-accent)' : 'none'}
                  strokeWidth={2}
                />
                <text
                  x={10}
                  y={4}
                  fontSize={selectedNode === node.id ? 12 : 10}
                  fill="var(--wiki-text)"
                  opacity={!selectedNode || selectedNode === node.id ? 1 : 0.3}
                >
                  {node.name}
                </text>
              </g>
            ))}
          </svg>

          {selectedNodeData && (
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '1rem',
                background: 'var(--wiki-toc)',
                borderRadius: '8px',
                border: '1px solid var(--wiki-line)',
                maxWidth: '250px',
              }}
            >
              <h3 style={{ color: 'var(--wiki-nav)', marginBottom: '0.3rem' }}>{selectedNodeData.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--wiki-muted)' }}>
                국가: {selectedNodeData.state || '무소속'}
              </p>
              {connectedEdges.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>관계 ({connectedEdges.length})</strong>
                  {connectedEdges.slice(0, 5).map((e, i) => (
                    <p key={i} style={{ fontSize: '0.8rem', color: 'var(--wiki-muted)' }}>
                      {e.sourceName} → {e.type} → {e.targetName}
                    </p>
                  ))}
                </div>
              )}
              <Link to={'/wiki/people/' + selectedNodeData.id}>
                <button style={{ marginTop: '0.5rem', padding: '0.3rem 0.8rem', background: 'var(--wiki-accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  인물 상세
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
