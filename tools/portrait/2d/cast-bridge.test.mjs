import assert from 'node:assert/strict';
import { test } from 'vitest';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { run, castLook, invokeTripo } from '../bin/seoul-character.mjs';
import { slotFields, neutralRecord } from '../neutral-slots.mjs';

test('3D mesh generation exports exact Tripo argv and executes only explicitly', async () => {
  const f = await fixture();
  const lookPath = join(f.dir, 'look.json');
  await writeFile(lookPath, JSON.stringify({ schemaVersion: 2, characterId: f.draft.id, name: f.draft.name }));
  const image = join(f.dir, 'fullbody.png');
  await writeFile(image, 'authored input bytes');
  const outputDir = join(f.dir, 'new-model');
  const args = ['3d-generate', '--cast-id', f.draft.id, '--look', lookPath, '--image', image, '--output-dir', outputDir, '--model', 'specified-model', '--no-wait'];
  const calls = [];
  const backend = { task_id: 'real-task-contract-fixture', status: 'submitted', artifacts: [] };
  const invoke = async (command, argv) => { calls.push({ command, argv }); return backend; };
  const exported = await run(args, { ...f, invoke });
  assert.equal(calls.length, 0);
  assert.equal(exported.execution, 'export-only');
  assert.equal(exported.imageSha256, createHash('sha256').update('authored input bytes').digest('hex'));
  assert.deepEqual(exported.argv, ['generate', 'image-to-model', image, '--out', outputDir, '--json', '--no-open', '--name', f.draft.id, '--model', 'specified-model', '--no-wait']);
  await assert.rejects(readFile(join(outputDir, 'cast.json')), { code: 'ENOENT' });
  const executed = await run([...args, '--execute'], { ...f, invoke });
  assert.deepEqual(calls, [{ command: '/opt/homebrew/bin/tripo', argv: exported.argv }]);
  assert.deepEqual(executed.backend, backend);
  const sidecar = JSON.parse(await readFile(join(outputDir, 'cast.json'), 'utf8'));
  assert.equal(sidecar.characterId, f.draft.id);
  assert.equal(sidecar.imageSha256, exported.imageSha256);
  assert.deepEqual(sidecar.backend, backend);
});
test('Tripo failures are returned unchanged and never produce cast success sidecars', async () => {
  const f = await fixture();
  const look = join(f.dir, 'look.json');
  const image = join(f.dir, 'image.png');
  await writeFile(look, JSON.stringify({ schemaVersion: 2 }));
  await writeFile(image, 'input');
  const output = join(f.dir, 'failed-output');
  const error = Object.assign(new Error('backend credit refusal'), { exitCode: 7 });
  await assert.rejects(run(['3d-generate', '--cast-id', f.draft.id, '--look', look, '--image', image, '--output-dir', output, '--execute'], { ...f, invoke: async () => { throw error; } }), caught => caught === error);
  await assert.rejects(readFile(join(output, 'cast.json')), { code: 'ENOENT' });
  const rendered = await run(['3d-render', '--cast-id', f.draft.id, '--input', 'existing.glb'], f);
  assert.ok(rendered.argv[0].endsWith('/portrait-gen.ts'));
  assert.equal(rendered.binding.characterId, f.draft.id);
});
test('actual process boundary preserves backend JSON stderr and exit code without provider calls', async () => {
  const json = { task_id: 'process-fixture', artifacts: [{ path: 'fixture.glb' }] };
  assert.deepEqual(await invokeTripo(process.execPath, ['-e', 'process.stdout.write(' + JSON.stringify(JSON.stringify(json)) + ')']), json);
  await assert.rejects(invokeTripo(process.execPath, ['-e', 'process.stderr.write("exact backend error");process.exit(9)']), error => error.message === 'exact backend error' && error.exitCode === 9);
});
async function fixture() {
  const base = fileURLToPath(new URL('../../../.omo/evidence/cast-bridge-tests/', import.meta.url));
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base, 'case-'));
  const draft = { id: 'cast-stable', name: 'Test Recipient', gender: '남', attributes: { ST: 99 }, occupation: 'invented stats must not affect look' };
  const path = join(dir, 'draft.json');
  await writeFile(path, JSON.stringify(draft));
  const storePath = join(dir, '.seoul-cast/characters.json');
  await run(['register', '--record', path], { storePath });
  return { dir, draft, path, storePath };
}
test('registration selection and export preserve stable ID without stats-derived appearance', async () => {
  const f = await fixture();
  const before = await readFile(f.storePath, 'utf8');
  const result = await run(['export', '--cast-id', f.draft.id], f);
  assert.equal(result.record.characterId, f.draft.id);
  assert.equal(result.record.name, f.draft.name);
  assert.equal(result.record.identity.gender.value, '남성');
  for (const fields of Object.values(result.record.slots)) for (const trait of Object.values(fields)) assert.equal(trait.value, null);
  assert.equal(await readFile(f.storePath, 'utf8'), before);
  await assert.rejects(run(['register', '--record', f.path], f), /already registered/);
  await assert.rejects(run(['export', '--cast-id', 'missing'], f), /exactly once/);
});
test('sourced face and body stay independent from garment donor under shared cast selection', async () => {
  const f = await fixture();
  const trait = value => ({ value, status: 'art-proposal', source: 'authored-look' });
  const look = { schemaVersion: 2, slots: { face: { description: trait('recipient face') }, hair: { description: trait('recipient hair') }, body: { build: trait('recipient build') }, outfit: { upper: trait('old coat') } } };
  const selected = castLook(f.draft, look);
  const swapped = neutralRecord(selected, { outfit: { upper: trait('donor coat') } });
  for (const slot of ['face', 'body', 'hair']) assert.deepEqual(swapped.slots[slot], selected.slots[slot]);
  assert.deepEqual(swapped.identity, selected.identity);
  assert.throws(() => castLook(f.draft, { ...look, name: 'donor' }), /identity does not match/);
  assert.throws(() => castLook(f.draft, { ...look, identity: { gender: '여성' } }), /identity does not match/);
});
test('2D portrait and full-body route through one emitter while 3D exports its independent route', async () => {
  const f = await fixture();
  const trait = value => ({ value, status: 'art-proposal', source: 'authored-look' });
  const lookPath = join(f.dir, 'look.json');
  await writeFile(lookPath, JSON.stringify({ schemaVersion: 2, slots: { face: { description: trait('face') }, hair: { description: trait('hair') }, outfit: { upper: trait('coat') } } }));
  const reference = join(f.dir, 'reference.png');
  await writeFile(reference, 'style fixture');
  const style = join(f.dir, 'style.json');
  await writeFile(style, JSON.stringify({ schemaVersion: 1, styleId: 'selected', status: 'owner-selected-reference', referenceSha256: createHash('sha256').update('style fixture').digest('hex') }));
  const argumentsFor = mode => [mode, '--cast-id', f.draft.id, '--look', lookPath, '--style', style, '--reference', reference];
  const portrait = await run(argumentsFor('portrait'), f);
  const body = await run(argumentsFor('full-body'), f);
  assert.deepEqual(portrait.slots, body.slots);
  assert.equal(portrait.binding.characterId, body.binding.characterId);
  const model = await run(['3d', '--cast-id', f.draft.id, '--input', 'not-rendered.glb'], f);
  assert.equal(model.pipeline, '3d');
  assert.ok(model.argv[0].endsWith('/bin/portrait-gen.ts'));
  assert.equal(model.binding.characterId, portrait.characterId);
  assert.equal(model.argv.includes('--reference'), false);
});
test('actual CLI help and cast JSON selection share the same isolated local store', async () => {
  const f = await fixture();
  const cli = fileURLToPath(new URL('../bin/seoul-character.mjs', import.meta.url));
  const castCli = fileURLToPath(new URL('../../cast-cli/bin/seoul-cast.js', import.meta.url));
  const execute = (file, args) => new Promise((done, reject) => {
    const child = spawn(process.execPath, [file, ...args], { env: { PATH: '/opt/homebrew/bin:/usr/bin:/bin', HOME: f.dir } });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', value => stdout += value); child.stderr.on('data', value => stderr += value);
    child.on('error', reject); child.on('close', code => code === 0 ? done(stdout) : reject(new Error(stderr)));
  });
  assert.ok((await execute(cli, ['--help'])).includes('full-body'));
  assert.equal(JSON.parse(await execute(castCli, ['get', f.draft.id])).id, f.draft.id);
  assert.equal(JSON.parse(await execute(castCli, ['list', '--json'])).characters[0].id, f.draft.id);
  assert.equal(JSON.parse(await execute(cli, ['export', '--cast-id', f.draft.id])).binding.characterId, f.draft.id);
});

