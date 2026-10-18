import { randomBytes } from 'node:crypto';
import { link, lstat, mkdir, readFile, realpath, rename, unlink } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_SOURCE_PATHS, SCRIPT_SOURCE_PATHS, loadSourceBundle, loadTrustedRenderer, resolveTrustedSourcePath, sha256 } from './sources.mjs';
import { mapIdentityDomains } from './identity-values.mjs';
import { mapProfiles, mapRelations } from './profiles-relations.mjs';
import { mapGurps, parseOfficialGurpsCheck } from './gurps-evidence.mjs';
import { FAMILY_TABLE_COLUMNS, mapFamilyDomains } from './current-family.mjs';
import { ENGINE_TABLE_COLUMNS, mapEngineDomains } from './current-engine.mjs';
import { CONTEXT_TABLE_COLUMNS, mapContextDomains } from './current-context.mjs';
import { INDEX_TABLE_COLUMNS, mapIndexDomains } from './current-index.mjs';
import { HISTORICAL_CONTEXT_TABLE_COLUMNS, mapHistoricalContext } from './historical-context.mjs';
import { IDENTITY_PROVENANCE_TABLE_COLUMNS, mapIdentityProvenance } from './current-identity-provenance.mjs';
import { auditCoverageContract } from './coverage-contract.mjs';
import { SOURCE_CLOSURE_TABLE_COLUMNS, mapSourceClosureDomains } from './source-closure.mjs';
import { EXCLUDED_SOURCE_TABLE_COLUMNS, mapExcludedSourceDomains } from './excluded-sources.mjs';

export const GENERATOR_VERSION = '1.0.0';
export const DEFAULT_SOURCE_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const CANONICAL_CAST_DATABASE = 'data/canonical/wiki-cast.sqlite';

export function isCanonicalCastOutput(sourceRoot, outputPath) {
  return typeof sourceRoot === 'string' && isAbsolute(sourceRoot) && typeof outputPath === 'string'
    && resolve(outputPath) === resolve(sourceRoot, CANONICAL_CAST_DATABASE);
}
const INCLUDED_DOMAINS = Object.freeze(['people', 'values', 'desires', 'gender', 'lineage', 'profiles', 'narrative-relations', 'historical-gurps', 'historical-rights', 'family', 'household', 'current-context', 'current-engine', 'draft-index', 'source-closure', 'provenance']);
const EXCLUDED_DOMAINS = Object.freeze(['synthetics', 'bestiary', 'organizations', 'authoring-examples', 'roster-100', 'cast-backfill-draft']);

