import { readPersonBirthdayInputs } from './person-inputs.mjs';
import { readCastFamilyTreeInputs, FAMILY_INPUT_SOURCE_HASHES } from './family-inputs.mjs';
import { readEvidenceDocumentReference } from './evidence-document-reference.mjs';
import { orderDocumentKeys } from './document-key-order.mjs';

export const PERSON_CONTACT_INPUT_SOURCE_HASHES = Object.freeze({
  ...FAMILY_INPUT_SOURCE_HASHES,
  'lore/name-pools/cast-family-parent-status.json': 'b299315cb68ab697b48339102ddd0e1c513c7b4c75bf07c4ef615077e4ac4781',
  'lore/name-pools/cast-prose-contacts.json': 'a6183e2c8427775503218510f5f4a253f72efcb0ea3f6523dd52a9e5a6901849',
  'lore/characters/Cast-State-03.json': '2a3792784ff9a0c0ed971cd1285a63b16b2b34231dab79f1731fac8df42da762',
  'lore/characters/Cast-State-05.json': '7d56869751a3c4aa7c84aa6be6e6a1900d238b2109f184a113bd306933817c2f',
  'lore/characters/Cast-State-06.json': 'c7a461ba27c6933bff29ebff86209a03ff19248bd543ab79aae4a93d5cd91f3e',
  'lore/characters/Cast-State-07.json': 'ccb429ce471b9cd81b22c678263338c890dba5a52eb9810c2dfdfb74b715bf42',
  'lore/characters/Cast-State-09.json': '4afe8de9a60eb61aaed5c1da19a2047c3ceca293ae5d886545a0790a88c9d624',
  'lore/characters/Cast-State-10.json': '16b2124914fbf267149e5e42d9b5023b24db8cf144fe3e74265a5be655e6b2ab',
  'lore/characters/Cast-State-12.json': '7d3d7e425ba1ba799e2f0279594b9e2d46568780dfd4658057b3f7d2b7bac428',
  'lore/characters/Cast-State-13.json': 'd1f6934971071a73a0a18e32213bb1ef6edfc30dddbc1fb6ac074b7021051bdf',
  'lore/characters/Cast-State-15.json': '11353488c382b5d5ff8c881ede420ad69b399cb94190e53ef2d88a72b9e0f0df',
  'lore/characters/Cast-State-16.json': '274e94afc69d0e1296f28b78c6de85ca185e5a7d6cec75e2f0b5ac6b96857c4d',
  'lore/characters/Core-Characters.json': '911c7f9ca1a24d1c803a4c952ff972cc0482be74d6f277419b14734512e56dc4',
  'lore/factions/Diaspora-Corridors.json': 'cbfc699d3fcc76a62bea7b2a920d432a40ece402a79422110047d60a7b391112',
});

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };

// Current sealed prose approval, separate from immutable archive byte identities.
export const PERSON_CONTACT_INPUT_SEMANTIC_HASHES = Object.freeze({
  'lore/characters/Core-Characters.json': 'a05f4bd6d9d0a246f1092d2b60ee7f0d0e5faf1ac151411e6bbfd6d7ecbcd905',
});

