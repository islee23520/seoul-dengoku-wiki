import { readPersonBirthdayInputs } from './person-inputs.mjs';
import { readCastFamilyTreeInputs } from './family-inputs.mjs';
import { readCastHouseholdInputs } from './household-inputs.mjs';
import { readParsedPermissionStore } from './permission-store.mjs';
import { readIssuedSheetInputs } from './issued-sheet-inputs.mjs';
import { readPersonCardInputs } from './person-card-inputs.mjs';
import { readPersonContactInputs } from './person-contact-inputs.mjs';
import { readPersonIdentityInputs } from './person-identity-inputs.mjs';
import { readAtlasIdentity, readAtlasValuesDocument } from './atlas-identity.mjs';
import { loadRelationDataset } from './relation-inputs.mjs';
import { readCensusEventInputs } from './census-event-inputs.mjs';
import { readPersonalHoldingInputs } from './personal-holding-inputs.mjs';
import { validateOpeningDispositions } from '../personal-holdings.mjs';
import { readOfficeAppointmentInputs } from './office-appointment-inputs.mjs';
import { readFeudalAllocationInputs } from './feudal-allocation-inputs.mjs';
import { readStationInteriorInputs } from './station-interior-inputs.mjs';
import { loadPreservedSheetInputs } from './preserved-sheet-inputs.mjs';
import { relative } from 'node:path';
import { authenticatePersonalTierProvenance, authenticatePersonalTierProvenanceAsync } from '../personal-tier-provenance.mjs';
import { listDocuments, readDocument } from './document-read.mjs';
import { orderDocumentKeys } from './document-key-order.mjs';
import { personFeedbackRecord } from '../feedback-source-catalog.mjs';
import { profileRosterFailures } from '../character-profile.mjs';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY } from '../document-store/soul-assignment.mjs';
import { readPersonBirthdayInputsAsync } from './person-inputs.mjs';
import { readCastFamilyTreeInputsAsync } from './family-inputs.mjs';
import { readCastHouseholdInputsAsync } from './household-inputs.mjs';
import { readParsedPermissionStoreAsync } from './permission-store.mjs';
import { readIssuedSheetInputsAsync } from './issued-sheet-inputs.mjs';
import { readPersonCardInputsAsync } from './person-card-inputs.mjs';
import { readPersonContactInputsAsync } from './person-contact-inputs.mjs';
import { readPersonIdentityInputsAsync } from './person-identity-inputs.mjs';
import { readAtlasIdentityAsync, readAtlasValuesDocumentAsync } from './atlas-identity.mjs';
import { loadRelationDatasetAsync } from './relation-inputs.mjs';
import { readCensusEventInputsAsync } from './census-event-inputs.mjs';
import { readPersonalHoldingInputsAsync } from './personal-holding-inputs.mjs';
import { readOfficeAppointmentInputsAsync } from './office-appointment-inputs.mjs';
import { readFeudalAllocationInputsAsync } from './feudal-allocation-inputs.mjs';
import { readStationInteriorInputsAsync } from './station-interior-inputs.mjs';
import { loadPreservedSheetInputsAsync } from './preserved-sheet-inputs.mjs';
import { listDocumentsAsync, readDocumentAsync } from './document-read.mjs';
import { orderDocumentKeysAsync } from './document-key-order.mjs';
import { openEditorialProfilesAsync, INTERNAL_PROFILE_CAPABILITY } from '../document-store/editorial-profile.mjs';
import { openSoulAssignmentsAsync } from '../document-store/soul-assignment.mjs';

export async function readEditorialProfileInputs(path) {
  const { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY } = await import('../document-store/editorial-profile.mjs');
  const store = openEditorialProfiles(path, { capability: INTERNAL_PROFILE_CAPABILITY });
  try {
    const profiles = store.readBatches().flatMap(row => row.batch.profiles);
    const result = new Map(profiles.map(profile => [profile.personId, profile]));
    if (result.size !== profiles.length) throw new Error('E_PROFILE_INPUT_COVERAGE');
    return result;
  } finally { store.close(); }
}