const CORE_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  build_metadata: 'key value',
  source_file: 'source_id logical_path media_type sha256 byte_length raw_bytes',
  source_record: 'source_id json_pointer parent_pointer ordinal field_name json_type text_value integer_value real_value boolean_value',
  state: 'state_id name_ko',
  state_label: 'state_id name_ko',
  person: 'person_id name publication_ordinal public_key public_route state_id state_name title stage generation source_kind minors locked values_source_ordinal',
  person_alias: 'person_id alias alias_ordinal',
  value_axis: 'axis_name axis_ordinal',
  person_value: 'person_id axis_name value',
  desire_axis: 'axis_name axis_ordinal value_kind',
  person_desire: 'person_id axis_name value_kind integer_value text_value',
  person_gender: 'person_id state_id gender assignment_source user_locked',
  clan: 'clan_id base_clan_id surname bongwan bongwan_hanja branch provenance hangnyeol_unconfirmed_reason source_label surname_hanja creative_rationale method_ref show_branches',
  clan_source: 'clan_id ordinal source_ref',
  clan_hangnyeol_row: 'clan_id ordinal sesu hangnyeol hanja position',
  person_lineage: 'person_id surname status bongwan clan_id base_clan_id branch reason source_file_label surname_hanja bongwan_hanja hangnyeol position sesu naming_convention naming_source_character_id naming_source_path naming_source_basis',
  person_lineage_source_clan: 'person_id source_ref source_ordinal',
  lineage_node: 'name person_id',
  lineage_parent: 'child_name parent_name',
  lineage_founder_sesu: 'person_name sesu',
  lineage_clan_assignment: 'person_id clan_id',
  profile: 'profile_id person_id source_id heading_pointer source_kind source_ordinal heading_depth anchor heading_ko heading_en node_start node_end is_primary',
  profile_node: 'profile_id node_ordinal source_id json_pointer',
  profile_field: 'profile_id field_ordinal field_kind key_ko key_en value_ko value_en source_id json_pointer',
  relation_type: 'type_ko type_en type_ordinal',
  relation: 'relation_id source_id row_ordinal section_anchor from_person_id to_person_id type_ko type_en grounds_ko grounds_en json_pointer',
  gurps_profile: 'person_id state_id url status method role_display band baseline attributes advantages disadvantages skills spent unspent total source_id json_pointer territory_presence unit_presence wandering_force_presence advantages_presence disadvantages_presence',
  gurps_attribute: 'person_id attribute_code ordinal value cp rule',
  gurps_secondary: 'person_id stat_name ordinal value',
  gurps_trait: 'person_id ordinal name kind rule level people frequency cp page effect reaction_presence reaction_ordinary_observers reaction_attracted_observers reaction_application boundaries_presence source_id json_pointer',
  gurps_trait_application_boundary: 'person_id trait_ordinal ordinal text source_id json_pointer',
  gurps_skill: 'person_id ordinal name name_ko attribute_code difficulty difficulty_source tier cp level effect evidence_presence source_id json_pointer',
  gurps_language: 'person_id ordinal name level cp',
  gurps_advantage: 'person_id ordinal name cp effect source_id json_pointer',
  gurps_disadvantage: 'person_id ordinal name cp effect source_id json_pointer',
  gurps_territory: 'person_id fief_name type station state_id settlement_name settlement_type settlement_description note source_id json_pointer',
  gurps_unit: 'person_id type type_presence size quality note scale_state_id scale_tier scale_factor source_id json_pointer',
  gurps_unit_composition: 'person_id ordinal text source_id json_pointer',
  gurps_wandering_force: 'person_id type size current_location note camp_name camp_type camp_description camp_pack_up_time source_id json_pointer',
  gurps_wandering_facility: 'person_id ordinal text source_id json_pointer',
  evidence: 'evidence_id person_id subject_kind subject_key subject_ordinal evidence_ordinal source_id source_path json_pointer source_line quote note_text match_status',
  source_check_run: 'check_name exit_code stdout_sha256 stderr_sha256 issue_count',
  source_check_issue: 'check_name ordinal category person_id raw_line',
  quality_issue: 'issue_id dataset code severity person_id source_id json_pointer message observed_value',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));
const TABLE_COLUMNS = Object.freeze({ ...CORE_TABLE_COLUMNS, ...FAMILY_TABLE_COLUMNS, ...ENGINE_TABLE_COLUMNS, ...CONTEXT_TABLE_COLUMNS, ...INDEX_TABLE_COLUMNS, ...HISTORICAL_CONTEXT_TABLE_COLUMNS, ...IDENTITY_PROVENANCE_TABLE_COLUMNS, ...SOURCE_CLOSURE_TABLE_COLUMNS, ...EXCLUDED_SOURCE_TABLE_COLUMNS });

function fail(code, message, cause) {
  throw Object.assign(new Error(`${code}: ${message}`, cause === undefined ? undefined : { cause }), { code });
}

function requireRuntime() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 24 || (major === 24 && minor < 15)) fail('E_NODE_VERSION', `Node.js 24.15.0 이상이 필요합니다: ${process.versions.node}`);
}

function exactKeys(row, keys, label) {
  if (row === null || typeof row !== 'object' || Array.isArray(row)
    || Object.keys(row).length !== keys.length || keys.some((key) => !Object.hasOwn(row, key) || row[key] === undefined)) {
    fail('E_BUILD_ROW_SHAPE', `${label}: 열 목록이 계약과 다릅니다.`);
  }
}

