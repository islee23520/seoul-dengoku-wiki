import { useEffect, useState } from 'react'
import portraitCatalog from '../../portrait-catalog.json'
import { cameraViews, composePortraitPrompt, mangaStyles, portraitPromptYAML, publicChoices, type PortraitToken, type PromptOverrides } from './portraitPrompt'

export default function PortraitPromptPanel() {
  const [personId, setPersonId] = useState(portraitCatalog.entries[0]?.personId ?? '')
  const [token, setToken] = useState<PortraitToken | null>(null)
  const [view, setView] = useState<keyof typeof cameraViews>('portrait')
  const [style, setStyle] = useState<keyof typeof mangaStyles>('yokoyama-b')
  const [format, setFormat] = useState<'json' | 'yaml'>('json')
  const [overrides, setOverrides] = useState<PromptOverrides>({})
  const [hairOptions, setHairOptions] = useState<string[]>([])
  const [upperOptions, setUpperOptions] = useState<string[]>([])
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
    fetch(`${import.meta.env.BASE_URL}portrait-tokens/${personId}.json`)
      .then((response) => { if (!response.ok) throw new Error('토큰을 불러올 수 없습니다.'); return response.json() })
      .then((value: PortraitToken) => { if (active) setToken(value) })
      .catch(() => { if (active) setToken(null) })
    return () => { active = false }
  }, [personId])
  let result: ReturnType<typeof composePortraitPrompt> | null = null
  let error = ''
  try { if (token?.personId === personId) result = composePortraitPrompt(token, view, style, overrides) } catch (cause) { error = cause instanceof Error ? cause.message : '입력을 확인하세요.' }
  const text = result ? format === 'json' ? JSON.stringify(result, null, 2) : portraitPromptYAML(result) : error || '인물 토큰을 불러오는 중입니다.'
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
      <label>인물<select value={personId} onChange={(event) => setPersonId(event.target.value)}>{portraitCatalog.entries.map((person) => <option key={person.personId} value={person.personId}>{person.name}</option>)}</select></label>
      <label>구도<select value={view} onChange={(event) => setView(event.target.value as keyof typeof cameraViews)}>{Object.entries(cameraViews).map(([key]) => <option key={key} value={key}>{key === 'portrait' ? '중근경 초상' : key === 'front' ? '정면 전신' : key === 'profile' ? '정측면 전신' : key === 'side' ? '사선 측면 전신' : '후면 전신'}</option>)}</select></label>
      <label>만화 화풍<select value={style} onChange={(event) => setStyle(event.target.value as keyof typeof mangaStyles)}><option value="yokoyama-b">B안 역사만화풍</option><option value="yoshikazu-yasuhiko">야스히코 참고 실험</option></select></label>
      <label>출력<select value={format} onChange={(event) => setFormat(event.target.value as 'json' | 'yaml')}><option value="json">JSON</option><option value="yaml">YAML</option></select></label>
      <label>성별<select value={overrides.gender ?? ''} onChange={(event) => setOverrides({ ...overrides, gender: event.target.value || undefined })}><option value="">원본 유지</option>{publicChoices.gender.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>연령대<select value={overrides.ageCategory ?? ''} onChange={(event) => setOverrides({ ...overrides, ageCategory: event.target.value || undefined })}><option value="">원본 유지</option>{publicChoices.ageCategory.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>분위기<select value={overrides.mood ?? ''} onChange={(event) => setOverrides({ ...overrides, mood: event.target.value || undefined })}><option value="">원본 유지</option>{publicChoices.mood.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>머리<select value={overrides.hair ?? ''} onChange={(event) => setOverrides({ ...overrides, hair: event.target.value || undefined })}><option value="">원본 유지</option>{hairOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>상의<select value={overrides.upper ?? ''} onChange={(event) => setOverrides({ ...overrides, upper: event.target.value || undefined })}><option value="">원본 유지</option>{upperOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>변형 ID<input value={overrides.variantId ?? ''} onChange={(event) => setOverrides({ ...overrides, variantId: event.target.value || undefined })} placeholder="속성 교체 시 필수" /></label>
    </div>
    {result?.missing.length ? <p role="status">전신 입력 누락: {result.missing.join(', ')}. 이 값을 확정하기 전에는 전신 이미지를 생성할 수 없다.</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    <button type="button" onClick={download} disabled={!result}>프롬프트 다운로드</button>
    <pre aria-live="polite">{text}</pre>
  </section>
}
