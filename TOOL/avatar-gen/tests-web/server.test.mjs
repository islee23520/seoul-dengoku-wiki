import test from 'node:test';
import assert from 'node:assert/strict';
import { createAvatarServer } from '../server/serve.mjs';

test('server exposes only viewer and registered runtime assets', async () => {
  const server = createAvatarServer({ port: 0 });
  await server.start();
  try {
    const base = server.url;
    assert.equal((await fetch(`${base}/`)).status, 200);
    assert.equal((await fetch(`${base}/avatar/female-underwear/avatar-contract.json`)).status, 200);
    assert.equal((await fetch(`${base}/avatar/female-underwear/female-underwear.glb`)).status, 200);
    assert.equal((await fetch(`${base}/../../AGENTS.md`)).status, 404);
    assert.equal((await fetch(`${base}/avatar/female-underwear/source.blend`)).status, 404);
  } finally {
    await server.stop();
  }
});
