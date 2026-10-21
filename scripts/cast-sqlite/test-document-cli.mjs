import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentCommand } from './document-cli.mjs';

test('CLI rejects invalid input before opening or creating storage', async () => {
  for (const args of [[], ['publish'], ['list'], ['list', '--db', '/missing', '--corpus', 'current', '--db', '/other'],
    ['read', '--db', '/missing', '--corpus', 'current'], ['list', '--db', '/missing', '--corpus', 'unknown']])
    await assert.rejects(documentCommand(args), { code: 'E_ARGUMENTS' });
  assert.ok((await documentCommand(['--help'])).usage);
});

function run(args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL('./document-cli.mjs', import.meta.url)), ...args],
      { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', bytes => { stdout += bytes; });
    child.stderr.on('data', bytes => { stderr += bytes; });
    child.once('error', reject);
    child.once('close', code => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}

test('real CLI edits a migrated current document from stdin and rejects stale revision', {
  skip: !process.env.DOCUMENT_CLI_DATABASE, timeout: 60000,
}, async t => {
  const directory = mkdtempSync(join(tmpdir(), 'document-cli-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const dbPath = join(directory, 'copy.sqlite');
  copyFileSync(process.env.DOCUMENT_CLI_DATABASE, dbPath);
  const selection = ['--db', dbPath, '--corpus', 'current', '--id', 'DOC:Ailments', '--domain', 'ailments'];
  const first = await run(['read', ...selection]);
  assert.equal(first.code, 0, first.stderr);
  const before = JSON.parse(first.stdout);
  const editArgs = ['edit', ...selection, '--expected-revision', before.revision, '--actor', 'cli-test', '--reason', 'isolated copy'];
  const command = JSON.stringify([{ type: 'insertNode', index: 0, node: { kind: 'rule', anchor: 'cli-added-rule' } }]);
  const edit = await run(editArgs, command);
  assert.equal(edit.code, 0, edit.stderr);
  const after = await run(['read', ...selection]);
  assert.equal(after.code, 0, after.stderr);
  assert.equal(JSON.parse(after.stdout).document.content[0].anchor, 'cli-added-rule');
  assert.equal(JSON.parse(after.stdout).document.status, 'draft');
  const historical = await run(['read', ...selection, '--revision', before.revision]);
  assert.equal(historical.code, 0, historical.stderr);
  assert.deepEqual(JSON.parse(historical.stdout), before);
  const stale = await run(editArgs, command);
  assert.equal(stale.code, 1);
  assert.equal(JSON.parse(stale.stderr).error.code, 'E_REVISION_CONFLICT');
  const malformed = await run(editArgs, 'not JSON');
  assert.equal(malformed.code, 1);
  assert.equal(JSON.parse(malformed.stderr).error.code, 'E_ARGUMENTS');
  const domainSelection = ['--db', dbPath, '--corpus', 'example', '--id', '__EXAMPLE__:technology', '--domain', 'technology'];
  const domainBefore = await run(['read', ...domainSelection]);
  assert.equal(domainBefore.code, 0, domainBefore.stderr);
  const domainOriginal = JSON.parse(domainBefore.stdout);
  const domainEdit = await run(['edit', ...domainSelection, '--expected-revision', domainOriginal.revision,
    '--actor', 'cli-test', '--reason', 'typed domain edit'],
  JSON.stringify([{ type: 'setDomainText', field: 'constraint', value: 'edited typed constraint' }]));
  assert.equal(domainEdit.code, 0, domainEdit.stderr);
  const domainAfter = await run(['read', ...domainSelection]);
  assert.equal(domainAfter.code, 0, domainAfter.stderr);
  assert.equal(JSON.parse(domainAfter.stdout).document.data.constraint, 'edited typed constraint');
  const domainHistory = await run(['read', ...domainSelection, '--revision', domainOriginal.revision]);
  assert.equal(domainHistory.code, 0, domainHistory.stderr);
  assert.deepEqual(JSON.parse(domainHistory.stdout), domainOriginal);
  const missing = join(directory, 'absent.sqlite');
  const absent = await run(['list', '--db', missing, '--corpus', 'current']);
  assert.equal(absent.code, 1);
  assert.equal(existsSync(missing), false);
});
