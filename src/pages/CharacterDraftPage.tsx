import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { ORIGINAL_CAPABILITIES, ORIGINAL_RULES_VERSION, PERSONAL_FIELDS, TRAIT_FIELDS } from '../data/original-trpg-options'
import { characterDraftExport, draftPersonalContext, draftProblems, emptyCharacterDraft } from './characterDraftExport'
import type { PersonalKey } from './characterDraftExport'
import { parseDraftProfile } from '../../scripts/character-profile-draft.mjs'
import './CharacterDraftPage.css'

export default function CharacterDraftPage() {
  const [searchParams] = useSearchParams()
  const [sheet, setSheet] = useState(emptyCharacterDraft)
  const [selectedCharId, setSelectedCharId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadedSelection, setLoadedSelection] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [exportError, setExportError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileText, setProfileText] = useState('')
  const problems = draftProblems(sheet)
  const canExport = !loading && !profileError && (!selectedCharId || loadedSelection === selectedCharId) && problems.length === 0
  const characters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return peopleCatalog.filter(person => !q || person.name.toLowerCase().includes(q) || person.stateName.toLowerCase().includes(q))
  }, [searchQuery])

  useEffect(() => {
    const person = searchParams.get('person')
    if (person && peopleCatalog.some(item => item.id === person)) setSelectedCharId(person)
  }, [searchParams])

  useEffect(() => {
    const controller = new AbortController()
    setLoadedSelection(''); setLoadError(''); setExportError(''); setProfileError(''); setProfileText(''); setSheet(emptyCharacterDraft())
    if (!selectedCharId) { setLoading(false); return () => controller.abort() }
    setLoading(true)
    void (async () => {
      try {
        const expected = peopleCatalog.find(person => person.id === selectedCharId)
        const res = await fetch(`${import.meta.env.BASE_URL}person-details/${encodeURIComponent(selectedCharId)}.json`, { signal: controller.signal })
        if (!res.ok) throw new Error('인물 정보를 불러오지 못했습니다.')
        const data: unknown = await res.json()
        if (!data || typeof data !== 'object' || !('id' in data) || data.id !== selectedCharId || !('name' in data) || data.name !== expected?.name) throw new Error('인물 정보의 ID와 이름이 일치하지 않습니다.')
        const personal = draftPersonalContext(data)
        if (controller.signal.aborted) return
        setSheet({ ...emptyCharacterDraft(), ...personal })
        setLoadedSelection(selectedCharId)
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : '인물 조회 실패')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [selectedCharId])

  function setPersonal(key: PersonalKey, value: string) {
    setSheet(previous => ({ ...previous, [key]: value }))
  }
  function editProfile(raw: string) {
    setProfileText(raw)
    try {
      const value: unknown = JSON.parse(raw)
      const result = parseDraftProfile(value)
      if (!result.profile) { setProfileError(result.failures.join(', ')); return }
      const characterProfile = result.profile
      setSheet(previous => ({ ...previous, characterProfile }))
      setProfileError('')
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      setProfileError('JSON 형식을 확인하세요.')
    }
  }
  function download() {
    if (!canExport) return
    try {
      const exported = characterDraftExport(sheet, { personId: selectedCharId })
      const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = 'character-original-draft.json'; link.click()
      URL.revokeObjectURL(url)
      setExportError('')
    } catch (error) { setExportError(error instanceof Error ? error.message : '내보내기 실패') }
  }

  return <main className="wiki-prose">
    <h1>캐릭터 profile 초안</h1>
    <p className="draft-hint">검토 제안입니다. 저장하여도 정본은 바뀌지 않았습니다. 인물 선택은 새 평가의 승인이 아닙니다.</p>
    <p>규칙 {ORIGINAL_RULES_VERSION} · 기본 역량 0–20 · 최종 역량 0–100 · 행동 숙련 0–99.9</p>
    {selectedCharId && <p><Link to={`/tools/character-art?person=${encodeURIComponent(selectedCharId)}`}>선택 인물의 아트 작업 도구</Link></p>}

    <section className="draft-charselect">
      <h2>기존 인물</h2>
      <div className="charselect-row">
        <input aria-label="인물 검색" placeholder="이름 또는 국가로 검색..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="charselect-search" />
        <select aria-label="기존 인물" value={selectedCharId} onChange={event => setSelectedCharId(event.target.value)} className="charselect-dropdown">
          <option value="">— 새 초안 —</option>
          {characters.map(person => <option key={person.id} value={person.id}>{person.name} ({person.stateName || '무소속'})</option>)}
        </select>
        {loading && <span role="status">불러오는 중...</span>}
      </div>
      {loadError && <p role="alert">{loadError}</p>}
    </section>

    <fieldset disabled={loading || Boolean(selectedCharId && loadedSelection !== selectedCharId)}>
      <section className="draft-basic">
        <h2>개인 문맥</h2>
        <div className="form-grid">
          {PERSONAL_FIELDS.map(({ key, label }) => <label key={key}>{label}
            <input type="text" aria-label={label} placeholder={key === 'name' ? '이름 입력' : undefined} value={sheet[key]} onChange={event => setPersonal(key, event.target.value)} />
          </label>)}
        </div>
      </section>

      <section className="draft-attrs">
        <h2>여덟 역량 · 미승인 제안</h2>
        <p>미설정은 0이 아닙니다. 기본 역량 10은 해당 분야 숙련자 수준입니다. 직위·소속·과거 CP에서 값을 만들지 않습니다.</p>
        {ORIGINAL_CAPABILITIES.map(({ id, label }) => <fieldset key={id}>
          <legend>{label}</legend>
          <div className="form-grid">
            {(['base', 'effective'] as const).map(key => <label key={key}>{key === 'base' ? '기본 (0–20)' : '최종 (0–100)'}
              <input type="number" min="0" max={key === 'base' ? 20 : 100} step="1" aria-label={`${id} ${key}`} value={sheet.characterProfile.abilities[id][key] ?? ''} placeholder="미설정" onChange={event => {
                const value = event.target.value === '' ? null : event.target.valueAsNumber
                setProfileText('')
                setProfileError('')
                setSheet(previous => ({ ...previous, characterProfile: { ...previous.characterProfile, abilities: { ...previous.characterProfile.abilities, [id]: { ...previous.characterProfile.abilities[id], [key]: value } } } }))
              }} />
            </label>)}
          </div>
        </fieldset>)}
        <label>profile 근거 참조<input aria-label="profile 근거" value={sheet.profileEvidenceRef} onChange={event => setSheet(previous => ({ ...previous, profileEvidenceRef: event.target.value }))} /></label>
        <p>행동 숙련, 특성의 행동·스트레스·관계·효과, 서사와 여섯 신체 부위는 아래 정본 구조로 작성합니다. 숙련은 0–99.9이며 소수 첫째 자리까지입니다. 미평가 신체와 미정 효과는 null로 남깁니다. 판정식·효과 합성식·숙련 성장식은 미확정이며 자동 계산하지 않습니다.</p>
        <label>profile JSON<textarea aria-label="profile JSON" rows={18} value={profileText || JSON.stringify(sheet.characterProfile, null, 2)} onChange={event => editProfile(event.target.value)} /></label>
        {profileError && <p role="alert">{profileError}</p>}
      </section>

      {TRAIT_FIELDS.map(({ key, label }) => <section key={key} className="draft-select">
        <h2>{label} · 서술과 근거</h2>
        {sheet[key].map((item, index) => <div className="form-grid" key={index}>
          <label>서술<input aria-label={`${label} ${index + 1} 서술`} value={item.description} onChange={event => setSheet(previous => ({ ...previous, [key]: previous[key].map((row, i) => i === index ? { ...row, description: event.target.value } : row) }))} /></label>
          <label>참조<input aria-label={`${label} ${index + 1} 참조`} value={item.reference} onChange={event => setSheet(previous => ({ ...previous, [key]: previous[key].map((row, i) => i === index ? { ...row, reference: event.target.value } : row) }))} /></label>
          <button type="button" aria-label={`${label} ${index + 1} 삭제`} onClick={() => setSheet(previous => ({ ...previous, [key]: previous[key].filter((_, i) => i !== index) }))}>삭제</button>
        </div>)}
        <button type="button" onClick={() => setSheet(previous => ({ ...previous, [key]: [...previous[key], { description: '', reference: '' }] }))}>{label} 추가</button>
      </section>)}
    </fieldset>
    {problems.length > 0 && <p role="alert">역량·숙련 범위와 profile 구조·근거, 특성 서술·참조를 확인하세요. {problems.join(', ')}</p>}
    {exportError && <p role="alert">{exportError}</p>}
    <section className="draft-actions">
      <button type="button" disabled={!canExport} onClick={download}>초안 내보내기</button>
      <p>초안 작성과 검증 도구의 원본 저장소는 <a href="https://github.com/islee23520/seoul-dengoku-tools" rel="external">islee23520/seoul-dengoku-tools</a>입니다.</p>
      <Link to="/people">인물 목록으로</Link>
    </section>
  </main>
}
