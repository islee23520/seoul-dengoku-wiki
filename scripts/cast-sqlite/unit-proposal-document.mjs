import { createHash } from 'node:crypto';


const ROOT_FIELDS = ['schema', 'status', 'note', 'design_source', 'squad_structure', 'unit_types', 'settlement_composition', 'hero_integration'];
const DESIGN_FIELDS = ['mechanics', 'resolution', 'owner_decisions', 'rules_owner', 'legacy_fields'];
const SQUAD_FIELDS = ['commander', 'members', 'max_squads_per_settlement', 'recruitment'];
const RECRUITMENT_FIELDS = ['sources', 'npc_matching'];
const UNIT_FIELDS = ['id', 'name', 'name_en', 'category', 'description', 'max_size', 'base_size', 'member_match', 'commander_match', 'equipment', 'gurps_resolution', 'battle_role'];
const MATCH_FIELDS = ['martial_any', 'occupation_any', 'attributes_min'];
const COMMANDER_FIELDS = ['skill', 'attributes_min'];
const ATTRIBUTE_FIELDS = ['ST', 'DX', 'IQ', 'HT'];
const GURPS_FIELDS = ['attack', 'defense', 'damage', 'dr_target', 'special', 'range', 'ammo', 'movement', 'stealth', 'gurps_skill', 'effect', 'loyalty'];
const SETTLEMENT_FIELDS = ['principle', 'auto_matching', 'scale_by_settlement', 'gurps_anchor'];
const AUTO_FIELDS = ['description', 'example'];
const SCALE_FIELDS = ['대거점', '중거점', '소거점', '초소'];
const ANCHOR_FIELDS = ['squad_cohesion', 'morale', 'fatigue'];
const HERO_FIELDS = ['note', 'classes', 'hero_role'];
const STRING_LISTS = ['martial_any', 'occupation_any', 'equipment'];
const UNIT_COUNT = 10;
const OWNER_DECISION_COUNT = 1;
const RECRUITMENT_SOURCE_COUNT = 3;
const HERO_CLASS_COUNT = 6;
const ATTRIBUTE_COUNT = UNIT_COUNT * 2;

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error('E_UNIT_PROPOSAL_DOCUMENT: ' + detail), { code: 'E_UNIT_PROPOSAL_DOCUMENT' }); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const text = value => typeof value === 'string';
const integer = value => Number.isSafeInteger(value);

function exactKeys(value, fields, path) {
  if (!object(value)) fail('object: ' + path);
  const keys = Object.keys(value);
  for (const key of keys) if (!fields.includes(key)) fail('unknown field: ' + path + '/' + key);
  for (const key of fields) if (!Object.hasOwn(value, key)) fail('missing field: ' + path + '/' + key);
}

function stringList(value, path) {
  if (!Array.isArray(value)) fail('array: ' + path);
  value.forEach((item, index) => { if (!text(item)) fail('type: ' + path + '/' + index); });
}

function attributes(value, path) {
  if (!object(value)) fail('object: ' + path);
  const keys = Object.keys(value);
  if (!keys.length) fail('empty attributes: ' + path);
  for (const key of keys) {
    if (!ATTRIBUTE_FIELDS.includes(key)) fail('unknown field: ' + path + '/' + key);
    if (!integer(value[key])) fail('type: ' + path + '/' + key);
  }
}

