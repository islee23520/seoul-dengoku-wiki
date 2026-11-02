import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, beforeAll, test } from 'vitest'
import { packagePrivateFeedback } from './package-private-feedback.mjs'
import { loadSelectableViews } from '../../feedback-service/src/views.mjs'
import { verifyPublicFeedbackBoundary } from './verify-public-feedback-boundary.mjs'
import { canonical } from '../../feedback-service/src/transaction-proof.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const sha = (value) => createHash('sha256').update(value).digest('hex')
const fixtureSource = { blocks: [{ text: '생애. 2126년 세대.' }] }
const revision = sha(canonical(fixtureSource))
const input = { parentCommit: '1'.repeat(40), wikiGitlink: '2'.repeat(40), wikiCommit: '3'.repeat(40), producerCommit: '3'.repeat(40) }
const sample = JSON.parse(await readFile(join(root, 'TOOL/feedback-service/test/fixtures/selectable-views.sample.json'), 'utf8'))

const producerCommit = '34dd7f8c153921517e015061da97fc56b2c2b9f1'
let producerBase, producer, actualCatalog
beforeAll(async () => {
  producerBase = await mkdtemp(join(tmpdir(), 'feedback-real-producer-'))
  producer = join(producerBase, 'WIKI')
  execFileSync('git', ['clone', '--no-hardlinks', '--no-checkout', process.env.FEEDBACK_TEST_WIKI_SOURCE ?? join(root, 'WIKI'), producer])
  execFileSync('git', ['checkout', '--detach', producerCommit], { cwd: producer })
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: producer, encoding: 'utf8' }).trim(), producerCommit)
  execFileSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: producer, stdio: 'inherit' })
  execFileSync(process.execPath, ['scripts/generate-catalog.mjs'], { cwd: producer, stdio: 'inherit', env: { ...process.env, SEOUL_KENSHI_ROOT: root } })
  actualCatalog = JSON.parse(await readFile(join(producer, 'src/generated-private/feedback-selectable-views.ko.json'), 'utf8'))
})
afterAll(async () => { if (producerBase) await rm(producerBase, { recursive: true, force: true }) })

async function fixture() {
  const base = await mkdtemp(join(tmpdir(), 'feedback-package-'))
  const sourceRoot = join(base, 'source'), wiki = join(sourceRoot, 'WIKI')
  const output = join(base, 'output'), site = join(output, 'site')
  await mkdir(join(wiki, 'scripts'), { recursive: true })
  await mkdir(join(wiki, 'src/generated-private'), { recursive: true })
  await mkdir(join(wiki, 'lore'), { recursive: true })
  await writeFile(join(wiki, 'lore/example.json'), JSON.stringify(fixtureSource))
  await mkdir(site, { recursive: true })
  await writeFile(join(site, 'index.html'), '<h1>public hub</h1>')
  for (const name of ['feedback-source-catalog.mjs', 'generate-catalog.mjs', 'world-atlas-schema.mjs']) await writeFile(join(wiki, 'scripts', name), `// ${name}\n`)
  for (const locale of ['ko', 'en']) {
    const catalog = structuredClone(sample)
    catalog.locale = locale
    catalog.documents['DOC:Example'].locale = locale
    catalog.documents['DOC:Example'].currentRevision = revision
    catalog.documents['DOC:Example'].revisions[revision] = catalog.documents['DOC:Example'].revisions['a'.repeat(64)]
    await writeFile(join(wiki, 'src/generated-private', `feedback-selectable-views.${locale}.json`), JSON.stringify(catalog))
  }
  await mkdir(join(sourceRoot, 'TOOL'), { recursive: true })
  await cp(join(root, 'TOOL/feedback-service'), join(sourceRoot, 'TOOL/feedback-service'), { recursive: true, filter: (path) => !path.includes('node_modules') })
  return { base, sourceRoot, output, site, wiki }
}

