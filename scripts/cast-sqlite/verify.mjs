import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, lstat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { applySchema, openReadOnly, runIntegrityChecks, SCHEMA_VERSION } from './db.mjs';
import { loadSourceBundle, loadTrustedRenderer, parseDocument, REQUIRED_SOURCE_PATHS, resolveTrustedSourcePath, resolveTrustedSourceRoot, sha256 } from './sources.mjs';
import { mapIdentityDomains } from './identity-values.mjs';
import { mapProfiles, mapRelations } from './profiles-relations.mjs';
import { mapGurps, parseOfficialGurpsCheck } from './gurps-evidence.mjs';
import { FAMILY_TABLE_COLUMNS, mapFamilyDomains } from './current-family.mjs';
import { ENGINE_TABLE_COLUMNS, mapEngineDomains } from './current-engine.mjs';
import { CONTEXT_TABLE_COLUMNS, mapContextDomains } from './current-context.mjs';
import { INDEX_TABLE_COLUMNS, mapIndexDomains } from './current-index.mjs';
import { HISTORICAL_CONTEXT_TABLE_COLUMNS, mapHistoricalContext } from './historical-context.mjs';
import { IDENTITY_PROVENANCE_TABLE_COLUMNS, mapIdentityProvenance } from './current-identity-provenance.mjs';
import { COVERAGE_CONTRACT, auditCoverageContract, fieldCoverageManifest } from './coverage-contract.mjs';
import { SOURCE_CLOSURE_TABLE_COLUMNS, mapSourceClosureDomains } from './source-closure.mjs';
import { EXCLUDED_SOURCE_PATHS, EXCLUDED_SOURCE_TABLE_COLUMNS, mapExcludedSourceDomains } from './excluded-sources.mjs';
import { mapReferenceAnchorIssues } from './build.mjs';
import { TEXT_CORPUS_TABLE_COLUMNS, mapTextCorpus, auditTextCorpus } from './text-corpus.mjs';
import { reviewCurrentAuthority } from './current-authority.mjs';

const IDENTITY_TABLES = {
  states: 'state', stateLabels: 'state_label', people: 'person', aliases: 'person_alias',
  valueAxes: 'value_axis', personValues: 'person_value', desireAxes: 'desire_axis', personDesires: 'person_desire',
  genders: 'person_gender', clans: 'clan', clanSources: 'clan_source', clanHangnyeolRows: 'clan_hangnyeol_row',
  lineages: 'person_lineage', lineageSourceClans: 'person_lineage_source_clan', lineageNodes: 'lineage_node', lineageParents: 'lineage_parent',
  lineageFounderSesu: 'lineage_founder_sesu', lineageClanAssignments: 'lineage_clan_assignment',
};
const GURPS_TABLES = {
  gurpsProfiles: 'gurps_profile', attributes: 'gurps_attribute', secondary: 'gurps_secondary',
  traits: 'gurps_trait', traitBoundaries: 'gurps_trait_application_boundary',
  skills: 'gurps_skill', languages: 'gurps_language',
  advantages: 'gurps_advantage', disadvantages: 'gurps_disadvantage', territories: 'gurps_territory',
  units: 'gurps_unit', unitComposition: 'gurps_unit_composition',
  wanderingForces: 'gurps_wandering_force', wanderingFacilities: 'gurps_wandering_facility',
  evidence: 'evidence', qualityIssues: 'quality_issue',
};
const FAMILY_TABLES = Object.fromEntries(Object.keys(FAMILY_TABLE_COLUMNS).map((table) => [table, table]));
const ENGINE_TABLES = Object.fromEntries(Object.keys(ENGINE_TABLE_COLUMNS).map((table) => [table, table]));
const CONTEXT_TABLES = Object.fromEntries(Object.keys(CONTEXT_TABLE_COLUMNS).map((table) => [table, table]));
const INDEX_TABLES = Object.fromEntries(Object.keys(INDEX_TABLE_COLUMNS).map((table) => [table, table]));
const HISTORICAL_CONTEXT_TABLES = Object.fromEntries(Object.keys(HISTORICAL_CONTEXT_TABLE_COLUMNS).map((table) => [table, table]));
const IDENTITY_PROVENANCE_TABLES = Object.fromEntries(Object.keys(IDENTITY_PROVENANCE_TABLE_COLUMNS).map((table) => [table, table]));
const SOURCE_CLOSURE_TABLES = Object.fromEntries(Object.keys(SOURCE_CLOSURE_TABLE_COLUMNS).map((table) => [table, table]));
const EXCLUDED_SOURCE_TABLES = Object.fromEntries(Object.keys(EXCLUDED_SOURCE_TABLE_COLUMNS).map((table) => [table, table]));
const INCLUDED = ['people', 'values', 'desires', 'gender', 'lineage', 'profiles', 'narrative-relations', 'historical-gurps', 'historical-rights', 'family', 'household', 'current-context', 'current-engine', 'draft-index', 'source-closure', 'provenance', 'text-corpus', 'text-data-domains'];
const EXCLUDED = ['synthetics-domain-data', 'organizations-domain-data', 'roster-100', 'cast-backfill-draft'];
const METADATA_KEYS = ['schema_version', 'generator_version', 'node_version', 'sqlite_version', 'source_git_commit', 'source_set_sha256', 'included_domains', 'excluded_domains', 'expected_counts'];
const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const quote = (identifier) => `"${identifier.replaceAll('"', '""')}"`;
const gitEnvironment = () => ({ ...Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|HOME|USERPROFILE|LANG|LC_ALL)$/i.test(key))), GIT_NO_REPLACE_OBJECTS: '1' });

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { cwd: root, shell: false, windowsHide: true, env: gitEnvironment(), timeout: 120_000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.signal || result.status === null) fail('E_SOURCE_EXECUTION', result.error?.code ?? result.signal ?? 'missing exit status');
  return { exitCode: result.status, stdout: result.stdout.toString('utf8') };
}

