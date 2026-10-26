import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const hash = value => createHash('sha256').update(value).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
const fields = ['characterId', 'name', 'detailRoute', 'state', 'stateName'];
const mappingAuthority = '5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96';

// Evidence is a narrow derivation of the existing authenticated mapping result,
// not a new approval writer. Its exact bytes must be enrolled independently in
// the selected-source code registry, together with the authenticated source pins.
export function readInternalIdentityDomain(reader, affiliation, selected, bytes) {
  if (hash(bytes) !== selected.evidenceSha256) fail('E_IDENTITY_EVIDENCE_HASH');
  const evidence = JSON.parse(bytes);
  if (evidence.schema !== 'wiki-internal-identity-evidence.v1'
    || evidence.scope !== 'internal-approved-successor'
    || evidence.mappingAuthoritySha256 !== mappingAuthority
    || evidence.approvalRef !== selected.approvalRef
    || !isDeepStrictEqual(evidence.affiliation, selected.affiliation)) fail('E_IDENTITY_APPROVAL');
  if (!Array.isArray(evidence.mappings) || !Array.isArray(evidence.crosswalks)
    || !Array.isArray(evidence.persons)) fail('E_IDENTITY_EVIDENCE_SHAPE');
  const all = sql => reader.prepare(sql).all().map(row => ({ ...row }));
  const people = all(`SELECT p.person_id,p.name,p.public_route,p.state_id,p.state_name,
    r.ordinal,r.has_aliases,d.status,d.decision_ref
    FROM atlas_identity_registry_person r JOIN person p USING(person_id)
    JOIN person_disposition d USING(person_id) ORDER BY r.ordinal`);
  const total = reader.prepare('SELECT count(*) AS n FROM person').get().n;
  if (people.length !== total || total !== selected.personCount || evidence.persons.length !== total) fail('E_IDENTITY_PERSON_COVERAGE');
  const aliases = all('SELECT person_id,alias,alias_ordinal FROM person_alias ORDER BY person_id,alias_ordinal');
  const routes = new Set(), ids = new Set(), usedMappings = new Set();
  const states = new Map(affiliation.states.map(row => [row.stateId, row]));
  const unaffiliatedLabels = all("SELECT name_ko FROM state_label WHERE state_id='S00'").map(row => row.name_ko);
  const persons = people.map((row, index) => {
    if (row.ordinal !== index || ids.has(row.person_id) || routes.has(row.public_route)
      || !/^\/people\/person-\d{4}$/.test(row.public_route) || !row.name) fail('E_IDENTITY_PERSON_IDENTITY');
    ids.add(row.person_id); routes.add(row.public_route);
    if (!['active', 'retired-current'].includes(row.status) || row.decision_ref !== selected.dispositionRef) fail('E_IDENTITY_DISPOSITION');
    if (row.state_id === null ? row.state_name !== null : row.state_id === 'S00'
      ? !unaffiliatedLabels.includes(row.state_name) : !states.has(row.state_id) || states.get(row.state_id).currentName !== row.state_name)
      fail('E_IDENTITY_PERSON_STATE');
    const personAliases = aliases.filter(alias => alias.person_id === row.person_id);
    if (![0, 1].includes(row.has_aliases) || !row.has_aliases && personAliases.length
      || personAliases.some((alias, i) => alias.alias_ordinal !== i)) fail('E_IDENTITY_ALIASES');
    const identity = { characterId: row.person_id, name: row.name, detailRoute: row.public_route,
      state: row.state_id, stateName: row.state_name,
      ...(row.has_aliases ? { aliases: personAliases.map(alias => alias.alias) } : {}), status: row.status };
    if (!isDeepStrictEqual(evidence.persons[index], identity)) fail('E_IDENTITY_PERSON_EVIDENCE');
    for (const field of fields) {
      const matches = evidence.mappings.filter(m => m.characterId === row.person_id && m.jsonPointer === '/' + field);
      if (matches.length !== 1) fail('E_IDENTITY_MAPPING_COVERAGE');
      const mapping = matches[0];
      if (!['retain', 'replace'].includes(mapping.disposition) || mapping.valueSha256 !== hash(JSON.stringify(identity[field]))
        || !mapping.source || (mapping.disposition === 'replace' && !mapping.approvedSuccessor)) fail('E_IDENTITY_MAPPING_VALUE');
      for (const binding of [mapping.source, mapping.approvedSuccessor].filter(Boolean)) {
        if (selected.sourceHashes[binding.sourcePath] !== binding.sourceSha256
          || !/^[a-f0-9]{64}$/.test(binding.valueSha256) || typeof binding.jsonPointer !== 'string') fail('E_IDENTITY_MAPPING_SOURCE');
      }
      usedMappings.add(mapping);
    }
    return { id: identity.characterId, labels: { ko: identity.name }, route: identity.detailRoute,
      state: identity.state, stateName: identity.stateName,
      ...(identity.state === 'S00' ? {} : { polityRef: identity.state }),
      status: identity.status, ...(row.has_aliases ? { aliases: identity.aliases } : {}) };
  });
  if (usedMappings.size !== evidence.mappings.length || aliases.some(row => !ids.has(row.person_id))) fail('E_IDENTITY_MAPPING_COVERAGE');
  const usedCrosswalks = new Set();
  const blocs = affiliation.hegemons.filter(row => row.kind === 'union').map(row => {
    const matches = evidence.crosswalks.filter(c => c.sourcePointer === row.sourcePointer);
    if (matches.length !== 1) fail('E_IDENTITY_CROSSWALK_MISSING');
    const c = matches[0];
    if (c.id !== 'union:religious' || c.revisionId !== selected.affiliation.revisionId
      || !isDeepStrictEqual(c.memberStateIds, row.memberStateIds)
      || !isDeepStrictEqual(c, selected.crosswalks.find(value => value.sourcePointer === row.sourcePointer))) fail('E_IDENTITY_CROSSWALK_DRIFT');
    usedCrosswalks.add(c);
    return { id: c.id, labels: { ko: row.name }, memberPolityRefs: [...row.memberStateIds] };
  });
  if (usedCrosswalks.size !== evidence.crosswalks.length || new Set(blocs.map(b => b.id)).size !== blocs.length) fail('E_IDENTITY_CROSSWALK_DRIFT');
  return { complete: true, requiresAffiliation: false, persons,
    polities: affiliation.states.map(row => ({ id: row.stateId, labels: { ko: row.currentName },
      affiliationRef: row.affiliation.membershipStatus === 'neutral' ? null : row.affiliation.kind === 'state'
        ? row.affiliation.stateId : blocs.find(b => b.memberPolityRefs.includes(row.stateId)).id })), blocs,
    fieldProvenance: evidence.mappings.map(mapping => ({ ...mapping, approvalFingerprint: selected.evidenceSha256,
      approvalRef: selected.approvalRef, distribution: 'protected', scope: 'internal-approved-successor' })) };
}
