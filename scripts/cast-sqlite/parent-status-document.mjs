import { createHash } from 'node:crypto';

export const PARENT_STATUS_SOURCE_HASH = 'b299315cb68ab697b48339102ddd0e1c513c7b4c75bf07c4ef615077e4ac4781';
const documentHash = '7982286ac5fa78e7b6321267b25aaebedddaa6afb997f6350203cb2969325a82';
const fail = () => { throw new Error('E_PARENT_STATUS_DOCUMENT'); };

/** Complete original document from existing typed family rows, not a sparse Map. */
export function readParentStatusDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== PARENT_STATUS_SOURCE_HASH) fail();
  const source = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?')
    .get('lore/name-pools/cast-family-parent-status.json');
  if (!source || source.sha256 !== expectedSourceHash) fail();
  const metadata = db.prepare('SELECT * FROM family_source_metadata WHERE source_id=?').all(source.source_id);
  if (metadata.length !== 1 || metadata[0].field_name !== 'schemaVersion'
    || metadata[0].value_kind !== 'number' || metadata[0].json_pointer !== '/schemaVersion') fail();
  const rows = db.prepare('SELECT * FROM family_parent_status WHERE source_id=?').all(source.source_id)
    .sort((a,b) => Number(a.json_pointer.slice(9))-Number(b.json_pointer.slice(9)));
  if (rows.length !== 2 || rows.some((r,i) => r.json_pointer !== '/records/'+i)) fail();
  const document = { schemaVersion:metadata[0].integer_value, records:rows.map(r => ({
    personId:r.person_id,status:r.status,knownParentId:r.known_parent_id,knownRelationship:r.known_relationship,
    sourceRef:{path:r.source_ref_path,anchor:r.source_ref_anchor},
  })) };
  if (createHash('sha256').update(JSON.stringify(document)).digest('hex') !== documentHash) fail();
  return document;
}
