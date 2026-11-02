import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { validatePublicationManifest } from '../doc-publishing/publication-manifest.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export const groups = [
  { title: '공식 위키', tiles: [
    { href: 'wiki/', title: '서울:전국 공식 위키', path: '/wiki/', summary: '세계관·십육국·지역·서사·1004명 등장인물. 공식 위키만 비로그인 공개.' },
    { href: 'wiki/states', title: '서울 십육국', path: '/wiki/states', summary: '16개 국가의 기원·중심역·정부형태·수장·형성 인과' },
    { href: 'wiki/people', title: '등장인물 전체', path: '/wiki/people', summary: '정본 인물 1004명 검색·국가·직위·상세 카드 연결' },
  ] },
  { title: '설계 열람', tiles: [
    { href: 'gdd/', title: '게임 설계 문서', path: '/gdd/', summary: '규칙·판정·데이터셋·스키마·설정값·아키텍처를 항목별로 열람한다' },
    { href: 'design-store/', title: 'MDA 설계 문서', path: '/design-store/', summary: 'GDD 설계 시트와 정본 문서를 SQLite에서 렌더한다' },
  ] },
]

export const categoryDestinations = (wikiManifest, gddManifest) => {
  if (wikiManifest.site !== 'wiki' || (gddManifest && gddManifest.site !== 'gdd')) throw new Error('HUB_MANIFEST_SITE')
  validatePublicationManifest(wikiManifest, wikiManifest.documents)
  if (gddManifest) validatePublicationManifest(gddManifest, gddManifest.documents)
  return [
    { title: '위키 문서 분류', tiles: wikiManifest.categories.map((category) => ({
      href: `wiki${category.route}`, title: category.label, path: `/wiki${category.route}`,
      summary: `${category.documentIds.length}개 문서`,
    })) },
    ...(gddManifest ? [{ title: '설계 문서 분류', tiles: gddManifest.categories.map((category) => ({
      href: `gdd${category.route}`, title: category.label, path: `/gdd${category.route}`,
      summary: `${category.documentIds.length}개 문서`,
    })) }] : []),
  ]
}

export const renderHubEntry = async (packageRoot, manifests) => {
  const categories = manifests ? categoryDestinations(manifests.wiki, manifests.gdd) : []
  const require = createRequire(join(packageRoot, 'package.json'))
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const ui = await import(pathToFileURL(join(packageRoot, 'dist/index.js')).href)
  const h = React.createElement
  const sections = [...groups, ...categories].flatMap((group) => [
    h(ui.SectionHeading, { key: `${group.title}-heading`, title: group.title }),
    ...(group.cards ?? []).map((card) => h(ui.ServiceCard, { key: card.href, ...card })),
    ...(group.tiles ?? []).map((tile) => h(ui.ServiceTile, { key: tile.href, ...tile })),
  ])
  const footer = h(React.Fragment, null, '등록 기준 — 자립형 index.html · 실제 산출물만 · 금지 공개 용어 기준은 위키 빌더와 동일. 규약 전문은 저장소 ', h('code', null, 'SERVICES.md'), '.')
  const markup = renderToStaticMarkup(h(ui.SiteShell, { site: 'hub', theme: 'dark', footer, children: [
    h(ui.PageHeader, { key: 'header', kicker: 'JANSEON: SEOUL', title: '서울:전국 — 서비스 인덱스', lead: '붕괴 이후 서울 지하철을 무대로 하는 그랜드 전략 SRPG. 이 주소는 저장소가 내보내는 대화형 표면의 입구다 — 각 서비스는 루트 바로 아래 서브 경로로 열린다.' }),
    ...sections,
  ] }))
  const tokens = await readFile(join(packageRoot, 'dist/tokens.css'), 'utf8')
  const styles = (await readFile(join(packageRoot, 'dist/styles.css'), 'utf8')).replace(/^@import "\.\/tokens\.css";\s*/u, '')
  if (styles.includes('@import')) throw new Error('HUB_CSS_IMPORT_UNEXPECTED')
  return `<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<meta name="description" content="서울:전국 — 서비스 인덱스" />\n<title>서울:전국</title>\n<style>\nbody{margin:0}\n${tokens.trimEnd()}\n${styles.trimEnd()}\n</style>\n</head>\n<body>\n${markup}\n</body>\n</html>\n`
}

const main = async () => {
  const packageIndex = process.argv.indexOf('--package-root')
  const outputIndex = process.argv.indexOf('--output')
  const packageRoot = resolve(packageIndex >= 0 ? process.argv[packageIndex + 1] : join(repoRoot, 'TOOL/shared-web-ui'))
  const output = resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : join(repoRoot, 'index.html'))
  const wikiManifest = JSON.parse(await readFile(join(repoRoot, 'WIKI/src/generated/publication-manifest.json'), 'utf8'))
  const gddManifest = JSON.parse(await readFile(join(repoRoot, 'GDD/viewer/src/generated/publication-manifest.json'), 'utf8'))
  const html = await renderHubEntry(packageRoot, { wiki: wikiManifest, gdd: gddManifest })
  if (process.argv.includes('--check')) {
    if (await readFile(output, 'utf8') !== html) throw new Error(`HUB_ENTRY_STALE:${output}`)
  } else {
    await writeFile(output, html)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