test('private tar contains exact service and v2 catalogs with bound hashes; public tar is disjoint', async () => {
  const f = await fixture()
  try {
    const result = await packagePrivateFeedback({ ...f, ...input })
    const publicTar = join(f.output, 'seoul-dengoku-site.tar')
    execFileSync('tar', ['-C', f.site, '-cf', publicTar, '.'])
    const listing = execFileSync('tar', ['-tf', result.archive], { encoding: 'utf8' }).trim().split('\n')
    const publicListing = execFileSync('tar', ['-tf', publicTar], { encoding: 'utf8' })
    assert.ok(listing.includes('./manifest.json'))
    assert.ok(listing.includes('./service/src/server.mjs'))
    assert.ok(listing.includes('./service/package-lock.json'))
    assert.ok(listing.includes('./service/candidate-schema.sql'))
    assert.ok(listing.includes('./service/transaction-schema.sql'))
    assert.ok(listing.includes('./sources/manifest.json'))
    assert.ok(!listing.some(path => /correction-db|keychain|remote-candidate/.test(path)))
    assert.ok(listing.includes('./catalogs/feedback-selectable-views.ko.json'))
    assert.ok(listing.includes('./catalogs/feedback-selectable-views.en.json'))
    assert.ok(!listing.some((path) => /\/test\/|node_modules|\.sqlite$|\.jsonl$|\/\.env/.test(path)))
    assert.deepEqual(new Set(publicListing.trim().split('\n')), new Set(['./', './index.html']))
    const unpacked = join(f.base, 'unpacked')
    await mkdir(unpacked)
    execFileSync('tar', ['-xf', result.archive, '-C', unpacked])
    const manifest = JSON.parse(await readFile(join(unpacked, 'manifest.json'), 'utf8'))
    assert.ok(manifest.artifacts.some(file => file.path === 'service/candidate-schema.sql'))
    assert.deepEqual(await readFile(join(unpacked, 'service/candidate-schema.sql')),
      await readFile(join(f.sourceRoot, 'TOOL/feedback-service/candidate-schema.sql')))
    assert.deepEqual(manifest.provenance.parentCommit, input.parentCommit)
    assert.deepEqual(manifest.provenance.wikiGitlink, input.wikiGitlink)
    assert.deepEqual(manifest.provenance.wikiCommit, input.wikiCommit)
    assert.equal(manifest.provenance.producerSha256, sha(await readFile(join(f.wiki, 'scripts/feedback-source-catalog.mjs'))))
    for (const file of manifest.artifacts) {
      const bytes = await readFile(join(unpacked, file.path))
      assert.equal(file.sha256, sha(bytes), file.path)
      assert.equal(file.bytes, bytes.length, file.path)
    }
    const paths = ['ko', 'en'].map((locale) => join(unpacked, 'catalogs', `feedback-selectable-views.${locale}.json`))
    assert.equal(loadSelectableViews(paths).documents.size, 2)
    assert.equal(await readFile(`${result.archive}.sha256`, 'utf8'), `${sha(await readFile(result.archive))}  seoul-dengoku-feedback-private.tar\n`)
  } finally { await rm(f.base, { recursive: true, force: true }) }
})

test('missing producer and public private data fail before private archive is emitted', async () => {
  const f = await fixture()
  try {
    await rm(join(f.wiki, 'scripts/feedback-source-catalog.mjs'))
    await assert.rejects(packagePrivateFeedback({ ...f, ...input }), /FEEDBACK_PRODUCER_REQUIRED/)
    await writeFile(join(f.wiki, 'scripts/feedback-source-catalog.mjs'), '// restored')
    const leaked = await readFile(join(f.wiki, 'src/generated-private/feedback-selectable-views.ko.json'))
    await writeFile(join(f.site, 'leak.json'), leaked)
    await assert.rejects(packagePrivateFeedback({ ...f, ...input }), /FEEDBACK_PUBLIC_CATALOG/)
    await assert.rejects(readFile(join(f.output, 'seoul-dengoku-feedback-private.tar')), /ENOENT/)
  } finally { await rm(f.base, { recursive: true, force: true }) }
})