async function requireAbsent(path) {
  try { await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  fail('E_OUTPUT_EXISTS', '출력 경로가 이미 존재합니다. 새 경로를 지정하세요.');
}

async function preflightOutput(sourceRoot, outputPath) {
  if (typeof outputPath !== 'string' || outputPath.trim() === '') fail('E_BUILD_OPTIONS', 'outputPath가 필요합니다.');
  const output = resolve(outputPath);
  const canonical = isCanonicalCastOutput(sourceRoot, output);
  if (!canonical) await requireAbsent(output);
  if (canonical) await mkdir(dirname(output), { recursive: true });
  let directory;
  try {
    directory = await realpath(dirname(output));
    if (!(await lstat(directory)).isDirectory()) fail('E_OUTPUT_DIRECTORY', '출력의 상위 경로는 디렉터리여야 합니다.');
  } catch (cause) {
    if (cause.code === 'E_OUTPUT_DIRECTORY') throw cause;
    fail('E_OUTPUT_DIRECTORY', '출력 디렉터리가 존재해야 합니다.', cause);
  }
  if (!canonical && typeof sourceRoot === 'string' && isAbsolute(sourceRoot)) {
    const source = await realpath(sourceRoot).catch(() => resolve(sourceRoot));
    const inside = relative(source, directory);
    if (inside === '' || (!inside.startsWith('..') && !isAbsolute(inside))) fail('E_OUTPUT_SOURCE_ROOT', '읽기 전용 정본 디렉터리 안에 출력할 수 없습니다.');
  }
  return resolve(directory, basename(output));
}

async function assertSnapshot(sourceRoot, bundle) {
  for (const file of [...bundle.files, ...bundle.referenceFiles, ...bundle.engineFiles, ...bundle.excludedFiles]) {
    const path = await resolveTrustedSourcePath(sourceRoot, file.logical_path);
    if (sha256(await readFile(path)) !== file.sha256) fail('E_SOURCE_CHANGED', file.logical_path);
  }
}

function mappedTables(bundle, identity, profiles, relations, gurps, family, engine, context, index, historical, identityProvenance, closure, excluded) {
  const sourceFiles = bundle.files.map((file) => {
    exactKeys(file, [...TABLE_COLUMNS.source_file, 'document'], 'source bundle file');
    const { document, ...row } = file;
    return row;
  });
  const checks = bundle.officialChecks.map(parseOfficialGurpsCheck);
  const gurpsSchema = bundle.files.find((file) => file.logical_path === 'lore/name-pools/gurps-cast.json')?.document?.schema;
  if (checks.length > 1 || (checks.length === 0) !== (gurpsSchema === 'wiki-gurps-cast.v1')
    || checks.some((check) => check.run.check_name !== 'gurps-cast')) fail('E_SOURCE_CHECK_MISSING', '현재 GURPS 스키마와 공식 검사 실행 범위가 일치하지 않습니다.');
  return {
    source_file: sourceFiles, source_record: bundle.records,
    state: identity.states, state_label: identity.stateLabels, person: identity.people, person_alias: identity.aliases,
    value_axis: identity.valueAxes, person_value: identity.personValues, desire_axis: identity.desireAxes, person_desire: identity.personDesires,
    person_gender: identity.genders, clan: identity.clans, clan_source: identity.clanSources,
    clan_hangnyeol_row: identity.clanHangnyeolRows, person_lineage: identity.lineages,
    person_lineage_source_clan: identity.lineageSourceClans,
    lineage_node: identity.lineageNodes, lineage_parent: identity.lineageParents, lineage_founder_sesu: identity.lineageFounderSesu,
    lineage_clan_assignment: identity.lineageClanAssignments,
    profile: profiles.profiles, profile_node: profiles.profileNodes, profile_field: profiles.profileFields,
    relation_type: relations.relationTypes, relation: relations.relations,
    gurps_profile: gurps.gurpsProfiles, gurps_attribute: gurps.attributes, gurps_secondary: gurps.secondary,
    gurps_trait: gurps.traits, gurps_trait_application_boundary: gurps.traitBoundaries,
    gurps_skill: gurps.skills, gurps_language: gurps.languages,
    gurps_advantage: gurps.advantages, gurps_disadvantage: gurps.disadvantages,
    gurps_territory: gurps.territories, gurps_unit: gurps.units, gurps_unit_composition: gurps.unitComposition,
    gurps_wandering_force: gurps.wanderingForces, gurps_wandering_facility: gurps.wanderingFacilities,
    evidence: gurps.evidence,
    source_check_run: checks.map((check) => check.run), source_check_issue: checks.flatMap((check) => check.issues),
    quality_issue: [...gurps.qualityIssues, ...mapReferenceAnchorIssues(closure.source_reference)],
    ...family,
    ...engine,
    ...context,
    ...index,
    ...historical,
    ...identityProvenance,
    ...closure,
    ...excluded,
  };
}

export function mapReferenceAnchorIssues(references) {
  return references.filter((row) => row.anchor_verification === 'json-pointer-unresolved').map((row) => ({
    issue_id: `reference-anchor-${sha256(`${row.source_id}\0${row.json_pointer}\0${row.ordinal}`)}`,
    dataset: 'reference', code: 'E_REFERENCE_ANCHOR', severity: 'error', person_id: null,
    source_id: row.source_id, json_pointer: row.json_pointer,
    message: `Unresolved JSON pointer anchor: ${row.reference_logical_path}#${row.reference_anchor}`,
    observed_value: JSON.stringify({ reference_logical_path: row.reference_logical_path, reference_anchor: row.reference_anchor }),
  }));
}

function validateRows(tables) {
  for (const [table, rows] of Object.entries(tables)) {
    if (!Object.hasOwn(TABLE_COLUMNS, table) || !Array.isArray(rows)) fail('E_BUILD_ROW_SHAPE', `${table}: 배열이 필요합니다.`);
    for (const [ordinal, row] of rows.entries()) exactKeys(row, TABLE_COLUMNS[table], `${table}[${ordinal}]`);
  }
}

function insertTables(db, tables) {
  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    const rows = tables[table];
    if (!rows) fail('E_BUILD_ROW_SHAPE', `${table}: 필수 적재 목록이 없습니다.`);
    const statement = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
    for (const [ordinal, row] of rows.entries()) {
      try { statement.run(...columns.map((column) => row[column])); }
      catch (cause) { fail('E_BUILD_INSERT', `${table}[${ordinal}]: 적재에 실패했습니다.`, cause); }
    }
  }
}

