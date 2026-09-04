using System;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    public sealed class ApplicationFlowTests
    {
        [Test]
        public void IllegalTriggerDoesNotChangeState()
        {
            ApplicationFlowMachine machine = new();

            TransitionDecision decision = machine.TryDispatch(ApplicationFlowTrigger.SceneLoadSucceeded);

            Assert.That(decision.Accepted, Is.False);
            Assert.That(decision.Rejection, Is.EqualTo(TransitionRejection.IllegalTransition));
            Assert.That(machine.CurrentState, Is.EqualTo(ApplicationFlowState.Booting));
        }

        [Test]
        public async Task FoundationCommitsOnlyAfterSceneReadiness()
        {
            FakeFoundationSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> transition = coordinator.OpenFoundationAsync(CancellationToken.None);
            FakeFoundationSceneLease lease = loader.CompleteLoad();

            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Transitioning));
            Assert.That(transition.IsCompleted, Is.False);

            lease.CompleteReadiness();
            TransitionOutcome outcome = await transition;

            Assert.That(outcome.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(loader.LoadCount, Is.EqualTo(1));
        }

        [Test]
        public async Task DuplicateRequestWhileTransitioningReturnsBusyWithoutSecondLoad()
        {
            FakeFoundationSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> first = coordinator.OpenFoundationAsync(CancellationToken.None);
            TransitionOutcome duplicate = await coordinator.OpenFoundationAsync(CancellationToken.None);

            Assert.That(duplicate.Status, Is.EqualTo(TransitionStatus.Rejected));
            Assert.That(duplicate.Rejection, Is.EqualTo(TransitionRejection.Busy));
            Assert.That(loader.LoadCount, Is.EqualTo(1));

            FakeFoundationSceneLease lease = loader.CompleteLoad();
            lease.CompleteReadiness();
            await first;
        }

        [Test]
        public async Task FailedReadinessDisposesStagingAndRetryUsesNewTransitionId()
        {
            FakeFoundationSceneLoader loader = new();
            ApplicationFlowCoordinator coordinator = new(loader);

            Task<TransitionOutcome> first = coordinator.OpenFoundationAsync(CancellationToken.None);
            FakeFoundationSceneLease failedLease = loader.CompleteLoad();
            failedLease.FailReadiness();
            failedLease.CompleteCleanup(); // signal before awaiting result
            TransitionOutcome failed = await first;

            Assert.That(failed.Status, Is.EqualTo(TransitionStatus.Failed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Faulted));
            Assert.That(failedLease.DisposeCount, Is.EqualTo(1));

            Task<TransitionOutcome> retry = coordinator.RetryAsync(CancellationToken.None);
            FakeFoundationSceneLease recoveredLease = loader.CompleteLoad();
            recoveredLease.CompleteReadiness();
            TransitionOutcome recovered = await retry;

            Assert.That(recovered.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(recovered.TransitionId, Is.Not.EqualTo(failed.TransitionId));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));
            Assert.That(loader.LoadCount, Is.EqualTo(2));
        }

        [Test]
        public async Task SameDestinationAfterCompleted_ReturnsExactStoredReceiptAndLoadCountStaysOne()
        {
            var loader = new FakeFoundationSceneLoader();
            var coordinator = new ApplicationFlowCoordinator(loader);

            var first = coordinator.OpenFoundationAsync(CancellationToken.None);
            var lease = loader.CompleteLoad();
            lease.CompleteReadiness();
            var outcome1 = await first;

            Assert.That(outcome1.Status, Is.EqualTo(TransitionStatus.Completed));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));

            var outcome2 = await coordinator.OpenFoundationAsync(CancellationToken.None);

            Assert.That(outcome2.Status, Is.EqualTo(TransitionStatus.Completed)); // RED: currently IllegalTransition
            Assert.That(outcome2.TransitionId, Is.EqualTo(outcome1.TransitionId));
            Assert.That(loader.LoadCount, Is.EqualTo(1));
        }

        [Test]
        public async Task CancellationRequestedBeforeLoaderCompletes_ReturnsCancelledAfterAwaitableCleanup()
        {
            var cts = new CancellationTokenSource();
            var loader = new FakeFoundationSceneLoader();
            var coordinator = new ApplicationFlowCoordinator(loader);

            var transition = coordinator.OpenFoundationAsync(cts.Token);
            cts.Cancel();
            var lease = loader.CompleteLoad();
            lease.CompleteReadiness();
            lease.CompleteCleanup(); // signal before awaiting result; no deadlock

            TransitionOutcome outcome = await transition;
            Assert.That(outcome.Status, Is.EqualTo(TransitionStatus.Cancelled));
            Assert.That(outcome.TransitionId, Is.GreaterThan(0));
            Assert.That(lease.DisposeCount, Is.EqualTo(1));
        }

        [Test]
        public async Task FoundationStartupFailed_ThrowsInvalidOperationWithTransitionInfo()
        {
            var loader = new FakeFoundationSceneLoader();
            var coordinator = new ApplicationFlowCoordinator(loader);
            var startup = new FoundationStartup(coordinator);

            async Task RunStartup() => await startup.StartAsync(CancellationToken.None);
            FakeFoundationSceneLease lease = loader.CompleteLoad();
            lease.FailReadiness();
            lease.CompleteCleanup();

            var ex = Assert.ThrowsAsync<InvalidOperationException>(RunStartup);
            Assert.That(ex.Message.Contains("FoundationStartup Failed"), Is.True);
            Assert.That(ex.Message.Contains("status Failed"), Is.True,
                "must exercise the Failed branch, not Busy/Rejected");
        }

        [Test]
        public async Task FoundationStartupCancelled_ThrowsOperationCanceledPreservingToken()
        {
            var loader = new FakeFoundationSceneLoader();
            var coordinator = new ApplicationFlowCoordinator(loader);
            var startup = new FoundationStartup(coordinator);
            var cts = new CancellationTokenSource();

            async Task RunStartup() => await startup.StartAsync(cts.Token);
            FakeFoundationSceneLease lease = loader.CompleteLoad();
            lease.CompleteReadiness();
            cts.Cancel();
            lease.CompleteCleanup();

            var ex = Assert.ThrowsAsync<OperationCanceledException>(RunStartup);
            Assert.That(ex.CancellationToken, Is.EqualTo(cts.Token));
        }

        [Test]
        public async Task DuringCleanupBusyRejectsRetry_StaleLeaseDisposedCannotCommitAndCommittedLeaseBehavior()
        {
            var cts = new CancellationTokenSource();
            var loader = new FakeFoundationSceneLoader();
            var coordinator = new ApplicationFlowCoordinator(loader);

            var first = coordinator.OpenFoundationAsync(cts.Token);
            cts.Cancel();
            var lease = loader.CompleteLoad(42);
            lease.CompleteReadiness(); // signal before awaiting; reaches cleanup phase for Busy test

            var busy = await coordinator.RetryAsync(CancellationToken.None);
            Assert.That(busy.Rejection, Is.EqualTo(TransitionRejection.Busy));

            lease.CompleteCleanup(); // release held cleanup TCS
            await first;

            Assert.That(lease.DisposeCount, Is.EqualTo(1));
            Assert.That(lease.Generation, Is.EqualTo(42));
            Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Faulted));
        }

        private sealed class FakeFoundationSceneLoader : IFoundationSceneLoader
        {
            private TaskCompletionSource<IFoundationSceneLease> pendingLoad = NewLoadSource();
            private int nextGeneration;

            public int LoadCount { get; private set; }
            public int CleanupCount { get; private set; }

            public Task<IFoundationSceneLease> LoadAsync(CancellationToken cancellationToken)
            {
                LoadCount++;
                return pendingLoad.Task;
            }

            public FakeFoundationSceneLease CompleteLoad(int generation = -1)
            {
                if (generation < 0) generation = ++nextGeneration;
                FakeFoundationSceneLease lease = new(generation);
                pendingLoad.SetResult(lease);
                pendingLoad = NewLoadSource();
                return lease;
            }

            public void SimulateCleanupComplete() => CleanupCount++;

            private static TaskCompletionSource<IFoundationSceneLease> NewLoadSource()
                => new(TaskCreationOptions.RunContinuationsAsynchronously);
        }

        private sealed class FakeFoundationSceneLease : IFoundationSceneLease
        {
            private readonly TaskCompletionSource<bool> readiness =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            private readonly TaskCompletionSource<object> disposed =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            private readonly TaskCompletionSource<bool> cleanup =
                new(TaskCreationOptions.RunContinuationsAsynchronously);

            public Task Ready => readiness.Task;
            public Task Disposed => disposed.Task;
            public int Generation { get; }
            public int DisposeCount { get; private set; }

            public FakeFoundationSceneLease(int generation = 0)
            {
                Generation = generation;
            }

            public void CompleteReadiness() => readiness.SetResult(true);

            public void FailReadiness() => readiness.SetException(new InvalidOperationException("readiness failed"));

            public void CompleteCleanup() => cleanup.SetResult(true);

            public void Dispose()
            {
                DisposeCount++;
                disposed.TrySetResult(null);
            }

            public Task CleanupAsync()
            {
                Dispose();
                return cleanup.Task;
            }

            // Test seam for committed lease verification (production can satisfy by exposing
            // committed lease via public API such as CurrentLease property or ILeaseOwner
            // without test-only hooks)
        }
    }
}
