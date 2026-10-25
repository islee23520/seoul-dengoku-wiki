import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export const PUBLIC_PROJECTION_PINS = {
  office: 'd0fbb1fcae047ca830832c9eff4ccd95cf4583a7ab7403ba90161ada4a8708da',
  map: '6ea65e2c9702b41b35fb77dbb8263f4732f67092b8a8ef5b13eb914386b1f464',
}

// Migration of the two existing publication rules only; never invent wording or approval.
export function initializePublicProjections(db, { sources, actor, reason }) {
  if (db.isTransaction || !actor || !reason) throw new Error('E_PUBLIC_PROJECTION_IMPORT')
  const documents = Object.fromEntries(Object.entries(PUBLIC_PROJECTION_PINS).map(([kind, pin]) => {
    const bytes = sources[kind]
    if (!(bytes instanceof Uint8Array) || createHash('sha256').update(bytes).digest('hex') !== pin)
      throw new Error('E_PUBLIC_PROJECTION_IMPORT')
    return [kind, JSON.parse(Buffer.from(bytes))]
  }))
  db.exec('BEGIN IMMEDIATE')
  try {
    db.exec(readFileSync(new URL('./public-projection.sql', import.meta.url), 'utf8'))
    for (const [kind, document] of Object.entries(documents)) db.prepare('INSERT INTO public_projection_document VALUES(?,?,?,?,?,?)')
      .run(kind, document.slug, document.removeAnchor ?? null, PUBLIC_PROJECTION_PINS[kind], actor, reason)
    documents.office.replacements.forEach((row, ordinal) => db.prepare('INSERT INTO public_office_replacement VALUES(?,?,?,?,?,?,?)')
      .run(ordinal, row.anchor, row.locale, row.row ?? null, row.column ?? null, row.before, row.after))
    documents.map.summaries.forEach((row, ordinal) => db.prepare('INSERT INTO public_map_summary VALUES(?,?,?,?)')
      .run(ordinal, row.locale, row.before, row.after))
    documents.map.blocks.forEach((row, ordinal) => {
      db.prepare('INSERT INTO public_map_block VALUES(?,?,?)').run(ordinal, row.anchor, Number(row.after === null))
      Object.entries(row.before).forEach(([locale, text], index) => db.prepare('INSERT INTO public_map_block_locale VALUES(?,?,?,?,?)')
        .run(ordinal, index, locale, text, row.after?.[locale] ?? null))
    })
    db.exec('COMMIT')
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error }
}

export function readPublicProjection(db, kind) {
  if (!Object.hasOwn(PUBLIC_PROJECTION_PINS, kind)) throw new Error('E_PUBLIC_PROJECTION_KIND')
  const root = db.prepare('SELECT * FROM public_projection_document WHERE kind=?').get(kind)
  if (!root || root.source_sha256 !== PUBLIC_PROJECTION_PINS[kind]) throw new Error('E_PUBLIC_PROJECTION_SOURCE')
  if (kind === 'office') return { slug: root.slug, removeAnchor: root.remove_anchor,
    replacements: db.prepare('SELECT * FROM public_office_replacement ORDER BY ordinal').all().map(row => ({
      anchor: row.anchor, ...(row.row_number === null ? {} : { row: row.row_number, column: row.column_number }),
      locale: row.locale, before: row.before_text, after: row.after_text,
    })) }
  return { slug: root.slug, summaries: db.prepare('SELECT * FROM public_map_summary ORDER BY ordinal').all()
    .map(row => ({ locale: row.locale, before: row.before_text, after: row.after_text })),
  blocks: db.prepare('SELECT * FROM public_map_block ORDER BY ordinal').all().map(row => {
    const locales = db.prepare('SELECT * FROM public_map_block_locale WHERE block_ordinal=? ORDER BY ordinal').all(row.ordinal)
    return { anchor: row.anchor, before: Object.fromEntries(locales.map(value => [value.locale, value.before_text])),
      after: row.removed ? null : Object.fromEntries(locales.map(value => [value.locale, value.after_text])) }
  }) }
}
