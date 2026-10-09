export function currentAffiliations(contract, stateRows) {
  const ids = new Set(stateRows.map(state => state.id))
  const byState = new Map()
  for (const hegemon of contract.hegemons) {
    if (!['state', 'union'].includes(hegemon.kind) || !hegemon.name || !hegemon.memberStateIds.length) throw new Error('E_HEGEMON_SHAPE')
    if (hegemon.kind === 'state' && (!ids.has(hegemon.stateId) || !hegemon.memberStateIds.includes(hegemon.stateId))) throw new Error('E_HEGEMON_STATE')
    if (hegemon.kind === 'union' && Object.hasOwn(hegemon, 'stateId')) throw new Error('E_HEGEMON_UNION_HEAD')
    for (const id of hegemon.memberStateIds) {
      if (!ids.has(id) || byState.has(id)) throw new Error('E_HEGEMON_MEMBERSHIP:' + id)
      byState.set(id, { kind: hegemon.kind, name: hegemon.name, ...(hegemon.kind === 'state' ? { stateId: hegemon.stateId } : {}) })
    }
  }
  for (const id of contract.neutralStateIds ?? []) {
    if (!ids.has(id) || byState.has(id)) throw new Error('E_HEGEMON_MEMBERSHIP:' + id)
    byState.set(id, { kind: 'neutral', name: '중립' })
  }
  if (byState.size !== ids.size || contract.states.length !== ids.size) throw new Error('E_HEGEMON_COVERAGE')
  const states = new Map()
  for (const state of contract.states) {
    const historical = stateRows.find(row => row.id === state.stateId)
    if (!historical || states.has(state.stateId) || historical.name !== state.currentName || !state.currentName) throw new Error('E_AFFILIATION_IDENTITY:' + state.stateId)
    if (!['none', 'immediate-holdings'].includes(state.currentExclusiveDistricts)) throw new Error('E_AFFILIATION_FOOTPRINT:' + state.stateId)
    const base = state.currentBase
    if (!base?.name || !(base.kind === 'station' && base.stationId || base.kind === 'facility' && base.landmarkId)) throw new Error('E_AFFILIATION_BASE:' + state.stateId)
    states.set(state.stateId, { ...state, currentHegemon: byState.get(state.stateId) })
  }
  return states
}

export function hegemonsForHolders(holderIds, affiliations) {
  const hegemons = holderIds.map(id => {
    const state = affiliations.get(id)
    if (!state) throw new Error('E_HEGEMON_HOLDER:' + id)
    return state.currentHegemon
  })
  return hegemons.filter((hegemon, index) => hegemons.findIndex(other => other.kind === hegemon.kind && other.name === hegemon.name) === index)
}

export function currentBasePoint(base, stations, landmarks) {
  const point = base.kind === 'station'
    ? stations.find(station => station.id === base.stationId)
    : landmarks.find(landmark => landmark.id === base.landmarkId)
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error('E_CURRENT_BASE_NOT_FOUND:' + base.name)
  return { ...base, x: point.x, y: point.y }
}

export function territoryLabel(candidates, currentBase) {
  return candidates[0] ?? { x: currentBase.x, y: currentBase.y }
}
