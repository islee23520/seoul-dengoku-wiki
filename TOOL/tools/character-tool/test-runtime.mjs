import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidates, stagingPath } from './runtime.mjs';

test('discovery includes OS-native Blender executable locations', () => {
  assert.ok(candidates('darwin', {}, '/Users/test').includes('/Applications/Blender.app/Contents/MacOS/Blender'));
  assert.ok(candidates('linux', {}, '/home/test').includes('/usr/bin/blender'));
  assert.ok(candidates('win32', { ProgramFiles: 'D:/Programs' }, 'D:/Users/test').some(p => p.includes('D:/Programs')));
});

test('staging path accepts only descendants and rejects traversal', () => {
  assert.equal(stagingPath('Assets/Art/Staging/Example'), 'Assets/Art/Staging/Example');
  for (const input of ['Assets/Resources/X', 'Assets/Art/Staging/../X', 'Assets/Art/Staging//X', '/Assets/Art/Staging/X']) {
    assert.throws(() => stagingPath(input), { code: 'STAGING_PATH' });
  }
});
