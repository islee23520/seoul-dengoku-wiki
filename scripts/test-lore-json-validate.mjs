import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')
const evidence = join(root, '.omo/evidence/lore-wiki-issues-sweep/task-10f')
const example = JSON.parse(readFileSync(join(root, 'lore/ailments/authoring.example.json'), 'utf8'))
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
  const fixture = (name, mutate) => {
    const document = structuredClone(example)
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
    for (const [name, mutate, expected] of cases) {
      const result = run(fixture(name, mutate))
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
