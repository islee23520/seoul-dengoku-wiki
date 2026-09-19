import assert from 'node:assert/strict';
import test from 'node:test';

export function validateLineage(lines, base) {
  const commits = lines.trim().split('\n').filter(Boolean).map((line) => {
    const [hash, parents, ...subject] = line.trim().split(' ');
    return { hash, parents: parents === '-' ? [] : parents.split(','), subject: subject.join(' ') };
  });
  if (commits.length === 0) throw new Error('empty lineage');
  if (commits.some(({ parents }) => parents.length !== 1)) throw new Error('merge or root commit in range');
  if (commits.some(({ subject }) => /\bamend\b|commit \(amend\)/i.test(subject))) throw new Error('amend marker');
  if (commits.at(-1).parents[0] !== base) throw new Error('range does not attach to base');
  return commits;
}

test('accepts ordinary linear commits attached to base', () => {
  assert.equal(validateLineage('b a docs: A\na base docs: base', 'base').length, 2);
});

test('rejects amend marker even when parents are linear', () => {
  assert.throws(() => validateLineage('b a docs: amend', 'a'), /amend/);
});

test('rejects merge parents', () => {
  assert.throws(() => validateLineage('b a,c docs: merge', 'a'), /merge/);
});
