import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { createReader } from '../scripts/cast-sqlite/db-pg.mjs';
import { listDocumentsAsync, readDocumentAsync } from '../scripts/cast-sqlite/document-read.mjs';
import { localizedDocuments } from '../scripts/localized-documents.mjs';
import { renderLoreMarkdown } from '../scripts/lore-json-render.mjs';
import { publicHouseContent } from '../scripts/public-house-content.mjs';
import { loadOfficeProjection, publicOfficeContent } from '../scripts/public-office-content.mjs';
import { loadMapProjection, publicMapContent } from '../scripts/public-map-content.mjs';
import { readComputedArticleAsync } from '../scripts/cast-sqlite/computed-articles.mjs';
import { readPersonDispositionAsync } from '../scripts/cast-sqlite/person-disposition.mjs';
import { readRetirementProseAsync, projectRetirementProse } from '../scripts/cast-sqlite/retirement-prose.mjs';
import { projectActivePersonIndex } from '../scripts/person-roster-projection.mjs';

const selector = (identity) => ({
 corpusKind: 'current', domain: identity.domain,
 documentId: identity.document_id, visibility: 'public'
});

// The reviewed DB route is authoritative; an envelope slug is not a URL alias.
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
 return articleBody(localized.title, `${locale === 'ko' ? '' : '/en'}${mapping.route}`, localized.markdown, locale, mappings);
}

function articleBody(title, route, markdown, locale, mappings) {
 const reviewText = markdown.replace(/^#\s+.+\n+/m, '')
  .replace(/\]\((?!\/|#|[a-z][a-z0-9+.-]*:)([^)#]+)\.md(#[^)]*)?\)/giu,
   (match, path, anchor = '') => {
    const targetSlug = path.split('/').at(-1);
    const targets = mappings.filter((entry) => entry.slug === targetSlug);
    if (targets.length !== 1) return match;
    return `](${locale === 'ko' ? '' : '/en'}${targets[0].route}${anchor})`;
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

export async function createWikiDocumentServer({ pgUrl = process.env.WIKI_DOCUMENT_PG, role = 'wiki_reader' } = {}) {
 if (typeof pgUrl !== 'string' || !pgUrl.trim()) throw new Error('WIKI_DOCUMENT_PG is required');
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
   || (locales.length && !['ko', 'en'].includes(locales[0]))) {
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
     const identities = await listDocumentsAsync(tx, { corpusKind: 'current', visibility: 'internal' });
     const routes = (await tx.query('SELECT route,source_id,derivation,derivation_json FROM wiki.article_route ORDER BY route COLLATE "C"')).rows;
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
     for (const row of routes) {
      if (row.derivation !== 'typed-envelope' || !/^\/[\p{L}\p{N}_-]+\/[\p{L}\p{N}_-]+$/u.test(row.route)
       || routes.filter((entry) => entry.route === row.route || entry.source_id === row.source_id).length !== 1) continue;
      const identity = identities.find((entry) => entry.source_id === row.source_id);
      let metadata;
      try { metadata = JSON.parse(row.derivation_json); } catch { continue; }
      if (!identity || metadata.documentId !== identity.document_id || metadata.domain !== identity.domain
       || metadata.envelopeSlug !== identity.slug || metadata.materialized !== true) continue;
      mappings.push({ ...identity, route: row.route });
     }
     const admittedMappings = [];
     for (const identity of mappings) {
      try {
       const document = await readDocumentAsync(tx, selector(identity));
       if (document && document.readMetadata.source_id === identity.source_id) {
        admittedMappings.push({ ...identity, titles: Object.fromEntries(['ko', 'en'].map(language => [language, document.locales[language].title])) });
        if (list || identity.route === `/${parts[4]}/${parts[5]}`) documents.push(renderDocument(document, locale, identity, mappings, currentRoster));
       }
      } catch (error) {
       // Missing typed slots/schema or an exact public projection mismatch
       // cannot turn an incomplete envelope into a published article.
       if (error.code !== 'E_DOCUMENT_SCHEMA_GAP' && error.code !== 'E_DOCUMENT_AMBIGUOUS'
        && !/^(E_OFFICE_PUBLIC_PROJECTION|E_MAP_PUBLIC_PROJECTION|E_LOCALE_MISSING):/u.test(error.message)) throw error;
      }
     }
     for (const mapping of routes.filter(row => ['computed-index', 'computed-glossary'].includes(row.derivation))) {
      if (!/^\/[\p{L}\p{N}_-]+\/[\p{L}\p{N}_-]*$/u.test(mapping.route)
       || (!list && mapping.route !== `/${parts[4]}/${parts[5]}`)) continue;
      const computed = await readComputedArticleAsync(tx, mapping, admittedMappings, locale);
      if (computed) documents.push(articleBody(computed.title, `${locale === 'ko' ? '' : '/en'}${mapping.route}`, computed.markdown, locale, admittedMappings));
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
