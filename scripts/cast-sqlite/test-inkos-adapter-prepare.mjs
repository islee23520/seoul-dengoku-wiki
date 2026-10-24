import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { createInkosAdapterFixture } from './inkos-adapter-fixture.mjs';
import { editDocument } from './document-edit.mjs';
import { LIMITS } from '../inkos-adapter/contracts.mjs';
import { prepareDraft } from '../inkos-adapter/prepare.mjs';

const cli = new URL('../inkos-adapter/cli.mjs', import.meta.url);
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const invoke = args => {
  const result = spawnSync(process.execPath, [cli.pathname, ...args], { encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
};
function success(args) {
  const result = invoke(args);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
function fixture(t, authorityVersion = 2, replacementText = '합성 대체 문단이다. DROP TABLE x; $(touch injected); /private/not-opened') {
  const f = createInkosAdapterFixture({ parent: fs.realpathSync(tmpdir()), authorityVersion });
  const trustedRoot = join(f.directory, 'host'); fs.mkdirSync(trustedRoot);
  const selectionPath = join(f.directory, 'selection.json'); fs.writeFileSync(selectionPath, JSON.stringify(f.selection));
  const initialHash = hash(fs.readFileSync(f.dbPath));
  t.after(() => {
    f.cleanup();
    assert.throws(() => fs.lstatSync(f.directory), { code: 'ENOENT' });
    console.log('cleanup ENOENT:', f.directory);
  });
  const packet = success(['export', '--db', f.dbPath, '--selection', selectionPath, '--trusted-root', trustedRoot, '--worker-out', join(f.directory, 'worker')]);
  const candidatePath = join(f.directory, 'return.json');
  const candidate = { version: 1, packetId: packet.packetId, inputDigest: packet.inputDigest, targetKey: 'source-1', replacementText, citations: [{ sourceKey: 'source-2', anchor: 'paragraph' }] };
  fs.writeFileSync(candidatePath, JSON.stringify(candidate));
  const collected = success(['collect', '--trusted-root', trustedRoot, '--packet-id', packet.packetId, '--candidate', candidatePath, '--db', f.dbPath, '--out', join(f.directory, 'collected.json')]);
  assert.equal(collected.receiptSha256, hash(fs.readFileSync(collected.receiptPath)));
  const out = join(f.directory, 'preview.json');
  return { ...f, ...packet, ...collected, candidate, candidatePath, trustedRoot, initialHash, out,
    args: ['prepare-draft', '--trusted-root', trustedRoot, '--candidate-id', collected.candidateId, '--db', f.dbPath, '--out', out] };
}
function rejected(f, code) {
  const before = hash(fs.readFileSync(f.dbPath));
  const result = invoke(f.args);
  assert.equal(result.status, 1, result.stdout);
  assert.equal(result.stdout, '');
  assert.equal(JSON.parse(result.stderr).code, code);
  assert.throws(() => fs.lstatSync(f.out), { code: 'ENOENT' });
  assert.equal(hash(fs.readFileSync(f.dbPath)), before);
  console.log(JSON.stringify({ rejected: code, exit: result.status, preview: 'ENOENT', dbBefore: before, dbAfter: before }));
}

for (const version of [1, 2]) test(`full v${version} preview matches independent fixture projection and three hashes`, t => {
  const f = fixture(t, version);
  const actual = success(f.args);
  const expected = structuredClone(f.documents[0]);
  expected.content[0].text.ko = f.candidate.replacementText;
  expected.status = 'draft';
  const commands = [{ type: 'setText', nodeId: 'paragraph', slot: 'text/ko', value: f.candidate.replacementText }];
  assert.deepEqual(actual.preview, expected);
  assert.deepEqual(actual.commands, commands);
  assert.equal(actual.expectedRevision, f.sources[0].revision);
  assert.equal(actual.replacementSha256, hash(Buffer.from(f.candidate.replacementText)));
  assert.equal(actual.orderedCommandsSha256, hash(canonical(commands)));
  assert.equal(actual.fullPreviewSha256, hash(canonical(expected)));
  assert.equal(actual.ownerApproval, false);
  const { previewFileSha256, ...envelope } = actual;
  assert.equal(previewFileSha256, hash(fs.readFileSync(f.out)));
  assert.deepEqual(JSON.parse(fs.readFileSync(f.out)), envelope);
  assert.equal(fs.existsSync(join(f.directory, 'injected')), false);
  assert.equal(hash(fs.readFileSync(f.dbPath)), f.initialHash);
  console.log(JSON.stringify({ authorityVersion: version, expectedRevision: actual.expectedRevision,
    replacementSha256: actual.replacementSha256, orderedCommandsSha256: actual.orderedCommandsSha256,
    fullPreviewSha256: actual.fullPreviewSha256, dbBefore: f.initialHash, dbAfter: hash(fs.readFileSync(f.dbPath)) }));
  const bytes = fs.readFileSync(f.out);
  const conflict = invoke(f.args);
  assert.equal(conflict.status, 1);
  assert.equal(JSON.parse(conflict.stderr).code, 'E_ADAPTER_CONFLICT');
  assert.deepEqual(fs.readFileSync(f.out), bytes);
});

for (const sourceId of [1, 2]) test(`${sourceId === 1 ? 'target' : 'context-only'} head change rejects with no preview`, t => {
  const f = fixture(t);
  editDocument({ dbPath: f.dbPath, documentId: f.documents[sourceId - 1].id, corpusKind: 'current', domain: 'technology',
    expectedRevision: f.sources[sourceId - 1].revision, actor: 'synthetic-test', reason: 'stale read-set probe',
    changes: [{ type: 'setText', nodeId: 'paragraph', slot: 'text/ko', value: 'Changed synthetic head.' }] });
  rejected(f, 'E_ADAPTER_STALE');
});

test('context admission change rejects even when public semantic content remains equal', t => {
  const f = fixture(t);
  f.db.exec("DROP TRIGGER document_publication_admission_no_update; UPDATE document_publication_admission SET recorded_at='changed' WHERE source_id=2");
  rejected(f, 'E_ADAPTER_STALE');
});
test('uncommitted semantic row drift rejects', t => {
  const f = fixture(t);
  f.db.exec("UPDATE text_document_locale SET summary='dirty' WHERE source_id=2 AND locale='ko'");
  rejected(f, 'E_ADAPTER_STALE');
});
test('one-byte candidate change rejects exact-byte binding', t => {
  const f = fixture(t); fs.appendFileSync(f.candidatePath, ' ');
  rejected(f, 'E_ADAPTER_BINDING');
});
for (const boundary of ['BEGIN', 'first DB read', 'COMMIT']) test(`candidate mutation exactly at ${boundary} rejects without other side effects`, t => {
  const f = fixture(t);
  const inventory = directory => Object.fromEntries(fs.readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile()).map(entry => {
      const path = join(entry.parentPath, entry.name);
      return [path, hash(fs.readFileSync(path))];
    }));
  const before = inventory(f.directory);
  const candidateBytes = fs.readFileSync(f.candidatePath);
  const method = boundary === 'first DB read' ? 'prepare' : 'exec';
  const original = DatabaseSync.prototype[method];
  const changedBytes = boundary === 'COMMIT'
    ? Buffer.from(JSON.stringify({ ...f.candidate, replacementText: 'Different replacement at COMMIT.' }))
    : Buffer.concat([candidateBytes, Buffer.from(' ')]);
  let mutated = false;
  const mock = t.mock.method(DatabaseSync.prototype, method, function (sql) {
    if (sql === (boundary === 'first DB read' ? 'SELECT version FROM document_authority' : boundary)) {
      assert.equal(mutated, false);
      mutated = true;
      if (boundary === 'COMMIT') {
        // Replace the pathname with a different inode, not merely its content.
        fs.unlinkSync(f.candidatePath);
        fs.writeFileSync(f.candidatePath, changedBytes);
      } else fs.appendFileSync(f.candidatePath, ' ');
    }
    return original.call(this, sql);
  });
  try {
    assert.throws(() => prepareDraft({ trustedRoot: f.trustedRoot, candidateId: f.candidateId,
      dbPath: f.dbPath, out: f.out }), { code: 'E_ADAPTER_BINDING' });
  } finally { mock.mock.restore(); }
  assert.equal(DatabaseSync.prototype[method], original);
  assert.equal(mutated, true);
  assert.throws(() => fs.lstatSync(f.out), { code: 'ENOENT' });
  assert.deepEqual(fs.readFileSync(f.candidatePath), changedBytes);
  assert.deepEqual(inventory(f.directory), { ...before, [f.candidatePath]: hash(changedBytes) });
  console.log(JSON.stringify({ counterexample: `candidate mutation at ${boundary}`, mutated,
    rejected: 'E_ADAPTER_BINDING', preview: 'ENOENT', onlySideEffect: boundary === 'COMMIT' ? 'candidate replaced' : 'candidate trailing space',
    dbBefore: before[f.dbPath], dbAfter: hash(fs.readFileSync(f.dbPath)) }));
});
test('unsupported anchor change rejects rather than projecting structural edits', t => {
  const f = fixture(t, 2, '합성 문단 <a id="new-anchor"></a>');
  rejected(f, 'E_ADAPTER_UNSUPPORTED_CHANGE');
});
test('receipt changes reject through trusted index digest', t => {
  const f = fixture(t); fs.appendFileSync(f.receiptPath, ' ');
  rejected(f, 'E_ADAPTER_BINDING');
});
test('missing stable typed identity rejects unsupported command scope', t => {
  const f = fixture(t);
  f.db.exec('DROP TRIGGER document_node_identity_no_delete; DELETE FROM document_node_identity WHERE source_id=1');
  rejected(f, 'E_ADAPTER_UNSUPPORTED_CHANGE');
});
for (const command of ['apply', 'approve', 'publish']) test(`${command} is forbidden`, () => {
  const result = invoke([command]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(JSON.parse(result.stderr).code, 'E_ADAPTER_COMMAND');
});
test('strict CLI rejects unknown flags, duplicate flags and unknown commands', () => {
  for (const args of [['unknown'], ['--help', '--extra'], ['prepare-draft', '--unknown', 'x'], ['prepare-draft', '--db', 'a', '--db', 'b']]) {
    const result = invoke(args);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).code, 'E_ADAPTER_ARGUMENTS');
    assert.equal(result.stdout, '');
  }
});
for (const [name, bytes, code] of [['malformed', '{', 'E_ADAPTER_JSON'], ['oversize', ' '.repeat(LIMITS.fileBytes + 1), 'E_ADAPTER_LIMIT'],
  ['unsupported command scope', '{"changes":[{"type":"setStatus","value":"approved"}]}', 'E_ADAPTER_SCHEMA']]) test(`${name} candidate is rejected without output`, t => {
  const f = fixture(t); fs.writeFileSync(f.candidatePath, bytes);
  rejected(f, code);
});
test('help is machine JSON with exactly the supported commands', () => {
  const help = success(['--help']);
  assert.deepEqual(Object.keys(help.commands), ['export', 'collect', 'prepare-draft', '--help']);
  console.log('help stdout:', JSON.stringify(help));
});
