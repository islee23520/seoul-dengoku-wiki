import { test } from 'vitest';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/portrait-gen.ts',import.meta.url));
const run = (...args) => spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});

test('generate requires a real prebaked 3D source, not a 2D slot', async () => {
  const directory = await mkdtemp(join(tmpdir(),'portrait-3d-boundary-'));
  try {
    const result = run('generate','--input',join(directory,'missing.glb'),'--output',join(directory,'portrait.png'));
    assert.notEqual(result.status,0);
    assert.match(result.stdout,/SOURCE_MISSING/);
    await assert.rejects(readFile(join(directory,'portrait.png')),{code:'ENOENT'});
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test('old 2D pin workflow is retired before reading or writing assets', () => {
  const result = run('pin','--base','missing.png','--sex','female');
  assert.notEqual(result.status,0);
  assert.match(result.stdout,/RETIRED_2D_PIPELINE/);
});

test('old provider flags cannot dispatch remote image generation', () => {
  const result = run('generate','--provider','comfyui','--slot','hair');
  assert.notEqual(result.status,0);
  assert.match(result.stdout,/RETIRED_2D_PIPELINE/);
});
