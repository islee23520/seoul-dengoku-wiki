import { createHash } from 'node:crypto';

const GURPS_PATH = 'lore/name-pools/gurps-cast.json';
const ATTRIBUTE_CODES = ['ST', 'DX', 'IQ', 'HT'];
const SECONDARY_CODES = ['HP', 'Will', 'Per', 'FP', 'BasicSpeed', 'BasicMove', 'BasicLift', 'Dodge'];
const CP_FIELDS = ['attributes', 'advantages', 'disadvantages', 'skills', 'spent', 'unspent', 'total'];

function fail(code, message) {
  throw Object.assign(new Error(`${code}: ${message}`), { code });
}

function shape(condition, message) {
  if (!condition) fail('E_GURPS_SHAPE', message);
}

function object(value, label) {
  shape(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  return value;
}

function array(value, label) {
  shape(Array.isArray(value), `${label}: expected array`);
  return value;
}

function string(value, label) {
  shape(typeof value === 'string', `${label}: expected string`);
  return value;
}

function number(value, label, integer = false) {
  shape(typeof value === 'number' && Number.isFinite(value) && (!integer || Number.isSafeInteger(value)), `${label}: expected ${integer ? 'safe integer' : 'finite number'}`);
  return value;
}

function optionalNumber(value, label) {
  return value === undefined || value === null ? null : number(value, label);
}

function optionalString(value, label) {
  return value === undefined || value === null ? null : string(value, label);
}

function presence(owner, key) {
  return !Object.hasOwn(owner, key) ? 'absent' : owner[key] === null ? 'null' : 'present';
}

function exactKeys(value, expected, label) {
  object(value, label);
  shape(Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key)), `${label}: expected keys ${expected.join(',')}`);
}

function freezeRows(result) {
  for (const rows of Object.values(result)) {
    for (const row of rows) Object.freeze(row);
    Object.freeze(rows);
  }
  return Object.freeze(result);
}

function pointerValue(document, pointer) {
  if (pointer === '') return { found: true, value: document };
  if (!pointer.startsWith('/') || /~(?:[^01]|$)/u.test(pointer)) return { found: false };
  let value = document;
  for (const part of pointer.slice(1).split('/')) {
    const key = part.replace(/~1/gu, '/').replace(/~0/gu, '~');
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) return { found: false };
    if (Array.isArray(value) && !/^(?:0|[1-9][0-9]*)$/u.test(key)) return { found: false };
    value = value[key];
  }
  return { found: true, value };
}

function evidenceStatus(source, evidence) {
  if (!source) return 'missing-source';
  let text;
  if (evidence.pointer === undefined) {
    shape(typeof source.raw_bytes === 'string' || source.raw_bytes instanceof Uint8Array, `${source.logical_path}: raw_bytes missing`);
    text = Buffer.from(source.raw_bytes).toString('utf8');
  } else {
    if (source.document === null || source.document === undefined) return 'missing-pointer';
    const resolved = pointerValue(source.document, evidence.pointer);
    if (!resolved.found) return 'missing-pointer';
    if (typeof resolved.value === 'string') text = resolved.value;
    else if (Array.isArray(resolved.value) && resolved.value.every((run) => run !== null && typeof run === 'object' && typeof run.text === 'string')) {
      text = resolved.value.map((run) => run.text).join('');
    }
  }
  return evidence.quote.length > 0 && typeof text === 'string' && text.includes(evidence.quote) ? 'match' : 'mismatch';
}

