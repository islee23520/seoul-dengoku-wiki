import assert from 'node:assert/strict';
import test from 'node:test';
import { bootstrapDocumentAuthority } from './bootstrap-document-authority.mjs';

test('bootstrap requires every explicit path and never supplies canonical defaults', async () => {
  await assert.rejects(bootstrapDocumentAuthority({}), /sourceRoot must be an explicit absolute path/u);
  await assert.rejects(bootstrapDocumentAuthority({ sourceRoot: '/source' }), /input must be an explicit absolute path/u);
});

test('bootstrap rejects outputs outside its restricted temp area before reading inputs', async () => {
  const options = { sourceRoot: '/source', input: '/input.sqlite', baseline: '/baseline.json',
    output: '/public/leak.sqlite', receipt: '/public/leak.json', actor: 'test', reason: 'test' };
  await assert.rejects(bootstrapDocumentAuthority(options), /restricted bootstrap temp directory/u);
  await assert.rejects(bootstrapDocumentAuthority({ ...options,
    output: '/tmp/seoul-document-authority-20261020/../leak.sqlite' }), /restricted bootstrap temp directory/u);
});

test('bootstrap rejects a missing audit identity before touching storage', async () => {
  await assert.rejects(bootstrapDocumentAuthority({ sourceRoot: '/source', input: '/input.sqlite', baseline: '/baseline.json',
    output: '/tmp/seoul-document-authority-20261020/test.sqlite', receipt: '/tmp/seoul-document-authority-20261020/test.json',
    actor: '', reason: 'test' }), /explicit actor and reason required/u);
});
