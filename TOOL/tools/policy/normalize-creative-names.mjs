import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, '..', '..', '..');
const ledgerPath = resolve(repositoryRoot, 'RESEARCH/verification/creative-name-normalization.json');
const graphPath = resolve(repositoryRoot, 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json');
const schemaPath = resolve(repositoryRoot, 'TOOL/tools/wiki/world-atlas-schema.mjs');
const write = process.argv.includes('--write');
const fromHead = process.argv.includes('--from-head');

if (fromHead && !write) {
  throw new Error('--from-head requires --write');
}

const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
const stationNames = new Set(graph.stations.map((station) => station.nameKo));

const excludedPrefixes = [
  'archive/',
  'store/',
  '.omo/',
  'RESEARCH/canon-reference/',
  'RESEARCH/verification/worktree-cleanup/',
  'TOOL/tools/regions/data/',
  'LORE/regions/content/',
  'LORE/regions/sources/',
];
const excludedFiles = new Set([
  'GDD/adr/ADR-003-real-place-and-station-naming.md',
  'RESEARCH/verification/creative-name-normalization.json',
  'TOOL/tools/wiki/company-aliases.json',
  'TOOL/tools/wiki/world-atlas-schema.mjs',
]);

function isExcluded(path) {
  return excludedFiles.has(path)
    || /^TOOL\/tools\/(wiki|cast)\/test-.*\.mjs$/u.test(path)
    || path.includes('/fixtures/')
    || excludedPrefixes.some((prefix) => path.startsWith(prefix));
}

function isIncluded(path) {
  if (['Concept.md', 'Design.md', 'Intent.md', 'README.md', 'ToDo.md'].includes(path)) return true;
  return [
    'LORE/',
    'GDD/',
    'WEB/',
    'GDD/',
    'GAME/Assets/Janseon/Data/',
    'TOOL/tools/wiki/',
    'TOOL/tools/cast/',
  ].some((prefix) => path.startsWith(prefix));
}

for (const entry of [...ledger.replacements, ...ledger.retained]) {
  if (entry.kind === 'external-theater') continue;
  if (!stationNames.has(entry.anchor)) {
    throw new Error(`${entry.id ?? entry.old}: station anchor not found in SeoulWorldGraph.json: ${entry.anchor}`);
  }
}
for (const entry of ledger.pattern_replacements) {
  if (!stationNames.has(entry.anchor)) {
    throw new Error(`pattern station anchor not found in SeoulWorldGraph.json: ${entry.anchor}`);
  }
}

const schema = await import(pathToFileURL(schemaPath));
const schemaCollections = {
  state: schema.STATES,
  'corporate-house': schema.CORPORATE_HOUSES,
  'civic-house': schema.CIVIC_HOUSES,
  'external-theater': schema.THEATERS,
};
for (const entry of [...ledger.replacements, ...ledger.retained]) {
  if (!entry.id || !schemaCollections[entry.kind]) continue;
  const actual = schemaCollections[entry.kind].find((item) => item.id === entry.id)?.name;
  const expected = entry.new ?? entry.name;
  if (actual !== expected) {
    throw new Error(`${entry.id}: schema name ${JSON.stringify(actual)} does not match ledger ${JSON.stringify(expected)}`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\0').filter(Boolean).filter((path) => isIncluded(path) && !isExcluded(path));
const changedTrackedFiles = fromHead
  ? new Set(execFileSync('git', ['diff', '--name-only', '-z'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }).split('\0').filter(Boolean))
  : null;

const literalReplacements = [...ledger.replacements]
  .filter((entry) => entry.old !== entry.new)
  .sort((a, b) => b.old.length - a.old.length)
  .map((entry) => ({
    ...entry,
    regex: /^[A-Za-z0-9]+$/u.test(entry.old)
      ? new RegExp(`(?<![\\p{L}\\p{N}_])${entry.old}(?![\\p{L}\\p{N}_])`, 'gu')
      : null,
  }));
const patternReplacements = ledger.pattern_replacements.map((entry) => ({
  ...entry,
  regex: new RegExp(entry.pattern, 'gu'),
}));

const violations = [];
let changedFiles = 0;
let changedOccurrences = 0;

for (const relativePath of trackedFiles) {
  const absolutePath = resolve(repositoryRoot, relativePath);
  let current;
  let original;
  try {
    current = readFileSync(absolutePath, 'utf8');
    original = fromHead && changedTrackedFiles.has(relativePath)
      ? execFileSync('git', ['show', `HEAD:${relativePath}`], {
          cwd: repositoryRoot,
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
        })
      : current;
  } catch {
    continue;
  }
  if (original.includes('\0')) continue;

  let updated = original;
  for (const entry of literalReplacements) {
    const matches = entry.regex ? updated.match(entry.regex) : null;
    const count = entry.regex ? (matches?.length ?? 0) : updated.split(entry.old).length - 1;
    if (!count) continue;
    if (!write) violations.push({ path: relativePath, legacy: entry.old, count });
    updated = entry.regex ? updated.replace(entry.regex, entry.new) : updated.split(entry.old).join(entry.new);
    changedOccurrences += count;
  }
  for (const entry of patternReplacements) {
    const matches = updated.match(entry.regex);
    if (!matches) continue;
    if (!write) violations.push({ path: relativePath, legacy: entry.pattern, count: matches.length });
    updated = updated.replace(entry.regex, entry.new);
    changedOccurrences += matches.length;
  }

  if (updated === current) continue;
  changedFiles += 1;
  if (write) writeFileSync(absolutePath, updated);
}

if (!write && violations.length > 0) {
  for (const violation of violations.slice(0, 200)) {
    console.error(`${violation.path}: ${violation.legacy} (${violation.count})`);
  }
  if (violations.length > 200) console.error(`... ${violations.length - 200} more file/name violations`);
  console.error(`Creative-name policy failed: ${changedOccurrences} legacy occurrences in ${changedFiles} files.`);
  process.exit(1);
}

console.log(`${write ? 'Normalized' : 'Verified'} creative names: ${changedOccurrences} occurrences in ${changedFiles} files.`);