export function mapGurps({ bundle, identity }) {
  const files = array(bundle?.files, 'bundle.files');
  const sources = new Map();
  const sourceIds = new Set();
  for (const file of files) {
    object(file, 'source_file');
    string(file.logical_path, 'source_file.logical_path');
    number(file.source_id, 'source_file.source_id', true);
    shape(!sources.has(file.logical_path) && !sourceIds.has(file.source_id), `duplicate source ${file.logical_path}`);
    sources.set(file.logical_path, file);
    sourceIds.add(file.source_id);
  }
  const source = sources.get(GURPS_PATH);
  shape(source !== undefined, `${GURPS_PATH}: source missing`);
  const document = object(source.document, GURPS_PATH);
  const status = string(document.status, `${GURPS_PATH}.status`);
  const people = array(document.people, `${GURPS_PATH}.people`);
  if (document.count !== undefined) shape(document.count === people.length, 'GURPS count differs from people length');
  const identities = new Map();
  const names = new Set();
  for (const person of array(identity?.people, 'identity.people')) {
    object(person, 'identity person');
    string(person.person_id, 'identity.person_id');
    string(person.name, 'identity.name');
    shape(!identities.has(person.person_id) && !names.has(person.name), `duplicate identity ${person.person_id}`);
    identities.set(person.person_id, person);
    names.add(person.name);
  }
  const result = {
    gurpsProfiles: [], attributes: [], secondary: [], traits: [], traitBoundaries: [], skills: [], languages: [],
    advantages: [], disadvantages: [], territories: [], units: [], unitComposition: [],
    wanderingForces: [], wanderingFacilities: [], evidence: [], qualityIssues: [],
  };
  const seen = new Set();

  function addEvidence(personId, subjectKind, subjectKey, subjectOrdinal, items, pointer) {
    array(items, `${pointer}/evidence`).forEach((item, evidenceOrdinal) => {
      const itemPointer = `${pointer}/evidence/${evidenceOrdinal}`;
      object(item, itemPointer);
      const evidenceId = `evidence-${String(result.evidence.length + 1).padStart(6, '0')}`;
      if (Object.hasOwn(item, 'note')) {
        exactKeys(item, ['note'], itemPointer);
        const note = string(item.note, `${itemPointer}/note`);
        shape(note.length > 0, `${itemPointer}/note: empty note`);
        result.evidence.push({
          evidence_id: evidenceId, person_id: personId, subject_kind: subjectKind, subject_key: subjectKey,
          subject_ordinal: subjectOrdinal, evidence_ordinal: evidenceOrdinal, source_id: source.source_id,
          source_path: null, json_pointer: `${itemPointer}/note`, source_line: null, quote: null, note_text: note, match_status: 'uncited-note',
        });
        result.qualityIssues.push({
          issue_id: `gurps-${evidenceId}`, dataset: 'gurps', code: 'E_GURPS_EVIDENCE_UNCITED',
          severity: 'error', person_id: personId, source_id: source.source_id, json_pointer: itemPointer,
          message: 'Historical GURPS explanation has no verifiable citation', observed_value: JSON.stringify(item),
        });
        return;
      }
      string(item.path, `${itemPointer}/path`);
      string(item.quote, `${itemPointer}/quote`);
      if (item.pointer !== undefined) string(item.pointer, `${itemPointer}/pointer`);
      const citedSource = sources.get(item.path);
      const matchStatus = evidenceStatus(citedSource, item);
      if (item.line !== undefined) shape(number(item.line, `${itemPointer}/line`, true) > 0, `${itemPointer}/line: expected positive line number`);
      result.evidence.push({
        evidence_id: evidenceId, person_id: personId, subject_kind: subjectKind, subject_key: subjectKey,
        subject_ordinal: subjectOrdinal, evidence_ordinal: evidenceOrdinal, source_id: citedSource?.source_id ?? null,
        source_path: item.path, json_pointer: item.pointer ?? null,
        source_line: item.line ?? null,
        quote: item.quote, note_text: null, match_status: matchStatus,
      });
      if (matchStatus !== 'match') result.qualityIssues.push({
        issue_id: `gurps-${evidenceId}`, dataset: 'gurps', code: `E_GURPS_EVIDENCE_${matchStatus.replaceAll('-', '_').toUpperCase()}`,
        severity: 'error', person_id: personId, source_id: source.source_id, json_pointer: itemPointer,
        message: `${matchStatus}: ${item.path}${item.pointer === undefined ? '' : `#${item.pointer}`}`,
        observed_value: JSON.stringify(item),
      });
    });
  }

  people.forEach((person, personOrdinal) => {
    const pointer = `/people/${personOrdinal}`;
    object(person, pointer);
    const registered = identities.get(person.id);
    if (!registered || registered.name !== person.name) fail('E_GURPS_PERSON_ORPHAN', `${pointer}: ${person.id} ${person.name} has no exact registry identity`);
    shape(!seen.has(person.id), `${pointer}: duplicate person ${person.id}`);
    seen.add(person.id);
    const personId = person.id;
    shape(typeof person.baseline === 'boolean', `${pointer}/baseline: expected boolean`);
    object(person.role, `${pointer}/role`);
    exactKeys(person.cp, CP_FIELDS, `${pointer}/cp`);
    const profile = {
      person_id: personId, state_id: string(person.state, `${pointer}/state`), url: string(person.url, `${pointer}/url`),
      status, method: string(person.method, `${pointer}/method`), role_display: string(person.role.display, `${pointer}/role/display`),
      band: string(person.band, `${pointer}/band`), baseline: Number(person.baseline),
      source_id: source.source_id, json_pointer: pointer,
      territory_presence: presence(person, 'territory'), unit_presence: presence(person, 'unit'),
      wandering_force_presence: presence(person, 'wandering_force'),
      advantages_presence: presence(person, 'advantages'), disadvantages_presence: presence(person, 'disadvantages'),
    };
    for (const key of CP_FIELDS) profile[key] = number(person.cp[key], `${pointer}/cp/${key}`, true);
    result.gurpsProfiles.push(profile);
    addEvidence(personId, 'role', 'role', null, person.role.evidence, `${pointer}/role`);
    exactKeys(person.attributes, ATTRIBUTE_CODES, `${pointer}/attributes`);
    Object.entries(person.attributes).forEach(([code, attribute], ordinal) => {
      const attributePointer = `${pointer}/attributes/${code}`;
      object(attribute, attributePointer);
      result.attributes.push({ person_id: personId, attribute_code: code, ordinal, value: number(attribute.value, `${attributePointer}/value`, true), cp: number(attribute.cp, `${attributePointer}/cp`, true), rule: string(attribute.rule, `${attributePointer}/rule`) });
      addEvidence(personId, 'attribute', code, ordinal, attribute.evidence, attributePointer);
    });
    exactKeys(person.secondary, SECONDARY_CODES, `${pointer}/secondary`);
    Object.entries(person.secondary).forEach(([code, value], ordinal) => {
      result.secondary.push({ person_id: personId, stat_name: code, ordinal, value: number(value, `${pointer}/secondary/${code}`) });
    });
    array(person.traits, `${pointer}/traits`).forEach((trait, ordinal) => {
      const childPointer = `${pointer}/traits/${ordinal}`;
      object(trait, childPointer);
      const reaction = trait.reaction === undefined || trait.reaction === null ? null : object(trait.reaction, `${childPointer}/reaction`);
      result.traits.push({ person_id: personId, ordinal, name: string(trait.name, `${childPointer}/name`), kind: string(trait.kind, `${childPointer}/kind`), rule: string(trait.rule, `${childPointer}/rule`), level: optionalNumber(trait.level, `${childPointer}/level`), people: optionalNumber(trait.people, `${childPointer}/people`), frequency: optionalNumber(trait.frequency, `${childPointer}/frequency`), cp: number(trait.cp, `${childPointer}/cp`, true), page: optionalString(trait.page, `${childPointer}/page`),
        effect: optionalString(trait.effect, `${childPointer}/effect`), reaction_presence: presence(trait, 'reaction'),
        reaction_ordinary_observers: reaction === null ? null : number(reaction.ordinaryObservers, `${childPointer}/reaction/ordinaryObservers`, true),
        reaction_attracted_observers: reaction === null ? null : number(reaction.observersAttractedToHerSex, `${childPointer}/reaction/observersAttractedToHerSex`, true),
        reaction_application: reaction === null ? null : string(reaction.application, `${childPointer}/reaction/application`),
        boundaries_presence: presence(trait, 'applicationBoundaries'), source_id: source.source_id, json_pointer: childPointer });
      if (trait.applicationBoundaries !== undefined && trait.applicationBoundaries !== null) array(trait.applicationBoundaries, `${childPointer}/applicationBoundaries`).forEach((text, boundaryOrdinal) => {
        result.traitBoundaries.push({ person_id: personId, trait_ordinal: ordinal, ordinal: boundaryOrdinal,
          text: string(text, `${childPointer}/applicationBoundaries/${boundaryOrdinal}`), source_id: source.source_id,
          json_pointer: `${childPointer}/applicationBoundaries/${boundaryOrdinal}` });
      });
      addEvidence(personId, 'trait', trait.name, ordinal, trait.evidence, childPointer);
    });
    array(person.skills, `${pointer}/skills`).forEach((skill, ordinal) => {
      const childPointer = `${pointer}/skills/${ordinal}`;
      object(skill, childPointer);
      shape((skill.diff === undefined) !== (skill.difficulty === undefined), `${childPointer}: exactly one difficulty field required`);
      result.skills.push({ person_id: personId, ordinal, name: string(skill.name, `${childPointer}/name`), name_ko: optionalString(skill.ko, `${childPointer}/ko`), attribute_code: string(skill.attr, `${childPointer}/attr`), difficulty: string(skill.diff ?? skill.difficulty, `${childPointer}/difficulty`), difficulty_source: skill.diff === undefined ? 'difficulty' : 'diff', tier: optionalString(skill.tier, `${childPointer}/tier`), cp: number(skill.cp, `${childPointer}/cp`, true), level: number(skill.level, `${childPointer}/level`, true), effect: optionalString(skill.effect, `${childPointer}/effect`), evidence_presence: presence(skill, 'evidence'), source_id: source.source_id, json_pointer: childPointer });
      addEvidence(personId, 'skill', skill.name, ordinal, skill.evidence ?? [], childPointer);
    });
    array(person.languages, `${pointer}/languages`).forEach((language, ordinal) => {
      const childPointer = `${pointer}/languages/${ordinal}`;
      object(language, childPointer);
      result.languages.push({ person_id: personId, ordinal, name: string(language.name, `${childPointer}/name`), level: language.level === undefined || language.level === null ? null : string(language.level, `${childPointer}/level`), cp: number(language.cp, `${childPointer}/cp`, true) });
      addEvidence(personId, 'language', language.name, ordinal, language.evidence, childPointer);
    });
    for (const [key, rows] of [['advantages', result.advantages], ['disadvantages', result.disadvantages]]) {
      if (person[key] === undefined || person[key] === null) continue;
      array(person[key], `${pointer}/${key}`).forEach((item, ordinal) => {
        const itemPointer = `${pointer}/${key}/${ordinal}`;
        object(item, itemPointer);
        rows.push({ person_id: personId, ordinal, name: string(item.name, `${itemPointer}/name`),
          cp: number(item.cp, `${itemPointer}/cp`, true), effect: string(item.effect, `${itemPointer}/effect`),
          source_id: source.source_id, json_pointer: itemPointer });
      });
    }
    if (person.territory !== null && person.territory !== undefined) {
      const item = object(person.territory, `${pointer}/territory`);
      const settlement = object(item.settlement, `${pointer}/territory/settlement`);
      result.territories.push({ person_id: personId, fief_name: string(item.fief_name, `${pointer}/territory/fief_name`),
        type: string(item.type, `${pointer}/territory/type`), station: string(item.station, `${pointer}/territory/station`),
        state_id: string(item.state, `${pointer}/territory/state`), settlement_name: string(settlement.name, `${pointer}/territory/settlement/name`),
        settlement_type: string(settlement.type, `${pointer}/territory/settlement/type`),
        settlement_description: string(settlement.description, `${pointer}/territory/settlement/description`),
        note: string(item.note, `${pointer}/territory/note`), source_id: source.source_id, json_pointer: `${pointer}/territory` });
    }
    if (person.unit !== null && person.unit !== undefined) {
      const item = object(person.unit, `${pointer}/unit`);
      const scale = object(item.faction_scale, `${pointer}/unit/faction_scale`);
      result.units.push({ person_id: personId, type: optionalString(item.type, `${pointer}/unit/type`),
        type_presence: presence(item, 'type'),
        size: number(item.size, `${pointer}/unit/size`, true), quality: string(item.quality, `${pointer}/unit/quality`),
        note: string(item.note, `${pointer}/unit/note`), scale_state_id: string(scale.state, `${pointer}/unit/faction_scale/state`),
        scale_tier: string(scale.tier, `${pointer}/unit/faction_scale/tier`), scale_factor: number(scale.factor, `${pointer}/unit/faction_scale/factor`),
        source_id: source.source_id, json_pointer: `${pointer}/unit` });
      array(item.composition, `${pointer}/unit/composition`).forEach((text, ordinal) => result.unitComposition.push({
        person_id: personId, ordinal, text: string(text, `${pointer}/unit/composition/${ordinal}`),
        source_id: source.source_id, json_pointer: `${pointer}/unit/composition/${ordinal}` }));
    }
    if (person.wandering_force !== null && person.wandering_force !== undefined) {
      const item = object(person.wandering_force, `${pointer}/wandering_force`);
      const camp = object(item.camp, `${pointer}/wandering_force/camp`);
      result.wanderingForces.push({ person_id: personId, type: string(item.type, `${pointer}/wandering_force/type`),
        size: number(item.size, `${pointer}/wandering_force/size`, true),
        current_location: string(item.current_location, `${pointer}/wandering_force/current_location`),
        note: string(item.note, `${pointer}/wandering_force/note`), camp_name: string(camp.name, `${pointer}/wandering_force/camp/name`),
        camp_type: string(camp.type, `${pointer}/wandering_force/camp/type`),
        camp_description: string(camp.description, `${pointer}/wandering_force/camp/description`),
        camp_pack_up_time: string(camp.pack_up_time, `${pointer}/wandering_force/camp/pack_up_time`),
        source_id: source.source_id, json_pointer: `${pointer}/wandering_force` });
      array(camp.facilities, `${pointer}/wandering_force/camp/facilities`).forEach((text, ordinal) => result.wanderingFacilities.push({
        person_id: personId, ordinal, text: string(text, `${pointer}/wandering_force/camp/facilities/${ordinal}`),
        source_id: source.source_id, json_pointer: `${pointer}/wandering_force/camp/facilities/${ordinal}` }));
    }
  });
  shape(seen.size === identities.size, `GURPS coverage ${seen.size} differs from registry ${identities.size}`);
  return freezeRows(result);
}

