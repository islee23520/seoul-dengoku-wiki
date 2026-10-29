import { createHash } from 'node:crypto';


const SOURCE_COUNT = 106;
const CLAN_COUNT = 303;
const SOURCE_REF_COUNT = 168;
const ROW_COUNT = 127;
const COUNTS = {
  clan_catalog_document_document: 1,
  clan_catalog_document_source: SOURCE_COUNT,
  clan_catalog_document_source_key: 836,
  clan_catalog_document_clan: CLAN_COUNT,
  clan_catalog_document_clan_key: 2727,
  clan_catalog_document_clan_source: SOURCE_REF_COUNT,
  clan_catalog_document_row: ROW_COUNT,
  clan_catalog_document_row_key: 508,
  clan_catalog_document_branch: 0,
  clan_catalog_document_branch_key: 0,
};

const documentFields = ['id', 'schema', 'note', 'sources', 'clans'];
const sourceFieldOrders = [
  ['id', 'record_id', 'url', 'accessed', 'quote', 'evidence', 'live_check', 'live_check_ref'],
  ['id', 'url', 'accessed', 'quote', 'evidence', 'live_check'],
];
const sourceFields = [...new Set(sourceFieldOrders.flat())];
const clanFieldOrders = [
  ['id', 'surname', 'bongwan', 'bongwan_hanja', 'branch', 'provenance', 'sources', 'rows', 'hangnyeol_unconfirmed_reason'],
  ['id', 'surname', 'bongwan', 'bongwan_hanja', 'branch', 'provenance', 'creative_rationale', 'method_ref', 'rows'],
  ['id', 'surname', 'bongwan', 'branch', 'provenance', 'creative_rationale', 'method_ref', 'rows'],
  ['id', 'surname', 'bongwan', 'bongwan_hanja', 'branch', 'provenance', 'creative_rationale', 'method_ref', 'rows', 'hangnyeol_unconfirmed_reason'],
  ['id', 'surname', 'bongwan', 'branch', 'provenance', 'creative_rationale', 'method_ref', 'rows', 'hangnyeol_unconfirmed_reason', 'surname_hanja'],
  ['id', 'surname', 'bongwan', 'branch', 'provenance', 'creative_rationale', 'method_ref', 'rows', 'hangnyeol_unconfirmed_reason'],
  ['id', 'surname', 'bongwan', 'bongwan_hanja', 'branch', 'provenance', 'sources', 'rows', 'show_branches', 'hangnyeol_unconfirmed_reason'],
  ['id', 'surname', 'bongwan', 'bongwan_hanja', 'surname_hanja', 'branch', 'provenance', 'creative_rationale', 'method_ref', 'rows', 'hangnyeol_unconfirmed_reason'],
  ['id', 'surname', 'bongwan', 'hangnyeol', 'source', 'branches'],
];
const clanFields = [...new Set(clanFieldOrders.flat())];
const rowFields = ['sesu', 'hangnyeol', 'hanja', 'position'];

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_CLAN_CATALOG_DOCUMENT: ${detail}`), { code: 'E_CLAN_CATALOG_DOCUMENT' }); };
const text = value => typeof value === 'string' && value.length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function keys(value, allowed) {
  if (!object(value)) fail('unknown, missing, or unordered fields');
  const actual = Object.keys(value);
  const orders = Array.isArray(allowed[0]) ? allowed : [allowed];
  if (!orders.some(order => actual.length === order.length && actual.every((key, index) => key === order[index]))) {
    fail('unknown, missing, or unordered fields');
  }
}

function requiredText(value, field) {
  if (!text(value[field])) fail(`${field} shape`);
}

function optionalText(value, field) {
  if (Object.hasOwn(value, field) && !text(value[field])) fail(`${field} shape`);
}

function shapeSource(source) {
  keys(source, sourceFieldOrders);
  for (const field of ['id', 'url', 'accessed', 'quote', 'evidence', 'live_check']) requiredText(source, field);
  optionalText(source, 'record_id');
  optionalText(source, 'live_check_ref');
}

function shapeRow(row) {
  keys(row, rowFields);
  if (!Number.isSafeInteger(row.sesu)) fail('sesu shape');
  if (!text(row.hangnyeol) || !text(row.position)) fail('row shape');
  if (!Object.hasOwn(row, 'hanja') || row.hanja !== null) fail('hanja shape');
}

function shapeBranch(branch) {
  if (!object(branch)) fail('branch shape');
  if (Object.keys(branch).length !== 0) fail('unknown, missing, or unordered fields');
}

function shapeClan(clan) {
  keys(clan, clanFieldOrders);
  for (const field of ['id', 'surname', 'bongwan']) requiredText(clan, field);
  if (Object.hasOwn(clan, 'bongwan_hanja') && clan.bongwan_hanja !== null && !text(clan.bongwan_hanja)) fail('bongwan_hanja shape');
  for (const field of ['surname_hanja', 'branch', 'provenance', 'hangnyeol_unconfirmed_reason', 'creative_rationale', 'method_ref', 'source']) optionalText(clan, field);
  if (Object.hasOwn(clan, 'sources')) {
    if (!Array.isArray(clan.sources) || clan.sources.length === 0 || clan.sources.some(id => !text(id))) fail('clan sources shape');
  }
  if (Object.hasOwn(clan, 'rows')) {
    if (!Array.isArray(clan.rows)) fail('rows shape');
    clan.rows.forEach(shapeRow);
  }
  if (Object.hasOwn(clan, 'show_branches') && typeof clan.show_branches !== 'boolean') fail('show_branches shape');
  if (Object.hasOwn(clan, 'hangnyeol') && clan.hangnyeol !== null) fail('hangnyeol shape');
  if (Object.hasOwn(clan, 'branches')) {
    if (!Array.isArray(clan.branches)) fail('branches shape');
    clan.branches.forEach(shapeBranch);
  }
}

function shape(document) {
  keys(document, documentFields);
  if (!text(document.id) || !Number.isSafeInteger(document.schema) || typeof document.note !== 'string' || !document.note.length) fail('document shape');
  if (!Array.isArray(document.sources) || !Array.isArray(document.clans)) fail('document collections');
  document.sources.forEach(shapeSource);
  document.clans.forEach(shapeClan);
  const sourceIds = new Set(document.sources.map(source => source.id));
  const clanIds = new Set(document.clans.map(clan => clan.id));
  if (sourceIds.size !== document.sources.length || clanIds.size !== document.clans.length) fail('duplicate id');
  for (const clan of document.clans) {
    for (const sourceId of clan.sources ?? []) if (!sourceIds.has(sourceId)) fail('dangling clan source');
  }
}

const receipt = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));

function insertKeys(db, sql, parent, value) {
  Object.keys(value).forEach((key, ordinal) => db.prepare(sql).run(...parent, ordinal, key));
}

const flag = (value, field) => Number(Object.hasOwn(value, field));
const nullable = (value, field) => (Object.hasOwn(value, field) ? value[field] : null);

/** Import only the exact original document; normalization grants no approval and adds no facts. */
export function initializeClanCatalogDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array)) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO clan_catalog_document_document VALUES (1,?,?,?,?,?,?,?)')
      .run(sourceHash, document.id, document.schema, document.note, actor, reason, receipt(sourceHash, documentHash, actor, reason));
    document.sources.forEach((source, ordinal) => {
      db.prepare(`INSERT INTO clan_catalog_document_source VALUES (${Array(12).fill('?').join(',')})`).run(
        ordinal, 1, source.id,
        flag(source, 'record_id'), nullable(source, 'record_id'),
        source.url, source.accessed, source.quote, source.evidence, source.live_check,
        flag(source, 'live_check_ref'), nullable(source, 'live_check_ref'),
      );
      insertKeys(db, 'INSERT INTO clan_catalog_document_source_key VALUES (?,?,?)', [ordinal], source);
    });
    document.clans.forEach((clan, ordinal) => {
      db.prepare(`INSERT INTO clan_catalog_document_clan VALUES (${Array(28).fill('?').join(',')})`).run(
        ordinal, 1, clan.id, clan.surname, clan.bongwan,
        flag(clan, 'bongwan_hanja'), nullable(clan, 'bongwan_hanja'),
        flag(clan, 'surname_hanja'), nullable(clan, 'surname_hanja'),
        flag(clan, 'branch'), nullable(clan, 'branch'),
        flag(clan, 'provenance'), nullable(clan, 'provenance'),
        flag(clan, 'sources'),
        flag(clan, 'rows'),
        flag(clan, 'show_branches'), Object.hasOwn(clan, 'show_branches') ? Number(clan.show_branches) : null,
        flag(clan, 'hangnyeol_unconfirmed_reason'), nullable(clan, 'hangnyeol_unconfirmed_reason'),
        flag(clan, 'creative_rationale'), nullable(clan, 'creative_rationale'),
        flag(clan, 'method_ref'), nullable(clan, 'method_ref'),
        flag(clan, 'hangnyeol'), nullable(clan, 'hangnyeol'),
        flag(clan, 'source'), nullable(clan, 'source'),
        flag(clan, 'branches'),
      );
      insertKeys(db, 'INSERT INTO clan_catalog_document_clan_key VALUES (?,?,?)', [ordinal], clan);
      (clan.sources ?? []).forEach((sourceId, index) => db.prepare('INSERT INTO clan_catalog_document_clan_source VALUES (?,?,?)').run(ordinal, index, sourceId));
      (clan.rows ?? []).forEach((row, index) => {
        db.prepare('INSERT INTO clan_catalog_document_row VALUES (?,?,?,?,?,?,?)')
          .run(ordinal, index, row.sesu, row.hangnyeol, 1, row.hanja, row.position);
        insertKeys(db, 'INSERT INTO clan_catalog_document_row_key VALUES (?,?,?,?)', [ordinal, index], row);
      });
      (clan.branches ?? []).forEach((branch, index) => {
        db.prepare('INSERT INTO clan_catalog_document_branch VALUES (?,?,?)').run(ordinal, index, 'object');
        insertKeys(db, 'INSERT INTO clan_catalog_document_branch_key VALUES (?,?,?,?)', [ordinal, index], branch);
      });
    });
    const read = readClanCatalogDocument(db);
    if (!same(read, document)) fail('transaction parity');
    db.exec('COMMIT');
    return {
      documents: 1,
      sources: document.sources.length,
      clans: document.clans.length,
      clanSources: document.clans.reduce((sum, clan) => sum + (clan.sources?.length ?? 0), 0),
      rows: document.clans.reduce((sum, clan) => sum + (clan.rows?.length ?? 0), 0),
      branches: document.clans.reduce((sum, clan) => sum + (clan.branches?.length ?? 0), 0),
      totalRows: Object.values(COUNTS).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function rows(db, table, order) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all();
}

function ordered(result, label) {
  if (result.some((row, index) => row.ordinal !== index)) fail(`${label} order`);
  return result;
}

function keysFor(rowsForParent, expected, label) {
  if (rowsForParent.length !== expected.length || rowsForParent.some((row, index) => row.ordinal !== index || row.key !== expected[index])) fail(`${label} key order`);
}

function present(flagValue, value, label, nullAllowed = false) {
  if (![0, 1].includes(flagValue) || (flagValue === 0 && value !== null) || (flagValue === 1 && value === null && !nullAllowed)) fail(`${label} presence`);
  return flagValue === 1;
}

/** SELECT-only reconstruction: no source I/O, archive decoding, or JSON parsing. */
function reconstructClanCatalog({ row, sources, sourceKeys, clans, clanKeys, clanSources, hangnyeolRows, rowKeys, branches, branchKeys }) {
  if (row.document_id !== 1 || !text(row.actor) || !row.actor.trim()
    || !text(row.reason) || !row.reason.trim()
    || !text(row.id) || !Number.isSafeInteger(row.schema) || typeof row.note !== 'string') fail('provenance');
  if (sources.some(source => source.document_id !== 1) || clans.some(clan => clan.document_id !== 1)) fail('parent');
  const sourceIds = new Set(sources.map(source => source.id));
  if (sourceIds.size !== sources.length) fail('source ids');
  const document = {
    id: row.id,
    schema: row.schema,
    note: row.note,
    sources: sources.map(source => {
      const value = { id: source.id };
      if (present(source.record_id_present, source.record_id, 'record_id')) value.record_id = source.record_id;
      Object.assign(value, {
        url: source.url,
        accessed: source.accessed,
        quote: source.quote,
        evidence: source.evidence,
        live_check: source.live_check,
      });
      if (present(source.live_check_ref_present, source.live_check_ref, 'live_check_ref')) value.live_check_ref = source.live_check_ref;
      keysFor(sourceKeys.filter(key => key.source_ordinal === source.ordinal), Object.keys(value), 'source');
      return value;
    }),
    clans: clans.map(clan => {
      const fields = {
        id: clan.id,
        surname: clan.surname,
        bongwan: clan.bongwan,
      };
      if (present(clan.bongwan_hanja_present, clan.bongwan_hanja, 'bongwan_hanja', true)) fields.bongwan_hanja = clan.bongwan_hanja;
      if (present(clan.surname_hanja_present, clan.surname_hanja, 'surname_hanja')) fields.surname_hanja = clan.surname_hanja;
      if (present(clan.branch_present, clan.branch, 'branch')) fields.branch = clan.branch;
      if (present(clan.provenance_present, clan.provenance, 'provenance')) fields.provenance = clan.provenance;
      if (present(clan.sources_present, null, 'sources', true)) {
        const refs = clanSources.filter(item => item.clan_ordinal === clan.ordinal);
        if (refs.length === 0 || refs.some((item, index) => item.ordinal !== index || !text(item.source_id) || !sourceIds.has(item.source_id))) fail('clan source refs');
        fields.sources = refs.map(item => item.source_id);
      } else if (clanSources.some(item => item.clan_ordinal === clan.ordinal)) fail('clan source refs');
      if (present(clan.rows_present, null, 'rows', true)) {
        const items = hangnyeolRows.filter(item => item.clan_ordinal === clan.ordinal);
        if (items.some((item, index) => item.ordinal !== index)) fail('row order');
        fields.rows = items.map(item => {
          if (item.hanja_present !== 1) fail('hanja required');
          if (!Number.isSafeInteger(item.sesu) || !text(item.hangnyeol) || !text(item.position)) fail('row shape');
          const hangnyeol = { sesu: item.sesu, hangnyeol: item.hangnyeol, hanja: item.hanja, position: item.position };
          keysFor(rowKeys.filter(key => key.clan_ordinal === item.clan_ordinal && key.row_ordinal === item.ordinal), Object.keys(hangnyeol), 'row');
          return hangnyeol;
        });
      } else if (hangnyeolRows.some(item => item.clan_ordinal === clan.ordinal)) fail('row order');
      if (present(clan.show_branches_present, clan.show_branches, 'show_branches')) {
        if (![0, 1].includes(clan.show_branches)) fail('show_branches');
        fields.show_branches = clan.show_branches === 1;
      }
      if (present(clan.hangnyeol_unconfirmed_reason_present, clan.hangnyeol_unconfirmed_reason, 'hangnyeol_unconfirmed_reason')) {
        fields.hangnyeol_unconfirmed_reason = clan.hangnyeol_unconfirmed_reason;
      }
      if (present(clan.creative_rationale_present, clan.creative_rationale, 'creative_rationale')) fields.creative_rationale = clan.creative_rationale;
      if (present(clan.method_ref_present, clan.method_ref, 'method_ref')) fields.method_ref = clan.method_ref;
      if (present(clan.hangnyeol_present, clan.hangnyeol, 'hangnyeol', true)) fields.hangnyeol = clan.hangnyeol;
      if (present(clan.source_present, clan.source, 'source')) fields.source = clan.source;
      if (present(clan.branches_present, null, 'branches', true)) {
        const items = branches.filter(item => item.clan_ordinal === clan.ordinal);
        if (items.some((item, index) => item.ordinal !== index)) fail('branch order');
        fields.branches = items.map(item => {
          if (item.value_shape !== 'object') fail('branch shape');
          const branch = {};
          keysFor(branchKeys.filter(key => key.clan_ordinal === item.clan_ordinal && key.branch_ordinal === item.ordinal), Object.keys(branch), 'branch');
          return branch;
        });
      } else if (branches.some(item => item.clan_ordinal === clan.ordinal)) fail('branch order');
      const orderedKeys = clanKeys.filter(key => key.clan_ordinal === clan.ordinal);
      if (orderedKeys.length !== Object.keys(fields).length || orderedKeys.some(key => !Object.hasOwn(fields, key.key))) fail('clan key order');
      const value = {};
      for (const key of orderedKeys) value[key.key] = fields[key.key];
      keysFor(orderedKeys, Object.keys(value), 'clan');
      return value;
    }),
  };
  const consumed = {
    clan_catalog_document_document: 1,
    clan_catalog_document_source: sources.length,
    clan_catalog_document_source_key: sourceKeys.length,
    clan_catalog_document_clan: clans.length,
    clan_catalog_document_clan_key: clanKeys.length,
    clan_catalog_document_clan_source: clanSources.length,
    clan_catalog_document_row: hangnyeolRows.length,
    clan_catalog_document_row_key: rowKeys.length,
    clan_catalog_document_branch: branches.length,
    clan_catalog_document_branch_key: branchKeys.length,
  };
  if (!same(consumed, COUNTS)) fail('consumed row counts');
  const seenKeys = sourceKeys.length + clanKeys.length + rowKeys.length + branchKeys.length;
  const expectedKeys = document.sources.reduce((sum, source) => sum + Object.keys(source).length, 0)
    + document.clans.reduce((sum, clan) => sum + Object.keys(clan).length
      + (clan.rows ?? []).reduce((inner, item) => inner + Object.keys(item).length, 0)
      + (clan.branches ?? []).reduce((inner, item) => inner + Object.keys(item).length, 0), 0);
  if (seenKeys !== expectedKeys) fail('unconsumed key rows');
  const unusedSources = clanSources.length - document.clans.reduce((sum, clan) => sum + (clan.sources?.length ?? 0), 0);
  const unusedRows = hangnyeolRows.length - document.clans.reduce((sum, clan) => sum + (clan.rows?.length ?? 0), 0);
  const unusedBranches = branches.length - document.clans.reduce((sum, clan) => sum + (clan.branches?.length ?? 0), 0);
  if (unusedSources !== 0 || unusedRows !== 0 || unusedBranches !== 0) fail('unconsumed child rows');
  shape(document);
  return document;
}
export function readClanCatalogDocument(db) {
  const documents = db.prepare('SELECT * FROM clan_catalog_document_document').all();
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  return reconstructClanCatalog({
    row,
    sources: ordered(rows(db, 'clan_catalog_document_source', 'ordinal'), 'source'),
    sourceKeys: rows(db, 'clan_catalog_document_source_key', 'source_ordinal, ordinal'),
    clans: ordered(rows(db, 'clan_catalog_document_clan', 'ordinal'), 'clan'),
    clanKeys: rows(db, 'clan_catalog_document_clan_key', 'clan_ordinal, ordinal'),
    clanSources: rows(db, 'clan_catalog_document_clan_source', 'clan_ordinal, ordinal'),
    hangnyeolRows: rows(db, 'clan_catalog_document_row', 'clan_ordinal, ordinal'),
    rowKeys: rows(db, 'clan_catalog_document_row_key', 'clan_ordinal, row_ordinal, ordinal'),
    branches: rows(db, 'clan_catalog_document_branch', 'clan_ordinal, ordinal'),
    branchKeys: rows(db, 'clan_catalog_document_branch_key', 'clan_ordinal, branch_ordinal, ordinal'),
  });
}


/** Async PostgreSQL twin of readClanCatalogDocument: identical validation and
 * reconstruction, reading wiki.* tables through a db-pg transaction handle.
 * The synchronous SQLite export above stays unchanged for SQLite callers. */
export async function readClanCatalogDocumentAsync(db) {
  const rowsAsync = (table, order) => db.all(`SELECT * FROM wiki.${table} ORDER BY ${order}`);
  const documents = await db.all('SELECT * FROM wiki.clan_catalog_document_document');
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  const sources = ordered(await rowsAsync('clan_catalog_document_source', 'ordinal'), 'source');
  const sourceKeys = await rowsAsync('clan_catalog_document_source_key', 'source_ordinal, ordinal');
  const clans = ordered(await rowsAsync('clan_catalog_document_clan', 'ordinal'), 'clan');
  const clanKeys = await rowsAsync('clan_catalog_document_clan_key', 'clan_ordinal, ordinal');
  const clanSources = await rowsAsync('clan_catalog_document_clan_source', 'clan_ordinal, ordinal');
  const hangnyeolRows = await rowsAsync('clan_catalog_document_row', 'clan_ordinal, ordinal');
  const rowKeys = await rowsAsync('clan_catalog_document_row_key', 'clan_ordinal, row_ordinal, ordinal');
  const branches = await rowsAsync('clan_catalog_document_branch', 'clan_ordinal, ordinal');
  const branchKeys = await rowsAsync('clan_catalog_document_branch_key', 'clan_ordinal, branch_ordinal, ordinal');
  return reconstructClanCatalog({ row, sources, sourceKeys, clans, clanKeys, clanSources, hangnyeolRows, rowKeys, branches, branchKeys });
}
