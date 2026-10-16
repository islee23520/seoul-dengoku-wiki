import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { DATA_SOURCE_PATHS, REQUIRED_SOURCE_PATHS, parseDocument, sha256 } from './sources.mjs';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { REFERENCE_TARGET_PATHS } from './source-closure.mjs';
import { EXCLUDED_SOURCE_PATHS } from './excluded-sources.mjs';

const pool = name => `lore/name-pools/${name}.json`;
const leaf = text => ({ ko: text, en: text });

/** Small invented data only; it does not impersonate an official checker result. */
export function makeCorpus(mutate = () => {}) {
  const names = [{ id: 'K088', name: '가람', aliases: ['첫 이름'] }, { id: 'K003', name: '누리', aliases: [] }];
  const axes = Array.from({ length: 10 }, (_, i) => `축${i}`);
  const desires = Array.from({ length: 5 }, (_, i) => `욕망${i}`);
  const docs = Object.fromEntries(DATA_SOURCE_PATHS.filter(path => path.endsWith('.json')).map(path => [path, { content: [] }]));
  docs[pool('person-id-registry')] = { totalPeople: 2, persons: names };
  docs[pool('values-cast')] = { axes, desire_axes: desires, count: 2, people: names.map(person => ({
    name: person.name, state: 'S01', state_name: '시험국', title: '', stage: '주요', generation: 'opening', source: 'proposal', minors: false,
    values: Object.fromEntries(axes.map((axis, index) => [axis, index === 0 ? -100 : index === 1 ? 100 : 0])),
    desire: { ...Object.fromEntries(desires.map(axis => [axis, 0])), 지향: null, 결합: '' },
  })) };
  docs[pool('gender-cast')] = { count: 2, people: names.map(person => ({ name: person.name, state: 'S01', gender: '여성', source: 'fixture', user_locked: false })) };
  docs[pool('cast-hangnyeol')] = { count: 2, people: names.map(person => ({ name: person.name, surname: person.name[0], status: 'no-bongwan' })), lineage: { parents: {}, founder_sesu: {}, person_clan: {} } };
  docs[pool('clan-hangnyeol-tables')] = { clans: [] };
  docs[pool('gurps-cast')] = { status: 'proposal', count: 2, people: names.map((person, index) => ({
    id: person.id, name: person.name, state: 'S01', url: `/people/person-${String(index + 1).padStart(4, '0')}`, method: 'card-lexicon',
    role: { display: '역할', evidence: [{ path: 'WORLD_BUILDING_GUIDE.md', quote: 'fixture evidence' }] },
    attributes: Object.fromEntries(['ST', 'DX', 'IQ', 'HT'].map(code => [code, { value: 10, cp: 0, rule: 'card-actions', evidence: [] }])),
    secondary: { HP: 10, Will: 10, Per: 10, FP: 10, BasicSpeed: 5, BasicMove: 5, BasicLift: 20, Dodge: 8 },
    traits: [], skills: [], languages: [], band: '일반 인물', baseline: true,
    cp: { attributes: 0, advantages: 0, disadvantages: 0, skills: 0, spent: 0, unspent: 75, total: 75 },
  })) };
  docs['lore/characters/Cast-State-01.json'].content = names.flatMap(person => [
    { kind: 'heading', depth: 3, text: leaf(`인물 ${person.name}`) }, { kind: 'paragraph', text: leaf(`${person.name} fixture profile`) },
  ]);
  docs['lore/characters/Cast-Relations.json'].content = [{ kind: 'table', columns: ['from', 'type', 'to', 'grounds'].map(leaf), rows: [[leaf('가람'), leaf('친족'), leaf('누리'), leaf('')]] }];
  mutate(docs);
  const files = DATA_SOURCE_PATHS.map((logical_path, index) => {
    const raw_bytes = Buffer.from(logical_path.endsWith('.json') ? JSON.stringify(docs[logical_path]) : '# fixture evidence\n');
    return { source_id: index + 1, logical_path, media_type: logical_path.endsWith('.json') ? 'application/json' : 'text/markdown', sha256: sha256(raw_bytes), byte_length: raw_bytes.length, raw_bytes, document: docs[logical_path] ?? null };
  });
  const records = files.flatMap(file => file.document === null ? [] : parseDocument(file.raw_bytes.toString('utf8')).records.map(row => ({ source_id: file.source_id, ...row })));
  return { docs, bundle: { sourceRevision: 'a'.repeat(40), sourceSetSha256: sha256(files.map(file => `${file.logical_path}\0${file.sha256}\n`).join('')), files, records, officialChecks: [] } };
}

export async function sandbox(t) {
  const root = await mkdtemp(join(tmpdir(), 'cast-adversarial-'));
  t.after(async () => {
    const child = relative(resolve(tmpdir()), resolve(root));
    assert.ok(child && !isAbsolute(child) && !child.startsWith('..') && child.startsWith('cast-adversarial-'));
    await rm(root, { recursive: true });
  });
  return root;
}

export async function sourceDigests(sourceRoot) {
  return Promise.all([...new Set([...REQUIRED_SOURCE_PATHS, ...REFERENCE_TARGET_PATHS, ...ENGINE_PRIVATE_SOURCE_PATHS, ...EXCLUDED_SOURCE_PATHS])].map(async path => [path, sha256(await readFile(join(sourceRoot, path)))]));
}

/** Ephemeral exact-byte test snapshot, with real source scripts and no committed corpus copy. */
export async function snapshotActualCorpus(t) {
  const approvedRoot = resolve(process.env.CAST_SQLITE_SOURCE_ROOT);
  const originalDigests = await sourceDigests(approvedRoot);
  const root = await sandbox(t);
  const sourceRoot = join(root, 'WIKI');
  for (const logicalPath of new Set([...REQUIRED_SOURCE_PATHS, ...REFERENCE_TARGET_PATHS, ...ENGINE_PRIVATE_SOURCE_PATHS, ...EXCLUDED_SOURCE_PATHS])) {
    const target = join(sourceRoot, logicalPath);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(approvedRoot, logicalPath), target);
  }
  assert.deepEqual(await sourceDigests(sourceRoot), originalDigests);
  execFileSync('git', ['init', '--quiet', sourceRoot], { windowsHide: true, shell: false });
  execFileSync('git', ['-C', sourceRoot, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '--allow-empty', '-m', 'Ephemeral fixture revision'], { windowsHide: true, shell: false });
  return { root, sourceRoot, outputPath: join(root, 'artifact.sqlite'), originalDigests };
}
