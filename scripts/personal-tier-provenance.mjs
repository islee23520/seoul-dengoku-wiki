import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const check = (condition, path) => { if (!condition) throw Object.assign(new Error('E_PERSON_TIER_PROVENANCE'), { code: 'E_PERSON_TIER_PROVENANCE', path }) }
const git = async (root, args) => (await promisify(execFile)('git', ['-C', root, ...args], { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 })).stdout
const gitBlob = async (root, revision, path) => git(root, ['show', `${revision}:${path}`])
const gitList = async (root, revision, path) => git(root, ['ls-tree', '--name-only', revision, path + '/'])
  .then(bytes => bytes.toString('utf8').split('\n').filter(Boolean))
// Baseline commit whose published person details carry the preserved personal tiers.
const revision = '6754735a88420f68830308658206c1e9b2d971a5'
export const PERSONAL_TIER_PRESERVATION_IDS = Object.freeze('K157 K158 K161 K398 K399 K400 K401 K402 K403 K404 K407 K408 K409 K410 K411 K412 K413 K414 K415 K416 K417 K418 K419 K420 K421 K422 K439 K455 K471 K487 K503 K519 K535 K551 K567 K583 K599 K615 K631 K647 K653 K663 K669 K679 K685 K695 K701 K711 K717 K727 K733 K743 K749 K759 K765 K775 K791 K797 K807 K813 K823 K829 K839 K845 K855 K861 K871 K877 K887 K893 K903 K909 K919 K925 K935 K941 K951 K957 K967 K973 K983 K989 K1000'.split(' '))
export function assertPersonalTierPreservation(map) {
  check(map instanceof Map && PERSONAL_TIER_PRESERVATION_IDS.every(id => map.has(id)), 'personalTierPreservation')
  return map
}

// Baseline personal tiers for the preserved S06/S16 cards, read from the baseline
// commit's published details. Structure checks only; no source pins or approvals.
export async function authenticatePersonalTierProvenance(root, reader = readFile, blobReader = gitBlob, listReader = gitList) {
  const original = async path => {
    const bytes = await blobReader(root, revision, path)
    return { doc: JSON.parse(bytes), sha256: hash(bytes) }
  }
  const current = async path => JSON.parse(await reader(resolve(root, path)))
  const before06 = await original('lore/characters/Cast-State-06.json')
  const before16 = await original('lore/characters/Cast-State-16.json')
  const offices = await original('lore/offices/Offices-and-Ranks.json')
  const current06 = await current('lore/characters/Cast-State-06.json')
  const current16 = await current('lore/characters/Cast-State-16.json')
  const map = new Map(), baselineTiers = new Map()
  for (const path of (await listReader(root, revision, 'public/person-details')).filter(path => /^public\/person-details\/person-\d+\.json$/.test(path))) {
    const { doc: old, sha256 } = await original(path)
    check(!baselineTiers.has(old.characterId) && /^T[1-5]$/.test(old.commonTier), path)
    baselineTiers.set(old.characterId, old.commonTier)
    if (!PERSONAL_TIER_PRESERVATION_IDS.includes(old.characterId)) continue
    const source = old.state === 'S06' ? 'Cast-State-06' : 'Cast-State-16'
    check(['S06', 'S16'].includes(old.state) && old.sourceRoute === `/world/${source}#인물-${old.name}`, old.characterId)
    const before = old.state === 'S06' ? before06.doc : before16.doc
    const anchor = `인물-${old.name}`
    const cards = before.content.filter(block => block.anchor === anchor + '-list2')
    check(cards.length === 1 && JSON.stringify(cards[0]).includes('품계: ' + old.rank), old.characterId + ':original-card')
    const table = offices.doc.content.find(block => block.anchor === '국가별-관직표-table1')
    const tableRow = table.rows.find(row => row[0].ko === (old.state === 'S06' ? '대한민국정부' : '정동노총'))
    check(tableRow[Number(old.commonTier.slice(1))]?.ko.split(/[·/]/u).some(rank => rank.trim() === old.rank), old.characterId + ':office-table')
    const authority = old.state === 'S06'
      ? old.characterId === 'K157' ? 'OD-05-office-only' : 'owner-retrofit-civil-service-position/grade'
      : 's16-unaffiliated-source-application-522:functional-community-role'
    const blocks = (old.state === 'S06' ? current06 : current16).content.filter(block => block.anchor === anchor || block.anchor.startsWith(anchor + '-'))
    check(blocks.length > 1, old.characterId + ':current-card')
    const row = { personId: old.characterId, publicId: old.id, name: old.name, stateId: old.state, source, commonTier: old.commonTier,
      provenance: { baselineDetailSha256: sha256, authority, currentRoleBlocks: blocks.map(block => ({ anchor: block.anchor, sha256: hash(JSON.stringify(block)) })) } }
    map.set(old.characterId, row)
  }
  return assertPersonalTierPreservation(map)
}
export const loadPersonalTierPreservation = authenticatePersonalTierProvenance
