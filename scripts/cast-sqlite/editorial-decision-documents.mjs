import { createHash } from 'node:crypto';

export const EDITORIAL_DECISION_PATHS = Object.freeze([
    'docs/editorial/2026-09-29/decision-inputs.json',
    'docs/editorial/2026-09-28/evidence/wiki304-review-correction-2026-09-29.json',
]);
const PATHS = EDITORIAL_DECISION_PATHS;
const DECISION = PATHS[0];
const REVIEW = PATHS[1];
const INPUT_KEYS = Object.freeze(['schemaSql', 'sources', 'actor', 'reason']);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_EDITORIAL_DECISION_DOCUMENT: ' + detail), { code: 'E_EDITORIAL_DECISION_DOCUMENT' }); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const same = (value, keys) => plain(value) && JSON.stringify(Object.keys(value)) === JSON.stringify(keys);
const text = value => typeof value === 'string';
const integer = value => Number.isSafeInteger(value);
const flag = value => typeof value === 'boolean';
const absent = value => value === null;
const bit = value => value ? 1 : 0;
const present = value => value === null ? 0 : 1;
const bool = value => value === 1;

const DECISION_KEYS = ['schema', 'status', 'observedDate', 'wikiBase', 'gameBase', 'graphPath', 'graphSha256', 'proposalSource', 'runtimeTarget', 'stage2Locked', 'location', 'route', 'alternatives', 'squad', 'approvalItems'];
const LOCATION_KEYS = ['recommendedStationId', 'recommendedRegionId', 'facilityKind', 'approvedStationId', 'accessGeometry', 'entranceLayer', 'totalLayerTransitions', 'occupancyOrAccessAuthority', 'carryingCapacity', 'approver', 'approvedAt', 'approvalUrl'];
const ROUTE_KEYS = ['startStationId', 'outbound', 'onward', 'return', 'proposedLayerForEveryStationLeg', 'proposedStationLegLayerTransitions', 'layerStatus', 'strategicEdges', 'localAccessApproved', 'layerPathApproved', 'travelDuration', 'transitionCost'];
const EDGE_KEYS = ['id', 'a', 'b', 'lineIds', 'passage2126', 'controller'];
const ALTERNATIVE_KEYS = ['stationId', 'stationPath', 'outboundEdges'];
const SQUAD_KEYS = ['heroCount', 'proposedSoldierCount', 'soldierLimit', 'proposedTravelStance', 'approvedTravelStanceId', 'proposedActingLeaderSlot', 'approvedActingLeaderId', 'members'];
const MEMBER_KEYS = ['slot', 'personId', 'name', 'kind', 'roleBasis', 'role', 'sourceAffiliation', 'knownMartialArt', 'proposedEquipment', 'approvedInputs', 'approval'];
const MEMBER_OPTIONAL = ['sourceAffiliation', 'knownMartialArt'];
const APPROVED_INPUT_KEYS = ['weaponId', 'armorId', 'combatSkills', 'bodyCondition', 'mood', 'leadership', 'commandAssignment'];
const APPROVAL_KEYS = ['approver', 'approvedAt', 'url'];
const ITEM_KEYS = ['id', 'scope', 'approved', 'approver', 'approvedAt', 'url'];
const REVIEW_KEYS = ['checkedAt', 'scope', 'wikiHeadBeforeCorrection', 'reviewSnapshot', 'ownerComments', 'ownerCorrectionPR', 'editorialSource', 'existingOutputChecks', 'manifestDocuments', 'limitations', 'markdownLocalLinks'];
const SNAPSHOT_KEYS = ['workspacePath', 'sha256', 'fetchedAt', 'review'];
const REVIEW_RECORD_KEYS = ['id', 'html_url', 'submitted_at', 'commit_id', 'state', 'body'];
const COMMENT_KEYS = ['id', 'html_url', 'created_at', 'updated_at', 'body'];
const CORRECTION_KEYS = ['url', 'head', 'inspection'];
const EDITORIAL_KEYS = ['path', 'sha256', 'status', 'domain', 'blocks', 'unchangedFromHead', 'locationProposalPreserved'];
const CHECK_HASH_KEYS = ['path', 'sha256', 'proposal_slug_absent', 'location_proposal_anchor_absent'];
const CHECK_EXISTS_KEYS = ['path', 'exists'];
const MARKDOWN_KEYS = ['result', 'paths'];
const COUNTS = Object.freeze({
  editorial_decision_documents_receipt: 2,
  editorial_decision_documents_decision: 1,
  editorial_decision_documents_station: 7,
  editorial_decision_documents_edge: 2,
  editorial_decision_documents_line: 2,
  editorial_decision_documents_alternative: 3,
  editorial_decision_documents_alternative_station: 15,
  editorial_decision_documents_member: 3,
  editorial_decision_documents_equipment: 5,
  editorial_decision_documents_approval_item: 6,
  editorial_decision_documents_review: 1,
  editorial_decision_documents_owner_comment: 2,
  editorial_decision_documents_output_check: 7,
  editorial_decision_documents_limitation: 3,
  editorial_decision_documents_markdown_path: 2,
});

