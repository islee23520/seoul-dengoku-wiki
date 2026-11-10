// Builds the static JSON the territory-map island reads, from the SQL tables loaded by build.mjs.
// Three files so the page does not download everything up front:
//   map.core.<locale>.json  regions, stations, segments, lines, landmarks, states, holdings, labels   (small)
//   map.titles.json         title polygons (geometry only, locale independent)                         (loaded when titles are shown)
//   map.rail.json           physical rail polylines already projected to map units                     (loaded when rail is shown)

// Owner rule: each district (gu) is one duchy. North of the Han river is the Government; Gangnam-side east is Arc; Gangnam-side west is the Free City.
// Gwanak-gu joins the Free City (owner answer 2026-11-10).
const DISTRICT_FACTION = {
  government: ['마포구', '용산구', '중구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '종로구', '서대문구', '은평구', '강북구', '도봉구', '노원구'],
  arc: ['서초구', '강남구', '송파구', '강동구'],
  'free-city': ['강서구', '양천구', '영등포구', '구로구', '금천구', '동작구', '관악구'],
};
const factionOfDistrict = new Map(Object.entries(DISTRICT_FACTION).flatMap(([f, gus]) => gus.map((g) => [g, f])));

const LABELS = {
  en: {
    title: 'Territory Map', lead: 'Counties are the smallest selectable unit. Geographic jurisdiction is separate from actual holdings and vassalage.', epoch: 'As of',
    modeGroup: 'Map type', political: 'Political map', titles: 'Geographic titles', layerGroup: 'Layer', surface: 'Surface', underground: 'Underground',
    rank: 'Title rank', ranks: { county: 'County', duchy: 'Duchy', kingdom: 'Kingdom', empire: 'Empire' }, line: 'Line filter', allLines: 'All lines',
    holding: 'Personal domain', noHolding: 'Select a domain', showRail: 'Show subway lines', markers: 'Map markers', stations: 'Stations', landmarks: 'Key sites',
    whole: 'Whole Seoul', zoomIn: 'Zoom in', zoomOut: 'Zoom out', left: 'Pan left', right: 'Pan right', up: 'Pan up', down: 'Pan down',
    mapLabel: 'Territory map. Use arrow keys to pan, plus and minus to zoom.', detail: 'Selection details', close: 'Close', openDetail: 'Show details', hideDetail: 'Hide details',
    legend: 'Political legend', neutral: 'Neutral', unknown: 'Political affiliation unknown', loading: 'Loading the map…', failed: 'Could not load the map data.', retry: 'Retry', loadingGeometry: 'Loading territory outlines…',
    statesList: 'States', states: 'State', undergroundLegend: 'Underground segment status', held: 'Held', contested: 'Contested', vacant: 'Vacant', unassigned: 'Unassigned',
    status: { held: 'Held', contested: 'Contested', vacant: 'Vacant', unassigned: 'Unassigned', unassigned_: 'Unassigned' },
    kTitle: 'Geographic title', kRegion: 'Selected district', kState: 'Selected state', kStation: 'Station', kSegment: 'Underground segment', kLandmark: 'Key site', kHolding: 'Personal domain',
    ruler: 'Ruler', hegemon: 'Current overlord', faction: 'Faction', government: 'Government', power: 'Power', capital: 'Capital', origin: 'Origin',
    direct: 'Directly held by', current: 'Current overlord', districtOf: 'District', area: 'Area (km²)', density: 'Density 2126', summary: 'Summary', holder: 'Holder', unknownHolder: 'Holder not confirmed',
    displayedFaction: 'Displayed faction', politicalNote: 'Political colour shows only the three central factions and neutral. It does not mean title ownership or vassalage.', members: 'Districts in this title',
    lines: 'Lines', control: 'Control', controlledBy: 'Directly held by', stationsOf: 'Stations', endpoints: 'Between', viewState: 'View state',
    regionsOfHolding: 'Districts', stationOfHolding: 'Station', directHolding: 'Direct holding', vassalHolding: 'Vassal holding', openPerson: 'Open person page',
    count: (n) => `${n}`, attribution: 'Source',
  },
  ko: {
    title: '서울 영토 지도', lead: '백작령을 최소 선택 단위로 표시합니다. 지리 관할과 실제 보유·봉속은 별개입니다.', epoch: '시점',
    modeGroup: '지도 종류', political: '정치 지도', titles: '지리 작위', layerGroup: '영토 층', surface: '지상 영토', underground: '지하 영토',
    rank: '지리 작위 등급', ranks: { county: '백작령', duchy: '공작령', kingdom: '왕국', empire: '제국' }, line: '노선 필터', allLines: '전체 노선',
    holding: '개인 영지', noHolding: '영지 선택', showRail: '지하철 노선 표시', markers: '지도 표시', stations: '역', landmarks: '주요 시설',
    whole: '서울 전체', zoomIn: '지도 확대', zoomOut: '지도 축소', left: '왼쪽 이동', right: '오른쪽 이동', up: '위쪽 이동', down: '아래쪽 이동',
    mapLabel: '영토 지도. 방향키로 이동하고 더하기·빼기 키로 확대·축소합니다.', detail: '선택 정보', close: '닫기', openDetail: '상세 보기', hideDetail: '상세 숨기기',
    legend: '서울 정치 권역 범례', neutral: '중립', unknown: '정치 관할 미확인', loading: '지도를 불러오는 중…', failed: '지도 자료를 불러오지 못했습니다.', retry: '다시 시도', loadingGeometry: '영토 경계를 불러오는 중…',
    statesList: '국가', states: '국가', undergroundLegend: '지하 구간 상태 범례', held: '실효 지배', contested: '분쟁', vacant: '공백', unassigned: '미배정',
    status: { held: '실효 지배', contested: '분쟁', vacant: '공백', unassigned: '미배정', unassigned_: '미배정' },
    kTitle: '지리 작위', kRegion: '선택된 지역', kState: '선택 국가', kStation: '서울 역 정보', kSegment: '지하 역 사이 구간', kLandmark: '주요 시설', kHolding: '개인 영지',
    ruler: '수장', hegemon: '현재 종주 소속', faction: '세력', government: '정체', power: '국력', capital: '수도', origin: '기원',
    direct: '직속 보유', current: '현재 상위', districtOf: '자치구', area: '면적(km²)', density: '2126년 밀도', summary: '요약', holder: '보유자', unknownHolder: '소유 미확인',
    displayedFaction: '표시 권역', politicalNote: '정치 색은 서울 내부의 세 중심 세력과 중립만 표시하며 작위 보유·봉속을 뜻하지 않습니다.', members: '이 작위의 행정동',
    lines: '노선', control: '지배', controlledBy: '직접 보유', stationsOf: '역', endpoints: '구간', viewState: '국가 보기',
    regionsOfHolding: '행정동', stationOfHolding: '역', directHolding: '직속 영지', vassalHolding: '봉신 영지', openPerson: '인물 페이지 열기',
    count: (n) => `${n}`, attribution: '출처',
  },
};

const UNASSIGNED = '#8a969b';
const RANKS = ['county', 'duchy', 'kingdom', 'empire'];

/**
 * rows: { meta, regions, titles, stations, edges, lines, landmarks, rail, holdings, underground, mapStates }  (SQL rows)
 * ctx : { ko, factions, states (wiki_state rows), charToPerson (K001 -> person-0001), personName(id) }
 */
export function buildMapData(rows, ctx) {
  const { ko } = ctx;
  const L = LABELS[ko ? 'ko' : 'en'];
  const pick = (r, k) => (ko ? r[`${k}_ko`] : r[k]);
  const meta = Object.fromEntries(rows.meta.map((m) => [m.key, m.value]));
  const projection = JSON.parse(meta.projection);
  const stateFaction = new Map(ctx.states.map((s) => [s.id, s.faction_id]));
  const factionById = new Map(ctx.factions.map((f) => [f.id, f]));
  const factionColor = (id) => (id && id !== 'independent' ? factionById.get(id)?.color ?? UNASSIGNED : UNASSIGNED);
  const stateName = new Map(ctx.states.map((s) => [s.id, pick(s, 'name')]));
  const mapState = new Map(rows.mapStates.map((m) => [m.state_id, m]));

  const regions = rows.regions.map((r) => {
    const polities = JSON.parse(r.polities);
    return { id: r.id, name: pick(r, 'name'), district: pick(r, 'district'), faction: factionOfDistrict.get(r.district_ko) ?? null, status: r.status, states: polities, summary: pick(r, 'summary'), openingState: pick(r, 'opening_state'), area: r.area_m2, density: r.density_2126, stations: r.station_count };
  });
  const regionById = new Map(regions.map((r) => [r.id, r]));
  const regionPath = new Map(rows.regions.map((r) => [r.id, r.path]));

  // Faction of a district = the faction of its direct holders; the title's faction is area-weighted over its districts.
  const regionFaction = (r) => r.faction;
  const titleById = new Map(rows.titles.map((t) => [t.id, t]));
  const titles = rows.titles.map((t) => {
    const countyIds = JSON.parse(t.county_ids);
    const dongIds = new Set(countyIds.flatMap((id) => JSON.parse((titleById.get(id) ?? { slots: '[]' }).slots).map((s) => s.dongId)));
    const weight = new Map();
    for (const id of dongIds) { const r = regionById.get(id); if (!r) continue; const f = regionFaction(r); if (f) weight.set(f, (weight.get(f) ?? 0) + (rows.regions.find((x) => x.id === id)?.area_m2 ?? 0)); }
    const faction = [...weight.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
    const slots = JSON.parse(ko ? t.slots_ko : t.slots);
    return { id: t.id, rank: t.rank, name: pick(t, 'name'), parent: t.parent_id, counties: countyIds, faction, districts: slots.map((s) => s.dongId) };
  });

  const states = ctx.states.map((s) => {
    const m = mapState.get(s.id);
    return {
      id: s.id, name: pick(s, 'name'), faction: s.faction_id, color: factionColor(s.faction_id), ruler: pick(s, 'ruler'), capital: pick(s, 'capital'), government: pick(s, 'government'), power: pick(s, 'power'), cause: pick(s, 'cause'),
      capitalX: m?.capital_x ?? null, capitalY: m?.capital_y ?? null, labelX: m?.label_x ?? null, labelY: m?.label_y ?? null, regions: regions.filter((r) => r.states.includes(s.id)).length,
    };
  });
  const stateById = new Map(states.map((s) => [s.id, s]));

  const controlOf = (json) => { const c = JSON.parse(json); return { status: c.status ?? 'unassigned', states: c.polityIds ?? [], names: c.polityNames ?? [], overlords: (c.currentHegemons ?? []).map((h) => h.name) }; };
  const stations = rows.stations.map((s) => {
    const c = controlOf(ko ? s.control_ko : s.control);
    return { id: s.id, name: pick(s, 'name'), district: pick(s, 'district'), x: s.x, y: s.y, lines: JSON.parse(s.line_ids), states: JSON.parse(s.surface_polity_ids), control: c };
  });
  const edges = rows.edges.map((e) => ({ id: e.id, a: e.a, b: e.b, lines: JSON.parse(e.line_ids), control: controlOf(ko ? e.control_ko : e.control) }));
  const lines = Object.fromEntries(rows.lines.map((l) => [l.id, { name: pick(l, 'name'), color: l.color }]));
  const landmarks = rows.landmarks.map((l) => ({ id: l.id, name: pick(l, 'name'), region: l.region_id, holder: l.holder_id, role: pick(l, 'role'), detail: pick(l, 'detail'), x: l.x, y: l.y, fortification: l.fortification }));

  const holdings = rows.holdings.map((h) => {
    const d = JSON.parse(ko ? h.data_ko : h.data);
    const personId = ctx.charToPerson.get(h.holder_person_id) ?? null;
    return {
      id: h.id, name: pick(h, 'name'), holder: personId, holderName: personId ? ctx.personName(personId) : h.holder_person_id, state: h.state_id,
      regions: (d.adminRefs ?? []).map((r) => r.id), station: d.stationRef?.stationId ?? d.facilityRef?.stationId ?? null, landmark: d.landmarkRef?.landmarkId ?? null, direct: d.directLiegePersonId === null || d.directLiegePersonId === undefined,
    };
  });

  const underground = {};
  for (const u of rows.underground) {
    const d = JSON.parse(ko ? u.data_ko : u.data);
    const has = Object.values(d).some((f) => f && Object.entries(f).some(([k, v]) => k !== 'sources' && v !== null && !(typeof v === 'object' && Object.keys(v).length === 0)));
    if (has) underground[u.station_id] = d;
  }

  const factions = ctx.factions.filter((f) => f.id !== 'independent').map((f) => ({ id: f.id, name: pick(f, 'name'), color: f.color }));
  const core = {
    labels: L, width: Number(meta.width), height: Number(meta.height), epoch: pick(meta, 'epoch') ?? meta.epoch, attribution: ko ? meta.attribution_ko : meta.attribution, unassigned: UNASSIGNED,
    factions, states, regions, titles, ranks: RANKS, stations, edges, lines, landmarks, holdings, underground,
    stateOrder: states.map((s) => s.id),
  };
  core.epoch = ko ? meta.epoch_ko : meta.epoch;

  const titleGeom = Object.fromEntries(rows.titles.map((t) => [t.id, t.path]));
  const regionGeom = Object.fromEntries([...regionPath.entries()]);
  const project = (e, n) => [Math.round((e - projection.minEast) / (projection.maxEast - projection.minEast) * core.width * 10) / 10, Math.round((projection.maxNorth - n) / (projection.maxNorth - projection.minNorth) * core.height * 10) / 10];
  const rail = rows.rail.map((r) => ({ id: r.id, mode: r.mode, line: r.line_id, points: JSON.parse(r.points).map(([e, n]) => project(e, n).join(',')).join(' ') }));
  return { core, titleGeom, regionGeom, rail };
}
