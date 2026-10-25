import { createHash } from 'node:crypto';
import { deepStrictEqual } from 'node:assert';

export const PERSON_CONTEXT_SOURCE_HASHES = Object.freeze({
  birthdays: '195b524daf1592beec030f4ab500b5d99056d388ce34662cfedd9db68d26101b',
  contacts: 'a6183e2c8427775503218510f5f4a253f72efcb0ea3f6523dd52a9e5a6901849',
});
export const PERSON_CONTEXT_DOCUMENT_HASHES = Object.freeze({
  birthdays: '822209078b75d12fe68b9c636a00bcc3e5cbac44b4922cc9d11060ff00c0d149',
  contacts: 'f70d4e46aee7e61f6726734227db0e5b52cc8d4f96d8349b4ad4fb91d5b92179',
});
const paths = { birthdays: 'lore/name-pools/cast-birthdays.json', contacts: 'lore/name-pools/cast-prose-contacts.json' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_PERSON_CONTEXT_DOCUMENT: ' + detail), { code: 'E_PERSON_CONTEXT_DOCUMENT' }); };

/** SELECT-only reconstruction of entire source documents from typed domains. */
export function readPersonContextDocuments(db, { expectedSourceHashes = PERSON_CONTEXT_SOURCE_HASHES } = {}) {
  try {
    const rows = table => db.prepare('SELECT * FROM ' + table).all();
    const receipts = rows('person_context_document_import');
    if (receipts.length !== 2) fail('import coverage');
    const sources = {};
    for (const domain of Object.keys(paths)) {
      const r = receipts.find(r => r.domain === domain);
      if (!r || expectedSourceHashes?.[domain] !== PERSON_CONTEXT_SOURCE_HASHES[domain]
        || r.source_sha256 !== expectedSourceHashes[domain] || r.document_sha256 !== PERSON_CONTEXT_DOCUMENT_HASHES[domain]
        || !r.actor.trim() || !r.reason.trim()) fail(domain + ': receipt/pin');
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
    if (births.length !== 1022 || people.size !== 1022) fail('birthday coverage');
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
    if (contacts.length !== 15) fail('contact coverage');
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
      if (hash(JSON.stringify(result[domain])) !== PERSON_CONTEXT_DOCUMENT_HASHES[domain]) fail(domain + ': complete document digest');
    }
    if (groups.size) fail('unconsumed key metadata');
    return result;
  } catch (error) {
    if (error.code === 'E_PERSON_CONTEXT_DOCUMENT') throw error;
    fail(error.message);
  }
}

/** Explicit one-shot initialization on a caller-owned writable COPY, with full parity before commit. */
export function initializePersonContextDocuments(db, { schemaSql, birthdaysBytes, contactsBytes,
  expectedSourceHashes, actor, reason } = {}) {
  if (![actor,reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('explicit schema SQL required');
  if (db.isTransaction) fail('active transaction');
  const documents = {}, sources = {};
  for (const [domain,bytes] of Object.entries({ birthdays: birthdaysBytes, contacts: contactsBytes })) {
    if (!(bytes instanceof Uint8Array) || expectedSourceHashes?.[domain] !== PERSON_CONTEXT_SOURCE_HASHES[domain]
      || hash(bytes) !== expectedSourceHashes[domain]) fail(domain + ': actual byte pin');
    const source = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?').all(paths[domain]);
    if (source.length !== 1 || source[0].sha256 !== expectedSourceHashes[domain]) fail(domain + ': archive identity');
    sources[domain] = source[0].source_id;
    documents[domain] = JSON.parse(new TextDecoder('utf-8',{ fatal: true }).decode(bytes));
    if (hash(JSON.stringify(documents[domain])) !== PERSON_CONTEXT_DOCUMENT_HASHES[domain]) fail(domain + ': serialized pin');
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const domain of Object.keys(paths)) db.prepare('INSERT INTO person_context_document_import VALUES (?,?,?,?,?,?)')
      .run(domain,sources[domain],expectedSourceHashes[domain],PERSON_CONTEXT_DOCUMENT_HASHES[domain],actor,reason);
    const m = documents.contacts;
    db.prepare('INSERT INTO person_context_contact_metadata VALUES (?,?,?,?,?)').run('contacts',m.schemaVersion,m.status,m.approvalStatus,m.sourceNote);
    const put = db.prepare('INSERT INTO person_context_document_key VALUES (?,?,?,?,?)');
    const walk = (value,domain,path) => {
      if (value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((v,i) => walk(v,domain,path + '/' + i)); return; }
      Object.entries(value).forEach(([key,v],i) => { put.run(domain,path,i,key,Number(v === null)); walk(v,domain,path + '/' + key); });
    };
    for (const domain of Object.keys(paths)) walk(documents[domain],domain,'');
    const result = readPersonContextDocuments(db,{ expectedSourceHashes });
    deepStrictEqual(result,documents);
    if (JSON.stringify(result) !== JSON.stringify(documents)) fail('transaction full serialized parity');
    db.exec('COMMIT');
    return result;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