function strings(value) {
  if (!Array.isArray(value) || value.length < 1 || value.some(entry => !text(entry))) fail('string list');
}
function nullTexts(value, keys) {
  if (!keys.every(key => absent(value[key]))) fail('null text');
}
function decisionShape(document) {
  if (!same(document, DECISION_KEYS)) fail('decision fields');
  if (![document.schema, document.status, document.observedDate, document.wikiBase, document.gameBase, document.graphPath, document.graphSha256, document.proposalSource].every(text)) fail('decision strings');
  if (!absent(document.runtimeTarget) || !flag(document.stage2Locked)) fail('decision scalars');
  if (!same(document.location, LOCATION_KEYS)) fail('location fields');
  if (![document.location.recommendedStationId, document.location.recommendedRegionId, document.location.facilityKind].every(text)) fail('location strings');
  nullTexts(document.location, LOCATION_KEYS.slice(3));
  if (!same(document.route, ROUTE_KEYS)) fail('route fields');
  if (!text(document.route.startStationId) || !text(document.route.proposedLayerForEveryStationLeg) || !text(document.route.layerStatus)) fail('route strings');
  if (!integer(document.route.proposedStationLegLayerTransitions) || !flag(document.route.localAccessApproved) || !flag(document.route.layerPathApproved)) fail('route scalars');
  if (!absent(document.route.travelDuration) || !absent(document.route.transitionCost)) fail('route nulls');
  for (const leg of ['outbound', 'onward', 'return']) strings(document.route[leg]);
  if (!Array.isArray(document.route.strategicEdges) || document.route.strategicEdges.length < 1) fail('edges');
  for (const edge of document.route.strategicEdges) {
    if (!same(edge, EDGE_KEYS)) fail('edge fields');
    if (![edge.id, edge.a, edge.b, edge.passage2126, edge.controller].every(text)) fail('edge strings');
    strings(edge.lineIds);
  }
  if (!Array.isArray(document.alternatives) || document.alternatives.length < 1) fail('alternatives');
  for (const alternative of document.alternatives) {
    if (!same(alternative, ALTERNATIVE_KEYS)) fail('alternative fields');
    if (!text(alternative.stationId) || !integer(alternative.outboundEdges)) fail('alternative scalars');
    strings(alternative.stationPath);
  }
  if (!same(document.squad, SQUAD_KEYS)) fail('squad fields');
  if (![document.squad.heroCount, document.squad.proposedSoldierCount, document.squad.soldierLimit].every(integer)) fail('squad counts');
  if (!text(document.squad.proposedTravelStance) || !text(document.squad.proposedActingLeaderSlot)) fail('squad strings');
  if (!absent(document.squad.approvedTravelStanceId) || !absent(document.squad.approvedActingLeaderId)) fail('squad nulls');
  if (!Array.isArray(document.squad.members) || document.squad.members.length < 1) fail('members');
  for (const member of document.squad.members) {
    const keys = Object.keys(member);
    const expected = MEMBER_KEYS.filter(key => keys.includes(key) || !MEMBER_OPTIONAL.includes(key));
    if (!same(member, expected)) fail('member fields');
    if (![member.slot, member.kind, member.roleBasis, member.role].every(text)) fail('member strings');
    if (member.personId !== null && !text(member.personId)) fail('person id');
    if (member.name !== null && !text(member.name)) fail('member name');
    for (const key of MEMBER_OPTIONAL) if (Object.hasOwn(member, key) && !text(member[key])) fail('member optional');
    strings(member.proposedEquipment);
    if (!same(member.approvedInputs, APPROVED_INPUT_KEYS)) fail('approved inputs');
    nullTexts(member.approvedInputs, APPROVED_INPUT_KEYS);
    if (!same(member.approval, APPROVAL_KEYS)) fail('member approval');
    nullTexts(member.approval, APPROVAL_KEYS);
  }
  if (!Array.isArray(document.approvalItems) || document.approvalItems.length < 1) fail('approval items');
  for (const item of document.approvalItems) {
    if (!same(item, ITEM_KEYS)) fail('approval item fields');
    if (!text(item.id) || !text(item.scope) || !flag(item.approved)) fail('approval item scalars');
    nullTexts(item, APPROVAL_KEYS);
  }
}
function reviewShape(document) {
  if (!same(document, REVIEW_KEYS)) fail('review fields');
  if (![document.checkedAt, document.scope, document.wikiHeadBeforeCorrection].every(text) || !integer(document.manifestDocuments)) fail('review scalars');
  if (!same(document.reviewSnapshot, SNAPSHOT_KEYS)) fail('snapshot fields');
  if (![document.reviewSnapshot.workspacePath, document.reviewSnapshot.sha256, document.reviewSnapshot.fetchedAt].every(text)) fail('snapshot strings');
  if (!same(document.reviewSnapshot.review, REVIEW_RECORD_KEYS)) fail('review record fields');
  const record = document.reviewSnapshot.review;
  if (!integer(record.id) || ![record.html_url, record.submitted_at, record.commit_id, record.state, record.body].every(text)) fail('review record');
  if (!Array.isArray(document.ownerComments) || document.ownerComments.length < 1) fail('owner comments');
  for (const comment of document.ownerComments) {
    if (!same(comment, COMMENT_KEYS)) fail('comment fields');
    if (!integer(comment.id) || ![comment.html_url, comment.created_at, comment.updated_at, comment.body].every(text)) fail('comment scalars');
  }
  if (!same(document.ownerCorrectionPR, CORRECTION_KEYS)) fail('correction fields');
  if (![document.ownerCorrectionPR.url, document.ownerCorrectionPR.head, document.ownerCorrectionPR.inspection].every(text)) fail('correction strings');
  if (!same(document.editorialSource, EDITORIAL_KEYS)) fail('editorial fields');
  const editorial = document.editorialSource;
  if (![editorial.path, editorial.sha256, editorial.status, editorial.domain].every(text) || !integer(editorial.blocks)) fail('editorial scalars');
  if (!flag(editorial.unchangedFromHead) || !flag(editorial.locationProposalPreserved)) fail('editorial flags');
  if (!Array.isArray(document.existingOutputChecks) || document.existingOutputChecks.length < 1) fail('output checks');
  for (const check of document.existingOutputChecks) {
    if (same(check, CHECK_HASH_KEYS)) {
      if (!text(check.path) || !text(check.sha256) || !flag(check.proposal_slug_absent) || !flag(check.location_proposal_anchor_absent)) fail('hashed check');
    } else if (same(check, CHECK_EXISTS_KEYS)) {
      if (!text(check.path) || !flag(check.exists)) fail('exists check');
    } else fail('output check fields');
  }
  strings(document.limitations);
  if (!same(document.markdownLocalLinks, MARKDOWN_KEYS) || !text(document.markdownLocalLinks.result)) fail('markdown fields');
  strings(document.markdownLocalLinks.paths);
}

