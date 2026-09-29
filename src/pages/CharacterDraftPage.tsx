import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CharacterDraftPage.css'

type Attr = 'ST' | 'DX' | 'IQ' | 'HT'
type Field = 'name' | 'state' | 'position' | 'rank' | 'occupation' | 'gender' | 'birth' | 'bongwan' | 'affiliation' | 'bio' | 'appearance' | 'ambition'
type Provenance = Readonly<Partial<Record<Field, Readonly<{ kind: 'user' | 'ai-example' | 'canon'; source?: string }>>>>

interface GurmpsSheet {
  name: string
  state: string
  position: string
  rank: string
  occupation: string
  gender: string
  birth: string
  bongwan: string
  affiliation: string
  bio: string
  appearance: string
  ambition: string
  attributes: Record<Attr, number>
  cp: number
  tier: string
  skills: Array<{ name: string; level: number; source?: string }>
  advantages: string[]
  disadvantages: string[]
  quirks: string[]
  background: string
}

const DEFAULT_SHEET: GurmpsSheet = {
  name: '', state: '', position: '', rank: '', occupation: '', gender: '', birth: '',
  bongwan: '', affiliation: '', bio: '', appearance: '', ambition: '',
  attributes: { ST: 10, DX: 10, IQ: 10, HT: 10 },
  cp: 100, tier: 'ordinary', skills: [], advantages: [], disadvantages: [], quirks: [], background: ''
}

const CP_COST: Record<number, number> = { 7: -70, 8: -50, 9: -30, 10: 0, 11: 10, 12: 20, 13: 30, 14: 45, 15: 60, 16: 80, 17: 100, 18: 125, 19: 150, 20: 175 }

function calcCP(attrs: Record<Attr, number>): number {
  return Object.values(attrs).reduce((sum, v) => sum + (CP_COST[v] || 0), 0)
}

