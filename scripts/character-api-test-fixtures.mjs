import { loadSheetMetadata } from './cast-sqlite/sheet-metadata.mjs'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createCharacterServer } from './mcp-character-server.mjs'
import { candidate, createVersionStore, REVISIONS, RULES_VERSION } from './original-character-api.mjs'
import { draftAbilityIds, emptyDraftProfile } from './character-profile-draft.mjs'
const runner = process.env.ORIGINAL_API_NODE_TEST === '1' ? await import('node:test') : await import('vitest')
export const test = process.env.ORIGINAL_API_NODE_TEST === '1'
  ? (name, body, timeout = 30000) => runner.test(name, { timeout }, body) : runner.test
export const root = fileURLToPath(new URL('..', import.meta.url))
export const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export const baseline = loadSheetMetadata().baseline
// Committed sealed inputs work in a source archive without Git or environment setup.
export const sources = new Map(await Promise.all(REVISIONS.map(async revision => {
  const bytes = await readFile(new URL('../vendor/issued-history/' + revision + '.json', import.meta.url))
  assert.equal(hash(bytes), baseline.revisions[revision].ledgerSha256)
  return [revision, bytes]
})))
export const store = createVersionStore(sources)
export const revision = REVISIONS[0]
const source = { revision, ref: 'author-test:explicit-rating-proposal', reviewState: 'unreviewed' }
export const proposal = () => ({ schema: 'original-character-candidate.v2', revision, audience: 'author-private',
  identity: { id: 'candidate:test-person', name: '직접 시험 후보' }, source: structuredClone(source),
  originalProfile: { rulesVersion: RULES_VERSION, reviewState: 'unreviewed', source: structuredClone(source),
    profile: { ...emptyDraftProfile(), abilities: { ...emptyDraftProfile().abilities, leadership: { base: 0, effective: 0 } } } } })

export async function live(options, body) {
  const server = createCharacterServer(options)
  const listening = once(server, 'listening', { signal: AbortSignal.timeout(5000) })
  server.listen(0, '127.0.0.1')
  await listening
  const address = `http://127.0.0.1:${server.address().port}`
  const request = async (path, init = {}) => {
    const response = await fetch(address + path, { ...init, signal: AbortSignal.timeout(5000) })
    return { status: response.status, body: response.status === 204 ? null : await response.json(), headers: response.headers }
  }
  try { await body(request) } finally {
    const closed = once(server, 'close', { signal: AbortSignal.timeout(5000) })
    server.close()
    server.closeAllConnections()
    await closed
  }
}
export const pathFor = (path, selected = revision) => path + '?revision=' + selected
export const json = (value, method = 'POST') => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) })
