import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openReadOnly } from './db.mjs';
import { listDocuments, readDocument } from './document-read.mjs';
import { editDocument, readDocumentRevision } from './document-edit.mjs';

const fail = message => { throw Object.assign(new Error(message), { code: 'E_ARGUMENTS' }); };
export async function documentCommand(argv, input = process.stdin) {
  if (argv.length === 1 && argv[0] === '--help') return {
    usage: 'node scripts/cast-sqlite/document-cli.mjs <list|read|edit> --db <path> --corpus <current|example|historical> [options]',
    read: '--id <documentId> --domain <domain> [--revision <revision>]',
    edit: '--id <documentId> --domain <domain> --expected-revision <revision> --actor <actor> --reason <reason>',
    stdin: 'edit reads a JSON array of typed commands from stdin; no source document file is created.',
    visibility: 'Local internal authoring. Editing creates a draft and does not grant publication approval.',
  };
  const [command, ...args] = argv;
  const flags = { '--db': 'dbPath', '--corpus': 'corpusKind', '--id': 'documentId', '--domain': 'domain',
    '--revision': 'revision', '--expected-revision': 'expectedRevision', '--actor': 'actor', '--reason': 'reason' };
  const allowed = { list: ['dbPath', 'corpusKind', 'domain'], read: ['dbPath', 'corpusKind', 'documentId', 'domain', 'revision'],
    edit: ['dbPath', 'corpusKind', 'documentId', 'domain', 'expectedRevision', 'actor', 'reason'] };
  if (!Object.hasOwn(allowed, command)) fail('list, read or edit command required');
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = flags[args[index]], value = args[index + 1];
    if (!allowed[command].includes(key) || Object.hasOwn(options, key)
      || typeof value !== 'string' || !value.trim() || value.startsWith('--')) fail('unsupported, duplicate or missing option');
    options[key] = value;
  }
  const required = command === 'list' ? ['dbPath', 'corpusKind']
    : command === 'read' ? ['dbPath', 'corpusKind', 'documentId', 'domain'] : allowed.edit;
  if (required.some(key => !options[key]) || !['current', 'example', 'historical'].includes(options.corpusKind)) fail('explicit database, corpus and command options required');
  if (command === 'edit') {
    if (input.isTTY) fail('typed command array required on stdin');
    let body = '';
    for await (const chunk of input) body += chunk;
    let changes;
    try { changes = JSON.parse(body); } catch { fail('stdin must contain a JSON command array'); }
    return editDocument({ ...options, changes });
  }
  const db = openReadOnly(options.dbPath);
  try {
    const selection = { documentId: options.documentId, corpusKind: options.corpusKind, domain: options.domain, visibility: 'internal' };
    if (command === 'list') return listDocuments(db, selection).map(identity => ({ ...identity,
      revision: db.prepare('SELECT revision_id FROM document_head WHERE source_id=?').get(identity.source_id)?.revision_id ?? null }));
    const document = options.revision ? readDocumentRevision(db, { ...selection, revision: options.revision }) : readDocument(db, selection);
    if (!document) throw Object.assign(new Error('document absent'), { code: 'E_DOCUMENT_NOT_FOUND' });
    const head = db.prepare('SELECT revision_id FROM document_head WHERE source_id=?').get(document.readMetadata.source_id);
    return { revision: options.revision ?? head?.revision_id ?? null, document };
  } finally { db.close(); }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { process.stdout.write(JSON.stringify(await documentCommand(process.argv.slice(2))) + '\n'); }
  catch (error) {
    process.stderr.write(JSON.stringify({ error: { code: error.code ?? 'E_DOCUMENT_COMMAND', message: error.message } }) + '\n');
    process.exitCode = 1;
  }
}
