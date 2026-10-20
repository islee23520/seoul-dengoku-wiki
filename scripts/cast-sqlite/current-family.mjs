const FAMILY_PATH = (name) => `lore/name-pools/${name}.json`;

function fail(code, message) {
  throw Object.assign(new Error(`${code}: ${message}`), { code });
}

function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('E_FAMILY_OBJECT', label);
  return value;
}

function array(value, label) {
  if (!Array.isArray(value)) fail('E_FAMILY_ARRAY', label);
  return value;
}

function text(value, label, nullable = false) {
  if (nullable && (value === undefined || value === null)) return null;
  if (typeof value !== 'string') fail('E_FAMILY_TEXT', label);
  return value;
}

function integer(value, label, nullable = false) {
  if (nullable && (value === undefined || value === null)) return null;
  if (!Number.isSafeInteger(value)) fail('E_FAMILY_INTEGER', label);
  return value;
}

function boolean(value, label) {
  if (typeof value !== 'boolean') fail('E_FAMILY_BOOLEAN', label);
  return value;
}

function optionalPathRef(value, label) {
  const ref = object(value, label);
  return { path: text(ref.path, `${label}.path`), anchor: text(ref.anchor, `${label}.anchor`, true) };
}

function source(bundle, name) {
  const path = FAMILY_PATH(name);
  const files = array(bundle.files, 'bundle.files').filter((file) => file.logical_path === path);
  if (files.length !== 1) fail('E_FAMILY_SOURCE_MISSING', path);
  const file = object(files[0], path);
  return { source_id: integer(file.source_id, `${path}.source_id`), document: object(file.document, path) };
}

function pointer(...parts) {
  return `/${parts.map(String).map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`;
}

function personIndex(identity) {
  const people = array(object(identity, 'identity').people, 'identity.people');
  const ids = new Map();
  for (const person of people) {
    const row = object(person, 'identity.people row');
    const id = text(row.person_id, 'identity.person_id');
    const name = text(row.name, 'identity.name');
    if (ids.has(id)) fail('E_FAMILY_IDENTITY_DUPLICATE', id);
    ids.set(id, name);
  }
  if (ids.size === 0) fail('E_FAMILY_IDENTITY_EMPTY', 'identity.people');
  return ids;
}

function requirePerson(ids, personId, label) {
  const id = text(personId, label);
  if (!ids.has(id)) fail('E_FAMILY_PERSON_ORPHAN', id);
  return id;
}

function freezeRows(result) {
  for (const rows of Object.values(result)) {
    rows.forEach(Object.freeze);
    Object.freeze(rows);
  }
  return Object.freeze(result);
}

export const FAMILY_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  family_source_metadata: 'source_id field_name value_kind text_value integer_value boolean_value json_pointer',
  family_birthday: 'person_id birth_date source_status source_id json_pointer',
  family_birthday_source: 'person_id ordinal source_id json_pointer source_ref',
  family_birth_cohort: 'cohort_id start_year end_year source_id json_pointer',
  family_birth_cohort_assignment: 'person_id cohort_id baseline_birth_date source_id json_pointer',
  family_tree: 'tree_id collapse_year reference_date status source_id json_pointer',
  family_tree_source: 'tree_id ordinal source_id json_pointer source_path',
  family_node: 'node_id person_id node_kind name name_en birth_date death_date status lineage_surname lineage_bongwan lineage_clan generation_exception_reason source_id json_pointer',
  family_node_source: 'node_id source_kind ordinal source_id json_pointer source_path source_anchor',
  family_node_timeline: 'node_id ordinal year summary summary_en source_id json_pointer',
  family_edge: 'edge_id from_node_id to_node_id edge_type parent_role status source_id json_pointer',
  family_edge_source: 'edge_id ordinal source_id json_pointer source_path source_anchor',
  family_parent_status: 'person_id status known_parent_id known_relationship source_ref_path source_ref_anchor source_id json_pointer',
  family_role_decision: 'decision_group ordinal edge_id from_node_id to_node_id parent_role decision_kind category source_status basis selection_ref source_id json_pointer',
  family_role_decision_fact: 'decision_group ordinal field_path value_kind text_value integer_value boolean_value source_id json_pointer',
  family_role_decision_source: 'decision_group ordinal ref_ordinal source_path source_anchor source_id json_pointer',
  household_manifest: 'manifest_id status scope_kind isolated_at_audit all_isolated_authored quantity_mode court_count direct_retainer_count quantity_source source_id json_pointer',
  household_person: 'person_id name person_faith_status house_faith_status humanoid_admission gender_preference political_position normalized_social_contact family_parent faith_unresolved private_retainer_status background_contact_authoring source_id json_pointer',
  household_person_source: 'person_id source_kind ordinal source_id json_pointer source_path source_anchor',
  household_link: 'link_id owner_person_id recipient_person_id recipient_node_id recipient_key recipient_kind link_type direction role status basis source_id json_pointer',
  household_link_source: 'link_id ordinal source_id json_pointer source_path source_anchor',
  household_court: 'court_id owner_person_id state_id source_id json_pointer',
  household_court_retainer: 'court_id person_id liege_person_id source_row role source_id json_pointer',
  household_court_retainer_source: 'court_id person_id source_row retainer_json_pointer ordinal source_path source_anchor source_id json_pointer',
  household_humanoid_context: 'actor_id custodian_person_id steward_house_id scope assignment_action source_id json_pointer',
  household_humanoid_context_source: 'actor_id ordinal source_path source_anchor source_id json_pointer',
  diaspora_lineage: 'lineage_key current_person_id source_id json_pointer',
  diaspora_member: 'member_key lineage_key person_id generation name_ko name_en birth_date timeline_ko timeline_en narrative_ko narrative_en source_id json_pointer',
  diaspora_member_parent: 'member_key parent_member_key parent_node_id parent_key parent_role source_id json_pointer',
  diaspora_member_event: 'member_key ordinal event_year event_kind event_date source_id json_pointer',
  household_policy_value: 'policy_key ordinal value_kind text_value integer_value boolean_value source_id json_pointer',
  household_policy_political_position: 'entity_key position source_id json_pointer',
  household_policy_source: 'ordinal source_path source_anchor source_id json_pointer',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));