async function absent(path, code) {
  try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  fail(code, path);
}

async function checkSidecars(dbPath) {
  for (const suffix of ['-wal', '-shm', '-journal']) await absent(`${dbPath}${suffix}`, 'E_DB_SIDECAR');
}

function checkSchema(db) {
  const expected = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });
  const read = (connection) => connection.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();
  try {
    applySchema(expected);
    if (!equal(read(db), read(expected))) fail('E_SCHEMA_MISMATCH', '테이블, 열, 제약 또는 인덱스가 승인된 스키마와 다릅니다.');
  } finally { expected.close(); }
  const tables = db.prepare("PRAGMA table_list").all().filter((row) => row.schema === 'main' && !row.name.startsWith('sqlite_'));
  if (tables.some((row) => row.type !== 'table' || row.strict !== 1)) fail('E_SCHEMA_MISMATCH', '모든 테이블은 STRICT여야 합니다.');
  if (db.prepare('PRAGMA journal_mode').get().journal_mode !== 'delete') fail('E_DB_JOURNAL', 'DELETE 저널 모드가 필요합니다.');
  return tables.map((row) => row.name).sort();
}

function jsonMetadata(metadata, key) {
  try { return JSON.parse(metadata[key]); } catch { fail('E_BUILD_METADATA', `${key}: JSON 메타데이터 오류`); }
}

function checkMetadata(db, tableNames) {
  const metadata = Object.fromEntries(db.prepare('SELECT key,value FROM build_metadata ORDER BY key').all().map((row) => [row.key, row.value]));
  if (!equal(Object.keys(metadata).sort(), [...METADATA_KEYS].sort())
    || metadata.schema_version !== String(SCHEMA_VERSION) || metadata.generator_version !== '1.0.0'
    || !/^\d+\.\d+\.\d+(?:[-+].+)?$/u.test(metadata.node_version) || !/^\d+\.\d+\.\d+$/u.test(metadata.sqlite_version)
    || !/^[a-f0-9]{40,64}$/u.test(metadata.source_git_commit) || !/^[a-f0-9]{64}$/u.test(metadata.source_set_sha256)
    || !equal(jsonMetadata(metadata, 'included_domains'), INCLUDED) || !equal(jsonMetadata(metadata, 'excluded_domains'), EXCLUDED)) {
    fail('E_BUILD_METADATA', '필수 빌드 메타데이터가 누락되었거나 유효하지 않습니다.');
  }
  const expected = jsonMetadata(metadata, 'expected_counts');
  if (!expected || Array.isArray(expected) || typeof expected !== 'object' || !equal(Object.keys(expected).sort(), tableNames)
    || Object.values(expected).some((count) => !Number.isSafeInteger(count) || count < 0)) fail('E_BUILD_METADATA', 'expected_counts 테이블 집합/형식 오류');
  return { metadata, expected };
}

