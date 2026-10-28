import { createHash } from 'node:crypto';


const ROOT_FIELDS = ['seed', 'n', 'parquet', 'provenance', 'by_state', 'by_livelihood', 'hangnyeol_on', 'people'];
const PROVENANCE_FIELDS = ['dataset', 'datasetUrl', 'localPathNote', 'license', 'revision', 'rowIdentity', 'transformation', 'status'];
const STATE_FIELDS = ['동방사', '명부교회', '명동대교구', '중앙정보부', '규격맹', '안국총림', '대한민국정부', '성하그룹', '아관사', '수문국', '정동노총', '여의도출자연합회', '태욱그룹', '흰십자단', '신내운수', '환적국'];
const LIVELIHOOD_FIELDS = ['전령', '순찰대', '의무원', '물류상', '기록관', '정비사', '탐사원'];
const PERSON_FIELDS = ['id', 'source_uuid', '성명', '성', '이름', '본관', '항렬자', 'sex', 'age', '출신 공동체', '언어', '생업', '소속', '직위', '징집 이력', '무장 접근', 'culture_key', '회랑', '성격', '개인 야망', '공포', '통치·교섭 방식', '핵심 관계', '촉발 사건', 'occupation_src', 'military_src'];
const PERSON_TEXT = ['id', 'source_uuid', '성명', '성', '이름', 'sex', '출신 공동체', '언어', '생업', '소속', '직위', '징집 이력', '무장 접근', 'culture_key', '성격', '개인 야망', '공포', '통치·교섭 방식', '핵심 관계', '촉발 사건', 'occupation_src', 'military_src'];
const NULLABLE = ['본관', '항렬자', '회랑'];
const PERSON_COUNT = 100;
const STATE_COUNT = STATE_FIELDS.length;
const LIVELIHOOD_COUNT = LIVELIHOOD_FIELDS.length;
const KEY_COUNT = ROOT_FIELDS.length + PROVENANCE_FIELDS.length + STATE_FIELDS.length + LIVELIHOOD_FIELDS.length + PERSON_COUNT * PERSON_FIELDS.length;
const COUNTS = {
  candidate_roster_document_root: 1,
  candidate_roster_document_provenance: 1,
  candidate_roster_document_state_count: STATE_COUNT,
  candidate_roster_document_livelihood_count: LIVELIHOOD_COUNT,
  candidate_roster_document_person: PERSON_COUNT,
  candidate_roster_document_key: KEY_COUNT,
};

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_CANDIDATE_ROSTER_DOCUMENT: ${detail}`), { code: 'E_CANDIDATE_ROSTER_DOCUMENT' }); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const text = value => typeof value === 'string' && value.length > 0;
const integer = value => Number.isSafeInteger(value) && Object.is(value, value) && String(value) === JSON.stringify(value);

function exactKeys(value, fields, path) {
  if (!object(value)) fail(`object: ${path}`);
  const keys = Object.keys(value);
  if (JSON.stringify(keys) !== JSON.stringify(fields)) fail(`unknown, missing, or unordered fields: ${path}`);
}

function exactMap(value, fields, path) {
  exactKeys(value, fields, path);
  for (const key of fields) if (!integer(value[key])) fail(`type: ${path}/${key}`);
}

function nullableText(value, path) {
  if (value !== null && !text(value)) fail(`type: ${path}`);
}

function shapePerson(person, path) {
  exactKeys(person, PERSON_FIELDS, path);
  for (const key of PERSON_TEXT) if (!text(person[key])) fail(`type: ${path}/${key}`);
  if (!integer(person.age)) fail(`type: ${path}/age`);
  for (const key of NULLABLE) nullableText(person[key], `${path}/${key}`);
  if (person['회랑'] !== null) fail(`null: ${path}/회랑`);
}

function shape(document) {
  exactKeys(document, ROOT_FIELDS, '');
  if (!integer(document.seed) || !integer(document.n) || !integer(document.hangnyeol_on) || !text(document.parquet)) fail('root scalars');
  exactKeys(document.provenance, PROVENANCE_FIELDS, '/provenance');
  for (const key of PROVENANCE_FIELDS) if (!text(document.provenance[key])) fail(`type: /provenance/${key}`);
  exactMap(document.by_state, STATE_FIELDS, '/by_state');
  exactMap(document.by_livelihood, LIVELIHOOD_FIELDS, '/by_livelihood');
  if (!Array.isArray(document.people) || document.people.length !== PERSON_COUNT) fail('people');
  document.people.forEach((person, index) => shapePerson(person, `/people/${index}`));
  const present = field => document.people.filter(person => person[field] !== null).length;
  if (present('본관') !== document.hangnyeol_on || present('항렬자') !== document.hangnyeol_on) fail('hangnyeol coverage');
  if (document.people.some(person => person['회랑'] !== null)) fail('corridor null');
}

const receipt = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));

function insertKeys(db, objectPath, value) {
  Object.keys(value).forEach((key, ordinal) => {
    db.prepare('INSERT INTO candidate_roster_document_key VALUES (?,?,?)').run(objectPath, ordinal, key);
  });
}

function storedNull(value) {
  return [1, value];
}

/** Import only the exact original roster. This does not issue people or approve content. */
export function initializeCandidateRosterDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array)) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO candidate_roster_document_root VALUES (1,?,?,?,?,?,?,?,?,?)').run(
      sourceHash, documentHash, document.seed, document.n, document.parquet, document.hangnyeol_on,
      actor, reason, receipt(sourceHash, documentHash, actor, reason),
    );
    insertKeys(db, '$', document);
    const provenance = document.provenance;
    db.prepare('INSERT INTO candidate_roster_document_provenance VALUES (1,?,?,?,?,?,?,?,?)').run(
      provenance.dataset, provenance.datasetUrl, provenance.localPathNote, provenance.license,
      provenance.revision, provenance.rowIdentity, provenance.transformation, provenance.status,
    );
    insertKeys(db, '$.provenance', provenance);
    Object.entries(document.by_state).forEach(([stateKey, count], ordinal) => {
      db.prepare('INSERT INTO candidate_roster_document_state_count VALUES (?,?,?,?)').run(ordinal, 1, stateKey, count);
    });
    insertKeys(db, '$.by_state', document.by_state);
    Object.entries(document.by_livelihood).forEach(([livelihoodKey, count], ordinal) => {
      db.prepare('INSERT INTO candidate_roster_document_livelihood_count VALUES (?,?,?,?)').run(ordinal, 1, livelihoodKey, count);
    });
    insertKeys(db, '$.by_livelihood', document.by_livelihood);
    const insertPerson = db.prepare(`INSERT INTO candidate_roster_document_person (
      ordinal, document_id, id, source_uuid, full_name, surname, given_name,
      bongwan_present, bongwan, hangnyeol_present, hangnyeol, sex, age, origin_community,
      language, livelihood, affiliation, post, conscription_history, armament_access,
      culture_key, corridor_present, corridor, personality, personal_ambition, fear,
      negotiation_method, core_relation, trigger_event, occupation_src, military_src
    ) VALUES (${Array(31).fill('?').join(',')})`);
    document.people.forEach((person, ordinal) => {
      const [bongwanPresent, bongwan] = storedNull(person['본관']);
      const [hangnyeolPresent, hangnyeol] = storedNull(person['항렬자']);
      const [corridorPresent, corridor] = storedNull(person['회랑']);
      insertPerson.run(
        ordinal, 1, person.id, person.source_uuid, person['성명'], person['성'], person['이름'],
        bongwanPresent, bongwan, hangnyeolPresent, hangnyeol, person.sex, person.age, person['출신 공동체'],
        person['언어'], person['생업'], person['소속'], person['직위'], person['징집 이력'], person['무장 접근'],
        person.culture_key, corridorPresent, corridor, person['성격'], person['개인 야망'], person['공포'],
        person['통치·교섭 방식'], person['핵심 관계'], person['촉발 사건'], person.occupation_src, person.military_src,
      );
      insertKeys(db, `$.people[${ordinal}]`, person);
    });
    const read = readCandidateRosterDocument(db);
    if (JSON.stringify(read) !== JSON.stringify(document)) fail('transaction parity');
    db.exec('COMMIT');
    return {
      documents: 1,
      provenance: 1,
      states: STATE_COUNT,
      livelihoods: LIVELIHOOD_COUNT,
      people: PERSON_COUNT,
      keys: KEY_COUNT,
      totalRows: Object.values(COUNTS).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function rows(db, sql) {
  if (!/^SELECT\b/u.test(sql)) fail('runtime statement');
  return db.prepare(sql).all();
}

function ordered(result, label) {
  if (result.some((row, index) => row.ordinal !== index)) fail(`${label} order`);
  return result;
}

function parented(result, label) {
  if (result.some(row => row.document_id !== 1)) fail(`${label} parent`);
  return result;
}

function keysFor(keyRows, objectPath, expected, label) {
  const actual = keyRows.filter(row => row.object_path === objectPath);
  if (actual.length !== expected.length || actual.some((row, index) => row.ordinal !== index || row.key !== expected[index])) fail(`${label} key order`);
}

function authoredNull(flag, value, label, { allowText }) {
  if (flag !== 1) fail(`${label} presence`);
  if (value === null) return null;
  if (!allowText || !text(value)) fail(`${label} text`);
  return value;
}

/** SELECT-only reconstruction: no source I/O, archive decoding, or JSON parsing. */
export function readCandidateRosterDocument(db) {
  const documents = rows(db, 'SELECT * FROM candidate_roster_document_root');
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  if (row.document_id !== 1
    || !text(row.actor) || !row.actor.trim() || !text(row.reason) || !row.reason.trim()
    || !integer(row.seed) || !integer(row.n) || !integer(row.hangnyeol_on) || !text(row.parquet)) fail('provenance');
  const provenanceRows = rows(db, 'SELECT * FROM candidate_roster_document_provenance');
  if (provenanceRows.length !== 1 || provenanceRows[0].document_id !== 1) fail('provenance row');
  const provenanceRow = provenanceRows[0];
  const states = parented(ordered(rows(db, 'SELECT * FROM candidate_roster_document_state_count ORDER BY ordinal'), 'state'), 'state');
  const livelihoods = parented(ordered(rows(db, 'SELECT * FROM candidate_roster_document_livelihood_count ORDER BY ordinal'), 'livelihood'), 'livelihood');
  const people = parented(ordered(rows(db, 'SELECT * FROM candidate_roster_document_person ORDER BY ordinal'), 'person'), 'person');
  const keyRows = rows(db, 'SELECT object_path, ordinal, key FROM candidate_roster_document_key ORDER BY object_path, ordinal');
  if (states.length !== STATE_COUNT || livelihoods.length !== LIVELIHOOD_COUNT || people.length !== PERSON_COUNT) fail('consumed row counts');
  const provenance = {
    dataset: provenanceRow.dataset,
    datasetUrl: provenanceRow.dataset_url,
    localPathNote: provenanceRow.local_path_note,
    license: provenanceRow.license,
    revision: provenanceRow.revision,
    rowIdentity: provenanceRow.row_identity,
    transformation: provenanceRow.transformation,
    status: provenanceRow.status,
  };
  const byState = Object.fromEntries(states.map(item => {
    if (!text(item.state_key) || !integer(item.count_integer)) fail('state value');
    return [item.state_key, item.count_integer];
  }));
  const byLivelihood = Object.fromEntries(livelihoods.map(item => {
    if (!text(item.livelihood_key) || !integer(item.count_integer)) fail('livelihood value');
    return [item.livelihood_key, item.count_integer];
  }));
  const document = {
    seed: row.seed,
    n: row.n,
    parquet: row.parquet,
    provenance,
    by_state: byState,
    by_livelihood: byLivelihood,
    hangnyeol_on: row.hangnyeol_on,
    people: people.map(item => {
      const person = {
        id: item.id,
        source_uuid: item.source_uuid,
        '성명': item.full_name,
        '성': item.surname,
        '이름': item.given_name,
        '본관': authoredNull(item.bongwan_present, item.bongwan, 'bongwan', { allowText: true }),
        '항렬자': authoredNull(item.hangnyeol_present, item.hangnyeol, 'hangnyeol', { allowText: true }),
        sex: item.sex,
        age: item.age,
        '출신 공동체': item.origin_community,
        '언어': item.language,
        '생업': item.livelihood,
        '소속': item.affiliation,
        '직위': item.post,
        '징집 이력': item.conscription_history,
        '무장 접근': item.armament_access,
        culture_key: item.culture_key,
        '회랑': authoredNull(item.corridor_present, item.corridor, 'corridor', { allowText: false }),
        '성격': item.personality,
        '개인 야망': item.personal_ambition,
        '공포': item.fear,
        '통치·교섭 방식': item.negotiation_method,
        '핵심 관계': item.core_relation,
        '촉발 사건': item.trigger_event,
        occupation_src: item.occupation_src,
        military_src: item.military_src,
      };
      keysFor(keyRows, `$.people[${item.ordinal}]`, Object.keys(person), 'person');
      return person;
    }),
  };
  keysFor(keyRows, '$', Object.keys(document), 'document');
  keysFor(keyRows, '$.provenance', Object.keys(document.provenance), 'provenance');
  keysFor(keyRows, '$.by_state', Object.keys(document.by_state), 'state');
  keysFor(keyRows, '$.by_livelihood', Object.keys(document.by_livelihood), 'livelihood');
  const consumed = {
    candidate_roster_document_root: documents.length,
    candidate_roster_document_provenance: provenanceRows.length,
    candidate_roster_document_state_count: states.length,
    candidate_roster_document_livelihood_count: livelihoods.length,
    candidate_roster_document_person: people.length,
    candidate_roster_document_key: keyRows.length,
  };
  if (JSON.stringify(consumed) !== JSON.stringify(COUNTS)) fail('consumed row counts');
  const expectedKeys = Object.keys(document).length
    + Object.keys(document.provenance).length
    + Object.keys(document.by_state).length
    + Object.keys(document.by_livelihood).length
    + document.people.reduce((sum, person) => sum + Object.keys(person).length, 0);
  if (keyRows.length !== expectedKeys) fail('unconsumed key rows');
  shape(document);
  return document;
}
