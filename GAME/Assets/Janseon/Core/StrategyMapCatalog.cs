using System;

namespace Janseon.Core
{
    /// <summary>
    /// Engine-free mirror of the baked Seoul strategy map manifest
    /// (GAME/Assets/Janseon/Data/StrategyMap/Baked/manifest.json, schema
    /// seoul-strategy-map-v1). Intent 결정 10: the strategy screen is a 3D
    /// heightmap of all Seoul baked offline from verified geography data
    /// (z11 Mapzen GeoTIFF 9 tiles, 2.5x vertical exaggeration, nodata = water).
    /// Values are transcribed from the bake output; re-baking with different
    /// parameters must update this catalog in the same change.
    /// </summary>
    public static class StrategyMapCatalog
    {
        public const string ManifestSchema = "seoul-strategy-map-v1";
        public const int Zoom = 11;
        public const int GridPerChunk = 128;
        public const float VerticalUnitsPerMeter = 0.025f;
        public const float HorizontalUnitsPer3857Meter = 0.001f;

        public const int VerticesPerChunk = 16384;
        public const int FacesPerChunk = 32258;

        public readonly struct ChunkBounds
        {
            public readonly int TileX;
            public readonly int TileY;
            public readonly float MinX;
            public readonly float MaxX;
            public readonly float MinZ;
            public readonly float MaxZ;
            public readonly float MinElevMeters;
            public readonly float MaxElevMeters;

            public ChunkBounds(int tileX, int tileY, float minX, float maxX, float minZ, float maxZ, float minElev, float maxElev)
            {
                TileX = tileX; TileY = tileY;
                MinX = minX; MaxX = maxX; MinZ = minZ; MaxZ = maxZ;
                MinElevMeters = minElev; MaxElevMeters = maxElev;
            }
        }

        // Sorted by (TileX, TileY); transcribed from manifest.json chunks.
        public static readonly ChunkBounds[] Chunks =
        {
            new ChunkBounds(1745, 792, -29.3518f, -9.7839f, -29.3518f, -9.7839f, 0.0f, 231.62f),
            new ChunkBounds(1745, 793, -29.3518f, -9.7839f, -9.7839f, 9.7839f, 0.0f, 273.0f),
            new ChunkBounds(1745, 794, -29.3518f, -9.7839f, 9.7839f, 29.3518f, 0.0f, 449.44f),
            new ChunkBounds(1746, 792, -9.7839f, 9.7839f, -29.3518f, -9.7839f, 8.25f, 782.38f),
            new ChunkBounds(1746, 793, -9.7839f, 9.7839f, -9.7839f, 9.7839f, 0.0f, 606.44f),
            new ChunkBounds(1746, 794, -9.7839f, 9.7839f, 9.7839f, 29.3518f, 22.38f, 593.0f),
            new ChunkBounds(1747, 792, 9.7839f, 29.3518f, -29.3518f, -9.7839f, 7.19f, 668.44f),
            new ChunkBounds(1747, 793, 9.7839f, 29.3518f, -9.7839f, 9.7839f, 0.0f, 651.44f),
            new ChunkBounds(1747, 794, 9.7839f, 29.3518f, 9.7839f, 29.3518f, 15.19f, 488.69f),
        };

        public const float UnionMinX = -29.3518f;
        public const float UnionMaxX = 29.3518f;
        public const float UnionMinZ = -29.3518f;
        public const float UnionMaxZ = 29.3518f;

        public static float MaxElevMeters => 782.38f;

        public static bool ContainsWorldPosition(float x, float z) =>
            x >= UnionMinX && x <= UnionMaxX && z >= UnionMinZ && z <= UnionMaxZ;
    }
}
