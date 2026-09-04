using System;
using System.Threading;
using System.Threading.Tasks;

namespace Janseon.Foundation.AppFlow
{
    public interface IFoundationSceneLoader
    {
        Task<IFoundationSceneLease> LoadAsync(CancellationToken cancellationToken);
    }

    public interface IFoundationSceneLease : IDisposable
    {
        Task Ready { get; }
        Task CleanupAsync();
    }

    public enum TransitionStatus
    {
        Completed,
        Rejected,
        Cancelled,
        Failed,
    }

    public readonly struct TransitionOutcome
    {
        private TransitionOutcome(
            TransitionStatus status,
            long transitionId,
            TransitionRejection rejection)
        {
            Status = status;
            TransitionId = transitionId;
            Rejection = rejection;
        }

        public TransitionStatus Status { get; }
        public long TransitionId { get; }
        public TransitionRejection Rejection { get; }

        public static TransitionOutcome Complete(long transitionId)
            => new(TransitionStatus.Completed, transitionId, TransitionRejection.None);

        public static TransitionOutcome Reject(TransitionRejection rejection)
            => new(TransitionStatus.Rejected, 0, rejection);

        public static TransitionOutcome Cancel(long transitionId)
            => new(TransitionStatus.Cancelled, transitionId, TransitionRejection.None);

        public static TransitionOutcome Fail(long transitionId)
            => new(TransitionStatus.Failed, transitionId, TransitionRejection.None);
    }

    public sealed class ApplicationFlowCoordinator
    {
        private readonly IFoundationSceneLoader sceneLoader;
        private readonly ApplicationFlowMachine machine = new();
        private long nextTransitionId;
        private bool transitionActive;
        private TransitionOutcome? committedOutcome;

        public ApplicationFlowCoordinator(IFoundationSceneLoader sceneLoader)
        {
            this.sceneLoader = sceneLoader ?? throw new ArgumentNullException(nameof(sceneLoader));
        }

        public ApplicationFlowState CurrentState => machine.CurrentState;
        public Task<TransitionOutcome> CurrentTransition { get; private set; }

        public Task<TransitionOutcome> OpenFoundationAsync(CancellationToken cancellationToken)
        {
            if (CurrentState == ApplicationFlowState.Foundation && committedOutcome.HasValue)
            {
                return Task.FromResult(committedOutcome.Value);
            }

            if (transitionActive)
            {
                return Task.FromResult(TransitionOutcome.Reject(TransitionRejection.Busy));
            }

            TransitionDecision decision = machine.TryDispatch(ApplicationFlowTrigger.OpenFoundation);
            if (!decision.Accepted)
            {
                return Task.FromResult(TransitionOutcome.Reject(decision.Rejection));
            }

            CurrentTransition = RunTransitionAsync(++nextTransitionId, cancellationToken);
            return CurrentTransition;
        }

        public Task<TransitionOutcome> RetryAsync(CancellationToken cancellationToken)
        {
            if (transitionActive)
            {
                return Task.FromResult(TransitionOutcome.Reject(TransitionRejection.Busy));
            }

            TransitionDecision decision = machine.TryDispatch(ApplicationFlowTrigger.Retry);
            if (!decision.Accepted)
            {
                return Task.FromResult(TransitionOutcome.Reject(decision.Rejection));
            }

            CurrentTransition = RunTransitionAsync(++nextTransitionId, cancellationToken);
            return CurrentTransition;
        }

        private async Task<TransitionOutcome> RunTransitionAsync(
            long transitionId,
            CancellationToken cancellationToken)
        {
            transitionActive = true;
            IFoundationSceneLease staging = null;

            try
            {
                staging = await sceneLoader.LoadAsync(cancellationToken);
                await staging.Ready;
                cancellationToken.ThrowIfCancellationRequested();
                machine.TryDispatch(ApplicationFlowTrigger.SceneLoadSucceeded);
                committedOutcome = TransitionOutcome.Complete(transitionId);
                staging = null;
                return TransitionOutcome.Complete(transitionId);
            }
            catch (OperationCanceledException)
            {
                if (staging != null)
                {
                    await staging.CleanupAsync();
                    staging = null;
                }
                machine.TryDispatch(ApplicationFlowTrigger.SceneLoadFailed);
                return TransitionOutcome.Cancel(transitionId);
            }
            catch (Exception)
            {
                if (staging != null)
                {
                    await staging.CleanupAsync();
                    staging = null;
                }
                machine.TryDispatch(ApplicationFlowTrigger.SceneLoadFailed);
                return TransitionOutcome.Fail(transitionId);
            }
            finally
            {
                if (staging != null)
                {
                    await staging.CleanupAsync();
                    staging = null;
                }
                transitionActive = false;
            }
        }
    }
}
