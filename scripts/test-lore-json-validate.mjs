import assert from 'node:assert/strict'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { test } from 'vitest'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { listDocuments } from './cast-sqlite/document-read.mjs'

const root = resolve(import.meta.dirname, '..')
const evidence = join(root, '.omo/evidence/lore-wiki-issues-sweep/task-10f')
const example = readCanonicalDocument('lore/ailments/authoring.example.json')
const rootExample = readCanonicalDocument('lore/authoring.example.json')
const chronologyExample = readCanonicalDocument('lore/chronology/authoring.example.json')
const run = (...files) => spawnSync(process.execPath, [join(root, 'scripts/lore-json-validate.mjs'), ...files], { cwd: root, encoding: 'utf8' })
function isolatedFixture() {
  const isolatedRoot = mkdtempSync(join(tmpdir(), 'isolated-lore-'))
  const tracked = spawnSync('git', ['ls-files', '-z', '--', 'lore'], { cwd: root, encoding: 'utf8' })
  assert.equal(tracked.status, 0, tracked.stderr)
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? join(root, 'data/canonical/wiki-cast.sqlite'))
  let documents
  try { documents = ['current', 'example'].flatMap((corpusKind) => listDocuments(db, { corpusKind, visibility: 'internal' })).filter((identity) => identity.logical_path.startsWith('lore/')) }
  finally { db.close() }
  const paths = [...tracked.stdout.split('\0').filter((path) => path && existsSync(join(root, path))), 'scripts/lore-json-schema.py']
  for (const path of paths) {
    mkdirSync(join(isolatedRoot, path, '..'), { recursive: true })
    copyFileSync(join(root, path), join(isolatedRoot, path))
  }
  for (const { logical_path: path } of documents) {
    mkdirSync(join(isolatedRoot, path, '..'), { recursive: true })
    writeFileSync(join(isolatedRoot, path), JSON.stringify(readCanonicalDocument(path)))
  }
  const initialized = spawnSync('git', ['init', '-q', isolatedRoot], { encoding: 'utf8' })
  assert.equal(initialized.status, 0, initialized.stderr)
  const staged = spawnSync('git', ['add', '--', 'lore'], { cwd: isolatedRoot, encoding: 'utf8' })
  assert.equal(staged.status, 0, staged.stderr)
  const tree = spawnSync('git', ['write-tree'], { cwd: isolatedRoot, encoding: 'utf8' })
  assert.equal(tree.status, 0, tree.stderr)
  return { isolatedRoot, run: (...files) => run('--root', isolatedRoot, '--base', tree.stdout.trim(), ...files) }
}

function atlasDocument() {
  const document = structuredClone(rootExample)
  document.id = 'WNA-001'
  document.slug = 'World-Narrative-Atlas'
  document.categories = ['overview']
  document.tense = { en: 'present', ko: 'present' }
  document.locales.en.tense = 'present'
  document.locales.ko.tense = 'present'
  delete document.data.registry
  document.data.atlas = structuredClone(rootExample.data.atlas)
  return document
}

test('the eighteen domain examples and a published page pass', () => {
  const examples = ['lore', ...['ailments', 'bestiary', 'characters', 'chronology', 'culture', 'economy', 'editorial', 'factions', 'goods', 'name-pools', 'offices', 'overview', 'people-and-machines', 'places', 'regions', 'structures', 'technology'].map((domain) => `lore/${domain}`)]
  for (const dir of examples) {
    const result = run(`${dir}/authoring.example.json`)
    assert.equal(result.status, 0, `${dir}: ${result.stderr}`)
  }
  const published = run('lore/ailments/Ailments.json')
  assert.equal(published.status, 0, published.stderr)
})

