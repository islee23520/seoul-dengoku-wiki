// People search as an explicit state machine.
//
// The old React page kept this as scattered useState flags plus a sessionStorage JSON guard. Here every phase and every
// transition is listed in one table, so impossible states cannot be reached (for example "filtering while the data is
// still loading") and a reader or an agent can enumerate the machine without running it.

export type Phase = 'loading' | 'ready' | 'error'

export interface PeopleFilters {
  query: string
  faction: string
  state: string
  tier: string
  occupation: string
  gender: string
}

export interface PeopleState {
  phase: Phase
  filters: PeopleFilters
  /** How many result rows are rendered; the rest are behind "show more" so 1,022 rows never hit the DOM at once. */
  shown: number
  error: string | null
}

export type PeopleAction =
  | { type: 'loaded' }
  | { type: 'failed'; message: string }
  | { type: 'retry' }
  | { type: 'set'; field: keyof PeopleFilters; value: string }
  | { type: 'reset' }
  | { type: 'more' }

export const PAGE_SIZE = 100
export const ALL = 'all'

export const defaultFilters: PeopleFilters = { query: '', faction: ALL, state: ALL, tier: ALL, occupation: '', gender: ALL }

/** The whole machine: which action is allowed in which phase, and where it leads. */
export const transitions: Record<Phase, Partial<Record<PeopleAction['type'], Phase>>> = {
  loading: { loaded: 'ready', failed: 'error' },
  ready: { set: 'ready', reset: 'ready', more: 'ready' },
  error: { retry: 'loading' },
}

export function initialState(restored: PeopleFilters = defaultFilters): PeopleState {
  return { phase: 'loading', filters: restored, shown: PAGE_SIZE, error: null }
}

export function reduce(state: PeopleState, action: PeopleAction): PeopleState {
  const next = transitions[state.phase][action.type]
  if (next === undefined) return state // not allowed in this phase: ignore instead of corrupting state
  switch (action.type) {
    case 'loaded': return { ...state, phase: next, error: null }
    case 'failed': return { ...state, phase: next, error: action.message }
    case 'retry': return { ...state, phase: next, error: null }
    case 'set': return { ...state, phase: next, filters: { ...state.filters, [action.field]: action.value }, shown: PAGE_SIZE }
    case 'reset': return { ...state, phase: next, filters: defaultFilters, shown: PAGE_SIZE }
    case 'more': return { ...state, phase: next, shown: state.shown + PAGE_SIZE }
  }
}

const KEY = 'wiki.people.filters.v2'
const ALLOWED_KEYS = Object.keys(defaultFilters) as (keyof PeopleFilters)[]

/** Restore saved filters; anything malformed or unknown falls back to the default instead of throwing. */
export function restoreFilters(storage: Pick<Storage, 'getItem'> | null, valid: { faction: Set<string>; state: Set<string>; tier: Set<string>; gender: Set<string> }): PeopleFilters {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return defaultFilters
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return defaultFilters
    const o = parsed as Record<string, unknown>
    if (!ALLOWED_KEYS.every((k) => typeof o[k] === 'string')) return defaultFilters
    const pick = (value: unknown, set: Set<string>) => (value === ALL || set.has(value as string) ? (value as string) : ALL)
    return {
      query: o.query as string,
      occupation: o.occupation as string,
      faction: pick(o.faction, valid.faction),
      state: pick(o.state, valid.state),
      tier: pick(o.tier, valid.tier),
      gender: pick(o.gender, valid.gender),
    }
  } catch {
    return defaultFilters
  }
}

export function persistFilters(storage: Pick<Storage, 'setItem' | 'removeItem'> | null, filters: PeopleFilters): void {
  try {
    const isDefault = ALLOWED_KEYS.every((k) => filters[k] === defaultFilters[k])
    if (isDefault) storage?.removeItem(KEY)
    else storage?.setItem(KEY, JSON.stringify(filters))
  } catch {
    // storage may be unavailable (private mode); filtering still works without persistence
  }
}

/** Row layout of data/people.<locale>.json */
export type PersonRow = [id: string, name: string, altName: string, title: string, position: string, rank: string, tier: string, occupation: string, gender: string, stage: string, stateId: string, stateName: string, factionId: string]

export function matches(row: PersonRow, f: PeopleFilters): boolean {
  const [id, name, alt, title, position, rank, tier, occupation, gender, stage, stateId, stateName, factionId] = row
  if (f.faction !== ALL && factionId !== f.faction) return false
  if (f.state !== ALL && stateId !== f.state) return false
  if (f.tier !== ALL && tier !== f.tier) return false
  if (f.gender !== ALL && gender !== f.gender) return false
  const occ = f.occupation.trim().toLocaleLowerCase()
  if (occ && !occupation.toLocaleLowerCase().includes(occ)) return false
  const needle = f.query.trim().toLocaleLowerCase()
  if (!needle) return true
  return `${name} ${alt} ${title} ${position} ${rank} ${occupation} ${gender} ${stateName} ${stage} ${id} ${stateId}`.toLocaleLowerCase().includes(needle)
}
