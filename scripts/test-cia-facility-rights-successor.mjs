import { readSourceArchive } from './cast-sqlite/source-archive.mjs';
import { readPrivateSourceArchive } from './document-store/private-source-archive.mjs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { authenticateExactBodyApproval } from './document-store/publication-database-inputs.mjs';
const archivePins = { allocation: '21d7663507b896a43d70fc459f662376780b477b5c2078af100b2d42bbe7079d', holdings: '1801d7bb8d27af743f74ea447d4f7be782b9d8ba7ba5b37af4d0c6f2b6329a12', district: '4d4372a151ea3b5b3750f4209009850786878a9a1b0f03d6263b82f713be39e3', contract: '383d14c96312dcfd849cb9906b3ff16f4c2bc4c9f8ee0b93816a6d2aad333fd8' };
const archived = path => {
  const key = Object.entries({ allocation: 'lore/relations/opening-feudal-allocation.json', holdings: 'lore/relations/personal-holdings.json', district: 'lore/regions/content/11170.json', contract: 'lore/editorial/Seoul-Scope-Contract.json' }).find(([, logicalPath]) => logicalPath === path)?.[0];
  return key === 'contract' ? readPrivateSourceArchive(process.env.PUBLICATION_NEW_BODY_ROOT ?? fileURLToPath(new URL('../', import.meta.url)), path, archivePins[key]) : readSourceArchive(path, archivePins[key]);
};
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'vitest';
import { authenticateRightsTransition, validateSeoulScope, proposalHash } from './seoul-scope.mjs';
import { correctCiaFacilityFootprint, CIA_FACILITY_DECISION } from './cia-facility-only-correction.mjs';
import { authenticateCiaFacilityRights, applyCiaFacilityScopeSuccessor, ciaFacilityScopeContext,
  authenticateApprovedCommandRelation, composeApprovedCommandRelation, APPROVED_COMMAND_RELATION } from './cia-facility-rights-successor.mjs';
import { CIA_FACILITY_OWNER_BYTES } from './cia-facility-projection-input.mjs';

