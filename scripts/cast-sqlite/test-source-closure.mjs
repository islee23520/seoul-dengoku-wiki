import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { mapSourceClosureDomains, REFERENCE_TARGET_PATHS } from './source-closure.mjs';

const HOLDER_PATHS = [
  'lore/name-pools/cast-birthdays.json',
  'lore/name-pools/cast-family-trees.json',
  'lore/name-pools/cast-family-parent-status.json',
  'lore/name-pools/cast-family-role-decisions.json',
  'lore/name-pools/cast-household-relations.json',
  'lore/name-pools/household-humanoid-policy.json',
  'lore/relations/relations.json',
  'lore/relations/personal-holdings.json',
  'lore/relations/opening-office-appointments.json',
  'lore/name-pools/cast-prose-contacts.json',
];

function file(logical_path, source_id, document) {
  return { logical_path, source_id, sha256: 'a'.repeat(64), byte_length: 1, document };
}

function bundle(ref = { path: 'lore/World-Narrative-Atlas.json', anchor: '/content/0' }) {
  const files = HOLDER_PATHS.map((logical_path, index) => file(logical_path, index + 1,
    logical_path === HOLDER_PATHS[0] ? { people: [{ sourceRefs: [ref] }] } : {}));
  const referenceFiles = REFERENCE_TARGET_PATHS.filter((logical_path) => !HOLDER_PATHS.includes(logical_path))
    .map((logical_path) => file(logical_path, null, logical_path === 'lore/World-Narrative-Atlas.json' ? { content: [{}] } : {}));
  return { files, referenceFiles };
}

test('Given a fixed primary holder and JSON pointer target, when closure maps references, then it binds holder and verified target hash', () => {
  const rows = mapSourceClosureDomains({ bundle: bundle() });

  assert.deepEqual(rows.reference_source.find((row) => row.logical_path === 'lore/World-Narrative-Atlas.json'), {
    logical_path: 'lore/World-Narrative-Atlas.json', sha256: 'a'.repeat(64), byte_length: 1,
    source_class: 'reference-hash-only',
  });
  assert.equal(rows.reference_source.length, REFERENCE_TARGET_PATHS.length);
  assert.deepEqual(rows.source_reference, [{
    source_id: 1, json_pointer: '/people/0/sourceRefs/0', ordinal: 0,
    reference_logical_path: 'lore/World-Narrative-Atlas.json', reference_anchor: '/content/0',
    anchor_verification: 'json-pointer-verified',
  }]);
});

test('Given a sourceRef whose target is outside the fixed allowlist, when closure maps references, then it fails closed', () => {
  assert.throws(() => mapSourceClosureDomains({ bundle: bundle({ path: '../outside.json' }) }), { code: 'E_REFERENCE_PATH' });
});

test('Given a sourceRef with an unresolved JSON pointer, when closure maps references, then it records a distinct issue status', () => {
  const rows = mapSourceClosureDomains({ bundle: bundle({ path: 'lore/World-Narrative-Atlas.json', anchor: '/content/1' }) });
  assert.deepEqual(rows.source_reference[0], {
    source_id: 1, json_pointer: '/people/0/sourceRefs/0', ordinal: 0,
    reference_logical_path: 'lore/World-Narrative-Atlas.json', reference_anchor: '/content/1',
    anchor_verification: 'json-pointer-unresolved',
  });
  assert.notEqual(rows.source_reference[0].anchor_verification, 'verified-path-only');
});

test('Given an opaque anchor on a known JSON target, when closure maps references, then it verifies only the target path', () => {
  const rows = mapSourceClosureDomains({ bundle: bundle({ path: 'lore/World-Narrative-Atlas.json', anchor: 'chapter-one' }) });
  assert.equal(rows.source_reference[0].anchor_verification, 'verified-path-only');
});

test('Given a sourceRef whose target is absent from the bundled source set, when closure maps references, then it rejects missing provenance', () => {
  const missing = bundle();
  missing.referenceFiles = missing.referenceFiles.filter((entry) => entry.logical_path !== 'lore/World-Narrative-Atlas.json');
  assert.throws(() => mapSourceClosureDomains({ bundle: missing }), { code: 'E_REFERENCE_TARGET_MISSING' });
});

