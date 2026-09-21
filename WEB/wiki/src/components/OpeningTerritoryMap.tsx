import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { StateFlag } from './StateFlag'

type State = { id: string; name: string; slug: string; power: string; labelX: number; labelY: number; capitalStationId: string; capitalX: number; capitalY: number }
type Region = { id: string; name: string; district: string; path: string; polities: string[]; status: 'held' | 'contested'; openingState: string; summary: string; stationCount: number }
type LineDefinition = { name: string; color: string }
type StationControl = { source: 'derived-from-surface' | 'outside-surface-atlas' | 'control-delta'; deltaId: string | null; status: 'held' | 'contested' | 'unknown'; polityIds: string[]; polityNames: string[]; surfaceRegionId: string | null; surfaceRegionName: string | null; hierarchy: { state: string; regionalAuthority: string; stationManager: string } }
type Station = { id: string; name: string; district: string; x: number; y: number; degree: number; lineIds: string[]; control: StationControl }
type SubwayEdge = { a: string; b: string; lineIds: string[] }
type TerritoryData = { width: number; height: number; epoch: { label: string }; states: State[]; lines: Record<string, LineDefinition>; stations: Station[]; edges: SubwayEdge[]; majorStationIds: string[]; regions: Region[]; attribution: string }
type MarkerPosition = { left: number; top: number; anchorLeft: number; anchorTop: number; visible: boolean }
type RegionMesh = THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial> & { userData: { regionId: string; baseColor: string } }

const colors = ['#b54b4b', '#9b6a34', '#7360a7', '#347b74', '#735377', '#426f99', '#8b7242', '#567b46', '#875b5b', '#2f7584', '#64708a', '#7c5f3f', '#9b525f', '#496b56', '#956f28', '#58649a']

const resolveMarkerCollisions = (markers: Array<{ id: string; left: number; top: number; visible: boolean }>, width: number, height: number) => {
  const placed: Array<{ id: string; left: number; top: number; anchorLeft: number; anchorTop: number; visible: boolean }> = []
  const markerWidth = 148
  const markerHeight = 52
  const gap = 6
  const offsets: Array<[number, number]> = [[0, 0]]
  for (const radius of [1, 2, 3, 4]) {
    for (const [x, y] of [[radius, 0], [-radius, 0], [0, -radius], [0, radius], [radius, -radius], [radius, radius], [-radius, -radius], [-radius, radius]]) {
      offsets.push([x * (markerWidth + gap), y * (markerHeight + gap)])
    }
  }
  for (const marker of [...markers].sort((a, b) => a.top - b.top || a.left - b.left || a.id.localeCompare(b.id))) {
    const anchorX = marker.left / 100 * width
    const anchorY = marker.top / 100 * height
    let candidateX = anchorX
    let candidateY = anchorY
    for (const [offsetX, offsetY] of offsets) {
      const x = THREE.MathUtils.clamp(anchorX + offsetX, markerWidth / 2 + gap, width - markerWidth / 2 - gap)
      const y = THREE.MathUtils.clamp(anchorY + offsetY, markerHeight + gap, height - gap)
      const collision = placed.some((other) => {
        const otherX = other.left / 100 * width
        const otherY = other.top / 100 * height
        return Math.abs(otherX - x) < markerWidth + gap && Math.abs(otherY - y) < markerHeight + gap
      })
      if (collision) continue
      candidateX = x
      candidateY = y
      break
    }
    placed.push({ ...marker, left: candidateX / width * 100, top: candidateY / height * 100, anchorLeft: marker.left, anchorTop: marker.top })
  }
  return Object.fromEntries(placed.map((marker) => [marker.id, marker]))
}

const parseTerritoryPath = (path: string) => {
  if (!/^M-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?(?: L-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?)+ Z$/u.test(path)) throw new Error('E_TERRITORY_PATH')
  const points = [...path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gu)].map((match) => [Number(match[1]), Number(match[2])] as const)
  if (points.length < 3 || points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) throw new Error('E_TERRITORY_POINTS')
  return points
}

