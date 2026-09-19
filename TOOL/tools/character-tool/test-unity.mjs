import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

test('Unity staging import ships an executable editor hook', () => {
  assert.ok(existsSync(fileURLToPath(new URL('./unity/CharacterToolImporter.cs', import.meta.url))),
    'Unity character import hook is not implemented');
});

test('installed Unity editor hook equals the shipped CLI template', async () => {
  const template = await readFile(new URL('./unity/CharacterToolImporter.cs', import.meta.url),'utf8');
  const installed = await readFile(new URL('../../../GAME/Assets/Editor/CharacterTool/CharacterToolImporter.cs', import.meta.url),'utf8');
  assert.equal(installed,template);
});
