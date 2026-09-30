import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { approvedDocuments } from '../../../scripts/catalog-admission.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../..')
const game = process.env.SEOUL_KENSHI_ROOT
assert.ok(game, 'Set SEOUL_KENSHI_ROOT to the GAME repository used for graph verification')
const input = JSON.parse(readFileSync(resolve(here, 'decision-inputs.json'), 'utf8'))
const read = path => readFileSync(resolve(root, path))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const at = (repo, commit, path) => execFileSync('git', ['show', `${commit}:${path}`], { cwd: repo, maxBuffer: 64 * 1024 * 1024 })
const source = JSON.parse(read(input.proposalSource))
const oldSource = JSON.parse(at(root, input.wikiBase, input.proposalSource))
assert.equal(source.status, 'draft')
assert.equal(source.domain, 'editorial')
// Isolate directory admission only. The production Atlas gate is checked separately
// and currently fails on unchanged main projections; this is not a build bypass.
const publishSet = await approvedDocuments(resolve(root, 'lore'), { checkAtlas: async () => {} })
assert.ok(!publishSet.some(row => row.source === input.proposalSource || row.id === source.id), 'Live authoring admission includes proposal')
assert.equal(input.status, 'proposal')
assert.equal(input.runtimeTarget, null)
assert.equal(input.stage2Locked, true)
const changed = new Set(['individual-input-register', 'station-layer-route-handoff', 'route', 'squad', 'owner-decisions'])
for (const block of oldSource.content) {
  const current = source.content.find(row => row.anchor === block.anchor)
  assert.ok(current, `Original anchor removed: ${block.anchor}`)
  if (!changed.has(block.anchor)) assert.deepEqual(current, block, `Original block changed: ${block.anchor}`)
}
assert.equal(source.content.length, oldSource.content.length + 1)
const frozen = ['lore/chronology/Scenario-Timeline.json', 'lore/chronology/Century-Annals.json', 'lore/characters/Core-Characters.json', 'lore/regions/content/11680.json', 'lore/name-pools/values-cast.json', 'public/opening-territories.json']
const hashes = {}
for (const path of frozen) {
  assert.deepEqual(read(path), at(root, input.wikiBase, path), `Protected source changed: ${path}`)
  hashes[path] = sha(read(path))
}
const graphBytes = at(game, input.gameBase, input.graphPath)
assert.equal(sha(graphBytes), input.graphSha256)
assert.equal(sha(readFileSync(resolve(game, input.graphPath))), input.graphSha256, 'Working graph diverges from pinned source')
const graph = JSON.parse(graphBytes)
const stations = new Set(graph.stations.map(row => row.id))
const key = (a, b) => [a, b].sort().join('|')
const edges = new Set(graph.edges.map(row => key(row.a, row.b)))
const pathCheck = path => {
  path.forEach(id => assert.ok(stations.has(id), `Unknown station: ${id}`))
  path.slice(1).forEach((id, i) => assert.ok(edges.has(key(path[i], id)), `Missing edge: ${path[i]}→${id}`))
}
for (const path of [input.route.outbound, input.route.onward, input.route.return, ...input.alternatives.map(row => row.stationPath)]) pathCheck(path)
assert.equal(input.route.startStationId, input.route.outbound[0])
assert.equal(input.location.recommendedStationId, input.route.outbound.at(-1))
assert.equal(input.route.onward[0], input.route.outbound.at(-1))
assert.equal(input.route.return[0], input.route.onward.at(-1))
assert.equal(input.route.return.at(-1), input.route.startStationId)
assert.ok(!edges.has(key('학동', '선정릉')), 'Direct shortcut unexpectedly introduced; review itinerary')
const adjacency = new Map([...stations].map(id => [id, []]))
graph.edges.forEach(({ a, b }) => { adjacency.get(a).push(b); adjacency.get(b).push(a) })
const distance = new Map([[input.route.startStationId, 0]])
const queue = [input.route.startStationId]
for (let i = 0; i < queue.length; i++) for (const next of adjacency.get(queue[i])) if (!distance.has(next)) {
  distance.set(next, distance.get(queue[i]) + 1); queue.push(next)
}
for (const candidate of input.alternatives) {
  assert.equal(candidate.outboundEdges, candidate.stationPath.length - 1)
  assert.equal(candidate.outboundEdges, distance.get(candidate.stationId))
}
const territory = JSON.parse(read('public/opening-territories.json'))
for (const claim of input.route.strategicEdges) {
  assert.ok(edges.has(key(claim.a, claim.b)))
  const actual = territory.edges.find(row => row.id === claim.id)
  assert.ok(actual)
  assert.equal(key(actual.a, actual.b), key(claim.a, claim.b))
  assert.equal(actual.passage2126, claim.passage2126)
  assert.equal(actual.control.primary, claim.controller)
  assert.deepEqual(actual.lineIds, claim.lineIds)
}
assert.ok(graph.edges.every(edge => !('layer' in edge)), 'Graph layer contract changed; review proposed layers')
assert.equal(input.route.layerPathApproved, false)
assert.equal(input.route.localAccessApproved, false)
for (const field of ['approvedStationId', 'accessGeometry', 'entranceLayer', 'totalLayerTransitions', 'occupancyOrAccessAuthority', 'carryingCapacity', 'approver', 'approvedAt', 'approvalUrl']) assert.equal(input.location[field], null)
assert.equal(input.squad.members.filter(row => row.kind === 'hero').length, input.squad.heroCount)
assert.equal(input.squad.members.filter(row => row.kind === 'adult-soldier-proposal').length, input.squad.proposedSoldierCount)
assert.ok(input.squad.proposedSoldierCount <= input.squad.soldierLimit)
assert.ok(input.squad.members.some(row => row.slot === input.squad.proposedActingLeaderSlot && row.kind === 'adult-soldier-proposal'))
const fields = ['armorId', 'bodyCondition', 'combatSkills', 'commandAssignment', 'leadership', 'mood', 'weaponId']
for (const member of input.squad.members) {
  assert.deepEqual(Object.keys(member.approvedInputs).sort(), fields)
  Object.values(member.approvedInputs).forEach(value => assert.equal(value, null))
  Object.values(member.approval).forEach(value => assert.equal(value, null))
  if (member.kind !== 'hero') assert.equal(member.personId, null)
}
for (const item of input.approvalItems) {
  assert.equal(item.approved, false)
  for (const field of ['approver', 'approvedAt', 'url']) assert.equal(item[field], null)
}
for (const path of ['src/generated/wikiCatalog.ts', 'public/wiki-contract.json', 'src/generated/publication-manifest.json']) {
  assert.ok(!read(path).toString().includes('Tripothon-Return-Relay-Proposal'), `Proposal leaked into ${path}`)
}
for (const locale of ['world', 'world-en']) assert.ok(!existsSync(resolve(root, `src/generated/${locale}/Tripothon-Return-Relay-Proposal.json`)))
console.log(JSON.stringify({ result: 'PASS', scope: 'proposal exclusion, pinned graph and strategic passage, unresolved approvals, source/block preservation; not gameplay or design approval', preservedBlocks: oldSource.content.length - changed.size, protectedSources: hashes, graphSha256: input.graphSha256, proposalSha256: sha(read(input.proposalSource)), inputSha256: sha(readFileSync(resolve(here, 'decision-inputs.json'))) }, null, 2))
