import { openReadOnly } from './cast-sqlite/db.mjs'
import { readPublicProjection, readPublicProjectionAsync } from './cast-sqlite/public-projection.mjs'
import { fileURLToPath } from 'node:url'

// Preserve property-style synchronous consumers without opening SQLite on import.
// The API replaces this lazy binding with its PostgreSQL projection before use.
function synchronousProjection() {
  if (mapProjection !== lazyProjection) return mapProjection
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? fileURLToPath(new URL('../data/canonical/wiki-cast.sqlite', import.meta.url)))
  try { mapProjection = readPublicProjection(db, 'map') } finally { db.close() }
  return mapProjection
}
const lazyProjection = new Proxy({}, {
  get: (_target, key) => Reflect.get(synchronousProjection(), key),
  ownKeys: () => Reflect.ownKeys(synchronousProjection()),
  getOwnPropertyDescriptor: (_target, key) => Reflect.getOwnPropertyDescriptor(synchronousProjection(), key),
})
export let mapProjection = lazyProjection

/** Load once before serving. The live binding is process-wide, not per-server. */
export async function loadMapProjection(db) {
  mapProjection = await readPublicProjectionAsync(db, 'map')
  return mapProjection
}

// Only the public reader boundary changes; approved authoring and its receipts stay intact.
export function publicMapContent(document) {
  const projection = mapProjection
  if (document.slug !== projection.slug) return document
  const result = structuredClone(document)
  for (const row of projection.summaries) {
    if (result.locales?.[row.locale]?.summary !== row.before) throw new Error(`E_MAP_PUBLIC_PROJECTION:summary:${row.locale}`)
    result.locales[row.locale].summary = row.after
  }
  for (const row of projection.blocks) {
    const matches = result.content.filter(node => node.anchor === row.anchor)
    const node = matches[0]
    if (matches.length !== 1 || node.kind !== 'paragraph' ||
      Object.entries(row.before).some(([locale, before]) => node.text?.[locale] !== before)) {
      throw new Error(`E_MAP_PUBLIC_PROJECTION:${row.anchor}`)
    }
    if (row.after === null) result.content = result.content.filter(candidate => candidate !== node)
    else node.text = { ...node.text, ...row.after }
  }
  return result
}
