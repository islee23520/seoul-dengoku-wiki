export type Phase = 'loading' | 'ready' | 'failed'
export type Mode = 'political' | 'titles'
export type Layer = 'surface' | 'underground'
export type Rank = 'county' | 'duchy' | 'kingdom' | 'empire'

/** What is currently selected. Exactly one kind at a time, so impossible combinations cannot be represented. */
export type Selection =
  | { kind: 'none' }
  | { kind: 'region'; id: string }
  | { kind: 'title'; id: string }
  | { kind: 'state'; id: string }
  | { kind: 'station'; id: string }
  | { kind: 'segment'; id: string }
  | { kind: 'landmark'; id: string }

export interface Box { x: number; y: number; width: number; height: number }
export interface Extent { width: number; height: number }
export interface Point { x: number; y: number }

/**
 * The pointer gesture in progress, as in a standard map app. `dragged` means the last press moved the map, so the
 * click that the browser fires after it must not select anything; the next press clears it.
 */
export type Gesture = 'idle' | 'pressing' | 'dragging' | 'pinching' | 'dragged'
export type GestureEvent = 'press' | 'drag' | 'pinch' | 'release'

/** Most the map can be magnified (whole map width / narrowest view width). */
export const MAX_ZOOM = 12
/** A press that moves less than this many CSS pixels is a click or a tap, not a drag. */
export const CLICK_SLOP = 5

export interface MapState {
  phase: Phase
  mode: Mode
  layer: Layer
  rank: Rank
  line: string
  holding: string
  selection: Selection
  detailOpen: boolean
  showRail: boolean
  showStations: boolean
  showLandmarks: boolean
  segmentChoices: string[]
  extent: Extent
  box: Box
  gesture: Gesture
  error: string | null
}

export type MapAction =
  | { type: 'loaded'; extent: Extent }
  | { type: 'failed'; message: string }
  | { type: 'retry' }
  | { type: 'mode'; mode: Mode }
  | { type: 'layer'; layer: Layer }
  | { type: 'rank'; rank: Rank }
  | { type: 'line'; line: string }
  | { type: 'holding'; id: string }
  | { type: 'select'; selection: Selection }
  | { type: 'segments'; ids: string[] }
  | { type: 'toggle'; what: 'rail' | 'stations' | 'landmarks' }
  | { type: 'detail'; open: boolean }
  | { type: 'view'; box: Box }
  | { type: 'gesture'; event: GestureEvent }
  | { type: 'escape' }

/** Which actions each phase accepts. Everything else is ignored, so a late event can never corrupt the state. */
export const accepts: Record<Phase, ReadonlySet<MapAction['type']>> = {
  loading: new Set(['loaded', 'failed']),
  ready: new Set(['mode', 'layer', 'rank', 'line', 'holding', 'select', 'segments', 'toggle', 'detail', 'view', 'gesture', 'escape', 'failed']),
  failed: new Set(['retry']),
}

/**
 * The cross-field rules that the old component scattered across click handlers, in one table.
 * Each row: when this action happens, which dependent pieces of state are reset.
 */
export const resets = {
  mode: 'selection, detail, rank (county), holding, segment choices',
  layer: 'selection, detail, segment choices; rail and stations toggles keep their value',
  rank: 'selection of a title, detail',
  select: 'segment choices; opens the detail panel unless the selection is none',
  holding: 'selection; detail opens when a holding is chosen',
  escape: 'segment choices first, then the detail panel',
  view: 'nothing; the box is clamped to the zoom limits and the map extent',
} as const

/** Gesture transitions. A pair that is not listed is ignored. */
export const gestureNext: Record<Gesture, Partial<Record<GestureEvent, Gesture>>> = {
  idle: { press: 'pressing' },
  pressing: { press: 'pressing', drag: 'dragging', pinch: 'pinching', release: 'idle' },
  dragging: { drag: 'dragging', pinch: 'pinching', release: 'dragged' },
  pinching: { pinch: 'pinching', drag: 'dragging', release: 'dragged' },
  dragged: { press: 'pressing' },
}

