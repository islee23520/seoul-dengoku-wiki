using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Janseon.Core;
using NUnit.Framework;
using UnityEngine;

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

        /// <summary>
        /// Real consumer surface under EditMode: two multi-command runs must share final
        /// state/ledger hashes, and purpose streams must stay isolated. Emits artifact for QA.
        /// </summary>
        [Test]
        public void ConsumerSurface_TwoRunsSameSeedSameFinalLedgerHash_AndPurposeStreamsIsolated()
        {
            const int seed = 42;
            string Run()
            {
                var state = new WorldState
                {
                    Tick = new Tick(0),
                    RngSeed = seed,
                    Rng = new PurposeRng(seed),
                    Accumulator = 0
                };
                var ledgerMerged = new Ledger();
                var commands = new[]
                {
                    new TypedCommand { Id = new CommandId("cmd-manual-qa"), Value = 100, At = new Tick(0) },
                    new TypedCommand { Id = new CommandId("cmd-manual-qa-2"), Value = 7, At = new Tick(1) }
                };
                for (var i = 0; i < commands.Length; i++)
                {
                    var (next, piece) = CoreApi.Replay(state, commands[i]);
                    for (var e = 0; e < piece.Events.Count; e++)
                    {
                        ledgerMerged.Events.Add(piece.Events[e]);
                    }

                    state = next;
                }

                ledgerMerged.Stamp = "merged";
                return CoreApi.ComputeStateHash(state) + ":" + CoreApi.ComputeLedgerHash(ledgerMerged);
            }

            var runA = Run();
            var runB = Run();
            Assert.AreEqual(runA, runB, "Consumer surface: same seed + typed commands must yield identical final hash");

            var rng = new PurposeRng(seed);
            var worldBefore = rng.Peek(RngPurpose.World);
            var battle1 = rng.Consume(RngPurpose.Battle);
            var battle2 = rng.Consume(RngPurpose.Battle);
            var worldAfter = rng.Peek(RngPurpose.World);
            Assert.AreEqual(worldBefore, worldAfter, "World stream must be unchanged after battle consumes");
            rng.Consume(RngPurpose.World);
            var battleAfterWorld = rng.Peek(RngPurpose.Battle);

            var control = new PurposeRng(seed);
            control.Consume(RngPurpose.Battle);
            control.Consume(RngPurpose.Battle);
            var battleControl = control.Peek(RngPurpose.Battle);
            Assert.AreEqual(battleControl, battleAfterWorld, "Battle stream must be unchanged after world consume");

            var parts = runA.Split(':');
            Assert.AreEqual(2, parts.Length);
            var stateHash = parts[0];
            var ledgerHash = parts[1];

            TestContext.WriteLine("CORE_QA_STATE_HASH=" + stateHash);
            TestContext.WriteLine("CORE_QA_LEDGER_HASH=" + ledgerHash);
            TestContext.WriteLine("CORE_QA_FINAL_COMBINED=" + runA);
            TestContext.WriteLine("CORE_QA_WORLD_BEFORE=" + worldBefore);
            TestContext.WriteLine("CORE_QA_BATTLE1=" + battle1);
            TestContext.WriteLine("CORE_QA_BATTLE2=" + battle2);
            TestContext.WriteLine("CORE_QA_WORLD_AFTER_BATTLE=" + worldAfter);
            TestContext.WriteLine("CORE_QA_BATTLE_AFTER_WORLD=" + battleAfterWorld);

            var repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            var outDir = Path.Combine(repoRoot, ".omo", "evidence", "unity-poc-core-loop", "task-5-core", "manual-qa");
            Directory.CreateDirectory(outDir);
            var outPath = Path.Combine(outDir, "manual-qa-result.txt");
            var sb = new StringBuilder();
            sb.AppendLine("task-5-core manual QA consumer");
            sb.AppendLine("surface=EditMode CoreDeterminismTests.ConsumerSurface_TwoRunsSameSeedSameFinalLedgerHash_AndPurposeStreamsIsolated");
            sb.AppendLine("seed=" + seed);
            sb.AppendLine("runA.finalCombined=" + runA);
            sb.AppendLine("runB.finalCombined=" + runB);
            sb.AppendLine("stateHash=" + stateHash);
            sb.AppendLine("ledgerHash=" + ledgerHash);
            sb.AppendLine("sameSeedSameCommandsSameFinalHash=" + string.Equals(runA, runB, StringComparison.Ordinal));
            sb.AppendLine("worldPeekBeforeBattleConsume=" + worldBefore);
            sb.AppendLine("battleConsume1=" + battle1);
            sb.AppendLine("battleConsume2=" + battle2);
            sb.AppendLine("worldPeekAfterBattleConsume=" + worldAfter);
            sb.AppendLine("worldStreamsIsolated=" + (worldBefore == worldAfter));
            sb.AppendLine("battlePeekAfterWorldConsume=" + battleAfterWorld);
            sb.AppendLine("battlePeekControlWithoutWorld=" + battleControl);
            sb.AppendLine("battleUnaffectedByWorld=" + (battleAfterWorld == battleControl));
            sb.AppendLine("MANUAL_QA_PASS=True");
            File.WriteAllText(outPath, sb.ToString(), Encoding.UTF8);
            TestContext.WriteLine("CORE_QA_ARTIFACT=" + outPath);
        }
    }
}
