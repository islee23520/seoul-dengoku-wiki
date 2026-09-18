#!/usr/bin/env node
// Todo 6 (jaepyo-iyen-separate-cast): characterization test for values-cast.json.
// Exports validateValuesCast(data, cardText) so evidence runs can feed temp mutated files.
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const DATA_PATH = 'LORE/name-pools/values-cast.json';
const CARD_PATH = 'LORE/Cast-Unaffiliated.md';
const AXES = ['권위', '개방', '무력', '물질', '공동', '원칙', '공개', '자격', '분산', '변혁'];
const DESIRE_AXES = ['갈망', '독점', '위험', '과시', '지속'];
const ORIENTATIONS = ['동성', '무성향', '양성', '유동', '이성', '미확인'];
const BONDS = ['계약동거', '다자', '단혼', '비독점', '없음', '미확인'];
const STAGES = ['주요', 'S1', 'S2', 'S3', 'S4'];
const BOUND = 100;

const NEW_PEOPLE = [
  {
    name: '조재표', title: '유명 낭인 지휘자', stage: 'S1', state: 'S00', state_name: '무소속',
    generation: 'opening', source: 'proposal', minors: false,
    values: { 권위: 10, 개방: 20, 무력: 30, 물질: -20, 공동: 20, 원칙: -10, 공개: -20, 자격: 20, 분산: 40, 변혁: 10 },
    desire: { 갈망: 30, 독점: -20, 위험: 30, 과시: 10, 지속: 20, 지향: '미확인', 결합: '미확인' },
    locked: false,
  },
  {
    name: '이연', title: '수행 전령', stage: 'S1', state: 'S00', state_name: '무소속',
    generation: 'opening', source: 'proposal', minors: false,
    values: { 권위: 0, 개방: 30, 무력: 10, 물질: -20, 공동: 40, 원칙: 20, 공개: 10, 자격: 30, 분산: 20, 변혁: 20 },
    desire: { 갈망: 20, 독점: -30, 위험: 10, 과시: 20, 지속: 30, 지향: '미확인', 결합: '미확인' },
    locked: false,
  },
];
const EXPECTED_COUNT = 1004;

function validatePersonEnvelopes(people, errors) {
  const seen = new Set();
  for (const p of people) {
    if (seen.has(p.name)) errors.push(`duplicate name: ${p.name}`);
    seen.add(p.name);
    if (!STAGES.includes(p.stage)) errors.push(`${p.name}: invalid stage "${p.stage}"`);
    if (!/^[S]\d{2}$|^S00$/.test(p.state)) errors.push(`${p.name}: invalid state "${p.state}"`);
    if (p.generation !== 'opening') errors.push(`${p.name}: invalid generation "${p.generation}"`);
    if (p.source !== 'proposal') errors.push(`${p.name}: invalid source "${p.source}"`);
    if (p.minors !== false) errors.push(`${p.name}: minors must be false`);
    if (p.locked !== undefined && p.locked !== true && p.locked !== false) errors.push(`${p.name}: locked must be boolean`);
    if ('id' in p) errors.push(`${p.name}: unexpected id field`);
    for (const axis of AXES) {
      const v = p.values?.[axis];
      if (!Number.isInteger(v) || v < -BOUND || v > BOUND) errors.push(`${p.name}: value ${axis}=${v} out of range`);
    }
    for (const axis of DESIRE_AXES) {
      const v = p.desire?.[axis];
      if (!Number.isInteger(v) || v < -BOUND || v > BOUND) errors.push(`${p.name}: desire ${axis}=${v} out of range`);
    }
    if (!ORIENTATIONS.includes(p.desire?.지향)) errors.push(`${p.name}: invalid 지향 "${p.desire?.지향}"`);
    if (!BONDS.includes(p.desire?.결합)) errors.push(`${p.name}: invalid 결합 "${p.desire?.결합}"`);
  }
}

function validateNewPeople(people, errors) {
  for (const expected of NEW_PEOPLE) {
    const actual = people.find((p) => p.name === expected.name);
    if (!actual) { errors.push(`new row missing: ${expected.name}`); continue; }
    const diff = (a, e) => JSON.stringify(a) !== JSON.stringify(e);
    const envelope = { name: actual.name, title: actual.title, stage: actual.stage, state: actual.state, state_name: actual.state_name, generation: actual.generation, source: actual.source, minors: actual.minors, locked: actual.locked };
    const envExpected = { name: expected.name, title: expected.title, stage: expected.stage, state: expected.state, state_name: expected.state_name, generation: expected.generation, source: expected.source, minors: expected.minors, locked: expected.locked };
    if (diff(envelope, envExpected)) errors.push(`${expected.name}: envelope mismatch ${JSON.stringify(envelope)}`);
    if (diff(actual.values, expected.values)) errors.push(`${expected.name}: values mismatch ${JSON.stringify(actual.values)}`);
    if (diff(actual.desire, expected.desire)) errors.push(`${expected.name}: desire mismatch ${JSON.stringify(actual.desire)}`);
  }
}

function parseCardNumbers(line) {
  const out = {};
  for (const m of line.matchAll(/([가-힣]+) (−?\d+|미확인)/g)) out[m[1]] = m[2].startsWith('−') ? Number(m[2].slice(1)) * -1 : (m[2] === '미확인' ? '미확인' : Number(m[2]));
  return out;
}

function validateAgainstCards(people, cardText, errors) {
  if (!cardText) return;
  for (const expected of NEW_PEOPLE) {
    const block = cardText.split(/(?=^### 인물 )/m).find((b) => b.startsWith(`### 인물 ${expected.name}`));
    if (!block) { errors.push(`card missing for ${expected.name}`); continue; }
    const valuesLine = (block.match(/^- 가치관: (.+)$/m) || [])[1];
    const desireLine = (block.match(/^- 욕망: (.+)$/m) || [])[1];
    const cardValues = parseCardNumbers(valuesLine);
    const cardDesire = parseCardNumbers(desireLine);
    const actual = people.find((p) => p.name === expected.name);
    if (!actual) continue;
    for (const axis of AXES) {
      if (cardValues[axis] !== actual.values[axis]) errors.push(`${expected.name}: card/JSON value ${axis} ${cardValues[axis]} != ${actual.values[axis]}`);
    }
    for (const axis of [...DESIRE_AXES, '지향', '결합']) {
      if (cardDesire[axis] !== actual.desire[axis]) errors.push(`${expected.name}: card/JSON desire ${axis} ${cardDesire[axis]} != ${actual.desire[axis]}`);
    }
  }
}

export function validateValuesCast(data, cardText) {
  const errors = [];
  if (data.count !== data.people.length) errors.push(`stale count: count=${data.count} people.length=${data.people.length}`);
  if (data.count !== EXPECTED_COUNT) errors.push(`count ${data.count} != ${EXPECTED_COUNT}`);
  validatePersonEnvelopes(data.people, errors);
  validateNewPeople(data.people, errors);
  validateAgainstCards(data.people, cardText, errors);
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
const data = JSON.parse(await readFile(DATA_PATH, 'utf8'));
const cardText = await readFile(CARD_PATH, 'utf8').catch(() => '');
const errors = validateValuesCast(data, cardText);
if (errors.length > 0) {
  console.error('TEST FAIL');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log('TEST PASS');
}
