<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { withBase } from 'vitepress'
import { initialState, panBox, reduce, zoomBox, type Box, type MapAction, type MapState, type Rank } from '../machines/territoryMap'

interface Control { status: string; states: string[]; names: string[]; overlords: string[] }
interface Core {
  labels: Record<string, any>; width: number; height: number; epoch: string; attribution: string; unassigned: string
  factions: { id: string; name: string; color: string }[]
  states: { id: string; name: string; faction: string; color: string; ruler: string; capital: string; government: string; power: string; cause: string; capitalX: number | null; capitalY: number | null; regions: number }[]
  regions: { id: string; name: string; district: string; status: string; states: string[]; summary: string; openingState: string; area: number | null; density: number | null }[]
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
    dispatch({ type: 'loaded', box: { x: 0, y: 0, width: c.width, height: c.height } })
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
const regionColor = (id: string) => { const r = regionById.value.get(id); return r?.states[0] ? colorOfState(r.states[0]) : unassigned.value }
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
const edgeColor = (c: Control) => (c.status === 'held' && c.states[0] ? colorOfState(c.states[0]) : unassigned.value)
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
  const t = e.target as Element
  const id = t.getAttribute('data-segment')
  if (!id) return
  const nearby = displayedEdges.value.filter((x) => x.id === id || (x.a === displayedEdges.value.find((y) => y.id === id)?.a && x.b === displayedEdges.value.find((y) => y.id === id)?.b)).map((x) => x.id)
  if (nearby.length > 1) dispatch({ type: 'segments', ids: nearby })
  else dispatch({ type: 'select', selection: { kind: 'segment', id } })
}
const segmentLabel = (id: string) => { const e = core.value?.edges.find((x) => x.id === id); return e ? `${stationById.value.get(e.a)?.name ?? e.a} – ${stationById.value.get(e.b)?.name ?? e.b} (${e.lines.map((l) => core.value?.lines[l]?.name ?? l).join(', ')})` : id }

const box = computed(() => machine.box)
const viewBox = computed(() => `${box.value.x} ${box.value.y} ${box.value.width} ${box.value.height}`)
const W = computed(() => core.value?.width ?? 1200)
const H = computed(() => core.value?.height ?? 980)
const setView = (b: Box) => dispatch({ type: 'view', box: b })
const frame = () => setView({ x: 0, y: 0, width: W.value, height: H.value })
const zoom = (f: number) => setView(zoomBox(box.value, f, W.value, H.value))
const pan = (dx: number, dy: number) => setView(panBox(box.value, dx, dy, W.value, H.value))
let drag: { x: number; y: number; box: Box; moved: boolean } | null = null
function down(e: PointerEvent) { drag = { x: e.clientX, y: e.clientY, box: { ...box.value }, moved: false }; (e.currentTarget as Element).setPointerCapture?.(e.pointerId) }
function move(e: PointerEvent) {
  if (!drag || !svg.value) return
  const r = svg.value.getBoundingClientRect()
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) drag.moved = true
  if (drag.moved) setView(panTo(drag.box, -(e.clientX - drag.x) / r.width * drag.box.width, -(e.clientY - drag.y) / r.height * drag.box.height))
}
function panTo(b: Box, dx: number, dy: number): Box { return panBox({ ...b, x: b.x + dx, y: b.y + dy }, 0, 0, W.value, H.value) }
const dragged = ref(false)
function up() { dragged.value = !!drag?.moved; drag = null; setTimeout(() => { dragged.value = false }, 0) }
function wheel(e: WheelEvent) { e.preventDefault(); zoom(e.deltaY > 0 ? 1.15 : 0.87) }
function keydown(e: KeyboardEvent) {
  const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  if (dir[e.key]) { e.preventDefault(); pan(...dir[e.key]) }
  else if (e.key === '+' || e.key === '=') zoom(0.8)
  else if (e.key === '-') zoom(1.25)
}
function guarded(fn: () => void) { return () => { if (!dragged.value) fn() } }
const personLink = (id: string | null) => (id ? withBase(`/${props.prefix}wiki/people/${id}/`) : null)
const stateLink = (id: string) => withBase(`/${props.prefix}wiki/states/${id.toLowerCase()}/`)
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
        <div class="tm-zoom" role="group" :aria-label="L.whole">
          <button type="button" @click="frame">{{ L.whole }}</button>
          <button type="button" :aria-label="L.zoomIn" @click="zoom(0.8)">+</button>
          <button type="button" :aria-label="L.zoomOut" @click="zoom(1.25)">−</button>
          <button type="button" :aria-label="L.left" @click="pan(-1, 0)">←</button><button type="button" :aria-label="L.up" @click="pan(0, -1)">↑</button>
          <button type="button" :aria-label="L.down" @click="pan(0, 1)">↓</button><button type="button" :aria-label="L.right" @click="pan(1, 0)">→</button>
        </div>
        <svg ref="svg" class="tm-svg" :viewBox="viewBox" tabindex="0" role="application" :aria-label="L.mapLabel" data-testid="territory-svg"
             @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @wheel="wheel" @keydown="keydown" @click="pickSegment">
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
          <dl><dt>{{ L.direct }}</dt><dd>{{ selRegion.states.map((id) => `${id} ${stateById.get(id)?.name ?? id}`).join(' · ') || L.neutral }}</dd></dl>
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
.tm-svg { display: block; width: 100%; height: auto; aspect-ratio: 1200 / 980; max-height: 80vh; touch-action: none; cursor: grab; }
.tm-svg:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: -2px; }
.tm-region { cursor: pointer; transition: fill-opacity 150ms ease-out; } .tm-region:hover { fill-opacity: 0.95; }
.tm-selected { stroke: #fff !important; stroke-width: 2.6 !important; fill-opacity: 1 !important; }
.tm-state-label { font: 600 11px var(--vp-font-family-base); fill: var(--vp-c-text-1); paint-order: stroke; stroke: var(--vp-c-bg); stroke-width: 3px; cursor: pointer; }
.tm-zoom { position: absolute; top: 8px; left: 8px; z-index: 2; display: flex; flex-wrap: wrap; gap: 4px; max-width: 70%; }
.tm-zoom button { padding: 4px 9px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); cursor: pointer; font: inherit; font-size: 13px; }
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
