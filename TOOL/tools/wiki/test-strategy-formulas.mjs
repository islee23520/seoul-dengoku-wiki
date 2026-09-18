import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const economyPath = process.env.JANSEON_ECONOMY_PATH
  || join(repositoryRoot, 'Wikis', 'game-logic', 'Economy-and-Production.md');
const markdown = await readFile(economyPath, 'utf8');

function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseFormulaFence(text) {
  const match = text.match(/```text\n([\s\S]*?)```/);
  assert.ok(match, 'Economy-and-Production.md: missing machine-consumed ```text formula fence');
  const assignments = {};
  for (const raw of match[1].split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const index = line.indexOf(' = ');
    assert.notEqual(index, -1, `formula fence line is not an assignment: ${line}`);
    assignments[line.slice(0, index)] = line.slice(index + 3);
  }
  return assignments;
}

function assertZeroIsOne(name, expression, zeroToken) {
  assert.equal(typeof expression, 'string', `formula fence missing ${name}`);
  assert.match(
    expression,
    new RegExp(`${zeroToken}이 0이면 1`),
    `${name} must define ${zeroToken}=0 as fulfillment 1`,
  );
  assert.doesNotMatch(
    expression,
    new RegExp(`${zeroToken}이 0이면 0`),
    `${name} must not invert ${zeroToken}=0 to fulfillment 0`,
  );
}

function fulfillmentFromRule(expression, assigned, required, zeroToken) {
  assertZeroIsOne('rule', expression, zeroToken);
  if (required === 0) return 1;
  const clampMatch = expression.match(/clamp\(([^,]+)\s*\/\s*([^,]+),\s*0,\s*1\)/);
  assert.ok(clampMatch, `rule is missing clamp(assigned/required, 0, 1): ${expression}`);
  return clamp(assigned / required, 0, 1);
}

function inputRatioFromRule(expression, inputs) {
  assert.equal(typeof expression, 'string', 'formula fence missing 입력률');
  assert.match(expression, /필요 입력 집합이 비어 있으면 1/, '입력률 must define empty required-input set as 1');
  assert.doesNotMatch(expression, /필요 입력 집합이 비어 있으면 0/, '입력률 must not invert empty set to 0');
  assert.match(expression, /필요량_r이 0이면 1/, '입력률 must define individual required=0 as 1');
  assert.doesNotMatch(expression, /필요량_r이 0이면 0/, '입력률 must not invert individual required=0 to 0');
  if (!Array.isArray(inputs)) throw new Error('malformed recipe');
  if (inputs.length === 0) return 1;
  return Math.min(...inputs.map((item) => {
    if (item == null || typeof item !== 'object') throw new Error('malformed recipe');
    const assigned = item.assigned ?? item.allocated;
    const required = item.required;
    if (!isFiniteNumber(assigned) || !isFiniteNumber(required)) throw new Error('malformed recipe');
    if (required === 0) return 1;
    return clamp(assigned / required, 0, 1);
  }));
}

function isFiniteNumberOrThrow(value) {
  if (!isFiniteNumber(value)) throw new Error('malformed recipe');
  return value;
}

function shortage(filled, demand) {
  isFiniteNumberOrThrow(filled);
  isFiniteNumberOrThrow(demand);
  if (demand === 0) return 0;
  return clamp(1 - filled / demand, 0, 1);
}

const formulas = parseFormulaFence(markdown);
assertZeroIsOne('노동률', formulas['노동률'], '필요인력');
assertZeroIsOne('전력률', formulas['전력률'], '필요전력');
assert.equal(typeof formulas['입력률'], 'string', 'formula fence missing 입력률');
assert.match(formulas['입력률'], /필요 입력 집합이 비어 있으면 1/);
assert.doesNotMatch(formulas['입력률'], /필요 입력 집합이 비어 있으면 0/);
assert.match(formulas['입력률'], /필요량_r이 0이면 1/);
assert.equal(
  formulas['생산량'],
  '기본산출 * min(노동률, 입력률, 전력률) * 시설상태',
  'deterministic production formula must be preserved',
);
assert.equal(
  formulas['부족률_r'],
  '총수요_r이 0이면 0, 아니면 clamp(1 - 충족수요_r / 총수요_r, 0, 1)',
  'zero-demand shortage rule must stay 0',
);

function fulfillment(assigned, required, kind) {
  isFiniteNumberOrThrow(assigned);
  isFiniteNumberOrThrow(required);
  const expression = kind === 'power' ? formulas['전력률'] : formulas['노동률'];
  const token = kind === 'power' ? '필요전력' : '필요인력';
  return fulfillmentFromRule(expression, assigned, required, token);
}

function inputRatio(inputs) {
  return inputRatioFromRule(formulas['입력률'], inputs);
}