function compareRows(db, table, expected, code = 'E_SOURCE_FIDELITY', omit = []) {
  const columns = db.prepare(`PRAGMA table_info(${quote(table)})`).all().map((row) => row.name).filter((name) => !omit.includes(name));
  const signature = (row) => JSON.stringify(columns.map((column) => row[column]));
  const wanted = expected.map(signature).sort();
  const actual = db.prepare(`SELECT ${columns.map(quote).join(',')} FROM ${quote(table)}`).all().map(signature).sort();
  if (wanted.length !== actual.length || wanted.some((row, index) => row !== actual[index])) {
    fail(code, `${table}: 원천에서 계산한 ${wanted.length}행과 저장된 ${actual.length}행의 값/소유자/순서가 일치하지 않습니다.`);
  }
}

function storedBundle(db, metadata) {
  const files = db.prepare('SELECT * FROM source_file ORDER BY logical_path').all();
  if (!equal(files.map((file) => file.logical_path), REQUIRED_SOURCE_PATHS)) fail('E_SOURCE_MANIFEST', '고정 원천 파일 집합이 다릅니다.');
  const records = [];
  files.forEach((file, index) => {
    const expectedType = file.logical_path.endsWith('.json') ? 'application/json' : file.logical_path.endsWith('.md') ? 'text/markdown' : file.logical_path.endsWith('.csv') ? 'text/csv' : 'text/javascript';
    file.raw_bytes = Buffer.from(file.raw_bytes);
    if (file.source_id !== index + 1 || file.media_type !== expectedType || file.byte_length !== file.raw_bytes.length || sha256(file.raw_bytes) !== file.sha256) fail('E_SOURCE_RAW', file.logical_path);
    try {
      const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(file.raw_bytes);
      const parsed = expectedType === 'application/json' ? parseDocument(text) : { document: null, records: [] };
      file.document = parsed.document;
      for (const row of parsed.records) records.push({ source_id: file.source_id, ...row });
    } catch (error) { fail('E_SOURCE_RAW', `${file.logical_path}: ${error.message}`); }
  });
  const allReferenceFiles = db.prepare('SELECT logical_path,sha256,byte_length FROM reference_source ORDER BY logical_path').all();
  const primaryByPath = new Map(files.map((file) => [file.logical_path, file]));
  for (const reference of allReferenceFiles) {
    const primary = primaryByPath.get(reference.logical_path);
    if (primary && (primary.sha256 !== reference.sha256 || primary.byte_length !== reference.byte_length)) {
      fail('E_SOURCE_FINGERPRINT', `참조 원천과 기본 원천의 해시가 다릅니다: ${reference.logical_path}`);
    }
  }
  const referenceFiles = allReferenceFiles.filter((file) => !primaryByPath.has(file.logical_path)).map((file) => ({ ...file, document: null }));
  const excludedFiles = db.prepare('SELECT logical_path,sha256,byte_length,exclusion_reason FROM excluded_source ORDER BY logical_path').all();
  if (!equal(excludedFiles.map((file) => file.logical_path), [...EXCLUDED_SOURCE_PATHS].sort())) fail('E_EXCLUDED_MANIFEST', '비공개 제외 원천 파일 집합이 다릅니다.');
  const sourceSetSha256 = sha256([...files, ...referenceFiles, ...excludedFiles].sort((a, b) => a.logical_path.localeCompare(b.logical_path)).map((file) => `${file.logical_path}\0${file.sha256}\n`).join(''));
  if (sourceSetSha256 !== metadata.source_set_sha256) fail('E_SOURCE_FINGERPRINT', 'source_set_sha256가 저장된 파일 집합과 다릅니다.');
  compareRows(db, 'source_record', records, 'E_SOURCE_RECORD');
  return { sourceRevision: metadata.source_git_commit, sourceSetSha256, files, records, referenceFiles, engineFiles: [], excludedFiles, officialChecks: [] };
}

