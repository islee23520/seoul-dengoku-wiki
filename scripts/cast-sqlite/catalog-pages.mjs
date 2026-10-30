import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { listDocuments, listDocumentsAsync, readDocument, readDocumentAsync } from './document-read.mjs';
import { listGlossaryEntries, listGlossaryEntriesAsync, readGlossaryHead, readGlossaryHeadAsync } from './glossary-store.mjs';
import { orderDocumentKeys, orderDocumentKeysAsync } from './document-key-order.mjs';


const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
 : value !== null && typeof value === 'object'
  ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);
/** PostgreSQL twin. tx.all returns rows directly; preserve the SQLite admission contract. */
export async function readCatalogGlossaryAsync(tx) {
 const query = async (sql, ...bindings) => {
  // glossary-store async helpers pass one pre-built params array; accept both
  // a single array argument and spread scalars without double-wrapping.
  const params = bindings.length === 1 && Array.isArray(bindings[0]) ? bindings[0] : bindings;
  const rows = await tx.all(sql, params);
  return { rows };
 };
// PostgreSQL jsonb operators replace SQLite json_extract/json_array_length.
 const routes = await query(`SELECT (derivation_json::jsonb ->> 'version')::int AS version,
   derivation_json::jsonb ->> 'review' AS review,
   CASE WHEN derivation_json::jsonb ->> 'materialized' IN ('true','1') THEN 1 ELSE 0 END AS materialized,
   jsonb_array_length(derivation_json::jsonb -> 'sourceBindings') AS binding_count,
   derivation_json::jsonb #>> '{sourceBindings,0,sourcePath}' AS source_path,
   derivation_json::jsonb #>> '{sourceBindings,0,sha256}' AS source_sha256
   FROM wiki.article_route WHERE derivation='computed-glossary'`);
 if (routes.rows.length !== 1) throw new Error('E_GLOSSARY_DB_ADMISSION');
 const metadata = routes.rows[0];
 const archive = (await query('SELECT sha256 FROM wiki.glossary_archive WHERE singleton=1')).rows[0];
 if (metadata.version !== 1
  || metadata.materialized !== 0 || metadata.binding_count !== 1
  || metadata.source_path !== 'lore/glossary.json'
  || metadata.source_sha256 !== archive?.sha256) throw new Error('E_GLOSSARY_DB_ADMISSION');
 const head = await readGlossaryHeadAsync({ query });
 const entries = await listGlossaryEntriesAsync({ query }, { visibility: 'internal' });
 if (createHash('sha256').update(canonical(entries)).digest('hex') !== head.contentSha256) {
  throw new Error('E_GLOSSARY_DB_ADMISSION');
 }
 return entries;
}

/** Async twin of readCatalogPages; filtering and duplicate-slug checks match SQLite. */
export async function readCatalogPagesAsync(tx) {
 const slugs = new Set();
 const identities = (await listDocumentsAsync(tx, { corpusKind: 'current', visibility: 'internal' }))
  .filter(identity => /^lore\//u.test(identity.logical_path)
   && !/^lore\/(?:name-pools|regions|editorial|sources)\//u.test(identity.logical_path)
   && !basename(identity.logical_path).startsWith('authoring.'));
 const pages = [];
 for (const identity of identities) {
  const slug = basename(identity.logical_path, '.json');
  if (slugs.has(slug)) throw new Error(`E_DUPLICATE_LORE_SLUG:${slug}`);
  slugs.add(slug);
  const document = await readDocumentAsync(tx, {
   documentId: identity.document_id, domain: identity.domain,
   corpusKind: identity.corpus_kind, visibility: 'internal'
  });
  pages.push({ path: identity.logical_path, value: await orderDocumentKeysAsync(tx, identity.source_id, document), slug });
 }
 return pages;
}

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
 if (metadata.version !== 1
  || metadata.materialized !== 0 || metadata.binding_count !== 1
  || metadata.source_path !== 'lore/glossary.json'
  || metadata.source_sha256 !== archive?.sha256) throw new Error('E_GLOSSARY_DB_ADMISSION');
 const head = readGlossaryHead(db);
 const entries = listGlossaryEntries(db, { visibility: 'internal' });
 if (createHash('sha256').update(canonical(entries)).digest('hex') !== head.contentSha256) {
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
   const document = readDocument(db, {
    documentId: identity.document_id, domain: identity.domain,
    corpusKind: identity.corpus_kind, visibility: 'internal'
   });
   return { path: identity.logical_path, value: orderDocumentKeys(db, identity.source_id, document), slug };
  });
}
