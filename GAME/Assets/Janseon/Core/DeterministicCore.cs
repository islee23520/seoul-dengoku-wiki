using System;
using System.Collections.Generic;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace Janseon.Core
{
    /// <summary>
    /// Stable string identity for entities. Value is the sole equality carrier.
    /// </summary>
    public readonly struct EntityId : IEquatable<EntityId>
    {
        public readonly string Value;

        public EntityId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(EntityId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is EntityId other && Equals(other);
        public override int GetHashCode() => Value == null ? 0 : StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;
    }

    public readonly struct CommandId : IEquatable<CommandId>
    {
        public readonly string Value;

        public CommandId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(CommandId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is CommandId other && Equals(other);
        public override int GetHashCode() => Value == null ? 0 : StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;
    }

    public readonly struct EventId : IEquatable<EventId>
    {
        public readonly string Value;

        public EventId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(EventId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is EventId other && Equals(other);
        public override int GetHashCode() => Value == null ? 0 : StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;
    }

    /// <summary>
    /// Integer world tick. Domain rules must not use wall clock or frame count.
    /// </summary>
    public readonly struct Tick : IEquatable<Tick>, IComparable<Tick>
    {
        public readonly int Value;

        public Tick(int value)
        {
            Value = value;
        }

        public Tick Next() => new Tick(checked(Value + 1));

        public int CompareTo(Tick other) => Value.CompareTo(other.Value);
        public bool Equals(Tick other) => Value == other.Value;
        public override bool Equals(object obj) => obj is Tick other && Equals(other);
        public override int GetHashCode() => Value;
        public override string ToString() => Value.ToString(CultureInfo.InvariantCulture);
    }

    public readonly struct RequestId : IEquatable<RequestId>
    {
        public readonly string Value;

        public RequestId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(RequestId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is RequestId other && Equals(other);
        public override int GetHashCode() => Value == null ? 0 : StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;
    }

    /// <summary>
    /// Purpose-partitioned RNG streams. Consuming one purpose must not advance another.
    /// </summary>
    public enum RngPurpose
    {
        World = 1,
        Battle = 2,
        Encounter = 3,
        Loot = 4
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
        public CommandId CauseId;
        public int Value;
        public Tick At;
        public string SummaryHash;
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
        public int Accumulator;
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
            PayloadHash = payloadHash ?? string.Empty;
            Token = token ?? string.Empty;
        }

        public bool Equals(Receipt other)
        {
            return other != null
                && ReqId.Equals(other.ReqId)
                && string.Equals(PayloadHash, other.PayloadHash, StringComparison.Ordinal)
                && string.Equals(Token, other.Token, StringComparison.Ordinal);
        }

        public override bool Equals(object obj) => Equals(obj as Receipt);

        public override int GetHashCode()
        {
            unchecked
            {
                var hash = ReqId.GetHashCode();
                hash = (hash * 397) ^ (PayloadHash == null ? 0 : StringComparer.Ordinal.GetHashCode(PayloadHash));
                hash = (hash * 397) ^ (Token == null ? 0 : StringComparer.Ordinal.GetHashCode(Token));
                return hash;
            }
        }
    }

    public sealed class TypedConflict
    {
        public readonly RequestId ReqId;
        public readonly string StoredPayloadHash;
        public readonly string IncomingPayloadHash;

        public TypedConflict(RequestId reqId, string storedPayloadHash, string incomingPayloadHash)
        {
            ReqId = reqId;
            StoredPayloadHash = storedPayloadHash ?? string.Empty;
            IncomingPayloadHash = incomingPayloadHash ?? string.Empty;
        }
    }

    /// <summary>
    /// Deterministic, purpose-partitioned RNG. Each purpose keeps an independent xorshift32 cursor
    /// derived from (masterSeed, purpose). Peek is side-effect free; Consume advances only that purpose.
    /// </summary>
    public sealed class PurposeRng
    {
        readonly int _masterSeed;
        readonly Dictionary<int, uint> _cursors;

        public PurposeRng(int seed)
        {
            _masterSeed = seed;
            _cursors = new Dictionary<int, uint>();
        }

        public int MasterSeed => _masterSeed;

        public int Peek(RngPurpose purpose)
        {
            return unchecked((int)EnsureCursor(purpose));
        }

        public int Consume(RngPurpose purpose)
        {
            var key = (int)purpose;
            var state = EnsureCursor(purpose);
            var drawn = unchecked((int)state);
            _cursors[key] = XorShift32(state);
            return drawn;
        }

        public PurposeRng Clone()
        {
            var clone = new PurposeRng(_masterSeed);
            // Stable key order not required for clone identity of behavior; keys are purpose enums.
            var keys = new List<int>(_cursors.Keys);
            keys.Sort();
            for (var i = 0; i < keys.Count; i++)
            {
                var key = keys[i];
                clone._cursors[key] = _cursors[key];
            }

            return clone;
        }

        public string Fingerprint()
        {
            var sb = new StringBuilder();
            sb.Append("seed=").Append(_masterSeed.ToString(CultureInfo.InvariantCulture));
            var keys = new List<int>(_cursors.Keys);
            keys.Sort();
            for (var i = 0; i < keys.Count; i++)
            {
                var key = keys[i];
                sb.Append(';')
                    .Append(key.ToString(CultureInfo.InvariantCulture))
                    .Append('=')
                    .Append(_cursors[key].ToString(CultureInfo.InvariantCulture));
            }

            return sb.ToString();
        }

        uint EnsureCursor(RngPurpose purpose)
        {
            var key = (int)purpose;
            if (!_cursors.TryGetValue(key, out var state))
            {
                state = MixSeed(_masterSeed, key);
                if (state == 0)
                {
                    state = 0xA5A5A5A5u ^ (uint)key;
                }

                _cursors[key] = state;
            }

            return state;
        }

        static uint MixSeed(int masterSeed, int purpose)
        {
            unchecked
            {
                var x = (uint)masterSeed;
                x ^= (uint)purpose * 0x9E3779B9u;
                x ^= x << 13;
                x ^= x >> 17;
                x ^= x << 5;
                x *= 0x85EBCA6Bu;
                x ^= x >> 13;
                return x == 0 ? 0x6C8E9CF5u : x;
            }
        }

        static uint XorShift32(uint state)
        {
            unchecked
            {
                state ^= state << 13;
                state ^= state >> 17;
                state ^= state << 5;
                return state == 0 ? 0x2545F491u : state;
            }
        }
    }

    /// <summary>
    /// Idempotent request index: same id+payload returns stored receipt; conflicting payload rejects.
    /// </summary>
    public sealed class RequestIndex
    {
        readonly Dictionary<string, Entry> _store = new Dictionary<string, Entry>(StringComparer.Ordinal);
        int _nextToken;

        struct Entry
        {
            public TypedPayload Payload;
            public string PayloadHash;
            public Receipt Receipt;
        }

        public object Issue(RequestId reqId, TypedPayload payload)
        {
            if (payload == null)
            {
                throw new ArgumentNullException(nameof(payload));
            }

            var key = reqId.Value ?? string.Empty;
            var incomingHash = HashPayload(payload);

            if (_store.TryGetValue(key, out var existing))
            {
                if (string.Equals(existing.PayloadHash, incomingHash, StringComparison.Ordinal))
                {
                    return existing.Receipt;
                }

                return new TypedConflict(reqId, existing.PayloadHash, incomingHash);
            }

            _nextToken = checked(_nextToken + 1);
            var token = "rcpt-" + _nextToken.ToString(CultureInfo.InvariantCulture);
            var receipt = new Receipt(reqId, incomingHash, token);
            _store[key] = new Entry
            {
                Payload = payload,
                PayloadHash = incomingHash,
                Receipt = receipt
            };
            return receipt;
        }

        public TypedPayload PeekPayload(RequestId reqId)
        {
            return _store.TryGetValue(reqId.Value ?? string.Empty, out var entry) ? entry.Payload : null;
        }

        static string HashPayload(TypedPayload payload)
        {
            return CoreApi.StableHashHex("payload:" + payload.Value.ToString(CultureInfo.InvariantCulture));
        }
    }

    public static class CoreApi
    {
        public static string ComputeStateHash(WorldState state)
        {
            if (state == null)
            {
                return StableHashHex("state:null");
            }

            var sb = new StringBuilder(128);
            sb.Append("tick=").Append(state.Tick.Value.ToString(CultureInfo.InvariantCulture));
            sb.Append(";seed=").Append(state.RngSeed.ToString(CultureInfo.InvariantCulture));
            sb.Append(";acc=").Append(state.Accumulator.ToString(CultureInfo.InvariantCulture));
            if (state.Rng != null)
            {
                sb.Append(";rng=").Append(state.Rng.Fingerprint());
            }

            return StableHashHex(sb.ToString());
        }

        public static string ComputeLedgerHash(Ledger ledger)
        {
            if (ledger == null)
            {
                return StableHashHex("ledger:null");
            }

            var sb = new StringBuilder(256);
            sb.Append("stamp=").Append(ledger.Stamp ?? string.Empty);
            sb.Append(";count=").Append(ledger.Events.Count.ToString(CultureInfo.InvariantCulture));
            for (var i = 0; i < ledger.Events.Count; i++)
            {
                var e = ledger.Events[i];
                sb.Append('|')
                    .Append(i.ToString(CultureInfo.InvariantCulture))
                    .Append(':')
                    .Append(e.Id.Value ?? string.Empty)
                    .Append(',')
                    .Append(e.CauseId.Value ?? string.Empty)
                    .Append(',')
                    .Append(e.Value.ToString(CultureInfo.InvariantCulture))
                    .Append(',')
                    .Append(e.At.Value.ToString(CultureInfo.InvariantCulture))
                    .Append(',')
                    .Append(e.SummaryHash ?? string.Empty);
            }

            return StableHashHex(sb.ToString());
        }

        public static (WorldState State, Ledger Ledger) Replay(WorldState initial, TypedCommand cmd)
        {
            if (initial == null)
            {
                throw new ArgumentNullException(nameof(initial));
            }

            var nextTick = initial.Tick.Next();
            var rng = initial.Rng != null ? initial.Rng.Clone() : new PurposeRng(initial.RngSeed);
            var accumulator = initial.Accumulator;

            var ledger = new Ledger();
            if (cmd != null)
            {
                // Domain apply: fold command value into accumulator; draw world stream once for salt.
                var salt = rng.Consume(RngPurpose.World);
                accumulator = unchecked(accumulator + cmd.Value + (salt & 0xFFFF));

                var summary = StableHashHex(
                    "cmd=" + (cmd.Id.Value ?? string.Empty)
                    + ";val=" + cmd.Value.ToString(CultureInfo.InvariantCulture)
                    + ";at=" + nextTick.Value.ToString(CultureInfo.InvariantCulture)
                    + ";salt=" + salt.ToString(CultureInfo.InvariantCulture)
                    + ";acc=" + accumulator.ToString(CultureInfo.InvariantCulture));

                var eventId = new EventId(
                    "evt-" + nextTick.Value.ToString(CultureInfo.InvariantCulture)
                    + "-" + (cmd.Id.Value ?? "none"));

                ledger.Events.Add(new TypedEvent
                {
                    Id = eventId,
                    CauseId = cmd.Id,
                    Value = cmd.Value,
                    At = nextTick,
                    SummaryHash = summary
                });
            }

            var next = new WorldState
            {
                Tick = nextTick,
                RngSeed = initial.RngSeed,
                Rng = rng,
                Accumulator = accumulator
            };

            ledger.Stamp = ComputeLedgerHash(ledger) + ":" + ComputeStateHash(next);
            return (next, ledger);
        }

        /// <summary>
        /// Canonical map serialization: keys sorted ordinal ascending. Stable across insertion order.
        /// </summary>
        public static string CanonicalSerialize(IDictionary<string, int> map)
        {
            if (map == null)
            {
                return "{}";
            }

            var keys = new List<string>(map.Count);
            foreach (var key in map.Keys)
            {
                keys.Add(key);
            }

            keys.Sort(StringComparer.Ordinal);

            var sb = new StringBuilder();
            sb.Append('{');
            for (var i = 0; i < keys.Count; i++)
            {
                if (i > 0)
                {
                    sb.Append(',');
                }

                var key = keys[i];
                sb.Append('"').Append(Escape(key)).Append('"')
                    .Append(':')
                    .Append(map[key].ToString(CultureInfo.InvariantCulture));
            }

            sb.Append('}');
            return sb.ToString();
        }

        public static string StableHashHex(string content)
        {
            var bytes = Encoding.UTF8.GetBytes(content ?? string.Empty);
            // SHA256 is deterministic content hashing; not Object.GetHashCode.
            using (var sha = SHA256.Create())
            {
                var hash = sha.ComputeHash(bytes);
                var sb = new StringBuilder(hash.Length * 2);
                for (var i = 0; i < hash.Length; i++)
                {
                    sb.Append(hash[i].ToString("x2", CultureInfo.InvariantCulture));
                }

                return sb.ToString();
            }
        }

        static string Escape(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }

            return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
