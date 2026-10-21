import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { presentationStations } from './stationPresentation'
import { segmentPointerChoices } from './segmentPointerSelection'
import HoldingSelectionPanel, { type ConfirmedHoldings, personById as holdingPersonById } from './HoldingSelectionPanel'
import type { CurrentHegemon, CurrentBase } from '../generated/stateCatalog'
import './OpeningTerritoryMap.css'
import { titlesAtRank, validateGeographicMap, resolveGeographicTitle, resolveGeographicSelection, geographicTitleColor, geographicPoliticalAffiliation, type GeographicTitles, type GeographicRank } from './geographicTitleMap.mjs'

type State = { currentHegemon: CurrentHegemon; currentBase: CurrentBase & { x: number; y: number }; currentExclusiveDistrictCount: number; id: string; name: string; slug: string; government: string; power: string; relation: string | null; ruler: string; religion: string; capitalStationId: string; capitalRegionId: string; capitalX: number; capitalY: number }
type Region = { currentHegemons: CurrentHegemon[]; id: string; name: string; district: string; path: string; polities: string[]; status: string; openingState: string; summary: string; stationCount: number; density2126: number }
type StationControl = { currentHegemons: CurrentHegemon[]; source: string; status: string; polityIds: string[]; polityNames: string[]; primary: string | null; surfaceRegionName: string | null; memberSurfaces?: Array<{ id: string; surfacePolityIds: string[]; surfaceRegionName: string | null; polityIds: string[] }>; hierarchy: { state: string; regionalAuthority: string | null; stationManager: string } }
type Station = { id: string; name: string; district: string; x: number; y: number; degree: number; lineIds: string[]; control: StationControl }
type DisplayStation = Station & { memberIds: string[]; names: string[] }
type Landmark = { id: string; name: string; holderId: string; surfaceHolderId: string; role: string; detail: string; fortification: string; x: number; y: number; connectionStationId: string | null }
type SegmentControl = { currentHegemons: CurrentHegemon[]; source: string; deltaId: string | null; status: string; polityIds: string[]; primary: string | null }
type Segment = { id: string; a: string; b: string; lineIds: string[]; control: SegmentControl; passage2126: string }
type Hegemon = CurrentHegemon & { readonly memberStateIds: readonly string[]; readonly color: string }
type PhysicalRail = { projection: 'EPSG:5179'; boundarySha256: string; osmSha256: string; stationBindingStatus: 'missing-evidence'; passage2126: 'unknown'; attribution: string; paths: Array<{ id: string; osmWay: number; mode: string; lineId: string; points: [number, number][] }> }
type TerritoryData = { geography: GeographicTitles; hegemons: Hegemon[]; width: number; height: number; projection: { minEast: number; maxEast: number; minNorth: number; maxNorth: number }; epoch: { label: string }; states: State[]; landmarks: Landmark[]; lines: Record<string, { name: string; color: string }>; stations: Station[]; edges: Segment[]; majorStationIds: string[]; regions: Region[]; attribution: string; populationAttribution: string; physicalRail?: PhysicalRail }
type Underground = { stations: Record<string, Record<string, { platformM: number | null; railM: number | null; floors: string | null; platformType: string | null; exits: number | null; transfers: string[] | null }>> }
type Box = { x: number; y: number; width: number; height: number }

const colors = ['#b54b4b', '#9b6a34', '#7360a7', '#347b74', '#735377', '#426f99', '#8b7242', '#567b46', '#875b5b', '#2f7584', '#64708a', '#7c5f3f', '#9b525f', '#496b56', '#956f28', '#58649a']
const contestedColor = '#f0c05a'
const unassignedColor = '#8a969b'
const titleDomainPalette = ['#7a4f9e', '#9e6a2f', '#3d7d8c', '#8c3d5c', '#5a7d2f', '#2f5d7d']
const passageLabel = (passage: string) => passage === 'open' ? '통행' : passage === 'checkpoint' ? '검문 통행' : '기록 없음'
const segmentStatusLabel = (status: string) => status === 'contested' ? '경계' : controlLabel(status)
const controlLabel = (status: string) => status === 'held' ? '점유' : status === 'contested' ? '분쟁' : status === 'vacant' ? '무주지' : '미배정'
const slotStatusLabel = (status: string, english: boolean) => ({ direct: english ? 'Direct rule' : '직할', vassal: english ? 'Vassal' : '봉신', unassigned: english ? 'Unassigned' : '미배정' })[status]
const rankLabels = [['county', '백작령', 'County'], ['duchy', '공작령', 'Duchy'], ['kingdom', '왕국', 'Kingdom'], ['empire', '제국', 'Empire']] as const

export const clampSeoulViewBox = (next: Box, extent: Pick<TerritoryData, 'width' | 'height'>): Box => {
  const width = Math.min(extent.width, Math.max(100, next.width))
  const height = Math.min(extent.height, Math.max(100 * extent.height / extent.width, next.height))
  return {
    x: Math.min(extent.width - width, Math.max(0, next.x)),
    y: Math.min(extent.height - height, Math.max(0, next.y)),
    width,
    height,
  }
}

