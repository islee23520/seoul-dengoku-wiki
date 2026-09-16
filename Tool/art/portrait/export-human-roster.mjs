/**
 * Project the authoritative human registry into a deployable roster file.
 *
 * `SERVICES.md` serves the demo folder at `/portrait-demo/`, so a browser there
 * cannot reach `../../Wikis/...`. This exporter writes the projection the demo
 * can fetch, and `--check` proves the committed projection still matches the
 * atlas it claims to come from.
 *
 * It is a projection, not a second identity authority: ids are copied, never
 * allocated or derived from order, no other cohort is admitted, and **no sex is
 * synthesized** — the atlas has no sex field, and the binding contract requires
 * an operator to state it deliberately.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractAtlasJson } from '../../wiki/world-atlas-parse.mjs';

export const ATLAS_PATH = 'Wikis/game-logic/World-Narrative-Atlas.md';
export const PROJECTED_FIELDS = ['id', 'name', 'role', 'stage', 'state_id', 'state_name'];
export const EXPECTED_HUMAN_COUNT = 1006;

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Last commit that touched the atlas, or null outside a usable git checkout. */
function sourceRevision(repoRoot, atlasPath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%H', '--', atlasPath], {
      cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * @param {{ repoRoot: string, atlasPath?: string, expectedCount?: number }} options
 * @returns {{ version: 1, source: { path: string, revision: string|null, sha256: string }, humans: object[] }}
 */
export function exportHumanRoster(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const atlasPath = options.atlasPath ?? ATLAS_PATH;
  const expected = options.expectedCount ?? EXPECTED_HUMAN_COUNT;
  const full = resolve(repoRoot, atlasPath);
  if (!existsSync(full)) throw new Error(`atlas not found: ${atlasPath}`);
  const bytes = readFileSync(full);

  const parsed = extractAtlasJson(bytes.toString('utf8'));
  if (!parsed.ok) throw new Error(`atlas unreadable: ${parsed.error}`);
  const stored = parsed.value.humans;
  if (!Array.isArray(stored)) throw new Error('atlas has no humans array');

  const seen = new Set();
  const humans = stored.map((human) => {
    const id = human?.id;
    if (typeof id !== 'string' || !id.trim()) throw new Error('atlas human without a stored id');
    if (seen.has(id)) throw new Error(`duplicate human id in the atlas: ${id}`);
    seen.add(id);
    const row = {};
    // Fixed field set, fixed order, nulls preserved: a corridor record really
    // has no state, and repairing that here would invent registry facts.
    for (const field of PROJECTED_FIELDS) row[field] = human[field] ?? null;
    return row;
  });
  if (humans.length !== expected) {
    throw new Error(`atlas projects ${humans.length} humans, expected ${expected}`);
  }

  return {
    version: 1,
    note: 'Read-only projection of the atlas human registry. No sex field exists or is synthesized.',
    source: { path: atlasPath, revision: sourceRevision(repoRoot, atlasPath), sha256: digest(bytes) },
    humans,
  };
}

/**
 * Compare a committed projection against a freshly computed one.
 * @returns {{ ok: boolean, drift: string[] }} drift names what moved, never a repair
 */
export function checkRoster(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const outFull = resolve(repoRoot, options.outPath);
  if (!existsSync(outFull)) return { ok: false, drift: ['missing'] };

  const fresh = exportHumanRoster(options);
  let committed;
  try {
    committed = JSON.parse(readFileSync(outFull, 'utf8'));
  } catch (error) {
    return { ok: false, drift: ['unparsable'], detail: error.message };
  }

  const drift = [];
  if (committed.version !== fresh.version) drift.push('version');
  if (committed.source?.path !== fresh.source.path) drift.push('source_path');
  if (committed.source?.sha256 !== fresh.source.sha256) drift.push('source_sha256');
  if (JSON.stringify(committed.humans) !== JSON.stringify(fresh.humans)) drift.push('humans');
  return { ok: drift.length === 0, drift };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const read = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
  try {
    const repoRoot = resolve(read('--repo-root', process.cwd()));
    const outPath = read('--out');
    if (!outPath) throw new Error('usage: --out <humans.json> [--check] [--repo-root <path>] [--expect <n>]');
    const expectedCount = read('--expect') ? Number(read('--expect')) : EXPECTED_HUMAN_COUNT;
    if (args.includes('--check')) {
      const result = checkRoster({ repoRoot, outPath, expectedCount });
      console.log(JSON.stringify({ checked: outPath, ...result }, null, 2));
      if (!result.ok) process.exitCode = 1;
    } else {
      const roster = exportHumanRoster({ repoRoot, expectedCount });
      mkdirSync(dirname(resolve(repoRoot, outPath)), { recursive: true });
      writeFileSync(resolve(repoRoot, outPath), `${JSON.stringify(roster, null, 2)}\n`);
      console.log(JSON.stringify({
        wrote: outPath, humans: roster.humans.length,
        source: roster.source, sex_field: 'absent by contract',
      }, null, 2));
    }
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
