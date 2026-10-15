import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './GeographyPage.css'

type Slot = { id: string; name: string; dongId: string; fragmentId: string | null }
type County = { id: string; name: string; path: string; jurisdictionGuNames: string[]; slots: Slot[] }
type Geography = {
  schema: 'seoul-observed-geography.v1'
  sourceEdition: 'sgis-20250630'
  baseDate: '2025-06-30'
  width: 1000
  height: 1000
  sources: { id: string; url: string; sha256: string }[]
  counties: County[]
}

function isGeography(value: unknown): value is Geography {
  if (!value || typeof value !== 'object') return false
  const data = value as Geography
  const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0
  return data.schema === 'seoul-observed-geography.v1' && data.sourceEdition === 'sgis-20250630'
    && data.baseDate === '2025-06-30' && data.width === 1000 && data.height === 1000
    && Array.isArray(data.sources) && data.sources.length > 0
    && data.sources.every(source => source && text(source.id) && text(source.url)
      && /^https:\/\//.test(source.url) && typeof source.sha256 === 'string' && /^[a-f0-9]{64}$/.test(source.sha256))
    && Array.isArray(data.counties) && data.counties.length > 0
    && new Set(data.counties.map(county => county?.id)).size === data.counties.length
    && data.counties.every(county => county && text(county.id) && text(county.name) && text(county.path)
      && Array.isArray(county.jurisdictionGuNames) && county.jurisdictionGuNames.length > 0 && county.jurisdictionGuNames.every(text)
      && Array.isArray(county.slots) && county.slots.every(slot => slot && text(slot.id) && text(slot.name)
        && text(slot.dongId) && (slot.fragmentId === null || text(slot.fragmentId))))
}

export default function GeographyPage() {
  const [data, setData] = useState<Geography | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState(0)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setError(null)
    setSelectedId('')
    async function load() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}seoul-observed-geography.json`, { signal: controller.signal })
        if (!response.ok) throw new Error(`자료 요청 실패 (HTTP ${response.status})`)
        const payload: unknown = await response.json()
        if (!isGeography(payload)) throw new Error('지원하는 2025 통계 판본의 자료 형식이 아닙니다.')
        if (!controller.signal.aborted) setData(payload)
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '자료 요청에 실패했습니다.')
      }
    }
    void load()
    return () => controller.abort()
  }, [request])

  const selected = data?.counties.find(county => county.id === selectedId)
  return <article className="wiki-article geography-page" data-wiki-shell="react-official" data-geography-status={data ? 'ready' : error ? 'error' : 'loading'}>
    <nav aria-label="현재 위치" className="wiki-breadcrumbs"><Link to="/">대문</Link><span aria-hidden="true">›</span><strong>서울 관찰 지리</strong></nav>
    <header className="wiki-article-header"><div><p className="wiki-domain-label">서울:전국 공식 위키 · 관찰 자료</p><h1>서울 관찰 지리</h1></div></header>
    <div className="wiki-prose geography-introduction">
      <p>SGIS 2025년 6월 30일 통계 경계 판본 (sgis-20250630)을 표시합니다. 최신 행정 경계를 뜻하지 않습니다.</p>
      <p>백작령은 서울 국회의원 지역구 단위로 선택합니다. 행정동 남작령 슬롯은 상세 목록으로만 표시합니다. 이 지도는 인물 위치·정치 관할·작위 보유·수여·소유권을 판정하지 않으며, 기존 승인·게시 보류는 유지됩니다.</p>
    </div>
    {!data && !error && <p className="wiki-loading" role="status">서울 관찰 지리 자료를 불러오고 있습니다.</p>}
    {error && <div className="geography-error"><p role="alert">서울 관찰 지리 자료를 불러오지 못했습니다. {error}</p><button type="button" onClick={() => setRequest(value => value + 1)}>다시 불러오기</button></div>}
    {data && <>
      <div className="geography-controls"><label htmlFor="geography-county">백작령 선택</label><select id="geography-county" value={selectedId} onChange={event => setSelectedId(event.target.value)}><option value="">백작령을 선택하세요</option>{data.counties.map(county => <option key={county.id} value={county.id}>{county.name}</option>)}</select></div>
      <div className="geography-grid">
        <figure className="geography-map"><svg viewBox={`0 0 ${data.width} ${data.height}`} aria-labelledby="geography-map-title geography-map-description">
          <title id="geography-map-title">서울 백작령 관찰 지도</title><desc id="geography-map-description">백작령 경계를 클릭하거나 Tab으로 이동하여 Enter 또는 Space로 선택하세요. 행정동은 상세 목록에 표시됩니다.</desc>
          {data.counties.map(county => <path key={county.id} d={county.path} fillRule="evenodd" role="button" tabIndex={0} aria-label={county.name} aria-pressed={county.id === selectedId} aria-controls="geography-detail" data-county-id={county.id} onClick={() => setSelectedId(county.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(county.id) } }}><title>{county.name}</title></path>)}
        </svg><figcaption>{data.counties.length}개 백작령 · SGIS 2025 통계 판본</figcaption></figure>
        <section id="geography-detail" className="wiki-prose geography-detail" aria-labelledby="geography-detail-title" aria-live="polite">
          <h2 id="geography-detail-title">{selected?.name ?? '백작령 상세'}</h2>
          {selected ? <><p>관할 자치구: {selected.jurisdictionGuNames.join(' · ')}</p><h3>행정동 남작령 슬롯 ({selected.slots.length}개)</h3><ul>{selected.slots.map(slot => <li key={slot.id} data-slot-id={slot.id}><strong>{slot.name}</strong><details><summary>지리 식별자</summary><dl><dt>슬롯 ID</dt><dd>{slot.id}</dd><dt>행정동 ID</dt><dd>{slot.dongId}</dd><dt>분할 ID</dt><dd>{slot.fragmentId ?? '분할 없음'}</dd></dl></details>{slot.fragmentId !== null && <p>행정동 분할 슬롯: {slot.fragmentId}</p>}</li>)}</ul></> : <p>지도나 선택 목록에서 백작령을 선택하면 관할 자치구와 행정동 슬롯을 볼 수 있습니다.</p>}
        </section>
      </div>
      <section className="wiki-prose geography-sources" aria-labelledby="geography-sources-title"><h2 id="geography-sources-title">자료 출처</h2><p>고정 판본: {data.sourceEdition} · 기준일: 2025년 6월 30일. SHA-256은 이 판본의 출처 바이트를 식별합니다.</p><ul>{data.sources.map(source => <li key={source.id}><a href={source.url} rel="noreferrer">{source.id}</a><p>{source.url}</p><details><summary>출처 SHA-256</summary><code>{source.sha256}</code></details></li>)}</ul></section>
    </>}
  </article>
}