export default function OpeningTerritoryMap() {
  const english = useLocation().pathname.startsWith('/en/')
  const [params] = useSearchParams()
  const [rank, setRank] = useState<GeographicRank>('county')
  const [titleId, setTitleId] = useState<string | null>(null)
  const [data, setData] = useState<TerritoryData | null>(null)
  const [holdings, setHoldings] = useState<ConfirmedHoldings | null>(null)
  const [holdingLoadFailed, setHoldingLoadFailed] = useState(false)
  const [underground, setUnderground] = useState<Underground | null>(null)
  const [layer, setLayer] = useState<'surface' | 'underground'>('surface')
  const [mode, setMode] = useState<'political' | 'titles'>('political')
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [segmentChoices, setSegmentChoices] = useState<string[]>([])
  const [box, setBox] = useState<Box | null>(null)
  const [showRail, setShowRail] = useState(false)
  const [selectedLine, setSelectedLine] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showRegionDetail, setShowRegionDetail] = useState(true)
  const [selectedStation, setSelectedStation] = useState<DisplayStation | null>(null)
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null)
  const [showStations, setShowStations] = useState(true)
  const [showLandmarks, setShowLandmarks] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [geographyMissing, setGeographyMissing] = useState(false)
  const start = useRef<{ pointerId: number; x: number; y: number; box: Box; moved: boolean } | null>(null)
  const activePointers = useRef(new Set<number>())
  const dragged = useRef(false)
  const mapRef = useRef<SVGSVGElement>(null)
  const requestedRegion = params.get('region')
  const pendingBox = useRef<Box | null>(null)
  const frameRequest = useRef(0)
  const handlers = useRef<{ chooseState: (state: State) => void; selectStation: (station: DisplayStation) => void; selectSegment: (segment: Segment) => void } | null>(null)

  useEffect(() => () => cancelAnimationFrame(frameRequest.current), [])
  useEffect(() => {
    const finishPointer = (event: globalThis.PointerEvent) => {
      activePointers.current.delete(event.pointerId)
      start.current = null
    }
    window.addEventListener('pointerup', finishPointer)
    window.addEventListener('pointercancel', finishPointer)
    return () => { window.removeEventListener('pointerup', finishPointer); window.removeEventListener('pointercancel', finishPointer) }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}opening-territories.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`E_MAP_ASSET:opening-territories.json:${response.status}`); return response.json() as Promise<TerritoryData> })
      .then(territories => {
        if (!territories.geography || territories.geography.titles.filter(title => title.rank === 'county' && title.path.startsWith('M')).length !== 48
          || territories.geography.titles.filter(title => title.rank === 'empire' && title.path.startsWith('M')).length !== 1) throw new Error('E_MAP_GEOGRAPHY_REQUIRED')
        validateGeographicMap(territories.geography)
        setData(territories)
        setBox({ x: 0, y: 0, width: territories.width, height: territories.height })
      }).catch((error) => { if (error.name !== 'AbortError') { if (error.message === 'E_MAP_GEOGRAPHY_REQUIRED') setGeographyMissing(true); else setFailed(true) } })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedStation) return
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}underground-detail.json`, { signal: controller.signal }).then((response) => response.json() as Promise<Underground>).then(setUnderground)
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [selectedStation])

  useEffect(() => {
    if (data) {
      const title = resolveGeographicSelection(data.geography, requestedRegion)
      setTitleId(title?.id ?? null)
      if (title) { setRank(title.rank); setDetailOpen(true) }
      else if (requestedRegion) setDetailOpen(false)
    }
  }, [data, requestedRegion])

  useEffect(() => {
    setSegmentChoices([])
  }, [layer, selectedLine, selectedSegmentId, selectedId, selectedStation, selectedLandmark, stateFilter])

  const states = useMemo(() => new Map(data?.states.map((state, index) => [state.id, { ...state, color: colors[index] }]) ?? []), [data])
  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}confirmed-person-holdings.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('holding-data'); return response.json() as Promise<ConfirmedHoldings> })
      .then(setHoldings)
      .catch(() => { if (!controller.signal.aborted) setHoldingLoadFailed(true) })
    return () => controller.abort()
  }, [])
  const selectedHolding = useMemo(() => holdings?.holdings.find(holding => {
    const stationId = holding.stationRef?.stationId ?? (holding.facilityRef ? holding.facilityRef.stationId ?? holding.facilityRef.stationName : null)
    return stationId ? selectedStation?.memberIds.includes(stationId) : holding.landmarkRef ? holding.landmarkRef.landmarkId === selectedLandmark : holding.adminRefs.some(ref => ref.id === selectedId)
  }), [holdings, selectedId, selectedStation, selectedLandmark])
  const selectedHoldingRegions = useMemo(() => new Set(selectedHolding?.adminRefs.map(ref => ref.id) ?? []), [selectedHolding])
  const holdingsByAdminRef = useMemo(() => {
    const index = new Map<string, ConfirmedHoldings['holdings'][number]>()
    for (const holding of holdings?.holdings ?? []) for (const ref of holding.adminRefs) if (!index.has(ref.id)) index.set(ref.id, holding)
    return index
  }, [holdings])
  const titleRootOf = useMemo(() => {
    const titles = new Map((holdings?.titles ?? []).map(title => [title.id, title]))
    return (holding: ConfirmedHoldings['holdings'][number]) => {
      let title = holding.titleId ? titles.get(holding.titleId) : undefined
      while (title?.parentTitleId) title = titles.get(title.parentTitleId)
      return title?.holderPersonId ?? holding.directLiegePersonId ?? holding.holderPersonId
    }
  }, [holdings])
  const titleDomains = useMemo(() => {
    const domains = new Map<string, { color: string; direct: number; vassal: number }>()
    for (const holding of holdings?.holdings ?? []) {
      const count = holding.adminRefs.length + (holding.componentRefs?.length ?? 0)
      if (!count) continue
      const root = titleRootOf(holding)
      const entry = domains.get(root) ?? { color: '', direct: 0, vassal: 0 }
      if (holding.directLiegePersonId === null) entry.direct += count
      else entry.vassal += count
      domains.set(root, entry)
    }
    [...domains.keys()].sort().forEach((root, index) => { domains.get(root)!.color = titleDomainPalette[index % titleDomainPalette.length] })
    return domains
  }, [holdings, titleRootOf])
  const stations = useMemo(() => presentationStations(data?.stations ?? []), [data])
  const selectableHoldings = useMemo(() => {
    if (!data || !holdings) return []
    const regionIds = new Set(data.regions.map((region) => region.id))
    const stationIds = new Set(stations.flatMap((station) => station.memberIds))
    const landmarkIds = new Set(data.landmarks.map((landmark) => landmark.id))
    return holdings.holdings.filter((holding) => {
      if (holding.componentRefs?.length) return false
      if (holding.adminRefs.length) return holding.adminRefs.every((ref) => regionIds.has(ref.id))
      if (holding.stationRef) return stationIds.has(holding.stationRef.stationId)
      if (holding.facilityRef) return stationIds.has(holding.facilityRef.stationId ?? holding.facilityRef.stationName)
      return holding.landmarkRef ? landmarkIds.has(holding.landmarkRef.landmarkId) : false
    })
  }, [data, holdings, stations])
  const stationPoints = useMemo(() => new Map((data?.stations ?? []).map((station) => [station.id, station])), [data])
  const availableLineIds = useMemo(() => new Set([...(data?.edges ?? []), ...(data?.stations ?? [])].flatMap((entry) => entry.lineIds)), [data])
  const displayedEdges = useMemo(() => (data?.edges ?? []).filter((edge) => selectedLine === 'all' || edge.lineIds.includes(selectedLine)), [data, selectedLine])
  const projectToMap = useMemo(() => data ? (east: number, north: number): [number, number] => [
    (east - data.projection.minEast) / (data.projection.maxEast - data.projection.minEast) * data.width,
    (data.projection.maxNorth - north) / (data.projection.maxNorth - data.projection.minNorth) * data.height,
  ] : null, [data])
  const segmentColor = (control: { status: string; polityIds: string[] }) => control.status === 'held' ? states.get(control.polityIds[0])?.color ?? unassignedColor : control.status === 'contested' ? contestedColor : unassignedColor
  const politicalTitle = (title: GeographicTitles['titles'][number]) => {
    const affiliation = geographicPoliticalAffiliation(title, data!.geography, data!.regions)
    if (affiliation.kind === 'mixed') return { name: `혼재 (${affiliation.names.join(' · ')})`, color: contestedColor }
    if (affiliation.kind === 'unknown') return { name: '정치 관할 미확인', color: unassignedColor }
    const name = affiliation.names[0]
    return { name, color: data!.hegemons.find((hegemon) => hegemon.name === name)?.color ?? unassignedColor }
  }
  const selectTitle = (id: string | null) => {
    setTitleId(id)
    setSelectedStation(null)
    setSelectedLandmark(null)
    setSelectedSegmentId(null)
    setSelectedId(null)
    setStateFilter('all')
    setDetailOpen(id !== null)
  }
  // Everything drawn inside the SVG is independent of the viewport, so panning only changes its viewBox.
  const svgLayers = useMemo(() => {
    if (!data || !projectToMap) return null
    const toMap = projectToMap
    const displayedRail = data.physicalRail?.paths ?? []
    return <>
        <path d={data.geography.titles.find(title => title.rank === 'empire')!.path} fill="var(--wiki-nav)" fillRule="evenodd" pointerEvents="none" />
        {layer === 'underground' && titlesAtRank(data.geography, 'county').map(title => <path key={title.id} d={title.path} fill="var(--wiki-muted)" fillOpacity="0.3" stroke="var(--wiki-line)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
        {layer === 'surface' && titlesAtRank(data.geography, mode === 'titles' ? rank : 'county').map(title => {
          const political = politicalTitle(title)
          const label = `${title.name} · ${mode === 'titles' ? title.holderPersonId ?? '소유 미확인' : political.name}`
          return <path key={title.id} d={title.path} fillRule="evenodd" className="territory-flat-region" data-title-id={title.id} data-title-rank={title.rank} data-political-affiliation={mode === 'political' ? political.name : undefined} role="button" tabIndex={0} aria-label={label} aria-pressed={titleId === title.id} fill={mode === 'titles' ? geographicTitleColor(title.id, titlesAtRank(data.geography, rank).map(entry => entry.id)) : political.color} fillOpacity={titleId === title.id ? 0.92 : 0.62} stroke="#35434b" strokeWidth="1" vectorEffect="non-scaling-stroke" onClick={() => { if (!dragged.current) selectTitle(title.id) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectTitle(title.id) } }}><title>{label}</title></path>
        })}
        {layer === 'surface' && selectedHolding && titlesAtRank(data.geography, 'county').filter(title => title.currentSlots.some(slot => selectedHoldingRegions.has(slot.dongId))).map(title => <path key={`holding-${title.id}`} data-holding-county={title.id} data-holding-id={selectedHolding.id} d={title.path} fill="var(--wiki-text)" fillOpacity="0.15" pointerEvents="none" />)}
        {layer === 'surface' && showRail && displayedRail.map(path => <polyline key={path.id} className="territory-metro-line" data-physical-rail-piece={path.id} points={path.points.map(([east, north]) => toMap(east, north).join(',')).join(' ')} fill="none" stroke="var(--wiki-line)" strokeWidth="2.8" vectorEffect="non-scaling-stroke" pointerEvents="none"><title>서울 시계 안 실측 철도 · {path.mode} · 노선·역 연결 미확인</title></polyline>)}
        {layer === 'surface' && showLandmarks && data.landmarks.map((site) => <circle key={site.id} cx={site.x} cy={site.y} r="5" fill={states.get(site.holderId)?.color} stroke="#fff" strokeWidth="1.8" vectorEffect="non-scaling-stroke" onClick={() => { setSelectedLandmark(site.id); setSelectedStation(null); setSelectedId(null); setSelectedSegmentId(null); setStateFilter('all'); setDetailOpen(true) }}><title>{site.name} · {site.role}</title></circle>)}
        {layer === 'underground' && displayedEdges.map((edge) => { const a = stationPoints.get(edge.a), b = stationPoints.get(edge.b); if (!a || !b) return null; return <line key={edge.id} className="territory-underground-segment" data-underground-segment={edge.id} data-control-status={edge.control.status} role="button" tabIndex={0} aria-label={`${a.name}–${b.name} 구간 · ${controlLabel(edge.control.status)}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={segmentColor(edge.control)} strokeWidth={selectedSegmentId === edge.id ? '7' : '4'} strokeDasharray={edge.control.status === 'held' ? undefined : edge.control.status === 'contested' ? '7 4' : '3 4'} vectorEffect="non-scaling-stroke" onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handlers.current?.selectSegment(edge) } }}><title>{a.name}–{b.name} · {segmentStatusLabel(edge.control.status)}</title></line> })}
        {layer === 'underground' && showStations && stations.filter((station) => selectedLine === 'all' || station.lineIds.includes(selectedLine)).map((station) => <circle key={station.id} className="territory-station-area" data-station-area={station.id} data-control-status={station.control.status} cx={station.x} cy={station.y} r={station.lineIds.length > 1 ? 5.5 : 3.8} fill={segmentColor(station.control)} stroke="#f4fbff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" onClick={() => { if (!dragged.current) handlers.current?.selectStation(station) }}><title>{station.names.join(' · ')} 역 구역 · {controlLabel(station.control.status)}</title></circle>)}
        {showStations && stations.filter((station) => (station.lineIds.length > 1 || station.memberIds.length > 1 || data.majorStationIds.includes(station.id)) && (selectedLine === 'all' || station.lineIds.includes(selectedLine))).map((station) => <g key={station.id} className="territory-flat-station" data-station-id={station.id} onClick={() => handlers.current?.selectStation(station)}><circle cx={station.x} cy={station.y} r={station.lineIds.length > 1 ? 6 : 4} fill="#fff" stroke={data.lines[station.lineIds[0]]?.color ?? '#264655'} strokeWidth="2" vectorEffect="non-scaling-stroke" /><title>{station.names.join(' · ')} · {station.lineIds.map((id) => data.lines[id]?.name).join(' · ')}</title></g>)}
        {layer === 'surface' && mode === 'titles' && holdings && selectableHoldings.filter((holding) => holding.stationRef || holding.facilityRef || holding.landmarkRef).map((holding) => {
          const station = holding.stationRef ? stations.find((entry) => entry.memberIds.includes(holding.stationRef!.stationId) || entry.id === holding.stationRef!.stationId) : holding.facilityRef ? stations.find((entry) => entry.names.includes(holding.facilityRef!.stationName) || entry.memberIds.includes(holding.facilityRef!.stationName)) : null
          const landmark = holding.landmarkRef ? data.landmarks.find((site) => site.id === holding.landmarkRef!.landmarkId) : null
          const x = station?.x ?? landmark?.x
          const y = station?.y ?? landmark?.y
          if (x == null || y == null) return null
          const holder = holdingPersonById(holding.holderPersonId)
          const liege = holding.directLiegePersonId === null ? null : holdingPersonById(holding.directLiegePersonId)
          return <circle key={holding.id} className="territory-title-holding-marker" data-title-holding-marker={holding.id} data-title-relation={holding.directLiegePersonId === null ? 'direct' : 'vassal'} cx={x} cy={y} r="6.5" stroke="#fff6de" strokeWidth="2" vectorEffect="non-scaling-stroke" onClick={() => { if (dragged.current) return; if (station) handlers.current?.selectStation(station); else if (landmark) { setSelectedLandmark(landmark.id); setSelectedStation(null); setSelectedId(null); setSelectedSegmentId(null); setStateFilter('all'); setDetailOpen(true) } }}><title>{holding.name.ko} · {holder?.name ?? holding.holderPersonId}{liege ? ` · 직속 ${liege.name ?? holding.directLiegePersonId}` : ''}</title></circle>
        })}
    </>
  }, [rank, titleId, selectedHolding, selectedHoldingRegions, data, projectToMap, states, stations, stationPoints, displayedEdges, layer, mode, holdings, holdingsByAdminRef, titleRootOf, titleDomains, selectableHoldings, selectedSegmentId, showRail, showStations, showLandmarks, selectedLine, selectedId, stateFilter])
  if (geographyMissing) return <p role="status" className="wiki-domain-label">서울 백작령의 검증된 지리 자료가 아직 게시되지 않아 지도를 표시하지 않습니다. 행정동·서울 밖 옛 경계로 대신하지 않습니다.</p>
  if (failed) return <p className="wiki-domain-label">영토 지도를 불러오지 못했습니다. 새로고침해 주세요.</p>
  if (!data || !box) return <div className="wiki-loading territory-map-loading">서울 지리 작위 경계를 불러오고 있습니다.</div>

  const frameSeoul = () => setBox({ x: 0, y: 0, width: data.width, height: data.height })
  const chooseState = (state: State) => { setSelectedSegmentId(null); setSelectedId(state.capitalRegionId); setShowRegionDetail(false); setStateFilter(state.id); setSelectedStation(null); setSelectedLandmark(null); setDetailOpen(true) }
  const chooseRegion = (region: Region) => {
    const title = resolveGeographicSelection(data.geography, region.id)
    if (!title) return
    setMode('titles')
    setRank('county')
    setTitleId(title.id)
    setSelectedSegmentId(null)
    setSelectedId(region.id)
    setShowRegionDetail(true)
    const state = states.get(region.polities[0])
    setStateFilter(state?.id ?? 'all')
    setSelectedStation(null); setSelectedLandmark(null); setDetailOpen(true)
  }
  const selectStation = (station: DisplayStation) => { setSelectedSegmentId(null); setSelectedStation(station); setSelectedId(null); setStateFilter('all'); setSelectedLandmark(null); setDetailOpen(true) }
  const selectSegment = (segment: Segment) => { setSelectedSegmentId(segment.id); setSelectedStation(null); setSelectedId(null); setStateFilter('all'); setSelectedLandmark(null); setDetailOpen(true) }
  const chooseLayer = (next: 'surface' | 'underground') => {
    if (next === layer) return
    setLayer(next)
    setTitleId(null)
    if (next === 'underground') setMode('political')
    setSelectedSegmentId(null)
    setSelectedId(null)
    setSelectedStation(null)
    setStateFilter('all')
    setSelectedLandmark(null)
    setDetailOpen(false)
  }
  const chooseMode = (next: 'political' | 'titles') => {
    if (next === mode) return
    if (next === 'titles' && layer === 'underground') setLayer('surface')
    if (next === 'political') setRank('county')
    setMode(next)
    setTitleId(null)
    setSelectedSegmentId(null)
    setSelectedId(null)
    setSelectedStation(null)
    setStateFilter('all')
    setSelectedLandmark(null)
    setDetailOpen(false)
  }
  handlers.current = { chooseState, selectStation, selectSegment }
  // Pointer events can arrive several times per frame; apply at most one viewport change per frame.
  const scheduleBox = (next: Box) => {
    pendingBox.current = clampSeoulViewBox(next, data)
    if (frameRequest.current) return
    frameRequest.current = requestAnimationFrame(() => {
      frameRequest.current = 0
      if (pendingBox.current) setBox(pendingBox.current)
      pendingBox.current = null
    })
  }
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    activePointers.current.add(event.pointerId)
    if (activePointers.current.size > 1) { start.current = null; pendingBox.current = null; return }
    dragged.current = false
    start.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, box, moved: false }
  }
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const gesture = start.current
    if (!gesture || gesture.pointerId !== event.pointerId || activePointers.current.size !== 1) return
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = (event.clientX - gesture.x) / rect.width * gesture.box.width
    const dy = (event.clientY - gesture.y) / rect.height * gesture.box.height
    if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5) { gesture.moved = true; dragged.current = true }
    scheduleBox({ ...gesture.box, x: gesture.box.x - dx, y: gesture.box.y - dy })
  }
  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => { activePointers.current.delete(event.pointerId); start.current = null }
  const zoom = (factor: number) => { const width = Math.max(100, Math.min(data.width, box.width * factor)); const height = box.height * width / box.width; setBox(clampSeoulViewBox({ x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height }, data)) }
  const pan = (dx: number, dy: number) => setBox(current => current && clampSeoulViewBox({ ...current, x: current.x + dx * current.width * 0.2, y: current.y + dy * current.height * 0.2 }, data))
  const selectedTitle = resolveGeographicTitle(data.geography, titleId)
  const visibleTitles = titlesAtRank(data.geography, rank)
  const selected = data.regions.find((region) => region.id === selectedId)
  const selectedState = states.get(stateFilter)
  const selectedLandmarkData = data.landmarks.find((landmark) => landmark.id === selectedLandmark)
  const stationDetail = selectedStation && underground?.stations[selectedStation.id]
  const selectedSegment = data.edges.find((edge) => edge.id === selectedSegmentId)
  const segmentCounts = (status: string) => displayedEdges.filter((edge) => status === 'unassigned' ? !['held', 'contested', 'vacant'].includes(edge.control.status) : edge.control.status === status).length

  return <section className="territory-map-section" aria-labelledby="opening-territory-title" onKeyDown={event => { if (event.key === 'Escape') { setSegmentChoices([]); setDetailOpen(false) } }}>
    <header><p className="wiki-domain-label">서울 지리 작위 · 2126 시점</p><h2 id="opening-territory-title">서울 영토 지도</h2><p>백작령을 최소 선택 단위로 표시합니다. 지리 관할과 실제 보유·봉속은 별개입니다.</p></header>
    <div className="territory-toolbar">
      <div className="territory-mode-toggle" role="group" aria-label="지도 종류"><button type="button" onClick={() => chooseMode('political')} aria-pressed={mode === 'political'}>정치 지도</button><button type="button" onClick={() => chooseMode('titles')} aria-pressed={mode === 'titles'}>작위·영주 지도</button></div>
      <div className="territory-layer-toggle" role="group" aria-label="영토 층"><button type="button" onClick={() => chooseLayer('surface')} aria-pressed={layer === 'surface'}>지상 영토</button><button type="button" onClick={() => chooseLayer('underground')} aria-pressed={layer === 'underground'}>지하 영토</button></div>
      <p className="wiki-domain-label">{mode === 'titles' ? '색은 등급별 개별 지리 작위 ID를 구분합니다. 보유자는 별도 승인 대상입니다.' : '대한민국정부: 청와대 중심 강북 · 규격맹: 한강 이남 서부 · 종교 연합: 한강 이남 강남지역 · 중립. 중심 권역은 서로 겹칠 수 있으며 독점 소유 경계가 아닙니다. 백작령의 회색은 소유·정치 관할 미확인을 뜻합니다.'}</p>
      {layer === 'underground' && <label className="territory-filter"><span>노선 필터</span><select value={selectedLine} onChange={(event) => setSelectedLine(event.target.value)}><option value="all">전체 노선</option>{Object.entries(data.lines).filter(([id]) => availableLineIds.has(id)).map(([id, line]) => <option key={id} value={id}>{line.name}</option>)}</select></label>}
      {layer === 'surface' && <label className="territory-rail-toggle"><input type="checkbox" checked={showRail} onChange={(event) => setShowRail(event.target.checked)} />지하철 노선 표시</label>}
      <label className="territory-filter"><span>개인 영지</span><select value={selectedHolding?.id ?? ''} disabled={!holdings} onChange={event => {
        const holding = selectableHoldings.find(item => item.id === event.target.value)
        if (holding?.stationRef || holding?.facilityRef) {
          const stationId = holding.stationRef?.stationId ?? (holding.facilityRef ? holding.facilityRef.stationId ?? holding.facilityRef.stationName : null)
          if (stationId === null) return
          const station = stations.find(item => item.memberIds.includes(stationId))
          if (station) selectStation(station)
        } else if (holding?.landmarkRef) {
          setSelectedLandmark(holding.landmarkRef.landmarkId); setSelectedStation(null); setSelectedId(null); setStateFilter('all'); setDetailOpen(true)
        } else {
          const region = holding && data.regions.find(item => item.id === holding.adminRefs[0]?.id)
          if (region) chooseRegion(region)
        }
      }}><option value="">영지 선택</option>{selectableHoldings.map(holding => <option key={holding.id} value={holding.id}>{holding.name.ko} · {holding.holderPersonId}</option>)}</select></label>
      {holdingLoadFailed && <p role="status" className="wiki-domain-label">개인 영지 정보를 불러오지 못했습니다.</p>}
      {showRail && !data.physicalRail && <p role="status" className="wiki-domain-label">검증된 서울 철도 선형 자료가 없어 노선을 표시하지 않습니다.</p>}
      {showRail && data.physicalRail && <p role="status" className="wiki-domain-label">서울 내부에서 확인된 철도 선형 부분만 표시합니다. 역 연결·노선 번호와 2126년 통행은 확인되지 않았습니다.</p>}
      {mode === 'titles' && <><label className="territory-filter"><span>지리 작위 등급</span><select value={rank} onChange={event => { setRank(event.target.value as GeographicRank); setTitleId(null); setDetailOpen(false) }}>{rankLabels.map(([value, ko, en]) => <option key={value} value={value}>{english ? en : ko}</option>)}</select></label>
      <label className="territory-filter"><span>작위 선택</span><select value={titleId ?? ''} onChange={event => selectTitle(resolveGeographicTitle(data.geography, event.target.value)?.id ?? null)}><option value="">선택 안 함</option>{visibleTitles.map(title => <option key={title.id} value={title.id}>{title.name}</option>)}</select></label></>}

      <fieldset className="territory-marker-filters"><legend>지도 표시</legend><label><input type="checkbox" checked={showStations} onChange={(event) => setShowStations(event.target.checked)} />역</label>{layer === 'surface' && <><label><input type="checkbox" checked={showLandmarks} onChange={(event) => setShowLandmarks(event.target.checked)} />시설</label></>}</fieldset>
      <span className="territory-controls-help">드래그·방향키 이동 · + / - 버튼 확대·축소</span>
    </div>


    {layer === 'underground' && <div className="territory-underground-legend" aria-label="지하 구간 상태 범례"><span><span className="territory-underground-swatch" data-control-status="held" />점유 {segmentCounts('held')}</span><span><span className="territory-underground-swatch" data-control-status="contested" style={{ backgroundColor: contestedColor }} />분쟁 {segmentCounts('contested')}</span><span><span className="territory-underground-swatch" data-control-status="unassigned" style={{ backgroundColor: unassignedColor }} />미배정 {segmentCounts('unassigned')}</span><span className="territory-tier-note">구간 원장에 별도 기록이 없으면 양 끝 역 상태로 색과 상태를 표시합니다. 이 표시만으로 구간 권리가 수여되지는 않습니다.</span></div>}
    <div className="territory-map-layout"><div className="territory-map-canvas territory-map-flat" data-flat-territory-map data-territory-layer={layer}>
      <div className="territory-flat-controls" role="group" aria-label="지도 범위"><button type="button" onClick={frameSeoul}>서울 전체</button><button type="button" onClick={() => zoom(0.8)} aria-label="지도 확대">+</button><button type="button" onClick={() => zoom(1.25)} aria-label="지도 축소">-</button>{([[-1, 0, '←', '왼쪽'], [1, 0, '→', '오른쪽'], [0, -1, '↑', '위쪽'], [0, 1, '↓', '아래쪽']] as const).map(([dx, dy, glyph, label]) => <button key={label} type="button" aria-label={`지도 ${label} 이동`} onClick={() => pan(dx, dy)}>{glyph}</button>)}</div>
      <svg ref={mapRef} className="territory-flat-svg" tabIndex={0} onKeyDown={event => { const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]; if (direction) { event.preventDefault(); pan(direction[0], direction[1]) } }} viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} role="img" aria-label={mode === 'titles' ? '서울 지리 작위별 관할' : layer === 'surface' ? '서울 정치 중심과 중립' : '서울 지하 역 구역과 역 사이 구간의 상태'} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <g onKeyDownCapture={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof SVGElement && event.target.hasAttribute('data-underground-segment')) setSegmentChoices([])
        }} onClickCapture={(event) => {
          if (layer !== 'underground' || !(event.target instanceof SVGElement) || !event.target.hasAttribute('data-underground-segment') || event.detail === 0) return
          event.stopPropagation()
          if (dragged.current) return
          const lines = Array.from(event.currentTarget.querySelectorAll<SVGLineElement>('line[data-underground-segment]'))
          const candidates = segmentPointerChoices({ x: event.clientX, y: event.clientY }, lines.flatMap((line) => {
            const matrix = line.getScreenCTM()
            const localMatrix = line.getCTM()
            const id = line.getAttribute('data-underground-segment')
            const style = getComputedStyle(line)
            if (!matrix || !localMatrix || !id || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || Number(style.strokeOpacity) === 0 || style.stroke === 'none') return []
            const a = new DOMPoint(line.x1.baseVal.value, line.y1.baseVal.value).matrixTransform(matrix)
            const b = new DOMPoint(line.x2.baseVal.value, line.y2.baseVal.value).matrixTransform(matrix)
            // non-scaling-stroke excludes the SVG viewBox scale, but not outer CSS scale.
            const cssScale = Math.hypot(matrix.a, matrix.b) / Math.hypot(localMatrix.a, localMatrix.b)
            const strokeScale = style.vectorEffect === 'non-scaling-stroke' ? cssScale : Math.hypot(matrix.a, matrix.b)
            return [{ id, a, b, strokeWidth: Number.parseFloat(style.strokeWidth) * strokeScale }]
          }))
          if (candidates.length === 1) {
            const segment = data.edges.find((edge) => edge.id === candidates[0])
            if (segment) selectSegment(segment)
            setSegmentChoices([])
          } else if (candidates.length > 1) {
            setDetailOpen(false)
            setSegmentChoices(candidates)
          } else {
            setSegmentChoices([])
          }
        }} clipPath="url(#seoul-title-extent)">{svgLayers}</g>
        <defs><clipPath id="seoul-title-extent"><path d={data.geography.titles.find(title => title.rank === 'empire')?.path} fillRule="evenodd" clipRule="evenodd" /></clipPath></defs>
      </svg>
      {segmentChoices.length > 1 && <div className="territory-segment-choices" role="group" aria-label="겹친 지하 구간 선택">
        <p>지하 구간 선택</p>
        {segmentChoices.map((id) => {
          const segment = data.edges.find((edge) => edge.id === id)
          return segment && <button key={id} type="button" className="territory-segment-choice" data-segment-choice={id} onClick={() => { selectSegment(segment); setSegmentChoices([]) }}>{stationPoints.get(segment.a)?.name ?? segment.a}–{stationPoints.get(segment.b)?.name ?? segment.b}</button>
        })}
        <button type="button" className="territory-segment-choice" onClick={() => setSegmentChoices([])}>닫기</button>
      </div>}
      {(selectedTitle || selectedState || selectedStation || selectedSegment || selectedLandmark || selected) && <button type="button" className="territory-detail-toggle" aria-expanded={detailOpen} aria-controls="territory-detail-panel" onClick={() => setDetailOpen((open) => !open)}>{detailOpen ? '정보 접기' : '정보 열기'}</button>}
      {detailOpen && <aside id="territory-detail-panel" className="territory-detail" aria-label="선택 정보" aria-live="polite"><button type="button" className="territory-detail-close" onClick={() => setDetailOpen(false)}>닫기</button>
        {selectedTitle && mode === 'titles' && <section data-geographic-detail={selectedTitle.id}><p className="wiki-domain-label">지리 작위 · {rankLabels.find(([value]) => value === selectedTitle.rank)?.[english ? 2 : 1]}</p><h3>{selectedTitle.name}</h3><p>보유자: {selectedTitle.holderPersonId ?? '소유 미확인'}</p><p>지리 관할은 수여·독점 소유·정치 봉속을 뜻하지 않습니다.</p>{selectedTitle.parentId && <button type="button" onClick={() => { const parent = resolveGeographicTitle(data.geography, selectedTitle.parentId); if (parent) { setRank(parent.rank); setTitleId(parent.id) } }}>상위 지리 작위</button>}<ul>{selectedTitle.countyIds.filter(id => id !== selectedTitle.id).map(id => <li key={id}><button type="button" onClick={() => { setRank('county'); setTitleId(id) }}>{resolveGeographicTitle(data.geography, id)?.name}</button></li>)}</ul>{selectedTitle.rank === 'county' && <>{(['datedSlots', 'currentSlots'] as const).map(key => <section key={key}><h4>{key === 'datedSlots' ? 'SGIS 경계 판본 · ' + data.geography.spatialDate : '현행 행정동 대응 · ' + data.geography.currentDate}</h4><p>{selectedTitle[key].length}개 슬롯{key === 'currentSlots' ? ' · 현행 경계 미검증' : ''}</p><ul>{selectedTitle[key].map(slot => <li key={slot.id} data-barony-slot={slot.id} data-slot-status={slot.status}>{slot.name}{slot.fragmentId ? ' · 분할 ' + slot.fragmentId : ''} · {slotStatusLabel(slot.status, english)} · {slot.holderPersonId ?? '소유 미확인'}</li>)}</ul></section>)}</>}</section>}
        {selectedTitle && mode === 'political' && <section data-political-detail={selectedTitle.id}><p className="wiki-domain-label">서울 정치 지도 · {selectedTitle.rank}</p><h3>{selectedTitle.name}</h3><p>표시 권역: {politicalTitle(selectedTitle).name}</p><p>정치 색은 서울 내부의 세 중심 세력과 중립만 표시하며 작위 보유·봉속을 뜻하지 않습니다.</p></section>}
        {selectedState && !showRegionDetail && <section><p className="wiki-domain-label">선택 국가 · {selectedState.name}</p><h3>{selectedState.name}</h3><table className="person-data-table"><tbody><tr><th>수장</th><td>{selectedState.ruler}</td></tr><tr><th>현재 종주 소속</th><td>{selectedState.currentHegemon.name}</td></tr><tr><th>현재 거점</th><td>{selectedState.currentBase.name}</td></tr><tr><th>수도역</th><td>{selectedState.capitalStationId}</td></tr><tr><th>단독 지표 배정 기록</th><td>{selectedState.currentExclusiveDistrictCount}개 동</td></tr><tr><th>정부와 승계</th><td>{selectedState.government}</td></tr><tr><th>정부와의 관계</th><td>{selectedState.relation ?? '해당 없음'}</td></tr><tr><th>국교</th><td>{selectedState.religion}</td></tr></tbody></table><p>해당 국가만 지표 보유 세력으로 기록된 동의 수입니다. 백작령 작위·남작령 슬롯 보유나 독점 소유를 뜻하지 않습니다.</p><Link to={`/states/${selectedState.slug}`} className="territory-state-link">{selectedState.name} 국가 상세 보기</Link></section>}
        {selectedHolding && holdings && (selectedStation || selectedLandmark || selected && showRegionDetail) && <HoldingSelectionPanel holding={selectedHolding} openingYear={holdings.openingYear} titles={holdings.titles} selectedRegionId={selected?.id ?? ''} onSelectRegion={id => { const title = resolveGeographicSelection(data.geography, id); if (title) { setMode('titles'); setRank('county'); setTitleId(title.id); setDetailOpen(true) } }} />}
        {selected && showRegionDetail && <section><p className="wiki-domain-label">선택된 지역 · {selected.district}</p><h3>{selected.name}</h3><dl><dt>직속 보유</dt><dd>{selected.polities.map(id => `${id} ${states.get(id)?.name ?? id}`).join(' · ')}</dd><dt>현재 상위</dt><dd>{selected.currentHegemons.map(hegemon => hegemon.name).join(' · ')}</dd></dl><p>2126년 인구 밀도 {Math.round(selected.density2126).toLocaleString('ko-KR')}명/km²</p><p className="wiki-domain-label">{data.populationAttribution}</p><p>{selected.openingState}</p><p>{selected.summary}</p></section>}
        {selectedStation && <section><p className="wiki-domain-label">서울 역 정보</p><h3>{selectedStation.names.join(' · ')}</h3><p>직접 보유: {selectedStation.control.polityNames.join(' · ')}<br />현재 종주 소속: {selectedStation.control.currentHegemons.map(hegemon => hegemon.name).join(' · ')}</p><table className="person-data-table"><tbody><tr><th>구</th><td>{selectedStation.district}</td></tr>{selectedStation.control.memberSurfaces && new Set(selectedStation.control.memberSurfaces.map((entry) => entry.surfaceRegionName)).size > 1 && <tr><th>지표 관측</th><td>{selectedStation.control.memberSurfaces.map((entry) => `${entry.id}: ${entry.surfaceRegionName ?? '범위 밖'} · ${entry.surfacePolityIds.map((id) => states.get(id)?.name ?? id).join(' · ') || '기록 없음'}`).join(' / ')}</td></tr>}<tr><th>노선·환승</th><td>{selectedStation.lineIds.map((id) => data.lines[id]?.name ?? id).join(' · ')}</td></tr><tr><th>역 상태</th><td>{selectedStation.control.status === 'held' ? '점유' : selectedStation.control.status === 'contested' ? '분쟁' : selectedStation.control.status === 'vacant' ? '무주지' : '상태 기록 없음'}</td></tr><tr><th>직접 관여 세력</th><td>{selectedStation.control.polityNames.join(' · ') || '기록 없음'}</td></tr><tr><th>경비·통행 우선</th><td>{selectedStation.control.primary ? states.get(selectedStation.control.primary)?.name ?? selectedStation.control.primary : '기록 없음'}</td></tr><tr><th>지배 계층</th><td>{selectedStation.control.hierarchy.state} → {selectedStation.control.hierarchy.regionalAuthority} → {selectedStation.control.hierarchy.stationManager}</td></tr>{selectedStation.lineIds.map((id) => { const entry = stationDetail?.[id] ?? selectedStation.memberIds.map((member) => underground?.stations[member]?.[id]).find(Boolean); return entry ? <tr key={id}><th>{data.lines[id]?.name ?? id} 승강장</th><td>{entry.floors ?? '층 기록 없음'} · {entry.platformM == null ? '심도 기록 없음' : `${entry.platformM} m`} · 출구 {entry.exits ?? '기록 없음'}</td></tr> : null })}</tbody></table></section>}
        {selectedSegment && <section><p className="wiki-domain-label">지하 역 사이 구간</p><h3>{stationPoints.get(selectedSegment.a)?.name ?? selectedSegment.a}–{stationPoints.get(selectedSegment.b)?.name ?? selectedSegment.b}</h3><table className="person-data-table"><tbody><tr><th>노선</th><td>{selectedSegment.lineIds.map((id) => data.lines[id]?.name ?? id).join(' · ') || '기록 없음'}</td></tr><tr><th>구간 상태</th><td>{segmentStatusLabel(selectedSegment.control.status)}</td></tr><tr><th>표시상 관여 국가</th><td>{selectedSegment.control.polityIds.map((id) => states.get(id)?.name ?? id).join(' · ') || '미배정'}</td></tr><tr><th>표시상 종주 소속</th><td>{selectedSegment.control.currentHegemons.map(hegemon => hegemon.name).join(' · ')}</td></tr><tr><th>표시 기준</th><td>{selectedSegment.control.source === 'control-delta' ? '구간 원장' : '양 끝 역 상태에서 파생 (권리 수여 아님)'}</td></tr><tr><th>2126 통행</th><td>{passageLabel(selectedSegment.passage2126)}</td></tr></tbody></table></section>}
        {selectedLandmarkData && <section><p className="wiki-domain-label">주요 시설</p><h3>{selectedLandmarkData.name}</h3><p>{selectedLandmarkData.role}</p><p>{selectedLandmarkData.detail}</p></section>}
      </aside>}
    </div></div>
    {mode === 'political' && <div className="territory-legend" aria-label="서울 정치 권역 범례">{[...data.hegemons.map((hegemon) => ({ name: hegemon.name, color: hegemon.color })), { name: '중립', color: unassignedColor }, { name: '혼재', color: contestedColor }].map((entry) => <span key={entry.name}><span className="territory-legend-swatch" style={{ backgroundColor: entry.color }} /><span>{entry.name}</span></span>)}</div>}
    <p className="wiki-domain-label">{data.epoch.label} · {data.attribution} · 지리 작위 경계 {data.geography.spatialDate}{showRail && data.physicalRail ? ` · ${data.physicalRail.attribution}` : ''}</p>
  </section>
}
