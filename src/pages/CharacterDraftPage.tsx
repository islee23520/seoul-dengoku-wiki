import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { peopleCatalog } from '../generated/peopleCatalog'
import { LEGACY_REVISIONS, ORIGINAL_CAPABILITIES, ORIGINAL_RULES_VERSION, PERSONAL_FIELDS, TRAIT_FIELDS } from '../data/original-trpg-options'
import { characterDraftExport, draftPersonalContext, draftProblems, emptyCharacterDraft, legacyRevision, projectedDraftLegacy } from './characterDraftExport'
import type { Assessment, LegacyStore, PersonalKey } from './characterDraftExport'
import './CharacterDraftPage.css'

export default function CharacterDraftPage({ legacyStore }: { readonly legacyStore?: LegacyStore } = {}) {
  const [searchParams] = useSearchParams()
  const [sheet, setSheet] = useState(emptyCharacterDraft)
  const [revision, setRevision] = useState('')
  const [selectedCharId, setSelectedCharId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadedSelection, setLoadedSelection] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [exportError, setExportError] = useState('')
  const selectionKey = `${revision}:${selectedCharId}`
  const problems = draftProblems(sheet)
  const canExport = Boolean(revision) && !loading && (!selectedCharId || loadedSelection === selectionKey) && problems.length === 0
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
    setLoadedSelection(''); setLoadError(''); setExportError(''); setSheet(emptyCharacterDraft())
    if (!selectedCharId || !revision) { setLoading(false); return () => controller.abort() }
    setLoading(true)
    void (async () => {
      try {
        const expected = peopleCatalog.find(person => person.id === selectedCharId)
        const res = await fetch(`${import.meta.env.BASE_URL}person-details/${encodeURIComponent(selectedCharId)}.json`, { signal: controller.signal })
        if (!res.ok) throw new Error('인물 정보를 불러오지 못했습니다.')
        const data: unknown = await res.json()
        if (!data || typeof data !== 'object' || !('id' in data) || data.id !== selectedCharId || !('name' in data) || data.name !== expected?.name) throw new Error('인물 정보의 ID와 이름이 일치하지 않습니다.')
        const legacy = legacyStore ? legacyStore.read(legacyRevision(revision), selectedCharId) : projectedDraftLegacy(data, revision)
        if (legacyStore && legacy.person.name !== expected?.name) throw new Error('원본과 인물 목록의 이름이 일치하지 않습니다.')
        const personal = draftPersonalContext(data)
        if (controller.signal.aborted) return
        setSheet({ ...emptyCharacterDraft(), ...personal, legacy })
        setLoadedSelection(selectionKey)
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : '인물 조회 실패')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [selectedCharId, revision, legacyStore, selectionKey])

  function setPersonal(key: PersonalKey, value: string) {
    setSheet(previous => ({ ...previous, [key]: value }))
  }
  function setRating(index: number, patch: Partial<Omit<Assessment, 'capabilityId' | 'reviewState'>>) {
    setSheet(previous => ({ ...previous, originalRatings: previous.originalRatings.map((item, i) => i === index ? { ...item, ...patch } : item) }))
  }
  function download() {
    if (!canExport) return
    try {
      const exported = characterDraftExport(sheet, { personId: selectedCharId, revision })
      const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = 'character-original-draft.json'; link.click()
      URL.revokeObjectURL(url)
      setExportError('')
    } catch (error) { setExportError(error instanceof Error ? error.message : '내보내기 실패') }
  }

  return <main className="wiki-prose">
    <h1>오리지널 TRPG 캐릭터 초안</h1>
    <p className="draft-hint">검토 제안입니다. 저장하여도 정본은 바뀌지 않았습니다. 인물 선택은 새 평가의 승인이 아닙니다.</p>
    <p>규칙 {ORIGINAL_RULES_VERSION} · 대항 d10 · 평가 0–12 · 합산 보정 −4–4</p>
    {selectedCharId && <p><Link to={`/tools/character-art?person=${encodeURIComponent(selectedCharId)}`}>선택 인물의 아트 작업 도구</Link></p>}

    <section className="draft-charselect">
      <h2>기존 인물과 원본 개정</h2>
      <label>원본 개정
        <select aria-label="원본 개정" value={revision} onChange={event => setRevision(event.target.value)}>
          <option value="">— 개정을 명시적으로 선택 —</option>
          {LEGACY_REVISIONS.map(item => <option key={item.revision} value={item.revision}>{item.label} · {item.revision}</option>)}
        </select>
      </label>
      <p>기준 원본 ce173686… / 추가 기록 원본 5f34d92d…는 서로 다른 기록입니다.</p>
      <div className="charselect-row">
        <input aria-label="인물 검색" placeholder="이름 또는 국가로 검색..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="charselect-search" />
        <select aria-label="기존 인물" value={selectedCharId} onChange={event => setSelectedCharId(event.target.value)} className="charselect-dropdown">
          <option value="">— 새 초안 —</option>
          {characters.map(person => <option key={person.id} value={person.id}>{person.name} ({person.stateName || '무소속'})</option>)}
        </select>
        {loading && <span role="status">불러오는 중...</span>}
      </div>
      {loadError && <p role="alert">{loadError}</p>}
      {revision && <p>선택 개정: <code>{revision}</code></p>}
    </section>

    {sheet.legacy && <details>
      <summary>원본 전체 기록 · 읽기 전용 · 새 평가로 환산하지 않음</summary>
      <pre>{JSON.stringify(sheet.legacy, null, 2)}</pre>
    </details>}

    <fieldset disabled={loading || Boolean(selectedCharId && loadedSelection !== selectionKey)}>
      <section className="draft-basic">
        <h2>개인 문맥</h2>
        <div className="form-grid">
          {PERSONAL_FIELDS.map(({ key, label }) => <label key={key}>{label}
            <input type="text" aria-label={label} placeholder={key === 'name' ? '이름 입력' : undefined} value={sheet[key]} onChange={event => setPersonal(key, event.target.value)} />
          </label>)}
        </div>
      </section>

      <section className="draft-attrs">
        <h2>새 기량 평가 · 미승인 제안</h2>
        <p>미설정은 0이 아닙니다. 아래 7개 분야는 보편 능력치가 아니며, 값을 입력할 때 세부 분야·평가 기준 버전·근거가 모두 필요합니다.</p>
        {sheet.originalRatings.map((item, index) => <fieldset key={item.capabilityId}>
          <legend>{ORIGINAL_CAPABILITIES.find(option => option.id === item.capabilityId)?.label} · {item.capabilityId}</legend>
          <div className="form-grid">
            <label>세부 분야<input aria-label={`${item.capabilityId} 세부 분야`} value={item.subdomain} onChange={event => setRating(index, { subdomain: event.target.value })} /></label>
            <label>평가 (0–12)<input type="number" min="0" max="12" step="1" aria-label={`${item.capabilityId} 평가`} value={item.value ?? ''} placeholder="미설정" onChange={event => setRating(index, { value: event.target.value === '' ? null : event.target.valueAsNumber })} /></label>
            <label>평가 기준 버전<input aria-label={`${item.capabilityId} 기준`} value={item.rubricVersion} onChange={event => setRating(index, { rubricVersion: event.target.value })} /></label>
            <label>근거 참조<input aria-label={`${item.capabilityId} 근거`} value={item.evidenceRef} onChange={event => setRating(index, { evidenceRef: event.target.value })} /></label>
          </div>
        </fieldset>)}
        <div className="form-grid">
          <label>합산 보정 (−4–4)<input aria-label="합산 보정" type="number" min="-4" max="4" step="1" placeholder="미설정" value={sheet.combinedModifier ?? ''} onChange={event => setSheet(previous => ({ ...previous, combinedModifier: event.target.value === '' ? null : event.target.valueAsNumber }))} /></label>
          <label>보정 근거 참조<input aria-label="보정 근거" value={sheet.modifierEvidenceRef} onChange={event => setSheet(previous => ({ ...previous, modifierEvidenceRef: event.target.value }))} /></label>
        </div>
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
    {problems.length > 0 && <p role="alert">평가 범위와 세부 분야·기준 버전·근거, 특성 서술·참조를 확인하세요. {problems.join(', ')}</p>}
    {exportError && <p role="alert">{exportError}</p>}
    <section className="draft-actions">
      <button type="button" disabled={!canExport} onClick={download}>초안 내보내기</button>
      <p>초안 작성과 검증 도구의 원본 저장소는 <a href="https://github.com/islee23520/seoul-dengoku-tools" rel="external">islee23520/seoul-dengoku-tools</a>입니다.</p>
      <Link to="/people">인물 목록으로</Link>
    </section>
  </main>
}
