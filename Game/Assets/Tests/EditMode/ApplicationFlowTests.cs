using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class ApplicationFlowTests
    {
        [Test]
        public void IllegalTriggerDoesNotChangeStateOrPendingTarget()
        {
            ApplicationFlowMachine machine = new();

            TransitionDecision decision = machine.TryDispatch(ApplicationFlowTrigger.SceneLoadSucceeded);

            Assert.That(decision.Accepted, Is.False);
            Assert.That(decision.Rejection, Is.EqualTo(TransitionRejection.IllegalTransition));
            Assert.That(machine.CurrentState, Is.EqualTo(ApplicationFlowState.Booting));
            Assert.That(machine.PendingTarget, Is.Null);
        }

        [Test]
        public void OpenFoundationFromBootingIsIllegal()
        {
            ApplicationFlowMachine machine = new();

            TransitionDecision decision = machine.TryDispatch(ApplicationFlowTrigger.OpenFoundation);

            Assert.That(decision.Accepted, Is.False);
            Assert.That(decision.Rejection, Is.EqualTo(TransitionRejection.IllegalTransition));
            Assert.That(machine.CurrentState, Is.EqualTo(ApplicationFlowState.Booting));
        }

        [Test]
        public async Task MainTitleCommitsOnlyAfterSceneReadiness()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> transition = coordinator.OpenMainTitleAsync(CancellationToken.None);
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);

            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Transitioning));
            Assert.That(transition.IsCompleted, Is.False);

            lease.CompleteReadiness();
            TransitionOutcome outcome = await transition;

            Assert.That(outcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));
            Assert.That(coordinator.CurrentLease, Is.SameAs(lease));
            Assert.That(loader.LoadCount(ContentScreenId.MainTitle), Is.EqualTo(1));
            Assert.That(loader.LoadCount(ContentScreenId.Foundation), Is.EqualTo(0));
        }

        [Test]
        public async Task DuplicateOpenMainTitleWhileTransitioningReturnsBusyWithoutSecondLoad()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> first = coordinator.OpenMainTitleAsync(CancellationToken.None);
            TransitionOutcome duplicate = await coordinator.OpenMainTitleAsync(CancellationToken.None);

            Assert.That(duplicate.Status, Is.EqualTo(TransitionStatus.Rejected));
            Assert.That(duplicate.Rejection, Is.EqualTo(TransitionRejection.Busy));
            Assert.That(loader.LoadCount(ContentScreenId.MainTitle), Is.EqualTo(1));

            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            lease.CompleteReadiness();
            await first;
        }

        [Test]
        public async Task SameMainTitleAfterCompleted_ReturnsExactStoredReceiptAndLoadCountStaysOne()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> first = coordinator.OpenMainTitleAsync(CancellationToken.None);
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            lease.CompleteReadiness();
            TransitionOutcome outcome1 = await first;

            Assert.That(outcome1.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));

            TransitionOutcome outcome2 = await coordinator.OpenMainTitleAsync(CancellationToken.None);

            Assert.That(outcome2.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(outcome2.TransitionId, Is.EqualTo(outcome1.TransitionId));
            Assert.That(loader.LoadCount(ContentScreenId.MainTitle), Is.EqualTo(1));
        }

        [Test]
        public async Task MainTitleToFoundation_DisposesTitleBeforeFoundationCommit_ExclusiveLease()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> titleTask = coordinator.OpenMainTitleAsync(CancellationToken.None);
            FakeContentSceneLease titleLease = loader.CompleteLoad(ContentScreenId.MainTitle);
            titleLease.CompleteReadiness();
            TransitionOutcome titleOutcome = await titleTask;
            Assert.That(titleOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));

            Task<TransitionOutcome> foundationTask = coordinator.OpenFoundationAsync(CancellationToken.None);
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Transitioning));
            Assert.That(titleLease.DisposeCount, Is.EqualTo(0), "title stays until foundation readiness");

            FakeContentSceneLease foundationLease = loader.CompleteLoad(ContentScreenId.Foundation);
            titleLease.CompleteCleanup(); // arm before readiness so exclusive dispose cannot hang
            foundationLease.CompleteReadiness();
            TransitionOutcome foundationOutcome = await foundationTask;

            Assert.That(foundationOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(titleLease.DisposeCount, Is.EqualTo(1));
            Assert.That(coordinator.CurrentLease, Is.SameAs(foundationLease));
            Assert.That(coordinator.CurrentLease.Screen, Is.EqualTo(ContentScreenId.Foundation));
            Assert.That(loader.LoadCount(ContentScreenId.MainTitle), Is.EqualTo(1));
            Assert.That(loader.LoadCount(ContentScreenId.Foundation), Is.EqualTo(1));
        }

        [Test]
        public async Task DuplicateOpenFoundationAfterCommit_ReturnsSameReceiptWithoutSecondLoad()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            await CommitMainTitle(coordinator, loader);
            TransitionOutcome first = await CommitFoundation(coordinator, loader);

            TransitionOutcome duplicate = await coordinator.OpenFoundationAsync(CancellationToken.None);

            Assert.That(duplicate.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(duplicate.TransitionId, Is.EqualTo(first.TransitionId));
            Assert.That(loader.LoadCount(ContentScreenId.Foundation), Is.EqualTo(1));
        }

        [Test]
        public async Task OpenFoundationWhileMainTitleTransitionBusy_ReturnsBusyWithoutFoundationLoad()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> title = coordinator.OpenMainTitleAsync(CancellationToken.None);
            TransitionOutcome busy = await coordinator.OpenFoundationAsync(CancellationToken.None);

            Assert.That(busy.Status, Is.EqualTo(TransitionStatus.Rejected));
            Assert.That(busy.Rejection, Is.EqualTo(TransitionRejection.Busy));
            Assert.That(loader.LoadCount(ContentScreenId.Foundation), Is.EqualTo(0));
            Assert.That(loader.LoadCount(ContentScreenId.MainTitle), Is.EqualTo(1));

            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            lease.CompleteReadiness();
            await title;
        }

        [Test]
        public async Task IllegalOpenFoundationFromBooting_LeavesStateAndLoadCountsUnchanged()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            TransitionOutcome rejected = await coordinator.OpenFoundationAsync(CancellationToken.None);

            Assert.That(rejected.Status, Is.EqualTo(TransitionStatus.Rejected));
            Assert.That(rejected.Rejection, Is.EqualTo(TransitionRejection.IllegalTransition));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Booting));
            Assert.That(coordinator.CurrentLease, Is.Null);
            Assert.That(loader.TotalLoadCount, Is.EqualTo(0));
        }

        [Test]
        public async Task FailedMainTitleLoad_CleansStagingPreservesNoStableLease_AndRetryUsesNewTransitionId()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> first = coordinator.OpenMainTitleAsync(CancellationToken.None);
            FakeContentSceneLease failedLease = loader.CompleteLoad(ContentScreenId.MainTitle);
            failedLease.FailReadiness();
            failedLease.CompleteCleanup();
            TransitionOutcome failed = await first;

            Assert.That(failed.Status, Is.EqualTo(TransitionStatus.Failed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Faulted));
            Assert.That(coordinator.CurrentLease, Is.Null);
            Assert.That(failedLease.DisposeCount, Is.EqualTo(1));

            Task<TransitionOutcome> retry = coordinator.RetryAsync(CancellationToken.None);
            FakeContentSceneLease recovered = loader.CompleteLoad(ContentScreenId.MainTitle);
            recovered.CompleteReadiness();
            TransitionOutcome recoveredOutcome = await retry;

            Assert.That(recoveredOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(recoveredOutcome.TransitionId, Is.Not.EqualTo(failed.TransitionId));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));
            Assert.That(loader.LoadCount(ContentScreenId.MainTitle), Is.EqualTo(2));
        }

        [Test]
        public async Task FailedFoundationTransition_PreservesMainTitleLeaseAndCleansStaging()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            TransitionOutcome title = await CommitMainTitle(coordinator, loader);
            FakeContentSceneLease titleLease = (FakeContentSceneLease)coordinator.CurrentLease;

            Task<TransitionOutcome> foundation = coordinator.OpenFoundationAsync(CancellationToken.None);
            FakeContentSceneLease staging = loader.CompleteLoad(ContentScreenId.Foundation);
            staging.FailReadiness();
            staging.CompleteCleanup();
            TransitionOutcome failed = await foundation;

            Assert.That(failed.Status, Is.EqualTo(TransitionStatus.Failed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Faulted));
            Assert.That(coordinator.CurrentLease, Is.SameAs(titleLease));
            Assert.That(titleLease.DisposeCount, Is.EqualTo(0));
            Assert.That(staging.DisposeCount, Is.EqualTo(1));
            Assert.That(loader.LoadCount(ContentScreenId.Foundation), Is.EqualTo(1));

            // Previous MainTitle receipt remains usable only after recovery; Retry re-targets Foundation.
            Task<TransitionOutcome> retry = coordinator.RetryAsync(CancellationToken.None);
            FakeContentSceneLease recovered = loader.CompleteLoad(ContentScreenId.Foundation);
            titleLease.CompleteCleanup(); // arm before readiness so exclusive dispose cannot hang
            recovered.CompleteReadiness();
            TransitionOutcome recoveredOutcome = await retry;

            Assert.That(recoveredOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(recoveredOutcome.TransitionId, Is.Not.EqualTo(title.TransitionId));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(titleLease.DisposeCount, Is.EqualTo(1));
            Assert.That(loader.LoadCount(ContentScreenId.Foundation), Is.EqualTo(2));
        }

        [Test]
        public async Task CancellationRequestedBeforeLoaderCompletes_ReturnsCancelledAfterAwaitableCleanup()
        {
            var cts = new CancellationTokenSource();
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> transition = coordinator.OpenMainTitleAsync(cts.Token);
            cts.Cancel();
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            lease.CompleteReadiness();
            lease.CompleteCleanup();

            TransitionOutcome outcome = await transition;
            Assert.That(outcome.Status, Is.EqualTo(TransitionStatus.Cancelled));
            Assert.That(outcome.TransitionId, Is.GreaterThan(0));
            Assert.That(lease.DisposeCount, Is.EqualTo(1));
            Assert.That(coordinator.CurrentLease, Is.Null);
        }

        [Test]
        public async Task FoundationStartupCompleted_EmitsReadyOnlyAfterMainTitleCommit()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);
            var startup = new FoundationStartup(coordinator);
            Task<Exception> run = CaptureStartupException(() => startup.StartAsync(CancellationToken.None));
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            Assert.That(run.IsCompleted, Is.False);
            UnityEngine.TestTools.LogAssert.Expect(LogType.Log, "JANSEON_STARTUP_READY screen=MainTitle");
            lease.CompleteReadiness();
            Assert.That(await run, Is.Null);
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));
            UnityEngine.TestTools.LogAssert.NoUnexpectedReceived();
        }

        [Test]
        public async Task FoundationStartupFailed_ThrowsInvalidOperationWithTransitionInfo()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);
            var startup = new FoundationStartup(coordinator);

            Task<Exception> run = CaptureStartupException(() => startup.StartAsync(CancellationToken.None));
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            lease.FailReadiness();
            lease.CompleteCleanup();

            Exception ex = await run;
            Assert.That(ex, Is.TypeOf<InvalidOperationException>());
            Assert.That(ex.Message.Contains("FoundationStartup Failed"), Is.True);
            Assert.That(ex.Message.Contains("status Failed"), Is.True,
                "must exercise the Failed branch, not Busy/Rejected");
        }

        [Test]
        public async Task FoundationStartupCancelled_ThrowsOperationCanceledPreservingToken()
        {
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);
            var startup = new FoundationStartup(coordinator);
            var cts = new CancellationTokenSource();
            cts.Cancel();

            Task<Exception> run = CaptureStartupException(() => startup.StartAsync(cts.Token));
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            lease.CompleteReadiness();
            lease.CompleteCleanup();

            Exception ex = await run;
            Assert.That(ex, Is.TypeOf<OperationCanceledException>());
            Assert.That(((OperationCanceledException)ex).CancellationToken, Is.EqualTo(cts.Token));
        }

        private static async Task<Exception> CaptureStartupException(Func<Awaitable> start)
        {
            try
            {
                await start();
                return null;
            }
            catch (Exception ex)
            {
                return ex;
            }
        }

        [Test]
        public async Task DuringCleanupBusyRejectsRetry_StaleLeaseDisposedCannotCommit()
        {
            var cts = new CancellationTokenSource();
            FakeContentSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> first = coordinator.OpenMainTitleAsync(cts.Token);
            cts.Cancel();
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle, generation: 42);
            lease.CompleteReadiness();

            TransitionOutcome busy = await coordinator.RetryAsync(CancellationToken.None);
            Assert.That(busy.Rejection, Is.EqualTo(TransitionRejection.Busy));

            lease.CompleteCleanup();
            await first;

            Assert.That(lease.DisposeCount, Is.EqualTo(1));
            Assert.That(lease.Generation, Is.EqualTo(42));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Faulted));
        }

        private static async Task<TransitionOutcome> CommitMainTitle(
            ApplicationFlowCoordinator coordinator,
            FakeContentSceneLoader loader)
        {
            Task<TransitionOutcome> task = coordinator.OpenMainTitleAsync(CancellationToken.None);
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.MainTitle);
            lease.CompleteReadiness();
            return await task;
        }

        private static async Task<TransitionOutcome> CommitFoundation(
            ApplicationFlowCoordinator coordinator,
            FakeContentSceneLoader loader)
        {
            Task<TransitionOutcome> task = coordinator.OpenFoundationAsync(CancellationToken.None);
            FakeContentSceneLease lease = loader.CompleteLoad(ContentScreenId.Foundation);
            if (coordinator.CurrentLease is FakeContentSceneLease previous)
            {
                previous.CompleteCleanup(); // arm before readiness so exclusive dispose cannot hang
            }

            lease.CompleteReadiness();
            return await task;
        }

        private sealed class FakeContentSceneLoader : IContentSceneLoader
        {
            private readonly Dictionary<ContentScreenId, int> loadCounts = new()
            {
                [ContentScreenId.MainTitle] = 0,
                [ContentScreenId.Foundation] = 0,
            };

            private TaskCompletionSource<IContentSceneLease> pendingLoad = NewLoadSource();
            private int nextGeneration;

            public int TotalLoadCount { get; private set; }

            public int LoadCount(ContentScreenId screen) => loadCounts[screen];

            public Task<IContentSceneLease> LoadAsync(ContentScreenId screen, CancellationToken cancellationToken)
            {
                TotalLoadCount++;
                loadCounts[screen] = loadCounts[screen] + 1;
                return pendingLoad.Task;
            }

            public FakeContentSceneLease CompleteLoad(ContentScreenId screen, int generation = -1)
            {
                if (generation < 0)
                {
                    generation = ++nextGeneration;
                }

                FakeContentSceneLease lease = new(screen, generation);
                pendingLoad.SetResult(lease);
                pendingLoad = NewLoadSource();
                return lease;
            }

            private static TaskCompletionSource<IContentSceneLease> NewLoadSource()
                => new(TaskCreationOptions.RunContinuationsAsynchronously);
        }

        private sealed class FakeContentSceneLease : IContentSceneLease
        {
            private readonly TaskCompletionSource<bool> readiness =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            private readonly TaskCompletionSource<bool> cleanup =
                new(TaskCreationOptions.RunContinuationsAsynchronously);

            public FakeContentSceneLease(ContentScreenId screen, int generation = 0)
            {
                Screen = screen;
                Generation = generation;
            }

            public ContentScreenId Screen { get; }
            public Task Ready => readiness.Task;
            public int Generation { get; }
            public int DisposeCount { get; private set; }

            public void CompleteReadiness() => readiness.SetResult(true);

            public void FailReadiness() => readiness.SetException(new InvalidOperationException("readiness failed"));

            public void CompleteCleanup() => cleanup.TrySetResult(true);

            public void Dispose()
            {
                DisposeCount++;
            }

            public Task CleanupAsync()
            {
                Dispose();
                return cleanup.Task;
            }
        }
    }
}
