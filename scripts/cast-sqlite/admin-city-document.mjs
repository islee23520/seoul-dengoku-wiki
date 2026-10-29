import { createHash } from 'node:crypto';


const LOGICAL_PATH = 'scripts/data/admin-city-hierarchy.json';
const CODE = 'E_ADMIN_CITY_DOCUMENT';

const ROOT_KEYS = ['schema', 'approvedBoundarySha256', 'effectiveDate', 'proofMethod', 'vintageNotes', 'rows'];
const ROW_KEYS = [
  'districtId', 'parentCityId', 'districtName', 'parentCityName', 'status',
  'municipalSource', 'establishmentSource', 'moisIdentity', 'districtCodeEffectiveFrom', 'affectedLeafIds',
];
const MUNICIPAL_KEYS = ['url', 'exactText', 'sourceAsOfOrModified', 'retrievedOn', 'retrievedTextSha256', 'assertionForm'];
const ESTABLISHMENT_KEYS = ['url', 'exactText', 'effectiveDate'];
const MOIS_KEYS = [
  'releaseUrl', 'attachmentUrl', 'zipSha256', 'tableName', 'tableSha256', 'effectiveDate',
  'districtCode10', 'cityCode10', 'districtSourceRow', 'citySourceRow',
];
const SOURCE_ROW_KEYS = ['row', 'code', 'province', 'name', 'dong', 'created', 'abolished'];
const DISTRICT_COUNT = 30;
const VINTAGE_COUNT = 6;
const ESTABLISHMENT_COUNT = 7;
const MUNICIPAL_TEXT_COUNT = 91;
const ESTABLISHMENT_TEXT_COUNT = 27;
const LEAF_COUNT = 373;

const KEY_SHAPES = [
  ['', ROOT_KEYS],
  ...Array.from({ length: DISTRICT_COUNT }, (_, ordinal) => [`/rows/${ordinal}`, ROW_KEYS]),
  ...Array.from({ length: DISTRICT_COUNT }, (_, ordinal) => [`/rows/${ordinal}/municipalSource`, MUNICIPAL_KEYS]),
  ...[6, 7, 8, 9, 27, 28, 29].map(ordinal => [`/rows/${ordinal}/establishmentSource`, ESTABLISHMENT_KEYS]),
  ...Array.from({ length: DISTRICT_COUNT }, (_, ordinal) => [`/rows/${ordinal}/moisIdentity`, MOIS_KEYS]),
  ...Array.from({ length: DISTRICT_COUNT }, (_, ordinal) => [`/rows/${ordinal}/moisIdentity/districtSourceRow`, SOURCE_ROW_KEYS]),
  ...Array.from({ length: DISTRICT_COUNT }, (_, ordinal) => [`/rows/${ordinal}/moisIdentity/citySourceRow`, SOURCE_ROW_KEYS]),
];

const COUNTS = {
  document: 1,
  vintage_note: VINTAGE_COUNT,
  district: DISTRICT_COUNT,
  municipal_source: DISTRICT_COUNT,
  municipal_text: MUNICIPAL_TEXT_COUNT,
  establishment_source: ESTABLISHMENT_COUNT,
  establishment_text: ESTABLISHMENT_TEXT_COUNT,
  mois_identity: DISTRICT_COUNT,
  source_row: DISTRICT_COUNT * 2,
  leaf: LEAF_COUNT,
  key: KEY_SHAPES.reduce((sum, [, keys]) => sum + keys.length, 0),
};
COUNTS.totalRows = Object.values(COUNTS).reduce((sum, value) => sum + value, 0);

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => {
  throw Object.assign(new Error(`${CODE}: ${detail}`), { code: CODE });
};
const text = value => typeof value === 'string';
const nonEmpty = value => typeof value === 'string' && value.length > 0;
const integer = value => Number.isSafeInteger(value);
const plain = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const sameKeys = (value, expected) => plain(value) && JSON.stringify(Object.keys(value)) === JSON.stringify(expected);
const sha256 = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const digits = (value, length) => typeof value === 'string' && value.length === length && /^[0-9]+$/.test(value);
const stringList = value => Array.isArray(value) && value.every(item => nonEmpty(item));
const receiptOf = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));
const sourceHashOf = new WeakMap();