function scalarFields(value, prefix = '') {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => scalarFields(child, `${prefix}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`));
  }
  const value_kind = value === null ? 'null' : typeof value;
  if (!['null', 'string', 'number', 'boolean'].includes(value_kind) || (value_kind === 'number' && !Number.isSafeInteger(value))) fail('E_FAMILY_SCALAR', prefix);
  return [{ field_path: prefix, value_kind, text_value: typeof value === 'string' ? value : null, integer_value: typeof value === 'number' ? value : null, boolean_value: typeof value === 'boolean' ? Number(value) : null }];
}

function metadata(bundle, result) {
  for (const file of bundle.files) {
    if (!['cast-birthdays', 'cast-birth-cohorts', 'cast-family-trees', 'cast-family-parent-status', 'cast-family-role-decisions', 'cast-household-relations', 'diaspora-family-lineages', 'household-humanoid-policy'].some((name) => file.logical_path === FAMILY_PATH(name))) continue;
    for (const [field_name, value] of Object.entries(file.document)) {
      if (value !== null && typeof value === 'object') continue;
      const [{ value_kind, text_value, integer_value, boolean_value }] = scalarFields(value);
      result.family_source_metadata.push({ source_id: file.source_id, field_name, value_kind, text_value, integer_value, boolean_value, json_pointer: pointer(field_name) });
    }
  }
}

function addRefs(rows, sourceId, basePointer, owner, sourceKind, refs) {
  for (const [ordinal, value] of array(refs ?? [], `${basePointer}/sourceRefs`).entries()) {
    const ref = optionalPathRef(value, `${basePointer}/sourceRefs/${ordinal}`);
    rows.push({ ...owner, source_kind: sourceKind, ordinal, source_id: sourceId, json_pointer: pointer(...basePointer.slice(1).split('/'), 'sourceRefs', ordinal), source_path: ref.path, source_anchor: ref.anchor });
  }
}

function birthdays(bundle, ids, result) {
  const { source_id, document } = source(bundle, 'cast-birthdays');
  const seen = new Set();
  for (const [ordinal, value] of array(document.people, 'birthdays.people').entries()) {
    const row = object(value, 'birthday'); const person_id = requirePerson(ids, row.id, 'birthday.id');
    if (seen.has(person_id)) fail('E_FAMILY_DUPLICATE_BIRTHDAY', person_id); seen.add(person_id);
    if (ids.get(person_id) !== text(row.name, 'birthday.name')) fail('E_FAMILY_PERSON_NAME', person_id);
    const json_pointer = pointer('people', ordinal);
    result.family_birthday.push({ person_id, birth_date: text(row.birthDate, 'birthday.birthDate'), source_status: text(row.sourceStatus, 'birthday.sourceStatus'), source_id, json_pointer });
    for (const [refOrdinal, ref] of array(row.sourceRefs, 'birthday.sourceRefs').entries()) result.family_birthday_source.push({ person_id, ordinal: refOrdinal, source_id, json_pointer: pointer('people', ordinal, 'sourceRefs', refOrdinal), source_ref: text(ref, 'birthday.sourceRef') });
  }
  if (seen.size !== ids.size) fail('E_FAMILY_BIRTHDAY_SET', 'birthday people must equal identity.people');
}

