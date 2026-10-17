import { createHash } from 'node:crypto';
import { lstat, realpath, readFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ENGINE_PRIVATE_SOURCE_PATHS } from './current-engine.mjs';
import { REFERENCE_TARGET_PATHS } from './source-closure.mjs';
import { loadExcludedSourceFiles } from './excluded-sources.mjs';

export const DATA_SOURCE_PATHS = Object.freeze([
  ...['person-id-registry', 'values-cast', 'gender-cast', 'cast-hangnyeol', 'clan-hangnyeol-tables', 'gurps-cast'].map((name) => `lore/name-pools/${name}.json`),
  ...['cast-birthdays', 'cast-birth-cohorts', 'cast-family-trees', 'cast-family-parent-status', 'cast-family-role-decisions', 'cast-household-relations', 'diaspora-family-lineages', 'household-humanoid-policy'].map((name) => `lore/name-pools/${name}.json`),
  'lore/relations/relations.json', 'lore/relations/personal-holdings.json', 'lore/relations/opening-office-appointments.json', 'lore/name-pools/cast-prose-contacts.json',
  'lore/relations/opening-feudal-allocation.json', 'lore/regions/outside-control-2126.json', 'lore/regions/seoul-electoral-titles.json',
  ...Array.from({ length: 16 }, (_, index) => `lore/characters/Cast-State-${String(index + 1).padStart(2, '0')}.json`),
  ...['Core-Characters', 'Cast-Unaffiliated', 'Cast-Relations', 'Cast-Index', 'Cast-Index-S4', 'Cast-Corridors-Index'].map((name) => `lore/characters/${name}.json`),
  'lore/characters/Cast-Profile-Contract.md', 'lore/factions/Diaspora-Corridors.json',
  'WORLD_BUILDING_GUIDE.md', 'lore/chronology/Century-Annals.json',
  'lore/chronology/Scenario-Timeline.json',
].sort());
export const SCRIPT_SOURCE_PATHS = Object.freeze(['scripts/gurps-cast.mjs', 'scripts/lore-json-render.mjs']);
export const REQUIRED_SOURCE_PATHS = Object.freeze([...DATA_SOURCE_PATHS, ...SCRIPT_SOURCE_PATHS].sort());
export const RETIRED_HISTORICAL_REFERENCE_PATHS = Object.freeze(['lore/culture/Martial-Paths.json']);
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => { throw Object.assign(new Error(`${code}: ${message}`), { code }); };
const escapePointer = (key) => key.replace(/~/g, '~0').replace(/\//g, '~1');
const environment = () => ({ ...Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|HOME|USERPROFILE|LANG|LC_ALL)$/i.test(key))), GIT_NO_REPLACE_OBJECTS: '1' });

export async function resolveTrustedSourceRoot(sourceRoot) {
  if (typeof sourceRoot !== 'string' || !isAbsolute(sourceRoot)) fail('E_SOURCE_ROOT', 'sourceRoot must be an absolute WIKI directory');
  const root = resolve(sourceRoot);
  let stat;
  try { stat = await lstat(root); } catch (error) {
    if (error.code === 'ENOENT') fail('E_SOURCE_MISSING', 'source root does not exist');
    throw error;
  }
  const actual = await realpath(root);
  const comparable = (path) => process.platform === 'win32' ? path.toLowerCase() : path;
  if (stat.isSymbolicLink() || comparable(actual) !== comparable(root)) fail('E_SOURCE_OUTSIDE_ROOT', 'source root must not traverse symbolic links');
  if (!stat.isDirectory()) fail('E_SOURCE_ROOT', 'source root is not a directory');
  return actual;
}

