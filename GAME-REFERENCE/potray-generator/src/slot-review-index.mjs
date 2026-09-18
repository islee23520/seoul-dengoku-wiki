import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { registerGateEvaluation } from './gate-evaluations.mjs';

export async function indexSlotReviews({ db, repoRoot }) {
  const path = 'Design/potrait-generator/work/gate2-readiness/matrix.json';
  const bytes = readFileSync(resolve(repoRoot, path));
  const sha = createHash('sha256').update(bytes).digest('hex');
  const matrix = JSON.parse(bytes);
  const binding = db.prepare('SELECT sha256 FROM asset_paths WHERE path=?').get(path);
  if (binding?.sha256 !== sha) throw new Error('scan the current gate2 readiness matrix before indexing');
  if (!Array.isArray(matrix.rows) || new Set(matrix.rows.map(r=>`${r.sex}/${r.slot}`)).size !== 14) throw new Error('expected fourteen unique readiness scopes');
  for (const row of matrix.rows) for (const evidence of [row.selected_source,row.current,...(row.receipt_hashes??[])].filter(item=>item?.path)) {
    const bound = db.prepare('SELECT sha256 FROM asset_paths WHERE path=?').get(evidence.path);
    if (bound?.sha256 !== evidence.sha256) throw new Error(`readiness evidence drift: ${evidence.path}`);
    const actual = createHash('sha256').update(readFileSync(resolve(repoRoot,evidence.path))).digest('hex');
    if (actual !== evidence.sha256) throw new Error(`readiness evidence SHA mismatch: ${evidence.path}`);
  }
  db.exec(`CREATE TABLE IF NOT EXISTS slot_review_observations (
    id INTEGER PRIMARY KEY, sex TEXT NOT NULL, slot TEXT NOT NULL,
    source_path TEXT NOT NULL, source_sha256 TEXT NOT NULL,
    subject_path TEXT, subject_sha256 TEXT,
    report_path TEXT NOT NULL, report_sha256 TEXT NOT NULL,
    bounded_status TEXT NOT NULL, details_json TEXT NOT NULL,
    UNIQUE(sex,slot,source_path,source_sha256,report_sha256)
  ) STRICT`);
  const insert = db.prepare(`INSERT OR IGNORE INTO slot_review_observations
    (sex,slot,source_path,source_sha256,subject_path,subject_sha256,report_path,report_sha256,bounded_status,details_json)
    VALUES(?,?,?,?,?,?,?,?,?,?)`);
  let inserted = 0;
  for (const row of matrix.rows) {
    inserted += Number(insert.run(row.sex,row.slot,row.selected_source.path,row.selected_source.sha256,row.current?.path??null,row.current?.sha256??null,path,sha,row.bounded_status,JSON.stringify(row)).changes);
    if (row.current?.path) for (const check of ['part_ownership','hidden_surfaces','sex']) {
      await registerGateEvaluation({ db, repoRoot, subjectPath:row.current.path,subjectSha256:row.current.sha256,
        sourcePath:row.selected_source.path,sourceSha256:row.selected_source.sha256,
        receiptPath:path,receiptSha256:sha,sex:row.sex,slot:row.slot,gate:'gate2',check,
        decision:'PENDING',scope:'read_only_existing_evidence_readiness',authority:'audit',
        summary:`${row.bounded_status}; ${check}: ${row.checks[check]}; no new Gate2 approval` });
    }
  }
  return { rows:matrix.rows.length,inserted,newGate2Passes:0,next:matrix.concrete_next_slot };
}
