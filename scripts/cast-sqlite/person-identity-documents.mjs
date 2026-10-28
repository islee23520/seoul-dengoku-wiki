import { createHash } from 'node:crypto';
import { deepStrictEqual } from 'node:assert';
import { readPersonIdentityInputs } from './person-identity-inputs.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_PERSON_IDENTITY_DOCUMENT: ' + detail), { code: 'E_PERSON_IDENTITY_DOCUMENT' }); };

/** SELECT-only complete source documents. All values come from typed domains. */
export function readPersonIdentityDocuments(db) {
  try {
    const receipts = db.prepare('SELECT * FROM person_identity_document_import').all();
    if (receipts.length !== 2) fail('import coverage');
    for (const domain of ['lineage', 'gender']) {
      const receipt = receipts.find(r => r.domain === domain);
      if (!receipt || !receipt.actor.trim() || !receipt.reason.trim()) fail(domain + ': receipt');
    }
    const single = table => {
      const rows = db.prepare('SELECT * FROM ' + table).all();
      if (rows.length !== 1) fail(table + ': provenance coverage');
      return rows[0];
    };
    const l = single('identity_lineage_provenance'), g = single('identity_gender_provenance');
    const categories = db.prepare('SELECT * FROM identity_gender_category ORDER BY ordinal').all();
    const policies = db.prepare('SELECT * FROM identity_gender_policy').all();
    if (categories.some((r,i) => r.source_id !== g.source_id || r.ordinal !== i)
      || policies.some(r => r.source_id !== g.source_id)) fail('category/policy coverage');
    const { lineageByName, genderByName } = readPersonIdentityInputs(db);
    const candidates = {
      lineage: { id: l.catalog_id, schema: l.schema_version, note: l.note, sources: [],
        people: [...lineageByName.values()], lineage: {
          parents: Object.fromEntries(db.prepare('SELECT child_name,parent_name FROM lineage_parent').all().map(r => [r.child_name,r.parent_name])),
          founder_sesu: Object.fromEntries(db.prepare('SELECT person_name,sesu FROM lineage_founder_sesu').all().map(r => [r.person_name,r.sesu])),
          person_clan: Object.fromEntries(db.prepare('SELECT p.name,a.clan_id FROM lineage_clan_assignment a JOIN person p USING(person_id)').all().map(r => [r.name,r.clan_id])),
          notes: l.lineage_notes }, assignment: l.assignment_method },
      gender: { schema: g.schema_name, owner_decision: g.owner_decision, count: g.person_count,
        categories: categories.map(r => r.category), assignment: g.assignment_method,
        policies: policies.sort((a,b) => Number(a.json_pointer.split('/').at(-1))-Number(b.json_pointer.split('/').at(-1))).map((r,i) => {
          if (r.json_pointer !== '/policies/' + i) fail('policy order');
          return { state: r.state_id, people: r.population, female_ratio: r.female_ratio,
            female_count: r.female_count, male_count: r.male_count, reason: r.reason };
        }), people: [...genderByName.values()] },
    };
    const groups = new Map();
    for (const row of db.prepare('SELECT * FROM person_identity_document_key ORDER BY domain,object_path,ordinal').all()) {
      const group = row.domain + ':' + row.object_path;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(row);
    }
    const order = (value,domain,path) => {
      if (path === '/people' || value === null || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map((v,i) => order(v,domain,path+'/'+i));
      const group = domain + ':' + path, keys = groups.get(group);
      if (!keys || keys.length !== Object.keys(value).length) fail(group + ': key coverage');
      groups.delete(group);
      return Object.fromEntries(keys.map((r,i) => {
        if (r.ordinal !== i || !Object.hasOwn(value,r.key) || Number(value[r.key] === null) !== r.is_null) fail(group + ': key/order/null');
        return [r.key,order(value[r.key],domain,path+'/'+r.key)];
      }));
    };
    const result = {};
    for (const domain of ['lineage','gender']) {
      result[domain] = order(candidates[domain],domain,'');
      if (hash(JSON.stringify(result[domain])) !== receipts.find(r => r.domain === domain).document_sha256) fail(domain + ': stored document digest');
    }
    if (groups.size || result.gender.count !== result.gender.people.length) fail('unconsumed metadata/count');
    return result;
  } catch (error) {
    if (error.code === 'E_PERSON_IDENTITY_DOCUMENT') throw error;
    fail(error.message);
  }
}

/** One-shot initialization on a writable authority copy; never changes domain rows.
 * Both actual byte pins, actor/reason and reviewed schema SQL are mandatory.
 */
export function initializePersonIdentityDocuments(db, { schemaSql, lineageBytes, genderBytes,
  actor, reason } = {}) {
  const expectedSourceHashes = {};
  if (![actor,reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('explicit schema SQL required');
  if (db.isTransaction) fail('active transaction');
  const documents = {};
  for (const [domain,bytes] of Object.entries({ lineage: lineageBytes, gender: genderBytes })) {
    if (!(bytes instanceof Uint8Array)) fail(domain + ': source bytes');
    expectedSourceHashes[domain] = hash(bytes);
    const archived = db.prepare('SELECT sha256 FROM source_file WHERE logical_path=?').all('lore/name-pools/' + (domain === 'lineage' ? 'cast-hangnyeol' : 'gender-cast') + '.json');
    if (archived.length !== 1 || archived[0].sha256 !== expectedSourceHashes[domain]) fail(domain + ': archive identity');
    documents[domain] = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    const put = db.prepare('INSERT INTO person_identity_document_key VALUES (?,?,?,?,?)');
    const walk = (value,domain,path) => {
      if (path === '/people' || value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((v,i) => walk(v,domain,path+'/'+i)); return; }
      Object.entries(value).forEach(([key,v],i) => { put.run(domain,path,i,key,Number(v === null)); walk(v,domain,path+'/'+key); });
    };
    for (const domain of ['lineage','gender']) {
      db.prepare('INSERT INTO person_identity_document_import VALUES (?,?,?,?,?)').run(domain,expectedSourceHashes[domain],hash(JSON.stringify(documents[domain])),actor,reason);
      walk(documents[domain],domain,'');
    }
    const result = readPersonIdentityDocuments(db);
    deepStrictEqual(result,documents);
    if (JSON.stringify(result) !== JSON.stringify(documents)) fail('transaction full serialized parity');
    db.exec('COMMIT');
    return result;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
