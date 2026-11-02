import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const demand = (value, code) => { if (!value) throw Error(code); };
const equal = (a, b, code) => demand(JSON.stringify(a) === JSON.stringify(b), code);
const scriptPath = fileURLToPath(import.meta.url);

// Windows Node lstat does not expose every reparse tag. The admitted absolute
// interpreter checks each ancestor and direct child before any directory walk.
async function safePath(path, interpreter) {
  demand(isAbsolute(path) && resolve(path) === path, 'ABSOLUTE_PATH_REQUIRED');
  if (process.platform === 'win32') {
    demand(isAbsolute(interpreter) && basename(interpreter).toLowerCase() === 'powershell.exe', 'INTERPRETER_REQUIRED');
    const script = `$ErrorActionPreference='Stop';$p=$env:SQLITE_GUARD_PATH;while($p){$i=Get-Item -Force -LiteralPath $p;if($i.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'REPARSE_POINT'};$next=Split-Path -Parent $p;if($next -eq $p){break};$p=$next};$p=$env:SQLITE_GUARD_PATH;if((Get-Item -Force -LiteralPath $p).PSIsContainer){foreach($i in Get-ChildItem -Force -LiteralPath $p){if($i.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'REPARSE_POINT'}}}`;
    execFileSync(interpreter, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {
      env: { SystemRoot: process.env.SystemRoot ?? 'C:\\Windows', WINDIR: process.env.WINDIR ?? 'C:\\Windows', SQLITE_GUARD_PATH: path },
      timeout: 15000, stdio: 'pipe',
    });
  }
  for (let current = path; ; current = dirname(current)) {
    demand(!(await lstat(current)).isSymbolicLink(), 'REPARSE_POINT');
    if (dirname(current) === current) break;
  }
}

async function inventory(root, allowed, interpreter) {
  await safePath(root, interpreter);
  const rows = [];
  for (const name of (await readdir(root)).sort()) {
    demand(!/\.sqlite-(?:wal|shm|journal)$/i.test(name), 'SQLITE_SIDECAR');
    demand(allowed.includes(name), 'UNKNOWN_SIBLING');
    const path = join(root, name);
    await safePath(path, interpreter);
    const before = await lstat(path);
    demand(before.isFile() && before.nlink === 1, 'FILE_CUSTODY');
    const bytes = await readFile(path);
    const after = await lstat(path);
    equal([before.dev, before.ino, before.size, before.mtimeMs, before.nlink],
      [after.dev, after.ino, after.size, after.mtimeMs, after.nlink], 'FILE_CHANGED');
    rows.push({ path: name, bytes: bytes.length, sha256: sha(bytes) });
  }
  return rows;
}

function header(bytes) {
  demand(bytes.length >= 100 && bytes.subarray(0, 16).equals(Buffer.from('SQLite format 3\0')), 'SQLITE_SIGNATURE');
  demand(bytes[18] === 1 && bytes[19] === 1, 'SQLITE_HEADER_OR_WAL');
  return { writeVersion: bytes[18], readVersion: bytes[19] };
}