test('actual producer catalog revisions package matching canonical envelopes', async () => {
  const output = await mkdtemp(join(tmpdir(), 'feedback-real-sources-'))
  try {
    const site = join(output, 'site'); await mkdir(site)
    await writeFile(join(site, 'index.html'), '<p>public</p>')
    const result = await packagePrivateFeedback({ sourceRoot: root, catalogRoot: producer, output, site, ...input })
    const sourceManifest = JSON.parse(await readFile(join(output, 'private-feedback/sources/manifest.json'), 'utf8'))
    assert.ok(sourceManifest.sources.length > 1000)
    for (const entry of sourceManifest.sources) {
      const bytes = await readFile(join(output, 'private-feedback/sources', entry.path))
      assert.equal(sha(canonical(JSON.parse(bytes))) + '.json', entry.path)
    }
    assert.ok(result.manifest.artifacts.some(entry => entry.path === 'sources/manifest.json'))
  } finally { await rm(output, { recursive: true, force: true }) }
})

test('actual packaging rejects catalog content embedded in scripts and manifests', async () => {
  for (const variant of ['script', 'manifest', 'reformatted', 'rewritten-js']) {
    const f = await fixture()
    try {
      const catalog = JSON.parse(await readFile(join(f.wiki, 'src/generated-private/feedback-selectable-views.ko.json'), 'utf8'))
      if (variant === 'script') {
        await mkdir(join(f.site, 'assets'))
        await writeFile(join(f.site, 'assets/app.js'), `window.feedbackCatalog=${JSON.stringify(catalog)};`)
      } else if (variant === 'manifest') {
        await writeFile(join(f.site, 'deployment-manifest.json'), JSON.stringify({ schemaVersion: 1, feedback: catalog }))
      } else if (variant === 'reformatted') {
        await writeFile(join(f.site, 'other.json'), JSON.stringify(catalog, null, 2))
      } else {
        await mkdir(join(f.site, 'assets'))
        const rewritten = JSON.stringify(catalog).replaceAll('"currentRevision":', 'currentRevision:').replaceAll('"revisions":', 'revisions:')
        await writeFile(join(f.site, 'assets/app.js'), `window.feedbackCatalog=${rewritten};`)
      }
      await assert.rejects(packagePrivateFeedback({ ...f, ...input }), /FEEDBACK_PUBLIC_CATALOG/, variant)
      await assert.rejects(readFile(join(f.output, 'seoul-dengoku-feedback-private.tar')), /ENOENT/)
    } finally { await rm(f.base, { recursive: true, force: true }) }
  }
})

test('actual packaging rejects JS sourceToken but accepts public clipped fields', async () => {
  const f = await fixture()
  try {
    await mkdir(join(f.site, 'assets'))
    const script = join(f.site, 'assets/app.js')
    await writeFile(script, 'window.mapping={sourceToken:"&amp;"};')
    await assert.rejects(packagePrivateFeedback({ ...f, ...input }), /FEEDBACK_PUBLIC_SOURCE_TOKEN/)
    await writeFile(script, 'window.mapping={"sourceToken":"&amp;"};')
    await assert.rejects(packagePrivateFeedback({ ...f, ...input }), /FEEDBACK_PUBLIC_SOURCE_TOKEN/)
    await writeFile(script, 'window.view={sourceSpans:[{path:"/content/1/text/ko",start:0,end:1,unit:"unicode-code-point"}],mappingVersion:"selectable-text-catalog.v2"};')
    const result = await packagePrivateFeedback({ ...f, ...input })
    assert.match(execFileSync('tar', ['-tf', result.archive], { encoding: 'utf8' }), /catalogs\/feedback-selectable-views.ko.json/)
  } finally { await rm(f.base, { recursive: true, force: true }) }
})

