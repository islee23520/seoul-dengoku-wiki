import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { characterDraftExport } from './characterDraftExport'
import gurpsCast from '../../lore/name-pools/gurps-cast.json'
import './CharacterDraftPage.css'
import { ADVANTAGES, DISADVANTAGES, QUIRKS, BACKGROUNDS, APPEARANCES, AMBITIONS } from '../data/gurps-options'

type Attr = 'ST' | 'DX' | 'IQ' | 'HT'
type GurpsEntry = { name: string; url: string; attributes: Record<Attr, { value: number }>; cp: { total: number } }
const gurpsPeople = (gurpsCast as { people: GurpsEntry[] }).people

interface GurmpsSheet {
  name: string; state: string; position: string; rank: string; occupation: string
  gender: string; birth: string; bongwan: string
  attributes: Record<Attr, number>
  cp: number; tier: string
  sourceGurps: GurpsEntry | null
  selectedAdvantages: string[]; selectedDisadvantages: string[]
  selectedQuirks: string[]; selectedBackground: string
  selectedAppearance: string; selectedAmbition: string
  aiKey: string; aiModel: string; aiGenerating: boolean; aiMessage: string
}

const DEFAULT: GurmpsSheet = {
  name: '', state: '', position: '', rank: '', occupation: '', gender: '', birth: '', bongwan: '',
  attributes: { ST: 10, DX: 10, IQ: 10, HT: 10 },
  cp: 100, tier: '일반', sourceGurps: null,
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
  const [searchParams] = useSearchParams()
  const [sheet, setSheet] = useState<GurmpsSheet>(DEFAULT)

  const characterList = peopleCatalog.map(person => ({ id: person.id, name: person.name, state: person.stateName }))
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCharId, setSelectedCharId] = useState('')
  const [loadingChar, setLoadingChar] = useState(false)
  const [loadedCharId, setLoadedCharId] = useState('')
  const [loadError, setLoadError] = useState('')
  const canExport = !loadingChar && loadedCharId === selectedCharId


  

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characterList
    const q = searchQuery.trim().toLowerCase()
    return characterList.filter(c =>
      c.name.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q)
    )
  }, [characterList, searchQuery])

  useEffect(() => {
    const id = selectedCharId
    const controller = new AbortController()
    setLoadedCharId('')
    setLoadError('')
    setSheet(DEFAULT)
    if (!id) { setLoadingChar(false); return }
    setLoadingChar(true)
    void (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}person-details/${encodeURIComponent(id)}.json`, { signal: controller.signal })
      if (!res.ok) throw new Error('인물 정보를 불러오지 못했습니다.')
      const data = await res.json()
      if (controller.signal.aborted) return
      const expected = peopleCatalog.find(person => person.id === id)
      if (data.id !== id || data.name !== expected?.name) throw new Error('인물 정보의 ID와 이름이 일치하지 않습니다.')
      const gurps = gurpsPeople.find(person => person.url === `/people/${id}` && person.name === data.name)
      // Populate the form with loaded data
      setSheet(prev => ({
        ...prev,
        sourceGurps: gurps ?? null,
        name: data.name || '',
        state: data.state || '',
        position: data.role?.display || data.position || '',
        rank: data.rank || '',
        gender: data.gender || '',
        occupation: data.occupation || '',
        selectedAdvantages: [],
        selectedDisadvantages: [],
        selectedQuirks: [],
        selectedBackground: '',
        selectedAppearance: '',
        selectedAmbition: '',
      }))
      // Set attributes if available
      if (gurps) {
        setSheet(prev => ({
          ...prev,
          attributes: {
            ST: gurps.attributes.ST.value,
            DX: gurps.attributes.DX.value,
            IQ: gurps.attributes.IQ.value,
            HT: gurps.attributes.HT.value,
          },
          cp: gurps.cp.total,
        }))
      }
      setLoadedCharId(id)
    } catch (e) {
      if (!controller.signal.aborted) setLoadError(e instanceof Error ? e.message : '인물 조회 실패')
    } finally {
      if (!controller.signal.aborted) setLoadingChar(false)
    }
    })()
    return () => controller.abort()
  }, [selectedCharId])

  useEffect(() => {
    const id = searchParams.get('person')
    if (id && peopleCatalog.some(person => person.id === id)) {
      setSelectedCharId(id)
    }
  }, [searchParams])

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
    if (!canExport) return
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

    const url = URL.createObjectURL(new Blob([JSON.stringify({ schemaVersion: 1, personId: selectedCharId || null, approval: 'art-proposal', prompt }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'character-sheet-ai-request.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [sheet, selectedCharId, canExport])

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button type="button" className={active ? 'chip active' : 'chip'} onClick={onClick}>{label}</button>
  )

  return (
    <main className="wiki-prose">
      <h1>겁스 캐릭터 시트 생성기</h1>
      {selectedCharId && <p><Link to={`/tools/character-art?person=${encodeURIComponent(selectedCharId)}`}>선택 인물의 아트 작업 도구</Link></p>}
      <p className="draft-hint">저장하여도 정본은 바뀌지 않았습니다. 정본 반영은 별도 승인이 필요합니다.</p>
      {sheet.sourceGurps && <details><summary>원본 겁스 시트</summary><pre>{JSON.stringify(sheet.sourceGurps, null, 2)}</pre></details>}

      
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
          {loadError && <p role="alert">{loadError}</p>}
        </div>
        {selectedCharId && (
          <p className="charselect-info">
            선택: <strong>{characterList.find(c => c.id === selectedCharId)?.name}</strong>
            {' '}| 능력치와 기본 정보가 로드됩니다. 수정 후 초안 내보내기 하세요.
          </p>
        )}
      </section>

<section className="draft-ai">
        <h2>사용자 AI 도구에 전달</h2>
        <p className="ai-hint">현재 시트의 작성 조건을 내보내 사용자 AI 도구에서 검토합니다. 인증과 실행은 사용자 장치에서 진행합니다.</p>
        <div className="ai-row">
          <button onClick={aiGenerate} disabled={!canExport}>시트 AI 요청 내보내기</button>
        </div>
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
          <span>편집 배분 CP: <strong>{totalCP}</strong></span>
          <span>원장 CP 예산: <strong>{sheet.cp}</strong></span>
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
        <button disabled={!canExport} onClick={() => {
          if (!canExport) return
          const blob = new Blob([JSON.stringify(characterDraftExport(sheet, selectedCharId), null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = 'character-gurps.json'; a.click()
          URL.revokeObjectURL(url)
        }}>초안 내보내기</button>
        <Link to="/people"><button type="button">인물 목록으로</button></Link>
      </section>
    </main>
  )
}