async function currentBundle(sourceRoot, stored, metadata) {
  const root = await resolveTrustedSourceRoot(sourceRoot);
  for (const file of [...stored.files, ...stored.excludedFiles]) {
    let path;
    try { path = await resolveTrustedSourcePath(root, file.logical_path); }
    catch (error) { if (error.code === 'E_SOURCE_MISSING') fail('E_SOURCE_STALE', file.logical_path); throw error; }
    const bytes = await readFile(path);
    if (bytes.length !== file.byte_length || sha256(bytes) !== file.sha256) fail('E_SOURCE_STALE', file.logical_path);
  }
  const bundle = await loadSourceBundle({ sourceRoot: root });
  if (bundle.sourceSetSha256 !== stored.sourceSetSha256) fail('E_SOURCE_STALE', '검증 도중 원천 파일 집합이 변경되었습니다.');
  await checkSourceRevision(root, bundle, metadata.source_git_commit);
  const { renderLoreMarkdown } = await loadTrustedRenderer({ sourceRoot: root, bundle });
  return { bundle, renderLoreMarkdown };
}

/**
 * Provenance contract for the stored source_git_commit. loadSourceBundle has already proven that every input
 * in the working tree is byte-identical to the current Git HEAD; this check ties that state to the recorded revision:
 * it must be a commit object in HEAD's own history (HEAD or an ancestor), and every input the DB was built from must
 * hash to the blob recorded in that commit's tree. Descendant commits that touch no input (for example the commit that
 * tracks the DB artifact itself) therefore verify, while a revision outside the history, a non-commit object, or any
 * input blob drift between the recorded commit and the current inputs is rejected.
 */
async function checkSourceRevision(root, bundle, sourceRevision) {
  const head = bundle.sourceRevision;
  if (sourceRevision.length !== head.length) fail('E_SOURCE_REVISION', '저장된 source_git_commit의 객체 형식이 원천 저장소와 다릅니다.');
  const objectFormat = head.length === 40 ? 'sha1' : 'sha256';
  const type = git(root, ['cat-file', '-t', sourceRevision]);
  if (type.exitCode !== 0 || type.stdout.trim() !== 'commit') fail('E_SOURCE_REVISION', '저장된 source_git_commit이 원천 저장소에 있는 커밋이 아닙니다.');
  if (git(root, ['merge-base', '--is-ancestor', sourceRevision, head]).exitCode !== 0) fail('E_SOURCE_REVISION', '저장된 source_git_commit이 현재 WIKI Git HEAD의 이력에 없습니다.');
  const paths = [...new Set([...bundle.files, ...bundle.referenceFiles, ...bundle.engineFiles, ...bundle.excludedFiles].map((file) => file.logical_path))].sort();
  const tree = git(root, ['ls-tree', '-r', '-z', sourceRevision, '--', ...paths.map((path) => `:(literal)${path}`)]);
  const objects = new Map();
  for (const entry of tree.stdout.split('\0').filter(Boolean)) {
    const match = /^100(?:644|755) blob ([a-f0-9]{40,64})\t(.+)$/u.exec(entry);
    if (!match || objects.has(match[2])) fail('E_SOURCE_REVISION', '저장된 source_git_commit의 원천 객체가 유효하지 않습니다.');
    objects.set(match[2], match[1]);
  }
  if (tree.exitCode !== 0 || objects.size !== paths.length || paths.some((path) => !objects.has(path))) fail('E_SOURCE_REVISION', '저장된 source_git_commit에 필요한 원천 파일이 없습니다.');
  for (const path of paths) {
    const bytes = await readFile(await resolveTrustedSourcePath(root, path));
    const objectId = createHash(objectFormat).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (objectId !== objects.get(path)) fail('E_SOURCE_REVISION', `저장된 source_git_commit의 원천 바이트가 현재 원천과 다릅니다: ${path}`);
  }
}

function compareMapped(db, result, mapping) {
  for (const [property, rows] of Object.entries(result)) {
    if (!Object.hasOwn(mapping, property)) fail('E_SCHEMA_MISMATCH', `매퍼 테이블 연결 누락: ${property}`);
    compareRows(db, mapping[property], rows);
  }
}