test('domain directories accept nested native paths and reject a different domain', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lore-domain-'))
  try {
    mkdirSync(join(dir, 'scripts'), { recursive: true })
    copyFileSync(join(root, 'scripts/lore-json-schema.py'), join(dir, 'scripts/lore-json-schema.py'))
    const initialized = spawnSync('git', ['init', '-q', dir], { encoding: 'utf8' })
    assert.equal(initialized.status, 0, initialized.stderr)
    for (const [directory, status] of [['ailments', 0], ['ailments/groups', 0], ['bestiary/groups', 1]]) {
      const parent = join(dir, 'lore', directory)
      mkdirSync(parent, { recursive: true })
      const file = join(parent, 'authoring.example.json')
      writeFileSync(file, JSON.stringify(example))
      const result = run('--root', dir, file)
      assert.equal(result.status, status, `${directory}: ${result.stderr}`)
      if (status === 1) assert.match(result.stderr, /^E_DOMAIN: lore\/bestiary\/groups\/authoring\.example\.json: domain does not match directory$/mu)
      else assert.doesNotMatch(result.stderr, /E_DOMAIN/)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('WNA-001 accepts the closed world-narrative-atlas.v3 contract', () => {
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'atlas-valid-'))
  try {
    const file = join(dir, 'World-Narrative-Atlas.json')
    writeFileSync(file, JSON.stringify(atlasDocument()))
    const result = run(file)
    assert.equal(result.status, 0, result.stderr)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('atlas accepts temporal synthetic relations and rejects unknown kinds', () => {
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'atlas-temporal-'))
  try {
    const document = atlasDocument()
    const localized = { en: 'Example', ko: '예시' }
    for (const id of ['K086', 'K087']) {
      document.data.atlas.humans.push({ id, name: localized, role: localized, stage: '주요', state_id: '__EXAMPLE__:state', state_name: localized, source_anchor: '__EXAMPLE__:source' })
    }
    const synthetic = (id, kind, target) => ({
      id, display_name: localized, callsign: localized, cls: id[0],
      owner: '__EXAMPLE__:owner', source_kind: 'original-fiction', source_anchors: ['__EXAMPLE__:source'], revision: 1, projection_targets: [],
      state_id: '__EXAMPLE__:state', house_id: '__EXAMPLE__:house',
      body_platform: localized, custody_legal: localized, memory_continuity: localized, energy_parts: localized,
      maintenance: localized, network_safety: localized, emergent_goal: localized, divergence_recovery: localized,
      relations: [{ target, kind, reason: localized }],
      prose: [{ kind: 'paragraph', anchor: `synthetic-${id.toLowerCase()}`, text: localized }],
    })
    document.data.atlas.synthetics.push(synthetic('H04', 'historical_custodian', 'K086'))
    document.data.atlas.synthetics.push(synthetic('F04', 'record_handover_contact', 'K087'))
    document.data.atlas.relations.push({ from: 'H04', kind: 'historically_custodied_by', to: 'K086', reason: localized })
    const file = join(dir, 'World-Narrative-Atlas.json')
    const validate = () => { writeFileSync(file, JSON.stringify(document)); return run(file) }
    const accepted = validate()
    assert.equal(accepted.status, 0, accepted.stderr)
    for (const relation of [document.data.atlas.synthetics[0].relations[0], document.data.atlas.synthetics[1].relations[0], document.data.atlas.relations[0]]) {
      const kind = relation.kind
      relation.kind = 'arbitrary-kind'
      const rejected = validate()
      assert.equal(rejected.status, 1, rejected.stderr)
      assert.match(rejected.stderr, /E_SCHEMA/)
      relation.kind = kind
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('atlas narrative nodes bind anchors and expose public aliases', () => {
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'atlas-anchor-'))
  try {
    const document = atlasDocument()
    document.data.atlas.hostile_groups.push({
      id: '__EXAMPLE__:group', display_name: { en: 'Example group', ko: '예시 집단' },
      bestiary: { common_ecology: { en: 'Example', ko: '예시' }, variant_relation: { en: 'Example', ko: '예시' }, command_scope: { en: 'Example', ko: '예시' } },
      category: 'animal-urban', owner: '__EXAMPLE__:owner', source_kind: 'original-fiction', source_anchors: ['__EXAMPLE__:source'], revision: 1, projection_targets: [],
      modern_anxiety: { en: 'Example', ko: '예시' }, fictional_origin: { en: 'Example', ko: '예시' }, territory_migration: { en: 'Example', ko: '예시' }, economy: { en: 'Example', ko: '예시' }, lifecycle: { en: 'Example', ko: '예시' }, senses: { en: 'Example', ko: '예시' }, hierarchy: { en: 'Example', ko: '예시' },
      links: { states: [], houses: [], theaters: [], synthetics: [], corporations_successor_only: [] }, escalation: { en: 'Example', ko: '예시' }, combat_counterplay: { en: 'Example', ko: '예시' }, negotiation: { en: 'Example', ko: '예시' }, moral_cost: { en: 'Example', ko: '예시' }, scenario_links: [],
      dossier_prose: [{ kind: 'paragraph', anchor: 'embedded-prose', publicAnchors: ['legacy-fragment'], text: { en: 'Example.', ko: '예시.' } }],
      prose: [{ kind: 'paragraph', anchor: 'embedded-summary', text: { en: 'Example.', ko: '예시.' } }]
    })
    document.data.registry = undefined
    // Owned prose may link a block of another document; that anchor is not a local block ID.
    const annals = (anchor) => [{ text: 'record', link: { domain: 'chronology', slug: 'Century-Annals', anchor } }]
    document.data.atlas.hostile_groups[0].prose[0].text = { en: annals('2069년-xt01-임진-제방-임시-검역소'), ko: annals('2069년-xt01-임진-제방-임시-검역소') }
    const file = join(dir, 'World-Narrative-Atlas.json')
    writeFileSync(file, JSON.stringify(document))
    const valid = run(file)
    assert.equal(valid.status, 0, valid.stderr)
    document.data.atlas.hostile_groups[0].prose[0].text.en = annals('missing-annals-block')
    writeFileSync(file, JSON.stringify(document))
    const missing = run(file)
    assert.equal(missing.status, 1, missing.stderr)
    assert.match(missing.stderr, /E_LINK: .*chronology\/Century-Annals#missing-annals-block does not exist/)
    assert.doesNotMatch(missing.stderr, /E_ANCHOR/)
    document.data.atlas.hostile_groups[0].prose[0].text.en = 'Example.'
    document.data.atlas.hostile_groups[0].dossier_prose[0].publicAnchors = ['embedded-summary']
    writeFileSync(file, JSON.stringify(document))
    const duplicate = run(file)
    assert.equal(duplicate.status, 1, duplicate.stderr)
    assert.match(duplicate.stderr, /E_ANCHOR: .*duplicate embedded-summary/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('nested group links resolve through their complete slug', () => {
  const document = structuredClone(example)
  document.content[1].text.en = [{ text: 'group', link: { domain: 'bestiary', slug: 'groups/Hostile-Group-G10' } }]
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'nested-link-'))
  try {
    const file = join(dir, 'authoring.example.json')
    writeFileSync(file, JSON.stringify(document))
    const result = run(file)
    assert.equal(result.status, 0, result.stderr)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('atlas ID spellings, relation kinds, closed objects and exclusions fail independently', () => {
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'atlas-negative-'))
  const fixture = (name, mutate) => {
    const document = atlasDocument()
    mutate(document)
    const file = join(dir, `${name}.json`)
    writeFileSync(file, JSON.stringify(document))
    return file
  }
  try {
    const validRecords = (document) => {
      document.data.atlas.humans.push({ id: 'K1003', name: { en: 'Example', ko: '예시' }, role: { en: 'Example', ko: '예시' }, stage: '주요', state_id: '__EXAMPLE__:state', state_name: { en: 'Example', ko: '예시' }, source_anchor: '__EXAMPLE__:source' })
      document.data.atlas.states.push({ id: '__EXAMPLE__:state', display_name: { en: 'Example', ko: '예시' }, capital_station: { en: 'Example', ko: '예시' }, region: { en: 'Example', ko: '예시' }, government: { en: 'Example', ko: '예시' }, offices: [], power: { en: 'Example', ko: '예시' }, power_basis: [], corridors: [] })
      document.data.atlas.arcs.push({ id: 'ARC-S-H', title: { en: 'Example', ko: '예시' }, house_ids: [], theater_ids: [], synthetic_classes: ['H'], group_ids: [], acts: [{ act: 1, summary: { en: 'Example', ko: '예시' } }], owner: '__EXAMPLE__:owner', source_kind: 'original-fiction', source_anchors: ['__EXAMPLE__:source'] })
      document.data.atlas.relations.push({ from: 'K1003', kind: 'custodied_by', to: '__EXAMPLE__:state', reason: { en: 'Example', ko: '예시' } })
    }
    const baseline = fixture('baseline', validRecords)
    assert.equal(run(baseline).status, 0, run(baseline).stderr)
    for (const [name, mutate, expected] of [
      ['missing-atlas', (d) => { delete d.data.atlas }, /E_SCHEMA/],
      ['registry-forbidden', (d) => { d.data.registry = rootExample.data.registry }, /E_SCHEMA/],
      ['closed-atlas', (d) => { d.data.atlas.unknown = true }, /E_SCHEMA/],
      ['bad-four-digit-person', (d) => { validRecords(d); d.data.atlas.humans[0].id = 'K10000' }, /E_SCHEMA/],
      ['bad-arc-colon', (d) => { validRecords(d); d.data.atlas.arcs[0].id = 'ARC:H' }, /E_SCHEMA/],
      ['bad-relation-kind', (d) => { validRecords(d); d.data.atlas.relations[0].kind = 'partnership' }, /E_SCHEMA/],
      ['name-endpoint', (d) => { validRecords(d); d.data.atlas.relations[0].from = '예시' }, /E_REFERENCE|E_SCHEMA/],
      ['m007-body', (d) => { d.data.atlas.monster_contents.M007 = { id: 'M007', owner: '__EXAMPLE__:owner', source_kind: 'original-fiction', source_anchors: ['__EXAMPLE__:source'], entries: [] } }, /E_EXCLUDED_ID/],
      ['m007-entry', (d) => { d.data.atlas.monster_contents.M001 = { id: 'M001', owner: '__EXAMPLE__:owner', source_kind: 'original-fiction', source_anchors: ['__EXAMPLE__:source'], entries: [{ id: 'G04E13', display_name: { en: 'Example', ko: '예시' }, bestiary: { kind: 'common-organism', formation: 'single', battlefield_role: { en: 'Example', ko: '예시' }, scope_note: { en: 'Example', ko: '예시' } }, group_id: '__EXAMPLE__:group', role_class: { en: 'Example', ko: '예시' }, links: {}, prose: [{ kind: 'paragraph', anchor: 'reserved-entry', text: { en: 'Example', ko: '예시' } }] }] } }, /E_EXCLUDED_ID/],
      ['retired-route', (d) => { d.data.atlas.projection_pages['Monster-Batch-M001'] = d.data.atlas.projection_pages['__EXAMPLE__-projection'] }, /E_EXCLUDED_ID/],
      ['excluded-social-route', (d) => { d.data.atlas.projection_pages['Story-Batch-B017'] = d.data.atlas.projection_pages['__EXAMPLE__-projection'] }, /E_EXCLUDED_ID/],
    ]) {
      const result = run(fixture(name, mutate))
      assert.equal(result.status, 1, `${name}: ${result.stdout} ${result.stderr}`)
      assert.match(result.stderr, expected, name)
    }
    const reservation = fixture('m007-reservation', (d) => {
      d.data.atlas.monster_batches.push({ id: 'M007', entry_ids: ['G04E13', 'G04E14', 'G04E15', 'G04E16', 'G05E01', 'G05E02', 'G05E03', 'G05E04', 'G05E05', 'G05E06'], owner: '__EXAMPLE__:owner', source_kind: 'original-fiction', source_anchors: ['__EXAMPLE__:source'], projection_targets: [] })
    })
    assert.equal(run(reservation).status, 0, run(reservation).stderr)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('bad locale, ID, link, Markdown, slug and naming fail independently', () => {
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'fixture-'))
  const fixture = (name, mutate, base = example) => {
    const document = structuredClone(base)
    mutate(document)
    const file = join(dir, `${name}.json`)
    writeFileSync(file, JSON.stringify(document))
    return file
  }
  try {
    const cases = [
      ['locale', (d) => { delete d.locales.ko }, /E_LOCALE/],
      ['id', (d) => { d.id = 'K-not-an-id' }, /E_ID/],
      ['link', (d) => { d.content[1].text.en = [{ text: 'missing', link: { domain: 'overview', slug: 'Does-Not-Exist' } }] }, /E_LINK/],
      ['private-link', (d) => { d.content[1].text.en = [{ text: 'private', link: { domain: 'characters', slug: 'Cast-Profile-Contract' } }] }, /E_LINK/],
      ['link-anchor', (d) => { d.content[1].text.en = [{ text: 'missing', link: { domain: 'overview', slug: 'World-Unbinding', anchor: 'Does-Not-Exist' } }] }, /E_LINK/],
      ['markdown', (d) => { d.content[1].text.ko = '**굵은 글씨**' }, /E_MARKDOWN/],
      ['naming', (d) => { d.content[1].text.ko = 'Seoul Sengoku' }, /E_NAMING/],
      ['tense', (d) => { d.tense.ko = 'present' }, /E_TENSE/],
      ['anchor', (d) => { d.content[1].anchor = d.content[0].anchor }, /E_ANCHOR/],
      ['provenance', (d) => { delete d.provenance }, /E_PROVENANCE/],
    ]
    for (const [name, mutate, expected, base] of [
      ...cases,
      ['missing-locale-block', (d) => { delete d.content[1].text.ko }, /E_LOCALE: .*example-body.* ko/],
      ['tense-pair', (d) => { d.tense.ko = 'present'; d.locales.ko.tense = 'present' }, /E_TENSE: .*en and ko differ/],
      ['unmatched-block-id', (d) => { d.data.sequence[0].anchor = 'Does-Not-Exist' }, /E_ANCHOR: .*Does-Not-Exist has no content block/, chronologyExample],
    ]) {
      const result = run(fixture(name, mutate, base))
      assert.equal(result.status, 1, `${name}: ${result.stdout} ${result.stderr}`)
      assert.match(result.stderr, expected, name)
    }
    const first = fixture('slug-one', (d) => { d.slug = 'duplicate'; d.id = 'DOC:First' })
    const second = fixture('slug-two', (d) => { d.slug = 'duplicate'; d.id = 'DOC:Second' })
    const duplicate = run(first, second)
    assert.equal(duplicate.status, 1, duplicate.stderr)
    assert.match(duplicate.stderr, /E_SLUG/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('default mode checks changed files plus the migration ledger; strict mode fails only unmigrated Markdown', () => {
  const changed = run('--base', 'HEAD')
  assert.equal(changed.status, 0, changed.stderr)
  assert.match(changed.stdout, /^OK: \d+ lore JSON document\(s\) \(changed \d+, ledger \d+\)/mu)
  const strict = run('--strict')
  // Every lore page is a JSON authoring document or a listed task 10c exception, so strict mode passes.
  assert.equal(strict.status, 0, strict.stderr)
  assert.doesNotMatch(strict.stderr, /E_UNMIGRATED/u)
  // The atlas chain (source plus its 34 projections) is migrated: none of its Markdown paths remains.
  assert.doesNotMatch(strict.stderr, /E_UNMIGRATED: lore\/(?:World-Narrative-Atlas|Operating-Houses|Regional-Physical-AI-Arcs|Synthetic-Actors|World-Expansion-Index|World-Relation-Ledger|factions\/External-Theaters|bestiary\/Hostile-Ecology-Index|bestiary\/groups\/Hostile-Group-G\d{2})\.md/u)
  assert.doesNotMatch(strict.stderr, /E_UNMIGRATED: lore\/(?:[^/\n]+\/)*(?:AGENTS|AUTHORING-JSON)\.md/u)
  assert.doesNotMatch(strict.stderr, /E_UNMIGRATED: lore\/ailments\/Ailments\.md/u)
  // Task 10c exceptions stay Markdown; the Glossary page is generated from lore/glossary.json.
  for (const path of ['lore/README.md', 'lore/characters/Cast-Profile-Contract.md', 'lore/characters/Cast-Registration-Template.md', 'lore/characters/Random-Cast-Roster.md', 'lore/editorial/Naming-Ledger.md', 'lore/editorial/Writing-Rules.md', 'lore/name-pools/cast-backfill-draft.md', 'lore/name-pools/hangnyeol-schema.md', 'lore/places/Station-Alias-Candidates.md', 'lore/regions/README.md', 'lore/regions/sources/observed-levels-join.md']) {
    assert.ok(!strict.stderr.includes(`E_UNMIGRATED: ${path}:`), path)
  }
  assert.ok(!strict.stderr.includes('E_UNMIGRATED: lore/Glossary.md:'))
  // The exception list names files; a new Markdown file anywhere under lore is still reported.
  const { isolatedRoot, run: runIsolated } = isolatedFixture()
  const stray = join(isolatedRoot, 'lore/editorial/Unlisted-Note.md')
  try {
    writeFileSync(stray, '# note\n')
    const stricter = runIsolated('--strict')
    assert.equal(stricter.status, 1, stricter.stderr || stricter.stdout)
    assert.match(stricter.stderr, /^E_UNMIGRATED: lore\/editorial\/Unlisted-Note\.md: /mu, stricter.stderr)
  } finally {
    rmSync(isolatedRoot, { recursive: true, force: true })
  }
})

test('a Markdown file next to its JSON authoring document fails in default and strict mode', () => {
  const clean = run()
  assert.equal(clean.status, 0, clean.stderr)
  // Data JSON beside a task 10c Markdown file (for example the naming ledger) is not an authoring source.
  assert.doesNotMatch(run('--strict').stderr, /E_MARKDOWN_TWIN/u)
  const { isolatedRoot, run: runIsolated } = isolatedFixture()
  const twin = join(isolatedRoot, 'lore/culture/Food-Culture.md')
  try {
    assert.ok(!existsSync(twin), 'Food-Culture.md must not be committed next to its JSON source')
    writeFileSync(twin, '# twin\n')
    for (const result of [runIsolated(), runIsolated('--strict')]) {
      assert.equal(result.status, 1, result.stderr || result.stdout)
      assert.match(result.stderr, /^E_MARKDOWN_TWIN: lore\/culture\/Food-Culture\.md: /mu, result.stderr)
    }
  } finally {
    rmSync(isolatedRoot, { recursive: true, force: true })
  }
})

// #279: the schema runner used to read the document from standard input and could wait on the pipe forever.
test('the schema runner reads the document from its path and never waits on standard input', async () => {
  const child = spawn('python3', [join(root, 'scripts/lore-json-schema.py'), 'ailments', join(root, 'lore/ailments/Ailments.json')], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] })
  let stdout = ''
  child.stdout.on('data', (chunk) => { stdout += chunk })
  // Standard input stays open and silent: a runner that reads it would never exit.
  const exited = new Promise((done) => child.on('exit', (code) => done(code)))
  const stalled = new Promise((done) => setTimeout(() => done('stalled'), 30000).unref())
  const outcome = await Promise.race([exited, stalled])
  child.kill('SIGKILL')
  assert.equal(outcome, 0, `schema runner ${outcome === 'stalled' ? 'waited on standard input' : `exited ${outcome}: ${stdout}`}`)
})

test('a stalled schema check fails with its file label instead of hanging', () => {
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'stalled-schema-'))
  try {
    const preload = join(dir, 'stalled-schema.mjs')
    // Replace only Python's process, not spawnSync's timeout/error handling.
    writeFileSync(preload, `
      import assert from 'node:assert/strict'
      import childProcess from 'node:child_process'
      import { syncBuiltinESMExports } from 'node:module'
      const spawnSync = childProcess.spawnSync
      childProcess.spawnSync = (command, args, options) => {
        if (command !== 'python3') return spawnSync(command, args, options)
        const result = spawnSync(process.execPath, ['-e',
          "process.stdout.write('fixture-ready'); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0)"
        ], options)
        assert.equal(result.stdout, 'fixture-ready', 'the stalled process must start')
        assert.equal(result.error?.code, 'ETIMEDOUT')
        process.stderr.write('fixture: ETIMEDOUT\\n')
        return result
      }
      syncBuiltinESMExports()
    `)
    const result = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, join(root, 'scripts/lore-json-validate.mjs'), 'lore/ailments/Ailments.json'], {
      cwd: root, encoding: 'utf8', timeout: 20000,
      env: { ...process.env, LORE_JSON_SCHEMA_TIMEOUT_MS: '2000' },
    })
    assert.equal(result.error, undefined, 'the validator itself hung')
    assert.equal(result.status, 1, result.stdout)
    assert.match(result.stderr, /^fixture: ETIMEDOUT$/mu)
    assert.match(result.stderr, /^E_SCHEMA: lore\/ailments\/Ailments\.json: schema check did not finish within 2000 ms$/mu)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
