export const GEOGRAPHY_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  text_affiliation: 'source_id json_pointer',
  text_affiliation_hegemon: 'source_id json_pointer ordinal kind state_id name center_region ai_position color',
  text_affiliation_member: 'source_id json_pointer hegemon_ordinal ordinal state_id',
  text_affiliation_state: 'source_id json_pointer ordinal state_id current_name base_kind station_id landmark_id base_name exclusive_districts',
  text_affiliation_neutral: 'source_id json_pointer ordinal state_id',
  text_governance: 'source_id json_pointer text',
  text_territorial: 'source_id json_pointer schema scope geographic_empire_id scale_implies_personal_ownership scale_implies_title_rank scale_implies_facility_access slot_existence_implies_grant',
  text_territorial_source: 'source_id json_pointer path sha256 schema',
  text_territorial_rank: 'source_id json_pointer ordinal rank',
  text_territorial_level: 'source_id json_pointer level source_pointer rank count partition_sha256 representation id_field parent_field',
  text_territorial_map: 'source_id json_pointer minimum_polygon_rank barony_polygon',
  text_territorial_selectable_rank: 'source_id json_pointer ordinal rank',
  text_territorial_slot_edition: 'source_id json_pointer edition_kind source_pointer edition base_date administrative_candidate_date checked_at count geometry_verified current_boundary_certification',
  text_territorial_parent: 'source_id json_pointer source_field meaning political_liege_inference',
  text_territorial_parent_exception: 'source_id json_pointer ordinal title_id parent_title_id map_kingdom_title_id kind',
  text_territorial_political_axis: 'source_id json_pointer current_centers geographic_kingdom_equivalence preserve_stable_political_identities preserve_nonterritorial_kingship',
  text_station_catalog: 'source_id json_pointer',
  text_station: 'source_id json_pointer ordinal station_id source has_service_lines',
  text_station_alias: 'source_id json_pointer station_ordinal ordinal alias',
  text_station_line_name: 'source_id json_pointer station_ordinal line_kind ordinal name',
  text_station_line: 'source_id json_pointer station_ordinal line_kind name_ordinal ordinal line',
}).map(([table, columns]) => [table, Object.freeze(columns.split(' '))])));

const own = (value, key) => Object.hasOwn(value, key);
const escape = (value) => value.replaceAll('~', '~0').replaceAll('/', '~1');
const fail = (detail) => { throw Object.assign(new Error('E_TEXT_GEOGRAPHY_SHAPE: ' + detail), { code: 'E_TEXT_GEOGRAPHY_SHAPE' }); };
function shape(value, required, optional = '') {
  const keys = required.split(' ').filter(Boolean);
  if (!value || typeof value !== 'object' || Array.isArray(value) || keys.some((key) => !own(value, key) || value[key] === null)
    || Object.keys(value).some((key) => ![...keys, ...optional.split(' ')].includes(key))) fail(required);
}
const bool = (value) => { if (typeof value !== 'boolean') fail('boolean required'); return Number(value); };

