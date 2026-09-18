using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Battle;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class OwnerCardTargetingTests
    {
        sealed class NoSceneLoader : IContentSceneLoader
        {
            public Task<IContentSceneLease> LoadAsync(ContentScreenId screen, CancellationToken cancellationToken)
                => throw new InvalidOperationException("This test must not load a scene.");
        }

        [TestCase("OnMobilityRegroup", "mobility-regroup")]
        [TestCase("OnCardGeneralUse", "encourage-morale")]
        public void Controller_BeginCard_DoesNotSubmitSouthOrSelfTargetShortcut(string handler, string cardId)
        {
            var hostObject = new GameObject("targeting-test-host");
            var driver = new BattleSessionDriver(() => 0);
            var controller = new PocCoreLoopController(new GameplayPresenter(),
                hostObject.AddComponent<GameplayUiHost>(),
                new ApplicationFlowCoordinator(new NoSceneLoader()), driver);
            try
            {
                var context = Context();
                typeof(PocCoreLoopController).GetMethod("OpenBattle", BindingFlags.Instance | BindingFlags.NonPublic)
                    .Invoke(controller, new object[] { context });
                var state = controller.Battle;
                Assert.IsNull(BattleSim.Submit(state, controller.BattleLedger, new BattleTickCommand
                {
                    Id = new CommandId("deploy"), Kind = BattleTickCommandKind.Deploy,
                    At = new Tick(state.Tick), Formation = BattleSetup.FromContext(context).PlayerFormation,
                }));
                var before = state.Fingerprint();
                var events = controller.BattleLedger.Events.Count;

                typeof(PocCoreLoopController).GetMethod(handler, BindingFlags.Instance | BindingFlags.NonPublic)
                    .Invoke(controller, null);

                Assert.AreEqual(0, Array.Find(state.Cards, card => card.Id == cardId
                    && card.OwnerUnitId.Equals(state.PlayerCommanderId)).RechargeTicksLeft,
                    "BeginCard must wait for explicit ally/direction/Confirm, not submit the South/self-target shortcut.");
                Assert.AreEqual(before, state.Fingerprint());
                Assert.AreEqual(events, controller.BattleLedger.Events.Count);
            }
            finally
            {
                controller.Dispose();
                UnityEngine.Object.DestroyImmediate(hostObject);
            }
        }

        sealed class Session
        {
            public readonly BattleSimState State;
            public readonly Ledger Ledger = new Ledger();
            public readonly BattleSessionDriver Driver = new BattleSessionDriver(() => 0);
            public readonly System.Collections.Generic.List<BattleTickCommand> Submitted = new System.Collections.Generic.List<BattleTickCommand>();
            public readonly OwnerCardTargetingMachine Machine;
            int sequence;

            public Session(bool strongholds = true)
            {
                var setup = BattleSetup.FromContext(Context());
                State = BattleSim.Open(setup);
                Assert.IsNull(BattleSim.Submit(State, Ledger, new BattleTickCommand
                {
                    Id = new CommandId("fixture-deploy"), Kind = BattleTickCommandKind.Deploy,
                    Formation = setup.PlayerFormation,
                    StrongholdCardIds = strongholds ? new[] { "supply-heal", "passage-retreat" } : Array.Empty<string>(),
                }));
                for (int i = 0; i < State.Units.Length; i++)
                {
                    State.Units[i].Cell = new GridCoord(i, 7);
                    State.Units[i].MoveTicksLeft = 10000;
                    State.Units[i].CooldownTicksLeft = 10000;
                }
                State.Units[0].Cell = new GridCoord(3, 3);
                State.Units[1].Cell = new GridCoord(4, 3);
                Driver.Attach(State, Ledger);
                Driver.CommandRejected += rejection => Assert.Fail("Unexpected submit rejection: " + ((BattleRejection)rejection).Reason);
                Machine = new OwnerCardTargetingMachine(State, command =>
                {
                    Submitted.Add(command);
                    Driver.Enqueue(command);
                    Driver.SubmitCurrentCommands();
                }, () => ++sequence);
                Assert.IsTrue(Machine.SelectOwner(State.Units[0].Id));
            }
        }

        [Test]
        public void Mobility_IllegalTargetAndCancel_NeverEnqueueOrChangeCooldown()
        {
            var s = new Session();
            var before = s.State.Fingerprint();
            Assert.IsTrue(s.Machine.BeginCard("mobility-regroup"));
            Assert.AreEqual(CardTargetingStage.ChoosingAlly, s.Machine.Stage);
            Assert.IsFalse(s.Machine.SelectTarget(s.State.Units[6].Id));
            Assert.AreEqual(BattleRejectReason.CardInvalidTarget, ((BattleRejection)s.Machine.LastRejection).Reason);
            Assert.IsFalse(s.Machine.Confirm());
            s.Machine.Cancel();
            Assert.IsEmpty(s.Submitted);
            Assert.AreEqual(before, s.State.Fingerprint());
            Assert.AreEqual(0, s.Machine.RechargeTicksLeft("mobility-regroup"));
        }

        [TestCase(CardinalDirection.North)]
        [TestCase(CardinalDirection.East)]
        [TestCase(CardinalDirection.West)]
        [TestCase(CardinalDirection.South)]
        public void Mobility_ExplicitDirectionAndConfirm_PlayExactlyOnceAtCurrentTick(CardinalDirection direction)
        {
            var s = new Session();
            s.State.Units[0].Cell = new GridCoord(3, 4);
            var before = s.State.Fingerprint();
            var events = s.Ledger.Events.Count;
            Assert.IsTrue(s.Machine.BeginCard("mobility-regroup"));
            Assert.IsTrue(s.Machine.SelectTarget(s.State.Units[1].Id));
            Assert.AreEqual(CardTargetingStage.ChoosingDirection, s.Machine.Stage);
            Assert.IsNull(s.Machine.Facing);
            Assert.AreEqual(4, s.Machine.DirectionChoices.Count);
            Assert.IsFalse(s.Machine.Confirm(), "Direction is required, not default North or hardcoded South.");
            Assert.IsTrue(s.Machine.PreviewDirection(direction));
            Assert.IsEmpty(s.Submitted);
            Assert.AreEqual(before, s.State.Fingerprint());
            Assert.AreEqual(events, s.Ledger.Events.Count);
            BattleSim.Step(s.State, s.Ledger);
            int currentTick = s.State.Tick;
            var cell = s.State.Units[1].Cell;
            Assert.IsTrue(s.Machine.Confirm());
            Assert.AreEqual(1, s.Submitted.Count);
            var command = s.Submitted[0];
            Assert.AreEqual(currentTick, command.At.Value);
            Assert.AreEqual(BattleTickCommandKind.PlayCard, command.Kind);
            Assert.AreEqual(s.State.Units[0].Id, command.OwnerUnitId);
            Assert.AreEqual(s.State.Units[1].Id, command.TargetUnitId);
            Assert.AreEqual(direction, command.Facing);
            Assert.AreEqual(cell.Step(direction), s.State.Units[1].Cell);
            Assert.AreEqual(600, s.Machine.RechargeTicksLeft("mobility-regroup"));
            Assert.IsFalse(s.Machine.Confirm());
            Assert.AreEqual(1, s.Submitted.Count);
        }

        [TestCase("encourage-morale")]
        [TestCase("guard-shieldwall")]
        [TestCase("pincer-focus")]
        public void NonDirectionalCharacterCards_ValidAlly_GoStraightToConfirm(string cardId)
        {
            var s = new Session();
            var facing = s.State.Units[1].Facing;
            Assert.IsTrue(s.Machine.BeginCard(cardId));
            Assert.IsTrue(s.Machine.SelectTarget(s.State.Units[1].Id));
            Assert.AreEqual(CardTargetingStage.Confirm, s.Machine.Stage);
            Assert.IsEmpty(s.Machine.DirectionChoices);
            Assert.IsNull(s.Machine.Facing);
            Assert.IsFalse(s.Machine.PreviewDirection(CardinalDirection.South));
            Assert.IsTrue(s.Machine.Confirm());
            Assert.AreEqual(1, s.Submitted.Count);
            Assert.AreEqual(default(CardinalDirection), s.Submitted[0].Facing);
            Assert.AreEqual(facing, s.State.Units[1].Facing);
            Assert.AreEqual(CardCatalog.Find(cardId).RechargeTicks, s.Machine.RechargeTicksLeft(cardId));
        }

        [Test]
        public void OwnerSwitch_CancelsAndRestoresPerOwnerRecharge_WithoutChangingCommander()
        {
            var s = new Session();
            var commander = s.State.PlayerCommanderId;
            s.Machine.BeginCard("encourage-morale");
            s.Machine.SelectTarget(s.State.Units[1].Id);
            Assert.IsTrue(s.Machine.Confirm());
            Assert.AreEqual(600, s.Machine.RechargeTicksLeft("encourage-morale"));
            s.Machine.BeginCard("mobility-regroup");
            s.Machine.SelectTarget(s.State.Units[1].Id);
            var before = s.State.Fingerprint();
            Assert.IsTrue(s.Machine.SelectOwner(s.State.Units[1].Id));
            Assert.AreEqual(CardTargetingStage.Idle, s.Machine.Stage);
            Assert.IsNull(s.Machine.CardId);
            Assert.IsNull(s.Machine.Facing);
            Assert.AreEqual(default(UnitId), s.Machine.SelectedTarget);
            Assert.AreEqual(0, s.Machine.RechargeTicksLeft("encourage-morale"));
            Assert.IsTrue(s.Machine.SelectOwner(s.State.Units[0].Id));
            Assert.AreEqual(600, s.Machine.RechargeTicksLeft("encourage-morale"));
            Assert.AreEqual(commander, s.State.PlayerCommanderId);
            Assert.AreEqual(before, s.State.Fingerprint());
        }

        [Test]
        public void Pause_DoesNotBlockConfirm()
        {
            var s = new Session();
            s.Driver.Paused = true;
            s.Machine.BeginCard("encourage-morale");
            s.Machine.SelectTarget(s.State.Units[1].Id);
            Assert.IsTrue(s.Machine.Confirm());
            Assert.AreEqual(1, s.Submitted.Count);
            Assert.AreEqual(0, s.State.Tick);
            Assert.IsTrue(s.Driver.Paused);
            Assert.AreEqual(600, s.Machine.RechargeTicksLeft("encourage-morale"));
        }

        [TestCase("supply-heal")]
        [TestCase("passage-retreat")]
        public void Stronghold_RequiresStrongholdContextAndCorePreview_NeverUsesSelectedCharacterOwner(string cardId)
        {
            var s = new Session();
            s.Machine.SelectOwner(s.State.Units[1].Id);
            Assert.IsFalse(s.Machine.BeginCard(cardId));
            Assert.AreEqual(CardTargetingStage.Idle, s.Machine.Stage);
            Assert.IsTrue(s.Machine.BeginCard(cardId, CardTargetingContext.Stronghold));
            var before = s.State.Fingerprint();
            Assert.IsTrue(s.Machine.SelectTarget(s.State.Units[1].Id));
            Assert.AreEqual(CardTargetingStage.Confirm, s.Machine.Stage);
            Assert.IsEmpty(s.Machine.DirectionChoices);
            Assert.IsEmpty(s.Submitted);
            Assert.AreEqual(before, s.State.Fingerprint());
            Assert.IsTrue(s.Machine.Confirm());
            Assert.AreEqual(default(UnitId), s.Submitted[0].OwnerUnitId);
            Assert.AreEqual(CardCatalog.Find(cardId).RechargeTicks, s.Machine.RechargeTicksLeft(cardId));

            var unselected = new Session(false);
            Assert.IsTrue(unselected.Machine.BeginCard(cardId, CardTargetingContext.Stronghold));
            Assert.IsFalse(unselected.Machine.SelectTarget(unselected.State.Units[1].Id));
            Assert.AreEqual(BattleRejectReason.CardUnknown, ((BattleRejection)unselected.Machine.LastRejection).Reason);
            Assert.IsFalse(unselected.Machine.Confirm());
            Assert.IsEmpty(unselected.Submitted);
        }

        [Test]
        public void Confirm_RevalidatesDestinationAndOwnerAfterPreview()
        {
            var s = new Session();
            s.Machine.BeginCard("mobility-regroup");
            s.Machine.SelectTarget(s.State.Units[1].Id);
            Assert.IsTrue(s.Machine.PreviewDirection(CardinalDirection.East));
            s.State.Units[2].Cell = s.State.Units[1].Cell.Step(CardinalDirection.East);
            var before = s.State.Fingerprint();
            Assert.IsFalse(s.Machine.Confirm());
            Assert.AreEqual(BattleRejectReason.CardDestinationBlocked, ((BattleRejection)s.Machine.LastRejection).Reason);
            Assert.AreEqual(before, s.State.Fingerprint());
            Assert.IsEmpty(s.Submitted);
            Assert.IsFalse(s.Machine.PreviewDirection(CardinalDirection.East));
            Assert.IsNull(s.Machine.Facing);
            Assert.AreEqual(CardTargetingStage.ChoosingDirection, s.Machine.Stage);
            Assert.IsTrue(s.Machine.PreviewDirection(CardinalDirection.North));
            s.State.Units[0].Hp = 0;
            Assert.IsFalse(s.Machine.Confirm());
            Assert.AreEqual(BattleRejectReason.CardInvalidOwner, ((BattleRejection)s.Machine.LastRejection).Reason);
            Assert.IsEmpty(s.Submitted);
        }

        [Test]
        public void InvalidOwnerTargetRadiusAndDirection_AreRejectedWithoutSubmit()
        {
            var s = new Session();
            var before = s.State.Fingerprint();
            Assert.IsFalse(s.Machine.SelectOwner(s.State.Units[6].Id));
            Assert.IsFalse(s.Machine.BeginCard("unknown"));
            Assert.IsFalse(s.Machine.BeginCard("encourage-morale", CardTargetingContext.Stronghold));
            Assert.IsTrue(s.Machine.BeginCard("mobility-regroup"));
            Assert.IsFalse(s.Machine.SelectTarget(s.State.Units[5].Id));
            Assert.AreEqual(BattleRejectReason.CardOutOfRadius, ((BattleRejection)s.Machine.LastRejection).Reason);
            Assert.IsTrue(s.Machine.SelectTarget(s.State.Units[1].Id));
            Assert.IsFalse(s.Machine.PreviewDirection((CardinalDirection)99));
            s.Machine.Cancel();
            Assert.IsEmpty(s.Submitted);
            Assert.AreEqual(before, s.State.Fingerprint());
        }

        static BattleContext Context() => BattleContext.Create(
            "targeting", default(StationId), 271828, new Tick(0), 0, 0,
            BattleRules.RulesVersion, "owner-card-targeting", UnitHpSnapshot.DefaultParty());
    }
}
