import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDataset, validate } from "./validate.mjs";

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
  dataset.eventLinks[0] = { ...dataset.eventLinks[0], personId: "P001" };
  assert.match(validate(dataset).join("\n"), /source does not name linked entity/);
});
