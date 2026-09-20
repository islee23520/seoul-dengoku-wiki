using System;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.AppFlow;
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
    /// PlayMode campaign core-loop coverage without any battle: negotiation choice,
    /// non-combat settlement with duplicate-settle idempotency, return to base, and
    /// combat-choice battle open/reset against the live <see cref="IPocCoreLoopSession"/>.
    /// All actions run through production uGUI buttons; no presenter test seams are used.
    /// </summary>
    public sealed class CoreLoopPlayModeTests
    {
        [UnityTest]
        public System.Collections.IEnumerator NegotiationPath_SettlesIdempotentlyAndReturns() =>
            NegotiationPath_SettlesIdempotentlyAndReturnsAsync().AsCoroutine();

        async Task NegotiationPath_SettlesIdempotentlyAndReturnsAsync()
        {
            IPocCoreLoopSession session = await OpenGameplaySessionAsync();

            await ClickAndAwait(UiElementNames.ActionDepart,
                s => s.Campaign.Stage == CampaignStage.ExpeditionTravel, "depart");
            await ClickAndAwait(UiElementNames.StationSindorim,
                s => s.Campaign.Node.Equals(StationId.Sindorim), "travel");
            await ClickAndAwait(UiElementNames.ActionFaceEncounter,
                s => s.Campaign.Stage == CampaignStage.Encounter, "face encounter");

            string campaignHashBefore = session.CampaignHash;
            Assert.That(campaignHashBefore, Is.Not.Empty, "campaign hash must be live");

            await ClickAndAwait(UiElementNames.ChoiceNegotiate,
                s => s.LastClickedAction == UiElementNames.ChoiceNegotiate
                    && s.Campaign.Stage == CampaignStage.Settlement,
                "choose negotiate");

            await ClickAndAwait(UiElementNames.ActionSettle,
                s => s.Campaign.SettlementApplied && s.Battle == null, "settle non-combat encounter");
            Assert.That(session.LastReceipt, Is.Not.Null, "first settle must produce a receipt");
            Assert.That(session.LastDuplicateReceipt, Is.Null, "first settle must not be a duplicate");
            string settledHash = session.CampaignHash;

            await ClickAndAwait(UiElementNames.ActionSettle,
                s => s.LastDuplicateReceipt != null, "duplicate settle");
            Assert.That(session.Campaign.SettlementApplied, Is.True, "duplicate settle must not unapply settlement");
            Assert.That(session.Battle, Is.Null, "duplicate settle must not open a battle");
            Assert.That(session.CampaignHash, Is.EqualTo(settledHash),
                "duplicate settle must not mutate campaign state");

            await ClickAndAwait(UiElementNames.ReturnAction,
                s => s.Campaign.Stage == CampaignStage.BaseReady, "return to base");

            await UnloadContentScenesAsync();
        }

        [UnityTest]
        public System.Collections.IEnumerator CombatChoice_OpensPausedBattleAndResetReopens() =>
            CombatChoice_OpensPausedBattleAndResetReopensAsync().AsCoroutine();

        async Task CombatChoice_OpensPausedBattleAndResetReopensAsync()
        {
            IPocCoreLoopSession session = await OpenGameplaySessionAsync();

            await ClickAndAwait(UiElementNames.ActionDepart,
                s => s.Campaign.Stage == CampaignStage.ExpeditionTravel, "depart");
            await ClickAndAwait(UiElementNames.StationSindorim,
                s => s.Campaign.Node.Equals(StationId.Sindorim), "travel");
            await ClickAndAwait(UiElementNames.ActionFaceEncounter,
                s => s.Campaign.Stage == CampaignStage.Encounter, "face encounter");
            await ClickAndAwait(UiElementNames.ChoiceCombat,
                s => s.Battle != null && s.BattlePaused && !s.Battle.Deployed, "open combat battle");
            Assert.That(session.Battle.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing));
            Assert.That(session.BattleLedger.Events.Count, Is.GreaterThanOrEqualTo(0));

            await ClickAndAwait(UiElementNames.BattleReset,
                s => s.LastClickedAction == UiElementNames.BattleReset
                    && s.Battle != null && s.BattlePaused && !s.Battle.Deployed,
                "reset battle");
            Assert.That(session.Battle.Outcome, Is.EqualTo(BattleOutcomeKind.Ongoing),
                "reset must reopen the pending battle as ongoing");
            Assert.That(session.BattlePaused, Is.True, "reset battle must stay driver-paused pre-deploy");

            await UnloadContentScenesAsync();
        }

        static async Task<IPocCoreLoopSession> OpenGameplaySessionAsync()
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

            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null, "production GameplayUiHost missing");
            await AwaitTask(host.Ready, TimeSpan.FromSeconds(10), "gameplay host ready");
            await AwaitTask(host.CoreLoopReady, TimeSpan.FromSeconds(10), "production core-loop attach");
            Assert.That(host.CoreLoop, Is.Not.Null);
            Assert.That(host.CoreLoop.IsReady, Is.True, "controller session must be ready after Start");
            Assert.That(host.CoreLoop.Campaign, Is.Not.Null, "controller must start a campaign");
            Assert.That(host.CoreLoop.Battle, Is.Null, "no battle before the first encounter");
            return host.CoreLoop;
        }

        static async Task ClickAndAwait(
            string elementName,
            Func<IPocCoreLoopSession, bool> predicate,
            string label)
        {
            GameplayUiHost host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            Assert.That(host, Is.Not.Null, "GameplayUiHost missing before " + label);
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