export function selectedSnapshot(db, canonicalSix) {
  demand(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='current_originals'").get().n === 1, 'CURRENT_SELECTION_REQUIRED');
  const people = db.prepare('SELECT person_id,character_id,name FROM people ORDER BY person_id').all();
  const current = db.prepare('SELECT person_id,detail_sha256,token_sha256,image_sha256 FROM current_originals ORDER BY person_id').all();
  demand(current.length === people.length && new Set(current.map(r => r.person_id)).size === people.length, 'CURRENT_SELECTION_COUNT');
  const joined = db.prepare(`SELECT p.person_id,p.character_id,p.name,c.detail_sha256,c.token_sha256,c.image_sha256,
    d.bytes AS detail_bytes,t.bytes AS token_bytes,i.bytes AS image_bytes
    FROM people p LEFT JOIN current_originals c ON c.person_id=p.person_id
    LEFT JOIN detail_revisions d ON d.person_id=p.person_id AND d.sha256=c.detail_sha256
    LEFT JOIN token_revisions t ON t.person_id=p.person_id AND t.sha256=c.token_sha256
    LEFT JOIN image_revisions i ON i.person_id=p.person_id AND i.sha256=c.image_sha256 ORDER BY p.person_id`).all();
  demand(joined.length === people.length, 'CURRENT_SELECTION_JOIN');
  const selected = joined.map(row => {
    for (const kind of ['detail', 'token', 'image']) {
      demand(row[kind + '_bytes'] instanceof Uint8Array, 'SELECTED_REVISION_MISSING');
      demand(sha(row[kind + '_bytes']) === row[kind + '_sha256'], 'SELECTED_HASH_MISMATCH');
    }
    const detail = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(row.detail_bytes));
    const token = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(row.token_bytes));
    demand(typeof row.name === 'string' && typeof row.character_id === 'string' && /^person-\d+$/.test(row.person_id), 'PERSON_IDENTITY');
    demand(detail.id === row.person_id && detail.name === row.name && detail.familyTree?.personId === row.character_id && detail.detailRoute === '/people/' + row.person_id, 'DETAIL_IDENTITY');
    demand(token.personId === row.person_id && token.name === row.name && token.characterId === row.character_id && token.image?.sha256 === row.image_sha256, 'TOKEN_IMAGE_IDENTITY');
    demand(token.generationContract && typeof token.generationContract === 'object' && !Array.isArray(token.generationContract) && Object.hasOwn(token, 'slots'), 'TOKEN_CONTRACT');
    return { personId: row.person_id, characterId: row.character_id, name: row.name,
      sourceHashes: { detail: row.detail_sha256, token: row.token_sha256, image: row.image_sha256 } };
  });
  demand(canonicalSix.length === 6 && new Set(canonicalSix.map(r => r.personId)).size === 6, 'CANONICAL_SIX_REQUIRED');
  for (const canonical of canonicalSix) {
    const row = selected.find(r => r.personId === canonical.personId);
    demand(row && row.characterId === canonical.characterId, 'CANONICAL_SIX_IDENTITY');
    equal(row.sourceHashes, canonical.sourceHashes, 'CANONICAL_SIX_HASHES');
  }
  const revisions = {};
  for (const kind of ['detail', 'token', 'image']) {
    revisions[kind] = db.prepare(`SELECT person_id,import_sequence,url,sha256,bytes FROM ${kind}_revisions ORDER BY person_id,import_sequence,sha256`).all().map(row => {
      demand(Number.isInteger(row.import_sequence) && row.import_sequence > 0 && typeof row.url === 'string' && row.bytes instanceof Uint8Array && sha(row.bytes) === row.sha256, 'REVISION_INVALID');
      return { personId: row.person_id, sequence: row.import_sequence, url: row.url, sha256: row.sha256, bytes: row.bytes.length, blobSha256: sha(row.bytes) };
    });
  }
  return { selected, people, current, revisions };
}

async function inspectDatabase(path, seed, canonicalSix, interpreter) {
  await safePath(path, interpreter);
  const stat = await lstat(path);
  demand(stat.isFile() && stat.nlink === 1, 'FILE_CUSTODY');
  const bytes = await readFile(path);
  demand(bytes.length === seed.bytes && sha(bytes) === seed.sha256, 'SEED_BINDING');
  const versions = header(bytes);
  const db = new DatabaseSync(path, { readOnly: true });
  let snapshot;
  try {
    db.exec('PRAGMA query_only=ON; BEGIN');
    const integrity = db.prepare('PRAGMA integrity_check').all();
    demand(integrity.length === 1 && Object.values(integrity[0])[0] === 'ok', 'SQLITE_INTEGRITY');
    snapshot = selectedSnapshot(db, canonicalSix);
    db.exec('COMMIT');
  } finally { db.close(); }
  const after = await readFile(path);
  equal([bytes.length, sha(bytes)], [after.length, sha(after)], 'DATABASE_CHANGED');
  return { versions, snapshot };
}

