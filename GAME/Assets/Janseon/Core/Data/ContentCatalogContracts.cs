using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;

namespace Janseon.Core.Data
{
    public interface IReadOnlyCampaignDefinition
    {
        string BattleRulesVersion { get; }
        string PersistentPartyUnitId { get; }
        int PersistentPartyMaxHp { get; }
    }

    public sealed class CampaignDefinitionCatalogItem : IReadOnlyCampaignDefinition
    {
        public string BattleRulesVersion { get; }
        public string PersistentPartyUnitId { get; }
        public int PersistentPartyMaxHp { get; }

        public CampaignDefinitionCatalogItem(
            string battleRulesVersion,
            string persistentPartyUnitId,
            int persistentPartyMaxHp)
        {
            if (string.IsNullOrWhiteSpace(battleRulesVersion))
            {
                throw new ArgumentException(
                    "Battle rules version cannot be null or whitespace.",
                    nameof(battleRulesVersion));
            }

            if (string.IsNullOrWhiteSpace(persistentPartyUnitId))
            {
                throw new ArgumentException(
                    "Persistent party unit id cannot be null or whitespace.",
                    nameof(persistentPartyUnitId));
            }

            if (persistentPartyMaxHp <= 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(persistentPartyMaxHp),
                    persistentPartyMaxHp,
                    "Persistent party max HP must be greater than zero.");
            }

            BattleRulesVersion = battleRulesVersion.Trim();
            PersistentPartyUnitId = persistentPartyUnitId.Trim();
            PersistentPartyMaxHp = persistentPartyMaxHp;
        }
    }

    public interface IReadOnlyStationCatalog
    {
        IReadOnlyList<StationCatalogItem> All { get; }
        bool TryGet(string stableId, out StationCatalogItem item);
        bool TryGetByCoreId(StationId coreId, out StationCatalogItem item);
    }

    public interface IContentFingerprint
    {
        ContentVersionStamp Version { get; }
        string Sha256 { get; }
    }

    public sealed class StationCatalogItem
    {
        public string StableId { get; }
        public StationId CoreStationId { get; }
        public IReadOnlyList<string> NeighborStableIds { get; }

        public StationCatalogItem(
            string stableId,
            StationId coreStationId,
            IEnumerable<string> neighbors)
        {
            if (neighbors == null)
            {
                throw new ArgumentNullException(nameof(neighbors));
            }

            StableId = stableId ?? string.Empty;
            CoreStationId = coreStationId;
            NeighborStableIds = new ReadOnlyCollection<string>(new List<string>(neighbors));
        }
    }

    public sealed class ContentVersionStamp : IEquatable<ContentVersionStamp>
    {
        public int ContentSchema { get; }
        public string ContentVersion { get; }
        public string FingerprintVersion { get; }

        public ContentVersionStamp(
            int contentSchema,
            string contentVersion,
            string fingerprintVersion)
        {
            ContentSchema = contentSchema;
            ContentVersion = contentVersion ?? string.Empty;
            FingerprintVersion = fingerprintVersion ?? string.Empty;
        }

        public bool Equals(ContentVersionStamp other)
        {
            return other != null
                && ContentSchema == other.ContentSchema
                && ContentVersion == other.ContentVersion
                && FingerprintVersion == other.FingerprintVersion;
        }

        public override bool Equals(object obj)
        {
            return Equals(obj as ContentVersionStamp);
        }

        public override int GetHashCode()
        {
            return ContentSchema
                ^ (ContentVersion ?? string.Empty).GetHashCode()
                ^ (FingerprintVersion ?? string.Empty).GetHashCode();
        }
    }

    public sealed class ContentReplayHeader
    {
        public string RulesVersion { get; }
        public int ContentSchema { get; }
        public string ContentVersion { get; }
        public string FingerprintVersion { get; }
        public string ContentFingerprint { get; }

        public ContentReplayHeader(
            string rulesVersion,
            int contentSchema,
            string contentVersion,
            string fingerprintVersion,
            string contentFingerprint)
        {
            RulesVersion = rulesVersion ?? string.Empty;
            ContentSchema = contentSchema;
            ContentVersion = contentVersion ?? string.Empty;
            FingerprintVersion = fingerprintVersion ?? string.Empty;
            ContentFingerprint = contentFingerprint ?? string.Empty;
        }
    }

    public enum ContentMismatchReason
    {
        RulesVersionMismatch,
        ContentSchemaMismatch,
        ContentVersionMismatch,
        FingerprintVersionMismatch,
        ContentFingerprintMismatch
    }

    public sealed class ContentCompatibilityException : Exception
    {
        public ContentMismatchReason Reason { get; }
        public string Expected { get; }
        public string Actual { get; }

        public ContentCompatibilityException(
            ContentMismatchReason reason,
            string expected,
            string actual)
            : base(
                "CONTENT_MISMATCH:"
                + reason
                + ":expected="
                + (expected ?? string.Empty)
                + ":actual="
                + (actual ?? string.Empty))
        {
            Reason = reason;
            Expected = expected ?? string.Empty;
            Actual = actual ?? string.Empty;
        }
    }

    public static class ContentCompatibility
    {
        public static void EnsureCompatible(
            ContentReplayHeader expected,
            string rulesVersion,
            ContentVersionStamp version,
            string fingerprint)
        {
            if (expected == null)
            {
                throw new ArgumentNullException(nameof(expected));
            }

            if (version == null)
            {
                throw new ArgumentNullException(nameof(version));
            }

            Check(ContentMismatchReason.RulesVersionMismatch, expected.RulesVersion, rulesVersion);
            Check(ContentMismatchReason.ContentSchemaMismatch, expected.ContentSchema, version.ContentSchema);
            Check(ContentMismatchReason.ContentVersionMismatch, expected.ContentVersion, version.ContentVersion);
            Check(ContentMismatchReason.FingerprintVersionMismatch, expected.FingerprintVersion, version.FingerprintVersion);
            Check(ContentMismatchReason.ContentFingerprintMismatch, expected.ContentFingerprint, fingerprint);
        }

        private static void Check(ContentMismatchReason reason, object expected, object actual)
        {
            var expectedValue = Convert.ToString(expected, CultureInfo.InvariantCulture) ?? string.Empty;
            var actualValue = Convert.ToString(actual, CultureInfo.InvariantCulture) ?? string.Empty;
            if (!string.Equals(expectedValue, actualValue, StringComparison.Ordinal))
            {
                throw new ContentCompatibilityException(reason, expectedValue, actualValue);
            }
        }
    }
}
