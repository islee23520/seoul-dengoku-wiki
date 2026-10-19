// Read-only wiki data API: people, territories, portrait design tokens and text-to-image prompts.
// No dependencies: run with `node server/wiki-api.mjs`.
//   PORT      listen port (default 8787)
//   HOST      listen host (default 0.0.0.0)
//   DATA_DIR  published wiki data root (default public/) holding person-details/, portrait-tokens/,
//             opening-territories.json, confirmed-person-holdings.json, seoul-observed-geography.json,
//             territorial-scale.json
//   PUBLIC_ORIGIN  origin written into openapi.json servers (default https://sss.linalab.io)
// Routes are served under both /wiki/api and /api.
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { composeTextToImage, textToImageStyles, textToImageViews } from './portrait-text-to-image.mjs'
import { openApiDocument } from './wiki-api-openapi.mjs'

const dataDir = resolve(process.env.DATA_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../public'))
const port = Number(process.env.PORT ?? 8787)
const host = process.env.HOST ?? '0.0.0.0'
const publicOrigin = process.env.PUBLIC_ORIGIN ?? 'https://sss.linalab.io'
const prefixes = ['/wiki/api', '/api']
const territoryFiles = ['opening-territories.json', 'confirmed-person-holdings.json', 'seoul-observed-geography.json', 'territorial-scale.json']

let store = null
let signature = ''

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
async function readDirectory(name) {
  const entries = new Map()
  const raw = new Map()
  for (const file of (await readdir(resolve(dataDir, name))).filter((value) => /^person-[0-9]{4}\.json$/.test(value)).sort()) {
    const text = await readFile(resolve(dataDir, name, file), 'utf8')
    const value = JSON.parse(text)
    const id = value.personId ?? value.id
    if (`${id}.json` !== file) throw new Error(`E_DATA_FILE_IDENTITY:${name}/${file}`)
    entries.set(id, value)
    raw.set(id, text)
  }
  return { entries, raw }
}

// A cheap change detector: newest mtime and file count across the served data.
async function dataSignature() {
  const parts = []
  for (const name of ['person-details', 'portrait-tokens']) {
    const files = await readdir(resolve(dataDir, name))
    const times = await Promise.all(files.map(async (file) => (await stat(resolve(dataDir, name, file))).mtimeMs))
    parts.push(`${name}:${files.length}:${Math.max(0, ...times)}`)
  }
  for (const file of territoryFiles) parts.push(`${file}:${(await stat(resolve(dataDir, file))).mtimeMs}`)
  return parts.join('|')
}

const etagOf = (text) => `"${createHash('sha256').update(text).digest('hex').slice(0, 32)}"`

async function load() {
  const next = await dataSignature()
  if (next === signature && store) return
  const [details, tokens, opening, holdingsFile, geography, scale] = await Promise.all([
    readDirectory('person-details'), readDirectory('portrait-tokens'),
    ...territoryFiles.map((file) => readJson(resolve(dataDir, file))),
  ])
  const personByCharacter = new Map([...details.entries.values()].map((person) => [person.characterId, person]))
  const people = [...details.entries.values()].map((person) => ({
    personId: person.id, characterId: person.characterId, name: person.name, title: person.title, position: person.position,
    rank: person.rank, commonTier: person.commonTier, occupation: person.occupation, gender: person.gender,
    stateId: person.state, stateName: person.stateName, age: person.age ?? null, ageAsOf: person.ageAsOf ?? null,
    hasPortrait: Boolean(tokens.entries.get(person.id)?.image?.sha256), detailRoute: `/wiki${person.detailRoute}`,
  }))
  const states = opening.states.map(({ chronology, ...state }) => ({ ...state, chronologyCount: chronology?.length ?? 0 }))
  store = {
    loadedAt: new Date().toISOString(),
    details, tokens, people, personByCharacter,
    tokenIndex: [...tokens.entries.values()].map((token) => ({
      personId: token.personId, characterId: token.characterId, name: token.name, gender: token.facts?.gender ?? null,
      stateId: token.stateId ?? null, role: token.facts?.role ?? null, approval: token.approval, hasPortrait: Boolean(token.image?.sha256),
      derivedSlots: Object.values(token.slots ?? {}).flatMap((group) => Object.values(group)).filter((slot) => slot?.derived).length,
    })),
    territories: {
      meta: { schema: opening.schema, epoch: opening.epoch, projection: opening.projection, attribution: opening.attribution, populationAttribution: opening.populationAttribution, landmarkAttribution: opening.landmarkAttribution, holdingsSchema: holdingsFile.schema, openingYear: holdingsFile.openingYear, geographySchema: geography.schema, geographySourceEdition: geography.sourceEdition, geographyBaseDate: geography.baseDate },
      opening, states, scale, lines: opening.lines, holdingsSummary: holdingsFile.summary, geographySources: geography.sources,
      collections: {
        hegemons: { rows: opening.hegemons, key: 'stateId' },
        states: { rows: opening.states, key: 'id' },
        regions: { rows: opening.regions, key: 'id', heavy: ['path'] },
        counties: { rows: geography.counties, key: 'id', heavy: ['path'] },
        stations: { rows: opening.stations, key: 'id' },
        landmarks: { rows: opening.landmarks, key: 'id' },
        vassals: { rows: opening.vassals, key: 'name' },
        titles: { rows: holdingsFile.titles, key: 'id' },
        holdings: { rows: holdingsFile.holdings, key: 'id' },
        polities: { rows: holdingsFile.polities, key: 'id' },
        retinues: { rows: holdingsFile.retinueGroups, key: 'id' },
        openingDispositions: { rows: holdingsFile.openingDispositions, key: 'personId' },
      },
    },
  }
  signature = next
  console.log(`WIKI_API_LOADED: ${details.entries.size} people, ${tokens.entries.size} tokens, ${opening.states.length} states, ${opening.regions.length} regions, ${holdingsFile.titles.length} titles from ${dataDir}`)
}

class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code }
}

