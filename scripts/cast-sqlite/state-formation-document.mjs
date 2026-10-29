import { createHash } from 'node:crypto';


const LOGICAL_PATH = 'lore/relations/state-formation-contract.json';
const CODE = 'E_STATE_FORMATION_DOCUMENT';

const ROOT_KEYS = [
  'schema', 'contractId', 'scope',
  'independentAcquisitionCreatesState', 'grantRequiresPriorMembership', 'territorialControlIsPersonalHolding',
  'formationPrerequisites', 'independentLedgers', 'sourceScope',
];
const SOURCE_KEYS = ['repository', 'path', 'pointer', 'sha256'];
const CONFIRMED_PREREQUISITE_KEYS = ['id', 'status', 'source', 'approvalRef'];
const UNRESOLVED_PREREQUISITE_KEYS = ['id', 'status', 'reason'];
const LEDGER_KEYS = ['wiki', 'gdd', 'storageRelationship'];
const WIKI_KEYS = ['stateRegistry', 'membershipRegistry', 'personalHoldingRegistry'];
const GDD_KEYS = ['ruleSource', 'clause'];
const SCOPE_KEYS = [
  'historicalPoliticalIdentities', 'currentPoliticalFactions',
  'centersConferExclusiveGeographicOwnership', 'currentIndependentPoliticalIdentities',
  'geographicKingdoms',
];
const HISTORICAL_KEYS = ['count', 'range', 'approvalRef'];
const FACTION_KEYS = ['name', 'centerRegion'];
const IDENTITY_KEYS = [
  'id', 'name', 'sovereignPersonId', 'kind', 'rank',
  'confersWholeGeographicKingdomOwnership', 'approvalRef',
];
const GEOGRAPHIC_KEYS = ['partitionCount', 'ownershipDeterminedByThisContract'];

const KEY_SHAPES = [
  ['', ROOT_KEYS],
  ['/formationPrerequisites/0', CONFIRMED_PREREQUISITE_KEYS],
  ['/formationPrerequisites/0/source', SOURCE_KEYS],
  ['/formationPrerequisites/1', CONFIRMED_PREREQUISITE_KEYS],
  ['/formationPrerequisites/1/source', SOURCE_KEYS],
  ['/formationPrerequisites/2', UNRESOLVED_PREREQUISITE_KEYS],
  ['/independentLedgers', LEDGER_KEYS],
  ['/independentLedgers/wiki', WIKI_KEYS],
  ['/independentLedgers/gdd', GDD_KEYS],
  ['/sourceScope', SCOPE_KEYS],
  ['/sourceScope/historicalPoliticalIdentities', HISTORICAL_KEYS],
  ['/sourceScope/currentPoliticalFactions/0', FACTION_KEYS],
  ['/sourceScope/currentPoliticalFactions/1', FACTION_KEYS],
  ['/sourceScope/currentPoliticalFactions/2', FACTION_KEYS],
  ['/sourceScope/currentIndependentPoliticalIdentities/0', IDENTITY_KEYS],
  ['/sourceScope/geographicKingdoms', GEOGRAPHIC_KEYS],
];

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => {
  throw Object.assign(new Error(`${CODE}: ${detail}`), { code: CODE });
};
const sameKeys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(expected);
const text = value => typeof value === 'string' && value.length > 0;
const bool = value => typeof value === 'boolean';
const integer = value => Number.isInteger(value);

