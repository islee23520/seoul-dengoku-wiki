import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

export const requiredGreenCases = Object.freeze([
  'DefaultPlaceIdCannotEnterCatalog',
  'DefaultPlaceIdReportsInvalid',
  'DuplicateIdWithConflictingMetadataIsRejected',
  'IdenticalDuplicateIsIdempotent',
  'IdentityIgnoresObservedLevel',
  'ManualDataSurfaceRecordsIdentityAndConflict',
  'SameDisplayNameWithDifferentStableIdRemainsDistinct',
  'StableIdBoundaryRejectsNullOrWhitespaceAndPreservesOrdinalIdentity',
  'StationIdUsesExactOrdinalIdentity',
  'UndefinedPlaceKindIsRejected',
]);

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export const buildGreenReceipt = (implementationCommit, xmlPath, xmlRelativePath) => {
  const xml = readFileSync(xmlPath);
  const text = xml.toString('utf8');
  const run = text.match(/<test-run[^>]*total="(\d+)"[^>]*passed="(\d+)"[^>]*failed="(\d+)"[^>]*skipped="(\d+)"/);
  if (!run) throw new TypeError('green XML test-run summary is missing');
  for (const testCase of requiredGreenCases) {
    if (!text.includes(`name="${testCase}"`)) throw new TypeError(`green XML missing case ${testCase}`);
  }
  return Object.freeze({
    schema_version: 'task02-green-receipt.v1',
    implementation_commit: implementationCommit,
    xml_path: xmlRelativePath,
    xml_sha256: sha256(xml),
    total: Number(run[1]),
    passed: Number(run[2]),
    failed: Number(run[3]),
    skipped: Number(run[4]),
    required_cases: requiredGreenCases,
  });
};

const main = () => {
  const [implementationCommit, xmlPath, xmlRelativePath, outputPath] = process.argv.slice(2);
  if (!implementationCommit || !xmlPath || !xmlRelativePath || !outputPath) {
    throw new TypeError('usage: build-task02-green-receipt.mjs <implementation-commit> <xml> <xml-relative-path> <output>');
  }
  writeFileSync(outputPath, `${JSON.stringify(buildGreenReceipt(implementationCommit, xmlPath, xmlRelativePath), null, 2)}\n`);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