function cohorts(bundle, ids, result) {
  const { source_id, document } = source(bundle, 'cast-birth-cohorts'); const cohortIds = new Set();
  for (const [ordinal, value] of array(document.cohorts, 'cohorts').entries()) { const row = object(value, 'cohort'); const cohort_id = integer(row.id, 'cohort.id'); if (cohortIds.has(cohort_id)) fail('E_FAMILY_DUPLICATE_COHORT', String(cohort_id)); cohortIds.add(cohort_id); result.family_birth_cohort.push({ cohort_id, start_year: integer(row.startYear, 'cohort.startYear'), end_year: integer(row.endYear, 'cohort.endYear'), source_id, json_pointer: pointer('cohorts', ordinal) }); }
  const seen = new Set();
  for (const [ordinal, value] of array(document.assignments, 'cohort.assignments').entries()) { const row = object(value, 'cohort assignment'); const person_id = requirePerson(ids, row.personId, 'assignment.personId'); const cohort_id = integer(row.cohort, 'assignment.cohort'); if (!cohortIds.has(cohort_id)) fail('E_FAMILY_COHORT_ORPHAN', String(cohort_id)); if (seen.has(person_id)) fail('E_FAMILY_DUPLICATE_COHORT_ASSIGNMENT', person_id); seen.add(person_id); result.family_birth_cohort_assignment.push({ person_id, cohort_id, baseline_birth_date: text(row.baselineBirthDate, 'assignment.baselineBirthDate'), source_id, json_pointer: pointer('assignments', ordinal) }); }
  if (seen.size !== ids.size) fail('E_FAMILY_COHORT_SET', 'cohort assignments must equal identity.people');
}

function trees(bundle, ids, result) {
  const { source_id, document } = source(bundle, 'cast-family-trees'); const tree_id = 'cast-family-trees';
  result.family_tree.push({ tree_id, collapse_year: integer(document.collapseYear, 'tree.collapseYear'), reference_date: text(document.referenceDate, 'tree.referenceDate'), status: text(document.status, 'tree.status'), source_id, json_pointer: '' });
  for (const [ordinal, value] of array(document.sourceRefs, 'tree.sourceRefs').entries()) { const ref = optionalPathRef(value, 'tree.sourceRef'); result.family_tree_source.push({ tree_id, ordinal, source_id, json_pointer: pointer('sourceRefs', ordinal), source_path: ref.path }); }
  const nodes = new Set();
  for (const [ordinal, value] of array(document.nodes, 'tree.nodes').entries()) {
    const row = object(value, 'tree node'); const node_id = text(row.id, 'node.id'); if (nodes.has(node_id)) fail('E_FAMILY_DUPLICATE_NODE', node_id); nodes.add(node_id);
    const person_id = row.personId === null || row.personId === undefined ? null : requirePerson(ids, row.personId, 'node.personId');
    if (person_id !== null && person_id !== node_id) fail('E_FAMILY_NODE_PERSON_ID', node_id);
    const jp = pointer('nodes', ordinal), lineage = row.lineage === undefined ? {} : object(row.lineage, 'node.lineage'), exception = row.generationException === undefined ? {} : object(row.generationException, 'node.generationException');
    result.family_node.push({ node_id, person_id, node_kind: text(row.kind, 'node.kind'), name: text(row.name, 'node.name'), name_en: text(row.nameEn, 'node.nameEn', true), birth_date: text(row.birthDate, 'node.birthDate', true), death_date: text(row.deathDate, 'node.deathDate', true), status: text(row.status, 'node.status'), lineage_surname: text(lineage.surname, 'lineage.surname', true), lineage_bongwan: text(lineage.bongwan, 'lineage.bongwan', true), lineage_clan: text(lineage.clan, 'lineage.clan', true), generation_exception_reason: text(exception.reason, 'generationException.reason', true), source_id, json_pointer: jp });
    addRefs(result.family_node_source, source_id, jp, { node_id }, 'node', row.sourceRefs);
    addRefs(result.family_node_source, source_id, `${jp}/generationException`, { node_id }, 'generation-exception', exception.sourceRefs);
    for (const [timeOrdinal, timeValue] of array(row.timeline ?? [], 'node.timeline').entries()) { const time = object(timeValue, 'timeline row'), timePointer = pointer('nodes', ordinal, 'timeline', timeOrdinal); result.family_node_timeline.push({ node_id, ordinal: timeOrdinal, year: integer(time.year, 'timeline.year'), summary: text(time.summary, 'timeline.summary'), summary_en: text(time.summaryEn, 'timeline.summaryEn', true), source_id, json_pointer: timePointer }); addRefs(result.family_node_source, source_id, timePointer, { node_id }, `timeline:${timeOrdinal}`, time.sourceRefs); }
  }
  const edgeIds = new Set();
  for (const [ordinal, value] of array(document.edges, 'tree.edges').entries()) { const row = object(value, 'tree edge'), edge_id = text(row.id, 'edge.id'), from_node_id = text(row.from, 'edge.from'), to_node_id = text(row.to, 'edge.to'); if (edgeIds.has(edge_id)) fail('E_FAMILY_DUPLICATE_EDGE', edge_id); edgeIds.add(edge_id); if (!nodes.has(from_node_id) || !nodes.has(to_node_id)) fail('E_FAMILY_EDGE_ORPHAN', edge_id); const jp=pointer('edges', ordinal); result.family_edge.push({ edge_id, from_node_id, to_node_id, edge_type: text(row.type, 'edge.type'), parent_role: text(row.parentRole, 'edge.parentRole', true), status: text(row.status, 'edge.status'), source_id, json_pointer: jp }); for (const [refOrdinal, value] of array(row.sourceRefs, 'edge.sourceRefs').entries()) { const ref=optionalPathRef(value,'edge.sourceRef'); result.family_edge_source.push({edge_id,ordinal:refOrdinal,source_id,json_pointer:pointer('edges',ordinal,'sourceRefs',refOrdinal),source_path:ref.path,source_anchor:ref.anchor}); } }
  return { nodes, edgeIds };
}

