namespace Janseon.Foundation.AppFlow
{
    public enum ApplicationFlowState
    {
        Booting,
        Transitioning,
        Foundation,
        Faulted,
    }

    public enum ApplicationFlowTrigger
    {
        OpenFoundation,
        SceneLoadSucceeded,
        SceneLoadFailed,
        Retry,
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

        public TransitionDecision TryDispatch(ApplicationFlowTrigger trigger)
        {
            if (TryGetNextState(CurrentState, trigger, out ApplicationFlowState next))
            {
                CurrentState = next;
                return TransitionDecision.Allow();
            }

            return TransitionDecision.Reject(
                CurrentState == ApplicationFlowState.Transitioning
                    ? TransitionRejection.Busy
                    : TransitionRejection.IllegalTransition);
        }

        private static bool TryGetNextState(
            ApplicationFlowState current,
            ApplicationFlowTrigger trigger,
            out ApplicationFlowState next)
        {
            if (current == ApplicationFlowState.Booting && trigger == ApplicationFlowTrigger.OpenFoundation)
            {
                next = ApplicationFlowState.Transitioning;
                return true;
            }

            if (current == ApplicationFlowState.Transitioning && trigger == ApplicationFlowTrigger.SceneLoadSucceeded)
            {
                next = ApplicationFlowState.Foundation;
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
