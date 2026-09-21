import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const repoRoot = resolve(toolRoot, '../..');
const viewerRoot = resolve(toolRoot, 'viewer');
const runtimeRoot = resolve(repoRoot, 'ART-ASSETS/avatar-gen/runtime/female-underwear');

const routes = new Map([
  ['/', resolve(viewerRoot, 'index.html')],
  ['/viewer.css', resolve(viewerRoot, 'viewer.css')],
  ['/avatar-gen.bundle.mjs', resolve(viewerRoot, 'avatar-gen.bundle.mjs')],
  ['/avatar/female-underwear/avatar-contract.json', resolve(runtimeRoot, 'avatar-contract.json')],
  ['/avatar/female-underwear/female-underwear.glb', resolve(runtimeRoot, 'female-underwear.glb')],
]);

export function createAvatarServer({ host = '127.0.0.1', port = 8131 } = {}) {
  let server;
  let address;
  return {
    get url() { return address; },
    async start() {
      server = createServer(async (request, response) => {
        const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
        const path = routes.get(pathname);
        if (!path) { response.writeHead(404).end('Not found'); return; }
        try {
          const body = await readFile(path);
          response.setHeader('Content-Type', contentType(path));
          response.setHeader('Cache-Control', pathname.startsWith('/avatar/') ? 'no-cache' : 'public, max-age=300');
          response.writeHead(200).end(body);
        } catch { response.writeHead(404).end('Not found'); }
      });
      await new Promise((resolveStart, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => resolveStart());
      });
      const bound = server.address();
      const actualPort = typeof bound === 'object' && bound ? bound.port : port;
      address = `http://${host}:${actualPort}`;
      return address;
    },
    async stop() { if (server) await new Promise((resolveStop, reject) => server.close(error => error ? reject(error) : resolveStop())); },
  };
}

function contentType(path) {
  return ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.glb': 'model/gltf-binary' })[extname(path)] ?? 'application/octet-stream';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const portIndex = process.argv.indexOf('--port');
  const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 8131;
  const server = createAvatarServer({ port });
  server.start().then(url => console.log(`AVATAR_VIEWER_READY ${url}`));
  process.on('SIGINT', async () => { await server.stop(); process.exit(0); });
  process.on('SIGTERM', async () => { await server.stop(); process.exit(0); });
}
