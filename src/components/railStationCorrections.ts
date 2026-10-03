import source from '../../lore/places/rail-station-corrections.json'
import identities from '../../lore/places/rail-station-identities.json'

export function correctedRailStations<T extends { name: string; east: number; north: number; lineIds: string[] }>(stations: T[]): T[] {
  const corrected = stations.map((station) => {
    const correction = source.corrections.find((entry) => entry.name === station.name && entry.east === station.east && entry.north === station.north)
    return correction ? { ...station, lineIds: correction.lineIds } : station
  })
  const seen = new Set<string>()
  return corrected.flatMap((station) => {
    const identity = identities.groups.find((group) => group.name === station.name && group.members.some((member) => member.east === station.east && member.north === station.north))
    if (!identity) return [station]
    if (seen.has(identity.uid)) return []
    seen.add(identity.uid)
    return [{ ...station, lineIds: identity.lineIds }]
  })
}
