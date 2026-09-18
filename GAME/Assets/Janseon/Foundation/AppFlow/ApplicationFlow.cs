namespace Janseon.Foundation.AppFlow
{
    public enum ApplicationFlowState
    {
        Booting,
        Transitioning,
        MainTitle,
        Foundation,
        Faulted,
    }

    public enum ApplicationFlowTrigger
    {
        OpenMainTitle,
        OpenFoundation,
        SceneLoadSucceeded,
        SceneLoadFailed,
        Retry,
    }

    public enum ContentScreenId
    {
        MainTitle,
        Foundation,
    }

    public enum TransitionRejection
    {
        None,
        IllegalTransition,
        Busy,
    }

    public readonly struct TransitionDecision
    {
        private TransitionDecision(bool accepted, TransitionRejection rejection)
        {
            Accepted = accepted;
            Rejection = rejection;
        }

        public bool Accepted { get; }
        public TransitionRejection Rejection { get; }

        public static TransitionDecision Allow() => new(true, TransitionRejection.None);

        public static TransitionDecision Reject(TransitionRejection rejection) => new(false, rejection);
    }

    public sealed class ApplicationFlowMachine
    {
        public ApplicationFlowState CurrentState { get; private set; } = ApplicationFlowState.Booting;

        /// <summary>
        /// Destination retained across Transitioning/Faulted until a successful commit clears it.
        /// </summary>
        public ApplicationFlowState? PendingTarget { get; private set; }

        public TransitionDecision TryDispatch(ApplicationFlowTrigger trigger)
        {
            if (TryGetNextState(CurrentState, trigger, out ApplicationFlowState next, out ApplicationFlowState? pending))
            {
                CurrentState = next;
                if (pending.HasValue)
                {
                    PendingTarget = pending;
                }

                return TransitionDecision.Allow();
            }

            return TransitionDecision.Reject(
                CurrentState == ApplicationFlowState.Transitioning
                    ? TransitionRejection.Busy
                    : TransitionRejection.IllegalTransition);
        }

        /// <summary>
        /// Commits PendingTarget as the stable content state after readiness and exclusive lease swap.
        /// </summary>
        public bool TryCommitPendingTarget()
        {
            if (CurrentState != ApplicationFlowState.Transitioning || !PendingTarget.HasValue)
            {
                return false;
            }

            CurrentState = PendingTarget.Value;
            PendingTarget = null;
            return true;
        }

        private static bool TryGetNextState(
            ApplicationFlowState current,
            ApplicationFlowTrigger trigger,
            out ApplicationFlowState next,
            out ApplicationFlowState? pendingTarget)
        {
            pendingTarget = null;

            if (current == ApplicationFlowState.Booting && trigger == ApplicationFlowTrigger.OpenMainTitle)
            {
                next = ApplicationFlowState.Transitioning;
                pendingTarget = ApplicationFlowState.MainTitle;
                return true;
            }

            if (current == ApplicationFlowState.MainTitle && trigger == ApplicationFlowTrigger.OpenFoundation)
            {
                next = ApplicationFlowState.Transitioning;
                pendingTarget = ApplicationFlowState.Foundation;
                return true;
            }

            if (current == ApplicationFlowState.Foundation && trigger == ApplicationFlowTrigger.OpenMainTitle)
            {
                next = ApplicationFlowState.Transitioning;
                pendingTarget = ApplicationFlowState.MainTitle;
                return true;
            }

            if (current == ApplicationFlowState.Transitioning && trigger == ApplicationFlowTrigger.SceneLoadFailed)
            {
                next = ApplicationFlowState.Faulted;
                return true;
            }

            if (current == ApplicationFlowState.Faulted && trigger == ApplicationFlowTrigger.Retry)
            {
                next = ApplicationFlowState.Transitioning;
                return true;
            }

            next = current;
            return false;
        }
    }
}
