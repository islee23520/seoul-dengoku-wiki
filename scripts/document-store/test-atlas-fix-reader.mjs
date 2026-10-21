import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { materializeAtlasFixSuccessor } from '../atlas-fix-materializer.mjs';
import { materializeAtlasFixSuccessor as legacyMaterialize } from '../../.omo/private/seoul-migration/doc247-atlas-fix-20261019/materialize-successor.mjs';

test('atlas successor retains exact legacy materialization using supplied captured bytes without filesystem', async () => {
  const root = resolve(import.meta.dirname, '../..');
  const expected = await legacyMaterialize(root);
  const captured = new Map();
  const reader = async path => {
    const bytes = await readFile(path);
    captured.set(relative(root, path), bytes);
    return bytes;
  };
  assert.deepEqual(await materializeAtlasFixSuccessor(root, reader), expected);
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile];
  try {
    fs.readFileSync = fs.readFile = fsp.readFile = () => { throw Error('atlas materializer filesystem forbidden'); };
    syncBuiltinESMExports();
    const sealedRoot = '/sealed-atlas-fix';
    const sealed = async path => {
      const key = relative(sealedRoot, path);
      assert.ok(captured.has(key), key);
      return captured.get(key);
    };
    assert.deepEqual(await materializeAtlasFixSuccessor(sealedRoot, sealed), expected);
    await assert.rejects(materializeAtlasFixSuccessor(sealedRoot, async path =>
      relative(sealedRoot, path) === 'lore/World-Narrative-Atlas.json' ? Buffer.from('{}') : sealed(path)), /E_ATLAS_HASH/u);
  } finally { [fs.readFileSync, fs.readFile, fsp.readFile] = saved; syncBuiltinESMExports(); }
});
