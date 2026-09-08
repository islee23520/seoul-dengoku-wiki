using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using VContainer.Unity;

namespace Janseon.Foundation.Battle
{
    /// <summary>
    /// D1 session driver: pumps the attached Core battle session on a fixed 30 Hz
    /// cadence driven by an injected monotonic seconds source, decoupled from the
    /// rendered frame rate. At most <see cref="MaxStepsPerFrame"/> BattleSim.Step
    /// calls run per Tick() (rendered frame). A frame whose elapsed time exceeds
    /// that budget sacrifices its excess instead of bursting later; sub-tick
    /// residue is preserved, so leftover accumulator carry stays bounded below
    /// one tick interval. Pause lives here, outside Core: the driver only gates
    /// its own pump and discards paused wall-time, so BattleSimState, Ledger,
    /// and their fingerprints never observe a pause. Command consumption mirrors
    /// BattleSim.Replay ((At, Seq)-sorted inbox, due commands submitted before
    /// their tick's Step), so a driver-driven run replays identically to a
    /// direct Core replay of the same command schedule.
    /// </summary>
    public sealed class BattleSessionDriver : ITickable
    {
        public const int TicksPerSecond = BattleRules.TicksPerSecond;
        public const int MaxStepsPerFrame = 4;
        const double Epsilon = 1e-9;

        readonly Func<double> realtimeSeconds;
        readonly List<BattleTickCommand> inbox = new List<BattleTickCommand>();

        bool clockPrimed;
        double lastSeconds;
        double accumulator;

        public BattleSessionDriver(Func<double> realtimeSeconds)
        {
            this.realtimeSeconds = realtimeSeconds ?? throw new ArgumentNullException(nameof(realtimeSeconds));
        }

        public BattleSimState State { get; private set; }
        public Ledger Ledger { get; private set; }
        public bool Paused { get; set; }
        public double TickInterval => 1.0 / TicksPerSecond;
        public double AccumulatorSeconds => accumulator;
        public long TotalSteps { get; private set; }
        public int MaxTicks { get; set; } = BattleRules.MaxTicks;

        public event Action<object> CommandRejected;
        public event Action StateAdvanced;
        public event Action<int> FrameProcessed;

        public void Attach(BattleSimState state, Ledger ledger)
        {
            State = state ?? throw new ArgumentNullException(nameof(state));
            Ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));
            inbox.Clear();
            accumulator = 0.0;
            lastSeconds = realtimeSeconds();
            clockPrimed = true;
            TotalSteps = 0;
            Paused = false;
        }

        public void Detach()
        {
            State = null;
            Ledger = null;
            inbox.Clear();
            accumulator = 0.0;
            Paused = false;
        }

        public void Enqueue(BattleTickCommand command)
        {
            if (command == null) throw new ArgumentNullException(nameof(command));
            if (State == null) throw new InvalidOperationException("Attach a battle session before enqueueing commands.");
            if (command.At.Value < State.Tick)
            {
                Reject(BattleSim.Submit(State, Ledger, command));
                return;
            }
            inbox.Add(command);
            inbox.Sort((a, b) => a.At.Value != b.At.Value
                ? a.At.Value.CompareTo(b.At.Value)
                : a.Seq.CompareTo(b.Seq));
        }

        public void SubmitCurrentCommands()
        {
            if (State == null || Ledger == null) return;
            SubmitDueCommands();
            if (State.Outcome != BattleOutcomeKind.Ongoing) Detach();
        }

        public void Tick()
        {
            var now = realtimeSeconds();
            var delta = clockPrimed ? now - lastSeconds : 0.0;
            lastSeconds = now;
            clockPrimed = true;
            if (Paused || State == null || Ledger == null)
            {
                FrameProcessed?.Invoke(0);
                return;
            }
            if (delta > 0.0) accumulator += delta;
            if (State.Outcome != BattleOutcomeKind.Ongoing || State.Tick >= MaxTicks)
            {
                accumulator = 0.0;
                Detach();
                FrameProcessed?.Invoke(0);
                return;
            }
            var steps = 0;
            while (State != null
                   && steps < MaxStepsPerFrame
                   && State.Tick < MaxTicks
                   && State.Outcome == BattleOutcomeKind.Ongoing
                   && accumulator + Epsilon >= TickInterval)
            {
                SubmitDueCommands();
                if (State == null || State.Outcome != BattleOutcomeKind.Ongoing) break;
                BattleSim.Step(State, Ledger);
                TotalSteps++;
                steps++;
                accumulator -= TickInterval;
                StateAdvanced?.Invoke();
            }
            if (State != null && (State.Outcome != BattleOutcomeKind.Ongoing || State.Tick >= MaxTicks)) Detach();
            if (accumulator > TickInterval) accumulator = 0.0;
            FrameProcessed?.Invoke(steps);
        }

        void SubmitDueCommands()
        {
            while (inbox.Count > 0 && inbox[0].At.Value <= State.Tick)
            {
                var command = inbox[0];
                inbox.RemoveAt(0);
                Reject(BattleSim.Submit(State, Ledger, command));
            }
        }

        void Reject(object rejection)
        {
            if (rejection != null) CommandRejected?.Invoke(rejection);
        }
    }
}