function send(request, response, status, body, { etag, type = 'application/json; charset=utf-8' } = {}) {
  const headers = {
    'content-type': type,
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff',
  }
  const payload = typeof body === 'string' ? body : JSON.stringify(body, null, 2)
  headers.etag = etag ?? etagOf(payload)
  if (request.headers['if-none-match'] === headers.etag) { response.writeHead(304, headers); response.end(); return }
  response.writeHead(status, headers)
  response.end(request.method === 'HEAD' ? undefined : payload)
}

function page(rows, params) {
  const limit = Math.min(Math.max(Number(params.get('limit') ?? 100) || 100, 1), 2000)
  const offset = Math.max(Number(params.get('offset') ?? 0) || 0, 0)
  return { total: rows.length, offset, limit, count: Math.min(limit, Math.max(rows.length - offset, 0)), items: rows.slice(offset, offset + limit) }
}

const text = (value) => typeof value === 'string' ? value : value && typeof value === 'object' ? Object.values(value).filter((item) => typeof item === 'string').join(' ') : ''
const matches = (row, query) => !query || [row.name, row.id, row.personId, row.characterId, row.district, row.stateId].some((value) => text(value).includes(query))
const stateOf = (row) => row.stateId ?? row.state ?? row.suzerain ?? row.holderId ?? null
const holderOf = (row) => row.holderPersonId ?? row.sovereignPersonId ?? row.liegePersonId ?? row.personId ?? null

function personRef(characterId) {
  const person = store.personByCharacter.get(characterId)
  return person ? { characterId, personId: person.id, name: person.name } : { characterId, personId: null, name: null }
}

function personHoldings(person) {
  const { titles, holdings, polities } = store.territories.collections
  return {
    titles: titles.rows.filter((row) => row.holderPersonId === person.characterId),
    holdings: holdings.rows.filter((row) => row.holderPersonId === person.characterId || row.directLiegePersonId === person.characterId),
    polities: polities.rows.filter((row) => row.sovereignPersonId === person.characterId),
  }
}

