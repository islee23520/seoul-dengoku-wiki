using System;
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
using UnityEngine.SceneManagement;
using VContainer;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// D1 PlayMode consumer: the real Foundation composition root must resolve
    /// BattleSessionDriver through VContainer, the player loop must pump it, the
    /// pause flag must freeze the live pump, and a live driver-driven run must
    /// replay identically to a direct BattleSim.Replay of the same command set.
    /// </summary>
    public sealed class BattleSessionDriverPlayModeTests
    {
        [Test]
        public void UsesUnityFixedUpdateDelta()
        {
            var driver = new BattleSessionDriver();
            Assert.That(driver, Is.Not.InstanceOf<VContainer.Unity.ITickable>());
            Assert.That(typeof(BattleSessionDriverHost).GetMethod("FixedUpdate", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic), Is.Not.Null);
        }

        [Test]
        public async Task ProductionCoreLoop_DriverOwnsLiveBattleLifecycle_EndToEnd()
        {
            await UnloadContentScenesAsync();

            Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
            await AwaitAsyncOperation(SceneManager.LoadSceneAsync(FoundationScenes.Bootstrap, LoadSceneMode.Single));
            await mainTitleLoaded;

            AppLifetimeScope appScope = UnityEngine.Object.FindAnyObjectByType<AppLifetimeScope>();
            Assert.That(appScope, Is.Not.Null, "AppLifetimeScope missing on Bootstrap");
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            Task<TransitionOutcome> startup = coordinator.CurrentTransition;
            Assert.That(startup, Is.Not.Null, "startup transition missing");
            TransitionOutcome startupOutcome = await AwaitTaskResult(startup, TimeSpan.FromSeconds(15), "startup commit");
            Assert.That(startupOutcome.Status, Is.EqualTo(TransitionStatus.Completed));

            Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
            TransitionOutcome foundationOutcome = await coordinator.OpenFoundationAsync(CancellationToken.None);
            Assert.That(foundationOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            await foundationLoaded;

            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            Assert.That(scope, Is.Not.Null, "FoundationLifetimeScope missing after OpenFoundation");
            Assert.That(scope.Container, Is.Not.Null);

            BattleSessionDriver driver = scope.Container.Resolve<BattleSessionDriver>();
            Assert.That(driver, Is.Not.Null, "Foundation scope must expose BattleSessionDriver");
            Assert.That(driver, Is.Not.InstanceOf<VContainer.Unity.ITickable>(), "driver must be pumped by the Unity FixedUpdate host");
            Assert.That(driver.Paused, Is.False, "driver must start unpaused");

            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null, "production GameplayUiHost missing");
            await AwaitTask(host.CoreLoopReady, TimeSpan.FromSeconds(10), "production core-loop attach");
            IPocCoreLoopSession session = host.CoreLoop;
            Assert.That(session, Is.Not.Null);

            await TriggerAndAwait(session, host.Presenter.TriggerDepartForTest,
                s => s.Campaign.Stage == CampaignStage.ExpeditionTravel, "depart");
            await TriggerAndAwait(session, () => host.Presenter.TriggerTravelForTest(StationId.Sindorim),
                s => s.Campaign.Node.Equals(StationId.Sindorim), "travel");
            await TriggerAndAwait(session, host.Presenter.TriggerFaceEncounterForTest,
                s => s.Campaign.Stage == CampaignStage.Encounter, "face encounter");
            await TriggerAndAwait(session, host.Presenter.TriggerEnterResolutionForTest,
                s => s.Campaign.Stage == CampaignStage.Resolution, "enter resolution");
            await TriggerAndAwait(session, host.Presenter.TriggerCombatForTest,
                s => s.Battle != null && s.BattlePaused && !s.Battle.Deployed, "open predeployment battle");
            await TriggerAndAwait(session, host.Presenter.TriggerFormationSwapFrontForTest,
                s => s.LastClickedAction == UiElementNames.FormationSwapFront && !s.Battle.Deployed, "choose front-slot swap");
            await TriggerAndAwait(session, host.Presenter.TriggerEditFormationForTest,
                s => s.Battle.Deployed, "commit edited formation");

            Assert.That(driver.State, Is.SameAs(session.Battle),
                "production controller must attach the actual campaign battle to the scoped driver");
            Assert.That(driver.Ledger, Is.SameAs(session.BattleLedger));
            BattleSetup setup = BattleSetup.FromContext(session.Battle.Context);
            var schedule = new System.Collections.Generic.List<BattleTickCommand>
            {
                new BattleTickCommand
                {
                    Id = new CommandId("poc-deploy-edited-7"), Seq = 7, At = new Tick(0),
                    Kind = BattleTickCommandKind.Deploy, Formation = EditedFormation(setup.PlayerFormation),
                },
            };

            Assert.That(session.BattlePaused, Is.True, "predeployment pause must remain after Deploy");
            int pausedTick = session.Battle.Tick;
            string pausedHash = session.BattleHash;
            long pausedSteps = driver.TotalSteps;
            int pausedCooldown = Array.Find(session.Battle.Cards,
                card => card.Id == "mobility-regroup").RechargeTicksLeft;
            string[] pausedLedger = LedgerSignatures(session.BattleLedger);

            await AwaitProcessedFrames(driver, 5, "pause-only player-loop frames");
            Assert.That(driver.TotalSteps, Is.EqualTo(pausedSteps), "pause alone must freeze production steps");
            Assert.That(session.Battle.Tick, Is.EqualTo(pausedTick), "pause alone must freeze Core ticks");
            Assert.That(session.BattleHash, Is.EqualTo(pausedHash), "pause alone must preserve the Core hash");
            Assert.That(Array.Find(session.Battle.Cards,
                card => card.Id == "mobility-regroup").RechargeTicksLeft, Is.EqualTo(pausedCooldown),
                "pause alone must freeze card cooldowns");
            Assert.That(LedgerSignatures(session.BattleLedger), Is.EqualTo(pausedLedger),
                "pause alone must not append battle ledger events");

            UnitState commander = Array.Find(session.Battle.Units,
                unit => unit.Id.Equals(session.Battle.PlayerCommanderId));
            Assert.That(commander, Is.Not.Null);
            GridCoord beforeCard = commander.Cell;
            int commandTick = session.Battle.Tick;
            await TriggerAndAwait(session, host.Presenter.TriggerMobilityRegroupForTest,
                s => commander.Cell.Equals(beforeCard.Step(CardinalDirection.South)),
                "accept card while paused");
            schedule.Add(new BattleTickCommand
            {
                Id = new CommandId("poc-mobility-regroup-8"), Seq = 8, At = new Tick(commandTick),
                Kind = BattleTickCommandKind.PlayCard, CardId = "mobility-regroup",
                OwnerUnitId = commander.Id, TargetUnitId = commander.Id, Facing = CardinalDirection.South,
            });
            Assert.That(session.Battle.Tick, Is.EqualTo(pausedTick), "paused command must not advance ticks");
            Assert.That(session.BattleHash, Is.Not.EqualTo(pausedHash),
                "a valid accepted card may mutate Core state while paused");
            Assert.That(LedgerSignatures(session.BattleLedger), Is.Not.EqualTo(pausedLedger),
                "an accepted card must retain its command ledger event while paused");

            string acceptedCardHash = session.BattleHash;
            string[] acceptedCardLedger = LedgerSignatures(session.BattleLedger);
            int acceptedCardCooldown = Array.Find(session.Battle.Cards,
                card => card.Id == "mobility-regroup").RechargeTicksLeft;

            await AwaitProcessedFrames(driver, 5, "post-command paused player-loop frames");
            Assert.That(driver.TotalSteps, Is.EqualTo(pausedSteps), "pause must freeze production ticks");
            Assert.That(session.Battle.Tick, Is.EqualTo(pausedTick));
            Assert.That(session.BattleHash, Is.EqualTo(acceptedCardHash),
                "after command acceptance, continued pause must preserve the resulting Core state");
            Assert.That(Array.Find(session.Battle.Cards,
                card => card.Id == "mobility-regroup").RechargeTicksLeft, Is.EqualTo(acceptedCardCooldown),
                "continued pause must freeze the accepted card cooldown");
            Assert.That(LedgerSignatures(session.BattleLedger), Is.EqualTo(acceptedCardLedger),
                "continued pause must not append ledger events after command acceptance");

            Task<int> liveFrame = WaitForSteppedFrame(driver, TimeSpan.FromSeconds(8));
            await TriggerAndAwait(session, host.Presenter.TriggerBattlePlayPauseForTest,
                s => !s.BattlePaused, "resume live battle");
            int liveSteps = await liveFrame;
            Assert.That(liveSteps, Is.InRange(1, BattleSessionDriver.MaxStepsPerFrame),
                "production player-loop consumption must stay within the max-4 frame budget");

            await WaitUntil(session,
                s => s.Battle != null && s.Battle.Outcome != BattleOutcomeKind.Ongoing,
                TimeSpan.FromSeconds(60), "terminal production battle");
            BattleSimState terminal = session.Battle;
            Ledger terminalLedger = session.BattleLedger;
            Assert.That(driver.State, Is.Null, "terminal battle must detach from the scoped driver");
            Assert.That(driver.Ledger, Is.Null);
            long terminalSteps = driver.TotalSteps;

            var (replayState, replayLedger) = BattleSim.Replay(setup, schedule, terminal.Tick);
            Assert.That(terminal.Fingerprint(), Is.EqualTo(replayState.Fingerprint()),
                "production battle must replay deterministically from its real command schedule");
            Assert.That(LedgerSignatures(terminalLedger), Is.EqualTo(LedgerSignatures(replayLedger)));

            await TriggerAndAwait(session, host.Presenter.TriggerSettleForTest,
                s => s.Campaign.SettlementApplied && s.Battle == null, "settle terminal battle");
            await TriggerAndAwait(session, host.Presenter.TriggerReturnForTest,
                s => s.Campaign.Stage == CampaignStage.BaseReady, "return to base");
            await AwaitProcessedFrames(driver, 3, "post-return player-loop frames");
            Assert.That(driver.TotalSteps, Is.EqualTo(terminalSteps),
                "terminal/return must not revive the old battle session");

            await UnloadContentScenesAsync();
        }

        static FormationSlot[] EditedFormation(FormationSlot[] source)
        {
            var edited = new FormationSlot[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                FormationSlot slot = source[i];
                FormationSlot position = source.Length > 1 && i < 2 ? source[1 - i] : slot;
                edited[i] = new FormationSlot { Unit = slot.Unit, Row = position.Row, Column = position.Column, Facing = slot.Facing };
            }
            return edited;
        }

        static async Task TriggerAndAwait(
            IPocCoreLoopSession session,
            Action trigger,
            Func<IPocCoreLoopSession, bool> predicate,
            string label)
        {
            var changed = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnChanged() { session.StateChanged -= OnChanged; changed.TrySetResult(true); }
            session.StateChanged += OnChanged;
            trigger();
            await AwaitTask(changed.Task, TimeSpan.FromSeconds(8), label);
            Assert.That(predicate(session), Is.True, "production state predicate failed after " + label);
        }

        static async Task WaitUntil(
            IPocCoreLoopSession session,
            Func<IPocCoreLoopSession, bool> predicate,
            TimeSpan timeout,
            string label)
        {
            if (predicate(session)) return;
            var changed = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnChanged()
            {
                if (!predicate(session)) return;
                session.StateChanged -= OnChanged;
                changed.TrySetResult(true);
            }
            session.StateChanged += OnChanged;
            try { await AwaitTask(changed.Task, timeout, label); }
            finally { session.StateChanged -= OnChanged; }
        }

        static async Task AwaitProcessedFrames(BattleSessionDriver driver, int count, string label)
        {
            var processed = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            var remaining = count;
            void OnFrame(int _)
            {
                if (--remaining > 0) return;
                driver.FrameProcessed -= OnFrame;
                processed.TrySetResult(true);
            }
            driver.FrameProcessed += OnFrame;
            try { await AwaitTask(processed.Task, TimeSpan.FromSeconds(8), label); }
            finally { driver.FrameProcessed -= OnFrame; }
        }

        static async Task<int> WaitForSteppedFrame(BattleSessionDriver driver, TimeSpan timeout)
        {
            var processed = new TaskCompletionSource<int>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnFrame(int steps)
            {
                if (steps <= 0) return;
                driver.FrameProcessed -= OnFrame;
                processed.TrySetResult(steps);
            }
            driver.FrameProcessed += OnFrame;
            try { return await AwaitTaskResult(processed.Task, timeout, "stepped production frame"); }
            finally { driver.FrameProcessed -= OnFrame; }
        }

        static string[] LedgerSignatures(Ledger ledger)
        {
            var signatures = new string[ledger.Events.Count];
            for (var i = 0; i < ledger.Events.Count; i++)
                signatures[i] = ledger.Events[i].Id.Value + "@" + ledger.Events[i].At.Value + ":" + ledger.Events[i].SummaryHash;
            return signatures;
        }

        static async Task UnloadContentScenesAsync()
        {
            string[] paths = { FoundationScenes.MainTitle, FoundationScenes.Foundation };
            foreach (string path in paths)
            {
                for (int pass = 0; pass < 3; pass++)
                {
                    Scene stale = SceneManager.GetSceneByPath(path);
                    if (!stale.isLoaded)
                    {
                        break;
                    }

                    var unloaded = new TaskCompletionSource<bool>(
                        TaskCreationOptions.RunContinuationsAsynchronously);
                    void OnUnloaded(Scene s)
                    {
                        if (s.path == path)
                        {
                            unloaded.TrySetResult(true);
                        }
                    }

                    SceneManager.sceneUnloaded += OnUnloaded;
                    try
                    {
                        AsyncOperation op = SceneManager.UnloadSceneAsync(stale);
                        if (op == null)
                        {
                            break;
                        }

                        await AwaitTask(unloaded.Task, TimeSpan.FromSeconds(10), "unload " + path);
                    }
                    finally
                    {
                        SceneManager.sceneUnloaded -= OnUnloaded;
                    }
                }
            }
        }

        static async Task WaitForSceneAsync(string path, TimeSpan timeout)
        {
            var loaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnLoaded(Scene scene, LoadSceneMode _)
            {
                if (scene.path == path)
                {
                    loaded.TrySetResult(true);
                }
            }

            SceneManager.sceneLoaded += OnLoaded;
            try
            {
                if (SceneManager.GetSceneByPath(path).isLoaded)
                {
                    loaded.TrySetResult(true);
                }

                Task completed = await Task.WhenAny(loaded.Task, Task.Delay(timeout));
                Assert.That(completed, Is.SameAs(loaded.Task), "Timed out waiting for scene: " + path);
                await loaded.Task;
            }
            finally
            {
                SceneManager.sceneLoaded -= OnLoaded;
            }
        }

        static Task AwaitAsyncOperation(AsyncOperation operation)
        {
            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            operation.completed += _ => tcs.TrySetResult(true);
            return tcs.Task;
        }

        static async Task<T> AwaitTaskResult<T>(Task<T> task, TimeSpan timeout, string label)
        {
            Assert.That(task, Is.Not.Null, label + " task missing");
            Task winner = await Task.WhenAny(task, Task.Delay(timeout));
            Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
            return await task;
        }

        static async Task AwaitTask(Task task, TimeSpan timeout, string label)
        {
            Task winner = await Task.WhenAny(task, Task.Delay(timeout));
            Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
            await task;
        }
    }
}