export async function resolveTrustedSourcePath(sourceRoot, logicalPath) {
  const root = await resolveTrustedSourceRoot(sourceRoot);
  if (typeof logicalPath !== 'string' || !logicalPath || /[\\:\0]/u.test(logicalPath) || isAbsolute(logicalPath)
    || logicalPath.split('/').some((part) => !part || part === '.' || part === '..')) fail('E_SOURCE_OUTSIDE_ROOT', 'invalid source-relative path');
  const target = resolve(root, logicalPath);
  const remainder = relative(root, target);
  if (isAbsolute(remainder) || remainder.startsWith('..')) fail('E_SOURCE_OUTSIDE_ROOT', logicalPath);
  let cursor = root;
  for (const part of logicalPath.split('/')) {
    cursor = join(cursor, part);
    let stat;
    try { stat = await lstat(cursor); } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') fail('E_SOURCE_MISSING', logicalPath);
      throw error;
    }
    if (stat.isSymbolicLink()) fail('E_SOURCE_OUTSIDE_ROOT', logicalPath);
    if (cursor === target && !stat.isFile()) fail('E_SOURCE_FILE', logicalPath);
  }
  return target;
}

function numericValue(token) {
  const value = Number(token);
  const decimal = (text) => {
    const [mantissa, power = '0'] = text.toLowerCase().split('e');
    const digits = mantissa.replace('.', '').replace(/^(-?)0+/u, '$1');
    const fraction = mantissa.includes('.') ? mantissa.length - mantissa.indexOf('.') - 1 : 0;
    const trimmed = digits.replace(/0+$/u, '');
    return trimmed === '' || trimmed === '-' ? '0' : `${trimmed}e${Number(power) - fraction + digits.length - trimmed.length}`;
  };
  if (!Number.isFinite(value) || Object.is(value, -0) || decimal(token) !== decimal(String(value))
    || (!/[.eE]/u.test(token) && !Number.isSafeInteger(value))) fail('E_SOURCE_NUMBER_PRECISION', token);
  return { value, type: /[.eE]/u.test(token) ? 'real' : 'integer' };
}

function record(value, location, numericType) {
  const type = numericType ?? (value === null ? 'null' : Array.isArray(value) ? 'array'
    : typeof value === 'string' ? 'text' : typeof value === 'number' ? Number.isInteger(value) ? 'integer' : 'real' : typeof value);
  if (!['object', 'array', 'null', 'boolean', 'integer', 'real', 'text'].includes(type)) fail('E_SOURCE_JSON', 'unsupported JSON value');
  return Object.freeze({ ...location, json_type: type, text_value: type === 'text' ? value : null,
    integer_value: type === 'integer' ? value : null, real_value: type === 'real' ? value : null,
    boolean_value: type === 'boolean' ? Number(value) : null });
}

export function flattenJson(value) {
  const rows = [];
  const ancestors = new Set();
  const visit = (node, location) => {
    if (typeof node === 'number') numericValue(String(node));
    rows.push(record(node, location));
    if (node === null || typeof node !== 'object') return;
    if (ancestors.has(node) || (!Array.isArray(node) && Object.getPrototypeOf(node) !== Object.prototype)) fail('E_SOURCE_JSON', 'non-JSON container');
    ancestors.add(node);
    Object.entries(node).forEach(([key, child], ordinal) => visit(child, {
      json_pointer: `${location.json_pointer}/${escapePointer(key)}`, parent_pointer: location.json_pointer,
      ordinal, field_name: Array.isArray(node) ? null : key,
    }));
    ancestors.delete(node);
  };
  visit(value, { json_pointer: '', parent_pointer: null, ordinal: 0, field_name: null });
  return Object.freeze(rows);
}