function checkStructure(db, expectedCounts, integrityCheck) {
  const integrity = integrityCheck(db);
  for (const [table, expected] of Object.entries(expectedCounts)) {
    if (!Object.hasOwn(TABLE_COLUMNS, table)) fail('E_BUILD_COUNTS', '알 수 없는 테이블입니다.');
    const actual = db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count;
    if (actual !== expected) fail('E_BUILD_COUNTS', `${table}: ${actual} != ${expected}`);
  }
  const missing = db.prepare(`SELECT person_id FROM person
    WHERE NOT EXISTS (SELECT 1 FROM profile WHERE profile.person_id=person.person_id AND is_primary=1)
       OR NOT EXISTS (SELECT 1 FROM person_gender WHERE person_gender.person_id=person.person_id)
       OR NOT EXISTS (SELECT 1 FROM person_lineage WHERE person_lineage.person_id=person.person_id)
       OR NOT EXISTS (SELECT 1 FROM gurps_profile WHERE gurps_profile.person_id=person.person_id)`).all();
  if (missing.length !== 0) fail('E_BUILD_COVERAGE', '인물별 필수 domain 또는 대표 프로필이 누락되었습니다.');
  const tables = db.prepare("PRAGMA table_list").all().filter((row) => row.schema === 'main' && !row.name.startsWith('sqlite_'));
  if (tables.length !== Object.keys(TABLE_COLUMNS).length || tables.some((row) => row.strict !== 1)) fail('E_BUILD_SCHEMA', 'STRICT table 계약이 다릅니다.');
  return integrity;
}

