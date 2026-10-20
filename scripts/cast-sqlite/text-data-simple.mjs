// These authoring placeholders are literal strings, not game rules or approved facts.
const examples = Object.freeze({ ailments: 'symptom', culture: 'transmission', economy: 'exchange', goods: 'supply',
  offices: 'tier', overview: 'consequence', 'people-and-machines': 'dependency', places: 'layer',
  regions: 'opening_state', structures: 'function', technology: 'constraint' });
const tableFor = (domain) => `text_${domain.replaceAll('-', '_')}_example`;
const columnFor = (field) => field === 'constraint' ? 'constraint_text' : field;
export const SIMPLE_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  ...Object.fromEntries(Object.entries(examples).map(([domain, field]) => [tableFor(domain), `source_id json_pointer ${columnFor(field)}`])),
  text_simple_collection: 'source_id json_pointer collection',
  text_primary_detail: 'source_id json_pointer ordinal person_id name',
  text_chronology_event: 'source_id json_pointer event_id ordinal anchor authored_order date_status date_value date_reason',
  text_name_pool_example_entry: 'source_id json_pointer ordinal entry',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));
const fail = (detail) => { throw Object.assign(new Error(`E_TEXT_DATA_SIMPLE: ${detail}`), { code: 'E_TEXT_DATA_SIMPLE' }); };
const exact = (value, required, optional = []) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || required.some((key) => !Object.hasOwn(value, key))
    || Object.keys(value).some((key) => ![...required, ...optional].includes(key))) fail('unexpected fields');
};
export function mapSimpleData({ files, bundle }) {
  const tables = Object.fromEntries(Object.keys(SIMPLE_TABLE_COLUMNS).map((table) => [table, []]));
  const registry = bundle.files.find((file) => file.logical_path === 'lore/name-pools/person-id-registry.json').document;
  const people = new Map(registry.persons.map((person) => [person.name, person.id]));
  for (const { source_id, document: d } of [...files].sort((a, b) => a.source_id - b.source_id)) {
    const emit = (table, json_pointer, row) => tables[table].push({ source_id, json_pointer, ...row });
    for (const collection of ['primary_detail_names', 'sequence', ...(d.domain === 'name-pools' ? ['entries'] : [])]) {
      if (Object.hasOwn(d.data, collection)) emit('text_simple_collection', `/data/${collection}`, { collection });
    }
    const field = examples[d.domain];
    if (field && Object.hasOwn(d.data, field)) {
      if (typeof d.data[field] !== 'string') fail(`${d.id}/${field}: expected text`);
      emit(tableFor(d.domain), `/data/${field}`, { [columnFor(field)]: d.data[field] });
    }
    if (Object.hasOwn(d.data, 'primary_detail_names')) {
      if (!Array.isArray(d.data.primary_detail_names)) fail('primary_detail_names');
      d.data.primary_detail_names.forEach((name, ordinal) => {
        if (!people.has(name)) fail(`unresolved primary person: ${name}`);
        emit('text_primary_detail', `/data/primary_detail_names/${ordinal}`, { ordinal, person_id: people.get(name), name });
      });
    }
    if (Object.hasOwn(d.data, 'sequence')) {
      if (!Array.isArray(d.data.sequence)) fail('sequence');
      d.data.sequence.forEach((event, ordinal) => {
        exact(event, ['id', 'anchor', 'order', 'date']);
        exact(event.date, ['status'], ['value', 'reason']);
        if (typeof event.id !== 'string' || typeof event.anchor !== 'string' || !Number.isSafeInteger(event.order)
          || typeof event.date.status !== 'string' || ['value', 'reason'].some((key) => Object.hasOwn(event.date, key) && typeof event.date[key] !== 'string')) fail('event types');
        emit('text_chronology_event', `/data/sequence/${ordinal}`, { event_id: event.id, ordinal, anchor: event.anchor,
          authored_order: event.order, date_status: event.date.status, date_value: event.date.value ?? null, date_reason: event.date.reason ?? null });
      });
    }
    if (d.domain === 'name-pools' && Object.hasOwn(d.data, 'entries')) {
      if (!Array.isArray(d.data.entries)) fail('entries');
      d.data.entries.forEach((entry, ordinal) => {
        if (typeof entry !== 'string') fail('entry type');
        emit('text_name_pool_example_entry', `/data/entries/${ordinal}`, { ordinal, entry });
      });
    }
  }
  return Object.freeze(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, Object.freeze(rows.map(Object.freeze))])));
}
export function reconstructSimpleData({ tables, source_id }) {
  const data = {};
  const rows = (table) => tables[table].filter((row) => row.source_id === source_id).sort((a, b) => a.ordinal - b.ordinal);
  for (const row of rows('text_simple_collection')) data[row.collection] = [];
  for (const [domain, field] of Object.entries(examples)) {
    const [row] = rows(tableFor(domain));
    if (row) data[field] = row[columnFor(field)];
  }
  const primary = rows('text_primary_detail');
  if (primary.length) data.primary_detail_names = primary.map((row) => row.name);
  const events = rows('text_chronology_event');
  if (events.length) data.sequence = events.map((row) => ({ id: row.event_id, anchor: row.anchor, order: row.authored_order,
    date: { status: row.date_status, ...(row.date_value === null ? {} : { value: row.date_value }), ...(row.date_reason === null ? {} : { reason: row.date_reason }) } }));
  const entries = rows('text_name_pool_example_entry');
  if (entries.length) data.entries = entries.map((row) => row.entry);
  return data;
}
