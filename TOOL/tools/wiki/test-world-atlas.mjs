import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { materializeWorldAtlas } from './materialize-world-atlas.mjs';
import { extractAtlasJson, extractDiagrams } from './world-atlas-parse.mjs';
import { projectionsFromAtlas } from './world-atlas-render.mjs';
import {
  assertIsometricSvgContracts,
  collectSvgIds,
  findGeometryViolations,
} from './world-atlas-isometric.mjs';
import { ISOMETRIC_DIAGRAM_ASSETS } from './world-atlas-schema.mjs';

const verifier = fileURLToPath(new URL('./verify-world-expansion.mjs', import.meta.url));
const repositoryRoot = resolve(dirname(verifier), '..', '..', '..');
const liveDocs = join(repositoryRoot, 'LORE');
const wikiAssets = join(repositoryRoot, 'GAME-REFERENCE', 'assets', 'wiki');
const atlasPath = join(liveDocs, 'World-Narrative-Atlas.md');
const fixtures = [];

function cloneLiveDocs(dir) {
  const docs = join(dir, 'docs', 'game-logic');
  mkdirSync(docs, { recursive: true });
  mkdirSync(join(dir, '.omo', 'research-private'), { recursive: true });
  mkdirSync(join(dir, 'GDD'), { recursive: true });
  cpSync(liveDocs, docs, { recursive: true });
  cpSync(
    join(repositoryRoot, '.omo', 'research-private', 'nippon-sangoku-canon-bridge.md'),
    join(dir, '.omo', 'research-private', 'nippon-sangoku-canon-bridge.md'),
  );
  for (const name of ['Unofficial-Fan-AU-Notice.md', 'Research-Sources.md']) {
    cpSync(join(repositoryRoot, 'GDD', name), join(dir, 'GDD', name));
  }
  return docs;
}

after(async () => {
  for (const dir of fixtures) await rm(dir, { recursive: true, force: true });
});

function runVerifier(args) {
  const result = spawnSync(process.execPath, [verifier, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

test('Given current repository When houses stage Then atlas has 32 houses and Operating-Houses projection', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'houses', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given current repository When theaters stage Then five theaters and External-Theaters projection', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'theaters', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given current repository When synthetics stage Then 48 synthetics and Synthetic-Actors projection', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'synthetics', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given current repository When story-manifest stage Then 47 batches locked', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'story-manifest', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given current repository When monster-manifest stage Then 27 groups and 432 entries', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'monster-manifest', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given current repository When seeds stage Then arcs cover houses theaters classes groups', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'seeds', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given a real company mark in theater prose When theaters stage Then source canon allows it (rename seam)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-theater-token-'));
  fixtures.push(dir);
  const docs = cloneLiveDocs(dir);
  const atlas = join(docs, 'World-Narrative-Atlas.md');
  const text = await readFile(atlas, 'utf8');
  await writeFile(atlas, text.replace('귀환 명부를 손전등 빛에 비춘다', '삼성전자 귀환 명부를 손전등 빛에 비춘다'));
  const result = runVerifier(['--docs', docs, '--stage', 'theaters', '--atlas', atlas]);
  assert.equal(result.code, 0, result.stderr);
});

test('Given a real company mark in house prose When houses stage Then source canon allows it (rename seam)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-house-token-'));
  fixtures.push(dir);
  const docs = cloneLiveDocs(dir);
  const atlas = join(docs, 'World-Narrative-Atlas.md');
  const text = await readFile(atlas, 'utf8');
  await writeFile(atlas, text.replace('야간 냉각 분배', '삼성전자 냉각 분배'));
  const result = runVerifier(['--docs', docs, '--stage', 'houses', '--atlas', atlas]);
  assert.equal(result.code, 0, result.stderr);
});

test('Given two materializer --check runs When generated projections are unchanged Then hashes match', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-check-hash-'));
  fixtures.push(dir);
  const written = await materializeWorldAtlas({ atlasPath, outDir: dir, check: false });
  const first = await materializeWorldAtlas({ atlasPath, outDir: dir, check: true });
  const second = await materializeWorldAtlas({ atlasPath, outDir: dir, check: true });
  assert.deepEqual(first.hashes, written.hashes);
  assert.deepEqual(second.hashes, first.hashes);
  assert.equal(first.atlasHash, written.atlasHash);
});

