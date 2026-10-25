import assert from 'node:assert/strict';
import test from 'node:test';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { loadCharacterProfiles } from '../validate-character-profiles.mjs';
import { readPrivateSourceArchive } from '../document-store/private-source-archive.mjs';
import { EDITORIAL_PROFILE_SOURCE_HASHES } from '../document-store/editorial-profile.mjs';

test('complete existing profile loader requires no JSON source or directory reads in DB mode', {
  skip: !process.env.WIKI_DOCUMENT_DB || !process.env.WIKI_EDITORIAL_PROFILE_DB || !process.env.WIKI_SOUL_ASSIGNMENT_DB,
}, async () => {
  const root = new URL('../..', import.meta.url).pathname;
  const expected = new Map(Object.entries(EDITORIAL_PROFILE_SOURCE_HASHES).flatMap(([path, hash]) =>
    JSON.parse(readPrivateSourceArchive(root, path, hash)).profiles.map(profile => [profile.personId, profile])));
  const read = fsp.readFile, list = fsp.readdir;
  try {
    fsp.readFile = async (path, ...options) => {
      assert.doesNotMatch(String(path), /\.json$/u, 'no authored JSON source may be read');
      return read(path, ...options);
    };
    fsp.readdir = () => { throw new Error('source discovery forbidden in DB mode'); };
    syncBuiltinESMExports();
    const profiles = await loadCharacterProfiles(new URL('../..', import.meta.url).pathname, {
      documentDb: process.env.WIKI_DOCUMENT_DB,
      editorialProfileDb: process.env.WIKI_EDITORIAL_PROFILE_DB,
      soulAssignmentDb: process.env.WIKI_SOUL_ASSIGNMENT_DB,
    });
    assert.equal(profiles.size, 1022);
    assert.deepEqual(profiles, expected);
    assert.equal(JSON.stringify([...profiles]), JSON.stringify([...expected]));
    assert.equal(profiles.get('K001').name, '한재목');
    await assert.rejects(loadCharacterProfiles(root, {
      documentDb: `${process.env.WIKI_DOCUMENT_DB}.missing`,
      editorialProfileDb: process.env.WIKI_EDITORIAL_PROFILE_DB,
      soulAssignmentDb: process.env.WIKI_SOUL_ASSIGNMENT_DB,
    }), { code: 'E_DB_OPEN' });
    await assert.rejects(loadCharacterProfiles(new URL('../..', import.meta.url).pathname, {
      documentDb: process.env.WIKI_DOCUMENT_DB,
      editorialProfileDb: `${process.env.WIKI_EDITORIAL_PROFILE_DB}.missing`,
      soulAssignmentDb: process.env.WIKI_SOUL_ASSIGNMENT_DB,
    }), { code: 'ENOENT' });
    await assert.rejects(loadCharacterProfiles(new URL('../..', import.meta.url).pathname, {
      documentDb: process.env.WIKI_DOCUMENT_DB,
      editorialProfileDb: process.env.WIKI_EDITORIAL_PROFILE_DB,
      soulAssignmentDb: `${process.env.WIKI_SOUL_ASSIGNMENT_DB}.missing`,
    }), { code: 'ENOENT' });
  } finally {
    fsp.readFile = read;
    fsp.readdir = list;
    syncBuiltinESMExports();
  }
});
