const TEXT_DESIRES = ['지향', '결합'];

function fail(code, message) {
  throw Object.assign(new Error(`${code}: ${message}`), { code });
}

function text(value, context, nullable = false) {
  if (nullable && (value === undefined || value === null)) return null;
  if (typeof value !== 'string') fail('E_IDENTITY_TEXT_TYPE', context);
  return value;
}

function boolean(value, code, optional = false) {
  if (optional && (value === undefined || value === null)) return null;
  if (typeof value !== 'boolean') fail(code, 'Expected a boolean');
  return Number(value);
}

function object(value, context) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('E_IDENTITY_OBJECT_TYPE', context);
  return value;
}

function array(value, context) {
  if (!Array.isArray(value)) fail('E_IDENTITY_ARRAY_TYPE', context);
  return value;
}

function source(bundle, name) {
  const logicalPath = `lore/name-pools/${name}.json`;
  const files = array(bundle.files, 'bundle.files').filter(file => file.logical_path === logicalPath);
  if (files.length !== 1) fail('E_IDENTITY_SOURCE_MISSING', logicalPath);
  return object(files[0].document, logicalPath);
}

function registryRows(document) {
  const byName = new Map();
  const ids = new Set();
  const aliasNames = new Set();
  const aliases = [];
  for (const person of array(document.persons, 'registry.persons')) {
    const { id, name } = object(person, 'registry person');
    if (typeof id !== 'string' || !/^K[0-9]{3,}$/.test(id)) fail('E_PERSON_ID', String(id));
    if (typeof name !== 'string' || name.length === 0) fail('E_PERSON_NAME', String(name));
    if (ids.has(id)) fail('E_PERSON_DUPLICATE_ID', id);
    if (byName.has(name)) fail('E_PERSON_DUPLICATE_NAME', name);
    ids.add(id);
    byName.set(name, id);
    for (const [aliasOrdinal, alias] of array(person.aliases ?? [], 'registry aliases').entries()) {
      if (typeof alias !== 'string' || alias.length === 0) fail('E_PERSON_ALIAS_TYPE', id);
      if (aliasNames.has(alias)) fail('E_PERSON_DUPLICATE_ALIAS', alias);
      aliasNames.add(alias);
      aliases.push({ person_id: id, alias, alias_ordinal: aliasOrdinal });
    }
  }
  if (byName.size === 0 || (document.totalPeople !== undefined && document.totalPeople !== byName.size)) fail('E_PERSON_COUNT', 'Registry count does not match');
  return { byName, aliases };
}

function exactPeople(document, byName, dataset) {
  const people = array(document.people, `${dataset}.people`);
  const names = new Set();
  for (const person of people) {
    const { name } = object(person, `${dataset} person`);
    if (!byName.has(name)) fail(`E_${dataset}_ORPHAN`, String(name));
    if (names.has(name)) fail(`E_${dataset}_DUPLICATE_NAME`, name);
    names.add(name);
  }
  if (names.size !== byName.size || (document.count !== undefined && document.count !== people.length)) fail(`E_${dataset}_PERSON_SET`, 'Names do not match registry');
  return people;
}

function axisNames(value, expectedCount, code) {
  const axes = array(value, code);
  if (axes.length !== expectedCount || new Set(axes).size !== axes.length || axes.some(axis => typeof axis !== 'string' || !axis)) fail(code, 'Invalid axis dictionary');
  return axes;
}

function axisRecord(value, axes, code) {
  const record = object(value, code);
  const keys = Object.keys(record);
  if (keys.length !== axes.length || axes.some(axis => !Object.hasOwn(record, axis))) fail(code, 'Axis set does not match dictionary');
  return record;
}

function score(value, code) {
  if (!Number.isInteger(value) || value < -100 || value > 100) fail(code, 'Expected integer in -100..100');
  return value;
}

