import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { SOURCE_FILES, buildObservedGeography, generateObservedGeography, readObservedSources } from './seoul-observed-geography.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const input = await readObservedSources()

test('official edition produces only the exact 48 counties and independent 426 memberships', () => {
  const payload = buildObservedGeography(input)
  assert.deepEqual(Object.keys(payload), ['schema', 'sourceEdition', 'baseDate', 'width', 'height', 'sources', 'counties'])
  assert.equal(payload.schema, 'seoul-observed-geography.v1')
  assert.equal(payload.sourceEdition, 'sgis-20250630')
  assert.equal(payload.baseDate, '2025-06-30')
  assert.equal(payload.width, 1000)
  assert.equal(payload.height, 1000)
  const expectedCounties = input.membership.constituencies.map(c => `geography:county:${c.constituencyId}`).sort()
  assert.deepEqual(payload.counties.map(c => c.id).sort(), expectedCounties)
  const expectedMembers = input.membership.constituencies.flatMap(c => c.electoralDongs.map(d => `geography:barony:${d.electoralDongId}`)).sort()
  const slots = payload.counties.flatMap(c => c.slots)
  assert.equal(slots.length, 426)
  assert.deepEqual(slots.map(s => s.id).sort(), expectedMembers)
  assert.equal(new Set(slots.map(s => s.dongId)).size, 426)
  for (const county of payload.counties) {
    assert.deepEqual(Object.keys(county), ['id', 'name', 'path', 'jurisdictionGuNames', 'slots'])
    const independent = input.membership.constituencies.find(c => `geography:county:${c.constituencyId}` === county.id)
    assert.deepEqual(county.slots.map(s => s.id), independent.electoralDongs.map(d => `geography:barony:${d.electoralDongId}`))
    for (const slot of county.slots) {
      assert.deepEqual(Object.keys(slot), ['id', 'name', 'dongId', 'fragmentId'])
      assert.equal(slot.fragmentId, null)
    }
    assert.match(county.path, /^M[\d.,MLZ]+Z$/)
    for (const number of county.path.match(/[\d.]+/g).map(Number)) assert.ok(number >= 0 && number <= 1000)
  }
  const crossGu = payload.counties.find(c => c.jurisdictionGuNames.length === 2)
  assert.deepEqual(crossGu.jurisdictionGuNames, ['중구', '성동구'])
  assert.ok(slots.some(s => s.name === '용신동'))
  assert.ok(!slots.some(s => s.id.includes('electoral-dong:22:11230:신설동')))
  for (const source of payload.sources) {
    assert.deepEqual(Object.keys(source), ['id', 'url', 'sha256'])
    assert.match(source.url, /^https:\/\//)
    assert.match(source.sha256, /^[0-9a-f]{64}$/)
  }
  assert.ok(payload.sources.some(s => s.sha256 === SOURCE_FILES.geometry.sha256))
  assert.doesNotMatch(JSON.stringify(payload), /privatePath|\.omo\/|holder|person|grant|politic|soul|holding|publication|kingdomStatus/i)
  assert.equal(JSON.stringify(payload), JSON.stringify(buildObservedGeography(input)))
})

test('county paths share one geographic-aspect-preserving transform with north up', () => {
  const payload = buildObservedGeography(input)
  const city = input.geometry.features.find(f => f.properties.kind === 'city')
  const points = city.geometry.coordinates.flat(2)
  const west = Math.min(...points.map(p => p[0])), east = Math.max(...points.map(p => p[0]))
  const south = Math.min(...points.map(p => p[1])), north = Math.max(...points.map(p => p[1]))
  const cos = Math.cos((south + north) / 2 * Math.PI / 180)
  const spanX = (east - west) * cos, spanY = north - south
  const scale = 1000 / Math.max(spanX, spanY)
  for (const county of payload.counties) {
    const feature = input.geometry.features.find(f => f.id === county.id)
    const ring = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates[0]
    const rendered = county.path.match(/[\d.]+/g).map(Number)
    for (let i = 0; i < ring.length; i++) {
      assert.ok(Math.abs(rendered[i * 2] - ((1000 - spanX * scale) / 2 + (ring[i][0] - west) * cos * scale)) <= 0.00051)
      assert.ok(Math.abs(rendered[i * 2 + 1] - ((1000 - spanY * scale) / 2 + (north - ring[i][1]) * scale)) <= 0.00051)
    }
  }
})

for (const [name, mutate] of [
  ['missing county', i => i.spatial.counties.pop()],
  ['duplicate county', i => { i.spatial.counties[1] = i.spatial.counties[0] }],
  ['missing independent county', i => i.membership.constituencies.pop()],
  ['duplicate independent county', i => { i.membership.constituencies[1] = i.membership.constituencies[0] }],
  ['missing dong', i => i.spatial.dongs.pop()],
  ['duplicate dong ID', i => { i.spatial.dongs[1].dongId = i.spatial.dongs[0].dongId }],
  ['duplicate electoral dong ID', i => { i.spatial.dongs[1].electoralDongId = i.spatial.dongs[0].electoralDongId }],
  ['duplicate official dong code', i => { i.spatial.dongs[1].officialCode = i.spatial.dongs[0].officialCode }],
  ['duplicate dong membership', i => { i.membership.constituencies[0].electoralDongs[1] = i.membership.constituencies[0].electoralDongs[0] }],
  ['missing independent member', i => i.membership.constituencies[0].electoralDongs.pop()],
  ['wrong independent county join', i => { const a = i.membership.constituencies[0].electoralDongs; const b = i.membership.constituencies[1].electoralDongs; [a[0], b[0]] = [b[0], a[0]] }],
  ['wrong gu join', i => { i.membership.constituencies[0].electoralDongs[0].guId = '11140' }],
  ['wrong independent dong name', i => { i.membership.constituencies[0].electoralDongs[0].normalizedLookupName = 'wrong-dong' }],
  ['wrong independent gu name', i => { i.membership.gu[0].name = 'wrong-gu' }],
  ['missing spatial gu', i => i.spatial.gu.pop()],
  ['missing dong kind', i => { delete i.spatial.dongs[0].kind }],
  ['missing county edition', i => { delete i.spatial.counties[0].sourceEdition }],
  ['wrong county code set', i => { i.spatial.counties[0].officialDongCodes[0] = 'not-a-dong' }],
  ['missing geometry', i => i.geometry.features.pop()],
  ['duplicate geometry ID', i => { i.geometry.features[1].id = i.geometry.features[0].id }],
  ['wrong feature join', i => { i.geometry.features[0].properties.countyTitleId = i.spatial.counties[1].geometryId }],
  ['non-polygon geometry', i => { i.geometry.features[0].geometry.type = 'Point' }],
  ['wrong edition', i => { i.spatial.edition = 'current-2026' }],
  ['unsupported fragment', i => { i.membership.constituencies[0].electoralDongs[0].fragmentId = 'invented' }],
  ['private source URL', i => { i.spatial.archive.url = '.omo/private/archive.zip' }],
  ['missing provenance hash', i => { delete i.spatial.sources[0].sha256 }],
  ['duplicate source ID', i => { i.spatial.sources[1].id = i.spatial.sources[0].id }],
  ['unclosed ring', i => { i.geometry.features[0].geometry.coordinates[0][0][0] += 0.01 }],
]) test(`fails closed for ${name}`, () => {
  const changed = structuredClone(input)
  mutate(changed)
  assert.throws(() => buildObservedGeography(changed), /Observed geography:/)
})

test('non-geographic source fields cannot enter public output', () => {
  const changed = structuredClone(input)
  changed.spatial.persons = [{ id: 'private-person' }]
  changed.spatial.counties[0].holderPersonId = 'private-person'
  changed.spatial.dongs[0].soul = 'private-soul'
  changed.membership.constituencies[0].politics = 'private-politics'
  changed.membership.constituencies[0].electoralDongs[0].grant = 'private-grant'
  changed.spatial.sources[0].privatePath = '.omo/private/source'
  changed.geometry.features[0].properties.holder = 'private-holder'
  assert.deepEqual(buildObservedGeography(changed), buildObservedGeography(input))
})

test('generator writes deterministic bytes and rejects corrupted source bytes before output', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'seoul-observed-'))
  try {
    for (const source of Object.values(SOURCE_FILES)) {
      const target = resolve(directory, source.path)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, await readFile(resolve(root, source.path)))
    }
    const expected = buildObservedGeography(input)
    assert.deepEqual(await generateObservedGeography(directory), expected)
    const outputPath = resolve(directory, 'public/seoul-observed-geography.json')
    const bytes = await readFile(outputPath, 'utf8')
    assert.equal(bytes, JSON.stringify(expected) + '\n')
    await generateObservedGeography(directory)
    assert.equal(await readFile(outputPath, 'utf8'), bytes)
    for (const [kind, source] of Object.entries(SOURCE_FILES)) {
      const original = await readFile(resolve(root, source.path))
      await writeFile(resolve(directory, source.path), Buffer.concat([original, Buffer.from(' ')]))
      await assert.rejects(generateObservedGeography(directory), new RegExp(`${kind} source SHA-256 mismatch`))
      assert.equal(await readFile(outputPath, 'utf8'), bytes)
      await writeFile(resolve(directory, source.path), original)
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
