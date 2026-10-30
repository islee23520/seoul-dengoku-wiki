import { createHash } from 'node:crypto';

const BASELINE_SHA256 = 'cb2339a544090a471a876642abe2b09166bd3195860db33f672b6a2443b73623';
const SOURCE_SEAL = '78c81312209d7d89aa5c7a3c34793f5c8fdc78e161d3221846d5800af71eb780';
const PINS = {
 "ce173686bcba220cd2a7dedfb5c78b941bf3c151": {
  "ledgerSha256": "bd6cf5638033a85c8e5970518e3f89db5a46a28c1b95c762bc083858e2275331",
  "documentCanonicalSha256": "f4108db92f22db31536573316b0c347c0e78885bfa3a4a0c449d3ebc1f651097",
  "peopleCanonicalSha256": "f72511466091ab45517987bf4fb2f2bdefd937ce752c951157a45a88e745d7fa",
  "numericCanonicalSha256": "a857d655c0872a72fd4ea3f71e6b4069e5f3539fd590f16a91f371b542aea5ef",
  "personCount": 1022,
  "numericFieldCount": 30375,
  "serializedSha256": "4901e087c188df5731596f6ef436c2cdc62030da8ddab76092cd502609580ec1"
 },
 "5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4": {
  "ledgerSha256": "3e5afa93853160f4549fcda8b40f2e5c4701fada97a5b8dc9c685ee125c84b97",
  "documentCanonicalSha256": "41ce7cf3fb28a4139c111fbfcdb40701a5eb47c6cd6b3e85d67d98ee202745fe",
  "peopleCanonicalSha256": "0ad9784f24421ca1509faa557baddaf9883df402678f3527e4bd14eeb2de5288",
  "numericCanonicalSha256": "c9baf9824ac463fbbe33bde65c411eda16c1bed2185d106cc67e4057b4942e88",
  "personCount": 1022,
  "numericFieldCount": 30439,
  "serializedSha256": "52ac0894877484bb5893653fbb1a2200eedf91336ead323c3106531734632d08"
 }
};
const DOMAINS = {
 "person": {
  "fields": "id:t name:t url:t state:t method:t band:t baseline:b",
  "children": {
   "role": "role",
   "attributes": "attributes",
   "traits": [
    "trait"
   ],
   "skills": [
    "skill"
   ],
   "languages": [
    "language"
   ],
   "secondary": "secondary",
   "cp": "cp",
   "unit": "unit",
   "wandering_force": "force",
   "territory": "territory",
   "advantages": [
    "advantage"
   ],
   "disadvantages": [
    "disadvantage"
   ]
  }
 },
 "role": {
  "fields": "display:t",
  "children": {
   "evidence": [
    "role_evidence"
   ]
  }
 },
 "attributes": {
  "fields": "",
  "children": {
   "ST": "attribute",
   "DX": "attribute",
   "IQ": "attribute",
   "HT": "attribute"
  }
 },
 "attribute": {
  "fields": "value:n cp:n rule:t",
  "children": {
   "evidence": [
    "attribute_evidence"
   ]
  }
 },
 "trait": {
  "fields": "name:t kind:t rule:t level:n people:n frequency:n cp:n page:t",
  "children": {
   "evidence": [
    "trait_evidence"
   ],
   "reaction": "reaction",
   "applicationBoundaries": [
    "boundary"
   ]
  }
 },
 "skill": {
  "fields": "name:t ko:t attr:t diff:t tier:t cp:n level:n difficulty:t effect:t",
  "children": {
   "evidence": [
    "skill_evidence"
   ]
  }
 },
 "language": {
  "fields": "name:t level:t cp:n",
  "children": {
   "evidence": [
    "language_evidence"
   ]
  }
 },
 "secondary": {
  "fields": "HP:n Will:n Per:n FP:n BasicSpeed:n BasicMove:n BasicLift:n Dodge:n"
 },
 "cp": {
  "fields": "attributes:n advantages:n disadvantages:n skills:n spent:n unspent:n total:n"
 },
 "unit": {
  "fields": "type:t size:n quality:t note:t",
  "children": {
   "composition": [
    "composition"
   ],
   "faction_scale": "faction_scale"
  }
 },
 "faction_scale": {
  "fields": "state:t tier:t factor:n"
 },
 "force": {
  "fields": "type:t size:n current_location:t note:t",
  "children": {
   "camp": "camp"
  }
 },
 "camp": {
  "fields": "name:t type:t description:t pack_up_time:t",
  "children": {
   "facilities": [
    "facility"
   ]
  }
 },
 "territory": {
  "fields": "fief_name:t type:t station:t state:t note:t",
  "children": {
   "settlement": "settlement"
  }
 },
 "settlement": {
  "fields": "name:t type:t description:t"
 },
 "advantage": {
  "fields": "name:t cp:n effect:t"
 },
 "disadvantage": {
  "fields": "name:t cp:n effect:t"
 },
 "reaction": {
  "fields": "ordinaryObservers:n observersAttractedToHerSex:n application:t"
 },
 "boundary": {
  "primitive": true,
  "fields": "text:t"
 },
 "composition": {
  "primitive": true,
  "fields": "text:t"
 },
 "facility": {
  "primitive": true,
  "fields": "text:t"
 },
 "role_evidence": {
  "fields": "path:t pointer:t quote:t note:t line:n"
 },
 "attribute_evidence": {
  "fields": "path:t pointer:t quote:t note:t line:n"
 },
 "trait_evidence": {
  "fields": "path:t pointer:t quote:t note:t line:n"
 },
 "skill_evidence": {
  "fields": "path:t pointer:t quote:t note:t line:n"
 },
 "language_evidence": {
  "fields": "path:t pointer:t quote:t note:t line:n"
 }
};
const sha = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
 : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
