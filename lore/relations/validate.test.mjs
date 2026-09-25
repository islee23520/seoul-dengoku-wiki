import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDataset, resolveRelations, validate } from "./validate.mjs";

test("sourced canon relationships validate", () => {
  assert.deepEqual(validate(loadDataset()), []);
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
