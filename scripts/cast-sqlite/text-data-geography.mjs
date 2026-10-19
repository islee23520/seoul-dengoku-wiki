export const GEOGRAPHY_TABLE_COLUMNS = Object.freeze(Object.fromEntries(Object.entries({
  text_affiliation: 'source_id json_pointer',
  text_affiliation_hegemon: 'source_id json_pointer ordinal kind state_id name ai_position color',
  text_affiliation_member: 'source_id json_pointer hegemon_ordinal ordinal state_id',
  text_affiliation_state: 'source_id json_pointer ordinal state_id current_name base_kind station_id landmark_id base_name exclusive_districts',
  text_affiliation_neutral: 'source_id json_pointer ordinal state_id',
  text_governance: 'source_id json_pointer text',
  text_territorial: 'source_id json_pointer schema scale_implies_personal_ownership scale_implies_title_rank major_polities whole_kingdom_controlled_by_one_polity',
  text_territorial_regular: 'source_id json_pointer province city county district direct_municipal_eup_myeon_dong eup_myeon_dong_within_gu component_implies_lower_title',
  text_territorial_province: 'source_id json_pointer ordinal province_code',
  text_territorial_special_city: 'source_id json_pointer ordinal name english_name city district dong',
  text_territorial_kingdom_container: 'source_id json_pointer ordinal province_code name',
  text_territorial_sejong: 'source_id json_pointer province_code name english_name geographic_container_id city direct_eup_myeon_dong',
  text_territorial_sejong_alias: 'source_id json_pointer ordinal alias',
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
  if (!value || typeof value !== 'object' || Array.isArray(value) || keys.some((key) => !own(value, key))
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
    const emit = (table, json_pointer, values = {}) => tables[table].push({ source_id, json_pointer, ...values });
    if (own(data, 'currentAffiliation')) {
      const a = data.currentAffiliation;
      shape(a, 'hegemons states neutralStateIds');
      emit('text_affiliation', '/data/currentAffiliation');
      a.hegemons.forEach((h, ordinal) => {
        shape(h, 'kind name memberStateIds aiPosition color', 'stateId');
        const p = '/data/currentAffiliation/hegemons/' + ordinal;
        emit('text_affiliation_hegemon', p, { ordinal, kind: h.kind, state_id: h.stateId ?? null, name: h.name, ai_position: h.aiPosition, color: h.color });
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
      const t = data.territorialScale;
      const p = '/data/territorialScale';
      shape(t, 'schema regularRegions specialCities scaleImpliesPersonalOwnership scaleImpliesTitleRank seoulControl separateKingdomContainers sejong');
      shape(t.seoulControl, 'majorPolities wholeKingdomControlledByOnePolity');
      emit('text_territorial', p, { schema: t.schema, scale_implies_personal_ownership: bool(t.scaleImpliesPersonalOwnership), scale_implies_title_rank: bool(t.scaleImpliesTitleRank),
        major_polities: t.seoulControl.majorPolities, whole_kingdom_controlled_by_one_polity: bool(t.seoulControl.wholeKingdomControlledByOnePolity) });
      const r = t.regularRegions;
      shape(r, 'provinceCodes province city county district directMunicipalEupMyeonDong eupMyeonDongWithinGu componentImpliesLowerTitle');
      emit('text_territorial_regular', p + '/regularRegions', { province: r.province, city: r.city, county: r.county, district: r.district,
        direct_municipal_eup_myeon_dong: r.directMunicipalEupMyeonDong, eup_myeon_dong_within_gu: r.eupMyeonDongWithinGu, component_implies_lower_title: bool(r.componentImpliesLowerTitle) });
      r.provinceCodes.forEach((province_code, ordinal) => emit('text_territorial_province', p + '/regularRegions/provinceCodes/' + ordinal, { ordinal, province_code }));
      t.specialCities.forEach((c, ordinal) => { shape(c, 'name englishName city district dong'); emit('text_territorial_special_city', p + '/specialCities/' + ordinal, { ordinal, name: c.name, english_name: c.englishName, city: c.city, district: c.district, dong: c.dong }); });
      t.separateKingdomContainers.forEach((c, ordinal) => { shape(c, 'provinceCode name'); emit('text_territorial_kingdom_container', p + '/separateKingdomContainers/' + ordinal, { ordinal, province_code: c.provinceCode, name: c.name }); });
      const s = t.sejong;
      shape(s, 'provinceCode name englishName geographicContainerId city directEupMyeonDong sourceAliases');
      emit('text_territorial_sejong', p + '/sejong', { province_code: s.provinceCode, name: s.name, english_name: s.englishName, geographic_container_id: s.geographicContainerId, city: s.city, direct_eup_myeon_dong: s.directEupMyeonDong });
      s.sourceAliases.forEach((alias, ordinal) => emit('text_territorial_sejong_alias', p + '/sejong/sourceAliases/' + ordinal, { ordinal, alias }));
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
    hegemons: rows('text_affiliation_hegemon').map((h) => ({ kind: h.kind, ...(h.state_id === null ? {} : { stateId: h.state_id }), name: h.name,
      memberStateIds: rows('text_affiliation_member').filter((m) => m.hegemon_ordinal === h.ordinal).map((m) => m.state_id), aiPosition: h.ai_position, color: h.color })),
    states: rows('text_affiliation_state').map((s) => ({ stateId: s.state_id, currentName: s.current_name, currentBase: { kind: s.base_kind,
      ...(s.station_id === null ? {} : { stationId: s.station_id }), ...(s.landmark_id === null ? {} : { landmarkId: s.landmark_id }), name: s.base_name }, currentExclusiveDistricts: s.exclusive_districts })),
    neutralStateIds: rows('text_affiliation_neutral').map((s) => s.state_id),
  };
  if (rows('text_governance').length) data.governance = rows('text_governance')[0].text;
  if (rows('text_territorial').length) {
    const t = rows('text_territorial')[0], r = rows('text_territorial_regular')[0], s = rows('text_territorial_sejong')[0];
    data.territorialScale = { schema: t.schema, regularRegions: { provinceCodes: rows('text_territorial_province').map((p) => p.province_code),
      province: r.province, city: r.city, county: r.county, district: r.district, directMunicipalEupMyeonDong: r.direct_municipal_eup_myeon_dong,
      eupMyeonDongWithinGu: r.eup_myeon_dong_within_gu, componentImpliesLowerTitle: Boolean(r.component_implies_lower_title) },
    specialCities: rows('text_territorial_special_city').map((c) => ({ name: c.name, englishName: c.english_name, city: c.city, district: c.district, dong: c.dong })),
    scaleImpliesPersonalOwnership: Boolean(t.scale_implies_personal_ownership), scaleImpliesTitleRank: Boolean(t.scale_implies_title_rank),
    seoulControl: { majorPolities: t.major_polities, wholeKingdomControlledByOnePolity: Boolean(t.whole_kingdom_controlled_by_one_polity) },
    separateKingdomContainers: rows('text_territorial_kingdom_container').map((c) => ({ provinceCode: c.province_code, name: c.name })),
    sejong: { provinceCode: s.province_code, name: s.name, englishName: s.english_name, geographicContainerId: s.geographic_container_id, city: s.city,
      directEupMyeonDong: s.direct_eup_myeon_dong, sourceAliases: rows('text_territorial_sejong_alias').map((a) => a.alias) } };
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
