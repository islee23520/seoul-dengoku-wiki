export type GeographicRank = 'county' | 'duchy' | 'kingdom' | 'empire'
export type GeographicSlot = { id: string; name: string; dongId: string; fragmentId: string | null; status: string; holderPersonId: string | null; geometryVerified: boolean }
export type GeographicTitle = { id: string; rank: GeographicRank; name: string; parentId: string | null; countyIds: string[]; path: string; holderPersonId: string | null; datedSlots: GeographicSlot[]; currentSlots: GeographicSlot[] }
export type GeographicTitles = { spatialDate: string; currentDate: string; titles: GeographicTitle[] }
export function projectGeographicTitles(staging: unknown, boundaries: unknown, project: (x: number, y: number) => number[]): GeographicTitles
export function titlesAtRank(geography: GeographicTitles, rank: GeographicRank): GeographicTitle[]
export function validateGeographicMap(geography: GeographicTitles): void
export function resolveGeographicTitle(geography: GeographicTitles, id: string | null): GeographicTitle | null
export function resolveGeographicSelection(geography: GeographicTitles, requested: string | null): GeographicTitle | null
export function geographicTitleColor(id: string, rankIds?: string[]): string
export function projectPhysicalRail(subset: unknown, project: (longitude: number, latitude: number) => number[]): { projection: string; paths: Array<{ id: string; lineId: string; points: number[][] }> }
