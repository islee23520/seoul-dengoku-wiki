import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openReadOnly } from './db.mjs';

const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
const rows = (db, sql, ...bindings) => db.prepare(sql).all(...bindings).map((row) => ({ ...row }));
const one = (db, sql, ...bindings) => rows(db, sql, ...bindings)[0] ?? null;
const text = (value, name) => { if (typeof value !== 'string' || value.length === 0) fail('E_ARGUMENTS', `${name}에는 비어 있지 않은 문자열이 필요합니다.`); };
const sourceColumns = 's.logical_path,s.sha256,s.byte_length';

function read(options, allowed, action) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('E_ARGUMENTS', '조회 옵션 객체가 필요합니다.');
  if (Object.keys(options).some((key) => !['dbPath', ...allowed].includes(key))) fail('E_ARGUMENTS', '지원하지 않는 조회 옵션입니다.');
  text(options.dbPath, 'dbPath');
  const db = openReadOnly(options.dbPath);
  try { return action(db); }
  catch (error) {
    if (typeof error.code === 'string' && error.code.startsWith('E_')) throw error;
    throw Object.assign(new Error('DB 조회를 완료하지 못했습니다.', { cause: error }), { code: 'E_QUERY_FAILED' });
  } finally { db.close(); }
}

function personRow(db, selector) {
  if ((selector.id === undefined) === (selector.route === undefined)) fail('E_ARGUMENTS', 'id와 route 중 하나만 지정해야 합니다.');
  const value = selector.id ?? selector.route;
  text(value, selector.id === undefined ? 'route' : 'id');
  const person = one(db, selector.id === undefined ? 'SELECT * FROM person WHERE public_route=?' : 'SELECT * FROM person WHERE person_id=?', value);
  if (!person) fail('E_PERSON_NOT_FOUND', `인물을 찾을 수 없습니다: ${value}`);
  return person;
}

function relationRows(db, id, direction) {
  if (!['incoming', 'outgoing', 'both'].includes(direction)) fail('E_DIRECTION_INVALID', 'direction은 incoming, outgoing, both 중 하나여야 합니다.');
  const result = { person_id: id, direction };
  for (const side of ['incoming', 'outgoing']) {
    if (direction !== 'both' && direction !== side) continue;
    const column = side === 'incoming' ? 'to_person_id' : 'from_person_id';
    result[side] = rows(db, `SELECT r.*,${sourceColumns} FROM relation r JOIN source_file s USING(source_id) WHERE r.${column}=? ORDER BY r.row_ordinal,r.relation_id`, id);
  }
  return result;
}

function issueRows(db, dataset, personId = null) {
  const checkName = dataset === 'gurps' ? 'gurps-cast' : dataset;
  const result = {
    dataset,
    official: {
      runs: rows(db, 'SELECT * FROM source_check_run WHERE (? IS NULL OR check_name=?) ORDER BY check_name', checkName, checkName),
      issues: rows(db, 'SELECT * FROM source_check_issue WHERE (? IS NULL OR check_name=?) AND (? IS NULL OR person_id=?) ORDER BY check_name,ordinal', checkName, checkName, personId, personId),
    },
    importer: rows(db, 'SELECT q.*,s.logical_path FROM quality_issue q LEFT JOIN source_file s USING(source_id) WHERE (? IS NULL OR dataset=?) AND (? IS NULL OR person_id=?) ORDER BY dataset,code,person_id,issue_id', dataset, dataset, personId, personId),
  };
  if (dataset === null || dataset === 'index') result.source_indexes = {
    issues: rows(db, 'SELECT i.*,d.logical_path,d.source_status,d.temporal_scope FROM index_issue i JOIN index_document d USING(source_id) ORDER BY i.source_id,i.issue_ordinal'),
    unmatched_cast: rows(db, "SELECT i.*,d.logical_path,d.source_status,d.tense_ko,d.tense_en,d.temporal_scope FROM index_person i JOIN index_document d USING(source_id) WHERE i.match_status='unmatched' ORDER BY i.source_id,i.table_anchor,i.row_ordinal"),
    unmatched_corridor: rows(db, "SELECT i.*,d.logical_path,d.source_status,d.tense_ko,d.tense_en,d.temporal_scope FROM index_corridor_person i JOIN index_document d USING(source_id) WHERE i.match_status='unmatched' ORDER BY i.source_id,i.table_anchor,i.row_ordinal"),
  };
  return result;
}

