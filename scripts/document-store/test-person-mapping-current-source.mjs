import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { createHash } from 'node:crypto';
import { openReadOnly } from '../cast-sqlite/db.mjs';
import { readPersonMappingCurrentSource, verifyPersonMappingCurrentSources } from './person-mapping-current-source.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';

test('authoring schemas are not mistaken for character or faction article sources', () => {
  const db = { prepare() { throw Error('article authority must not be consulted'); } };
  for (const domain of ['characters','factions']) {
    const path = `lore/${domain}/authoring.schema.json`;
    assert.throws(() => readPersonMappingCurrentSource(db,path,'0'.repeat(64)),
      error => error.message === `E_MAPPING_TYPED_SOURCE_UNSUPPORTED:${path}`);
  }
});

test('supported mapping source families reconstruct complete current documents and reject unsupported ones', {
  skip: !process.env.PERSON_MAPPING_CURRENT_DB,
}, () => {
  const db = openReadOnly(process.env.PERSON_MAPPING_CURRENT_DB);
  const editorialProfiles = openEditorialProfiles('/tmp/seoul-document-authority-20261020/private-profile-bootstrap-root/editorial-profiles.sqlite',
    { capability: INTERNAL_PROFILE_CAPABILITY, expectedSourceHashes: EDITORIAL_PROFILE_SOURCE_HASHES });
  const originals = [fs.readFileSync, fs.readFile, fsp.readFile, JSON.parse];
  let sourceStore;
  try {
    const expected = [];
    const paths = ['lore/name-pools/values-cast.json', 'lore/relations/opening-office-appointments.json',
      'lore/relations/personal-holdings.json', 'lore/relations/relations.json', 'person-rights-permissions.json',
      'lore/name-pools/cast-household-relations.json', 'lore/name-pools/gurps-cast.json',
      'lore/name-pools/cast-hangnyeol.json', 'lore/name-pools/gender-cast.json',
      'lore/name-pools/cast-birthdays.json', 'lore/name-pools/cast-prose-contacts.json'];
    if (process.env.PERSON_MAPPING_FAMILY_SOURCE === '1') paths.push('lore/name-pools/cast-family-trees.json');
    paths.push(...Object.keys(EDITORIAL_PROFILE_SOURCE_HASHES));
    const store = openEvidenceStore('/tmp/seoul-document-authority-20261020/person-mapping-final-evidence-20261020.sqlite',
      { capability: INTERNAL_EVIDENCE_CAPABILITY });
    try {
      const receipt = JSON.parse(store.getEvidence('person-detail-mapping:final:20261020',
        '5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96'));
      paths.push(...Object.keys(receipt.sourceHashes).filter(path => /^lore\/(?:characters|factions)\//u.test(path)));
      if (process.env.PERSON_MAPPING_FAMILY_SOURCE === '1') {
        assert.deepEqual([...paths].sort(), Object.keys(receipt.sourceHashes)
          .filter(path => !path.startsWith('vendor/issued-history/')).sort(), 'every current mapping source must be covered');
        sourceStore = openEvidenceStore('/tmp/seoul-document-authority-20261020/person-mapping-sources-evidence-20261020.sqlite',
          { capability: INTERNAL_EVIDENCE_CAPABILITY });
        assert.equal(verifyPersonMappingCurrentSources({ db, sourceHashes: receipt.sourceHashes, sourceStore, editorialProfiles }).length, 42);
        const changedTyped = { prepare(sql) {
          const statement = db.prepare(sql);
          if (/FROM text_document_slot WHERE/u.test(sql)) return { all: (...args) => statement.all(...args).map(row =>
            row.representation === 'string' ? { ...row, text: row.text + ' changed' } : row) };
          return statement;
        } };
        assert.throws(() => verifyPersonMappingCurrentSources({ db: changedTyped,
          sourceHashes: receipt.sourceHashes, sourceStore, editorialProfiles }), /E_REFERENCE_INTEGRITY/u);
        const substituted = { ...receipt.sourceHashes };
        delete substituted['lore/name-pools/values-cast.json'];
        substituted['lore/name-pools/unsupported.json'] = '0'.repeat(64);
        assert.throws(() => verifyPersonMappingCurrentSources({ db,
          sourceHashes: substituted, sourceStore, editorialProfiles }));
        const missing = { ...receipt.sourceHashes }; delete missing['lore/name-pools/values-cast.json'];
        assert.throws(() => verifyPersonMappingCurrentSources({ db, sourceHashes: missing, sourceStore, editorialProfiles }), /E_MAPPING_CURRENT_SOURCE_COVERAGE/u);
      }
    } finally { store.close(); }
    for (const path of paths) {
      const bytes = readFileSync(new URL('../../' + path, import.meta.url));
      const hash = createHash('sha256').update(bytes).digest('hex');
      expected.push({ path, hash, document: JSON.parse(bytes) });
    }
    const deny = () => { throw new Error('current source filesystem/JSON parsing forbidden'); };
    fs.readFileSync = fs.readFile = fsp.readFile = JSON.parse = deny;
    syncBuiltinESMExports();
    for (const { path, hash, document } of expected) {
      assert.deepEqual(readPersonMappingCurrentSource(db, path, hash, { editorialProfiles }), document, path);
      assert.throws(() => readPersonMappingCurrentSource(db, path, '0'.repeat(64), { editorialProfiles }), undefined, `${path}:wrong hash`);
    }
    assert.throws(() => readPersonMappingCurrentSource(db, 'lore/name-pools/unsupported.json', '0'.repeat(64)), /E_MAPPING_TYPED_SOURCE_UNSUPPORTED/u);
  } finally {
    [fs.readFileSync, fs.readFile, fsp.readFile, JSON.parse] = originals;
    syncBuiltinESMExports();
    editorialProfiles.close();
    sourceStore?.close();
    db.close();
  }
});
