import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

test('character draft route is public and stays distinct from issued person details', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/CharacterDraftPage.tsx', import.meta.url), 'utf8')
  const allowlist = JSON.parse(await readFile(new URL('../artifact-allowlist.json', import.meta.url), 'utf8'))
  assert.match(app, /path="\/people\/draft"/u)
  assert.ok(allowlist.routes.some(({ path, disposition }) => path === '/people/draft' && disposition === 'page'))
  assert.match(page, /정본은 바뀌지 않았습니다/u)
  assert.match(page, /초안 내보내기/u)
  assert.doesNotMatch(page, /gurps-cast|sheet-local|issue-person-ids|승인 버튼/u)
})
