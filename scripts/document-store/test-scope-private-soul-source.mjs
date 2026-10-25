import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { readScopeCurrentSource } from './scope-current-source.mjs';
import { openSoulCandidateDocuments, INTERNAL_CANDIDATES_CAPABILITY, SOUL_CANDIDATE_SOURCE_HASHES } from './soul-candidate-documents.mjs';
import { openSoulReviewDocuments, INTERNAL_REVIEW_CAPABILITY, SOUL_REVIEW_SOURCE_HASHES } from './soul-review-documents.mjs';
import { openSoulBatchDocuments, INTERNAL_BATCHES_CAPABILITY, SOUL_BATCH_SOURCE_HASHES } from './soul-batch-documents.mjs';

test('scope reconstructs eleven private soul sources only from explicit private handles', {
  skip: !process.env.SCOPE_PRIVATE_SOUL_ROOT,
}, () => {
  const handles = {};
  const savedRead = fs.readFileSync, savedParse = JSON.parse;
  try {
    const expected = new Map();
    const families = [
      ['soulCandidates','candidates',openSoulCandidateDocuments,INTERNAL_CANDIDATES_CAPABILITY,SOUL_CANDIDATE_SOURCE_HASHES],
      ['soulReview','review',openSoulReviewDocuments,INTERNAL_REVIEW_CAPABILITY,SOUL_REVIEW_SOURCE_HASHES],
      ['soulBatches','batches',openSoulBatchDocuments,INTERNAL_BATCHES_CAPABILITY,SOUL_BATCH_SOURCE_HASHES],
    ];
    for (const [key,name,open,capability,pins] of families) {
      handles[key] = open(`${process.env.SCOPE_PRIVATE_SOUL_ROOT}/${name}.sqlite`, {
        capability,scope:'internal',expectedSourceHashes:pins });
      for (const path of Object.keys(pins)) expected.set(path, JSON.parse(fs.readFileSync(new URL('../../'+path,import.meta.url))));
    }
    const deny = () => { throw Error('source access forbidden'); };
    fs.readFileSync = JSON.parse = deny;
    syncBuiltinESMExports();
    let compared = 0;
    for (const [,,, ,pins] of families) for (const [logicalPath,expectedSha256] of Object.entries(pins)) {
      assert.equal(JSON.stringify(readScopeCurrentSource({logicalPath,expectedSha256,...handles})),JSON.stringify(expected.get(logicalPath)));
      assert.throws(()=>readScopeCurrentSource({logicalPath,expectedSha256}),/E_SCOPE_PRIVATE_SOUL_SOURCE_REQUIRED/u);
      assert.throws(()=>readScopeCurrentSource({logicalPath,expectedSha256:'0'.repeat(64),...handles}),/E_SCOPE_DB_SOURCE_HASH/u);
      compared++;
    }
    assert.equal(compared,11);
  } finally {
    fs.readFileSync=savedRead; JSON.parse=savedParse; syncBuiltinESMExports();
    Object.values(handles).forEach(store=>store.close());
  }
});
