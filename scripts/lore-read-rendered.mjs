// Render the current typed document without opening its old source path.
import { resolve } from 'node:path'
import { renderLoreMarkdown } from './lore-json-render.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { listDocuments, readDocument } from './cast-sqlite/document-read.mjs'
import { readRetirementProse, projectRetirementProse } from './cast-sqlite/retirement-prose.mjs'

export function readRendered(loreRoot, domain, slug) {
  const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(loreRoot, '../data/canonical/wiki-cast.sqlite'))
  try {
    const identity = listDocuments(db, { corpusKind: 'current', domain, visibility: 'internal' })
      .find(document => document.slug === slug)
    if (!identity) throw new Error(`E_DOCUMENT_NOT_FOUND:${domain}/${slug}`)
    const document = readDocument(db, { corpusKind: 'current', domain,
      documentId: identity.document_id, visibility: 'internal' })
    const changes = db.prepare("SELECT 1 FROM sqlite_schema WHERE name='retirement_prose'").get() ? readRetirementProse(db) : []
    return renderLoreMarkdown(projectRetirementProse(document, identity.logical_path, changes), 'ko')
  } finally { db.close() }
}