test('Given a referenced target whose bytes changed, when closure maps the new source set, then its hash-only provenance changes', () => {
  const changed = bundle();
  changed.referenceFiles.find((entry) => entry.logical_path === 'lore/World-Narrative-Atlas.json').sha256 = 'b'.repeat(64);
  const originalHash = mapSourceClosureDomains({ bundle: bundle() }).reference_source[0].sha256;
  const changedHash = mapSourceClosureDomains({ bundle: changed }).reference_source[0].sha256;
  assert.notEqual(changedHash, originalHash);
});

test('Given current context source-path fields, when closure maps them, then it binds only the declared source pointers', () => {
  const current = bundle();
  current.files.find((entry) => entry.logical_path === 'lore/relations/relations.json').document = {
    courtContract: { sourcePath: 'lore/characters/Cast-Relations.json', sourceAnchor: 'court-anchor' },
    ownerLieges: { sourceBasis: [{ path: 'lore/characters/Cast-State-01.json', anchor: 'person-anchor' }] },
  };
  current.files.find((entry) => entry.logical_path === 'lore/relations/personal-holdings.json').document = {
    holdings: [
      { facilityRef: { sourcePath: 'lore/regions/station-interiors.json', siteSourcePath: 'lore/regions/content/11560.json', siteAnchor: 'osm:node:1' } },
      { landmarkRef: { sourcePath: 'lore/places/landmark-roles.json' } },
    ],
  };

  const rows = mapSourceClosureDomains({ bundle: current });

  assert.deepEqual(rows.source_reference.filter((row) => row.source_id === 7 || row.source_id === 8).map((row) => [row.json_pointer, row.reference_logical_path, row.reference_anchor]), [
    ['/courtContract/sourcePath', 'lore/characters/Cast-Relations.json', 'court-anchor'],
    ['/ownerLieges/sourceBasis/0/path', 'lore/characters/Cast-State-01.json', 'person-anchor'],
    ['/holdings/0/facilityRef/sourcePath', 'lore/regions/station-interiors.json', null],
    ['/holdings/0/facilityRef/siteSourcePath', 'lore/regions/content/11560.json', 'osm:node:1'],
    ['/holdings/1/landmarkRef/sourcePath', 'lore/places/landmark-roles.json', null],
  ]);
});

test('Given a non-contract sourcePath string, when closure maps current context, then it does not treat prose or URLs as provenance', () => {
  const current = bundle();
  current.files.find((entry) => entry.logical_path === 'lore/relations/relations.json').document = {
    note: { sourcePath: 'https://example.invalid/reference' },
  };

  const rows = mapSourceClosureDomains({ bundle: current });

  assert.equal(rows.source_reference.length, 1);
});

test('Given office v2 evidence, when closure maps it, then the origin and target JSON pointers stay separate', () => {
  const current = bundle();
  current.files.find(entry => entry.logical_path === 'lore/relations/opening-office-appointments.json').document = {
    schema: 'opening-office-appointments.v2',
    appointments: [{ history: { commonTier: 'T4' }, current: { evidence: [
      { path: 'lore/relations/opening-office-appointments.json', jsonPointer: '/appointments/0/history', kind: 'preserved-history' },
    ] } }],
  };
  const rows = mapSourceClosureDomains({ bundle: current });
  assert.deepEqual(rows.source_reference.find(row => row.source_id === 9), {
    source_id: 9, json_pointer: '/appointments/0/current/evidence/0', ordinal: 0,
    reference_logical_path: 'lore/relations/opening-office-appointments.json',
    reference_anchor: '/appointments/0/history', anchor_verification: 'json-pointer-verified',
  });
  const evidence = current.files.find(entry => entry.source_id === 9).document.appointments[0].current.evidence[0];
  evidence.jsonPointer = '/appointments/1/history';
  assert.equal(mapSourceClosureDomains({ bundle: current }).source_reference.find(row => row.source_id === 9).anchor_verification, 'json-pointer-unresolved');
  evidence.path = 'lore/unapproved.json';
  assert.throws(() => mapSourceClosureDomains({ bundle: current }), { code: 'E_REFERENCE_ALLOWLIST' });
});