// Separate entry point preserves the authenticated legacy producer bytes until
// the entire production bundle has a reviewed DB-native replacement.
export async function loadMigratedPersonInputs({ db, repoRoot }) {
  const result = {};
  for (const inputSubset of ['core', 'cards', 'contacts', 'identity', 'atlas', 'court', 'holdings',
    'offices', 'allocation', 'interiors', 'preserved-sheets', 'permissions', 'issued-sheets']) {
    Object.assign(result, await loadPersonDetailSources({
      db, repoRoot, inputSubset,
      preserveFamilySourceOrder: true
    }));
  }
  result.issuedSheets = result.issuedSheets.people;
  return result;
}

// Reads current lore documents from the canonical database for the tier baseline.
export function databaseLoreReader(db, repoRoot) {
  const identities = listDocuments(db, { corpusKind: 'current', visibility: 'internal' });
  return async path => {
    const logicalPath = relative(repoRoot, path);
    const matches = identities.filter(identity => identity.logical_path === logicalPath);
    if (matches.length !== 1) throw new Error(`E_PERSON_TIER_SOURCE_MISSING:${logicalPath}`);
    const [identity] = matches;
    const document = readDocument(db, {
      documentId: identity.document_id, domain: identity.domain,
      corpusKind: identity.corpus_kind, visibility: 'internal'
    });
    return Buffer.from(JSON.stringify(orderDocumentKeys(db, identity.source_id, document)));
  };
}

export async function loadDatabasePersonProductionInputs({ db, repoRoot, editorialProfileDb,
  soulAssignmentDb }) {
  if (!editorialProfileDb || !soulAssignmentDb) throw new Error('E_PERSON_PRIVATE_DATABASE_REQUIRED');
  const inputs = await loadMigratedPersonInputs({ db, repoRoot });
  const characterProfiles = await readEditorialProfileInputs(editorialProfileDb);
  const souls = openSoulAssignments(soulAssignmentDb, { capability: INTERNAL_SOUL_CAPABILITY, view: 'approved' });
  try {
    const failures = profileRosterFailures([...characterProfiles.values()], inputs.atlasPeople.registry, souls.readDocument());
    if (failures.length) throw new Error(failures.join('\n'));
  } finally { souls.close(); }
  const personalTierPreservation = await authenticatePersonalTierProvenance(repoRoot, databaseLoreReader(db, repoRoot));
  return { ...inputs, characterProfiles, personalTierPreservation, personFeedbackRecord };
}

export async function loadPersonDetailSources({ db, inputSubset, repoRoot, relationInputs, preserveFamilySourceOrder = false } = {}) {
  if (!db || !['registry-birthdays', 'family', 'household', 'core', 'permissions', 'issued-sheets', 'cards', 'contacts', 'identity', 'atlas', 'court', 'holdings', 'offices', 'allocation', 'interiors', 'preserved-sheets'].includes(inputSubset)) {
    throw Object.assign(new Error('E_PERSON_INPUT_UNSUPPORTED: subset requires db'), { code: 'E_PERSON_INPUT_UNSUPPORTED' });
  }
  if (inputSubset === 'preserved-sheets') return { preservedSheets: loadPreservedSheetInputs(db) };
  if (inputSubset === 'interiors') return { stationInteriors: readStationInteriorInputs(db) };
  if (inputSubset === 'allocation') return { openingAllocation: readFeudalAllocationInputs(db, { predecessor: true }) };
  if (inputSubset === 'offices') return { officeAppointmentSource: readOfficeAppointmentInputs(db) };
  if (inputSubset === 'holdings') {
    const originalHoldings = readPersonalHoldingInputs(db);
    return {
      originalHoldings,
      openingDispositions: validateOpeningDispositions(originalHoldings,
        db.prepare('SELECT person_id AS id FROM person').all())
    };
  }
  if (inputSubset === 'court') {
    let inputs = relationInputs;
    if (inputs === undefined) {
      const { pagesBySlug } = readPersonCardInputs(db, { repoRoot });
      inputs = {
        registry: readAtlasIdentity(db).registry, values: readAtlasValuesDocument(db),
        archivedEvents: readCensusEventInputs(db)
      };
      for (const [key, slug] of Object.entries({
        stateSource: 'Sixteen-States', relationSource: 'Cast-Relations',
        castIndex: 'Cast-Index', chronicle: 'Century-Annals'
      })) {
        const page = pagesBySlug.get(slug);
        if (!page) throw new Error(`E_RELATION_DATASET_INPUT: ${key}`);
        inputs[key] = page.value;
      }
    }
    const courtDataset = loadRelationDataset({ db, inputs });
    return {
      courtDataset,
      issuedById: new Map(courtDataset.people.map(person => [person.id, person])),
      issuedIdByName: new Map(courtDataset.people.map(person => [person.name, person.id]))
    };
  }
  if (inputSubset === 'atlas') {
    const atlasPeople = readAtlasIdentity(db);
    return { atlasPeople, peopleSource: atlasPeople.people };
  }
  if (inputSubset === 'cards') return readPersonCardInputs(db, { repoRoot });
  if (inputSubset === 'contacts') return readPersonContactInputs(db);
  if (inputSubset === 'identity') return readPersonIdentityInputs(db);
  if (inputSubset === 'issued-sheets') return { issuedSheets: readIssuedSheetInputs(db) };
  if (inputSubset === 'family') return { familyGraph: readCastFamilyTreeInputs(db) };
  if (inputSubset === 'household') return { householdLedger: readCastHouseholdInputs(db) };
  if (inputSubset === 'permissions') return { personRightsPermissions: readParsedPermissionStore(db) };
  if (inputSubset === 'core') {
    const birthdays = readPersonBirthdayInputs(db);
    const familyGraph = readCastFamilyTreeInputs(db, { preserveSourceOrder: preserveFamilySourceOrder });
    const householdLedger = readCastHouseholdInputs(db);
    return {
      ...birthdays, familyGraph,
      householdsById: new Map(householdLedger.people.map(person => [person.personId, {
        personFaith: person.household.personFaith.status,
        houseFaith: person.household.houseFaith.status,
        humanoidAdmission: person.household.humanoidAdmission,
      }]))
    };
  }
  return readPersonBirthdayInputs(db);
}

