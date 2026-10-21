import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import childProcess from 'node:child_process';
import { openReadOnly } from '../cast-sqlite/db.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { loadDatabasePersonDetailMappingAuthority, assertApprovedPersonDetailMappingReceipt } from '../public-person-detail-admission.mjs';
import './person-tier-replay.mjs';
import './person-mapping-current-source.mjs';

test('DB mapping authority preserves existing receipt validation without source filesystem reads', {
  skip: !process.env.PERSON_MAPPING_AUTHORITY_DB,
}, async () => {
  const base = '/tmp/seoul-document-authority-20261020/';
  const db = openReadOnly(process.env.PERSON_MAPPING_AUTHORITY_DB);
  const stores = {};
  const names = { evidenceStore: 'person-tier-dependencies-evidence-20261020.sqlite',
    historyStore: 'person-tier-history-evidence-20261020.sqlite', originalMappingStore: 'evidence-st01a1590d.sqlite',
    finalMappingStore: 'person-mapping-final-evidence-20261020.sqlite', sourceStore: 'person-mapping-sources-evidence-20261020.sqlite' };
  for (const [key, name] of Object.entries(names)) stores[key] = openEvidenceStore(base + name, { capability: INTERNAL_EVIDENCE_CAPABILITY });
  const editorialProfiles = openEditorialProfiles(base + 'private-profile-bootstrap-root/editorial-profiles.sqlite',
    { capability: INTERNAL_PROFILE_CAPABILITY, expectedSourceHashes: EDITORIAL_PROFILE_SOURCE_HASHES });
  const saved = [fs.readFileSync, fs.readFile, fsp.readFile];
  const methods = ['exec', 'execFile', 'spawn', 'execSync', 'execFileSync', 'spawnSync'];
  const savedMethods = methods.map(name => childProcess[name]);
  try {
    const deny = () => { throw new Error('mapping source filesystem forbidden'); };
    fs.readFileSync = fs.readFile = fsp.readFile = deny;
    for (const name of methods) childProcess[name] = deny;
    syncBuiltinESMExports();
    db.exec('BEGIN');
    const authority = await loadDatabasePersonDetailMappingAuthority({ db, ...stores, editorialProfiles });
    const receipt = JSON.parse(authority.receiptBytes);
    assert.equal(receipt.details.length, 1022);
    assert.equal(Object.keys(authority.sources).length, 44);
    assert.equal(assertApprovedPersonDetailMappingReceipt(authority, receipt.details), true);
    assert.throws(() => assertApprovedPersonDetailMappingReceipt({ ...authority }, receipt.details));
    const missingOmission = { getEvidence(identity, hash) {
      if (identity === 'scripts/public-legacy-projection-receipt.json') throw new Error('missing omission receipt');
      return stores.finalMappingStore.getEvidence(identity, hash);
    } };
    await assert.rejects(loadDatabasePersonDetailMappingAuthority({ db, ...stores, editorialProfiles,
      finalMappingStore: missingOmission }), /missing omission receipt/u);
    const missingOriginal = { getEvidence() { throw new Error('missing original mapping'); } };
    await assert.rejects(loadDatabasePersonDetailMappingAuthority({ db, ...stores, editorialProfiles,
      originalMappingStore: missingOriginal }), /missing original mapping/u);
    db.exec('COMMIT');
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile] = saved;
    methods.forEach((name, i) => { childProcess[name] = savedMethods[i]; });
    syncBuiltinESMExports();
    editorialProfiles.close(); Object.values(stores).forEach(store => store.close()); db.close();
  }
});