function lineageRows(db, person) {
  const profile = one(db, 'SELECT * FROM person_lineage WHERE person_id=?', person.person_id);
  const family = `WITH RECURSIVE family(name) AS (SELECT name FROM lineage_node WHERE person_id=? UNION SELECT p.parent_name FROM lineage_parent p JOIN family f ON p.child_name=f.name UNION SELECT p.child_name FROM lineage_parent p JOIN family f ON p.parent_name=f.name)`;
  const nodes = rows(db, `${family} SELECT n.* FROM lineage_node n JOIN family f USING(name) ORDER BY n.name`, person.person_id);
  const parents = rows(db, `${family} SELECT p.* FROM lineage_parent p JOIN family f ON p.child_name=f.name ORDER BY p.child_name,p.parent_name`, person.person_id);
  const founder_sesu = rows(db, `${family} SELECT s.* FROM lineage_founder_sesu s JOIN family f ON s.person_name=f.name ORDER BY s.person_name`, person.person_id);
  const clan_assignments = rows(db, 'SELECT * FROM lineage_clan_assignment WHERE person_id=? ORDER BY clan_id', person.person_id);
  const source_clan_refs = rows(db, 'SELECT source_ref,source_ordinal FROM person_lineage_source_clan WHERE person_id=? ORDER BY source_ordinal', person.person_id);
  const pending = [profile?.clan_id, profile?.base_clan_id, ...clan_assignments.map((row) => row.clan_id)].filter(Boolean);
  const found = new Map();
  for (const id of pending) {
    if (found.has(id)) continue;
    const clan = one(db, 'SELECT * FROM clan WHERE clan_id=?', id);
    if (!clan) continue;
    found.set(id, { ...clan, sources: rows(db, 'SELECT * FROM clan_source WHERE clan_id=? ORDER BY ordinal', id), hangnyeol_rows: rows(db, 'SELECT * FROM clan_hangnyeol_row WHERE clan_id=? ORDER BY ordinal', id) });
    if (clan.base_clan_id) pending.push(clan.base_clan_id);
  }
  return { profile, nodes, parents, founder_sesu, clan_assignments, source_clan_refs, clans: [...found.values()].sort((a, b) => a.clan_id.localeCompare(b.clan_id)) };
}

function profileRows(db, id) {
  return rows(db, `SELECT p.*,${sourceColumns} FROM profile p JOIN source_file s USING(source_id) WHERE p.person_id=? ORDER BY s.logical_path,p.source_ordinal,p.profile_id`, id).map((profile) => ({
    ...profile,
    nodes: rows(db, `SELECT n.*,r.json_type,${sourceColumns} FROM profile_node n JOIN source_record r USING(source_id,json_pointer) JOIN source_file s USING(source_id) WHERE n.profile_id=? ORDER BY n.node_ordinal`, profile.profile_id),
    fields: rows(db, `SELECT f.*,${sourceColumns} FROM profile_field f JOIN source_file s USING(source_id) WHERE f.profile_id=? ORDER BY f.field_ordinal`, profile.profile_id),
  }));
}

function sourceIndexRows(db, id) {
  const document = 'd.logical_path,d.source_status,d.source_kind,d.tense_ko,d.tense_en,d.temporal_scope';
  return {
    cast: rows(db, `SELECT i.*,${document} FROM index_person i JOIN index_document d USING(source_id) WHERE i.person_id=? ORDER BY i.source_id,i.table_anchor,i.row_ordinal`, id),
    corridor: rows(db, `SELECT i.*,${document} FROM index_corridor_person i JOIN index_document d USING(source_id) WHERE i.person_id=? ORDER BY i.source_id,i.table_anchor,i.row_ordinal`, id),
  };
}

