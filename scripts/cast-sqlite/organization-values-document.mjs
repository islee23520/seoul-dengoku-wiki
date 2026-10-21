import { createHash } from 'node:crypto';

export const ORGANIZATION_VALUES_SOURCE_HASH = '04a8d5fba59bcf8656f0c14955f479f5e4374093c051e530715094a67d1bbee0';
const documentHash = 'dfd077f83cbf73bc0e9c7ae9bfbdefaaef2f0e1711bb8ef100bca7daf7aebaa4';
const fields = ['schema','note','axes','policies','count','orgs'];
const orgFields = ['id','name','kind','class','states','values','policy','source'];
const axes = ['권위','개방','무력','물질','공동','원칙','공개','자격','분산','변혁'];
const policies = ['전쟁','이주민','급수','노동','기록','기술','교역','후계','결합'];
const scoreColumns = ['authority','openness','force','material','communal','principle','disclosure','qualification','decentralization','transformation'];
const policyColumns = ['war','migrants','water','labor','records','technology','trade','succession','union_policy'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = detail => { throw new Error(`E_ORGANIZATION_VALUES_DOCUMENT: ${detail}`); };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function keys(value, expected) {
  if (!value || Array.isArray(value) || typeof value !== 'object' || !same(Object.keys(value),expected)) fail('fields or key order');
}
function ordered(rows) {
  if (rows.some((r,i) => r.ordinal !== i)) fail('ordinal');
  return rows;
}

/** Bounded original proposal import, not publication or content approval. */
export function initializeOrganizationValuesDocument(db, { schemaSql, sourceBytes, expectedSourceHash, actor, reason } = {}) {
  if (db.isTransaction || ![schemaSql,actor,reason].every(v => typeof v === 'string' && v.trim())
    || !(sourceBytes instanceof Uint8Array) || expectedSourceHash !== ORGANIZATION_VALUES_SOURCE_HASH) fail('input');
  const document = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(sourceBytes));
  keys(document,fields);
  if (typeof document.schema !== 'string' || typeof document.note !== 'string'
    || !same(document.axes,axes) || !same(document.policies,policies)
    || document.count !== 37 || !Array.isArray(document.orgs) || document.orgs.length !== document.count) fail('metadata');
  for (const org of document.orgs) {
    keys(org,orgFields.filter(k => k !== 'class' || Object.hasOwn(org,'class')));
    if (!['id','name','kind','source'].every(k => typeof org[k] === 'string')
      || (Object.hasOwn(org,'class') && org.class !== null && typeof org.class !== 'string')
      || !Array.isArray(org.states) || org.states.some(s => typeof s !== 'string')) fail('organization');
    keys(org.values,axes);
    keys(org.policy,policies);
    if (axes.some(k => !Number.isSafeInteger(org.values[k])) || policies.some(k => typeof org.policy[k] !== 'string')) fail('values or policy');
  }
  if (hash(sourceBytes) !== ORGANIZATION_VALUES_SOURCE_HASH || hash(JSON.stringify(document)) !== documentHash) fail('source hash');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(schemaSql);
    db.prepare('INSERT INTO organization_values_document VALUES (1,?,?,?,?,?,?)')
      .run(expectedSourceHash,document.schema,document.note,document.count,actor,reason);
    document.axes.forEach((name,i) => db.prepare('INSERT INTO organization_values_axis VALUES (1,?,?)').run(i,name));
    document.policies.forEach((name,i) => db.prepare('INSERT INTO organization_values_policy_axis VALUES (1,?,?)').run(i,name));
    document.orgs.forEach((org,i) => {
      db.prepare('INSERT INTO organization_values_org VALUES (1,?,?,?,?,?,?,?)')
        .run(i,org.id,org.name,org.kind,Number(Object.hasOwn(org,'class')),org.class ?? null,org.source);
      org.states.forEach((state,j) => db.prepare('INSERT INTO organization_values_state VALUES (?,?,?)').run(org.id,j,state));
      db.prepare('INSERT INTO organization_values_score VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(org.id,...axes.map(k => org.values[k]));
      db.prepare('INSERT INTO organization_values_policy VALUES (?,?,?,?,?,?,?,?,?,?)').run(org.id,...policies.map(k => org.policy[k]));
    });
    readOrganizationValuesDocument(db,{expectedSourceHash});
    db.exec('COMMIT');
    return { documents:1, axes:10, policies:9, organizations:37, states:118, values:370, policyValues:333 };
  } catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
}

/** SELECT-only reconstruction; every document row participates in the fixed ordered hash. */
export function readOrganizationValuesDocument(db, { expectedSourceHash } = {}) {
  if (expectedSourceHash !== ORGANIZATION_VALUES_SOURCE_HASH) fail('expected hash');
  const documents = db.prepare('SELECT * FROM organization_values_document').all();
  if (documents.length !== 1) fail('document count');
  const row = documents[0];
  if (row.document_id !== 1 || row.source_sha256 !== expectedSourceHash || !row.actor.trim() || !row.reason.trim()) fail('provenance');
  const axisRows = ordered(db.prepare('SELECT * FROM organization_values_axis ORDER BY ordinal').all());
  const policyRows = ordered(db.prepare('SELECT * FROM organization_values_policy_axis ORDER BY ordinal').all());
  const orgs = ordered(db.prepare('SELECT * FROM organization_values_org ORDER BY ordinal').all());
  const states = db.prepare('SELECT * FROM organization_values_state ORDER BY org_id,ordinal').all();
  const scores = db.prepare('SELECT * FROM organization_values_score ORDER BY org_id').all();
  const policyValues = db.prepare('SELECT * FROM organization_values_policy ORDER BY org_id').all();
  if ([...axisRows,...policyRows,...orgs].some(r => r.document_id !== 1)
    || states.some(r => !orgs.some(o => o.id === r.org_id))
    || scores.length !== orgs.length || policyValues.length !== orgs.length) fail('row coverage');
  const document = { schema:row.schema, note:row.note, axes:axisRows.map(r => r.name), policies:policyRows.map(r => r.name), count:row.count,
    orgs:orgs.map(org => {
      const score = scores.find(r => r.org_id === org.id), policy = policyValues.find(r => r.org_id === org.id);
      if (!score || !policy || ![0,1].includes(org.class_present) || (!org.class_present && org.class !== null)) fail('organization rows');
      const result = { id:org.id, name:org.name, kind:org.kind };
      if (org.class_present) result.class = org.class;
      result.states = ordered(states.filter(r => r.org_id === org.id)).map(r => r.state);
      result.values = Object.fromEntries(axes.map((k,i) => [k,score[scoreColumns[i]]]));
      result.policy = Object.fromEntries(policies.map((k,i) => [k,policy[policyColumns[i]]]));
      result.source = org.source;
      return result;
    }) };
  if (hash(JSON.stringify(document)) !== documentHash) fail('document hash');
  return document;
}
