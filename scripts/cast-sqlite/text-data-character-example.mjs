export const CHARACTER_EXAMPLE_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  text_character_example: 'source_id json_pointer',
  text_character_example_identity: 'source_id json_pointer generation',
  text_character_example_rank: 'source_id json_pointer common_tier',
  text_character_example_fact: 'source_id json_pointer field status text_value origin reason',
  text_character_example_value: 'source_id json_pointer axis axis_name status integer_value origin reason',
  text_character_example_desire: 'source_id json_pointer axis axis_name value_kind status integer_value text_value origin reason',
  text_character_example_politics: 'source_id json_pointer field status text_value origin reason',
  text_character_example_relations: 'source_id json_pointer status origin reason',
  text_character_example_relation: 'source_id json_pointer ordinal relation_type target_id',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));

const values = { authority: '권위', openness: '개방', force: '무력', material: '물질', community: '공동', principle: '원칙', transparency: '공개', qualification: '자격', decentralization: '분산', change: '변혁' };
const desires = { longing: '갈망', exclusivity: '독점', risk: '위험', display: '과시', continuity: '지속', orientation: '지향', union: '결합' };
const facts = ['sex', 'origin', 'language', 'conscription', 'arms_access', 'occupation', 'affiliation', 'biography'];
const politics = ['personality', 'ambition', 'fear', 'governance', 'trigger', 'intervention'];
const relationTypes = ['kinship', 'adoption', 'mentorship', 'command', 'contract', 'debt', 'oath', 'rivalry', 'grievance', 'protected-residence', 'betrayal'];
const fail = (message) => { throw Object.assign(new Error(`E_CHARACTER_EXAMPLE_SHAPE: ${message}`), { code: 'E_CHARACTER_EXAMPLE_SHAPE' }); };
const text = (v) => typeof v === 'string' && v.length > 0;
function shape(value, required, optional = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype
    || required.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))) fail('unexpected object fields');
}
function cell(value, kind) {
  if (value?.status === 'known') {
    shape(value, ['status', 'value', 'origin']);
    if (!['source-fact', 'original-fiction', 'computed'].includes(value.origin)) fail('invalid assertion origin');
    if (kind === 'integer' ? !Number.isInteger(value.value) || value.value < -100 || value.value > 100
      : kind === 'relations' ? !Array.isArray(value.value) : !text(value.value)) fail('invalid assertion value');
  } else {
    shape(value, ['status', 'reason']);
    if (!['unknown', 'undecided', 'not-applicable'].includes(value.status) || !text(value.reason)) fail('invalid assertion status');
  }
  return { status: value.status, origin: value.origin ?? null, reason: value.reason ?? null };
}

/** Own only the authoring example. Stable keys use original bundle source IDs;
 * source_file holds the path and original-byte hash, never copied into these rows. */