function historicalGurpsRows(db, id) {
  const result = { profile: one(db, 'SELECT * FROM gurps_profile WHERE person_id=?', id) };
  for (const [key, table] of [['attributes', 'gurps_attribute'], ['secondary', 'gurps_secondary'], ['skills', 'gurps_skill'], ['languages', 'gurps_language'], ['advantages', 'gurps_advantage'], ['disadvantages', 'gurps_disadvantage']]) result[key] = rows(db, `SELECT * FROM ${table} WHERE person_id=? ORDER BY ordinal`, id);
  result.traits = rows(db, 'SELECT * FROM gurps_trait WHERE person_id=? ORDER BY ordinal', id).map((trait) => ({ ...trait, application_boundaries: rows(db, 'SELECT * FROM gurps_trait_application_boundary WHERE person_id=? AND trait_ordinal=? ORDER BY ordinal', id, trait.ordinal) }));
  result.territory = one(db, 'SELECT * FROM gurps_territory WHERE person_id=?', id);
  const unit = one(db, 'SELECT * FROM gurps_unit WHERE person_id=?', id);
  result.unit = unit && { ...unit, composition: rows(db, 'SELECT * FROM gurps_unit_composition WHERE person_id=? ORDER BY ordinal', id) };
  const wandering = one(db, 'SELECT * FROM gurps_wandering_force WHERE person_id=?', id);
  result.wandering_force = wandering && { ...wandering, facilities: rows(db, 'SELECT * FROM gurps_wandering_facility WHERE person_id=? ORDER BY ordinal', id) };
  result.evidence = rows(db, 'SELECT e.*,s.logical_path,s.sha256 FROM evidence e LEFT JOIN source_file s USING(source_id) WHERE e.person_id=? ORDER BY e.subject_kind,e.subject_ordinal,e.subject_key,e.evidence_ordinal,e.evidence_id', id);
  return result;
}

function engineRows(db, id) {
  const profile = one(db, 'SELECT person_id,engine_source_id,json_pointer,source_ordinal FROM current_profile WHERE person_id=?', id);
  if (!profile) return null;
  const source = one(db, 'SELECT engine_source_id,source_sha256,source_byte_length,projection_schema,projection_sha256,profile_count FROM current_engine_source WHERE engine_source_id=?', profile.engine_source_id);
  const health = one(db, 'SELECT * FROM health WHERE person_id=?', id);
  return {
    profile, source,
    abilities: rows(db, 'SELECT * FROM ability WHERE person_id=? ORDER BY ability_ordinal', id),
    skills: rows(db, 'SELECT * FROM skill WHERE person_id=? ORDER BY skill_ordinal', id),
    traits: rows(db, 'SELECT * FROM trait WHERE person_id=? ORDER BY trait_ordinal', id).map((trait) => ({ ...trait, effects: rows(db, 'SELECT * FROM effect WHERE person_id=? AND trait_ordinal=? ORDER BY effect_ordinal', id, trait.trait_ordinal) })),
    health: health && { ...health, body: rows(db, 'SELECT * FROM body WHERE person_id=? ORDER BY body_ordinal', id), diseases: rows(db, 'SELECT * FROM disease WHERE person_id=? ORDER BY disease_ordinal', id) },
    narrative: one(db, 'SELECT * FROM narrative WHERE person_id=?', id),
  };
}