function parentStatuses(bundle, ids, nodes, result) {
  const { source_id, document }=source(bundle,'cast-family-parent-status'); const seen=new Set();
  for(const [ordinal,value] of array(document.records,'parentStatus.records').entries()){const row=object(value,'parent status');const person_id=requirePerson(ids,row.personId,'parentStatus.personId');if(seen.has(person_id))fail('E_FAMILY_DUPLICATE_PARENT_STATUS',person_id);seen.add(person_id);const known_parent_id=text(row.knownParentId,'parentStatus.knownParentId',true);if(known_parent_id!==null&&!nodes.has(known_parent_id))fail('E_FAMILY_PARENT_NODE_ORPHAN',known_parent_id);const ref=optionalPathRef(row.sourceRef,'parentStatus.sourceRef');result.family_parent_status.push({person_id,status:text(row.status,'parentStatus.status'),known_parent_id,known_relationship:text(row.knownRelationship,'parentStatus.knownRelationship',true),source_ref_path:ref.path,source_ref_anchor:ref.anchor,source_id,json_pointer:pointer('records',ordinal)});}
}

function roleDecisions(bundle, nodes, edgeIds, result) {
  const { source_id, document } = source(bundle, 'cast-family-role-decisions');
  for (const [group, values] of Object.entries(document)) {
    if (!Array.isArray(values)) continue;
    for (const [ordinal, value] of values.entries()) {
      const row = object(value, `roleDecision.${group}`); const edge_id = text(row.edgeId, 'roleDecision.edgeId', true); const from_node_id = text(row.from ?? row.nodeId ?? row.fatherId ?? row.motherId, 'roleDecision.from', true); const to_node_id = text(row.to ?? row.childId, 'roleDecision.to', true);
      if (edge_id !== null && !edgeIds.has(edge_id)) fail('E_FAMILY_ROLE_EDGE_ORPHAN', edge_id);
      if (from_node_id !== null && !nodes.has(from_node_id)) fail('E_FAMILY_ROLE_NODE_ORPHAN', from_node_id);
      if (to_node_id !== null && !nodes.has(to_node_id)) fail('E_FAMILY_ROLE_NODE_ORPHAN', to_node_id);
      result.family_role_decision.push({ decision_group: group, ordinal, edge_id, from_node_id, to_node_id, parent_role: text(row.parentRole ?? row.proposedRole ?? row.after, 'roleDecision.parentRole', true), decision_kind: text(row.decisionKind, 'roleDecision.decisionKind', true), category: text(row.category, 'roleDecision.category', true), source_status: text(row.sourceStatus, 'roleDecision.sourceStatus', true), basis: text(row.basis, 'roleDecision.basis', true), selection_ref: text(row.selectionRef, 'roleDecision.selectionRef', true), source_id, json_pointer: pointer(group, ordinal) });
      const mapped = new Set(['edgeId', 'from', 'to', 'nodeId', 'fatherId', 'childId', 'parentRole', 'proposedRole', 'decisionKind', 'category', 'sourceStatus', 'basis', 'selectionRef', 'sourceRefs']);
      for (const [field, fieldValue] of Object.entries(row)) {
        if (mapped.has(field)) continue;
        for (const fact of scalarFields(fieldValue, pointer(field))) result.family_role_decision_fact.push({ decision_group: group, ordinal, ...fact, source_id, json_pointer: `${pointer(group, ordinal)}${fact.field_path}` });
      }
      for (const [ref_ordinal, value] of array(row.sourceRefs ?? [], 'roleDecision.sourceRefs').entries()) {
        const ref = optionalPathRef(value, 'roleDecision.sourceRef');
        result.family_role_decision_source.push({ decision_group: group, ordinal, ref_ordinal, source_path: ref.path, source_anchor: ref.anchor, source_id, json_pointer: pointer(group, ordinal, 'sourceRefs', ref_ordinal) });
      }
    }
  }
}

