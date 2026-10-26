import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInkosAdapterFixture } from './inkos-adapter-fixture.mjs';

// Mixed-structure gate: publicly admitted documents may contain headings, lists
// and tables beside stable Korean paragraphs. Export must carry only paragraph
// excerpts, non-paragraph nodes must survive prepare-draft previews untouched,
// and a non-paragraph target anchor must still fail closed.

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '../inkos-adapter/cli.mjs');
const run = (args, cwd) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
// The adapter rejects symlinked ancestors (E_ADAPTER_PATH); macOS tmpdir() is
// behind the /var symlink, so canonicalize before creating fixture directories.
const tempRoot = realpathSync(tmpdir());

test('mixed-structure document exports paragraph excerpts only and completes the full CLI chain', () => {
  const parent = mkdtempSync(join(tempRoot, 'inkos-mixed-'));
  const fx = createInkosAdapterFixture({ parent, mixedStructure: true });
  try {
    const host = join(parent, 'host');
    const worker = join(parent, 'worker');
    mkdirSync(host);
    const selectionPath = join(parent, 'selection.json');
    writeFileSync(selectionPath, JSON.stringify(fx.selection));
    const dbBefore = sha256(readFileSync(fx.dbPath));

    const exported = run(['export', '--db', fx.dbPath, '--selection', selectionPath, '--trusted-root', host, '--worker-out', worker], parent);
    assert.equal(exported.status, 0, exported.stderr);
    const out = JSON.parse(exported.stdout);
    const bundle = JSON.parse(readFileSync(out.bundlePath, 'utf8'));
    const target = bundle.sources.find((source) => source.sourceKey === 'source-1');
    assert.deepEqual(target.excerpts.map((excerpt) => excerpt.anchor), ['paragraph']);
    assert.equal(target.excerpts[0].text, '합성 시험 문단이다.');
    const manifest = JSON.parse(readFileSync(out.manifestPath, 'utf8'));
    const manifestTarget = manifest.sources.find((source) => source.sourceKey === 'source-1');
    assert.deepEqual(manifestTarget.anchors, ['paragraph']);

    const replacementText = '혼합 구조 문서의 문단 교체 시험 문장이다.';
    const candidatePath = join(parent, 'candidate.json');
    writeFileSync(candidatePath, JSON.stringify({ version: 1, packetId: bundle.packetId, inputDigest: manifest.inputDigest,
      targetKey: 'source-1', replacementText, citations: [{ sourceKey: 'source-2', anchor: 'paragraph' }] }, null, 2) + '\n');
    const receiptCopy = join(parent, 'receipt-copy.json');
    const collected = run(['collect', '--trusted-root', host, '--packet-id', bundle.packetId, '--candidate', candidatePath, '--db', fx.dbPath, '--out', receiptCopy], parent);
    assert.equal(collected.status, 0, collected.stderr);
    const candidateId = JSON.parse(collected.stdout).candidateId;

    const previewPath = join(parent, 'preview.json');
    const prepared = run(['prepare-draft', '--trusted-root', host, '--candidate-id', candidateId, '--db', fx.dbPath, '--out', previewPath], parent);
    assert.equal(prepared.status, 0, prepared.stderr);
    const result = JSON.parse(prepared.stdout);
    assert.equal(result.status, 'draft');
    assert.equal(result.ownerApproval, false);
    assert.equal(result.expectedRevision, fx.sources[0].revision);
    const kinds = result.preview.content.map((node) => node.kind);
    assert.deepEqual(kinds, ['heading', 'list', 'paragraph']);
    assert.equal(result.preview.content[0].text.ko, '개요');
    assert.equal(result.preview.content[1].items[0].ko[0].text, '합성 목록 항목');
    assert.equal(result.preview.content[2].text.ko, replacementText);
    assert.equal(result.preview.content[2].anchor, 'paragraph');
    assert.equal(sha256(readFileSync(fx.dbPath, null)), dbBefore);
  } finally {
    fx.cleanup();
    rmSync(parent, { recursive: true, force: true });
  }
});

test('heading or list target anchors still fail closed at export', () => {
  const parent = mkdtempSync(join(tempRoot, 'inkos-mixed-'));
  const fx = createInkosAdapterFixture({ parent, mixedStructure: true });
  try {
    const host = join(parent, 'host');
    mkdirSync(host);
    for (const anchor of ['개요-h1', '개요-list']) {
      const selection = { ...fx.selection, target: { ...fx.selection.target, anchor } };
      const selectionPath = join(parent, `selection-${anchor}.json`);
      writeFileSync(selectionPath, JSON.stringify(selection));
      const exported = run(['export', '--db', fx.dbPath, '--selection', selectionPath, '--trusted-root', host, '--worker-out', join(parent, `worker-${anchor}`)], parent);
      assert.equal(exported.status, 1);
      assert.equal(exported.stdout, '');
      assert.match(exported.stderr, /E_ADAPTER_UNSUPPORTED/);
    }
  } finally {
    fx.cleanup();
    rmSync(parent, { recursive: true, force: true });
  }
});