function peopleRoute(parts, params) {
  if (parts.length === 0) {
    const query = params.get('q')?.trim()
    const rows = store.people.filter((row) => matches(row, query)
      && (!params.get('state') || row.stateId === params.get('state'))
      && (!params.get('tier') || row.commonTier === params.get('tier'))
      && (!params.get('gender') || row.gender === params.get('gender'))
      && (!params.get('rank') || row.rank === params.get('rank'))
      && (!params.get('hasPortrait') || String(row.hasPortrait) === params.get('hasPortrait')))
    return page(rows, params)
  }
  const [id, action, ...rest] = parts
  const person = /^K[0-9]+$/.test(id) ? store.personByCharacter.get(id) : store.details.entries.get(id)
  if (!/^(?:person-[0-9]{4}|K[0-9]+)$/.test(id)) throw new HttpError(400, 'invalid_person_id', 'expected person-XXXX or a K character ID')
  if (!person) throw new HttpError(404, 'person_not_found', `no person ${id}`)
  if (rest.length) throw new HttpError(404, 'not_found', 'unknown path')
  if (!action) return { ...person, links: { portraitToken: `/wiki/api/portrait-tokens/${person.id}`, prompt: `/wiki/api/portrait-tokens/${person.id}/prompt`, holdings: `/wiki/api/people/${person.id}/holdings`, page: `/wiki${person.detailRoute}` } }
  if (action === 'holdings') return { personId: person.id, characterId: person.characterId, name: person.name, ...personHoldings(person) }
  if (action === 'portrait-token') return store.tokens.entries.get(person.id) ?? null
  throw new HttpError(404, 'not_found', 'unknown path')
}

function territoriesRoute(parts, params) {
  const { territories } = store
  if (parts.length === 0) {
    return {
      ...territories.meta,
      counts: Object.fromEntries(Object.entries(territories.collections).map(([name, collection]) => [name, collection.rows.length])),
      holdingsSummary: territories.holdingsSummary,
      collections: Object.keys(territories.collections).map((name) => `/wiki/api/territories/${name}`),
      extra: ['/wiki/api/territories/scale', '/wiki/api/territories/lines', '/wiki/api/territories/sources'],
    }
  }
  const [name, id, ...rest] = parts
  if (rest.length) throw new HttpError(404, 'not_found', 'unknown path')
  if (name === 'scale' && !id) return territories.scale
  if (name === 'lines' && !id) return territories.lines
  if (name === 'sources' && !id) return territories.geographySources
  const collection = territories.collections[name]
  if (!collection) throw new HttpError(404, 'collection_not_found', `unknown territory collection ${name}`)
  const geometry = params.get('geometry') === '1' || params.get('geometry') === 'true'
  const strip = (row) => geometry || !collection.heavy ? row : Object.fromEntries(Object.entries(row).filter(([key]) => !collection.heavy.includes(key)))
  if (id) {
    const row = collection.rows.find((item) => String(item[collection.key]) === id)
    if (!row) throw new HttpError(404, 'territory_not_found', `no ${name} entry ${id}`)
    if (name === 'states') {
      const titles = territories.collections.titles.rows.filter((title) => title.stateId === row.id)
      return { ...row, ruler: row.ruler, regionCount: territories.collections.regions.rows.filter((region) => region.polities?.includes(row.id)).length, titles, holdings: territories.collections.holdings.rows.filter((holding) => holding.stateId === row.id) }
    }
    const holder = holderOf(row)
    return holder ? { ...row, holder: personRef(holder) } : row
  }
  const query = params.get('q')?.trim()
  const rows = collection.rows.filter((row) => matches(row, query)
    && (!params.get('state') || stateOf(row) === params.get('state') || row.polities?.includes(params.get('state')) || row.surfacePolityIds?.includes(params.get('state')))
    && (!params.get('district') || row.district === params.get('district') || row.jurisdictionGuNames?.includes(params.get('district')))
    && (!params.get('rank') || row.rank === params.get('rank') || row.formalTitleRank === params.get('rank'))
    && (!params.get('holder') || holderOf(row) === params.get('holder')))
  const listed = page(name === 'states' ? territories.states.filter((row) => rows.some((item) => item.id === row.id)) : rows, params)
  return { ...listed, items: listed.items.map(strip) }
}