function insert(db, table, row) {
  const columns = Object.keys(row);
  db.prepare('INSERT INTO ' + table + ' (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')').run(...Object.values(row));
}
function ordered(rows, detail) {
  if (rows.some((row, index) => row.ordinal !== index)) fail(detail + ' ordinal gap');
  return rows;
}
function one(rows, detail) {
  if (rows.length !== 1) fail(detail);
  return rows[0];
}
function nullableText(row, column) {
  return row[column];
}

function writeDecision(db, document) {
  const location = document.location, route = document.route, squad = document.squad;
  insert(db, 'editorial_decision_documents_decision', {
    logical_path: DECISION,
    schema: document.schema, status: document.status, observed_date: document.observedDate,
    wiki_base: document.wikiBase, game_base: document.gameBase, graph_path: document.graphPath,
    graph_sha256: document.graphSha256, proposal_source: document.proposalSource,
    runtime_target: document.runtimeTarget, stage2_locked: bit(document.stage2Locked),
    location_recommended_station_id: location.recommendedStationId,
    location_recommended_region_id: location.recommendedRegionId,
    location_facility_kind: location.facilityKind,
    location_approved_station_id: location.approvedStationId,
    location_access_geometry: location.accessGeometry,
    location_entrance_layer: location.entranceLayer,
    location_total_layer_transitions: location.totalLayerTransitions,
    location_occupancy_or_access_authority: location.occupancyOrAccessAuthority,
    location_carrying_capacity: location.carryingCapacity,
    location_approver: location.approver, location_approved_at: location.approvedAt, location_approval_url: location.approvalUrl,
    route_start_station_id: route.startStationId,
    route_proposed_layer_for_every_station_leg: route.proposedLayerForEveryStationLeg,
    route_proposed_station_leg_layer_transitions: route.proposedStationLegLayerTransitions,
    route_layer_status: route.layerStatus,
    route_local_access_approved: bit(route.localAccessApproved),
    route_layer_path_approved: bit(route.layerPathApproved),
    route_travel_duration: route.travelDuration, route_transition_cost: route.transitionCost,
    squad_hero_count: squad.heroCount, squad_proposed_soldier_count: squad.proposedSoldierCount,
    squad_soldier_limit: squad.soldierLimit, squad_proposed_travel_stance: squad.proposedTravelStance,
    squad_approved_travel_stance_id: squad.approvedTravelStanceId,
    squad_proposed_acting_leader_slot: squad.proposedActingLeaderSlot,
    squad_approved_acting_leader_id: squad.approvedActingLeaderId,
  });
  for (const leg of ['outbound', 'onward', 'return']) route[leg].forEach((stationId, ordinal) => insert(db, 'editorial_decision_documents_station', {
    logical_path: DECISION, leg, ordinal, station_id: stationId,
  }));
  route.strategicEdges.forEach((edge, ordinal) => {
    insert(db, 'editorial_decision_documents_edge', {
      logical_path: DECISION, ordinal, id: edge.id, a: edge.a, b: edge.b, passage2126: edge.passage2126, controller: edge.controller,
    });
    edge.lineIds.forEach((lineId, lineOrdinal) => insert(db, 'editorial_decision_documents_line', {
      logical_path: DECISION, edge_ordinal: ordinal, ordinal: lineOrdinal, line_id: lineId,
    }));
  });
  document.alternatives.forEach((alternative, ordinal) => {
    insert(db, 'editorial_decision_documents_alternative', {
      logical_path: DECISION, ordinal, station_id: alternative.stationId, outbound_edges: alternative.outboundEdges,
    });
    alternative.stationPath.forEach((stationId, stationOrdinal) => insert(db, 'editorial_decision_documents_alternative_station', {
      logical_path: DECISION, alternative_ordinal: ordinal, ordinal: stationOrdinal, station_id: stationId,
    }));
  });
  squad.members.forEach((member, ordinal) => {
    insert(db, 'editorial_decision_documents_member', {
      logical_path: DECISION, ordinal, slot: member.slot,
      person_id: member.personId, person_id_present: present(member.personId),
      name: member.name, name_present: present(member.name),
      kind: member.kind, role_basis: member.roleBasis, role: member.role,
      source_affiliation: member.sourceAffiliation ?? null, source_affiliation_present: Object.hasOwn(member, 'sourceAffiliation') ? 1 : 0,
      known_martial_art: member.knownMartialArt ?? null, known_martial_art_present: Object.hasOwn(member, 'knownMartialArt') ? 1 : 0,
      weapon_id: member.approvedInputs.weaponId, armor_id: member.approvedInputs.armorId,
      combat_skills: member.approvedInputs.combatSkills, body_condition: member.approvedInputs.bodyCondition,
      mood: member.approvedInputs.mood, leadership: member.approvedInputs.leadership,
      command_assignment: member.approvedInputs.commandAssignment,
      approver: member.approval.approver, approved_at: member.approval.approvedAt, url: member.approval.url,
    });
    member.proposedEquipment.forEach((item, itemOrdinal) => insert(db, 'editorial_decision_documents_equipment', {
      logical_path: DECISION, member_ordinal: ordinal, ordinal: itemOrdinal, item,
    }));
  });
  document.approvalItems.forEach((item, ordinal) => insert(db, 'editorial_decision_documents_approval_item', {
    logical_path: DECISION, ordinal, id: item.id, scope: item.scope, approved: bit(item.approved),
    approver: item.approver, approved_at: item.approvedAt, url: item.url,
  }));
}
function writeReview(db, document) {
  const snapshot = document.reviewSnapshot, record = snapshot.review, correction = document.ownerCorrectionPR, editorial = document.editorialSource;
  insert(db, 'editorial_decision_documents_review', {
    logical_path: REVIEW, checked_at: document.checkedAt, scope: document.scope,
    wiki_head_before_correction: document.wikiHeadBeforeCorrection,
    review_workspace_path: snapshot.workspacePath, review_sha256: snapshot.sha256, review_fetched_at: snapshot.fetchedAt,
    review_id: record.id, review_html_url: record.html_url, review_submitted_at: record.submitted_at,
    review_commit_id: record.commit_id, review_state: record.state, review_body: record.body,
    correction_url: correction.url, correction_head: correction.head, correction_inspection: correction.inspection,
    editorial_path: editorial.path, editorial_sha256: editorial.sha256, editorial_status: editorial.status,
    editorial_domain: editorial.domain, editorial_blocks: editorial.blocks,
    editorial_unchanged_from_head: bit(editorial.unchangedFromHead),
    editorial_location_proposal_preserved: bit(editorial.locationProposalPreserved),
    manifest_documents: document.manifestDocuments, markdown_result: document.markdownLocalLinks.result,
  });
  document.ownerComments.forEach((comment, ordinal) => insert(db, 'editorial_decision_documents_owner_comment', {
    logical_path: REVIEW, ordinal, id: comment.id, html_url: comment.html_url,
    created_at: comment.created_at, updated_at: comment.updated_at, body: comment.body,
  }));
  document.existingOutputChecks.forEach((check, ordinal) => insert(db, 'editorial_decision_documents_output_check', {
    logical_path: REVIEW, ordinal, path: check.path,
    sha256: check.sha256 ?? null, sha256_present: Object.hasOwn(check, 'sha256') ? 1 : 0,
    proposal_slug_absent: Object.hasOwn(check, 'proposal_slug_absent') ? bit(check.proposal_slug_absent) : null,
    proposal_slug_absent_present: Object.hasOwn(check, 'proposal_slug_absent') ? 1 : 0,
    location_proposal_anchor_absent: Object.hasOwn(check, 'location_proposal_anchor_absent') ? bit(check.location_proposal_anchor_absent) : null,
    location_proposal_anchor_absent_present: Object.hasOwn(check, 'location_proposal_anchor_absent') ? 1 : 0,
    exists_value: Object.hasOwn(check, 'exists') ? bit(check.exists) : null,
    exists_present: Object.hasOwn(check, 'exists') ? 1 : 0,
  }));
  document.limitations.forEach((textValue, ordinal) => insert(db, 'editorial_decision_documents_limitation', {
    logical_path: REVIEW, ordinal, text: textValue,
  }));
  document.markdownLocalLinks.paths.forEach((path, ordinal) => insert(db, 'editorial_decision_documents_markdown_path', {
    logical_path: REVIEW, ordinal, path,
  }));
}