// Both transactions are caller-owned; only privateTx may read wiki_private.
export async function loadDatabasePersonProductionInputsAsync({ tx, privateTx, repoRoot }) {
  if (!privateTx || privateTx === tx) throw new Error('E_PERSON_PRIVATE_DATABASE_REQUIRED');
  const inputs = await loadMigratedPersonInputsAsync({ tx, repoRoot });
  const profiles = await openEditorialProfilesAsync(privateTx, { capability: INTERNAL_PROFILE_CAPABILITY });
  const rows = (await profiles.readBatches()).flatMap(row => row.batch.profiles);
  const characterProfiles = new Map(rows.map(profile => [profile.personId, profile]));
  if (characterProfiles.size !== rows.length) throw new Error('E_PROFILE_INPUT_COVERAGE');
  const souls = await openSoulAssignmentsAsync(privateTx, { capability: INTERNAL_SOUL_CAPABILITY, view: 'approved' });
  const failures = profileRosterFailures([...characterProfiles.values()], inputs.atlasPeople.registry, await souls.readDocument());
  if (failures.length) throw new Error(failures.join('\n'));
  const personalTierPreservation = await authenticatePersonalTierProvenanceAsync(privateTx, repoRoot, await databaseLoreReaderAsync(tx, repoRoot));
  return { ...inputs, characterProfiles, personalTierPreservation, personFeedbackRecord };
}

export async function databaseLoreReaderAsync(tx, repoRoot) {
  const identities = await listDocumentsAsync(tx, { corpusKind: 'current', visibility: 'internal' });
  return async path => {
    const logicalPath = relative(repoRoot, path);
    const matches = identities.filter(identity => identity.logical_path === logicalPath);
    if (matches.length !== 1) throw new Error(`E_PERSON_TIER_SOURCE_MISSING:${logicalPath}`);
    const [identity] = matches;
    const document = await readDocumentAsync(tx, {
      documentId: identity.document_id, domain: identity.domain,
      corpusKind: identity.corpus_kind, visibility: 'internal'
    });
    return Buffer.from(JSON.stringify(await orderDocumentKeysAsync(tx, identity.source_id, document)));
  };
}

export async function loadMigratedPersonInputsAsync({ tx, repoRoot }) {
  const result = {};
  for (const inputSubset of ['core', 'cards', 'contacts', 'identity', 'atlas', 'court', 'holdings',
    'offices', 'allocation', 'interiors', 'preserved-sheets', 'permissions', 'issued-sheets']) {
    Object.assign(result, await loadPersonDetailSourcesAsync({
      tx, repoRoot, inputSubset,
      preserveFamilySourceOrder: true
    }));
  }
  result.issuedSheets = result.issuedSheets.people;
  return result;
}