function tokensRoute(parts, params) {
  if (parts.length === 0) {
    const query = params.get('q')?.trim()
    const state = params.get('state')
    const rows = store.tokenIndex.filter((row) => (!query || row.name.includes(query) || row.personId === query || row.characterId === query) && (!state || row.stateId === state))
    return { schemaVersion: 1, count: rows.length, total: store.tokenIndex.length, loadedAt: store.loadedAt, views: Object.keys(textToImageViews), styles: Object.keys(textToImageStyles), people: rows }
  }
  if (parts.length === 1 && parts[0] === 'health') return { ok: true, count: store.tokens.entries.size, loadedAt: store.loadedAt }
  const [personId, action, ...rest] = parts
  if (!/^person-[0-9]{4}$/.test(personId)) throw new HttpError(400, 'invalid_person_id', 'expected person-XXXX')
  const token = store.tokens.entries.get(personId)
  if (!token) throw new HttpError(404, 'token_not_found', `no design token for ${personId}`)
  if (!action && !rest.length) return { raw: store.tokens.raw.get(personId) }
  if (action === 'prompt' && !rest.length) {
    const view = params.get('view') ?? 'portrait'
    const style = params.get('style') ?? 'yokoyama-b'
    if (!textToImageViews[view]) throw new HttpError(400, 'invalid_view', `view must be one of ${Object.keys(textToImageViews).join(', ')}`)
    if (!textToImageStyles[style]) throw new HttpError(400, 'invalid_style', `style must be one of ${Object.keys(textToImageStyles).join(', ')}`)
    const prompt = composeTextToImage(token, view, style)
    if (params.get('format') === 'text') return { text: `${prompt.prompt}\n\nNegative prompt: ${prompt.negativePrompt}\n` }
    return prompt
  }
  throw new HttpError(404, 'not_found', 'unknown path')
}

function route(request, response) {
  if (request.method === 'OPTIONS') return send(request, response, 204, '')
  if (request.method !== 'GET' && request.method !== 'HEAD') throw new HttpError(405, 'method_not_allowed', 'read-only API')
  const url = new URL(request.url ?? '/', 'http://localhost')
  const prefix = prefixes.find((value) => url.pathname === value || url.pathname.startsWith(`${value}/`))
  if (!prefix) throw new HttpError(404, 'not_found', 'unknown path')
  const [section, ...parts] = url.pathname.slice(prefix.length).split('/').filter(Boolean).map(decodeURIComponent)
  const params = url.searchParams
  if (!section) return send(request, response, 200, { name: '서울:전국 wiki data API', loadedAt: store.loadedAt, openapi: '/wiki/api/openapi.json', sections: ['/wiki/api/people', '/wiki/api/territories', '/wiki/api/portrait-tokens', '/wiki/api/health'] })
  if (section === 'health' && !parts.length) return send(request, response, 200, { ok: true, loadedAt: store.loadedAt, people: store.details.entries.size, tokens: store.tokens.entries.size, states: store.territories.collections.states.rows.length })
  if (section === 'openapi.json' && !parts.length) return send(request, response, 200, openApiDocument(publicOrigin))
  if (section === 'people') {
    const body = peopleRoute(parts, params)
    if (body === null) throw new HttpError(404, 'token_not_found', 'no design token')
    return send(request, response, 200, body)
  }
  if (section === 'territories') return send(request, response, 200, territoriesRoute(parts, params))
  if (section === 'portrait-tokens') {
    const body = tokensRoute(parts, params)
    if (typeof body.raw === 'string') return send(request, response, 200, body.raw)
    if (typeof body.text === 'string') return send(request, response, 200, body.text, { type: 'text/plain; charset=utf-8' })
    return send(request, response, 200, body)
  }
  throw new HttpError(404, 'not_found', 'unknown path')
}

await load()
const reload = () => { load().catch((error) => console.error('WIKI_API_RELOAD_FAILED', error)) }
process.on('SIGHUP', reload)
setInterval(reload, Number(process.env.RELOAD_INTERVAL_MS ?? 60000)).unref()
createServer((request, response) => {
  try { route(request, response) } catch (error) {
    if (error instanceof HttpError) return send(request, response, error.status, { error: { code: error.code, message: error.message } })
    console.error(error)
    send(request, response, 500, { error: { code: 'internal_error', message: 'request failed' } })
  }
}).listen(port, host, () => console.log(`WIKI_API_LISTENING: http://${host}:${port}${prefixes[0]}`))
