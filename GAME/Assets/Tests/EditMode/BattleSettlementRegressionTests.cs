using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Tests.EditMode.Fixtures;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Non-card battle settlement regression properties, migrated from the deleted
    /// RealtimeCardSettlementTests onto the current continuous (seconds/millimeter)
    /// battle contracts: exact-once result application, result/battle id conflict
    /// recovery, and deterministic battle replay feeding a stable settlement receipt.
    /// No card, grid, or 30 Hz tick surface is referenced anywhere in this fixture.
    /// </summary>
    [TestFixture]
    public sealed class BattleSettlementRegressionTests
    {
        const double FixedDeltaSeconds = 0.25;
        const double MaximumBattleSeconds = 0.5;
        const int StepBound = 64;

        sealed class CampaignFixture
        {
            public CampaignState State;
            public Ledger Ledger = new Ledger();
            public RouteGraph Graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            public BattleContext Context;

            public string Hash()
            {
                return CampaignApi.ComputeCampaignHash(State, Ledger);
            }
        }

        static CampaignCommand Command(string id, CampaignCommandKind kind, StationId destination = default(StationId))
        {
            return new CampaignCommand { Id = new CommandId(id), Kind = kind, TravelDestination = destination };
        }

        static CampaignState MustApply(CampaignFixture fixture, CampaignCommand command, string step)
        {
            var applied = CampaignApi.Apply(fixture.Graph, fixture.State, fixture.Ledger, command);
            Assert.IsInstanceOf<CampaignState>(applied, step);
            fixture.State = (CampaignState)applied;
            return fixture.State;
        }

        /// <summary>Campaign advanced to Resolution with a pending battle attached (no card surface involved).</summary>
        static CampaignFixture CampaignWithPendingBattle(string campaignId)
        {
            var fixture = new CampaignFixture();
            fixture.State = CampaignApi.Start(271828, StationId.Yeongdeungpo, campaignId, TestCampaignDefinition.Instance.BattleRulesVersion, TestCampaignDefinition.Instance.PersistentPartyUnitId, TestCampaignDefinition.Instance.PersistentPartyMaxHp);
            MustApply(fixture, Command("depart", CampaignCommandKind.Depart), "Depart");
            MustApply(fixture, Command("travel", CampaignCommandKind.Travel, StationId.Sindorim), "Travel");
            MustApply(fixture, Command("face", CampaignCommandKind.FaceEncounter), "FaceEncounter");
            MustApply(fixture, Command("resolution", CampaignCommandKind.EnterResolution), "EnterResolution");
            var handoff = CampaignApi.Apply(fixture.Graph, fixture.State, fixture.Ledger, Command("combat", CampaignCommandKind.ChooseCombat));
            Assert.IsInstanceOf<BattleRequired>(handoff, "ChooseCombat must yield the immutable battle handoff");
            var context = ((BattleRequired)handoff).Context;
            MustApplyAttached(fixture, context);
            return fixture;
        }

        static void MustApplyAttached(CampaignFixture fixture, BattleContext context)
        {
            var attached = CampaignApi.AttachPendingBattle(fixture.State, fixture.Ledger, context, new CommandId("attach"));
            Assert.IsInstanceOf<CampaignState>(attached, "AttachPendingBattle");
            fixture.State = (CampaignState)attached;
            fixture.Context = context;
        }

        /// <summary>Authored continuous battle setup: three-node nav path, one warrior per side, idle draw at duration.</summary>
        static BattleSetup SetupFor(BattleContext context)
        {
            var nodes = new[]
            {
                new NavNode("n0", new BattlePositionMm(0, 0, 0)),
                new NavNode("n1", new BattlePositionMm(6000, 0, 0)),
                new NavNode("n2", new BattlePositionMm(12000, 0, 0)),
            };
            var segments = new[] { new NavSegment("n0", "n1"), new NavSegment("n1", "n2") };
            var navigation = new NavPath(nodes, segments);

            var player = new RosterUnit
            {
                Id = new UnitId("ally-1"),
                 VisualKindId = "test.visual.soldier",
                SoldierId = new SoldierId("warrior-a"),
                SquadId = new SquadId("squad-1"),
                Side = 0,
                Hp = 10,
                MaxHp = 10,
                Power = 1,
                RangeMinMm = 0,
                RangeMaxMm = 100,
                MoveMillimetersPerSecond = 1000,
                AttackCooldownSeconds = 1d,
                RadiusMm = 500,
                InitialStatus = BattleUnitStatus.Active,
            };
            var enemy = new RosterUnit
            {
                Id = new UnitId("foe-1"),
                 VisualKindId = "test.visual.hero",
                SoldierId = new SoldierId("warrior-b"),
                SquadId = new SquadId("squad-2"),
                Side = 1,
                Hp = 10,
                MaxHp = 10,
                Power = 1,
                RangeMinMm = 0,
                RangeMaxMm = 100,
                MoveMillimetersPerSecond = 1000,
                AttackCooldownSeconds = 1d,
                RadiusMm = 500,
                InitialStatus = BattleUnitStatus.Active,
            };

            return new BattleSetup
            {
                Context = context,
                Definition = new BattleDefinition(
                    100, 100, 0, 10, 0, 0, 0, 0, MaximumBattleSeconds, 1000d),
                PlayerUnits = new[] { player },
                EnemyUnits = new[] { enemy },
                PlayerFormation = new[]
                {
                    new FormationSlot { Unit = player.Id, Position = nodes[0].Position, Facing = new BattleFacing(90000) },
                },
                EnemyFormation = new[]
                {
                    new FormationSlot { Unit = enemy.Id, Position = nodes[2].Position, Facing = new BattleFacing(270000) },
                },
                PlayerCommanderId = player.Id,
                EnemyCommanderId = enemy.Id,
                Navigation = navigation,
                EnemyObjectivePosition = nodes[1].Position,
            };
        }

        static BattleSimState RunToTerminal(BattleSetup setup, Ledger battleLedger)
        {
            var state = BattleSim.Open(setup);
            var formation = new FormationSlot[setup.PlayerFormation.Length + setup.EnemyFormation.Length];
            setup.PlayerFormation.CopyTo(formation, 0);
            setup.EnemyFormation.CopyTo(formation, setup.PlayerFormation.Length);
            var deploy = new BattleTickCommand
            {
                Id = new CommandId("deploy"),
                Seq = 0,
                AtSeconds = 0d,
                Kind = BattleTickCommandKind.Deploy,
                Formation = formation,
            };
            Assert.IsNull(BattleSim.Submit(state, battleLedger, deploy), "deploy must be accepted");
            var steps = 0;
            while (state.Outcome == BattleOutcomeKind.Ongoing && steps < StepBound)
            {
                BattleSim.Step(state, battleLedger, FixedDeltaSeconds);
                steps++;
            }
            Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome, "fixture battle must reach a terminal outcome");
            return state;
        }

        /// <summary>Build the settlement payload from a terminal battle state (ResultHash is content-derived).</summary>
        static BattleResult ResultOf(BattleSimState state)
        {
            Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome, "result payload requires a terminal state");
            return new BattleResult
            {
                Outcome = state.Outcome,
                FinalElapsedSeconds = state.ElapsedSeconds,
                BattleId = state.Context.BattleId,
                ResultHash = CoreApi.StableHashHex(state.Fingerprint()),
                UnitHp = TestCampaignDefinition.Instance.MaxHp,
            };
        }

        [Test]
        public void TerminalBattle_SettlesExactlyOnce_DuplicateReturnsSameReceiptWithoutMutation()
        {
            var fixture = CampaignWithPendingBattle("exact-once-campaign");
            var battleLedger = new Ledger();
            var battle = RunToTerminal(SetupFor(fixture.Context), battleLedger);
            var result = SettlementApi.FromBattleResult(ResultOf(battle));
            Assert.AreEqual(fixture.Context.BattleId, result.BattleId.Value, "result must carry the handoff battle id");

            var book = new SettlementBook();
            var beforeHash = fixture.Hash();
            var beforeEvents = fixture.Ledger.Events.Count;

            var first = SettlementApi.Apply(fixture.State, fixture.Ledger, book, result);
            Assert.IsInstanceOf<SettlementSuccess>(first, "first apply must settle");
            var success = (SettlementSuccess)first;
            Assert.IsTrue(success.State.SettlementApplied);
            Assert.IsNull(success.State.PendingBattle);
            Assert.AreEqual(CampaignStage.Settlement, success.State.Stage);
            Assert.AreEqual(result.ResultId.Value, success.State.SettledResultId);
            Assert.AreEqual(
                result.UnitHp.Fingerprint(), success.State.PartyHp.Fingerprint(),
                "campaign must adopt the leftover party hp payload exactly once");
            fixture.State = success.State;
            Assert.AreNotEqual(beforeHash, fixture.Hash(), "first settlement must mutate the campaign");
            Assert.Greater(fixture.Ledger.Events.Count, beforeEvents);

            var settledHash = fixture.Hash();
            var settledEvents = fixture.Ledger.Events.Count;
            var duplicate = SettlementApi.Apply(success.State, fixture.Ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate, "duplicate apply must return the stored receipt");
            Assert.AreEqual(success.Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
            Assert.AreEqual(settledHash, fixture.Hash(), "duplicate settlement must not mutate campaign state");
            Assert.AreEqual(settledEvents, fixture.Ledger.Events.Count, "duplicate settlement must not append events");

            SettlementReceipt stored;
            string storedPayloadHash;
            Assert.IsTrue(book.TryGetByResultId(result.ResultId, out stored, out storedPayloadHash));
            ResultId battleResultId;
            Assert.IsTrue(book.TryGetResultIdForBattle(result.BattleId, out battleResultId));
            Assert.AreEqual(result.ResultId, battleResultId);
        }

        [Test]
        public void SettledState_CompletesReturnRoundTrip_ToBaseReady()
        {
            var fixture = CampaignWithPendingBattle("roundtrip-campaign");
            var battle = RunToTerminal(SetupFor(fixture.Context), new Ledger());
            var result = SettlementApi.FromBattleResult(ResultOf(battle));
            var first = SettlementApi.Apply(fixture.State, fixture.Ledger, new SettlementBook(), result);
            Assert.IsInstanceOf<SettlementSuccess>(first);
            fixture.State = ((SettlementSuccess)first).State;

            var returned = MustApply(fixture, Command("roundtrip-return", CampaignCommandKind.CompleteReturn), "CompleteReturn");
            Assert.AreEqual(CampaignStage.BaseReady, returned.Stage);
            Assert.AreEqual(returned.HomeBase, returned.Node);
        }

        [Test]
        public void SameResultIdDifferentPayload_IsConflictWithoutMutation()
        {
            var fixture = CampaignWithPendingBattle("conflict-resultid-campaign");
            var battle = RunToTerminal(SetupFor(fixture.Context), new Ledger());
            var result = SettlementApi.FromBattleResult(ResultOf(battle));
            var book = new SettlementBook();
            var first = SettlementApi.Apply(fixture.State, fixture.Ledger, book, result);
            Assert.IsInstanceOf<SettlementSuccess>(first);
            var success = (SettlementSuccess)first;
            fixture.State = success.State;

            var forged = new EncounterResult
            {
                ResultId = result.ResultId,
                BattleId = result.BattleId,
                Outcome = result.Outcome,
                ResultHash = "forged-" + result.ResultHash,
                UnitHp = TestCampaignDefinition.Instance.MaxHp,
            };

            var settledHash = fixture.Hash();
            var settledEvents = fixture.Ledger.Events.Count;
            var settledStage = success.State.Stage;

            var conflicted = SettlementApi.Apply(success.State, fixture.Ledger, book, forged);
            Assert.IsInstanceOf<SettlementConflict>(conflicted, "same result id with a different payload must conflict");
            var conflict = (SettlementConflict)conflicted;
            Assert.AreEqual(result.ResultId, conflict.ResultId);
            Assert.AreNotEqual(conflict.StoredPayloadHash, conflict.IncomingPayloadHash);
            Assert.AreEqual(settledHash, fixture.Hash(), "conflict must not mutate campaign state");
            Assert.AreEqual(settledEvents, fixture.Ledger.Events.Count, "conflict must not append events");
            Assert.AreEqual(settledStage, success.State.Stage);
        }

        [Test]
        public void SameBattleDifferentResultId_IsConflictWithoutMutation()
        {
            var fixture = CampaignWithPendingBattle("conflict-battleid-campaign");
            var battle = RunToTerminal(SetupFor(fixture.Context), new Ledger());
            var result = SettlementApi.FromBattleResult(ResultOf(battle));
            var book = new SettlementBook();
            var first = SettlementApi.Apply(fixture.State, fixture.Ledger, book, result);
            Assert.IsInstanceOf<SettlementSuccess>(first);
            var success = (SettlementSuccess)first;
            fixture.State = success.State;

            var reid = new EncounterResult
            {
                ResultId = new ResultId("result-forged-battle"),
                BattleId = result.BattleId,
                Outcome = result.Outcome,
                ResultHash = CoreApi.StableHashHex("forged-second-result"),
                UnitHp = TestCampaignDefinition.Instance.MaxHp,
            };

            var settledHash = fixture.Hash();
            var settledEvents = fixture.Ledger.Events.Count;

            var conflicted = SettlementApi.Apply(success.State, fixture.Ledger, book, reid);
            Assert.IsInstanceOf<SettlementConflict>(conflicted, "same battle settled under a second result id must conflict");
            Assert.AreEqual(settledHash, fixture.Hash(), "conflict must not mutate campaign state");
            Assert.AreEqual(settledEvents, fixture.Ledger.Events.Count, "conflict must not append events");
        }

        [Test]
        public void OngoingBattleResult_IsRejectedBeforeSettlement_WithoutMutation()
        {
            var fixture = CampaignWithPendingBattle("ongoing-campaign");
            var ongoing = new BattleResult
            {
                Outcome = BattleOutcomeKind.Ongoing,
                FinalElapsedSeconds = 0d,
                BattleId = fixture.Context.BattleId,
                ResultHash = CoreApi.StableHashHex("ongoing"),
                UnitHp = TestCampaignDefinition.Instance.MaxHp,
            };

            var beforeHash = fixture.Hash();
            var beforeEvents = fixture.Ledger.Events.Count;
            Assert.Throws<ArgumentException>(
                () => SettlementApi.FromBattleResult(ongoing),
                "a non-terminal battle result must never enter settlement");
            Assert.AreEqual(beforeHash, fixture.Hash());
            Assert.AreEqual(beforeEvents, fixture.Ledger.Events.Count);
        }

        [Test]
        public void MissingPendingBattle_IsRejectedWithoutStateLedgerOrBookMutation()
        {
            var fixture = CampaignWithPendingBattle("no-pending-campaign");
            var battle = RunToTerminal(SetupFor(fixture.Context), new Ledger());
            var result = SettlementApi.FromBattleResult(ResultOf(battle));

            var detached = fixture.State.Clone();
            detached.PendingBattle = null;
            var ledger = new Ledger();
            var book = new SettlementBook();
            var beforeHash = CampaignApi.ComputeCampaignHash(detached, ledger);
            var beforeEvents = ledger.Events.Count;

            var rejection = SettlementApi.Apply(detached, ledger, book, result);
            Assert.IsInstanceOf<SettlementRejection>(rejection, "settlement without a pending battle must reject");
            Assert.AreEqual(SettlementRejectReason.NoPendingBattle, ((SettlementRejection)rejection).Reason);
            Assert.AreEqual(beforeHash, CampaignApi.ComputeCampaignHash(detached, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            SettlementReceipt unusedReceipt;
            string unusedPayloadHash;
            Assert.IsFalse(book.TryGetByResultId(result.ResultId, out unusedReceipt, out unusedPayloadHash));
            ResultId unusedResultId;
            Assert.IsFalse(book.TryGetResultIdForBattle(result.BattleId, out unusedResultId));
        }

        [Test]
        public void BattleReplay_IsDeterministic_AndProducesStableSettlementReceipt()
        {
            var receiptHashes = new List<string>();
            var battleFingerprints = new List<string>();
            var battleLedgerHashes = new List<string>();
            var settledHashes = new List<string>();
            for (var run = 0; run < 2; run++)
            {
                var fixture = CampaignWithPendingBattle("replay-campaign");
                var battleLedger = new Ledger();
                var battle = RunToTerminal(SetupFor(fixture.Context), battleLedger);
                battleFingerprints.Add(battle.Fingerprint());
                battleLedgerHashes.Add(CoreApi.ComputeLedgerHash(battleLedger));
                var result = SettlementApi.FromBattleResult(ResultOf(battle));
                var first = SettlementApi.Apply(fixture.State, fixture.Ledger, new SettlementBook(), result);
                Assert.IsInstanceOf<SettlementSuccess>(first, "run " + run + " must settle");
                receiptHashes.Add(((SettlementSuccess)first).Receipt.ReceiptHash);
                settledHashes.Add(CampaignApi.ComputeCampaignHash(((SettlementSuccess)first).State, fixture.Ledger));
            }

            Assert.AreEqual(battleFingerprints[0], battleFingerprints[1], "identical authored inputs must replay to identical battle state");
            Assert.AreEqual(battleLedgerHashes[0], battleLedgerHashes[1], "battle event streams must replay identically");
            Assert.AreEqual(receiptHashes[0], receiptHashes[1], "identical settled inputs must yield identical receipt hashes");
            Assert.AreEqual(settledHashes[0], settledHashes[1], "settled campaign state must replay identically");
        }
    }
}