function household(bundle, ids, nodes, result) {
  const {source_id,document}=source(bundle,'cast-household-relations'); const peopleSeen=new Set(), links=new Set(), courts=new Set();
  const scope=object(document.scope,'household.scope'), quantity=object(document.quantityContract,'household.quantityContract');
  const covered=array(scope.coveredPersonIds,'household.scope.coveredPersonIds');
  if(covered.length!==ids.size || new Set(covered).size!==ids.size || covered.some((id)=>!ids.has(id))) fail('E_FAMILY_HOUSEHOLD_COVERAGE','scope.coveredPersonIds must equal identity.people');
  result.household_manifest.push({manifest_id:'cast-household-relations',status:text(document.status,'household.status'),scope_kind:text(scope.kind,'household.scope.kind'),isolated_at_audit:integer(scope.isolatedAtAudit,'household.scope.isolatedAtAudit'),all_isolated_authored:Number(boolean(scope.allIsolatedAuthored,'household.scope.allIsolatedAuthored')),quantity_mode:text(quantity.mode,'household.quantity.mode'),court_count:integer(quantity.courts,'household.quantity.courts'),direct_retainer_count:integer(quantity.directRetainers,'household.quantity.directRetainers'),quantity_source:text(quantity.source,'household.quantity.source'),source_id,json_pointer:''});
  for(const [ordinal,value] of array(document.people,'household.people').entries()) { const row=object(value,'household person'), person_id=requirePerson(ids,row.personId,'household.personId'); if(peopleSeen.has(person_id))fail('E_FAMILY_DUPLICATE_HOUSEHOLD_PERSON',person_id);peopleSeen.add(person_id); if(ids.get(person_id)!==text(row.name,'household.name'))fail('E_FAMILY_PERSON_NAME',person_id); const household=object(row.household,'household');const deficits=object(row.deficits,'household.deficits'),jp=pointer('people',ordinal);result.household_person.push({person_id,name:ids.get(person_id),person_faith_status:text(object(household.personFaith,'personFaith').status,'personFaith.status'),house_faith_status:text(object(household.houseFaith,'houseFaith').status,'houseFaith.status'),humanoid_admission:text(household.humanoidAdmission,'humanoidAdmission'),gender_preference:text(household.genderPreference,'genderPreference'),political_position:text(household.politicalPosition,'politicalPosition'),normalized_social_contact:Number(boolean(deficits.normalizedSocialContact,'normalizedSocialContact')),family_parent:Number(boolean(deficits.familyParent,'familyParent')),faith_unresolved:Number(boolean(deficits.faithUnresolved,'faithUnresolved')),private_retainer_status:text(deficits.privateRetainerStatus,'privateRetainerStatus',true),background_contact_authoring:text(deficits.backgroundContactAuthoring,'backgroundContactAuthoring'),source_id,json_pointer:jp}); addRefs(result.household_person_source,source_id,jp,{person_id},'person',row.sourceRefs);addRefs(result.household_person_source,source_id,`${jp}/household/personFaith`,{person_id},'person-faith',object(household.personFaith,'personFaith').sourceRefs);addRefs(result.household_person_source,source_id,`${jp}/household/houseFaith`,{person_id},'house-faith',object(household.houseFaith,'houseFaith').sourceRefs);
    if (array(household.newPrivateRetainers, 'household.newPrivateRetainers').length !== 0) fail('E_FAMILY_NEW_RETAINER_UNMAPPED', person_id);
    const insertLinks=(entries,kind)=>{for(const [linkOrdinal,entry] of array(entries,`household.${kind}`).entries()){const link=object(entry,'household link');const link_id=text(link.id,`household.${kind}.id`,kind==='known' ? true:false) ?? `known:${person_id}:${linkOrdinal}`;if(links.has(link_id))fail('E_FAMILY_DUPLICATE_HOUSEHOLD_LINK',link_id);links.add(link_id);const recipient_key=text(link.recipientId,'household.recipientId');const recipient_kind=text(link.recipientKind,'household.recipientKind');if(recipient_kind!=='person'&&recipient_kind!=='family-node')fail('E_FAMILY_HOUSEHOLD_RECIPIENT_KIND',recipient_kind);const recipient_person_id=recipient_kind==='person'?requirePerson(ids,recipient_key,'household.recipientId'):null;const recipient_node_id=recipient_kind==='family-node'?(nodes.has(recipient_key)?recipient_key:(fail('E_FAMILY_HOUSEHOLD_NODE_ORPHAN',recipient_key),null)):null;const ljp=pointer('people',ordinal,kind==='known'?'knownLinks':'links',linkOrdinal);result.household_link.push({link_id,owner_person_id:person_id,recipient_person_id,recipient_node_id,recipient_key,recipient_kind,link_type:text(link.type,'household.link.type'),direction:text(link.direction,'household.link.direction',true),role:text(link.role,'household.link.role'),status:text(link.status,'household.link.status'),basis:text(link.basis,'household.link.basis',true),source_id,json_pointer:ljp});for(const [refOrdinal,refValue] of array(link.sourceRefs,'household.link.sourceRefs').entries()){const ref=optionalPathRef(refValue,'household.link.sourceRef');result.household_link_source.push({link_id,ordinal:refOrdinal,source_id,json_pointer:pointer('people',ordinal,kind==='known'?'knownLinks':'links',linkOrdinal,'sourceRefs',refOrdinal),source_path:ref.path,source_anchor:ref.anchor});}}}; insertLinks(row.links,'links');insertLinks(row.knownLinks,'known');
    if (row.court !== null) {
      const court = object(row.court, 'household.court');
      const court_id = text(court.id, 'court.id');
      if (courts.has(court_id)) fail('E_FAMILY_DUPLICATE_COURT', court_id);
      courts.add(court_id);
      if (requirePerson(ids, court.ownerPersonId, 'court.owner') !== person_id) fail('E_FAMILY_COURT_OWNER', court_id);
      result.household_court.push({ court_id, owner_person_id: person_id, state_id: text(court.stateId, 'court.stateId'), source_id, json_pointer: pointer('people', ordinal, 'court') });
      for (const [retainerOrdinal, retainerValue] of array(court.retainers, 'court.retainers').entries()) {
        const retainer = object(retainerValue, 'court retainer');
        const person_id = requirePerson(ids, retainer.personId, 'retainer.personId');
        const source_row = integer(retainer.sourceRow, 'retainer.sourceRow');
        const retainer_json_pointer = pointer('people', ordinal, 'court', 'retainers', retainerOrdinal);
        result.household_court_retainer.push({ court_id, person_id, liege_person_id: requirePerson(ids, retainer.liegePersonId, 'retainer.liegePersonId'), source_row, role: text(retainer.role, 'retainer.role'), source_id, json_pointer: retainer_json_pointer });
        for (const [refOrdinal, value] of array(retainer.sourceRefs, 'court.retainer.sourceRefs').entries()) {
          const ref = optionalPathRef(value, 'court.retainer.sourceRef');
          result.household_court_retainer_source.push({ court_id, person_id, source_row, retainer_json_pointer, ordinal: refOrdinal, source_path: ref.path, source_anchor: ref.anchor, source_id, json_pointer: `${retainer_json_pointer}/sourceRefs/${refOrdinal}` });
        }
      }
    }
    if (row.directRetainer !== null) {
      const retainer = object(row.directRetainer, 'directRetainer');
      const court_id = text(retainer.courtId, 'directRetainer.courtId');
      const person_id = requirePerson(ids, retainer.personId, 'directRetainer.personId');
      const source_row = integer(retainer.sourceRow, 'directRetainer.sourceRow');
      const retainer_json_pointer = pointer('people', ordinal, 'directRetainer');
      result.household_court_retainer.push({ court_id, person_id, liege_person_id: requirePerson(ids, retainer.liegePersonId, 'directRetainer.liegePersonId'), source_row, role: text(retainer.role, 'directRetainer.role'), source_id, json_pointer: retainer_json_pointer });
      for (const [refOrdinal, value] of array(retainer.sourceRefs, 'directRetainer.sourceRefs').entries()) {
        const ref = optionalPathRef(value, 'directRetainer.sourceRef');
        result.household_court_retainer_source.push({ court_id, person_id, source_row, retainer_json_pointer, ordinal: refOrdinal, source_path: ref.path, source_anchor: ref.anchor, source_id, json_pointer: `${retainer_json_pointer}/sourceRefs/${refOrdinal}` });
      }
    }
  }
  if(peopleSeen.size!==ids.size)fail('E_FAMILY_HOUSEHOLD_SET','household people must equal identity.people');
  for(const [ordinal,value] of array(document.existingHumanoidContext,'household.existingHumanoidContext').entries()){const row=object(value,'humanoid context');const actor_id=text(row.actorId,'humanoid.actorId');result.household_humanoid_context.push({actor_id,custodian_person_id:requirePerson(ids,row.custodianPersonId,'humanoid.custodian'),steward_house_id:text(row.stewardHouseId,'humanoid.stewardHouseId'),scope:text(row.scope,'humanoid.scope'),assignment_action:text(row.assignmentAction,'humanoid.assignmentAction'),source_id,json_pointer:pointer('existingHumanoidContext',ordinal)});for(const [refOrdinal,value] of array(row.sourceRefs,'humanoid.sourceRefs').entries()){const ref=optionalPathRef(value,'humanoid.sourceRef');result.household_humanoid_context_source.push({actor_id,ordinal:refOrdinal,source_path:ref.path,source_anchor:ref.anchor,source_id,json_pointer:pointer('existingHumanoidContext',ordinal,'sourceRefs',refOrdinal)});}}
}