export function parseDocument(text) {
  let document;
  try { document = JSON.parse(text); } catch { fail('E_SOURCE_JSON', 'invalid JSON source'); }
  const tokens = /\s*("(?:[^"\\]|\\[\s\S])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\],:])/y;
  const next = () => tokens.exec(text)[1];
  const rows = [];
  const visit = (token, location) => {
    const container = token === '{' || token === '[';
    const numeric = /^-?\d/u.test(token) ? numericValue(token) : null;
    rows.push(record(container ? token === '{' ? {} : [] : numeric ? numeric.value : JSON.parse(token), location, numeric?.type));
    if (!container) return;
    const keys = new Set();
    let ordinal = 0;
    let child = next();
    const end = token === '{' ? '}' : ']';
    while (child !== end) {
      const key = token === '{' ? JSON.parse(child) : String(ordinal);
      if (keys.has(key)) fail('E_SOURCE_JSON', `duplicate object key at ${location.json_pointer}`);
      keys.add(key);
      if (token === '{') { next(); child = next(); }
      visit(child, { json_pointer: `${location.json_pointer}/${escapePointer(key)}`, parent_pointer: location.json_pointer,
        ordinal, field_name: token === '{' ? key : null });
      ordinal += 1;
      child = next();
      if (child === ',') child = next();
    }
  };
  visit(next(), { json_pointer: '', parent_pointer: null, ordinal: 0, field_name: null });
  return { document, records: rows };
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, shell: false, windowsHide: true, env: environment(), timeout: 120_000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.signal || result.status === null) fail('E_SOURCE_EXECUTION', result.error?.code ?? result.signal ?? 'missing exit status');
  return { exitCode: result.status, stdout: result.stdout.toString('utf8'), stderr: result.stderr.toString('utf8') };
}

async function verifySnapshot(root, files) {
  for (const file of files) {
    const path = await resolveTrustedSourcePath(root, file.logical_path);
    if (sha256(await readFile(path)) !== file.sha256) fail('E_SOURCE_CHANGED', file.logical_path);
  }
}

async function verifyGitInputs(root, files, sourceRevision) {
  const paths = [...new Set(files.map((file) => file.logical_path))].sort();
  const pathspecs = paths.map((path) => `:(literal)${path}`);
  const objectFormat = sourceRevision.length === 40 ? 'sha1' : sourceRevision.length === 64 ? 'sha256' : null;
  if (!objectFormat) fail('E_SOURCE_DIRTY', 'cannot determine Git object format');
  let tree;
  try { tree = run('git', ['-C', root, 'ls-tree', '-r', '-z', sourceRevision, '--', ...pathspecs], root); }
  catch { fail('E_SOURCE_DIRTY', 'cannot read required source objects from Git HEAD'); }
  const headObjects = new Map();
  for (const entry of tree.stdout.split('\0').filter(Boolean)) {
    const match = /^100(?:644|755) blob ([a-f0-9]{40,64})\t(.+)$/u.exec(entry);
    if (!match || headObjects.has(match[2])) fail('E_SOURCE_DIRTY', 'invalid required source in Git HEAD');
    headObjects.set(match[2], match[1]);
  }
  if (tree.exitCode !== 0 || headObjects.size !== paths.length || paths.some((path) => !headObjects.has(path))) {
    fail('E_SOURCE_DIRTY', 'required source is absent from Git HEAD');
  }
  for (const file of files) {
    const path = await resolveTrustedSourcePath(root, file.logical_path);
    const bytes = await readFile(path);
    if (sha256(bytes) !== file.sha256) fail('E_SOURCE_CHANGED', file.logical_path);
    const objectId = createHash(objectFormat).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (objectId !== headObjects.get(file.logical_path)) fail('E_SOURCE_DIRTY', 'required source bytes differ from Git HEAD');
  }
  let tracked;
  try { tracked = run('git', ['-C', root, 'ls-files', '-v', '-z', '--', ...pathspecs], root); }
  catch { fail('E_SOURCE_DIRTY', 'cannot verify required source tracking against Git HEAD'); }
  const entries = tracked.stdout.split('\0').filter(Boolean);
  if (tracked.exitCode !== 0 || entries.length !== paths.length
    || entries.some((entry, index) => entry !== `H ${paths[index]}`)) {
    fail('E_SOURCE_DIRTY', 'required source is not a normally tracked Git HEAD input');
  }
  let status;
  try { status = run('git', ['-C', root, '-c', 'core.fsmonitor=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--', ...pathspecs], root); }
  catch { fail('E_SOURCE_DIRTY', 'cannot verify required source state against Git HEAD'); }
  if (status.exitCode !== 0 || status.stdout.length) fail('E_SOURCE_DIRTY', 'required source differs from Git HEAD');
}

