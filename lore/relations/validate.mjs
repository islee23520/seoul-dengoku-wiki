import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readCanonicalDocument } from "../../scripts/cast-sqlite/canonical-document.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const source = (file, options) => readCanonicalDocument(`lore/${file}`, options);
const ko = (cell) => cell.ko;

export function resolveRelations(relationSource, people) {
  const idsByName = new Map();
  const personIds = new Set(people.map((person) => person.id));
  for (const person of people) idsByName.set(person.name, [...(idsByName.get(person.name) || []), person.id]);
  const errors = [];
  const resolve = (value, label) => {
    if (personIds.has(value)) return value;
    const matches = idsByName.get(value) || [];
    if (matches.length > 1) errors.push(`${label}: ambiguous person name ${value} (${matches.join(", ")}); use a person ID`);
    return matches.length === 1 ? matches[0] : undefined;
  };
  const relations = relationSource.content.filter((block) => block.kind === "table").flatMap((block) =>
    block.rows.map((row, index) => {
      const id = `R:${block.anchor}:${index + 1}`;
      return {
        id, fromPersonId: resolve(ko(row[0]), `${id}.fromPersonId`),
        toPersonId: resolve(ko(row[2]), `${id}.toPersonId`),
        type: ko(row[1]), sourceAnchor: block.anchor, sourceRow: index,
      };
    }));
  return { relations, errors };
}