function selectAll(db, table) {
  return db.prepare('SELECT * FROM ' + table).all();
}
function byPath(rows, logicalPath) {
  return rows.filter(row => row.logical_path === logicalPath);
}
function childRows(rows, logicalPath, parentColumn, parentOrdinal) {
  return ordered(rows.filter(row => row.logical_path === logicalPath && row[parentColumn] === parentOrdinal)
    .sort((left, right) => left.ordinal - right.ordinal), parentColumn);
}

function readDecision(db, receipts) {
  const row = one(byPath(selectAll(db, 'editorial_decision_documents_decision'), DECISION), 'decision row');
  const stations = byPath(selectAll(db, 'editorial_decision_documents_station'), DECISION);
  const edges = ordered(byPath(selectAll(db, 'editorial_decision_documents_edge'), DECISION).sort((left, right) => left.ordinal - right.ordinal), 'edge');
  const lines = byPath(selectAll(db, 'editorial_decision_documents_line'), DECISION);
  const alternatives = ordered(byPath(selectAll(db, 'editorial_decision_documents_alternative'), DECISION).sort((left, right) => left.ordinal - right.ordinal), 'alternative');
  const alternativeStations = byPath(selectAll(db, 'editorial_decision_documents_alternative_station'), DECISION);
  const members = ordered(byPath(selectAll(db, 'editorial_decision_documents_member'), DECISION).sort((left, right) => left.ordinal - right.ordinal), 'member');
  const equipment = byPath(selectAll(db, 'editorial_decision_documents_equipment'), DECISION);
  const items = ordered(byPath(selectAll(db, 'editorial_decision_documents_approval_item'), DECISION).sort((left, right) => left.ordinal - right.ordinal), 'approval item');
  const leg = name => ordered(stations.filter(station => station.leg === name).sort((left, right) => left.ordinal - right.ordinal), name).map(station => station.station_id);
  const member = entry => {
    const value = {
      slot: entry.slot, personId: nullableText(entry, 'person_id'), name: nullableText(entry, 'name'),
      kind: entry.kind, roleBasis: entry.role_basis, role: entry.role,
    };
    if (entry.person_id_present !== present(value.personId) || entry.name_present !== present(value.name)) fail('member presence');
    if (entry.source_affiliation_present === 1) value.sourceAffiliation = entry.source_affiliation;
    else if (entry.source_affiliation !== null) fail('absent affiliation stored');
    if (entry.known_martial_art_present === 1) value.knownMartialArt = entry.known_martial_art;
    else if (entry.known_martial_art !== null) fail('absent martial art stored');
    value.proposedEquipment = childRows(equipment, DECISION, 'member_ordinal', entry.ordinal).map(item => item.item);
    value.approvedInputs = {
      weaponId: entry.weapon_id, armorId: entry.armor_id, combatSkills: entry.combat_skills,
      bodyCondition: entry.body_condition, mood: entry.mood, leadership: entry.leadership, commandAssignment: entry.command_assignment,
    };
    value.approval = { approver: entry.approver, approvedAt: entry.approved_at, url: entry.url };
    return value;
  };
  const document = {
    schema: row.schema, status: row.status, observedDate: row.observed_date, wikiBase: row.wiki_base,
    gameBase: row.game_base, graphPath: row.graph_path, graphSha256: row.graph_sha256, proposalSource: row.proposal_source,
    runtimeTarget: row.runtime_target, stage2Locked: bool(row.stage2_locked),
    location: {
      recommendedStationId: row.location_recommended_station_id, recommendedRegionId: row.location_recommended_region_id,
      facilityKind: row.location_facility_kind, approvedStationId: row.location_approved_station_id,
      accessGeometry: row.location_access_geometry, entranceLayer: row.location_entrance_layer,
      totalLayerTransitions: row.location_total_layer_transitions,
      occupancyOrAccessAuthority: row.location_occupancy_or_access_authority,
      carryingCapacity: row.location_carrying_capacity, approver: row.location_approver,
      approvedAt: row.location_approved_at, approvalUrl: row.location_approval_url,
    },
    route: {
      startStationId: row.route_start_station_id, outbound: leg('outbound'), onward: leg('onward'), return: leg('return'),
      proposedLayerForEveryStationLeg: row.route_proposed_layer_for_every_station_leg,
      proposedStationLegLayerTransitions: row.route_proposed_station_leg_layer_transitions,
      layerStatus: row.route_layer_status,
      strategicEdges: edges.map(edge => ({
        id: edge.id, a: edge.a, b: edge.b,
        lineIds: childRows(lines, DECISION, 'edge_ordinal', edge.ordinal).map(line => line.line_id),
        passage2126: edge.passage2126, controller: edge.controller,
      })),
      localAccessApproved: bool(row.route_local_access_approved), layerPathApproved: bool(row.route_layer_path_approved),
      travelDuration: row.route_travel_duration, transitionCost: row.route_transition_cost,
    },
    alternatives: alternatives.map(alternative => ({
      stationId: alternative.station_id,
      stationPath: childRows(alternativeStations, DECISION, 'alternative_ordinal', alternative.ordinal).map(station => station.station_id),
      outboundEdges: alternative.outbound_edges,
    })),
    squad: {
      heroCount: row.squad_hero_count, proposedSoldierCount: row.squad_proposed_soldier_count,
      soldierLimit: row.squad_soldier_limit, proposedTravelStance: row.squad_proposed_travel_stance,
      approvedTravelStanceId: row.squad_approved_travel_stance_id,
      proposedActingLeaderSlot: row.squad_proposed_acting_leader_slot,
      approvedActingLeaderId: row.squad_approved_acting_leader_id,
      members: members.map(member),
    },
    approvalItems: items.map(item => ({
      id: item.id, scope: item.scope, approved: bool(item.approved), approver: item.approver, approvedAt: item.approved_at, url: item.url,
    })),
  };
  decisionShape(document);
  return document;
}
function readReview(db, receipts) {
  const row = one(byPath(selectAll(db, 'editorial_decision_documents_review'), REVIEW), 'review row');
  const comments = ordered(byPath(selectAll(db, 'editorial_decision_documents_owner_comment'), REVIEW).sort((left, right) => left.ordinal - right.ordinal), 'comment');
  const checks = ordered(byPath(selectAll(db, 'editorial_decision_documents_output_check'), REVIEW).sort((left, right) => left.ordinal - right.ordinal), 'output check');
  const limitations = ordered(byPath(selectAll(db, 'editorial_decision_documents_limitation'), REVIEW).sort((left, right) => left.ordinal - right.ordinal), 'limitation');
  const paths = ordered(byPath(selectAll(db, 'editorial_decision_documents_markdown_path'), REVIEW).sort((left, right) => left.ordinal - right.ordinal), 'markdown path');
  const document = {
    checkedAt: row.checked_at, scope: row.scope, wikiHeadBeforeCorrection: row.wiki_head_before_correction,
    reviewSnapshot: {
      workspacePath: row.review_workspace_path, sha256: row.review_sha256, fetchedAt: row.review_fetched_at,
      review: {
        id: row.review_id, html_url: row.review_html_url, submitted_at: row.review_submitted_at,
        commit_id: row.review_commit_id, state: row.review_state, body: row.review_body,
      },
    },
    ownerComments: comments.map(comment => ({
      id: comment.id, html_url: comment.html_url, created_at: comment.created_at, updated_at: comment.updated_at, body: comment.body,
    })),
    ownerCorrectionPR: { url: row.correction_url, head: row.correction_head, inspection: row.correction_inspection },
    editorialSource: {
      path: row.editorial_path, sha256: row.editorial_sha256, status: row.editorial_status, domain: row.editorial_domain,
      blocks: row.editorial_blocks, unchangedFromHead: bool(row.editorial_unchanged_from_head),
      locationProposalPreserved: bool(row.editorial_location_proposal_preserved),
    },
    existingOutputChecks: checks.map(check => {
      const value = { path: check.path };
      if (check.sha256_present === 1) value.sha256 = check.sha256;
      else if (check.sha256 !== null) fail('absent sha stored');
      if (check.proposal_slug_absent_present === 1) value.proposal_slug_absent = bool(check.proposal_slug_absent);
      else if (check.proposal_slug_absent !== null) fail('absent slug flag stored');
      if (check.location_proposal_anchor_absent_present === 1) value.location_proposal_anchor_absent = bool(check.location_proposal_anchor_absent);
      else if (check.location_proposal_anchor_absent !== null) fail('absent anchor flag stored');
      if (check.exists_present === 1) value.exists = bool(check.exists_value);
      else if (check.exists_value !== null) fail('absent exists stored');
      return value;
    }),
    manifestDocuments: row.manifest_documents,
    limitations: limitations.map(entry => entry.text),
    markdownLocalLinks: { result: row.markdown_result, paths: paths.map(entry => entry.path) },
  };
  reviewShape(document);
  return document;
}
function receiptsOf(db, logicalPath) {
  const rows = selectAll(db, 'editorial_decision_documents_receipt');
  if (rows.length !== PATHS.length || rows.some((row, index) => rows.filter(other => other.logical_path === row.logical_path).length !== 1)) fail('receipt count');
  const map = new Map(rows.map(row => [row.logical_path, row]));
  for (const path of PATHS) {
    const row = map.get(path);
    if (!row) fail('receipt');
    if (!text(row.actor) || !row.actor.trim() || !text(row.reason) || !row.reason.trim()) fail('receipt audit');
  }
  if (logicalPath !== undefined && !map.has(logicalPath)) fail('requested path');
  return map;
}
function exactCoverage(db) {
}