function sourceRow(value, label) {
  if (!sameKeys(value, SOURCE_ROW_KEYS)) fail(`${label} fields`);
  if (!integer(value.row) || value.row < 0) fail(`${label} row`);
  if (!digits(value.code, 10) || !nonEmpty(value.province) || !nonEmpty(value.name)) fail(`${label} identity`);
  if (!text(value.dong) || !text(value.created) || !text(value.abolished)) fail(`${label} lifecycle`);
}

function shape(document) {
  if (!sameKeys(document, ROOT_KEYS)) fail('unknown, missing, or unordered root fields');
  if (!nonEmpty(document.schema) || !sha256(document.approvedBoundarySha256) || !nonEmpty(document.effectiveDate) || !nonEmpty(document.proofMethod)) fail('root scalars');
  if (!stringList(document.vintageNotes) || document.vintageNotes.length !== VINTAGE_COUNT) fail('vintage notes');
  if (!Array.isArray(document.rows) || document.rows.length !== DISTRICT_COUNT) fail('district rows');
  let municipalTexts = 0;
  let establishmentTexts = 0;
  let establishments = 0;
  let leaves = 0;
  for (const row of document.rows) {
    if (!sameKeys(row, ROW_KEYS)) fail('district fields');
    if (!digits(row.districtId, 5) || !digits(row.parentCityId, 5) || !nonEmpty(row.districtName) || !nonEmpty(row.parentCityName)) fail('district identity');
    if (!nonEmpty(row.status) || !nonEmpty(row.districtCodeEffectiveFrom)) fail('district status');
    const municipal = row.municipalSource;
    if (!sameKeys(municipal, MUNICIPAL_KEYS)) fail('municipal fields');
    if (!nonEmpty(municipal.url) || !stringList(municipal.exactText) || municipal.exactText.length === 0) fail('municipal text');
    if (!(municipal.sourceAsOfOrModified === null || nonEmpty(municipal.sourceAsOfOrModified))) fail('municipal date');
    if (!nonEmpty(municipal.retrievedOn) || !sha256(municipal.retrievedTextSha256) || !nonEmpty(municipal.assertionForm)) fail('municipal retrieval');
    municipalTexts += municipal.exactText.length;
    if (row.establishmentSource === null) {
      /* authored absence stays null */
    } else {
      if (!sameKeys(row.establishmentSource, ESTABLISHMENT_KEYS)) fail('establishment fields');
      if (!nonEmpty(row.establishmentSource.url) || !stringList(row.establishmentSource.exactText) || row.establishmentSource.exactText.length === 0) fail('establishment text');
      if (!nonEmpty(row.establishmentSource.effectiveDate)) fail('establishment date');
      establishments += 1;
      establishmentTexts += row.establishmentSource.exactText.length;
    }
    const mois = row.moisIdentity;
    if (!sameKeys(mois, MOIS_KEYS)) fail('mois fields');
    if (![mois.releaseUrl, mois.attachmentUrl, mois.tableName, mois.effectiveDate].every(nonEmpty)) fail('mois text');
    if (!sha256(mois.zipSha256) || !sha256(mois.tableSha256)) fail('mois hashes');
    if (!digits(mois.districtCode10, 10) || !digits(mois.cityCode10, 10)) fail('mois codes');
    sourceRow(mois.districtSourceRow, 'district source');
    sourceRow(mois.citySourceRow, 'city source');
    if (!stringList(row.affectedLeafIds) || row.affectedLeafIds.length === 0 || row.affectedLeafIds.some(id => !digits(id, 10))) fail('affected leaves');
    leaves += row.affectedLeafIds.length;
  }
  if (municipalTexts !== MUNICIPAL_TEXT_COUNT || establishments !== ESTABLISHMENT_COUNT || establishmentTexts !== ESTABLISHMENT_TEXT_COUNT || leaves !== LEAF_COUNT) fail('cardinality');
  const unique = values => new Set(values).size === values.length;
  if (!unique(document.rows.map(row => row.districtId)) || !unique(document.rows.flatMap(row => row.affectedLeafIds))) fail('duplicate identity');
}

function decode(sourceBytes) {
  let document;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  } catch {
    fail('source bytes');
  }
  shape(document);
  return document;
}

