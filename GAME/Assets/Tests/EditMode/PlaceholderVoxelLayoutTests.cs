using Janseon.Core;
using Janseon.Foundation.Presentation;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class PlaceholderVoxelLayoutTests
    {
        [Test]
        public void TileSizeMatchesGenreContract()
        {
            Assert.That(
                PlaceholderVoxelLayout.TileSize,
                Is.EqualTo(Janseon.Foundation.GenreContract.TileUnityUnits).Within(0.001f));
        }

        [Test]
        public void ThreePocStationsSitOnTheContractGrid()
        {
            Assert.That(PlaceholderVoxelLayout.StationIds, Has.Length.EqualTo(3));
            Assert.That(PlaceholderVoxelLayout.StationIds[0], Is.EqualTo(StationId.Yeongdeungpo));
            Assert.That(PlaceholderVoxelLayout.StationIds[1], Is.EqualTo(StationId.Sindorim));
            Assert.That(PlaceholderVoxelLayout.StationIds[2], Is.EqualTo(StationId.Guro));

            Vector3 yeong = PlaceholderVoxelLayout.StationWorld(StationId.Yeongdeungpo);
            Vector3 sindorim = PlaceholderVoxelLayout.StationWorld(StationId.Sindorim);
            Vector3 guro = PlaceholderVoxelLayout.StationWorld(StationId.Guro);

            float tile = Janseon.Foundation.GenreContract.TileUnityUnits;
            Assert.That((sindorim - yeong).magnitude, Is.EqualTo(4f * tile).Within(0.001f));
            Assert.That((guro - sindorim).magnitude, Is.EqualTo(4f * tile).Within(0.001f));
            Assert.That(yeong.y, Is.EqualTo(0f).Within(0.001f));
        }
    }
}
