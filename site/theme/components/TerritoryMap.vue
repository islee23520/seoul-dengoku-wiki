<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { withBase } from 'vitepress'
import { CLICK_SLOP, MAX_ZOOM, initialState, panBy, reduce, zoomAt, type Box, type MapAction, type MapState, type Point, type Rank } from '../machines/territoryMap'

interface Control { status: string; states: string[]; names: string[]; overlords: string[] }
interface Core {
  labels: Record<string, any>; width: number; height: number; epoch: string; attribution: string; unassigned: string
  factions: { id: string; name: string; color: string }[]
  states: { id: string; name: string; faction: string; color: string; ruler: string; capital: string; government: string; power: string; cause: string; capitalX: number | null; capitalY: number | null; regions: number }[]
  regions: { id: string; name: string; district: string; faction: string | null; status: string; states: string[]; summary: string; openingState: string; area: number | null; density: number | null }[]
  titles: { id: string; rank: Rank; name: string; parent: string | null; counties: string[]; faction: string | null; districts: string[] }[]
  ranks: Rank[]
  stations: { id: string; name: string; district: string; x: number; y: number; lines: string[]; states: string[]; control: Control }[]
  edges: { id: string; a: string; b: string; lines: string[]; control: Control }[]
  lines: Record<string, { name: string; color: string }>
  landmarks: { id: string; name: string; region: string | null; holder: string | null; role: string; detail: string; x: number; y: number }[]
  holdings: { id: string; name: string; holder: string | null; holderName: string; state: string | null; regions: string[]; station: string | null; landmark: string | null; direct: boolean }[]
  underground: Record<string, Record<string, any>>
}
interface Geometry { titles: Record<string, string>; regions: Record<string, string> }
interface Rail { id: string; mode: string; line: string; points: string }

