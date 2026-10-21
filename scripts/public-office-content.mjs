import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPublicProjection } from './cast-sqlite/public-projection.mjs'
import { fileURLToPath } from 'node:url'

export const officeProjection = (() => {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? fileURLToPath(new URL('../data/canonical/wiki-cast.sqlite', import.meta.url)))
  try { return readPublicProjection(db, 'office') } finally { db.close() }
})()
const projection = officeProjection

export function publicOfficeContent(document) {
  if (document.slug !== projection.slug) return document
  const result = structuredClone(document)
  for (const row of projection.replacements) {
    const node = result.content.find(node => node.anchor === row.anchor)
    const leaf = row.row === undefined ? node?.text : node?.rows[row.row]?.[row.column]
    if (leaf?.[row.locale] !== row.before) throw new Error('E_OFFICE_PUBLIC_PROJECTION:' + row.anchor)
    leaf[row.locale] = row.after
  }
  result.content = result.content.filter(node => node.anchor !== projection.removeAnchor)
  return result
}
