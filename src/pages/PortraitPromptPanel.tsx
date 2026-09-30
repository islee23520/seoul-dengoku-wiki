import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import portraitCatalog from '../../portrait-catalog.json'
import { peopleCatalog } from '../generated/peopleCatalog'
import { cameraViews, composePortraitPrompt, editedPortraitToken, localCharacterArguments, mangaStyles, portraitPromptYAML, publicChoices, type PortraitToken, type PromptOverrides } from './portraitPrompt'

export default function PortraitPromptPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedPerson = searchParams.get('person')
  const [personId, setPersonId] = useState(peopleCatalog.find(entry => entry.id === requestedPerson)?.id ?? portraitCatalog.entries[0]?.personId ?? '')
  const hasToken = portraitCatalog.entries.some(entry => entry.personId === personId)
  const [token, setToken] = useState<PortraitToken | null>(null)
  const [tokenError, setTokenError] = useState('')
  const [tokenAttempt, setTokenAttempt] = useState(0)
  const [view, setView] = useState<keyof typeof cameraViews>('portrait')
  const [style, setStyle] = useState<keyof typeof mangaStyles>('yokoyama-b')
  const [format, setFormat] = useState<'json' | 'yaml'>('json')
  const [overrides, setOverrides] = useState<PromptOverrides>({})
  const [hairOptions, setHairOptions] = useState<string[]>([])
  const [upperOptions, setUpperOptions] = useState<string[]>([])
  const [localImages, setLocalImages] = useState<Partial<Record<keyof typeof cameraViews, string>>>({})
  const localImageUrls = useRef<string[]>([])
  useEffect(() => {
    localImageUrls.current.forEach(url => URL.revokeObjectURL(url))
    localImageUrls.current = []
    setLocalImages({})
  }, [personId])
  useEffect(() => () => {
    localImageUrls.current.forEach(url => URL.revokeObjectURL(url))
  }, [])
  useEffect(() => {
    const load = async () => {
      const tokens: PortraitToken[] = []
      for (const person of portraitCatalog.entries) {
        const response = await fetch(`${import.meta.env.BASE_URL}portrait-tokens/${person.personId}.json`)
        if (response.ok) tokens.push(await response.json() as PortraitToken)
      }
      setHairOptions([...new Set(tokens.map((item) => item.artProposal.hair))])
      setUpperOptions([...new Set(tokens.map((item) => item.artProposal.upper))])
    }
    void load()
  }, [])
  useEffect(() => {
    let active = true
    setToken(null)
    setTokenError('')
    if (!hasToken) return () => { active = false }
    fetch(`${import.meta.env.BASE_URL}portrait-tokens/${personId}.json`)
      .then((response) => { if (!response.ok) throw new Error('토큰을 불러올 수 없습니다.'); return response.json() })
      .then((value: PortraitToken) => {
        const identity = portraitCatalog.entries.find(entry => entry.personId === personId)
        if (!identity || value.personId !== personId || value.characterId !== identity.characterId || value.name !== identity.name) throw new Error('인물 토큰 출처가 일치하지 않습니다.')
        if (active) setToken(value)
      })
      .catch(cause => { if (active) setTokenError(cause instanceof Error ? cause.message : '인물 토큰 조회 실패') })
    return () => { active = false }
  }, [personId, hasToken, tokenAttempt])
  let result: ReturnType<typeof composePortraitPrompt> | null = null
  let error = ''
  try { if (token?.personId === personId) result = composePortraitPrompt(token, view, style, overrides) } catch (cause) { error = cause instanceof Error ? cause.message : '입력을 확인하세요.' }
  const text = result ? format === 'json' ? JSON.stringify(result, null, 2) : portraitPromptYAML(result) : !hasToken ? '선택한 인물의 외형 토큰은 아직 작성되지 않았습니다.' : tokenError || error || '인물 토큰을 불러오는 중입니다.'
  let localArgs = ''
  let localError = ''
  try { localArgs = localCharacterArguments(overrides).map(value => `'${value.replace(/'/g, `'"'"'`)}'`).join(' ') } catch (cause) { localError = cause instanceof Error ? cause.message : '로컬 전달 입력을 확인하세요.' }
  const download = () => {
    if (!result) return
    const url = URL.createObjectURL(new Blob([text], { type: format === 'json' ? 'application/json' : 'text/yaml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${personId}-${view}-${style}.${format === 'json' ? 'json' : 'yaml'}`
    link.click()
    URL.revokeObjectURL(url)
  }
  return <section className="people-prompt" aria-labelledby="people-prompt-title">
    <h2 id="people-prompt-title">인물 아트 프롬프트</h2>
    <p>인물 외형은 미승인 아트 제안이다. 이 화면은 프롬프트만 만들며 이미지 생성이나 구독 인증을 받지 않는다.</p>
    <div className="people-prompt-options">
      <label>인물<select value={personId} onChange={(event) => { setPersonId(event.target.value); setOverrides({}); setSearchParams({ person: event.target.value }) }}>{peopleCatalog.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
      <label>구도<select value={view} onChange={(event) => setView(event.target.value as keyof typeof cameraViews)}>{Object.entries(cameraViews).map(([key]) => <option key={key} value={key}>{key === 'portrait' ? '중근경 초상' : key === 'front' ? '정면 전신' : key === 'profile' ? '정측면 전신' : key === 'side' ? '사선 측면 전신' : '후면 전신'}</option>)}</select></label>
      <label>만화 화풍<select value={style} onChange={(event) => setStyle(event.target.value as keyof typeof mangaStyles)}><option value="yokoyama-b">B안 역사만화풍</option><option value="yoshikazu-yasuhiko">야스히코 참고 실험</option></select></label>
      <label>출력<select value={format} onChange={(event) => setFormat(event.target.value as 'json' | 'yaml')}><option value="json">JSON</option><option value="yaml">YAML</option></select></label>
      <label>성별<select value={overrides.gender ?? ''} onChange={(event) => setOverrides({ ...overrides, gender: event.target.value || undefined })}><option value="">원본 유지</option>{publicChoices.gender.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>연령대<select value={overrides.ageCategory ?? ''} onChange={(event) => setOverrides({ ...overrides, ageCategory: event.target.value || undefined })}><option value="">원본 유지</option>{publicChoices.ageCategory.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>분위기<select value={overrides.mood ?? ''} onChange={(event) => setOverrides({ ...overrides, mood: event.target.value || undefined })}><option value="">원본 유지</option>{publicChoices.mood.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>머리<select value={overrides.hair ?? ''} onChange={(event) => setOverrides({ ...overrides, hair: event.target.value || undefined })}><option value="">원본 유지</option>{hairOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>상의<select value={overrides.upper ?? ''} onChange={(event) => setOverrides({ ...overrides, upper: event.target.value || undefined })}><option value="">원본 유지</option>{upperOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>변형 ID<input value={overrides.variantId ?? ''} onChange={(event) => setOverrides({ ...overrides, variantId: event.target.value || undefined })} placeholder="속성 교체 시 필수" /></label>
      <label>하의 초안<input value={overrides.lower ?? ''} onChange={event => setOverrides({ ...overrides, lower: event.target.value.trim() || undefined })} placeholder={token?.artProposal.lower ?? '사용자가 작성할 전신 하의'} /></label>
      <label>신발 초안<input value={overrides.footwear ?? ''} onChange={event => setOverrides({ ...overrides, footwear: event.target.value.trim() || undefined })} placeholder={token?.artProposal.footwear ?? '사용자가 작성할 전신 신발'} /></label>
    </div>
    {result?.missing.length ? <p role="status">전신 입력 누락: {result.missing.join(', ')}. 이 값을 확정하기 전에는 전신 이미지를 생성할 수 없다.</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {tokenError && <p role="alert">{tokenError} <button type="button" onClick={() => setTokenAttempt(value => value + 1)}>토큰 다시 불러오기</button></p>}
    <button type="button" onClick={download} disabled={!result}>프롬프트 다운로드</button>
    <button type="button" disabled={!result} onClick={() => {
      if (!token || !result) return
      const url = URL.createObjectURL(new Blob([JSON.stringify(editedPortraitToken(token, overrides), null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${personId}-draft.json`
      link.click()
      URL.revokeObjectURL(url)
    }}>편집 초안 토큰 다운로드</button>
    {hasToken && <p><a href={`${import.meta.env.BASE_URL}portrait-tokens/${personId}.json`} download={`${personId}.json`}>원본 인물 토큰 다운로드</a></p>}
    <details>
      <summary>로컬 CLI · Skill · MCP 연결</summary>
      <p>편집 초안 토큰에는 머리·상의·하의·신발과 성별·연령·분위기가 들어갑니다. 원본 토큰은 유지하며 아래 명령은 사용자 로컬에서 실행합니다.</p>
      {localError ? <p role="alert">{localError}</p> : <pre>{`node TOOL/tools/art/portrait-template/emit-character-prompt.mjs --wiki-token ${personId}-draft.json --mode ${view === 'portrait' ? 'portrait' : 'turntable'}${view === 'portrait' ? '' : ` --view ${view}`} --manga-style ${style} --reference /path/to/B.png ${localArgs}`}</pre>}
      <p>이 명령은 계약만 출력합니다. 생성은 사용자 로컬에서 연결 설정을 마친 뒤 출력 경로를 지정해 실행합니다. 인증 키는 웹 페이지에 입력하지 않습니다.</p>
      <p>프로젝트 전용 Skill: seoul-character-images. MCP 실행: <code>node TOOL/tools/art/portrait-template/mcp.mjs</code>. 같은 로컬 AI 연결 설정을 사용합니다.</p>
    </details>
    <p><Link to={`/people/draft?person=${encodeURIComponent(personId)}`}>선택 인물의 겁스 시트 편집</Link></p>
    <details>
      <summary>로컬 생성 결과 확인</summary>
      <p>선택한 PNG는 이 브라우저에서만 표시합니다. 서버에 업로드하거나 인물 정본에 저장하지 않습니다.</p>
      {Object.entries(cameraViews).map(([key]) => {
        const shot = key as keyof typeof cameraViews
        const label = shot === 'portrait' ? '초상' : shot === 'front' ? '정면 전신' : shot === 'profile' ? '정측면 전신' : shot === 'side' ? '사선 측면 전신' : '후면 전신'
        return <section key={`${personId}-${shot}`}>
          <label>{label} PNG<input type="file" accept="image/png" onChange={event => {
            const file = event.target.files?.[0]
            if (!file || file.type !== 'image/png') return
            const url = URL.createObjectURL(file)
            localImageUrls.current.push(url)
            setLocalImages(previous => ({ ...previous, [shot]: url }))
          }} /></label>
          {localImages[shot] && <img src={localImages[shot]} alt={`선택 인물 ${label} 로컬 검수 후보`} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />}
        </section>
      })}
    </details>
    <pre aria-live="polite">{text}</pre>
  </section>
}
