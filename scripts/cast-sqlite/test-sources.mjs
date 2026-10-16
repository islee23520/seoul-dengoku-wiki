import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  REQUIRED_SOURCE_PATHS, DATA_SOURCE_PATHS, SCRIPT_SOURCE_PATHS, RETIRED_HISTORICAL_REFERENCE_PATHS, flattenJson,
  sha256, loadSourceBundle, loadTrustedRenderer, resolveTrustedSourcePath, parseDocument,
} from './sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { REFERENCE_TARGET_PATHS } from './source-closure.mjs';
import { EXCLUDED_SOURCE_PATHS } from './excluded-sources.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'cast-source-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of REQUIRED_SOURCE_PATHS) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), path.endsWith('.json') ? '{}' : '# 원문\r\n');
  }
  for (const path of ENGINE_PRIVATE_SOURCE_PATHS) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), '{"profiles":[]}');
  }
  for (const path of EXCLUDED_SOURCE_PATHS) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), '{}');
  }
  for (const path of REFERENCE_TARGET_PATHS.filter((value) => !REQUIRED_SOURCE_PATHS.includes(value))) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), path.endsWith('.json') ? '{}' : '# reference\n');
  }
  await writeFile(join(root, 'scripts/lore-json-render.mjs'), 'export const renderLoreMarkdown = (document, locale) => document[locale];\n');
  await writeFile(join(root, 'scripts/gurps-cast.mjs'), 'console.error("FAIL: fixture source issue"); process.exitCode = 1;\n');
  execFileSync('git', ['init', '--quiet', root]);
  execFileSync('git', ['-C', root, '-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '--quiet', '-m', 'fixture']);
  return root;
}

test('manifest separates all fixed data sources and executable provenance', () => {
  assert.equal(DATA_SOURCE_PATHS.length, 48);
  assert.equal(SCRIPT_SOURCE_PATHS.length, 2);
  assert.equal(REQUIRED_SOURCE_PATHS.length, 50);
  assert.equal(new Set(REQUIRED_SOURCE_PATHS).size, 50);
  assert.deepEqual(REQUIRED_SOURCE_PATHS, [...REQUIRED_SOURCE_PATHS].sort());
  assert.ok(DATA_SOURCE_PATHS.includes('lore/name-pools/clan-hangnyeol-tables.json'));
  for (const name of ['cast-birthdays', 'cast-birth-cohorts', 'cast-family-trees', 'cast-family-parent-status', 'cast-family-role-decisions', 'cast-household-relations', 'diaspora-family-lineages', 'household-humanoid-policy']) {
    assert.ok(DATA_SOURCE_PATHS.includes(`lore/name-pools/${name}.json`));
  }
  assert.equal(ENGINE_PRIVATE_SOURCE_PATHS.some((path) => REQUIRED_SOURCE_PATHS.includes(path)), false);
  assert.deepEqual(RETIRED_HISTORICAL_REFERENCE_PATHS, ['lore/culture/Martial-Paths.json']);
  assert.equal(REQUIRED_SOURCE_PATHS.includes(RETIRED_HISTORICAL_REFERENCE_PATHS[0]), false);
});

test('flattening preserves escaped pointers, container ordinals, null and all scalar types', () => {
  const rows = flattenJson({ '한/~': [null, '', 7, 2.5, false, true], empty: {} });
  assert.deepEqual(rows.map((r) => [r.json_pointer, r.parent_pointer, r.ordinal, r.field_name, r.json_type]), [
    ['', null, 0, null, 'object'], ['/한~1~0', '', 0, '한/~', 'array'],
    ['/한~1~0/0', '/한~1~0', 0, null, 'null'], ['/한~1~0/1', '/한~1~0', 1, null, 'text'],
    ['/한~1~0/2', '/한~1~0', 2, null, 'integer'], ['/한~1~0/3', '/한~1~0', 3, null, 'real'],
    ['/한~1~0/4', '/한~1~0', 4, null, 'boolean'], ['/한~1~0/5', '/한~1~0', 5, null, 'boolean'],
    ['/empty', '', 1, 'empty', 'object'],
  ]);
  assert.equal(rows[3].text_value, '');
  assert.equal(rows[4].integer_value, 7);
  assert.equal(rows[5].real_value, 2.5);
  assert.equal(rows[6].boolean_value, 0);
  assert.equal(rows[7].boolean_value, 1);
  assert.ok(rows.every((r) => Object.isFrozen(r)));
});

test('bundle retains exact UTF8 bytes and source key order, deterministic hashes and lexical real types', async (t) => {
  const root = await fixture(t);
  const path = 'lore/name-pools/values-cast.json';
  const raw = Buffer.from('{\r\n "10": "한글", "2": null, "real": 1.0, "exp": 1e2, "bool": false\r\n}\r\n');
  await writeFile(join(root, path), raw);
  const first = await loadSourceBundle({ sourceRoot: root, runOfficialChecks: false });
  const second = await loadSourceBundle({ sourceRoot: root, runOfficialChecks: false });
  const file = first.files.find((f) => f.logical_path === path);
  assert.deepEqual(file.raw_bytes, raw);
  assert.equal(file.byte_length, raw.byteLength);
  assert.equal(file.sha256, sha256(raw));
  assert.match(first.sourceRevision, /^[a-f0-9]{40,64}$/);
  assert.equal(first.sourceSetSha256, second.sourceSetSha256);
  assert.deepEqual(first.officialChecks, []);
  assert.equal(first.engineFiles.length, 9);
  assert.equal(first.excludedFiles.length, EXCLUDED_SOURCE_PATHS.length);
  assert.equal(first.files.some((file) => EXCLUDED_SOURCE_PATHS.includes(file.logical_path)), false);
  assert.equal(first.referenceFiles.length, REFERENCE_TARGET_PATHS.filter((path) => !REQUIRED_SOURCE_PATHS.includes(path)).length);
  assert.equal(first.files.some((file) => ENGINE_PRIVATE_SOURCE_PATHS.includes(file.logical_path)), false);
  assert.equal(first.records.some((row) => ENGINE_PRIVATE_SOURCE_PATHS.includes(first.files.find((file) => file.source_id === row.source_id)?.logical_path)), false);
  const rows = first.records.filter((r) => r.source_id === file.source_id);
  assert.deepEqual(rows.slice(1).map((r) => r.field_name), ['10', '2', 'real', 'exp', 'bool']);
  assert.equal(rows[3].json_type, 'real');
  assert.equal(rows[4].real_value, 100);
  assert.equal(first.files.find((f) => f.logical_path.endsWith('.md')).document, null);
  const renderer = await loadTrustedRenderer({ sourceRoot: root, bundle: first });
  assert.equal(renderer.renderLoreMarkdown({ ko: '원문' }, 'ko'), '원문');
  await writeFile(join(root, 'scripts/lore-json-render.mjs'), 'throw new Error("must not execute");');
  await assert.rejects(loadTrustedRenderer({ sourceRoot: root, bundle: first }), { code: 'E_SOURCE_CHANGED' });
});

test('official source errors are returned without a domain-validation exception', async (t) => {
  const root = await fixture(t);
  const bundle = await loadSourceBundle({ sourceRoot: root, runOfficialChecks: true });
  assert.deepEqual(bundle.officialChecks, [{ checkName: 'gurps-cast', exitCode: 1, stdout: '', stderr: 'FAIL: fixture source issue\n' }]);
  await assert.rejects(loadTrustedRenderer({ sourceRoot: root, bundle, scriptPath: 'scripts/other.mjs' }), { code: 'E_SOURCE_SCRIPT_UNTRUSTED' });
});

test('missing, invalid UTF8/JSON, duplicate key and imprecise number sources fail closed', async (t) => {
  const root = await fixture(t);
  const path = join(root, DATA_SOURCE_PATHS[0]);
  await rm(path);
  await assert.rejects(loadSourceBundle({ sourceRoot: root, runOfficialChecks: false }), { code: 'E_SOURCE_MISSING' });
  for (const [raw, code] of [
    [Buffer.from([0xff]), 'E_SOURCE_UTF8'], ['{', 'E_SOURCE_JSON'],
    ['{"x":1,"x":2}', 'E_SOURCE_JSON'], ['{"x":9007199254740993}', 'E_SOURCE_NUMBER_PRECISION'],
    ['{"x":0.10000000000000001}', 'E_SOURCE_NUMBER_PRECISION'], ['{"x":1e999}', 'E_SOURCE_NUMBER_PRECISION'],
  ]) {
    const jsonPath = join(root, 'lore/name-pools/values-cast.json');
    await writeFile(path, path.endsWith('.json') ? '{}' : 'restored');
    await writeFile(jsonPath, raw);
    await assert.rejects(loadSourceBundle({ sourceRoot: root, runOfficialChecks: false }), { code });
  }
});

test('path traversal, absolute paths and outside-root directory links are rejected', async (t) => {
  const root = await fixture(t);
  await assert.rejects(resolveTrustedSourcePath(root, '../outside.json'), { code: 'E_SOURCE_OUTSIDE_ROOT' });
  await assert.rejects(resolveTrustedSourcePath(root, '/outside.json'), { code: 'E_SOURCE_OUTSIDE_ROOT' });
  const outside = await mkdtemp(join(tmpdir(), 'cast-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(join(outside, 'file.json'), '{}');
  await symlink(outside, join(root, 'outside-link'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(resolveTrustedSourcePath(root, 'outside-link/file.json'), { code: 'E_SOURCE_OUTSIDE_ROOT' });
});

test('GURPS evidence cannot redirect the official checker outside its fixed source manifest', async (t) => {
  const root = await fixture(t);
  const path = join(root, 'lore/name-pools/gurps-cast.json');
  await writeFile(path, JSON.stringify({ evidence: [{ path: '../../outside.json', quote: 'x' }] }));
  await assert.rejects(loadSourceBundle({ sourceRoot: root, runOfficialChecks: false }), { code: 'E_SOURCE_OUTSIDE_ROOT' });
  await writeFile(join(root, 'extra.json'), '{}');
  await writeFile(path, JSON.stringify({ evidence: [{ path: 'extra.json', quote: 'x' }] }));
  await assert.rejects(loadSourceBundle({ sourceRoot: root, runOfficialChecks: false }), { code: 'E_SOURCE_MANIFEST' });
});


test('offline parser recreates lexical types and source key order without executing scripts', () => {
  const parsed = parseDocument('{"10":1.0,"2":1e2,"null":null}');
  assert.deepEqual(parsed.document, { '10': 1, '2': 100, null: null });
  assert.deepEqual(parsed.records.map((row) => [row.json_pointer, row.json_type, row.real_value]), [
    ['', 'object', null], ['/10', 'real', 1], ['/2', 'real', 100], ['/null', 'null', null],
  ]);
  assert.ok(parsed.records.every((row) => Object.hasOwn(row, 'source_id') === false));
});