function computeProduction(recipe) {
  if (recipe == null || typeof recipe !== 'object' || Array.isArray(recipe)) {
    throw new Error('malformed recipe');
  }
  const {
    baseOutput,
    laborAvailable,
    laborRequired,
    powerAssigned,
    powerRequired,
    inputs,
    facility,
  } = recipe;
  const scalars = [baseOutput, laborAvailable, laborRequired, powerAssigned, powerRequired, facility];
  if (scalars.some((value) => !isFiniteNumber(value))) {
    throw new Error('malformed recipe');
  }
  const labor = fulfillment(laborAvailable, laborRequired, 'labor');
  const power = fulfillment(powerAssigned, powerRequired, 'power');
  const input = inputRatio(inputs ?? []);
  return baseOutput * Math.min(labor, input, power) * facility;
}

function extractJsonCases(text) {
  const match = text.match(/```json economy-formula-cases\n([\s\S]*?)```/);
  assert.ok(match, 'Economy-and-Production.md: missing machine-consumed ```json economy-formula-cases fence');
  const parsed = JSON.parse(match[1]);
  assert.ok(Array.isArray(parsed) && parsed.length > 0, 'economy-formula-cases must be a non-empty array');
  return parsed;
}

function evaluateCase(entry) {
  assert.equal(typeof entry, 'object');
  assert.ok(entry && typeof entry.name === 'string' && entry.name.length > 0);
  assert.ok(isFiniteNumber(entry.expected), `${entry.name}: expected must be a finite number`);
  switch (entry.kind) {
    case 'labor':
      return fulfillment(entry.available, entry.required, 'labor');
    case 'power':
      return fulfillment(entry.allocated ?? entry.assigned, entry.required, 'power');
    case 'input':
      return inputRatio(entry.requirements);
    case 'shortage':
      return shortage(entry.filled, entry.demand);
    case 'production':
      return computeProduction({
        baseOutput: entry.baseOutput,
        laborAvailable: entry.laborAvailable,
        laborRequired: entry.laborRequired,
        powerAssigned: entry.powerAssigned ?? entry.powerAllocated,
        powerRequired: entry.powerRequired,
        inputs: entry.inputs ?? entry.requirements,
        facility: entry.facility,
      });
    default:
      throw new Error(`${entry.name}: unknown kind ${entry.kind}`);
  }
}

assert.equal(fulfillment(0, 0, 'labor'), 1, 'zero labor requirement fulfillment is 1');
assert.equal(fulfillment(12, 0, 'labor'), 1, 'surplus against zero labor requirement stays 1');
assert.equal(fulfillment(8, 10, 'labor'), 0.8);
assert.equal(fulfillment(12, 10, 'labor'), 1);
assert.equal(fulfillment(0, 0, 'power'), 1, 'zero power requirement fulfillment is 1');
assert.equal(inputRatio([{ assigned: 0, required: 0 }]), 1, 'zero individual input requirement is 1');
assert.equal(inputRatio([]), 1, 'empty required-input set is 1');
assert.equal(inputRatio([{ allocated: 0, required: 0 }, { allocated: 7, required: 10 }]), 0.7);
assert.equal(shortage(0, 0), 0, 'zero-demand shortage stays 0');
assert.equal(shortage(50, 100), 0.5);

assert.equal(
  computeProduction({
    baseOutput: 100,
    laborAvailable: 8,
    laborRequired: 10,
    powerAssigned: 90,
    powerRequired: 100,
    inputs: [{ assigned: 70, required: 100 }],
    facility: 0.8,
  }),
  56,
  'documented mixed-constraint production must stay 100 * min(0.8,0.7,0.9) * 0.8 = 56',
);

assert.equal(
  computeProduction({
    baseOutput: 100,
    laborAvailable: 0,
    laborRequired: 0,
    powerAssigned: 0,
    powerRequired: 0,
    inputs: [],
    facility: 0.8,
  }),
  80,
  'all-zero requirements with empty inputs: 100 * min(1,1,1) * 0.8 = 80',
);

assert.throws(() => computeProduction(null), /malformed recipe/);
assert.throws(() => computeProduction({}), /malformed recipe/);
assert.throws(() => inputRatio('none'), /malformed recipe/);

const cases = extractJsonCases(markdown);
assert.equal(cases.length, 10, `expected 10 machine-consumed cases, got ${cases.length}`);
const byName = new Map(cases.map((entry) => [entry.name, entry]));
for (const required of [
  'labor-zero-requirement',
  'power-zero-requirement',
  'input-empty-requirement-set',
  'input-all-zero-requirements',
  'documented-mixed-production',
  'all-zero-requirement-production',
]) {
  assert.ok(byName.has(required), `economy-formula-cases missing ${required}`);
}

assert.equal(byName.get('labor-zero-requirement').expected, 1);
assert.equal(byName.get('power-zero-requirement').expected, 1);
assert.equal(byName.get('input-empty-requirement-set').expected, 1);
assert.equal(byName.get('input-all-zero-requirements').expected, 1);
assert.equal(byName.get('documented-mixed-production').expected, 56);
assert.equal(byName.get('all-zero-requirement-production').expected, 80);

for (const entry of cases) {
  const actual = evaluateCase(entry);
  assert.ok(
    Math.abs(actual - entry.expected) < 1e-9,
    `${entry.name}: engine ${actual} != documented ${entry.expected}`,
  );
}

console.log(`strategy formula contract passed cases=${cases.length}`);