export default function OpeningTerritoryMap() {
  const [data, setData] = useState<TerritoryData | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedLine, setSelectedLine] = useState('all')
  const [markerPositions, setMarkerPositions] = useState<Record<string, MarkerPosition>>({})
  const [stationMarkerPositions, setStationMarkerPositions] = useState<Record<string, MarkerPosition>>({})
  const [hoveredStation, setHoveredStation] = useState<{ station: Station; left: number; top: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<{ reset: () => void; pan: (x: number, z: number) => void; zoom: (factor: number) => void; meshes: RegionMesh[]; lineMaterials: Map<string, THREE.LineBasicMaterial>; render: () => void } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void fetch(`${import.meta.env.BASE_URL}opening-territories.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`E_TERRITORY_HTTP:${response.status}`)
        return response.json() as Promise<TerritoryData>
      })
      .then((value) => { setData(value); setSelectedId(value.regions[0]?.id ?? null) })
      .catch((error) => { if (error.name !== 'AbortError') setFailed(true) })
    return () => controller.abort()
  }, [])

  const states = useMemo(() => new Map(data?.states.map((state, index) => [state.id, { ...state, color: colors[index] }]) ?? []), [data])
  const selected = data?.regions.find((region) => region.id === selectedId)

  useEffect(() => {
    if (!data || !canvasRef.current || !shellRef.current) return
    const canvas = canvasRef.current
    const shell = shellRef.current
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x07151c, 1)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x07151c, 105, 180)
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 300)
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = false
    controls.screenSpacePanning = false
    controls.minPolarAngle = Math.PI * 0.16
    controls.maxPolarAngle = Math.PI * 0.47
    controls.minDistance = 42
    controls.maxDistance = 155
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN

    scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x18262c, 2.1))
    const key = new THREE.DirectionalLight(0xffe6bd, 3.4)
    key.position.set(-45, 70, 52)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x72c7db, 1.6)
    rim.position.set(65, 30, -55)
    scene.add(rim)

    const scale = 100 / data.width
    const mapWorldHeight = data.height * scale
    const stationById = new Map(data.stations.map((station) => [station.id, station]))
    const meshes: RegionMesh[] = []
    const disposables: Array<{ dispose: () => void }> = []
    for (const region of data.regions) {
      const points = parseTerritoryPath(region.path)
      const shape = new THREE.Shape()
      points.forEach(([svgX, svgY], index) => {
        const x = (svgX - data.width / 2) * scale
        const y = (data.height / 2 - svgY) * scale
        if (index === 0) shape.moveTo(x, y)
        else shape.lineTo(x, y)
      })
      shape.closePath()
      const depth = (region.status === 'held' ? 0.82 : 0.46) + Math.min(region.stationCount * 0.035, 0.28)
      const geometry = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false })
      geometry.rotateX(-Math.PI / 2)
      geometry.computeVertexNormals()
      const baseColor = region.status === 'contested' ? '#9f9276' : states.get(region.polities[0])?.color ?? '#777777'
      const material = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.68, metalness: 0.08, emissive: 0x061016, emissiveIntensity: 0.18 })
      const mesh = new THREE.Mesh(geometry, material) as RegionMesh
      mesh.userData = { regionId: region.id, baseColor }
      scene.add(mesh)
      meshes.push(mesh)
      disposables.push(geometry, material)
    }

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(106, 1.2, mapWorldHeight + 6),
      new THREE.MeshStandardMaterial({ color: 0x10242c, roughness: 0.88, metalness: 0.02 }),
    )
    base.position.y = -0.72
    scene.add(base)
    disposables.push(base.geometry, base.material)

    const subwayPositionsByLine = new Map<string, number[]>()
    for (const edge of data.edges) {
      const a = stationById.get(edge.a)
      const b = stationById.get(edge.b)
      if (!a || !b) continue
      const lineIds = edge.lineIds.length > 0 ? edge.lineIds : ['unclassified']
      for (const lineId of lineIds) {
        if (!subwayPositionsByLine.has(lineId)) subwayPositionsByLine.set(lineId, [])
        subwayPositionsByLine.get(lineId)!.push(
          (a.x - data.width / 2) * scale, 1.38, (a.y - data.height / 2) * scale,
          (b.x - data.width / 2) * scale, 1.38, (b.y - data.height / 2) * scale,
        )
      }
    }
    const lineMaterials = new Map<string, THREE.LineBasicMaterial>()
    for (const [lineId, positions] of subwayPositionsByLine) {
      const subwayGeometry = new THREE.BufferGeometry()
      subwayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      const subwayMaterial = new THREE.LineBasicMaterial({ color: data.lines[lineId]?.color ?? '#78868a', transparent: true, opacity: 0.72 })
      const subwayLines = new THREE.LineSegments(subwayGeometry, subwayMaterial)
      subwayLines.userData.lineId = lineId
      subwayLines.renderOrder = 3
      scene.add(subwayLines)
      lineMaterials.set(lineId, subwayMaterial)
      disposables.push(subwayGeometry, subwayMaterial)
    }

    const stationPositions = data.stations.flatMap((station) => [(station.x - data.width / 2) * scale, 1.52, (station.y - data.height / 2) * scale])
    const stationGeometry = new THREE.BufferGeometry()
    stationGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stationPositions, 3))
    stationGeometry.setAttribute('stationIndex', new THREE.Float32BufferAttribute(data.stations.map((_, index) => index), 1))
    const stationMaterial = new THREE.PointsMaterial({ color: 0xf8f1cf, size: 0.38, sizeAttenuation: true })
    const stationPoints = new THREE.Points(stationGeometry, stationMaterial)
    stationPoints.renderOrder = 4
    scene.add(stationPoints)
    disposables.push(stationGeometry, stationMaterial)

    const capitalPositions = data.states.flatMap((state) => [(state.capitalX - data.width / 2) * scale, 2.25, (state.capitalY - data.height / 2) * scale])
    const capitalGeometry = new THREE.BufferGeometry()
    capitalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(capitalPositions, 3))
    const capitalMaterial = new THREE.PointsMaterial({ color: 0xffd66b, size: 1.65, sizeAttenuation: true })
    const capitalPoints = new THREE.Points(capitalGeometry, capitalMaterial)
    capitalPoints.renderOrder = 5
    scene.add(capitalPoints)
    disposables.push(capitalGeometry, capitalMaterial)

    const render = () => {
      renderer.render(scene, camera)
      const projectedStates = data.states.map((state) => {
        const vector = new THREE.Vector3((state.capitalX - data.width / 2) * scale, 2.75, (state.capitalY - data.height / 2) * scale).project(camera)
        return { id: state.id, left: (vector.x * 0.5 + 0.5) * 100, top: (-vector.y * 0.5 + 0.5) * 100, visible: vector.z > -1 && vector.z < 1 }
      })
      setMarkerPositions(resolveMarkerCollisions(projectedStates, Math.max(shell.clientWidth, 1), Math.max(shell.clientHeight, 1)))
      const nextStations: Record<string, MarkerPosition> = {}
      for (const station of data.stations) {
        const vector = new THREE.Vector3((station.x - data.width / 2) * scale, 1.82, (station.y - data.height / 2) * scale).project(camera)
        const left = (vector.x * 0.5 + 0.5) * 100
        const top = (-vector.y * 0.5 + 0.5) * 100
        nextStations[station.id] = { left, top, anchorLeft: left, anchorTop: top, visible: vector.z > -1 && vector.z < 1 }
      }
      setStationMarkerPositions(nextStations)
    }
    const reset = () => {
      camera.position.set(0, 82, 104)
      controls.target.set(0, 0, 1)
      controls.update()
      render()
    }
    const pan = (x: number, z: number) => {
      const delta = new THREE.Vector3(x, 0, z)
      camera.position.add(delta)
      controls.target.add(delta)
      controls.update()
      render()
    }
    const zoom = (factor: number) => {
      const offset = camera.position.clone().sub(controls.target)
      const distance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)
      camera.position.copy(controls.target).add(offset.setLength(distance))
      controls.update()
      render()
    }
    runtimeRef.current = { reset, pan, zoom, meshes, lineMaterials, render }

    let pointerStart: [number, number] | null = null
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerDown = (event: PointerEvent) => { pointerStart = [event.clientX, event.clientY] }
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5) return
      const rect = canvas.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(meshes, false)[0]?.object as RegionMesh | undefined
      if (hit?.userData.regionId) setSelectedId(hit.userData.regionId)
    }
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.params.Points.threshold = 1.25
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(stationPoints, false)[0]
      const station = hit && Number.isInteger(hit.index) ? data.stations[hit.index!] : null
      setHoveredStation(station ? { station, left: event.clientX - rect.left, top: event.clientY - rect.top } : null)
    }
    const onPointerLeave = () => setHoveredStation(null)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    controls.addEventListener('change', render)

    const resize = () => {
      const width = Math.max(1, shell.clientWidth)
      const height = Math.max(1, shell.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(shell)
    reset()
    resize()

    return () => {
      observer.disconnect()
      controls.removeEventListener('change', render)
      controls.dispose()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      for (const disposable of disposables) disposable.dispose()
      renderer.dispose()
      runtimeRef.current = null
    }
  }, [data, states])

  useEffect(() => {
    if (!data || !runtimeRef.current) return
    for (const mesh of runtimeRef.current.meshes) {
      const region = data.regions.find((candidate) => candidate.id === mesh.userData.regionId)
      if (!region) continue
      const visible = stateFilter === 'all' || region.polities.includes(stateFilter)
      mesh.material.color.set(selectedId === region.id ? '#f8e9a3' : visible ? mesh.userData.baseColor : '#23343a')
      mesh.material.emissiveIntensity = selectedId === region.id ? 0.62 : visible ? 0.18 : 0.05
    }
    runtimeRef.current.render()
  }, [data, selectedId, stateFilter])

  useEffect(() => {
    if (!runtimeRef.current) return
    for (const [lineId, material] of runtimeRef.current.lineMaterials) {
      const selected = selectedLine === 'all' || lineId === selectedLine
      material.opacity = selected ? (selectedLine === 'all' ? 0.72 : 1) : 0.08
    }
    runtimeRef.current.render()
  }, [selectedLine])

  if (failed) return <p className="wiki-domain-label">3D 개막 영토 지도를 불러오지 못했습니다. 국가 필터와 정본 링크는 아래 범례에서 확인할 수 있습니다.</p>
  if (!data) return <div className="wiki-loading">서울 427개 동 3D 개막 영토 지도를 불러오고 있습니다.</div>

  return (
    <section className="territory-map-section" aria-labelledby="opening-territory-title">
      <header><p className="wiki-domain-label">서울 전체 · 캠페인 개막 시점 · Three.js</p><h2 id="opening-territory-title">3D 개막 영토 지도</h2><p>서울 25개 구·427개 행정동을 미니어처 지형으로 돌출했습니다. 높이는 지배 상태와 역 분포를 읽기 위해 과장한 표시이며 실제 측량 고도가 아닙니다.</p></header>
      <div className="territory-toolbar">
        <label className="territory-filter"><span>국가 필터</span><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">16국 전체</option>{data.states.map((state) => <option key={state.id} value={state.id}>{state.id} · {state.name}</option>)}</select></label>
        <label className="territory-filter"><span>노선 필터</span><select value={selectedLine} onChange={(event) => setSelectedLine(event.target.value)}><option value="all">전체 노선</option>{Object.entries(data.lines).map(([lineId, line]) => <option key={lineId} value={lineId}>{line.name}</option>)}</select></label>
        <label className="territory-filter"><span>지역 선택</span><select value={selectedId ?? ''} onChange={(event) => setSelectedId(event.target.value)}>{data.regions.map((region) => <option key={region.id} value={region.id}>{region.district} · {region.name}</option>)}</select></label>
        <button type="button" onClick={() => runtimeRef.current?.reset()}>전체 보기</button>
        <div className="territory-camera-controls" aria-label="3D 지도 카메라 조작">
          <button type="button" onClick={() => runtimeRef.current?.pan(0, -6)}>팬 북쪽</button>
          <button type="button" onClick={() => runtimeRef.current?.pan(-6, 0)}>팬 서쪽</button>
          <button type="button" onClick={() => runtimeRef.current?.pan(6, 0)}>팬 동쪽</button>
          <button type="button" onClick={() => runtimeRef.current?.pan(0, 6)}>팬 남쪽</button>
          <button type="button" onClick={() => runtimeRef.current?.zoom(0.78)}>줌인</button>
          <button type="button" onClick={() => runtimeRef.current?.zoom(1.28)}>줌아웃</button>
        </div>
        <span className="territory-controls-help">드래그 오빗 · 오른쪽 드래그 팬 · 휠 줌</span>
      </div>
      <div className="territory-map-layout">
        <div className="territory-map-canvas territory-map-canvas-3d" ref={shellRef} data-three-territory-map>
          <canvas ref={canvasRef} aria-label="서울 427개 동 Three.js 개막 영토 지도" />
          <svg className="territory-marker-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {data.states.map((state) => {
              const position = markerPositions[state.id]
              if (!position?.visible || (Math.abs(position.left - position.anchorLeft) < 0.5 && Math.abs(position.top - position.anchorTop) < 0.5)) return null
              return <line key={state.id} x1={position.anchorLeft} y1={position.anchorTop} x2={position.left} y2={position.top} />
            })}
          </svg>
          <div className="territory-state-markers" aria-label="16국 국가명과 깃발">
            {data.states.map((state) => {
              const position = markerPositions[state.id]
              const capital = data.stations.find((station) => station.id === state.capitalStationId)
              return <button key={state.id} type="button" className="territory-state-marker territory-capital-marker" data-capital-station-id={state.capitalStationId} aria-pressed={stateFilter === state.id} style={{ left: `${position?.left ?? state.capitalX / data.width * 100}%`, top: `${position?.top ?? state.capitalY / data.height * 100}%`, visibility: position?.visible === false ? 'hidden' : 'visible' }} onClick={() => setStateFilter(state.id)}><StateFlag stateId={state.id} /><span><strong>{state.id} · 수도역 {capital?.name ?? state.capitalStationId}</strong>{state.name}</span></button>
            })}
          </div>
          <div className="territory-station-markers" aria-label="주요 지하철역 이름">
            {data.majorStationIds.map((stationId) => {
              const station = data.stations.find((candidate) => candidate.id === stationId)
              const position = stationMarkerPositions[stationId]
              if (!station) return null
              if (selectedLine !== 'all' && !station.lineIds.includes(selectedLine)) return null
              return <span key={station.id} className="territory-station-marker" data-station-id={station.id} style={{ left: `${position?.left ?? station.x / data.width * 100}%`, top: `${position?.top ?? station.y / data.height * 100}%`, visibility: position?.visible === false ? 'hidden' : 'visible' }}>{station.name}</span>
            })}
          </div>
          <div className="territory-station-hit-targets" aria-label="334개 역 점령 정보">
            {data.stations.map((station) => {
              const position = stationMarkerPositions[station.id]
              if (!position || position.visible === false || (selectedLine !== 'all' && !station.lineIds.includes(selectedLine))) return null
              const showTooltip = () => setHoveredStation({ station, left: position.left / 100 * (shellRef.current?.clientWidth ?? 1), top: position.top / 100 * (shellRef.current?.clientHeight ?? 1) })
              const lineColor = data.lines[station.lineIds[0]]?.color ?? '#f8f1cf'
              return <button key={station.id} type="button" className="territory-station-hit" data-station-id={station.id} aria-label={`${station.name} 역 정보`} style={{ left: `${position.left}%`, top: `${position.top}%`, borderColor: lineColor }} onPointerEnter={showTooltip} onPointerLeave={() => setHoveredStation(null)} onFocus={showTooltip} onBlur={() => setHoveredStation(null)} />
            })}
          </div>
          {hoveredStation && <div className="territory-station-tooltip" role="status" style={{ left: hoveredStation.left, top: hoveredStation.top }}>
            <strong>{hoveredStation.station.name}</strong>
            <div className="territory-tooltip-lines">{hoveredStation.station.lineIds.length > 0 ? hoveredStation.station.lineIds.map((lineId) => <span key={lineId} style={{ borderColor: data.lines[lineId]?.color, color: data.lines[lineId]?.color }}>{data.lines[lineId]?.name ?? lineId}</span>) : <span>노선 미확인</span>}</div>
            <dl>
              <div><dt>점령 상태</dt><dd>{hoveredStation.station.control.status === 'held' ? '단독 지배' : hoveredStation.station.control.status === 'contested' ? '경합' : '미확인'}</dd></div>
              <div><dt>지배 국가</dt><dd>{hoveredStation.station.control.hierarchy.state}</dd></div>
              <div><dt>지배 계층</dt><dd>{hoveredStation.station.control.hierarchy.state} → {hoveredStation.station.control.hierarchy.regionalAuthority} → {hoveredStation.station.control.hierarchy.stationManager}</dd></div>
              <div><dt>점령 원장</dt><dd>{hoveredStation.station.control.source === 'derived-from-surface' ? '지표 영토 기반 초안' : hoveredStation.station.control.source === 'control-delta' ? `역 점령 변경 기록${hoveredStation.station.control.deltaId ? ` · ${hoveredStation.station.control.deltaId}` : ''}` : '서울 영토 원장 밖 · 미확인'}</dd></div>
            </dl>
          </div>}
        </div>
        <aside className="territory-detail" aria-live="polite">
          {selected && <><p className="wiki-domain-label">{selected.district}</p><h3>{selected.name}</h3><table className="person-data-table"><tbody><tr><th>지배 상태</th><td>{selected.status === 'held' ? '단독 지배' : '경합·공동 영향권'}</td></tr><tr><th>영토국</th><td>{selected.polities.map((id) => states.get(id)?.name ?? id).join(' · ')}</td></tr><tr><th>역 객체</th><td>{selected.stationCount}개</td></tr></tbody></table><h4>개막 상태</h4><p>{selected.openingState}</p><h4>지역 개요</h4><p>{selected.summary}</p>{selected.polities.map((id) => states.get(id)).filter(Boolean).map((state) => <Link key={state!.id} to={`/states/${state!.slug}`} className="territory-state-link">{state!.id} {state!.name}</Link>)}</>}
        </aside>
      </div>
      <div className="territory-legend">{data.states.map((state) => <button key={state.id} type="button" onClick={() => setStateFilter(state.id)} aria-pressed={stateFilter === state.id}><StateFlag stateId={state.id} /><span>{state.id} {state.name}</span></button>)}<span className="territory-contested-key">낮은 돌출: 경합지</span></div>
      <div className="territory-line-legend" aria-label="서울 지하철 노선 색상"><button type="button" aria-pressed={selectedLine === 'all'} onClick={() => setSelectedLine('all')}>전체 노선</button>{Object.entries(data.lines).map(([lineId, line]) => <button key={lineId} type="button" aria-pressed={selectedLine === lineId} onClick={() => setSelectedLine(lineId)}><span style={{ backgroundColor: line.color }} />{line.name}</button>)}</div>
      <details className="territory-flag-provenance"><summary>16국 깃발 콘셉트 시트와 채택 자산</summary><p>CLIProxy Gemini로 생성한 4×4 콘셉트 시트를 Artkit으로 16개 셀에 분리해 지도·범례의 실제 깃발 자산으로 사용합니다.</p><img src={`${import.meta.env.BASE_URL}state-flags/concept-sheet.webp`} alt="16국 깃발 4×4 콘셉트 시트" loading="lazy" /></details>
      <p className="wiki-domain-label">{data.epoch.label} · 국기 도안은 국가 기원에서 만든 공식 위키 식별기 · 3D 높이는 가독성용 과장 · {data.attribution}</p>
    </section>
  )
}
