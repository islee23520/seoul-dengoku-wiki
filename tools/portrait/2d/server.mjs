#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { emit, formatPrompt, generate, listCharacters, listOptions, publicPrompt } from './emit-character-prompt.mjs';
import { modularParts } from './modular-parts.mjs';
import { readFaceCatalog } from './face-selection.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const characterPath = async (key) => {
  if (!(await listCharacters()).some((entry) => entry.key === key)) throw new Error('unknown character');
  return join(root, 'characters', `${key}.json`);
};

export function startServer({ port = 8131, referencePath, stylePath = join(root, 'style-lock.json'), identityReferences = {}, outputDir, canonicalRoot = null, faceVariantCatalogPath = process.env.PORTRAIT_FACE_CATALOG ?? null } = {}) {
  let catalogCache;
  const catalog = () => catalogCache ??= readFaceCatalog(faceVariantCatalogPath);
  const server = createServer(async (request, response) => {
    const send = (status, data) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify(data));
    };
    try {
      if (request.method === 'GET' && request.url === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(await readFile(join(root, 'index.html')));
      } else if (request.method === 'GET' && request.url.startsWith('/api/image/')) {
        const name = decodeURIComponent(request.url.slice('/api/image/'.length));
        if (!outputDir || !/^[a-z0-9-]+\.png$/.test(name)) throw new Error('invalid image name');
        const image = await readFile(join(outputDir, name));
        response.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        response.end(image);
      } else if (request.method === 'GET' && request.url === '/api/options') send(200, await listOptions());
      else if (request.method === 'GET' && request.url === '/api/face-variants') {
        const data = await catalog();
        send(200, { ...data, variants: data.variants.map(({ referenceImagePath, ...variant }) => ({ ...variant, assetStatus: referenceImagePath ? 'reference-available' : 'traits-only' })) });
      }
      else if (request.method === 'GET' && request.url === '/api/parts') send(200, Object.keys(modularParts));
      else if (request.method === 'GET' && request.url === '/api/characters') send(200, await listCharacters());
      else if (request.method === 'POST' && ['/api/preview', '/api/generate'].includes(request.url)) {
        let body = '';
        for await (const chunk of request) {
          body += chunk;
          if (body.length > 65536) throw new Error('request too large');
        }
        const payload = JSON.parse(body);
        const input = { canonicalRoot, requireFaceMode: true, faceMode: payload.faceMode, faceSelection: payload.faceSelection, faceVariantCatalogPath, character: payload.record ?? await characterPath(payload.character), mode: payload.mode, part: payload.part ?? null, view: payload.view ?? null, mangaStyle: payload.mangaStyle ?? 'owner-reference', slotOverrides: payload.slotOverrides ?? payload.slotReplacements ?? {}, selectedReferenceSha256: payload.selectedReferenceSha256 ?? null, overrides: payload.overrides ?? {}, stylePath, referencePath };
        if (request.url === '/api/preview') {
          const result = publicPrompt(await emit(input));
          send(200, { ...result, yaml: formatPrompt(result, 'yaml') });
        }
        else {
          if (!outputDir) throw new Error('output directory required for generation');
          const file = `${payload.character}-${payload.mode}${payload.view ? `-${payload.view}` : ''}${payload.part ? `-${payload.part}` : ''}-${randomUUID()}.png`;
          send(200, { ...publicPrompt(await generate(input, { output: join(outputDir, file), identityReference: identityReferences[payload.character] ?? null, generator: `${process.env.HOME}/.agents/skills/asset-gen/tools/asset_gen.py` })), imageUrl: `/api/image/${file}` });
        }
      } else send(404, { error: 'not found' });
    } catch (error) { send(400, { error: error.message }); }
  });
  server.listen(port, '127.0.0.1');
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
  if (!arg('--reference')) { console.error('usage: --reference <B.png> [--port 8131] [--output-dir <dir>] [--canonical-root <dir>]'); process.exit(2); }
  const identityReferences = arg('--identity-map') ? JSON.parse(await readFile(arg('--identity-map'), 'utf8')) : {};
  startServer({ referencePath: arg('--reference'), identityReferences, outputDir: arg('--output-dir'), canonicalRoot: arg('--canonical-root'), port: Number(arg('--port') ?? 8131) });
  console.error('portrait-template GUI listening on 127.0.0.1');
}
