import { test } from "vitest";
import assert from "node:assert/strict";
import { loadDataset, resolveRelations, validate } from "./validate.mjs";

test("sourced canon relationships validate", () => {
  assert.deepEqual(validate(loadDataset()), []);
});

test("approved S01 direct retainers resolve to three owner courts and unchanged command sources", () => {
  const dataset = loadDataset();
  const { courts, directRetainers } = dataset.config;
  assert.deepEqual(courts.slice(0, 3).map((court) => court.ownerPersonId), ["K002", "K017", "K003"]);
  assert.deepEqual(directRetainers.slice(0, 37).map((row) => row.personId), [
    "K904", "K568", "K616", "K712", "K856", "K952", "K1001", "K424", "K520", "K760", "K808", "K664", "K472",
    "K504", "K744", "K600", "K552", "K456", "K840", "K888", "K648", "K936", "K984", "K792", "K696",
    "K968", "K440", "K728", "K488", "K920", "K536", "K824", "K776", "K632", "K872", "K584", "K680",
  ]);
  assert.ok(!directRetainers.some((row) => row.personId === "K272"));
  assert.deepEqual(validate(dataset), []);
});

test("approved S02/S03 retainers resolve to seven owner courts from their command rows", () => {
  const dataset = loadDataset();
  const expected = [
    ["K041", "K032", 30], ["K047", "K037", 42], ["K049", "K033", 46],
    ["K068", "K058", 52], ["K069", "K060", 54], ["K071", "K060", 58],
    ["K073", "K061", 62], ["K074", "K062", 64], ["K075", "K061", 66],
  ];
  assert.deepEqual(dataset.config.directRetainers.slice(37), expected.map(([personId, liegePersonId, sourceRow]) =>
    ({ personId, liegePersonId, courtId: `court:${liegePersonId}`, sourceRow })));
  assert.deepEqual(dataset.config.courts.slice(3),
    [["K032", "S02"], ["K037", "S02"], ["K033", "S02"], ["K058", "S03"],
      ["K060", "S03"], ["K061", "S03"], ["K062", "S03"]]
      .map(([ownerPersonId, stateId]) => ({ id: `court:${ownerPersonId}`, ownerPersonId, stateId })));
  assert.deepEqual(validate(dataset), []);
  const corrupt = loadDataset();
  corrupt.config.directRetainers[37].courtId = "court:K037";
  assert.match(validate(corrupt).join("\n"), /K041: orphan court/);
});

test("direct-liege validator rejects source, actor, court, nation and hierarchy corruption", () => {
  const cases = [
    ["source", (d) => { d.config.directRetainers[0].sourceRow = 414; }, /source command row mismatch/],
    ["actor", (d) => { d.config.directRetainers[0].personId = "K272"; }, /source command row mismatch/],
    ["orphan court", (d) => { d.config.directRetainers[0].courtId = "court:K017"; }, /orphan court/],
    ["self", (d) => { d.config.directRetainers[0].liegePersonId = "K904"; }, /self direct liege/],
    ["cycle", (d) => { d.config.directRetainers.push({ personId: "K002", liegePersonId: "K904", courtId: "court:K904", sourceRow: 380 }); }, /direct liege cycle/],
    ["foreign nation", (d) => { d.config.courts[0].stateId = "S02"; }, /foreign nation owner/],
    ["missing approval", (d) => { delete d.config.courtContract.approvalRef; }, /missing approved source metadata/],
  ];
  for (const [label, mutate, expected] of cases) {
    const dataset = loadDataset();
    mutate(dataset);
    assert.match(validate(dataset).join("\n"), expected, label);
  }
  const social = loadDataset();
  assert.ok(social.relations.some((row) => row.fromPersonId === "K1008" && row.toPersonId === "K1009"));
  assert.ok(social.relations.some((row) => row.fromPersonId === "K1009" && row.toPersonId === "K1008"));
  assert.deepEqual(validate(social), []);
});

test("approved owner lieges are exactly eight person-to-person edges", () => {
  const dataset = loadDataset();
  const { ownerLieges } = dataset.config;
  assert.equal(ownerLieges.schema, "owner-liege-edges.v1");
  assert.equal(ownerLieges.effectiveYear, 2126);
  assert.deepEqual(ownerLieges.edges, [
    { personId: "K002", liegePersonId: "K001", relationKind: "direct-liege", ownerTerm: "직속 주군" },
    { personId: "K017", liegePersonId: "K001", relationKind: "direct-liege", ownerTerm: "직속 주군" },
    { personId: "K003", liegePersonId: "K001", relationKind: "direct-liege", ownerTerm: "직속 주군" },
    { personId: "K058", liegePersonId: "K1005", relationKind: "direct-vassal", ownerTerm: "직속 가신" },
    { personId: "K060", liegePersonId: "K1005", relationKind: "direct-vassal", ownerTerm: "직속 가신" },
    { personId: "K061", liegePersonId: "K1005", relationKind: "direct-vassal", ownerTerm: "직속 가신" },
    { personId: "K062", liegePersonId: "K1005", relationKind: "direct-vassal", ownerTerm: "직속 가신" },
    { personId: "K233", liegePersonId: "K222", relationKind: "direct-vassal", ownerTerm: "직속 가신" },
  ]);
  const sourceQuotes = ownerLieges.sourceBasis.map((basis) => basis.quote);
  assert.ok(sourceQuotes.some((quote) => quote.includes("군주를 뽑고") && quote.includes("군주 자리에 앉았다")));
  assert.ok(sourceQuotes.some((quote) => quote.includes("개막의 회장은 정서온이다")));
  assert.ok(!ownerLieges.edges.some((edge) => ["K068", "K069", "K071", "K073", "K074", "K075"].includes(edge.personId)));
  assert.ok(!ownerLieges.edges.some((edge) => edge.liegePersonId === "K219"), "the S09 chair's existing command row must not be promoted by inference");
  assert.deepEqual(validate(dataset), []);
});