export function parseOfficialGurpsCheck(result) {
  const parseError = (message) => fail('E_SOURCE_CHECK_PARSE', message);
  if (!result || typeof result.checkName !== 'string' || result.checkName.length === 0 || !Number.isSafeInteger(result.exitCode) || result.exitCode < 0) parseError('checkName or exitCode is invalid');
  const streams = ['stdout', 'stderr'].map((name) => {
    const value = result[name];
    if (typeof value !== 'string' && !(value instanceof Uint8Array)) parseError(`${name} must contain captured output bytes or text`);
    const bytes = Buffer.from(value);
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { parseError(`${name} is not valid UTF-8`); }
    return { hash: createHash('sha256').update(bytes).digest('hex'), text };
  });
  const issues = [];
  let failureCount;
  let successCount = 0;
  for (const stream of streams) {
    for (const rawLine of stream.text.split(/\r?\n/u)) {
      if (rawLine === '') continue;
      const summary = /^FAIL: ([0-9]+)건$/u.exec(rawLine);
      if (summary) {
        if (failureCount !== undefined) parseError('duplicate failure summary');
        failureCount = Number(summary[1]);
        if (!Number.isSafeInteger(failureCount)) parseError('invalid failure count');
        continue;
      }
      if (/^PASS: .+$/u.test(rawLine)) { successCount += 1; continue; }
      let category;
      let personId = null;
      const citation = /^✗ (K[0-9]{3,}) .+: (?:역할 표시 )?인용 불일치(?: .+)?$/u.exec(rawLine);
      if (citation) { category = 'citation'; personId = citation[1]; }
      else if (rawLine === '✗ lore/name-pools/gurps-cast.json가 카드에서 다시 파생한 결과와 다르다(node scripts/gurps-cast.mjs --write)') category = 'derived';
      else parseError(`unrecognized official output: ${rawLine}`);
      issues.push({ check_name: result.checkName, ordinal: issues.length, category, person_id: personId, raw_line: rawLine });
    }
  }
  if (result.exitCode === 0) {
    if (issues.length !== 0 || failureCount !== undefined || successCount !== 1) parseError('successful exit must have one PASS and no issues');
  } else if (successCount !== 0 || failureCount !== issues.length || issues.length === 0) parseError('failed exit, FAIL summary and parsed issue count disagree');
  const run = Object.freeze({ check_name: result.checkName, exit_code: result.exitCode, stdout_sha256: streams[0].hash, stderr_sha256: streams[1].hash, issue_count: issues.length });
  issues.forEach(Object.freeze);
  return Object.freeze({ run, issues: Object.freeze(issues) });
}