// No accepted real custody contract exists yet. A synthetic receipt cannot
// authorize a real authority transition; the later action must supply its own.
export async function guard({ mode, inputRoot, sourcePath, tempPath, finalPath, plan, action, expected, custody, interpreter }) {
  demand(['capture', 'pre-copy', 'post-copy', 'rollback'].includes(mode), 'MODE_INVALID');
  demand(custody?.schema === 'native-guard-custody.v1' && custody.writersStopped === true &&
    custody.originalHandlesExited === true && custody.fenceHeld === true &&
    custody.markerDisposition === 'absent' && custody.synthetic === true, 'CUSTODY_REQUIRED');
  const scratchRoot = await realpath(tmpdir());
  const ownedRoot = dirname(inputRoot);
  const scratch = relative(scratchRoot, ownedRoot);
  const destination = relative(ownedRoot, dirname(finalPath));
  demand(scratch && scratch !== '..' && !scratch.startsWith('..' + sep) && !isAbsolute(scratch) &&
    destination && destination !== '..' && !destination.startsWith('..' + sep) && !isAbsolute(destination), 'SYNTHETIC_SCRATCH_ONLY');
  demand(action?.schema === 'native-db-action-binding.v1' && action.id &&
    action.sourcePath === sourcePath && action.tempPath === tempPath && action.finalPath === finalPath &&
    action.inputRoot === inputRoot && action.planSha256 === sha(JSON.stringify(plan)) &&
    action.guardSha256 === sha(await readFile(scriptPath)) && action.custodySha256 === sha(JSON.stringify(custody)), 'ACTION_BINDING');
  demand(/^[a-zA-Z0-9_-]+$/.test(action.id) && sourcePath === join(inputRoot, 'originals.sqlite') &&
    tempPath === join(dirname(finalPath), 'originals.sqlite.' + action.id + '.tmp') &&
    finalPath === join(dirname(finalPath), 'originals.sqlite') &&
    dirname(inputRoot) !== dirname(finalPath) &&
    [inputRoot, sourcePath, tempPath, finalPath].every(path => isAbsolute(path) && resolve(path) === path), 'PATH_BINDING');
  const seed = plan?.seed;
  demand(Number.isInteger(seed?.bytes) && /^[a-f0-9]{64}$/.test(seed?.sha256) && Array.isArray(plan.canonicalSix) && Array.isArray(plan.inputs), 'PLAN_INVALID');
  const scriptSha256 = action.guardSha256;
  const { captureSha256, ...capturedAction } = action;
  const actionSha256 = sha(JSON.stringify(capturedAction));
  const interpreterSha256 = sha(JSON.stringify(process.platform === 'win32' ? {
    interpreter, SystemRoot: process.env.SystemRoot ?? 'C:\\Windows', WINDIR: process.env.WINDIR ?? 'C:\\Windows',
  } : { interpreter }));
  if (mode !== 'capture') {
    demand(expected?.ok === true && expected.mode === 'capture' && expected.actionId === action.id &&
      captureSha256 === sha(JSON.stringify(expected)) && expected.actionSha256 === actionSha256 &&
      expected.interpreterSha256 === interpreterSha256 && expected.planSha256 === action.planSha256 &&
      expected.guardSha256 === scriptSha256 && expected.custodySha256 === action.custodySha256, 'CAPTURE_BINDING');
  } else demand(captureSha256 === null, 'CAPTURE_BINDING');
  const inputBefore = await inventory(inputRoot, plan.inputs.map(row => row.path), interpreter);
  equal(inputBefore, plan.inputs.slice().sort((a, b) => a.path.localeCompare(b.path)), 'IMMUTABLE_INPUT_BINDING');
  demand(inputBefore.some(row => row.path === 'originals.sqlite' && row.bytes === seed.bytes && row.sha256 === seed.sha256), 'SEED_BINDING');
  if (expected) equal(inputBefore, expected.inputInventory, 'IMMUTABLE_PREIMAGE_MISMATCH');
  const allowed = mode === 'post-copy' ? ['originals.sqlite.' + action.id + '.tmp'] : mode === 'rollback' ? ['originals.sqlite'] : [];
  const destinationBefore = await inventory(dirname(finalPath), allowed, interpreter);
  if (mode === 'post-copy') demand(destinationBefore.length === 1 && destinationBefore[0].path === basename(tempPath), 'TEMP_REQUIRED');
  else if (mode === 'rollback') demand(destinationBefore.length === 1 && destinationBefore[0].path === basename(finalPath), 'UNCHANGED_SEED_REQUIRED');
  else demand(destinationBefore.length === 0, 'DESTINATION_NOT_EMPTY');
  const source = await inspectDatabase(sourcePath, seed, plan.canonicalSix, interpreter);
  const other = mode === 'post-copy' ? await inspectDatabase(tempPath, seed, plan.canonicalSix, interpreter) :
    mode === 'rollback' ? await inspectDatabase(finalPath, seed, plan.canonicalSix, interpreter) : null;
  if (other) equal(source.snapshot, other.snapshot, 'SNAPSHOT_MISMATCH');
  const snapshotSha256 = sha(JSON.stringify(source.snapshot));
  if (expected) equal(snapshotSha256, expected.snapshotSha256, 'SNAPSHOT_PREIMAGE_MISMATCH');
  equal(inputBefore, await inventory(inputRoot, plan.inputs.map(row => row.path), interpreter), 'INPUT_CHANGED');
  equal(destinationBefore, await inventory(dirname(finalPath), allowed, interpreter), 'DESTINATION_CHANGED');
  return { schema: 'native-sqlite-guard-receipt.v1', ok: true, mode,
    gate: mode === 'rollback' ? 'UNCHANGED_SEED_ONLY' : 'SQLITE_PREFLIGHT_PASS', actionId: action.id,
    actionSha256, interpreterSha256, planSha256: action.planSha256, guardSha256: scriptSha256, custodySha256: action.custodySha256,
    sourceBytes: seed.bytes, sourceSha256: seed.sha256, header: source.versions,
    integrity: 'ok', selectedPeople: source.snapshot.selected.length, snapshotSha256,
    inputInventory: inputBefore, destinationInventory: destinationBefore, synthetic: custody.synthetic === true,
    destinationCreated: false, dbWrites: 0 };
}