/** Import both supplied documents. Approval text stays historical data and grants nothing. */
export function initializeEditorialDecisionDocuments(db, { schemaSql, sources, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql, actor, reason].every(value => typeof value === 'string' && value.trim())) fail('input');
  if (Object.keys(arguments[1] ?? {}).some(key => !INPUT_KEYS.includes(key))) fail('input keys');
  if (!plain(sources) || JSON.stringify(Object.keys(sources)) !== JSON.stringify(PATHS)) fail('source paths');
  if (db.prepare("SELECT count(*) AS n FROM sqlite_schema WHERE name LIKE 'editorial_decision_documents_%'").get().n) fail('already initialized');
  const documents = new Map(), sourceBytesOf = new Map();
  for (const logicalPath of PATHS) {
    const source = sources[logicalPath];
    if (!plain(source) || JSON.stringify(Object.keys(source)) !== JSON.stringify(['bytes'])) fail('source shape');
    if (!(source.bytes instanceof Uint8Array)) fail('source bytes');
    let document;
    try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(source.bytes)); }
    catch { fail('source json'); }
    if (logicalPath === DECISION) decisionShape(document);
    else reviewShape(document);
    documents.set(logicalPath, document);
    sourceBytesOf.set(logicalPath, source.bytes);
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    for (const logicalPath of PATHS) insert(db, 'editorial_decision_documents_receipt', {
      logical_path: logicalPath, source_sha256: hash(sourceBytesOf.get(logicalPath)),
      document_sha256: hash(JSON.stringify(documents.get(logicalPath))), byte_length: sourceBytesOf.get(logicalPath).length, actor, reason,
    });
    writeDecision(db, documents.get(DECISION));
    writeReview(db, documents.get(REVIEW));
    const stored = readBoth(db);
    for (const logicalPath of PATHS) {
      if (JSON.stringify(stored.get(logicalPath)) !== JSON.stringify(documents.get(logicalPath))) fail('precommit mismatch');
    }
    db.exec('COMMIT');
    return {
      documents: 2,
      stations: COUNTS.editorial_decision_documents_station,
      edges: COUNTS.editorial_decision_documents_edge,
      alternatives: COUNTS.editorial_decision_documents_alternative,
      members: COUNTS.editorial_decision_documents_member,
      approvalItems: COUNTS.editorial_decision_documents_approval_item,
      ownerComments: COUNTS.editorial_decision_documents_owner_comment,
      outputChecks: COUNTS.editorial_decision_documents_output_check,
      totalRows: Object.values(COUNTS).reduce((sum, count) => sum + count, 0),
    };
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

function readBoth(db) {
  const receipts = receiptsOf(db);
  exactCoverage(db);
  return new Map([
    [DECISION, readDecision(db, receipts)],
    [REVIEW, readReview(db, receipts)],
  ]);
}

/** SELECT-only reconstruction of one document. No file, archive, or JSON.parse access. */
export function readEditorialDecisionDocuments(db, { logicalPath } = {}) {
  if (!PATHS.includes(logicalPath)) fail('logical path');
  try {
    const documents = readBoth(db);
    const document = documents.get(logicalPath);
    return document;
  } catch (error) {
    if (error.code === 'E_EDITORIAL_DECISION_DOCUMENT') throw error;
    fail(error.message);
  }
}
