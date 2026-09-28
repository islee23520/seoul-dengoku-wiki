import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'
import { ROOT } from '../gurps-cast.mjs'
import { createDraftStore } from './drafts.mjs'
import { issueBody, submitIssue } from './submit.mjs'

test('automatic issue submission sends one review request only after classification', async (t) => {
  await mkdir(join(ROOT, '.omo'), { recursive: true })
  const root = await mkdtemp(join(ROOT, '.omo/sheet-issue-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = createDraftStore({ root })
  const draft = await store.create({ fields: { name: '검토 예시', affiliation: '무소속', background: '역 구내 근무', livelihood: '전령', backstory: '역을 지난다.' } })
  let calls = 0
  const fakeGh = (binary, args) => {
    calls++
    assert.equal(binary, 'gh')
    assert.deepEqual(args.slice(0, 4), ['issue', 'create', '-R', 'islee23520/seoul-dengoku-wiki'])
    assert.ok(args.includes('--body'))
    assert.match(args[args.indexOf('--body') + 1], /검토 예시/u)
    return 'https://github.com/islee23520/seoul-dengoku-wiki/issues/999\n'
  }
  await assert.rejects(submitIssue(store, draft.id, {}, fakeGh), { code: 'PERSON_CLASSIFICATION' })
  await assert.rejects(submitIssue(store, draft.id, { realPerson: true }, fakeGh), { code: 'PERSON_CONSENT' })
  assert.equal(calls, 0)
  const result = await submitIssue(store, draft.id, { realPerson: false }, fakeGh)
  assert.equal(result.url, 'https://github.com/islee23520/seoul-dengoku-wiki/issues/999')
  assert.equal(calls, 1)
  assert.doesNotMatch(issueBody(draft), /GURPS|skills|attributes|cp/u)
})
