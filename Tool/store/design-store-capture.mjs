#!/usr/bin/env node
// 정본 보존소 + SQLite 캡처·바이트 검증 도구 (PR #93 계획 C1/S0 첫 실행)
// Git 정본은 그대로 두고, 저장소 밖 보존소(originals/)와 design-store.sqlite 를 만든다.
// 신규 의존성 없음: node:sqlite, node:crypto, node:fs 만 사용.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

export const DB_NAME = 'design-store.sqlite';
export const ORIGINALS_DIR = 'originals';
export const CAPTURE_RECEIPT = 'capture-receipt.json';
export const VERIFY_RECEIPT = 'verify-receipt.json';
export const TOOL = 'Tool/store/design-store-capture.mjs@1';

export const ROOT_PLANNING_FILES = Object.freeze(['Concept.md', 'Design.md', 'ToDo.md', 'Intent.md']);

function listFiles(dir, ext) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith(ext))
    .filter((n) => statSync(join(dir, n)).isFile())
    .sort();
}

/** 코퍼스 규칙: 루트 설계문서, game-logic 최상위 MD, reference, name-pools JSON, site 전용 규칙.
 * 마운트 사본(Wikis/site/rules 중 game-logic 최상위와同名)은 정본이 아니므로 제외한다. */
export function enumerateCorpus(repoRoot) {
  const entries = [];
  for (const name of ROOT_PLANNING_FILES) {
    let isFile = false;
    try {
      isFile = statSync(join(repoRoot, name)).isFile();
    } catch {
      isFile = false;
    }
    if (isFile) entries.push({ path: name, fileSet: 'root-planning' });
  }
  const topDir = join(repoRoot, 'Wikis/game-logic');
  const topMd = listFiles(topDir, '.md');
  for (const name of topMd) entries.push({ path: `Wikis/game-logic/${name}`, fileSet: 'game-logic-top' });
  const topBasenames = new Set(topMd);
  for (const name of listFiles(join(repoRoot, 'Research/canon-reference'), '.md')) {
    entries.push({ path: `Research/canon-reference/${name}`, fileSet: 'game-logic-reference' });
  }
  for (const name of listFiles(join(repoRoot, 'Wikis/game-logic/name-pools'), '.json')) {
    entries.push({ path: `Wikis/game-logic/name-pools/${name}`, fileSet: 'name-pools' });
  }
  for (const name of listFiles(join(repoRoot, 'Wikis/site/rules'), '.md')) {
    if (topBasenames.has(name)) continue; // 마운트 사본 제외
    entries.push({ path: `Wikis/site/rules/${name}`, fileSet: 'site-rules-authored' });
  }
  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return entries;
}

export function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function gitEnrichment(repoRoot, paths) {
  const out = { gitCommit: null, blobShas: new Map() };
  try {
    out.gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return out;
  }
  try {
    const listing = execFileSync('git', ['ls-files', '-s'], { cwd: repoRoot, encoding: 'utf8' });
    const wanted = new Set(paths);
    for (const line of listing.split('\n')) {
      const m = line.match(/^([0-9]+) ([0-9a-f]{40}) 0\t(.+)$/);
      if (m && wanted.has(m[3])) out.blobShas.set(m[3], m[2]);
    }
  } catch {
    // blob 매핑은 보강 정보 — 실패해도 캡처는 진행한다(검증은 bytes 로 판정).
  }
  return out;
}

function initDb(db) {
  db.exec(`
    CREATE TABLE capture_run (
      id INTEGER PRIMARY KEY,
      created_at TEXT NOT NULL,
      git_commit TEXT,
      tool TEXT NOT NULL,
      corpus_files INTEGER NOT NULL
    );
    CREATE TABLE source_file (
      capture_run_id INTEGER NOT NULL REFERENCES capture_run(id),
      path TEXT NOT NULL,
      file_set TEXT NOT NULL,
      size INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      git_blob_sha TEXT,
      git_dirty INTEGER,
      bytes BLOB NOT NULL,
      PRIMARY KEY (capture_run_id, path)
    );
  `);
}