test('Given a mutated projection When materializer --check Then nonzero', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-house-check-'));
  fixtures.push(dir);
  const result = await materializeWorldAtlas({ atlasPath, outDir: dir, check: false });
  const target = join(dir, 'Operating-Houses.md');
  const body = await readFile(target, 'utf8');
  await writeFile(target, `${body}\n손댐\n`);
  await assert.rejects(
    () => materializeWorldAtlas({ atlasPath, outDir: dir, check: true }),
    /stale Operating-Houses.md/,
  );
  assert.ok(result.hashes['Operating-Houses.md']);
});

test('Given extra M999 B099 G99 files When materializer --check Then nonzero names each unexpected projection', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-extra-proj-'));
  fixtures.push(dir);
  await materializeWorldAtlas({ atlasPath, outDir: dir, check: false });
  await writeFile(join(dir, 'Monster-Batch-M999.md'), '# extra monster\n');
  await writeFile(join(dir, 'Story-Batch-B099.md'), '# extra story\n');
  await writeFile(join(dir, 'Hostile-Group-G99.md'), '# extra group\n');
  await assert.rejects(
    () => materializeWorldAtlas({ atlasPath, outDir: dir, check: true }),
    (err) => {
      const message = String(err?.message ?? err);
      assert.match(message, /unexpected Monster-Batch-M999\.md/);
      assert.match(message, /unexpected Story-Batch-B099\.md/);
      assert.match(message, /unexpected Hostile-Group-G99\.md/);
      return true;
    },
  );
  await unlink(join(dir, 'Monster-Batch-M999.md'));
  await unlink(join(dir, 'Story-Batch-B099.md'));
  await unlink(join(dir, 'Hostile-Group-G99.md'));
  const ok = await materializeWorldAtlas({ atlasPath, outDir: dir, check: true });
  assert.ok(ok.hashes['Operating-Houses.md']);
  assert.equal(ok.hashes['Monster-Batch-M999.md'], undefined);
});

test('Given an altered projected confirmed Monster-Batch-M001 When materializer --check Then it is stale, not unexpected', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-confirmed-monster-'));
  fixtures.push(dir);
  await materializeWorldAtlas({ atlasPath, outDir: dir, check: false });
  await writeFile(join(dir, 'Monster-Batch-M001.md'), '# altered confirmed projection\n');
  await assert.rejects(
    () => materializeWorldAtlas({ atlasPath, outDir: dir, check: true }),
    (err) => {
      const message = String(err?.message ?? err);
      assert.match(message, /stale Monster-Batch-M001\.md/);
      assert.doesNotMatch(message, /unexpected Monster-Batch-M001\.md/);
      return true;
    },
  );
});

test('Given live docs When materializer --check Then confirmed monster copies are not unexpected', async () => {
  try {
    const ok = await materializeWorldAtlas({
      atlasPath,
      outDir: liveDocs,
      check: true,
    });
    assert.ok(ok.hashes['Operating-Houses.md']);
    assert.match(ok.hashes['Monster-Batch-M001.md'] ?? '', /^[0-9a-f]{64}$/);
    assert.match(ok.hashes['Monster-Batch-M039.md'] ?? '', /^[0-9a-f]{64}$/);
  } catch (err) {
    const message = String(err?.message ?? err);
    assert.doesNotMatch(message, /unexpected Monster-Batch-M001\.md/);
    assert.doesNotMatch(message, /unexpected Monster-Batch-M039\.md/);
    throw err;
  }
});

