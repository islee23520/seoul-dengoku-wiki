import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './CharacterDraftPage.css'
import { ADVANTAGES, DISADVANTAGES, QUIRKS, BACKGROUNDS, APPEARANCES, AMBITIONS } from '../data/gurps-options'

type Attr = 'ST' | 'DX' | 'IQ' | 'HT'

interface GurmpsSheet {
  name: string; state: string; position: string; rank: string; occupation: string
  gender: string; birth: string; bongwan: string
  attributes: Record<Attr, number>
  cp: number; tier: string
  selectedAdvantages: string[]; selectedDisadvantages: string[]
  selectedQuirks: string[]; selectedBackground: string
  selectedAppearance: string; selectedAmbition: string
  aiKey: string; aiModel: string; aiGenerating: boolean; aiMessage: string
}

const DEFAULT: GurmpsSheet = {
  name: '', state: '', position: '', rank: '', occupation: '', gender: '', birth: '', bongwan: '',
  attributes: { ST: 10, DX: 10, IQ: 10, HT: 10 },
  cp: 100, tier: '일반',
  selectedAdvantages: [], selectedDisadvantages: [], selectedQuirks: [],
  selectedBackground: '', selectedAppearance: '', selectedAmbition: '',
  aiKey: '', aiModel: 'gpt-4o-mini', aiGenerating: false, aiMessage: ''
}

const CP_COST: Record<number, number> = { 7: -70, 8: -50, 9: -30, 10: 0, 11: 10, 12: 20, 13: 30, 14: 45, 15: 60, 16: 80, 17: 100, 18: 125, 19: 150, 20: 175 }

function toggleItem(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter(x => x !== id) : [...list, id]
}
const STATE_OPTIONS = [
  { id: 'S01', name: '수문국' }, { id: 'S02', name: '규격맹' },
  { id: 'S03', name: '태욱그룹' }, { id: 'S04', name: '명부교회' },
  { id: 'S05', name: '동방사' }, { id: 'S06', name: '대한민국정부' },
  { id: 'S07', name: '환적국' }, { id: 'S08', name: '중앙기술보존원' },
  { id: 'S09', name: '여의도출자연합회' }, { id: 'S10', name: '안국총림' },
  { id: 'S11', name: '성하그룹' }, { id: 'S12', name: '신내운수' },
  { id: 'S13', name: '흰십자단' }, { id: 'S14', name: '아관사' },
  { id: 'S15', name: '명동대교구' }, { id: 'S16', name: '정동노총' },
  { id: '', name: '무소속' },
]

const STATE_POSITIONS: Record<string, string[]> = {
  S01: ['군주', '본부장', '구역장', '당직장', '주사'],
  S02: ['위원장', '상임이사', '이사', '감사', '조합원'],
  S03: ['회장', '사장', '전무', '부장', '대리'],
  S04: ['당회장', '장로', '권사', '집사', '교사'],
  S05: ['사령관', '참모장', '대대장', '중대장', '병장'],
  S06: ['대통령', '장관', '차관', '국장', '주사'],
  S07: ['역장', '본부장', '구역장', '당직장', '주사'],
  S08: ['원장', '심사관', '보존관', '기술원', '출입자'],
  S09: ['의장', '부회장', '전무', '부장', '직원'],
  S10: ['방장', '총무원장', '주지', '스님', '신도'],
  S11: ['회장', '사장', '전무', '부장', '대리'],
  S12: ['사장', '배차장', '반장', '서기', '호송원'],
  S13: ['단장', '전문의', '수련의', '의무원', '회원'],
  S14: ['사령관', '참모장', '대대장', '중대장', '병장'],
  S15: ['대주교', '신부', '수사', '부제', '교우'],
  S16: ['위원장', '부위원장', '본부장', '지부장', '조합원'],
  '': ['무소속'],
}

const OCCUPATION_OPTIONS = [
  '정수 당직', '갑문 당직', '차량 정비', '장비 수리', '궤도 관리',
  '물 계약', '배급 서기', '경비 당직', '호송 인원', '의료 진료',
  '약재 조제', '명부 관리', '기록 관리', '교육 담당', '통행 관리',
  '수문 조작', '설비 점검', '규격 검사', '창고 관리', '연락 당직',
  '경작', '사냥', '채집', '제조', '운송', '무역', '정보 수집',
]


