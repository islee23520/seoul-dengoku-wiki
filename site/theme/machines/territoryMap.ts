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
  box: Box
  error: string | null
}

export type MapAction =
  | { type: 'loaded'; box: Box }
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
  | { type: 'escape' }

/** Which actions each phase accepts. Everything else is ignored, so a late event can never corrupt the state. */
export const accepts: Record<Phase, ReadonlySet<MapAction['type']>> = {
  loading: new Set(['loaded', 'failed']),
  ready: new Set(['mode', 'layer', 'rank', 'line', 'holding', 'select', 'segments', 'toggle', 'detail', 'view', 'escape', 'failed']),
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
} as const

export function initialState(): MapState {
  return {
    phase: 'loading', mode: 'political', layer: 'surface', rank: 'county', line: 'all', holding: '', selection: { kind: 'none' }, detailOpen: false,
    showRail: false, showStations: true, showLandmarks: false, segmentChoices: [], box: { x: 0, y: 0, width: 1200, height: 980 }, error: null,
  }
}

const NONE: Selection = { kind: 'none' }

export function reduce(state: MapState, action: MapAction): MapState {
  if (!accepts[state.phase].has(action.type)) return state
  switch (action.type) {
    case 'loaded': return { ...state, phase: 'ready', box: action.box, error: null }
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
    case 'view': return { ...state, box: action.box }
    case 'escape': return state.segmentChoices.length ? { ...state, segmentChoices: [] } : { ...state, detailOpen: false }
  }
}

export function clampBox(box: Box, width: number, height: number): Box {
  const w = Math.max(100, Math.min(width, box.width))
  const h = Math.max(80, Math.min(height, box.height * (w / box.width)))
  return { x: Math.max(0, Math.min(width - w, box.x)), y: Math.max(0, Math.min(height - h, box.y)), width: w, height: h }
}

export function zoomBox(box: Box, factor: number, width: number, height: number): Box {
  const w = Math.max(100, Math.min(width, box.width * factor))
  const h = box.height * (w / box.width)
  return clampBox({ x: box.x + (box.width - w) / 2, y: box.y + (box.height - h) / 2, width: w, height: h }, width, height)
}

export function panBox(box: Box, dx: number, dy: number, width: number, height: number): Box {
  return clampBox({ ...box, x: box.x + dx * box.width * 0.2, y: box.y + dy * box.height * 0.2 }, width, height)
}
