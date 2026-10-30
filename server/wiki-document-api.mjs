import { createServer } from 'node:http';
import { constants } from 'node:fs';
import { open, readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { createReader } from '../scripts/cast-sqlite/db-pg.mjs';
import { listDocumentsAsync, readDocumentAsync } from '../scripts/cast-sqlite/document-read.mjs';
import { orderDocumentKeysAsync } from '../scripts/cast-sqlite/document-key-order.mjs';
import { readCatalogMetadataDocumentAsync, CATEGORY_REGISTRY_PATH } from '../scripts/cast-sqlite/catalog-metadata.mjs';
import { admissionDocuments, publishedDocuments, catalogSourceEligible } from '../scripts/catalog-publication.mjs';
import { registrationErrors } from '../scripts/category-publication.mjs';
import { localizedDocuments } from '../scripts/localized-documents.mjs';
import { renderLoreMarkdown } from '../scripts/lore-json-render.mjs';
import { publicHouseContent } from '../scripts/public-house-content.mjs';
import { loadOfficeProjection, publicOfficeContent } from '../scripts/public-office-content.mjs';
import { loadMapProjection, publicMapContent } from '../scripts/public-map-content.mjs';
import { readComputedArticleAsync } from '../scripts/cast-sqlite/computed-articles.mjs';
import { readPersonDispositionAsync } from '../scripts/cast-sqlite/person-disposition.mjs';
import { readRetirementProseAsync, projectRetirementProse } from '../scripts/cast-sqlite/retirement-prose.mjs';
import { projectActivePersonIndex } from '../scripts/person-roster-projection.mjs';


// Routes are derived from the exact logical source names used by the catalog.
function renderDocument(document, locale, mapping, mappings, currentRoster) {
 const current = currentRoster ? projectRetirementProse(document, mapping.logical_path, currentRoster.prose) : document;
 const projected = projectActivePersonIndex(publicMapContent(publicOfficeContent(publicHouseContent(current))),
  currentRoster?.ids, currentRoster?.routes);
 const [, domain, slug] = mapping.route.split('/');
 const localized = localizedDocuments({
  domain, slug, json: projected,
  renderJson: (value, language) => renderLoreMarkdown(value, language, (_domain, slug) =>
   `lore/${value.domain === 'root' ? '' : `${value.domain}/`}${slug}.md`),
 }).find((entry) => entry.locale === locale);
 return articleBody(localized.title, mapping.route, localized.markdown, mappings);
}

function articleBody(title, route, markdown, mappings) {
 const reviewText = markdown.replace(/^#\s+.+\n+/m, '')
  .replace(/\]\((?!\/|#|[a-z][a-z0-9+.-]*:)([^)#]+)\.md(#[^)]*)?\)/giu,
   (match, path, anchor = '') => {
    const targetSlug = path.split('/').at(-1);
    const targets = mappings.filter((entry) => entry.slug === targetSlug || entry.route.split('/').at(-1) === targetSlug);
    if (targets.length !== 1) return match;
    return `](${targets[0].route}${anchor})`;
   });
 const blocks = fromMarkdown(reviewText, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }).children;
 const removePositions = (node) => {
  delete node.position;
  for (const child of node.children ?? []) removePositions(child);
 };
 for (const block of blocks) removePositions(block);
 return { title, route, blocks, reviewText };
}

const EXPECTED_META_URL = new URL('../scripts/postgres-migration/schema-pg/metadata.json', import.meta.url);

/** Fail closed unless wiki.meta binds the exact release inputs the data was
 * loaded from. schema_version and source_sha256 are separate fields and are
 * compared as such — never a Git SHA against a database hash. */
async function assertReleaseMetadata(reader) {
 const expected = JSON.parse(await readFile(EXPECTED_META_URL, 'utf8'));
 const meta = await reader.get('SELECT schema_version, source_sha256 FROM wiki.meta');
 if (!meta || meta.schema_version !== expected.schema_version || meta.source_sha256 !== expected.source_sha256) {
  throw Object.assign(new Error(`WIKI_DOCUMENT_META_MISMATCH: wiki.meta (schema_version=${meta?.schema_version}, source_sha256=${meta?.source_sha256})`
   + ` does not match release metadata (schema_version=${expected.schema_version}, source_sha256=${expected.source_sha256})`), { code: 'WIKI_DOCUMENT_META_MISMATCH' });
 }
 return meta;
}

export async function createWikiDocumentServer({ pgUrl = process.env.WIKI_DOCUMENT_PG,
 pgFile = process.env.WIKI_DOCUMENT_PG_FILE, role = 'wiki_reader' } = {}) {
 if (pgUrl !== undefined && pgFile !== undefined) throw new Error('Select exactly one document PG configuration source');
 if (pgFile !== undefined) {
  let handle;
  try {
   if (typeof pgFile !== 'string' || !pgFile) throw new Error();
   handle = await open(pgFile, constants.O_RDONLY | constants.O_NOFOLLOW);
   const info = await handle.stat();
   if (!info.isFile() || (info.mode & 0o7777) !== 0o600
    || typeof process.getuid !== 'function' || info.uid !== process.getuid()) throw new Error();
   pgUrl = await handle.readFile('utf8');
  } catch { throw new Error('Document PG file must be an owner-only regular file owned by the runtime user'); }
  finally { await handle?.close(); }
 }
 if (typeof pgUrl !== 'string' || !pgUrl.trim() || /[\r\n\0]/u.test(pgUrl.trim()))
  throw new Error('Document PG configuration is required and must be a single line');
 pgUrl = pgUrl.trim();
 const reader = createReader({ connectionString: pgUrl, role });
 try {
  await assertReleaseMetadata(reader);
  // Release-static publication projections never open the SQLite archive.
  await loadOfficeProjection(reader);
  await loadMapProjection(reader);
 } catch (error) {
  await reader.close();
  throw error;
 }
 const server = createServer((request, response) => {
  const send = (status, body) => {
   response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
   });
   response.end(JSON.stringify(body));
  };
  let url, parts;
  try {
   url = new URL(request.url, 'http://localhost');
   parts = url.pathname.split('/').map(decodeURIComponent);
  } catch { send(400, { error: 'Invalid request' }); return; }
  if (request.method !== 'GET') { send(405, { error: 'Method not allowed' }); return; }
  const locales = url.searchParams.getAll('locale');
  if ([...url.searchParams.keys()].some((key) => key !== 'locale') || locales.length > 1
   || (locales.length && locales[0] !== 'ko')) {
   send(400, { error: 'Invalid request' }); return;
  }
  const locale = locales[0] ?? 'ko';
  if (parts.length === 6 && parts[4] === 'world' && parts[5] === 'index') parts[5] = '';
  const list = parts.length === 4;
  if (parts.slice(0, 4).join('/') !== '/wiki/api/documents' || (!list && parts.length !== 6)
   || (!list && (!/^[\p{L}\p{N}_-]+$/u.test(parts[4]) || (parts[5] !== '' && !/^[\p{L}\p{N}_-]+$/u.test(parts[5]))))) {
   send(404, { error: 'Not found' }); return;
  }
  void (async () => {
   try {
    // All admission and envelope checks share one read snapshot on one
    // leased connection; edits between requests invalidate admission, and
    // can never race title against body. COLLATE "C" keeps SQLite's
    // byte-order route ordering (the database collation is not binary).
    const publicDocuments = await reader.transaction(async (tx) => {
     const documents = [];
     const identities = (await listDocumentsAsync(tx, { corpusKind: 'current', visibility: 'internal' })).filter(catalogSourceEligible);
     const pages = [];
     const slugs = new Set();
     for (const identity of identities) {
      const slug = basename(identity.logical_path, '.json');
      if (slugs.has(slug)) throw new Error(`E_DUPLICATE_LORE_SLUG:${slug}`);
      slugs.add(slug);
      await tx.exec('SAVEPOINT candidate_read');
      let succeeded = false;
      try {
       const document = await readDocumentAsync(tx, {
        corpusKind: 'current', domain: identity.domain, documentId: identity.document_id, visibility: 'internal'
       });
       if (document && document.readMetadata.source_id === identity.source_id) {
        pages.push({ path: identity.logical_path, slug, value: await orderDocumentKeysAsync(tx, identity.source_id, document) });
       }
       succeeded = true;
      } catch (error) {
       if (error.code !== 'E_DOCUMENT_SCHEMA_GAP' && error.code !== 'E_DOCUMENT_AMBIGUOUS') throw error;
      } finally {
       if (succeeded) await tx.exec('RELEASE SAVEPOINT candidate_read');
       else {
        await tx.exec('ROLLBACK TO SAVEPOINT candidate_read');
        await tx.exec('RELEASE SAVEPOINT candidate_read');
       }
      }
     }
     const registry = await readCatalogMetadataDocumentAsync(tx, CATEGORY_REGISTRY_PATH);
     const admission = admissionDocuments(registry);
     for (const page of pages) admission.addPage(page);
     admission.addWorldIndex();
     const published = admission.sorted().flatMap(document => {
      try { return publishedDocuments([document]); }
      catch (error) {
       if (error.code === 'E_PUBLICATION_DISCOVERY') return [];
       throw error;
      }
     });
     const routes = (await tx.query("SELECT route,source_id,derivation,derivation_json FROM wiki.article_route WHERE derivation IN ('computed-index', 'computed-glossary') ORDER BY route COLLATE \"C\"")).rows;
     let currentRoster;
     if (await tx.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='person_disposition'")) {
      const dispositions = await readPersonDispositionAsync(tx);
      const ids = new Set([...dispositions].filter(([, row]) => row.status === 'active').map(([id]) => id));
      const activeRoutes = new Set((await tx.query('SELECT person_id,public_route FROM wiki.person')).rows
       .filter(row => ids.has(row.person_id)).map(row => row.public_route));
      currentRoster = {
       ids, routes: activeRoutes,
       prose: await tx.get("SELECT 1 FROM information_schema.tables WHERE table_schema='wiki' AND table_name='retirement_prose'")
        ? await readRetirementProseAsync(tx) : []
      };
     }
     const mappings = [];
     for (const publishedDocument of published) {
      const page = pages.find(entry => entry.path === publishedDocument.source);
      if (!page || registrationErrors(page.value, registry, page.slug).length) continue;
      const matching = identities.filter(entry => entry.logical_path === page.path && entry.document_id === page.value.id && entry.domain === page.value.domain);
      if (matching.length !== 1 || !/^\/world\/[\p{L}\p{N}_-]+$/u.test(publishedDocument.route)) continue;
      mappings.push({ ...matching[0], route: publishedDocument.route, document: page.value });
     }
     const admittedMappings = [];
     for (const identity of mappings) {
      await tx.exec('SAVEPOINT document_read');
      let succeeded = false;
      try {
       const document = identity.document;
       admittedMappings.push({ ...identity, titles: { ko: document.locales.ko.title } });
       if (list || identity.route === `/${parts[4]}/${parts[5]}`) documents.push(renderDocument(document, locale, identity, mappings, currentRoster));
       succeeded = true;
      } catch (error) {
       if (error.code !== 'E_DOCUMENT_SCHEMA_GAP' && error.code !== 'E_DOCUMENT_AMBIGUOUS'
        && !/^(E_OFFICE_PUBLIC_PROJECTION|E_MAP_PUBLIC_PROJECTION|E_LOCALE_MISSING):/u.test(error.message)) throw error;
      } finally {
       if (succeeded) await tx.exec('RELEASE SAVEPOINT document_read');
       else {
        await tx.exec('ROLLBACK TO SAVEPOINT document_read');
        await tx.exec('RELEASE SAVEPOINT document_read');
       }
      }
     }
     for (const mapping of routes.filter(row => ['computed-index', 'computed-glossary'].includes(row.derivation))) {
      if (!published.some(document => document.route === mapping.route && document.source === (mapping.derivation === 'computed-glossary' ? 'lore/glossary.json' : 'scripts/build-world-index.mjs'))
       || !/^\/[\p{L}\p{N}_-]+\/[\p{L}\p{N}_-]*$/u.test(mapping.route)
       || (!list && mapping.route !== `/${parts[4]}/${parts[5]}`)) continue;
      // Computed derivations read typed dependencies and may hit the same
      // schema gaps; isolate each one so one bad derivation cannot abort the
      // remaining snapshot.
      await tx.exec('SAVEPOINT computed_read');
      let computedOk = false;
      try {
       const computed = await readComputedArticleAsync(tx, mapping, admittedMappings, locale);
       if (computed) documents.push(articleBody(computed.title, mapping.route, computed.markdown, admittedMappings));
       computedOk = true;
      } catch (error) {
       // Same tolerance as the document loop: schema gaps decline this one
       // computed article while the finally block restores the savepoint;
       // anything else fails the request after restoration.
       if (error.code !== 'E_DOCUMENT_SCHEMA_GAP' && error.code !== 'E_DOCUMENT_AMBIGUOUS'
        && error.code !== 'E_GLOSSARY_NOT_FOUND' && error.code !== 'E_GLOSSARY_REVISION'
        && !/^E_COMPUTED/u.test(error.code ?? error.message)
        && !/^(E_OFFICE_PUBLIC_PROJECTION|E_MAP_PUBLIC_PROJECTION|E_LOCALE_MISSING):/u.test(error.message)) throw error;
      } finally {
       if (computedOk) await tx.exec('RELEASE SAVEPOINT computed_read');
       else {
        await tx.exec('ROLLBACK TO SAVEPOINT computed_read');
        await tx.exec('RELEASE SAVEPOINT computed_read');
       }
      }
     }
     return documents;
    }, { readOnly: true });
    if (list) send(200, publicDocuments.map(({ title, route }) => ({ title, route })));
    else if (publicDocuments.length === 1) send(200, publicDocuments[0]);
    else send(404, { error: 'Not found' });
   } catch {
    send(503, { error: 'Documents unavailable' });
   }
  })();
 });
 server.on('close', () => { void reader.close(); });
 return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 createWikiDocumentServer().then((server) => {
  server.listen(Number(process.env.PORT ?? 8788), process.env.HOST ?? '127.0.0.1', () => {
   const { port } = server.address();
   process.send?.({ type: 'ready', port });
   console.log(`wiki-document-api ready ${port}`);
  });
  const close = () => server.close(() => {
   if (process.connected) process.disconnect();
  });
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
  process.on('disconnect', close);
 }).catch((error) => {
  // Unreachable PostgreSQL is a hard startup failure — there is no SQLite fallback.
  console.error(error?.message ?? error);
  process.exit(1);
 });
}
