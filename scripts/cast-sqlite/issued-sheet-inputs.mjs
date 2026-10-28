import { createHash } from 'node:crypto';

const sourcePath = 'lore/name-pools/gurps-cast.json';
const fail = detail => { throw Object.assign(new Error(`E_ISSUED_SHEET_INPUT: ${detail}`), { code: 'E_ISSUED_SHEET_INPUT' }); };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const tables = ['person', 'gurps_profile', 'gurps_attribute', 'gurps_secondary', 'gurps_trait',
  'gurps_trait_application_boundary', 'gurps_skill', 'gurps_language', 'gurps_advantage',
  'gurps_disadvantage', 'gurps_territory', 'gurps_unit', 'gurps_unit_composition',
  'gurps_wandering_force', 'gurps_wandering_facility', 'evidence'];

function candidates(db) {
  const data = Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
  const annotations = new Map(db.prepare('SELECT evidence_id,interpretation,provenance_note FROM issued_sheet_evidence_annotation').all().map(r => [r.evidence_id, r]));
  const used = new Set();
  const byPerson = Object.fromEntries(Object.entries(data).map(([table, records]) => {
    const index = new Map();
    for (const row of records) {
      if (!index.has(row.person_id)) index.set(row.person_id, []);
      index.get(row.person_id).push(row);
    }
    return [table, index];
  }));
  const rows = (table, id, filter = () => true) => (byPerson[table].get(id) ?? []).filter(filter).sort((a, b) => (a.ordinal ?? a.evidence_ordinal ?? 0) - (b.ordinal ?? b.evidence_ordinal ?? 0)).map(r => { used.add(r); return r; });
  const one = (table, id) => { const found = rows(table, id); if (found.length > 1) fail(`${table}:${id}:duplicate`); return found[0]; };
  const ev = (id, kind, ordinal, key) => rows('evidence', id, r => r.subject_kind === kind && r.subject_ordinal === ordinal && r.subject_key === key).map(r => {
    const extra = annotations.get(r.evidence_id);
    if (extra) annotations.delete(r.evidence_id);
    return { note: r.note_text, path: r.source_path, pointer: r.json_pointer, line: r.source_line, quote: r.quote,
      interpretation: extra?.interpretation, provenanceNote: extra?.provenance_note };
  });
  const output = data.gurps_profile.slice().sort((a, b) => Number(a.json_pointer.split('/').at(-1)) - Number(b.json_pointer.split('/').at(-1))).map((p, i) => {
    used.add(p);
    if (p.json_pointer !== `/people/${i}`) fail('profile order');
    const id = p.person_id, person = one('person', id);
    if (!person) fail(`${id}:identity`);
    const territory = one('gurps_territory', id), unit = one('gurps_unit', id), force = one('gurps_wandering_force', id);
    return { id, name: person.name, url: p.url, state: p.state_id, method: p.method,
      role: { display: p.role_display, evidence: ev(id, 'role', null, 'role') },
      attributes: Object.fromEntries(rows('gurps_attribute', id).map(r => [r.attribute_code, { value: r.value, cp: r.cp, rule: r.rule, evidence: ev(id, 'attribute', r.ordinal, r.attribute_code) }])),
      traits: rows('gurps_trait', id).map(r => ({ name: r.name, kind: r.kind, rule: r.rule, level: r.level, people: r.people, frequency: r.frequency, cp: r.cp, page: r.page, effect: r.effect,
        reaction: { ordinaryObservers: r.reaction_ordinary_observers, observersAttractedToHerSex: r.reaction_attracted_observers, application: r.reaction_application },
        applicationBoundaries: rows('gurps_trait_application_boundary', id, b => b.trait_ordinal === r.ordinal).map(b => b.text), evidence: ev(id, 'trait', r.ordinal, r.name) })),
      skills: rows('gurps_skill', id).map(r => ({ name: r.name, ko: r.name_ko, attr: r.attribute_code, [r.difficulty_source]: r.difficulty, tier: r.tier, cp: r.cp, level: r.level, effect: r.effect, evidence: ev(id, 'skill', r.ordinal, r.name) })),
      languages: rows('gurps_language', id).map(r => ({ name: r.name, level: r.level, cp: r.cp, evidence: ev(id, 'language', r.ordinal, r.name) })),
      secondary: Object.fromEntries(rows('gurps_secondary', id).map(r => [r.stat_name, r.value])),
      cp: Object.fromEntries(['attributes', 'advantages', 'disadvantages', 'skills', 'spent', 'unspent', 'total'].map(k => [k, p[k]])),
      band: p.band, baseline: Boolean(p.baseline),
      advantages: rows('gurps_advantage', id).map(r => ({ name: r.name, cp: r.cp, effect: r.effect })),
      disadvantages: rows('gurps_disadvantage', id).map(r => ({ name: r.name, cp: r.cp, effect: r.effect })),
      territory: territory && { fief_name: territory.fief_name, type: territory.type, station: territory.station, state: territory.state_id,
        settlement: { name: territory.settlement_name, type: territory.settlement_type, description: territory.settlement_description }, note: territory.note },
      unit: unit && { type: unit.type, size: unit.size, quality: unit.quality, composition: rows('gurps_unit_composition', id).map(r => r.text), note: unit.note,
        faction_scale: { state: unit.scale_state_id, tier: unit.scale_tier, factor: unit.scale_factor } },
      wandering_force: force && { type: force.type, size: force.size, current_location: force.current_location,
        camp: { name: force.camp_name, type: force.camp_type, description: force.camp_description, facilities: rows('gurps_wandering_facility', id).map(r => r.text), pack_up_time: force.camp_pack_up_time }, note: force.note },
    };
  });
  if (new Set(output.map(p => p.id)).size !== output.length || annotations.size || Object.values(data).some(rs => rs.some(r => !used.has(r)))) fail('typed coverage');
  return output;
}

