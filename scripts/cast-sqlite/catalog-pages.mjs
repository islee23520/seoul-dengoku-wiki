import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { listDocuments, readDocument } from './document-read.mjs';
import { listGlossaryEntries, readGlossaryHead } from './glossary-store.mjs';
import { orderDocumentKeys } from './document-key-order.mjs';

const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);

export function readCatalogGlossary(db) {
  const routes = db.prepare(`SELECT json_extract(derivation_json,'$.version') AS version,
    json_extract(derivation_json,'$.review') AS review,
    json_extract(derivation_json,'$.materialized') AS materialized,
    json_array_length(derivation_json,'$.sourceBindings') AS binding_count,
    json_extract(derivation_json,'$.sourceBindings[0].sourcePath') AS source_path,
    json_extract(derivation_json,'$.sourceBindings[0].sha256') AS source_sha256
    FROM article_route WHERE derivation='computed-glossary'`).all();
  if (routes.length !== 1) throw new Error('E_GLOSSARY_DB_ADMISSION');
  const metadata = routes[0];
  const archive = db.prepare('SELECT sha256 FROM glossary_archive WHERE singleton=1').get();
  if (metadata.version !== 1 || metadata.review !== 'authenticated-current-reviewed'
    || metadata.materialized !== 0 || metadata.binding_count !== 1
    || metadata.source_path !== 'lore/glossary.json'
    || metadata.source_sha256 !== archive?.sha256) throw new Error('E_GLOSSARY_DB_ADMISSION');
  const head = readGlossaryHead(db);
  const entries = listGlossaryEntries(db, { visibility: 'internal' });
  if (head.parentRevision !== null || head.sequence !== 0
    || createHash('sha256').update(canonical(entries)).digest('hex') !== head.contentSha256) {
    throw new Error('E_GLOSSARY_DB_ADMISSION');
  }
  return entries;
}

/** Internal build inputs. Exact stored source names preserve publisher routes.
 * This never opens logical paths or grants publication eligibility.
 */
export function readCatalogPages(db) {
  const slugs = new Set();
  return listDocuments(db, { corpusKind: 'current', visibility: 'internal' })
    .filter(identity => /^lore\//u.test(identity.logical_path)
      && !/^lore\/(?:name-pools|regions|editorial|sources)\//u.test(identity.logical_path)
      && !basename(identity.logical_path).startsWith('authoring.'))
    .map(identity => {
      const slug = basename(identity.logical_path, '.json');
      if (slugs.has(slug)) throw new Error(`E_DUPLICATE_LORE_SLUG:${slug}`);
      slugs.add(slug);
      const document = readDocument(db, { documentId: identity.document_id, domain: identity.domain,
        corpusKind: identity.corpus_kind, visibility: 'internal' });
      return { path: identity.logical_path, value: orderDocumentKeys(db, identity.source_id, document), slug };
    });
}