const read = path => path.startsWith('lore/') ? archived(path) : readFileSync(path.startsWith('.omo/') && process.env.PUBLICATION_NEW_BODY_ROOT
  ? resolve(process.env.PUBLICATION_NEW_BODY_ROOT, path) : new URL('../' + path, import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = { allocation: 'lore/relations/opening-feudal-allocation.json',
  holdings: 'lore/relations/personal-holdings.json', district: 'lore/regions/content/11170.json' };

test('facility retirement composes with the real immutable 306-right transition without broadening it', () => {
  const baseline = JSON.parse(read('.omo/private/seoul-migration/baseline.json'));
  const packet = JSON.parse(read('.omo/private/seoul-migration/seoul-rights-transition-20261015/staging-packet.json'));
  const rightsTransition = {
    approvalBody: read('scripts/approved-seoul-rights-transition.json').toString(),
    receiptBody: read('.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md').toString(),
    sources: packet.files.map(row => ({ sourcePath: row.path, beforeBody: row.beforeUtf8, afterBody: row.afterUtf8 })),
  };
  const predecessorBytes = { ...Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)])),
    contract: read('lore/editorial/Seoul-Scope-Contract.json') };
  const beforeHashes = Object.fromEntries(Object.entries(paths).map(([key, path]) => [path, hash(predecessorBytes[key])]));
  const prior = authenticateRightsTransition(baseline, rightsTransition, beforeHashes);
  assert.equal(prior.retired.size, 306);
  const candidate = correctCiaFacilityFootprint({ ...Object.fromEntries(Object.entries(predecessorBytes)
    .map(([key, bytes]) => [key, JSON.parse(bytes)])), decisionRef: CIA_FACILITY_DECISION });
  const currentBytes = Object.fromEntries(Object.keys(paths).map(key => [key, Buffer.from(JSON.stringify(candidate[key]))]));
  const sourceHashes = Object.fromEntries(Object.entries(paths).map(([key, path]) => [path, hash(currentBytes[key])]));
  const args = { baseline, rightsTransition, predecessorBytes, currentBytes, sourceHashes,
    decisionBytes: CIA_FACILITY_OWNER_BYTES };
  const beforeProof = structuredClone(rightsTransition);
  const result = authenticateCiaFacilityRights(args);
  assert.equal(result.retired.size, 308);
  for (const [key, value] of prior.retired) assert.deepEqual(result.retired.get(key), value);
  for (const [set, ids] of Object.entries(prior.entitySets)) assert.deepEqual(result.entitySets[set],
    ids.filter(id => !['title:duchy-s08', 'holding:opening-duchy-s08-demesne'].includes(id)));
  assert.ok(result.entitySets.holdings.includes('holding:capital-s08'));
  assert.deepEqual(rightsTransition, beforeProof);
  assert.throws(() => authenticateRightsTransition(baseline, rightsTransition, sourceHashes));
  assert.throws(() => authenticateCiaFacilityRights({ ...args, sourceHashes: beforeHashes }), /E_CIA_FACILITY_RIGHTS/u);
  assert.throws(() => authenticateCiaFacilityRights({ ...args, rightsTransition: null }), /E_CIA_FACILITY_RIGHTS/u);
  const altered = structuredClone(rightsTransition);
  altered.approvalBody += ' ';
  assert.throws(() => authenticateCiaFacilityRights({ ...args, rightsTransition: altered }));
  const expanded = JSON.parse(currentBytes.allocation);
  expanded.titles.pop();
  const alteredBytes = { ...currentBytes, allocation: Buffer.from(JSON.stringify(expanded)) };
  assert.throws(() => authenticateCiaFacilityRights({ ...args, currentBytes: alteredBytes,
    sourceHashes: { ...sourceHashes, [paths.allocation]: hash(alteredBytes.allocation) } }), /E_CIA_FACILITY_CORRECTION/u);

  // Use the real identity denominator, exact CIA entities/dispositions and old
  // 306-transition. Synthetic document batches keep this an inexpensive runtime
  // integration test, not a replay of the hours-long publication census.
  const contract = JSON.parse(predecessorBytes.contract);
  const sourcePaths = [...new Set([...Object.values(paths), ...contract.entities.map(row => row.sourcePath)])];
  const hashes = Object.fromEntries(sourcePaths.map(path => [path, beforeHashes[path] ?? hash(path)]));
  const fixtureBaseline = { ...baseline, files: sourcePaths.map(path => ({ path, kind: 'authored-lore', sha256: hashes[path] })) };
  contract.documents = sourcePaths.map(sourcePath => ({ sourcePath, status: 'active',
    reviewReceipt: { currentSha256: hashes[sourcePath], evidencePath: 'fixture-reviewed', reviewedAt: '2026-10-21' },
    batchId: 'fixture-documents', basis: 'fixture document review' }));
  contract.rail = { stationRefs: [], edgeRefs: [] };
  const boundary = contract.boundarySource;
  const refs = [...new Set(contract.entities.flatMap(row => [...row.locationRefs, ...row.jurisdictionRefs]))]
    .map(id => ({ id, kind: id.startsWith('station:') ? 'station' : 'region', inside: true, boundarySha256: boundary.sha256 }));
  const batchIds = [...new Set([...contract.entities, ...contract.documents, ...contract.dispositions]
    .filter(row => row.status === 'active').map(row => row.batchId))];
  const batches = batchIds.map(id => {
    const proposal = { entities: contract.entities.filter(row => row.batchId === id),
      documents: contract.documents.filter(row => row.batchId === id),
      dispositions: contract.dispositions.filter(row => row.batchId === id), geography: null };
    const sample = kind => ({ body: 'fixture', approval: { kind, batchId: id, bodySha256: hash('fixture'), messageRef: 'fixture' } });
    return { id, proposal, approval: { kind: 'batch-allocation', batchId: id, bodySha256: proposalHash(proposal), messageRef: 'fixture' },
      articleSample: sample('article-style'), cardSample: sample('card-style'),
      entityKeys: proposal.entities.map(row => `${row.kind}:${row.id}`),
      documentPaths: proposal.documents.filter(row => row.status === 'active').map(row => row.sourcePath),
      dispositionKeys: proposal.dispositions.map(row => JSON.stringify([row.set, row.id])),
      dependencyBatchIds: id === 'fixture-documents' ? [] : ['fixture-documents'] };
  });
  const input = { baseline: fixtureBaseline, baselineSha256: contract.baselineSha256, contract,
    boundary, sourceHashes: hashes, archiveHashes: Object.fromEntries(Object.entries(baseline.archives).map(([name, row]) => [name, row.sha256])),
    current: { entitySets: prior.entitySets, rightsTransition, documentPaths: sourcePaths,
      rights: [...prior.entitySets.holdings, ...prior.entitySets.grants].map(id => ({ id, holderPersonId: 'K194', slotStatus: null })) },
    refs, edges: [], geography: null, facts: null, review: null, batches };
  assert.deepEqual(validateSeoulScope(input, { mode: 'inspection' }), { ok: true, errors: [] });
  const inputBefore = structuredClone(input);
  const applied = applyCiaFacilityScopeSuccessor(input, result);
  assert.deepEqual(input, inputBefore);
  assert.deepEqual(validateSeoulScope(applied, { mode: 'inspection' }), { ok: true, errors: [] });
  assert.deepEqual(ciaFacilityScopeContext(applied).batchContract, input.contract);
  if (process.env.PUBLICATION_SUCCESSOR_DB && process.env.PUBLICATION_NEW_BODY_ROOT) {
    const db = new DatabaseSync(process.env.PUBLICATION_SUCCESSOR_DB, { readOnly: true });
    try {
      const proof = authenticateApprovedCommandRelation({ db, root: process.env.PUBLICATION_NEW_BODY_ROOT });
      const approved = authenticateExactBodyApproval(process.env.PUBLICATION_NEW_BODY_ROOT).get('lore/characters/Cast-Relations.json');
      const commandIds = approved.content.filter(block => block.kind === 'table')
        .flatMap(block => block.rows.map((_, i) => `R:${block.anchor}:${i + 1}`));
      const commandInput = { ...input, current: { ...input.current,
        entitySets: { ...input.current.entitySets, relations: commandIds } } };
      const composed = composeApprovedCommandRelation(commandInput, result, proof);
      assert.deepEqual(validateSeoulScope(composed, { mode: 'inspection' }), { ok: true, errors: [] });
      assert.deepEqual(composed.current.entitySets.titles, applied.current.entitySets.titles);
      assert.deepEqual(composed.current.entitySets.grants, applied.current.entitySets.grants);
      assert.deepEqual(composed.contract, applied.contract);
      assert.deepEqual(composed.current.entitySets.relations, commandInput.current.entitySets.relations);
      assert.throws(() => composeApprovedCommandRelation(commandInput, result, { ...proof }), /E_CIA_FACILITY_RIGHTS/u);
      for (const ids of [commandInput.current.entitySets.relations.slice(0, -1),
        [...commandInput.current.entitySets.relations, 'R:extra:1'], [...commandInput.current.entitySets.relations].reverse()]) {
        assert.throws(() => composeApprovedCommandRelation({ ...commandInput, current: { ...commandInput.current,
          entitySets: { ...commandInput.current.entitySets, relations: ids } } }, result, proof), /E_CIA_FACILITY_RIGHTS/u);
      }
      for (const changed of [{ from_person_id: 'K001' }, { type_ko: '계약' }]) {
        const view = { prepare(sql) {
          const statement = db.prepare(sql);
          if (sql.includes("FROM relation WHERE relation_id='relation-1389'")) return { get: () => ({ ...statement.get(), ...changed }) };
          return statement;
        } };
        assert.throws(() => authenticateApprovedCommandRelation({ db: view, root: process.env.PUBLICATION_NEW_BODY_ROOT }), /E_CIA_FACILITY_RIGHTS/u);
      }
      assert.throws(() => authenticateApprovedCommandRelation({ db, root: '/wrong-proof' }), /ENOENT/u);
      const altered = { ...composed, current: { ...composed.current, entitySets: { ...composed.current.entitySets,
        relations: composed.current.entitySets.relations.filter(id => id !== APPROVED_COMMAND_RELATION) } } };
      assert.throws(() => ciaFacilityScopeContext(altered), /E_CIA_FACILITY_RIGHTS/u);
    } finally { db.close(); }
  }
  assert.equal(applied.current.rights.length, input.current.rights.length - 1);
  assert.equal(applied.contract.entities.length, input.contract.entities.length);
  assert.equal(applied.contract.dispositions.length, input.contract.dispositions.length);
  const reordered = structuredClone(input);
  reordered.current.entitySets = Object.fromEntries(Object.entries(input.current.entitySets)
    .map(([set, ids]) => [set, [...ids].reverse()]));
  assert.deepEqual(validateSeoulScope(applyCiaFacilityScopeSuccessor(reordered, result), { mode: 'inspection' }), { ok: true, errors: [] });
  const duplicate = structuredClone(input);
  duplicate.current.entitySets = structuredClone(input.current.entitySets);
  duplicate.current.entitySets.persons[0] = duplicate.current.entitySets.persons[1];
  assert.throws(() => applyCiaFacilityScopeSuccessor(duplicate, result), /E_CIA_FACILITY_RIGHTS/u);
  const replacement = structuredClone(input);
  replacement.current.entitySets = structuredClone(input.current.entitySets);
  replacement.current.entitySets.persons[0] = 'K-unissued';
  assert.throws(() => applyCiaFacilityScopeSuccessor(replacement, result), /E_CIA_FACILITY_RIGHTS/u);
  for (const mutate of [
    next => { next.current.ciaFacilitySuccessor = structuredClone(result); },
    next => { delete next.current.ciaFacilitySuccessor; },
    next => { next.sourceHashes[paths.allocation] = beforeHashes[paths.allocation]; },
    next => { next.contract.entities.find(row => row.id === 'title:duchy-s08').basis = 'unapproved'; },
    next => { next.contract.entities.find(row => row.id === 'title:duchy-s08').jurisdictionRefs = ['region:1117051000']; },
    next => { next.contract.dispositions.find(row => row.id === 'title:duchy-s08').batchId = 'approved-rights-transition'; },
    next => { next.contract.entities.find(row => row.id === 'holding:capital-s08').batchId = 'cia-facility-only-20261021'; },
    next => { next.batches[0].approval.bodySha256 = '0'.repeat(64); },
    next => { next.current.entitySets.holdings.pop(); },
    next => { next.current.rights.push({ id: 'holding:opening-duchy-s08-demesne', holderPersonId: 'K194', slotStatus: null }); },
  ]) {
    const next = structuredClone(applied);
    next.current.ciaFacilitySuccessor = result;
    mutate(next);
    assert.equal(validateSeoulScope(next, { mode: 'inspection' }).ok, false);
  }
  result.retired.clear();
  assert.throws(() => ciaFacilityScopeContext(applied), /E_CIA_FACILITY_RIGHTS/u);
});
