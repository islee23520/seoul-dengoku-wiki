#!/usr/bin/env node
// Private author API. Import createCharacterServer with an explicitly sealed
// version store. Standalone startup requires both explicit sealed source files.
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ApiError, PROFILE, REVISIONS, RULES_VERSION, apiContract, candidate, createVersionStore, exactFields, explicitRevision, matchesCharacter } from './original-character-api.mjs'

export function configuredVersionStore(configuration) {
  const paths = new Map([
    ['ce173686bcba220cd2a7dedfb5c78b941bf3c151', configuration.CHARACTER_PARENT_PIN_SOURCE],
    ['5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4', configuration.CHARACTER_POPULATED_SOURCE],
  ])
  if (REVISIONS.some(revision => typeof paths.get(revision) !== 'string' || !paths.get(revision))) {
    throw new ApiError(503, 'E_VERSION_STORE_BINDING')
  }
  return createVersionStore(new Map(REVISIONS.map(revision => [revision, readFileSync(paths.get(revision))])))
}

async function readBody(req) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new ApiError(415, 'E_JSON_CONTENT_TYPE')
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size <= 1024 * 1024) chunks.push(chunk)
  }
  if (size > 1024 * 1024) throw new ApiError(413, 'E_BODY_LIMIT')
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw new ApiError(400, 'E_JSON') }
}

export function createCharacterServer({ versionStore } = {}) {
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Character-Audience', 'author-private')
    const send = (status, body) => res.writeHead(status).end(body === undefined ? undefined : JSON.stringify(body))
    try {
      // No wildcard CORS: browser/public callers must not consume private sheets.
      if (req.headers.origin || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'none')) throw new ApiError(403, 'E_PRIVATE_AUTHOR_API')
      const url = new URL(req.url, 'http://127.0.0.1')
      if ([...url.searchParams.keys()].some(key => !['revision', 'audience'].includes(key))) throw new ApiError(400, 'E_QUERY')
      if (url.searchParams.getAll('audience').length > 1 || (url.searchParams.has('audience') && url.searchParams.get('audience') !== 'author-private')) throw new ApiError(403, 'E_PRIVATE_AUTHOR_API')
      if (req.method === 'OPTIONS') {
        res.setHeader('Allow', 'GET,POST,PATCH,PUT,OPTIONS')
        return send(204)
      }
      if (req.method === 'GET' && url.pathname === '/mcp/tools') return send(200, { contract: apiContract(), tools: [
        { name: 'list_characters', endpoint: 'GET /api/characters' },
        { name: 'get_character', endpoint: 'GET /api/characters/:id' },
        { name: 'get_sheet', endpoint: 'GET /api/characters/:id/sheet' },
        { name: 'create_character', endpoint: 'POST /api/characters' },
        { name: 'update_character', endpoint: 'PATCH /api/characters/:id', alternate: 'PUT /api/characters/:id' },
      ] })
      const characterRoute = url.pathname.match(/^\/api\/characters(?:\/([^/]+)(?:\/(sheet))?)?$/u)
      const settlementRoute = url.pathname.match(/^\/api\/settlements\/([^/]+)\/(npcs|generate-npcs)$/u)
      if (!characterRoute && !settlementRoute) throw new ApiError(404, 'E_ROUTE')
      if (url.searchParams.getAll('revision').length !== 1) throw new ApiError(400, 'E_EXPLICIT_REVISION')
      const revision = explicitRevision(url.searchParams.get('revision'))
      if (!versionStore) throw new ApiError(503, 'E_VERSION_STORE_BINDING')
      const { people } = versionStore.read(revision)
      const envelope = { schema: 'original-character-api.v1', revision, audience: 'author-private',
        rulesVersion: RULES_VERSION, profile: PROFILE, operativeRatings: null, legacyOperative: false }
      if (settlementRoute) {
        if (req.method === 'GET' && settlementRoute[2] === 'npcs') return send(200, { ...envelope, contract: apiContract().settlement })
        if (req.method !== 'POST' || settlementRoute[2] !== 'generate-npcs') throw new ApiError(405, 'E_METHOD')
        const payload = await readBody(req)
        exactFields(payload, ['revision', 'audience', 'candidates'], 'E_SETTLEMENT_ENVELOPE')
        if (payload.revision !== revision || payload.audience !== 'author-private' || !Array.isArray(payload.candidates)) throw new ApiError(400, 'E_SETTLEMENT_ENVELOPE')
        const proposals = payload.candidates.map(input => candidate(input, revision, people))
        if (new Set(proposals.map(item => item.identity.id)).size !== proposals.length || new Set(proposals.map(item => item.identity.name)).size !== proposals.length) throw new ApiError(409, 'E_DUPLICATE_CANDIDATE')
        return send(200, { ...envelope, proposedSettlementId: settlementRoute[1], candidates: proposals,
          reviewState: 'unreviewed', persisted: false, populationEffect: 0 })
      }
      const [, id, sheet] = characterRoute
      if (req.method === 'GET' && !id) return send(200, { ...envelope, count: people.length,
        characters: people.map(person => ({ id: person.id, personId: person.personId ?? person.url?.split('/').pop(),
          url: person.url, name: person.name, state: person.state })) })
      const person = id ? people.find(item => matchesCharacter(item, id)) : undefined
      if (id && !person) throw new ApiError(404, 'E_CHARACTER')
      if (req.method === 'GET' && id) return send(200, { ...envelope, id: person.id,
        personId: person.personId ?? person.url?.split('/').pop(), url: person.url, name: person.name,
        legacy: person, originalRatings: null })
      if ((!id && req.method === 'POST') || (id && !sheet && ['PATCH', 'PUT'].includes(req.method))) {
        const proposal = candidate(await readBody(req), revision, people, person)
        return send(id ? 200 : 201, { ...envelope, candidate: proposal, created: false, updated: false, persisted: false })
      }
      throw new ApiError(405, 'E_METHOD')
    } catch (error) {
      send(error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : 'E_INTERNAL' })
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.MCP_PORT ?? 17200)
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('E_PORT')
  const server = createCharacterServer({ versionStore: configuredVersionStore(process.env) })
  server.listen(port, '127.0.0.1', () => console.log(`Private character API (two sealed revisions bound): http://127.0.0.1:${server.address().port}`))
}
