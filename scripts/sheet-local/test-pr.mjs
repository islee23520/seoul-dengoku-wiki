import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import test from 'node:test'
import { ROOT } from '../gurps-cast.mjs'
import { createDraftStore } from './drafts.mjs'
import { preparePr } from './pr.mjs'

test('PR preview publishes only draft fields and never mutates git', async (t) => {
  await mkdir(join(ROOT, '.omo'), { recursive: true })
  const root = await mkdtemp(join(ROOT, '.omo/sheet-pr-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = createDraftStore({ root })
  const draft = await store.create({ fields: { name: '검토 예시', affiliation: '무소속', background: '', livelihood: '전령', backstory: '역을 지난다.' } })
  const clean = join(root, 'checkout')
  const added = spawnSync('git', ['-C', ROOT, 'worktree', 'add', '--detach', clean, 'HEAD'], { encoding: 'utf8' })
  assert.equal(added.status, 0, added.stderr)
  t.after(() => spawnSync('git', ['-C', ROOT, 'worktree', 'remove', '--force', clean], { encoding: 'utf8' }))
  const before = spawnSync('git', ['-C', clean, 'status', '--porcelain'], { encoding: 'utf8' }).stdout
  const output = spawnSync(process.execPath, [new URL('./pr.mjs', import.meta.url).pathname, draft.id, '--worktree', clean], { cwd: ROOT, env: { ...process.env, SEOUL_SHEET_DRAFT_DIR: root }, encoding: 'utf8' })
  assert.equal(output.status, 0, output.stderr)
  const preview = JSON.parse(output.stdout)
  assert.equal(preview.person, null)
  assert.equal(preview.fields.name, '검토 예시')
  assert.match(preview.path, /^docs\/editorial\/character-drafts\/[0-9a-f-]+\.json$/u)
  assert.equal(spawnSync('git', ['-C', clean, 'status', '--porcelain'], { encoding: 'utf8' }).stdout, before)
  const proposed = { schema: 'seoul-character-review-proposal.v1', base: null, fields: preview.fields, provenance: preview.provenance, sourceHead: spawnSync('git', ['-C', clean, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim() }
  assert.doesNotMatch(JSON.stringify(proposed), /GURPS|skills|attributes|cp|approvedBy/u)
  await assert.rejects(readFile(join(ROOT, preview.path), 'utf8'), { code: 'ENOENT' })
})

test('explicit draft PR submission stages only the public proposal and calls GitHub once', async (t) => {
  await mkdir(join(ROOT, '.omo'), { recursive: true })
  const root = await mkdtemp(join(ROOT, '.omo/sheet-pr-submit-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const worktree = join(root, 'checkout')
  const added = spawnSync('git', ['-C', ROOT, 'worktree', 'add', '--detach', worktree, 'HEAD'], { encoding: 'utf8' })
  assert.equal(added.status, 0, added.stderr)
  t.after(() => spawnSync('git', ['-C', ROOT, 'worktree', 'remove', '--force', worktree], { encoding: 'utf8' }))
  const store = createDraftStore({ root: join(root, 'drafts') })
  const draft = await store.create({ fields: { name: '검토 예시', affiliation: '무소속', background: '', livelihood: '전령', backstory: '역을 지난다.' } })
  const calls = []
  const git = (binary, args) => {
    calls.push([binary, args.slice(2)])
    if (args.includes('status')) return ''
    if (args.includes('rev-parse')) return 'a'.repeat(40)
    return ''
  }
  const gh = (binary, args) => { calls.push([binary, args]); return 'https://github.com/islee23520/seoul-dengoku-wiki/pull/999\n' }
  await assert.rejects(preparePr(store, draft.id, { worktree, publish: true, realPerson: true, git, gh }), /동의 기록/u)
  assert.equal(calls.length, 0)
  const result = await preparePr(store, draft.id, { worktree, publish: true, realPerson: false, git, gh })
  assert.equal(result.url, 'https://github.com/islee23520/seoul-dengoku-wiki/pull/999')
  assert.deepEqual(calls.map(([binary, args]) => binary === 'gh' ? 'pr' : args[0]), ['status', 'rev-parse', 'switch', 'add', 'commit', 'push', 'pr'])
  const proposal = JSON.parse(await readFile(join(worktree, result.path), 'utf8'))
  assert.equal(proposal.fields.name, '검토 예시')
  assert.deepEqual(Object.keys(proposal).sort(), ['base', 'fields', 'provenance', 'schema', 'sourceHead'])
  assert.doesNotMatch(JSON.stringify(proposal), /GURPS|skills|attributes|cp|approvedBy/u)
})