const fail = message => { throw new Error('E_PRESERVED_SHEET: ' + message); };
const columns = spec => spec.fields ? spec.fields.split(' ').map(field => field.split(':')) : [];
const numericFields = people => {
 const fields = [];
 const visit = (value, pointer, id) => {
  if (typeof value === 'number') fields.push([id, pointer, value]);
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) visit(child, pointer + '/' + key.replaceAll('~', '~0').replaceAll('/', '~1'), id);
 };
 for (const person of people) visit(person, '', person.id);
 return fields.sort((a, b) => JSON.stringify(a.slice(0, 2)) < JSON.stringify(b.slice(0, 2)) ? -1 : 1);
};
function verifyPeople(people, pin) {
 const numbers = numericFields(people);
 if (people.length !== pin.personCount || new Set(people.map(p => p.id)).size !== pin.personCount ||
  sha(canonical(people)) !== pin.peopleCanonicalSha256 || sha(JSON.stringify(people)) !== pin.serializedSha256 ||
  numbers.length !== pin.numericFieldCount || sha(canonical(numbers)) !== pin.numericCanonicalSha256) fail('full record or numeric seal mismatch');
}

/** Explicit one-shot import. schemaSql is the accompanying reviewed SQL, never read at runtime.
 * documents: [{revision, bytes}], baselineBytes: exact shipped baseline, sourceBytes: Map(path, bytes).
 * All DDL, rows, audit provenance, and complete read-back parity share one transaction.
 */
