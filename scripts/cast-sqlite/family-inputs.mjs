import { readPersonBirthdayInputs } from './person-inputs.mjs';
import { orderFamilyNodes } from './family-key-order.mjs';

const path = name => `lore/name-pools/${name}.json`;
export const FAMILY_INPUT_PATHS = Object.freeze([
  'person-id-registry', 'cast-birthdays', 'cast-birth-cohorts', 'cast-family-trees',
  'diaspora-family-lineages', 'cast-family-role-decisions', 'cast-hangnyeol', 'clan-hangnyeol-tables',
].map(path));

const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const coverage = detail => fail('E_FAMILY_INPUT_COVERAGE', detail);
const ref = row => ({ path: row.source_path, ...(row.source_anchor === null ? {} : { anchor: row.source_anchor }) });

// Caller owns the connection. No source documents, generic JSON tree, or file IO.
// The return value is loadCastFamilyTrees' graph, not the full person input bundle.
export function readCastFamilyTreeInputs(db, { preserveSourceOrder = false } = {}) {
  const rows = (sql, ...args) => {
    try { return db.prepare(sql).all(...args); }
    catch (cause) {
      if (/no such (table|column)/u.test(cause.message)) fail('E_FAMILY_INPUT_SCHEMA_GAP', cause.message);
      throw cause;
    }
  };
  const sources = new Map();
  for (const logicalPath of FAMILY_INPUT_PATHS) {
    const source = rows('SELECT source_id,media_type FROM source_file WHERE logical_path=?', logicalPath);
    if (source.length !== 1) fail('E_FAMILY_INPUT_MISSING', logicalPath);
    if (source[0].media_type !== 'application/json') fail('E_FAMILY_INPUT_MEDIA_TYPE', logicalPath);
    sources.set(logicalPath, source[0].source_id);
  }
  const treeSource = sources.get(path('cast-family-trees'));
  const diasporaSource = sources.get(path('diaspora-family-lineages'));
  const metadata = rows('SELECT field_name,value_kind,text_value,integer_value FROM family_source_metadata WHERE source_id=?', treeSource);
  for (const [field, value] of Object.entries({ schemaVersion: 1, collapseYear: 2030, referenceDate: '2126-12-31', status: 'authored' })) {
    const entry = metadata.find(row => row.field_name === field);
    if (!entry || entry.value_kind !== typeof value || (typeof value === 'number' ? entry.integer_value : entry.text_value) !== value) fail('E_FAMILY_INPUT_SCHEMA_GAP', field);
  }
  const tree = rows('SELECT tree_id,collapse_year,reference_date,status,json_pointer FROM family_tree WHERE source_id=?', treeSource);
  if (metadata.length !== 4 || tree.length !== 1 || tree[0].tree_id !== 'cast-family-trees' || tree[0].collapse_year !== 2030 || tree[0].reference_date !== '2126-12-31' || tree[0].status !== 'authored' || tree[0].json_pointer !== '') fail('E_FAMILY_INPUT_SCHEMA_GAP', 'tree metadata');
  const { birthdayRoster, birthdaysById } = readPersonBirthdayInputs(db);
  const people = new Map(birthdayRoster.map(person => [person.id, person]));
  const ordered = (values, pointer) => {
    values.sort((a, b) => {
      const aa = a.json_pointer.split('/').filter(part => /^\d+$/u.test(part)).map(Number);
      const bb = b.json_pointer.split('/').filter(part => /^\d+$/u.test(part)).map(Number);
      for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
      return 0;
    });
    if (pointer && values.some((row, i) => row.json_pointer !== `/${pointer}/${i}`)) coverage(pointer);
    return values;
  };
  // Row sets are read as stored; completeness is checked structurally (ordinals,
  // orphan provenance, endpoints) rather than against fixed row counts.
  const typed = (table, source) => rows(`SELECT * FROM ${table} WHERE source_id=?`, source);
  const treeRefs = ordered(typed('family_tree_source', treeSource), 'sourceRefs');
  const nodeRows = ordered(typed('family_node', treeSource), 'nodes');
  const nodeRefs = typed('family_node_source', treeSource);
  const times = typed('family_node_timeline', treeSource);
  const edgeRows = ordered(typed('family_edge', treeSource), 'edges');
  const edgeRefs = typed('family_edge_source', treeSource);
  const members = ordered(typed('diaspora_member', diasporaSource));
  const lineages = ordered(typed('diaspora_lineage', diasporaSource), 'lineages');
  const events = typed('diaspora_member_event', diasporaSource);
  const parents = ordered(typed('diaspora_member_parent', diasporaSource));
  const usedRefs = new Set(), usedTimes = new Set(), usedEdgeRefs = new Set();
  const group = (values, key) => {
    const index = new Map();
    for (const value of values) {
      const identity = key(value);
      if (!index.has(identity)) index.set(identity, []);
      index.get(identity).push(value);
    }
    return index;
  };
  const nodeRefIndex = group(nodeRefs, row => `${row.node_id}\0${row.source_kind}`);
  const timelineIndex = group(times, row => row.node_id);
  const edgeRefIndex = group(edgeRefs, row => row.edge_id);
  const refs = (values, used) => {
    values.sort((a, b) => a.ordinal - b.ordinal);
    if (!values.length || values.some((row, i) => row.ordinal !== i || !row.source_path?.trim())) coverage('sourceRefs');
    values.forEach(row => used.add(row));
    return values.map(ref);
  };
  let nodes = nodeRows.map(row => {
    const nodeSources = kind => refs(nodeRefIndex.get(`${row.node_id}\0${kind}`) ?? [], usedRefs);
    const timeline = (timelineIndex.get(row.node_id) ?? []).sort((a, b) => a.ordinal - b.ordinal);
    if (!timeline.length || timeline.some((entry, i) => entry.ordinal !== i)) coverage(row.node_id);
    const person = people.get(row.person_id);
    if (row.person_id !== null && (!person || row.node_id !== row.person_id)) coverage(row.node_id);
    return { id: row.node_id, personId: row.person_id, kind: row.node_kind,
      name: person?.name ?? row.name, ...(row.name_en === null ? {} : { nameEn: row.name_en }),
      birthDate: person ? birthdaysById.get(row.person_id).birthDate : row.birth_date, deathDate: row.death_date,
      status: row.status, sourceRefs: nodeSources('node'),
      timeline: timeline.map(entry => {
        usedTimes.add(entry);
        return { year: entry.year, summary: entry.summary, ...(entry.summary_en === null ? {} : { summaryEn: entry.summary_en }), sourceRefs: nodeSources(`timeline:${entry.ordinal}`) };
      }),
      ...(row.lineage_surname === null ? {} : { lineage: { surname: row.lineage_surname, bongwan: row.lineage_bongwan, clan: row.lineage_clan } }),
      ...(row.generation_exception_reason === null ? {} : { generationException: { reason: row.generation_exception_reason, sourceRefs: nodeSources('generation-exception') } }),
    };
  });
  if (preserveSourceOrder) nodes = orderFamilyNodes(db, nodes);
  const edges = edgeRows.map(row => ({ id: row.edge_id, from: row.from_node_id, to: row.to_node_id, type: row.edge_type,
    ...(row.parent_role === null ? {} : { parentRole: row.parent_role }), status: row.status,
    sourceRefs: refs(edgeRefIndex.get(row.edge_id) ?? [], usedEdgeRefs) }));
  if (usedRefs.size !== nodeRefs.length || usedTimes.size !== times.length || usedEdgeRefs.size !== edgeRefs.length) coverage('orphan provenance');
  const usedEvents = new Set(), usedParents = new Set();
  for (const lineage of lineages) {
    const family = members.filter(member => member.lineage_key === lineage.lineage_key);
    if (family.length !== 4 || !family.some(member => member.person_id === lineage.current_person_id)) coverage(lineage.lineage_key);
    for (const [index, member] of family.entries()) {
      if (member.json_pointer !== `${lineage.json_pointer}/members/${index}`) coverage(member.member_key);
      const sourceRefs = [{ path: path('diaspora-family-lineages'), anchor: `${lineage.lineage_key}/${member.member_key}` }];
      const memberEvents = events.filter(event => event.member_key === member.member_key).sort((a, b) => a.ordinal - b.ordinal);
      if (!memberEvents.length || memberEvents.some((event, i) => event.ordinal !== i)) coverage(member.member_key);
      const person = people.get(member.person_id);
      if (member.person_id !== null && (!person || member.member_key !== member.person_id)) coverage(member.member_key);
      nodes.push({ id: member.member_key, personId: member.person_id, kind: person ? 'person' : 'historical', name: person?.name ?? member.name_ko,
        birthDate: person ? birthdaysById.get(member.person_id).birthDate : member.birth_date, deathDate: null, status: 'preserved', sourceRefs,
        timeline: memberEvents.map(event => {
          usedEvents.add(event);
          return { year: event.event_year, ...(event.event_date ? { date: event.event_date } : {}), summary: member.timeline_ko, sourceRefs };
        }) });
      const memberParents = parents.filter(parent => parent.member_key === member.member_key);
      for (const [i, parent] of memberParents.entries()) {
        if (parent.json_pointer !== `${member.json_pointer}/parentKeys/${i}`) coverage(member.member_key);
        usedParents.add(parent);
        edges.push({ id: `${parent.parent_key}:${member.member_key}:biological`, from: parent.parent_key, to: member.member_key, type: 'biological',
          ...(parent.parent_role === null ? {} : { parentRole: parent.parent_role }), status: 'preserved', sourceRefs });
      }
    }
  }
  if (usedEvents.size !== events.length || usedParents.size !== parents.length) coverage('diaspora coverage');
  const ids = new Set(nodes.map(node => node.id));
  const personIds = nodes.filter(node => node.personId !== null).map(node => node.personId);
  if (ids.size !== nodes.length || new Set(personIds).size !== personIds.length || personIds.length !== birthdayRoster.length || birthdayRoster.some(person => !personIds.includes(person.id))) coverage('issued identities');
  if (new Set(edges.map(edge => edge.id)).size !== edges.length || edges.some(edge => !ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to)) coverage('edge endpoints');
  return { schemaVersion: 1, collapseYear: tree[0].collapse_year, referenceDate: tree[0].reference_date, status: tree[0].status,
    sourceRefs: treeRefs.map(row => ({ path: row.source_path })), nodes, edges, imports: [{ path: path('diaspora-family-lineages') }] };
}
