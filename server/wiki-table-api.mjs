// Anonymous read-only access to every table of the public PostgreSQL `wiki`
// schema. Writes never happen here: table changes arrive only as reviewed
// drizzle migrations in db/migrations (see scripts/db-migrate.mjs).
//
//   GET /wiki/api/tables                              table list with columns and row estimates
//   GET /wiki/api/tables/<name>?limit=&offset=&format= paged rows (json | csv)
//   GET /wiki/api/tables/<name>/download               whole table as a streamed CSV file
//
// Table names are only ever taken from the catalog list the reader role can
// SELECT in schema `wiki`; request text is never interpolated before that match.
// The connection runs as wiki_reader, which has no wiki_private access.
import copyStreams from 'pg-copy-streams';
import { isPublicTable } from './wiki-table-allowlist.mjs';

const PREFIX = '/wiki/api/tables';
const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;
const MAX_DOWNLOADS = 2;
const QUERY_TIMEOUT = '30s';
const DOWNLOAD_TIMEOUT = '300s';
const CATALOG_TTL_MS = 60_000;

const quoteIdent = (name) => `"${name.replaceAll('"', '""')}"`;

class TableApiError extends Error {
 constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

function headers(type) {
 return {
  'content-type': type, 'cache-control': 'public, max-age=60', 'x-content-type-options': 'nosniff',
  'access-control-allow-origin': '*',
 };
}

function sendJson(response, status, body) {
 response.writeHead(status, headers('application/json; charset=utf-8'));
 response.end(JSON.stringify(body, (_key, value) =>
  value && value.type === 'Buffer' && Array.isArray(value.data) ? `\\x${Buffer.from(value.data).toString('hex')}` : value));
}

const csvCell = (value) => {
 if (value === null || value === undefined) return '';
 const text = Buffer.isBuffer(value) ? `\\x${value.toString('hex')}`
  : value instanceof Date ? value.toISOString()
   : typeof value === 'object' ? JSON.stringify(value) : String(value);
 return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

function integerParam(params, name, fallback, max) {
 const raw = params.get(name);
 if (raw === null) return fallback;
 if (!/^[0-9]{1,9}$/u.test(raw) || Number(raw) > max) {
  throw new TableApiError(400, 'invalid_parameter', `${name} must be an integer between 0 and ${max}`);
 }
 return Number(raw);
}

export function createTableApi(reader) {
 let catalog;
 let catalogAt = 0;
 let downloads = 0;

 async function loadCatalog() {
  if (catalog && Date.now() - catalogAt < CATALOG_TTL_MS) return catalog;
  const tables = await reader.all(`
   SELECT c.relname AS name, greatest(c.reltuples, 0)::bigint AS estimated_rows
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'wiki' AND c.relkind IN ('r', 'p', 'v', 'm')
      AND has_table_privilege(c.oid, 'SELECT')
    ORDER BY c.relname COLLATE "C"`);
  const columns = await reader.all(`
   SELECT table_name, column_name, data_type, is_nullable = 'YES' AS nullable
     FROM information_schema.columns WHERE table_schema = 'wiki'
    ORDER BY table_name, ordinal_position`);
  const keys = await reader.all(`
   SELECT c.relname AS table_name, a.attname AS column_name
     FROM pg_index i
     JOIN pg_class c ON c.oid = i.indrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, position) ON true
     JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
    WHERE n.nspname = 'wiki' AND i.indisprimary
    ORDER BY c.relname, k.position`);
  const next = new Map(tables.filter((row) => isPublicTable(row.name))
   .map((row) => [row.name, { name: row.name, estimatedRows: row.estimated_rows, columns: [], primaryKey: [] }]));
  for (const row of columns) next.get(row.table_name)?.columns.push({ name: row.column_name, type: row.data_type, nullable: row.nullable });
  for (const row of keys) next.get(row.table_name)?.primaryKey.push(row.column_name);
  catalog = next;
  catalogAt = Date.now();
  return catalog;
 }

 async function tableOf(name) {
  const table = (await loadCatalog()).get(name);
  if (!table) throw new TableApiError(404, 'table_not_found', `no public wiki table ${name}`);
  return table;
 }

 const orderBy = (table) => (table.primaryKey.length ? table.primaryKey.map(quoteIdent)
  : table.columns.map((_column, index) => String(index + 1))).join(', ');

 async function listRoute(response) {
  const tables = [...(await loadCatalog()).values()];
  sendJson(response, 200, {
   schema: 'wiki', count: tables.length,
   policy: 'Read-only and anonymous; published wiki content tables only (see server/wiki-table-allowlist.mjs). Changes are applied only from reviewed migrations in db/migrations merged to main.',
   tables: tables.map((table) => ({ ...table, rows: `${PREFIX}/${encodeURIComponent(table.name)}`,
    download: `${PREFIX}/${encodeURIComponent(table.name)}/download` })),
  });
 }

 async function rowsRoute(response, table, params) {
  const limit = integerParam(params, 'limit', DEFAULT_LIMIT, MAX_LIMIT);
  const offset = integerParam(params, 'offset', 0, 999_999_999);
  const format = params.get('format') ?? 'json';
  if (format !== 'json' && format !== 'csv') throw new TableApiError(400, 'invalid_parameter', 'format must be json or csv');
  const relation = `wiki.${quoteIdent(table.name)}`;
  const { total, rows } = await reader.transaction(async (tx) => {
   await tx.exec(`SET LOCAL statement_timeout = '${QUERY_TIMEOUT}'`);
   const count = await tx.get(`SELECT count(*)::bigint AS total FROM ${relation}`);
   const page = await tx.query(`SELECT * FROM ${relation} ORDER BY ${orderBy(table)} LIMIT $1 OFFSET $2`, [limit, offset]);
   return { total: count.total, rows: page.rows };
  }, { readOnly: true });
  if (format === 'csv') {
   const names = table.columns.map((column) => column.name);
   response.writeHead(200, headers('text/csv; charset=utf-8'));
   response.end([names.map(csvCell).join(','), ...rows.map((row) => names.map((name) => csvCell(row[name])).join(','))].join('\r\n') + '\r\n');
   return;
  }
  sendJson(response, 200, { table: table.name, columns: table.columns, primaryKey: table.primaryKey, total, limit, offset, rows });
 }

 async function downloadRoute(response, table) {
  if (downloads >= MAX_DOWNLOADS) throw new TableApiError(429, 'busy', 'too many concurrent downloads; retry shortly');
  downloads += 1;
  const client = await reader.pool.connect();
  let failed = null;
  try {
   await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
   await client.query(`SET LOCAL statement_timeout = '${DOWNLOAD_TIMEOUT}'`);
   const stream = client.query(copyStreams.to(
    `COPY (SELECT * FROM wiki.${quoteIdent(table.name)} ORDER BY ${orderBy(table)}) TO STDOUT WITH (FORMAT csv, HEADER true)`));
   response.writeHead(200, { ...headers('text/csv; charset=utf-8'),
    'content-disposition': `attachment; filename="wiki.${table.name}.csv"` });
   await new Promise((resolve, reject) => {
    stream.on('error', reject);
    response.on('close', () => { if (!response.writableFinished) reject(new Error('client closed download')); });
    stream.on('end', resolve);
    stream.pipe(response);
   });
   await client.query('COMMIT');
  } catch (error) {
   failed = error;
   if (!response.headersSent) throw error;
   response.destroy();
  } finally {
   // A connection interrupted mid-COPY is not reusable.
   client.release(failed ?? undefined);
   downloads -= 1;
  }
 }

 return async function handle(request, response) {
  try {
   const url = new URL(request.url, 'http://localhost');
   if (request.method !== 'GET') throw new TableApiError(405, 'method_not_allowed', 'read-only API');
   const parts = url.pathname.slice(PREFIX.length).split('/').filter(Boolean).map(decodeURIComponent);
   const allowed = parts.length === 0 ? [] : parts[1] === 'download' ? [] : ['limit', 'offset', 'format'];
   if ([...url.searchParams.keys()].some((key) => !allowed.includes(key))) throw new TableApiError(400, 'invalid_parameter', 'unsupported query parameter');
   if (parts.length === 0) return await listRoute(response);
   if (parts.length > 2 || (parts.length === 2 && parts[1] !== 'download')) throw new TableApiError(404, 'not_found', 'unknown path');
   const table = await tableOf(parts[0]);
   if (parts.length === 2) return await downloadRoute(response, table);
   return await rowsRoute(response, table, url.searchParams);
  } catch (error) {
   if (response.headersSent) { response.destroy(); return; }
   if (error instanceof TableApiError) return sendJson(response, error.status, { error: { code: error.code, message: error.message } });
   if (error instanceof URIError) return sendJson(response, 400, { error: { code: 'invalid_request', message: 'invalid path encoding' } });
   console.error('WIKI_TABLE_API_FAILED', error?.code ?? error?.message);
   return sendJson(response, 503, { error: { code: 'unavailable', message: 'tables unavailable' } });
  }
 };
}

export const isTableRequest = (pathname) => pathname === PREFIX || pathname.startsWith(`${PREFIX}/`);