function orderedPeople(db) {
  const keys = db.prepare('SELECT person_id,object_path,ordinal,key,is_null FROM issued_sheet_object_key ORDER BY person_id,object_path,ordinal').all();
  const groups = new Map();
  for (const r of keys) { const k = `${r.person_id}:${r.object_path}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
  const visit = (value, id, path) => {
    if (Array.isArray(value)) return value.map((v, i) => visit(v, id, `${path}/${i}`));
    if (value === null || typeof value !== 'object') return value;
    const k = `${id}:${path}`, fields = groups.get(k);
    if (!fields) fail(`${k}:missing keys`);
    groups.delete(k);
    return Object.fromEntries(fields.map((r, i) => {
      if (r.ordinal !== i || !Object.hasOwn(value, r.key)
        || (!r.is_null && value[r.key] === undefined) || ![0, 1].includes(r.is_null)) fail(`${k}:${r.key}:unknown field/presence`);
      return [r.key, r.is_null ? null : visit(value[r.key], id, `${path}/${r.key}`)];
    }));
  };
  const people = candidates(db).map(p => visit(p, p.id, ''));
  if (groups.size) fail('unconsumed object keys');
  return people;
}

// Runtime performs SELECTs over typed domains only. No source/archive reads,
// JSON parsing, schema creation, or implicit migration occur here.
export function readIssuedSheetInputs(db) {
  try {
    const receipts = db.prepare('SELECT * FROM issued_sheet_import').all();
    if (receipts.length !== 1) fail('import receipt');
    const people = orderedPeople(db);
    if (receipts[0].profile_count !== people.length) fail('people count');
    if (hash(JSON.stringify(people)) !== receipts[0].people_sha256) fail('people digest/coverage');
    return { people };
  } catch (error) {
    if (error.code === 'E_ISSUED_SHEET_INPUT') throw error;
    fail(error.message);
  }
}

// Migration is explicit and receives the authenticated bytes, actor and reason.
// Original source_file bytes remain evidence only; they are never runtime input.
export async function initializeIssuedSheetInputs(db, { sourceBytes, actor, reason } = {}) {
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  const expectedSourceHash = hash(sourceBytes);
  if (![actor, reason].every(v => typeof v === 'string' && v.trim())) fail('actor/reason');
  if (db.isTransaction) fail('active transaction');
  const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes));
  if (!Array.isArray(document.people) || !document.people.length) fail('source people');
  const source = db.prepare('SELECT sha256 FROM source_file WHERE logical_path=?').all(sourcePath);
  if (source.length !== 1 || source[0].sha256 !== expectedSourceHash) fail('archive identity');
  const { readFile } = await import('node:fs/promises');
  const schema = await readFile(new URL('./issued-sheet-inputs.sql', import.meta.url), 'utf8');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schema);
    const addKey = db.prepare('INSERT INTO issued_sheet_object_key VALUES (?,?,?,?,?)');
    const addAnnotation = db.prepare('INSERT INTO issued_sheet_evidence_annotation VALUES (?,?,?)');
    const evidence = db.prepare('SELECT evidence_id,person_id,subject_kind,subject_key,subject_ordinal,evidence_ordinal FROM evidence').all();
    const walk = (value, id, path) => {
      if (Array.isArray(value)) { value.forEach((v, i) => walk(v, id, `${path}/${i}`)); return; }
      if (value === null || typeof value !== 'object') return;
      Object.entries(value).forEach(([key, v], ordinal) => { addKey.run(id, path, ordinal, key, Number(v === null)); walk(v, id, `${path}/${key}`); });
      if (Object.hasOwn(value, 'interpretation') || Object.hasOwn(value, 'provenanceNote')) {
        if (![value.interpretation, value.provenanceNote].every(v => v === undefined || typeof v === 'string')) fail('annotation type');
        const parts = path.split('/'), evidenceOrdinal = Number(parts.at(-1));
        let kind = parts[1], ordinal = Number(parts[2]), key;
        const p = document.people.find(p => p.id === id);
        if (kind === 'role') { ordinal = null; key = 'role'; }
        else if (kind === 'attributes') { kind = 'attribute'; ordinal = ['ST', 'DX', 'IQ', 'HT'].indexOf(parts[2]); key = parts[2]; }
        else { kind = { traits: 'trait', skills: 'skill', languages: 'language' }[kind]; key = p[parts[1]]?.[ordinal]?.name; }
        const found = evidence.filter(r => r.person_id === id && r.subject_kind === kind && r.subject_key === key && r.subject_ordinal === ordinal && r.evidence_ordinal === evidenceOrdinal);
        if (parts.at(-2) !== 'evidence' || found.length !== 1) fail(`annotation target:${id}:${path}`);
        addAnnotation.run(found[0].evidence_id, value.interpretation ?? null, value.provenanceNote ?? null);
      }
    };
    document.people.forEach(p => walk(p, p.id, ''));
    const people = orderedPeople(db);
    if (JSON.stringify(people) !== JSON.stringify(document.people)) fail('existing typed data differs or unsupported field');
    db.prepare('INSERT INTO issued_sheet_import VALUES (1,?,?,?,?,?)').run(expectedSourceHash, hash(JSON.stringify(people)), people.length, actor, reason);
    readIssuedSheetInputs(db);
    db.exec('COMMIT');
    return { profileCount: people.length, sourceHash: expectedSourceHash };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
