import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { PassThrough } from 'node:stream'
import { once } from 'node:events'
import { mkdtemp, readFile, readdir, rm, symlink, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const published = join(root, 'public')
const opening = JSON.parse(await readFile(join(published, 'opening-territories.json'), 'utf8'))
const rights = JSON.parse(await readFile(join(published, 'confirmed-person-holdings.json'), 'utf8'))

async function start(t, dataDir = published, invalid = false) {
  const output = new PassThrough()
  let log = ''
  let timer
  let rejectReady
  // Subscribe before spawning: readiness is the server's listen event, never a timed poll.
  const ready = new Promise((resolveReady, reject) => {
    rejectReady = reject
    output.on('data', chunk => {
      log += chunk
      const match = log.match(/WIKI_API_LISTENING: (http:\/\/[^\s]+)/)
      if (match) resolveReady(match[1])
    })
    timer = setTimeout(() => reject(new Error(`API readiness timeout: ${log}`)), 20000)
  })
  const child = spawn(process.execPath, ['server/wiki-api.mjs'], {
    cwd: root, env: { ...process.env, DATA_DIR: dataDir, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.pipe(output, { end: false })
  child.stderr.pipe(output, { end: false })
  const ended = once(child, 'exit')
  child.on('error', rejectReady)
  child.on('exit', (code, signal) => rejectReady(new Error(`API exited ${code}/${signal}: ${log}`)))
  t.after(async () => {
    clearTimeout(timer)
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
    await ended
    output.destroy()
  })
  if (invalid) {
    await assert.rejects(ready, /E_DATA_GEOGRAPHY/)
    clearTimeout(timer)
    const [code] = await ended
    assert.notEqual(code, 0)
    assert.doesNotMatch(log, /WIKI_API_LISTENING/)
    return
  }
  const base = await ready.finally(() => clearTimeout(timer))
  return async (path, status = 200, options) => {
    const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(10000) })
    assert.equal(response.status, status, `${path}: ${await response.clone().text()}`)
    return response
  }
}

test('published Seoul API starts without excluded geography and preserves public contracts', { timeout: 40000 }, async t => {
  await assert.rejects(access(join(published, 'seoul-observed-geography.json')), { code: 'ENOENT' })
  const get = await start(t)
  const json = async path => (await get(path)).json()
  const health = await json('/health')
  assert.equal(health.people, 1022)
  assert.equal(health.tokens, 25)
  const people = await json('/people?limit=2000')
  assert.equal(people.total, 1022)
  assert.equal(people.items.length, 1022)
  const expectedCounties = opening.geography.titles.filter(title => title.rank === 'county')
  const counties = await json('/territories/counties?limit=2000&rank=county')
  assert.equal(counties.total, 48)
  assert.deepEqual(counties.items, expectedCounties.map(({ path, ...county }) => county))
  assert.ok(counties.items.every(county => county.holderPersonId === null))
  assert.deepEqual((await json('/territories/counties?geometry=1&limit=2000')).items, expectedCounties)
  assert.deepEqual(await json(`/territories/counties/${encodeURIComponent(expectedCounties[0].id)}`), expectedCounties[0])
  assert.deepEqual((await json('/territories/titles?limit=2000')).items, rights.titles)
  const personRights = await json('/people/K001/holdings')
  assert.deepEqual(personRights.titles, rights.titles.filter(title => title.holderPersonId === 'K001'))
  assert.ok(personRights.titles.every(title => !expectedCounties.some(county => county.id === title.id)))
  assert.deepEqual(personRights.holdings, rights.holdings.filter(row => row.holderPersonId === 'K001' || row.directLiegePersonId === 'K001'))
  const sources = await json('/territories/sources')
  assert.deepEqual(sources, {
    geographySource: 'opening-territories.json#geography.titles',
    spatialDate: opening.geography.spatialDate, currentDate: opening.geography.currentDate,
    attribution: opening.attribution, populationAttribution: opening.populationAttribution,
    landmarkAttribution: opening.landmarkAttribution,
  })
  const overview = await json('/territories')
  assert.equal(overview.counts.counties, 48)
  for (const key of ['spatialDate', 'currentDate', 'geographySource']) assert.equal(overview[key], sources[key])
  for (const key of ['geographySchema', 'geographySourceEdition', 'geographyBaseDate']) assert.ok(!(key in overview))
  const schema = await json('/openapi.json')
  assert.ok(schema.paths['/territories/sources'])
  const tokens = await json('/portrait-tokens')
  assert.equal(tokens.total, 25)
  assert.equal(tokens.people.length, 25)
  const tokenId = tokens.people[0].personId
  assert.deepEqual(await json(`/portrait-tokens/${tokenId}`), JSON.parse(await readFile(join(published, 'portrait-tokens', `${tokenId}.json`), 'utf8')))
  const prompt = await json(`/portrait-tokens/${tokenId}/prompt`)
  assert.equal(prompt.personId, tokenId)
  assert.equal(prompt.model, 'gpt-image-2.5')
  assert.ok(prompt.prompt.length > 0)
  const missingToken = people.items.find(person => !tokens.people.some(token => token.personId === person.personId))
  await get(`/portrait-tokens/${missingToken.personId}`, 404)
  await get(`/people/${missingToken.personId}/portrait-token`, 404)
  for (const id of ['unknown', 'geography:county:busan-constituency:outside', rights.titles[0].id]) {
    const response = await get(`/territories/counties/${encodeURIComponent(id)}`, 404)
    assert.equal((await response.json()).error.code, 'territory_not_found')
  }
  for (const path of ['/lore/editorial/Soul-Assignments.json', '/../../lore/editorial/Soul-Assignments.json', '/territories/seoul-observed-geography.json', '/person-details/person-0001.json', '/%2e%2e%2flore%2feditorial%2fSoul-Assignments.json']) await get(path, 404)
  await get('/people', 405, { method: 'POST' })
  const response = await get('/health')
  await get('/health', 304, { headers: { 'if-none-match': response.headers.get('etag') } })
  await get('/health', 200, { method: 'HEAD' })
  assert.deepEqual(await (await fetch(`${new URL(response.url).origin}/api/health`)).json(), health)
})

test('missing and invalid admitted geography fail before HTTP listening', { timeout: 40000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'wiki-api-seoul-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  for (const name of ['person-details', 'portrait-tokens', 'confirmed-person-holdings.json', 'territorial-scale.json']) {
    await symlink(join(published, name), join(directory, name))
  }
  for (const [name, geography] of [
    ['missing', undefined],
    ['empty', { ...opening.geography, titles: [] }],
    ['outside', { ...opening.geography, titles: opening.geography.titles.map(title => title.rank === 'county' ? { ...title, id: title.id.replace('seoul-constituency:', 'busan-constituency:') } : title) }],
    ['undated', { ...opening.geography, spatialDate: null }],
  ]) {
    await t.test(name, async subtest => {
      await writeFile(join(directory, 'opening-territories.json'), JSON.stringify({ ...opening, geography }))
      await start(subtest, directory, true)
    })
  }
  assert.equal((await readdir(directory)).includes('seoul-observed-geography.json'), false)
})
