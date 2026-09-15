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
        int nextCommand;

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

        public void Attach(BattleSimState state, Ledger ledger)
        {
            State = state ?? throw new ArgumentNullException(nameof(state));
            Ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));
            inbox.Clear();
            nextCommand = 0;
            accumulator = 0.0;
            lastSeconds = realtimeSeconds();
            clockPrimed = true;
            TotalSteps = 0;
        }

        public void Enqueue(BattleTickCommand command)
        {
            if (command == null) throw new ArgumentNullException(nameof(command));
            if (State == null) throw new InvalidOperationException("Attach a battle session before enqueueing commands.");
            inbox.Add(command);
            inbox.Sort((a, b) => a.At.Value != b.At.Value
                ? a.At.Value.CompareTo(b.At.Value)
                : a.Seq.CompareTo(b.Seq));
        }

        public void Tick()
        {
            var now = realtimeSeconds();
            var delta = clockPrimed ? now - lastSeconds : 0.0;
            lastSeconds = now;
            clockPrimed = true;
            if (Paused || State == null || Ledger == null) return;
            if (delta > 0.0) accumulator += delta;
            if (State.Outcome != BattleOutcomeKind.Ongoing || State.Tick >= MaxTicks)
            {
                accumulator = 0.0;
                return;
            }
            var steps = 0;
            while (steps < MaxStepsPerFrame && State.Tick < MaxTicks && accumulator + Epsilon >= TickInterval)
            {
                SubmitDueCommands();
                BattleSim.Step(State, Ledger);
                TotalSteps++;
                steps++;
                accumulator -= TickInterval;
            }
            if (accumulator > TickInterval) accumulator = 0.0;
        }

        void SubmitDueCommands()
        {
            while (nextCommand < inbox.Count && inbox[nextCommand].At.Value == State.Tick)
            {
                var result = BattleSim.Submit(State, Ledger, inbox[nextCommand]);
                if (result != null && CommandRejected != null) CommandRejected(result);
                nextCommand++;
            }
        }
    }
}