export function resolveVassals(stateSource, states) {
  const stateByName = new Map(states.map((state) => [state.name, state.id]));
  // The approved Q2 ledger names operating parties, not present-day owners.
  const historicalWork = new Map([
    [1, ["수문국", "2097년 물길", "S01"]],
    [7, ["동방사", "2098년 경비", "S05"]],
    [10, ["태욱그룹", "2101년 공장", "S03"]],
  ]);
  const errors = [];
  const rows = stateSource.content.find((block) => block.kind === "table" && block.anchor === "table-2").rows;
  const vassals = rows.map((row, index) => {
    const id = `V${String(index + 1).padStart(2, "0")}`;
    const relation = ko(row[1]);
    const vassal = { id, name: ko(row[0]), parentStateId: null, sourceAnchor: "table-2", sourceRow: index };
    if (stateByName.has(relation) || relation === "종교 연합") {
      vassal.parentStateId = stateByName.get(relation) ?? "union:religious";
      vassal.relationKind = "current-vassal";
    } else {
      const historical = /^(.+?)의 (2097년 물길|2098년 경비|2101년 공장) 업무; 종교 연합은 후대 장부 분류$/.exec(relation);
      const internal = /^(.+?) 내부 지점$/.exec(relation);
      if (historical && historicalWork.get(index)?.[0] === historical[1] &&
        historicalWork.get(index)?.[1] === historical[2] && historicalWork.get(index)?.[2] === stateByName.get(historical[1])) {
        vassal.relationKind = "historical-work-later-ledger";
        vassal.operatingStateId = stateByName.get(historical[1]);
        vassal.laterLedgerClassificationId = "union:religious";
      } else if (index === 12 && internal && internal[1] === "여의도출자연합회" && stateByName.get(internal[1]) === "S09") {
        vassal.relationKind = "internal-branch";
        vassal.operatingStateId = "S09";
      } else {
        errors.push(`${id}: unrecognized present relation or original operating party ${relation}`);
      }
    }
    return vassal;
  });
  return { vassals, errors };
}
export function loadDataset(options = {}) {
  const config = readCanonicalDocument('lore/relations/relations.json', options);
  const stateSource = source("factions/Sixteen-States.json", options);
  const relationSource = source("characters/Cast-Relations.json", options);
  const castIndex = source("characters/Cast-Index.json", options);
  const registry = source("name-pools/person-id-registry.json", options);
  const values = source("name-pools/values-cast.json", options);
  const chronicle = source("chronology/Century-Annals.json", options);
  const table = (doc, anchor) => doc.content.find((block) => block.kind === "table" && block.anchor === anchor);
  const states = table(stateSource, "table").rows.map((row) => ({
    id: ko(row[0]), name: ko(row[1]).split("(")[0],
    tier: ko(row[3]).split(",")[0], sourceAnchor: "table",
  }));
  const { vassals, errors: vassalErrors } = resolveVassals(stateSource, states);
  const people = [...registry.persons, ...config.provisionalPeople];
  const { relations, errors: relationErrors } = resolveRelations(relationSource, people);
  // Only paragraphs that begin with an explicit year are independently dated.
  // Undated paragraphs are deliberately not assigned a date from their chapter.
  // An archived event keeps its identity when its paragraph survives with the
  // same anchor, even if an approved revision no longer opens with the date.
  const archivedEvents = options.archivedEvents ?? [];
  if (!Array.isArray(archivedEvents)) throw new TypeError("eventIds must be an array");
  const events = chronicle.content.filter((block) => block.kind === "paragraph")
    .flatMap((block) => {
      const match = /^(\d{4})년(?: (\d{1,2})월(?: (\d{1,2})일)?)?/.exec(block.text.ko);
      if (!match) return archivedEvents.includes(`E:${block.anchor}`) ? [{ id: `E:${block.anchor}`, date: null, sourceAnchor: block.anchor }] : [];
      const date = [match[1], match[2], match[3]].filter(Boolean).map((part, index) => index ? part.padStart(2, "0") : part).join("-");
      return [{ id: `E:${block.anchor}`, date, sourceAnchor: block.anchor }];
    });

  return {
    config, states, vassals, people, organizations: config.organizations,
    relations, relationErrors, vassalErrors, events, eventLinks: config.eventLinks,
    sources: { stateSource, relationSource, castIndex, registry, values, chronicle },
  };
}
export function validate(dataset) {
  const errors = [];
  const { config, states, vassals, people, organizations, relations, events, eventLinks, sources } = dataset;
  errors.push(...(dataset.relationErrors || []));
  errors.push(...(dataset.vassalErrors || []));
  const unique = (rows, label) => {
    const ids = new Set();
    for (const row of rows) {
      if (!row.id || ids.has(row.id)) errors.push(`${label}: duplicate or empty ID ${row.id}`);
      ids.add(row.id);
    }
    return ids;
  };
  const stateIds = unique(states, "states");
  const polityIds = new Set([...stateIds, "union:religious", ...source("relations/personal-holdings.json").polities.map(polity => polity.id)]);
  const personIds = unique(people, "people");
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const stateByPersonId = new Map(sources.registry.persons.map((person, index) => [person.id, sources.values.people[index]?.state]));
  const orgIds = unique(organizations, "organizations");
  const eventIds = unique(events, "events");
  for (const [label, rows] of [["vassals", vassals], ["relations", relations], ["eventLinks", eventLinks.map((r) => ({ ...r, id: `${r.eventId}:${r.personId}:${r.organizationId || ""}` }))]]) unique(rows, label);
  const fk = (id, ids, label) => { if (!ids.has(id)) errors.push(`${label}: missing foreign key ${id}`); };
  const anchors = (doc) => new Set(doc.content.map((block) => block.anchor));
  const stateAnchors = anchors(sources.stateSource);
  const relationAnchors = anchors(sources.relationSource);
  const eventAnchors = anchors(sources.chronicle);
  if (states.length !== 16 || stateIds.size !== 16 || states[0]?.name !== "대한민국정부" ||
    !Array.from({ length: 16 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`).every((id) => stateIds.has(id))) errors.push("states: expected S01–S16, first 대한민국정부");
  for (const [tier, count] of [["강국", 6], ["약국", 4], ["소국", 6]]) {
    if (states.filter((state) => state.tier === tier).length !== count) errors.push(`states: ${tier} expected ${count}`);
  }
  for (const state of states) fk(state.sourceAnchor, stateAnchors, "state anchor");
  if (vassals.length !== 13) errors.push("vassals: expected 13");
  const expectedVassals = resolveVassals(sources.stateSource, states);
  errors.push(...expectedVassals.errors);
  for (const row of vassals) {
    const sourceRow = sources.stateSource.content.find((block) => block.anchor === row.sourceAnchor)?.rows[row.sourceRow];
    if (!sourceRow || row.name !== ko(sourceRow[0]) || row.id !== `V${String(row.sourceRow + 1).padStart(2, "0")}`)
      errors.push(`${row.id}: source vassal row mismatch`);
    const expected = expectedVassals.vassals[row.sourceRow];
    if (!expected || ["id", "name", "parentStateId", "relationKind", "operatingStateId", "laterLedgerClassificationId", "sourceAnchor", "sourceRow"]
      .some((field) => row[field] !== expected[field])) errors.push(`${row.id}: source relation mismatch`);
    if (row.relationKind === "current-vassal") fk(row.parentStateId, polityIds, row.id);
    else if (row.parentStateId !== null || !["historical-work-later-ledger", "internal-branch"].includes(row.relationKind))
      errors.push(`${row.id}: invalid current relation classification`);
    if (row.operatingStateId !== undefined) fk(row.operatingStateId, stateIds, `${row.id}.operatingStateId`);
    if (row.laterLedgerClassificationId !== undefined) fk(row.laterLedgerClassificationId, polityIds, `${row.id}.laterLedgerClassificationId`);
    fk(row.sourceAnchor, stateAnchors, row.id);
  }
  if (sources.registry.totalPeople !== 1022 || sources.registry.persons.length !== 1022 ||
    sources.registry.persons.some((p, i) => p.id !== `K${String(i + 1).padStart(3, "0")}`) ||
    people.length !== sources.registry.persons.length + config.provisionalPeople.length) errors.push("people: issued K001–K1022 mismatch");
  for (const person of config.provisionalPeople) {
    if (!/^P\d{3}$/.test(person.id) || !(sources.relationSource.content.find((b) => b.anchor === person.sourceAnchor)?.rows || [])
      .some((r) => ko(r[0]) === person.name || ko(r[2]) === person.name)) errors.push(`provisional identity: missing source ${person.id}`);
  }
  const knownTypes = new Set(["친족", "양자", "사제", "지휘", "계약", "빚", "맹세", "경쟁", "원한", "보호체류", "배신"]);
  const unaffiliatedNames = new Set(sources.castIndex.content
    .find((block) => block.anchor === "무소속-인물-table2").rows.map((row) => ko(row[0])));
  for (const row of relations) {
    const sourceRow = sources.relationSource.content.find((block) => block.anchor === row.sourceAnchor).rows[row.sourceRow];
    if (row.fromPersonId === undefined && unaffiliatedNames.has(ko(sourceRow[0]))) { /* Phase 1: named, not yet issued an ID. */ }
    else fk(row.fromPersonId, personIds, `${row.id}.fromPersonId`);
    if (row.toPersonId === undefined && unaffiliatedNames.has(ko(sourceRow[2]))) { /* Phase 1: named, not yet issued an ID. */ }
    else fk(row.toPersonId, personIds, `${row.id}.toPersonId`);
    fk(row.sourceAnchor, relationAnchors, row.id);
    if (!knownTypes.has(row.type)) errors.push(`${row.id}: unknown relation type ${row.type}`);
  }
  const { courts = [], directRetainers = [], courtContract } = config;
  const courtIds = unique(courts, "courts");
  if (courtContract?.schema !== "opening-direct-retainers.v1" || courtContract.effectiveYear !== 2126 ||
    !courtContract.approvalRef || courtContract.sourcePath !== "lore/characters/Cast-Relations.json" ||
    !relationAnchors.has(courtContract.sourceAnchor)) errors.push("courts: missing approved source metadata");
  const courtById = new Map(courts.map((court) => [court.id, court]));
  for (const court of courts) {
    fk(court.ownerPersonId, personIds, `${court.id}.ownerPersonId`);
    fk(court.stateId, polityIds, `${court.id}.stateId`);
    if (court.id !== `court:${court.ownerPersonId}`) errors.push(`${court.id}: invalid owner-linked court ID`);
    if (stateByPersonId.get(court.ownerPersonId) !== court.stateId) errors.push(`${court.id}: foreign nation owner`);
  }
  const liegeByPerson = new Map();
  const sourceRows = sources.relationSource.content.find((block) => block.anchor === courtContract?.sourceAnchor)?.rows || [];
  for (const row of directRetainers) {
    fk(row.personId, personIds, "direct retainer");
    fk(row.liegePersonId, personIds, `${row.personId}.liegePersonId`);
    fk(row.courtId, courtIds, `${row.personId}.courtId`);
    if (liegeByPerson.has(row.personId)) errors.push(`${row.personId}: duplicate direct liege`);
    liegeByPerson.set(row.personId, row.liegePersonId);
    if (row.personId === row.liegePersonId) errors.push(`${row.personId}: self direct liege`);
    if (courtById.get(row.courtId)?.ownerPersonId !== row.liegePersonId) errors.push(`${row.personId}: orphan court`);
    const person = peopleById.get(row.personId);
    const liege = peopleById.get(row.liegePersonId);
    if (!person || !liege || stateByPersonId.get(row.personId) !== stateByPersonId.get(row.liegePersonId) ||
      stateByPersonId.get(row.personId) !== courtById.get(row.courtId)?.stateId)
      errors.push(`${row.personId}: foreign nation direct liege`);
    const sourceRow = sourceRows[row.sourceRow];
    if (!Number.isInteger(row.sourceRow) || !sourceRow || sourceRow[1]?.ko !== "지휘" ||
      sourceRow[0]?.ko !== person?.name || sourceRow[2]?.ko !== liege?.name || !sourceRow[3]?.ko)
      errors.push(`${row.personId}: source command row mismatch`);
  }
  const { ownerLieges } = config;
  const ownerTermByKind = new Map([["direct-liege", "직속 주군"], ["direct-vassal", "직속 가신"]]);
  if (ownerLieges?.schema !== "owner-liege-edges.v1" || ownerLieges.effectiveYear !== 2126 ||
    !Array.isArray(ownerLieges.edges) || ownerLieges.edges.length === 0)
    errors.push("ownerLieges: missing structural metadata (schema/effectiveYear/edges)");
  for (const row of ownerLieges?.edges || []) {
    fk(row.personId, personIds, "owner liege person");
    fk(row.liegePersonId, personIds, `${row.personId}.ownerLiegePersonId`);
    if (row.personId === row.liegePersonId) errors.push(`${row.personId}: self owner liege`);
    if (!ownerTermByKind.has(row.relationKind))
      errors.push(`${row.personId}: unknown owner relation kind ${row.relationKind}`);
    if (!row.ownerTerm || ownerTermByKind.get(row.relationKind) !== row.ownerTerm)
      errors.push(`${row.personId}: owner term mismatch for ${row.relationKind}`);
    const person = peopleById.get(row.personId);
    const liege = peopleById.get(row.liegePersonId);
    if (person && liege && stateByPersonId.get(row.personId) !== stateByPersonId.get(row.liegePersonId))
      errors.push(`${row.personId}: foreign nation owner liege`);
    if (liegeByPerson.has(row.personId)) errors.push(`${row.personId}: duplicate immediate liege (court retainer and owner liege)`);
    else liegeByPerson.set(row.personId, row.liegePersonId);
  }
  for (const personId of liegeByPerson.keys()) {
    const seen = new Set();
    for (let current = personId; liegeByPerson.has(current); current = liegeByPerson.get(current)) {
      if (seen.has(current)) { errors.push(`${personId}: direct liege cycle`); break; }
      seen.add(current);
    }
  }
  const { courtMemberships } = config;
  if (courtMemberships?.schema !== "opening-court-memberships.v1" || courtMemberships.effectiveYear !== 2126 ||
    !Array.isArray(courtMemberships.memberships))
    errors.push("courtMemberships: missing structural metadata (schema/effectiveYear/memberships)");
  const memberIds = new Set(directRetainers.map(row => row.personId));
  for (const row of courtMemberships?.memberships || []) {
    fk(row.personId, personIds, "court membership person");
    fk(row.courtId, courtIds, `${row.personId}.membershipCourtId`);
    if (memberIds.has(row.personId)) errors.push(`${row.personId}: duplicate court membership`);
    memberIds.add(row.personId);
    const court = courtById.get(row.courtId);
    if (!liegeByPerson.has(row.personId) || liegeByPerson.get(row.personId) !== court?.ownerPersonId)
      errors.push(`${row.personId}: membership court owner is not immediate liege`);
    if (stateByPersonId.get(row.personId) !== court?.stateId)
      errors.push(`${row.personId}: foreign nation court membership`);
  }
  const orgSources = new Map([["O01", sources.chronicle], ["O02", sources.stateSource], ["O03", sources.stateSource], ["O04", sources.stateSource]]);
  for (const row of organizations) {
    if (row.stateId !== undefined) fk(row.stateId, stateIds, `${row.id}.stateId`);
    const block = orgSources.get(row.id)?.content.find((b) => b.anchor === row.sourceAnchor);
    if (!block) errors.push(`${row.id}: missing organization source anchor`);
  }
  for (const row of events) {
    if (row.date === null) continue;
    fk(row.sourceAnchor, eventAnchors, row.id);
    if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(row.date)) errors.push(`${row.id}: invalid date`);
  }
  for (const row of eventLinks) {
    fk(row.eventId, eventIds, "event link eventId");
    fk(row.personId, personIds, "event link personId");
    if (row.organizationId !== undefined) fk(row.organizationId, orgIds, "event link organizationId");
    const text = sources.chronicle.content.find((block) => block.anchor === row.eventId.slice(2))?.text?.ko;
    const person = people.find((entry) => entry.id === row.personId);
    const organization = organizations.find((entry) => entry.id === row.organizationId);
    if (typeof text !== "string" || (person && !text.includes(person.name)) ||
      (organization && !text.includes(organization.name))) errors.push(`event link ${row.eventId}: source does not name linked entity`);
  }
  if (/\b(?:M\d{3}|B\d{3})\b/.test(JSON.stringify(config))) errors.push("story-batch ID reintroduced");
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const run = async (options) => {
    const dataset = await loadDataset(options);
    const errors = validate(dataset);
    return { dataset, errors };
  };
  let result;
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--private-pg" || !args[1].trim() || args[1].startsWith("--"))) {
    throw new Error("Usage: node lore/relations/validate.mjs [--private-pg <connection-string>]");
  }
  if (args.length) {
    // 331c86165 shipped this mode importing a capability export that does not
    // exist, and readPrivateCurrentDocument opens its own SQLite stores rather
    // than the passed transaction. Reject explicitly until a real private
    // PostgreSQL reader contract exists; never fall back silently.
    throw new Error("E_PRIVATE_PG_UNSUPPORTED: --private-pg is not implemented; private PostgreSQL reads need a dedicated reader contract");
  } else result = await run({});
  const { dataset, errors } = result;
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log(`PASS states=${dataset.states.length} tiers=6/4/6 vassals=${dataset.vassals.length} approvedPeople=${dataset.sources.registry.persons.length} provisionalPeople=${dataset.config.provisionalPeople.length} organizations=${dataset.organizations.length} relations=${dataset.relations.length} courts=${dataset.config.courts.length} directRetainers=${dataset.config.directRetainers.length} ownerLieges=${dataset.config.ownerLieges?.edges?.length ?? 0} datedEvents=${dataset.events.length} eventLinks=${dataset.eventLinks.length}`);
}
