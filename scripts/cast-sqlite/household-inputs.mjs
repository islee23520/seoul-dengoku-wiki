const SOURCE = 'lore/name-pools/cast-household-relations.json';
const fail = (code, detail) => { throw Object.assign(new Error(`${code}: ${detail}`), { code }); };
const coverage = detail => fail('E_HOUSEHOLD_INPUT_COVERAGE', detail);

// This supported snapshot has coveredPersonIds in people order, empty new private
// retainers, absent known-link id/basis and authored-link direction, and anchors
// on every reference. The producer discards these shape distinctions. Do not
// drop these shape rules without auditing the complete ledger and mapping.
// Caller owns the connection; only typed household rows and scalar metadata are read.
export function readCastHouseholdInputs(db) {
  const rows = (sql, ...args) => {
    try { return db.prepare(sql).all(...args); }
    catch (cause) {
      if (/no such (table|column)/u.test(cause.message)) fail('E_HOUSEHOLD_INPUT_SCHEMA_GAP', cause.message);
      throw cause;
    }
  };
  const sources = rows('SELECT source_id,sha256,media_type FROM source_file WHERE logical_path=?', SOURCE);
  if (sources.length !== 1) fail('E_HOUSEHOLD_INPUT_MISSING', SOURCE);
  const source = sources[0];
  if (source.media_type !== 'application/json') fail('E_HOUSEHOLD_INPUT_STALE', SOURCE);
  const typed = (table, count) => {
    const values = rows(`SELECT * FROM ${table} WHERE source_id=?`, source.source_id);
    if (count !== undefined && values.length !== count) coverage(table);
    return values;
  };
  const metadata = typed('family_source_metadata', 2);
  for (const [field, value] of Object.entries({ schema: 'seoul-dengoku.cast-household-relations.v1', status: 'draft' })) {
    const row = metadata.find(row => row.field_name === field);
    if (!row || row.value_kind !== 'string' || row.text_value !== value || row.integer_value !== null || row.boolean_value !== null || row.json_pointer !== `/${field}`) fail('E_HOUSEHOLD_INPUT_SCHEMA_GAP', field);
  }
  const [manifest] = typed('household_manifest', 1);
  if (manifest.manifest_id !== 'cast-household-relations' || manifest.json_pointer !== '') coverage('manifest');
  const people = typed('household_person');
  const personRefs = typed('household_person_source');
  const links = typed('household_link');
  const linkRefs = typed('household_link_source');
  const courts = typed('household_court');
  const retainers = typed('household_court_retainer');
  const retainerRefs = typed('household_court_retainer_source');
  const contexts = typed('household_humanoid_context');
  const contextRefs = typed('household_humanoid_context_source');
  const used = new Set();
  const ordered = (values, base) => {
    values.sort((a, b) => Number(a.json_pointer.slice(base.length + 1)) - Number(b.json_pointer.slice(base.length + 1)));
    if (values.some((row, i) => row.json_pointer !== `${base}/${i}`)) coverage(base);
    values.forEach(row => used.add(row));
    return values;
  };
  const refs = (values, base) => ordered(values, `${base}/sourceRefs`).map(row => {
    if (typeof row.source_path !== 'string' || typeof row.source_anchor !== 'string') coverage(base);
    return { path: row.source_path, anchor: row.source_anchor };
  });
  const retainer = row => {
    used.add(row);
    return {
      personId: row.person_id, liegePersonId: row.liege_person_id, courtId: row.court_id,
      sourceRow: row.source_row, role: row.role,
      sourceRefs: refs(retainerRefs.filter(ref => ref.retainer_json_pointer === row.json_pointer && ref.court_id === row.court_id && ref.person_id === row.person_id && ref.source_row === row.source_row), row.json_pointer)
    };
  };
  const result = {
    schema: metadata.find(row => row.field_name === 'schema').text_value,
    status: manifest.status,
    scope: { kind: manifest.scope_kind, coveredPersonIds: [], isolatedAtAudit: manifest.isolated_at_audit, allIsolatedAuthored: Boolean(manifest.all_isolated_authored) },
    quantityContract: { mode: manifest.quantity_mode, courts: manifest.court_count, directRetainers: manifest.direct_retainer_count, source: manifest.quantity_source },
    people: ordered(people, '/people').map(row => {
      const base = row.json_pointer;
      const personSources = (kind, path) => refs(personRefs.filter(ref => ref.person_id === row.person_id && ref.source_kind === kind), path);
      const personLinks = kind => ordered(links.filter(link => link.owner_person_id === row.person_id && link.json_pointer.startsWith(`${base}/${kind}/`)), `${base}/${kind}`).map(link => ({
        ...(kind === 'links' ? { id: link.link_id } : {}), recipientId: link.recipient_key, recipientKind: link.recipient_kind,
        type: link.link_type, ...(kind === 'knownLinks' ? { direction: link.direction } : {}), role: link.role, status: link.status,
        ...(kind === 'links' ? { basis: link.basis } : {}), sourceRefs: refs(linkRefs.filter(ref => ref.link_id === link.link_id), link.json_pointer),
      }));
      const ownedCourts = courts.filter(court => court.owner_person_id === row.person_id);
      if (ownedCourts.length > 1) coverage(base);
      const court = ownedCourts[0];
      if (court && court.json_pointer !== `${base}/court`) coverage(base);
      if (court) used.add(court);
      const direct = retainers.filter(entry => entry.json_pointer === `${base}/directRetainer`);
      if (direct.length > 1) coverage(base);
      return {
        personId: row.person_id, name: row.name, sourceRefs: personSources('person', base),
        household: {
          personFaith: { status: row.person_faith_status, sourceRefs: personSources('person-faith', `${base}/household/personFaith`) },
          houseFaith: { status: row.house_faith_status, sourceRefs: personSources('house-faith', `${base}/household/houseFaith`) },
          humanoidAdmission: row.humanoid_admission, genderPreference: row.gender_preference, newPrivateRetainers: [], politicalPosition: row.political_position
        },
        links: personLinks('links'), knownLinks: personLinks('knownLinks'),
        court: court ? {
          id: court.court_id, ownerPersonId: court.owner_person_id, stateId: court.state_id,
          retainers: ordered(retainers.filter(entry => entry.court_id === court.court_id && entry.json_pointer.startsWith(`${base}/court/retainers/`)), `${base}/court/retainers`).map(retainer)
        } : null,
        directRetainer: direct.length ? retainer(direct[0]) : null,
        deficits: {
          normalizedSocialContact: Boolean(row.normalized_social_contact), familyParent: Boolean(row.family_parent), faithUnresolved: Boolean(row.faith_unresolved),
          privateRetainerStatus: row.private_retainer_status, backgroundContactAuthoring: row.background_contact_authoring
        }
      };
    }),
    existingHumanoidContext: ordered(contexts, '/existingHumanoidContext').map(row => ({
      actorId: row.actor_id, custodianPersonId: row.custodian_person_id,
      stewardHouseId: row.steward_house_id, scope: row.scope, assignmentAction: row.assignment_action,
      sourceRefs: refs(contextRefs.filter(ref => ref.actor_id === row.actor_id), row.json_pointer)
    })),
  };
  result.scope.coveredPersonIds = result.people.map(person => person.personId);
  if (new Set(result.scope.coveredPersonIds).size !== result.people.length) coverage('stable person identities');
  if ([people, personRefs, links, linkRefs, courts, retainers, retainerRefs, contexts, contextRefs].flat().some(row => !used.has(row))) coverage('orphan typed rows');
  return result;
}

