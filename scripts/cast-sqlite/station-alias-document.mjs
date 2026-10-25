import { createHash } from 'node:crypto';

export const STATION_ALIAS_SOURCE_HASH = '10547a97c961a78a97ab4e0e9931c1c72be43a6861f492954fa74413748c3b7f';
const DOCUMENT_HASH = '14b0339cb16cc88477813497d01e7dcedadb99a0a13c735f55ad8594d65f9e82';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_STATION_ALIAS_DOCUMENT: ${detail}`), { code: 'E_STATION_ALIAS_DOCUMENT' }); };
const receiptOf = (actor, reason) => hash(JSON.stringify([STATION_ALIAS_SOURCE_HASH, DOCUMENT_HASH, actor, reason]));
const ROOT_KEYS = ['schema', 'status', 'issue', 'basis', 'groups'];
const PLAIN_KEYS = ['members', 'disposition'];
const RICH_KEYS = ['members', 'relatedStation', 'disposition', 'displayName', 'aliases', 'observations', 'graphNeighbors', 'decision'];
const NONMERGE_KEYS = ['members', 'disposition', 'reason'];
const OBS_KEYS = ['sourceName', 'line', 'code'];
const NEIGHBOR_KEYS = ['이수', '총신대입구 (이수)', '총신대입구(이수)'];
const OPTIONAL = [
  ['relatedStation', 'related_station'],
  ['displayName', 'display_name'],
  ['decision', 'decision'],
  ['reason', 'reason'],
];

function keys(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || JSON.stringify(Object.keys(value)) !== JSON.stringify(expected)) fail('unknown, missing, or unordered fields');
}
function strings(value, count, label) {
  if (!Array.isArray(value) || value.length !== count || value.some(item => typeof item !== 'string')) fail(label);
}
function shape(document) {
  keys(document, ROOT_KEYS);
  if ([document.schema, document.status, document.issue].some(value => typeof value !== 'string')) fail('scalar shape');
  strings(document.basis, 3, 'basis');
  if (!Array.isArray(document.groups) || document.groups.length !== 19) fail('groups');
  let plain = 0;
  let rich = 0;
  let nonmerge = 0;
  for (const group of document.groups) {
    const signature = JSON.stringify(Object.keys(group));
    strings(group.members, 2, 'members');
    if (typeof group.disposition !== 'string') fail('disposition');
    if (signature === JSON.stringify(PLAIN_KEYS)) plain += 1;
    else if (signature === JSON.stringify(RICH_KEYS)) {
      rich += 1;
      if ([group.relatedStation, group.displayName, group.decision].some(value => typeof value !== 'string')) fail('rich scalars');
      strings(group.aliases, 2, 'aliases');
      if (!Array.isArray(group.observations) || group.observations.length !== 3) fail('observations');
      for (const observation of group.observations) {
        keys(observation, OBS_KEYS);
        if ([observation.sourceName, observation.line, observation.code].some(value => typeof value !== 'string')) fail('observation');
      }
      keys(group.graphNeighbors, NEIGHBOR_KEYS);
      strings(group.graphNeighbors[NEIGHBOR_KEYS[0]], 2, 'neighbors');
      strings(group.graphNeighbors[NEIGHBOR_KEYS[1]], 2, 'neighbors');
      strings(group.graphNeighbors[NEIGHBOR_KEYS[2]], 0, 'neighbors');
    } else if (signature === JSON.stringify(NONMERGE_KEYS)) {
      nonmerge += 1;
      if (typeof group.reason !== 'string') fail('reason');
    } else fail('group fields');
  }
  if (plain !== 17 || rich !== 1 || nonmerge !== 1) fail('group coverage');
}
function indexKeys(rows) {
  if (rows.length !== 59) fail(`key count ${rows.length}`);
  const map = new Map();
  for (const row of rows) {
    if (typeof row.object_path !== 'string' || typeof row.key !== 'string' || !Number.isInteger(row.ordinal)) fail('key type');
    const list = map.get(row.object_path) ?? [];
    if (row.ordinal !== list.length || list.includes(row.key)) fail('key order');
    list.push(row.key);
    map.set(row.object_path, list);
  }
  return map;
}
function childRows(rows, label, count) {
  if (rows.length !== count) fail(`${label} count ${rows.length}`);
  const map = new Map();
  for (const row of rows) {
    if (!Number.isInteger(row.group_ordinal) || row.group_ordinal < 0 || row.group_ordinal >= 19) fail(`${label} parent`);
    const list = map.get(row.group_ordinal) ?? [];
    if (!Number.isInteger(row.ordinal) || row.ordinal !== list.length) fail(`${label} order`);
    list.push(row);
    map.set(row.group_ordinal, list);
  }
  return map;
}

/** Import the exact candidate bytes. Normalization stores them and does not approve publication. */
export function initializeStationAliasDocument(db, { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (!db || db.isTransaction || typeof db.prepare !== 'function' || typeof db.exec !== 'function') fail('input');
  if (![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())
    || !(sourceBytes instanceof Uint8Array) || expectedSourceHash !== STATION_ALIAS_SOURCE_HASH) fail('input');
  let document;
  try {
    document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  } catch (error) {
    fail(`source encoding: ${error.message}`);
  }
  shape(document);
  if (hash(sourceBytes) !== STATION_ALIAS_SOURCE_HASH || hash(JSON.stringify(document)) !== DOCUMENT_HASH) fail('source hash');
  db.exec('PRAGMA foreign_keys=ON');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare(`INSERT INTO station_alias_document_root
      (document_id,source_sha256,document_sha256,"schema",status,issue,actor,reason,receipt_sha256)
      VALUES (1,?,?,?,?,?,?,?,?)`)
      .run(STATION_ALIAS_SOURCE_HASH, DOCUMENT_HASH, document.schema, document.status, document.issue, actor, reason, receiptOf(actor, reason));
    const insertBasis = db.prepare('INSERT INTO station_alias_document_basis VALUES (?,?)');
    const insertGroup = db.prepare('INSERT INTO station_alias_document_group VALUES (?,?,?,?,?,?)');
    const insertMember = db.prepare('INSERT INTO station_alias_document_member VALUES (?,?,?)');
    const insertAlias = db.prepare('INSERT INTO station_alias_document_alias VALUES (?,?,?)');
    const insertObservation = db.prepare('INSERT INTO station_alias_document_observation VALUES (?,?,?,?,?)');
    const insertNeighborKey = db.prepare('INSERT INTO station_alias_document_neighbor_key VALUES (?,?,?)');
    const insertNeighbor = db.prepare('INSERT INTO station_alias_document_neighbor VALUES (?,?,?,?)');
    const insertKey = db.prepare('INSERT INTO station_alias_document_key VALUES (?,?,?)');
    document.basis.forEach((basis, ordinal) => insertBasis.run(ordinal, basis));
    Object.keys(document).forEach((key, ordinal) => insertKey.run('document', ordinal, key));
    document.groups.forEach((group, groupOrdinal) => {
      insertGroup.run(
        groupOrdinal,
        group.disposition,
        Object.hasOwn(group, 'relatedStation') ? group.relatedStation : null,
        Object.hasOwn(group, 'displayName') ? group.displayName : null,
        Object.hasOwn(group, 'decision') ? group.decision : null,
        Object.hasOwn(group, 'reason') ? group.reason : null,
      );
      Object.keys(group).forEach((key, ordinal) => insertKey.run(`group/${groupOrdinal}`, ordinal, key));
      group.members.forEach((member, ordinal) => insertMember.run(groupOrdinal, ordinal, member));
      if (Object.hasOwn(group, 'aliases')) group.aliases.forEach((alias, ordinal) => insertAlias.run(groupOrdinal, ordinal, alias));
      if (Object.hasOwn(group, 'observations')) group.observations.forEach((observation, ordinal) => {
        insertObservation.run(groupOrdinal, ordinal, observation.sourceName, observation.line, observation.code);
        Object.keys(observation).forEach((key, keyOrdinal) => insertKey.run(`observation/${groupOrdinal}/${ordinal}`, keyOrdinal, key));
      });
      if (Object.hasOwn(group, 'graphNeighbors')) {
        Object.entries(group.graphNeighbors).forEach(([stationKey, neighbors], stationOrdinal) => {
          insertNeighborKey.run(groupOrdinal, stationOrdinal, stationKey);
          neighbors.forEach((neighbor, ordinal) => insertNeighbor.run(groupOrdinal, stationOrdinal, ordinal, neighbor));
        });
      }
    });
    const readBack = readStationAliasDocument(db, { expectedSourceHash });
    if (JSON.stringify(readBack) !== JSON.stringify(document)) fail('transaction parity');
    db.exec('COMMIT');
    return {
      documents: 1, basis: 3, groups: 19, members: 38, aliases: 2, observations: 3, neighborKeys: 3, neighbors: 4, keys: 59, totalRows: 132,
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function readDocument(db, expectedSourceHash) {
  if (expectedSourceHash !== STATION_ALIAS_SOURCE_HASH) fail('expected hash');
  const rootRows = db.prepare('SELECT * FROM station_alias_document_root').all();
  if (rootRows.length !== 1) fail('document count');
  const root = rootRows[0];
  if (root.document_id !== 1 || root.source_sha256 !== expectedSourceHash || root.document_sha256 !== DOCUMENT_HASH
    || typeof root.actor !== 'string' || !root.actor.trim() || typeof root.reason !== 'string' || !root.reason.trim()
    || root.receipt_sha256 !== receiptOf(root.actor, root.reason)) fail('provenance');
  if ([root.schema, root.status, root.issue].some(value => typeof value !== 'string')) fail('scalars');
  const basisRows = db.prepare('SELECT * FROM station_alias_document_basis ORDER BY ordinal').all();
  if (basisRows.length !== 3 || basisRows.some((row, index) => row.ordinal !== index || typeof row.basis !== 'string')) fail('basis rows');
  const groupRows = db.prepare('SELECT * FROM station_alias_document_group ORDER BY ordinal').all();
  if (groupRows.length !== 19 || groupRows.some((row, index) => row.ordinal !== index || typeof row.disposition !== 'string')) fail('group rows');
  const members = childRows(db.prepare('SELECT * FROM station_alias_document_member ORDER BY group_ordinal, ordinal').all(), 'member', 38);
  const aliases = childRows(db.prepare('SELECT * FROM station_alias_document_alias ORDER BY group_ordinal, ordinal').all(), 'alias', 2);
  const observations = childRows(db.prepare('SELECT * FROM station_alias_document_observation ORDER BY group_ordinal, ordinal').all(), 'observation', 3);
  const neighborKeys = childRows(db.prepare('SELECT * FROM station_alias_document_neighbor_key ORDER BY group_ordinal, ordinal').all(), 'neighbor key', 3);
  const neighborRows = db.prepare('SELECT * FROM station_alias_document_neighbor ORDER BY group_ordinal, station_ordinal, ordinal').all();
  if (neighborRows.length !== 4) fail(`neighbor count ${neighborRows.length}`);
  const keyMap = indexKeys(db.prepare('SELECT * FROM station_alias_document_key ORDER BY object_path, ordinal').all());
  if (JSON.stringify(keyMap.get('document')) !== JSON.stringify(ROOT_KEYS)) fail('document keys');
  const allowedPaths = new Set(['document']);
  const groups = groupRows.map(row => {
    const groupKeys = keyMap.get(`group/${row.ordinal}`);
    if (!groupKeys) fail('group keys');
    allowedPaths.add(`group/${row.ordinal}`);
    const built = {};
    const include = key => {
      if (!groupKeys.includes(key)) fail(`missing group key ${key}`);
    };
    include('members');
    include('disposition');
    for (const key of groupKeys) {
      if (key === 'members') {
        const list = members.get(row.ordinal);
        if (!list || list.length !== 2 || list.some(item => typeof item.member !== 'string')) fail('member coverage');
        built.members = list.map(item => item.member);
      } else if (key === 'disposition') built.disposition = row.disposition;
      else if (key === 'relatedStation' || key === 'displayName' || key === 'decision' || key === 'reason') {
        const column = OPTIONAL.find(([name]) => name === key)[1];
        if (typeof row[column] !== 'string') fail(`optional presence ${key}`);
        built[key] = row[column];
      } else if (key === 'aliases') {
        const list = aliases.get(row.ordinal) ?? [];
        if (list.some(item => typeof item.alias !== 'string')) fail('alias type');
        built.aliases = list.map(item => item.alias);
      } else if (key === 'observations') {
        const list = observations.get(row.ordinal) ?? [];
        built.observations = list.map(item => {
          const path = `observation/${row.ordinal}/${item.ordinal}`;
          if (JSON.stringify(keyMap.get(path)) !== JSON.stringify(OBS_KEYS)) fail('observation keys');
          allowedPaths.add(path);
          if ([item.source_name, item.line, item.code].some(value => typeof value !== 'string')) fail('observation value');
          return { sourceName: item.source_name, line: item.line, code: item.code };
        });
      } else if (key === 'graphNeighbors') built.graphNeighbors = takeNeighbors(row.ordinal, neighborKeys, neighborRows, true);
      else fail(`unknown group key ${key}`);
    }
    for (const [key, column] of OPTIONAL) {
      if (groupKeys.includes(key) !== (row[column] !== null)) fail(`optional presence ${key}`);
    }
    if (!groupKeys.includes('aliases') && aliases.get(row.ordinal)?.length) fail('unexpected aliases');
    if (!groupKeys.includes('observations') && observations.get(row.ordinal)?.length) fail('unexpected observations');
    if (!groupKeys.includes('graphNeighbors')) takeNeighbors(row.ordinal, neighborKeys, neighborRows, false);
    return built;
  });
  const observationPaths = [...allowedPaths].filter(path => path.startsWith('observation/'));
  if (observationPaths.length !== 3) fail('observation key coverage');
  if (keyMap.size !== allowedPaths.size || [...keyMap.keys()].some(path => !allowedPaths.has(path))) fail('key paths');
  const document = {};
  for (const key of keyMap.get('document')) {
    if (key === 'schema') document.schema = root.schema;
    else if (key === 'status') document.status = root.status;
    else if (key === 'issue') document.issue = root.issue;
    else if (key === 'basis') document.basis = basisRows.map(row => row.basis);
    else if (key === 'groups') document.groups = groups;
    else fail(`unknown document key ${key}`);
  }
  shape(document);
  if (hash(JSON.stringify(document)) !== DOCUMENT_HASH) fail('document hash');
  return document;
}

function takeNeighbors(groupOrdinal, neighborKeys, neighborRows, present) {
  const stations = neighborKeys.get(groupOrdinal) ?? [];
  const lists = new Map();
  for (const row of neighborRows) {
    if (row.group_ordinal !== groupOrdinal) continue;
    if (!Number.isInteger(row.station_ordinal) || !Number.isInteger(row.ordinal) || typeof row.neighbor !== 'string') fail('neighbor type');
    const list = lists.get(row.station_ordinal) ?? [];
    if (row.ordinal !== list.length) fail('neighbor order');
    list.push(row.neighbor);
    lists.set(row.station_ordinal, list);
  }
  if (!present) {
    if (stations.length || lists.size) fail('unexpected neighbors');
    return undefined;
  }
  const built = {};
  const seen = new Set();
  for (const station of stations) {
    if (typeof station.station_key !== 'string' || seen.has(station.station_key)) fail('neighbor key');
    seen.add(station.station_key);
    built[station.station_key] = lists.get(station.ordinal) ?? [];
    lists.delete(station.ordinal);
  }
  if (lists.size) fail('orphan neighbors');
  return built;
}

/** SELECT-only reconstruction. No source I/O or JSON parsing. */
export function readStationAliasDocument(db, { expectedSourceHash } = {}) {
  try {
    return readDocument(db, expectedSourceHash);
  } catch (error) {
    if (error.code === 'E_STATION_ALIAS_DOCUMENT') throw error;
    fail(error.message);
  }
}