function familyRows(db, id) {
  const closure = `WITH RECURSIVE family(node_id) AS (SELECT node_id FROM family_node WHERE person_id=? UNION SELECT e.from_node_id FROM family_edge e JOIN family f ON e.to_node_id=f.node_id UNION SELECT e.to_node_id FROM family_edge e JOIN family f ON e.from_node_id=f.node_id)`;
  const nodes = rows(db, `${closure} SELECT n.* FROM family_node n JOIN family f USING(node_id) ORDER BY n.node_id`, id).map((node) => ({ ...node, sources: rows(db, 'SELECT * FROM family_node_source WHERE node_id=? ORDER BY source_kind,ordinal', node.node_id), timeline: rows(db, 'SELECT * FROM family_node_timeline WHERE node_id=? ORDER BY ordinal', node.node_id) }));
  const edges = rows(db, `${closure} SELECT DISTINCT e.* FROM family_edge e JOIN family f ON e.from_node_id=f.node_id OR e.to_node_id=f.node_id ORDER BY e.edge_id`, id).map((edge) => ({ ...edge, sources: rows(db, 'SELECT * FROM family_edge_source WHERE edge_id=? ORDER BY ordinal', edge.edge_id) }));
  const edgeIds = edges.map((edge) => edge.edge_id);
  const roles = rows(db, `${closure} SELECT DISTINCT r.* FROM family_role_decision r LEFT JOIN family f1 ON f1.node_id=r.from_node_id LEFT JOIN family f2 ON f2.node_id=r.to_node_id WHERE r.edge_id IN (${edgeIds.length ? edgeIds.map(() => '?').join(',') : "SELECT ''"}) OR f1.node_id IS NOT NULL OR f2.node_id IS NOT NULL ORDER BY r.decision_group,r.ordinal`, id, ...edgeIds).map((role) => ({
    ...role,
    facts: rows(db, 'SELECT * FROM family_role_decision_fact WHERE decision_group=? AND ordinal=? ORDER BY field_path', role.decision_group, role.ordinal),
    sources: rows(db, 'SELECT * FROM family_role_decision_source WHERE decision_group=? AND ordinal=? ORDER BY ref_ordinal', role.decision_group, role.ordinal),
  }));
  const diaspora = rows(db, 'SELECT * FROM diaspora_lineage WHERE current_person_id=? ORDER BY lineage_key', id).map((lineage) => ({ ...lineage, members: rows(db, 'SELECT * FROM diaspora_member WHERE lineage_key=? ORDER BY generation,member_key', lineage.lineage_key).map((member) => ({ ...member, parents: rows(db, 'SELECT * FROM diaspora_member_parent WHERE member_key=? ORDER BY parent_key', member.member_key), events: rows(db, 'SELECT * FROM diaspora_member_event WHERE member_key=? ORDER BY ordinal', member.member_key) })) }));
  return {
    tree: one(db, 'SELECT * FROM family_tree ORDER BY tree_id'),
    birthday: one(db, 'SELECT * FROM family_birthday WHERE person_id=?', id), birthday_sources: rows(db, 'SELECT * FROM family_birthday_source WHERE person_id=? ORDER BY ordinal', id),
    birth_cohort: one(db, 'SELECT a.*,c.start_year,c.end_year FROM family_birth_cohort_assignment a JOIN family_birth_cohort c USING(cohort_id) WHERE a.person_id=?', id),
    nodes, edges, parent_status: one(db, 'SELECT * FROM family_parent_status WHERE person_id=?', id), role_decisions: roles, diaspora,
  };
}

function householdRows(db, id) {
  const courts = rows(db, 'SELECT * FROM household_court WHERE owner_person_id=? ORDER BY court_id', id);
  const person = one(db, 'SELECT * FROM household_person WHERE person_id=?', id);
  const retainer = (row) => ({ ...row, sources: rows(db, 'SELECT * FROM household_court_retainer_source WHERE court_id=? AND person_id=? AND source_row=? AND retainer_json_pointer=? ORDER BY ordinal', row.court_id, row.person_id, row.source_row, row.json_pointer) });
  return {
    manifest: one(db, 'SELECT * FROM household_manifest ORDER BY manifest_id'),
    person: person && { ...person, sources: rows(db, 'SELECT * FROM household_person_source WHERE person_id=? ORDER BY source_kind,ordinal', id) },
    links: rows(db, 'SELECT * FROM household_link WHERE owner_person_id=? ORDER BY link_id', id).map((link) => ({ ...link, sources: rows(db, 'SELECT * FROM household_link_source WHERE link_id=? ORDER BY ordinal', link.link_id) })),
    courts: courts.map((court) => ({ ...court, retainers: rows(db, 'SELECT * FROM household_court_retainer WHERE court_id=? ORDER BY source_row,person_id,json_pointer', court.court_id).map(retainer) })),
    retainer_memberships: rows(db, 'SELECT * FROM household_court_retainer WHERE person_id=? OR liege_person_id=? ORDER BY court_id,source_row,person_id,json_pointer', id, id).map(retainer),
    humanoid_context: rows(db, 'SELECT * FROM household_humanoid_context WHERE custodian_person_id=? ORDER BY actor_id', id).map((actor) => ({ ...actor, sources: rows(db, 'SELECT * FROM household_humanoid_context_source WHERE actor_id=? ORDER BY ordinal', actor.actor_id) })),
  };
}

