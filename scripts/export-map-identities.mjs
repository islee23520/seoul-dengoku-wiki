import { createHash } from 'node:crypto';
import { createReadStream, existsSync, lstatSync, readFileSync, realpathSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { isAbsolute, resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openReadOnly } from './cast-sqlite/db.mjs';
import { readAffiliationIdentityInputs, readInternalAffiliationIdentityInputs } from './cast-sqlite/map-identity-inputs.mjs';
import { readInternalIdentityDomain } from './internal-identity-provider.mjs';

// Reviewed public members of seoul-wiki-sqlite-provision.v1, manifest SHA
// 05e82ab71c0d970304d7f319170047e7b924f71467cdac6edae280fb75f98a92.
// Integrity is not person-field approval. No person/polity adapter is registered.
const snapshotPins = Object.freeze({
  databaseSha256: '33fc48dbcf335b05bf64391279faa48dbdeabbb03932e97f07886b683bba7859',
  bootstrapReceiptSha256: '2bd194d0e2b66c10d704e96279453954d6790427ea3ea37642af76117f9a6b5e',
});
const fail = (code, detail, diagnostics) => {
  throw Object.assign(new Error(`${code}: ${detail}`), { code, ...(diagnostics ? { diagnostics } : {}) });
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const encode = value => `${JSON.stringify(value, null, 2)}\n`;

export function validateIdentityRequest(request) {
  const internal = request?.schema === 'wiki-internal-map-identity-request.v1';
  const keys = ['schema', 'databasePath', 'bootstrapReceiptPath', 'outputDirectory', ...(internal ? ['selectionId', 'evidencePath'] : [])];
  if (!request || Array.isArray(request) || typeof request !== 'object'
    || Object.keys(request).length !== keys.length || keys.some(key => !Object.hasOwn(request, key))
    || !['wiki-map-identity-request.v1', 'wiki-internal-map-identity-request.v1'].includes(request.schema)
    || internal && (typeof request.selectionId !== 'string' || !request.selectionId)
    || keys.filter(key => key !== 'schema' && key !== 'selectionId').some(key => typeof request[key] !== 'string' || !isAbsolute(request[key]) || resolve(request[key]) !== request[key]))
    fail('E_IDENTITY_REQUEST', 'expected exact wiki-map-identity-request.v1 with absolute normalized paths');
  return request;
}

function fingerprint(path, sqlite = false) {
  const stat = lstatSync(path, { bigint: true });
  if (!stat.isFile() || stat.isSymbolicLink() || realpathSync(path) !== path)
    fail('E_IDENTITY_SNAPSHOT', 'regular non-symlink input required');
  if (sqlite && ['-wal', '-journal'].some(suffix => existsSync(path + suffix)))
    fail('E_IDENTITY_SNAPSHOT', 'checkpointed database required');
  return [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].join(':');
}

async function fileHash(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}

/** Provider registration is a code integration boundary, never a request option.
 * A future person-polity provider must authenticate its own field mappings and
 * return only approved minimal fields. Tests register synthetic providers/pins;
 * the production CLI below has neither a dynamic loader nor a pin override.
 */
export function createIdentityExporter({ pins, providers, selections = {} }) {
  return async request => {
    validateIdentityRequest(request);
    const internal = request.schema === 'wiki-internal-map-identity-request.v1';
    const selected = internal && Object.hasOwn(selections, request.selectionId) ? selections[request.selectionId] : null;
    if (internal && !selected) fail('E_IDENTITY_SELECTION_UNAVAILABLE', 'no accepted internal successor binding');
    const sourcePins = selected ?? pins;
    const { databasePath, bootstrapReceiptPath, outputDirectory } = request;
    const beforeDb = fingerprint(databasePath, true);
    const beforeReceipt = fingerprint(bootstrapReceiptPath);
    const beforeEvidence = internal ? fingerprint(request.evidencePath) : null;
    const evidenceBytes = internal ? readFileSync(request.evidencePath, 'utf8') : null;
    const bootstrapBytes = readFileSync(bootstrapReceiptPath);
    if (hash(bootstrapBytes) !== sourcePins.bootstrapReceiptSha256 || await fileHash(databasePath) !== sourcePins.databaseSha256)
      fail('E_IDENTITY_SNAPSHOT', 'untrusted database or bootstrap receipt bytes');
    const unchanged = () => {
      if (fingerprint(databasePath, true) !== beforeDb || fingerprint(bootstrapReceiptPath) !== beforeReceipt)
        fail('E_IDENTITY_SNAPSHOT', 'input changed during export');
      if (internal && fingerprint(request.evidencePath) !== beforeEvidence) fail('E_IDENTITY_SNAPSHOT', 'evidence changed during export');
    };
    unchanged();
    const db = openReadOnly(databasePath);
    let snapshot;
    try {
      db.exec('PRAGMA query_only=ON; BEGIN');
      const affiliation = internal ? readInternalAffiliationIdentityInputs(db, selected.affiliation) : readAffiliationIdentityInputs(db);
      const diagnostics = { states: affiliation.states.length, hegemons: affiliation.hegemons.length,
        unresolvedUnions: affiliation.hegemons.filter(row => row.resolution === 'unresolved-source-binding').length };
      const provider = providers.get('person-polity');
      if (!internal && !provider) fail('E_IDENTITY_DOMAIN_MISSING', 'person-polity', diagnostics);
      // Only SELECT is exposed to domain adapters; no connection/write capability.
      const reader = Object.freeze({ prepare(sql) {
        if (!/^SELECT\s/iu.test(sql)) fail('E_IDENTITY_PROVIDER', 'SELECT-only provider');
        return db.prepare(sql);
      } });
      const domain = internal ? readInternalIdentityDomain(reader, affiliation, selected, evidenceBytes) : provider(reader, affiliation);
      if (!domain || domain.complete !== true || !Array.isArray(domain.persons) || !Array.isArray(domain.polities)
        || !Array.isArray(domain.blocs) || !Array.isArray(domain.fieldProvenance))
        fail('E_IDENTITY_DOMAIN_MISSING', 'person-polity', diagnostics);
      if (domain.requiresAffiliation !== false && diagnostics.unresolvedUnions)
        fail('E_IDENTITY_UNRESOLVED_UNION', 'required affiliation has unresolved-source-binding', diagnostics);
      snapshot = { schema: 'wiki-map-identities.v1', visibility: 'protected',
        verification: internal ? 'trusted-snapshot/internal-approved-successor-projection' : 'trusted-snapshot/sealed-admitted-revision-projection',
        ...(internal ? { scope: 'internal-approved-successor', publicAdmission: false } : {}),
        persons: domain.persons, polities: domain.polities, blocs: domain.blocs, fieldProvenance: domain.fieldProvenance };
      db.exec('COMMIT');
    } finally {
      if (db.isTransaction) db.exec('ROLLBACK');
      db.close();
    }
    unchanged();
    const identityBytes = encode(snapshot);
    const receipt = { schema: 'wiki-map-identity-receipt.v1', verification: snapshot.verification,
      databaseSha256: sourcePins.databaseSha256, bootstrapReceiptSha256: sourcePins.bootstrapReceiptSha256,
      ...(internal ? { scope: 'internal-approved-successor', publicAdmission: false, selectionId: request.selectionId,
        evidenceSha256: selected.evidenceSha256, affiliation: selected.affiliation, approvalRef: selected.approvalRef } : {}),
      identitySha256: hash(identityBytes), fieldProvenanceSha256: hash(encode(snapshot.fieldProvenance)),
      counts: { persons: snapshot.persons.length, polities: snapshot.polities.length, blocs: snapshot.blocs.length } };
    // A sibling stage makes the pair visible together; never replace existing output.
    if (existsSync(outputDirectory)) fail('E_IDENTITY_OUTPUT_EXISTS', 'output directory already exists');
    const stage = join(dirname(outputDirectory), `.${basename(outputDirectory)}-${process.pid}.stage`);
    mkdirSync(stage, { mode: 0o700 });
    try {
      writeFileSync(join(stage, 'identity.json'), identityBytes, { flag: 'wx', mode: 0o600 });
      writeFileSync(join(stage, 'receipt.json'), encode(receipt), { flag: 'wx', mode: 0o600 });
      unchanged();
      if (existsSync(outputDirectory)) fail('E_IDENTITY_OUTPUT_EXISTS', 'output directory already exists');
      renameSync(stage, outputDirectory);
    } catch (error) { rmSync(stage, { recursive: true, force: true }); throw error; }
    return receipt;
  };
}

export const exportMapIdentities = createIdentityExporter({ pins: snapshotPins, providers: new Map(),
  selections: JSON.parse(readFileSync(new URL('./internal-identity-selections.json', import.meta.url), 'utf8')) });

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--request' || !isAbsolute(process.argv[3]))
      fail('E_IDENTITY_REQUEST', 'usage: --request /absolute/request.json');
    await exportMapIdentities(JSON.parse(readFileSync(process.argv[3], 'utf8')));
  } catch (error) {
    console.error(error.message);
    if (error.diagnostics) console.error(JSON.stringify(error.diagnostics));
    process.exitCode = 1;
  }
}