test('Given a direct source record, when closure DDL receives its reference, then STRICT foreign keys bind holder and hash-only target', async () => {
  const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  try {
    db.exec(`CREATE TABLE source_file (source_id INTEGER PRIMARY KEY) STRICT;
      CREATE TABLE source_record (source_id INTEGER NOT NULL, json_pointer TEXT NOT NULL,
        PRIMARY KEY(source_id,json_pointer), FOREIGN KEY(source_id) REFERENCES source_file(source_id)) STRICT;`);
    db.exec(await readFile(new URL('./source-closure.sql', import.meta.url), 'utf8'));
    db.prepare('INSERT INTO source_file VALUES (?)').run(1);
    db.prepare('INSERT INTO source_record VALUES (?,?)').run(1, '/people/0/sourceRefs/0');
    db.prepare('INSERT INTO reference_source VALUES (?,?,?,?)').run('lore/World-Narrative-Atlas.json', 'a'.repeat(64), 1, 'reference-hash-only');
    db.prepare('INSERT INTO source_reference VALUES (?,?,?,?,?,?)').run(1, '/people/0/sourceRefs/0', 0, 'lore/World-Narrative-Atlas.json', '/content/0', 'json-pointer-verified');
    db.prepare('UPDATE source_reference SET reference_anchor=?,anchor_verification=? WHERE source_id=1').run('/content/1', 'json-pointer-unresolved');
    assert.equal(db.prepare("SELECT count(*) AS n FROM source_reference WHERE anchor_verification='json-pointer-unresolved'").get().n, 1);

    assert.deepEqual(db.prepare("SELECT name,strict FROM pragma_table_list WHERE name IN ('reference_source','source_reference') ORDER BY name").all().map(({ name, strict }) => ({ name, strict })), [
      { name: 'reference_source', strict: 1 }, { name: 'source_reference', strict: 1 },
    ]);
    assert.throws(() => db.prepare('INSERT INTO source_reference VALUES (?,?,?,?,?,?)').run(2, '/missing', 0, 'lore/World-Narrative-Atlas.json', null, 'verified-path-only'));
  } finally {
    db.close();
  }
});

test('Given the current fixed family and context holders, when closure maps their actual source pointers, then it binds the fixed target set and office evidence', async () => {
  const load = async (logical_path, source_id) => {
    const bytes = await readFile(logical_path);
    return {
      logical_path, source_id, sha256: createHash('sha256').update(bytes).digest('hex'), byte_length: bytes.length,
      document: logical_path.endsWith('.json') ? JSON.parse(bytes) : null,
    };
  };
  const files = await Promise.all(HOLDER_PATHS.map((logical_path, index) => load(logical_path, index + 1)));
  const referenceFiles = await Promise.all(REFERENCE_TARGET_PATHS.filter((logical_path) => !HOLDER_PATHS.includes(logical_path))
    .map((logical_path) => load(logical_path, null)));

  const rows = mapSourceClosureDomains({ bundle: { files, referenceFiles } });

  assert.equal(rows.source_reference.length, 41873);
  assert.deepEqual(rows.reference_source.map((row) => row.logical_path), REFERENCE_TARGET_PATHS);
  const office = files.find(file => file.logical_path === 'lore/relations/opening-office-appointments.json');
  assert.equal(rows.source_reference.filter(row => row.source_id === office.source_id).length,
    office.document.appointments.reduce((count, row) => count + row.current.evidence.length, 0));
  assert.equal(rows.source_reference.filter((row) => row.anchor_verification === 'json-pointer-verified').length, 7915);
  assert.equal(rows.source_reference.filter((row) => row.anchor_verification === 'verified-path-only').length, 33958);
  const unresolved = rows.source_reference.filter((row) => row.anchor_verification === 'json-pointer-unresolved');
  assert.deepEqual(unresolved, []);
});