test("owner-liege validator rejects stale approval, foreign nation, duplicate liege, cycle and forged term", () => {
  const cases = [
    ["foreign nation", (d) => { d.config.ownerLieges.edges[3].liegePersonId = "K001"; }, /K058: foreign nation owner liege/],
    ["duplicate immediate liege", (d) => { d.config.ownerLieges.edges.push({ personId: "K904", liegePersonId: "K001", relationKind: "direct-liege", ownerTerm: "직속 주군" }); }, /K904: duplicate immediate liege/],
    ["cycle", (d) => { d.config.ownerLieges.edges.push({ personId: "K1005", liegePersonId: "K058", relationKind: "direct-vassal", ownerTerm: "직속 가신" }); }, /direct liege cycle/],
    ["self", (d) => { d.config.ownerLieges.edges[0].liegePersonId = "K002"; }, /K002: self owner liege/],
    ["forged term", (d) => { d.config.ownerLieges.edges[0].ownerTerm = "직속 가신"; }, /K002: owner term mismatch/],
    ["unknown liege", (d) => { d.config.ownerLieges.edges[0].liegePersonId = "K2000"; }, /missing foreign key K2000/],
  ];
  for (const [label, mutate, expected] of cases) {
    const dataset = loadDataset();
    mutate(dataset);
    assert.match(validate(dataset).join("\n"), expected, label);
  }
});

test("owner-liege validator rejects missing kind and term from the real dataset", () => {
  const dataset = loadDataset();
  delete dataset.config.ownerLieges.edges[0].relationKind;
  delete dataset.config.ownerLieges.edges[0].ownerTerm;
  const errors = validate(dataset).join("\n");
  assert.match(errors, /K002: unknown owner relation kind undefined/);
  assert.match(errors, /K002: owner term mismatch/);
});

test("owner-liege validator rejects unknown kind with missing term from the real dataset", () => {
  const dataset = loadDataset();
  dataset.config.ownerLieges.edges[0].relationKind = "unknown-kind";
  delete dataset.config.ownerLieges.edges[0].ownerTerm;
  const errors = validate(dataset).join("\n");
  assert.match(errors, /K002: unknown owner relation kind unknown-kind/);
  assert.match(errors, /K002: owner term mismatch/);
});

test("a broken directed-person foreign key fails validation", () => {
  const dataset = loadDataset();
  dataset.relations[0] = { ...dataset.relations[0], toPersonId: "P999" };
  assert.match(validate(dataset).join("\n"), /missing foreign key P999/);
});

test("a valid person ID cannot be linked to an event that does not name them", () => {
  const dataset = loadDataset();
  dataset.eventLinks[0] = { ...dataset.eventLinks[0], personId: "K1001" };
  assert.match(validate(dataset).join("\n"), /source does not name linked entity/);
});

const namesakes = [
  { id: "K001", name: "김가람", bonGwan: "경주 김씨", birthDate: "2090-01-02", gender: "여성" },
  { id: "K002", name: "김가람", bonGwan: "김해 김씨", birthDate: "2092-03-04", gender: "남성" },
];
const relationSource = (from, to) => ({ content: [{ kind: "table", anchor: "fixture", rows: [
  [{ ko: from }, { ko: "친족" }, { ko: to }],
] }] });

test("distinct namesake IDs resolve without merging when endpoints carry IDs", () => {
  const { relations, errors } = resolveRelations(relationSource("K001", "K002"), namesakes);
  assert.deepEqual(errors, []);
  assert.equal(relations[0].fromPersonId, "K001");
  assert.equal(relations[0].toPersonId, "K002");
});

test("a bare namesake endpoint fails explicitly instead of attaching to either ID", () => {
  const dataset = loadDataset();
  dataset.people.splice(0, 2, ...namesakes);
  dataset.sources.relationSource.content.find((block) => block.anchor === "관계-원장-table3").rows[0][0].ko = "김가람";
  const resolved = resolveRelations(dataset.sources.relationSource, dataset.people);
  dataset.relations = resolved.relations;
  dataset.relationErrors = resolved.errors;
  assert.equal(dataset.relations[0].fromPersonId, undefined);
  assert.match(validate(dataset).join("\n"), /R:관계-원장-table3:1.fromPersonId: ambiguous person name 김가람 \(K001, K002\); use a person ID/);
});
