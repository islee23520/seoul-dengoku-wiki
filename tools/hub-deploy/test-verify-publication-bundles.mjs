import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { verifyPublicationBundles } from './verify-publication-bundles.mjs'

test('bundle gate rejects empty category membership despite intact article routes', async () => {
  const evidence = resolve(import.meta.dirname, '../../../.omo/evidence/shared-doc-publishing')
  await mkdir(evidence, { recursive: true })
  const root = await mkdtemp(join(evidence, 'publication-bundle-'))
  try {
  const wiki = { schemaVersion: 1, site: 'wiki', categories: [{ id: 'overview', label: '개요', route: '/categories/overview', documentIds: ['one'] }], documents: [{ source: 'lore/One.json', id: 'one', title: '하나', summary: '', categoryIds: ['overview'], route: '/world/One', contentRef: 'src/generated/world/One.json' }] }
  const gdd = { schemaVersion: 1, site: 'gdd', categories: [{ id: 'rules', label: '규칙', route: '/documents?category=rules', documentIds: ['two'] }], documents: [{ source: 'canon/locales/ko-KR/rules/two.json', id: 'two', title: '둘', summary: '', categoryIds: ['rules'], route: '/rules/Two', contentRef: 'src/content/rules/Two.md' }] }
  for (const path of ['WIKI/src/generated', 'WIKI/dist/assets', 'GDD/viewer/src/generated', 'GDD/viewer/dist/assets']) await mkdir(join(root, path), { recursive: true })
  await writeFile(join(root, 'WIKI/src/generated/publication-manifest.json'), JSON.stringify(wiki))
  await writeFile(join(root, 'GDD/viewer/src/generated/publication-manifest.json'), JSON.stringify(gdd))
  await writeFile(join(root, 'WIKI/src/generated/wikiCatalog.ts'), "{ route: '/world/One' }")
  await writeFile(join(root, 'GDD/viewer/src/generated/gddCatalog.ts'), 'export const gddCatalog = [{"route":"/rules/Two"}] as const')
  const wikiEntry = 'var ir={categories:[{id:`overview`,documents:[{route:`/world/One`}]}],uncategorized:[]},ar=ir.categories; const path=e=>`/categories/${e.id}`;'
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), wikiEntry)
  await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), 'var Bf={schemaVersion:1,site:`gdd`,categories:[{id:`rules`,documentIds:[`two`]}],documents:[]}; const nav=`/documents?category=`,route=`/rules/Two`;')
  assert.equal(await verifyPublicationBundles(root), true)
  assert.equal(await verifyPublicationBundles(root, ['wiki']), true)
  await assert.rejects(verifyPublicationBundles(root, ['retired']), /unknown publication site/)
  const koreanCatalog = "{ route: '/world/One' }"
  await writeFile(join(root, 'WIKI/src/generated/wikiCatalog.ts'), `${koreanCatalog}\nexport const wikiEnglishCatalog = [{ route: '/en/world/One' }]`)
  assert.equal(await verifyPublicationBundles(root), true)
  await writeFile(join(root, 'WIKI/src/generated/wikiCatalog.ts'), `${koreanCatalog}\nexport const wikiEnglishCatalog = [{ route: '/en/world/Missing' }]`)
  await assert.rejects(verifyPublicationBundles(root), /wiki: English route without a published document \/en\/world\/Missing/)
  await writeFile(join(root, 'WIKI/src/generated/wikiCatalog.ts'), koreanCatalog)
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), wikiEntry.replace('ir={', 'xz$={').replace('ar=ir.categories', 'qq=xz$.categories'))
  assert.equal(await verifyPublicationBundles(root), true)
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), wikiEntry)
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), wikiEntry.replace('documents:[{route:`/world/One`}]', 'documents:[]'))
  await assert.rejects(verifyPublicationBundles(root), /wiki: category membership overview/)
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), wikiEntry)
  await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), 'var Bf={schemaVersion:1,site:`gdd`,categories:[{id:`rules`,documentIds:[]}],documents:[]}; const nav=`/documents?category=`,route=`/rules/Two`;')
  await assert.rejects(verifyPublicationBundles(root), /gdd: category membership rules/)
  // The emitted catalog no longer has a following alias assignment.
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), wikiEntry.replace(',ar=ir.categories', ''))
  assert.equal(await verifyPublicationBundles(root, ['wiki']), true)
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), 'import "./category-data.js";')
  await writeFile(join(root, 'WIKI/dist/assets/category-data.js'), wikiEntry.replace(',ar=ir.categories', ''))
  assert.equal(await verifyPublicationBundles(root, ['wiki']), true)
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), 'import("./category-data.js");')
  assert.equal(await verifyPublicationBundles(root, ['wiki']), true)
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), 'const route=`/world/One`;')
  await assert.rejects(verifyPublicationBundles(root, ['wiki']), /bundled category catalog missing/)
  await rm(join(root, 'WIKI/dist/assets/category-data.js'))
  for (const [before, after, error] of [
    ['categories:[{id:', 'categories:[]}; const unused={id:', /category count/],
    ['id:`overview`', 'id:`wrong`', /missing category overview/],
    ['route:`/world/One`', 'route:`/world/Wrong`', /category membership overview/],
    ['/categories/', '/removed/', /category navigation/],
    ['documents:[{route:`/world/One`}]', 'documents:(()=>{throw Error("must not execute")})()', /nonliteral bundled category data/],
  ]) {
    const mutation = before.startsWith('categories:') ? 'var empty={categories:[],uncategorized:[]};const nav=e=>`/categories/`;' : wikiEntry.replace(before, after)
    await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), mutation)
    await assert.rejects(verifyPublicationBundles(root, ['wiki']), error)
  }
  await writeFile(join(root, 'WIKI/dist/assets/index-a.js'), wikiEntry)
  // Minified names change with the bundle, and a label may contain a brace: the GDD catalog is still found.
  await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), 'var q$9={schemaVersion:1,site:`gdd`,categories:[{id:`rules`,label:`규칙 }]`,documentIds:[`two`]}],documents:[]}; const nav=`/documents?category=`,route=`/rules/Two`;')
  assert.equal(await verifyPublicationBundles(root), true)
  // Actual GDD minifier shape: a literal documentIds array becomes a template-string split.
  const compressedEntry = 'var q$9={schemaVersion:1,site:`gdd`,categories:[{id:`rules`,documentIds:`two`.split(`,`)}],documents:[]}; const nav=`/documents?category=`,route=`/rules/Two`;'
  await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), compressedEntry)
  assert.equal(await verifyPublicationBundles(root), true)
  await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), compressedEntry.replace('`two`.split(`,`)', '"two".split(",")'))
  assert.equal(await verifyPublicationBundles(root), true)
  await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), compressedEntry.replace('`two`.split(`,`)', '`two,extra`.split(`,`)'))
  await assert.rejects(verifyPublicationBundles(root), /gdd: category membership rules/)
  for (const expression of [
    'getIds().split(`,`)',
    '`two`.split(separator)',
    '`two`.split(/,/)',
    '`two`.split(`,`,1)',
    '`two`[method](`,`)',
    '`${getIds()}`.split(`,`)',
    '(()=>{throw Error("must not execute")})()',
  ]) {
    await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), compressedEntry.replace('`two`.split(`,`)', expression))
    await assert.rejects(verifyPublicationBundles(root), /nonliteral bundled category data/)
  }
  await writeFile(join(root, 'GDD/viewer/dist/assets/index-b.js'), 'var q$9={schemaVersion:1,site:`gdd`,categories:[{id:`rules`,documentIds:[`two`]}; /documents?category= /rules/Two')
  await assert.rejects(verifyPublicationBundles(root), /gdd: bundled category catalog missing/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
