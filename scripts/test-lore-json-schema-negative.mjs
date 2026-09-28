import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')
const evidence = join(root, '.omo/evidence/lore-wiki-issues-sweep/T10e')
const load = (domain) => JSON.parse(readFileSync(join(root, 'lore', domain === 'root' ? '' : domain, 'authoring.example.json'), 'utf8'))
const run = (file) => spawnSync(process.execPath, [join(root, 'scripts/lore-json-validate.mjs'), file], { cwd: root, encoding: 'utf8' })
const leaf = { en: 'Example', ko: '예시' }
const node = (kind, fields) => ({ kind, anchor: 'extra-block', ...fields })

const cases = [
  ['character score range', 'characters', (d) => { d.data.values.authority.value = 101 }, /E_SCHEMA: \$\.data\.values\.authority:/],
  ['character rank tier', 'characters', (d) => { d.data.rank.common_tier = 'T6' }, /E_SCHEMA: \$\.data\.rank\.common_tier:/],
  ['character unknown needs reason', 'characters', (d) => { delete d.data.language.reason }, /E_SCHEMA: \$\.data\.language:/],
  ['atlas relation type', 'root', (d) => { d.data.registry[0].relations[0].type = 'invented' }, /E_SCHEMA: \$\.data\.registry\[0\]\.relations\[0\]\.type:/],
  ['atlas registry ID', 'root', (d) => { d.data.registry[0].id = 'S99' }, /E_SCHEMA: \$\.data\.registry\[0\]\.id:/],
  ['chronology date shape', 'chronology', (d) => { d.data.sequence[0].date = { status: 'known', value: 'yesterday' } }, /E_SCHEMA: \$\.data\.sequence\[0\]\.date:/],
  ['chronology order', 'chronology', (d) => { d.data.sequence[0].order = -1 }, /E_SCHEMA: \$\.data\.sequence\[0\]\.order:/],
  ['bestiary batch exclusion', 'bestiary', (d) => { d.data.ecology.variants.push({ id: 'G01E01', source_batch: 'M007' }) }, /E_SCHEMA: \$\.data\.ecology\.variants\[0\]\.source_batch:/],
  ['bestiary excluded kind pairing', 'bestiary', (d) => { d.data.integration.excluded.push({ id: 'B017', kind: 'monsters' }) }, /E_SCHEMA: \$\.data\.integration\.excluded\[0\]\.id:/],
  ['bestiary manifest', 'bestiary', (d) => { d.data.integration.manifest = 'unverified.json' }, /E_SCHEMA: \$\.data\.integration\.manifest:/],
  ['heading depth', 'root', (d) => { d.content[0].depth = 7 }, /E_SCHEMA: \$\.content\[0\]:/],
  ['list start', 'root', (d) => { d.content.push(node('list', { ordered: true, start: -1, items: [leaf] })) }, /E_SCHEMA: \$\.content\[2\]:/],
  ['external link HTTPS', 'root', (d) => { d.content[1].text.en = [{ text: 'Example', href: 'http://example.org' }] }, /E_SCHEMA: \$\.content\[1\]:/],
  ['locale header', 'root', (d) => { delete d.locales.en.summary }, /E_LOCALE: \$\.locales\.en: 'summary' is a required property/],
  ['list item locale', 'root', (d) => { d.content.push(node('list', { items: [{ en: 'Example' }] })) }, /E_LOCALE: .*extra-block.* ko/],
  ['table cell locale', 'root', (d) => { d.content.push(node('table', { columns: [leaf], rows: [[{ en: '' }]] })) }, /E_LOCALE: .*extra-block.* ko/],
  ['table row width', 'root', (d) => { d.content.push(node('table', { columns: [leaf], rows: [[leaf, leaf]] })) }, /E_BLOCK: .*extra-block table row width differs/],
  ['table heading cannot be empty', 'root', (d) => { d.content.push(node('table', { columns: [{ en: '', ko: '제목' }], rows: [[leaf]] })) }, /E_SCHEMA: \$\.content\[2\]:/],
  ['quote has no heading depth', 'root', (d) => { d.content.push(node('quote', { depth: 2, text: leaf })) }, /E_SCHEMA: \$\.content\[2\]:/],
  ['code fence language', 'root', (d) => { d.content.push(node('code', { language: 'Mermaid!', text: leaf })) }, /E_SCHEMA: \$\.content\[2\]:/],
  ['code fence locale', 'root', (d) => { d.content.push(node('code', { language: 'text', text: { en: 'example' } })) }, /E_LOCALE: .*extra-block.* ko/],
  ['link and href exclusive', 'root', (d) => { d.content[1].text.en = [{ text: 'Example', href: 'https://example.org', link: { domain: 'root', slug: 'World-Narrative-Atlas' } }] }, /E_SCHEMA: \$\.content\[1\]:/],
  ['link slug rejects traversal', 'root', (d) => { d.content[1].text.en = [{ text: 'Example', link: { domain: 'root', slug: '../other' } }] }, /E_SCHEMA: \$\.content\[1\]:/],
  ['link target exists', 'root', (d) => { d.content[1].text.en = [{ text: 'Example', link: { domain: 'overview', slug: 'Does-Not-Exist' } }] }, /E_LINK: .*overview\/Does-Not-Exist/],
  ['provenance hash format', 'root', (d) => { d.provenance.original_hash = 'not-a-sha256' }, /E_PROVENANCE: \$\.provenance\.original_hash:/],
  ['observed source needs reference', 'root', (d) => { d.source.kind = 'observed' }, /E_SCHEMA: \$\.source\.refs:/],
]

test('each of 26 independent negative mutations fails at its own rule through the CLI', () => {
  mkdirSync(evidence, { recursive: true })
  const dir = mkdtempSync(join(evidence, 'fixture-'))
  try {
    for (const [name, domain, mutate, diagnostic] of cases) {
      const document = load(domain)
      const file = join(dir, 'authoring.example.json')
      writeFileSync(file, JSON.stringify(document))
      const valid = run(file)
      assert.equal(valid.status, 0, `${name} baseline: ${valid.stderr}`)
      mutate(document)
      writeFileSync(file, JSON.stringify(document))
      const invalid = run(file)
      assert.equal(invalid.status, 1, `${name}: ${invalid.stdout} ${invalid.stderr}`)
      assert.match(invalid.stderr, diagnostic, name)
    }
    assert.equal(cases.length, 26)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