function holdingRows(db, id, currentValidity) {
  return rows(db, 'SELECT * FROM context_holding WHERE holder_person_id=? AND current_validity=? ORDER BY holding_id', id, currentValidity).map((holding) => ({
    ...holding,
    admin_refs: rows(db, 'SELECT * FROM context_holding_admin_ref WHERE holding_id=? ORDER BY ordinal', holding.holding_id),
    references: rows(db, 'SELECT * FROM context_holding_reference WHERE holding_id=? ORDER BY reference_kind,ordinal', holding.holding_id),
    issues: rows(db, 'SELECT * FROM context_issue WHERE holding_id=? ORDER BY issue_id', holding.holding_id),
  }));
}

function contextRows(db, id) {
  return {
    courts: rows(db, 'SELECT * FROM context_court WHERE owner_person_id=? ORDER BY court_id', id),
    direct_retainer: one(db, 'SELECT * FROM context_direct_retainer WHERE person_id=?', id),
    owner_liege: one(db, 'SELECT * FROM context_owner_liege WHERE person_id=?', id),
    court_membership: one(db, 'SELECT * FROM context_court_membership WHERE person_id=?', id),
    opening_disposition: one(db, 'SELECT * FROM context_opening_disposition WHERE person_id=?', id),
    offices: rows(db, 'SELECT * FROM context_office_appointment WHERE person_id=? ORDER BY polity_id,position_ko', id).map((office) => ({
      ...office,
      evidence: rows(db, 'SELECT * FROM context_office_evidence WHERE person_id=? ORDER BY ordinal', id),
    })),
    titles: rows(db, 'SELECT * FROM context_feudal_title WHERE holder_person_id=? ORDER BY title_id', id).map((title) => ({
      ...title,
      jurisdictions: rows(db, 'SELECT * FROM context_feudal_jurisdiction WHERE title_id=? ORDER BY ordinal', title.title_id),
    })),
    grants: rows(db, 'SELECT * FROM context_feudal_grant WHERE holder_person_id=? ORDER BY grant_id', id).map((grant) => ({
      ...grant,
      admin_units: rows(db, 'SELECT * FROM context_feudal_grant_admin WHERE grant_id=? ORDER BY ordinal', grant.grant_id),
      components: rows(db, 'SELECT * FROM context_feudal_grant_component WHERE grant_id=? ORDER BY ordinal', grant.grant_id),
    })),
    bindings: rows(db, 'SELECT b.* FROM context_feudal_binding b JOIN context_holding h USING(holding_id) WHERE h.holder_person_id=? ORDER BY b.holding_id', id),
    political_identities: rows(db, 'SELECT * FROM context_political_identity WHERE holder_person_id=? ORDER BY identity_id', id).map((identity) => ({
      ...identity,
      personal_lieges: rows(db, 'SELECT * FROM context_political_identity_liege WHERE identity_id=? ORDER BY ordinal', identity.identity_id),
    })),
    polities: rows(db, "SELECT * FROM context_polity WHERE sovereign_person_id=? AND current_validity='current_nonterritorial' ORDER BY polity_id", id),
    event_links: rows(db, 'SELECT e.*,o.name AS organization_name,o.polity_id AS organization_polity_id,o.source_anchor AS organization_source_anchor FROM context_event_link e LEFT JOIN context_organization o USING(organization_id) WHERE e.person_id=? ORDER BY e.event_id,e.organization_id', id),
    prose_contacts: rows(db, 'SELECT * FROM context_prose_contact WHERE person_id=? ORDER BY recipient_person_id', id),
    issues: rows(db, 'SELECT * FROM context_issue WHERE person_id=? ORDER BY issue_id', id),
  };
}

function supersededContextRows(db, id) {
  return {
    polities: rows(db, "SELECT * FROM context_polity WHERE sovereign_person_id=? AND current_validity='superseded_outside_seoul' ORDER BY polity_id", id),
    retinue_groups: retinueRows(db, id, 'superseded_outside_seoul'),
  };
}

