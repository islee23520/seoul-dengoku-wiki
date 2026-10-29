import { createHash } from 'node:crypto';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw Object.assign(new Error(`E_HOUSEHOLD_POLICY_DOCUMENT: ${detail}`), { code: 'E_HOUSEHOLD_POLICY_DOCUMENT' }); };
const fields = ['schema','approvalRef','sourceRefs','counts','tierQuotas','faithStates','faithEvidence','priority','unknownOrientation','knownOrientations','otherKnownOrientationGender','existingGender','facilityCustody','seedKey','sexualRelationship','politicalPositionContext','politicalPositions'];
const scalars = ['schema','approvalRef','counts','faithEvidence','unknownOrientation','otherKnownOrientationGender','existingGender','facilityCustody','seedKey','sexualRelationship'];
const columns = ['schema','approval_ref','counts','faith_evidence','unknown_orientation','other_known_orientation_gender','existing_gender','facility_custody','seed_key','sexual_relationship'];
const lists = [
  ['faithStates','household_policy_faith_state','faith_state',3],
  ['priority','household_policy_priority','priority',4],
  ['knownOrientations','household_policy_known_orientation','orientation',5],
];
function keys(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || JSON.stringify(Object.keys(value)) !== JSON.stringify(expected)) fail('unknown, missing, or unordered fields');
}
function shape(document) {
  keys(document, fields);
  if (scalars.some(k => typeof document[k] !== 'string') || document.tierQuotas !== null) fail('scalar or null shape');
  if (!Array.isArray(document.sourceRefs) || document.sourceRefs.length !== 3) fail('source refs');
  for (const ref of document.sourceRefs) {
    keys(ref,['path','anchor']);
    if (typeof ref.path !== 'string' || typeof ref.anchor !== 'string') fail('source ref shape');
  }
  for (const [key,,,count] of lists) {
    if (!Array.isArray(document[key]) || document[key].length !== count || document[key].some(v => typeof v !== 'string')) fail('list shape');
  }
  keys(document.politicalPositionContext,['polity:daejeon']);
  const context = document.politicalPositionContext['polity:daejeon'];
  keys(context,['kind','currentScope','rightsBasis','rightsLimit']);
  keys(context.rightsBasis,['path','jsonPointer','approvalRef']);
  if (![context.kind,context.currentScope,context.rightsLimit,...Object.values(context.rightsBasis)].every(v => typeof v === 'string')) fail('context shape');
  keys(document.politicalPositions,['S02','S06','union:religious','polity:daejeon','S08']);
  if (Object.values(document.politicalPositions).some(v => typeof v !== 'string')) fail('position shape');
}
const receipt = (sourceHash, documentHash, actor, reason) => hash(JSON.stringify([sourceHash, documentHash, actor, reason]));

/** Import exactly the bounded source; this does not create or approve policy. */
export function initializeHouseholdPolicyDocument(db, { schemaSql, sourceBytes, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql,actor,reason].every(v => typeof v === 'string' && v.trim())
    || !(sourceBytes instanceof Uint8Array)) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes));
  shape(document);
  const sourceHash = hash(sourceBytes), documentHash = hash(JSON.stringify(document));
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare(`INSERT INTO household_policy_document
      (document_id,source_sha256,${columns.join(',')},tier_quotas,actor,reason,receipt_sha256)
      VALUES (1,${Array(15).fill('?').join(',')})`)
      .run(sourceHash,...scalars.map(k => document[k]),null,actor,reason,receipt(sourceHash, documentHash, actor, reason));
    document.sourceRefs.forEach((ref,i) => db.prepare('INSERT INTO household_policy_source_ref VALUES (?,?,?)').run(i,ref.path,ref.anchor));
    for (const [key,table] of lists) document[key].forEach((value,i) => db.prepare(`INSERT INTO ${table} VALUES (?,?)`).run(i,value));
    Object.entries(document.politicalPositionContext).forEach(([entity,c],i) => {
      db.prepare('INSERT INTO household_policy_position_context VALUES (?,?,?,?,?,?,?,?)')
        .run(i,entity,c.kind,c.currentScope,c.rightsBasis.path,c.rightsBasis.jsonPointer,c.rightsBasis.approvalRef,c.rightsLimit);
    });
    Object.entries(document.politicalPositions).forEach(([entity,position],i) => db.prepare('INSERT INTO household_policy_position VALUES (?,?,?)').run(i,entity,position));
    readHouseholdPolicyDocument(db);
    db.exec('COMMIT');
    return { documents:1, sourceRefs:3, faithStates:3, priorities:4, knownOrientations:5, politicalPositionContexts:1, politicalPositions:5, totalRows:22 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only: no source I/O, archive decoding, JSON parsing, or writes. */
export function readHouseholdPolicyDocument(db) {
  const rows = db.prepare('SELECT * FROM household_policy_document').all();
  if (rows.length !== 1) fail('document count');
  const row = rows[0];
  if (row.document_id !== 1 || typeof row.actor !== 'string' || !row.actor.trim()
    || typeof row.reason !== 'string' || !row.reason.trim()) fail('provenance');
  const ordered = (table,count) => {
    const result = db.prepare(`SELECT * FROM ${table} ORDER BY ordinal`).all();
    if (result.length !== count || result.some((r,i) => r.ordinal !== i)) fail(`${table} coverage`);
    return result;
  };
  const values = Object.fromEntries(scalars.map((k,i) => [k,row[columns[i]]]));
  values.tierQuotas = row.tier_quotas;
  values.sourceRefs = ordered('household_policy_source_ref',3).map(r => ({path:r.path,anchor:r.anchor}));
  for (const [key,table,column,count] of lists) values[key] = ordered(table,count).map(r => r[column]);
  values.politicalPositionContext = Object.fromEntries(ordered('household_policy_position_context',1).map(r => [r.entity_key,{
    kind:r.kind,currentScope:r.current_scope,rightsBasis:{path:r.rights_basis_path,jsonPointer:r.rights_basis_json_pointer,approvalRef:r.rights_basis_approval_ref},rightsLimit:r.rights_limit,
  }]));
  values.politicalPositions = Object.fromEntries(ordered('household_policy_position',5).map(r => [r.entity_key,r.position]));
  const document = Object.fromEntries(fields.map(k => [k,values[k]]));
  shape(document);
  return document;
}