test('Given canonical G19 and G24 records When projecting atlas Then group pages are emitted', () => {
  const canonical = (id, name) => ({
    id,
    display_name: name,
    dossier_prose: `${id} 정본 도씨에 본문`,
    scenario_outlines: [
      {
        id: `${id}S1`,
        title: '촉발',
        stage: 1,
        trigger: 'trigger',
        actors: ['HC01', 'K001', 'F01'],
        mechanism: 'mechanism',
        choices: ['a', 'b', 'c'],
        outcomes: 'outcomes',
        moral_cost: 'cost',
        dossier_ref: id,
      },
    ],
  });
  const files = projectionsFromAtlas({
    hostile_groups: [
      canonical('G19', '식각수색인균체'),
      canonical('G24', '의료조직기계군'),
    ],
  }, 'canonical-g19');
  assert.match(files['Hostile-Group-G19.md'], /^# G19 · /m);
  assert.match(files['Hostile-Group-G24.md'], /^# G24 · /m);
});

test('Given seed-only G19 When projecting atlas Then Hostile-Group-G19.md is absent', () => {
  const files = projectionsFromAtlas({
    hostile_groups: [{
      id: 'G19',
      display_name: '식각수색인균체',
      prose: '식 필드만 있는 개발 레코드',
    }],
  }, 'seed-g19');
  assert.equal(files['Hostile-Group-G19.md'], undefined);
});

const CONFIRMED_STORY_BATCHES = Object.freeze([
  'B001', 'B002', 'B003', 'B004', 'B005', 'B006', 'B007', 'B008', 'B009', 'B010',
  'B011', 'B012', 'B013', 'B014', 'B015', 'B016', 'B018', 'B019', 'B021', 'B022',
  'B023', 'B024', 'B025', 'B026', 'B027', 'B028', 'B029', 'B030', 'B031', 'B032',
  'B033', 'B034', 'B035', 'B036', 'B037', 'B038', 'B039', 'B040', 'B041', 'B042',
  'B043', 'B044', 'B045', 'B046', 'B047',
]);

for (const batchId of CONFIRMED_STORY_BATCHES) {
  test(`Given current repository When story-batch ${batchId} Then ten stories and projection`, () => {
    const result = runVerifier(['--docs', liveDocs, '--stage', 'story-batch', '--batch', batchId, '--atlas', atlasPath]);
    assert.equal(result.code, 0, result.output);
  });
}

test('Given two B001 actors sharing a long sentence When story-batch Then E_DUPLICATE_SENTENCE', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-story-dup-'));
  fixtures.push(dir);
  const docs = cloneLiveDocs(dir);
  const atlas = join(docs, 'World-Narrative-Atlas.md');
  const markdown = await readFile(atlas, 'utf8');
  const parsed = extractAtlasJson(markdown);
  assert.equal(parsed.ok, true, parsed.error);
  const shared = '같은 생존 문장이 두 배우의 서로 다른 장면에 반복되어 붙는다.';
  const left = parsed.value.story_contents.B001.actors[0];
  const right = parsed.value.story_contents.B001.actors[1];
  left.sections['생존 전환점'] = `${left.sections['생존 전환점'].trim()} ${shared}`;
  right.sections['현재 지위'] = `${right.sections['현재 지위'].trim()} ${shared}`;
  await writeFile(atlas, markdown.replace(/```json\s*[\s\S]*?```/, `\`\`\`json\n${JSON.stringify(parsed.value, null, 2)}\n\`\`\``));
  const result = runVerifier(['--docs', docs, '--stage', 'story-batch', '--batch', 'B001', '--atlas', atlas]);
  assert.equal(result.code, 1, result.output);
  assert.match(result.stderr, /^E_DUPLICATE_SENTENCE:/m);
});

test('Given current G01-G06 When monster-manifest Then dossiers and outlines verify', () => {
  const result = runVerifier(['--docs', liveDocs, '--stage', 'monster-manifest', '--atlas', atlasPath]);
  assert.equal(result.code, 0, result.output);
});

test('Given generated G01-G12 group pages When read Then scenario headings exist', async () => {
  const atlas = extractAtlasJson(await readFile(atlasPath, 'utf8')).value;
  for (const group of atlas.hostile_groups.filter((row) => /^G(?:0[1-9]|1[0-2])$/.test(row.id))) {
    const page = await readFile(join(liveDocs, `Hostile-Group-${group.id}.md`), 'utf8');
    assert.equal((group.scenario_outlines ?? []).length, 3, group.id);
    for (const scenario of group.scenario_outlines) {
      assert.match(page, new RegExp(`^### ${scenario.id} · ${scenario.title}$`, 'm'));
    }
  }
});

test('Given missing G13 dossier prose When group-dossiers stage Then E_GROUP_DOSSIER', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-group-dossier-'));
  fixtures.push(dir);
  const docs = cloneLiveDocs(dir);
  const atlas = join(docs, 'World-Narrative-Atlas.md');
  const markdown = await readFile(atlas, 'utf8');
  const parsed = extractAtlasJson(markdown);
  assert.equal(parsed.ok, true, parsed.error);
  const group = parsed.value.hostile_groups.find((row) => row.id === 'G13');
  assert.ok(group, 'G13 missing');
  delete group.dossier_prose;
  await writeFile(atlas, markdown.replace(/```json\s*[\s\S]*?```/, `\`\`\`json\n${JSON.stringify(parsed.value, null, 2)}\n\`\`\``));
  const result = runVerifier([
    '--docs', docs,
    '--stage', 'group-dossiers',
    '--groups', 'G13,G14,G15,G16,G17,G18',
    '--atlas', atlas,
  ]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^E_GROUP_DOSSIER: G13$/m);
});

