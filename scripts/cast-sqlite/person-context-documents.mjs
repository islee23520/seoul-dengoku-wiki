import { createHash } from 'node:crypto';
import { deepStrictEqual } from 'node:assert';

const paths = { birthdays: 'lore/name-pools/cast-birthdays.json', contacts: 'lore/name-pools/cast-prose-contacts.json' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_PERSON_CONTEXT_DOCUMENT: ' + detail), { code: 'E_PERSON_CONTEXT_DOCUMENT' }); };

/** SELECT-only reconstruction of entire source documents from typed domains. */
export function readPersonContextDocuments(db) {
  try {
    const rows = table => db.prepare('SELECT * FROM ' + table).all();
    const receipts = rows('person_context_document_import');
    if (receipts.length !== 2) fail('import coverage');
    const sources = {};
    for (const domain of Object.keys(paths)) {
      const r = receipts.find(r => r.domain === domain);
      if (!r) fail(domain + ': import receipt');
      sources[domain] = r.source_id;
    }
    const metadata = db.prepare('SELECT * FROM family_source_metadata WHERE source_id=?').all(sources.birthdays);
    const schema = metadata.find(r => r.field_name === 'schemaVersion');
    const reference = metadata.find(r => r.field_name === 'ageAsOf');
    if (metadata.length !== 2 || schema?.value_kind !== 'number' || schema.json_pointer !== '/schemaVersion'
      || reference?.value_kind !== 'string' || reference.json_pointer !== '/ageAsOf') fail('birthday metadata');
    const births = rows('family_birthday').sort((a,b) => Number(a.json_pointer.slice(8))-Number(b.json_pointer.slice(8)));
    const refs = rows('family_birthday_source');
    const people = new Map(rows('person').map(r => [r.person_id,r.name]));
    if (births.length !== people.size) fail('birthday coverage');
    let consumed = 0;
    const birthdayPeople = births.map((r,i) => {
      if (r.source_id !== sources.birthdays || r.json_pointer !== '/people/' + i || !people.has(r.person_id)) fail('birthday identity/order');
      const sourceRefs = refs.filter(s => s.person_id === r.person_id).sort((a,b) => a.ordinal-b.ordinal);
      if (!sourceRefs.length || sourceRefs.some((s,j) => s.ordinal !== j || s.source_id !== r.source_id
        || s.json_pointer !== r.json_pointer + '/sourceRefs/' + j)) fail('birthday references');
      consumed += sourceRefs.length;
      return { id: r.person_id, name: people.get(r.person_id), birthDate: r.birth_date,
        sourceStatus: r.source_status, sourceRefs: sourceRefs.map(s => s.source_ref) };
    });
    if (consumed !== refs.length) fail('unconsumed birthday reference');
    const meta = rows('person_context_contact_metadata');
    if (meta.length !== 1 || meta[0].domain !== 'contacts') fail('contact metadata coverage');
    const m = meta[0];
    const contacts = rows('context_prose_contact').sort((a,b) => Number(a.json_pointer.slice(9))-Number(b.json_pointer.slice(9)));
    const records = contacts.map((r,i) => {
      if (r.source_id !== sources.contacts || r.json_pointer !== '/records/' + i
        || r.catalog_status !== 'current-catalog-input' || !people.has(r.person_id) || !people.has(r.recipient_person_id)) fail('contact identity/order/status');
      return { personId: r.person_id, recipientId: r.recipient_person_id,
        sourceRef: { path: r.source_ref_path, anchor: r.source_ref_anchor }, kind: r.contact_kind };
    });
    const candidates = {
      birthdays: { schemaVersion: schema.integer_value, ageAsOf: reference.text_value, people: birthdayPeople },
      contacts: { schemaVersion: m.schema_version, status: m.status, approvalStatus: m.approval_status, sourceNote: m.source_note, records },
    };
    const groups = new Map();
    for (const r of db.prepare('SELECT * FROM person_context_document_key ORDER BY domain,object_path,ordinal').all()) {
      const key = r.domain + ':' + r.object_path;
      if (!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(r);
    }
    const order = (value,domain,path) => {
      if (value === null || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map((v,i) => order(v,domain,path + '/' + i));
      const key = domain + ':' + path, group = groups.get(key);
      if (!group || group.length !== Object.keys(value).length) fail(key + ': key coverage');
      groups.delete(key);
      return Object.fromEntries(group.map((r,i) => {
        if (r.ordinal !== i || !Object.hasOwn(value,r.key) || r.is_null !== Number(value[r.key] === null)) fail(key + ': key/order/null');
        return [r.key,order(value[r.key],domain,path + '/' + r.key)];
      }));
    };
    const result = {};
    for (const domain of Object.keys(paths)) {
      result[domain] = order(candidates[domain],domain,'');
    }
    if (groups.size) fail('unconsumed key metadata');
    return result;
  } catch (error) {
    if (error.code === 'E_PERSON_CONTEXT_DOCUMENT') throw error;
    fail(error.message);
  }
}

/** Explicit one-shot initialization on a caller-owned writable COPY, with full parity before commit. */
export function initializePersonContextDocuments(db, { schemaSql, birthdaysBytes, contactsBytes, actor, reason } = {}) {
  if (![actor,reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('explicit schema SQL required');
  if (db.isTransaction) fail('active transaction');
  const documents = {}, sources = {}, sourceHashes = {};
  for (const [domain,bytes] of Object.entries({ birthdays: birthdaysBytes, contacts: contactsBytes })) {
    if (!(bytes instanceof Uint8Array)) fail(domain + ': source bytes');
    const source = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').all(paths[domain]);
    if (source.length !== 1) fail(domain + ': archive identity');
    sources[domain] = source[0].source_id;
    sourceHashes[domain] = hash(bytes);
    documents[domain] = JSON.parse(new TextDecoder('utf-8',{ fatal: true }).decode(bytes));
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const domain of Object.keys(paths)) db.prepare('INSERT INTO person_context_document_import VALUES (?,?,?,?,?,?)')
      .run(domain,sources[domain],sourceHashes[domain],hash(JSON.stringify(documents[domain])),actor,reason);
    const m = documents.contacts;
    db.prepare('INSERT INTO person_context_contact_metadata VALUES (?,?,?,?,?)').run('contacts',m.schemaVersion,m.status,m.approvalStatus,m.sourceNote);
    const put = db.prepare('INSERT INTO person_context_document_key VALUES (?,?,?,?,?)');
    const walk = (value,domain,path) => {
      if (value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((v,i) => walk(v,domain,path + '/' + i)); return; }
      Object.entries(value).forEach(([key,v],i) => { put.run(domain,path,i,key,Number(v === null)); walk(v,domain,path + '/' + key); });
    };
    for (const domain of Object.keys(paths)) walk(documents[domain],domain,'');
    const result = readPersonContextDocuments(db);
    deepStrictEqual(result,documents);
    if (JSON.stringify(result) !== JSON.stringify(documents)) fail('transaction full serialized parity');
    db.exec('COMMIT');
    return result;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
