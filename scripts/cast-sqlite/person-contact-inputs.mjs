import { readPersonBirthdayInputs } from './person-inputs.mjs';
import { readCastFamilyTreeInputs, FAMILY_INPUT_PATHS } from './family-inputs.mjs';
import { readEvidenceDocumentReference } from './evidence-document-reference.mjs';
import { orderDocumentKeys } from './document-key-order.mjs';

export const PERSON_CONTACT_INPUT_PATHS = Object.freeze([
  ...FAMILY_INPUT_PATHS,
  'lore/name-pools/cast-family-parent-status.json',
  'lore/name-pools/cast-prose-contacts.json',
  ...['03', '05', '06', '07', '09', '10', '12', '13', '15', '16'].map(state => `lore/characters/Cast-State-${state}.json`),
  'lore/characters/Core-Characters.json',
  'lore/factions/Diaspora-Corridors.json',
]);

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };

/** Caller-owned connection; sparse production Maps, never new relationships or file IO. */
export function readPersonContactInputs(db) {
  const sources = new Map();
  for (const path of PERSON_CONTACT_INPUT_PATHS) {
    const rows = db.prepare('SELECT source_id FROM source_file WHERE logical_path=?').all(path);
    if (rows.length !== 1) fail('E_PERSON_CONTACT_MISSING', path);
    sources.set(path, rows[0].source_id);
  }
  const { birthdayRoster } = readPersonBirthdayInputs(db);
  const people = new Map(birthdayRoster.map(person => [person.id, person]));
  const familyGraph = readCastFamilyTreeInputs(db);
  const documents = new Map();
  const document = path => {
    if (!sources.has(path)) fail('E_PERSON_CONTACT_SOURCE', path);
    if (!documents.has(path)) {
      const evidence = readEvidenceDocumentReference(db, { logicalPath: path });
      documents.set(path, orderDocumentKeys(db, evidence.sourceId, evidence.document));
    }
    return documents.get(path);
  };
  const records = (table, path) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY CAST(substr(json_pointer,10) AS INTEGER)`).all();
    if (rows.some((row, i) => row.source_id !== sources.get(path) || row.json_pointer !== `/records/${i}`)) fail('E_PERSON_CONTACT_COVERAGE', table);
    return rows;
  };
  const parentStatusById = new Map();
  for (const row of records('family_parent_status', 'lore/name-pools/cast-family-parent-status.json')) {
    if (parentStatusById.has(row.person_id) || !people.has(row.person_id)
      || !['biological-parents-unrecorded', 'maternal-parent-unrecorded'].includes(row.status)
      || !familyGraph.edges.some(edge => edge.to === row.person_id && edge.from === row.known_parent_id && edge.type === row.known_relationship)) fail('E_PARENT_STATUS', row.person_id);
    if (row.source_ref_path !== 'lore/characters/Core-Characters.json'
      || !document(row.source_ref_path).content.some(block => block.anchor === row.source_ref_anchor)) fail('E_PARENT_STATUS_SOURCE', row.person_id);
    parentStatusById.set(row.person_id, row.status);
  }
  const proseContactsById = new Map(), seen = new Set();
  for (const row of records('context_prose_contact', 'lore/name-pools/cast-prose-contacts.json')) {
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
