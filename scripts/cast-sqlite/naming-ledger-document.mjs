import { createHash } from 'node:crypto';

export const NAMING_LEDGER_SOURCE_HASH = '3e4370d707a98407c230d96ea493f56a4f3b63a7ee77cd8fbbbfb90256a256f5';
const documentHash = 'c71924b028ee7f653dbb5ecf4895e655c8a4b453229287b326258f14afdb37f1';
const fields = ['version','states','historicalMartialSchools','historicalMartialBranch','offices','seriesTitles','retiredPublicForms'];
const stateFields = ['id','name','sources'];
const schoolFields = ['formalName','hanja','alias','source'];
const branchFields = ['name','formalName','source','rightsStatus'];
const officeFields = ['state','tiers','source'];
const seriesFields = ['form','source'];
const retiredFields = ['form','source','rightsStatus','exceptSources'];
const counts = { states: 16, stateSources: 16, schools: 75, offices: 16, tiers: 80, series: 2, retired: 5, exceptSources: 2 };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_NAMING_LEDGER_DOCUMENT: ${detail}`), { code: 'E_NAMING_LEDGER_DOCUMENT' }); };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function keys(value, expected) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || !same(Object.keys(value), expected)) fail('unknown, missing, or unordered fields');
}
function text(value) {
  if (typeof value !== 'string' || !value.trim()) fail('text');
}
function strings(value) {
  if (!Array.isArray(value) || !value.length || value.some(entry => typeof entry !== 'string' || !entry.trim())) fail('list shape');
}
function shape(document) {
  keys(document, fields);
  if (document.version !== 1) fail('version');
  if (!Array.isArray(document.states) || document.states.length !== counts.states) fail('states');
  let stateSources = 0;
  const stateIds = new Set();
  for (const state of document.states) {
    keys(state, stateFields);
    text(state.id); text(state.name); strings(state.sources);
    if (stateIds.has(state.id)) fail('state id');
    stateIds.add(state.id);
    stateSources += state.sources.length;
  }
  if (stateSources !== counts.stateSources) fail('state sources');
  if (!Array.isArray(document.historicalMartialSchools) || document.historicalMartialSchools.length !== counts.schools) fail('schools');
  const schoolNames = new Set();
  for (const school of document.historicalMartialSchools) {
    keys(school, schoolFields);
    text(school.formalName); text(school.hanja); text(school.source);
    if (school.alias !== null || schoolNames.has(school.formalName)) fail('school');
    schoolNames.add(school.formalName);
  }
  keys(document.historicalMartialBranch, branchFields);
  text(document.historicalMartialBranch.name); text(document.historicalMartialBranch.source); text(document.historicalMartialBranch.rightsStatus);
  if (document.historicalMartialBranch.formalName !== null) fail('branch formal name');
  if (!Array.isArray(document.offices) || document.offices.length !== counts.offices) fail('offices');
  let tiers = 0;
  const officeStates = new Set();
  for (const office of document.offices) {
    keys(office, officeFields);
    text(office.state); text(office.source); strings(office.tiers);
    if (officeStates.has(office.state)) fail('office state');
    officeStates.add(office.state);
    tiers += office.tiers.length;
  }
  if (tiers !== counts.tiers) fail('tiers');
  if (!Array.isArray(document.seriesTitles) || document.seriesTitles.length !== counts.series) fail('series');
  const seriesForms = new Set();
  for (const series of document.seriesTitles) {
    keys(series, seriesFields);
    text(series.form); text(series.source);
    if (seriesForms.has(series.form)) fail('series form');
    seriesForms.add(series.form);
  }
  if (!Array.isArray(document.retiredPublicForms) || document.retiredPublicForms.length !== counts.retired) fail('retired forms');
  let exceptSources = 0;
  const retiredForms = new Set();
  for (const form of document.retiredPublicForms) {
    const expected = 'exceptSources' in form ? retiredFields : retiredFields.slice(0, 3);
    keys(form, expected);
    text(form.form); text(form.source); text(form.rightsStatus);
    if (retiredForms.has(form.form)) fail('retired form');
    retiredForms.add(form.form);
    if ('exceptSources' in form) {
      strings(form.exceptSources);
      exceptSources += form.exceptSources.length;
    }
  }
  if (exceptSources !== counts.exceptSources) fail('except sources');
}
const receipt = (actor, reason) => hash(JSON.stringify([NAMING_LEDGER_SOURCE_HASH, documentHash, actor, reason]));
const ordered = (rows, count, table) => {
  if (rows.length !== count || rows.some((row, index) => row.ordinal !== index)) fail(`${table} coverage`);
  return rows;
};

/** Import exactly the bounded source. Historical and rights metadata stay data; this grants no approval. */
export function initializeNamingLedgerDocument(db, { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array) || expectedSourceHash !== NAMING_LEDGER_SOURCE_HASH
    || Object.keys(arguments[1] ?? {}).some(key => !['schemaSql','sourceBytes','expectedSourceHash','actor','reason'].includes(key))) fail('input');
  if (db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'naming_ledger_document%'").get().n) fail('already initialized');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  shape(document);
  if (hash(sourceBytes) !== NAMING_LEDGER_SOURCE_HASH || hash(JSON.stringify(document)) !== documentHash) fail('source hash');
  const branch = document.historicalMartialBranch;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO naming_ledger_document VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      1, expectedSourceHash, document.version, branch.name, null, branch.source, branch.rightsStatus, actor, reason, receipt(actor, reason),
    );
    const insertState = db.prepare('INSERT INTO naming_ledger_document_state VALUES (?,?,?)');
    const insertStateSource = db.prepare('INSERT INTO naming_ledger_document_state_source VALUES (?,?,?)');
    document.states.forEach((state, ordinal) => {
      insertState.run(ordinal, state.id, state.name);
      state.sources.forEach((source, sourceOrdinal) => insertStateSource.run(ordinal, sourceOrdinal, source));
    });
    const insertSchool = db.prepare('INSERT INTO naming_ledger_document_school VALUES (?,?,?,?,?)');
    document.historicalMartialSchools.forEach((school, ordinal) => insertSchool.run(ordinal, school.formalName, school.hanja, null, school.source));
    const insertOffice = db.prepare('INSERT INTO naming_ledger_document_office VALUES (?,?,?)');
    const insertTier = db.prepare('INSERT INTO naming_ledger_document_office_tier VALUES (?,?,?)');
    document.offices.forEach((office, ordinal) => {
      insertOffice.run(ordinal, office.state, office.source);
      office.tiers.forEach((tier, tierOrdinal) => insertTier.run(ordinal, tierOrdinal, tier));
    });
    const insertSeries = db.prepare('INSERT INTO naming_ledger_document_series VALUES (?,?,?)');
    document.seriesTitles.forEach((series, ordinal) => insertSeries.run(ordinal, series.form, series.source));
    const insertRetired = db.prepare('INSERT INTO naming_ledger_document_retired_form VALUES (?,?,?,?)');
    const insertExcept = db.prepare('INSERT INTO naming_ledger_document_retired_except VALUES (?,?,?)');
    document.retiredPublicForms.forEach((form, ordinal) => {
      insertRetired.run(ordinal, form.form, form.source, form.rightsStatus);
      (form.exceptSources ?? []).forEach((source, sourceOrdinal) => insertExcept.run(ordinal, sourceOrdinal, source));
    });
    const stored = readNamingLedgerDocument(db, { expectedSourceHash });
    if (!same(stored, document) || hash(JSON.stringify(stored)) !== documentHash) fail('precommit mismatch');
    db.exec('COMMIT');
    return {
      documents: 1, states: counts.states, stateSources: counts.stateSources, schools: counts.schools,
      offices: counts.offices, tiers: counts.tiers, series: counts.series, retiredForms: counts.retired,
      exceptSources: counts.exceptSources, totalRows: 213,
    };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only reconstruction. No source I/O, archive decoding, JSON parsing, or writes. */
export function readNamingLedgerDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== NAMING_LEDGER_SOURCE_HASH) fail('expected hash');
  const rows = db.prepare('SELECT * FROM naming_ledger_document').all();
  if (rows.length !== 1) fail('document count');
  const row = rows[0];
  if (row.document_id !== 1 || row.source_sha256 !== expectedSourceHash || row.version !== 1
    || row.branch_formal_name !== null || typeof row.actor !== 'string' || !row.actor.trim()
    || typeof row.reason !== 'string' || !row.reason.trim() || row.receipt_sha256 !== receipt(row.actor, row.reason)) fail('provenance');
  const states = ordered(db.prepare('SELECT * FROM naming_ledger_document_state ORDER BY ordinal').all(), counts.states, 'naming_ledger_document_state');
  const stateSources = db.prepare('SELECT * FROM naming_ledger_document_state_source ORDER BY state_ordinal, ordinal').all();
  if (stateSources.length !== counts.stateSources) fail('naming_ledger_document_state_source coverage');
  const schools = ordered(db.prepare('SELECT * FROM naming_ledger_document_school ORDER BY ordinal').all(), counts.schools, 'naming_ledger_document_school');
  const offices = ordered(db.prepare('SELECT * FROM naming_ledger_document_office ORDER BY ordinal').all(), counts.offices, 'naming_ledger_document_office');
  const tiers = db.prepare('SELECT * FROM naming_ledger_document_office_tier ORDER BY office_ordinal, ordinal').all();
  if (tiers.length !== counts.tiers) fail('naming_ledger_document_office_tier coverage');
  const series = ordered(db.prepare('SELECT * FROM naming_ledger_document_series ORDER BY ordinal').all(), counts.series, 'naming_ledger_document_series');
  const retired = ordered(db.prepare('SELECT * FROM naming_ledger_document_retired_form ORDER BY ordinal').all(), counts.retired, 'naming_ledger_document_retired_form');
  const excepts = db.prepare('SELECT * FROM naming_ledger_document_retired_except ORDER BY form_ordinal, ordinal').all();
  if (excepts.length !== counts.exceptSources) fail('naming_ledger_document_retired_except coverage');
  const grouped = (rows, parent) => {
    const byParent = new Map();
    for (const entry of rows) {
      const list = byParent.get(entry[parent]) ?? [];
      if (entry.ordinal !== list.length) fail(`${parent} order`);
      list.push(entry);
      byParent.set(entry[parent], list);
    }
    return byParent;
  };
  const sourcesByState = grouped(stateSources, 'state_ordinal');
  const tiersByOffice = grouped(tiers, 'office_ordinal');
  const exceptsByForm = grouped(excepts, 'form_ordinal');
  const document = {
    version: row.version,
    states: states.map(state => ({ id: state.id, name: state.name, sources: (sourcesByState.get(state.ordinal) ?? []).map(entry => entry.source) })),
    historicalMartialSchools: schools.map(school => ({ formalName: school.formal_name, hanja: school.hanja, alias: school.alias, source: school.source })),
    historicalMartialBranch: { name: row.branch_name, formalName: row.branch_formal_name, source: row.branch_source, rightsStatus: row.branch_rights_status },
    offices: offices.map(office => ({ state: office.state, tiers: (tiersByOffice.get(office.ordinal) ?? []).map(entry => entry.tier), source: office.source })),
    seriesTitles: series.map(entry => ({ form: entry.form, source: entry.source })),
    retiredPublicForms: retired.map(form => {
      const entry = { form: form.form, source: form.source, rightsStatus: form.rights_status };
      const exceptions = exceptsByForm.get(form.ordinal);
      if (exceptions) entry.exceptSources = exceptions.map(item => item.source);
      return entry;
    }),
  };
  if (states.some(state => !(sourcesByState.get(state.ordinal) ?? []).length) || offices.some(office => !(tiersByOffice.get(office.ordinal) ?? []).length)) fail('empty child');
  shape(document);
  if (hash(JSON.stringify(document)) !== documentHash) fail('document hash');
  return document;
}
