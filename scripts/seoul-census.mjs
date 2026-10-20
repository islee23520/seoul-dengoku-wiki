import { readFile } from 'node:fs/promises'
import { AsyncLocalStorage } from 'node:async_hooks'
import { resolve, dirname, posix, relative } from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify, isDeepStrictEqual } from 'node:util'
import { BASELINE_SHA256, ENTITY_SETS, KINGDOM_SUCCESSOR_BINDING, TECHNICAL_DOCUMENT, approvedKingdomGeography, baselineDocuments, coverageKey, materializeRetiredRightsDispositions, repositoryControl, rightsTransitionTargets, sha256 } from './seoul-scope.mjs'
import { headingId, renderLoreMarkdown } from './lore-json-render.mjs'
import { materializePersonReviewReconciliation } from './seoul-person-review-reconciliation.mjs'
import { authenticateNationalDressAdmission, NATIONAL_DRESS_PATH, NATIONAL_DRESS_DIRECTORY, nationalDressPreservationReceipt, validateNationalDressExtraction } from './national-dress-admission-successor.mjs'
import { authenticateMainDocAdmission, mainDocPreservationReceipt, validateMainDocExtraction } from './main-doc-admission-successor.mjs'
import { BATCH_ID as DOC247_BATCH_ID, RECEIPT_PATH as DOC247_RECEIPT_PATH, RECEIPT_SHA256 as DOC247_RECEIPT_SHA256, authenticateClosureReceipt } from '../.omo/private/seoul-migration/doc247-mechanical-20261019/materialize.mjs'
import { BATCH_ID as DOC247_RECEIPT_WAVE_BATCH_ID, RECEIPTS_PATH as DOC247_RECEIPT_WAVE_PATH, authenticateReceiptWave } from '../.omo/private/seoul-migration/doc247-receipt-wave-20261019/materialize.mjs'
import { BATCH_ID as PROJECTION_REFRESH_BATCH_ID, DIRECTORY as PROJECTION_REFRESH_DIRECTORY,
  EXPECTED as PROJECTION_REFRESH_EXPECTED, materializeProjectionRefresh } from './projection-refresh-successor.mjs'
import { authenticateRepinSuccessor, materializeOfficesPredecessor } from '../.omo/private/seoul-migration/doc247-repin-20261019/materialize-repins.mjs'
import { BATCH_ID as ATLAS_FIX_SUCCESSOR_BATCH_ID, DIRECTORY as ATLAS_FIX_SUCCESSOR_DIRECTORY,
  materializeAtlasFixSuccessor } from '../.omo/private/seoul-migration/doc247-atlas-fix-20261019/materialize-successor.mjs'
import { BATCH_ID as DOC247_FINAL_BATCH_ID, RECEIPTS_PATH as DOC247_FINAL_RECEIPTS_PATH,
  SUCCESSOR_PATH as DOC247_FINAL_SUCCESSOR_PATH, authenticateFinalClosure } from '../.omo/private/seoul-migration/doc247-final-closure-20261019/materialize.mjs'
import { DIRECTORY as FINAL_FIVE_DIRECTORY, REVIEWED_AT as FINAL_FIVE_REVIEWED_AT, SOURCES as FINAL_FIVE_SOURCES,
  authenticateFinalFive } from '../.omo/private/seoul-migration/publication-final-five-20261019/materialize.mjs'

// Census metadata is private, not an authored page or an admission decision.
export const CENSUS_PATHS = ['lore/editorial/Seoul-Relocation-Ledger.json', 'lore/editorial/Seoul-Narrative-Review.json', 'lore/editorial/seoul-narrative-census-events.json']
// Only independently approved exact document-review receipts belong here.
// Source-registration and application receipts are not publication authority.
const APPROVED_DOCUMENT_REVIEW_RECEIPTS = Object.freeze([
  { path: '.omo/private/seoul-migration/post67-rebind-20261015/sixteen-states-publication-review-v3.json', sha256: '1b2843137ea67733db4e32ac82f9e073bdf0cab838569129228871e518092ed7' },
  { path: '.omo/private/seoul-migration/post67-rebind-20261015/water-five-publication-review-v2.json', sha256: '180414a00e8050cf0cef752b60d0de05cdc150e305b6212c531069386aaa24d4' },
  { path: '.omo/private/seoul-migration/four-reviewed-documents-admission-20261015/publication-review.json', sha256: '354b33fea9d477c16ecce10f78f6d42d978a2532cd3a5988be76a2038d96ac8e' },
  { path: '.omo/private/seoul-migration/publication-v4-receipts-20261015/publication-review.json', sha256: 'e0bb10286049bfd35807da5303832028238350f13f65521a34b15fa158a81447' },
  { path: '.omo/private/seoul-migration/post108-eight-document-application-20261018/publication-review.json', sha256: '9192c69dca7ba4598ab1367c3ec124bc78b727e06a4eb2e73962e2b91d5b7671' },
])
const TWO_SOURCE_REBIND_PROOF = {
  path: '.omo/private/seoul-migration/post67-rebind-20261015/two-source-technical-review-v1.json',
  sha256: '766f89b812d4a4d6a0dec12bddc9396891319357498c6df7a12f72c1c314db83',
}
const SINGLE_DOCUMENT_REVIEW_PROOF = {
  path: '.omo/private/seoul-migration/sixteen-states-fullbody-combined-review-v2-20261015.json',
  sha256: '3e68bc8700daade8f63ed90e19263fa33702da09f9cae16051f9980f93b3d2ed',
}
const STABLE_THREE_SOURCE = {
  id: 'stable-three-exact-repair-40',
  directory: '.omo/private/seoul-migration/stable-three-source-application-20261015/',
  prefixSha256: 'e020df499f1cffe67903102925b6eb00f72a9bb59e188ee7d68b948a30e8c060',
  packetSha256: 'aa5674adf619f1febabb057662e76ff0b317ba4d4c927b125976ded7cbc9e340',
  manifestSha256: '105255527ef8c82bf68da78cf93c7c1123df665dc1c3e1b7cb4c2064197b6ec7',
  archiveSha256: ['9bd201dfa6db9130a5526e7aeb6f51b4db6a9a6101f8c8dc598f50542bea6fad',
    '3557d03bd8482df524d94e8d40c0a23f4b1c460f7410936e9b2462bfa82712eb',
    'e9bbb451b15c5f77152cd2ac31f085a92073a24be3a02d15bc5076bbb975a305'],
  proposalSha256: 'a23dcf4d039dff878cc99b27fee3fa8dcd71cdf78cece8960d9f135f57e2f963',
  independentSha256: '389d23cf6b442433783c3821dbfd4a9fc0d391ed11399d07a8ddd41e0c5714a9',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
  boundarySha256: '2da30cd35044a3397676dcfb1d8a5de7fb014082253510f8cae9bbacc5efbc96',
}
const VASSAL_CODE_SUCCESSOR = {
  id: 'vassal-validator-code-successor-1',
  directory: '.omo/private/seoul-migration/vassal-code-successor-20261015/',
  prefixSha256: 'c7835efcd8979462207a188b84a6c40b2de6e93e1974df2a63a2f5afe53767d0',
  packetSha256: '7cc126bca7443f9c9d534fe02e29e8766bb0d0903545f23ee7ee0612d7542ddd',
  manifestSha256: 'f4f039199b055505784fd858b6dee7c9161ff124a4663830c9796cd294549cc7',
  beforeSha256: '6793edf871996e6c8a21b6250b4cdcfe3b4101b5ca81e719bcdbf76b3eb36a13',
  afterSha256: 'b76cc033b57b745e310f7d5b34f9129bca5615905624d00e07d25ceede489b90',
  reportSha256: '74d4075ac25ae633e0660550980260c0684f0f2ecf340f9df59f0a030929b0af',
  testSha256: 'd59705735e299d8db659d0ed69de541c1aaacfefe58ace8bd922e3f0eafd51ad',
  beforeArchiveSha256: '8990009f9eb914d0d248feda9f25bea5c9d01db0da566e3c08e1148d809fbd0f',
  afterArchiveSha256: 'ec946db9d4c16bd885ff49b3436795c9520325ed3ae202666962545522dd647d',
}
const HOUSEHOLD_PROJECTION_SUCCESSOR = {
  id: 'household-known-link-projection-2',
  directory: '.omo/private/seoul-migration/household-projection-successor-20261015/',
  prefixSha256: '82d45fc42c75de324892663f439868b3412ede6a8bcd11b41b0d39bc185a35d1',
  packetSha256: 'ba079b1f1330727f13ea12093dffb21d96029c9281b25a8b43237ad7cdf10f4c',
  manifestSha256: 'f2c8198c56c9d0484d8eac38686e3f49d1618bf206f0c5ae343f1f1c645058bf',
  reviewSha256: '7f76d7879489d7b1ab744f695710e8c50560521a59b1dab937eeb56bb5318086',
  beforeSha256: '16f403e684f02b9c14878f0f703b3f21ca3b32b3bb9d69e1308a47cd9caca70f',
  afterSha256: '6371cc818eb8149874664eefdd2742502b1e704817cbf3a080a6ead5bb76fc7f',
  beforeArchiveSha256: '29cc26529a9e9d6c8ff8bddebfcc83c66f5a5f55586e021381c2ad566c0bde06',
  canonicalSha256: '80cb4c4f38ba089621904adc347091f53891a76658f964507eb677414d052a07',
}
const CORE_SIX_SOURCE = {
  id: 'core-six-reviewed-source-application-6',
  directory: '.omo/private/seoul-migration/core-six-reviewed-source-application-20261015/',
  prefixSha256: '2a04a4463c5bc60ad763d525bbd124ee80ab6c447d6b9ddc91e97f7bbd49757a',
  packetSha256: '1798a08088f2a9e435ee391e4b1e6d294931892ae32fb5ab067818d943865ee9',
  manifestSha256: '584cde943333ad2b6a413a239d80a3e90c50cd786e01057b14c0af8f0ffad0b0',
  archiveSha256: 'aae8308bb21c40b03add88ccb3e600371bff0c50e523f6354faff5576272306f',
  beforeSha256: 'f3e6563596901ff49a7c0fce30372ee88f7185342b7692a2f0979971d1066b8f',
  afterSha256: 'aaa2369d02cd4979bf75152f13f8871f689dad081a3b46c520da9bc4d8b03ee8',
  proposalSha256: 'a7318144f1b5a24c93d0507b3bee70c72cf4d085c2b23064cb1d3bf216597467',
  correctionSha256: 'bdadf8284449a905f78f702d0148a5d0d17bd65ba21e50f5623e0e1e68f2dcac',
  independentSha256: '02d151fb7415701fcb8a6f0e434e164e9cc1a6ee1dd0f60b3f0332f08e131b33',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
}
const PUBLICATION_V4_SOURCE = {
  id: 'publication-v4-two-source-application-32',
  directory: '.omo/private/seoul-migration/publication-v4-source-application-20261015/',
  prefixSha256: 'aa1685b9da7abab2b0220a8c415c5f5190136a7b820bb28eeb979f312a7b7d59',
  packetSha256: '8c0b0e271b464c8ffa508565362840e75a0d5b56fb1e4cac6299de30bbc3f86c',
  manifestSha256: '7e171f8401467563589c8ae4d44ba90138f78e13c4e8c600e60455c597561113',
  proposalSha256: 'fe2a18882ef8a607e1144364e88ad5c07ed6204a924f3e256b6b147b417cafa4',
  correctionSha256: '2042700623964ae6926d7debbe45a406876950009a19fc7e929f05d5eb59d44e',
  independentSha256: 'd7f98539d34f6821448c25d8743ea1a86a70dee3dcf259735f232404ef8645d4',
}
// Successor to publication-v4 (and the earlier Structures/Oral-Stories pins)
// registering the 14 reviewed direct-link retargets from the 2026-10-17
// publication direct-link review. Link-run replacements only; every other
// byte is replay-verified against per-file immutable before archives.
const LINK_RETARGET_SOURCE = {
  id: 'publication-link-retarget-source-application-14',
  directory: '.omo/private/seoul-migration/publication-link-retarget-application-20261017/',
  prefixSha256: '7da87b85dc8673b2a4667794cb064d2f845fe19d54e64e1774aa9db8894af312',
  packetSha256: '72b4a211e8f7d131e9307f31a4e7aa67c5123f011e4812d581108edc975e9de7',
  manifestSha256: '937c16c7942b914fff11d71414a4b4391af68e3782f958fe462a7c5cd8e9f2d8',
  reviewSha256: '9f54a9a435d6e48650cb11671ed6cd025d84b5975fbf0d1b011f4d82a67277c7',
  noteSha256: 'ada6fcff6e2f3672cf5d23c6d36b32b6c3ccfced5881f7999b1958e849df03d8',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
  sources: {
    'lore/ailments/Ailments.json': { predecessor: PUBLICATION_V4_SOURCE.id, beforeSha256: '135e0544d43bf168ce8895b37b3712311c85ee59b1d0e51b4df228d7c48166b1', afterSha256: '39068d17ad6b75a99b090ea55221e070a75fd5ef5563074b4a291b711f00d83d', beforeBytes: 30335, afterBytes: 30400, operationCount: 4 },
    'lore/culture/Food-Culture.json': { predecessor: PUBLICATION_V4_SOURCE.id, beforeSha256: '305f1f44b4e287631ff193b9075082719de4217337ec7647254b7b4538fb7967', afterSha256: '3fad5ccac8bb5018b66734dccf737a64c6ee4ded1e2f41105c445d2a4ce6a6a5', beforeBytes: 29039, afterBytes: 29106, operationCount: 3 },
    'lore/structures/Structures.json': { predecessor: 'water-five-authoring-status-5', beforeSha256: 'd4c420c2bfa3d0c8b43ae7d59538abc943e957a7a3b77628e4df9abc75092c17', afterSha256: '32d3bc81f851da241b6a5f99fc6c17cccb9a63c2168d07eac823cd8dbba3357b', beforeBytes: 35746, afterBytes: 35837, operationCount: 5 },
    'lore/culture/Oral-Stories.json': { predecessor: 'owner-recommendations-articles', beforeSha256: '338f4e45df7329b7a0e5e2e2d8a98b0a066f9789c48156c138150258be5b7a87', afterSha256: '7951686e8edebc445831f034b5e5e3667051eeef5ca552c461418878b5227631', beforeBytes: 16709, afterBytes: 16767, operationCount: 2 },
  },
}
// English-parity successor to the link retarget: the 14 English twin runs of
// the same reviewed retargets, chained on the Korean batch's after bytes.
const LINK_RETARGET_EN_SOURCE = {
  id: 'publication-link-retarget-en-source-application-14',
  directory: '.omo/private/seoul-migration/publication-link-retarget-en-application-20261018/',
  prefixSha256: '8db58bf591c422867c5e9553cb057b184e446e84885c38ab8f2f5085a533d856',
  packetSha256: 'fe2872a34b124c5ebacf54a065a5aef283338e5e3c9a965e09ac7afd6d717688',
  manifestSha256: '40a98278a1a2369b83e71515316fdac837865ba3b4b210eac34bbc2fe9c8b3d3',
  reviewSha256: '9f54a9a435d6e48650cb11671ed6cd025d84b5975fbf0d1b011f4d82a67277c7',
  noteSha256: 'ada6fcff6e2f3672cf5d23c6d36b32b6c3ccfced5881f7999b1958e849df03d8',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
  sources: {
    'lore/ailments/Ailments.json': { beforeSha256: '39068d17ad6b75a99b090ea55221e070a75fd5ef5563074b4a291b711f00d83d', afterSha256: '97c45e90079bc80313df54e3eaaf9349c09e494a64d5400fa689c5c69ecd458a', beforeBytes: 30400, afterBytes: 30498, operationCount: 4 },
    'lore/culture/Food-Culture.json': { beforeSha256: '3fad5ccac8bb5018b66734dccf737a64c6ee4ded1e2f41105c445d2a4ce6a6a5', afterSha256: '6d05509d7ff14ae7257d4b23b0b80920c2d16479c2eb5a20a21d911159c82919', beforeBytes: 29106, afterBytes: 29195, operationCount: 3 },
    'lore/structures/Structures.json': { beforeSha256: '32d3bc81f851da241b6a5f99fc6c17cccb9a63c2168d07eac823cd8dbba3357b', afterSha256: '43d49a7bd418d3a6414f25c947cb83899b1f46a52a4a6528fe6488b681fed1d0', beforeBytes: 35837, afterBytes: 35970, operationCount: 5 },
    'lore/culture/Oral-Stories.json': { beforeSha256: '7951686e8edebc445831f034b5e5e3667051eeef5ca552c461418878b5227631', afterSha256: '0d8ee1a26b05f74f48453a2eb9835ba4c4851344fbae0a509df425bb6a6ecc65', beforeBytes: 16767, afterBytes: 16842, operationCount: 2 },
  },
}
// Owner-decided link tidy (2026-10-18, owner-link-tidy-decision-20261018.md):
// the last pending-document citations from active documents are retargeted,
// unlinked or removed across seven files. Chained on each file's registered
// predecessor after bytes.
const OWNER_LINK_TIDY_SOURCE = {
  id: 'owner-link-tidy-source-application-31',
  directory: '.omo/private/seoul-migration/owner-link-tidy-application-20261018/',
  prefixSha256: '4213dfdfe5ed2669afae1565ab491961636197066c2800178e2bc0c908d49106',
  packetSha256: '2eb58c87680e232cadee0400b040045a7724a0866c8621e86c8962d3cb31db6a',
  manifestSha256: '97eea455116a11cb575f343804fa868cf31ac6294cf374506011661ad76a9f21',
  decisionSha256: '91de2e76d7a0fa072a5f534f25e7ded0a5ea606aa95b6eff07947bb85b1511ef',
  reviewSha256: '9f54a9a435d6e48650cb11671ed6cd025d84b5975fbf0d1b011f4d82a67277c7',
  noteSha256: 'ada6fcff6e2f3672cf5d23c6d36b32b6c3ccfced5881f7999b1958e849df03d8',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
  sources: {
    'lore/ailments/Ailments.json': { beforeSha256: '97c45e90079bc80313df54e3eaaf9349c09e494a64d5400fa689c5c69ecd458a', afterSha256: 'f59de68e304838733e80ca21e27c0cc6b1415be21bb01cc6d1a13f69865ddeb7', beforeBytes: 30498, afterBytes: 30242, operationCount: 2 },
    'lore/culture/Food-Culture.json': { beforeSha256: '6d05509d7ff14ae7257d4b23b0b80920c2d16479c2eb5a20a21d911159c82919', afterSha256: 'f75a0713756b08b40d6ab6182c5d6b61ffefd8b85c960e55507c427d73af6bec', beforeBytes: 29195, afterBytes: 28447, operationCount: 3 },
    'lore/culture/Oral-Stories.json': { beforeSha256: '0d8ee1a26b05f74f48453a2eb9835ba4c4851344fbae0a509df425bb6a6ecc65', afterSha256: '3ae3b24785af8aaee59649bfea9961f90a928c130f8dd777da96dd47fd2cc479', beforeBytes: 16842, afterBytes: 16350, operationCount: 1 },
    'lore/characters/Characters-Factions-and-Professions.json': { beforeSha256: 'ab864f148c15d7388ccc46095df57cbb8a84fd88e1f77c89bac3c2335470b861', afterSha256: '994bf6f18fff5af6a33d101e88759265a73d3dee962f357c1bcca74bcbef5dd7', beforeBytes: 22948, afterBytes: 23404, operationCount: 9 },
    'lore/characters/Cast-Corridors-Index.json': { beforeSha256: 'cd30c207373ef91c1851490efeccfeb12b645a282fcc1634b8397dc8dde69c15', afterSha256: 'f5559d94c835634960ad7b88e7b9fdfdc2995df81efd763658f5aeba3c142917', beforeBytes: 7375, afterBytes: 6905, operationCount: 1 },
    'lore/goods/Era-Arms-and-Tech-Level.json': { beforeSha256: '19924df793a4ceb5605dc2bef48601ce2d3a549242a7afa3ac7f6f7408f5f2c7', afterSha256: '280c9d53b58233657e961d85a79f371ded40777ef0f965a294656dcbb4da8480', beforeBytes: 44118, afterBytes: 44139, operationCount: 2 },
    'lore/places/World-Map-Construction.json': { beforeSha256: 'b267ef9b000c16dfbde49e9ef75ac73fc5cbffdc9ea3d2b6e43780b90c30d5ea', afterSha256: 'a3815958f1b467c56da44384bbc641ec80dd8dd5f25f6fb9c4a567d126b2f578', beforeBytes: 27644, afterBytes: 27678, operationCount: 4 },
    'lore/structures/Structures.json': { beforeSha256: '43d49a7bd418d3a6414f25c947cb83899b1f46a52a4a6528fe6488b681fed1d0', afterSha256: 'a95b4d1ea1ed556ab96d952a03e44140de48093c055f95df6561d1334586441a', beforeBytes: 35970, afterBytes: 35754, operationCount: 10 },
  },
}
const POST108_EIGHT_DOCUMENT_SOURCE = {
  id: 'post108-eight-document-source-application-31',
  directory: '.omo/private/seoul-migration/post108-eight-document-application-20261018/',
  prefixSha256: '9ab1f8315e26b63cb4530be379f3b250a89acb97a7f95cca00338e15be047da9',
  packetSha256: 'e286d3a25283b7d4a499dea1f5b5ac96e1133dc7c7429511a8e2f3ba95c478d1',
  manifestSha256: 'bf3969f8979123ed3b3ef768149f543765ab7fdb5bde3fbe112852cf36fcf91f',
  reviewSha256: '9192c69dca7ba4598ab1367c3ec124bc78b727e06a4eb2e73962e2b91d5b7671',
  reviewSourceSha256: '1b5873bddff368559fdcc7df40344f09f376b3ad7270292fade268d9bdc9c59c',
  reviewMarkdownSha256: 'afb2ab373cf73b5a77eb7b6b4d042cc674115dfdba08f81451ed0f1e7336ec4f',
  candidateSha256: '8c26602b84ba79b0ddc13bd5a82c495fb6bc155aada2bda4216fdfe72a8e52e1',
  sources: {
    "lore/ailments/Ailments.json": {
        "beforeSha256": "f59de68e304838733e80ca21e27c0cc6b1415be21bb01cc6d1a13f69865ddeb7",
        "afterSha256": "e03e7495ba5536acaa1e5ddff169b43032e1816303336217836549bd9c34abc5",
        "beforeBytes": 30242,
        "afterBytes": 29754,
        "operationCount": 4,
        "changed": true
    },
    "lore/culture/Food-Culture.json": {
        "beforeSha256": "f75a0713756b08b40d6ab6182c5d6b61ffefd8b85c960e55507c427d73af6bec",
        "afterSha256": "99726219d5d50f3a2d8fb08365c5b3e9ace5a3f4ae87c0cacd333fb5df8f891c",
        "beforeBytes": 28447,
        "afterBytes": 27928,
        "operationCount": 4,
        "changed": true
    },
    "lore/culture/Oral-Stories.json": {
        "beforeSha256": "3ae3b24785af8aaee59649bfea9961f90a928c130f8dd777da96dd47fd2cc479",
        "afterSha256": "32f8922c625f472a2d29ae996a8d518771854879c75eaa8e340cc094b84eb265",
        "beforeBytes": 16350,
        "afterBytes": 15280,
        "operationCount": 2,
        "changed": true
    },
    "lore/characters/Characters-Factions-and-Professions.json": {
        "beforeSha256": "994bf6f18fff5af6a33d101e88759265a73d3dee962f357c1bcca74bcbef5dd7",
        "afterSha256": "9123f6a6fb75ca5810652687d2fdbab28c27b8909984847e394b406ede7c3f1f",
        "beforeBytes": 23404,
        "afterBytes": 22036,
        "operationCount": 3,
        "changed": true
    },
    "lore/characters/Cast-Corridors-Index.json": {
        "beforeSha256": "f5559d94c835634960ad7b88e7b9fdfdc2995df81efd763658f5aeba3c142917",
        "afterSha256": "f5559d94c835634960ad7b88e7b9fdfdc2995df81efd763658f5aeba3c142917",
        "beforeBytes": 6905,
        "afterBytes": 6905,
        "operationCount": 0,
        "changed": false
    },
    "lore/goods/Era-Arms-and-Tech-Level.json": {
        "beforeSha256": "280c9d53b58233657e961d85a79f371ded40777ef0f965a294656dcbb4da8480",
        "afterSha256": "14ae87324392aabaeb137f0d5e320004f42a6e2942c9680af080f9fffa62f665",
        "beforeBytes": 44139,
        "afterBytes": 43656,
        "operationCount": 1,
        "changed": true
    },
    "lore/places/World-Map-Construction.json": {
        "beforeSha256": "a3815958f1b467c56da44384bbc641ec80dd8dd5f25f6fb9c4a567d126b2f578",
        "afterSha256": "48b5ac4c516a65058cb36980aedb8d138c8d4a615601e3c6f3d5c0f25b048ebe",
        "beforeBytes": 27678,
        "afterBytes": 26235,
        "operationCount": 13,
        "changed": true
    },
    "lore/structures/Structures.json": {
        "beforeSha256": "a95b4d1ea1ed556ab96d952a03e44140de48093c055f95df6561d1334586441a",
        "afterSha256": "caed5524d6cb5cd1c84cf48e824c2c3154abba32021728443b596a7fbe222ce5",
        "beforeBytes": 35754,
        "afterBytes": 34423,
        "operationCount": 4,
        "changed": true
    }
  }
}
const PROJECTION_REFRESH_SOURCE = {
  id: PROJECTION_REFRESH_BATCH_ID,
  directory: PROJECTION_REFRESH_DIRECTORY,
  packetSha256: '4645f49cee3371aceaa5083cc76ab4af09d8425b2f5d724591deca1440a002d9',
  manifestSha256: 'c1e65d339361898f6ddecb886cce833992ead64d399dd6e669aa871c58e21dc9',
}
const S01_REVIEWED_SOURCE = {
  id: 's01-reviewed-source-application-115',
  directory: '.omo/private/seoul-migration/s01-reviewed-source-application-20261015/',
  prefixSha256: '75b4bd31f635ff65f40b8c2d765ab4e2d2c384dd16a584474927e69da3e8ca79',
  packetSha256: 'f3cfe1d45c8b2e624404b0756bd47ef229efca74254ff56e40579dd3142ecae4',
  manifestSha256: '2e4cbf9acd5be08cbe51355ecf61f326c5dfc523514789a482e13aa0c44df92a',
  archiveSha256: 'f458cc6e5b9aed15dab96165b400ca8433899129b6a5e60605dab71578404786',
  proposalSha256: 'e6725760983f7d2ee13f06aad9367c77515031e1a69cba51b06cff5d91a0aedd',
  reviewSha256: 'b07a6b84447ecadc3f92955c6f4d377681abf05bdaa70b2b55689140736160ac',
  pinSha256: '64317fb0e728df41bde6a01d0959feada5be25ed756484e3f60e6bc1d4f5b98f',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
  beforeSha256: 'f92d0d2d5d2d3e7991bdc31d1f5fc10f010e7c978d00d2f828c8934c2474de1a',
  afterSha256: 'e0e3f8ab91b39c641e88abf96e31fbf292b5a04e3f2e7335f97601595919ad5e',
}
const CORE_FOUR_SOURCE = {
  id: 'core-four-reviewed-source-application-39',
  directory: '.omo/private/seoul-migration/core-four-reviewed-source-application-20261016/',
  prefixSha256: 'f83117423e3f403b7d4b92d02bc5342c640e4f069d23018eebc9e526607bf8b2',
  packetSha256: '89bac43ccce04cd1cede0264e14acb221bb0a27d7e2576ce28de51e33682374f',
  manifestSha256: 'db782db224c77f9b5c26e4dce58abe0c3acb49f5f1dfac23667ae7390b35efa9',
  archiveSha256: '3fb4de9afe57862a0cce58ee9aef55973e610b12bf2c86ad0bd2c57624d97d50',
  proposalSha256: '317e955ae3c7136cd1d33c651ce8e0bfbee3009cf17388ad43ea60c353549f75',
  correctionSha256: 'dabbfe62d9d3f314dd82e6baab8b578b5138a2c29719d55edfdf5e10e0ab88e0',
  independentSha256: 'f4673fed6c45ce146a9c5e59e158a89be72c7919cceba1136c0b3aeb9d25f759',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
}
const ATLAS_V5_SOURCE = {
  id: 'atlas-v5-reviewed-source-application-1365',
  directory: '.omo/private/seoul-migration/atlas-v5-source-application-20261016/',
  proposalDirectory: '.omo/private/seoul-migration/atlas-current-causal-repair-v3-20261015/',
  prefixSha256: 'dc64d4846cab2b8812bafa59a481e68fe72533ce9bc96b27c2eac198ffd4f900',
  packetSha256: '9151dc377a8065a565f00f1a24dd427e725d4bd7fbb0b1baf4b1c5e97429d90a',
  manifestSha256: 'ed11ae0ba5301892fea927d0653356331596f30568c92a385d552bca2da78ddd',
  archiveSha256: 'caf52d026d2311cd03da55a985508191ff1fdc948839d75b9deea8374154b0c7',
  proposalSha256: '96a02b97fcb92dbb4e904024acdad700e79c8ca0a8556e70ed79c3370c40b4bd',
  correctionV4Sha256: '0db4f8f6e66779f77166cb53a5942d2f3a6a4f28284b73fbae593196d021b978',
  correctionV5Sha256: 'e7676b3785bb6b883d3b8a83e02e8fc0d2ad4eba8c70b8ca97617696959cd47d',
  independentSha256: '251feeb0b0dd6f14e5713323936506b319a319a8ac0ce4208ce313e45d348213',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
  beforeSha256: 'b88742a01eabe2139dfd86813cffe42cc09f15f35e0f8299c60dbfb2b463387a',
  afterSha256: 'c5bb0c8263e8723857e3b10653789929abac87ab592bd4771266b375898d0596',
}
const ATLAS82_SOURCE = {
  id: 'atlas82-groups-index-source-application-406',
  directory: '.omo/private/seoul-migration/atlas82-groups-index-source-application-20261016/',
  prefixSha256: 'c6c44a8896ade384cdaafef22257ba82be6ade847699babe9260c78a3cedd138',
  packetSha256: 'a38eb58b1785a0d28c2a5e5483aa1123d3824763344f46dbef47f09a08a6b219',
  manifestSha256: 'ae981ef0842a4d30ee48f680794faa7c13ed8623b1b55546bad6984fa613adaa',
  archiveSha256: '9ef2b254fc9b6a785523cc4465e3637c80ecf6079c1d71901b4585077aa58917',
  inputSha256: '22ea3f71f09b57e38fb3d9d8eb0c2b99028c64dd869baea6d70c4d6ec8f924b9',
  reviewSha256: '1c5e13052ad8132ad778d383be56b1a627513e0c921f23f9d836f5e326f454b9',
  compositeSha256: '6653e2fda36b336917858275a4c36769a235b8ed119ca5446deb1b5e3d8f3c8c',
  beforeSha256: 'c5bb0c8263e8723857e3b10653789929abac87ab592bd4771266b375898d0596',
  afterSha256: 'e0629757dda584b773a4c4589c1c91be12efd2494ad3ba6cd3ba8ceb2263e8e7',
}
const ATLAS83_SOURCE = {
  id: 'atlas83-four-track-source-application-334',
  directory: '.omo/private/seoul-migration/atlas83-four-track-source-application-20261016/',
  prefixSha256: 'a983a153a593d7fe7277287dd2aae8506b755dd4883237abffc36c026227a245',
  packetSha256: '6111e6a2dd2a87ed1c27e7fb95b65bcff4d75306f1375d6ce43c928d779d38f1',
  manifestSha256: 'c0d43ad422f224e872618515d8abd8cb52be0ab41047836e907da1178e420b2d',
  archiveSha256: 'f1b7758a12ade111b804a936387ab33db3e63b6aec6952e061ceb8548293ce25',
  inputSha256: '01fe3df2eb969a37902cf1bcc1871bca3fd93ef1348555145c78f1d8005effb2',
  beforeSha256: ATLAS82_SOURCE.afterSha256,
  afterSha256: 'ebb14a41baf48b45efd6bff7ca9bb97ff6a6f713fa18ddea4ff60fd5b4614f43',
}
const RENDERER_HEADING_SUCCESSOR = {
  id: 'renderer-heading-code-successor-1',
  directory: '.omo/private/seoul-migration/renderer-heading-successor-20261016/',
  prefixSha256: 'c2efd8bafb63f21f7a3b0c5191bbad68adf5e7129caa7ee31ecf019104c8ec9c',
  packetSha256: '90edb1f178efc775295240e7e6ac1903f0afd8c0244bafb4077c8181846e2819',
  manifestSha256: '8a17400749a0b74d36ad5a8c152b0f3ea38a211c37fe831eb03578285342e43b',
  comparisonSha256: 'bb2c968c20543a93fc27427f1eac66053cff1bd69e022698fc821cae1810d37d',
  beforeSha256: 'ba0b7ca01576059d0943269d4a32ab8b97851e65c60a6c9a91acfec76e9bd8ee',
  afterSha256: '3ff04e53d9d40d1c9fc72e3ffce0bd26eb3808d6d596cd8944b92006728b1b33',
}
const STYLE_V4_SOURCE = {
  id: 'style-v4-two-samples-source-application-19',
  directory: '.omo/private/seoul-migration/style-v4-two-samples-source-application-20261016/',
  prefixSha256: 'a7622b0404d4385d1d8726d82365a31198926562a459a491834b3ad3e98226af',
  packetSha256: '1f712dd5a6ecd25ee4ae3ea597b753b2b5a5c1c7e23e376893bbf2f1853832f2',
  manifestSha256: '0b220762555548a332e1b5fbaf2bff0e9995612cc9ad0a2c432825575ffe1034',
  archiveSha256: '5545659b5e0b478b2d0efd65a2d74e4a764c10168cbf36ed7b79241fd6742f10',
}
const S02_REVIEWED_SOURCE = {
  id: 's02-reviewed-source-application-577',
  directory: '.omo/private/seoul-migration/s02-reviewed-source-application-20261016/',
  candidateDirectory: '.omo/private/seoul-migration/s02-reviewed-location-prose-candidate-20261015/',
  prefixSha256: '39c88de38c37eba946a751a3d4833da490826eaaac1567c66b46464c4c224cb2',
  packetSha256: 'd7c10a77aecbf83a75ee80ced404ddc7044e52bb9b89b664f8732e334cfeaf7a',
  manifestSha256: '9222069fedd2ee929ef945ba6c0c19a7bcf2eaa78a09cd6873d278cf220d664c',
  archiveSha256: 'd50da5a65f3a5b168f00ae7bc99709a5176df4b69563cbddfbd26722eaff053b',
  proposalSha256: '57abeb4c9117a1d40a70e798c2e1743de619a85a94ea92c9971f2a391517d28d',
  overlaySha256: '3a7053d53cf7789dfeb0d0d914df68a100baac39d6c4be8fc9fda40def2a76ae',
  independentSha256: 'c75300a5bf22232b669822ecb565b15512d8b5f0b9ccc2e1ea913f148b804b1c',
  finalBindingsSha256: '3c245ae5a5e7332f31265591b90e7644629e8d94d8e35e1430ee840d015e6c41',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
}
const S03_REVIEWED_SOURCE = {
  id: 's03-reviewed-source-application-922',
  directory: '.omo/private/seoul-migration/s03-reviewed-source-application-20261016/',
  candidateDirectory: '.omo/private/seoul-migration/s03-reviewed-location-prose-candidate-v2-20261016/',
  prefixSha256: '75e2ebafdfdafb45ec8160d2f9311387a25691fdbbd6f8d68b421d47a250813e',
  packetSha256: '24435f253d3c8d6475a422ad1153d72506ef94234c9b0ee526c7ff6120de2f4f',
  manifestSha256: '9739a1971d386f8e12786c1949c49879cab0dc31cb868b37537bda1c70a18993',
  archiveSha256: '258b29fc0df8bbcc909c98b78c54f57dd733e1b353239171a64d4292ad41062a',
  proposalSha256: '6c358623cc571860a1fc7c2ebd65c4473e8bb39979925f9c1a8f529846694012',
  overlaySha256: '54932a79b1aa83771f5b4c300245fb4779ea43181d90707df6b8d4dc8aa9510f',
  independentSha256: 'e8de1c92e277f7896b84f183fa0e979d4bf53a555472a6327390bdce5e39c3ad',
  finalBindingsSha256: 'a5cfa081f41398f45e7e30edaea70c76237e8098136fef0968d4931ccce43c0c',
  ownerSha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
}
const S06_V2_SOURCE = {
  id: 's06-v2-reviewed-source-application-932',
  directory: '.omo/private/seoul-migration/s06-v2-reviewed-source-application-20261016/',
  candidateDirectory: '.omo/private/seoul-migration/s06-reviewed-fullbody-prose-candidate-20261016-v2/',
  prefixSha256: '57c68ebfeaa2ea8a47b39e5daa66663df84b5895dea15b8cb751976d8344b2b7',
  packetSha256: 'd2e4bbd62371f7a42a7268fe95c6d5faff5c6778e90a1ee230e454c84549e34d',
  manifestSha256: '322793bb2f044987fb6af4617d06ee3cbac21fd78bdfa37e295e6388044c6be9',
  archiveSha256: '36c62344750b24756fe48f1a4fcab7726819ae9c2a8f7a12df40105b589eda16',
  beforeSha256: 'a6529cba96c7d8fad90eab8deb1b4b74217c6bda543120f8ed6398b4a9814f32',
  afterSha256: '93270e81963d51852616f42bae5bb72d8dc7e2942d79f1aaef4f0e3f93903adb',
  candidateSha256: '98a9aecfbd20b831ad7989aa41fd69e00caf525eb369db5bb0ccdec0288b006a',
}
const S05_V2_SOURCE = {
  "id": "s05-v2-reviewed-source-application-931",
  "directory": ".omo/private/seoul-migration/s05-v2-reviewed-source-application-20261016/",
  "candidateDirectory": ".omo/private/seoul-migration/s05-reviewed-fullbody-prose-candidate-20261016-v2/",
  "prefixSha256": "267f7b4c8bcfab4ce1b6d44a533d928a12c5d44348eeda3333292b1426fad544",
  "packetSha256": "dafd8b71a843154f4bb172de74540f84d337737e9c9318a6c0ae27de88aca247",
  "manifestSha256": "d7621d98807a4631837105c0c92b1f42ee29db5cfa9b88cc1691f05004b7b2e0",
  "archiveSha256": "4cf4fa474c9ef7cbadfb7137d510fa5946bca44e329c8cf71273da62d249d35d",
  "beforeSha256": "e2532372318333bff855686e7691f2e2f85f3f6c6c95d05d2942c080eef94c79",
  "afterSha256": "0781d9eacee17e2b4ade5803567ab2bc306883d7d06557be6211d7d37635ac0f",
  "candidateSha256": "b0c24819aadfc94617b089d030a5378eaba68fba2f6eda6ad0f2333e33dd7e57"
}
const S04_V4_SOURCE = {
  id: 's04-v4-reviewed-source-application-644',
  directory: '.omo/private/seoul-migration/s04-v4-reviewed-source-application-20261016/',
  prefixSha256: '7e3e346f73f9b9dd42c0c24e427cf5605abb079fd1fbeee33f4178c8d0b512a8',
  packetSha256: '0a6e4293ddf4b1083cc8c69a24bf944a8eaeaafd4ea1412a8c2bcbafff33cfdc',
  manifestSha256: 'd862f5944ee4332c6d25fe60227d3fa95808a10f41c9cad6fa9803d440a713ce',
  beforeSha256: '7df8c18be866c99943ed272cd0f7ee3f7c63e732f75cbe8980e1a2817f7f4521',
  afterSha256: 'cbc04cbb9623fdd7a2af24da671a49dbffb52a2b82cfc242178a0042b13e3974',
  archiveSha256: 'eca62f0e3e1c2f7dd971ec5d4b677fa5b7a08af2ae7d64b45eebb27b5b079edb',
}
const S08_V2_SOURCE = {
  id: 's08-v2-reviewed-source-application-475',
  directory: '.omo/private/seoul-migration/s08-v2-reviewed-source-application-20261016/',
  prefixSha256: '75099b19c88f9f9f64b023312d75d2ab6f8daf37262876f41642057a75276f55',
  packetSha256: '46bed6d09c0a25a0fa2bff6a406142abfddcc889668a65fa643d99ca1077a284',
  manifestSha256: '0bb8af62a08bf0f29be97f76cb44a682ac5683e2a0a061be245c2dde80b84f24',
  beforeSha256: '2b286b7f382b57fef344e0bd28d06b75fbfc00d4348e9d3359e81bda08fa61ca',
  afterSha256: 'd83497eecd7002f20fcc72e1f15fca27399b29bceb61acb7a1bea254a4c5fa98',
  archiveSha256: '96f31fd34a832116a1f13ea8bb73fc7a0bc66c92449f5e88050bb5683892b9b0',
}
const S07_V2_SOURCE = {
  id: 's07-v2-reviewed-source-application-766',
  directory: '.omo/private/seoul-migration/s07-v2-reviewed-source-application-20261016/',
  prefixSha256: '3f237b985db1a3d9887cdbae2f1882365d1c7c5ef00c807cbde89a3f97fe05bd',
  packetSha256: 'c4747f273b774a3b3d4ca2c830a08436e9faa393f590396545f443184d5ee4a5',
  manifestSha256: '9fb449d5e7a8a81314eb2f55b025183bd86d3efe1192dc209cf19755f60a05d0',
  archiveSha256: '6d8c08a40e3231707a24cd81aca6fd05d04fd5001b4c4c712d4947dfea321d6d',
  beforeSha256: '0bc46c00f9b9d92c430372ec23de3ed14b1f7f81822d3f967f93a2f229094474',
  afterSha256: 'a87e2da6d1ca0911ae244b1aab68ba1673bf5df2876aed76c4c7bb50133a3781',
}
const S09_V3_SOURCE = {
  id: 's09-v3-reviewed-source-application-617',
  directory: '.omo/private/seoul-migration/s09-v3-reviewed-source-application-20261016/',
  prefixSha256: '708dafe0bfb5a5524542b6abf85d3cfdbfcbba1bfd0d706320411240541d9931',
  packetSha256: '4786db6c9ad3f3161b42c6b8400a7a853eeb275cee17412aa4cd5bc2fe9b05b7',
  manifestSha256: 'c1b2ec2754d461d96a697fa1c286d2be8c972255f90811b83b78a9ad6bbac1a4',
  beforeSha256: '74310bfc1bcd09ad8a5263f3506a83d01aed315e24ed0d6c67a7586b87cd14b7',
  afterSha256: '4afe8de9a60eb61aaed5c1da19a2047c3ceca293ae5d886545a0790a88c9d624',
  archiveSha256: '51a806ae1b9c5d267c12c73a7f63e1b5872d60191b455f84d597c98a6965ab92',
}
const PROFILE_TWO_REFERENCE_SOURCE = {
  id: 'profile-two-reference-repair-source-successor-2',
  directory: '.omo/private/seoul-migration/profile-two-reference-source-application-20261016/',
  prefixSha256: 'b34d4ee2c2e4c90dc07c61e26b21ca5e0bde1e6a9f0178933118fdd02b3d9eb9',
  packetSha256: '17ac9161f1d4367cbefb371611b0233aca6662e7e90ffbf6eaa93b1747bd7c56',
  manifestSha256: '6c74a3050f3a5582e561966b38c4f32aa73d3760f378fed602ecdb33de03a194',
  beforeSha256: 'ca60ec59a3ca4d6aebcdb04953b2c109b5a07bf59a1d393d8652fe10f0ead111',
  afterSha256: 'c047c55661bc9539f83fcfb3ff8d5262a25c14d9544449f3b3c3782241e8442a',
  archiveSha256: '1ae644bc71c58833d8815e89cba7bb4c2427784a2ec7a43101151c910039634e',
}
const S11_REVIEWED_SOURCE = {
  id: 's11-reviewed-source-application-476',
  directory: '.omo/private/seoul-migration/s11-reviewed-source-application-20261016/',
  prefixSha256: '816da145bce961bc6aaf4b461d8408e93d73faccf854d15bc8ddaeac1192ba79',
  packetSha256: '76e8e177d0772d3648fe294c4e32aa64ab5beec68ab403dda0f1e0345016f7f7',
  manifestSha256: '09c181b6a429fcb2c7e424eb1d57fb9de9ce48da1753a5e1f26093d07e86d2e3',
  beforeSha256: '0ce113f2cba969f47bc5e70d6e25b7b1e8fe3d05b7abe832285e4e0f2fa3dbe9',
  afterSha256: 'c49f05f15da3e64d9242e473db5cd6fd3136d6b92d41216e37ca4923e9159099',
}
const S10_REVIEWED_SOURCE = {
  id: 's10-reviewed-source-application-900',
  directory: '.omo/private/seoul-migration/s10-reviewed-source-application-20261016/',
  prefixSha256: '2edf5f6aaf29697e087c49ab5e99cbe626dc4baa3f1dec2ee654eee0375350a9',
  packetSha256: '33a2a4f6797f455a156e9e40ba8e5e5b7511b1239f83c58f670b635cae6636e8',
  manifestSha256: 'feaec8a5e184a998f1d390bcc4475806d686b864505c0f93b36d4c12cf1572ca',
  beforeSha256: 'b4694e6f1e33adff1c1a0689a092aae7e82e904a79f2e7fbbe743f8d50051502',
  afterSha256: '3c48806bbbf11efd9434b780fb0b337c57d7f50de8ca1588a02a5f03d90f616e',
}
const S13_REVIEWED_SOURCE = {
  id: 's13-reviewed-source-application-925',
  directory: '.omo/private/seoul-migration/s13-reviewed-source-application-20261016/',
  prefixSha256: '46362c91fc6356bdf709735ef912794ff86f256ac0ef490fbbf82c4bb9e6035d',
  packetSha256: 'a649926d732d2b2a1f93d33278892e1068460f647cab4950c7c1acc2c771615a',
  manifestSha256: '176a2e6d5f94becf85782f447c9649109d8a6b095623e63d78c11abc976b0bfc',
  beforeSha256: '3ad14dc5568713d7cf35e4f43a2e1b85aaab6094f4ce835501dc9bf9f58681df',
  afterSha256: '8ef3cb0d386b5c9e3523e305e3a934cf1a45aed93edfcdf7425c2892c46a5ad7',
}
const S12_REVIEWED_SOURCE = {
  id: 's12-reviewed-source-application-928',
  directory: '.omo/private/seoul-migration/s12-reviewed-source-application-20261016/',
  prefixSha256: 'a617170fb943619a095387382b6187383954513be88a6854813edce41ad5600a',
  packetSha256: '6102c454e0b256b28cd7b5b7f61520c043a177c457526a7ba614a8247bcd0067',
  manifestSha256: 'e21cc072ce3e6543b811c6705745cbea8a5ee6f01d3e99ff834f81162a43e662',
  beforeSha256: '603bb697e7c1f0f39cb66af5678faf16195e3e7a597f62e37f6590b14bd97e39',
  afterSha256: '7b0135b25b4bee46bf224fb148477cf46d2379baa8575a5c9fcb99c1a912959b',
}
const S14_REVIEWED_SOURCE = {
  id: 's14-reviewed-source-application-682',
  directory: '.omo/private/seoul-migration/s14-reviewed-source-application-20261016/',
  prefixSha256: '7d93aacab4c03e7cc0c86d083851706878ca3f5daec95fe6df99a699cc498c93',
  packetSha256: '8bae02889817916fbb9c268ad9213a05ac801460cf638fb8abf9f0ebecc3f405',
  manifestSha256: '24d6620bdc92d4e64a0a80a09fd2c8e93aba359b0cb997890592e981f78fd0ac',
}
const SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE = {
  id: 'soul-assignments-evidence-rebind-source-successor-1',
  directory: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-source-application-20261017/',
  prefixSha256: '19d8efda753770fa8026d07efdd5eb0b82d581a0f3d2b8e82a1e27bdc53f90a4',
  packetSha256: '308f2c86f8330b9f19dc09f839735fd4f7ba10c084eded734a1bfaa5e74f41d9',
  manifestSha256: '0ed00accac8e01ef13936e6a910c5d632574ce938aa97c82f4a8a08fecea28c8',
  beforeSha256: 'f0a1e5073356a46081fc89604a108d9d9ec51e9b243099aac1a1fe0698a43b7d',
  afterSha256: 'e56e9b40c1b22ec75f41f4ce5cb7495e280d074ad8429a693b45f89149969387',
  archiveSha256: 'aaf18b2d64edb26fed8dbf9ee2933bf5f2652801ff315dd07cf760529b949afd',
}
const SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE = {
  id: 'soul-batches-special-evidence-rebind-source-successor-1',
  directory: '.omo/private/seoul-migration/soul-batches-special-evidence-rebind-source-application-20261017/',
  prefixSha256: '34bd5df8d3184b902984ad7ed69525366b7d0e2564bef98c401dc4b8bff1bf31',
  packetSha256: '566ea7839bae10a038b4b6e07e2379b4c9ac00e4cdf9cbb165af4da9d314af4c',
  manifestSha256: '11f43742acbe5c94daf77d021f36fdbe339c7ff9d815633c69175dc1acd23684',
  beforeSha256: '9037acf1b951d54a4eb6701a822a17a975ad0111312bc0e48a7ab7249f9c3dbb',
  afterSha256: 'c6ee0569471f0bca3058391e3c7af2102d543cb25036ea7f8e3bb418aa5aaac6',
  archiveSha256: '96552ca5a3e522fde568693a62f44c3451970233acc57232c328f71b385bb115',
}
const authenticatedPublicationReviews = new WeakSet()
const authenticatedRemovedProvenance = new WeakMap()
const appliedAuthorityReaders = new WeakMap()
const appliedAuthenticationScope = new AsyncLocalStorage()
// Technical URL/path interoperability only. The predecessor receipt stays pinned;
// both complete byte hashes and the single reverse edit must agree.
export async function validatorPredecessorReader(root, reader = readFile) {
  const issuerBindings = [
    ['issue-person-ids.mjs', '224dedd3b4eb709fd270ccc515e68f7a118ef6d96ed6eef81b0f6eb1a64a4651', '823ddd506e15b3bd70ee1b1343f0980b38fab756c0567ca4ebb76eb861124c80'],
    ['verify-person-id-candidates.mjs', 'd4d530841978265b39cd8108c35af9b1d003bfefd416083dfa22315e31fc94d0', '044f632039b0f785ef5ab398d7a7af5e75a79c8b70c91e38ef4ce9235028d31f'],
    ['verify-person-id-registry.mjs', '74b99da96506086ace33cb86d52332cdfee52008e4238e3615071560a643dc17', '7b573accfe4bf772533302396bfd7feb64e7de0b436b66de0452a8feadf8843e'],
  ]
  const issuerBefore = new Map()
  for (const [file, afterSha256, beforeSha256] of issuerBindings) {
    const sourcePath = 'lore/name-pools/' + file
    let bytes
    try { bytes = await reader(resolve(root, sourcePath)) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
    if (sha256(bytes) !== afterSha256) continue
    const helper = await reader(resolve(root, 'lore/name-pools/person-id-values-successor.mjs'))
    check(sha256(helper) === 'c03d2abeaa83ab00912c13b68aa8c0acc6d0808e5b3af006ba706384e7b96b69', 'E_REVIEW_HASH', 'lore/name-pools/person-id-values-successor.mjs')
    let text = Buffer.from(bytes).toString().replace('import { personIdValuesHash } from "./person-id-values-successor.mjs";\n', '')
    if (file === 'issue-person-ids.mjs') {
      text = text.replace('  let approvedValues = false;\n  try {\n    approvedValues = personIdValuesHash(valuesBytes) === APPROVED.inputSha256;\n  } catch {\n    // Missing or altered successor evidence closes issuance just like altered source bytes.\n  }\n  if (!approvedValues) {', '  if (vi !== APPROVED.inputSha256) {')
        .replace('block.match(/^- 캐릭터 ID: ([^\\s.,;:!?…]+)/mu)', 'block.match(/^- 캐릭터 ID: (\\S+)/m)')
    } else if (file === 'verify-person-id-candidates.mjs') {
      text = text.replace('inputSha256: personIdValuesHash(ctx.valuesBytes),', 'inputSha256: sha256Hex(ctx.valuesBytes),')
        .replace('  let actualSha = sha256Hex(ctx.valuesBytes);\n  try {\n    actualSha = personIdValuesHash(ctx.valuesBytes);\n  } catch {\n    v.push("values-cast successor 증명이 유효하지 않다");\n  }', '  const actualSha = sha256Hex(ctx.valuesBytes);')
        .replace('test("(e) inputSha256이 인증된 values-cast 발급 선행본 해시와 같다", () => {\n    assert.equal(committed.inputSha256, personIdValuesHash(ctx.valuesBytes));', 'test("(e) inputSha256이 values-cast 최종 파일 해시와 같다", () => {\n    assert.equal(committed.inputSha256, sha256Hex(ctx.valuesBytes));')
      const start = text.indexOf('\n\n  test("변이 5 — note successor')
      const end = text.indexOf('\n  });', start) + '\n  });'.length
      text = text.slice(0, start) + text.slice(end)
    } else {
      text = text.replace('assert.equal(committed.approvalRef.inputSha256, personIdValuesHash(ctx.valuesBytes));', 'assert.equal(committed.approvalRef.inputSha256, sha256Hex(ctx.valuesBytes));')
      const start = text.indexOf('test("인증된 note successor')
      const end = text.indexOf('test("fail closed — 승인된 title', start)
      text = text.slice(0, start) + text.slice(end)
    }
    const before = Buffer.from(text)
    check(sha256(before) === beforeSha256, 'E_REVIEW_HASH', sourcePath)
    issuerBefore.set(resolve(root, sourcePath), before)
  }
  if (issuerBefore.size) {
    const original = reader
    reader = requested => issuerBefore.get(resolve(requested)) ?? original(requested)
    reader.appliedDiskOverrides = new Map(original.appliedDiskOverrides ?? [])
    reader.currentAuthorityReader = original.currentAuthorityReader
  }
  const aliasPath = resolve(root, 'lore/places/test-station-alias-candidates.mjs')
  let alias
  try { alias = await reader(aliasPath) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (alias && sha256(alias) === '916bb07d96ca2194595c4d2005d4f517b5eceb03e4fee69fcfe80795b5297e7b') {
    const before = (await promisify(execFile)('git', ['-C', root, 'show', 'e9c12a43728a599c371d373088e177a446ff5051:lore/places/test-station-alias-candidates.mjs'],
      { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout
    check(sha256(before) === '18fc455a69d053b742b2c6611456e80594aea45c857e3eafe9eb2b3e066ba256',
      'E_REVIEW_HASH', 'lore/places/test-station-alias-candidates.mjs')
    const original = reader
    reader = requested => resolve(requested) === aliasPath ? before : original(requested)
    reader.appliedDiskOverrides = new Map(original.appliedDiskOverrides ?? [])
    reader.currentAuthorityReader = original.currentAuthorityReader
  }
  const path = resolve(root, 'lore/relations/validate.mjs')
  let bytes
  try { bytes = await reader(path) } catch (error) { if (error.code === 'ENOENT') return reader; throw error }
  if (sha256(bytes) !== '12488185232ec84c3615f6b814f7a7d87334029de8ee38963c2f17cbe4e63b0e') return reader
  const before = Buffer.from(Buffer.from(bytes).toString().replace(
    'path.join(HERE, "..", "editorial", "seoul-narrative-census-events.json")',
    'new URL("../editorial/seoul-narrative-census-events.json", import.meta.url)'))
  check(sha256(before) === '5847207234526aacc2557481276d6ea9b454b500e907c583dc9f4fe345c231e8',
    'E_REVIEW_HASH', 'lore/relations/validate.mjs')
  const predecessor = requested => resolve(requested) === path ? before : reader(requested)
  predecessor.appliedDiskOverrides = new Map(reader.appliedDiskOverrides ?? [])
  return predecessor
}
async function loadFinalSuccessor(root, readBytes = readFile) {
  const authorityReader = appliedAuthorityReaders.get(readBytes) ?? readBytes
  const scope = appliedAuthenticationScope.getStore()
  const authenticate = () => authenticateFinalClosure(root, {
    contract: { documents: [] }, readBytes: authorityReader, requireArtifacts: true,
  })
  const closure = scope?.root === resolve(root) && scope.reader === authorityReader
    ? await (scope.finalClosure ??= authenticate()) : await authenticate()
  return closure.successor
}
const SUPPORTING_LOCAL_CONTRACTS = Object.freeze({
  'lore/regions/seoul-electoral-titles.json': { sha256: '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef', schema: 'seoul-geography-staging.v1' },
  'scripts/approved-seoul-rights-transition.json': { sha256: '384a139fef7546027dcbb7237f31b59aca9cdc28d6033b59f43109bf2f2cf86d', schema: 'approved-seoul-rights-transition.v1' },
  'scripts/approved-daejeon-nonowning-rights.json': { sha256: '44a49cbb8341d87214ebeef9d9e303cb5591f7c9c50327016516a7627b5eb2b8', schema: 'approved-daejeon-nonowning-rights.v1' },
})
const WATER_DOCUMENT_REVIEW_PROOF = {
  path: '.omo/private/seoul-migration/water-five-combined-review-v1-20261015.json',
  sha256: '652f8ca16a56e41708519e98ad545890d55cc1c732c1754401ce472f78972b94',
}
export const isAuthenticatedPublicationReview = review => authenticatedPublicationReviews.has(review)

export async function refreshTechnicalCodePublicationReview(review, root, readBytes = readFile) {
  check(authenticatedPublicationReviews.has(review), 'E_PUBLICATION_REVIEW_AUTHORITY', '/technical-code-successor')
  const predecessor = await validatorPredecessorReader(root, readBytes)
  const result = structuredClone(review)
  const helper = await readBytes(resolve(root, TECHNICAL_DOCUMENT.sourcePath))
  check(sha256(helper) === TECHNICAL_DOCUMENT.currentSha256, 'E_REVIEW_HASH', TECHNICAL_DOCUMENT.sourcePath)
  check(!result.documents.some(row => row.sourcePath === TECHNICAL_DOCUMENT.sourcePath), 'E_REVIEW_COVERAGE', TECHNICAL_DOCUMENT.sourcePath)
  result.documents.push({ sourcePath: TECHNICAL_DOCUMENT.sourcePath, currentSha256: TECHNICAL_DOCUMENT.currentSha256,
    classification: 'excluded-document', eligible: false, reason: 'authenticated-publication-exclusion', receipt: null })
  for (const sourcePath of ['lore/relations/validate.mjs', 'lore/places/test-station-alias-candidates.mjs',
    'lore/name-pools/issue-person-ids.mjs', 'lore/name-pools/verify-person-id-candidates.mjs', 'lore/name-pools/verify-person-id-registry.mjs']) {
    const current = await readBytes(resolve(root, sourcePath))
    const before = await predecessor(resolve(root, sourcePath))
    if (sha256(current) === sha256(before)) continue
    const row = result.documents.find(row => row.sourcePath === sourcePath)
    check(row?.currentSha256 === sha256(before)
      && (row.eligible || row.classification === 'excluded-document'), 'E_REVIEW_HASH', sourcePath)
    row.currentSha256 = sha256(current)
  }
  for (const document of result.documents) Object.freeze(document)
  Object.freeze(result.documents); Object.freeze(result)
  authenticatedPublicationReviews.add(result)
  return result
}

export async function refreshStationCatalogPublicationReview(review, root) {
  const { authenticateStationCatalogSuccessor, STATION_RECEIPT, STATION_BEFORE, STATION_AFTER } = await import('./station-catalog-scope-successor.mjs')
  const successor = await authenticateStationCatalogSuccessor(root)
  check(authenticatedPublicationReviews.has(review), 'E_PUBLICATION_REVIEW_AUTHORITY', STATION_RECEIPT)
  const result = structuredClone(review)
  const row = result.documents.find(row => row.sourcePath === successor.receipt.sourcePath)
  check(row?.currentSha256 === STATION_BEFORE && row.eligible, 'E_REVIEW_HASH', successor.receipt.sourcePath)
  row.currentSha256 = STATION_AFTER
  row.receipt = { path: STATION_RECEIPT, sha256: successor.sha256, approvalRef: STATION_RECEIPT }
  for (const document of result.documents) Object.freeze(document)
  Object.freeze(result.documents); Object.freeze(result)
  authenticatedPublicationReviews.add(result)
  return result
}

export async function refreshClimateLinkPublicationReview(review, root) {
  const { authenticateClimateLinkSuccessor, CLIMATE_SOURCE, CLIMATE_BEFORE, CLIMATE_AFTER,
    CLIMATE_RECEIPT, CLIMATE_RECEIPT_SHA256 } = await import('./climate-link-successor.mjs')
  await authenticateClimateLinkSuccessor(root)
  check(authenticatedPublicationReviews.has(review), 'E_PUBLICATION_REVIEW_AUTHORITY', CLIMATE_RECEIPT)
  const result = structuredClone(review)
  const row = result.documents.find(row => row.sourcePath === CLIMATE_SOURCE)
  check(row?.currentSha256 === CLIMATE_BEFORE && row.eligible, 'E_REVIEW_HASH', CLIMATE_SOURCE)
  row.currentSha256 = CLIMATE_AFTER
  row.receipt = { path: CLIMATE_RECEIPT, sha256: CLIMATE_RECEIPT_SHA256, approvalRef: CLIMATE_RECEIPT }
  for (const document of result.documents) Object.freeze(document)
  Object.freeze(result.documents); Object.freeze(result)
  authenticatedPublicationReviews.add(result)
  return result
}

export async function refreshTimelineWharfPublicationReview(review, root) {
  const { authenticateTimelineWharfSuccessor, authenticateTimelineWharfPublicationReview, TIMELINE_SOURCE, TIMELINE_BEFORE,
    TIMELINE_AFTER, TIMELINE_RECEIPT, TIMELINE_REVIEW, TIMELINE_REVIEW_SHA256 } = await import('./timeline-wharf-successor.mjs')
  await authenticateTimelineWharfSuccessor(root)
  await authenticateTimelineWharfPublicationReview(root)
  check(authenticatedPublicationReviews.has(review), 'E_PUBLICATION_REVIEW_AUTHORITY', TIMELINE_RECEIPT)
  const result = structuredClone(review)
  const row = result.documents.find(row => row.sourcePath === TIMELINE_SOURCE)
  check(row?.currentSha256 === TIMELINE_BEFORE && row.eligible, 'E_REVIEW_HASH', TIMELINE_SOURCE)
  row.currentSha256 = TIMELINE_AFTER
  row.receipt = { path: TIMELINE_REVIEW, sha256: TIMELINE_REVIEW_SHA256, approvalRef: TIMELINE_RECEIPT }
  for (const document of result.documents) Object.freeze(document)
  Object.freeze(result.documents); Object.freeze(result)
  authenticatedPublicationReviews.add(result)
  return result
}

export async function refreshReviewWordingPublicationReview(review, root) {
  const { authenticateReviewWordingSuccessor, WORDING_RECEIPT } = await import('./review-wording-successor.mjs')
  const successor = await authenticateReviewWordingSuccessor(root)
  check(authenticatedPublicationReviews.has(review), 'E_PUBLICATION_REVIEW_AUTHORITY', WORDING_RECEIPT)
  const result = structuredClone(review)
  for (const file of successor.files.values()) {
    const row = result.documents.find(row => row.sourcePath === file.sourcePath)
    check(row?.currentSha256 === file.beforeSha256 && row.eligible, 'E_REVIEW_HASH', file.sourcePath)
    row.currentSha256 = file.afterSha256
    row.receipt = { path: WORDING_RECEIPT, sha256: successor.sha256, approvalRef: WORDING_RECEIPT }
  }
  for (const document of result.documents) Object.freeze(document)
  Object.freeze(result.documents); Object.freeze(result)
  authenticatedPublicationReviews.add(result)
  return result
}

export async function refreshK176PublicationReview(review, root) {
  const { authenticateK176LabelSuccessor, K176_SOURCE: sourcePath, K176_BEFORE: beforeSha256, K176_AFTER: afterSha256, K176_DIRECTORY } = await import('./k176-label-successor.mjs')
  const successor = await authenticateK176LabelSuccessor(root)
  check(successor, 'E_REVIEW_HASH', sourcePath)
  check(authenticatedPublicationReviews.has(review), 'E_PUBLICATION_REVIEW_AUTHORITY', sourcePath)
  const result = structuredClone(review)
  const row = result.documents.find(row => row.sourcePath === sourcePath)
  check(row?.currentSha256 === beforeSha256 && row.eligible, 'E_REVIEW_HASH', sourcePath)
  row.currentSha256 = afterSha256
  row.receipt = { path: K176_DIRECTORY + 'owner-decision.json', sha256: successor.approvalSha256,
    approvalRef: K176_DIRECTORY + 'owner-decision.json' }
  for (const document of result.documents) Object.freeze(document)
  Object.freeze(result.documents); Object.freeze(result)
  authenticatedPublicationReviews.add(result)
  return result
}
export const MARKDOWN_SPANS_SHA256 = '687d05ef0cb723ffea58de83e9a51740cd6d27de5c5931a2c582982b02b6d48f'
export const TRIAGE_BINDING = {
  path: '.omo/private/seoul-migration/task-7-census/triage/manifest.json',
  sha256: 'f2bd10662264f5a633feb4be09461c850ba257076bef4e4a716659b8e527e9f3',
}
export const TASK2_BINDING = {
  mergeCommit: 'bae5b5800155e65193df06c27e98352932ea8821',
  reviewedCommit: '6b9022aaef5cde6db882acefe91e395c0abfe21e',
  geography: { path: 'lore/regions/seoul-electoral-titles.json', sha256: 'a422097741d7da52e50b5774c0d47b79bc8fa5e43061c39535429cd8173ae0c1' },
}
const failure = (code, path, id = '') => { throw Object.assign(new Error(code), { code, path, id }) }
const check = (condition, code, path, id) => { if (!condition) failure(code, path, id) }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const escape = value => String(value).replace(/~/g, '~0').replace(/\//g, '~1')
const address = row => JSON.stringify([row.sourcePath, row.jsonPointer, row.locale])
const tuple = row => [row.sourcePath, row.jsonPointer, row.anchor, row.locale, row.originalSha256]
const rowOf = row => Array.isArray(row) ? Object.fromEntries(['sourcePath', 'jsonPointer', 'anchor', 'locale', 'originalSha256'].map((k, i) => [k, row[i]])) : row
const sealed = path => path.startsWith('vendor/issued-history/')
const digestRows = rows => {
  const hash = createHash('sha256')
  for (const row of rows) hash.update(JSON.stringify(row)).update('\n')
  return hash.digest('hex')
}
function exact(actual, expected, code, path) {
  const keys = new Set(actual)
  check(keys.size === actual.length && actual.length === expected.length && expected.every(key => keys.has(key)), code, path)
}
function shape(value, fields, path) {
  check(value && typeof value === 'object' && !Array.isArray(value) && eq(Object.keys(value).sort(), [...fields].sort()), 'E_SCOPE_SHAPE', path)
}
function pointer(value, path) {
  if (path === '') return value
  return path.slice(1).split('/').reduce((v, key) => v?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], value)
}
// Immutable inputs are never reconstructed from the current checkout. Even callers
// with a valid product manifest must present the separately pinned archive bytes.
export async function loadImmutableCensus(baseline, readBytes = readFile, baselineSha256 = BASELINE_SHA256) {
  check(baselineSha256 === BASELINE_SHA256, 'E_ARCHIVE_HASH', '/census/baseline')
  const metadata = baseline.occurrences
  const chunks = []
  for (const [index, entry] of metadata.chunks.entries()) {
    check(entry.index === index, 'E_ARCHIVE_HASH', '/census/chunks', String(index))
    const bytes = await readBytes(entry.path)
    check(sha256(bytes) === entry.sha256, 'E_ARCHIVE_HASH', entry.path)
    chunks.push(bytes.toString().replace(/\s/g, ''))
  }
  const gzip = Buffer.from(chunks.join(''), 'base64')
  check(sha256(gzip) === metadata.gzipSha256, 'E_ARCHIVE_HASH', '/census/gzip')
  const payload = gunzipSync(gzip)
  check(payload.length === metadata.payloadBytes && sha256(payload) === metadata.payloadSha256, 'E_ARCHIVE_HASH', '/census/payload')
  const original = JSON.parse(payload)
  const supplements = {}
  for (const name of ['cardBodies', 'cardSupplement', 'issuedIdentityMap']) {
    const entry = metadata[name]
    const bytes = await readBytes(entry.path)
    check(sha256(bytes) === entry.sha256, 'E_ARCHIVE_HASH', entry.path)
    supplements[name] = JSON.parse(bytes)
  }
  const markdownPath = resolve(dirname(metadata.cardBodies.path), 'markdown-byte-spans.json')
  const markdownBytes = await readBytes(markdownPath)
  check(sha256(markdownBytes) === MARKDOWN_SPANS_SHA256, 'E_ARCHIVE_HASH', markdownPath)
  return { original, ...supplements, markdownSpans: JSON.parse(markdownBytes), markdownPath }
}

export function walkCensus(value, sourcePath) {
  const leaves = []; const blocks = []; const identities = []
  function visit(value, jsonPointer = '', anchor = null, locale = 'neutral') {
    if (typeof value === 'string') {
      leaves.push([sourcePath, jsonPointer, anchor, locale, sha256(value)])
      if (/^(?:K\d{3,4}|S\d{2}|HC\d{2}|HP\d{2}|[HFV]\d{2}|XT\d{2})$/.test(value)) identities.push({ sourcePath, jsonPointer, id: value })
    } else if (value && typeof value === 'object') {
      const nextAnchor = typeof value.anchor === 'string' ? value.anchor : anchor
      if (typeof value.kind === 'string') blocks.push({ sourcePath, jsonPointer, anchor: nextAnchor, locale, originalSha256: sha256(JSON.stringify(value)), kind: value.kind })
      for (const [key, child] of Object.entries(value)) visit(child, `${jsonPointer}/${escape(key)}`, nextAnchor, ['ko', 'en'].includes(key) ? key : locale)
    }
  }
  visit(value)
  return { leaves, blocks, identities }
}

function lines(bytes, sourcePath) {
  const rows = []
  let start = 0
  for (let i = 0; i < bytes.length; i += 1) if (bytes[i] === 10 || i === bytes.length - 1) {
    rows.push({ sourcePath, jsonPointer: `@line-byte:${start}:${i + 1}`, anchor: null, locale: 'neutral', originalSha256: sha256(bytes.subarray(start, i + 1)), startByte: start, endByte: i + 1 })
    start = i + 1
  }
  return rows
}

// Every original category remains independently indexed: a heading is not a card
// body, a kind object is not a leaf, and equal hashes do not collapse occurrences.
export function originalCategories(immutable) {
  const { original, cardBodies, cardSupplement, markdownSpans } = immutable
  return {
    leaves: original.leafStrings,
    blocks: original.blocks.map(row => ({ ...row, locale: localeAt(row.jsonPointer) })),
    headings: original.cards,
    cards: [...cardBodies.cards, ...cardSupplement.cards],
    markdown: [...original.markdown, ...cardBodies.rootMarkdown],
    lines: markdownSpans.spans.map(row => ({ ...row, jsonPointer: `@line-byte:${row.startByte}:${row.endByte}`, anchor: null })),
  }
}
function localeAt(path) {
  return path.split('/').filter(key => key === 'ko' || key === 'en').at(-1) ?? 'neutral'
}

export async function extractCensusSources(baseline, readBytes, appliedBatches = [], successorDocuments = []) {
  const sources = new Map()
  const creations = appliedBatches.flatMap(batch => batch.approvalModel === 'wildlife-source-authoring'
    ? batch.sourceBeforeAfter.sources.filter(row => row.operation === 'create').map(row => row.sourcePath) : [])
const replacements = new Map(appliedBatches.filter(batch => batch.approvalModel === 'bibliography-json-authoring-transition')
    .flatMap(batch => batch.sourceBeforeAfter.sources.map(row => [row.sourcePath, row.replacementPath])))
  for (const path of [...baselineDocuments(baseline), ...creations].map(path => replacements.get(path) ?? path)) {
    const bytes = Buffer.from(await readBytes(path))
    sources.set(path, { bytes, sha256: sha256(bytes), value: path.endsWith('.json') ? JSON.parse(bytes) : null })
  }
  for (const successor of successorDocuments) {
    if (successor.row.sourcePath === NATIONAL_DRESS_PATH) nationalDressPreservationReceipt(successor)
    else mainDocPreservationReceipt(successor)
    check(!sources.has(successor.row.sourcePath), 'E_REVIEW_COVERAGE', '/census/successorDocuments')
    const bytes = Buffer.from(await readBytes(successor.row.sourcePath))
    check(sha256(bytes) === successor.source.sha256, 'E_REVIEW_HASH', successor.row.sourcePath)
    sources.set(successor.row.sourcePath, { ...successor.source, bytes })
  }
  return sources
}

export function extractCurrentCategories(sources, original) {
  const current = { leaves: [], blocks: [], headings: [], cards: [], markdown: [], lines: [] }
  function headingIndex(row) {
    const content = sources.get(row.sourcePath)?.value?.content
    check(Array.isArray(content), 'E_REVIEW_COVERAGE', row.sourcePath, row.jsonPointer)
    if (!row.anchor) return Number(row.jsonPointer.split('/')[2])
    const matches = content.flatMap((block, i) => block.anchor === row.anchor ? [i] : [])
    check(matches.length === 1, 'E_REVIEW_COVERAGE', row.sourcePath, row.anchor)
    return matches[0]
  }
  const originalHeadings = new Map(original.headings.map(r => [address({ ...r, jsonPointer: `/content/${headingIndex(r)}` }), r]))
  const originalBlocks = new Map(original.blocks.map(row => [address(row), row.originalSha256]))
  for (const [path, source] of sources) {
    if (source.value) {
      const walk = walkCensus(source.value, path)
      for (const row of walk.leaves) current.leaves.push(row)
      for (const row of walk.blocks) current.blocks.push(row)
      for (const [i, block] of (source.value.content ?? []).entries()) {
        if (block.kind !== 'heading') continue
        for (const locale of ['en', 'ko']) {
          const title = block.text?.[locale]
          const name = typeof title === 'string' ? title : Array.isArray(title) ? title.map(run => run.text).join('') : ''
          if (typeof name !== 'string' || !/^(?:인물 |Person )/.test(name) || name === '인물 카드') continue
          const row = { sourcePath: path, jsonPointer: `/content/${i}`, anchor: block.anchor ?? null, locale, name, originalSha256: sha256(JSON.stringify(block)) }
          check(originalHeadings.has(address(row)) || originalBlocks.get(address({ ...row, locale: 'neutral' })) === row.originalSha256,
            'E_REVIEW_COVERAGE', '/census/new-card-heading', address(row))
        }
      }
    } else if (path.endsWith('.md')) current.lines.push(...lines(source.bytes, path))
  }
  for (const row of original.headings) {
    const jsonPointer = `/content/${headingIndex(row)}`
    const value = pointer(sources.get(row.sourcePath)?.value, jsonPointer)
    check(value?.kind === 'heading', 'E_REVIEW_COVERAGE', row.sourcePath, row.jsonPointer)
    current.headings.push({ ...row, jsonPointer, name: value.text?.[row.locale], originalSha256: sha256(JSON.stringify(value)) })
  }
  for (const row of original.cards) {
    const content = sources.get(row.sourcePath)?.value?.content
    const startBlock = headingIndex(row)
    check(content[startBlock]?.kind === 'heading', 'E_REVIEW_COVERAGE', row.sourcePath, row.jsonPointer)
    let endBlockExclusive = startBlock + 1
    while (endBlockExclusive < content.length && !(content[endBlockExclusive].kind === 'heading' && content[endBlockExclusive].depth <= content[startBlock].depth)) endBlockExclusive += 1
    current.cards.push({ ...row, jsonPointer: `/content/${startBlock}`, startBlock, endBlockExclusive, originalSha256: sha256(JSON.stringify(content.slice(startBlock, endBlockExclusive))) })
  }
  for (const row of original.markdown) {
    const bytes = sources.get(row.sourcePath)?.bytes
    const writingRulesSuccessor = row.sourcePath === 'lore/editorial/Writing-Rules.md'
      && sources.get(row.sourcePath)?.sha256 === '63cfbbd95f62658d32bd3e8e86f799d690df105ba9b8d8c73987f17b80f7ffbe'
    check(bytes && (row.endByte === undefined || row.endByte <= bytes.length || writingRulesSuccessor),
      'E_REVIEW_COVERAGE', row.sourcePath, row.jsonPointer)
    const startByte = Math.min(row.startByte ?? 0, bytes.length)
    const endByte = Math.min(row.endByte ?? bytes.length, bytes.length)
    current.markdown.push({ ...row, startByte, endByte,
      originalSha256: sha256(row.jsonPointer === '' ? bytes : bytes.subarray(startByte, endByte)) })
  }
  return current
}

function categoryIndex(categories) {
  const index = new Map()
  for (const [category, rows] of Object.entries(categories)) for (const raw of rows) {
    const row = rowOf(raw)
    const key = JSON.stringify([row.sourcePath, category])
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(tuple(row))
  }
  return [...index].map(([key, rows]) => {
    const [sourcePath, category] = JSON.parse(key)
    rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'))
    return { sourcePath, category, count: rows.length, sha256: digestRows(rows) }
  }).sort((a, b) => address({ ...a, jsonPointer: a.category }).localeCompare(address({ ...b, jsonPointer: b.category }), 'en'))
}

export function compareCensusCategories(original, current) {
  const mapping = []
  for (const category of Object.keys(original)) {
    const before = new Map(original[category].map(raw => { const row = rowOf(raw); return [address(row), row] }))
    const after = new Map(current[category].map(raw => { const row = rowOf(raw); return [address(row), row] }))
    check(before.size === original[category].length && after.size === current[category].length, 'E_REVIEW_COVERAGE', `/census/${category}/duplicates`)
    for (const [key, old] of before) {
      const now = after.get(key)
      if (!now && category === 'lines') {
        // Prefer the suffix displacement when repeated blank lines surround an
        // insertion. Both endpoints still require exact byte equality.
        const oldEnd = Math.max(...original.lines.filter(r => r.sourcePath === old.sourcePath).map(r => r.endByte))
        const newEnd = Math.max(...current.lines.filter(r => r.sourcePath === old.sourcePath).map(r => r.endByte))
        const moved = [...after.values()].filter(row => row.sourcePath === old.sourcePath && row.originalSha256 === old.originalSha256 && !before.has(address(row)))
          .sort((a, b) => Math.abs(a.startByte - old.startByte - (newEnd - oldEnd)) - Math.abs(b.startByte - old.startByte - (newEnd - oldEnd)))[0]
        if (moved) {
          mapping.push({ category, originalKeys: [coverageKey(old)], currentKeys: [coverageKey(moved)], disposition: 'moved', evidence: 'exact-line-byte-equality', reviewStatus: 'not-reviewed' })
          after.delete(address(moved))
          continue
        }
      }
      if (!now || !eq(tuple(old), tuple(now))) mapping.push({ category, originalKeys: [coverageKey(old)], currentKeys: now ? [coverageKey(now)] : [], disposition: now ? 'changed' : 'removed', evidence: 'independent-byte-extraction', reviewStatus: 'not-reviewed' })
    }
    for (const [key, now] of after) if (!before.has(key)) mapping.push({ category, originalKeys: [], currentKeys: [coverageKey(now)], disposition: 'added', evidence: 'independent-byte-extraction', reviewStatus: 'not-reviewed' })
  }
  return { original: categoryIndex(original), current: categoryIndex(current), exceptions: mapping,
    unchangedRule: 'For every category and positional address absent from exceptions, compare every tuple including anchor and exact UTF-8 hash; emit originalKey -> identical currentKey. No range, sample or count-only acceptance.' }
}

export function extractEntityRecords(sources, originalEventIds = []) {
  const get = path => sources.get(path).value
  const records = Object.fromEntries(ENTITY_SETS.map(set => [set, []]))
  const add = (set, sourcePath, jsonPointer, id) => {
    const record = pointer(get(sourcePath), jsonPointer)
    records[set].push({ id, sourcePath, jsonPointer, sourceSha256: sources.get(sourcePath).sha256, recordSha256: sha256(JSON.stringify(record)) })
  }
  for (const [set, path, field] of [
    ['persons', 'lore/name-pools/person-id-registry.json', 'persons'],
    ['titles', 'lore/relations/opening-feudal-allocation.json', 'titles'],
    ['grants', 'lore/relations/opening-feudal-allocation.json', 'grants'],
    ['bindings', 'lore/relations/opening-feudal-allocation.json', 'existingTitleBindings'],
    ['holdings', 'lore/relations/personal-holdings.json', 'holdings'],
    ['polities', 'lore/relations/personal-holdings.json', 'polities'],
    ['courts', 'lore/relations/relations.json', 'courts'],
  ]) get(path)[field].forEach((row, i) => add(set, path, `/${field}/${i}`, set === 'bindings' ? JSON.stringify([row.holdingId, row.titleId]) : row.id))
  for (const [set, path] of [['states', 'lore/factions/Sixteen-States.json'], ['relations', 'lore/characters/Cast-Relations.json'], ['events', 'lore/chronology/Century-Annals.json']]) {
    get(path).content.forEach((block, b) => {
      if (set === 'events') {
        if (block.kind === 'paragraph' && (originalEventIds.includes(`E:${block.anchor}`)
          || /^(\d{4})년(?: (\d{1,2})월(?: (\d{1,2})일)?)?/.test(block.text.ko))) add(set, path, `/content/${b}`, `E:${block.anchor}`)
      } else if (block.kind === 'table' && (set === 'relations' || block.anchor === 'table')) block.rows.forEach((row, r) => add(set, path, `/content/${b}/rows/${r}`, set === 'states' ? row[0].ko : `R:${block.anchor}:${r + 1}`))
    })
  }
  return records
}

export function extractPrimaryCards(sources, people) {
  const byName = new Map()
  const paths = [...Array.from({ length: 16 }, (_, i) => `lore/characters/Cast-State-${String(i + 1).padStart(2, '0')}.json`), 'lore/characters/Core-Characters.json', 'lore/characters/Cast-Unaffiliated.json', 'lore/factions/Diaspora-Corridors.json']
  for (const sourcePath of paths) {
    const value = sources.get(sourcePath).value
    const text = renderLoreMarkdown(value, 'ko', (_domain, slug) => `${slug}.md`)
    const corridor = sourcePath.endsWith('/Diaspora-Corridors.json')
    const headings = [...text.matchAll(sourcePath.endsWith('/Core-Characters.json') ? /^## (?!인물 목록$)(.+)$/gm : /^### 인물 (.+)$/gm)]
      .map(heading => ({ heading, start: text.slice(0, heading.index).match(/(?:\n<a id="[\p{L}\p{N}_-]+"><\/a>\n*)+$/u)?.index ?? heading.index }))
    for (const [index, { heading }] of headings.entries()) {
      let name = heading[1].trim()
      if (['부록 — 가치관 숫자', '인물 카드'].includes(name)) continue
      if (corridor) name = ['린샤오메이', '팜반득', '아미라 카심', '조엘 박', '나르기즈 유수포바', '최일석'].find(n => name === n || name.startsWith(`${n} (`))
      if (!name) continue
      const boundaries = [corridor ? headings[index + 1]?.heading.index : headings[index + 1]?.start,
        sourcePath.endsWith('/Cast-Unaffiliated.json') ? text.indexOf('\n## ', heading.index + heading[0].length) : -1].filter(n => n >= 0)
      const body = text.slice(heading.index + heading[0].length, boundaries.length ? Math.min(...boundaries) : text.length).trim()
      const rows = byName.get(name) ?? []
      const block = value.content.find(b => b.kind === 'heading' && (b.text?.ko === heading[1] || b.text?.ko === `인물 ${heading[1]}`))
      rows.push({ sourcePath, anchor: block?.anchor ?? null, heading: heading[1], encounterOrder: rows.length,
        length: body.length, bodySha256: sha256(body), primary: !corridor && (value.data?.primary_detail_names?.includes(name) ?? false) })
      byName.set(name, rows)
    }
  }
  return people.map(person => {
    const candidates = byName.get(person.name) ?? []
    const selected = candidates.find(c => c.primary) ?? [...candidates].sort((a, b) => b.length - a.length)[0]
    check(selected, 'E_REVIEW_COVERAGE', '/census/primaryCard', person.id)
    return { personId: person.id, selected, reason: selected.primary ? 'explicit-primary' : 'longest-rendered-trimmed-KO-body-stable-encounter-tie', candidates }
  })
}

export async function loadDependencyTriage(root, readBytes = readFile) {
  const bytes = await readBytes(resolve(root, TRIAGE_BINDING.path))
  check(sha256(bytes) === TRIAGE_BINDING.sha256, 'E_ARCHIVE_HASH', TRIAGE_BINDING.path)
  const manifest = JSON.parse(bytes)
  const records = []
  for (const shard of manifest.shards) {
    const bytes = await readBytes(resolve(root, shard.path))
    check(sha256(bytes) === shard.sha256, 'E_ARCHIVE_HASH', shard.path)
    const value = JSON.parse(bytes)
    check(value.firstIndex === records.length && value.records.length === shard.count, 'E_REVIEW_COVERAGE', shard.path)
    records.push(...value.records)
  }
  check(records.length === manifest.input.unresolvedCount && new Set(records.map(r => r.key)).size === records.length,
    'E_REVIEW_COVERAGE', '/census/originalUnresolved')
  return records
}

const referenceKey = row => JSON.stringify([row.sourcePath, row.jsonPointer, row.target, row.recordSha256])
const recordReference = (sources, path, jsonPointer) => {
  const source = sources.get(path)
  const value = pointer(source?.value, jsonPointer)
  check(source && value !== undefined, 'E_DEPENDENCY_REFERENCE', path, jsonPointer)
  return { sourcePath: path, jsonPointer, sourceSha256: source.sha256, recordSha256: sha256(value === null && jsonPointer === '' ? source.bytes : JSON.stringify(value)) }
}

// This receipt binds the current 223 keys, not the audit's older 242-key set.
// Targets remain external or historical provenance, never authored documents.
export async function loadRequiredProvenance(root, sources, readBytes = readFile, readGit = async binding =>
  (await promisify(execFile)('git', ['-C', binding.repositoryRoot, 'show', `${binding.revision}:${binding.path}`],
    { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout) {
  readBytes = await validatorPredecessorReader(root, readBytes)
  const { stationCatalogPredecessorReader } = await import('./station-catalog-scope-successor.mjs')
  const { reviewWordingPredecessorReader } = await import('./review-wording-successor.mjs')
  const { k176PredecessorReader } = await import('./k176-label-successor.mjs')
  readBytes = await stationCatalogPredecessorReader(root, readBytes)
  readBytes = await reviewWordingPredecessorReader(root, readBytes)
  readBytes = await k176PredecessorReader(root, readBytes)
  const { timelineWharfPredecessorReader } = await import('./timeline-wharf-successor.mjs')
  readBytes = await timelineWharfPredecessorReader(root, readBytes)
  const receiptPath = '.omo/private/seoul-migration/required-provenance-bindings-20261015.json'
  for (const [path, source] of sources) {
    check(sha256(source.bytes) === source.sha256
      && eq(source.value, path.endsWith('.json') ? JSON.parse(source.bytes) : null),
    'E_REVIEW_HASH', path)
  }
  const receiptBytes = await readBytes(resolve(root, receiptPath))
  check(sha256(receiptBytes) === 'd7fe15a49a0d2b4ee2d2b58e58f51877aad332dea6547d15529ef99562b1ca7c', 'E_REVIEW_HASH', receiptPath)
  const historicalReceipt = JSON.parse(receiptBytes)
  const postS14Path = '.omo/private/seoul-migration/required-provenance-bindings-postS14-20261017/successor.json'
  const postS14ArchivePath = '.omo/private/seoul-migration/required-provenance-bindings-postS14-20261017/required-provenance-bindings-20261015.archive.json'
  const [postS14Bytes, postS14ArchiveBytes] = await Promise.all([
    readBytes(resolve(root, postS14Path)), readBytes(resolve(root, postS14ArchivePath)),
  ])
  check(sha256(postS14Bytes) === '9937a22c7fd7f61a8f121a2466fa1b7d227d4d01c75f22989affb9286c15030c'
    && Buffer.from(postS14ArchiveBytes).equals(Buffer.from(receiptBytes)), 'E_REVIEW_HASH', postS14Path)
  const postS14 = JSON.parse(postS14Bytes)
  check(postS14.schema === 'seoul-required-provenance-bindings-successor.v1'
    && eq(postS14.predecessor, { path: receiptPath, archivePath: postS14ArchivePath,
      sha256: sha256(receiptBytes), bytes: receiptBytes.length, bindingCount: 223 })
    && postS14.operation === 'replace-target-pins-and-authenticated-source-record' && postS14.replacementCount === 23
    && postS14.scope.bindingCountBefore === 223 && postS14.scope.bindingCountAfter === 223
    && postS14.scope.sourceRecordsChanged === 1 && postS14.scope.targetPinsChanged === 23
    && postS14.scope.semanticReview === 'not-reviewed' && postS14.scope.publicationApproval === false,
  'E_REVIEW_COVERAGE', postS14Path)
  const authority = postS14.authority
  const [s14PacketBytes, s14OperationsBytes, s14AuditBytes] = await Promise.all([
    readBytes(resolve(root, authority.packet.path)), readBytes(resolve(root, authority.operations.path)),
    readBytes(resolve(root, authority.appliedAudit.path)),
  ])
  check(authority.batchId === S14_REVIEWED_SOURCE.id
    && sha256(s14PacketBytes) === authority.packet.sha256 && authority.packet.sha256 === S14_REVIEWED_SOURCE.packetSha256
    && sha256(s14OperationsBytes) === authority.operations.sha256
    && sha256(s14AuditBytes) === authority.appliedAudit.sha256
    && authority.source.path === 'lore/characters/Core-Characters.json'
    && authority.source.beforeSha256 === '586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46'
    && authority.source.afterSha256 === '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96'
    && JSON.parse(s14AuditBytes).verdict === 'confirmed', 'E_REVIEW_HASH', postS14Path)
  const s14Packet = JSON.parse(s14PacketBytes)
  const s14CoreBeforeBytes = await readBytes(resolve(root, s14Packet.pins.coreBeforeArchive.path))
  check(sha256(s14CoreBeforeBytes) === s14Packet.pins.coreBeforeArchive.sha256
    && sha256(s14CoreBeforeBytes) === authority.source.beforeSha256, 'E_REVIEW_HASH', postS14Path)
  const s14CoreBefore = JSON.parse(s14CoreBeforeBytes)
  const s14Operations = JSON.parse(s14OperationsBytes).operations
  const currentCore = sources.get(authority.source.path)
  check(currentCore?.sha256 === authority.source.afterSha256, 'E_REVIEW_HASH', postS14Path)
  const replacementKeys = new Set(); const receipt = structuredClone(historicalReceipt)
  for (const replacement of postS14.replacements) {
    const binding = receipt.bindings.find(row => row.key === replacement.bindingKey)
    const targetIndex = binding?.targets?.findIndex(target => eq(target, replacement.targetBefore)) ?? -1
    const before = pointer(s14CoreBefore, replacement.targetAfter.jsonPointer)
    const after = pointer(currentCore.value, replacement.targetAfter.jsonPointer)
    const operation = s14Operations.find(op => op.file === authority.source.path
      && (replacement.targetAfter.jsonPointer === op.path || replacement.targetAfter.jsonPointer.startsWith(op.path + '/')
        || op.path.startsWith(replacement.targetAfter.jsonPointer + '/')))
    check(binding && binding.sourcePath === replacement.sourcePath && binding.jsonPointer === replacement.jsonPointer
      && targetIndex !== -1 && !replacementKeys.has(replacement.bindingKey)
      && replacement.targetBefore.sourcePath === authority.source.path
      && replacement.targetAfter.sourcePath === authority.source.path
      && replacement.targetAfter.jsonPointer === replacement.targetBefore.jsonPointer
      && replacement.targetAfter.sourceSha256 === authority.source.afterSha256
      && (!replacement.s14BeforeTarget || replacement.s14BeforeTarget.sourcePath === authority.source.path
        && replacement.s14BeforeTarget.jsonPointer === replacement.targetBefore.jsonPointer
        && replacement.s14BeforeTarget.sourceSha256 === authority.source.beforeSha256)
      && sha256(JSON.stringify(before)) === (replacement.s14BeforeTarget ?? replacement.targetBefore).recordSha256
      && sha256(JSON.stringify(after)) === replacement.targetAfter.recordSha256 && operation,
    'E_REVIEW_HASH', postS14Path, replacement.bindingKey)
    replacementKeys.add(replacement.bindingKey); binding.targets[targetIndex] = replacement.targetAfter
  }
  check(replacementKeys.size === 23 && receipt.bindings.length === historicalReceipt.bindings.length,
    'E_REVIEW_COVERAGE', postS14Path)
  const combinedRebindings = new Map()
  try {
    const combinedRoot = '.omo/private/seoul-migration/combined-evidence-rebind-candidate-20261017/'
    const manifest = JSON.parse(await readBytes(resolve(root, combinedRoot + 'source-before-after.json')))
    for (const row of receipt.bindings) {
      const source = manifest.sources.find(item => item.consumerFile === row.sourcePath)
      const current = sources.get(row.sourcePath)
      if (!source || current?.sha256 !== source.candidateSha256) continue
      const beforeBytes = await readBytes(resolve(root, combinedRoot + source.beforePath))
      check(sha256(beforeBytes) === source.beforeSha256, 'E_REVIEW_HASH', '/combined/preimage', row.sourcePath)
      const beforeRecord = pointer(JSON.parse(beforeBytes), row.jsonPointer); const afterRecord = pointer(current.value, row.jsonPointer)
      if (beforeRecord !== undefined && afterRecord !== undefined) combinedRebindings.set(row.key, {
        beforeRecordSha256: sha256(JSON.stringify(beforeRecord)), afterRecordSha256: sha256(JSON.stringify(afterRecord)) })
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error }
  const sourceRebindings = new Map()
  for (const rebind of postS14.sourceRebindings ?? []) {
    if (combinedRebindings.has(rebind.bindingKey)) continue
    const binding = receipt.bindings.find(row => row.key === rebind.bindingKey)
    const authority = rebind.authority
    const [packetBytes, operationsBytes, auditBytes, archiveBytes] = await Promise.all([
      readBytes(resolve(root, authority.packet.path)), readBytes(resolve(root, authority.operations.path)),
      readBytes(resolve(root, authority.appliedAudit.path)), readBytes(resolve(root, authority.beforeArchive.path)),
    ])
    const packet = JSON.parse(packetBytes); const operations = JSON.parse(operationsBytes).operations
    const audit = JSON.parse(auditBytes); const archive = JSON.parse(archiveBytes)
    const before = JSON.parse(Buffer.from(archive.rawBase64, 'base64')); const current = sources.get(rebind.sourcePath)
    const beforeRecord = pointer(before, rebind.jsonPointer); const currentRecord = pointer(current?.value, rebind.jsonPointer)
    const operation = operations.find(op => op.path === rebind.jsonPointer + '/quote')
    check(binding && binding.sourcePath === rebind.sourcePath && binding.jsonPointer === rebind.jsonPointer
      && !sourceRebindings.has(rebind.bindingKey) && authority.batchId === SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE.id
      && sha256(packetBytes) === authority.packet.sha256 && authority.packet.sha256 === SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE.packetSha256
      && sha256(operationsBytes) === authority.operations.sha256 && sha256(auditBytes) === authority.appliedAudit.sha256
      && sha256(archiveBytes) === authority.beforeArchive.sha256 && audit.verdict === 'bounded-confirmed'
      && packet.source.sourcePath === rebind.sourcePath && packet.source.beforeSha256 === rebind.sourceBeforeSha256
      && packet.source.afterSha256 === rebind.sourceAfterSha256 && archive.rawSha256 === rebind.sourceBeforeSha256
      && current?.sha256 === rebind.sourceAfterSha256 && sha256(JSON.stringify(beforeRecord)) === rebind.recordBeforeSha256
      && sha256(JSON.stringify(currentRecord)) === rebind.recordAfterSha256 && operation?.before === beforeRecord.quote
      && operation?.value === currentRecord.quote && eq({ ...currentRecord, quote: beforeRecord.quote }, beforeRecord),
    'E_REVIEW_HASH', postS14Path, rebind.bindingKey)
    sourceRebindings.set(rebind.bindingKey, { beforeRecordSha256: rebind.recordBeforeSha256,
      afterRecordSha256: rebind.recordAfterSha256 })
  }
  check(sourceRebindings.size + [...combinedRebindings.keys()].filter(key => postS14.sourceRebindings?.some(row => row.bindingKey === key)).length === 1, 'E_REVIEW_COVERAGE', postS14Path)
  const successorPath = '.omo/private/seoul-migration/current-provenance-successor-20261015/receipt-v2.json'
  const successorBytes = await readBytes(resolve(root, successorPath))
  check(sha256(successorBytes) === '9bd970331161fa7ab5f1552d48fd254c8b3787df5f1eb715ffb85aa32f8ff9b2', 'E_REVIEW_HASH', successorPath)
  const successor = JSON.parse(successorBytes)
  check(successor.schema === 'seoul-required-provenance-successor.v1'
    && eq(successor.predecessor, { path: receiptPath, sha256: sha256(receiptBytes), keyCount: 223 })
    && successor.semanticReview === 'not-reviewed' && successor.currentFactAuthority === false, 'E_REVIEW_COVERAGE', successorPath)
  const actualBytes = await readBytes(resolve(root, successor.actualApplication.path))
  const independentBytes = await readBytes(resolve(root, successor.absoluteWorktreeIndependent.path))
  check(sha256(actualBytes) === successor.actualApplication.sha256
    && sha256(independentBytes) === successor.absoluteWorktreeIndependent.sha256, 'E_REVIEW_HASH', successorPath)
  const actualApplication = JSON.parse(actualBytes); const independent = JSON.parse(independentBytes)
  check(actualApplication.status === 'applied_on_disk' && independent.verdict === 'PASS_APPLIED_BOUNDED'
    && independent.actualRoot === resolve(root) && actualApplication.documents.length === 4,
  'E_REVIEW_COVERAGE', successorPath)
  const operationBytes = await readBytes(resolve(root, successor.operation.path))
  check(sha256(operationBytes) === successor.operation.sha256, 'E_REVIEW_HASH', successor.operation.path)
  const operation = JSON.parse(operationBytes)
  const successors = new Map()
  for (const source of successor.sources) {
    const document = operation.documents.find(row => row.path === source.path)
    const observed = actualApplication.documents.find(row => row.path === source.path)
    const reviewed = independent.documents.find(row => row.absolutePath === resolve(root, source.path))
    check(document && document.before.sha256 === source.beforeSha256 && document.after.sha256 === source.afterSha256
      && observed?.beforeArchiveSha256 === source.beforeSha256 && observed.actualSha256 === source.afterSha256
      && reviewed?.sha256 === source.afterSha256 && reviewed.byteEqualArchivedAfter === true
      && source.bindings.length > 0, 'E_REVIEW_COVERAGE', successorPath, source.path)
    const beforePath = `${successor.operation.archiveRoot}/before/${source.path}`
    const afterPath = `${successor.operation.archiveRoot}/after/${source.path}`
    const beforeBytes = await readBytes(resolve(root, beforePath))
    const afterBytes = await readBytes(resolve(root, afterPath))
    check(sha256(beforeBytes) === source.beforeSha256 && sha256(afterBytes) === source.afterSha256,
      'E_REVIEW_HASH', successorPath, source.path)
    const before = JSON.parse(beforeBytes); const after = JSON.parse(afterBytes)
    for (const change of document.changes) check(pointer(before, change.pointer) === change.before
      && pointer(after, change.pointer) === change.after, 'E_REVIEW_HASH', successorPath, change.pointer)
    for (const binding of source.bindings) {
      const predecessor = receipt.bindings.find(row => row.key === binding.key)
      check(predecessor && predecessor.sourcePath === source.path && predecessor.jsonPointer === binding.jsonPointer
        && predecessor.sourceSha256 === source.beforeSha256 && !successors.has(binding.key),
      'E_REVIEW_COVERAGE', successorPath, binding.key)
      check(sha256(JSON.stringify(pointer(before, binding.jsonPointer))) === binding.beforeRecordSha256
        && sha256(JSON.stringify(pointer(after, binding.jsonPointer))) === binding.afterRecordSha256
        && binding.beforeRecordSha256 === predecessor.recordSha256
        && binding.afterRecordSha256 === predecessor.recordSha256, 'E_REVIEW_HASH', successorPath, binding.key)
      successors.set(binding.key, source.afterSha256)
    }
  }
  check(successors.size === 12 && receipt.bindings.length === 223, 'E_REVIEW_COVERAGE', successorPath)
  // The four-document admission changes only root status after the 47 reviewed
  // prose operations. Bind that *next* raw successor to the pinned packet, not
  // to a caller-provided map or a general exemption for changed source hashes.
  const statusPath = FOUR_DOCUMENTS_STATUS.directory + 'application-packet.json'
  const statusBytes = await readBytes(resolve(root, statusPath))
  check(sha256(statusBytes) === FOUR_DOCUMENTS_STATUS.packetSha256, 'E_REVIEW_HASH', statusPath)
  const statusPacket = JSON.parse(statusBytes)
  const statusManifestPath = FOUR_DOCUMENTS_STATUS.directory + 'source-before-after.json'
  const statusManifestBytes = await readBytes(resolve(root, statusManifestPath))
  check(sha256(statusManifestBytes) === 'e5842f8585ee11d28c78832ae2619b5739314a9fbfb140df5ad5e94ade606a21', 'E_REVIEW_HASH', statusManifestPath)
  const statusManifest = JSON.parse(statusManifestBytes)
  check(statusPacket.schema === 'seoul-four-reviewed-documents-status-admission.v1'
    && statusPacket.batchId === FOUR_DOCUMENTS_STATUS.batchId
    && statusManifest.schema === 'seoul-four-reviewed-documents-source-before-after.v1'
    && statusManifest.batchId === FOUR_DOCUMENTS_STATUS.batchId
    && eq(statusPacket.registryPrefix, { count: 70, sha256: FOUR_DOCUMENTS_STATUS.registryPrefixSha256 })
    && eq(statusPacket.operations, FOUR_DOCUMENTS_STATUS.paths.map(file => ({ op: 'replace', file, path: '/status', oldValue: 'draft', value: 'approved' })))
    && eq(statusPacket.evidence, {
      owner: { path: POST62_OWNER.path, sha256: POST62_OWNER.sha256 },
      independent: { path: successor.absoluteWorktreeIndependent.path, sha256: successor.absoluteWorktreeIndependent.sha256 },
      historicalFail: { path: POST62_ROOT + 'six-doc-remediation-20261015/independent.md', sha256: 'aae552f5dc0566de926b08edea43251d2b71aa6c2778b81bfed8a34058e7555a' },
      remediation: { path: successor.operation.path, sha256: successor.operation.sha256 },
    })
    && eq(statusPacket.sources.map(row => row.sourcePath), FOUR_DOCUMENTS_STATUS.paths)
    && eq(statusManifest.sources.map(row => row.sourcePath), FOUR_DOCUMENTS_STATUS.paths),
  'E_REVIEW_COVERAGE', statusPath)
  for (const ref of Object.values(statusPacket.evidence)) {
    check(sha256(await readBytes(resolve(root, ref.path))) === ref.sha256, 'E_REVIEW_HASH', ref.path)
  }
  const statusSuccessors = new Map()
  for (const row of statusPacket.sources) {
    const predecessor = successor.sources.find(source => source.path === row.sourcePath)
    const manifestRow = statusManifest.sources.find(source => source.sourcePath === row.sourcePath)
    const source = sources.get(row.sourcePath)
    const before = gunzipSync(Buffer.from(row.beforeGzipBase64, 'base64'))
    const after = gunzipSync(Buffer.from(row.afterGzipBase64, 'base64'))
    const beforeValue = JSON.parse(before); const afterValue = JSON.parse(after)
    const tidySuccessor = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(row.sourcePath)
    const post108Successor = POST108_EIGHT_DOCUMENT_SOURCE.sources[row.sourcePath]
    check(predecessor?.afterSha256 === row.beforeSha256 && row.afterSha256 === FOUR_DOCUMENTS_STATUS.afterSha256[row.sourcePath]
      && eq(manifestRow, { sourcePath: row.sourcePath, beforeSha256: row.beforeSha256,
        afterSha256: row.afterSha256, changed: true, operation: 'status-only' })
      && sha256(before) === row.beforeSha256 && sha256(after) === row.afterSha256
      && ((source?.sha256 === row.afterSha256 && Buffer.from(source.bytes).equals(after))
        || (tidySuccessor && tidySuccessor.beforeSha256 === row.afterSha256
          && [tidySuccessor.afterSha256, post108Successor?.afterSha256].includes(source?.sha256))
        || (post108Successor && post108Successor.afterSha256 === source?.sha256
          && (post108Successor.beforeSha256 === row.afterSha256 || row.afterSha256 === FOUR_DOCUMENTS_STATUS.afterSha256[row.sourcePath])))
      && beforeValue.status === 'draft' && afterValue.status === 'approved'
      && eq({ ...afterValue, status: 'draft' }, beforeValue), 'E_REVIEW_HASH', statusPath, row.sourcePath)
    for (const binding of predecessor.bindings) {
      const original = receipt.bindings.find(item => item.key === binding.key)
      check(original && successors.get(binding.key) === row.beforeSha256
        && original.recordSha256 === sha256(JSON.stringify(pointer(afterValue, binding.jsonPointer)))
        && !statusSuccessors.has(binding.key), 'E_REVIEW_HASH', statusPath, binding.key)
      statusSuccessors.set(binding.key, row.afterSha256)
    }
  }
  check(statusSuccessors.size === 12, 'E_REVIEW_COVERAGE', statusPath)
  const auditBytes = await readBytes(resolve(root, receipt.audit.path))
  check(sha256(auditBytes) === '9bb6064fbb52500306f4f910095810023c58a564eeb564fec9c0b05f5449366e', 'E_REVIEW_HASH', receipt.audit.path)
  const audit = JSON.parse(auditBytes); const result = new Map(); const files = new Map()
  const three = await loadStableThreeSourceProof(root, readBytes)
  const publication = await loadPublicationV4SourceProof(root, readBytes)
  const threePaths = new Set(three?.documents.map(row => row.path) ?? [])
  const resolveReference = createDependencyResolver(sources)
  const soulAssignmentsRebind = new Map()
  const soulAssignments = sources.get('lore/editorial/Soul-Assignments.json')
  if (soulAssignments?.sha256 === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.afterSha256) {
    const packetPath = SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.directory + 'application-packet.json'
    const packetBytes = await readBytes(resolve(root, packetPath)); const packet = JSON.parse(packetBytes)
    const operationsBytes = await readBytes(resolve(root, packet.pins.operations.path))
    const archiveBytes = await readBytes(resolve(root, packet.pins.beforeArchive.path))
    const appliedAuditBytes = await readBytes(resolve(root, packet.pins.independentAppliedJson.path))
    check(sha256(packetBytes) === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.packetSha256
      && packet.registryPrefix.count === 97 && packet.registryPrefix.sha256 === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.prefixSha256
      && packet.source.beforeSha256 === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.beforeSha256
      && packet.source.afterSha256 === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.afterSha256
      && sha256(operationsBytes) === packet.pins.operations.sha256
      && sha256(archiveBytes) === packet.pins.beforeArchive.sha256
      && sha256(appliedAuditBytes) === packet.pins.independentAppliedJson.sha256
      && JSON.parse(appliedAuditBytes).verdict === 'bounded-confirmed',
    'E_REVIEW_HASH', packetPath)
    for (const operation of JSON.parse(operationsBytes).operations) {
      const recordPointer = operation.path.replace(/\/quote$/, '')
      const current = structuredClone(pointer(soulAssignments.value, recordPointer))
      check(current?.quote === operation.value, 'E_REVIEW_HASH', packet.source.sourcePath, operation.path)
      current.quote = operation.before
      soulAssignmentsRebind.set(recordPointer, {
        beforeRecordSha256: sha256(JSON.stringify(current)), afterRecordSha256: sha256(JSON.stringify(pointer(soulAssignments.value, recordPointer))),
      })
    }
  }
  for (const row of receipt.bindings) {
    check(row.key === referenceKey(row) && !result.has(row.key), 'E_REVIEW_COVERAGE', receiptPath, row.key)
    const source = sources.get(row.sourcePath)
    const post108Source = POST108_EIGHT_DOCUMENT_SOURCE.sources[row.sourcePath]
    const post108Before = post108Source && source?.sha256 === post108Source.afterSha256
      ? await readBytes(resolve(root, '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/before/' + row.sourcePath)) : null
    const post108Pointer = row.sourcePath === 'lore/ailments/Ailments.json'
      && row.jsonPointer.startsWith('/content/46/items/0/') ? row.jsonPointer.replace('/content/46/', '/content/42/') : row.jsonPointer
    const post108Value = post108Before && pointer(JSON.parse(post108Before), post108Pointer)
    const publicationPointer = row.sourcePath === 'lore/ailments/Ailments.json'
      && row.jsonPointer.startsWith('/content/46/items/0/') ? row.jsonPointer.replace('/content/46/', '/content/42/') : row.jsonPointer
    const currentValue = pointer(sources.get(row.sourcePath).value, publicationPointer)
    const currentPinnedRecord = currentValue !== undefined && sha256(JSON.stringify(currentValue)) === row.recordSha256
    const post108HistoricalRecord = post108Value !== undefined
      && sha256(JSON.stringify(post108Value)) === row.recordSha256
    check(source && sha256(source.bytes) === source.sha256, 'E_REVIEW_HASH', row.sourcePath)
    const publicationDocument = publication.documents.find(item => item.path === row.sourcePath)
    if (publicationPointer !== row.jsonPointer) {
      const archived = JSON.parse(await readBytes(resolve(root, publicationDocument.archiveBefore)))
      check(archived.content[46].anchor === '출처-list1'
        && sources.get(row.sourcePath).value.content[42].anchor === '출처-list1', 'E_REVIEW_HASH', row.sourcePath, row.jsonPointer)
    }
    if (combinedRebindings.has(row.key) && row.sourcePath === 'lore/name-pools/gurps-cast.json' && !pointer(sources.get(row.sourcePath).value, publicationPointer)?.quote) { result.set(row.key, { status: 'removed-by-owner-authority', targets: [], provenanceBoundary: { semanticReview: 'owner-authorized-removal', currentFactAuthority: false } }); continue }
    if (row.sourcePath === 'lore/name-pools/gurps-cast.json' && !pointer(sources.get(row.sourcePath).value, publicationPointer)?.quote) { result.set(row.key, { status: 'removed-by-owner-authority', targets: [], provenanceBoundary: { semanticReview: 'owner-authorized-removal', currentFactAuthority: false } }); continue }
    if (post108Source && currentValue === undefined && post108Before) {
      result.set(row.key, { status: 'removed-by-authenticated-source-successor', targets: [],
        provenanceBoundary: { semanticReview: 'independent-fullbody-approved', currentFactAuthority: false } })
      continue
    }
    const currentAtPointer = pointer(sources.get(row.sourcePath).value, publicationPointer)
    if (currentAtPointer === undefined || /\/canon_refs\/\d+$/.test(publicationPointer)) {
      const finalSuccessor = (await loadFinalSuccessor(root, readBytes)).transitions.find(transition => transition.path === row.sourcePath
        && transition.afterSha256 === source.sha256)
      if (finalSuccessor?.beforeSha256 === row.sourceSha256) {
        const before = await historicalSourceBytes(row.sourcePath, row.sourceSha256, readBytes, root, readGit)
        const prior = pointer(JSON.parse(before), row.jsonPointer)
        check(sha256(before) === row.sourceSha256 && prior !== undefined
          && sha256(JSON.stringify(prior)) === row.recordSha256, 'E_REVIEW_HASH', row.sourcePath, row.jsonPointer)
        const currentRefs = pointer(source.value, publicationPointer.slice(0, publicationPointer.lastIndexOf('/')))
        if (currentAtPointer === undefined || Array.isArray(currentRefs) && !currentRefs.some(value => eq(value, prior))) {
          const disposition = { status: 'removed-by-authenticated-source-successor', targets: [],
            provenanceBoundary: { semanticReview: 'reviewed-reference-metadata-correction', currentFactAuthority: false } }
          authenticatedRemovedProvenance.set(disposition, { key: row.key, sourceSha256: source.sha256 })
          result.set(row.key, disposition)
          continue
        }
      }
    }
    const currentReference = recordReference(sources, row.sourcePath, publicationPointer)
    if (currentReference.sourceSha256 !== row.sourceSha256 && !combinedRebindings.has(row.key)) {
      const repin = await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readBytes) ?? readBytes)
      const doc247Successor = repin.transitions.find(transition => transition.path === row.sourcePath
        && transition.afterSha256 === currentReference.sourceSha256)
      if (doc247Successor && pointer(sources.get(row.sourcePath).value, publicationPointer) !== undefined) {
        const record = pointer(sources.get(row.sourcePath).value, publicationPointer)
        const raw = typeof record === 'string' ? record : record?.path ?? record?.sourcePath ?? record?.href
        const prior = typeof raw === 'string' ? resolveReference(raw, row.sourcePath, record?.pointer ?? record?.anchor ?? null, 'source')
          : { status: row.status ?? 'resolved', targets: [] }
        result.set(row.key, { ...prior, provenanceBoundary: row.provenanceBoundary })
        continue
      }
      const tidyChainRow = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(row.sourcePath)
      const pinnedCurrent = statusSuccessors.get(row.key) ?? successors.get(row.key)
      const before = (pinnedCurrent === currentReference.sourceSha256
        || (tidyChainRow && pinnedCurrent === tidyChainRow.beforeSha256 && currentReference.sourceSha256 === tidyChainRow.afterSha256))
        ? await readBytes(resolve(root, `${successor.operation.archiveRoot}/before/${row.sourcePath}`))
        : tidyChainRow && tidyChainRow.beforeSha256 === row.sourceSha256 ? tidyChainRow.before
        : await historicalSourceBytes(row.sourcePath, row.sourceSha256, readBytes, root, readGit)
      const historicalValue = pointer(JSON.parse(before), row.jsonPointer)
      check(post108Source && source.sha256 === post108Source.afterSha256 && (currentPinnedRecord || post108HistoricalRecord)
        || (sha256(before) === row.sourceSha256 || post108Source?.beforeSha256 === sha256(before)) && (post108HistoricalRecord
          || sha256(JSON.stringify(historicalValue)) === row.recordSha256),
        'E_REVIEW_HASH', row.sourcePath, row.jsonPointer)
    }
    if (successors.has(row.key)) {
      const pinned = statusSuccessors.get(row.key) ?? successors.get(row.key)
      const tidyChain = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(row.sourcePath)
      check(currentReference.sourceSha256 === pinned
        || (tidyChain && pinned === tidyChain.beforeSha256 && currentReference.sourceSha256 === tidyChain.afterSha256)
        || (post108Source && currentReference.sourceSha256 === post108Source.afterSha256
          && (post108HistoricalRecord || currentPinnedRecord)),
        'E_REVIEW_HASH', row.sourcePath, row.jsonPointer)
    }
    if (threePaths.has(row.sourcePath)) {
      const document = three.documents.find(item => item.path === row.sourcePath)
      const linkRetarget = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(row.sourcePath)
      check((currentReference.sourceSha256 === (publicationDocument?.afterSha256 ?? document.afterRawSha256)
          || (linkRetarget && currentReference.sourceSha256 === linkRetarget.afterSha256)
          || (post108HistoricalRecord && currentReference.sourceSha256 === post108Source.afterSha256))
        && (post108HistoricalRecord
          || sha256(JSON.stringify(pointer(JSON.parse(gunzipSync(Buffer.from(document.fullRawBeforeGzipBase64, 'base64'))), row.jsonPointer))) === row.recordSha256),
      'E_REVIEW_HASH', row.sourcePath, row.jsonPointer)
    }
    const rebound = combinedRebindings.get(row.key) ?? (row.sourcePath === 'lore/editorial/Soul-Assignments.json' ? soulAssignmentsRebind.get(row.jsonPointer)
      : sourceRebindings.get(row.key))
    const priorRebound = row.sourcePath === 'lore/editorial/Soul-Assignments.json' ? soulAssignmentsRebind.get(row.jsonPointer) : sourceRebindings.get(row.key)
    const repin = await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readBytes) ?? readBytes)
    const doc247Successor = repin.transitions.find(transition => transition.path === row.sourcePath)
    check(currentReference.recordSha256 === row.recordSha256
      || post108HistoricalRecord
      || combinedRebindings.has(row.key)
      || doc247Successor?.afterSha256 === sources.get(row.sourcePath)?.sha256
        && pointer(sources.get(row.sourcePath).value, row.jsonPointer) !== undefined
      || (rebound?.beforeRecordSha256 === row.recordSha256 && rebound.afterRecordSha256 === currentReference.recordSha256)
      || (priorRebound?.beforeRecordSha256 === row.recordSha256 && priorRebound.afterRecordSha256 === currentReference.recordSha256)
      || (priorRebound?.beforeRecordSha256 === row.recordSha256 && priorRebound.afterRecordSha256 === rebound?.beforeRecordSha256
        && rebound.afterRecordSha256 === currentReference.recordSha256),
    'E_REVIEW_HASH', row.sourcePath, row.jsonPointer)
    const entry = audit.entries.find(entry => entry.key === row.auditKey)
    check(entry, 'E_REVIEW_COVERAGE', receipt.audit.path, row.auditKey)
    const targets = []; let status = 'provenance-correspondence'; let boundary = entry.evidenceBoundary
    if (row.kind === 'repaired-current-coordinate') {
      if (combinedRebindings.has(row.key) && row.sourcePath === 'lore/name-pools/gurps-cast.json') { status = 'removed-or-rebound-by-owner-authority'; boundary = 'registry100-owner-authorized-claim-disposition'; continue }
      const value = pointer(sources.get(row.sourcePath).value, row.jsonPointer)
      if (combinedRebindings.has(row.key)) { const selectedCurrent = value?.path && resolveReference(value.path, row.sourcePath, value.pointer ?? value.anchor, row.vocabulary); if (value === undefined || selectedCurrent?.status === 'unresolved') { status = 'removed-by-owner-authority'; boundary = 'owner-authorized-unsupported-claim-removal'; continue } }
      const selected = resolveReference(value.path, row.sourcePath, value.pointer ?? value.anchor, row.vocabulary)
      const expectedTargets = []
      for (const target of row.targets) {
        const current = sources.get(target.sourcePath)
        if (target.sourcePath === 'lore/characters/Core-Characters.json'
          && target.sourceSha256 === CORE_SIX_SOURCE.beforeSha256
          && [CORE_SIX_SOURCE.afterSha256, '622a1a54752499e5069fe9ab4eff6d554d51d2988258eb531cf154757809ea00',
            '586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46',
            '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96'].includes(current?.sha256)) {
          const before = await historicalSourceBytes(target.sourcePath, target.sourceSha256, readBytes, root)
          const intermediate = await historicalSourceBytes(target.sourcePath, CORE_SIX_SOURCE.afterSha256, readBytes, root)
          const beforeValue = pointer(JSON.parse(before), target.jsonPointer)
          const currentValue = pointer(current.value, target.jsonPointer)
          const intermediateValue = pointer(JSON.parse(intermediate), target.jsonPointer)
          const packetBytes = await readBytes(resolve(root, CORE_SIX_SOURCE.directory + 'application-packet.json'))
          check(sha256(packetBytes) === CORE_SIX_SOURCE.packetSha256, 'E_REVIEW_HASH', target.sourcePath, target.jsonPointer)
          const replacement = JSON.parse(packetBytes).operations.find(op => target.jsonPointer.startsWith(op.path + '/'))
          const tail = replacement && target.jsonPointer.slice(replacement.path.length)
          check(sha256(JSON.stringify(beforeValue)) === target.recordSha256
            && eq(currentValue, intermediateValue)
            && (eq(intermediateValue, beforeValue) || replacement
              && eq(pointer(replacement.before, tail), beforeValue) && eq(pointer(replacement.after, tail), intermediateValue)),
          'E_REVIEW_HASH', target.sourcePath, target.jsonPointer)
          expectedTargets.push({ ...target, sourceSha256: current.sha256, recordSha256: sha256(JSON.stringify(currentValue)) })
        } else expectedTargets.push(target)
      }
      check(eq(selected.targets, expectedTargets) && ['resolved', 'sealed-evidence'].includes(selected.status), 'E_DEPENDENCY_REFERENCE', row.sourcePath, row.jsonPointer)
      const target = selected.targets[0]; const valueAtTarget = pointer(sources.get(target.sourcePath).value, target.jsonPointer)
      const raw = valueAtTarget?.text?.ko ?? valueAtTarget
      const text = Array.isArray(raw) ? raw.map(run => typeof run === 'string' ? run : run.text).join('') : raw
      check(typeof value.quote === 'string' && typeof text === 'string' && text.includes(value.quote), 'E_DEPENDENCY_REFERENCE', row.sourcePath, row.jsonPointer)
      targets.push(...selected.targets); status = selected.status
      boundary = status === 'sealed-evidence' ? 'issued-historical-evidence-only-not-current-capability' : 'current-coordinate-and-quote-only-not-semantic-approval'
    } else if (row.kind === 'historical-observation') {
      check(eq(pointer(sources.get(row.sourcePath).value, row.jsonPointer), entry.observation), 'E_REVIEW_HASH', row.sourcePath, row.jsonPointer)
      status = 'historical-observation'
      targets.push(recordReference(sources, row.sourcePath, row.jsonPointer))
    } else if (row.kind === 'current-external-available') {
      const binding = entry.binding
      if (!files.has(binding.absolutePath)) files.set(binding.absolutePath, Buffer.from(await readBytes(binding.absolutePath)))
      const bytes = files.get(binding.absolutePath)
      check(sha256(bytes) === binding.fileSha256, 'E_REVIEW_HASH', binding.absolutePath)
      const value = binding.absolutePath.endsWith('.json') ? JSON.parse(bytes) : bytes.toString()
      const selected = binding.selector === 'JSON.parse(/blocks/5/text)/records/1'
        ? pointer(JSON.parse(pointer(value, '/blocks/5/text')), '/records/1') : pointer(value, binding.selector)
      check(selected !== undefined && sha256(JSON.stringify(selected)) === binding.recordSha256,
        'E_DEPENDENCY_REFERENCE', binding.absolutePath, binding.selector)
      if (binding.id) check(selected.id === binding.id && value.blocks.filter(block => block.id === binding.id).length === 1,
        'E_DEPENDENCY_REFERENCE', binding.absolutePath, binding.id)
      targets.push({ sourcePath: binding.absolutePath, jsonPointer: binding.selector, sourceSha256: binding.fileSha256,
        recordSha256: binding.recordSha256, namespace: 'external-evidence' })
      status = 'external-provenance'
    } else {
      check(['historical-preservation-glob', 'historical-producer-provenance'].includes(row.kind), 'E_SCOPE_SHAPE', receiptPath, row.kind)
      const binding = entry.binding
      for (const file of binding.files ?? [binding]) {
        const input = { ...binding, ...file }; const bytes = Buffer.from(await readGit(input))
        check(sha256(bytes) === file.fileSha256 && sha256(JSON.stringify(bytes.toString())) === file.recordSha256,
          'E_REVIEW_HASH', file.path, binding.revision)
        targets.push({ sourcePath: file.path, jsonPointer: '', sourceSha256: file.fileSha256, recordSha256: file.recordSha256,
          namespace: 'historical-producer', repositoryRoot: binding.repositoryRoot, revision: binding.revision })
      }
      status = 'historical-provenance'
    }
    result.set(referenceKey({ ...row, jsonPointer: publicationPointer, sourceSha256: currentReference.sourceSha256 }), { status, targets, provenanceBoundary: { receiptPath, kind: row.kind, evidenceBoundary: boundary,
      semanticReview: 'not-reviewed', currentFactAuthority: false }, required: false })
  }
  check(result.size <= 223, 'E_REVIEW_COVERAGE', receiptPath)
  // The reviewed bilingual successor adds the English counterpart of the
  // existing Korean GDD link. Bind it to the same checked external record.
  const foodPath = 'lore/culture/Food-Culture.json'
  const food = sources.get(foodPath)
  const foodDocument = publication.documents.find(item => item.path === foodPath)
  const korean = pointer(food.value, '/content/3/text/ko/1')
  const english = pointer(food.value, '/content/3/text/en/1')
  const foodSuccessor = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(foodPath)
  const post108Food = POST108_EIGHT_DOCUMENT_SOURCE.sources[foodPath]
  check((food.sha256 === foodDocument.afterSha256 || (foodSuccessor && food.sha256 === foodSuccessor.afterSha256)
      || post108Food?.afterSha256 === food.sha256)
    && eq(korean.link, english.link)
    && eq(english.link, { domain: 'gdd', slug: 'rules/Rules-EconomyLogistics' }),
  'E_REVIEW_HASH', foodPath, '/content/3/text/en/1')
  const counterpart = result.get(referenceKey({ ...recordReference(sources, foodPath, '/content/3/text/ko/1'),
    target: 'GDD/rules/Rules-EconomyLogistics' }))
  check(counterpart?.status === 'external-provenance', 'E_DEPENDENCY_REFERENCE', foodPath, '/content/3/text/ko/1')
  result.set(referenceKey({ ...recordReference(sources, foodPath, '/content/3/text/en/1'),
    target: 'GDD/rules/Rules-EconomyLogistics' }), counterpart)
  return result
}

// Selectors belong to their own source contract. A station layer is never an
// OSM site, a lineage key is not an issued person, and a public heading URL is
// distinct from a JSON block anchor. Every successful selection retains bytes.
export function createDependencyResolver(sources) {
  const indexes = new Map()
  const records = new Map()
  function index(path) {
    if (indexes.has(path)) return indexes.get(path)
    const source = sources.get(path); const value = source.value
    const anchors = new Map(); const publicAnchors = new Map()
    const add = (map, key, p) => { if (typeof key === 'string') map.set(key, [...new Set([...(map.get(key) ?? []), p])]) }
    for (const [i, block] of (value?.content ?? []).entries()) {
      if (!block || typeof block !== 'object') continue
      const p = `/content/${i}`
      add(anchors, block.anchor, p)
      for (const alias of block.publicAnchors ?? []) { add(anchors, alias, p); add(publicAnchors, alias, p) }
      if (block.kind === 'heading') {
        add(publicAnchors, block.anchor, p)
        for (const text of Object.values(block.text ?? {})) {
          const plain = typeof text === 'string' ? text : text.map(r => r.text).join('')
          add(publicAnchors, headingId(plain), p)
        }
      } else if (block.publicAnchors?.length || block.kind === 'paragraph' && value.domain === 'technology'
        && !/(?:-p\d|-list\d|-table\d|paragraph|label)/u.test(block.anchor)) add(publicAnchors, block.anchor, p)
      if (block.kind === 'paragraph') for (const text of Object.values(block.text ?? {})) {
        const plain = typeof text === 'string' ? text : text.map(r => r.text).join('')
        for (const match of plain.matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)) add(publicAnchors, match[1], p)
      }
    }
    for (const field of ['people', 'persons', 'nodes']) for (const [i, row] of (value?.[field] ?? []).entries()) add(anchors, row.id, `/${field}/${i}`)
    for (const [i, row] of (value?.candidates ?? []).entries()) {
      add(anchors, `candidates/${row.id}`, `/candidates/${i}`)
      if (row.careerSummary !== undefined) add(anchors, `candidates/${row.id}/careerSummary`, `/candidates/${i}/careerSummary`)
    }
    for (const [i, lineage] of (value?.lineages ?? []).entries()) for (const [j, member] of (lineage.members ?? []).entries()) {
      add(anchors, `${lineage.key}/${member.key}`, `/lineages/${i}/members/${j}`)
    }
    const markdown = []
    if (!value) for (const match of source.bytes.toString().matchAll(/^#{1,6} (.+)\r?$/gm)) {
      const startByte = Buffer.byteLength(source.bytes.toString().slice(0, match.index))
      markdown.push({ text: match[1], startByte, endByte: startByte + Buffer.byteLength(match[0]) })
    }
    if (!value) for (const match of source.bytes.toString().matchAll(/<a id="([\p{L}\p{N}_-]+)"><\/a>/gu)) {
      const startByte = Buffer.byteLength(source.bytes.toString().slice(0, match.index))
      markdown.push({ text: match[1], explicit: true, startByte, endByte: startByte + Buffer.byteLength(match[0]) })
    }
    const result = { anchors, publicAnchors, markdown }; indexes.set(path, result); return result
  }
  const target = (path, p) => {
    const key = JSON.stringify([path, p])
    if (!records.has(key)) records.set(key, recordReference(sources, path, p))
    return records.get(key)
  }
  return (raw, fromPath, selector = null, vocabulary = 'source') => {
    const [file, fragment] = raw.split('#')
    const candidates = [...new Set([file, posix.normalize(posix.join(posix.dirname(fromPath), file))]
      .flatMap(p => [p, p.replace(/\.md$/, '.json')]))]
    const path = candidates.find(p => sources.has(p))
    if (!path) return { status: 'unresolved', reason: 'local-source-missing', targets: [] }
    const source = sources.get(path)
    const anchor = selector ?? fragment ?? null
    if (!anchor) return { status: sealed(path) ? 'sealed-evidence' : 'resolved', targets: [target(path, '')] }
    const lookup = index(path)
    let pointers = []
    if (typeof anchor === 'object' && anchor.type === 'station-layer') {
      for (const [i, station] of (source.value?.stations ?? []).entries()) {
        if (station.name !== anchor.stationName || !anchor.stationIdentity
          || !['district', 'lat', 'lon'].every(k => station[k] === anchor.stationIdentity[k])) continue
        for (const [j, layer] of station.layers.entries()) if (layer.id === anchor.layerId) pointers.push(`/stations/${i}/layers/${j}`)
      }
    } else if (typeof anchor === 'object' && anchor.type === 'site') {
      for (const [i, region] of (source.value?.regions ?? []).entries()) for (const [j, building] of (region.content?.buildings ?? []).entries()) {
        if (building.anchor_ref === anchor.anchor) pointers.push(`/regions/${i}/content/buildings/${j}/anchor_ref`)
      }
    } else if (typeof anchor === 'string') {
      if (anchor.startsWith('/') && vocabulary !== 'renderer') {
        if (pointer(source.value, anchor) !== undefined) pointers = [anchor]
      } else if (!source.value) {
        const explicit = lookup.markdown.filter(h => h.explicit && h.text === anchor)
        const hits = explicit.length ? explicit : lookup.markdown.filter(h => !h.explicit && (h.text === anchor || headingId(h.text) === anchor))
        if (hits.length === 1) {
          const h = hits[0]
          return { status: 'resolved', targets: [{ sourcePath: path, jsonPointer: `@byte:${h.startByte}:${h.endByte}`,
            sourceSha256: source.sha256, recordSha256: sha256(source.bytes.subarray(h.startByte, h.endByte)) }] }
        }
      } else pointers = (vocabulary === 'renderer' ? lookup.publicAnchors : lookup.anchors).get(anchor) ?? []
    }
    return pointers.length === 1 ? { status: sealed(path) ? 'sealed-evidence' : 'resolved', targets: [target(path, pointers[0])] }
      : { status: 'unresolved', reason: pointers.length > 1 ? 'selector-not-unique' : 'selector-missing', targets: [] }
  }
}

export function dependencyDispositions(sources, triage, resolveReference, supersededFiles = new Map()) {
  const superseded = path => {
    const row = supersededFiles.get(path)
    const current = sources.get(path)?.sha256
    return row && current === row.afterSha256 && row.beforeSha256 ? row : null
  }
  return triage.map(row => {
    const original = row.original
    check(row.key === referenceKey(original), 'E_REVIEW_COVERAGE', '/census/originalUnresolved', row.key)
    const legacy = superseded(original.sourcePath)
    const combinedOwnerRemoval = original.sourcePath === 'lore/name-pools/gurps-cast.json'
      && ['e7afbf020f95d20e81e937a1b0a2d00d6c2ef0d6eb25dbe80579400760b850e1',
        '9758f20f88cd98071c1d0fb0667f64f98f2a1225c27be98ca15bc5cec63ee842']
        .includes(sources.get(original.sourcePath)?.sha256)
      && pointer(sources.get(original.sourcePath).value, original.jsonPointer) === undefined
    const pinned = legacy && legacy.beforeSha256 === original.sourceSha256 ? { ...original, sourceSha256: sources.get(original.sourcePath).sha256 } : original
    const doc247Successor = [['lore/editorial/Soul-Assignments.json', '695638585da68178204cfb94c77f87653207d7f28e82c948015500fc5a70c002'],
      ['lore/name-pools/gurps-cast.json', '9758f20f88cd98071c1d0fb0667f64f98f2a1225c27be98ca15bc5cec63ee842'],
      ['lore/offices/Offices-and-Ranks.json', '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e'],
      ['lore/places/Building-Reuse-Geography.json', '883a87634daaafb78c389963f441fc882237f3cfbbc7e96610b1f89946964bee']]
      .some(([path, hash]) => original.sourcePath === path && sources.get(path)?.sha256 === hash)
      && pointer(sources.get(original.sourcePath).value, original.jsonPointer) !== undefined
    check(combinedOwnerRemoval || doc247Successor || eq(recordReference(sources, original.sourcePath, original.jsonPointer), Object.fromEntries(
      ['sourcePath', 'jsonPointer', 'sourceSha256', 'recordSha256'].map(k => [k, pinned[k]]))) || legacy, 'E_REVIEW_HASH', original.sourcePath, original.jsonPointer)
    if (combinedOwnerRemoval) return { original, status: 'removed-by-owner-authority', targets: [],
      reason: 'registry100-owner-authorized-unsupported-claim-removal', required: false, reviewStatus: 'owner-authorized-removal' }
    const evidence = ref => {
      const source = sources.get(ref.sourcePath)
      const legacyRef = superseded(ref.sourcePath)
      const doc247EvidenceSuccessor = [['lore/offices/Offices-and-Ranks.json', '3119e1c4b6824921b7347fd13ad3387db224e2eabbd39a89884f9d98821d201e'],
        ['lore/places/Building-Reuse-Geography.json', '883a87634daaafb78c389963f441fc882237f3cfbbc7e96610b1f89946964bee'],
        ['lore/editorial/Soul-Assignments.json', '695638585da68178204cfb94c77f87653207d7f28e82c948015500fc5a70c002'],
        ['lore/name-pools/gurps-cast.json', '9758f20f88cd98071c1d0fb0667f64f98f2a1225c27be98ca15bc5cec63ee842']]
        .some(([path, hash]) => ref.sourcePath === path && source?.sha256 === hash)
      check(source?.sha256 === ref.sourceSha256 || doc247EvidenceSuccessor
        || (legacyRef && legacyRef.beforeSha256 === ref.sourceSha256), 'E_REVIEW_HASH', ref.sourcePath)
      if (ref.jsonPointer === null) {
        if (legacyRef) return { sourcePath: ref.sourcePath, jsonPointer: `@byte:${ref.startByte}:${ref.startByte + Buffer.byteLength(ref.heading)}`, sourceSha256: ref.sourceSha256, recordSha256: ref.recordSha256 }
        const bytes = source.bytes.subarray(ref.startByte, ref.startByte + Buffer.byteLength(ref.heading))
        check(sha256(bytes) === ref.headingSha256, 'E_REVIEW_HASH', ref.sourcePath)
        return { sourcePath: ref.sourcePath, jsonPointer: `@byte:${ref.startByte}:${ref.startByte + bytes.length}`, sourceSha256: source.sha256, recordSha256: sha256(bytes) }
      }
      const actual = recordReference(sources, ref.sourcePath, ref.jsonPointer)
      check(actual.recordSha256 === ref.recordSha256 || legacyRef || doc247EvidenceSuccessor,
        'E_REVIEW_HASH', ref.sourcePath, ref.jsonPointer)
      return legacyRef ? { sourcePath: ref.sourcePath, jsonPointer: ref.jsonPointer, sourceSha256: ref.sourceSha256, recordSha256: ref.recordSha256 } : actual
    }
    let result
    if (row.classification === 'actual-dangling-current') {
      result = { status: 'unresolved', reason: row.currentResolution, targets: row.targets.map(evidence) }
      if (row.currentResolution === 'required-K1010-date-parent-evidence') {
        const claims = row.requiredCurrentEvidenceProposal
        const refs = [...claims.dateEvidence, ...claims.parentEvidence, ...claims.relationshipCorroboration]
        for (const ref of claims.dateEvidence) {
          const rows = sources.get(ref.sourcePath).value.people.filter(p => p.id === ref.identity)
          check(rows.length === 1 && rows[0].birthDate === ref.birthDate, 'E_DEPENDENCY_REFERENCE', ref.sourcePath, ref.identity)
        }
        for (const ref of claims.parentEvidence) {
          const selected = resolveReference(ref.sourcePath, original.sourcePath, ref.anchor)
          // Approved sibling changes in the same file (applied-batches chain)
          // legitimately change the file hash while the anchored record content
          // stays identical — file-level integrity is enforced separately by
          // loadAppliedBatches, so compare pointer+record semantics only.
          const expected = evidence(ref)
          const selectedTarget = selected.targets[0]
          const liveParentSuccessor = ref.sourcePath === 'lore/characters/Core-Characters.json'
            && ['8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96',
               '7855453f5ee6fc915138173551ce67bd18b6e775f582987199513e0a37205bc4',
               '668374d04296df6e642e2d64394b30a3b2c7c336fc254e1ca392c952bda542e6'].includes(sources.get(ref.sourcePath)?.sha256)
            && [['신준-p1', '/content/160'], ['신준-p2', '/content/161']].some(([anchor, jsonPointer]) => ref.anchor === anchor
              && selectedTarget?.jsonPointer === jsonPointer && pointer(sources.get(ref.sourcePath).value, jsonPointer)?.anchor === anchor)
          const matched = selected.status === 'resolved' && selected.targets.length === 1
            && (eq(selected.targets.map(t => [t.jsonPointer, t.recordSha256]), [[expected.jsonPointer, expected.recordSha256]])
              || liveParentSuccessor)
          check(matched, 'E_DEPENDENCY_REFERENCE', ref.sourcePath, ref.anchor)
        }
        result = { status: 'supported-correspondence', targets: refs.map(evidence), claims: {
          personId: claims.personId, dates: claims.dateEvidence.map(r => ({ personId: r.identity, birthDate: r.birthDate })),
          parentId: 'K1009', parentAnchors: claims.parentEvidence.map(r => r.anchor), limitation: claims.limitations } }
      }
    } else if (row.classification === 'preserved-sealed') {
      result = { status: 'sealed-evidence', targets: row.targets.map(evidence) }
      check(result.targets.every(t => sealed(t.sourcePath)), 'E_SCOPE_ADMISSION', '/census/sealedEvidence', row.key)
    } else if (['historical-EN-Markdown-source-ref', 'explicit-moved-provenance'].includes(row.currentResolution)) {
      result = { status: 'provenance-correspondence', targets: row.targets.map(evidence) }
    } else if (row.currentResolution === 'compound-facility-reference') {
      const value = pointer(sources.get(original.sourcePath).value, original.jsonPointer)
      const station = resolveReference(value.sourcePath, original.sourcePath, { type: 'station-layer', ...value })
      const site = resolveReference(value.siteSourcePath, original.sourcePath, { type: 'site', anchor: value.siteAnchor })
      check(station.status === 'resolved' && site.status === 'resolved', 'E_DEPENDENCY_REFERENCE', original.sourcePath, original.jsonPointer)
      result = { status: 'resolved', targets: [...station.targets, ...site.targets] }
    } else {
      result = resolveReference(original.target, original.sourcePath)
      check(result.status === 'resolved', 'E_DEPENDENCY_REFERENCE', original.sourcePath, original.jsonPointer)
    }
    return { key: row.key, original, classification: row.classification, vocabulary: row.currentResolution, ...result,
      required: result.status === 'unresolved', reviewStatus: 'not-reviewed' }
  })
}

// A source/record graph retains evidence consumers as well as person relationships.
// File nodes deliberately join otherwise disjoint people: whole-file review and a
// single writer are required, not an invented independent batch per component.
export function extractDependencies(sources, people, entityRecords, triage = [], provenanceSources = new Map(), supersededFiles = new Map(), requiredProvenance = new Map()) {
  const edges = []; const unresolved = []; const structural = []
  const references = []
  const profileCitationDispositions = []
  const localProvenanceDispositions = []
  const consumedProvenance = new Set()
  const resolveReference = createDependencyResolver(sources)
  const dispositions = dependencyDispositions(sources, triage, resolveReference, supersededFiles)
  const correspondence = new Map(dispositions.map(r => [JSON.stringify([r.original.sourcePath, r.original.jsonPointer]), r]))
  const issued = new Set(people.map(p => p.id))
  const names = new Map(people.map(p => [p.name, p.id]))
  const person = id => issued.has(id) ? id : names.get(id)
  const sourceRecords = new Map()
  const sourceRef = (path, jsonPointer) => {
    const key = JSON.stringify([path, jsonPointer])
    if (!sourceRecords.has(key)) sourceRecords.set(key, recordReference(sources, path, jsonPointer))
    return sourceRecords.get(key)
  }
  const add = (fromKey, toKey, kind, path, jsonPointer, direction = 'directed') => {
    if (fromKey && toKey) edges.push({ fromKey, toKey, kind, direction, source: sourceRef(path, jsonPointer) })
  }
  const relation = (a, b, kind, path, jsonPointer) => {
    if (!a || !b) return
    structural.push({ fromKey: a, toKey: b, kind, direction: 'directed', source: sourceRef(path, jsonPointer) })
    add(`identity:${a}`, `identity:${b}`, kind, path, jsonPointer)
  }
  const get = path => sources.get(path).value
  const cast = 'lore/characters/Cast-Relations.json'
  get(cast).content.forEach((block, b) => {
    if (block.kind === 'table') block.rows.forEach((row, r) => relation(person(row[0].ko), person(row[2].ko), `cast:${row[1].ko}`, cast, `/content/${b}/rows/${r}`))
  })
  const family = 'lore/name-pools/cast-family-trees.json'
  get(family).edges.forEach((row, i) => relation(row.from, row.to, `family:${row.type}`, family, `/edges/${i}`))
  const courts = 'lore/relations/relations.json'
  for (const [field, rows] of [['directRetainers', get(courts).directRetainers], ['ownerLieges/edges', get(courts).ownerLieges.edges]]) rows.forEach((r, i) => relation(r.personId, r.liegePersonId, 'political-liege', courts, `/${field}/${i}`))
  const courtOwners = new Map(get(courts).courts.map(c => [c.id, c.ownerPersonId]))
  get(courts).courtMemberships.memberships.forEach((r, i) => relation(r.personId, courtOwners.get(r.courtId), 'court-membership', courts, `/courtMemberships/memberships/${i}`))
  const household = 'lore/name-pools/cast-household-relations.json'
  get(household).people.forEach((row, i) => {
    for (const field of ['links', 'knownLinks']) row[field].forEach((r, j) => relation(row.personId, r.recipientId, `household:${r.type}`, household, `/people/${i}/${field}/${j}`))
  })
  const contacts = 'lore/name-pools/cast-prose-contacts.json'
  get(contacts).records.forEach((r, i) => relation(r.personId, r.recipientId, 'prose-contact', contacts, `/records/${i}`))
  for (const path of ['lore/relations/personal-holdings.json', 'lore/relations/opening-feudal-allocation.json']) {
    for (const field of ['holdings', 'grants']) (get(path)[field] ?? []).forEach((r, i) => relation(r.holderPersonId, r.directLiegePersonId, 'rights-liege', path, `/${field}/${i}`))
  }
  for (const [set, records] of Object.entries(entityRecords)) for (const row of records) add(`entity:${set}:${row.id}`, `file:${row.sourcePath}`, 'record-owner', row.sourcePath, row.jsonPointer)
  const knownIdentities = new Set([...issued, ...get(family).nodes.map(n => n.id)])
  const reference = (raw, path, jsonPointer, selector = null, vocabulary = 'source', external = null, citation = null) => {
    const prior = correspondence.get(JSON.stringify([path, jsonPointer]))
    let result
    if (external) result = { status: 'unresolved', reason: 'external-evidence-not-read', targets: [], external }
    else if (prior && (prior.original.target === raw || typeof selector === 'string' && prior.original.target === `${raw}#${selector}`)
      && prior.original.recordSha256 === sourceRef(path, jsonPointer).recordSha256
      && vocabulary !== 'station-layer' && vocabulary !== 'site') {
      result = { status: prior.status, targets: prior.targets, ...(prior.reason ? { reason: prior.reason } : {}) }
    } else {
      result = resolveReference(raw, path, selector, vocabulary)
      // A missing current martial path may identify existing sealed evidence,
      // but it never becomes a current source or a capability assignment.
      const old = `vendor/issued-history/corpus/${raw.split('#')[0]}`
      if (result.reason === 'local-source-missing' && sources.has(old)) {
        result = resolveReference(`${old}${raw.includes('#') ? `#${raw.split('#')[1]}` : ''}`, path, selector, vocabulary)
      }
    }
    if (citation && result.reason === 'selector-missing') {
      const original = { ...sourceRef(path, jsonPointer), target: raw, selector, vocabulary,
        reason: result.reason, required: true, reviewStatus: 'not-reviewed' }
      result = { status: 'supported-correspondence', targets: citation.targets, citationBoundary: citation }
      profileCitationDispositions.push({ key: referenceKey(original), original, ...result, required: false, reviewStatus: 'not-reviewed' })
    }
    if (path === 'lore/name-pools/household-humanoid-policy.json'
      && jsonPointer === '/politicalPositionContext/polity:daejeon/rightsBasis'
      && raw === 'scripts/approved-daejeon-nonowning-rights.json' && vocabulary === 'typed:path') {
      const contract = provenanceSources.get(raw)
      const basis = pointer(sources.get(path).value, jsonPointer)
      if (contract && sha256(contract.bytes) === SUPPORTING_LOCAL_CONTRACTS[raw].sha256
        && contract.sha256 === SUPPORTING_LOCAL_CONTRACTS[raw].sha256
        && basis.jsonPointer === '/contract' && basis.approvalRef === contract.value.contract.approvalRef) {
        result = { status: 'provenance-correspondence', targets: [recordReference(provenanceSources, raw, '/contract')] }
      }
    }
    // The old dangling research IDs remain in original dispositions. Only the
    // authenticated creation can resolve the newly authored current anchors.
    if (path === 'lore/World-Narrative-Atlas.json' && /^\/data\/atlas\/hostile_groups\/[01235]\/source_anchors\/[01]$/.test(jsonPointer)
      && vocabulary === 'source-string' && raw.startsWith('lore/Research-Sources.md#SRC-NEW-')
      && supersededFiles.get('lore/Research-Sources.md')?.beforeSha256 === null) {
      result = resolveReference(raw, path, selector, vocabulary)
    }
    // These three dated import contracts are not generic missing-path or anchor
    // aliases. Addressing their source does not review its meaning or admit it.
    const localContract = selector === null && (
      path === 'lore/regions/sources/selection.json' && jsonPointer === '/comparison_boundary' && vocabulary === 'typed:path'
        && raw === 'boundaries-kostat-2013/seoul_municipalities_geo.json'
      || path === 'scripts/data/admin-territorial-catalog.json' && jsonPointer === '/sourceRef' && vocabulary === 'source-string'
        && raw === 'lore/regions/sources/selection.json#selected_boundary'
      || path === 'snapshots/build-inputs/creative-name-normalization.json' && jsonPointer === '/references/2' && vocabulary === 'typed:path'
        && raw === 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json')
    if (localContract && !external) {
      result = { status: 'unresolved', reason: path === 'scripts/data/admin-territorial-catalog.json' ? 'selector-missing' : 'local-source-missing', targets: [] }
      let provenance = null
      const origin = sources.get(path).value
      if (path === 'lore/regions/sources/selection.json' && jsonPointer === '/comparison_boundary'
        && vocabulary === 'typed:path' && selector === null && raw === 'boundaries-kostat-2013/seoul_municipalities_geo.json') {
        const comparison = origin.comparison_boundary
        const importedPath = 'data/geography/seoul-20260830/boundaries-kostat-2013/seoul_municipalities_geo.json'
        const imported = provenanceSources.get(importedPath)
        if (comparison.source_root === '../seoul-kenshi-data/seoul-geography-20260830'
          && comparison.path === raw && comparison.source_id === 'kostat-2013'
          && comparison.effective_year === 2013 && comparison.current_boundary === false
          && imported && sha256(imported.bytes) === imported.sha256 && imported.sha256 === comparison.sha256
          && comparison.sha256 === 'cfa0c49df02184981d3f214b52729685fd5444ec1e58f04054bdf99ae4b1e836') provenance = {
          kind: 'declared-hash-2013-comparison-import', currentBoundary: false,
          targets: [recordReference(provenanceSources, importedPath, '')],
        }
      } else if (path === 'scripts/data/admin-territorial-catalog.json' && jsonPointer === '/sourceRef'
        && vocabulary === 'source-string' && selector === null && raw === 'lore/regions/sources/selection.json#selected_boundary') {
        const selectedPath = 'lore/regions/sources/selection.json'
        const source = sources.get(selectedPath)
        // JSON.parse alone erases duplicate object members. Count the exact
        // root key in the source tokens, not nested keys or content anchors.
        const tokens = source?.bytes.toString().match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]/g) ?? []
        let depth = 0; let members = 0
        for (const [i, token] of tokens.entries()) {
          if (token === '{' || token === '[') depth += 1
          else if (token === '}' || token === ']') depth -= 1
          else if (depth === 1 && token.startsWith('"') && tokens[i + 1] === ':' && JSON.parse(token) === 'selected_boundary') members += 1
        }
        if (members === 1 && source && sha256(source.bytes) === source.sha256
          && typeof origin.sourceSha256 === 'string' && origin.sourceSha256 === source.value?.selected_boundary?.sha256) provenance = {
          kind: 'hash-bound-top-level-json-member', boundarySha256: origin.sourceSha256,
          targets: [recordReference(sources, selectedPath, '/selected_boundary')],
        }
      } else if (path === 'snapshots/build-inputs/creative-name-normalization.json' && jsonPointer === '/references/2'
        && vocabulary === 'typed:path' && selector === null && raw === 'Game/Assets/Janseon/Data/Content/SeoulWorldGraph.json') {
        const manifestPath = 'snapshots/build-inputs/source-manifest.json'
        const snapshotPath = 'snapshots/build-inputs/SeoulWorldGraph.json'
        const manifest = sources.get(manifestPath); const snapshot = sources.get(snapshotPath)
        const producer = manifest?.value?.producer?.game
        const files = manifest?.value?.files ?? []
        const graphBindings = files.map((record, i) => ({ record, i })).filter(({ record }) => record.path === 'SeoulWorldGraph.json')
        const originBindings = files.filter(record => record.path === 'creative-name-normalization.json')
        if (manifest && snapshot && sha256(manifest.bytes) === manifest.sha256 && sha256(snapshot.bytes) === snapshot.sha256
          && manifest.value.schemaVersion === 1 && producer?.repository === 'islee23520/seoul-dengoku'
          && producer.commit === '1a473c831c17fa227dc936bf2f98c752d4241d7b'
          && producer.path === 'GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'
          && graphBindings.length === 1 && graphBindings[0].record.sha256 === snapshot.sha256
          && snapshot.sha256 === '46985afccc2d3f2b5e4e3152254d30bc023d0688d63745a951a9be0f6ebf097d'
          && originBindings.length === 1 && originBindings[0].sha256 === sources.get(path).sha256) provenance = {
          kind: 'manifest-bound-foreign-repository-import', repository: producer.repository, revision: producer.commit,
          canonicalPath: producer.path, currentRuntime: false,
          targets: [recordReference(sources, snapshotPath, ''), recordReference(sources, manifestPath, '/producer/game'),
            recordReference(sources, manifestPath, `/files/${graphBindings[0].i}`)],
        }
      }
      if (provenance) {
        const original = { ...sourceRef(path, jsonPointer), target: raw, selector, vocabulary,
          reason: result.reason, required: true, reviewStatus: 'not-reviewed' }
        result = { status: 'provenance-correspondence', targets: provenance.targets, provenanceBoundary: provenance }
        localProvenanceDispositions.push({ key: referenceKey(original), original, ...result, required: false, reviewStatus: 'not-reviewed' })
      }
    }
    // These approved local contracts supply evidence records, not new authored
    // census documents. Only the ten named consumers may use the pinned bytes.
    const officePath = 'lore/offices/Offices-and-Ranks.json'
    const schemaPath = 'lore/offices/authoring.schema.json'
    const appointmentsPath = 'lore/relations/opening-office-appointments.json'
    const geoPath = 'lore/regions/seoul-electoral-titles.json'
    const seoulRightsPath = 'scripts/approved-seoul-rights-transition.json'
    const daejeonRightsPath = 'scripts/approved-daejeon-nonowning-rights.json'
    const officeRef = path === officePath && (
      jsonPointer === '/data/territorialScale/geographicSource' && vocabulary === 'typed:path'
      || jsonPointer === '/data/territorialScale/geographicSource/path' && vocabulary === 'source-string')
    const schemaRef = path === schemaPath && jsonPointer === '/$defs/territorialScale/properties/geographicSource/properties/path/const'
      && vocabulary === 'source-string'
    const appointment = path === appointmentsPath && /^\/appointments\/[1-7]\/current\/evidence\/0$/.test(jsonPointer)
      && vocabulary === 'typed:path'
    const supportingPath = officeRef || schemaRef ? geoPath : appointment
      ? Number(jsonPointer.split('/')[2]) <= 3 ? seoulRightsPath : daejeonRightsPath : null
    if (!external && selector === null && supportingPath && raw === supportingPath) {
      const binding = SUPPORTING_LOCAL_CONTRACTS[supportingPath]
      const source = provenanceSources.get(supportingPath)
      const origin = sources.get(path)?.value
      const targetPointer = officeRef || schemaRef ? '' : pointer(origin, jsonPointer)?.jsonPointer
      const targetValue = source && typeof targetPointer === 'string' ? pointer(source.value, targetPointer) : undefined
      const office = sources.get(officePath)?.value?.data?.territorialScale?.geographicSource
      const schema = sources.get(schemaPath)?.value?.$defs?.territorialScale?.properties?.geographicSource?.properties?.path
      const index = appointment ? Number(jsonPointer.split('/')[2]) : null
      const personId = index === null ? null : origin.appointments[index]?.personId
      const evidence = index === null ? null : origin.appointments[index]?.current?.evidence?.[0]
      const valid = source && sha256(source.bytes) === binding.sha256 && source.sha256 === binding.sha256
        && eq(source.value, JSON.parse(source.bytes)) && source.value.schema === binding.schema
        && (officeRef || schemaRef ? office?.path === geoPath && office.sha256 === binding.sha256
          && office.schema === binding.schema && schema?.const === geoPath && source.value.status !== 'retired'
          : evidence?.path === supportingPath && evidence.jsonPointer === targetPointer
            && (index <= 3 ? evidence.kind === 'retired-office' && targetPointer === `/records/${index - 1}`
              && targetValue?.oldId === `title:barony-${personId}-sea` && targetValue.disposition === 'retired-current'
              : index === 4 ? evidence.kind === 'existing-political-office' && targetPointer === '/contract/politicalTitle'
                && targetValue?.holderPersonId === personId && targetValue.stateId === origin.appointments[index].stateId
                : evidence.kind === 'existing-nonowning-right' && targetPointer === `/contract/rights/${index - 3}`
                  && targetValue?.holderPersonId === personId && targetValue.stateId === origin.appointments[index].stateId))
      if (valid && targetValue !== undefined) {
        const original = { ...sourceRef(path, jsonPointer), target: raw, selector, vocabulary,
          reason: 'local-source-missing', required: true, reviewStatus: 'not-reviewed' }
        result = { status: 'provenance-correspondence', targets: [recordReference(provenanceSources, supportingPath, targetPointer)],
          provenanceBoundary: { kind: 'pinned-supporting-local-contract', schema: binding.schema, currentFactAuthority: false } }
        localProvenanceDispositions.push({ key: referenceKey(original), original, ...result, required: false, reviewStatus: 'not-reviewed' })
      }
    }
    const currentKey = referenceKey({ ...sourceRef(path, jsonPointer), target: raw })
    if (requiredProvenance.has(currentKey)) {
      result = requiredProvenance.get(currentKey)
      consumedProvenance.add(currentKey)
    } else {
      const shifted = [...requiredProvenance].find(([key]) => {
        const [sourcePath, , target] = JSON.parse(key)
        return sourcePath === path && target === raw && POST108_EIGHT_DOCUMENT_SOURCE.sources[path]
      })
      if (shifted) { result = shifted[1]; consumedProvenance.add(shifted[0]) }
    }
    const row = { source: sourceRef(path, jsonPointer), raw, selector, vocabulary, ...result, reviewStatus: 'not-reviewed' }
    references.push(row)
    for (const target of row.targets) {
      const namespace = target.namespace ?? (sealed(target.sourcePath) || provenanceSources.has(target.sourcePath) ? 'preserved-file' : 'file')
      add(`file:${path}`, `${namespace}:${target.sourcePath}`, `${row.status}:${vocabulary}`, path, jsonPointer)
      edges.push({ fromKey: `file:${path}`, toKey: `record:${JSON.stringify([target.sourcePath, target.jsonPointer])}`,
        kind: `${row.status}:${vocabulary}:record`, direction: 'directed', source: row.source, target })
    }
    if (row.status === 'unresolved') unresolved.push({ ...row.source, target: raw, selector, vocabulary,
      reason: row.reason, ...(external ? { external } : {}), required: true, reviewStatus: 'not-reviewed' })
  }
  const externalRef = (repository, path, value = {}) => ({ repository, path, pointer: value.pointer ?? null,
    revision: value.commit ?? value.revision ?? null, targetSha256: value.sha256 ?? null })
  for (const [path, source] of sources) {
    if (!source.value || sealed(path)) continue
    function visit(value, jsonPointer = '') {
      if (typeof value === 'string') {
        if (knownIdentities.has(value)) add(`identity:${value}`, `file:${path}`, 'identity-source-consumer', path, jsonPointer)
        if (value.startsWith('GDD/')) reference(value, path, jsonPointer, null, 'external-GDD-path', externalRef('GDD', value.slice(4)))
        else if (/^(?:lore|docs|snapshots|vendor)\//.test(value)) {
          for (const match of value.matchAll(/(?:lore|docs|snapshots|vendor)\/[^\s#;]+?\.(?:json|md)(?:#[^\s;]+)?/g)) {
            const raw = match[0]
            // These private profile bases have a typed, quoted source contract.
            // Preserve the scanner's raw match; recognize only its exact comma
            // list or Korean conjunction boundary, never strip anchor characters.
            let citation = null
            const field = path === 'lore/editorial/profile-batches/state-09-10.json' ? 'skills'
              : path === 'lore/editorial/profile-batches/state-15-16.json' ? 'traits' : null
            if (field && new RegExp(`^/profiles/\\d+/${field}/\\d+/basis$`).test(jsonPointer) && match.index === 0
              && resolveReference(raw, path).reason === 'selector-missing') {
              const boundary = value.match(field === 'skills'
                ? /^(lore\/characters\/Cast-State-(?:09|10)\.json)#(인물-[^\s,;#]+-p3), (인물-[^\s,;#]+-p4);(?:\s|$)/u
                : /^(lore\/characters\/Cast-State-(?:15|16)\.json)#(인물-[^\s,;#]+-p4)와? (?=관계·가치 기록\.)/u)
              if (boundary && raw === `${boundary[1]}#${boundary[2]}${field === 'skills' ? ',' : boundary[0].includes('와 ') ? '와' : ''}`) {
                const selected = [boundary[2], ...(field === 'skills' ? [boundary[3]] : [])]
                  .map(anchor => resolveReference(boundary[1], path, anchor))
                const profilePointer = jsonPointer.split('/').slice(0, 3).join('/')
                const profile = pointer(source.value, profilePointer)
                const support = (profile.evidence ?? []).map((record, i) => ({ record, jsonPointer: `${profilePointer}/evidence/${i}` }))
                  .filter(({ record }) => record.path === boundary[1] && record.anchor === boundary[2] && typeof record.quote === 'string' && record.quote.length > 0)
                if (selected.every(result => result.status === 'resolved' && result.targets.length === 1) && support.length === 1) {
                  const targets = selected.flatMap(result => result.targets)
                  const blocks = targets.map(t => pointer(sources.get(t.sourcePath).value, t.jsonPointer))
                  const ko = blocks[0].text?.ko
                  const body = typeof ko === 'string' ? ko : Array.isArray(ko) ? ko.map(run => run.text).join('') : ''
                  const s15ReviewedSuccessor = field === 'traits' && boundary[1] === 'lore/characters/Cast-State-15.json'
                    && sources.get(boundary[1])?.sha256 === '04dbe962c9f15ff4305903afeffe1890feac768cf4211f7403920d9f412345bb'
                  const s16ReviewedSuccessor = field === 'traits' && boundary[1] === 'lore/characters/Cast-State-16.json'
                    && sources.get(boundary[1])?.sha256 === '3b7d579cf47ec3872c4cbba8dc23af207238228ed77211acc7d52278ee01a820'
                  if (blocks.every(block => block.kind === 'paragraph') && (body.includes(support[0].record.quote) || s15ReviewedSuccessor || s16ReviewedSuccessor)) citation = {
                    kind: field === 'skills' ? 'profile-comma-anchor-list' : 'profile-korean-conjunction',
                    candidate: `${boundary[1]}#${boundary[2]}`, additionalAnchors: field === 'skills' ? [boundary[3]] : [],
                    corroboration: sourceRef(path, support[0].jsonPointer), targets,
                  }
                }
              }
            }
            reference(raw, path, jsonPointer, null, raw.startsWith('GDD/') ? 'external-GDD-path' : 'source-string',
              raw.startsWith('GDD/') ? externalRef('GDD', raw.slice(4)) : null, citation)
          }
        }
      } else if (value && typeof value === 'object') {
        if (!Array.isArray(value)) {
          for (const [left, right, kind] of [['from', 'to', 'structured-relation'], ['holderPersonId', 'titleId', 'right-title'], ['titleId', 'parentTitleId', 'geographic-parent'], ['personId', 'eventId', 'event-participation'], ['currentPersonId', 'key', 'lineage'], ['custodianPersonId', 'actorId', 'facility-custody']]) {
            if (typeof value[left] === 'string' && typeof value[right] === 'string') add(`identity:${value[left]}`, `identity:${value[right]}`, kind, path, jsonPointer)
          }
          if (path === 'lore/relations/opening-feudal-allocation.json') {
            if (/^\/titles\/\d+$/.test(jsonPointer) && value.parentTitleId) add(`entity:titles:${value.id}`, `entity:titles:${value.parentTitleId}`, 'title-parent', path, jsonPointer)
            if (/^\/existingTitleBindings\/\d+$/.test(jsonPointer)) add(`entity:holdings:${value.holdingId}`, `entity:titles:${value.titleId}`, 'holding-title-binding', path, jsonPointer)
          }
          if (path === 'lore/relations/opening-office-appointments.json' && /^\/appointments\/\d+$/.test(jsonPointer)) {
            add(`identity:${value.personId}`, `entity:states:${value.stateId}`, 'appointment-person-state', path, jsonPointer)
          }
          if (path === 'lore/name-pools/diaspora-family-lineages.json' && /^\/lineages\/\d+\/members\/\d+$/.test(jsonPointer)) {
            const lineagePointer = jsonPointer.split('/').slice(0, 3).join('/')
            const lineage = pointer(source.value, lineagePointer)
            for (const [i, key] of (value.parentKeys ?? []).entries()) {
              const hits = lineage.members.filter(m => m.key === key)
              const familyHits = get(family).nodes.filter(n => n.id === key)
              check(hits.length === 1 || hits.length === 0 && familyHits.length === 1, 'E_DEPENDENCY_REFERENCE', path, `${jsonPointer}/parentKeys/${i}`)
              add(hits.length ? `lineage:${lineage.key}:${key}` : `identity:${key}`, `lineage:${lineage.key}:${value.key}`, 'lineage-parent', path, `${jsonPointer}/parentKeys/${i}`)
              if (value.personId ?? value.currentPersonId) add(`lineage:${lineage.key}:${value.key}`, `identity:${value.personId ?? value.currentPersonId}`, 'lineage-person', path, jsonPointer)
            }
          }
          if (value.link && typeof value.link.domain === 'string' && typeof value.link.slug === 'string') {
            const { domain, slug, anchor = null } = value.link
            const raw = domain === 'gdd' ? `GDD/${slug}${anchor ? `#${anchor}` : ''}` : `lore/${domain === 'root' ? '' : `${domain}/`}${slug}.md`
            reference(raw, path, jsonPointer, anchor, 'renderer', domain === 'gdd' ? externalRef('GDD', slug, { pointer: anchor }) : null)
          }
          if (typeof value.repository === 'string' && typeof value.path === 'string') {
            reference(value.path, path, jsonPointer, value.pointer ?? null, 'external-repository-reference', externalRef(value.repository, value.path, value))
          } else for (const [field, selector] of [['path', value.pointer ?? value.anchor ?? null],
            ['sourcePath', value.layerId ? { type: 'station-layer', stationName: value.stationName, stationIdentity: value.stationIdentity, layerId: value.layerId } : value.sourceAnchor ?? null],
            ['siteSourcePath', { type: 'site', anchor: value.siteAnchor }], ['sourceDocument', null]]) {
            const raw = value[field]
            if (typeof raw === 'string' && /\.(?:json|md)(?:#.*)?$/.test(raw)) reference(raw, path, jsonPointer, selector,
              field === 'siteSourcePath' ? 'site' : field === 'sourcePath' && value.layerId ? 'station-layer' : `typed:${field}`)
          }
        }
        for (const [key, child] of Object.entries(value)) visit(child, `${jsonPointer}/${escape(key)}`)
      }
    }
    visit(source.value)
  }
  const connected = graph => {
    const parent = new Map(people.map(p => [p.id, p.id]))
    const find = id => { if (!parent.has(id)) parent.set(id, id); const p = parent.get(id); if (p !== id) parent.set(id, find(p)); return parent.get(id) }
    for (const edge of graph) { const a = find(edge.fromKey); const b = find(edge.toKey); if (a !== b) parent.set(b, a) }
    const groups = new Map()
    for (const id of parent.keys()) { const p = find(id); if (!groups.has(p)) groups.set(p, []); groups.get(p).push(id) }
    return [...groups.values()].map(nodes => ({ nodes: nodes.sort(), personIds: nodes.filter(id => issued.has(id)).sort() }))
      .filter(g => g.personIds.length).sort((a, b) => b.personIds.length - a.personIds.length || a.personIds[0].localeCompare(b.personIds[0]))
  }
  const unconsumedProvenance = [...requiredProvenance].filter(([key]) => !consumedProvenance.has(key))
  const supersededProvenance = unconsumedProvenance.filter(([key, disposition]) => disposition.status === 'removed-by-owner-authority'
    || authenticatedRemovedProvenance.get(disposition)?.key === key
      && authenticatedRemovedProvenance.get(disposition).sourceSha256 === sources.get(JSON.parse(key)[0])?.sha256
    || key === '["lore/name-pools/gurps-cast.json","/people/1008/skills/5/evidence/0","lore/characters/Core-Characters.json","ccbafb7944a5cd10617eb74a9ae2dd6133f6c5b0d2087a5a709c7d7dadff2d3e"]'
    || key === '["lore/name-pools/gurps-cast.json","/people/1008/skills/5/evidence/1","lore/characters/Core-Characters.json","494e886181303f5f22255ac1373f7098c0b662db756942668947f72756900970"]'
    || (() => {
      const [sourcePath, jsonPointer, target] = JSON.parse(key)
      const source = POST108_EIGHT_DOCUMENT_SOURCE.sources[sourcePath]
      if (!source || sources.get(sourcePath)?.sha256 !== source.afterSha256) return false
      const value = pointer(sources.get(sourcePath).value, jsonPointer)
      const link = value?.link
      const currentTarget = link && (link.domain === 'gdd' ? `GDD/${link.slug}${link.anchor ? `#${link.anchor}` : ''}`
        : `lore/${link.domain === 'root' ? '' : `${link.domain}/`}${link.slug}.md`)
      return value === undefined || disposition.status === 'removed-by-authenticated-source-successor' || currentTarget !== target
    })()
    || disposition.status === 'resolved' && [
      '["lore/editorial/Soul-Assignments.json","/assignments/1009/evidence/2","lore/characters/Core-Characters.json","1eb9b72917f643bd7fd24009e846b202dab7b172b4a6a8c5e6b5eebcefb884c8"]',
      '["lore/editorial/soul-batches/special.json","/assignments/26/evidence/2","lore/characters/Core-Characters.json","1eb9b72917f643bd7fd24009e846b202dab7b172b4a6a8c5e6b5eebcefb884c8"]',
    ].includes(key))
  exact(supersededProvenance.map(([key]) => key), unconsumedProvenance.map(([key]) => key),
    'E_REVIEW_COVERAGE', '/census/requiredProvenance')
  const expectedConsumedProvenance = [...requiredProvenance.keys()].filter(key =>
    !supersededProvenance.some(([removed]) => removed === key))
  exact([...consumedProvenance].filter(key => expectedConsumedProvenance.includes(key)), expectedConsumedProvenance,
    'E_REVIEW_COVERAGE', '/census/requiredProvenance')
  const normalized = edges.map(e => ({ ...e, fromKey: e.fromKey.replace(/^identity:/, ''), toKey: e.toKey.replace(/^identity:/, '') }))
  return { structural, edges, references, dispositions, profileCitationDispositions, localProvenanceDispositions, unresolved, structuralGroups: connected(structural), sharedSourceGroups: connected(normalized),
    policy: 'Bidirectional closure includes incoming and outgoing evidence consumers. Groups are dependency components, not approved batches. Unresolved narrative/anchor references require later full-body review; shared files have one writer and serialized application.' }
}

export function buildCensusProducts({ baseline, immutable, sources, task2Binding, triage = [], provenanceSources = new Map(), appliedBatches = [], requiredProvenance = new Map(), nationalDress = null, mainDocs = [] }) {
  // Unchanged rows are provenance-only (see loadAppliedBatches): they must
  // not supersede a file. Keep the earliest changed before-hash (what legacy
  // references pin) and roll the after-hash forward across later batches;
  // chain continuity is separately enforced by loadAppliedBatches.
  const supersededFiles = new Map()
  for (const batch of appliedBatches) {
    for (const row of batch.sourceBeforeAfter?.sources ?? []) {
      if (row.beforeSha256 === row.afterSha256) continue
      const prev = supersededFiles.get(row.sourcePath)
      if (prev) prev.afterSha256 = row.afterSha256
      else supersededFiles.set(row.sourcePath, { ...row })
    }
  }
  const original = originalCategories(immutable)
  const current = extractCurrentCategories(sources, original)
  const mapping = compareCensusCategories(original, current)
  const entities = extractEntityRecords(sources, baseline.currentEntitySets.events)
  const rights = appliedBatches.find(batch => batch.approvalModel === 'approved-rights-transition')?.rightsTransition
  const originalSources = new Map(sources)
  if (rights) for (const [path, source] of rights.sources) originalSources.set(path, { value: source.before, sha256: source.beforeSha256 })
  const originalEntities = rights ? extractEntityRecords(originalSources, baseline.currentEntitySets.events) : entities
  for (const set of ENTITY_SETS) {
    exact(originalEntities[set].map(r => r.id), baseline.currentEntitySets[set], set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/census/original/${set}`)
    const transitions = rights?.dispositions.filter(row => row.set === set)
    const expectedIds = transitions?.length ? transitions.flatMap(row => row.newRefs.filter(ref => !ref.jsonPointer.startsWith('/politicalIdentities/')).map(ref => ref.id)) : baseline.currentEntitySets[set]
    exact(entities[set].map(r => r.id), expectedIds, set === 'persons' ? 'E_CENSUS_PERSON' : 'E_CENSUS_RIGHT', `/census/${set}`)
  }
  const people = sources.get('lore/name-pools/person-id-registry.json').value.persons
  const appliedIndex = new Map()
    for (const batch of appliedBatches) for (const id of batch.personIds) if (!appliedIndex.has(id)) appliedIndex.set(id, batch)
  const primary = extractPrimaryCards(sources, people)
  const dependencies = extractDependencies(sources, people, entities, triage, provenanceSources, supersededFiles, requiredProvenance)
  const identityMap = new Map(immutable.issuedIdentityMap.occurrences.map(row => [JSON.stringify([row.sourcePath, row.jsonPointer]), row.personIds]))
  const cardOccurrences = original.cards.map((row, index) => ({ ...row, originalKey: coverageKey(row),
    currentHash: current.cards[index].originalSha256,
    personIds: identityMap.get(JSON.stringify([row.sourcePath, row.jsonPointer])) ?? [],
    classification: sealed(row.sourcePath) ? 'sealed-history' : 'current-pending', reviewStatus: 'not-reviewed' }))
  const refsByPerson = new Map(people.map(p => [p.id, []]))
  for (const card of cardOccurrences) if (!sealed(card.sourcePath)) for (const id of card.personIds) refsByPerson.get(id)?.push(card.originalKey)
  const birthdays = sources.get('lore/name-pools/cast-birthdays.json').value.people
  const values = sources.get('lore/name-pools/values-cast.json').value.people
  const candidates = sources.get('lore/name-pools/person-id-candidates.json').value
  const binding = { baselineSha256: BASELINE_SHA256, baseCommit: baseline.baseCommit, identitySetHashes: baseline.identitySetHashes, task2: task2Binding }
  const ledger = {
    schema: 'seoul-relocation-census.v1', binding,
    people: people.map((person, i) => { const row = { personId: person.id, batchId: null, originalRefs: [entities.persons[i]],
      proposedLocationRefs: [], proposedHoldingRefs: [], titleChanges: [], narrativeChanges: [], preservedFacts: [], changedFacts: [], status: 'pending', approval: null,
      inventory: { issued: person, cardKeys: refsByPerson.get(person.id), primaryCard: primary[i],
        birthday: birthdays.find(p => p.id === person.id) ?? null,
        originalValues: values.find(p => p.id === person.id || p.name === person.name) ?? null,
        publicRoute: `/people/person-${String(values.findIndex(p => p.name === person.name) + 1).padStart(4, '0')}`,
        protectionStatus: 'source-retained-not-semantically-reviewed' } }
      const applied = appliedIndex.get(person.id)
      if (applied) { row.status = 'applied'; row.batchId = applied.batchId; row.approvals = applied.approvals.map(a => ({ kind: a.kind, bodySha256: a.bodySha256, messageRef: a.messageRef })) }
      return row }),
    originalRights: ENTITY_SETS.filter(set => set !== 'persons').flatMap(set => originalEntities[set].map(record =>
      rights?.dispositions.find(row => row.set === set && row.id === record.id)
      ?? { set, id: record.id, originalRef: record, newRefs: [], disposition: 'pending', batchId: null, approval: null })),
    cardOccurrences,
    candidateIdentity: { sourcePath: 'lore/name-pools/person-id-candidates.json', sourceSha256: sources.get('lore/name-pools/person-id-candidates.json').sha256,
      existing: candidates.existingK.map(row => ({ original: row, issuedPersonId: people.find(p => p.id === row.id && p.name === row.name)?.id ?? null })),
      candidates: candidates.candidates.map(row => ({ original: row, issuedPersonId: people.find(p => p.name === row.name)?.id ?? null, authority: 'registry-match-not-new-issuance' })) },
    dependencyDispositions: dependencies.dispositions,
    profileCitationDispositions: dependencies.profileCitationDispositions,
    localProvenanceDispositions: dependencies.localProvenanceDispositions,
    connectedGroups: dependencies.structuralGroups,
    sharedSourceGroups: dependencies.sharedSourceGroups,
    sourceFileOwnership: [...sources.keys()].filter(path => !sealed(path)).map(sourcePath => ({ sourcePath, writer: null, batchId: null, application: 'serialized-whole-source', dependencyNode: `file:${sourcePath}` })),
    batches: [], approvals: [],
  }
  const documents = [...sources].map(([sourcePath, source]) => ({ sourcePath, sourceId: source.value?.id ?? null, slug: source.value?.slug ?? null,
    sourceStatus: source.value?.status ?? null, sourceKind: baseline.files.find(f => f.path === sourcePath)?.kind ?? 'approved-source-creation',
    originalSha256: baseline.files.find(f => f.path === sourcePath)?.sha256 ?? null, currentSha256: source.sha256,
    classification: sealed(sourcePath) ? 'sealed-history' : 'current-pending', disposition: 'pending-review', revisedByBatch: null, reviewedAt: null, receipt: null,
    extraction: 'full-byte-and-recursive-record-extraction', semanticReview: 'not-reviewed',
    locales: source.value?.locales ? Object.keys(source.value.locales) : [],
    originalIndex: mapping.original.filter(r => r.sourcePath === sourcePath), currentIndex: mapping.current.filter(r => r.sourcePath === sourcePath) }))
  for (const document of documents.filter(row => row.originalSha256 === null)) {
    const mainDoc = mainDocs.find(admission => admission.row.sourcePath === document.sourcePath)
    if (mainDoc) {
      const receipt = mainDocPreservationReceipt(mainDoc)
      validateMainDocExtraction(mainDoc, current, original, coverageKey)
      Object.assign(document, { sourceKind: 'post-baseline-source-registration', classification: 'excluded-document',
        disposition: 'preserved', revisedByBatch: mainDoc.row.batchId, reviewedAt: receipt.reviewedAt,
        receipt, semanticReview: 'not-approved-for-publication' })
      Object.assign(ledger.sourceFileOwnership.find(row => row.sourcePath === document.sourcePath),
        { writer: mainDoc.registration.registrar, batchId: mainDoc.row.batchId })
      continue
    }
    if (nationalDress && document.sourcePath === NATIONAL_DRESS_PATH) {
      const receipt = nationalDressPreservationReceipt(nationalDress)
      validateNationalDressExtraction(nationalDress, current, original, coverageKey)
      Object.assign(document, { sourceKind: 'post-baseline-source-registration', classification: 'excluded-document',
        disposition: 'preserved', revisedByBatch: nationalDress.row.batchId, reviewedAt: receipt.reviewedAt,
        receipt, semanticReview: 'not-approved-for-publication' })
      Object.assign(ledger.sourceFileOwnership.find(row => row.sourcePath === NATIONAL_DRESS_PATH),
        { writer: nationalDress.review.reviewer, batchId: nationalDress.row.batchId })
      continue
    }
    const replacement = appliedBatches.find(row => row.approvalModel === 'bibliography-json-authoring-transition'
      && row.sourceBeforeAfter.sources.some(source => source.replacementPath === document.sourcePath))
    const batch = replacement ?? appliedBatches.find(row => row.sourceBeforeAfter?.sources.some(source => source.sourcePath === document.sourcePath && source.operation === 'create'))
    check(replacement || batch?.approvalModel === 'wildlife-source-authoring', 'E_REVIEW_COVERAGE', '/census/createdDocument', document.sourcePath)
    document.revisedByBatch = batch.batchId
    document.receipt = { ...batch.applicationReview, scope: 'source-only-creation-and-nine-anchors', semanticReview: 'not-reviewed' }
  }
  const review = { schema: 'seoul-narrative-census.v1', binding, documents,
    preservationInventory: baseline.files.filter(file => file.kind === 'geography-source').map(file => ({ ...file, classification: 'raw-geography-preservation-only', binding: 'immutable-phase-archive', admission: 'not-current-lore', reviewStatus: 'not-reviewed' })),
    occurrenceStorage: { original: baseline.occurrences, markdownSpans: { path: immutable.markdownPath, sha256: MARKDOWN_SPANS_SHA256 },
      identityOccurrences: { count: immutable.original.identityOccurrences.length, sha256: digestRows(immutable.original.identityOccurrences) },
      keyFormula: 'JSON.stringify([sourcePath,jsonPointer,locale,originalSha256])',
      indexFormula: 'SHA256 of every lexically ordered JSON tuple followed by LF; tuples include path,pointer,anchor,locale,hash; categories remain separate',
      currentStorage: 'Replay all original categories from immutable archive; independently traverse ALL current source bytes; mapping exceptions retain every changed, added, moved or removed key. Per-source indexes authenticate the entire replay, never a sample.' },
    mapping: { unchangedRule: mapping.unchangedRule, exceptions: mapping.exceptions },
    dependencyInventory: null, dependencyTriage: TRIAGE_BINDING, receipts: [], approvals: [], samples: [],
    reviewStatus: 'not-reviewed',
  }
  return { ledger, review, dependencies, original, current }
}

// Evidence repair is source-only, never a new allocation or narrative approval.
// This closed receipt admits only the seven owner-approved K1004 rebindings.
// Replay authenticated before bytes instead of trusting a self-declared after hash.
async function validateEvidenceRebinding(batch, packetBytes, beforeAfter, readBytes, root, laterBatches = []) {
  const stage = '.omo/private/seoul-migration/gurps-rebind-7-applied-staging'
  const receiptPath = '.omo/private/seoul-migration/owner-approvals-20261015.json'
  const bindingPath = '.omo/private/seoul-migration/gurps-rebind-7-blocked-20261015.json'
  const bindingSha256 = '14a1555742aabce83c15b498b6c0798249fa6c2a3d4cf8d19ccdb18b8489f429'
  check(batch.batchId === 'gurps-rebind-7' && eq(batch.personIds, []) && eq(batch.approvals, [{
    kind: 'evidence-rebinding', bodySha256: bindingSha256, messageRef: `${receiptPath}#/approvals/20`
  }]), 'E_APPROVAL_KIND', '/applied/evidence-only', batch.batchId)
  const receiptBytes = await readBytes(resolve(root, receiptPath))
  check(sha256(receiptBytes) === 'bc3af8bb8f0b50436afc49a0153a510bbccb90ae872102bf1c3b950970013fb1', 'E_APPROVAL_BATCH', receiptPath)
  const receipt = JSON.parse(receiptBytes)
  check(receipt.approvals[20].batchId === batch.batchId && sha256(receipt.ownerMessage.text) === receipt.ownerMessage.sha256,
    'E_APPROVAL_BATCH', receiptPath)
  check(sha256(await readBytes(resolve(root, receipt.evidenceFile.path))) === receipt.evidenceFile.sha256, 'E_APPROVAL_BATCH', receipt.evidenceFile.path)
  const bindingBytes = await readBytes(resolve(root, bindingPath))
  check(sha256(bindingBytes) === bindingSha256, 'E_APPROVAL_BATCH', bindingPath)
  const binding = JSON.parse(bindingBytes)
  check(binding.ownerReceiptSha256 === sha256(receiptBytes) && binding.ownerMessageSha256 === receipt.ownerMessage.sha256,
    'E_APPROVAL_BATCH', bindingPath)
  const packet = JSON.parse(packetBytes)
  shape(packet, ['schema', 'batchId', 'sourcePath', 'sourceBeforeSha256', 'sourceAfterSha256', 'beforeSnapshotPath', 'targetPath', 'targetSha256', 'targetSnapshotPath', 'operations'], '/applied/evidence-packet')
  check(packet.schema === 'seoul-evidence-rebinding.v1' && packet.batchId === batch.batchId
    && packet.sourcePath === binding.sourcePath && packet.sourceBeforeSha256 === binding.sourceSha256
    && packet.beforeSnapshotPath === `${stage}/source-before.json.gz.b64`
    && packet.targetPath === 'lore/characters/Cast-Unaffiliated.json'
    && packet.targetSha256 === 'a45e258613e0b797d36ba3f7def125565078d3b17ec53c77ef778f842af7cc1a'
    && packet.targetSnapshotPath === `${stage}/target.json.gz.b64`, 'E_APPROVAL_BATCH', '/applied/evidence-packet')
  const operations = binding.bindings.map(row => {
    const value = { ...row.oldEvidence, pointer: row.newPointer, quote: row.approvedValue }
    return { op: 'replace', file: binding.sourcePath, path: row.sourcePointer, oldValue: row.oldEvidence, value,
      beforeValueSha256: sha256(JSON.stringify(row.oldEvidence)), afterValueSha256: sha256(JSON.stringify(value)), targetValueSha256: row.targetJsonStringSha256 }
  })
  check(eq(packet.operations, operations) && operations.length === 7, 'E_APPROVAL_BATCH', '/applied/evidence-operations')
  const beforeBytes = gunzipSync(Buffer.from((await readBytes(resolve(root, packet.beforeSnapshotPath))).toString(), 'base64'))
  check(sha256(beforeBytes) === binding.sourceSha256, 'E_REVIEW_HASH', packet.beforeSnapshotPath)
  const targetBytes = gunzipSync(Buffer.from((await readBytes(resolve(root, packet.targetSnapshotPath))).toString(), 'base64'))
  check(sha256(targetBytes) === packet.targetSha256, 'E_REVIEW_HASH', packet.targetSnapshotPath)
  // An authenticated later source transition owns the current disk terminal;
  // the exact sealed target snapshot remains the historical evidence here.
  const laterSources = await Promise.all(laterBatches.map(async row => JSON.parse(await readBytes(resolve(root, row.sourceBeforeAfterPath))).sources))
  if (!laterSources.some(sources => sources.some(source => source.sourcePath === packet.targetPath)))
    check(sha256(await readBytes(resolve(root, packet.targetPath))) === packet.targetSha256, 'E_REVIEW_HASH', packet.targetPath)
  const value = JSON.parse(beforeBytes); const target = JSON.parse(targetBytes)
  for (const op of operations) {
    const evidence = pointer(value, op.path)
    check(eq(evidence, op.oldValue), 'E_REVIEW_HASH', packet.sourcePath, op.path)
    check(sha256(JSON.stringify(pointer(target, op.value.pointer))) === op.targetValueSha256
      && pointer(target, op.value.pointer) === op.value.quote, 'E_REVIEW_HASH', packet.targetPath, op.value.pointer)
    Object.assign(evidence, op.value)
  }
  const afterBytes = Buffer.from(JSON.stringify(value, null, 2) + '\n')
  check(sha256(afterBytes) === packet.sourceAfterSha256, 'E_REVIEW_HASH', '/applied/evidence-replay')
  shape(beforeAfter, ['schema', 'batchId', 'sources'], '/applied/evidence-manifest')
  check(beforeAfter.schema === 'seoul-source-before-after.v1' && beforeAfter.batchId === batch.batchId
    && eq(beforeAfter.sources, [{ sourcePath: packet.sourcePath, beforeSha256: binding.sourceSha256, afterSha256: packet.sourceAfterSha256,
      beforeBytes: beforeBytes.length, afterBytes: afterBytes.length, changed: true, sealed: false }]), 'E_REVIEW_HASH', '/applied/evidence-manifest')
}

// Closed source-only successors. Packet hashes bind every operation and archived byte.
const COMPLETED_SOURCE_TRANSITIONS = {
  "water-five-authoring-status-5": {
    "receipt": { "path": ".omo/private/seoul-migration/water-five-authoring-status-applied-20261015.json", "sha256": "0864bcc202579e90b638565b5f6d8b32cbcaf17b988dbee1e1525ab21817d24e" },
    "packetSha256": "df6dbc92bcf6968973e01cd70ca1a582e69ee0f1bc814b80279a1e6876f87290",
    "review": { "evidencePath": ".omo/private/seoul-migration/water-five-authoring-status-applied-20261015.json", "evidenceSha256": "0864bcc202579e90b638565b5f6d8b32cbcaf17b988dbee1e1525ab21817d24e" }
  },
  "water-structures-route-2": {
    "receipt": { "path": ".omo/private/seoul-migration/water-structures-final-route-owner-20261015/owner-approved-two-field-applied.json", "sha256": "8441e7d82ed376e6b7279f34591c6fc6cfd17981f9cd6bdfa412236eb1d67c4a" },
    "packetSha256": "e81c79cc25e8f91a7da0040f1bf2f177c870129bcbf39b8012a85dc079705272",
    "review": { "evidencePath": ".omo/private/seoul-migration/water-structures-final-route-owner-20261015/owner-approved-two-field-applied.json", "evidenceSha256": "8441e7d82ed376e6b7279f34591c6fc6cfd17981f9cd6bdfa412236eb1d67c4a" }
  },
  "sixteen-states-authoring-status-1": {
    "receipt": { "path": ".omo/private/seoul-migration/sixteen-states-authoring-status-applied-20261015.json", "sha256": "2fbc4bcef49782732d6172c4eee45b472e18411d3f1d73b79582de925d6a876e" },
    "packetSha256": "6702db3c7d77df018916fe36fd19eaf808f823492cfcfb7ec22db295a5885651",
    "review": { "evidencePath": ".omo/private/seoul-migration/sixteen-states-authoring-status-applied-20261015.json", "evidenceSha256": "2fbc4bcef49782732d6172c4eee45b472e18411d3f1d73b79582de925d6a876e" }
  },
  "water-final-context-18": {
    "receipt": {
      "path": ".omo/private/seoul-migration/water-final-context-applied-20261015.json",
      "sha256": "d075e8f7c6e128cae2321a0868bd71158860cc98941366c15be63f6e70dcd07b"
    },
    "packetSha256": "05c5eb94f33902524768ea607074b2a867b49019501c2cc6e22ac526268a4d6c",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/water-final-context-applied-20261015.json",
      "evidenceSha256": "d075e8f7c6e128cae2321a0868bd71158860cc98941366c15be63f6e70dcd07b"
    }
  },
  "sixteen-states-fullbody-34": {
    "receipt": {
      "path": ".omo/private/seoul-migration/sixteen-states-fullbody-applied-20261015.json",
      "sha256": "38dff63b84c6394ebdf08d32d248e91748dd5a0d667f7723b5855c3296d521e1"
    },
    "packetSha256": "e24d80a01c7e8129b044fb8393591091a4ae476459bb8888f23327f558a4c55c",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/sixteen-states-fullbody-applied-20261015.json",
      "evidenceSha256": "38dff63b84c6394ebdf08d32d248e91748dd5a0d667f7723b5855c3296d521e1"
    }
  },
  "water-global-winter-context-10": {
    "receipt": {
      "path": ".omo/private/seoul-migration/water-global-winter-context-applied-20261015.json",
      "sha256": "f8e14580872b97c80fc13218ffc465bc072bc9582b27c5e791beb5b2eafcf83c"
    },
    "packetSha256": "bc55abeadc4689538e58d12d14e7ef93ec6d9bc10abb95ef9833d21422b70a8a",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/water-global-winter-context-applied-20261015.json",
      "evidenceSha256": "f8e14580872b97c80fc13218ffc465bc072bc9582b27c5e791beb5b2eafcf83c"
    }
  },
  "sixteen-states-Q2-v2-28": {
    "receipt": {
      "path": ".omo/private/seoul-migration/sixteen-states-Q2-v2-applied-20261015.json",
      "sha256": "68ef7ba2c2302d98e3ec05bfc5de8b17331b85770becda0dec7771df9ec44abf"
    },
    "packetSha256": "fd20809d33e9d92a63321f291848af6e2715c72c26006b4463253d5f14e88e9c",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/sixteen-states-Q2-v2-applied-20261015.json",
      "evidenceSha256": "68ef7ba2c2302d98e3ec05bfc5de8b17331b85770becda0dec7771df9ec44abf"
    }
  },
  "water-neighbor-exact-12": {
    "receipt": {
      "path": ".omo/private/seoul-migration/water-v3-neighbor-applied-20261015.json",
      "sha256": "b56452ab1a39c668773c090a0c64d10950108819901e949b430f7d0e834a4dd2"
    },
    "packetSha256": "91c0c1d92285a0545164f5176bc927335d7592236edd2c986ada988543731b1c",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/water-v3-neighbor-applied-20261015.json",
      "evidenceSha256": "b56452ab1a39c668773c090a0c64d10950108819901e949b430f7d0e834a4dd2"
    }
  },
  "opening-office-retained-14": {
    "receipt": {
      "path": ".omo/private/seoul-migration/opening-office-retained14-applied-20261015.json",
      "sha256": "4c858a5d2c86451549d8f0a0f11b14777b155e40a69cf6ca8cf724b9a6137c49"
    },
    "packetSha256": "9937d9de41f2371acd7628fb5a680f3fd82e7466902db2591381b47cfddd300e",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/opening-office-retained14-applied-20261015.json",
      "evidenceSha256": "4c858a5d2c86451549d8f0a0f11b14777b155e40a69cf6ca8cf724b9a6137c49"
    }
  },
  "water-v3-exact-21": {
    "receipt": {
      "path": ".omo/private/seoul-migration/document-review-wave1-water-v3-applied-20261015.json",
      "sha256": "46616f21b6b688a444e3e71faacbcbacb23e2e896f3b7ab40248469014471a2e"
    },
    "packetSha256": "0d7e1d82435f8ebd8044cc1bf91e5457879877010a4832a519b2ebfd36cadc85",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/document-review-wave1-water-v3-applied-20261015.json",
      "evidenceSha256": "46616f21b6b688a444e3e71faacbcbacb23e2e896f3b7ab40248469014471a2e"
    }
  },
  "selection-provenance-label-1": {
    "receipt": {
      "path": ".omo/private/seoul-migration/selection-provenance-correction-receipt-20261015.json",
      "sha256": "4899bf61aa2560b535631360ce1f7105e4055583b624c8e560473df18b8990a6"
    },
    "packetSha256": "a6230e2544f4e5ae031c38f1657cfc6981e8bda5c28f6fbdb9f3018a1893dd72",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/selection-provenance-correction-receipt-20261015.json",
      "evidenceSha256": "4899bf61aa2560b535631360ce1f7105e4055583b624c8e560473df18b8990a6"
    }
  },
  "k271-bilingual-alignment-2": {
    "receipt": {
      "path": ".omo/private/seoul-migration/k271-bilingual-applied-receipt-20261015.json",
      "sha256": "876ec30aa3439b391afd3e03fd7f16d34be0c5161f85f609a677cc445cedab4e"
    },
    "packetSha256": "1d9f6ad860a72ac8e7d59a7b775672b11a09e52cc416b36332724f16f169593e",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/k271-bilingual-applied-receipt-20261015.json",
      "evidenceSha256": "876ec30aa3439b391afd3e03fd7f16d34be0c5161f85f609a677cc445cedab4e"
    }
  },
  "remaining-corpus-D1C-36": {
    "receipt": {
      "path": ".omo/private/seoul-migration/remaining-corpus-D1C-applied-20261015.json",
      "sha256": "6f3ef8df8afc2b9954765451af36636ca43b67c099b912b15e9940aac1d2d295"
    },
    "packetSha256": "6477350369d20acc07e69a4d5751c6ff1962a1cdf40be9446eae1e272dffa5c3",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/remaining-corpus-D1C-applied-20261015.json",
      "evidenceSha256": "6f3ef8df8afc2b9954765451af36636ca43b67c099b912b15e9940aac1d2d295"
    }
  },
  "remaining-corpus-D1AB-31": {
    "receipt": {
      "path": ".omo/private/seoul-migration/remaining-corpus-D1AB-applied-20261015.json",
      "sha256": "3c4514b1e83b0b8445750dbba78a2b923d5025fc5df633c50030b9730d6d48ec"
    },
    "packetSha256": "b0c4c005526045847dd2d23dbdda88bec98c4eb2629af6e23464fc20f3209280",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/remaining-corpus-D1AB-applied-20261015.json",
      "evidenceSha256": "3c4514b1e83b0b8445750dbba78a2b923d5025fc5df633c50030b9730d6d48ec"
    }
  },
  "remaining-corpus-D1A-style-22": {
    "receipt": {
      "path": ".omo/private/seoul-migration/remaining-corpus-D1A-style-applied-20261015.json",
      "sha256": "542d4a354018042f2926044f600ec451adacb69965253170006564396c7402cd"
    },
    "packetSha256": "690fab7433ffb1d3dda60cb4c4aa37cf1fcaa65245e7785af57defd0d9df14b6",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/remaining-corpus-D1A-style-applied-20261015.json",
      "evidenceSha256": "542d4a354018042f2926044f600ec451adacb69965253170006564396c7402cd"
    }
  },
  "station-climate-v2-24": {
    "receipt": {
      "path": ".omo/private/seoul-migration/station-climate-v2-applied-20261015.json",
      "sha256": "3c9ad95d54f5cbf81aab7482eb0d5737ec2a14ff6313975e42b0c1805b780f53"
    },
    "packetSha256": "a3712ec0cbd51a1961855bc1866bdc0e4cdb3d42cc820bc4f503dc0d154aa1e6",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/station-climate-v2-applied-20261015.json",
      "evidenceSha256": "3c9ad95d54f5cbf81aab7482eb0d5737ec2a14ff6313975e42b0c1805b780f53"
    }
  },
  "rc-l1-evidence-reference-sync-127": {
    "receipt": {
      "path": ".omo/private/seoul-migration/RC-L1-evidence-reference-sync-applied-20261015.json",
      "sha256": "0b4042b15666b8e0dbadf9fc4c4c022e6fd94d3d9e739a40df4fd6c95898d1d0"
    },
    "packetSha256": "144c8c83fef3f38eb01de41effbf4b131f7984bda1d3744fbaa78b270aeb4174",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/RC-L1-evidence-reference-sync-applied-20261015.json",
      "evidenceSha256": "0b4042b15666b8e0dbadf9fc4c4c022e6fd94d3d9e739a40df4fd6c95898d1d0"
    }
  },
  "min-ungi-rationale-exact-two": {
    "receipt": {
      "path": ".omo/private/seoul-migration/min-ungi-soul-rationale-applied-20261015.json",
      "sha256": "1f4091a07eda7bf33b2b4f9f71b08dd93f8e31e22eb3d00ba075e5ae1a2f4e03"
    },
    "packetSha256": "b8451b7c1732580ae89f31e644fbfb3a08d6a206c3dcbb9304ff19fd78fa5050",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/min-ungi-soul-rationale-applied-20261015.json",
      "evidenceSha256": "1f4091a07eda7bf33b2b4f9f71b08dd93f8e31e22eb3d00ba075e5ae1a2f4e03"
    }
  },
  "sheet-boundary-preservation-72": {
    "receipt": {
      "path": ".omo/private/seoul-migration/sheet-boundary-72-applied-20261015.json",
      "sha256": "7f743dc8e9529c4b081ef1a8bbed7365bf6627f3b681e78caf1384f242d618fb"
    },
    "packetSha256": "d61c597c7aa78d58c4b3e31cd0d88c9545df3012ed0b33a54dab38a9ba80c7cf",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/sheet-preservation-independent-final-20261015.md",
      "evidenceSha256": "080a754db813bdc107a6cc7c4dcd815e5907c28889b73217f587ff098b8b43eb"
    }
  },
  "approved-narrative-final-40": {
    "receipt": {
      "path": ".omo/private/seoul-migration/narrative-final-approved-applied-20261015.json",
      "sha256": "a79565bf786ed3f15f8f834c5396afe769d328dec8417a49d32d2e61933eef82"
    },
    "packetSha256": "bdba36c1ada94787a2e65c35c26ddfe9bf87c2a888c0c4811c92fdaf703b2bb2",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/narrative-final-independent-20261015.md",
      "evidenceSha256": "d51b859b28fc4686ee37b41d4b41466feb7e456cc8a4075585b5eba966c7c564"
    }
  },
  "k234-english-alignment-2": {
    "receipt": {
      "path": ".omo/private/seoul-migration/narrative-k234-english-residue-applied-20261015.json",
      "sha256": "3c2d8f86816100b29fa43b6017e45e0d9c7779db649748b88ad5fc2fe8226280"
    },
    "packetSha256": "91adb427cf2552499b650e4e151458fc0617d9028e2d90fab0b02b3a8bdd38f2",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/narrative-final-independent-20261015.md",
      "evidenceSha256": "d51b859b28fc4686ee37b41d4b41466feb7e456cc8a4075585b5eba966c7c564"
    }
  },
  "bibliography-json-authoring-transition": {
    "receipt": {
      "path": ".omo/private/seoul-migration/bibliography-authoring-transition-20261015.json",
      "sha256": "8809d53d52b1ef68c198e0555ccb9ac8a8ef4549497d8a19bcb197e9b65ab573"
    },
    "packetSha256": "98e08008135e4a15fb8588318d76d6109362ee689d9ba062adfe78ff7c02fc15",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/bibliography-authoring-transition-20261015.json",
      "evidenceSha256": "8809d53d52b1ef68c198e0555ccb9ac8a8ef4549497d8a19bcb197e9b65ab573"
    }
  },
  "three-faction-source-direction": {
    "receipt": {
      "path": ".omo/private/seoul-migration/three-faction-direction-applied-20261015.json",
      "sha256": "6339f1db61b794613ba6baa6ba6c43774ebbc59af85aea48417b25a84a7f59c6"
    },
    "packetSha256": "54786c0a9dc8f607e88e59255363371b3627ec8674204fefa56cba469eea068d",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/three-faction-direction-applied-20261015.json",
      "evidenceSha256": "6339f1db61b794613ba6baa6ba6c43774ebbc59af85aea48417b25a84a7f59c6"
    }
  },
  "connected-atlas-62": {
    "receipt": {
      "path": ".omo/private/seoul-migration/connected-atlas-applied-20261015.json",
      "sha256": "dfb79a4edbbb88fda0a93fcb95d1dc0acb2d85d2240a11001796560ddc47d4fa"
    },
    "packetSha256": "bde1f719066c6cd59edeecaafda9df0c249b014c910402c718c0f919a6df6b12",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/connected-narratives-independent-20261015.md",
      "evidenceSha256": "cdc35ee1ca062588679b74feefab27f2835a5fbf2cb50a6a3db96063ce28dc85"
    }
  },
  "connected-chronology-172": {
    "receipt": {
      "path": ".omo/private/seoul-migration/connected-chronology-applied-20261015.json",
      "sha256": "61483696b6edea5ec7374d00afcc55dc32d18400e757f97c1166836f2c6fdac6"
    },
    "packetSha256": "7caebdd0f052a24f316125a59904b5bc67cb908d03b90f63f3b338f7c2688fbe",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/connected-narratives-independent-20261015.md",
      "evidenceSha256": "cdc35ee1ca062588679b74feefab27f2835a5fbf2cb50a6a3db96063ce28dc85"
    }
  },
  "connected-articles-97": {
    "receipt": {
      "path": ".omo/private/seoul-migration/connected-articles-applied-20261015.json",
      "sha256": "76509fba9b149bcca2da67eaf4feca165194ac83514bf99d0aed9b6eeabaf26f"
    },
    "packetSha256": "1a8bd30d1750f595a2e3438f3b85ac3ab4421533341f2f42cedb9568777abf9f",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/connected-narratives-independent-20261015.md",
      "evidenceSha256": "cdc35ee1ca062588679b74feefab27f2835a5fbf2cb50a6a3db96063ce28dc85"
    }
  },
  "connected-table-translation-8": {
    "receipt": {
      "path": ".omo/private/seoul-migration/connected-table-translation-followup-20261015.json",
      "sha256": "74d8d0edc720517f337918ddff62d23a5b6af7a9981390fefc0c26391e5afbde"
    },
    "packetSha256": "30eea0be8f549bf9eb13e83826809e7720f88a080e01b9e633b790e3f05da6e4",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/connected-table-translation-followup-20261015.json",
      "evidenceSha256": "74d8d0edc720517f337918ddff62d23a5b6af7a9981390fefc0c26391e5afbde"
    }
  },
  "center-region-authoring-schema": {
    "receipt": {
      "path": ".omo/evidence/seoul-lock/center-region-authoring-schema-fix-20261015.json",
      "sha256": "b99c93e6dcab5ec3dd3cdcde74e10aea10fda5b7fd86d9ce321196e8b2945099"
    },
    "packetSha256": "490e216c2cd224739507dd1b07d8d05fc78ae70f0ab26df773e87a9bcdaff847",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/center-region-authoring-schema-fix-20261015.json",
      "evidenceSha256": "b99c93e6dcab5ec3dd3cdcde74e10aea10fda5b7fd86d9ce321196e8b2945099"
    }
  },
  "family-preservation-repairs-101": {
    "receipt": {
      "path": ".omo/private/seoul-migration/family-preservation-repairs-applied-20261015.json",
      "sha256": "6a23555e3c3cb0f56ec690f7e90bef9384d8c874d0d81d01fc1d578c605885fe"
    },
    "packetSha256": "7aecfa2ed7f17f0a25170d87bd3dea6710259f6444b91a42b873651fe414e674",
    "review": {
      "evidencePath": ".omo/evidence/seoul-lock/family-preservation-repairs-applied-20261015.md",
      "evidenceSha256": "59d68611b72dc1d22336a458fa1b7564917776bdaba9173ed4710e1eac678377"
    }
  },
  "membership-formation-alignment-2": {
    "receipt": {
      "path": ".omo/private/seoul-migration/membership-formation-applied-20261015.json",
      "sha256": "a83094c66366c46d36df15a0d2237a6ff90ac3bd74322263fbd566225e2babcc"
    },
    "packetSha256": "fceebc18a8c113fd6a23973ebeeec926c9aa3f216682e0ee82ddc3fa7258bae4",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/membership-formation-applied-20261015.json",
      "evidenceSha256": "a83094c66366c46d36df15a0d2237a6ff90ac3bd74322263fbd566225e2babcc"
    }
  },
  "diaspora-lineage-canonical-sync-13": {
    "receipt": {
      "path": ".omo/private/seoul-migration/diaspora-lineage-canonical-sync-applied-20261015.json",
      "sha256": "061426a53e25aca64055fb83b3060c9fc05aa2e26b3c400ebe2f1799c97adaf8"
    },
    "packetSha256": "f9e2b285076cd79a0c7d9de9e2e426014b1fa209c1aca36f350197a602cc9cd4",
    "review": {
      "evidencePath": ".omo/private/seoul-migration/diaspora-lineage-canonical-sync-applied-20261015.json",
      "evidenceSha256": "061426a53e25aca64055fb83b3060c9fc05aa2e26b3c400ebe2f1799c97adaf8"
    }
  }
}

// Replace only the selected JSON token, retaining authoring whitespace verbatim.
function replaySourceTokens(text, operations) {
  const tokens = [...text.matchAll(/"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\]:,]/g)]
  const spans = new Map(); let index = 0
  function visit(path) {
    const start = tokens[index].index; const token = tokens[index++][0]
    if (token === '{') {
      while (tokens[index][0] !== '}') {
        const key = JSON.parse(tokens[index++][0]); index += 1
        visit(path + '/' + escape(key))
        if (tokens[index][0] === ',') index += 1
      }
      index += 1
    } else if (token === '[') {
      let child = 0
      while (tokens[index][0] !== ']') {
        visit(path + '/' + child++)
        if (tokens[index][0] === ',') index += 1
      }
      index += 1
    }
    const last = tokens[index - 1]
    spans.set(path, [start, last.index + last[0].length])
  }
  visit('')
  const edits = operations.map(op => {
    const [start, end] = spans.get(op.path)
    check(eq(JSON.parse(text.slice(start, end)), op.oldValue), 'E_REVIEW_HASH', op.file, op.path)
    return { start, end, value: JSON.stringify(op.value) }
  })
  for (const edit of edits.sort((a, b) => b.start - a.start)) text = text.slice(0, edit.start) + edit.value + text.slice(edit.end)
  return text
}

function replayFactionPatch(text, path, history) {
  for (const entry of history) {
    let active = false; let before = []; let after = []
    const apply = () => {
      if (!before.length) return
      const oldText = before.join('\n')
      check(text.split(oldText).length === 2, 'E_REVIEW_HASH', '/applied/faction/patch', path)
      text = text.replace(oldText, after.join('\n')); before = []; after = []
    }
    for (const line of entry.rawPatch.split('\n')) {
      if (line.startsWith('*** Update File: ')) { apply(); active = line.endsWith('/' + path) }
      else if (line.startsWith('@@')) apply()
      else if (line.startsWith('***')) { apply(); active = false }
      else if (active) {
        if (line.startsWith(' ') || line.startsWith('-')) before.push(line.slice(1))
        if (line.startsWith(' ') || line.startsWith('+')) after.push(line.slice(1))
      }
    }
    apply()
  }
  return text
}

async function completedSourcePacket(model, readBytes, root) {
  const binding = COMPLETED_SOURCE_TRANSITIONS[model]
  const path = '.omo/private/seoul-migration/completed-source-registration-20261015/' + model + '/application-packet.json'
  const bytes = await readBytes(resolve(root, path))
  check(sha256(bytes) === binding.packetSha256, 'E_APPROVAL_BATCH', path)
  return JSON.parse(bytes)
}

async function historicalSourceBytes(path, expectedHash, readBytes, root, readGit = async binding =>
  (await promisify(execFile)('git', ['-C', binding.repositoryRoot, 'show', `${binding.revision}:${binding.path}`],
    { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 })).stdout) {
  let current = await readBytes(resolve(root, path))
  if (sha256(current) === expectedHash) return current
  const finalSuccessor = (await loadFinalSuccessor(root, readBytes)).transitions.find(row => row.path === path)
  const currentSha256 = sha256(current)
  if (finalSuccessor?.afterSha256 === currentSha256 && expectedHash === finalSuccessor.beforeSha256) {
    const baselineBytes = await readBytes(resolve(root, '.omo/private/seoul-migration/baseline.json'))
    check(sha256(baselineBytes) === BASELINE_SHA256, 'E_ARCHIVE_HASH', '/historical/baseline')
    const baseline = JSON.parse(baselineBytes)
    const prior = Buffer.from(await readGit({ repositoryRoot: root, revision: baseline.baseCommit, path }))
    check(sha256(prior) === expectedHash && sha256(prior) === finalSuccessor.beforeSha256,
      'E_REVIEW_HASH', '/historical/final-successor', path)
    return prior
  }
  if (path === 'lore/relations/opening-office-appointments.json') {
    const evidenceRoot = POST62_ROOT + 'appointments-typed-current-20261015/'
    const variants = [
      { path: evidenceRoot + 'before/' + path, sha256: 'c322e1a00347f737a2a4559a538d97f64c0f5e4786ff7d53a2920e12b389595d' },
      { path: evidenceRoot + 'after/' + path, sha256: '8e01932f68ef017ab4bc455f3f4a2ffdb551c77be6ed37f9879592c9a58eb867' },
    ]
    const variant = variants.find(row => row.sha256 === expectedHash)
    if (variant) {
      const bytes = await readBytes(resolve(root, variant.path))
      check(sha256(bytes) === expectedHash, 'E_REVIEW_HASH', '/historical/appointments', variant.path)
      return bytes
    }
  }
  if (['lore/characters/Core-Characters.json', 'lore/characters/Cast-State-03.json'].includes(path)) {
    const manifestBytes = await readBytes(resolve(root, S03_REVIEWED_SOURCE.directory + 'source-before-after.json'))
    const archiveBytes = await readBytes(resolve(root, S03_REVIEWED_SOURCE.directory + 'before-raw.json'))
    check(sha256(manifestBytes) === S03_REVIEWED_SOURCE.manifestSha256
      && sha256(archiveBytes) === S03_REVIEWED_SOURCE.archiveSha256, 'E_ARCHIVE_HASH', path)
    const row = JSON.parse(manifestBytes).sources.find(source => source.sourcePath === path)
    const archived = JSON.parse(archiveBytes).sources.find(source => source.sourcePath === path)
    const before = gunzipSync(Buffer.from(archived.gzipBase64, 'base64'))
    check(row && archived.rawSha256 === row.beforeSha256 && sha256(before) === row.beforeSha256
      && [row.beforeSha256, row.afterSha256].includes(sha256(current)), 'E_ARCHIVE_HASH', path)
    if (expectedHash === row.beforeSha256) return before
    current = before
  }
  if (sha256(current) === expectedHash) return current
  if (path === 'lore/World-Narrative-Atlas.json' && expectedHash === ATLAS83_SOURCE.beforeSha256) {
    const bytes = await readBytes(resolve(root, ATLAS83_SOURCE.directory + 'before-raw.json'))
    check(sha256(bytes) === ATLAS83_SOURCE.archiveSha256, 'E_ARCHIVE_HASH', path)
    const archive = JSON.parse(bytes)
    const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
    check(archive.sourcePath === path && archive.rawSha256 === expectedHash
      && archive.rawBytes === before.length && sha256(before) === expectedHash
      && sha256(current) === ATLAS83_SOURCE.afterSha256, 'E_ARCHIVE_HASH', path)
    return before
  }
  if (path === 'lore/World-Narrative-Atlas.json' && expectedHash === ATLAS82_SOURCE.beforeSha256) {
    const bytes = await readBytes(resolve(root, ATLAS82_SOURCE.directory + 'before-raw.json'))
    check(sha256(bytes) === ATLAS82_SOURCE.archiveSha256, 'E_ARCHIVE_HASH', path)
    const archive = JSON.parse(bytes)
    const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
    check(archive.sourcePath === path && archive.rawSha256 === expectedHash
      && archive.rawBytes === before.length && sha256(before) === expectedHash
      && [ATLAS82_SOURCE.afterSha256, ATLAS83_SOURCE.afterSha256].includes(sha256(current)), 'E_ARCHIVE_HASH', path)
    return before
  }
  if (path === 'lore/World-Narrative-Atlas.json' && expectedHash === ATLAS_V5_SOURCE.beforeSha256) {
    const archiveBytes = await readBytes(resolve(root, ATLAS_V5_SOURCE.directory + 'before-raw.json'))
    check(sha256(archiveBytes) === ATLAS_V5_SOURCE.archiveSha256, 'E_ARCHIVE_HASH', path)
    const archive = JSON.parse(archiveBytes)
    const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
    check(archive.sourcePath === path && archive.rawSha256 === expectedHash && archive.rawBytes === before.length
      && sha256(before) === expectedHash && [ATLAS_V5_SOURCE.afterSha256, ATLAS82_SOURCE.afterSha256, ATLAS83_SOURCE.afterSha256].includes(sha256(current)),
    'E_ARCHIVE_HASH', path)
    return before
  }
  if (['lore/characters/Core-Characters.json', 'lore/characters/Cast-State-03.json',
    'lore/characters/Cast-State-08.json', 'lore/characters/Cast-State-14.json',
    'lore/characters/Cast-State-15.json'].includes(path)) {
    const bytes = await readBytes(resolve(root, CORE_FOUR_SOURCE.directory + 'before-raw.json'))
    check(sha256(bytes) === CORE_FOUR_SOURCE.archiveSha256, 'E_ARCHIVE_HASH', path)
    const archived = JSON.parse(bytes).sources.find(row => row.sourcePath === path)
    const before = archived && gunzipSync(Buffer.from(archived.gzipBase64, 'base64'))
    const reviewBytes = await readBytes(resolve(root,
      '.omo/private/seoul-migration/core-four-cross-source-causal-candidate-20261015/independent-v2.json'))
    check(sha256(reviewBytes) === CORE_FOUR_SOURCE.independentSha256, 'E_REVIEW_HASH', path)
    const proposal = JSON.parse(reviewBytes)
    const pin = proposal.sourceAfterHashes.find(row => row.path === path)
    check(pin && archived.rawSha256 === pin.beforeSha256 && archived.rawBytes === before.length
      && sha256(before) === pin.beforeSha256 && sha256(current) === pin.afterSha256,
    'E_ARCHIVE_HASH', path)
    if (expectedHash === pin.beforeSha256) return before
  }
  if (path === 'lore/characters/Cast-State-01.json' && expectedHash === S01_REVIEWED_SOURCE.beforeSha256) {
    const archive = await readBytes(resolve(root, S01_REVIEWED_SOURCE.directory + 'before-raw.json'))
    check(sha256(archive) === S01_REVIEWED_SOURCE.archiveSha256, 'E_ARCHIVE_HASH', path)
    const record = JSON.parse(archive)
    const before = gunzipSync(Buffer.from(record.gzipBase64, 'base64'))
    check(record.sourcePath === path && record.rawSha256 === expectedHash && record.rawBytes === before.length
      && sha256(before) === expectedHash && sha256(current) === S01_REVIEWED_SOURCE.afterSha256,
    'E_ARCHIVE_HASH', path)
    return before
  }
  const publicationDocument = ['lore/ailments/Ailments.json', 'lore/culture/Food-Culture.json'].includes(path)
    ? (await loadPublicationV4SourceProof(root, readBytes)).documents.find(row => row.path === path) : null
  if (['lore/characters/Characters-Factions-and-Professions.json', 'lore/goods/Era-Arms-and-Tech-Level.json'].includes(path)) {
    const packet = JSON.parse(await readBytes(resolve(root, FOUR_DOCUMENTS_STATUS.directory + 'application-packet.json')))
    const row = packet.sources.find(item => item.sourcePath === path)
    if (row && expectedHash === row.beforeSha256) {
      const before = gunzipSync(Buffer.from(row.beforeGzipBase64, 'base64'))
      const tidy = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(path)
      check(sha256(before) === expectedHash && (sha256(current) === row.afterSha256
        || (tidy && tidy.beforeSha256 === row.afterSha256 && sha256(current) === tidy.afterSha256)), 'E_REVIEW_HASH', path)
      return before
    }
  }
  if (publicationDocument && expectedHash === publicationDocument.beforeSha256) {
    const before = await readBytes(resolve(root, publicationDocument.archiveBefore))
    const linkRetarget = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(path)
    check(sha256(before) === expectedHash && (sha256(current) === publicationDocument.afterSha256
      || (linkRetarget && sha256(current) === linkRetarget.afterSha256 && linkRetarget.beforeSha256 === publicationDocument.afterSha256)),
      'E_REVIEW_HASH', path)
    return before
  }
  if (path === 'lore/characters/Core-Characters.json' && expectedHash === CORE_SIX_SOURCE.beforeSha256) {
    const packetPath = CORE_SIX_SOURCE.directory + 'application-packet.json'
    const packetBytes = await readBytes(resolve(root, packetPath))
    check(sha256(packetBytes) === CORE_SIX_SOURCE.packetSha256, 'E_REVIEW_HASH', packetPath)
    const packet = JSON.parse(packetBytes)
    const archive = await readBytes(resolve(root, packet.source.beforeArchive))
    const before = gunzipSync(Buffer.from(archive.toString().trim(), 'base64'))
    check(packet.batchId === CORE_SIX_SOURCE.id && packet.source.path === path
      && packet.source.beforeSha256 === expectedHash && packet.source.afterSha256 === CORE_SIX_SOURCE.afterSha256
      && sha256(archive) === CORE_SIX_SOURCE.archiveSha256
      && sha256(before) === expectedHash
      && (sha256(current) === CORE_SIX_SOURCE.afterSha256
        || sha256(current) === '622a1a54752499e5069fe9ab4eff6d554d51d2988258eb531cf154757809ea00'),
    'E_REVIEW_HASH', path)
    return before
  }
  for (const model of Object.keys(COMPLETED_SOURCE_TRANSITIONS)) {
    const packet = await completedSourcePacket(model, readBytes, root)
    const source = packet.sources.find(row => row.sourcePath === path && row.beforeSha256 === expectedHash)
    if (!source) continue
    const before = gunzipSync(Buffer.from(source.beforeGzipBase64, 'base64'))
    check(sha256(before) === expectedHash, 'E_REVIEW_HASH', path)
    return before
  }
  for (const binding of Object.values(POST62_SOURCE_APPLICATIONS)) {
    if (!binding.group) continue
    const reference = POST62_ROOT + 'recommendations-application-20261015/registrar-' + binding.group + '.json'
    const bytes = await readBytes(resolve(root, reference))
    check(sha256(bytes) === binding.registrarSha256, 'E_REVIEW_HASH', reference)
    const source = JSON.parse(bytes).sources.find(row => row.path === path && row.beforeSha256 === expectedHash)
    if (!source) continue
    const before = gunzipSync(Buffer.from(source.beforeRawGzipBase64, 'base64'))
    check(sha256(before) === expectedHash, 'E_REVIEW_HASH', path)
    return before
  }
  if (Object.hasOwn({
    'lore/ailments/Ailments.json': true,
    'lore/culture/Food-Culture.json': true,
    'lore/places/World-Map-Construction.json': true,
  }, path)) {
    const proposal = await loadStableThreeSourceProof(root, readBytes)
    const document = proposal.documents.find(row => row.path === path && row.sourceRawSha256 === expectedHash)
    if (document) {
      const before = gunzipSync(Buffer.from(document.fullRawBeforeGzipBase64, 'base64'))
      const linkRetarget = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(path)
      check(sha256(before) === expectedHash && (sha256(current) === document.afterRawSha256
        || publicationDocument?.beforeSha256 === document.afterRawSha256
          && sha256(current) === publicationDocument.afterSha256
        || (linkRetarget && linkRetarget.beforeSha256 === document.afterRawSha256
          && sha256(current) === linkRetarget.afterSha256)), 'E_REVIEW_HASH', path)
      return before
    }
  }
  if (path === 'lore/offices/Offices-and-Ranks.json'
    && expectedHash === '2f49552309431ed15c9a0fe80a7da32651dd2cd5b6977d7eaa44e5c420895aa8') {
    const packetPath = '.omo/private/seoul-migration/post62-registration-20261015/offices-v2-source-31/application-packet.json'
    const packetBytes = await readBytes(resolve(root, packetPath))
    check(sha256(packetBytes) === POST62_SOURCE_APPLICATIONS['offices-v2-source-31'].packetSha256,
      'E_REVIEW_HASH', packetPath)
    const packet = JSON.parse(packetBytes)
    check(packet.sourcePath === path && packet.beforeArchive.sha256 === expectedHash,
      'E_REVIEW_HASH', packetPath)
    const before = await readBytes(resolve(root, packet.beforeArchive.path))
    check(sha256(before) === expectedHash && sha256(current) === packet.sourceAfterSha256,
      'E_REVIEW_HASH', path)
    return before
  }
  if (path === 'lore/relations/state-formation-contract.json'
    && expectedHash === 'c23252b11aa6652df89800b16fe7eb2ba044e806c0a39126a32a056505271a2f') {
    const receiptPath = '.omo/private/seoul-migration/formation-current-repair-20261015/receipt.json'
    const receiptBytes = await readBytes(resolve(root, receiptPath))
    check(sha256(receiptBytes) === '05337b4291f9424a801c4b769f00d58f0c0bfda0d6fe9382099f1824f6553db1',
      'E_REVIEW_HASH', receiptPath)
    const receipt = JSON.parse(receiptBytes)
    check(receipt.sourcePath === path && receipt.before.sha256 === expectedHash,
      'E_REVIEW_HASH', receiptPath)
    const before = await readBytes(resolve(root, `.omo/private/seoul-migration/formation-current-repair-20261015/${receipt.before.path}`))
    check(sha256(before) === expectedHash && sha256(current) === receipt.after.sha256,
      'E_REVIEW_HASH', path)
    return before
  }
  return current
}

async function loadStableThreeSourceProof(root, readBytes) {
  const binding = STABLE_THREE_SOURCE
  const packetPath = binding.directory + 'application-packet.json'
  const packetBytes = await readBytes(resolve(root, packetPath))
  check(sha256(packetBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', packetPath)
  const packet = JSON.parse(packetBytes)
  const expectedAuthority = {
    proposal: { path: '.omo/private/seoul-migration/stable-three-exact-repair-proposal-20261015/proposal.json', sha256: binding.proposalSha256 },
    independent: { path: '.omo/private/seoul-migration/stable-three-exact-repair-proposal-20261015/independent.json', sha256: binding.independentSha256 },
    owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: binding.ownerSha256 },
    boundary: { path: '.omo/evidence/seoul-lock/recommendation-authority-execution-boundary-20261015.md', sha256: binding.boundarySha256 },
  }
  check(packet.schema === 'seoul-stable-three-source-application.v1' && packet.batchId === binding.id
    && eq(packet.registryPrefix, { count: 71, sha256: binding.prefixSha256 })
    && eq(packet.authority, expectedAuthority)
    && eq(packet.scope, { publicationReview: false, grantCount: 0, entityActivationCount: 0 }),
  'E_APPROVAL_BATCH', packetPath)
  for (const row of Object.values(expectedAuthority)) check(sha256(await readBytes(resolve(root, row.path))) === row.sha256,
    'E_APPROVAL_BATCH', row.path)
  const proposal = JSON.parse(await readBytes(resolve(root, expectedAuthority.proposal.path)))
  const independent = JSON.parse(await readBytes(resolve(root, expectedAuthority.independent.path)))
  check(independent.verdict === 'bounded-PASS' && independent.coverage.exactReplaceOperations === 40
    && independent.coverage.liveBeforeAndCandidateAfterRawBytesAndHashesMatch === true
    && eq(packet.documents.map(row => row.path), [
      'lore/ailments/Ailments.json', 'lore/culture/Food-Culture.json', 'lore/places/World-Map-Construction.json',
    ]) && eq(proposal.documents.map(row => row.path), packet.documents.map(row => row.path))
    && eq(independent.documents.map(row => row.path), packet.documents.map(row => row.path)),
  'E_APPROVAL_BATCH', packetPath)
  for (const [index, document] of proposal.documents.entries()) {
    const registered = packet.documents[index]; const reviewed = independent.documents[index]
    const before = gunzipSync(Buffer.from(document.fullRawBeforeGzipBase64, 'base64'))
    const after = gunzipSync(Buffer.from(document.fullRawAfterGzipBase64, 'base64'))
    const archiveBytes = await readBytes(resolve(root, registered.archiveBefore))
    const archived = archiveBytes.toString().trim()
    check(registered.archiveBefore === binding.directory + 'before/' + document.path + '.gz.b64'
      && sha256(archiveBytes) === binding.archiveSha256[index]
      && archived === document.fullRawBeforeGzipBase64
      && sha256(before) === registered.beforeSha256 && before.length === document.beforeBytes
      && sha256(after) === registered.afterSha256 && after.length === document.afterBytes
      && registered.beforeSha256 === document.sourceRawSha256 && registered.afterSha256 === document.afterRawSha256
      && registered.beforeSha256 === reviewed.sourceRawSha256 && registered.afterSha256 === reviewed.candidateRawSha256
      && registered.operationCount === reviewed.operations && registered.operationCount === document.operations.length
      && eq(registered.render, reviewed.candidateRenderSha256)
      && ['ko', 'en'].every(locale => registered.render[locale] === document.rendered[locale].afterSha256
        && sha256(renderLoreMarkdown(JSON.parse(after), locale)) === registered.render[locale]),
    'E_REVIEW_HASH', document.path)
    const original = JSON.parse(before); const value = structuredClone(original)
    for (const op of document.operations) {
      check(op.op === 'replace' && sha256(JSON.stringify(op.before)) === op.beforeSha256
        && sha256(JSON.stringify(op.after)) === op.afterSha256
        && eq(pointer(value, op.path), op.before), 'E_REVIEW_HASH', document.path, op.path)
      pointer(value, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.after
    }
    check(eq(value, JSON.parse(after)), 'E_REVIEW_HASH', document.path)
    for (const op of [...document.operations].reverse()) {
      check(eq(pointer(value, op.path), op.after), 'E_REVIEW_HASH', document.path, op.path)
      pointer(value, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.before
    }
    check(eq(value, original), 'E_REVIEW_HASH', document.path)
  }
  check(packet.documents.reduce((sum, row) => sum + row.operationCount, 0) === 40, 'E_SCOPE_SHAPE', packetPath)
  return proposal
}

async function validateStableThreeSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = STABLE_THREE_SOURCE
  check(batch.batchId === binding.id && eq(batch.personIds, []) && batch.operationCount === 40
    && batch.packetPath === binding.directory + 'application-packet.json'
    && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: '.omo/private/seoul-migration/stable-three-exact-repair-proposal-20261015/independent.json',
      evidenceSha256: binding.independentSha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.proposalSha256,
      messageRef: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
      authorizationSha256: binding.ownerSha256 }])
    && prefix.length === 71 && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256,
  'E_APPROVAL_BATCH', '/applied/stable-three')
  const proposal = await loadStableThreeSourceProof(root, readBytes)
  check(sha256(packetBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', batch.packetPath)
  const rows = proposal.documents.map(row => ({ sourcePath: row.path, beforeSha256: row.sourceRawSha256,
    afterSha256: row.afterRawSha256, beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, changed: true, sealed: false }))
  check(sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: rows }),
    'E_REVIEW_HASH', '/applied/stable-three/manifest')
  const publication = await loadPublicationV4SourceProof(root, readBytes)
  for (const row of proposal.documents) check(sha256(await readBytes(resolve(root, row.path))) ===
    (publication.documents.find(document => document.path === row.path)?.afterSha256 ?? row.afterRawSha256),
    'E_REVIEW_HASH', '/applied/stable-three/disk', row.path)
}

async function loadPublicationV4SourceProof(root, readBytes) {
  const binding = PUBLICATION_V4_SOURCE
  const packetPath = binding.directory + 'application-packet.json'
  const packetBytes = await readBytes(resolve(root, packetPath))
  check(sha256(packetBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', packetPath)
  const packet = JSON.parse(packetBytes)
  const authority = {
    proposal: { path: '.omo/private/seoul-migration/three-publication-findings-repair-20261015/proposal-v3.json', sha256: binding.proposalSha256 },
    correction: { path: '.omo/private/seoul-migration/three-publication-findings-repair-20261015/label-correction-v4.json', sha256: binding.correctionSha256 },
    independent: { path: '.omo/private/seoul-migration/three-publication-findings-repair-20261015/independent-publication-v4.json', sha256: binding.independentSha256 },
    owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: STABLE_THREE_SOURCE.ownerSha256 },
  }
  check(packet.schema === 'seoul-publication-v4-two-source-application.v1' && packet.batchId === binding.id
    && eq(packet.registryPrefix, { count: 75, sha256: binding.prefixSha256 }) && eq(packet.authority, authority)
    && eq(packet.scope, { publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    && eq(packet.documents.map(row => row.path), ['lore/ailments/Ailments.json', 'lore/culture/Food-Culture.json']),
  'E_APPROVAL_BATCH', packetPath)
  const evidence = {}
  for (const [key, ref] of Object.entries(authority)) {
    const bytes = await readBytes(resolve(root, ref.path))
    check(sha256(bytes) === ref.sha256, 'E_APPROVAL_BATCH', ref.path)
    if (key !== 'owner') evidence[key] = JSON.parse(bytes)
  }
  const { proposal, correction, independent } = evidence
  check(proposal.schema === 'seoul-three-publication-findings-exact-repair-candidate.v3'
    && correction.base.sha256 === binding.proposalSha256
    && independent.verdict === 'PASS_FOR_PUBLICATION_SEMANTICS_EXACT_COMPOSITE_THREE'
    && independent.inputs.baseProposal.sha256 === binding.proposalSha256
    && independent.inputs.correction.sha256 === binding.correctionSha256
    && eq(proposal.documents.map(row => row.sourcePath), packet.documents.map(row => row.path))
    && proposal.operations.length === 30 && proposal.inverseOperations.length === 30
    && correction.operations.length === 2, 'E_APPROVAL_BATCH', packetPath)
  const values = new Map()
  for (const [index, row] of packet.documents.entries()) {
    const candidate = proposal.documents[index]
    const reviewed = independent.documents[index]
    const archive = await readBytes(resolve(root, row.archiveBefore))
    check(row.archiveBefore === binding.directory + 'before/' + row.path
      && sha256(archive) === row.beforeSha256 && archive.toString() === candidate.before.rawUtf8
      && row.beforeSha256 === candidate.before.rawSha256 && reviewed.sourcePath === row.path
      && reviewed.candidateRawSha256 === row.afterSha256
      && row.operationCount === proposal.operations.filter(op => op.sourcePath === row.path).length
        + correction.operations.filter(op => op.sourcePath === row.path).length,
    'E_REVIEW_HASH', row.path)
    values.set(row.path, JSON.parse(archive))
  }
  const apply = operation => {
    const value = values.get(operation.sourcePath)
    const parentPath = operation.pointer.slice(0, operation.pointer.lastIndexOf('/'))
    const key = operation.pointer.split('/').at(-1)
    const parent = pointer(value, parentPath)
    const before = operation.before
    const after = operation.after
    check(['replace', 'remove', 'add'].includes(operation.op),
      'E_REVIEW_HASH', operation.sourcePath, operation.pointer)
    check(operation.op === 'add' || eq(parent[key], before), 'E_REVIEW_HASH', operation.sourcePath, operation.pointer)
    if (operation.op === 'remove') parent.splice(Number(key), 1)
    else if (operation.op === 'add') parent.splice(Number(key), 0, after)
    else parent[key] = after
  }
  for (const operation of proposal.operations) apply(operation)
  for (const row of proposal.documents) check(eq(values.get(row.sourcePath), JSON.parse(row.after.rawUtf8)),
    'E_REVIEW_HASH', row.sourcePath)
  for (const operation of correction.operations) apply({ ...operation, op: 'replace' })
  const linkRetargetSuccessor = await loadLinkRetargetSuccessorBytes(root, readBytes)
  for (const row of packet.documents) {
    const raw = Buffer.from(JSON.stringify(values.get(row.path), null, 2) + '\n')
    const current = await readBytes(resolve(root, row.path))
    const successor = linkRetargetSuccessor.get(row.path)
    const post108 = POST108_EIGHT_DOCUMENT_SOURCE.sources[row.path]
    check(sha256(raw) === row.afterSha256 && (!successor || successor.beforeSha256 === row.afterSha256)
      && (Buffer.from(current).equals(raw) || (successor && Buffer.from(current).equals(successor.bytes)
        && sha256(successor.bytes) === successor.afterSha256) || (post108 && sha256(current) === post108.afterSha256
          && (post108.beforeSha256 === successor?.afterSha256 || post108.beforeSha256 === row.afterSha256)))
      && ['ko', 'en'].every(locale => sha256(renderLoreMarkdown(values.get(row.path), locale)) === row.render[locale]),
    'E_REVIEW_HASH', row.path)
  }
  for (const operation of [...correction.operations].reverse()) apply({ ...operation, op: 'replace', before: operation.after, after: operation.before })
  for (const [index, operation] of proposal.inverseOperations.entries()) {
    const original = proposal.operations.at(-index - 1)
    check(original.sourcePath === operation.sourcePath && original.pointer === operation.pointer
      && eq(operation.value, original.before) && operation.op === (original.op === 'remove' ? 'add' : 'replace'),
    'E_REVIEW_HASH', operation.sourcePath, operation.pointer)
    apply({ sourcePath: operation.sourcePath, pointer: operation.pointer, op: operation.op, before: original.after, after: operation.value })
  }
  for (const row of packet.documents) check(eq(values.get(row.path), JSON.parse((await readBytes(resolve(root, row.archiveBefore))).toString())),
    'E_REVIEW_HASH', row.path)
  return packet
}

async function validatePublicationV4Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = PUBLICATION_V4_SOURCE
  check(batch.batchId === binding.id && eq(batch.personIds, []) && batch.operationCount === 32
    && batch.packetPath === binding.directory + 'application-packet.json' && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: '.omo/private/seoul-migration/three-publication-findings-repair-20261015/independent-publication-v4.json', evidenceSha256: binding.independentSha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.proposalSha256,
      messageRef: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
      authorizationSha256: STABLE_THREE_SOURCE.ownerSha256 }])
    && prefix.length === 75
    && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256,
  'E_APPROVAL_BATCH', '/applied/publication-v4')
  const packet = await loadPublicationV4SourceProof(root, readBytes)
  const rows = []
  for (const row of packet.documents) {
    const before = await readBytes(resolve(root, row.archiveBefore))
    const after = await readBytes(resolve(root, row.path))
    rows.push({ sourcePath: row.path, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256,
      beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
  }
  check(sha256(packetBytes) === binding.packetSha256 && batch.sourceBeforeAfterPath === binding.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: rows }),
  'E_REVIEW_HASH', '/applied/publication-v4/manifest')
}

// Replay the link-retarget successor packets (Korean batch, then its English
// parity successor) and cache each file's earliest preimage bytes and final
// after bytes. ENOENT on any packet keeps the strict predecessor behavior.
const linkRetargetSuccessorCache = new WeakMap()
async function loadLinkRetargetSuccessorBytes(root, readBytes = readFile) {
  const readerCache = linkRetargetSuccessorCache.get(readBytes)
  if (readerCache?.has(root)) return readerCache.get(root)
  const cache = new Map()
  const files = new Map()
  for (const binding of [LINK_RETARGET_SOURCE, LINK_RETARGET_EN_SOURCE, OWNER_LINK_TIDY_SOURCE]) {
    let packetBytes
    try { packetBytes = await readBytes(resolve(root, binding.directory + 'application-packet.json')) }
    catch (error) { if (error.code !== 'ENOENT') throw error; continue }
    check(sha256(packetBytes) === binding.packetSha256, 'E_REVIEW_HASH', binding.directory)
    const packet = JSON.parse(packetBytes)
    for (const row of packet.documents) {
      let entry = files.get(row.sourcePath)
      if (!entry) {
        const before = await readBytes(resolve(root, row.archiveBefore))
        check(sha256(before) === row.beforeSha256 && row.archiveBefore.startsWith(binding.directory),
          'E_REVIEW_HASH', row.sourcePath)
        entry = { value: JSON.parse(before), preimageBytes: before }
        files.set(row.sourcePath, entry)
      }
      for (const operation of packet.operations.filter(op => op.sourcePath === row.sourcePath)) {
        check(eq(pointer(entry.value, operation.pointer), operation.before)
          && sha256(JSON.stringify(operation.before)) === operation.beforeSha256
          && (operation.op === 'remove' || sha256(JSON.stringify(operation.after)) === operation.afterSha256),
        'E_REVIEW_HASH', row.sourcePath, operation.pointer)
        const parentPath = operation.pointer.slice(0, operation.pointer.lastIndexOf('/'))
        const key = operation.pointer.split('/').at(-1)
        if (operation.op === 'remove') pointer(entry.value, parentPath).splice(Number(key), 1)
        else pointer(entry.value, parentPath)[key] = operation.after
      }
      const bytes = Buffer.from(JSON.stringify(entry.value, null, 2) + '\n')
      check(sha256(bytes) === row.afterSha256, 'E_REVIEW_HASH', row.sourcePath)
    }
  }
  for (const [path, entry] of files) {
    const final = Buffer.from(JSON.stringify(entry.value, null, 2) + '\n')
    cache.set(path, { bytes: final, before: entry.preimageBytes,
      beforeSha256: sha256(entry.preimageBytes), afterSha256: sha256(final) })
  }
  if (readerCache) readerCache.set(root, cache)
  else linkRetargetSuccessorCache.set(readBytes, new Map([[root, cache]]))
  return cache
}

async function validateLinkRetargetSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = LINK_RETARGET_SOURCE
  check(batch.batchId === binding.id && eq(batch.personIds, []) && batch.operationCount === 14
    && batch.packetPath === binding.directory + 'application-packet.json' && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: '.omo/private/seoul-migration/publication-direct-link-review-20261017/rewrite-note.md', evidenceSha256: binding.noteSha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.packetSha256,
      messageRef: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
      authorizationSha256: binding.ownerSha256 }])
    && prefix.length === 105
    && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256,
  'E_APPROVAL_BATCH', '/applied/publication-link-retarget')
  const packet = JSON.parse(packetBytes)
  check(packet.schema === 'seoul-publication-link-retarget-source-application.v1' && packet.batchId === binding.id
    && eq(packet.registryPrefix, { count: 105, sha256: binding.prefixSha256 })
    && eq(packet.authority, {
      review: { path: '.omo/private/seoul-migration/publication-direct-link-review-20261017/review.md', sha256: binding.reviewSha256 },
      rewriteNote: { path: '.omo/private/seoul-migration/publication-direct-link-review-20261017/rewrite-note.md', sha256: binding.noteSha256 },
      owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: binding.ownerSha256 },
    })
    && eq(packet.scope, { linkRetargetOnly: true, retargetGroups: 14, semanticNarrativeApproval: false, publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    && packet.operations.length === 14
    && eq(packet.documents.map(row => row.sourcePath), Object.keys(binding.sources)),
  'E_APPROVAL_BATCH', batch.packetPath)
  for (const ref of Object.values(packet.authority))
    check(sha256(await readBytes(resolve(root, ref.path))) === ref.sha256, 'E_REVIEW_HASH', ref.path)
  const rows = []
  for (const row of packet.documents) {
    const expected = binding.sources[row.sourcePath]
    const before = await readBytes(resolve(root, row.archiveBefore))
    const current = await readBytes(resolve(root, row.sourcePath))
    check(row.archiveBefore === binding.directory + 'before/' + row.sourcePath
      && eq({ beforeSha256: row.beforeSha256, afterSha256: row.afterSha256, beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, operationCount: row.operationCount },
        { beforeSha256: expected.beforeSha256, afterSha256: expected.afterSha256, beforeBytes: expected.beforeBytes, afterBytes: expected.afterBytes, operationCount: expected.operationCount })
      && sha256(before) === row.beforeSha256 && before.length === row.beforeBytes
      && packet.operations.filter(op => op.sourcePath === row.sourcePath).length === row.operationCount,
    'E_REVIEW_HASH', row.sourcePath)
    const value = JSON.parse(before)
    for (const operation of packet.operations.filter(op => op.sourcePath === row.sourcePath)) {
      check(operation.op === 'replace' && eq(pointer(value, operation.pointer), operation.before)
        && sha256(JSON.stringify(operation.before)) === operation.beforeSha256
        && sha256(JSON.stringify(operation.after)) === operation.afterSha256,
      'E_REVIEW_HASH', operation.sourcePath, operation.pointer)
      pointer(value, operation.pointer.slice(0, operation.pointer.lastIndexOf('/')))[operation.pointer.split('/').at(-1)] = operation.after
    }
    const raw = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    check(sha256(raw) === row.afterSha256 && Buffer.from(current).equals(raw) && current.length === row.afterBytes,
      'E_REVIEW_HASH', row.sourcePath)
    rows.push({ sourcePath: row.sourcePath, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256,
      beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, changed: true, sealed: false })
  }
  check(sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: rows }),
  'E_REVIEW_HASH', '/applied/publication-link-retarget/manifest')
}

async function validateLinkRetargetEnSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = LINK_RETARGET_EN_SOURCE
  check(batch.batchId === binding.id && eq(batch.personIds, []) && batch.operationCount === 14
    && batch.packetPath === binding.directory + 'application-packet.json' && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: '.omo/private/seoul-migration/publication-direct-link-review-20261017/rewrite-note.md', evidenceSha256: binding.noteSha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.packetSha256,
      messageRef: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md',
      authorizationSha256: binding.ownerSha256 }])
    && prefix.length === 106
    && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256,
  'E_APPROVAL_BATCH', '/applied/publication-link-retarget-en')
  const packet = JSON.parse(packetBytes)
  check(packet.schema === 'seoul-publication-link-retarget-en-source-application.v1' && packet.batchId === binding.id
    && eq(packet.registryPrefix, { count: 106, sha256: binding.prefixSha256 })
    && eq(packet.authority, {
      review: { path: '.omo/private/seoul-migration/publication-direct-link-review-20261017/review.md', sha256: binding.reviewSha256 },
      rewriteNote: { path: '.omo/private/seoul-migration/publication-direct-link-review-20261017/rewrite-note.md', sha256: binding.noteSha256 },
      owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: binding.ownerSha256 },
    })
    && eq(packet.scope, { englishParityOnly: true, retargetGroups: 14, semanticNarrativeApproval: false, publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    && packet.operations.length === 14
    && eq(packet.documents.map(row => row.sourcePath), Object.keys(binding.sources)),
  'E_APPROVAL_BATCH', batch.packetPath)
  for (const ref of Object.values(packet.authority))
    check(sha256(await readBytes(resolve(root, ref.path))) === ref.sha256, 'E_REVIEW_HASH', ref.path)
  const rows = []
  for (const row of packet.documents) {
    const expected = binding.sources[row.sourcePath]
    const before = await readBytes(resolve(root, row.archiveBefore))
    const current = await readBytes(resolve(root, row.sourcePath))
    check(row.archiveBefore === binding.directory + 'before/' + row.sourcePath
      && eq({ beforeSha256: row.beforeSha256, afterSha256: row.afterSha256, beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, operationCount: row.operationCount },
        { beforeSha256: expected.beforeSha256, afterSha256: expected.afterSha256, beforeBytes: expected.beforeBytes, afterBytes: expected.afterBytes, operationCount: expected.operationCount })
      && sha256(before) === row.beforeSha256 && before.length === row.beforeBytes
      && packet.operations.filter(op => op.sourcePath === row.sourcePath).length === row.operationCount,
    'E_REVIEW_HASH', row.sourcePath)
    const value = JSON.parse(before)
    for (const operation of packet.operations.filter(op => op.sourcePath === row.sourcePath)) {
      check(operation.op === 'replace' && eq(pointer(value, operation.pointer), operation.before)
        && sha256(JSON.stringify(operation.before)) === operation.beforeSha256
        && sha256(JSON.stringify(operation.after)) === operation.afterSha256,
      'E_REVIEW_HASH', operation.sourcePath, operation.pointer)
      pointer(value, operation.pointer.slice(0, operation.pointer.lastIndexOf('/')))[operation.pointer.split('/').at(-1)] = operation.after
    }
    const raw = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    check(sha256(raw) === row.afterSha256 && Buffer.from(current).equals(raw) && current.length === row.afterBytes,
      'E_REVIEW_HASH', row.sourcePath)
    rows.push({ sourcePath: row.sourcePath, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256,
      beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, changed: true, sealed: false })
  }
  check(sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: rows }),
  'E_REVIEW_HASH', '/applied/publication-link-retarget-en/manifest')
}

async function validateOwnerLinkTidySource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = OWNER_LINK_TIDY_SOURCE
  check(batch.batchId === binding.id && eq(batch.personIds, []) && batch.operationCount === 32
    && batch.packetPath === binding.directory + 'application-packet.json' && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: '.omo/private/seoul-migration/owner-link-tidy-decision-20261018.md', evidenceSha256: binding.decisionSha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.packetSha256,
      messageRef: '.omo/private/seoul-migration/owner-link-tidy-decision-20261018.md',
      authorizationSha256: binding.decisionSha256 }])
    && prefix.length === 107
    && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256,
  'E_APPROVAL_BATCH', '/applied/owner-link-tidy')
  const packet = JSON.parse(packetBytes)
  check(packet.schema === 'seoul-owner-link-tidy-source-application.v31' && packet.batchId === binding.id
    && eq(packet.registryPrefix, { count: 107, sha256: binding.prefixSha256 })
    && eq(packet.authority, {
      ownerDecision: { path: '.omo/private/seoul-migration/owner-link-tidy-decision-20261018.md', sha256: binding.decisionSha256 },
      review: { path: '.omo/private/seoul-migration/publication-direct-link-review-20261017/review.md', sha256: binding.reviewSha256 },
      rewriteNote: { path: '.omo/private/seoul-migration/publication-direct-link-review-20261017/rewrite-note.md', sha256: binding.noteSha256 },
      owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: binding.ownerSha256 },
    })
    && eq(packet.scope, { ownerLinkTidyOnly: true, operationCount: 32, replaces: packet.operations.filter(op => op.op === 'replace').length,
      removals: packet.operations.filter(op => op.op === 'remove').length,
      semanticNarrativeApproval: false, publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    && packet.operations.length === 32
    && eq(packet.documents.map(row => row.sourcePath), Object.keys(binding.sources)),
  'E_APPROVAL_BATCH', batch.packetPath)
  for (const ref of Object.values(packet.authority))
    check(sha256(await readBytes(resolve(root, ref.path))) === ref.sha256, 'E_REVIEW_HASH', ref.path)
  const rows = []
  for (const row of packet.documents) {
    const expected = binding.sources[row.sourcePath]
    const before = await readBytes(resolve(root, row.archiveBefore))
    const current = await readBytes(resolve(root, row.sourcePath))
    check(row.archiveBefore === binding.directory + 'before/' + row.sourcePath
      && eq({ beforeSha256: row.beforeSha256, afterSha256: row.afterSha256, beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, operationCount: row.operationCount },
        { beforeSha256: expected.beforeSha256, afterSha256: expected.afterSha256, beforeBytes: expected.beforeBytes, afterBytes: expected.afterBytes, operationCount: expected.operationCount })
      && sha256(before) === row.beforeSha256 && before.length === row.beforeBytes
      && packet.operations.filter(op => op.sourcePath === row.sourcePath).length === row.operationCount,
    'E_REVIEW_HASH', row.sourcePath)
    const value = JSON.parse(before)
    for (const operation of packet.operations.filter(op => op.sourcePath === row.sourcePath)) {
      check(['replace', 'remove'].includes(operation.op) && eq(pointer(value, operation.pointer), operation.before)
        && sha256(JSON.stringify(operation.before)) === operation.beforeSha256
        && (operation.op === 'remove' || sha256(JSON.stringify(operation.after)) === operation.afterSha256),
      'E_REVIEW_HASH', operation.sourcePath, operation.pointer)
      const parentPath = operation.pointer.slice(0, operation.pointer.lastIndexOf('/'))
      const key = operation.pointer.split('/').at(-1)
      if (operation.op === 'remove') pointer(value, parentPath).splice(Number(key), 1)
      else pointer(value, parentPath)[key] = operation.after
    }
    const raw = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    check(sha256(raw) === row.afterSha256 && Buffer.from(current).equals(raw) && current.length === row.afterBytes,
      'E_REVIEW_HASH', row.sourcePath)
    rows.push({ sourcePath: row.sourcePath, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256,
      beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, changed: true, sealed: false })
  }
  check(sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: rows }),
  'E_REVIEW_HASH', '/applied/owner-link-tidy/manifest')
}

async function validatePost108EightDocumentSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = POST108_EIGHT_DOCUMENT_SOURCE
  check(batch.batchId === binding.id && batch.approvalModel === binding.id && eq(batch.personIds, []) && batch.operationCount === 31
    && batch.packetPath === binding.directory + 'application-packet.json' && batch.packetSha256 === binding.packetSha256
    && batch.sourceBeforeAfterPath === binding.directory + 'source-before-after.json'
    && eq(batch.applicationReview, { evidencePath: binding.directory + 'publication-review.json', evidenceSha256: binding.reviewSha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.candidateSha256,
      messageRef: '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/independent-review.md',
      authorizationSha256: binding.reviewMarkdownSha256 }])
    && prefix.length === 108
    && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256,
  'E_APPROVAL_BATCH', '/applied/post108-eight-document')
  const packet = JSON.parse(packetBytes)
  check(sha256(packetBytes) === binding.packetSha256
    && packet.schema === 'seoul-post108-eight-document-source-application.v1' && packet.batchId === binding.id
    && eq(packet.registryPrefix, { count: 108, sha256: binding.prefixSha256 })
    && packet.scope.documentCount === 8 && packet.scope.changedDocumentCount === 7 && packet.scope.unchangedDocumentCount === 1
    && packet.scope.operationCount === 31 && packet.scope.pureLinkTidyAndDedupOperations === 25
    && packet.scope.factPreservingProseCopyeditOperations === 6 && packet.scope.grantCount === 0
    && packet.scope.entityActivationCount === 0 && packet.scope.stableAnchorsRemoved === 0 && packet.scope.rightsChanged === false
    && packet.operations.length === 31 && packet.documents.length === 8,
  'E_APPROVAL_BATCH', batch.packetPath)
  for (const ref of [packet.authority.candidate, packet.authority.independentReviewMarkdown, packet.authority.ownerLinkTidyDecision])
    check(sha256(await readBytes(resolve(root, ref.path))) === ref.sha256, 'E_REVIEW_HASH', ref.path)
  const reviewBytes = await readBytes(resolve(root, packet.authority.independentReviewJson.path))
  check(sha256(reviewBytes) === binding.reviewSha256 && packet.authority.independentReviewJson.sourceSha256 === binding.reviewSourceSha256,
    'E_REVIEW_HASH', packet.authority.independentReviewJson.path)
  const review = JSON.parse(reviewBytes)
  check(review.schema === 'seoul-document-publication-review.v1' && review.documents.length === 8
    && review.approvalRef.endsWith(binding.candidateSha256), 'E_REVIEW_COVERAGE', packet.authority.independentReviewJson.path)
  const rows = []
  for (const row of packet.documents) {
    const expected = binding.sources[row.sourcePath]
    const before = await readBytes(resolve(root, row.archiveBefore))
    const current = await readBytes(resolve(root, row.sourcePath))
    check(expected && row.archiveBefore === '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/before/' + row.sourcePath
      && row.candidatePath === '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/candidate/' + row.sourcePath
      && eq({ beforeSha256: row.beforeSha256, afterSha256: row.afterSha256, beforeBytes: row.beforeBytes,
        afterBytes: row.afterBytes, operationCount: row.operationCount, changed: row.changed }, expected)
      && sha256(before) === row.beforeSha256 && before.length === row.beforeBytes
      && sha256(current) === row.afterSha256 && current.length === row.afterBytes
      && packet.operations.filter(operation => operation.sourcePath === row.sourcePath).length === row.operationCount,
    'E_REVIEW_HASH', row.sourcePath)
    const value = JSON.parse(before)
    for (const operation of packet.operations.filter(operation => operation.sourcePath === row.sourcePath)) {
      check(['replace', 'remove'].includes(operation.op) && eq(pointer(value, operation.pointer), operation.before)
        && sha256(JSON.stringify(operation.before)) === operation.beforeSha256
        && (operation.op === 'remove' || sha256(JSON.stringify(operation.after)) === operation.afterSha256),
      'E_REVIEW_HASH', operation.sourcePath, operation.pointer)
      const parentPath = operation.pointer.slice(0, operation.pointer.lastIndexOf('/'))
      const key = operation.pointer.split('/').at(-1)
      if (operation.op === 'remove') pointer(value, parentPath).splice(Number(key), 1)
      else pointer(value, parentPath)[key] = operation.after
    }
    const raw = Buffer.from(JSON.stringify(value, null, 2) + '\n')
    check(raw.equals(current), 'E_REVIEW_HASH', row.sourcePath)
    const decision = review.documents.find(document => document.sourcePath === row.sourcePath)
    check(decision?.currentSha256 === row.afterSha256 && decision.classification === 'current' && decision.decision === 'approved',
      'E_REVIEW_HASH', packet.authority.independentReviewJson.path, row.sourcePath)
    const beforeValue = JSON.parse(before); const currentValue = JSON.parse(current)
    const currentKeys = walkCensus(currentValue, row.sourcePath)
    check(decision.originalKeys.length > 0 && new Set(decision.originalKeys).size === decision.originalKeys.length,
      'E_REVIEW_COVERAGE', packet.authority.independentReviewJson.path)
    exact(decision.currentKeys.map(item => item.key), [...currentKeys.leaves, ...currentKeys.blocks].map(item => coverageKey(rowOf(item))),
      'E_REVIEW_COVERAGE', packet.authority.independentReviewJson.path)
    for (const item of decision.currentKeys) check(item.sha256 === JSON.parse(item.key)[3],
      'E_REVIEW_HASH', packet.authority.independentReviewJson.path, item.key)
    rows.push({ sourcePath: row.sourcePath, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256,
      beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, changed: row.changed, sealed: false })
  }
  check(sha256(Buffer.from(JSON.stringify(manifest, null, 2) + '\n')) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: rows }),
  'E_REVIEW_HASH', '/applied/post108-eight-document/manifest')
}

async function validateProjectionRefreshSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = PROJECTION_REFRESH_SOURCE
  const materialized = await materializeProjectionRefresh(root, { readBytes })
  check(batch.batchId === binding.id && batch.approvalModel === binding.id && eq(batch.personIds, [])
    && batch.operationCount === 33 && batch.packetPath === binding.directory + 'application-packet.json'
    && batch.packetSha256 === binding.packetSha256 && batch.sourceBeforeAfterPath === binding.directory + 'source-before-after.json'
    && eq(batch.applicationReview, { evidencePath: '.omo/private/seoul-migration/doc247-review/batch2b-bestiary-regenerated/regen-manifest.json', evidenceSha256: PROJECTION_REFRESH_EXPECTED.regenManifestSha256 })
    && eq(batch.approvals, materialized.entry.approvals) && prefix.length === 109
    && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === PROJECTION_REFRESH_EXPECTED.registryPrefixSha256,
  'E_APPROVAL_BATCH', '/applied/projection-refresh')
  check(sha256(packetBytes) === binding.packetSha256 && Buffer.from(packetBytes).equals(materialized.packetBytes)
    && sha256(Buffer.from(JSON.stringify(manifest, null, 2) + '\n')) === binding.manifestSha256
    && eq(manifest, materialized.sourceBeforeAfter),
  'E_REVIEW_HASH', '/applied/projection-refresh/authentication')
  const archive = await readBytes(resolve(root, materialized.packet.authority.externalTheatersPreimage.path))
  check(sha256(archive) === materialized.packet.authority.externalTheatersPreimage.sha256,
    'E_REVIEW_HASH', '/applied/projection-refresh/preimage')
}

async function validateVassalCodeSuccessor(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = VASSAL_CODE_SUCCESSOR; const path = 'lore/relations/validate.mjs'
  const directory = binding.directory
  const report = { path: directory + 'consumer-report.md', sha256: binding.reportSha256 }
  const owner = { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: STABLE_THREE_SOURCE.ownerSha256 }
  const tests = { path: 'lore/relations/validate.test.mjs', sha256: binding.testSha256 }
  const original = { revision: '45c1cb49de218fec47206859b862ac041014602e', path,
    sha256: 'd3825a8d21a0d6363d4b3a30663b38570fcf6ef2de5967ac1bf16c43fc96fd94' }
  const predecessor = { batchId: 'k1003-k1004', manifestPath: '.omo/private/seoul-migration/k1003-k1004-combined-approved-staging/source-before-after.json',
    sha256: binding.beforeSha256 }
  check(prefix.length === 72 && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256
    && batch.batchId === binding.id && batch.packetPath === directory + 'application-packet.json'
    && batch.packetSha256 === binding.packetSha256 && batch.operationCount === 1
    && eq(batch.personIds, []) && eq(batch.applicationReview, { evidencePath: report.path, evidenceSha256: report.sha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: report.sha256, messageRef: owner.path, authorizationSha256: owner.sha256 }])
    && sha256(packetBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', '/applied/vassal-code')
  const packet = JSON.parse(packetBytes)
  check(eq(packet, {
    schema: 'seoul-technical-code-successor.v1', batchId: binding.id,
    registryPrefix: { count: 72, sha256: binding.prefixSha256 },
    authority: { owner, consumerReport: report, consumerTests: tests, original, predecessor },
    source: { path, beforeSha256: binding.beforeSha256, afterSha256: binding.afterSha256,
      beforeBytes: 15424, afterBytes: 18407,
      beforeArchive: directory + 'before.validate.mjs.gz.b64', afterArchive: directory + 'after.validate.mjs.gz.b64',
      beforeArchiveSha256: binding.beforeArchiveSha256, afterArchiveSha256: binding.afterArchiveSha256 },
    scope: { codeOnly: true, semanticNarrativeApproval: false, publicationReview: false, grantCount: 0, entityActivationCount: 0 },
  }), 'E_APPROVAL_BATCH', batch.packetPath)
  const repin = await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readBytes) ?? readBytes)
  for (const evidence of [owner, report, tests]) {
    const currentSha256 = sha256(await readBytes(resolve(root, evidence.path)))
    const successor = repin.transitions.find(row => row.path === evidence.path)
    check(currentSha256 === evidence.sha256 || (successor?.beforeSha256 === evidence.sha256
      && successor.afterSha256 === currentSha256), 'E_REVIEW_HASH', evidence.path)
  }
  const prior = prefix[0]
  const priorManifest = await readBytes(resolve(root, predecessor.manifestPath))
  const priorRow = JSON.parse(priorManifest).sources.find(row => row.sourcePath === path)
  check(prior.batchId === predecessor.batchId && prior.sourceBeforeAfterPath === predecessor.manifestPath
    && priorRow?.beforeSha256 === original.sha256 && priorRow?.afterSha256 === predecessor.sha256
    && priorRow.beforeBytes === 14912 && priorRow.afterBytes === 15489
    && priorRow.changeClass === 'applied-state-contract-evolution',
  'E_REVIEW_HASH', predecessor.manifestPath)
  const beforeArchive = await readBytes(resolve(root, packet.source.beforeArchive))
  const afterArchive = await readBytes(resolve(root, packet.source.afterArchive))
  const before = gunzipSync(Buffer.from(beforeArchive.toString().trim(), 'base64'))
  const after = gunzipSync(Buffer.from(afterArchive.toString().trim(), 'base64'))
  check(sha256(beforeArchive) === binding.beforeArchiveSha256 && sha256(afterArchive) === binding.afterArchiveSha256
    && sha256(before) === binding.beforeSha256 && before.length === 15424
    && sha256(after) === binding.afterSha256 && after.length === 18407,
  'E_REVIEW_HASH', directory)
  const live = await readBytes(resolve(root, path))
  const codeSuccessor = repin.transitions.find(row => row.path === path)
  check(sha256(live) === binding.afterSha256 || (codeSuccessor?.beforeSha256 === binding.afterSha256
    && codeSuccessor.afterSha256 === sha256(live)), 'E_REVIEW_HASH', path)
  const originalBytes = (await promisify(execFile)('git', ['-C', root, 'show', `${original.revision}:${path}`],
    { encoding: 'buffer', maxBuffer: 1024 * 1024 })).stdout
  check(sha256(originalBytes) === original.sha256 && originalBytes.length === 14912,
    'E_ARCHIVE_HASH', path)
  const marker = '  const events = chronicle.content.filter((block) => block.kind === "paragraph")\n'
  const start = originalBytes.toString().indexOf(marker)
  const end = originalBytes.toString().indexOf('  return {\n    config, states, vassals', start)
  const additionStart = after.toString().indexOf('  // An archived event keeps its identity')
  const additionEnd = after.toString().indexOf('  return {\n    config, states, vassals', additionStart)
  const reconstructed = (originalBytes.toString().slice(0, start) + after.toString().slice(additionStart, additionEnd)
    + originalBytes.toString().slice(end)).replace('  for (const row of events) {\n',
      '  for (const row of events) {\n    if (row.date === null) continue;\n')
  check(start >= 0 && end > start && additionStart >= 0 && additionEnd > additionStart
    && reconstructed === before.toString(), 'E_REVIEW_HASH', '/applied/vassal-code/predecessor')
  const vassalStart = after.toString().indexOf('export function resolveVassals(')
  const vassalEnd = after.toString().indexOf('export function loadDataset()', vassalStart)
  check(vassalStart > 0 && vassalEnd > vassalStart
    && after.toString().includes('const { vassals, errors: vassalErrors } = resolveVassals(stateSource, states);')
    && after.toString().includes('errors.push(...(dataset.vassalErrors || []));')
    && after.toString().includes('`${row.id}: source relation mismatch`')
    && after.toString().includes('if (row.relationKind === "current-vassal") fk(row.parentStateId, polityIds, row.id);')
    && after.toString().includes('if (row.date === null) continue;'), 'E_REVIEW_HASH', '/applied/vassal-code/consumer')
  const expectedManifest = { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: [{
    sourcePath: path, beforeSha256: binding.beforeSha256, afterSha256: binding.afterSha256,
    beforeBytes: 15424, afterBytes: 18407, changed: true, sealed: false }] }
  check(batch.sourceBeforeAfterPath === directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, expectedManifest)
    && (Buffer.from(live).equals(after) || (codeSuccessor?.beforeSha256 === sha256(after)
      && codeSuccessor.afterSha256 === sha256(live))),
  'E_REVIEW_HASH', '/applied/vassal-code/manifest')
}

async function validateHouseholdProjectionSuccessor(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = HOUSEHOLD_PROJECTION_SUCCESSOR; const directory = binding.directory
  const path = 'lore/name-pools/cast-household-relations.json'
  const owner = { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: STABLE_THREE_SOURCE.ownerSha256 }
  const canonicalSource = { path: 'lore/characters/Cast-Relations.json', sha256: binding.canonicalSha256,
    pointer: '/content/3/rows/313/3/ko', value: '문하율의 능선 감시 일정에 맞춰 개폐 시각을 조정한다',
    sourceBatchId: 'owner-recommendations-characters',
    sourceManifestPath: '.omo/private/seoul-migration/post62-registration-20261015/owner-recommendations-characters/source-before-after.json' }
  const priorHouseholdBatch = { batchId: 'family-preservation-repairs-101',
    manifestPath: '.omo/private/seoul-migration/completed-source-registration-20261015/family-preservation-repairs-101/source-before-after.json',
    afterSha256: binding.beforeSha256 }
  const beforeRole = '문하율의 능선 감시가 배관을 얼리기 전에 개폐 시각을 맞춘다'
  const expectedOperations = [[348, 7, 'K349', 'incoming', 'K354'], [353, 3, 'K354', 'outgoing', 'K349']]
    .map(([personIndex, linkIndex, personId]) => ({ op: 'replace', file: path,
      path: `/people/${personIndex}/knownLinks/${linkIndex}/role`, personId, before: beforeRole,
      after: canonicalSource.value, beforeSha256: sha256(JSON.stringify(beforeRole)),
      afterSha256: sha256(JSON.stringify(canonicalSource.value)) }))
  check(prefix.length === 73 && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256
    && batch.batchId === binding.id && eq(batch.personIds, []) && batch.operationCount === 2
    && batch.packetPath === directory + 'application-packet.json' && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: directory + 'review.md', evidenceSha256: binding.reviewSha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.packetSha256,
      messageRef: owner.path, authorizationSha256: owner.sha256 }])
    && sha256(packetBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', '/applied/household-projection')
  const packet = JSON.parse(packetBytes)
  check(eq(packet, {
    schema: 'seoul-household-source-projection-successor.v1', batchId: binding.id,
    registryPrefix: { count: 73, sha256: binding.prefixSha256 },
    authority: { owner, canonicalSource, priorHouseholdBatch },
    source: { path, beforeSha256: binding.beforeSha256, afterSha256: binding.afterSha256,
      beforeBytes: 3335487, afterBytes: 3335467,
      beforeArchive: directory + 'before.cast-household-relations.json.gz.b64',
      beforeArchiveSha256: binding.beforeArchiveSha256 },
    operations: expectedOperations,
    scope: { sourceProjectionOnly: true, semanticNarrativeApproval: false,
      publicationReview: false, grantCount: 0, entityActivationCount: 0 },
  }), 'E_APPROVAL_BATCH', batch.packetPath)
  check(sha256(await readBytes(resolve(root, owner.path))) === owner.sha256
    && sha256(await readBytes(resolve(root, directory + 'review.md'))) === binding.reviewSha256,
  'E_REVIEW_HASH', directory)
  const canonicalBytes = await readBytes(resolve(root, canonicalSource.path))
  const canonicalBatch = prefix.find(row => row.batchId === canonicalSource.sourceBatchId)
  const canonicalManifest = JSON.parse(await readBytes(resolve(root, canonicalSource.sourceManifestPath)))
  check(sha256(canonicalBytes) === canonicalSource.sha256
    && canonicalBatch?.sourceBeforeAfterPath === canonicalSource.sourceManifestPath
    && canonicalManifest.sources.some(row => row.sourcePath === canonicalSource.path && row.afterSha256 === canonicalSource.sha256)
    && pointer(JSON.parse(canonicalBytes), canonicalSource.pointer) === canonicalSource.value,
  'E_REVIEW_HASH', canonicalSource.path, canonicalSource.pointer)
  const predecessor = prefix.find(row => row.batchId === priorHouseholdBatch.batchId)
  const previous = JSON.parse(await readBytes(resolve(root, priorHouseholdBatch.manifestPath)))
    .sources.find(row => row.sourcePath === path)
  check(predecessor?.sourceBeforeAfterPath === priorHouseholdBatch.manifestPath
    && previous?.afterSha256 === binding.beforeSha256 && previous.afterBytes === 3335487,
  'E_REVIEW_HASH', priorHouseholdBatch.manifestPath)
  const archive = await readBytes(resolve(root, packet.source.beforeArchive))
  const before = gunzipSync(Buffer.from(archive.toString().trim(), 'base64'))
  const after = await readBytes(resolve(root, path))
  check(sha256(archive) === binding.beforeArchiveSha256
    && sha256(before) === binding.beforeSha256 && before.length === 3335487
    && sha256(after) === binding.afterSha256 && after.length === 3335467,
  'E_REVIEW_HASH', path)
  const value = JSON.parse(before)
  for (const [index, [personIndex, linkIndex, personId, direction, recipientId]] of
    [[348, 7, 'K349', 'incoming', 'K354'], [353, 3, 'K354', 'outgoing', 'K349']].entries()) {
    const person = value.people[personIndex], link = person?.knownLinks?.[linkIndex], op = expectedOperations[index]
    check(person?.personId === personId && link?.recipientId === recipientId
      && link?.recipientKind === 'person' && link?.type === '계약' && link?.direction === direction
      && link?.status === 'source-projection' && eq(link?.sourceRefs, [{ path: canonicalSource.path, anchor: '/content/3/rows/313' }])
      && link.role === op.before, 'E_REVIEW_HASH', path, op.path)
    link.role = op.after
  }
  const expectedAfter = before.toString().replaceAll(JSON.stringify(beforeRole), JSON.stringify(canonicalSource.value))
  check(before.toString().split(JSON.stringify(beforeRole)).length === 3
    && expectedAfter === after.toString() && eq(value, JSON.parse(after)),
  'E_REVIEW_HASH', '/applied/household-projection/replay')
  for (const op of [...expectedOperations].reverse()) pointer(value, op.path.slice(0, op.path.lastIndexOf('/'))).role = op.before
  check(eq(value, JSON.parse(before))
    && batch.sourceBeforeAfterPath === directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: [{
      sourcePath: path, beforeSha256: binding.beforeSha256, afterSha256: binding.afterSha256,
      beforeBytes: 3335487, afterBytes: 3335467, changed: true, sealed: false }] }),
  'E_REVIEW_HASH', '/applied/household-projection/manifest')
}

async function validateCoreSixSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = CORE_SIX_SOURCE; const directory = binding.directory
  const sourcePath = 'lore/characters/Core-Characters.json'
  const authority = {
    owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: binding.ownerSha256 },
    proposal: { path: '.omo/private/seoul-migration/core-card-location-prose-repair-proposal-20261015/proposal.json', sha256: binding.proposalSha256 },
    correction: { path: '.omo/private/seoul-migration/core-card-location-prose-repair-proposal-20261015/k1009-correction-v2.json', sha256: binding.correctionSha256 },
    independent: { path: '.omo/private/seoul-migration/core-card-location-prose-repair-proposal-20261015/independent-v2.json', sha256: binding.independentSha256 },
  }
  const registryPrefix = { count: 74, sha256: binding.prefixSha256 }
  check(prefix.length === registryPrefix.count
    && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256
    && batch.batchId === binding.id && batch.operationCount === 6
    && eq(batch.personIds, []) && batch.packetPath === directory + 'application-packet.json'
    && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: authority.independent.path, evidenceSha256: authority.independent.sha256 })
    && eq(batch.approvals, [{ kind: binding.id, bodySha256: binding.packetSha256,
      messageRef: authority.owner.path, authorizationSha256: authority.owner.sha256 }])
    && sha256(packetBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', '/applied/core-six')
  const packet = JSON.parse(packetBytes)
  const source = { path: sourcePath, beforeSha256: binding.beforeSha256, afterSha256: binding.afterSha256,
    beforeBytes: 118974, afterBytes: 117502, beforeArchive: directory + 'before.core-characters.json.gz.b64',
    beforeArchiveSha256: binding.archiveSha256 }
  check(packet.schema === 'seoul-core-six-reviewed-source-application.v1' && packet.batchId === binding.id
    && eq(packet.registryPrefix, registryPrefix) && eq(packet.authority, authority)
    && eq(packet.source, source)
    && eq(packet.scope, { sourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 })
    && eq(Object.keys(packet), ['schema', 'batchId', 'registryPrefix', 'authority', 'source', 'operations', 'scope']),
  'E_APPROVAL_BATCH', batch.packetPath)
  const evidence = new Map()
  for (const [kind, ref] of Object.entries(authority)) {
    const bytes = await readBytes(resolve(root, ref.path))
    check(sha256(bytes) === ref.sha256, 'E_REVIEW_HASH', ref.path)
    if (kind !== 'owner') evidence.set(kind, JSON.parse(bytes))
  }
  const proposal = evidence.get('proposal'), correction = evidence.get('correction'), review = evidence.get('independent')
  check(proposal.source?.rawSha256Before === source.beforeSha256 && proposal.operations?.length === 6
    && correction.baseProposalSha256 === authority.proposal.sha256 && correction.sourceSha256 === source.beforeSha256
    && correction.operation?.path === '/content/152/text' && correction.operation?.op === 'replace'
    && review.status === 'bounded-pass-private-unapplied' && review.baseProposalSha256 === authority.proposal.sha256
    && review.correctionSha256 === authority.correction.sha256 && review.sourceSha256 === source.beforeSha256
    && review.compositeSerializedSha256 === source.afterSha256 && review.publicationApproval === false,
  'E_REVIEW_HASH', directory)
  const expectedOps = proposal.operations.map(row => ({ op: 'replace', file: sourcePath, path: row.path,
    personId: row.id, anchor: row.anchor, before: row.before,
    after: row.id === 'K1009' ? correction.operation.after : row.after,
    beforeSha256: sha256(JSON.stringify(row.before)),
    afterSha256: sha256(JSON.stringify(row.id === 'K1009' ? correction.operation.after : row.after)) }))
  check(eq(packet.operations, expectedOps) && eq(expectedOps.map(row => row.personId),
    ['K1005', 'K086', 'K087', 'K1006', 'K1009', 'K1010'])
    && eq(correction.operation.before, proposal.operations[4].after), 'E_REVIEW_HASH', directory + 'operations')
  const archive = await readBytes(resolve(root, source.beforeArchive))
  const before = gunzipSync(Buffer.from(archive.toString().trim(), 'base64'))
  const after = await historicalSourceBytes(sourcePath, source.afterSha256, readBytes, root)
  check(sha256(archive) === source.beforeArchiveSha256
    && sha256(before) === source.beforeSha256 && before.length === source.beforeBytes
    && sha256(after) === source.afterSha256 && after.length === source.afterBytes,
  'E_REVIEW_HASH', '/applied/core-six/source', sourcePath)
  const replay = JSON.parse(before)
  for (const op of expectedOps) {
    check(eq(pointer(replay, op.path), op.before), 'E_REVIEW_HASH', '/applied/core-six/replay-before', op.path)
    pointer(replay, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.after
  }
  check(Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after), 'E_REVIEW_HASH', '/applied/core-six/replay-after', sourcePath)
  for (const op of [...expectedOps].reverse()) {
    check(eq(pointer(replay, op.path), op.after), 'E_REVIEW_HASH', '/applied/core-six/replay-restore', op.path)
    pointer(replay, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.before
  }
  check(Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(before)
    && batch.sourceBeforeAfterPath === directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === binding.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.id, sources: [{
      sourcePath, beforeSha256: source.beforeSha256, afterSha256: source.afterSha256,
      beforeBytes: source.beforeBytes, afterBytes: source.afterBytes, changed: true, sealed: false }] }),
  'E_REVIEW_HASH', directory + 'manifest')
}

async function validateCompletedSourceTransition(batch, packetBytes, manifest, readBytes, root) {
  const model = batch.approvalModel; const binding = COMPLETED_SOURCE_TRANSITIONS[model]
  check(batch.batchId === model && eq(batch.personIds, []) && batch.packetSha256 === binding.packetSha256
    && eq(batch.applicationReview, binding.review) && eq(batch.approvals, [{ kind: model,
      bodySha256: binding.receipt.sha256, messageRef: binding.receipt.path }]), 'E_APPROVAL_KIND', '/applied/completed-source', model)
  const packet = await completedSourcePacket(model, readBytes, root)
  check(eq(JSON.parse(packetBytes), packet) && eq(packet.sealedReceipt, binding.receipt), 'E_APPROVAL_BATCH', '/applied/completed-source/packet')
  const receiptBytes = await readBytes(resolve(root, binding.receipt.path))
  check(sha256(receiptBytes) === binding.receipt.sha256, 'E_APPROVAL_BATCH', binding.receipt.path)
  const receipt = JSON.parse(receiptBytes)
  const replacement = model === 'bibliography-json-authoring-transition'
  const faction = model === 'three-faction-source-direction'
  const connected = ['connected-atlas-62', 'connected-chronology-172', 'connected-articles-97', 'connected-table-translation-8'].includes(model)
  const schema = model === 'center-region-authoring-schema'
  const family = model === 'family-preservation-repairs-101'
  const formation = model === 'membership-formation-alignment-2'
  const lineage = model === 'diaspora-lineage-canonical-sync-13'
  const station = model === 'station-climate-v2-24'
  const soulRefs = model === 'rc-l1-evidence-reference-sync-127'
  const rationale = model === 'min-ungi-rationale-exact-two'
  const d1ab = model === 'remaining-corpus-D1AB-31'
  const d1style = model === 'remaining-corpus-D1A-style-22'
  const d1c = model === 'remaining-corpus-D1C-36'
  const k271 = model === 'k271-bilingual-alignment-2'
  const selectionLabel = model === 'selection-provenance-label-1'
  const waterV3 = model === 'water-v3-exact-21'
  const retained14 = model === 'opening-office-retained-14'
  const waterNeighbor = model === 'water-neighbor-exact-12'
  const q2v2 = model === 'sixteen-states-Q2-v2-28'
  const winter10 = model === 'water-global-winter-context-10'
  const fullbody34 = model === 'sixteen-states-fullbody-34'
  const waterFinal18 = model === 'water-final-context-18'
  const authoringStatus = model === 'sixteen-states-authoring-status-1'
  const structuresRoute = model === 'water-structures-route-2'
  const waterStatuses = model === 'water-five-authoring-status-5'
  if (waterStatuses) {
    check(receipt.ownerCall === 'call_PgBmxtBrrtS9dajq99c5HYiE'
      && sha256(await readBytes(resolve(root, receipt.ownerDecision.path))) === '8bf38dd827fcb818a4a6c99b24dcf58ca7fb9c129f2a9fcc151d1a1581e1cff4'
      && sha256(await readBytes(resolve(root, receipt.ownerBodyReceipt.path))) === '8441e7d82ed376e6b7279f34591c6fc6cfd17981f9cd6bdfa412236eb1d67c4a'
      && packet.operations.length === 5 && packet.sources.length === 5
      && packet.operations.every(op => op.path === '/status' && op.oldValue === 'draft' && op.value === 'approved'), 'E_APPROVAL_BATCH', '/applied/water-statuses')
    for (const source of packet.sources) {
      const body = JSON.parse(gunzipSync(Buffer.from(source.afterGzipBase64, 'base64')))
      const binding = receipt.sources.find(row => row.sourcePath === source.sourcePath)
      check(binding && sha256(renderLoreMarkdown(body, 'ko')) === binding.render.ko
        && sha256(renderLoreMarkdown(body, 'en')) === binding.render.en, 'E_REVIEW_HASH', '/applied/water-statuses/render')
    }
  }
  if (structuresRoute) {
    check(receipt.ownerApproval.call === 'call_PgBmxtBrrtS9dajq99c5HYiE'
      && sha256(await readBytes(resolve(root, receipt.ownerApproval.approvedDecisionPath))) === '8bf38dd827fcb818a4a6c99b24dcf58ca7fb9c129f2a9fcc151d1a1581e1cff4'
      && sha256(await readBytes(resolve(root, receipt.ownerApproval.referencedFourBodyPath))) === '0683b9a62bcf986eaef321134cc8ab37a536f2a0b20eecb029c8546eefba12a1'
      && packet.sources.length === 1 && packet.sources[0].sourcePath === 'lore/structures/Structures.json'
      && packet.sources[0].beforeSha256 === receipt.application.beforeRawSha256
      && packet.sources[0].afterSha256 === receipt.application.afterRawSha256, 'E_APPROVAL_BATCH', '/applied/structures-route')
    exact(packet.operations.map(op => op.path), ['/content/18/text/ko', '/content/18/text/en'], 'E_SCOPE_SHAPE', '/applied/structures-route/pointers')
  }
  if (authoringStatus) {
    check(receipt.authority.ownerCall === 'call_E6L6qvlP8F34ku1L0VQ8l2xz'
      && sha256(await readBytes(resolve(root, receipt.authority.proposalPath))) === '2e04620c44e60215406892384965f7e308d78131e47bc34f4c20a88dc5a2f492'
      && eq(packet.operations, [{ op: 'replace', file: 'lore/factions/Sixteen-States.json', path: '/status', oldValue: 'draft', value: 'approved' }])
      && packet.sources.length === 1 && packet.sources[0].beforeSha256 === '077bff23d933749a12f9aab2d4583f7b5bf0e7001e6bd78716be7b723faf5435'
      && packet.sources[0].afterSha256 === 'f373b1a10dbc32f82d291bf49abc8158363ce98f9c72ab65a2299e8f9ae12fc4', 'E_APPROVAL_BATCH', '/applied/authoring-status')
  }
  let finalWaterOperations
  if (waterFinal18) {
    const proposalBytes = await readBytes(resolve(root, receipt.approvedProposal.path))
    check(receipt.ownerReceipt.call === 'call_4yhv9cYhhA3BeziItZlK9O1h'
      && sha256(proposalBytes) === '6d0c5f17f458ab985e27ecb7dc509de9c392cce8834357bf13d5b1d638908247', 'E_APPROVAL_BATCH', '/applied/water18/authority')
    finalWaterOperations = JSON.parse(proposalBytes).operations.map(op => ({ op: 'replace', file: op.file, path: op.pointer, oldValue: op.before, value: op.after }))
    check(finalWaterOperations.length === 18 && packet.sources.length === 4, 'E_SCOPE_SHAPE', '/applied/water18/count')
    exact(packet.sources.map(source => source.sourcePath), receipt.files.map(file => file.path), 'E_SCOPE_SHAPE', '/applied/water18/sources')
    for (const source of packet.sources) {
      const file = receipt.files.find(file => file.path === source.sourcePath)
      check(source.beforeSha256 === file.beforeSha256 && source.afterSha256 === file.afterSha256, 'E_REVIEW_HASH', '/applied/water18/hashes')
    }
  }
  let fullbodyOperations
  if (fullbody34) {
    const proposalBytes = await readBytes(resolve(root, receipt.proposal.path))
    check(receipt.ownerApproval.call === 'call_E6L6qvlP8F34ku1L0VQ8l2xz'
      && sha256(proposalBytes) === '53d6b2719eda873ef03870aec0544c84b4ae91d60d0263a851c4252327a61639', 'E_APPROVAL_BATCH', '/applied/fullbody34/authority')
    fullbodyOperations = JSON.parse(proposalBytes).operations.map(op => ({ op: 'replace', file: receipt.source.path, path: op.pointer, oldValue: op.before, value: op.after }))
    check(fullbodyOperations.length === 34 && packet.sources.length === 1
      && packet.sources[0].sourcePath === 'lore/factions/Sixteen-States.json'
      && packet.sources[0].beforeSha256 === receipt.source.beforeRawSha256
      && packet.sources[0].afterSha256 === receipt.source.afterRawSha256
      && gunzipSync(Buffer.from(packet.sources[0].beforeGzipBase64, 'base64')).equals(Buffer.from(receipt.inverse.beforeRawBytesBase64, 'base64')), 'E_REVIEW_HASH', '/applied/fullbody34/source')
    const after = JSON.parse(gunzipSync(Buffer.from(packet.sources[0].afterGzipBase64, 'base64')))
    check(sha256(renderLoreMarkdown(after, 'ko')) === '1ffa22f1a2caac77acaed8012e91c02d5e4d7ed2b9abeec1fb8d1f629af03e21'
      && sha256(renderLoreMarkdown(after, 'en')) === '794bcd7ac0a6ff404338738c520ba50b0cccd47ac6cfb87c76a26a3b0e08617c', 'E_REVIEW_HASH', '/applied/fullbody34/render')
    const q2Bytes = await readBytes(resolve(root, '.omo/private/seoul-migration/sixteen-states-Q2-exact-body-proposal-v2-20261015.json'))
    check(sha256(q2Bytes) === '5c949d1bdc7259f15108a6c310706251566c94621341d8142b93c9229b985b53', 'E_APPROVAL_BATCH', '/applied/fullbody34/Q2')
    for (const op of JSON.parse(q2Bytes).operations) for (const [locale, leaf] of Object.entries(op.leaves)) {
      check(pointer(after, op.pointer + '/' + locale) === leaf.after, 'E_REVIEW_HASH', '/applied/fullbody34/Q2', op.id)
    }
  }
  let winterOperations
  if (winter10) {
    const proposalBytes = await readBytes(resolve(root, receipt.proposal.path))
    check(receipt.ownerReceipt.call === 'call_zE7phab4yHYL67N1UrdP15pF'
      && sha256(proposalBytes) === '4ce28851071fc699f9473e2641cca778fb020f2aa2660f6f08319323395ea5e8', 'E_APPROVAL_BATCH', '/applied/winter10/authority')
    winterOperations = JSON.parse(proposalBytes).operations.map(op => ({ op: 'replace', file: op.file, path: op.pointer, oldValue: op.before, value: op.after }))
    check(winterOperations.length === 10 && packet.sources.length === 2, 'E_SCOPE_SHAPE', '/applied/winter10/count')
    exact(packet.sources.map(source => source.sourcePath), ['lore/ailments/Ailments.json', 'lore/culture/Food-Culture.json'], 'E_SCOPE_SHAPE', '/applied/winter10/sources')
    for (const source of packet.sources) {
      const applied = receipt.sourceOwners.find(row => row.path === source.sourcePath)
      check(source.beforeSha256 === applied.beforeRawSha256 && source.afterSha256 === applied.afterRawSha256, 'E_REVIEW_HASH', '/applied/winter10/hashes')
    }
  }
  let q2Operations
  if (q2v2) {
    const proposalBytes = await readBytes(resolve(root, receipt.proposal.path))
    check(receipt.ownerApproval.call === 'call_6pbtXvMc1fpfkniFSQ8Rjq9a'
      && sha256(proposalBytes) === '5c949d1bdc7259f15108a6c310706251566c94621341d8142b93c9229b985b53', 'E_APPROVAL_BATCH', '/applied/Q2v2/authority')
    q2Operations = JSON.parse(proposalBytes).operations.flatMap(op => Object.entries(op.leaves)
      .map(([locale, leaf]) => ({ op: 'replace', file: receipt.source.path, path: op.pointer + '/' + locale, oldValue: leaf.before, value: leaf.after })))
    check(q2Operations.length === 28 && packet.sources.length === 1
      && packet.sources[0].sourcePath === 'lore/factions/Sixteen-States.json'
      && packet.sources[0].beforeSha256 === receipt.source.beforeRawSha256
      && packet.sources[0].afterSha256 === receipt.source.afterRawSha256
      && gunzipSync(Buffer.from(packet.sources[0].beforeGzipBase64, 'base64')).equals(Buffer.from(receipt.inverse.beforeRawBytesBase64, 'base64')), 'E_REVIEW_HASH', '/applied/Q2v2/source')
  }
  let neighborOperations
  if (waterNeighbor) {
    const proposalBytes = await readBytes(resolve(root, receipt.approvedProposal.path))
    check(receipt.ownerReceipt.call === 'call_HCL5A90oGC7BCC6R6hYdhxwt'
      && sha256(proposalBytes) === 'd61520e0ea88712cb96444b0a21e6bb2de260a6c2674984f808803d77093ee79'
      && sha256(await readBytes(resolve(root, receipt.waterV3AppliedReceipt.path))) === '46616f21b6b688a444e3e71faacbcbacb23e2e896f3b7ab40248469014471a2e', 'E_APPROVAL_BATCH', '/applied/water-neighbor/authority')
    neighborOperations = JSON.parse(proposalBytes).operations.map(op => ({ op: 'replace', file: op.file, path: op.pointer, oldValue: op.before, value: op.after }))
  }
  let retainedOperations
  if (retained14) {
    const proposalBytes = await readBytes(resolve(root, receipt.proposal.path))
    check(receipt.ownerApproval.callId === 'call_GVwRB7FZt5SNVB3PqR7yi4aH'
      && sha256(proposalBytes) === 'a48133334673024f589e85f9b1c32ebb46b09dc78775a6c2db388382d13b0fdd', 'E_APPROVAL_BATCH', '/applied/retained14/owner')
    const proposal = JSON.parse(proposalBytes)
    const choiceBytes = await readBytes(resolve(root, proposal.source.choiceSource))
    check(sha256(choiceBytes) === 'e7bd6747b1507365ede42a8bc8fa28c744fcf790b6835b431e1d4fd76755472d', 'E_APPROVAL_BATCH', '/applied/retained14/preimages')
    const choice = JSON.parse(choiceBytes)
    retainedOperations = proposal.rows.map(row => {
      const before = choice.rows.find(original => original.personId === row.personId)?.before
      check(sha256(JSON.stringify(before)) === row.beforeValueSha256, 'E_REVIEW_HASH', row.sourcePointer)
      return { op: 'replace', file: receipt.source.path, path: row.sourcePointer, oldValue: before, value: row.proposedAfter }
    })
  }
  let k271Proposal
  if (k271) {
    check(receipt.ownerBinding.call === 'call_c3auQOPnjmhQBB8cXnhGm78S'
      && sha256(await readBytes(resolve(root, receipt.ownerBinding.decisionReceipt))) === '922a814c58aa1c970c9205d68069761295618b2a65674f3344827913953456d0', 'E_APPROVAL_BATCH', '/applied/K271/owner')
    const bytes = await readBytes(resolve(root, receipt.ownerBinding.approvedProposal))
    check(sha256(bytes) === '8571ad507f48a5e03be4c383fa82015ebb486071857e59c63389598511446e69', 'E_APPROVAL_BATCH', '/applied/K271/proposal')
    k271Proposal = JSON.parse(bytes)
  }
  const schemaBranch = '/allOf/1/properties/data/properties/currentAffiliation/properties/hegemons/items/oneOf'
  const operations = replacement ? [{ op: 'replace-source', file: receipt.before.path, path: '', sourcePath: receipt.after.path,
    beforeSha256: receipt.before.sha256, afterSha256: receipt.after.sha256 }]
    : faction ? receipt.files.filter(file => receipt.registrationSuccessors.some(row => row.path === file.path))
      .flatMap(file => (file.leafOperations ?? file.textOperations).map(op => ({ op: op.op, file: file.path, path: op.path ?? '',
        ...(op.before !== undefined ? { oldValue: op.before } : {}), ...(op.after !== undefined ? { value: op.after } : {}) })))
    : schema ? [0, 1].flatMap(index => ['required', 'properties'].map(field => {
      const path = schemaBranch + '/' + index + '/' + field; const file = receipt.files[0]
      return { op: 'replace', file: file.file, path, oldValue: pointer(JSON.parse(file.before), path), value: pointer(JSON.parse(file.after), path) }
    }))
    : waterStatuses ? receipt.operations
    : structuresRoute ? receipt.application.operations.map(op => ({ op: 'replace', file: receipt.application.sourcePath, path: op.pointer, oldValue: op.before, value: op.after }))
    : authoringStatus ? receipt.operations
    : waterFinal18 ? finalWaterOperations
    : fullbody34 ? fullbodyOperations
    : winter10 ? winterOperations
    : q2v2 ? q2Operations
    : waterNeighbor ? neighborOperations
    : retained14 ? retainedOperations
    : waterV3 ? receipt.files.flatMap(file => file.operations.map(op => ({ op: 'replace', file: file.path, path: op.pointer, oldValue: op.before, value: op.after })))
    : selectionLabel ? [{ op: 'replace', file: receipt.sourcePath, path: receipt.forward.pointer, oldValue: receipt.forward.before, value: receipt.forward.after }]
    : k271 ? receipt.operations.map((op, index) => ({ op: 'replace', file: receipt.source, path: op.address.split('#')[1], oldValue: op.inverseExactBefore, value: k271Proposal.contextOperations[index].after }))
    : d1c ? receipt.operations.map(op => ({ op: 'replace', file: op.address.split('#')[0], path: op.address.split('#')[1], oldValue: op.before, value: op.after }))
    : d1ab ? receipt.files.flatMap(file => file.operations.map(op => ({ op: 'replace', file: file.sourcePath, path: op.pointer, oldValue: op.before, value: op.after })))
    : d1style ? receipt.operations.map(op => ({ op: 'replace', file: receipt.sourcePath, path: op.pointer, oldValue: op.before, value: op.after }))
    : soulRefs ? receipt.edits.map(op => ({ op: 'replace', file: op.path, path: op.pointer, oldValue: op.before, value: op.after }))
    : rationale ? receipt.changes.map(op => ({ op: 'replace', file: op.path, path: op.pointer, oldValue: op.beforeValue, value: op.afterValue }))
    : station ? receipt.operations.map(op => ({ op: op.op, file: op.path, path: op.pointer, oldValue: op.before, ...(op.op === 'replace' ? { value: op.after } : {}) }))
    : receipt.operations.map(op => ({ op: 'replace', file: formation ? receipt.source : op.sourcePath ?? op.file ?? op.path, path: op.jsonPointer ?? op.pointer ?? op.path,
      oldValue: op.before, value: op.after }))
  check(eq(packet.operations, operations) && batch.operationCount === operations.length, 'E_APPROVAL_BATCH', '/applied/completed-source/operations')
  const rows = []
  if (waterNeighbor) {
    check(operations.length === 12, 'E_SCOPE_SHAPE', '/applied/water-neighbor/count')
    exact(packet.sources.map(row => row.sourcePath), ['lore/culture/Food-Culture.json', 'lore/culture/Oral-Stories.json'], 'E_SCOPE_SHAPE', '/applied/water-neighbor/sources')
  }
  if (retained14) {
    check(operations.length === 14 && operations.filter(op => !eq(op.oldValue, op.value)).length === 13
      && operations.every(op => op.oldValue.personId === op.value.personId
        && eq({ ...op.oldValue, position: op.value.position }, op.value)), 'E_SCOPE_SHAPE', '/applied/retained14/positions-only')
    exact(packet.sources.map(row => row.sourcePath), ['lore/relations/opening-office-appointments.json'], 'E_SCOPE_SHAPE', '/applied/retained14/sources')
  }
  if (waterV3) {
    check(receipt.ownerReceipt.call === 'call_ay0Wf7rUkjSZmX35bEw4IXY9', 'E_APPROVAL_BATCH', '/applied/water/owner')
    const proposalBytes = await readBytes(resolve(root, receipt.approvedProposal.path))
    const beforeBytes = await readBytes(resolve(root, receipt.immutablePreimage.path))
    check(sha256(proposalBytes) === '480222dc5cbf4f2feebbc52897c829d03ced951030fdb4464078941a0aa4eac2'
      && sha256(beforeBytes) === '1aecf1b186b9bb7289a01f7c8c7a588128bc1fef444b6dd23cd8cd5a7660a7c1', 'E_APPROVAL_BATCH', '/applied/water/proposal')
    const proposal = JSON.parse(proposalBytes); const preimage = JSON.parse(beforeBytes)
    const approved = [...proposal.v2Replacements, ...proposal.additionalRightsReplacements]
    const selected = receipt.files.flatMap(file => file.operations.map(op => {
      const row = approved.find(row => row.id === op.id)
      const before = preimage.operations.find(row => row.id === op.id)
      check(row && eq(row.after, op.after) && (before
        ? before.path === file.path && before.pointer === op.pointer && eq(before.before, op.before)
        : row.path === file.path && row.pointer === op.pointer && row.beforeValueSha256 === sha256(JSON.stringify(op.before))), 'E_APPROVAL_BATCH', '/applied/water/selection', op.id)
      return op.id
    }))
    check(operations.length === 21 && approved.length === 21 && new Set(selected).size === 21, 'E_SCOPE_SHAPE', '/applied/water/count')
    exact(packet.sources.map(row => row.sourcePath), receipt.files.map(row => row.path), 'E_SCOPE_SHAPE', '/applied/water/sources')
  }
  if (selectionLabel) {
    check(receipt.sourcePath === 'lore/regions/sources/selection.json' && receipt.forward.pointer === '/extended_coverage/filter'
      && receipt.forward.before === 'properties.sidonm in the six named regions below'
      && receipt.forward.after === 'properties.sidonm in the seven named regions below (Seoul and six non-Seoul observations)', 'E_SCOPE_SHAPE', '/applied/selection-label')
    exact(packet.sources.map(row => row.sourcePath), [receipt.sourcePath], 'E_SCOPE_SHAPE', '/applied/selection-label/sources')
  }
  if (k271) {
    exact(operations.map(op => op.file + '#' + op.path), ['lore/characters/Cast-State-11.json#/content/1/text/en', 'lore/characters/Cast-State-11.json#/content/2/items/3/en'], 'E_SCOPE_SHAPE', '/applied/K271/addresses')
    exact(packet.sources.map(row => row.sourcePath), ['lore/characters/Cast-State-11.json'], 'E_SCOPE_SHAPE', '/applied/K271/sources')
    check(packet.sources[0].beforeSha256 === receipt.sourceBeforeSha256 && packet.sources[0].afterSha256 === receipt.sourceAfterSha256, 'E_REVIEW_HASH', '/applied/K271/bytes')
  }
  if (d1c) {
    check(receipt.ownerApproval.callId === 'call_aO4L52yttZW5pxUf9bWQTaHg'
      && sha256(await readBytes(resolve(root, receipt.proposalBindings.decisionPath))) === '8571ad507f48a5e03be4c383fa82015ebb486071857e59c63389598511446e69', 'E_APPROVAL_BATCH', '/applied/D1C/owner')
    const proposalBytes = await readBytes(resolve(root, receipt.proposalBindings.consolidatedPath))
    check(sha256(proposalBytes) === 'f55a410b9fee98affe3cd48d24a5f69e544bddb9b73fa7851e178a7b222d160d', 'E_APPROVAL_BATCH', '/applied/D1C/proposal')
    const selected = JSON.parse(proposalBytes).exactAddressUnion.filter(row => row.decisionIds.includes('D1-C')
      && receipt.files.some(file => file.sourcePath === row.sourcePath))
    check(operations.length === 36 && selected.length === 36 && operations.every(op => selected.some(row => row.sourcePath === op.file
      && row.pointer === op.path && eq(row.currentBefore, op.oldValue) && eq(row.proposedAfter, op.value))), 'E_APPROVAL_BATCH', '/applied/D1C/selection')
    exact(packet.sources.map(row => row.sourcePath), ['lore/culture/Faith-Culture-Schism.json', 'lore/people-and-machines/People-and-Machines.json', 'lore/regions/content/11350.json'], 'E_SCOPE_SHAPE', '/applied/D1C/sources')
  }
  if (d1ab || d1style) {
    const ownerPath = receipt.approvalEvidence
    check(sha256(await readBytes(resolve(root, ownerPath))) === (d1ab
      ? '30594f943666c0f7e141c508b93f316d01abe89901a97582d91685072590b01d'
      : '241283e08bd04f6c6055ddf837380931f79ed58d7ad93267ed1877e4d6a36bcf'), 'E_APPROVAL_BATCH', ownerPath)
    const proposalBytes = await readBytes(resolve(root, d1ab ? receipt.packet : receipt.proposalPath))
    check(sha256(proposalBytes) === (d1ab
      ? 'f55a410b9fee98affe3cd48d24a5f69e544bddb9b73fa7851e178a7b222d160d'
      : '6ebc1050973132949b20e0cdade6489e18a04d41fbc2b92c27bc935cd407cfb0'), 'E_APPROVAL_BATCH', '/applied/D1/proposal')
    const proposal = JSON.parse(proposalBytes)
    const selected = d1ab ? proposal.exactAddressUnion.filter(row => row.decisionIds.some(id => ['D1-A', 'D1-B'].includes(id)))
      .map(row => ({ op: 'replace', file: row.sourcePath, path: row.pointer, oldValue: row.currentBefore, value: row.proposedAfter }))
      : proposal.items.map(row => ({ op: 'replace', file: proposal.sourcePath, path: row.pointer, oldValue: row.approvedBefore, value: row.proposedAfter }))
    check(operations.length === (d1ab ? 31 : 22) && eq(operations, selected), 'E_APPROVAL_BATCH', '/applied/D1/selection')
    check((d1ab ? receipt.approval : receipt.approvalCall) === (d1ab
      ? 'call_pr1D8JrsvFTG1Wsqdo7TNDSM' : 'call_YKHz9NCrHyqc5SqC3oj5Ghlm'), 'E_APPROVAL_BATCH', '/applied/D1/owner')
    if (d1style) check(sha256(await readBytes(resolve(root, receipt.predecessorReceipt))) === receipt.predecessorReceiptSha256
      && receipt.beforeSha256 === 'b14346dfac488d3d75879e4bb922a38f90f2391df3f25a5312bd9c2a3d13b02b', 'E_REVIEW_HASH', '/applied/D1/predecessor')
    exact(packet.sources.map(row => row.sourcePath), d1ab ? receipt.files.map(row => row.sourcePath) : [receipt.sourcePath], 'E_SCOPE_SHAPE', '/applied/D1/sources')
  }
  if (station) {
    check(receipt.approval.messageRef === 'call_7uwPhvWElpts1mGdpQXL4Irf'
      && receipt.approval.choice === 'D1+D2+D3:A non-grant'
      && sha256(await readBytes(resolve(root, receipt.approval.path))) === receipt.approval.sha256
      && sha256(await readBytes(resolve(root, receipt.approval.proposalPath))) === 'ca222965b6e7deecbd196721b093b407928325dabe65880fc5732c00baee90b0', 'E_APPROVAL_BATCH', '/applied/station/authority')
    check(operations.length === 24 && receipt.counts.newGrants === 0 && receipt.counts.newManagerAppointments === 0
      && receipt.counts.preservedSeoulRosterRows === 334 && receipt.counts.originalConnectedNodes === 610
      && receipt.counts.researchRecords === 17 && receipt.climate.globalPerpetualWinter === true
      && receipt.climate.uniformGlobalOrAllStationTemperature === false, 'E_SCOPE_SHAPE', '/applied/station/boundaries')
    exact(packet.sources.map(row => row.sourcePath), receipt.files.map(row => row.path), 'E_SCOPE_SHAPE', '/applied/station/sources')
  }
  if (soulRefs) {
    check(operations.length === 127 && new Set(operations.map(op => op.file + '#' + op.path)).size === 127, 'E_SCOPE_SHAPE', '/applied/soul-references/operations')
    exact(packet.sources.map(row => row.sourcePath), receipt.files.map(row => row.path), 'E_SCOPE_SHAPE', '/applied/soul-references/sources')
  }
  if (rationale) {
    check(receipt.owner.call === 'call_zis83EocLkS1Sw7j58zaxAAw'
      && sha256(await readBytes(resolve(root, '.omo/private/seoul-migration/' + receipt.owner.receipt))) === receipt.owner.receiptSha256
      && sha256(await readBytes(resolve(root, '.omo/private/seoul-migration/' + receipt.proposal.path))) === '2435f04a759f47fd741827064648de5791f66e178c6c598d2f2174e49e1f4eb8', 'E_APPROVAL_BATCH', '/applied/min-ungi/authority')
    exact(operations.map(op => op.file + '#' + op.path), ['lore/editorial/Soul-Assignments.json#/assignments/1007/narrativeRationale', 'lore/editorial/soul-batches/special.json#/assignments/24/narrativeRationale'], 'E_SCOPE_SHAPE', '/applied/min-ungi/operations')
  }
  if (lineage) {
    check(operations.length === 13 && receipt.sourcePath === 'lore/name-pools/diaspora-family-lineages.json'
      && sha256(await readBytes(resolve(root, receipt.approval.ownerReceiptPath))) === receipt.approval.ownerReceiptSha256
      && sha256(await readBytes(resolve(root, receipt.approval.proposalPath))) === '64c0bf9038f8690df7b9bb98635e7139dc7c0024cba00be7f22b1ce808034080', 'E_APPROVAL_BATCH', '/applied/lineage/authority')
    exact(packet.sources.map(row => row.sourcePath), [receipt.sourcePath], 'E_SCOPE_SHAPE', '/applied/lineage/source')
  }
  if (formation) {
    const ownerPath = '.omo/evidence/seoul-lock/owner-formation-membership-alignment-20261015.md'
    check(sha256(await readBytes(resolve(root, ownerPath))) === '999594feffe438a046c0f16eb32d68a3ffaf21105aada42df416a47ad0bfab1b'
      && sha256(await readBytes(resolve(root, receipt.ownerApproval.proposal))) === 'b6b94e774cc39b92aebb08f88d00d4e27b5687a88dc94e72af47ecaac05cafbd', 'E_APPROVAL_BATCH', '/applied/formation/authority')
    exact(operations.map(op => op.file + '#' + op.path), ['ko', 'en'].map(locale => 'lore/chronology/Century-Annals.json#/content/431/text/' + locale), 'E_SCOPE_SHAPE', '/applied/formation/operations')
    check(receipt.postApplySourceSha256 && receipt.validation.operationCount === 2, 'E_REVIEW_HASH', '/applied/formation/final')
  }
  if (family) {
    check(sha256(await readBytes(resolve(root, receipt.approval.receiptPath))) === receipt.approval.receiptSha256
      && sha256(await readBytes(resolve(root, receipt.approval.packetPath))) === receipt.approval.packetSha256
      && sha256(await readBytes(resolve(root, receipt.selection.path))) === receipt.selection.sha256, 'E_APPROVAL_BATCH', '/applied/family/authority')
    check(operations.length === 101 && receipt.operations.filter(row => row.write).length === 97
      && new Set(operations.map(row => row.file + '#' + row.path)).size === 101, 'E_SCOPE_SHAPE', '/applied/family/operations')
    exact(packet.sources.map(row => row.sourcePath), receipt.files.map(row => row.sourcePath), 'E_SCOPE_SHAPE', '/applied/family/sources')
  }
  if (connected && model !== 'connected-table-translation-8') {
    const ownerPath = '.omo/evidence/seoul-lock/owner-connected-seoul-narratives-approval-20261015.md'
    check(sha256(await readBytes(resolve(root, ownerPath))) === '1bb6c2e739578cb737efd26aea875ae1046cc87a1f1bd98155e9ba8cd402e467', 'E_APPROVAL_BATCH', ownerPath)
  }
  if (schema) {
    const before = JSON.parse(receipt.files[0].before); const after = JSON.parse(receipt.files[0].after)
    for (const index of [0, 1]) {
      const original = pointer(before, schemaBranch + '/' + index); const current = pointer(after, schemaBranch + '/' + index)
      check(eq(current.required, original.required.flatMap(key => key === 'name' ? [key, 'centerRegion'] : [key]))
        && eq(current.properties, Object.fromEntries(Object.entries(original.properties).flatMap(([key, value]) => key === 'name'
          ? [[key, value], ['centerRegion', { type: 'string', minLength: 1, pattern: '\\S' }]] : [[key, value]])))
        && current.additionalProperties === false, 'E_SCOPE_SHAPE', '/applied/center-region-schema')
    }
  }
  if (faction) {
    exact(packet.sources.map(row => row.sourcePath), ['lore/factions/Sixteen-States.json', 'lore/overview/World-Unbinding.json', 'WORLD_BUILDING_GUIDE.md'], 'E_SCOPE_SHAPE', '/applied/faction/paths')
    check(sha256(await readBytes(resolve(root, receipt.ownerReceipt.path))) === receipt.ownerReceipt.sha256, 'E_APPROVAL_BATCH', receipt.ownerReceipt.path)
  }
  for (const source of packet.sources) {
    const before = gunzipSync(Buffer.from(source.beforeGzipBase64, 'base64'))
    const after = gunzipSync(Buffer.from(source.afterGzipBase64, 'base64'))
    check(sha256(before) === source.beforeSha256 && sha256(after) === source.afterSha256, 'E_REVIEW_HASH', '/applied/completed-source/embedded', `${model}:${source.sourcePath}`)
    if (replacement) {
      const value = JSON.parse(after)
      check(packet.sources.length === 1 && source.sourcePath === 'lore/Research-Sources.md'
        && source.replacementPath === 'lore/Research-Sources.json' && before.toString() === receipt.before.originalMarkdown
        && value.id === 'DOC:Research-Sources' && value.slug === 'Research-Sources'
        && receipt.denominator.before === 323 && receipt.denominator.after === 323
        && receipt.anchorMapping.length === 9, 'E_SCOPE_SHAPE', '/applied/bibliography/identity')
      const sources = new Map([[source.replacementPath, { value, bytes: after, sha256: source.afterSha256 }]])
      const resolver = createDependencyResolver(sources)
      for (const alias of receipt.anchorMapping) check(eq(resolver(alias.originalReference, 'lore/World-Narrative-Atlas.json').targets, alias.targets),
        'E_DEPENDENCY_REFERENCE', source.replacementPath, alias.originalReference)
    } else if (faction) {
      const file = receipt.files.find(row => row.path === source.sourcePath)
      check(before.toString() === file.beforeBytesUtf8, 'E_REVIEW_HASH', '/applied/completed-source/before-text', source.sourcePath)
      const replay = replayFactionPatch(before.toString(), source.sourcePath, receipt.beforeRecovery.patchHistory)
      if (file.leafOperations) {
        const value = JSON.parse(before)
        for (const op of file.leafOperations) {
          const parent = pointer(value, op.path.slice(0, op.path.lastIndexOf('/'))); const key = op.path.split('/').at(-1)
          check(eq(parent[key], op.before), 'E_REVIEW_HASH', '/applied/completed-source/operation-before', op.path)
          if (op.op === 'remove') delete parent[key]
          else parent[key] = op.after
        }
        // Object property order is authoring bytes, not JSON value semantics.
        const canonical = value => value && typeof value === 'object' ? Array.isArray(value) ? value.map(canonical)
          : Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
        check(eq(canonical(value), canonical(JSON.parse(after))), 'E_REVIEW_HASH', '/applied/faction/operations', source.sourcePath)
      }
      check(replay === after.toString(), 'E_REVIEW_HASH', '/applied/faction/replay', source.sourcePath)
    } else {
      const ops = operations.filter(op => op.file === source.sourcePath)
      if (station) {
        const value = JSON.parse(before)
        for (const op of ops.filter(op => op.op === 'replace')) {
          check(eq(pointer(value, op.path), op.oldValue), 'E_REVIEW_HASH', op.file, op.path)
          pointer(value, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.value
        }
        for (const op of ops.filter(op => op.op === 'remove').sort((a, b) => Number(b.path.split('/').at(-1)) - Number(a.path.split('/').at(-1)))) {
          check(eq(pointer(value, op.path), op.oldValue), 'E_REVIEW_HASH', op.file, op.path)
          pointer(value, op.path.slice(0, op.path.lastIndexOf('/'))).splice(Number(op.path.split('/').at(-1)), 1)
        }
        const file = receipt.files.find(row => row.path === source.sourcePath)
        check(ops.length > 0 && eq(value, JSON.parse(after)) && sha256(before) === file.beforeSha256
          && sha256(after) === file.afterSha256, 'E_REVIEW_HASH', '/applied/station/replay', source.sourcePath)
      } else if (connected || schema || family || formation || soulRefs || d1c || k271 || waterV3 || retained14 || q2v2 || winter10 || fullbody34 || waterFinal18) {
        const value = JSON.parse(before)
        for (const op of ops) {
          check(eq(pointer(value, op.path), op.oldValue), 'E_REVIEW_HASH', op.file, op.path)
          pointer(value, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.value
        }
        check(ops.length > 0 && JSON.stringify(value, null, 2) + '\n' === after.toString(), 'E_REVIEW_HASH', '/applied/completed-source/replay', source.sourcePath)
      } else check(ops.length > 0 && replaySourceTokens(before.toString(), ops) === after.toString(), 'E_REVIEW_HASH', '/applied/completed-source/replay', source.sourcePath)
    }
    rows.push({ sourcePath: source.sourcePath, beforeSha256: source.beforeSha256, afterSha256: source.afterSha256,
      beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false,
      ...(replacement ? { operation: 'replace-source', replacementPath: source.replacementPath } : {}) })
  }
  check(eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: model, sources: rows }), 'E_REVIEW_HASH', '/applied/completed-source/manifest')
}

const BOUNDED_REPAIRS = {
  'sheet-action-preservation': {
    packetPath: '.omo/private/seoul-migration/action-preservation-three-repairs-20261015/packet.json',
    packetSha256: 'ff26aff9bf0bb9a2112354ba2a8e968ddbad0ff33084a2d813635429339fd057',
    authorizationPath: '.omo/private/seoul-migration/action-preservation-three-repairs-20261015/manifest.json',
    authorizationSha256: '0f5f941c7531ec8b1a412226619da7ab73157b494e6e370e2ba1215714ae0e50',
    paths: ['lore/editorial/profile-batches/special.json', 'lore/chronology/Scenario-Timeline.json']
  },
  'birthday-issuance-rebind': {
    packetPath: '.omo/private/seoul-migration/shinjongmok-birthday-issuance-rebind-20261015/application-packet.json',
    packetSha256: '4a2990039786c0ee0e5d91d99974edbd5aa794ea7ca72171f6ab4ebbc78a5a6d',
    paths: ['lore/name-pools/cast-birthdays.json']
  },
  'exact-source-coordinate-repair': {
    packetPath: '.omo/private/seoul-migration/exact-source-coordinate-repair/application-packet.json',
    packetSha256: 'edd30b9d8962642bbd26150fc0f460496085e96bd06546f2573f41d5c97cfdec',
    paths: ['lore/name-pools/gurps-cast.json', 'lore/name-pools/cast-birthdays.json']
  },
  'semantic-evidence-reconciliation': {
    packetPath: '.omo/private/seoul-migration/seven-semantic-reference-reconciliation-20261015/application-packet.json',
    packetSha256: 'ee51483160c7ca39bac8d5def1ff8d182461fc03c5dad81596dcf9d1bff26bb8',
    paths: ['lore/name-pools/gurps-cast.json', 'lore/name-pools/cast-birthdays.json', 'lore/editorial/Soul-Assignments.json', 'lore/editorial/soul-batches/special.json']
  },
  'wildlife-source-authoring': {
    packetPath: '.omo/private/seoul-migration/task-10-wildlife-census-path-correction-applied.json',
    packetSha256: '6efdd1093f566a339021b5c56e32c12fe45890c356629d40e0139899f54d61fd',
    authorizationPath: '.omo/private/seoul-migration/wildlife-census-registration-20261015/authorization.json',
    authorizationSha256: 'd4a560bf9ce5d6dadf85fb86c479aec1d0f347a7d96e63aee6e4011de6d37dea',
    paths: ['lore/World-Narrative-Atlas.json']
  },
  'outside-current-retirement': {
    packetPath: '.omo/private/seoul-migration/outside-current-retirement-20261015/combined-packet.json',
    packetSha256: '66cbb7b6a2550fb0379114f6d11bdb3d1384ea131648a19ebc3495c550a42a91',
    paths: ['lore/regions/outside-control-2126.json', 'lore/regions/outside-island-occupation.json']
  }
}

async function actionPreservationSources(readBytes, root) {
  const binding = BOUNDED_REPAIRS['sheet-action-preservation']
  const bytes = await readBytes(resolve(root, binding.packetPath))
  check(sha256(bytes) === binding.packetSha256, 'E_APPROVAL_BATCH', binding.packetPath)
  const packet = JSON.parse(bytes)
  return { sources: packet.files.map(row => ({ sourcePath: row.path,
    beforeGzipBase64: gzipSync(Buffer.from(row.beforeBytesBase64, 'base64')).toString('base64'),
    afterGzipBase64: gzipSync(Buffer.from(row.afterBytesBase64, 'base64')).toString('base64') })) }
}

// Shared exact-byte replay; each admitted packet has separate closed invariants.
// No live-source exception is made for another writer or an unregistered chain.
async function validateBoundedRepair(batch, packetBytes, manifest, readBytes, root) {
  const model = batch.approvalModel; const binding = BOUNDED_REPAIRS[model]
  const directory = '.omo/private/seoul-migration/bounded-source-registration-20261015'
  const authPath = binding.authorizationPath ?? `${directory}/authorization.json`
  const authSha256 = binding.authorizationSha256 ?? '361ad8e8bfa89356186f655e2c91da7fff1e9e5138167ff6b8f2c2908740305b'
  check(batch.batchId === model && eq(batch.personIds, []) && eq(batch.approvals, [{ kind: model,
    bodySha256: binding.packetSha256, messageRef: authPath, authorizationSha256: authSha256 }]), 'E_APPROVAL_KIND', '/applied/bounded-repair')
  check(sha256(await readBytes(resolve(root, authPath))) === authSha256, 'E_APPROVAL_BATCH', authPath)
  const sealedBytes = await readBytes(resolve(root, binding.packetPath))
  check(sha256(sealedBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', binding.packetPath)
  const packet = JSON.parse(sealedBytes)
  const operations = model === 'sheet-action-preservation' ? packet.operations.map(op => ({ op: op.before === null ? 'add' : 'replace', file: op.path, path: op.pointer, oldValue: op.before, value: op.after }))
    : model === 'wildlife-source-authoring' ? packet.operations.map(op => ({ op: 'replace', file: binding.paths[0], path: op.path, oldValue: op.before, value: op.after }))
    : model === 'outside-current-retirement' ? packet.files.map(row => ({ op: 'replace-document', file: row.path, beforeSha256: row.beforeSha256, afterText: row.afterText }))
      : packet.operations.map(({ op, file, path, oldValue, value }) => ({ op, file, path, oldValue, value }))
  check(eq(JSON.parse(packetBytes), { schema: 'seoul-bounded-source-application.v1', batchId: model,
    sealedPacket: { path: binding.packetPath, sha256: binding.packetSha256 }, operations }), 'E_APPROVAL_BATCH', '/applied/bounded-repair/operations')
  const snapshots = model === 'sheet-action-preservation' ? await actionPreservationSources(readBytes, root)
    : model === 'wildlife-source-authoring' ? { sources: [{ sourcePath: binding.paths[0],
    beforeGzipBase64: packet.replayBytes.censusBeforeGzipBase64, afterGzipBase64: packet.replayBytes.censusAfterGzipBase64 }] }
    : JSON.parse(await readBytes(resolve(root, `${directory}/${model}/snapshots.json`)))
  exact(snapshots.sources.map(row => row.sourcePath), binding.paths, 'E_SCOPE_SHAPE', '/applied/bounded-repair/paths')
  const bindings = model === 'sheet-action-preservation' ? packet.files.map(row => ({ sourcePath: row.path, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256 }))
    : model === 'wildlife-source-authoring' ? [{ sourcePath: binding.paths[0], ...packet.source }]
    : model === 'outside-current-retirement' ? packet.files.map(row => ({ sourcePath: row.path, ...row })) : packet.sourceHashBindings
  const values = new Map(); const rows = []
  for (const expected of bindings) {
    const row = snapshots.sources.find(row => row.sourcePath === expected.sourcePath)
    const before = gunzipSync(Buffer.from(row.beforeGzipBase64, 'base64')); const after = gunzipSync(Buffer.from(row.afterGzipBase64, 'base64'))
    check(sha256(before) === expected.beforeSha256 && sha256(after) === expected.afterSha256, 'E_REVIEW_HASH', expected.sourcePath)
    const value = JSON.parse(before)
    if (model === 'outside-current-retirement') {
      check(sha256(await readBytes(resolve(root, expected.originalSource))) === expected.beforeSha256
        && after.toString() === expected.afterText, 'E_REVIEW_HASH', expected.sourcePath)
    } else {
      for (const op of operations.filter(op => op.file === expected.sourcePath)) {
        check(op.op === 'replace' && eq(pointer(value, op.path), op.oldValue)
          || model === 'sheet-action-preservation' && op.op === 'add' && pointer(value, op.path) === undefined && op.oldValue === null,
        'E_REVIEW_HASH', op.file, op.path)
        pointer(value, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.value
      }
      check(Buffer.from(JSON.stringify(value, null, 2) + '\n').equals(after), 'E_REVIEW_HASH', '/applied/bounded-repair/replay', expected.sourcePath)
    }
    values.set(expected.sourcePath, { before: JSON.parse(before), after: JSON.parse(after) })
    rows.push({ sourcePath: expected.sourcePath, beforeSha256: expected.beforeSha256, afterSha256: expected.afterSha256,
      beforeBytes: before.length, afterBytes: after.length, changed: expected.beforeSha256 !== expected.afterSha256, sealed: false })
  }
  const targets = new Map()
  for (const target of packet.targetSources ?? []) {
    const bytes = await historicalSourceBytes(target.path, target.sha256, readBytes, root)
    check(sha256(bytes) === target.sha256, 'E_REVIEW_HASH', target.path); targets.set(target.path, JSON.parse(bytes))
    if (target.sealedPath) {
      const sealedBytes = await readBytes(resolve(root, target.sealedPath))
      check(sha256(sealedBytes) === target.sealedSha256, 'E_REVIEW_HASH', target.sealedPath); targets.set(target.sealedPath, JSON.parse(sealedBytes))
    }
  }
  if (model === 'sheet-action-preservation') {
    exact(operations.map(op => `${op.file}#${op.path}`), [
      ...['/profiles/18/evidence/5', '/profiles/25/evidence/5', '/profiles/25/narrative/ko', '/profiles/25/narrative/en'].map(path => `${binding.paths[0]}#${path}`),
      ...['ko', 'en'].map(locale => `${binding.paths[1]}#/content/20/text/${locale}`),
    ], 'E_SCOPE_SHAPE', '/applied/action-preservation/operations')
  } else if (model === 'birthday-issuance-rebind') {
    const receipt = packet.approvalBindings[0]
    const path = receipt.path.slice(receipt.path.indexOf('.omo/evidence/'))
    check(sha256(await readBytes(resolve(root, path))) === receipt.sha256
      && receipt.questionRef === 'call_Tmppfg3VeSy4CyNRIX5cHHo5', 'E_APPROVAL_BATCH', path)
    exact(operations.map(op => op.path), ['/people/1008/sourceRefs/1'], 'E_SCOPE_SHAPE', '/applied/birthday/paths')
    const target = packet.immutableTarget
    const targetBytes = await readBytes(resolve(root, target.path))
    check(sha256(targetBytes) === target.sha256 && sha256(JSON.stringify(pointer(JSON.parse(targetBytes), target.jsonPointer))) === target.recordSha256,
      'E_REVIEW_HASH', target.path)
    const current = values.get(binding.paths[0]).after.people[1008]
    check(current.id === target.record.id && current.birthDate === target.record.birthDate
      && operations[0].value === `${target.path}#${target.jsonPointer}`, 'E_REVIEW_HASH', '/applied/birthday/issuance')
  } else if (model === 'exact-source-coordinate-repair') {
    check(operations.length === 28, 'E_SCOPE_SHAPE', '/applied/coordinate/count')
    for (const op of packet.operations) {
      check(typeof op.oldValue === 'string' && typeof op.value === 'string'
        && (op.file === binding.paths[0] && /^\/people\/\d+\/.+\/evidence\/\d+\/pointer$/.test(op.path)
          || op.file === binding.paths[1] && /^\/people\/\d+\/sourceRefs\/\d+$/.test(op.path)), 'E_SCOPE_SHAPE', op.file, op.path)
      const oldBlock = targets.get(`vendor/issued-history/corpus/${op.targetPath}`).content[op.oldBlock]
      const newBlock = targets.get(op.targetPath).content[op.newBlock]
      check(eq(oldBlock, newBlock) && newBlock.anchor === op.anchor && sha256(JSON.stringify(newBlock)) === op.currentBodySha256,
        'E_REVIEW_HASH', op.targetPath, op.path)
    }
  } else if (model === 'semantic-evidence-reconciliation') {
    exact(operations.map(op => `${op.file}#${op.path}`), [
      ...['attributes/IQ/evidence/1', 'attributes/ST/evidence/2', 'attributes/DX/evidence/2', 'skills/0/evidence/0'].map(path => `lore/name-pools/gurps-cast.json#/people/1008/${path}`),
      'lore/editorial/Soul-Assignments.json#/assignments/1009/evidence/2', 'lore/editorial/soul-batches/special.json#/assignments/26/evidence/2'
    ], 'E_SCOPE_SHAPE', '/applied/semantic/paths')
    for (const ref of packet.approvalPackets) {
      const path = ref.path.slice(ref.path.indexOf('.omo/private/'))
      check(sha256(await readBytes(resolve(root, path))) === ref.sha256, 'E_APPROVAL_BATCH', path)
    }
    for (const op of operations) {
      const target = targets.get(op.value.path)
      const raw = op.value.pointer ? pointer(target, op.value.pointer) : target.content.find(row => row.anchor === op.value.anchor)?.text?.ko
      const text = Array.isArray(raw) ? raw.map(run => typeof run === 'string' ? run : run.text).join('') : raw
      if (typeof text === 'string' && text.includes(op.value.quote)) continue
      const authority = appliedAuthorityReaders.get(readBytes) ?? readBytes
      const successor = (await authenticateRepinSuccessor(root, authority)).transitions.find(row => row.path === op.file)
      const currentDocument = successor ? JSON.parse(await authority(resolve(root, op.file))) : null
      const currentValue = currentDocument ? pointer(currentDocument, op.path) : null
      check(typeof text === 'string' && text.includes(op.value.quote)
        || successor?.afterSha256 === sha256(await authority(resolve(root, op.file)))
          && currentValue !== undefined, 'E_REVIEW_HASH', op.file, op.path)
    }
    check(eq(values.get('lore/name-pools/cast-birthdays.json').before, values.get('lore/name-pools/cast-birthdays.json').after), 'E_REVIEW_HASH', '/applied/semantic/birthday')
  } else if (model === 'wildlife-source-authoring') {
    const proposalPath = packet.approvedProposal.path.slice(packet.approvedProposal.path.indexOf('.omo/private/'))
    const proposalBytes = await readBytes(resolve(root, proposalPath))
    check(sha256(proposalBytes) === packet.approvedProposal.sha256, 'E_APPROVAL_BATCH', proposalPath)
    const proposal = JSON.parse(proposalBytes)
    check(eq(packet.operations, proposal.operations) && packet.operations.length === 14 && packet.bibliography.beforeSha256 === null
      && packet.bibliography.operation === 'create', 'E_SCOPE_SHAPE', '/applied/wildlife/operations')
    for (const op of operations) check(/^\/data\/atlas\/hostile_groups\/[01235]\/(?:source_anchors\/[01]|fictional_origin)$/.test(op.path), 'E_SCOPE_SHAPE', op.file, op.path)
    const bibliography = Buffer.from(proposal.proposedNewFile.content.replace(/\n*$/, '\n'))
    check(proposal.proposedNewFile.path === 'lore/Research-Sources.md' && sha256(bibliography) === packet.bibliography.afterSha256
      && bibliography.toString() === packet.replayBytes.bibliographyUtf8,
      'E_REVIEW_HASH', '/applied/wildlife/bibliography')
    for (const source of proposal.sources) check(bibliography.toString().split(`<a id="${source.id}"></a>`).length === 2, 'E_DEPENDENCY_REFERENCE', proposal.proposedNewFile.path, source.id)
    for (const row of packet.preservedCensusPreexistingDifferences) check(eq(pointer(values.get(binding.paths[0]).before, row.path), row.census)
      && eq(pointer(values.get(binding.paths[0]).after, row.path), row.census), 'E_REVIEW_HASH', '/applied/wildlife/preserved', row.path)
    rows.push({ sourcePath: proposal.proposedNewFile.path, beforeSha256: null, afterSha256: packet.bibliography.afterSha256,
      beforeBytes: 0, afterBytes: bibliography.length, changed: true, sealed: false, operation: 'create' })
  } else {
    check(sha256(await readBytes(resolve(root, packet.approval.path))) === packet.approval.sha256
      && sha256(await readBytes(resolve(root, packet.approval.receipt.path))) === packet.approval.receipt.sha256, 'E_APPROVAL_BATCH', '/applied/outside/approval')
    const control = values.get(binding.paths[0]); const islands = values.get(binding.paths[1])
    const expectedControl = { ...control.before, assignments: [] }; delete expectedControl.basis
    const expectedIslands = { ...islands.before, units: [] }; delete expectedIslands.openingDecision
    check(eq(control.after, expectedControl) && eq(islands.after, expectedIslands), 'E_REVIEW_HASH', '/applied/outside/metadata')
    check(control.before.assignments.length === 1415 && islands.before.units.length === 11 && packet.mapping.length === 1426
      && new Set(packet.mapping.map(row => row.recordKey)).size === 1426 && packet.mapping.every(row => row.status === 'retired-current'), 'E_SCOPE_SHAPE', '/applied/outside/mapping')
    for (const [kind, records] of [['assignments', control.before.assignments], ['islandUnits', islands.before.units]]) for (const record of records) {
      const mapping = packet.mapping.find(row => row.recordKey === JSON.stringify([kind, record.unitId]))
      check(mapping?.sourceValueSha256 === sha256(JSON.stringify(record)), 'E_REVIEW_HASH', '/applied/outside/mapping', record.unitId)
    }
  }
  check(eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: model, sources: rows }), 'E_REVIEW_HASH', '/applied/bounded-repair/manifest')
}

const SOURCE_REPAIRS = {
  'current-profile-fact-repair': {
    batchId: 'profile-seoul-fact-repair-438',
    packetPath: '.omo/private/seoul-migration/task-10-profile-seoul-fact-repair/combined-packet.json',
    packetSha256: '0a74bc9d94a157e2d6145fddb174815bebdd5ae0b1138df191705aa407cf553f',
    snapshotPath: '.omo/private/seoul-migration/task-10-profile-seoul-fact-repair/source-before-after.json',
    snapshotSha256: 'c2b34f66c247a83165f4d66762884acbb2b94bef525366a7b965745fd8b6e1f6',
    paths: ['state-05-06', 'state-07-08', 'state-09-10', 'special'].map(name => `lore/editorial/profile-batches/${name}.json`)
  },
  'approved-translation-parity': {
    batchId: 'component-1-english-parity-repair-3',
    packetPath: '.omo/private/seoul-migration/component-1-english-parity-repair/combined-packet.json',
    packetSha256: '4efcb7cfb26c39a8b94bc0ba44403461fc1a72e884205f2f3f5bcf8d62a1607a',
    snapshotPath: '.omo/private/seoul-migration/component-1-english-parity-repair/source-before-after.json',
    snapshotSha256: 'a0edc4e88fa599199666c4fe44e10a031849d230238e75e3f05650bcea075e68',
    paths: ['lore/factions/Diaspora-Corridors.json']
  }
}

// These are closed follow-up repairs under existing approved facts and the
// owner's Seoul retcon instruction, not new sample-body or allocation grants.
async function validateSourceRepair(batch, packetBytes, beforeAfter, readBytes, root, earlierBatches) {
  const binding = SOURCE_REPAIRS[batch.approvalModel]
  const authPath = '.omo/private/seoul-migration/source-repair-registration-20261015/authorization.json'
  const authSha256 = 'f4e3c36d29a08451e38d1ee0f13b41f7724455cc72ac001a8a7720cbcd63c7ca'
  check(batch.batchId === binding.batchId && eq(batch.personIds, []) && eq(batch.approvals, [{
    kind: batch.approvalModel, bodySha256: binding.packetSha256, messageRef: authPath, authorizationSha256: authSha256
  }]), 'E_APPROVAL_KIND', '/applied/source-repair', batch.batchId)
  const sealedPacketBytes = await readBytes(resolve(root, binding.packetPath))
  check(sha256(sealedPacketBytes) === binding.packetSha256, 'E_APPROVAL_BATCH', '/applied/source-repair/packet', batch.batchId)
  check(sha256(await readBytes(resolve(root, authPath))) === authSha256, 'E_APPROVAL_BATCH', authPath)
  const ownerBytes = await readBytes(resolve(root, '.omo/private/seoul-migration/owner-approvals-20261015.json'))
  check(sha256(ownerBytes) === 'bc3af8bb8f0b50436afc49a0153a510bbccb90ae872102bf1c3b950970013fb1', 'E_APPROVAL_BATCH', '/applied/source-repair/owner')
  const owner = JSON.parse(ownerBytes)
  check(sha256(owner.ownerMessage.text) === owner.ownerMessage.sha256
    && sha256(await readBytes(resolve(root, owner.evidenceFile.path))) === owner.evidenceFile.sha256, 'E_APPROVAL_BATCH', '/applied/source-repair/owner')
  const snapshotBytes = await readBytes(resolve(root, binding.snapshotPath))
  check(sha256(snapshotBytes) === binding.snapshotSha256, 'E_REVIEW_HASH', binding.snapshotPath)
  const snapshot = JSON.parse(snapshotBytes); const packet = JSON.parse(sealedPacketBytes)
  const profileRepair = batch.approvalModel === 'current-profile-fact-repair'
  const operations = packet.operations.map(op => {
    const oldValue = profileRepair ? op.before : op.beforeValue; const value = profileRepair ? op.after : op.value
    return { op: 'replace', file: op.file, path: op.path, oldValue, value,
      beforeValueSha256: sha256(JSON.stringify(oldValue)), afterValueSha256: sha256(JSON.stringify(value)) }
  })
  check(eq(JSON.parse(packetBytes), { schema: 'seoul-source-repair-application.v1', batchId: batch.batchId,
    sealedPacket: { path: binding.packetPath, sha256: binding.packetSha256 }, operations }), 'E_APPROVAL_BATCH', '/applied/source-repair/operations')
  const rows = profileRepair ? snapshot.files.map(row => ({ ...row, sourcePath: row.path })) : snapshot.sources
  exact(rows.map(row => row.sourcePath), binding.paths, 'E_SCOPE_SHAPE', '/applied/source-repair/paths')
  const sourceValues = new Map(); const expectedRows = []
  for (const row of rows) {
    const beforeBytes = Buffer.from(row.beforeBase64, 'base64'); const afterBytes = Buffer.from(row.afterBase64, 'base64')
    check(sha256(beforeBytes) === row.beforeSha256 && sha256(afterBytes) === row.afterSha256
      && beforeBytes.length === row.beforeBytes && afterBytes.length === row.afterBytes, 'E_REVIEW_HASH', row.sourcePath)
    sourceValues.set(row.sourcePath, { before: JSON.parse(beforeBytes), after: JSON.parse(afterBytes) })
    expectedRows.push({ sourcePath: row.sourcePath, beforeSha256: row.beforeSha256, afterSha256: row.afterSha256,
      beforeBytes: row.beforeBytes, afterBytes: row.afterBytes, changed: true, sealed: false })
  }
  shape(beforeAfter, ['schema', 'batchId', 'sources'], '/applied/source-repair/manifest')
  check(beforeAfter.schema === 'seoul-source-before-after.v1' && beforeAfter.batchId === batch.batchId && eq(beforeAfter.sources, expectedRows),
    'E_REVIEW_HASH', '/applied/source-repair/manifest')
  const approvedPackets = new Map()
  const requested = profileRepair ? packet.approvedPackets : [{ path: packet.approval.priorAppliedPacket,
    sha256: 'b48362f16092a700881df56b77a07267adfd571adfc0798321c28ed2de702802' }]
  for (const ref of requested) {
    // Historical packets store canonical absolute paths. Resolve only the
    // exact private suffix to the caller's root, never an arbitrary disk path.
    const path = ref.path.slice(ref.path.indexOf('.omo/private/seoul-migration/'))
    const prior = earlierBatches.find(row => row.packetPath === path && row.packetSha256 === ref.sha256)
    check(prior && owner.approvals.some(row => row.batchId === prior.batchId), 'E_APPROVAL_BATCH', '/applied/source-repair/prior', path)
    const bytes = await readBytes(resolve(root, path))
    check(sha256(bytes) === ref.sha256, 'E_APPROVAL_BATCH', path)
    const approved = JSON.parse(bytes)
    if (profileRepair) check(eq(approved.approvalBindings, ref.approvalBindings), 'E_APPROVAL_BATCH', path)
    for (const approval of approved.approvalBindings) {
      check(approval.path === owner.evidenceFile.path && approval.sha256 === owner.evidenceFile.sha256
        && sha256(await readBytes(resolve(root, approval.proposalPath))) === approval.proposalSha256
        && prior.approvals.some(a => a.kind === 'batch-allocation' && a.bodySha256 === approval.proposalSha256), 'E_APPROVAL_BATCH', path)
    }
    approvedPackets.set(prior.batchId, approved)
  }
  if (profileRepair) {
    check(packet.operations.length === 438 && packet.signals.length === 94, 'E_SCOPE_SHAPE', '/applied/profile-repair/count')
    const translation = SOURCE_REPAIRS['approved-translation-parity']
    const translationBytes = await readBytes(resolve(root, translation.snapshotPath))
    check(sha256(translationBytes) === translation.snapshotSha256, 'E_REVIEW_HASH', translation.snapshotPath)
    const diaspora = JSON.parse(translationBytes).sources[0]
    const sources = new Map()
    for (const source of packet.sourceHashes) {
      // The profile review predates the exact EN-only successor. Authenticate
      // that historical source here; the later translation entry checks its
      // replay, unchanged KO and current disk through the normal source chain.
      let bytes = source.path === diaspora.sourcePath ? Buffer.from(diaspora.beforeBase64, 'base64') : await historicalSourceBytes(source.path, source.sha256, readBytes, root)
      if (source.path === 'lore/chronology/Scenario-Timeline.json' && sha256(bytes) !== source.sha256) {
        const preserved = (await actionPreservationSources(readBytes, root)).sources.find(row => row.sourcePath === source.path)
        bytes = gunzipSync(Buffer.from(preserved.beforeGzipBase64, 'base64'))
      }
      check(sha256(bytes) === source.sha256, 'E_REVIEW_HASH', source.path)
      sources.set(source.path, JSON.parse(bytes))
    }
    const approvedPeople = new Set([...approvedPackets.values()].flatMap(p => p.personIds))
    const seen = new Set()
    for (const op of packet.operations) {
      check(binding.paths.includes(op.file) && /^\/profiles\/\d+\/(?:evidence\/\d+\/quote|abilities\/(?:leadership|strategy|negotiation|management|insight|learning|prowess|endurance)\/basis|traits\/\d+\/(?:behavior|stress|relationship|description)\/(?:ko|en)|narrative\/(?:ko|en))$/.test(op.path)
        && typeof op.before === 'string' && typeof op.after === 'string' && approvedPeople.has(op.personId), 'E_SCOPE_SHAPE', op.file, op.path)
      const key = JSON.stringify([op.file, op.path]); check(!seen.has(key), 'E_SCOPE_SHAPE', op.file, op.path); seen.add(key)
      const value = sourceValues.get(op.file).before
      check(pointer(value, op.path.split('/').slice(0, 3).join('/')).personId === op.personId && pointer(value, op.path) === op.before,
        'E_REVIEW_HASH', op.file, op.path)
      pointer(value, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.after
    }
    for (const signal of packet.signals) {
      const path = `lore/editorial/profile-batches/${signal.f}.json`
      const evidence = sourceValues.get(path)?.after.profiles[signal.i]?.evidence[signal.j]
      const block = sources.get(signal.path)?.content.find(row => row.anchor === signal.anchor)
      const ko = block?.text?.ko
      const text = Array.isArray(ko) ? ko.map(run => typeof run === 'string' ? run : run.text).join('') : ko
      check(evidence?.path === signal.path && evidence.anchor === signal.anchor && evidence.quote === signal.after
        && block && (typeof text === 'string' && text.includes(signal.after)
          || block.items?.some(item => typeof item.ko === 'string' && item.ko.includes(signal.after))), 'E_REVIEW_HASH', path, signal.id)
    }
  } else {
    exact(packet.operations.map(op => op.path), ['/content/12/items/15/en', '/content/12/items/19/en', '/content/14/items/19/en'], 'E_SCOPE_SHAPE', '/applied/translation/paths')
    const approved = approvedPackets.get('component-1')
    check(approved && sha256(await readBytes(resolve(root, packet.approval.proposalPath))) === packet.approval.proposalSha256,
      'E_APPROVAL_BATCH', '/applied/translation/proposal')
    for (const op of packet.operations) {
      const values = sourceValues.get(op.file)
      check(values && op.file === binding.paths[0] && op.op === 'replace' && typeof op.beforeValue === 'string' && typeof op.value === 'string'
        && pointer(values.before, op.path) === op.beforeValue && pointer(values.before, op.approvedKoPointer) === op.approvedKo
        && pointer(values.after, op.approvedKoPointer) === op.approvedKo
        && pointer(values.before, op.path.split('/').slice(0, 3).join('/')).anchor === op.anchor
        && approved.operations.some(row => row.file === op.file && row.path === op.approvedKoPointer && row.value === op.approvedKo),
      'E_REVIEW_HASH', op.file, op.path)
      pointer(values.before, op.path.slice(0, op.path.lastIndexOf('/'))).en = op.value
    }
  }
  // Exact whole-object equality proves all unlisted fields invariant, including
  // numbers, identity, skills, trait effects, health and souls, or every KO leaf.
  for (const [path, values] of sourceValues) check(eq(values.before, values.after), 'E_REVIEW_HASH', '/applied/source-repair/replay', path)
}

const RIGHTS_TRANSITION = {
  packetPath: '.omo/private/seoul-migration/seoul-rights-transition-20261015/staging-packet.json',
  packetSha256: '5700100cafb854173ad1146fc1e0c53fb2702dc9f3d4552e46f0be0aacc3a4b8',
  approvalPath: 'scripts/approved-seoul-rights-transition.json',
  approvalSha256: '384a139fef7546027dcbb7237f31b59aca9cdc28d6033b59f43109bf2f2cf86d',
  receiptPath: '.omo/evidence/seoul-lock/owner-seoul-only-rights-approval-20261015.md',
  receiptSha256: '7dcf7d3222b25c52a4cde3005051fe0930d1b95a3cb748877a004f66771244ee',
}

const POST62_SOURCE_APPLICATIONS = Object.freeze({
  'owner-recommendations-characters': { group: 'characters', packetSha256: '7e6e9cc5c9aa09be5ffced88b0b204c5fc3210fa3dcc9be08805515681591a0b', registrarSha256: 'c164feb5169f422ccc0b452ff924379c819f39a0a526043c20fbc0c94a28e12c', receiptSha256: '74d803fbe3047e7dc999c6847f809244cb27d3c24026248a43e10d8e32a0475c', sources: 7, operations: 265 },
  'owner-recommendations-articles': { group: 'articles', packetSha256: '94a442c6ca6a08923ba1551b2ce7c3f43eb41e0c3d9af4f6f7d9612d54f24daa', registrarSha256: '0f16489deb132ec05959f8498ac9261cd316e719694cf80f0ad64a7cf9ef0f95', receiptSha256: '01967c9c4082fb6b22e571e4205d37c21ca5157b279efc1d2f008013d4aa05d3', sources: 10, operations: 89 },
  'owner-recommendations-records': { group: 'records', packetSha256: 'e4cd6884d35a75e600ed5187651fcff8d0eb7b8ee05528e24b24037f42b82b18', registrarSha256: 'f9d79b5b33901b00a459efd88cab0ace9ef413e3a26e9c6003fc0fef40b71045', receiptSha256: '0ff1235920965c3d7904a884790ab7cbd04a8a19c251467a551d09b4f00ab57c', sources: 13, operations: 28 },
  'offices-v2-source-31': { packetSha256: 'c88ca096b431defd138fc9fdbf9d377a81b57a026b1173e5ccd1e68caaf29650', coreSha256: 'e20aff1b50f317cf824d3a2c03a1632f59f5663003b541074121512cd65268f2', operationEvidenceSha256: '76ae69d8348e44e55db366dda919d59509149992e13efb7fe45de153b6e1f112', sources: 1, operations: 31 },
  'facility-nongrant-source-228': { packetSha256: '842e11ec4e4b16f13af2790555325d40872cf7f05d71a159d075290f76267d44', receiptSha256: 'e5316d472a703438f6fdfbcb6b0137d33b1f1132c4278765eab69726b583f740', reviewSha256: 'd014cf95215cbf9ef118596d8546557070bc36ddbe6495cfa69187d48ca307bb', operationEvidenceSha256: '734137a38662085c07c5d09ff409ae42a184ea890282a4101988f042e7dd457e', archiveSha256: 'df22d08002760864aef6b812be0227d9cad64fcc192fe44fdc337696d8e193e6', sources: 1, operations: 228 },
})
const POST62_ROOT = '.omo/private/seoul-migration/'
const POST62_STAGE = POST62_ROOT + 'post62-registration-20261015/'
const POST62_APPROVAL = { path: POST62_ROOT + 'reload-mass-phase-20261015/approvals.json', sha256: '7430316dbd61ac205c7953953c857b257db09377fd6abcbc61b7a2966f2c0884' }
const POST62_OWNER = { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75' }
const POST62_INDEPENDENT = { path: POST62_ROOT + 'recommendations-application-20261015/independent.json', sha256: 'acd20b28c2ed488c5c84f0bf55ffb1a485a815968cb6b5487ef62e1604ec0ed8' }

const FIVE_SOURCE_SUCCESSOR = {
  batchId: 'current-five-source-successors-20261015',
  packetPath: POST62_ROOT + 'current-provenance-successor-20261015/five-source-application.json',
  packetSha256: 'af1a85ff9f78195c145dead8e380941f3bf2edaef86e9cc2ce92bec2c328c847',
  prefixSha256: '334d64793fc19a28b7f963be511a63d07912465c5b819d341400b88bf89988b0',
}

const CHRONOLOGY_SUCCESSOR = {
  batchId: 'chronology-three-source-successor-20261015',
  directory: POST62_ROOT + 'chronology-successor-registration-20261015/',
  packetSha256: '0c98fae8841e973386b523c458c34be435174fae31ba8c6a5eae709a2afc0e79',
  prefixSha256: 'ac82db4ac3c4a0c95bb798f901fcd65cab52f1a8e48007c12f3709dd0e08d750',
}

const APPOINTMENTS_SUCCESSOR = {
  batchId: 'typed-appointments-source-successor-20261015',
  directory: POST62_ROOT + 'appointments-successor-registration-20261015/',
  packetSha256: '5f41b1d13967f3be3a45676f8c208a8cf84524ff589ab3beed1087b0613d02ce',
  prefixSha256: '685b202dad7f88e070a252b524eb709aaec760f221755619a2adbeb8add39b38',
}

const FOUR_DOCUMENTS_STATUS = {
  batchId: 'four-reviewed-documents-status-4',
  directory: POST62_ROOT + 'four-reviewed-documents-admission-20261015/',
  packetSha256: 'aee00b8081fc727921ba72fb23246a3672f1cd7337a8ab940e704d6fbb765186',
  registryPrefixSha256: 'b5d22e72cc36a8532f8925742c598bc81daba6c0ce99475ee006026910cf3685',
  paths: ['lore/characters/Cast-Corridors-Index.json', 'lore/characters/Characters-Factions-and-Professions.json',
    'lore/goods/Era-Arms-and-Tech-Level.json', 'lore/places/Station-Interior-Construction.json'],
  afterSha256: {
    'lore/characters/Cast-Corridors-Index.json': 'cd30c207373ef91c1851490efeccfeb12b645a282fcc1634b8397dc8dde69c15',
    'lore/characters/Characters-Factions-and-Professions.json': 'ab864f148c15d7388ccc46095df57cbb8a84fd88e1f77c89bac3c2335470b861',
    'lore/goods/Era-Arms-and-Tech-Level.json': '19924df793a4ceb5605dc2bef48601ce2d3a549242a7afa3ac7f6f7408f5f2c7',
    'lore/places/Station-Interior-Construction.json': 'dcc01cf9c30798ec2ed8c2713ed2d94d2bc0ce8713cf81e3cb72ec1417a2d659',
  },
}

async function validateFourDocumentStatus(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = FOUR_DOCUMENTS_STATUS
  const packet = JSON.parse(packetBytes)
  check(batch.batchId === binding.batchId && batch.packetPath === binding.directory + 'application-packet.json'
    && batch.packetSha256 === binding.packetSha256 && batch.sourceBeforeAfterPath === binding.directory + 'source-before-after.json'
    && batch.operationCount === 4 && eq(batch.personIds, []) && eq(batch.approvals, [])
    && eq(batch.applicationReview, { evidencePath: binding.directory + 'publication-review.json', evidenceSha256: APPROVED_DOCUMENT_REVIEW_RECEIPTS[2].sha256 })
    && prefix.length === 70 && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.registryPrefixSha256
    && eq(packet.registryPrefix, { count: 70, sha256: binding.registryPrefixSha256 })
    && packet.schema === 'seoul-four-reviewed-documents-status-admission.v1' && packet.batchId === binding.batchId
    && packet.authority === 'four exact fullbodies only; no entity, geographic title, facility, rights, archive or other document admission'
    && manifest.schema === 'seoul-four-reviewed-documents-source-before-after.v1' && manifest.batchId === binding.batchId,
  'E_APPROVAL_BATCH', '/applied/four-documents')
  exact(packet.sources.map(row => row.sourcePath), binding.paths, 'E_SCOPE_ADMISSION', batch.packetPath)
  exact(manifest.sources.map(row => row.sourcePath), binding.paths, 'E_SCOPE_ADMISSION', batch.sourceBeforeAfterPath)
  check(eq(packet.operations, binding.paths.map(file => ({ op: 'replace', file, path: '/status', oldValue: 'draft', value: 'approved' }))),
    'E_SCOPE_ADMISSION', batch.packetPath)
  const refs = packet.evidence
  shape(refs, ['owner', 'independent', 'historicalFail', 'remediation'], batch.packetPath)
  const expectedRefs = {
    owner: { path: POST62_OWNER.path, sha256: POST62_OWNER.sha256 },
    independent: { path: POST62_ROOT + 'six-doc-remediation-20261015/absolute-worktree-independent.json', sha256: 'ed26cee76cb77d5ab086e32aec9b346cc859fde894ab83bc12281772f9d0daea' },
    historicalFail: { path: POST62_ROOT + 'six-doc-remediation-20261015/independent.md', sha256: 'aae552f5dc0566de926b08edea43251d2b71aa6c2778b81bfed8a34058e7555a' },
    remediation: { path: POST62_ROOT + 'six-doc-remediation-20261015/receipt.json', sha256: 'b23b53fbe65e65e181bf53237047f5c5f1e7631c8fc5ceb6ddeb0f16f0d61962' },
  }
  check(eq(refs, expectedRefs), 'E_APPROVAL_BATCH', batch.packetPath)
  const evidence = {}
  for (const [key, ref] of Object.entries(refs)) {
    const bytes = await readBytes(resolve(root, ref.path))
    check(sha256(bytes) === ref.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', ref.path)
    evidence[key] = key === 'historicalFail' || key === 'owner' ? bytes.toString() : JSON.parse(bytes)
  }
  check(evidence.owner.includes('나머지 모든것들은 너의 추천안으로 할게 완성 해줘 이제')
    && evidence.historicalFail.includes('FAIL_NOT_APPLIED')
    && evidence.independent.verdict === 'PASS_APPLIED_BOUNDED'
    && evidence.independent.actualRoot === resolve(root)
    && evidence.independent.operations.applied === 47 && evidence.remediation.documents.length === 4,
  'E_PUBLICATION_REVIEW_AUTHORITY', batch.packetPath)
  for (const source of packet.sources) {
    const row = manifest.sources.find(item => item.sourcePath === source.sourcePath)
    const remediation = evidence.remediation.documents.find(item => item.path === source.sourcePath)
    const independent = evidence.independent.documents.find(item => item.absolutePath === resolve(root, source.sourcePath))
    check(row && remediation && independent && independent.byteEqualArchivedAfter === true
      && remediation.after.sha256 === source.beforeSha256 && independent.sha256 === source.beforeSha256
      && eq(row, { sourcePath: source.sourcePath, beforeSha256: source.beforeSha256,
        afterSha256: source.afterSha256, changed: true, operation: 'status-only' }), 'E_REVIEW_HASH', '/applied/four-document-status/manifest', source.sourcePath)
    const before = gunzipSync(Buffer.from(source.beforeGzipBase64, 'base64'))
    const after = gunzipSync(Buffer.from(source.afterGzipBase64, 'base64'))
    const disk = await readBytes(resolve(root, source.sourcePath))
    const finalSuccessor = (await loadFinalSuccessor(root, readBytes)).transitions.find(row => row.path === source.sourcePath)
    const diskSha256 = sha256(disk)
    check(sha256(before) === source.beforeSha256 && sha256(after) === source.afterSha256
      && (Buffer.from(disk).equals(after)
        || finalSuccessor?.beforeSha256 === source.afterSha256 && finalSuccessor.afterSha256 === diskSha256)
      && before.toString() === after.toString().replace('"status": "approved"', '"status": "draft"')
      && JSON.parse(before).status === 'draft' && JSON.parse(after).status === 'approved'
      && ['ko', 'en'].every(locale => sha256(renderLoreMarkdown(JSON.parse(after), locale)) === remediation.renders[locale].after.sha256),
    'E_REVIEW_HASH', '/applied/four-document-status', source.sourcePath)
  }
}

async function validateAppointmentsSuccessor(batch, packetBytes, manifest, readBytes, root, prefix, earlierBatches) {
  const binding = APPOINTMENTS_SUCCESSOR; const packet = JSON.parse(packetBytes)
  const sourcePath = 'lore/relations/opening-office-appointments.json'
  const expectedPrior = earlierBatches.flatMap(row => (row.sourceBeforeAfter?.sources ?? [])
    .filter(source => source.sourcePath === sourcePath && source.changed)
    .map(source => ({ batchId: row.batchId, beforeSha256: source.beforeSha256, afterSha256: source.afterSha256 })))
  check(batch.batchId === binding.batchId && batch.packetPath === binding.directory + 'application-packet.json'
    && batch.packetSha256 === binding.packetSha256 && batch.sourceBeforeAfterPath === binding.directory + 'source-before-after.json'
    && batch.operationCount === 95 && eq(batch.personIds, []) && eq(batch.approvals, [])
    && eq(batch.applicationReview, { evidencePath: packet.independent.path, evidenceSha256: packet.independent.sha256 })
    && prefix.length === 69 && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private',
      batches: prefix }, null, 2) + '\n')) === binding.prefixSha256
    && eq(packet.registryPrefix, { count: 69, sha256: binding.prefixSha256 })
    && expectedPrior.length === 1 && eq(packet.priorSourceVariant, expectedPrior[0])
    && packet.schema === 'seoul-typed-appointments-source-successor.v1' && packet.batchId === binding.batchId
    && packet.sourcePath === sourcePath && packet.rowCount === 95
    && packet.sourceOperation === 'typed-root-v1-to-v2; exact ninety-five history objects retained and typed current objects bound to coverage and evidence'
    && packet.authority === 'source-only; no new grant, person admission, publication or appointment draft activation',
  'E_APPROVAL_BATCH', '/applied/appointments/packet')
  const evidenceRoot = POST62_ROOT + 'appointments-typed-current-20261015/'
  const refs = {
    before: { path: evidenceRoot + 'before/' + sourcePath, sha256: 'c322e1a00347f737a2a4559a538d97f64c0f5e4786ff7d53a2920e12b389595d' },
    after: { path: evidenceRoot + 'after/' + sourcePath, sha256: '8e01932f68ef017ab4bc455f3f4a2ffdb551c77be6ed37f9879592c9a58eb867' },
    receipt: { path: evidenceRoot + 'receipt.json', sha256: '291965cf7615c8439eee65226c9a0cdae39bd06256e43c13e00c98932336d752' },
    independent: { path: evidenceRoot + 'independent.json', sha256: 'f7cdb04c0275db149b159bce746383352fa8add4ea2cb955a0216197199e0f00' },
    coverage: { path: evidenceRoot + 'coverage.json', sha256: '1149f2d7a1a4a3560a88a220df87b8a597f9dc5e6f2fde4d026032c57a22ee81' },
    inverse: { path: evidenceRoot + 'exact-inverse.patch', sha256: '86176342b0baa5d176da835f844b3c3405322428507da8df27114c4c5e2f7ae1' },
    ownerAuthority: { path: POST62_OWNER.path, sha256: POST62_OWNER.sha256 },
    proposal: { path: POST62_ROOT + 'opening-office-appointments-owner-proposal-20261015.json', sha256: 'e7bd6747b1507365ede42a8bc8fa28c744fcf790b6835b431e1d4fd76755472d' },
  }
  for (const [key, ref] of Object.entries(refs)) check(eq(key === 'before' || key === 'after'
    ? { path: packet[key]?.path, sha256: packet[key]?.sha256 } : packet[key], ref), 'E_APPROVAL_BATCH', '/applied/appointments/ref', key)
  const readPinned = async ref => {
    const bytes = await readBytes(resolve(root, ref.path))
    check(sha256(bytes) === ref.sha256, 'E_REVIEW_HASH', '/applied/appointments/pin', ref.path)
    return bytes
  }
  const [beforeBytes, afterBytes, receiptBytes, independentBytes, coverageBytes, inverseBytes, ownerBytes, proposalBytes, currentBytes] = await Promise.all([
    ...Object.values(refs).map(readPinned), readBytes(resolve(root, sourcePath))])
  const receipt = JSON.parse(receiptBytes); const independent = JSON.parse(independentBytes)
  const coverage = JSON.parse(coverageBytes); const proposal = JSON.parse(proposalBytes)
  const before = JSON.parse(beforeBytes); const after = JSON.parse(afterBytes)
  const appointmentSuccessor = (await loadFinalSuccessor(root, readBytes)).transitions.find(row => row.path === sourcePath)
  const currentSha256 = sha256(currentBytes)
  check(beforeBytes.length === packet.before.bytes && afterBytes.length === packet.after.bytes
    && (currentSha256 === refs.after.sha256 && Buffer.from(currentBytes).equals(Buffer.from(afterBytes))
      || appointmentSuccessor?.beforeSha256 === refs.after.sha256 && appointmentSuccessor.afterSha256 === currentSha256)
    && sha256(JSON.stringify(before)) === packet.before.parsedSha256
    && sha256(JSON.stringify(after)) === packet.after.parsedSha256
    && receipt.schema === 'appointments-typed-current-receipt.v1' && receipt.workspace === resolve(root)
    && receipt.files[0].path === sourcePath && receipt.files[0].beforeSha256 === refs.before.sha256
    && receipt.files[0].afterSha256 === refs.after.sha256
    && receipt.archives.exactInverse === 'exact-inverse.patch' && receipt.verification.inverseVerified === true
    && independent.schema === 'appointments-typed-current-independent.v1'
    && independent.verdict === 'PASS-bounded-source-and-pure-projection'
    && independent.coverage.beforeRowsRead === 95 && independent.coverage.afterRowsRead === 95
    && independent.coverage.allOriginalRowObjectsEqualHistory === true
    && independent.coverage.allEvidencePointersResolved === 113
    && independent.sourceSha256['lore/relations/opening-office-appointments.json'] === refs.after.sha256
    && independent.sourceSha256['before/lore/relations/opening-office-appointments.json'] === refs.before.sha256
    && ownerBytes.toString().includes('나머지 모든것들은 너의 추천안으로 할게 완성 해줘 이제')
    && proposal.rows.length === 95 && before.schema === 'opening-office-appointments.v1'
    && after.schema === 'opening-office-appointments.v2' && before.openingYear === after.openingYear
    && eq(Object.keys(before), ['schema', 'openingYear', 'appointments'])
    && eq(Object.keys(after), ['schema', 'openingYear', 'contract', 'appointments'])
    && before.appointments.length === 95 && after.appointments.length === 95 && coverage.length === 95
    && inverseBytes.toString().includes('*** Update File: ' + sourcePath),
  'E_REVIEW_HASH', '/applied/appointments/evidence', sourcePath)
  const statuses = new Map(); let evidenceCount = 0
  const ids = []
  for (const [index, current] of after.appointments.entries()) {
    const old = before.appointments[index]; const row = proposal.rows[index]; const evidence = coverage[index]
    const typed = current.current
    check(current.personId === old.personId && current.stateId === old.stateId
      && eq(current.history, old) && row.personId === old.personId
      && row.sourcePointer === `/appointments/${index}` && row.before.personId === old.personId
      && row.before.stateId === old.stateId && row.before.commonTier === old.commonTier
      && row.before.approvalRef === old.approvalRef
      && evidence.index === index && evidence.personId === old.personId
      && evidence.historyValueSha256 === sha256(JSON.stringify(old))
      && evidence.currentValueSha256 === sha256(JSON.stringify(typed)) && evidence.newGrant === false
      && evidence.currentStatus === typed.status && typed.commonTier === old.commonTier
      && ['retained-office', 'unappointed', 'nonterritorial-political-office', 'nonowning-jurisdiction', 'existing-function'].includes(typed.status)
      && eq(Object.keys(current), ['personId', 'stateId', 'history', 'current'])
      && eq(Object.keys(typed), ['status', 'position', 'rank', 'commonTier', 'evidence'])
      && (typed.position === null && typed.rank === null && typed.status === 'unappointed'
        || typed.position && typeof typed.position.ko === 'string' && typeof typed.position.en === 'string')
      && Array.isArray(typed.evidence), 'E_REVIEW_HASH', '/applied/appointments/row', old.personId)
    ids.push(old.personId)
    statuses.set(typed.status, (statuses.get(typed.status) ?? 0) + 1)
    for (const ref of typed.evidence) {
      const target = ref.path === sourcePath ? after : JSON.parse(await readBytes(resolve(root, ref.path)))
      check(pointer(target, ref.jsonPointer) !== undefined, 'E_REVIEW_HASH', '/applied/appointments/pointer', old.personId)
      evidenceCount += 1
    }
  }
  check(new Set(ids).size === 95 && ids.join(',') === independent.coverage.orderedPersonIds
    && evidenceCount === 113 && eq(Object.fromEntries([...statuses].sort()), Object.fromEntries(Object.entries(independent.coverage.currentStatus).sort()))
    && eq(Object.fromEntries(Object.entries(independent.coverage.currentStatus).sort()), Object.fromEntries(Object.entries({ 'retained-office': 15, 'unappointed': 3,
      'nonterritorial-political-office': 1, 'nonowning-jurisdiction': 3, 'existing-function': 73 })
      .sort()))
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.batchId, sources: [{
      sourcePath, beforeSha256: refs.before.sha256, afterSha256: refs.after.sha256,
      beforeBytes: beforeBytes.length, afterBytes: afterBytes.length, changed: true, sealed: false,
    }] }), 'E_REVIEW_HASH', '/applied/appointments/manifest')
}

async function validateChronologySuccessor(batch, packetBytes, manifest, readBytes, root, prefix, prefixSha256, earlierBatches) {
  const binding = CHRONOLOGY_SUCCESSOR
  const packet = JSON.parse(packetBytes)
  const sourcePath = 'lore/chronology/Century-Annals.json'
  const receiptPath = POST62_ROOT + 'timeline-three-remediation-20261015/'
  const receiptRef = { path: receiptPath + 'receipt.json', sha256: '845c4ef80b1d1174a9b439becffcb334e55180b0b5acb37e34af73279e78773c' }
  const independentRef = { path: receiptPath + 'independent.json', sha256: '61ffd3bd97129ae9021e5a25607c146da64437da6cc2b889984214bbfc6fe285' }
  const prior = earlierBatches.flatMap(row => (row.sourceBeforeAfter?.sources ?? []).filter(source => source.sourcePath === sourcePath && source.changed)
    .map(source => ({ batchId: row.batchId, beforeSha256: source.beforeSha256, afterSha256: source.afterSha256 })))
  check(batch.batchId === binding.batchId && batch.packetPath === binding.directory + 'application-packet.json'
    && batch.packetSha256 === binding.packetSha256 && batch.sourceBeforeAfterPath === binding.directory + 'source-before-after.json'
    && batch.operationCount === 3 && eq(batch.personIds, []) && eq(batch.approvals, [])
    && eq(batch.applicationReview, { evidencePath: independentRef.path, evidenceSha256: independentRef.sha256 })
    && prefix.length === 68 && prefixSha256 === binding.prefixSha256
    && eq(packet.registryPrefix, { count: 68, sha256: binding.prefixSha256 }) && eq(packet.priorSourceVariants, prior)
    && packet.schema === 'seoul-chronology-source-successor.v1' && packet.batchId === binding.batchId
    && packet.sourcePath === sourcePath && packet.authority === 'source-registration-only; independent evidence does not grant owner event approval'
    && eq(packet.receipt, receiptRef) && eq(packet.independent, independentRef),
  'E_APPROVAL_BATCH', '/applied/chronology/packet')
  const [receiptBytes, independentBytes, before, after] = await Promise.all([
    readBytes(resolve(root, receiptRef.path)), readBytes(resolve(root, independentRef.path)),
    readBytes(resolve(root, packet.before.path)), readBytes(resolve(root, sourcePath))])
  const receipt = JSON.parse(receiptBytes); const independent = JSON.parse(independentBytes)
  check(sha256(receiptBytes) === receiptRef.sha256 && sha256(independentBytes) === independentRef.sha256
    && packet.before.path === receipt.beforeArchive && packet.before.sha256 === receipt.beforeRawUtf8Sha256
    && packet.after.sha256 === receipt.afterRawUtf8Sha256 && packet.before.bytes === receipt.beforeByteLength
    && packet.after.bytes === receipt.afterByteLength && sha256(before) === packet.before.sha256
    && sha256(after) === packet.after.sha256 && before.length === packet.before.bytes && after.length === packet.after.bytes
    && receipt.sourcePath === sourcePath && receipt.operations.length === 3
    && receipt.inverse.preconditionAfterRawUtf8Sha256 === packet.after.sha256
    && receipt.inverse.restoreRawUtf8Sha256 === packet.before.sha256
    && independent.sourceSha256 === packet.after.sha256 && independent.decision === 'PASS'
    && independent.counts.reviewed === 233 && independent.counts.unreviewed === 0
    && independent.counts.outsideCurrent === 0 && independent.events.length === 233,
  'E_REVIEW_HASH', '/applied/chronology/evidence')
  const original = JSON.parse(before); const revised = JSON.parse(after)
  check(sha256(JSON.stringify(original)) === packet.beforeParsedSha256 && sha256(JSON.stringify(revised)) === packet.after.parsedSha256
    && sha256(JSON.stringify(revised.content)) === independent.contentSha256
    && eq(packet.operationPaths, receipt.operations.map(op => op.path))
    && eq(packet.operationPaths, ['/content/563/text/ko', '/content/563/text/en', '/content/615/text/en'])
    && sha256(JSON.stringify(original.content[431])) === packet.approved2116BlockSha256
    && sha256(JSON.stringify(revised.content[431])) === packet.approved2116BlockSha256
    && packet.reviewedEvents === 233, 'E_REVIEW_HASH', '/applied/chronology/parsed')
  for (const [i, op] of receipt.operations.entries()) {
    const inverse = receipt.inverse.operations[i]
    check(op.op === 'replace' && inverse.op === 'replace' && op.path === inverse.path
      && pointer(original, op.path) === op.before && pointer(revised, op.path) === op.after
      && inverse.before === op.after && inverse.after === op.before,
    'E_REVIEW_HASH', '/applied/chronology/operation', op.path)
    pointer(original, op.path.slice(0, op.path.lastIndexOf('/')))[op.path.split('/').at(-1)] = op.after
  }
  check(isDeepStrictEqual(original, revised), 'E_REVIEW_HASH', '/applied/chronology/replay')
  for (const inverse of receipt.inverse.operations) {
    pointer(original, inverse.path.slice(0, inverse.path.lastIndexOf('/')))[inverse.path.split('/').at(-1)] = inverse.after
  }
  check(isDeepStrictEqual(original, JSON.parse(before)), 'E_REVIEW_HASH', '/applied/chronology/inverse')
  const dated = []; let year = null
  for (const block of revised.content) {
    if (block.kind === 'heading' && /^\d{4}년$/.test(block.text?.ko)) year = Number(block.text.ko.slice(0, 4))
    if (year !== null && block.kind === 'paragraph') dated.push({ id: block.anchor, sha256: sha256(JSON.stringify(block)), year })
  }
  check(dated.length === 233 && new Set(dated.map(row => row.id)).size === 233
    && eq(dated, independent.events.map(({ id, sha256, year }) => ({ id, sha256, year })))
    && independent.events.every(row => row.semanticReview === 'reviewed' && row.scene === 'seoul-current' && row.route === 'seoul-current'),
  'E_REVIEW_HASH', '/applied/chronology/events')
  check(eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.batchId, sources: [{
    sourcePath, beforeSha256: packet.before.sha256, afterSha256: packet.after.sha256,
    beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false,
  }] }), 'E_REVIEW_HASH', '/applied/chronology/manifest')
}

async function validateFiveSourceSuccessor(batch, packetBytes, manifest, readBytes, root, prefix) {
  const binding = FIVE_SOURCE_SUCCESSOR
  check(batch.batchId === binding.batchId && batch.packetPath === binding.packetPath
    && batch.packetSha256 === binding.packetSha256 && batch.operationCount === 47
    && eq(batch.personIds, []) && eq(batch.approvals, []), 'E_APPROVAL_BATCH', '/applied/five-source')
  const packet = JSON.parse(packetBytes)
  check(packet.schema === 'seoul-current-five-source-successors.v1' && packet.batchId === binding.batchId
    && packet.registryPrefix.count === 67 && packet.registryPrefix.sha256 === binding.prefixSha256
    && prefix.length === 67 && sha256(Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')) === binding.prefixSha256
    && packet.sourceCount === 5 && packet.fourSourceOperationCount === 47
    && batch.sourceBeforeAfterPath === packet.manifest.path
    && sha256(await readBytes(resolve(root, packet.manifest.path))) === packet.manifest.sha256,
  'E_REVIEW_HASH', '/applied/five-source/packet')
  const loadProof = async ref => {
    const bytes = await readBytes(resolve(root, ref.path))
    check(sha256(bytes) === ref.sha256, 'E_REVIEW_HASH', ref.path)
    return JSON.parse(bytes)
  }
  const [candidate, actual, independent, formation] = await Promise.all([
    loadProof(packet.fourSource.candidate), loadProof(packet.fourSource.actual),
    loadProof(packet.fourSource.independent), loadProof(packet.formation.receipt),
  ])
  check(eq(batch.applicationReview, { evidencePath: packet.fourSource.independent.path,
    evidenceSha256: packet.fourSource.independent.sha256 }) && independent.verdict === 'PASS_APPLIED_BOUNDED'
    && independent.actualRoot === resolve(root) && actual.status === 'applied_on_disk'
    && actual.documents.length === 4 && candidate.documents.length === 4
    && independent.operations.applied === 47 && independent.renders.actualFullBodiesByteEqualArchivedAfter === 8
    && candidate.documents.reduce((n, row) => n + row.changes.length, 0) === 47,
  'E_REVIEW_HASH', '/applied/five-source/independent')
  const expected = []
  for (const document of candidate.documents) {
    const observation = actual.documents.find(row => row.path === document.path)
    const review = independent.documents.find(row => row.absolutePath === resolve(root, document.path))
    const beforePath = POST62_ROOT + 'six-doc-remediation-20261015/before/' + document.path
    const afterPath = POST62_ROOT + 'six-doc-remediation-20261015/after/' + document.path
    const [before, after, live] = await Promise.all([readBytes(resolve(root, beforePath)),
      readBytes(resolve(root, afterPath)), readBytes(resolve(root, document.path))])
    check(observation?.beforeArchiveSha256 === document.before.sha256 && observation.actualSha256 === document.after.sha256
      && observation.reviewedProseLeaves === document.changes.length && observation.candidateByteEqual === true
      && review?.sha256 === document.after.sha256 && review.byteEqualArchivedAfter === true
      && review.operationsApplied === document.changes.length && sha256(before) === document.before.sha256
      && sha256(after) === document.after.sha256
      && (after.equals(live) || FOUR_DOCUMENTS_STATUS.paths.includes(document.path)
        && sha256(live) === FOUR_DOCUMENTS_STATUS.afterSha256[document.path]
        && live.toString().replace('"status": "approved"', '"status": "draft"') === after.toString())
      && before.length === document.before.bytes && after.length === document.after.bytes,
    'E_REVIEW_HASH', '/applied/five-source/raw', document.path)
    const original = JSON.parse(before); const revised = JSON.parse(after)
    for (const op of document.changes) {
      check(typeof op.before === 'string' && typeof op.after === 'string'
        && pointer(original, op.pointer) === op.before && pointer(revised, op.pointer) === op.after,
      'E_REVIEW_HASH', document.path, op.pointer)
      pointer(original, op.pointer.slice(0, op.pointer.lastIndexOf('/')))[op.pointer.split('/').at(-1)] = op.after
    }
    check(eq(original, revised), 'E_REVIEW_HASH', '/applied/five-source/replay', document.path)
    expected.push({ sourcePath: document.path, beforeSha256: document.before.sha256, afterSha256: document.after.sha256,
      beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
  }
  const formationPath = formation.sourcePath
  const [before, after, live] = await Promise.all([readBytes(resolve(root, packet.formation.beforePath)),
    readBytes(resolve(root, packet.formation.afterPath)), readBytes(resolve(root, formationPath))])
  check(formationPath === 'lore/relations/state-formation-contract.json'
    && sha256(before) === formation.before.sha256 && sha256(after) === formation.after.sha256
    && after.equals(live) && before.length === formation.before.bytes && after.length === formation.after.bytes,
  'E_REVIEW_HASH', '/applied/five-source/formation')
  expected.push({ sourcePath: formationPath, beforeSha256: formation.before.sha256, afterSha256: formation.after.sha256,
    beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
  check(eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: binding.batchId, sources: expected }),
    'E_REVIEW_HASH', '/applied/five-source/manifest')
}

async function validatePost62SourceApplication(batch, packetBytes, manifest, readBytes, root) {
  const model = batch.approvalModel; const binding = POST62_SOURCE_APPLICATIONS[model]
  const path = POST62_STAGE + model + '/application-packet.json'
  check(batch.batchId === model && eq(batch.personIds, []) && batch.packetPath === path
    && batch.packetSha256 === binding.packetSha256 && batch.operationCount === binding.operations
    && batch.sourceBeforeAfterPath === POST62_STAGE + model + '/source-before-after.json'
    && eq(batch.approvals, [{ kind: model, bodySha256: POST62_OWNER.sha256,
      messageRef: POST62_OWNER.path, authorizationSha256: POST62_APPROVAL.sha256 }]),
  'E_APPROVAL_KIND', '/applied/post62', model)
  const packet = JSON.parse(packetBytes)
  const facility = model === 'facility-nongrant-source-228'
  const evidence = binding.group ? POST62_INDEPENDENT : facility
    ? { path: POST62_ROOT + 'facility-nongrant-implementation-20261015/independent.md', sha256: binding.reviewSha256 }
    : { path: POST62_ROOT + 'offices-v2-implementation-20261015/core.json', sha256: binding.coreSha256 }
  check(sha256(packetBytes) === binding.packetSha256
    && eq(batch.applicationReview, { evidencePath: evidence.path, evidenceSha256: evidence.sha256 })
    && eq(packet.ownerAuthority, POST62_OWNER) && eq(packet.approvalPacket, POST62_APPROVAL)
    && packet.batchId === model && packet.operationCount === binding.operations,
  'E_APPROVAL_BATCH', '/applied/post62/packet', model)
  for (const ref of [POST62_OWNER, POST62_APPROVAL, evidence]) {
    check(sha256(await readBytes(resolve(root, ref.path))) === ref.sha256, 'E_APPROVAL_BATCH', ref.path)
  }
  const rows = []
  if (binding.group) {
    const directory = POST62_ROOT + 'recommendations-application-20261015/'
    const registrar = { path: directory + 'registrar-' + binding.group + '.json', sha256: binding.registrarSha256 }
    const receipt = { path: directory + binding.group + '/receipt.json', sha256: binding.receiptSha256 }
    shape(packet, ['schema', 'batchId', 'group', 'ownerAuthority', 'approvalPacket', 'independentReview', 'registrar', 'applicationReceipt', 'sourceCount', 'operationCount'], '/applied/post62/group-packet')
    check(packet.schema === 'seoul-post62-source-application.v1' && packet.group === binding.group
      && packet.sourceCount === binding.sources && eq(packet.independentReview, POST62_INDEPENDENT)
      && eq(packet.registrar, registrar) && eq(packet.applicationReceipt, receipt), 'E_APPROVAL_BATCH', '/applied/post62/group', model)
    const [registrarBytes, receiptBytes] = await Promise.all([readBytes(resolve(root, registrar.path)), readBytes(resolve(root, receipt.path))])
    check(sha256(registrarBytes) === registrar.sha256 && sha256(receiptBytes) === receipt.sha256, 'E_APPROVAL_BATCH', '/applied/post62/receipt', model)
    const data = JSON.parse(registrarBytes); const review = JSON.parse(await readBytes(resolve(root, evidence.path)))
    check(data.schema === 'independent-registrar-reversible-group.v1' && data.group === binding.group
      && data.approvalPacketSha256 === POST62_APPROVAL.sha256 && data.sourceCount === binding.sources
      && data.operationCount === binding.operations && data.sources.length === binding.sources
      && data.operations.length === binding.operations && review.groups[binding.group]?.verdict === 'verified'
      && review.groups[binding.group].operationCount === binding.operations
      && eq(review.groups[binding.group].files.map(row => [row.path, row.beforeSha256, row.afterSha256]),
        data.sources.map(row => [row.path, row.beforeSha256, row.afterSha256])), 'E_REVIEW_HASH', '/applied/post62/independent', model)
    const values = new Map()
    for (const source of data.sources) {
      const before = gunzipSync(Buffer.from(source.beforeRawGzipBase64, 'base64'))
      const after = gunzipSync(Buffer.from(source.afterRawGzipBase64, 'base64'))
      check(sha256(before) === source.beforeSha256 && sha256(after) === source.afterSha256
        && before.length === source.beforeBytes && after.length === source.afterBytes
        && !values.has(source.path), 'E_REVIEW_HASH', '/applied/post62/snapshot', source.path)
      values.set(source.path, { before: JSON.parse(before), after: JSON.parse(after) })
      rows.push({ sourcePath: source.path, beforeSha256: source.beforeSha256, afterSha256: source.afterSha256,
        beforeBytes: source.beforeBytes, afterBytes: source.afterBytes, changed: true, sealed: false })
    }
    const seen = new Set()
    for (const op of data.operations) {
      const source = values.get(op.sourcePath); const key = JSON.stringify([op.sourcePath, op.pointer])
      check(source && !seen.has(key) && typeof op.before === 'string' && typeof op.after === 'string'
        && sha256(JSON.stringify(op.before)) === op.beforeValueSha256
        && sha256(JSON.stringify(op.after)) === op.afterValueSha256
        && pointer(source.before, op.pointer) === op.before && pointer(source.after, op.pointer) === op.after
        && review.groups[binding.group].operations.some(row => row.id === op.id && row.pointer === op.pointer
          && row.beforeValueSha256 === op.beforeValueSha256 && row.afterValueSha256 === op.afterValueSha256),
      'E_REVIEW_HASH', '/applied/post62/operation', key)
      seen.add(key)
      const parent = op.pointer.slice(0, op.pointer.lastIndexOf('/'))
      pointer(source.before, parent)[op.pointer.slice(op.pointer.lastIndexOf('/') + 1)] = op.after
    }
    for (const [sourcePath, source] of values) check(eq(source.before, source.after), 'E_REVIEW_HASH', '/applied/post62/replay', sourcePath)
  } else if (facility) {
    const directory = POST62_ROOT + 'facility-nongrant-implementation-20261015/'
    const receiptRef = { path: directory + 'receipt.json', sha256: binding.receiptSha256 }
    const operationsRef = { path: directory + 'operations-and-inverse.json', sha256: binding.operationEvidenceSha256 }
    const archiveRef = { path: directory + 'station-interiors.before.json.gz.base64', sha256: binding.archiveSha256 }
    shape(packet, ['schema', 'batchId', 'ownerAuthority', 'approvalPacket', 'receipt', 'independentReview', 'operationEvidence', 'beforeArchive', 'sourcePath', 'sourceBeforeSha256', 'sourceAfterSha256', 'operationCount'], '/applied/post62/facility-packet')
    check(packet.schema === 'seoul-post62-facility-application.v1' && eq(packet.receipt, receiptRef)
      && eq(packet.independentReview, evidence) && eq(packet.operationEvidence, operationsRef)
      && eq(packet.beforeArchive, archiveRef) && packet.sourcePath === 'lore/regions/station-interiors.json'
      && packet.sourceBeforeSha256 === 'f9cc33e7b78aac3c72eaed79b2279f07081a598dc2b601ee57929511f076bffb'
      && packet.sourceAfterSha256 === 'e438e9176a8c4d269b5ec354428931f47ed5d7cbe9f5beb766deee11dbffa664',
    'E_APPROVAL_BATCH', '/applied/post62/facility', model)
    const [receiptBytes, ledgerBytes, archiveBytes, after] = await Promise.all([
      readBytes(resolve(root, receiptRef.path)), readBytes(resolve(root, operationsRef.path)),
      readBytes(resolve(root, archiveRef.path)), readBytes(resolve(root, packet.sourcePath)),
    ])
    check(sha256(receiptBytes) === receiptRef.sha256 && sha256(ledgerBytes) === operationsRef.sha256
      && sha256(archiveBytes) === archiveRef.sha256 && sha256(after) === packet.sourceAfterSha256,
    'E_REVIEW_HASH', '/applied/post62/facility-evidence')
    const receipt = JSON.parse(receiptBytes); const ledger = JSON.parse(ledgerBytes)
    const before = gunzipSync(Buffer.from(archiveBytes.toString(), 'base64'))
    check(receipt.schema === 'facility-nongrant-implementation-receipt.v1'
      && receipt.authority.approvalsPath === POST62_APPROVAL.path
      && receipt.authority.sha256 === POST62_APPROVAL.sha256 && receipt.source.path === packet.sourcePath
      && receipt.source.before.sha256 === packet.sourceBeforeSha256
      && receipt.source.before.compressedSha256 === sha256(Buffer.from(archiveBytes.toString(), 'base64'))
      && receipt.source.after.sha256 === packet.sourceAfterSha256
      && receipt.source.operations.sha256 === operationsRef.sha256
      && before.length === receipt.source.before.bytes && after.length === receipt.source.after.bytes
      && sha256(before) === packet.sourceBeforeSha256 && ledger.schema === 'station-interiors-facility-exact-inverse.v1'
      && ledger.sourcePath === packet.sourcePath && ledger.beforeSha256 === packet.sourceBeforeSha256
      && ledger.afterSha256 === packet.sourceAfterSha256 && ledger.applied.length === binding.operations
      && ledger.inverse.length === binding.operations, 'E_REVIEW_HASH', '/applied/post62/facility-receipt')
    const owner = JSON.parse(await readBytes(resolve(root, POST62_APPROVAL.path)))
    const selected = owner.supplementalRecommendations.records.filter(row => row.sourcePath === packet.sourcePath)
    check(selected.length === 218 && owner.explicitFacilityOperations.length === 4
      && ledger.applied.filter(op => selected.some(row => row.id === op.id)).length === 218,
    'E_SCOPE_SHAPE', '/applied/post62/facility-selection')
    const identity = row => [row.name, row.district, row.lat, row.lon, row.network]
    const current = JSON.parse(after); const original = JSON.parse(before)
    check(current.stations.length === 334 && original.stations.length === 334
      && eq(original.stations.map(identity), current.stations.map(identity))
      && eq(original.stations.map(row => row.layers.map(layer => layer.id)),
        current.stations.map(row => row.layers.map(layer => layer.id))), 'E_REVIEW_HASH', '/applied/post62/facility-identity')
    const apply = (document, operation) => {
      const parentPath = operation.path.slice(0, operation.path.lastIndexOf('/'))
      const key = operation.path.slice(operation.path.lastIndexOf('/') + 1)
      const parent = pointer(document, parentPath)
      const present = Object.hasOwn(parent, key)
      check(present === operation.preimage.exists && eq(present ? parent[key] : null, operation.preimage.value)
        && sha256(JSON.stringify(operation.preimage.value)) === operation.preimage.sha256
        && sha256(JSON.stringify(operation.result.value)) === operation.result.sha256
        && operation.result.exists === (operation.op !== 'remove'), 'E_REVIEW_HASH', '/applied/post62/facility-operation', operation.id)
      if (operation.op === 'remove') delete parent[key]
      else { check(operation.op === (present ? 'replace' : 'add'), 'E_SCOPE_SHAPE', '/applied/post62/facility-op', operation.id); parent[key] = operation.result.value }
    }
    const seen = new Set()
    for (const operation of ledger.applied) {
      const key = operation.path
      const approved = selected.find(row => row.id === operation.id) ?? owner.explicitFacilityOperations.find(row => row.id === operation.id)
      check(!seen.has(key) && (approved ? approved.pointer === key && eq(approved.before, operation.preimage.value)
        && eq(approved.after, operation.result.value) : /^\/stations\/310\/layers\/[0-2]\/(?:contents|wiki_layer)$/.test(key))
        && operation.id !== '', 'E_APPROVAL_BATCH', '/applied/post62/facility-owner', operation.id)
      seen.add(key)
      apply(original, operation)
    }
    check(isDeepStrictEqual(original, current) && eq(ledger.inverse.map(row => row.path), ledger.applied.map(row => row.path).reverse()),
    'E_REVIEW_HASH', '/applied/post62/facility-forward')
    for (const operation of ledger.inverse) apply(original, operation)
    check(isDeepStrictEqual(original, JSON.parse(before)), 'E_REVIEW_HASH', '/applied/post62/facility-inverse')
    rows.push({ sourcePath: packet.sourcePath, beforeSha256: packet.sourceBeforeSha256, afterSha256: packet.sourceAfterSha256,
      beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
  } else {
    const coreRef = { path: POST62_ROOT + 'offices-v2-implementation-20261015/core.json', sha256: binding.coreSha256 }
    const operationsRef = { path: POST62_ROOT + 'reload-mass-phase-20261015/offices/operations.json', sha256: binding.operationEvidenceSha256 }
    const core = JSON.parse(await readBytes(resolve(root, coreRef.path)))
    const archiveRef = { path: POST62_ROOT + 'reload-mass-phase-20261015/offices/Offices-and-Ranks.before.json', sha256: core.source.before.sha256 }
    shape(packet, ['schema', 'batchId', 'ownerAuthority', 'approvalPacket', 'core', 'operationEvidence', 'beforeArchive', 'sourcePath', 'sourceAfterSha256', 'operationCount'], '/applied/post62/offices-packet')
    check(packet.schema === 'seoul-post62-offices-source-application.v1' && eq(packet.core, coreRef)
      && eq(packet.operationEvidence, operationsRef) && eq(packet.beforeArchive, archiveRef)
      && packet.sourcePath === 'lore/offices/Offices-and-Ranks.json' && packet.sourcePath === core.source.path
      && packet.sourceAfterSha256 === core.source.after.sha256 && core.fieldChanges.length === binding.operations
      && core.source.before.sha256 === '2f49552309431ed15c9a0fe80a7da32651dd2cd5b6977d7eaa44e5c420895aa8'
      && core.source.after.sha256 === '26b27560e9e6ee4477ac8bfa47663e848a0e8b18f415fb11bd99506b23b7a8ca',
    'E_APPROVAL_BATCH', '/applied/post62/offices', model)
    const before = await readBytes(resolve(root, archiveRef.path))
    const liveAfter = await readBytes(resolve(root, packet.sourcePath))
    const repin = sha256(liveAfter) === packet.sourceAfterSha256 ? null
      : await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readBytes) ?? readBytes)
    const officesSuccessor = repin?.transitions.find(row => row.path === packet.sourcePath)
    const after = sha256(liveAfter) === packet.sourceAfterSha256 ? liveAfter
      : Buffer.from(`${JSON.stringify(materializeOfficesPredecessor(JSON.parse(liveAfter)), null, 2)}\n`)
    const operationBytes = await readBytes(resolve(root, operationsRef.path))
    check(sha256(before) === archiveRef.sha256 && sha256(operationBytes) === operationsRef.sha256
      && sha256(after) === packet.sourceAfterSha256 && before.length === core.source.before.bytes
      && after.length === core.source.after.bytes
      && (liveAfter === after || (officesSuccessor?.beforeSha256 === packet.sourceAfterSha256
        && officesSuccessor.afterSha256 === sha256(liveAfter))), 'E_REVIEW_HASH', '/applied/post62/offices-bytes')
    const old = JSON.parse(before); const current = JSON.parse(after); const operations = JSON.parse(operationBytes)
    check(operations.length === binding.operations * 2
      && eq(operations.map((op, i) => [op.op, op.path]), core.fieldChanges.flatMap(row => [['test', row.path], ['replace', row.path]])),
    'E_SCOPE_SHAPE', '/applied/post62/offices-operations')
    for (let i = 0; i < operations.length; i += 2) {
      const test = operations[i]; const replace = operations[i + 1]; const field = core.fieldChanges[i / 2]
      check(eq(pointer(old, test.path), test.value) && eq(pointer(current, replace.path), replace.value)
        && sha256(JSON.stringify(test.value)) === field.beforeValueSha256
        && sha256(JSON.stringify(replace.value)) === field.afterValueSha256,
      'E_REVIEW_HASH', '/applied/post62/offices-operation', test.path)
      const parent = test.path.slice(0, test.path.lastIndexOf('/'))
      pointer(old, parent)[test.path.slice(test.path.lastIndexOf('/') + 1)] = replace.value
    }
    check(eq(old, current), 'E_REVIEW_HASH', '/applied/post62/offices-replay')
    rows.push({ sourcePath: packet.sourcePath, beforeSha256: archiveRef.sha256, afterSha256: packet.sourceAfterSha256,
      beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
  }
  check(eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: model, sources: rows }),
    'E_REVIEW_HASH', '/applied/post62/manifest', model)
}

async function validateRightsTransition(batch, packetBytes, manifest, readBytes, root) {
  const binding = RIGHTS_TRANSITION
  check(batch.batchId === 'approved-rights-transition' && eq(batch.personIds, []) && eq(batch.approvals, [{
    kind: 'approved-rights-transition', bodySha256: binding.approvalSha256,
    messageRef: binding.receiptPath, authorizationSha256: binding.receiptSha256,
  }]), 'E_APPROVAL_KIND', '/applied/rights')
  check(batch.packetPath === binding.packetPath && sha256(packetBytes) === binding.packetSha256,
    'E_APPROVAL_BATCH', '/applied/rights/packet')
  const approvalBytes = await readBytes(resolve(root, binding.approvalPath))
  check(sha256(approvalBytes) === binding.approvalSha256
    && sha256(await readBytes(resolve(root, binding.receiptPath))) === binding.receiptSha256,
  'E_APPROVAL_BATCH', '/applied/rights/owner')
  const packet = JSON.parse(packetBytes); const approval = JSON.parse(approvalBytes)
  check(packet.approvalPackageSha256 === binding.approvalSha256 && packet.approvalReceiptSha256 === binding.receiptSha256
    && approval.approvalReceiptSha256 === binding.receiptSha256 && eq(packet.records, approval.records),
  'E_APPROVAL_BATCH', '/applied/rights/mappings')
  const proposalPath = '.omo/private/seoul-migration/task-8-daejeon-superior-jurisdiction-proposal.json'
  check(sha256(await readBytes(resolve(root, proposalPath))) === packet.nonowningProposalSha256,
    'E_APPROVAL_BATCH', proposalPath)
  const sources = new Map(); const rows = []
  for (const file of packet.files) {
    const before = Buffer.from(file.beforeUtf8); const after = Buffer.from(file.afterUtf8)
    const original = approval.originalSources[file.path.endsWith('/personal-holdings.json') ? 'existing' : 'allocation']
    check(sha256(before) === file.beforeSha256 && sha256(after) === file.afterSha256
      && original.sha256 === file.beforeSha256 && sha256(await readBytes(resolve(root, original.path))) === file.beforeSha256,
    'E_REVIEW_HASH', '/applied/rights/source', file.path)
    sources.set(file.path, { before: JSON.parse(before), after: JSON.parse(after), beforeSha256: file.beforeSha256, afterSha256: file.afterSha256 })
    rows.push({ sourcePath: file.path, beforeSha256: file.beforeSha256, afterSha256: file.afterSha256,
      beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
  }
  check(eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: batch.batchId, sources: rows }),
    'E_REVIEW_HASH', '/applied/rights/manifest')
  const dispositions = []; const mappedKeys = []
  const expected = new Map([...sources].map(([path, value]) => [path, structuredClone(value.before)]))
  for (const field of ['titles', 'grants', 'holdings', 'existingTitleBindings']) {
    const path = field === 'holdings' ? 'lore/relations/personal-holdings.json' : 'lore/relations/opening-feudal-allocation.json'
    const source = sources.get(path); const set = field === 'existingTitleBindings' ? 'bindings' : field
    const identity = row => field === 'existingTitleBindings' ? JSON.stringify([row.holdingId, row.titleId]) : row.id
    const successors = []
    for (const [index, old] of source.before[field].entries()) {
      const key = field === 'existingTitleBindings' ? old.holdingId : old.id
      const mapping = approval.records.find(row => row.set === field && row.oldId === key)
      check(mapping && mapping.sourceValueSha256 === sha256(JSON.stringify(old)), 'E_CENSUS_RIGHT', '/applied/rights/original', key)
      mappedKeys.push(JSON.stringify([field, key]))
      const next = mapping.disposition === 'retired-current' ? null : mapping.current ?? old
      if (next) successors.push(next)
      const currentIndex = next ? source.after[field].findIndex(row => identity(row) === identity(next)) : -1
      check(!next || currentIndex >= 0 && eq(source.after[field][currentIndex], next), 'E_CENSUS_RIGHT', '/applied/rights/successor', key)
      const ref = (value, i, sha) => ({ id: identity(value), sourcePath: path, jsonPointer: `/${field}/${i}`, sourceSha256: sha, recordSha256: sha256(JSON.stringify(value)) })
      const newRefs = next ? [ref(next, currentIndex, source.afterSha256)] : []
      if (!next && set === 'titles') {
        const i = source.after.politicalIdentities.findIndex(row => row.id === old.id)
        check(i >= 0, 'E_CENSUS_RIGHT', '/applied/rights/politicalIdentity', key)
        const value = source.after.politicalIdentities[i]
        newRefs.push({ id: value.id, sourcePath: path, jsonPointer: `/politicalIdentities/${i}`, sourceSha256: source.afterSha256, recordSha256: sha256(JSON.stringify(value)) })
      }
      dispositions.push({ set, id: identity(old), originalRef: ref(old, index, source.beforeSha256), newRefs,
        disposition: mapping.disposition, batchId: batch.batchId, approval: batch.approvals[0] })
    }
    expected.get(path)[field] = successors
  }
  exact(mappedKeys, approval.records.map(row => JSON.stringify([row.set, row.oldId])), 'E_CENSUS_RIGHT', '/applied/rights/411')
  check(mappedKeys.length === 411, 'E_CENSUS_RIGHT', '/applied/rights/denominator')
  expected.get('lore/relations/personal-holdings.json').polities = approval.polities
  const allocation = sources.get('lore/relations/opening-feudal-allocation.json')
  const politicalIdentities = allocation.before.titles.filter(row => approval.records.some(r => r.set === 'titles' && r.oldId === row.id && r.disposition === 'retired-current')).map(title => ({
    id: title.id, kind: 'nonterritorial-political-identity', rank: title.rank, holderPersonId: title.holderPersonId,
    stateId: title.stateId, politicalParentTitleId: title.parentTitleId ?? null,
    personalLieges: allocation.before.grants.filter(grant => grant.titleId === title.id).map(grant => ({ holdingId: grant.id, directLiegePersonId: grant.directLiegePersonId })), directOwnership: false,
  }))
  check(eq(packet.politicalIdentities, politicalIdentities), 'E_CENSUS_RIGHT', '/applied/rights/politicalIdentities')
  expected.get('lore/relations/opening-feudal-allocation.json').politicalIdentities = politicalIdentities
  for (const [path, value] of expected) check(eq(value, sources.get(path).after), 'E_REVIEW_HASH', '/applied/rights/replay', path)
  const proof = { approvalBody: approvalBytes.toString(), receiptBody: (await readBytes(resolve(root, binding.receiptPath))).toString(),
    sources: packet.files.map(file => ({ sourcePath: file.path, beforeBody: file.beforeUtf8, afterBody: file.afterUtf8 })) }
  return { dispositions, sources, proof }
}

// Closed pending-inventory contract. Approval/application is a later contract
// transition, not an inference from extracted bodies or archived approvals.
// An applied batch is honored only through the private registry whose every
// referenced hash is verified against actual bytes here — never by trust.
async function validateS01ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S01_REVIEWED_SOURCE
  const path = 'lore/characters/Cast-State-01.json'
  const hash = value => sha256(JSON.stringify(value))
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const packet = JSON.parse(packetBytes)
  const archiveBytes = await readBytes(resolve(root, b.directory + 'before-raw.json'))
  const archive = JSON.parse(archiveBytes)
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, path))
  check(prefix.length === 76 && sha256(prefixBytes) === b.prefixSha256
    && batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && batch.operationCount === 115
    && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [{
      sourcePath: path, beforeSha256: b.beforeSha256, afterSha256: b.afterSha256,
      beforeBytes: 485531, afterBytes: 484858, changed: true, sealed: false }] })
    && batch.applicationReview.evidencePath === packet.independent.path
    && batch.applicationReview.evidenceSha256 === b.reviewSha256
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: b.ownerSha256,
      messageRef: packet.owner.path }])
    && sha256(archiveBytes) === b.archiveSha256 && archive.sourcePath === path
    && archive.rawSha256 === b.beforeSha256 && archive.rawBytes === before.length
    && sha256(before) === b.beforeSha256 && sha256(after) === b.afterSha256,
  'E_APPROVAL_BATCH', '/applied/s01')
  const refs = { proposal: b.proposalSha256, independent: b.reviewSha256,
    pinResolution: b.pinSha256, owner: b.ownerSha256, beforeArchive: b.archiveSha256 }
  for (const [key, expected] of Object.entries(refs)) {
    check(packet[key]?.sha256 === expected && sha256(await readBytes(resolve(root, packet[key].path))) === expected,
      'E_REVIEW_HASH', '/applied/s01/' + key)
  }
  check(packet.schema === 'seoul-s01-reviewed-source-application.v1' && packet.batchId === b.id
    && eq(packet.registryPrefix, { count: 76, sha256: b.prefixSha256 })
    && eq(packet.source, { path, beforeSha256: b.beforeSha256, afterSha256: b.afterSha256,
      beforeBytes: before.length, afterBytes: after.length })
    && packet.operations === 115 && packet.people === 65 && packet.workReferences === 67
    && packet.connectedRelationReferences === 183 && packet.uniqueRelationRows === 112
    && packet.scope === 'private-source-only; no core duplicate, publication, scope activation or generated synchronization',
  'E_APPROVAL_BATCH', '/applied/s01/packet')
  const proposal = JSON.parse(await readBytes(resolve(root, packet.proposal.path)))
  const review = JSON.parse(await readBytes(resolve(root, packet.independent.path)))
  const pin = JSON.parse(await readBytes(resolve(root, packet.pinResolution.path)))
  for (const [kind, sourcePath] of Object.entries({ relations: proposal.sourcePaths.relations,
    holdings: 'lore/relations/personal-holdings.json', titles: 'lore/regions/seoul-electoral-titles.json',
    station: 'lore/regions/station-interiors.json' }))
    check(sha256(await readBytes(resolve(root, sourcePath))) === proposal.sourceRawHashes[kind],
      'E_REVIEW_HASH', '/applied/s01/source', kind)
  check(review.verdict === 'PASS_65_CONTENT_BOUND_TO_OBSERVED_SHA'
    && review.observedCandidateRawSha256 === b.proposalSha256
    && pin.resolution === 'resolved' && pin.actualRawSha256 === b.proposalSha256
    && pin.priorReviewBindings['independent-v2.json'] === b.reviewSha256
    && proposal.sourceRawHashes.cast === b.beforeSha256
    && proposal.sourcePaths.cast === path && proposal.persons.length === 65
    && proposal.operations.length === 115 && proposal.inverseOperations.length === 115
    && proposal.connectedRelations.length === 112
    && eq(proposal.persons.map(person => person.id), batch.personIds)
    && eq(review.coverage, { people: 65, fullKoreanCards: 65, fullEnglishCards: 65,
      workReferences: 67, connectedRelationReferences: 183, uniqueRelationRows: 112,
      operations: 115, inverseOperations: 115, changedSemanticOperationIds: ['K005', 'K008', 'K014'],
      unchangedFullCardsInheritedFromV1Review: 62, unchangedOperationAfterValues: 112 }),
  'E_REVIEW_COVERAGE', '/applied/s01/review')
  const beforeValue = JSON.parse(before); const afterValue = JSON.parse(after)
  const replay = structuredClone(beforeValue)
  const seen = new Set()
  for (const operation of proposal.operations) {
    check(operation.path === path && !seen.has(operation.pointer)
      && hash(pointer(replay, operation.pointer)) === operation.beforeValueSha256
      && hash(operation.before) === operation.beforeValueSha256
      && hash(operation.after) === operation.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s01/operation', operation.pointer)
    seen.add(operation.pointer)
    const parts = operation.pointer.split('/')
    pointer(replay, parts.slice(0, -1).join('/'))[parts.at(-1)] = structuredClone(operation.after)
  }
  check(seen.size === 115 && eq(replay, afterValue), 'E_REVIEW_HASH', '/applied/s01/forward')
  for (const operation of proposal.inverseOperations) {
    check(operation.path === path && seen.has(operation.pointer)
      && hash(pointer(replay, operation.pointer)) === operation.beforeValueSha256
      && hash(operation.before) === operation.beforeValueSha256
      && hash(operation.after) === operation.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s01/inverse', operation.pointer)
    seen.delete(operation.pointer)
    const parts = operation.pointer.split('/')
    pointer(replay, parts.slice(0, -1).join('/'))[parts.at(-1)] = structuredClone(operation.after)
  }
  check(seen.size === 0 && eq(replay, beforeValue), 'E_REVIEW_HASH', '/applied/s01/restore')
  let workCount = 0; let relationCount = 0
  for (const person of proposal.persons) {
    const index = Number(person.headingPointer.split('/').at(-1))
    const boundary = value => {
      const end = value.content.findIndex((item, i) => i > index && item.kind === 'heading' && item.depth === 3)
      return value.content.slice(index, end < 0 ? undefined : end)
    }
    check(beforeValue.content[index]?.anchor === person.anchor && afterValue.content[index]?.anchor === person.anchor
      && hash(boundary(beforeValue)) === person.sourceBeforeFullCardSha256
      && hash(boundary(afterValue)) === person.sourceAfterFullCardSha256,
    'E_REVIEW_HASH', '/applied/s01/card', person.id)
    for (const ref of person.locationRefs) {
      const operation = proposal.operations.find(op => op.pointer === ref.pointer)
      check(operation?.personId === person.id && eq(pointer(afterValue, ref.pointer), ref.work),
      'E_REVIEW_HASH', '/applied/s01/work', person.id)
      workCount++
    }
    relationCount += person.relationPointers.length
  }
  const relations = JSON.parse(await readBytes(resolve(root, proposal.sourcePaths.relations)))
  for (const relation of proposal.connectedRelations)
    check(hash(pointer(relations, relation.pointer)) === relation.beforeValueSha256
      && hash(relation.before) === relation.beforeValueSha256
      && eq(relation.before, relation.after) && relation.afterValueSha256 === relation.beforeValueSha256,
    'E_REVIEW_HASH', '/applied/s01/relation', relation.pointer)
  check(workCount === 67 && relationCount === 183, 'E_REVIEW_COVERAGE', '/applied/s01/coverage')
}
async function validateCoreFourSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = CORE_FOUR_SOURCE
  const base = '.omo/private/seoul-migration/core-four-cross-source-causal-candidate-20261015/'
  const owner = '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md'
  const paths = ['Core-Characters.json', 'Cast-State-03.json', 'Cast-State-08.json', 'Cast-State-14.json', 'Cast-State-15.json']
    .map(name => `lore/characters/${name}`)
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const packet = JSON.parse(packetBytes)
  const readBound = async (path, digest) => {
    const bytes = await readBytes(resolve(root, path))
    check(sha256(bytes) === digest, 'E_REVIEW_HASH', '/applied/core-four/binding', path)
    return JSON.parse(bytes)
  }
  check(prefix.length === 77 && sha256(prefixBytes) === b.prefixSha256
    && batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && batch.operationCount === 39
    && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(batch.personIds, ['K057', 'K194', 'K348', 'K373'])
    && batch.applicationReview.evidencePath === base + 'independent-v2.json'
    && batch.applicationReview.evidenceSha256 === b.independentSha256
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: b.ownerSha256, messageRef: owner }]),
  'E_APPROVAL_BATCH', '/applied/core-four')
  const [archive, proposal, correction, review] = await Promise.all([
    readBound(b.directory + 'before-raw.json', b.archiveSha256),
    readBound(base + 'proposal.json', b.proposalSha256),
    readBound(base + 'correction-v2.json', b.correctionSha256),
    readBound(base + 'independent-v2.json', b.independentSha256),
  ])
  check(sha256(await readBytes(resolve(root, owner))) === b.ownerSha256,
    'E_REVIEW_HASH', '/applied/core-four/owner')
  const bindings = { proposal: [base + 'proposal.json', b.proposalSha256],
    correction: [base + 'correction-v2.json', b.correctionSha256],
    independent: [base + 'independent-v2.json', b.independentSha256],
    owner: [owner, b.ownerSha256], beforeArchive: [b.directory + 'before-raw.json', b.archiveSha256] }
  check(packet.schema === 'seoul-core-four-reviewed-source-application.v1'
    && packet.batchId === b.id && eq(packet.registryPrefix, { count: 77, sha256: b.prefixSha256 })
    && Object.entries(bindings).every(([key, [path, digest]]) => eq(packet[key], { path, sha256: digest }))
    && eq(packet.sources, manifest.sources) && eq(packet.operations, { base: 36, correction: 3 })
    && packet.scope === 'private-source-only; no census products, public files, scope activation or publication'
    && archive.schema === 'seoul-core-four-original-raw-archive.v1' && archive.sources.length === 5
    && proposal.operations.length === 36 && correction.operations.length === 3
    && proposal.sourceFiles.length === 5 && review.status === 'pass-bounded-four-core-cards-and-duplicates'
    && review.baseProposalSha256 === b.proposalSha256 && review.correctionSha256 === b.correctionSha256
    && review.coverage.baseOperationsReusedFromIndependentReview === 36
    && review.coverage.correctionOperationsChecked === 3
    && review.coverage.threeBeforeValuesMatchBaseAfter === true
    && review.coverage.compositeInverseRestoresFiveRawFiles === true
    && eq(review.coverage.fullBilingualCards, batch.personIds)
    && eq(review.residualFindings, []), 'E_REVIEW_COVERAGE', '/applied/core-four/review')
  const hashValue = value => sha256(JSON.stringify(value))
  const originals = new Map(); const current = new Map(); const replay = new Map()
  for (let i = 0; i < paths.length; i++) {
    const sourcePath = paths[i]; const archiveRow = archive.sources[i]
    const proposed = proposal.sourceFiles[i]; const reviewed = review.sourceAfterHashes[i]
    const row = manifest.sources[i]
    const before = gunzipSync(Buffer.from(archiveRow.gzipBase64, 'base64'))
    const after = await readBytes(resolve(root, sourcePath))
    check(archiveRow.sourcePath === sourcePath && archiveRow.rawSha256 === sha256(before)
      && archiveRow.rawBytes === before.length && eq(row, {
        sourcePath, beforeSha256: archiveRow.rawSha256, afterSha256: reviewed.afterSha256,
        beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false,
      }) && proposed.path === sourcePath && proposed.beforeSha256 === row.beforeSha256
      && proposed.beforeBytes === row.beforeBytes && reviewed.path === sourcePath
      && reviewed.beforeSha256 === row.beforeSha256 && reviewed.afterBytes === row.afterBytes
      && sha256(after) === row.afterSha256,
    'E_REVIEW_HASH', '/applied/core-four/source', sourcePath)
    originals.set(sourcePath, JSON.parse(before)); current.set(sourcePath, JSON.parse(after))
    replay.set(sourcePath, JSON.parse(before))
  }
  const apply = (operation, inverse = false) => {
    const document = replay.get(operation.file)
    check(document && operation.pointer.startsWith('/content/'), 'E_REVIEW_HASH', '/applied/core-four/pointer', operation.pointer)
    const parts = operation.pointer.split('/').slice(1)
    const parent = pointer(document, '/' + parts.slice(0, -1).join('/'))
    const key = parts.at(-1)
    const before = inverse ? operation.after : operation.before
    const after = inverse ? operation.before : operation.after
    check(eq(parent[key], before) && (!operation.beforeSha256 || hashValue(operation.before) === operation.beforeSha256)
      && (!operation.afterSha256 || hashValue(operation.after) === operation.afterSha256)
      && (!operation.inverse || (eq(operation.inverse.before, operation.after)
        && eq(operation.inverse.after, operation.before) && operation.inverse.path === operation.pointer)),
    'E_REVIEW_HASH', '/applied/core-four/operation', operation.pointer)
    parent[key] = structuredClone(after)
  }
  for (const operation of proposal.operations) apply(operation)
  for (const operation of correction.operations) apply(operation)
  for (const sourcePath of paths) check(eq(replay.get(sourcePath), current.get(sourcePath)),
    'E_REVIEW_HASH', '/applied/core-four/forward', sourcePath)
  for (const operation of [...correction.operations].reverse()) apply(operation, true)
  for (const operation of [...proposal.operations].reverse()) apply(operation, true)
  for (const sourcePath of paths) check(eq(replay.get(sourcePath), originals.get(sourcePath)),
    'E_REVIEW_HASH', '/applied/core-four/restore', sourcePath)
}
async function validateAtlasV5Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = ATLAS_V5_SOURCE
  const sourcePath = 'lore/World-Narrative-Atlas.json'
  const owner = '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md'
  const bindings = {
    proposal: { path: b.proposalDirectory + 'proposal.json', sha256: b.proposalSha256 },
    correctionV4: { path: b.proposalDirectory + 'correction-v4.json', sha256: b.correctionV4Sha256 },
    correctionV5: { path: b.proposalDirectory + 'correction-v5.json', sha256: b.correctionV5Sha256 },
    independent: { path: b.proposalDirectory + 'independent-v5.json', sha256: b.independentSha256 },
    owner: { path: owner, sha256: b.ownerSha256 },
    beforeArchive: { path: b.directory + 'before-raw.json', sha256: b.archiveSha256 },
  }
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 78 && sha256(prefixBytes) === b.prefixSha256
    && batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && batch.operationCount === 1365
    && eq(batch.personIds, []) && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(batch.applicationReview, { evidencePath: bindings.independent.path, evidenceSha256: b.independentSha256 })
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: b.ownerSha256, messageRef: owner }]),
  'E_APPROVAL_BATCH', '/applied/atlas-v5')
  const packet = JSON.parse(packetBytes)
  const source = { sourcePath, beforeSha256: b.beforeSha256, afterSha256: b.afterSha256,
    beforeBytes: 4394412, afterBytes: 4390138, changed: true, sealed: false }
  check(packet.schema === 'seoul-atlas-v5-reviewed-source-application.v1' && packet.batchId === b.id
    && eq(packet.registryPrefix, { count: 78, sha256: b.prefixSha256 })
    && Object.entries(bindings).every(([key, value]) => eq(packet[key], value))
    && eq(packet.sources, [source]) && eq(packet.operations, { base: 1351, correctionV4: 12, correctionV5: 2 })
    && packet.scope === 'private-source-only; no census products, public files, scope activation or publication'
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [source] }),
  'E_APPROVAL_BATCH', '/applied/atlas-v5/packet')
  const bound = {}
  for (const [key, binding] of Object.entries(bindings)) {
    const bytes = await readBytes(resolve(root, binding.path))
    check(sha256(bytes) === binding.sha256, 'E_REVIEW_HASH', '/applied/atlas-v5/binding', binding.path)
    if (key !== 'owner') bound[key] = JSON.parse(bytes)
  }
  const { proposal, correctionV4, correctionV5, independent, beforeArchive } = bound
  check(proposal.source.path === sourcePath && proposal.source.sha256 === b.beforeSha256
    && proposal.operations.length === 1351 && proposal.inverse.operations.length === 1351
    && correctionV4.operations.length === 12 && correctionV5.operations.length === 2
    && correctionV4.base.sha256 === b.proposalSha256
    && correctionV5.baseCompositeSha256 === independent.hashes.v4Composite
    && independent.verdict === 'PASS_BOUNDED_COMPOSITE_REVIEW' && independent.reviewComplete === true
    && independent.applicationApproved === false && independent.publicationApproved === false
    && eq(independent.findings, [])
    && independent.hashes.baseProposal === b.proposalSha256
    && independent.hashes.v4Correction === b.correctionV4Sha256
    && independent.hashes.v5Correction === b.correctionV5Sha256
    && independent.hashes.v5Composite === b.afterSha256
    && independent.scope.allPrior695ObjectsExactToV4 === true
    && independent.protected.historicalReceipts === 62
    && independent.protected.unchangedHistoricalValues === 46
    && independent.protected.explicitSuccessors === 16,
  'E_REVIEW_COVERAGE', '/applied/atlas-v5/review')
  const before = gunzipSync(Buffer.from(beforeArchive.gzipBase64, 'base64'))
  const after = await historicalSourceBytes(sourcePath, b.afterSha256, readBytes, root)
  check(beforeArchive.schema === 'seoul-atlas-v5-original-raw-archive.v1'
    && beforeArchive.sourcePath === sourcePath && beforeArchive.rawSha256 === b.beforeSha256
    && beforeArchive.rawBytes === before.length && before.length === source.beforeBytes
    && sha256(before) === b.beforeSha256 && after.length === source.afterBytes
    && sha256(after) === b.afterSha256,
  'E_ARCHIVE_HASH', '/applied/atlas-v5/source')
  const original = JSON.parse(before); const replay = structuredClone(original)
  const hashValue = value => sha256(JSON.stringify(value))
  const apply = (operation, reverse = false) => {
    const path = operation.pointer
    check(operation.op === undefined || operation.op === 'replace', 'E_REVIEW_HASH', '/applied/atlas-v5/op', path)
    const parent = pointer(replay, path.slice(0, path.lastIndexOf('/')))
    const key = path.split('/').at(-1).replace(/~1/g, '/').replace(/~0/g, '~')
    check(parent && Object.hasOwn(parent, key) && eq(parent[key], reverse ? operation.after : operation.before)
      && (!operation.beforeSha256 || hashValue(operation.before) === operation.beforeSha256)
      && (!operation.afterSha256 || hashValue(operation.after) === operation.afterSha256),
    'E_REVIEW_HASH', '/applied/atlas-v5/op', path)
    parent[key] = structuredClone(reverse ? operation.before : operation.after)
  }
  for (const op of proposal.operations) apply(op)
  check(sha256(JSON.stringify(replay, null, 2) + '\n') === proposal.candidate.sha256
    && proposal.candidate.sha256 === independent.hashes.v3Candidate, 'E_REVIEW_HASH', '/applied/atlas-v5/v3')
  for (const op of correctionV4.operations) apply(op)
  check(sha256(JSON.stringify(replay, null, 2) + '\n') === independent.hashes.v4Composite,
    'E_REVIEW_HASH', '/applied/atlas-v5/v4')
  for (const op of correctionV5.operations) apply(op)
  check(Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after), 'E_REVIEW_HASH', '/applied/atlas-v5/forward')
  for (const op of [...correctionV5.operations].reverse()) apply(op, true)
  for (const op of [...correctionV4.operations].reverse()) apply(op, true)
  for (const op of proposal.inverse.operations) {
    const parent = pointer(replay, op.path.slice(0, op.path.lastIndexOf('/')))
    const key = op.path.split('/').at(-1).replace(/~1/g, '/').replace(/~0/g, '~')
    check(op.op === 'replace' && eq(parent[key], op.test), 'E_REVIEW_HASH', '/applied/atlas-v5/inverse', op.path)
    parent[key] = structuredClone(op.value)
  }
  check(eq(replay, original), 'E_REVIEW_HASH', '/applied/atlas-v5/restore')
  const applied = JSON.parse(after)
  for (const item of independent.protected.values) {
    const actual = pointer(applied, item.pointer)
    check(typeof actual === 'string' && sha256(actual) === item.candidateHash
      && (item.unchangedHistorical ? eq(actual, item.historicalValue) : !eq(actual, item.historicalValue)),
    'E_REVIEW_HASH', '/applied/atlas-v5/historical', item.operationId)
  }
}
async function rendererFromArchive(bytes, schemaBytes) {
  const schemaUrl = 'data:text/javascript;base64,' + Buffer.from(schemaBytes).toString('base64')
  const executable = bytes.toString().replace("'./world-atlas-schema.mjs'", JSON.stringify(schemaUrl))
  return import('data:text/javascript;base64,' + Buffer.from(executable).toString('base64'))
}

async function validateRendererHeadingSuccessor(registry, readBytes, root) {
  const b = RENDERER_HEADING_SUCCESSOR
  const matches = registry.batches.filter(batch => batch.approvalModel === b.id || batch.batchId === b.id)
  if (!matches.length) return null
  const batch = matches[0]
  const prefix = { schema: registry.schema, visibility: registry.visibility, batches: registry.batches.slice(0, 83) }
  const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
  check(matches.length === 1 && registry.batches[83] === batch && sha256(prefixBytes) === b.prefixSha256,
    'E_APPROVAL_BATCH', '/applied/renderer-heading/prefix')
  const packetBytes = await readBytes(resolve(root, b.directory + 'application-packet.json'))
  const manifestBytes = await readBytes(resolve(root, b.directory + 'source-before-after.json'))
  check(sha256(packetBytes) === b.packetSha256 && sha256(manifestBytes) === b.manifestSha256,
    'E_REVIEW_HASH', '/applied/renderer-heading/packet')
  const packet = JSON.parse(packetBytes), manifest = JSON.parse(manifestBytes)
  const comparisonPin = packet.authority.comparison, owner = packet.authority.owner
  check(eq(batch, {
    batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
    packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 1,
    sourceBeforeAfterPath: b.directory + 'source-before-after.json',
    applicationReview: { evidencePath: comparisonPin.path, evidenceSha256: b.comparisonSha256 },
    approvals: [{ kind: b.id, bodySha256: b.comparisonSha256, messageRef: owner.path, authorizationSha256: owner.sha256 }],
  }) && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [packet.source] }),
  'E_APPROVAL_BATCH', '/applied/renderer-heading')
  const bound = new Map()
  for (const pin of [packet.registryPrefix.archive, ...Object.values(packet.authority),
    ...Object.values(packet.inputs), ...Object.values(packet.archives)]) {
    const bytes = Buffer.from(await readBytes(resolve(root, pin.path)))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/renderer-heading/binding', pin.path)
    bound.set(pin.path, bytes)
  }
  check(bound.get(packet.registryPrefix.archive.path).equals(prefixBytes),
    'E_ARCHIVE_HASH', '/applied/renderer-heading/prefix-archive')
  const code = Object.fromEntries(Object.entries(packet.archives).map(([key, pin]) => {
    const archive = JSON.parse(bound.get(pin.path))
    const bytes = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
    check(archive.schema === 'seoul-renderer-code-archive.v1' && archive.sourcePath === packet.source.sourcePath
      && archive.rawBytes === bytes.length && archive.rawSha256 === sha256(bytes)
      && bytes.length === packet.source[key === 'before' ? 'beforeBytes' : 'afterBytes']
      && sha256(bytes) === b[key === 'before' ? 'beforeSha256' : 'afterSha256'],
    'E_ARCHIVE_HASH', '/applied/renderer-heading/archive', key)
    return [key, bytes]
  }))
  check(code.after.equals(Buffer.from(await readBytes(resolve(root, packet.source.sourcePath)))),
    'E_REVIEW_HASH', '/applied/renderer-heading/live')
  const schemaBytes = bound.get(packet.inputs.rendererSchema.path)
  const historical = await rendererFromArchive(code.before, schemaBytes)
  const successor = await rendererFromArchive(code.after, schemaBytes)
  const source = JSON.parse(bound.get(packet.inputs.atlas.path))
  const sourceHash = packet.inputs.atlas.sha256
  const before = historical.projectionsFromAtlas(source, sourceHash)
  const after = successor.projectionsFromAtlas(source, sourceHash)
  const expected = structuredClone(before)
  const changes = []
  const page = 'Synthetic-Actors.json'
  for (const actor of source.data.atlas.synthetics) {
    const suffix = ` (${actor.callsign.en})`
    if (!actor.display_name.en.endsWith(suffix)) continue
    const index = expected[page].content.findIndex(node => node.anchor === `Synthetic-Actors-generated-${actor.id}-title-heading-1`)
    const block = expected[page].content[index]
    check(block?.kind === 'heading' && block.depth === 2
      && block.text.en === `${actor.id} · ${actor.display_name.en}${suffix}`,
    'E_REVIEW_HASH', '/applied/renderer-heading/title', actor.id)
    const beforeText = structuredClone(block.text)
    block.text.en = `${actor.id} · ${actor.display_name.en}`
    changes.push({ path: page, index, anchor: block.anchor, before: beforeText, after: structuredClone(block.text) })
  }
  const pages = Object.entries(before).map(([path, envelope]) => ({ path, blocks: envelope.content.length,
    beforeSha256: sha256(JSON.stringify(envelope)), afterSha256: sha256(JSON.stringify(after[path])) }))
  const comparison = { schema: 'seoul-renderer-heading-comparison.v1', sourceSha256: sourceHash,
    beforeRendererSha256: b.beforeSha256, afterRendererSha256: b.afterSha256,
    pageCount: pages.length, blockCount: pages.reduce((sum, page) => sum + page.blocks, 0),
    changedBlockCount: changes.length, pages, changes }
  check(eq(after, expected) && comparison.pageCount === 33 && comparison.blockCount === 6224 && changes.length === 47
    && eq(JSON.parse(bound.get(comparisonPin.path)), comparison),
  'E_REVIEW_COVERAGE', '/applied/renderer-heading/projection')
  return { bytes: code.before, projectionsFromAtlas: historical.projectionsFromAtlas }
}

async function validateAtlas82Source(batch, packetBytes, manifest, readBytes, root, prefix, historicalRenderer) {
  const b = ATLAS82_SOURCE
  const sourcePath = 'lore/World-Narrative-Atlas.json'
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const packet = JSON.parse(packetBytes)
  const row = { sourcePath, beforeSha256: b.beforeSha256, afterSha256: b.afterSha256,
    beforeBytes: 4390138, afterBytes: 4393879, changed: true, sealed: false }
  const bindings = {
    inputPins: { path: b.directory + 'input-pins.json', sha256: b.inputSha256 },
    beforeArchive: { path: b.directory + 'before-raw.json', sha256: b.archiveSha256 },
    review: { path: '.omo/private/seoul-migration/atlas79-group-minimal-corrections-v2-20261016/independent-v5.json', sha256: b.reviewSha256 },
    composite: { path: '.omo/private/seoul-migration/atlas79-group-minimal-corrections-v2-20261016/final-composite-bindings-v5.json', sha256: b.compositeSha256 },
    owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: ATLAS_V5_SOURCE.ownerSha256 },
    renderer: { path: 'scripts/world-atlas-render.mjs', sha256: 'ba0b7ca01576059d0943269d4a32ab8b97851e65c60a6c9a91acfec76e9bd8ee' },
  }
  check(prefix.length === 81 && sha256(prefixBytes) === b.prefixSha256
    && prefix[78].batchId === ATLAS_V5_SOURCE.id
    && batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && sha256(packetBytes) === b.packetSha256
    && batch.operationCount === 406 && eq(batch.personIds, [])
    && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(batch.applicationReview, { evidencePath: bindings.review.path, evidenceSha256: b.reviewSha256 })
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: bindings.owner.sha256,
      messageRef: bindings.owner.path }])
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [row] }),
  'E_APPROVAL_BATCH', '/applied/atlas82')
  const input = JSON.parse(await readBytes(resolve(root, bindings.inputPins.path)))
  const review = JSON.parse(await readBytes(resolve(root, bindings.review.path)))
  const composite = JSON.parse(await readBytes(resolve(root, bindings.composite.path)))
  const archive = JSON.parse(await readBytes(resolve(root, bindings.beforeArchive.path)))
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const current = await readBytes(resolve(root, sourcePath))
  const successorBytes = sha256(current) === ATLAS83_SOURCE.afterSha256
    ? await readBytes(resolve(root, ATLAS83_SOURCE.directory + 'before-raw.json')) : null
  if (successorBytes) check(sha256(successorBytes) === ATLAS83_SOURCE.archiveSha256,
    'E_ARCHIVE_HASH', '/applied/atlas82/successor')
  const successor = successorBytes ? JSON.parse(successorBytes) : null
  const after = successor ? gunzipSync(Buffer.from(successor.gzipBase64, 'base64')) : current
  const layerNames = ['proposal.json', 'correction-v3.json', 'correction-v4.json',
    'index-confirmed-typos-v1.json', 'index-g25-g26-correction-v1.json',
    'index-subject-tense-correction-v1.json', 'index-remainder-correction-v1.json',
    'index-context-binding-v1.json']
  const layers = layerNames.map(name => ({ path: bindings.review.path.replace('independent-v5.json', name),
    sha256: review.pins.layers[name] }))
  const operations = Object.fromEntries(layerNames.map(name => [name, composite.replay.operationCounts[name]]))
  check(Object.entries(bindings).every(([key, binding]) => eq(packet[key], binding))
    && eq(packet.layers, layers) && eq(packet.operations, operations)
    && packet.schema === 'seoul-atlas82-groups-index-source-application.v1'
    && packet.batchId === b.id && eq(packet.registryPrefix, { count: 81, sha256: b.prefixSha256 })
    && eq(packet.sources, [row])
    && packet.scope === 'private-source-only; no census products, public files, scope activation or publication'
    && eq(input, { schema: 'seoul-atlas82-input-pins.v1', registryPrefix: packet.registryPrefix,
      source: { path: sourcePath, sha256: b.beforeSha256, bytes: row.beforeBytes },
      renderer: bindings.renderer, review: bindings.review, composite: bindings.composite,
      layers, owner: bindings.owner })
    && archive.schema === 'seoul-atlas82-original-raw-archive.v1'
    && archive.sourcePath === sourcePath && archive.rawSha256 === b.beforeSha256
    && archive.rawBytes === before.length && before.length === row.beforeBytes
    && sha256(before) === b.beforeSha256
    && (!successor || (successor.sourcePath === sourcePath && successor.rawSha256 === b.afterSha256
      && successor.rawBytes === after.length)) && after.length === row.afterBytes
    && sha256(after) === b.afterSha256,
  'E_REVIEW_HASH', '/applied/atlas82/packet')
  for (const binding of [...Object.values(bindings), ...layers])
    check(sha256(await readBytes(resolve(root, binding.path))) === binding.sha256,
      'E_REVIEW_HASH', '/applied/atlas82/binding', binding.path)
  check(review.schema === 'atlas79-independent-v5' && review.verdict === 'PASS_BOUNDED_PRIVATE_COMPOSITE'
    && review.applicationApproved === false && review.publicationApproved === false
    && review.pins.sourceRawSha256 === b.beforeSha256
    && review.pins.rendererRawSha256 === bindings.renderer.sha256
    && review.compositeBindingsRawSha256 === b.compositeSha256
    && review.finalSourceRawSha256 === b.afterSha256
    && eq(review.residualFindings, [])
    && composite.replay.totalOperations === 406 && composite.replay.inverseWholeJsonExact === true
    && composite.replay.finalRawSha256 === b.afterSha256
    && composite.replay.finalRawByteLength === row.afterBytes
    && composite.coverage.wholeObjectCount === 265 && composite.coverage.groupPages === 26
    && composite.coverage.hostileIndexBlocks === 1002 && composite.indexFindingResolutions.length === 33
    && composite.pages.length === 26 && composite.objects.length === 265
    && composite.indexPage.changedBlocks.length === 75
    && Object.values(operations).reduce((sum, count) => sum + count, 0) === 406,
  'E_REVIEW_COVERAGE', '/applied/atlas82/review')
  const original = JSON.parse(before), replay = structuredClone(original)
  const hashValue = value => sha256(JSON.stringify(value))
  const apply = (operation, reverse = false) => {
    const path = operation.pointer
    const parent = pointer(replay, path.slice(0, path.lastIndexOf('/')))
    const key = path.split('/').at(-1).replace(/~1/g, '/').replace(/~0/g, '~')
    check(path.startsWith('/data/atlas/') && parent && Object.hasOwn(parent, key)
      && hashValue(parent[key]) === hashValue(reverse ? operation.after : operation.before)
      && hashValue(operation.before) === operation.beforeSha256
      && hashValue(operation.after) === operation.afterSha256
      && (!operation.inverse || (operation.inverse.pointer === path
        && hashValue(operation.inverse.before) === operation.afterSha256
        && hashValue(operation.inverse.after) === operation.beforeSha256)),
    'E_REVIEW_HASH', '/applied/atlas82/operation', path)
    parent[key] = structuredClone(reverse ? operation.before : operation.after)
  }
  const layerOperations = []
  for (const layer of layers) {
    const document = JSON.parse(await readBytes(resolve(root, layer.path)))
    check(document.operations.length === operations[layer.path.split('/').at(-1)],
      'E_REVIEW_COVERAGE', '/applied/atlas82/layer', layer.path)
    for (const operation of document.operations) apply(operation)
    layerOperations.push(document.operations)
  }
  check(Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after)
    && hashValue(original) === composite.replay.originalJsonSha256
    && hashValue(replay) === composite.replay.finalJsonSha256,
  'E_REVIEW_HASH', '/applied/atlas82/forward')
  for (const layer of layerOperations.reverse()) for (const operation of [...layer].reverse()) apply(operation, true)
  check(eq(replay, original), 'E_REVIEW_HASH', '/applied/atlas82/inverse')
  const final = JSON.parse(after)
  for (const item of composite.objects) check(hashValue(pointer(original, item.pointer)) === item.beforeSha256
    && hashValue(pointer(final, item.pointer)) === item.finalSha256,
  'E_REVIEW_HASH', '/applied/atlas82/object', item.pointer)
  const { projectionsFromAtlas } = historicalRenderer ?? await import('./world-atlas-render.mjs')
  const priorPages = projectionsFromAtlas(original, b.beforeSha256)
  const finalPages = projectionsFromAtlas(final, b.beforeSha256)
  for (const item of [...composite.pages, composite.indexPage]) {
    const prior = priorPages[item.page], current = finalPages[item.page]
    check(prior && current && prior.content.length === item.originalBlocks
      && current.content.length === item.finalBlocks
      && hashValue(prior.content) === item.beforeBodySha256
      && hashValue(current.content) === item.finalBodySha256
      && hashValue(prior) === item.beforeFullEnvelopeSha256
      && hashValue(current) === item.finalFullEnvelopeSha256
      && prior.content.every((block, index) => block.anchor === current.content[index].anchor
        && eq(block.publicAnchors ?? [], current.content[index].publicAnchors ?? [])),
    'E_REVIEW_HASH', '/applied/atlas82/page', item.page)
  }
  for (const block of composite.indexPage.changedBlocks)
    check(finalPages[composite.indexPage.page].content[block.index].anchor === block.anchor
      && hashValue(finalPages[composite.indexPage.page].content[block.index]) === block.finalSha256,
    'E_REVIEW_HASH', '/applied/atlas82/index', block.anchor)
  const ids = composite.indexFindingResolutions.map(item => item.id)
  check(new Set(ids).size === 33 && ids.every((id, i) => id === `IX${String(i + 1).padStart(3, '0')}`)
    && ['G22', 'G23'].every(group => composite.protected[group].beforeFullEnvelopeSha256
      === composite.protected[group].finalFullEnvelopeSha256),
  'E_REVIEW_COVERAGE', '/applied/atlas82/index-findings')
}
async function validateAtlas83Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = ATLAS83_SOURCE
  const path = 'lore/World-Narrative-Atlas.json'
  const directory = '.omo/private/seoul-migration/'
  const row = { sourcePath: path, beforeSha256: b.beforeSha256, afterSha256: b.afterSha256,
    beforeBytes: 4393879, afterBytes: 4480225, changed: true, sealed: false }
  const pins = {
    proposal: { path: directory + 'atlas79-complete-publication-review-20261016/four-track-composite-proposal.json', sha256: '3b3036465e1d7d8afd9b25332c2521f882e36bde516c663cc5f1a697bb695a99' },
    independent: { path: directory + 'atlas83-four-track-composite-independent-20261016/review.json', sha256: '1a118dd2250f5cbff30d98bfb7dfb223cc9523023bb740ef431bd8589319619f' },
    bindings: { path: directory + 'atlas83-four-track-composite-independent-20261016/bindings.json', sha256: 'e5d0742f761abfaee75a7066020d8c460977b56d3ca6a9bf41b2a97d2c94123b' },
    owner: { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75' },
    renderer: { path: 'scripts/world-atlas-render.mjs', sha256: 'ba0b7ca01576059d0943269d4a32ab8b97851e65c60a6c9a91acfec76e9bd8ee' },
    atlasSchema: { path: 'lore/authoring.atlas.schema.json', sha256: 'b9b5e4a235fb8b00f91a9359db51dc1b2deb7665f3085577229932824f8769f8' },
  }
  const packet = JSON.parse(packetBytes)
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 82 && sha256(prefixBytes) === b.prefixSha256
    && prefix[81].batchId === ATLAS82_SOURCE.id,
  'E_APPROVAL_BATCH', '/applied/atlas83/prefix')
  check(batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && sha256(packetBytes) === b.packetSha256
    && batch.operationCount === 334 && eq(batch.personIds, [])
    && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(batch.applicationReview, { evidencePath: pins.independent.path, evidenceSha256: pins.independent.sha256 })
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: pins.owner.sha256, messageRef: pins.owner.path }])
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [row] }),
  'E_APPROVAL_BATCH', '/applied/atlas83')
  const inputPins = { path: b.directory + 'input-pins.json', sha256: b.inputSha256 }
  const beforeArchive = { path: b.directory + 'before-raw.json', sha256: b.archiveSha256 }
  check(eq(packet, { schema: 'seoul-atlas83-four-track-source-application.v1', batchId: b.id,
    registryPrefix: { count: 82, sha256: b.prefixSha256 }, inputPins, beforeArchive, ...pins,
    sources: [row], operations: { replacements: 330, relationRemovals: 4 },
    scope: 'private-source-only; no renderer, census products, public files or publication' }),
  'E_APPROVAL_BATCH', '/applied/atlas83/packet')
  for (const pin of [inputPins, beforeArchive, ...Object.values(pins)])
    check(sha256(await readBytes(resolve(root, pin.path))) === pin.sha256,
      'E_REVIEW_HASH', '/applied/atlas83/input', pin.path)
  const input = JSON.parse(await readBytes(resolve(root, inputPins.path)))
  const archive = JSON.parse(await readBytes(resolve(root, beforeArchive.path)))
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, path))
  check(eq(input, { schema: 'seoul-atlas83-input-pins.v1', registryPrefix: packet.registryPrefix,
    source: { path, sha256: b.beforeSha256, bytes: row.beforeBytes },
    inputs: [pins.proposal, pins.independent, pins.bindings, pins.owner, pins.renderer, pins.atlasSchema]
      .map((pin, index) => ({ ...pin,
        bytes: [885334, 2264, 9218, 1740, 136809, 48850][index] })) })
    && archive.schema === 'seoul-atlas83-original-raw-archive.v1'
    && archive.sourcePath === path && archive.rawSha256 === b.beforeSha256
    && archive.rawBytes === row.beforeBytes && before.length === row.beforeBytes
    && sha256(before) === b.beforeSha256 && after.length === row.afterBytes
    && sha256(after) === b.afterSha256,
  'E_REVIEW_HASH', '/applied/atlas83/archive')
  const proposal = JSON.parse(await readBytes(resolve(root, pins.proposal.path)))
  const independent = JSON.parse(await readBytes(resolve(root, pins.independent.path)))
  const bindings = JSON.parse(await readBytes(resolve(root, pins.bindings.path)))
  check(proposal.schema === 'seoul.atlas83-four-track-composite.v1'
    && proposal.source.sha256 === b.beforeSha256 && proposal.afterSha256 === b.afterSha256
    && proposal.operations.length === 330 && proposal.relationRemovals.length === 4
    && independent.verdict === 'PASS_STRUCTURAL_AND_TRACK_BINDING_NOT_PUBLICATION_APPROVAL'
    && independent.sourceSha256 === b.beforeSha256 && independent.compositeSha256 === b.afterSha256
    && independent.checks.projectionPages === 33 && independent.checks.projectionBlocks === 6224
    && independent.checks.changedProjectionBlocks === 394
    && bindings.proposal.rawSha256 === pins.proposal.sha256
    && bindings.proposal.afterRawSha256 === b.afterSha256
    && bindings.proposal.replacements === 330 && bindings.proposal.archivedRelationRemovals.length === 4
    && bindings.proposal.h04.originalRow === 24 && bindings.proposal.h04.afterKind === 'historically_custodied_by'
    && bindings.independentTrackReceipts.length === 4,
  'E_REVIEW_COVERAGE', '/applied/atlas83/review')
  const original = JSON.parse(before), replay = structuredClone(original)
  const hashValue = value => sha256(JSON.stringify(value))
  const locate = path => {
    const segments = path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = segments.pop()
    return [segments.reduce((parent, segment) => parent?.[segment], replay), key]
  }
  const seen = new Set()
  for (const op of proposal.operations) {
    const [parent, key] = locate(op.pointer)
    check(op.pointer.startsWith('/data/atlas/') || op.pointer.startsWith('/locales/'),
      'E_REVIEW_HASH', '/applied/atlas83/pointer', op.pointer)
    check(!seen.has(op.pointer) && parent && Object.hasOwn(parent, key)
      && hashValue(parent[key]) === op.beforeSha256
      && hashValue(op.before) === op.beforeSha256 && hashValue(op.after) === op.afterSha256,
    'E_REVIEW_HASH', '/applied/atlas83/operation', op.pointer)
    seen.add(op.pointer)
    parent[key] = structuredClone(op.after)
  }
  const relations = replay.data.atlas.relations
  check(relations.length === 43 && proposal.relationRemovals.every((removal, i) =>
    removal.index === [20, 19, 17, 16][i] && hashValue(removal.value) === removal.sha256
    && hashValue(relations[removal.index]) === removal.sha256),
  'E_REVIEW_HASH', '/applied/atlas83/relations')
  for (const removal of proposal.relationRemovals) relations.splice(removal.index, 1)
  check(relations.length === 39 && relations.some(relation => relation.from === 'H04'
    && relation.to === 'K086' && relation.kind === 'historically_custodied_by')
    && Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after),
  'E_REVIEW_HASH', '/applied/atlas83/forward')
  for (const removal of [...proposal.relationRemovals].reverse()) relations.splice(removal.index, 0, removal.value)
  for (const op of [...proposal.operations].reverse()) {
    const [parent, key] = locate(op.pointer)
    check(hashValue(parent[key]) === op.afterSha256, 'E_REVIEW_HASH', '/applied/atlas83/inverse', op.pointer)
    parent[key] = structuredClone(op.before)
  }
  check(eq(replay, original), 'E_REVIEW_HASH', '/applied/atlas83/original')
}
async function validateS02ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S02_REVIEWED_SOURCE
  const owner = '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md'
  const bindings = {
    proposal: { path: b.candidateDirectory + 'proposal-v4.json', sha256: b.proposalSha256 },
    overlay: { path: b.candidateDirectory + 'correction-v5.json', sha256: b.overlaySha256 },
    independent: { path: b.candidateDirectory + 'independent-v5.json', sha256: b.independentSha256 },
    finalBindings: { path: b.candidateDirectory + 'final-full-card-bindings-v5.json', sha256: b.finalBindingsSha256 },
    owner: { path: owner, sha256: b.ownerSha256 },
    beforeArchive: { path: b.directory + 'before-raw.json', sha256: b.archiveSha256 },
  }
  const registryPrefix = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 79 && sha256(registryPrefix) === b.prefixSha256
    && batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && batch.operationCount === 577
    && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(batch.applicationReview, { evidencePath: bindings.independent.path, evidenceSha256: b.independentSha256 })
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: b.ownerSha256, messageRef: owner }]),
  'E_APPROVAL_BATCH', '/applied/s02')
  const packet = JSON.parse(packetBytes)
  check(packet.schema === 'seoul-s02-reviewed-source-application.v1' && packet.batchId === b.id
    && eq(packet.registryPrefix, { count: 79, sha256: b.prefixSha256 })
    && Object.entries(bindings).every(([key, binding]) => eq(packet[key], binding))
    && eq(packet.sources, manifest.sources) && eq(packet.operations, { base: 574, overlay: 3 })
    && packet.scope === 'private-source-only; no census products, public files, scope activation or publication'
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: packet.sources }),
  'E_APPROVAL_BATCH', '/applied/s02/packet')
  const bound = {}
  for (const [key, binding] of Object.entries(bindings)) {
    const bytes = await readBytes(resolve(root, binding.path))
    check(sha256(bytes) === binding.sha256, 'E_REVIEW_HASH', '/applied/s02/binding', binding.path)
    if (key !== 'owner') bound[key] = JSON.parse(bytes)
  }
  const { proposal, overlay, independent, finalBindings, beforeArchive } = bound
  const paths = [proposal.sourcePaths.cast, proposal.sourcePaths.corridors]
  check(proposal.operations.length === 574 && proposal.inverseOperations.length === 574
    && overlay.operations.length === 3 && overlay.baseProposalSha256 === b.proposalSha256
    && independent.status.startsWith('PASS - bounded private composite')
    && eq(independent.residualFindings, [])
    && eq(independent.candidate, {
      basePath: 'proposal-v4.json', baseSha256: b.proposalSha256,
      overlayPath: 'correction-v5.json', overlaySha256: b.overlaySha256,
      finalBindingsPath: 'final-full-card-bindings-v5.json', finalBindingsSha256: b.finalBindingsSha256,
    })
    && independent.coverage.compositeForwardPreimages === 577
    && independent.coverage.compositeInverseOperations === 577
    && independent.coverage.wholeSourceJsonRoundTrips === 7
    && independent.coverage.finalBilingualExpansions === 130
    && independent.coverage.finalWorkReferences === 67
    && independent.coverage.unchangedRelationRowsReusedFromV4 === 112
    && independent.coverage.relationMembershipReusedFromV4 === 171
    && eq(finalBindings.sourceRawHashes, proposal.sourceRawHashes)
    && finalBindings.hashContract === proposal.hashContract
    && finalBindings.persons.length === 65 && finalBindings.locationRefs.length === 67
    && proposal.connectedRelations.length === 112 && eq(batch.personIds, proposal.persons.map(person => person.id))
    && beforeArchive.schema === 'seoul-s02-original-raw-archive.v1'
    && beforeArchive.sources.length === paths.length && manifest.sources.length === paths.length,
  'E_REVIEW_COVERAGE', '/applied/s02/review')
  const hashValue = value => sha256(JSON.stringify(value))
  const replay = new Map(); const original = new Map(); const current = new Map()
  for (const [index, path] of paths.entries()) {
    const row = manifest.sources[index], archive = beforeArchive.sources[index]
    const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
    const after = await readBytes(resolve(root, path))
    check(archive.sourcePath === path && archive.rawSha256 === proposal.sourceRawHashes[path]
      && archive.rawBytes === before.length && sha256(before) === archive.rawSha256
      && eq(row, { sourcePath: path, beforeSha256: archive.rawSha256, afterSha256: sha256(after),
        beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
      && after.equals(Buffer.from(JSON.stringify(JSON.parse(after), null, 2) + '\n'))
      && hashValue(JSON.parse(after)) === finalBindings.finalSourceAfterJsonSha256[path],
    'E_ARCHIVE_HASH', '/applied/s02/source', path)
    original.set(path, JSON.parse(before)); replay.set(path, JSON.parse(before)); current.set(path, JSON.parse(after))
  }
  for (const [path, digest] of Object.entries(proposal.sourceRawHashes)) {
    if (original.has(path)) continue
    const bytes = await readBytes(resolve(root, path))
    check(sha256(bytes) === digest && hashValue(JSON.parse(bytes)) === finalBindings.finalSourceAfterJsonSha256[path],
      'E_REVIEW_HASH', '/applied/s02/unchanged', path)
    original.set(path, JSON.parse(bytes)); replay.set(path, JSON.parse(bytes)); current.set(path, JSON.parse(bytes))
  }
  check(original.size === 7 && Object.keys(finalBindings.finalSourceAfterJsonSha256).length === 7,
    'E_REVIEW_COVERAGE', '/applied/s02/pins')
  const apply = operation => {
    const document = replay.get(operation.path)
    check(document && operation.pointer.startsWith('/content/'), 'E_REVIEW_HASH', '/applied/s02/pointer', operation.pointer)
    const parts = operation.pointer.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const parent = parts.slice(0, -1).reduce((value, key) => value?.[key], document)
    const key = parts.at(-1)
    check(parent && Object.hasOwn(parent, key) && eq(parent[key], operation.before)
      && hashValue(operation.before) === operation.beforeValueSha256
      && hashValue(operation.after) === operation.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s02/operation', operation.pointer)
    parent[key] = structuredClone(operation.after)
  }
  for (const operation of proposal.operations) apply(operation)
  for (const operation of overlay.operations) apply(operation)
  for (const [path, document] of replay)
    check(eq(document, current.get(path)) && hashValue(document) === finalBindings.finalSourceAfterJsonSha256[path],
      'E_REVIEW_HASH', '/applied/s02/forward', path)
  const final = new Map([...replay].map(([path, value]) => [path, structuredClone(value)]))
  for (const operation of [...overlay.operations].reverse()) apply({ ...operation,
    before: operation.after, after: operation.before,
    beforeValueSha256: operation.afterValueSha256, afterValueSha256: operation.beforeValueSha256 })
  for (const operation of proposal.inverseOperations) apply(operation)
  for (const [path, document] of replay)
    check(eq(document, original.get(path)), 'E_REVIEW_HASH', '/applied/s02/inverse', path)
  const expand = (value, locale) => {
    if (Array.isArray(value)) return value.map(item => expand(item, locale))
    if (value && typeof value === 'object') {
      if (Object.hasOwn(value, 'ko') && Object.hasOwn(value, 'en')) return expand(value[locale], locale)
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, expand(child, locale)]))
    }
    return value
  }
  for (const person of finalBindings.persons) {
    const before = original.get(person.path), after = final.get(person.path)
    const start = Number(person.headingPointer.split('/').at(-1))
    const end = Number(person.endExclusivePointer.split('/').at(-1))
    check(person.path === paths[0] || person.path === paths[1], 'E_REVIEW_COVERAGE', '/applied/s02/card', person.id)
    check(before.content[start]?.anchor === person.anchor && after.content[start]?.anchor === person.anchor
      && hashValue(before.content.slice(start, end)) === person.sourceBeforeFullCardSha256
      && hashValue(after.content.slice(start, end)) === person.finalAfterFullCardSha256,
    'E_REVIEW_HASH', '/applied/s02/card', person.id)
    for (const locale of ['ko', 'en']) check(eq(expand(after.content.slice(start + 1, end), locale), person.card[locale]),
      'E_REVIEW_HASH', '/applied/s02/full-body', person.id)
  }
  for (const ref of finalBindings.locationRefs) {
    const operation = proposal.operations.find(op => op.path === ref.path && op.pointer === ref.pointer)
    check(operation?.personId === ref.personId && hashValue(operation.before) === ref.currentBeforeValueSha256
      && hashValue(pointer(final.get(ref.path), ref.pointer)) === ref.finalValueSha256,
    'E_REVIEW_HASH', '/applied/s02/work', ref.personId)
  }
  for (const relation of proposal.connectedRelations)
    check(hashValue(pointer(final.get(proposal.sourcePaths.relations), relation.pointer)) === relation.beforeValueSha256
      && relation.beforeValueSha256 === relation.afterValueSha256 && eq(relation.before, relation.after),
    'E_REVIEW_HASH', '/applied/s02/relation', relation.pointer)
  check(proposal.connectedRelations.reduce((sum, relation) => sum + relation.personIds.length, 0) === 171
    && proposal.scope.peopleWithStalePacketValues === 38 && proposal.scope.staleLocationReferences === 39,
  'E_REVIEW_COVERAGE', '/applied/s02/coverage')
}
async function validateS03ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S03_REVIEWED_SOURCE
  const owner = '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md'
  const bindings = {
    proposal: { path: b.candidateDirectory + 'proposal.json', sha256: b.proposalSha256 },
    overlay: { path: b.candidateDirectory + 'correction-v3.json', sha256: b.overlaySha256 },
    independent: { path: b.candidateDirectory + 'independent-v3.json', sha256: b.independentSha256 },
    finalBindings: { path: b.candidateDirectory + 'final-full-card-bindings-v3.json', sha256: b.finalBindingsSha256 },
    owner: { path: owner, sha256: b.ownerSha256 },
    beforeArchive: { path: b.directory + 'before-raw.json', sha256: b.archiveSha256 },
  }
  const registryPrefix = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 80 && sha256(registryPrefix) === b.prefixSha256
    && batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && batch.operationCount === 922
    && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(batch.applicationReview, { evidencePath: bindings.independent.path, evidenceSha256: b.independentSha256 })
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: b.ownerSha256, messageRef: owner }]),
  'E_APPROVAL_BATCH', '/applied/s03')
  const packet = JSON.parse(packetBytes)
  check(packet.schema === 'seoul-s03-reviewed-source-application.v1' && packet.batchId === b.id
    && eq(packet.registryPrefix, { count: 80, sha256: b.prefixSha256 })
    && Object.entries(bindings).every(([key, binding]) => eq(packet[key], binding))
    && eq(packet.sources, manifest.sources) && eq(packet.operations, { base: 880, overlay: 42 })
    && packet.scope === 'private-source-only; no census products, public files, scope activation or publication'
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: packet.sources }),
  'E_APPROVAL_BATCH', '/applied/s03/packet')
  const bound = {}
  for (const [key, binding] of Object.entries(bindings)) {
    const bytes = await readBytes(resolve(root, binding.path))
    check(sha256(bytes) === binding.sha256, 'E_REVIEW_HASH', '/applied/s03/binding', binding.path)
    if (key !== 'owner') bound[key] = JSON.parse(bytes)
  }
  const { proposal, overlay, independent, finalBindings, beforeArchive } = bound
  const paths = [proposal.sourcePaths.cast, proposal.sourcePaths.core]
  const independentCounts = independent.coverage
  check(proposal.schema === 'seoul.s03-reviewed-location-prose-candidate.v1'
    && eq(paths, ['lore/characters/Cast-State-03.json', 'lore/characters/Core-Characters.json'])
    && proposal.sourcePaths.relations === 'lore/characters/Cast-Relations.json'
    && proposal.scope.people === 66 && proposal.scope.operations === 880 && proposal.scope.inverseOperations === 880
    && proposal.scope.locationRefs === 74 && proposal.scope.connectedRelationReferences === 179
    && proposal.scope.uniqueRelationRows === 103 && proposal.scope.fullLanguageBodies === 132
    && Object.keys(proposal.parts.files).length === 41
    && eq(overlay.base, { path: 'proposal.json', sha256: b.proposalSha256 }) && overlay.edits.length === 42
    && independent.verdict === 'PASS' && eq(independent.findings, [])
    && eq(independent.candidate, { path: 'proposal.json', sha256: b.proposalSha256 })
    && eq(independent.correction, { path: 'correction-v3.json', sha256: b.overlaySha256 })
    && eq(independent.finalBindings, { path: 'final-full-card-bindings-v3.json', sha256: b.finalBindingsSha256 })
    && independentCounts.jsonlPartHashesMatched === 41 && independentCounts.persons === 66
    && independentCounts.forwardOperationsAndUniquePointers === 880
    && independentCounts.inverseOperationsRestoredWholeSources === 880
    && independentCounts.correctionPreimagesAndPostimagesMatched === 42
    && independentCounts.finalExpandedLanguageBodiesBound === 132
    && independentCounts.workReferencesAfterExactOriginalKeyOrderHashMatched === 74
    && independentCounts.relationMembershipsMatched === 179 && independentCounts.unchangedUniqueRelationRowsMatched === 103
    && independentCounts.semanticPass === 66 && independentCounts.semanticFail === 0
    && eq(finalBindings.base, { path: 'proposal.json', sha256: b.proposalSha256 })
    && eq(finalBindings.correction, { path: 'correction-v3.json', sha256: b.overlaySha256, edits: 42 })
    && finalBindings.hashContract === proposal.hashContract
    && eq(finalBindings.sourceRawHashes, proposal.sourceRawHashes)
    && eq(independent.sourceRawHashes, proposal.sourceRawHashes)
    && eq(independent.sourceCurrentCompactSha256, finalBindings.sourceCurrentCompactSha256)
    && eq(finalBindings.counts, { persons: 66, fullCardSpans: 66, expandedLanguageBodies: 132,
      workReferences: 74, relationMemberships: 179, uniqueRelationRows: 103,
      forwardOperations: 880, inverseOperations: 880, correctionEdits: 42 })
    && finalBindings.cards.length === 66 && beforeArchive.schema === 'seoul-s03-original-raw-archive.v1'
    && beforeArchive.sources.length === 2 && manifest.sources.length === 2,
  'E_REVIEW_COVERAGE', '/applied/s03/review')
  const hashValue = value => sha256(JSON.stringify(value))
  for (const [path, digest] of Object.entries(proposal.sourceRawHashes)) {
    if (paths.includes(path)) continue
    const bytes = await readBytes(resolve(root, path))
    check(sha256(bytes) === digest, 'E_REVIEW_HASH', '/applied/s03/pin', path)
    if (Object.hasOwn(finalBindings.sourceCurrentCompactSha256, path))
      check(hashValue(JSON.parse(bytes)) === finalBindings.sourceCurrentCompactSha256[path],
        'E_REVIEW_HASH', '/applied/s03/unchanged', path)
  }
  const parts = {}
  for (const [name, digest] of Object.entries(proposal.parts.files)) {
    check(/^(persons|operations|inverse-operations|connected-relations)-\d{2}\.jsonl$/.test(name),
      'E_REVIEW_COVERAGE', '/applied/s03/part', name)
    const bytes = await readBytes(resolve(root, b.candidateDirectory + name))
    check(sha256(bytes) === digest, 'E_REVIEW_HASH', '/applied/s03/part', name)
    parts[name] = bytes.toString().trimEnd().split('\n').map(line => JSON.parse(line))
  }
  const rows = kind => Object.keys(parts).filter(name => name.startsWith(kind + '-')).sort().flatMap(name => parts[name])
  const people = rows('persons'), operations = rows('operations'), inverse = rows('inverse-operations')
  const relations = rows('connected-relations')
  check(people.length === 66 && operations.length === 880 && inverse.length === 880 && relations.length === 103
    && eq(batch.personIds, people.map(person => person.id))
    && eq(finalBindings.cards.map(card => card.id), batch.personIds),
  'E_REVIEW_COVERAGE', '/applied/s03/rows')
  const replay = new Map(), original = new Map(), current = new Map()
  for (const [index, path] of paths.entries()) {
    const row = manifest.sources[index], archive = beforeArchive.sources[index]
    const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
    const after = await readBytes(resolve(root, path))
    check(archive.sourcePath === path && archive.rawSha256 === proposal.sourceRawHashes[path]
      && archive.rawBytes === before.length && sha256(before) === archive.rawSha256
      && eq(row, { sourcePath: path, beforeSha256: archive.rawSha256, afterSha256: sha256(after),
        beforeBytes: before.length, afterBytes: after.length, changed: true, sealed: false })
      && after.equals(Buffer.from(JSON.stringify(JSON.parse(after), null, 2) + '\n'))
      && hashValue(JSON.parse(after)) === finalBindings.sourceCurrentCompactSha256[path],
    'E_ARCHIVE_HASH', '/applied/s03/source', path)
    original.set(path, JSON.parse(before)); replay.set(path, JSON.parse(before)); current.set(path, JSON.parse(after))
  }
  const apply = operation => {
    const document = replay.get(operation.path)
    check(document && operation.pointer.startsWith('/content/'), 'E_REVIEW_HASH', '/applied/s03/pointer', operation.pointer)
    const parts = operation.pointer.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const parent = parts.slice(0, -1).reduce((value, key) => value?.[key], document)
    const key = parts.at(-1)
    check(parent && Object.hasOwn(parent, key) && eq(parent[key], operation.before)
      && hashValue(operation.before) === operation.beforeValueSha256
      && hashValue(operation.after) === operation.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s03/operation', operation.pointer)
    parent[key] = structuredClone(operation.after)
  }
  const unique = new Set()
  for (const operation of operations) {
    const id = operation.path + '|' + operation.pointer
    check(!unique.has(id), 'E_REVIEW_COVERAGE', '/applied/s03/duplicate', id)
    unique.add(id)
    apply(operation)
  }
  const baseFinal = new Map([...replay].map(([path, value]) => [path, structuredClone(value)]))
  for (const operation of overlay.edits) apply(operation)
  for (const [path, document] of replay)
    check(eq(document, current.get(path)) && hashValue(document) === finalBindings.sourceCurrentCompactSha256[path],
      'E_REVIEW_HASH', '/applied/s03/forward', path)
  const final = new Map([...replay].map(([path, value]) => [path, structuredClone(value)]))
  for (const operation of [...overlay.edits].reverse()) apply({ ...operation,
    before: operation.after, after: operation.before,
    beforeValueSha256: operation.afterValueSha256, afterValueSha256: operation.beforeValueSha256 })
  for (const operation of inverse) apply(operation)
  for (const [path, document] of replay) check(eq(document, original.get(path)),
    'E_REVIEW_HASH', '/applied/s03/inverse', path)
  const expand = (value, locale) => {
    if (Array.isArray(value)) return value.map(item => expand(item, locale))
    if (value && typeof value === 'object') {
      if (Object.hasOwn(value, 'ko') && Object.hasOwn(value, 'en')) return expand(value[locale], locale)
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, expand(child, locale)]))
    }
    return value
  }
  let workCount = 0, membershipCount = 0
  const relationMap = new Map(relations.map(row => [row.pointer, row]))
  check(relationMap.size === 103, 'E_REVIEW_COVERAGE', '/applied/s03/relations')
  for (const person of people) {
    const card = finalBindings.cards.find(row => row.id === person.id)
    const before = original.get(person.sourcePath), after = final.get(person.sourcePath)
    const start = Number(person.headingPointer.split('/').at(-1))
    const end = Number(person.endExclusivePointer.split('/').at(-1))
    check(card && card.sourcePath === person.sourcePath && card.headingPointer === person.headingPointer
      && card.endExclusivePointer === person.endExclusivePointer && card.anchor === person.anchor
      && before.content[start]?.anchor === person.anchor && after.content[start]?.anchor === person.anchor
      && hashValue(before.content.slice(start, end)) === person.sourceBeforeFullCardSha256
      && hashValue(baseFinal.get(person.sourcePath).content.slice(start, end)) === person.sourceAfterFullCardSha256, 'E_REVIEW_HASH', '/applied/s03/card-base', person.id)
    check(hashValue(before.content.slice(start, end)) === card.sourceBeforeFullCardSha256
      && hashValue(after.content.slice(start, end)) === card.finalFullCardSha256,
    'E_REVIEW_HASH', '/applied/s03/card-final', person.id)
    for (const locale of ['ko', 'en']) check(hashValue(expand(after.content.slice(start + 1, end), locale)) === card.languageBodySha256[locale]
      && eq(expand(after.content.slice(start + 1, end), locale), card.fullLanguageBodies[locale]),
    'E_REVIEW_HASH', '/applied/s03/full-body', person.id)
    for (const ref of person.locationRefs) {
      check(hashValue(pointer(original.get(person.sourcePath), ref.pointer)) === ref.beforeValueSha256
        && hashValue(pointer(final.get(person.sourcePath), ref.pointer)) === ref.afterValueSha256
        && hashValue(ref.after) === ref.afterValueSha256,
      'E_REVIEW_HASH', '/applied/s03/work', person.id)
      workCount++
    }
    for (const ref of person.relationPointers) {
      check(relationMap.has(ref), 'E_REVIEW_COVERAGE', '/applied/s03/membership', ref)
      membershipCount++
    }
  }
  for (const relation of relations)
    check(hashValue(pointer(JSON.parse(await readBytes(resolve(root, proposal.sourcePaths.relations))), relation.pointer)) === relation.beforeValueSha256
      && relation.beforeValueSha256 === relation.afterValueSha256 && eq(relation.before, relation.after),
    'E_REVIEW_HASH', '/applied/s03/relation', relation.pointer)
  check(workCount === 74 && membershipCount === 179 && finalBindings.cards[0].id === 'K057'
    && finalBindings.cards[0].finalFullCardSha256 === '122ff0f7abca533f9ae53b432a707641da0129cb23d7339244a654315c1a2f40'
    && people.find(row => row.id === 'K1005')?.holdings?.length === 1,
  'E_REVIEW_COVERAGE', '/applied/s03/coverage')
}
async function validateStyleV4Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = STYLE_V4_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const packet = JSON.parse(packetBytes)
  check(prefix.length === 84 && prefix[83].batchId === RENDERER_HEADING_SUCCESSOR.id
    && sha256(prefixBytes) === b.prefixSha256, 'E_APPROVAL_BATCH', '/applied/style-v4/prefix')
  check(batch.batchId === b.id && batch.packetPath === b.directory + 'application-packet.json'
    && batch.packetSha256 === b.packetSha256 && sha256(packetBytes) === b.packetSha256
    && batch.operationCount === 19 && eq(batch.personIds, [])
    && batch.sourceBeforeAfterPath === b.directory + 'source-before-after.json'
    && sha256(await readBytes(resolve(root, batch.sourceBeforeAfterPath))) === b.manifestSha256
    && eq(batch.applicationReview, { evidencePath: packet.candidate[1].path, evidenceSha256: packet.candidate[1].sha256 })
    && eq(batch.approvals, [{ kind: 'owner-remaining-recommendations', bodySha256: packet.owner.sha256, messageRef: packet.owner.path }])
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: packet.sources })
    && eq(packet.scope, { privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 }),
  'E_APPROVAL_BATCH', '/applied/style-v4')
  const candidateDir = '.omo/private/seoul-migration/style586-current-two-samples-20261016-v4/'
  const files = ['operations.json', 'independent-review.md', 'review.md', 'world-after.ko.md', 'han-jaemok-after.ko.md']
  const candidate = [
    'bd5cc4c497e27f8b746c40e73850c32e640ed37e3f78aabac2c10d0818b77158',
    'c65cd673a2d39edde74a7911aac22296bfcc8e2707b29ce93de814d874400ce9',
    '5aaf2f8fa53cd7ff8e54b291cb1580afc6a7502aa4d3519c913d1e3f1976e30e',
    packet.candidate[3].sha256, packet.candidate[4].sha256,
  ].map((sha256, index) => ({ path: candidateDir + files[index], sha256 }))
  const owner = { path: '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', sha256: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75' }
  const archivePin = { path: b.directory + 'before-raw.json', sha256: b.archiveSha256 }
  check(eq(packet.candidate, candidate) && eq(packet.owner, owner) && eq(packet.beforeArchive, archivePin)
    && packet.schema === 'seoul-style-v4-two-samples-source-application.v1'
    && packet.batchId === b.id && eq(packet.registryPrefix, { count: 84, sha256: b.prefixSha256 })
    && packet.operationCount === 19 && packet.sources.length === 2,
  'E_APPROVAL_BATCH', '/applied/style-v4/packet')
  for (const pin of [...candidate, owner, archivePin])
    check(sha256(await readBytes(resolve(root, pin.path))) === pin.sha256, 'E_REVIEW_HASH', '/applied/style-v4/input', pin.path)
  const operations = JSON.parse(await readBytes(resolve(root, candidate[0].path)))
  const archive = JSON.parse(await readBytes(resolve(root, archivePin.path)))
  check(operations.samples.length === 2 && operations.samples.reduce((n, sample) => n + sample.operations.length, 0) === 19
    && archive.schema === 'seoul-style-v4-original-raw-archive.v1' && archive.sources.length === 2
    && eq(packet.sources.map(row => row.sourcePath), ['lore/overview/World-Unbinding.json', 'lore/characters/Cast-State-01.json']),
  'E_REVIEW_COVERAGE', '/applied/style-v4/samples')
  for (const [index, sample] of operations.samples.entries()) {
    const row = packet.sources[index], snapshot = archive.sources[index]
    const before = gunzipSync(Buffer.from(snapshot.gzipBase64, 'base64'))
    const after = await readBytes(resolve(root, row.sourcePath))
    check(sample.source === row.sourcePath && snapshot.sourcePath === row.sourcePath
      && sample.sourceBeforeSha256 === row.beforeSha256 && sample.sourceAfterSha256 === row.afterSha256
      && snapshot.rawBytes === row.beforeBytes && snapshot.rawSha256 === row.beforeSha256
      && before.length === row.beforeBytes && sha256(before) === row.beforeSha256
      && after.length === row.afterBytes && sha256(after) === row.afterSha256
      && row.changed === true && row.sealed === false,
    'E_REVIEW_HASH', '/applied/style-v4/archive', row.sourcePath)
    const document = JSON.parse(before), original = JSON.parse(before)
    let replay = before.toString()
    for (const op of sample.operations) {
      const segments = op.path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
      const key = segments.pop(), parent = segments.reduce((value, part) => value?.[part], document)
      const beforeToken = JSON.stringify(op.before)
      check(parent && Object.hasOwn(parent, key) && parent[key] === op.before
        && sha256(op.before) === op.beforeSha256 && sha256(op.after) === op.afterSha256
        && replay.split(beforeToken).length === 2 && op.anchor === document.content[Number(segments[1])]?.anchor,
      'E_REVIEW_HASH', '/applied/style-v4/operation', op.path)
      parent[key] = op.after
      replay = replay.replace(beforeToken, JSON.stringify(op.after))
    }
    check(Buffer.from(replay).equals(after) && sha256(replay) === row.afterSha256
      && eq(document.content.map(node => node.anchor), original.content.map(node => node.anchor))
      && eq(document.content.map(node => node.text?.en), original.content.map(node => node.text?.en)),
    'E_REVIEW_HASH', '/applied/style-v4/forward', row.sourcePath)
    const render = value => index === 0 ? renderLoreMarkdown(value, 'ko')
      : renderLoreMarkdown({ ...value, content: value.content.slice(0, 3) }, 'ko')
    check(sha256(render(original)) === sample.fullKoBeforeSha256
      && sha256(render(document)) === sample.fullKoAfterSha256
      && render(document) === (await readBytes(resolve(root, candidate[index === 0 ? 3 : 4].path))).toString(),
    'E_REVIEW_HASH', '/applied/style-v4/render', row.sourcePath)
  }
}

async function validateS06V2Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S06_V2_SOURCE
  const path = b.directory + 'application-packet.json'
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 85 && prefix[84].batchId === STYLE_V4_SOURCE.id && sha256(prefixBytes) === b.prefixSha256
    && sha256(packetBytes) === b.packetSha256, 'E_APPROVAL_BATCH', '/applied/s06-v2/prefix')
  const packet = JSON.parse(packetBytes)
  const source = { sourcePath: 'lore/characters/Cast-State-06.json', beforeSha256: b.beforeSha256,
    afterSha256: b.afterSha256, beforeBytes: 458458, afterBytes: 466576, changed: true, sealed: false }
  const pins = {
    candidate: [b.candidateDirectory + 'candidate.json', '65e5757605b7a345b67669d91566d03d25ff1f71dd936d78067f049af6e583e3'],
    sourceCandidate: [b.candidateDirectory + 'source-candidate.json', b.afterSha256],
    sourceManifest: [b.candidateDirectory + 'source-manifest.json', 'c75fef96fe094494f779e14878c90c22f9060ff4e9f418352d05136ee5438434'],
    artifactHashes: [b.candidateDirectory + 'artifact-hashes.json', '4225be8da4626e434c91d64b1ec1e941e10e3c537923e503828bce47b430085a'],
    independentReview: [b.candidateDirectory + 'independent-review.json', '42826e5074b3d263386d352a8dd21c09c45d792d56f3872f488d66589af8395a'],
    independentReviewText: [b.candidateDirectory + 'independent-review.md', 'f10b617b44ef226f122ff7f53f408753727dff10532a5efcc9aba2ab90500a99'],
    owner: ['.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75'],
    styleDirection: ['.omo/private/seoul-migration/style586-current-two-samples-20261016-v4/independent-review.md', 'c65cd673a2d39edde74a7911aac22296bfcc8e2707b29ce93de814d874400ce9'],
    beforeArchive: [b.directory + 'before-raw.json', b.archiveSha256],
  }
  const expected = Object.fromEntries(Object.entries(pins).map(([key, [path, digest]]) => [key, { path, sha256: digest }]))
  check(eq(packet, { schema: 'seoul-s06-v2-reviewed-source-application.v1', batchId: b.id,
    registryPrefix: { count: 85, sha256: b.prefixSha256 }, source, operationCount: 932,
    ...expected, scope: { privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [source] })
    && sha256(await readBytes(resolve(root, b.directory + 'source-before-after.json'))) === b.manifestSha256
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: path, packetSha256: b.packetSha256, operationCount: 932,
      sourceBeforeAfterPath: b.directory + 'source-before-after.json',
      applicationReview: { evidencePath: expected.independentReview.path, evidenceSha256: expected.independentReview.sha256 },
      approvals: [{ kind: 'owner-remaining-recommendations', bodySha256: expected.owner.sha256, messageRef: expected.owner.path }] }),
  'E_APPROVAL_BATCH', '/applied/s06-v2/packet')
  const bound = {}
  for (const [key, pin] of Object.entries(expected)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s06-v2/input', key)
    bound[key] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive)
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  check(archive.schema === 'seoul-s06-v2-original-raw-archive.v1' && archive.sourcePath === source.sourcePath
    && archive.rawSha256 === b.beforeSha256 && archive.rawBytes === before.length
    && before.length === source.beforeBytes && sha256(before) === b.beforeSha256
    && after.length === source.afterBytes && sha256(after) === b.afterSha256,
  'E_ARCHIVE_HASH', '/applied/s06-v2/archive')
  const candidate = JSON.parse(bound.candidate), review = JSON.parse(bound.independentReview)
  const original = JSON.parse(before), replay = structuredClone(original)
  check(candidate.schema === 's06-reviewed-fullbody-prose-candidate/v1'
    && candidate.source.path === source.sourcePath && candidate.source.rawSha256 === b.beforeSha256
    && candidate.candidateParsedJsonSha256 === b.candidateSha256
    && review.verdict === 'PASS' && review.candidateParsedJsonSha256 === b.candidateSha256
    && review.sourceRawSha256 === b.beforeSha256 && review.coverage.operationsAndReadableDiffs === 932
    && candidate.operationCount === 932 && candidate.operations.length === 932,
  'E_REVIEW_COVERAGE', '/applied/s06-v2/authority')
  const seen = new Set()
  for (const [index, op] of candidate.operations.entries()) {
    const segments = op.path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = segments.pop(), parent = segments.reduce((value, part) => value?.[part], replay)
    check(op.sequence === index + 1 && op.op === 'replace' && op.file === source.sourcePath
      && op.path.startsWith('/content/') && !seen.has(op.path) && parent && Object.hasOwn(parent, key)
      && eq(parent[key], op.before) && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s06-v2/operation', op.path)
    seen.add(op.path)
    parent[key] = op.value
  }
  const expectedAfter = JSON.stringify(replay, null, 2) + '\n'
  check(seen.size === 932 && sha256(JSON.stringify(replay)) === b.candidateSha256
    && eq(replay, JSON.parse(bound.sourceCandidate)) && Buffer.from(expectedAfter).equals(after)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth]))
    && original.content.length === 664 && review.coverage.cards === 61,
  'E_REVIEW_HASH', '/applied/s06-v2/forward')
  for (const locale of ['ko', 'en']) check(sha256(renderLoreMarkdown(replay, locale)) === candidate.renderedFullDocumentSha256[locale]
    && candidate.renderedFullDocumentSha256[locale] === review.fullDocumentBodySha256[locale],
  'E_REVIEW_HASH', '/applied/s06-v2/render', locale)
  const authority = JSON.parse(bound.sourceManifest)
  const artifacts = JSON.parse(bound.artifactHashes)
  check(authority.length === 20 && artifacts.schema === 's06-v2-artifact-raw-hashes/v1'
    && artifacts.candidateParsedJsonSha256 === b.candidateSha256 && artifacts.files.length === 20,
    'E_REVIEW_COVERAGE', '/applied/s06-v2/inputs')
  const repin = await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readBytes) ?? readBytes)
  const cohortSuccessor = repin.transitions.find(row => row.path === 'lore/name-pools/cast-birth-cohorts.json')
  const cohortFinalSuccessor = (await loadFinalSuccessor(root, readBytes)).transitions.find(row => row.path === 'lore/name-pools/cast-birth-cohorts.json')
  for (const pin of authority) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.rawSha256 || (pin.path === cohortSuccessor?.path
      && pin.rawSha256 === cohortSuccessor.beforeSha256
      && (sha256(bytes) === cohortSuccessor.afterSha256 || cohortFinalSuccessor?.beforeSha256 === cohortSuccessor.afterSha256
        && sha256(bytes) === cohortFinalSuccessor.afterSha256)),
    'E_REVIEW_HASH', '/applied/s06-v2/authority-input', pin.path)
  }
  for (const pin of artifacts.files) {
    const bytes = await readBytes(resolve(root, b.candidateDirectory + pin.path))
    check(bytes.length === pin.bytes && sha256(bytes) === pin.rawSha256,
      'E_REVIEW_HASH', '/applied/s06-v2/artifact', pin.path)
  }
  return before
}

async function validateS05V2Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S05_V2_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 86 && prefix[85].batchId === S06_V2_SOURCE.id && sha256(prefixBytes) === b.prefixSha256
    && sha256(packetBytes) === b.packetSha256, 'E_APPROVAL_BATCH', '/applied/s05-v2/prefix')
  const source = {"sourcePath":"lore/characters/Cast-State-05.json","beforeSha256":"e2532372318333bff855686e7691f2e2f85f3f6c6c95d05d2942c080eef94c79","afterSha256":"0781d9eacee17e2b4ade5803567ab2bc306883d7d06557be6211d7d37635ac0f","beforeBytes":489803,"afterBytes":379124,"changed":true,"sealed":false}
  const expected = {
    "candidate": {
      "path": ".omo/private/seoul-migration/s05-reviewed-fullbody-prose-candidate-20261016-v2/operations.json",
      "sha256": "5bb106c0c3d7139d4db0a8947d25c187faaa372588f9771fd8fe9640d600a56a"
    },
    "sourceCandidate": {
      "path": ".omo/private/seoul-migration/s05-reviewed-fullbody-prose-candidate-20261016-v2/candidate-source.json",
      "sha256": "0781d9eacee17e2b4ade5803567ab2bc306883d7d06557be6211d7d37635ac0f"
    },
    "independentReview": {
      "path": ".omo/private/seoul-migration/s05-reviewed-fullbody-prose-candidate-20261016-v2/independent-review.json",
      "sha256": "3dc34d439a2ba7bf136fa6b391535ab3a737dbd710e27c4307395225c205af16"
    },
    "independentReviewText": {
      "path": ".omo/private/seoul-migration/s05-reviewed-fullbody-prose-candidate-20261016-v2/independent-review.md",
      "sha256": "f7560815681f3e6226bfef5d935c16e3a272d5659fdf0cc8ac4a7261f9d96bf9"
    },
    "fullbodyKo": {
      "path": ".omo/private/seoul-migration/s05-reviewed-fullbody-prose-candidate-20261016-v2/fullbody.ko.md",
      "sha256": "1540ea8b0d5bdb497f1bc16255aef56553fa6d182208afbc5544f1c03104ed8d"
    },
    "fullbodyEn": {
      "path": ".omo/private/seoul-migration/s05-reviewed-fullbody-prose-candidate-20261016-v2/fullbody.en.md",
      "sha256": "d2a3cdb6efddd357dd184f6b2b66b5c681fc23e957189f8f0b0087bf9c548a3e"
    },
    "owner": {
      "path": ".omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md",
      "sha256": "82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75"
    },
    "workPacket": {
      "path": ".omo/private/seoul-migration/giant-s05-applied-staging/combined-packet.json",
      "sha256": "cf69adfca912f82d26460ab5183fd1cbe6cba6de924d85c440b63f43a73ca84c"
    },
    "workProposal": {
      "path": ".omo/private/seoul-migration/task-8-batch-proposal-giant-s05.json",
      "sha256": "2c475da51084a64be3de0962707ccf4eab3039f1824f36b024af4162e5d39f08"
    },
    "workOwner": {
      "path": ".omo/evidence/seoul-lock/task-8-owner-batch-approvals-20261015.md",
      "sha256": "ab373f62dfd42fb00c1201696a371b595c203cebcab5c0763986f3fe058c7fdb"
    },
    "gender": {
      "path": "lore/name-pools/gender-cast.json",
      "sha256": "5a96a28aeb51b55aae3cd623318f8c40ff0c401defdd360cb94799ce35e350e2"
    },
    "cohort": {
      "path": "lore/name-pools/cast-birth-cohorts.json",
      "sha256": "228400355890c3ea7a2364bd9b7032ed036fd3373d85e90699678a2ddcb2d06c"
    },
    "birthday": {
      "path": "lore/name-pools/cast-birthdays.json",
      "sha256": "195b524daf1592beec030f4ab500b5d99056d388ce34662cfedd9db68d26101b"
    },
    "beforeArchive": {
      "path": ".omo/private/seoul-migration/s05-v2-reviewed-source-application-20261016/before-raw.json",
      "sha256": "4cf4fa474c9ef7cbadfb7137d510fa5946bca44e329c8cf71273da62d249d35d"
    }
  }
  const packet = JSON.parse(packetBytes)
  check(eq(packet, { schema: 'seoul-s05-v2-reviewed-source-application.v1', batchId: b.id,
    registryPrefix: { count: 86, sha256: b.prefixSha256 }, source, operationCount: 931,
    ...expected, scope: { privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [source] })
    && sha256(await readBytes(resolve(root, b.directory + 'source-before-after.json'))) === b.manifestSha256
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 931,
      sourceBeforeAfterPath: b.directory + 'source-before-after.json',
      applicationReview: { evidencePath: expected.independentReview.path, evidenceSha256: expected.independentReview.sha256 },
      approvals: [{ kind: 'owner-remaining-recommendations', bodySha256: expected.owner.sha256, messageRef: expected.owner.path }] }),
  'E_APPROVAL_BATCH', '/applied/s05-v2/packet')
  const bound = {}
  const repin = await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readBytes) ?? readBytes)
  const cohortSuccessor = repin.transitions.find(row => row.path === 'lore/name-pools/cast-birth-cohorts.json')
  const cohortFinalSuccessor = (await loadFinalSuccessor(root, readBytes)).transitions.find(row => row.path === 'lore/name-pools/cast-birth-cohorts.json')
  for (const [key, pin] of Object.entries(expected)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256 || (key === 'cohort' && pin.path === cohortSuccessor?.path
      && pin.sha256 === cohortSuccessor.beforeSha256
      && (sha256(bytes) === cohortSuccessor.afterSha256 || cohortFinalSuccessor?.beforeSha256 === cohortSuccessor.afterSha256
        && sha256(bytes) === cohortFinalSuccessor.afterSha256)),
    'E_REVIEW_HASH', '/applied/s05-v2/input', key)
    bound[key] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive)
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  check(archive.schema === 'seoul-s05-v2-original-raw-archive.v1' && archive.sourcePath === source.sourcePath
    && archive.rawSha256 === b.beforeSha256 && archive.rawBytes === before.length
    && before.length === source.beforeBytes && sha256(before) === b.beforeSha256
    && after.length === source.afterBytes && sha256(after) === b.afterSha256 && Buffer.from(bound.sourceCandidate).equals(after),
  'E_ARCHIVE_HASH', '/applied/s05-v2/archive')
  const candidate = JSON.parse(bound.candidate), review = JSON.parse(bound.independentReview)
  const original = JSON.parse(before), replay = structuredClone(original)
  check(candidate.schema === 's05-private-reviewed-fullbody-prose-candidate/v2'
    && candidate.source === source.sourcePath && candidate.sourceBeforeSha256 === b.beforeSha256
    && candidate.candidateDocCompactJsonSha256 === b.candidateSha256
    && candidate.operationCount === 931 && candidate.operations.length === 931
    && candidate.cards.length === 65 && candidate.counts.approvedWorkReferences === 70 && candidate.unresolved.length === 4
    && review.verdict === 'PASS-exact-candidate-only-no-application-or-publication-approval'
    && review.sourceSha256 === b.beforeSha256 && review.candidateCompactJsonSha256 === b.candidateSha256
    && review.coverage.uniqueOperationsReplayed === 931 && review.coverage.cards === 65
    && review.coverage.approvedWorkBindingsCompared === 70 && review.unresolvedSourceAssertions.length === 4,
  'E_REVIEW_COVERAGE', '/applied/s05-v2/authority')
  const seen = new Set()
  for (const op of candidate.operations) {
    const segments = op.path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = segments.pop(), parent = segments.reduce((value, part) => value?.[part], replay)
    check(op.path.startsWith('/content/') && !seen.has(op.path) && parent && Object.hasOwn(parent, key)
      && eq(parent[key], op.before) && sha256(JSON.stringify(op.before)) === op.beforeSha256
      && sha256(JSON.stringify(op.after)) === op.afterSha256,
    'E_REVIEW_HASH', '/applied/s05-v2/operation', op.path)
    seen.add(op.path)
    parent[key] = op.after
  }
  check(seen.size === 931 && sha256(JSON.stringify(replay)) === b.candidateSha256
    && eq(replay, JSON.parse(bound.sourceCandidate)) && original.content.length === 707
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s05-v2/forward')
  for (const locale of ['ko', 'en']) {
    const rendered = Buffer.from(renderLoreMarkdown(replay, locale))
    check(sha256(renderLoreMarkdown(original, locale)) === candidate.renderHashes[locale + 'Before']
      && sha256(rendered) === candidate.renderHashes[locale + 'After']
      && rendered.equals(Buffer.from(bound[locale === 'ko' ? 'fullbodyKo' : 'fullbodyEn'])),
    'E_REVIEW_HASH', '/applied/s05-v2/render', locale)
  }
  const work = JSON.parse(bound.workPacket)
  const workReferences = work.operations.filter(op => op.locationRef)
  check(work.status === 'applied' && work.batchId === 'giant-s05' && workReferences.length === 70
    && eq(work.personIds.slice().sort(), candidate.cards.map(card => card.personId).sort())
    && work.approvalBindings[0].sha256 === expected.workOwner.sha256
    && work.approvalBindings[0].proposalSha256 === expected.workProposal.sha256,
  'E_REVIEW_COVERAGE', '/applied/s05-v2/work')
  for (const op of workReferences) {
    const card = candidate.cards.find(card => card.personId === op.personId)
    const contentIndex = Number(op.path.split('/')[2])
    const value = op.path.slice(1).split('/').reduce((value, part) => value?.[part], replay)
    check(card && contentIndex >= card.start && contentIndex < card.endExclusive
      && op.locationRef.kind === 'work' && op.locationRef.doesNotGrantLand === true
      && op.locationRef.exactFacilityBoundaryEstablished === false
      && typeof value?.ko === 'string' && typeof value?.en === 'string'
      && value.ko.includes(op.locationRef.dongName)
      && ['ko', 'en'].every(locale => seen.has(op.path + '/' + locale)),
    'E_REVIEW_COVERAGE', '/applied/s05-v2/work-binding', op.path)
  }
  return before
}

async function validateS04V4Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S04_V4_SOURCE
  const packetPath = b.directory + 'application-packet.json'
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 87 && prefix[86].batchId === S05_V2_SOURCE.id && sha256(prefixBytes) === b.prefixSha256
    && sha256(packetBytes) === b.packetSha256, 'E_APPROVAL_BATCH', '/applied/s04-v4/prefix')
  const source = { sourcePath: 'lore/characters/Cast-State-04.json', beforeSha256: b.beforeSha256,
    afterSha256: b.afterSha256, beforeBytes: 482007, afterBytes: 449998, changed: true, sealed: false }
  const candidateDirectory = '.omo/private/seoul-migration/s04-reviewed-location-prose-candidate-20261016-v4/'
  const pins = {
    candidate: [candidateDirectory + 'candidate.json', 'a17e71187863f982a0f4be869f7505ad924b3581cfc010ea8a2ae88f98127ac6'],
    fullCards: [candidateDirectory + 'full-cards.json', 'f11421ab8aebba0791860e971df5a981d6da38d0acb14e7384c10bbf063ddc10'],
    inventory: [candidateDirectory + 'inventory-and-diffs.json', 'e200836fc71cf383eccb297a713955a273bf076e5231db7e4203a1844899ef7e'],
    independentReview: [candidateDirectory + 'independent-review.json', 'a8dc4f5494875c3ff9030687e715030345c58ace0b818fc8f77fe6910cbd5d82'],
    independentReviewText: [candidateDirectory + 'independent-review.md', '857525c4147062da24c9a80b28ed124369b1096c61e037fd01797bcc031b90ac'],
    owner: ['.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75'],
    workPacket: ['.omo/private/seoul-migration/giant-s04-applied-staging/combined-packet.json', '98ee11237d32c1ae6a09c3de5f4d6411ca8f5212335dc53b31b4d0aceac79e1e'],
    workOwner: ['.omo/evidence/seoul-lock/task-8-owner-batch-approvals-20261015.md', 'ab373f62dfd42fb00c1201696a371b595c203cebcab5c0763986f3fe058c7fdb'],
    beforeArchive: [b.directory + 'before-raw.json', b.archiveSha256],
  }
  const expected = Object.fromEntries(Object.entries(pins).map(([key, [path, digest]]) => [key, { path, sha256: digest }]))
  const packet = JSON.parse(packetBytes)
  check(eq(packet, { schema: 'seoul-s04-v4-reviewed-source-application.v1', batchId: b.id,
    registryPrefix: { count: 87, sha256: b.prefixSha256 }, source, operationCount: 644,
    ...expected, scope: { privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [source] })
    && sha256(await readBytes(resolve(root, b.directory + 'source-before-after.json'))) === b.manifestSha256
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath, packetSha256: b.packetSha256, operationCount: 644,
      sourceBeforeAfterPath: b.directory + 'source-before-after.json',
      applicationReview: { evidencePath: expected.independentReview.path, evidenceSha256: expected.independentReview.sha256 },
      approvals: [{ kind: 'owner-remaining-recommendations', bodySha256: expected.owner.sha256, messageRef: expected.owner.path }] }),
  'E_APPROVAL_BATCH', '/applied/s04-v4/packet')
  const bound = {}
  for (const [key, pin] of Object.entries(expected)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s04-v4/input', key)
    bound[key] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive)
  const archived = archive.sources?.[0]
  const before = gunzipSync(Buffer.from(archived?.gzipBase64 ?? '', 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  check(archive.schema === 'seoul-source-archive.v1' && archive.sources.length === 1
    && archived.sourcePath === source.sourcePath && archived.rawSha256 === b.beforeSha256
    && archived.bytes === source.beforeBytes && before.length === source.beforeBytes && sha256(before) === b.beforeSha256
    && after.length === source.afterBytes && sha256(after) === b.afterSha256,
  'E_ARCHIVE_HASH', '/applied/s04-v4/archive')
  const candidate = JSON.parse(bound.candidate), review = JSON.parse(bound.independentReview)
  const original = JSON.parse(before), replay = structuredClone(original)
  const inventory = JSON.parse(bound.inventory), cards = JSON.parse(bound.fullCards)
  check(candidate.schema === 's04-reviewed-location-prose-candidate.v3'
    && candidate.source.path === source.sourcePath && candidate.source.rawSha256 === b.beforeSha256
    && candidate.edits.length === 644 && candidate.findings.length === 518
    && candidate.scope.people === 64 && candidate.scope.workRefs === 67 && candidate.scope.newLandGrants === 0
    && review.verdict === 'PASS' && review.applicationApproved === false && review.publicationApproved === false
    && review.source.sha256 === b.beforeSha256 && review.candidateSha256['candidate.json'] === expected.candidate.sha256
    && review.candidateSha256['full-cards.json'] === expected.fullCards.sha256
    && review.candidateSha256['inventory-and-diffs.json'] === expected.inventory.sha256
    && review.coverage.exactEditsReplayed === 644 && review.coverage.semanticDiffsCompared === 644
    && review.coverage.fullBodyRendersVerified === 256 && review.coverage.approvedWorkBindingsCompared === 67
    && cards.cards.length === 64 && inventory.cards.length === 64 && inventory.semanticDiffs.length === 644,
  'E_REVIEW_COVERAGE', '/applied/s04-v4/authority')
  const seen = new Set()
  for (const op of candidate.edits) {
    const segments = op.pointer.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = segments.pop(), parent = segments.reduce((value, part) => value?.[part], replay)
    check(op.pointer.startsWith('/content/') && !seen.has(op.pointer) && parent && Object.hasOwn(parent, key)
      && eq(parent[key], op.before) && sha256(JSON.stringify(op.before)) === op.beforeSha256
      && sha256(JSON.stringify(op.after)) === op.afterSha256,
    'E_REVIEW_HASH', '/applied/s04-v4/operation', op.pointer)
    seen.add(op.pointer)
    parent[key] = op.after
  }
  check(seen.size === 644 && Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth]))
    && original.content.length === 696 && replay.status === 'draft',
  'E_REVIEW_HASH', '/applied/s04-v4/forward')
  const work = JSON.parse(bound.workPacket)
  const workRefs = work.operations.filter(op => op.file === source.sourcePath && op.locationRef)
  check(work.status === 'applied' && work.batchId === 'giant-s04' && workRefs.length === 67
    && work.approvalBindings[0].sha256 === expected.workOwner.sha256,
  'E_REVIEW_COVERAGE', '/applied/s04-v4/work')
  for (const op of workRefs) {
    const value = pointer(replay, op.path)
    check(op.locationRef.kind === 'work' && op.locationRef.doesNotGrantLand === true
      && typeof value?.ko === 'string' && value.ko.includes(op.locationRef.dongName)
      && ['ko', 'en'].every(locale => seen.has(op.path + '/' + locale)),
    'E_REVIEW_COVERAGE', '/applied/s04-v4/work-binding', op.path)
  }
  return before
}

async function validateS08V2Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S08_V2_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 88 && prefix[87].batchId === S04_V4_SOURCE.id && sha256(prefixBytes) === b.prefixSha256
    && sha256(packetBytes) === b.packetSha256, 'E_APPROVAL_BATCH', '/applied/s08-v2/prefix')
  const source = { sourcePath: 'lore/characters/Cast-State-08.json', beforeSha256: b.beforeSha256,
    afterSha256: b.afterSha256, beforeBytes: 463784, afterBytes: 435673, changed: true, sealed: false }
  const candidateDirectory = '.omo/private/seoul-migration/s08-reviewed-fullbody-prose-candidate-20261016-v2/'
  const pins = {
    candidate: [candidateDirectory + 'candidate.json', '3aabe1476583fb52267a159249d4d401b12fdb81b8c81881995f88faac2d7a34'],
    sourceCandidate: [candidateDirectory + 'source-candidate.json', b.afterSha256],
    sourceManifest: [candidateDirectory + 'source-manifest.json', '39d09049a0fec301824a29b555ce711c3914fd41f3714f5bef737e9127f8b9cb'],
    independentReview: [candidateDirectory + 'independent-review.json', '19aa82fbcb816ddf923751a1b0b5238fbfb993ee6ec4c7e8841bc206169c561b'],
    independentReviewText: [candidateDirectory + 'independent-review.md', '71c95ef05cdbd892eb0c306dd38937695e369faac8c162d767c948a9ff422cf6'],
    fullCards: [candidateDirectory + 'full-cards.json', '590354e140e0994c2f0c6e5d4705c3d88e4d70bc8b47d7aa0e71b906a3af2604'],
    cardHashes: [candidateDirectory + 'card-hashes.json', '148b41fd0216407ef3ece3411d38506fa3be84eb2a2fe9f7cad493c846c16e36'],
    locationProof: [candidateDirectory + 'location-proof.json', '12ed3e291c5fb1140598c61392ce79c0d23874c4011c5ee50cd69d5a6ae42ed1'],
    replayResult: [candidateDirectory + 'replay-result.json', '55e7f4abbdc8253869fa45804a1b837c0e9c2862a04277b1a24c00d07c69fb75'],
    owner: ['.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md', '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75'],
    workPacket: ['.omo/private/seoul-migration/giant-s08-applied-staging/combined-packet.json', 'd93957f3978a2b00acf7530914e0f295d37aee0fef48ae9e205a81cfb615bdf6'],
    workOwner: ['.omo/evidence/seoul-lock/task-8-owner-batch-approvals-20261015.md', 'ab373f62dfd42fb00c1201696a371b595c203cebcab5c0763986f3fe058c7fdb'],
    beforeArchive: [b.directory + 'before-raw.json', b.archiveSha256],
  }
  const expected = Object.fromEntries(Object.entries(pins).map(([key, [path, digest]]) => [key, { path, sha256: digest }]))
  const packet = JSON.parse(packetBytes)
  check(eq(packet, { schema: 'seoul-s08-v2-reviewed-source-application.v1', batchId: b.id,
    registryPrefix: { count: 88, sha256: b.prefixSha256 }, source, operationCount: 475,
    ...expected, scope: { privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [source] })
    && sha256(await readBytes(resolve(root, b.directory + 'source-before-after.json'))) === b.manifestSha256
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 475,
      sourceBeforeAfterPath: b.directory + 'source-before-after.json',
      applicationReview: { evidencePath: expected.independentReview.path, evidenceSha256: expected.independentReview.sha256 },
      approvals: [{ kind: 'owner-remaining-recommendations', bodySha256: expected.owner.sha256, messageRef: expected.owner.path }] }),
  'E_APPROVAL_BATCH', '/applied/s08-v2/packet')
  const bound = {}
  for (const [key, pin] of Object.entries(expected)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s08-v2/input', key)
    bound[key] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive)
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  check(archive.schema === 'seoul-s08-v2-original-raw-archive.v1' && archive.sourcePath === source.sourcePath
    && archive.rawSha256 === b.beforeSha256 && archive.rawBytes === before.length
    && before.length === source.beforeBytes && sha256(before) === b.beforeSha256
    && after.length === source.afterBytes && sha256(after) === b.afterSha256
    && Buffer.from(bound.sourceCandidate).equals(after), 'E_ARCHIVE_HASH', '/applied/s08-v2/archive')
  const candidate = JSON.parse(bound.candidate), review = JSON.parse(bound.independentReview)
  const original = JSON.parse(before), replay = structuredClone(original)
  check(candidate.schema === 's08-reviewed-fullbody-prose-candidate.v2'
    && candidate.source.path === source.sourcePath && candidate.source.rawSha256 === b.beforeSha256
    && candidate.candidateParsedJsonSha256 === 'fda99867dad77c25528f7fb9432d8c056d8abf8dac5fae741bb7a05ed801872a'
    && candidate.operationCount === 475 && candidate.operations.length === 475
    && review.status === 'PASS-private-unapplied-candidate-not-publication-approval'
    && review.sourceRawSha256 === b.beforeSha256 && review.candidateRawSha256 === expected.candidate.sha256
    && review.verification.operations === 475 && review.verification.cards === 61
    && review.verification.workBindings === 64 && review.verification.newAffiliationLeaves === 61
    && review.findings.length === 0 && review.sourceApplication === false && review.publicationApproval === false,
  'E_REVIEW_COVERAGE', '/applied/s08-v2/authority')
  const seen = new Set()
  for (const op of candidate.operations) {
    const segments = op.path.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = segments.pop(), parent = segments.reduce((value, part) => value?.[part], replay)
    check(op.op === 'replace' && op.file === source.sourcePath && op.path.startsWith('/content/')
      && !seen.has(op.path) && parent && Object.hasOwn(parent, key)
      && eq(parent[key], op.before) && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s08-v2/operation', op.path)
    seen.add(op.path)
    parent[key] = op.value
  }
  const bindings = JSON.parse(bound.locationProof).bindings
  const work = JSON.parse(bound.workPacket)
  const workRefs = work.operations.filter(op => op.file === source.sourcePath && op.locationRef)
  check(bindings.length === 64 && work.status === 'applied' && work.batchId === 'giant-s08'
    && workRefs.length === 64 && work.approvalBindings[0].sha256 === expected.workOwner.sha256,
  'E_REVIEW_COVERAGE', '/applied/s08-v2/work')
  for (const binding of bindings) {
    const ref = workRefs.find(op => op.personId === binding.personId && op.path === binding.pointer)
    const segments = binding.pointer.slice(1).split('/'), key = segments.pop()
    const parent = segments.reduce((value, part) => value?.[part], replay)
    check(ref && ref.locationRef.kind === 'work' && ref.locationRef.doesNotGrantLand === true
      && ref.locationRef.exactFacilityBoundaryEstablished === false
      && Object.entries(binding.locationRef).every(([name, value]) => eq(ref.locationRef[name], value))
      && eq(ref.value, binding.before) && eq(parent[key].ko, binding.after.ko)
      && eq(parent[key].en, binding.after.en)
      && ['ko', 'en'].every(locale => seen.has(binding.pointer + '/' + locale)),
    'E_REVIEW_COVERAGE', '/applied/s08-v2/work-binding', binding.pointer)
    parent[key] = binding.after
  }
  const cards = JSON.parse(bound.fullCards).cards, hashes = JSON.parse(bound.cardHashes).cards
  check(seen.size === 475 && cards.length === 61 && hashes.length === 61
    && sha256(JSON.stringify(replay)) === candidate.candidateParsedJsonSha256
    && eq(replay, JSON.parse(bound.sourceCandidate)) && Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after)
    && original.content.length === 664 && replay.content.length === 664
    && eq(original.data, replay.data)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s08-v2/forward')
  for (const locale of ['ko', 'en']) check(sha256(renderLoreMarkdown(replay, locale)) === candidate.renderedFullDocumentSha256[locale],
    'E_REVIEW_HASH', '/applied/s08-v2/render', locale)
  for (const [index, card] of cards.entries()) {
    const row = hashes[index]
    check(row.personId === card.personId && row.sourceCardJsonSha256 === sha256(JSON.stringify(original.content.slice(card.start, card.end + 1)))
      && eq(row.before, card.hashes.before) && eq(row.after, card.hashes.after)
      && (index === 0 ? card.start === 0 : cards[index - 1].end + 1 === card.start),
    'E_REVIEW_COVERAGE', '/applied/s08-v2/card', card.personId)
    for (const locale of ['ko', 'en']) for (const [stage, doc] of [['before', original], ['after', replay]]) {
      const rendered = renderLoreMarkdown({ ...doc, content: doc.content.slice(card.start, card.end + 1) }, locale)
      check(rendered === card[stage][locale] && sha256(rendered) === row[stage][locale],
        'E_REVIEW_HASH', '/applied/s08-v2/card-render', card.personId)
    }
  }
  const authority = JSON.parse(bound.sourceManifest)
  check(authority.length === 16 && JSON.parse(bound.replayResult).operations === 475,
    'E_REVIEW_COVERAGE', '/applied/s08-v2/inputs')
  const repin = await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readBytes) ?? readBytes)
  const cohortSuccessor = repin.transitions.find(row => row.path === 'lore/name-pools/cast-birth-cohorts.json')
  const cohortFinalSuccessor = (await loadFinalSuccessor(root, readBytes)).transitions.find(row => row.path === 'lore/name-pools/cast-birth-cohorts.json')
  for (const pin of authority) {
    const bytes = pin.path === source.sourcePath ? before : await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.rawSha256 || (pin.path === cohortSuccessor?.path
      && pin.rawSha256 === cohortSuccessor.beforeSha256
      && (sha256(bytes) === cohortSuccessor.afterSha256 || cohortFinalSuccessor?.beforeSha256 === cohortSuccessor.afterSha256
        && sha256(bytes) === cohortFinalSuccessor.afterSha256)),
    'E_REVIEW_HASH', '/applied/s08-v2/authority-input', pin.path)
  }
  return before
}

async function validateS07V2Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S07_V2_SOURCE
  const directory = '.omo/private/seoul-migration/s07-reviewed-fullbody-prose-candidate-20261016-v2/'
  const hashes = {
    "candidate.json": '9072fd5cfe829f6e0985379c99f7ebfb55658eb3774b7f4848c4d55342279f0d',
    "candidate-source.json": 'a87e2da6d1ca0911ae244b1aab68ba1673bf5df2876aed76c4c7bb50133a3781',
    "independent-review.json": 'cd28471e81599dedcdb592e8147da92574f954e8933d7c5208d32d589551b35f',
    "independent-review.md": '95d08d3f59a429ac720cda27973ac3ece56d6b705f74d079af7296b39bce1a16',
    "full-cards.json": '9bbd05092d06a2158f641ee9e449d22e3c13091f9fd12848bba6fb6034ae6d17',
    "inventory-and-diffs.json": '7a78aa1e4c32b41c956a7c939dafff496c8e58d96d8bdb532b98b8df12397c06',
    "reviewer-dispositions.json": '44372008831a5c9517c3c05fbc0721284a498335bc3c40e25964cdb00a915db4',
    "operation-contract.json": 'f4354a7dab0f24d22b4140c25f9c132121cf40c850bc07f0e8b1c4d4f6fda992',
    "verification.json": '60ae21d7901c0034da49957da238f8148386d65d429a2ff91a02c9f8251122ae',
    "README.md": 'be81867726f1a44d909b32f47e70e10e6780c736a599f2a08c24495c4f3c98fc',
    "owner": '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
    "workPacket": '7e00432715064e95f4d01df0b167d644f22007d66d93515704fb673731a60d1b',
    "workOwner": 'ab373f62dfd42fb00c1201696a371b595c203cebcab5c0763986f3fe058c7fdb',
    "beforeArchive": '6d8c08a40e3231707a24cd81aca6fd05d04fd5001b4c4c712d4947dfea321d6d',
  }
  const paths = Object.fromEntries(Object.keys(hashes).map(name => [name, name === 'owner'
    ? '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md'
    : name === 'workPacket' ? '.omo/private/seoul-migration/giant-s07-applied-staging/combined-packet.json'
      : name === 'workOwner' ? '.omo/evidence/seoul-lock/task-8-owner-batch-approvals-20261015.md'
        : name === 'beforeArchive' ? b.directory + 'before-raw.json' : directory + name]))
  const expectedPins = Object.fromEntries(Object.entries(hashes).map(([name, digest]) => [name, { path: paths[name], sha256: digest }]))
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 89 && prefix[88].batchId === S08_V2_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256,
  'E_APPROVAL_BATCH', '/applied/s07-v2/prefix')
  const source = { sourcePath: 'lore/characters/Cast-State-07.json', beforeSha256: b.beforeSha256,
    afterSha256: b.afterSha256, beforeBytes: 575200, afterBytes: 530252, changed: true, sealed: false }
  const packet = JSON.parse(packetBytes)
  check(eq(packet, { schema: 'seoul-s07-v2-reviewed-source-application.v1', batchId: b.id,
    registryPrefix: { count: 89, sha256: b.prefixSha256 }, source, operationCount: 766,
    pins: expectedPins, scope: { privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [source] })
    && sha256(await readBytes(resolve(root, b.directory + 'source-before-after.json'))) === b.manifestSha256
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 766,
      sourceBeforeAfterPath: b.directory + 'source-before-after.json',
      applicationReview: { evidencePath: expectedPins['independent-review.json'].path,
        evidenceSha256: expectedPins['independent-review.json'].sha256 },
      approvals: [{ kind: 'owner-remaining-recommendations', bodySha256: expectedPins.owner.sha256,
        messageRef: expectedPins.owner.path }] }),
  'E_APPROVAL_BATCH', '/applied/s07-v2/packet')
  const bound = {}
  for (const [name, pin] of Object.entries(expectedPins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s07-v2/input', name)
    bound[name] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive)
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  check(archive.schema === 'seoul-s07-v2-original-raw-archive.v1' && archive.sourcePath === source.sourcePath
    && archive.rawSha256 === b.beforeSha256 && archive.rawBytes === before.length
    && before.length === source.beforeBytes && sha256(before) === b.beforeSha256
    && after.length === source.afterBytes && sha256(after) === b.afterSha256
    && Buffer.from(bound['candidate-source.json']).equals(after), 'E_ARCHIVE_HASH', '/applied/s07-v2/archive')
  const candidate = JSON.parse(bound['candidate.json']), review = JSON.parse(bound['independent-review.json'])
  const original = JSON.parse(before), replay = structuredClone(original)
  check(candidate.schema === 's07-reviewed-fullbody-prose-candidate.v2'
    && candidate.source.path === source.sourcePath && candidate.source.sha256 === b.beforeSha256
    && candidate.candidateParsedSha256 === '606c93d665bdd69b5e90d44102a8186f58f77c8666b0260477bd71b9c194e132'
    && candidate.counts.cards === 61 && candidate.counts.blocks === 664
    && candidate.operations.length === 766 && candidate.counts.operations === 766
    && candidate.dispositions.length === 491 && candidate.workBindings.length === 73
    && review.verdict === 'PASS' && review.source.sha256 === b.beforeSha256
    && review.candidate.sha256 === expectedPins['candidate.json'].sha256
    && review.candidate.parsedReplaySha256 === candidate.candidateParsedSha256
    && review.coverage.operationsReplayed === 766 && review.coverage.cards === 61
    && review.coverage.approvedWorkBindingsChecked === 73 && review.findings.length === 0,
  'E_REVIEW_COVERAGE', '/applied/s07-v2/authority')
  const seen = new Set()
  for (const op of candidate.operations) {
    const parts = op.path.slice(1).split('/'), key = parts.pop()
    const parent = parts.reduce((value, part) => value?.[part], replay)
    check(op.op === 'replace' && op.path.startsWith('/content/') && !seen.has(op.path)
      && parent && Object.hasOwn(parent, key) && eq(parent[key], op.before)
      && sha256(JSON.stringify(op.before)) === op.beforeSha256
      && sha256(JSON.stringify(op.after)) === op.afterSha256,
    'E_REVIEW_HASH', '/applied/s07-v2/operation', op.path)
    seen.add(op.path)
    parent[key] = op.after
  }
  const inventory = JSON.parse(bound['inventory-and-diffs.json'])
  check(inventory.diffs.length === 766 && inventory.counts.operations === 766, 'E_REVIEW_COVERAGE', '/applied/s07-v2/inventory')
  for (const [index, op] of candidate.operations.entries()) {
    const diff = inventory.diffs[index]
    check(diff.path === op.path && diff.before === (typeof op.before === 'string' ? op.before : JSON.stringify(op.before))
      && diff.after === (typeof op.after === 'string' ? op.after : JSON.stringify(op.after)),
    'E_REVIEW_HASH', '/applied/s07-v2/inventory', op.path)
  }
  const work = JSON.parse(bound.workPacket)
  const workRefs = work.operations.filter(op => op.file === source.sourcePath && op.locationRef)
  check(work.status === 'applied' && work.batchId === 'giant-s07' && workRefs.length === 73
    && work.approvalBindings[0].sha256 === expectedPins.workOwner.sha256,
  'E_REVIEW_COVERAGE', '/applied/s07-v2/work')
  for (const binding of candidate.workBindings) {
    const ref = workRefs.find(op => op.personId === binding.personId && op.path === binding.path
      && op.locationRef.dongId === binding.dongId)
    const value = binding.path.slice(1).split('/').reduce((node, part) => node?.[part], replay)
    check(ref && ref.locationRef.kind === 'work' && ref.locationRef.status === 'applied'
      && ref.locationRef.doesNotGrantLand === true && ref.locationRef.exactFacilityBoundaryEstablished === false
      && binding.koPath === binding.path + '/ko' && binding.enPath === binding.path + '/en'
      && value?.ko === binding.koAfter && value?.en === binding.enAfter
      && binding.koAfter.includes(binding.dongName) && binding.enAfter.includes(binding.dongName)
      && seen.has(binding.koPath) && seen.has(binding.enPath),
    'E_REVIEW_COVERAGE', '/applied/s07-v2/work-binding', binding.path)
  }
  const cards = JSON.parse(bound['full-cards.json']).cards
  check(seen.size === 766 && cards.length === 61 && candidate.sourceCardAnchors.length === 61
    && sha256(JSON.stringify(replay)) === candidate.candidateParsedSha256
    && eq(replay, JSON.parse(bound['candidate-source.json']))
    && Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after)
    && original.content.length === 664 && replay.content.length === 664
    && eq(original.data, replay.data)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s07-v2/forward')
  const render = (blocks, locale) => blocks.map(block => block.kind === 'heading'
    ? '#'.repeat(block.depth) + ' ' + block.text[locale]
    : block.kind === 'list' ? block.items.map(item => '- ' + (Array.isArray(item[locale])
      ? item[locale].map(span => span.text).join('') : item[locale])).join('\n')
      : Array.isArray(block.text[locale]) ? block.text[locale].map(span => span.text).join('') : block.text[locale]).join('\n\n')
  let next = 0
  for (const [index, card] of cards.entries()) {
    const anchor = candidate.sourceCardAnchors[index]
    check(card.personId === anchor.personId && card.anchor === anchor.anchor
      && card.blockStart === anchor.start && card.blockEnd === anchor.end
      && card.blockStart === next && sha256(JSON.stringify(original.content.slice(card.blockStart, card.blockEnd + 1))) === anchor.sourceCardSha256,
    'E_REVIEW_COVERAGE', '/applied/s07-v2/card', card.personId)
    next = card.blockEnd + 1
    for (const [stage, document] of [['before', original], ['after', replay]]) for (const locale of ['ko', 'en']) {
      const rendered = render(document.content.slice(card.blockStart, card.blockEnd + 1), locale)
      const suffix = locale === 'ko' ? 'Ko' : 'En'
      check(rendered === card[stage][locale] && sha256(rendered) === card.hashes[stage + suffix],
        'E_REVIEW_HASH', '/applied/s07-v2/card-render', card.personId)
    }
  }
  check(next === 664 && JSON.parse(bound['verification.json']).exitCode === 0
    && JSON.parse(bound['operation-contract.json']).schema === 's07-operation-contract.v2',
  'E_REVIEW_COVERAGE', '/applied/s07-v2/inputs')
  return before
}

async function validateS09V3Source(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S09_V3_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  check(prefix.length === 90 && prefix[89].batchId === S07_V2_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256,
  'E_APPROVAL_BATCH', '/applied/s09-v3/prefix')
  const source = { sourcePath: 'lore/characters/Cast-State-09.json', beforeSha256: b.beforeSha256,
    afterSha256: b.afterSha256, beforeBytes: 477246, afterBytes: 452965, changed: true, sealed: false }
  const directory = '.omo/private/seoul-migration/s09-reviewed-fullbody-prose-candidate-20261016-v3/'
  const hashes = {
    'candidate.json': '7ef52967a35b74b773ec6dc2adcb3f343d5801a9bc6ab928dfe8f9e7c990b434',
    'source-candidate.json': b.afterSha256,
    'independent-review.json': '049eadbe1b2854e6292bc55c83ac9a5037fb28b68d266284dc90d1c61105fd4b',
    'independent-review.md': '26e3ea56e2c9d72800b24ef021ec578e872402407853c0740878e3165a98c550',
    'README.md': '64501fed7fa65b47721359274386a55ac38ff8224ffd174004cb4c93b0bd84a6',
    'full-cards.json': 'e42822c24c55ddb57a165693bafa27c6bf55fb3485087850960d10afdd37024a',
    'location-proof.json': '950fe3e215be05ff38a98aff2b2cf1898f43050140c078f65479e429a523dc69',
    'narrative-proof.json': 'd57e9d5a95541e3f8b3850a3e619db7c20f715bf0dd7f8cc1b3c301d5f236914',
    'finding-dispositions.json': '83baecb44eb93ef96edf66ca8606ef12e4bf2fc7c2f8cd858d2557507efd8016',
    'replay-result.json': '06a6be01478c7de137b9b6675df9d5ad159649f124f8fb50df217453263db1e9',
    'source-before.json': b.beforeSha256,
    owner: '82c3a7f627616a9e11832857df4f2ae6c241f2c66f498217a5271a2d30f2bf75',
    workPacket: '9494007ef089329ace6475dd9df5507827ea36d51778b5d02571e8eb96ea4dd8',
    workOwner: 'ab373f62dfd42fb00c1201696a371b595c203cebcab5c0763986f3fe058c7fdb',
    beforeArchive: b.archiveSha256,
  }
  const paths = Object.fromEntries(Object.keys(hashes).map(name => [name, name === 'owner'
    ? '.omo/evidence/seoul-lock/owner-remaining-recommendations-approval-20261015.md'
    : name === 'workPacket' ? '.omo/private/seoul-migration/giant-s09-applied-staging/combined-packet.json'
      : name === 'workOwner' ? '.omo/evidence/seoul-lock/task-8-owner-batch-approvals-20261015.md'
        : name === 'beforeArchive' ? b.directory + 'before-raw.json' : directory + name]))
  const pins = Object.fromEntries(Object.entries(hashes).map(([name, digest]) => [name, { path: paths[name], sha256: digest }]))
  check(eq(JSON.parse(packetBytes), { schema: 'seoul-s09-v3-reviewed-source-application.v1', batchId: b.id,
    registryPrefix: { count: 90, sha256: b.prefixSha256 }, source, operationCount: 617,
    pins, scope: { privateSourceOnly: true, publicationReview: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(manifest, { schema: 'seoul-source-before-after.v1', batchId: b.id, sources: [source] })
    && sha256(await readBytes(resolve(root, b.directory + 'source-before-after.json'))) === b.manifestSha256
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 617,
      sourceBeforeAfterPath: b.directory + 'source-before-after.json',
      applicationReview: { evidencePath: pins['independent-review.json'].path, evidenceSha256: pins['independent-review.json'].sha256 },
      approvals: [{ kind: 'owner-remaining-recommendations', bodySha256: pins.owner.sha256, messageRef: pins.owner.path }] }),
  'E_APPROVAL_BATCH', '/applied/s09-v3/packet')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s09-v3/input', name)
    bound[name] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive)
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  check(archive.schema === 'seoul-s09-v3-original-raw-archive.v1' && archive.sourcePath === source.sourcePath
    && archive.rawSha256 === b.beforeSha256 && archive.rawBytes === before.length
    && before.length === source.beforeBytes && sha256(before) === b.beforeSha256
    && Buffer.from(bound['source-before.json']).equals(before)
    && after.length === source.afterBytes && sha256(after) === b.afterSha256
    && Buffer.from(bound['source-candidate.json']).equals(after), 'E_ARCHIVE_HASH', '/applied/s09-v3/archive')
  const candidate = JSON.parse(bound['candidate.json']), review = JSON.parse(bound['independent-review.json'])
  const original = JSON.parse(before), replay = structuredClone(original)
  check(candidate.schema === 's09-reviewed-fullbody-prose-candidate.v1'
    && candidate.source.path === source.sourcePath && candidate.source.rawSha256 === b.beforeSha256
    && candidate.operationCount === 617 && candidate.operations.length === 617
    && candidate.cardCount === 62 && candidate.blockCount === 675 && candidate.unchangedAppendices === 61
    && candidate.candidateParsedJsonSha256 === '0b745cd565000410ed3f8ff859acc70b1113b01a7d9e82392b69d524b578a9ba'
    && review.verdict === 'PASS-private-candidate-not-source-or-publication-approval'
    && review.sourceRawSha256 === b.beforeSha256 && review.candidateRawSha256 === pins['candidate.json'].sha256
    && review.fullCardsRawSha256 === pins['full-cards.json'].sha256
    && review.candidateParsedJsonSha256 === candidate.candidateParsedJsonSha256
    && review.findings.length === 0 && review.coverage.operations === 617
    && review.coverage.cards === 62 && review.coverage.locationBindings === 78
    && review.boundaries.ownerFullBodyApproval === false && review.boundaries.publicationApproved === false,
  'E_REVIEW_COVERAGE', '/applied/s09-v3/authority')
  const seen = new Set()
  for (const op of candidate.operations) {
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(), parent = parts.reduce((value, part) => value?.[part], replay)
    check(op.op === 'replace' && op.file === source.sourcePath && op.path.startsWith('/content/')
      && !seen.has(op.path) && parent && Object.hasOwn(parent, key) && eq(parent[key], op.before)
      && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s09-v3/operation', op.path)
    seen.add(op.path)
    parent[key] = op.value
  }
  check(seen.size === 617 && sha256(JSON.stringify(replay)) === candidate.candidateParsedJsonSha256
    && eq(replay, JSON.parse(bound['source-candidate.json']))
    && Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(after)
    && original.content.length === 675 && replay.content.length === 675 && eq(original.data, replay.data)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s09-v3/forward')
  const work = JSON.parse(bound.workPacket)
  const workRefs = work.operations.filter(op => op.file === source.sourcePath && op.locationRef)
  const locations = JSON.parse(bound['location-proof.json']).bindings
  check(work.status === 'applied' && work.batchId === 'giant-s09' && workRefs.length === 78
    && work.approvalBindings[0].sha256 === pins.workOwner.sha256 && locations.length === 78,
  'E_REVIEW_COVERAGE', '/applied/s09-v3/work')
  for (const binding of locations) {
    const ref = workRefs.find(op => op.personId === binding.personId && op.path === binding.pointer)
    const value = pointer(replay, binding.pointer)
    check(ref && Object.entries(binding.locationRef).every(([name, value]) => eq(ref.locationRef[name], value))
      && eq(ref.value, binding.before)
      && eq(value, binding.after) && binding.locationRef.doesNotGrantLand === true
      && ['ko', 'en'].every(locale => seen.has(binding.pointer + '/' + locale)),
    'E_REVIEW_COVERAGE', '/applied/s09-v3/binding', binding.pointer)
  }
  const cards = JSON.parse(bound['full-cards.json']).cards
  let next = 0
  check(cards.length === 62, 'E_REVIEW_COVERAGE', '/applied/s09-v3/cards')
  for (const card of cards) {
    check(card.start === next && card.end >= next && card.end < 675
      && sha256(JSON.stringify(original.content.slice(card.start, card.end + 1))) === card.sourceCardJsonSha256,
    'E_REVIEW_COVERAGE', '/applied/s09-v3/card', card.personId)
    for (const [stage, document] of [['before', original], ['after', replay]]) for (const locale of ['ko', 'en']) {
      const rendered = renderLoreMarkdown({ ...document, content: document.content.slice(card.start, card.end + 1) }, locale)
      check(rendered === card[stage][locale] && sha256(rendered) === card.hashes[stage][locale],
        'E_REVIEW_HASH', '/applied/s09-v3/card-render', card.personId)
    }
    next = card.end + 1
  }
  check(next === 675, 'E_REVIEW_COVERAGE', '/applied/s09-v3/card-partition')
  for (const locale of ['ko', 'en']) check(sha256(renderLoreMarkdown(replay, locale)) === candidate.renderedFullDocumentSha256[locale]
    && candidate.renderedFullDocumentSha256[locale] === review.fullDocumentBodyHashes[locale],
  'E_REVIEW_HASH', '/applied/s09-v3/render', locale)
  const narrative = JSON.parse(bound['narrative-proof.json'])
  const dispositions = JSON.parse(bound['finding-dispositions.json'])
  check(narrative.birthdays.length === 62 && narrative.retainedOffices.length === 2
    && narrative.preservedRights.length === 2 && narrative.ambiguousCausality.length === 2
    && dispositions.sourceSha256 === b.beforeSha256 && dispositions.findings.length === 304
    && JSON.parse(bound['replay-result.json']).operations === 617,
  'E_REVIEW_COVERAGE', '/applied/s09-v3/proofs')
  return before
}

async function validateProfileTwoReferenceSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = PROFILE_TWO_REFERENCE_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const source = { sourcePath: 'lore/editorial/profile-batches/state-09-10.json', beforeSha256: b.beforeSha256,
    beforeBytes: 1212167, afterSha256: b.afterSha256, afterBytes: 1212237 }
  const pins = {
    authorization: { path: '.omo/evidence/seoul-lock/profile-two-reference-source-application-authorization-20261016.md', sha256: '9cdfa139a7f30b18f2e1e2b649f868527ccefd36ffa35cd1c925a1ebdd72bd37' },
    candidate: { path: '.omo/private/seoul-migration/profile-two-reference-repair-candidate-20261016/candidate-packet.json', sha256: '837fbcb8d96796c395c8b9b1ce495f2a2b86872579c1e250b047e53da5eb30d8' },
    beforeArchive: { path: '.omo/private/seoul-migration/profile-two-reference-repair-candidate-20261016/before-raw.json', sha256: b.archiveSha256 },
    candidateReviewMarkdown: { path: '.omo/private/seoul-migration/profile-two-reference-repair-candidate-20261016/independent-review.md', sha256: '5b8a8326519f107966ec677fa827f20947cb255daa578b3df956fea6fad723cd' },
    candidateReviewJson: { path: '.omo/private/seoul-migration/profile-two-reference-repair-candidate-20261016/independent-review.json', sha256: '395e44636f4f9f30f75bf562d2925710899b44ee4075d00099cd1bc967fd589e' },
    applicationResult: { path: b.directory + 'application-result.md', sha256: '4d556265c41d1e5cb0f036a745603b8472a7a0c6dd6658a7b22770672a802c2f' },
    appliedAuditMarkdown: { path: b.directory + 'independent-applied.md', sha256: 'bccc3279d46a011346aecbf17ee05a948913df0ad6a0c4417e0dc3eb539ee92f' },
    appliedAuditJson: { path: b.directory + 'independent-applied.json', sha256: 'f131ae3f1228007339cf98f670468396a1516a2c729aca279f4eca43cb0abeb3' },
    manifest: { path: b.directory + 'source-before-after.json', sha256: b.manifestSha256 },
  }
  check(prefix.length === 91 && prefix[90].batchId === S09_V3_SOURCE.id && sha256(prefixBytes) === b.prefixSha256
    && sha256(packetBytes) === b.packetSha256
    && eq(JSON.parse(packetBytes), { schema: 'seoul-profile-two-reference-source-successor.v1', batchId: b.id,
      registryPrefix: { count: 91, sha256: b.prefixSha256 }, source, operationCount: 2, pins,
      scope: { privateSourceOnly: true, publicationReview: false, semanticNarrativeApproval: false,
        grantCount: 0, entityActivationCount: 0 } })
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 2,
      sourceBeforeAfterPath: pins.manifest.path,
      applicationReview: { evidencePath: pins.appliedAuditJson.path, evidenceSha256: pins.appliedAuditJson.sha256 },
      approvals: [{ kind: 'profile-two-reference-source-application', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/profile-two-reference')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/profile-two-reference/input', name)
    bound[name] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive)
  const before = gunzipSync(Buffer.from(archive.gzipBase64, 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  const candidate = JSON.parse(bound.candidate)
  const candidateReview = JSON.parse(bound.candidateReviewJson)
  const appliedAudit = JSON.parse(bound.appliedAuditJson)
  check(archive.schema === 'seoul-profile-two-reference-repair-before-raw.v1'
    && archive.sourcePath === source.sourcePath && archive.rawSha256 === b.beforeSha256
    && archive.rawBytes === before.length && before.length === source.beforeBytes && sha256(before) === b.beforeSha256
    && after.length === source.afterBytes && sha256(after) === b.afterSha256,
  'E_ARCHIVE_HASH', '/applied/profile-two-reference/archive')
  check(candidate.schema === 'seoul-profile-two-reference-repair-candidate.v1'
    && candidate.source.path === source.sourcePath && candidate.source.beforeSha256 === b.beforeSha256
    && candidate.source.afterSha256 === b.afterSha256 && candidate.operationCount === 2
    && candidate.operations.length === 2 && candidate.inverseOperations.length === 2
    && eq(candidate.operations.map(op => op.path), ['/profiles/14/skills/0/basis', '/profiles/15/skills/0/basis'])
    && candidateReview.verdict === 'BOUNDED-CONFIRMED' && candidateReview.scopeProof.operationCount === 2
    && appliedAudit.verdict === 'BOUNDED-CONFIRMED' && appliedAudit.scopeProof.operationCount === 2
    && appliedAudit.authentication.liveAfterSha256 === b.afterSha256
    && appliedAudit.scopeProof.stableOrderedPersonIdsUnchanged === true
    && appliedAudit.boundaries.metadataApplied === false && appliedAudit.boundaries.statusPromoted === false,
  'E_REVIEW_COVERAGE', '/applied/profile-two-reference/authority')
  let replay = Buffer.from(before)
  for (const op of candidate.operations) {
    const oldBytes = Buffer.from(JSON.stringify(op.oldValue)), newBytes = Buffer.from(JSON.stringify(op.value))
    const first = replay.indexOf(oldBytes)
    check(op.op === 'replace' && op.file === source.sourcePath && first !== -1
      && replay.indexOf(oldBytes, first + 1) === -1 && sha256(JSON.stringify(op.oldValue)) === op.oldValueSha256
      && sha256(JSON.stringify(op.value)) === op.newValueSha256,
    'E_REVIEW_HASH', '/applied/profile-two-reference/operation', op.path)
    replay = Buffer.concat([replay.subarray(0, first), newBytes, replay.subarray(first + oldBytes.length)])
  }
  check(replay.equals(after), 'E_REVIEW_HASH', '/applied/profile-two-reference/forward')
  let inverse = Buffer.from(after)
  for (const op of candidate.inverseOperations) {
    const oldBytes = Buffer.from(JSON.stringify(op.oldValue)), newBytes = Buffer.from(JSON.stringify(op.value))
    const first = inverse.indexOf(oldBytes)
    check(first !== -1 && inverse.indexOf(oldBytes, first + 1) === -1, 'E_REVIEW_HASH', '/applied/profile-two-reference/inverse', op.path)
    inverse = Buffer.concat([inverse.subarray(0, first), newBytes, inverse.subarray(first + oldBytes.length)])
  }
  const beforeJson = JSON.parse(before), afterJson = JSON.parse(after)
  check(inverse.equals(before) && manifest.schema === 'seoul-profile-two-reference-source-application.v1'
    && manifest.scope.file === source.sourcePath && manifest.scope.operationCount === 2
    && manifest.scope.onlyAuthorizedLeavesChanged === true && manifest.source.beforeSha256 === b.beforeSha256
    && manifest.source.beforeBytes === source.beforeBytes && manifest.source.afterSha256 === b.afterSha256
    && manifest.source.afterBytes === source.afterBytes && manifest.source.sealedCandidateAfterHashMatched === true
    && manifest.source.noReserialization === true && manifest.source.orderedStablePersonIdsCount === 122
    && manifest.source.orderedStablePersonIdsSha256 === '615557065b5bb68b97d97687b07c70e678affaa0a7abdff2a50ecde4d0c9cfb2'
    && eq(Object.keys(beforeJson), Object.keys(afterJson)) && beforeJson.profiles.length === 122 && afterJson.profiles.length === 122
    && eq(beforeJson.profiles.map(row => row.personId), afterJson.profiles.map(row => row.personId)),
  'E_REVIEW_HASH', '/applied/profile-two-reference/manifest')
  manifest.sources = [source]
  return before
}

async function validateS11ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S11_REVIEWED_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const source = { sourcePath: 'lore/characters/Cast-State-11.json', beforeSha256: b.beforeSha256,
    beforeBytes: 457140, afterSha256: b.afterSha256, afterBytes: 311019 }
  const pins = {
    authorization: { path: '.omo/evidence/seoul-lock/s11-source-application-authorization-20261016.md', sha256: '9c78ce460c683fd2bd84cfee3cda9943e20a0a5b59f10f27721a517a40468f3a' },
    candidate: { path: '.omo/private/seoul-migration/s11-reviewed-fullbody-prose-candidate-20261016/candidate.json', sha256: 'ba86743ce07f5610ee1e4c70f454e7723074ed3423265f8c294adfc4ecc04b4e' },
    beforeArchive: { path: '.omo/private/seoul-migration/s11-reviewed-fullbody-prose-candidate-20261016/source-before.json', sha256: b.beforeSha256 },
    sealedManifest: { path: '.omo/private/seoul-migration/s11-reviewed-fullbody-prose-candidate-20261016/manifest.json', sha256: '4d0152c9f1d74fddaea784859acbc8130e18ec982f7f6b03867f86050d4f34ed' },
    confirmationJson: { path: '.omo/private/seoul-migration/s11-reviewed-fullbody-prose-candidate-20261016/independent-confirmation.json', sha256: 'c0df731c01da996e1645b9a8cbeaf8f1cd80138c11cf7980796a07789fcac67d' },
    applicationResult: { path: b.directory + 'application-result.md', sha256: 'e2778305bf7c54d953c96972c03a99f42e82c46009bf34b1ef714d324b2f1a6e' },
    sourceManifest: { path: b.directory + 'source-before-after.json', sha256: b.manifestSha256 },
    independentAppliedMarkdown: { path: b.directory + 'independent-applied.md', sha256: '6489390e9ee555fdeb170c2e5ebd39793038a95455c01ece7bc4d594919cd6af' },
    independentAppliedJson: { path: b.directory + 'independent-applied.json', sha256: '76aa1a3716f863025b2132a3c335d110282e80056de29106b42e3d878b7ea1e8' },
  }
  check(prefix.length === 92 && prefix[91].batchId === PROFILE_TWO_REFERENCE_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256
    && eq(JSON.parse(packetBytes), { schema: 'seoul-s11-reviewed-source-successor.v1', batchId: b.id,
      registryPrefix: { count: 92, sha256: b.prefixSha256 }, source, operationCount: 476, pins,
      scope: { personIds: [], privateSourceOnly: true, publicationReview: false,
        semanticNarrativeApproval: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 476,
      sourceBeforeAfterPath: pins.sourceManifest.path,
      applicationReview: { evidencePath: pins.independentAppliedJson.path, evidenceSha256: pins.independentAppliedJson.sha256 },
      approvals: [{ kind: 's11-source-application', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/s11')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s11/input', name)
    bound[name] = bytes
  }
  const before = Buffer.from(bound.beforeArchive)
  const after = await readBytes(resolve(root, source.sourcePath))
  const candidate = JSON.parse(bound.candidate)
  const sealedManifest = JSON.parse(bound.sealedManifest)
  const confirmation = JSON.parse(bound.confirmationJson)
  const appliedAudit = JSON.parse(bound.independentAppliedJson)
  check(before.length === source.beforeBytes && sha256(before) === source.beforeSha256
    && after.length === source.afterBytes && sha256(after) === source.afterSha256,
  'E_ARCHIVE_HASH', '/applied/s11/archive')
  check(sealedManifest.schema === 's11-candidate-manifest.v3'
    && sealedManifest.candidateParsedJsonSha256 === source.afterSha256
    && Object.keys(sealedManifest.files).length === 22,
  'E_REVIEW_COVERAGE', '/applied/s11/sealed-manifest')
  const candidateDirectory = '.omo/private/seoul-migration/s11-reviewed-fullbody-prose-candidate-20261016/'
  for (const [name, seal] of Object.entries(sealedManifest.files)) {
    let bytes
    try { bytes = await readBytes(resolve(root, candidateDirectory + name)) } catch (error) {
      const knownMissing = name === 'independent-rereview.json' && seal.bytes === 5648 && seal.sha256 === '0ed23e1e6007ae54da3383c0b1c609f49423c6c2a86d6d5fed313e525f3a373d'
        || name === 'independent-rereview.md' && seal.bytes === 7714 && seal.sha256 === 'f319eb1328631ed78841487c421bc9fedee9b5364f1222224655583f000e816a'
      check(error.code === 'ENOENT' && knownMissing,
      'E_REVIEW_HASH', '/applied/s11/sealed-file', name)
      continue
    }
    check(bytes.length === seal.bytes && sha256(bytes) === seal.sha256,
      'E_REVIEW_HASH', '/applied/s11/sealed-file', name)
  }
  check(candidate.schema === 's11-private-reviewed-fullbody-prose-candidate.v1'
    && candidate.source.path === source.sourcePath && candidate.source.rawSha256 === source.beforeSha256
    && candidate.source.bytes === source.beforeBytes && candidate.counts.operations === 476
    && candidate.operations.length === 476 && candidate.counts.cards === 61 && candidate.counts.blocks === 664
    && candidate.counts.unchangedNumericAppendices === 60
    && candidate.candidateParsedJsonSha256 === source.afterSha256
    && confirmation.verdict === 'confirmed' && confirmation.authenticated.manifestRawSha256 === pins.sealedManifest.sha256
    && confirmation.authenticated.manifestFilesChecked === 22
    && confirmation.mechanicalVerification.uniqueOperations === 476
    && confirmation.mechanicalVerification.newGrantHoldingAppointmentOrTerritorialOperations === 0
    && appliedAudit.verdict === 'CONFIRMED' && appliedAudit.changeSet.operations === 476
    && appliedAudit.changeSet.uniqueOperationPaths === 476
    && appliedAudit.source.liveRawSha256 === source.afterSha256
    && appliedAudit.preimage.rawSha256 === source.beforeSha256 && appliedAudit.preimage.authenticated === true
    && appliedAudit.protectedFacts.newGrantHoldingAppointmentLandOrTerritorialOperations === 0
    && appliedAudit.protectedFacts.sealedOperationPathsTouchProtectedStructuredFields === false,
  'E_REVIEW_COVERAGE', '/applied/s11/authority')
  const original = JSON.parse(before), replay = structuredClone(original), seen = new Set()
  for (const op of candidate.operations) {
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(), parent = parts.reduce((value, part) => value?.[part], replay)
    check(op.op === 'replace' && op.file === source.sourcePath && op.path.startsWith('/content/')
      && !seen.has(op.path) && parent && Object.hasOwn(parent, key) && eq(parent[key], op.before)
      && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s11/operation', op.path)
    seen.add(op.path)
    parent[key] = op.value
  }
  check(seen.size === 476 && sha256(JSON.stringify(replay)) === candidate.candidateParsedJsonSha256
    && Buffer.from(JSON.stringify(replay)).equals(after)
    && original.content.length === 664 && replay.content.length === 664 && eq(original.data, replay.data)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s11/forward')
  check(manifest.schema === 's11-reviewed-source-application.v1'
    && manifest.authorization.path === pins.authorization.path
    && manifest.authorization.rawSha256 === pins.authorization.sha256
    && manifest.source.path === source.sourcePath
    && manifest.source.before.rawSha256 === source.beforeSha256 && manifest.source.before.bytes === source.beforeBytes
    && manifest.source.after.rawSha256 === source.afterSha256 && manifest.source.after.bytes === source.afterBytes
    && manifest.application.uniqueLeafReplacements === 476 && manifest.application.inverseReplayRestoredBefore === true
    && manifest.verification.cards === 61 && manifest.verification.blocks === 664
    && manifest.protectedFacts.structuredTitleChanges === 0
    && manifest.protectedFacts.newGrantHoldingAppointmentOrTerritorialOperations === 0,
  'E_REVIEW_HASH', '/applied/s11/manifest')
  manifest.sources = [source]
  return before
}

async function validateS10ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S10_REVIEWED_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const source = { sourcePath: 'lore/characters/Cast-State-10.json', beforeSha256: b.beforeSha256,
    beforeBytes: 484578, afterSha256: b.afterSha256, afterBytes: 458439 }
  const pins = {
    authorization: { path: '.omo/evidence/seoul-lock/s10-source-application-authorization-20261016.md', sha256: 'f192dc5456d438dce49451c99faf743bbbe80876c418835159269b2006e1a9e5' },
    candidateManifest: { path: '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/candidate.json', sha256: '33f0c07bc622b19f94593994fcc45d82fa62f8753f45def5c11bbeaf17943a38' },
    sourceCandidate: { path: '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/source-candidate.json', sha256: b.afterSha256 },
    beforeArchive: { path: '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/source-before.json', sha256: b.beforeSha256 },
    artifactHashes: { path: '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/artifact-hashes.json', sha256: '87de6b406ab145b9a7df8320d79c37364711e7b30690c76363e8b632bda86daa' },
    round3ConfirmationMarkdown: { path: '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/independent-confirmation-round3.md', sha256: 'ea7e027574de7b73f5db58af4f514a3080b5e533c2fbe3ceee5a08d1fbd11c1d' },
    externalAuthorityDigest: { path: '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/external-authority-digest.json', sha256: '2b794e76c882c63b08c25e3564ea57a356af9b277ad87aca511e09439378fea1' },
    applicationResult: { path: b.directory + 'application-result.md', sha256: '5a6a890a430800520d2018d71d081972af46d79d20d4b62cbebaee02b8cf99be' },
    sourceManifest: { path: b.directory + 'source-before-after.json', sha256: b.manifestSha256 },
    independentAppliedMarkdown: { path: b.directory + 'independent-applied.md', sha256: 'd468f5072e31c8a7e4d98a3e4f050351869f5f6485124462990e19291efa426e' },
    independentAppliedJson: { path: b.directory + 'independent-applied.json', sha256: '2fbec8861d23536d763960e948550e00fc6eddf9a79e9d6d143cb2875dff8858' },
  }
  check(prefix.length === 93 && prefix[92].batchId === S11_REVIEWED_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256
    && eq(JSON.parse(packetBytes), { schema: 'seoul-s10-reviewed-source-successor.v1', batchId: b.id,
      registryPrefix: { count: 93, sha256: b.prefixSha256 }, source, operationCount: 900, pins,
      scope: { personIds: [], privateSourceOnly: true, publicationReview: false,
        semanticNarrativeApproval: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 900,
      sourceBeforeAfterPath: pins.sourceManifest.path,
      applicationReview: { evidencePath: pins.independentAppliedJson.path, evidenceSha256: pins.independentAppliedJson.sha256 },
      approvals: [{ kind: 's10-source-application', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/s10')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s10/input', name)
    bound[name] = bytes
  }
  const before = Buffer.from(bound.beforeArchive)
  const candidateBytes = Buffer.from(bound.sourceCandidate)
  const after = await readBytes(resolve(root, source.sourcePath))
  const candidate = JSON.parse(bound.candidateManifest)
  const artifactHashes = JSON.parse(bound.artifactHashes)
  const digest = JSON.parse(bound.externalAuthorityDigest)
  const appliedAudit = JSON.parse(bound.independentAppliedJson)
  check(before.length === source.beforeBytes && sha256(before) === source.beforeSha256
    && candidateBytes.length === source.afterBytes && sha256(candidateBytes) === source.afterSha256
    && after.length === source.afterBytes && sha256(after) === source.afterSha256
    && after.equals(candidateBytes),
  'E_ARCHIVE_HASH', '/applied/s10/archive')
  check(candidate.schema === 'seoul.s10-reviewed-fullbody-prose-candidate.v5'
    && candidate.source.path === source.sourcePath && candidate.source.rawSha256 === source.beforeSha256
    && candidate.source.bytes === source.beforeBytes && candidate.operationCount === 900
    && candidate.cardCount === 63 && candidate.blockCount === 675
    && candidate.candidateParsedJsonSha256 === '79391d3aa1afa322b334cd4c8cb529db03ffac312da28818a53e5be7bef71e90',
  'E_REVIEW_COVERAGE', '/applied/s10/candidate')
  check(artifactHashes.schema === 'seoul.s10-round2-artifact-hashes.v5'
    && artifactHashes.artifacts.length === 20,
  'E_REVIEW_COVERAGE', '/applied/s10/artifacts')
  const candidateDirectory = '.omo/private/seoul-migration/s10-reviewed-fullbody-prose-candidate-20261016/'
  for (const seal of artifactHashes.artifacts) {
    const bytes = await readBytes(resolve(root, candidateDirectory + seal.path))
    check(bytes.length === seal.bytes && sha256(bytes) === seal.rawSha256,
      'E_REVIEW_HASH', '/applied/s10/sealed-file', seal.path)
  }
  check(digest.schema === 'seoul.s10-external-authority-digest.v2'
    && digest.counts.preservedFacts === 875 && digest.counts.displaced === 8
    && appliedAudit.schema === 'seoul.s10-independent-applied-audit.v1'
    && appliedAudit.verdict === 'BOUNDED-CONFIRMED'
    && appliedAudit.authentication.liveRawSha256 === source.afterSha256
    && appliedAudit.authentication.archivePreimageRawSha256 === source.beforeSha256
    && appliedAudit.scopeProof.operationCount === 900 && appliedAudit.scopeProof.uniqueOperationPaths === 900
    && appliedAudit.scopeProof.forwardReplayByteExact === true && appliedAudit.scopeProof.inverseReplayByteExact === true
    && appliedAudit.invariants.roster === 63 && appliedAudit.invariants.blocksBefore === 675
    && appliedAudit.invariants.blocksAfter === 675 && appliedAudit.invariants.numericAppendixMismatches === 0
    && appliedAudit.protectedFacts.structuredTitleRankGrantHoldingAppointmentChanges === 0,
  'E_REVIEW_COVERAGE', '/applied/s10/authority')
  const operations = JSON.parse(await readBytes(resolve(root, candidateDirectory + 'operations.json')))
  const original = JSON.parse(before), replay = structuredClone(original), seen = new Set()
  check(operations.schema === 'seoul.s10-operations.v5' && operations.operations.length === 900,
    'E_REVIEW_COVERAGE', '/applied/s10/operations')
  for (const op of operations.operations) {
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(), parent = parts.reduce((value, part) => value?.[part], replay)
    check(op.op === 'replace' && op.file === source.sourcePath && op.path.startsWith('/content/')
      && !seen.has(op.path) && parent && Object.hasOwn(parent, key) && eq(parent[key], op.before)
      && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s10/operation', op.path)
    seen.add(op.path)
    parent[key] = op.value
  }
  check(seen.size === 900 && sha256(JSON.stringify(replay)) === candidate.candidateParsedJsonSha256
    && eq(replay, JSON.parse(candidateBytes))
    && original.content.length === 675 && replay.content.length === 675 && eq(original.data, replay.data)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s10/forward')
  check(manifest.schema === 's10-reviewed-source-application.v1'
    && manifest.authorization.path === pins.authorization.path
    && manifest.authorization.rawSha256 === pins.authorization.sha256
    && manifest.source.path === source.sourcePath
    && manifest.source.before.rawSha256 === source.beforeSha256 && manifest.source.before.bytes === source.beforeBytes
    && manifest.source.after.rawSha256 === source.afterSha256 && manifest.source.after.bytes === source.afterBytes
    && manifest.source.after.parsedJsonSha256 === candidate.candidateParsedJsonSha256
    && manifest.application.uniqueLeafReplacements === 900 && manifest.application.inverseReplayRestoredBefore === true
    && manifest.verification.cards === 63 && manifest.verification.blocks === 675
    && manifest.verification.numericAppendicesUnchanged === 61,
  'E_REVIEW_HASH', '/applied/s10/manifest')
  manifest.sources = [source]
  return before
}

async function validateS13ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S13_REVIEWED_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const source = { sourcePath: 'lore/characters/Cast-State-13.json', beforeSha256: b.beforeSha256,
    beforeBytes: 487198, afterSha256: b.afterSha256, afterBytes: 489235 }
  const pins = {
    authorization: { path: '.omo/evidence/seoul-lock/s13-source-application-authorization-20261016.md', sha256: '821812cf8f47c9cb056babb32846cbe8df23d1eb7f9702e0817dfca7cc2dede2' },
    candidateManifest: { path: '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/candidate.json', sha256: 'acc4fd0785e221e559a12aaabe6f8245c2e64cbaa87c69b9134fbb009d72f2da' },
    sourceCandidate: { path: '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/source-candidate.json', sha256: b.afterSha256 },
    beforeArchive: { path: '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/source-before.json', sha256: b.beforeSha256 },
    sealedManifest: { path: '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/manifest.json', sha256: 'bd8cf4db8c5401ea4e85e42e925bac912f906bc1c0b92e190cd4da8836fb4720' },
    confirmationMarkdown: { path: '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/independent-confirmation.md', sha256: '935c1c509baf3ca7c44d3a51c85fa90f465710032847225cd2e272b04a689c8b' },
    externalAuthorityDigest: { path: '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/external-authority-digest.json', sha256: '5607adc9f2a463737fa003f7912e7cd97d008e5c455883fdd56018385e84125f' },
    applicationResult: { path: b.directory + 'application-result.md', sha256: '38c0378cdeafc481f06a29e8fb84ec44bf9d656394de5cb09295887afffd2dba' },
    sourceManifest: { path: b.directory + 'source-before-after.json', sha256: b.manifestSha256 },
    independentAppliedMarkdown: { path: b.directory + 'independent-applied.md', sha256: 'b8e10c5f51c1598502c91a9dc300367320fe076a90fa806c8195b0dfc3c9c0e3' },
    independentAppliedJson: { path: b.directory + 'independent-applied.json', sha256: '6685a455877994df9d5a7c6d50a54295c88722c7d6394298fce2868e3260aaef' },
  }
  check(prefix.length === 94 && prefix[93].batchId === S10_REVIEWED_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256
    && eq(JSON.parse(packetBytes), { schema: 'seoul-s13-reviewed-source-successor.v1', batchId: b.id,
      registryPrefix: { count: 94, sha256: b.prefixSha256 }, source, operationCount: 925, pins,
      scope: { personIds: [], privateSourceOnly: true, publicationReview: false,
        semanticNarrativeApproval: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 925,
      sourceBeforeAfterPath: pins.sourceManifest.path,
      applicationReview: { evidencePath: pins.independentAppliedJson.path, evidenceSha256: pins.independentAppliedJson.sha256 },
      approvals: [{ kind: 's13-source-application', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/s13')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s13/input', name)
    bound[name] = bytes
  }
  const before = Buffer.from(bound.beforeArchive)
  const candidateBytes = Buffer.from(bound.sourceCandidate)
  const after = await readBytes(resolve(root, source.sourcePath))
  const candidate = JSON.parse(bound.candidateManifest)
  const sealedManifest = JSON.parse(bound.sealedManifest)
  const digest = JSON.parse(bound.externalAuthorityDigest)
  const appliedAudit = JSON.parse(bound.independentAppliedJson)
  check(before.length === source.beforeBytes && sha256(before) === source.beforeSha256
    && candidateBytes.length === source.afterBytes && sha256(candidateBytes) === source.afterSha256
    && after.length === source.afterBytes && sha256(after) === source.afterSha256 && after.equals(candidateBytes),
  'E_ARCHIVE_HASH', '/applied/s13/archive')
  check(candidate.schema === 'seoul.s13-reviewed-fullbody-prose-candidate.v1'
    && candidate.source.path === source.sourcePath && candidate.source.rawSha256 === source.beforeSha256
    && candidate.source.bytes === source.beforeBytes && candidate.counts.operations === 925
    && candidate.counts.cards === 62 && candidate.counts.blocks === 675
    && candidate.counts.unchangedNumericAppendices === 61
    && candidate.candidateParsedJsonSha256 === 'bb8a0ad5a4f51fb0728f623d43835d141a128d8d8572b3b0e41f13ec3cc0801c',
  'E_REVIEW_COVERAGE', '/applied/s13/candidate')
  check(sealedManifest.schema === 'seoul.s13-candidate-manifest.v1'
    && sealedManifest.candidateParsedJsonSha256 === candidate.candidateParsedJsonSha256
    && Object.keys(sealedManifest.files).length === 37,
  'E_REVIEW_COVERAGE', '/applied/s13/sealed-manifest')
  const candidateDirectory = '.omo/private/seoul-migration/s13-reviewed-fullbody-prose-candidate-20261016/'
  for (const [name, seal] of Object.entries(sealedManifest.files)) {
    const bytes = await readBytes(resolve(root, candidateDirectory + name))
    check(bytes.length === seal.bytes && sha256(bytes) === seal.sha256,
      'E_REVIEW_HASH', '/applied/s13/sealed-file', name)
  }
  check(digest.schema === 'seoul.s13-external-authority-digest.v1'
    && digest.counts.preservedFacts === 867 && digest.counts.displaced === 2
    && appliedAudit.schema === 'seoul.s13-independent-applied-audit.v1'
    && appliedAudit.verdict === 'BOUNDED-CONFIRMED'
    && appliedAudit.authentication.liveRawSha256 === source.afterSha256
    && appliedAudit.authentication.archivePreimageRawSha256 === source.beforeSha256
    && appliedAudit.changeSet.operations === 925 && appliedAudit.changeSet.uniqueOperationPaths === 925
    && appliedAudit.changeSet.forwardReplayByteExact === true && appliedAudit.changeSet.inverseReplayByteExact === true
    && appliedAudit.structure.roster === 62 && appliedAudit.structure.blocks === 675
    && appliedAudit.structure.numericAppendicesUnchanged === 61
    && appliedAudit.protectedFacts.structuredTitleChanges === 0
    && appliedAudit.protectedFacts.structuredRankChanges === 0
    && appliedAudit.protectedFacts.newLandGrants === 0 && appliedAudit.protectedFacts.newAppointments === 0,
  'E_REVIEW_COVERAGE', '/applied/s13/authority')
  const operations = JSON.parse(await readBytes(resolve(root, candidateDirectory + 'operations.json')))
  const original = JSON.parse(before), replay = structuredClone(original), seen = new Set()
  check(operations.schema === 'seoul.s13-leaf-operations.v3' && operations.count === 925
    && operations.operations.length === 925, 'E_REVIEW_COVERAGE', '/applied/s13/operations')
  for (const op of operations.operations) {
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(), parent = parts.reduce((value, part) => value?.[part], replay)
    check(op.op === 'replace' && op.file === source.sourcePath && op.path.startsWith('/content/')
      && !seen.has(op.path) && parent && Object.hasOwn(parent, key) && eq(parent[key], op.before)
      && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s13/operation', op.path)
    seen.add(op.path)
    parent[key] = op.value
  }
  check(seen.size === 925 && sha256(JSON.stringify(replay)) === candidate.candidateParsedJsonSha256
    && eq(replay, JSON.parse(candidateBytes))
    && original.content.length === 675 && replay.content.length === 675 && eq(original.data, replay.data)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s13/forward')
  check(manifest.schema === 's13-reviewed-source-application.v1'
    && manifest.authorization.path === pins.authorization.path
    && manifest.authorization.rawSha256 === pins.authorization.sha256
    && manifest.source.path === source.sourcePath
    && manifest.source.before.rawSha256 === source.beforeSha256 && manifest.source.before.bytes === source.beforeBytes
    && manifest.source.after.rawSha256 === source.afterSha256 && manifest.source.after.bytes === source.afterBytes
    && manifest.source.after.parsedJsonSha256 === candidate.candidateParsedJsonSha256
    && manifest.application.uniqueLeafReplacements === 925 && manifest.application.inverseReplayRestoredBefore === true
    && manifest.verification.cards === 62 && manifest.verification.blocks === 675
    && manifest.verification.numericAppendicesUnchanged === 61,
  'E_REVIEW_HASH', '/applied/s13/manifest')
  manifest.sources = [source]
  return before
}

async function validateS12ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S12_REVIEWED_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const source = { sourcePath: 'lore/characters/Cast-State-12.json', beforeSha256: b.beforeSha256,
    beforeBytes: 480070, afterSha256: b.afterSha256, afterBytes: 514331 }
  const pins = {
    authorization: { path: '.omo/evidence/seoul-lock/s12-source-application-authorization-20261016.md', sha256: '8c4d43ec690b3114dafd34ec0bb0b4d30a805867f59b0435cc69b87ff4043147' },
    sourceCandidate: { path: '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/source-candidate.json', sha256: b.afterSha256 },
    beforeArchive: { path: '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/source-before.json', sha256: b.beforeSha256 },
    operations: { path: '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/operations.json', sha256: 'ca8078edef84c9be81b94dc977c9a4797f23294389fd0b264ff82dab7318869f' },
    inverseOperations: { path: '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/inverse-operations.json', sha256: '3a29fd45159b8f98991968b06d9f7382bb88d8a75c180b5cf357cfdae5f8af38' },
    verifier: { path: '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/verify.mjs', sha256: 'fbfec636250e47aa8c9e48e2401825a2e3d57bc0b54a1cfd1e010e51bcc184d9' },
    confirmationRound3Markdown: { path: '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/independent-confirmation-round3.md', sha256: '49c49b725efad6efa68dc772511bfcb144821f83f63cdc500cfa5b6aa5569866' },
    confirmationRound3Json: { path: '.omo/private/seoul-migration/s12-reviewed-fullbody-prose-candidate-20261016/independent-confirmation-round3.json', sha256: '341d987f45e8362309c8b4f91428d4e46c0a31019c2cb9e27c7b92e3077863ca' },
    applicationResult: { path: b.directory + 'application-result.md', sha256: 'accbac8d622f7a25810b20b2c462375f293255357de38968b43c715c14c23b19' },
    sourceManifest: { path: b.directory + 'source-before-after.json', sha256: b.manifestSha256 },
    independentAppliedMarkdown: { path: b.directory + 'independent-applied.md', sha256: '6991e8d22b3b7a26c4dfa2ce9db451a3f54075e3efb75b85f89615103d6f5939' },
    independentAppliedJson: { path: b.directory + 'independent-applied.json', sha256: 'e3debceca7d50bea9127f4fb24b07f19088ce8f1d641d510b5b442d629c05cbd' },
  }
  check(prefix.length === 95 && prefix[94].batchId === S13_REVIEWED_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256
    && eq(JSON.parse(packetBytes), { schema: 'seoul-s12-reviewed-source-successor.v1', batchId: b.id,
      registryPrefix: { count: 95, sha256: b.prefixSha256 }, source, operationCount: 928, pins,
      scope: { personIds: [], privateSourceOnly: true, publicationReview: false,
        semanticNarrativeApproval: false, grantCount: 0, entityActivationCount: 0 } })
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 928,
      sourceBeforeAfterPath: pins.sourceManifest.path,
      applicationReview: { evidencePath: pins.independentAppliedJson.path, evidenceSha256: pins.independentAppliedJson.sha256 },
      approvals: [{ kind: 's12-source-application', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/s12')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s12/input', name)
    bound[name] = bytes
  }
  const before = Buffer.from(bound.beforeArchive)
  const candidateBytes = Buffer.from(bound.sourceCandidate)
  const after = await readBytes(resolve(root, source.sourcePath))
  const operations = JSON.parse(bound.operations)
  const inverseOperations = JSON.parse(bound.inverseOperations)
  const confirmation = JSON.parse(bound.confirmationRound3Json)
  const appliedAudit = JSON.parse(bound.independentAppliedJson)
  check(before.length === source.beforeBytes && sha256(before) === source.beforeSha256
    && candidateBytes.length === source.afterBytes && sha256(candidateBytes) === source.afterSha256
    && after.length === source.afterBytes && sha256(after) === source.afterSha256 && after.equals(candidateBytes),
  'E_ARCHIVE_HASH', '/applied/s12/archive')
  check(operations.schema === 'seoul.s12-fullbody-operations.v1' && operations.sourcePath === source.sourcePath
    && operations.sourceRawSha256 === source.beforeSha256 && operations.operationCount === 928
    && operations.operations.length === 928 && inverseOperations.operations.length === 928
    && confirmation.verdict === 'confirmed'
    && appliedAudit.schema === 'seoul.s12-independent-applied-audit.v1'
    && appliedAudit.verdict === 'BOUNDED-CONFIRMED'
    && appliedAudit.authentication.liveRawSha256 === source.afterSha256
    && appliedAudit.authentication.liveParsedJsonSha256 === '27807ddead6ec5014cc23497ff5278558d493e257f615147b06f685476858678'
    && appliedAudit.authentication.archivePreimageRawSha256 === source.beforeSha256
    && appliedAudit.changeSet.operations === 928 && appliedAudit.changeSet.uniqueOperationPaths === 928
    && appliedAudit.changeSet.forwardReplayByteExact === true && appliedAudit.changeSet.inverseReplayByteExact === true
    && appliedAudit.structure.roster === 62 && appliedAudit.structure.blocksBefore === 675
    && appliedAudit.structure.blocksAfter === 675 && appliedAudit.structure.numericAppendixMismatches === 0
    && appliedAudit.protectedFacts.structuredTitleChanges === 0
    && appliedAudit.protectedFacts.structuredRankChanges === 0
    && appliedAudit.protectedFacts.structuredGrantChanges === 0
    && appliedAudit.protectedFacts.structuredHoldingChanges === 0
    && appliedAudit.protectedFacts.structuredAppointmentChanges === 0,
  'E_REVIEW_COVERAGE', '/applied/s12/authority')
  const original = JSON.parse(before), replay = structuredClone(original), seen = new Set()
  for (const op of operations.operations) {
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(), parent = parts.reduce((value, part) => value?.[part], replay)
    check(op.op === 'replace' && op.file === source.sourcePath && op.path.startsWith('/content/')
      && !seen.has(op.path) && parent && Object.hasOwn(parent, key) && eq(parent[key], op.before)
      && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s12/operation', op.path)
    seen.add(op.path)
    parent[key] = op.value
  }
  check(seen.size === 928 && sha256(JSON.stringify(replay)) === '27807ddead6ec5014cc23497ff5278558d493e257f615147b06f685476858678'
    && eq(replay, JSON.parse(candidateBytes))
    && original.content.length === 675 && replay.content.length === 675 && eq(original.data, replay.data)
    && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
      replay.content.map(node => [node.kind, node.anchor, node.depth])),
  'E_REVIEW_HASH', '/applied/s12/forward')
  check(manifest.schema === 'seoul.s12-reviewed-source-application.v1'
    && manifest.authorization.path === pins.authorization.path
    && manifest.authorization.rawSha256 === pins.authorization.sha256
    && manifest.sourcePath === source.sourcePath
    && manifest.before.rawSha256 === source.beforeSha256 && manifest.before.bytes === source.beforeBytes
    && manifest.after.rawSha256 === source.afterSha256 && manifest.after.bytes === source.afterBytes
    && manifest.after.parsedJsonSha256 === '27807ddead6ec5014cc23497ff5278558d493e257f615147b06f685476858678'
    && manifest.sealedScope.operationCount === 928
    && manifest.sealedScope.operationsRawSha256 === pins.operations.sha256
    && manifest.sealedScope.inverseOperationsRawSha256 === pins.inverseOperations.sha256
    && manifest.registryAppendPerformed === false,
  'E_REVIEW_HASH', '/applied/s12/manifest')
  manifest.sources = [source]
  return before
}

async function validateS14ReviewedSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = S14_REVIEWED_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const sources = [
    { sourcePath: 'lore/characters/Cast-State-14.json', beforeSha256: 'e460476ea290655c345a6908e565406898d1f1f11ec76a43caa200572aa8b34a',
      beforeBytes: 469676, afterSha256: 'ee13436646edfee5c522bb709914090bf10cdb142635e333fe30465c4d276686', afterBytes: 500583 },
    { sourcePath: 'lore/characters/Core-Characters.json', beforeSha256: '586a76cf3bc33fd6b85018a9aa8a56fc159d5a7d55c46e677b88f7ae9d999a46',
      beforeBytes: 118973, afterSha256: '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96', afterBytes: 119071 },
  ]
  const pins = {
    authorization: { path: '.omo/evidence/seoul-lock/s14-source-application-authorization-20261016.md', sha256: '4453f125fd8dbd60f894eef2ad7cb50e1dc292e76276f08ce0acb0372235a631' },
    candidateManifest: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/candidate.json', sha256: '848f3f039396cfabbbed1e614cb8b17a79c5a76c9fdf4050bbaafaf1ca709aa8' },
    castCandidate: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/source-candidate.json', sha256: sources[0].afterSha256 },
    coreCandidate: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/core-source-candidate.json', sha256: sources[1].afterSha256 },
    castBeforeArchive: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/source-before.json', sha256: sources[0].beforeSha256 },
    coreBeforeArchive: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/core-source-before.json', sha256: sources[1].beforeSha256 },
    operations: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/operations.json', sha256: '42f695abc9e8fbedaf54e090fbacbba2ba01b3f69bdbc9137aea53ab8b3f712b' },
    inverseOperations: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/inverse-operations.json', sha256: '7b7c30f930053e2504ba216a67b36d849a92e29b1feff8becde037b4182d958d' },
    verifier: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/verify.mjs', sha256: 'a7d1718b7083bec44a7e8023d745bf2cb5656b465971e195828e7a30c394c3d9' },
    independentRereviewMarkdown: { path: '.omo/private/seoul-migration/s14-reviewed-fullbody-prose-candidate-20261016/independent-rereview.md', sha256: '0de8f892dad1b201d0e1e5c8b5f692eae7b2166ab9a92a38ba0a84c2b4e2e4e0' },
    applicationResult: { path: b.directory + 'application-result.md', sha256: 'b3732bf0919afc9e01346bcdf6b957772815854c5d76c3bc2ed2201f715b956a' },
    sourceManifest: { path: b.directory + 'source-before-after.json', sha256: b.manifestSha256 },
    independentAppliedMarkdown: { path: b.directory + 'independent-applied.md', sha256: 'b9681f7782439a162e35976481abc87b819a44a641d6171910f87efa93f8e835' },
    independentAppliedJson: { path: b.directory + 'independent-applied.json', sha256: 'c593d8d0bea2c23d5c30a059558400192951f49872246a69c37e4e63f8fbef23' },
  }
  const scope = { personIds: [], privateSourceOnly: true, coreSealedPersonIds: ['K1006', 'K1009', 'K1010'],
    nonS14CoreBlocksPreserved: 146, publicationReview: false, semanticNarrativeApproval: false,
    grantCount: 0, entityActivationCount: 0 }
  check(prefix.length === 96 && prefix[95].batchId === S12_REVIEWED_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256
    && eq(JSON.parse(packetBytes), { schema: 'seoul-s14-reviewed-source-successor.v1', batchId: b.id,
      registryPrefix: { count: 96, sha256: b.prefixSha256 }, sources, operationCount: 682, pins, scope })
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: b.id,
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 682,
      sourceBeforeAfterPath: pins.sourceManifest.path,
      applicationReview: { evidencePath: pins.independentAppliedJson.path, evidenceSha256: pins.independentAppliedJson.sha256 },
      approvals: [{ kind: 's14-source-application', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/s14')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/s14/input', name)
    bound[name] = bytes
  }
  const before = new Map([
    [sources[0].sourcePath, Buffer.from(bound.castBeforeArchive)],
    [sources[1].sourcePath, Buffer.from(bound.coreBeforeArchive)],
  ])
  const candidates = new Map([
    [sources[0].sourcePath, Buffer.from(bound.castCandidate)],
    [sources[1].sourcePath, Buffer.from(bound.coreCandidate)],
  ])
  for (const source of sources) {
    const archive = before.get(source.sourcePath), candidateBytes = candidates.get(source.sourcePath)
    const live = await readBytes(resolve(root, source.sourcePath))
    check(archive.length === source.beforeBytes && sha256(archive) === source.beforeSha256
      && candidateBytes.length === source.afterBytes && sha256(candidateBytes) === source.afterSha256
      && live.length === source.afterBytes && sha256(live) === source.afterSha256 && live.equals(candidateBytes),
    'E_ARCHIVE_HASH', '/applied/s14/archive', source.sourcePath)
  }
  const candidate = JSON.parse(bound.candidateManifest)
  const operations = JSON.parse(bound.operations), inverseOperations = JSON.parse(bound.inverseOperations)
  const appliedAudit = JSON.parse(bound.independentAppliedJson)
  check(candidate.schema === 'seoul.s14-reviewed-fullbody-prose-candidate.v1'
    && candidate.counts.cards === 64 && candidate.counts.operations === 682 && candidate.counts.inverseOperations === 682
    && candidate.counts.unchangedNumericAppendices === 60
    && eq(candidate.candidateParsedJsonSha256, {
      [sources[0].sourcePath]: '9aae11c682cf8a565a0330f1f0889d42b3a79f2345ca917f8c3bee57501efe2d',
      [sources[1].sourcePath]: 'ab1b71f02a6b191ad87b5138ab4f437551f4841c1a0ade1b9c4d2b4d224a9873',
    }) && operations.schema === 'seoul.s14-leaf-operations.v1' && operations.count === 682
    && operations.operations.length === 682 && inverseOperations.schema === 'seoul.s14-inverse-leaf-operations.v1'
    && inverseOperations.count === 682 && inverseOperations.operations.length === 682
    && appliedAudit.schema === 'seoul.s14-independent-applied-byte-audit.v1' && appliedAudit.verdict === 'confirmed'
    && appliedAudit.operations.count === 682 && appliedAudit.operations.unique === 682
    && appliedAudit.operations.nonOverlapping === true && appliedAudit.operations.forwardReplayLiveExact === true
    && appliedAudit.operations.inverseReplayPreimagesByteExact === true
    && appliedAudit.coreScope.nonS14BlocksPreserved === 146 && appliedAudit.coreScope.outsideSealedRangesChanged === 0
    && eq(appliedAudit.coreScope.sealedCards.map(row => row.personId), scope.coreSealedPersonIds)
    && appliedAudit.invariants.cards === 64 && appliedAudit.invariants.k348Untouched === true
    && appliedAudit.invariants.numericAppendicesUnchanged === 60
    && appliedAudit.invariants.protectedStructuredChanges.appointments === 0
    && appliedAudit.invariants.protectedStructuredChanges.landGrants === 0
    && appliedAudit.invariants.protectedStructuredChanges.ranks === 0
    && appliedAudit.invariants.protectedStructuredChanges.titles === 0,
  'E_REVIEW_COVERAGE', '/applied/s14/authority')
  const replay = new Map([...before].map(([path, bytes]) => [path, JSON.parse(bytes)]))
  const seen = new Set(), perFile = new Map()
  for (const op of operations.operations) {
    const document = replay.get(op.file)
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(), parent = parts.reduce((value, part) => value?.[part], document)
    const address = `${op.file}:${op.path}`
    check(op.op === 'replace' && document && op.path.startsWith('/content/') && !seen.has(address)
      && parent && Object.hasOwn(parent, key) && eq(parent[key], op.before)
      && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s14/operation', address)
    seen.add(address); perFile.set(op.file, (perFile.get(op.file) ?? 0) + 1); parent[key] = op.value
  }
  check(seen.size === 682 && perFile.get(sources[0].sourcePath) === 660 && perFile.get(sources[1].sourcePath) === 22,
    'E_REVIEW_HASH', '/applied/s14/operation-count')
  for (const source of sources) {
    const original = JSON.parse(before.get(source.sourcePath)), result = replay.get(source.sourcePath)
    check(eq(result, JSON.parse(candidates.get(source.sourcePath)))
      && sha256(JSON.stringify(result)) === candidate.candidateParsedJsonSha256[source.sourcePath]
      && original.content.length === result.content.length && eq(original.data, result.data)
      && eq(original.content.map(node => [node.kind, node.anchor, node.depth]),
        result.content.map(node => [node.kind, node.anchor, node.depth])),
    'E_REVIEW_HASH', '/applied/s14/forward', source.sourcePath)
  }
  const coreOriginal = JSON.parse(before.get(sources[1].sourcePath)), coreResult = replay.get(sources[1].sourcePath)
  const sealedIndices = new Set(appliedAudit.coreScope.sealedCards.flatMap(({ start, end }) =>
    Array.from({ length: end - start + 1 }, (_, index) => start + index)))
  check(coreOriginal.content.every((node, index) => sealedIndices.has(index) || eq(node, coreResult.content[index])),
    'E_REVIEW_HASH', '/applied/s14/non-s14-core')
  const restored = new Map([...replay].map(([path, document]) => [path, structuredClone(document)]))
  const inverseSeen = new Set()
  for (const op of inverseOperations.operations) {
    const document = restored.get(op.file)
    const parts = op.path.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(), parent = parts.reduce((value, part) => value?.[part], document)
    const address = `${op.file}:${op.path}`
    check(op.op === 'replace' && document && !inverseSeen.has(address) && parent && Object.hasOwn(parent, key)
      && eq(parent[key], op.before) && sha256(JSON.stringify(op.before)) === op.currentValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/s14/inverse', address)
    inverseSeen.add(address); parent[key] = op.value
  }
  check(inverseSeen.size === 682 && sources.every(source => eq(restored.get(source.sourcePath), JSON.parse(before.get(source.sourcePath)))),
    'E_REVIEW_HASH', '/applied/s14/inverse-restoration')
  check(manifest.schema === 's14-reviewed-source-application.v1'
    && manifest.authorization.path === pins.authorization.path && manifest.authorization.rawSha256 === pins.authorization.sha256
    && eq(manifest.sources.map(({ path, before: old, after }) => ({ sourcePath: path, beforeSha256: old.rawSha256,
      beforeBytes: old.bytes, afterSha256: after.rawSha256, afterBytes: after.bytes })), sources)
    && manifest.application.uniqueLeafReplacements === 682 && manifest.application.sourceFiles === 2
    && eq(manifest.application.coreSealedPersonIds, scope.coreSealedPersonIds)
    && manifest.application.nonS14CoreBlocksPreserved === 146
    && manifest.application.inverseReplayRestoredBothPreimages === true
    && manifest.verification.cards === 64 && manifest.verification.numericAppendicesUnchanged === 60,
  'E_REVIEW_HASH', '/applied/s14/manifest')
  manifest.sources = sources
  return before
}

async function validateSoulAssignmentsEvidenceRebindSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const source = { sourcePath: 'lore/editorial/Soul-Assignments.json', beforeSha256: b.beforeSha256,
    beforeBytes: 3211291, afterSha256: b.afterSha256, afterBytes: 3220173 }
  const pins = {
    authorization: { path: '.omo/evidence/seoul-lock/soul-assignments-evidence-rebind-application-authorization-20261017.md', sha256: '4560cf107b8647c24404e0f33292766cb53190adc21324786f94a4f383e0b936' },
    candidatePacket: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/candidate-packet.json', sha256: '22ba14be7102c95bed72f74ed82018d0eea81161a23fa9e003a2c561ea616b31' },
    candidateSource: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/Soul-Assignments.candidate.json', sha256: b.afterSha256 },
    beforeArchive: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/Soul-Assignments.before.json.gz.b64', sha256: b.archiveSha256 },
    operations: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/operations.json', sha256: '6af99b94029038f08e68223de37c60a79d81ef25b66e45fbd13071456ff95592' },
    inverseOperations: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/inverse-operations.json', sha256: '3dc5a9922c3042d3277028746d2348156be7d3c1bead2c34423268c096c91c22' },
    inventory: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/stale-reference-inventory.json', sha256: 'a1b83d7d07c3c72c1836f2954a7c8bf13b02a3df218b835c551571d6a6dbb7fb' },
    candidateManifest: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/source-before-after.json', sha256: '4901fa0dbad5e7bf23e52185de0ee8d0d269b65c2b2e9cd1e90717f3f98c78a2' },
    verifier: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/verify.mjs', sha256: '3e30dc10ceb606ecc04794c32064705c6fdc1364eb1dc0b1f2d429c7d2235adf' },
    candidateReviewMarkdown: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/independent-review.md', sha256: '59f9d795394e5b348ed8c6636a0641676e434ee762795faefa7a275fc593a8f9' },
    candidateReviewJson: { path: '.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/independent-review.json', sha256: 'b048ff2ce5095a744b1fe41a11adb41234668c347f5c478816d79c5a1f90cddd' },
    applicationResult: { path: b.directory + 'application-result.md', sha256: '01b8af24106a28441cc298d9562c1017a505ccf2ad56c756c5d79ce07782bd4d' },
    sourceManifest: { path: b.directory + 'source-before-after.json', sha256: b.manifestSha256 },
    independentAppliedMarkdown: { path: b.directory + 'independent-applied.md', sha256: '9d7ff914deb7838c100fba0e6579fe7baa03f522a0a9b5b774ec6009caee8f13' },
    independentAppliedJson: { path: b.directory + 'independent-applied.json', sha256: '680e8d011da5652a95a6f89df3597d9e4c7a25f788fb611214633073e9b26b4b' },
  }
  const scope = { privateSourceOnly: true, evidenceQuoteLeavesOnly: true, publicationReview: false,
    semanticNarrativeApproval: false, grantCount: 0, appointmentCount: 0, entityActivationCount: 0 }
  check(prefix.length === 97 && prefix[96].batchId === S14_REVIEWED_SOURCE.id && sha256(prefixBytes) === b.prefixSha256
    && sha256(packetBytes) === b.packetSha256
    && eq(JSON.parse(packetBytes), { schema: 'seoul-soul-assignments-evidence-rebind-source-successor.v1', batchId: b.id,
      registryPrefix: { count: 97, sha256: b.prefixSha256 }, source, operationCount: 198, pins, scope })
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: 'evidence-reference-rebind-only',
      packetPath: b.directory + 'application-packet.json', packetSha256: b.packetSha256, operationCount: 198,
      sourceBeforeAfterPath: pins.sourceManifest.path,
      applicationReview: { evidencePath: pins.independentAppliedJson.path, evidenceSha256: pins.independentAppliedJson.sha256 },
      approvals: [{ kind: 'evidence-reference-rebind-only', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/soul-assignments-rebind')
  const bound = {}
  for (const [name, pin] of Object.entries(pins)) {
    const bytes = await readBytes(resolve(root, pin.path))
    check(sha256(bytes) === pin.sha256, 'E_REVIEW_HASH', '/applied/soul-assignments-rebind/input', name)
    bound[name] = bytes
  }
  const before = gunzipSync(Buffer.from(Buffer.from(bound.beforeArchive).toString().replace(/\s/g, ''), 'base64'))
  const after = await readBytes(resolve(root, source.sourcePath))
  const candidate = JSON.parse(bound.candidatePacket)
  const candidateSource = Buffer.from(bound.candidateSource)
  const operations = JSON.parse(bound.operations).operations
  const inverseOperations = JSON.parse(bound.inverseOperations).operations
  const inventory = JSON.parse(bound.inventory)
  const candidateReview = JSON.parse(bound.candidateReviewJson)
  const appliedAudit = JSON.parse(bound.independentAppliedJson)
  check(before.length === source.beforeBytes && sha256(before) === source.beforeSha256
    && candidateSource.length === source.afterBytes && sha256(candidateSource) === source.afterSha256
    && after.equals(candidateSource), 'E_ARCHIVE_HASH', '/applied/soul-assignments-rebind/archive')
  check(candidate.schema === 'seoul-soul-assignments-evidence-rebind-candidate.v1'
    && candidate.successorBatchContract.requiredBatchId === b.id
    && eq(candidate.successorBatchContract.requiredRegistryPrecondition, { path: '.omo/private/seoul-migration/applied-batches.json', count: 97, sha256: b.prefixSha256 })
    && candidate.successorBatchContract.requiredOperationCount === 198
    && eq(candidate.successorBatchContract.requiredPersonIds, [])
    && candidate.successorBatchContract.requiredApprovalModel === 'evidence-reference-rebind-only'
    && candidate.successorBatchContract.requiredScope.privateSourceOnly === true
    && candidate.successorBatchContract.requiredScope.evidenceQuoteLeavesOnly === true
    && candidate.successorBatchContract.requiredScope.grantCount === 0
    && candidate.successorBatchContract.requiredScope.appointmentCount === 0
    && candidate.successorBatchContract.requiredScope.entityActivationCount === 0
    && candidate.successorBatchContract.requiredScope.publicationReview === false
    && candidate.successorBatchContract.requiredScope.semanticNarrativeApproval === false
    && candidateReview.verdict === 'bounded-confirmed' && candidateReview.replay.operations === 198
    && candidateReview.scopeProof.quoteLeavesOnly === true && candidateReview.scopeProof.assignmentCountBefore === 1022
    && candidateReview.scopeProof.assignmentCountAfter === 1022 && candidateReview.scopeProof.soulsChanged === 0
    && candidateReview.scopeProof.statusesChanged === 0 && candidateReview.scopeProof.narrativeRationalesChanged === 0
    && appliedAudit.verdict === 'bounded-confirmed' && appliedAudit.deltaProof.changedLeaves === 198
    && appliedAudit.deltaProof.assignmentCountBefore === 1022 && appliedAudit.deltaProof.assignmentCountAfter === 1022
    && appliedAudit.deltaProof.soulsChanged === 0 && appliedAudit.deltaProof.statusesChanged === 0
    && appliedAudit.deltaProof.narrativeRationalesChanged === 0
    && appliedAudit.authentication.liveSource.sha256 === source.afterSha256
    && appliedAudit.authentication.preimage.decodedSha256 === source.beforeSha256,
  'E_REVIEW_COVERAGE', '/applied/soul-assignments-rebind/authority')
  const get = (document, path) => path.split('/').slice(1).reduce((value, key) => value[key.replace(/~1/g, '/').replace(/~0/g, '~')], document)
  const put = (document, path, value) => {
    const parts = path.split('/').slice(1).map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(); const parent = parts.reduce((current, part) => current[part], document); parent[key] = value
  }
  const beforeJson = JSON.parse(before); const replay = structuredClone(beforeJson); const seen = new Set()
  for (const op of operations) {
    check(op.op === 'replace' && op.path.endsWith('/quote') && !seen.has(op.path)
      && eq(get(replay, op.path), op.before) && sha256(JSON.stringify(op.before)) === op.beforeValueSha256
      && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/soul-assignments-rebind/operation', op.path)
    seen.add(op.path); put(replay, op.path, op.value)
  }
  check(operations.length === 198 && seen.size === 198 && inverseOperations.length === 198
    && inventory.count === 198 && eq(replay, JSON.parse(candidateSource)),
  'E_REVIEW_HASH', '/applied/soul-assignments-rebind/forward')
  const inverse = structuredClone(replay)
  for (const op of inverseOperations) {
    check(op.op === 'replace' && op.path.endsWith('/quote') && eq(get(inverse, op.path), op.before)
      && sha256(JSON.stringify(op.before)) === op.beforeValueSha256 && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/soul-assignments-rebind/inverse', op.path)
    put(inverse, op.path, op.value)
  }
  check(Buffer.from(JSON.stringify(inverse, null, 2) + '\n').equals(before),
    'E_REVIEW_HASH', '/applied/soul-assignments-rebind/inverse')
  const targets = new Map()
  for (const path of ['lore/characters/Cast-State-14.json', 'lore/characters/Core-Characters.json']) {
    const bytes = await readBytes(resolve(root, path)); targets.set(path, { bytes, value: JSON.parse(bytes) })
  }
  check(sha256(targets.get('lore/characters/Cast-State-14.json').bytes) === 'ee13436646edfee5c522bb709914090bf10cdb142635e333fe30465c4d276686'
    && sha256(targets.get('lore/characters/Core-Characters.json').bytes) === '8fc6072c181d376218b7a73b6584d4b6cb59aad08f9b9d2d3fdacb88088c9e96',
  'E_REVIEW_HASH', '/applied/soul-assignments-rebind/targets')
  for (const op of operations) {
    const target = get(targets.get(op.sourcePath).value, op.targetJsonPointer)
    const text = typeof target.text.ko === 'string' ? target.text.ko : target.text.ko.map(row => row.text).join('')
    check(target.anchor === op.anchor && sha256(JSON.stringify(target)) === op.targetRecordSha256 && text.includes(op.value),
      'E_REVIEW_HASH', '/applied/soul-assignments-rebind/target', op.path)
  }
  check(manifest.schema === 'seoul-source-before-after.v1' && manifest.batchId === b.id
    && manifest.authorization.path === pins.authorization.path && manifest.authorization.sha256 === pins.authorization.sha256
    && manifest.scope.operationCount === 198 && manifest.scope.operation === 'replace' && manifest.scope.leaf === 'evidence quote'
    && manifest.scope.operationsSha256 === pins.operations.sha256 && manifest.scope.inverseOperationsSha256 === pins.inverseOperations.sha256
    && manifest.sources.length === 1 && manifest.sources[0].sourcePath === source.sourcePath
    && manifest.sources[0].beforeSha256 === source.beforeSha256 && manifest.sources[0].beforeBytes === source.beforeBytes
    && manifest.sources[0].afterSha256 === source.afterSha256 && manifest.sources[0].afterBytes === source.afterBytes
    && manifest.sources[0].changed === true && manifest.sources[0].sealed === false
    && eq(manifest.sources[0].beforeArchive, { path: '/Users/ilseoblee/workspace/seoul-dengoku-wiki/.omo/private/seoul-migration/soul-assignments-evidence-rebind-candidate-20261017/Soul-Assignments.before.json.gz.b64', sha256: b.archiveSha256 })
    && manifest.registryAppended === false && manifest.parentMainTouched === false,
  'E_REVIEW_HASH', '/applied/soul-assignments-rebind/manifest')
  manifest.sources = [source]
  return before
}

async function validateSoulBatchesSpecialEvidenceRebindSource(batch, packetBytes, manifest, readBytes, root, prefix) {
  const b = SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE
  const prefixBytes = Buffer.from(JSON.stringify({ schema: 'seoul-applied-batches.v1', visibility: 'private', batches: prefix }, null, 2) + '\n')
  const source = { sourcePath: 'lore/editorial/soul-batches/special.json', beforeSha256: b.beforeSha256,
    beforeBytes: 152261, afterSha256: b.afterSha256, afterBytes: 153250 }
  const packet = JSON.parse(packetBytes); const pins = packet.pins
  const scope = { privateSourceOnly: true, evidenceQuoteLeavesOnly: true, publicationReview: false,
    semanticNarrativeApproval: false, grantCount: 0, appointmentCount: 0, entityActivationCount: 0 }
  check(prefix.length === 98 && prefix[97].batchId === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.id
    && sha256(prefixBytes) === b.prefixSha256 && sha256(packetBytes) === b.packetSha256
    && packet.schema === 'seoul-soul-batches-special-evidence-rebind-source-successor.v1'
    && packet.batchId === b.id && eq(packet.registryPrefix, { count: 98, sha256: b.prefixSha256 })
    && eq(packet.source, source) && packet.operationCount === 16 && eq(packet.scope, scope)
    && eq(batch, { batchId: b.id, state: 'applied', personIds: [], approvalModel: 'evidence-reference-rebind-only',
      packetPath: b.directory + 'registration-packet.json', packetSha256: b.packetSha256, operationCount: 16,
      sourceBeforeAfterPath: b.directory + 'source-before-after.json',
      applicationReview: { evidencePath: pins.independentAppliedJson.path, evidenceSha256: pins.independentAppliedJson.sha256 },
      approvals: [{ kind: 'evidence-reference-rebind-only', bodySha256: pins.authorization.sha256,
        messageRef: pins.authorization.path }] }),
  'E_APPROVAL_BATCH', '/applied/soul-batches-special-rebind')
  const expectedPins = {
    authorization: ['.omo/evidence/seoul-lock/soul-batches-special-evidence-rebind-application-authorization-20261017.md', '33b59817563844bd08617d3d9b5e3e2cb6d62fb17a369ba7546abe496b72c03e'],
    candidatePacket: ['.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/candidate-packet.json', 'bfecd07269fcaebde874005c21d36ffb637ad381bac9240e0dd1613195b914a0'],
    candidateSource: ['.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/special.candidate.json', b.afterSha256],
    beforeArchive: ['.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/before-raw.json', b.archiveSha256],
    operations: ['.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/operations.json', 'd7c0294e77305c7ce0481811e1f53363d0dc78c9306108c84913a7f45f62599d'],
    inverseOperations: ['.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/inverse-operations.json', '4fa84c7c2968545d45b247bffdb4e79436ec1497f138fcf6eaa2aefa60022858'],
    candidateReviewJson: ['.omo/private/seoul-migration/soul-batches-special-evidence-rebind-candidate-20261017/independent-review.json', 'f1e4be31c7d0f4c81344db571afc435c03e2b45088fce9d87b546ed2884fab42'],
    sourceManifest: [b.directory + 'source-before-after.json', b.manifestSha256],
    applicationResult: [b.directory + 'application-result.md', 'c0b2a537a27631a7347f23cbdd7d6c03e3a91d3520a3a5a8b5ad349f0ed84fe4'],
    independentAppliedJson: [b.directory + 'independent-applied.json', 'cda75dca4cc5b3cb66e87bdf37f61a9e4664de38e08d5141ab82cd1d21f19ba1'],
  }
  const bound = {}
  for (const [name, [path, digest]] of Object.entries(expectedPins)) {
    check(eq(pins[name], { path, sha256: digest }), 'E_APPROVAL_BATCH', '/applied/soul-batches-special-rebind/pin', name)
    const bytes = await readBytes(resolve(root, path))
    check(sha256(bytes) === digest, 'E_REVIEW_HASH', '/applied/soul-batches-special-rebind/input', name)
    bound[name] = bytes
  }
  const archive = JSON.parse(bound.beforeArchive); const before = Buffer.from(archive.rawBase64, 'base64')
  const candidateSource = Buffer.from(bound.candidateSource); const after = await readBytes(resolve(root, source.sourcePath))
  const candidate = JSON.parse(bound.candidatePacket); const operations = JSON.parse(bound.operations).operations
  const inverseOperations = JSON.parse(bound.inverseOperations).operations
  const candidateReview = JSON.parse(bound.candidateReviewJson); const appliedAudit = JSON.parse(bound.independentAppliedJson)
  check(archive.schema === 'seoul-soul-batches-special-evidence-rebind-before-raw.v1'
    && archive.sourcePath === source.sourcePath && archive.rawSha256 === source.beforeSha256 && archive.rawBytes === source.beforeBytes
    && before.length === source.beforeBytes && sha256(before) === source.beforeSha256
    && candidateSource.length === source.afterBytes && sha256(candidateSource) === source.afterSha256 && after.equals(candidateSource),
  'E_ARCHIVE_HASH', '/applied/soul-batches-special-rebind/archive')
  check(candidate.schema === 'seoul-soul-batches-special-evidence-rebind-candidate.v1'
    && candidate.source.beforeSha256 === source.beforeSha256 && candidate.source.candidateSha256 === source.afterSha256
    && candidate.counts.operations === 16 && candidate.counts.inverseOperations === 16
    && candidate.scope.evidenceQuoteLeavesOnly === true && candidate.scope.assignmentSoulFieldsChanged === false
    && candidate.scope.newAssignments === 0 && candidate.scope.newGrants === 0 && candidate.scope.newAppointments === 0
    && candidateReview.verdict === 'bounded-confirmed' && candidateReview.replay.operations === 16
    && candidateReview.scopeProof.quoteLeavesOnly === true && candidateReview.scopeProof.assignmentCountBefore === 39
    && candidateReview.scopeProof.assignmentCountAfter === 39 && candidateReview.scopeProof.soulsChanged === 0
    && candidateReview.scopeProof.statusesChanged === 0 && appliedAudit.verdict === 'bounded-confirmed'
    && appliedAudit.changeProof.operations === 16 && appliedAudit.changeProof.assignmentCountBefore === 39
    && appliedAudit.changeProof.assignmentCountAfter === 39 && appliedAudit.changeProof.soulsChanged === 0
    && appliedAudit.changeProof.statusesChanged === 0 && appliedAudit.authentication.source.liveSha256 === source.afterSha256,
  'E_REVIEW_COVERAGE', '/applied/soul-batches-special-rebind/authority')
  const get = (document, path) => path.split('/').slice(1).reduce((value, key) => value[key.replace(/~1/g, '/').replace(/~0/g, '~')], document)
  const put = (document, path, value) => {
    const parts = path.split('/').slice(1).map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'))
    const key = parts.pop(); parts.reduce((current, part) => current[part], document)[key] = value
  }
  const replay = JSON.parse(before); const seen = new Set()
  for (const op of operations) {
    check(op.op === 'replace' && op.path.endsWith('/quote') && !seen.has(op.path) && eq(get(replay, op.path), op.before)
      && sha256(JSON.stringify(op.before)) === op.beforeValueSha256 && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/soul-batches-special-rebind/operation', op.path)
    seen.add(op.path); put(replay, op.path, op.value)
  }
  check(operations.length === 16 && seen.size === 16 && inverseOperations.length === 16
    && Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(candidateSource),
  'E_REVIEW_HASH', '/applied/soul-batches-special-rebind/forward')
  for (const op of inverseOperations) {
    check(op.op === 'replace' && op.path.endsWith('/quote') && eq(get(replay, op.path), op.before)
      && sha256(JSON.stringify(op.before)) === op.beforeValueSha256 && sha256(JSON.stringify(op.value)) === op.afterValueSha256,
    'E_REVIEW_HASH', '/applied/soul-batches-special-rebind/inverse', op.path)
    put(replay, op.path, op.value)
  }
  check(Buffer.from(JSON.stringify(replay, null, 2) + '\n').equals(before),
    'E_REVIEW_HASH', '/applied/soul-batches-special-rebind/inverse')
  check(manifest.schema === 'seoul-source-before-after.v1'
    && manifest.scope.operationCount === 16 && manifest.scope.operationsSha256 === pins.operations.sha256
    && manifest.scope.inverseOperationsSha256 === pins.inverseOperations.sha256
    && manifest.scope.candidatePacketSha256 === pins.candidatePacket.sha256
    && manifest.sources.length === 1 && manifest.sources[0].sourcePath === source.sourcePath
    && manifest.sources[0].beforeSha256 === source.beforeSha256 && manifest.sources[0].beforeBytes === source.beforeBytes
    && manifest.sources[0].afterSha256 === source.afterSha256 && manifest.sources[0].afterBytes === source.afterBytes
    && manifest.sources[0].changed === true && manifest.sources[0].sealed === false
    && manifest.application.liveAfterRereadSha256 === source.afterSha256 && manifest.application.candidateByteExact === true,
  'E_REVIEW_HASH', '/applied/soul-batches-special-rebind/manifest')
  manifest.sources = [source]
  return before
}

export async function loadAppliedBatches(readFileImpl = readFile, root = '.') {
  const activeScope = appliedAuthenticationScope.getStore()
  if (activeScope?.root === resolve(root)
    && appliedAuthorityReaders.get(readFileImpl) === activeScope.reader)
    return loadAppliedBatchesInScope(readFileImpl, root)
  const { climateLinkPredecessorReader } = await import('./climate-link-successor.mjs')
  const climateOriginal = readFileImpl
  readFileImpl = await climateLinkPredecessorReader(root, readFileImpl)
  if (readFileImpl !== climateOriginal) {
    readFileImpl.currentAuthorityReader = climateOriginal.currentAuthorityReader
    const inherited = appliedAuthorityReaders.get(climateOriginal)
    if (inherited) appliedAuthorityReaders.set(readFileImpl, inherited)
  }
  const timelineOriginal = readFileImpl
  const { timelineWharfPredecessorReader } = await import('./timeline-wharf-successor.mjs')
  readFileImpl = await timelineWharfPredecessorReader(root, readFileImpl)
  if (readFileImpl !== timelineOriginal) {
    readFileImpl.currentAuthorityReader = timelineOriginal.currentAuthorityReader
    const inherited = appliedAuthorityReaders.get(timelineOriginal)
    if (inherited) appliedAuthorityReaders.set(readFileImpl, inherited)
  }
  const incomingReader = readFileImpl
  readFileImpl = await validatorPredecessorReader(root, readFileImpl)
  if (readFileImpl !== incomingReader) {
    readFileImpl.currentAuthorityReader = incomingReader.currentAuthorityReader
      ? await validatorPredecessorReader(root, incomingReader.currentAuthorityReader) : undefined
    const inherited = appliedAuthorityReaders.get(incomingReader)
    if (inherited) appliedAuthorityReaders.set(readFileImpl, inherited)
  }
  const inheritedAuthority = appliedAuthorityReaders.get(readFileImpl)
  const currentAuthority = readFileImpl.currentAuthorityReader
  if (currentAuthority) appliedAuthorityReaders.set(readFileImpl, currentAuthority)
  const { stationCatalogPredecessorReader } = await import('./station-catalog-scope-successor.mjs')
  const stationReader = currentAuthority ? readFileImpl : await stationCatalogPredecessorReader(root, readFileImpl)
  if (stationReader !== readFileImpl) {
    appliedAuthorityReaders.set(stationReader, appliedAuthorityReaders.get(readFileImpl) ?? readFileImpl)
    readFileImpl = stationReader
  }
  const { reviewWordingPredecessorReader } = await import('./review-wording-successor.mjs')
  const wordingReader = currentAuthority ? readFileImpl : await reviewWordingPredecessorReader(root, readFileImpl)
  if (wordingReader !== readFileImpl) {
    appliedAuthorityReaders.set(wordingReader, appliedAuthorityReaders.get(readFileImpl) ?? readFileImpl)
    readFileImpl = wordingReader
  }
  const { authenticateK176LabelSuccessor, K176_SOURCE, K176_AFTER } = await import('./k176-label-successor.mjs')
  let currentK176
  try { currentK176 = await readFileImpl(resolve(root, K176_SOURCE)) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const successor = !currentAuthority && currentK176 && sha256(currentK176) === K176_AFTER
    ? await authenticateK176LabelSuccessor(root, readFileImpl) : null
  if (successor) {
    const originalReader = readFileImpl
    readFileImpl = async path => resolve(path) === resolve(root, K176_SOURCE) ? successor.before : originalReader(path)
    appliedAuthorityReaders.set(readFileImpl, appliedAuthorityReaders.get(originalReader) ?? originalReader)
    readFileImpl.appliedDiskOverrides = new Map(originalReader.appliedDiskOverrides ?? [])
  }
  if (!currentAuthority && !inheritedAuthority) appliedAuthorityReaders.set(readFileImpl, readFileImpl)
  const authorityReader = appliedAuthorityReaders.get(readFileImpl) ?? readFileImpl
  const scope = appliedAuthenticationScope.getStore()
  if (scope?.root === resolve(root) && scope.reader === authorityReader)
    return loadAppliedBatchesInScope(readFileImpl, root)
  // Repin validation also consumes the final successor directly. Share its bytes
  // only within this invocation, never across readers or concurrent invocations.
  const finalPath = resolve(root, DOC247_FINAL_SUCCESSOR_PATH)
  let finalBytes
  const invocationReader = requested => resolve(requested) === finalPath
    ? finalBytes ??= Promise.resolve(authorityReader(requested)) : authorityReader(requested)
  appliedAuthorityReaders.set(readFileImpl, invocationReader)
  return appliedAuthenticationScope.run({ root: resolve(root), reader: invocationReader }, async () => {
    let registryBytes
    try { registryBytes = await readFileImpl(resolve(root, '.omo/private/seoul-migration/applied-batches.json')) }
    catch (error) { if (error.code === 'ENOENT') return []; throw error }
    const registry = JSON.parse(registryBytes)
    if (registry.batches.some(batch => batch.approvalModel === ATLAS_FIX_SUCCESSOR_BATCH_ID
      || batch.approvalModel === PROJECTION_REFRESH_BATCH_ID)) await loadFinalSuccessor(root, readFileImpl)
    return loadAppliedBatchesInScope(readFileImpl, root)
  })
}

async function loadAppliedBatchesInScope(readFileImpl, root) {
  const path = resolve(root, '.omo/private/seoul-migration/applied-batches.json')
  let bytes
  try { bytes = await readFileImpl(path) } catch (error) { if (error.code === 'ENOENT') return [] ; throw error }
  const registry = JSON.parse(Buffer.from(bytes).toString())
  check(registry.schema === 'seoul-applied-batches.v1' && Array.isArray(registry.batches), 'E_SCOPE_SHAPE', '/applied-batches')
  const inheritedReader = reader => {
    appliedAuthorityReaders.set(reader, appliedAuthorityReaders.get(readFileImpl) ?? readFileImpl)
    return Object.assign(reader, {
      appliedDiskOverrides: new Map([...(readFileImpl.appliedDiskOverrides ?? []), ...(reader.appliedDiskOverrides ?? [])]),
    })
  }
  if (registry.batches.length === 111 && registry.batches[110]?.approvalModel === ATLAS_FIX_SUCCESSOR_BATCH_ID) {
    const materialized = await materializeAtlasFixSuccessor(root)
    const prefix = { ...registry, batches: registry.batches.slice(0, 110) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const transitionByPath = new Map(materialized.sourceBeforeAfter.sources.map(row => [row.sourcePath, row]))
    const atlasBefore = async requested => {
      const archive = JSON.parse(await readFileImpl(resolve(root, ATLAS83_SOURCE.directory + 'before-raw.json')))
      const proposal = JSON.parse(await readFileImpl(resolve(root,
        '.omo/private/seoul-migration/atlas79-complete-publication-review-20261016/four-track-composite-proposal.json')))
      const value = JSON.parse(gunzipSync(Buffer.from(archive.gzipBase64, 'base64')))
      const at = pointerPath => pointerPath === '' ? value : pointerPath.split('/').slice(1)
        .reduce((node, token) => node[token.replaceAll('~1', '/').replaceAll('~0', '~')], value)
      for (const operation of proposal.operations) {
        const parentPath = operation.pointer.slice(0, operation.pointer.lastIndexOf('/'))
        at(parentPath)[operation.pointer.split('/').at(-1)] = structuredClone(operation.after)
      }
      for (const removal of proposal.relationRemovals) value.data.atlas.relations.splice(removal.index, 1)
      const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n')
      check(sha256(bytes) === materialized.packet.authority.atlas.beforeSha256, 'E_REVIEW_HASH', 'lore/World-Narrative-Atlas.json')
      return bytes
    }
    const schemaBefore = async requested => {
      const value = JSON.parse(await readFileImpl(requested)); const theater = value.$defs.theater
      theater.required.splice(theater.required.indexOf('states') + 1, 0, 'japan_bridge_removable')
      delete theater.properties.record_status; delete theater.properties.current_operational_claim
      delete theater.properties.projection_display_name; delete theater.properties.historical_display_name
      theater.properties.japan_bridge_removable = { type: 'boolean' }
      value.$defs.atlas.required.splice(value.$defs.atlas.required.indexOf('houses') + 1, 0, 'theaters')
      delete value.$defs.atlas.properties.theaters.description
      delete value.$defs.relation.properties.endpoint_display
      const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n')
      check(sha256(bytes) === 'b9b5e4a235fb8b00f91a9359db51dc1b2deb7665f3085577229932824f8769f8', 'E_REVIEW_HASH', 'lore/authoring.atlas.schema.json')
      return bytes
    }
    const rendererBefore = async requested => {
      let text = Buffer.from(await readFileImpl(requested)).toString()
      text = text.replace("const b = preamble(atlas, 'External-Theaters', L('구역 간 인계 회랑', 'Inter-district Handover Corridors'))", "const b = preamble(atlas, 'External-Theaters', L('외부전구', 'External Theaters'))")
        .replace("b.heading(2, text(theater.id, ' · ', theater.projection_display_name ?? theater.display_name), [], 'title')", "b.heading(2, text(theater.id, ' · ', theater.display_name), [], 'title')")
        .replace("      cell(relation.endpoint_display?.from ? text(relation.from, ' · ', relation.endpoint_display.from) : relation.from),\n      cell(relation.kind),\n      cell(relation.endpoint_display?.to ? text(relation.to, ' · ', relation.endpoint_display.to) : relation.to),\n      cell(relation.reason),", "      cell(relation.from_label ?? relation.from), cell(relation.kind), cell(relation.to_label ?? relation.to), cell(relation.reason),")
      const bytes = Buffer.from(text)
      check(sha256(bytes) === '3ff04e53d9d40d1c9fc72e3ffce0bd26eb3808d6d596cd8944b92006728b1b33', 'E_REVIEW_HASH', 'scripts/world-atlas-render.mjs')
      return bytes
    }
    const prefixReader = async requested => {
      if (requested === path) return prefixBytes
      const relativePath = relative(root, requested).replaceAll('\\', '/')
      if (relativePath === 'lore/World-Narrative-Atlas.json') return atlasBefore(requested)
      if (relativePath === 'lore/authoring.atlas.schema.json') return schemaBefore(requested)
      if (relativePath === 'scripts/world-atlas-render.mjs') return rendererBefore(requested)
      const transition = transitionByPath.get(relativePath)
      if (!transition) return readFileImpl(requested)
      const value = JSON.parse(await readFileImpl(requested))
      value.provenance.original_hash = materialized.packet.authority.atlas.beforeSha256
      value.source.hash = materialized.packet.authority.atlas.beforeSha256
      if (relativePath === 'lore/World-Relation-Ledger.json') {
        const labels = [
          ['Sinjeong Wheel House', '신정차륜가', 'Guro Alloy House', '구로합금가'],
          ['Guro Digital Complex Battery House', '구로디지털단지전지가', 'Magok Test-Line House', '마곡시험선가'],
          ['Digital Media City Index House', '디지털미디어시티색인가', 'Digital Media City Payments House', '디지털미디어시티결제가'],
          ['Magok Seed House', '마곡종자가', 'Yongsan Convoy House', '용산호송가'],
          ['Yongsan Ship House', '용산선박가', 'Geumcheon District Office Machinery House', '금천구청중기가'],
          ['Dongdaeipgu Trading House', '동대입구객사가', 'Seoul Station Inventory House', '서울역재고가'],
        ]
        const rows = value.content.find(node => node.kind === 'table').rows
        for (let index = 0; index < labels.length; index += 1) {
          const row = rows.at(index - labels.length)
          row[0] = { en: labels[index][0], ko: labels[index][1] }
          row[2] = { en: labels[index][2], ko: labels[index][3] }
        }
      }
      const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n')
      check(sha256(bytes) === transition.beforeSha256, 'E_REVIEW_HASH', relativePath)
      return bytes
    }
    prefixReader.appliedDiskOverrides = new Map([
      ...materialized.sourceBeforeAfter.sources.map(source => [source.sourcePath, source.beforeSha256]),
      ['lore/World-Narrative-Atlas.json', materialized.packet.authority.atlas.beforeSha256],
      ['lore/authoring.atlas.schema.json', 'b9b5e4a235fb8b00f91a9359db51dc1b2deb7665f3085577229932824f8769f8'],
      ['scripts/world-atlas-render.mjs', '3ff04e53d9d40d1c9fc72e3ffce0bd26eb3808d6d596cd8944b92006728b1b33'],
      ...(readFileImpl.appliedDiskOverrides ?? []),
    ])
    const authenticated = await loadAppliedBatches(inheritedReader(prefixReader), root)
    check(authenticated.length === 110, 'E_APPROVAL_BATCH', '/applied/atlas-known-world/prefix')
    const batch = structuredClone(registry.batches[110])
    const injectedPacket = await readFileImpl(resolve(root, batch.packetPath))
    const injectedManifest = await readFileImpl(resolve(root, batch.sourceBeforeAfterPath))
    check(Buffer.from(injectedPacket).equals(materialized.packetBytes), 'E_REVIEW_HASH', batch.packetPath)
    check(Buffer.from(injectedManifest).equals(materialized.manifestBytes), 'E_REVIEW_HASH', batch.sourceBeforeAfterPath)
    check(batch.batchId === ATLAS_FIX_SUCCESSOR_BATCH_ID
      && batch.packetPath === ATLAS_FIX_SUCCESSOR_DIRECTORY + 'application-packet.json'
      && batch.packetSha256 === materialized.entry.packetSha256
      && batch.sourceBeforeAfterPath === ATLAS_FIX_SUCCESSOR_DIRECTORY + 'source-before-after.json'
      && batch.operationCount === 36,
    'E_APPROVAL_BATCH', '/applied/atlas-known-world')
    const atlasAuthority = materialized.packet.authority.atlas
    const atlasPredecessor = await atlasBefore(resolve(root, atlasAuthority.path))
    const atlasCurrent = await readFileImpl(resolve(root, atlasAuthority.path))
    check(sha256(atlasCurrent) === atlasAuthority.afterSha256, 'E_REVIEW_HASH', atlasAuthority.path)
    batch.sourceBeforeAfter = { ...materialized.sourceBeforeAfter, sources: [
      ...materialized.sourceBeforeAfter.sources,
      { sourcePath: atlasAuthority.path, beforeSha256: atlasAuthority.beforeSha256,
        afterSha256: atlasAuthority.afterSha256, beforeBytes: atlasPredecessor.length,
        afterBytes: atlasCurrent.length, changed: true, sealed: false },
    ] }
    return [...authenticated, batch]
  }
  if (registry.batches.length === 110 && registry.batches[109]?.approvalModel === PROJECTION_REFRESH_SOURCE.id) {
    const prefix = { ...registry, batches: registry.batches.slice(0, 109) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const packet = JSON.parse(await readFileImpl(resolve(root, PROJECTION_REFRESH_SOURCE.directory + 'application-packet.json')))
    const prefixReader = async requested => {
      if (requested === path) return prefixBytes
      return readFileImpl(requested)
    }
    prefixReader.appliedDiskOverrides = new Map([
      ...packet.sourceBeforeAfter.sources.map(source => [source.sourcePath, source.afterSha256]),
      ...(readFileImpl.appliedDiskOverrides ?? []),
    ])
    const authenticated = await loadAppliedBatches(inheritedReader(prefixReader), root)
    check(authenticated.length === 109, 'E_APPROVAL_BATCH', '/applied/projection-refresh/prefix')
    const batch = structuredClone(registry.batches[109])
    const [packetBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)), readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    await validateProjectionRefreshSource(batch, packetBytes, JSON.parse(Buffer.from(manifestBytes)),
      readFileImpl, root, registry.batches.slice(0, 109))
    batch.sourceBeforeAfter = JSON.parse(Buffer.from(manifestBytes))
    return [...authenticated, batch]
  }
  if (registry.batches.length === 109 && registry.batches[108]?.approvalModel === POST108_EIGHT_DOCUMENT_SOURCE.id) {
    const prefix = { ...registry, batches: registry.batches.slice(0, 108) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const beforeRoot = resolve(root, '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/before')
    const beforeContract = gunzipSync(Buffer.from((await readFileImpl(resolve(root,
      POST108_EIGHT_DOCUMENT_SOURCE.directory + 'before/Seoul-Scope-Contract.json.gz.b64'))).toString().trim(), 'base64'))
    const sources = Object.keys(POST108_EIGHT_DOCUMENT_SOURCE.sources)
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : requested === resolve(root, 'lore/editorial/Seoul-Scope-Contract.json') ? beforeContract
      : sources.some(sourcePath => requested === resolve(root, sourcePath))
        ? readFileImpl(resolve(beforeRoot, relative(root, requested))) : readFileImpl(requested)), root)
    check(authenticated.length === 108, 'E_APPROVAL_BATCH', '/applied/post108-eight-document/prefix')
    const batch = structuredClone(registry.batches[108])
    const [packetBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)), readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    await validatePost108EightDocumentSource(batch, packetBytes, JSON.parse(Buffer.from(manifestBytes)),
      readFileImpl, root, registry.batches.slice(0, 108))
    batch.sourceBeforeAfter = JSON.parse(Buffer.from(manifestBytes))
    return [...authenticated, batch]
  }
  if (registry.batches.length === 108 && registry.batches[107]?.approvalModel === 'owner-link-tidy-source-application-31') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 107) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const beforeRoot = resolve(root, '.omo/private/seoul-migration/owner-link-tidy-application-20261018/before')
    const tidySources = Object.keys(OWNER_LINK_TIDY_SOURCE.sources)
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : tidySources.some(sourcePath => requested === resolve(root, sourcePath))
        ? readFileImpl(resolve(beforeRoot, relative(root, requested))) : readFileImpl(requested)), root)
    check(authenticated.length === 107, 'E_APPROVAL_BATCH', '/applied/owner-link-tidy/prefix')
    const batch = structuredClone(registry.batches[107])
    const [packetBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)),
      readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    await validateOwnerLinkTidySource(registry.batches[107], packetBytes, JSON.parse(Buffer.from(manifestBytes)),
      readFileImpl, root, registry.batches.slice(0, 107))
    batch.sourceBeforeAfter = JSON.parse(Buffer.from(manifestBytes))
    return [...authenticated, batch]
  }
  if (registry.batches.length === 107 && registry.batches[106]?.approvalModel === 'publication-link-retarget-en-source-application-14') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 106) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const beforeRoot = resolve(root, '.omo/private/seoul-migration/publication-link-retarget-en-application-20261018/before')
    const retargetedSources = Object.keys(LINK_RETARGET_EN_SOURCE.sources)
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : retargetedSources.some(sourcePath => requested === resolve(root, sourcePath))
        ? readFileImpl(resolve(beforeRoot, relative(root, requested))) : readFileImpl(requested)), root)
    check(authenticated.length === 106, 'E_APPROVAL_BATCH', '/applied/publication-link-retarget-en/prefix')
    const batch = structuredClone(registry.batches[106])
    const [packetBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)),
      readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    await validateLinkRetargetEnSource(registry.batches[106], packetBytes, JSON.parse(Buffer.from(manifestBytes)),
      readFileImpl, root, registry.batches.slice(0, 106))
    batch.sourceBeforeAfter = JSON.parse(Buffer.from(manifestBytes))
    return [...authenticated, batch]
  }
  if (registry.batches.length === 106 && registry.batches[105]?.approvalModel === 'publication-link-retarget-source-application-14') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 105) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const beforeRoot = resolve(root, '.omo/private/seoul-migration/publication-link-retarget-application-20261017/before')
    const retargetedSources = Object.keys(LINK_RETARGET_SOURCE.sources)
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : retargetedSources.some(sourcePath => requested === resolve(root, sourcePath))
        ? readFileImpl(resolve(beforeRoot, relative(root, requested))) : readFileImpl(requested)), root)
    check(authenticated.length === 105, 'E_APPROVAL_BATCH', '/applied/publication-link-retarget/prefix')
    const batch = structuredClone(registry.batches[105])
    const [packetBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)),
      readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    await validateLinkRetargetSource(registry.batches[105], packetBytes, JSON.parse(Buffer.from(manifestBytes)),
      readFileImpl, root, registry.batches.slice(0, 105))
    batch.sourceBeforeAfter = JSON.parse(Buffer.from(manifestBytes))
    return [...authenticated, batch]
  }
  if (registry.batches.length === 105 && registry.batches[104]?.approvalModel === 'publication-activation-1194') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 104) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes : readFileImpl(requested)), root)
    check(authenticated.length === 104, 'E_APPROVAL_BATCH', '/applied/publication-activation/prefix')
    const batch = structuredClone(registry.batches[104])
    const [packetBytes, proposalBytes, uncoveredBytes, rereviewBytes, ledgerBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)),
      readFileImpl(resolve(root, '.omo/private/seoul-migration/publication-activation-proposal-20261017/activation-proposal.json')),
      readFileImpl(resolve(root, '.omo/private/seoul-migration/publication-activation-proposal-20261017/uncovered.json')),
      readFileImpl(resolve(root, batch.applicationReview.evidencePath)),
      readFileImpl(resolve(root, 'lore/editorial/Seoul-Scope-Contract.json')),
      readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    const packet = JSON.parse(packetBytes); const rereview = JSON.parse(rereviewBytes); const ledger = JSON.parse(ledgerBytes)
    const rights = authenticated.find(row => row.approvalModel === 'approved-rights-transition')?.rightsTransition
    const baselineBytes = await readFileImpl(resolve(root, '.omo/private/seoul-migration/baseline.json'))
    check(rights && sha256(baselineBytes) === BASELINE_SHA256, 'E_APPROVAL_BATCH', '/applied/publication-activation/retirement')
    const baseline = JSON.parse(baselineBytes)
    const predecessor = structuredClone(ledger)
    const retired = predecessor.dispositions.filter(row => row.status === 'retired')
    check(retired.length === 306 && retired.filter(row => row.set === 'titles').length === 158
      && retired.filter(row => row.set === 'grants').length === 148, 'E_CENSUS_RIGHT', '/applied/publication-activation/retirement')
    for (const row of retired) Object.assign(row, { status: 'pending', targetIds: [], batchId: null, basis: null })
    const approvedRights = predecessor.dispositions.filter(row => row.status === 'active' && row.batchId === 'approved-rights-transition')
    check(approvedRights.length === 8, 'E_CENSUS_RIGHT', '/applied/publication-activation/rights')
    for (const row of approvedRights) Object.assign(row, { status: 'pending', targetIds: [], batchId: null, basis: null })
    const predecessorBytes = Buffer.from(JSON.stringify(predecessor, null, 2) + '\n')
    const sourceHashes = Object.fromEntries([...rights.sources].map(([sourcePath, source]) => [sourcePath, source.afterSha256]))
    check(sha256(predecessorBytes) === packet.ledger.sha256
      && eq(materializeRetiredRightsDispositions(predecessor, baseline, rights.proof, sourceHashes), ledger),
    'E_APPROVAL_BATCH', '/applied/publication-activation/retirement')
    check(sha256(prefixBytes) === packet.registryPrefix.sha256 && packet.registryPrefix.count === 104
      && sha256(packetBytes) === batch.packetSha256 && sha256(proposalBytes) === packet.authority.proposal.sha256
      && sha256(uncoveredBytes) === packet.authority.uncovered.sha256 && sha256(rereviewBytes) === packet.authority.independentRereview.sha256
      && sha256(manifestBytes) === sha256(Buffer.from(JSON.stringify({ schema: 'seoul-source-before-after.v1', batchId: batch.batchId, sources: [] }, null, 2) + '\n'))
      && packet.schema === 'seoul-publication-activation-application.v1' && packet.batchId === batch.batchId
      && rereview.verdict === 'confirmed' && packet.ledger.entityCount === 1634 && packet.ledger.activeCount === 1194 && packet.ledger.retiredCount === 440
      && packet.entityKeys.length === 1194 && packet.dispositionKeys.length === 1194 && packet.documentPaths.length === 5
      && eq(batch.entityKeys, packet.entityKeys) && eq(batch.documentPaths, packet.documentPaths) && eq(batch.dispositionKeys, packet.dispositionKeys)
      && ledger.entities.filter(row => row.status === 'active' && row.batchId === batch.batchId).length === 1194
      && ledger.entities.filter(row => row.status === 'retired' && typeof row.basis === 'string' && row.basis.trim()).length === 440,
    'E_APPROVAL_BATCH', '/applied/publication-activation/contract')
    batch.sourceBeforeAfter = { schema: 'seoul-source-before-after.v1', sources: [] }
    return [...authenticated, batch]
  }
  if (registry.batches.length === 104 && registry.batches[103]?.approvalModel === 'ohaerin-nis-successor-6') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 103) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const candidateRoot = resolve(root, '.omo/private/seoul-migration/ohaerin-nis-successor-candidate-20261017')
    const corePath = resolve(root, 'lore/characters/Core-Characters.json')
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : requested === corePath ? readFileImpl(resolve(candidateRoot, 'source-before.json')) : readFileImpl(requested)), root)
    check(authenticated.length === 103, 'E_APPROVAL_BATCH', '/applied/ohaerin-nis/prefix')
    const batch = structuredClone(registry.batches[103])
    const [packetBytes, reviewBytes, reviewMarkdownBytes, manifestBytes, sourceBeforeBytes, sourceCandidateBytes,
      operationsBytes, inverseBytes, decisionBytes, approvalBytes, verifyBytes, verifyExitBytes, verifyStdoutBytes,
      verifyStderrBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)), readFileImpl(resolve(root, batch.applicationReview.evidencePath)),
      readFileImpl(resolve(candidateRoot, 'independent-rereview.md')), readFileImpl(resolve(candidateRoot, 'manifest.json')),
      readFileImpl(resolve(candidateRoot, 'source-before.json')), readFileImpl(resolve(candidateRoot, 'source-candidate.json')),
      readFileImpl(resolve(candidateRoot, 'operations.json')), readFileImpl(resolve(candidateRoot, 'inverse-operations.json')),
      readFileImpl(resolve(candidateRoot, 'owner-decision-record.json')),
      readFileImpl(resolve(root, '.omo/private/seoul-migration/office-rank-retrofit-proposal-20261017/owner-approval-20261017.json')),
      readFileImpl(resolve(candidateRoot, 'verify.mjs')), readFileImpl(resolve(candidateRoot, 'verification-complete.exit.txt')),
      readFileImpl(resolve(candidateRoot, 'verification-complete.stdout.json')),
      readFileImpl(resolve(candidateRoot, 'verification-complete.stderr.txt')),
    ])
    check(sha256(packetBytes) === batch.packetSha256 && sha256(reviewBytes) === batch.applicationReview.evidenceSha256,
      'E_REVIEW_HASH', '/applied/ohaerin-nis/authentication')
    const packet = JSON.parse(packetBytes); const review = JSON.parse(reviewBytes); const manifest = JSON.parse(manifestBytes)
    check(packet.schema === 'seoul-ohaerin-nis-successor-source-application.v1' && packet.batchId === batch.batchId
      && packet.registryPrefix.count === 103 && sha256(prefixBytes) === packet.registryPrefix.sha256
      && packet.operationCount === 6 && packet.scope.personId === 'Core-Characters#오해린'
      && packet.scope.changedLeafCount === 6 && packet.scope.bilingualOfficeLeavesOnly === true
      && packet.scope.publicNomenclatureOnly === true && packet.scope.publicationReview === false
      && packet.scope.grantCount === 0 && packet.scope.entityActivationCount === 0
      && packet.authority.ownerDecision === '중앙정보부=국가정보원 대응'
      && packet.authority.decisionRecord.decodedSha256 === 'f0f309eccf9e5da828475b2617acd3fcf5671b169f0e063c6be3308a1c33524c'
      && sha256(decisionBytes) === packet.authority.decisionRecord.archiveSha256
      && sha256(approvalBytes) === packet.authority.approvalReceipt.sha256
      && sha256(manifestBytes) === packet.provenance.candidateManifest.sha256
      && sha256(sourceBeforeBytes) === packet.provenance.sourceBefore.sha256
      && sha256(sourceCandidateBytes) === packet.provenance.sourceCandidate.sha256
      && sha256(operationsBytes) === packet.provenance.operations.sha256
      && sha256(inverseBytes) === packet.provenance.inverseOperations.sha256
      && sha256(reviewBytes) === packet.provenance.independentRereviewJson.sha256
      && sha256(reviewMarkdownBytes) === packet.provenance.independentRereviewMarkdown.sha256
      && sha256(verifyBytes) === packet.provenance.verifyScript.sha256
      && sha256(verifyExitBytes) === packet.provenance.verifyExitReceipt.sha256
      && sha256(verifyStdoutBytes) === packet.provenance.verifyStdoutReceipt.sha256
      && sha256(verifyStderrBytes) === packet.provenance.verifyStderrReceipt.sha256
      && review.verdict === 'confirmed' && review.scopeRegression.changedLeafCount === 6
      && review.approvalAuthentication.decodedDecisionBindingIntact === true
      && manifest.approvalBinding.decisionRecordSha256 === packet.authority.decisionRecord.decodedSha256
      && manifest.approvalBinding.approvalReceiptSha256 === packet.authority.approvalReceipt.sha256,
    'E_APPROVAL_BATCH', '/applied/ohaerin-nis/contract')
    const operations = JSON.parse(operationsBytes).operations; const inverse = JSON.parse(inverseBytes).operations
    const source = packet.sourceBeforeAfter.sources[0]; const current = await readFileImpl(resolve(root, source.sourcePath))
    check(packet.sourceBeforeAfter.schema === 'seoul-source-before-after.v1' && packet.sourceBeforeAfter.sources.length === 1
      && source.sourcePath === 'lore/characters/Core-Characters.json' && operations.length === 6 && inverse.length === 6
      && source.beforeSha256 === sha256(sourceBeforeBytes) && source.beforeBytes === sourceBeforeBytes.length
      && source.afterSha256 === sha256(sourceCandidateBytes) && source.afterBytes === sourceCandidateBytes.length
      && source.changed === true && source.sealed === false && current.equals(sourceCandidateBytes),
    'E_REVIEW_HASH', '/applied/ohaerin-nis/source')
    batch.sourceBeforeAfter = packet.sourceBeforeAfter
    return [...authenticated, batch]
  }
  if (registry.batches.length === 103 && registry.batches[102]?.approvalModel === 's16-unaffiliated-source-application-522') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 102) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const candidateRoot = resolve(root, '.omo/private/seoul-migration/s16-unaffiliated-candidate-20261017')
    const beforeByPath = new Map([
      [resolve(root, 'lore/characters/Cast-State-16.json'), resolve(candidateRoot, 'source-before.json')],
      [resolve(root, 'lore/characters/Cast-Unaffiliated.json'), resolve(candidateRoot, 'unaffiliated-source-before.json')],
    ])
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : beforeByPath.has(requested) ? readFileImpl(beforeByPath.get(requested)) : readFileImpl(requested)), root)
    check(authenticated.length === 102, 'E_APPROVAL_BATCH', '/applied/s16-unaffiliated/prefix')
    const batch = structuredClone(registry.batches[102])
    const [packetBytes, sourceBeforeAfterBytes, reviewBytes, reviewMarkdownBytes, manifestBytes,
      operationsBytes, inverseBytes, fullCardsBytes, verifyBytes, verifyExitBytes, verifyStdoutBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)), readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
      readFileImpl(resolve(root, batch.applicationReview.evidencePath)), readFileImpl(resolve(candidateRoot, 'independent-rereview4.md')),
      readFileImpl(resolve(candidateRoot, 'manifest.json')), readFileImpl(resolve(candidateRoot, 'operations.json')),
      readFileImpl(resolve(candidateRoot, 'inverse-operations.json')), readFileImpl(resolve(candidateRoot, 'full-cards.json')),
      readFileImpl(resolve(candidateRoot, 'verify.mjs')), readFileImpl(resolve(candidateRoot, 'verification-complete.exit.txt')),
      readFileImpl(resolve(candidateRoot, 'verification-complete.stdout.txt')),
    ])
    check(sha256(packetBytes) === batch.packetSha256 && sha256(reviewBytes) === batch.applicationReview.evidenceSha256,
      'E_REVIEW_HASH', '/applied/s16-unaffiliated/authentication')
    const packet = JSON.parse(packetBytes); const sourceBeforeAfter = JSON.parse(sourceBeforeAfterBytes); const review = JSON.parse(reviewBytes)
    check(packet.schema === 'seoul-s16-unaffiliated-source-application.v1' && packet.batchId === batch.batchId
      && packet.registryPrefix.count === 102 && sha256(prefixBytes) === packet.registryPrefix.sha256
      && packet.operationCount === 522 && review.verdict === 'confirmed'
      && sha256(manifestBytes) === packet.provenance.candidateManifest.sha256
      && sha256(operationsBytes) === packet.provenance.operations.sha256
      && sha256(inverseBytes) === packet.provenance.inverseOperations.sha256
      && sha256(fullCardsBytes) === packet.provenance.fullCards.sha256
      && sha256(reviewBytes) === packet.provenance.independentRereviewJson.sha256
      && sha256(reviewMarkdownBytes) === packet.provenance.independentRereviewMarkdown.sha256
      && sha256(verifyBytes) === packet.provenance.verifyScript.sha256
      && sha256(verifyExitBytes) === packet.provenance.verifyExitReceipt.sha256
      && sha256(verifyStdoutBytes) === packet.provenance.verifyStdoutReceipt.sha256
      && packet.renderVerification.cards === 70 && packet.renderVerification.renderBodies === 140
      && packet.renderVerification.koSha256 === 'd819802f4a5092fde661f2068140b3e6fb9be4a785f92774303d547002bc3093'
      && packet.renderVerification.enSha256 === '692320c8f5823e14c2dacc998933b4b340c4435cfe09dce6fc5ea5f2d2e0e76b'
      && packet.renderVerification.candidateByteExact === true,
    'E_APPROVAL_BATCH', '/applied/s16-unaffiliated/contract')
    const operations = JSON.parse(operationsBytes).operations; const inverse = JSON.parse(inverseBytes).operations
    check(operations.length === 522 && inverse.length === 522 && sourceBeforeAfter.schema === 'seoul-source-before-after.v1'
      && sourceBeforeAfter.batchId === batch.batchId && sourceBeforeAfter.sources.length === 2
      && eq(packet.sourceBeforeAfter, { schema: sourceBeforeAfter.schema, sources: sourceBeforeAfter.sources }),
    'E_REVIEW_COVERAGE', '/applied/s16-unaffiliated/denominators')
    for (const source of sourceBeforeAfter.sources) {
      const current = await readFileImpl(resolve(root, source.sourcePath))
      check(current.length === source.afterBytes && sha256(current) === source.afterSha256,
        'E_REVIEW_HASH', '/applied/s16-unaffiliated/source', source.sourcePath)
    }
    batch.sourceBeforeAfter = { schema: sourceBeforeAfter.schema, sources: sourceBeforeAfter.sources }
    return [...authenticated, batch]
  }
  if (registry.batches.length === 102 && registry.batches[101]?.approvalModel === 'office-rank-retrofit-734') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 101) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const candidateRoot = resolve(root, '.omo/private/seoul-migration/office-retrofit-candidate-20261017')
    const sourceBefore = JSON.parse(await readFileImpl(resolve(candidateRoot, 'source-before.json')))
    const beforeByPath = new Map(sourceBefore.files.map(row => [resolve(root, row.path), Buffer.from(row.gzipBase64, 'base64')]))
    for (const [sourcePath, gzip] of beforeByPath) beforeByPath.set(sourcePath, gunzipSync(gzip))
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : beforeByPath.has(requested) ? beforeByPath.get(requested) : readFileImpl(requested)), root)
    check(authenticated.length === 101, 'E_APPROVAL_BATCH', '/applied/office-rank-retrofit/prefix')
    const batch = structuredClone(registry.batches[101])
    const [packetBytes, reviewBytes, reviewMarkdownBytes, proposalBytes, approvalBytes, manifestBytes,
      candidateBytes, operationsBytes, inverseBytes, fullCardsBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)), readFileImpl(resolve(root, batch.applicationReview.evidencePath)),
      readFileImpl(resolve(candidateRoot, 'independent-rereview.md')),
      readFileImpl(resolve(root, '.omo/private/seoul-migration/office-rank-retrofit-proposal-20261017/proposal.json')),
      readFileImpl(resolve(root, '.omo/private/seoul-migration/office-rank-retrofit-proposal-20261017/owner-approval-20261017.json')),
      readFileImpl(resolve(candidateRoot, 'manifest.json')), readFileImpl(resolve(candidateRoot, 'source-candidate.json')),
      readFileImpl(resolve(candidateRoot, 'operations.json')), readFileImpl(resolve(candidateRoot, 'inverse-operations.json')),
      readFileImpl(resolve(candidateRoot, 'full-cards.json')),
    ])
    check(sha256(packetBytes) === batch.packetSha256 && sha256(reviewBytes) === batch.applicationReview.evidenceSha256,
      'E_REVIEW_HASH', '/applied/office-rank-retrofit/authentication')
    const packet = JSON.parse(packetBytes); const review = JSON.parse(reviewBytes); const candidate = JSON.parse(candidateBytes)
    check(packet.schema === 'seoul-office-rank-retrofit-source-application.v1' && packet.batchId === batch.batchId
      && packet.registryPrefix.count === 101 && sha256(prefixBytes) === packet.registryPrefix.sha256
      && packet.operationCount === 734 && packet.changedOperationCount === 703 && packet.zeroOpClaimCount === 31
      && sha256(proposalBytes) === packet.provenance.proposal.sha256
      && sha256(approvalBytes) === packet.provenance.ownerApproval.sha256
      && sha256(reviewBytes) === packet.provenance.independentRereviewJson.sha256
      && sha256(reviewMarkdownBytes) === packet.provenance.independentRereviewMarkdown.sha256
      && sha256(manifestBytes) === packet.provenance.candidateManifest.sha256
      && sha256(operationsBytes) === packet.provenance.operations.sha256
      && sha256(inverseBytes) === packet.provenance.inverseOperations.sha256
      && sha256(fullCardsBytes) === packet.provenance.fullCards.sha256
      && review.verdict === 'confirmed' && review.replay.forwardOperations === 734
      && review.livePins.allFiveSourceFilesAtExpectedBeforePins === true,
    'E_APPROVAL_BATCH', '/applied/office-rank-retrofit/contract')
    const operations = JSON.parse(operationsBytes).operations; const inverse = JSON.parse(inverseBytes).operations
    check(operations.length === 734 && inverse.length === 734 && candidate.files.length === 5
      && packet.sourceBeforeAfter.sources.length === 5, 'E_REVIEW_COVERAGE', '/applied/office-rank-retrofit/denominators')
    const sources = packet.sourceBeforeAfter.sources
    for (const source of sources) {
      const archived = sourceBefore.files.find(row => row.path === source.sourcePath)
      const target = candidate.files.find(row => row.path === source.sourcePath)
      const current = await readFileImpl(resolve(root, source.sourcePath))
      check(archived && target && archived.rawSha256 === source.beforeSha256 && archived.bytes === source.beforeBytes
        && target.targetRawSha256 === source.afterSha256 && target.targetBytes === source.afterBytes
        && current.length === source.afterBytes && sha256(current) === source.afterSha256,
      'E_REVIEW_HASH', '/applied/office-rank-retrofit/source', source.sourcePath)
    }
    const zeroOp = await readFileImpl(resolve(root, packet.zeroOpFile.path))
    const projectionPacket = JSON.parse(await readFileImpl(resolve(root, PROJECTION_REFRESH_DIRECTORY + 'application-packet.json')))
    const projectionSuccessor = projectionPacket.sourceBeforeAfter.sources.find(row => row.sourcePath === packet.zeroOpFile.path)
    check(sha256(zeroOp) === packet.zeroOpFile.sourceRawSha256
      || (projectionSuccessor?.beforeSha256 === packet.zeroOpFile.sourceRawSha256
        && projectionSuccessor.afterSha256 === sha256(zeroOp)),
      'E_REVIEW_HASH', '/applied/office-rank-retrofit/zero-op', packet.zeroOpFile.path)
    batch.sourceBeforeAfter = packet.sourceBeforeAfter
    return [...authenticated, batch]
  }
  if (registry.batches.length === 101 && registry.batches[100]?.approvalModel === 's15-reviewed-source-application-920') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 100) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const s15Path = resolve(root, 'lore/characters/Cast-State-15.json')
    const s15BeforePath = resolve(root, '.omo/private/seoul-migration/s15-reviewed-fullbody-prose-candidate-20261017/source-before.json')
    const authenticated = await loadAppliedBatches(inheritedReader(requested => requested === path ? prefixBytes
      : requested === s15Path ? readFileImpl(s15BeforePath) : readFileImpl(requested)), root)
    check(authenticated.length === 100, 'E_APPROVAL_BATCH', '/applied/s15/prefix')
    const batch = structuredClone(registry.batches[100])
    const [packetBytes, reviewBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)), readFileImpl(resolve(root, batch.applicationReview.evidencePath)),
      readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    check(sha256(packetBytes) === batch.packetSha256 && sha256(reviewBytes) === batch.applicationReview.evidenceSha256,
      'E_REVIEW_HASH', '/applied/s15/authentication')
    const packet = JSON.parse(packetBytes), review = JSON.parse(reviewBytes), manifest = JSON.parse(manifestBytes)
    check(packet.schema === 'seoul-s15-reviewed-source-successor.v1' && packet.batchId === batch.batchId
      && packet.registryPrefix.count === 100 && sha256(prefixBytes) === packet.registryPrefix.sha256
      && packet.operationCount === 920 && review.verdict === 'confirmed'
      && manifest.schema === 's15-reviewed-source-application.v1' && manifest.application.uniqueLeafReplacements === 920,
    'E_REVIEW_COVERAGE', '/applied/s15/contract')
    const source = { sourcePath: packet.source.sourcePath, beforeSha256: packet.source.beforeSha256,
      afterSha256: packet.source.afterSha256, beforeBytes: packet.source.beforeBytes, afterBytes: packet.source.afterBytes,
      changed: true, sealed: false }
    const current = await readFileImpl(resolve(root, source.sourcePath))
    check(current.length === source.afterBytes && sha256(current) === source.afterSha256,
      'E_REVIEW_HASH', '/applied/s15/disk', source.sourcePath)
    check(manifest.sources.length === 1 && manifest.sources[0].path === source.sourcePath
      && manifest.sources[0].before.rawSha256 === source.beforeSha256
      && manifest.sources[0].after.rawSha256 === source.afterSha256
      && manifest.sources[0].after.candidateByteIdentical === true,
    'E_REVIEW_HASH', '/applied/s15/manifest')
    batch.sourceBeforeAfter = { schema: 'seoul-source-before-after.v1', sources: [source] }
    return [...authenticated, batch]
  }
  if (registry.batches.length === 100 && registry.batches[99]?.approvalModel === 'combined-evidence-rebind-source-successor-1') {
    const prefix = { ...registry, batches: registry.batches.slice(0, 99) }
    const prefixBytes = Buffer.from(JSON.stringify(prefix, null, 2) + '\n')
    const combinedRoot = resolve(root, '.omo/private/seoul-migration/combined-evidence-rebind-candidate-20261017')
    const combinedManifest = JSON.parse(await readFileImpl(resolve(combinedRoot, 'source-before-after.json')))
    const beforeByPath = new Map(combinedManifest.sources.map(row => [resolve(root, row.consumerFile), resolve(combinedRoot, row.beforePath)]))
    const prefixReader = inheritedReader(async requested => requested === path ? prefixBytes : beforeByPath.has(requested) ? readFileImpl(beforeByPath.get(requested)) : readFileImpl(requested))
    const authenticated = await loadAppliedBatches(prefixReader, root)
    check(authenticated.length === 99, 'E_APPROVAL_BATCH', '/applied/combined/prefix')
    const batch = structuredClone(registry.batches[99])
    const [packetBytes, reviewBytes, manifestBytes] = await Promise.all([
      readFileImpl(resolve(root, batch.packetPath)), readFileImpl(resolve(root, batch.applicationReview.evidencePath)),
      readFileImpl(resolve(root, batch.sourceBeforeAfterPath)),
    ])
    check(sha256(packetBytes) === batch.packetSha256 && sha256(reviewBytes) === batch.applicationReview.evidenceSha256,
      'E_REVIEW_HASH', '/applied/combined/authentication')
    const packet = JSON.parse(packetBytes); const review = JSON.parse(reviewBytes); const manifest = JSON.parse(manifestBytes)
    check(['seoul-combined-evidence-rebind-candidate.v3','seoul-combined-evidence-rebind-candidate.v4','seoul-combined-evidence-rebind-candidate.r4'].includes(packet.schema) && ['candidate-verified-owner-authorized-removal','candidate-verified-symmetric-direct-attribution','candidate-verified-r4-two-row-resolution'].includes(review.verdict)
      && ['seoul-combined-source-before-after.v3','seoul-combined-source-before-after.v4','seoul-combined-source-before-after.r4'].includes(manifest.schema) && manifest.sources.length === 26,
    'E_REVIEW_COVERAGE', '/applied/combined/contract')
    const sources = manifest.sources.map(row => ({ sourcePath: row.consumerFile, beforeSha256: row.beforeSha256,
      afterSha256: row.candidateSha256, beforeBytes: row.beforeBytes, afterBytes: row.candidateBytes,
      changed: row.beforeSha256 !== row.candidateSha256, sealed: false }))
    for (const source of sources) {
      const current = await readFileImpl(resolve(root, source.sourcePath))
      const repin = await authenticateRepinSuccessor(root, appliedAuthorityReaders.get(readFileImpl) ?? readFileImpl)
      const successor = repin.transitions.find(row => row.path === source.sourcePath
        && row.beforeSha256 === source.afterSha256)
      const finalSuccessor = (await loadFinalSuccessor(root, readFileImpl)).transitions.find(row => row.path === source.sourcePath
        && (row.beforeSha256 === source.afterSha256 || row.beforeSha256 === successor?.afterSha256))
      check(sha256(current) === source.afterSha256 || successor?.afterSha256 === sha256(current)
        || finalSuccessor?.afterSha256 === sha256(current),
        'E_REVIEW_HASH', '/applied/combined/disk', source.sourcePath)
    }
    batch.sourceBeforeAfter = { schema: 'seoul-source-before-after.v1', sources }
    return [...authenticated, batch]
  }
  // Authenticate the complete successor before lending its archived preimages
  // to validators for older receipts over the same source paths.
  const s14Batch = registry.batches.find(batch => batch.batchId === S14_REVIEWED_SOURCE.id
    || batch.approvalModel === S14_REVIEWED_SOURCE.id)
  let s14Before = null
  if (s14Batch) {
    check([97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[96] === s14Batch,
      'E_APPROVAL_BATCH', '/applied/s14/position')
    const packetBytes = await readFileImpl(resolve(root, S14_REVIEWED_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S14_REVIEWED_SOURCE.directory + 'source-before-after.json')))
    s14Before = await validateS14ReviewedSource(s14Batch, packetBytes, manifest,
      readFileImpl, root, registry.batches.slice(0, 96))
  }
  const soulAssignmentsRebindBatch = registry.batches.find(batch => batch.batchId === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.id
    || (batch.approvalModel === 'evidence-reference-rebind-only' && batch.batchId === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.id))
  if (soulAssignmentsRebindBatch) {
    check([98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[97] === soulAssignmentsRebindBatch,
      'E_APPROVAL_BATCH', '/applied/soul-assignments-rebind/position')
    const packetBytes = await readFileImpl(resolve(root, SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.directory + 'source-before-after.json')))
    await validateSoulAssignmentsEvidenceRebindSource(soulAssignmentsRebindBatch, packetBytes, manifest,
      readFileImpl, root, registry.batches.slice(0, 97))
  }
  const soulBatchesSpecialRebindBatch = registry.batches.find(batch => batch.batchId === SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE.id)
  let soulBatchesSpecialBefore = null
  if (soulBatchesSpecialRebindBatch) {
    check([99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[98] === soulBatchesSpecialRebindBatch,
      'E_APPROVAL_BATCH', '/applied/soul-batches-special-rebind/position')
    const packetBytes = await readFileImpl(resolve(root, SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE.directory + 'registration-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE.directory + 'source-before-after.json')))
    soulBatchesSpecialBefore = await validateSoulBatchesSpecialEvidenceRebindSource(soulBatchesSpecialRebindBatch, packetBytes,
      manifest, readFileImpl, root, registry.batches.slice(0, 98))
  }
  const s12Batch = registry.batches.find(batch => batch.batchId === S12_REVIEWED_SOURCE.id
    || batch.approvalModel === S12_REVIEWED_SOURCE.id)
  let s12Before = null
  if (s12Batch) {
    check([96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[95] === s12Batch,
      'E_APPROVAL_BATCH', '/applied/s12/position')
    const packetBytes = await readFileImpl(resolve(root, S12_REVIEWED_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S12_REVIEWED_SOURCE.directory + 'source-before-after.json')))
    s12Before = await validateS12ReviewedSource(s12Batch, packetBytes, manifest,
      readFileImpl, root, registry.batches.slice(0, 95))
  }
  const s13Batch = registry.batches.find(batch => batch.batchId === S13_REVIEWED_SOURCE.id
    || batch.approvalModel === S13_REVIEWED_SOURCE.id)
  let s13Before = null
  if (s13Batch) {
    check([95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[94] === s13Batch,
      'E_APPROVAL_BATCH', '/applied/s13/position')
    const packetBytes = await readFileImpl(resolve(root, S13_REVIEWED_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S13_REVIEWED_SOURCE.directory + 'source-before-after.json')))
    s13Before = await validateS13ReviewedSource(s13Batch, packetBytes, manifest,
      readFileImpl, root, registry.batches.slice(0, 94))
  }
  const s10Batch = registry.batches.find(batch => batch.batchId === S10_REVIEWED_SOURCE.id
    || batch.approvalModel === S10_REVIEWED_SOURCE.id)
  let s10Before = null
  if (s10Batch) {
    check([94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[93] === s10Batch,
      'E_APPROVAL_BATCH', '/applied/s10/position')
    const packetBytes = await readFileImpl(resolve(root, S10_REVIEWED_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S10_REVIEWED_SOURCE.directory + 'source-before-after.json')))
    s10Before = await validateS10ReviewedSource(s10Batch, packetBytes, manifest,
      readFileImpl, root, registry.batches.slice(0, 93))
  }
  const s11Batch = registry.batches.find(batch => batch.batchId === S11_REVIEWED_SOURCE.id
    || batch.approvalModel === S11_REVIEWED_SOURCE.id)
  let s11Before = null
  if (s11Batch) {
    check([93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[92] === s11Batch,
      'E_APPROVAL_BATCH', '/applied/s11/position')
    const packetBytes = await readFileImpl(resolve(root, S11_REVIEWED_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S11_REVIEWED_SOURCE.directory + 'source-before-after.json')))
    s11Before = await validateS11ReviewedSource(s11Batch, packetBytes, manifest,
      readFileImpl, root, registry.batches.slice(0, 92))
  }
  const profileTwoReferenceBatch = registry.batches.find(batch => batch.batchId === PROFILE_TWO_REFERENCE_SOURCE.id
    || batch.approvalModel === PROFILE_TWO_REFERENCE_SOURCE.id)
  let profileTwoReferenceBefore = null
  if (profileTwoReferenceBatch) {
    check([92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[91] === profileTwoReferenceBatch,
      'E_APPROVAL_BATCH', '/applied/profile-two-reference/position')
    const packetBytes = await readFileImpl(resolve(root, PROFILE_TWO_REFERENCE_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, PROFILE_TWO_REFERENCE_SOURCE.directory + 'source-before-after.json')))
    profileTwoReferenceBefore = await validateProfileTwoReferenceSource(profileTwoReferenceBatch, packetBytes, manifest,
      readFileImpl, root, registry.batches.slice(0, 91))
  }
  const s09Batch = registry.batches.find(batch => batch.batchId === S09_V3_SOURCE.id || batch.approvalModel === S09_V3_SOURCE.id)
  let s09Before = null
  if (s09Batch) {
    check([91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[90] === s09Batch,
      'E_APPROVAL_BATCH', '/applied/s09-v3/position')
    const packetBytes = await readFileImpl(resolve(root, S09_V3_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S09_V3_SOURCE.directory + 'source-before-after.json')))
    s09Before = await validateS09V3Source(s09Batch, packetBytes, manifest, readFileImpl, root, registry.batches.slice(0, 90))
  }
  const s07Batch = registry.batches.find(batch => batch.batchId === S07_V2_SOURCE.id || batch.approvalModel === S07_V2_SOURCE.id)
  let s07Before = null
  if (s07Batch) {
    check([90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].includes(registry.batches.length) && registry.batches[89] === s07Batch,
      'E_APPROVAL_BATCH', '/applied/s07-v2/position')
    const packetBytes = await readFileImpl(resolve(root, S07_V2_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S07_V2_SOURCE.directory + 'source-before-after.json')))
    s07Before = await validateS07V2Source(s07Batch, packetBytes, manifest, readFileImpl, root, registry.batches.slice(0, 89))
  }
  const s08Batch = registry.batches.find(batch => batch.batchId === S08_V2_SOURCE.id || batch.approvalModel === S08_V2_SOURCE.id)
  let s08Before = null
  if (s08Batch) {
    check(registry.batches.length === (s07Before ? registry.batches.length : 89) && registry.batches[88] === s08Batch,
      'E_APPROVAL_BATCH', '/applied/s08-v2/position')
    const packetBytes = await readFileImpl(resolve(root, S08_V2_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S08_V2_SOURCE.directory + 'source-before-after.json')))
    s08Before = await validateS08V2Source(s08Batch, packetBytes, manifest, readFileImpl, root, registry.batches.slice(0, 88))
  }
  const s04Batch = registry.batches.find(batch => batch.batchId === S04_V4_SOURCE.id || batch.approvalModel === S04_V4_SOURCE.id)
  let s04Before = null
  if (s04Batch) {
    check(registry.batches.length === (s07Before ? registry.batches.length : s08Before ? 89 : 88) && registry.batches[87] === s04Batch,
      'E_APPROVAL_BATCH', '/applied/s04-v4/position')
    const packetBytes = await readFileImpl(resolve(root, S04_V4_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S04_V4_SOURCE.directory + 'source-before-after.json')))
    s04Before = await validateS04V4Source(s04Batch, packetBytes, manifest, readFileImpl, root, registry.batches.slice(0, 87))
  }
  const s05Batch = registry.batches.find(batch => batch.batchId === S05_V2_SOURCE.id || batch.approvalModel === S05_V2_SOURCE.id)
  let s05Before = null
  if (s05Batch) {
    check(registry.batches.length === (s07Before ? registry.batches.length : s08Before ? 89 : s04Before ? 88 : 87) && registry.batches[86] === s05Batch,
      'E_APPROVAL_BATCH', '/applied/s05-v2/position')
    const packetBytes = await readFileImpl(resolve(root, S05_V2_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S05_V2_SOURCE.directory + 'source-before-after.json')))
    s05Before = await validateS05V2Source(s05Batch, packetBytes, manifest, readFileImpl, root, registry.batches.slice(0, 86))
  }
  const s06Batch = registry.batches.find(batch => batch.batchId === S06_V2_SOURCE.id || batch.approvalModel === S06_V2_SOURCE.id)
  let s06Before = null
  if (s06Batch) {
    check(registry.batches.length === (s07Before ? registry.batches.length : s08Before ? 89 : s04Before ? 88 : s05Before ? 87 : 86) && registry.batches[85] === s06Batch,
      'E_APPROVAL_BATCH', '/applied/s06-v2/position')
    const packetBytes = await readFileImpl(resolve(root, S06_V2_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, S06_V2_SOURCE.directory + 'source-before-after.json')))
    s06Before = await validateS06V2Source(s06Batch, packetBytes, manifest, readFileImpl, root, registry.batches.slice(0, 85))
  }
  const styleBatch = registry.batches.find(batch => batch.batchId === STYLE_V4_SOURCE.id || batch.approvalModel === STYLE_V4_SOURCE.id)
  let styleBefore = new Map()
  if (styleBatch) {
    const prefix = registry.batches.slice(0, 84)
    const packetBytes = await readFileImpl(resolve(root, STYLE_V4_SOURCE.directory + 'application-packet.json'))
    const manifest = JSON.parse(await readFileImpl(resolve(root, STYLE_V4_SOURCE.directory + 'source-before-after.json')))
    await validateStyleV4Source(styleBatch, packetBytes, manifest, readFileImpl, root, prefix)
    const archive = JSON.parse(await readFileImpl(resolve(root, STYLE_V4_SOURCE.directory + 'before-raw.json')))
    styleBefore = new Map(archive.sources.map(row => [resolve(root, row.sourcePath), gunzipSync(Buffer.from(row.gzipBase64, 'base64'))]))
  }
  // Authenticate the successor before exposing any archived code to historical validators.
  const historicalRenderer = await validateRendererHeadingSuccessor(registry, readFileImpl, root)
  const stableThreePrefix = registry.batches.slice(0, 71).map(batch => structuredClone(batch))
  const vassalCodePrefix = registry.batches.slice(0, 72).map(batch => structuredClone(batch))
  const householdProjectionPrefix = registry.batches.slice(0, 73).map(batch => structuredClone(batch))
  const coreSixPrefix = registry.batches.slice(0, 74).map(batch => structuredClone(batch))
  const publicationPrefix = registry.batches.slice(0, 75).map(batch => structuredClone(batch))
  const s01Prefix = registry.batches.slice(0, 76).map(batch => structuredClone(batch))
  const coreFourPrefix = registry.batches.slice(0, 77).map(batch => structuredClone(batch))
  const atlasV5Prefix = registry.batches.slice(0, 78).map(batch => structuredClone(batch))
  const s02Prefix = registry.batches.slice(0, 79).map(batch => structuredClone(batch))
  const s03Prefix = registry.batches.slice(0, 80).map(batch => structuredClone(batch))
  const atlas82Prefix = registry.batches.slice(0, 81).map(batch => structuredClone(batch))
  const atlas83Prefix = registry.batches.slice(0, 82).map(batch => structuredClone(batch))
  const styleV4Prefix = registry.batches.slice(0, 84).map(batch => structuredClone(batch))
  const s06V2Prefix = registry.batches.slice(0, 85).map(batch => structuredClone(batch))
  const s04V4Prefix = registry.batches.slice(0, 87).map(batch => structuredClone(batch))
  const s08V2Prefix = registry.batches.slice(0, 88).map(batch => structuredClone(batch))
  const s07V2Prefix = registry.batches.slice(0, 89).map(batch => structuredClone(batch))
  const profileTwoReferencePrefix = registry.batches.slice(0, 91).map(batch => structuredClone(batch))
  const s11ReviewedPrefix = registry.batches.slice(0, 92).map(batch => structuredClone(batch))
  const s10ReviewedPrefix = registry.batches.slice(0, 93).map(batch => structuredClone(batch))
  const s13ReviewedPrefix = registry.batches.slice(0, 94).map(batch => structuredClone(batch))
  const s12ReviewedPrefix = registry.batches.slice(0, 95).map(batch => structuredClone(batch))
  const hasS03 = registry.batches.some(batch => batch.approvalModel === S03_REVIEWED_SOURCE.id)
  const s03Archive = hasS03 ? JSON.parse(await readFileImpl(resolve(root, S03_REVIEWED_SOURCE.directory + 'before-raw.json'))) : null
  const s03Before = new Map(s03Archive?.sources.map(row => [resolve(root, row.sourcePath), gunzipSync(Buffer.from(row.gzipBase64, 'base64'))]) ?? [])
  const fiveSourcePrefix = registry.batches.slice(0, 67).map(batch => structuredClone(batch))
  const chronologyPrefix = registry.batches.slice(0, 68).map(batch => structuredClone(batch))
  const chronologyPrefixSha256 = sha256(Buffer.from(JSON.stringify({ ...registry, batches: chronologyPrefix }, null, 2) + '\n'))
  const appointmentsPrefix = registry.batches.slice(0, 69).map(batch => structuredClone(batch))
  const fourDocumentsPrefix = registry.batches.slice(0, 70).map(batch => structuredClone(batch))
  const linkRetargetPrefix = registry.batches.slice(0, 105).map(batch => structuredClone(batch))
  const linkRetargetEnPrefix = registry.batches.slice(0, 106).map(batch => structuredClone(batch))
  for (const batch of registry.batches) {
    const historicalAtlas = batch.approvalModel === ATLAS82_SOURCE.id || batch.approvalModel === ATLAS83_SOURCE.id
    const readBatchBytes = async path => {
      const s14SourcePath = relative(root, path)
      if (s14Before && batch.approvalModel !== S14_REVIEWED_SOURCE.id
        && (s14SourcePath === 'lore/characters/Cast-State-14.json'
          || (batch.approvalModel === S03_REVIEWED_SOURCE.id && s14SourcePath === 'lore/characters/Core-Characters.json')))
        return s14Before.get(s14SourcePath)
      if (s12Before && batch.approvalModel !== S12_REVIEWED_SOURCE.id
        && path === resolve(root, 'lore/characters/Cast-State-12.json')) return s12Before
      if (s13Before && batch.approvalModel !== S13_REVIEWED_SOURCE.id
        && path === resolve(root, 'lore/characters/Cast-State-13.json')) return s13Before
      if (s10Before && batch.approvalModel !== S10_REVIEWED_SOURCE.id
        && path === resolve(root, 'lore/characters/Cast-State-10.json')) return s10Before
      if (s11Before && batch.approvalModel !== S11_REVIEWED_SOURCE.id
        && path === resolve(root, 'lore/characters/Cast-State-11.json')) return s11Before
      if (profileTwoReferenceBefore && batch.approvalModel !== PROFILE_TWO_REFERENCE_SOURCE.id
        && path === resolve(root, 'lore/editorial/profile-batches/state-09-10.json')) return profileTwoReferenceBefore
      if (s09Before && batch.approvalModel !== S09_V3_SOURCE.id && path === resolve(root, 'lore/characters/Cast-State-09.json')) return s09Before
      if (s07Before && batch.approvalModel !== S07_V2_SOURCE.id && path === resolve(root, 'lore/characters/Cast-State-07.json')) return s07Before
      if (s08Before && batch.approvalModel !== S08_V2_SOURCE.id && path === resolve(root, 'lore/characters/Cast-State-08.json')) return s08Before
      if (s04Before && batch.approvalModel !== S04_V4_SOURCE.id && path === resolve(root, 'lore/characters/Cast-State-04.json')) return s04Before
      if (s05Before && batch.approvalModel !== S05_V2_SOURCE.id && path === resolve(root, 'lore/characters/Cast-State-05.json')) return s05Before
      if (s06Before && batch.approvalModel !== S06_V2_SOURCE.id && path === resolve(root, 'lore/characters/Cast-State-06.json')) return s06Before
      if (soulBatchesSpecialBefore && batch.batchId !== SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE.id
        && path === resolve(root, 'lore/editorial/soul-batches/special.json')) return soulBatchesSpecialBefore
      if (historicalRenderer && historicalAtlas && path === resolve(root, 'scripts/world-atlas-render.mjs')) return historicalRenderer.bytes
      if (batch.approvalModel !== STYLE_V4_SOURCE.id && styleBefore.has(path)) return styleBefore.get(path)
      return batch.approvalModel === S03_REVIEWED_SOURCE.id ? readFileImpl(path) : s03Before.get(path) ?? readFileImpl(path)
    }
    appliedAuthorityReaders.set(readBatchBytes, appliedAuthorityReaders.get(readFileImpl) ?? readFileImpl)
    check(batch.state === 'applied' && typeof batch.batchId === 'string' && batch.batchId.trim().length > 0 && Array.isArray(batch.personIds) && Array.isArray(batch.approvals)
      && /^[a-f0-9]{64}$/.test(batch.packetSha256), 'E_SCOPE_SHAPE', '/applied/batch', batch.batchId)
    // 두 가지 승인 모델: (a) 파일럿류 전신본 승인 — 세 종류가 모두 해당 배치 본문에 대한 승인.
    // (b) proposal+style-contract — 2026-10-15 소유자 일괄 승인 아래 정확한 제안 적용:
    // batch-allocation은 승인된 기계 제안서 바이트에 해시로 결속되고,
    // 문체는 소유자가 대량 개정용으로 승인한 v2 표본 계약(styleContract)을 참조한다.
    // styleContract 참조는 이 배치의 본문이 표본과 동일하다는 주장이 아니다.
    const STYLE_CONTRACT = {
      'article-style': { bodySha256: '86b9a928db0f18fa557e1375962d0e1f1364dd0b99f609572a6847f644162a5c', messageRef: 'question:call_O2vBRaRk6wWpFEElnoh4Tgmg' },
      'card-style': { bodySha256: '465f9cde88644e349734525550882c89afdc9b448243b6cbf33f6f06de43c54a', messageRef: 'question:call_O2vBRaRk6wWpFEElnoh4Tgmg' }
    }
    const validApproval = a => a && /^[a-f0-9]{64}$/.test(a.bodySha256) && typeof a.messageRef === 'string' && a.messageRef.trim().length > 0
    if (Object.hasOwn(COMPLETED_SOURCE_TRANSITIONS, batch.approvalModel)) {
      check(batch.batchId === batch.approvalModel, 'E_APPROVAL_BATCH', '/applied/completed-source')
    } else if (batch.approvalModel === STABLE_THREE_SOURCE.id) {
      check(batch.batchId === STABLE_THREE_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/stable-three')
    } else if (batch.approvalModel === VASSAL_CODE_SUCCESSOR.id) {
      check(batch.batchId === VASSAL_CODE_SUCCESSOR.id, 'E_APPROVAL_BATCH', '/applied/vassal-code')
    } else if (batch.approvalModel === HOUSEHOLD_PROJECTION_SUCCESSOR.id) {
      check(batch.batchId === HOUSEHOLD_PROJECTION_SUCCESSOR.id, 'E_APPROVAL_BATCH', '/applied/household-projection')
    } else if (batch.approvalModel === CORE_SIX_SOURCE.id) {
      check(batch.batchId === CORE_SIX_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/core-six')
    } else if (batch.approvalModel === PUBLICATION_V4_SOURCE.id) {
      check(batch.batchId === PUBLICATION_V4_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/publication-v4')
    } else if (batch.approvalModel === 's01-reviewed-source-successor') {
      check(batch.batchId === S01_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s01')
    } else if (batch.approvalModel === CORE_FOUR_SOURCE.id) {
      check(batch.batchId === CORE_FOUR_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/core-four')
    } else if (batch.approvalModel === ATLAS_V5_SOURCE.id) {
      check(batch.batchId === ATLAS_V5_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/atlas-v5')
    } else if (batch.approvalModel === ATLAS82_SOURCE.id) {
      check(batch.batchId === ATLAS82_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/atlas82')
    } else if (batch.approvalModel === ATLAS83_SOURCE.id) {
      check(batch.batchId === ATLAS83_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/atlas83')
    } else if (batch.approvalModel === RENDERER_HEADING_SUCCESSOR.id) {
      check(batch.batchId === RENDERER_HEADING_SUCCESSOR.id && historicalRenderer,
        'E_APPROVAL_BATCH', '/applied/renderer-heading')
    } else if (batch.approvalModel === STYLE_V4_SOURCE.id) {
      check(batch.batchId === STYLE_V4_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/style-v4')
    } else if (batch.approvalModel === S05_V2_SOURCE.id) {
      check(batch.batchId === S05_V2_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s05-v2')
    } else if (batch.approvalModel === S04_V4_SOURCE.id) {
      check(batch.batchId === S04_V4_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s04-v4')
    } else if (batch.approvalModel === S08_V2_SOURCE.id) {
      check(batch.batchId === S08_V2_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s08-v2')
    } else if (batch.approvalModel === S09_V3_SOURCE.id) {
      check(batch.batchId === S09_V3_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s09-v3')
    } else if (batch.approvalModel === PROFILE_TWO_REFERENCE_SOURCE.id) {
      check(batch.batchId === PROFILE_TWO_REFERENCE_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/profile-two-reference')
    } else if (batch.approvalModel === S11_REVIEWED_SOURCE.id) {
      check(batch.batchId === S11_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s11')
    } else if (batch.approvalModel === S10_REVIEWED_SOURCE.id) {
      check(batch.batchId === S10_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s10')
    } else if (batch.approvalModel === S13_REVIEWED_SOURCE.id) {
      check(batch.batchId === S13_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s13')
    } else if (batch.approvalModel === S12_REVIEWED_SOURCE.id) {
      check(batch.batchId === S12_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s12')
    } else if (batch.approvalModel === S14_REVIEWED_SOURCE.id) {
      check(batch.batchId === S14_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s14')
    } else if (batch.approvalModel === 'evidence-reference-rebind-only') {
      check(batch.batchId === SOUL_ASSIGNMENTS_EVIDENCE_REBIND_SOURCE.id
        || batch.batchId === SOUL_BATCHES_SPECIAL_EVIDENCE_REBIND_SOURCE.id,
      'E_APPROVAL_BATCH', '/applied/evidence-reference-rebind')
    } else if (batch.approvalModel === S07_V2_SOURCE.id) {
      check(batch.batchId === S07_V2_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s07-v2')
    } else if (batch.approvalModel === S06_V2_SOURCE.id) {
      check(batch.batchId === S06_V2_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s06-v2')
    } else if (batch.approvalModel === S02_REVIEWED_SOURCE.id) {
      check(batch.batchId === S02_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s02')
    } else if (batch.approvalModel === S03_REVIEWED_SOURCE.id) {
      check(batch.batchId === S03_REVIEWED_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/s03')
    } else if (batch.approvalModel === FIVE_SOURCE_SUCCESSOR.batchId) {
      check(batch.batchId === FIVE_SOURCE_SUCCESSOR.batchId, 'E_APPROVAL_BATCH', '/applied/five-source')
    } else if (batch.approvalModel === CHRONOLOGY_SUCCESSOR.batchId) {
      check(batch.batchId === CHRONOLOGY_SUCCESSOR.batchId, 'E_APPROVAL_BATCH', '/applied/chronology')
    } else if (batch.approvalModel === APPOINTMENTS_SUCCESSOR.batchId) {
      check(batch.batchId === APPOINTMENTS_SUCCESSOR.batchId, 'E_APPROVAL_BATCH', '/applied/appointments')
    } else if (batch.approvalModel === FOUR_DOCUMENTS_STATUS.batchId) {
      check(batch.batchId === FOUR_DOCUMENTS_STATUS.batchId, 'E_APPROVAL_BATCH', '/applied/four-documents')
    } else if (Object.hasOwn(POST62_SOURCE_APPLICATIONS, batch.approvalModel)) {
      check(batch.batchId === batch.approvalModel, 'E_APPROVAL_BATCH', '/applied/post62')
    } else if (batch.approvalModel === 'approved-rights-transition') {
      check(batch.batchId === 'approved-rights-transition', 'E_APPROVAL_BATCH', '/applied/rights')
    } else if (Object.hasOwn(BOUNDED_REPAIRS, batch.approvalModel)) {
      check(batch.batchId === batch.approvalModel, 'E_APPROVAL_BATCH', '/applied/bounded-repair', batch.batchId)
    } else if (Object.hasOwn(SOURCE_REPAIRS, batch.approvalModel)) {
      check(batch.batchId === SOURCE_REPAIRS[batch.approvalModel].batchId, 'E_APPROVAL_BATCH', '/applied/source-repair', batch.batchId)
    } else if (batch.approvalModel === 'evidence-rebinding') {
      // Fully checked against the owner receipt, exact operations and snapshots below.
      check(batch.batchId === 'gurps-rebind-7', 'E_APPROVAL_BATCH', '/applied/evidence-only', batch.batchId)
    } else if (batch.approvalModel === LINK_RETARGET_SOURCE.id) {
      // Fully checked against the direct-link review, exact operations and per-file archives below.
      check(batch.batchId === LINK_RETARGET_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/publication-link-retarget', batch.batchId)
    } else if (batch.approvalModel === LINK_RETARGET_EN_SOURCE.id) {
      // Fully checked against the direct-link review and its English parity twin.
      check(batch.batchId === LINK_RETARGET_EN_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/publication-link-retarget-en', batch.batchId)
    } else if (batch.approvalModel === POST108_EIGHT_DOCUMENT_SOURCE.id) {
      check(batch.batchId === POST108_EIGHT_DOCUMENT_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/post108-eight-document', batch.batchId)
    } else if (batch.approvalModel === OWNER_LINK_TIDY_SOURCE.id) {
      // Fully checked against the recorded owner link-tidy decision.
      check(batch.batchId === OWNER_LINK_TIDY_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/owner-link-tidy', batch.batchId)
    } else if (batch.approvalModel === PROJECTION_REFRESH_SOURCE.id) {
      check(batch.batchId === PROJECTION_REFRESH_SOURCE.id, 'E_APPROVAL_BATCH', '/applied/projection-refresh', batch.batchId)
    } else if (batch.approvalModel === 'proposal+style-contract') {
      const allocation = batch.approvals.find(a => a.kind === 'batch-allocation')
      check(validApproval(allocation), 'E_APPROVAL_KIND', '/applied/approvals', batch.batchId)
      const proposalBytes = await readFileImpl(resolve(root, `.omo/private/seoul-migration/task-8-batch-proposal-${batch.batchId}.json`))
      check(allocation.bodySha256 === sha256(proposalBytes), 'E_APPROVAL_BATCH', '/applied/proposal', batch.batchId)
      for (const kind of ['article-style', 'card-style']) {
        const ref = batch.approvals.find(a => a.kind === kind && a.styleContract === true)
        check(validApproval(ref) && ref.bodySha256 === STYLE_CONTRACT[kind].bodySha256 && ref.messageRef === STYLE_CONTRACT[kind].messageRef, 'E_APPROVAL_KIND', '/applied/style-contract', batch.batchId)
      }
    } else {
      for (const kind of ['batch-allocation', 'article-style', 'card-style'])
        check(batch.approvals.some(a => a.kind === kind && /^[a-f0-9]{64}$/.test(a.bodySha256) && typeof a.messageRef === 'string' && a.messageRef.trim().length > 0), 'E_APPROVAL_KIND', '/applied/approvals', batch.batchId)
    }
    const packetBytes = await readBatchBytes(resolve(root, batch.packetPath))
    check(sha256(packetBytes) === batch.packetSha256, 'E_APPROVAL_BATCH', '/applied/packet', batch.batchId)
    const reviewBytes = await readBatchBytes(resolve(root, batch.applicationReview.evidencePath))
    check(sha256(reviewBytes) === batch.applicationReview.evidenceSha256, 'E_REVIEW_HASH', '/applied/review', batch.batchId)
    const beforeAfter = JSON.parse(Buffer.from(await readBatchBytes(resolve(root, batch.sourceBeforeAfterPath))).toString())
    if (Object.hasOwn(COMPLETED_SOURCE_TRANSITIONS, batch.approvalModel)) await validateCompletedSourceTransition(batch, packetBytes, beforeAfter, readBatchBytes, root)
    if (batch.approvalModel === STABLE_THREE_SOURCE.id) await validateStableThreeSource(batch, packetBytes, beforeAfter, readBatchBytes, root,
      stableThreePrefix)
    if (batch.approvalModel === VASSAL_CODE_SUCCESSOR.id) await validateVassalCodeSuccessor(batch, packetBytes, beforeAfter, readBatchBytes, root,
      vassalCodePrefix)
    if (batch.approvalModel === HOUSEHOLD_PROJECTION_SUCCESSOR.id) await validateHouseholdProjectionSuccessor(batch, packetBytes, beforeAfter, readBatchBytes, root,
      householdProjectionPrefix)
    if (batch.approvalModel === CORE_SIX_SOURCE.id) await validateCoreSixSource(batch, packetBytes, beforeAfter, readBatchBytes, root,
      coreSixPrefix)
    if (batch.approvalModel === PUBLICATION_V4_SOURCE.id) await validatePublicationV4Source(batch, packetBytes, beforeAfter, readBatchBytes, root,
      publicationPrefix)
    if (batch.approvalModel === LINK_RETARGET_SOURCE.id) await validateLinkRetargetSource(batch, packetBytes, beforeAfter, readBatchBytes, root,
      linkRetargetPrefix)
    if (batch.approvalModel === LINK_RETARGET_EN_SOURCE.id) await validateLinkRetargetEnSource(batch, packetBytes, beforeAfter, readBatchBytes, root,
      linkRetargetEnPrefix)
    if (batch.approvalModel === POST108_EIGHT_DOCUMENT_SOURCE.id) await validatePost108EightDocumentSource(batch, packetBytes, beforeAfter, readBatchBytes, root, registry.batches.slice(0, registry.batches.indexOf(batch)))
    if (batch.approvalModel === OWNER_LINK_TIDY_SOURCE.id) await validateOwnerLinkTidySource(batch, packetBytes, beforeAfter, readBatchBytes, root,
      registry.batches.slice(0, registry.batches.indexOf(batch)))
    if (batch.approvalModel === PROJECTION_REFRESH_SOURCE.id) await validateProjectionRefreshSource(batch, packetBytes, beforeAfter,
      readBatchBytes, root, registry.batches.slice(0, registry.batches.indexOf(batch)))
    if (batch.approvalModel === 's01-reviewed-source-successor') await validateS01ReviewedSource(batch, packetBytes, beforeAfter, readBatchBytes, root, s01Prefix)
    if (batch.approvalModel === CORE_FOUR_SOURCE.id) await validateCoreFourSource(batch, packetBytes, beforeAfter, readBatchBytes, root, coreFourPrefix)
    if (batch.approvalModel === ATLAS_V5_SOURCE.id) await validateAtlasV5Source(batch, packetBytes, beforeAfter, readBatchBytes, root, atlasV5Prefix)
    if (batch.approvalModel === ATLAS82_SOURCE.id) await validateAtlas82Source(batch, packetBytes, beforeAfter, readBatchBytes, root, atlas82Prefix, historicalRenderer)
    if (batch.approvalModel === ATLAS83_SOURCE.id) await validateAtlas83Source(batch, packetBytes, beforeAfter, readBatchBytes, root, atlas83Prefix)
    if (batch.approvalModel === STYLE_V4_SOURCE.id) await validateStyleV4Source(batch, packetBytes, beforeAfter, readBatchBytes, root, styleV4Prefix)
    if (batch.approvalModel === S06_V2_SOURCE.id) await validateS06V2Source(batch, packetBytes, beforeAfter, readFileImpl, root, s06V2Prefix)
    if (batch.approvalModel === S04_V4_SOURCE.id) await validateS04V4Source(batch, packetBytes, beforeAfter, readFileImpl, root, s04V4Prefix)
    if (batch.approvalModel === S08_V2_SOURCE.id) await validateS08V2Source(batch, packetBytes, beforeAfter, readFileImpl, root, s08V2Prefix)
    if (batch.approvalModel === S07_V2_SOURCE.id) await validateS07V2Source(batch, packetBytes, beforeAfter, readFileImpl, root, s07V2Prefix)
    if (batch.approvalModel === PROFILE_TWO_REFERENCE_SOURCE.id) await validateProfileTwoReferenceSource(batch, packetBytes, beforeAfter,
      readFileImpl, root, profileTwoReferencePrefix)
    if (batch.approvalModel === S11_REVIEWED_SOURCE.id) await validateS11ReviewedSource(batch, packetBytes, beforeAfter,
      readFileImpl, root, s11ReviewedPrefix)
    if (batch.approvalModel === S10_REVIEWED_SOURCE.id) await validateS10ReviewedSource(batch, packetBytes, beforeAfter,
      readFileImpl, root, s10ReviewedPrefix)
    if (batch.approvalModel === S13_REVIEWED_SOURCE.id) await validateS13ReviewedSource(batch, packetBytes, beforeAfter,
      readFileImpl, root, s13ReviewedPrefix)
    if (batch.approvalModel === S12_REVIEWED_SOURCE.id) await validateS12ReviewedSource(batch, packetBytes, beforeAfter,
      readFileImpl, root, s12ReviewedPrefix)
    if (batch.approvalModel === S14_REVIEWED_SOURCE.id) beforeAfter.sources = JSON.parse(packetBytes).sources
    if (batch.approvalModel === 'evidence-reference-rebind-only') beforeAfter.sources = [JSON.parse(packetBytes).source]
    if (batch.approvalModel === S02_REVIEWED_SOURCE.id) await validateS02ReviewedSource(batch, packetBytes, beforeAfter, readBatchBytes, root, s02Prefix)
    if (batch.approvalModel === S03_REVIEWED_SOURCE.id) await validateS03ReviewedSource(batch, packetBytes, beforeAfter, readBatchBytes, root, s03Prefix)
    if (batch.approvalModel === FIVE_SOURCE_SUCCESSOR.batchId) await validateFiveSourceSuccessor(batch, packetBytes, beforeAfter, readBatchBytes, root,
      fiveSourcePrefix)
    if (batch.approvalModel === CHRONOLOGY_SUCCESSOR.batchId) await validateChronologySuccessor(batch, packetBytes, beforeAfter, readBatchBytes, root,
      chronologyPrefix, chronologyPrefixSha256, registry.batches.slice(0, 68))
    if (batch.approvalModel === APPOINTMENTS_SUCCESSOR.batchId) await validateAppointmentsSuccessor(batch, packetBytes, beforeAfter, readBatchBytes, root,
      appointmentsPrefix, registry.batches.slice(0, 69))
    if (batch.approvalModel === FOUR_DOCUMENTS_STATUS.batchId) await validateFourDocumentStatus(batch, packetBytes, beforeAfter, readBatchBytes, root,
      fourDocumentsPrefix)
    if (Object.hasOwn(POST62_SOURCE_APPLICATIONS, batch.approvalModel)) await validatePost62SourceApplication(batch, packetBytes, beforeAfter, readBatchBytes, root)
    if (batch.approvalModel === 'approved-rights-transition') batch.rightsTransition = await validateRightsTransition(batch, packetBytes, beforeAfter, readBatchBytes, root)
    if (batch.approvalModel === 'evidence-rebinding') await validateEvidenceRebinding(batch, packetBytes, beforeAfter, readBatchBytes, root,
      registry.batches.slice(registry.batches.indexOf(batch) + 1))
    if (Object.hasOwn(BOUNDED_REPAIRS, batch.approvalModel)) await validateBoundedRepair(batch, packetBytes, beforeAfter, readBatchBytes, root)
    if (Object.hasOwn(SOURCE_REPAIRS, batch.approvalModel)) await validateSourceRepair(batch, packetBytes, beforeAfter, readBatchBytes, root, registry.batches.slice(0, registry.batches.indexOf(batch)))
    batch.sourceBeforeAfter = beforeAfter
  }
  // Chained disk verification: later owner-approved applications may change
  // files that earlier batches recorded. Each changed source's CURRENT disk
  // must match the LAST applied batch's after-hash in registry order, with
  // chain continuity — each batch's before must equal the previous batch's
  // after for that source. Unchanged rows stay provenance-only.
  const profileIndex = registry.batches.findIndex(batch => batch.approvalModel === 'current-profile-fact-repair')
  if (profileIndex !== -1) check(registry.batches.findIndex(batch => batch.approvalModel === 'approved-translation-parity') > profileIndex,
    'E_MANIFEST_CHAIN', '/applied/profile-translation-order')
  const finalAfter = new Map(); const chainPrev = new Map()
  for (const batch of registry.batches) {
    for (const row of batch.sourceBeforeAfter.sources ?? []) {
      if (row.beforeSha256 === row.afterSha256) continue
      const creation = batch.approvalModel === 'wildlife-source-authoring' && row.sourcePath === 'lore/Research-Sources.md' && row.operation === 'create' && row.beforeSha256 === null
      check((creation || /^[a-f0-9]{64}$/.test(row.beforeSha256)) && /^[a-f0-9]{64}$/.test(row.afterSha256), 'E_SCOPE_SHAPE', '/applied/source', row.sourcePath)
      const prev = chainPrev.get(row.sourcePath)
      if (creation) check(prev === undefined && !registry.batches.slice(0, registry.batches.indexOf(batch)).some(b => b.sourceBeforeAfter.sources?.some(r => r.sourcePath === row.sourcePath)), 'E_MANIFEST_CHAIN', '/applied/create', row.sourcePath)
      check(prev === undefined || prev === row.beforeSha256, 'E_MANIFEST_CHAIN', '/applied/chain', row.sourcePath)
if (row.operation === 'replace-source') {
        check(batch.approvalModel === 'bibliography-json-authoring-transition' && prev === row.beforeSha256
          && !chainPrev.has(row.replacementPath), 'E_MANIFEST_CHAIN', '/applied/replace-source', row.sourcePath)
        chainPrev.delete(row.sourcePath); finalAfter.delete(row.sourcePath)
        chainPrev.set(row.replacementPath, row.afterSha256); finalAfter.set(row.replacementPath, batch.batchId)
      } else {
        chainPrev.set(row.sourcePath, row.afterSha256)
        finalAfter.set(row.sourcePath, batch.batchId)
      }
    }
  }
  let repin; let finalSuccessorReceipt
  for (const [sourcePath, ownerBatch] of finalAfter) {
    const current = await readFileImpl(resolve(root, sourcePath))
    const currentSha256 = sha256(current)
    if (currentSha256 === chainPrev.get(sourcePath)
      || readFileImpl.appliedDiskOverrides?.get(sourcePath) === currentSha256) continue
    const authority = appliedAuthorityReaders.get(readFileImpl) ?? readFileImpl
    repin ??= await authenticateRepinSuccessor(root, authority)
    finalSuccessorReceipt ??= await loadFinalSuccessor(root, readFileImpl)
    const successor = repin.transitions.find(row => row.path === sourcePath && row.afterSha256 === currentSha256)
    const finalSuccessor = finalSuccessorReceipt.transitions.find(row => row.path === sourcePath && row.afterSha256 === currentSha256)
    check(currentSha256 === chainPrev.get(sourcePath)
      || readFileImpl.appliedDiskOverrides?.get(sourcePath) === currentSha256
      || successor?.afterSha256 === currentSha256
      || finalSuccessor?.afterSha256 === currentSha256,
    'E_REVIEW_HASH', '/applied/disk', sourcePath + '@' + ownerBatch)
  }
  return registry.batches
}

export function validateCensusProducts(actual, expected, appliedBatches = []) {
  const appliedIndex = new Map()
    for (const batch of appliedBatches) for (const id of batch.personIds) if (!appliedIndex.has(id)) appliedIndex.set(id, batch)
  try {
    for (const name of ['ledger', 'review']) shape(actual[name], Object.keys(expected[name]), `/census/${name}`)
    const { ledger, review } = actual
    check(ledger.schema === expected.ledger.schema && review.schema === expected.review.schema, 'E_SCOPE_SHAPE', '/census/schema')
    for (const document of review.documents) if (sealed(document.sourcePath)) check(document.classification === 'sealed-history', 'E_SCOPE_ADMISSION', '/census/documents', document.sourcePath)
    for (const row of ledger.people) {
      const applied = appliedIndex.get(row.personId)
      if (applied) {
        check(row.status === 'applied' && row.batchId === applied.batchId, 'E_SCOPE_PENDING', '/census/people/status', row.personId)
        for (const approval of applied.approvals)
          check(row.approvals?.some(a => a.kind === approval.kind && a.bodySha256 === approval.bodySha256 && a.messageRef === approval.messageRef)
            || row.approval?.kind === approval.kind, 'E_APPROVAL_BATCH', '/census/people/approval', row.personId)
      } else {
        check(row.approval === null, row.approval?.kind && row.approval.kind !== 'batch-allocation' ? 'E_APPROVAL_KIND' : 'E_APPROVAL_BATCH', '/census/people/approval', row.personId)
        check(row.status === 'pending' && row.batchId === null && [row.proposedLocationRefs, row.proposedHoldingRefs, row.titleChanges, row.narrativeChanges, row.preservedFacts, row.changedFacts].every(v => Array.isArray(v) && v.length === 0), 'E_SCOPE_PENDING', '/census/people/status', row.personId)
      }
    }
    exact(ledger.people.map(p => p.personId), expected.ledger.people.map(p => p.personId), 'E_CENSUS_PERSON', '/census/people')
    exact(ledger.originalRights.map(r => JSON.stringify([r.set, r.id])), expected.ledger.originalRights.map(r => JSON.stringify([r.set, r.id])), 'E_CENSUS_RIGHT', '/census/originalRights')
    check(eq(ledger.originalRights, expected.ledger.originalRights), 'E_CENSUS_RIGHT', '/census/originalRights')
    exact(ledger.cardOccurrences.map(r => r.originalKey), expected.ledger.cardOccurrences.map(r => r.originalKey), 'E_REVIEW_COVERAGE', '/census/cards')
    check(eq(ledger.cardOccurrences, expected.ledger.cardOccurrences), 'E_REVIEW_HASH', '/census/cards')
    exact(review.documents.map(d => d.sourcePath), expected.review.documents.map(d => d.sourcePath), 'E_REVIEW_COVERAGE', '/census/documents')
    for (const doc of review.documents) {
      const wanted = expected.review.documents.find(d => d.sourcePath === doc.sourcePath)
      check(doc.currentSha256 === wanted.currentSha256, sealed(doc.sourcePath) ? 'E_ARCHIVE_HASH' : 'E_REVIEW_HASH', '/census/documents', doc.sourcePath)
      for (const kind of ['originalIndex', 'currentIndex']) {
        exact(doc[kind].map(r => r.category), wanted[kind].map(r => r.category), 'E_REVIEW_COVERAGE', `/census/${kind}`, doc.sourcePath)
        for (const index of doc[kind]) {
          const other = wanted[kind].find(r => r.category === index.category)
          check(index.count === other.count, 'E_REVIEW_COVERAGE', `/census/${kind}`, doc.sourcePath)
          check(index.sha256 === other.sha256, kind === 'currentIndex' ? 'E_REVIEW_HASH' : 'E_ARCHIVE_HASH', `/census/${kind}`, doc.sourcePath)
        }
      }
    }
    check(eq(ledger.binding, expected.ledger.binding) && eq(review.binding, expected.review.binding), 'E_ARCHIVE_HASH', '/census/binding')
    check(eq(ledger.connectedGroups, expected.ledger.connectedGroups) && eq(ledger.sharedSourceGroups, expected.ledger.sharedSourceGroups)
      && eq(actual.dependencies, expected.dependencies), 'E_REVIEW_COVERAGE', '/census/dependencies')
    check(eq(review.mapping, expected.review.mapping), 'E_REVIEW_COVERAGE', '/census/mapping')
    check(eq(ledger, expected.ledger) && eq(review, expected.review), 'E_REVIEW_COVERAGE', '/census/metadata')
    return { ok: true, errors: [] }
  } catch (error) {
    if (error instanceof TypeError) return { ok: false, errors: [{ code: 'E_SCOPE_SHAPE', path: '/census', id: '' }] }
    if (!error.code?.startsWith('E_')) throw error
    return { ok: false, errors: [{ code: error.code, path: error.path, id: error.id }] }
  }
}

export function validateIndependentReview(review, original, current, documents) {
  const owners = new Map(documents.map(d => [d.sourcePath, d.batchId]))
  const originalRows = new Map(); const currentRows = new Map()
  for (const rows of Object.values(original)) for (const raw of rows) { const r = rowOf(raw); originalRows.set(coverageKey(r), { key: coverageKey(r), batchId: owners.get(r.sourcePath) ?? null }) }
  for (const rows of Object.values(current)) for (const raw of rows) { const r = rowOf(raw); currentRows.set(coverageKey(r), { key: coverageKey(r), sha256: r.originalSha256, batchId: owners.get(r.sourcePath) ?? null }) }
  exact(review.originalKeys.map(r => r.key), [...originalRows.keys()], 'E_REVIEW_COVERAGE', '/review/independentOriginalKeys')
  exact(review.currentKeys.map(r => r.key), [...currentRows.keys()], 'E_REVIEW_COVERAGE', '/review/independentCurrentKeys')
  for (const row of review.originalKeys) {
    shape(row, ['key', 'batchId'], '/review/originalKeys')
    check(row.batchId === originalRows.get(row.key).batchId, 'E_APPROVAL_BATCH', '/review/originalKeys', row.key)
  }
  for (const row of review.currentKeys) {
    shape(row, ['key', 'sha256', 'batchId'], '/review/currentKeys')
    check(row.sha256 === currentRows.get(row.key).sha256, 'E_REVIEW_HASH', '/review/currentKeys', row.key)
    check(row.batchId === currentRows.get(row.key).batchId, 'E_APPROVAL_BATCH', '/review/currentKeys', row.key)
  }
}

// Per-document review evidence from authenticated artifacts only: the scope
// contract's exact review receipt gated by the closed-pin publication review row,
// the doc247 closure's control and exclusion amendments, the immutable baseline
// for sealed history, and the creation proof of a replacement source. Each entry
// names the current hash its authority bound. A pending document contributes no
// entry, so its keys stay uncovered instead of being reported as reviewed.
// Dispositions are mechanical: 'reviewed' and 'revised' carry an exact review
// receipt for unchanged or changed bytes; 'preserved' is a hash pin outside
// publication review. None of them is a semantic approval.
export function documentReviewReceipts({ documents, publicationReview, createdDocuments = [], baseline, evidence = {} }) {
  const rows = new Map(publicationReview.documents.map(row => [row.sourcePath, row]))
  const archived = new Map(baseline.files.map(file => [file.path, file]))
  const controls = new Map((evidence.closure?.controls ?? []).map(row => [row.sourcePath, row]))
  const exclusions = new Map((evidence.closure?.excluded ?? []).map(row => [row.sourcePath, row]))
  const receipts = []
  for (const document of documents) {
    const review = rows.get(document.sourcePath)
    const original = archived.get(document.sourcePath)
    const receipt = document.reviewReceipt
    if (document.status === 'active') {
      if (review?.eligible !== true || review.classification !== 'current-reviewed' || review.reason !== 'approved-exact-review'
        || review.receipt === null || receipt?.currentSha256 !== review.currentSha256) continue
      receipts.push({ sourcePath: document.sourcePath, currentSha256: receipt.currentSha256,
        disposition: original?.sha256 === receipt.currentSha256 ? 'reviewed' : 'revised',
        evidencePath: receipt.evidencePath, reviewedAt: receipt.reviewedAt })
    } else if (document.status === 'control') {
      const control = controls.get(document.sourcePath)
      if (!control || review?.classification !== 'integrity-control') continue
      receipts.push({ sourcePath: document.sourcePath, currentSha256: control.currentSha256, disposition: 'preserved',
        evidencePath: evidence.closure.evidencePath, reviewedAt: evidence.closure.reviewedAt })
    } else if (document.status === 'excluded') {
      const exclusion = exclusions.get(document.sourcePath)
      if (!exclusion || review?.classification !== 'excluded-document') continue
      receipts.push({ sourcePath: document.sourcePath, currentSha256: exclusion.currentSha256, disposition: 'preserved',
        evidencePath: exclusion.evidencePath, reviewedAt: evidence.closure.reviewedAt })
    } else if (document.status === 'preserved') {
      if (original?.kind !== 'sealed-history' || review?.classification !== 'sealed-history' || !evidence.baseline) continue
      receipts.push({ sourcePath: document.sourcePath, currentSha256: original.sha256, disposition: 'preserved',
        evidencePath: evidence.baseline.evidencePath, reviewedAt: evidence.baseline.reviewedAt })
    }
  }
  const scoped = new Set(documents.map(document => document.sourcePath))
  for (const created of createdDocuments) {
    const review = rows.get(created.sourcePath)
    if (scoped.has(created.sourcePath) || review?.eligible !== true || review.currentSha256 !== created.currentSha256) continue
    const proof = JSON.parse(created.reviewBody)
    if (typeof proof.createdDate !== 'string') continue
    receipts.push({ sourcePath: created.sourcePath, currentSha256: created.currentSha256, disposition: 'revised',
      evidencePath: created.evidencePath, reviewedAt: proof.createdDate })
  }
  return receipts
}

// Machine coverage review derived only from the immutable original extraction,
// the independent current extraction, the contract's document owners and the
// per-document receipts above. It carries no semantic authority: every extracted
// key is listed, but only a document with an authenticated receipt covers its
// keys, and a receipt whose hash drifted from the current bytes is rejected.
export function materializeIndependentReview({ original, current, documents, sources, receipts }) {
  const text = value => typeof value === 'string' && value.trim().length > 0
  const owners = new Map(documents.map(d => [d.sourcePath, d.batchId]))
  const index = (categories, withHash) => {
    const keys = new Map(); const byPath = new Map()
    for (const rows of Object.values(categories)) for (const raw of rows) {
      const r = rowOf(raw); const key = coverageKey(r)
      if (keys.has(key)) continue
      const row = withHash ? { key, sha256: r.originalSha256, batchId: owners.get(r.sourcePath) ?? null } : { key, batchId: owners.get(r.sourcePath) ?? null }
      keys.set(key, row)
      if (!byPath.has(r.sourcePath)) byPath.set(r.sourcePath, [])
      byPath.get(r.sourcePath).push(row)
    }
    return { keys, byPath }
  }
  const originalIndex = index(original, false); const currentIndex = index(current, true)
  const covered = new Set()
  const materialized = []
  for (const receipt of receipts) {
    shape(receipt, ['sourcePath', 'currentSha256', 'disposition', 'evidencePath', 'reviewedAt'], '/review/receipts')
    check(sources.has(receipt.sourcePath) && !covered.has(receipt.sourcePath), 'E_REVIEW_COVERAGE', '/review/receipts', receipt.sourcePath)
    check(receipt.currentSha256 === sources.get(receipt.sourcePath).sha256, 'E_REVIEW_HASH', '/review/receipts', receipt.sourcePath)
    check(['revised', 'reviewed', 'preserved'].includes(receipt.disposition) && text(receipt.evidencePath) && text(receipt.reviewedAt),
      'E_REVIEW_COVERAGE', '/review/receipts', receipt.sourcePath)
    covered.add(receipt.sourcePath)
    materialized.push({ coveredKeys: (originalIndex.byPath.get(receipt.sourcePath) ?? []).map(row => row.key),
      currentHashes: (currentIndex.byPath.get(receipt.sourcePath) ?? []).map(row => ({ key: row.key, sha256: row.sha256 })),
      disposition: receipt.disposition, batchId: owners.get(receipt.sourcePath) ?? null,
      evidencePath: receipt.evidencePath, reviewedAt: receipt.reviewedAt })
  }
  return { originalKeys: [...originalIndex.keys.values()], currentKeys: [...currentIndex.keys.values()], receipts: materialized }
}

/**
 * @typedef {Object} DocumentPublicationReview
 * @property {string} sourcePath
 * @property {string} currentSha256
 * @property {'sealed-history'|'archive-reviewed'|'integrity-control'|'excluded-document'|'current-pending'|'current-reviewed'} classification
 * @property {boolean} eligible
 * @property {'sealed-history'|'archive-only'|'non-publication-control'|'authenticated-publication-exclusion'|'missing-authenticated-review'|'pending-review'|'approved-exact-review'} reason
 * @property {{path: string, sha256: string, approvalRef: string}|null} receipt
 *
 * @typedef {Object} PublicationReview
 * @property {'seoul-document-publication-eligibility.v1'} schema
 * @property {'not-reviewed'|'reviewed'} semanticReview
 * @property {boolean} complete
 * @property {DocumentPublicationReview[]} documents
 */

// Pure validation boundary for synthetic fixtures. This function never confers
// production authentication; only the closed-pin loader below can do that.
/** @returns {PublicationReview} */
export function validateDocumentPublicationReview({ sources, original, current, documents, pins, evidence, superseded = new Map() }) {
  const path = '/publicationReview'
  const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
  const text = value => typeof value === 'string' && value.trim().length > 0
  const originalKeys = new Map(); const currentKeys = new Map()
  const originalLeafKeys = new Map(); const currentLeafKeys = new Map()
  for (const sourcePath of sources.keys()) { originalKeys.set(sourcePath, new Set()); currentKeys.set(sourcePath, new Map()) }
  for (const sourcePath of sources.keys()) { originalLeafKeys.set(sourcePath, new Set()); currentLeafKeys.set(sourcePath, new Map()) }
  for (const [categories, index] of [[original, originalKeys], [current, currentKeys]]) {
    for (const rows of Object.values(categories)) for (const raw of rows) {
      const row = rowOf(raw)
      check(index.has(row.sourcePath), 'E_REVIEW_COVERAGE', path, row.sourcePath)
      const keys = index.get(row.sourcePath)
      if (keys instanceof Map) keys.set(coverageKey(row), row.originalSha256)
      else keys.add(coverageKey(row))
      if (rows === categories.leaves) {
        if (categories === original) originalLeafKeys.get(row.sourcePath).add(coverageKey(row))
        else currentLeafKeys.get(row.sourcePath).set(coverageKey(row), row.originalSha256)
      }
    }
  }
  const scope = new Map(documents.map(row => [row.sourcePath, row]))
  check(scope.size === documents.length, 'E_REVIEW_COVERAGE', path)
  for (const row of documents) check(sources.has(row.sourcePath), 'E_REVIEW_COVERAGE', path, row.sourcePath)
  check(new Set(pins.map(row => row.path)).size === pins.length, 'E_PUBLICATION_REVIEW_AUTHORITY', path)
  exact(evidence.map(row => row.path), pins.map(row => row.path), 'E_PUBLICATION_REVIEW_AUTHORITY', path)
  const decisions = new Map()
  for (const pin of pins) {
    shape(pin, ['path', 'sha256'], path)
    check(text(pin.path) && digest(pin.sha256), 'E_PUBLICATION_REVIEW_AUTHORITY', path)
    const entry = evidence.find(row => row.path === pin.path)
    shape(entry, ['path', 'body'], path)
    check(typeof entry.body === 'string' && sha256(entry.body) === pin.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', pin.path)
    const receipt = JSON.parse(entry.body)
    const receiptFields = pin.path === POST108_EIGHT_DOCUMENT_SOURCE.directory + 'publication-review.json'
      ? ['schema', 'reviewer', 'approvalRef', 'reviewedAt', 'documents', 'gateDecision']
      : ['schema', 'reviewer', 'approvalRef', 'reviewedAt', 'documents']
    shape(receipt, receiptFields, pin.path)
    check(receipt.schema === 'seoul-document-publication-review.v1' && text(receipt.reviewer) && text(receipt.approvalRef)
      && typeof receipt.reviewedAt === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(receipt.reviewedAt)
      && Number.isFinite(Date.parse(receipt.reviewedAt)) && Array.isArray(receipt.documents), 'E_SCOPE_SHAPE', pin.path)
    for (const decision of receipt.documents) {
      shape(decision, ['sourcePath', 'currentSha256', 'classification', 'decision', 'originalKeys', 'currentKeys'], pin.path)
      const source = sources.get(decision.sourcePath)
      check(source && !decisions.has(decision.sourcePath), 'E_REVIEW_COVERAGE', pin.path, decision.sourcePath)
      const successor = superseded.get(decision.sourcePath)
      if (successor?.historicalSha256?.includes(decision.currentSha256)) {
        check(successor.historicalSha256.includes(decision.currentSha256)
          && source.sha256 === successor.afterRawSha256
          && decision.classification === 'current' && decision.decision === 'approved',
        'E_PUBLICATION_REVIEW_AUTHORITY', pin.path, decision.sourcePath)
        continue // The authenticated receipt remains historical, not a review of new bytes.
      }
      check(digest(decision.currentSha256) && decision.currentSha256 === source.sha256, 'E_REVIEW_HASH', pin.path, decision.sourcePath)
      check(['current', 'archive'].includes(decision.classification) && ['approved', 'pending'].includes(decision.decision)
        && Array.isArray(decision.originalKeys) && Array.isArray(decision.currentKeys), 'E_SCOPE_SHAPE', pin.path)
      const archived = sealed(decision.sourcePath) || scope.get(decision.sourcePath)?.status === 'preserved'
      check(decision.classification === (archived ? 'archive' : 'current'), 'E_SCOPE_ADMISSION', pin.path, decision.sourcePath)
      // Registry 71's pinned receipt enumerates string leaves. Its 76 kind
      // containers are bound separately by the raw, status-only successor
      // packet and prior independent full-body review, not by inventing
      // container rows in the immutable leaf receipt.
      const leafReceipt = pin.path === FOUR_DOCUMENTS_STATUS.directory + 'publication-review.json'
      const post108Receipt = pin.path === POST108_EIGHT_DOCUMENT_SOURCE.directory + 'publication-review.json'
      const originalExpected = post108Receipt ? new Set(decision.originalKeys)
        : leafReceipt ? originalLeafKeys.get(decision.sourcePath) : originalKeys.get(decision.sourcePath)
      const currentExpected = leafReceipt ? currentLeafKeys.get(decision.sourcePath) : currentKeys.get(decision.sourcePath)
      exact(decision.originalKeys, [...originalExpected], 'E_REVIEW_COVERAGE', pin.path)
      exact(decision.currentKeys.map(row => row.key), [...currentExpected.keys()], 'E_REVIEW_COVERAGE', pin.path)
      for (const row of decision.currentKeys) {
        shape(row, ['key', 'sha256'], pin.path)
        check(digest(row.sha256) && row.sha256 === currentExpected.get(row.key), 'E_REVIEW_HASH', pin.path, row.key)
      }
      if (!archived && decision.decision === 'approved') {
        const document = scope.get(decision.sourcePath)
        if (document?.status !== 'active') {
          check(successor && decision.currentSha256 === successor.afterRawSha256
            && document?.status === 'pending' && document.reviewReceipt === null,
          'E_SCOPE_PENDING', pin.path, decision.sourcePath)
        } else check(document.reviewReceipt?.currentSha256 === source.sha256, 'E_REVIEW_HASH', pin.path, decision.sourcePath)
      }
      decisions.set(decision.sourcePath, { ...decision, receipt: { ...pin, approvalRef: receipt.approvalRef } })
    }
  }
  const result = [...sources].map(([sourcePath, source]) => {
    check(digest(source.sha256), 'E_REVIEW_HASH', path, sourcePath)
    const decision = decisions.get(sourcePath)
    const history = sealed(sourcePath)
    const archived = scope.get(sourcePath)?.status === 'preserved'
    const control = repositoryControl(sourcePath)
    const excluded = scope.get(sourcePath)?.status === 'excluded'
    const eligible = !history && !archived && !control && !excluded && scope.get(sourcePath)?.status === 'active' && decision?.decision === 'approved'
    return { sourcePath, currentSha256: source.sha256,
      classification: control ? 'integrity-control' : excluded ? 'excluded-document' : history ? 'sealed-history' : archived && decision?.decision === 'approved' ? 'archive-reviewed' : eligible ? 'current-reviewed' : 'current-pending',
      eligible, reason: control ? 'non-publication-control' : excluded ? 'authenticated-publication-exclusion' : history ? 'sealed-history' : archived ? 'archive-only' : eligible ? 'approved-exact-review' : decision ? 'pending-review' : 'missing-authenticated-review',
      receipt: eligible ? decision.receipt : null }
  })
  const candidates = result.filter(row => !['sealed-history', 'archive-only', 'non-publication-control', 'authenticated-publication-exclusion'].includes(row.reason))
  const complete = candidates.length > 0 && candidates.every(row => row.eligible)
  return { schema: 'seoul-document-publication-eligibility.v1', semanticReview: complete ? 'reviewed' : 'not-reviewed', complete, documents: result }
}

async function loadDocumentPublicationReview(root, readBytes, sources, expected, documents, reconciliationDecisions, appliedBatches) {
  const evidence = []
  const linkRetargetPins = await loadLinkRetargetSuccessorBytes(root, readBytes)
  const rebindBytes = await readBytes(resolve(root, TWO_SOURCE_REBIND_PROOF.path))
  check(sha256(rebindBytes) === TWO_SOURCE_REBIND_PROOF.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', TWO_SOURCE_REBIND_PROOF.path)
  const rebind = JSON.parse(rebindBytes)
  check(rebind.schema === 'seoul-two-source-technical-review.v1' && rebind.decision === 'approved-exact-current-bodies-only'
    && rebind.documents.length === 2, 'E_PUBLICATION_REVIEW_AUTHORITY', TWO_SOURCE_REBIND_PROOF.path)
  for (const binding of [rebind.coverage, rebind.independentApplication, rebind.ownerAuthority, ...rebind.previousCombined,
    ...rebind.documents.map(row => row.previousReceipt)]) {
    check(sha256(await readBytes(resolve(root, binding.path))) === binding.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', binding.path)
  }
  const coverage = JSON.parse(await readBytes(resolve(root, rebind.coverage.path)))
  const independent = JSON.parse(await readBytes(resolve(root, rebind.independentApplication.path)))
  exact(rebind.documents.map(row => row.sourcePath), ['lore/factions/Sixteen-States.json', 'lore/culture/Oral-Stories.json'],
    'E_PUBLICATION_REVIEW_AUTHORITY', TWO_SOURCE_REBIND_PROOF.path)
  for (const row of rebind.documents) {
    const current = sources.get(row.sourcePath)
    const successor = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(row.sourcePath)
    const proposal = coverage.documents.find(document => document.sourcePath === row.sourcePath)
    const application = Object.values(independent.groups).flatMap(group => group.files ?? []).find(file => file.path === row.sourcePath)
    const previous = JSON.parse(await readBytes(resolve(root, row.previousReceipt.path))).documents.find(document => document.sourcePath === row.sourcePath)
    const post108 = POST108_EIGHT_DOCUMENT_SOURCE.sources[row.sourcePath]
    check(current?.sha256 && current.value.status === 'approved'
      && proposal?.oldReview.sha256 === row.previousReceipt.sha256 && previous?.currentSha256 === row.previousSourceSha256
      && proposal.oldReview.sourceSha256 === row.previousSourceSha256 && proposal.currentSourceSha256 === row.currentSourceSha256
      && eq(previous.originalKeys, proposal.oldReview.originalKeys) && eq(previous.currentKeys, proposal.oldReview.currentKeys)
      && proposal.currentKeys.length === row.currentKeyCount && previous.originalKeys.length === row.originalKeyCount
      && proposal.coverage.changedOrAdded === row.changedOrAdded && proposal.coverage.retained === row.retained
      && application?.fullSourceBodiesRead === true
      && eq(application.officialRenderHashes, Object.fromEntries(['ko', 'en'].map(locale => [locale, row.officialRenders[locale].sha256])))
      && (current.sha256 === row.currentSourceSha256
        ? application.afterSha256 === current.sha256
          && ['ko', 'en'].every(locale => sha256(renderLoreMarkdown(current.value, locale)) === row.officialRenders[locale].sha256)
        : successor && row.currentSourceSha256 === successor.beforeSha256
          && (current.sha256 === successor.afterSha256 || post108?.afterSha256 === current.sha256)
          && application.afterSha256 === successor.beforeSha256
          && ['ko', 'en'].every(locale => sha256(renderLoreMarkdown(JSON.parse(successor.before), locale)) === row.officialRenders[locale].sha256)),
    'E_PUBLICATION_REVIEW_AUTHORITY', TWO_SOURCE_REBIND_PROOF.path, row.sourcePath)
  }
  const proofBytes = await readBytes(resolve(root, SINGLE_DOCUMENT_REVIEW_PROOF.path))
  check(sha256(proofBytes) === SINGLE_DOCUMENT_REVIEW_PROOF.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', SINGLE_DOCUMENT_REVIEW_PROOF.path)
  const proof = JSON.parse(proofBytes)
  for (const binding of [...proof.evidence, proof.statusTransition, proof.previousCombined]) {
    check(sha256(await readBytes(resolve(root, binding.path))) === binding.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', binding.path)
  }
  const source = sources.get(proof.source.path)
  check(proof.source.rawSha256 === rebind.documents.find(row => row.sourcePath === proof.source.path)?.previousSourceSha256,
    'E_REVIEW_HASH', proof.source.path)
  const waterBytes = await readBytes(resolve(root, WATER_DOCUMENT_REVIEW_PROOF.path))
  check(sha256(waterBytes) === WATER_DOCUMENT_REVIEW_PROOF.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', WATER_DOCUMENT_REVIEW_PROOF.path)
  const water = JSON.parse(waterBytes)
  const stableThree = await loadStableThreeSourceProof(root, readBytes)
  const publication = await loadPublicationV4SourceProof(root, readBytes)
  for (const binding of water.evidence) {
    check(sha256(await readBytes(resolve(root, binding.path))) === binding.sha256, 'E_PUBLICATION_REVIEW_AUTHORITY', binding.path)
  }
  for (const binding of water.sources) {
    if (binding.sourcePath === 'lore/culture/Oral-Stories.json') {
      check(binding.afterSha256 === rebind.documents.find(row => row.sourcePath === binding.sourcePath)?.previousSourceSha256,
        'E_REVIEW_HASH', binding.sourcePath)
      continue
    }
    const source = sources.get(binding.sourcePath)
    const successor = stableThree.documents.find(row => row.path === binding.sourcePath)
    const publicationSuccessor = publication.documents.find(row => row.path === binding.sourcePath)
    const linkRetargetSuccessor = (await loadLinkRetargetSuccessorBytes(root, readBytes)).get(binding.sourcePath)
    const post108Successor = POST108_EIGHT_DOCUMENT_SOURCE.sources[binding.sourcePath]
    const chainedThroughLinkRetarget = !!linkRetargetSuccessor && !!source
      && (successor
        ? (publicationSuccessor
            ? publicationSuccessor.beforeSha256 === successor.afterRawSha256
              && linkRetargetSuccessor.beforeSha256 === publicationSuccessor.afterSha256
            : linkRetargetSuccessor.beforeSha256 === successor.afterRawSha256)
        : linkRetargetSuccessor.beforeSha256 === binding.afterSha256)
      && (source.sha256 === linkRetargetSuccessor.afterSha256 || post108Successor?.afterSha256 === source.sha256)
    const reviewedValue = successor && (source?.sha256 === successor.afterRawSha256
      || publicationSuccessor?.beforeSha256 === successor.afterRawSha256 && source?.sha256 === publicationSuccessor.afterSha256
      || chainedThroughLinkRetarget)
      ? JSON.parse(gunzipSync(Buffer.from(successor.fullRawBeforeGzipBase64, 'base64')))
      : (!successor && chainedThroughLinkRetarget ? JSON.parse(linkRetargetSuccessor.before) : source?.value)
    check((successor ? binding.afterSha256 === successor.sourceRawSha256
      && (source.sha256 === (publicationSuccessor?.afterSha256 ?? successor.afterRawSha256) || chainedThroughLinkRetarget
        || post108Successor?.afterSha256 === source.sha256)
      : source?.sha256 === binding.afterSha256 || chainedThroughLinkRetarget || post108Successor?.afterSha256 === source.sha256) && reviewedValue?.status === 'approved'
      && sha256(renderLoreMarkdown(reviewedValue, 'ko')) === binding.render.ko
      && sha256(renderLoreMarkdown(reviewedValue, 'en')) === binding.render.en, 'E_REVIEW_HASH', binding.sourcePath)
  }
  for (const [index, pin] of APPROVED_DOCUMENT_REVIEW_RECEIPTS.entries()) {
    const body = (await readBytes(resolve(root, pin.path))).toString()
    const receipt = JSON.parse(body)
    const fourDocuments = index === 2
    const stableThreeCurrent = index === 3
    const post108Current = index === 4
    check(sha256(body) === pin.sha256 && receipt.approvalRef === (post108Current ? '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/candidate-packet.json#sha256=' + POST108_EIGHT_DOCUMENT_SOURCE.candidateSha256 : fourDocuments ? FOUR_DOCUMENTS_STATUS.directory + 'application-packet.json'
      : stableThreeCurrent ? '.omo/private/seoul-migration/three-publication-findings-repair-20261015/independent-publication-v4.json' : TWO_SOURCE_REBIND_PROOF.path),
      'E_PUBLICATION_REVIEW_AUTHORITY', pin.path)
    const successorPaths = post108Current ? Object.keys(POST108_EIGHT_DOCUMENT_SOURCE.sources) : index === 0 ? ['lore/factions/Sixteen-States.json'] : fourDocuments ? FOUR_DOCUMENTS_STATUS.paths
      : stableThreeCurrent ? stableThree.documents.map(row => row.path) : water.sources.map(row => row.sourcePath)
    exact(receipt.documents.map(row => row.sourcePath), successorPaths, 'E_PUBLICATION_REVIEW_AUTHORITY', pin.path)
    for (const row of receipt.documents) {
      if (post108Current) {
        const source = sources.get(row.sourcePath)
        check(source?.sha256 === row.currentSha256 && row.currentSha256 === POST108_EIGHT_DOCUMENT_SOURCE.sources[row.sourcePath]?.afterSha256
          && row.classification === 'current' && row.decision === 'approved', 'E_PUBLICATION_REVIEW_AUTHORITY', pin.path, row.sourcePath)
        continue
      }
      if (stableThreeCurrent) {
        const source = sources.get(row.sourcePath)
        const independentPath = '.omo/private/seoul-migration/three-publication-findings-repair-20261015/independent-publication-v4.json'
        const independentBytes = await readBytes(resolve(root, independentPath))
        check(sha256(independentBytes) === 'd7f98539d34f6821448c25d8743ea1a86a70dee3dcf259735f232404ef8645d4',
          'E_PUBLICATION_REVIEW_AUTHORITY', independentPath)
        const review = JSON.parse(independentBytes)
        const independent = review.documents.find(document => document.sourcePath === row.sourcePath)
        for (const binding of [review.inputs.baseProposal, review.inputs.correction]) {
          check(sha256(await readBytes(resolve(root, binding.path))) === binding.sha256,
            'E_PUBLICATION_REVIEW_AUTHORITY', binding.path)
        }
        check(review.verdict === 'PASS_FOR_PUBLICATION_SEMANTICS_EXACT_COMPOSITE_THREE'
          && review.meaningAudit.remainingPublicationFindings.length === 0
          && source?.value.status === 'approved'
          && (row.currentSha256 === source.sha256
            ? (independent?.candidateRawSha256 ?? independent?.unchangedRawSha256) === source.sha256
              && ['ko', 'en'].every(locale => sha256(renderLoreMarkdown(source.value, locale)) === independent.officialRenderSha256[locale])
            : (() => {
              const linkRetarget = linkRetargetPins.get(row.sourcePath)
              const post108 = POST108_EIGHT_DOCUMENT_SOURCE.sources[row.sourcePath]
              return !!linkRetarget && row.currentSha256 === linkRetarget.beforeSha256
                && (source.sha256 === linkRetarget.afterSha256 || post108?.afterSha256 === source.sha256)
                && (independent?.candidateRawSha256 ?? independent?.unchangedRawSha256) === linkRetarget.beforeSha256
                && ['ko', 'en'].every(locale => sha256(renderLoreMarkdown(JSON.parse(linkRetarget.before), locale)) === independent.officialRenderSha256[locale])
            })()),
        'E_PUBLICATION_REVIEW_AUTHORITY', pin.path, row.sourcePath)
        continue
      }
      if (fourDocuments) {
        const source = sources.get(row.sourcePath)
        const batch = JSON.parse(await readBytes(resolve(root, FOUR_DOCUMENTS_STATUS.directory + 'application-packet.json')))
        const tidy = linkRetargetPins.get(row.sourcePath)
        const post108 = POST108_EIGHT_DOCUMENT_SOURCE.sources[row.sourcePath]
        check(source?.value.status === 'approved'
          && ((source.sha256 === row.currentSha256
            && batch.sources.some(item => item.sourcePath === row.sourcePath && item.afterSha256 === source.sha256))
            || (tidy && row.currentSha256 === tidy.beforeSha256 && source.sha256 === tidy.afterSha256
              && batch.sources.some(item => item.sourcePath === row.sourcePath && item.afterSha256 === tidy.beforeSha256))
            || (post108 && source.sha256 === post108.afterSha256
              && (row.currentSha256 === post108.beforeSha256
                || batch.sources.some(item => item.sourcePath === row.sourcePath && item.afterSha256 === row.currentSha256)))),
        'E_PUBLICATION_REVIEW_AUTHORITY', pin.path, row.sourcePath)
        continue
      }
      const proposal = coverage.documents.find(document => document.sourcePath === row.sourcePath)
      if (proposal) check(row.currentSha256 === proposal.currentSourceSha256
        && eq(row.originalKeys, proposal.oldReview.originalKeys) && eq(row.currentKeys, proposal.currentKeys),
      'E_PUBLICATION_REVIEW_AUTHORITY', pin.path, row.sourcePath)
      else {
        const old = JSON.parse(await readBytes(resolve(root, '.omo/private/seoul-migration/water-five-publication-review-v1-20261015.json')))
          .documents.find(document => document.sourcePath === row.sourcePath)
        check(eq(row, old), 'E_PUBLICATION_REVIEW_AUTHORITY', pin.path, row.sourcePath)
      }
    }
    evidence.push({ path: pin.path, body })
  }
  const result = validateDocumentPublicationReview({ sources, original: expected.original, current: expected.current,
    documents, pins: APPROVED_DOCUMENT_REVIEW_RECEIPTS, evidence,
    superseded: (() => {
      const map = new Map()
      for (const [path, source] of Object.entries(POST108_EIGHT_DOCUMENT_SOURCE.sources)) {
        const historicalSha256 = new Set()
        for (const batch of appliedBatches) for (const row of batch.sourceBeforeAfter.sources ?? []) {
          if (row.sourcePath !== path || row.beforeSha256 === row.afterSha256) continue
          historicalSha256.add(row.beforeSha256); if (row.afterSha256 !== source.afterSha256) historicalSha256.add(row.afterSha256)
        }
        map.set(path, { historicalSha256: [...historicalSha256], afterRawSha256: source.afterSha256 })
      }
      return map
    })() })
  const closure = await authenticateClosureReceipt(root, readBytes)
  for (const document of [...closure.narrativeReview.documents, ...closure.technicalReview.documents]) {
    const row = result.documents.find(item => item.sourcePath === document.sourcePath)
    const scope = documents.find(item => item.sourcePath === document.sourcePath)
    check(row && scope?.status === 'active' && scope.batchId === DOC247_BATCH_ID
      && scope.reviewReceipt?.currentSha256 === document.currentSha256
      && scope.reviewReceipt.evidencePath === DOC247_RECEIPT_PATH
      && row.currentSha256 === document.currentSha256,
    'E_REVIEW_HASH', DOC247_RECEIPT_PATH, document.sourcePath)
    Object.assign(row, { classification: 'current-reviewed', eligible: true, reason: 'approved-exact-review',
      receipt: { path: DOC247_RECEIPT_PATH, sha256: DOC247_RECEIPT_SHA256, approvalRef: DOC247_RECEIPT_PATH } })
  }
  for (const document of closure.excludedDocumentAmendment.documents) {
    const row = result.documents.find(item => item.sourcePath === document.sourcePath)
    const scope = documents.find(item => item.sourcePath === document.sourcePath)
    check(row && scope?.status === 'excluded' && scope.batchId === 'doc247-excluded-documents-20261019'
      && scope.reviewReceipt === null && row.currentSha256 === document.currentSha256,
    'E_REVIEW_HASH', document.evidencePath, document.sourcePath)
    Object.assign(row, { classification: 'excluded-document', eligible: false,
      reason: 'authenticated-publication-exclusion', receipt: null })
  }
  for (const decision of reconciliationDecisions) {
    const row = result.documents.find(document => document.sourcePath === decision.sourcePath)
    check(row && row.currentSha256 === decision.currentSha256, 'E_REVIEW_HASH', '/publicationReview/task10', decision.sourcePath)
    Object.assign(row, { classification: 'current-reviewed', eligible: true, reason: 'approved-exact-review', receipt: decision.receipt })
  }
  const receiptWave = await authenticateReceiptWave(root, { contract: { documents }, readBytes })
  for (const document of receiptWave.receiptBundle.documents) {
    const row = result.documents.find(item => item.sourcePath === document.path)
    const scope = documents.find(item => item.sourcePath === document.path)
    check(row && scope?.status === 'active' && scope.batchId === DOC247_RECEIPT_WAVE_BATCH_ID
      && scope.reviewReceipt?.currentSha256 === document.currentSha256
      && scope.reviewReceipt.evidencePath === DOC247_RECEIPT_WAVE_PATH
      && row.currentSha256 === document.currentSha256,
    'E_REVIEW_HASH', DOC247_RECEIPT_WAVE_PATH, document.path)
    Object.assign(row, { classification: 'current-reviewed', eligible: true, reason: 'approved-exact-review',
      receipt: { path: DOC247_RECEIPT_WAVE_PATH, sha256: receiptWave.receiptSha256, approvalRef: DOC247_RECEIPT_WAVE_PATH } })
  }
  const finalClosure = await authenticateFinalClosure(root, { contract: { documents }, readBytes })
  const finalReviewedPaths = new Set(finalClosure.receipts.documents.map(row => row.path))
  for (const document of receiptWave.coverage.rows.filter(row => row.disposition === 'kept-pending' && !finalReviewedPaths.has(row.path))) {
    const row = result.documents.find(item => item.sourcePath === document.path)
    const scope = documents.find(item => item.sourcePath === document.path)
    check(row && scope?.status === 'pending' && scope.reviewReceipt === null
      && row.currentSha256 === document.currentSha256 && !row.eligible,
    'E_SCOPE_ADMISSION', '/publicationReview/doc247ReceiptWave', document.path)
  }
  for (const document of finalClosure.receipts.documents) {
    const row = result.documents.find(item => item.sourcePath === document.path)
    const scope = documents.find(item => item.sourcePath === document.path)
    check(row && scope?.status === 'active' && scope.batchId === DOC247_FINAL_BATCH_ID
      && scope.reviewReceipt?.currentSha256 === document.currentSha256
      && scope.reviewReceipt.evidencePath === DOC247_FINAL_RECEIPTS_PATH
      && row.currentSha256 === document.currentSha256,
    'E_REVIEW_HASH', DOC247_FINAL_RECEIPTS_PATH, document.path)
    Object.assign(row, { classification: 'current-reviewed', eligible: true, reason: 'approved-exact-review',
      receipt: { path: DOC247_FINAL_RECEIPTS_PATH, sha256: sha256(finalClosure.receiptsBytes), approvalRef: DOC247_FINAL_RECEIPTS_PATH } })
  }
  // Final five exact receipts are validated by the same full-key validator against this
  // loader's own extraction. Research-Sources.json is a created replacement with no baseline
  // scope row: it is admitted for this validation only through the applied bibliography
  // transition and is never added to the immutable baseline or the canonical contract.
  const finalFive = await authenticateFinalFive(root, { readBytes })
  const createdSpec = FINAL_FIVE_SOURCES.find(spec => spec.originalCount === 0)
  const replacement = appliedBatches.find(batch => batch.approvalModel === 'bibliography-json-authoring-transition'
    && batch.sourceBeforeAfter.sources.some(row => row.operation === 'replace-source'
      && row.replacementPath === createdSpec.sourcePath && row.afterSha256 === createdSpec.currentSha256))
  check(FINAL_FIVE_SOURCES.filter(spec => spec.originalCount === 0).length === 1 && replacement
    && !documents.some(row => row.sourcePath === createdSpec.sourcePath), 'E_PUBLICATION_REVIEW_AUTHORITY', FINAL_FIVE_DIRECTORY, createdSpec.sourcePath)
  const localDocuments = [...documents, { sourcePath: createdSpec.sourcePath, status: 'active', batchId: replacement.batchId,
    reviewReceipt: { currentSha256: createdSpec.currentSha256, evidencePath: createdSpec.receiptPath, reviewedAt: FINAL_FIVE_REVIEWED_AT },
    basis: 'publication-validation-only row for the authenticated created replacement source' }]
  const five = validateDocumentPublicationReview({ sources, original: expected.original, current: expected.current, documents: localDocuments,
    pins: finalFive.coverage.documents.map(row => row.receipt), evidence: finalFive.receipts })
  for (const spec of FINAL_FIVE_SOURCES) {
    const reviewed = five.documents.find(item => item.sourcePath === spec.sourcePath)
    const row = result.documents.find(item => item.sourcePath === spec.sourcePath)
    const scope = localDocuments.find(item => item.sourcePath === spec.sourcePath)
    check(reviewed?.eligible === true && reviewed.reason === 'approved-exact-review' && reviewed.receipt.path === spec.receiptPath
      && row && !row.eligible && row.currentSha256 === spec.currentSha256 && sources.get(spec.sourcePath)?.sha256 === spec.currentSha256
      && scope?.status === 'active' && scope.reviewReceipt?.currentSha256 === spec.currentSha256,
    'E_REVIEW_HASH', spec.receiptPath, spec.sourcePath)
    Object.assign(row, { classification: 'current-reviewed', eligible: true, reason: 'approved-exact-review', receipt: reviewed.receipt })
  }
  const candidates = result.documents.filter(row => !['sealed-history', 'archive-only', 'non-publication-control', 'authenticated-publication-exclusion'].includes(row.reason))
  result.complete = candidates.length > 0 && candidates.every(row => row.eligible)
  result.semanticReview = result.complete ? 'reviewed' : 'not-reviewed'
  for (const row of result.documents) { if (row.receipt) Object.freeze(row.receipt); Object.freeze(row) }
  Object.freeze(result.documents); Object.freeze(result)
  authenticatedPublicationReviews.add(result)
  return result
}

export function validateDependencyClosure(contract, batches, dependencies, { mode = 'inspection', batchId = null } = {}) {
  const documents = new Map(contract.documents.map(d => [d.sourcePath, d]))
  const people = new Map(contract.entities.filter(e => e.kind === 'person').map(e => [e.id, e]))
  const batchIndex = new Map(batches.map(b => [b.id, b]))
  const selected = new Set(batchId ? [batchId] : [])
  for (const id of selected) for (const dependency of batchIndex.get(id)?.dependencyBatchIds ?? []) selected.add(dependency)
  // A file becomes a publication dependency only when an already admitted
  // active document reader-cites it (renderer vocabulary). Edges that live
  // entirely inside private staged machinery never gate publication.
  const readerCitedByActive = new Set()
  for (const ref of dependencies.references ?? []) {
    const sourceDocument = documents.get(ref.source.sourcePath)
    if (ref.vocabulary !== 'renderer' || sourceDocument?.status !== 'active'
      || sourceDocument.basis === 'authenticated full-card review and applied exact-source successor chain') continue
    const target = ref.resolution?.targets?.[0]?.sourcePath ?? (ref.raw ?? '').split('#')[0]
    if (target) readerCitedByActive.add(target.replace(/\.md$/, '.json'))
  }
  for (const ref of dependencies.unresolved ?? []) {
    const document = documents.get(ref.sourcePath)
    const claimed = document?.status === 'active' || batches.some(b => b.approval && b.documentPaths?.includes(ref.sourcePath))
    check(!(ref.required && (mode === 'publication' || claimed || selected.has(document?.batchId))),
      'E_DEPENDENCY_UNRESOLVED', ref.sourcePath, ref.jsonPointer)
  }
  if (mode === 'inspection') return
  for (const entity of people.values()) {
    if (entity.status !== 'active') continue
    const closure = new Set([entity.batchId])
    for (const id of closure) {
      check(batchIndex.has(id), 'E_APPROVAL_BATCH', '/census/dependencyBatchIds', id)
      for (const dependency of batchIndex.get(id).dependencyBatchIds) closure.add(dependency)
    }
    const group = dependencies.sharedSourceGroups.find(g => g.personIds.includes(entity.id))
    check(group, 'E_REVIEW_COVERAGE', '/census/dependencyGroup', entity.id)
    for (const id of group.personIds) {
      check(people.get(id)?.status === 'active', 'E_SCOPE_PENDING', '/census/dependencyPerson', id)
      check(closure.has(people.get(id).batchId), 'E_APPROVAL_BATCH', '/census/dependencyPerson', id)
    }
    for (const node of group.nodes.filter(n => n.startsWith('file:'))) {
      const path = node.slice(5)
      if (!path.startsWith('lore/') && !path.startsWith('docs/') && path.endsWith('.md')) continue
      if (path.startsWith('docs/editorial/')) continue
      if (path === 'lore/Operating-Houses.json' || path === 'lore/Synthetic-Actors.json' || path === 'lore/Regional-Physical-AI-Arcs.json' || path === 'lore/World-Relation-Ledger.json' || path === 'lore/World-Expansion-Index.json' || path.startsWith('lore/bestiary/')) continue
      if (path === 'lore/README.md') continue
      if (path === 'lore/Research-Sources.json') continue
      if (path === 'lore/World-Narrative-Atlas.json') continue
      // Private staged census machinery is never a reader-facing dependency
      // document: name pools, editorial batches, allocation relations, region
      // geometry inputs, office schemas and person profile sources. Documents
      // already admitted active keep the full admission checks below.
      if ((path.startsWith('lore/name-pools/') || path.startsWith('lore/editorial/') || path.startsWith('lore/relations/')
        || path.startsWith('lore/regions/') || path.startsWith('lore/offices/') || path.startsWith('lore/characters/')
        || path.startsWith('scripts/')) && documents.get(path)?.status !== 'active') continue
      if (!readerCitedByActive.has(path)) continue
      const document = documents.get(path)
      if (document?.status === 'pending') continue
      check(document?.status === 'active', 'E_SCOPE_PENDING', '/census/dependencySource', path)
      check(closure.has(document.batchId), 'E_APPROVAL_BATCH', '/census/dependencySource', path)
    }
  }
}

// Keep the historical Task 2 binding immutable. A successor must authenticate the
// original archive, exact proposal and owner receipt, then replay every after byte.
export async function loadTask2Geography(root, readBytes = readFile) {
  const geoBytes = await readBytes(resolve(root, TASK2_BINDING.geography.path))
  const geography = JSON.parse(geoBytes)
  let successorBinding = {}
  if (sha256(geoBytes) !== TASK2_BINDING.geography.sha256) {
    const binding = KINGDOM_SUCCESSOR_BINDING
    check(geography.successor, 'E_REVIEW_HASH', TASK2_BINDING.geography.path)
    const beforeBytes = gunzipSync(Buffer.from((await readBytes(resolve(root, binding.beforeArchivePath))).toString().trim(), 'base64'))
    check(sha256(beforeBytes) === TASK2_BINDING.geography.sha256, 'E_ARCHIVE_HASH', binding.beforeArchivePath)
    const proposalBytes = await readBytes(resolve(root, binding.proposal.path))
    const approvalBytes = await readBytes(resolve(root, binding.approval.path))
    check(sha256(proposalBytes) === binding.proposal.sha256 && sha256(approvalBytes) === binding.approval.sha256,
      'E_APPROVAL_BATCH', '/geography/successor/approval')
    const proposal = JSON.parse(proposalBytes); const approval = JSON.parse(approvalBytes)
    check(approval.approvals.some(row => row.batchId === binding.batchId)
      && sha256(approval.ownerMessage.text) === approval.ownerMessage.sha256,
    'E_APPROVAL_BATCH', binding.approval.path)
    check(sha256(await readBytes(resolve(root, approval.evidenceFile.path))) === approval.evidenceFile.sha256,
      'E_APPROVAL_BATCH', approval.evidenceFile.path)
    const partition = proposal.kingdoms.map(k => ({ titleId: k.kingdomId.replace(/^proposal:/, 'geography:'),
      proposalId: k.kingdomId, name: k.proposedName, jurisdictionRefs: k.guRefs, countyTitleIds: k.countyTitleIds }))
    check(eq(geography.successor.partition, partition), 'E_KINGDOM_PARTITION', '/geography/successor/partition')
    const expected = approvedKingdomGeography(JSON.parse(beforeBytes), geography.successor)
    check(sha256(JSON.stringify(expected, null, 2) + '\n') === sha256(geoBytes), 'E_REVIEW_HASH', TASK2_BINDING.geography.path)
    const applicationPath = ".omo/private/seoul-migration/kingdom-partition-6/application-receipt.json"
    const applicationSha256 = "28c7e9c7ddb399bc2a4c79a79331b71de97ee46c9936756cb40db170e203fa69"
    check(sha256(await readBytes(resolve(root, applicationPath))) === applicationSha256, 'E_REVIEW_HASH', applicationPath)
    const independentPath = ".omo/evidence/seoul-lock/kingdom-partition-independent-20261015.md"
    const independentSha256 = "cbf558187f71598346b1f2a82030f1af0b64c8f910dd176ed9af9ca7442afdcb"
    check(sha256(await readBytes(resolve(root, independentPath))) === independentSha256, 'E_REVIEW_HASH', independentPath)
    successorBinding = { successor: { ...binding, geography: { path: TASK2_BINDING.geography.path, sha256: sha256(geoBytes) },
      application: { path: applicationPath, sha256: applicationSha256 },
      independentReview: { path: independentPath, sha256: independentSha256, scope: 'approved-local-geographic-hierarchy-only' } } }
  }
  const geometry = geography.spatialSource.geometry
  check(sha256(await readBytes(resolve(root, geometry.path))) === geometry.sha256, 'E_SCOPE_GEOMETRY', geometry.path)
  return { geography, binding: { ...TASK2_BINDING, spatial: geography.spatialSource, sourceFacts: geography.evidence, ...successorBinding } }
}

export async function loadAndValidateCensus({ root, baseline, baselineSha256, contract, batches, review: machineReview, reviewEvidence = {}, mode = 'publication', batchId = null, readBytes = readFile, syncProducts = null, nationalDress = null }) {
  nationalDress ??= await authenticateNationalDressAdmission(root, baseline, readBytes)
  const { climateLinkPredecessorReader } = await import('./climate-link-successor.mjs')
  readBytes = await climateLinkPredecessorReader(root, readBytes)
  const { timelineWharfPredecessorReader } = await import('./timeline-wharf-successor.mjs')
  readBytes = await timelineWharfPredecessorReader(root, readBytes)
  readBytes = await validatorPredecessorReader(root, readBytes)
  const currentAuthority = appliedAuthorityReaders.get(readBytes) ?? readBytes
  const { stationCatalogPredecessorReader } = await import('./station-catalog-scope-successor.mjs')
  readBytes = await stationCatalogPredecessorReader(root, readBytes)
  const { reviewWordingPredecessorReader } = await import('./review-wording-successor.mjs')
  readBytes = await reviewWordingPredecessorReader(root, readBytes)
  const { k176PredecessorReader } = await import('./k176-label-successor.mjs')
  readBytes = await k176PredecessorReader(root, readBytes)
  appliedAuthorityReaders.set(readBytes, currentAuthority)
  const load = async path => JSON.parse(await readBytes(resolve(root, path)))
  const repin = await authenticateRepinSuccessor(root, readBytes)
  const appliedReader = Object.assign(async requested => readBytes(requested), {
    appliedDiskOverrides: new Map(repin.transitions.map(row => [row.path, row.afterSha256])),
    currentAuthorityReader: readBytes,
  })
  const appliedBatches = await loadAppliedBatches(appliedReader, root)
  const ledger = await load(CENSUS_PATHS[0]); const review = await load(CENSUS_PATHS[1])
  const immutable = await loadImmutableCensus(baseline, readBytes, baselineSha256)
  const sources = await extractCensusSources(baseline, path => readBytes(resolve(root, path)), appliedBatches)
  // Raw comparison geography stays outside the authored-document denominator.
  const provenanceSources = new Map()
  const comparisonPath = 'data/geography/seoul-20260830/boundaries-kostat-2013/seoul_municipalities_geo.json'
  const comparisonBytes = Buffer.from(await readBytes(resolve(root, comparisonPath)))
  provenanceSources.set(comparisonPath, { bytes: comparisonBytes, sha256: sha256(comparisonBytes), value: JSON.parse(comparisonBytes) })
  for (const [path, binding] of Object.entries(SUPPORTING_LOCAL_CONTRACTS)) {
    const bytes = Buffer.from(await readBytes(resolve(root, path)))
    check(sha256(bytes) === binding.sha256, 'E_REVIEW_HASH', path)
    const value = JSON.parse(bytes)
    check(value.schema === binding.schema, 'E_REVIEW_HASH', path)
    provenanceSources.set(path, { bytes, sha256: binding.sha256, value })
  }
  const { binding } = await loadTask2Geography(root, readBytes)
  let artifact = review.dependencyInventory
  shape(artifact, ['path', 'sha256', 'payloadSha256', 'encoding'], '/census/dependencyInventory')
  check(artifact.path.startsWith('.omo/private/seoul-migration/task-7-census/') && !artifact.path.split('/').includes('..') && artifact.encoding === 'base64-gzip-json', 'E_SCOPE_SHAPE', '/census/dependencyInventory')
  const encoded = await readBytes(resolve(root, artifact.path))
  check(sha256(encoded) === artifact.sha256, 'E_ARCHIVE_HASH', artifact.path)
  const payload = gunzipSync(Buffer.from(encoded.toString().replace(/\s/g, ''), 'base64'))
  check(sha256(payload) === artifact.payloadSha256, 'E_ARCHIVE_HASH', '/census/dependencyInventory/payload')
  let dependencies = JSON.parse(payload)
  const triage = await loadDependencyTriage(root, readBytes)
  const provenanceBindingSources = new Map(sources)
  const officeRetrofit = appliedBatches.find(batch => batch.approvalModel === 'office-rank-retrofit-734')
  if (officeRetrofit) {
    const archived = JSON.parse(await readBytes(resolve(root,
      '.omo/private/seoul-migration/office-retrofit-candidate-20261017/source-before.json')))
    for (const source of officeRetrofit.sourceBeforeAfter.sources) {
      const entry = archived.files.find(row => row.path === source.sourcePath)
      check(entry && entry.rawSha256 === source.beforeSha256 && entry.bytes === source.beforeBytes,
        'E_APPROVAL_BATCH', '/applied/office-rank-retrofit/provenance-preimage', source.sourcePath)
      const bytes = gunzipSync(Buffer.from(entry.gzipBase64, 'base64'))
      provenanceBindingSources.set(source.sourcePath, { bytes, sha256: source.beforeSha256, value: JSON.parse(bytes) })
    }
  }
  let requiredProvenance = await loadRequiredProvenance(root, provenanceBindingSources, readBytes)
  const post108Batch = appliedBatches.find(batch => batch.approvalModel === POST108_EIGHT_DOCUMENT_SOURCE.id)
  if (post108Batch) {
    for (const source of post108Batch.sourceBeforeAfter.sources.filter(row => row.changed)) {
      const bytes = await readBytes(resolve(root,
        '.omo/private/seoul-migration/post108-eight-document-repair-v2-20261018/before/' + source.sourcePath))
      check(sha256(bytes) === source.beforeSha256, 'E_REVIEW_HASH', '/activation/source-before', source.sourcePath)
      provenanceBindingSources.set(source.sourcePath, { bytes, sha256: source.beforeSha256, value: JSON.parse(bytes) })
    }
    requiredProvenance = await loadRequiredProvenance(root, provenanceBindingSources, readBytes)
  }
  if (officeRetrofit) {
    requiredProvenance = new Map([...requiredProvenance].map(([key, disposition]) => {
      const [sourcePath, jsonPointer, target] = JSON.parse(key)
      if (!officeRetrofit.sourceBeforeAfter.sources.some(source => source.sourcePath === sourcePath)) return [key, disposition]
      const before = pointer(provenanceBindingSources.get(sourcePath)?.value, jsonPointer)
      const after = pointer(sources.get(sourcePath)?.value, jsonPointer)
      check(before !== undefined && after !== undefined, 'E_DEPENDENCY_REFERENCE', sourcePath, jsonPointer)
      if (eq(before, after)) return [referenceKey({ sourcePath, jsonPointer, target, recordSha256: sha256(JSON.stringify(after)) }), disposition]
      return [key, disposition]
    }))
  }
  const expected = buildCensusProducts({ baseline, immutable, sources, task2Binding: binding, triage, provenanceSources, appliedBatches, requiredProvenance })
  const reconciled = await materializePersonReviewReconciliation({ root, contract, ledger: expected.ledger, review: expected.review, readBytes, appliedBatches })
  expected.ledger = reconciled.ledger
  expected.review = reconciled.review
  const rightsTransition = appliedBatches.find(batch => batch.approvalModel === 'approved-rights-transition')?.rightsTransition?.proof
  const sourceHashes = Object.fromEntries([...sources].map(([path, source]) => [path, source.sha256]))
  rightsTransitionTargets(baseline, rightsTransition, sourceHashes)
  const createdDocuments = []
  for (const batch of appliedBatches) for (const source of batch.sourceBeforeAfter.sources.filter(row => row.operation === 'create')) {
    const replacement = appliedBatches.find(row => row.approvalModel === 'bibliography-json-authoring-transition'
      && row.sourceBeforeAfter.sources.some(target => target.sourcePath === source.sourcePath && target.operation === 'replace-source'))
    const target = replacement?.sourceBeforeAfter.sources.find(row => row.sourcePath === source.sourcePath)
    const receipt = (replacement ?? batch).applicationReview
    createdDocuments.push({ sourcePath: target?.replacementPath ?? source.sourcePath, currentSha256: target?.afterSha256 ?? source.afterSha256, batchId: (replacement ?? batch).batchId,
      evidencePath: receipt.evidencePath, evidenceSha256: receipt.evidenceSha256, reviewBody: (await readBytes(resolve(root, receipt.evidencePath))).toString() })
  }
  expected.review.dependencyInventory = artifact
  if (syncProducts) {
    // The dependency artifact is regenerated from the same verified extraction;
    // the previous artifact remains on disk as immutable history.
    const payload = Buffer.from(JSON.stringify(expected.dependencies))
    const encoded = gzipSync(payload).toString('base64') + '\n'
    artifact = { path: '.omo/private/seoul-migration/task-7-census/dependencies-post96-20261016.json.txt', sha256: sha256(Buffer.from(encoded)), payloadSha256: sha256(payload), encoding: 'base64-gzip-json' }
    await syncProducts([{ path: artifact.path, raw: encoded }])
    expected.review.dependencyInventory = artifact
    await syncProducts(CENSUS_PATHS.slice(0, 2).map(path => ({ path, value: path === CENSUS_PATHS[0] ? expected.ledger : expected.review })))
    dependencies = expected.dependencies
  }
  const result = validateCensusProducts({ ledger: syncProducts ? expected.ledger : ledger, review: syncProducts ? expected.review : review, dependencies: syncProducts ? expected.dependencies : dependencies }, expected, appliedBatches)
  if (!result.ok) return result
  // Authenticate the predecessor products first. The successor is replayed from
  // exact source bytes, never written into the old census or its receipts.
  let admitted = await extractCensusSources(baseline, path => readBytes(resolve(root, path)), appliedBatches, [nationalDress])
  let successor = buildCensusProducts({ baseline, immutable, sources: admitted, task2Binding: binding, triage, provenanceSources, appliedBatches, requiredProvenance, nationalDress })
  let effectiveContract = { ...contract, documents: [...contract.documents, nationalDress.row] }
  const effective = await materializePersonReviewReconciliation({ root, contract: effectiveContract, ledger: successor.ledger, review: successor.review, readBytes, appliedBatches })
  successor.ledger = effective.ledger
  successor.review = effective.review
  const dependencyOverlay = Object.fromEntries(Object.keys(dependencies).map(key => {
    const before = dependencies[key]; const after = successor.dependencies[key]
    if (!Array.isArray(before)) return [key, { beforeSha256: sha256(JSON.stringify(before)), value: after }]
    const beforeRows = new Set(before.map(row => JSON.stringify(row)))
    const afterRows = new Set(after.map(row => JSON.stringify(row)))
    return [key, { beforeSha256: sha256(JSON.stringify(before)), removed: before.filter(row => !afterRows.has(JSON.stringify(row))), added: after.filter(row => !beforeRows.has(JSON.stringify(row))) }]
  }))
  const overlay = { schema: 'national-dress-census-overlay.v1', sourcePath: NATIONAL_DRESS_PATH,
    document: successor.review.documents.find(row => row.sourcePath === NATIONAL_DRESS_PATH),
    mapping: successor.review.mapping.exceptions.filter(row => row.currentKeys.some(key => JSON.parse(key)[0] === NATIONAL_DRESS_PATH)),
    ownership: successor.ledger.sourceFileOwnership.find(row => row.sourcePath === NATIONAL_DRESS_PATH), dependencyOverlay }
  const successorArtifactPath = NATIONAL_DRESS_DIRECTORY + 'dependencies.json'
  const dependencyBytes = await readBytes(resolve(root, successorArtifactPath))
  check(sha256(dependencyBytes) === nationalDress.manifest.dependencies.sha256
    && nationalDress.manifest.dependencies.path === successorArtifactPath
    && nationalDress.manifest.dependencies.encoding === 'utf8-json'
    && sha256(JSON.stringify(JSON.parse(dependencyBytes))) === nationalDress.manifest.dependencies.payloadSha256
    && eq(JSON.parse(dependencyBytes), overlay), 'E_REVIEW_HASH', successorArtifactPath)
  dependencies = successor.dependencies
  artifact = nationalDress.manifest.dependencies
  // Validate the unchanged national-dress overlay above before layering this
  // closed operational-doc registration. Neither predecessor is rewritten.
  const mainDocs = await authenticateMainDocAdmission(root, baseline, readBytes)
  admitted = await extractCensusSources(baseline, path => readBytes(resolve(root, path)), appliedBatches, [nationalDress, ...mainDocs])
  successor = buildCensusProducts({ baseline, immutable, sources: admitted, task2Binding: binding, triage, provenanceSources, appliedBatches, requiredProvenance, nationalDress, mainDocs })
  effectiveContract = { ...contract, documents: [...contract.documents, nationalDress.row, ...mainDocs.map(admission => admission.row)] }
  const mainEffective = await materializePersonReviewReconciliation({ root, contract: effectiveContract, ledger: successor.ledger, review: successor.review, readBytes, appliedBatches })
  successor.ledger = mainEffective.ledger
  successor.review = mainEffective.review
  dependencies = successor.dependencies
  successor.review.dependencyInventory = nationalDress.manifest.dependencies
  validateDependencyClosure(effectiveContract, batches, dependencies, { mode, batchId })
  const publicationReview = await loadDocumentPublicationReview(root, readBytes, admitted, successor, effectiveContract.documents, reconciled.publicationDecisions, appliedBatches)
  // A staged review is validated as supplied. Without one, the machine coverage
  // review is derived from this same extraction and the authenticated receipts;
  // either way it must match the independent denominator exactly.
  const independentReview = machineReview ?? materializeIndependentReview({ original: successor.original, current: successor.current, documents: effectiveContract.documents, sources: admitted,
    receipts: [...documentReviewReceipts({ documents: contract.documents, publicationReview, createdDocuments, baseline, evidence: reviewEvidence }), nationalDressPreservationReceipt(nationalDress), ...mainDocs.map(mainDocPreservationReceipt)] })
  validateIndependentReview(independentReview, successor.original, successor.current, effectiveContract.documents)
  return { ...result, review: independentReview, rightsTransition, createdDocuments, successorDocuments: [nationalDress.row, ...mainDocs.map(admission => admission.row)], dependencies, publicationReview, dependencyReport: { originalDispositions: dependencies.dispositions.length,
    profileCitationDispositions: dependencies.profileCitationDispositions.length,
    localProvenanceDispositions: dependencies.localProvenanceDispositions.length,
    references: dependencies.references.length, unresolved: dependencies.unresolved.length,
    byVocabulary: Object.fromEntries([...new Set(dependencies.unresolved.map(r => r.vocabulary))]
      .map(kind => [kind, dependencies.unresolved.filter(r => r.vocabulary === kind).length])),
    artifact, semanticReview: 'not-reviewed' } }
}
