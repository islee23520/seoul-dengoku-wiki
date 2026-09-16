import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import {
  PROJECTED_FIELDS,
  checkRoster,
  exportHumanRoster,
} from './export-human-roster.mjs';

const REPO_ROOT = new URL('../../../', import.meta.url).pathname;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function workspace(t) {
  const root = mkdtempSync(join(tmpdir(), 'human-roster-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (rel, body) => {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
    return full;
  };
  return { root, put };
}

function atlasMarkdown(humans, extra = {}) {
  return ['# atlas', '', '```json', JSON.stringify({
    schema: 'world-narrative-atlas.v1',
    humans,
    synthetics: [{ id: 'H01', display_name: '한누리' }],
    hostile_groups: [{ id: 'G01' }],
    ...extra,
  }, null, 2), '```', ''].join('\n');
}

test('the projection carries identity and labels only — never a synthesized sex', () => {
  assert.deepEqual(PROJECTED_FIELDS, ['id', 'name', 'role', 'stage', 'state_id', 'state_name']);
  assert.equal(PROJECTED_FIELDS.includes('sex'), false);
});

test('the live atlas projects exactly its 1006 stored humans', () => {
  const roster = exportHumanRoster({ repoRoot: REPO_ROOT });
  assert.equal(roster.version, 1);
  assert.equal(roster.humans.length, 1006);
  assert.equal(new Set(roster.humans.map((h) => h.id)).size, 1006);
  assert.equal(roster.source.path, 'Wikis/game-logic/World-Narrative-Atlas.md');
  assert.equal(roster.source.sha256, sha256(readFileSync(join(REPO_ROOT, roster.source.path))));

  const first = roster.humans[0];
  const last = roster.humans.at(-1);
  assert.equal(first.id, 'K001');
  assert.equal(first.name, '한재목');
  assert.equal(last.id, 'K1006');
  assert.equal(last.name, '최일석');
  // Corridor records legitimately carry null labels; that is projected, not repaired.
  assert.equal(last.state_id, null);
  for (const human of roster.humans) {
    assert.deepEqual(Object.keys(human), PROJECTED_FIELDS);
    assert.equal('sex' in human, false);
  }
});

test('other cohorts never enter the human roster', (t) => {
  const { root, put } = workspace(t);
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown([
    { id: 'K001', name: '가', role: 'r', stage: 'S1', state_id: 'S01', state_name: '국' },
  ]));
  const roster = exportHumanRoster({ repoRoot: root, expectedCount: 1 });
  assert.deepEqual(roster.humans.map((h) => h.id), ['K001']);
});

test('reordering the atlas changes ordering at most, never an id-to-name binding', (t) => {
  const { root, put } = workspace(t);
  const humans = [
    { id: 'K001', name: '가', role: 'r1', stage: 'S1', state_id: 'S01', state_name: '국1' },
    { id: 'K002', name: '나', role: 'r2', stage: 'S2', state_id: 'S02', state_name: '국2' },
  ];
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown(humans));
  const straight = exportHumanRoster({ repoRoot: root, expectedCount: 2 });
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown([...humans].reverse()));
  const reversed = exportHumanRoster({ repoRoot: root, expectedCount: 2 });

  const nameOf = (roster, id) => roster.humans.find((h) => h.id === id).name;
  for (const id of ['K001', 'K002']) assert.equal(nameOf(reversed, id), nameOf(straight, id));
  assert.equal(reversed.humans.length, 2);
});

test('a duplicated id or a missing id fails closed', (t) => {
  const { root, put } = workspace(t);
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown([
    { id: 'K001', name: '가' }, { id: 'K001', name: '나' },
  ]));
  assert.throws(() => exportHumanRoster({ repoRoot: root, expectedCount: 2 }), /duplicate/i);

  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown([{ name: '이름 없음' }]));
  assert.throws(() => exportHumanRoster({ repoRoot: root, expectedCount: 1 }), /id/i);
});

test('an unexpected human count fails closed rather than shipping a partial roster', (t) => {
  const { root, put } = workspace(t);
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown([{ id: 'K001', name: '가' }]));
  assert.throws(() => exportHumanRoster({ repoRoot: root, expectedCount: 1006 }), /1006/);
});

test('check mode catches a stale projection and a stale source hash', (t) => {
  const { root, put } = workspace(t);
  const humans = [{ id: 'K001', name: '가', role: 'r', stage: 'S1', state_id: 'S01', state_name: '국' }];
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown(humans));
  const roster = exportHumanRoster({ repoRoot: root, expectedCount: 1 });
  put('assets/humans.json', `${JSON.stringify(roster, null, 2)}\n`);
  assert.deepEqual(checkRoster({ repoRoot: root, outPath: 'assets/humans.json', expectedCount: 1 }),
    { ok: true, drift: [] });

  // The atlas moved on; the committed projection did not.
  put('Wikis/game-logic/World-Narrative-Atlas.md', atlasMarkdown([
    ...humans, { id: 'K002', name: '나', role: 'r', stage: 'S1', state_id: 'S01', state_name: '국' },
  ]));
  const stale = checkRoster({ repoRoot: root, outPath: 'assets/humans.json', expectedCount: 2 });
  assert.equal(stale.ok, false);
  assert.ok(stale.drift.includes('source_sha256'));
  assert.ok(stale.drift.includes('humans'));

  // A projection that never existed is drift, not a crash.
  const absent = checkRoster({ repoRoot: root, outPath: 'assets/missing.json', expectedCount: 2 });
  assert.equal(absent.ok, false);
  assert.ok(absent.drift.includes('missing'));
});
