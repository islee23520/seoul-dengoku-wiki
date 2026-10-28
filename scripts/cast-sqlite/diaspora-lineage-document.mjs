import { createHash } from 'node:crypto';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_DIASPORA_LINEAGE_DOCUMENT: ${detail}`), { code: 'E_DIASPORA_LINEAGE_DOCUMENT' }); };
const text = value => typeof value === 'string' && value.length > 0;
const integer = value => Number.isInteger(value);
const sameKeys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(expected);

const documentFields = ['schema','sourceKind','authorization','collapseDate','openingYear','ageAsOf','generationIntervalYears','generationIntervalExceptions','sourceDocument','lineages'];
const lineageFields = ['key','currentPersonId','members'];
const bilingualFields = ['ko','en'];
const ancestorFields = ['key','generation','name','birthDate','parentKeys','timelineBio','narrative','events'];
const descendantFields = ['key','parentRoles','generation','name','birthDate','parentKeys','timelineBio','narrative','events'];
const presentFields = ['key','parentRoles','generation','personId','name','birthDate','parentKeys','narrative','events','timelineBio'];
const eventFields = ['year','kind'];
const datedEventFields = ['year','kind','date'];

function shape(document) {
  if (!sameKeys(document, documentFields)) fail('unknown, missing, or unordered fields');
  if (![document.schema, document.sourceKind, document.authorization, document.collapseDate, document.ageAsOf, document.sourceDocument].every(text)
    || !integer(document.openingYear) || !integer(document.generationIntervalYears)
    || !Array.isArray(document.generationIntervalExceptions) || document.generationIntervalExceptions.length !== 0
    || !Array.isArray(document.lineages) || document.lineages.length !== 2) fail('document shape');
  document.lineages.forEach((lineage, lineageOrdinal) => {
    if (!sameKeys(lineage, lineageFields) || !text(lineage.key) || !text(lineage.currentPersonId)
      || !Array.isArray(lineage.members) || lineage.members.length !== 4) fail('lineage shape');
    lineage.members.forEach((member, memberOrdinal) => {
      const expected = memberOrdinal === 0 ? ancestorFields : memberOrdinal === 3 ? presentFields : descendantFields;
      if (!sameKeys(member, expected) || !text(member.key) || !integer(member.generation)
        || !sameKeys(member.name, bilingualFields) || !text(member.name.ko) || !text(member.name.en)
        || !text(member.birthDate) || !sameKeys(member.timelineBio, bilingualFields)
        || !text(member.timelineBio.ko) || !text(member.timelineBio.en)
        || !sameKeys(member.narrative, bilingualFields) || !text(member.narrative.ko) || !text(member.narrative.en)
        || !Array.isArray(member.parentKeys) || !Array.isArray(member.events) || member.events.length === 0) fail('member shape');
      if (memberOrdinal === 0) {
        if (member.parentKeys.length !== 0 || Object.hasOwn(member, 'parentRoles') || Object.hasOwn(member, 'personId')) fail('ancestor membership');
      } else {
        if (!sameKeys(member.parentRoles, member.parentKeys) || !Object.values(member.parentRoles).every(text)) fail('parent roles');
        if (memberOrdinal === 3) {
          if (!text(member.personId) || member.personId !== member.key || member.key !== lineage.currentPersonId) fail('present member');
        } else if (Object.hasOwn(member, 'personId') || member.parentKeys.length !== 1) fail('descendant membership');
      }
      member.parentKeys.forEach(parentKey => { if (!text(parentKey)) fail('parent key'); });
      member.events.forEach(event => {
        const fields = Object.hasOwn(event, 'date') ? datedEventFields : eventFields;
        if (!sameKeys(event, fields) || !integer(event.year) || !text(event.kind)) fail('event shape');
        if (Object.hasOwn(event, 'date') && !text(event.date)) fail('event date');
      });
    });
  });
}

const receipt = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));
const pointer = (path, key) => `${path}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;

function recordKeyOrder(insert, value, path) {
  if (Array.isArray(value)) value.forEach((entry, index) => recordKeyOrder(insert, entry, pointer(path, index)));
  else if (value !== null && typeof value === 'object') {
    Object.keys(value).forEach((key, ordinal) => {
      insert.run(path, ordinal, key);
      recordKeyOrder(insert, value[key], pointer(path, key));
    });
  }
}

