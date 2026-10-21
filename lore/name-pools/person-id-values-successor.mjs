import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readSourceArchive } from "../../scripts/cast-sqlite/source-archive.mjs";
import { gunzipSync } from "node:zlib";

const SOURCE = "lore/name-pools/values-cast.json";
const PREDECESSOR = "1bc77ccc7d261ee2dade3c1433d26ea5ae1054c5f7fa9e1f6a0f34e9348d929a";
const SUCCESSOR = "19a30e156065f6c2f59b3d2ea7b0226e887ea60d610b70d10e588937407620e2";
const BATCH = "owner-recommendations-records";
const PACKET = ".omo/private/seoul-migration/post62-registration-20261015/" + BATCH + "/application-packet.json";
const PACKET_SHA = "e4cd6884d35a75e600ed5187651fcff8d0eb7b8ee05528e24b24037f42b82b18";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readEvidence = (relative) => readSourceArchive(relative);

// Preserve the issuance preimage only for the exact authenticated, note-only successor.
// The reader is injectable so evidence mutations never touch the live private registry.
export function personIdValuesHash(valuesBytes, readBytes = readEvidence) {
  const actual = sha256(valuesBytes);
  if (actual !== SUCCESSOR) return actual;
  const packetBytes = readBytes(PACKET);
  assert.equal(sha256(packetBytes), PACKET_SHA, "values-cast successor packet hash");
  const packet = JSON.parse(packetBytes);
  const proofs = {};
  for (const key of ["ownerAuthority", "approvalPacket", "independentReview", "registrar", "applicationReceipt"]) {
    const ref = packet[key];
    const bytes = readBytes(ref.path);
    assert.equal(sha256(bytes), ref.sha256, `values-cast successor ${key} hash`);
    if (key !== "ownerAuthority") proofs[key] = JSON.parse(bytes);
  }
  const batches = JSON.parse(readBytes(".omo/private/seoul-migration/applied-batches.json")).batches;
  const matches = batches.filter((row) => row.batchId === BATCH);
  assert.equal(matches.length, 1, "values-cast successor registration count");
  const batch = matches[0];
  assert.equal(batch.state, "applied");
  assert.equal(batch.approvalModel, BATCH);
  assert.equal(batch.packetPath, PACKET);
  assert.equal(batch.packetSha256, PACKET_SHA);
  assert.equal(batch.operationCount, packet.operationCount);
  assert.deepEqual(batch.personIds, []);
  assert.deepEqual(batch.applicationReview, {
    evidencePath: packet.independentReview.path, evidenceSha256: packet.independentReview.sha256,
  });
  assert.deepEqual(batch.approvals, [{ kind: BATCH, bodySha256: packet.ownerAuthority.sha256,
    messageRef: packet.ownerAuthority.path, authorizationSha256: packet.approvalPacket.sha256 }]);
  const registrar = proofs.registrar;
  assert.equal(registrar.approvalPacketSha256, packet.approvalPacket.sha256);
  const sources = registrar.sources.filter((row) => row.path === SOURCE);
  const operations = registrar.operations.filter((row) => row.sourcePath === SOURCE);
  assert.equal(sources.length, 1);
  assert.equal(operations.length, 1);
  const source = sources[0]; const operation = operations[0];
  assert.equal(source.beforeSha256, PREDECESSOR);
  assert.equal(source.afterSha256, actual);
  assert.equal(operation.pointer, "/note");
  const before = gunzipSync(Buffer.from(source.beforeRawGzipBase64, "base64"));
  const after = gunzipSync(Buffer.from(source.afterRawGzipBase64, "base64"));
  assert.equal(sha256(before), PREDECESSOR);
  assert.equal(before.length, source.beforeBytes);
  assert.equal(after.length, source.afterBytes);
  assert.ok(after.equals(Buffer.from(valuesBytes)), "values-cast successor exact bytes");
  const original = JSON.parse(before); const revised = JSON.parse(after);
  assert.equal(original.note, operation.before);
  assert.equal(revised.note, operation.after);
  assert.equal(sha256(JSON.stringify(operation.before)), operation.beforeValueSha256);
  assert.equal(sha256(JSON.stringify(operation.after)), operation.afterValueSha256);
  original.note = operation.after;
  assert.deepEqual(original, revised, "values-cast successor changes only /note");
  const review = proofs.independentReview.groups.records;
  assert.equal(review.verdict, "verified");
  const reviewed = review.files.filter((row) => row.path === SOURCE);
  assert.equal(reviewed.length, 1);
  assert.equal(reviewed[0].beforeSha256, PREDECESSOR);
  assert.equal(reviewed[0].afterSha256, actual);
  assert.ok(review.operations.some((row) => row.id === operation.id && row.pointer === operation.pointer
    && row.beforeValueSha256 === operation.beforeValueSha256 && row.afterValueSha256 === operation.afterValueSha256));
  const receipt = proofs.applicationReceipt;
  const operationRef = receipt.evidenceArtifacts.find((row) => row.path.endsWith("/records/operations.json"));
  const operationBytes = readBytes(packet.applicationReceipt.path.replace(/receipt\.json$/, "operations.json"));
  assert.equal(sha256(operationBytes), operationRef.sha256);
  const selected = JSON.parse(operationBytes).records.filter((row) => row.sourcePath === SOURCE);
  assert.equal(selected.length, 1);
  for (const key of ["id", "pointer", "before", "after", "beforeValueSha256", "afterValueSha256"])
    assert.equal(selected[0][key], operation[key]);
  const manifest = JSON.parse(readBytes(batch.sourceBeforeAfterPath));
  const registered = manifest.sources.filter((row) => row.sourcePath === SOURCE);
  assert.equal(registered.length, 1);
  assert.equal(registered[0].beforeSha256, PREDECESSOR);
  assert.equal(registered[0].afterSha256, actual);
  return PREDECESSOR;
}