export default function CharacterDraftPage() {
  const [sheet, setSheet] = useState<GurmpsSheet>(DEFAULT)

  const [characterList, setCharacterList] = useState<Array<{id: string; name: string; state: string}>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCharId, setSelectedCharId] = useState('')
  const [loadingChar, setLoadingChar] = useState(false)


  
  useEffect(() => {
    fetch('/api/characters')
      .then(res => res.json())
      .then(data => {
        if (data.characters) setCharacterList(data.characters)
      })
      .catch(() => {
        // API not available — try loading from static data
        fetch('/wiki/assets/peopleCatalog-BDMn1gFg.js')
          .catch(() => console.log('Character list unavailable'))
      })
  }, [])

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characterList
    const q = searchQuery.trim().toLowerCase()
    return characterList.filter(c =>
      c.name.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q)
    )
  }, [characterList, searchQuery])

  const loadCharacter = useCallback(async (id: string) => {
    if (!id) return
    setLoadingChar(true)
    try {
      const res = await fetch('/api/characters/' + id)
      if (!res.ok) { console.log('Character not found'); return }
      const data = await res.json()
      // Populate the form with loaded data
      setSheet(prev => ({
        ...prev,
        name: data.name || '',
        state: data.state || '',
        position: data.role?.display || data.position || '',
        occupation: data.occupation || '',
        selectedAdvantages: [],
        selectedDisadvantages: [],
        selectedQuirks: [],
        selectedBackground: '',
        selectedAppearance: '',
        selectedAmbition: '',
      }))
      // Set attributes if available
      if (data.attributes) {
        setSheet(prev => ({
          ...prev,
          attributes: {
            ST: data.attributes.ST?.value ?? 10,
            DX: data.attributes.DX?.value ?? 10,
            IQ: data.attributes.IQ?.value ?? 10,
            HT: data.attributes.HT?.value ?? 10,
          },
          cp: data.cp?.total ?? 100,
        }))
      }
    } catch (e) {
      console.log('Failed to load character:', e)
    }
    setLoadingChar(false)
  }, [])

  const attrCP = useMemo(() => Object.values(sheet.attributes).reduce((s, v) => s + (CP_COST[v] || 0), 0), [sheet.attributes])
  const advCP = useMemo(() => sheet.selectedAdvantages.reduce((s, id) => s + (ADVANTAGES.find(a => a.id === id)?.cp || 0), 0), [sheet.selectedAdvantages])
  const disCP = useMemo(() => sheet.selectedDisadvantages.reduce((s, id) => s + (DISADVANTAGES.find(d => d.id === id)?.cp || 0), 0), [sheet.selectedDisadvantages])
  const totalCP = attrCP + advCP + disCP

  const set = useCallback((key: string, value: unknown) => {
    setSheet(prev => ({ ...prev, [key]: value }) as GurmpsSheet)
  }, [])

  const setAttr = useCallback((attr: Attr, value: number) => {
    setSheet(prev => ({ ...prev, attributes: { ...prev.attributes, [attr]: value } }))
  }, [])

  const aiGenerate = useCallback(async () => {
    if (!sheet.aiKey) { set('aiMessage', 'AI 키를 입력하세요. 키는 브라우저에만 저장되고 서버로 전송되지 않습니다.'); return }
    set('aiGenerating', true); set('aiMessage', 'AI 생성 중...')

    const prompt = `다음 조건에 맞는 겁스 4판 캐릭터를 만들어주세요. JSON으로만 답하세요.
이름: ${sheet.name || '자유'}
국가: ${sheet.state || '자유'}
능력치: ST=${sheet.attributes.ST} DX=${sheet.attributes.DX} IQ=${sheet.attributes.IQ} HT=${sheet.attributes.HT}

장점 목록에서 2-3개 선택: ${ADVANTAGES.map(a => a.ko).join(', ')}
단점 목록에서 2-3개 선택: ${DISADVANTAGES.map(d => d.ko).join(', ')}
버릇 목록에서 1개 선택: ${QUIRKS.map(q => q.ko).join(', ')}
배경 목록에서 1개 선택: ${BACKGROUNDS.map(b => b.ko).join(', ')}
외형 목록에서 1개 선택: ${APPEARANCES.map(a => a.ko).join(', ')}
야망 목록에서 1개 선택: ${AMBITIONS.map(a => a.ko).join(', ')}

형식: {"advantages": ["한글이름"], "disadvantages": ["한글이름"], "quirk": "한글이름", "background": "한글이름", "appearance": "한글이름", "ambition": "한글이름"}`

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sheet.aiKey}` },
        body: JSON.stringify({
          model: sheet.aiModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7, max_tokens: 500,
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || '{}'
      const json = JSON.parse(text.replace(/\`/g, '').replace(/json/g, '').trim())

      const findId = (list: Array<{id: string; ko: string}>, ko: string) => list.find(x => x.ko === ko)?.id || ''
      set('selectedAdvantages', (json.advantages || []).map((ko: string) => findId(ADVANTAGES, ko)).filter(Boolean))
      set('selectedDisadvantages', (json.disadvantages || []).map((ko: string) => findId(DISADVANTAGES, ko)).filter(Boolean))
      set('selectedQuirks', [findId(QUIRKS, json.quirk)].filter(Boolean))
      set('selectedBackground', findId(BACKGROUNDS, json.background))
      set('selectedAppearance', findId(APPEARANCES, json.appearance))
      set('selectedAmbition', findId(AMBITIONS, json.ambition))
      set('aiMessage', 'AI 생성 완료!')
    } catch (e) {
      set('aiMessage', `AI 생성 실패: ${e instanceof Error ? e.message : '알 수 없음'}`)
    }
    set('aiGenerating', false)
  }, [sheet])

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button type="button" className={active ? 'chip active' : 'chip'} onClick={onClick}>{label}</button>
  )

  return (
    <main className="wiki-prose">
      <h1>겁스 캐릭터 시트 생성기</h1>
      <p className="draft-hint">저장하여도 정본은 바뀌지 않았습니다. 정본 반영은 별도 승인이 필요합니다.</p>

      
      <section className="draft-charselect">
        <h2>기존 인물 선택</h2>
        <div className="charselect-row">
          <input
            type="text"
            placeholder="이름 또는 국가로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="charselect-search"
          />
          <select
            value={selectedCharId}
            onChange={e => {
              setSelectedCharId(e.target.value)
              if (e.target.value) loadCharacter(e.target.value)
            }}
            className="charselect-dropdown"
          >
            <option value="">— 인물 선택 —</option>
            {filteredCharacters.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.state || '무소속'})
              </option>
            ))}
          </select>
          {loadingChar && <span className="charselect-loading">불러오는 중...</span>}
        </div>
        {selectedCharId && (
          <p className="charselect-info">
            선택: <strong>{characterList.find(c => c.id === selectedCharId)?.name}</strong>
            {' '}| 능력치와 기본 정보가 로드됩니다. 수정 후 초안 내보내기 하세요.
          </p>
        )}
      </section>

<section className="draft-ai">
        <h2>AI 자동 생성 (BYOK)</h2>
        <p className="ai-hint">자기 AI 키를 입력하세요. 키는 브라우저에만 저장되고 서버로 전송되지 않습니다.</p>
        <div className="ai-row">
          <input type="password" placeholder="OpenAI API Key" value={sheet.aiKey} onChange={e => set('aiKey', e.target.value)} />
          <select value={sheet.aiModel} onChange={e => set('aiModel', e.target.value)}>
            <option value="gpt-4o-mini">GPT-4o mini</option>
            <option value="gpt-4o">GPT-4o</option>
          </select>
          <button onClick={aiGenerate} disabled={sheet.aiGenerating}>
            {sheet.aiGenerating ? '생성 중...' : 'AI 자동 생성'}
          </button>
        </div>
        {sheet.aiMessage && <p className="ai-message">{sheet.aiMessage}</p>}
      </section>

      <section className="draft-basic">
        <h2>기본 정보</h2>
        <div className="form-grid">
          <label>이름
            <input type="text" value={sheet.name} onChange={e => set('name', e.target.value)} placeholder="이름 입력" list="name-list" />
            <datalist id="name-list">
              {characterList.map((c: { id: string; name: string }) => <option key={c.id} value={c.name} />)}
            </datalist>
          </label>
          <label>국가
            <select value={sheet.state} onChange={e => { set('state', e.target.value); set('position', '') }}>
              <option value="">— 선택 —</option>
              {STATE_OPTIONS.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.id} {s.name}</option>)}
            </select>
          </label>
          <label>직위
            <select value={sheet.position} onChange={e => set('position', e.target.value)}>
              <option value="">— 선택 —</option>
              {(STATE_POSITIONS[sheet.state] || []).map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>생업
            <select value={sheet.occupation} onChange={e => set('occupation', e.target.value)}>
              <option value="">— 선택 —</option>
              {OCCUPATION_OPTIONS.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="draft-attrs">
        <h2>능력치</h2>
        <div className="attr-grid">
          {(['ST', 'DX', 'IQ', 'HT'] as Attr[]).map(attr => (
            <div key={attr} className="attr-card">
              <span className="attr-code">{attr}</span>
              <input type="range" min="7" max="20" value={sheet.attributes[attr]} onChange={e => setAttr(attr, parseInt(e.target.value))} />
              <span className="attr-value">{sheet.attributes[attr]}</span>
              <span className="attr-cost">CP {CP_COST[sheet.attributes[attr]] ?? 0}</span>
            </div>
          ))}
        </div>
        <div className="cp-summary">
          <span>능력치: <strong>{attrCP}</strong></span>
          <span>장점: <strong>{advCP}</strong></span>
          <span>단점: <strong>{disCP}</strong></span>
          <span>총 CP: <strong>{totalCP}</strong></span>
        </div>
      </section>

      <section className="draft-select">
        <h2>장점</h2>
        <div className="chip-grid">
          {ADVANTAGES.map(a => (
            <Chip key={a.id} label={`${a.ko} (${a.cp}CP)`} active={sheet.selectedAdvantages.includes(a.id)}
              onClick={() => set('selectedAdvantages', toggleItem(sheet.selectedAdvantages, a.id))} />
          ))}
        </div>
      </section>

      <section className="draft-select">
        <h2>단점</h2>
        <div className="chip-grid">
          {DISADVANTAGES.map(d => (
            <Chip key={d.id} label={`${d.ko} (${d.cp}CP)`} active={sheet.selectedDisadvantages.includes(d.id)}
              onClick={() => set('selectedDisadvantages', toggleItem(sheet.selectedDisadvantages, d.id))} />
          ))}
        </div>
      </section>

      <section className="draft-select">
        <h2>버릇</h2>
        <div className="chip-grid">
          {QUIRKS.map(q => (
            <Chip key={q.id} label={q.ko} active={sheet.selectedQuirks.includes(q.id)}
              onClick={() => set('selectedQuirks', toggleItem(sheet.selectedQuirks, q.id))} />
          ))}
        </div>
      </section>

      <section className="draft-select">
        <h2>배경</h2>
        <div className="option-list">
          {BACKGROUNDS.map(b => (
            <button key={b.id} type="button"
              className={sheet.selectedBackground === b.id ? 'option-card selected' : 'option-card'}
              onClick={() => set('selectedBackground', b.id)}>
              <span className="option-title">{b.ko}</span>
              <span className="option-state">{b.state}</span>
              <span className="option-desc">{b.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="draft-select">
        <h2>외형</h2>
        <div className="chip-grid">
          {APPEARANCES.map(a => (
            <Chip key={a.id} label={a.ko} active={sheet.selectedAppearance === a.id}
              onClick={() => set('selectedAppearance', a.id)} />
          ))}
        </div>
      </section>

      <section className="draft-select">
        <h2>개막 야망</h2>
        <div className="chip-grid">
          {AMBITIONS.map(a => (
            <Chip key={a.id} label={a.ko} active={sheet.selectedAmbition === a.id}
              onClick={() => set('selectedAmbition', a.id)} />
          ))}
        </div>
      </section>

      <section className="draft-actions">
        <button onClick={() => {
          const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = 'character-gurps.json'; a.click()
        }}>초안 내보내기</button>
        <Link to="/people"><button type="button">인물 목록으로</button></Link>
      </section>
    </main>
  )
}
