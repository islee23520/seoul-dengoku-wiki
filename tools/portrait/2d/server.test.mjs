import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'vitest';
import { startServer } from './server.mjs';
import { modularParts } from './modular-parts.mjs';

test('local GUI exposes all modular parts and rejects invalid preview without credentials', async () => {
  const server = startServer({ port: 0 });
  try {
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(`${base}/api/parts`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), Object.keys(modularParts));
    const invalid = await fetch(`${base}/api/preview`, { method: 'POST', body: JSON.stringify({ character: 'unknown', mode: 'portrait' }) });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error, 'unknown character');
    const page = await (await fetch(base)).text();
    assert.ok(page.includes("fetch('/api/parts')"));
    assert.equal(/apiKey|Authorization|Bearer/.test(page), false);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