function checkSourceQuality(db, bundle, complete) {
  const runs = db.prepare('SELECT * FROM source_check_run ORDER BY check_name').all();
  const issues = db.prepare('SELECT * FROM source_check_issue ORDER BY check_name,ordinal').all();
  const gurpsSchema = bundle.files.find((file) => file.logical_path === 'lore/name-pools/gurps-cast.json')?.document?.schema;
  if (runs.length > 1 || (runs.length === 0) !== (gurpsSchema === 'wiki-gurps-cast.v1')
    || runs.some((run) => run.check_name !== 'gurps-cast')) fail('E_SOURCE_CHECK', '현재 GURPS 스키마와 공식 검사 기록이 일치하지 않습니다.');
  for (const run of runs) {
    const entries = issues.filter((issue) => issue.check_name === run.check_name);
    if (run.issue_count !== entries.length || entries.some((issue, index) => issue.ordinal !== index)
      || !/^[a-f0-9]{64}$/u.test(run.stdout_sha256) || !/^[a-f0-9]{64}$/u.test(run.stderr_sha256)
      || (run.exit_code === 0) !== (entries.length === 0)) fail('E_SOURCE_CHECK', '공식 검사 종료 상태와 이슈 행이 일치하지 않습니다.');
  const parsed = parseOfficialGurpsCheck({
   checkName: run.check_name, exitCode: run.exit_code,
      stdout: run.exit_code === 0 ? 'PASS: stored check\n' : '',
   stderr: run.exit_code === 0 ? '' : `${entries.map((issue) => issue.raw_line).join('\n')}\nFAIL: ${entries.length}건\n`
  });
    if (!equal(parsed.issues, entries)) fail('E_SOURCE_CHECK', '공식 검사 행의 category/person_id가 원문과 다릅니다.');
  }
  if (complete) {
    const parsed = bundle.officialChecks.map(parseOfficialGurpsCheck);
    compareRows(db, 'source_check_run', parsed.map((result) => result.run), 'E_SOURCE_CHECK');
    compareRows(db, 'source_check_issue', parsed.flatMap((result) => result.issues), 'E_SOURCE_CHECK');
  }
  const importer = db.prepare('SELECT count(*) AS n FROM quality_issue').get().n;
  return {
    source_quality: issues.length > 0 || importer > 0 ? 'degraded' : 'clean',
    official_check_status: runs.length === 0 ? 'not_checked' : 'checked',
    official_check_reason: runs.length === 0 ? 'unsupported-current-schema' : null,
    official_issue_count: issues.length, importer_issue_count: importer,
    official_issue_categories: Object.fromEntries(db.prepare('SELECT category,count(*) AS n FROM source_check_issue GROUP BY category ORDER BY category').all().map((row) => [row.category, row.n])),
    official_affected_people: db.prepare('SELECT count(DISTINCT person_id) AS n FROM source_check_issue').get().n,
    importer_affected_people: db.prepare('SELECT count(DISTINCT person_id) AS n FROM quality_issue').get().n,
  };
}

function checkCoverage(db, people) {
  const coverage = {
    profile_people: db.prepare('SELECT count(DISTINCT person_id) AS n FROM profile').get().n,
    primary_profiles: db.prepare('SELECT count(*) AS n FROM profile WHERE is_primary=1').get().n,
    gender_people: db.prepare('SELECT count(*) AS n FROM person_gender').get().n,
    lineage_people: db.prepare('SELECT count(*) AS n FROM person_lineage').get().n,
    gurps_people: db.prepare('SELECT count(*) AS n FROM gurps_profile').get().n,
  };
  if (Object.values(coverage).some((count) => count !== people)) fail('E_PERSON_COVERAGE', '사람별 profile/gender/lineage/GURPS 커버리지가 다릅니다.');
  if (db.prepare('SELECT count(*) AS n FROM profile_node n JOIN profile p USING(profile_id) WHERE n.source_id<>p.source_id').get().n !== 0
    || db.prepare('SELECT count(*) AS n FROM profile_field f JOIN profile p USING(profile_id) WHERE f.source_id<>p.source_id').get().n !== 0) fail('E_SOURCE_FIDELITY', 'profile 출처와 하위 행 출처가 다릅니다.');
  return {
    ...coverage,
    numeric_desires: db.prepare("SELECT count(*) AS n FROM person_desire WHERE value_kind='integer'").get().n,
    qualitative_desires: db.prepare("SELECT count(*) AS n FROM person_desire WHERE value_kind='text'").get().n,
    blank_relation_grounds_ko: db.prepare("SELECT count(*) AS n FROM relation WHERE grounds_ko=''").get().n,
    evidence_mismatches: db.prepare("SELECT count(*) AS n FROM evidence WHERE match_status<>'match'").get().n,
  };
}

