import { readEvidenceDocumentReference } from '../cast-sqlite/evidence-document-reference.mjs';
import { orderDocumentKeys } from '../cast-sqlite/document-key-order.mjs';
import { readAtlasValuesDocument } from '../cast-sqlite/atlas-identity.mjs';
import { readOfficeAppointmentInputs } from '../cast-sqlite/office-appointment-inputs.mjs';
import { readPersonalHoldingInputs } from '../cast-sqlite/personal-holding-inputs.mjs';
import { readRelationConfig } from '../cast-sqlite/relation-inputs.mjs';
import { readPermissionStore } from '../cast-sqlite/permission-store.mjs';
import { readCastHouseholdInputs } from '../cast-sqlite/household-inputs.mjs';
import { readIssuedSheetDocument } from '../cast-sqlite/issued-sheet-document.mjs';
import { readPersonIdentityDocuments, PERSON_IDENTITY_SOURCE_HASHES } from '../cast-sqlite/person-identity-documents.mjs';
import { EDITORIAL_PROFILE_SOURCE_HASHES } from './editorial-profile.mjs';
import { readPersonContextDocuments, PERSON_CONTEXT_SOURCE_HASHES } from '../cast-sqlite/person-context-documents.mjs';
import { readFamilySourceDocument } from '../cast-sqlite/family-source-document.mjs';
import { isDeepStrictEqual } from 'node:util';

export function verifyPersonMappingCurrentSources({ db, sourceHashes, sourceStore, editorialProfiles }) {
  const current = Object.entries(sourceHashes).filter(([path]) => !path.startsWith('vendor/issued-history/'));
  if (current.length !== 42) throw new Error('E_MAPPING_CURRENT_SOURCE_COVERAGE');
  for (const [path, sha256] of current) {
    const snapshot = JSON.parse(sourceStore.getEvidence(`mapping-source:${path}`, sha256));
    const value = readPersonMappingCurrentSource(db, path, sha256, { editorialProfiles });
    if (!isDeepStrictEqual(value, snapshot)) throw new Error(`E_MAPPING_TYPED_SOURCE_MISMATCH:${path}`);
  }
  return current.map(([path]) => path);
}

// Deliberately closed families. Unsupported sources must gain a complete typed
// reader; the authenticated snapshot is never a current-source fallback.
export function readPersonMappingCurrentSource(db, path, sha256, { editorialProfiles } = {}) {
  if (Object.hasOwn(EDITORIAL_PROFILE_SOURCE_HASHES, path)) {
    if (EDITORIAL_PROFILE_SOURCE_HASHES[path] !== sha256) throw new Error('E_MAPPING_TYPED_SOURCE_HASH');
    if (!editorialProfiles) throw new Error('E_MAPPING_PRIVATE_PROFILE_REQUIRED');
    const batches = editorialProfiles.readBatches().filter(row => row.logicalPath === path);
    if (batches.length !== 1) throw new Error('E_MAPPING_PRIVATE_PROFILE_COVERAGE');
    return batches[0].batch;
  }
  if (/^lore\/(?:characters|factions)\/[^/]+\.json$/u.test(path)
    && !path.split('/').at(-1).startsWith('authoring.')) {
    const reference = readEvidenceDocumentReference(db, { logicalPath: path, expectedSha256: sha256 });
    return orderDocumentKeys(db, reference.sourceId, reference.document);
  }
  switch (path) {
    case 'lore/name-pools/cast-family-trees.json': return readFamilySourceDocument(db, { expectedSourceHash: sha256 });
    case 'lore/name-pools/cast-birthdays.json':
    case 'lore/name-pools/cast-prose-contacts.json': {
      const domain = path.endsWith('/cast-birthdays.json') ? 'birthdays' : 'contacts';
      return readPersonContextDocuments(db, { expectedSourceHashes: { ...PERSON_CONTEXT_SOURCE_HASHES,
        [domain]: sha256 } })[domain];
    }
    case 'lore/name-pools/cast-hangnyeol.json':
    case 'lore/name-pools/gender-cast.json': {
      const domain = path.endsWith('/cast-hangnyeol.json') ? 'lineage' : 'gender';
      return readPersonIdentityDocuments(db, { expectedSourceHashes: { ...PERSON_IDENTITY_SOURCE_HASHES,
        [domain]: sha256 } })[domain];
    }
    case 'lore/name-pools/gurps-cast.json': return readIssuedSheetDocument(db, { expectedSourceHash: sha256 });
    case 'lore/name-pools/cast-household-relations.json': return readCastHouseholdInputs(db,
      { expectedSourceHashes: { [path]: sha256 } });
    case 'lore/name-pools/values-cast.json': {
      const binding = db.prepare("SELECT sha256 FROM atlas_identity_binding WHERE kind='values'").get();
      if (binding?.sha256 !== sha256) throw new Error('E_MAPPING_TYPED_SOURCE_HASH');
      return readAtlasValuesDocument(db);
    }
    case 'lore/relations/opening-office-appointments.json': return readOfficeAppointmentInputs(db, { expectedSourceHash: sha256 });
    case 'lore/relations/personal-holdings.json': return readPersonalHoldingInputs(db, { expectedSourceHash: sha256 });
    case 'lore/relations/relations.json': return readRelationConfig(db, { expectedSha256: sha256 });
    case 'person-rights-permissions.json': {
      const binding = db.prepare('SELECT sha256 FROM permission_archive WHERE singleton=1').get();
      if (binding?.sha256 !== sha256) throw new Error('E_MAPPING_TYPED_SOURCE_HASH');
      return readPermissionStore(db);
    }
    default: throw new Error(`E_MAPPING_TYPED_SOURCE_UNSUPPORTED:${path}`);
  }
}