async function loadPrivateEngineFiles(root) {
  return Promise.all(ENGINE_PRIVATE_SOURCE_PATHS.map(async (logical_path) => {
    const path = await resolveTrustedSourcePath(root, logical_path);
    const rawBytes = await readFile(path);
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(rawBytes); } catch { fail('E_SOURCE_UTF8', logical_path); }
    const document = parseDocument(text).document;
    return Object.freeze({ logical_path, document, sha256: sha256(rawBytes), byte_length: rawBytes.length });
  }));
}

async function loadReferenceFiles(root) {
  const extraPaths = REFERENCE_TARGET_PATHS.filter((logicalPath) => !REQUIRED_SOURCE_PATHS.includes(logicalPath));
  return Promise.all(extraPaths.map(async (logical_path) => {
    const path = await resolveTrustedSourcePath(root, logical_path);
    const rawBytes = await readFile(path);
    let document = null;
    if (logical_path.endsWith('.json')) {
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(rawBytes); } catch { fail('E_SOURCE_UTF8', logical_path); }
      document = parseDocument(text).document;
    }
    return Object.freeze({ logical_path, document, sha256: sha256(rawBytes), byte_length: rawBytes.length });
  }));
}

async function verifyEvidencePaths(root, document) {
  const paths = new Set();
  const visit = (value) => {
    if (value === null || typeof value !== 'object') return;
    if (Object.hasOwn(value, 'path')) {
      if (typeof value.path !== 'string') fail('E_SOURCE_MANIFEST', 'GURPS evidence path must be text');
      paths.add(value.path);
    }
    Object.values(value).forEach(visit);
  };
  visit(document);
  for (const path of [...paths].sort()) {
    if (RETIRED_HISTORICAL_REFERENCE_PATHS.includes(path)) continue;
    await resolveTrustedSourcePath(root, path);
    if (!DATA_SOURCE_PATHS.includes(path)) fail('E_SOURCE_MANIFEST', path);
  }
}
export async function loadSourceBundle({ sourceRoot, runOfficialChecks = true }) {
  if (typeof runOfficialChecks !== 'boolean') fail('E_SOURCE_OPTIONS', 'runOfficialChecks must be boolean');
  const root = await resolveTrustedSourceRoot(sourceRoot);
  const revision = run('git', ['-C', root, 'rev-parse', 'HEAD'], root);
  const sourceRevision = revision.stdout.trim();
  if (revision.exitCode !== 0 || !/^[a-f0-9]{40,64}$/u.test(sourceRevision)) fail('E_SOURCE_REVISION', 'source root has no Git HEAD');
  const files = [];
  const records = [];
  for (const logical_path of REQUIRED_SOURCE_PATHS) {
    const path = await resolveTrustedSourcePath(root, logical_path);
    const raw_bytes = await readFile(path);
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(raw_bytes); } catch { fail('E_SOURCE_UTF8', logical_path); }
    const parsed = logical_path.endsWith('.json') ? parseDocument(text) : { document: null, records: [] };
    const source_id = files.length + 1;
    const media_type = logical_path.endsWith('.json') ? 'application/json' : logical_path.endsWith('.md') ? 'text/markdown' : 'text/javascript';
    files.push(Object.freeze({ source_id, logical_path, media_type, sha256: sha256(raw_bytes), byte_length: raw_bytes.length, raw_bytes, document: parsed.document }));
    for (const row of parsed.records) records.push(Object.freeze({ source_id, ...row }));
  }
  await verifyEvidencePaths(root, files.find((file) => file.logical_path === 'lore/name-pools/gurps-cast.json').document);
  const referenceFiles = Object.freeze(await loadReferenceFiles(root));
  const engineFiles = Object.freeze(await loadPrivateEngineFiles(root));
  const excludedFiles = await loadExcludedSourceFiles({ sourceRoot: root, resolveTrustedSourcePath, sha256 });
  const allInputs = [...files, ...referenceFiles, ...engineFiles, ...excludedFiles];
  await verifySnapshot(root, allInputs);
  await verifyGitInputs(root, allInputs, sourceRevision);
  const sourceSetSha256 = sha256([...files, ...referenceFiles, ...excludedFiles].sort((a, b) => a.logical_path.localeCompare(b.logical_path)).map((file) => `${file.logical_path}\0${file.sha256}\n`).join(''));
  const officialChecks = [];
  const gurpsSchema = files.find((file) => file.logical_path === 'lore/name-pools/gurps-cast.json').document.schema;
  if (runOfficialChecks && gurpsSchema !== 'wiki-gurps-cast.v1') {
    const script = await resolveTrustedSourcePath(root, 'scripts/gurps-cast.mjs');
    await verifySnapshot(root, allInputs);
    officialChecks.push(Object.freeze({ checkName: 'gurps-cast', ...run(process.execPath, [script, '--check', '--revision', sourceRevision], root) }));
  }
  await verifySnapshot(root, allInputs);
  await verifyGitInputs(root, allInputs, sourceRevision);
  if (run('git', ['-C', root, 'rev-parse', 'HEAD'], root).stdout.trim() !== sourceRevision) fail('E_SOURCE_CHANGED', 'Git HEAD changed while loading');
  return Object.freeze({ sourceRevision, sourceSetSha256, files: Object.freeze(files), records: Object.freeze(records), referenceFiles, engineFiles, excludedFiles, officialChecks: Object.freeze(officialChecks) });
}

