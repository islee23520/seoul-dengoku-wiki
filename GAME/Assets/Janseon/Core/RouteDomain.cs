using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Janseon.Core
{
    public enum RouteConnectionKind { Transfer, Vertical, Rail, Walk }
    public enum RouteGrade { Surface, Entrance, Stair, Elevated }
    public enum PassageState { Open, Blocked, Flooded }
    public sealed class RouteConnection
    {
        public readonly PlaceId From; public readonly PlaceId To; public readonly RouteConnectionKind Kind; public readonly RouteGrade Grade; public readonly PassageState State; public readonly string Cause; public readonly string Recovery;
        public RouteConnection(PlaceId from, PlaceId to, RouteConnectionKind kind, RouteGrade grade, PassageState state, string cause = null, string recovery = null) { from.EnsureValid(); to.EnsureValid(); From=from; To=to; Kind=kind; Grade=grade; State=state; Cause=string.IsNullOrWhiteSpace(cause)?null:cause.Trim(); Recovery=string.IsNullOrWhiteSpace(recovery)?null:recovery.Trim(); }
        public bool IsTraversable => State == PassageState.Open;
    }
    /// <summary>
    /// Stable station identity. Value is the sole equality carrier.
    /// </summary>
    public readonly struct StationId : IEquatable<StationId>
    {
        public static readonly StationId Yeongdeungpo = new StationId("Yeongdeungpo");
        public static readonly StationId Sindorim = new StationId("Sindorim");
        public static readonly StationId Guro = new StationId("Guro");

        public readonly string Value;

        public StationId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(StationId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is StationId other && Equals(other);
        public override int GetHashCode() => Value == null ? 0 : StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;

        public static bool operator ==(StationId left, StationId right) => left.Equals(right);
        public static bool operator !=(StationId left, StationId right) => !left.Equals(right);
    }

    public enum TravelRejectReason
    {
        None = 0,
        NotAdjacent = 1,
        SameNode = 2,
        UnknownNode = 3
    }

    public sealed class TravelRejection
    {
        public readonly TravelRejectReason Reason;
        public readonly StationId From;
        public readonly StationId To;

        public TravelRejection(TravelRejectReason reason, StationId from, StationId to)
        {
            Reason = reason;
            From = from;
            To = to;
        }
    }

    public sealed class TravelCommand
    {
        public CommandId Id;
        public StationId Destination;
    }

    /// <summary>
    /// Immutable-style route position. Successful travel returns a new instance.
    /// </summary>
    public sealed class RouteState
    {
        public StationId Current;
        public Tick Tick;
        public int HopCount;
    }

    /// <summary>
    /// Deterministic undirected station graph. Adjacency lists are ordinal-sorted.
    /// </summary>
    public sealed class RouteGraph
    {
        readonly Dictionary<string, List<string>> _adjacency;
        readonly Dictionary<string, RouteConnection> _connections;

        RouteGraph(Dictionary<string, List<string>> adjacency, Dictionary<string, RouteConnection> connections = null)
        {
            _adjacency = adjacency;
            _connections = connections ?? new Dictionary<string, RouteConnection>(StringComparer.Ordinal);
        }

        static string ConnectionKey(PlaceId from, PlaceId to) { var a=from.ToString(); var b=to.ToString(); return string.CompareOrdinal(a,b)<=0?a+"|"+b:b+"|"+a; }
        public static RouteGraph CreateFromConnections(IEnumerable<RouteConnection> connections)
        {
            if (connections == null) throw new ArgumentNullException(nameof(connections));
            var adjacency=new Dictionary<string,List<string>>(StringComparer.Ordinal); var indexed=new Dictionary<string,RouteConnection>(StringComparer.Ordinal);
            foreach (var connection in connections) { if (connection==null) throw new ArgumentException("connection is null",nameof(connections)); if(connection.From==connection.To) continue; indexed[ConnectionKey(connection.From,connection.To)]=connection; if(!adjacency.ContainsKey(connection.From.StableId)) adjacency[connection.From.StableId]=new List<string>(); if(!adjacency.ContainsKey(connection.To.StableId)) adjacency[connection.To.StableId]=new List<string>(); if(connection.IsTraversable) AddUndirected(adjacency,connection.From.StableId,connection.To.StableId); }
            return new RouteGraph(adjacency,indexed);
        }
        public bool CanTraverse(PlaceId from, PlaceId to) { return _connections.TryGetValue(ConnectionKey(from,to),out var c)&&c.IsTraversable; }
        public RouteConnection GetConnection(PlaceId from, PlaceId to) { return _connections[ConnectionKey(from,to)]; }
        public int CountImplicitSameCoordinateEdges() => 0;

        /// <summary>
        /// POC three-station line: Yeongdeungpo—Sindorim—Guro (bidirectional, no direct Y—G).
        /// </summary>
        public static RouteGraph CreateYeongdeungpoSindorimGuro()
        {
            var adjacency = new Dictionary<string, List<string>>(StringComparer.Ordinal);
            AddUndirected(adjacency, StationId.Yeongdeungpo.Value, StationId.Sindorim.Value);
            AddUndirected(adjacency, StationId.Sindorim.Value, StationId.Guro.Value);
            // Sort each adjacency list ordinal for deterministic iteration.
            var keys = new List<string>(adjacency.Keys);
            keys.Sort(StringComparer.Ordinal);
            for (var i = 0; i < keys.Count; i++)
            {
                adjacency[keys[i]].Sort(StringComparer.Ordinal);
            }

            return new RouteGraph(adjacency);
        }

        /// <summary>
        /// Full Seoul catalog: 25 districts, every catalog station, OSM route-relation edges.
        /// Isolated stations are present with empty adjacency. Empty or mismatched arrays throw.
        /// </summary>
        public static RouteGraph CreateSeoul()
        {
            return CreateFromCatalog(
                SeoulWorldGraphCatalog.StationIds,
                SeoulWorldGraphCatalog.EdgeA,
                SeoulWorldGraphCatalog.EdgeB);
        }

        public static RouteGraph CreateFromCatalog(string[] stationIds, string[] edgeA, string[] edgeB)
        {
            if (stationIds == null || stationIds.Length == 0)
            {
                throw new ArgumentException("station catalog is empty", nameof(stationIds));
            }

            if (edgeA == null || edgeB == null || edgeA.Length != edgeB.Length)
            {
                throw new ArgumentException("edge arrays mismatch");
            }

            var adjacency = new Dictionary<string, List<string>>(StringComparer.Ordinal);
            for (var i = 0; i < stationIds.Length; i++)
            {
                var id = stationIds[i] ?? string.Empty;
                if (id.Length == 0)
                {
                    throw new ArgumentException("station id is empty", nameof(stationIds));
                }

                if (!adjacency.ContainsKey(id))
                {
                    adjacency[id] = new List<string>();
                }
            }

            for (var i = 0; i < edgeA.Length; i++)
            {
                var a = edgeA[i] ?? string.Empty;
                var b = edgeB[i] ?? string.Empty;
                if (a.Length == 0 || b.Length == 0)
                {
                    throw new ArgumentException("edge endpoint is empty");
                }

                if (!adjacency.ContainsKey(a) || !adjacency.ContainsKey(b))
                {
                    throw new ArgumentException("edge endpoint is not a catalog station");
                }

                AddUndirected(adjacency, a, b);
            }

            var keys = new List<string>(adjacency.Keys);
            keys.Sort(StringComparer.Ordinal);
            for (var i = 0; i < keys.Count; i++)
            {
                adjacency[keys[i]].Sort(StringComparer.Ordinal);
            }

            return new RouteGraph(adjacency);
        }

        public int StationCount => _adjacency.Count;

        static void AddUndirected(Dictionary<string, List<string>> adjacency, string a, string b)
        {
            if (!adjacency.TryGetValue(a, out var fromA))
            {
                fromA = new List<string>();
                adjacency[a] = fromA;
            }

            if (!adjacency.TryGetValue(b, out var fromB))
            {
                fromB = new List<string>();
                adjacency[b] = fromB;
            }

            if (!ContainsOrdinal(fromA, b))
            {
                fromA.Add(b);
            }

            if (!ContainsOrdinal(fromB, a))
            {
                fromB.Add(a);
            }
        }

        static bool ContainsOrdinal(List<string> list, string value)
        {
            for (var i = 0; i < list.Count; i++)
            {
                if (string.Equals(list[i], value, StringComparison.Ordinal))
                {
                    return true;
                }
            }

            return false;
        }

        public bool Contains(StationId id)
        {
            var key = id.Value ?? string.Empty;
            return _adjacency.ContainsKey(key);
        }

        public StationId[] Neighbors(StationId id)
        {
            var key = id.Value ?? string.Empty;
            if (!_adjacency.TryGetValue(key, out var neighbors) || neighbors.Count == 0)
            {
                return Array.Empty<StationId>();
            }

            var result = new StationId[neighbors.Count];
            for (var i = 0; i < neighbors.Count; i++)
            {
                result[i] = new StationId(neighbors[i]);
            }

            return result;
        }

        public bool AreAdjacent(StationId a, StationId b)
        {
            var left = a.Value ?? string.Empty;
            var right = b.Value ?? string.Empty;
            if (string.Equals(left, right, StringComparison.Ordinal))
            {
                return false;
            }

            if (!_adjacency.TryGetValue(left, out var neighbors))
            {
                return false;
            }

            for (var i = 0; i < neighbors.Count; i++)
            {
                if (string.Equals(neighbors[i], right, StringComparison.Ordinal))
                {
                    return true;
                }
            }

            return false;
        }

        internal static RouteGraph FromAdjacency(Dictionary<string, List<string>> adjacency)
        {
            return new RouteGraph(adjacency);
        }
    }

    public static class RouteApi
    {
        public static RouteState StartAt(StationId station, Tick tick)
        {
            return new RouteState
            {
                Current = station,
                Tick = tick,
                HopCount = 0
            };
        }

        /// <summary>
        /// Attempt a single hop. Success returns a new RouteState and appends one ledger event.
        /// Failure returns TravelRejection and mutates neither state, tick, nor ledger.
        /// </summary>
        public static object TryTravel(RouteGraph graph, RouteState state, Ledger ledger, TravelCommand cmd)
        {
            if (graph == null)
            {
                throw new ArgumentNullException(nameof(graph));
            }

            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            if (ledger == null)
            {
                throw new ArgumentNullException(nameof(ledger));
            }

            if (cmd == null)
            {
                throw new ArgumentNullException(nameof(cmd));
            }

            var from = state.Current;
            var to = cmd.Destination;

            if (from.Equals(to))
            {
                return new TravelRejection(TravelRejectReason.SameNode, from, to);
            }

            if (!graph.Contains(from) || !graph.Contains(to))
            {
                return new TravelRejection(TravelRejectReason.UnknownNode, from, to);
            }

            if (!graph.AreAdjacent(from, to))
            {
                return new TravelRejection(TravelRejectReason.NotAdjacent, from, to);
            }

            // RED skeleton never reaches success because the graph has no edges.
            var nextTick = state.Tick.Next();
            var hop = checked(state.HopCount + 1);
            var summary = CoreApi.StableHashHex(
                "travel=" + (from.Value ?? string.Empty)
                + "->" + (to.Value ?? string.Empty)
                + ";cmd=" + (cmd.Id.Value ?? string.Empty)
                + ";at=" + nextTick.Value.ToString(CultureInfo.InvariantCulture)
                + ";hop=" + hop.ToString(CultureInfo.InvariantCulture));

            ledger.Events.Add(new TypedEvent
            {
                Id = new EventId(
                    "travel-" + nextTick.Value.ToString(CultureInfo.InvariantCulture)
                    + "-" + (cmd.Id.Value ?? "none")),
                CauseId = cmd.Id,
                Value = hop,
                At = nextTick,
                SummaryHash = summary
            });

            return new RouteState
            {
                Current = to,
                Tick = nextTick,
                HopCount = hop
            };
        }

        public static string ComputeRouteHash(RouteState state, Ledger ledger)
        {
            var sb = new StringBuilder(128);
            if (state == null)
            {
                sb.Append("route:null");
            }
            else
            {
                sb.Append("node=").Append(state.Current.Value ?? string.Empty);
                sb.Append(";tick=").Append(state.Tick.Value.ToString(CultureInfo.InvariantCulture));
                sb.Append(";hops=").Append(state.HopCount.ToString(CultureInfo.InvariantCulture));
            }

            if (ledger == null)
            {
                sb.Append(";ledger=null");
            }
            else
            {
                sb.Append(";events=").Append(ledger.Events.Count.ToString(CultureInfo.InvariantCulture));
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
            }

            return CoreApi.StableHashHex(sb.ToString());
        }
    }
}
