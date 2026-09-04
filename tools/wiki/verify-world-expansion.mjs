import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_KINDS = new Set(['verified', 'inference', 'original-fiction']);
const STAGES = new Set(['foundation']);
const NOTICE_FILE = 'Unofficial-Fan-AU-Notice.md';
const SOURCES_FILE = 'Research-Sources.md';
const BRIDGE_REL = join('.omo', 'research-private', 'nippon-sangoku-canon-bridge.md');
const BRIDGE_PUBLIC_NAME = 'nippon-sangoku-canon-bridge.md';
const INJECTION_RE = /ignore\s+previous\s+instructions|system\s+prompt|you\s+are\s+now|print\s+the\s+private/i;

function parseArgs(argv) {
  const opts = { docs: null, stage: 'foundation', expansion: null };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const take = () => {
      i += 1;
      if (argv[i] === undefined) throw new Error(`missing value for ${flag}`);
      return argv[i];
    };
    if (flag === '--docs') opts.docs = take();
    else if (flag === '--stage') opts.stage = take();
    else if (flag === '--expansion') opts.expansion = take();
    else throw new Error(`unknown argument: ${flag}`);
  }
  if (!opts.docs) throw new Error('--docs is required');
  if (!STAGES.has(opts.stage)) throw new Error(`invalid --stage ${opts.stage}`);
  return opts;
}

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
}

function extractJsonFence(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { ok: false, error: 'missing json fence' };
  try {
    return { ok: true, value: JSON.parse(match[1]) };
  } catch (err) {
    return { ok: false, error: err instanceof SyntaxError ? err.message : 'invalid json fence' };
  }
}

function idSet(items) {
  return new Set((items ?? []).map((item) => item.id).filter(Boolean));
}

function proseSentences(prose) {
  const body = String(prose ?? '')
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join('\n')
    .trim();
  if (body === '') return [];
  return body
    .split(/(?<=[.。!?])(?:\s+|$)/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

function verifySources(text, fail) {
  const parsed = extractJsonFence(text);
  if (!parsed.ok) {
    fail('E_MALFORMED', `${SOURCES_FILE} ${parsed.error}`);
    return;
  }
  const records = parsed.value.records ?? parsed.value;
  if (!Array.isArray(records)) {
    fail('E_MALFORMED', `${SOURCES_FILE} records must be an array`);
    return;
  }
  for (const record of records) {
    if (!SOURCE_KINDS.has(record.source_kind)) {
      fail('E_UNKNOWN_SOURCE_KIND', `${record.id ?? '?'} kind=${record.source_kind}`);
    }
    if (INJECTION_RE.test(String(record.quotation ?? ''))) {
      fail('E_SOURCE_INJECTION', record.id ?? 'quotation');
    }
  }
}

function verifyExpansion(expansion, fail) {
  if (expansion === null || typeof expansion !== 'object' || Array.isArray(expansion)) {
    fail('E_MALFORMED', 'expansion must be an object');
    return;
  }
  const actors = expansion.actors ?? [];
  const actorIds = idSet(actors);
  for (const batch of expansion.batches ?? []) {
    for (const id of batch.actorIds ?? []) {
      if (!actorIds.has(id)) fail('E_MISSING_ACTOR', id);
    }
  }
  const quotas = expansion.quotas;
  if (quotas && typeof quotas === 'object') {
    const counts = {};
    for (const actor of actors) {
      counts[actor.origin] = (counts[actor.origin] ?? 0) + 1;
    }
    for (const [origin, expected] of Object.entries(quotas)) {
      if ((counts[origin] ?? 0) !== expected) {
        fail('E_QUOTA_DRIFT', `${origin} actual=${counts[origin] ?? 0} expected=${expected}`);
      }
    }
  }
  const seen = new Map();
  for (const actor of actors) {
    for (const sentence of proseSentences(actor.prose)) {
      if (seen.has(sentence)) fail('E_DUPLICATE_SENTENCE', sentence);
      else seen.set(sentence, actor.id);
    }
  }
  const houses = idSet(expansion.houses);
  const theaters = idSet(expansion.theaters);
  const groups = idSet(expansion.groups);
  for (const relation of expansion.relations ?? []) {
    for (const endpoint of [relation.from, relation.to]) {
      if (!actorIds.has(endpoint)) fail('E_DANGLING_RELATION', endpoint);
    }
  }
  for (const actor of actors) {
    if (actor.houseId && !houses.has(actor.houseId)) fail('E_DANGLING_HOUSE', actor.houseId);
    if (actor.theaterId && !theaters.has(actor.theaterId)) fail('E_DANGLING_THEATER', actor.theaterId);
    if (actor.groupId && !groups.has(actor.groupId)) fail('E_DANGLING_GROUP', actor.groupId);
  }
}

export async function verifyWorldExpansion(options) {
  const docs = options.docs;
  const repoRoot = resolve(docs, '..', '..');
  const violations = [];
  const fail = (rule, detail) => {
    violations.push({ rule, detail });
  };

  const notice = await readOptional(join(docs, NOTICE_FILE));
  if (notice === null || !notice.includes('비공식') || !notice.includes('비상업')) {
    fail('E_MISSING_NOTICE', NOTICE_FILE);
  }

  const sourcesText = await readOptional(join(docs, SOURCES_FILE));
  if (sourcesText === null) fail('E_MALFORMED', `${SOURCES_FILE} missing`);
  else verifySources(sourcesText, fail);

  if ((await readOptional(join(repoRoot, BRIDGE_REL))) === null) {
    fail('E_MISSING_BRIDGE', BRIDGE_REL);
  }
  if ((await readOptional(join(docs, BRIDGE_PUBLIC_NAME))) !== null) {
    fail('E_BRIDGE_PUBLISHED', BRIDGE_PUBLIC_NAME);
  }

  if (options.expansion) {
    let expansion;
    try {
      expansion = JSON.parse(await readFile(options.expansion, 'utf8'));
    } catch (err) {
      fail('E_MALFORMED', err instanceof SyntaxError ? err.message : 'unreadable expansion');
      return { violations };
    }
    verifyExpansion(expansion, fail);
  }

  return { violations };
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
    return;
  }
  const { violations } = await verifyWorldExpansion(opts);
  for (const item of violations) {
    console.error(`${item.rule}: ${item.detail}`);
  }
  process.exitCode = violations.length === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
