import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fitDistance } from '../viewer/framing.mjs';

const root = resolve(import.meta.dirname, '..', '..', '..');
const contractPath = resolve(root, 'ART-ASSETS/avatar-gen/runtime/female-underwear/avatar-contract.json');

test('shared contract declares renderer-aware coordinate conversions', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  assert.equal(contract.schemaVersion, 1);
  assert.deepEqual(contract.coordinateSystems.blender.axes, { handedness: 'right', up: '+Z', forward: '-Y', unitMeters: 1 });
  assert.deepEqual(contract.coordinateSystems.gltf.axes, { handedness: 'right', up: '+Y', forward: '+Z', unitMeters: 1 });
  assert.deepEqual(contract.coordinateSystems.unity.axes, { handedness: 'left', up: '+Y', forward: '+Z', unitMeters: 1 });
  assert.deepEqual(contract.coordinateSystems.blenderToGltf, [[1,0,0],[0,0,1],[0,-1,0]]);
  assert.deepEqual(contract.coordinateSystems.blenderToUnity, [[1,0,0],[0,0,1],[0,1,0]]);
  assert.deepEqual(contract.coordinateSystems.gltfToUnity, [[1,0,0],[0,1,0],[0,0,-1]]);
});

test('every toggleable element has a stable unique id and object name', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  assert.ok(contract.elements.length >= 30);
  assert.equal(new Set(contract.elements.map(element => element.id)).size, contract.elements.length);
  assert.equal(new Set(contract.elements.map(element => element.objectName)).size, contract.elements.length);
  assert.ok(contract.elements.every(element => element.defaultVisible === true));
});

test('avatar-gen contract excludes portrait generation concerns', async () => {
  const contract = JSON.parse(await readFile(contractPath, 'utf8'));
  assert.equal(contract.productSurface, 'full-body-avatar-viewer');
  assert.equal(contract.portraitGeneration, false);
  assert.equal(contract.web.format, 'glb');
  assert.equal(contract.unity.format, 'fbx');
});

test('full-body fit accounts for narrow viewport aspect', () => {
  const distance = fitDistance({ width: 1.9, height: 1.8, depth: 0.55, verticalFovRadians: 32 * Math.PI / 180, aspect: 480 / 838 });
  const horizontalHalfAtDepth = Math.tan(32 * Math.PI / 360) * (480 / 838) * (distance - 0.55 / 2);
  assert.ok(horizontalHalfAtDepth >= 1.9 / 2);
});

test('viewer source includes complete keyboard camera controls and loading guard', async () => {
  const source = await readFile(resolve(root, 'TOOL/avatar-gen/viewer/app.mjs'), 'utf8');
  assert.match(source, /event\.shiftKey/);
  assert.match(source, /orbitVertical/);
  assert.match(source, /viewer\.pan/);
  assert.match(source, /if \(!viewer\) return/);
  const html = await readFile(resolve(root, 'TOOL/avatar-gen/viewer/index.html'), 'utf8');
  assert.match(html, /id="viewport"[^>]+disabled/);
  assert.match(html, /placeholder="body, eye, tooth/);
});
