import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createReader } from './db-pg.mjs';
import { listDocumentsAsync, readDocumentAsync } from './document-read.mjs';
import { editDocumentPg, readDocumentRevisionAsync } from './document-edit-pg.mjs';

const fail = message => { throw Object.assign(new Error(message), { code: 'E_ARGUMENTS' }); };
export async function documentCommand(argv, input = process.stdin) {
  if (argv.length === 1 && argv[0] === '--help') return {
    usage: 'node scripts/cast-sqlite/document-cli.mjs <list|read|edit> [--pg <connection-url>] --corpus <current|example|historical> [options]',
    connection: 'WIKI_AUTHORING_PG (or WIKI_DOCUMENT_PG) selects PostgreSQL without exposing credentials in argv. --pg overrides it. No SQLite fallback; --db is retired. SQLite exports in document-edit.mjs are migration-only.',
    read: '--id <documentId> --domain <domain> [--revision <revision>]',
    edit: '--id <documentId> --domain <domain> --expected-revision <revision> [--expected-hash <current-semantic-sha256>] [--expected-result-hash <draft-semantic-sha256>] --actor <actor> --reason <reason>',
    stdin: 'edit reads a JSON array of typed commands from stdin; no source document file is created.',
    visibility: 'Local internal authoring under wiki_author. Editing creates a draft and does not grant publication approval.',
  };
  const [command, ...args] = argv;
  if (args.includes('--db')) fail('--db is retired: use WIKI_AUTHORING_PG or --pg for PostgreSQL; SQLite writers are migration-only');
  const flags = {
    '--pg': 'connectionString', '--corpus': 'corpusKind', '--id': 'documentId', '--domain': 'domain',
    '--revision': 'revision', '--expected-revision': 'expectedRevision', '--expected-hash': 'expectedCurrentSemanticSha256',
    '--expected-result-hash': 'expectedSemanticSha256', '--actor': 'actor', '--reason': 'reason'
  };
  const allowed = {
    list: ['connectionString', 'corpusKind', 'domain'],
    read: ['connectionString', 'corpusKind', 'documentId', 'domain', 'revision'],
    edit: ['connectionString', 'corpusKind', 'documentId', 'domain', 'expectedRevision', 'expectedCurrentSemanticSha256', 'expectedSemanticSha256', 'actor', 'reason']
  };
  if (!Object.hasOwn(allowed, command)) fail('list, read or edit command required');
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = flags[args[index]], value = args[index + 1];
    if (!allowed[command].includes(key) || Object.hasOwn(options, key)
      || typeof value !== 'string' || !value.trim() || value.startsWith('--')) fail('unsupported, duplicate or missing option');
    options[key] = value;
  }
  options.connectionString ??= process.env.WIKI_AUTHORING_PG ?? process.env.WIKI_DOCUMENT_PG;
  const required = command === 'list' ? ['connectionString', 'corpusKind']
    : command === 'read' ? ['connectionString', 'corpusKind', 'documentId', 'domain']
      : ['connectionString', 'corpusKind', 'documentId', 'domain', 'expectedRevision', 'actor', 'reason'];
  if (required.some(key => !options[key]) || !['current', 'example', 'historical'].includes(options.corpusKind)) fail('explicit PostgreSQL connection, corpus and command options required');
  if (command === 'edit') {
    if (input.isTTY) fail('typed command array required on stdin');
    let body = '';
    for await (const chunk of input) body += chunk;
    let changes;
    try { changes = JSON.parse(body); } catch { fail('stdin must contain a JSON command array'); }
    return editDocumentPg({ ...options, changes });
  }
  const reader = createReader({ connectionString: options.connectionString, role: 'wiki_author' });
  try {
    return await reader.transaction(async tx => {
      const selection = { documentId: options.documentId, corpusKind: options.corpusKind, domain: options.domain, visibility: 'internal' };
      if (command === 'list') {
        const identities = await listDocumentsAsync(tx, selection);
        const result = [];
        for (const identity of identities) {
          const head = await tx.get('SELECT revision_id FROM wiki.document_head WHERE source_id=$1', [identity.source_id]);
          result.push({ ...identity, revision: head?.revision_id ?? null });
        }
        return result;
      }
      const document = options.revision ? await readDocumentRevisionAsync(tx, { ...selection, revision: options.revision }) : await readDocumentAsync(tx, selection);
      if (!document) throw Object.assign(new Error('document absent'), { code: 'E_DOCUMENT_NOT_FOUND' });
      const head = await tx.get('SELECT revision_id FROM wiki.document_head WHERE source_id=$1', [document.readMetadata.source_id]);
      return { revision: options.revision ?? head?.revision_id ?? null, document };
    }, { readOnly: true });
  } finally { await reader.close(); }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { process.stdout.write(JSON.stringify(await documentCommand(process.argv.slice(2))) + '\n'); }
  catch (error) {
    process.stderr.write(JSON.stringify({ error: { code: error.code ?? 'E_DOCUMENT_COMMAND', message: error.message } }) + '\n');
    process.exitCode = 1;
  }
}