test('actual producer catalogs cannot cross as encoded JSON, JS, or unsampled documents', async () => {
  const actual = actualCatalog
  const { canonicalRevision } = await import(pathToFileURL(join(producer, 'scripts/feedback-source-catalog.mjs')).href)
  const manifest = JSON.parse(await readFile(join(producer, 'src/generated/publication-manifest.json'), 'utf8'))
  const expected = new Map(), sourceRevisions = new Map()
  const sourcePaths = execFileSync('git', ['ls-files', 'lore'], { cwd: producer, encoding: 'utf8' }).trim().split('\n')
  for (const entry of manifest.documents) {
    if (!entry.source.startsWith('lore/') || entry.source === 'lore/glossary.json') continue
    const bytes = await readFile(join(producer, entry.source))
    assert.equal(execFileSync('git', ['hash-object', entry.source], { cwd: producer, encoding: 'utf8' }), execFileSync('git', ['rev-parse', `${producerCommit}:${entry.source}`], { cwd: producer, encoding: 'utf8' }), entry.source)
    const envelope = JSON.parse(bytes)
    const revision = canonicalRevision(envelope)
    sourceRevisions.set(entry.source.split('/').at(-1).replace(/\.json$/, ''), revision)
    expected.set(envelope.id, { route: entry.route, revision })
  }
  for (const file of await readdir(join(producer, 'public/person-details'))) {
    const person = JSON.parse(await readFile(join(producer, 'public/person-details', file), 'utf8'))
    for (const source of person.sources) {
      if (sourceRevisions.has(source)) continue
      const path = sourcePaths.find((path) => path.endsWith(`/${source}.json`))
      assert.ok(path, source)
      const bytes = await readFile(join(producer, path))
      assert.equal(execFileSync('git', ['hash-object', path], { cwd: producer, encoding: 'utf8' }), execFileSync('git', ['rev-parse', `${producerCommit}:${path}`], { cwd: producer, encoding: 'utf8' }), path)
      sourceRevisions.set(source, canonicalRevision(JSON.parse(bytes)))
    }
    const document = actual.documents[`PERSON:${person.id}`]
    assert.ok(document, person.id)
    assert.ok(person.sources.some((source) => sourceRevisions.get(source) === document.currentRevision), person.id)
    expected.set(`PERSON:${person.id}`, { route: person.detailRoute, revision: document.currentRevision })
  }
  assert.ok(expected.size > 0)
  assert.deepEqual(Object.keys(actual.documents).sort(), [...expected.keys()].sort())
  for (const [id, { route, revision }] of expected) {
    const document = actual.documents[id]
    assert.equal(document.documentId, id)
    assert.equal(document.route, route, id)
    assert.equal(document.currentRevision, revision, id)
    assert.deepEqual(Object.keys(document.revisions), [revision], id)
    assert.ok(document.revisions[revision].leaves.length > 0, id)
  }
  assert.ok(new Set(Object.values(actual.documents).map((document) => document.currentRevision)).size > 3)
  const escaped = JSON.stringify(actual).replace(/"[a-f0-9]{64}"/g, (literal) => `"${[...literal.slice(1, -1)].map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`).join('')}"`)
  assert.deepEqual(JSON.parse(escaped), actual)
  const records = Object.values(actual.documents)
  const excluded = new Set([records[0], records[Math.floor(records.length / 2)], records.at(-1)].map((value) => value.currentRevision))
  const subset = structuredClone(actual)
  for (const [id, document] of Object.entries(subset.documents)) if (excluded.has(document.currentRevision)) delete subset.documents[id]
  assert.ok(Object.keys(subset.documents).length > 0)
  assert.ok(Object.keys(subset.documents).length < records.length)
  assert.ok(Object.values(subset.documents).every((document) => !excluded.has(document.currentRevision)))
  assert.ok(new Set(Object.values(subset.documents).map((document) => document.currentRevision)).size > 1)
  for (const [name, content] of [
    ['assets/navigation.json', escaped],
    ['assets/app.js', `window.feedbackCatalog=${escaped};`],
    ['assets/subset.json', JSON.stringify(subset)],
  ]) {
    const site = await mkdtemp(join(tmpdir(), 'feedback-real-public-'))
    try {
      await mkdir(join(site, 'assets'))
      await writeFile(join(site, name), content)
      await assert.rejects(verifyPublicFeedbackBoundary(site), /FEEDBACK_PUBLIC_CATALOG/, name)
    } finally { await rm(site, { recursive: true, force: true }) }
  }
})

