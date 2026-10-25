import { createHash } from 'node:crypto';
import { deepStrictEqual } from 'node:assert';
import { ISSUED_SHEET_SOURCE_HASH, readIssuedSheetInputs } from './issued-sheet-inputs.mjs';

export { ISSUED_SHEET_SOURCE_HASH };
export const ISSUED_SHEET_DOCUMENT_HASH = '474713971bf1f0f696b12038d1252c38f2ab6bb43fdb0fd59c86422a1d003cbf';
const fail = detail => { throw Object.assign(new Error('E_ISSUED_SHEET_DOCUMENT: ' + detail), { code: 'E_ISSUED_SHEET_DOCUMENT' }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
// Explicit source paths map to named, typed columns, never a generic value store.
const envelopeFields = [
  ["schema_name",["schema"],"string"],
  ["status",["status"],"string"],
  ["note",["note"],"string"],
  ["person_count",["count"],"number"],
  ["classification",["provenance","classification"],"string"],
  ["issued_sheet_lineage",["provenance","issuedSheetLineage"],"string"],
  ["review_status",["provenance","reviewStatus"],"string"],
  ["historical_allocation_layer",["provenance","historicalAllocationLayer"],"string"],
  ["publication_receipt",["provenance","publicationReceipt"],"string"],
  ["active_seoul_projection",["provenance","activeSeoulProjection"],"string"],
  ["values_cast_sha256",["invariants","lore/name-pools/values-cast.json"],"string"],
  ["person_registry_sha256",["invariants","lore/name-pools/person-id-registry.json"],"string"]
];
const ruleFields = [
  ["edition",["edition"],"string"],
  ["contract",["contract"],"string"],
  ["st_cost",["attribute_cost_per_level","ST"],"number"],
  ["dx_cost",["attribute_cost_per_level","DX"],"number"],
  ["iq_cost",["attribute_cost_per_level","IQ"],"number"],
  ["ht_cost",["attribute_cost_per_level","HT"],"number"],
  ["ability_base",["ability","base"],"number"],
  ["per_action_sentence",["ability","per_action_sentence"],"number"],
  ["ability_cap",["ability","cap"],"number"],
  ["per_and_will_count_as",["ability","per_and_will_count_as"],"string"],
  ["skill_cost_table",["skill_cost_table"],"string"],
  ["difficulty_e",["difficulty_base","E"],"number"],
  ["difficulty_a",["difficulty_base","A"],"number"],
  ["difficulty_h",["difficulty_base","H"],"number"],
  ["difficulty_vh",["difficulty_base","VH"],"number"],
  ["tier_a",["tiers","A"],"number"],
  ["tier_b",["tiers","B"],"number"],
  ["tier_c",["tiers","C"],"number"],
  ["tier_d",["tiers","D"],"number"],
  ["unspent_floor",["unspent","floor"],"number"],
  ["unspent_rule",["unspent","rule"],"string"],
  ["owner_k1004",["owner_tier_a","K1004"],"string"],
  ["owner_rule",["owner_tier_a","rule"],"string"],
  ["same_event_rule",["same_event","rule"],"string"],
  ["same_event_status",["same_event","status"],"string"],
  ["leader_review_status",["leader_review","status"],"string"],
  ["languages",["languages"],"string"],
  ["trait_reputation",["traits","reputation"],"string"],
  ["trait_combat_reflexes",["traits","combat_reflexes"],"string"],
  ["trait_disadvantages",["traits","disadvantages"],"string"],
  ["tl",["tl"],"string"]
];

function reconstruct(db, expectedSourceHash) {
  const single = table => {
    const rows = db.prepare('SELECT * FROM ' + table).all();
    if (rows.length !== 1 || rows[0].singleton !== 1) fail(table + ': singleton');
    return rows[0];
  };
  const e = single('issued_sheet_document_envelope'), r = single('issued_sheet_document_rules');
  const bands = db.prepare('SELECT * FROM issued_sheet_document_band ORDER BY ordinal').all();
  const reviews = db.prepare('SELECT * FROM issued_sheet_document_leader_review ORDER BY ordinal').all();
  if (bands.length !== 3 || reviews.length !== 16 || [bands,reviews].some(rows => rows.some((r,i) => r.ordinal !== i))) fail('terminal domain denominator/order');
  const candidate = { "schema": e.schema_name,
    "status": e.status,
    "provenance": { "classification": e.classification,
    "issuedSheetLineage": e.issued_sheet_lineage,
    "reviewStatus": e.review_status,
    "historicalAllocationLayer": e.historical_allocation_layer,
    "publicationReceipt": e.publication_receipt,
    "activeSeoulProjection": e.active_seoul_projection },
    "note": e.note,
    "invariants": { "lore/name-pools/values-cast.json": e.values_cast_sha256,
    "lore/name-pools/person-id-registry.json": e.person_registry_sha256 },
    "rules": { "edition": r.edition,
    "contract": r.contract,
    "attribute_cost_per_level": { "ST": r.st_cost,
    "DX": r.dx_cost,
    "IQ": r.iq_cost,
    "HT": r.ht_cost },
    "ability": { "base": r.ability_base,
    "per_action_sentence": r.per_action_sentence,
    "cap": r.ability_cap,
    "per_and_will_count_as": r.per_and_will_count_as },
    "skill_cost_table": r.skill_cost_table,
    "difficulty_base": { "E": r.difficulty_e,
    "A": r.difficulty_a,
    "H": r.difficulty_h,
    "VH": r.difficulty_vh },
    "tiers": { "A": r.tier_a,
    "B": r.tier_b,
    "C": r.tier_c,
    "D": r.tier_d },
    "bands": bands.map(b => ({ name: b.name, min: b.min, max: b.max })),
    "unspent": { "floor": r.unspent_floor,
    "rule": r.unspent_rule },
    "owner_tier_a": { "K1004": r.owner_k1004,
    "rule": r.owner_rule },
    "same_event": { "rule": r.same_event_rule,
    "status": r.same_event_status },
    "leader_review": { "status": r.leader_review_status,
    "items": Object.fromEntries(reviews.map(r => [r.person_id, { question: r.question, choice: r.choice }])) },
    "languages": r.languages,
    "traits": { "reputation": r.trait_reputation,
    "combat_reflexes": r.trait_combat_reflexes,
    "disadvantages": r.trait_disadvantages },
    "tl": r.tl },
    "count": e.person_count,
    "people": readIssuedSheetInputs(db, { expectedSourceHash }).people };
  const groups = new Map();
  for (const row of db.prepare('SELECT * FROM issued_sheet_document_key ORDER BY object_path,ordinal').all()) {
    if (!groups.has(row.object_path)) groups.set(row.object_path, []);
    groups.get(row.object_path).push(row);
  }
  const order = (value, path) => {
    if (path === '/people') return value;
    if (Array.isArray(value)) return value.map((v,i) => order(v,path+'/'+i));
    if (value === null || typeof value !== 'object') return value;
    const keys = groups.get(path);
    if (!keys || keys.length !== Object.keys(value).length) fail('object coverage: '+path);
    groups.delete(path);
    return Object.fromEntries(keys.map((row,i) => {
      if (row.ordinal !== i || !Object.hasOwn(value,row.key)) fail('object key/order: '+path);
      return [row.key,order(value[row.key],path+'/'+row.key)];
    }));
  };
  const result = order(candidate,'');
  if (groups.size || result.count !== result.people.length) fail('unconsumed metadata/count');
  return result;
}

/** SELECT-only typed reconstruction. No filesystem, archives or JSON decoding. */
export function readIssuedSheetDocument(db, { expectedSourceHash = ISSUED_SHEET_SOURCE_HASH } = {}) {
  try {
    const receipts = db.prepare('SELECT * FROM issued_sheet_document_import').all();
    const receipt = receipts[0];
    if (expectedSourceHash !== ISSUED_SHEET_SOURCE_HASH || receipts.length !== 1 || receipt.singleton !== 1 || receipt.source_sha256 !== expectedSourceHash || receipt.document_sha256 !== ISSUED_SHEET_DOCUMENT_HASH || !receipt.actor?.trim() || !receipt.reason?.trim()) fail('source pin/receipt');
    const document = reconstruct(db,expectedSourceHash);
    if (hash(JSON.stringify(document)) !== ISSUED_SHEET_DOCUMENT_HASH) fail('full document digest');
    return document;
  } catch (error) {
    if (error.code === 'E_ISSUED_SHEET_DOCUMENT') throw error;
    fail(error.message);
  }
}

/** Explicit one-shot supplement on an authority copy with initialized people.
 * schemaSql is the accompanying reviewed SQL, supplied only at initialization.
 * Typed rows, audit receipt and whole-source parity share a single transaction.
 */
export function initializeIssuedSheetDocument(db, { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (!(sourceBytes instanceof Uint8Array) || expectedSourceHash !== ISSUED_SHEET_SOURCE_HASH || hash(sourceBytes) !== expectedSourceHash) fail('source bytes/hash');
  if (![actor,reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('explicit schema SQL required');
  if (db.isTransaction) fail('active transaction');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  if (hash(JSON.stringify(document)) !== ISSUED_SHEET_DOCUMENT_HASH) fail('serialized source pin');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    const put = (table,fields,value) => {
      const values = fields.map(([column,path,type]) => {
        const v = path.reduce((o,k) => o?.[k],value);
        if (typeof v !== type) fail('typed field: '+column);
        return v;
      });
      db.prepare('INSERT INTO '+table+' (singleton,'+fields.map(([c]) => c).join(',')+') VALUES (1,'+values.map(() => '?').join(',')+')').run(...values);
    };
    put('issued_sheet_document_envelope',envelopeFields,document);
    put('issued_sheet_document_rules',ruleFields,document.rules);
    const band = db.prepare('INSERT INTO issued_sheet_document_band VALUES (?,?,?,?)');
    document.rules.bands.forEach((b,i) => band.run(i,b.name,b.min,b.max));
    const review = db.prepare('INSERT INTO issued_sheet_document_leader_review VALUES (?,?,?,?)');
    Object.entries(document.rules.leader_review.items).forEach(([id,r],i) => review.run(i,id,r.question,r.choice));
    const key = db.prepare('INSERT INTO issued_sheet_document_key VALUES (?,?,?)');
    const walk = (value,path) => {
      if (path === '/people' || value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((v,i) => walk(v,path+'/'+i)); return; }
      Object.entries(value).forEach(([k,v],i) => { key.run(path,i,k); walk(v,path+'/'+k); });
    };
    walk(document,'');
    db.prepare('INSERT INTO issued_sheet_document_import VALUES (1,?,?,?,?)').run(expectedSourceHash,ISSUED_SHEET_DOCUMENT_HASH,actor,reason);
    const result = readIssuedSheetDocument(db,{expectedSourceHash});
    deepStrictEqual(result,document);
    if (JSON.stringify(result) !== JSON.stringify(document)) fail('transaction full source parity');
    db.exec('COMMIT');
    return { sourceHash: expectedSourceHash, documentHash: ISSUED_SHEET_DOCUMENT_HASH, profileCount: result.people.length };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