function shape(document) {
  if (!sameKeys(document, ROOT_KEYS)) fail('unknown, missing, or unordered root fields');
  if (!text(document.schema) || !text(document.contractId) || !text(document.scope)) fail('root scalars');
  if (!bool(document.independentAcquisitionCreatesState)
    || !bool(document.grantRequiresPriorMembership)
    || !bool(document.territorialControlIsPersonalHolding)) fail('root booleans');
  if (!Array.isArray(document.formationPrerequisites) || document.formationPrerequisites.length !== 3) fail('prerequisites');
  document.formationPrerequisites.forEach((item, ordinal) => {
    if (ordinal < 2) {
      if (!sameKeys(item, CONFIRMED_PREREQUISITE_KEYS)) fail(`prerequisite ${ordinal} fields`);
      if (!text(item.id) || !text(item.status) || !text(item.approvalRef)) fail(`prerequisite ${ordinal} scalars`);
      if (!sameKeys(item.source, SOURCE_KEYS)) fail(`prerequisite ${ordinal} source fields`);
      if (![item.source.repository, item.source.path, item.source.pointer, item.source.sha256].every(text)) fail(`prerequisite ${ordinal} source`);
    } else {
      if (!sameKeys(item, UNRESOLVED_PREREQUISITE_KEYS)) fail('unresolved prerequisite fields');
      if (!text(item.id) || !text(item.status) || !text(item.reason)) fail('unresolved prerequisite');
      if (Object.hasOwn(item, 'source') || Object.hasOwn(item, 'approvalRef')) fail('unresolved prerequisite extras');
    }
  });
  const ledgers = document.independentLedgers;
  if (!sameKeys(ledgers, LEDGER_KEYS)) fail('ledger fields');
  if (!sameKeys(ledgers.wiki, WIKI_KEYS)) fail('wiki ledger fields');
  if (!Object.values(ledgers.wiki).every(text)) fail('wiki ledger values');
  if (!sameKeys(ledgers.gdd, GDD_KEYS)) fail('gdd ledger fields');
  if (!text(ledgers.gdd.ruleSource) || !text(ledgers.gdd.clause)) fail('gdd ledger values');
  if (!text(ledgers.storageRelationship)) fail('storage relationship');
  const scope = document.sourceScope;
  if (!sameKeys(scope, SCOPE_KEYS)) fail('source scope fields');
  if (!sameKeys(scope.historicalPoliticalIdentities, HISTORICAL_KEYS)) fail('historical fields');
  if (!integer(scope.historicalPoliticalIdentities.count)
    || !text(scope.historicalPoliticalIdentities.range)
    || !text(scope.historicalPoliticalIdentities.approvalRef)) fail('historical values');
  if (!Array.isArray(scope.currentPoliticalFactions) || scope.currentPoliticalFactions.length !== 3) fail('factions');
  for (const faction of scope.currentPoliticalFactions) {
    if (!sameKeys(faction, FACTION_KEYS) || !text(faction.name) || !text(faction.centerRegion)) fail('faction fields');
  }
  if (!bool(scope.centersConferExclusiveGeographicOwnership)) fail('centers ownership');
  if (!Array.isArray(scope.currentIndependentPoliticalIdentities) || scope.currentIndependentPoliticalIdentities.length !== 1) fail('identities');
  for (const identity of scope.currentIndependentPoliticalIdentities) {
    if (!sameKeys(identity, IDENTITY_KEYS)) fail('identity fields');
    if (![identity.id, identity.name, identity.sovereignPersonId, identity.kind, identity.rank, identity.approvalRef].every(text)) fail('identity scalars');
    if (!bool(identity.confersWholeGeographicKingdomOwnership)) fail('identity ownership');
  }
  if (!sameKeys(scope.geographicKingdoms, GEOGRAPHIC_KEYS)) fail('geographic fields');
  if (!integer(scope.geographicKingdoms.partitionCount) || !bool(scope.geographicKingdoms.ownershipDeterminedByThisContract)) fail('geographic values');
}

function decode(sourceBytes) {
  let document;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  } catch {
    fail('source bytes');
  }
  shape(document);
  return document;
}

const sourceHashOf = new WeakMap();
const receiptOf = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));

const bit = value => value ? 1 : 0;

