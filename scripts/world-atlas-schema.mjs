// Wiki-owned contract for lore/World-Narrative-Atlas.json and its generated JSON projections.
export const ATLAS_SCHEMA = 'world-narrative-atlas.v2'
export const UNAFFILIATED_FIELDS = Object.freeze(['name', 'character_id'])
export const FROZEN_HUMAN_COUNT = 422

export const STATES = Object.freeze([
  ['S01', '수문국'], ['S02', '규격맹'], ['S03', '태욱그룹'], ['S04', '명부교회'],
  ['S05', '동방사'], ['S06', '대한민국정부'], ['S07', '환적국'], ['S08', '중앙기술보존원'],
  ['S09', '여의도출자연합회'], ['S10', '안국총림'], ['S11', '성하그룹'], ['S12', '신내운수'],
  ['S13', '흰십자단'], ['S14', '아관사'], ['S15', '명동대교구'], ['S16', '정동노총'],
].map(([id, name]) => Object.freeze({ id, name })))

export const STATE_BY_ID = Object.freeze(Object.fromEntries(STATES.map((state) => [state.id, state])))

export const PROJECTION_PATHS = Object.freeze([
  'Operating-Houses.json',
  'Regional-Physical-AI-Arcs.json',
  'Synthetic-Actors.json',
  'World-Expansion-Index.json',
  'World-Relation-Ledger.json',
  'factions/External-Theaters.json',
  'bestiary/Hostile-Ecology-Index.json',
  ...Array.from({ length: 26 }, (_, index) => `bestiary/groups/Hostile-Group-G${String(index + 1).padStart(2, '0')}.json`),
])

export const PROJECTION_PATH_SET = new Set(PROJECTION_PATHS)

export const PROJECTION_PATHS_BY_KIND = Object.freeze({
  houses: 'Operating-Houses.json',
  theaters: 'factions/External-Theaters.json',
  synthetics: 'Synthetic-Actors.json',
  hostileIndex: 'bestiary/Hostile-Ecology-Index.json',
  chronology: 'Regional-Physical-AI-Arcs.json',
  relationLedger: 'World-Relation-Ledger.json',
  expansionIndex: 'World-Expansion-Index.json',
})

export const getGroupDossierPath = (id) => `bestiary/groups/Hostile-Group-${id}.json`

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]))
}

export function canonicalJson(value) {
  return `${JSON.stringify(sortObject(value), null, 2)}\n`
}