export function mapCharacterExampleData({ files, bundle } = {}) {
  files ??= bundle?.files;
  if (!Array.isArray(files)) fail('files must be an array');
  const tables = Object.fromEntries(Object.keys(CHARACTER_EXAMPLE_TABLE_COLUMNS).map((table) => [table, []]));
  const seen = new Set();
  for (const file of [...files].sort((a, b) => a.source_id - b.source_id)) {
    if (file.document?.domain !== 'characters' || file.logical_path !== 'lore/characters/authoring.example.json') continue;
    if (!Number.isSafeInteger(file.source_id) || file.source_id < 1 || !/^[a-f0-9]{64}$/u.test(file.sha256 ?? '')
      || file.document.id !== '__EXAMPLE__:characters' || seen.has(file.source_id)) fail('invalid source identity or hash');
    seen.add(file.source_id);
    const data = file.document.data;
    shape(data, [], ['identity', 'rank', ...facts, 'values', 'desires', 'politics', 'relations']);
    const emit = (name, json_pointer, fields = {}) => tables[`text_character_example${name ? `_${name}` : ''}`].push({ source_id: file.source_id, json_pointer, ...fields });
    const assertion = (name, pointer, field, value) => emit(name, pointer, { field, ...cell(value, 'text'), text_value: value.value ?? null });
    emit('', '/data');
    if (Object.hasOwn(data, 'identity')) {
      shape(data.identity, ['name', 'generation']);
      if (!['opening', 'predecessor'].includes(data.identity.generation)) fail('invalid generation');
      emit('identity', '/data/identity', { generation: data.identity.generation });
      assertion('fact', '/data/identity/name', 'name', data.identity.name);
    }
    if (Object.hasOwn(data, 'rank')) {
      shape(data.rank, ['common_tier', 'polity_title']);
      if (!/^T[1-5]$/u.test(data.rank.common_tier)) fail('invalid tier');
      emit('rank', '/data/rank', { common_tier: data.rank.common_tier });
      assertion('fact', '/data/rank/polity_title', 'polity_title', data.rank.polity_title);
    }
    for (const field of facts) if (Object.hasOwn(data, field)) {
      assertion('fact', `/data/${field}`, field, data[field]);
      if (field === 'sex' && (data.sex.status !== 'known' || !['female', 'male'].includes(data.sex.value))) fail('invalid sex');
    }
    if (Object.hasOwn(data, 'values')) {
      shape(data.values, Object.keys(values));
      for (const [axis, axis_name] of Object.entries(values)) {
        const value = data.values[axis];
        emit('value', `/data/values/${axis}`, { axis, axis_name, ...cell(value, 'integer'), integer_value: value.value ?? null });
      }
    }
    if (Object.hasOwn(data, 'desires')) {
      shape(data.desires, Object.keys(desires));
      for (const [axis, axis_name] of Object.entries(desires)) {
        const value = data.desires[axis];
        const value_kind = ['orientation', 'union'].includes(axis) ? 'text' : 'integer';
        emit('desire', `/data/desires/${axis}`, { axis, axis_name, value_kind, ...cell(value, value_kind),
          integer_value: value_kind === 'integer' ? value.value ?? null : null, text_value: value_kind === 'text' ? value.value ?? null : null });
      }
    }
    if (Object.hasOwn(data, 'politics')) {
      shape(data.politics, politics);
      for (const field of politics) assertion('politics', `/data/politics/${field}`, field, data.politics[field]);
    }
    if (Object.hasOwn(data, 'relations')) {
      emit('relations', '/data/relations', cell(data.relations, 'relations'));
      data.relations.value?.forEach((relation, ordinal) => {
        shape(relation, ['type', 'target_id']);
        if (!relationTypes.includes(relation.type) || !/^(?:__EXAMPLE__:[A-Za-z0-9_-]+|K[0-9]{3}|DOC:[A-Za-z0-9-]+)$/u.test(relation.target_id)) fail('invalid relation');
        emit('relation', `/data/relations/value/${ordinal}`, { ordinal, relation_type: relation.type, target_id: relation.target_id });
      });
    }
  }
  return Object.freeze(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, Object.freeze(rows.map(Object.freeze))])));
}

/** Reconstruct owned data only from domain rows, including the known empty array. */
export function reconstructCharacterExampleData({ tables, source_id }) {
  const rows = (name) => (tables[`text_character_example${name ? `_${name}` : ''}`] ?? []).filter((row) => row.source_id === source_id);
  if (!rows('').length) return {};
  const result = {};
  const assertion = (row, value) => row.status === 'known' ? { status: row.status, value, origin: row.origin } : { status: row.status, reason: row.reason };
  const identity = rows('identity')[0];
  if (identity) result.identity = { generation: identity.generation };
  const rank = rows('rank')[0];
  if (rank) result.rank = { common_tier: rank.common_tier };
  for (const row of rows('fact')) {
    const target = row.field === 'name' ? result.identity : row.field === 'polity_title' ? result.rank : result;
    target[row.field] = assertion(row, row.text_value);
  }
  for (const [table, key] of [['value', 'values'], ['desire', 'desires'], ['politics', 'politics']]) {
    const entries = rows(table);
    if (entries.length) result[key] = Object.fromEntries(entries.map((row) => [row.axis ?? row.field, assertion(row, row.integer_value ?? row.text_value)]));
  }
  const relations = rows('relations')[0];
  if (relations) result.relations = assertion(relations, rows('relation').sort((a, b) => a.ordinal - b.ordinal)
    .map((row) => ({ type: row.relation_type, target_id: row.target_id })));
  return result;
}
