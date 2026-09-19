import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute } from './runtime.mjs';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
const fixtureScript = fileURLToPath(new URL('./qa-fixture.py', import.meta.url));

test('real Blender aligns, binds, exports, and rejects overwrite and unrigged models', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'character-e2e-'));
  const run = async (...args) => {
    const result = await execute(process.execPath, [cli, '--json', ...args]);
    return { ...result, json: JSON.parse(result.stdout) };
  };
  try {
    const source = join(directory, 'source.blend'), aligned = join(directory, 'aligned.blend');
    const rigged = join(directory, 'rigged.blend'), exported = join(directory, 'character.fbx');
    const fixture = await run('exec', '--script', fixtureScript, '--output', source);
    assert.equal(fixture.json.ok, true, fixture.stdout + fixture.stderr);
    const precheck = await run('inspect', '--input', source, '--require-rig');
    assert.equal(precheck.json.error.code, 'RIG_INVALID');
    const align = await run('align', '--input', source, '--output', aligned, '--height', '2');
    assert.equal(align.json.ok, true, `alignment must produce normalized geometry: ${align.stdout} ${align.stderr}`);
    assert.ok(Math.abs(align.json.data.report.bounds.min[2]) < 1e-5);
    assert.ok(Math.abs(align.json.data.report.bounds.size[2] - 2) < 1e-5);
    const rig = await run('rig', '--input', aligned, '--output', rigged, '--skeleton', source.replace('.blend','.skeleton.json'));
    assert.equal(rig.json.ok, true, rig.stdout + rig.stderr);
    assert.equal(rig.json.data.report.rigValid, true);
    const exportResult = await run('export', '--input', rigged, '--output', exported);
    assert.equal(exportResult.json.ok, true, exportResult.stdout + exportResult.stderr);
    assert.ok((await readFile(exported)).length > 1000);
    const overwrite = await run('align', '--input', source, '--output', aligned);
    assert.equal(overwrite.json.error.code, 'OUTPUT_EXISTS');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
