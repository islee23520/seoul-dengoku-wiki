import { createHash } from 'node:crypto';

const paths = { lineage: 'lore/name-pools/cast-hangnyeol.json', gender: 'lore/name-pools/gender-cast.json' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_PERSON_IDENTITY_INPUT: ${detail}`), { code: 'E_PERSON_IDENTITY_INPUT' }); };
const lineageColumns = {
  surname: 'surname', status: 'status', bongwan: 'bongwan', clan: 'clan_id',
  base_clan: 'base_clan_id', branch: 'branch', reason: 'reason', source_file: 'source_file_label',
  surname_hanja: 'surname_hanja', bongwan_hanja: 'bongwan_hanja', hangnyeol: 'hangnyeol',
  position: 'position', sesu: 'sesu', namingConvention: 'naming_convention',
};

// SELECT-only runtime. The connection may be a read-only DatabaseSync or a
// prepare-only capability; neither archives nor filesystem sources are used.
export function readPersonIdentityInputs(db) {
  try {
    const receipts = db.prepare('SELECT * FROM person_identity_import').all();
    if (receipts.length !== 2) fail('import coverage');
    const people = db.prepare('SELECT person_id,name FROM person').all();
    const names = new Map(people.map(p => [p.person_id, p.name]));
    if (new Set(names.values()).size !== names.size) fail('identity coverage');
    const supplements = new Map(db.prepare('SELECT * FROM person_identity_legacy_clan').all().map(r => [r.person_id, r.legacy_clan_label]));
    const allKeys = db.prepare('SELECT * FROM person_identity_key ORDER BY domain,person_id,object_path,ordinal').all();
    const keys = new Map();
    for (const row of allKeys) {
      const id = `${row.domain}:${row.person_id}:${row.object_path}`;
      if (!keys.has(id)) keys.set(id, []);
      keys.get(id).push(row);
    }
    const order = db.prepare('SELECT * FROM person_identity_order ORDER BY domain,ordinal').all();
    const output = {};
    for (const domain of ['lineage', 'gender']) {
      const receipt = receipts.find(r => r.domain === domain);
      if (!receipt || receipt.person_count !== names.size) fail(`${domain}:receipt`);
      const rows = db.prepare(`SELECT * FROM person_${domain}`).all();
      const byId = new Map(rows.map(r => [r.person_id, r]));
      const entries = order.filter(r => r.domain === domain);
      if (rows.length !== names.size || byId.size !== names.size || entries.length !== names.size) fail(`${domain}:row coverage`);
      const visit = (candidate, id, path) => {
        const group = `${domain}:${id}:${path}`, fields = keys.get(group);
        if (!fields?.length) fail(`${group}:missing keys`);
        keys.delete(group);
        return Object.fromEntries(fields.map((r, i) => {
          if (r.ordinal !== i || !Object.hasOwn(candidate, r.key) || ![0, 1].includes(r.is_null)) fail(`${group}:unknown field/order`);
          const value = candidate[r.key];
          if (value === undefined || Number(value === null) !== r.is_null) fail(`${group}:${r.key}:null/presence`);
          return [r.key, value !== null && typeof value === 'object' ? visit(value, id, `${path}/${r.key}`) : value];
        }));
      };
      const records = entries.map((entry, i) => {
        const id = entry.person_id, row = byId.get(id);
        if (entry.ordinal !== i || !row || !names.has(id)) fail(`${domain}:identity/order`);
        byId.delete(id);
        let candidate;
        if (domain === 'gender') {
          if (![0, 1, null].includes(row.user_locked)) fail(`${id}:gender lock`);
          candidate = { name: names.get(id), state: row.state_id, gender: row.gender, source: row.assignment_source,
            user_locked: row.user_locked === null ? null : Boolean(row.user_locked) };
        } else {
          candidate = { name: names.get(id), ...Object.fromEntries(Object.entries(lineageColumns).map(([key, column]) => [key, row[column]])),
            namingConventionSource: { characterId: row.naming_source_character_id, path: row.naming_source_path, basis: row.naming_source_basis } };
          if (supplements.has(id)) {
            if (row.clan_id !== null || row.naming_convention !== 'non-korean-lineage') fail(`${id}:legacy clan domain`);
            candidate.clan = supplements.get(id);
            supplements.delete(id);
          }
        }
        return visit(candidate, id, '');
      });
      if (byId.size || hash(JSON.stringify(records)) !== receipt.people_sha256) fail(`${domain}:digest/coverage`);
      output[domain === 'lineage' ? 'lineageByName' : 'genderByName'] = new Map(records.map(p => [p.name, p]));
    }
    if (keys.size || supplements.size || order.length !== 2 * names.size) fail('unconsumed metadata');
    return output;
  } catch (error) {
    if (error.code === 'E_PERSON_IDENTITY_INPUT') throw error;
    fail(error.message);
  }
}

// Explicit one-time import of authenticated source bytes on a writable copy.
// Existing domain values are never rewritten; only proven lost clan labels and
// keys-only presence/order metadata are admitted, then full parity is checked.
export async function initializePersonIdentityInputs(db, { lineageBytes, genderBytes,
  actor, reason } = {}) {
  if (![actor, reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  const expectedSourceHashes = {};
  if (db.isTransaction) fail('active transaction');
  const documents = {};
  for (const [domain, bytes] of Object.entries({ lineage: lineageBytes, gender: genderBytes })) {
    if (!(bytes instanceof Uint8Array)) fail(`${domain}:source bytes`);
    expectedSourceHashes[domain] = hash(bytes);
    const archived = db.prepare('SELECT sha256 FROM source_file WHERE logical_path=?').all(paths[domain]);
    if (archived.length !== 1 || archived[0].sha256 !== expectedSourceHashes[domain]) fail(`${domain}:archive identity`);
    documents[domain] = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)).people;
    if (!Array.isArray(documents[domain]) || !documents[domain].length) fail(`${domain}:people`);
  }
  const { readFile } = await import('node:fs/promises');
  const schema = await readFile(new URL('./person-identity-inputs.sql', import.meta.url), 'utf8');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schema);
    const identities = new Map(db.prepare('SELECT person_id,name FROM person').all().map(r => [r.name, r.person_id]));
    const addKey = db.prepare('INSERT INTO person_identity_key VALUES (?,?,?,?,?,?)');
    const walk = (value, domain, id, path) => {
      Object.entries(value).forEach(([key, v], ordinal) => {
        addKey.run(domain, id, path, ordinal, key, Number(v === null));
        if (v !== null && typeof v === 'object') walk(v, domain, id, `${path}/${key}`);
      });
    };
    for (const domain of ['lineage', 'gender']) {
      const records = documents[domain];
      if (new Set(records.map(p => p.name)).size !== records.length) fail(`${domain}:duplicate identity`);
      db.prepare('INSERT INTO person_identity_import VALUES (?,?,?,?,?,?)').run(domain, expectedSourceHashes[domain], hash(JSON.stringify(records)), records.length, actor, reason);
      records.forEach((p, ordinal) => {
        const id = identities.get(p.name);
        if (!id) fail(`${domain}:${p.name}:identity`);
        db.prepare('INSERT INTO person_identity_order VALUES (?,?,?)').run(domain, id, ordinal);
        walk(p, domain, id, '');
        if (domain === 'lineage' && p.clan !== undefined && p.clan !== null) {
          const row = db.prepare('SELECT clan_id,naming_convention FROM person_lineage WHERE person_id=?').get(id);
          if (row?.clan_id === null && row.naming_convention === 'non-korean-lineage') {
            db.prepare('INSERT INTO person_identity_legacy_clan VALUES (?,?)').run(id, p.clan);
          }
        }
      });
    }
    const actual = readPersonIdentityInputs(db);
    for (const domain of ['lineage', 'gender']) {
      if (JSON.stringify([...actual[domain === 'lineage' ? 'lineageByName' : 'genderByName'].values()]) !== JSON.stringify(documents[domain])) fail(`${domain}:source parity`);
    }
    db.exec('COMMIT');
    return actual;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
