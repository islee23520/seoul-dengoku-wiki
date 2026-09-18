import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { openAssetDatabase } from '../src/database.mjs';
import { scanEvidence } from '../src/scanner.mjs';
import { indexSlotReviews } from '../src/slot-review-index.mjs';
import { getGateAuditReport } from '../src/gate-evaluations.mjs';

test('fourteen scoped readiness reports remain pending and preserve duplicate-free history', async t => {
  const root=mkdtempSync(join(tmpdir(),'slot-readiness-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const evidence=join(root,'.omo/evidence'); const work=join(root,'Design/potrait-generator/work/gate2-readiness');
  mkdirSync(evidence,{recursive:true});mkdirSync(work,{recursive:true});
  const put=(path,text)=>{writeFileSync(join(root,path),text);return{path,sha256:createHash('sha256').update(text).digest('hex')};};
  const source=put('.omo/evidence/source.png','source'); const subject=put('.omo/evidence/face.png','part');
  const rows=['female','male'].flatMap(sex=>['face_base','mouth','nose','ears','eyes_white','eyes_color','eyes_shape'].map(slot=>({
    sex,slot,selected_source:source,current:subject,receipt_hashes:[],bounded_status:'SAMPLE_NOT_GATE2_PASS',checks:{part_ownership:'LOCAL_ONLY',hidden_surfaces:'MISSING',sex:'SAME_SEX'},blockers:['no hidden surface proof'],
  })));
  writeFileSync(join(work,'matrix.json'),JSON.stringify({rows,concrete_next_slot:'male/eyes_white'}));
  const db=openAssetDatabase(join(root,'assets.sqlite'));t.after(()=>db.close());
  await scanEvidence({db,repoRoot:root,evidenceRoot:evidence,additionalRoots:[work]});
  assert.equal((await indexSlotReviews({db,repoRoot:root})).inserted,14);
  assert.equal((await indexSlotReviews({db,repoRoot:root})).inserted,0);
  const audit=getGateAuditReport({db});assert.equal(audit.entries.length,14);
  assert.ok(audit.entries.every(entry=>entry.gates.gate2.status==='PENDING'&&!entry.eligible));
  writeFileSync(join(root,source.path),'drift');
  await assert.rejects(indexSlotReviews({db,repoRoot:root}),/SHA mismatch/);
});
