import assert from 'node:assert/strict';
import test from 'node:test';
import { bootstrapPrivateProfiles } from './bootstrap-private-profiles.mjs';

test('private bootstrap requires explicit absolute paths and audit identity before input access', () => {
  for (const options of [{}, { sourceRoot: '/source', outputDirectory: '/tmp/output', actor: '', reason: 'test' },
    { sourceRoot: 'relative', outputDirectory: '/tmp/output', actor: 'test', reason: 'test' }]) {
    assert.throws(() => bootstrapPrivateProfiles(options), /E_PRIVATE_BOOTSTRAP_ARGUMENT/);
  }
});

test('private bootstrap cannot publish DBs or escape its restricted output parent', () => {
  for (const outputDirectory of ['/public/private', '/tmp/seoul-document-authority-20261020',
    '/tmp/seoul-document-authority-20261020/../outside']) {
    assert.throws(() => bootstrapPrivateProfiles({ sourceRoot: '/source', outputDirectory,
      actor: 'test', reason: 'test' }), /E_PRIVATE_BOOTSTRAP_OUTPUT/);
  }
});