export function initializePreservedSheetInputs(db, { schemaSql, documents, baselineBytes, sourceBytes, actor, reason }) {
 if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('actor and reason required');
 if (db.isTransaction) fail('independent transaction required');
 if (sha(baselineBytes) !== BASELINE_SHA256) fail('baseline bytes pin mismatch');
 const baseline = JSON.parse(String(baselineBytes));
 if (sha(canonical(baseline.sourceHashes)) !== SOURCE_SEAL) fail('source pins mismatch');
 if (!(sourceBytes instanceof Map) || sourceBytes.size !== Object.keys(baseline.sourceHashes).length) fail('complete archived source bytes required');
 for (const [path, hash] of Object.entries(baseline.sourceHashes)) if (!sourceBytes.has(path) || sha(sourceBytes.get(path)) !== hash) fail('archived source bytes mismatch: ' + path);
 if (!Array.isArray(documents) || documents.length !== 2 || new Set(documents.map(d => d.revision)).size !== 2) fail('both exact revisions required');
 const authenticated = Object.entries(PINS).map(([revision, pin]) => {
  const input = documents.find(d => d.revision === revision);
  if (!input || sha(input.bytes) !== pin.ledgerSha256) fail('ledger bytes pin mismatch: ' + revision);
  const doc = JSON.parse(String(input.bytes));
  if (sha(canonical(doc)) !== pin.documentCanonicalSha256) fail('document canonical seal mismatch');
  verifyPeople(doc.people, pin);
  return { revision, doc, pin };
 });
 db.exec('BEGIN IMMEDIATE');
 try {
  db.exec(schemaSql);
  const sourceInsert = db.prepare('INSERT INTO preserved_sheet_source VALUES (?,?)');
  for (const entry of Object.entries(baseline.sourceHashes)) sourceInsert.run(...entry);
  const insert = new Map(Object.entries(DOMAINS).map(([name, spec]) => {
   const names = ['revision', 'person_id', 'slot', 'key_order', ...columns(spec).map(([key]) => key)];
   return [name, db.prepare('INSERT INTO preserved_sheet_' + name + ' (' + names.map(n => '"' + n + '"').join(',') + ') VALUES (' + names.map(() => '?').join(',') + ')')];
  }));
  for (const [ordinal, { revision, doc, pin }] of authenticated.entries()) {
   db.prepare('INSERT INTO preserved_sheet_revision VALUES (' + Array(16).fill('?').join(',') + ')').run(revision, ordinal, pin.ledgerSha256, pin.documentCanonicalSha256, pin.peopleCanonicalSha256, pin.serializedSha256, pin.numericCanonicalSha256, pin.numericFieldCount, pin.personCount, baseline.rulesVersion, 'opposed-d10', 0, 'immutable-not-d10-ratings', null, actor, reason);
   const counts = new Map(Object.keys(DOMAINS).map(name => [name, 0]));
   const put = (name, personId, slot, value) => {
    const spec = DOMAINS[name];
    const obj = spec.primitive ? { text: value } : value;
    const keys = obj === null ? '~null' : Object.keys(obj).join('|');
    const fields = columns(spec);
    if (obj !== null) for (const key of Object.keys(obj)) if (!fields.some(([field]) => field === key) && !Object.hasOwn(spec.children ?? {}, key)) fail('unknown ' + name + '.' + key);
    insert.get(name).run(revision, personId, slot, keys, ...fields.map(([key, type]) => {
     const v = obj?.[key];
     if (v === undefined || v === null) return null;
     if (typeof v !== ({ t: 'string', n: 'number', b: 'boolean' }[type])) fail('invalid typed domain value');
     return type === 'b' ? Number(v) : v;
    }));
    counts.set(name, counts.get(name) + 1);
    for (const [key, child] of Object.entries(spec.children ?? {})) {
     if (obj === null || !Object.hasOwn(obj, key)) continue;
     if (Array.isArray(child)) obj[key].forEach((v, i) => put(child[0], personId, slot + '/' + key + '/' + i, v));
     else put(child, personId, slot + '/' + key, obj[key]);
    }
   };
   for (const person of doc.people) put('person', person.id, '', person);
   for (const [domain, count] of counts) db.prepare('INSERT INTO preserved_sheet_domain_count VALUES (?,?,?)').run(revision, domain, count);
  }
  const result = loadPreservedSheetInputs(db);
  for (const [i, version] of result.entries()) if (JSON.stringify([...version.people.values()]) !== JSON.stringify(authenticated[i].doc.people)) fail('transaction full parity mismatch');
  db.exec('COMMIT');
  return result;
 } catch (error) {
  if (db.isTransaction) db.exec('ROLLBACK');
  throw error;
 }
}

/** Runtime path: SELECT-only, no legacy imports, source access, JSON decoding, or fallback. */
export function loadPreservedSheetInputs(db) {
 const sources = db.prepare('SELECT source_path, sha256 FROM preserved_sheet_source ORDER BY source_path').all();
 verifySources(sources);
 const revisions = db.prepare('SELECT * FROM preserved_sheet_revision ORDER BY ordinal').all();
 verifyRevisions(revisions);
 return revisions.map((revision, index) => {
  const pin = verifyRevision(revision, index);
  const tables = new Map();
  const expected = db.prepare('SELECT domain,row_count FROM preserved_sheet_domain_count WHERE revision=?').all(revision.revision);
  if (expected.length !== Object.keys(DOMAINS).length) fail('domain denominator');
  for (const name of Object.keys(DOMAINS)) {
   const rows = db.prepare('SELECT * FROM preserved_sheet_' + name + ' WHERE revision=?').all(revision.revision);
   if (expected.find(r => r.domain === name)?.row_count !== rows.length) fail('missing or added terminal domain row: ' + name);
   tables.set(name, new Map(rows.map(row => [row.person_id + ':' + row.slot, row])));
  }
  return restoreRevision(revision, pin, tables);
 });
}