/** Source contracts only: no territorial rights, station identity normalization or approval inference. */
export function mapGeographyData({ files, bundle }) {
  files ??= bundle?.files;
  if (!Array.isArray(files)) fail('files required');
  const tables = Object.fromEntries(Object.keys(GEOGRAPHY_TABLE_COLUMNS).map((table) => [table, []]));
  const seen = new Set();
  for (const { source_id, document } of [...files].sort((a, b) => a.source_id - b.source_id)) {
    const data = document?.data;
    if (!data || !['currentAffiliation', 'governance', 'territorialScale', 'station_aliases'].some((key) => own(data, key))) continue;
    if (!Number.isSafeInteger(source_id) || seen.has(source_id)) fail('unique integer source_id required');
    seen.add(source_id);
    const emit = (table, json_pointer, values = {}) => {
      for (const [column, value] of Object.entries(values)) {
        if (value === null) continue; // Absent fields in the explicit relational variants.
        const integer = ['ordinal', 'hegemon_ordinal', 'station_ordinal', 'name_ordinal', 'count', 'current_centers', 'has_service_lines',
          'scale_implies_personal_ownership', 'scale_implies_title_rank', 'scale_implies_facility_access', 'slot_existence_implies_grant',
          'barony_polygon', 'geometry_verified', 'current_boundary_certification', 'political_liege_inference',
          'geographic_kingdom_equivalence', 'preserve_stable_political_identities', 'preserve_nonterritorial_kingship'].includes(column);
        if (integer ? !Number.isSafeInteger(value) : typeof value !== 'string') fail(table + '.' + column);
      }
      tables[table].push({ source_id, json_pointer, ...values });
    };
    if (own(data, 'currentAffiliation')) {
      const a = data.currentAffiliation;
      shape(a, 'hegemons states neutralStateIds');
      emit('text_affiliation', '/data/currentAffiliation');
      a.hegemons.forEach((h, ordinal) => {
        shape(h, 'kind name centerRegion memberStateIds aiPosition color', 'stateId');
        const p = '/data/currentAffiliation/hegemons/' + ordinal;
        emit('text_affiliation_hegemon', p, { ordinal, kind: h.kind, state_id: h.stateId ?? null, name: h.name, center_region: h.centerRegion, ai_position: h.aiPosition, color: h.color });
        h.memberStateIds.forEach((state_id, i) => emit('text_affiliation_member', p + '/memberStateIds/' + i, { hegemon_ordinal: ordinal, ordinal: i, state_id }));
      });
      a.states.forEach((s, ordinal) => {
        shape(s, 'stateId currentName currentBase currentExclusiveDistricts');
        shape(s.currentBase, 'kind name', 'stationId landmarkId');
        const b = s.currentBase;
        emit('text_affiliation_state', '/data/currentAffiliation/states/' + ordinal, { ordinal, state_id: s.stateId, current_name: s.currentName,
          base_kind: b.kind, station_id: b.stationId ?? null, landmark_id: b.landmarkId ?? null, base_name: b.name, exclusive_districts: s.currentExclusiveDistricts });
      });
      a.neutralStateIds.forEach((state_id, ordinal) => emit('text_affiliation_neutral', '/data/currentAffiliation/neutralStateIds/' + ordinal, { ordinal, state_id }));
    }
    if (own(data, 'governance')) {
      if (typeof data.governance !== 'string') fail('governance must be text');
      emit('text_governance', '/data/governance', { text: data.governance });
    }
    if (own(data, 'territorialScale')) {
      const t = data.territorialScale, p = '/data/territorialScale';
      shape(t, 'schema scope geographicSource geographicEmpireId rankOrder levels map slotEditions geographicParent politicalAxis scaleImpliesPersonalOwnership scaleImpliesTitleRank scaleImpliesFacilityAccess slotExistenceImpliesGrant');
      emit('text_territorial', p, { schema: t.schema, scope: t.scope, geographic_empire_id: t.geographicEmpireId,
        scale_implies_personal_ownership: bool(t.scaleImpliesPersonalOwnership), scale_implies_title_rank: bool(t.scaleImpliesTitleRank),
        scale_implies_facility_access: bool(t.scaleImpliesFacilityAccess), slot_existence_implies_grant: bool(t.slotExistenceImpliesGrant) });
      shape(t.geographicSource, 'path sha256 schema');
      emit('text_territorial_source', p + '/geographicSource', t.geographicSource);
      t.rankOrder.forEach((rank, ordinal) => emit('text_territorial_rank', p + '/rankOrder/' + ordinal, { ordinal, rank }));
      shape(t.levels, 'empire kingdom duchy county barony');
      for (const [level, l] of Object.entries(t.levels)) {
        shape(l, level === 'barony' ? 'representation idField parentField' : 'sourcePointer rank count' + (level === 'kingdom' ? ' partitionSha256' : ''));
        emit('text_territorial_level', p + '/levels/' + level, { level, source_pointer: l.sourcePointer ?? null, rank: l.rank ?? null, count: l.count ?? null,
          partition_sha256: l.partitionSha256 ?? null, representation: l.representation ?? null, id_field: l.idField ?? null, parent_field: l.parentField ?? null });
      }
      shape(t.map, 'minimumPolygonRank selectableRanks baronyPolygon');
      emit('text_territorial_map', p + '/map', { minimum_polygon_rank: t.map.minimumPolygonRank, barony_polygon: bool(t.map.baronyPolygon) });
      t.map.selectableRanks.forEach((rank, ordinal) => emit('text_territorial_selectable_rank', p + '/map/selectableRanks/' + ordinal, { ordinal, rank }));
      shape(t.slotEditions, 'dated currentCorrespondence');
      for (const [edition_kind, e] of Object.entries(t.slotEditions)) {
        shape(e, 'sourcePointer edition count geometryVerified ' + (edition_kind === 'dated' ? 'baseDate currentBoundaryCertification' : 'administrativeCandidateDate checkedAt'));
        emit('text_territorial_slot_edition', p + '/slotEditions/' + edition_kind, { edition_kind, source_pointer: e.sourcePointer, edition: e.edition,
          base_date: e.baseDate ?? null, administrative_candidate_date: e.administrativeCandidateDate ?? null, checked_at: e.checkedAt ?? null,
          count: e.count, geometry_verified: bool(e.geometryVerified), current_boundary_certification: own(e, 'currentBoundaryCertification') ? bool(e.currentBoundaryCertification) : null });
      }
      const g = t.geographicParent;
      shape(g, 'sourceField meaning politicalLiegeInference crossDistrictExceptions');
      emit('text_territorial_parent', p + '/geographicParent', { source_field: g.sourceField, meaning: g.meaning, political_liege_inference: bool(g.politicalLiegeInference) });
      g.crossDistrictExceptions.forEach((e, ordinal) => {
        shape(e, 'titleId parentTitleId mapKingdomTitleId kind');
        emit('text_territorial_parent_exception', p + '/geographicParent/crossDistrictExceptions/' + ordinal,
          { ordinal, title_id: e.titleId, parent_title_id: e.parentTitleId, map_kingdom_title_id: e.mapKingdomTitleId, kind: e.kind });
      });
      const a = t.politicalAxis;
      shape(a, 'currentCenters geographicKingdomEquivalence preserveStablePoliticalIdentities preserveNonterritorialKingship');
      emit('text_territorial_political_axis', p + '/politicalAxis', { current_centers: a.currentCenters,
        geographic_kingdom_equivalence: bool(a.geographicKingdomEquivalence), preserve_stable_political_identities: bool(a.preserveStablePoliticalIdentities),
        preserve_nonterritorial_kingship: bool(a.preserveNonterritorialKingship) });
    }
    if (own(data, 'station_aliases')) {
      emit('text_station_catalog', '/data/station_aliases');
      data.station_aliases.forEach((s, ordinal) => {
        shape(s, 'id aliases observed_lines source', 'service_lines');
        const p = '/data/station_aliases/' + ordinal;
        emit('text_station', p, { ordinal, station_id: s.id, source: s.source, has_service_lines: Number(own(s, 'service_lines')) });
        s.aliases.forEach((alias, i) => emit('text_station_alias', p + '/aliases/' + i, { station_ordinal: ordinal, ordinal: i, alias }));
        for (const line_kind of ['observed_lines', 'service_lines']) {
          if (!own(s, line_kind)) continue;
          Object.entries(s[line_kind]).forEach(([name, lines], i) => {
            const q = p + '/' + line_kind + '/' + escape(name);
            emit('text_station_line_name', q, { station_ordinal: ordinal, line_kind, ordinal: i, name });
            lines.forEach((line, j) => emit('text_station_line', q + '/' + j, { station_ordinal: ordinal, line_kind, name_ordinal: i, ordinal: j, line }));
          });
        }
      });
    }
  }
  return Object.freeze(Object.fromEntries(Object.entries(tables).map(([table, rows]) => [table, Object.freeze(rows.map(Object.freeze))])));
}