export async function loadPersonDetailSourcesAsync({ tx, inputSubset, repoRoot, relationInputs, preserveFamilySourceOrder = false } = {}) {
  if (!tx || !['registry-birthdays', 'family', 'household', 'core', 'permissions', 'issued-sheets', 'cards', 'contacts', 'identity', 'atlas', 'court', 'holdings', 'offices', 'allocation', 'interiors', 'preserved-sheets'].includes(inputSubset)) {
    throw Object.assign(new Error('E_PERSON_INPUT_UNSUPPORTED: subset requires db'), { code: 'E_PERSON_INPUT_UNSUPPORTED' });
  }
  if (inputSubset === 'preserved-sheets') return { preservedSheets: await loadPreservedSheetInputsAsync(tx) };
  if (inputSubset === 'interiors') return { stationInteriors: await readStationInteriorInputsAsync(tx) };
  if (inputSubset === 'allocation') return { openingAllocation: await readFeudalAllocationInputsAsync(tx, { predecessor: true }) };
  if (inputSubset === 'offices') return { officeAppointmentSource: await readOfficeAppointmentInputsAsync(tx) };
  if (inputSubset === 'holdings') {
    const originalHoldings = await readPersonalHoldingInputsAsync(tx);
    return {
      originalHoldings,
      openingDispositions: validateOpeningDispositions(originalHoldings,
        await tx.all('SELECT person_id AS id FROM wiki.person'))
    };
  }
  if (inputSubset === 'court') {
    let inputs = relationInputs;
    if (inputs === undefined) {
      const { pagesBySlug } = await readPersonCardInputsAsync(tx, { repoRoot });
      inputs = {
        registry: (await readAtlasIdentityAsync(tx)).registry, values: await readAtlasValuesDocumentAsync(tx),
        archivedEvents: await readCensusEventInputsAsync(tx)
      };
      for (const [key, slug] of Object.entries({
        stateSource: 'Sixteen-States', relationSource: 'Cast-Relations',
        castIndex: 'Cast-Index', chronicle: 'Century-Annals'
      })) {
        const page = pagesBySlug.get(slug);
        if (!page) throw new Error(`E_RELATION_DATASET_INPUT: ${key}`);
        inputs[key] = page.value;
      }
    }
    const courtDataset = await loadRelationDatasetAsync({ tx, inputs });
    return {
      courtDataset,
      issuedById: new Map(courtDataset.people.map(person => [person.id, person])),
      issuedIdByName: new Map(courtDataset.people.map(person => [person.name, person.id]))
    };
  }
  if (inputSubset === 'atlas') {
    const atlasPeople = await readAtlasIdentityAsync(tx);
    return { atlasPeople, peopleSource: atlasPeople.people };
  }
  if (inputSubset === 'cards') return readPersonCardInputsAsync(tx, { repoRoot });
  if (inputSubset === 'contacts') return readPersonContactInputsAsync(tx);
  if (inputSubset === 'identity') return readPersonIdentityInputsAsync(tx);
  if (inputSubset === 'issued-sheets') return { issuedSheets: await readIssuedSheetInputsAsync(tx) };
  if (inputSubset === 'family') return { familyGraph: await readCastFamilyTreeInputsAsync(tx) };
  if (inputSubset === 'household') return { householdLedger: await readCastHouseholdInputsAsync(tx) };
  if (inputSubset === 'permissions') return { personRightsPermissions: await readParsedPermissionStoreAsync(tx) };
  if (inputSubset === 'core') {
    const birthdays = await readPersonBirthdayInputsAsync(tx);
    const familyGraph = await readCastFamilyTreeInputsAsync(tx, { preserveSourceOrder: preserveFamilySourceOrder });
    const householdLedger = await readCastHouseholdInputsAsync(tx);
    return {
      ...birthdays, familyGraph,
      householdsById: new Map(householdLedger.people.map(person => [person.personId, {
        personFaith: person.household.personFaith.status,
        houseFaith: person.household.houseFaith.status,
        humanoidAdmission: person.household.humanoidAdmission,
      }]))
    };
  }
  return readPersonBirthdayInputsAsync(tx);
}