export function initialState(): MapState {
  return {
    phase: 'loading', mode: 'political', layer: 'surface', rank: 'county', line: 'all', holding: '', selection: { kind: 'none' }, detailOpen: false,
    showRail: false, showStations: true, showLandmarks: false, segmentChoices: [], extent: { width: 1200, height: 980 }, box: { x: 0, y: 0, width: 1200, height: 980 }, gesture: 'idle', error: null,
  }
}

const NONE: Selection = { kind: 'none' }

export function reduce(state: MapState, action: MapAction): MapState {
  if (!accepts[state.phase].has(action.type)) return state
  switch (action.type) {
    case 'loaded': return { ...state, phase: 'ready', extent: action.extent, box: { x: 0, y: 0, ...action.extent }, error: null }
    case 'failed': return { ...state, phase: 'failed', error: action.message }
    case 'retry': return { ...initialState() }
    case 'mode': {
      if (action.mode === state.mode) return state
      return { ...state, mode: action.mode, layer: action.mode === 'titles' ? 'surface' : state.layer, rank: 'county', holding: '', selection: NONE, detailOpen: false, segmentChoices: [] }
    }
    case 'layer': {
      if (action.layer === state.layer) return state
      // titles only exist on the surface: leaving the surface returns to the political map
      return { ...state, layer: action.layer, mode: action.layer === 'underground' ? 'political' : state.mode, selection: NONE, detailOpen: false, segmentChoices: [] }
    }
    case 'rank': return { ...state, rank: action.rank, selection: state.selection.kind === 'title' ? NONE : state.selection, detailOpen: state.selection.kind === 'title' ? false : state.detailOpen }
    case 'line': return { ...state, line: action.line, selection: state.selection.kind === 'segment' ? NONE : state.selection, detailOpen: state.selection.kind === 'segment' ? false : state.detailOpen, segmentChoices: [] }
    case 'holding': return { ...state, holding: action.id, selection: NONE, detailOpen: action.id !== '', segmentChoices: [] }
    case 'select': return { ...state, selection: action.selection, detailOpen: action.selection.kind !== 'none', segmentChoices: [] }
    case 'segments': return { ...state, segmentChoices: action.ids }
    case 'toggle': {
      const key = action.what === 'rail' ? 'showRail' : action.what === 'stations' ? 'showStations' : 'showLandmarks'
      return { ...state, [key]: !state[key] }
    }
    case 'detail': return { ...state, detailOpen: action.open }
    case 'view': return { ...state, box: clampBox(action.box, state.extent) }
    case 'gesture': {
      const next = gestureNext[state.gesture][action.event]
      return next && next !== state.gesture ? { ...state, gesture: next } : state
    }
    case 'escape': return state.segmentChoices.length ? { ...state, segmentChoices: [] } : { ...state, detailOpen: false }
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Zoom limits (1x to MAX_ZOOM, map aspect kept) and pan bounds (the view never leaves the map). */
export function clampBox(box: Box, extent: Extent): Box {
  const w = clamp(box.width, extent.width / MAX_ZOOM, extent.width)
  const h = w * extent.height / extent.width
  return { x: clamp(box.x, 0, extent.width - w), y: clamp(box.y, 0, extent.height - h), width: w, height: h }
}

/** Zoom by `factor` (below 1 zooms in) keeping the map point `at` where it is on screen; default is the centre. */
export function zoomAt(box: Box, factor: number, extent: Extent, at?: Point): Box {
  const p = at ?? { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const w = clamp(box.width * factor, extent.width / MAX_ZOOM, extent.width)
  const k = w / box.width
  return clampBox({ x: p.x - (p.x - box.x) * k, y: p.y - (p.y - box.y) * k, width: w, height: box.height * k }, extent)
}

/** Move the view by dx, dy map units. */
export function panBy(box: Box, dx: number, dy: number, extent: Extent): Box {
  return clampBox({ ...box, x: box.x + dx, y: box.y + dy }, extent)
}
