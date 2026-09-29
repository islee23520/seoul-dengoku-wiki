import { useCallback, useMemo, useState } from 'react'
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

export default function CharacterDraftPage() {
  const [sheet, setSheet] = useState<GurmpsSheet>(DEFAULT)

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
          <label>이름 <input type="text" value={sheet.name} onChange={e => set('name', e.target.value)} /></label>
          <label>국가 <input type="text" value={sheet.state} onChange={e => set('state', e.target.value)} /></label>
          <label>직위 <input type="text" value={sheet.position} onChange={e => set('position', e.target.value)} /></label>
          <label>생업 <input type="text" value={sheet.occupation} onChange={e => set('occupation', e.target.value)} /></label>
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
