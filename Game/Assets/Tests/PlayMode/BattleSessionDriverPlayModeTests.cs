using System;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Battle;
using Janseon.Foundation.Composition;
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
        public async Task FoundationScope_ResolvesDriver_PlayerLoopPump_ReplaysIdentically()
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
            Assert.That(driver, Is.InstanceOf<VContainer.Unity.ITickable>(), "driver must be a VContainer entry point");
            Assert.That(driver.Paused, Is.False, "driver must start unpaused");

            BattleSetup setup = BattleSetup.FromContext(BattleContext.Create(
                "campaign",
                default(StationId),
                314159,
                new Tick(0),
                0,
                0,
                BattleRules.RulesVersion,
                "rtfc-d1-playmode",
                UnitHpSnapshot.DefaultParty()));
            BattleTickCommand[] schedule =
            {
                new BattleTickCommand
                {
                    Id = new CommandId("pm-deploy"), Seq = 0, At = new Tick(0),
                    Kind = BattleTickCommandKind.Deploy, Formation = setup.PlayerFormation,
                },
            };
            BattleSimState state = BattleSim.Open(setup);
            Ledger ledger = new Ledger();
            driver.Attach(state, ledger);
            foreach (BattleTickCommand command in schedule) driver.Enqueue(command);

            // Player-loop pump: bounded wait to 60 ticks at 30 Hz (~2s wall). No fixed
            // sleeps; the loop exits on the exact state change or the deadline fails it.
            float pumpDeadline = Time.realtimeSinceStartup + 20f;
            while (state.Tick < 60 && Time.realtimeSinceStartup < pumpDeadline) await Task.Yield();

            Assert.That(state.Tick, Is.GreaterThanOrEqualTo(60), "player loop must pump the driver to 60 ticks");
            Assert.That(state.Tick, Is.LessThanOrEqualTo(60 + BattleSessionDriver.MaxStepsPerFrame),
                "per-frame clamp must bound the overshoot past the wait horizon");

            driver.Paused = true;
            long stepsAtPause = driver.TotalSteps;
            float pauseDeadline = Time.realtimeSinceStartup + 1.5f;
            while (Time.realtimeSinceStartup < pauseDeadline) await Task.Yield();
            Assert.That(driver.TotalSteps, Is.EqualTo(stepsAtPause), "pause must freeze the live pump");

            var (directState, directLedger) = BattleSim.Replay(setup, schedule, state.Tick);
            Assert.That(state.Fingerprint(), Is.EqualTo(directState.Fingerprint()),
                "live driver run must replay identically to direct Core replay");
            Assert.That(BattleSim.Result(state).ResultHash,
                Is.EqualTo(BattleSim.Result(directState).ResultHash));
            Assert.That(LedgerSignatures(ledger), Is.EqualTo(LedgerSignatures(directLedger)),
                "ledger event ids, order, and summary hashes must match the direct replay");

            await UnloadContentScenesAsync();
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
