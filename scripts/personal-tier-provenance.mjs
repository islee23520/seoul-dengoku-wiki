import { readFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { authenticateReviewWordingSuccessor } from './review-wording-successor.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const check = (condition, path) => { if (!condition) throw Object.assign(new Error('E_PERSON_TIER_PROVENANCE'), { code: 'E_PERSON_TIER_PROVENANCE', path }) }
const gitBlob = async (root, revision, path) => (await promisify(execFile)('git', ['-C', root, 'show', `${revision}:${path}`], { encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 })).stdout
const revision = '6754735a88420f68830308658206c1e9b2d971a5'
export const PERSONAL_TIER_PRESERVATION_IDS = Object.freeze('K157 K158 K161 K398 K399 K400 K401 K402 K403 K404 K407 K408 K409 K410 K411 K412 K413 K414 K415 K416 K417 K418 K419 K420 K421 K422 K439 K455 K471 K487 K503 K519 K535 K551 K567 K583 K599 K615 K631 K647 K653 K663 K669 K679 K685 K695 K701 K711 K717 K727 K733 K743 K749 K759 K765 K775 K791 K797 K807 K813 K823 K829 K839 K845 K855 K861 K871 K877 K887 K893 K903 K909 K919 K925 K935 K941 K951 K957 K967 K973 K983 K989 K1000'.split(' '))
const branded = new WeakMap()
export function assertPersonalTierPreservation(map) {
  check(map instanceof Map && map.size === 83 && PERSONAL_TIER_PRESERVATION_IDS.every(id => map.has(id))
    && branded.get(map) === hash(JSON.stringify([...map])), 'personalTierPreservation')
  return map
}

// One independently authenticated baseline map. No producer import or tier
// defaults: owner office-axis changes and registered community roles are separate.
export async function authenticatePersonalTierProvenance(root, reader = readFile, blobReader = gitBlob) {
  check(hash(await reader(resolve(root, 'scripts/person-detail-production.mjs'))) === 'fe9d4866f1aba2c1116abc56b247636adefc48b9bf6135bb34c25bb599917e87', 'scripts/person-detail-production.mjs')
  check(hash(await reader(resolve(root, 'scripts/person-detail-inputs.mjs'))) === 'aabc0b0e5f2844549337497f36fa9bc781f5b2ef9176368ed42d39440b27f3c6', 'scripts/person-detail-inputs.mjs')
  const checked = async (path, expected) => {
    const bytes = await reader(resolve(root, path)); check(hash(bytes) === expected, path)
    return JSON.parse(bytes)
  }
  const baseline = await checked('.omo/private/seoul-migration/baseline.json', '2a8af6a497839dcc5abb2059697ef8f504b061013a89cbc2bd812c89b2810223')
  check(baseline.immutable === true && baseline.baseCommit === revision, 'baseline')
  const original = async path => {
    const rows = baseline.files.filter(row => row.path === path)
    check(rows.length === 1, path)
    const bytes = await blobReader(root, revision, path); check(hash(bytes) === rows[0].sha256, path)
    return { doc: JSON.parse(bytes), sha256: rows[0].sha256 }
  }
  const before06 = await original('lore/characters/Cast-State-06.json')
  const before16 = await original('lore/characters/Cast-State-16.json')
  const offices = await original('lore/offices/Offices-and-Ranks.json')
  const ownerRoot = '.omo/private/seoul-migration/office-rank-retrofit-proposal-20261017/'
  const proposal = await checked(ownerRoot + 'proposal.json', 'da361fc618c2ab82d67e01f7ced773fadc8189bc75194c5aaa3a6e6d5ca43fc0')
  const owner = await checked(ownerRoot + 'owner-approval-20261017.json', '422c993948878163b4f198c016abeb83421604677ac978cb71962bdbff3899b3')
  check(owner.kind === 'batch-approval' && owner.proposalSha256 === 'da361fc618c2ab82d67e01f7ced773fadc8189bc75194c5aaa3a6e6d5ca43fc0', 'owner')
  const candidate = '.omo/private/seoul-migration/s16-unaffiliated-candidate-20261017/'
  const classification = await checked(candidate + 'office-rank-classification.json', '1a376d070b4668194a7926cab3f50d8680ca210ef75c7d004d741892b1160ee3')
  const packet = await checked('.omo/private/seoul-migration/s16-unaffiliated-application-20261017/registration-packet.json', '2cb42cc58d1bc875dd811bd1dfb9a72ccda1d7c7c67b1986db91afc557a81628')
  const review = await checked(candidate + 'independent-rereview4.json', '70e65d23131d4a947f93e38253a99ada47153ad1aba5fa09d226d2c325ebb3c6')
  const manifest = await checked(candidate + 'manifest.json', '9e6800d44b2313b46575333559b12720dc204a898c4da43e8c193120e525102f')
  check(packet.schema === 'seoul-s16-unaffiliated-source-application.v1' && packet.operationCount === 522 && review.verdict === 'confirmed' && manifest, 's16-registration')
  const registry = JSON.parse(await reader(resolve(root, '.omo/private/seoul-migration/applied-batches.json')))
  const registrations = registry.batches.filter(row => row.approvalModel === 's16-unaffiliated-source-application-522')
  check(registrations.length === 1 && registrations[0].packetSha256 === '2cb42cc58d1bc875dd811bd1dfb9a72ccda1d7c7c67b1986db91afc557a81628'
    && registrations[0].applicationReview.evidenceSha256 === '70e65d23131d4a947f93e38253a99ada47153ad1aba5fa09d226d2c325ebb3c6', 's16-registration-inventory')
  for (const binding of Object.values(packet.provenance)) {
    check(hash(await reader(resolve(root, binding.path))) === binding.sha256, binding.path)
  }
  const wording = await authenticateReviewWordingSuccessor(root, reader)
  const current06 = await checked('lore/characters/Cast-State-06.json', 'c7a461ba27c6933bff29ebff86209a03ff19248bd543ab79aae4a93d5cd91f3e')
  const current16 = JSON.parse(await reader(resolve(root, 'lore/characters/Cast-State-16.json')))
  check(wording.files.get(resolve(root, 'lore/characters/Cast-State-16.json'))?.before
    && hash(wording.files.get(resolve(root, 'lore/characters/Cast-State-16.json')).before) === '3b7d579cf47ec3872c4cbba8dc23af207238228ed77211acc7d52278ee01a820', 's16-wording')
  const map = new Map(), baselineTiers = new Map()
  for (const file of baseline.files.filter(row => /^public\/person-details\/person-\d+\.json$/.test(row.path))) {
    const { doc: old, sha256 } = await original(file.path)
    check(!baselineTiers.has(old.characterId) && /^T[1-5]$/.test(old.commonTier), file.path)
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
    let authority
    if (old.state === 'S06') {
      const occurrences = proposal.occurrences.filter(row => row.personId === source + '#' + anchor)
      check(occurrences.length === 1 && occurrences[0].disposition === (old.characterId === 'K157' ? 'livelihood-role' : 'civil-service-position/grade'), old.characterId + ':owner-occurrence')
      authority = old.characterId === 'K157' ? 'OD-05-office-only' : 'owner-retrofit-civil-service-position/grade'
    } else {
      const rows = classification.classifications.filter(row => row.personId === old.characterId)
      check(rows.length === 1 && rows[0].name === old.name && rows[0].source === 'S16' && rows[0].classification === 'functional-community-role' && rows[0].governmentOfficeConferredBy === 'none', old.characterId + ':classification')
      authority = 's16-unaffiliated-source-application-522:functional-community-role'
    }
    const blocks = (old.state === 'S06' ? current06 : current16).content.filter(block => block.anchor === anchor || block.anchor.startsWith(anchor + '-'))
    check(blocks.length > 1, old.characterId + ':current-card')
    const row = { personId: old.characterId, publicId: old.id, name: old.name, stateId: old.state, source, commonTier: old.commonTier,
      provenance: { baselineDetailSha256: sha256, authority, currentRoleBlocks: blocks.map(block => ({ anchor: block.anchor, sha256: hash(JSON.stringify(block)) })) } }
    map.set(old.characterId, row)
  }
  check(baselineTiers.size === 1022 && map.size === 83 && PERSONAL_TIER_PRESERVATION_IDS.every(id => map.has(id)), 'denominator')
  branded.set(map, hash(JSON.stringify([...map])))
  baselineMaps.set(map, baselineTiers)
  return assertPersonalTierPreservation(map)
}
const baselineMaps = new WeakMap()
export function assertBaselinePersonalTiers(map, details) {
  assertPersonalTierPreservation(map)
  const expected = baselineMaps.get(map)
  check(details.length === 1022 && new Set(details.map(row => row.characterId)).size === 1022
    && details.every(row => expected.get(row.characterId) === row.commonTier), 'all1022-baseline-tiers')
  return true
}
export const loadPersonalTierPreservation = authenticatePersonalTierProvenance
