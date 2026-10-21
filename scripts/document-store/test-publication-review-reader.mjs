import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { evidenceReader } from './evidence-reader.mjs';
import { openEvidenceStore, INTERNAL_EVIDENCE_CAPABILITY } from './evidence.mjs';
import {
  refreshStationCatalogPublicationReview,
  refreshClimateLinkPublicationReview,
  refreshTimelineWharfPublicationReview,
  refreshReviewWordingPublicationReview,
  refreshK176PublicationReview,
} from '../seoul-census.mjs';

for (const refresh of [refreshStationCatalogPublicationReview, refreshClimateLinkPublicationReview,
  refreshTimelineWharfPublicationReview, refreshReviewWordingPublicationReview, refreshK176PublicationReview]) {
  test(`${refresh.name} authenticates through the supplied reader before accepting review authority`, async () => {
    const failure = new Error('bounded evidence reader rejected the requested source');
    const paths = [];
    const reader = async path => { paths.push(path); throw failure; };
    await assert.rejects(() => refresh({}, '/sealed-publication-review-reader', reader), error => error === failure);
    assert.equal(paths.length, 1);
    assert.ok(paths[0].startsWith('/sealed-publication-review-reader/'));
  });

  test(`${refresh.name} still rejects an unbranded review after real source authentication`, async () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const sealedRoot = '/sealed-publication-review-reader';
    const paths = [];
    const reader = async path => {
      const logicalPath = relative(sealedRoot, resolve(path));
      assert.ok(logicalPath && !logicalPath.startsWith('../'));
      paths.push(logicalPath);
      return readFile(resolve(root,logicalPath));
    };
    await assert.rejects(() => refresh({documents:[]}, sealedRoot, reader),
      error => error.code === 'E_PUBLICATION_REVIEW_AUTHORITY');
    assert.ok(paths.length >= 2);
  });

  test(`${refresh.name} authenticates sealed SQLite evidence without filesystem fallback`, async () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const sealedRoot = '/sealed-publication-review-reader';
    const captured = new Map();
    const capture = async path => {
      const logicalPath = relative(sealedRoot, resolve(path));
      assert.ok(logicalPath && !logicalPath.startsWith('../'));
      const bytes = await readFile(resolve(root, logicalPath));
      captured.set(logicalPath, bytes);
      return bytes;
    };
    await assert.rejects(() => refresh({}, sealedRoot, capture), { code:'E_PUBLICATION_REVIEW_AUTHORITY' });
    const directory = fs.mkdtempSync(resolve(tmpdir(), 'publication-reader-evidence-'));
    const path = resolve(directory, 'evidence.sqlite');
    const bindings = new Map();
    const saved = [fs.readFileSync, fs.readFile, fsp.readFile];
    let store;
    try {
      store = openEvidenceStore(path, { capability:INTERNAL_EVIDENCE_CAPABILITY, create:true, readOnly:false });
      const entries = [...captured].map(([logicalPath, bytes]) => {
        const identity = `successor:${logicalPath}`;
        const sha256 = createHash('sha256').update(bytes).digest('hex');
        bindings.set(logicalPath, { identity, sha256 });
        return { identity, logicalPath, bytes, sha256, revision:'test-capture', kind:'archive', references:[] };
      });
      store.importBatch(entries);
      store.close();
      store = openEvidenceStore(path, { capability:INTERNAL_EVIDENCE_CAPABILITY });
      const reader = evidenceReader(store, { root:sealedRoot, bindings });
      const deny = () => { throw Error('filesystem fallback forbidden'); };
      fs.readFileSync = fs.readFile = fsp.readFile = deny;
      syncBuiltinESMExports();
      await assert.rejects(() => refresh({}, sealedRoot, reader), { code:'E_PUBLICATION_REVIEW_AUTHORITY' });
      const missing = evidenceReader(store, { root:sealedRoot, bindings:new Map() });
      await assert.rejects(() => refresh({}, sealedRoot, missing), /E_EVIDENCE_READER_MISSING/u);
    } finally {
      [fs.readFileSync, fs.readFile, fsp.readFile] = saved;
      syncBuiltinESMExports();
      store?.close();
      fs.rmSync(directory, { recursive:true, force:true });
    }
  });
}
