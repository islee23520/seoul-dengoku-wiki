using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    [TestFixture]
    public sealed class RealtimeCardSettlementTests
    {
        static BattleSetup Setup()
        {
            return BattleSetup.FromContext(BattleContext.Create(
                "campaign", default(StationId), 271828,
                new Tick(0), 0, 0, BattleRules.RulesVersion, "rtfc-c0",
                UnitHpSnapshot.DefaultParty()));
        }

        static int ExpectedSurvivors(int hp, int maxHp)
        {
            if (hp <= 0 || maxHp <= 0) return 0;
            return System.Math.Min(4, (4 * hp + maxHp - 1) / maxHp);
        }

        static BattleTickCommand Command(string id, int seq, int tick, BattleTickCommandKind kind)
        {
            return new BattleTickCommand { Id = new CommandId(id), Seq = seq, At = new Tick(tick), Kind = kind };
        }

        static void Deploy(BattleSimState state, Ledger ledger, params string[] strongholdCards)
        {
            var deploy = Command("deploy", 0, state.Tick, BattleTickCommandKind.Deploy);
            deploy.Formation = Setup().PlayerFormation;
            deploy.StrongholdCardIds = strongholdCards;
            Assert.IsNull(BattleSim.Submit(state, ledger, deploy));
        }

        static void Play(BattleSimState state, Ledger ledger, string cardId, int seq)
        {
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var play = CharacterCardCommand(state, "play-" + cardId, cardId, seq, commander.Id, commander.Id);
            Assert.IsNull(BattleSim.Submit(state, ledger, play));
        }

        static BattleTickCommand CharacterCardCommand(BattleSimState state, string id, string cardId, int seq, UnitId ownerUnitId, UnitId targetUnitId)
        {
            return new BattleTickCommand
            {
                Id = new CommandId(id), Seq = seq, At = new Tick(state.Tick), Kind = BattleTickCommandKind.PlayCard,
                CardId = cardId, OwnerUnitId = ownerUnitId, TargetUnitId = targetUnitId,
            };
        }

        static BattleTickCommand StrongholdCardCommand(BattleSimState state, string id, string cardId, int seq, UnitId targetUnitId)
        {
            return new BattleTickCommand
            {
                Id = new CommandId(id), Seq = seq, At = new Tick(state.Tick), Kind = BattleTickCommandKind.PlayCard,
                CardId = cardId, TargetUnitId = targetUnitId,
            };
        }

        static CardState Card(BattleSimState state, UnitId ownerUnitId, string cardId)
        {
            return System.Array.Find(state.Cards, c => c.OwnerUnitId.Equals(ownerUnitId) && c.Id == cardId);
        }

        static void AssertRejectedWithoutMutation(BattleSimState state, Ledger ledger, BattleTickCommand command, BattleRejectReason expected)
        {
            var fingerprint = state.Fingerprint();
            var pending = state.Pending.Count;
            var events = ledger.Events.Count;
            var hp = System.Array.ConvertAll(state.Units, u => u.Hp);
            var cells = System.Array.ConvertAll(state.Units, u => u.Cell);
            var cooldowns = System.Array.ConvertAll(state.Cards, c => c.RechargeTicksLeft);

            var rejected = BattleSim.Submit(state, ledger, command);

            Assert.IsInstanceOf<BattleRejection>(rejected);
            Assert.AreEqual(expected, ((BattleRejection)rejected).Reason);
            Assert.AreEqual(fingerprint, state.Fingerprint());
            Assert.AreEqual(pending, state.Pending.Count);
            Assert.AreEqual(events, ledger.Events.Count);
            Assert.AreEqual(hp, System.Array.ConvertAll(state.Units, u => u.Hp));
            Assert.AreEqual(cells, System.Array.ConvertAll(state.Units, u => u.Cell));
            Assert.AreEqual(cooldowns, System.Array.ConvertAll(state.Cards, c => c.RechargeTicksLeft));
        }

        static void IsolateDuel(BattleSimState state, int playerPower, int enemyPower)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                state.Units[i].State = "Down";
                state.Units[i].Hp = 0;
            }

            var player = state.Units[0];
            var enemy = state.Units[6];
            player.State = "Active";
            player.Hp = player.MaxHp;
            player.Power = playerPower;
            player.Cell = new GridCoord(4, 4);
            player.RangeMin = 1;
            player.RangeMax = 1;
            player.CooldownTicksLeft = 0;
            enemy.State = "Active";
            enemy.Hp = enemy.MaxHp;
            enemy.Power = enemyPower;
            enemy.Cell = new GridCoord(5, 4);
            enemy.RangeMin = 1;
            enemy.RangeMax = 1;
            enemy.CooldownTicksLeft = 0;
        }

        static void KeepDuelOutOfCombat(BattleSimState state)
        {
            state.Units[0].Cell = new GridCoord(0, 0);
            state.Units[6].Cell = new GridCoord(11, 7);
            state.Units[0].MoveTicksLeft = 10000;
            state.Units[6].MoveTicksLeft = 10000;
            state.Units[0].CooldownTicksLeft = 10000;
            state.Units[6].CooldownTicksLeft = 10000;
        }

        static void KeepAllUnitsAliveAndIdle(BattleSimState state)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                unit.State = "Active";
                unit.Hp = System.Math.Max(1, unit.Hp);
                unit.MoveTicksLeft = 10000;
                unit.CooldownTicksLeft = 10000;
            }
        }

        static CampaignState CampaignWithPendingBattle()
        {
            Ledger ledger;
            return CampaignWithPendingBattle(out ledger);
        }

        static CampaignState CampaignWithPendingBattle(out Ledger ledger)
        {
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            ledger = new Ledger();
            var campaign = CampaignApi.Start(271828, StationId.Yeongdeungpo, "roundtrip-campaign");
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("depart"), Kind = CampaignCommandKind.Depart });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("travel"), Kind = CampaignCommandKind.Travel, TravelDestination = StationId.Sindorim });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("face"), Kind = CampaignCommandKind.FaceEncounter });
            campaign = (CampaignState)CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("resolution"), Kind = CampaignCommandKind.EnterResolution });
            var handoff = CampaignApi.Apply(graph, campaign, ledger, new CampaignCommand { Id = new CommandId("combat"), Kind = CampaignCommandKind.ChooseCombat });
            var context = ((BattleRequired)handoff).Context;
            return (CampaignState)CampaignApi.AttachPendingBattle(campaign, ledger, context, new CommandId("attach"));
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void CharacterCards_AreOwnedPerUnit_WhileStrongholdCardsStayShared()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "supply-heal");
            var ownerA = state.Units[0];
            var ownerB = state.Units[1];
            ownerA.Cell = new GridCoord(3, 3);
            ownerB.Cell = new GridCoord(4, 3);

            var a = CharacterCardCommand(state, "mobility-a", "mobility-regroup", 1, ownerA.Id, ownerA.Id);
            a.Facing = CardinalDirection.North;
            Assert.IsNull(BattleSim.Submit(state, ledger, a));
            Assert.AreEqual(600, Card(state, ownerA.Id, "mobility-regroup").RechargeTicksLeft);
            Assert.AreEqual(0, Card(state, ownerB.Id, "mobility-regroup").RechargeTicksLeft);

            var b = CharacterCardCommand(state, "mobility-b", "mobility-regroup", 2, ownerB.Id, ownerB.Id);
            b.Facing = CardinalDirection.South;
            Assert.IsNull(BattleSim.Submit(state, ledger, b));
            Assert.AreEqual(600, Card(state, ownerA.Id, "mobility-regroup").RechargeTicksLeft);
            Assert.AreEqual(600, Card(state, ownerB.Id, "mobility-regroup").RechargeTicksLeft);

            var retryA = CharacterCardCommand(state, "mobility-a-retry", "mobility-regroup", 3, ownerA.Id, ownerA.Id);
            retryA.Facing = CardinalDirection.East;
            AssertRejectedWithoutMutation(state, ledger, retryA, BattleRejectReason.CardRecharging);

            var guardA = CharacterCardCommand(state, "guard-a", "guard-shieldwall", 4, ownerA.Id, ownerA.Id);
            Assert.IsNull(BattleSim.Submit(state, ledger, guardA));
            var guardB = CharacterCardCommand(state, "guard-b", "guard-shieldwall", 5, ownerB.Id, ownerB.Id);
            Assert.IsNull(BattleSim.Submit(state, ledger, guardB));
            ownerA.Cell = new GridCoord(5, 4);
            state.Units[6].Cell = new GridCoord(6, 4);
            state.Units[6].Power = 5;
            state.Units[6].CooldownTicksLeft = 0;
            ownerA.CooldownTicksLeft = 10000;
            var guardedHp = ownerA.Hp;
            CombatRules.Resolve(state);
            Assert.AreEqual(guardedHp - 2, ownerA.Hp, "same persistent effect across owners must not stack");

            ownerA.Hp -= 1;
            ownerB.Hp -= 1;
            var supplyA = StrongholdCardCommand(state, "supply-a", "supply-heal", 6, ownerA.Id);
            Assert.IsNull(BattleSim.Submit(state, ledger, supplyA));
            var supplyB = StrongholdCardCommand(state, "supply-b", "supply-heal", 7, ownerB.Id);
            AssertRejectedWithoutMutation(state, ledger, supplyB, BattleRejectReason.CardRecharging);
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void AlliedReinforcement_ReceivesCharacterCardsExactlyOnce_AndReplaysDeterministically()
        {
            var setup = Setup();
            setup.Telegraphs = new[]
            {
                new TelegraphPlan
                {
                    Cell = new GridCoord(2, 2),
                    ArrivalTick = 0,
                    Count = 1,
                },
            };
            var state = BattleSim.Open(setup);
            var ledger = new Ledger();
            var deploy = Command("reinforcement-deploy", 0, 0, BattleTickCommandKind.Deploy);
            deploy.Formation = setup.PlayerFormation;
            deploy.StrongholdCardIds = new[] { "supply-heal" };
            Assert.IsNull(BattleSim.Submit(state, ledger, deploy));

            BattleSim.Step(state, ledger);

            var reinforcement = System.Array.Find(
                state.Units,
                unit => unit.Id.Equals(new UnitId("reinforce-0-0")));
            Assert.IsNotNull(reinforcement, "the scheduled allied reinforcement must arrive through Step");
            Assert.AreEqual(0, reinforcement.Side);

            var characterDefinitionCount = 0;
            foreach (var definition in CardCatalog.All())
            {
                if (definition.Kind != CardKind.Character) continue;
                characterDefinitionCount++;
                Assert.IsNotNull(
                    Card(state, reinforcement.Id, definition.Id),
                    "the new allied owner must receive " + definition.Id);
            }
            Assert.AreEqual(4, characterDefinitionCount);
            Assert.AreEqual(
                1,
                System.Array.FindAll(state.Cards, card =>
                    card.OwnerUnitId.Equals(default(UnitId))
                    && card.Id == "supply-heal").Length);
            Assert.AreEqual(
                1,
                System.Array.FindAll(state.Cards, card =>
                    card.OwnerUnitId.Equals(default(UnitId))
                    && card.Id == "passage-retreat").Length);

            var cardsAfterArrival = state.Cards.Length;
            var unitsAfterArrival = state.Units.Length;
            var arrivalClone = state.Clone();
            Assert.AreEqual(state.Fingerprint(), arrivalClone.Fingerprint());
            Assert.AreEqual(
                BattleSim.Snapshot(state).Cards.Length,
                BattleSim.Snapshot(arrivalClone).Cards.Length);

            BattleSim.Step(state, ledger);

            Assert.AreEqual(unitsAfterArrival, state.Units.Length, "arrival must occur exactly once");
            Assert.AreEqual(cardsAfterArrival, state.Cards.Length, "owner grants must occur exactly once");
            Assert.AreEqual(
                4,
                System.Array.FindAll(state.Cards, card =>
                    card.OwnerUnitId.Equals(reinforcement.Id)).Length);
            Assert.AreEqual(
                2,
                System.Array.FindAll(state.Cards, card =>
                    card.OwnerUnitId.Equals(default(UnitId))).Length,
                "shared stronghold states must not be duplicated for the new owner");

            var moraleBeforePlay = state.Sides[0].Morale;
            var play = CharacterCardCommand(
                state,
                "reinforcement-card",
                "encourage-morale",
                1,
                reinforcement.Id,
                reinforcement.Id);
            Assert.IsNull(BattleSim.Submit(state, ledger, play));
            Assert.AreEqual(moraleBeforePlay + 10, state.Sides[0].Morale);
            Assert.AreEqual(600, Card(state, reinforcement.Id, "encourage-morale").RechargeTicksLeft);
            BattleSim.Step(state, ledger);

            var replay = BattleSim.Replay(setup, new[] { deploy, play }, state.Tick);
            var directSnapshot = BattleSim.Snapshot(state);
            var replaySnapshot = BattleSim.Snapshot(replay.Item1);
            var directOwnerCard = System.Array.Find(directSnapshot.Cards, card =>
                card.OwnerUnitId.Equals(reinforcement.Id)
                && card.Id == "encourage-morale");
            var replayOwnerCard = System.Array.Find(replaySnapshot.Cards, card =>
                card.OwnerUnitId.Equals(reinforcement.Id)
                && card.Id == "encourage-morale");

            Assert.AreEqual(directSnapshot.Tick, replaySnapshot.Tick);
            Assert.AreEqual(directSnapshot.Outcome, replaySnapshot.Outcome);
            Assert.AreEqual(directSnapshot.Units.Length, replaySnapshot.Units.Length);
            Assert.AreEqual(directSnapshot.Cards.Length, replaySnapshot.Cards.Length);
            Assert.IsNotNull(directOwnerCard);
            Assert.IsNotNull(replayOwnerCard);
            Assert.AreEqual(directOwnerCard.RechargeTicksLeft, replayOwnerCard.RechargeTicksLeft);
            Assert.AreEqual(state.Fingerprint(), replay.Item1.Fingerprint());
            Assert.AreEqual(CoreApi.ComputeLedgerHash(ledger), CoreApi.ComputeLedgerHash(replay.Item2));
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void CardPreview_IsPure_AndSubmitRevalidatesOwnerTargetOccupancyTerrainAndTick()
        {
            BattleSimState Build(out Ledger ledger, out BattleTickCommand command)
            {
                var state = BattleSim.Open(Setup());
                ledger = new Ledger();
                Deploy(state, ledger);
                var owner = state.Units[0];
                var target = state.Units[1];
                owner.Cell = new GridCoord(3, 3);
                target.Cell = new GridCoord(4, 3);
                command = CharacterCardCommand(state, "preview-mobility", "mobility-regroup", 1, owner.Id, target.Id);
                command.Facing = CardinalDirection.North;
                return state;
            }

            void AssertPreviewThenReject(System.Action<BattleSimState, BattleTickCommand> stale, BattleRejectReason expected)
            {
                var state = Build(out var ledger, out var command);
                var beforePreview = state.Fingerprint();
                var beforePending = state.Pending.Count;
                var beforeEvents = ledger.Events.Count;
                Assert.IsNull(BattleSim.PreviewCard(state, command));
                Assert.AreEqual(beforePreview, state.Fingerprint(), "preview must not mutate Core state");
                Assert.AreEqual(beforePending, state.Pending.Count);
                Assert.AreEqual(beforeEvents, ledger.Events.Count);
                stale(state, command);
                AssertRejectedWithoutMutation(state, ledger, command, expected);
            }

            AssertPreviewThenReject((state, command) => { var owner = System.Array.Find(state.Units, u => u.Id.Equals(command.OwnerUnitId)); owner.Hp = 0; owner.State = "Down"; }, BattleRejectReason.CardInvalidOwner);
            AssertPreviewThenReject((state, command) => System.Array.Find(state.Units, u => u.Id.Equals(command.OwnerUnitId)).Side = 1, BattleRejectReason.CardInvalidOwner);
            AssertPreviewThenReject((state, command) => { var target = System.Array.Find(state.Units, u => u.Id.Equals(command.TargetUnitId)); target.Hp = 0; target.State = "Down"; }, BattleRejectReason.CardInvalidTarget);
            AssertPreviewThenReject((state, command) => state.Units[2].Cell = System.Array.Find(state.Units, u => u.Id.Equals(command.TargetUnitId)).Cell.Step(command.Facing), BattleRejectReason.CardDestinationBlocked);
            AssertPreviewThenReject((state, command) => state.Tick++, BattleRejectReason.TickMismatch);

            var terrainState = Build(out var terrainLedger, out var terrainCommand);
            var cells = new int[12 * 8];
            for (var i = 0; i < cells.Length; i++) cells[i] = 3;
            var targetCell = System.Array.Find(terrainState.Units, u => u.Id.Equals(terrainCommand.TargetUnitId)).Cell.Step(terrainCommand.Facing);
            cells[targetCell.Y * 12 + targetCell.X] = 2;
            Assert.IsNull(BattleSim.PreviewCard(terrainState, terrainCommand));
            terrainState.Terrain = new Heightmap(12, 8, 8, 2, 7, LayerId.B1, cells);
            AssertRejectedWithoutMutation(terrainState, terrainLedger, terrainCommand, BattleRejectReason.CardDestinationOutOfBounds);
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void CardValidation_RejectsOwnerlessForeignDeadAndInvalidTarget()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            var owner = state.Units[0];
            var target = state.Units[1];

            AssertRejectedWithoutMutation(state, ledger,
                CharacterCardCommand(state, "ownerless", "encourage-morale", 1, default(UnitId), target.Id),
                BattleRejectReason.CardOwnerRequired);
            AssertRejectedWithoutMutation(state, ledger,
                CharacterCardCommand(state, "foreign", "encourage-morale", 2, state.Units[6].Id, target.Id),
                BattleRejectReason.CardInvalidOwner);

            owner.Hp = 0; owner.State = "Down";
            AssertRejectedWithoutMutation(state, ledger,
                CharacterCardCommand(state, "dead", "encourage-morale", 3, owner.Id, target.Id),
                BattleRejectReason.CardInvalidOwner);
            owner.Hp = owner.MaxHp; owner.State = "Active";

            AssertRejectedWithoutMutation(state, ledger,
                CharacterCardCommand(state, "enemy-target", "mobility-regroup", 4, owner.Id, state.Units[6].Id),
                BattleRejectReason.CardInvalidTarget);
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void Submit_AcceptedCommandOwnsKind_WhenCallerMutatesBeforeStep()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            var owner = state.Units[0];
            var command = CharacterCardCommand(
                state,
                "caller-owned-kind",
                "encourage-morale",
                1,
                owner.Id,
                owner.Id);

            Assert.IsNull(BattleSim.Submit(state, ledger, command));
            command.Kind = BattleTickCommandKind.OrderRetreat;

            BattleSim.Step(state, ledger);

            Assert.AreEqual(
                BattleOutcomeKind.Ongoing,
                state.Outcome,
                "mutating the caller's accepted command must not authorize an unvalidated retreat");
            Assert.AreEqual(599, Card(state, owner.Id, "encourage-morale").RechargeTicksLeft);
            Assert.AreEqual(0, state.Pending.Count);
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void CharacterCardRadius_UsesOwningCharacter_WhileStrongholdRadiusStaysCommanderShared()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "supply-heal");
            var commander = System.Array.Find(state.Units, unit => unit.Id.Equals(state.PlayerCommanderId));
            var owner = state.Units[1];
            var target = state.Units[2];
            commander.Cell = new GridCoord(0, 0);
            owner.Cell = new GridCoord(6, 5);
            target.Cell = new GridCoord(7, 5);

            var character = CharacterCardCommand(
                state, "owner-radius", "guard-shieldwall", 1, owner.Id, target.Id);
            Assert.IsNull(
                BattleSim.Submit(state, ledger, character),
                "character-card radius must originate from its owning character");

            target.Hp--;
            var stronghold = StrongholdCardCommand(
                state, "commander-radius", "supply-heal", 2, target.Id);
            AssertRejectedWithoutMutation(
                state, ledger, stronghold, BattleRejectReason.CardOutOfRadius);
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void CloneSnapshotFingerprintAndReplay_IncludeOwnerStateAndRejectOldOwnerlessRecords()
        {
            var setup = Setup();
            var state = BattleSim.Open(setup);
            var snapshot = BattleSim.Snapshot(state);
            Assert.AreEqual(BattleRules.RulesVersion, snapshot.RulesVersion);
            Assert.AreEqual(26, snapshot.Cards.Length, "four character cards per six allied owners plus two shared stronghold cards");
            Assert.AreEqual(6, System.Array.FindAll(snapshot.Cards, c => c.Id == "mobility-regroup").Length);

            var clone = state.Clone();
            Assert.AreEqual(state.Fingerprint(), clone.Fingerprint());
            clone.Cards[0].OwnerUnitId = clone.Units[1].Id;
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(), "owner identity must affect deterministic state");
            clone = state.Clone();
            clone.Pending.Add(CharacterCardCommand(clone, "pending-owner", "encourage-morale", 9, clone.Units[0].Id, clone.Units[1].Id));
            var pendingHash = clone.Fingerprint();
            var pendingClone = clone.Clone();
            Assert.AreEqual(pendingHash, pendingClone.Fingerprint());
            pendingClone.Pending[0].OwnerUnitId = pendingClone.Units[2].Id;
            Assert.AreNotEqual(pendingHash, pendingClone.Fingerprint(), "pending owner identity must be cloned and fingerprinted");

            var deploy = Command("replay-deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = setup.PlayerFormation;
            var owner = state.Units[0].Id;
            var play = CharacterCardCommand(state, "replay-card", "encourage-morale", 1, owner, owner);
            var commands = new List<BattleTickCommand> { deploy, play };
            var a = BattleSim.Replay(setup, commands, 16);
            var b = BattleSim.Replay(setup, commands, 16);
            Assert.AreEqual(a.Item1.Fingerprint(), b.Item1.Fingerprint());
            Assert.AreEqual(CoreApi.ComputeLedgerHash(a.Item2), CoreApi.ComputeLedgerHash(b.Item2));

            var oldSetup = BattleSetup.FromContext(BattleContext.Create(
                "campaign", default(StationId), 271828, new Tick(0), 0, 0,
                BattleRules.LegacyRulesVersion, "old-replay", UnitHpSnapshot.DefaultParty()));
            var oldOwnerless = Command("old-ownerless", 0, 0, BattleTickCommandKind.PlayCard);
            oldOwnerless.CardId = "encourage-morale";
            Assert.Throws<System.NotSupportedException>(() => BattleSim.Open(oldSetup));
            Assert.Throws<System.NotSupportedException>(() => BattleSim.Replay(oldSetup, new[] { oldOwnerless }, 1));
        }

        [Test]
        [Category("ApprovedUnityCards")]
        public void CampaignBattleCoreEntry_SubmitSnapshotReplayAndSettlement_PreservesExactOnce()
        {
            var campaign = CampaignWithPendingBattle();
            var setup = BattleSetup.FromContext(campaign.PendingBattle);
            var battle = BattleSim.Open(setup);
            var ledger = new Ledger();
            Deploy(battle, ledger, "passage-retreat");
            var owner = battle.Units[0];
            var passage = StrongholdCardCommand(battle, "campaign-passage", "passage-retreat", 1, owner.Id);
            Assert.IsNull(BattleSim.PreviewCard(battle, passage));
            Assert.IsNull(BattleSim.Submit(battle, ledger, passage));
            Assert.AreEqual(750, System.Array.Find(BattleSim.Snapshot(battle).Cards, c => c.Id == "passage-retreat").RechargeTicksLeft);
            var retreat = Command("campaign-retreat", 2, battle.Tick, BattleTickCommandKind.OrderRetreat);
            Assert.IsNull(BattleSim.Submit(battle, ledger, retreat));
            BattleSim.Step(battle, ledger);

            var replayDeploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy);
            replayDeploy.Formation = setup.PlayerFormation;
            replayDeploy.StrongholdCardIds = new[] { "passage-retreat" };
            var replayPassage = new BattleTickCommand
            {
                Id = new CommandId("campaign-passage"), Seq = 1, At = new Tick(0), Kind = BattleTickCommandKind.PlayCard,
                CardId = "passage-retreat", TargetUnitId = setup.PlayerUnits[0].Id,
            };
            var replayRetreat = Command("campaign-retreat", 2, 0, BattleTickCommandKind.OrderRetreat);
            var replay = BattleSim.Replay(setup, new[] { replayDeploy, replayPassage, replayRetreat }, battle.Tick);
            Assert.AreEqual(battle.Fingerprint(), replay.Item1.Fingerprint());
            Assert.AreEqual(CoreApi.ComputeLedgerHash(ledger), CoreApi.ComputeLedgerHash(replay.Item2));

            var result = SettlementApi.FromRealtimeResult(BattleSim.Result(battle));
            var book = new SettlementBook();
            var campaignLedger = new Ledger();
            var first = SettlementApi.Apply(campaign, campaignLedger, book, result);
            Assert.IsInstanceOf<SettlementSuccess>(first);
            var success = (SettlementSuccess)first;
            var duplicate = SettlementApi.Apply(success.State, campaignLedger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate);
            Assert.AreEqual(success.Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
            Assert.IsTrue(result.UnitHp.TryGet(RealtimeBattleApi.PersistentAllyId, out var settledHp));
            Assert.AreEqual(settledHp, battle.Units[0].Hp);
        }

        [Test]
        public void Catalog_IsStaticGrantType_NoDeckNoDraw()
        {
            var first = CardCatalog.All();
            var second = CardCatalog.All();
            Assert.Greater(first.Count, 0);
            Assert.AreEqual(first.Count, second.Count);
            foreach (var card in first)
            {
                Assert.IsFalse(string.IsNullOrEmpty(card.Id));
                Assert.That(card.Kind, Is.EqualTo(CardKind.Character).Or.EqualTo(CardKind.Stronghold));
                Assert.That(card.RechargeTicks, Is.InRange(300, 900));
                Assert.IsNotNull(card.Effect);
            }
            Assert.IsFalse(CardCatalog.HasDeck);
            Assert.IsFalse(CardCatalog.HasDraw);
        }

        [Test]
        public void MobilityRegroup_RepositionsOneLivingPlayerUnit_AndConsumesRecharge()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            var target = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var beforeCell = target.Cell;
            var beforeHash = state.Fingerprint();
            var play = CharacterCardCommand(state, "mobility-east", "mobility-regroup", 1, target.Id, target.Id);
            play.Facing = CardinalDirection.South;

            Assert.IsNull(BattleSim.Submit(state, ledger, play));
            Assert.AreEqual(beforeCell.Step(CardinalDirection.South), target.Cell);
            Assert.AreEqual(CardinalDirection.South, target.Facing);
            Assert.AreEqual(600, System.Array.Find(state.Cards, c => c.Id == "mobility-regroup").RechargeTicksLeft);
            Assert.AreNotEqual(beforeHash, state.Fingerprint(), "position and cooldown must change replay state");
        }

        [Test]
        public void MobilityRegroup_InvalidDeadBlockedAndOutOfBoundsTargets_AreZeroMutation()
        {
            void AssertRejected(BattleSimState state, BattleRejectReason expected, GridCoord targetCell, CardinalDirection facing)
            {
                var ledger = new Ledger();
                var before = state.Fingerprint();
                var events = ledger.Events.Count;
                var target = System.Array.Find(state.Units, u => u.Side == 0 && u.Cell.Equals(targetCell));
                var owner = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
                var play = CharacterCardCommand(state, "mobility-reject-" + expected, "mobility-regroup", 1, owner.Id, target == null ? default(UnitId) : target.Id);
                play.Facing = facing;
                var rejected = BattleSim.Submit(state, ledger, play);
                Assert.IsInstanceOf<BattleRejection>(rejected);
                Assert.AreEqual(expected, ((BattleRejection)rejected).Reason);
                Assert.AreEqual(before, state.Fingerprint());
                Assert.AreEqual(events, ledger.Events.Count);
                Assert.AreEqual(0, System.Array.Find(state.Cards, c => c.Id == "mobility-regroup").RechargeTicksLeft);
            }

            var dead = BattleSim.Open(Setup());
            Deploy(dead, new Ledger());
            var deadTarget = System.Array.Find(dead.Units, u => u.Id.Equals(dead.PlayerCommanderId));
            deadTarget.Hp = 0; deadTarget.State = "Down";
            AssertRejected(dead, BattleRejectReason.CardInvalidOwner, deadTarget.Cell, CardinalDirection.East);

            var blocked = BattleSim.Open(Setup());
            Deploy(blocked, new Ledger());
            var blockedCommander = System.Array.Find(blocked.Units, u => u.Id.Equals(blocked.PlayerCommanderId));
            var blockedTarget = blocked.Units[1];
            blockedCommander.Cell = new GridCoord(4, 3);
            blockedTarget.Cell = new GridCoord(5, 4);
            blocked.Units[2].Cell = new GridCoord(6, 4);
            AssertRejected(blocked, BattleRejectReason.CardDestinationBlocked, blockedTarget.Cell, CardinalDirection.East);

            var edge = BattleSim.Open(Setup());
            Deploy(edge, new Ledger());
            var edgeCommander = System.Array.Find(edge.Units, u => u.Id.Equals(edge.PlayerCommanderId));
            var edgeTarget = edge.Units[1];
            edgeCommander.Cell = new GridCoord(edge.Arena.Width - 3, 4);
            edgeTarget.Cell = new GridCoord(edge.Arena.Width - 1, 4);
            AssertRejected(edge, BattleRejectReason.CardDestinationOutOfBounds, edgeTarget.Cell, CardinalDirection.East);
        }

        [Test]
        public void Catalog_HasSixCards_AndPreservesOriginalIds()
        {
            var cards = CardCatalog.All();
            Assert.AreEqual(6, cards.Count);
            foreach (var id in new[] { "guard-shieldwall", "encourage-morale", "pincer-focus", "supply-heal", "passage-retreat", "mobility-regroup" })
                Assert.IsNotNull(CardCatalog.Find(id), id);
            var mobility = CardCatalog.Find("mobility-regroup");
            Assert.AreEqual(CardKind.Character, mobility.Kind);
            Assert.AreEqual(600, mobility.RechargeTicks);
        }

        [Test]
        public void PlayCard_RechargesOverTicks()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            var card = CardCatalog.All()[0];
            var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy);
            deploy.Formation = Setup().PlayerFormation;
            Assert.IsNull(BattleSim.Submit(state, ledger, deploy));
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var play = card.Kind == CardKind.Character
                ? CharacterCardCommand(state, "play", card.Id, 1, commander.Id, commander.Id)
                : StrongholdCardCommand(state, "play", card.Id, 1, commander.Id);
            Assert.IsNull(BattleSim.Submit(state, ledger, play));
            var view = System.Array.Find(BattleSim.Snapshot(state).Cards, x => x.Id == card.Id);
            Assert.AreEqual(card.RechargeTicks, view.RechargeTicksLeft);
            KeepAllUnitsAliveAndIdle(state);
            for (var i = 0; i < card.RechargeTicks; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(0, System.Array.Find(BattleSim.Snapshot(state).Cards, x => x.Id == card.Id).RechargeTicksLeft);
            var livingCommander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var playAgain = card.Kind == CardKind.Character
                ? CharacterCardCommand(state, "play-again", card.Id, 2, livingCommander.Id, livingCommander.Id)
                : StrongholdCardCommand(state, "play-again", card.Id, 2, livingCommander.Id);
            Assert.IsNull(BattleSim.Submit(state, ledger, playAgain));
        }

        [Test]
        public void PlayCard_RejectedWhileRecharging()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var card = CardCatalog.All()[0];
            var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = Setup().PlayerFormation;
            BattleSim.Submit(state, ledger, deploy);
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var play = CharacterCardCommand(state, "play", card.Id, 1, commander.Id, commander.Id);
            BattleSim.Submit(state, ledger, play);
            var before = state.Fingerprint(); var events = ledger.Events.Count;
            var retry = CharacterCardCommand(state, "retry", card.Id, 2, commander.Id, commander.Id);
            var rejection = (BattleRejection)BattleSim.Submit(state, ledger, retry);
            Assert.AreEqual(BattleRejectReason.CardRecharging, rejection.Reason);
            Assert.AreEqual(before, state.Fingerprint()); Assert.AreEqual(events, ledger.Events.Count);
        }

        [Test]
        public void GuardShieldwall_ReducesActualReceivedDamageByThreeFor150Ticks_ThenExpires()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            IsolateDuel(state, 0, 5);
            Play(state, ledger, "guard-shieldwall", 1);

            state.Units[0].CooldownTicksLeft = 10000;
            var hp = state.Units[0].Hp;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 2, state.Units[0].Hp, "guard must reduce a real 5 damage strike to 2");

            state.Units[0].Hp = hp;
            state.Units[6].Power = 2;
            state.Units[6].CooldownTicksLeft = 0;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp, state.Units[0].Hp, "guard damage floors at zero");

            KeepDuelOutOfCombat(state);
            for (var i = 0; i < 149 && state.Outcome == BattleOutcomeKind.Ongoing; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(1, System.Array.Find(state.Cards, c => c.Id == "guard-shieldwall").ActiveTicksLeft);
            BattleSim.Step(state, ledger);
            Assert.AreEqual(0, System.Array.Find(state.Cards, c => c.Id == "guard-shieldwall").ActiveTicksLeft);
            state.Units[0].Cell = new GridCoord(4, 4);
            state.Units[6].Cell = new GridCoord(5, 4);
            state.Units[6].Power = 5;
            state.Units[6].CooldownTicksLeft = 0;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 5, state.Units[0].Hp, "guard must expire after 150 simulation ticks");
        }

        [Test]
        public void PincerFocus_AddsOneActualOutgoingDamageFor150Ticks_ThenExpires()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            IsolateDuel(state, 4, 0);
            Play(state, ledger, "pincer-focus", 1);

            state.Units[6].CooldownTicksLeft = 10000;
            var hp = state.Units[6].Hp;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 5, state.Units[6].Hp, "pincer must increase a real outgoing strike from 4 to 5");

            state.Units[6].Hp = hp;
            KeepDuelOutOfCombat(state);
            for (var i = 0; i < 149 && state.Outcome == BattleOutcomeKind.Ongoing; i++) BattleSim.Step(state, ledger);
            Assert.AreEqual(1, System.Array.Find(state.Cards, c => c.Id == "pincer-focus").ActiveTicksLeft);
            BattleSim.Step(state, ledger);
            Assert.AreEqual(0, System.Array.Find(state.Cards, c => c.Id == "pincer-focus").ActiveTicksLeft);
            state.Units[0].Cell = new GridCoord(4, 4);
            state.Units[6].Cell = new GridCoord(5, 4);
            state.Units[0].CooldownTicksLeft = 0;
            CombatRules.Resolve(state);
            Assert.AreEqual(hp - 4, state.Units[6].Hp, "pincer must expire after 150 simulation ticks");
        }

        [Test]
        public void PassageRetreat_SelectedStronghold_EnablesFriendlyRetreatPath()
        {
            var unavailable = BattleSim.Open(Setup());
            var unavailableLedger = new Ledger();
            Deploy(unavailable, unavailableLedger);
            var retreat = Command("retreat-without-passage", 1, 0, BattleTickCommandKind.OrderRetreat);
            var rejection = BattleSim.Submit(unavailable, unavailableLedger, retreat);
            Assert.IsInstanceOf<BattleRejection>(rejection);

            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "passage-retreat");
            Play(state, ledger, "passage-retreat", 1);
            var enabledRetreat = Command("retreat-through-passage", 2, state.Tick, BattleTickCommandKind.OrderRetreat);
            Assert.IsNull(BattleSim.Submit(state, ledger, enabledRetreat));
            BattleSim.Step(state, ledger);
            Assert.AreEqual(BattleOutcomeKind.PlayerRetreat, state.Outcome);
        }

        [Test]
        public void StrongholdCard_MustBeSelectedAtDeploy()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            var play = StrongholdCardCommand(state, "unselected-supply", "supply-heal", 1, commander.Id);
            var rejection = BattleSim.Submit(state, ledger, play);
            Assert.IsInstanceOf<BattleRejection>(rejection);
            Assert.AreEqual(BattleRejectReason.CardUnknown, ((BattleRejection)rejection).Reason);
        }

        [Test]
        public void CardRadius_RequiresLivingCommander_NotNearbyDeadUnit()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger);
            var commander = System.Array.Find(state.Units, u => u.Id.Equals(state.PlayerCommanderId));
            commander.State = "Down";
            commander.Hp = 0;
            var nearby = System.Array.Find(state.Units, u => u.Side == 0 && !u.Id.Equals(state.PlayerCommanderId));
            var play = CharacterCardCommand(state, "dead-commander", "guard-shieldwall", 1, commander.Id, nearby.Id);
            var rejection = BattleSim.Submit(state, ledger, play);
            Assert.IsInstanceOf<BattleRejection>(rejection);
            Assert.AreEqual(BattleRejectReason.CardInvalidOwner, ((BattleRejection)rejection).Reason);
        }

        [Test]
        public void SupplyHeal_DoesNotReviveDownFrontUnit()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "supply-heal");
            state.Units[0].State = "Down";
            state.Units[0].Hp = 0;
            state.PlayerCommanderId = state.Units[1].Id;
            state.Units[1].Hp -= 5;
            Play(state, ledger, "supply-heal", 1);
            Assert.AreEqual(0, state.Units[0].Hp);
            Assert.AreEqual("Down", state.Units[0].State);
            Assert.AreEqual(state.Units[1].MaxHp, state.Units[1].Hp);
        }

        [Test]
        public void CloneAndFingerprint_IncludeActiveModifiersRechargeAndEligibility()
        {
            var state = BattleSim.Open(Setup());
            var ledger = new Ledger();
            Deploy(state, ledger, "passage-retreat");
            Play(state, ledger, "guard-shieldwall", 1);
            var clone = state.Clone();
            Assert.AreEqual(state.Fingerprint(), clone.Fingerprint());

            clone.Cards[0].RechargeTicksLeft--;
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(), "recharge must affect replay fingerprint");
            clone = state.Clone();
            var activeTicks = typeof(CardState).GetField("ActiveTicksLeft");
            Assert.IsNotNull(activeTicks, "active modifier countdown must be stored in replay state");
            activeTicks.SetValue(clone.Cards[0], (int)activeTicks.GetValue(clone.Cards[0]) - 1);
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(), "active modifier countdown must affect replay fingerprint");
            clone = state.Clone();
            clone.StrongholdCardIds = new[] { "supply-heal" };
            Assert.AreNotEqual(state.Fingerprint(), clone.Fingerprint(), "selected stronghold eligibility must affect replay fingerprint");
        }

        [Test]
        public void PlayCard_OutOfCommandRadius_Fails()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            Deploy(state, ledger);
            var owner = state.Units[0];
            var target = state.Units[1];
            owner.Cell = new GridCoord(0, 0);
            target.Cell = new GridCoord(8, 7);
            var play = CharacterCardCommand(state, "far", CardCatalog.All()[0].Id, 1, owner.Id, target.Id);
            var rejection = (BattleRejection)BattleSim.Submit(state, ledger, play);
            Assert.AreEqual(BattleRejectReason.CardOutOfRadius, rejection.Reason);
        }

        [Test]
        public void StrongholdSelection_RejectsUnknownOrCharacterCardIds()
        {
            foreach (var invalid in new[] { "unknown-card", "guard-shieldwall" })
            {
                var state = BattleSim.Open(Setup());
                var ledger = new Ledger();
                var deploy = Command("deploy-" + invalid, 0, 0, BattleTickCommandKind.Deploy);
                deploy.Formation = Setup().PlayerFormation;
                deploy.StrongholdCardIds = new[] { invalid };
                var rejection = BattleSim.Submit(state, ledger, deploy);
                Assert.IsInstanceOf<BattleRejection>(rejection);
                Assert.AreEqual(BattleRejectReason.MalformedCommand, ((BattleRejection)rejection).Reason);
            }
        }

        [Test]
        public void StrongholdCardSlots_LimitedToTwo()
        {
            var state = BattleSim.Open(Setup()); var ledger = new Ledger();
            var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = Setup().PlayerFormation; deploy.StrongholdCards = new[] { "supply", "pass", "extra" };
            var rejection = (BattleRejection)BattleSim.Submit(state, ledger, deploy);
            Assert.AreEqual(BattleRejectReason.MalformedCommand, rejection.Reason);
        }

        [Test]
        public void Replay_WithDeployAndPlayCard_IsDeterministicWithoutPauseTicks()
        {
            var setup = Setup(); var deploy = Command("deploy", 0, 0, BattleTickCommandKind.Deploy); deploy.Formation = setup.PlayerFormation;
            var play = new BattleTickCommand { Id = new CommandId("play"), Seq = 1, At = new Tick(0), Kind = BattleTickCommandKind.PlayCard, CardId = CardCatalog.All()[0].Id, OwnerUnitId = setup.PlayerUnits[0].Id, TargetUnitId = setup.PlayerUnits[0].Id };
            var commands = new List<BattleTickCommand> { deploy, play };
            var a = BattleSim.Replay(setup, commands, 64); var b = BattleSim.Replay(setup, commands, 64);
            Assert.AreEqual(a.Item1.Fingerprint(), b.Item1.Fingerprint());
            Assert.AreEqual(CoreApi.ComputeLedgerHash(a.Item2), CoreApi.ComputeLedgerHash(b.Item2));
        }

        [Test]
        public void ToEncounterResult_MapsRetreatSurrenderDistinctly()
        {
            var retreat = new BattleResult { Outcome = BattleOutcomeKind.PlayerRetreat, ResultHash = "retreat" }.ToEncounterResult();
            var surrender = new BattleResult { Outcome = BattleOutcomeKind.EnemySurrender, ResultHash = "surrender" }.ToEncounterResult();
            Assert.AreNotEqual(retreat.ResultHash, surrender.ResultHash);
            Assert.AreNotEqual(retreat.Outcome, surrender.Outcome);
        }

        [Test]
        public void CombatSettlement_OngoingBattleResult_IsRejectedWithoutMutation()
        {
            var campaign = CampaignWithPendingBattle();
            var ledger = new Ledger();
            var book = new SettlementBook();
            var ongoingBattle = BattleSim.Result(BattleSim.Open(BattleSetup.FromContext(campaign.PendingBattle)));
            var before = CampaignApi.ComputeCampaignHash(campaign, ledger);
            Assert.Throws<System.ArgumentException>(() => SettlementApi.FromRealtimeResult(ongoingBattle));
            Assert.AreEqual(before, CampaignApi.ComputeCampaignHash(campaign, ledger));
            Assert.AreEqual(0, ledger.Events.Count);
        }

        [Test]
        public void CombatSettlement_NoPendingBattle_RejectsWithoutStateLedgerOrBookMutation()
        {
            var campaign = CampaignWithPendingBattle();
            var noPending = campaign.Clone();
            noPending.PendingBattle = null;
            var ledger = new Ledger();
            var book = new SettlementBook();
            var result = new EncounterResult
            {
                ResultId = new ResultId("result-no-pending"),
                BattleId = new BattleId(campaign.PendingBattle.BattleId),
                Outcome = SettlementOutcomeKind.PlayerVictory,
                ResultHash = CoreApi.StableHashHex("terminal-no-pending")
            };
            var beforeHash = CampaignApi.ComputeCampaignHash(noPending, ledger);
            var beforeEvents = ledger.Events.Count;

            var rejection = SettlementApi.Apply(noPending, ledger, book, result);
            Assert.IsInstanceOf<SettlementRejection>(rejection);
            Assert.AreEqual(SettlementRejectReason.NoPendingBattle, ((SettlementRejection)rejection).Reason);
            Assert.AreEqual(beforeHash, CampaignApi.ComputeCampaignHash(noPending, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.IsFalse(book.TryGetByResultId(result.ResultId, out _, out _));
            Assert.IsFalse(book.TryGetResultIdForBattle(result.BattleId, out _));
        }

        [Test]
        public void Settlement_ExactOnce_SurvivesDomainSwap()
        {
            var campaign = CampaignWithPendingBattle();
            var battle = BattleSim.Open(BattleSetup.FromContext(campaign.PendingBattle));
            KeepAllUnitsAliveAndIdle(battle);
            battle.Tick = BattleRules.MaxTicks - 1;
            BattleSim.Step(battle, new Ledger());
            Assert.AreEqual(BattleOutcomeKind.Draw, battle.Outcome, "fixture must reach a real terminal outcome");
            var result = BattleSim.Result(battle).ToEncounterResult();
            var ledger = new Ledger(); var book = new SettlementBook();
            var first = SettlementApi.Apply(campaign, ledger, book, result);
            Assert.IsInstanceOf<SettlementSuccess>(first, first is SettlementRejection rejected ? rejected.Reason.ToString() : first?.GetType().Name);
            var duplicate = SettlementApi.Apply(((SettlementSuccess)first).State, ledger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate);
            Assert.AreEqual(((SettlementSuccess)first).Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
        }

        [Test]
        public void CampaignBattleCardSettlementDuplicateReturn_RoundTripTranscript()
        {
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var campaign = CampaignWithPendingBattle(out var campaignLedger);
            var context = campaign.PendingBattle;
            var battle = BattleSim.Open(BattleSetup.FromContext(context));
            var battleLedger = new Ledger();
            Deploy(battle, battleLedger, "passage-retreat");
            Play(battle, battleLedger, "passage-retreat", 1);
            var rechargeStart = System.Array.Find(battle.Cards, c => c.Id == "passage-retreat").RechargeTicksLeft;
            var retreat = Command("roundtrip-retreat", 2, battle.Tick, BattleTickCommandKind.OrderRetreat);
            Assert.IsNull(BattleSim.Submit(battle, battleLedger, retreat));
            BattleSim.Step(battle, battleLedger);
            var rechargeAfterTick = System.Array.Find(battle.Cards, c => c.Id == "passage-retreat").RechargeTicksLeft;
            Assert.AreEqual(750, rechargeStart);
            Assert.AreEqual(749, rechargeAfterTick);
            Assert.AreEqual(BattleOutcomeKind.PlayerRetreat, battle.Outcome);

            var battleResult = BattleSim.Result(battle);
            var result = SettlementApi.FromRealtimeResult(battleResult);
            Assert.AreEqual(context.BattleId, battleResult.BattleId);
            Assert.AreEqual(context.BattleId, result.BattleId.Value);
            Assert.AreNotEqual(SettlementOutcomeKind.None, result.Outcome);

            var book = new SettlementBook();
            var before = CampaignApi.ComputeCampaignHash(campaign, campaignLedger);
            var first = (SettlementSuccess)SettlementApi.Apply(campaign, campaignLedger, book, result);
            var settledHash = CampaignApi.ComputeCampaignHash(first.State, campaignLedger);
            var settledEvents = campaignLedger.Events.Count;
            var duplicate = SettlementApi.Apply(first.State, campaignLedger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate);
            Assert.AreEqual(first.Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
            Assert.AreEqual(settledHash, CampaignApi.ComputeCampaignHash(first.State, campaignLedger));
            Assert.AreEqual(settledEvents, campaignLedger.Events.Count);

            var returned = (CampaignState)CampaignApi.Apply(graph, first.State, campaignLedger, new CampaignCommand
            {
                Id = new CommandId("roundtrip-return"),
                Kind = CampaignCommandKind.CompleteReturn
            });
            var returnHash = CampaignApi.ComputeCampaignHash(returned, campaignLedger);
            Assert.AreEqual(CampaignStage.BaseReady, returned.Stage);
            Assert.AreEqual(returned.HomeBase, returned.Node);

            System.Console.WriteLine(
                "ROUNDTRIP"
                + ";campaign=" + campaign.CampaignId
                + ";battle=" + context.BattleId
                + ";contextHash=" + context.ContextHash
                + ";card=passage-retreat"
                + ";cardTick=0"
                + ";rechargeStart=" + rechargeStart
                + ";rechargeAfterTick=" + rechargeAfterTick
                + ";terminal=" + battleResult.Outcome
                + ";terminalTick=" + battleResult.FinalTick
                + ";battleHash=" + battleResult.ResultHash
                + ";battleLedgerHash=" + CoreApi.ComputeLedgerHash(battleLedger)
                + ";resultId=" + result.ResultId.Value
                + ";beforeCampaignHash=" + before
                + ";settledCampaignHash=" + settledHash
                + ";receiptHash=" + first.Receipt.ReceiptHash
                + ";duplicateReceiptHash=" + ((SettlementReceipt)duplicate).ReceiptHash
                + ";returnTick=" + returned.Tick.Value
                + ";returnStage=" + returned.Stage
                + ";returnHash=" + returnHash
                + ";checks=battle-id,selected-card,card-effect,recharge-tick,terminal,settlement,duplicate-zero-mutation,return");
        }

        [Test]
        public void CampaignRoundTrip_UsesNewBattleResult()
        {
            var campaign = CampaignWithPendingBattle();
            var battle = BattleSim.Open(BattleSetup.FromContext(campaign.PendingBattle));
            KeepAllUnitsAliveAndIdle(battle);
            battle.Tick = BattleRules.MaxTicks - 1;
            BattleSim.Step(battle, new Ledger());
            Assert.AreEqual(BattleOutcomeKind.Draw, battle.Outcome, "fixture must reach a real terminal outcome");
            var result = BattleSim.Result(battle).ToEncounterResult();
            var applied = SettlementApi.Apply(campaign, new Ledger(), new SettlementBook(), result);
            Assert.IsInstanceOf<SettlementSuccess>(applied, applied is SettlementRejection rejected ? rejected.Reason.ToString() : applied?.GetType().Name);
            var settled = (SettlementSuccess)applied;
            Assert.IsTrue(settled.State.SettlementApplied);
            Assert.AreNotEqual(CampaignStage.Resolution, settled.State.Stage);
        }

        [Test, Category("ApprovedUnityCasualties")]
        public void PublicCampaignBattleCombatResultSettlement_PreservesAggregateSurvivorsAndLogicalUnitHp()
        {
            var campaign = CampaignWithPendingBattle(out var campaignLedger);
            var setup = BattleSetup.FromContext(campaign.PendingBattle);
            var battle = BattleSim.Open(setup);
            var battleLedger = new Ledger();
            Deploy(battle, battleLedger);

            var expected = new Dictionary<string, int>(System.StringComparer.Ordinal);
            string survivorMismatch = null;
            for (var i = 0; i < battle.Units.Length; i++)
            {
                var unit = battle.Units[i];
                var count = ExpectedSurvivors(unit.Hp, unit.MaxHp);
                expected[unit.Id.ToString()] = count;
                if (survivorMismatch == null && unit.SurvivorCount != count)
                    survivorMismatch = unit.Id + " opened with " + unit.SurvivorCount + " survivors; expected " + count;
            }

            var combatDamageObserved = false;
            while (battle.Outcome == BattleOutcomeKind.Ongoing && battle.Tick < BattleRules.MaxTicks)
            {
                var hpBefore = new Dictionary<string, int>(System.StringComparer.Ordinal);
                for (var i = 0; i < battle.Units.Length; i++)
                    hpBefore[battle.Units[i].Id.ToString()] = battle.Units[i].Hp;

                BattleSim.Step(battle, battleLedger);

                for (var i = 0; i < battle.Units.Length; i++)
                {
                    var unit = battle.Units[i];
                    var id = unit.Id.ToString();
                    var hpDerived = ExpectedSurvivors(unit.Hp, unit.MaxHp);
                    int previous;
                    var expectedNow = expected.TryGetValue(id, out previous)
                        ? System.Math.Min(previous, hpDerived)
                        : hpDerived;
                    expected[id] = expectedNow;

                    int oldHp;
                    if (hpBefore.TryGetValue(id, out oldHp) && unit.Hp < oldHp)
                        combatDamageObserved = true;
                    if (survivorMismatch == null && unit.SurvivorCount != expectedNow)
                        survivorMismatch = id + " had " + unit.SurvivorCount
                            + " survivors at tick " + battle.Tick + "; expected " + expectedNow;
                }
            }

            Assert.AreNotEqual(BattleOutcomeKind.Ongoing, battle.Outcome,
                "the public combat flow must reach a real terminal result");
            Assert.IsTrue(combatDamageObserved,
                "the proof must include damage produced by actual combat Steps");

            var persistent = System.Array.Find(
                battle.Units,
                unit => unit.Id.ToString() == RealtimeBattleApi.PersistentAllyId);
            var battleResult = BattleSim.Result(battle);
            var result = SettlementApi.FromRealtimeResult(battleResult);
            Assert.IsTrue(result.UnitHp.TryGet(RealtimeBattleApi.PersistentAllyId, out var resultHp));
            Assert.AreEqual(persistent.Hp, resultHp);
            Assert.IsFalse(result.UnitHp.TryGet("ally-0-soldier-0", out _),
                "aggregate display members must not leak new settlement identities");

            var book = new SettlementBook();
            var first = SettlementApi.Apply(campaign, campaignLedger, book, result);
            Assert.IsInstanceOf<SettlementSuccess>(
                first,
                first is SettlementRejection rejected ? rejected.Reason.ToString() : first?.GetType().Name);
            var success = (SettlementSuccess)first;
            Assert.IsTrue(success.State.PartyHp.TryGet(RealtimeBattleApi.PersistentAllyId, out var settledHp));
            Assert.AreEqual(resultHp, settledHp);

            var duplicate = SettlementApi.Apply(success.State, campaignLedger, book, result);
            Assert.IsInstanceOf<SettlementReceipt>(duplicate);
            Assert.AreEqual(success.Receipt.ReceiptHash, ((SettlementReceipt)duplicate).ReceiptHash);
            Assert.IsNull(survivorMismatch, survivorMismatch);
        }
    }
}
