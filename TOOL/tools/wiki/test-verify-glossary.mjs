import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { verifyGlossary, REQUIRED_PUBLIC_TERMS, REQUIRED_TERM_CONTRACTS } from './verify-glossary.mjs';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const glossaryPath = path.join(repoRoot, 'LORE/glossary.json');
const readGlossary = () => JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));

function verifyMutated(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'glossary-'));
  try {
    const data = readGlossary();
    mutate(data);
    const file = path.join(dir, 'glossary.json');
    fs.writeFileSync(file, JSON.stringify(data));
    return verifyGlossary(file, repoRoot);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('verifyGlossary should pass for valid glossary', () => {
  assert.doesNotThrow(() => verifyGlossary(glossaryPath, repoRoot));
});

test('glossary includes every required public term', () => {
  const names = new Set(readGlossary().map((entry) => entry.display_name_ko));
  assert.ok(REQUIRED_PUBLIC_TERMS.length > 0);
  for (const name of REQUIRED_PUBLIC_TERMS) {
    assert.ok(names.has(name), `missing glossary term: ${name}`);
  }
});

const findByName = (data, name) => data.find((e) => e.display_name_ko === name);

test('every locked term contract is a required public term', () => {
  const names = Object.keys(REQUIRED_TERM_CONTRACTS);
  assert.ok(names.includes('감응조준법'));
  for (const name of names) assert.ok(REQUIRED_PUBLIC_TERMS.includes(name), name);
});

test('verifyGlossary rejects a changed alias on a locked term', () => {
  for (const name of Object.keys(REQUIRED_TERM_CONTRACTS)) {
    assert.throws(
      () => verifyMutated((d) => { findByName(d, name).aliases = [...findByName(d, name).aliases, '가짜별칭']; }),
      /alias/,
      name,
    );
  }
});

test('verifyGlossary rejects a changed owner_path on a locked term', () => {
  for (const name of Object.keys(REQUIRED_TERM_CONTRACTS)) {
    assert.throws(
      () => verifyMutated((d) => { findByName(d, name).owner_path = 'GDD/rules'; }),
      /owner_path/,
      name,
    );
  }
});

test('verifyGlossary rejects a changed category on a locked term', () => {
  for (const name of Object.keys(REQUIRED_TERM_CONTRACTS)) {
    assert.throws(
      () => verifyMutated((d) => { findByName(d, name).category = 'organization'; }),
      /category/,
      name,
    );
  }
});

test('verifyGlossary rejects a removed required term', () => {
  assert.throws(
    () => verifyMutated((d) => d.splice(d.findIndex((e) => e.display_name_ko === REQUIRED_PUBLIC_TERMS[0]), 1)),
    /Missing required public term/,
  );
});

test('verifyGlossary rejects a nonexistent owner_path', () => {
  assert.throws(
    () => verifyMutated((d) => { d[0].owner_path = 'LORE/does-not-exist'; }),
    /Owner path does not exist/,
  );
});