test('Given G13-G18 dossiers When group-dossiers stage Then IDs scenarios and projections are distinct and complete', async () => {
  const result = runVerifier([
    '--docs', liveDocs,
    '--stage', 'group-dossiers',
    '--groups', 'G13,G14,G15,G16,G17,G18',
    '--atlas', atlasPath,
  ]);
  assert.equal(result.code, 0, result.output);
  const markdown = await readFile(atlasPath, 'utf8');
  const parsed = extractAtlasJson(markdown);
  assert.equal(parsed.ok, true, parsed.error);
  const groups = parsed.value.hostile_groups.filter((group) => /^G1[3-8]$/.test(group.id));
  assert.deepEqual(groups.map((group) => group.id), ['G13', 'G14', 'G15', 'G16', 'G17', 'G18']);
  assert.equal(new Set(groups.map((group) => group.dossier_prose)).size, 6);
  for (const group of groups) {
    assert.notEqual(group.dossier_prose, group.prose, `${group.id} dossier must not copy short prose`);
    for (const scenario of group.scenario_links) {
      assert.match(group.dossier_prose, new RegExp(`^### ${scenario} · `, 'm'));
    }
    const page = await readFile(join(liveDocs, `Hostile-Group-${group.id}.md`), 'utf8');
    assert.match(page, new RegExp(`^# ${group.id} · ${group.display_name}$`, 'm'));
    assert.ok(page.includes(group.dossier_prose));
  }
});

test('Given missing G01 adaptation When monster-manifest stage Then E_GROUP_ADAPTATION', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-group-adaptation-'));
  fixtures.push(dir);
  const docs = cloneLiveDocs(dir);
  const atlas = join(docs, 'World-Narrative-Atlas.md');
  const markdown = await readFile(atlas, 'utf8');
  const parsed = extractAtlasJson(markdown);
  assert.equal(parsed.ok, true, parsed.error);
  delete parsed.value.hostile_groups[0].adaptation;
  await writeFile(atlas, markdown.replace(/```json\s*[\s\S]*?```/, `\`\`\`json\n${JSON.stringify(parsed.value, null, 2)}\n\`\`\``));
  const result = runVerifier(['--docs', docs, '--stage', 'monster-manifest', '--atlas', atlas]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^E_GROUP_ADAPTATION:/m);
});

test('Given an incomplete G07 scenario When monster-manifest stage Then E_GROUP_SCENARIO', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-g07-scenario-'));
  fixtures.push(dir);
  const docs = cloneLiveDocs(dir);
  const atlas = join(docs, 'World-Narrative-Atlas.md');
  const markdown = await readFile(atlas, 'utf8');
  const parsed = extractAtlasJson(markdown);
  assert.equal(parsed.ok, true, parsed.error);
  const group = parsed.value.hostile_groups.find((row) => row.id === 'G07');
  assert.ok(group, 'G07 missing');
  delete group.scenario_outlines[0].outcomes;
  await writeFile(atlas, markdown.replace(/```json\s*[\s\S]*?```/, `\`\`\`json\n${JSON.stringify(parsed.value, null, 2)}\n\`\`\``));
  const result = runVerifier(['--docs', docs, '--stage', 'monster-manifest', '--atlas', atlas]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^E_GROUP_SCENARIO:/m);
});