function insertDocument(db, document, actor, reason) {
  db.prepare(`INSERT INTO admin_city_document_document (
    document_id, source_sha256, document_sha256, "schema", approved_boundary_sha256, effective_date, proof_method,
    actor, reason, receipt_sha256
  ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    sourceHashOf.get(document),
    hash(JSON.stringify(document)),
    document.schema,
    document.approvedBoundarySha256,
    document.effectiveDate,
    document.proofMethod,
    actor,
    reason,
    receiptOf(sourceHashOf.get(document), hash(JSON.stringify(document)), actor, reason),
  );
  const vintage = db.prepare('INSERT INTO admin_city_document_vintage_note (ordinal, note) VALUES (?, ?)');
  document.vintageNotes.forEach((note, ordinal) => vintage.run(ordinal, note));
  const district = db.prepare(`INSERT INTO admin_city_document_district (
    ordinal, district_id, parent_city_id, district_name, parent_city_name, status, district_code_effective_from, has_establishment_source
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const municipal = db.prepare(`INSERT INTO admin_city_document_municipal_source (
    district_ordinal, url, source_as_of_or_modified, retrieved_on, retrieved_text_sha256, assertion_form
  ) VALUES (?, ?, ?, ?, ?, ?)`);
  const municipalText = db.prepare('INSERT INTO admin_city_document_municipal_text (district_ordinal, ordinal, exact_text) VALUES (?, ?, ?)');
  const establishment = db.prepare('INSERT INTO admin_city_document_establishment_source (district_ordinal, url, effective_date) VALUES (?, ?, ?)');
  const establishmentText = db.prepare('INSERT INTO admin_city_document_establishment_text (district_ordinal, ordinal, exact_text) VALUES (?, ?, ?)');
  const mois = db.prepare(`INSERT INTO admin_city_document_mois_identity (
    district_ordinal, release_url, attachment_url, zip_sha256, table_name, table_sha256, effective_date, district_code10, city_code10
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const source = db.prepare(`INSERT INTO admin_city_document_source_row (
    district_ordinal, side, source_row, code, province, name, dong, created, abolished
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const leaf = db.prepare('INSERT INTO admin_city_document_leaf (district_ordinal, ordinal, leaf_id) VALUES (?, ?, ?)');
  document.rows.forEach((row, ordinal) => {
    district.run(
      ordinal, row.districtId, row.parentCityId, row.districtName, row.parentCityName, row.status,
      row.districtCodeEffectiveFrom, row.establishmentSource === null ? 0 : 1,
    );
    municipal.run(
      ordinal, row.municipalSource.url, row.municipalSource.sourceAsOfOrModified, row.municipalSource.retrievedOn,
      row.municipalSource.retrievedTextSha256, row.municipalSource.assertionForm,
    );
    row.municipalSource.exactText.forEach((exactText, index) => municipalText.run(ordinal, index, exactText));
    if (row.establishmentSource !== null) {
      establishment.run(ordinal, row.establishmentSource.url, row.establishmentSource.effectiveDate);
      row.establishmentSource.exactText.forEach((exactText, index) => establishmentText.run(ordinal, index, exactText));
    }
    const identity = row.moisIdentity;
    mois.run(
      ordinal, identity.releaseUrl, identity.attachmentUrl, identity.zipSha256, identity.tableName,
      identity.tableSha256, identity.effectiveDate, identity.districtCode10, identity.cityCode10,
    );
    for (const [side, record] of [['district', identity.districtSourceRow], ['city', identity.citySourceRow]]) {
      source.run(ordinal, side, record.row, record.code, record.province, record.name, record.dong, record.created, record.abolished);
    }
    row.affectedLeafIds.forEach((leafId, index) => leaf.run(ordinal, index, leafId));
  });
  const keyInsert = db.prepare('INSERT INTO admin_city_document_key (object_path, ordinal, key) VALUES (?, ?, ?)');
  for (const [objectPath, keys] of KEY_SHAPES) keys.forEach((key, ordinal) => keyInsert.run(objectPath, ordinal, key));
}

function acceptSingle(options) {
  if (!plain(options)) fail('input');
  const extra = Object.keys(options).filter(key => !['schemaSql', 'sourceBytes', 'actor', 'reason'].includes(key));
  if (extra.length) fail('unknown initializer fields');
  const { schemaSql, sourceBytes, actor, reason } = options;
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('schema');
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('provenance input');
  const document = decode(sourceBytes);
  sourceHashOf.set(document, hash(sourceBytes));
  return document;
}

function acceptMany(options) {
  if (!plain(options)) fail('input');
  const extra = Object.keys(options).filter(key => !['schemaSql', 'sources', 'actor', 'reason'].includes(key));
  if (extra.length) fail('unknown initializer fields');
  const { schemaSql, sources, actor, reason } = options;
  if (typeof schemaSql !== 'string' || !schemaSql.trim()) fail('schema');
  if (typeof actor !== 'string' || !actor.trim() || typeof reason !== 'string' || !reason.trim()) fail('provenance input');
  if (!plain(sources) || Object.keys(sources).length !== 1 || !Object.hasOwn(sources, LOGICAL_PATH)) fail('source paths');
  const source = sources[LOGICAL_PATH];
  if (!plain(source) || JSON.stringify(Object.keys(source)) !== JSON.stringify(['bytes'])) fail('source entry');
  return acceptSingle({
    schemaSql, sourceBytes: source.bytes, actor, reason,
  });
}

function write(db, schemaSql, document, actor, reason) {
  if (db.isTransaction) fail('transaction');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    insertDocument(db, document, actor, reason);
    const actual = assemble(db);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail('transaction parity');
    db.exec('COMMIT');
    return {
      documents: COUNTS.document,
      vintageNotes: COUNTS.vintage_note,
      districts: COUNTS.district,
      municipalSources: COUNTS.municipal_source,
      municipalTexts: COUNTS.municipal_text,
      establishmentSources: COUNTS.establishment_source,
      establishmentTexts: COUNTS.establishment_text,
      moisIdentities: COUNTS.mois_identity,
      sourceRows: COUNTS.source_row,
      leaves: COUNTS.leaf,
      keys: COUNTS.key,
      totalRows: COUNTS.totalRows,
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Import exactly one bounded source. Does not infer missing fields, drop outside-Seoul rows, or approve publication.
 * Single-source: { schemaSql, sourceBytes, actor, reason }.
 * Multiple-source: { schemaSql, sources, actor, reason } with sources[path] = { bytes }.
 */
export function initializeAdminCityDocument(db, options = {}) {
  if (!plain(options)) fail('input');
  if (Object.hasOwn(options, 'sources')) {
    const document = acceptMany(options);
    return write(db, options.schemaSql, document, options.actor, options.reason);
  }
  const document = acceptSingle(options);
  return write(db, options.schemaSql, document, options.actor, options.reason);
}

const ordered = (db, sql, count, label) => {
  const rows = db.prepare(sql).all();
  if (rows.length !== count || rows.some((row, index) => row.ordinal !== index)) fail(`${label} coverage`);
  return rows;
};

function grouped(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const list = groups.get(row[key]) ?? [];
    list.push(row);
    groups.set(row[key], list);
  }
  return groups;
}

function textsFor(groups, districtOrdinal, label) {
  const owned = groups.get(districtOrdinal) ?? [];
  if (owned.some((row, index) => row.ordinal !== index || !nonEmpty(row.exact_text))) fail(`${label} order`);
  if (owned.length === 0) fail(`${label} coverage`);
  return owned.map(row => row.exact_text);
}

function sourceRecord(row, label) {
  if (!integer(row.source_row) || row.source_row < 0 || !digits(row.code, 10) || !nonEmpty(row.province) || !nonEmpty(row.name)) fail(`${label} identity`);
  if (!text(row.dong) || !text(row.created) || !text(row.abolished)) fail(`${label} lifecycle`);
  return {
    row: row.source_row,
    code: row.code,
    province: row.province,
    name: row.name,
    dong: row.dong,
    created: row.created,
    abolished: row.abolished,
  };
}

function consumeKeys(rows, objectPath, expected) {
  const owned = rows.filter(row => row.object_path === objectPath);
  if (owned.length !== expected.length || owned.some((row, index) => row.ordinal !== index || row.key !== expected[index])) fail(`${objectPath || 'root'} key order`);
  return owned.length;
}

function assemble(db) {
  const documents = db.prepare('SELECT document_id, source_sha256, document_sha256, "schema", approved_boundary_sha256, effective_date, proof_method, actor, reason, receipt_sha256 FROM admin_city_document_document').all();
  if (documents.length !== 1) fail('document count');
  const root = documents[0];
  if (root.document_id !== 1) fail('document id');
  if (!nonEmpty(root.schema) || !sha256(root.approved_boundary_sha256) || !nonEmpty(root.effective_date) || !nonEmpty(root.proof_method)) fail('root scalars');
  if (typeof root.actor !== 'string' || !root.actor.trim() || typeof root.reason !== 'string' || !root.reason.trim()) fail('provenance');
  const vintageNotes = ordered(db, 'SELECT ordinal, note FROM admin_city_document_vintage_note ORDER BY ordinal', VINTAGE_COUNT, 'vintage').map(row => {
    if (!nonEmpty(row.note)) fail('vintage note');
    return row.note;
  });
  const districts = ordered(db, 'SELECT ordinal, district_id, parent_city_id, district_name, parent_city_name, status, district_code_effective_from, has_establishment_source FROM admin_city_document_district ORDER BY ordinal', DISTRICT_COUNT, 'district');
  const municipals = db.prepare('SELECT district_ordinal, url, source_as_of_or_modified, retrieved_on, retrieved_text_sha256, assertion_form FROM admin_city_document_municipal_source ORDER BY district_ordinal').all();
  const municipalTexts = db.prepare('SELECT district_ordinal, ordinal, exact_text FROM admin_city_document_municipal_text ORDER BY district_ordinal, ordinal').all();
  const establishments = db.prepare('SELECT district_ordinal, url, effective_date FROM admin_city_document_establishment_source ORDER BY district_ordinal').all();
  const establishmentTexts = db.prepare('SELECT district_ordinal, ordinal, exact_text FROM admin_city_document_establishment_text ORDER BY district_ordinal, ordinal').all();
  const identities = db.prepare('SELECT district_ordinal, release_url, attachment_url, zip_sha256, table_name, table_sha256, effective_date, district_code10, city_code10 FROM admin_city_document_mois_identity ORDER BY district_ordinal').all();
  const sourceRows = db.prepare('SELECT district_ordinal, side, source_row, code, province, name, dong, created, abolished FROM admin_city_document_source_row ORDER BY district_ordinal, side').all();
  const leaves = db.prepare('SELECT district_ordinal, ordinal, leaf_id FROM admin_city_document_leaf ORDER BY district_ordinal, ordinal').all();
  if (municipals.length !== DISTRICT_COUNT || municipalTexts.length !== MUNICIPAL_TEXT_COUNT) fail('municipal coverage');
  if (establishments.length !== ESTABLISHMENT_COUNT || establishmentTexts.length !== ESTABLISHMENT_TEXT_COUNT) fail('establishment coverage');
  if (identities.length !== DISTRICT_COUNT || sourceRows.length !== DISTRICT_COUNT * 2 || leaves.length !== LEAF_COUNT) fail('identity coverage');
  const municipalByDistrict = new Map(municipals.map(row => [row.district_ordinal, row]));
  const establishmentByDistrict = new Map(establishments.map(row => [row.district_ordinal, row]));
  const identityByDistrict = new Map(identities.map(row => [row.district_ordinal, row]));
  const municipalTextGroups = grouped(municipalTexts, 'district_ordinal');
  const establishmentTextGroups = grouped(establishmentTexts, 'district_ordinal');
  const sourceGroups = grouped(sourceRows, 'district_ordinal');
  const leafGroups = grouped(leaves, 'district_ordinal');
  const establishmentFlags = new Set(districts.map(row => row.has_establishment_source));
  if (establishmentFlags.size !== 2 || [...establishmentFlags].some(bit => bit !== 0 && bit !== 1)) fail('establishment flag');
  const rows = districts.map(district => {
    if (!digits(district.district_id, 5) || !digits(district.parent_city_id, 5) || !nonEmpty(district.district_name) || !nonEmpty(district.parent_city_name)) fail('district identity');
    if (!nonEmpty(district.status) || !nonEmpty(district.district_code_effective_from) || ![0, 1].includes(district.has_establishment_source)) fail('district status');
    const municipal = municipalByDistrict.get(district.ordinal);
    if (!municipal || !nonEmpty(municipal.url) || !(municipal.source_as_of_or_modified === null || nonEmpty(municipal.source_as_of_or_modified))) fail('municipal row');
    if (!nonEmpty(municipal.retrieved_on) || !sha256(municipal.retrieved_text_sha256) || !nonEmpty(municipal.assertion_form)) fail('municipal retrieval');
    const exactText = textsFor(municipalTextGroups, district.ordinal, 'municipal text');
    let establishmentSource = null;
    const establishment = establishmentByDistrict.get(district.ordinal);
    if (district.has_establishment_source === 0) {
      if (establishment || establishmentTextGroups.has(district.ordinal)) fail('absent establishment');
    } else {
      if (!establishment || !nonEmpty(establishment.url) || !nonEmpty(establishment.effective_date)) fail('establishment row');
      establishmentSource = {
        url: establishment.url,
        exactText: textsFor(establishmentTextGroups, district.ordinal, 'establishment text'),
        effectiveDate: establishment.effective_date,
      };
    }
    const identity = identityByDistrict.get(district.ordinal);
    if (!identity || ![identity.release_url, identity.attachment_url, identity.table_name, identity.effective_date].every(nonEmpty)) fail('mois row');
    if (!sha256(identity.zip_sha256) || !sha256(identity.table_sha256) || !digits(identity.district_code10, 10) || !digits(identity.city_code10, 10)) fail('mois codes');
    const ownedSources = sourceGroups.get(district.ordinal) ?? [];
    if (ownedSources.length !== 2 || ownedSources[0].side !== 'city' || ownedSources[1].side !== 'district') fail('source row order');
    const leafRows = leafGroups.get(district.ordinal) ?? [];
    if (leafRows.length === 0 || leafRows.some((row, index) => row.ordinal !== index || !digits(row.leaf_id, 10))) fail('leaf order');
    return {
      districtId: district.district_id,
      parentCityId: district.parent_city_id,
      districtName: district.district_name,
      parentCityName: district.parent_city_name,
      status: district.status,
      municipalSource: {
        url: municipal.url,
        exactText,
        sourceAsOfOrModified: municipal.source_as_of_or_modified,
        retrievedOn: municipal.retrieved_on,
        retrievedTextSha256: municipal.retrieved_text_sha256,
        assertionForm: municipal.assertion_form,
      },
      establishmentSource,
      moisIdentity: {
        releaseUrl: identity.release_url,
        attachmentUrl: identity.attachment_url,
        zipSha256: identity.zip_sha256,
        tableName: identity.table_name,
        tableSha256: identity.table_sha256,
        effectiveDate: identity.effective_date,
        districtCode10: identity.district_code10,
        cityCode10: identity.city_code10,
        districtSourceRow: sourceRecord(ownedSources[1], 'district source'),
        citySourceRow: sourceRecord(ownedSources[0], 'city source'),
      },
      districtCodeEffectiveFrom: district.district_code_effective_from,
      affectedLeafIds: leafRows.map(row => row.leaf_id),
    };
  });
  const keyRows = db.prepare('SELECT object_path, ordinal, key FROM admin_city_document_key ORDER BY object_path, ordinal').all();
  if (keyRows.length !== COUNTS.key) fail('key coverage');
  let consumed = 0;
  for (const [objectPath, keys] of KEY_SHAPES) consumed += consumeKeys(keyRows, objectPath, keys);
  if (consumed !== keyRows.length) fail('unconsumed key rows');
  const document = {
    schema: root.schema,
    approvedBoundarySha256: root.approved_boundary_sha256,
    effectiveDate: root.effective_date,
    proofMethod: root.proof_method,
    vintageNotes,
    rows,
  };
  shape(document);
  return document;
}

/**
 * SELECT-only reconstruction. No filesystem, archive, JSON.parse, or writes.
 * Options: optional { logicalPath }.
 */
export function readAdminCityDocument(db, options = {}) {
  if (!plain(options)) fail('input');
  const keys = Object.keys(options);
  if (keys.some(key => key !== 'logicalPath')) fail('reader fields');
  if (keys.includes('logicalPath') && options.logicalPath !== LOGICAL_PATH) fail('logical path');
  try {
    return assemble(db);
  } catch (error) {
    if (error.code === CODE) throw error;
    fail(error.message);
  }
}
