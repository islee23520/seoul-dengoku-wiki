using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using UnityEngine;

namespace Janseon.Foundation.Battle
{
    /// <summary>
    /// D1 session driver: pumps the attached Core battle session once per
    /// PlayerLoop tick using the supplied elapsed seconds. Pause lives here,
    /// outside Core: the driver only gates its own pump, so BattleSimState,
    /// Ledger, and their fingerprints never observe paused time. Commands are
    /// ordered by elapsed seconds and sequence before they are submitted.
    /// </summary>
    public sealed class BattleSessionDriver
    {
        readonly List<BattleTickCommand> inbox = new List<BattleTickCommand>();

        public BattleSimState State { get; private set; }
        public Ledger Ledger { get; private set; }
        public bool Paused { get; set; }
        public long TotalSteps { get; private set; }
        public event Action<object> CommandRejected;
        public event Action StateAdvanced;
        public event Action<int> FrameProcessed;

        public void Attach(BattleSimState state, Ledger ledger)
        {
            State = state ?? throw new ArgumentNullException(nameof(state));
            Ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));
            inbox.Clear();
            TotalSteps = 0;
            Paused = false;
        }

        public void Detach()
        {
            State = null;
            Ledger = null;
            inbox.Clear();
            Paused = false;
        }

        public void Enqueue(BattleTickCommand command)
        {
            if (command == null)
            {
                throw new ArgumentNullException(nameof(command));
            }

            if (State == null)
            {
                throw new InvalidOperationException("Attach a battle session before enqueueing commands.");
            }

            if (command.AtSeconds < State.ElapsedSeconds)
            {
                Reject(BattleSim.Submit(State, Ledger, command));
                return;
            }
            inbox.Add(command.Clone());
            inbox.Sort((a, b) => a.AtSeconds != b.AtSeconds
                ? a.AtSeconds.CompareTo(b.AtSeconds)
                : a.Seq.CompareTo(b.Seq));
        }

        public void SubmitCurrentCommands()
        {
            if (State == null || Ledger == null)
            {
                return;
            }

            SubmitDueCommands();
            if (State.Outcome != BattleOutcomeKind.Ongoing)
            {
                Detach();
            }
        }

        public void FixedUpdate(float fixedDeltaTime)
        {
            if (Paused || State == null || Ledger == null)
            {
                FrameProcessed?.Invoke(0);
                return;
            }
            if (State.Outcome != BattleOutcomeKind.Ongoing)
            {
                Detach();
                FrameProcessed?.Invoke(0);
                return;
            }
            SubmitDueCommands();
            if (State == null || State.Outcome != BattleOutcomeKind.Ongoing)
            {
                FrameProcessed?.Invoke(0);
                return;
            }

            BattleSim.Step(State, Ledger, fixedDeltaTime);
            TotalSteps++;
            StateAdvanced?.Invoke();
            if (State != null && State.Outcome != BattleOutcomeKind.Ongoing)
            {
                Detach();
            }

            FrameProcessed?.Invoke(1);
        }

        public void Tick()
        {
            FixedUpdate(Time.fixedDeltaTime);
        }

        void SubmitDueCommands()
        {
            while (inbox.Count > 0 && inbox[0].AtSeconds <= State.ElapsedSeconds)
            {
                var command = inbox[0];
                inbox.RemoveAt(0);
                Reject(BattleSim.Submit(State, Ledger, command));
            }
        }

        void Reject(object rejection)
        {
            if (rejection != null)
            {
                CommandRejected?.Invoke(rejection);
            }
        }
    }
}