test('Given repository isometric atlas views When files exist Then SVG contracts pass', async () => {
  const markdown = await readFile(atlasPath, 'utf8');
  const atlas = extractAtlasJson(markdown).value;
  const diagrams = extractDiagrams(atlas);
  assert.equal(diagrams.length, 3);
  assert.deepEqual(diagrams.map((d) => d.asset), [...ISOMETRIC_DIAGRAM_ASSETS]);
  for (const asset of ISOMETRIC_DIAGRAM_ASSETS) {
    const svg = await readFile(join(wikiAssets, asset), 'utf8');
    const diagram = diagrams.find((item) => item.asset === asset);
    assertIsometricSvgContracts({ svg, diagram, atlas });
    assert.equal(findGeometryViolations(svg, diagram).length, 0);
  }
});

function corpusFile(name) {
  const roots = ['LORE', 'GAME-LOGIC', 'GDD'].map((dir) => join(repositoryRoot, dir));
  for (const root of roots) {
    const direct = join(root, name);
    if (existsSync(direct)) return direct;
  }
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return undefined;
    }
    for (const entry of entries) {
      const path = join(dir, entry);
      let st;
      try {
        st = statSync(path);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        const hit = walk(path);
        if (hit) return hit;
      } else if (entry === name) return path;
    }
    return undefined;
  };
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const hit = walk(root);
    if (hit) return hit;
  }
  return undefined;
}

test('Given isometric SVG hrefs When resolved from asset path Then every external target exists', async () => {
  const origin = 'http://127.0.0.1/';
  let externalCount = 0;
  let fragmentCount = 0;
  for (const asset of ISOMETRIC_DIAGRAM_ASSETS) {
    const svgPath = resolve(join(wikiAssets, asset));
    const svg = await readFile(svgPath, 'utf8');
    const ids = new Set(collectSvgIds(svg));
    const hrefs = [...svg.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((match) => match[1]);
    assert.ok(hrefs.length > 0, `${asset}: expected hrefs`);
    for (const href of hrefs) {
      const fromAsset = new URL(href, pathToFileURL(svgPath));
      const fromServer = new URL(href, new URL(`/assets/wiki/${asset}`, origin));
      if (href.startsWith('#')) {
        fragmentCount += 1;
        const id = decodeURIComponent(href.slice(1));
        assert.ok(ids.has(id), `${asset}: fragment ${href} has no target id`);
        continue;
      }
      externalCount += 1;
      const page = decodeURIComponent(fromAsset.pathname.split('/').pop() || '');
      const assetTarget = corpusFile(page) ?? fileURLToPath(fromAsset);
      const serverPage = decodeURIComponent(fromServer.pathname.split('/').pop() || '');
      const serverTarget = corpusFile(serverPage) ?? resolve(join(repositoryRoot, decodeURIComponent(fromServer.pathname).replace(/^\//, '')));
      assert.equal(existsSync(assetTarget), true, `${asset}: href ${href} missing ${assetTarget}`);
      assert.equal(existsSync(serverTarget), true, `${asset}: served ${fromServer.pathname} missing ${serverTarget}`);
    }
  }
  assert.ok(externalCount > 0, 'expected external isometric wiki hrefs');
  assert.ok(fragmentCount > 0, 'expected in-document isometric fragment hrefs');
});

test('Given company-aliases manifest When real names enter canon Then every real name has a rename target', async () => {
  const manifest = JSON.parse(await readFile(join(repositoryRoot, 'Tool', 'tools', 'wiki', 'company-aliases.json'), 'utf8'));
  for (const name of ['삼성전자', '현대자동차', '네이버', '카카오', 'HMM', '테슬라코리아']) {
    assert.ok(name in manifest, `alias missing: ${name}`);
    assert.equal(typeof manifest[name], 'string');
    assert.notEqual(manifest[name], '');
    assert.notEqual(manifest[name], name);
  }
});
