import assert from 'node:assert/strict'
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { ROOT, materialize, PACKET, CANDIDATE } from './event133-application.mjs'

const fixture = async (root) => { for (const path of ['lore/editorial/Seoul-Scope-Contract.json','lore/editorial/Seoul-Narrative-Review.json','lore/chronology/Century-Annals.json','.omo/private/seoul-migration/event-disposition-proposal-v2-20261018']) await cp(resolve(ROOT,path),resolve(root,path),{recursive:true}); await cp(resolve(ROOT,`${PACKET}/owner-decision.json`),resolve(root,`${PACKET}/owner-decision.json`),{recursive:true}); return root }

test('event133 application preserves counts and rejects forged inputs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'event133-'))
  try {
    await fixture(root)
    const first = await materialize(root,{write:true}); const second = await materialize(root,{write:true})
    assert.equal(first.application.applied.events,133); assert.equal(first.application.applied.revisedBodies,24)
    assert.deepEqual(first.application.applied.counts,{active:1401,pending:0,retired:1642})
    assert.equal(first.application.preserved.previouslyActiveEvents,58)
    assert.deepEqual(first.application.source.bodies,second.application.source.bodies)
    const forged=structuredClone(JSON.parse(await readFile(resolve(root,`${PACKET}/owner-decision.json`),'utf8'))); forged.ownerDecision.messageRef='forged'
    await assert.rejects(()=>materialize(root,{ownerDecision:forged}),/E_OWNER_DECISION/)
    const identityPath=resolve(root,`${CANDIDATE}/identity-approval-body.json`); const identity=JSON.parse(await readFile(identityPath,'utf8')); identity.identityCorrespondences[0].anchor+='-위조'; await writeFile(identityPath,JSON.stringify(identity))
    await assert.rejects(()=>materialize(root),/E_PROPOSAL_BINDING:\/identity-approval-body\.json/)
    await cp(resolve(ROOT,`${CANDIDATE}/identity-approval-body.json`),identityPath)
    const bodyPath=resolve(root,`${CANDIDATE}/revised-body-proposal.json`); const bodies=JSON.parse(await readFile(bodyPath,'utf8')); bodies.decisions[0].ownerReadableChangeNote+=' forged'; await writeFile(bodyPath,JSON.stringify(bodies))
    await assert.rejects(()=>materialize(root),/E_PROPOSAL_BINDING:\/revised-body-proposal\.json/)
    await cp(resolve(ROOT,`${CANDIDATE}/revised-body-proposal.json`),bodyPath)
    const annalsPath=resolve(root,'lore/chronology/Century-Annals.json'); const annals=JSON.parse(await readFile(annalsPath,'utf8')); annals.content[5].text.ko+=' 위조'; await writeFile(annalsPath,JSON.stringify(annals))
    await assert.rejects(()=>materialize(root),/E_WRONG_BODY|E_REVIEW_SOURCE_HASH/)
    console.log('event133 focused tests: PASS')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
