import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const sourcePath = 'lore/factions/Sixteen-States.json';
const sourceSha = '73b19e6af00df16fb06adfbaab7c386aea6930ff01587dd6a0dc69fbae557a3c';
const approvalSha = '80d131f88ce5b5441afc22912d7607fec2a5a92aec387e598fb208e733a22040';
const revision = 'e6068bd3321de8b142db54adb8f92501296cf269b75682191596aa8c349faa4b';
const semantic = '79ec7c8b148500dfb835b8b1032f14701525c96041ecb7c0f43274c222338734';
const parent = '1e7bcf057b554cf6b52ea50dd5645da515b0513f04a30adcb5f461e3af462474';
const parentSemantic = '8d43c418de8b4318240ea066ba0fdf9e75430e2723fbfa272d48653fb352f415';
const fail = detail => { throw Object.assign(Error(`E_IDENTITY_EVIDENCE: ${detail}`), { code: 'E_IDENTITY_EVIDENCE' }); };

/** Evidence preparation only, after the caller's accepted full authentication.
 * The exact authored tuple is the shipped successor reader's S08 authority.
 * No publication admission, body authentication, union crosswalk or per-person
 * field approval is minted here. Never register this as a complete provider.
 */
export function readMapIdentityEvidenceInputs(db) {
  const bytes = readFileSync(new URL('../approved-s08-article-wording-20261024.json', import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== approvalSha) fail('approval bytes');
  const approval = JSON.parse(bytes);
  if (approval.revision !== revision || approval.semanticSha256 !== semantic || approval.predecessor !== parent
    || approval.status !== 'approved-for-typed-draft-application') fail('approval tuple');
  const heads = db.prepare(`SELECT s.source_id,s.sha256,h.revision_id,r.semantic_sha256,r.parent_revision,r.algorithm,
    r.sequence,p.source_id AS parent_source_id,p.semantic_sha256 AS parent_semantic,p.algorithm AS parent_algorithm,p.sequence AS parent_sequence
    FROM source_file s JOIN text_document d USING(source_id) JOIN document_head h USING(source_id)
    JOIN document_revision r USING(source_id,revision_id) JOIN document_revision_seal z USING(revision_id)
    JOIN document_revision p ON p.revision_id=r.parent_revision
    JOIN document_revision_seal pz ON pz.revision_id=p.revision_id
    WHERE s.logical_path=? AND d.document_id='DOC:Sixteen-States' AND d.domain='factions'
      AND d.corpus_kind='current' AND d.status='draft'`).all(sourcePath);
  if (heads.length !== 1) fail('missing selected sealed head');
  const [head] = heads;
  if (head.source_id !== 84 || head.sha256 !== sourceSha || head.revision_id !== revision
    || head.semantic_sha256 !== semantic || head.parent_revision !== parent
    || head.algorithm !== 'typed-envelope-v1' || head.parent_algorithm !== 'typed-envelope-v1'
    || head.parent_source_id !== head.source_id || head.parent_semantic !== parentSemantic
    || head.parent_sequence >= head.sequence) fail('selected successor tuple');
  const columns = {
    text_affiliation_hegemon: 'source_id,json_pointer,ordinal,kind,state_id,name',
    text_affiliation_member: 'source_id,json_pointer,hegemon_ordinal,ordinal,state_id',
    text_affiliation_state: 'source_id,json_pointer,ordinal,state_id,current_name',
    text_affiliation_neutral: 'source_id,json_pointer,ordinal,state_id',
  };
  const affiliation = {};
  for (const [table, fields] of Object.entries(columns)) {
    const order = table === 'text_affiliation_member' ? 'hegemon_ordinal,ordinal' : 'ordinal';
    const current = db.prepare(`SELECT ${fields} FROM ${table} WHERE source_id=? ORDER BY ${order}`).all(84);
    const sealed = db.prepare(`SELECT ${fields} FROM document_revision_${table}
      WHERE source_id=? AND revision_id=? ORDER BY ${order}`).all(84, revision);
    if (JSON.stringify(current) !== JSON.stringify(sealed)) fail('current identity drift');
    affiliation[table] = sealed;
  }
  return { schema: 'wiki-map-identity-evidence-inputs.v1', visibility: 'protected',
    verification: 'selected-successor-metadata-and-identity-slice-only', complete: false,
    source: head, approvalSha256: approvalSha, affiliation,
    requiredNextAuthority: ['authenticated-person-field-mappings', 'exact-union-source-record-crosswalk'],
    publicAdmission: 'NOT_GRANTED' };
}
