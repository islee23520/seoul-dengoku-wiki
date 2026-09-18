using Janseon.Core;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    public sealed class StrategyMapCatalogTests
    {
        [Test]
        public void CatalogMirrorsTheBakedManifest()
        {
            Assert.That(StrategyMapCatalog.ManifestSchema, Is.EqualTo("seoul-strategy-map-v1"));
            Assert.That(StrategyMapCatalog.Chunks.Length, Is.EqualTo(9));
            Assert.That(StrategyMapCatalog.Zoom, Is.EqualTo(11));
            Assert.That(StrategyMapCatalog.GridPerChunk, Is.EqualTo(128));
            Assert.That(StrategyMapCatalog.VerticalUnitsPerMeter, Is.EqualTo(0.025f).Within(0.0001f));
        }

        [Test]
        public void ChunkBoundsMatchTheBake()
        {
            // First chunk in sorted order: z11 tile 1745/792 (southwest).
            var first = StrategyMapCatalog.Chunks[0];
            Assert.That(first.TileX, Is.EqualTo(1745));
            Assert.That(first.TileY, Is.EqualTo(792));
            Assert.That(first.MinX, Is.EqualTo(-29.3518f).Within(0.01f));
            Assert.That(first.MaxX, Is.EqualTo(-9.7839f).Within(0.01f));
            Assert.That(first.MinZ, Is.EqualTo(-29.3518f).Within(0.01f));
            Assert.That(first.MaxZ, Is.EqualTo(-9.7839f).Within(0.01f));

            var center = StrategyMapCatalog.Chunks[4];
            Assert.That(center.TileX, Is.EqualTo(1746));
            Assert.That(center.TileY, Is.EqualTo(793));
            Assert.That(center.MaxElevMeters, Is.EqualTo(606.44f).Within(0.5f));
        }

        [Test]
        public void UnionBoundsAndElevationMatchTheBake()
        {
            Assert.That(StrategyMapCatalog.UnionMinX, Is.EqualTo(-29.3518f).Within(0.01f));
            Assert.That(StrategyMapCatalog.UnionMaxX, Is.EqualTo(29.3518f).Within(0.01f));
            Assert.That(StrategyMapCatalog.UnionMinZ, Is.EqualTo(-29.3518f).Within(0.01f));
            Assert.That(StrategyMapCatalog.UnionMaxZ, Is.EqualTo(29.3518f).Within(0.01f));
            Assert.That(StrategyMapCatalog.MaxElevMeters, Is.EqualTo(782.375f).Within(0.5f));
            Assert.That(StrategyMapCatalog.VerticesPerChunk, Is.EqualTo(16384));
            Assert.That(StrategyMapCatalog.FacesPerChunk, Is.EqualTo(32258));
        }

        [Test]
        public void ContainsWorldPositionFollowsTheUnionBounds()
        {
            Assert.That(StrategyMapCatalog.ContainsWorldPosition(0f, 0f), Is.True);
            Assert.That(StrategyMapCatalog.ContainsWorldPosition(29.0f, -29.0f), Is.True);
            Assert.That(StrategyMapCatalog.ContainsWorldPosition(30.5f, 0f), Is.False);
            Assert.That(StrategyMapCatalog.ContainsWorldPosition(0f, -30.5f), Is.False);
        }
    }
}
