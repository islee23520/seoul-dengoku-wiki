import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  OFFICIAL_TRELLIS_HOST_CONTRACT,
  TRELLIS_COMMIT,
  TRELLIS_MODEL,
  validateTrellisHostContract,
} from './trellis-host-contract.mjs';

const cli = new URL('./trellis-host-contract.mjs', import.meta.url);

function matchingObserved(overrides = {}) {
  return {
    repo: OFFICIAL_TRELLIS_HOST_CONTRACT.repo,
    commit: TRELLIS_COMMIT,
    model: TRELLIS_MODEL,
    license: 'MIT',
    execution: 'direct_python',
    tool: 'trellis',
    provider: 'microsoft',
    python: '3.10.14',
    pytorch: '2.4.0+cu118',
    cuda: '11.8',
    gpu_name: 'NVIDIA GeForce RTX 4080',
    vram_mib: 16376,
    driver: '610.62',
    host_root: 'E:\\git\\janseon-asset-pipeline',
    ...overrides,
  };
}

test('official pin names microsoft TRELLIS v1 image-large at the locked commit', () => {
  assert.equal(OFFICIAL_TRELLIS_HOST_CONTRACT.repo, 'https://github.com/microsoft/TRELLIS');
  assert.equal(TRELLIS_COMMIT, '442aa1e1afb9014e80681d3bf604e8d728a86ee7');
  assert.equal(TRELLIS_MODEL, 'microsoft/TRELLIS-image-large');
  assert.equal(OFFICIAL_TRELLIS_HOST_CONTRACT.license, 'MIT');
  assert.equal(OFFICIAL_TRELLIS_HOST_CONTRACT.execution, 'direct_python');
  assert.equal(OFFICIAL_TRELLIS_HOST_CONTRACT.min_vram_mib, 16000);
  assert.equal(OFFICIAL_TRELLIS_HOST_CONTRACT.cpu_fallback, false);
});

test('matching official pin is accepted and may proceed to gpu work', () => {
  const result = validateTrellisHostContract(matchingObserved());
  assert.equal(result.ok, true);
  assert.deepEqual(result.codes, []);
  assert.equal(result.refused_before_gpu, false);
  assert.equal(result.allow_inference, true);
});

test('wrong commit is refused before gpu work', () => {
  const result = validateTrellisHostContract(matchingObserved({
    commit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  }));
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('wrong_commit'));
  assert.equal(result.refused_before_gpu, true);
  assert.equal(result.allow_inference, false);
});

test('wrong model is refused before gpu work', () => {
  const result = validateTrellisHostContract(matchingObserved({
    model: 'microsoft/TRELLIS-text-xlarge',
  }));
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('wrong_model'));
  assert.equal(result.refused_before_gpu, true);
  assert.equal(result.allow_inference, false);
});

test('community trellis2 comfyui azure tripo and cpu backends are refused before gpu work', () => {
  const cases = [
    { execution: 'trellis2', code: 'community_backend_forbidden' },
    { execution: 'comfyui', code: 'community_backend_forbidden' },
    { tool: 'comfyui', code: 'community_backend_forbidden' },
    { provider: 'azure', code: 'unapproved_backend_forbidden' },
    { provider: 'tripo3d', code: 'unapproved_backend_forbidden' },
    { execution: 'cpu', code: 'cpu_fallback_forbidden' },
    { device: 'cpu', code: 'cpu_fallback_forbidden' },
  ];
  for (const { code, ...overrides } of cases) {
    const result = validateTrellisHostContract(matchingObserved(overrides));
    assert.equal(result.ok, false, JSON.stringify(overrides));
    assert.ok(result.codes.includes(code), `${code} missing for ${JSON.stringify(overrides)}: ${result.codes}`);
    assert.equal(result.refused_before_gpu, true);
    assert.equal(result.allow_inference, false);
  }
});

test('vram below 16 GiB fails the host gate before gpu work', () => {
  const result = validateTrellisHostContract(matchingObserved({ vram_mib: 12288 }));
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('vram_below_minimum'));
  assert.equal(result.refused_before_gpu, true);
  assert.equal(result.allow_inference, false);
});

test('cli refuses a disposable wrong commit pin before gpu work', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'trellis-host-red-'));
  const observedPath = join(dir, 'wrong-commit.json');
  await writeFile(observedPath, JSON.stringify(matchingObserved({
    commit: '0000000000000000000000000000000000000000',
  })), 'utf8');
  const spawned = spawnSync(process.execPath, [fileURLToPath(cli), 'check', '--observed', observedPath], {
    encoding: 'utf8',
  });
  await rm(dir, { recursive: true, force: true });
  assert.notEqual(spawned.status, 0);
  const payload = JSON.parse(spawned.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.codes.includes('wrong_commit'));
  assert.equal(payload.refused_before_gpu, true);
  assert.equal(payload.allow_inference, false);
});

test('missing required receipt fields are rejected', () => {
  const result = validateTrellisHostContract({ commit: TRELLIS_COMMIT });
  assert.equal(result.ok, false);
  assert.ok(result.codes.includes('missing_required_field'));
  assert.equal(result.refused_before_gpu, true);
});
