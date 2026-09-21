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
using UnityEngine.TestTools;
using VContainer;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// PlayMode consumer of the Foundation battle driver contract: the composition
    /// root must resolve <see cref="BattleSessionDriver"/>, the Unity FixedUpdate
    /// host must pump it, the driver-owned pause must freeze the live pump, reset
    /// must restore predeployment, and a terminal continuous battle must detach and
    /// settle back to base. All actions run through production uGUI
    /// buttons; no presenter test seams are used.
    /// </summary>
    public sealed class BattleSessionDriverPlayModeTests
    {
        [Test]
        public void UsesUnityFixedUpdateDelta()
        {
            var driver = new BattleSessionDriver();
            Assert.That(driver, Is.Not.InstanceOf<VContainer.Unity.ITickable>(),
                "driver must be pumped by the Unity FixedUpdate host, not by a container tick");
            Assert.That(
                typeof(BattleSessionDriverHost).GetMethod(
                    "FixedUpdate",
                    System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic),
                Is.Not.Null,
                "host must own the Unity FixedUpdate pump");
            Assert.That(
                typeof(BattleSessionDriver).GetMethod(
                    "FixedUpdate",
                    System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public),
                Is.Not.Null,
                "driver must expose the fixed-step pump the host calls");
        }

        [Test]
        public async Task FoundationScope_ResolvesDriver_DetachedAndUnpaused()
        {
            await OpenFoundationAsync();

            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            Assert.That(scope, Is.Not.Null, "FoundationLifetimeScope missing after OpenFoundation");

            BattleSessionDriver driver = scope.Container.Resolve<BattleSessionDriver>();
            Assert.That(driver, Is.Not.Null, "Foundation scope must expose BattleSessionDriver");
            Assert.That(driver, Is.Not.InstanceOf<VContainer.Unity.ITickable>());
            Assert.That(driver.State, Is.Null, "driver must start detached before any battle");
            Assert.That(driver.Ledger, Is.Null, "driver must start without a battle ledger");
            Assert.That(driver.Paused, Is.False, "driver must start unpaused");
            Assert.That(driver.TotalSteps, Is.EqualTo(0), "driver must start with no production steps");

            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null, "production GameplayUiHost missing");
            await AwaitTask(host.Ready, TimeSpan.FromSeconds(10), "gameplay host ready");

            await UnloadContentScenesAsync();
        }

        [UnityTest]
        public System.Collections.IEnumerator ProductionCoreLoop_DriverOwnsLiveBattleLifecycle() =>
            ProductionCoreLoop_DriverOwnsLiveBattleLifecycleAsync().AsCoroutine();

        async Task ProductionCoreLoop_DriverOwnsLiveBattleLifecycleAsync()
        {
            await OpenFoundationAsync();

            AppLifetimeScope appScope = UnityEngine.Object.FindAnyObjectByType<AppLifetimeScope>();
            Assert.That(appScope, Is.Not.Null, "AppLifetimeScope missing on Bootstrap");
            ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
            FoundationLifetimeScope scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            Assert.That(scope, Is.Not.Null, "FoundationLifetimeScope missing after OpenFoundation");

            BattleSessionDriver driver = scope.Container.Resolve<BattleSessionDriver>();
            Assert.That(driver, Is.Not.Null);
            Assert.That(driver.State, Is.Null, "driver must be detached before the first battle");

            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null, "production GameplayUiHost missing");
            await AwaitTask(host.Ready, TimeSpan.FromSeconds(10), "gameplay host ready");
            await AwaitTask(host.CoreLoopReady, TimeSpan.FromSeconds(10), "production core-loop attach");
            IPocCoreLoopSession session = host.CoreLoop;
            Assert.That(session, Is.Not.Null, "controller must attach the live session to the host");

            // Campaign: depart, travel, face the encounter, enter resolution.
            await ClickAndAwait(host, UiElementNames.ActionDepart,
                s => s.Campaign.Stage == CampaignStage.ExpeditionTravel, "depart");
            await ClickAndAwait(host, UiElementNames.StationSindorim,
                s => s.Campaign.Node.Equals(StationId.Sindorim), "travel");
            await ClickAndAwait(host, UiElementNames.ActionFaceEncounter,
                s => s.Campaign.Stage == CampaignStage.Encounter, "face encounter");
            await ClickAndAwait(host, UiElementNames.ActionEnterResolution,
                s => s.Campaign.Stage == CampaignStage.Resolution, "enter resolution");

            // Combat choice opens a live battle attached to the scoped driver, pre-deploy and paused.
            await ClickAndAwait(host, UiElementNames.ChoiceCombat,
                s => s.Battle != null && s.BattlePaused && !s.Battle.Deployed, "open predeployment battle");
            Assert.That(driver.State, Is.SameAs(session.Battle),
                "production controller must attach the actual campaign battle to the scoped driver");
            Assert.That(driver.Ledger, Is.SameAs(session.BattleLedger));
            Assert.That(driver.Paused, Is.True, "battle must open driver-paused");

            // Reset preserves the paused predeployment state without retired edit controls.
            await ClickAndAwait(host, UiElementNames.BattleReset,
                s => s.LastClickedAction == UiElementNames.BattleReset
                    && s.Battle != null
                    && s.BattlePaused
                    && !s.Battle.Deployed,
                "reset predeployment battle");
            Assert.That(driver.State, Is.SameAs(session.Battle));
            Assert.That(driver.Paused, Is.True);

            // Resume: the driver pump submits the deploy command, then continuously steps the sim.
            long pausedSteps = driver.TotalSteps;
            await ClickAndAwait(host, UiElementNames.BattlePlayPause,
                s => !s.BattlePaused, "resume live battle");
            await WaitUntil(session, s => s.Battle != null && s.Battle.Deployed,
                TimeSpan.FromSeconds(12), "driver-mediated deploy");
            Assert.That(driver.TotalSteps, Is.GreaterThanOrEqualTo(pausedSteps));

            // Driver-owned local pause freezes the live pump without touching Core.
            await ClickAndAwait(host, UiElementNames.BattlePlayPause,
                s => s.BattlePaused, "local pause");
            long frozenSteps = driver.TotalSteps;
            double frozenElapsed = session.Battle.ElapsedSeconds;
            string frozenHash = session.BattleHash;
            int frozenLedgerEvents = session.BattleLedger.Events.Count;

            await AwaitProcessedFrames(driver, 5, "pause-only player-loop frames");
            Assert.That(driver.TotalSteps, Is.EqualTo(frozenSteps),
                "pause alone must freeze production steps");
            Assert.That(session.Battle.ElapsedSeconds, Is.EqualTo(frozenElapsed),
                "pause alone must freeze the battle clock");
            Assert.That(session.BattleHash, Is.EqualTo(frozenHash),
                "pause alone must preserve the Core state hash");
            Assert.That(session.BattleLedger.Events.Count, Is.EqualTo(frozenLedgerEvents),
                "pause alone must not append battle ledger events");

            // Resume to a terminal outcome; the driver must detach on completion.
            await ClickAndAwait(host, UiElementNames.BattlePlayPause,
                s => !s.BattlePaused, "resume to terminal");
            long steppedFrame = await WaitForSteppedFrame(driver, TimeSpan.FromSeconds(8));
            Assert.That(steppedFrame, Is.EqualTo(1), "each player-loop step processes exactly one sim step");

            await WaitUntil(session,
                s => s.Battle == null || s.Battle.Outcome != BattleOutcomeKind.Ongoing,
                TimeSpan.FromSeconds(60), "terminal production battle");
            await WaitUntil(session, s => driver.State == null,
                TimeSpan.FromSeconds(5), "terminal detach");
            long terminalSteps = driver.TotalSteps;
            Assert.That(session.Battle == null || session.Battle.Outcome != BattleOutcomeKind.Ongoing);

            // Result: settle the terminal battle and return to base.
            await ClickAndAwait(host, UiElementNames.ActionSettle,
                s => s.Campaign.SettlementApplied && s.Battle == null, "settle terminal battle");
            Assert.That(driver.Ledger, Is.Null, "settle must detach the battle ledger");
            await ClickAndAwait(host, UiElementNames.ReturnAction,
                s => s.Campaign.Stage == CampaignStage.BaseReady, "return to base");
            await AwaitProcessedFrames(driver, 3, "post-return player-loop frames");
            Assert.That(driver.TotalSteps, Is.EqualTo(terminalSteps),
                "terminal/return must not revive the old battle session");
            Assert.That(driver.State, Is.Null);

            await UnloadContentScenesAsync();
        }

        static async Task OpenFoundationAsync()
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
        }

        static async Task ClickAndAwait(
            GameplayUiHost host,
            string elementName,
            Func<IPocCoreLoopSession, bool> predicate,
            string label)
        {
            IPocCoreLoopSession session = host.CoreLoop;
            Assert.That(session, Is.Not.Null, "core-loop session missing before " + label);
            UnityEngine.UI.Button button = UguiHudBuilder.ButtonNamed(host.CanvasRoot, elementName);
            Assert.That(button, Is.Not.Null, "production button missing: " + elementName);

            var changed = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnChanged() => changed.TrySetResult(true);
            session.StateChanged += OnChanged;
            try
            {
                button.onClick.Invoke();
                await AwaitTask(changed.Task, TimeSpan.FromSeconds(8), label);
            }
            finally
            {
                session.StateChanged -= OnChanged;
            }

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