export function reconstructGeographyData({ tables, source_id }) {
  const rows = (table) => tables[table].filter((row) => row.source_id === source_id).sort((a, b) => a.ordinal - b.ordinal);
  const data = {};
  if (rows('text_affiliation').length) data.currentAffiliation = {
    hegemons: rows('text_affiliation_hegemon').map((h) => ({ kind: h.kind, ...(h.state_id === null ? {} : { stateId: h.state_id }), name: h.name, centerRegion: h.center_region,
      memberStateIds: rows('text_affiliation_member').filter((m) => m.hegemon_ordinal === h.ordinal).map((m) => m.state_id), aiPosition: h.ai_position, color: h.color })),
    states: rows('text_affiliation_state').map((s) => ({ stateId: s.state_id, currentName: s.current_name, currentBase: { kind: s.base_kind,
      ...(s.station_id === null ? {} : { stationId: s.station_id }), ...(s.landmark_id === null ? {} : { landmarkId: s.landmark_id }), name: s.base_name }, currentExclusiveDistricts: s.exclusive_districts })),
    neutralStateIds: rows('text_affiliation_neutral').map((s) => s.state_id),
  };
  if (rows('text_governance').length) data.governance = rows('text_governance')[0].text;
  if (rows('text_territorial').length) {
    const t = rows('text_territorial')[0], m = rows('text_territorial_map')[0], g = rows('text_territorial_parent')[0], a = rows('text_territorial_political_axis')[0];
    const source = rows('text_territorial_source')[0];
    data.territorialScale = { schema: t.schema, scope: t.scope, geographicSource: { path: source.path, sha256: source.sha256, schema: source.schema },
      geographicEmpireId: t.geographic_empire_id, rankOrder: rows('text_territorial_rank').map((r) => r.rank),
      levels: Object.fromEntries(rows('text_territorial_level').map((l) => [l.level, l.level === 'barony'
        ? { representation: l.representation, idField: l.id_field, parentField: l.parent_field }
        : { sourcePointer: l.source_pointer, rank: l.rank, count: l.count, ...(l.level === 'kingdom' ? { partitionSha256: l.partition_sha256 } : {}) }])),
      map: { minimumPolygonRank: m.minimum_polygon_rank, selectableRanks: rows('text_territorial_selectable_rank').map((r) => r.rank), baronyPolygon: Boolean(m.barony_polygon) },
      slotEditions: Object.fromEntries(rows('text_territorial_slot_edition').map((e) => [e.edition_kind, { sourcePointer: e.source_pointer, edition: e.edition,
        ...(e.edition_kind === 'dated' ? { baseDate: e.base_date, currentBoundaryCertification: Boolean(e.current_boundary_certification) }
          : { administrativeCandidateDate: e.administrative_candidate_date, checkedAt: e.checked_at }), count: e.count, geometryVerified: Boolean(e.geometry_verified) }])),
      geographicParent: { sourceField: g.source_field, meaning: g.meaning, politicalLiegeInference: Boolean(g.political_liege_inference),
        crossDistrictExceptions: rows('text_territorial_parent_exception').map((e) => ({ titleId: e.title_id, parentTitleId: e.parent_title_id, mapKingdomTitleId: e.map_kingdom_title_id, kind: e.kind })) },
      politicalAxis: { currentCenters: a.current_centers, geographicKingdomEquivalence: Boolean(a.geographic_kingdom_equivalence),
        preserveStablePoliticalIdentities: Boolean(a.preserve_stable_political_identities), preserveNonterritorialKingship: Boolean(a.preserve_nonterritorial_kingship) },
      scaleImpliesPersonalOwnership: Boolean(t.scale_implies_personal_ownership), scaleImpliesTitleRank: Boolean(t.scale_implies_title_rank),
      scaleImpliesFacilityAccess: Boolean(t.scale_implies_facility_access), slotExistenceImpliesGrant: Boolean(t.slot_existence_implies_grant) };
  }
  if (rows('text_station_catalog').length) data.station_aliases = rows('text_station').map((s) => {
    const station = { id: s.station_id, aliases: rows('text_station_alias').filter((a) => a.station_ordinal === s.ordinal).map((a) => a.alias) };
    for (const kind of ['observed_lines', ...(s.has_service_lines ? ['service_lines'] : [])]) station[kind] = Object.fromEntries(rows('text_station_line_name')
      .filter((n) => n.station_ordinal === s.ordinal && n.line_kind === kind).map((n) => [n.name, rows('text_station_line')
        .filter((l) => l.station_ordinal === s.ordinal && l.line_kind === kind && l.name_ordinal === n.ordinal).map((l) => l.line)]));
    return { ...station, source: s.source };
  });
  return data;
}