function diaspora(bundle, ids, nodes, edgeIds, result) {
  const { source_id, document } = source(bundle, 'diaspora-family-lineages');
  const lineages = new Set(), members = new Set(), deferredParents = [];
  for (const [ordinal, value] of array(document.lineages, 'diaspora.lineages').entries()) {
    const lineage = object(value, 'diaspora lineage'), lineage_key = text(lineage.key, 'diaspora.lineage.key');
    if (lineages.has(lineage_key)) fail('E_FAMILY_DUPLICATE_DIASPORA_LINEAGE', lineage_key);
    lineages.add(lineage_key);
    result.diaspora_lineage.push({ lineage_key, current_person_id: requirePerson(ids, lineage.currentPersonId, 'diaspora.currentPersonId'), source_id, json_pointer: pointer('lineages', ordinal) });
    for (const [memberOrdinal, memberValue] of array(lineage.members, 'diaspora.members').entries()) {
      const member = object(memberValue, 'diaspora member'), member_key = text(member.key, 'diaspora.member.key');
      if (members.has(member_key)) fail('E_FAMILY_DUPLICATE_DIASPORA_MEMBER', member_key);
      members.add(member_key);
      const person_id = member.personId === undefined ? null : requirePerson(ids, member.personId, 'diaspora.member.personId');
      const name = object(member.name, 'diaspora.member.name'), timeline = object(member.timelineBio, 'diaspora.member.timelineBio');
      const narrative = object(member.narrative, 'diaspora.member.narrative'), jp = pointer('lineages', ordinal, 'members', memberOrdinal);
      if (!nodes.has(member_key)) {
        nodes.add(member_key);
        result.family_node.push({ node_id: member_key, person_id, node_kind: 'diaspora-member', name: text(name.ko, 'diaspora.member.name.ko'), name_en: text(name.en, 'diaspora.member.name.en'), birth_date: text(member.birthDate, 'diaspora.member.birthDate'), death_date: null, status: 'source-projection', lineage_surname: null, lineage_bongwan: null, lineage_clan: null, generation_exception_reason: null, source_id, json_pointer: jp });
      } else if (person_id !== null && member_key !== person_id) fail('E_FAMILY_DIASPORA_NODE_PERSON_ID', member_key);
      result.diaspora_member.push({ member_key, lineage_key, person_id, generation: integer(member.generation, 'diaspora.member.generation'), name_ko: text(name.ko, 'diaspora.member.name.ko'), name_en: text(name.en, 'diaspora.member.name.en'), birth_date: text(member.birthDate, 'diaspora.member.birthDate'), timeline_ko: text(timeline.ko, 'diaspora.member.timeline.ko'), timeline_en: text(timeline.en, 'diaspora.member.timeline.en'), narrative_ko: text(narrative.ko, 'diaspora.member.narrative.ko'), narrative_en: text(narrative.en, 'diaspora.member.narrative.en'), source_id, json_pointer: jp });
      for (const [eventOrdinal, eventValue] of array(member.events, 'diaspora.member.events').entries()) {
        const event = object(eventValue, 'diaspora event');
        result.diaspora_member_event.push({ member_key, ordinal: eventOrdinal, event_year: integer(event.year, 'diaspora.event.year'), event_kind: text(event.kind, 'diaspora.event.kind'), event_date: text(event.date, 'diaspora.event.date', true), source_id, json_pointer: pointer('lineages', ordinal, 'members', memberOrdinal, 'events', eventOrdinal) });
      }
      const parentRoles = object(member.parentRoles ?? {}, 'diaspora.parentRoles');
      for (const [parentOrdinal, parentKey] of array(member.parentKeys, 'diaspora.member.parentKeys').entries()) deferredParents.push({ member_key, parent_key: text(parentKey, 'diaspora.parentKey'), parent_role: text(parentRoles[parentKey], 'diaspora.parentRole', true), source_id, json_pointer: pointer('lineages', ordinal, 'members', memberOrdinal, 'parentKeys', parentOrdinal) });
    }
  }
  for (const row of deferredParents) {
    const parent_member_key = members.has(row.parent_key) ? row.parent_key : null;
    const parent_node_id = parent_member_key === null && nodes.has(row.parent_key) ? row.parent_key : null;
    if (parent_member_key === null && parent_node_id === null) fail('E_FAMILY_DIASPORA_PARENT_ORPHAN', row.parent_key);
    result.diaspora_member_parent.push({ ...row, parent_member_key, parent_node_id });
    const edge_id = `${row.parent_key}:${row.member_key}:biological`;
    if (edgeIds.has(edge_id)) fail('E_FAMILY_DUPLICATE_EDGE', edge_id);
    edgeIds.add(edge_id);
    result.family_edge.push({ edge_id, from_node_id: row.parent_key, to_node_id: row.member_key, edge_type: 'biological', parent_role: row.parent_role, status: 'source-projection', source_id: row.source_id, json_pointer: row.json_pointer });
  }
}

