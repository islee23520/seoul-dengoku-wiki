import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLICATION_EXACT_BODY_APPROVAL = Object.freeze({
  receiptPath: '.omo/evidence/fcd/approved-body-apply/receipt.json',
  receiptSha256: '857d84a1e693f120faf9b83612db06ce87e577ca11f28547fbd6d43f240f1df4',
  approvalPath: 'scripts/approved-document-bodies-20261023.json',
  approvalSha256: 'a774009ea295fe7de381590ca1cb00a99393bbe8265cb82eecad831ae80b1b78',
  manifestPath: '.omo/evidence/fcd/domain-proposal/manifest.json',
  manifestSha256: 'c11753202e39313d70d410e9621682171b2c94e808527100d5f2fe5bf80920c0',
});
export const PUBLICATION_EXACT_BODIES = Object.freeze({
  'lore/characters/Cast-Relations.json': Object.freeze({
    documentId: 'DOC:Cast-Relations', domain: 'characters', file: 'Cast-Relations.after.json',
    revision: '0befd45d2ddc810e39ef431dbe2a8d4632a349ddfec17626d6959889428a7842',
    predecessor: 'd0aee1c4ab12eb202c65d2b98e8cbae04b669d73dd2ce4ca83162fd983565acb',
    predecessorSemantic: 'd2c13b591fb376424fb4914b32822c1a96ab16fe5b5ebe7aecad318f6a7b214e',
    semanticSha256: '30c628a8f920d5ed98e0196f90f71100fb61b13e3ab2aaea0fba7f1aa351c388',
    byteSha256: 'a42b5fc1a265f1c61339f3ba81130f74cfe704394e479d676fca55e4f013b2b7',
    sourceSha256: '80cb4c4f38ba089621904adc347091f53891a76658f964507eb677414d052a07',
  }),
  'lore/offices/Offices-and-Ranks.json': Object.freeze({
    documentId: 'DOC:Offices-and-Ranks', domain: 'offices', file: 'Offices-and-Ranks.after.json',
    revision: '22acb2f7a5959a94e3c734d8abaf3b386c5ce42f726b8dd82c393e8c0d126e80',
    predecessor: '57dee91f3739def14183a2d378f5fadcd3b2812acc357004a7c158673c690442',
    predecessorSemantic: 'ccec975b94492c8bb8e7ce232a6a21d2da0cd3d15078401be3a22fd15ae83e37',
    semanticSha256: '85fd4951e1b8c20048c3f8523d85f70c6ef5a92c64e37dbdf98efd5168d05fcd',
    byteSha256: '5c0e6d9cb726946efd9db00ece503cef5985e532abd7a575aa0756b86d16aea8',
    sourceSha256: '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e',
  }),
});
export const ATLAS_DRAFT_APPROVAL = Object.freeze({
  logicalPath: 'lore/World-Narrative-Atlas.json',
  approvalPath: 'scripts/approved-atlas-affiliations-20261023.json',
  approvalSha256: 'c8dc75a69957a680221c6501fb2dbf67bad074576f73686edddb4d2ebcf9fc35',
  revision: '938b5651c1d0acf32647a5a0c489c8ae568026d06e3430c1b1b6675aa87d9e86',
  predecessor: '343cc396ce017934e15f863226b8b69c96a57bb7ee7d76cf650abed25b139dae',
  predecessorSemantic: '22e53460aba0b3f9a4a0b221b3c3b2437aa2f04ff355ae72bb9bcf68549dd7ad',
  semanticSha256: '16ab8236e117ee9ee697700e085e23ef5efcb786182b2f04d6c473088130e337',
  byteSha256: '423472bc2a7ce3a7aa719f15db60e00c68e66d8ad5d23816e2de1bb021214597',
  sourceSha256: 'e8314a0a65c2fbaa2db47f8388b11b931840b2d2b24a2aeeb6299815888ee32c',
});

export const PUBLICATION_SUCCESSOR_APPROVAL = Object.freeze({
  receiptPath: '.omo/private/seoul-migration/faction-consolidation-20261022/receipt.json',
  receiptSha256: '97b1d7dbd2631682b2214eb03a1478ef2085af2618d08739001ebe33cd2f8df3',
  decisionPath: 'scripts/approved-seoul-faction-consolidation-20261022.json',
  decisionSha256: 'd0378abb6ef9578a847c133247faabb06d758b968d35f1193b4e4feb83701c54',
  approvalRef: 'owner:seoul-faction-consolidation-20261022',
});
export const PUBLICATION_SUCCESSOR_HEADS = Object.freeze({
  'lore/characters/Cast-State-02.json': Object.freeze({
    revision: '69390d278551ed403ffda3bc5e1b785194f418a2c79c28a778c3e164521a9a3d',
    semanticSha256: '267c93362591269f26477dd6fbadd1a6d15922238b2439a7ab094f7fa9c0a7a8',
    sourceSha256: '2dd50da979a8b3f9d1f3a2123adc765a9e9d35eac2240f0e149aac187e3c33ea',
  }),
  'lore/characters/Cast-Unaffiliated.json': Object.freeze({
    revision: '0846f24df1c95b5ddbb2656e1bbb7617b0bb1ffd3c1980c11c4a34d80c7f77e0',
    semanticSha256: '0ebb4c3d9a774bb712a470da32fdf2b21d190913912b78922564a4e670cd04d1',
    sourceSha256: '5b1a3af2d7621c9ece2ae01bd9ec1878f2232c1e0b31db0df80798ad8f66829a',
  }),
  'lore/characters/Core-Characters.json': Object.freeze({
    revision: '3edea828b052e69596d35ba410929425b1870925f1ee5b4ad5c9fe72eb133a22',
    semanticSha256: 'a05f4bd6d9d0a246f1092d2b60ee7f0d0e5faf1ac151411e6bbfd6d7ecbcd905',
    sourceSha256: '911c7f9ca1a24d1c803a4c952ff972cc0482be74d6f277419b14734512e56dc4',
  }),
  'lore/factions/Sixteen-States.json': Object.freeze({
    revision: '1e7bcf057b554cf6b52ea50dd5645da515b0513f04a30adcb5f461e3af462474',
    semanticSha256: '8d43c418de8b4318240ea066ba0fdf9e75430e2723fbfa272d48653fb352f415',
    sourceSha256: '73b19e6af00df16fb06adfbaab7c386aea6930ff01587dd6a0dc69fbae557a3c',
  }),
  'lore/offices/Offices-and-Ranks.json': Object.freeze({
    revision: '57dee91f3739def14183a2d378f5fadcd3b2812acc357004a7c158673c690442',
    semanticSha256: 'ccec975b94492c8bb8e7ce232a6a21d2da0cd3d15078401be3a22fd15ae83e37',
    sourceSha256: '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e',
  }),
});


