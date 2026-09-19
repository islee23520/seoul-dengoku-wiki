using System;
using System.IO;
using System.Text;
using Janseon.Core;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    [TestFixture]
    public sealed class PlaceIdentityTests
    {
        [Test]
        public void StationIdUsesExactOrdinalIdentity()
        {
            var canonical = new StationId("Sindorim");
            var same = new StationId("Sindorim");
            var differentCase = new StationId("sindorim");

            Assert.AreEqual(canonical, same);
            Assert.AreEqual(canonical.GetHashCode(), same.GetHashCode());
            Assert.AreNotEqual(canonical, differentCase);
        }

        [Test]
        public void IdentityIgnoresObservedLevel()
        {
            var identity = new PlaceId(PlaceKind.StationLayerOrPlatform, "platform.sindorim.1.2");
            var unknownLevel = new PlaceDefinition(
                identity,
                "신도림 1호선 2번 승강장",
                PlaceMetadata.ForPlatform("platform.sindorim.1.2", null));
            var observedLevel = new PlaceDefinition(
                identity,
                "신도림 1호선 2번 승강장",
                PlaceMetadata.ForPlatform("platform.sindorim.1.2", 3));
            var differentPlatform = new PlaceId(
                PlaceKind.StationLayerOrPlatform,
                "platform.sindorim.1.3");

            Assert.AreEqual(unknownLevel.Id, observedLevel.Id);
            Assert.AreEqual(unknownLevel.Id.GetHashCode(), observedLevel.Id.GetHashCode());
            Assert.IsNull(unknownLevel.ObservedPlatformLevel);
            Assert.AreEqual(3, observedLevel.ObservedPlatformLevel);
            Assert.AreNotEqual(identity, differentPlatform);
        }

        [Test]
        public void DuplicateIdWithConflictingMetadataIsRejected()
        {
            var id = new PlaceId(PlaceKind.TunnelSegment, "tunnel.sindorim.guro");
            var original = new PlaceDefinition(
                id,
                "신도림-구로 터널",
                PlaceMetadata.ForConnection(
                    new PlaceId(PlaceKind.Station, "station.sindorim"),
                    new PlaceId(PlaceKind.Station, "station.guro")));
            var conflict = new PlaceDefinition(
                id,
                "신도림-구로 터널",
                PlaceMetadata.ForConnection(
                    new PlaceId(PlaceKind.Station, "station.sindorim"),
                    new PlaceId(PlaceKind.Station, "station.daerim")));
            var catalog = new PlaceDefinitionCatalog(new[] { original });
            var beforeFingerprint = catalog.Fingerprint();

            var error = Assert.Throws<PlaceDefinitionConflictException>(() => catalog.Add(conflict));

            Assert.AreEqual(id, error.PlaceId);
            Assert.AreEqual(beforeFingerprint, catalog.Fingerprint());
            Assert.AreEqual(1, catalog.Count);
        }

        [Test]
        public void StableIdBoundaryRejectsNullOrWhitespaceAndPreservesOrdinalIdentity()
        {
            Assert.Throws<ArgumentException>(() => new PlaceId(PlaceKind.Station, null));
            Assert.Throws<ArgumentException>(() => new PlaceId(PlaceKind.Station, "  \t "));

            var trimmed = new PlaceId(PlaceKind.Station, "  station.Sindorim  ");
            var canonical = new PlaceId(PlaceKind.Station, "station.Sindorim");
            var differentCase = new PlaceId(PlaceKind.Station, "station.sindorim");

            Assert.AreEqual("station.Sindorim", trimmed.StableId);
            Assert.AreEqual(trimmed, canonical);
            Assert.AreNotEqual(trimmed, differentCase);
        }

        [Test]
        public void UndefinedPlaceKindIsRejected()
        {
            var negative = Assert.Throws<ArgumentException>(
                () => new PlaceId((PlaceKind)(-1), "station.invalid-negative"));
            var large = Assert.Throws<ArgumentException>(
                () => new PlaceId((PlaceKind)int.MaxValue, "station.invalid-large"));

            StringAssert.Contains("kind", negative.Message.ToLowerInvariant());
            StringAssert.Contains("kind", large.Message.ToLowerInvariant());
        }

        [Test]
        public void DefaultPlaceIdCannotEnterCatalog()
        {
            var catalog = new PlaceDefinitionCatalog(null);

            Assert.Throws<ArgumentException>(() => new PlaceDefinition(default, "invalid"));
            Assert.AreEqual(0, catalog.Count);
        }

        [Test]
        public void DefaultPlaceIdReportsInvalid()
        {
            Assert.IsFalse(default(PlaceId).IsValid);
        }

        [Test]
        public void IdenticalDuplicateIsIdempotent()
        {
            var definition = new PlaceDefinition(
                new PlaceId(PlaceKind.StationLayerOrPlatform, "platform.sindorim.1.2"),
                "신도림 승강장",
                PlaceMetadata.ForPlatform("platform.sindorim.1.2", 3));
            var catalog = new PlaceDefinitionCatalog(new[] { definition });
            var beforeFingerprint = catalog.Fingerprint();

            Assert.DoesNotThrow(() => catalog.Add(new PlaceDefinition(
                definition.Id,
                definition.DisplayName,
                PlaceMetadata.ForPlatform("platform.sindorim.1.2", 3))));

            Assert.AreEqual(1, catalog.Count);
            Assert.AreEqual(beforeFingerprint, catalog.Fingerprint());
        }

        [Test]
        public void SameDisplayNameWithDifferentStableIdRemainsDistinct()
        {
            var first = new PlaceDefinition(
                new PlaceId(PlaceKind.BuildingOrFacility, "facility.market.east"),
                "중앙시장");
            var second = new PlaceDefinition(
                new PlaceId(PlaceKind.BuildingOrFacility, "facility.market.west"),
                "중앙시장");

            Assert.AreNotEqual(first.Id, second.Id);
        }

        [Test]
        public void ManualDataSurfaceRecordsIdentityAndConflict()
        {
            var id = new PlaceId(PlaceKind.StationLayerOrPlatform, "platform.sindorim.1.2");
            var unknown = new PlaceDefinition(id, "신도림 승강장", PlaceMetadata.ForPlatform(id.StableId, null));
            var observed = new PlaceDefinition(id, "신도림 승강장", PlaceMetadata.ForPlatform(id.StableId, 3));
            var differentPlatform = new PlaceId(PlaceKind.StationLayerOrPlatform, "platform.sindorim.1.3");
            var tunnelId = new PlaceId(PlaceKind.TunnelSegment, "tunnel.sindorim.guro");
            var original = new PlaceDefinition(
                tunnelId,
                "신도림-구로 터널",
                PlaceMetadata.ForConnection(
                    new PlaceId(PlaceKind.Station, "station.sindorim"),
                    new PlaceId(PlaceKind.Station, "station.guro")));
            var conflict = new PlaceDefinition(
                tunnelId,
                "신도림-구로 터널",
                PlaceMetadata.ForConnection(
                    new PlaceId(PlaceKind.Station, "station.sindorim"),
                    new PlaceId(PlaceKind.Station, "station.daerim")));
            var catalog = new PlaceDefinitionCatalog(new[] { original });
            var before = catalog.Fingerprint();
            var error = Assert.Throws<PlaceDefinitionConflictException>(() => catalog.Add(conflict));
            var after = catalog.Fingerprint();
            var identityEqual = unknown.Id == observed.Id;
            var hashEqual = unknown.Id.GetHashCode() == observed.Id.GetHashCode();
            var differentPlatformUnequal = id != differentPlatform;
            var catalogUnchanged = string.Equals(before, after, StringComparison.Ordinal);

            Assert.IsTrue(identityEqual);
            Assert.IsTrue(hashEqual);
            Assert.IsTrue(differentPlatformUnequal);
            Assert.IsTrue(catalogUnchanged);

            var outputPath = Environment.GetEnvironmentVariable("JANSEON_PLACE_ID_QA_OUTPUT");
            var implementationCommit = Environment.GetEnvironmentVariable("JANSEON_PLACE_ID_QA_IMPLEMENTATION_COMMIT");
            var sourceManifestSha256 = Environment.GetEnvironmentVariable("JANSEON_PLACE_ID_QA_SOURCE_MANIFEST_SHA256");
            Assert.IsFalse(string.IsNullOrWhiteSpace(outputPath));
            Assert.IsFalse(string.IsNullOrWhiteSpace(implementationCommit));
            Assert.IsFalse(string.IsNullOrWhiteSpace(sourceManifestSha256));
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            var json = new StringBuilder();
            json.AppendLine("{");
            json.AppendLine("  \"schema_version\": \"task02-manual-place-id.v2\",");
            json.AppendLine("  \"behavior_contract_version\": \"place-identity.v2\",");
            json.AppendLine("  \"implementation_commit\": \"" + implementationCommit + "\",");
            json.AppendLine("  \"source_manifest_sha256\": \"" + sourceManifestSha256 + "\",");
            json.AppendLine("  \"canonical_id\": \"" + id + "\",");
            json.AppendLine("  \"unknown_observed_level\": " + NullableIntJson(unknown.ObservedPlatformLevel) + ",");
            json.AppendLine("  \"observed_level\": " + NullableIntJson(observed.ObservedPlatformLevel) + ",");
            json.AppendLine("  \"identity_equal\": " + BooleanJson(identityEqual) + ",");
            json.AppendLine("  \"hash_equal\": " + BooleanJson(hashEqual) + ",");
            json.AppendLine("  \"different_platform_id\": \"" + differentPlatform + "\",");
            json.AppendLine("  \"different_platform_unequal\": " + BooleanJson(differentPlatformUnequal) + ",");
            json.AppendLine("  \"conflict_error\": \"" + error.GetType().Name + "\",");
            json.AppendLine("  \"catalog_fingerprint_before\": \"" + before + "\",");
            json.AppendLine("  \"catalog_fingerprint_after\": \"" + after + "\",");
            json.AppendLine("  \"catalog_unchanged\": " + BooleanJson(catalogUnchanged));
            json.AppendLine("}");
            File.WriteAllText(outputPath, json.ToString());
            TestContext.WriteLine("PLACE_ID_MANUAL_QA=" + outputPath);
        }

        static string BooleanJson(bool value) => value ? "true" : "false";
        static string NullableIntJson(int? value) => value.HasValue ? value.Value.ToString() : "null";
    }
}