test.each(['valid', 'date', 'age', 'sourceSha', 'pointer', 'missingRoot', 'wrongRoot', 'lookRootCannotReplace', 'unknownRootIgnored'])('operator canonical root crosses direct and fresh CLI boundaries: %s', async boundary => {
  const f = await fixture();
  const canonicalRoot = join(f.dir, 'canonical');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const birthContext = { birthDate: '2090-01-02', age: 36, ageAsOf: '2126-12-31', source: 'synthetic fixture' };
  const draft = { id: 'K1009', name: 'Synthetic Recipient', gender: '남' };
  const registry = JSON.stringify({ persons: [{ id: draft.id, name: draft.name }] });
  const background = JSON.stringify({ content: [{ ko: 'Synthetic authored background.' }] });
  const canonicalContext = { characterId: draft.id, name: draft.name, personId: 'person-1009', registry: { path: 'lore/name-pools/person-id-registry.json', pointer: '/persons/0', sha256: sha(registry) }, background: [{ path: 'lore/characters/card.json', pointer: '/content/0', sha256: sha(background), text: 'Synthetic authored background.' }] };
  const look = { schemaVersion: 2, characterId: draft.id, name: draft.name, personId: canonicalContext.personId, birthContext: structuredClone(birthContext), canonicalContext: structuredClone(canonicalContext), faceMode: { kind: 'unique', variantId: null }, slots: { face: { description: { value: 'Synthetic individual face', status: 'art-proposal', source: 'synthetic fixture' } } } };
  const trait = value => ({ value, status: 'art-proposal', source: 'synthetic fixture' });
  look.slots.hair = { description: trait('Synthetic hair') };
  look.slots.outfit = { upper: trait('Synthetic coat'), lower: trait('Synthetic trousers'), footwear: trait('Synthetic boots') };
  const lookPath = join(f.dir, 'canonical-look.json');
  const reference = join(f.dir, 'synthetic-style.png');
  const style = join(f.dir, 'synthetic-style.json');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4ioAAAAASUVORK5CYII=', 'base64');
  const calls = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    calls.push(req.url);
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/v1/chat/completions') {
      const prompt = JSON.parse(Buffer.concat(chunks)).messages[1].content;
      const ascii = prompt.replace(/[^\x00-\x7f]/g, ch => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
      res.end(JSON.stringify({ choices: [{ message: { content: ascii } }] }));
    } else if (req.url === '/v1/images/edits') {
      assert.equal(req.headers.authorization, undefined);
      const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
      assert.equal(form.get('prompt').includes('serializedRecipientContext='), false);
      assert.equal(form.get('prompt').includes(canonicalContext.registry.sha256), false);
      assert.equal(form.get('prompt').includes(canonicalContext.name), false);
      res.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }] }));
    } else { res.statusCode = 400; res.end('{}'); }
  });
  try {
    for (const folder of ['lore/name-pools', 'lore/characters', 'public/person-details']) await mkdir(join(canonicalRoot, folder), { recursive: true });
    await writeFile(join(canonicalRoot, canonicalContext.registry.path), registry);
    await writeFile(join(canonicalRoot, canonicalContext.background[0].path), background);
    await writeFile(join(canonicalRoot, 'lore/name-pools/cast-birthdays.json'), JSON.stringify({ ageAsOf: birthContext.ageAsOf, people: [{ ...draft, birthDate: birthContext.birthDate }] }));
    await writeFile(join(canonicalRoot, 'public/person-details/person-1009.json'), JSON.stringify({ id: canonicalContext.personId, name: draft.name, detailRoute: '/people/person-1009', familyTree: { personId: draft.id }, ...birthContext }));
    await writeFile(join(f.dir, 'canonical-draft.json'), JSON.stringify(draft));
    await run(['register', '--record', join(f.dir, 'canonical-draft.json')], f);
    await writeFile(reference, png);
    await writeFile(style, JSON.stringify({ styleId: 'synthetic', status: 'owner-selected-reference', referenceSha256: sha(png) }));
    if (boundary === 'date') look.birthContext.birthDate = '2090-02-31';
    if (boundary === 'age') look.birthContext.age++;
    if (boundary === 'sourceSha') look.canonicalContext.background[0].sha256 = '0'.repeat(64);
    if (boundary === 'pointer') look.canonicalContext.background[0].pointer = '/content/9';
    if (boundary === 'lookRootCannotReplace') look.canonicalRoot = canonicalRoot;
    if (boundary === 'unknownRootIgnored') look.canonicalRoot = join(f.dir, 'never-read-unknown-root');
    await writeFile(lookPath, JSON.stringify(look));
    const rootArgs = ['missingRoot', 'lookRootCannotReplace'].includes(boundary) ? [] : ['--canonical-root', boundary === 'wrongRoot' ? join(f.dir, 'wrong-root') : canonicalRoot];
    const argumentsFor = mode => [mode, '--cast-id', draft.id, '--look', lookPath, '--reference', reference, '--style', style, ...rootArgs];
    const succeeds = ['valid', 'unknownRootIgnored'].includes(boundary);
    const rejection = { date: /invalid canonical date/, age: /canonical birth context mismatch/, sourceSha: /canonical source hash mismatch/, pointer: /unresolved canonical pointer/, missingRoot: /authoritative context requires canonicalRoot/, wrongRoot: /ENOENT/, lookRootCannotReplace: /authoritative context requires canonicalRoot/ }[boundary];
    const listening = once(server, 'listening', { signal: AbortSignal.timeout(20000) });
    server.listen(0, '127.0.0.1');
    await listening;
    const env = { PATH: '/opt/homebrew/bin:/usr/bin:/bin', HOME: f.dir, CHARACTER_AI_BASE_URL: `http://127.0.0.1:${server.address().port}/v1`, CHARACTER_AI_IMAGE_MODEL: 'LOCALFAKE', CHARACTER_AI_TRANSLATION_MODEL: 'LOCALFAKE', CHARACTER_AI_API_KEY: '' };
    const cli = fileURLToPath(new URL('../bin/seoul-character.mjs', import.meta.url));
    const execute = args => new Promise((done, reject) => {
      const child = spawn(process.execPath, [cli, ...args], { env, timeout: 20000 });
      let stdout = ''; let stderr = '';
      child.stdout.on('data', value => stdout += value); child.stderr.on('data', value => stderr += value);
      child.on('error', reject); child.on('close', code => done({ code, stdout, stderr }));
    });
    for (const mode of ['portrait', 'full-body']) {
      if (succeeds) {
        const direct = await run(argumentsFor(mode), f);
        assert.deepEqual(direct.canonicalContext, canonicalContext);
        assert.deepEqual(direct.birthContext, birthContext);
        assert.equal(direct.characterId, draft.id);
        assert.equal(direct.name, draft.name);
        assert.equal(direct.canonicalRoot, undefined);
        const exported = await execute(argumentsFor(mode));
        assert.equal(exported.code, 0, exported.stderr);
        assert.deepEqual(JSON.parse(exported.stdout).canonicalContext, canonicalContext);
      } else {
        await assert.rejects(run(argumentsFor(mode), f), rejection);
        const exported = await execute(argumentsFor(mode));
        assert.equal(exported.code, 2);
        assert.match(exported.stderr, rejection);
      }
      const output = join(f.dir, mode + '.png');
      const requested = succeeds ? once(server, 'request', { signal: AbortSignal.timeout(20000) }) : null;
      const generated = await execute([...argumentsFor(mode), '--output', output]);
      assert.equal(generated.code, succeeds ? 0 : 2, generated.stderr);
      if (!succeeds) assert.match(generated.stderr, rejection);
      if (succeeds) {
        await requested;
        assert.deepEqual(await readFile(output), png);
        const request = JSON.parse(await readFile(output + '.request.json', 'utf8'));
        const receipt = JSON.parse(await readFile(output + '.receipt.json', 'utf8'));
        const cast = JSON.parse(await readFile(output + '.cast.json', 'utf8'));
        const context = request.sourceSnapshot.recipientContext;
        assert.deepEqual(context.canonicalContext, canonicalContext);
        assert.deepEqual(context.birthContext, birthContext);
        assert.equal(context.characterId, draft.id);
        assert.equal(context.name, draft.name);
        assert.deepEqual(request.references, [{ index: 1, role: 'style-only', sha256: sha(png) }]);
        assert.deepEqual(receipt.request, request);
        assert.equal(receipt.imageSha256, sha(png));
        assert.equal(cast.imageSha256, sha(png));
        assert.equal(cast.characterId, draft.id);
        assert.equal(cast.name, draft.name);
      } else {
        for (const suffix of ['', '.request.json', '.receipt.json', '.cast.json']) await assert.rejects(readFile(output + suffix), { code: 'ENOENT' });
      }
    }
    assert.deepEqual(calls, succeeds ? ['/v1/images/edits', '/v1/images/edits'] : []);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(f.dir, { recursive: true, force: true });
  }
}, 30000);