export default function CharacterDraftPage() {
  const navigate = useNavigate()
  const [sheet, setSheet] = useState<GurmpsSheet>(DEFAULT_SHEET)
  const [provenance, setProvenance] = useState<Provenance>({})
  const [lookupId, setLookupId] = useState('')
  const [message, setMessage] = useState('')

  const attrCP = useMemo(() => calcCP(sheet.attributes), [sheet.attributes])

  const set = useCallback((key: string, value: unknown) => {
    setSheet(prev => ({ ...prev, [key]: value }) as GurmpsSheet)
    setProvenance(prev => ({ ...prev, [key]: { kind: 'user' } }))
  }, [])

  const setAttr = useCallback((attr: Attr, value: number) => {
    setSheet(prev => ({ ...prev, attributes: { ...prev.attributes, [attr]: value } }))
  }, [])

  const lookup = useCallback(async () => {
    if (!lookupId.trim()) return
    setMessage('조회 중...')
    try {
      const res = await fetch(`/api/characters/${lookupId.trim()}`)
      if (!res.ok) { setMessage('인물을 찾을 수 없습니다.'); return }
      const data = await res.json()
      setSheet(prev => ({ ...prev, ...data }))
      setMessage(`${data.name} 불러옴`)
    } catch { setMessage('API 서버에 연결할 수 없습니다. scripts/mcp-character-server.mjs를 실행하세요.') }
  }, [lookupId])

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${sheet.name || 'character'}-gurps.json`; a.click()
    URL.revokeObjectURL(url)
  }, [sheet])

  const tierLabel = sheet.cp >= 200 ? '주인공' : sheet.cp >= 125 ? '숙련' : '일반'

  return (
    <main className="wiki-prose">
      <h1>겁스 캐릭터 시트 생성기</h1>
      <p className="draft-hint">이 편집기는 검토용입니다. 저장하여도 정본은 바뀌지 않았습니다. 정본 반영은 별도 승인이 필요합니다.</p>

      <section className="draft-lookup">
        <h2>기존 인물 불러오기</h2>
        <div className="lookup-row">
          <input type="text" placeholder="person-0001 또는 K0001" value={lookupId}
            onChange={e => setLookupId(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} />
          <button onClick={lookup}>조회</button>
        </div>
        {message && <p className="lookup-message">{message}</p>}
      </section>

      <section className="draft-basic">
        <h2>기본 정보</h2>
        <div className="form-grid">
          <label>이름 <input type="text" value={sheet.name} onChange={e => set('name', e.target.value)} placeholder="홍길동" /></label>
          <label>국가 <input type="text" value={sheet.state} onChange={e => set('state', e.target.value)} placeholder="S01" /></label>
          <label>직위 <input type="text" value={sheet.position} onChange={e => set('position', e.target.value)} placeholder="군주" /></label>
          <label>국가별 직급 <input type="text" value={sheet.rank} onChange={e => set('rank', e.target.value)} placeholder="당회장" /></label>
          <label>생업 <input type="text" value={sheet.occupation} onChange={e => set('occupation', e.target.value)} placeholder="정수 당직" /></label>
          <label>성별 <select value={sheet.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">—</option><option>남성</option><option>여성</option>
          </select></label>
          <label>생년 <input type="text" value={sheet.birth} onChange={e => set('birth', e.target.value)} placeholder="2090" /></label>
          <label>본관 <input type="text" value={sheet.bongwan} onChange={e => set('bongwan', e.target.value)} placeholder="전주" /></label>
        </div>
      </section>

      <section className="draft-attrs">
        <h2>능력치 (겁스 4판)</h2>
        <div className="attr-grid">
          {(['ST', 'DX', 'IQ', 'HT'] as Attr[]).map(attr => (
            <div key={attr} className="attr-card">
              <span className="attr-label">{attr === 'ST' ? '근력' : attr === 'DX' ? '민첩' : attr === 'IQ' ? '지능' : '건강'}</span>
              <span className="attr-code">{attr}</span>
              <input type="range" min="7" max="20" value={sheet.attributes[attr]}
                onChange={e => setAttr(attr, parseInt(e.target.value))} />
              <span className="attr-value">{sheet.attributes[attr]}</span>
              <span className="attr-cost">CP {CP_COST[sheet.attributes[attr]] ?? 0}</span>
            </div>
          ))}
        </div>
        <div className="cp-summary">
          <span>능력치 CP: <strong>{attrCP}</strong></span>
          <span>구간: <strong>{tierLabel}</strong> ({sheet.cp >= 200 ? '200-300' : sheet.cp >= 125 ? '125-200' : '75-125'} CP)</span>
        </div>
      </section>

      <section className="draft-skills">
        <h2>기술</h2>
        {sheet.skills.map((s, i) => (
          <div key={i} className="skill-row">
            <input type="text" value={s.name} placeholder="기술명"
              onChange={e => set('skills', sheet.skills.map((x,j) => j===i ? {...x, name: e.target.value} : x))} />
            <input type="number" value={s.level} min="0" max="25"
              onChange={e => set('skills', sheet.skills.map((x,j) => j===i ? {...x, level: parseInt(e.target.value)} : x))} />
            <button onClick={() => set('skills', sheet.skills.filter((_,j) => j!==i))}>×</button>
          </div>
        ))}
        <button className="add-skill" onClick={() => set('skills', [...sheet.skills, { name: '', level: 10 }])}>+ 기술 추가</button>
      </section>

      <section className="draft-traits">
        <h2>특성</h2>
        <div className="traits-grid">
          <label>장점 <textarea value={sheet.advantages.join('\n')} rows={3}
            onChange={e => set('advantages', e.target.value.split('\n').filter(Boolean) as string[])}
            placeholder="한 줄에 하나씩" /></label>
          <label>단점 <textarea value={sheet.disadvantages.join('\n')} rows={3}
            onChange={e => set('disadvantages', e.target.value.split('\n').filter(Boolean) as string[])}
            placeholder="한 줄에 하나씩" /></label>
          <label>버릇 <textarea value={sheet.quirks.join('\n')} rows={2}
            onChange={e => set('quirks', e.target.value.split('\n').filter(Boolean) as string[])}
            placeholder="한 줄에 하나씩" /></label>
        </div>
      </section>

      <section className="draft-story">
        <h2>배경</h2>
        <textarea className="bio-editor" value={sheet.bio} rows={6}
          onChange={e => set('bio', e.target.value)} placeholder="인물의 배경 서술" />
        <textarea className="appearance-editor" value={sheet.appearance} rows={3}
          onChange={e => set('appearance', e.target.value)} placeholder="외형 묘사" />
        <textarea className="ambition-editor" value={sheet.ambition} rows={3}
          onChange={e => set('ambition', e.target.value)} placeholder="개막 야망" />
      </section>

      <section className="draft-actions">
        <button onClick={exportJSON}>초안 내보내기</button>
        <Link to="/people"><button type="button">인물 목록으로</button></Link>
      </section>
    </main>
  )
}
