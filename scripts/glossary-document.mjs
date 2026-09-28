// Build the Glossary page (/world/Glossary, /en/world/Glossary) from the machine term dictionary lore/glossary.json.
// The page lives only in memory: glossary.json is its one source, and no lore/Glossary.* file is written, because on a
// case-insensitive file system lore/Glossary.json and lore/glossary.json are the same path.
export const glossarySections = Object.freeze([
  { categories: ['state'], ko: '국가 (16개국)', en: 'States (the sixteen)' },
  { categories: ['organization'], ko: '가문 및 조직', en: 'Houses and organizations' },
  { categories: ['person_category'], ko: '인물 및 직책', en: 'People and posts' },
  { categories: ['technology', 'equipment'], ko: '기술 및 장비', en: 'Technology and equipment' },
  { categories: ['martial_school'], ko: '무공 및 전술', en: 'Martial arts and tactics' },
  { categories: ['geography'], ko: '시설 및 지리', en: 'Facilities and geography' },
  { categories: ['event'], ko: '사건 및 연대', en: 'Events and eras' },
  { categories: ['ailment'], ko: '질병', en: 'Ailments' },
])

const textFields = ['display_name_ko', 'reader_definition_ko', 'display_name_en', 'reader_definition_en']
const aliasFields = ['aliases', 'aliases_en']

const item = (name, definition, aliases, label) => [
  { text: name, strong: true },
  { text: `: ${definition}${aliases.length ? ` (${label}: ${aliases.join(', ')})` : ''}` },
]

export function glossaryDocument(entries) {
  if (!Array.isArray(entries)) throw new Error('E_GLOSSARY_SHAPE: lore/glossary.json must be an array of terms')
  const ids = new Set()
  for (const entry of entries) {
    const id = entry?.term_id
    if (ids.has(id)) throw new Error(`E_GLOSSARY_DUPLICATE:${id}`)
    ids.add(id)
    for (const field of textFields) if (typeof entry[field] !== 'string' || !entry[field].trim()) throw new Error(`E_GLOSSARY_FIELD:${id}:${field}`)
    for (const field of aliasFields) if (!Array.isArray(entry[field]) || entry[field].some((alias) => typeof alias !== 'string' || !alias.trim())) throw new Error(`E_GLOSSARY_FIELD:${id}:${field}`)
    if (!glossarySections.some(({ categories }) => categories.includes(entry.category))) throw new Error(`E_GLOSSARY_CATEGORY:${id}:${entry.category}`)
  }
  const content = [{ kind: 'heading', anchor: 'glossary', depth: 1, text: { ko: '용어 사전', en: 'Glossary' } }]
  glossarySections.forEach((section, index) => {
    const terms = entries.filter(({ category }) => section.categories.includes(category))
    if (!terms.length) return
    const anchor = `glossary-s${index + 1}`
    content.push(
      { kind: 'heading', anchor, depth: 2, text: { ko: section.ko, en: section.en } },
      {
        kind: 'list',
        anchor: `${anchor}-terms`,
        ordered: false,
        items: terms.map((term) => ({
          ko: item(term.display_name_ko, term.reader_definition_ko, term.aliases, '별칭'),
          en: item(term.display_name_en, term.reader_definition_en, term.aliases_en, 'also called'),
        })),
      },
    )
  })
  return {
    version: 1,
    domain: 'root',
    id: 'DOC:Glossary',
    slug: 'Glossary',
    locales: { ko: { title: '용어 사전' }, en: { title: 'Glossary' } },
    source: { kind: 'computed', refs: ['lore/glossary.json'] },
    content,
  }
}
