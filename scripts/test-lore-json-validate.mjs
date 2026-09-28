import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')
const evidence = join(root, '.omo/evidence/lore-wiki-issues-sweep/task-10f')
const example = JSON.parse(readFileSync(join(root, 'lore/ailments/authoring.example.json'), 'utf8'))
const chronologyExample = JSON.parse(readFileSync(join(root, 'lore/chronology/authoring.example.json'), 'utf8'))
const run = (...files) => spawnSync(process.execPath, [join(root, 'scripts/lore-json-validate.mjs'), ...files], { cwd: root, encoding: 'utf8' })

test('the eighteen domain examples and a published page pass', () => {
  const examples = ['lore', ...['ailments', 'bestiary', 'characters', 'chronology', 'culture', 'economy', 'editorial', 'factions', 'goods', 'name-pools', 'offices', 'overview', 'people-and-machines', 'places', 'regions', 'structures', 'technology'].map((domain) => `lore/${domain}`)]
  for (const dir of examples) {
    const result = run(`${dir}/authoring.example.json`)
    assert.equal(result.status, 0, `${dir}: ${result.stderr}`)
  }
  const published = run('lore/ailments/Ailments.json')
  assert.equal(published.status, 0, published.stderr)
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

test('default mode checks changed files plus the migration ledger; strict mode fails unmigrated Markdown', () => {
  const changed = run('--base', 'HEAD')
  assert.equal(changed.status, 0, changed.stderr)
  assert.match(changed.stdout, /^OK: \d+ lore JSON document\(s\) \(changed \d+, ledger \d+\)/mu)
  const strict = run('--strict')
  assert.equal(strict.status, 1, strict.stdout)
  assert.match(strict.stderr, /^E_UNMIGRATED: lore\/World-Narrative-Atlas\.md: /mu)
  assert.doesNotMatch(strict.stderr, /E_UNMIGRATED: lore\/(?:[^/\n]+\/)*(?:AGENTS|AUTHORING-JSON)\.md/u)
  assert.doesNotMatch(strict.stderr, /E_UNMIGRATED: lore\/ailments\/Ailments\.md/u)
  // Task 10c exceptions stay Markdown; the glossary still has to become a JSON authoring document.
  for (const path of ['lore/README.md', 'lore/characters/Cast-Profile-Contract.md', 'lore/characters/Cast-Registration-Template.md', 'lore/characters/Random-Cast-Roster.md', 'lore/editorial/Naming-Ledger.md', 'lore/editorial/Writing-Rules.md', 'lore/name-pools/cast-backfill-draft.md', 'lore/name-pools/hangnyeol-schema.md', 'lore/places/Station-Alias-Candidates.md', 'lore/regions/README.md', 'lore/regions/sources/observed-levels-join.md']) {
    assert.ok(!strict.stderr.includes(`E_UNMIGRATED: ${path}:`), path)
  }
  assert.match(strict.stderr, /^E_UNMIGRATED: lore\/Glossary\.md: /mu)
  // The exception list names files; a new Markdown file anywhere under lore is still reported.
  const stray = join(root, 'lore/editorial/Unlisted-Note.md')
  writeFileSync(stray, '# note\n')
  try {
    assert.match(run('--strict').stderr, /^E_UNMIGRATED: lore\/editorial\/Unlisted-Note\.md: /mu)
  } finally {
    rmSync(stray)
  }
})
