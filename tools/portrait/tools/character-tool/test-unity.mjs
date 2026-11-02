import { test } from 'vitest';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unityCommand, validateMotionManifest } from './unity.mjs';

test('Unity staging import ships an executable editor hook', () => {
  assert.ok(existsSync(fileURLToPath(new URL('./unity/CharacterToolImporter.cs', import.meta.url))),
    'Unity character import hook is not implemented');
});

test('installed Unity editor hook equals the shipped CLI template', async () => {
  const template = await readFile(new URL('./unity/CharacterToolImporter.cs', import.meta.url),'utf8');
  const project = await mkdtemp(join(tmpdir(), 'character-unity-install-'));
  try {
    await mkdir(join(project, 'ProjectSettings'));
    await writeFile(join(project, 'ProjectSettings/ProjectVersion.txt'), 'm_EditorVersion: 6000.7.0a5\n');
    const result = await unityCommand({ command: 'unity-install', project });
    assert.equal(result.action, 'installed');
    assert.equal(await readFile(result.hook, 'utf8'), template);
    assert.equal((await unityCommand({ command: 'unity-install', project })).action, 'unchanged');
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

const motionManifest = () => ({version: 1, kind: 'animation', rigged: true, motion: {
  sourceAvatar: 'Assets/Art/Staging/body/body.fbx',
  clips: [{name: 'Walk', takeName: 'Take', firstFrame: 0, lastFrame: 30,
    loopTime: true, loopPose: true, lockRootRotation: true, lockRootHeightY: true, lockRootPositionXZ: true}],
}});

test('animation-only contract requires canonical Humanoid Avatar and explicit loop/root settings', () => {
  assert.doesNotThrow(() => validateMotionManifest(motionManifest(), 'humanoid'));
  assert.doesNotThrow(() => validateMotionManifest({version: 1, heightMeters: 1.75, rigged: false}, 'generic'));
  for (const mutate of [
    m => { m.rigged = false; },
    m => { m.motion.sourceAvatar = 'Assets/../body.fbx'; },
    m => { m.motion.clips[0].lastFrame = NaN; },
    m => { delete m.motion.clips[0].lockRootPositionXZ; },
    m => { m.motion.clips.push({...m.motion.clips[0]}); },
    m => { m.motion.clips[0].takeName = ''; },
  ]) {
    const manifest = motionManifest(); mutate(manifest);
    assert.throws(() => validateMotionManifest(manifest, 'humanoid'), {code: 'UNITY_MOTION'});
  }
  assert.throws(() => validateMotionManifest(motionManifest(), 'generic'), {code: 'UNITY_MOTION'});
});
