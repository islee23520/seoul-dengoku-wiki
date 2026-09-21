using System.Collections.Generic;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Serialized references to the baked Seoul strategy map assets (decision 10).
    /// Authored as a ScriptableObject in Assets/Janseon/Data/StrategyMap/ and
    /// injected through the Foundation VContainer scope — no path lookups at runtime.
    /// Re-baking assets requires updating this catalog in the same change.
    /// </summary>
    [CreateAssetMenu(fileName = "StrategyMapAssetCatalog", menuName = "Janseon/Strategy Map Asset Catalog")]
    public sealed class StrategyMapAssetCatalog : ScriptableObject
    {
        [Header("Terrain chunks — 9 z11 meshes (sorted by tile x, y)")]
        [SerializeField] private Mesh[] chunkMeshes = System.Array.Empty<Mesh>();

        [Header("Terrain textures — 9 landcover+region albedo (sorted by tile x, y)")]
        [SerializeField] private Texture2D[] chunkTextures = System.Array.Empty<Texture2D>();

        [Header("Building binaries — 9 instancing data (.bytes, sorted by tile x, y)")]
        [SerializeField] private TextAsset[] buildingBinaries = System.Array.Empty<TextAsset>();

        [Header("Landmark prefabs — optional reviewed prefabs (sorted by slug)")]
        [SerializeField] private GameObject[] landmarkPrefabs = System.Array.Empty<GameObject>();

        [Header("Landmark manifest — positions in world units")]
        [SerializeField] private TextAsset landmarkManifest;

        public IReadOnlyList<Mesh> ChunkMeshes => chunkMeshes;
        public IReadOnlyList<Texture2D> ChunkTextures => chunkTextures;
        public IReadOnlyList<TextAsset> BuildingBinaries => buildingBinaries;
        public IReadOnlyList<GameObject> LandmarkPrefabs => landmarkPrefabs;
        public TextAsset LandmarkManifest => landmarkManifest;

    }
}
