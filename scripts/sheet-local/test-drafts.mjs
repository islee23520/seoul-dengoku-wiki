import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { request as httpRequest } from 'node:http'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { calculateSheet, createDraftStore } from './drafts.mjs'
import { ROOT } from '../gurps-cast.mjs'

const exampleFields = { name: '견본 인물', affiliation: '무소속', background: '역 구내 근무', livelihood: '전령', backstory: '통행을 맡는다.' }

test('calculation matches the approved skill cost and secondary rules', () => {
  const result = calculateSheet({ fields: exampleFields, attributes: { ST: 11, DX: 12, IQ: 13, HT: 12 }, skills: [{ name: 'Observation', attr: 'Per', difficulty: 'A', cp: 4 }] })
  assert.equal(result.secondary.Per, 13)
  assert.equal(result.skills[0].level, 14)
  assert.deepEqual(result.cp, { attributes: 130, advantages: 0, disadvantages: 0, skills: 4, spent: 134, unspent: 0, total: 134 })
  assert.equal(result.band, '숙련자')
})

test('draft edits preserve approved files and enforce revision conflicts', async (t) => {
  await mkdir(join(ROOT, '.omo'), { recursive: true })
  const root = await mkdtemp(join(ROOT, '.omo/sheet-draft-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const approved = join(ROOT, 'lore/name-pools/person-id-registry.json')
  const before = createHash('sha256').update(await readFile(approved)).digest('hex')
  const store = createDraftStore({ root })
  const choices = await store.choices()
  assert.ok(choices.affiliations.includes('수문국'))
  assert.ok(choices.livelihoods.includes('경비·순찰'))
  const draft = await store.create({ fields: exampleFields })
  assert.equal(draft.revision, 1)
  const updated = await store.edit(draft.id, 1, { fields: { backstory: '배급 차례를 기록한다.' } })
  assert.equal(updated.revision, 2)
  await assert.rejects(store.edit(draft.id, 1, { fields: { name: '나중 이름' } }), { code: 'DRAFT_CONFLICT' })
  const simultaneous = await Promise.allSettled([
    store.edit(draft.id, 2, { fields: { backstory: '첫 제안' } }),
    store.edit(draft.id, 2, { fields: { backstory: '두 번째 제안' } }),
  ])
  assert.deepEqual(simultaneous.map((result) => result.status), ['fulfilled', 'rejected'])
  assert.equal((await store.get(draft.id)).revision, 3)
  assert.equal((await store.export(draft.id)).draft.fields.backstory, '첫 제안')
  assert.equal(createHash('sha256').update(await readFile(approved)).digest('hex'), before)
})

test('stdio MCP lifecycle and tools roundtrip a candidate without canon write', async (t) => {
  await mkdir(join(ROOT, '.omo'), { recursive: true })
  const root = await mkdtemp(join(ROOT, '.omo/sheet-mcp-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const child = spawn(process.execPath, [new URL('./mcp.mjs', import.meta.url).pathname], { cwd: ROOT, env: { ...process.env, SEOUL_SHEET_DRAFT_DIR: root }, stdio: ['pipe', 'pipe', 'pipe'] })
  t.after(() => child.kill())
  const lines = createInterface({ input: child.stdout })
  const messages = []
  const waiting = new Map()
  lines.on('line', (line) => { const message = JSON.parse(line); messages.push(message); waiting.get(message.id)?.(message); waiting.delete(message.id) })
  const request = (id, method, params) => new Promise((resolve) => { waiting.set(id, resolve); child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`) })
  const init = await request(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } })
  assert.equal(init.result.serverInfo.name, 'seoul-character-drafts')
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`)
  const listed = await request(2, 'tools/list', {})
  assert.ok(listed.result.tools.some((entry) => entry.name === 'create_draft'))
  const created = await request(3, 'tools/call', { name: 'create_draft', arguments: { fields: exampleFields } })
  const draft = JSON.parse(created.result.content[0].text)
  assert.equal(draft.fields.name, '견본 인물')
  const edit = await request(4, 'tools/call', { name: 'propose_edit', arguments: { id: draft.id, revision: 1, patch: { attributes: { IQ: 11 } } } })
  assert.equal(JSON.parse(edit.result.content[0].text).revision, 2)
  const exported = await request(5, 'tools/call', { name: 'export_draft', arguments: { id: draft.id } })
  assert.equal(JSON.parse(exported.result.content[0].text).validation.calculation.cp.total, 75)
  assert.deepEqual(messages.map((message) => message.id), [1, 2, 3, 4, 5])
  child.stdin.end()
})

test('localhost MCP rejects foreign hosts and origins before any draft edit', async (t) => {
  await mkdir(join(ROOT, '.omo'), { recursive: true })
  const root = await mkdtemp(join(ROOT, '.omo/sheet-http-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const token = 'local-test-token-abcdefghijklmnopqrstuvwxyz'
  const child = spawn(process.execPath, [new URL('./http.mjs', import.meta.url).pathname], { cwd: ROOT, env: { ...process.env, SEOUL_SHEET_DRAFT_DIR: root, SEOUL_SHEET_MCP_TOKEN: token, SEOUL_SHEET_MCP_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] })
  t.after(() => child.kill())
  const stdout = createInterface({ input: child.stdout })
  const ready = new Promise((resolve) => stdout.once('line', (line) => resolve(line)))
  const endpoint = (await ready).replace(/^MCP_READY /u, '')
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } } })
  const headers = { authorization: `Bearer ${token}`, accept: 'application/json, text/event-stream', 'content-type': 'application/json' }
  const valid = await fetch(endpoint, { method: 'POST', headers, body })
  assert.equal(valid.status, 200)
  assert.equal((await valid.json()).result.serverInfo.name, 'seoul-character-drafts')
  assert.equal((await fetch(endpoint, { method: 'POST', headers: { ...headers, origin: 'https://bad.example' }, body })).status, 403)
  const foreignHostStatus = await new Promise((resolve, reject) => {
    const req = httpRequest(endpoint, { method: 'POST', headers: { ...headers, host: 'bad.example' } }, (res) => {
      res.resume()
      res.once('end', () => resolve(res.statusCode))
    })
    req.once('error', reject)
    req.end(body)
  })
  assert.equal(foreignHostStatus, 403)
  assert.equal((await fetch(endpoint, { method: 'POST', headers: { ...headers, authorization: 'Bearer wrong' }, body })).status, 401)
})

test('public draft imports through the stable person route without issuing an ID', async (t) => {
  await mkdir(join(ROOT, '.omo'), { recursive: true })
  const root = await mkdtemp(join(ROOT, '.omo/sheet-import-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = createDraftStore({ root })
  const published = { schema: 'seoul-character-draft.v1', revision: 3, base: { personId: 'person-1019', sha256: '' }, fields: { ...exampleFields, name: '박성수' }, provenance: { background: { kind: 'user' } } }
  const imported = await store.importDraft(published)
  assert.equal(imported.base.personId, 'K1019')
  assert.equal(imported.fields.name, '박성수')
  assert.equal(imported.validation.valid, true)
  await assert.rejects(store.importDraft({ ...published, fields: { ...published.fields, name: '다른 인물' } }), { code: 'DRAFT_IDENTITY' })
  await assert.rejects(store.importDraft({ ...published, base: { personId: 'person-1019', sha256: 'stale-hash' } }), { code: 'DRAFT_CONFLICT' })
  assert.equal((await store.list()).length, 1)
})
