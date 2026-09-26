import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const source = (file) => JSON.parse(readFileSync(path.join(HERE, "..", file), "utf8"));
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

export function loadDataset() {
  const config = JSON.parse(readFileSync(path.join(HERE, "relations.json"), "utf8"));
  const stateSource = source("factions/Sixteen-States.json");
  const relationSource = source("characters/Cast-Relations.json");
  const castIndex = source("characters/Cast-Index.json");
  const registry = source("name-pools/person-id-registry.json");
  const chronicle = source("chronology/Century-Annals.json");
  const table = (doc, anchor) => doc.content.find((block) => block.kind === "table" && block.anchor === anchor);
  const states = table(stateSource, "table").rows.map((row) => ({
    id: ko(row[0]), name: ko(row[1]).split("(")[0],
    tier: ko(row[3]).split(",")[0], sourceAnchor: "table",
  }));
  const stateByName = new Map(states.map((row) => [row.name, row.id]));
  const vassals = table(stateSource, "table-2").rows.map((row, index) => ({
    id: `V${String(index + 1).padStart(2, "0")}`,
    name: ko(row[0]), parentStateId: stateByName.get(ko(row[1])),
    sourceAnchor: "table-2", sourceRow: index,
  }));
  const people = [...registry.persons, ...config.provisionalPeople];
  const { relations, errors: relationErrors } = resolveRelations(relationSource, people);
  // Only paragraphs that begin with an explicit year are independently dated.
  // Undated paragraphs are deliberately not assigned a date from their chapter.
  const events = chronicle.content.filter((block) => block.kind === "paragraph")
    .flatMap((block) => {
      const match = /^(\d{4})년(?: (\d{1,2})월(?: (\d{1,2})일)?)?/.exec(block.text.ko);
      if (!match) return [];
      const date = [match[1], match[2], match[3]].filter(Boolean).map((part, index) =>
        index ? part.padStart(2, "0") : part).join("-");
      return [{ id: `E:${block.anchor}`, date, sourceAnchor: block.anchor }];
    });
  return {
    config, states, vassals, people, organizations: config.organizations,
    relations, relationErrors, events, eventLinks: config.eventLinks,
    sources: { stateSource, relationSource, castIndex, registry, chronicle },
  };
}

export function validate(dataset) {
  const errors = [];
  const { config, states, vassals, people, organizations, relations, events, eventLinks, sources } = dataset;
  errors.push(...(dataset.relationErrors || []));
  const unique = (rows, label) => {
    const ids = new Set();
    for (const row of rows) {
      if (!row.id || ids.has(row.id)) errors.push(`${label}: duplicate or empty ID ${row.id}`);
      ids.add(row.id);
    }
    return ids;
  };
  const stateIds = unique(states, "states");
  const personIds = unique(people, "people");
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
  for (const row of vassals) {
    fk(row.parentStateId, stateIds, row.id);
    fk(row.sourceAnchor, stateAnchors, row.id);
  }
  if (sources.registry.totalPeople !== 1016 || sources.registry.persons.length !== 1016 ||
      sources.registry.persons.some((p, i) => p.id !== `K${String(i + 1).padStart(3, "0")}`) ||
      people.length !== sources.registry.persons.length + config.provisionalPeople.length) errors.push("people: issued K001–K1016 mismatch");
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
  const orgSources = new Map([["O01", sources.chronicle], ["O02", sources.stateSource], ["O03", sources.stateSource], ["O04", sources.stateSource]]);
  for (const row of organizations) {
    if (row.stateId !== undefined) fk(row.stateId, stateIds, `${row.id}.stateId`);
    const block = orgSources.get(row.id)?.content.find((b) => b.anchor === row.sourceAnchor);
    if (!block) errors.push(`${row.id}: missing organization source anchor`);
  }
  for (const row of events) {
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
  const dataset = loadDataset();
  const errors = validate(dataset);
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log(`PASS states=${dataset.states.length} tiers=6/4/6 vassals=${dataset.vassals.length} approvedPeople=1016 provisionalPeople=${dataset.config.provisionalPeople.length} organizations=${dataset.organizations.length} relations=${dataset.relations.length} datedEvents=${dataset.events.length} eventLinks=${dataset.eventLinks.length}`);
}
