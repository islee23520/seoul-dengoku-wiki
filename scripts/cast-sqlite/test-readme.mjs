import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const toolRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(toolRoot, '../..');
const sourceRoot = repoRoot;
const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: 600_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.error, undefined, `${command}: ${result.error?.message}`);
  assert.equal(result.signal, null, `${command}: ${result.signal}`);
  return result;
}

function cli(name, args, expectedStatus = 0) {
  const result = run(process.execPath, [join(toolRoot, `${name}.mjs`), ...args]);
  assert.equal(result.status, expectedStatus, `${name} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  if (expectedStatus === 0) return JSON.parse(result.stdout);
  assert.equal(result.stdout, '');
  let reported;
  try { reported = JSON.parse(result.stderr); }
  catch { reported = { code: /^([A-Z][A-Z0-9_]+):/u.exec(result.stderr)?.[1], message: result.stderr.trim() }; }
  return { error: { code: reported.error?.code ?? reported.code, message: reported.error?.message ?? reported.message } };
}

function queryPerson(dbPath, personId, route) {
  const byId = cli('query', ['--db', dbPath, 'person', '--id', personId]);
  const byRoute = cli('query', ['--db', dbPath, 'person', '--route', route]);
  assert.deepEqual(byId, byRoute, 'K ID와 DB에 저장된 공개 route는 같은 인물을 반환해야 합니다.');
  return byId;
}

test('README 운영 명령이 이 위키 checkout과 닫힌 SQLite 사본에서 실제로 동작한다', (t) => {
  assert.ok(existsSync(join(sourceRoot, 'lore/name-pools/person-id-registry.json')), 'README test는 이 위키 checkout의 기본 원천을 사용합니다.');
  const outputRoot = mkdtempSync(join(tmpdir(), 'cast-readme-'));
  t.after(() => {
    const within = relative(resolve(tmpdir()), resolve(outputRoot));
    assert.ok(within.startsWith('cast-readme-') && !within.includes('..'));
    rmSync(outputRoot, { recursive: true, force: true });
  });

  const dbPath = join(outputRoot, 'wiki-cast.sqlite');
  const receiptPath = join(outputRoot, 'verify-full.json');

  // README의 기본 build: --source-root 없이 이 저장소 root를 원천으로 계산한다.
  const build = cli('build', ['--output', dbPath]);
  assert.equal(build.artifact_integrity, 'ok');
  assert.equal(build.counts.person, 1022, '현재 registry 인물 1,022명을 모두 적재합니다.');
  assert.equal(build.counts.profile, 1038, '프로필 발생 1,038건은 인물 수와 구분해 보존합니다.');
  assert.equal(build.excluded_source_count, 17, '비공개 제외 17개는 hash-only manifest에만 포함합니다.');
  assert.ok(Number.isInteger(build.official_issue_count) && build.official_issue_count >= 0);
  assert.ok(Number.isInteger(build.importer_issue_count) && build.importer_issue_count >= 0);
  const originalHash = digest(dbPath);
  const originalMtime = statSync(dbPath).mtimeMs;
  assert.equal(build.sha256, originalHash);

  // README의 full verify: 명시 원천으로 최신성·projection·공식 검사 범위를 대조한다.
  const verification = cli('verify', ['--db', dbPath, '--source-root', sourceRoot, '--receipt', receiptPath]);
  assert.equal(verification.artifact_integrity, 'ok');
  assert.equal(verification.complete_verification, true);
  assert.equal(verification.source_freshness, 'current');
  assert.deepEqual(JSON.parse(readFileSync(receiptPath, 'utf8')), verification);
  assert.equal(verification.official_issue_count, build.official_issue_count);
  assert.equal(verification.importer_issue_count, build.importer_issue_count);
  assert.equal(verification.excluded_source_count, build.excluded_source_count);
  assert.equal(build.source_reference_unresolved_count, 11);
  assert.equal(verification.source_reference_unresolved_count, 11);
  assert.equal(verification.reference_closure, 'verified-with-unresolved-anchors');

  const db = new DatabaseSync(dbPath, { readOnly: true });
  let personRow;
  let relationRow;
  let supersededHolder;
  let unresolvedHolder;
  let genderPolicySummary;
  let researchSourceCount;
  let indexedPersonId;
  let feudalPersonId;
  let eventPersonId;
  let excludedSummary;
  let referenceSummary;
  try {
    personRow = db.prepare('SELECT person_id, public_route FROM person ORDER BY publication_ordinal LIMIT 1').get();
    relationRow = db.prepare('SELECT from_person_id, to_person_id FROM relation ORDER BY row_ordinal LIMIT 1').get();
    supersededHolder = db.prepare("SELECT holder_person_id FROM context_holding WHERE current_validity='superseded_outside_seoul' LIMIT 1").get();
    unresolvedHolder = db.prepare("SELECT holder_person_id FROM context_holding WHERE current_validity='unresolved' LIMIT 1").get();
    genderPolicySummary = db.prepare("SELECT COUNT(*) AS rows, SUM(population) AS declared_population, SUM(observed_population) AS observed_population, SUM(alignment_status='differs-current') AS differences FROM identity_gender_policy").get();
    researchSourceCount = db.prepare('SELECT COUNT(*) AS rows FROM identity_clan_research_source').get().rows;
    indexedPersonId = db.prepare('SELECT person_id FROM index_person WHERE person_id IS NOT NULL ORDER BY person_id LIMIT 1').get()?.person_id;
    feudalPersonId = db.prepare('SELECT holder_person_id FROM historical_feudal_title ORDER BY holder_person_id LIMIT 1').get()?.holder_person_id;
    eventPersonId = db.prepare('SELECT person_id FROM context_event_link ORDER BY person_id LIMIT 1').get()?.person_id;
    excludedSummary = db.prepare('SELECT (SELECT COUNT(*) FROM excluded_source) AS manifest_rows, (SELECT COUNT(*) FROM excluded_source e JOIN source_file s USING(logical_path)) AS raw_overlap').get();
    referenceSummary = db.prepare("SELECT SUM(anchor_verification='json-pointer-verified') AS pointer_verified, SUM(anchor_verification='json-pointer-unresolved') AS pointer_unresolved, SUM(anchor_verification='verified-path-only') AS path_only FROM source_reference").get();
  } finally {
    db.close();
  }
  assert.ok(personRow?.person_id && personRow.public_route);
  assert.deepEqual({ ...genderPolicySummary }, { rows: 17, declared_population: 1016, observed_population: build.counts.person, differences: 5 });
  assert.equal(researchSourceCount, 106, '가문 조사 원천 106건을 전역 typed table로 조회합니다.');
  assert.ok(indexedPersonId && feudalPersonId && eventPersonId, '공개 초안 색인·역사 봉건·조직 사건의 실제 조회 반례를 선택합니다.');
  assert.deepEqual({ ...excludedSummary }, { manifest_rows: 17, raw_overlap: 0 }, '비공개 제외 원천은 hash-only manifest에만 있어야 합니다.');
  assert.deepEqual({ ...referenceSummary }, { pointer_verified: 7793, pointer_unresolved: 11, path_only: 33955 }, '가리킨 위치가 없는 JSON Pointer를 검증 완료나 path-only로 낮추지 않습니다.');
  const person = queryPerson(dbPath, personRow.person_id, personRow.public_route);
  assert.equal(person.person.person_id, personRow.person_id);
  assert.ok(person.current && person.historical && person.unresolved, 'current/historical/unresolved envelope를 분리합니다.');

  const engine = queryPerson(dbPath, 'K1022', '/people/person-1022');
  assert.ok(engine.current.engine, '현재 공개 engine projection을 반환합니다.');
  const engineText = JSON.stringify(engine.current.engine);
  for (const privateKey of ['ownerApproved', 'authored_status', 'soul', 'soulRevisionRef', 'historicalMotif', 'basis', 'evidence', 'raw_bytes']) {
    assert.ok(!engineText.includes(`"${privateKey}"`), `${privateKey}는 current engine 공개 결과에 없어야 합니다.`);
  }

  const nonKoreanLineage = cli('query', ['--db', dbPath, 'person', '--id', 'K014']).lineage;
  assert.equal(nonKoreanLineage.profile.clan_id, null, '비한국계 인물에게 한국식 clan FK를 만들어서는 안 됩니다.');
  assert.equal(nonKoreanLineage.profile.naming_convention, 'non-korean-lineage');
  assert.equal(nonKoreanLineage.profile.naming_source_character_id, 'K014');
  assert.deepEqual(nonKoreanLineage.clans, [], '비한국계 source-only reference를 canonical clan으로 승격하면 안 됩니다.');
  assert.ok(nonKoreanLineage.source_clan_refs.length > 0, '원본 비한국계 lineage 참조를 조회할 수 있어야 합니다.');

  const indexed = cli('query', ['--db', dbPath, 'person', '--id', indexedPersonId]);
  assert.ok(indexed.source_indexes.cast.length > 0);
  assert.ok(indexed.source_indexes.cast.every((row) => row.source_status === 'draft' && row.source_kind === 'original-fiction'));
  const indexIssues = cli('query', ['--db', dbPath, 'issues', '--dataset', 'index']);
  assert.ok(Array.isArray(indexIssues.source_indexes.issues));
  assert.ok(Array.isArray(indexIssues.source_indexes.unmatched_cast));

  const feudal = cli('query', ['--db', dbPath, 'person', '--id', feudalPersonId]);
  assert.ok(feudal.historical.feudal.titles.length > 0, '옛 title은 historical에서만 읽습니다.');
  const event = cli('query', ['--db', dbPath, 'person', '--id', eventPersonId]);
  assert.ok(event.current.context.event_links.length > 0, '조직 event link를 현재 context에서 읽습니다.');

  assert.ok(relationRow?.from_person_id && relationRow.to_person_id);
  const relations = cli('query', ['--db', dbPath, 'relations', '--id', relationRow.from_person_id, '--direction', 'both']);
  assert.ok(relations.outgoing.some((row) => row.from_person_id === relationRow.from_person_id && row.to_person_id === relationRow.to_person_id));

  const issues = cli('query', ['--db', dbPath, 'issues', '--dataset', 'gurps']);
  const referenceIssues = cli('query', ['--db', dbPath, 'issues', '--dataset', 'reference']);
  assert.equal(issues.official.issues.length, verification.official_issue_count);
  assert.equal(referenceIssues.importer.length, verification.source_reference_unresolved_count);
  assert.ok(referenceIssues.importer.every((row) => row.code === 'E_REFERENCE_ANCHOR'));
  assert.equal(issues.importer.length + referenceIssues.importer.length, verification.importer_issue_count);

  const source = cli('query', ['--db', dbPath, 'source', '--path', 'lore/name-pools/values-cast.json', '--pointer', '/people/0/source']);
  assert.equal(source.record.json_type, 'text');
  assert.ok(!Object.hasOwn(source, 'raw_bytes_base64'));
  const privateRaw = cli('query', ['--db', dbPath, 'source', '--path', 'lore/name-pools/values-cast.json', '--include-bytes'], 1);
  assert.equal(privateRaw.error.code, 'E_ARGUMENTS');

  assert.ok(supersededHolder?.holder_person_id, '서울 밖 historical holdings 반례가 있어야 합니다.');
  const superseded = cli('query', ['--db', dbPath, 'person', '--id', supersededHolder.holder_person_id]);
  assert.equal(superseded.current.holdings.length, 0, '서울 밖 confirmed 원행을 default current holdings에 포함하면 안 됩니다.');
  assert.ok(superseded.historical.superseded_holdings.length > 0);
  assert.ok(unresolvedHolder?.holder_person_id, '근거 미확정 holdings 반례가 있어야 합니다.');
  const unresolved = cli('query', ['--db', dbPath, 'person', '--id', unresolvedHolder.holder_person_id]);
  assert.ok(unresolved.unresolved.holdings.length > 0);

  const cleanExpected = verification.source_quality === 'clean' && verification.official_check_status === 'checked';
  const clean = cli('verify', ['--db', dbPath, '--source-root', sourceRoot, '--require-clean'], cleanExpected ? 0 : 1);
  if (!cleanExpected) assert.equal(clean.error.code, 'E_SOURCE_QUALITY');

  const clobber = cli('build', ['--output', dbPath], 1);
  assert.equal(clobber.error.code, 'E_OUTPUT_EXISTS');
  assert.equal(digest(dbPath), originalHash);
  assert.equal(statSync(dbPath).mtimeMs, originalMtime);

  const copyPath = join(outputRoot, 'wiki-cast-copy.sqlite');
  copyFileSync(dbPath, copyPath);
  const offline = cli('verify', ['--db', copyPath]);
  assert.equal(offline.complete_verification, false);
  assert.equal(offline.source_freshness, 'unchecked');
  assert.equal(offline.profile_rendering, 'unchecked');
  assert.equal(offline.source_reference_unresolved_count, 11);
  assert.equal(offline.reference_closure, 'stored-hashes-only-with-unresolved-anchors');

  const readOnly = new DatabaseSync(copyPath, { readOnly: true });
  try {
    assert.equal(readOnly.prepare('SELECT COUNT(*) AS people FROM person').get().people, build.counts.person);
    assert.equal(readOnly.prepare('SELECT public_route FROM person WHERE person_id=?').get(personRow.person_id).public_route, personRow.public_route);
    assert.throws(() => readOnly.exec(`UPDATE person SET title='변경' WHERE person_id='${personRow.person_id}'`), /readonly|read-only/iu);
  } finally {
    readOnly.close();
  }
  const sql = `SELECT person_id,name,public_route FROM person WHERE person_id='${personRow.person_id}';`;
  const sqlite = spawnSync('sqlite3', ['-readonly', '-json', copyPath, sql], { encoding: 'utf8', shell: false, windowsHide: true });
  if (sqlite.error?.code === 'ENOENT') t.diagnostic('sqlite3 CLI 미설치: node:sqlite readOnly 연결로 직접 SQL을 검증했습니다.');
  else {
    assert.equal(sqlite.error, undefined);
    assert.equal(sqlite.status, 0, sqlite.stderr);
    assert.equal(JSON.parse(sqlite.stdout)[0].public_route, personRow.public_route);
    t.diagnostic('sqlite3 -readonly 사본 조회 통과');
  }
  assert.equal(digest(copyPath), originalHash);
  assert.equal(digest(dbPath), originalHash);
  assert.equal(statSync(dbPath).mtimeMs, originalMtime);
  assert.ok(!readdirSync(outputRoot).some((name) => name.endsWith('-wal') || name.endsWith('-shm')));
  t.diagnostic(`실제 원천 ${sourceRoot}; DB SHA-256 ${originalHash}; 공식 ${verification.official_issue_count}건과 importer ${verification.importer_issue_count}건은 실행 receipt의 별도 결과입니다.`);
});