/** Import only the exact authored lineage document; normalization grants no approval. */
export function initializeDiasporaLineageDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array)) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO diaspora_lineage_document VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?)').run(
      sourceHash, document.schema, document.sourceKind, document.authorization, document.collapseDate,
      document.openingYear, document.ageAsOf, document.generationIntervalYears, document.sourceDocument,
      actor, reason, receipt(sourceHash, documentHash, actor, reason));
    const lineageInsert = db.prepare('INSERT INTO diaspora_lineage_document_lineage VALUES (?,?,?,?)');
    const memberInsert = db.prepare('INSERT INTO diaspora_lineage_member VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const parentInsert = db.prepare('INSERT INTO diaspora_lineage_parent_key VALUES (?,?,?,?)');
    const roleInsert = db.prepare('INSERT INTO diaspora_lineage_parent_role VALUES (?,?,?,?,?)');
    const eventInsert = db.prepare('INSERT INTO diaspora_lineage_event VALUES (?,?,?,?,?,?)');
    let parentKeys = 0, parentRoles = 0, events = 0;
    document.lineages.forEach((lineage, lineageOrdinal) => {
      lineageInsert.run(lineageOrdinal, 1, lineage.key, lineage.currentPersonId);
      lineage.members.forEach((member, memberOrdinal) => {
        memberInsert.run(
          lineageOrdinal, memberOrdinal, member.key, member.generation, Object.hasOwn(member, 'parentRoles') ? 1 : 0,
          Object.hasOwn(member, 'personId') ? member.personId : null,
          member.name.ko, member.name.en, member.birthDate, member.timelineBio.ko, member.timelineBio.en,
          member.narrative.ko, member.narrative.en);
        member.parentKeys.forEach((parentKey, ordinal) => { parentInsert.run(lineageOrdinal, memberOrdinal, ordinal, parentKey); parentKeys++; });
        if (Object.hasOwn(member, 'parentRoles')) {
          Object.entries(member.parentRoles).forEach(([parentKey, role], ordinal) => { roleInsert.run(lineageOrdinal, memberOrdinal, ordinal, parentKey, role); parentRoles++; });
        }
        member.events.forEach((event, ordinal) => { eventInsert.run(lineageOrdinal, memberOrdinal, ordinal, event.year, event.kind, event.date ?? null); events++; });
      });
    });
    recordKeyOrder(db.prepare('INSERT INTO diaspora_lineage_key_order VALUES (?,?,?)'), document, '');
    const reconstructed = readDiasporaLineageDocument(db);
    db.exec('COMMIT');
    return { documents: 1, lineages: 2, members: 8, parentKeys, parentRoles, events, keyOrders: db.prepare('SELECT count(*) AS n FROM diaspora_lineage_key_order').get().n, totalRows: 1 + 2 + 8 + parentKeys + parentRoles + events + db.prepare('SELECT count(*) AS n FROM diaspora_lineage_key_order').get().n };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function ordered(rows, label) {
  if (rows.some((row, index) => row.ordinal !== index)) fail(label + ' ordinal coverage');
  return rows;
}

function groups(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const id = key(row);
    if (!result.has(id)) result.set(id, []);
    result.get(id).push(row);
  }
  return result;
}

function bilingual(ko, en) {
  if (!text(ko) || !text(en)) fail('bilingual text');
  return { ko, en };
}

