import { readEvidenceDocumentReference } from '../cast-sqlite/evidence-document-reference.mjs';
import { orderDocumentKeys } from '../cast-sqlite/document-key-order.mjs';
import { readAtlasValuesDocument } from '../cast-sqlite/atlas-identity.mjs';
import { readOfficeAppointmentInputs } from '../cast-sqlite/office-appointment-inputs.mjs';
import { readPersonalHoldingInputs } from '../cast-sqlite/personal-holding-inputs.mjs';
import { readRelationConfig } from '../cast-sqlite/relation-inputs.mjs';
import { readPermissionStore } from '../cast-sqlite/permission-store.mjs';
import { readCastHouseholdInputs } from '../cast-sqlite/household-inputs.mjs';
import { readIssuedSheetDocument } from '../cast-sqlite/issued-sheet-document.mjs';
import { readPersonIdentityDocuments } from '../cast-sqlite/person-identity-documents.mjs';
import { EDITORIAL_PROFILE_PATHS } from './editorial-profile.mjs';
import { readPersonContextDocuments } from '../cast-sqlite/person-context-documents.mjs';
import { readFamilySourceDocument } from '../cast-sqlite/family-source-document.mjs';

// Deliberately closed families. Unsupported sources must gain a complete typed
// reader; the authenticated snapshot is never a current-source fallback.
export function readPersonMappingCurrentSource(db, path, { editorialProfiles } = {}) {
  if (EDITORIAL_PROFILE_PATHS.includes(path)) {
    if (!editorialProfiles) throw new Error('E_MAPPING_PRIVATE_PROFILE_REQUIRED');
    const batches = editorialProfiles.readBatches().filter(row => row.logicalPath === path);
    if (batches.length !== 1) throw new Error('E_MAPPING_PRIVATE_PROFILE_COVERAGE');
    return batches[0].batch;
  }
  if (/^lore\/(?:characters|factions)\/[^/]+\.json$/u.test(path)
    && !path.split('/').at(-1).startsWith('authoring.')) {
    const reference = readEvidenceDocumentReference(db, { logicalPath: path });
    return orderDocumentKeys(db, reference.sourceId, reference.document);
  }
  switch (path) {
    case 'lore/name-pools/cast-family-trees.json': return readFamilySourceDocument(db);
    case 'lore/name-pools/cast-birthdays.json':
    case 'lore/name-pools/cast-prose-contacts.json': {
      const domain = path.endsWith('/cast-birthdays.json') ? 'birthdays' : 'contacts';
      return readPersonContextDocuments(db)[domain];
    }
    case 'lore/name-pools/cast-hangnyeol.json':
    case 'lore/name-pools/gender-cast.json': {
      const domain = path.endsWith('/cast-hangnyeol.json') ? 'lineage' : 'gender';
      return readPersonIdentityDocuments(db)[domain];
    }
    case 'lore/name-pools/gurps-cast.json': return readIssuedSheetDocument(db);
    case 'lore/name-pools/cast-household-relations.json': return readCastHouseholdInputs(db);
    case 'lore/name-pools/values-cast.json': return readAtlasValuesDocument(db);
    case 'lore/relations/opening-office-appointments.json': return readOfficeAppointmentInputs(db);
    case 'lore/relations/personal-holdings.json': return readPersonalHoldingInputs(db);
    case 'lore/relations/relations.json': return readRelationConfig(db);
    case 'person-rights-permissions.json': return readPermissionStore(db);
    default: throw new Error(`E_MAPPING_TYPED_SOURCE_UNSUPPORTED:${path}`);
  }
}