function insertDocument(db, document, actor, reason) {
  const wiki = document.independentLedgers.wiki;
  const gdd = document.independentLedgers.gdd;
  db.prepare(`INSERT INTO state_formation_document_document (
    document_id, source_sha256, document_sha256, schema, contract_id, scope,
    independent_acquisition_creates_state, grant_requires_prior_membership, territorial_control_is_personal_holding,
    state_registry, membership_registry, personal_holding_registry, rule_source, clause,
    storage_relationship, historical_count, historical_range, historical_approval_ref,
    centers_confer_exclusive_geographic_ownership, geographic_partition_count, geographic_ownership_determined_by_this_contract,
    actor, reason, receipt_sha256
  ) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    sourceHashOf.get(document),
    hash(JSON.stringify(document)),
    document.schema,
    document.contractId,
    document.scope,
    bit(document.independentAcquisitionCreatesState),
    bit(document.grantRequiresPriorMembership),
    bit(document.territorialControlIsPersonalHolding),
    wiki.stateRegistry,
    wiki.membershipRegistry,
    wiki.personalHoldingRegistry,
    gdd.ruleSource,
    gdd.clause,
    document.independentLedgers.storageRelationship,
    document.sourceScope.historicalPoliticalIdentities.count,
    document.sourceScope.historicalPoliticalIdentities.range,
    document.sourceScope.historicalPoliticalIdentities.approvalRef,
    bit(document.sourceScope.centersConferExclusiveGeographicOwnership),
    document.sourceScope.geographicKingdoms.partitionCount,
    bit(document.sourceScope.geographicKingdoms.ownershipDeterminedByThisContract),
    actor,
    reason,
    receiptOf(sourceHashOf.get(document), hash(JSON.stringify(document)), actor, reason),
  );
  const keyInsert = db.prepare('INSERT INTO state_formation_document_key (object_path, ordinal, key) VALUES (?,?,?)');
  for (const [objectPath, keys] of KEY_SHAPES) keys.forEach((key, ordinal) => keyInsert.run(objectPath, ordinal, key));
  const prerequisite = db.prepare(`INSERT INTO state_formation_document_prerequisite (
    ordinal, id, status, source_present, source_repository, source_path, source_pointer, source_sha256, approval_ref, reason
  ) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  document.formationPrerequisites.forEach((item, ordinal) => {
    if (ordinal < 2) {
      prerequisite.run(ordinal, item.id, item.status, 1, item.source.repository, item.source.path, item.source.pointer, item.source.sha256, item.approvalRef, null);
    } else {
      prerequisite.run(ordinal, item.id, item.status, 0, null, null, null, null, null, item.reason);
    }
  });
  const faction = db.prepare('INSERT INTO state_formation_document_faction (ordinal, name, center_region) VALUES (?,?,?)');
  document.sourceScope.currentPoliticalFactions.forEach((item, ordinal) => faction.run(ordinal, item.name, item.centerRegion));
  const identity = db.prepare(`INSERT INTO state_formation_document_identity (
    ordinal, id, name, sovereign_person_id, kind, rank, confers_whole_geographic_kingdom_ownership, approval_ref
  ) VALUES (?,?,?,?,?,?,?,?)`);
  document.sourceScope.currentIndependentPoliticalIdentities.forEach((item, ordinal) => identity.run(
    ordinal, item.id, item.name, item.sovereignPersonId, item.kind, item.rank,
    bit(item.confersWholeGeographicKingdomOwnership), item.approvalRef,
  ));
}

const COUNTS = {
  documents: 1,
  keys: KEY_SHAPES.reduce((sum, [, keys]) => sum + keys.length, 0),
  prerequisites: 3,
  factions: 3,
  identities: 1,
};
COUNTS.totalRows = Object.values(COUNTS).reduce((sum, value) => sum + value, 0);

function ordered(db, table, count) {
  const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ordinal`).all();
  if (rows.length !== count || rows.some((row, ordinal) => row.ordinal !== ordinal)) fail(`${table} coverage`);
  return rows;
}

function assemble(db) {
  const rows = db.prepare('SELECT * FROM state_formation_document_document').all();
  if (rows.length !== 1) fail('document count');
  const row = rows[0];
  if (row.document_id !== 1) fail('document id');
  if (typeof row.actor !== 'string' || !row.actor.trim() || typeof row.reason !== 'string' || !row.reason.trim()) fail('provenance');
  const keys = db.prepare('SELECT object_path, ordinal, key FROM state_formation_document_key ORDER BY object_path, ordinal').all();
  if (keys.length !== COUNTS.keys) fail('key coverage');
  const grouped = new Map();
  for (const key of keys) {
    const list = grouped.get(key.object_path) ?? [];
    if (key.ordinal !== list.length) fail('key order');
    list.push(key.key);
    grouped.set(key.object_path, list);
  }
  if (grouped.size !== KEY_SHAPES.length) fail('key shapes');
  for (const [objectPath, expected] of KEY_SHAPES) {
    if (JSON.stringify(grouped.get(objectPath)) !== JSON.stringify(expected)) fail(`key order ${objectPath || '/'}`);
  }
  const prerequisites = ordered(db, 'state_formation_document_prerequisite', 3).map(item => {
    if (item.source_present === 1) {
      if ([item.source_repository, item.source_path, item.source_pointer, item.source_sha256, item.approval_ref].some(value => typeof value !== 'string')
        || item.reason !== null) fail('confirmed prerequisite');
      return {
        id: item.id,
        status: item.status,
        source: {
          repository: item.source_repository,
          path: item.source_path,
          pointer: item.source_pointer,
          sha256: item.source_sha256,
        },
        approvalRef: item.approval_ref,
      };
    }
    if (item.source_present !== 0 || item.reason === null
      || [item.source_repository, item.source_path, item.source_pointer, item.source_sha256, item.approval_ref].some(value => value !== null)) {
      fail('unresolved prerequisite');
    }
    return { id: item.id, status: item.status, reason: item.reason };
  });
  if (![row.state_registry, row.membership_registry, row.personal_holding_registry, row.rule_source, row.clause, row.storage_relationship].every(text)) {
    fail('ledger values');
  }
  const factions = ordered(db, 'state_formation_document_faction', 3).map(item => ({ name: item.name, centerRegion: item.center_region }));
  const identities = ordered(db, 'state_formation_document_identity', 1).map(item => {
    if (![0, 1].includes(item.confers_whole_geographic_kingdom_ownership)) fail('identity ownership storage');
    return {
      id: item.id,
      name: item.name,
      sovereignPersonId: item.sovereign_person_id,
      kind: item.kind,
      rank: item.rank,
      confersWholeGeographicKingdomOwnership: item.confers_whole_geographic_kingdom_ownership === 1,
      approvalRef: item.approval_ref,
    };
  });
  if (![0, 1].includes(row.independent_acquisition_creates_state)
    || ![0, 1].includes(row.grant_requires_prior_membership)
    || ![0, 1].includes(row.territorial_control_is_personal_holding)
    || ![0, 1].includes(row.centers_confer_exclusive_geographic_ownership)
    || ![0, 1].includes(row.geographic_ownership_determined_by_this_contract)) fail('boolean storage');
  const document = {
    schema: row.schema,
    contractId: row.contract_id,
    scope: row.scope,
    independentAcquisitionCreatesState: row.independent_acquisition_creates_state === 1,
    grantRequiresPriorMembership: row.grant_requires_prior_membership === 1,
    territorialControlIsPersonalHolding: row.territorial_control_is_personal_holding === 1,
    formationPrerequisites: prerequisites,
    independentLedgers: {
      wiki: {
        stateRegistry: row.state_registry,
        membershipRegistry: row.membership_registry,
        personalHoldingRegistry: row.personal_holding_registry,
      },
      gdd: {
        ruleSource: row.rule_source,
        clause: row.clause,
      },
      storageRelationship: row.storage_relationship,
    },
    sourceScope: {
      historicalPoliticalIdentities: {
        count: row.historical_count,
        range: row.historical_range,
        approvalRef: row.historical_approval_ref,
      },
      currentPoliticalFactions: factions,
      centersConferExclusiveGeographicOwnership: row.centers_confer_exclusive_geographic_ownership === 1,
      currentIndependentPoliticalIdentities: identities,
      geographicKingdoms: {
        partitionCount: row.geographic_partition_count,
        ownershipDeterminedByThisContract: row.geographic_ownership_determined_by_this_contract === 1,
      },
    },
  };
  shape(document);
  return document;
}

function acceptSingle(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  const { schemaSql, sourceBytes, actor, reason } = options;
  const extra = Object.keys(options).filter(key => !['schemaSql', 'sourceBytes', 'actor', 'reason'].includes(key));
  if (extra.length) fail('unknown initializer fields');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('schema');
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('provenance input');
  const document = decode(sourceBytes);
  sourceHashOf.set(document, hash(sourceBytes));
  return document;
}

function acceptMany(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  const { schemaSql, sources, actor, reason } = options;
  const extra = Object.keys(options).filter(key => !['schemaSql', 'sources', 'actor', 'reason'].includes(key));
  if (extra.length) fail('unknown initializer fields');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('schema');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('provenance input');
  if (!sources || typeof sources !== 'object' || Array.isArray(sources) || Object.keys(sources).length !== 1
    || !Object.hasOwn(sources, LOGICAL_PATH)) fail('source paths');
  const source = sources[LOGICAL_PATH];
  if (!source || typeof source !== 'object' || Array.isArray(source)
    || JSON.stringify(Object.keys(source)) !== JSON.stringify(['bytes'])) fail('source entry');
  return acceptSingle({
    schemaSql, sourceBytes: source.bytes, actor, reason,
  });
}

function write(db, schemaSql, document, actor, reason) {
  if (db.isTransaction) fail('transaction');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    insertDocument(db, document, actor, reason);
    const actual = assemble(db);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail('transaction parity');
    db.exec('COMMIT');
    return { ...COUNTS };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Import exactly one bounded source. Does not infer missing fields or approve publication.
 * Single-source: { schemaSql, sourceBytes, actor, reason }.
 * Multiple-source: { schemaSql, sources, actor, reason } with sources[path] = { bytes }.
 */
export function initializeStateFormationDocument(db, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  if (Object.hasOwn(options, 'sources')) {
    const document = acceptMany(options);
    return write(db, options.schemaSql, document, options.actor, options.reason);
  }
  const document = acceptSingle(options);
  return write(db, options.schemaSql, document, options.actor, options.reason);
}

/**
 * SELECT-only reconstruction. No filesystem, archive, JSON.parse, or writes.
 * Options: optional { logicalPath }.
 */
export function readStateFormationDocument(db, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('input');
  const keys = Object.keys(options);
  if (keys.some(key => key !== 'logicalPath')) fail('reader fields');
  if (Object.hasOwn(options, 'logicalPath') && options.logicalPath !== LOGICAL_PATH) fail('logical path');
  return assemble(db);
}