/** SELECT-only reconstruction: no source I/O, archive decoding, or JSON parsing. */
export function readDiasporaLineageDocument(db) {
  const documents = db.prepare('SELECT * FROM diaspora_lineage_document').all();
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  if (row.document_id !== 1 || !text(row.actor) || !row.actor.trim()
    || !text(row.reason) || !row.reason.trim()) fail('provenance');
  const lineages = ordered(db.prepare('SELECT * FROM diaspora_lineage_document_lineage ORDER BY ordinal').all(), 'lineage');
  const members = db.prepare('SELECT * FROM diaspora_lineage_member ORDER BY lineage_ordinal, ordinal').all();
  const parentKeys = db.prepare('SELECT * FROM diaspora_lineage_parent_key ORDER BY lineage_ordinal, member_ordinal, ordinal').all();
  const parentRoles = db.prepare('SELECT * FROM diaspora_lineage_parent_role ORDER BY lineage_ordinal, member_ordinal, ordinal').all();
  const events = db.prepare('SELECT * FROM diaspora_lineage_event ORDER BY lineage_ordinal, member_ordinal, ordinal').all();
  const keyOrders = db.prepare('SELECT * FROM diaspora_lineage_key_order ORDER BY object_pointer, ordinal').all();
  if (lineages.length !== 2 || lineages.some(lineage => lineage.document_id !== 1)
    || members.length !== 8 || parentKeys.length !== 8 || parentRoles.length !== 8 || events.length !== 16) fail('ordered coverage');
  const memberGroups = groups(members, item => item.lineage_ordinal);
  const parentGroups = groups(parentKeys, item => item.lineage_ordinal + ':' + item.member_ordinal);
  const roleGroups = groups(parentRoles, item => item.lineage_ordinal + ':' + item.member_ordinal);
  const eventGroups = groups(events, item => item.lineage_ordinal + ':' + item.member_ordinal);
  const orderGroups = new Map();
  for (const item of keyOrders) {
    if (!orderGroups.has(item.object_pointer)) orderGroups.set(item.object_pointer, []);
    orderGroups.get(item.object_pointer).push(item);
  }
  const seenPointers = new Set();
  const order = (value, path) => {
    if (Array.isArray(value)) return value.map((entry, index) => order(entry, pointer(path, index)));
    if (value === null || typeof value !== 'object') return value;
    seenPointers.add(path);
    const keys = orderGroups.get(path) ?? [];
    if (keys.length !== Object.keys(value).length || keys.some((item, index) => item.ordinal !== index || !Object.hasOwn(value, item.object_key))) fail('key order:' + path);
    return Object.fromEntries(keys.map(item => [item.object_key, order(value[item.object_key], pointer(path, item.object_key))]));
  };
  const document = {
    schema: row.schema,
    sourceKind: row.source_kind,
    authorization: row.authorization,
    collapseDate: row.collapse_date,
    openingYear: row.opening_year,
    ageAsOf: row.age_as_of,
    generationIntervalYears: row.generation_interval_years,
    generationIntervalExceptions: [],
    sourceDocument: row.source_document,
    lineages: lineages.map((lineage, lineageOrdinal) => {
      const lineageMembers = ordered(memberGroups.get(lineageOrdinal) ?? [], 'member');
      if (lineageMembers.length !== 4 || !text(lineage.lineage_key) || !text(lineage.current_person_id)) fail('lineage row');
      return {
        key: lineage.lineage_key,
        currentPersonId: lineage.current_person_id,
        members: lineageMembers.map((member, memberOrdinal) => {
          const id = lineageOrdinal + ':' + memberOrdinal;
          if (member.lineage_ordinal !== lineageOrdinal || !text(member.member_key) || !integer(member.generation)
            || ![0, 1].includes(member.has_parent_roles)) fail('member row');
          const parents = ordered(parentGroups.get(id) ?? [], 'parent key').map(item => {
            if (!text(item.parent_key)) fail('parent key row');
            return item.parent_key;
          });
          const roles = ordered(roleGroups.get(id) ?? [], 'parent role');
          const memberEvents = ordered(eventGroups.get(id) ?? [], 'event').map(item => {
            if (!integer(item.year) || !text(item.kind) || (item.event_date !== null && !text(item.event_date))) fail('event row');
            return item.event_date === null ? { year: item.year, kind: item.kind } : { year: item.year, kind: item.kind, date: item.event_date };
          });
          const value = {
            key: member.member_key,
            generation: member.generation,
            name: bilingual(member.name_ko, member.name_en),
            birthDate: member.birth_date,
            parentKeys: parents,
            timelineBio: bilingual(member.timeline_bio_ko, member.timeline_bio_en),
            narrative: bilingual(member.narrative_ko, member.narrative_en),
            events: memberEvents,
          };
          if (member.has_parent_roles) {
            if (roles.length !== parents.length || roles.some((item, index) => item.parent_key !== parents[index] || !text(item.role))) fail('parent role coverage');
            value.parentRoles = Object.fromEntries(roles.map(item => [item.parent_key, item.role]));
          } else if (roles.length !== 0 || parents.length !== 0) fail('ancestor parent coverage');
          if (member.person_id !== null) {
            if (!text(member.person_id) || member.has_parent_roles !== 1) fail('person id');
            value.personId = member.person_id;
          } else if (memberOrdinal === 3) fail('present person id');
          return value;
        }),
      };
    }),
  };
  const orderedDocument = order(document, '');
  if (seenPointers.size !== orderGroups.size || [...orderGroups.keys()].some(path => !seenPointers.has(path))) fail('unused key order');
  shape(orderedDocument);
  return orderedDocument;
}
