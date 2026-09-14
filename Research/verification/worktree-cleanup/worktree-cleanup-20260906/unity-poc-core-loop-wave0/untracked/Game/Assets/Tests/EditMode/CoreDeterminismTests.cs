using System.Collections.Generic;
using Janseon.Core;
using NUnit.Framework;

namespace Janseon.Tests.EditMode
{
    [TestFixture]
    public class CoreDeterminismTests
    {
        [Test]
        public void SameSeedAndCommandsProduceSameStateAndLedgerHashes()
        {
            var seed = 42;
            var cmd = new TypedCommand
            {
                Id = new CommandId("cmd-seed42"),
                Value = 100,
                At = new Tick(0)
            };
            var initial = new WorldState
            {
                Tick = new Tick(0),
                RngSeed = seed,
                Rng = new PurposeRng(seed)
            };

            var (state1, ledger1) = CoreApi.Replay(initial, cmd);
            var hash1 = CoreApi.ComputeStateHash(state1) + CoreApi.ComputeLedgerHash(ledger1);

            var (state2, ledger2) = CoreApi.Replay(initial, cmd);
            var hash2 = CoreApi.ComputeStateHash(state2) + CoreApi.ComputeLedgerHash(ledger2);

            Assert.AreEqual(hash1, hash2, "Same seed + commands must produce identical state and ledger hashes");
        }

        [Test]
        public void PurposeStreamsDoNotPerturbEachOther()
        {
            var seed = 42;
            var rng = new PurposeRng(seed);
            var worldSample1 = rng.Peek(RngPurpose.World);
            rng.Consume(RngPurpose.Battle);
            var worldSample2 = rng.Peek(RngPurpose.World);

            Assert.AreEqual(worldSample1, worldSample2, "Purpose streams (battle vs world) must not perturb shared RNG state");
        }

        [Test]
        public void DuplicateRequestReturnsStoredReceipt()
        {
            var reqId = new RequestId("req-123");
            var payload = new TypedPayload { Value = 777 };
            var index = new RequestIndex();
            var receipt1 = index.Issue(reqId, payload);
            var stored = index.PeekPayload(reqId).Value;
            var receipt2 = index.Issue(reqId, payload);

            Assert.AreEqual(receipt1, receipt2, "Duplicate request must return the stored receipt without mutation");
            Assert.AreEqual(stored, index.PeekPayload(reqId).Value);
        }

        [Test]
        public void ConflictingPayloadIsRejectedWithoutMutation()
        {
            var reqId = new RequestId("req-conflict");
            var payloadA = new TypedPayload { Value = 1 };
            var payloadB = new TypedPayload { Value = 2 };
            var index = new RequestIndex();
            var first = index.Issue(reqId, payloadA);
            var stored = index.PeekPayload(reqId).Value;
            var second = index.Issue(reqId, payloadB);

            Assert.IsInstanceOf<Receipt>(first);
            Assert.IsInstanceOf<TypedConflict>(second, "Conflicting payload must be rejected with typed error; state must remain unmutated");
            Assert.AreEqual(stored, index.PeekPayload(reqId).Value);
            Assert.AreEqual(payloadA.Value, index.PeekPayload(reqId).Value);
        }

        [Test]
        public void CanonicalSerializationIgnoresInsertionOrder()
        {
            var dict1 = new Dictionary<string, int> { ["a"] = 1, ["b"] = 2 };
            var dict2 = new Dictionary<string, int> { ["b"] = 2, ["a"] = 1 };
            var ser1 = CoreApi.CanonicalSerialize(dict1);
            var ser2 = CoreApi.CanonicalSerialize(dict2);

            Assert.AreEqual(ser1, ser2, "Canonical serialization must ignore dict insertion order for stable ledger/state hashes");
        }
    }
}