/** Caller-owned connection; sparse production Maps, never new relationships or file IO. */
export function readPersonContactInputs(db, { expectedSourceHashes = PERSON_CONTACT_INPUT_SOURCE_HASHES,
  expectedSemanticHashes = PERSON_CONTACT_INPUT_SEMANTIC_HASHES } = {}) {
  const sources = new Map();
  for (const [path, hash] of Object.entries(PERSON_CONTACT_INPUT_SOURCE_HASHES)) {
    if (expectedSourceHashes?.[path] !== hash) fail('E_PERSON_CONTACT_STALE', path);
    const rows = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?').all(path);
    if (rows.length !== 1) fail('E_PERSON_CONTACT_MISSING', path);
    if (rows[0].sha256 !== hash) fail('E_PERSON_CONTACT_STALE', path);
    sources.set(path, rows[0].source_id);
  }
  const { birthdayRoster } = readPersonBirthdayInputs(db, { expectedSourceHashes });
  const people = new Map(birthdayRoster.map(person => [person.id, person]));
  const familyGraph = readCastFamilyTreeInputs(db, { expectedSourceHashes });
  const documents = new Map();
  const document = path => {
    if (!sources.has(path)) fail('E_PERSON_CONTACT_SOURCE', path);
    if (!documents.has(path)) {
      const evidence = readEvidenceDocumentReference(db, { logicalPath: path, expectedSha256: expectedSourceHashes[path],
        expectedSemanticSha256: expectedSemanticHashes?.[path] });
      documents.set(path, orderDocumentKeys(db, evidence.sourceId, evidence.document));
    }
    return documents.get(path);
  };
  const records = (table, path, count) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY CAST(substr(json_pointer,10) AS INTEGER)`).all();
    if (rows.length !== count || rows.some((row, i) => row.source_id !== sources.get(path) || row.json_pointer !== `/records/${i}`)) fail('E_PERSON_CONTACT_COVERAGE', table);
    return rows;
  };
  const parentStatusById = new Map();
  for (const row of records('family_parent_status', 'lore/name-pools/cast-family-parent-status.json', 2)) {
    if (parentStatusById.has(row.person_id) || !people.has(row.person_id)
      || !['biological-parents-unrecorded', 'maternal-parent-unrecorded'].includes(row.status)
      || !familyGraph.edges.some(edge => edge.to === row.person_id && edge.from === row.known_parent_id && edge.type === row.known_relationship)) fail('E_PARENT_STATUS', row.person_id);
    if (row.source_ref_path !== 'lore/characters/Core-Characters.json'
      || !document(row.source_ref_path).content.some(block => block.anchor === row.source_ref_anchor)) fail('E_PARENT_STATUS_SOURCE', row.person_id);
    parentStatusById.set(row.person_id, row.status);
  }
  const proseContactsById = new Map(), seen = new Set();
  for (const row of records('context_prose_contact', 'lore/name-pools/cast-prose-contacts.json', 15)) {
    const key = `${row.person_id}:${row.recipient_person_id}`;
    if (!people.has(row.person_id) || !people.has(row.recipient_person_id) || row.person_id === row.recipient_person_id || seen.has(key)
      || row.contact_kind !== 'existing-prose-contact' || row.catalog_status !== 'current-catalog-input'
      || !/^lore\/(?:characters|factions)\/[^/]+\.json$/u.test(row.source_ref_path)) fail('E_PROSE_CONTACT_ID', key);
    seen.add(key);
    const source = document(row.source_ref_path).content.find(block => block.anchor === row.source_ref_anchor);
    const value = source?.kind === 'list' ? source.items.find(item => typeof item.ko === 'string' && item.ko.startsWith('주요 관계:'))?.ko : source?.text?.ko;
    const basis = typeof value === 'string' ? value : Array.isArray(value) ? value.filter(part => !part.strong).map(part => part.text).join('') : '';
    if (!row.source_ref_anchor.startsWith(`인물-${people.get(row.person_id).name.replaceAll(' ', '-')}-`)
      || !basis.includes(people.get(row.recipient_person_id).name)) fail('E_PROSE_CONTACT_SOURCE', key);
    const sourceRef = { path: row.source_ref_path, anchor: row.source_ref_anchor };
    for (const [id, recipientId] of [[row.person_id, row.recipient_person_id], [row.recipient_person_id, row.person_id]]) {
      const contacts = proseContactsById.get(id) ?? [];
      contacts.push({ recipientId, recipientName: people.get(recipientId).name, basis: basis.trim(), sourceRef });
      proseContactsById.set(id, contacts);
    }
  }
  return { parentStatusById, proseContactsById };
}
