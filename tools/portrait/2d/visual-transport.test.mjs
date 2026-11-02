import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createHash } from 'node:crypto';
import { visualInstruction, recipientContext, validateVisualSnapshot, englishGenerationPrompt } from './cliproxy-edit.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const context = { characterId: 'K027', name: '원문성명', birthContext: { birthDate: '2090-01-02', age: 36, ageAsOf: '2126-12-31' }, canonicalContext: { name: '원문성명', registry: { path: 'lore/registry.json', sha256: 'a'.repeat(64) }, background: [{ text: '원문인용', path: 'lore/card.json', sha256: 'b'.repeat(64) }] }, excerpts: ['원문인용'] };
const visual = 'Image 1 technique-only; Image 2 face-base-only. face.eyeColor: brown; face.lipColor: muted rose; face.beardShape: none; hair.description: short black; body.skin: warm brown; outfit.upper: navy jacket;';
const source = 'Recipient context is metadata, not appearance.' + String.fromCharCode(10) + 'serializedRecipientContext=' + JSON.stringify(context) + String.fromCharCode(10) + visual;
function request() { return { prompt: visual, sourceSnapshot: { prompt: source, promptSha256: hash(source), recipientContext: context }, visualSnapshot: { sourceVisualPrompt: visual, sourceVisualPromptSha256: hash(visual), transmittedPrompt: visual, transmittedPromptSha256: hash(visual), provenance: 'untranslated-visual-instruction' } }; }
test('source removal preserves authored field values and private source exactly', () => {
 assert.equal(visualInstruction(source), visual);
 assert.deepEqual(recipientContext(source), context);
 for (const value of [context.name, 'serializedRecipientContext=', 'lore/card.json', 'a'.repeat(64), '原文']) assert.equal(visualInstruction(source).includes(value), false);
 assert.doesNotThrow(() => validateVisualSnapshot(request()));
});
test.each(['sourcePrompt', 'sourceContext', 'derivedMissing', 'derivedHash', 'transmitted', 'transmittedHash'])('new snapshot rejects %s tampering', kind => {
 const r = structuredClone(request());
 if (kind === 'sourcePrompt') r.sourceSnapshot.prompt += 'changed';
 if (kind === 'sourceContext') r.sourceSnapshot.recipientContext.name = 'changed';
 if (kind === 'derivedMissing') delete r.visualSnapshot.sourceVisualPrompt;
 if (kind === 'derivedHash') r.visualSnapshot.sourceVisualPromptSha256 = 'c'.repeat(64);
 if (kind === 'transmitted') r.prompt += 'changed';
 if (kind === 'transmittedHash') r.visualSnapshot.transmittedPromptSha256 = 'c'.repeat(64);
 assert.throws(() => validateVisualSnapshot(r));
});
test('legacy requests without new snapshot retain historical compatibility', () => assert.doesNotThrow(() => validateVisualSnapshot({ prompt: source })));
test('malformed or duplicate canonical context is rejected during derivation', () => {
 assert.throws(() => visualInstruction('serializedRecipientContext={invalid}' + String.fromCharCode(10) + visual));
 assert.throws(() => visualInstruction(source + String.fromCharCode(10) + 'serializedRecipientContext={}'));
});
test('translated visual slots cannot disappear or change already-English values', async () => {
 await assert.rejects(englishGenerationPrompt(visual + ' 남성', async () => 'Image 1 only'), /slot fields/);
 await assert.rejects(englishGenerationPrompt(visual + ' 남성', async () => visual.replace('warm brown', 'pale') + ' male'), /slot association/);
});
test('source reintroduction is rejected even with self-consistent transmitted hashes', () => {
 const r = request();
 r.prompt += ' lore/card.json';
 r.visualSnapshot.transmittedPrompt = r.prompt;
 r.visualSnapshot.transmittedPromptSha256 = hash(r.prompt);
 assert.throws(() => validateVisualSnapshot(r), /metadata leaked/);
});
test('name collision inside an authored slot is rejected without silent substitution', () => {
 const prompt = source + '; accessories.description: 원문성명 pendant';
 assert.throws(() => visualInstruction(prompt), /metadata leaked/);
 assert.deepEqual(recipientContext(prompt), context);
 assert.ok(prompt.includes('accessories.description: 원문성명 pendant'));
});
test.each(['null', '{}', '[]', ''])('invalid context %s has explicit boundary error', value => {
 assert.throws(() => visualInstruction('serializedRecipientContext=' + value + String.fromCharCode(10) + visual), /invalid recipient context/);
});