export function captureCorpus({ repoRoot, outDir }) {
  const corpus = enumerateCorpus(repoRoot);
  const { gitCommit, blobShas } = gitEnrichment(repoRoot, corpus.map((e) => e.path));
  mkdirSync(join(outDir, ORIGINALS_DIR), { recursive: true });
  const dbPath = join(outDir, DB_NAME);
  let db;
  try {
    statSync(dbPath);
    throw new Error(`refusing to overwrite existing ${DB_NAME}; use a fresh --out directory`);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  db = new DatabaseSync(dbPath);
  initDb(db);
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO capture_run (id, created_at, git_commit, tool, corpus_files) VALUES (1, ?, ?, ?, ?)').run(
    createdAt,
    gitCommit,
    TOOL,
    corpus.length,
  );
  const insert = db.prepare(
    'INSERT INTO source_file (capture_run_id, path, file_set, size, sha256, git_blob_sha, git_dirty, bytes) VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
  );
  const manifest = [];
  for (const entry of corpus) {
    const bytes = readFileSync(join(repoRoot, entry.path));
    const dest = join(outDir, ORIGINALS_DIR, entry.path);
    mkdirSync(dirname(dest), { recursive: true });
    const tmp = `${dest}.tmp`;
    writeFileSync(tmp, bytes);
    renameSync(tmp, dest);
    const sha = sha256Bytes(bytes);
    insert.run(entry.path, entry.fileSet, bytes.length, sha, blobShas.get(entry.path) ?? null, 0, new Uint8Array(bytes));
    manifest.push({ path: entry.path, file_set: entry.fileSet, size: bytes.length, sha256: sha, git_blob_sha: blobShas.get(entry.path) ?? null });
  }
  db.close();
  const receipt = {
    tool: TOOL,
    captured_at: createdAt,
    git_commit: gitCommit,
    repo_root: repoRoot,
    out_dir: outDir,
    files: corpus.length,
    manifest,
  };
  writeFileSync(join(outDir, CAPTURE_RECEIPT), `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

export function verifyCapture({ repoRoot, outDir }) {
  const result = { pass: false, files: 0, db_rows: 0, preserved_files: 0, missing: [], mutated: [], mutated_details: [], extras: [], extras_details: [] };
  const corpus = enumerateCorpus(repoRoot);
  const corpusPaths = new Set(corpus.map((e) => e.path));
  const db = new DatabaseSync(join(outDir, DB_NAME), { readOnly: true });
  const rows = db.prepare('SELECT path, size, sha256, bytes FROM source_file').all();
  db.close();
  result.db_rows = rows.length;
  const dbByPath = new Map(rows.map((r) => [r.path, r]));
  const preservedRoot = join(outDir, ORIGINALS_DIR);
  const preservedRel = [];
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile()) preservedRel.push(relative(preservedRoot, p));
    }
  };
  walk(preservedRoot);
  result.preserved_files = preservedRel.length;
  const preservedSet = new Set(preservedRel);
  for (const entry of corpus) {
    const row = dbByPath.get(entry.path);
    if (!row || !preservedSet.has(entry.path)) {
      result.missing.push(entry.path);
      continue;
    }
    const repoBytes = readFileSync(join(repoRoot, entry.path));
    const presBytes = readFileSync(join(preservedRoot, entry.path));
    const dbBytes = new Uint8Array(row.bytes);
    const problems = [];
    if (!repoBytes.equals(presBytes)) problems.push('repo!=preserved');
    if (!repoBytes.equals(dbBytes)) problems.push('repo!=db');
    if (row.size !== repoBytes.length || row.sha256 !== sha256Bytes(repoBytes)) problems.push('meta(size/sha256)');
    if (problems.length > 0) {
      result.mutated.push(entry.path);
      result.mutated_details.push(`${entry.path} (${problems.join(', ')})`);
    }
  }
  const dbExtras = [];
  const presExtras = [];
  for (const p of dbByPath.keys()) if (!corpusPaths.has(p)) dbExtras.push(p);
  for (const p of preservedRel) if (!corpusPaths.has(p)) presExtras.push(p);
  result.extras = [...new Set([...dbExtras, ...presExtras])];
  result.extras_details = [...dbExtras.map((p) => `db:${p}`), ...presExtras.map((p) => `originals:${p}`)];
  result.files = corpus.length;
  result.pass =
    result.missing.length === 0 && result.mutated.length === 0 && result.extras.length === 0 && rows.length === corpus.length;
  return result;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const opts = { command, repo: null, out: null };
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === '--repo') opts.repo = rest[++i];
    else if (rest[i] === '--out') opts.out = rest[++i];
    else throw new Error(`unknown argument: ${rest[i]}`);
  }
  if (opts.command !== 'capture' && opts.command !== 'verify') throw new Error(`unknown command: ${opts.command}`);
  if (!opts.repo || !opts.out) throw new Error('--repo and --out are required');
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.command === 'capture') {
    const receipt = captureCorpus({ repoRoot: opts.repo, outDir: opts.out });
    console.log(JSON.stringify({ command: 'capture', files: receipt.files, git_commit: receipt.git_commit, receipt: join(opts.out, CAPTURE_RECEIPT) }));
    return;
  }
  const result = verifyCapture({ repoRoot: opts.repo, outDir: opts.out });
  writeFileSync(join(opts.out, VERIFY_RECEIPT), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result));
  if (!result.pass) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
