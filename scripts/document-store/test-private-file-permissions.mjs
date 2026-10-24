import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { assertPrivateFilePermissions } from './private-file-permissions.mjs';
import { inspectPrivateFixturePermissions, setPrivateFixturePermissions } from '../fixtures/private-file-permissions.mjs';
import { readPrivateCurrentDocument } from './private-current-document.mjs';
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY } from './editorial-profile.mjs';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY } from './soul-assignment.mjs';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'private-permissions-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  setPrivateFixturePermissions(directory, { directory: true });
  return { directory, path: join(directory, "literal [file] ' $name.sqlite") };
}

test('restricted file passes, Users access fails, and restricting the same path passes without a cache', t => {
  const { path } = fixture(t);
  writeFileSync(path, '', { mode: 0o600 });
  const fixtureId = randomUUID();
  const receipt = process.platform === 'win32' ? inspectPrivateFixturePermissions(path) : null;
  // Emit before the permission call and before teardown, so a failure retains the actual inherited ACL state.
  console.error('PRIVATE_FIXTURE ' + JSON.stringify({ fixtureId, receipt }));
  try {
    if (receipt) {
      assert.equal(receipt.ownerTrusted, true);
      assert.equal(receipt.daclPresent, true);
      assert.deepEqual(receipt.rules.map(rule => rule.role).sort(), ['administrators', 'current', 'system']);
      assert.ok(receipt.rules.every(rule => rule.allow && rule.inherited && rule.supported));
    }
    assertPrivateFilePermissions(path);
  } catch (error) {
    console.error('PRIVATE_FIXTURE_FAILURE ' + JSON.stringify({ fixtureId, diagnostic: error.diagnostic ?? null }));
    throw error;
  }
  setPrivateFixturePermissions(path, { broad: true });
  assert.throws(() => assertPrivateFilePermissions(path), { code: 'E_PRIVATE_MODE' });
  setPrivateFixturePermissions(path);
  assert.doesNotThrow(() => assertPrivateFilePermissions(path));
});

test('Windows inherited Users Allow and untrusted owner fail closed', { skip: process.platform !== 'win32' }, t => {
  const { directory, path } = fixture(t);
  setPrivateFixturePermissions(directory, { directory: true, broad: true });
  writeFileSync(path, '');
  assert.throws(() => assertPrivateFilePermissions(path), { code: 'E_PRIVATE_MODE' });
  setPrivateFixturePermissions(path, { untrustedOwner: true });
  assert.throws(() => assertPrivateFilePermissions(path), { code: 'E_PRIVATE_MODE' });
  setPrivateFixturePermissions(path);
  assert.doesNotThrow(() => assertPrivateFilePermissions(path));
});

test('POSIX still requires exact 0600', { skip: process.platform === 'win32' }, t => {
  const { path } = fixture(t);
  writeFileSync(path, '', { mode: 0o600 });
  for (const mode of [0o400, 0o640, 0o644, 0o660, 0o700]) {
    chmodSync(path, mode);
    assert.throws(() => assertPrivateFilePermissions(path), { code: 'E_PRIVATE_MODE' });
  }
  chmodSync(path, 0o600);
  assert.doesNotThrow(() => assertPrivateFilePermissions(path));
});

test('Windows lookup failures, timeout and malformed output fail closed with bounded data-only invocation', { skip: process.platform !== 'win32' }, t => {
  const { path } = fixture(t);
  writeFileSync(path, '');
  const original = childProcess.spawnSync;
  try {
    const cases = [
      [{ status: 1, stdout: '' }, 'child-status', 'unclassified-status'],
      [{ status: null, error: Object.assign(new Error('secret'), { code: 'ETIMEDOUT' }), signal: 'SIGTERM' }, 'child-error', 'child-error'],
      [{ status: null, error: Object.assign(new Error('secret'), { code: 'secret' }), stderr: 'secret' }, 'child-error', 'child-error'],
      [{ status: 0, stdout: '' }, 'bad-sentinel', 'bad-sentinel'],
      [{ status: 0, stdout: 'secret' }, 'bad-sentinel', 'bad-sentinel'],
      ...Object.entries({ 10: 'policy-owner', 11: 'policy-dacl', 12: 'policy-ace', 13: 'policy-ace-type', 14: 'policy-allow',
        20: 'query-exception', 21: 'descriptor-exception', 22: 'identity-exception', 23: 'inspection-exception' })
        .map(([status, reason]) => [{ status: Number(status), stdout: '' }, 'child-status', reason]),
    ];
    for (const [result, branch, reason] of cases) {
      childProcess.spawnSync = (executable, args, options) => {
        assert.equal(executable, 'C:/Program Files/PowerShell/7/pwsh.exe');
        assert.equal(options.input, path);
        assert.equal(options.timeout, 10000);
        assert.equal(options.shell, undefined);
        assert.ok(!args.join(' ').includes(path));
        return result;
      };
      syncBuiltinESMExports();
      assert.throws(() => assertPrivateFilePermissions(path), error => {
        assert.equal(error.code, 'E_PRIVATE_MODE');
        assert.equal(error.message, 'E_PRIVATE_MODE');
        assert.equal(error.diagnostic.branch, branch);
        assert.equal(error.diagnostic.reason, reason);
        assert.equal(error.diagnostic.childErrorCode, result.error ? result.error.code === 'ETIMEDOUT' ? 'ETIMEDOUT' : 'OTHER' : null);
        assert.equal(error.diagnostic.status, result.status);
        assert.equal(error.diagnostic.sentinelMatch, false);
        assert.ok(Number.isInteger(error.diagnostic.elapsedMs) && error.diagnostic.elapsedMs >= 0);
        assert.ok(!JSON.stringify(error).includes('secret'));
        assert.ok(!JSON.stringify(error).includes(path));
        return true;
      });
    }
  } finally { childProcess.spawnSync = original; syncBuiltinESMExports(); }
});

test('all three readers reach wrong application ID guards only after the permission boundary passes', t => {
  const { path } = fixture(t);
  const db = new DatabaseSync(path);
  db.exec('PRAGMA application_id=1; PRAGMA user_version=1');
  db.close();
  setPrivateFixturePermissions(path);
  const previous = process.env.WIKI_EDITORIAL_DB;
  process.env.WIKI_EDITORIAL_DB = path;
  t.after(() => { if (previous === undefined) delete process.env.WIKI_EDITORIAL_DB; else process.env.WIKI_EDITORIAL_DB = previous; });
  const readers = [
    [() => readPrivateCurrentDocument('lore/editorial/Seoul-Scope-Contract.json'), /E_PRIVATE_EDITORIAL_DATABASE/],
    [() => openEditorialProfiles(path, { capability: INTERNAL_PROFILE_CAPABILITY }), /E_SCHEMA/],
    [() => openSoulAssignments(path, { capability: INTERNAL_SOUL_CAPABILITY }), /E_SCHEMA/],
  ];
  for (const [read, error] of readers) assert.throws(read, error);
  setPrivateFixturePermissions(path, { broad: true });
  for (const [read] of readers) assert.throws(read, { code: 'E_PRIVATE_MODE' });
  setPrivateFixturePermissions(path);
  for (const [read, error] of readers) assert.throws(read, error);
});
