using Janseon.Core;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    public sealed class HeightmapTests
    {
        [Test]
        public void Generate_IsDeterministic_ForSameSeedAndLayer()
        {
            Heightmap a = HeightmapApi.Generate(90421, LayerId.B1);
            Heightmap b = HeightmapApi.Generate(90421, LayerId.B1);
            Assert.That(a.Fingerprint(), Is.EqualTo(b.Fingerprint()));
            Assert.That(a.Width, Is.EqualTo(20));
            Assert.That(a.Height, Is.EqualTo(20));
            Assert.That(a.MaxLevel, Is.EqualTo(8));
        }

        [Test]
        public void Generate_DifferentSeeds_ProduceDifferentMaps()
        {
            Heightmap a = HeightmapApi.Generate(90421, LayerId.B1);
            Heightmap b = HeightmapApi.Generate(90422, LayerId.B1);
            Assert.That(a.Fingerprint(), Is.Not.EqualTo(b.Fingerprint()));
        }

        [Test]
        public void MaterialForHeight_UsesWaterSandRockSnowBands()
        {
            Assert.That(HeightmapApi.MaterialForHeight(0, 2), Is.EqualTo(HeightMaterial.Water));
            Assert.That(HeightmapApi.MaterialForHeight(2, 2), Is.EqualTo(HeightMaterial.Water));
            Assert.That(HeightmapApi.MaterialForHeight(3, 2), Is.EqualTo(HeightMaterial.Sand));
            Assert.That(HeightmapApi.MaterialForHeight(4, 2), Is.EqualTo(HeightMaterial.Grass));
            Assert.That(HeightmapApi.MaterialForHeight(5, 2), Is.EqualTo(HeightMaterial.Rock));
            Assert.That(HeightmapApi.MaterialForHeight(7, 2), Is.EqualTo(HeightMaterial.Snow));
        }

        [Test]
        public void MoveCost_IsOnePlusElevationSteps_AndWaterIsImpassable()
        {
            var cells = new int[25];
            for (var i = 0; i < cells.Length; i++)
            {
                cells[i] = 3;
            }

            cells[1] = 5;
            cells[2] = 2;
            var map = new Heightmap(5, 5, 8, 2, 1, LayerId.B1, cells);
            Assert.That(map.MoveCost(new TerrainSampleCoord(0, 0), new TerrainSampleCoord(1, 0)), Is.EqualTo(1 + 2));
            Assert.That(map.MoveCost(new TerrainSampleCoord(1, 0), new TerrainSampleCoord(2, 0)), Is.EqualTo(-1));
            Assert.That(map.MoveCost(new TerrainSampleCoord(0, 0), new TerrainSampleCoord(2, 0)), Is.EqualTo(-1));
        }

        [Test]
        public void B2_FloodsCenterBasinToWaterLevel()
        {
            Heightmap surface = HeightmapApi.Generate(90421, LayerId.B1);
            Heightmap flooded = HeightmapApi.Generate(90421, LayerId.B2);
            Assert.That(flooded.Fingerprint(), Is.Not.EqualTo(surface.Fingerprint()));
            Assert.That(flooded.IsWater(flooded.Width / 2, flooded.Height / 2), Is.True);
        }
    }
}
