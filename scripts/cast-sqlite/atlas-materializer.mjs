import { materializeWorldAtlas as materializeFilesystemAtlas } from '../materialize-world-atlas.mjs'
import { projectionsFromAtlas } from '../world-atlas-render.mjs'
import { ATLAS_SCHEMA, PROJECTION_PATHS, PROJECTION_PATH_SET, canonicalJson } from '../world-atlas-schema.mjs'
import { atlasPeopleContext } from '../atlas-people-context.mjs'
import { verifyAtlasPeople } from '../world-atlas-verify.mjs'

const atlasGeneratedName = /^(?:Operating-Houses|Regional-Physical-AI-Arcs|Synthetic-Actors|World-Expansion-Index|World-Relation-Ledger|External-Theaters|Hostile-Ecology-Index|Hostile-Group-G\d{2}|Unexpected-Atlas|Monster-Batch-.+|Story-Batch-.+|(?:Monster|Story)-Batch-Manifest)\.(?:json|md)$/u

async function checkDatabaseOutputs(db, projection, peopleContext) {
  const { listDocuments, readDocument } = await import('./document-read.mjs')
  const { orderDocumentKeys } = await import('./document-key-order.mjs')
  const identities = listDocuments(db, { corpusKind: 'current', visibility: 'internal' })
  const read = (path) => {
    const logicalPath = `lore/${path}`
    const matches = identities.filter(identity => identity.logical_path === logicalPath)
    if (matches.length !== 1) throw new Error(`E_PROJECTION_MISSING:${path}`)
    const identity = matches[0]
    return { sourceId: identity.source_id, sourceSha256: identity.sha256,
      document: readDocument(db, { documentId: identity.document_id, domain: identity.domain,
        corpusKind: identity.corpus_kind, visibility: 'internal' }) }
  }
  const { document: typedAtlas, sourceId, sourceSha256: atlasHash } = read('World-Narrative-Atlas.json')
  const document = orderDocumentKeys(db, sourceId, typedAtlas)
  if (document.id !== 'WNA-001' || document.data?.atlas?.schema !== ATLAS_SCHEMA) throw new Error('E_ATLAS_DATA')
  const context = peopleContext ?? await atlasPeopleContext(undefined, { db })
  const { failures } = verifyAtlasPeople(document.data.atlas, context)
  if (failures.length) throw new Error(failures.join('\n'))
  const expected = projectionsFromAtlas(document, atlasHash)
  const paths = Object.keys(expected)
  if (paths.length !== PROJECTION_PATHS.length || paths.some(path => !PROJECTION_PATH_SET.has(path))) throw new Error('E_PROJECTION_SET')
  for (const path of projection ? [projection] : PROJECTION_PATHS) {
    if (canonicalJson(read(path).document) !== canonicalJson(expected[path])) throw new Error(`E_PROJECTION_STALE:${path}`)
  }
  for (const identity of identities) {
    if (!identity.logical_path.startsWith('lore/')) continue
    const path = identity.logical_path.slice(5)
    const name = path.split('/').at(-1)
    if (!atlasGeneratedName.test(name) || PROJECTION_PATH_SET.has(path)) continue
    const misplaced = PROJECTION_PATHS.some(expectedPath => expectedPath.split('/').at(-1) === name)
    throw new Error(`E_PROJECTION_${misplaced ? 'MISPLACED' : 'UNEXPECTED'}:${path}`)
  }
  return { atlasHash, projections: projection ? [projection] : [...PROJECTION_PATHS] }
}


export async function materializeWorldAtlas(options = {}) {
  const { projection, check = false, peopleContext, db,
    dbPath = process.env.WIKI_DOCUMENT_DB } = options
  if (projection && !PROJECTION_PATH_SET.has(projection)) throw new Error(`E_PROJECTION_NAME:${projection}`)
  if (!db && dbPath === undefined) return materializeFilesystemAtlas(options)
  if (!check) throw new Error('E_ATLAS_DB_READ_ONLY')
  if (db) return checkDatabaseOutputs(db, projection, peopleContext)
  const { openReadOnly } = await import('./db.mjs')
  const connection = openReadOnly(dbPath)
  try { return await checkDatabaseOutputs(connection, projection, peopleContext) }
  finally { connection.close() }
}