export async function loadTrustedRenderer({ sourceRoot, bundle, scriptPath = 'scripts/lore-json-render.mjs' }) {
  if (scriptPath !== 'scripts/lore-json-render.mjs') fail('E_SOURCE_SCRIPT_UNTRUSTED', 'only the fixed lore renderer may be imported');
  const path = await resolveTrustedSourcePath(sourceRoot, scriptPath);
  const source = bundle.files.find((file) => file.logical_path === scriptPath);
  if (!source || sha256(await readFile(path)) !== source.sha256) fail('E_SOURCE_CHANGED', scriptPath);
  const url = pathToFileURL(path);
  url.searchParams.set('sha256', source.sha256);
  const renderer = await import(url.href);
  if (typeof renderer.renderLoreMarkdown !== 'function') fail('E_SOURCE_SCRIPT_UNTRUSTED', 'renderer export is missing');
  if (sha256(await readFile(path)) !== source.sha256) fail('E_SOURCE_CHANGED', scriptPath);
  return Object.freeze({ renderLoreMarkdown: renderer.renderLoreMarkdown });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === '--help') console.log('Usage: node sources.mjs --source-root <absolute WIKI path> --check');
    else {
      if (args.length !== 3 || args[0] !== '--source-root' || args[2] !== '--check') fail('E_SOURCE_USAGE', 'use --source-root <absolute WIKI path> --check');
      const bundle = await loadSourceBundle({ sourceRoot: args[1], runOfficialChecks: true });
      console.log(JSON.stringify({ sourceRevision: bundle.sourceRevision, sourceSetSha256: bundle.sourceSetSha256,
        source_data_count: DATA_SOURCE_PATHS.length, script_count: SCRIPT_SOURCE_PATHS.length, file_count: bundle.files.length,
        record_count: bundle.records.length, missing: 0, duplicate: 0,
        script_hashes: bundle.files.filter((file) => SCRIPT_SOURCE_PATHS.includes(file.logical_path)).map(({ logical_path, sha256 }) => ({ logical_path, sha256 })),
        officialChecks: bundle.officialChecks }, null, 2));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
