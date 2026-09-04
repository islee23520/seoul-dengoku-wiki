import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  BUTTON_IDS,
  REQUIRED_ASSET_IDS,
  bomPath,
  collectMissingKitPaths,
  kitBomPath,
  promotedPng,
  readJson,
  repoRoot,
  unityPng,
  validatePromotedBom,
} from './poc-ui-kit-contract.mjs';
import { validateManifest } from './asset-manifest.mjs';

const pythonQa = fileURLToPath(new URL('./qa-poc-ui-kit.py', import.meta.url));
const cli = fileURLToPath(new URL('./pipeline-graph.mjs', import.meta.url));

function runPythonQa() {
  return spawnSync('python3', [pythonQa], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('POC UI/station kit files exist for every exclusive asset id', () => {
  const missing = collectMissingKitPaths();
  assert.equal(
    missing.length,
    0,
    `missing kit files:\n${missing.join('\n')}`,
  );
});

test('each exclusive asset BOM validates and matches promoted output hash at 0¢', () => {
  for (const assetId of REQUIRED_ASSET_IDS) {
    const document = readJson(bomPath(assetId));
    assert.equal(document.asset_id, assetId);
    const result = validatePromotedBom(document, promotedPng(assetId));
    assert.equal(result.ok, true, `${assetId}: ${JSON.stringify(result.errors)}`);
    const cliResult = spawnSync(process.execPath, [cli, 'validate-manifest', '--manifest', bomPath(assetId)], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(cliResult.status, 0, cliResult.stderr + cliResult.stdout);
  }
  const kit = readJson(kitBomPath());
  const kitResult = validateManifest(kit);
  assert.equal(kitResult.ok, true, JSON.stringify(kitResult.errors));
  assert.deepEqual(
    kit.assets.map((asset) => asset.asset_id).sort(),
    [...REQUIRED_ASSET_IDS].sort(),
  );
});

test('Unity promoted copies keep sidecar metas and matching bytes', () => {
  for (const assetId of REQUIRED_ASSET_IDS) {
    const promoted = promotedPng(assetId);
    const unity = unityPng(assetId);
    assert.equal(unity, promoted);
    const promotedBytes = spawnSync('cmp', ['-s', promoted, unity], { cwd: repoRoot });
    assert.equal(promotedBytes.status, 0, `${assetId} Art and Unity PNG differ`);
  }
});

test('geometry, alpha, 9-slice, icon 32px and tile seam QA pass', () => {
  const completed = runPythonQa();
  assert.equal(completed.status, 0, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, true, JSON.stringify(payload, null, 2));
  for (const id of BUTTON_IDS) {
    assert.equal(payload.buttons[id].width, payload.buttons[BUTTON_IDS[0]].width);
    assert.equal(payload.buttons[id].height, payload.buttons[BUTTON_IDS[0]].height);
  }
});

test('BOM validator blocks promotion when rights or model hash is stripped', async () => {
  const original = readJson(bomPath('poc-ui-panel-9slice'));
  const mutated = { ...original };
  delete mutated.rights_status;
  delete mutated.model;
  const tmp = await mkdtemp(join(tmpdir(), 'janseon-todo13-bom-'));
  const filePath = join(tmp, 'mutated.json');
  await writeFile(filePath, `${JSON.stringify(mutated, null, 2)}\n`);
  const completed = spawnSync(process.execPath, [cli, 'validate-manifest', '--manifest', filePath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(completed.status, 2, completed.stderr + completed.stdout);
  const payload = JSON.parse(completed.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.errors.some((error) => error.code === 'missing_field' && error.field === 'rights_status'));
  assert.ok(payload.errors.some((error) => error.code === 'missing_field' && error.field === 'model'));
  const live = validatePromotedBom(readJson(bomPath('poc-ui-panel-9slice')), promotedPng('poc-ui-panel-9slice'));
  assert.equal(live.ok, true, JSON.stringify(live.errors));
});