function valueRows(document, byName) {
  const axes = axisNames(document.axes, 10, 'E_VALUE_AXES');
  const numericDesires = axisNames(document.desire_axes, 5, 'E_DESIRE_AXES');
  if (numericDesires.some(axis => TEXT_DESIRES.includes(axis))) fail('E_DESIRE_AXES', 'Numeric and qualitative axes overlap');
  const desireAxes = [...numericDesires, ...TEXT_DESIRES].map((axis_name, axis_ordinal) => ({ axis_name, axis_ordinal, value_kind: numericDesires.includes(axis_name) ? 'integer' : 'text' }));
  const people = [], personValues = [], personDesires = [];
  const stateLabels = new Map();
  for (const [ordinal, person] of exactPeople(document, byName, 'VALUES').entries()) {
    const person_id = byName.get(person.name);
    if (typeof person.state !== 'string' || person.state.length === 0) fail('E_STATE_ID', String(person.state));
    const stateName = text(person.state_name, 'state_name');
    if (!stateLabels.has(person.state)) stateLabels.set(person.state, new Set());
    stateLabels.get(person.state).add(stateName);
    const publicKey = `person-${String(ordinal + 1).padStart(4, '0')}`;
    people.push({ person_id, name: person.name, publication_ordinal: ordinal + 1, public_key: publicKey, public_route: `/people/${publicKey}`, state_id: person.state, state_name: stateName,
      title: text(person.title, 'title', true), stage: text(person.stage, 'stage', true), generation: text(person.generation, 'generation', true), source_kind: text(person.source, 'source', true),
      minors: boolean(person.minors, 'E_MINORS_TYPE'), locked: boolean(person.locked, 'E_LOCKED_TYPE', true), values_source_ordinal: ordinal });
    const values = axisRecord(person.values, axes, 'E_VALUE_AXES');
    for (const axis_name of axes) personValues.push({ person_id, axis_name, value: score(values[axis_name], 'E_VALUE_RANGE') });
    const desire = axisRecord(person.desire, desireAxes.map(axis => axis.axis_name), 'E_DESIRE_AXES');
    for (const { axis_name, value_kind } of desireAxes) {
      const value = desire[axis_name];
      if (value_kind === 'text' && value !== null && typeof value !== 'string') fail('E_DESIRE_TYPE', `${person.name}/${axis_name}`);
      personDesires.push({ person_id, axis_name, value_kind, integer_value: value_kind === 'integer' ? score(value, 'E_DESIRE_RANGE') : null, text_value: value_kind === 'text' ? value : null });
    }
  }
  return { states: [...stateLabels].map(([state_id, labels]) => ({ state_id, name_ko: labels.size === 1 ? [...labels][0] : null })),
    stateLabels: [...stateLabels].flatMap(([state_id, labels]) => [...labels].map(name_ko => ({ state_id, name_ko }))), people,
    valueAxes: axes.map((axis_name, axis_ordinal) => ({ axis_name, axis_ordinal })), personValues, desireAxes, personDesires };
}

function genderRows(document, byName, states) {
  const stateIds = new Set(states.map(state => state.state_id));
  return exactPeople(document, byName, 'GENDER').map(person => {
    if (!stateIds.has(person.state)) fail('E_GENDER_STATE', String(person.state));
    return { person_id: byName.get(person.name), state_id: person.state, gender: text(person.gender, 'gender'), assignment_source: text(person.source, 'gender source'), user_locked: boolean(person.user_locked, 'E_GENDER_USER_LOCKED_TYPE') };
  });
}

