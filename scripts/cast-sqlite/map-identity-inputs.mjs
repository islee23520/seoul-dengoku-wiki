const sourcePath = 'lore/factions/Sixteen-States.json';
const pointer = '/data/currentAffiliation';
const stateIds = Array.from({ length: 16 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`);
const fail = detail => { throw Object.assign(new Error(`E_AFFILIATION_IDENTITY: ${detail}`), { code: 'E_AFFILIATION_IDENTITY' }); };

/** SELECT-only slice of the current head revision, not an exporter. The caller owns
 * the snapshot and its read-only transaction.
 * No person approval or canonical union crosswalk is accepted by this API.
 * Union source records remain explicitly unresolved until that separate reviewed
 * binding exists; they must not be treated as complete required-affiliation output.
 */
export function readAffiliationIdentityInputs(db) { return readIdentityInputs(db); }

// Only the exporter supplies an independently code-enrolled selected source.
function readIdentityInputs(db, selected) {
  const all = (sql, ...bindings) => db.prepare(sql).all(...bindings).map(row => ({ ...row }));
  const identities = selected ? all(`SELECT d.source_id,d.document_id,d.domain,d.corpus_kind,d.status,
    s.logical_path,s.sha256,h.revision_id,r.semantic_sha256,r.parent_revision,r.algorithm
    FROM text_document d JOIN source_file s USING(source_id)
    JOIN document_head h USING(source_id) JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id)
    WHERE d.source_id=? AND d.document_id='DOC:Sixteen-States' AND d.domain='factions'
      AND d.corpus_kind='current' AND d.status IN ('approved','draft')
      AND s.logical_path=? AND s.sha256=? AND r.revision_id=? AND r.semantic_sha256=?
      AND r.parent_revision=? AND r.algorithm='typed-envelope-v1'
      AND NOT EXISTS(SELECT 1 FROM excluded_source e WHERE e.logical_path=s.logical_path)`,
  selected.sourceId, sourcePath, selected.sourceSha256, selected.revisionId, selected.semanticSha256, selected.parentRevision)
    : all(`SELECT d.source_id,d.document_id,d.domain,d.corpus_kind,d.status,
    s.logical_path,s.sha256,h.revision_id,r.semantic_sha256,r.algorithm
    FROM text_document d JOIN source_file s USING(source_id)
    JOIN document_head h USING(source_id)
    JOIN document_revision r USING(source_id,revision_id)
    JOIN document_revision_seal z USING(revision_id)
    WHERE d.document_id='DOC:Sixteen-States' AND d.domain='factions'
      AND d.corpus_kind='current' AND d.status IN ('approved','draft')
      AND s.logical_path=? AND r.algorithm='typed-envelope-v1'
      AND NOT EXISTS(SELECT 1 FROM excluded_source e WHERE e.logical_path=s.logical_path)`,
  sourcePath);
  if (identities.length !== 1) fail('missing current sealed revision');
  const source = identities[0];
  const columns = {
    text_affiliation: 'source_id,json_pointer',
    text_affiliation_hegemon: 'source_id,json_pointer,ordinal,kind,state_id,name',
    text_affiliation_member: 'source_id,json_pointer,hegemon_ordinal,ordinal,state_id',
    text_affiliation_state: 'source_id,json_pointer,ordinal,state_id,current_name',
    text_affiliation_neutral: 'source_id,json_pointer,ordinal,state_id',
  };
  const slice = {};
  for (const [table, fields] of Object.entries(columns)) {
    const order = table === 'text_affiliation' ? 'json_pointer'
      : table === 'text_affiliation_member' ? 'hegemon_ordinal,ordinal' : 'ordinal';
    const current = all(`SELECT ${fields} FROM ${table} WHERE source_id=? ORDER BY ${order}`, source.source_id);
    const sealed = all(`SELECT ${fields} FROM document_revision_${table}
      WHERE source_id=? AND revision_id=? ORDER BY ${order}`, source.source_id, source.revision_id);
    if (JSON.stringify(current) !== JSON.stringify(sealed)) fail(`${table}: current identity drift`);
    slice[table] = sealed;
  }
  if (slice.text_affiliation.length !== 1 || slice.text_affiliation[0].json_pointer !== pointer) fail('missing affiliation root');
  const known = new Map(all(`SELECT state_id,name_ko FROM state
    WHERE state_id IN (${stateIds.map(() => '?')}) ORDER BY state_id`, ...stateIds).map(row => [row.state_id, row.name_ko]));
  if (known.size !== stateIds.length) fail('known state coverage');
  const ordered = (rows, base) => {
    rows.forEach((row, i) => {
      if (row.ordinal !== i || row.json_pointer !== `${base}/${i}`) fail(`${base}: source order/pointer`);
    });
  };
  ordered(slice.text_affiliation_hegemon, `${pointer}/hegemons`);
  ordered(slice.text_affiliation_state, `${pointer}/states`);
  ordered(slice.text_affiliation_neutral, `${pointer}/neutralStateIds`);
  const memberships = new Map();
  const assign = (id, membership) => {
    if (!known.has(id) || memberships.has(id)) fail(`unknown/duplicate membership: ${id}`);
    memberships.set(id, membership);
  };
  const hegemons = slice.text_affiliation_hegemon.map(row => {
    const members = slice.text_affiliation_member.filter(member => member.hegemon_ordinal === row.ordinal);
    ordered(members, `${row.json_pointer}/memberStateIds`);
    if (!row.name || !members.length || !['state', 'union'].includes(row.kind)) fail('hegemon shape');
    const memberStateIds = members.map(member => member.state_id);
    if (row.kind === 'state' && (!known.has(row.state_id) || !memberStateIds.includes(row.state_id))) fail('state hegemon identity');
    if (row.kind === 'union' && row.state_id !== null) fail('union cannot have a state head');
    const membership = row.kind === 'state'
      ? { membershipStatus: 'known', kind: 'state', stateId: row.state_id, sourcePointer: row.json_pointer }
      : { membershipStatus: 'unresolved-source-binding', kind: 'union', sourcePointer: row.json_pointer };
    for (const id of memberStateIds) assign(id, membership);
    return { sourcePointer: row.json_pointer, ordinal: row.ordinal, kind: row.kind, name: row.name,
      ...(row.kind === 'state' ? { stateId: row.state_id } : { resolution: 'unresolved-source-binding' }), memberStateIds };
  });
  if (slice.text_affiliation_member.length !== hegemons.reduce((n, h) => n + h.memberStateIds.length, 0)) fail('orphan member');
  for (const row of slice.text_affiliation_neutral) assign(row.state_id, { membershipStatus: 'neutral', hegemonRef: null });
  const seen = new Set();
  const states = slice.text_affiliation_state.map(row => {
    if (!known.has(row.state_id) || seen.has(row.state_id) || !row.current_name || known.get(row.state_id) !== row.current_name) fail('state identity/name');
    seen.add(row.state_id);
    return { stateId: row.state_id, currentName: row.current_name, ordinal: row.ordinal,
      sourcePointer: row.json_pointer, affiliation: memberships.get(row.state_id) };
  });
  if (seen.size !== known.size || memberships.size !== known.size) fail('affiliation coverage');
  return { source, verification: selected ? 'trusted-snapshot/internal-approved-successor-projection' : 'trusted-snapshot/sealed-admitted-revision-projection', hegemons, states,
    neutralStateIds: slice.text_affiliation_neutral.map(row => row.state_id) };
}