const props = defineProps<{ locale: 'en' | 'ko'; prefix: string }>()
const machine = reactive<MapState>(initialState())
const dispatch = (a: MapAction) => Object.assign(machine, reduce({ ...machine }, a))
const core = ref<Core | null>(null)
const geometry = ref<Geometry | null>(null)
const rail = ref<Rail[] | null>(null)
const railFailed = ref(false)
const svg = ref<SVGSVGElement | null>(null)
const L = computed(() => core.value?.labels ?? {})

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(withBase(path))
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}`)
  return (await res.json()) as T
}
async function load() {
  try {
    const [c, g] = await Promise.all([getJson<Core>(`/data/map.core.${props.locale}.json`), getJson<Geometry>('/data/map.geometry.json')])
    core.value = c
    geometry.value = g
    dispatch({ type: 'loaded', extent: { width: c.width, height: c.height } })
  } catch (e) {
    dispatch({ type: 'failed', message: String((e as Error).message ?? e) })
  }
}
function retry() { dispatch({ type: 'retry' }); void load() }
onMounted(load)

// the rail geometry is only fetched the first time the user asks for it
async function ensureRail() {
  if (rail.value || railFailed.value) return
  try { rail.value = await getJson<Rail[]>('/data/map.rail.json') } catch { railFailed.value = true }
}
function toggle(what: 'rail' | 'stations' | 'landmarks') {
  dispatch({ type: 'toggle', what })
  if (what === 'rail') void ensureRail()
}

const stateById = computed(() => new Map((core.value?.states ?? []).map((s) => [s.id, s])))
const regionById = computed(() => new Map((core.value?.regions ?? []).map((r) => [r.id, r])))
const titleById = computed(() => new Map((core.value?.titles ?? []).map((t) => [t.id, t])))
const stationById = computed(() => new Map((core.value?.stations ?? []).map((s) => [s.id, s])))
const factionById = computed(() => new Map((core.value?.factions ?? []).map((f) => [f.id, f])))
const unassigned = computed(() => core.value?.unassigned ?? '#8a969b')
const colorOfState = (id: string | undefined) => (id ? stateById.value.get(id)?.color ?? unassigned.value : unassigned.value)
const regionColor = (id: string) => { const f = regionById.value.get(id)?.faction; return f ? factionById.value.get(f)?.color ?? unassigned.value : unassigned.value }
const titleColor = (t: Core['titles'][number]) => (t.faction ? factionById.value.get(t.faction)?.color ?? unassigned.value : unassigned.value)
const hue = (id: string, ids: string[]) => `hsl(${Math.round(ids.indexOf(id) * 360 / Math.max(1, ids.length))} 34% 48%)`

const visibleTitles = computed(() => (core.value?.titles ?? []).filter((t) => t.rank === (machine.mode === 'titles' ? machine.rank : 'county')))
const titleIds = computed(() => visibleTitles.value.map((t) => t.id))
const fillOf = (t: Core['titles'][number]) => (machine.mode === 'political' ? titleColor(t) : hue(t.id, titleIds.value))
const displayedEdges = computed(() => (core.value?.edges ?? []).filter((e) => machine.line === 'all' || e.lines.includes(machine.line)))
const displayedStations = computed(() => (core.value?.stations ?? []).filter((s) => machine.line === 'all' || s.lines.includes(machine.line)))
const lineIds = computed(() => { const s = new Set<string>(); for (const e of core.value?.edges ?? []) e.lines.forEach((l) => s.add(l)); for (const st of core.value?.stations ?? []) st.lines.forEach((l) => s.add(l)); return [...s].filter((id) => core.value?.lines[id]) })
const selectableHoldings = computed(() => core.value?.holdings.filter((h) => h.regions.length || h.station || h.landmark) ?? [])
const activeHolding = computed(() => selectableHoldings.value.find((h) => h.id === machine.holding) ?? null)
const holdingRegions = computed(() => new Set(activeHolding.value?.regions ?? []))
const edgeColor = (c: Control) => (c.status === 'held' && c.states[0] ? factionById.value.get(c.states[0])?.color ?? unassigned.value : unassigned.value)
const statusLabel = (s: string) => L.value.status?.[s] ?? s
const counts = (status: string) => displayedEdges.value.filter((e) => (status === 'unassigned' ? !['held', 'vacant', 'contested'].includes(e.control.status) : e.control.status === status)).length

const sel = computed(() => machine.selection)
const selTitle = computed(() => (sel.value.kind === 'title' ? titleById.value.get(sel.value.id) ?? null : null))
const selRegion = computed(() => (sel.value.kind === 'region' ? regionById.value.get(sel.value.id) ?? null : null))
const selState = computed(() => (sel.value.kind === 'state' ? stateById.value.get(sel.value.id) ?? null : null))
const selStation = computed(() => (sel.value.kind === 'station' ? stationById.value.get(sel.value.id) ?? null : null))
const selSegment = computed(() => (sel.value.kind === 'segment' ? core.value?.edges.find((e) => e.id === (sel.value as { id: string }).id) ?? null : null))
const selLandmark = computed(() => (sel.value.kind === 'landmark' ? core.value?.landmarks.find((l) => l.id === (sel.value as { id: string }).id) ?? null : null))
const stationDetail = computed(() => (selStation.value ? core.value?.underground[selStation.value.id] ?? null : null))
const titleFaction = (t: Core['titles'][number]) => (t.faction ? factionById.value.get(t.faction)?.name : null) ?? L.value.unknown

function selectTitle(id: string) {
  const t = titleById.value.get(id)
  if (!t) return
  if (machine.mode === 'political') dispatch({ type: 'select', selection: { kind: 'title', id } })
  else { if (t.rank !== machine.rank) dispatch({ type: 'rank', rank: t.rank }); dispatch({ type: 'select', selection: { kind: 'title', id } }) }
}
function pickSegment(e: MouseEvent) {
  if (machine.gesture === 'dragged') return
  const t = e.target as Element
  const id = t.getAttribute('data-segment')
  if (!id) return
  const nearby = displayedEdges.value.filter((x) => x.id === id || (x.a === displayedEdges.value.find((y) => y.id === id)?.a && x.b === displayedEdges.value.find((y) => y.id === id)?.b)).map((x) => x.id)
  if (nearby.length > 1) dispatch({ type: 'segments', ids: nearby })
  else dispatch({ type: 'select', selection: { kind: 'segment', id } })
}
const segmentLabel = (id: string) => { const e = core.value?.edges.find((x) => x.id === id); return e ? `${stationById.value.get(e.a)?.name ?? e.a} – ${stationById.value.get(e.b)?.name ?? e.b} (${e.lines.map((l) => core.value?.lines[l]?.name ?? l).join(', ')})` : id }

// ---- pan and zoom, as in a standard map app -------------------------------------------------------------------
// The view box and the gesture phase live in the machine; what follows only turns pointer, wheel and key input
// into `view` and `gesture` actions. Screen <-> map conversion is computed from the machine's box (not the DOM),
// so several updates inside one event see each other immediately.
const box = computed(() => machine.box)
const viewBox = computed(() => `${box.value.x} ${box.value.y} ${box.value.width} ${box.value.height}`)
const extent = computed(() => machine.extent)
const atMaxZoom = computed(() => box.value.width <= extent.value.width / MAX_ZOOM + 1e-6)
const atMinZoom = computed(() => box.value.width >= extent.value.width - 1e-6)
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const setView = (b: Box) => dispatch({ type: 'view', box: b })

/** CSS px per map unit, and where the map origin sits on screen (the SVG letterboxes with xMidYMid meet). */
function projection(b: Box) {
  const r = svg.value!.getBoundingClientRect()
  const s = Math.min(r.width / b.width, r.height / b.height)
  return { s, left: r.left + (r.width - b.width * s) / 2, top: r.top + (r.height - b.height * s) / 2 }
}
function toMap(p: Point, b: Box): Point { const { s, left, top } = projection(b); return { x: b.x + (p.x - left) / s, y: b.y + (p.y - top) / s } }
function panPx(b: Box, dx: number, dy: number): Box { const { s } = projection(b); return panBy(b, -dx / s, -dy / s, extent.value) }

// short eased transitions for buttons, keys, double-click and mouse-wheel notches; trackpad scroll is applied directly
let anim: { from: Box; to: Box; start: number; ms: number; raf: number } | null = null
let glide: { vx: number; vy: number; t: number; raf: number } | null = null
function stopMotion() {
  if (anim) cancelAnimationFrame(anim.raf)
  if (glide) cancelAnimationFrame(glide.raf)
  anim = null; glide = null
}
function animateTo(to: Box, ms = 180) {
  stopMotion()
  if (reducedMotion()) { setView(to); return }
  const a = { from: { ...box.value }, to, start: performance.now(), ms, raf: 0 }
  const step = (now: number) => {
    const t = Math.min(1, (now - a.start) / a.ms)
    const e = 1 - (1 - t) ** 3
    setView({ x: a.from.x + (a.to.x - a.from.x) * e, y: a.from.y + (a.to.y - a.from.y) * e, width: a.from.width + (a.to.width - a.from.width) * e, height: a.from.height + (a.to.height - a.from.height) * e })
    if (t < 1) a.raf = requestAnimationFrame(step)
    else anim = null
  }
  anim = a
  a.raf = requestAnimationFrame(step)
}
// light inertia after a drag: the view keeps sliding and slows down
function startGlide(vx: number, vy: number) {
  stopMotion()
  if (reducedMotion() || Math.hypot(vx, vy) < 0.3) return
  const g = { vx, vy, t: performance.now(), raf: 0 }
  const step = (now: number) => {
    const dt = Math.min(48, now - g.t); g.t = now
    setView(panPx(box.value, g.vx * dt, g.vy * dt))
    const decay = 0.9 ** (dt / 16); g.vx *= decay; g.vy *= decay
    if (Math.hypot(g.vx, g.vy) > 0.02) g.raf = requestAnimationFrame(step)
    else glide = null
  }
  glide = g
  g.raf = requestAnimationFrame(step)
}
onBeforeUnmount(stopMotion)

const target = () => anim?.to ?? box.value
const center = (): Point => { const r = svg.value!.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
/** Zoom by `factor` (< 1 zooms in) around a screen point, by default the centre of the map. */
function zoomBy(factor: number, at: Point = center(), animate = true) {
  const b = target()
  const next = zoomAt(b, factor, extent.value, toMap(at, b))
  if (animate) animateTo(next)
  else { stopMotion(); setView(next) }
}
const zoomIn = () => zoomBy(1 / 1.6)
const zoomOut = () => zoomBy(1.6)
const frame = () => animateTo({ x: 0, y: 0, ...extent.value })

const pointers = new Map<number, Point>()
let pressAt: Point | null = null
let last: { c: Point; spread: number } | null = null
let trail: { x: number; y: number; t: number }[] = []
let lastTap: { x: number; y: number; t: number } | null = null
const centroid = (): Point => { const ps = [...pointers.values()]; return { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length } }
const spread = () => { const [a, b] = [...pointers.values()]; return b ? Math.hypot(a.x - b.x, a.y - b.y) : 0 }
const snapshot = () => { last = { c: centroid(), spread: spread() } }
function capture(id: number) { try { svg.value?.setPointerCapture(id) } catch { /* the pointer is already gone */ } }

function down(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  stopMotion()
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 1) { pressAt = { x: e.clientX, y: e.clientY }; trail = []; dispatch({ type: 'gesture', event: 'press' }) }
  else { pointers.forEach((_, id) => capture(id)); dispatch({ type: 'gesture', event: 'pinch' }) }
  snapshot()
}
function move(e: PointerEvent) {
  if (!pointers.has(e.pointerId) || !last) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  const c = centroid()
  if (machine.gesture === 'pressing') {
    // under the click slop nothing moves, so a slightly shaky click still opens the region
    if (pointers.size === 1 && pressAt && Math.hypot(c.x - pressAt.x, c.y - pressAt.y) <= CLICK_SLOP) return
    capture(e.pointerId)
    dispatch({ type: 'gesture', event: pointers.size > 1 ? 'pinch' : 'drag' })
  }
  let b = panPx(box.value, c.x - last.c.x, c.y - last.c.y)
  if (pointers.size > 1) {
    const sp = spread()
    if (last.spread > 0 && sp > 0) b = zoomAt(b, last.spread / sp, extent.value, toMap(c, b))
  }
  setView(b)
  const now = performance.now()
  trail.push({ x: c.x, y: c.y, t: now })
  trail = trail.filter((p) => now - p.t < 100)
  snapshot()
}
function up(e: PointerEvent) {
  if (!pointers.delete(e.pointerId)) return
  if (pointers.size) { snapshot(); trail = []; return }
  const was = machine.gesture
  dispatch({ type: 'gesture', event: 'release' })
  last = null
  if (e.type === 'pointercancel') return
  if (was === 'pressing') {
    // a tap or a click: two in quick succession at the same spot zoom in there
    const now = performance.now()
    if (lastTap && now - lastTap.t < 350 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) { lastTap = null; zoomBy(0.5, { x: e.clientX, y: e.clientY }) }
    else lastTap = { x: e.clientX, y: e.clientY, t: now }
  } else if (was === 'dragging') {
    // only movement in the last 100 ms counts: a drag that stopped and was held before release does not fling
    const now = performance.now()
    const recent = trail.filter((p) => now - p.t < 100)
    if (recent.length > 1) {
      const a = recent[0], z = recent[recent.length - 1], dt = Math.max(1, z.t - a.t)
      startGlide((z.x - a.x) / dt, (z.y - a.y) / dt)
    }
  }
}
// a mouse press that leaves the map before it became a drag is dropped (a drag holds pointer capture and never leaves)
function leave(e: PointerEvent) {
  if (e.pointerType === 'mouse' && machine.gesture === 'pressing' && pointers.delete(e.pointerId) && !pointers.size) { dispatch({ type: 'gesture', event: 'release' }); last = null }
}
function wheel(e: WheelEvent) {
  e.preventDefault()
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? svg.value!.getBoundingClientRect().height : 1
  const dy = Math.max(-300, Math.min(300, e.deltaY * unit))
  if (!dy) return
  // a mouse-wheel notch (large delta) gets a short eased step; trackpad scroll and pinch (small deltas) apply directly
  zoomBy(Math.exp(dy * 0.0025), { x: e.clientX, y: e.clientY }, Math.abs(dy) >= 40)
}
function keydown(e: KeyboardEvent) {
  if (e.altKey || e.ctrlKey || e.metaKey) return
  const r = svg.value!.getBoundingClientRect()
  const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  if (dir[e.key]) { const [dx, dy] = dir[e.key]; animateTo(panPx(target(), -dx * r.width * 0.15, -dy * r.height * 0.15), 150) }
  else if (e.key === '+' || e.key === '=') zoomIn()
  else if (e.key === '-' || e.key === '_') zoomOut()
  else if (e.key === '0') frame()
  else return
  e.preventDefault()
}
/** Clicks that end a drag or a pinch never select anything. */
function guarded(fn: () => void) { return () => { if (machine.gesture !== 'dragged') fn() } }
const personLink = (id: string | null) => (id ? withBase(`/${props.prefix}wiki/people/${id}/`) : null)
const stateLink = (id: string) => withBase(`/${props.prefix}wiki/factions/${stateById.value.get(id)?.faction ?? ''}/`)
</script>

<template>
  <section class="territory-map" :aria-label="L.title" @keydown.esc="dispatch({ type: 'escape' })">
    <p v-if="machine.phase === 'loading'" class="tm-status" role="status">{{ L.loading ?? 'Loading…' }}</p>
    <div v-else-if="machine.phase === 'failed'" class="tm-status tm-error" role="alert">
      <p>{{ L.failed ?? 'Could not load the map data.' }} ({{ machine.error }})</p>
      <button type="button" @click="retry">{{ L.retry ?? 'Retry' }}</button>
    </div>
    <template v-else-if="core && geometry">
      <p class="tm-lead">{{ L.lead }}</p>
      <div class="tm-controls">
        <div class="tm-group" role="group" :aria-label="L.modeGroup">
          <button type="button" :aria-pressed="machine.mode === 'political'" @click="dispatch({ type: 'mode', mode: 'political' })">{{ L.political }}</button>
          <button type="button" :aria-pressed="machine.mode === 'titles'" @click="dispatch({ type: 'mode', mode: 'titles' })">{{ L.titles }}</button>
        </div>
        <div class="tm-group" role="group" :aria-label="L.layerGroup">
          <button type="button" :aria-pressed="machine.layer === 'surface'" @click="dispatch({ type: 'layer', layer: 'surface' })">{{ L.surface }}</button>
          <button type="button" :aria-pressed="machine.layer === 'underground'" @click="dispatch({ type: 'layer', layer: 'underground' })">{{ L.underground }}</button>
        </div>
        <label v-if="machine.mode === 'titles'">{{ L.rank }}
          <select :value="machine.rank" @change="dispatch({ type: 'rank', rank: ($event.target as HTMLSelectElement).value as Rank })">
            <option v-for="r in core.ranks" :key="r" :value="r">{{ L.ranks[r] }}</option>
          </select></label>
        <label v-if="machine.layer === 'underground'">{{ L.line }}
          <select :value="machine.line" @change="dispatch({ type: 'line', line: ($event.target as HTMLSelectElement).value })">
            <option value="all">{{ L.allLines }}</option>
            <option v-for="id in lineIds" :key="id" :value="id">{{ core.lines[id].name }}</option>
          </select></label>
        <label>{{ L.holding }}
          <select :value="machine.holding" @change="dispatch({ type: 'holding', id: ($event.target as HTMLSelectElement).value })">
            <option value="">{{ L.noHolding }}</option>
            <option v-for="h in selectableHoldings" :key="h.id" :value="h.id">{{ h.name }} · {{ h.holderName }}</option>
          </select></label>
        <label v-if="machine.layer === 'surface'" class="tm-check"><input type="checkbox" :checked="machine.showRail" @change="toggle('rail')" />{{ L.showRail }}</label>
        <fieldset class="tm-check-group"><legend>{{ L.markers }}</legend>
          <label><input type="checkbox" :checked="machine.showStations" @change="toggle('stations')" />{{ L.stations }}</label>
          <label v-if="machine.layer === 'surface'"><input type="checkbox" :checked="machine.showLandmarks" @change="toggle('landmarks')" />{{ L.landmarks }}</label>
        </fieldset>
      </div>
      <p v-if="machine.showRail && !rail && !railFailed" class="tm-status" role="status">{{ L.loadingGeometry }}</p>
      <p v-if="railFailed" class="tm-status tm-error" role="alert">{{ L.failed }}</p>

      <div class="tm-stage">
        <div class="tm-zoom" role="group" :aria-label="L.zoomGroup">
          <button type="button" data-zoom="in" :aria-label="L.zoomIn" :title="L.zoomIn" :disabled="atMaxZoom" @click="zoomIn"><span aria-hidden="true">+</span></button>
          <button type="button" data-zoom="out" :aria-label="L.zoomOut" :title="L.zoomOut" :disabled="atMinZoom" @click="zoomOut"><span aria-hidden="true">−</span></button>
          <button type="button" data-zoom="reset" :aria-label="L.whole" :title="L.whole" @click="frame">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </div>
        <svg ref="svg" class="tm-svg" :class="{ 'tm-grabbing': machine.gesture === 'dragging' || machine.gesture === 'pinching' }" :viewBox="viewBox" tabindex="0" role="application" :aria-label="L.mapLabel" data-testid="territory-svg" :data-gesture="machine.gesture"
             @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @pointerleave="leave" @wheel="wheel" @keydown="keydown" @click="pickSegment" @dragstart.prevent>
          <g v-if="machine.layer === 'underground'">
            <path v-for="t in core.titles.filter((x) => x.rank === 'county')" :key="t.id" :d="geometry.titles[t.id]" fill="var(--vp-c-text-3)" fill-opacity="0.2" stroke="var(--vp-c-divider)" stroke-width="0.6" vector-effect="non-scaling-stroke" />
            <line v-for="e in displayedEdges" :key="e.id" :x1="stationById.get(e.a)?.x" :y1="stationById.get(e.a)?.y" :x2="stationById.get(e.b)?.x" :y2="stationById.get(e.b)?.y" :stroke="edgeColor(e.control)" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke" :data-segment="e.id" :class="{ 'tm-selected': sel.kind === 'segment' && sel.id === e.id }" />
          </g>
          <g v-else>
            <path v-for="t in visibleTitles" :key="t.id" :d="geometry.titles[t.id]" fill-rule="evenodd" class="tm-region" :fill="fillOf(t)" fill-opacity="0.72" :stroke="'var(--vp-c-bg)'" stroke-width="0.8" vector-effect="non-scaling-stroke"
                  :class="{ 'tm-selected': sel.kind === 'title' && sel.id === t.id }" :data-title-id="t.id" :data-title-rank="t.rank" role="button" tabindex="-1" :aria-label="t.name"
                  @click="guarded(() => selectTitle(t.id))()" />
            <path v-for="id in holdingRegions" :key="id" :d="geometry.regions[id]" fill="none" stroke="#fff" stroke-width="2.4" vector-effect="non-scaling-stroke" pointer-events="none" />
            <g v-if="machine.showRail && rail"><polyline v-for="r in rail" :key="r.id" :points="r.points" fill="none" stroke="var(--vp-c-text-2)" stroke-opacity="0.55" stroke-width="1" vector-effect="non-scaling-stroke" pointer-events="none" :data-physical-rail-piece="r.id" /></g>
            <g v-if="machine.showLandmarks"><circle v-for="l in core.landmarks" :key="l.id" :cx="l.x" :cy="l.y" r="5" :fill="colorOfState(l.holder ?? undefined)" stroke="#fff" stroke-width="1.8" vector-effect="non-scaling-stroke" role="button" tabindex="-1" :aria-label="l.name" :data-landmark="l.id" @click="guarded(() => dispatch({ type: 'select', selection: { kind: 'landmark', id: l.id } }))()" /></g>
          </g>
          <g v-if="machine.showStations"><circle v-for="s in displayedStations" :key="s.id" :cx="s.x" :cy="s.y" :r="machine.layer === 'underground' ? 3.2 : 2" :fill="machine.layer === 'underground' ? edgeColor(s.control) : 'var(--vp-c-text-1)'" stroke="#fff" stroke-width="0.8" vector-effect="non-scaling-stroke" role="button" tabindex="-1" :aria-label="s.name" :data-station="s.id" :class="{ 'tm-selected': sel.kind === 'station' && sel.id === s.id }" @click="guarded(() => dispatch({ type: 'select', selection: { kind: 'station', id: s.id } }))()" /></g>
          <g v-if="machine.layer === 'surface'"><text v-for="s in core.states.filter((x) => x.capitalX !== null)" :key="s.id" :x="s.capitalX" :y="(s.capitalY ?? 0) - 7" class="tm-state-label" text-anchor="middle" @click="guarded(() => dispatch({ type: 'select', selection: { kind: 'state', id: s.id } }))()">{{ s.name }}</text></g>
        </svg>
        <div v-if="machine.segmentChoices.length > 1" class="tm-segments" role="group" :aria-label="L.kSegment">
          <button v-for="id in machine.segmentChoices" :key="id" type="button" @click="dispatch({ type: 'select', selection: { kind: 'segment', id } })">{{ segmentLabel(id) }}</button>
          <button type="button" @click="dispatch({ type: 'segments', ids: [] })">{{ L.close }}</button>
        </div>
      </div>

      <button v-if="sel.kind !== 'none'" type="button" class="tm-detail-toggle" :aria-expanded="machine.detailOpen" aria-controls="tm-detail" @click="dispatch({ type: 'detail', open: !machine.detailOpen })">{{ machine.detailOpen ? L.hideDetail : L.openDetail }}</button>
      <aside v-if="machine.detailOpen" id="tm-detail" class="tm-detail" :aria-label="L.detail" aria-live="polite">
        <button type="button" class="tm-detail-close" @click="dispatch({ type: 'detail', open: false })">{{ L.close }}</button>
        <section v-if="selTitle" :data-detail="selTitle.id">
          <p class="tm-kicker">{{ L.kTitle }} · {{ L.ranks[selTitle.rank] }}</p><h3>{{ selTitle.name }}</h3>
          <p>{{ L.displayedFaction }}: {{ titleFaction(selTitle) }}</p><p>{{ L.politicalNote }}</p>
          <details v-if="selTitle.districts.length"><summary>{{ L.members }} ({{ selTitle.districts.length }})</summary><ul><li v-for="d in selTitle.districts" :key="d">{{ regionById.get(d)?.name ?? d }}</li></ul></details>
        </section>
        <section v-if="selState">
          <p class="tm-kicker">{{ L.kState }}</p><h3>{{ selState.name }}</h3>
          <table><tbody>
            <tr><th>{{ L.ruler }}</th><td>{{ selState.ruler }}</td></tr><tr><th>{{ L.faction }}</th><td>{{ factionById.get(selState.faction)?.name }}</td></tr>
            <tr><th>{{ L.capital }}</th><td>{{ selState.capital }}</td></tr><tr><th>{{ L.power }}</th><td>{{ selState.power }}</td></tr><tr><th>{{ L.government }}</th><td>{{ selState.government }}</td></tr>
          </tbody></table>
          <p><a :href="stateLink(selState.id)">{{ L.viewState }}</a></p>
        </section>
        <section v-if="selRegion">
          <p class="tm-kicker">{{ L.kRegion }} · {{ selRegion.district }}</p><h3>{{ selRegion.name }}</h3>
          <dl><dt>{{ L.direct }}</dt><dd>{{ selRegion.states.map((id) => factionById.get(id)?.name ?? id).join(' · ') || L.neutral }}</dd></dl>
          <p>{{ selRegion.summary }}</p>
        </section>
        <section v-if="selStation">
          <p class="tm-kicker">{{ L.kStation }}</p><h3>{{ selStation.name }}</h3>
          <p>{{ L.controlledBy }}: {{ selStation.control.names.join(' · ') || L.neutral }}<br />{{ L.current }}: {{ selStation.control.overlords.join(' · ') || L.neutral }}</p>
          <p>{{ L.lines }}: {{ selStation.lines.map((l) => core!.lines[l]?.name ?? l).join(', ') }}</p>
          <table v-if="stationDetail"><tbody><template v-for="(f, floor) in stationDetail" :key="floor"><tr v-for="(v, k) in f" :key="`${floor}${k}`" v-show="k !== 'sources' && v !== null && typeof v !== 'object'"><th>{{ floor }} · {{ k }}</th><td>{{ v }}</td></tr></template></tbody></table>
        </section>
        <section v-if="selSegment">
          <p class="tm-kicker">{{ L.kSegment }}</p><h3>{{ stationById.get(selSegment.a)?.name }} – {{ stationById.get(selSegment.b)?.name }}</h3>
          <table><tbody><tr><th>{{ L.lines }}</th><td>{{ selSegment.lines.map((l) => core!.lines[l]?.name ?? l).join(', ') }}</td></tr><tr><th>{{ L.control }}</th><td>{{ statusLabel(selSegment.control.status) }}</td></tr><tr><th>{{ L.controlledBy }}</th><td>{{ selSegment.control.names.join(' · ') || L.neutral }}</td></tr></tbody></table>
        </section>
        <section v-if="selLandmark"><p class="tm-kicker">{{ L.kLandmark }}</p><h3>{{ selLandmark.name }}</h3><p>{{ selLandmark.role }}</p><p>{{ selLandmark.detail }}</p></section>
        <section v-if="activeHolding && sel.kind !== 'none'">
          <p class="tm-kicker">{{ L.kHolding }}</p><h3>{{ activeHolding.name }}</h3>
          <p>{{ L.holder }}: <a v-if="personLink(activeHolding.holder)" :href="personLink(activeHolding.holder)!">{{ activeHolding.holderName }}</a><span v-else>{{ activeHolding.holderName }}</span> · {{ activeHolding.direct ? L.directHolding : L.vassalHolding }}</p>
        </section>
      </aside>
      <div v-if="machine.mode === 'political'" class="tm-legend" role="list" :aria-label="L.legend">
        <span v-for="f in core.factions" :key="f.id" role="listitem"><i :style="{ background: f.color }"></i>{{ f.name }}</span><span role="listitem"><i :style="{ background: unassigned }"></i>{{ L.neutral }}</span>
      </div>
      <div v-if="machine.layer === 'underground'" class="tm-legend" role="list" :aria-label="L.undergroundLegend">
        <span role="listitem">{{ L.held }} {{ counts('held') }}</span><span role="listitem">{{ L.contested }} {{ counts('contested') }}</span><span role="listitem">{{ L.vacant }} {{ counts('vacant') }}</span><span role="listitem">{{ L.unassigned }} {{ counts('unassigned') }}</span>
      </div>
      <p class="tm-attribution">{{ core.epoch }} · {{ core.attribution }}</p>
    </template>
  </section>
</template>

<style scoped>
.tm-lead { color: var(--vp-c-text-2); margin: 0 0 12px; }
.tm-controls { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: end; margin-bottom: 12px; }
.tm-controls label { display: grid; gap: 4px; font-size: 13px; color: var(--vp-c-text-2); }
.tm-controls select { padding: 6px 8px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-alt); color: var(--vp-c-text-1); font: inherit; max-width: 260px; }
.tm-group { display: inline-flex; border: 1px solid var(--vp-c-divider); border-radius: 8px; overflow: hidden; }
.tm-group button { padding: 6px 12px; border: 0; background: var(--vp-c-bg-alt); color: var(--vp-c-text-1); cursor: pointer; font: inherit; }
.tm-group button[aria-pressed='true'] { background: var(--vp-c-brand-1); color: #fff; }
.tm-check { display: flex !important; grid-auto-flow: column; align-items: center; gap: 6px; }
.tm-check-group { border: 1px solid var(--vp-c-divider); border-radius: 8px; display: flex; gap: 12px; padding: 4px 10px; font-size: 13px; }
.tm-check-group legend { font-size: 12px; color: var(--vp-c-text-2); padding: 0 4px; }
.tm-stage { position: relative; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-alt); overflow: hidden; }
.tm-svg { display: block; width: 100%; height: auto; aspect-ratio: 1200 / 980; max-height: 80vh; touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.tm-svg.tm-grabbing, .tm-svg.tm-grabbing .tm-region { cursor: grabbing; }
.tm-svg:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: -2px; }
/* shapes with tabindex=-1 take focus on press; the selection stroke already marks them, so no box outline */
.tm-svg [tabindex='-1']:focus { outline: none; }
.tm-region { cursor: pointer; transition: fill-opacity 150ms ease-out; } .tm-region:hover { fill-opacity: 0.95; }
.tm-selected { stroke: #fff !important; stroke-width: 2.6 !important; fill-opacity: 1 !important; }
.tm-state-label { font: 600 11px var(--vp-font-family-base); fill: var(--vp-c-text-1); paint-order: stroke; stroke: var(--vp-c-bg); stroke-width: 3px; cursor: pointer; }
/* map-app zoom stack: one column of square buttons joined into a single card, bottom-right like most map apps */
.tm-zoom { position: absolute; right: 12px; bottom: 12px; z-index: 2; display: flex; flex-direction: column; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); overflow: hidden; }
.tm-zoom button { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; background: transparent; color: var(--vp-c-text-1); cursor: pointer; font: 600 20px/1 var(--vp-font-family-base); transition: background-color 150ms ease-out, color 150ms ease-out; }
.tm-zoom button + button { border-top: 1px solid var(--vp-c-divider); }
.tm-zoom button:hover:not(:disabled) { background: var(--vp-c-bg-soft); color: var(--vp-c-brand-1); }
.tm-zoom button:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: -2px; }
.tm-zoom button:disabled { color: var(--vp-c-text-3); cursor: default; }
@media (pointer: coarse) { .tm-zoom button { width: 44px; height: 44px; } }
.tm-segments { position: absolute; right: 8px; top: 8px; z-index: 2; display: grid; gap: 4px; max-width: 280px; }
.tm-segments button { text-align: left; padding: 6px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); cursor: pointer; font: inherit; font-size: 13px; }
.tm-detail-toggle { margin-top: 10px; padding: 6px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); cursor: pointer; font: inherit; }
.tm-detail { margin-top: 10px; padding: 12px 16px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-alt); }
.tm-detail h3 { margin: 4px 0 8px; } .tm-kicker { margin: 0; font-size: 12px; color: var(--vp-c-text-2); text-transform: uppercase; letter-spacing: .04em; }
.tm-detail-close { float: right; padding: 2px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); cursor: pointer; }
.tm-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 10px 0; font-size: 13px; }
.tm-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
.tm-attribution { color: var(--vp-c-text-2); font-size: 12px; }
.tm-status { padding: 12px 0; color: var(--vp-c-text-2); } .tm-error { color: var(--vp-c-danger-1, #b63c32); }
</style>