test('escaped JS runtime key is rejected without evaluating JS', async () => {
  const site = await mkdtemp(join(tmpdir(), 'feedback-escaped-key-'))
  try {
    await mkdir(join(site, 'ASSETS'))
    const path = join(site, 'ASSETS/APP.JS')
    for (const content of [
      'window.mapping={"source\\u0054oken":"&amp;"};',
      'window.mapping={source\\u0054oken:"&amp;"};',
    ]) {
      await writeFile(path, content)
      await assert.rejects(verifyPublicFeedbackBoundary(site), /FEEDBACK_PUBLIC_SOURCE_TOKEN/)
    }
    await writeFile(path, 'window.view={sourceSpans:[{path:"/content/1/text/ko",start:0,end:1,unit:"unicode-code-point"}],mappingVersion:"selectable-text-catalog.v2"};')
    await verifyPublicFeedbackBoundary(site)
  } finally { await rm(site, { recursive: true, force: true }) }
})

test('actual packager rejects padded and nested static JSON strings and template keys', async () => {
  const catalog = actualCatalog
  const padded = ` \n\t${JSON.stringify(catalog)}`
  assert.deepEqual(JSON.parse(padded), catalog)
  for (const [name, content] of [
    ['assets/padded.js', `window.feedbackCatalog=JSON.parse(${JSON.stringify(padded)});`],
    ['assets/nested.json', JSON.stringify({ embedded: JSON.stringify(catalog) })],
    ['assets/nested-deep.json', JSON.stringify({ embedded: JSON.stringify({ embedded: JSON.stringify(catalog) }) })],
    ['assets/template.js', 'window.mapping=JSON.parse(`{"sourceToken":"&amp;"}`);'],
    ['ASSETS/APP.JS', 'window.mapping={[`sourceToken`]:"&amp;"};'],
  ]) {
    const f = await fixture()
    try {
      const target = join(f.site, name)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, content)
      await assert.rejects(packagePrivateFeedback({ ...f, ...input }), /FEEDBACK_PUBLIC_(?:CATALOG|SOURCE_TOKEN)/, name)
      await assert.rejects(readFile(join(f.output, 'seoul-dengoku-feedback-private.tar')), /ENOENT/)
    } finally { await rm(f.base, { recursive: true, force: true }) }
  }
})

test('public manifests accept minified literal string arrays', async () => {
  const site = await mkdtemp(join(tmpdir(), 'feedback-public-split-'))
  try {
    for (const expression of ['"doc.a,doc.b".split(",")', '`doc.a,doc.b`.split(`,`)', '"ab".split("")']) {
      await writeFile(join(site, 'app.js'), `window.manifest={schemaVersion:1,documents:[],categories:[{documentIds:${expression}}]};`)
      await verifyPublicFeedbackBoundary(site)
    }
  } finally { await rm(site, { recursive: true, force: true }) }
})