function validate(document) {
  exactKeys(document, ROOT_FIELDS, '');
  for (const key of ['schema', 'status', 'note']) if (!text(document[key])) fail('type: /' + key);
  exactKeys(document.design_source, DESIGN_FIELDS, '/design_source');
  for (const key of ['mechanics', 'resolution', 'rules_owner', 'legacy_fields']) {
    if (!text(document.design_source[key])) fail('type: /design_source/' + key);
  }
  stringList(document.design_source.owner_decisions, '/design_source/owner_decisions');
  exactKeys(document.squad_structure, SQUAD_FIELDS, '/squad_structure');
  for (const key of ['commander', 'members', 'max_squads_per_settlement']) {
    if (!text(document.squad_structure[key])) fail('type: /squad_structure/' + key);
  }
  exactKeys(document.squad_structure.recruitment, RECRUITMENT_FIELDS, '/squad_structure/recruitment');
  stringList(document.squad_structure.recruitment.sources, '/squad_structure/recruitment/sources');
  if (!text(document.squad_structure.recruitment.npc_matching)) fail('type: /squad_structure/recruitment/npc_matching');
  if (!Array.isArray(document.unit_types)) fail('array: /unit_types');
  document.unit_types.forEach((unit, index) => {
    const path = '/unit_types/' + index;
    exactKeys(unit, UNIT_FIELDS, path);
    for (const key of ['id', 'name', 'name_en', 'category', 'description', 'battle_role']) {
      if (!text(unit[key])) fail('type: ' + path + '/' + key);
    }
    for (const key of ['max_size', 'base_size']) if (!integer(unit[key])) fail('type: ' + path + '/' + key);
    exactKeys(unit.member_match, MATCH_FIELDS, path + '/member_match');
    stringList(unit.member_match.martial_any, path + '/member_match/martial_any');
    stringList(unit.member_match.occupation_any, path + '/member_match/occupation_any');
    attributes(unit.member_match.attributes_min, path + '/member_match/attributes_min');
    exactKeys(unit.commander_match, COMMANDER_FIELDS, path + '/commander_match');
    if (!text(unit.commander_match.skill)) fail('type: ' + path + '/commander_match/skill');
    attributes(unit.commander_match.attributes_min, path + '/commander_match/attributes_min');
    stringList(unit.equipment, path + '/equipment');
    if (!object(unit.gurps_resolution)) fail('object: ' + path + '/gurps_resolution');
    const gurpsKeys = Object.keys(unit.gurps_resolution);
    if (!gurpsKeys.length) fail('empty gurps: ' + path + '/gurps_resolution');
    for (const key of gurpsKeys) {
      if (!GURPS_FIELDS.includes(key)) fail('unknown field: ' + path + '/gurps_resolution/' + key);
      if (!text(unit.gurps_resolution[key])) fail('type: ' + path + '/gurps_resolution/' + key);
    }
  });
  exactKeys(document.settlement_composition, SETTLEMENT_FIELDS, '/settlement_composition');
  if (!text(document.settlement_composition.principle)) fail('type: /settlement_composition/principle');
  exactKeys(document.settlement_composition.auto_matching, AUTO_FIELDS, '/settlement_composition/auto_matching');
  for (const key of AUTO_FIELDS) if (!text(document.settlement_composition.auto_matching[key])) fail('type: /settlement_composition/auto_matching/' + key);
  exactKeys(document.settlement_composition.scale_by_settlement, SCALE_FIELDS, '/settlement_composition/scale_by_settlement');
  for (const key of SCALE_FIELDS) if (!text(document.settlement_composition.scale_by_settlement[key])) fail('type: /settlement_composition/scale_by_settlement/' + key);
  exactKeys(document.settlement_composition.gurps_anchor, ANCHOR_FIELDS, '/settlement_composition/gurps_anchor');
  for (const key of ANCHOR_FIELDS) if (!text(document.settlement_composition.gurps_anchor[key])) fail('type: /settlement_composition/gurps_anchor/' + key);
  exactKeys(document.hero_integration, HERO_FIELDS, '/hero_integration');
  if (!text(document.hero_integration.note) || !text(document.hero_integration.hero_role)) fail('type: /hero_integration');
  stringList(document.hero_integration.classes, '/hero_integration/classes');
}

function orderedRows(rows, label) {
  if (rows.some((row, index) => row.ordinal !== index)) fail(label + ': coverage');
  return rows;
}

