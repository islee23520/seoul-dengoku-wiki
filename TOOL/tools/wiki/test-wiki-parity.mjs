import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const read = (p) => {
  const abs = resolve(root, p)
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null
}

test('4축 게이트 — 항목 수: 색인 대문 16국 행 + 수장', () => {
  const idx = read('GAME-LOGIC/site/world/index.md')
  assert.ok(idx, '색인 대문이 없다 — mount + build-world-index를 먼저 실행')
  const rows = (idx.match(/^\| \[/gm) || []).length
  assert.ok(rows >= 16, `16국 표 행 부족: ${rows}`)
  const noLeader = (idx.match(/\| - \|/gm) || []).length
  assert.equal(noLeader, 0, `수장 미배정 국가 ${noLeader}개`)
})

test('4축 게이트 — 정리 방식: README 14섹션 + 대문 판 링크', () => {
  const rd = read('LORE/README.md')
  assert.ok(rd, 'LORE/README.md 없음')
  const sections = (rd.match(/^## /gm) || []).length
  assert.ok(sections >= 14, `README 섹션 ${sections} < 14`)
  const idx = read('GAME-LOGIC/site/world/index.md')
  const links = (idx.match(/^- \[[^\]]+\]\(([^)]+\.html)\)/gm) || [])
  assert.ok(links.length >= 13, `대문 문서 판 링크 ${links.length} < 13`)
})

test('4축 게이트 — 규칙: 컴포넌트 존재·등록 + 십육국 표 16행', () => {
  assert.ok(existsSync(resolve(root, 'GAME-LOGIC/site/.vitepress/theme/components/InfoBox.vue')), 'InfoBox.vue 없음')
  assert.ok(existsSync(resolve(root, 'GAME-LOGIC/site/.vitepress/theme/components/NavBox.vue')), 'NavBox.vue 없음')
  const theme = read('GAME-LOGIC/site/.vitepress/theme/index.ts')
  assert.ok(theme && theme.includes('InfoBox') && theme.includes('NavBox'), '테마 등록 없음')
  const ss = read('LORE/factions/Sixteen-States.md')
  const dataRows = (ss.match(/^\|(?!\s*국명|\s*---)[^|]+\|/gm) || []).length
  assert.ok(dataRows >= 16, `십육국 표 행 ${dataRows} < 16`)
  const infoRows = (ss.match(/<InfoRow/g) || []).length
  assert.ok(infoRows >= 5, `정보상자 필드 ${infoRows} < 5`)
})

test('4축 게이트 — 내용물: 이벤트 피드 ≥5', () => {
  const idx = read('GAME-LOGIC/site/world/index.md')
  const feed = idx.slice(idx.indexOf('최신 사건'))
  const items = (feed.match(/^- /gm) || []).length
  assert.ok(items >= 5, `피드 항목 ${items} < 5`)
})