function retinueRows(db, id, validity) {
  return rows(db, 'SELECT * FROM context_retinue_group WHERE liege_person_id=? AND current_validity=? ORDER BY retinue_group_id', id, validity).map((group) => ({
      ...group,
      duties: rows(db, 'SELECT * FROM context_retinue_duty WHERE retinue_group_id=? ORDER BY ordinal', group.retinue_group_id),
      technical_limits: rows(db, 'SELECT * FROM context_retinue_technical_limit WHERE retinue_group_id=? ORDER BY ordinal', group.retinue_group_id),
      holdings: rows(db, 'SELECT * FROM context_retinue_holding WHERE retinue_group_id=? ORDER BY ordinal', group.retinue_group_id),
    }));
}

function historicalFeudalRows(db, id) {
  const scope = 's.logical_path,s.classification AS source_classification';
  return {
    titles: rows(db, `SELECT t.*,${scope} FROM historical_feudal_title t JOIN historical_source_scope s USING(source_id) WHERE t.holder_person_id=? ORDER BY t.title_id`, id).map((title) => ({
      ...title,
      jurisdictions: rows(db, 'SELECT * FROM historical_feudal_jurisdiction WHERE title_id=? ORDER BY ordinal', title.title_id),
      bindings: rows(db, 'SELECT * FROM historical_feudal_binding WHERE title_id=? ORDER BY holding_id', title.title_id),
    })),
    grants: rows(db, `SELECT g.*,${scope} FROM historical_feudal_grant g JOIN historical_source_scope s USING(source_id) WHERE g.holder_person_id=? ORDER BY g.grant_id`, id).map((grant) => ({
      ...grant,
      admin_units: rows(db, 'SELECT * FROM historical_feudal_grant_admin WHERE grant_id=? ORDER BY ordinal', grant.grant_id),
      components: rows(db, 'SELECT * FROM historical_feudal_grant_component WHERE grant_id=? ORDER BY ordinal', grant.grant_id),
    })),
    outside_person_control: rows(db, `SELECT c.*,${scope} FROM historical_outside_person_control c JOIN historical_source_scope s USING(source_id) WHERE c.holder_person_id=? ORDER BY c.admin_unit_id`, id),
  };
}

export function queryPerson(options) {
  return read(options, ['id', 'route'], (db) => {
    const person = personRow(db, options); const id = person.person_id;
    const state = one(db, 'SELECT * FROM state WHERE state_id=?', person.state_id);
    if (state) state.labels = rows(db, 'SELECT * FROM state_label WHERE state_id=? ORDER BY name_ko', person.state_id);
    return {
      person, state, aliases: rows(db, 'SELECT * FROM person_alias WHERE person_id=? ORDER BY alias_ordinal', id),
      values: rows(db, 'SELECT v.*,a.axis_ordinal FROM person_value v JOIN value_axis a USING(axis_name) WHERE person_id=? ORDER BY a.axis_ordinal', id),
      desires: rows(db, 'SELECT d.*,a.axis_ordinal FROM person_desire d JOIN desire_axis a USING(axis_name) WHERE person_id=? ORDER BY a.axis_ordinal', id),
      gender: one(db, 'SELECT * FROM person_gender WHERE person_id=?', id), lineage: lineageRows(db, person), profiles: profileRows(db, id), source_indexes: sourceIndexRows(db, id), relations: relationRows(db, id, 'both'),
      current: { engine: engineRows(db, id), birthday: one(db, 'SELECT * FROM family_birthday WHERE person_id=?', id), family: familyRows(db, id), household: householdRows(db, id), holdings: holdingRows(db, id, 'current_seoul_evidenced'), nonowning_rights: holdingRows(db, id, 'current_seoul_nonowning').map((holding) => ({
        ...holding,
        geographic_scope: (() => {
          const scope = one(db, 'SELECT * FROM context_holding_geographic_scope WHERE holding_id=?', holding.holding_id);
          return scope && { ...scope, counties: rows(db, 'SELECT * FROM context_holding_scope_county WHERE holding_id=? ORDER BY ordinal', holding.holding_id) };
        })(),
        powers: rows(db, 'SELECT * FROM context_holding_power WHERE holding_id=? ORDER BY ordinal', holding.holding_id),
      })), context: contextRows(db, id) },
      historical: { gurps: historicalGurpsRows(db, id), superseded_holdings: holdingRows(db, id, 'superseded_outside_seoul'), superseded_context: supersededContextRows(db, id), context: { offices: rows(db, 'SELECT * FROM context_office_history WHERE person_id=? ORDER BY polity_id', id) }, feudal: historicalFeudalRows(db, id) }, unresolved: { holdings: holdingRows(db, id, 'unresolved'), context: { retinue_groups: retinueRows(db, id, 'unresolved') } },
    };
  });
}

