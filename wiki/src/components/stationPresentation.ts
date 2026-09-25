// Graph IDs and edges remain independent; these names refer to the same displayed site.
export const stationAliases: Record<string, string> = {
  '강변(동서울터미널)': '강변',
  '경복궁(정부서울청사)': '경복궁',
  '교대(법원·검찰청)': '교대',
  '구의(광진구청)': '구의',
  '남부터미널(예술의전당)': '남부터미널',
  '대림(구로구청)': '대림',
  '방배 (백석예술대)': '방배',
  '삼성(무역센터)': '삼성',
  '서울대입구(관악구청)': '서울대입구',
  '수유(강북구청)': '수유',
  '아현(추계예술대)': '아현',
  '왕십리(성동구청)': '왕십리',
  '잠실(송파구청)': '잠실',
  '총신대입구(이수)': '총신대입구 (이수)',
  '충정로(경기대입구)': '충정로',
  '한성대입구(삼선교)': '한성대입구',
  '혜화(서울대학교병원)': '혜화',
  '회현(남대문시장)': '회현',
}

export function presentationStations<T extends { id: string; name: string; lineIds: string[] }>(stations: T[]) {
  const byId = new Map(stations.map((station) => [station.id, station]))
  const members = new Map<string, T[]>()
  for (const station of stations) {
    const primaryId = stationAliases[station.id]
    const primary = primaryId && byId.get(primaryId)
    const id = primary && station.lineIds.some((lineId) => primary.lineIds.includes(lineId)) ? primaryId : station.id
    if (!members.has(id)) members.set(id, [])
    members.get(id)!.push(station)
  }
  return [...members].map(([id, group]) => ({
    ...byId.get(id)!,
    memberIds: group.map((station) => station.id),
    names: group.map((station) => station.name),
    lineIds: [...new Set(group.flatMap((station) => station.lineIds))],
  }))
}