function lineageRows(document, clanDocument, byName) {
  const clans = new Map();
  const clanSources = [], clanHangnyeolRows = [];
  for (const clan of array(clanDocument.clans, 'clans')) {
    const id = text(clan.id, 'clan id');
    if (!id) fail('E_CLAN_ID', id);
    if (clans.has(id)) fail('E_CLAN_DUPLICATE_ID', id);
    clans.set(id, { clan_id: id, base_clan_id: null, surname: text(clan.surname, 'clan surname', true), bongwan: text(clan.bongwan, 'clan bongwan', true),
      bongwan_hanja: text(clan.bongwan_hanja, 'clan bongwan_hanja', true), branch: text(clan.branch, 'clan branch', true), provenance: text(clan.provenance, 'clan provenance', true),
      hangnyeol_unconfirmed_reason: text(clan.hangnyeol_unconfirmed_reason, 'clan hangnyeol_unconfirmed_reason', true),
      source_label: text(clan.source, 'clan source', true),
      surname_hanja: text(clan.surname_hanja, 'clan surname_hanja', true),
      creative_rationale: text(clan.creative_rationale, 'clan creative_rationale', true),
      method_ref: text(clan.method_ref, 'clan method_ref', true),
      show_branches: boolean(clan.show_branches, 'E_CLAN_SHOW_BRANCHES_TYPE', true) });
    for (const [ordinal, source_ref] of array(clan.sources === undefined ? [] : clan.sources, 'clan sources').entries()) {
      if (typeof source_ref !== 'string') fail('E_CLAN_SOURCE_TYPE', id);
      clanSources.push({ clan_id: id, ordinal, source_ref });
    }
    if (clan.rows === undefined && (clan.hangnyeol !== null || array(clan.branches, 'clan branches').length !== 0)) {
      fail('E_IDENTITY_ARRAY_TYPE', 'clan rows');
    }
    for (const [ordinal, entry] of array(clan.rows === undefined ? [] : clan.rows, 'clan rows').entries()) {
      const row = object(entry, 'clan hangnyeol row');
      if (!Number.isSafeInteger(row.sesu)) fail('E_CLAN_SESU_TYPE', id);
      clanHangnyeolRows.push({ clan_id: id, ordinal, sesu: row.sesu, hangnyeol: text(row.hangnyeol, 'clan hangnyeol'), hanja: text(row.hanja, 'clan hanja', true), position: text(row.position, 'clan position') });
    }
  }
  const clanId = value => {
    const id = text(value, 'clan reference', true);
    if (id !== null && !clans.has(id)) fail('E_LINEAGE_CLAN_ORPHAN', id);
    return id;
  };
  const sesu = value => {
    if (value === undefined || value === null) return null;
    if (!Number.isSafeInteger(value)) fail('E_LINEAGE_SESU_TYPE', String(value));
    return value;
  };
  const lineageSourceClans = [];
  const lineages = exactPeople(document, byName, 'LINEAGE').map((person, source_ordinal) => {
    const person_id = byName.get(person.name);
    const naming_convention = text(person.namingConvention, 'namingConvention', true);
    const namingSource = person.namingConventionSource;
    if (naming_convention !== null && naming_convention !== 'non-korean-lineage') fail('E_NAMING_CONVENTION', person.name);
    if ((naming_convention === null) !== (namingSource === undefined || namingSource === null)) fail('E_NAMING_SOURCE', person.name);
    let naming_source_character_id = null, naming_source_path = null, naming_source_basis = null;
    if (naming_convention !== null) {
      const provenance = object(namingSource, 'namingConventionSource');
      naming_source_character_id = text(provenance.characterId, 'naming source characterId');
      naming_source_path = text(provenance.path, 'naming source path');
      naming_source_basis = text(provenance.basis, 'naming source basis');
      if (naming_source_character_id !== person_id || naming_source_path !== 'lore/name-pools/person-id-registry.json' || !naming_source_basis) fail('E_NAMING_SOURCE', person.name);
    }
    const originalClan = text(person.clan, 'clan reference', true);
    if (naming_convention !== null && originalClan !== null) lineageSourceClans.push({ person_id, source_ref: originalClan, source_ordinal });
    const clan_id = naming_convention === null ? clanId(originalClan) : null;
    const base_clan_id = clanId(person.base_clan);
    if (naming_convention !== null && base_clan_id !== null) fail('E_NAMING_SOURCE', 'non-Korean lineage cannot inherit Korean base clan');
    if (base_clan_id !== null) {
      if (clan_id === null) fail('E_LINEAGE_CLAN_ORPHAN', 'Base clan without member clan');
      const clan = clans.get(clan_id);
      if (clan.base_clan_id !== null && clan.base_clan_id !== base_clan_id) fail('E_CLAN_BASE_CONFLICT', clan_id);
      clan.base_clan_id = base_clan_id;
    }
    return { person_id, surname: text(person.surname, 'surname'), status: text(person.status, 'status'), bongwan: text(person.bongwan, 'bongwan', true), clan_id, base_clan_id,
      branch: text(person.branch, 'branch', true), reason: text(person.reason, 'reason', true), source_file_label: text(person.source_file, 'source_file', true),
      surname_hanja: text(person.surname_hanja, 'surname_hanja', true), bongwan_hanja: text(person.bongwan_hanja, 'bongwan_hanja', true),
      hangnyeol: text(person.hangnyeol, 'hangnyeol', true), position: text(person.position, 'position', true), sesu: sesu(person.sesu),
      naming_convention, naming_source_character_id, naming_source_path, naming_source_basis };
  });
  const lineage = object(document.lineage, 'lineage');
  const nodes = new Map();
  const nodeName = value => {
    const name = text(value, 'lineage reference name');
    if (!name) fail('E_LINEAGE_NODE_NAME', name);
    if (!nodes.has(name)) nodes.set(name, { name, person_id: byName.get(name) ?? null });
    return name;
  };
  const lineageParents = Object.entries(object(lineage.parents, 'lineage.parents')).map(([child, parent]) => ({ child_name: nodeName(child), parent_name: nodeName(parent) }));
  const lineageFounderSesu = Object.entries(object(lineage.founder_sesu, 'lineage.founder_sesu')).map(([name, value]) => {
    if (value === null) fail('E_LINEAGE_SESU_TYPE', name);
    return { person_name: nodeName(name), sesu: sesu(value) };
  });
  const lineageClanAssignments = Object.entries(object(lineage.person_clan, 'lineage.person_clan')).map(([name, value]) => {
    if (!byName.has(name)) fail('E_LINEAGE_ASSIGNMENT_ORPHAN', name);
    nodeName(name);
    if (value === null) fail('E_LINEAGE_CLAN_ORPHAN', name);
    return { person_id: byName.get(name), clan_id: clanId(value) };
  });
  return { clans: [...clans.values()], clanSources, clanHangnyeolRows, lineages, lineageSourceClans, lineageNodes: [...nodes.values()], lineageParents, lineageFounderSesu, lineageClanAssignments };
}

export function mapIdentityDomains(bundle) {
  const { byName, aliases } = registryRows(source(bundle, 'person-id-registry'));
  const values = valueRows(source(bundle, 'values-cast'), byName);
  const genders = genderRows(source(bundle, 'gender-cast'), byName, values.states);
  const lineage = lineageRows(source(bundle, 'cast-hangnyeol'), source(bundle, 'clan-hangnyeol-tables'), byName);
  const routeById = new Map(values.people.map((person) => [person.person_id, person.public_route]));
  const routes = new Set();
  for (const person of exactPeople(source(bundle, 'gurps-cast'), byName, 'GURPS')) {
    if (person.id !== byName.get(person.name)) fail('E_GURPS_ID_MISMATCH', person.name);
    const route = text(person.url, 'GURPS public route');
    if (!/^\/people\/person-[0-9]{4}$/u.test(route) || routes.has(route) || routeById.get(person.id) !== route) fail('E_PUBLIC_ROUTE_MISMATCH', person.id);
    routes.add(route);
  }
  const result = { ...values, aliases, genders, ...lineage };
  for (const rows of Object.values(result)) {
    rows.forEach(Object.freeze);
    Object.freeze(rows);
  }
  return Object.freeze(result);
}