async function removeOwnTemp(path) {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try { await unlink(`${path}${suffix}`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export function summarizeCurrentSourceAlignment(tables) {
  return {
    index_warnings: tables.index_issue.length,
    gender_policy_drift: tables.identity_gender_policy.filter((row) => row.alignment_status !== 'matches-current').length,
    holding_superseded: tables.context_holding.filter((row) => row.current_validity === 'superseded_outside_seoul').length,
    holding_unresolved: tables.context_holding.filter((row) => row.current_validity === 'unresolved').length,
    holding_current: tables.context_holding.filter((row) => row.current_validity === 'current_seoul_evidenced').length,
  };
}

export async function buildCastDatabase({ sourceRoot, outputPath, requireClean = false } = {}) {
  requireRuntime();
  if (typeof requireClean !== 'boolean') fail('E_BUILD_OPTIONS', 'requireClean은 boolean이어야 합니다.');
  const effectiveSourceRoot = sourceRoot ?? DEFAULT_SOURCE_ROOT;
  const output = await preflightOutput(effectiveSourceRoot, outputPath);
  const { SCHEMA_VERSION, applySchema, openReadOnly, openWritableNew, runIntegrityChecks, withTransaction } = await import('./db.mjs');
  const bundle = await loadSourceBundle({ sourceRoot: effectiveSourceRoot });
  const renderer = await loadTrustedRenderer({ sourceRoot: effectiveSourceRoot, bundle });
  const identity = mapIdentityDomains(bundle);
  const profiles = mapProfiles({ bundle, identity, renderLoreMarkdown: renderer.renderLoreMarkdown });
  const relations = mapRelations({ bundle, identity });
  const gurps = mapGurps({ bundle, identity });
  const family = mapFamilyDomains({ bundle, identity });
  const engine = mapEngineDomains({ bundle, identity });
  const context = mapContextDomains({ bundle, identity });
  const index = mapIndexDomains({ bundle, identity });
  const historical = mapHistoricalContext({ bundle, identity });
  const identityProvenance = mapIdentityProvenance(bundle);
  const closure = mapSourceClosureDomains({ bundle });
  const excluded = mapExcludedSourceDomains({ bundle });
  const tables = mappedTables(bundle, identity, profiles, relations, gurps, family, engine, context, index, historical, identityProvenance, closure, excluded);
  validateRows(tables);
  const coverageContract = auditCoverageContract({ bundle, tables });
  const officialIssueCount = tables.source_check_issue.length;
  const importerIssueCount = tables.quality_issue.length;
  const sourceReferenceUnresolvedCount = closure.source_reference.filter((row) => row.anchor_verification === 'json-pointer-unresolved').length;
  const currentSourceAlignment = summarizeCurrentSourceAlignment(tables);
  const degraded = officialIssueCount > 0 || importerIssueCount > 0 || tables.source_check_run.some((run) => run.exit_code !== 0);
  if (requireClean && (degraded || bundle.officialChecks.length === 0)) fail('E_SOURCE_QUALITY', `공식 검사 ${bundle.officialChecks.length === 0 ? '미실행(현재 스키마 미지원)' : officialIssueCount + '건'}, importer 검사 ${importerIssueCount}건(참조 앵커 미확인 ${sourceReferenceUnresolvedCount}건 포함)입니다.`);
  await assertSnapshot(effectiveSourceRoot, bundle);
  const canonical = isCanonicalCastOutput(effectiveSourceRoot, output);
  if (!canonical) await requireAbsent(output);
  const temp = resolve(dirname(output), `.${basename(output)}.build-${randomBytes(16).toString('hex')}.tmp`);
  let db;
  let ownsTemp = false;
  try {
    db = openWritableNew(temp);
    ownsTemp = true;
    const sqliteVersion = db.prepare('SELECT sqlite_version() AS version').get().version;
    const counts = Object.fromEntries(Object.keys(TABLE_COLUMNS).map((table) => [table, table === 'build_metadata' ? 9 : tables[table].length]));
    tables.build_metadata = Object.entries({
      schema_version: String(SCHEMA_VERSION), generator_version: GENERATOR_VERSION, node_version: process.versions.node,
      sqlite_version: sqliteVersion, source_git_commit: bundle.sourceRevision, source_set_sha256: bundle.sourceSetSha256,
      included_domains: JSON.stringify(INCLUDED_DOMAINS), excluded_domains: JSON.stringify(EXCLUDED_DOMAINS), expected_counts: JSON.stringify(counts),
    }).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => ({ key, value }));
    validateRows(tables);
    withTransaction(db, () => { applySchema(db); insertTables(db, tables); });
    checkStructure(db, counts, runIntegrityChecks);
    db.close();
    db = openReadOnly(temp);
    checkStructure(db, counts, runIntegrityChecks);
    db.close();
    await assertSnapshot(effectiveSourceRoot, bundle);
    const bytes = await readFile(temp);
    const digest = sha256(bytes);
    if (canonical) await rename(temp, output);
    else try { await link(temp, output); }
    catch (cause) {
      if (cause.code === 'EEXIST') fail('E_OUTPUT_EXISTS', '게시 직전에 출력 경로가 생성되었습니다. 기존 파일을 보존했습니다.', cause);
      fail('E_OUTPUT_PUBLISH', '배타적 hard-link 게시에 실패했습니다.', cause);
    }
    return {
      status: degraded ? 'PASS_WITH_SOURCE_ISSUES' : 'PASS', artifact_integrity: 'ok',
      source_quality: degraded ? 'degraded' : 'clean', historical_gurps_quality: bundle.officialChecks.length === 0 ? 'unverified' : degraded ? 'degraded' : 'clean',
      official_check_status: bundle.officialChecks.length === 0 ? 'not_checked' : 'checked',
      official_check_reason: bundle.officialChecks.length === 0 ? 'unsupported-current-schema' : null,
      current_import_integrity: 'ok', current_approval_readiness: 'unreviewed',
      current_source_alignment: currentSourceAlignment,
      coverage_contract_status: 'verified',
      excluded_source_count: tables.excluded_source.length,
      coverage_contract: { source_count: coverageContract.sourceCount, leaf_pattern_count: coverageContract.leafPatternCount,
        private_source_count: coverageContract.privateSourceCount, private_leaf_pattern_count: coverageContract.privateLeafPatternCount,
        sha256: sha256(JSON.stringify(coverageContract)) },
      official_check_scope: 'historical-gurps-only',
      reference_closure: sourceReferenceUnresolvedCount ? 'verified-with-unresolved-anchors' : 'verified',
      source_reference_unresolved_count: sourceReferenceUnresolvedCount,
      schema_version: SCHEMA_VERSION, generator_version: GENERATOR_VERSION, node_version: process.versions.node, sqlite_version: sqliteVersion,
      source_git_commit: bundle.sourceRevision, source_set_sha256: bundle.sourceSetSha256,
      counts, source_data_count: DATA_SOURCE_PATHS.length, script_count: SCRIPT_SOURCE_PATHS.length,
      official_issue_count: officialIssueCount, importer_issue_count: importerIssueCount,
      included_domains: [...INCLUDED_DOMAINS], excluded_domains: [...EXCLUDED_DOMAINS], sha256: digest, byte_length: bytes.length,
    };
  } finally {
    try { if (db?.isOpen) db.close(); }
    finally { if (ownsTemp) await removeOwnTemp(temp); }
  }
}

function cliOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const name = { '--source-root': 'sourceRoot', '--output': 'outputPath', '--require-clean': 'requireClean' }[flag];
    if (!name || Object.hasOwn(options, name)) fail('E_BUILD_USAGE', '지원하지 않거나 중복된 인자입니다. --help를 확인하세요.');
    if (name === 'requireClean') options[name] = true;
    else {
      const value = args[++index];
      if (!value || value.startsWith('--')) fail('E_BUILD_USAGE', `${flag} 값이 필요합니다.`);
      options[name] = value;
    }
  }
  if (!options.outputPath) fail('E_BUILD_USAGE', '--output이 필요합니다.');
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--help') {
      console.log('Usage: node build.mjs --output <new.sqlite> [--source-root <absolute WIKI path>] [--require-clean]\nsource-root 생략 시 이 스크립트가 속한 위키 저장소를 사용합니다. 기존 출력은 보존합니다.');
    } else console.log(JSON.stringify(await buildCastDatabase(cliOptions(args)), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
