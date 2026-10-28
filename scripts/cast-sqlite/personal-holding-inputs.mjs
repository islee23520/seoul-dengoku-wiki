import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { readCurrentDataSource } from './data-source-editor.mjs';

const logicalPath = 'lore/relations/personal-holdings.json';
const fail = detail => { throw Object.assign(new Error(`E_PERSONAL_HOLDING_INPUT: ${detail}`), { code: 'E_PERSONAL_HOLDING_INPUT' }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(JSON.stringify(value));
const tables = ['context_holding', 'context_holding_admin_ref', 'context_holding_reference',
  'context_holding_geographic_scope', 'context_holding_scope_county', 'context_holding_power',
  'context_polity', 'context_retinue_group', 'context_retinue_duty', 'context_retinue_technical_limit',
  'context_retinue_holding', 'context_opening_disposition'];
const rightsTables = ['context_rights_approval', 'context_rights_original_source', 'context_rights_transition', 'context_feudal_binding'];
const boolean = value => value === null ? null : Boolean(value);
const localized = (row, prefix = 'name') => ({ ko: row[`${prefix}_ko`], en: row[`${prefix}_en`] });

function domains(db, sourceId) {
  const data = Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table} WHERE source_id=? ORDER BY json_pointer`).all(sourceId)]));
  // These existing approvals and transitions authenticate the current rights;
  // their values never become a second copy of holdings facts.
  const rights = Object.fromEntries(rightsTables.map(table => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
  return { data, rights };
}

function candidate(db, data) {
  const used = new Set();
  const rows = (table, filter = () => true) => data[table].filter(filter).sort((a, b) => (a.ordinal ?? Number(a.json_pointer.split('/').at(-1))) - (b.ordinal ?? Number(b.json_pointer.split('/').at(-1)))).map(row => { used.add(row); return row; });
  const ordered = (table, path) => rows(table).map((r, i) => { if (r.json_pointer !== `/${path}/${i}`) fail(`${table}:order`); return r; });
  const child = (table, id, key = 'holding_id') => rows(table, r => r[key] === id);
  const facilities = new Map(db.prepare('SELECT * FROM personal_holding_input_facility').all().map(r => [r.holding_id, r]));
  const holdings = ordered('context_holding', 'holdings').map(r => {
    const refs = child('context_holding_reference', r.holding_id);
    const scope = child('context_holding_geographic_scope', r.holding_id);
    if (scope.length > 1) fail('scope duplicate');
    const result = { id: r.holding_id, kind: r.kind, name: localized(r), holderPersonId: r.holder_person_id,
      directLiegePersonId: r.direct_liege_person_id, stateId: r.polity_id,
      designation: localized(r, 'designation'), territorialScale: r.territorial_scale, formalTitleRank: r.formal_title_rank,
      geometrySource: r.geometry_source, parentGeography: r.parent_geography, wholeSeoulControl: boolean(r.whole_seoul_control),
      directOwnership: boolean(r.direct_ownership), titleId: r.title_id, liegeRelationshipKind: r.liege_relationship_kind,
      capabilityPackageId: r.capability_package_id,
      adminRefs: child('context_holding_admin_ref', r.holding_id).map(a => ({ id: a.admin_id, name: a.admin_name })),
      powers: child('context_holding_power', r.holding_id).map(p => p.power) };
    for (const ref of refs) {
      if (ref.ordinal !== 0 || Object.hasOwn(result, `${ref.reference_kind}Ref`)) fail('reference duplicate');
      if (ref.reference_kind === 'station') result.stationRef = { stationId: ref.station_id, stationName: ref.station_name };
      else if (ref.reference_kind === 'landmark') result.landmarkRef = { landmarkId: ref.reference_id, landmarkName: ref.reference_name, sourcePath: ref.reference_source_path };
      else if (ref.reference_kind === 'facility') {
        const extra = facilities.get(r.holding_id);
        if (!extra) fail('facility metadata');
        facilities.delete(r.holding_id);
        result.facilityRef = { sourcePath: ref.reference_source_path, stationId: ref.station_id, stationName: ref.station_name,
          stationIdentity: { district: ref.station_district, lat: ref.station_lat, lon: ref.station_lon },
          siteSourcePath: ref.site_source_path, siteAnchor: ref.reference_anchor, layerId: extra.layer_id, layerName: extra.layer_name };
      } else fail('reference kind');
    }
    if (scope.length) { const s = scope[0]; result.geographicScope = { duchyTitleId: s.duchy_title_id, guRef: s.gu_ref,
      countyTitleIds: child('context_holding_scope_county', r.holding_id).map(c => c.county_title_id),
      geographicKingdomId: s.kingdom_geography_id, geographicEmpireId: s.empire_geography_id }; }
    return result;
  });
  const first = data.context_holding[0];
  if (!first || tables.flatMap(t => data[t]).some(r => r.source_schema !== undefined && (r.source_schema !== first.source_schema || r.opening_year !== first.opening_year))) fail('source contract');
  const document = { schema: first.source_schema, openingYear: first.opening_year,
    openingDispositions: ordered('context_opening_disposition', 'openingDispositions').map(r => ({ personId: r.person_id, status: r.status, approvalRef: r.approval_ref })),
    holdings,
    polities: ordered('context_polity', 'polities').map(r => ({ id: r.polity_id, name: localized(r), sovereignPersonId: r.sovereign_person_id,
      territorialScale: r.territorial_scale, formalTitle: r.formal_title, formalTitleRank: r.formal_title_rank, office: r.office,
      authority: { kind: r.authority_kind, name: r.authority_name }, directOwnership: boolean(r.direct_ownership), politicalTitleId: r.political_title_id })),
    retinueGroups: ordered('context_retinue_group', 'retinueGroups').map(r => ({ id: r.retinue_group_id, name: localized(r), courtId: r.court_id,
      liegePersonId: r.liege_person_id, count: r.person_count, personhoodReview: r.personhood_review, formalTitle: r.formal_title,
      duties: child('context_retinue_duty', r.retinue_group_id, 'retinue_group_id').map(d => d.duty),
      technicalLimits: child('context_retinue_technical_limit', r.retinue_group_id, 'retinue_group_id').map(l => l.technical_limit),
      holdingIds: child('context_retinue_holding', r.retinue_group_id, 'retinue_group_id').map(h => h.holding_id) })) };
  if (facilities.size || tables.some(t => data[t].some(r => !used.has(r)))) fail('unconsumed typed rows');
  return document;
}

function orderedDocument(db, value, current = false) {
  const groups = new Map();
  for (const r of db.prepare('SELECT * FROM personal_holding_input_key ORDER BY object_path,ordinal').all()) {
    if (!groups.has(r.object_path)) groups.set(r.object_path, []);
    groups.get(r.object_path).push(r);
  }
  const visit = (v, path) => {
    if (Array.isArray(v)) return v.map((child, i) => visit(child, `${path}/${i}`));
    if (v === null || typeof v !== 'object') return v;
    const keys = groups.get(path);
    if (!keys) fail(`${path}:missing keys`);
    if (current && Object.keys(v).some(key => !keys.some(row => row.key === key)
      && v[key] !== null && !(Array.isArray(v[key]) && v[key].length === 0)
      && !(v[key] && typeof v[key] === 'object' && !Array.isArray(v[key]) && Object.values(v[key]).every(child => child === null)))) fail(`${path}:unapproved field`);
    groups.delete(path);
    return Object.fromEntries(keys.map((r, i) => {
      if (r.ordinal !== i || !Object.hasOwn(v, r.key) || v[r.key] === undefined || ![0, 1].includes(r.is_null) || (r.is_null && v[r.key] !== null)) fail(`${path}:${r.key}:presence`);
      return [r.key, r.is_null ? null : visit(v[r.key], `${path}/${r.key}`)];
    }));
  };
  const result = visit(value, '');
  if (groups.size && (!current || [...groups.keys()].some(path => !/^\/(?:holdings\/(?:20|21|22|23|24)|polities\/0)(?:\/|$)/u.test(path)))) fail('unconsumed keys');
  return result;
}

// Runtime is SELECT-only: no source files, archive records, parsing or migration.
export function readPersonalHoldingInputs(db, {} = {}) {
  try {
    const receipts = db.prepare('SELECT * FROM personal_holding_input_import').all();
    if (receipts.length !== 1) fail('source receipt');
    const m = receipts[0], domainsNow = domains(db, m.source_id);
    if (db.prepare("SELECT name FROM sqlite_schema WHERE name='data_source_head'").get()
      && db.prepare('SELECT revision_id FROM data_source_head WHERE source_path=?').get(logicalPath)) {
      const approved = readCurrentDataSource(db, logicalPath);
      const result = orderedDocument(db, candidate(db, domainsNow.data), true);
      if (!isDeepStrictEqual(result, approved)) fail('approved revision projection');
      return result;
    }
    if (digest(domainsNow) !== m.domain_sha256) fail('typed domain digest');
    const result = orderedDocument(db, candidate(db, domainsNow.data));
    if (digest(result) !== m.document_sha256) fail('document digest');
    return result;
  } catch (error) { if (error.code === 'E_PERSONAL_HOLDING_INPUT') throw error; fail(error.message); }
}

// Explicit one-time initializer. Caller must supply authenticated bytes and a
// writable disposable copy; no existing context, source or rights row is edited.
export async function initializePersonalHoldingInputs(db, { sourceBytes, actor, reason } = {}) {
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  const expectedSourceHash = hash(sourceBytes);
  if (![actor, reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (db.isTransaction) fail('active transaction');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  const identity = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?').all(logicalPath);
  if (identity.length !== 1 || identity[0].sha256 !== expectedSourceHash) fail('source identity');
  const { readFile } = await import('node:fs/promises');
  const schema = await readFile(new URL('./personal-holding-inputs.sql', import.meta.url), 'utf8');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schema);
    const addKey = db.prepare('INSERT INTO personal_holding_input_key VALUES(?,?,?,?)');
    const walk = (v, path) => {
      if (Array.isArray(v)) { v.forEach((child, i) => walk(child, `${path}/${i}`)); return; }
      if (v === null || typeof v !== 'object') return;
      Object.entries(v).forEach(([key, child], ordinal) => { addKey.run(path, ordinal, key, Number(child === null)); walk(child, `${path}/${key}`); });
    };
    walk(document, '');
    for (const holding of document.holdings) if (holding.facilityRef) {
      const { layerId, layerName } = holding.facilityRef;
      if (typeof layerId !== 'string' || typeof layerName !== 'string') fail('facility layer types');
      db.prepare('INSERT INTO personal_holding_input_facility VALUES(?,?,?)').run(holding.id, layerId, layerName);
    }
    db.prepare('INSERT INTO personal_holding_input_import VALUES(1,?,?,?,?,?,?)').run(identity[0].source_id, expectedSourceHash, digest(document), digest(domains(db, identity[0].source_id)), actor, reason);
    const actual = readPersonalHoldingInputs(db);
    if (!isDeepStrictEqual(actual, document) || JSON.stringify(actual) !== JSON.stringify(document)) fail('source parity');
    db.exec('COMMIT');
    return actual;
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