export function queryRelations(options) { return read(options, ['id', 'direction'], (db) => { if (!['incoming', 'outgoing', 'both'].includes(options.direction ?? 'both')) fail('E_DIRECTION_INVALID', '지원하지 않는 관계 방향입니다.'); return relationRows(db, personRow(db, { id: options.id }).person_id, options.direction ?? 'both'); }); }
export function queryIssues(options) { return read(options, ['dataset'], (db) => { if (options.dataset !== undefined) text(options.dataset, 'dataset'); return issueRows(db, options.dataset ?? null); }); }

export function querySource(options) {
  return read(options, ['path', 'pointer'], (db) => {
    text(options.path, 'path');
    const source = one(db, 'SELECT source_id,logical_path,media_type,sha256,byte_length FROM source_file WHERE logical_path=?', options.path);
    if (!source) fail('E_SOURCE_NOT_FOUND', `원천 파일을 찾을 수 없습니다: ${options.path}`);
    const result = { source, record_count: one(db, 'SELECT count(*) AS count FROM source_record WHERE source_id=?', source.source_id).count };
    if (options.pointer !== undefined) {
      if (typeof options.pointer !== 'string' || (options.pointer !== '' && (!options.pointer.startsWith('/') || /~(?:[^01]|$)/u.test(options.pointer)))) fail('E_ARGUMENTS', 'RFC 6901 JSON pointer가 필요합니다.');
      result.record = one(db, 'SELECT * FROM source_record WHERE source_id=? AND json_pointer=?', source.source_id, options.pointer);
      if (!result.record) fail('E_SOURCE_POINTER_NOT_FOUND', `JSON pointer가 없습니다: ${options.pointer}`);
      result.children = rows(db, 'SELECT * FROM source_record WHERE source_id=? AND parent_pointer=? ORDER BY ordinal,json_pointer', source.source_id, options.pointer);
    }
    return result;
  });
}

const help = { usage: 'node scripts/cast-sqlite/query.mjs --db <파일> <명령> [옵션]', commands: { person: '--id K1022 | --route /people/person-1022', relations: '--id K001 [--direction incoming|outgoing|both]', issues: '[--dataset gurps]', source: '--path <원천 상대경로> [--pointer <RFC6901>]' }, notes: ['결과와 도움말은 JSON입니다. source는 metadata와 typed records만 반환하며 원문 바이트를 반환하지 않습니다.', '인물 조회는 current과 historical을 분리하며 historical.gurps는 과거 GURPS 기록입니다.'] };

function main(argv) {
  if (argv.length === 1 && argv[0] === '--help') return help;
  const commands = { person: queryPerson, relations: queryRelations, issues: queryIssues, source: querySource };
  const flags = { '--db': 'dbPath', '--id': 'id', '--route': 'route', '--direction': 'direction', '--dataset': 'dataset', '--path': 'path', '--pointer': 'pointer' };
  const options = {}; let command;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (Object.hasOwn(commands, token) && command === undefined) { command = token; continue; }
    if (!Object.hasOwn(flags, token)) fail('E_ARGUMENTS', `지원하지 않는 인자입니다: ${token}`);
    const key = flags[token]; if (Object.hasOwn(options, key)) fail('E_ARGUMENTS', `중복 옵션입니다: ${token}`);
    const value = argv[++index]; if (value === undefined || value.startsWith('--')) fail('E_ARGUMENTS', `옵션 값이 없습니다: ${token}`); options[key] = value;
  }
  if (command === undefined) fail('E_ARGUMENTS', '조회 명령이 필요합니다. --help를 참고하세요.');
  return commands[command](options);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { process.stdout.write(`${JSON.stringify(main(process.argv.slice(2)), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${JSON.stringify({ error: { code: error.code ?? 'E_QUERY_FAILED', message: error.message } })}\n`); process.exitCode = 1; }
}
