using System;
using System.Collections.Generic;
using System.Text;

namespace Janseon.Core
{
    public enum PlaceKind
    {
        SurfaceDistrict = 0,
        BuildingOrFacility = 1,
        Station = 2,
        StationLayerOrPlatform = 3,
        TunnelSegment = 4,
        Interchange = 5,
        StrategicSite = 6
    }

    public readonly struct PlaceId : IEquatable<PlaceId>, IComparable<PlaceId>
    {
        public PlaceKind Kind { get; }
        public string StableId { get; }

        public PlaceId(PlaceKind kind, string stableId)
        {
            var canonical = stableId == null ? string.Empty : stableId.Trim();
            if (canonical.Length == 0)
            {
                throw new ArgumentException("Place stable id must not be empty.", nameof(stableId));
            }

            Kind = kind;
            StableId = canonical;
        }

        public bool Equals(PlaceId other)
        {
            return Kind == other.Kind
                && string.Equals(StableId, other.StableId, StringComparison.Ordinal);
        }

        public override bool Equals(object obj) => obj is PlaceId other && Equals(other);

        public override int GetHashCode()
        {
            unchecked
            {
                return ((int)Kind * 397) ^ StringComparer.Ordinal.GetHashCode(StableId ?? string.Empty);
            }
        }

        public int CompareTo(PlaceId other)
        {
            var kindOrder = Kind.CompareTo(other.Kind);
            return kindOrder != 0
                ? kindOrder
                : StringComparer.Ordinal.Compare(StableId, other.StableId);
        }

        public override string ToString() => Kind + ":" + StableId;

        public static bool operator ==(PlaceId left, PlaceId right) => left.Equals(right);
        public static bool operator !=(PlaceId left, PlaceId right) => !left.Equals(right);
        public static bool operator <(PlaceId left, PlaceId right) => left.CompareTo(right) < 0;
        public static bool operator >(PlaceId left, PlaceId right) => left.CompareTo(right) > 0;
    }

    public sealed class PlaceMetadata : IEquatable<PlaceMetadata>
    {
        public static readonly PlaceMetadata Empty = new PlaceMetadata();

        public string DongId { get; private set; }
        public string StationId { get; private set; }
        public string LineId { get; private set; }
        public string StopId { get; private set; }
        public string PlatformId { get; private set; }
        public string ConnectorId { get; private set; }
        public string TransferGroupId { get; private set; }
        public string VerticalConnectionId { get; private set; }
        public string Grade { get; private set; }
        public int? ObservedPlatformLevel { get; private set; }
        public PlaceId? FromPlaceId { get; private set; }
        public PlaceId? ToPlaceId { get; private set; }

        PlaceMetadata()
        {
        }

        public static PlaceMetadata ForPlatform(string platformId, int? observedPlatformLevel)
        {
            return new PlaceMetadata
            {
                PlatformId = CanonicalOptional(platformId),
                ObservedPlatformLevel = observedPlatformLevel
            };
        }

        public static PlaceMetadata ForConnection(PlaceId fromPlaceId, PlaceId toPlaceId)
        {
            return new PlaceMetadata
            {
                FromPlaceId = fromPlaceId,
                ToPlaceId = toPlaceId
            };
        }

        public bool Equals(PlaceMetadata other)
        {
            return other != null
                && Same(DongId, other.DongId)
                && Same(StationId, other.StationId)
                && Same(LineId, other.LineId)
                && Same(StopId, other.StopId)
                && Same(PlatformId, other.PlatformId)
                && Same(ConnectorId, other.ConnectorId)
                && Same(TransferGroupId, other.TransferGroupId)
                && Same(VerticalConnectionId, other.VerticalConnectionId)
                && Same(Grade, other.Grade)
                && ObservedPlatformLevel == other.ObservedPlatformLevel
                && FromPlaceId == other.FromPlaceId
                && ToPlaceId == other.ToPlaceId;
        }

