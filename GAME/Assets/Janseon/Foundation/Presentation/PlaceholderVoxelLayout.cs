using Janseon.Core;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Programmer-placeholder voxel grammar: 1.5m grid, three POC stations, one actor token.
    /// No generated meshes. No paid 3D backends.
    /// </summary>
    public static class PlaceholderVoxelLayout
    {
        // POC presentation scale (Intent 결정 10 retired the shared tile contract).
        public static float TileSize => 1.5f;

        public static readonly StationId[] StationIds =
        {
            StationId.Yeongdeungpo,
            StationId.Sindorim,
            StationId.Guro,
        };

        public static Vector3 GridToWorld(int x, int y, int z)
        {
            float tile = TileSize;
            return new Vector3(x * tile, y * tile, z * tile);
        }

        public static Vector3 StationWorld(StationId station)
        {
            if (station.Equals(StationId.Yeongdeungpo))
            {
                return GridToWorld(0, 0, 0);
            }

            if (station.Equals(StationId.Sindorim))
            {
                return GridToWorld(4, 0, 0);
            }

            if (station.Equals(StationId.Guro))
            {
                return GridToWorld(8, 0, 0);
            }

            return GridToWorld(0, 0, 0);
        }

        public static Vector3Int WorldToGrid(Vector3 world)
        {
            float tile = TileSize;
            if (tile <= 0f)
            {
                return Vector3Int.zero;
            }

            return new Vector3Int(
                Mathf.RoundToInt(world.x / tile),
                Mathf.RoundToInt(world.y / tile),
                Mathf.RoundToInt(world.z / tile));
        }
    }
}