function attributeObject(row, path) {
  if (!row) fail('attribute coverage: ' + path);
  const flags = { ST: row.st_present, DX: row.dx_present, IQ: row.iq_present, HT: row.ht_present };
  const values = { ST: row.st, DX: row.dx, IQ: row.iq, HT: row.ht };
  if (ATTRIBUTE_FIELDS.some(key => ![0, 1].includes(flags[key]) || (flags[key] === 0 && values[key] !== null))) fail('attribute presence: ' + path);
  return Object.fromEntries(ATTRIBUTE_FIELDS.filter(key => flags[key] === 1).map(key => [key, values[key]]));
}

function gurpsObject(row, path) {
  if (!row) fail('gurps coverage: ' + path);
  const present = Object.fromEntries(GURPS_FIELDS.map(key => [key, row[key + '_present']]));
  if (GURPS_FIELDS.some(key => ![0, 1].includes(present[key]) || (present[key] === 0 && row[key] !== null))) fail('gurps presence: ' + path);
  return Object.fromEntries(GURPS_FIELDS.filter(key => present[key] === 1).map(key => [key, row[key]]));
}

/** SELECT-only typed reader. No source, archive, filesystem, or JSON parsing. */
export function readUnitProposalDocument(db) {
  try {
    const select = sql => {
      if (!/^SELECT\b/u.test(sql)) fail('runtime statement');
      return db.prepare(sql);
    };
    const receipts = select('SELECT singleton, source_sha256, document_sha256, actor, reason FROM unit_proposal_document_import').all();
    const receipt = receipts[0];
    if (receipts.length !== 1 || receipt.singleton !== 1
     
      || typeof receipt.actor !== 'string' || !receipt.actor.trim()
      || typeof receipt.reason !== 'string' || !receipt.reason.trim()) fail('source pin/receipt');

    const keys = new Map();
    for (const row of select('SELECT object_path, ordinal, key FROM unit_proposal_document_key ORDER BY object_path, ordinal').all()) {
      if (!keys.has(row.object_path)) keys.set(row.object_path, []);
      const list = keys.get(row.object_path);
      if (row.ordinal !== list.length || list.includes(row.key)) fail('key order');
      list.push(row.key);
    }

    const documents = select('SELECT singleton, schema, status, note FROM unit_proposal_document').all();
    const header = documents[0];
    if (documents.length !== 1 || header.singleton !== 1) fail('document singleton');
    const designs = select('SELECT singleton, mechanics, resolution, rules_owner, legacy_fields FROM unit_proposal_document_design').all();
    const design = designs[0];
    if (designs.length !== 1 || design.singleton !== 1) fail('design singleton');
    const decisions = orderedRows(select('SELECT ordinal, decision FROM unit_proposal_document_owner_decision ORDER BY ordinal').all(), 'unit_proposal_document_owner_decision');
    if (decisions.length !== OWNER_DECISION_COUNT) fail('unit_proposal_document_owner_decision: coverage');
    const squads = select('SELECT singleton, commander, members, max_squads_per_settlement, npc_matching FROM unit_proposal_document_squad').all();
    const squad = squads[0];
    if (squads.length !== 1 || squad.singleton !== 1) fail('squad singleton');
    const sources = orderedRows(select('SELECT ordinal, source FROM unit_proposal_document_recruitment_source ORDER BY ordinal').all(), 'unit_proposal_document_recruitment_source');
    if (sources.length !== RECRUITMENT_SOURCE_COUNT) fail('unit_proposal_document_recruitment_source: coverage');
    const units = orderedRows(select('SELECT ordinal, id, name, name_en, category, description, max_size, base_size, commander_skill, battle_role FROM unit_proposal_document_unit ORDER BY ordinal').all(), 'unit_proposal_document_unit');
    if (units.length !== UNIT_COUNT) fail('unit_proposal_document_unit: coverage');
    const strings = select('SELECT unit_ordinal, list_kind, ordinal, value FROM unit_proposal_document_unit_string ORDER BY unit_ordinal, list_kind, ordinal').all();
    const attributesRows = select('SELECT unit_ordinal, owner_kind, st_present, dx_present, iq_present, ht_present, st, dx, iq, ht FROM unit_proposal_document_attribute ORDER BY unit_ordinal, owner_kind').all();
    if (attributesRows.length !== ATTRIBUTE_COUNT) fail('unit_proposal_document_attribute: coverage');
    const gurpsRows = select('SELECT unit_ordinal, attack_present, defense_present, damage_present, dr_target_present, special_present, range_present, ammo_present, movement_present, stealth_present, gurps_skill_present, effect_present, loyalty_present, attack, defense, damage, dr_target, special, range, ammo, movement, stealth, gurps_skill, effect, loyalty FROM unit_proposal_document_gurps ORDER BY unit_ordinal').all();
    if (gurpsRows.length !== UNIT_COUNT) fail('unit_proposal_document_gurps: coverage');
    const settlements = select('SELECT singleton, principle, auto_description, auto_example, scale_major, scale_medium, scale_minor, scale_outpost, squad_cohesion, morale, fatigue FROM unit_proposal_document_settlement').all();
    const settlement = settlements[0];
    if (settlements.length !== 1 || settlement.singleton !== 1) fail('settlement singleton');
    const heroes = select('SELECT singleton, note, hero_role FROM unit_proposal_document_hero').all();
    const hero = heroes[0];
    if (heroes.length !== 1 || hero.singleton !== 1) fail('hero singleton');
    const classes = orderedRows(select('SELECT ordinal, class_name FROM unit_proposal_document_hero_class ORDER BY ordinal').all(), 'unit_proposal_document_hero_class');
    if (classes.length !== HERO_CLASS_COUNT) fail('unit_proposal_document_hero_class: coverage');

    const stringsFor = (unitOrdinal, kind) => {
      const rows = strings.filter(row => row.unit_ordinal === unitOrdinal && row.list_kind === kind);
      if (rows.some((row, index) => row.ordinal !== index)) fail('unit string coverage: ' + unitOrdinal + '/' + kind);
      return rows.map(row => row.value);
    };
    const consumedStrings = new Set();
    const result = {
      schema: header.schema,
      status: header.status,
      note: header.note,
      design_source: {
        mechanics: design.mechanics,
        resolution: design.resolution,
        owner_decisions: decisions.map(row => row.decision),
        rules_owner: design.rules_owner,
        legacy_fields: design.legacy_fields,
      },
      squad_structure: {
        commander: squad.commander,
        members: squad.members,
        max_squads_per_settlement: squad.max_squads_per_settlement,
        recruitment: {
          sources: sources.map(row => row.source),
          npc_matching: squad.npc_matching,
        },
      },
      unit_types: units.map(unit => {
        const member = attributesRows.find(row => row.unit_ordinal === unit.ordinal && row.owner_kind === 'member');
        const commander = attributesRows.find(row => row.unit_ordinal === unit.ordinal && row.owner_kind === 'commander');
        const gurps = gurpsRows.find(row => row.unit_ordinal === unit.ordinal);
        for (const kind of STRING_LISTS) consumedStrings.add(unit.ordinal + ':' + kind);
        return {
          id: unit.id,
          name: unit.name,
          name_en: unit.name_en,
          category: unit.category,
          description: unit.description,
          max_size: unit.max_size,
          base_size: unit.base_size,
          member_match: {
            martial_any: stringsFor(unit.ordinal, 'martial_any'),
            occupation_any: stringsFor(unit.ordinal, 'occupation_any'),
            attributes_min: attributeObject(member, '/unit_types/' + unit.ordinal + '/member_match/attributes_min'),
          },
          commander_match: {
            skill: unit.commander_skill,
            attributes_min: attributeObject(commander, '/unit_types/' + unit.ordinal + '/commander_match/attributes_min'),
          },
          equipment: stringsFor(unit.ordinal, 'equipment'),
          gurps_resolution: gurpsObject(gurps, '/unit_types/' + unit.ordinal + '/gurps_resolution'),
          battle_role: unit.battle_role,
        };
      }),
      settlement_composition: {
        principle: settlement.principle,
        auto_matching: { description: settlement.auto_description, example: settlement.auto_example },
        scale_by_settlement: {
          '대거점': settlement.scale_major,
          '중거점': settlement.scale_medium,
          '소거점': settlement.scale_minor,
          '초소': settlement.scale_outpost,
        },
        gurps_anchor: {
          squad_cohesion: settlement.squad_cohesion,
          morale: settlement.morale,
          fatigue: settlement.fatigue,
        },
      },
      hero_integration: {
        note: hero.note,
        classes: classes.map(row => row.class_name),
        hero_role: hero.hero_role,
      },
    };
    const strayString = strings.some(row => !consumedStrings.has(row.unit_ordinal + ':' + row.list_kind) || !STRING_LISTS.includes(row.list_kind) || !units.some(unit => unit.ordinal === row.unit_ordinal));
    const strayAttribute = attributesRows.some(row => !['member', 'commander'].includes(row.owner_kind) || !units.some(unit => unit.ordinal === row.unit_ordinal));
    const strayGurps = gurpsRows.some(row => !units.some(unit => unit.ordinal === row.unit_ordinal));
    if (strayString || strayAttribute || strayGurps) fail('unconsumed typed rows');
    const order = (value, path) => {
      if (value === null || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map((item, index) => order(item, path + '/' + index));
      const list = keys.get(path);
      keys.delete(path);
      if (!list || list.length !== Object.keys(value).length) fail('object coverage: ' + path);
      return Object.fromEntries(list.map(key => {
        if (!Object.hasOwn(value, key)) fail('unknown key: ' + path + '/' + key);
        return [key, order(value[key], path + '/' + key)];
      }));
    };
    const document = order(result, '');
    if (keys.size) fail('unconsumed key rows');
    validate(document);
    return document;
  } catch (error) {
    if (error.code === 'E_UNIT_PROPOSAL_DOCUMENT') throw error;
    fail(error.message);
  }
}

function attributeInsert(unitOrdinal, ownerKind, value) {
  const flags = ATTRIBUTE_FIELDS.map(key => Number(Object.hasOwn(value, key)));
  const stored = ATTRIBUTE_FIELDS.map(key => Object.hasOwn(value, key) ? value[key] : null);
  return [unitOrdinal, ownerKind, ...flags, ...stored];
}

function gurpsInsert(unitOrdinal, value) {
  const flags = GURPS_FIELDS.map(key => Number(Object.hasOwn(value, key)));
  const stored = GURPS_FIELDS.map(key => Object.hasOwn(value, key) ? value[key] : null);
  return [unitOrdinal, ...flags, ...stored];
}

/** One-shot explicit import of the pinned bytes. No existing tables are written. */
export function initializeUnitProposalDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (!(sourceBytes instanceof Uint8Array)) fail('source bytes');
  let document;
  try { document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes)); }
  catch (error) { fail('source syntax: ' + error.message); }
  validate(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  if (![actor, reason].every(value => typeof value === 'string' && value.trim())) fail('actor/reason');
  if (typeof schemaSql !== 'string' || !schemaSql.trim() || db.isTransaction) fail('explicit SQL/transaction');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    const key = db.prepare('INSERT INTO unit_proposal_document_key (object_path, ordinal, key) VALUES (?, ?, ?)');
    const walk = (value, path) => {
      if (value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((item, index) => walk(item, path + '/' + index)); return; }
      Object.entries(value).forEach(([name, child], ordinal) => { key.run(path, ordinal, name); walk(child, path + '/' + name); });
    };
    walk(document, '');
    db.prepare('INSERT INTO unit_proposal_document (singleton, schema, status, note) VALUES (1, ?, ?, ?)')
      .run(document.schema, document.status, document.note);
    db.prepare('INSERT INTO unit_proposal_document_design (singleton, mechanics, resolution, rules_owner, legacy_fields) VALUES (1, ?, ?, ?, ?)')
      .run(document.design_source.mechanics, document.design_source.resolution, document.design_source.rules_owner, document.design_source.legacy_fields);
    const insertDecision = db.prepare('INSERT INTO unit_proposal_document_owner_decision (ordinal, decision) VALUES (?, ?)');
    document.design_source.owner_decisions.forEach((decision, ordinal) => insertDecision.run(ordinal, decision));
    db.prepare('INSERT INTO unit_proposal_document_squad (singleton, commander, members, max_squads_per_settlement, npc_matching) VALUES (1, ?, ?, ?, ?)')
      .run(document.squad_structure.commander, document.squad_structure.members, document.squad_structure.max_squads_per_settlement, document.squad_structure.recruitment.npc_matching);
    const insertSource = db.prepare('INSERT INTO unit_proposal_document_recruitment_source (ordinal, source) VALUES (?, ?)');
    document.squad_structure.recruitment.sources.forEach((source, ordinal) => insertSource.run(ordinal, source));
    const insertUnit = db.prepare('INSERT INTO unit_proposal_document_unit (ordinal, id, name, name_en, category, description, max_size, base_size, commander_skill, battle_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertString = db.prepare('INSERT INTO unit_proposal_document_unit_string (unit_ordinal, list_kind, ordinal, value) VALUES (?, ?, ?, ?)');
    const insertAttribute = db.prepare('INSERT INTO unit_proposal_document_attribute (unit_ordinal, owner_kind, st_present, dx_present, iq_present, ht_present, st, dx, iq, ht) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertGurps = db.prepare('INSERT INTO unit_proposal_document_gurps (unit_ordinal, attack_present, defense_present, damage_present, dr_target_present, special_present, range_present, ammo_present, movement_present, stealth_present, gurps_skill_present, effect_present, loyalty_present, attack, defense, damage, dr_target, special, range, ammo, movement, stealth, gurps_skill, effect, loyalty) VALUES (' + Array(25).fill('?').join(', ') + ')');
    document.unit_types.forEach((unit, ordinal) => {
      insertUnit.run(ordinal, unit.id, unit.name, unit.name_en, unit.category, unit.description, unit.max_size, unit.base_size, unit.commander_match.skill, unit.battle_role);
      for (const kind of ['martial_any', 'occupation_any']) unit.member_match[kind].forEach((value, index) => insertString.run(ordinal, kind, index, value));
      unit.equipment.forEach((value, index) => insertString.run(ordinal, 'equipment', index, value));
      insertAttribute.run(...attributeInsert(ordinal, 'member', unit.member_match.attributes_min));
      insertAttribute.run(...attributeInsert(ordinal, 'commander', unit.commander_match.attributes_min));
      insertGurps.run(...gurpsInsert(ordinal, unit.gurps_resolution));
    });
    const scale = document.settlement_composition.scale_by_settlement;
    const anchor = document.settlement_composition.gurps_anchor;
    db.prepare('INSERT INTO unit_proposal_document_settlement (singleton, principle, auto_description, auto_example, scale_major, scale_medium, scale_minor, scale_outpost, squad_cohesion, morale, fatigue) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(document.settlement_composition.principle, document.settlement_composition.auto_matching.description, document.settlement_composition.auto_matching.example, scale['대거점'], scale['중거점'], scale['소거점'], scale['초소'], anchor.squad_cohesion, anchor.morale, anchor.fatigue);
    db.prepare('INSERT INTO unit_proposal_document_hero (singleton, note, hero_role) VALUES (1, ?, ?)')
      .run(document.hero_integration.note, document.hero_integration.hero_role);
    const insertClass = db.prepare('INSERT INTO unit_proposal_document_hero_class (ordinal, class_name) VALUES (?, ?)');
    document.hero_integration.classes.forEach((name, ordinal) => insertClass.run(ordinal, name));
    db.prepare('INSERT INTO unit_proposal_document_import (singleton, source_sha256, document_sha256, actor, reason) VALUES (1, ?, ?, ?, ?)')
      .run(sourceHash, documentHash, actor, reason);
    const actual = readUnitProposalDocument(db);
    if (JSON.stringify(actual) !== JSON.stringify(document)) fail('import parity');
    db.exec('COMMIT');
    return actual;
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw error;
  }
}
