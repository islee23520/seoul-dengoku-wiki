import assert from 'node:assert/strict';
import { copyFile, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { REFERENCE_HOLDER_PATHS } from './source-closure.mjs';
import { buildCastDatabase, DEFAULT_SOURCE_ROOT } from './build.mjs';
import { verifyCastDatabase } from './verify.mjs';
import { DATA_SOURCE_PATHS, sha256 } from './sources.mjs';
import { TEXT_DATA_TABLE_COLUMNS, reconstructTextData } from './text-data.mjs';

const count = (db, table) => db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
const readJson = async (logicalPath) => JSON.parse(await readFile(join(DEFAULT_SOURCE_ROOT, logicalPath), 'utf8'));

// Independently count source references and resolve their anchors from source bytes.
const expectedReferenceCounts = (sourceRoot) => {
  const counts = { 'json-pointer-verified': 0, 'json-pointer-unresolved': 0, 'verified-path-only': 0 };
  const documents = new Map();
  const document = path => {
    if (!documents.has(path)) documents.set(path, path.endsWith('.json') ? JSON.parse(readFileSync(join(sourceRoot, path), 'utf8')) : null);
    return documents.get(path);
  };
  const add = (path, anchor) => {
    let target = document(path);
    if (!path.endsWith('.json') || !anchor?.startsWith('/')) { counts['verified-path-only']++; return; }
    assert.ok(!/~(?:[^01]|$)/u.test(anchor), anchor);
    for (const key of anchor.slice(1).split('/').map(key => key.replaceAll('~1', '/').replaceAll('~0', '~'))) {
      target = target !== null && typeof target === 'object' && Object.hasOwn(target, key) ? target[key] : undefined;
    }
    counts[target === undefined ? 'json-pointer-unresolved' : 'json-pointer-verified']++;
  };
  const ref = value => {
    if (typeof value !== 'string') { add(value.path, value.anchor); return; }
    const hash = value.indexOf('#');
    add(hash < 0 ? value : value.slice(0, hash), hash < 0 ? null : value.slice(hash + 1));
  };
  for (const path of REFERENCE_HOLDER_PATHS) {
    const source = document(path);
    const visit = value => {
      if (value === null || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (key === 'sourceRef') ref(child);
        if (key === 'sourceRefs') child.forEach(ref);
        visit(child);
      }
    };
    visit(source);
    if (path === 'lore/relations/opening-office-appointments.json') {
      for (const appointment of source.appointments) for (const evidence of appointment.current.evidence) add(evidence.path, evidence.jsonPointer);
    }
    if (path === 'lore/relations/relations.json') {
      add(source.courtContract.sourcePath, source.courtContract.sourceAnchor);
      for (const basis of source.ownerLieges.sourceBasis) add(basis.path, basis.anchor);
    }
    if (path === 'lore/relations/personal-holdings.json') {
      for (const holding of source.holdings) for (const key of ['stationRef', 'facilityRef', 'landmarkRef']) {
        const reference = holding[key];
        if (reference?.sourcePath) add(reference.sourcePath, null);
        if (reference?.siteSourcePath) add(reference.siteSourcePath, reference.siteAnchor);
      }
    }
  }
  return counts;
};

test('the complete wiki corpus builds and verifies as an independent read-only SQLite artifact', { timeout: 1_500_000 }, async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'wiki-cast-corpus-'));
  t.after(async () => {
    assert.ok(relative(resolve(tmpdir()), resolve(root)).startsWith('wiki-cast-corpus-'));
    await rm(root, { recursive: true, force: true });
  });
  const dbPath = join(root, 'wiki-cast.sqlite');
  const [registry, values, gender, birthdays, family, diaspora, holdings, gurps] = await Promise.all([
    readJson('lore/name-pools/person-id-registry.json'),
    readJson('lore/name-pools/values-cast.json'),
    readJson('lore/name-pools/gender-cast.json'),
    readJson('lore/name-pools/cast-birthdays.json'),
    readJson('lore/name-pools/cast-family-trees.json'),
    readJson('lore/name-pools/diaspora-family-lineages.json'),
    readJson('lore/relations/personal-holdings.json'),
    readJson('lore/name-pools/gurps-cast.json'),
  ]);
  const expectedPeople = registry.persons.length;
  assert.equal(registry.totalPeople, expectedPeople);
  assert.equal(values.people.length, expectedPeople);
  assert.equal(gender.people.length, expectedPeople);
  assert.equal(birthdays.people.length, expectedPeople);
  assert.equal(gurps.people.length, expectedPeople);
  const diasporaMembers = diaspora.lineages.flatMap((lineage) => lineage.members);
  const familyNodeIds = new Set(family.nodes.map((node) => node.id));
  const supplementalNodes = diasporaMembers.filter((member) => !familyNodeIds.has(member.key)).length;
  const supplementalEdges = diasporaMembers.reduce((total, member) => total + member.parentKeys.length, 0);
  const sourceTexts = new Map(await Promise.all(DATA_SOURCE_PATHS.map(async (path) => [path, await readFile(join(DEFAULT_SOURCE_ROOT, path), 'utf8')])));
  const expectedGurpsIssues = [];
  // Compute citation failures from source bytes, independently of the importer and receipt.
  const inspectEvidence = (value, pointer, personId) => {
    if (value === null || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      const childPointer = `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
      if (key === 'evidence') child.forEach((item, ordinal) => {
        let status = 'match';
        if (Object.hasOwn(item, 'note')) status = 'uncited';
        else if (!sourceTexts.has(item.path)) status = 'missing-source';
        else {
          let text = sourceTexts.get(item.path);
          if (item.pointer !== undefined) {
            let target = item.path.endsWith('.json') ? JSON.parse(text) : undefined;
            const tokens = item.pointer === '' ? [] : item.pointer.startsWith('/') && !/~(?:[^01]|$)/u.test(item.pointer)
              ? item.pointer.slice(1).split('/').map(token => token.replaceAll('~1', '/').replaceAll('~0', '~')) : null;
            if (tokens === null) target = undefined;
            for (const token of tokens ?? []) {
              target = target !== null && typeof target === 'object' && Object.hasOwn(target, token)
                && (!Array.isArray(target) || /^(?:0|[1-9][0-9]*)$/u.test(token)) ? target[token] : undefined;
            }
            if (target === undefined) status = 'missing-pointer';
            text = typeof target === 'string' ? target : Array.isArray(target) && target.every(run => typeof run?.text === 'string')
              ? target.map(run => run.text).join('') : undefined;
          }
          if (status === 'match' && (!item.quote || typeof text !== 'string' || !text.includes(item.quote))) status = 'mismatch';
        }
        if (status !== 'match') expectedGurpsIssues.push({
          person_id: personId, json_pointer: `${childPointer}/${ordinal}`,
          code: `E_GURPS_EVIDENCE_${status.replaceAll('-', '_').toUpperCase()}`, observed_value: JSON.stringify(item),
        });
      });
      else inspectEvidence(child, childPointer, personId);
    }
  };
  gurps.people.forEach((person, ordinal) => inspectEvidence(person, `/people/${ordinal}`, person.id));

  const referenceCounts = expectedReferenceCounts(DEFAULT_SOURCE_ROOT);
  const unresolvedReferences = referenceCounts['json-pointer-unresolved'];
  const transition = await readJson('scripts/approved-seoul-rights-transition.json');
  const holdingTransitions = transition.records.filter(row => row.set === 'holdings' && row.currentId !== null);
  const retained = holdingTransitions.filter(row => row.disposition === 'retained-current').length;
  const nonowning = holdingTransitions.filter(row => row.disposition === 'approved-nonowning').length;
  assert.equal(retained + nonowning, holdings.holdings.length);

  const built = await buildCastDatabase({ sourceRoot: DEFAULT_SOURCE_ROOT, outputPath: dbPath });
  const originalSha256 = sha256(await readFile(dbPath));
  const originalMtimeMs = (await stat(dbPath)).mtimeMs;
  assert.equal(built.sha256, originalSha256);
  assert.equal(built.counts.person, expectedPeople);
  const secondPath = join(root, 'second.sqlite');
  const second = await buildCastDatabase({ sourceRoot: DEFAULT_SOURCE_ROOT, outputPath: secondPath });
  assert.equal(second.sha256, built.sha256);
  assert.equal(sha256(await readFile(secondPath)), originalSha256, 'same source snapshot must generate identical SQLite bytes');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const dataTables = Object.fromEntries(Object.keys(TEXT_DATA_TABLE_COLUMNS).map((table) => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
    let domainDocuments = 0;
    for (const source of db.prepare('SELECT f.source_id,f.logical_path,f.raw_bytes FROM source_file f JOIN text_document d USING(source_id)').all()) {
      const expected = JSON.parse(Buffer.from(source.raw_bytes).toString('utf8')).data;
      assert.deepEqual(reconstructTextData({ tables: dataTables, source_id: source.source_id }), expected, source.logical_path);
      if (Object.keys(expected).length) domainDocuments++;
    }
    assert.equal(domainDocuments, 52);
    assert.throws(() => db.exec('CREATE TABLE e2e_readonly_probe(value INTEGER) STRICT'), (error) => error.errcode === 8);
    for (const table of ['person', 'person_gender', 'person_lineage', 'gurps_profile', 'family_birthday', 'current_profile', 'health', 'narrative']) {
      assert.equal(count(db, table), expectedPeople, `${table} must cover every registered person`);
    }
    assert.equal(count(db, 'ability'), expectedPeople * 8);
    assert.equal(count(db, 'family_node'), family.nodes.length + supplementalNodes);
    assert.equal(count(db, 'family_edge'), family.edges.length + supplementalEdges);
    assert.equal(count(db, 'context_holding'), holdings.holdings.length);
    const holdingStates = Object.fromEntries(db.prepare('SELECT current_validity,count(*) AS n FROM context_holding GROUP BY current_validity').all()
      .map((row) => [row.current_validity, row.n]));
    assert.deepEqual(holdingStates, { current_seoul_evidenced: retained, current_seoul_nonowning: nonowning });
    assert.equal(count(db, 'current_engine_source'), 9);
    assert.equal(db.prepare('SELECT count(*) AS n FROM person p JOIN gurps_profile g USING(person_id) WHERE p.public_route <> g.url').get().n, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM context_holding WHERE current_validity='current_seoul_evidenced' AND direct_ownership=0").get().n, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name='current_profile' AND sql LIKE '%authored_status%'").get().n, 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM source_file WHERE logical_path LIKE 'lore/editorial/profile-batches/%'").get().n, 0);
    assert.ok(count(db, 'reference_source') > 0);
    assert.deepEqual(Object.fromEntries(db.prepare('SELECT anchor_verification,count(*) AS n FROM source_reference GROUP BY anchor_verification').all()
      .map((row) => [row.anchor_verification, row.n])), Object.fromEntries(Object.entries(referenceCounts).filter(([, n]) => n > 0)));
    assert.equal(db.prepare("SELECT count(*) AS n FROM quality_issue WHERE dataset='reference' AND code='E_REFERENCE_ANCHOR'").get().n, unresolvedReferences);
    assert.deepEqual(Object.fromEntries(db.prepare("SELECT person_id,json_pointer,code,observed_value FROM quality_issue WHERE dataset='gurps'").all()
      .map(row => [row.json_pointer, { ...row }])), Object.fromEntries(expectedGurpsIssues.map(row => [row.json_pointer, row])));
    assert.ok(count(db, 'index_person') > 0);
    assert.equal(count(db, 'historical_source_scope'), 3);
  } finally { db.close(); }

  const offline = await verifyCastDatabase({ dbPath });
  assert.equal(offline.complete_verification, false);
  assert.equal(offline.source_freshness, 'unchecked');
  assert.equal(offline.reference_closure, unresolvedReferences ? 'stored-hashes-only-with-unresolved-anchors' : 'stored-hashes-only');
  assert.equal(offline.source_reference_unresolved_count, unresolvedReferences);
  const receiptPath = join(root, 'verification.json');
  const full = await verifyCastDatabase({ dbPath, sourceRoot: DEFAULT_SOURCE_ROOT, receiptPath });
  assert.equal(full.artifact_integrity, 'ok');
  assert.equal(full.complete_verification, true);
  assert.equal(full.source_freshness, 'current');
  assert.equal(full.reference_closure, unresolvedReferences ? 'verified-with-unresolved-anchors' : 'verified');
  assert.equal(full.source_reference_unresolved_count, unresolvedReferences);
  assert.equal(full.current_import_integrity, 'ok');
  assert.equal(full.text_corpus.missing_text_source_count, 0);
  assert.deepEqual(full.text_corpus, built.text_corpus);
  assert.deepEqual(offline.text_corpus, built.text_corpus);
  assert.equal(full.current_approval_readiness, 'unreviewed');
  assert.equal(full.source_quality, 'degraded');
  assert.equal(full.importer_issue_count, expectedGurpsIssues.length + full.source_reference_unresolved_count);
  assert.deepEqual({
    holding_current: full.current_source_alignment.holding_current,
    holding_nonowning: full.current_source_alignment.holding_nonowning,
    holding_superseded: full.current_source_alignment.holding_superseded,
    holding_unresolved: full.current_source_alignment.holding_unresolved,
  }, { holding_current: retained, holding_nonowning: nonowning, holding_superseded: 0, holding_unresolved: 0 });
  assert.equal(full.official_check_scope, 'historical-gurps-only');
  assert.ok(['checked', 'not_checked'].includes(full.official_check_status));
  assert.equal(full.sha256, originalSha256);
  assert.equal(full.counts.person, expectedPeople);
  assert.deepEqual(JSON.parse(await readFile(receiptPath, 'utf8')), full);
  await assert.rejects(verifyCastDatabase({ dbPath, sourceRoot: DEFAULT_SOURCE_ROOT, receiptPath }), { code: 'E_RECEIPT_EXISTS' });
  await assert.rejects(verifyCastDatabase({ dbPath, sourceRoot: DEFAULT_SOURCE_ROOT, requireClean: true }), { code: 'E_SOURCE_QUALITY' });
  for (const [name, sql, code] of [
    ['raw', "UPDATE source_file SET raw_bytes=zeroblob(byte_length) WHERE logical_path='WORLD_BUILDING_GUIDE.md'", 'E_SOURCE_RAW'],
    ['identity', "UPDATE person_value SET value=CASE WHEN value=0 THEN 1 ELSE 0 END WHERE person_id=(SELECT person_id FROM person_value LIMIT 1) AND axis_name=(SELECT axis_name FROM person_value LIMIT 1)", 'E_SOURCE_FIDELITY'],
    ['reference-quality', "INSERT INTO quality_issue(issue_id,dataset,code,severity,source_id,json_pointer,message,observed_value) SELECT 'e2e-reference-tamper','reference','E_REFERENCE_ANCHOR','error',source_id,json_pointer,'tampered','tampered' FROM source_reference LIMIT 1", 'E_SOURCE_FIDELITY'],
    ['text-slot', "UPDATE text_document_slot SET text='tampered' WHERE rowid=(SELECT rowid FROM text_document_slot LIMIT 1)", 'E_SOURCE_FIDELITY'],
    ['text-line', "UPDATE text_line SET text='tampered' WHERE rowid=(SELECT rowid FROM text_line LIMIT 1)", 'E_SOURCE_FIDELITY'],
    ['text-data', "UPDATE text_chronology_event SET date_value='tampered' WHERE rowid=(SELECT rowid FROM text_chronology_event WHERE date_value IS NOT NULL LIMIT 1)", 'E_SOURCE_FIDELITY'],
    ['schema', 'CREATE TABLE rogue(value TEXT) STRICT', 'E_SCHEMA_MISMATCH'],
  ]) {
    const copy = join(root, `${name}.sqlite`);
    await copyFile(dbPath, copy);
    const modified = new DatabaseSync(copy, { enableForeignKeyConstraints: false });
    try { modified.exec(sql); } finally { modified.close(); }
    await assert.rejects(verifyCastDatabase({ dbPath: copy }), { code });
  }
  assert.equal(sha256(await readFile(dbPath)), originalSha256, 'verification must not modify the artifact');
  assert.equal((await stat(dbPath)).mtimeMs, originalMtimeMs, 'read-only checks must preserve the artifact modification time');
});