function policy(bundle, result) { const {source_id,document}=source(bundle,'household-humanoid-policy'); for(const [key,value] of Object.entries(document)){if(key==='schema'||key==='approvalRef'||key==='sourceRefs'||key==='politicalPositions'||key==='politicalPositionContext')continue;const values=Array.isArray(value)?value:[value];for(const [ordinal,item] of values.entries()){const jp=Array.isArray(value)?pointer(key,ordinal):pointer(key);if(item!==null&&typeof item==='object')fail('E_FAMILY_POLICY_OBJECT',key);if(typeof item==='number'&&!Number.isSafeInteger(item))fail('E_FAMILY_POLICY_INTEGER',key);const value_kind=item===null?'null':typeof item;result.household_policy_value.push({policy_key:key,ordinal,value_kind,text_value:typeof item==='string'?item:null,integer_value:Number.isSafeInteger(item)?item:null,boolean_value:typeof item==='boolean'?Number(item):null,source_id,json_pointer:jp});}}
  for (const [entity_key, value] of Object.entries(object(document.politicalPositions,'policy.politicalPositions'))) result.household_policy_political_position.push({entity_key,position:text(value,'policy.politicalPosition'),source_id,json_pointer:pointer('politicalPositions',entity_key)});
  for (const [ordinal,value] of array(document.sourceRefs,'policy.sourceRefs').entries()){const ref=optionalPathRef(value,'policy.sourceRef');result.household_policy_source.push({ordinal,source_path:ref.path,source_anchor:ref.anchor,source_id,json_pointer:pointer('sourceRefs',ordinal)});}
}

export function mapFamilyDomains({ bundle, identity }) {
  const result=Object.fromEntries(Object.keys(FAMILY_TABLE_COLUMNS).map((key)=>[key,[]])); const ids=personIndex(identity); metadata(bundle,result);birthdays(bundle,ids,result);cohorts(bundle,ids,result);const {nodes,edgeIds}=trees(bundle,ids,result);diaspora(bundle,ids,nodes,edgeIds,result);parentStatuses(bundle,ids,nodes,result);roleDecisions(bundle,nodes,edgeIds,result);household(bundle,ids,nodes,result);policy(bundle,result);return freezeRows(result);
}
