import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type State = { id: string; name: string; slug: string; power: string }
type Region = { id: string; name: string; district: string; path: string; polities: string[]; status: 'held' | 'contested'; openingState: string; summary: string; stationCount: number }
type TerritoryData = { width: number; height: number; epoch: { label: string }; states: State[]; regions: Region[]; attribution: string }

const colors = ['#b54b4b', '#9b6a34', '#7360a7', '#347b74', '#735377', '#426f99', '#8b7242', '#567b46', '#875b5b', '#2f7584', '#64708a', '#7c5f3f', '#9b525f', '#496b56', '#956f28', '#58649a']

export default function OpeningTerritoryMap() {
  const [data, setData] = useState<TerritoryData | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState('all')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    void fetch(`${import.meta.env.BASE_URL}opening-territories.json`)
      .then((response) => response.json() as Promise<TerritoryData>)
      .then((value) => { setData(value); setSelectedId(value.regions[0]?.id ?? null) })
      .catch(() => setFailed(true))
  }, [])

  const states = useMemo(() => new Map(data?.states.map((state, index) => [state.id, { ...state, color: colors[index] }]) ?? []), [data])
  const selected = data?.regions.find((region) => region.id === selectedId)
  if (failed) return <p className="wiki-domain-label">개막 영토 지도 데이터를 불러오지 못했습니다.</p>
  if (!data) return <div className="wiki-loading">서울 427개 동 개막 영토 지도를 불러오고 있습니다.</div>

  return (
    <section className="territory-map-section" aria-labelledby="opening-territory-title">
      <header><p className="wiki-domain-label">서울 전체 · 캠페인 개막 시점</p><h2 id="opening-territory-title">개막 영토 지도</h2><p>서울 25개 구·427개 행정동의 경계에 정본 `polity_contexts`를 표시합니다. 단일 국가는 지배지, 복수 국가는 경합지입니다.</p></header>
      <label className="territory-filter"><span>국가 필터</span><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">16국 전체</option>{data.states.map((state) => <option key={state.id} value={state.id}>{state.id} · {state.name}</option>)}</select></label>
      <div className="territory-map-layout">
        <div className="territory-map-canvas">
          <svg viewBox={`0 0 ${data.width} ${data.height}`} role="img" aria-label="서울 427개 동 개막 영토 지도">
            {data.regions.map((region) => {
              const primary = states.get(region.polities[0])
              const visible = stateFilter === 'all' || region.polities.includes(stateFilter)
              const label = `${region.district} ${region.name} · ${region.status === 'held' ? '단독 지배' : '경합지'} · ${region.polities.map((id) => states.get(id)?.name ?? id).join(', ')}`
              return <path key={region.id} d={region.path} fill={region.status === 'contested' ? 'url(#contested)' : primary?.color ?? '#777'} opacity={visible ? 0.88 : 0.1} className={selectedId === region.id ? 'territory-region selected' : 'territory-region'} role="button" tabIndex={0} aria-label={label} aria-pressed={selectedId === region.id} onClick={() => setSelectedId(region.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(region.id) } }}><title>{label}</title></path>
            })}
            <defs><pattern id="contested" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#d4c6a4"/><rect width="4" height="10" fill="#4d4b47"/></pattern></defs>
          </svg>
        </div>
        <aside className="territory-detail" aria-live="polite">
          {selected && <><p className="wiki-domain-label">{selected.district}</p><h3>{selected.name}</h3><table className="person-data-table"><tbody><tr><th>지배 상태</th><td>{selected.status === 'held' ? '단독 지배' : '경합·공동 영향권'}</td></tr><tr><th>영토국</th><td>{selected.polities.map((id) => states.get(id)?.name ?? id).join(' · ')}</td></tr><tr><th>역 객체</th><td>{selected.stationCount}개</td></tr></tbody></table><h4>개막 상태</h4><p>{selected.openingState}</p><h4>지역 개요</h4><p>{selected.summary}</p>{selected.polities.map((id) => states.get(id)).filter(Boolean).map((state) => <Link key={state!.id} to={`/states/${state!.slug}`} className="territory-state-link">{state!.id} {state!.name}</Link>)}</>}
        </aside>
      </div>
      <div className="territory-legend">{data.states.map((state, index) => <button key={state.id} type="button" onClick={() => setStateFilter(state.id)}><span style={{ background: colors[index] }} />{state.id} {state.name}</button>)}<span className="territory-contested-key">줄무늬: 경합지</span></div>
      <p className="wiki-domain-label">{data.epoch.label} · 경계는 자료 유도, 개막 지배와 사건은 창작 정본 · {data.attribution}</p>
    </section>
  )
}
