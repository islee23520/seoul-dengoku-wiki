import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { verifyCastDatabase } from './verify.mjs';

test('verify API rejects missing or invalid database arguments', async () => {
  await assert.rejects(verifyCastDatabase(), { code: 'E_VERIFY_USAGE' });
  await assert.rejects(verifyCastDatabase({ dbPath: '', sourceRoot: null }), { code: 'E_VERIFY_USAGE' });
  await assert.rejects(verifyCastDatabase({ dbPath: 'missing.sqlite', receiptPath: '' }), { code: 'E_VERIFY_USAGE' });
  await assert.rejects(verifyCastDatabase({ dbPath: 'missing.sqlite', requireClean: 'yes' }), { code: 'E_VERIFY_USAGE' });
});

test('verify CLI rejects force, missing database and duplicate options', () => {
  const cli = fileURLToPath(new URL('./verify.mjs', import.meta.url));
  for (const args of [[], ['--force'], ['--db'], ['--db', 'missing.sqlite', '--db', 'missing.sqlite'],
    ['--db', 'missing.sqlite', '--check-raw', '--check-raw']]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 1, `${args.join(' ')}: ${result.stdout}`);
    assert.match(result.stderr, /E_VERIFY_USAGE/);
  }
});
