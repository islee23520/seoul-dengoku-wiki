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

            Assert.AreEqual(unknown.Id, observed.Id);
            Assert.AreEqual(unknown.Id.GetHashCode(), observed.Id.GetHashCode());
            Assert.AreNotEqual(id, differentPlatform);
            Assert.AreEqual(before, after);

            var outputPath = Environment.GetEnvironmentVariable("JANSEON_PLACE_ID_QA_OUTPUT");
            Assert.IsFalse(string.IsNullOrWhiteSpace(outputPath));
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
            var json = new StringBuilder();
            json.AppendLine("{");
            json.AppendLine("  \"head\": \"" + Environment.GetEnvironmentVariable("JANSEON_PLACE_ID_QA_HEAD") + "\",");
            json.AppendLine("  \"source_fingerprint\": \"" + Environment.GetEnvironmentVariable("JANSEON_PLACE_ID_QA_SOURCE_FINGERPRINT") + "\",");
            json.AppendLine("  \"canonical_id\": \"" + id + "\",");
            json.AppendLine("  \"unknown_observed_level\": null,");
            json.AppendLine("  \"observed_level\": 3,");
            json.AppendLine("  \"identity_equal\": true,");
            json.AppendLine("  \"hash_equal\": true,");
            json.AppendLine("  \"different_platform_id\": \"" + differentPlatform + "\",");
            json.AppendLine("  \"different_platform_unequal\": true,");
            json.AppendLine("  \"conflict_error\": \"" + error.GetType().Name + "\",");
            json.AppendLine("  \"catalog_fingerprint_before\": \"" + before + "\",");
            json.AppendLine("  \"catalog_fingerprint_after\": \"" + after + "\",");
            json.AppendLine("  \"catalog_unchanged\": true");
            json.AppendLine("}");
            File.WriteAllText(outputPath, json.ToString());
            TestContext.WriteLine("PLACE_ID_MANUAL_QA=" + outputPath);
        }
    }
}
