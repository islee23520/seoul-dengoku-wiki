using System;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;

namespace Janseon.Foundation.AppFlow
{
    public interface IContentSceneLoader
    {
        Task<IContentSceneLease> LoadAsync(ContentScreenId screen, CancellationToken cancellationToken);
    }

    public interface IContentSceneLease : IDisposable
    {
        ContentScreenId Screen { get; }
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
        private readonly IContentSceneLoader sceneLoader;
        private readonly ApplicationFlowMachine machine = new();
        private long nextTransitionId;
        private bool transitionActive;
        private TransitionOutcome? committedOutcome;
        private IContentSceneLease committedLease;

        public ApplicationFlowCoordinator(IContentSceneLoader sceneLoader)
        {
            this.sceneLoader = sceneLoader ?? throw new ArgumentNullException(nameof(sceneLoader));
        }

        public ApplicationFlowState CurrentState => machine.CurrentState;
        public IContentSceneLease CurrentLease => committedLease;
        public StartingPreset SelectedStartingPreset { get; set; } = StartingPreset.Wanderer;
        public Task<TransitionOutcome> CurrentTransition { get; private set; }

        public Task<TransitionOutcome> OpenMainTitleAsync(CancellationToken cancellationToken)
            => RequestScreenAsync(ContentScreenId.MainTitle, ApplicationFlowTrigger.OpenMainTitle, cancellationToken);

        public Task<TransitionOutcome> OpenFoundationAsync(CancellationToken cancellationToken)
            => RequestScreenAsync(ContentScreenId.Foundation, ApplicationFlowTrigger.OpenFoundation, cancellationToken);

        public Task<TransitionOutcome> RetryAsync(CancellationToken cancellationToken)
        {
            if (transitionActive)
            {
                return Task.FromResult(TransitionOutcome.Reject(TransitionRejection.Busy));
            }

            if (!machine.PendingTarget.HasValue)
            {
                return Task.FromResult(TransitionOutcome.Reject(TransitionRejection.IllegalTransition));
            }

            TransitionDecision decision = machine.TryDispatch(ApplicationFlowTrigger.Retry);
            if (!decision.Accepted)
            {
                return Task.FromResult(TransitionOutcome.Reject(decision.Rejection));
            }

            ContentScreenId destination = ToScreen(machine.PendingTarget.Value);
            CurrentTransition = RunTransitionAsync(++nextTransitionId, destination, cancellationToken);
            return CurrentTransition;
        }

        private Task<TransitionOutcome> RequestScreenAsync(
            ContentScreenId screen,
            ApplicationFlowTrigger openTrigger,
            CancellationToken cancellationToken)
        {
            if (IsCommittedScreen(screen) && committedOutcome.HasValue)
            {
                return Task.FromResult(committedOutcome.Value);
            }

            if (transitionActive)
            {
                return Task.FromResult(TransitionOutcome.Reject(TransitionRejection.Busy));
            }

            TransitionDecision decision = machine.TryDispatch(openTrigger);
            if (!decision.Accepted)
            {
                return Task.FromResult(TransitionOutcome.Reject(decision.Rejection));
            }

            CurrentTransition = RunTransitionAsync(++nextTransitionId, screen, cancellationToken);
            return CurrentTransition;
        }

        private async Task<TransitionOutcome> RunTransitionAsync(
            long transitionId,
            ContentScreenId destination,
            CancellationToken cancellationToken)
        {
            transitionActive = true;
            IContentSceneLease staging = null;

            try
            {
                staging = await sceneLoader.LoadAsync(destination, cancellationToken);
                await staging.Ready;
                cancellationToken.ThrowIfCancellationRequested();

                // Exclusive content-screen lease: previous child is disposed/unloaded
                // before (or atomically with) committing the next stable lease.
                if (committedLease != null)
                {
                    IContentSceneLease previous = committedLease;
                    committedLease = null;
                    await previous.CleanupAsync();
                }

                if (!machine.TryCommitPendingTarget())
                {
                    throw new InvalidOperationException(
                        $"Missing pending target while committing {destination} transition {transitionId}.");
                }

                committedLease = staging;
                staging = null;
                committedOutcome = TransitionOutcome.Complete(transitionId);
                return committedOutcome.Value;
            }
            catch (OperationCanceledException)
            {
                if (staging != null)
                {
                    await staging.CleanupAsync();
                    staging = null;
                }

                machine.TryDispatch(ApplicationFlowTrigger.SceneLoadFailed);
                if (committedLease == null)
                {
                    committedOutcome = null;
                }

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
                if (committedLease == null)
                {
                    committedOutcome = null;
                }

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

        private bool IsCommittedScreen(ContentScreenId screen)
        {
            if (committedLease == null || committedLease.Screen != screen || !committedOutcome.HasValue)
            {
                return false;
            }

            return (screen == ContentScreenId.MainTitle && CurrentState == ApplicationFlowState.MainTitle)
                || (screen == ContentScreenId.Foundation && CurrentState == ApplicationFlowState.Foundation);
        }

        private static ContentScreenId ToScreen(ApplicationFlowState state)
        {
            return state switch
            {
                ApplicationFlowState.MainTitle => ContentScreenId.MainTitle,
                ApplicationFlowState.Foundation => ContentScreenId.Foundation,
                _ => throw new InvalidOperationException($"State {state} is not a content screen."),
            };
        }
    }
}