export function authenticateAtlasDraftApproval() {
  const pin = ATLAS_DRAFT_APPROVAL;
  const bytes = readFileSync(new URL(`../../${pin.approvalPath}`, import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== pin.approvalSha256) throw Error('E_ATLAS_DRAFT_APPROVAL');
  const approval = JSON.parse(bytes);
  if (approval.kind !== 'owner-exact-atlas-draft-approval' || approval.status !== 'approved-for-typed-draft-application'
    || approval.documentId !== 'WNA-001' || approval.predecessor !== pin.predecessor
    || approval.byteSha256 !== pin.byteSha256 || approval.semanticSha256 !== pin.semanticSha256)
    throw Error('E_ATLAS_DRAFT_APPROVAL');
}

export function authenticateExactBodyApproval(root, readBytes = readFileSync) {
  const proof = PUBLICATION_EXACT_BODY_APPROVAL;
  const readPinned = (path, sha256) => {
    const base = path === proof.approvalPath ? fileURLToPath(new URL('../../', import.meta.url)) : root;
    const bytes = readBytes(resolve(base, path));
    if (createHash('sha256').update(bytes).digest('hex') !== sha256) throw Error('E_PUBLICATION_EXACT_BODY_APPROVAL');
    return JSON.parse(bytes);
  };
  const receipt = readPinned(proof.receiptPath, proof.receiptSha256);
  const approval = readPinned(proof.approvalPath, proof.approvalSha256);
  const manifest = readPinned(proof.manifestPath, proof.manifestSha256);
  if (approval.actualUserAnswer !== 'approve_pending_bodies: 두 본문 승인 (Recommended)'
    || approval.voteEvidence?.event !== 'required-exact-body-approved-resume' || approval.voteEvidence.line !== 466
    || receipt.approval?.sha256 !== proof.approvalSha256 || approval.proposalManifestSha256 !== proof.manifestSha256)
    throw Error('E_PUBLICATION_EXACT_BODY_APPROVAL');
  const bodies = new Map();
  for (const [logicalPath, pin] of Object.entries(PUBLICATION_EXACT_BODIES)) {
    const row = manifest.documents.find(row => row.logicalPath === logicalPath);
    const vote = approval.documents.find(row => row.id === pin.documentId);
    const applied = receipt.result.find(row => row.documentId === pin.documentId);
    if (row?.sourceArchiveSha256 !== pin.sourceSha256 || row.after?.byteSha256 !== pin.byteSha256
      || row.after?.expectedStoredSemanticSha256 !== pin.semanticSha256 || row.predecessorRevision !== pin.predecessor
      || vote?.byteSha256 !== pin.byteSha256 || vote.semanticSha256 !== pin.semanticSha256 || vote.predecessor !== pin.predecessor
      || applied?.revision !== pin.revision || applied.previousRevision !== pin.predecessor || applied.semanticSha256 !== pin.semanticSha256)
      throw Error('E_PUBLICATION_EXACT_BODY_APPROVAL');
    bodies.set(logicalPath, readPinned(`.omo/evidence/fcd/domain-proposal/${pin.file}`, pin.byteSha256));
  }
  return bodies;
}

export function authenticateFactionSuccessorApproval(logicalPath) {
  const proof = PUBLICATION_SUCCESSOR_APPROVAL;
  const root = process.env.PUBLICATION_NEW_BODY_ROOT ?? fileURLToPath(new URL('../../', import.meta.url));
  const receiptBytes = readFileSync(resolve(root, proof.receiptPath));
  const decisionBytes = readFileSync(new URL(`../../${proof.decisionPath}`, import.meta.url));
  if (createHash('sha256').update(receiptBytes).digest('hex') !== proof.receiptSha256
    || createHash('sha256').update(decisionBytes).digest('hex') !== proof.decisionSha256) throw Error('E_PUBLICATION_SUCCESSOR_APPROVAL');
  const receipt = JSON.parse(receiptBytes), decision = JSON.parse(decisionBytes);
  if (receipt.schema !== 'faction-consolidation-successor.v2'
    || receipt.authority.approvalRef !== proof.approvalRef || decision.approvalRef !== proof.approvalRef
    || receipt.files.filter(row => row.sourcePath === logicalPath).length !== 1) throw Error('E_PUBLICATION_SUCCESSOR_APPROVAL');
}
