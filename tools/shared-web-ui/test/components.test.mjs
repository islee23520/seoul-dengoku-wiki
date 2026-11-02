import assert from 'node:assert/strict'
import { test } from 'vitest'
import { readFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as ui from '../dist/index.js'

const render = node => renderToStaticMarkup(node)
const categories = [{ id: 'history', title: '연표', href: '/wiki/category/history', documents: [
  { id: 'opening', title: '개막', href: '/wiki/world/opening' },
  { id: 'later', title: '이후', href: '/wiki/world/later' },
] }, { id: 'rules', title: '규칙', href: '/gdd/category/rules', documents: [] }]

test('the contract exports fifteen named components and the breakpoint token', () => {
  const names = ['SiteShell', 'PageHeader', 'SectionHeading', 'ServiceCard', 'ServiceTile', 'Chip', 'ChipRow', 'CategoryTree', 'Breadcrumbs', 'TableOfContents', 'TableViewport', 'DocumentList', 'DocumentListRow', 'QueryControl', 'StateNotice']
  assert.deepEqual(Object.keys(ui).sort(), [...names, 'suiTokens'].sort())
  assert.deepEqual(ui.suiTokens.bp, { sm: 640, md: 768, lg: 1024 })
})

test('document and hub shells expose the appropriate landmarks and theme identity', () => {
  const navigation = React.createElement(ui.CategoryTree, { items: categories, currentHref: '/wiki/world/opening', emptyLabel: '문서 없음' })
  const doc = render(React.createElement(ui.SiteShell, { brand: '서울:전국', homeHref: '/wiki/', site: 'wiki', navLabel: '문서 분류', menuLabel: '전체 메뉴', skipLabel: '본문으로 건너뛰기', navigation, children: React.createElement('p', null, '본문') }))
  assert.match(doc, /data-sui-theme="light" data-sui-site="wiki"/)
  assert.match(doc, /href="#main-content"/)
  assert.equal((doc.match(/<main\b/g) ?? []).length, 1)
  assert.match(doc, /<summary>전체 메뉴<\/summary>/)
  assert.match(doc, /aria-expanded="true" aria-controls="[^"]+"/)
  assert.match(doc, /aria-current="page" data-state="current">개막<\/a>/)
  assert.match(doc, /data-state="empty">문서 없음/)
  const hub = render(React.createElement(ui.SiteShell, { site: 'hub', theme: 'dark', children: '인덱스' }))
  assert.match(hub, /sui-shell--index" data-sui-theme="dark" data-sui-site="hub"/)
  assert.doesNotMatch(hub, /sui-sidebar/)
})

test('hub primitives preserve supplied destinations and structured labels', () => {
  const header = render(React.createElement(ui.PageHeader, { title: '서비스 인덱스', kicker: 'JANSEON: SEOUL', lead: '서비스', badge: '정본' }))
  assert.match(header, /<h1>서비스 인덱스<\/h1>/)
  assert.match(header, /sui-kicker/)
  assert.match(render(React.createElement(ui.SectionHeading, { title: '서비스', href: '/wiki/', moreLabel: '더 보기' })), /<h2>서비스<\/h2>/)
  assert.match(render(React.createElement(ui.ServiceCard, { href: '/play/', title: '플레이', path: '/play/', summary: '코어 루프', image: { src: '/cover.png', alt: '표지' } })), /width="220" height="124"/)
  assert.match(render(React.createElement(ui.ServiceTile, { href: '/gdd/', title: '설계', path: '/gdd/' })), /href="\/gdd\/"/)
  assert.match(render(React.createElement(ui.ChipRow, { children: React.createElement(ui.Chip, { label: '규약', code: 'SERVICES.md' }) })), /<code>SERVICES.md<\/code>/)
})

test('discovery primitives expose current links, labels, and results', () => {
  assert.match(render(React.createElement(ui.Breadcrumbs, { label: '현재 위치', items: [{ title: '위키', href: '/wiki/' }, { title: '개막' }] })), /aria-current="page">개막/)
  assert.match(render(React.createElement(ui.TableOfContents, { label: '목차', items: [{ id: 'intro', title: '도입' }], currentId: 'intro' })), /href="#intro" aria-current="location" data-state="current"/)
  assert.match(render(React.createElement(ui.DocumentList, { items: categories[0].documents, currentHref: '/wiki/world/opening', emptyLabel: '문서 없음' })), /aria-current="page" data-state="current"/)
  assert.match(render(React.createElement(ui.DocumentListRow, { document: categories[0].documents[0] })), /<strong>개막<\/strong>/)
  assert.match(render(React.createElement(ui.QueryControl, { id: 'documents', label: '문서 검색', value: '서울', onChange() {}, resultCount: 2, countLabel: n => `${n}개 결과` })), /<output aria-live="polite" for="documents">2개 결과<\/output>/)
  assert.match(render(React.createElement(ui.TableViewport, { label: '역 목록' }, React.createElement('table', null))), /role="region" aria-label="역 목록" tabindex="0"/)
  assert.match(render(React.createElement(ui.StateNotice, { state: 'not-found', message: '문서 없음', action: { href: '/wiki/', label: '돌아가기' } })), /data-state="not-found" role="status"/)
})

test('tokens carry light, dark, site slots and narrow layout rules', async () => {
  const tokens = await readFile(new URL('../dist/tokens.css', import.meta.url), 'utf8')
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8')
  for (const name of ['canvas', 'surface', 'nav-ink', 'ink', 'accent', 'accent-strong', 'accent-soft', 'signal', 'focus', 'table-head', 'code-ink']) assert.match(tokens, new RegExp(`--sui-color-${name}:`))
  assert.match(tokens, /\[data-sui-theme="dark"\]/)
  assert.match(tokens, /\[data-sui-site="gdd"\]\[data-sui-theme="light"\]/)
  assert.match(css, /@media \(max-width: 767px\)/)
  assert.match(css, /@media \(max-width: 639px\)/)
  assert.match(css, /\.sui-table-viewport \{[^}]*overflow-x: auto/)
  assert.doesNotMatch(css, /\.sdu-/)
})
