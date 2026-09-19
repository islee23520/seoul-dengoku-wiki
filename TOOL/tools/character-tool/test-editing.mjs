import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
for (const command of ['weld','shape-key','rig-edit','skin-edit']) {
  test(`${command} exposes a named authoring operation, not an unknown verb`, () => {
    const result = spawnSync(process.execPath,[cli,'--json',command,'--input','missing.blend','--output','out.blend'],{encoding:'utf8'});
    const response = JSON.parse(result.stdout);
    assert.notEqual(response.error.message, 'Unknown command or extra positional arguments. Use --help.');
  });
}

test('GUI and heat diffusion are explicit options', () => {
  const result = spawnSync(process.execPath,[cli,'--json','rig','--input','missing.blend','--output','out.blend',
    '--engine','voxel','--resolution','32','--gui'],{encoding:'utf8'});
  assert.equal(JSON.parse(result.stdout).error.code, 'INPUT_MISSING');
});