function verifySources(sources) {
 if (sha(canonical(Object.fromEntries(sources.map(s => [s.source_path, s.sha256])))) !== SOURCE_SEAL) fail('archived provenance seal mismatch');
}

function verifyRevisions(revisions) {
 if (revisions.length !== 2) fail('revision denominator');
}

function verifyRevision(revision, index) {
 const pin = PINS[revision.revision];
 if (Object.keys(PINS)[index] !== revision.revision || revision.ordinal !== index || !pin || revision.ledger_sha256 !== pin.ledgerSha256 || revision.document_sha256 !== pin.documentCanonicalSha256 || revision.people_sha256 !== pin.peopleCanonicalSha256 || revision.serialized_sha256 !== pin.serializedSha256 || revision.numeric_sha256 !== pin.numericCanonicalSha256 || revision.numeric_count !== pin.numericFieldCount || revision.person_count !== 1022 || !revision.actor.trim() || !revision.reason.trim()) fail('revision pin mismatch');
 if (revision.rules_version !== 'seoul.opposed-d10.v1' || revision.resolution !== 'opposed-d10' || revision.numeric_adoption !== 0 || revision.legacy_values !== 'immutable-not-d10-ratings' || revision.original_ratings !== null) fail('operative rules mismatch');
 return pin;
}

function restoreRevision(revision, pin, tables) {
 const used = new Map(Object.keys(DOMAINS).map(name => [name, new Set()]));
 const take = (name, personId, slot) => {
  const spec = DOMAINS[name], key = personId + ':' + slot, row = tables.get(name).get(key);
  if (!row || used.get(name).has(key)) fail('missing or duplicate ' + name);
  used.get(name).add(key);
  if (row.key_order === '~null') return null;
  const obj = {};
  for (const field of row.key_order.split('|').filter(Boolean)) {
   const child = spec.children?.[field];
   if (child) {
    if (Array.isArray(child)) {
     const prefix = personId + ':' + slot + '/' + field + '/';
     const count = [...tables.get(child[0]).keys()].filter(k => k.startsWith(prefix) && !k.slice(prefix.length).includes('/')).length;
     obj[field] = Array.from({ length: count }, (_, i) => take(child[0], personId, slot + '/' + field + '/' + i));
    } else obj[field] = take(child, personId, slot + '/' + field);
   } else {
    const type = columns(spec).find(([k]) => k === field)?.[1];
    if (!type) fail('unknown presence key');
    obj[field] = type === 'b' && row[field] !== null ? Boolean(row[field]) : row[field];
   }
  }
  return spec.primitive ? obj.text : obj;
 };
 const ids = [...tables.get('person').values()].sort((a, b) => Number(a.person_id.slice(1)) - Number(b.person_id.slice(1))).map(r => r.person_id);
 const people = ids.map(id => take('person', id, ''));
 for (const name of Object.keys(DOMAINS)) if (used.get(name).size !== tables.get(name).size) fail('unreachable domain rows');
 verifyPeople(people, pin);
 return { revision: revision.revision, ledgerSha256: revision.ledger_sha256, rules: { rulesVersion: revision.rules_version, resolution: revision.resolution, sourceRevision: revision.revision, numericAdoption: false, legacyValues: revision.legacy_values, originalRatings: null }, people: new Map(people.map(person => [person.id, person])) };
}

export async function loadPreservedSheetInputsAsync(tx) {
 verifySources(await tx.all('SELECT source_path, sha256 FROM wiki.preserved_sheet_source ORDER BY source_path'));
 const revisions = await tx.all('SELECT * FROM wiki.preserved_sheet_revision ORDER BY ordinal');
 verifyRevisions(revisions);
 const result = [];
 for (const [index, revision] of revisions.entries()) {
  const pin = verifyRevision(revision, index);
  const expected = await tx.all('SELECT domain,row_count FROM wiki.preserved_sheet_domain_count WHERE revision=?', [revision.revision]);
  if (expected.length !== Object.keys(DOMAINS).length) fail('domain denominator');
  const tables = new Map();
  for (const name of Object.keys(DOMAINS)) {
   const rows = await tx.all('SELECT * FROM wiki.preserved_sheet_' + name + ' WHERE revision=?', [revision.revision]);
   if (expected.find(r => r.domain === name)?.row_count !== rows.length) fail('missing or added terminal domain row: ' + name);
   tables.set(name, new Map(rows.map(row => [row.person_id + ':' + row.slot, row])));
  }
  result.push(restoreRevision(revision, pin, tables));
 }
 return result;
}
