import assert from 'node:assert/strict';
import { test } from 'vitest';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { emit, generationRequest } from './emit-character-prompt.mjs';
import { digest, inspectBatchCandidate, runBatchCandidate } from './batch-resume.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const evidence = fileURLToPath(new URL('../../../.omo/evidence/batch-resume-authority-tests/', import.meta.url));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const proof = { commands: [], scenarios: [], cleanup: [] };
const invoke = (argv, env) => new Promise((done, reject) => {
  const child = spawn(process.execPath, argv, { env, timeout: 15000 });
  let stdout = '', stderr = '';
  child.stdout.on('data', b => { stdout += b; }); child.stderr.on('data', b => { stderr += b; });
  child.once('error', reject);
  child.once('close', (code, signal) => { const row = { argv, envKeys: Object.keys(env), pid: child.pid, code, signal, stdout, stderr }; proof.commands.push(row); done(row); });
});
for (const birthOnly of [false, true]) test('bound candidate checks current authority' + (birthOnly ? ' with birth-only context' : ''), async () => {
  await mkdir(evidence, { recursive: true });
  const dir = await mkdtemp(join(evidence, 'run-'));
  const canonicalRoot = join(dir, 'canonical');
  let record, plan, runner;
  if (process.env.PORTRAIT_RESUME_PLAN) {
    runner = await import(pathToFileURL(process.env.PORTRAIT_RESUME_RUNNER));
    plan = await runner.loadPlan(process.env.PORTRAIT_RESUME_PLAN);
    record = structuredClone(plan.batches[0].records.find(r => r.characterId === 'K027'));
    for (const p of new Set(['lore/name-pools/cast-birthdays.json', 'lore/name-pools/person-id-registry.json', 'public/person-details/' + record.personId + '.json', ...record.canonicalContext.background.map(s => s.path)])) {
      await mkdir(dirname(join(canonicalRoot, p)), { recursive: true });
      await writeFile(join(canonicalRoot, p), await readFile(join(plan.canonicalRoot, p)));
    }
  } else {
    record = JSON.parse(await readFile(join(here, 'characters/shin-jongmok.json')));
    Object.assign(record, { characterId: 'K027', name: 'Fixture K027', personId: 'person-0027', faceMode: { kind: 'unique', variantId: null }, identity: { characterId: 'K027', name: 'Fixture K027' }, birthContext: { birthDate: '2090-01-02', age: 36, ageAsOf: '2126-12-31', source: 'authored fixture' } });
    const registry = JSON.stringify({ persons: [{ id: record.characterId, name: record.name }] });
    const background = JSON.stringify({ content: ['Authored fixture context'] });
    record.canonicalContext = { characterId: record.characterId, name: record.name, personId: record.personId, registry: { path: 'lore/name-pools/person-id-registry.json', pointer: '/persons/0', sha256: digest(registry) }, background: [{ path: 'lore/characters/fixture.json', pointer: '/content/0', sha256: digest(background), text: 'Authored fixture context' }] };
    const docs = { 'lore/name-pools/person-id-registry.json': registry, 'lore/characters/fixture.json': background, 'lore/name-pools/cast-birthdays.json': JSON.stringify({ ageAsOf: record.birthContext.ageAsOf, people: [{ id: record.characterId, name: record.name, birthDate: record.birthContext.birthDate }] }), ['public/person-details/' + record.personId + '.json']: JSON.stringify({ id: record.personId, name: record.name, detailRoute: '/people/' + record.personId, familyTree: { personId: record.characterId }, ...record.birthContext }) };
    for (const [p, bytes] of Object.entries(docs)) { await mkdir(dirname(join(canonicalRoot, p)), { recursive: true }); await writeFile(join(canonicalRoot, p), bytes); }
  }
  if (birthOnly) delete record.canonicalContext;
  const birthdayPath = join(canonicalRoot, 'lore/name-pools/cast-birthdays.json');
  const detailPath = join(canonicalRoot, 'public/person-details/' + record.personId + '.json');
  const registryPath = join(canonicalRoot, 'lore/name-pools/person-id-registry.json');
  const originals = new Map(await Promise.all([birthdayPath, detailPath, registryPath].map(async p => [p, await readFile(p)])));
  const stylePath = join(dir, 'style.json'), referencePath = join(dir, 'style.png');
  await writeFile(referencePath, png);
  await writeFile(stylePath, JSON.stringify({ styleId: 'local-fixture', status: 'owner-selected-reference', referenceSha256: digest(png) }));
  let posts = 0, port;
  const fake = createServer(async (req, res) => {
    const chunks = []; for await (const b of req) chunks.push(b);
    posts++; res.setHeader('Content-Type', 'application/json');
    if (req.url === '/v1/chat/completions') {
      const text = JSON.parse(Buffer.concat(chunks)).messages[1].content;
      res.end(JSON.stringify({ choices: [{ message: { content: text.replace(/[^\x00-\x7f]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) } }] }));
    } else {
      assert.equal(req.url, '/v1/images/edits');
      const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
      const visual = form.get('prompt');
      for (const value of ['serializedRecipientContext=', record.name, record.canonicalContext?.registry.path, record.canonicalContext?.registry.sha256, ...(record.canonicalContext?.background ?? []).map(item => item.text)].filter(Boolean)) assert.equal(visual.includes(value), false);
      res.end(JSON.stringify({ data: [{ b64_json: png.toString('base64') }] }));
    }
  });
  try {
    const listening = once(fake, 'listening', { signal: AbortSignal.timeout(5000) }); fake.listen(0, '127.0.0.1'); await listening; port = fake.address().port;
    const env = { PATH: process.env.PATH, HOME: dir, LANG: 'C.UTF-8', CHARACTER_AI_BASE_URL: 'http://127.0.0.1:' + port + '/v1', CHARACTER_AI_API_KEY: '', CHARACTER_AI_IMAGE_MODEL: 'LOCALFAKE', CHARACTER_AI_TRANSLATION_MODEL: 'LOCALFAKE' };
    const input = { character: record, canonicalRoot, mode: 'portrait', stylePath, referencePath, ...(plan ? { faceVariantCatalogPath: plan.faceVariantCatalogPath } : {}) };
    const buildRequest = async (row, output) => generationRequest(await emit({ ...input, character: row }), { output });
    const imagePath = join(dir, 'batches/batch-001/candidates/K027-current.png'), inputPath = imagePath + '.input.json';
    const options = { record, canonicalRoot, imagePath, inputPath };
    const provider = async request => { const result = await invoke(request.argv, env); assert.equal(result.code, 0, result.stderr); };
    const first = await runBatchCandidate({ ...options, buildRequest, provider });
    assert.equal(first.status, 'generated'); assert.equal(first.reused, false);
    const request = JSON.parse(await readFile(imagePath + '.request.json'));
    assert.deepEqual(request.sourceSnapshot.recipientContext.birthContext, record.birthContext);
    if (!birthOnly) assert.deepEqual(request.sourceSnapshot.recipientContext.canonicalContext, record.canonicalContext);
    const immutable = new Map(await Promise.all([imagePath, inputPath, imagePath + '.request.json', imagePath + '.receipt.json', imagePath + '.resume.json'].map(async p => [p, await readFile(p)])));
    const initialPosts = posts;
    const bindingPath = imagePath + '.resume.json';
    const originalBinding = JSON.parse(await readFile(bindingPath));
    originalBinding.binding.transmittedPromptSha256 = '0'.repeat(64);
    await writeFile(bindingPath, JSON.stringify(originalBinding));
    assert.equal((await inspectBatchCandidate(options)).reason, 'transmitted-prompt-binding-mismatch');
    await writeFile(bindingPath, immutable.get(bindingPath));
    assert.equal((await runBatchCandidate({ ...options, buildRequest, provider })).reused, true);
    assert.equal(posts, initialPosts);
    const mini = plan ? { ...plan, canonicalRoot, batchRoot: join(dir, 'batches'), batches: [{ ...plan.batches[0], records: [record], people: [plan.batches[0].people.find(p => p.id === 'K027')] }] } : null;
    if (mini) { assert.equal((await runner.inventory(mini)).batches[0].counts.generated, 1); assert.equal((await runner.runSelected(mini, { batchId: 'batch-001', characterId: 'K027', suffix: 'unused', provider })).candidate.reused, true); }
    const mutations = [
      ['ledger-date', birthdayPath, doc => { doc.people.find(p => p.id === 'K027').birthDate = '2070-11-28'; }],
      ['reference-date', birthdayPath, doc => { doc.ageAsOf = '2127-12-31'; }],
      ['ledger-K', birthdayPath, doc => { doc.people.find(p => p.id === 'K027').id = 'K9999'; }],
      ['ledger-name', birthdayPath, doc => { doc.people.find(p => p.id === 'K027').name = 'Changed'; }],
      ['invalid-date', birthdayPath, doc => { doc.people.find(p => p.id === 'K027').birthDate = '2090-02-30'; }],
      ['registry-K', registryPath, doc => { doc.persons.find(p => p.id === 'K027').id = 'K9999'; }],
      ['registry-name', registryPath, doc => { doc.persons.find(p => p.id === 'K027').name = 'Changed'; }],
      ['detail-route', detailPath, doc => { doc.detailRoute = '/people/person-9999'; }],
      ['detail-K', detailPath, doc => { doc.familyTree.personId = 'K9999'; }],
      ['detail-name', detailPath, doc => { doc.name = 'Changed'; }],
      ['detail-date', detailPath, doc => { doc.birthDate = '2070-11-28'; }],
      ['detail-age', detailPath, doc => { doc.age++; }],
      ['detail-reference-date', detailPath, doc => { doc.ageAsOf = '2127-12-31'; }],
    ];
    const token = join(dir, 'record.json'); await writeFile(token, JSON.stringify(record));
    for (const [kind, path, mutate] of mutations) {
      for (const [p, bytes] of originals) await writeFile(p, bytes);
      const doc = JSON.parse(originals.get(path)); mutate(doc); await writeFile(path, JSON.stringify(doc));
      const config = join(dir, 'inspect.json'); await writeFile(config, JSON.stringify(options));
      const emitted = await invoke([join(here, 'emit-character-prompt.mjs'), '--character', token, '--canonical-root', canonicalRoot, '--mode', 'portrait', '--reference', referencePath, '--style', stylePath, ...(plan ? ['--face-catalog', plan.faceVariantCatalogPath] : [])], env);
      assert.equal(emitted.code, 2, kind);
      const inspected = await invoke([join(here, 'batch-resume-cli.mjs'), config], env);
      assert.equal(inspected.code, 0, inspected.stderr);
      const stage = JSON.parse(inspected.stdout);
      proof.scenarios.push({ birthOnly, kind, sourcePath: path, sourceSHA: digest(await readFile(path)), emitted, inspected: stage, providerPostsAfterMutation: posts - initialPosts });
      assert.equal(stage.status, 'unverified', kind); assert.equal(stage.requiresNewSuffix, true, kind);
      assert.equal((await inspectBatchCandidate(options)).status, 'unverified', kind);
      await assert.rejects(runBatchCandidate({ ...options, buildRequest, provider }), /new candidate suffix/);
      if (mini) {
        const state = await runner.inventory(mini);
        assert.equal(state.batches[0].counts.generated, 0, kind); assert.equal(state.batches[0].counts.unverified, 1, kind);
        await assert.rejects(runner.runSelected(mini, { batchId: 'batch-001', characterId: 'K027', suffix: 'current', provider }), /new candidate suffix/);
        await assert.rejects(runner.runSelected(mini, { batchId: 'batch-001', characterId: 'K027', suffix: 'fresh-' + kind, provider }));
        proof.scenarios.at(-1).inventory = state.batches[0].counts;
      }
      assert.equal(posts, initialPosts, kind);
      for (const [p, bytes] of immutable) assert.deepEqual(await readFile(p), bytes, kind);
    }
    for (const [p, bytes] of originals) await writeFile(p, bytes);
    assert.equal((await runBatchCandidate({ ...options, buildRequest, provider })).reused, true);
    assert.equal(posts, initialPosts);
    await rm(imagePath + '.resume.json');
    assert.equal((await inspectBatchCandidate(options)).reason, 'legacy-unbound-candidate');
  } finally {
    await new Promise(done => { fake.close(done); fake.closeAllConnections(); });
    if (port) await assert.rejects(fetch('http://127.0.0.1:' + port, { signal: AbortSignal.timeout(1000) }));
    const pids = proof.commands.map(row => row.pid).map(pid => { try { process.kill(pid, 0); return { pid, absent: false }; } catch (e) { return { pid, absent: e.code === 'ESRCH' }; } });
    assert.ok(pids.every(p => p.absent));
    await rm(dir, { recursive: true, force: true });
    proof.cleanup.push({ dir, removed: true, port, portAbsent: true, pids });
    console.log('AUTHORITY_PROOF ' + JSON.stringify(proof));
  }
});
