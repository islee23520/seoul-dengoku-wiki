import { createHash } from 'node:crypto';

export const BIRTH_COHORT_SOURCE_HASH = 'b921694843a466dd807572b880a3b5019cf7892df3f1a3edbb5fcdb63bc182c7';
const metadataFields = ['schemaVersion','approvalRef','approvedOption','proposalSha256','baselineRevision','baselineBirthdaySha256','baselineRegistrySha256'];
const fail = () => { throw new Error('E_BIRTH_COHORT_DOCUMENT'); };

/** Entire original source from existing normalized family metadata and cohorts. */
export function readBirthCohortDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== BIRTH_COHORT_SOURCE_HASH) fail();
  const source = db.prepare('SELECT source_id,sha256 FROM source_file WHERE logical_path=?')
    .get('lore/name-pools/cast-birth-cohorts.json');
  if (!source || source.sha256 !== expectedSourceHash) fail();
  const metadata = db.prepare('SELECT * FROM family_source_metadata WHERE source_id=?').all(source.source_id);
  if (metadata.length !== metadataFields.length) fail();
  const document = Object.fromEntries(metadataFields.map(field => {
    const row = metadata.find(r => r.field_name === field);
    const numeric = ['schemaVersion','approvedOption'].includes(field);
    if (!row || row.json_pointer !== '/'+field || row.value_kind !== (numeric ? 'number' : 'string')) fail();
    return [field,numeric ? row.integer_value : row.text_value];
  }));
  const ordered = (table,prefix,count) => {
    const rows=db.prepare('SELECT * FROM '+table+' WHERE source_id=?').all(source.source_id)
      .sort((a,b)=>Number(a.json_pointer.slice(prefix.length))-Number(b.json_pointer.slice(prefix.length)));
    if (rows.length !== count || rows.some((r,i)=>r.json_pointer !== prefix+i)) fail();
    return rows;
  };
  document.cohorts=ordered('family_birth_cohort','/cohorts/',4)
    .map(r=>({id:r.cohort_id,startYear:r.start_year,endYear:r.end_year}));
  document.assignments=ordered('family_birth_cohort_assignment','/assignments/',1022)
    .map(r=>({personId:r.person_id,baselineBirthDate:r.baseline_birth_date,cohort:r.cohort_id}));
  if (createHash('sha256').update(JSON.stringify(document)).digest('hex') !== '3918d30ab94ba849c08882dbaf11d85a79a9c06c3ee3f695fdaa6ff14ea5d15b') fail();
  return document;
}