/** Reopen read-only. Without sourceRoot, report the unavailable freshness/rendering checks explicitly. */
export async function verifyCastDatabase({ dbPath, sourceRoot, requireClean = false, receiptPath } = {}) {
  if (typeof dbPath !== 'string' || !dbPath || typeof requireClean !== 'boolean' || (receiptPath !== undefined && (typeof receiptPath !== 'string' || !receiptPath))) fail('E_VERIFY_USAGE', 'dbPath와 유효한 검증 옵션이 필요합니다.');
  const path = resolve(dbPath);
  if (receiptPath !== undefined) await absent(resolve(receiptPath), 'E_RECEIPT_EXISTS');
  await checkSidecars(path);
  let db;
  let receipt;
  const before = sha256(await readFile(path));
  try {
    db = openReadOnly(path);
    db.exec('BEGIN');
    if (db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='document_authority'").get()) {
      receipt = { ...reviewCurrentAuthority(db, { requireClean }), sha256: before };
    } else {
    if (path === resolve(fileURLToPath(new URL('../../data/canonical/wiki-cast.sqlite', import.meta.url)))
      || (sourceRoot && path === resolve(sourceRoot, 'data/canonical/wiki-cast.sqlite'))) {
      fail('E_AUTHORITY_MISSING', '저작 정본에 문서 권위 계약이 없습니다. 이전 JSON으로 검증하지 않습니다.');
    }
    const integrity = runIntegrityChecks(db);
    const tableNames = checkSchema(db);
    const { metadata, expected } = checkMetadata(db, tableNames);
    const stored = storedBundle(db, metadata);
    const complete = sourceRoot !== undefined && sourceRoot !== null;
    const { bundle, renderLoreMarkdown } = complete ? await currentBundle(sourceRoot, stored, metadata) : { bundle: stored, renderLoreMarkdown: () => '' };
    const textTables = mapTextCorpus({ bundle });
    compareMapped(db, textTables, Object.fromEntries(Object.keys(TEXT_CORPUS_TABLE_COLUMNS).map((table) => [table, table])));
    const textCorpus = auditTextCorpus({ bundle, tables: textTables });
    const identity = mapIdentityDomains(bundle);
    compareMapped(db, identity, IDENTITY_TABLES);
    compareMapped(db, mapRelations({ bundle, identity }), { relationTypes: 'relation_type', relations: 'relation' });
    const references = db.prepare('SELECT * FROM source_reference ORDER BY source_id,json_pointer,ordinal').all();
    const gurps = mapGurps({ bundle, identity });
    compareMapped(db, { ...gurps, qualityIssues: [...gurps.qualityIssues, ...mapReferenceAnchorIssues(references)] }, GURPS_TABLES);
    compareMapped(db, mapFamilyDomains({ bundle, identity }), FAMILY_TABLES);
    compareMapped(db, mapContextDomains({ bundle, identity }), CONTEXT_TABLES);
    compareMapped(db, mapIndexDomains({ bundle, identity }), INDEX_TABLES);
    compareMapped(db, mapHistoricalContext({ bundle, identity }), HISTORICAL_CONTEXT_TABLES);
    compareMapped(db, mapIdentityProvenance(bundle), IDENTITY_PROVENANCE_TABLES);
    compareMapped(db, mapExcludedSourceDomains({ bundle }), EXCLUDED_SOURCE_TABLES);
    if (complete) {
      compareMapped(db, mapEngineDomains({ bundle, identity }), ENGINE_TABLES);
      compareMapped(db, mapSourceClosureDomains({ bundle }), SOURCE_CLOSURE_TABLES);
    }
    const profiles = mapProfiles({ bundle, identity, renderLoreMarkdown });
    compareRows(db, 'profile', profiles.profiles, 'E_SOURCE_FIDELITY', complete ? [] : ['is_primary']);
    compareRows(db, 'profile_node', profiles.profileNodes);
    if (complete) compareRows(db, 'profile_field', profiles.profileFields);
    const quality = checkSourceQuality(db, bundle, complete);
    const sourceReferenceUnresolvedCount = references.filter((row) => row.anchor_verification === 'json-pointer-unresolved').length;
    const coverageTableNames = complete ? new Set([
      ...Object.values(COVERAGE_CONTRACT).flatMap((contract) => contract.mappings.map((mapping) => mapping.table)),
      ...bundle.files.filter((file) => Object.hasOwn(COVERAGE_CONTRACT, file.logical_path)).flatMap((file) =>
        fieldCoverageManifest(file.logical_path, file.document).flatMap((row) => row.normalized_targets.map((target) => target.split('.')[0]))),
      'current_engine_source',
      'current_profile',
    ]) : null;
    if (coverageTableNames && [...coverageTableNames].some((table) => !tableNames.includes(table))) fail('E_COVERAGE_ROWS', '필드 계약이 알 수 없는 테이블을 참조합니다.');
    const coverageTables = coverageTableNames ? Object.fromEntries([...coverageTableNames].map((table) => [table, db.prepare(`SELECT * FROM ${quote(table)}`).all()])) : null;
    const coverageContract = complete ? auditCoverageContract({ bundle, tables: coverageTables }) : null;
    const coverage = checkCoverage(db, identity.people.length);
    const currentSourceAlignment = {
      index_warnings: db.prepare('SELECT count(*) AS n FROM index_issue').get().n,
      gender_policy_drift: db.prepare("SELECT count(*) AS n FROM identity_gender_policy WHERE alignment_status<>'matches-current'").get().n,
      holding_superseded: db.prepare("SELECT count(*) AS n FROM context_holding WHERE current_validity='superseded_outside_seoul'").get().n,
      holding_unresolved: db.prepare("SELECT count(*) AS n FROM context_holding WHERE current_validity='unresolved'").get().n,
      holding_current: db.prepare("SELECT count(*) AS n FROM context_holding WHERE current_validity='current_seoul_evidenced'").get().n,
      holding_nonowning: db.prepare("SELECT count(*) AS n FROM context_holding WHERE current_validity='current_seoul_nonowning'").get().n,
      current_title_count: db.prepare('SELECT count(*) AS n FROM context_feudal_title').get().n,
      current_grant_count: db.prepare('SELECT count(*) AS n FROM context_feudal_grant').get().n,
      political_identity_count: db.prepare('SELECT count(*) AS n FROM context_political_identity').get().n,
      outside_retired_count: db.prepare('SELECT count(*) AS n FROM context_outside_retirement').get().n,
    };
    const counts = Object.fromEntries(tableNames.map((table) => [table, db.prepare(`SELECT count(*) AS n FROM ${quote(table)}`).get().n]));
    for (const table of tableNames) if (counts[table] !== expected[table]) fail('E_ROW_COUNT', `${table}: 메타데이터=${expected[table]}, 실제 데이터=${counts[table]}`);
    receipt = {
      status: quality.source_quality === 'clean' ? 'PASS' : 'PASS_WITH_SOURCE_ISSUES',
      artifact_integrity: 'ok', ...quality, historical_gurps_quality: quality.official_check_status === 'not_checked' ? 'unverified' : quality.source_quality,
      current_import_integrity: 'ok', current_approval_readiness: 'unreviewed',
      current_source_alignment: currentSourceAlignment,
      excluded_source_count: bundle.excludedFiles.length,
      coverage_contract_status: complete ? 'verified' : 'unchecked', text_corpus: textCorpus,
    coverage_contract: coverageContract === null ? null : {
     source_count: coverageContract.sourceCount, leaf_pattern_count: coverageContract.leafPatternCount,
        private_source_count: coverageContract.privateSourceCount, private_leaf_pattern_count: coverageContract.privateLeafPatternCount,
     sha256: sha256(JSON.stringify(coverageContract))
    },
      official_check_scope: 'historical-gurps-only', complete_verification: complete,
      source_freshness: complete ? 'current' : 'unchecked', profile_rendering: complete ? 'verified' : 'unchecked',
      official_check_replayed: complete && quality.official_check_status === 'checked', official_check_replayed_scope: complete && quality.official_check_status === 'checked' ? 'historical-gurps-only' : 'none',
      raw_bytes_verified: true,
      reference_closure: complete
        ? sourceReferenceUnresolvedCount ? 'verified-with-unresolved-anchors' : 'verified'
        : sourceReferenceUnresolvedCount ? 'stored-hashes-only-with-unresolved-anchors' : 'stored-hashes-only',
      source_reference_unresolved_count: sourceReferenceUnresolvedCount,
      ...integrity,
      counts, coverage, source_git_commit: metadata.source_git_commit, source_git_head: complete ? bundle.sourceRevision : null, source_set_sha256: metadata.source_set_sha256,
      sha256: before, included_domains: INCLUDED, excluded_domains: EXCLUDED,
    };
    }
  } catch (error) {
    if (error.errcode === 11 || error.errcode === 26) fail('E_DB_INTEGRITY', error.message);
    throw error;
  } finally { if (db?.isOpen) db.close(); }
  await checkSidecars(path);
  if (sha256(await readFile(path)) !== before) fail('E_DB_CHANGED', '검증 도중 DB 파일이 변경되었습니다.');
  if (receipt.mode !== 'current-authority' && requireClean && (receipt.source_quality !== 'clean' || receipt.official_check_status !== 'checked')) fail('E_SOURCE_QUALITY', `historical GURPS 공식 검사 ${receipt.official_check_status === 'not_checked' ? '미실행(현재 스키마 미지원)' : receipt.official_issue_count + '건'}; importer 독립 검사 ${receipt.importer_issue_count}건(참조 앵커 미확인 ${receipt.source_reference_unresolved_count}건 포함). 현재 도메인 owner approval을 판정하는 옵션이 아닙니다.`);
  if (receiptPath !== undefined) {
    try { await writeFile(resolve(receiptPath), `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', encoding: 'utf8' }); }
    catch (error) { if (error.code === 'EEXIST') fail('E_RECEIPT_EXISTS', receiptPath); throw error; }
  }
  return receipt;
}

function parseArgs(args) {
  const options = {};
  const seen = new Set();
  const names = { '--db': 'dbPath', '--source-root': 'sourceRoot', '--receipt': 'receiptPath' };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (seen.has(flag)) fail('E_VERIFY_USAGE', `중복 옵션: ${flag}`);
    seen.add(flag);
    if (flag === '--require-clean') options.requireClean = true;
    else if (flag === '--check-raw') continue;
    else if (Object.hasOwn(names, flag) && args[index + 1] && !args[index + 1].startsWith('--')) options[names[flag]] = args[++index];
    else fail('E_VERIFY_USAGE', `알 수 없거나 값이 없는 옵션: ${flag}`);
  }
 if (!options.dbPath || !options.dbPath.trim()) fail('E_VERIFY_USAGE', 'SQLite 이관 archive를 --db <파일>로 명시하세요. 운영 저작과 생성은 PostgreSQL을 사용합니다.');
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length === 3 && process.argv[2] === '--help') {
      console.log('사용법: node verify.mjs --db <파일> [--source-root <WIKI 절대경로>] [--receipt <새 JSON 경로>] [--require-clean] [--check-raw]\n현재 정본은 읽기 전용 typed head와 저장된 승인 일관성을 검사하며 JSON을 재수입하지 않습니다. --check-raw는 호환 옵션이며 현재 정본의 archive replay를 수행하지 않습니다. --require-clean은 원래 import 품질 gate이며 현재 owner approval 판정이 아닙니다.');
    } else console.log(JSON.stringify(await verifyCastDatabase(parseArgs(process.argv.slice(2))), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ status: 'FAIL', code: error.code ?? 'E_VERIFY', message: error.message }));
    process.exitCode = 1;
  }
}