        public override bool Equals(object obj) => Equals(obj as PlaceMetadata);

        public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(FingerprintMaterial());

        internal string FingerprintMaterial()
        {
            return Field(DongId) + Field(StationId) + Field(LineId) + Field(StopId)
                + Field(PlatformId) + Field(ConnectorId) + Field(TransferGroupId)
                + Field(VerticalConnectionId) + Field(Grade)
                + Field(ObservedPlatformLevel.HasValue ? ObservedPlatformLevel.Value.ToString() : null)
                + Field(FromPlaceId.HasValue ? FromPlaceId.Value.ToString() : null)
                + Field(ToPlaceId.HasValue ? ToPlaceId.Value.ToString() : null);
        }

        static string CanonicalOptional(string value)
        {
            if (value == null)
            {
                return null;
            }

            var canonical = value.Trim();
            return canonical.Length == 0 ? null : canonical;
        }

        static bool Same(string left, string right) => string.Equals(left, right, StringComparison.Ordinal);
        static string Field(string value) => (value == null ? "-1" : value.Length.ToString()) + ":" + value + ";";
    }

    public sealed class PlaceDefinition : IEquatable<PlaceDefinition>
    {
        public PlaceId Id { get; }
        public string DisplayName { get; }
        public PlaceMetadata Metadata { get; }
        public int? ObservedPlatformLevel => Metadata.ObservedPlatformLevel;

        public PlaceDefinition(PlaceId id, string displayName, PlaceMetadata metadata = null)
        {
            Id = id;
            DisplayName = displayName == null ? string.Empty : displayName.Trim();
            Metadata = metadata ?? PlaceMetadata.Empty;
        }

        public bool Equals(PlaceDefinition other)
        {
            return other != null
                && Id == other.Id
                && string.Equals(DisplayName, other.DisplayName, StringComparison.Ordinal)
                && Metadata.Equals(other.Metadata);
        }

        public override bool Equals(object obj) => Equals(obj as PlaceDefinition);
        public override int GetHashCode() => Id.GetHashCode() ^ StringComparer.Ordinal.GetHashCode(DisplayName) ^ Metadata.GetHashCode();

        internal string FingerprintMaterial()
        {
            return Id + ";name=" + DisplayName.Length + ":" + DisplayName + ";meta=" + Metadata.FingerprintMaterial();
        }
    }

    public sealed class PlaceDefinitionConflictException : Exception
    {
        public PlaceId PlaceId { get; }

        public PlaceDefinitionConflictException(PlaceId placeId)
            : base("PLACE_DEFINITION_CONFLICT:" + placeId)
        {
            PlaceId = placeId;
        }
    }

    public sealed class PlaceDefinitionCatalog
    {
        readonly Dictionary<PlaceId, PlaceDefinition> _definitions = new Dictionary<PlaceId, PlaceDefinition>();

        public int Count => _definitions.Count;

        public PlaceDefinitionCatalog(IEnumerable<PlaceDefinition> definitions)
        {
            if (definitions == null)
            {
                return;
            }

            foreach (var definition in definitions)
            {
                Add(definition);
            }
        }

        public void Add(PlaceDefinition definition)
        {
            if (definition == null)
            {
                throw new ArgumentNullException(nameof(definition));
            }

            if (!_definitions.TryGetValue(definition.Id, out var existing))
            {
                _definitions.Add(definition.Id, definition);
                return;
            }

            if (!existing.Equals(definition))
            {
                throw new PlaceDefinitionConflictException(definition.Id);
            }
        }

        public string Fingerprint()
        {
            var ids = new List<PlaceId>(_definitions.Keys);
            ids.Sort();
            var material = new StringBuilder();
            for (var i = 0; i < ids.Count; i++)
            {
                material.Append(_definitions[ids[i]].FingerprintMaterial()).Append('|');
            }

            return CoreApi.StableHashHex(material.ToString());
        }
    }
}
