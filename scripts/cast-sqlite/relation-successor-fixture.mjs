import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const canonical = v => Array.isArray(v) ? v.map(canonical) : v !== null && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
export const digest = v => createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function relationFixture(t) {
 const db = new DatabaseSync(':memory:'); t.after(() => db.close());
 const original = { schema: 'relations.v1', note: 'representative',
  provisionalPeople: [{ id: 'P2', name: 'Second', sourceAnchor: 'second' }],
  courtContract: { schema: 'court.v1', effectiveYear: 2126, approvalRef: 'approved', courtIdContract: 'court:person', sourcePath: 'court-source', sourceAnchor: 'court' },
  ownerLieges: { schema: 'owner.v1', effectiveYear: 2126, approvalRef: 'approved', note: 'owner', sourceBasis: [{ path: 'basis', anchor: 'basis', quote: 'basis' }], edges: [{ personId: 'P2', liegePersonId: 'K1008', relationKind: 'vassal', ownerTerm: 'lord' }] },
  courtMemberships: { schema: 'membership.v1', effectiveYear: 2126, note: 'members', courtApprovals: [{ courtId: 'court:K1008', approvalRef: 'approved' }], memberships: [{ personId: 'P2', courtId: 'court:K1008', approvalRef: 'approved' }] },
  courts: Array.from({ length: 14 }, (_, i) => ({ id: i === 13 ? 'court:K1008' : 'court:P' + i, ownerPersonId: i === 13 ? 'K1008' : 'P' + i, stateId: i === 13 ? 'polity:daejeon' : 'S01' })),
  directRetainers: [{ personId: 'P2', liegePersonId: 'K1008', courtId: 'court:K1008', sourceRow: 1 }],
  organizations: [{ id: 'O1', name: 'Organization', stateId: 'S01', sourceAnchor: 'org' }],
  eventLinks: [{ eventId: 'E1', personId: 'P2', organizationId: 'O1' }] };
 const current = structuredClone(original); current.courts[13].stateId = 'S02';
 const bytes = Buffer.from(JSON.stringify(original, null, 2) + '\n');
 const sourceSha256 = createHash('sha256').update(bytes).digest('hex');
 const path = 'lore/relations/relations.json', approvalRef = 'scripts/approved-seoul-faction-consolidation-20261022.json';
 const parent = digest(['data-source-v1', path, null, digest(original), 'import', 'archived import baseline']);
 const revision = digest(['data-source-v1', path, parent, digest(current), 'author', 'approved D1']);
 db.exec('CREATE TABLE source_file(source_id INTEGER PRIMARY KEY,logical_path TEXT,sha256 TEXT,media_type TEXT,raw_bytes BLOB); CREATE TABLE data_source_head(source_path TEXT,revision_id TEXT,archived_sha256 TEXT); CREATE TABLE data_source_current(source_path TEXT,revision_id TEXT,document_json TEXT); CREATE TABLE data_source_revision(revision_id TEXT,source_path TEXT,parent_revision TEXT,semantic_sha256 TEXT,actor TEXT,reason TEXT,sequence INTEGER,approval_ref TEXT);');
 db.prepare('INSERT INTO source_file VALUES(1,?,?,?,?)').run(path, sourceSha256, 'application/json', bytes);
 db.prepare('INSERT INTO data_source_head VALUES(?,?,?)').run(path, revision, sourceSha256);
 db.prepare('INSERT INTO data_source_current VALUES(?,?,?)').run(path, revision, JSON.stringify(current));
 db.prepare('INSERT INTO data_source_revision VALUES(?,?,?,?,?,?,?,?)').run(parent, path, null, digest(original), 'import', 'archived import baseline', 0, 'archived');
 db.prepare('INSERT INTO data_source_revision VALUES(?,?,?,?,?,?,?,?)').run(revision, path, parent, digest(current), 'author', 'approved D1', 1, approvalRef);
 db.exec(readFileSync(new URL('./relation-inputs.sql', import.meta.url), 'utf8'));
 db.prepare('INSERT INTO relation_input_metadata VALUES(1,1,?,?,?,?,?,?,?,?)').run(sourceSha256, digest(original), original.schema, original.note, original.ownerLieges.note, original.courtMemberships.schema, 2126, original.courtMemberships.note);
 db.prepare('INSERT INTO relation_input_provisional_person VALUES(0,?,?,?)').run('P2', 'Second', 'second');
 const add = (table, rows) => { const keys = Object.keys(rows[0]); db.exec('CREATE TABLE ' + table + '(' + keys.map(k => k + ' ' + (typeof rows[0][k] === 'number' ? 'INTEGER' : 'TEXT')).join(',') + ')'); for (const r of rows) db.prepare('INSERT INTO ' + table + ' VALUES(' + keys.map(() => '?').join(',') + ')').run(...keys.map(k => r[k])); };
 const located = (rows, pointer) => rows.map((r, i) => ({ ...r, source_id: 1, json_pointer: '/' + pointer + '/' + i }));
 add('context_relation_contract', [{ contract_id: 'court', court_id_contract: 'court:person', source_ref_path: 'court-source', source_ref_anchor: 'court', source_schema: 'court.v1', effective_year: 2126, approval_ref: 'approved', source_id: 1 }]);
 add('context_owner_liege', located([{ person_id: 'P2', liege_person_id: 'K1008', relation_kind: 'vassal', owner_term: 'lord', source_schema: 'owner.v1', effective_year: 2126, approval_ref: 'approved' }], 'ownerLieges/edges'));
 add('context_owner_liege_source_basis', located([{ source_ref_path: 'basis', source_ref_anchor: 'basis', source_quote: 'basis' }], 'ownerLieges/sourceBasis'));
 add('context_court_approval', located([{ court_id: 'court:K1008', approval_ref: 'approved' }], 'courtMemberships/courtApprovals'));
 add('context_court_membership', located([{ person_id: 'P2', court_id: 'court:K1008', approval_ref: 'approved' }], 'courtMemberships/memberships'));
 add('context_court', located(original.courts.map(r => ({ court_id: r.id, owner_person_id: r.ownerPersonId, polity_id: r.stateId })), 'courts'));
 add('context_direct_retainer', located([{ person_id: 'P2', liege_person_id: 'K1008', court_id: 'court:K1008', source_row: 1 }], 'directRetainers'));
 add('context_organization', located([{ organization_id: 'O1', name: 'Organization', polity_id: 'S01', source_anchor: 'org' }], 'organizations'));
 add('context_event_link', located([{ event_id: 'E1', person_id: 'P2', organization_id: 'O1' }], 'eventLinks'));
 return { db, original, current, bytes, parent, revision, pin: { logicalPath: path, sourceSha256, bootstrapDigest: digest(original), semanticSha256: digest(current), approvalRef, revision, parent, sequence: 1 } };
}
