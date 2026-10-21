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
import { replayDatabasePersonalTiers } from '../document-store/person-tier-replay.mjs';
import { personFeedbackRecord } from '../feedback-source-catalog.mjs';
import { profileRosterFailures } from '../character-profile.mjs';
import { openSoulAssignments, INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256 } from '../document-store/soul-assignment.mjs';

export async function readEditorialProfileInputs(path) {
  const { openEditorialProfiles, INTERNAL_PROFILE_CAPABILITY, EDITORIAL_PROFILE_SOURCE_HASHES } = await import('../document-store/editorial-profile.mjs');
  const store = openEditorialProfiles(path, { capability: INTERNAL_PROFILE_CAPABILITY,
    expectedSourceHashes: EDITORIAL_PROFILE_SOURCE_HASHES });
  try {
    const profiles = store.readBatches().flatMap(row => row.batch.profiles);
    const result = new Map(profiles.map(profile => [profile.personId, profile]));
    if (profiles.length !== 1022 || result.size !== 1022) throw new Error('E_PROFILE_INPUT_COVERAGE');
    return result;
  } finally { store.close(); }
}

// Separate entry point preserves the authenticated legacy producer bytes until
// the entire production bundle has a reviewed DB-native replacement.
export async function loadMigratedPersonInputs({ db, repoRoot }) {
  const result = {};
  for (const inputSubset of ['core', 'cards', 'contacts', 'identity', 'atlas', 'court', 'holdings',
    'offices', 'allocation', 'interiors', 'preserved-sheets', 'permissions', 'issued-sheets']) {
    Object.assign(result, await loadPersonDetailSources({ db, repoRoot, inputSubset,
      preserveFamilySourceOrder: true }));
  }
  result.issuedSheets = result.issuedSheets.people;
  return result;
}

export async function loadDatabasePersonProductionInputs({ db, repoRoot, editorialProfileDb,
  soulAssignmentDb, evidenceStore, historyStore }) {
  if (!editorialProfileDb || !soulAssignmentDb) throw new Error('E_PERSON_PRIVATE_DATABASE_REQUIRED');
  const inputs = await loadMigratedPersonInputs({ db, repoRoot });
  const characterProfiles = await readEditorialProfileInputs(editorialProfileDb);
  const souls = openSoulAssignments(soulAssignmentDb, { capability: INTERNAL_SOUL_CAPABILITY,
    expectedSha256: SOUL_ASSIGNMENT_SOURCE_SHA256 });
  try {
    const failures = profileRosterFailures([...characterProfiles.values()], inputs.atlasPeople.registry, souls.readDocument());
    if (failures.length) throw new Error(failures.join('\n'));
  } finally { souls.close(); }
  const personalTierPreservation = await replayDatabasePersonalTiers({ db, evidenceStore, historyStore });
  return { ...inputs, characterProfiles, personalTierPreservation, personFeedbackRecord };
}

export async function loadPersonDetailSources({ db, inputSubset, expectedSourceHashes, repoRoot, relationInputs, preserveFamilySourceOrder = false } = {}) {
  if (!db || !['registry-birthdays', 'family', 'household', 'core', 'permissions', 'issued-sheets', 'cards', 'contacts', 'identity', 'atlas', 'court', 'holdings', 'offices', 'allocation', 'interiors', 'preserved-sheets'].includes(inputSubset)) {
    throw Object.assign(new Error('E_PERSON_INPUT_UNSUPPORTED: subset requires db'), { code: 'E_PERSON_INPUT_UNSUPPORTED' });
  }
  if (inputSubset === 'preserved-sheets') return { preservedSheets: loadPreservedSheetInputs(db) };
  if (inputSubset === 'interiors') return { stationInteriors: readStationInteriorInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHash: expectedSourceHashes['lore/regions/station-interiors.json'] }) };
  if (inputSubset === 'allocation') return { openingAllocation: readFeudalAllocationInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHash: expectedSourceHashes['lore/relations/opening-feudal-allocation.json'] }) };
  if (inputSubset === 'offices') return { officeAppointmentSource: readOfficeAppointmentInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHash: expectedSourceHashes['lore/relations/opening-office-appointments.json'] }) };
  if (inputSubset === 'holdings') {
    const originalHoldings = readPersonalHoldingInputs(db,
      expectedSourceHashes === undefined ? {} : { expectedSourceHash: expectedSourceHashes['lore/relations/personal-holdings.json'] });
    return { originalHoldings,
      openingDispositions: validateOpeningDispositions(originalHoldings,
        db.prepare('SELECT person_id AS id FROM person').all()) };
  }
  if (inputSubset === 'court') {
    let inputs = relationInputs;
    if (inputs === undefined) {
      const { pagesBySlug } = readPersonCardInputs(db, { repoRoot });
      inputs = { registry: readAtlasIdentity(db).registry, values: readAtlasValuesDocument(db),
        archivedEvents: readCensusEventInputs(db) };
      for (const [key, slug] of Object.entries({ stateSource: 'Sixteen-States', relationSource: 'Cast-Relations',
        castIndex: 'Cast-Index', chronicle: 'Century-Annals' })) {
        const page = pagesBySlug.get(slug);
        if (!page) throw new Error(`E_RELATION_DATASET_INPUT: ${key}`);
        inputs[key] = page.value;
      }
    }
    const courtDataset = loadRelationDataset({ db, inputs,
      expectedSha256: expectedSourceHashes?.['lore/relations/relations.json'] });
    return { courtDataset,
      issuedById: new Map(courtDataset.people.map(person => [person.id, person])),
      issuedIdByName: new Map(courtDataset.people.map(person => [person.name, person.id])) };
  }
  if (inputSubset === 'atlas') {
    const atlasPeople = readAtlasIdentity(db,
      expectedSourceHashes === undefined ? {} : { expectedSourceHashes });
    return { atlasPeople, peopleSource: atlasPeople.people };
  }
  if (inputSubset === 'cards') return readPersonCardInputs(db, { repoRoot });
  if (inputSubset === 'contacts') return readPersonContactInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHashes });
  if (inputSubset === 'identity') return readPersonIdentityInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHashes });
  if (inputSubset === 'issued-sheets') return { issuedSheets: readIssuedSheetInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHash: expectedSourceHashes['lore/name-pools/gurps-cast.json'] }) };
  if (inputSubset === 'family') return { familyGraph: readCastFamilyTreeInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHashes }) };
  if (inputSubset === 'household') return { householdLedger: readCastHouseholdInputs(db,
    expectedSourceHashes === undefined ? {} : { expectedSourceHashes }) };
  if (inputSubset === 'permissions') return { personRightsPermissions: readParsedPermissionStore(db) };
  if (inputSubset === 'core') {
    const selection = expectedSourceHashes === undefined ? {} : { expectedSourceHashes };
    const birthdays = readPersonBirthdayInputs(db, selection);
    const familyGraph = readCastFamilyTreeInputs(db, { ...selection, preserveSourceOrder: preserveFamilySourceOrder });
    const householdLedger = readCastHouseholdInputs(db, selection);
    return { ...birthdays, familyGraph,
      householdsById: new Map(householdLedger.people.map(person => [person.personId, {
        personFaith: person.household.personFaith.status,
        houseFaith: person.household.houseFaith.status,
        humanoidAdmission: person.household.humanoidAdmission,
      }])) };
  }
  return readPersonBirthdayInputs(db, { expectedSourceHashes });
}
