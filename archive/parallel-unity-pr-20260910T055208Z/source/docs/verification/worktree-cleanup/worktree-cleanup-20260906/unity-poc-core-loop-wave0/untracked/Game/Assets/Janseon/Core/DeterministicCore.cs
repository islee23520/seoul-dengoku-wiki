using System;
using System.Collections.Generic;
using System.Text;

namespace Janseon.Core
{
    public readonly struct EntityId
    {
        public readonly string Value;
        public EntityId(string value) => Value = value;
    }

    public readonly struct CommandId
    {
        public readonly string Value;
        public CommandId(string value) => Value = value;
    }

    public readonly struct EventId
    {
        public readonly string Value;
        public EventId(string value) => Value = value;
    }

    public readonly struct Tick
    {
        public readonly int Value;
        public Tick(int value) => Value = value;
    }

    public readonly struct RequestId
    {
        public readonly string Value;
        public RequestId(string value) => Value = value;
    }

    public enum RngPurpose
    {
        World = 1,
        Battle = 2
    }

    public sealed class TypedCommand
    {
        public CommandId Id;
        public int Value;
        public Tick At;
    }

    public sealed class TypedEvent
    {
        public EventId Id;
        public int Value;
        public Tick At;
    }

    public sealed class TypedPayload
    {
        public int Value;
    }

    public sealed class WorldState
    {
        public Tick Tick;
        public int RngSeed;
        public PurposeRng Rng;
    }

    public sealed class Ledger
    {
        public readonly List<TypedEvent> Events = new List<TypedEvent>();
        public string Stamp;
    }

    public sealed class Receipt : IEquatable<Receipt>
    {
        public readonly RequestId ReqId;
        public readonly string PayloadHash;
        public readonly string Token;

        public Receipt(RequestId reqId, string payloadHash, string token)
        {
            ReqId = reqId;
            PayloadHash = payloadHash;
            Token = token;
        }

        public bool Equals(Receipt other)
        {
            return other != null
                && ReqId.Value == other.ReqId.Value
                && PayloadHash == other.PayloadHash
                && Token == other.Token;
        }

        public override bool Equals(object obj) => Equals(obj as Receipt);
    }

    public sealed class TypedConflict
    {
        public readonly RequestId ReqId;
        public readonly string StoredPayloadHash;
        public readonly string IncomingPayloadHash;

        public TypedConflict(RequestId reqId, string storedPayloadHash, string incomingPayloadHash)
        {
            ReqId = reqId;
            StoredPayloadHash = storedPayloadHash;
            IncomingPayloadHash = incomingPayloadHash;
        }
    }

    // RED: one shared cursor. Consume(Battle) perturbs Peek(World).
    public sealed class PurposeRng
    {
        int _cursor;

        public PurposeRng(int seed) => _cursor = seed;

        public int Peek(RngPurpose purpose) => _cursor;

        public int Consume(RngPurpose purpose)
        {
            _cursor += (int)purpose;
            return _cursor;
        }
    }

    public sealed class RequestIndex
    {
        readonly Dictionary<string, (TypedPayload Payload, Receipt Receipt)> _store =
            new Dictionary<string, (TypedPayload, Receipt)>();

        public object Issue(RequestId reqId, TypedPayload payload)
        {
            // RED: always mint a fresh receipt and overwrite; never conflict.
            var receipt = new Receipt(reqId, payload.Value.ToString(), Guid.NewGuid().ToString("N"));
            _store[reqId.Value] = (payload, receipt);
            return receipt;
        }

        public TypedPayload PeekPayload(RequestId reqId)
        {
            return _store.TryGetValue(reqId.Value, out var entry) ? entry.Payload : null;
        }
    }

    public static class CoreApi
    {
        public static string ComputeStateHash(WorldState state)
        {
            // RED: unstable hash — not a function of state.
            return Guid.NewGuid().ToString("N");
        }

        public static string ComputeLedgerHash(Ledger ledger)
        {
            // RED: unstable hash — not a function of ledger.
            return Guid.NewGuid().ToString("N");
        }

        public static (WorldState State, Ledger Ledger) Replay(WorldState initial, TypedCommand cmd)
        {
            // RED: ignores canonical command application; stamps unique junk.
            var next = new WorldState
            {
                Tick = new Tick(initial.Tick.Value + 1),
                RngSeed = initial.RngSeed,
                Rng = new PurposeRng(initial.RngSeed)
            };
            var ledger = new Ledger { Stamp = Guid.NewGuid().ToString("N") };
            if (cmd != null)
            {
                ledger.Events.Add(new TypedEvent
                {
                    Id = new EventId(Guid.NewGuid().ToString("N")),
                    Value = cmd.Value,
                    At = next.Tick
                });
            }

            return (next, ledger);
        }

        public static string CanonicalSerialize(IDictionary<string, int> map)
        {
            // RED: insertion-order sensitive and instance-unstable; not canonical.
            var sb = new StringBuilder();
            sb.Append('{');
            bool first = true;
            foreach (var kv in map)
            {
                if (!first) sb.Append(',');
                sb.Append('"').Append(kv.Key).Append('"').Append(':').Append(kv.Value);
                first = false;
            }

            sb.Append('}');
            return sb.ToString() + "|" + Guid.NewGuid().ToString("N");
        }
    }
}
