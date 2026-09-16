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
    /// rendered frame rate. Pause lives here, outside Core: the driver only gates
    /// its own pump, so BattleSimState, Ledger, and their fingerprints never
    /// observe it. Command consumption mirrors <see cref="BattleSim.Replay"/>,
    /// so a driver-driven run replays bit-identically to a direct Core replay.
    /// </summary>
    public sealed class BattleSessionDriver : ITickable
    {
        public const int TicksPerSecond = BattleRules.TicksPerSecond;
        public const int MaxStepsPerFrame = 4;

        readonly Func<double> realtimeSeconds;
        readonly List<BattleTickCommand> inbox = new List<BattleTickCommand>();

        public BattleSessionDriver(Func<double> realtimeSeconds)
        {
            this.realtimeSeconds = realtimeSeconds ?? throw new ArgumentNullException(nameof(realtimeSeconds));
        }

        public BattleSimState State { get; private set; }
        public Ledger Ledger { get; private set; }
        public bool Paused { get; set; }
        public double TickInterval => 1.0 / TicksPerSecond;
        public double AccumulatorSeconds => 0;
        public long TotalSteps { get; private set; }
        public int MaxTicks { get; set; } = BattleRules.MaxTicks;

        public event Action<object> CommandRejected;

        public void Attach(BattleSimState state, Ledger ledger)
        {
            State = state ?? throw new ArgumentNullException(nameof(state));
            Ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));
        }

        public void Enqueue(BattleTickCommand command)
        {
            if (command == null) throw new ArgumentNullException(nameof(command));
            if (State == null) throw new InvalidOperationException("Attach a battle session before enqueueing commands.");
            inbox.Add(command);
        }

        public void Tick()
        {
            // RED stub: contract tests fail until the fixed-step pump lands.
        }
    }
}
