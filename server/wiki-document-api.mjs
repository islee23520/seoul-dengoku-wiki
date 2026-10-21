import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { openReadOnly } from '../scripts/cast-sqlite/db.mjs';
import { listDocuments, readDocument } from '../scripts/cast-sqlite/document-read.mjs';
import { localizedDocuments } from '../scripts/localized-documents.mjs';
import { renderLoreMarkdown } from '../scripts/lore-json-render.mjs';
import { publicHouseContent } from '../scripts/public-house-content.mjs';
import { publicOfficeContent } from '../scripts/public-office-content.mjs';
import { publicMapContent } from '../scripts/public-map-content.mjs';
import { readComputedArticle } from '../scripts/cast-sqlite/computed-articles.mjs';
import { readPersonDisposition } from '../scripts/cast-sqlite/person-disposition.mjs';
import { readRetirementProse, projectRetirementProse } from '../scripts/cast-sqlite/retirement-prose.mjs';
import { projectActivePersonIndex } from '../scripts/person-roster-projection.mjs';

const selector = (identity) => ({ corpusKind: 'current', domain: identity.domain,
  documentId: identity.document_id, visibility: 'public' });

// The reviewed DB route is authoritative; an envelope slug is not a URL alias.
function renderDocument(document, locale, mapping, mappings, currentRoster) {
  const current = currentRoster ? projectRetirementProse(document, mapping.logical_path, currentRoster.prose) : document;
  const projected = projectActivePersonIndex(publicMapContent(publicOfficeContent(publicHouseContent(current))),
    currentRoster?.ids, currentRoster?.routes);
  const [, domain, slug] = mapping.route.split('/');
  const localized = localizedDocuments({ domain, slug, json: projected,
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

export function createWikiDocumentServer({ dbPath = process.env.WIKI_DOCUMENT_DB } = {}) {
  if (typeof dbPath !== 'string' || !dbPath.trim()) throw new Error('WIKI_DOCUMENT_DB is required');
  const db = openReadOnly(dbPath);
  const server = createServer((request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
        'x-content-type-options': 'nosniff' });
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
    try {
      // All admission and envelope checks share one read snapshot; edits between
      // requests invalidate admission, and can never race title against body.
      db.exec('BEGIN');
      const publicDocuments = [];
      const identities = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
      const routes = db.prepare('SELECT route,source_id,derivation,derivation_json FROM article_route ORDER BY route').all();
      let currentRoster;
      if (db.prepare("SELECT 1 FROM sqlite_schema WHERE name='person_disposition'").get()) {
        const dispositions = readPersonDisposition(db);
        const ids = new Set([...dispositions].filter(([, row]) => row.status === 'active').map(([id]) => id));
        const activeRoutes = new Set(db.prepare('SELECT person_id,public_route FROM person').all()
          .filter(row => ids.has(row.person_id)).map(row => row.public_route));
        currentRoster = { ids, routes: activeRoutes,
          prose: db.prepare("SELECT 1 FROM sqlite_schema WHERE name='retirement_prose'").get() ? readRetirementProse(db) : [] };
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
          const document = readDocument(db, selector(identity));
          if (document && document.readMetadata.source_id === identity.source_id) {
            admittedMappings.push({ ...identity, titles: Object.fromEntries(['ko', 'en'].map(language => [language, document.locales[language].title])) });
            if (list || identity.route === `/${parts[4]}/${parts[5]}`) publicDocuments.push(renderDocument(document, locale, identity, mappings, currentRoster));
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
        const computed = readComputedArticle(db, mapping, admittedMappings, locale);
        if (computed) publicDocuments.push(articleBody(computed.title, `${locale === 'ko' ? '' : '/en'}${mapping.route}`, computed.markdown, locale, admittedMappings));
      }
      db.exec('COMMIT');
      if (list) send(200, publicDocuments.map(({ title, route }) => ({ title, route })));
      else if (publicDocuments.length === 1) send(200, publicDocuments[0]);
      else send(404, { error: 'Not found' });
    } catch {
      if (db.isTransaction) db.exec('ROLLBACK');
      send(503, { error: 'Documents unavailable' });
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createWikiDocumentServer();
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
}
