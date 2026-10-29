import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPublicProjection, readPublicProjectionAsync } from './cast-sqlite/public-projection.mjs'
import { fileURLToPath } from 'node:url'

// Preserve property-style synchronous consumers without opening SQLite on import.
// The API replaces this lazy binding with its PostgreSQL projection before use.
function synchronousProjection() {
  if (officeProjection !== lazyProjection) return officeProjection
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? fileURLToPath(new URL('../data/canonical/wiki-cast.sqlite', import.meta.url)))
  try { officeProjection = readPublicProjection(db, 'office') } finally { db.close() }
  return officeProjection
}
const lazyProjection = new Proxy({}, {
  get: (_target, key) => Reflect.get(synchronousProjection(), key),
  ownKeys: () => Reflect.ownKeys(synchronousProjection()),
  getOwnPropertyDescriptor: (_target, key) => Reflect.getOwnPropertyDescriptor(synchronousProjection(), key),
})
export let officeProjection = lazyProjection

/** Load once before serving. The live binding is process-wide, not per-server. */
export async function loadOfficeProjection(db) {
  officeProjection = await readPublicProjectionAsync(db, 'office')
  return officeProjection
}

export function publicOfficeContent(document) {
  const projection = officeProjection
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