test('literal split results still reject private catalogs and source tokens', async () => {
  const site = await mkdtemp(join(tmpdir(), 'feedback-private-split-'))
  const catalog = '{"schemaVersion":"selectable-text-catalog.v2","documents":{"a":{"documentId":"a","currentRevision":"r","revisions":{}}}}'
  try {
    for (const [content, expected] of [
      ['window.manifest={schemaVersion:"selectable-text-catalog.v2",documents:{a:{documentId:"a",currentRevision:"r",revisions:{},ids:"a,b".split(",")}}};', /FEEDBACK_PUBLIC_CATALOG/],
      [`window.manifest={schemaVersion:1,documents:[],data:${JSON.stringify(`prefix|${catalog}`)}.split("|")};`, /FEEDBACK_PUBLIC_CATALOG/],
      ['window.manifest={schemaVersion:1,documents:[],data:\'prefix|{"sourceToken":"secret"}\'.split("|")};', /FEEDBACK_PUBLIC_SOURCE_TOKEN/],
      ['window.manifest={schemaVersion:1,documents:[],ids:"a,b".split(","),sourceToken:"secret"};', /FEEDBACK_PUBLIC_SOURCE_TOKEN/],
    ]) {
      await writeFile(join(site, 'app.js'), content)
      await assert.rejects(verifyPublicFeedbackBoundary(site), expected)
    }
  } finally { await rm(site, { recursive: true, force: true }) }
})

test('calls outside the literal split form remain unsupported', async () => {
  const site = await mkdtemp(join(tmpdir(), 'feedback-unsupported-call-'))
  try {
    for (const expression of [
      'ids.split(",")', '"a,b".split(separator)', '`a,${id}`.split(",")',
      '"a,b".split(/,/)', '"a,b".split(",",1)', '"a,b".split()',
      '"a,b"["split"](",")', '"a,b".split(...separators)', 'loadDocuments()',
    ]) {
      await writeFile(join(site, 'app.js'), `window.manifest={schemaVersion:1,documents:${expression}};`)
      await assert.rejects(verifyPublicFeedbackBoundary(site), /FEEDBACK_PUBLIC_JS_UNSUPPORTED/, expression)
    }
  } finally { await rm(site, { recursive: true, force: true }) }
})

test('actual CLI rejects quoted whole catalog and fails closed when carrier budget is exhausted', async () => {
  const catalog = actualCatalog
  const single = { ...catalog, documents: { [Object.keys(catalog.documents)[0]]: Object.values(catalog.documents)[0] } }
  for (const [name, content, expected] of [
    ['assets/quoted.json', JSON.stringify(JSON.stringify(JSON.stringify(catalog))), /FEEDBACK_PUBLIC_CATALOG/],
    ['assets/quoted.js', `window.feedbackCatalog=JSON.parse(${JSON.stringify(JSON.stringify(JSON.stringify(catalog)))});`, /FEEDBACK_PUBLIC_CATALOG/],
    ...[4, 5].map((layers) => {
      let value = { sourceToken: '&amp;' }
      for (let i = 0; i < layers; i++) value = { embedded: JSON.stringify(value) }
      return [`assets/depth-${layers}.json`, JSON.stringify(value), /FEEDBACK_PUBLIC_(?:SOURCE_TOKEN|JSON_DEPTH)/]
    }),
    ['assets/depth-record.json', (() => { let value = single; for (let i = 0; i < 5; i++) value = { embedded: JSON.stringify(value) }; return JSON.stringify(value) })(), /FEEDBACK_PUBLIC_JSON_DEPTH/],
    ['assets/depth-safe.json', (() => { let value = { safe: 'ok' }; for (let i = 0; i < 5; i++) value = { embedded: JSON.stringify(value) }; return JSON.stringify(value) })(), /FEEDBACK_PUBLIC_JSON_DEPTH/],
  ]) {
    const f = await fixture()
    try {
      const target = join(f.site, name)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, content)
      await assert.rejects(packagePrivateFeedback({ ...f, ...input }), expected, name)
      await assert.rejects(readFile(join(f.output, 'seoul-dengoku-feedback-private.tar')), /ENOENT/)
    } finally { await rm(f.base, { recursive: true, force: true }) }
  }
})
