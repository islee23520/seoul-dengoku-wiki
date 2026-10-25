import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyRelationSuccessor, verifyRelationHistoricalProjection } from './relation-successor.mjs';
import { readRelationConfig } from './relation-inputs.mjs';
import { relationFixture } from './relation-successor-fixture.mjs';
const verify = f => verifyRelationSuccessor(f.db, { pin: f.pin, projection: f.current, bootstrapDigest: f.pin.bootstrapDigest });
test('complete representative approved projection resolves without rewriting bootstrap identity', t => {
 const f = relationFixture(t);
 assert.deepEqual(verify(f), f.current);
 assert.equal(f.db.prepare('SELECT config_digest FROM relation_input_metadata').get().config_digest, f.pin.bootstrapDigest);
});
for (const [name, sql] of [
 ['missing source', 'DELETE FROM relation_input_metadata; DELETE FROM source_file'],
 ['wrong source', "UPDATE source_file SET sha256='wrong'"],
 ['changed archive bytes', "UPDATE source_file SET raw_bytes=x'7b7d'"],
 ['missing head', 'DELETE FROM data_source_head'],
 ['wrong head revision', "UPDATE data_source_head SET revision_id='wrong'"],
 ['missing current identity', 'DELETE FROM data_source_current'],
 ['wrong current revision', "UPDATE data_source_current SET revision_id='wrong'"],
 ['missing revision authority', 'DELETE FROM data_source_revision WHERE sequence=1'],
 ['missing parent authority', 'DELETE FROM data_source_revision WHERE sequence=0'],
 ['wrong parent', "UPDATE data_source_revision SET parent_revision='wrong' WHERE sequence=1"],
 ['cross source parent', "UPDATE data_source_revision SET source_path='other' WHERE sequence=0"],
 ['wrong approval', "UPDATE data_source_revision SET approval_ref='unapproved' WHERE sequence=1"],
 ['wrong head semantic', "UPDATE data_source_revision SET semantic_sha256='wrong' WHERE sequence=1"],
 ['wrong baseline approval', "UPDATE data_source_revision SET approval_ref='unapproved' WHERE sequence=0"],
 ['changed reason', "UPDATE data_source_revision SET reason='unapproved' WHERE sequence=1"],
 ['nonincreasing sequence', 'UPDATE data_source_revision SET sequence=0 WHERE sequence=1'],
 ['wrong current body', "UPDATE data_source_current SET document_json='{}'"],
]) test('relation successor rejects ' + name, t => {
 const f = relationFixture(t); f.db.exec(sql);
 assert.throws(() => verify(f), { code: 'E_RELATION_SUCCESSOR' });
});
test('complete projection rejects an unrelated typed field change', t => {
 const f = relationFixture(t); f.current.organizations[0].name = 'unapproved';
 assert.throws(() => verify(f), { code: 'E_RELATION_SUCCESSOR' });
});
test('independent source and semantic pins cannot be replaced by a consistent stored head', t => {
 const f = relationFixture(t); f.pin.semanticSha256 = '0'.repeat(64);
 assert.throws(() => verify(f), { code: 'E_RELATION_SUCCESSOR' });
});
test('bootstrap semantic identity remains a separate unchanged anchor', t => {
 const f = relationFixture(t);
 assert.throws(() => verifyRelationSuccessor(f.db, {
  pin: f.pin, projection: f.current, bootstrapDigest: '0'.repeat(64),
 }), { code: 'E_RELATION_SUCCESSOR' });
});
test('a different selected revision cannot pass even with the same current semantic', t => {
 const f = relationFixture(t); f.pin.revision = '0'.repeat(64);
 assert.throws(() => verify(f), { code: 'E_RELATION_SUCCESSOR' });
});
test('the selected parent cannot be substituted', t => {
 const f = relationFixture(t); f.pin.parent = '0'.repeat(64);
 assert.throws(() => verify(f), { code: 'E_RELATION_SUCCESSOR' });
});
test('original import reconstruction remains exact with no successor head', t => {
 const f = relationFixture(t); f.db.exec('DROP TABLE data_source_head');
 assert.deepEqual(readRelationConfig(f.db), f.original);
});
test('unapproved typed drift retains original config digest rejection without a head', t => {
 const f = relationFixture(t); f.db.exec("DELETE FROM data_source_head;UPDATE context_court SET polity_id='S02' WHERE court_id='court:K1008'");
 assert.throws(() => readRelationConfig(f.db), { code: 'E_RELATION_INPUT_COVERAGE' });
});
test('synthetic successor cannot replace the fixed production approval', t => {
 const f = relationFixture(t); f.db.exec("UPDATE context_court SET polity_id='S02' WHERE court_id='court:K1008'");
 assert.throws(() => readRelationConfig(f.db), { code: 'E_RELATION_SUCCESSOR' });
});
test('historical comparison accepts only complete one-field reversal and leaves original bytes untouched', t => {
 const f = relationFixture(t), before = Buffer.from(f.bytes);
 verifyRelationHistoricalProjection(f.current, f.original);
 assert.deepEqual(f.bytes, before);
});
test('historical comparison rejects unrelated successor edits', t => {
 const f = relationFixture(t); f.current.note = 'extra';
 assert.throws(() => verifyRelationHistoricalProjection(f.current, f.original), { code: 'E_RELATION_SUCCESSOR' });
});
