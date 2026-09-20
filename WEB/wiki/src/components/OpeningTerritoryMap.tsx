import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { StateFlag } from './StateFlag'

type State = { id: string; name: string; slug: string; power: string; labelX: number; labelY: number }
type Region = { id: string; name: string; district: string; path: string; polities: string[]; status: 'held' | 'contested'; openingState: string; summary: string; stationCount: number }
type TerritoryData = { width: number; height: number; epoch: { label: string }; states: State[]; regions: Region[]; attribution: string }
type MarkerPosition = { left: number; top: number; visible: boolean }
type RegionMesh = THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial> & { userData: { regionId: string; baseColor: string } }

const colors = ['#b54b4b', '#9b6a34', '#7360a7', '#347b74', '#735377', '#426f99', '#8b7242', '#567b46', '#875b5b', '#2f7584', '#64708a', '#7c5f3f', '#9b525f', '#496b56', '#956f28', '#58649a']

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
  const [markerPositions, setMarkerPositions] = useState<Record<string, MarkerPosition>>({})
  const [failed, setFailed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<{ reset: () => void; meshes: RegionMesh[]; render: () => void } | null>(null)
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

    const render = () => {
      renderer.render(scene, camera)
      const next: Record<string, MarkerPosition> = {}
      const projected = data.states.map((state) => {
        const vector = new THREE.Vector3((state.labelX - data.width / 2) * scale, 2.1, (state.labelY - data.height / 2) * scale).project(camera)
        return { state, top: (-vector.y * 0.5 + 0.5) * 100, visible: vector.z > -1 && vector.z < 1 }
      })
      for (const [side, candidates] of [
        ['left', projected.filter(({ state }) => state.labelX < data.width / 2)],
        ['right', projected.filter(({ state }) => state.labelX >= data.width / 2)],
      ] as const) {
        candidates.sort((left, right) => left.top - right.top || left.state.id.localeCompare(right.state.id))
        candidates.forEach((candidate, index) => {
          const top = candidates.length === 1 ? 50 : 7 + index * 86 / (candidates.length - 1)
          next[candidate.state.id] = { left: side === 'left' ? 10 : 90, top, visible: candidate.visible }
        })
      }
      setMarkerPositions(next)
    }
    const reset = () => {
      camera.position.set(0, 82, 104)
      controls.target.set(0, 0, 1)
      controls.update()
      render()
    }
    runtimeRef.current = { reset, meshes, render }

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
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
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

  if (failed) return <p className="wiki-domain-label">3D 개막 영토 지도를 불러오지 못했습니다. 국가 필터와 정본 링크는 아래 범례에서 확인할 수 있습니다.</p>
  if (!data) return <div className="wiki-loading">서울 427개 동 3D 개막 영토 지도를 불러오고 있습니다.</div>

  return (
    <section className="territory-map-section" aria-labelledby="opening-territory-title">
      <header><p className="wiki-domain-label">서울 전체 · 캠페인 개막 시점 · Three.js</p><h2 id="opening-territory-title">3D 개막 영토 지도</h2><p>서울 25개 구·427개 행정동을 미니어처 지형으로 돌출했습니다. 높이는 지배 상태와 역 분포를 읽기 위해 과장한 표시이며 실제 측량 고도가 아닙니다.</p></header>
      <div className="territory-toolbar">
        <label className="territory-filter"><span>국가 필터</span><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">16국 전체</option>{data.states.map((state) => <option key={state.id} value={state.id}>{state.id} · {state.name}</option>)}</select></label>
        <label className="territory-filter"><span>지역 선택</span><select value={selectedId ?? ''} onChange={(event) => setSelectedId(event.target.value)}>{data.regions.map((region) => <option key={region.id} value={region.id}>{region.district} · {region.name}</option>)}</select></label>
        <button type="button" onClick={() => runtimeRef.current?.reset()}>전체 보기</button>
        <span className="territory-controls-help">팬 · 오빗 · 줌</span>
      </div>
      <div className="territory-map-layout">
        <div className="territory-map-canvas territory-map-canvas-3d" ref={shellRef} data-three-territory-map>
          <canvas ref={canvasRef} aria-label="서울 427개 동 Three.js 개막 영토 지도" />
          <div className="territory-state-markers" aria-label="16국 국가명과 깃발">
            {data.states.map((state) => {
              const position = markerPositions[state.id]
              return <button key={state.id} type="button" className="territory-state-marker" aria-pressed={stateFilter === state.id} style={{ left: `${position?.left ?? state.labelX / data.width * 100}%`, top: `${position?.top ?? state.labelY / data.height * 100}%`, visibility: position?.visible === false ? 'hidden' : 'visible' }} onClick={() => setStateFilter(state.id)}><StateFlag stateId={state.id} /><span><strong>{state.id}</strong>{state.name}</span></button>
            })}
          </div>
        </div>
        <aside className="territory-detail" aria-live="polite">
          {selected && <><p className="wiki-domain-label">{selected.district}</p><h3>{selected.name}</h3><table className="person-data-table"><tbody><tr><th>지배 상태</th><td>{selected.status === 'held' ? '단독 지배' : '경합·공동 영향권'}</td></tr><tr><th>영토국</th><td>{selected.polities.map((id) => states.get(id)?.name ?? id).join(' · ')}</td></tr><tr><th>역 객체</th><td>{selected.stationCount}개</td></tr></tbody></table><h4>개막 상태</h4><p>{selected.openingState}</p><h4>지역 개요</h4><p>{selected.summary}</p>{selected.polities.map((id) => states.get(id)).filter(Boolean).map((state) => <Link key={state!.id} to={`/states/${state!.slug}`} className="territory-state-link">{state!.id} {state!.name}</Link>)}</>}
        </aside>
      </div>
      <div className="territory-legend">{data.states.map((state) => <button key={state.id} type="button" onClick={() => setStateFilter(state.id)} aria-pressed={stateFilter === state.id}><StateFlag stateId={state.id} /><span>{state.id} {state.name}</span></button>)}<span className="territory-contested-key">낮은 돌출: 경합지</span></div>
      <p className="wiki-domain-label">{data.epoch.label} · 국기 도안은 국가 기원에서 만든 공식 위키 식별기 · 3D 높이는 가독성용 과장 · {data.attribution}</p>
    </section>
  )
}
