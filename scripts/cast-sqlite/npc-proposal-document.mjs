import { createHash } from 'node:crypto';

export const NPC_PROPOSAL_SOURCE_HASH = 'f76688cbb09d8de216be53102e1f6d1b2464e8421c0e6f707161cb94f649cc7d';
export const NPC_PROPOSAL_DOCUMENT_HASH = '0e26a51820ebd747c74b617715f26127f49111e96dd0dc1c9b2a9668b0a4fc46';
const ROW_DIGEST = '48e348560bc1e5d6f1bc38a5c0b887da6071ab216482bb06f0c60987d66c65d9';

const ROOT_KEYS = ['schema', 'status', 'note', 'rules_owner', 'current_decisions', 'generation_rules', 'npc_fields', 'occupation_pools', 'martial_assignment', 'unit_eligibility_check', 'wandering_spawn', 'settlement_types', 'api_endpoint'];
const DECISION_KEYS = ['population', 'livelihood', 'training', 'parameters'];
const GENERATION_KEYS = ['trigger', 'proportion', 'min_per_settlement', 'max_per_settlement', 'seed'];
const FIELD_KEYS = ['name', 'gender', 'age', 'state', 'settlement', 'occupation', 'attributes', 'cp', 'martial', 'unit_eligibility'];
const POOL_KEYS = ['water_settlement', 'transport_settlement', 'religious_settlement', 'military_settlement', 'medical_settlement', 'trade_settlement', 'general_settlement'];
const MARTIAL_KEYS = ['probability', 'by_occupation', 'level'];
const OCCUPATION_KEYS = ['경비 당직', '호송 인원', '정수 당직', '교육 담당', '무역', '사냥'];
const ELIGIBILITY_KEYS = ['description', 'check_fields', 'match_rule'];
const CHECK_FIELDS = ['occupation', 'martial', 'attributes'];
const WANDERING_KEYS = ['description', 'probability', 'camp', 'reasons'];
const REASON_LABELS = ['세력에서 이탈', '파면', '가족 사망 후 방랑', '쫓겨남'];
const SETTLEMENT_KEYS = ['거점', '역_영지', '초소_영지', '야영지'];
const SETTLEMENT_FIELD_KEYS = ['pop_range', 'npc_multiplier', 'occupations'];
const ENDPOINT_KEYS = ['generate', 'params', 'response'];
const PARAM_KEYS = ['seed', 'count'];
const RESPONSE_KEYS = ['npcs', 'unit_eligibility'];
const POOL_LENGTHS = { water_settlement: 4, transport_settlement: 4, religious_settlement: 4, military_settlement: 4, medical_settlement: 4, trade_settlement: 4, general_settlement: 6 };
const STYLE_LENGTHS = { '경비 당직': 3, '호송 인원': 2, '정수 당직': 1, '교육 담당': 2, '무역': 1, '사냥': 1 };
const NUMBER_TEXT = {
  'generation_rules.min_per_settlement': '3',
  'generation_rules.max_per_settlement': '50',
  'wandering_spawn.probability': '0.15',
  'settlement_types.거점.npc_multiplier': '1.0',
  'settlement_types.역_영지.npc_multiplier': '0.8',
  'settlement_types.초소_영지.npc_multiplier': '0.5',
  'settlement_types.야영지.npc_multiplier': '0.3',
};
const COUNTS = {
  npc_proposal_document_import: 1,
  npc_proposal_document_root: 1,
  npc_proposal_document_decision: 1,
  npc_proposal_document_generation: 1,
  npc_proposal_document_field: 1,
  npc_proposal_document_pool: 7,
  npc_proposal_document_pool_item: 30,
  npc_proposal_document_martial: 1,
  npc_proposal_document_occupation: 6,
  npc_proposal_document_style: 10,
  npc_proposal_document_eligibility: 1,
  npc_proposal_document_check_field: 3,
  npc_proposal_document_wandering: 1,
  npc_proposal_document_reason: 4,
  npc_proposal_document_settlement: 4,
  npc_proposal_document_endpoint: 1,
  npc_proposal_document_param: 2,
  npc_proposal_document_response: 2,
  npc_proposal_document_key: 78,
};

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_NPC_PROPOSAL_DOCUMENT: ${detail}`), { code: 'E_NPC_PROPOSAL_DOCUMENT' }); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length > 0;
const integer = value => Number.isSafeInteger(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const receiptOf = (actor, reason) => hash(JSON.stringify([NPC_PROPOSAL_SOURCE_HASH, NPC_PROPOSAL_DOCUMENT_HASH, actor, reason]));

function keys(value, expected, label) {
  if (!plain(value) || !same(Object.keys(value), expected)) fail(`${label}: unknown, missing, or unordered fields`);
}

function stringList(value, expected, label) {
  if (!Array.isArray(value) || value.length !== expected.length || value.some((item, index) => item !== expected[index] || !text(item))) fail(label);
}

function literalAt(sourceBytes, path) {
  const token = NUMBER_TEXT[path];
  const property = path.slice(path.lastIndexOf('.') + 1);
  const pattern = new RegExp(`"${property}"\\s*:\\s*(${token.replace('.', '\\.')})(?![0-9.])`, 'g');
  const text = Buffer.from(sourceBytes).toString('utf8');
  const matches = [...text.matchAll(pattern)];
  if (matches.length !== 1 || matches[0][1] !== token) fail(`${path} literal`);
  return token;
}

function assertAuthoredNumbers(sourceBytes, document) {
  for (const [path, token] of Object.entries(NUMBER_TEXT)) {
    const value = path.split('.').reduce((item, key) => item[key], document);
    if (!finite(value) || literalAt(sourceBytes, path) !== token) fail(`${path} precision`);
    if (value !== Number(token) || (!token.includes('.') && !integer(value))) fail(`${path} value`);
  }
}

function shape(document) {
  keys(document, ROOT_KEYS, 'document');
  if ([document.schema, document.status, document.note, document.rules_owner].some(value => !text(value))) fail('document scalars');
  if (document.schema !== 'settlement-npc-generator/1' || document.status !== 'legacy-proposal') fail('document status');
  keys(document.current_decisions, DECISION_KEYS, 'decisions');
  if (DECISION_KEYS.some(key => !text(document.current_decisions[key]))) fail('decision text');
  keys(document.generation_rules, GENERATION_KEYS, 'generation');
  if ([document.generation_rules.trigger, document.generation_rules.proportion, document.generation_rules.seed].some(value => !text(value))) fail('generation text');
  if (!integer(document.generation_rules.min_per_settlement) || !integer(document.generation_rules.max_per_settlement)) fail('generation integers');
  keys(document.npc_fields, FIELD_KEYS, 'fields');
  if (FIELD_KEYS.some(key => !text(document.npc_fields[key]))) fail('field text');
  keys(document.occupation_pools, POOL_KEYS, 'pools');
  for (const key of POOL_KEYS) {
    const items = document.occupation_pools[key];
    if (!Array.isArray(items) || items.length !== POOL_LENGTHS[key] || items.some(item => !text(item))) fail(`${key} pool`);
  }
  keys(document.martial_assignment, MARTIAL_KEYS, 'martial');
  if (!text(document.martial_assignment.probability) || !text(document.martial_assignment.level)) fail('martial text');
  keys(document.martial_assignment.by_occupation, OCCUPATION_KEYS, 'occupations');
  for (const key of OCCUPATION_KEYS) {
    const items = document.martial_assignment.by_occupation[key];
    if (!Array.isArray(items) || items.length !== STYLE_LENGTHS[key] || items.some(item => !text(item))) fail(`${key} styles`);
  }
  keys(document.unit_eligibility_check, ELIGIBILITY_KEYS, 'eligibility');
  if (!text(document.unit_eligibility_check.description) || !text(document.unit_eligibility_check.match_rule)) fail('eligibility text');
  stringList(document.unit_eligibility_check.check_fields, CHECK_FIELDS, 'check fields');
  keys(document.wandering_spawn, WANDERING_KEYS, 'wandering');
  if (!text(document.wandering_spawn.description) || !text(document.wandering_spawn.camp)) fail('wandering text');
  if (!finite(document.wandering_spawn.probability)) fail('wandering probability');
  stringList(document.wandering_spawn.reasons, REASON_LABELS, 'reasons');
  keys(document.settlement_types, SETTLEMENT_KEYS, 'settlements');
  for (const key of SETTLEMENT_KEYS) {
    const settlement = document.settlement_types[key];
    keys(settlement, SETTLEMENT_FIELD_KEYS, key);
    if (!text(settlement.pop_range) || !text(settlement.occupations)) fail(`${key} text`);
    if (!finite(settlement.npc_multiplier)) fail(`${key} multiplier`);
  }
  keys(document.api_endpoint, ENDPOINT_KEYS, 'endpoint');
  if (!text(document.api_endpoint.generate)) fail('endpoint text');
  keys(document.api_endpoint.params, PARAM_KEYS, 'params');
  keys(document.api_endpoint.response, RESPONSE_KEYS, 'response');
  if (PARAM_KEYS.some(key => !text(document.api_endpoint.params[key]))) fail('param text');
  if (RESPONSE_KEYS.some(key => !text(document.api_endpoint.response[key]))) fail('response text');
}

function insertKeys(db, objectPath, expected) {
  const insert = db.prepare('INSERT INTO npc_proposal_document_key (object_path, ordinal, key) VALUES (?, ?, ?)');
  expected.forEach((key, ordinal) => insert.run(objectPath, ordinal, key));
}

function insertList(db, sql, parent, items) {
  const insert = db.prepare(sql);
  items.forEach((label, ordinal) => insert.run(...parent, ordinal, label));
}

/** Import only the exact original proposal. Normalization grants no approval and adds no people or rules. */
export function initializeNpcProposalDocument(db, { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (!db || db.isTransaction || typeof db.exec !== 'function' || typeof db.prepare !== 'function') fail('input');
  if (![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())) fail('input');
  if (!(sourceBytes instanceof Uint8Array) || expectedSourceHash !== NPC_PROPOSAL_SOURCE_HASH) fail('input');
  let document;
  try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes)); }
  catch (error) { fail(`source encoding: ${error.message}`); }
  shape(document);
  assertAuthoredNumbers(sourceBytes, document);
  if (hash(sourceBytes) !== NPC_PROPOSAL_SOURCE_HASH || hash(JSON.stringify(document)) !== NPC_PROPOSAL_DOCUMENT_HASH) fail('source hash');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO npc_proposal_document_import (document_id, source_sha256, document_sha256, row_sha256, actor, reason, receipt_sha256) VALUES (1, ?, ?, ?, ?, ?, ?)')
      .run(NPC_PROPOSAL_SOURCE_HASH, NPC_PROPOSAL_DOCUMENT_HASH, ROW_DIGEST, actor, reason, receiptOf(actor, reason));
    db.prepare('INSERT INTO npc_proposal_document_root (document_id, schema, status, note, rules_owner) VALUES (1, ?, ?, ?, ?)')
      .run(document.schema, document.status, document.note, document.rules_owner);
    db.prepare(`INSERT INTO npc_proposal_document_decision (document_id, ${DECISION_KEYS.join(', ')}) VALUES (1, ${DECISION_KEYS.map(() => '?').join(', ')})`)
      .run(...DECISION_KEYS.map(key => document.current_decisions[key]));
    const generation = document.generation_rules;
    db.prepare('INSERT INTO npc_proposal_document_generation (document_id, trigger, proportion, min_per_settlement, min_per_settlement_text, max_per_settlement, max_per_settlement_text, seed) VALUES (1, ?, ?, ?, ?, ?, ?, ?)')
      .run(generation.trigger, generation.proportion, generation.min_per_settlement, NUMBER_TEXT['generation_rules.min_per_settlement'], generation.max_per_settlement, NUMBER_TEXT['generation_rules.max_per_settlement'], generation.seed);
    db.prepare(`INSERT INTO npc_proposal_document_field (document_id, ${FIELD_KEYS.join(', ')}) VALUES (1, ${FIELD_KEYS.map(() => '?').join(', ')})`)
      .run(...FIELD_KEYS.map(key => document.npc_fields[key]));
    const insertPool = db.prepare('INSERT INTO npc_proposal_document_pool (pool_key, ordinal) VALUES (?, ?)');
    POOL_KEYS.forEach((key, ordinal) => insertPool.run(key, ordinal));
    for (const key of POOL_KEYS) {
      insertList(db, 'INSERT INTO npc_proposal_document_pool_item (pool_key, ordinal, label) VALUES (?, ?, ?)', [key], document.occupation_pools[key]);
    }
    db.prepare('INSERT INTO npc_proposal_document_martial (document_id, probability, level) VALUES (1, ?, ?)')
      .run(document.martial_assignment.probability, document.martial_assignment.level);
    const insertOccupation = db.prepare('INSERT INTO npc_proposal_document_occupation (occupation_key, ordinal) VALUES (?, ?)');
    OCCUPATION_KEYS.forEach((key, ordinal) => insertOccupation.run(key, ordinal));
    for (const key of OCCUPATION_KEYS) {
      insertList(db, 'INSERT INTO npc_proposal_document_style (occupation_key, ordinal, label) VALUES (?, ?, ?)', [key], document.martial_assignment.by_occupation[key]);
    }
    db.prepare('INSERT INTO npc_proposal_document_eligibility (document_id, description, match_rule) VALUES (1, ?, ?)')
      .run(document.unit_eligibility_check.description, document.unit_eligibility_check.match_rule);
    insertList(db, 'INSERT INTO npc_proposal_document_check_field (ordinal, field_name) VALUES (?, ?)', [], document.unit_eligibility_check.check_fields);
    const wandering = document.wandering_spawn;
    db.prepare('INSERT INTO npc_proposal_document_wandering (document_id, description, probability, probability_text, camp) VALUES (1, ?, ?, ?, ?)')
      .run(wandering.description, wandering.probability, NUMBER_TEXT['wandering_spawn.probability'], wandering.camp);
    insertList(db, 'INSERT INTO npc_proposal_document_reason (ordinal, label) VALUES (?, ?)', [], wandering.reasons);
    const insertSettlement = db.prepare('INSERT INTO npc_proposal_document_settlement (settlement_key, ordinal, pop_range, npc_multiplier, npc_multiplier_text, occupations) VALUES (?, ?, ?, ?, ?, ?)');
    SETTLEMENT_KEYS.forEach((key, ordinal) => {
      const settlement = document.settlement_types[key];
      insertSettlement.run(key, ordinal, settlement.pop_range, settlement.npc_multiplier, NUMBER_TEXT[`settlement_types.${key}.npc_multiplier`], settlement.occupations);
    });
    db.prepare('INSERT INTO npc_proposal_document_endpoint (document_id, generate) VALUES (1, ?)')
      .run(document.api_endpoint.generate);
    const insertParam = db.prepare('INSERT INTO npc_proposal_document_param (param_key, ordinal, body) VALUES (?, ?, ?)');
    PARAM_KEYS.forEach((key, ordinal) => insertParam.run(key, ordinal, document.api_endpoint.params[key]));
    const insertResponse = db.prepare('INSERT INTO npc_proposal_document_response (response_key, ordinal, body) VALUES (?, ?, ?)');
    RESPONSE_KEYS.forEach((key, ordinal) => insertResponse.run(key, ordinal, document.api_endpoint.response[key]));
    insertKeys(db, 'document', ROOT_KEYS);
    insertKeys(db, 'current_decisions', DECISION_KEYS);
    insertKeys(db, 'generation_rules', GENERATION_KEYS);
    insertKeys(db, 'npc_fields', FIELD_KEYS);
    insertKeys(db, 'occupation_pools', POOL_KEYS);
    insertKeys(db, 'martial_assignment', MARTIAL_KEYS);
    insertKeys(db, 'by_occupation', OCCUPATION_KEYS);
    insertKeys(db, 'unit_eligibility_check', ELIGIBILITY_KEYS);
    insertKeys(db, 'wandering_spawn', WANDERING_KEYS);
    insertKeys(db, 'settlement_types', SETTLEMENT_KEYS);
    for (const key of SETTLEMENT_KEYS) insertKeys(db, `settlement/${key}`, SETTLEMENT_FIELD_KEYS);
    insertKeys(db, 'api_endpoint', ENDPOINT_KEYS);
    insertKeys(db, 'params', PARAM_KEYS);
    insertKeys(db, 'response', RESPONSE_KEYS);
    const read = readNpcProposalDocument(db, { expectedSourceHash });
    if (!same(read, document)) fail('transaction parity');
    db.exec('COMMIT');
    return {
      documents: 1,
      decisions: 1,
      fields: 1,
      pools: POOL_KEYS.length,
      poolItems: Object.values(POOL_LENGTHS).reduce((sum, count) => sum + count, 0),
      occupations: OCCUPATION_KEYS.length,
      styles: Object.values(STYLE_LENGTHS).reduce((sum, count) => sum + count, 0),
      settlements: SETTLEMENT_KEYS.length,
      keys: COUNTS.npc_proposal_document_key,
      totalRows: Object.values(COUNTS).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function one(rows, label) {
  if (rows.length !== 1) fail(`${label} count`);
  return rows[0];
}

function orderedMap(rows, keyName, valueName, expected, label) {
  if (rows.length !== expected.length) fail(`${label} count`);
  const seen = [];
  for (const row of rows) {
    if (!integer(row.ordinal) || row.ordinal !== seen.length || row[keyName] !== expected[row.ordinal]) fail(`${label} order`);
    if (!text(row[valueName])) fail(`${label} text`);
    seen.push(row[valueName]);
  }
  return Object.fromEntries(expected.map((key, index) => [key, seen[index]]));
}

function namedObject(row, expected, label) {
  if (!row || row.document_id !== 1) fail(`${label} parent`);
  const value = {};
  for (const key of expected) {
    if (!text(row[key])) fail(`${label} text`);
    value[key] = row[key];
  }
  return value;
}

function orderedLists(rows, parentName, expectedParents, label) {
  const grouped = new Map();
  for (const row of rows) {
    if (!expectedParents.includes(row[parentName]) || !integer(row.ordinal) || !text(row.label)) fail(`${label} row`);
    const list = grouped.get(row[parentName]) ?? [];
    if (row.ordinal !== list.length) fail(`${label} order`);
    list.push(row.label);
    grouped.set(row[parentName], list);
  }
  if (grouped.size !== expectedParents.length) fail(`${label} coverage`);
  return Object.fromEntries(expectedParents.map(key => [key, grouped.get(key)]));
}

function keyMap(rows) {
  if (rows.length !== COUNTS.npc_proposal_document_key) fail(`key count ${rows.length}`);
  const map = new Map();
  for (const row of rows) {
    if (!text(row.object_path) || !text(row.key) || !integer(row.ordinal)) fail('key type');
    const list = map.get(row.object_path) ?? [];
    if (row.ordinal !== list.length || list.includes(row.key)) fail('key order');
    list.push(row.key);
    map.set(row.object_path, list);
  }
  return map;
}

function requireKeys(map, objectPath, expected) {
  if (!same(map.get(objectPath), expected)) fail(`${objectPath} keys`);
}

function numberFrom(value, spelling, path) {
  if (typeof spelling !== 'string' || spelling !== NUMBER_TEXT[path] || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(spelling)) fail(`${path} spelling`);
  const [whole, fraction = ''] = spelling.split('.');
  const restored = Number(whole) + (fraction ? Number(fraction) / 10 ** fraction.length : 0);
  if (!finite(value) || value !== restored || (!fraction && !integer(value))) fail(`${path} precision`);
  return restored;
}

function rowDigest(parts) {
  return hash(JSON.stringify(parts));
}

/** SELECT-only reconstruction. No source I/O, archive access, or JSON parsing. */
export function readNpcProposalDocument(db, { expectedSourceHash } = {}) {
  try {
    if (expectedSourceHash !== NPC_PROPOSAL_SOURCE_HASH) fail('expected hash');
    const imports = db.prepare('SELECT document_id, source_sha256, document_sha256, row_sha256, actor, reason, receipt_sha256 FROM npc_proposal_document_import').all();
    const receipt = one(imports, 'import');
    if (receipt.document_id !== 1 || receipt.source_sha256 !== expectedSourceHash || receipt.document_sha256 !== NPC_PROPOSAL_DOCUMENT_HASH
      || !text(receipt.actor) || !receipt.actor.trim() || !text(receipt.reason) || !receipt.reason.trim()
      || receipt.receipt_sha256 !== receiptOf(receipt.actor, receipt.reason) || receipt.row_sha256.length !== 64) fail('provenance');
    const root = one(db.prepare('SELECT document_id, schema, status, note, rules_owner FROM npc_proposal_document_root').all(), 'root');
    if (root.document_id !== 1) fail('root parent');
    const decision = one(db.prepare(`SELECT document_id, ${DECISION_KEYS.join(', ')} FROM npc_proposal_document_decision`).all(), 'decision');
    const generation = one(db.prepare('SELECT document_id, trigger, proportion, min_per_settlement, min_per_settlement_text, max_per_settlement, max_per_settlement_text, seed FROM npc_proposal_document_generation').all(), 'generation');
    const field = one(db.prepare(`SELECT document_id, ${FIELD_KEYS.join(', ')} FROM npc_proposal_document_field`).all(), 'field');
    const pools = db.prepare('SELECT pool_key, ordinal FROM npc_proposal_document_pool ORDER BY ordinal').all();
    const poolItems = db.prepare('SELECT pool_key, ordinal, label FROM npc_proposal_document_pool_item ORDER BY pool_key, ordinal').all();
    const martial = one(db.prepare('SELECT document_id, probability, level FROM npc_proposal_document_martial').all(), 'martial');
    const occupations = db.prepare('SELECT occupation_key, ordinal FROM npc_proposal_document_occupation ORDER BY ordinal').all();
    const styles = db.prepare('SELECT occupation_key, ordinal, label FROM npc_proposal_document_style ORDER BY occupation_key, ordinal').all();
    const eligibility = one(db.prepare('SELECT document_id, description, match_rule FROM npc_proposal_document_eligibility').all(), 'eligibility');
    const checkFields = db.prepare('SELECT ordinal, field_name FROM npc_proposal_document_check_field ORDER BY ordinal').all();
    const wandering = one(db.prepare('SELECT document_id, description, probability, probability_text, camp FROM npc_proposal_document_wandering').all(), 'wandering');
    const reasons = db.prepare('SELECT ordinal, label FROM npc_proposal_document_reason ORDER BY ordinal').all();
    const settlements = db.prepare('SELECT settlement_key, ordinal, pop_range, npc_multiplier, npc_multiplier_text, occupations FROM npc_proposal_document_settlement ORDER BY ordinal').all();
    const endpoint = one(db.prepare('SELECT document_id, generate FROM npc_proposal_document_endpoint').all(), 'endpoint');
    const params = db.prepare('SELECT param_key, ordinal, body FROM npc_proposal_document_param ORDER BY ordinal').all();
    const responses = db.prepare('SELECT response_key, ordinal, body FROM npc_proposal_document_response ORDER BY ordinal').all();
    const keyRows = db.prepare('SELECT object_path, ordinal, key FROM npc_proposal_document_key ORDER BY object_path, ordinal').all();
    if ([decision, generation, field, martial, eligibility, wandering, endpoint].some(row => row.document_id !== 1)) fail('child parent');
    const keysByPath = keyMap(keyRows);
    requireKeys(keysByPath, 'document', ROOT_KEYS);
    requireKeys(keysByPath, 'current_decisions', DECISION_KEYS);
    requireKeys(keysByPath, 'generation_rules', GENERATION_KEYS);
    requireKeys(keysByPath, 'npc_fields', FIELD_KEYS);
    requireKeys(keysByPath, 'occupation_pools', POOL_KEYS);
    requireKeys(keysByPath, 'martial_assignment', MARTIAL_KEYS);
    requireKeys(keysByPath, 'by_occupation', OCCUPATION_KEYS);
    requireKeys(keysByPath, 'unit_eligibility_check', ELIGIBILITY_KEYS);
    requireKeys(keysByPath, 'wandering_spawn', WANDERING_KEYS);
    requireKeys(keysByPath, 'settlement_types', SETTLEMENT_KEYS);
    requireKeys(keysByPath, 'api_endpoint', ENDPOINT_KEYS);
    requireKeys(keysByPath, 'params', PARAM_KEYS);
    requireKeys(keysByPath, 'response', RESPONSE_KEYS);
    for (const key of SETTLEMENT_KEYS) requireKeys(keysByPath, `settlement/${key}`, SETTLEMENT_FIELD_KEYS);
    const allowed = new Set(['document', 'current_decisions', 'generation_rules', 'npc_fields', 'occupation_pools', 'martial_assignment', 'by_occupation', 'unit_eligibility_check', 'wandering_spawn', 'settlement_types', 'api_endpoint', 'params', 'response', ...SETTLEMENT_KEYS.map(key => `settlement/${key}`)]);
    if (keysByPath.size !== allowed.size || [...keysByPath.keys()].some(path => !allowed.has(path))) fail('key paths');
    if (pools.length !== POOL_KEYS.length || pools.some((row, index) => row.ordinal !== index || row.pool_key !== POOL_KEYS[index])) fail('pool order');
    if (occupations.length !== OCCUPATION_KEYS.length || occupations.some((row, index) => row.ordinal !== index || row.occupation_key !== OCCUPATION_KEYS[index])) fail('occupation order');
    if (checkFields.length !== CHECK_FIELDS.length || checkFields.some((row, index) => row.ordinal !== index || row.field_name !== CHECK_FIELDS[index] || !text(row.field_name))) fail('check field order');
    if (reasons.length !== REASON_LABELS.length || reasons.some((row, index) => row.ordinal !== index || row.label !== REASON_LABELS[index] || !text(row.label))) fail('reason order');
    if (settlements.length !== SETTLEMENT_KEYS.length || settlements.some((row, index) => row.ordinal !== index || row.settlement_key !== SETTLEMENT_KEYS[index])) fail('settlement order');
    const document = {
      schema: root.schema,
      status: root.status,
      note: root.note,
      rules_owner: root.rules_owner,
      current_decisions: namedObject(decision, keysByPath.get('current_decisions'), 'decision'),
      generation_rules: {
        trigger: generation.trigger,
        proportion: generation.proportion,
        min_per_settlement: numberFrom(generation.min_per_settlement, generation.min_per_settlement_text, 'generation_rules.min_per_settlement'),
        max_per_settlement: numberFrom(generation.max_per_settlement, generation.max_per_settlement_text, 'generation_rules.max_per_settlement'),
        seed: generation.seed,
      },
      npc_fields: namedObject(field, keysByPath.get('npc_fields'), 'field'),
      occupation_pools: orderedLists(poolItems, 'pool_key', POOL_KEYS, 'pool item'),
      martial_assignment: {
        probability: martial.probability,
        by_occupation: orderedLists(styles, 'occupation_key', OCCUPATION_KEYS, 'style'),
        level: martial.level,
      },
      unit_eligibility_check: {
        description: eligibility.description,
        check_fields: checkFields.map(row => row.field_name),
        match_rule: eligibility.match_rule,
      },
      wandering_spawn: {
        description: wandering.description,
        probability: numberFrom(wandering.probability, wandering.probability_text, 'wandering_spawn.probability'),
        camp: wandering.camp,
        reasons: reasons.map(row => row.label),
      },
      settlement_types: Object.fromEntries(settlements.map(row => [row.settlement_key, {
        pop_range: row.pop_range,
        npc_multiplier: numberFrom(row.npc_multiplier, row.npc_multiplier_text, `settlement_types.${row.settlement_key}.npc_multiplier`),
        occupations: row.occupations,
      }])),
      api_endpoint: {
        generate: endpoint.generate,
        params: orderedMap(params, 'param_key', 'body', PARAM_KEYS, 'param'),
        response: orderedMap(responses, 'response_key', 'body', RESPONSE_KEYS, 'response'),
      },
    };
    for (const key of POOL_KEYS) if (document.occupation_pools[key].length !== POOL_LENGTHS[key]) fail(`${key} length`);
    for (const key of OCCUPATION_KEYS) if (document.martial_assignment.by_occupation[key].length !== STYLE_LENGTHS[key]) fail(`${key} length`);
    const consumed = {
      npc_proposal_document_import: imports.length,
      npc_proposal_document_root: 1,
      npc_proposal_document_decision: 1,
      npc_proposal_document_generation: 1,
      npc_proposal_document_field: 1,
      npc_proposal_document_pool: pools.length,
      npc_proposal_document_pool_item: poolItems.length,
      npc_proposal_document_martial: 1,
      npc_proposal_document_occupation: occupations.length,
      npc_proposal_document_style: styles.length,
      npc_proposal_document_eligibility: 1,
      npc_proposal_document_check_field: checkFields.length,
      npc_proposal_document_wandering: 1,
      npc_proposal_document_reason: reasons.length,
      npc_proposal_document_settlement: settlements.length,
      npc_proposal_document_endpoint: 1,
      npc_proposal_document_param: params.length,
      npc_proposal_document_response: responses.length,
      npc_proposal_document_key: keyRows.length,
    };
    if (!same(consumed, COUNTS)) fail('consumed row counts');
    shape(document);
    if (hash(JSON.stringify(document)) !== NPC_PROPOSAL_DOCUMENT_HASH) fail('document hash');
    const digest = rowDigest({
      root: (({ document_id, ...row }) => row)(root),
      decision: (({ document_id, ...row }) => row)(decision),
      generation: (({ document_id, ...row }) => row)(generation),
      field: (({ document_id, ...row }) => row)(field), pools, poolItems,
      martial: (({ document_id, ...row }) => row)(martial), occupations, styles,
      eligibility: (({ document_id, ...row }) => row)(eligibility), checkFields,
      wandering: (({ document_id, ...row }) => row)(wandering), reasons, settlements,
      endpoint: (({ document_id, ...row }) => row)(endpoint), params, responses, keyRows,
    });
    if (digest !== ROW_DIGEST || receipt.row_sha256 !== ROW_DIGEST) fail('row digest');
    return document;
  } catch (error) {
    if (error.code === 'E_NPC_PROPOSAL_DOCUMENT') throw error;
    fail(error.message);
  }
}