/** PostgreSQL twin with source-scoped typed tables and shared shape checks. */
export async function readCastHouseholdInputsAsync(tx) {
  try {
    const sourceSql = 'SELECT source_id,sha256,media_type FROM source_file WHERE logical_path=?';
    const sources = await tx.all('SELECT source_id,sha256,media_type FROM wiki.source_file WHERE logical_path=?', [SOURCE]);
    if (sources.length !== 1) fail('E_HOUSEHOLD_INPUT_MISSING', SOURCE);
    if (sources[0].media_type !== 'application/json') fail('E_HOUSEHOLD_INPUT_STALE', SOURCE);
    const sourceId = sources[0].source_id;
    const tables = new Map();
    for (const table of ['family_source_metadata', 'household_manifest', 'household_person', 'household_person_source',
      'household_link', 'household_link_source', 'household_court', 'household_court_retainer',
      'household_court_retainer_source', 'household_humanoid_context', 'household_humanoid_context_source']) {
      tables.set(`SELECT * FROM ${table} WHERE source_id=?`, await tx.all(`SELECT * FROM wiki.${table} WHERE source_id=?`, [sourceId]));
    }
    return readCastHouseholdInputs({
      prepare(sql) {
        return {
          all: (...params) => {
            if (sql === sourceSql && params.length === 1 && params[0] === SOURCE) return sources;
            if (params.length === 1 && params[0] === sourceId && tables.has(sql)) return tables.get(sql);
            fail('E_HOUSEHOLD_INPUT_SCHEMA_GAP', `unmaterialized statement: ${sql}`);
          }
        };
      }
    });
  } catch (error) {
    if (['42P01', '42703'].includes(error.code)) fail('E_HOUSEHOLD_INPUT_SCHEMA_GAP', error.message);
    throw error;
  }
}
