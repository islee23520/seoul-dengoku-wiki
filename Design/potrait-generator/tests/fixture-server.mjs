// Isolated browser QA server. Synthetic geometry is generated in memory, NEVER production art.
// Run: node Design/potrait-generator/tests/fixture-server.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { CANONICAL_SLOTS } from '../portrait-state.mjs';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, crc]);
}
function syntheticPNG(slotIndex, variant, sex, width = 1145, height = 1374) {
  const stride = width * 4 + 1, pixels = Buffer.alloc(stride * height);
  // An unmistakable test chart of translucent blocks, not a fake portrait.
  const x0 = 80 + (slotIndex % 5) * 160 + variant * 8;
  const y0 = 100 + Math.floor(slotIndex / 5) * 220 + variant * 12;
  for (let y = y0; y < Math.min(y0 + 280, height); y++) {
    for (let x = x0; x < Math.min(x0 + 240, width); x++) {
      const offset = y * stride + 1 + x * 4;
      pixels[offset] = 50 + slotIndex * 8;
      pixels[offset + 1] = 180 - variant * 8;
      pixels[offset + 2] = sex === 'female' ? 180 : 90;
      pixels[offset + 3] = 160;
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
function workflow(mode) {
  const states = mode === 'locked' ? ['IN_PROGRESS', 'BLOCKED', 'BLOCKED', 'BLOCKED']
    : mode === 'review-only' ? ['PASS', 'PASS', 'IN_PROGRESS', 'BLOCKED'] : ['PASS', 'PASS', 'PASS', 'PASS'];
  const buildGates = values => Object.fromEntries(values.map((status, index) => [`gateway${index + 1}`, {
    status, label: `Synthetic gateway ${index + 1}`,
    evidence: status === 'PASS' ? [{ path: `synthetic/gateway-${index + 1}.json`, sha256: String(index + 1).repeat(64) }] : []
  }]));
  const gates = buildGates(states);
  const locked = buildGates(['IN_PROGRESS', 'BLOCKED', 'BLOCKED', 'BLOCKED']);
  return { version: 1, active_profile: 'reference075', profiles: {
    reference055: { label: '보존형 0.55', mode: 'preservation', source: { path: 'synthetic/055.png', sha256: '5'.repeat(64) }, gates: mode === 'mixed' ? locked : gates },
    reference075: { label: '변형형 0.75', mode: 'variation', source: { path: 'synthetic/075.png', sha256: '7'.repeat(64) }, gates: structuredClone(gates) }
  }, tools: [
    { id: 'comfyui', label: 'ComfyUI', role: 'source', unlock_after: 0 },
    { id: 'see-through', label: 'see-through', role: 'split', unlock_after: 0 },
    { id: 'anime25d', label: 'Anime2.5DRig', role: 'quick-rig', unlock_after: 1 },
    { id: 'standrig', label: 'StandRig', role: 'precision-rig', unlock_after: 1 },
    { id: 'composite', label: '동적 슬롯 합성', role: 'combination', unlock_after: 2 },
    { id: 'curation', label: '큐레이션', role: 'curation', unlock_after: 2 },
    { id: 'delivery', label: '내보내기', role: 'delivery', unlock_after: 4 }
  ] };
}
const cache = new Map();
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const send = (status, type, body) => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };
  const toolModule = url.pathname.match(/^\/(fixture|locked|review-only|mixed|missing|image-error|dimension-error|malformed)\/Tool\/art\/portrait\/portrait-gateway\.mjs$/);
  if (toolModule) {
    try { return send(200, 'text/javascript', await readFile(new URL('../../../Tool/art/portrait/portrait-gateway.mjs', import.meta.url))); }
    catch (error) { return send(500, 'text/plain', error.message); }
  }
  const rigDocument = url.pathname.match(/^\/(fixture|locked|review-only|mixed|missing|image-error|dimension-error|malformed)\/Tool\/art\/portrait\/portrait-attachment-rigs\.json$/);
  if (rigDocument) return send(200, 'application/json', await readFile(new URL('../../../Tool/art/portrait/portrait-attachment-rigs.json', import.meta.url)));
  const match = url.pathname.match(/^\/(fixture|locked|review-only|mixed|missing|image-error|dimension-error|malformed)\/Design\/potrait-generator\/(.*)$/);
  if (!match) return send(404, 'text/plain', 'Synthetic QA route not found');
  const [, mode, file] = match;
  if (file === 'assets/v2/library.json') {
    if (mode === 'missing') return send(404, 'application/json', '{"error":"Synthetic missing manifest"}');
    if (mode === 'malformed') return send(200, 'application/json', '{invalid');
    return send(200, 'application/json', await readFile(new URL('../assets/v2/library.json', import.meta.url)));
  }
  if (file === 'assets/v2/workflow.json') return send(200, 'application/json', JSON.stringify(workflow(mode)));
  if (['assets/v2/curation-catalog.json','assets/v2/validation-index.json'].includes(file)) return send(200, 'application/json', await readFile(new URL(`../${file}`, import.meta.url)));
  if (file.startsWith('assets/v2/')) { try { return send(200, file.endsWith('.png') ? 'image/png' : 'application/octet-stream', await readFile(new URL(`../${file}`, import.meta.url))); } catch { return send(404, 'text/plain', 'asset missing'); } }
  if (!['index.html','portrait.css','portrait-curation.css','portrait-ui.mjs','portrait-state.mjs','portrait-workflow-ui.mjs','portrait-curation.mjs','portrait-rig-overlay.mjs','portrait-browser-composite.mjs','portrait-browser-png.mjs'].includes(file)) return send(404, 'text/plain', 'Not found');
  try {
    let body = await readFile(new URL(`../${file}`, import.meta.url));
    if (file === 'index.html') body = Buffer.from(body.toString().replace('<main>', '<main><p role="note" style="color:#ffcf79;font-weight:bold">SYNTHETIC FIXTURE QA · 검증용 도형 / 실제 초상 에셋 아님</p>'));
    send(200, file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.css') ? 'text/css' : 'text/javascript', body);
  } catch (error) { console.error(error); send(500, 'text/plain', error.message); }
});
server.listen(Number(process.argv[2] ?? 18766), '127.0.0.1', () => console.log(`Synthetic-only QA: http://127.0.0.1:${server.address().port}/fixture/Design/potrait-generator/index.html`));
