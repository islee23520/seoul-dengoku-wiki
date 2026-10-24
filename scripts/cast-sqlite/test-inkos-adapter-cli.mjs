import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createInkosAdapterFixture } from './inkos-adapter-fixture.mjs';
import { editDocument } from './document-edit.mjs';

const cli = fileURLToPath(new URL('../inkos-adapter/cli.mjs', import.meta.url));
const evidencePath = fileURLToPath(new URL('../../.omo/evidence/inkos-adapter-followup/cli-proof.json', import.meta.url));
const paragraph = '합성 시험의 새 문단은 공개된 참조만 사용하며 승인이나 게시를 수행하지 않는다.';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fileHash = path => hash(fs.readFileSync(path));
const absent = path => {
  assert.throws(() => fs.lstatSync(path), { code: 'ENOENT' });
  return { path, code: 'ENOENT' };
};

// Check the exit independently of JSON parsing: plausible stdout cannot mask failure.
function checkResult(result, expectedExit, expectedCode) {
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.equal(result.status, expectedExit, result.stderr);
  if (expectedExit === 0) return JSON.parse(result.stdout);
  assert.equal(result.stdout, '');
  const error = JSON.parse(result.stderr);
  assert.equal(error.code, expectedCode);
  return error;
}

test('offline CLI proof: real export, collect and prepare-draft with adversarial variants', async t => {
  const proof = { version: 1, offline: true, executable: process.execPath, scenarios: [] };
  const run = (record, cwd, args, expectedExit = 0, expectedCode) => {
    const argv = [process.execPath, cli, ...args];
    // spawnSync returns only after process exit; no timing-based inter-step waits.
    const result = spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8', timeout: 10000 });
    const fields = checkResult(result, expectedExit, expectedCode);
    record.steps.push({ argv, cwd, exit: result.status, signal: result.signal,
      stdoutSha256: hash(result.stdout), stderrSha256: hash(result.stderr), fields });
    return fields;
  };

  for (const variant of ['happy', 'changed-head', 'forged-approval', 'one-byte-return', 'bad-flags', 'bad-json']) {
    await t.test(variant, () => {
      const f = createInkosAdapterFixture({ parent: fs.realpathSync(tmpdir()) });
      const record = { variant, fixture: { factory: 'createInkosAdapterFixture', directory: f.directory,
        dbPath: f.dbPath, authorityVersion: f.authorityVersion, selection: f.selection, sources: f.sources }, steps: [] };
      proof.scenarios.push(record);
      try {
        const host = join(f.directory, 'host');
        const selection = join(f.directory, 'selection.json');
        const candidatePath = join(f.directory, 'return.json');
        const out = join(f.directory, 'preview.json');
        fs.mkdirSync(host);
        fs.writeFileSync(selection, JSON.stringify(f.selection));
        record.dbBeforeSha256 = fileHash(f.dbPath);
        const packet = run(record, f.directory, ['export', '--db', f.dbPath, '--selection', selection,
          '--trusted-root', host, '--worker-out', join(f.directory, 'worker')]);
        assert.deepEqual(JSON.parse(fs.readFileSync(packet.manifestPath)).sources, f.sources);
        assert.equal(packet.inputDigest, fileHash(packet.bundlePath));
        const candidate = { version: 1, packetId: packet.packetId, inputDigest: packet.inputDigest,
          targetKey: 'source-1', replacementText: paragraph, citations: [{ sourceKey: 'source-2', anchor: 'paragraph' }] };
        if (variant === 'forged-approval') candidate.ownerApproval = true;
        fs.writeFileSync(candidatePath, variant === 'bad-json' ? '{' : JSON.stringify(candidate));
        record.candidateBeforeSha256 = fileHash(candidatePath);
        const collectArgs = ['collect', '--trusted-root', host, '--packet-id', packet.packetId,
          '--candidate', candidatePath, '--db', f.dbPath, '--out', join(f.directory, 'collected.json')];
        if (variant === 'bad-flags') collectArgs.push('--unknown', 'x');
        const collectionError = { 'forged-approval': 'E_ADAPTER_SCHEMA', 'bad-json': 'E_ADAPTER_JSON', 'bad-flags': 'E_ADAPTER_ARGUMENTS' }[variant];
        if (collectionError) {
          run(record, f.directory, collectArgs, 1, collectionError);
          record.preview = absent(out);
          record.collected = absent(join(f.directory, 'collected.json'));
        } else {
          const collected = run(record, f.directory, collectArgs);
          const receipt = JSON.parse(fs.readFileSync(collected.receiptPath));
          assert.equal(receipt.candidateId, collected.candidateId);
          assert.equal(receipt.ownerApproval, false);
          assert.equal(receipt.candidateSha256, record.candidateBeforeSha256);
          record.receiptSha256 = fileHash(collected.receiptPath);
          assert.equal(fileHash(f.dbPath), record.dbBeforeSha256);
          if (variant === 'one-byte-return') {
            fs.appendFileSync(candidatePath, ' ');
            assert.equal(fs.statSync(candidatePath).size, Buffer.byteLength(JSON.stringify(candidate)) + 1);
          }
          if (variant === 'changed-head') {
            // The only post-creation DB write is the explicit fixture attack, not a CLI operation.
            editDocument({ dbPath: f.dbPath, documentId: 'SYN-target', corpusKind: 'current', domain: 'technology',
              expectedRevision: f.sources[0].revision, actor: 'synthetic-test', reason: 'CLI stale-head fixture attack',
              changes: [{ type: 'setText', nodeId: 'paragraph', slot: 'text/ko', value: '바뀐 합성 시험 문단이다.' }] });
            record.staleInjection = { dbBeforeSha256: record.dbBeforeSha256, dbAfterSha256: fileHash(f.dbPath),
              head: f.db.prepare('SELECT revision_id FROM document_head WHERE source_id=1').get().revision_id };
            assert.notEqual(record.staleInjection.head, f.sources[0].revision);
          }
          record.dbBeforePrepareSha256 = fileHash(f.dbPath);
          const prepareArgs = ['prepare-draft', '--trusted-root', host, '--candidate-id', collected.candidateId,
            '--db', f.dbPath, '--out', out];
          const error = { 'changed-head': 'E_ADAPTER_STALE', 'one-byte-return': 'E_ADAPTER_BINDING' }[variant];
          const prepared = run(record, f.directory, prepareArgs, error ? 1 : 0, error);
          if (error) record.preview = absent(out);
          else {
            assert.equal(prepared.preview.id, 'SYN-target');
            assert.equal(receipt.citations[0].documentId, 'SYN-context');
            assert.equal(prepared.expectedRevision, f.sources[0].revision);
            assert.equal(prepared.candidateId, collected.candidateId);
            assert.equal(prepared.preview.content[0].anchor, 'paragraph');
            assert.equal(prepared.preview.content[0].text.ko, paragraph);
            assert.equal(prepared.status, 'draft');
            assert.equal(prepared.ownerApproval, false);
            const expected = structuredClone(f.documents[0]);
            expected.status = 'draft';
            expected.content[0].text.ko = paragraph;
            assert.deepEqual(prepared.preview, expected);
            assert.deepEqual(JSON.parse(fs.readFileSync(out)), prepared);
            record.previewSha256 = fileHash(out);
          }
          assert.equal(fileHash(f.dbPath), record.dbBeforePrepareSha256);
          assert.equal(fileHash(collected.receiptPath), record.receiptSha256);
        }
        record.candidateAfterSha256 = fileHash(candidatePath);
        record.dbAfterSha256 = fileHash(f.dbPath);
        assert.equal(record.dbAfterSha256, record.staleInjection?.dbAfterSha256 ?? record.dbBeforeSha256);
        if (variant === 'one-byte-return') assert.notEqual(record.candidateAfterSha256, record.candidateBeforeSha256);
        else assert.equal(record.candidateAfterSha256, record.candidateBeforeSha256);
      } finally {
        f.cleanup();
        record.cleanup = absent(f.directory);
      }
    });
  }
  await t.test('misleading JSON success cannot hide a wrong process exit', () => {
    const f = createInkosAdapterFixture({ parent: fs.realpathSync(tmpdir()) });
    const argv = [process.execPath, '-e', 'console.log(JSON.stringify({status:"draft"})); process.exitCode=1;'];
    try {
      const result = spawnSync(argv[0], argv.slice(1), { cwd: f.directory, encoding: 'utf8', timeout: 10000 });
      assert.deepEqual(JSON.parse(result.stdout), { status: 'draft' });
      assert.throws(() => checkResult(result, 0), { code: 'ERR_ASSERTION' });
      proof.misleadingSuccess = { argv, cwd: f.directory, exit: result.status, stdoutSha256: hash(result.stdout),
        fields: JSON.parse(result.stdout), rejectedByExitAssertion: true };
    } finally {
      f.cleanup();
      proof.misleadingSuccess.cleanup = absent(f.directory);
    }
  });
  fs.mkdirSync(dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(proof, null, 2)}\n`);
});
